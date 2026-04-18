"use client";

import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileDown, FileText, Info, Loader2, Package, RefreshCw, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";

import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "@/components/atoms/Pageheader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARRIERS, PRODUCT_CONDITIONS, STATUS, getDocumentSummary, getOrderItemCount, returnInventoryFromCarrier } from "./data";
import ScanBar from "../atoms/ScanBar";
import { buildOrderOverviewCards, buildOrderSummarySection, openPdfDocument } from "../utils/pdf";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

function buildReturnDocumentBody({ orders, createdAt, employee, title, formatCurrency, currency }) {
  const summary = getDocumentSummary(orders);
  const orderSections = orders.map((order) => {
    const productRows = (order.products || []).map((product) => `
      <tr>
        <td class="mono">${product.sku}</td>
        <td>${product.name}</td>
        <td>${product.requestedQty}</td>
        <td>${product.condition || "سليم"}</td>
        <td>${formatCurrency ? formatCurrency((Number(product.price) || 0) * (Number(product.requestedQty) || 0)) : `${(Number(product.price) || 0) * (Number(product.requestedQty) || 0)} ${currency}`}</td>
      </tr>
    `).join("");

    return `
      <section class="order-card">
        <div class="order-card-head">
          <div>
            <h3 class="order-title mono">${order.code}</h3>
            <p class="order-subtitle">${order.customer} · ${order.city}</p>
          </div>
          <span class="badge badge-warning">${order.carrier || "بدون شركة"}</span>
        </div>
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
          ${buildOrderOverviewCards(order, { customer: "العميل", city: "المدينة", orderValue: "قيمة الطلب", orderSummary: "ملخص الطلب", itemsWord: "قطعة" }, formatCurrency, currency)}
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>المنتج</th>
                  <th>الكمية المرتجعة</th>
                  <th>الحالة</th>
                  <th>القيمة</th>
                </tr>
              </thead>
              <tbody>${productRows}</tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }).join("");

  return `
    <section class="hero">
      <h1>${title}</h1>
      <p>الموظف: ${employee} · التاريخ: ${createdAt}</p>
    </section>

    <section class="surface">
      <div class="summary-strip">
        <div class="summary-box"><span>إجمالي الطلبات</span><b>${orders.length}</b></div>
        <div class="summary-box"><span>إجمالي عدد الـ SKU</span><b>${summary.totalSkus}</b></div>
        <div class="summary-box"><span>إجمالي الكميات</span><b>${summary.totalItems}</b></div>
        <div class="summary-box"><span>القيمة الإجمالية</span><b>${formatCurrency ? formatCurrency(summary.totalValue) : `${summary.totalValue} ${currency}`}</b></div>
      </div>
    </section>

    ${orderSections}
    ${buildOrderSummarySection(orders, { title: "الملخص النهائي", totalOrders: "إجمالي الطلبات", totalSkus: "إجمالي عدد الـ SKU", totalItems: "إجمالي الكميات", totalValue: "القيمة الإجمالية" }, formatCurrency, currency)}
  `;
}

function buildWrongScanBody({ logs, createdAt, employee, title }) {
  const rows = logs.map((log, index) => `
    <tr>
      <td>${index + 1}</td>
      <td class="mono">${log.code}</td>
      <td><span class="badge badge-danger">${log.reason}</span></td>
      <td>${log.time}</td>
    </tr>
  `).join("");

  return `
    <section class="hero hero-danger">
      <h1>${title}</h1>
      <p>الموظف: ${employee} · التاريخ: ${createdAt}</p>
    </section>
    <section class="surface">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>الكود</th>
              <th>السبب</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function ReturnItemRow({ item, selection, onToggle, onQtyChange, onConditionChange, t }) {
  const maxQty = Math.max((Number(item.requestedQty) || 0) - (Number(item.returnedQty) || 0), 0);
  const checked = selection.selected;
  const disabled = maxQty === 0;

  return (
    <div className="rounded-3xl border border-border bg-background p-4">
      <div className="flex items-start gap-4">
        <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onToggle(item.sku, !!value)} className="mt-1" />
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="truncate text-sm font-black text-foreground">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.sku} · {item.shelf}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">{disabled ? t("scan.notAvailable") : t("scan.availableQty", { count: maxQty })}</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("scan.returnQty")}</label>
              <Input type="number" min={1} max={Math.max(maxQty, 1)} value={selection.qty} disabled={!checked || disabled} onChange={(event) => onQtyChange(item.sku, Number(event.target.value) || 1)} className="rounded-2xl" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("scan.itemCondition")}</label>
              <Select value={selection.condition} onValueChange={(value) => onConditionChange(item.sku, value)} disabled={!checked || disabled}>
                <SelectTrigger className="h-10 rounded-2xl border-border bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CONDITIONS.map((condition) => (
                    <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReturnFilesSubtab({ returnFiles, orders, t }) {
  const { formatCurrency, currency } = usePlatformSettings();
  const [carrier, setCarrier] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return returnFiles.filter((file) => {
      if (carrier !== "all" && file.carrier !== carrier) return false;
      if (query && ![file.id, file.filename, file.createdBy].some((value) => String(value || "").toLowerCase().includes(query))) return false;
      return true;
    });
  }, [carrier, returnFiles, search]);

  const openReturnPdf = (file) => {
    const snapshot = file.ordersSnapshot || orders.filter((order) => file.orderCodes.includes(order.code));
    openPdfDocument({
      title: t("files.returnPdfTitle"),
      filename: file.filename,
      body: buildReturnDocumentBody({ orders: snapshot, createdAt: file.createdAt, employee: file.createdBy, title: t("files.returnPdfTitle"), formatCurrency, currency }),
    });
  };

  const openWrongPdf = (file) => {
    const logs = file.wrongScanLogs || [];
    openPdfDocument({
      title: t("files.wrongLogTitle"),
      filename: `${file.id}_wrong_scans.pdf`,
      body: buildWrongScanBody({ logs, createdAt: file.createdAt, employee: file.createdBy, title: t("files.wrongLogTitle") }),
    });
  };

  const columns = useMemo(() => [
    // {
    //   key: "id",
    //   header: t("files.fields.fileCode"),
    //   cell: (row) => <span className="font-mono text-sm font-black text-primary">{row.id}</span>,
    // },
    {
      key: "carrier",
      header: t("fields.carrier"),
      cell: (row) => <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">{row.carrier || t("common.notSpecified")}</span>,
    },
    {
      key: "orders",
      header: t("files.fields.ordersSummary"),
      cell: (row) => {
        const snapshot = row.ordersSnapshot || orders.filter((order) => row.orderCodes.includes(order.code));
        const itemCount = snapshot.reduce((sum, order) => sum + getOrderItemCount(order), 0);
        return (
          <div className="space-y-1 text-sm font-bold text-foreground">
            <p>{t("files.ordersCount", { count: snapshot.length })}</p>
            <p className="text-muted-foreground">{t("files.itemsCount", { count: itemCount })}</p>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: t("files.fields.createdAt"),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.createdAt}</span>,
    },
    {
      key: "actions",
      header: t("fields.actions"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => openReturnPdf(row)} className="rounded-full border border-primary/20 bg-primary/8 px-3 py-2 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{t("files.openPdf")}</button>
          <button type="button" onClick={() => openWrongPdf(row)} className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition-colors hover:bg-red-600 hover:text-white">{t("files.openWrongLog")}</button>
        </div>
      ),
    },
  ], [orders, t]);

  return (
    <Table
      searchValue={search}
      onSearchChange={setSearch}
      onSearch={() => { }}
      labels={{
        searchPlaceholder: t("files.search"),
        filter: t("common.filter"),
        apply: t("common.apply"),
        total: t("common.total"),
        limit: t("common.limit"),
        emptyTitle: t("files.emptyTitle"),
        emptySubtitle: "",
      }}
      actions={[]}
      hasActiveFilters={carrier !== "all"}
      onApplyFilters={() => { }}
      filters={
        <FilterField label={t("fields.carrier")}>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filters.allCarriers")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
              {CARRIERS.map((carrierOption) => <SelectItem key={carrierOption} value={carrierOption}>{carrierOption}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
      }
      columns={columns}
      data={filtered}
      isLoading={false}
      pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
      onPageChange={({ page: nextPage, per_page: perPage }) => setPage({ current_page: nextPage, per_page: perPage })}
    />
  );
}

function ScanReturnSubtab({ orders, updateOrder, pushOp, inventory, updateInventory, addReturnFile, t }) {
  const { formatCurrency } = usePlatformSettings();
  const candidateOrders = useMemo(() => orders.filter((order) => [STATUS.SHIPPED, STATUS.PARTIALLY_RETURNED].includes(order.status)), [orders]);
  const [scanInput, setScanInput] = useState("");
  const [currentOrderCode, setCurrentOrderCode] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wrongScanLogs, setWrongScanLogs] = useState([]);
  const scanRef = useRef(null);

  const currentOrder = useMemo(() => candidateOrders.find((order) => order.code === currentOrderCode) || null, [candidateOrders, currentOrderCode]);
  const initialSelection = useMemo(() => {
    if (!currentOrder) return {};
    return Object.fromEntries((currentOrder.products || []).map((product) => {
      const maxQty = Math.max((Number(product.requestedQty) || 0) - (Number(product.returnedQty) || 0), 0);
      return [product.sku, { selected: false, qty: Math.min(1, maxQty || 1), condition: PRODUCT_CONDITIONS[0] }];
    }));
  }, [currentOrder]);
  const [selectedItems, setSelectedItems] = useState({});

  React.useEffect(() => {
    setSelectedItems(initialSelection);
  }, [initialSelection]);

  const handleScan = () => {
    const code = scanInput.trim();
    setScanInput("");
    if (!code) return;

    const now = new Date().toLocaleTimeString("ar-SA");

    if (!/^[A-Za-z0-9-]{3,}$/.test(code)) {
      setWrongScanLogs((current) => [...current, { code, reason: t("scan.invalidBarcode"), time: now }]);
      setFeedback({ success: false, message: t("scan.invalidBarcode") });
      return;
    }

    const foundOrder = candidateOrders.find((order) => order.code === code);
    if (!foundOrder) {
      setWrongScanLogs((current) => [...current, { code, reason: t("scan.orderNotFound"), time: now }]);
      setFeedback({ success: false, message: t("scan.orderNotFound") });
      return;
    }

    if ((foundOrder.products || []).every((product) => (Number(product.returnedQty) || 0) >= (Number(product.requestedQty) || 0))) {
      setWrongScanLogs((current) => [...current, { code, reason: t("scan.alreadyReturned"), time: now }]);
      setFeedback({ success: false, message: t("scan.alreadyReturned") });
      return;
    }

    setCurrentOrderCode(code);
    setFeedback({ success: true, message: t("scan.orderLoaded", { code }) });
    window.setTimeout(() => scanRef.current?.focus(), 60);
  };

  const toggleItem = (sku, checked) => {
    setSelectedItems((current) => ({
      ...current,
      [sku]: {
        ...current[sku],
        selected: checked,
      },
    }));
  };

  const changeQty = (sku, qty) => {
    const item = currentOrder?.products?.find((product) => product.sku === sku);
    const maxQty = Math.max((Number(item?.requestedQty) || 0) - (Number(item?.returnedQty) || 0), 0);
    const safeQty = Math.min(Math.max(qty, 1), maxQty || 1);
    setSelectedItems((current) => ({ ...current, [sku]: { ...current[sku], qty: safeQty } }));
  };

  const changeCondition = (sku, condition) => {
    setSelectedItems((current) => ({ ...current, [sku]: { ...current[sku], condition } }));
  };

  const handleProcessReturn = async () => {
    if (!currentOrder) return;

    const selectedProducts = (currentOrder.products || [])
      .filter((product) => selectedItems[product.sku]?.selected)
      .map((product) => ({
        ...product,
        requestedQty: Number(selectedItems[product.sku]?.qty) || 1,
        condition: selectedItems[product.sku]?.condition || PRODUCT_CONDITIONS[0],
      }));

    if (selectedProducts.length === 0) {
      setFeedback({ success: false, message: t("scan.selectAtLeastOneItem") });
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const updatedProducts = (currentOrder.products || []).map((product) => {
        const returned = selectedProducts.find((item) => item.sku === product.sku);
        if (!returned) return product;
        const nextReturnedQty = (Number(product.returnedQty) || 0) + (Number(returned.requestedQty) || 0);
        return {
          ...product,
          returnedQty: nextReturnedQty,
          lastReturnCondition: returned.condition,
        };
      });

      const allReturned = updatedProducts.every((product) => (Number(product.returnedQty) || 0) >= (Number(product.requestedQty) || 0));
      updateInventory(returnInventoryFromCarrier(selectedProducts, inventory));
      updateOrder(currentOrder.code, {
        status: allReturned ? STATUS.RETURNED : STATUS.PARTIALLY_RETURNED,
        returnedAt: now,
        products: updatedProducts,
        carrier: allReturned ? "" : currentOrder.carrier,
        trackingCode: allReturned ? "" : currentOrder.trackingCode,
      });
      pushOp({
        id: `OP-${Date.now()}`,
        operationType: "RETURN_ORDER",
        orderCode: currentOrder.code,
        carrier: currentOrder.carrier || "-",
        employee: "System",
        result: "SUCCESS",
        details: t("operations.returned"),
        createdAt: now,
      });
      addReturnFile({
        id: `RET-${Date.now()}`,
        carrier: currentOrder.carrier || "بدون شركة",
        type: "incoming",
        orderCodes: [currentOrder.code],
        createdAt: now,
        createdBy: "System",
        filename: `return_${currentOrder.code}_${now.slice(0, 10).replace(/-/g, "")}.pdf`,
        ordersSnapshot: [{
          ...currentOrder,
          returnedAt: now,
          products: selectedProducts,
        }],
        wrongScanLogs,
      });

      setFeedback({ success: true, message: t("scan.returnSaved") });
      setCurrentOrderCode("");
      setSelectedItems({});
      setWrongScanLogs([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-border main-card p-4 shadow-sm md:p-5">
        <ScanBar
          showCarrier={false}
          scanInput={scanInput}
          onScanChange={setScanInput}
          onScan={handleScan}
          lastScanMsg={feedback}
          scanRef={scanRef}
          placeholder={t("scan.placeholder")}
          label={t("scan.label")}
        />
      </div>

      {currentOrder ? (
        <div className="space-y-4 rounded-[28px] border border-border main-card p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-lg font-black text-foreground">{currentOrder.code}</h3>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">{t("scan.currentReturn")}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{currentOrder.customer} · {currentOrder.city} · {currentOrder.area}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">{currentOrder.carrier || t("common.notSpecified")}</span>
          </div>

          <div className="rounded-3xl border border-border bg-background p-4">
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              {[
                [t("fields.customer"), currentOrder.customer],
                [t("fields.phone"), currentOrder.phone],
                [t("fields.orderSummary"), `${currentOrder.products.length} SKU / ${getOrderItemCount(currentOrder)} ${t("common.itemsWord")}`],
                [t("fields.total"), formatCurrency(currentOrder.total)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border main-card p-4">
                  <p className="mb-1 text-xs font-bold text-muted-foreground">{label}</p>
                  <p className="text-sm font-black text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {(currentOrder.products || []).map((product) => (
                <ReturnItemRow
                  key={`${currentOrder.code}-${product.sku}`}
                  item={product}
                  selection={selectedItems[product.sku] || { selected: false, qty: 1, condition: PRODUCT_CONDITIONS[0] }}
                  onToggle={toggleItem}
                  onQtyChange={changeQty}
                  onConditionChange={changeCondition}
                  t={t}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setCurrentOrderCode("")}>{t("actions.clearCurrent")}</Button>
            <Button onClick={handleProcessReturn} disabled={saving} className="rounded-2xl px-4 py-2 text-sm font-black">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span className="ms-2">{saving ? t("actions.processing") : t("actions.processReturn")}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-border main-card px-4 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/8 text-primary"><RefreshCw size={28} /></div>
          <h3 className="mt-4 text-lg font-black text-foreground">{t("scan.emptyTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("scan.emptyDescription")}</p>
        </div>
      )}
    </div>
  );
}

export default function ReturnsTab({ orders, updateOrder, pushOp, inventory, updateInventory, returnFiles, addReturnFile, subtab, setSubtab }) {
  const t = useTranslations("warehouse.returns");
  const shippedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.SHIPPED), [orders]);
  const today = new Date().toISOString().slice(0, 10);

  const stats = subtab === "files"
    ? [
      { id: "files", name: t("stats.files"), value: returnFiles.length, icon: FileText, color: "#f59e0b", sortOrder: 0 },
      { id: "today", name: t("stats.returnedToday"), value: orders.filter((order) => order.returnedAt?.startsWith(today)).length, icon: RefreshCw, color: "#10b981", sortOrder: 1 },
    ]
    : [];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.returns") },
        ]}
        buttons={<Button_ size="sm" label={t("actions.help")} variant="ghost" onClick={() => { }} icon={<Info size={16} />} />}
        stats={stats}
        items={[
          { id: "scan", label: t("tabs.scan"), count: shippedOrders.length, icon: ScanLine },
          { id: "files", label: t("tabs.files"), count: returnFiles.length, icon: FileDown },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div key={subtab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
          {subtab === "scan" ? (
            <ScanReturnSubtab orders={orders} updateOrder={updateOrder} pushOp={pushOp} inventory={inventory} updateInventory={updateInventory} addReturnFile={addReturnFile} t={t} />
          ) : null}
          {subtab === "files" ? <ReturnFilesSubtab returnFiles={returnFiles} orders={orders} t={t} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
