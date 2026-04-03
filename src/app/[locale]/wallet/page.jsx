"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import TransactionTab from "../dashboard/plans/tabs/transactionTab";

// ─── Payment Purpose Enum ─────────────────────────────────────────────────────
const PaymentPurposeEnum = {
  WALLET_TOP_UP: "wallet_top_up",
  WALLET_WITHDRAWAL: "wallet_withdrawal",
};

// ─── Deposit Modal ────────────────────────────────────────────────────────────


// ─── Icons ────────────────────────────────────────────────────────────────────
const WalletIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);
const TrendingUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const TrendingDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);
const ArrowUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WalletPage() {
  const t = useTranslations("wallet");
  const { formatCurrency, currency } = usePlatformSettings();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch wallet data
  useEffect(() => {
    fetchWallet();
  }, [refreshKey]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/wallet/my-wallet");
      setWallet(data);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      toast.error(t("errors.fetchWalletFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (amount) => {
    try {
      const { data } = await api.post("/wallet/top-up", { amount });

      if (data.checkoutUrl) {
        // Redirect to payment gateway
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(t("errors.noCheckoutUrl"));
      }
    } catch (error) {
      console.error("Error initiating top-up:", error);
      throw error;
    }
  };

  const handleTransactionUpdate = () => {
    // Refresh wallet data when transactions change
    setRefreshKey((prev) => prev + 1);
  };

  // Stats for PageHeader
  const stats = [
    {
      id: "currentBalance",
      name: t("stats.currentBalance"),
      value: formatCurrency(wallet?.currentBalance || 0),
      icon: WalletIcon,
      color: "#8b5cf6",
    },
    {
      id: "totalCharged",
      name: t("stats.totalCharged"),
      value: formatCurrency(wallet?.totalCharged || 0),
      icon: TrendingUpIcon,
      color: "#10b981",
    },
    {
      id: "totalWithdrawn",
      name: t("stats.totalWithdrawn"),
      value: formatCurrency(wallet?.totalWithdrawn || 0),
      icon: TrendingDownIcon,
      color: "#ef4444",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-6">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), onClick: () => { } },
          { name: t("breadcrumb.wallet") },
        ]}
        buttons={
          <>
            <Button_
              icon={<ArrowUpIcon size={13} />}
              onClick={() => setShowDepositModal(true)}
              label={t("actions.topUp")}
              tone="primary"
              size="sm"
            />
          </>
        }
        stats={stats}
      />

      {/* Transactions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="border-b border-gray-200 dark:border-slate-800 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t("transactions.title")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("transactions.subtitle")}
          </p>
        </div>

        <div className="p-6">
          <TransactionTab
            allowedPurposes={[
              PaymentPurposeEnum.WALLET_TOP_UP,
              PaymentPurposeEnum.WALLET_WITHDRAWAL,
            ]}
            onTransactionUpdate={handleTransactionUpdate}
          />
        </div>
      </motion.div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <DepositModal
            onClose={() => setShowDepositModal(false)}
            onDeposit={handleDeposit}
            t={t}
            currency={currency}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DepositModal({ onClose, onDeposit, t, currency }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);

    if (!amount || isNaN(amt) || amt <= 0) {
      setErr(t("validation.validAmount"));
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      await onDeposit(amt);
    } catch (error) {
      setErr(error?.response?.data?.message || t("errors.depositFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="relative overflow-hidden px-6 py-5 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Plus size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t("deposit.title")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("deposit.subtitle")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <span className="text-gray-600 dark:text-gray-400">✕</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("deposit.amountLabel")}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErr("");
                }}
                placeholder={t("deposit.amountPlaceholder")}
                className="w-full h-12 px-4 pr-16 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                disabled={submitting}
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                {currency}
              </span>
            </div>
            {err && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <span>⚠</span> {err}
              </p>
            )}
          </div>

          {/* Quick amounts */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {t("deposit.quickAmounts")}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 5000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setAmount(String(quick))}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-primary/10 dark:hover:bg-primary/20 border border-gray-200 dark:border-slate-700 hover:border-primary text-sm font-bold text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50"
                >
                  {quick}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              {t("deposit.info")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {t("actions.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white font-bold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("actions.processing")}
                </>
              ) : (
                <>
                  <Plus size={18} />
                  {t("actions.topUp")}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}