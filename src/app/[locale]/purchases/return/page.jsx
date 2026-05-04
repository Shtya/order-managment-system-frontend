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
	Info,
	Save,
	MoreVertical,
	FileText,
	CheckCircle,
	XCircle,
	Clock,
	Check,
	X,
	ScrollText,
	Package,
	DollarSign,
	Edit,
	Pause,
	TrendingUp,
	Loader2,
	ChevronDown,
	Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
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

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import api from "@/utils/api";
import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import AssetPreview from "@/components/atoms/AssetPreview";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { baseImg } from "@/utils/axios";
import { Bone } from "@/components/atoms/BannerSkeleton";
import { avatarSrc } from "@/components/atoms/UserSelect";
import DateRangePicker from "@/components/atoms/DateRangePicker";

const isImagePath = (p) => !!p && /\.(png|jpg|jpeg|webp|gif)$/i.test(p);
const isPdfPath = (p) => !!p && /\.pdf$/i.test(p);

// Loading Spinner Component
function LoadingSpinner({ size = "default", text }) {
	const sizeClasses = {
		small: "w-8 h-8",
		default: "w-12 h-12",
		large: "w-16 h-16",
	};

	return (
		<div className="flex flex-col items-center justify-center py-12">
			<div className="relative">
				<div className={cn(sizeClasses[size], "border-4 border-primary/20 rounded-full")}></div>
				<div className={cn(sizeClasses[size], "border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0")}></div>
			</div>
			{text && (
				<p className="text-sm text-gray-600 dark:text-slate-400 mt-3 animate-pulse font-medium">
					{text}
				</p>
			)}
		</div>
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

function TinyBadge({ children }) {
	return (
		<span className="font-[Inter] text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
			{children}
		</span>
	);
}

function JsonBlock({ value }) {
	return (
		<pre className="mt-2 text-[11px] leading-5 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-auto">
			{JSON.stringify(value, null, 2)}
		</pre>
	);
}


export default function PurchasesReturnPage() {
	const t = useTranslations("purchasesReturn");
	const { formatCurrency } = usePlatformSettings();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [search, setSearch] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState({
		status: "all",
		returnType: "all",
		supplierId: "all",
		startDate: null,
		endDate: null,
		hasReceipt: "all",
	});
	const [loading, setLoading] = useState(false);
	const [suppliers, setSuppliers] = useState([]);

	const [stats, setStats] = useState({
		returnInvoicesCount: 0,
		totalReturnValue: 0,
	});

	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 12,
		records: [],
	});

	const [selectedInvoice, setSelectedInvoice] = useState(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [logsOpen, setLogsOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [paidAmountOpen, setPaidAmountOpen] = useState(false);
	const [isDetailLoading, setIsDetailLoading] = useState(false);

	const handleStatusChange = async (id, status) => {
		const loadingToast = toast.loading(t("messages.updatingStatus"));
		try {
			await api.patch(`/purchases-return/${id}/status`, { status });
			toast.success(t("messages.statusUpdated"), { id: loadingToast });
			fetchReturns(pager.current_page, pager.per_page);
			fetchStats();
		} catch (error) {
			console.error("Failed to update status:", error);
			toast.error(error?.response?.data?.message || t("messages.statusUpdateFailed"), { id: loadingToast });
		}
	};

	useEffect(() => {
		const invoiceId = searchParams.get("detials");
		if (invoiceId && !detailsOpen) {
			fetchInvoiceDetails(invoiceId, true);
		}
	}, [searchParams]);

	const updateUrlWithId = (id) => {
		const params = new URLSearchParams(searchParams.toString());
		if (id) {
			params.set("detials", id);
		} else {
			params.delete("detials");
		}
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	};

	const fetchInvoiceDetails = async (id, cleanupUrl = false) => {
		setIsDetailLoading(true);
		setDetailsOpen(true);
		if (!cleanupUrl) updateUrlWithId(id);
		try {
			const res = await api.get(`/purchases-return/${id}`);
			setSelectedInvoice(res.data);

			if (cleanupUrl) {
				updateUrlWithId(null);
			}
		} catch (error) {
			console.error("Failed to fetch details:", error);
			toast.error(t("messages.detailsFailed"));
			setDetailsOpen(false);
			updateUrlWithId(null);
		} finally {
			setIsDetailLoading(false);
		}
	};

	const statsCards = useMemo(
		() => [
			{
				name: t("stats.acceptedInvoices"),
				value: String(stats.accepted ?? 0),
				icon: CheckCircle,
				color: "#22C55E",
				sortOrder: 0,
			},
			{
				name: t("stats.pendingInvoices"),
				value: String(stats.pending ?? 0),
				icon: Clock,
				color: "#F59E0B",
				sortOrder: 1,
			},
			{
				name: t("stats.rejectedInvoices"),
				value: String(stats.rejected ?? 0),
				icon: XCircle,
				color: "#EF4444",
				sortOrder: 2,
			},
			// {
			// 	name: t("stats.totalReturnValue"),
			// 	value: formatCurrency(stats.totalReturnValue ?? 0),
			// 	icon: TrendingDown,
			// 	color: "#6B7CFF",
			// 	sortOrder: 3,
			// },
		],
		[t, stats, formatCurrency]
	);

	// Fetch stats
	const fetchStats = async () => {
		try {
			const res = await api.get("/purchases-return/stats");
			setStats(res.data);
		} catch (error) {
			console.error("Failed to fetch stats:", error);
			toast.error(t("messages.statsError"));
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
			if (filters.supplierId && filters.supplierId !== "all") {
				params.supplierId = filters.supplierId;
			}
			if (filters.startDate) {
				params.startDate = filters.startDate;
			}
			if (filters.endDate) {
				params.endDate = filters.endDate;
			}
			if (filters.hasReceipt && filters.hasReceipt !== "all") {
				params.hasReceipt = filters.hasReceipt;
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
			toast.error(t("messages.returnsError"));
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
			pending: "rounded-xl bg-[#FFF9F0] text-[#F59E0B] hover:bg-[#FFF9F0] dark:bg-orange-950/30 dark:text-orange-400",
			accepted: "rounded-xl bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-400",
			rejected: "rounded-xl bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEF2F2] dark:bg-red-950/30 dark:text-red-400",
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
	const hasActiveFilters = useMemo(() => {
		return (
			(filters.status && filters.status !== "all") ||
			(filters.returnType && filters.returnType !== "all") ||
			(filters.supplierId && filters.supplierId !== "all") ||
			Boolean(filters.startDate) ||
			Boolean(filters.endDate) ||
			(filters.hasReceipt && filters.hasReceipt !== "all")
		);
	}, [filters]);

	const handleExport = async () => {
		try {
			const params = {
				search,
				...filters,
			};
			const res = await api.get("/purchases-return/export", {
				params,
				responseType: "blob",
			});
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `Purchase_Returns_${Date.now()}.xlsx`);
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (error) {
			console.error(error);
			toast.error(t("messages.exportError"));
		}
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
				cell: (row) => (
					<span className="text-gray-700 dark:text-slate-200 font-semibold">
						{row.supplierNameSnapshot || "-"}
					</span>
				),
			},
			// {
			// 	key: "returnType",
			// 	header: t("table.returnType"),
			// 	cell: (row) => (
			// 		<span className="text-gray-500 dark:text-slate-300">{getReturnTypeLabel(row.returnType)}</span>
			// 	),
			// },
			{
				key: "subtotal",
				header: t("table.subtotal"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{formatCurrency(row.subtotal || 0)}
					</span>
				),
			},
			{
				key: "taxTotal",
				header: t("table.tax"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{formatCurrency(row.taxTotal || 0)}
					</span>
				),
			},
			,
			{
				key: "totalReturn",
				header: t("table.totalReturn"),
				cell: (row) => (
					<span className="text-red-600 dark:text-red-400 font-bold">
						{formatCurrency(row.totalReturn || 0)}
					</span>
				),
			},
			{
				key: "safe",
				header: t("manualExpenses.columns.safe") || "Safe",
				cell: (row) => (
					<div className="flex items-center gap-2">
						<div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 text-blue-500">
							<Wallet size={14} />
						</div>
						<span className="text-xs font-bold">{row.safe?.name || t("common.none")}</span>
					</div>
				)
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
				cell: (row) => {
					const remaining = (row.totalReturn || 0) - (row.paidAmount || 0);
					return (
						<span className={cn(
							"font-bold",
							remaining > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-500"
						)}>
							{formatCurrency(remaining)}
						</span>
					);
				},
			},
			{
				key: "receiptAsset",
				header: t("table.receipt"),
				className: "w-[90px]",
				cell: (row) => (
					<div className="flex justify-center">
						<AssetPreview
							src={row.receiptAsset}
							alt={t("table.receipt")}
							labels={{ preview: t("table.receipt") }}
						/>
					</div>
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
				key: "actions",
				header: t("table.actions"),
				className: "w-[110px]",
				cell: (row) => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">
								<MoreVertical className="h-4 w-4 text-gray-600 dark:text-slate-300" />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="start" className="w-56">
							<DropdownMenuItem onClick={() => fetchInvoiceDetails(row.id)} className="flex items-center gap-2 cursor-pointer rounded-xl hover:bg-primary/5 transition-colors" permission="purchase_returns.read">
								<Eye size={16} className="text-blue-600" />
								<span>{t("actions.view")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem onClick={() => { setSelectedInvoice(row); setLogsOpen(true); }} className="flex items-center gap-2 cursor-pointer rounded-xl hover:bg-primary/5 transition-colors" permission="purchase_returns.read">
								<ScrollText size={16} className="text-purple-600" />
								<span>{t("actions.logs")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem disabled={row.closingId !== null} onClick={() => { setSelectedInvoice(row); setPaidAmountOpen(true); }} className="flex items-center gap-2 cursor-pointer rounded-xl hover:bg-primary/5 transition-colors" permission="purchase_returns.update">
								<Edit size={16} className="text-gray-600" />
								<span>{t("actions.editPaidAmount")}</span>
							</DropdownMenuItem>

							<DropdownMenuSeparator className="my-2 bg-border/50" />

							<div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400">
								{t("actions.changeStatus")}
							</div>

							<DropdownMenuItem
								onClick={() => { setSelectedInvoice(row); setPreviewOpen(true); }}
								className="flex items-center gap-2 cursor-pointer rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
								disabled={row.status === "accepted" || row.closingId !== null}
								permission="purchase_returns.update"
							>
								<Check size={16} className="text-green-600" />
								<span>{t("actions.accept")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={() => handleStatusChange(row.id, "pending")}
								className="flex items-center gap-2 cursor-pointer rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
								disabled={row.status === "pending" || row.closingId !== null}
								permission="purchase_returns.update"
							>
								<Pause size={16} className="text-yellow-600" />
								<span>{t("actions.suspend")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={() => handleStatusChange(row.id, "rejected")}
								className="flex items-center gap-2 cursor-pointer rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
								disabled={row.status === "rejected" || row.closingId !== null}
								permission="purchase_returns.update"
							>
								<X size={16} className="text-red-600" />
								<span>{t("actions.reject")}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		];
	}, [t, formatCurrency]);

	return (
		<div className="min-h-screen p-5">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/dashboard" },
					{ name: t("breadcrumb.returns") }
				]}
				buttons={
					<>
						<Button_
							href="/purchases/return/new"
							size="sm"
							label={t("actions.createReturn")}
							variant="solid"
							icon={<Save size={18} />}
							permission="purchase_returns.create"
						/>						<Button_ size="sm" label={t("actions.howToUse")} tone="ghost" icon={<Info size={18} />} />
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
						color: "primary",
						onClick: handleExport,
						permission: "purchase_returns.read",
					},
				]}
				hasActiveFilters={hasActiveFilters}
				onApplyFilters={applyFilters}
				filters={
					<>
						<FilterField label={t("filters.supplier")}>
							<Select
								value={filters.supplierId}
								onValueChange={(v) => setFilters((f) => ({ ...f, supplierId: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.supplierPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="none">{t("filters.noSupplier")}</SelectItem>
									{suppliers.map((s) => (
										<SelectItem key={s.id} value={String(s.id)}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("filters.status")}>
							<Select
								value={filters.status}
								onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.statusPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="all">{t("filters.statusAll")}</SelectItem>
									<SelectItem value="pending">{t("filters.statusPending")}</SelectItem>
									<SelectItem value="accepted">{t("filters.statusApproved")}</SelectItem>
									<SelectItem value="rejected">{t("filters.statusRejected")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("filters.dateRange")}>
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
								placeholder={t("filters.selectDateRange")}
								dataSize="default"
								maxDate="today"
							/>
						</FilterField>

						<FilterField label={t("filters.hasReceipt")}>
							<Select
								value={filters.hasReceipt}
								onValueChange={(v) => setFilters((f) => ({ ...f, hasReceipt: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.hasReceiptPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="yes">{t("filters.yes")}</SelectItem>
									<SelectItem value="no">{t("filters.no")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>

						{/* <FilterField label={t("filters.returnType")}>
							<Select
								value={filters.returnType}
								onValueChange={(v) => setFilters((f) => ({ ...f, returnType: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.returnTypePlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="all">{t("filters.returnTypeAll")}</SelectItem>
									<SelectItem value="cash_refund">{t("filters.returnTypeCash")}</SelectItem>
									<SelectItem value="bank_transfer">{t("filters.returnTypeBank")}</SelectItem>
									<SelectItem value="supplier_deduction">{t("filters.returnTypeDeduct")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField> */}


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
				onPageChange={({ page, per_page }) => fetchReturns(page, per_page)}
			/>

			{/* Modals */}
			<DetailsModal
				isOpen={detailsOpen}
				onClose={() => {
					setDetailsOpen(false);
					setSelectedInvoice(null);
					updateUrlWithId(null);
				}}
				invoice={selectedInvoice}
				isLoading={isDetailLoading}
				formatCurrency={formatCurrency}
			/>

			<LogsModal
				isOpen={logsOpen}
				onClose={() => setLogsOpen(false)}
				invoiceId={selectedInvoice?.id}
				t={t}
			/>

			<AcceptPreviewModal
				isOpen={previewOpen}
				formatCurrency={formatCurrency}
				onClose={() => setPreviewOpen(false)}
				invoiceId={selectedInvoice?.id}
				t={t}
				onApply={async () => {
					await handleStatusChange(selectedInvoice?.id, "accepted")
					setPreviewOpen(false)
				}}
			/>

			<EditPaidAmountModal
				isOpen={paidAmountOpen}
				onClose={() => setPaidAmountOpen(false)}
				invoice={selectedInvoice}
				t={t}
				onApply={() => {
					fetchReturns(pager.current_page, pager.per_page);
					fetchStats();
				}}
			/>
		</div>
	);
}

function LogsModal({ isOpen, onClose, invoiceId, t }) {
	const [loading, setLoading] = useState(false);
	const [logs, setLogs] = useState([]);

	useEffect(() => {
		if (!isOpen || !invoiceId) return;

		(async () => {
			setLoading(true);
			try {
				const res = await api.get(`/purchases-return/${invoiceId}/audit-logs`);
				setLogs(res.data || []);
			} catch (e) {
				console.error(e);
				toast.error(e?.response?.data?.message || t("messages.logsFailed"));
			} finally {
				setLoading(false);
			}
		})();
	}, [isOpen, invoiceId, t]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="!max-w-4xl max-h-[85vh] flex flex-col">
				<DialogHeader className="border-b border-gray-200 dark:border-slate-700 pb-4">
					<DialogTitle className="flex items-center gap-3 text-xl">
						<div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
							<ScrollText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
						</div>
						{t("logs.title")}
					</DialogTitle>

					<DialogDescription className="text-sm mt-2">
						{t("logs.description")}{" "}
						<span className="font-semibold text-primary">#{invoiceId}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto py-4">
					{loading ? (
						<LogsModalSkeleton />
					) : logs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16">
							<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
								<ScrollText className="w-8 h-8 text-gray-400 dark:text-slate-600" />
							</div>
							<p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
								{t("logs.empty")}
							</p>
						</div>
					) : (
						<div className="space-y-3 px-1" dir="ltr">
							{logs.map((log, idx) => {
								const user = log.user || null;
								const userName = user?.name || "System";
								const userEmail = user?.email || "";
								const avatar = user?.avatarUrl || "";

								const hasDetails = !!(log.oldData || log.newData || log.changes);

								return (
									<motion.div
										key={log.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: idx * 0.05 }}
										className="p-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-md transition-all"
									>
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 space-y-2">
												<div className="flex items-center justify-between flex-wrap">
													<div className="flex items-center gap-2">
														<Badge>{log.action}</Badge>
														<TinyBadge>#{log.id}</TinyBadge>
													</div>

													<div className="font-[Inter] flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
														<Clock className="w-3 h-3" />
														{log.created_at
															? new Date(log.created_at).toLocaleString()
															: "-"}
													</div>
												</div>

												<div className="flex items-center gap-3 pt-1">
													{avatar ? (
														<img
															src={avatarSrc(avatar)}
															alt={userName}
															className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-700"
														/>
													) : (
														<div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700" />
													)}

													<div className="flex flex-col">
														<div className="text-sm font-semibold text-gray-900 dark:text-white">
															{userName}
															{userEmail ? (
																<span className="ml-2 text-xs font-normal text-gray-500 dark:text-slate-400">
																	{userEmail}
																</span>
															) : null}
														</div>

														{log.ipAddress ? (
															<div className="text-[11px] text-gray-400 dark:text-slate-500">
																IP: {log.ipAddress}
															</div>
														) : null}
													</div>
												</div>

												{log.description ? (
													<p className="font-[Inter] text-sm text-gray-700 dark:text-slate-300">
														{log.description}
													</p>
												) : null}
											</div>
										</div>

										{hasDetails ? (
											<details className="mt-3">
												<summary className="cursor-pointer text-xs text-primary font-semibold hover:underline flex items-center gap-2">
													<ChevronDown className="w-4 h-4" />
													{t("logs.showDetails")}
												</summary>

												<div className="mt-2 space-y-3">
													{log.oldData ? (
														<div>
															<div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1">
																oldData
															</div>
															<JsonBlock value={log.oldData} />
														</div>
													) : null}

													{log.newData ? (
														<div>
															<div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1">
																newData
															</div>
															<JsonBlock value={log.newData} />
														</div>
													) : null}

													{log.changes ? (
														<div>
															<div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1">
																changes
															</div>
															<JsonBlock value={log.changes} />
														</div>
													) : null}
												</div>
											</details>
										) : null}
									</motion.div>
								);
							})}
						</div>
					)}
				</div>

				<DialogFooter className="border-t border-gray-200 dark:border-slate-700 pt-4">
					<Button onClick={() => onClose(false)} className="px-6 rounded-xl">
						{t("actions.close")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function LogsModalSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="border-b border-border pb-4 space-y-3">
				<div className="flex items-center gap-3">
					<Bone className="w-10 h-10 rounded-xl" />
					<div className="space-y-2">
						<Bone className="h-5 w-40" />
						<Bone className="h-4 w-72" />
					</div>
				</div>
			</div>
			<div className="space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="p-4 rounded-xl border-2 border-border/40 bg-muted/20 space-y-4"
					>
						<div className="flex items-center justify-between">
							<div className="flex gap-2">
								<Bone className="h-5 w-20 rounded-full" />
								<Bone className="h-5 w-14 rounded-full" />
							</div>
							<Bone className="h-4 w-32" />
						</div>
						<div className="flex items-center gap-3">
							<Bone className="w-8 h-8 rounded-full" />
							<div className="space-y-2">
								<Bone className="h-4 w-36" />
								<Bone className="h-3 w-24" />
							</div>
						</div>
						<div className="space-y-2">
							<Bone className="h-4 w-full" />
							<Bone className="h-4 w-5/6" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function AcceptPreviewModal({ isOpen, onClose, invoiceId, t, onApply, formatCurrency }) {
	const [loading, setLoading] = useState(false);
	const [preview, setPreview] = useState(null);

	useEffect(() => {
		if (!isOpen || !invoiceId) return;
		(async () => {
			setLoading(true);
			try {
				const res = await api.get(`/purchases-return/${invoiceId}/accept-preview`);
				setPreview(res.data);
			} catch (e) {
				console.error(e);
				toast.error(e?.response?.data?.message || t("messages.previewFailed"));
			} finally {
				setLoading(false);
			}
		})();
	}, [isOpen, invoiceId, t]);

	const rows = preview?.rows ?? [];
	const hasErrors = rows.some((r) => r.error);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-5xl w-[96vw] max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 sm:p-6">
				<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b-2 border-primary/20">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
						<div>
							<DialogTitle className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2 sm:gap-3">
								<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
									<Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
								</div>
								<span className="truncate">{t("acceptPreview.title")}</span>
							</DialogTitle>
							<DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1 sm:mt-2">
								{t("acceptPreview.returnNumber")}: <span className="font-bold text-primary">{preview?.returnNumber || invoiceId}</span>
							</DialogDescription>
						</div>
						{preview && !loading && (
							<span className={cn(
								"self-start sm:self-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border-2 flex items-center gap-2",
								preview.currentStatus === "pending" && "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300"
							)}>
								<Clock className="w-3.5 h-3.5 sm:w-4 h-4" />
								{preview.currentStatus}
							</span>
						)}
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
					{loading ? (
						<LoadingSpinner text={t("acceptPreview.loading")} />
					) : !preview ? (
						<div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
							<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
								<XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-slate-600" />
							</div>
							<p className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-2">{t("acceptPreview.empty")}</p>
							<p className="text-sm text-gray-500 dark:text-slate-400">{t("acceptPreview.emptyDescription")}</p>
						</div>
					) : (
						<div className="space-y-4 sm:space-y-5">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-3 sm:p-4 border-2 border-primary/20"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
											<Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
										</div>
										<div>
											<div className="text-2xl sm:text-3xl font-bold text-primary">{rows.length}</div>
											<div className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 font-semibold">{t("acceptPreview.totalItems")}</div>
										</div>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-3 sm:p-4 border-2 border-red-200 dark:border-red-800"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
											<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
										</div>
										<div>
											<div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
												-{rows.reduce((sum, r) => sum + (r.removeQty || 0), 0)}
											</div>
											<div className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 font-semibold">{t("acceptPreview.totalQuantityToRemove")}</div>
										</div>
									</div>
								</motion.div>
							</div>

							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="border-2 border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md"
							>
								<div className="overflow-x-auto">
									<table className="w-full min-w-[800px] sm:min-w-full">
										<thead>
											<tr className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
												<th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("table.sku")}
												</th>
												<th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("table.name")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.stockBefore")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.removeQty")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.stockAfter")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("table.unitCost")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("table.lineTax")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("table.totalReturn")}
												</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-slate-900">
											{rows.map((r, idx) => (
												<motion.tr
													key={idx}
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: idx * 0.03 }}
													className={cn(
														"border-b border-gray-100 dark:border-slate-800 transition-all text-xs sm:text-sm",
														r.error
															? "bg-red-50 dark:bg-red-950/20"
															: "hover:bg-primary/5 dark:hover:bg-primary/10"
													)}
												>
													<td className="p-3 sm:p-4">
														<span className="font-bold text-gray-800 dark:text-slate-200 truncate max-w-[100px] block">
															{r.sku || `#${r.variantId}`}
														</span>
														{r.error && (
															<div className="flex items-start gap-1 mt-1">
																<XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
																<p className="text-[9px] sm:text-[10px] text-red-700 dark:text-red-300 font-medium">{r.error}</p>
															</div>
														)}
													</td>
													<td className="p-3 sm:p-4 font-medium text-gray-700 dark:text-slate-300">
														{r.name || "-"}
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className="font-semibold text-gray-500 dark:text-slate-400">
															{r.oldStock ?? 0}
														</span>
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">
															-{r.removeQty || 0}
														</span>
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className="font-bold text-primary">
															{r.newStock ?? 0}
														</span>
													</td>
													<td className="p-3 sm:p-4 text-center font-semibold text-gray-600 dark:text-slate-300">
														{formatCurrency(r.unitCost)}
													</td>
													<td className="p-3 sm:p-4 text-center text-gray-500 dark:text-slate-400">
														{r.taxInclusive ? (
															<div className="flex flex-col">
																<span>{formatCurrency(r.lineTax)}</span>
																<span className="text-[9px] opacity-70">({r.taxRate}%)</span>
															</div>
														) : "-"}
													</td>
													<td className="p-3 sm:p-4 text-center font-bold text-primary">
														{formatCurrency(r.lineTotal)}
													</td>
												</motion.tr>
											))}
										</tbody>
									</table>
								</div>
							</motion.div>

							{hasErrors && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 rounded-xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4"
								>
									<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
										<XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
									</div>
									<div>
										<p className="text-sm sm:text-base font-bold text-red-900 dark:text-red-200 mb-0.5 sm:mb-1">
											{t("acceptPreview.hasErrors")}
										</p>
										<p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
											{t("acceptPreview.hasErrorsDescription")}
										</p>
									</div>
								</motion.div>
							)}
						</div>
					)}
				</div>

				<DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
					<div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 sm:gap-0">
						<div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 order-2 sm:order-1">
							{!loading && preview && !hasErrors && (
								<span className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
									<span className="font-semibold">{t("acceptPreview.previewReady")}</span>
								</span>
							)}
						</div>
						<div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
							<Button
								variant="outline"
								onClick={onClose}
								className="flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold border-2"
							>
								{t("actions.cancel")}
							</Button>
							<Button
								onClick={() => onApply?.()}
								disabled={loading || !preview || hasErrors || !preview?.canApply}
								className={cn(
									"flex-1 sm:flex-none px-4 sm:px-10 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/30 transition-all transform hover:scale-105 active:scale-95",
									(loading || !preview || hasErrors || !preview?.canApply) && "opacity-50 cursor-not-allowed hover:scale-100"
								)}
							>
								<Check className="w-4 h-4 sm:w-5 sm:h-5 ltr:mr-1.5 sm:ltr:mr-2 rtl:ml-1.5 sm:rtl:ml-2" />
								{t("acceptPreview.apply")}
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function DetailsModal({ isOpen, onClose, invoice, isLoading, formatCurrency }) {
	const t = useTranslations("purchasesReturn");
	const receipt = invoice?.receiptAsset || null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="!max-w-5xl max-h-[90vh] flex flex-col">
				<DialogHeader className="border-b-2 border-gray-200 dark:border-slate-700 pb-4">
					<DialogTitle className="flex items-center gap-3 text-2xl">
						<div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
							<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
						{t("details.title")}
					</DialogTitle>
					<DialogDescription className="text-sm mt-2">
						{t("details.returnNumber")}: <span className="font-bold text-primary">{invoice?.returnNumber}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto py-4">
					{isLoading ? (
						<DetailsModalSkeleton />
					) : !invoice ? (
						null
					) : (
						<div className="space-y-6 px-2">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t("details.supplier")}</Label>
									<p className="text-sm font-bold text-gray-900 dark:text-white">
										{invoice.supplierId ? invoice.supplier?.name : t("details.noSupplier")}
									</p>
								</div>
								<div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t("details.safe")}</Label>
									<p className="text-sm font-bold text-gray-900 dark:text-white">{invoice.safeId ? String(invoice.safeId) : "-"}</p>
								</div>
								<div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t("details.date")}</Label>
									<p className="text-sm font-bold text-gray-900 dark:text-white">
										{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "-"}
									</p>
								</div>
								<div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t("details.status")}</Label>
									<span className={cn(
										"inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
										invoice.status === "approved" && "bg-green-100 text-green-700",
										invoice.status === "pending" && "bg-yellow-100 text-yellow-700",
										invoice.status === "rejected" && "bg-red-100 text-red-700"
									)}>
										{t(`statuses.${invoice.status}`)}
									</span>
								</div>
							</div>

							<div>
								<h3 className="text-base font-bold mb-3 flex items-center gap-2">
									<Package className="w-5 h-5 text-primary" />
									{t("details.items")}
								</h3>
								<div className="border-2 border-gray-200 dark:border-slate-700 rounded-xl overflow-y-auto">
									<table className="w-full text-sm">
										<thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800">
											<tr>
												<th className="text-right p-4 font-bold">{t("table.sku")}</th>
												<th className="text-right p-4 font-bold">{t("table.name")}</th>
												<th className="text-right p-4 font-bold">{t("table.quantityCount")}</th>
												<th className="text-right p-4 font-bold">{t("table.unitCost")}</th>
												<th className="text-right p-4 font-bold">{t("table.taxInclusive")}</th>
												<th className="text-right p-4 font-bold">{t("table.taxRate")}</th>
												<th className="text-right p-4 font-bold">{t("table.lineTax")}</th>
												<th className="text-right p-4 font-bold">{t("table.totalReturn")}</th>
											</tr>
										</thead>
										<tbody>
											{invoice.items?.map((item, idx) => (
												<tr key={idx} className="border-t hover:bg-primary/5 transition-colors">
													<td className="p-4">{item.variant?.sku || "-"}</td>
													<td className="p-4 font-medium">{item.variant?.product?.name || "-"}</td>
													<td className="p-4 text-center font-semibold">{item.returnedQuantity}</td>
													<td className="p-4 text-center font-semibold">{formatCurrency(item.unitCost)}</td>
													<td className="p-4 text-center font-semibold">{item.taxInclusive ? t("table.yes") : t("table.no")}</td>
													<td className="p-4 text-center font-semibold">{item.taxInclusive ? Number(item.taxRate) + "%" : "-"}</td>
													<td className="p-4 text-center font-semibold">{item.taxInclusive ? formatCurrency(item.lineTax) : "-"}</td>

													<td className="p-4 font-bold text-primary">{formatCurrency(item.lineTotal)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							<div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-950/30 p-6 rounded-xl border-2 border-primary/30">
								<div className="space-y-3">
									<div className="flex justify-between text-sm">
										<span className="font-semibold text-gray-700 dark:text-slate-300">{t("summary.subtotal")}</span>
										<span className="font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="font-semibold text-gray-700 dark:text-slate-300">{t("summary.tax")}</span>
										<span className="font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.taxTotal)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="font-semibold text-gray-700 dark:text-slate-300">{t("summary.totalReturn")}</span>
										<span className="font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.totalReturn)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="font-semibold text-gray-700 dark:text-slate-300">{t("summary.paidAmount")}</span>
										<span className="font-bold text-green-600">{formatCurrency(invoice.paidAmount)}</span>
									</div>

									<div className="flex justify-between text-lg font-bold border-t-2 border-primary/30 pt-3">
										<span className="text-gray-900 dark:text-white">{t("summary.remainingAmount")}</span>
										<span className="text-primary text-xl">{formatCurrency(Number(invoice.totalReturn) - Number(invoice.paidAmount))}</span>
									</div>
								</div>
							</div>

							{receipt && (
								<div>
									<Label className="text-base font-bold mb-3 block flex items-center gap-2">
										<FileText className="w-5 h-5 text-primary" />
										{t("details.receiptAsset")}
									</Label>

									{isImagePath(receipt) ? (
										<img src={baseImg + receipt} alt={t("details.receiptAlt")} className="w-full max-h-96 object-contain rounded-xl border-2 border-gray-200 dark:border-slate-700 shadow-lg" />
									) : isPdfPath(receipt) ? (
										<a href={baseImg + receipt} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all">
											<FileText size={20} />
											<span>{t("details.openPdf")}</span>
										</a>
									) : (
										<a href={baseImg + receipt} target="_blank" rel="noreferrer" className="text-sm text-primary underline font-semibold">
											{t("details.openAsset")}
										</a>
									)}
								</div>
							)}

							{invoice.notes && (
								<div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-2 block">{t("details.notes")}</Label>
									<p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{invoice.notes}</p>
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter className="border-t-2 border-gray-200 dark:border-slate-700 pt-4">
					<Button onClick={onClose} className="px-8 rounded-xl font-semibold">
						{t("actions.close")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DetailsModalSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">

			{/* Header */}
			<div className="border-b-2 border-border pb-4 space-y-3">
				<div className="flex items-center gap-3">
					<Bone className="w-12 h-12 rounded-xl" />
					<div className="space-y-2">
						<Bone className="h-6 w-48" />
						<Bone className="h-4 w-64" />
					</div>
				</div>
			</div>

			{/* Info Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-2"
					>
						<Bone className="h-3 w-16" />
						<Bone className="h-4 w-24" />
					</div>
				))}
			</div>

			{/* Items Section */}
			<div className="space-y-3">
				<Bone className="h-5 w-40" />

				<div className="rounded-xl border border-border/30 overflow-hidden">
					{/* Table Header */}
					<div className="bg-muted/30 px-4 py-3 flex justify-between">
						<Bone className="h-3 w-20" />
						<Bone className="h-3 w-24" />
						<Bone className="h-3 w-16" />
						<Bone className="h-3 w-16" />
						<Bone className="h-3 w-20" />
					</div>

					{/* Table Rows */}
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="grid grid-cols-5 gap-4 px-4 py-4 border-t border-border/20"
						>
							<Bone className="h-4 w-16" />
							<Bone className="h-4 w-28" />
							<Bone className="h-4 w-16" />
							<Bone className="h-4 w-12 mx-auto" />
							<Bone className="h-4 w-20" />
						</div>
					))}
				</div>
			</div>

			{/* Summary */}
			<div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
				<div className="flex justify-between">
					<Bone className="h-4 w-28" />
					<Bone className="h-4 w-20" />
				</div>
				<div className="flex justify-between">
					<Bone className="h-4 w-32" />
					<Bone className="h-4 w-20" />
				</div>
				<div className="flex justify-between pt-3 border-t border-primary/20">
					<Bone className="h-5 w-36" />
					<Bone className="h-6 w-24" />
				</div>
			</div>

			{/* Receipt */}
			<div className="space-y-3">
				<Bone className="h-5 w-40" />
				<Bone className="h-40 w-full rounded-xl" />
			</div>

			{/* Notes */}
			<div className="p-4 rounded-xl border border-border/40 space-y-2">
				<Bone className="h-3 w-20" />
				<Bone className="h-4 w-full" />
				<Bone className="h-4 w-5/6" />
			</div>

			{/* Footer */}
			<div className="border-t-2 border-border pt-4 flex justify-end">
				<Bone className="h-10 w-28 rounded-xl" />
			</div>
		</div>
	);
}

function EditPaidAmountModal({ isOpen, onClose, invoice, t, onApply }) {
	const [val, setVal] = useState(0);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (invoice) setVal(invoice.paidAmount || 0);
	}, [invoice]);

	const handleSubmit = async () => {
		setLoading(true);
		try {
			await api.patch(`/purchases-return/${invoice.id}/paid-amount`, { paidAmount: Number(val) });
			toast.success(t("messages.updatePaidAmountSuccess"));
			onApply?.();
			onClose();
		} catch (e) {
			console.error(e);
			toast.error(e?.response?.data?.message || t("messages.updatePaidAmountFailed"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("updatePaidAmount.title")}</DialogTitle>
					<DialogDescription>{t("updatePaidAmount.description")}</DialogDescription>
				</DialogHeader>
				<div className="py-4 space-y-4">
					<div className="space-y-2">
						<Label>{t("updatePaidAmount.paidAmount")}</Label>
						<Input
							type="number"
							value={val}
							onChange={(e) => setVal(e.target.value)}
							placeholder="0.00"
							className="rounded-xl"
						/>
					</div>
					<div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
						<div className="flex justify-between text-sm">
							<span>{t("summary.totalReturn")}</span>
							<span className="font-bold">{invoice?.totalReturn}</span>
						</div>
						<div className="flex justify-between text-sm mt-1">
							<span>{t("summary.remainingAmount")}</span>
							<span className="font-bold text-primary">{invoice ? (invoice.totalReturn - val) : 0}</span>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={loading}>{t("actions.cancel")}</Button>
					<Button onClick={handleSubmit} disabled={loading || val < 0}>
						{loading ? <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" /> : <Check className="w-4 h-4 ltr:mr-2 rtl:ml-2" />}
						{t("actions.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
