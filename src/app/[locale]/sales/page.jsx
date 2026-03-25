"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Filter,
	RefreshCw,
	Eye,
	FileDown,
	Receipt,
	DollarSign,
	Clock,
	Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import api from "@/utils/api";
import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { ActionButtons } from "@/components/atoms/Actions";

function SalesTableToolbar({
	t,
	searchValue,
	onSearchChange,
	onExport,
	onRefresh,
	onToggleFilters,
	isFiltersOpen,
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="relative w-[300px] focus-within:w-[350px] transition-all duration-300">
				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={t("toolbar.searchPlaceholder")}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					className={cn(
						"bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 px-4 rounded-full",
						isFiltersOpen && "border-[rgb(var(--primary))]/50"
					)}
					onClick={onToggleFilters}
				>
					<Filter size={18} />
					{t("toolbar.filter")}
				</Button>

				<Button
					variant="outline"
					className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 px-4 rounded-full"
					onClick={onRefresh}
				>
					<RefreshCw size={18} />
					{t("toolbar.refresh")}
				</Button>

				<Button
					variant="outline"
					className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 px-4 rounded-full"
					onClick={onExport}
				>
					<FileDown size={18} />
					{t("toolbar.export")}
				</Button>
			</div>
		</div>
	);
}

function FiltersPanel({ t, value, onChange, onApply }) {
	return (
		<motion.div
			initial={{ height: 0, opacity: 0, y: -6 }}
			animate={{ height: "auto", opacity: 1, y: 0 }}
			exit={{ height: 0, opacity: 0, y: -6 }}
			transition={{ duration: 0.25 }}
		>
			<div className="bg-card !p-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
					<div className="space-y-2">
						<Label>{t("filters.paymentStatus")}</Label>
						<Select
							value={value.paymentStatus}
							onValueChange={(v) => onChange({ ...value, paymentStatus: v })}
						>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.paymentStatusPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								<SelectItem value="paid">{t("filters.paid")}</SelectItem>
								<SelectItem value="unpaid">{t("filters.unpaid")}</SelectItem>
								<SelectItem value="partially_paid">{t("filters.partiallyPaid")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.paymentMethod")}</Label>
						<Select
							value={value.paymentMethod}
							onValueChange={(v) => onChange({ ...value, paymentMethod: v })}
						>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.paymentMethodPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								<SelectItem value="cash">{t("filters.cash")}</SelectItem>
								<SelectItem value="card">{t("filters.card")}</SelectItem>
								<SelectItem value="transfer">{t("filters.transfer")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.customerName")}</Label>
						<Input
							value={value.customerName}
							onChange={(e) => onChange({ ...value, customerName: e.target.value })}
							placeholder={t("filters.customerNamePlaceholder")}
							className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
						/>
					</div>

					<div className="flex md:justify-end">
						<Button_
							onClick={onApply}
							size="sm"
							label={t("filters.apply")}
							tone="primary"
							variant="solid"
							icon={<Filter size={18} />}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

function FilterField({ label, children }) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			{children}
		</div>
	);
}

export default function SalesInvoicesPage() {
	const t = useTranslations("salesInvoices");
	const { formatCurrency } = usePlatformSettings();

	const [search, setSearch] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState({
		paymentStatus: "all",
		paymentMethod: "all",
		customerName: "",
	});
	const [loading, setLoading] = useState(false);

	const [stats, setStats] = useState({
		invoicesCount: 0,
		totalSales: 0,
		totalPaid: 0,
		totalRemaining: 0,
	});

	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 10,
		records: [],
	});

	const statsCards = useMemo(
		() => [
			{
				name: t("stats.totalInvoices"),
				value: String(stats.invoicesCount ?? 0),
				icon: Receipt,
				color: "#6B7CFF",
				sortOrder: 0,
			},
			{
				name: t("stats.totalSales"),
				value: formatCurrency(stats.totalSales ?? 0),
				icon: DollarSign,
				color: "#22C55E",
				sortOrder: 1,
			},
			{
				name: t("stats.totalPaid"),
				value: formatCurrency(stats.totalPaid ?? 0),
				icon: DollarSign,
				color: "#F59E0B",
				sortOrder: 2,
			},
			{
				name: t("stats.totalRemaining"),
				value: formatCurrency(stats.totalRemaining ?? 0),
				icon: Clock,
				color: "#EF4444",
				sortOrder: 3,
			},
		],
		[t, stats]
	);

	// Fetch stats
	const fetchStats = async () => {
		try {
			const res = await api.get("/sales-invoices/stats");
			setStats(res.data);
		} catch (error) {
			console.error("Failed to fetch stats:", error);
			toast.error("Failed to load statistics");
		}
	};

	// Fetch sales invoices
	const fetchInvoices = async (page = 1, perPage = 10) => {
		setLoading(true);
		try {
			const params = {
				page,
				limit: perPage,
				search,
			};

			if (filters.paymentStatus && filters.paymentStatus !== "all") {
				params.paymentStatus = filters.paymentStatus;
			}
			if (filters.paymentMethod && filters.paymentMethod !== "all") {
				params.paymentMethod = filters.paymentMethod;
			}
			if (filters.customerName) {
				params.search = filters.customerName;
			}

			const res = await api.get("/sales-invoices", { params });

			setPager({
				total_records: res.data.total_records || 0,
				current_page: res.data.current_page || 1,
				per_page: res.data.per_page || 10,
				records: res.data.records || [],
			});
		} catch (error) {
			console.error("Failed to fetch invoices:", error);
			toast.error("Failed to load invoices");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStats();
	}, []);

	useEffect(() => {
		fetchInvoices(1, pager.per_page);
	}, [search]);

	const handlePageChange = ({ page, per_page }) => {
		fetchInvoices(page, per_page);
	};

	const applyFilters = () => {
		fetchInvoices(1, pager.per_page);
	};

	const handleRefresh = () => {
		fetchInvoices(pager.current_page, pager.per_page);
		fetchStats();
	};

	const getPaymentStatusBadge = (status) => {
		const styles = {
			paid: "bg-[#F0FDF4] text-[#22C55E] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-400",
			unpaid: "bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEF2F2] dark:bg-red-950/30 dark:text-red-400",
			partially_paid: "bg-[#FFF9F0] text-[#F59E0B] hover:bg-[#FFF9F0] dark:bg-orange-950/30 dark:text-orange-400",
		};
		return styles[status] || styles.unpaid;
	};

	const hasActiveFilters = useMemo(() => {
		return (
			(filters.paymentStatus && filters.paymentStatus !== "all") ||
			(filters.paymentMethod && filters.paymentMethod !== "all") ||
			Boolean(filters.customerName?.trim())
		);
	}, [filters]);

	const columns = useMemo(() => {
		return [
			{
				key: "invoiceNumber",
				header: t("table.invoiceNumber"),
				className: "text-gray-700 dark:text-slate-200 font-semibold",
			},
			{
				key: "customerName",
				header: t("table.customerName"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "phone",
				header: t("table.phone"),
				cell: (row) => (
					<span dir="ltr" className="text-gray-600 dark:text-slate-200">
						{row.phone || "-"}
					</span>
				),
			},
			{
				key: "total",
				header: t("table.total"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200 font-semibold">
						{formatCurrency(row.total || 0)}
					</span>
				),
			},
			{
				key: "paidAmount",
				header: t("table.paidAmount"),
				cell: (row) => (
					<span className="text-green-600 dark:text-green-400 font-semibold">
						{formatCurrency(row.paidAmount || 0)}
					</span>
				),
			},
			{
				key: "remainingAmount",
				header: t("table.remainingAmount"),
				cell: (row) => (
					<span className="text-red-600 dark:text-red-400 font-semibold">
						{formatCurrency(row.remainingAmount || 0)}
					</span>
				),
			},
			{
				key: "paymentMethod",
				header: t("table.paymentMethod"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">{row.paymentMethod || "-"}</span>
				),
			},
			{
				key: "paymentStatus",
				header: t("table.paymentStatus"),
				cell: (row) => (
					<Badge className={cn("rounded-xl", getPaymentStatusBadge(row.paymentStatus))}>
						{t(`statuses.${row.paymentStatus}`)}
					</Badge>
				),
			},
			{
				key: "created_at",
				header: t("table.date"),
				cell: (row) => (
					<span className="text-gray-500 dark:text-slate-300">
						{new Date(row.created_at).toLocaleDateString()}
					</span>
				),
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[80px]",
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <Eye />,
								tooltip: t("actions.view"),
								onClick: (r) => console.log("view", r.id),
								variant: "purple",
								permission: "sales_invoice.read",
							},
						]}
					/>
				),
			},
		];
	}, [t, formatCurrency]);

	return (
		<div className="min-h-screen p-5">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.salesInvoices") }
				]}
				buttons={
					<>
						<Button_
							href="/sales/new"
							size="sm"
							label={t("actions.createInvoice")}
							tone="primary"
							variant="solid"
							permission="sales_invoice.create"
						/>

						<Button_ size="sm" label={t("actions.howToUse")} tone="white" variant="ghost" icon={<Info size={18} />} />
					</>
				}

				stats={statsCards}
			/>

			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={() => { }}
				labels={{
					searchPlaceholder: t("toolbar.searchPlaceholder"),
					filter: t("toolbar.filter"),
					apply: t("filters.apply"),
					total: t("common.total"),
					limit: t("common.limit"),
					emptyTitle: t("empty"),
					emptySubtitle: "",
				}}
				actions={[

					{
						key: "export",
						label: t("toolbar.export"),
						icon: <FileDown size={14} />,
						color: "blue",
						onClick: () => console.log("export"),
						permission: "sales_invoice.read",
					},
				]}
				hasActiveFilters={hasActiveFilters}
				onApplyFilters={applyFilters}
				filters={
					<>
						<FilterField label={t("filters.paymentStatus")}>
							<Select
								value={filters.paymentStatus}
								onValueChange={(v) => setFilters((f) => ({ ...f, paymentStatus: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.paymentStatusPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="paid">{t("filters.paid")}</SelectItem>
									<SelectItem value="unpaid">{t("filters.unpaid")}</SelectItem>
									<SelectItem value="partially_paid">{t("filters.partiallyPaid")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("filters.paymentMethod")}>
							<Select
								value={filters.paymentMethod}
								onValueChange={(v) => setFilters((f) => ({ ...f, paymentMethod: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.paymentMethodPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="cash">{t("filters.cash")}</SelectItem>
									<SelectItem value="card">{t("filters.card")}</SelectItem>
									<SelectItem value="transfer">{t("filters.transfer")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("filters.customerName")}>
							<Input
								value={filters.customerName}
								onChange={(e) => setFilters((f) => ({ ...f, customerName: e.target.value }))}
								placeholder={t("filters.customerNamePlaceholder")}
								className="h-10 rounded-xl text-sm"
							/>
						</FilterField>
					</>
				}
				columns={columns}
				data={pager.records}
				isLoading={loading}
				pagination={{
					total_records: pager.total_records,
					current_page: pager.current_page,
					per_page: pager.per_page,
				}}
				onPageChange={({ page, per_page }) => fetchInvoices(page, per_page)}
			/>
		</div>
	);
}