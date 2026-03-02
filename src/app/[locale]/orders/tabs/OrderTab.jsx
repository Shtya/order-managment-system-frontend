
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Filter,
	Download,
	Eye,
	Edit,
	Trash2,
	Package,
	Clock,
	CheckCircle,
	XCircle,
	TrendingUp,
	MapPin,
	Phone,
	MoreVertical,
	Users,
	AlertCircle,
	RefreshCw,
	Copy,
	Truck,
	DollarSign,
	Calendar,
	X,
	Plus,
	Upload,
	FileSpreadsheet,
	Settings,
	Bell,
	Save,
	Edit2,
	Loader2,
	RotateCcw,
	AlertTriangle,
	ChevronDownIcon,
	ChevronDown,
	ShoppingCart,
	RefreshCcw,
	ArrowLeftRight,
} from "lucide-react";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";
import Button_ from "@/components/atoms/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import api, { BASE_URL } from "@/utils/api";
import UserSelect, { avatarSrc } from "@/components/atoms/UserSelect";
import { Checkbox } from "@/components/ui/checkbox";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import BarcodeCell from "@/components/atoms/BarcodeCell";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { normalizeAxiosError } from "@/utils/axios";
import { useDebounce } from "@/hook/useDebounce";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ReplacementTab from "./ReplacementTab";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import { generateBgColors, getIconForStatus } from "../page";
import DistributionModal from "../atoms/DistrubtionModal";
import BulkUploadModal from "../atoms/BulkUploadModal";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import SettingsModal from "../atoms/SettingsModal";


// ✅ Order Status Constants (Mirroring your Enum)
export const OrderStatus = {
	NEW: "new",
	UNDER_REVIEW: "under_review",
	CONFIRMED: "confirmed",
	POSTPONED: "postponed",
	NO_ANSWER: "no_answer",
	WRONG_NUMBER: "wrong_number",
	OUT_OF_DELIVERY_AREA: "out_of_area",
	DUPLICATE: "duplicate",
	PREPARING: "preparing",
	READY: "ready",
	SHIPPED: "shipped",
	DELIVERED: "delivered",
	CANCELLED: "cancelled",
	RETURNED: "returned",
};

// ✅ State Machine Transitions
export const validTransitions = {
	[OrderStatus.NEW]: [
		OrderStatus.UNDER_REVIEW,
		OrderStatus.CONFIRMED,
		OrderStatus.POSTPONED,
		OrderStatus.NO_ANSWER,
		OrderStatus.WRONG_NUMBER,
		OrderStatus.OUT_OF_DELIVERY_AREA,
		OrderStatus.DUPLICATE,
		OrderStatus.CANCELLED,
	],

	[OrderStatus.UNDER_REVIEW]: [
		OrderStatus.CONFIRMED,
		OrderStatus.POSTPONED,
		OrderStatus.NO_ANSWER,
		OrderStatus.WRONG_NUMBER,
		OrderStatus.OUT_OF_DELIVERY_AREA,
		OrderStatus.DUPLICATE,
		OrderStatus.CANCELLED,
	],

	[OrderStatus.POSTPONED]: [
		OrderStatus.UNDER_REVIEW,
		OrderStatus.CONFIRMED,
		OrderStatus.NO_ANSWER,
		OrderStatus.WRONG_NUMBER,
		OrderStatus.OUT_OF_DELIVERY_AREA,
		OrderStatus.DUPLICATE,
		OrderStatus.CANCELLED,
	],

	[OrderStatus.NO_ANSWER]: [
		OrderStatus.UNDER_REVIEW,
		OrderStatus.CONFIRMED,
		OrderStatus.POSTPONED,
		OrderStatus.WRONG_NUMBER,
		OrderStatus.OUT_OF_DELIVERY_AREA,
		OrderStatus.DUPLICATE,
		OrderStatus.CANCELLED,
	],

	[OrderStatus.CONFIRMED]: [
		OrderStatus.PREPARING,
		OrderStatus.CANCELLED
	],

	[OrderStatus.PREPARING]: [
		OrderStatus.READY,
		OrderStatus.CANCELLED
	],

	[OrderStatus.READY]: [
		OrderStatus.SHIPPED,
		OrderStatus.CANCELLED
	],

	[OrderStatus.SHIPPED]: [
		OrderStatus.DELIVERED,
		OrderStatus.RETURNED
	],

	[OrderStatus.DELIVERED]: [
		OrderStatus.RETURNED
	],

	// Terminal States (No outward transitions)
	[OrderStatus.WRONG_NUMBER]: [],
	[OrderStatus.OUT_OF_DELIVERY_AREA]: [],
	[OrderStatus.DUPLICATE]: [],
	[OrderStatus.CANCELLED]: [],
	[OrderStatus.RETURNED]: [],
};


export function ActionButtons({ row, onDelete, onEdit, onView }) {
	const t = useTranslations("orders");
	return (
		<TooltipProvider>
			<div className="flex items-center gap-2">
				{/* Delete */}
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => onDelete?.(row)}
							className="group w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm
                border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white"
						>
							<Trash2 size={16} className="transition-transform group-hover:scale-110 group-hover:rotate-12" />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>{t("actions.delete")}</TooltipContent>
				</Tooltip>

				{/* Edit */}
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => onEdit?.(row)}
							className="group w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm
                border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white"
						>
							<Edit2 size={16} className="transition-transform group-hover:scale-110 group-hover:-rotate-12" />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>{t("actions.edit")}</TooltipContent>
				</Tooltip>

				{/* View */}
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => onView?.(row)}
							className="group w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm
                border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white"
						>
							<Eye size={16} className="transition-transform group-hover:scale-110" />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>{t("actions.view")}</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}



// Main Orders Page Component
export default function OrdersTab({ stats, fetchStats, statsLoading }) {
	const t = useTranslations("orders");
	const tShipping = useTranslations("shipping");

	const router = useRouter();
	const [retrySettingsOpen, setRetrySettingsOpen] = useState(false);
	const [statusFormOpen, setStatusFormOpen] = useState(false);
	const [editingStatus, setEditingStatus] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deletingStatus, setDeletingStatus] = useState(null);
	const [deleteOrderModalOpen, setDeleteOrderModalOpen] = useState(false);
	const [deletingOrder, setDeletingOrder] = useState(null);

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [distributionOpen, setDistributionOpen] = useState(false);
	const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
	const [filters, setFilters] = useState({
		status: "all",
		paymentStatus: "all",
		employee: "all",
		startDate: null,
		endDate: null,
		// product: "all",
		// area: "all",
		store: "all",
		shippingCompany: "all",
	});


	const [loading, setLoading] = useState(false);

	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 12,
		records: [],
	});
	const [storesList, setStoresList] = useState([]);
	const [shippingCompaniesList, setShippingCompaniesList] = useState([]);
	const [ordersLoading, setOrdersLoading] = useState(false);
	const searchTimer = useRef(null);
	useEffect(() => {

		fetchLookups();
		fetchOrders();
	}, []);

	// ── Debounce search ──
	useEffect(() => {
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
		return () => clearTimeout(searchTimer.current);
	}, [search]);

	// ── Fetch on search / filter change ──
	useEffect(() => {
		handlePageChange(1, pager.per_page);
	}, [debouncedSearch]);


	const fetchLookups = async () => {
		try {
			const [storesRes, shippingRes] = await Promise.all([
				api.get('/lookups/stores', { params: { limit: 200, isActive: true } }),
				api.get('/shipping/integrations/active',),
			]);

			console.log(shippingRes.data)
			setStoresList(Array.isArray(storesRes.data) ? storesRes.data : (storesRes.data?.records || []));
			setShippingCompaniesList(Array.isArray(shippingRes.data.integrations) ? shippingRes.data.integrations : (Array.isArray(shippingRes.data) ? shippingRes.data : []));
		} catch (e) {
			console.error('Error fetching lookups', e);
		}
	};

	const buildParams = (page = pager.current_page, per_page = pager.per_page) => {
		const params = {
			page,
			limit: per_page,
		};

		if (search) params.search = search;
		if (filters.status && filters.status !== 'all') params.status = filters.status;
		if (filters.paymentStatus && filters.paymentStatus !== 'all') params.paymentStatus = filters.paymentStatus;
		if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
		if (filters.startDate) params.startDate = filters.startDate;
		if (filters.endDate) params.endDate = filters.endDate;
		if (filters.shippingCompany && filters.shippingCompany !== 'all') params.shippingCompanyId = filters.shippingCompany;
		if (filters.store && filters.store !== 'all') params.storeId = filters.store;
		if (filters.employee && filters.employee !== 'all') params.userId = filters.employee;

		return params;
	};

	const fetchOrders = async (page = pager.current_page, per_page = pager.per_page) => {
		try {
			setOrdersLoading(true);
			const params = buildParams(page, per_page);
			const res = await api.get('/orders', { params });
			const data = res.data || {};
			setPager({
				total_records: data.total_records || 0,
				current_page: data.current_page || page,
				per_page: data.per_page || per_page,
				records: Array.isArray(data.records) ? data.records : [],
			});
		} catch (e) {
			console.error('Error fetching orders', e);
			toast.error(t('messages.errorFetchingOrders'));
		} finally {
			setOrdersLoading(false);
		}
	};


	const handleDeleteStatus = (status) => {
		setDeletingStatus(status);
		setDeleteModalOpen(true);
	};

	const handleEditStatus = (status) => {
		setEditingStatus(status);
		setStatusFormOpen(true);
	};

	const handleAddStatus = () => {
		setEditingStatus(null);
		setStatusFormOpen(true);
	};

	const statsCards = useMemo(() => {
		if (!stats.length) return [];
		return stats
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((stat) => {
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
	}, [stats]);

	// Create statusesMap for filters and dropdowns
	const statusesMap = useMemo(() => {
		const map = {};
		stats.forEach(stat => {
			map[stat.code] = {
				id: stat.id,
				name: stat.name,
				color: stat.color,
				system: stat.system,
				count: stat.count,
			};
		});
		return map;
	}, [stats]);

	const handlePageChange = ({ page, per_page }) => {
		fetchOrders(page, per_page);
	};

	const applyFilters = () => {
		toast.success(t("messages.filtersApplied"));
		fetchOrders(1, pager.per_page);
	};
	const [exportLoading, setExportLoading] = useState()

	const handleExport = async () => {
		let toastId;
		try {
			setExportLoading(true);
			toastId = toast.loading(t("messages.exportStarted"));

			// Build export params (same as list but without pagination)
			const params = {};
			if (search) params.search = search;
			if (filters.status && filters.status !== 'all') params.status = filters.status;
			if (filters.paymentStatus && filters.paymentStatus !== 'all') params.paymentStatus = filters.paymentStatus;
			if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
			if (filters.startDate) params.startDate = filters.startDate;
			if (filters.endDate) params.endDate = filters.endDate;
			if (filters.shippingCompany && filters.shippingCompany !== 'all') params.shippingCompanyId = filters.shippingCompany;
			if (filters.store && filters.store !== 'all') params.storeId = filters.store;
			if (filters.employee && filters.employee !== 'all') params.userId = filters.employee;

			const response = await api.get('/orders/export', {
				params,
				responseType: 'blob', // Important for file download
			});

			// Parse filename from Content-Disposition header
			const contentDisposition = response.headers['content-disposition'];
			let filename = `orders_export_${Date.now()}.xlsx`;

			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?([^";]+)"?/);
				if (match && match[1]) {
					filename = match[1];
				}
			}

			// Create download link
			const url = window.URL.createObjectURL(new Blob([response.data], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			}));

			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();

			// Cleanup
			link.remove();
			window.URL.revokeObjectURL(url);

			toast.dismiss();
			toast.success(t("messages.exportSuccess"), {
				id: toastId
			});
		} catch (error) {
			console.error('Export failed:', error);
			toast.dismiss();
			toast.error(error.response?.data?.message || t("messages.exportFailed"), {
				id: toastId
			});
		} finally {
			setExportLoading(false);
		}
	};



	const [updatingStatuses, setUpdatingStatuses] = useState([]);

	const setUpdating = (id, v) => {
		setUpdatingStatuses((prev) => {
			if (v) return Array.from(new Set(prev.concat(id)));
			return prev.filter((x) => x !== id);
		});
	};

	const getStatusBadge = (statusCode) => {
		const status = statusesMap[statusCode];
		if (!status) {
			return "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
		}

		// Generate badge colors from status color
		const hexToRgb = (hex) => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		};

		const rgb = hexToRgb(status.color);
		return {
			style: rgb ? {
				backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
				color: status.color,
			} : {},
			className: "rounded-md",
		};
	};

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
				key: "products",
				header: t("table.products"),
				cell: (row) => (
					<div className="text-sm">
						{row.items.map((p, i) => (
							<div key={i}>{p.variant.product.name} (x{p.quantity})</div>
						))}
					</div>
				),
			},
			{
				key: "shippingCost",
				header: t("table.shippingCost"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{row.shippingCost} {t("currency")}
					</span>
				),
			},
			{
				key: "status",
				header: t("table.status"),
				cell: (row) => (
					<Badge className={cn("rounded-md", getStatusBadge(row.status))}>
						{row.status.system ? t(`statuses.${row.status.code}`) : (row.status.name || row.status.code)}
					</Badge>
				),
			},
			{
				key: "confirmStatus",
				header: t("table.confirmOrder"),
				cell: (row) => {
					const currentCode = row.status?.code;
					const currentStatusId = row.status?.id;
					return (
						<div className="flex items-center gap-2">
							<Select
								defaultValue={String(currentStatusId)}
								onValueChange={async (val) => {
									const statusId = Number(val);
									if (isNaN(statusId) || statusId === currentStatusId) return;
									const toastId = toast.loading(t("messages.statusUpdating"));
									try {
										setUpdating(row.id, true);
										await api.patch(`/orders/${row.id}/status`, { statusId });
										toast.success(t("messages.statusUpdated"), { id: toastId });
										fetchStats();
										fetchOrders(pager.current_page, pager.per_page);
									} catch (err) {
										console.error(err);
										toast.error(err.response?.data?.message || t("messages.errorUpdatingStatus"), { id: toastId });
									} finally {
										setUpdating(row.id, false);
									}
								}}
								disabled={updatingStatuses.includes(row.id)}
							>
								<SelectTrigger className="w-[150px] h-8">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(stats || []).map((s) => {

										return (
											<SelectItem key={s.id} value={String(s.id)}>
												{s.system ? t(`statuses.${s.code}`) : (s.name || s.code)}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>
					);
				},
			},
			{
				key: "paymentMethod",
				header: t("table.paymentMethod"),
				cell: (row) => (
					<Badge variant="outline">
						{t(`paymentMethods.${row.paymentMethod}`)}
					</Badge>
				),
			},
			{
				key: "paymentStatus",
				header: t("table.paymentStatus"),
				cell: (row) => (
					<Badge variant="outline">
						{t(`paymentStatuses.${row.paymentStatus}`)}
					</Badge>
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
				key: "address",
				header: t("table.address"),
				cell: (row) => (
					<span className="text-sm text-gray-600 dark:text-slate-300 line-clamp-1">
						{row.address}
					</span>
				),
			},
			{
				key: "shippingCompany",
				header: t("table.shippingCompany"),
				cell: (row) => (
					<span className="text-sm">{row.shippingCompany?.name || "-"}</span>
				),
			},
			{
				key: "deposit",
				header: t("table.deposit"),
				cell: (row) => (
					<span className="text-sm">{row.deposit} {t("currency")}</span>
				),
			},
			{
				key: "assignedUser",
				header: t("table.assignedEmployee"),
				cell: (row) => {
					const assignment = row.assignments?.[0];
					const user = assignment?.employee;
					if (!user) return <span className="text-muted-foreground">—</span>;
					const avatarUrl = user.avatarUrl
						? (user.avatarUrl.startsWith("http") ? user.avatarUrl : `${(BASE_URL || "").replace(/\/+$/, "")}/${(user.avatarUrl || "").replace(/^\/+/, "")}`)
						: "";
					return (
						<div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-2 min-w-[180px] max-w-[220px]">
							<Avatar className="h-9 w-9 shrink-0">
								<AvatarImage src={avatarUrl} alt={user.name} />
								<AvatarFallback className="text-xs">{(user.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<div className="truncate font-medium text-sm">{user.name}</div>
								{user.employeeType && <div className="text-xs text-muted-foreground">{user.employeeType}</div>}
							</div>
						</div>
					);
				},
			},
			{
				key: "updated_at",
				header: t("table.lastUpdate"),
				cell: (row) => (
					<span className="text-xs text-gray-500">
						{new Date(row.updated_at).toLocaleDateString("ar-EG")}
					</span>
				),
			},
			{
				key: "created_at",
				header: t("table.createdat"),
				cell: (row) => (
					<span className="text-xs text-gray-500">
						{new Date(row.created_at).toLocaleDateString("ar-EG")}
					</span>
				),
			},
			{
				key: "actions",
				header: t("table.actions"),
				cell: (row) => (
					<ActionButtons
						row={row}
						onDelete={(r) => { setDeletingOrder(r); setDeleteOrderModalOpen(true); }}
						onEdit={(r) => router.push(`/orders/edit/${r.id}`)}
						onView={(r) => router.push(`/orders/details/${r.id}`)}
					/>
				),
			},
		];
	}, [t, router, stats]);


	return (
		<div className=" ">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("tabs.orders") },
				]}
				buttons={
					<>
						<Button_
							href="/orders/new"
							size="sm"
							label={t("actions.createOrder")}
							variant="solid"
							icon={<Plus size={18} />}
						/>
						<Button_
							size="sm"
							label={t("actions.settings")}
							variant="outline"
							onClick={() => setRetrySettingsOpen(true)}
							icon={<Settings size={18} />}
						/>
					</>
				}
				statsLoading={statsLoading}
				statsCount={12}
				stats={[
					...statsCards.map(stat => ({
						id: stat.id,
						name: stat.title,
						value: stat.value,
						icon: stat.icon,
						color: stat.iconColorInline,
						sortOrder: stat.sortOrder,
						editable: !stat.system,
						onEdit: () => handleEditStatus(stat.fullData),
						onDelete: () => handleDeleteStatus(stat),
					})),
					{
						id: "add",
						name: t("actions.addStatus"),
						icon: Plus,
						color: "#94a3b8",
						isAddCard: true,
						onClick: handleAddStatus,
						sortOrder: 9999,
					},
				]}
			/>

			<Table
				// ── Search (always visible) ───────────────────────────────────────────
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={applyFilters}

				// ── i18n labels ───────────────────────────────────────────────────────
				labels={{
					searchPlaceholder: t("toolbar.searchPlaceholder"),
					filter: t("toolbar.filter"),
					apply: t("filters.apply"),
					total: t("pagination.total"),
					limit: t("pagination.limit"),
					emptyTitle: t("empty"),
					emptySubtitle: t("emptySubtitle"),
					preview: t("image.preview"),
				}}
				actions={[
					{
						key: "distribute",
						label: t("toolbar.distribute"),
						icon: <Users size={15} />,
						color: "emerald",
						onClick: () => setDistributionOpen(true),
					},
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
					{
						key: "bulk",
						label: t("toolbar.bulkUpload"),
						icon: <Upload size={14} />,
						color: "primary",
						onClick: () => setBulkUploadOpen(true),
					},
				]}

				hasActiveFilters={Object.values(filters).some(v => v && v !== "all" && v !== null)}
				onApplyFilters={applyFilters}
				filters={
					<>
						{/* Status */}
						<FilterField label={t("filters.status")}>
							<Select
								value={filters.status}
								onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm  focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all">
									<SelectValue placeholder={t("filters.statusPlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									{Array.isArray(stats) && stats.map(s => (
										<SelectItem key={s.code || s.id} value={s.code || String(s.id)}>
											{s.system ? t(`statuses.${s.code}`) : (s.name || s.code)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						{/* Payment status */}
						<FilterField label={t("filters.paymentStatus")}>
							<Select
								value={filters.paymentStatus}
								onValueChange={(v) => setFilters(f => ({ ...f, paymentStatus: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm
            focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all">
									<SelectValue placeholder={t("filters.paymentStatusPlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="pending">{t("paymentStatuses.pending")}</SelectItem>
									<SelectItem value="paid">{t("paymentStatuses.paid")}</SelectItem>
									<SelectItem value="partial">{t("paymentStatuses.partial")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("filters.employee")}>

							<UserSelect
								value={filters.employee}
								onSelect={(user) => setFilters(f => ({ ...f, employee: user ? String(user.id) : "all" }))}
								placeholder={t("filters.employeePlaceholder")}
								allowAll
								allLabel={t("filters.all")}
								className="h-10 rounded-xl border-border bg-background"
								contentClassName="bg-card-select"
							/>
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
            text-foreground focus:outline-none focus:border-[var(--primary)]
            dark:focus:border-[#5b4bff] transition-all"
								placeholder={t("filters.datePlaceholder")}
							/>
						</FilterField>

						{/* Store */}
						<FilterField label={t("filters.store")}>
							<Select
								value={filters.store}
								onValueChange={(v) => setFilters(f => ({ ...f, store: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm
            focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all">
									<SelectValue placeholder={t("filters.storePlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									{storesList.map(store => (
										<SelectItem key={store.id ?? store.value} value={String(store.id ?? store.value)}>
											{store.name ?? store.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						{/* Shipping company */}
						<FilterField label={t("filters.shippingCompany")}>
							<Select
								value={filters.shippingCompany}
								onValueChange={(v) => setFilters(f => ({ ...f, shippingCompany: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm
            focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all">
									<SelectValue placeholder={t("filters.shippingCompanyPlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									{shippingCompaniesList.map(c => (
										<SelectItem key={c.providerId} value={String(c.providerId)}>
											{tShipping(`providers.${c.provider.toLowerCase()}`, { defaultValue: c.name })}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>
					</>
				}

				// ── Table ─────────────────────────────────────────────────────────────
				columns={columns}
				data={pager.records}
				isLoading={ordersLoading || loading}

				// ── Pagination ────────────────────────────────────────────────────────
				pagination={{
					total_records: pager.total_records,
					current_page: pager.current_page,
					per_page: pager.per_page,
				}}
				onPageChange={handlePageChange}
			/>


			<DistributionModal
				isOpen={distributionOpen}
				onClose={() => setDistributionOpen(false)}
				statuses={stats}
				onSuccess={() => {
					fetchOrders(1, pager.per_page);
					fetchStats();
				}}
			/>


			<SettingsModal
				isOpen={retrySettingsOpen}
				statuses={stats}
				onClose={() => setRetrySettingsOpen(false)}

			/>

			<BulkUploadModal
				isOpen={bulkUploadOpen}
				onClose={() => setBulkUploadOpen(false)}
				onSuccess={() => {
					fetchOrders(1, pager.per_page);
					fetchStats();
				}}
			/>

			<StatusFormModal
				isOpen={statusFormOpen}
				onClose={() => {
					setStatusFormOpen(false);
					setEditingStatus(null);
				}}
				status={editingStatus}
				onSuccess={fetchStats}

			/>

			<DeleteStatusModal
				isOpen={deleteModalOpen}
				onClose={() => {
					setDeleteModalOpen(false);
					setDeletingStatus(null);
				}}
				status={deletingStatus}
				onSuccess={fetchStats}

			/>

			<DeleteOrderModal
				isOpen={deleteOrderModalOpen}
				onClose={() => {
					setDeleteOrderModalOpen(false);
					setDeletingOrder(null);
				}}
				order={deletingOrder}
				onSuccess={() => {
					fetchOrders(pager.current_page, pager.per_page);
					fetchStats();
				}}
			/>
		</div>
	);
}





function isValidHex(color) {
	return /^#([0-9A-F]{6})$/i.test(color);
}

const ColorPicker = ({ value, onChange, disabled }) => {
	const [showPicker, setShowPicker] = useState(false);
	const wrapperRef = useRef(null);

	// Local state for input typing
	const [inputValue, setInputValue] = useState(value);

	// Sync when parent value changes
	useEffect(() => {
		setInputValue(value);
	}, [value]);

	// Debounce effect
	useEffect(() => {
		const handler = setTimeout(() => {
			if (isValidHex(inputValue)) {
				onChange(inputValue.toUpperCase());
			}
		}, 400); // 400ms debounce

		return () => clearTimeout(handler);
	}, [inputValue])
	const presetColors = [
		"#F44336", "#E91E63", "#9C27B0", "#673AB7",
		"#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
		"#009688", "#4CAF50", "#8BC34A", "#CDDC39",
		"#FFEB3B", "#FFC107", "#FF9800", "#FF5722",
		"#795548", "#9E9E9E", "#607D8B", "#000000",
	];

	// ✅ Outside click detection
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
				setShowPicker(false);
			}
		};

		if (showPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showPicker]);

	return (
		<div className="relative" ref={wrapperRef}>
			<div className="flex gap-2">
				{/* Color Preview Button */}
				<button
					type="button"
					disabled={disabled}
					onClick={() => !disabled && setShowPicker(!showPicker)}
					className="w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-slate-600"
					style={{ backgroundColor: value }}
				/>

				{/* Manual HEX Input */}
				<Input
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					disabled={disabled}
					placeholder="#000000"
					className="flex-1 h-12 font-mono rounded-xl"
					maxLength={7}
				/>
			</div>

			{showPicker && !disabled && (
				<div className="absolute z-50 mt-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 space-y-4">

					{/* Native Color Picker (Any Hex) */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Custom Color
						</label>
						<input
							type="color"
							value={value}
							onChange={(e) => {
								setInputValue(e.target.value);
							}}
							className="w-full h-10 cursor-pointer"
						/>
					</div>

					{/* Preset Colors */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Preset Colors
						</label>
						<div className="grid grid-cols-6 gap-2">
							{presetColors.map((color) => (
								<button
									key={color}
									type="button"
									onClick={() => onChange(color)}
									className={[
										"w-8 h-8 rounded-md border-2 transition-all",
										value === color
											? "border-black dark:border-white scale-110"
											: "border-gray-300 dark:border-slate-600 hover:scale-110"
									].join(" ")}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					</div>

				</div>
			)}
		</div>
	);
};


function StatusFormModal({ isOpen, onClose, status, onSuccess }) {
	const t = useTranslations("orders");
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		color: "#2196F3",
		sortOrder: 0,
	});

	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (status) {
			setFormData({
				name: status.name || "",
				description: status.description || "",
				color: status.color || "#2196F3",
				sortOrder: status.sortOrder || 0,
			});
		} else {
			setFormData({
				name: "",
				description: "",
				color: "#2196F3",
				sortOrder: 0,
			});
		}
		setErrors({});
	}, [status, isOpen]);

	const validate = () => {
		const newErrors = {};

		if (!formData.name.trim()) {
			newErrors.name = t("validation.statusNameRequired");
		} else if (formData.name.length > 50) {
			newErrors.name = t("validation.statusNameMaxLength");
		}

		if (!/^#[0-9A-F]{6}$/i.test(formData.color)) {
			newErrors.color = t("validation.invalidColorCode");
		}

		if (formData.sortOrder < 0) {
			newErrors.sortOrder = t("validation.sortOrderMin");
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validate()) {
			return;
		}

		try {
			setLoading(true);

			if (status) {
				// Update existing status
				await api.patch(`/orders/statuses/${status.id}`, formData);
				toast.success(t("messages.statusUpdated"));
			} else {
				// Create new status
				await api.post("/orders/statuses", formData);
				toast.success(t("messages.statusCreated"));
			}

			onClose();
			onSuccess();
		} catch (error) {
			console.error("Error saving status:", error);
			toast.error(error.response?.data?.message || t("messages.errorSavingStatus"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						{status ? t("statusForm.editTitle") : t("statusForm.addTitle")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("statusForm.name")} *
						</Label>
						<Input
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							placeholder={t("statusForm.namePlaceholder")}
							className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
							maxLength={50}
						/>
						{errors.name && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertCircle size={12} />
								{errors.name}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("statusForm.description")}
						</Label>
						<Textarea
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							placeholder={t("statusForm.descriptionPlaceholder")}
							className="rounded-xl bg-[#fafafa] dark:bg-slate-800/50 min-h-[100px]"
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("statusForm.color")} *
						</Label>
						<ColorPicker
							value={formData.color}
							onChange={(color) => setFormData({ ...formData, color: color })}
						/>
						{errors.color && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertCircle size={12} />
								{errors.color}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("statusForm.sortOrder")}
						</Label>
						<Input
							type="number"
							value={formData.sortOrder}
							onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
							className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
							min={0}
						/>
						{errors.sortOrder && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertCircle size={12} />
								{errors.sortOrder}
							</p>
						)}
						<p className="text-xs text-gray-500 dark:text-slate-400">
							{t("statusForm.sortOrderHelp")}
						</p>
					</div>

					<div className="flex gap-3 pt-4">
						<Button
							type="submit"
							disabled={loading}
							className="flex-1 h-[45px]"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("statusForm.saving")}
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									{status ? t("statusForm.update") : t("statusForm.create")}
								</>
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={loading}
							className="h-[45px] px-8"
						>
							{t("statusForm.cancel")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}



function DeleteStatusModal({ isOpen, onClose, status, onSuccess }) {
	const t = useTranslations("orders");
	const [confirmText, setConfirmText] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleDelete = async (e) => {
		e.preventDefault();
		setError("");

		// Validate confirmation text
		if (confirmText.trim().toLowerCase() !== status?.title.toLowerCase()) {
			setError(t("deleteStatus.errorMismatch"));
			return;
		}

		try {
			setLoading(true);
			await api.delete(`/orders/statuses/${status.id}`);
			toast.success(t("messages.statusDeleted"));
			onSuccess();
			handleClose();
		} catch (error) {
			console.error("Error deleting status:", error);
			toast.error(error.response?.data?.message || t("messages.errorDeletingStatus"));
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setConfirmText("");
		setError("");
		onClose();
	};

	if (!status) return null;
	const isConfirmValid = confirmText.trim().toLowerCase() === status?.title.toLowerCase();

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
							<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{t("deleteStatus.title")}
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
								{t("deleteStatus.subtitle")}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleDelete} className="space-y-4 pt-4">
					{/* Warning message */}
					<div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
						<p className="text-sm text-red-800 dark:text-red-200">
							{t("deleteStatus.warning")}
						</p>
						<p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">
							{t("deleteStatus.statusName")}: <span className="font-bold">{status?.title}</span>
						</p>
					</div>

					{/* Status details */}
					<div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
						<div className="flex items-center gap-3">
							<div
								className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
								style={{ borderColor: status?.iconBorderInline }}
							>
								<div
									className="w-4 h-4 rounded-full"
									style={{ backgroundColor: status?.bgInlineLight }}
								/>
							</div>
							<div className="flex-1">
								<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{status?.title}
								</p>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									{status?.count} {t("deleteStatus.ordersWithStatus")}
								</p>
							</div>
						</div>
					</div>

					{/* Confirmation input */}
					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("deleteStatus.confirmLabel")}
						</Label>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
							{t("deleteStatus.confirmHint")} <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{status?.name}</span>
						</p>
						<Input
							value={confirmText}
							onChange={(e) => {
								setConfirmText(e.target.value);
								setError("");
							}}
							placeholder={status?.name}
							className="rounded-xl h-[45px] bg-white dark:bg-slate-800 border-2"
							autoComplete="off"
						/>
						{error && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertTriangle size={12} />
								{error}
							</p>
						)}
					</div>

					{/* Action buttons */}
					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={loading}
							className="flex-1 h-[45px]"
						>
							{t("deleteStatus.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={loading || !isConfirmValid}
							className="flex-1 h-[45px] bg-red-600 hover:bg-red-700 text-white"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("deleteStatus.deleting")}
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									{t("deleteStatus.confirm")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function DeleteOrderModal({ isOpen, onClose, order, onSuccess }) {
	const t = useTranslations("orders");
	const [confirmText, setConfirmText] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleDelete = async (e) => {
		e.preventDefault();
		setError("");

		// Validate confirmation text
		if (confirmText.trim().toLowerCase() !== order?.orderNumber?.toLowerCase()) {
			setError(t("deleteOrder.errorMismatch"));
			return;
		}

		try {
			setLoading(true);
			await api.delete(`/orders/${order.id}`);
			toast.success(t("messages.orderDeleted"));
			onSuccess();
			handleClose();
		} catch (error) {
			console.error("Error deleting order:", error);
			toast.error(error.response?.data?.message || t("messages.errorDeletingOrder"));
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setConfirmText("");
		setError("");
		onClose();
	};

	if (!order) return null;
	const isConfirmValid = confirmText.trim().toLowerCase() === order?.orderNumber?.toLowerCase();

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
							<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{t("deleteOrder.title")}
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
								{t("deleteOrder.subtitle")}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleDelete} className="space-y-4 pt-4">
					{/* Warning message */}
					<div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
						<p className="text-sm text-red-800 dark:text-red-200">
							{t("deleteOrder.warning")}
						</p>
						<p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">
							{t("deleteOrder.orderNumber")}: <span className="font-bold">{order?.orderNumber}</span>
						</p>
					</div>

					{/* Order details */}
					<div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<p className="text-xs text-gray-500 dark:text-gray-400">{t("table.orderNumber")}</p>
								<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{order?.orderNumber}
								</p>
							</div>
							<div className="flex items-center justify-between">
								<p className="text-xs text-gray-500 dark:text-gray-400">{t("table.customerName")}</p>
								<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{order?.customerName}
								</p>
							</div>
							<div className="flex items-center justify-between">
								<p className="text-xs text-gray-500 dark:text-gray-400">{t("table.phoneNumber")}</p>
								<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{order?.phoneNumber}
								</p>
							</div>
						</div>
					</div>

					{/* Confirmation input */}
					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("deleteOrder.confirmLabel")}
						</Label>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
							{t("deleteOrder.confirmHint")} <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{order?.orderNumber}</span>
						</p>
						<Input
							value={confirmText}
							onChange={(e) => {
								setConfirmText(e.target.value);
								setError("");
							}}
							placeholder={order?.orderNumber}
							className="rounded-xl h-[45px] bg-white dark:bg-slate-800 border-2"
							autoComplete="off"
						/>
						{error && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertTriangle size={12} />
								{error}
							</p>
						)}
					</div>

					{/* Action buttons */}
					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={loading}
							className="flex-1 h-[45px]"
						>
							{t("deleteOrder.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={loading || !isConfirmValid}
							className="flex-1 h-[45px] bg-red-600 hover:bg-red-700 text-white"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("deleteOrder.deleting")}
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									{t("deleteOrder.confirm")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}