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
	Download,
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
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import Table from "@/components/atoms/Table";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";


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
		fetchAssignedOrders(page, per_page);
	};

	const statsCards = useMemo(() => {
		if (!stats.length) return [];

		return stats.map((stat, i) => {
			const Icon = getIconForStatus(stat.code);

			return {
				id: stat.id,
				name: stat.system ? t(`statuses.${stat.code}`) : stat.name,
				value: String(stat.count ?? 0),
				icon: Icon,
				color: stat.color || "#64748B",
				sortOrder: i,
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
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
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
	const [searchTerm, setSearchTerm] = useState("");
	const [hasActiveFilters, setHasActiveFilters] = useState(false);

	const handleSearch = () => {
		// Implement search logic
		fetchAssignedOrders(1, pager.per_page, searchTerm);
	};

	const handleExport = () => {
		// Implement export logic
		console.log("Exporting data...");
	};

	const { formatCurrency } = usePlatformSettings();
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
							className="rounded-xl px-3 py-1.5 font-semibold"
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
	}, [t, currentTime, formatCurrency]);

	return (
		<div className="min-h-screen p-5 bg-[#f3f6fa] dark:bg-[#19243950] transition-all duration-300">
			{/* Header */}
			<PageHeader
				breadcrumbs={[
					{ name: t('myOrders.title') }
				]}
				stats={statsCards}
				statsLoading={statsLoading}
				buttons={
					<>
						<Button_
							variant="outline"
							tone="primary"
							onClick={handleRefresh}
							disabled={loading}
							icon={<RefreshCw size={16} className={cn(loading && "animate-spin")} />}
							label={t("actions.refresh")}
						> </Button_>

						<Button_
							tone="primary"
							onClick={handleStartWork}
							icon={<PlayCircle size={16} className={cn(loading && "animate-spin")} />}
							label={t("myOrders.startWork")}
						> </Button_>

					</>
				}
			/>


			<Table
				columns={columns}
				data={pager.records}
				isLoading={loading}
				pagination={{
					total_records: pager.total_records,
					current_page: pager.current_page,
					per_page: pager.per_page,
				}}
				onPageChange={handlePageChange}
				emptyState={t("myOrders.noOrders")}
				labels={{
					searchPlaceholder: t("search.placeholder"),
					filter: t("actions.filter"),
					apply: t("actions.apply"),
					emptyTitle: t("myOrders.noOrders"),
					emptySubtitle: t("myOrders.tryAdjusting"),
					preview: t("actions.preview"),
				}}

				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
				onSearch={handleSearch}
				actions={[
					{
						key: 'export',
						label: t('actions.export'),
						icon: <Download size={14} />,
						onClick: handleExport,
						color: 'emerald'
					}
				]}
				compact={false}
				hoverable={true}
				striped={false}
			/>


		</div>
	);
}