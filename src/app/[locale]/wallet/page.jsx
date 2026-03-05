"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import Table from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
 
// ─── Icons ────────────────────────────────────────────────────────────────────
const WalletIcon  = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
const CreditCardIcon  = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
const ClockIcon       = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const TrendingDownIcon= ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>;
const PlusIcon        = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ArrowUpIcon     = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
const DownloadIcon    = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const HomeIcon        = ()             => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const ChevronRightIcon= ()             => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const XIcon           = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const CheckIcon       = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

// ─── Static data ──────────────────────────────────────────────────────────────
const WALLET_INIT = {
  walletBalance:    12480.5,
  availableBalance:  9350.0,
  pendingCOD:        1630.5,
  totalWithdrawn:    4200.0,
};

const TRANSACTIONS_INIT = [
  { id: 1, type: "deposit",  labelKey: "walletTopup",         amount:  2000,   date: "2025-03-03", status: "completed" },
  { id: 2, type: "withdraw", labelKey: "vodafoneCashWithdraw", amount:  -800,   date: "2025-03-01", status: "completed" },
  { id: 3, type: "cod",      labelKey: "codOrder",            amount:   430.5, date: "2025-02-28", status: "pending",   orderId: "#4821" },
  { id: 4, type: "withdraw", labelKey: "bankTransferWithdraw", amount: -1200,   date: "2025-02-25", status: "completed" },
  { id: 5, type: "deposit",  labelKey: "walletTopup",         amount:  5000,   date: "2025-02-20", status: "completed" },
  { id: 6, type: "cod",      labelKey: "codOrder",            amount:   890,   date: "2025-02-18", status: "completed", orderId: "#4790" },
  { id: 7, type: "withdraw", labelKey: "instapayWithdraw",    amount: -2200,   date: "2025-02-14", status: "completed" },
];

const METHODS = [
  { value: "vodafone", labelKey: "vodafoneCash", icon: "📱", color: "#e60012" },
  { value: "instapay", labelKey: "instapay",     icon: "⚡", color: "#f59e0b" },
  { value: "bank",     labelKey: "bankTransfer", icon: "🏦", color: "#3b82f6" },
  { value: "wallet",   labelKey: "walletMethod", icon: "👛", color: "#8b5cf6" },
];

const TAB_IDS = ["all", "deposits", "withdrawals", "cod"];

function fmt(n) {
  return Number(n).toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

 
// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      className="fixed bottom-6 end-6 z-[9999] flex items-center gap-2.5 max-w-[340px]
                 rounded-xl px-4 py-3 font-semibold text-[13.5px] text-white
                 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      style={{ background: type === "success" ? "#16a34a" : "#dc2626" }}
    >
      <span className="w-[22px] h-[22px] rounded-full bg-white/20 flex items-center justify-center shrink-0">
        {type === "success" ? <CheckIcon size={12} /> : <XIcon size={12} />}
      </span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="bg-transparent border-none text-white/70 cursor-pointer p-0.5">
        <XIcon size={13} />
      </button>
    </motion.div>
  );
}

// ─── Deposit Modal ────────────────────────────────────────────────────────────
function DepositModal({ onClose, onDeposit, t }) {
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setErr(t("validation.validAmount")); return; }
    onDeposit(amt);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-[18px] border border-border shadow-[0_24px_64px_rgba(0,0,0,0.22)]
                   w-full max-w-[380px] p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="m-0 text-[16.5px] font-bold text-foreground">{t("deposit.title")}</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">{t("deposit.subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-lg border border-border bg-muted cursor-pointer
                       flex items-center justify-center text-muted-foreground"
          >
            <XIcon size={13} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[10.5px] font-black uppercase tracking-[.08em] text-muted-foreground mb-1.5">
              {t("deposit.amountLabel")}
            </label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[12.5px] font-bold text-muted-foreground pointer-events-none">
                EGP
              </span>
              <input
                autoFocus
                className="w-full py-[11px] pe-3 ps-[52px] rounded-[10px] border border-border
                           bg-background text-foreground text-[15px] font-semibold outline-none
                           transition-[border] duration-150
                           focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                style={{ borderColor: err ? "var(--destructive)" : undefined }}
                placeholder="0.00" type="number" min="0" step="0.01"
                value={amount}
                onChange={e => { setAmount(e.target.value); setErr(""); }}
              />
            </div>
            {err && <p className="mt-1 text-[11.5px] text-destructive">{err}</p>}
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-[11px] rounded-[9px] border border-border bg-muted
                         text-muted-foreground font-semibold text-[13.5px] cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="flex-[2] py-[11px] rounded-[9px] border-none font-bold text-[13.5px]
                         cursor-pointer text-white transition-opacity duration-150 hover:opacity-90"
              style={{
                background: "linear-gradient(90deg, var(--primary), var(--third))",
                boxShadow: "0 4px 16px rgba(255,92,43,.25)",
              }}
            >
              {t("deposit.cta")}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Withdraw Side Drawer ─────────────────────────────────────────────────────
function WithdrawPanel({ wallet, onWithdraw, onClose, t }) {
  const [method, setMethod] = useState("vodafone");
  const [phone,  setPhone]  = useState("");
  const [name,   setName]   = useState("");
  const [email,  setEmail]  = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!phone.trim())  e.phone  = t("validation.required");
    if (!name.trim())   e.name   = t("validation.required");
    if (!email.trim() || !email.includes("@")) e.email = t("validation.validEmail");
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) e.amount = t("validation.validAmount");
    else if (amt > wallet.availableBalance) e.amount = `${t("validation.maxAmount")}: EGP ${fmt(wallet.availableBalance)}`;
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (!Object.keys(errs).length) onWithdraw({ method, phone, name, email, amount: parseFloat(amount) });
  }

  const clearErr = (key) => setErrors(prev => ({ ...prev, [key]: "" }));

  const fieldCls = (err) =>
    `w-full py-[10px] px-[13px] rounded-[9px] border bg-background text-foreground text-[13.5px]
     outline-none transition-[border] duration-150
     focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10
     ${err ? "!border-destructive" : "border-border"}`;

  const labelCls = "block text-[10.5px] font-black uppercase tracking-[.08em] text-muted-foreground mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[400px] h-full bg-card border-s border-border flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-[22px] py-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="m-0 text-[16.5px] font-bold text-foreground">{t("withdraw.title")}</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {t("withdraw.available")}:{" "}
                <strong style={{ color: "var(--primary)" }}>EGP {fmt(wallet.availableBalance)}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-[30px] h-[30px] rounded-lg border border-border bg-muted cursor-pointer
                         flex items-center justify-center text-muted-foreground"
            >
              <XIcon size={13} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-[22px] py-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
            {/* Method grid */}
            <div>
              <label className={labelCls}>{t("withdraw.method")}</label>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map(m => (
                  <button
                    key={m.value} type="button"
                    onClick={() => setMethod(m.value)}
                    className="flex items-center gap-1.5 py-[9px] px-3 rounded-[10px] text-[12.5px]
                               cursor-pointer transition-all duration-150 border"
                    style={{
                      border:      method === m.value ? `2px solid ${m.color}` : "1.5px solid var(--border)",
                      background:  method === m.value ? `${m.color}12` : "var(--background)",
                      color:       method === m.value ? m.color : "var(--foreground)",
                      fontWeight:  method === m.value ? 700 : 500,
                    }}
                  >
                    <span className="text-[14px]">{m.icon}</span>
                    <span>{t(`methods.${m.labelKey}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            {[
              { key: "phone", label: t("withdraw.phone"),  ph: "01012345678",     val: phone, set: setPhone, type: "text"  },
              { key: "name",  label: t("withdraw.name"),   ph: t("withdraw.namePlaceholder"), val: name, set: setName,   type: "text"  },
              { key: "email", label: t("withdraw.email"),  ph: "you@example.com", val: email, set: setEmail, type: "email" },
            ].map(f => (
              <div key={f.key}>
                <label className={labelCls}>{f.label}</label>
                <input
                  className={fieldCls(errors[f.key])}
                  type={f.type} placeholder={f.ph} value={f.val}
                  onChange={e => { f.set(e.target.value); clearErr(f.key); }}
                />
                {errors[f.key] && <p className="mt-1 text-[11px] text-destructive">{errors[f.key]}</p>}
              </div>
            ))}

            {/* Amount */}
            <div>
              <label className={labelCls}>{t("withdraw.amount")}</label>
              <div className="relative">
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[12.5px] font-bold text-muted-foreground pointer-events-none">
                  EGP
                </span>
                <input
                  className={`${fieldCls(errors.amount)} !ps-[50px]`}
                  placeholder="0.00" type="number" min="0" step="0.01" value={amount}
                  onChange={e => { setAmount(e.target.value); clearErr("amount"); }}
                />
              </div>
              {errors.amount && <p className="mt-1 text-[11px] text-destructive">{errors.amount}</p>}
            </div>

            <button
              type="submit"
              className="mt-1 py-[13px] rounded-[10px] border-none font-bold text-[14.5px] text-white
                         cursor-pointer flex items-center justify-center gap-2
                         transition-opacity duration-150 hover:opacity-90"
              style={{
                background: "linear-gradient(90deg, var(--primary), var(--third))",
                boxShadow: "0 4px 18px rgba(255,92,43,.3)",
              }}
            >
              <ArrowUpIcon size={14} />
              {t("withdraw.cta")}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, t }) {
  const cfg = {
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[.06em] ${cfg[status] ?? cfg.completed}`}>
      {t(`status.${status}`)}
    </span>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type, t }) {
  const cfg = {
    deposit:  { dot: "bg-green-500",  text: "text-green-700 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20" },
    withdraw: { dot: "bg-red-500",    text: "text-red-700 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-900/20"   },
    cod:      { dot: "bg-amber-500",  text: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20" },
  };
  const c = cfg[type] ?? cfg.deposit;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[.06em] ${c.bg} ${c.text}`}>
      <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${c.dot}`} />
      {t(`txTypes.${type}`)}
    </span>
  );
}

// ─── Amount Cell ──────────────────────────────────────────────────────────────
function AmountCell({ amount }) {
  const isPos = amount > 0;
  return (
    <span className={`text-sm font-bold tabular-nums ${isPos ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
      {isPos ? "+" : ""}EGP {fmt(Math.abs(amount))}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const t = useTranslations("wallet");

  const [wallet,      setWallet]      = useState(WALLET_INIT);
  const [txList,      setTxList]      = useState(TRANSACTIONS_INIT);
  const [activeTab,   setActiveTab]   = useState("all");
  const [toast,       setToast]       = useState({ message: "", type: "success" });
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw,setShowWithdraw]= useState(false);
  const [search,      setSearch]      = useState("");

  // ── toast helper ──
  function showToast(msg, type = "success") {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "" }), 3500);
  }

  // ── deposit handler ──
  function handleDeposit(amount) {
    setWallet(w => ({ ...w, walletBalance: w.walletBalance + amount, availableBalance: w.availableBalance + amount }));
    setTxList(prev => [{
      id: Date.now(), type: "deposit", labelKey: "walletTopup", amount,
      date: new Date().toISOString().slice(0, 10), status: "completed",
    }, ...prev]);
    setShowDeposit(false);
    showToast(t("toasts.depositSuccess", { amount: fmt(amount) }));
  }

  // ── withdraw handler ──
  function handleWithdraw({ method, amount }) {
    setWallet(w => ({
      ...w,
      walletBalance:    w.walletBalance    - amount,
      availableBalance: w.availableBalance - amount,
      totalWithdrawn:   w.totalWithdrawn   + amount,
    }));
    const m = METHODS.find(x => x.value === method);
    setTxList(prev => [{
      id: Date.now(), type: "withdraw",
      labelKey: m?.labelKey ? `${m.labelKey}Withdraw` : "bankTransferWithdraw",
      amount: -amount,
      date: new Date().toISOString().slice(0, 10), status: "completed",
    }, ...prev]);
    setShowWithdraw(false);
    showToast(t("toasts.withdrawSuccess", { amount: fmt(amount) }));
  }

  // ── export CSV ──
  function handleExport() {
    const header = [t("table.date"), t("table.description"), t("table.amount"), t("table.status")];
    const rows   = txList.map(tx => [
      fmtDate(tx.date),
      t(`txLabels.${tx.labelKey}`, { orderId: tx.orderId ?? "" }),
      tx.amount,
      t(`status.${tx.status}`),
    ]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "wallet-transactions.csv",
    });
    a.click();
    showToast(t("toasts.exported"));
  }

  // ── filtered list ──
  const filteredTx = useMemo(() => {
    let list = txList;
    if (activeTab === "deposits")    list = list.filter(t => t.type === "deposit");
    if (activeTab === "withdrawals") list = list.filter(t => t.type === "withdraw");
    if (activeTab === "cod")         list = list.filter(t => t.type === "cod");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(tx =>
        t(`txLabels.${tx.labelKey}`, { orderId: tx.orderId ?? "" }).toLowerCase().includes(q) ||
        fmtDate(tx.date).toLowerCase().includes(q)
      );
    }
    return list;
  }, [txList, activeTab, search]);

  // ── tab definitions ──
  const tabDefs = TAB_IDS.map(id => ({
    id,
    label: t(`tabs.${id}`),
    count: id === "all"         ? txList.length
         : id === "deposits"    ? txList.filter(x => x.type === "deposit").length
         : id === "withdrawals" ? txList.filter(x => x.type === "withdraw").length
         : txList.filter(x => x.type === "cod").length,
  }));

  // ── stat definitions ──
  const stats = [
    { id: "balance",   name: t("stats.walletBalance"),   value: wallet.walletBalance,    icon: WalletIcon,       color: "#2563eb" },
    { id: "available", name: t("stats.available"),       value: wallet.availableBalance, icon: CreditCardIcon,   color: "#22c55e"        },
    { id: "pending",   name: t("stats.pendingCOD"),      value: wallet.pendingCOD,       icon: ClockIcon,        color: "#f59e0b"        },
    { id: "withdrawn", name: t("stats.totalWithdrawn"),  value: wallet.totalWithdrawn,   icon: TrendingDownIcon, color: "#8b5cf6"        },
  ];

  // ── Table columns ──
  const columns = useMemo(() => [
    {
      key: "date",
      header: t("table.date"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {fmtDate(row.date)}
        </span>
      ),
    },
    {
      key: "type",
      header: t("table.type"),
      cell: (row) => <TypeBadge type={row.type} t={t} />,
    },
    {
      key: "labelKey",
      header: t("table.description"),
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {t(`txLabels.${row.labelKey}`, { orderId: row.orderId ?? "" })}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("table.amount"),
      cell: (row) => <AmountCell amount={row.amount} />,
    },
    {
      key: "status",
      header: t("table.status"),
      cell: (row) => <StatusBadge status={row.status} t={t} />,
    },
  ], [t]);

  // ── Table actions (toolbar buttons) ──
  const tableActions = [
    {
      key: "export",
      label: t("actions.export"),
      icon: <DownloadIcon size={13} />,
      color: "blue",
      onClick: handleExport,
    },
  ];

  return (
    <div className="min-h-screen ">

 
      {/* ── Main content ── */}
      <div className="p-5">

        {/* ── PageHeader: breadcrumb + stat cards + tabs ── */}
        <PageHeader
          breadcrumbs={[
            { name: t("breadcrumb.dashboard"), onClick: () => {} },
            { name: t("breadcrumb.wallet") },
          ]}
          buttons={
            <>
              <Button_ 
								icon={<ArrowUpIcon size={13} />}
								onClick={() => setShowWithdraw(true)}
								label={t("actions.withdraw")}
								tone="default"
								size="sm"
							/>
              <Button_ 
								icon={<PlusIcon size={13} />}
								onClick={() => setShowDeposit(true)}
								label={t("actions.deposit")}
 								size="sm"
							/>
                
            </>
          }
          stats={stats}
          items={tabDefs}
          active={activeTab}
          setActive={setActiveTab}
        />

        {/* ── Transaction Table (shared Table component) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Table
            /* search */
            searchValue={search}
            onSearchChange={setSearch}
            onSearch={() => {}}
            /* toolbar */
            actions={tableActions}
            labels={{
              searchPlaceholder: t("table.searchPlaceholder"),
              filter: t("table.filter"),
              apply:  t("table.apply"),
              emptyTitle:    t("table.emptyTitle"),
              emptySubtitle: t("table.emptySubtitle"),
            }}
            /* data */
            columns={columns}
            data={filteredTx}
            rowKey={(row) => row.id}
             pagination={{
              total_records: filteredTx.length,
              per_page:      filteredTx.length || 1,
              current_page:  1,
            }}
            hoverable
            compact={false}
          />
        </motion.div>
      </div>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {showDeposit  && <DepositModal  key="dep" onClose={() => setShowDeposit(false)}  onDeposit={handleDeposit}  t={t} />}
      </AnimatePresence>
      <AnimatePresence>
        {showWithdraw && <WithdrawPanel key="wdr" onClose={() => setShowWithdraw(false)} onWithdraw={handleWithdraw} wallet={wallet} t={t} />}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast.message && (
          <Toast key="toast" message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
        )}
      </AnimatePresence>
    </div>
  );
}