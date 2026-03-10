"use client";

import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileDown, Info, Package, Printer, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "@/components/atoms/Pageheader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CARRIERS, STATUS, getOrderItemCount } from "./data";

function CarrierBadge({ carrier }) {
  const tone = {
    ARAMEX: "bg-red-50 text-red-700 border-red-200",
    SMSA: "bg-blue-50 text-blue-700 border-blue-200",
    DHL: "bg-yellow-50 text-yellow-700 border-yellow-200",
    BOSTA: "bg-orange-50 text-orange-700 border-orange-200",
  }[carrier] || "bg-muted text-muted-foreground border-border";

  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${tone}`}><Truck size={11} />{carrier}</span>;
}

function OrderDetailsDialog({ order, open, onClose, t }) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl bg-white p-0 dark:bg-slate-900" dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
            <Package size={20} className="text-primary" />
            {t("details.title", { code: order.code })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              [t("fields.customer"), order.customer],
              [t("fields.phone"), order.phone],
              [t("fields.city"), order.city],
              [t("fields.region"), order.area],
              [t("fields.store"), order.store],
              [t("fields.carrier"), order.carrier],
              [t("fields.trackingCode"), order.trackingCode || t("common.none")],
              [t("fields.total"), `${order.total} ${t("common.currency")}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-bold text-muted-foreground">{label}</p>
                <p className="text-sm font-black text-foreground">{value || t("common.none")}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <h4 className="text-sm font-black text-foreground">{t("details.products")}</h4>
            </div>
            <div className="divide-y divide-border">
              {(order.products || []).map((product) => (
                <div key={`${order.code}-${product.sku}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{product.shelf}</p>
                  </div>
                  <code className="rounded-xl bg-muted px-2 py-1 text-[11px] font-black text-muted-foreground">{product.sku}</code>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">×{product.requestedQty}</span>
                </div>
              ))}
            </div>
          </div>

          {order.notes ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{order.notes}</div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrintPreviewModal({ open, onClose, orders, onConfirm, t }) {
  const previewRef = useRef(null);

  const handlePrint = () => {
    const content = previewRef.current?.innerHTML;
    if (!content) return;

    const win = window.open("", "_blank", "width=1000,height=800");
    if (!win) return;

    win.document.write(`
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${t("printPreview.title", { count: orders.length })}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 24px; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #ffffff; color: #0f172a; }
            .sheet { page-break-after: always; padding-bottom: 24px; }
            .label { border: 2px solid #111827; border-radius: 20px; padding: 20px; max-width: 460px; margin: 0 auto; }
            .label-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
            .pill { border: 1px solid #e5e7eb; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 800; }
            .row { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; }
            .key { font-size: 11px; color: #64748b; }
            .value { font-size: 12px; font-weight: 700; color: #111827; text-align: left; }
            .code { margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 14px; background: #f8fafc; padding: 10px; font-family: ui-monospace, monospace; font-weight: 800; text-align: center; }
            .barcode { margin-top: 10px; height: 42px; border-radius: 8px; background: repeating-linear-gradient(90deg, #111827 0 2px, #ffffff 2px 5px); }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);

    onConfirm(orders.map((order) => order.code));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl bg-white p-0 dark:bg-slate-900" dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
            <Printer size={20} className="text-primary" />
            {t("printPreview.title", { count: orders.length })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div ref={previewRef} className="grid gap-4 md:grid-cols-2">
            {orders.map((order) => (
              <div key={order.code} className="sheet">
                <div className="label rounded-[22px] border-2 border-slate-900 bg-white p-5">
                  <div className="label-head flex items-center justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <p className="font-mono text-lg font-black text-foreground">{order.code}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{order.customer}</p>
                    </div>
                    <span className="pill rounded-full bg-muted px-3 py-1 text-xs font-black text-foreground">{order.carrier}</span>
                  </div>

                  <div className="space-y-2 pt-4 text-sm">
                    {[
                      [t("fields.phone"), order.phone],
                      [t("fields.city"), order.city],
                      [t("fields.region"), order.area || t("common.none")],
                      [t("fields.address"), order.address || t("common.none")],
                      [t("fields.store"), order.store],
                      [t("fields.paymentType"), order.paymentType === "COD" ? t("common.cod") : t("common.paid")],
                    ].map(([key, value]) => (
                      <div key={key} className="row flex items-center justify-between gap-3">
                        <span className="key text-xs text-muted-foreground">{key}</span>
                        <span className="value font-bold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="code mt-4 rounded-2xl border border-border bg-muted px-4 py-3 text-center font-mono text-sm font-black text-foreground">
                    {order.trackingCode || order.code}
                  </div>
                  <div className="barcode mt-3 h-10 rounded-xl bg-[repeating-linear-gradient(90deg,#111827_0_2px,#ffffff_2px_5px)]" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button onClick={handlePrint}>{t("printPreview.printNow")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LabelsTable({ orders, filters, setFilters, selectedCodes, setSelectedCodes, search, setSearch, onPrint, onPrepareSelection, t, statusMode }) {
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  const stores = useMemo(() => [...new Set(orders.map((order) => order.store).filter(Boolean))], [orders]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (filters.carrier !== "all" && order.carrier !== filters.carrier) return false;
      if (filters.store !== "all" && order.store !== filters.store) return false;
      if (filters.date) {
        const sourceDate = statusMode === "printed" ? order.printedAt?.slice(0, 10) : order.orderDate;
        if (sourceDate !== filters.date) return false;
      }
      if (filters.product !== "all" && !(order.products || []).some((product) => product.name === filters.product)) return false;
      if (statusMode === "printed" && filters.status !== "all" && order.status !== filters.status) return false;
      if (query && ![order.code, order.customer, order.city, order.area, order.carrier].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))) return false;
      return true;
    });
  }, [filters, orders, search, statusMode]);

  const products = useMemo(
    () => [...new Set(orders.flatMap((order) => (order.products || []).map((product) => product.name)).filter(Boolean))],
    [orders]
  );

  const toggleCode = (orderCode) => {
    setSelectedCodes((current) => current.includes(orderCode) ? current.filter((code) => code !== orderCode) : [...current, orderCode]);
  };

  const toggleAll = () => {
    setSelectedCodes((current) => (current.length === filtered.length ? [] : filtered.map((order) => order.code)));
  };

  const columns = useMemo(() => [
    {
      key: "select",
      header: (
        <div className="flex items-center justify-center">
          <Checkbox checked={filtered.length > 0 && selectedCodes.length === filtered.length} onCheckedChange={toggleAll} />
        </div>
      ),
      className: "w-[48px]",
      cell: (row) => (
        <div className="flex items-center justify-center">
          <Checkbox checked={selectedCodes.includes(row.code)} onCheckedChange={() => toggleCode(row.code)} />
        </div>
      ),
    },
    {
      key: "code",
      header: t("fields.orderCode"),
      cell: (row) => <span className="font-mono text-sm font-black text-primary">{row.code}</span>,
    },
    {
      key: "customer",
      header: t("fields.customer"),
      cell: (row) => <span className="font-bold text-foreground">{row.customer}</span>,
    },
    { key: "city", header: t("fields.city") },
    {
      key: "carrier",
      header: t("fields.carrier"),
      cell: (row) => <CarrierBadge carrier={row.carrier} />,
    },
    {
      key: "items",
      header: t("fields.items"),
      cell: (row) => <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">{getOrderItemCount(row)}</span>,
    },
    {
      key: statusMode === "printed" ? "printedAt" : "orderDate",
      header: statusMode === "printed" ? t("fields.printedAt") : t("fields.orderDate"),
      cell: (row) => <span className="text-sm text-muted-foreground">{statusMode === "printed" ? row.printedAt || t("common.none") : row.orderDate}</span>,
    },
    {
      key: "status",
      header: t("fields.status"),
      cell: (row) => {
        if (statusMode !== "printed") {
          return <Badge className="rounded-full border border-amber-200 bg-amber-50 text-amber-700">{t("notPrinted.badge")}</Badge>;
        }
        return <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">{t(`status.${row.status}`)}</Badge>;
      },
    },
    {
      key: "actions",
      header: t("fields.actions"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDetailsOrder(row)} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white">{t("actions.view")}</button>
          <button type="button" onClick={() => onPrint([row])} className="rounded-full border border-primary/20 bg-primary/8 px-3 py-2 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{statusMode === "printed" ? t("actions.reprint") : t("actions.print")}</button>
          {statusMode === "printed" && row.status !== STATUS.PREPARED ? (
            <button type="button" onClick={() => onPrepareSelection([row])} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white">{t("actions.openPreparation")}</button>
          ) : null}
        </div>
      ),
    },
  ], [filtered.length, onPrepareSelection, onPrint, selectedCodes, statusMode, t]);

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => (key === "date" ? !!value : value !== "all"));

  return (
    <>
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {}}
        labels={{
          searchPlaceholder: statusMode === "printed" ? t("printed.search") : t("notPrinted.search"),
          filter: t("common.filter"),
          apply: t("common.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: statusMode === "printed" ? t("printed.emptyTitle") : t("notPrinted.emptyTitle"),
          emptySubtitle: "",
        }}
        actions={[
          {
            key: "print-selected",
            label: statusMode === "printed" ? t("actions.reprintSelected", { count: selectedCodes.length }) : t("actions.printSelected", { count: selectedCodes.length }),
            icon: <Printer size={14} />,
            color: "emerald",
            onClick: () => onPrint(orders.filter((order) => selectedCodes.includes(order.code))),
            disabled: selectedCodes.length === 0,
          },
          ...(statusMode === "printed"
            ? [{
                key: "prepare-selected",
                label: t("actions.prepareSelected", { count: selectedCodes.length }),
                icon: <Package size={14} />,
                color: "blue",
                onClick: () => onPrepareSelection(orders.filter((order) => selectedCodes.includes(order.code) && order.status !== STATUS.PREPARED)),
                disabled: selectedCodes.length === 0,
              }]
            : []),
          { key: "export", label: t("actions.export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => {}}
        filters={
          <>
            <FilterField label={t("fields.carrier")}>
              <Select value={filters.carrier} onValueChange={(value) => setFilters((current) => ({ ...current, carrier: value }))}>
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

            <FilterField label={t("fields.store")}>
              <Select value={filters.store} onValueChange={(value) => setFilters((current) => ({ ...current, store: value }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.allStores")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allStores")}</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store} value={store}>{store}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            {statusMode === "printed" ? (
              <FilterField label={t("fields.status")}>
                <Select value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}>
                  <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                    <SelectValue placeholder={t("filters.allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                    <SelectItem value={STATUS.CONFIRMED}>{t("status.CONFIRMED")}</SelectItem>
                    <SelectItem value={STATUS.PREPARING}>{t("status.PREPARING")}</SelectItem>
                    <SelectItem value={STATUS.PREPARED}>{t("status.PREPARED")}</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
            ) : null}

            <FilterField label={t("fields.product")}>
              <Select value={filters.product} onValueChange={(value) => setFilters((current) => ({ ...current, product: value }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.allProducts")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allProducts")}</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={statusMode === "printed" ? t("fields.printedAt") : t("fields.orderDate")}>
              <Input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} className="h-10 rounded-xl" />
            </FilterField>
          </>
        }
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: nextPage, per_page: perPage }) => setPage({ current_page: nextPage, per_page: perPage })}
      />

      <OrderDetailsDialog order={detailsOrder} open={!!detailsOrder} onClose={() => setDetailsOrder(null)} t={t} />
    </>
  );
}

export default function PrintLabelsTab({ orders, updateOrder, pushOp, subtab, setSubtab, onPrepareOrder, onPrepareMultiple }) {
  const t = useTranslations("warehouse.print");
  const distributedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.CONFIRMED && !!order.carrier), [orders]);
  const notPrintedOrders = useMemo(() => distributedOrders.filter((order) => !order.labelPrinted), [distributedOrders]);
  const printedOrders = useMemo(() => orders.filter((order) => order.labelPrinted && [STATUS.CONFIRMED, STATUS.PREPARING, STATUS.PREPARED].includes(order.status)), [orders]);

  const [notPrintedFilters, setNotPrintedFilters] = useState({ carrier: "all", store: "all", product: "all", date: "" });
  const [printedFilters, setPrintedFilters] = useState({ carrier: "all", store: "all", product: "all", status: "all", date: "" });
  const [notPrintedSearch, setNotPrintedSearch] = useState("");
  const [printedSearch, setPrintedSearch] = useState("");
  const [selectedNotPrinted, setSelectedNotPrinted] = useState([]);
  const [selectedPrinted, setSelectedPrinted] = useState([]);
  const [previewOrders, setPreviewOrders] = useState([]);

  const openPreview = (rows) => {
    if (!rows || rows.length === 0) return;
    setPreviewOrders(rows);
  };

  const handleConfirmPrint = (codes) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    codes.forEach((code, index) => {
      const currentOrder = orders.find((order) => order.code === code);
      updateOrder(code, {
        labelPrinted: true,
        printedAt: now,
        status: currentOrder?.status === STATUS.CONFIRMED ? STATUS.PREPARING : currentOrder?.status,
      });
      pushOp({
        id: `OP-${Date.now()}-${index}`,
        operationType: "PRINT_LABEL",
        orderCode: code,
        carrier: currentOrder?.carrier || "-",
        employee: "System",
        result: "SUCCESS",
        details: t("operations.printed"),
        createdAt: now,
      });
    });

    setSelectedNotPrinted([]);
    setSelectedPrinted([]);
  };

  const openPreparationSelection = (selectedOrders) => {
    const rows = (Array.isArray(selectedOrders) ? selectedOrders : [selectedOrders]).filter(Boolean);
    if (rows.length === 0) return;
    if (rows.length === 1) onPrepareOrder(rows[0]);
    else onPrepareMultiple(rows);
  };

  const stats = [
    { id: "distributed", name: t("stats.distributed"), value: distributedOrders.length, icon: Truck, color: "#2563eb", sortOrder: 0 },
    { id: "notPrinted", name: t("stats.notPrinted"), value: notPrintedOrders.length, icon: Printer, color: "#f59e0b", sortOrder: 1 },
    { id: "printed", name: t("stats.printed"), value: printedOrders.length, icon: CheckCircle2, color: "#10b981", sortOrder: 2 },
    { id: "inPreparation", name: t("stats.inPreparation"), value: orders.filter((order) => order.status === STATUS.PREPARING).length, icon: Package, color: "#8b5cf6", sortOrder: 3 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.printLabels") },
        ]}
        buttons={<Button_ size="sm" label={t("actions.help")} variant="ghost" onClick={() => {}} icon={<Info size={16} />} />}
        stats={stats}
        items={[
          { id: "not_printed", label: t("tabs.notPrinted"), count: notPrintedOrders.length, icon: Printer },
          { id: "printed", label: t("tabs.printed"), count: printedOrders.length, icon: CheckCircle2 },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div key={subtab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
          {subtab === "not_printed" ? (
            <LabelsTable
              orders={notPrintedOrders}
              filters={notPrintedFilters}
              setFilters={setNotPrintedFilters}
              selectedCodes={selectedNotPrinted}
              setSelectedCodes={setSelectedNotPrinted}
              search={notPrintedSearch}
              setSearch={setNotPrintedSearch}
              onPrint={openPreview}
              onPrepareSelection={openPreparationSelection}
              t={t}
              statusMode="notPrinted"
            />
          ) : null}

          {subtab === "printed" ? (
            <LabelsTable
              orders={printedOrders}
              filters={printedFilters}
              setFilters={setPrintedFilters}
              selectedCodes={selectedPrinted}
              setSelectedCodes={setSelectedPrinted}
              search={printedSearch}
              setSearch={setPrintedSearch}
              onPrint={openPreview}
              onPrepareSelection={openPreparationSelection}
              t={t}
              statusMode="printed"
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <PrintPreviewModal open={previewOrders.length > 0} onClose={() => setPreviewOrders([])} orders={previewOrders} onConfirm={handleConfirmPrint} t={t} />
    </div>
  );
}
