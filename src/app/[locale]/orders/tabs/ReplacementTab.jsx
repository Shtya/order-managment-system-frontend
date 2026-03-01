"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

import {
	Download, Eye, Phone, ArrowLeftRight, Loader2, Filter,
	RefreshCcw,
	Clock,
	CheckCircle,
	Package,
	Truck,
	XCircle,
	RotateCcw,
	Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// ── Shared Table system ──────────────────────────────────────────────────────
import Table, { FilterField } from "@/components/atoms/Table";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";


function hexToBg(hex) {
	const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return r
		? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},0.12)`
		: "transparent";
}

function formatDate(dateStr) {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("ar-EG", {
		year: "numeric", month: "short", day: "numeric",
	});
}

function formatCurrency(amount) {
	if (amount === undefined || amount === null) return "—";
	return Number(amount).toLocaleString("ar-EG");
}


function StatusBadge({ status, t }) {
	if (!status) return <span className="text-muted-foreground text-xs">—</span>;
	return (
		<Badge
			className="rounded-xl px-2.5 py-1 text-xs font-semibold border"
			style={{
				backgroundColor: hexToBg(status.color),
				color: status.color,
				borderColor: `${status.color}44`,
			}}
		>
			{status.system ? t(`statuses.${status.code}`) : status.name}
		</Badge>
	);
}


function ReplacedProductsList({ items }) {
	if (!items?.length) return <span className="text-muted-foreground text-xs">—</span>;
	return (
		<div className="space-y-1">
			{items.map((item, i) => {
				const oldName = item.originalOrderItem?.variant?.product?.name ?? "—";
				const newName = item.newVariant?.product?.name ?? "—";
				return (
					<div key={i} className="flex items-center gap-1.5 text-xs">
						<span className="text-muted-foreground line-through">{oldName}</span>
						<ArrowLeftRight size={10} className="text-[var(--primary)] shrink-0" />
						<span className="text-foreground font-medium">{newName}</span>
						{item.quantityToReplace > 1 && (
							<span className="text-muted-foreground">(×{item.quantityToReplace})</span>
						)}
					</div>
				);
			})}
		</div>
	);
}


function CostDiffCell({ row, t }) {
	const diff =
		row.replacementOrder.finalTotal -
		(row.originalOrder.finalTotal - row.originalOrder.shippingCost);

	if (diff === 0)
		return (
			<span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
				{t("replacement.noDifference")}
			</span>
		);

	const isCustomerPaying = diff > 0;
	return (
		<div className="flex items-center gap-1.5">
			<span
				className={cn(
					"text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1",
					isCustomerPaying
						? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
						: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
				)}
			>
				{!isCustomerPaying && "−"}
				{isCustomerPaying && "+"}
				{formatCurrency(Math.abs(diff))}
			</span>
		</div>
	);
}


const REPLACEMENT_STATS = [
	{
		id: 1,
		code: "total",
		title: "replacement.stats.total",
		color: "#ff8b00",        // --primary light
		darkColor: "#5b4bff",    // --primary dark
		icon: RefreshCcw,
		value: 142
	},
	{
		id: 2,
		code: "pending",
		nameKey: "replacement.stats.pending",
		color: "#f59e0b",
		darkColor: "#f59e0b",
		icon: Clock,
		count: 38,
		sortOrder: 2,
	},
	{
		id: 3,
		code: "confirmed",
		nameKey: "replacement.stats.confirmed",
		color: "#3b82f6",
		darkColor: "#3b82f6",
		icon: CheckCircle,
		count: 54,
		sortOrder: 3,
	},
	{
		id: 6,
		code: "delivered",
		nameKey: "replacement.stats.delivered",
		color: "#10b981",
		darkColor: "#10b981",
		icon: CheckCircle,
		count: 67,
		sortOrder: 6,
	},
	{
		id: 7,
		code: "cancelled",
		nameKey: "replacement.stats.cancelled",
		color: "#ef4444",
		darkColor: "#ef4444",
		icon: XCircle,
		count: 11,
		sortOrder: 7,
	}
];



export function ReplacementTab({ statuses }) {
	const t = useTranslations("orders");
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [exportLoading, setExportLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [pager, setPager] = useState({
		total_records: 0, current_page: 1, per_page: 12, records: [],
	});
	const [filters, setFilters] = useState({
		status: "all",
		startDate: null,
		endDate: null,
		reason: "all",
	});

	const searchTimer = useRef(null);

	/* debounce search */
	useEffect(() => {
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
		return () => clearTimeout(searchTimer.current);
	}, [search]);

	useEffect(() => {
		fetchReplacements(1, pager.per_page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch]);

	/* build API params */
	const buildParams = useCallback(
		(page = pager.current_page, per_page = pager.per_page) => {
			const params = { page, limit: per_page };
			if (debouncedSearch) params.search = debouncedSearch;
			if (filters.status && filters.status !== "all") params.status = filters.status;
			if (filters.startDate) params.startDate = filters.startDate;
			if (filters.endDate) params.endDate = filters.endDate;
			if (filters.reason && filters.reason !== "all") params.reason = filters.reason;
			return params;
		},
		[debouncedSearch, filters, pager.current_page, pager.per_page],
	);

	/* fetch */
	const fetchReplacements = useCallback(
		async (page = pager.current_page, per_page = pager.per_page) => {
			try {
				setLoading(true);
				const res = await api.get("/order-replacements/list", { params: buildParams(page, per_page) });
				const data = res.data ?? {};
				setPager({
					total_records: data.total_records ?? 0,
					current_page: data.current_page ?? page,
					per_page: data.per_page ?? per_page,
					records: Array.isArray(data.records) ? data.records : [],
				});
			} catch (e) {
				console.error(e);
				toast.error(t("replacement.errors.fetchFailed"));
			} finally {
				setLoading(false);
			}
		},
		[buildParams, t],
	);

	/* export */
	const handleExport = useCallback(async () => {
		let toastId;
		try {
			setExportLoading(true);
			toastId = toast.loading(t("messages.exportStarted"));
			const params = buildParams();
			delete params.page;
			delete params.limit;

			const response = await api.get("/order-replacements/export", {
				params,
				responseType: "blob",
			});

			const contentDisposition = response.headers["content-disposition"];
			let filename = `Replacement_orders_export_${Date.now()}.xlsx`;
			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?([^";]+)"?/);
				if (match?.[1]) filename = match[1];
			}

			const url = window.URL.createObjectURL(
				new Blob([response.data], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				}),
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

	const applyFilters = useCallback(() => {
		fetchReplacements(1, pager.per_page);
	}, [fetchReplacements, pager.per_page]);

	const hasActiveFilters = Object.values(filters).some(v => v && v !== "all" && v !== null);

	/* ── Columns ── */
	const columns = useMemo(() => [
		{
			key: "replacementOrderNumber",
			header: t("replacement.columns.replacementOrderNumber"),
			cell: (row) => (
				<span className="text-[var(--primary)] font-bold font-mono text-sm">
					{row.replacementOrder?.orderNumber ?? "—"}
				</span>
			),
		},
		{
			key: "originalOrderNumber",
			header: t("replacement.columns.originalOrderNumber"),
			cell: (row) => (
				<span className="font-mono text-sm font-semibold text-foreground">
					{row.originalOrder?.orderNumber ?? "—"}
				</span>
			),
		},
		{
			key: "customerName",
			header: t("replacement.columns.customerName"),
			cell: (row) => (
				<span className="font-semibold text-foreground text-sm">
					{row.replacementOrder?.customerName ?? "—"}
				</span>
			),
		},
		{
			key: "phoneNumber",
			header: t("replacement.columns.phoneNumber"),
			cell: (row) => (
				<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<Phone size={12} />
					{row.replacementOrder?.phoneNumber ?? "—"}
				</div>
			),
		},
		{
			key: "replacedProducts",
			header: t("replacement.columns.replacedProducts"),
			cell: (row) => <ReplacedProductsList items={row.items} />,
		},
		{
			key: "status",
			header: t("replacement.columns.status"),
			cell: (row) => <StatusBadge status={row.replacementOrder?.status} t={t} />,
		},
		{
			key: "reason",
			header: t("replacement.columns.reason"),
			cell: (row) => (
				<div className="space-y-0.5 max-w-[160px]">
					<p className="text-sm font-medium text-foreground line-clamp-1">{row.reason ?? "—"}</p>
					{row.anotherReason && (
						<p className="text-xs text-muted-foreground line-clamp-1">{row.anotherReason}</p>
					)}
				</div>
			),
		},
		{
			key: "costDiff",
			header: t("replacement.columns.costDiff"),
			cell: (row) => <CostDiffCell row={row} t={t} />,
		},
		{
			key: "updated_at",
			header: t("table.lastUpdate"),
			cell: (row) => (
				<span className="text-xs text-muted-foreground">
					{formatDate(row.replacementOrder?.updated_at)}
				</span>
			),
		},
		{
			key: "createdAt",
			header: t("table.createdat"),
			cell: (row) => (
				<span className="text-xs text-muted-foreground">
					{formatDate(row.createdAt)}
				</span>
			),
		},
		{
			key: "actions",
			header: t("table.actions"),
			cell: (row) => (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<m.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => router.push(`/orders/details/${row.replacementOrderId}`)}
								className="group w-9 h-9 rounded-full border transition-all duration-200
                  flex items-center justify-center shadow-sm
                  border-purple-200 bg-purple-50 text-purple-600
                  hover:bg-purple-600 hover:border-purple-600 hover:text-white"
							>
								<Eye size={16} className="transition-transform group-hover:scale-110" />
							</m.button>
						</TooltipTrigger>
						<TooltipContent>{t("actions.view")}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			),
		},
	], [t, router]);

	/* ── Render ── */
	return (<>


		<PageHeader
			breadcrumbs={[
				{ name: t("breadcrumb.home"), href: "/" },
				{ name: t(`tabs.replacement`) },
			]}
			buttons={<Button_
				href="/orders/replacement/new"
				size="sm"
				label={t("actions.createReplacement")}
				variant="solid"
				icon={<Plus size={18} />}
			/>}
			statsCount={6}
			stats={REPLACEMENT_STATS.map((s) => ({
				id: s.id,
				name: t(s.nameKey ?? s.title),
				value: s.count ?? s.value ?? 0,
				icon: s.icon,
				color: s.color,
				sortOrder: s.sortOrder ?? s.id,
			}))}
		/>

		<Table
			// ── Search ────────────────────────────────────────────────────────
			searchValue={search}
			onSearchChange={setSearch}
			onSearch={applyFilters}

			// ── i18n ──────────────────────────────────────────────────────────
			labels={{
				searchPlaceholder: t("replacement.searchPlaceholder"),
				filter: t("toolbar.filter"),
				apply: t("filters.apply"),
				total: t("pagination.total"),
				limit: t("pagination.limit"),
				emptyTitle: t("replacement.empty.title"),
				emptySubtitle: t("replacement.empty.subtitle"),
				preview: t("image.preview"),
			}}

			// ── Toolbar actions ───────────────────────────────────────────────
			actions={[
				{
					key: "export",
					label: t("toolbar.export"),
					icon: exportLoading
						? <Loader2 size={14} className="animate-spin" />
						: <Download size={14} />,
					color: "blue",
					onClick: handleExport,
					disabled: exportLoading,
				},
			]}

			// ── Filters ───────────────────────────────────────────────────────
			hasActiveFilters={hasActiveFilters}
			onApplyFilters={applyFilters}
			filters={
				<>
					<FilterField label={t("filters.status")}>
						<Select
							value={filters.status}
							onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}
						>
							<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
								<SelectValue placeholder={t("filters.statusPlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								{Array.isArray(statuses) && statuses.map(s => (
									<SelectItem key={s.code || s.id} value={s.code || String(s.id)}>
										{s.system ? t(`statuses.${s.code}`) : (s.name || s.code)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FilterField>

					{/* Reason */}
					<FilterField label={t("replacement.filters.reason")}>
						<Select
							value={filters.reason}
							onValueChange={(v) => setFilters(f => ({ ...f, reason: v }))}
						>
							<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
								<SelectValue placeholder={t("replacement.filters.reasonPlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("replacement.filters.allReasons")}</SelectItem>
								<SelectItem value="wrong_size">{t("replacement.filters.wrongSize")}</SelectItem>
								<SelectItem value="damaged">{t("replacement.filters.damaged")}</SelectItem>
								<SelectItem value="wrong_item">{t("replacement.filters.wrongItem")}</SelectItem>
								<SelectItem value="other">{t("replacement.filters.other")}</SelectItem>
							</SelectContent>
						</Select>
					</FilterField>

					{/* Date range */}
					<FilterField label={t("filters.date")}>
						<Flatpickr
							value={[
								filters.startDate ? new Date(filters.startDate) : null,
								filters.endDate ? new Date(filters.endDate) : null,
							]}
							onChange={([start, end]) => setFilters(f => ({
								...f,
								startDate: start ? start.toISOString().split("T")[0] : null,
								endDate: end ? end.toISOString().split("T")[0] : null,
							}))}
							options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
							className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm
                text-foreground focus:outline-none
                focus:border-[var(--primary)] dark:focus:border-[#5b4bff]
                transition-all duration-200"
							placeholder={t("filters.datePlaceholder")}
						/>
					</FilterField>
				</>
			}

			// ── Table ─────────────────────────────────────────────────────────
			columns={columns}
			data={pager.records}
			isLoading={loading}

			// ── Pagination ────────────────────────────────────────────────────
			pagination={{
				total_records: pager.total_records,
				current_page: pager.current_page,
				per_page: pager.per_page,
			}}
			onPageChange={({ page, per_page }) => fetchReplacements(page, per_page)}
		/>
	</>
	);
}

export default ReplacementTab;