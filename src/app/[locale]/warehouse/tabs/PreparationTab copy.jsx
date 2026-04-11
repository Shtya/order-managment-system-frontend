"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, ScanLine, Package, CheckCircle2, Ban, FileDown, Truck, Info,
  X, Layers, AlertCircle, Hash, MapPin, User, ShoppingBag,
  TrendingUp, Volume2, VolumeX, CreditCard, Store, ChevronDown, ChevronUp,
  ClipboardList, Barcode, Search, Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Table, { FilterField } from "@/components/atoms/Table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "../../../../components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";
import Button_ from "@/components/atoms/Button";
import { STATUS, CARRIERS } from "./data";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

// ─────────────────────────────────────────────────────────────
// CARRIER STYLES
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// SOUND FEEDBACK
// ─────────────────────────────────────────────────────────────
function playBeep(type = "success") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (_) { }
}

// ─────────────────────────────────────────────────────────────
// SCAN PROGRESS BAR (for tables)
// ─────────────────────────────────────────────────────────────
function ScanProgress({ products }) {
  const total = products.reduce((s, p) => s + p.requestedQty, 0);
  const scanned = products.reduce((s, p) => s + (p.scannedQty || 0), 0);
  const pct = total === 0 ? 0 : Math.round((scanned / total) * 100);
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
          className={cn("h-full rounded-full", pct === 100
            ? "bg-gradient-to-r from-emerald-500 to-teal-600"
            : "bg-primary")} />
      </div>
      <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">{scanned}/{total}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDER DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function OrderDetailModal({ open, onClose, order }) {
  const t = useTranslations("warehouse.preparation");
  if (!order) return null;
  const { currency } = usePlatformSettings();

  const infoRows = [
    { label: t("modal.customer"), value: order.customer, icon: User, accent: "#ff8b00" },
    { label: t("modal.phone"), value: order.phone, icon: Hash, accent: "#6763af" },
    { label: t("modal.city"), value: order.city, icon: MapPin, accent: "#ff8b00" },
    { label: t("modal.area"), value: order.area || "—", icon: MapPin, accent: "#ffb703" },
    { label: t("modal.store"), value: order.store, icon: Store, accent: "#6763af" },
    { label: t("modal.carrier"), value: order.carrier || t("modal.notSpecified"), icon: Truck, accent: "#ff5c2b" },
    { label: t("modal.trackingCode"), value: order.trackingCode || "—", icon: Hash, accent: "#6763af" },
    { label: t("modal.total"), value: `${order.total} ${currency}`, icon: TrendingUp, accent: "#10b981" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl  rounded-md max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl" dir="rtl">
        <div className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden bg-primary" >
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{t("modal.orderLabel")}</p>
                <h2 className="text-white text-xl font-bold font-mono">{order.code}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="relative mt-4 flex items-center gap-2 flex-wrap">
            {order.carrier && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{order.carrier}
              </span>
            )}
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border",
              order.paymentType === "COD"
                ? "bg-yellow-400/30 text-white border-yellow-300/40"
                : "bg-green-400/30 text-white border-green-300/40"
            )}>
              <CreditCard size={11} />
              {order.paymentType === "COD" ? t("modal.cod") : t("modal.paid")}
            </span>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2.5">
            {infoRows.map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md p-3 transition-colors">
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: accent + "18" }}>
                  <Icon size={13} style={{ color: accent }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 mb-0.5 font-medium">{label}</p>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "linear-gradient(90deg, #6763af15 0%, transparent 100%)" }}>
              <ShoppingBag size={14} style={{ color: "#6763af" }} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t("modal.products")}</span>
              <span className="ml-auto text-xs font-semibold text-slate-400">{order.products?.length || 0} {t("modal.items")}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {order.products?.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "#ff8b0018", color: "#ff8b00" }}>{i + 1}</div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md font-bold"
                    style={{ backgroundColor: "#6763af12", color: "#6763af" }}>{p.sku}</span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">{p.name}</span>
                  <span className="text-xs text-slate-400 font-mono">×{p.requestedQty}</span>
                  <span className="font-bold text-sm" style={{ color: "#ff8b00" }}>
                    {(Number(p.price) || 0) * (Number(p.requestedQty) || 0)} {currency}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
          {order.notes && (
            <div className="rounded-md p-4 border" style={{ backgroundColor: "#ffb70310", borderColor: "#ffb70340" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} style={{ color: "#ffb703" }} />
                <p className="text-xs font-bold" style={{ color: "#ff8b00" }}>{t("modal.notes")}</p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{order.notes}</p>
            </div>
          )}
          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-md">{t("modal.close")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// REJECT ORDER MODAL
// ─────────────────────────────────────────────────────────────
function RejectOrderModal({ open, onClose, order, onConfirm }) {
  const t = useTranslations("warehouse.preparation");
  const [reason, setReason] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);

  const presets = [t("reject.preset1"), t("reject.preset2"), t("reject.preset3"), t("reject.preset4")];

  const handleConfirm = () => {
    const finalReason = reason.trim() || selectedPreset || "";
    if (!finalReason) return;
    onConfirm(order, finalReason);
    setReason(""); setSelectedPreset(null); onClose();
  };
  const handleClose = () => { setReason(""); setSelectedPreset(null); onClose(); };
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-lg rounded-md p-0 border-0 shadow-2xl" dir="rtl">
        <div className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #dc2626 0%, #ef4444 60%, #f87171 100%)" }}>
          <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-3 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-md bg-white/20 flex items-center justify-center">
                <Ban className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{t("reject.subtitle")}</p>
                <h2 className="text-white text-lg font-bold">{t("reject.title")}</h2>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="relative mt-3">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full font-mono">
              <Package size={11} />{order.code}
            </span>
            {order.customer && (
              <span className="mr-2 inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <User size={11} />{order.customer}
              </span>
            )}
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">{t("reject.presetsLabel")}</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset, i) => (
                <button key={i} type="button"
                  onClick={() => { setSelectedPreset(preset); setReason(preset); }}
                  className={cn(
                    "text-right text-xs font-semibold px-3 py-2.5 rounded-md border transition-all duration-150",
                    reason === preset
                      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-200 hover:bg-red-50/50 dark:hover:border-red-800 dark:hover:bg-red-950/10"
                  )}>{preset}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("reject.customLabel")}</p>
            <Textarea value={reason} onChange={(e) => { setReason(e.target.value); setSelectedPreset(null); }}
              placeholder={t("reject.placeholder")}
              className="rounded-md border-slate-200 dark:border-slate-700 resize-none text-sm min-h-[80px] focus:border-red-400 focus:ring-red-400/20"
              dir="rtl" />
          </div>
          <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{t("reject.warning")}</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={handleClose} className="rounded-md">{t("reject.cancel")}</Button>
            <motion.button onClick={handleConfirm} disabled={!reason.trim()}
              whileHover={reason.trim() ? { scale: 1.02 } : {}} whileTap={reason.trim() ? { scale: 0.98 } : {}}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm text-white transition-opacity", !reason.trim() ? "opacity-40 cursor-not-allowed" : "")}
              style={{ background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" }}>
              <Ban size={14} />{t("reject.confirm")}
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDERS SLIDE PANEL
// ─────────────────────────────────────────────────────────────
function OrdersSlidePanel({ open, onClose, orders, activeOrderCode, onSelectOrder }) {
  const t = useTranslations("warehouse.preparation");
  const locale = useLocale()
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm !z-[1000]" onClick={onClose} />
          <motion.div
            initial={{ x: locale !== "ltr" ? "-100%" : "100%" }} animate={{ x: 0 }} exit={{ x: locale !== "ltr" ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 ltr:right-0 rtl:left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-[1000000000] flex flex-col"
            dir="rtl">
            <div className="relative px-5 pt-5 pb-4 overflow-hidden bg-primary" >
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center">
                    <Layers className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-white/70 text-[11px]">{t("panel.subtitle")}</p>
                    <h3 className="text-white font-bold text-sm">{t("panel.title")}</h3>
                  </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center">
                  <X size={14} className="text-white" />
                </button>
              </div>
              <div className="relative mt-3">
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Package size={11} />{orders.length} {t("panel.orders")}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {orders.map((order) => {
                const total = order.products.reduce((s, p) => s + p.requestedQty, 0);
                const scanned = order.products.reduce((s, p) => s + (p.scannedQty || 0), 0);
                const pct = total === 0 ? 0 : Math.round((scanned / total) * 100);
                const isActive = activeOrderCode === order.code;
                return (
                  <motion.div key={order.code} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectOrder(order)}
                    className={cn("p-3 rounded-md border cursor-pointer transition-all",
                      isActive
                        ? "border-[#ff8b00]/50 bg-[#ff8b00]/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
                    )}>
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="font-mono font-bold text-sm" style={{ color: "#ff8b00" }}>{order.code}</span>
                      {pct === 100 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">{t("panel.done")}</span>}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-2 truncate">{order.customer}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-emerald-500" : "bg-[#ff8b00]")} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">{scanned}/{total}</span>
                    </div>
                  </motion.div>
                );
              })}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <Package size={36} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">{t("panel.empty")}</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPANDABLE ORDER TABLE ROW (inside scan panel)
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// ScannedOrderTable — Enhanced redesign
//
// Features:
//  • Gradient header with animated completion ring + shimmer
//  • Sticky header row with glassy frosted effect
//  • Per-row: scan ripple flash, done state green wash, just-scanned pulse
//  • Product image with zoom-in done overlay checkmark
//  • SKU badge with copy-on-click micro interaction
//  • Qty column: stacked arc mini-ring per item (not just a bar)
//  • Status badge: animated entrance, pulsing dot on "waiting"
//  • Completion celebration: confetti-like particle burst on 100%
//  • Row entrance stagger animation
//  • Scanline texture on header for industrial feel
// ─────────────────────────────────────────────────────────────

// ── Mini arc ring for qty column ──────────────────────────────
function QtyRing({ pct, done, size = 36, stroke = 3 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct / 100, 1));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={done ? "rgba(52,211,153,0.25)" : "rgba(203,213,225,0.5)"} strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={done ? "#10b981" : "#ff8b00"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

// ── Completion burst (simple radiating rings) ─────────────────
function CompletionBurst() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-md">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          initial={{ scale: 0.3, opacity: 0.7 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
          className="absolute w-8 h-8 rounded-full border-2 border-emerald-400"
        />
      ))}
    </div>
  );
}



// ── Main component ────────────────────────────────────────────
function ScannedOrderTable({ order, localProducts, justScanned }) {
  const t = useTranslations("warehouse.preparation");

  const totalScanned = localProducts.reduce((s, p) => s + (p.scannedQty || 0), 0);
  const totalQty = localProducts.reduce((s, p) => s + p.requestedQty, 0);
  const pct = totalQty === 0 ? 0 : Math.round((totalScanned / totalQty) * 100);
  const isAllDone = pct === 100 && totalQty > 0;

  // Track when we just hit 100%
  const [showBurst, setShowBurst] = React.useState(false);
  const prevPct = React.useRef(pct);
  React.useEffect(() => {
    if (pct === 100 && prevPct.current < 100) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1000);
    }
    prevPct.current = pct;
  }, [pct]);

  // SKU copy feedback
  const [copiedSku, setCopiedSku] = React.useState(null);
  const handleCopySku = (sku) => {
    navigator.clipboard?.writeText(sku).catch(() => { });
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-xl border overflow-hidden shadow-sm transition-all duration-500",
        isAllDone
          ? "border-emerald-300/70 dark:border-emerald-700/50 shadow-emerald-100 dark:shadow-emerald-900/20"
          : "border-slate-200 dark:border-slate-700"
      )}
    >

      {/* ── Order summary header ─────────────────────────────── */}
      <div
        className="relative overflow-hidden px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-700"
        style={{
          background: isAllDone
            ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #d1fae5 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        {/* scanline texture on header */}
        <div className="absolute inset-0 pointer-events-none" style={scanlineStyle} />

        {/* completion shimmer sweep */}
        <AnimatePresence>
          {showBurst && (
            <motion.div
              key="header-sweep"
              initial={{ x: "-100%", opacity: 0.6 }}
              animate={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.25), transparent)" }}
            />
          )}
        </AnimatePresence>

        <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2">

          {/* Arc progress ring */}
          <div className="relative flex-shrink-0">
            {showBurst && <CompletionBurst />}
            <div className="relative w-11 h-11">
              <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                <circle cx="22" cy="22" r="18" fill="none"
                  stroke={isAllDone ? "rgba(52,211,153,0.2)" : "rgba(203,213,225,0.5)"}
                  strokeWidth="3.5" />
                <motion.circle
                  cx="22" cy="22" r="18" fill="none"
                  stroke={isAllDone ? "#10b981" : "#ff8b00"}
                  strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 18}
                  animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - pct / 100) }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </svg>
              {/* centre % */}
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={pct}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className={cn(
                      "text-[9px] font-black tabular-nums leading-none",
                      isAllDone ? "text-emerald-600" : "text-[#ff8b00]"
                    )}
                  >{pct}%</motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Order code */}
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("table.orderNumber")}</p>
            <p className="font-mono font-black text-sm leading-none" style={{ color: "#ff8b00" }}>{order.code}</p>
          </div>

          {/* Tracking */}
          <div className="hidden sm:block min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("modal.trackingCode")}</p>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-300 font-bold">{order.trackingCode || "—"}</p>
          </div>

          {/* Customer */}
          <div className="hidden md:block min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("table.customer")}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{order.customer}</p>
          </div>

          {/* Carrier pill */}
          {order.carrier && <CarrierPill carrier={order.carrier} />}

          {/* Scanned count badge */}
          <div className="ms-auto flex-shrink-0 flex items-center gap-2">
            <motion.div
              key={totalScanned}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tabular-nums transition-colors duration-300",
                isAllDone
                  ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              )}
            >
              {isAllDone
                ? <CheckCircle2 size={11} className="text-emerald-500" />
                : <ScanLine size={11} style={{ color: "#ff8b00" }} />
              }
              {totalScanned}<span className="text-slate-300 dark:text-slate-600 font-normal">/</span>{totalQty}
            </motion.div>
          </div>

        </div>
      </div>

      {/* ── Products table ──────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/40">
              {["#", t("table.productName"), "SKU", t("table.shelf"), t("table.qty"), t("table.status")].map((h, i) => (
                <th key={i}
                  className={cn(
                    "py-2 px-4 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.08em]",
                    i === 0 ? "w-8 text-right" : i >= 4 ? "text-center" : "text-right"
                  )}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localProducts.map((p, i) => {
              const scanned = p.scannedQty || 0;
              const total = p.requestedQty;
              const done = scanned >= total;
              const isJust = justScanned === p.sku;
              const pct2 = total === 0 ? 0 : Math.round((scanned / total) * 100);
              const isCopied = copiedSku === p.sku;

              return (
                <motion.tr
                  key={p.sku}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    backgroundColor: isJust
                      ? ["rgba(255,139,0,0.10)", "rgba(255,139,0,0)"]
                      : "rgba(0,0,0,0)",
                  }}
                  transition={{
                    opacity: { delay: i * 0.04, duration: 0.2 },
                    x: { delay: i * 0.04, duration: 0.2 },
                    backgroundColor: { duration: 1.0 },
                  }}
                  className={cn(
                    "border-b border-slate-50 dark:border-slate-700/30 transition-colors duration-300",
                    done && "bg-emerald-50/60 dark:bg-emerald-950/10",
                    isJust && !done && "bg-[#ff8b00]/5"
                  )}
                >

                  {/* # index */}
                  <td className="px-4 py-3">
                    <motion.div
                      animate={isJust ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black"
                      style={{
                        backgroundColor: done ? "rgba(52,211,153,0.15)" : "#ff8b0015",
                        color: done ? "#059669" : "#ff8b00",
                      }}
                    >{i + 1}</motion.div>
                  </td>

                  {/* Product name + image */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {/* Image / icon with done overlay */}
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center border overflow-hidden transition-all duration-300",
                          done
                            ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30"
                            : isJust
                              ? "border-[#ff8b00]/40 bg-[#ff8b00]/5"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        )}>
                          {p.image
                            ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            : <Package size={15} className={done ? "text-emerald-400" : isJust ? "text-[#ff8b00]" : "text-slate-300"} />
                          }
                        </div>
                        {/* Done checkmark overlay */}
                        <AnimatePresence>
                          {done && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center"
                            >
                              <CheckCircle2 size={8} className="text-white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {/* Just-scanned scan pulse ring */}
                        <AnimatePresence>
                          {isJust && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0.8 }}
                              animate={{ scale: 1.6, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="absolute inset-0 rounded-lg border-2 border-[#ff8b00]"
                            />
                          )}
                        </AnimatePresence>
                      </div>

                      <span className={cn(
                        "font-semibold text-sm truncate max-w-[160px] transition-colors duration-300",
                        done ? "text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-100"
                      )}>{p.name}</span>
                    </div>
                  </td>

                  {/* SKU — click to copy */}
                  <td className="px-4 py-3">
                    <motion.button
                      type="button"
                      onClick={() => handleCopySku(p.sku)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="نسخ SKU"
                      className="relative inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded-md font-bold cursor-pointer transition-all duration-200"
                      style={{ backgroundColor: "#6763af14", color: "#6763af" }}
                    >
                      {isCopied ? (
                        <motion.span
                          key="copied"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1 text-emerald-600"
                        >
                          <CheckCircle2 size={9} /> نُسخ
                        </motion.span>
                      ) : (
                        <motion.span key="sku" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {p.sku}
                        </motion.span>
                      )}
                    </motion.button>
                  </td>

                  {/* Shelf location */}
                  <td className="px-4 py-3">
                    {p.shelfLocation ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <MapPin size={9} className="text-slate-400 flex-shrink-0" />{p.shelfLocation}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Qty — arc ring + count */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative">
                        <QtyRing pct={pct2} done={done} size={34} stroke={3} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={cn(
                            "text-[9px] font-black tabular-nums leading-none",
                            done ? "text-emerald-600" : "text-[#ff8b00]"
                          )}>{scanned}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start leading-none gap-0.5">
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 tabular-nums">{scanned}</span>
                        <div className="w-4 h-px bg-slate-300 dark:bg-slate-600" />
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">{total}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3 text-center">
                    <AnimatePresence mode="wait">
                      {done ? (
                        <motion.span
                          key="done"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full"
                        >
                          <CheckCircle2 size={10} strokeWidth={2.5} />
                          {t("scan.done")}
                        </motion.span>
                      ) : isJust ? (
                        <motion.span
                          key="just"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border"
                          style={{ backgroundColor: "#ff8b0015", color: "#ff8b00", borderColor: "#ff8b0030" }}
                        >
                          <motion.span
                            animate={{ rotate: [0, 15, -10, 0] }}
                            transition={{ duration: 0.4 }}
                            className="flex"
                          >
                            <ScanLine size={10} strokeWidth={2.5} />
                          </motion.span>
                          {t("scan.scanned")}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="waiting"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full"
                        >
                          {/* pulsing waiting dot */}
                          <motion.span
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0"
                          />
                          {t("scan.waiting")}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </td>

                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Completion footer bar ─────────────────────────────── */}
      <AnimatePresence>
        {isAllDone && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="relative px-4 py-3 flex items-center justify-center gap-2 overflow-hidden"
              style={{ background: "linear-gradient(90deg, #f0fdf4, #dcfce7, #f0fdf4)" }}>
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.18), transparent)" }}
              />
              <CheckCircle2 size={15} className="text-emerald-500 relative z-10" />
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 relative z-10" dir="rtl">
                {t("scan.orderComplete", { code: order.code })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}


export function ScanInputBar({ inputRef, value, onChange, onScan, disabled, isSuccess, isError, placeholder }) {
  const t = useTranslations("warehouse.preparation");
  const [isFocused, setIsFocused] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);

  // Trigger a brief "scanning" flash on button click
  const handleScan = React.useCallback(() => {
    if (disabled || !value?.trim()) return;
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 380);
    onScan();
  }, [disabled, value, onScan]);

  // Shake ref for error
  const [errorFlash, setErrorFlash] = React.useState(false);
  const prevIsError = React.useRef(isError);
  React.useEffect(() => {
    if (isError && !prevIsError.current) {
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 500);
    }
    prevIsError.current = isError;
  }, [isError]);

  const isActive = isFocused || !!value;
  const hasContent = !!value?.trim();

  return (
    <motion.div
      animate={errorFlash ? { x: [0, -6, 7, -4, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="relative"
    >
      {/* ── Corner bracket indicators ──────────────────────── */}
      {/* Top-left */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0.2, scale: isActive ? 1 : 0.92 }}
        transition={{ duration: 0.2 }}
        className="absolute -top-[3px] -left-[3px] w-3.5 h-3.5 pointer-events-none z-20"
      >
        <div className={cn(
          "absolute top-0 left-0 w-full h-[2px] rounded-full transition-colors duration-300",
          isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-[#ff8b00]" : "bg-slate-300 dark:bg-slate-600"
        )} />
        <div className={cn(
          "absolute top-0 left-0 h-full w-[2px] rounded-full transition-colors duration-300",
          isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-[#ff8b00]" : "bg-slate-300 dark:bg-slate-600"
        )} />
      </motion.div>
      {/* Top-right */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0.2, scale: isActive ? 1 : 0.92 }}
        transition={{ duration: 0.2 }}
        className="absolute -top-[3px] -right-[3px] w-3.5 h-3.5 pointer-events-none z-20"
      >
        <div className={cn(
          "absolute top-0 right-0 w-full h-[2px] rounded-full transition-colors duration-300",
          isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-[#ff8b00]" : "bg-slate-300 dark:bg-slate-600"
        )} />
        <div className={cn(
          "absolute top-0 right-0 h-full w-[2px] rounded-full transition-colors duration-300",
          isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-[#ff8b00]" : "bg-slate-300 dark:bg-slate-600"
        )} />
      </motion.div>
      {/* Bottom-left */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0.2, scale: isActive ? 1 : 0.92 }}
        transition={{ duration: 0.2 }}
        className="absolute -bottom-[3px] -left-[3px] w-3.5 h-3.5 pointer-events-none z-20"
      >
        <div className={cn(
          "absolute bottom-0 left-0 w-full h-[2px] rounded-full transition-colors duration-300",
          isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-[#ff8b00]" : "bg-slate-300 dark:bg-slate-600"
        )} />
        <div className={cn(
          "absolute bottom-0 left-0 h-full w-[2px] rounded-full transition-colors duration-300",
          isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-[#ff8b00]" : "bg-slate-300 dark:bg-slate-600"
        )} />
      </motion.div>
      {/* Bottom-right */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0.2, scale: isActive ? 1 : 0.92 }}
        transition={{ duration: 0.2 }}
        className="absolute -bottom-[3px] -right-[3px] w-3.5 h-3.5 pointer-events-none z-20"
      >
        <div className={cn(
          "absolute bottom-0 right-0 w-full h-[2px] rounded-full transition-colors duration-300",
          isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-[#ff8b00]" : "bg-slate-300 dark:bg-slate-600"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 h-full w-[2px] rounded-full transition-colors duration-300",
          isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-[#ff8b00]" : "bg-slate-300 dark:bg-slate-600"
        )} />
      </motion.div>

      {/* ── Main bar ─────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex items-center rounded-md border transition-all duration-250 overflow-hidden",
          disabled && "opacity-50 pointer-events-none",
          // idle / typing
          !isSuccess && !isError && !isFocused && "border-border bg-background/60",
          !isSuccess && !isError && isFocused && "border-[#ff8b00]/70 bg-background shadow-[0_0_0_3px_rgba(255,139,0,0.10)]",
          // success
          isSuccess && "border-emerald-500 bg-background shadow-[0_0_0_3px_rgba(16,185,129,0.12)]",
          // error
          isError && "border-red-500 bg-background shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
        )}
        style={{ height: 46 }}
      >

        {/* ── Success fill sweep ──────────────────────────────── */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              key="success-sweep"
              initial={{ x: "-100%", opacity: 0.7 }}
              animate={{ x: "100%", opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="absolute inset-0 pointer-events-none z-0"
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.18) 50%, transparent 100%)" }}
            />
          )}
        </AnimatePresence>

        {/* ── Error flash ──────────────────────────────────────── */}
        <AnimatePresence>
          {errorFlash && (
            <motion.div
              key="error-flash"
              initial={{ opacity: 0.15 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-red-400 pointer-events-none z-0 rounded-md"
            />
          )}
        </AnimatePresence>

        {/* ── Breathing glow while focused + typing ─────────────── */}
        <AnimatePresence>
          {isFocused && !isSuccess && !isError && (
            <motion.div
              key="focus-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 pointer-events-none rounded-md"
              style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,139,0,0.06) 0%, transparent 70%)" }}
            />
          )}
        </AnimatePresence>

        {/* ── Scan beam (laser line) while typing ────────────────── */}
        <AnimatePresence>
          {hasContent && !isSuccess && !isError && (
            <motion.div
              key="beam"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-hidden pointer-events-none rounded-md"
            >
              {/* The beam: a thin vertical laser line sweeping L→R */}
              <motion.div
                animate={{ left: ["-4%", "104%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 0.4 }}
                className="absolute inset-y-0 w-[2px]"
                style={{
                  background: "linear-gradient(180deg, transparent 0%, rgba(255,139,0,0.0) 15%, rgba(255,139,0,0.55) 45%, rgba(255,187,0,0.7) 50%, rgba(255,139,0,0.55) 55%, rgba(255,139,0,0.0) 85%, transparent 100%)",
                  filter: "blur(0.8px)",
                }}
              />
              {/* Glow halo around the beam */}
              <motion.div
                animate={{ left: ["-8%", "100%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 0.4 }}
                className="absolute inset-y-0 w-[14px]"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,139,0,0.06), transparent)",
                  filter: "blur(2px)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Left icon ──────────────────────────────────────────── */}
        <div className="ps-3 flex-shrink-0 z-10 relative">
          <motion.div
            animate={isScanning ? { rotate: [0, -15, 15, -8, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.35 }}
          >
            <ScanLine
              size={16}
              className={cn(
                "transition-colors duration-200",
                isSuccess ? "text-emerald-500"
                  : isError ? "text-red-500"
                    : isFocused ? "text-[#ff8b00]"
                      : "text-muted-foreground/80"
              )}
            />
          </motion.div>
        </div>

        {/* ── Micro LED divider ──────────────────────────────────── */}
        <div className="relative flex-shrink-0 mx-2.5 z-10">
          <div className="w-px h-4 bg-border/50" />
          {/* LED dot */}
          <motion.div
            animate={
              isSuccess ? { backgroundColor: "#10b981", scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } :
                isError ? { backgroundColor: "#ef4444", scale: [1, 1.4, 1] } :
                  isFocused ? { backgroundColor: "#ff8b00", scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } :
                    { backgroundColor: "#94a3b8", scale: 1 }
            }
            transition={
              isSuccess ? { duration: 1.2, repeat: Infinity } :
                isFocused ? { duration: 1.8, repeat: Infinity } :
                  { duration: 0.3 }
            }
            className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
          />
        </div>

        {/* ── Text input ─────────────────────────────────────────── */}
        <input
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={e => { if (e.key === "Enter") handleScan(); }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus
          disabled={disabled}
          dir="rtl"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "relative z-10 flex-1 h-full bg-transparent border-none !outline-none focus:ring-0",
            "text-sm font-semibold text-foreground",
            "placeholder:text-muted-foreground/80disabled:cursor-not-allowed",
            "px-1",
          )}
        />

        {/* ── Clear button ───────────────────────────────────────── */}
        <AnimatePresence>
          {value && (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={() => { onChange({ target: { value: "" } }); inputRef?.current?.focus(); }}
              className="relative z-10 flex-shrink-0 mx-1.5 w-[18px] h-[18px] rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <X size={9} className="text-slate-500 dark:text-slate-400" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Scan button ────────────────────────────────────────── */}
        <div className="pe-2 flex-shrink-0 relative z-10">
          <motion.button
            type="button"
            onClick={handleScan}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.04 } : {}}
            whileTap={!disabled ? { scale: 0.93 } : {}}
            animate={
              isSuccess ? { scale: [1, 1.06, 1] } :
                isError ? { scale: [1, 0.94, 1] } :
                  isScanning ? { scale: [1, 0.9, 1.05, 1] } : {}
            }
            transition={{ duration: 0.3 }}
            className={cn(
              "relative h-8 px-3.5 rounded-[6px] cursor-pointer overflow-hidden",
              "text-white text-xs font-black flex items-center gap-1.5",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
            style={{
              background: isSuccess
                ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                : isError
                  ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                  : "linear-gradient(135deg, var(--primary, #ff8b00) 0%, #ff5c2b 100%)",
              boxShadow: isSuccess
                ? "0 2px 10px -2px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.2)"
                : isError
                  ? "0 2px 10px -2px rgba(239,68,68,0.55), inset 0 1px 0 rgba(255,255,255,0.2)"
                  : "0 2px 10px -2px rgba(255,139,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
          >
            {/* Barcode stripe texture on button */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1.5px, transparent 1.5px, transparent 4px)",
              }}
            />
            {/* Top gloss */}
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/22 to-transparent rounded-t-[6px]" />

            {/* Icon morphs by state */}
            <motion.span
              key={isSuccess ? "check" : isError ? "x" : "scan"}
              initial={{ opacity: 0, rotate: -15, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center"
            >
              {isSuccess ? (
                <CheckCircle2 size={12} strokeWidth={2.5} />
              ) : isError ? (
                <X size={12} strokeWidth={2.5} />
              ) : (
                <ScanLine size={12} strokeWidth={2.5} />
              )}
            </motion.span>

            {/* Label morphs by state */}
            <motion.span
              key={isSuccess ? "done" : isError ? "err" : "scan-lbl"}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="relative text-[11px]"
            >
              {isSuccess
                ? t("scan.done")
                : isError
                  ? t("scan.retry")
                  : t("scan.scanBtn")}
            </motion.span>
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}


function ArcRing({ progress, size = 52, stroke = 3.5, color, trackColor }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(progress, 1));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
      {/* track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      {/* fill */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
    </svg>
  );
}
const scanlineStyle = {
  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.018) 3px, rgba(0,0,0,0.018) 4px)",
  backgroundSize: "100% 4px",
};
export function ScanLogBoxes({ successCount, errorCount }) {
  const t = useTranslations("warehouse.preparation");

  // Track previous errorCount to detect increment for shake
  const prevErrorRef = React.useRef(errorCount);
  const [shaking, setShaking] = React.useState(false);

  React.useEffect(() => {
    if (errorCount > prevErrorRef.current) {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
    prevErrorRef.current = errorCount;
  }, [errorCount]);

  // Arc progress: grows relative to total scans, capped at 100%
  const total = successCount + errorCount;
  const successArc = total > 0 ? successCount / total : 0;

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">

      {/* ══ SUCCESS CARD ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="group relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-700/40 p-4"
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)",
        }}
      >
        {/* scanline texture */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={scanlineStyle} />

        {/* shimmer sweep on hover / new scan */}
        <motion.div
          key={`shimmer-${successCount}`}
          initial={{ x: "-110%" }}
          animate={{ x: "110%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/3 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", zIndex: 1 }}
        />

        {/* geometric corner accent — top-left rotated squares */}
        <div className="absolute -top-3 -left-3 w-10 h-10 rounded-md border-2 border-emerald-300/40 rotate-12 dark:border-emerald-600/30" />
        <div className="absolute -top-1 -left-1 w-6 h-6 rounded-sm border border-emerald-400/30 rotate-6 dark:border-emerald-500/25" />

        {/* large decorative blob bottom-right */}
        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-emerald-300/20 dark:bg-emerald-500/10" />

        <div className="relative z-10 flex items-center gap-3">
          {/* Arc ring icon */}
          <div className="relative flex-shrink-0 w-[52px] h-[52px]">
            <ArcRing
              progress={successArc}
              color="#16a34a"
              trackColor="rgba(134,239,172,0.35)"
            />
            {/* inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 38 38" fill="none">
                <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" />
                <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#1B9928" strokeDasharray="2 2" />
                <path d="M20.2793 27.75L21.5293 29H11.5V11.5H16.5C16.5 11.1549 16.5651 10.8327 16.6953 10.5332C16.8255 10.2337 17.0046 9.9668 17.2324 9.73242C17.4603 9.49805 17.724 9.31901 18.0234 9.19531C18.3229 9.07161 18.6484 9.00651 19 9C19.3451 9 19.6673 9.0651 19.9668 9.19531C20.2663 9.32552 20.5332 9.50456 20.7676 9.73242C21.002 9.96029 21.181 10.224 21.3047 10.5234C21.4284 10.8229 21.4935 11.1484 21.5 11.5H26.5V21.5293L25.25 22.7793V12.75H24V15.25H14V12.75H12.75V27.75H20.2793ZM15.25 12.75V14H22.75V12.75H20.25V11.5C20.25 11.3242 20.2174 11.1615 20.1523 11.0117C20.0872 10.862 19.9993 10.7318 19.8887 10.6211C19.778 10.5104 19.6445 10.4193 19.4883 10.3477C19.332 10.276 19.1693 10.2435 19 10.25C18.8242 10.25 18.6615 10.2826 18.5117 10.3477C18.362 10.4128 18.2318 10.5007 18.1211 10.6113C18.0104 10.722 17.9193 10.8555 17.8477 11.0117C17.776 11.168 17.7435 11.3307 17.75 11.5V12.75H15.25ZM28.8145 23.1895L23.375 28.6387L20.748 26.002L21.627 25.123L23.375 26.8613L27.9355 22.3105L28.8145 23.1895Z" fill="#1B9928" />
              </svg>
            </div>
          </div>

          {/* text */}
          <div className="flex-1 min-w-0" dir="rtl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-600/65 dark:text-emerald-400/60 mb-1 leading-none">
              {t("scan.scannedOrders")}
            </p>
            <AnimatePresence mode="wait">
              <motion.span
                key={successCount}
                initial={{ opacity: 0, filter: "blur(6px)", y: -8 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(6px)", y: 8 }}
                transition={{ type: "spring", stiffness: 480, damping: 26 }}
                className="block text-[2.6rem] font-black tabular-nums leading-none text-emerald-700 dark:text-emerald-400"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {successCount}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* right accent SVG */}
          <svg width="42" height="42" viewBox="0 0 45 45" fill="none" className="flex-shrink-0 opacity-80">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M22.5 41.25C32.8556 41.25 41.25 32.8556 41.25 22.5C41.25 12.1444 32.8556 3.75 22.5 3.75C12.1444 3.75 3.75 12.1444 3.75 22.5C3.75 32.8556 12.1444 41.25 22.5 41.25ZM32.5706 16.5656C32.6583 16.4753 32.727 16.3682 32.7724 16.2507C32.8178 16.1332 32.8391 16.0078 32.8349 15.882C32.8308 15.7561 32.8014 15.6323 32.7484 15.5181C32.6954 15.4039 32.6199 15.3015 32.5265 15.217C32.433 15.1326 32.3235 15.0679 32.2045 15.0267C32.0855 14.9855 31.9594 14.9687 31.8338 14.9773C31.7081 14.986 31.5855 15.0198 31.4732 15.0768C31.361 15.1339 31.2613 15.213 31.1803 15.3094L19.95 27.7191L13.7719 21.8212C13.5921 21.6494 13.3515 21.5561 13.1028 21.5617C12.8542 21.5673 12.6181 21.6715 12.4462 21.8512C12.2744 22.031 12.1811 22.2717 12.1867 22.5203C12.1923 22.7689 12.2965 23.0051 12.4762 23.1769L19.3519 29.7394L20.0484 30.405L20.6944 29.6906L32.5706 16.5656Z"
              fill="#2F9139" />
          </svg>
        </div>

        {/* bottom micro-bar: percentage of correct scans */}
        <div className="relative z-10 mt-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-emerald-200/60 dark:bg-emerald-800/40 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              animate={{ width: `${Math.round(successArc * 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400/50 tabular-nums w-8 text-left">
            {total > 0 ? `${Math.round(successArc * 100)}%` : "—"}
          </span>
        </div>
      </motion.div>

      {/* ══ ERROR CARD ════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={shaking
          ? { opacity: 1, x: [0, -5, 6, -4, 3, 0], y: 0 }
          : { opacity: 1, x: 0, y: 0 }
        }
        transition={shaking
          ? { duration: 0.45, ease: "easeInOut" }
          : { delay: 0.08 }
        }
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
          errorCount > 0
            ? "border-red-200/80 dark:border-red-700/40"
            : "border-slate-200/70 dark:border-slate-700/40"
        )}
        style={{
          background: errorCount > 0
            ? "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        {/* scanline texture */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={scanlineStyle} />

        {/* red flash overlay on shake */}
        <AnimatePresence>
          {shaking && (
            <motion.div
              initial={{ opacity: 0.18 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 rounded-2xl bg-red-400 pointer-events-none z-20"
            />
          )}
        </AnimatePresence>

        {/* geometric corner accent */}
        <div className={cn(
          "absolute -top-3 -left-3 w-10 h-10 rounded-md border-2 rotate-12 transition-colors duration-300",
          errorCount > 0 ? "border-red-300/40 dark:border-red-600/30" : "border-slate-300/30 dark:border-slate-600/20"
        )} />
        <div className={cn(
          "absolute -top-1 -left-1 w-6 h-6 rounded-sm border rotate-6 transition-colors duration-300",
          errorCount > 0 ? "border-red-400/30 dark:border-red-500/25" : "border-slate-300/25 dark:border-slate-600/15"
        )} />

        {/* large decorative blob */}
        <div className={cn(
          "absolute -bottom-4 -right-4 w-24 h-24 rounded-full transition-colors duration-300",
          errorCount > 0 ? "bg-red-300/20 dark:bg-red-500/10" : "bg-slate-200/20 dark:bg-slate-600/10"
        )} />

        <div className="relative z-10 flex items-center gap-3">
          {/* static ring icon (no progress arc — errors don't "progress") */}
          <div className="relative flex-shrink-0 w-[52px] h-[52px]">
            {/* pulsing ring when errors exist */}
            <AnimatePresence>
              {errorCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.3, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-2 border-red-400/50"
                />
              )}
            </AnimatePresence>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 38 38" fill="none">
                <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" />
                <rect x="0.5" y="0.5" width="37" height="37" rx="18.5"
                  stroke={errorCount > 0 ? "#A32E2E" : "#CBD5E1"} strokeDasharray="2 2" />
                <path d="M20.2793 27.75L21.5293 29H11.5V11.5H16.5C16.5 11.1549 16.5651 10.8327 16.6953 10.5332C16.8255 10.2337 17.0046 9.9668 17.2324 9.73242C17.4603 9.49805 17.724 9.31901 18.0234 9.19531C18.3229 9.07161 18.6484 9.00651 19 9C19.3451 9 19.6673 9.0651 19.9668 9.19531C20.2663 9.32552 20.5332 9.50456 20.7676 9.73242C21.002 9.96029 21.181 10.224 21.3047 10.5234C21.4284 10.8229 21.4935 11.1484 21.5 11.5H26.5V21.5293L25.25 22.7793V12.75H24V15.25H14V12.75H12.75V27.75H20.2793ZM15.25 12.75V14H22.75V12.75H20.25V11.5C20.25 11.3242 20.2174 11.1615 20.1523 11.0117C20.0872 10.862 19.9993 10.7318 19.8887 10.6211C19.778 10.5104 19.6445 10.4193 19.4883 10.3477C19.332 10.276 19.1693 10.2435 19 10.25C18.8242 10.25 18.6615 10.2826 18.5117 10.3477C18.362 10.4128 18.2318 10.5007 18.1211 10.6113C18.0104 10.722 17.9193 10.8555 17.8477 11.0117C17.776 11.168 17.7435 11.3307 17.75 11.5V12.75H15.25ZM28.8145 23.1895L23.375 28.6387L20.748 26.002L21.627 25.123L23.375 26.8613L27.9355 22.3105L28.8145 23.1895Z"
                  fill={errorCount > 0 ? "#A32E2E" : "#CBD5E1"} />
              </svg>
            </div>
          </div>

          {/* text */}
          <div className="flex-1 min-w-0" dir="rtl">
            <p className={cn(
              "text-[11px] font-extrabold uppercase tracking-[0.12em] mb-1 leading-none transition-colors duration-300",
              errorCount > 0 ? "text-red-600/65 dark:text-red-400/60" : "text-slate-400/70 dark:text-slate-500/60"
            )}>
              {t("scan.failedScans")}
            </p>
            <AnimatePresence mode="wait">
              <motion.span
                key={errorCount}
                initial={{ opacity: 0, filter: "blur(6px)", y: -8 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(6px)", y: 8 }}
                transition={{ type: "spring", stiffness: 480, damping: 26 }}
                className={cn(
                  "block text-[2.6rem] font-black tabular-nums leading-none transition-colors duration-300",
                  errorCount > 0 ? "text-red-700 dark:text-red-400" : "text-slate-300 dark:text-slate-600"
                )}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {errorCount}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* right accent SVG */}
          <svg width="42" height="42" viewBox="0 0 45 45" fill="none" className="flex-shrink-0 opacity-80">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M22.5 41.25C32.8556 41.25 41.25 32.8556 41.25 22.5C41.25 12.1444 32.8556 3.75 22.5 3.75C12.1444 3.75 3.75 12.1444 3.75 22.5C3.75 32.8556 12.1444 41.25 22.5 41.25ZM30.1238 14.8763C30.3871 15.1399 30.535 15.4973 30.535 15.87C30.535 16.2427 30.3871 16.6001 30.1238 16.8638L24.4875 22.5L30.1219 28.1344C30.3703 28.401 30.5055 28.7535 30.4991 29.1179C30.4926 29.4822 30.3451 29.8298 30.0874 30.0874C29.8298 30.3451 29.4822 30.4926 29.1179 30.4991C28.7535 30.5055 28.401 30.3703 28.1344 30.1219L22.5 24.4913L16.8656 30.1256C16.7369 30.2638 16.5816 30.3746 16.4091 30.4515C16.2366 30.5283 16.0504 30.5697 15.8616 30.573C15.6728 30.5763 15.4852 30.5416 15.3101 30.4709C15.135 30.4001 14.976 30.2949 14.8424 30.1613C14.7089 30.0278 14.6036 29.8687 14.5329 29.6936C14.4622 29.5185 14.4274 29.331 14.4308 29.1421C14.4341 28.9533 14.4754 28.7671 14.5523 28.5946C14.6291 28.4221 14.74 28.2669 14.8781 28.1381L20.5087 22.5L14.8763 16.8656C14.7381 16.7369 14.6273 16.5816 14.5504 16.4091C14.4736 16.2366 14.4322 16.0504 14.4289 15.8616C14.4256 15.6728 14.4603 15.4852 14.531 15.3101C14.6017 15.135 14.707 14.976 14.8406 14.8424C14.9741 14.7089 15.1332 14.6036 15.3083 14.5329C15.4834 14.4622 15.6709 14.4274 15.8597 14.4308C16.0485 14.4341 16.2348 14.4754 16.4073 14.5523C16.5798 14.6291 16.735 14.74 16.8638 14.8781L22.5 20.5087L28.1344 14.8744C28.398 14.611 28.7555 14.4631 29.1281 14.4631C29.5008 14.4631 29.8582 14.611 30.1219 14.8744"
              fill={errorCount > 0 ? "#F04665" : "#CBD5E1"} />
          </svg>
        </div>

        {/* bottom micro-bar: error rate */}
        <div className="relative z-10 mt-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-slate-200/60 dark:bg-slate-700/40 overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                errorCount > 0
                  ? "bg-gradient-to-r from-red-500 to-rose-400"
                  : "bg-slate-300/50"
              )}
              animate={{ width: total > 0 ? `${Math.round((errorCount / total) * 100)}%` : "0%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className={cn(
            "text-[10px] font-black tabular-nums w-8 text-left transition-colors duration-300",
            errorCount > 0 ? "text-red-600/60 dark:text-red-400/50" : "text-slate-300 dark:text-slate-600"
          )}>
            {total > 0 ? `${Math.round((errorCount / total) * 100)}%` : "—"}
          </span>
        </div>
      </motion.div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCAN WORKFLOW PANEL
// ─────────────────────────────────────────────────────────────
function ScanWorkflowPanel({ orders, updateOrder, pushOp, onOpenPanel, jumpToOrder }) {
  const t = useTranslations("warehouse.preparation");

  const [scanStep, setScanStep] = useState("order");
  const [scanValue, setScanValue] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);
  const [localProducts, setLocalProducts] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [scanState, setScanState] = useState("idle"); // idle | success | error

  // ── Persistent across orders — NOT reset when a new order is loaded ──
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const [justScanned, setJustScanned] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scanInputRef = useRef(null);

  // ── Auto-load an order jumped from InProgressSubtab ──
  useEffect(() => {
    if (!jumpToOrder) return;
    setActiveOrder(jumpToOrder);
    setLocalProducts(jumpToOrder.products.map((p) => ({ ...p, scannedQty: p.scannedQty || 0 })));
    setScanStep("items");
    setScanValue("");
    setTimeout(() => scanInputRef.current?.focus(), 120);
  }, [jumpToOrder]);

  useEffect(() => {
    if (scanInputRef.current) scanInputRef.current.focus();
  }, [scanStep, activeOrder]);

  const showFeedback = useCallback((type, msg) => {
    setFeedback({ type, msg });
    setScanState(type);
    setTimeout(() => { setFeedback(null); setScanState("idle"); }, 2200);
  }, []);

  const resetCurrentOrder = useCallback(() => {
    setScanStep("order");
    setScanValue("");
    setActiveOrder(null);
    setLocalProducts([]);
    setJustScanned(null);
    // intentionally NOT resetting successCount / errorCount
    setTimeout(() => scanInputRef.current?.focus(), 100);
  }, []);

  const handleScan = useCallback(() => {
    const val = scanValue.trim();
    if (!val) return;

    if (scanStep === "order") {
      const found = orders.find((o) => o.code === val || o.trackingCode === val);
      if (found) {
        setActiveOrder(found);
        setLocalProducts(found.products.map((p) => ({ ...p, scannedQty: p.scannedQty || 0 })));
        setScanStep("items");
        setScanValue("");
        if (soundEnabled) playBeep("success");
        showFeedback("success", t("scan.orderFound", { code: found.code }));
      } else {
        if (soundEnabled) playBeep("error");
        setErrorCount((c) => c + 1);
        showFeedback("error", t("scan.orderNotFound"));
        setScanValue("");
      }
    } else {
      const productIndex = localProducts.findIndex((p) => p.sku === val || p.barcode === val);
      if (productIndex === -1) {
        if (soundEnabled) playBeep("error");
        setErrorCount((c) => c + 1);
        showFeedback("error", t("scan.barcodeNotFound", { val }));
        setScanValue("");
        return;
      }
      const product = localProducts[productIndex];
      if (product.scannedQty >= product.requestedQty) {
        if (soundEnabled) playBeep("error");
        setErrorCount((c) => c + 1);
        showFeedback("error", t("scan.alreadyScanned", { name: product.name }));
        setScanValue("");
        return;
      }
      const updated = localProducts.map((p, i) =>
        i === productIndex ? { ...p, scannedQty: p.scannedQty + 1 } : p
      );
      setLocalProducts(updated);
      setJustScanned(product.sku);
      setTimeout(() => setJustScanned(null), 900);
      setSuccessCount((c) => c + 1);
      if (soundEnabled) playBeep("success");
      showFeedback("success", t("scan.itemScanned", { name: product.name }));
      setScanValue("");

      const allDone = updated.every((p) => p.scannedQty >= p.requestedQty);
      if (allDone) {
        const now = new Date().toISOString().slice(0, 16).replace("T", " ");
        updateOrder(activeOrder.code, { status: STATUS.PREPARED, products: updated, preparedAt: now });
        pushOp({
          id: `OP-${Date.now()}`, operationType: "PREPARE_ORDER",
          orderCode: activeOrder.code, carrier: activeOrder.carrier || "-",
          employee: "System", result: "SUCCESS",
          details: t("scan.orderPreparedLog"), createdAt: now,
        });
        setTimeout(() => {
          showFeedback("success", t("scan.orderComplete", { code: activeOrder.code }));
          resetCurrentOrder();
        }, 900);
      } else {
        updateOrder(activeOrder.code, { products: updated });
      }
    }
  }, [scanValue, scanStep, orders, localProducts, activeOrder, soundEnabled, updateOrder, pushOp, showFeedback, resetCurrentOrder, t]);

  const isItemsMode = scanStep === "items";
  const accuracy = (successCount + errorCount) > 0
    ? Math.round((successCount / (successCount + errorCount)) * 100)
    : null;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-white dark:bg-slate-800/80 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

        {/* ── Gradient header ── */}
        <div className="relative px-5 py-4 overflow-hidden bg-primary">
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
          {/* animated pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.14, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-6 -translate-y-1/2 w-14 h-14 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)" }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <ScanLine className="text-white" size={20} />
              </div>
              <div>
                <p className="text-white/70 text-[11px] font-medium">
                  {!isItemsMode ? t("scan.step1of2") : `${t("scan.orderLabel")}: ${activeOrder?.code}`}
                </p>
                <h3 className="text-white font-black text-sm tracking-tight">
                  {!isItemsMode ? t("scan.scanOrderTitle") : t("scan.scanItemsTitle")}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setSoundEnabled((v) => !v)}
                className="w-8 h-8 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                {soundEnabled ? <Volume2 size={14} className="text-white" /> : <VolumeX size={14} className="text-white/60" />}
              </button>
              <button onClick={onOpenPanel}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors">
                <Layers size={13} />{t("scan.ordersBtn")}
              </button>
              {isItemsMode && (
                <button onClick={resetCurrentOrder}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors">
                  <X size={13} />{t("scan.cancelBtn")}
                </button>
              )}
            </div>
          </div>
          {/* Step dots */}
          <div className="relative mt-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className={cn("h-px flex-1 max-w-[24px] rounded-full transition-all duration-500", isItemsMode ? "bg-white" : "bg-white/30")} />
            <div className={cn("w-2 h-2 rounded-full transition-all duration-500", isItemsMode ? "bg-white" : "bg-white/30")} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-4">
          <div className="relative">
            <div className={cn(
              "absolute inset-0 rounded-md transition-all duration-300 pointer-events-none z-10",
              scanState === "success" ? "ring-2 ring-emerald-400/40" : scanState === "error" ? "ring-2 ring-red-400/40" : ""
            )} />
            <ScanInputBar
              inputRef={scanInputRef}
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onScan={handleScan}
              disabled={false}
              isSuccess={scanState === "success"}
              isError={scanState === "error"}
              placeholder={!isItemsMode
                ? t("scan.scanOrderPlaceholder")
                : t("scan.scanItemsPlaceholder", { code: activeOrder?.code })}
            />
          </div>

          {/* Feedback toast */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-md border text-sm font-semibold",
                  feedback.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300"
                )}>
                {feedback.type === "success"
                  ? <CheckCircle2 size={15} className="flex-shrink-0" />
                  : <AlertCircle size={15} className="flex-shrink-0" />}
                {feedback.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent scan log boxes */}
          {<ScanLogBoxes successCount={successCount} errorCount={errorCount} />}


          {/* Items table */}
          {isItemsMode && activeOrder && (
            <ScannedOrderTable order={activeOrder} localProducts={localProducts} justScanned={justScanned} />
          )}

          {/* Ready state */}
          {!isItemsMode && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-md flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, #ff8b0015, #ffb70315)", border: "1px dashed #ff8b0040" }}
              >
                <ScanLine size={28} style={{ color: "#ff8b00" }} />
              </motion.div>
              <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">{t("scan.readyTitle")}</p>
              <p className="text-sm text-slate-400">{t("scan.readySubtitle")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// IN PROGRESS SUBTAB
// Scan icon calls onPrepareOrder → navigates to scanning tab
// and auto-loads that order
// ─────────────────────────────────────────────────────────────
function InProgressSubtab({ orders, updateOrder, pushOp, onPrepareOrder, onPrepareMultiple, resetToken }) {
  const t = useTranslations("warehouse.preparation");
  const preparing = useMemo(() => orders.filter((o) => o.status === STATUS.PREPARING), [orders]);

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ carrier: "all" });
  const [detailModal, setDetailModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  React.useEffect(() => {
    setSearch(""); setFilters({ carrier: "all" }); setSelectedOrders([]);
    setDetailModal(null); setRejectModal(null);
    setPage({ current_page: 1, per_page: 12 });
  }, [resetToken]);

  const filtered = useMemo(() => {
    let base = preparing;
    const q = search.trim().toLowerCase();
    if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city].some((x) => String(x || "").toLowerCase().includes(q)));
    if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
    return base;
  }, [preparing, search, filters]);

  const toggleOrder = (code) => setSelectedOrders((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  const selectAll = () => setSelectedOrders(selectedOrders.length === filtered.length ? [] : filtered.map((o) => o.code));

  const handleConfirmReject = useCallback((row, reason) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    updateOrder(row.code, { status: STATUS.REJECTED, rejectReason: reason, rejectedAt: now });
    pushOp({ id: `OP-${Date.now()}`, operationType: "REJECT_ORDER", orderCode: row.code, carrier: row.carrier || "-", employee: "System", result: "FAILED", details: reason, createdAt: now });
  }, [updateOrder, pushOp]);

  const columns = useMemo(() => [
    {
      key: "select",
      header: (<div className="flex items-center justify-center"><Checkbox checked={filtered.length > 0 && selectedOrders.length === filtered.length} onCheckedChange={selectAll} /></div>),
      className: "w-[48px]",
      cell: (row) => (<div className="flex items-center justify-center"><Checkbox checked={selectedOrders.includes(row.code)} onCheckedChange={() => toggleOrder(row.code)} /></div>),
    },
    { key: "code", header: t("table.orderNumber"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00]">{row.code}</span> },
    { key: "customer", header: t("table.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
    { key: "phone", header: t("table.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm">{row.phone}</span> },
    { key: "city", header: t("table.city") },
    { key: "carrier", header: t("table.carrier"), cell: (row) => row.carrier ? <CarrierPill carrier={row.carrier} /> : <span className="text-slate-400 text-sm italic">{t("unspecified")}</span> },
    { key: "products", header: t("table.products"), cell: (row) => <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-sm font-semibold">{row.products.length} {t("product")}</span> },
    { key: "progress", header: t("table.scanProgress"), cell: (row) => <ScanProgress products={row.products} /> },
    { key: "assignedEmployee", header: t("table.employee") },
    {
      key: "actions", header: t("table.actions"),
      cell: (row) => (
        <ActionButtons row={row} actions={[
          { icon: <Info />, tooltip: t("actions.details"), onClick: (r) => setDetailModal(r), variant: "primary" },
          // ← clicking this goes to scanning subtab and auto-loads the order
          { icon: <ScanLine />, tooltip: t("actions.continuePrepare"), onClick: (r) => onPrepareOrder?.(r), variant: "primary" },
          { icon: <Ban />, tooltip: t("actions.reject"), onClick: (r) => setRejectModal(r), variant: "red" },
        ]} />
      ),
    },
  ], [filtered, selectedOrders, t, onPrepareOrder]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search} onSearchChange={setSearch} onSearch={() => { }}
        labels={{ searchPlaceholder: t("searchPlaceholder"), filter: t("filter"), apply: t("apply"), total: t("total"), limit: t("limit"), emptyTitle: t("inProgress.emptyTitle"), emptySubtitle: "" }}
        actions={[{ key: "export", label: t("export"), icon: <FileDown size={14} />, color: "blue", onClick: () => { } }]}
        hasActiveFilters={filters.carrier !== "all"} onApplyFilters={() => { }}
        filters={
          <FilterField label={t("filters.carrier")}>
            <Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
              <SelectTrigger className="h-10 rounded-md border-border bg-background text-sm"><SelectValue placeholder={t("filters.allCarriers")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
                {CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
        }
        columns={columns} data={filtered} isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />
      <OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
      <RejectOrderModal open={!!rejectModal} onClose={() => setRejectModal(null)} order={rejectModal} onConfirm={handleConfirmReject} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PREPARED SUBTAB
// ─────────────────────────────────────────────────────────────
function PreparedSubtab({ orders, setDistributionDialog, setSelectedOrdersGlobal, resetToken }) {
  const t = useTranslations("warehouse.preparation");
  const prepared = useMemo(() => orders.filter((o) => o.status === STATUS.PREPARED), [orders]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ carrier: "all" });
  const [detailModal, setDetailModal] = useState(null);
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  React.useEffect(() => {
    setSearch(""); setFilters({ carrier: "all" }); setDetailModal(null);
    setPage({ current_page: 1, per_page: 12 });
  }, [resetToken]);

  const filtered = useMemo(() => {
    let base = prepared;
    const q = search.trim().toLowerCase();
    if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city, o.carrier].some((x) => String(x || "").toLowerCase().includes(q)));
    if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
    return base;
  }, [prepared, search, filters]);

  const columns = useMemo(() => [
    { key: "code", header: t("table.orderNumber"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00]">{row.code}</span> },
    { key: "customer", header: t("table.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
    { key: "phone", header: t("table.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm">{row.phone}</span> },
    { key: "city", header: t("table.city") },
    { key: "carrier", header: t("table.carrier"), cell: (row) => row.carrier ? <CarrierPill carrier={row.carrier} /> : <span className="text-slate-400 text-sm italic">{t("unspecified")}</span> },
    {
      key: "products", header: t("table.products"),
      cell: (row) => (
        <div className="space-y-0.5">
          {row.products.map((p, i) => (
            <div key={i} className="text-xs text-slate-500">
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{p.sku}</span>{" "}{p.name} ×{p.scannedQty}
            </div>
          ))}
        </div>
      ),
    },
    { key: "preparedAt", header: t("table.preparedAt"), cell: (row) => <span className="text-sm text-slate-500">{row.preparedAt || "—"}</span> },
    { key: "assignedEmployee", header: t("table.employee") },
    {
      key: "actions", header: t("table.actions"),
      cell: (row) => (
        <ActionButtons row={row} actions={[
          { icon: <Info />, tooltip: t("actions.details"), onClick: (r) => setDetailModal(r), variant: "primary" },
          { icon: <Truck />, tooltip: t("actions.distribute"), onClick: (r) => { setSelectedOrdersGlobal?.([r.code]); setDistributionDialog?.(true); }, variant: "emerald" },
        ]} />
      ),
    },
  ], [t, setDistributionDialog, setSelectedOrdersGlobal]);

  return (
    <div className="space-y-4">
      <Table
        searchValue={search} onSearchChange={setSearch} onSearch={() => { }}
        labels={{ searchPlaceholder: t("searchPlaceholder"), filter: t("filter"), apply: t("apply"), total: t("total"), limit: t("limit"), emptyTitle: t("prepared.emptyTitle"), emptySubtitle: "" }}
        actions={[{ key: "export", label: t("export"), icon: <FileDown size={14} />, color: "blue", onClick: () => { } }]}
        hasActiveFilters={filters.carrier !== "all"} onApplyFilters={() => { }}
        filters={
          <FilterField label={t("filters.carrier")}>
            <Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
              <SelectTrigger className="h-10 rounded-md border-border bg-background text-sm"><SelectValue placeholder={t("filters.allCarriers")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
                {CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
        }
        columns={columns} data={filtered} isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />
      <OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT: MAIN PREPARATION TAB
// ─────────────────────────────────────────────────────────────
export default function PreparationTab({
  orders, updateOrder, pushOp, subtab, setSubtab, onPrepareOrder, onPrepareMultiple,
  setDistributionDialog, setSelectedOrdersGlobal, resetToken,
}) {
  const t = useTranslations("warehouse.preparation");

  const preparing = orders.filter((o) => o.status === STATUS.PREPARING);
  const prepared = orders.filter((o) => o.status === STATUS.PREPARED);
  const totalItems = preparing.reduce((s, o) => s + o.products.reduce((ps, p) => ps + p.requestedQty, 0), 0);
  const scannedItems = preparing.reduce((s, o) => s + o.products.reduce((ps, p) => ps + (p.scannedQty || 0), 0), 0);

  const [panelOpen, setPanelOpen] = useState(false);
  // The order to auto-load when jumping from InProgressSubtab
  const [jumpToOrder, setJumpToOrder] = useState(null);

  // Called when scan icon in InProgressSubtab is clicked
  const handlePrepareOrder = useCallback((order) => {
    setJumpToOrder(order);   // will be picked up by ScanWorkflowPanel via useEffect
    setSubtab("scanning");
  }, [setSubtab]);

  // Clear jump once we leave scanning tab
  useEffect(() => {
    if (subtab !== "scanning") setJumpToOrder(null);
  }, [subtab]);

  const stats = [
    { id: "in-progress", name: t("stats.inProgress"), value: preparing.length, icon: Clock, color: "#6763af", sortOrder: 0 },
    { id: "total-items", name: t("stats.totalItems"), value: totalItems, icon: Package, color: "#ffb703", sortOrder: 1 },
    { id: "scanned", name: t("stats.scanned"), value: scannedItems, icon: CheckCircle2, color: "#10b981", sortOrder: 2 },
    { id: "prepared", name: t("stats.prepared"), value: prepared.length, icon: CheckCircle2, color: "#ff8b00", sortOrder: 3 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.preparation") },
        ]}
        buttons={<Button_ size="sm" label={t("howItWorks")} variant="ghost" onClick={() => { }} icon={<Info size={18} />} />}
        stats={stats}
        items={[
          { id: "scanning", label: t("subtabs.scanning"), count: preparing.length, icon: ScanLine },
          { id: "preparing", label: t("subtabs.inProgress"), count: preparing.length, icon: Clock },
          { id: "prepared", label: t("subtabs.prepared"), count: prepared.length, icon: CheckCircle2 },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div key={subtab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {subtab === "scanning" && (
            <>
              <ScanWorkflowPanel
                orders={orders}
                updateOrder={updateOrder}
                pushOp={pushOp}
                onOpenPanel={() => setPanelOpen(true)}
                jumpToOrder={jumpToOrder}
              />
              <OrdersSlidePanel
                open={panelOpen} onClose={() => setPanelOpen(false)}
                orders={preparing} activeOrderCode={null}
                onSelectOrder={() => setPanelOpen(false)}
              />
            </>
          )}
          {subtab === "preparing" && (
            <InProgressSubtab
              orders={orders} updateOrder={updateOrder} pushOp={pushOp}
              onPrepareOrder={handlePrepareOrder}
              onPrepareMultiple={onPrepareMultiple}
              resetToken={resetToken}
            />
          )}
          {subtab === "prepared" && (
            <PreparedSubtab
              orders={orders} setDistributionDialog={setDistributionDialog}
              setSelectedOrdersGlobal={setSelectedOrdersGlobal} resetToken={resetToken}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}