"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
	Package,
	Phone,
	MapPin,
	PlayCircle,
	RefreshCw,
	Lock,
	Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/atoms/DataTable";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { generateBgColors, getIconForStatus } from "../page";
import InfoCard from "@/components/atoms/InfoCard";

/**
 * Calculates and formats the time remaining until a target date.
 * @param {Date|string} targetDate - The future date to count down to.
 * @returns {string} Formatted time "MM:SS" or "00:00" if expired.
 */
const getRemainingTime = (targetDate) => {
	const total = Date.parse(targetDate) - Date.parse(new Date());

	// Return zeros if the time has already passed
	if (total <= 0) return "00:00";

	const seconds = Math.floor((total / 1000) % 60);
	const minutes = Math.floor((total / 1000 / 60) % 60);

	// Pad with leading zeros (e.g., 5:9 becomes 05:09)
	const formattedMinutes = String(minutes).padStart(2, '0');
	const formattedSeconds = String(seconds).padStart(2, '0');

	return `${formattedMinutes}:${formattedSeconds}`;
};

const MovingTimer = ({ lockedUntil, onExpire }) => {
	const [displayTime, setDisplayTime] = useState("");

	useEffect(() => {
		const updateTimer = () => {
			const now = new Date();
			const target = new Date(lockedUntil);

			if (target <= now) {
				setDisplayTime(null);
				if (onExpire) onExpire();
				return;
			}

			// Re-use your existing getRemainingTime logic here
			setDisplayTime(getRemainingTime(target));
		};

		updateTimer(); // Initial call
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [lockedUntil, onExpire]);

	if (!displayTime) return null;

	return (
		<div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs">
			<Lock size={10} />
			<Timer size={10} />
			<span className="font-mono font-bold">{displayTime}</span>
		</div>
	);
};

export default function MyAssignedOrdersPage() {
	const t = useTranslations("orders");
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [statsLoading, setStatsLoading] = useState(true);
	const [orders, setOrders] = useState([]);
	const [stats, setStats] = useState([]);
	const [currentTime, setCurrentTime] = useState(Date.now());
	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 12,
		records: [],
	});
	// Update timer every second for lock countdowns
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(Date.now());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		fetchAssignedOrders();
		fetchStats();
	}, []);

	const fetchAssignedOrders = async (page, limit) => {
		try {
			setLoading(true);
			const response = await api.get("/orders/assigned", {
				params: { limit, page },
			});
			const data = response.data;
			setPager({
				total_records: data.total_records || 0,
				current_page: data.current_page || page,
				per_page: data.per_page || per_page,
				records: Array.isArray(data.records) ? data.records : [],
			});
		} catch (error) {
			console.error("Error fetching assigned orders:", error);
			toast.error(t("messages.errorFetchingOrders"));
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			setStatsLoading(true);
			const response = await api.get("/orders/confirmation-counts");
			setStats(response.data || []);
		} catch (error) {
			console.error("Error fetching stats:", error);
		} finally {
			setStatsLoading(false);
		}
	};

	const handlePageChange = ({ page, per_page }) => {
		// Request server for the requested page
		fetchAssignedOrders(page, per_page);
	};
	// Generate stats cards
	const statsCards = useMemo(() => {
		if (!stats.length) return [];

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

		return stats.map((stat) => {
			const Icon = getIconForStatus(stat.code);
			const bgColors = generateBgColors(stat.color);

			return {
				id: stat.id,
				title: stat.system ? t(`statuses.${stat.code}`) : stat.name,
				value: String(stat.count || 0),
				icon: Icon,
				bg: `bg-[${bgColors.light}] dark:bg-[${bgColors.dark}]`,
				bgInlineLight: bgColors.light,
				bgInlineDark: bgColors.dark,
				iconColor: `text-[${stat.color}]`,
				iconColorInline: stat.color,
				iconBorder: `border-[${stat.color}]`,
				iconBorderInline: stat.color,
				code: stat.code,
				system: stat.system,
				sortOrder: stat.sortOrder,
				fullData: stat,
			};
		});
	}, [stats, t]);

	const handleStartWork = () => {
		router.push("/orders/employee-orders/my-work");
	};

	const handleRefresh = () => {
		fetchAssignedOrders();
		fetchStats();
	};

	const formatDate = (date) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("ar-EG", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatCurrency = (amount) => {
		return `${amount?.toLocaleString() || 0} ${t("currency")}`;
	};

	const getRemainingTime = (lockedUntil) => {
		if (!lockedUntil) return null;
		const lockDate = new Date(lockedUntil);
		const diff = lockDate.getTime() - currentTime;

		if (diff <= 0) return null;

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		if (hours > 0) return `${hours}h ${minutes}m`;
		if (minutes > 0) return `${minutes}m ${seconds}s`;
		return `${seconds}s`;
	};


	// Table columns
	const columns = useMemo(() => {
		return [
			{
				key: "orderNumber",
				header: t("table.orderNumber"),
				cell: (row) => (
					<span className="text-primary font-bold font-mono">{row.orderNumber}</span>
				),
			},
			{
				key: "status",
				header: t("table.status"),
				cell: (row) => {
					if (!row.status) return null;
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
					const rgb = hexToRgb(row.status.color);
					const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : "#f5f5f5";

					return (
						<Badge
							className="rounded-lg px-3 py-1.5 font-semibold"
							style={{
								backgroundColor: bgColor,
								color: row.status.color,
								border: `1px solid ${row.status.color}`,
							}}
						>
							{row.status.system ? t(`statuses.${row.status.code}`) : row.status.name}
						</Badge>
					);
				},
			},
			{
				key: "customerName",
				header: t("table.customerName"),
				cell: (row) => (
					<span className="text-gray-700 dark:text-slate-200 font-semibold">
						{row.customerName}
					</span>
				),
			},
			{
				key: "phoneNumber",
				header: t("table.phoneNumber"),
				cell: (row) => (
					<div className="flex items-center gap-2 text-sm">
						<Phone size={14} />
						{row.phoneNumber}
					</div>
				),
			},
			{
				key: "city",
				header: t("table.city"),
				cell: (row) => (
					<div className="flex items-center gap-1 text-sm">
						<MapPin size={12} />
						{row.city}
					</div>
				),
			},
			{
				key: "finalTotal",
				header: t("myOrders.total"),
				cell: (row) => (
					<span className="font-bold text-green-600 dark:text-green-400">
						{formatCurrency(row.finalTotal)}
					</span>
				),
			},
			{
				key: "assignment",
				header: t("myOrders.retries"),
				cell: (row) => {
					const assignment = row.assignments?.[0];
					if (!assignment) return <span className="text-muted-foreground">—</span>;

					const lockedUntil = assignment.lockedUntil ? new Date(assignment.lockedUntil) : null;
					const isLocked = lockedUntil && lockedUntil > new Date(currentTime);
					const remainingTime = isLocked ? getRemainingTime(lockedUntil) : null;

					return (
						<div className="space-y-1">
							<div className="text-sm">
								<span className="text-muted-foreground">{t("myOrders.retries")}: </span>
								<span className="font-semibold">
									{assignment.retriesUsed}/{assignment.maxRetriesAtAssignment}
								</span>
							</div>
							{assignment.lockedUntil && (
								<MovingTimer
									lockedUntil={assignment.lockedUntil}
								/>
							)}
						</div>
					);
				},
			},
			{
				key: "created_at",
				header: t("table.createdat"),
				cell: (row) => (
					<span className="text-xs text-gray-500">
						{formatDate(row.created_at)}
					</span>
				),
			},
		];
	}, [t, currentTime]);

	return (
		<div className="min-h-screen p-6 bg-[#f3f6fa] dark:bg-[#19243950] transition-all duration-300">
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

			{/* Stats Cards */}
			<div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
				<h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
					{t("myOrders.statistics")}
				</h2>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
					{statsLoading ? (
						<>
							{Array.from({ length: 12 }).map((_, i) => (
								<div
									key={i}
									className="w-full rounded-lg p-5 border border-[#EEEEEE] dark:border-[#1F2937] animate-pulse"
								>
									<div className="flex items-start gap-3">
										{/* Icon circle skeleton */}
										<div className="w-[40px] h-[40px] rounded-full bg-gray-200 dark:bg-gray-700" />

										<div className="flex-1">
											{/* Title skeleton */}
											<div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />

											{/* Value skeleton */}
											<div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
										</div>
									</div>
								</div>
							))}
						</>
					) : statsCards.length === 0 ? (
						<div className="col-span-full text-center py-12">
							<Package size={48} className="mx-auto mb-4 text-gray-400" />
							<p className="text-gray-600 dark:text-gray-400">{t("myOrders.noAssignedOrders")}</p>
						</div>
					) : (
						statsCards.map((stat, index) => (
							<motion.div
								style={{ order: stat.sortOrder }}
								key={stat.id}
								initial={{ opacity: 0, y: 18 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.06 }}
							>
								<div
									style={{
										background: `linear-gradient(135deg, ${stat.bgInlineLight} 0%, ${stat.bgInlineLight} 100%)`,
									}}
									className="rounded-lg"
								>
									<InfoCard
										title={stat.title}
										value={stat.value}
										icon={stat.icon}
										bg=""
										iconColor=""
										iconBorder=""
										editable={!stat.system}
										onEdit={() => handleEditStatus(stat.fullData)}
										onDelete={() => handleDeleteStatus(stat)}
										customStyles={{
											iconColor: stat.iconColorInline,
											iconBorder: stat.iconColorInline,
										}}
									/>
								</div>
							</motion.div>
						))
					)}
				</div>
			</div>

			{/* Orders Table */}
			<div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
				<div className="p-6 border-b border-gray-200 dark:border-slate-800">
					<h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
						{t("myOrders.assignedOrders")}
					</h2>
				</div>

				<div className="mt-4">
					<DataTable
						columns={columns}
						data={pager.records}
						pagination={{
							total_records: pager.total_records,
							current_page: pager.current_page,
							per_page: pager.per_page,
						}}
						onPageChange={handlePageChange}
						emptyState={t("myOrders.noOrders")}
						isLoading={loading}
					/>
				</div>
			</div>
		</div>
	);
}