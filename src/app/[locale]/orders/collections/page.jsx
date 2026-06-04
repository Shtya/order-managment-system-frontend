"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
	Download,
	Loader2,
	DollarSign,
	CheckCircle2,
	Clock,
	Truck,
	Calendar,
	AlertCircle,
	Plus,
	HandCoins,
	Info,
	History,
	Eye,
	ExternalLink,
	Boxes,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";


// ── Components ────────────────────────────────────────────────────────────────
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ActionButtons from "@/components/atoms/Actions";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// ── Helpers ───────────────────────────────────────────────────────────────────



function formatDate(dateStr) {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function getCollectionStatusBadge(status, t) {
	const statusConfig = {
		pending: {
			label: t("collectionStatus.pending"),
			className: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200",
		},
		partial: {
			label: t("collectionStatus.partial"),
			className: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200",
		},
		fully_collected: {
			label: t("collectionStatus.fullyCollected"),
			className: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200",
		},
	};

	const config = statusConfig[status] || statusConfig.pending;

	return (
		<Badge className={cn("rounded-xl px-2.5 py-1 text-xs font-semibold border", config.className)}>
			{config.label}
		</Badge>
	);
}

function CollectionHistoryModal({ isOpen, onClose, order, formatCurrency, t }) {
	if (!order) return null;

	const collections = order.collections || [];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl! max-h-[85vh] overflow-hidden p-0 bg-white dark:bg-slate-950">
				<DialogHeader className="px-6 pt-6 pb-4 border-b">
					<DialogTitle className="flex items-center gap-2 text-xl font-bold">
						<History className="text-primary" size={20} />
						{t("modal.historyTitle", { orderNumber: order.orderNumber })}
					</DialogTitle>
				</DialogHeader>

				<div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
					<div className="rounded-xl border p-4 shadow-sm bg-muted/10">
						<div className="flex justify-between items-center">
							<div>
								<h4 className="text-lg font-bold">{t("modal.orderDetails")}</h4>
								<div className="mt-2 flex flex-wrap gap-2">
									<Badge variant="outline" className="text-[10px]">{t("columns.orderNumber")}: {order.orderNumber}</Badge>
									<Badge variant="outline" className="text-[10px]">{t("columns.finalTotal")}: {formatCurrency(order.finalTotal)}</Badge>
									<Badge variant="secondary" className="text-[10px]">{t("columns.collectedAmount")}: {formatCurrency(order.collectedAmount)}</Badge>
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs text-muted-foreground">{t("columns.remainingBalance")}</div>
								<div className="text-lg font-bold text-red-600">{formatCurrency(order.remainingBalance)}</div>
							</div>
						</div>
					</div>

					<div className="space-y-3">
						<h5 className="text-sm font-semibold flex items-center gap-2">
							<DollarSign size={16} className="text-primary" />
							{t("modal.collections")} ({collections.length})
						</h5>

						{collections.length === 0 ? (
							<div className="text-sm text-muted-foreground py-10 text-center border rounded-lg border-dashed">
								{t("modal.noCollections")}
							</div>
						) : (
							<div className="border rounded-xl overflow-hidden shadow-sm">
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="bg-muted/50 border-b">
											<tr>
												<th className="px-4 py-3 text-start font-bold">{t("modal.date")}</th>
												<th className="px-4 py-3 text-center font-bold">{t("modal.amount")}</th>
												<th className="px-4 py-3 text-center font-bold">{t("modal.method")}</th>
												<th className="px-4 py-3 text-center font-bold">{t("modal.shippingCompany")}</th>
												<th className="px-4 py-3 text-start font-bold">{t("modal.notes")}</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{collections.map((col) => (
												<tr key={col.id} className="hover:bg-muted/30 transition-colors">
													<td className="px-4 py-3 whitespace-nowrap">
														<div className="flex items-center gap-2">
															<Calendar size={14} className="text-muted-foreground" />
															{formatDate(col.collectedAt)}
														</div>
													</td>
													<td className="px-4 py-3 text-center font-bold text-emerald-600">
														{formatCurrency(col.amount)}
													</td>
													<td className="px-4 py-3 text-center">
														<Badge variant="outline" className="text-[10px]">
															{t(`collectionMethods.${col.source}`)}
														</Badge>
													</td>
													<td className="px-4 py-3 text-center">
														<div className="flex items-center justify-center gap-1.5">
															<Truck size={12} className="text-muted-foreground" />
															<span className="text-xs font-medium">{col.shippingCompany?.name || col.colShipping?.name || "—"}</span>
														</div>
													</td>
													<td className="px-4 py-3 text-start text-muted-foreground italic">
														{col.notes || "—"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ── Stats Configuration ───────────────────────────────────────────────────────

const COLLECTION_STATS_NOT_COLLECTED = [
	{
		id: 1,
		countCode: "notCollectedCount",
		amountCode: "totalNonCollectedMoney",
		nameKey: "stats.notCollected",
		color: "#ef4444",
		icon: AlertCircle,
		sortOrder: 1,
	},
	{
		id: 2,
		countCode: "partialCollectedCount",
		amountCode: "totalPartialCollectedMoney",
		nameKey: "stats.partialCollected",
		color: "#3b82f6",
		icon: Clock,
		sortOrder: 2,
	},
];

const COLLECTION_STATS_COLLECTED = [
	{
		id: 1,
		countCode: "totalCollectedOrders",
		amountCode: "totalCollectedMoney",
		nameKey: "stats.fullyCollected",
		color: "#10b981",
		icon: CheckCircle2,
		sortOrder: 1,
	},
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function OrderCollectionPage() {
	const t = useTranslations("orderCollection");
	// ── State ─────────────────────────────────────────────────────────────────
	const searchParams = useSearchParams();
	const router = useRouter();

	const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "not_collected");
	const [loading, setLoading] = useState(false);
	const [exportLoading, setExportLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	const [historyModal, setHistoryModal] = useState({ open: false, order: null });

	const { formatCurrency, shippingCompanies } = usePlatformSettings();

	const [statsData, setStatsData] = useState({
		notCollectedCount: 0,
		partialCollectedCount: 0,
		fullyCollectedCount: 0,
		totalCollectedOrders: 0,
		totalCollectedMoney: 0,
		totalNonCollectedMoney: 0,
		shippingBreakdown: [],
	});

	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 12,
		records: [],
	});

	const [filters, setFilters] = useState({
		startDate: null,
		endDate: null,
		shippingCompanyId: "all",
	});

	const searchTimer = useRef(null);

	// const handleTabChange = (tabId) => {
	//     const params = new URLSearchParams(searchParams.toString());
	//     params.set("tab", tabId);

	//     router.push(`?${params.toString()}`, { scroll: false });
	// };

	// ── Tabs Configuration ────────────────────────────────────────────────────
	const tabItems = useMemo(
		() => [
			{ id: "not_collected", label: t("tabs.notCollected"), icon: AlertCircle },
			{ id: "collected", label: t("tabs.collected"), icon: CheckCircle2 },
		],
		[t]
	);

	const allowedTabIds = useMemo(() => new Set(tabItems.map(item => item.id)), [tabItems]);

	useEffect(() => {
		const tabFromUrl = (searchParams.get("tab") || "").trim();

		const defaultTab = "not_collected";
		const safeTab = allowedTabIds.has(tabFromUrl) ? tabFromUrl : defaultTab;

		setActiveTab(safeTab);
	}, [searchParams, allowedTabIds]);




	// ── Debounce Search ───────────────────────────────────────────────────────
	useEffect(() => {
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
		return () => clearTimeout(searchTimer.current);
	}, [search]);

	// ── Fetch on Search/Tab Change ────────────────────────────────────────────
	useEffect(() => {
		fetchOrders(1, pager.per_page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch, activeTab]);

	// ── Initial Fetch ─────────────────────────────────────────────────────────
	useEffect(() => {
		fetchStats();
	}, []);

	// ── Build API Params ──────────────────────────────────────────────────────
	const buildParams = useCallback(
		(page = pager.current_page, per_page = pager.per_page) => {
			const params = { page, limit: per_page };
			if (debouncedSearch) params.search = debouncedSearch;
			if (filters.startDate) params.startDate = filters.startDate;
			if (filters.endDate) params.endDate = filters.endDate;
			if (filters.shippingCompanyId && filters.shippingCompanyId !== "all")
				params.shippingCompanyId = filters.shippingCompanyId;

			// Add collection status based on active tab
			if (activeTab === "not_collected") {
				params.collectionStatus = "pending";
			} else {
				params.collectionStatus = "fully_collected";
			}

			return params;
		},
		[debouncedSearch, filters, pager.current_page, pager.per_page, activeTab]
	);

	// ── Fetch Statistics ──────────────────────────────────────────────────────
	const fetchStats = useCallback(async () => {
		try {
			const res = await api.get("/collections/statistics");
			const data = res.data ?? {};
			setStatsData({
				notCollectedCount: data.notCollectedCount ?? 0,
				partialCollectedCount: data.partialCollectedCount ?? 0,
				fullyCollectedCount: data.fullyCollectedCount ?? 0,
				totalPartialCollectedMoney: data.totalPartialCollectedMoney ?? 0,
				totalCollectedOrders: data.totalCollectedOrders ?? 0,
				totalCollectedMoney: data.totalCollectedMoney ?? 0,
				totalNonCollectedMoney: data.totalNonCollectedMoney ?? 0,
				shippingBreakdown: data.shippingBreakdown ?? [],
			});
		} catch (e) {
			console.error(e);
			toast.error(t("errors.fetchStatsFailed"));
		}
	}, [t]);

	// ── Fetch Shipping Companies ──────────────────────────────────────────────

	// ── Fetch Orders ──────────────────────────────────────────────────────────
	const fetchOrders = useCallback(
		async (page = pager.current_page, per_page = pager.per_page) => {
			try {
				setLoading(true);
				const res = await api.get("/collections", { params: buildParams(page, per_page) });
				const data = res.data ?? {};
				setPager({
					total_records: data.total_records ?? 0,
					current_page: data.current_page ?? page,
					per_page: data.per_page ?? per_page,
					records: Array.isArray(data.records) ? data.records : [],
				});
			} catch (e) {
				console.error(e);
				toast.error(t("errors.fetchFailed"));
			} finally {
				setLoading(false);
			}
		},
		[buildParams, t]
	);

	// ── Export Handler ────────────────────────────────────────────────────────
	const handleExport = useCallback(async () => {
		let toastId;
		try {
			setExportLoading(true);
			toastId = toast.loading(t("messages.exportStarted"));
			const params = buildParams();
			delete params.page;
			delete params.limit;

			const response = await api.get("/collections/export", {
				params,
				responseType: "blob",
			});

			const contentDisposition = response.headers["content-disposition"];
			let filename = `Order_collections_export_${Date.now()}.xlsx`;
			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?([^";]+)"?/);
				if (match?.[1]) filename = match[1];
			}

			const url = window.URL.createObjectURL(
				new Blob([response.data], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				})
			);
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
			toast.success(t("messages.exportSuccess"), { id: toastId });
		} catch (e) {
			toast.error(e?.response?.data?.message || t("messages.exportFailed"), { id: toastId });
		} finally {
			setExportLoading(false);
		}
	}, [buildParams, t]);

	// ── Apply Filters ─────────────────────────────────────────────────────────
	const applyFilters = useCallback(() => {
		fetchOrders(1, pager.per_page);
		fetchStats();
	}, [fetchOrders, fetchStats, pager.per_page]);

	const hasActiveFilters = Object.values(filters).some((v) => v && v !== "all" && v !== null);

	// ── Current Stats for Active Tab ──────────────────────────────────────────
	const currentStats = useMemo(() => {
		const statsConfig =
			activeTab === "not_collected" ? COLLECTION_STATS_NOT_COLLECTED : COLLECTION_STATS_COLLECTED;

		return statsConfig.map((stat) => {
			const count = statsData[stat.countCode] ?? 0;

			const amount = stat.amountCode ? statsData[stat.amountCode] : null;
			let displayValue = String(count);
			if (amount !== null) {
				displayValue = `${count} (${formatCurrency(amount)})`;
			}


			return {
				id: stat.id,
				name: t(stat.nameKey),
				value: displayValue,
				icon: stat.icon,
				color: stat.color,
				sortOrder: stat.sortOrder,
			};
		});
	}, [activeTab, statsData, t, formatCurrency]);

	// ── Shipping Breakdown Stats ──────────────────────────────────────────────
	const shippingBreakdownStats = useMemo(() => {
		const isNotCollected = activeTab === "not_collected";

		return statsData.shippingBreakdown.map((shipping, idx) => {
			const count = isNotCollected ? shipping.nonCollectedOrdersCount : shipping.collectedOrdersCount;
			const amount = isNotCollected ? shipping.totalNonCollectedMoney : shipping.totalCollectedMoney;

			return {
				id: `shipping_${idx}`,
				name: shipping.name,
				value: `${count} (${formatCurrency(amount)})`,
				icon: Truck,
				color: "#06b6d4",
				sortOrder: 100 + idx,
			};
		});
	}, [statsData.shippingBreakdown, activeTab, formatCurrency]);

	// ── Combined Stats ────────────────────────────────────────────────────────
	const allStats = useMemo(() => {
		return [...currentStats, ...shippingBreakdownStats];
	}, [currentStats, shippingBreakdownStats]);

	// ── Table Columns: Not Collected ──────────────────────────────────────────
	const notCollectedColumns = useMemo(
		() => [
			{
				key: "orderNumber",
				header: t("columns.orderNumber"),
				cell: (row) => (
					<span className="text-primary font-bold font-mono text-sm">{row.orderNumber}</span>
				),
			},
			{
				key: "shippingCompany",
				header: t("columns.shippingCompany"),
				cell: (row) => (
					<div className="flex items-center gap-1.5">
						<span className="text-sm font-medium">{row.shippingCompany?.name ?? "—"}</span>
						<Truck size={12} className="text-muted-foreground" />
					</div>
				),
			},

			{
				key: "shippingCost",
				header: t("columns.shippingCost"),
				cell: (row) => (
					<span className="font-medium tabular-nums">{formatCurrency(row.shippingCost)}</span>
				),
			},
			{
				key: "finalTotal",
				header: t("columns.totalAmount"),
				cell: (row) => (
					<span className="font-bold text-foreground tabular-nums">{formatCurrency(row.finalTotal)}</span>
				),
			},
			{
				key: "collectibleAmount",
				header: t("columns.collectibleAmount"),
				cell: (row) => (
					<span className="font-bold text-foreground tabular-nums">{formatCurrency(row.collectibleAmount)}</span>
				),
			},
			{
				key: "collectedAmount",
				header: t("columns.collectedAmount"),
				cell: (row) => (
					<span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
						{formatCurrency(row.collectedAmount)}
					</span>
				),
			},
			{
				key: "remainingBalance",
				header: t("columns.remainingBalance"),
				cell: (row) => (
					<span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
						{formatCurrency(row.remainingBalance)}
					</span>
				),
			},

			{
				key: "collectionMethod",
				header: t("columns.collectionMethod"),
				cell: (row) => {
					const collections = row.collections || [];

					if (!collections.length) {
						return (
							<Badge variant="outline" className="text-xs">
								—
							</Badge>
						);
					}

					// Get unique sources only
					const uniqueSources = [
						...new Set(collections.map((c) => c.source))
					];

					return (
						<div className="flex flex-wrap gap-1">
							{uniqueSources.map((source) => (
								<Badge
									key={source}
									variant="outline"
									className="text-xs"
								>
									{t(`collectionMethods.${source}`)}
								</Badge>
							))}
						</div>
					);
				},
			},
			{
				key: "deliveredAt",
				header: t("columns.deliveredAt"),
				cell: (row) => (
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Calendar size={12} />
						{formatDate(row.deliveredAt)}
					</div>
				),
			},
			{
				key: "collectionStatus",
				header: t("columns.collectionStatus"),
				cell: (row) => {
					const status = row.remainingBalance > 0 ? row.collectedAmount > 0 ? "partial" : "pending" : "fully_collected";
					return getCollectionStatusBadge(status, t);
				},
			},
			{
				key: "actions",
				header: t("table.actions"),
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <HandCoins />,
								tooltip: t("actions.collect"),
								onClick: (r) => router.push(`/orders/collections/collect/${r.orderId}`),
								variant: "primary",
								permission: "orders-collect.create",
							},
							{
								icon: <History />,
								tooltip: t("actions.viewHistory"),
								disabled: row.collections?.length === 0,
								onClick: (r) => setHistoryModal({ open: true, order: r }),
								variant: "secondary",
							},
							{
								icon: <Eye />,
								tooltip: t("actions.viewDetails"),
								onClick: (r) => router.push(`/orders/details/${r.orderId}`),
								variant: "ghost",
							},
						]}
					/>
				),
			},
		],
		[t, formatCurrency, router]
	);

	// ── Table Columns: Collected ──────────────────────────────────────────────
	const collectedColumns = useMemo(
		() => [
			{
				key: "orderNumber",
				header: t("columns.orderNumber"),
				cell: (row) => (
					<span className="text-primary font-bold font-mono text-sm">{row.orderNumber}</span>
				),
			},
			{
				key: "shippingCompany",
				header: t("columns.shippingCompany"),
				cell: (row) => (
					<div className="flex items-center gap-1.5">
						<span className="text-sm font-medium">{row.shippingCompany?.name ?? "—"}</span>
						<Truck size={12} className="text-muted-foreground" />
					</div>
				),
			},
			{
				key: "lastCollectionDate",
				header: t("columns.lastCollectionDate"),
				cell: (row) => {
					const lastCollection = row.collections?.[row.collections.length - 1];
					return (
						<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
							<Calendar size={12} />
							{formatDate(lastCollection?.collectedAt)}
						</div>
					);
				},
			},
			{
				key: "shippingCost",
				header: t("columns.shippingCost"),
				cell: (row) => (
					<span className="font-medium tabular-nums">{formatCurrency(row.shippingCost)}</span>
				),
			},
			{
				key: "finalTotal",
				header: t("columns.totalAmount"),
				cell: (row) => (
					<span className="font-bold text-foreground tabular-nums">{formatCurrency(row.finalTotal)}</span>
				),
			},
			{
				key: "collectedAmount",
				header: t("columns.collectedAmount"),
				cell: (row) => (
					<span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
						{formatCurrency(row.collections?.reduce((acc, col) => acc + Number(col.amount), 0))}
					</span>
				),
			},
			{
				key: "remainingBalance",
				header: t("columns.remainingBalance"),
				cell: (row) => (
					<span className="font-medium text-muted-foreground tabular-nums">
						{formatCurrency(row.remainingBalance)}
					</span>
				),
			},
			{
				key: "collectionStatus",
				header: t("columns.collectionStatus"),
				cell: (row) => getCollectionStatusBadge("fully_collected", t),
			},
			{
				key: "actions",
				header: t("table.actions"),
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <History />,
								tooltip: t("actions.viewHistory"),
								onClick: (r) => setHistoryModal({ open: true, order: r }),
								variant: "secondary",
							},
							{
								icon: <Eye />,
								tooltip: t("actions.viewDetails"),
								onClick: (r) => router.push(`/orders/details/${r.orderId}`),
								variant: "ghost",
							},
						]}
					/>
				),
			},
		],
		[t, formatCurrency, router]
	);

	// ── Current Columns ───────────────────────────────────────────────────────
	const currentColumns = activeTab === "not_collected" ? notCollectedColumns : collectedColumns;

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className="min-h-screen p-5 ">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/dashboard" },
					{ name: activeTab === "not_collected" ? t('breadcrumb.notCollected') : t("breadcrumb.fullyCollected") },
				]}
				buttons={

					<Button_ size="sm" label={t("actions.howToUse")} variant="ghost" icon={<Info size={18} />} />

				}
				stats={allStats}
			>
			</PageHeader>


			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={applyFilters}

				labels={{
					searchPlaceholder: t("searchPlaceholder"),
					filter: t("toolbar.filter"),
					apply: t("filters.apply"),
					total: t("pagination.total"),
					limit: t("pagination.limit"),
					emptyTitle: t("empty.title"),
					emptySubtitle: t("empty.subtitle"),
				}}

				actions={[
					{
						key: "export",
						label: t("toolbar.export"),
						icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />,
						color: "primary",
						onClick: handleExport,
						disabled: exportLoading,
						permission: "orders-collect.read",
					},
				]}

				// ── Filters ───────────────────────────────────────────────────
				hasActiveFilters={hasActiveFilters}
				onApplyFilters={applyFilters}
				filters={
					<>
						{/* Shipping Company */}
						<FilterField label={t("filters.shippingCompany")}>
							<Select
								value={filters.shippingCompanyId || undefined}
								onValueChange={(v) => setFilters((f) => ({ ...f, shippingCompanyId: v }))}
							>
								<SelectTrigger
									className="h-10 rounded-xl border-border bg-background text-sm
                  focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all"
								>
									<SelectValue placeholder={t("filters.shippingCompanyPlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									{shippingCompanies.map((company) => (
										<SelectItem key={company.providerId} value={String(company.providerId)}>
											{company.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						{/* Date range */}
						<FilterField label={t("filters.date")}>
							<DateRangePicker
								value={{
									startDate: filters.startDate,
									endDate: filters.endDate,
								}}
								onChange={(newDates) =>
									setFilters((prev) => ({
										...prev,
										...newDates,
									}))
								}
								placeholder={t("filters.datePlaceholder")}
								dataSize="default"
								maxDate="today"
							/>
						</FilterField>
					</>
				}

				// ── Table ─────────────────────────────────────────────────────
				columns={currentColumns}
				data={pager.records}
				isLoading={loading}

				// ── Pagination ────────────────────────────────────────────────
				pagination={{
					total_records: pager.total_records,
					current_page: pager.current_page,
					per_page: pager.per_page,
				}}
				onPageChange={({ page, per_page }) => fetchOrders(page, per_page)}
			/>

			<CollectionHistoryModal
				isOpen={historyModal.open}
				onClose={() => setHistoryModal({ open: false, order: null })}
				order={historyModal.order}
				formatCurrency={formatCurrency}
				t={t}
			/>
		</div>
	);
}