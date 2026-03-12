"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Zap, Crown, Users, Truck, X,
  ArrowRight, Sparkles, Store, Package, Upload, AlertCircle,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import TransactionTab from "../dashboard/plans/tabs/transactionTab";
import PageHeader from "@/components/atoms/Pageheader";
import PurchasedFeaturesTab from "./purchasedFeaturesTab";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import SubscriptionsTab from "../dashboard/plans/tabs/subscriptionsTab";

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────── */
const T = {
  inkCard: "#0f0e0d",
  onInk: "rgba(255,255,255,1)",
  onInkSoft: "rgba(255,255,255,0.72)",
  onInkMuted: "rgba(255,255,255,0.38)",
  onInkRule: "rgba(255,255,255,0.08)",
  accent: "var(--primary)",
  accentGrad: "linear-gradient(90deg, var(--primary), var(--third, #ff5c2b))",
};

/* ─────────────────────────────────────────────────────────
   CUSTOM HOOK FOR SUBSCRIPTION API
───────────────────────────────────────────────────────── */
export function useSubscriptionsApi() {
  const t = useTranslations("subscriptions");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch user data
  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get("/users/me");
      setUser(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      toast.error(t("errors.fetchUserFailed"));
      return null;
    }
  }, [t]);

  // Fetch active subscription
  const fetchActiveSubscription = useCallback(async () => {
    try {
      const { data } = await api.get("/subscriptions/me/active");
      setActiveSubscription(data);
      return data;
    } catch (error) {
      // No active subscription is not an error
      if (error?.response?.status === 404) {
        setActiveSubscription(null);
        return null;
      }
      console.error("Failed to fetch active subscription:", error);
      return null;
    }
  }, []);

  // Fetch all plans
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/plans");
      setPlans(data || []);
      return data;
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error(t("errors.fetchPlansFailed"));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Subscribe to a plan
  const subscribe = useCallback(async (planId) => {
    setLoading(true);
    try {
      const { data } = await api.post("/subscriptions/subscribe", { planId });

      if (data.subscriptionId) {
        await fetchActiveSubscription();
      }
      // Redirect to checkout URL
      else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success(t("success.subscribed"));
        // Refresh active subscription
        await fetchActiveSubscription();
      }

      return data;
    } catch (error) {
      console.log(error)
      const message = error?.response?.data?.message || t("errors.subscribeFailed");
      toast.error(Array.isArray(message) ? message[0] : message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t, fetchActiveSubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId) => {
    setLoading(true);
    try {
      await api.post(`/subscriptions/cancel/${subscriptionId}`);
      toast.success(t("success.cancelled"));

      // Refresh active subscription
      await fetchActiveSubscription();
    } catch (error) {
      const message = error?.response?.data?.message || t("errors.cancelFailed");
      toast.error(Array.isArray(message) ? message[0] : message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t, fetchActiveSubscription]);

  // Initial data fetch
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchUser(),
        fetchActiveSubscription(),
        fetchPlans(),
      ]);
    };
    init();
  }, [fetchUser, fetchActiveSubscription, fetchPlans]);

  return {
    loading,
    isLoading,
    plans,
    activeSubscription,
    user,
    subscribe,
    cancelSubscription,
    fetchPlans,
    fetchActiveSubscription,
    fetchUser,
  };
}

/* ─────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────── */
function PlanCardSkeleton({ idx = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse"
    >
      <div className="p-7 space-y-6">
        <div className="space-y-2">
          <div className="h-2.5 w-14 rounded-full bg-muted/70" />
          <div className="h-16 w-32 rounded-xl bg-muted/60" />
          <div className="h-2.5 w-20 rounded-full bg-muted/50" />
        </div>
        <div className="h-px bg-border/60" />
        <div className="space-y-3.5">
          {[70, 85, 60, 75].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-muted/60 shrink-0" />
              <div className="h-2.5 rounded-full bg-muted/50" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        <div className="h-11 w-full rounded-xl bg-muted/60" />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   PLAN CARD
───────────────────────────────────────────────────────── */
function PlanCard({
  plan,
  onSubscribe,
  onCancel,
  isCurrentPlan,
  hasActiveSubscription,
  activeSubscription,
  user,
  isDisabled,
  idx = 0
}) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Check if this is a trial plan and user completed onboarding
  const cannotSubscribeToTrial = plan.type === 'trial' && user?.onboardingStatus === 'completed';

  // Determine if subscribe button should be disabled
  const isSubscribeDisabled = isDisabled || hasActiveSubscription || cannotSubscribeToTrial;

  const getDurationLabel = () => {
    if (plan.duration === "monthly") return t("duration.monthly");
    if (plan.duration === "yearly") return t("duration.yearly");
    if (plan.duration === "lifetime") return t("duration.lifetime");
    if (plan.duration === "custom") return `${plan.durationIndays || 0} ${t("duration.days")}`;
    return "";
  };

  const getPriceDisplay = () => {
    if (plan.type === 'negotiated') {
      return (
        <span className="text-4xl font-black text-orange-600 dark:text-orange-400">
          {t("card.negotiated")}
        </span>
      );
    }

    if (plan.type === 'trial') {
      return (
        <div className="flex flex-col items-center gap-2">
          <span
            style={{
              fontFamily: "'Instrument Serif', 'DM Serif Display', Georgia, serif",
              fontSize: 68,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              fontWeight: 400,
              color: isCurrentPlan ? T.onInk : "var(--foreground)",
            }}
          >
            {plan.price || 0}
          </span>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-bold">
            {t("card.trial")}
          </span>
        </div>
      );
    }

    return (
      <span
        style={{
          fontFamily: "'Instrument Serif', 'DM Serif Display', Georgia, serif",
          fontSize: 68,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          fontWeight: 400,
          color: isCurrentPlan ? T.onInk : "var(--foreground)",
        }}
      >
        {plan.price}
      </span>
    );
  };

  async function handleCancel(id) {
    await onCancel(activeSubscription.id);
    setShowCancelConfirm(false);
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.09, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -5, transition: { duration: 0.22 } }}
        className={cn(
          "relative rounded-2xl overflow-hidden flex flex-col transition-shadow duration-300",
          isCurrentPlan
            ? "border-2 border-transparent shadow-[0_20px_60px_-12px_rgba(0,0,0,0.45)]"
            : "border border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_-8px_rgba(255,106,30,0.16)] hover:border-[var(--primary)]/25",
        )}
        style={{ background: isCurrentPlan ? T.inkCard : "var(--card)" }}
      >
        {/* Top gradient bar (current plan only) */}
        {isCurrentPlan && (
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: T.accentGrad }}
          />
        )}

        {/* Left/right accent bar (non-current) */}
        {!isCurrentPlan && (
          <div
            className={cn(
              "absolute top-10 bottom-10 w-[3px] rounded-full",
              isRTL ? "right-0" : "left-0",
            )}
            style={{ background: T.accentGrad, opacity: 0.45 }}
          />
        )}

        {/* Popular badge */}
        {plan.isPopular && !isCurrentPlan && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.09 + 0.22 }}
            className={cn("absolute top-5 z-10", isRTL ? "left-5" : "right-5")}
          >
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                text-[10px] font-black uppercase tracking-[0.14em] text-white"
              style={{
                background: T.accent,
                boxShadow: "0 2px 10px -2px rgba(255,106,30,0.5)",
              }}
            >
              <Crown size={8} strokeWidth={2.5} />
              {t("card.popular")}
            </span>
          </motion.div>
        )}

        {/* Active badge (current plan) */}
        {isCurrentPlan && (
          <div className={cn("absolute top-5 z-10", isRTL ? "left-5" : "right-5")}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                text-[10px] font-black uppercase tracking-[0.14em]"
              style={{
                background: "rgba(255,255,255,0.09)",
                color: T.onInkSoft,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {t("card.active")}
            </span>
          </div>
        )}

        {/* Card body */}
        <div className="relative z-10 flex flex-col flex-1 gap-5 p-7">
          {/* Plan name */}
          <p
            className="text-[10.5px] font-black uppercase tracking-[0.2em]"
            style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}
          >
            {plan.name}
          </p>

          {/* Price */}
          <div className="flex items-end gap-2 -mt-2">
            {getPriceDisplay()}
            {plan.type !== 'negotiated' && (
              <div className="flex flex-col mb-2 gap-1">
                <span
                  className="text-[13px] font-bold leading-none"
                  style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}
                >
                  {t("card.currency")}
                </span>
                <span
                  className="text-[10.5px] font-semibold leading-none"
                  style={{ color: isCurrentPlan ? "rgba(255,255,255,0.28)" : "var(--muted-foreground)" }}
                >
                  / {getDurationLabel()}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {plan.description ? (
            <p
              className="text-[12.5px] leading-relaxed -mt-2"
              style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}
            >
              {plan.description}
            </p>
          ) : null}

          {/* Divider */}
          <div
            className="h-px"
            style={{
              background: isCurrentPlan
                ? T.onInkRule
                : "linear-gradient(to left, transparent, var(--border) 40%, transparent)",
            }}
          />

          {/* Limits Display */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}>
                <Users size={13} className="inline mr-1.5" />
                {t("limits.users")}
              </span>
              <span className="font-semibold" style={{ color: isCurrentPlan ? T.onInk : "var(--foreground)" }}>
                {plan.usersLimit === null ? t("limits.unlimited") : plan.usersLimit}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}>
                <Store size={13} className="inline mr-1.5" />
                {t("limits.stores")}
              </span>
              <span className="font-semibold" style={{ color: isCurrentPlan ? T.onInk : "var(--foreground)" }}>
                {plan.storesLimit === null ? t("limits.unlimited") : plan.storesLimit}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}>
                <Truck size={13} className="inline mr-1.5" />
                {t("limits.shipping")}
              </span>
              <span className="font-semibold" style={{ color: isCurrentPlan ? T.onInk : "var(--foreground)" }}>
                {plan.shippingCompaniesLimit === null ? t("limits.unlimited") : plan.shippingCompaniesLimit}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}>
                <Package size={13} className="inline mr-1.5" />
                {t("limits.orders")}
              </span>
              <span className="font-semibold" style={{ color: isCurrentPlan ? T.onInk : "var(--foreground)" }}>
                {plan.includedOrders === null ? t("limits.unlimited") : plan.includedOrders}
              </span>
            </div>

            {plan.extraOrderFee !== null && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}>
                  {t("limits.extraFee")}
                </span>
                <span className="font-semibold" style={{ color: isCurrentPlan ? T.onInk : "var(--foreground)" }}>
                  {plan.extraOrderFee} {t("card.currency")}
                </span>
              </div>
            )}

            {plan.extraOrderFee === null && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}>
                  {t("limits.extraFee")}
                </span>
                <span className="text-xs font-medium text-red-500 dark:text-red-400">
                  {t("limits.notAllowed")}
                </span>
              </div>
            )}

            {plan.bulkUploadPerMonth > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }}>
                  <Upload size={13} className="inline mr-1.5" />
                  {t("limits.bulkUpload")}
                </span>
                <span className="font-semibold" style={{ color: isCurrentPlan ? T.onInk : "var(--foreground)" }}>
                  {plan.bulkUploadPerMonth}
                </span>
              </div>
            )}
          </div>

          {/* Features */}
          {plan.features && plan.features.length > 0 && (
            <>
              <div
                className="h-px"
                style={{
                  background: isCurrentPlan
                    ? T.onInkRule
                    : "linear-gradient(to left, transparent, var(--border) 40%, transparent)",
                }}
              />
              <ul className="space-y-3 flex-1">
                {plan.features.map((label, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: isRTL ? 6 : -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.09 + i * 0.04 + 0.14 }}
                    className={cn(
                      "flex items-center gap-3",
                      isRTL ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center"
                      style={{
                        background: isCurrentPlan
                          ? "rgba(255,255,255,0.12)"
                          : "color-mix(in oklab, var(--primary) 12%, transparent)",
                      }}
                    >
                      <Check size={11} strokeWidth={3} style={{ color: isCurrentPlan ? T.onInk : T.accent }} />
                    </div>
                    <span
                      className="text-[13.5px] leading-[1.5] tracking-[-0.005em]"
                      style={{
                        color: isCurrentPlan ? T.onInkSoft : "var(--foreground)",
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </>
          )}

          {/* Action Button */}
          <div className="mt-auto pt-4">
            {isCurrentPlan ? (
              // ── زر الإلغاء (الخطة الحالية) ──────────────────────────────
              <button
                onClick={() => setShowCancelConfirm(true)}
                className={cn(
                  "group relative w-full h-11 rounded-xl font-semibold text-sm tracking-wide",
                  "transition-all duration-200 overflow-hidden",
                  "border border-white/20 hover:border-red-400/40"
                )}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: T.onInk,
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <X size={16} />
                  {t("actions.cancel")}
                </span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.15))",
                  }}
                />
              </button>
            ) : plan.type === "negotiated" ? (
              // ── زر الواتساب (لخطط التفاوض) ──────────────────────────────
              <a
                /* استبدل NEXT_PUBLIC_WHATSAPP_NUMBER بمتغير البيئة الخاص بك (مثل VITE_WHATSAPP_NUMBER إذا كنت تستخدم Vite) */
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  t("messages.whatsappInterested", { planName: plan.name }) || `مرحباً، أنا مهتم بخطة ${plan.name}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group relative flex items-center justify-center w-full h-11 rounded-xl font-semibold text-sm tracking-wide",
                  "transition-all duration-200 overflow-hidden",
                  "hover:scale-[1.02] active:scale-[0.98]"
                )}
                style={{
                  background: "#25D366", // لون واتساب الرسمي
                  color: "white",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {/* يمكنك استخدام أيقونة واتساب إذا كانت متوفرة لديك، أو MessageCircle من lucide-react */}
                  <MessageCircle size={16} />
                  {t("actions.contactToSubscribe") || "تواصل للاشتراك"}
                </span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/10" />
              </a>
            ) : (
              // ── زر الاشتراك العادي (الخطط القياسية والتجريبية) ────────────
              <button
                onClick={() => !isSubscribeDisabled && onSubscribe(plan.id)}
                disabled={isSubscribeDisabled}
                className={cn(
                  "group relative w-full h-11 rounded-xl font-semibold text-sm tracking-wide",
                  "transition-all duration-200 overflow-hidden",
                  isSubscribeDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:scale-[1.02] active:scale-[0.98]"
                )}
                style={{
                  background: isSubscribeDisabled ? "var(--muted)" : T.accentGrad,
                  color: isSubscribeDisabled ? "var(--muted-foreground)" : "white",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {cannotSubscribeToTrial ? (
                    <>
                      <AlertCircle size={16} />
                      {t("actions.trialNotAllowed")}
                    </>
                  ) : hasActiveSubscription ? (
                    <>
                      <AlertCircle size={16} />
                      {t("actions.hasActive")}
                    </>
                  ) : (
                    <>
                      {t("actions.subscribe")}
                      {isDisabled ? <Loader2 className="animate-spin" /> : <ArrowRight size={16} />}
                    </>
                  )}
                </span>
                {!isSubscribeDisabled && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/10" />
                )}
              </button>
            )}
          </div>
        </div>
      </motion.article>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border-2 border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("cancel.title")}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("cancel.message")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                {t("cancel.no")}
              </button>
              <button
                onClick={() => {
                  handleCancel(activeSubscription.id)
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                {t("cancel.yes")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = searchParams.get("tab") || "plans";
  const {
    loading,
    isLoading,
    plans,
    activeSubscription,
    user,
    subscribe,
    cancelSubscription
  } = useSubscriptionsApi();

  const tabs = [
    { id: "plans", label: t("tabs.plans") },
    { id: "subscriptions", label: t("tabs.history") },
    { id: "transactions", label: t("tabs.transactions") },
    { id: "features", label: t("tabs.features") },
  ];

  const handleTabChange = (tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentPlanId = activeSubscription?.plan?.id || activeSubscription?.planId;
  const hasActiveSubscription = !!activeSubscription;

  return (
    <div className="container mx-auto px-4 !mt-8 !mb-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/" },
          { name: t("breadcrumb.subscriptions") },
        ]}
        items={tabs}
        active={activeTab}
        setActive={handleTabChange}
      />


      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "plans" && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Active Subscription Alert */}
            {hasActiveSubscription && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Check size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                    {t("activeAlert.title")}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t("activeAlert.message")}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Plans Grid */}
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <PlanCardSkeleton key={i} idx={i} />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan, idx) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSubscribe={subscribe}
                    onCancel={cancelSubscription}
                    isCurrentPlan={plan.id === currentPlanId}
                    hasActiveSubscription={hasActiveSubscription}
                    activeSubscription={activeSubscription}
                    user={user}
                    isDisabled={loading}
                    idx={idx}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "subscriptions" && (
          <motion.div
            key="subscriptions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SubscriptionsTab />
          </motion.div>
        )}

        {activeTab === "transactions" && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TransactionTab />
          </motion.div>
        )}

        {activeTab === "features" && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PurchasedFeaturesTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}