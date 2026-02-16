"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Package,
	Phone,
	MapPin,
	Truck,
	Calendar,
	User,
	PlayCircle,
	Clock,
	AlertCircle,
	CheckCircle,
	XCircle,
	TrendingUp,
	Copy,
	RefreshCw,
	Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { getIconForStatus } from "../page";

// Icon mapping for statuses

// Order Card Component - Read-only with lock timer
const OrderCard = ({ order }) => {
	const t = useTranslations("orders");
	const [currentTime, setCurrentTime] = useState(Date.now());

	// Update timer every second
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(Date.now());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const formatDate = (date) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("ar-EG", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatCurrency = (amount) => {
		return `${amount?.toLocaleString() || 0} ${t("currency")}`;
	};

	const getStatusBadge = (status) => {
		if (!status) return null;

		const hexToRgb = (hex) => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result
				? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
				}
				: null;
		};

		const rgb = hexToRgb(status.color);
		const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : "#f5f5f5";

		return (
			<Badge
				className="rounded-md font-medium text-xs px-2 py-0.5"
				style={{
					backgroundColor: bgColor,
					color: status.color,
					border: `1px solid ${status.color}`,
				}}
			>
				{status.system ? t(`statuses.${status.code}`) : status.name}
			</Badge>
		);
	};

	const assignment = order.assignments?.[0];
	const lockedUntil = assignment?.lockedUntil ? new Date(assignment.lockedUntil) : null;
	const isLocked = lockedUntil && lockedUntil > new Date(currentTime);

	// Calculate remaining lock time
	const getRemainingTime = () => {
		if (!isLocked || !lockedUntil) return null;

		const diff = lockedUntil.getTime() - currentTime;
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		} else {
			return `${seconds}s`;
		}
	};

	const remainingTime = getRemainingTime();

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"relative group",
				isLocked && "opacity-70"
			)}
		>
			<div
				className={cn(
					"bg-white dark:bg-slate-900 rounded-xl border-2 transition-all",
					isLocked
						? "border-orange-300 dark:border-orange-700"
						: "border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-primary dark:hover:border-primary",
					"overflow-hidden"
				)}
			>
				{/* Lock Banner */}
				{isLocked && remainingTime && (
					<div className="bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 flex items-center justify-between">
						<div className="flex items-center gap-2 text-white">
							<Clock size={14} />
							<span className="text-xs font-semibold">{t("myOrders.locked")}</span>
						</div>
						<div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-md">
							<AlertCircle size={12} className="text-white" />
							<span className="text-xs font-mono font-bold text-white">{remainingTime}</span>
						</div>
					</div>
				)}

				{/* Card Content */}
				<div className="p-4">
					{/* Header */}
					<div className="flex items-center justify-between mb-3">
						<span className="font-bold text-primary text-base">{order.orderNumber}</span>
						{getStatusBadge(order.status)}
					</div>

					{/* Customer Info */}
					<div className="space-y-2 mb-3">
						<div className="flex items-center gap-2 text-sm">
							<User size={14} className="text-gray-400 flex-shrink-0" />
							<span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
								{order.customerName}
							</span>
						</div>

						<div className="flex items-center gap-2 text-sm">
							<Phone size={14} className="text-gray-400 flex-shrink-0" />
							<span className="text-gray-600 dark:text-gray-400">{order.phoneNumber}</span>
						</div>

						<div className="flex items-center gap-2 text-sm">
							<MapPin size={14} className="text-gray-400 flex-shrink-0" />
							<span className="text-gray-600 dark:text-gray-400">{order.city}</span>
						</div>
					</div>

					{/* Order Summary */}
					<div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
						<div className="text-sm text-gray-500 dark:text-gray-400">
							{t("myOrders.total")}
						</div>
						<div className="font-bold text-green-600 dark:text-green-400 text-lg">
							{formatCurrency(order.finalTotal)}
						</div>
					</div>

					{/* Assignment Info */}
					{assignment && (
						<div className="pt-3 border-t border-gray-200 dark:border-slate-800 mt-3">
							<div className="flex items-center justify-between text-xs">
								<span className="text-gray-500 dark:text-gray-400">
									{t("myOrders.retries")}: {assignment.retriesUsed}/{assignment.maxRetriesAtAssignment}
								</span>
								<span className="text-gray-500 dark:text-gray-400">
									{formatDate(order.created_at)}
								</span>
							</div>
						</div>
					)}


					{isLocked && (
						<div className="absolute inset-0 bg-orange-500/5 pointer-events-none backdrop-blur-[0.5px]">
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="bg-orange-100 dark:bg-orange-900/50 px-3 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700">
									<div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
										<Lock size={14} />
										<span className="text-xs font-semibold">{t("retry.locked")}</span>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
};

// Main Page Component
export default function MyAssignedOrdersPage() {
	const t = useTranslations("orders");

	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [statsLoading, setStatsLoading] = useState(true);
	const [orders, setOrders] = useState([]);
	const [stats, setStats] = useState([]);

	useEffect(() => {
		fetchAssignedOrders();
	}, []);

	const fetchAssignedOrders = async () => {
		try {
			setLoading(true);
			setStatsLoading(true);

			// Fetch assigned orders
			const response = await api.get("/orders/assigned", {
				params: { limit: 100 },
			});

			setOrders(response.data.records || []);

			// Calculate stats from orders
			calculateStats(response.data.records || []);
		} catch (error) {
			console.error("Error fetching assigned orders:", error);
			toast.error(t("messages.errorFetchingOrders"));
		} finally {
			setLoading(false);
			setStatsLoading(false);
		}
	};

	const calculateStats = (orders) => {
		// Group orders by status
		const statusMap = {};

		orders.forEach((order) => {
			const statusId = order.status?.id;
			const statusCode = order.status?.code;

			if (!statusId) return;

			if (!statusMap[statusId]) {
				statusMap[statusId] = {
					id: statusId,
					name: order.status.name,
					code: statusCode,
					color: order.status.color || "#000000",
					system: order.status.system,
					sortOrder: order.status.sortOrder || 0,
					count: 0,
				};
			}

			statusMap[statusId].count++;
		});

		// Convert to array and sort
		const statsArray = Object.values(statusMap).sort((a, b) => a.sortOrder - b.sortOrder);

		setStats(statsArray);
	};

	// Generate stats cards dynamically
	const statsCards = useMemo(() => {
		if (!stats.length) return [];

		return stats.map((stat) => {
			const Icon = getIconForStatus(stat.code);

			// Generate background colors
			const hexToRgb = (hex) => {
				const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
				return result
					? {
						r: parseInt(result[1], 16),
						g: parseInt(result[2], 16),
						b: parseInt(result[3], 16),
					}
					: null;
			};

			const rgb = hexToRgb(stat.color);
			const bgLight = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : "#f5f5f5";
			const bgDark = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : "#1a1a1a";

			return {
				id: stat.id,
				title: stat.system ? t(`statuses.${stat.code}`) : stat.name,
				value: String(stat.count || 0),
				icon: Icon,
				bg: `bg-[${bgLight}] dark:bg-[${bgDark}]`,
				bgInlineLight: bgLight,
				bgInlineDark: bgDark,
				iconColor: `text-[${stat.color}]`,
				iconColorInline: stat.color,
				iconBorder: `border-[${stat.color}]`,
				iconBorderInline: stat.color,
				code: stat.code,
				statusData: stat,
			};
		});
	}, [stats, t]);

	// Group orders by status
	const ordersByStatus = useMemo(() => {
		const grouped = {};

		orders.forEach((order) => {
			const statusId = order.status?.id;
			if (!statusId) return;

			if (!grouped[statusId]) {
				grouped[statusId] = {
					status: order.status,
					orders: [],
				};
			}

			grouped[statusId].orders.push(order);
		});

		// Sort by status sortOrder
		return Object.values(grouped).sort(
			(a, b) => (a.status?.sortOrder || 0) - (b.status?.sortOrder || 0)
		);
	}, [orders]);

	const handleStartWork = () => {
		router.push("/orders/employee-orders/my-work");
	};

	const handleRefresh = () => {
		fetchAssignedOrders();
	};

	return (
		<div className="min-h-screen p-6 bg-[#f3f6fa] dark:bg-[#19243950] relative transition-all duration-300">
			{/* Header */}
			<div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
				<div className="flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
							<Package size={24} className="text-primary" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
								{t("myOrders.title")}
							</h1>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{t("myOrders.subtitle")}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							onClick={handleRefresh}
							disabled={loading}
							className="rounded-xl"
						>
							<RefreshCw size={16} className={cn("mr-2", loading && "animate-spin")} />
							{t("actions.refresh")}
						</Button>
						<Button
							onClick={handleStartWork}
							className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
						>
							<PlayCircle size={18} className="mr-2" />
							{t("myOrders.startWork")}
						</Button>
					</div>
				</div>
			</div>

			{/* Stats Cards - Read Only */}
			<div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
				<h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
					{t("myOrders.statistics")}
				</h2>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
					{statsLoading ? (
						<div className="col-span-full flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : statsCards.length === 0 ? (
						<div className="col-span-full text-center py-12">
							<Package size={48} className="mx-auto mb-4 text-gray-400" />
							<p className="text-gray-600 dark:text-gray-400">{t("myOrders.noAssignedOrders")}</p>
						</div>
					) : (
						statsCards.map((stat, index) => {
							const isActive = false; // All cards are non-interactive
							const Icon = stat.icon;

							return (
								<motion.div
									key={stat.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<div
										className={cn(
											"p-4 rounded-xl transition-all text-left",
											"bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-gray-700"
										)}
									>
										<div className="flex items-center justify-between mb-2">
											<div
												className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br"
												style={{
													background: `linear-gradient(135deg, ${stat.iconColorInline}15 0%, ${stat.iconColorInline}25 100%)`,
												}}
											>
												<Icon size={20} style={{ color: stat.iconColorInline }} />
											</div>
											<Badge
												className="text-xs font-semibold"
												style={{
													backgroundColor: stat.bgInlineLight,
													color: stat.iconColorInline,
													border: `1px solid ${stat.iconColorInline}`,
												}}
											>
												{stat.value}
											</Badge>
										</div>
										<h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
											{stat.title}
										</h3>
									</div>
								</motion.div>
							);
						})
					)}
				</div>
			</div>

			{/* Orders by Status */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
						<p className="text-gray-600 dark:text-gray-400">{t("messages.loading")}</p>
					</div>
				</div>
			) : ordersByStatus.length === 0 ? (
				<div className="text-center py-12">
					<Package size={64} className="mx-auto mb-4 text-gray-400" />
					<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
						{t("myOrders.noOrders")}
					</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						{t("myOrders.noOrdersDescription")}
					</p>
					<Button onClick={handleRefresh} variant="outline" className="rounded-xl">
						<RefreshCw size={16} className="mr-2" />
						{t("actions.refresh")}
					</Button>
				</div>
			) : (
				<div className="space-y-8">
					{ordersByStatus.map((group) => {
						const statusName = group.status.system
							? t(`statuses.${group.status.code}`)
							: group.status.name;

						const Icon = getIconForStatus(group.status.code);

						// Generate gradient colors
						const hexToRgb = (hex) => {
							const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
							return result
								? {
									r: parseInt(result[1], 16),
									g: parseInt(result[2], 16),
									b: parseInt(result[3], 16),
								}
								: null;
						};

						const rgb = hexToRgb(group.status.color);

						// Create gradient string
						const gradientColors = rgb
							? `from-[${group.status.color}] to-[${group.status.color}]/80`
							: "from-gray-500 to-gray-600";

						return (
							<div key={group.status.id} className="space-y-4">
								{/* Status Header Bar with Gradient - Max Width */}
								<div className="max-w-[400px]">
									<div
										className={cn(
											"rounded-xl p-3 shadow-md bg-gradient-to-br"
										)}
										style={{
											background: `linear-gradient(135deg, ${group.status.color} 0%, ${group.status.color}dd 100%)`,
										}}
									>
										<div className="flex items-center justify-between text-white">
											<div className="flex items-center gap-2">
												<Icon size={18} />
												<h3 className="font-bold text-sm">{statusName}</h3>
											</div>
											<Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
												{group.orders.length}
											</Badge>
										</div>
									</div>
								</div>

								{/* Orders Grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
									{group.orders.map((order) => (
										<OrderCard key={order.id} order={order} t={t} />
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}