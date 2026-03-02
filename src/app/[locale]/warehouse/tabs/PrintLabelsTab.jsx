"use client";

import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer, CheckCircle2, Package, Truck, FileDown, Info, X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "../../../../components/atoms/Pageheader";
import { STATUS, CARRIERS } from "./data";

const CARRIER_STYLES = {
  ARAMEX: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-400" },
  SMSA: { bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-400" },
  DHL: { bg: "bg-yellow-50 dark:bg-yellow-950/20", border: "border-yellow-200 dark:border-yellow-800", text: "text-yellow-700 dark:text-yellow-400" },
  BOSTA: { bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-400" },
};

function CarrierPill({ carrier }) {
  const s = CARRIER_STYLES[carrier] || {};
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", s.bg, s.border, s.text)}>
      <Truck size={12} />{carrier}
    </span>
  );
}

// ── Print Preview Modal ───────────────────────────────────────────────────────
function PrintPreviewModal({ open, onClose, orders, onConfirmPrint }) {
  const t = useTranslations("warehouse.print");
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const w = window.open("", "_blank");
    w.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة البوالص</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #fff; }
            .page { page-break-after: always; padding: 20px; }
            .label { border: 2px solid #1e293b; border-radius: 12px; padding: 20px; max-width: 400px; margin: auto; }
            .label-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .key { font-size: 11px; color: #64748b; }
            .val { font-size: 12px; font-weight: 600; color: #0f172a; }
            .code { font-family: monospace; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px; font-size: 13px; font-weight: 700; text-align: center; margin-top: 12px; letter-spacing: 1px; }
            .barcode-placeholder { height: 50px; background: repeating-linear-gradient(90deg, #0f172a 0 2px, #fff 2px 5px); border-radius: 4px; margin-top: 8px; }
            @media print { .page { page-break-after: always; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
    onConfirmPrint(orders.map((o) => o.code));
    onClose();
  };

  if (!open || !orders?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-3xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Printer className="text-[#ff8b00] dark:text-[#5b4bff]" size={22} />
            {t("printPreview.title", { count: orders.length })}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 max-h-[55vh] overflow-y-auto bg-slate-50 dark:bg-slate-800/40 rounded-xl">
          <div ref={printRef}>
            {orders.map((order) => (
              <div key={order.code} className="page">
                <div className="label" style={{ border: "2px solid #1e293b", borderRadius: 12, padding: 20, maxWidth: 400, margin: "0 auto 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{order.code}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "#f1f5f9", color: "#334155" }}>{order.carrier}</span>
                  </div>
                  {[
                    [t("labelFields.customer"), order.customer],
                    [t("labelFields.phone"), order.phone],
                    [t("labelFields.city"), order.city],
                    [t("labelFields.area"), order.area || "—"],
                    [t("labelFields.address"), order.address || "—"],
                    [t("labelFields.store"), order.store],
                    [t("labelFields.trackingCode"), order.trackingCode || "—"],
                    [t("labelFields.shippingCost"), `${order.shippingCost} ر.س`],
                    [t("labelFields.paymentType"), order.paymentType === "COD" ? t("labelFields.cod") : t("labelFields.paid")],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ fontFamily: "monospace", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: 6, fontSize: 13, fontWeight: 700, textAlign: "center", marginTop: 12, letterSpacing: 1 }}>
                    {order.trackingCode || order.code}
                  </div>
                  <div style={{ height: 40, background: "repeating-linear-gradient(90deg,#0f172a 0 2px,#fff 2px 5px)", borderRadius: 4, marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handlePrint} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white dark:bg-[#5b4bff] dark:hover:bg-[#4a3de0] gap-2">
            <Printer size={16} />
            {t("printPreview.printNow", { count: orders.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ open, onClose, order }) {
  const t = useTranslations("warehouse.print");
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="text-[#ff8b00] dark:text-[#5b4bff]" size={22} />
            {t("modal.orderDetails", { code: order.code })}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "اسم العميل", value: order.customer },
              { label: "رقم الهاتف", value: order.phone },
              { label: "المدينة", value: order.city },
              { label: "المنطقة", value: order.area || "—" },
              { label: "المتجر", value: order.store },
              { label: "شركة الشحن", value: order.carrier || "غير محدد" },
              { label: "كود التتبع", value: order.trackingCode || "—" },
              { label: "الإجمالي", value: `${order.total} ر.س` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-3 font-semibold">المنتجات</p>
            <div className="space-y-2">
              {order.products.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{p.sku}</span>
                  <span className="flex-1 mx-3">{p.name}</span>
                  <span className="text-slate-500">×{p.requestedQty}</span>
                  <span className="font-semibold ms-4">{p.price * p.requestedQty} ر.س</span>
                </div>
              ))}
            </div>
          </div>
          {order.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-600 mb-1 font-semibold">ملاحظات</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{order.notes}</p>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>{t("common.close")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── NOT-PRINTED SUBTAB ────────────────────────────────────────────────────────
function NotPrintedSubtab({ orders, updateOrder, pushOp, onPrinted, onPrepareOrder, onPrepareMultiple }) {
  const t = useTranslations("warehouse.print");

  const notPrinted = useMemo(
    () => orders.filter((o) => o.status === STATUS.CONFIRMED && !!o.carrier && !o.labelPrinted),
    [orders]
  );

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ carrier: "all", store: "all", date: "", productName: "" });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [detailModal, setDetailModal] = useState(null);
  const [printPreview, setPrintPreview] = useState({ open: false, orders: [] });
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  const stores = useMemo(() => [...new Set(notPrinted.map((o) => o.store))], [notPrinted]);

  const filtered = useMemo(() => {
    let base = notPrinted;
    const q = search.trim().toLowerCase();
    if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city, o.carrier].some((x) => String(x || "").toLowerCase().includes(q)));
    if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
    if (filters.store !== "all") base = base.filter((o) => o.store === filters.store);
    if (filters.date) base = base.filter((o) => o.orderDate === filters.date);
    if (filters.productName) base = base.filter((o) => o.products.some((p) => p.name.includes(filters.productName)));
    return base;
  }, [notPrinted, search, filters]);

  const toggleOrder = (code) => setSelectedOrders((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  const selectAll = () => setSelectedOrders(selectedOrders.length === filtered.length ? [] : filtered.map((o) => o.code));

  const handleConfirmPrint = (codes) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    codes.forEach((code) => {
      updateOrder(code, { labelPrinted: true, printedAt: now, status: STATUS.PREPARING });
      pushOp({ id: `OP-${Date.now()}-${code}`, operationType: "PRINT_LABEL", orderCode: code, carrier: orders.find((o) => o.code === code)?.carrier || "-", employee: "System", result: "SUCCESS", details: "تم طباعة البوليصة", createdAt: now });
    });
    setSelectedOrders([]);
    onPrinted?.();
  };

  const openPrint = (rows) => setPrintPreview({ open: true, orders: rows });
  const hasActiveFilters = filters.carrier !== "all" || filters.store !== "all" || !!filters.date || !!filters.productName;

  const handlePrepareSelected = () => {
    if (selectedOrders.length === 0) return;
    const ordersToPrep = orders.filter((o) => selectedOrders.includes(o.code));
    if (ordersToPrep.length === 1) onPrepareOrder?.(ordersToPrep[0]);
    else onPrepareMultiple?.(ordersToPrep);
  };

  const columns = useMemo(() => [
    {
      key: "select",
      header: (
        <div className="flex items-center justify-center">
          <Checkbox checked={filtered.length > 0 && selectedOrders.length === filtered.length} onCheckedChange={selectAll} />
        </div>
      ),
      className: "w-[48px]",
      cell: (row) => (
        <div className="flex items-center justify-center">
          <Checkbox checked={selectedOrders.includes(row.code)} onCheckedChange={() => toggleOrder(row.code)} />
        </div>
      ),
    },
    { key: "code", header: t("field.orderCode"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00] dark:text-[#5b4bff]">{row.code}</span> },
    { key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
    { key: "phone", header: t("field.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm" dir="ltr">{row.phone}</span> },
    { key: "city", header: t("field.city") },
    { key: "area", header: t("field.area") },
    { key: "carrier", header: t("field.carrier"), cell: (row) => <CarrierPill carrier={row.carrier} /> },
    {
      key: "trackingCode", header: t("field.trackingCode"),
      cell: (row) => row.trackingCode
        ? <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{row.trackingCode}</span>
        : <span className="text-slate-400">{t("common.none")}</span>,
    },
    { key: "total", header: t("field.total"), cell: (row) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{row.total} ر.س</span> },
    { key: "orderDate", header: t("field.orderDate"), cell: (row) => <span className="text-sm text-slate-500">{row.orderDate}</span> },
    {
      key: "actions", header: t("field.actions"),
      cell: (row) => (
        <TooltipProvider>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setDetailModal(row)}
                  className="w-9 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                  <Info size={15} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>{t("common.details")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => openPrint([row])}
                  className="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                  <Printer size={15} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>{t("common.printLabel")}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ], [filtered, selectedOrders, t]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {}}
        labels={{
          searchPlaceholder: t("notPrinted.search"),
          filter: t("common.filter"),
          apply: t("common.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: t("notPrinted.empty"),
          emptySubtitle: "",
        }}
        actions={[
          {
            key: "printSelected",
            label: selectedOrders.length > 0 ? t("notPrinted.printSelected", { count: selectedOrders.length }) : t("notPrinted.printSelectedDefault"),
            icon: <Printer size={14} />,
            color: "emerald",
            onClick: () => selectedOrders.length > 0 && openPrint(orders.filter((o) => selectedOrders.includes(o.code))),
            disabled: selectedOrders.length === 0,
          }, 
          { key: "export", label: t("common.export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => {}}
        filters={
          <>
            <FilterField label={t("filter.carrier")}>
              <Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filter.allCarriers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allCarriers")}</SelectItem>
                  {CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filter.store")}>
              <Select value={filters.store} onValueChange={(v) => setFilters((f) => ({ ...f, store: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filter.allStores")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allStores")}</SelectItem>
                  {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filter.date")}>
              <Input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl text-sm" />
            </FilterField>
            <FilterField label={t("filter.productName")}>
              <Input value={filters.productName} onChange={(e) => setFilters((f) => ({ ...f, productName: e.target.value }))} placeholder={t("filter.productNamePlaceholder")} className="h-10 rounded-xl text-sm" />
            </FilterField>
          </>
        }
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />

      <PrintPreviewModal open={printPreview.open} onClose={() => setPrintPreview({ open: false, orders: [] })} orders={printPreview.orders} onConfirmPrint={handleConfirmPrint} />
      <OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
    </div>
  );
}

// ── PRINTED SUBTAB ────────────────────────────────────────────────────────────
function PrintedSubtab({ orders, updateOrder, pushOp, onPrepareOrder, onPrepareMultiple }) {
  const t = useTranslations("warehouse.print");

  const printed = useMemo(
    () => orders.filter((o) => o.labelPrinted && [STATUS.CONFIRMED, STATUS.PREPARING, STATUS.PREPARED].includes(o.status)),
    [orders]
  );

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ carrier: "all", store: "all", status: "all", date: "", productName: "" });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [detailModal, setDetailModal] = useState(null);
  const [printPreview, setPrintPreview] = useState({ open: false, orders: [] });
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  const stores = useMemo(() => [...new Set(printed.map((o) => o.store))], [printed]);

  const filtered = useMemo(() => {
    let base = printed;
    const q = search.trim().toLowerCase();
    if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city, o.carrier].some((x) => String(x || "").toLowerCase().includes(q)));
    if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
    if (filters.store !== "all") base = base.filter((o) => o.store === filters.store);
    if (filters.status !== "all") base = base.filter((o) => o.status === filters.status);
    if (filters.date) base = base.filter((o) => o.printedAt?.startsWith(filters.date));
    if (filters.productName) base = base.filter((o) => o.products.some((p) => p.name.includes(filters.productName)));
    return base;
  }, [printed, search, filters]);

  const toggleOrder = (code) => setSelectedOrders((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  const selectAll = () => setSelectedOrders(selectedOrders.length === filtered.length ? [] : filtered.map((o) => o.code));

  const statusLabel = (status) => {
    if (status === STATUS.PREPARING) return { label: t("printed.statusPreparing"), cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400" };
    if (status === STATUS.PREPARED) return { label: t("printed.statusReady"), cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400" };
    return { label: t("printed.statusPrinting"), cls: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-400" };
  };

  const handleReprintConfirm = (codes) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    codes.forEach((code) => {
      updateOrder(code, { printedAt: now });
      pushOp({ id: `OP-${Date.now()}-${code}`, operationType: "PRINT_LABEL", orderCode: code, employee: "System", result: "SUCCESS", details: "إعادة طباعة البوليصة", createdAt: now });
    });
  };

  const handlePrepareSelected = () => {
    if (selectedOrders.length === 0) return;
    const ordersToPrep = orders.filter((o) => selectedOrders.includes(o.code));
    if (ordersToPrep.length === 1) onPrepareOrder?.(ordersToPrep[0]);
    else onPrepareMultiple?.(ordersToPrep);
  };

  const hasActiveFilters = filters.carrier !== "all" || filters.store !== "all" || filters.status !== "all" || !!filters.date || !!filters.productName;

  const columns = useMemo(() => [
    {
      key: "select",
      header: (
        <div className="flex items-center justify-center">
          <Checkbox checked={filtered.length > 0 && selectedOrders.length === filtered.length} onCheckedChange={selectAll} />
        </div>
      ),
      className: "w-[48px]",
      cell: (row) => (
        <div className="flex items-center justify-center">
          <Checkbox checked={selectedOrders.includes(row.code)} onCheckedChange={() => toggleOrder(row.code)} />
        </div>
      ),
    },
    { key: "code", header: t("field.orderCode"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00] dark:text-[#5b4bff]">{row.code}</span> },
    { key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
    { key: "phone", header: t("field.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm" dir="ltr">{row.phone}</span> },
    { key: "city", header: t("field.city") },
    { key: "carrier", header: t("field.carrier"), cell: (row) => <CarrierPill carrier={row.carrier} /> },
    { key: "printedAt", header: t("field.printedAt"), cell: (row) => <span className="text-sm text-slate-500">{row.printedAt || "—"}</span> },
    {
      key: "status", header: t("field.status"),
      cell: (row) => {
        const s = statusLabel(row.status);
        return <Badge className={cn("rounded-full text-xs border", s.cls)}>{s.label}</Badge>;
      },
    },
    { key: "total", header: t("field.total"), cell: (row) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{row.total} ر.س</span> },
    {
      key: "actions", header: t("field.actions"),
      cell: (row) => (
        <TooltipProvider>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setDetailModal(row)}
                  className="w-9 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                  <Info size={15} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>{t("common.details")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setPrintPreview({ open: true, orders: [row] })}
                  className="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                  <Printer size={15} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>{t("common.reprint")}</TooltipContent>
            </Tooltip>
            {onPrepareOrder && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onPrepareOrder(row)}
                    className="w-9 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                    <Package size={15} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>{t("common.openPreparation")}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      ),
    },
  ], [filtered, selectedOrders, t, onPrepareOrder]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {}}
        labels={{
          searchPlaceholder: t("printed.search"),
          filter: t("common.filter"),
          apply: t("common.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: t("printed.empty"),
          emptySubtitle: "",
        }}
        actions={[
          {
            key: "reprintSelected",
            label: selectedOrders.length > 0 ? t("printed.printSelected", { count: selectedOrders.length }) : t("printed.printSelectedDefault"),
            icon: <Printer size={14} />,
            color: "emerald",
            onClick: () => selectedOrders.length > 0 && setPrintPreview({ open: true, orders: orders.filter((o) => selectedOrders.includes(o.code)) }),
            disabled: selectedOrders.length === 0,
          },
          // {
          //   key: "prepareSelected",
          //   label: selectedOrders.length > 0 ? t("printed.prepareSelected", { count: selectedOrders.length }) : t("printed.prepareSelectedDefault"),
          //   icon: <Package size={14} />,
          //   color: "blue",
          //   onClick: handlePrepareSelected,
          //   disabled: selectedOrders.length === 0,
          // },
          { key: "export", label: t("common.export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => {}}
        filters={
          <>
            <FilterField label={t("filter.carrier")}>
              <Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filter.allCarriers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allCarriers")}</SelectItem>
                  {CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filter.store")}>
              <Select value={filters.store} onValueChange={(v) => setFilters((f) => ({ ...f, store: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filter.allStores")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allStores")}</SelectItem>
                  {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filter.status")}>
              <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filter.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
                  <SelectItem value={STATUS.CONFIRMED}>{t("printed.statusPrinting")}</SelectItem>
                  <SelectItem value={STATUS.PREPARING}>{t("printed.statusPreparing")}</SelectItem>
                  <SelectItem value={STATUS.PREPARED}>{t("printed.statusReady")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filter.printDate")}>
              <Input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl text-sm" />
            </FilterField>
            <FilterField label={t("filter.productName")}>
              <Input value={filters.productName} onChange={(e) => setFilters((f) => ({ ...f, productName: e.target.value }))} placeholder={t("filter.productNamePlaceholder")} className="h-10 rounded-xl text-sm" />
            </FilterField>
          </>
        }
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />

      <PrintPreviewModal open={printPreview.open} onClose={() => setPrintPreview({ open: false, orders: [] })} orders={printPreview.orders} onConfirmPrint={handleReprintConfirm} />
      <OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
    </div>
  );
}

// ── Main Print Labels Tab ─────────────────────────────────────────────────────
export default function PrintLabelsTab({ orders, updateOrder, pushOp, subtab, setSubtab, onPrepareOrder, onPrepareMultiple }) {
  const t = useTranslations("warehouse.print");

  const distributedOrders = useMemo(() => orders.filter((o) => o.status === STATUS.CONFIRMED && !!o.carrier), [orders]);
  const notPrinted = distributedOrders.filter((o) => !o.labelPrinted);
  const printed = orders.filter((o) => o.labelPrinted && [STATUS.CONFIRMED, STATUS.PREPARING, STATUS.PREPARED].includes(o.status));

  const stats = [
    { id: "total-distributed", name: t("stats.totalDistributed"), value: distributedOrders.length, icon: Truck, color: "#3b82f6", sortOrder: 0 },
    { id: "not-printed", name: t("stats.notPrinted"), value: notPrinted.length, icon: Printer, color: "#f59e0b", sortOrder: 1 },
    { id: "printed", name: t("stats.printed"), value: printed.length, icon: CheckCircle2, color: "#10b981", sortOrder: 2 },
    { id: "in-preparation", name: t("stats.inPreparation"), value: orders.filter((o) => o.status === STATUS.PREPARING).length, icon: Package, color: "#a855f7", sortOrder: 3 },
  ];
 
  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.printLabels") },
        ]}
        buttons={
          <Button_
            size="sm"
            label={t("howItWorks")}
            variant="ghost"
            onClick={() => {}}
            icon={<Info size={18} />}
          />
        }
        stats={stats}
        items={[
          { id: "not_printed", label: t("tabs.notPrinted"), count: notPrinted.length, icon: Printer },
          { id: "printed", label: t("tabs.printed"), count: printed.length, icon: CheckCircle2 },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div key={subtab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {subtab === "not_printed" && (
            <NotPrintedSubtab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              onPrinted={() => setSubtab("printed")}
              onPrepareOrder={onPrepareOrder}
              onPrepareMultiple={onPrepareMultiple}
            />
          )}
          {subtab === "printed" && (
            <PrintedSubtab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              onPrepareOrder={onPrepareOrder}
              onPrepareMultiple={onPrepareMultiple}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}