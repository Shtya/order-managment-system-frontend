"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ArrowLeft, ScanLine, CheckCircle2, XCircle,
  Save, Loader2, ClipboardList, User, FileText, Trash2,
  TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { STATUS } from "../tabs/data";

// ─── localStorage ─────────────────────────────────────────────────────────────
const LS_KEY = "warehouse_prepare_session_v2";
const saveSession  = (ordersToPrep, states, employee, notes) => { try { localStorage.setItem(LS_KEY, JSON.stringify({ ordersToPrep, states, employee, notes, savedAt: new Date().toISOString() })); } catch (_) {} };
const loadSession  = () => { try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch (_) { return null; } };
const clearSession = () => { try { localStorage.removeItem(LS_KEY); } catch (_) {} };

function buildOrderState(order) {
  return {
    code: order.code,
    orderScanned: false,
    products: (order.products || []).map((p) => ({ ...p, scannedQty: p.scannedQty || 0, completed: (p.scannedQty || 0) >= p.requestedQty })),
    scanLogs: [],
  };
}

// ─── Ring progress ────────────────────────────────────────────────────────────
function Ring({ value = 0, size = 44, stroke = 3.5, color = "#ff8b00", children }) {
  const r   = (size - stroke) / 2;
  const c   = 2 * Math.PI * r;
  const off = c - Math.min(Math.max(value, 0), 100) / 100 * c;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke} stroke="#e2e8f0" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke}
          stroke={color} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, note }) {
  return (
    <div className="relative rounded-2xl border bg-white overflow-hidden" style={{ borderColor: color + "25" }}>
      {/* left accent */}
      <div className="absolute top-0 bottom-0 start-0 w-[3px]" style={{ background: color }} />
      <div className="ps-5 pe-4 py-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "12" }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={String(value)} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="text-[24px] font-black leading-none tabular-nums" style={{ color }}>
              {value}
            </motion.div>
          </AnimatePresence>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 truncate">{label}</div>
          {note && <div className="text-[10px] text-slate-400 truncate">{note}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Product row ──────────────────────────────────────────────────────────────
function ProductRow({ p, index }) {
  const pct = p.requestedQty ? Math.round((p.scannedQty / p.requestedQty) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.15 }}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 border text-xs transition-all duration-200",
        p.completed
          ? "bg-emerald-50 border-emerald-200/70 text-emerald-800"
          : p.scannedQty > 0
            ? "bg-amber-50/80 border-amber-200/60 text-amber-800"
            : "bg-slate-50 border-slate-200/60 text-slate-600"
      )}
    >
      {/* Status dot */}
      <div className="flex-shrink-0">
        {p.completed
          ? <CheckCircle2 size={14} className="text-emerald-500" />
          : <div className="w-3.5 h-3.5 rounded-full border-[1.5px]"
              style={{ borderColor: p.scannedQty > 0 ? "#f59e0b" : "#cbd5e1" }} />
        }
      </div>

      {/* SKU */}
      <code className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-black/[0.06] text-slate-600 flex-shrink-0">
        {p.sku}
      </code>

      {/* Name */}
      <span className="flex-1 truncate font-medium text-[12px]">{p.name}</span>

      {/* Progress */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ background: p.completed ? "#10b981" : p.scannedQty > 0 ? "#f59e0b" : "#94a3b8" }}
          />
        </div>
        <span className={cn("font-black tabular-nums text-[11px] min-w-[32px] text-end",
          p.completed ? "text-emerald-600" : p.scannedQty > 0 ? "text-amber-600" : "text-slate-400"
        )}>
          {p.scannedQty}/{p.requestedQty}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────
function OrderCard({ state, order, isActive, index }) {
  const [open, setOpen] = useState(isActive);
  const done  = state.products.filter(p => p.completed).length;
  const total = state.products.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const isDone = done === total && total > 0;

  useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

  const accentColor = isDone ? "#10b981" : isActive ? "#ff8b00" : "#94a3b8";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      className="relative rounded-2xl border overflow-hidden bg-white transition-shadow duration-300"
      style={{
        borderColor: isDone ? "#10b98128" : isActive ? "#ff8b0030" : "#e2e8f0",
        boxShadow: isActive && !isDone ? "0 2px 20px -4px rgba(255,139,0,0.18)" : "none",
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[2.5px]" style={{
        background: isDone
          ? "linear-gradient(90deg, #10b981, #34d399, transparent)"
          : isActive
            ? "linear-gradient(90deg, #ff8b00 0%, #ff5c2b 50%, transparent 100%)"
            : "transparent",
      }} />

      {/* Card header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3.5 px-4 pt-5 pb-4 text-start transition-colors hover:bg-slate-50/60"
      >
        <Ring value={pct} size={46} stroke={4} color={accentColor}>
          {isDone
            ? <CheckCircle2 size={16} className="text-emerald-500" />
            : <span className="text-[9px] font-black tabular-nums text-slate-700">{pct}%</span>
          }
        </Ring>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black font-mono text-[14px] text-slate-800">{order.code}</span>
            {isActive && !isDone && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#ff8b00]/10 text-[#ff8b00] border border-[#ff8b00]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff8b00] animate-pulse" />
                نشط
              </span>
            )}
            {isDone && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 size={8} /> مكتمل
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {[order.customer, order.city, order.carrier].filter(Boolean).join(" · ")}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className={cn(
            "text-xs font-black tabular-nums px-2.5 py-1 rounded-xl",
            isDone ? "bg-emerald-100 text-emerald-700"
              : isActive ? "bg-[#ff8b00]/10 text-[#ff8b00]"
              : "bg-slate-100 text-slate-400"
          )}>{done}/{total}</span>
          <span className="text-slate-300">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
        </div>
      </button>

      {/* Products */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 pt-2 space-y-1.5 border-t border-slate-100">
              {state.products.length === 0
                ? <p className="text-xs text-slate-400 text-center py-4">لا توجد منتجات</p>
                : state.products.map((p, i) => <ProductRow key={p.sku || i} p={p} index={i} />)
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Scan log entry ───────────────────────────────────────────────────────────
function ScanLogEntry({ log, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.3) }}
      className={cn(
        "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-[11.5px]",
        log.success
          ? "bg-emerald-50/80 border-emerald-200/50 text-emerald-800"
          : "bg-red-50/80 border-red-200/50 text-red-700"
      )}
    >
      {log.success
        ? <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
        : <XCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-snug">{log.message}</p>
        {log.reason && <p className="text-[10px] opacity-60 mt-0.5">{log.reason}</p>}
      </div>
      <span className="text-[10px] font-mono text-slate-300 flex-shrink-0 mt-0.5">
        {log.timestamp?.slice(11, 16)}
      </span>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
export default function MultiPrepareView({ ordersToPrep: _ordersToPrep, onBack, updateOrder, pushOp }) {
  const [hydrated,          setHydrated]          = useState(false);
  const [restoredSession,   setRestoredSession]   = useState(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  useEffect(() => {
    const saved = loadSession();
    if (saved?.ordersToPrep?.length > 0) { setRestoredSession(saved); setShowRestoreBanner(true); }
    setHydrated(true);
  }, []);

  const ordersToPrep = restoredSession?.ordersToPrep ?? _ordersToPrep ?? [];

  const [states,    setStates]    = useState(() => { const s = loadSession(); return s?.states ?? (_ordersToPrep || []).map(buildOrderState); });
  const [scanInput, setScanInput] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);
  const [employee,  setEmployee]  = useState(() => loadSession()?.employee || "");
  const [notes,     setNotes]     = useState(() => loadSession()?.notes    || "");
  const inputRef = useRef(null);

  useEffect(() => { if (!hydrated) return; saveSession(ordersToPrep, states, employee, notes); }, [states, employee, notes, ordersToPrep, hydrated]);

  const activeIdx = useMemo(() => {
    const i = states.findIndex(s => !s.products.every(p => p.completed));
    return i === -1 ? 0 : i;
  }, [states]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, [activeIdx]);

  const patch = useCallback((idx, upd) => setStates(prev => prev.map((s, i) => i === idx ? { ...s, ...upd } : s)), []);

  const handleScan = useCallback(() => {
    const code = scanInput.trim();
    if (!code) return;
    setScanInput("");
    const st    = states[activeIdx];
    const order = ordersToPrep[activeIdx];
    const ts    = new Date().toISOString();

    if (code === order.code) {
      patch(activeIdx, { orderScanned: true, scanLogs: [{ success: true, type: "order", message: `✓ تم مسح الطلب: ${order.code}`, timestamp: ts }, ...st.scanLogs] });
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    const pIdx = st.products.findIndex(p => p.sku === code);
    if (pIdx === -1) {
      patch(activeIdx, { scanLogs: [{ success: false, message: `SKU غير موجود: ${code}`, reason: "الكود ليس ضمن منتجات الطلب", timestamp: ts }, ...st.scanLogs] });
      return;
    }
    const prod = st.products[pIdx];
    if (prod.scannedQty >= prod.requestedQty) {
      patch(activeIdx, { scanLogs: [{ success: false, message: `SKU مكتمل: ${code}`, reason: "تم مسح الكمية المطلوبة مسبقاً", timestamp: ts }, ...st.scanLogs] });
      return;
    }
    const newQty = prod.scannedQty + 1;
    patch(activeIdx, {
      orderScanned: true,
      products: st.products.map((p, i) => i === pIdx ? { ...p, scannedQty: newQty, completed: newQty >= p.requestedQty } : p),
      scanLogs: [{ success: true, message: `✓ ${prod.name} (${newQty}/${prod.requestedQty})`, sku: code, timestamp: ts }, ...st.scanLogs],
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [scanInput, states, activeIdx, ordersToPrep, patch]);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      states.forEach((st, i) => {
        const order = ordersToPrep[i];
        updateOrder?.(order.code, { status: STATUS.PREPARED, products: st.products, preparedAt: now });
        pushOp?.({ id: `OP-${Date.now()}-${i}`, operationType: "ORDER_PREPARED", orderCode: order.code, carrier: order.carrier || "-", employee: employee || "System", notes, result: "SUCCESS", details: "تم تحضير الطلب بنجاح", createdAt: now, scanLogs: st.scanLogs, productsSnapshot: st.products, orderSnapshot: order });
      });
      clearSession();
      setSavedOk(true);
      setTimeout(() => { setSavedOk(false); onBack?.(); }, 1800);
    } finally { setSaving(false); }
  }, [states, ordersToPrep, updateOrder, pushOp, employee, notes, onBack]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const completedOrders = states.filter(s => s.products.every(p => p.completed)).length;
  const failedOrders    = states.filter(s => s.scanLogs.some(l => !l.success)).length;
  const successScans    = states.reduce((a, s) => a + s.scanLogs.filter(l => l.success).length, 0);
  const totalScans      = states.reduce((a, s) => a + s.scanLogs.length, 0);
  const allComplete     = completedOrders === ordersToPrep.length && ordersToPrep.length > 0;
  const globalPct       = ordersToPrep.length ? Math.round((completedOrders / ordersToPrep.length) * 100) : 0;
  const lastLog         = states[activeIdx]?.scanLogs[0];

  if (!hydrated) return null;

  return (
    <div className="space-y-4">

      {/* ── Restore banner ── */}
      <AnimatePresence>
        {showRestoreBanner && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200/70">
            <RefreshCw size={14} className="text-[#ff8b00] flex-shrink-0" />
            <p className="text-sm text-amber-800 flex-1">
              <span className="font-bold">تم استعادة جلسة سابقة</span>
              {restoredSession?.savedAt && (
                <span className="text-xs font-normal opacity-70 ms-2">{new Date(restoredSession.savedAt).toLocaleString("ar")}</span>
              )}
            </p>
            <button onClick={() => { clearSession(); setShowRestoreBanner(false); setRestoredSession(null); setStates((_ordersToPrep || []).map(buildOrderState)); setEmployee(""); setNotes(""); }}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition-colors">
              <Trash2 size={11} /> مسح
            </button>
            <button onClick={() => setShowRestoreBanner(false)} className="text-amber-400 hover:text-amber-600 transition-colors">
              <XCircle size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
              bg-white border border-slate-200 text-slate-500
              hover:text-[#ff8b00] hover:border-[#ff8b00]/40 shadow-sm transition-all">
            <ArrowLeft size={16} className="rtl:rotate-180" />
          </motion.button>
          <div>
            <h1 className="text-[17px] font-black tracking-tight text-slate-800 flex items-center gap-2">
              <Package size={16} className="text-[#ff8b00]" />
              {ordersToPrep.length > 1 ? "تحضير الطلبات" : "تحضير الطلب"}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Zap size={9} className="text-[#ff8b00]" /> يُحفظ تلقائيًا
            </p>
          </div>
        </div>

        <AnimatePresence>
          {allComplete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
              onClick={handleSaveAll} disabled={saving || savedOk}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white
                bg-gradient-to-r from-emerald-500 to-teal-500
                shadow-[0_4px_14px_-3px_rgba(16,185,129,0.45)]
                hover:shadow-[0_6px_18px_-3px_rgba(16,185,129,0.6)]
                disabled:opacity-60 transition-all">
              {saving ? <Loader2 size={15} className="animate-spin" /> : savedOk ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {saving ? "جاري الحفظ…" : savedOk ? "تم الحفظ!" : `حفظ الكل (${ordersToPrep.length})`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "الطلبات المكتملة", value: completedOrders, color: "#10b981", icon: TrendingUp,   note: `من ${ordersToPrep.length}` },
          { label: "بها أخطاء",        value: failedOrders,    color: "#ef4444", icon: TrendingDown, note: failedOrders ? "مسح خاطئ" : "لا توجد" },
          { label: "إجمالي المسح",     value: totalScans,      color: "#ff8b00", icon: ScanLine,     note: `${successScans} ناجح` },
          { label: "نسبة الإنجاز",     value: `${globalPct}%`, color: "#8b5cf6", icon: Package,      note: `${completedOrders}/${ordersToPrep.length}` },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* ── Session details ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
          <User size={12} className="text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">تفاصيل الجلسة</span>
        </div>
        <div className="flex flex-wrap gap-3 p-4">
          <div className="flex-1 min-w-[160px] space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <User size={10} style={{ color: "#ff8b00" }} /> الموظف المسئول
            </label>
            <input value={employee} onChange={e => setEmployee(e.target.value)} placeholder="اسم الموظف…"
              className="w-full h-9 px-3 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-300 focus:border-[#ff8b00] focus:bg-white outline-none transition-all duration-150" />
          </div>
          <div className="flex-[2] min-w-[200px] space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <FileText size={10} style={{ color: "#8b5cf6" }} /> ملاحظات
            </label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية…"
              className="w-full h-9 px-3 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-300 focus:border-violet-400 focus:bg-white outline-none transition-all duration-150" />
          </div>
        </div>
        <AnimatePresence>
          {(employee || notes) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              <div className="flex flex-wrap gap-2 px-4 pb-4 pt-2 border-t border-slate-100">
                {employee && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ff8b00]/6 border border-[#ff8b00]/15 text-[12px] font-semibold text-slate-700">
                    <User size={11} style={{ color: "#ff8b00" }} />
                    <span className="text-[11px] text-slate-400 font-normal">الموظف:</span> {employee}
                  </div>
                )}
                {notes && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200/50 text-[12px] font-semibold text-slate-700">
                    <FileText size={11} className="text-violet-500" />
                    <span className="text-[11px] text-slate-400 font-normal">ملاحظات:</span>
                    <span className="truncate max-w-[200px]">{notes}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Overall progress ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 flex items-center gap-5">
        <Ring value={globalPct} size={64} stroke={5} color={allComplete ? "#10b981" : "#ff8b00"}>
          <span className="text-[13px] font-black tabular-nums text-slate-800">{globalPct}%</span>
        </Ring>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-[28px] font-black tabular-nums leading-none text-slate-800">{completedOrders}</span>
            <span className="text-slate-400 text-[13px]">/ {ordersToPrep.length} طلب مكتمل</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: allComplete ? "#10b981" : "linear-gradient(90deg, #ff8b00, #ff5c2b)" }}
              initial={{ width: 0 }} animate={{ width: `${globalPct}%` }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {allComplete
              ? "🎉 جميع الطلبات جاهزة للحفظ"
              : <>الطلب النشط: <span className="font-mono font-bold text-[#ff8b00] ms-0.5">{ordersToPrep[activeIdx]?.code}</span></>
            }
          </p>
        </div>
      </div>

      {/* ── Scan input ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
        {/* orange accent top */}
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ff8b00 0%, #ff5c2b 40%, transparent 100%)" }} />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#ff8b0012" }}>
              <ScanLine size={13} style={{ color: "#ff8b00" }} />
            </div>
            <span className="text-[13px] font-bold text-slate-700">ماسح الباركود</span>
            {!allComplete && (
              <span className="ms-auto text-[11px] text-slate-400">
                نشط: <span className="font-mono font-bold text-[#ff8b00] ms-0.5">{ordersToPrep[activeIdx]?.code}</span>
              </span>
            )}
          </div>

          {/* Input row */}
          <div className={cn(
            "flex items-center rounded-xl border-2 transition-all duration-200 bg-white",
            allComplete ? "border-slate-200 opacity-50" : "border-slate-200 focus-within:border-[#ff8b00] focus-within:ring-4 focus-within:ring-[#ff8b00]/8"
          )}>
            <input
              ref={inputRef}
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleScan(); }}
              placeholder="امسح الباركود أو اكتب كود المنتج / الطلب…"
              autoFocus
              disabled={allComplete}
              className="flex-1 h-11 px-4 text-[13px] font-semibold bg-transparent border-none outline-none focus:ring-0 text-slate-800 placeholder:text-slate-300 disabled:cursor-not-allowed"
            />
            <div className="pe-1.5 flex-shrink-0">
              <motion.button
                onClick={handleScan} disabled={allComplete}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                className="h-8 px-4 rounded-[9px] flex items-center gap-1.5 text-[12px] font-bold text-white flex-shrink-0
                  bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b]
                  shadow-[0_2px_10px_-2px_rgba(255,139,0,0.55)]
                  hover:shadow-[0_4px_14px_-2px_rgba(255,139,0,0.65)]
                  transition-shadow duration-150 disabled:opacity-40">
                <ScanLine size={13} /> مسح
              </motion.button>
            </div>
          </div>

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {lastLog && (
              <motion.div key={lastLog.timestamp}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold",
                  lastLog.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-700"
                )}>
                {lastLog.success
                  ? <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-500" />
                  : <XCircle size={15} className="flex-shrink-0 text-red-500" />
                }
                <span>{lastLog.message}</span>
                {lastLog.reason && <span className="text-[11px] opacity-55 ms-1">— {lastLog.reason}</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Order cards ── */}
      <div className="space-y-2.5">
        {ordersToPrep.map((order, idx) => (
          <OrderCard
            key={order.code}
            state={states[idx]}
            order={order}
            isActive={idx === activeIdx && !allComplete}
            index={idx}
          />
        ))}
      </div>

      {/* ── Scan log ── */}
      <AnimatePresence>
        {states[activeIdx]?.scanLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <ClipboardList size={13} className="text-[#ff8b00]" />
              <span className="text-[13px] font-bold text-slate-700">سجل المسح</span>
              <code className="text-[11px] text-[#ff8b00] font-mono ms-1">{ordersToPrep[activeIdx]?.code}</code>
              <span className="ms-auto text-[11px] text-slate-400 tabular-nums">
                {states[activeIdx].scanLogs.length} عملية
              </span>
            </div>
            <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
              {states[activeIdx].scanLogs.map((log, i) => <ScanLogEntry key={i} log={log} index={i} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success overlay ── */}
      <AnimatePresence>
        {savedOk && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-10 flex flex-col items-center gap-4
                shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)] border border-slate-200/50 max-w-sm mx-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
                style={{ boxShadow: "0 0 0 10px rgba(16,185,129,0.08)" }}>
                <CheckCircle2 size={36} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-slate-800">تم حفظ جميع الطلبات!</p>
                <p className="text-slate-400 text-sm mt-1">{ordersToPrep.length} طلب تم تحضيره بنجاح</p>
                {employee && <p className="text-slate-400 text-xs mt-0.5">بواسطة: <span className="font-semibold text-[#ff8b00]">{employee}</span></p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}