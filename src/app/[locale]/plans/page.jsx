"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft, Check, CreditCard, Calendar, Package,
	RefreshCw, Sparkles, Crown, Zap, Users, Truck, X,
	Info,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import Button_ from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { getUser } from "@/hook/getUser";
import TransactionTab from "../dashboard/plans/tabs/transactionTab";
import PageHeader from "@/components/atoms/Pageheader";

/* ═══════════════════════════════════════════════════════════
	 Skeleton
═══════════════════════════════════════════════════════════ */
function PlanCardSkeleton() {
	return (
		<div className="relative rounded-xl border-2 border-border/60 bg-card overflow-hidden animate-pulse">
			{/* top bar */}
			<div className="h-[3px] bg-muted/60" />
			<div className="p-6 space-y-5">
				<div className="flex items-end gap-2 justify-end">
					<div className="h-8 w-20 rounded-xl bg-muted/60" />
					<div className="h-5 w-8 rounded bg-muted/40" />
				</div>
				<div className="h-5 w-32 rounded-xl bg-muted/50 ms-auto" />
				<div className="h-px bg-border/40" />
				<div className="space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center gap-2.5 justify-end">
							<div className="h-3 w-40 rounded bg-muted/50" />
							<div className="w-5 h-5 rounded-full bg-muted/60 flex-shrink-0" />
						</div>
					))}
				</div>
				<div className="h-11 w-full rounded-xl bg-muted/60" />
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════
	 Plan Card — layout mirrors the screenshot
	 (price top-right, name below, features list, CTA)
═══════════════════════════════════════════════════════════ */
function PlanCard({ plan, onSubscribe, isCurrentPlan }) {
  const t   = useTranslations("subscriptions");
  const dir = useLocale(); // "rtl" | "ltr"
  const isRTL = dir === "rtl";

  const usersLimit    = Number(plan.usersLimit ?? 1);
  const shippingLimit = Number(plan.shippingCompaniesLimit ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative rounded-xl border overflow-hidden flex flex-col group",
        "transition-all duration-300",
        isCurrentPlan
          ? "border-[var(--primary)]/40 bg-card shadow-[0_12px_40px_-6px_rgb(var(--primary-shadow))]"
          : "border-border/60 bg-card hover:border-[var(--primary)]/35 hover:shadow-[0_6px_28px_-6px_rgb(var(--primary-shadow))]",
      )}
    >
      {/* ── CURRENT PLAN: full gradient background with texture ── */}
      {isCurrentPlan && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/92 to-[var(--third,#ff5c2b)]" />
          {/* diagonal shine */}
          <div className="absolute inset-0 opacity-[0.08]"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)" }} />
          {/* bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-32 opacity-20"
            style={{ background: "linear-gradient(to top, var(--third, #ff5c2b), transparent)" }} />
        </>
      )}

      {/* ── NON-CURRENT: subtle hover tint ── */}
      {!isCurrentPlan && (
        <div className="absolute inset-0 pointer-events-none
          bg-gradient-to-br from-[var(--primary)]/0 to-[var(--primary)]/0
          group-hover:from-[var(--primary)]/[0.025] group-hover:to-[var(--secondary,#ffb703)]/[0.015]
          transition-all duration-500" />
      )}

      {/* ── Top accent bar ── */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-[3px] transition-opacity duration-300",
        isCurrentPlan
          ? "bg-white/30"
          : "bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,#ffb703)] to-[var(--third,#ff5c2b)] opacity-70 group-hover:opacity-100",
      )} />

      {/* ── Popular badge ── */}
      {plan.isPopular && !isCurrentPlan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className={cn("absolute top-4 z-10", isRTL ? "left-4" : "right-4")}
        >
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black
            bg-[var(--primary)] text-primary-foreground tracking-wide
            shadow-[0_2px_8px_-2px_rgb(var(--primary-shadow))]">
            <Crown size={9} />
            {t("card.popular")}
          </span>
        </motion.div>
      )}

      <div className="relative z-10 p-3 pb-0 flex flex-col gap-4 flex-1">

        {/* ══════════════════════════════════════════════════
            PRICE BLOCK — large gradient number + currency
        ══════════════════════════════════════════════════ */}
        <div className={cn("flex", isRTL ? "flex-row-reverse items-start" : "flex-row items-start", "gap-1 pt-1")}>

          {/* Big number */}
          <div className="relative leading-none">
            <span
              className={cn(
                "text-[68px] rtl:pr-1 ltr:pl-1 font-black tabular-nums tracking-tighter leading-none block",
                isCurrentPlan
                  ? "text-white"
                  : "text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)]",
              )}
            >
              {plan.price}
            </span>
            {/* glow under number */}
            {!isCurrentPlan && (
              <div
                aria-hidden
                className="absolute -bottom-1 inset-x-0 h-4 blur-2xl opacity-25 rounded-full pointer-events-none"
                style={{ background: "linear-gradient(to right, var(--primary), var(--third, #ff5c2b))" }}
              />
            )}
          </div>

          {/* Currency + period — stacked top-right of number */}
          <div className={cn(
            "flex flex-col mt-2",
            isRTL ? "items-start" : "items-end"
          )}>
            <span className={cn(
              "text-xl font-black leading-none",
              isCurrentPlan ? "text-white/70" : "text-[var(--primary)]/60"
            )}>
              {t("card.currency")}
            </span>
            <span className={cn(
              "text-[11px] font-bold mt-1.5 px-2 py-0.5 rounded-full whitespace-nowrap",
              isCurrentPlan
                ? "bg-white/15 text-white/70"
                : "bg-[var(--primary)]/8 text-[var(--primary)] border border-[var(--primary)]/15"
            )}>
              / {plan.duration}
            </span>
          </div>
        </div>

        {/* Plan name */}
        <p className={cn(
          "text-[22px] font-black leading-tight text-nowrap ", 
          isCurrentPlan ? "text-white" : "text-foreground",
        )}>
          {plan.name}
        </p>

        {/* Divider */}
        <div className={cn(
          "h-px",
          isCurrentPlan
            ? "bg-white/15"
            : "bg-gradient-to-r from-[var(--primary)]/20 via-border/50 to-transparent",
        )} />

        {/* ── Features list ── */}
        <ul className="space-y-2.5 flex-1">
          {(plan.features || []).map((feature, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 + 0.1 }}
              className={cn(
                "flex items-center gap-2.5  flex-row-reverse" 
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-[25px] h-[25px] rounded-[5px] flex items-center justify-center",
                isCurrentPlan
                  ? "bg-white/20"
                  : "bg-gradient-to-br from-[var(--primary)] to-[var(--third,#ff5c2b)]",
              )}>
                <Check size={14} strokeWidth={3.5} className="text-white" />
              </div>
              <span className={cn(
                "text-sm font-medium leading-snug flex-1  rtl:text-right", 
                isCurrentPlan ? "text-white/90" : "text-foreground/80",
              )}>
                {feature}
              </span>
            </motion.li>
          ))}

          {/* Limits as rows */}
          {[
            { Icon: Users, label: `${usersLimit} ${t("card.users")}` },
            { Icon: Truck, label: `${shippingLimit} ${t("card.shippingCompanies")}` },
          ].map(({ Icon, label }, idx) => (
            <li
              key={`limit-${idx}`}
              className={cn("flex items-center gap-2.5 flex-row-reverse justify-between " )}
            >
              <div className={cn(
                "flex-shrink-0 w-[25px] h-[25px] rounded-[5px] flex items-center justify-center",
                isCurrentPlan ? "bg-white/15" : "bg-[var(--primary)]/12",
              )}>
                <Icon size={13} className={isCurrentPlan ? "text-white/80" : "text-[var(--primary)]"} />
              </div>
              <span className={cn(
                "text-sm  rtl:text-right font-medium flex-1",
                isRTL ? "text-right" : "text-left",
                isCurrentPlan ? "text-white/75" : "text-muted-foreground",
              )}>
                {label}
              </span>
            </li>
          ))}
        </ul>

        {/* ── CTA button ── */}
        <motion.button
          onClick={() => onSubscribe(plan)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className={cn(
            "relative w-full h-11 rounded-xl text-sm font-bold mt-1 overflow-hidden",
            "transition-all duration-200",
            isCurrentPlan
              ? "bg-white/80 text-primary border-2 border-white/25  "
              : [
                  "text-primary-foreground",
                  "bg-gradient-to-r from-[var(--primary)] to-[var(--third,#ff5c2b)]",
                  "shadow-[0_3px_14px_-4px_rgb(var(--primary-shadow))]",
                  "hover:shadow-[0_6px_22px_-4px_rgb(var(--primary-shadow))]",
                ],
          )}
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2
            bg-gradient-to-b from-white/20 to-transparent" />
          <span className="relative flex items-center justify-center gap-2">
            {isCurrentPlan
              ? <><X size={14} /> {t("card.cancelPlan")}</>
              : <><Zap size={14} /> {t("card.subscribe")}</>
            }
          </span>
        </motion.button>

      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
	 Main Page
═══════════════════════════════════════════════════════════ */
export default function SubscriptionsPage() {
	const t = useTranslations("subscriptions");
	const user = getUser();

	const [activeTab, setActiveTab] = useState("plans");
	const [isLoading, setIsLoading] = useState(false);
	const [plans, setPlans] = useState([]);
	const [currentPlan, setCurrentPlan] = useState(null);

	const tabs = useMemo(() => [
		{ id: "plans", label: t("tabs.plans") },
		{ id: "transactions", label: t("tabs.transactions") },
	], [t]);

	const durationLabel = (duration) => {
		if (duration === "monthly") return t("duration.monthly");
		if (duration === "yearly") return t("duration.yearly");
		return t("duration.lifetime");
	};

	const fetchAvailablePlans = async () => {
		setIsLoading(true);
		try {
			const { data } = await api.get("/plans/available");
			setPlans(
				(data || []).map((plan) => ({
					id: plan.id,
					name: plan.name,
					price: Number(plan.price),
					duration: durationLabel(plan.duration),
					description: plan.description || "",
					features: Array.isArray(plan.features) ? plan.features : [],
					color: plan.color || "from-blue-500 to-blue-600",
					isPopular: plan.isPopular,
					usersLimit: Number(plan.usersLimit ?? plan.maxUsers ?? 1),
					shippingCompaniesLimit: Number(plan.shippingCompaniesLimit ?? plan.maxShippingCompanies ?? 0),
				}))
			);
		} catch {
			toast.error(t("errors.fetchPlans"));
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (activeTab === "plans") {
			fetchAvailablePlans();
			setCurrentPlan(user?.plan?.id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	const handleSubscribe = async (plan) => {
		// TODO: implement subscription flow
	};

	return (
		<div className="min-h-screen p-5 ">
 
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
				{activeTab === "plans" ? (
					<motion.div
						key="plans"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -16 }}
						transition={{ duration: 0.28 }}
					>
					 

						<div className="  mt-[40px] mx-auto grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
							{isLoading && plans.length === 0
								? Array.from({ length: 3 }).map((_, i) => <PlanCardSkeleton key={i} />)
								: plans.map((plan, idx) => (
									<motion.div
										key={plan.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: idx * 0.08 }}
									>
										<PlanCard
											plan={plan}
											isCurrentPlan={currentPlan === plan.id}
											onSubscribe={handleSubscribe}
										/>
									</motion.div>
								))
							}
						</div>
					</motion.div>
				) : (
					<motion.div
						key="transactions"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -16 }}
						transition={{ duration: 0.28 }}
					>
						<TransactionTab />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}