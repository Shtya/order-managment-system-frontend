"use client";

import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileDown, FileText, Info, Loader2, Package, ScanLine, Save, ShieldX, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "@/components/atoms/Pageheader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CARRIERS, STATUS, deductInventoryForShipment, getDocumentSummary, getOrderItemCount } from "./data";
import ScanBar from "../atoms/ScanBar";
import { buildOrderOverviewCards, buildOrderSummarySection, openPdfDocument } from "../utils/pdf";
import { cn } from "@/utils/cn";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

function buildOutgoingDocumentBody({ orders, carrier, employee, createdAt, title, formatCurrency, currency }) {
  const summary = getDocumentSummary(orders);
  const orderSections = orders.map((order) => {
    const productRows = (order.products || []).map((product) => `
      <tr>
        <td class="mono">${product.sku}</td>
        <td>${product.name}</td>
        <td>${product.shelf || "غير محدد"}</td>
        <td>${product.requestedQty}</td>
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
          <span class="badge badge-success">${carrier}</span>
        </div>
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
          ${buildOrderOverviewCards(order, { orderValue: "قيمة الطلب", orderSummary: "ملخص الطلب", customer: "العميل", city: "المدينة", itemsWord: "قطعة" }, formatCurrency, currency)}
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>المنتج</th>
                  <th>الموقع</th>
                  <th>الكمية</th>
                  <th>السعر</th>
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
      <p>شركة الشحن: ${carrier} · الموظف: ${employee} · التاريخ: ${createdAt}</p>
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

    <section class="signature">
      <h2 class="section-title">تأكيد الاستلام</h2>
      <p style="margin: 0; color: #64748b; font-size: 13px;">أقر باستلام الطلبات المدرجة في هذا الملف وتحويل مسؤوليتها إلى شركة الشحن.</p>
      <div class="signature-grid">
        <div class="signature-field">اسم مندوب شركة الشحن</div>
        <div class="signature-field">التوقيع</div>
        <div class="signature-field">التاريخ والوقت</div>
      </div>
    </section>
  `;
}

function buildWrongScanBody({ logs, carrier, employee, createdAt, title }) {
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
      <p>شركة الشحن: ${carrier} · الموظف: ${employee} · التاريخ: ${createdAt}</p>
    </section>

    <section class="surface">
      <div class="summary-strip">
        <div class="summary-box"><span>إجمالي المحاولات الفاشلة</span><b>${logs.length}</b></div>
        <div class="summary-box"><span>شركة الشحن</span><b>${carrier}</b></div>
        <div class="summary-box"><span>الموظف</span><b>${employee}</b></div>
        <div class="summary-box"><span>التاريخ</span><b>${createdAt}</b></div>
      </div>
    </section>

    <section class="surface">
      <h2 class="section-title">تفاصيل المحاولات الفاشلة</h2>
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

function MiniStat({ label, value, tone }) {
  return <div className={`rounded-3xl border p-4 ${tone}`}><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-black text-foreground">{value}</p></div>;
}

function RejectDialog({ open, onClose, orderCode, onConfirm, t }) {
  const [reason, setReason] = useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl p-0 " dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground"><ShieldX size={18} className="text-red-500" />{t("reject.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 py-6">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-bold text-muted-foreground">{t("fields.orderCode")}</p>
            <p className="mt-1 font-mono text-sm font-black text-foreground">{orderCode}</p>
          </div>
          <div>
            <Label className="mb-2 block text-sm font-black text-foreground">{t("reject.reason")}</Label>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="rounded-2xl" placeholder={t("reject.placeholder")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t("actions.cancel")}</Button>
            <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>{t("actions.reject")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScanOutgoingSubtab({ orders, updateOrder, pushOp, rejectOrder, inventory, updateInventory, addDeliveryFile, t }) {
  const preparedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.PREPARED), [orders]);
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS.find((carrier) => preparedOrders.some((order) => order.carrier === carrier)) || CARRIERS[0] || "");
  const [scanInput, setScanInput] = useState("");
  const [scannedOrders, setScannedOrders] = useState([]);
  const [wrongScans, setWrongScans] = useState(0);
  const [wrongLogs, setWrongLogs] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rejectTarget, setRejectTarget] = useState("");
  const scanRef = useRef(null);

  const availableOrders = useMemo(() => preparedOrders.filter((order) => !selectedCarrier || order.carrier === selectedCarrier), [preparedOrders, selectedCarrier]);

  const resetLocalState = (carrier) => {
    setSelectedCarrier(carrier);
    setScannedOrders([]);
    setWrongScans(0);
    setWrongLogs([]);
    setFeedback(null);
    setScanInput("");
  };

  const handleScan = () => {
    const code = scanInput.trim();
    setScanInput("");
    if (!code) return;

    const now = new Date().toLocaleTimeString("ar-SA");

    if (!/^[A-Za-z0-9-]{3,}$/.test(code)) {
      setWrongScans((current) => current + 1);
      setWrongLogs((current) => [...current, { code, reason: t("scan.invalidBarcode"), time: now }]);
      setFeedback({ success: false, message: t("scan.invalidBarcode") });
      return;
    }

    if (scannedOrders.some((order) => order.code === code)) {
      setWrongScans((current) => current + 1);
      setWrongLogs((current) => [...current, { code, reason: t("scan.duplicate"), time: now }]);
      setFeedback({ success: false, message: t("scan.duplicate") });
      return;
    }

    const order = availableOrders.find((item) => item.code === code);
    if (!order) {
      setWrongScans((current) => current + 1);
      setWrongLogs((current) => [...current, { code, reason: t("scan.notFound"), time: now }]);
      setFeedback({ success: false, message: t("scan.notFound") });
      return;
    }

    setScannedOrders((current) => [...current, order]);
    setFeedback({ success: true, message: t("scan.success", { code }) });
    window.setTimeout(() => scanRef.current?.focus(), 60);
  };

  const handleSave = async () => {
    if (scannedOrders.length === 0) return;
    setSaving(true);

    try {
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      let nextInventory = inventory;
      scannedOrders.forEach((order, index) => {
        updateOrder(order.code, { status: STATUS.SHIPPED, shippedAt: now });
        nextInventory = deductInventoryForShipment(order.products, nextInventory);
        pushOp({
          id: `OP-${Date.now()}-${index}`,
          operationType: "SHIP_ORDER",
          orderCode: order.code,
          carrier: selectedCarrier,
          employee: "System",
          result: "SUCCESS",
          details: t("operations.shipped", { carrier: selectedCarrier }),
          createdAt: now,
        });
      });
      updateInventory(nextInventory);

      addDeliveryFile({
        id: `DEL-${Date.now()}`,
        carrier: selectedCarrier,
        type: "outgoing",
        orderCodes: scannedOrders.map((order) => order.code),
        createdAt: now,
        createdBy: "System",
        filename: `delivery_${selectedCarrier}_${now.slice(0, 10).replace(/-/g, "")}.pdf`,
        ordersSnapshot: scannedOrders,
        wrongScanLogs: wrongLogs,
      });

      setScannedOrders([]);
      setWrongScans(0);
      setWrongLogs([]);
      setFeedback({ success: true, message: t("scan.saved") });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = (reason) => {
    if (!rejectTarget) return;
    rejectOrder(rejectTarget, { reason, stage: "outgoing" });
    setScannedOrders((current) => current.filter((order) => order.code !== rejectTarget));
    setRejectTarget("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-border main-card p-4 shadow-sm md:p-5">
        <ScanBar
          carriers={CARRIERS}
          ordersForCarrier={preparedOrders}
          showCarrier
          selectedCarrier={selectedCarrier}
          onCarrierChange={resetLocalState}
          scanInput={scanInput}
          onScanChange={setScanInput}
          onScan={handleScan}
          lastScanMsg={feedback}
          scanRef={scanRef}
          placeholder={t("scan.placeholder")}
          label={t("scan.label")}
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <MiniStat label={t("scan.scannedOrders")} value={scannedOrders.length} tone="border-emerald-200 bg-emerald-50" />
          <MiniStat label={t("scan.wrongScans")} value={wrongScans} tone={wrongScans > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"} />
        </div>
      </div>

      <div className="rounded-[28px] border border-border main-card p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-foreground">{t("scan.ordersTitle", { carrier: selectedCarrier })}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("scan.ordersSubtitle")}</p>
          </div>
          <Button onClick={handleSave} disabled={scannedOrders.length === 0 || saving} className="rounded-2xl px-4 py-2 text-sm font-black">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span className="ms-2">{saving ? t("actions.saving") : t("actions.confirmShipment")}</span>
          </Button>
        </div>

        <div className="space-y-3">
          {availableOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm font-bold text-muted-foreground">{t("scan.emptyTitle")}</div>
          ) : (
            availableOrders.map((order) => {
              const scanned = scannedOrders.some((item) => item.code === order.code);
              return (
                <div key={order.code} className={cn("rounded-3xl border p-4", scanned ? "border-emerald-200 bg-emerald-50" : "border-border bg-background")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-black text-foreground">{order.code}</p>
                        {scanned ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">{t("scan.shipmentReady")}</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{order.customer} · {order.city}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-black text-muted-foreground">{getOrderItemCount(order)} {t("common.itemsWord")}</span>
                      <button type="button" onClick={() => setRejectTarget(order.code)} className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition-colors hover:bg-red-600 hover:text-white">{t("actions.reject")}</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <RejectDialog open={!!rejectTarget} onClose={() => setRejectTarget("")} orderCode={rejectTarget} onConfirm={handleReject} t={t} />
    </div>
  );
}

function OutgoingFilesSubtab({ deliveryFiles, orders, t }) {
  const { formatCurrency, currency } = usePlatformSettings();
  const [carrier, setCarrier] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return deliveryFiles.filter((file) => {
      if (carrier !== "all" && file.carrier !== carrier) return false;
      if (query && ![file.id, file.carrier, file.filename].some((value) => String(value || "").toLowerCase().includes(query))) return false;
      return true;
    });
  }, [carrier, deliveryFiles, search]);

  const handleOpenFile = (file) => {
    const snapshot = file.ordersSnapshot || orders.filter((order) => file.orderCodes.includes(order.code));
    openPdfDocument({
      title: t("files.deliveryPdfTitle"),
      filename: file.filename,
      body: buildOutgoingDocumentBody({ orders: snapshot, carrier: file.carrier, employee: file.createdBy, createdAt: file.createdAt, title: t("files.deliveryPdfTitle"), formatCurrency, currency }),
    });
  };

  const handleOpenWrongLog = (file) => {
    const logs = file.wrongScanLogs || [];
    openPdfDocument({
      title: t("files.wrongLogTitle"),
      filename: `${file.id}_wrong_scans.pdf`,
      body: buildWrongScanBody({ logs, carrier: file.carrier, employee: file.createdBy, createdAt: file.createdAt, title: t("files.wrongLogTitle") }),
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
      cell: (row) => <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">{row.carrier}</span>,
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
      key: "createdBy",
      header: t("files.fields.createdBy"),
      cell: (row) => <span className="text-sm font-bold text-foreground">{row.createdBy}</span>,
    },
    {
      key: "actions",
      header: t("fields.actions"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => handleOpenFile(row)} className="rounded-full border border-primary/20 bg-primary/8 px-3 py-2 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{t("files.openPdf")}</button>
          <button type="button" onClick={() => handleOpenWrongLog(row)} className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition-colors hover:bg-red-600 hover:text-white">{t("files.openWrongLog")}</button>
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
            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
              <SelectValue placeholder={t("filters.allCarriers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
              {CARRIERS.map((carrierOption) => (
                <SelectItem key={carrierOption} value={carrierOption}>{carrierOption}</SelectItem>
              ))}
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

export default function OutgoingTab({ orders, updateOrder, pushOp, rejectOrder, inventory, updateInventory, deliveryFiles, addDeliveryFile, subtab, setSubtab }) {
  const t = useTranslations("warehouse.outgoing");
  const preparedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.PREPARED), [orders]);
  const shippedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.SHIPPED), [orders]);

  const today = new Date().toISOString().slice(0, 10);
  const shippedToday = shippedOrders.filter((order) => order.shippedAt?.startsWith(today)).length;

  const stats = [
    { id: "prepared", name: t("stats.readyToShip"), value: preparedOrders.length, icon: Package, color: "#2563eb", sortOrder: 0 },
    { id: "today", name: t("stats.shippedToday"), value: shippedToday, icon: Truck, color: "#10b981", sortOrder: 1 },
    { id: "total", name: t("stats.totalShipped"), value: shippedOrders.length, icon: CheckCircle2, color: "#8b5cf6", sortOrder: 2 },
    { id: "files", name: t("stats.deliveryFiles"), value: deliveryFiles.length, icon: FileText, color: "#f59e0b", sortOrder: 3 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.outgoing") },
        ]}
        buttons={<Button_ size="sm" label={t("actions.help")} variant="ghost" onClick={() => { }} icon={<Info size={16} />} />}
        stats={stats}
        items={[
          { id: "scan", label: t("tabs.scan"), count: preparedOrders.length, icon: ScanLine },
          { id: "files", label: t("tabs.files"), count: deliveryFiles.length, icon: FileDown },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div key={subtab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
          {subtab === "scan" ? (
            <ScanOutgoingSubtab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              rejectOrder={rejectOrder}
              inventory={inventory}
              updateInventory={updateInventory}
              addDeliveryFile={addDeliveryFile}
              t={t}
            />
          ) : null}

          {subtab === "files" ? <OutgoingFilesSubtab deliveryFiles={deliveryFiles} orders={orders} t={t} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
