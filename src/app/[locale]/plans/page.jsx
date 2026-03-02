"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Check,
	CreditCard,
	Calendar,
	Package,
	ArrowRight,
	RefreshCw,
	Sparkles,
	Crown,
	Zap,
	Users,
	Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";

import api from "@/utils/api";
import toast from "react-hot-toast";
import { getUser } from "@/hook/getUser";
import TransactionTab from "../dashboard/plans/tabs/transactionTab";

/** =========================
 * Skeletons
 * ========================= */
function PlanCardSkeleton() {
	return (
		<div className="relative rounded-xl p-8 border-2 border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white via-gray-50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 animate-pulse overflow-hidden">
			<div className="absolute inset-0">
				<div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
				<div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
			</div>

			<div className="relative">
				<div className="flex justify-center mb-6">
					<div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-slate-700" />
				</div>

				<div className="text-center mb-8 space-y-3">
					<div className="h-10 w-40 mx-auto rounded-xl bg-gray-200 dark:bg-slate-700" />
					<div className="h-6 w-52 mx-auto rounded-xl bg-gray-200 dark:bg-slate-700" />
					<div className="h-4 w-28 mx-auto rounded-xl bg-gray-200 dark:bg-slate-700" />
				</div>

				<div className="space-y-4 mb-8">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-start gap-4">
							<div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700" />
							<div className="h-4 flex-1 rounded bg-gray-200 dark:bg-slate-700" />
						</div>
					))}
				</div>

				<div className="h-14 w-full rounded-xl bg-gray-200 dark:bg-slate-700" />
			</div>
		</div>
	);
}

/** =========================
 * Plan Card
 * ========================= */
function PlanCard({ plan, isPopular, onSubscribe, currentPlan }) {
	const [isHovered, setIsHovered] = useState(false);
	const isCurrentPlan = currentPlan === plan.id;

	// display labels
	const usersLimitLabel = Number.isFinite(Number(plan.usersLimit)) ? Number(plan.usersLimit) : 1;
	const shippingLimitLabel = Number.isFinite(Number(plan.shippingCompaniesLimit))
		? Number(plan.shippingCompaniesLimit)
		: 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ y: -10 }}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			className={cn(
				"relative rounded-xl p-8 border-2 transition-all duration-500 ",
				"bg-gradient-to-br backdrop-blur-sm",
				!isCurrentPlan &&
				(isPopular
					? "border-primary/30 from-white via-primary/5 to-white dark:from-slate-900 dark:via-primary/10 dark:to-slate-900"
					: "border-gray-200 dark:border-slate-700 from-white via-gray-50/50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900"),
				isCurrentPlan &&
				"border-transparent shadow-2xl shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 text-white ring-2 ring-primary/60"
			)}
		>
			{/* Soft gradient blobs */}
			{!isCurrentPlan && (
				<>
					<motion.div
						aria-hidden
						className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl"
						animate={{ scale: isHovered ? 1.15 : 1, opacity: isHovered ? 0.35 : 0.22 }}
						transition={{ duration: 0.5 }}
					/>
					<motion.div
						aria-hidden
						className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl"
						animate={{ scale: isHovered ? 1.15 : 1, opacity: isHovered ? 0.35 : 0.22 }}
						transition={{ duration: 0.5 }}
					/>
				</>
			)}

			{/* Popular Badge */}
			{!isCurrentPlan && isPopular && (
				<motion.div
					className="absolute -top-5 left-1/2 -translate-x-1/2 z-10"
					initial={{ y: -10, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.15 }}
				>
					<Badge className="bg-gradient-to-r from-primary via-primary/90 to-primary text-white px-6 py-2 rounded-full shadow-xl backdrop-blur-sm border border-white/20">
						<Crown size={16} className="ml-1" />
						الأكثر شعبية
						<Sparkles size={16} className="mr-1" />
					</Badge>
				</motion.div>
			)}

			{/* Icon */}
			<div className="flex justify-center mb-6 relative z-10">
				<motion.div
					animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 6 : 0 }}
					transition={{ duration: 0.3 }}
					className="relative"
				>
					<div
						className={cn(
							"w-20 h-20 rounded-xl flex items-center justify-center relative z-10",
							"bg-gradient-to-br shadow-xl transition-shadow duration-300",
							plan.color,
							isHovered && "shadow-2xl"
						)}
					>
						{plan.icon}
					</div>

					<motion.div
						aria-hidden
						className={cn("absolute inset-0 rounded-xl blur-xl opacity-50", "bg-gradient-to-br", plan.color)}
						animate={{ scale: isHovered ? 1.35 : 1, opacity: isHovered ? 0.75 : 0.5 }}
					/>
				</motion.div>
			</div>

			{/* Price + Name */}
			<div className="text-center mb-6 relative z-10">
				<motion.div
					className="flex items-baseline justify-center gap-2 mb-2"
					animate={{ scale: isHovered ? 1.05 : 1 }}
				>
					<span
						className={cn(
							"text-6xl font-black bg-clip-text text-transparent",
							isCurrentPlan
								? "bg-gradient-to-br from-white via-white to-white"
								: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white"
						)}
					>
						{plan.price}
					</span>
					<span className={cn("text-3xl font-bold", isCurrentPlan ? "text-white/90" : "text-black/80 dark:text-slate-400")}>
						ج.م
					</span>
				</motion.div>

				<motion.p
					className={cn("text-xl font-bold mt-3", isCurrentPlan ? "text-white" : "text-gray-800 dark:text-slate-200")}
					animate={{ opacity: isHovered ? 1 : 0.92 }}
				>
					{plan.name}
				</motion.p>

				<div className="flex items-center justify-center gap-2 mt-2">
					<div className={cn("h-px w-10", isCurrentPlan ? "bg-white/30" : "bg-gradient-to-r from-transparent to-gray-300 dark:to-slate-600")} />
					<p className={cn("text-sm font-medium", isCurrentPlan ? "text-white/85" : "text-black/80 dark:text-slate-400")}>
						{plan.duration}
					</p>
					<div className={cn("h-px w-10", isCurrentPlan ? "bg-white/30" : "bg-gradient-to-l from-transparent to-gray-300 dark:to-slate-600")} />
				</div>

				{/* NEW: Limits chips */}
				<div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
					<div
						className={cn(
							"inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold",
							isCurrentPlan
								? "border-white/25 bg-white/10 text-white"
								: "border-primary/20 bg-primary/5 text-gray-800 dark:text-slate-200 dark:border-primary/25 dark:bg-primary/10"
						)}
					>
						<Users size={16} className={cn(isCurrentPlan ? "text-white" : "text-primary")} />
						{usersLimitLabel} مستخدم
					</div>

					<div
						className={cn(
							"inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold",
							isCurrentPlan
								? "border-white/25 bg-white/10 text-white"
								: "border-primary/20 bg-primary/5 text-gray-800 dark:text-slate-200 dark:border-primary/25 dark:bg-primary/10"
						)}
					>
						<Truck size={16} className={cn(isCurrentPlan ? "text-white" : "text-primary")} />
						{shippingLimitLabel} شركة شحن
					</div>
				</div>
			</div>

			{/* Features */}
			<div className="space-y-4 mb-8 relative z-10">
				{(plan.features || []).map((feature, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, x: -26, scale: 0.96 }}
						animate={{ opacity: 1, x: 0, scale: 1 }}
						transition={{
							delay: index * 0.1 + 0.2,
							type: "spring",
							stiffness: 120,
							damping: 18,
						}}
						whileHover={{ x: 8 }}
						className="flex items-start gap-4 group relative"
					>
						<motion.div
							aria-hidden
							className={cn(
								"absolute -left-2 top-1 w-10 h-10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
								isCurrentPlan ? "bg-white/20" : "bg-primary/25"
							)}
						/>

						<motion.div
							whileHover={{ rotate: 8, scale: 1.12 }}
							transition={{ type: "spring", stiffness: 300 }}
							className={cn(
								"relative flex-shrink-0 w-7 h-7 mt-0.5 rounded-full flex items-center justify-center shadow-lg",
								isCurrentPlan ? "bg-white/15" : "bg-primary"
							)}
						>
							<span className={cn("absolute inset-0 rounded-full animate-ping", isCurrentPlan ? "bg-white/15" : "bg-white/20")} />
							<Check size={14} strokeWidth={3} className="relative text-white drop-shadow" />
						</motion.div>

						<span
							className={cn(
								"text-sm leading-relaxed font-medium transition-colors duration-300",
								isCurrentPlan ? "text-white/90 group-hover:text-white" : "text-black/80 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white"
							)}
						>
							{feature}
						</span>
					</motion.div>
				))}
			</div>

			{/* Subscribe Button */}
			<Button
				onClick={() => onSubscribe(plan)}
				disabled={isCurrentPlan}
				className={cn(
					"w-full h-14 rounded-xl font-bold text-base transition-all duration-300 relative z-10",
					isCurrentPlan
						? "bg-white/15 text-white/80 cursor-not-allowed border border-white/20"
						: "bg-primary text-white hover:shadow-2xl hover:shadow-primary/35 hover:scale-[1.03]"
				)}
			>
				{isCurrentPlan ? (
					<span className="inline-flex items-center gap-2">
						<Check size={20} />
						الباقة الحالية
					</span>
				) : (
					<span className="inline-flex items-center gap-2">
						<Zap size={20} />
						اشترك الآن
						<motion.span animate={{ x: isHovered ? 6 : 0 }} transition={{ duration: 0.3 }}>
							<ArrowRight size={20} />
						</motion.span>
					</span>
				)}
			</Button>
		</motion.div>
	);
}

/** =========================
 * Main Page Component
 * ========================= */
export default function SubscriptionsPage() {
	const t = useTranslations("subscriptions");
	const user = getUser();

	// State
	const [activeTab, setActiveTab] = useState("plans"); // plans | transactions
	const [isLoading, setIsLoading] = useState(false);
	const [plans, setPlans] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [currentPlan, setCurrentPlan] = useState(null);


	// ✅ Fetch Available Plans
	const fetchAvailablePlans = async () => {
		setIsLoading(true);
		try {
			const { data } = await api.get("/plans/available");

			const transformedPlans = (data || []).map((plan) => ({
				id: plan.id,
				name: plan.name,
				price: Number(plan.price),
				duration:
					plan.duration === "monthly"
						? "شهرياً"
						: plan.duration === "yearly"
							? "سنوياً"
							: "مدى الحياة",
				description: plan.description || "",
				features: Array.isArray(plan.features) ? plan.features : [],
				color: plan.color || "from-blue-500 to-blue-600",
				icon: getIconForPlan(plan),
				isPopular: plan?.isPopular,

				// ✅ NEW: limits from backend
				usersLimit: Number(plan.usersLimit ?? plan.maxUsers ?? 1),
				shippingCompaniesLimit: Number(plan.shippingCompaniesLimit ?? plan.maxShippingCompanies ?? 0),
			}));

			setPlans(transformedPlans);
		} catch (error) {
			toast.error("فشل في تحميل الباقات");
		} finally {
			setIsLoading(false);
		}
	};

	// Helper function to get icon based on plan color
	const getIconForPlan = (plan) => {
		const color = plan.color || "";
		if (color.includes("purple")) return <Crown size={32} className="text-white" />;
		if (color.includes("orange")) return <Zap size={32} className="text-white" />;
		if (color.includes("green") || color.includes("cyan")) return <Sparkles size={32} className="text-white" />;
		return <Package size={32} className="text-white" />;
	};

	useEffect(() => {
		if (activeTab === "plans") {
			fetchAvailablePlans();
			console.log(user)
			setCurrentPlan(user?.plan?.id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	// Tabs configuration
	const tabs = useMemo(
		() => [
			{ id: "plans", label: "الباقات" },
			{ id: "transactions", label: "المعاملات السابقة" },
		],
		[]
	);

	// Stats
	// const stats = useMemo(() => {
	// 	const totalSpent = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
	// 	const activeSubscription = transactions.filter((t) => t.status === "نشط").length;

	// 	return [
	// 		{
	// 			title: "إجمالي المعاملات",
	// 			value: transactions.length.toString(),
	// 			icon: CreditCard,
	// 			bg: "bg-primary/5 dark:bg-primary/10",
	// 			iconColor: "text-primary",
	// 			iconBorder: "border-primary/30",
	// 		},
	// 		{
	// 			title: "إجمالي المدفوعات",
	// 			value: `${totalSpent.toFixed(2)} ج.م`,
	// 			icon: Package,
	// 			bg: "bg-primary/5 dark:bg-primary/10",
	// 			iconColor: "text-primary",
	// 			iconBorder: "border-primary/30",
	// 		},
	// 		{
	// 			title: "الاشتراك النشط",
	// 			value: activeSubscription.toString(),
	// 			icon: Calendar,
	// 			bg: "bg-primary/5 dark:bg-primary/10",
	// 			iconColor: "text-primary",
	// 			iconBorder: "border-primary/30",
	// 		},
	// 	];
	// }, [transactions]);

	// ✅ Handle subscription (create transaction)
	const handleSubscribe = async (plan) => {
		// try {
		// 	const loadingToast = toast.loading(`جاري الاشتراك في باقة ${plan.name}...`);

		// 	const { data } = await api.post("/transactions", {
		// 		planId: plan.id,
		// 		paymentMethod: "pending",
		// 	});

		// 	toast.dismiss(loadingToast);
		// 	toast.success("تم إنشاء الاشتراك بنجاح! في انتظار تأكيد الدفع.");

		// 	setCurrentPlan(plan.id);

		// } catch (error) {
		// 	const message = error?.response?.data?.message || "فشل في إنشاء الاشتراك";
		// 	toast.error(message);
		// }
	};



	return (
		<div className="min-h-screen p-6">
			{/* Header */}
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">الرئيسية</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">الاشتراكات</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
					</div>

					<div className="flex items-center gap-4">
						<Button_
							size="sm"
							label="تحديث"
							tone="white"
							variant="solid"
							icon={<RefreshCw size={18} className="text-[#A7A7A7]" />}
							onClick={() => (activeTab === "plans" ? fetchAvailablePlans() : null)}
						/>
					</div>
				</div>

				{/* Stats - Only show in transactions tab */}
				{/* {activeTab === "transactions" && (
					<div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
						{stats.map((stat, index) => (
							<motion.div
								key={stat.title}
								initial={{ opacity: 0, y: 18 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.06 }}
							>
								<InfoCard
									title={stat.title}
									value={stat.value}
									icon={stat.icon}
									bg={stat.bg}
									iconColor={stat.iconColor}
									iconBorder={stat.iconBorder}
								/>
							</motion.div>
						))}
					</div>
				)} */}

				{/* Tabs */}
				<div className="mt-4">
					<SwitcherTabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
				</div>
			</div>

			{/* Content */}
			<AnimatePresence mode="wait">
				{activeTab === "plans" ? (
					<motion.div
						key="plans"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3 }}
						className="max-w-[1500px] w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20"
					>
						{/* ✅ Skeleton */}
						{isLoading && plans.length === 0 ? (
							<>
								{Array.from({ length: 3 }).map((_, i) => (
									<PlanCardSkeleton key={i} />
								))}
							</>
						) : (
							plans.map((plan, index) => (
								<motion.div
									key={plan.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.08 }}
								>
									<PlanCard
										plan={plan}
										isPopular={plan.isPopular}
										onSubscribe={handleSubscribe}
										currentPlan={currentPlan}
									/>
								</motion.div>
							))
						)}
					</motion.div>
				) : (
					<TransactionTab />
				)}
			</AnimatePresence>
		</div>
	);
}
