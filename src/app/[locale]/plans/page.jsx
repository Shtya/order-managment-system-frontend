"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Zap,
  Crown,
  Users,
  Truck,
  X,
  ArrowRight,
  Sparkles,
  Store,
  Package,
  Upload,
  AlertCircle,
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
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { dollorSign } from "@/utils/healpers";

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────── */
const T = {
  accent: "var(--primary)",
  accentGrad: "linear-gradient(90deg, var(--primary), var(--third, var(--secondary)))",
};

/* ─────────────────────────────────────────────────────────
   CUSTOM COMPONENTS (Matching Website Theme)
───────────────────────────────────────────────────────── */
function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-[15px] font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-3">
        <span className="w-[3px] h-5 bg-primary rounded-full block shrink-0" />
        {title}
      </h3>
      {action && <div>{action}</div>}
    </div>
  );
}

function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CUSTOM HOOK FOR SUBSCRIPTION API
───────────────────────────────────────────────────────── */
export function useSubscriptionsApi() {
  const t = useTranslations("subscriptions");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const { user, refreshUser } = useAuth();


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
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Subscribe to a plan
  const subscribe = useCallback(
    async (planId) => {
      setLoading(planId);
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
        console.error(error);
        const message =
          error?.response?.data?.message || t("errors.subscribeFailed");
        toast.error(Array.isArray(message) ? message[0] : message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t, fetchActiveSubscription],
  );

  // Cancel subscription
  const cancelSubscription = useCallback(
    async (subscriptionId) => {
      setLoading(subscriptionId);
      try {
        await api.post(`/subscriptions/cancel/${subscriptionId}`);
        toast.success(t("success.cancelled"));

        // Refresh active subscription
        await fetchActiveSubscription();
        await refreshUser()
      } catch (error) {
        const message =
          error?.response?.data?.message || t("errors.cancelFailed");
        toast.error(Array.isArray(message) ? message[0] : message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t, fetchActiveSubscription],
  );

  // Initial data fetch
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchActiveSubscription(), fetchPlans()]);
    };
    init();
  }, [fetchActiveSubscription, fetchPlans]);

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
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
    >
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-10 w-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-3 w-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="h-px bg-slate-50 dark:bg-slate-800" />
        <div className="space-y-4">
          {[70, 85, 60, 75].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
              <div
                className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </div>
        <div className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse mt-4" />
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
  isLoading,
  idx = 0,
}) {
  const { settings, isLoading: isSettingsLoading } = usePlatformSettings();
  const whatsapp = settings?.whatsapp;
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Check if this is a trial plan and user completed onboarding
  const cannotSubscribeToTrial =
    plan.type === "trial" && user?.onboardingStatus === "completed";

  // Determine if subscribe button should be disabled
  const isSubscribeDisabled =
    isDisabled || hasActiveSubscription || cannotSubscribeToTrial;

  const getDurationLabel = () => {
    if (plan.duration === "monthly") return t("duration.monthly");
    if (plan.duration === "yearly") return t("duration.yearly");
    if (plan.duration === "lifetime") return t("duration.lifetime");
    if (plan.duration === "custom")
      return `${plan.durationIndays || 0} ${t("duration.days")}`;
    return "";
  };

  const getPriceDisplay = () => {
    if (plan.type === "negotiated") {
      return (
        <span className="text-4xl font-black text-orange-600 dark:text-orange-400">
          {t("card.negotiated")}
        </span>
      );
    }

    if (plan.type === "trial") {
      return (
        <div className="flex flex-col items-center gap-2">
          <span
            style={{
              fontFamily:
                "'Instrument Serif', 'DM Serif Display', Georgia, serif",
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
      <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
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
        transition={{
          delay: idx * 0.09,
          duration: 0.35,
          ease: [0.16, 1, 0.3, 1],
        }}
        whileHover={{ y: -5, transition: { duration: 0.22 } }}
        className={cn(
          "relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group bg-white dark:bg-slate-900",
          isCurrentPlan
            ? "border-2 border-primary/60 shadow-[0_20px_50px_-12px_rgba(var(--primary-rgb),0.15)]"
            : "border border-slate-100 dark:border-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-lg hover:border-primary/20",
        )}
      >
        {/* Popular badge */}
        {plan.isPopular && !isCurrentPlan && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.09 + 0.22 }}
            className={cn("absolute top-5 z-10", isRTL ? "left-5" : "right-5")}
          >
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                text-[10px] font-black uppercase tracking-wider text-white bg-primary shadow-lg shadow-primary/20"
            >
              <Crown size={10} strokeWidth={2.5} />
              {t("card.popular")}
            </span>
          </motion.div>
        )}

        {/* Active badge (current plan) */}
        {isCurrentPlan && (
          <div
            className={cn("absolute top-5 z-10", isRTL ? "left-5" : "right-5")}
          >
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("card.active")}
            </span>
          </div>
        )}

        {/* Card body */}
        <div className="relative z-10 flex flex-col flex-1 gap-6 p-6">
          {/* Plan name */}
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">
              {plan.name}
            </p>
            {plan.description && (
              <p className="text-[13px] leading-relaxed font-medium text-slate-400 dark:text-slate-500">
                {plan.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            {plan.type === "negotiated" ? (
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {t("card.negotiated")}
              </span>
            ) : (
              <>
                <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                  {plan.price}
                </span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold uppercase text-slate-400 dark:text-slate-500">
                    {t("card.currency")}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    / {getDurationLabel()}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-50 dark:bg-slate-800" />

          {/* Limits Display */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: Users, label: t("limits.users"), value: plan.usersLimit === null ? t("limits.unlimited") : plan.usersLimit },
              { icon: Store, label: t("limits.stores"), value: plan.storesLimit === null ? t("limits.unlimited") : plan.storesLimit },
              { icon: Truck, label: t("limits.shipping"), value: plan.shippingCompaniesLimit === null ? t("limits.unlimited") : plan.shippingCompaniesLimit },
              { icon: Package, label: t("limits.orders"), value: plan.includedOrders === null ? t("limits.unlimited") : plan.includedOrders },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group/item">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/item:text-primary",
                    isCurrentPlan && "text-primary bg-primary/5 dark:bg-primary/10"
                  )}>
                    <item.icon size={14} />
                  </div>
                  <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                </div>
                <span className="text-[13px] font-black text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}

            {plan.extraOrderFee !== null ? (
              <div className="flex items-center justify-between p-3 rounded-xl border transition-colors bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">{t("limits.extraFee")}</span>
                <span className="text-[12px] font-black text-primary">
                  {plan.extraOrderFee} {dollorSign}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl border transition-colors bg-rose-50/50 dark:bg-rose-500/5 border-rose-100/50 dark:border-rose-500/10">
                <span className="text-[12px] font-bold text-rose-500/70">{t("limits.extraFee")}</span>
                <span className="text-[11px] font-black text-rose-500 uppercase">{t("limits.notAllowed")}</span>
              </div>
            )}
          </div>

          {/* Features */}
          {plan.features && plan.features.length > 0 && (
            <div className="space-y-4 pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {t("card.includedFeatures")}
              </p>
              <ul className="space-y-3">
                {plan.features.map((label, i) => (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.09 + i * 0.04 + 0.14 }}
                    className="flex items-start gap-3"
                  >
                    <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20">
                      <Check size={10} strokeWidth={4} className="text-emerald-500" />
                    </div>
                    <span className="text-[13px] font-bold leading-tight text-slate-600 dark:text-slate-300">
                      {label}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-auto pt-6">
            {isCurrentPlan ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="group relative w-full h-11 rounded-xl font-black text-[13px] tracking-wide transition-all duration-300 bg-rose-50 dark:bg-rose-500/5 text-rose-600 border border-rose-100 dark:border-rose-500/20 hover:bg-rose-600 hover:text-white hover:border-rose-600"
              >
                <span className="flex items-center justify-center gap-2">
                  <X size={16} strokeWidth={2.5} />
                  {t("actions.cancel")}
                </span>
              </button>
            ) : plan.type === "negotiated" ? (
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(t("messages.whatsappInterested", { planName: plan.name }))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full h-11 rounded-xl font-black text-[13px] tracking-wide transition-all duration-300 bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <MessageCircle size={18} fill="currentColor" />
                  {t("actions.contactToSubscribe")}
                </span>
              </a>
            ) : (
              <button
                onClick={() => !isSubscribeDisabled && onSubscribe(plan.id)}
                disabled={isSubscribeDisabled}
                className={cn(
                  "group relative w-full h-11 rounded-xl font-black text-[13px] tracking-wide transition-all duration-300",
                  isSubscribeDisabled
                    ? "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-100 dark:border-slate-700"
                    : "bg-primary text-white shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary/30"
                )}
              >
                <span className="flex items-center justify-center gap-2">
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
                      {isLoading ? (
                        <Loader2 className="animate-spin size-4" />
                      ) : (
                        <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
                      )}
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      </motion.article>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-6">
                  <AlertCircle
                    size={32}
                    className="text-rose-600 dark:text-rose-400"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                  {t("cancel.title")}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                  {t("cancel.message")}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[13px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t("cancel.no")}
                </button>
                <button
                  onClick={() => {
                    handleCancel(activeSubscription.id);
                  }}
                  className="flex-1 h-12 bg-rose-600 text-white rounded-xl font-black text-[13px] hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98]"
                >
                  {t("cancel.yes")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    cancelSubscription,
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

  const currentPlanId =
    activeSubscription?.plan?.id || activeSubscription?.planId;
  const hasActiveSubscription = !!activeSubscription;

  return (
    <div className="container mx-auto px-4 !mt-8 !mb-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
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
            {/* {hasActiveSubscription && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Check
                    size={24}
                    className="text-emerald-500"
                  />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-black text-[15px] text-emerald-900 dark:text-emerald-400 mb-0.5">
                    {t("activeAlert.title")}
                  </h3>
                  <p className="text-[13px] font-medium text-emerald-700/70 dark:text-emerald-500/70">
                    {t("activeAlert.message")}
                  </p>
                </div>
              </motion.div>
            )} */}

            {/* Plans Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                [0, 1, 2].map((i) => (
                  <PlanCardSkeleton key={i} idx={i} />
                ))
              ) : (
                plans.map((plan, idx) => (
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
                    isLoading={loading === plan.id}
                    idx={idx}
                  />
                ))
              )}
            </div>
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
