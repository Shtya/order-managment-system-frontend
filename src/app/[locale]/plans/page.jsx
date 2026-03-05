"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Zap, Crown, Users, Truck, X,
  ArrowRight, Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { getUser } from "@/hook/getUser";
import TransactionTab from "../dashboard/plans/tabs/transactionTab";
import PageHeader from "@/components/atoms/Pageheader";

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS
   All colours reference CSS vars so they work in both
   light and dark mode automatically.
───────────────────────────────────────────────────────── */
const T = {
  inkCard:    "#0f0e0d",
  onInk:      "rgba(255,255,255,1)",
  onInkSoft:  "rgba(255,255,255,0.72)",
  onInkMuted: "rgba(255,255,255,0.38)",
  onInkRule:  "rgba(255,255,255,0.08)",
  accent:     "var(--primary)",
  accentGrad: "linear-gradient(90deg, var(--primary), var(--third, #ff5c2b))",
};

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
function PlanCard({ plan, onSubscribe, isCurrentPlan, idx = 0 }) {
  const t      = useTranslations("subscriptions");
  const locale = useLocale();
  const isRTL  = locale === "ar";

  const usersLimit    = Number(plan.usersLimit    ?? 1);
  const shippingLimit = Number(plan.shippingCompaniesLimit ?? 0);

  const allFeatures = [
    ...(plan.features || []).map(f => ({ label: f, type: "feature" })),
    { label: `${usersLimit} ${t("card.users")}`,                type: "limit", Icon: Users },
    { label: `${shippingLimit} ${t("card.shippingCompanies")}`, type: "limit", Icon: Truck },
  ];

  return (
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

      {/* ─── Card body ─── */}
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
              / {plan.duration}
            </span>
          </div>
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

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {allFeatures.map(({ label, type, Icon }, i) => (
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
                  background: type === "feature"
                    ? isCurrentPlan
                      ? "rgba(255,255,255,0.12)"
                      : "color-mix(in oklab, var(--primary) 12%, transparent)"
                    : isCurrentPlan
                      ? "rgba(255,255,255,0.06)"
                      : "var(--muted)",
                }}
              >
                {type === "feature"
                  ? <Check size={11} strokeWidth={3} style={{ color: isCurrentPlan ? T.onInk : T.accent }} />
                  : Icon
                    ? <Icon size={11} style={{ color: isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)" }} />
                    : null
                }
              </div>
              <span
                className="text-[13px] leading-snug"
                style={{
                  fontWeight: type === "feature" ? 500 : 400,
                  color: type === "feature"
                    ? isCurrentPlan ? T.onInkSoft : "var(--foreground)"
                    : isCurrentPlan ? T.onInkMuted : "var(--muted-foreground)",
                }}
              >
                {label}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <div className="pt-1">
          {isCurrentPlan ? (
            <motion.button
              onClick={() => onSubscribe(plan)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.975 }}
              className="w-full h-11 rounded-xl text-[13px] font-bold
                transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: T.onInkSoft,
                border: "1px solid rgba(255,255,255,0.10)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = T.onInkSoft;
              }}
            >
              <X size={13} strokeWidth={2.5} />
              {t("card.cancelPlan")}
            </motion.button>
          ) : (
            <motion.button
              onClick={() => onSubscribe(plan)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.975 }}
              className="relative w-full h-11 rounded-xl text-[13px] font-bold
                text-white overflow-hidden transition-all duration-200
                flex items-center justify-center gap-2"
              style={{
                background: T.accentGrad,
                boxShadow: "0 3px 14px -4px rgba(255,92,43,0.38)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 6px 22px -4px rgba(255,92,43,0.52)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "0 3px 14px -4px rgba(255,92,43,0.38)";
              }}
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1/2 pointer-events-none rounded-t-xl"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.16), transparent)" }}
              />
              <Zap size={13} strokeWidth={2.5} />
              <span className="relative">{t("card.subscribe")}</span>
              <ArrowRight
                size={12} strokeWidth={2.5}
                className={cn("relative opacity-70", isRTL && "rotate-180")}
              />
            </motion.button>
          )}
        </div>

      </div>
    </motion.article>
  );
}

 

/* ─────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────── */
function EmptyPlans({ t }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center border border-border"
        style={{ background: "color-mix(in oklab, var(--primary) 8%, transparent)" }}
      >
        <Crown size={24} style={{ color: "var(--primary)" }} />
      </div>
      <div>
        <p className="text-[15px] font-bold text-foreground">{t("empty.title")}</p>
        <p className="text-[13px] text-muted-foreground mt-1">{t("empty.subtitle")}</p>
      </div>
    </motion.div>
  );
}
 

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function SubscriptionsPage() {
  const t    = useTranslations("subscriptions");
  const user = getUser();

  const [activeTab,   setActiveTab]   = useState("plans");
  const [isLoading,   setIsLoading]   = useState(false);
  const [plans,       setPlans]       = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);

  const tabs = useMemo(() => [
    { id: "plans",        label: t("tabs.plans")        },
    { id: "transactions", label: t("tabs.transactions") },
  ], [t]);

  const durationLabel = (d) => {
    if (d === "monthly")  return t("duration.monthly");
    if (d === "yearly")   return t("duration.yearly");
    return t("duration.lifetime");
  };

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/plans/available");
      setPlans((data || []).map(plan => ({
        id:                     plan.id,
        name:                   plan.name,
        price:                  Number(plan.price),
        duration:               durationLabel(plan.duration),
        description:            plan.description || "",
        features:               Array.isArray(plan.features) ? plan.features : [],
        isPopular:              plan.isPopular,
        usersLimit:             Number(plan.usersLimit    ?? plan.maxUsers               ?? 1),
        shippingCompaniesLimit: Number(plan.shippingCompaniesLimit ?? plan.maxShippingCompanies ?? 0),
      })));
    } catch {
      toast.error(t("errors.fetchPlans"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "plans") {
      fetchPlans();
      setCurrentPlan(user?.plan?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSubscribe = async (_plan) => {
    // TODO: implement subscription flow
  };

  const activePlan = plans.find(p => p.id === currentPlan) ?? null;

  return (
    <div className="min-h-screen p-5">

      {/* Compact header — breadcrumb + inline pill tabs (no stats/buttons) */}
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/" },
          { name: t("breadcrumb.subscriptions") },
        ]}
        items={tabs}
        active={activeTab}
        setActive={setActiveTab}
      />

      <AnimatePresence mode="wait">

        {/* ════ PLANS ════ */}
        {activeTab === "plans" && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.26 }}
          >
            
 
            {isLoading && plans.length === 0 ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <PlanCardSkeleton key={i} idx={i} />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <EmptyPlans t={t} />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
                {plans.map((plan, idx) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    idx={idx}
                    isCurrentPlan={currentPlan === plan.id}
                    onSubscribe={handleSubscribe}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ════ TRANSACTIONS ════ */}
        {activeTab === "transactions" && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.26 }}
          >
            <TransactionTab />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}