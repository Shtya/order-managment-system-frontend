// File: warehouse/atoms/MultiPrepareView.jsx
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
import PageHeader from "@/components/atoms/Pageheader";
import { useTranslations } from "next-intl";
import Button_ from "@/components/atoms/Button";

// Audio feedback
const playSuccessSound = () => {
  if (typeof window !== 'undefined') {
    const audio = new Audio('/sounds/success.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  }
};

const playErrorSound = () => {
  if (typeof window !== 'undefined') {
    const audio = new Audio('/sounds/error.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  }
};

/* ═══════════════════════════════════════════════════════════
   localStorage helpers
═══════════════════════════════════════════════════════════ */
const LS_KEY = "warehouse_prepare_session_v2";
const saveSession = (o, s, e, n) => { try { localStorage.setItem(LS_KEY, JSON.stringify({ ordersToPrep: o, states: s, employee: e, notes: n, savedAt: new Date().toISOString() })); } catch (_) { } };
const loadSession = () => { try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch (_) { return null; } };
const clearSession = () => { try { localStorage.removeItem(LS_KEY); } catch (_) { } };

function buildOrderState(order) {
  return {
    code: order.code,
    orderScanned: false,
    products: (order.products || []).map(p => ({ ...p, scannedQty: p.scannedQty || 0, completed: (p.scannedQty || 0) >= p.requestedQty })),
    scanLogs: [],
  };
}

/* ═══════════════════════════════════════════════════════════
   Ring progress
═══════════════════════════════════════════════════════════ */
function Ring({ value = 0, size = 44, stroke = 3.5, color = "var(--primary)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - Math.min(Math.max(value, 0), 100) / 100 * c;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          stroke={color} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stat card — matches InfoCard pattern
═══════════════════════════════════════════════════════════ */
function StatCard({ label, value, color, icon: Icon, note }) {
  return (
    <div className="relative rounded-xl border bg-card overflow-hidden h-[72px]"
      style={{ borderColor: color + "25" }}>
      {/* right accent bar */}
      <div className="absolute end-0 inset-y-0 w-[3.5px] rounded-full" style={{ background: color }} />
      {/* subtle bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(to start, ${color}0d 0%, transparent 60%)` }} />

      <div className="relative flex items-center h-full px-4 gap-3">
        {/* text */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="text-[11px] font-semibold text-foreground/70 truncate text-end">{label}</div>
          {note && <div className="text-[10px] text-muted-foreground/80truncate text-end">{note}</div>}
        </div>
        {/* value */}
        <AnimatePresence mode="wait">
          <motion.div key={String(value)}
            initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="text-2xl font-black leading-none tabular-nums flex-shrink-0"
            style={{ color }}>
            {value}
          </motion.div>
        </AnimatePresence>
        {/* icon bubble */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: color + "14", border: `1px solid ${color}25` }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Product row with progress bar
═══════════════════════════════════════════════════════════ */
function ProductRow({ p, index }) {
  const pct = p.requestedQty ? Math.round((p.scannedQty / p.requestedQty) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.15 }}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 border text-xs transition-all duration-200",
        p.completed
          ? "bg-[oklch(0.6_0.2_145/0.07)] border-[oklch(0.6_0.2_145/0.25)] text-[oklch(0.45_0.18_145)]"
          : p.scannedQty > 0
            ? "bg-primary/[0.05] border-primary/20 text-foreground"
            : "bg-muted/40 border-border/50 text-muted-foreground"
      )}
    >
      <div className="flex-shrink-0">
        {p.completed
          ? <CheckCircle2 size={14} className="text-[oklch(0.6_0.2_145)]" />
          : <div className="w-3.5 h-3.5 rounded-full border-[1.5px]"
            style={{ borderColor: p.scannedQty > 0 ? "var(--primary)" : "var(--border)" }} />
        }
      </div>
      <code className="font-mono text-[10px] px-1.5 py-0.5 rounded-xl bg-foreground/[0.06] text-muted-foreground flex-shrink-0">
        {p.sku}
      </code>
      <span className="flex-1 truncate font-medium text-[12px]">{p.name}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-14 h-1.5 rounded-full bg-border/60 overflow-hidden">
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ background: p.completed ? "oklch(0.6 0.2 145)" : p.scannedQty > 0 ? "var(--primary)" : "var(--muted-foreground)" }}
          />
        </div>
        <span className={cn("font-black tabular-nums text-[11px] min-w-[32px] text-end",
          p.completed ? "text-[oklch(0.55_0.18_145)]" : p.scannedQty > 0 ? "text-primary" : "text-muted-foreground/80"
        )}>
          {p.scannedQty}/{p.requestedQty}
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Order card
═══════════════════════════════════════════════════════════ */
function OrderCard({ state, order, isActive, index }) {
  const [open, setOpen] = useState(isActive);
  const done = state.products.filter(p => p.completed).length;
  const total = state.products.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isDone = done === total && total > 0;

  useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

  const accentColor = isDone ? "oklch(0.6 0.2 145)" : isActive ? "var(--primary)" : "var(--muted-foreground)";

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      className={cn(
        "relative overflow-hidden bg-card transition-all duration-300",
        isDone && "border-[oklch(0.6_0.2_145/0.3)]",
        isActive && !isDone && "border-primary/30 shadow-[0_2px_20px_-4px_rgb(var(--primary-shadow))]",
        !isActive && !isDone && "border-border/60",
      )}
    >
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3.5 pb-3 text-start transition-colors hover:bg-primary/[0.02]">
        <Ring value={pct} size={46} stroke={4} color={accentColor}>
          {isDone
            ? <CheckCircle2 size={16} className="text-[oklch(0.6_0.2_145)]" />
            : <span className="text-[9px] font-black tabular-nums text-foreground">{pct}%</span>
          }
        </Ring>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black font-mono text-[14px] text-foreground">{order.code}</span>
            {isActive && !isDone && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
                bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                نشط
              </span>
            )}
            {isDone && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
                bg-[oklch(0.6_0.2_145/0.1)] text-[oklch(0.5_0.18_145)] border border-[oklch(0.6_0.2_145/0.25)]">
                <CheckCircle2 size={8} /> مكتمل
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {[order.customer, order.city, order.carrier].filter(Boolean).join(" · ")}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className={cn(
            "text-xs font-black tabular-nums px-2.5 py-1 rounded-xl",
            isDone ? "bg-[oklch(0.6_0.2_145/0.1)] text-[oklch(0.5_0.18_145)]"
              : isActive ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
          )}>{done}/{total}</span>
          <span className="text-muted-foreground/80">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} style={{ overflow: "hidden" }}>
            <div className="px-4 pb-4 pt-2 space-y-1.5 border-t border-border/40">
              {state.products.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-4">لا توجد منتجات</p>
                : state.products.map((p, i) => <ProductRow key={p.sku || i} p={p} index={i} />)
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Scan log entry
═══════════════════════════════════════════════════════════ */
function ScanLogEntry({ log, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.3) }}
      className={cn(
        "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-[11.5px]",
        log.success
          ? "bg-[oklch(0.6_0.2_145/0.07)] border-[oklch(0.6_0.2_145/0.25)] text-[oklch(0.45_0.18_145)]"
          : "bg-destructive/[0.07] border-destructive/25 text-destructive"
      )}
    >
      {log.success
        ? <CheckCircle2 size={13} className="text-[oklch(0.6_0.2_145)] mt-0.5 flex-shrink-0" />
        : <XCircle size={13} className="text-destructive mt-0.5 flex-shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-snug">{log.message}</p>
        {log.reason && <p className="text-[10px] opacity-60 mt-0.5">{log.reason}</p>}
      </div>
      <span className="text-[10px] font-mono text-muted-foreground/80flex-shrink-0 mt-0.5">
        {log.timestamp?.slice(11, 16)}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function MultiPrepareView({ ordersToPrep: _ordersToPrep, onBack, updateOrder, pushOp }) {
  const [hydrated, setHydrated] = useState(false);
  const [restoredSession, setRestoredSession] = useState(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  // Statistics state
  const [successCount, setSuccessCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    const saved = loadSession();
    if (saved?.ordersToPrep?.length > 0) { setRestoredSession(saved); setShowRestoreBanner(true); }
    setHydrated(true);
  }, []);

  const ordersToPrep = restoredSession?.ordersToPrep ?? _ordersToPrep ?? [];

  const [states, setStates] = useState(() => { const s = loadSession(); return s?.states ?? (_ordersToPrep || []).map(buildOrderState); });
  const [scanInput, setScanInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [employee, setEmployee] = useState(() => loadSession()?.employee || "");
  const [notes, setNotes] = useState(() => loadSession()?.notes || "");
  const inputRef = useRef(null);

  useEffect(() => { if (!hydrated) return; saveSession(ordersToPrep, states, employee, notes); }, [states, employee, notes, ordersToPrep, hydrated]);

  const activeIdx = useMemo(() => {
    const i = states.findIndex(s => !s.products.every(p => p.completed));
    return i === -1 ? 0 : i;
  }, [states]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, [activeIdx]);

  const patch = useCallback((idx, upd) => setStates(prev => prev.map((s, i) => i === idx ? { ...s, ...upd } : s)), []);

  // Calculate statistics
  const totalOrders = ordersToPrep.length;
  const totalItems = ordersToPrep.reduce((sum, order) =>
    sum + order.products.reduce((itemSum, p) => itemSum + p.requestedQty, 0), 0);
  const preparedItems = states.reduce((sum, state) =>
    sum + state.products.reduce((itemSum, p) => itemSum + (p.scannedQty || 0), 0), 0);

  const handleScan = useCallback(() => {
    const code = scanInput.trim();
    if (!code) return;
    setScanInput("");
    const st = states[activeIdx];
    const order = ordersToPrep[activeIdx];
    const ts = new Date().toISOString();

    // Check if this is an order scan
    if (code === order.code) {
      patch(activeIdx, {
        orderScanned: true,
        scanLogs: [{ success: true, type: "order", message: `✓ تم مسح الطلب: ${order.code}`, timestamp: ts }, ...st.scanLogs]
      });
      setSuccessCount(prev => prev + 1);
      playSuccessSound();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.placeholder = "امسح منتجات هذا الطلب...";
        }
      }, 50);
      return;
    }

    // Check if this is a product scan
    const pIdx = st.products.findIndex(p => p.sku === code);
    if (pIdx === -1) {
      patch(activeIdx, {
        scanLogs: [{ success: false, message: `SKU غير موجود: ${code}`, reason: "الكود ليس ضمن منتجات الطلب", timestamp: ts }, ...st.scanLogs]
      });
      setWrongCount(prev => prev + 1);
      playErrorSound();
      return;
    }

    const prod = st.products[pIdx];
    if (prod.scannedQty >= prod.requestedQty) {
      patch(activeIdx, {
        scanLogs: [{ success: false, message: `SKU مكتمل: ${code}`, reason: "تم مسح الكمية المطلوبة مسبقاً", timestamp: ts }, ...st.scanLogs]
      });
      setWrongCount(prev => prev + 1);
      playErrorSound();
      return;
    }

    const newQty = prod.scannedQty + 1;
    patch(activeIdx, {
      orderScanned: true,
      products: st.products.map((p, i) => i === pIdx ? { ...p, scannedQty: newQty, completed: newQty >= p.requestedQty } : p),
      scanLogs: [{ success: true, message: `✓ ${prod.name} (${newQty}/${prod.requestedQty})`, sku: code, timestamp: ts }, ...st.scanLogs],
    });
    setSuccessCount(prev => prev + 1);
    playSuccessSound();

    // Check if order is complete
    const updatedProducts = st.products.map((p, i) => i === pIdx ? { ...p, scannedQty: newQty, completed: newQty >= p.requestedQty } : p);
    const allCompleted = updatedProducts.every(p => p.completed);

    if (allCompleted) {
      setTimeout(() => {
        setScanInput("");
        if (inputRef.current) {
          inputRef.current.placeholder = "امسح الباركود للطلب التالي...";
        }
      }, 800);
    }

    setTimeout(() => inputRef.current?.focus(), 50);
  }, [scanInput, states, activeIdx, ordersToPrep, patch]);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      states.forEach((st, i) => {
        const order = ordersToPrep[i];
        updateOrder?.(order.code, { status: STATUS.PREPARED, products: st.products, preparedAt: now });
        pushOp?.({
          id: `OP-${Date.now()}-${i}`,
          operationType: "ORDER_PREPARED",
          orderCode: order.code,
          carrier: order.carrier || "-",
          employee: employee || "System",
          notes,
          result: "SUCCESS",
          details: "تم تحضير الطلب بنجاح",
          createdAt: now,
          scanLogs: st.scanLogs,
          productsSnapshot: st.products,
          orderSnapshot: order
        });
      });
      clearSession();
      setSavedOk(true);
      setTimeout(() => { setSavedOk(false); onBack?.(); }, 1800);
    } finally { setSaving(false); }
  }, [states, ordersToPrep, updateOrder, pushOp, employee, notes, onBack]);

  /* ── Derived ── */
  const completedOrders = states.filter(s => s.products.every(p => p.completed)).length;
  const failedOrders = states.filter(s => s.scanLogs.some(l => !l.success)).length;
  const successScans = states.reduce((a, s) => a + s.scanLogs.filter(l => l.success).length, 0);
  const totalScans = states.reduce((a, s) => a + s.scanLogs.length, 0);
  const allComplete = completedOrders === ordersToPrep.length && ordersToPrep.length > 0;
  const globalPct = ordersToPrep.length ? Math.round((completedOrders / ordersToPrep.length) * 100) : 0;
  const lastLog = states[activeIdx]?.scanLogs[0];
  const isSuccess = lastLog?.success === true;
  const isError = lastLog?.success === false;
  const t = useTranslations("orders")

  if (!hydrated) return null;

  return (
    <div className="space-y-4">

      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/" },
          { name: ordersToPrep.length > 1 ? "تحضير الطلبات" : "تحضير الطلب" },
        ]}
        buttons={
          <div className="flex items-center gap-1">
            <Button_
              onClick={handleSaveAll} disabled={!allComplete || saving || savedOk}
              size="sm"
              icon={saving ? <Loader2 size={15} className="animate-spin" /> : savedOk ? <CheckCircle2 size={15} /> : <Save size={15} />}
              label={saving ? "جاري الحفظ…" : savedOk ? "تم الحفظ!" : `حفظ الكل (${ordersToPrep.length})`}

            />
            {showRestoreBanner && (<Button_
              onClick={() => { clearSession(); setShowRestoreBanner(false); setRestoredSession(null); setStates((_ordersToPrep || []).map(buildOrderState)); setEmployee(""); setNotes(""); }}
              size="sm"
              icon={<Trash2 size={11} />}
              label={"مسح"}
              tone="solid"
              variant="danger"
            />)}
            <Button_
              onClick={onBack}
              size="sm"
              tone="solid"
              variant="cancel"
              icon={<ArrowLeft className=" " size={15} />}

            />
          </div>
        }
        stats={[
          { name: "الطلبات المكتملة", value: completedOrders, color: "#16a34a", icon: TrendingUp, note: `من ${ordersToPrep.length}` },
          { name: "بها أخطاء", value: failedOrders, color: "#ef4444", icon: TrendingDown, note: failedOrders ? "مسح خاطئ" : "لا توجد" },
          { name: "إجمالي المسح", value: totalScans, color: "#f59e0b", icon: ScanLine, note: `${successScans} ناجح` },
          { name: "نسبة الإنجاز", value: `${globalPct}%`, color: "#3b82f6", icon: Package, note: `${completedOrders}/${ordersToPrep.length}` },
        ]}

      ></PageHeader>

      {/* ── Real-time statistics for preparing tab ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 mb-1">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-blue-700">{totalOrders}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 mb-1">إجمالي القطع</p>
              <p className="text-2xl font-bold text-amber-700">{totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-amber-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 mb-1">القطع المحضرة</p>
              <p className="text-2xl font-bold text-emerald-700">{preparedItems}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* ── Session details ── */}
      <div className="bg-card">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px] space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              <User size={10} className="text-primary" /> الموظف المسئول
            </label>
            <input value={employee} onChange={e => setEmployee(e.target.value)} placeholder="اسم الموظف…"
              className="w-full h-9 px-3 rounded-xl text-sm font-semibold
                border border-border bg-background/60 text-foreground
                placeholder:text-muted-foreground/80
                hover:border-primary/50 focus:border-primary
                focus:bg-background !outline-none transition-all duration-200" />
          </div>
          <div className="flex-[2] min-w-[200px] space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              <FileText size={10} className="text-primary" /> ملاحظات
            </label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية…"
              className="w-full h-9 px-3 rounded-xl text-sm font-semibold
                border border-border bg-background/60 text-foreground
                placeholder:text-muted-foreground/80
                hover:border-primary/50 focus:border-primary
                focus:bg-background !outline-none transition-all duration-200" />
          </div>
        </div>
        <AnimatePresence>
          {(employee || notes) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              <div className="flex flex-wrap gap-2 px-4 pb-4 pt-2 border-t border-border/40">
                {employee && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                    bg-primary/[0.06] border border-primary/15 text-xs font-semibold text-foreground">
                    <User size={11} className="text-primary" />
                    <span className="text-[11px] text-muted-foreground font-normal">الموظف:</span> {employee}
                  </div>
                )}
                {notes && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                    bg-primary/[0.04] border border-primary/12 text-xs font-semibold text-foreground">
                    <FileText size={11} className="text-primary/70" />
                    <span className="text-[11px] text-muted-foreground font-normal">ملاحظات:</span>
                    <span className="truncate max-w-[200px]">{notes}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div >

      {/* Scan counters */}
      < div className="flex items-center gap-3 p-3 bg-card rounded-xl" >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ناجح</p>
            <motion.p key={successCount} className="text-lg font-bold text-emerald-600">
              {successCount}
            </motion.p>
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle size={16} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">خاطئ</p>
            <motion.p key={wrongCount} className="text-lg font-bold text-red-600">
              {wrongCount}
            </motion.p>
          </div>
        </div>
      </div >


      <div className="relative bg-card">
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ScanLine size={11} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                ماسح الباركود
              </span>
            </div>
            {!allComplete && (
              <span className="text-[11px] text-muted-foreground/80">
                نشط:{" "}
                <span className="font-mono font-bold text-primary ms-0.5">
                  {ordersToPrep[activeIdx]?.code}
                </span>
              </span>
            )}
          </div>

          {/* ── Input shell — identical to InputBase / SelectTrigger ── */}
          <div
            className={cn(
              "relative flex items-center rounded-xl border transition-all duration-200 overflow-visible",
              "bg-background/60",
              allComplete && "opacity-50 pointer-events-none",
              !lastLog && [
                "border-border",
                "hover:border-primary/50 hover:bg-background",
                "focus-within:border-primary focus-within:bg-background",
                "focus-within:shadow-[0_0_0_3px_rgb(var(--primary-shadow))]",
              ],
              isSuccess && "border-[oklch(0.6_0.2_145)] shadow-[0_0_0_3px_oklch(0.6_0.2_145/0.15)] bg-background",
              isError && "border-destructive shadow-[0_0_0_3px_oklch(var(--destructive)/0.15)] bg-background",
            )}
            style={{ height: 44 }}
          >
            {/* sweep shimmer while typing */}
            <AnimatePresence>
              {scanInput && !lastLog && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                >
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-y-0 w-2/5"
                    style={{ background: "linear-gradient(90deg, transparent, rgb(var(--primary-from)/0.07), transparent)" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* left icon */}
            <div className="ps-3 flex-shrink-0 z-10">
              <ScanLine size={15}
                className={cn(
                  "transition-colors duration-200",
                  isSuccess ? "text-[oklch(0.6_0.2_145)]" : isError ? "text-destructive" : "text-muted-foreground/80"
                )}
              />
            </div>

            {/* divider */}
            <div className="w-px h-5 bg-border/60 flex-shrink-0 mx-2" />

            {/* text input */}
            <input
              ref={inputRef}
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleScan(); }}
              placeholder="امسح الباركود أو اكتب كود المنتج / الطلب…"
              autoFocus
              disabled={allComplete}
              className={cn(
                "flex-1 h-full bg-transparent border-none !outline-none focus:ring-0",
                "text-sm font-semibold text-foreground",
                "placeholder:text-muted-foreground/80disabled:cursor-not-allowed",
                "px-2",
              )}
            />

            {/* scan button */}
            <div className="pe-2 flex-shrink-0">
              <motion.button
                type="button"
                onClick={handleScan}
                disabled={allComplete}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="relative h-8 px-3.5 rounded-xl cursor-pointer
                  text-primary-foreground text-xs font-black flex items-center gap-1.5
                  overflow-hidden disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--third, #ff5c2b) 100%)",
                  boxShadow: "0 2px 10px -2px rgb(var(--primary-shadow)), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2
                  bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                <ScanLine size={12} strokeWidth={2.5} className="relative" />
                <span className="relative">مسح</span>
              </motion.button>
            </div>
          </div>

          {/* feedback message */}
          <AnimatePresence mode="wait">
            {lastLog && (
              <motion.div key={lastLog.timestamp}
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className={cn(
                  "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border",
                  isSuccess
                    ? "bg-[oklch(0.6_0.2_145/0.08)] border-[oklch(0.6_0.2_145/0.3)] text-[oklch(0.5_0.18_145)]"
                    : "bg-destructive/[0.07] border-destructive/30 text-destructive",
                )}>
                  {isSuccess
                    ? <CheckCircle2 size={13} className="flex-shrink-0" />
                    : <XCircle size={13} className="flex-shrink-0" />
                  }
                  <span>{lastLog.message}</span>
                  {lastLog.reason && <span className="text-[10px] opacity-55 ms-1">— {lastLog.reason}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Order cards ── */}
      <div className="space-y-2.5">
        {ordersToPrep.map((order, idx) => (
          <OrderCard key={order.code} state={states[idx]} order={order}
            isActive={idx === activeIdx && !allComplete} index={idx} />
        ))}
      </div>

      {/* ── Scan log ── */}
      <AnimatePresence>
        {states[activeIdx]?.scanLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card">
            {/* top accent */}
            <div className="h-[2px] bg-gradient-to-r from-primary/60 to-transparent" />
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <ClipboardList size={13} className="text-primary" />
              <span className="text-[13px] font-bold text-foreground">سجل المسح</span>
              <code className="text-[11px] text-primary font-mono ms-1">{ordersToPrep[activeIdx]?.code}</code>
              <span className="ms-auto text-[11px] text-muted-foreground/80tabular-nums">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-card rounded-xl p-10 flex flex-col items-center gap-4
                border border-[oklch(0.6_0.2_145/0.25)] max-w-sm mx-4 overflow-hidden
                shadow-[0_32px_80px_-16px_rgba(0,0,0,0.25)]"
            >
              {/* top bar */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[oklch(0.6_0.2_145)] to-[oklch(0.7_0.18_160)]" />
              <div className="w-16 h-16 rounded-full bg-[oklch(0.6_0.2_145/0.1)] flex items-center justify-center"
                style={{ boxShadow: "0 0 0 10px oklch(0.6 0.2 145 / 0.06)" }}>
                <CheckCircle2 size={36} className="text-[oklch(0.6_0.2_145)]" />
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-foreground">تم حفظ جميع الطلبات!</p>
                <p className="text-muted-foreground text-sm mt-1">{ordersToPrep.length} طلب تم تحضيره بنجاح</p>
                {employee && <p className="text-muted-foreground text-xs mt-0.5">بواسطة: <span className="font-semibold text-primary">{employee}</span></p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}