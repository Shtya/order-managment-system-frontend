"use client";

import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer, CheckCircle2, Package, Truck, FileDown, Info, X,
  MapPin, Phone, User, Hash, ShoppingBag, TrendingUp, AlertCircle,
  CreditCard, Store, Clock, BarChart3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "../../../../components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";
import { STATUS, CARRIERS } from "./data";

// ── Carrier Styles ───────────────────────────────────────────────────────────
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

// ── Order Detail Modal — Enhanced ─────────────────────────────────────────────
function OrderDetailModal({ open, onClose, order }) {
  const t = useTranslations("warehouse.print");
  if (!order) return null;

  const infoRows = [
    { label: t("modal.customerName"), value: order.customer, icon: User, accent: "#ff8b00" },
    { label: t("modal.phone"), value: order.phone, icon: Phone, accent: "#6763af" },
    { label: t("modal.city"), value: order.city, icon: MapPin, accent: "#ff8b00" },
    { label: t("modal.area"), value: order.area || "—", icon: MapPin, accent: "#ffb703" },
    { label: t("modal.store"), value: order.store, icon: Store, accent: "#6763af" },
    { label: t("modal.carrier"), value: order.carrier || t("modal.notSpecified"), icon: Truck, accent: "#ff5c2b" },
    { label: t("modal.trackingCode"), value: order.trackingCode || "—", icon: Hash, accent: "#6763af" },
    {
      label: t("modal.paymentType"),
      value: order.paymentType === "COD" ? t("modal.cod") : t("modal.paid"),
      icon: CreditCard,
      accent: order.paymentType === "COD" ? "#ffb703" : "#10b981",
    },
    { label: t("modal.total"), value: `${order.total} ر.س`, icon: TrendingUp, accent: "#10b981" },
    { label: t("modal.shippingCost"), value: `${order.shippingCost || 0} ر.س`, icon: Truck, accent: "#ff8b00" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl" dir="rtl">
        {/* Gradient header */}
        <div className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #ff8b00 0%, #ff5c2b 55%, #ffb703 100%)" }}>
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{t("modal.orderDetailsLabel")}</p>
                <h2 className="text-white text-xl font-bold font-mono">{order.code}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            {order.carrier && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {order.carrier}
              </span>
            )}
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full",
              order.paymentType === "COD"
                ? "bg-yellow-400/30 text-white border border-yellow-300/40"
                : "bg-green-400/30 text-white border border-green-300/40"
            )}>
              <CreditCard size={11} />
              {order.paymentType === "COD" ? t("modal.cod") : t("modal.paid")}
            </span>
            {order.labelPrinted && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-400/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-300/40">
                <CheckCircle2 size={11} />
                {t("modal.printed")}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2.5">
            {infoRows.map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-3 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: accent + "18" }}>
                  <Icon size={13} style={{ color: accent }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 font-medium">{label}</p>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Products */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "linear-gradient(90deg, #6763af15 0%, transparent 100%)" }}>
              <ShoppingBag size={14} style={{ color: "#6763af" }} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t("modal.products")}</span>
              <span className="ml-auto text-xs font-semibold text-slate-400">{order.products?.length || 0} {t("modal.items")}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {order.products?.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#ff8b0018", color: "#ff8b00" }}>{i + 1}</div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: "#6763af12", color: "#6763af" }}>{p.sku}</span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">{p.name}</span>
                  <span className="text-xs text-slate-400 font-mono">×{p.requestedQty}</span>
                  <span className="font-bold text-sm" style={{ color: "#ff8b00" }}>{(Number(p.price) || 0) * (Number(p.requestedQty) || 0)} ر.س</span>
                </motion.div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="rounded-xl p-4 border" style={{ backgroundColor: "#ffb70310", borderColor: "#ffb70340" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} style={{ color: "#ffb703" }} />
                <p className="text-xs font-bold" style={{ color: "#ff8b00" }}>{t("modal.notes")}</p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{order.notes}</p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">{t("common.close")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Print Preview Modal — Enhanced ────────────────────────────────────────────
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
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; }
            .page { page-break-after: always; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .label { border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; width: 420px; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
            .label-header { background: linear-gradient(135deg, #ff8b00, #ff5c2b); border-radius: 12px; padding: 16px; margin-bottom: 16px; color: #fff; }
            .label-code { font-size: 22px; font-weight: 800; letter-spacing: 1px; font-family: monospace; }
            .label-carrier { font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 20px; display: inline-block; margin-top: 6px; }
            .section { margin-bottom: 14px; }
            .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; }
            .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px; }
            .key { font-size: 11px; color: #64748b; flex-shrink: 0; }
            .val { font-size: 12px; font-weight: 600; color: #0f172a; text-align: left; }
            .products-table { width: 100%; border-collapse: collapse; }
            .products-table th { font-size: 10px; color: #94a3b8; font-weight: 600; text-align: right; padding: 4px 8px; border-bottom: 1px solid #f1f5f9; }
            .products-table td { font-size: 11px; color: #334155; padding: 5px 8px; border-bottom: 1px solid #f8fafc; }
            .sku { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
            .barcode-area { margin-top: 16px; background: #f8fafc; border-radius: 10px; padding: 12px; text-align: center; border: 1px solid #e2e8f0; }
            .barcode-lines { height: 48px; background: repeating-linear-gradient(90deg, #1e293b 0 2px, #fff 2px 5px); border-radius: 4px; margin-bottom: 8px; }
            .barcode-text { font-family: monospace; font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: 2px; }
            .payment-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
            .cod { background: #fef3c7; color: #92400e; }
            .paid { background: #d1fae5; color: #065f46; }
            @media print { .page { page-break-after: always; min-height: auto; } }
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
      <DialogContent className="!max-w-3xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #ff8b00 0%, #ff5c2b 55%, #ffb703 100%)" }}>
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Printer className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{t("printPreview.subtitle")}</p>
                <h2 className="text-white text-xl font-bold">{t("printPreview.title", { count: orders.length })}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="relative mt-4">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Package size={11} />{orders.length} {t("printPreview.labels")}
            </span>
          </div>
        </div>

        {/* Preview cards */}
        <div className="p-5 max-h-[52vh] overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-800/30">
          <div ref={printRef}>
            {orders.map((order) => (
              <div key={order.code} className="page">
                {/* Screen preview card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm mb-3">
                  {/* Label header */}
                  <div className="label-header p-4" style={{ background: "linear-gradient(135deg, #ff8b00, #ff5c2b)" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/70 text-[11px] mb-0.5">{t("printPreview.orderCode")}</p>
                        <p className="text-white text-xl font-bold font-mono">{order.code}</p>
                      </div>
                      <span className="label-carrier text-white text-xs font-bold bg-white/25 px-3 py-1.5 rounded-full">
                        {order.carrier}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Customer info */}
                    <div className="section">
                      <p className="section-title text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t("printPreview.customerInfo")}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          [t("labelFields.customer"), order.customer],
                          [t("labelFields.phone"), order.phone],
                          [t("labelFields.city"), order.city],
                          [t("labelFields.area"), order.area || "—"],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                            <p className="text-[10px] text-slate-400 mb-0.5">{k}</p>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping info */}
                    <div className="section">
                      <p className="section-title text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t("printPreview.shippingInfo")}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          [t("labelFields.store"), order.store],
                          [t("labelFields.trackingCode"), order.trackingCode || "—"],
                          [t("labelFields.shippingCost"), `${order.shippingCost || 0} ر.س`],
                          [t("labelFields.paymentType"), order.paymentType === "COD" ? t("labelFields.cod") : t("labelFields.paid")],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                            <p className="text-[10px] text-slate-400 mb-0.5">{k}</p>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Barcode area */}
                    <div className="barcode-area bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
                      <div className="barcode-lines h-10 rounded-md mb-2"
                        style={{ background: "repeating-linear-gradient(90deg, #1e293b 0 2px, #f8fafc 2px 5px)" }} />
                      <p className="barcode-text font-mono text-sm font-bold text-slate-800 dark:text-slate-100 tracking-widest">
                        {order.trackingCode || order.code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hidden print-only version */}
                <div className="label" style={{ display: "none" }}>
                  <div className="label-header">
                    <div className="label-code">{order.code}</div>
                    <div className="label-carrier">{order.carrier}</div>
                  </div>
                  <div className="section">
                    <div className="section-title">معلومات العميل</div>
                    {[[t("labelFields.customer"), order.customer], [t("labelFields.phone"), order.phone], [t("labelFields.city"), order.city], [t("labelFields.area"), order.area || "—"], [t("labelFields.address"), order.address || "—"]].map(([k, v]) => (
                      <div className="row" key={k}><span className="key">{k}</span><span className="val">{v}</span></div>
                    ))}
                  </div>
                  <div className="section">
                    <div className="section-title">معلومات الشحن</div>
                    {[[t("labelFields.store"), order.store], [t("labelFields.trackingCode"), order.trackingCode || "—"], [t("labelFields.shippingCost"), `${order.shippingCost || 0} ر.س`]].map(([k, v]) => (
                      <div className="row" key={k}><span className="key">{k}</span><span className="val">{v}</span></div>
                    ))}
                    <div className="row">
                      <span className="key">{t("labelFields.paymentType")}</span>
                      <span className={`payment-badge ${order.paymentType === "COD" ? "cod" : "paid"}`}>
                        {order.paymentType === "COD" ? t("labelFields.cod") : t("labelFields.paid")}
                      </span>
                    </div>
                  </div>
                  <div className="barcode-area">
                    <div className="barcode-lines" />
                    <div className="barcode-text">{order.trackingCode || order.code}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="rounded-xl">{t("common.cancel")}</Button>
          <motion.button
            onClick={handlePrint}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #ff8b00 0%, #ff5c2b 100%)" }}
          >
            <Printer size={15} />
            {t("printPreview.printNow", { count: orders.length })}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── NOT-PRINTED SUBTAB ────────────────────────────────────────────────────────
function NotPrintedSubtab({ orders, updateOrder, pushOp, onPrinted, resetToken }) {
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

  React.useEffect(() => {
    setSearch("");
    setFilters({ carrier: "all", store: "all", date: "", productName: "" });
    setSelectedOrders([]);
    setDetailModal(null);
    setPrintPreview({ open: false, orders: [] });
    setPage({ current_page: 1, per_page: 12 });
  }, [resetToken]);

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

  const hasActiveFilters = filters.carrier !== "all" || filters.store !== "all" || !!filters.date || !!filters.productName;

  const columns = useMemo(() => [
    {
      key: "select",
      header: (<div className="flex items-center justify-center"><Checkbox checked={filtered.length > 0 && selectedOrders.length === filtered.length} onCheckedChange={selectAll} /></div>),
      className: "w-[48px]",
      cell: (row) => (<div className="flex items-center justify-center"><Checkbox checked={selectedOrders.includes(row.code)} onCheckedChange={() => toggleOrder(row.code)} /></div>),
    },
    { key: "code", header: t("field.orderCode"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00]">{row.code}</span> },
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
        <ActionButtons
          row={row}
          actions={[
            { icon: <Info />, tooltip: t("common.details"), onClick: (r) => setDetailModal(r), variant: "purple" },
            { icon: <Printer />, tooltip: t("common.printLabel"), onClick: (r) => setPrintPreview({ open: true, orders: [r] }), variant: "blue" },
          ]}
        />
      ),
    },
  ], [filtered, selectedOrders, t]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search} onSearchChange={setSearch} onSearch={() => {}}
        labels={{ searchPlaceholder: t("notPrinted.search"), filter: t("common.filter"), apply: t("common.apply"), total: t("common.total"), limit: t("common.limit"), emptyTitle: t("notPrinted.empty"), emptySubtitle: "" }}
        actions={[
          { key: "printSelected", label: selectedOrders.length > 0 ? t("notPrinted.printSelected", { count: selectedOrders.length }) : t("notPrinted.printSelectedDefault"), icon: <Printer size={14} />, color: "emerald", onClick: () => selectedOrders.length > 0 && setPrintPreview({ open: true, orders: orders.filter((o) => selectedOrders.includes(o.code)) }), disabled: selectedOrders.length === 0 },
          { key: "export", label: t("common.export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
        ]}
        hasActiveFilters={hasActiveFilters} onApplyFilters={() => {}}
        filters={
          <>
            <FilterField label={t("filter.carrier")}>
              <Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filter.allCarriers")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allCarriers")}</SelectItem>
                  {CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filter.store")}>
              <Select value={filters.store} onValueChange={(v) => setFilters((f) => ({ ...f, store: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filter.allStores")} /></SelectTrigger>
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
        columns={columns} data={filtered} isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />
      <PrintPreviewModal open={printPreview.open} onClose={() => setPrintPreview({ open: false, orders: [] })} orders={printPreview.orders} onConfirmPrint={handleConfirmPrint} />
      <OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
    </div>
  );
}

// ── PRINTED SUBTAB ────────────────────────────────────────────────────────────
function PrintedSubtab({ orders, updateOrder, pushOp, resetToken }) {
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

  React.useEffect(() => {
    setSearch("");
    setFilters({ carrier: "all", store: "all", status: "all", date: "", productName: "" });
    setSelectedOrders([]);
    setDetailModal(null);
    setPrintPreview({ open: false, orders: [] });
    setPage({ current_page: 1, per_page: 12 });
  }, [resetToken]);

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

  const hasActiveFilters = filters.carrier !== "all" || filters.store !== "all" || filters.status !== "all" || !!filters.date || !!filters.productName;

  const columns = useMemo(() => [
    {
      key: "select",
      header: (<div className="flex items-center justify-center"><Checkbox checked={filtered.length > 0 && selectedOrders.length === filtered.length} onCheckedChange={selectAll} /></div>),
      className: "w-[48px]",
      cell: (row) => (<div className="flex items-center justify-center"><Checkbox checked={selectedOrders.includes(row.code)} onCheckedChange={() => toggleOrder(row.code)} /></div>),
    },
    { key: "code", header: t("field.orderCode"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00]">{row.code}</span> },
    { key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
    { key: "phone", header: t("field.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm" dir="ltr">{row.phone}</span> },
    { key: "city", header: t("field.city") },
    { key: "carrier", header: t("field.carrier"), cell: (row) => <CarrierPill carrier={row.carrier} /> },
    { key: "printedAt", header: t("field.printedAt"), cell: (row) => <span className="text-sm text-slate-500">{row.printedAt || "—"}</span> },
    {
      key: "status", header: t("field.status"),
      cell: (row) => { const s = statusLabel(row.status); return <Badge className={cn("rounded-full text-xs border", s.cls)}>{s.label}</Badge>; },
    },
    { key: "total", header: t("field.total"), cell: (row) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{row.total} ر.س</span> },
    {
      key: "actions", header: t("field.actions"),
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            { icon: <Info />, tooltip: t("common.details"), onClick: (r) => setDetailModal(r), variant: "purple" },
            { icon: <Printer />, tooltip: t("common.reprint"), onClick: (r) => setPrintPreview({ open: true, orders: [r] }), variant: "blue" },
          ]}
        />
      ),
    },
  ], [filtered, selectedOrders, t]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search} onSearchChange={setSearch} onSearch={() => {}}
        labels={{ searchPlaceholder: t("printed.search"), filter: t("common.filter"), apply: t("common.apply"), total: t("common.total"), limit: t("common.limit"), emptyTitle: t("printed.empty"), emptySubtitle: "" }}
        actions={[
          { key: "reprintSelected", label: selectedOrders.length > 0 ? t("printed.printSelected", { count: selectedOrders.length }) : t("printed.printSelectedDefault"), icon: <Printer size={14} />, color: "emerald", onClick: () => selectedOrders.length > 0 && setPrintPreview({ open: true, orders: orders.filter((o) => selectedOrders.includes(o.code)) }), disabled: selectedOrders.length === 0 },
          { key: "export", label: t("common.export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
        ]}
        hasActiveFilters={hasActiveFilters} onApplyFilters={() => {}}
        filters={
          <>
            <FilterField label={t("filter.carrier")}>
              <Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filter.allCarriers")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allCarriers")}</SelectItem>
                  {CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filter.store")}>
              <Select value={filters.store} onValueChange={(v) => setFilters((f) => ({ ...f, store: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filter.allStores")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allStores")}</SelectItem>
                  {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filter.status")}>
              <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filter.allStatuses")} /></SelectTrigger>
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
        columns={columns} data={filtered} isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />
      <PrintPreviewModal open={printPreview.open} onClose={() => setPrintPreview({ open: false, orders: [] })} orders={printPreview.orders} onConfirmPrint={handleReprintConfirm} />
      <OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
    </div>
  );
}

// ── Main Print Labels Tab ─────────────────────────────────────────────────────
export default function PrintLabelsTab({ orders, updateOrder, pushOp, subtab, setSubtab, resetToken }) {
  const t = useTranslations("warehouse.print");

  const distributedOrders = useMemo(() => orders.filter((o) => o.status === STATUS.CONFIRMED && !!o.carrier), [orders]);
  const notPrinted = distributedOrders.filter((o) => !o.labelPrinted);
  const printed = orders.filter((o) => o.labelPrinted && [STATUS.CONFIRMED, STATUS.PREPARING, STATUS.PREPARED].includes(o.status));

  const stats = [
    { id: "total-distributed", name: t("stats.totalDistributed"), value: distributedOrders.length, icon: Truck, color: "#6763af", bgColor: "#6763af15", sortOrder: 0 },
    { id: "not-printed", name: t("stats.notPrinted"), value: notPrinted.length, icon: Printer, color: "#ffb703", bgColor: "#ffb70315", sortOrder: 1 },
    { id: "printed", name: t("stats.printed"), value: printed.length, icon: CheckCircle2, color: "#10b981", bgColor: "#10b98115", sortOrder: 2 },
    { id: "in-preparation", name: t("stats.inPreparation"), value: orders.filter((o) => o.status === STATUS.PREPARING).length, icon: Package, color: "#ff8b00", bgColor: "#ff8b0015", sortOrder: 3 },
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
          <Button_ size="sm" label={t("howItWorks")} variant="ghost" onClick={() => {}} icon={<Info size={18} />} />
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
            <NotPrintedSubtab orders={orders} updateOrder={updateOrder} pushOp={pushOp} onPrinted={() => setSubtab("printed")} resetToken={resetToken} />
          )}
          {subtab === "printed" && (
            <PrintedSubtab orders={orders} updateOrder={updateOrder} pushOp={pushOp} resetToken={resetToken} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}