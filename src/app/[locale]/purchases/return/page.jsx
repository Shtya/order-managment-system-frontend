"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Filter,
	RefreshCw,
	Eye,
	RotateCcw,
	TrendingDown,
	FileDown,
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

function ReturnsTableToolbar({
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

function FiltersPanel({ t, value, onChange, onApply, suppliers }) {
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
						<Label>{t("filters.status")}</Label>
						<Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.statusPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.statusAll")}</SelectItem>
								<SelectItem value="pending">{t("filters.statusPending")}</SelectItem>
								<SelectItem value="approved">{t("filters.statusApproved")}</SelectItem>
								<SelectItem value="rejected">{t("filters.statusRejected")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.returnType")}</Label>
						<Select value={value.returnType} onValueChange={(v) => onChange({ ...value, returnType: v })}>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.returnTypePlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.returnTypeAll")}</SelectItem>
								<SelectItem value="cash_refund">{t("filters.returnTypeCash")}</SelectItem>
								<SelectItem value="bank_transfer">{t("filters.returnTypeBank")}</SelectItem>
								<SelectItem value="supplier_deduction">{t("filters.returnTypeDeduct")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.supplier")}</Label>
						<Select value={value.supplierId} onValueChange={(v) => onChange({ ...value, supplierId: v })}>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.supplierPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="none">{t("filters.all")}</SelectItem>
								{suppliers.map((s) => (
									<SelectItem key={s.id} value={String(s.id)}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex md:justify-end">
						<Button_
							onClick={onApply}
							size="sm"
							label={t("filters.apply")}
							tone="purple"
							variant="solid"
							icon={<Filter size={18} />}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

export default function PurchaseReturnsPage() {
	const t = useTranslations("returns");

	const [search, setSearch] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState({ status: "all", returnType: "all", supplierId: "none" });
	const [loading, setLoading] = useState(false);
	const [suppliers, setSuppliers] = useState([]);

	const [stats, setStats] = useState({
		returnInvoicesCount: 0,
		totalReturnValue: 0,
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
				title: t("stats.returnInvoicesCount"),
				value: String(stats.returnInvoicesCount),
				icon: RotateCcw,
				bg: "bg-[#F3F6FF] dark:bg-[#0B1220]",
				iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]",
				iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]",
			},
			{
				title: t("stats.totalReturnValue"),
				value: `${stats.totalReturnValue} ${t("currency")}`,
				icon: TrendingDown,
				bg: "bg-[#FFF9F0] dark:bg-[#1A1208]",
				iconColor: "text-[#F59E0B] dark:text-[#FBBF24]",
				iconBorder: "border-[#F59E0B] dark:border-[#FBBF24]",
			},
		],
		[t, stats]
	);

	// Fetch stats
	const fetchStats = async () => {
		try {
			const res = await api.get("/purchases-return/stats");
			setStats(res.data);
		} catch (error) {
			console.error("Failed to fetch stats:", error);
			toast.error("Failed to load statistics");
		}
	};

	// Fetch suppliers
	const fetchSuppliers = async () => {
		try {
			const res = await api.get("/lookups/suppliers", { params: { limit: 200 } });
			setSuppliers(res.data || []);
		} catch (error) {
			console.error("Failed to fetch suppliers:", error);
		}
	};

	// Fetch returns list
	const fetchReturns = async (page = 1, perPage = 10) => {
		setLoading(true);
		try {
			const params = {
				page,
				limit: perPage,
				search,
			};

			if (filters.status && filters.status !== "all") {
				params.status = filters.status;
			}
			if (filters.returnType && filters.returnType !== "all") {
				params.returnType = filters.returnType;
			}
			if (filters.supplierId && filters.supplierId !== "none") {
				params.supplierId = filters.supplierId;
			}

			const res = await api.get("/purchases-return", { params });

			setPager({
				total_records: res.data.total_records || 0,
				current_page: res.data.current_page || 1,
				per_page: res.data.per_page || 10,
				records: res.data.records || [],
			});
		} catch (error) {
			console.error("Failed to fetch returns:", error);
			toast.error("Failed to load returns");
		} finally {
			setLoading(false);
		}
	};

	// Initial load
	useEffect(() => {
		fetchStats();
		fetchSuppliers();
	}, []);

	// Load data when search changes
	useEffect(() => {
		fetchReturns(1, pager.per_page);
	}, [search]);

	const handlePageChange = ({ page, per_page }) => {
		fetchReturns(page, per_page);
	};

	const applyFilters = () => {
		fetchReturns(1, pager.per_page);
	};

	const handleRefresh = () => {
		fetchReturns(pager.current_page, pager.per_page);
		fetchStats();
	};

	const getStatusBadgeStyle = (status) => {
		const styles = {
			pending: "rounded-md bg-[#FFF9F0] text-[#F59E0B] hover:bg-[#FFF9F0] dark:bg-orange-950/30 dark:text-orange-400",
			approved: "rounded-md bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-400",
			rejected: "rounded-md bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEF2F2] dark:bg-red-950/30 dark:text-red-400",
		};
		return styles[status] || styles.pending;
	};

	const getReturnTypeLabel = (type) => {
		const types = {
			cash_refund: t("returnTypes.cashRefund"),
			bank_transfer: t("returnTypes.bankTransfer"),
			supplier_deduction: t("returnTypes.supplierDeduction"),
		};
		return types[type] || type;
	};

	const columns = useMemo(() => {
		return [
			{
				key: "returnNumber",
				header: t("table.returnNumber"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "invoiceNumber",
				header: t("table.invoiceNumber"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "created_at",
				header: t("table.returnDate"),
				cell: (row) => (
					<span className="text-gray-500 dark:text-slate-300">
						{new Date(row.created_at).toLocaleDateString()}
					</span>
				),
			},
			{
				key: "status",
				header: t("table.status"),
				cell: (row) => {
					const style = getStatusBadgeStyle(row.status);
					return <Badge className={style}>{t(`statuses.${row.status}`)}</Badge>;
				},
			},
			{
				key: "createdBy",
				header: t("table.createdBy"),
				cell: (row) => (
					<span className="text-gray-700 dark:text-slate-200 font-semibold">
						{row.createdBy?.name || "-"}
					</span>
				),
			},
			{
				key: "supplierNameSnapshot",
				header: t("table.supplierName"),
				className: "text-gray-700 dark:text-slate-200 font-semibold",
			},
			{
				key: "returnType",
				header: t("table.returnType"),
				cell: (row) => (
					<span className="text-gray-500 dark:text-slate-300">{getReturnTypeLabel(row.returnType)}</span>
				),
			},
			{
				key: "subtotal",
				header: t("table.subtotal"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{row.subtotal || 0} {t("currency")}
					</span>
				),
			},
			{
				key: "taxTotal",
				header: t("table.tax"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{row.taxTotal || 0} {t("currency")}
					</span>
				),
			},
			{
				key: "totalReturn",
				header: t("table.total"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{row.totalReturn || 0} {t("currency")}
					</span>
				),
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[80px]",
				cell: (row) => (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									className={cn(
										"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
										"border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white hover:shadow-xl hover:shadow-purple-500/40",
										"dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:border-purple-600 dark:hover:text-white dark:hover:shadow-purple-500/30"
									)}
									onClick={() => console.log("view", row.id)}
								>
									<Eye size={16} className="transition-transform group-hover:scale-110" />
								</motion.button>
							</TooltipTrigger>
							<TooltipContent>{t("actions.view")}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				),
			},
		];
	}, [t]);

	return (
		<div className="min-h-screen p-6">
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-[rgb(var(--primary))]">{t("breadcrumb.returns")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
					</div>

					<div className="flex items-center gap-4">
						<Button_
							href="/purchases/return/new"
							size="sm"
							label={t("actions.createReturn")}
							tone="purple"
							variant="solid"
						/>

						<Button_ size="sm" label={t("actions.howToUse")} tone="white" variant="solid" />
					</div>
				</div>

				<div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-6">
					{statsCards.map((stat, index) => (
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
			</div>

			<div className="bg-card rounded-sm">
				<ReturnsTableToolbar
					t={t}
					searchValue={search}
					onSearchChange={setSearch}
					onExport={() => console.log("export")}
					onRefresh={handleRefresh}
					isFiltersOpen={filtersOpen}
					onToggleFilters={() => setFiltersOpen((v) => !v)}
				/>

				<AnimatePresence>
					{filtersOpen && (
						<FiltersPanel
							t={t}
							value={filters}
							onChange={setFilters}
							onApply={applyFilters}
							suppliers={suppliers}
						/>
					)}
				</AnimatePresence>

				<div className="mt-4">
					<DataTable
						columns={columns}
						data={pager.records}
						pagination={{
							total_records: pager.total_records,
							current_page: pager.current_page,
							per_page: pager.per_page,
						}}
						onPageChange={({ page, per_page }) => handlePageChange({ page, per_page })}
						emptyState={t("empty")}
						loading={loading}
					/>
				</div>
			</div>
		</div>
	);
}