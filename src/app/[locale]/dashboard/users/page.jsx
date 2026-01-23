 

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
	ChevronLeft,
	Filter,
	RefreshCw,
	Eye,
	EyeOff,
	Trash2,
	Pencil,
	Plus,
	KeyRound,
	Copy,
	Send,
	UserPlus,
	ShieldAlert,
	CheckCircle2,
	Loader2,
} from "lucide-react";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import Button_ from "@/components/atoms/Button";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// ✅ shadcn select
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// ✅ shadcn dialog + alert dialog
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";

import api from "@/utils/api";
import { Switch } from "@/components/ui/switch";

/** =========================
 * WhatsApp Countries (same pattern)
 * ========================= */
export const COUNTRIES = [
	{
		key: "SA",
		nameAr: "السعودية",
		dialCode: "+966",
		phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
		placeholder: "5xxxxxxxx (مثال: 5XXXXXXXX)",
	},
	{
		key: "EG",
		nameAr: "مصر",
		dialCode: "+20",
		phone: { min: 10, max: 10, regex: /^(10|11|12|15)\d{8}$/ },
		placeholder: "10xxxxxxxx (مثال: 1101727657)",
	},
	{
		key: "AE",
		nameAr: "الإمارات",
		dialCode: "+971",
		phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
		placeholder: "5xxxxxxxx (مثال: 5XXXXXXXX)",
	},
	{
		key: "KW",
		nameAr: "الكويت",
		dialCode: "+965",
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholder: "xxxxxxxx (8 أرقام)",
	},
	{
		key: "QA",
		nameAr: "قطر",
		dialCode: "+974",
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholder: "xxxxxxxx (8 أرقام)",
	},
	{
		key: "BH",
		nameAr: "البحرين",
		dialCode: "+973",
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholder: "xxxxxxxx (8 أرقام)",
	},
	{
		key: "JO",
		nameAr: "الأردن",
		dialCode: "+962",
		phone: { min: 9, max: 9, regex: /^7\d{8}$/ },
		placeholder: "7xxxxxxxx (9 أرقام)",
	},
];

function digitsOnly(v) {
	return (v || "").replace(/\D/g, "");
}

function validatePhone(rawDigits, country) {
	const value = digitsOnly(rawDigits);
	if (!value) return "يرجى إدخال رقم جوال صحيح";

	if (value.length < country.phone.min || value.length > country.phone.max) {
		if (country.phone.min === country.phone.max) {
			return `رقم الجوال يجب أن يكون ${country.phone.min} رقمًا`;
		}
		return `رقم الجوال يجب أن يكون بين ${country.phone.min} و ${country.phone.max} رقمًا`;
	}

	if (
		value.length === country.phone.max &&
		country.phone.regex &&
		!country.phone.regex.test(value)
	) {
		return "يرجى إدخال رقم جوال صحيح حسب الدولة المختارة";
	}

	return "";
}

function getApiMsg(err, fallback = "Request failed") {
	const msg =
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.message ||
		fallback;
	return Array.isArray(msg) ? msg.join(", ") : msg;
}

function copyToClipboard(text) {
	try {
		navigator.clipboard.writeText(text);
	} catch { }
}

function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function statusBadge(isActive) {
	return isActive ? (
		<Badge className="rounded-md bg-[#F0FDF4] text-[#22C55E] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-400">
			Active
		</Badge>
	) : (
		<Badge className="rounded-md bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEF2F2] dark:bg-red-950/30 dark:text-red-400">
			Inactive
		</Badge>
	);
}

/** =========================
 * Toolbar
 * ========================= */
function UsersTableToolbar({
	t,
	searchValue,
	onSearchChange,
	onExport,
	onRefresh,
	onToggleFilters,
	isFiltersOpen,
	onCreate,
	loading,
}) {
	const ph = t.has("toolbar.searchPlaceholder")
		? t("toolbar.searchPlaceholder")
		: "Search by name / email";

	return (
		<div className="flex items-center justify-between gap-4 flex-wrap">
			<div className="relative w-[300px] focus-within:w-[350px] transition-all duration-300">
				<svg
					className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M15 4.3125H10.5C10.1925 4.3125 9.9375 4.0575 9.9375 3.75C9.9375 3.4425 10.1925 3.1875 10.5 3.1875H15C15.3075 3.1875 15.5625 3.4425 15.5625 3.75C15.5625 4.0575 15.3075 4.3125 15 4.3125Z"
						fill="#A6ACBD"
					/>
					<path
						d="M12.75 6.5625H10.5C10.1925 6.5625 9.9375 6.3075 9.9375 6C9.9375 5.6925 10.1925 5.4375 10.5 5.4375H12.75C13.0575 5.4375 13.3125 5.6925 13.3125 6C13.3125 6.3075 13.0575 6.5625 12.75 6.5625Z"
						fill="#A6ACBD"
					/>
					<path
						d="M8.625 16.3125C4.3875 16.3125 0.9375 12.8625 0.9375 8.625C0.9375 4.3875 4.3875 0.9375 8.625 0.9375C8.9325 0.9375 9.1875 1.1925 9.1875 1.5C9.1875 1.8075 8.9325 2.0625 8.625 2.0625C5.0025 2.0625 2.0625 5.01 2.0625 8.625C2.0625 12.24 5.0025 15.1875 8.625 15.1875C12.2475 15.1875 15.1875 12.24 15.1875 8.625C15.1875 8.3175 15.4425 8.0625 15.75 8.0625C16.0575 8.0625 16.3125 8.3175 16.3125 8.625C16.3125 12.8625 12.8625 16.3125 8.625 16.3125Z"
						fill="#A6ACBD"
					/>
					<path
						d="M16.5001 17.0626C16.3576 17.0626 16.2151 17.0101 16.1026 16.8976L14.6026 15.3976C14.3851 15.1801 14.3851 14.8201 14.6026 14.6026C14.8201 14.3851 15.1801 14.3851 15.3976 14.6026L16.8976 16.1026C17.1151 16.3201 17.1151 16.6801 16.8976 16.8976C16.7851 17.0101 16.6426 17.0626 16.5001 17.0626Z"
						fill="#A6ACBD"
					/>
				</svg>

				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={ph}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 placeholder:text-gray-400 dark:placeholder:text-slate-400 text-gray-700 dark:text-slate-100"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button_
					onClick={onCreate}
					size="sm"
					label={t.has("actions.createUser") ? t("actions.createUser") : "Create user"}
					tone="purple"
					variant="solid"
					icon={<UserPlus size={18} className="text-white" />}
				/>

				<Button
					variant="outline"
					className={cn(
						" bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-1 !px-4 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800",
						isFiltersOpen && "border-[rgb(var(--primary))]/50"
					)}
					onClick={onToggleFilters}
				>
					<Filter size={18} className="text-[#A7A7A7] rtl:mr-[-3px] ltr:ml-[-3px]" />
					{t.has("toolbar.filter") ? t("toolbar.filter") : "Filter"}
				</Button>

				<Button
					variant="outline"
					className=" bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-1 !px-4 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800"
					onClick={onRefresh}
					disabled={loading}
				>
					{loading ? <Loader2 size={16} className="animate-spin text-[#A7A7A7]" /> : <RefreshCw size={18} className=" text-[#A7A7A7] rtl:mr-[-3px] ltr:ml-[-3px]" />}
					{t.has("toolbar.refresh") ? t("toolbar.refresh") : "Refresh"}
				</Button>

				<Button
					variant="outline"
					className=" bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-1 !px-4 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800"
					onClick={onExport}
				>
					<Plus size={18} className="text-[#A7A7A7]" />
					{t.has("toolbar.export") ? t("toolbar.export") : "Export"}
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
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
					<div className="space-y-3">
						<h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
							{t.has("filters.basic") ? t("filters.basic") : "Basic"}
						</h4>
						<div>
							<Label className="text-xs text-gray-500 dark:text-slate-400">
								{t.has("filters.role") ? t("filters.role") : "Role contains"}
							</Label>
							<Input
								value={value.role || ""}
								onChange={(e) => onChange({ ...value, role: e.target.value })}
								placeholder={t.has("filters.rolePlaceholder") ? t("filters.rolePlaceholder") : "ADMIN / USER / SUPER_ADMIN"}
								className="rounded-full h-[40px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
							/>
						</div>
					</div>

					<div className="space-y-3">
						<h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
							{t.has("filters.status") ? t("filters.status") : "Status"}
						</h4>
						<div>
							<Label className="text-xs text-gray-500 dark:text-slate-400">
								{t.has("filters.active") ? t("filters.active") : "Active"}
							</Label>
							<Input
								value={value.active || ""}
								onChange={(e) => onChange({ ...value, active: e.target.value })}
								placeholder={t.has("filters.activePlaceholder") ? t("filters.activePlaceholder") : "all / true / false"}
								className="rounded-full h-[40px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
							/>
						</div>
					</div>

					<div className="space-y-3">
						<h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
							{t.has("filters.admin") ? t("filters.admin") : "Admin Ownership"}
						</h4>
						<div>
							<Label className="text-xs text-gray-500 dark:text-slate-400">
								{t.has("filters.adminId") ? t("filters.adminId") : "Admin ID"}
							</Label>
							<Input
								value={value.adminId || ""}
								onChange={(e) => onChange({ ...value, adminId: e.target.value })}
								placeholder={t.has("filters.adminIdPlaceholder") ? t("filters.adminIdPlaceholder") : "adminId (optional)"}
								className="rounded-full h-[40px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
							/>
						</div>
					</div>
				</div>

				<div className="flex justify-end">
					<Button_
						onClick={onApply}
						size="sm"
						label={t.has("filters.apply") ? t("filters.apply") : "Apply"}
						tone="purple"
						variant="solid"
						icon={<Filter size={18} className="text-white" />}
					/>
				</div>
			</div>
		</motion.div>
	);
}

/** =========================
 * Page
 * ========================= */
export default function SuperAdminUsersPage() {
	const t = useTranslations("users");

	const [activeTab, setActiveTab] = useState("all"); // all|active|inactive
	const [search, setSearch] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState({ role: "", active: "all", adminId: "" });

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [apiMsg, setApiMsg] = useState("");

	const [users, setUsers] = useState([]);

	const [rolesLoading, setRolesLoading] = useState(false);
	const [roles, setRoles] = useState([]);

	// ✅ NEW: Plans
	const [plansLoading, setPlansLoading] = useState(false);
	const [plans, setPlans] = useState([]);

	// ✅ server pagination
	const [pagination, setPagination] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 10,
	});

	// ✅ server stats
	const [serverStats, setServerStats] = useState({ total: 0, active: 0, inactive: 0 });

	// Modals state
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deactivateOpen, setDeactivateOpen] = useState(false);
	const [credOpen, setCredOpen] = useState(false);
	const [waOpen, setWaOpen] = useState(false);

	const [selectedUser, setSelectedUser] = useState(null);
	const [credentials, setCredentials] = useState(null); // {userId,email,password}

	const tabs = useMemo(() => {
		const allLabel = t.has("tabs.all") ? t("tabs.all") : "All";
		const activeLabel = t.has("tabs.active") ? t("tabs.active") : "Active";
		const inactiveLabel = t.has("tabs.inactive") ? t("tabs.inactive") : "Inactive";
		return [
			{ id: "all", label: allLabel },
			{ id: "active", label: activeLabel },
			{ id: "inactive", label: inactiveLabel },
		];
	}, [t]);

	async function fetchUsers({ page, per_page } = {}) {
		setLoading(true);
		setError("");
		setApiMsg("");

		const params = {
			page: page ?? pagination.current_page,
			limit: per_page ?? pagination.per_page,
			tab: activeTab,
			search,
			role: filters.role,
			active: filters.active,
			adminId: filters.adminId,
		};

		try {
			const res = await api.get("/users/super-admin/list", { params });
			const data = res?.data || {};

			setUsers(Array.isArray(data.records) ? data.records : []);
			setPagination({
				total_records: Number(data.total_records ?? 0),
				current_page: Number(data.current_page ?? params.page ?? 1),
				per_page: Number(data.per_page ?? params.limit ?? 10),
			});

			setServerStats(data.stats || { total: 0, active: 0, inactive: 0 });
		} catch (e) {
			setError(getApiMsg(e, "Failed to load users"));
		} finally {
			setLoading(false);
		}
	}

	async function fetchRoles() {
		setRolesLoading(true);
		try {
			const res = await api.get("/lookups/roles");
			const raw = res?.data || [];
			const normalized = raw
				.map((r) => ({
					id: r?.id ?? r?.value ?? r?._id,
					name: r?.name ?? r?.label ?? r?.title ?? String(r?.id ?? ""),
				}))
				.filter((r) => r.id != null);

			setRoles(normalized);
		} catch (e) {
			console.warn("Failed to load roles", e);
		} finally {
			setRolesLoading(false);
		}
	}

	async function fetchPlans() {
		setPlansLoading(true);
		try {
			const res = await api.get("/plans");
			const raw = res?.data || [];
			const normalized = raw
				.map((p) => ({
					id: p?.id ?? p?.value ?? p?._id,
					name: p?.name ?? p?.label ?? p?.title ?? String(p?.id ?? ""),
					duration: p?.duration,
					price: p?.price,
				}))
				.filter((p) => p.id != null);

			setPlans(normalized);
		} catch (e) {
			console.warn("Failed to load plans", e);
		} finally {
			setPlansLoading(false);
		}
	}

	useEffect(() => {
		fetchUsers({ page: 1, per_page: pagination.per_page });
		fetchRoles();
		fetchPlans();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// debounce search
	useEffect(() => {
		const h = setTimeout(() => {
			fetchUsers({ page: 1, per_page: pagination.per_page });
		}, 400);
		return () => clearTimeout(h);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search]);

	// tab change
	useEffect(() => {
		fetchUsers({ page: 1, per_page: pagination.per_page });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	function applyFilters() {
		fetchUsers({ page: 1, per_page: pagination.per_page });
	}

	function handlePageChange({ page, per_page }) {
		fetchUsers({ page, per_page });
	}

	const stats = useMemo(() => {
		const total = Number(serverStats?.total ?? 0);
		const active = Number(serverStats?.active ?? 0);
		const inactive = Number(serverStats?.inactive ?? 0);

		return [
			{
				title: t.has("stats.total") ? t("stats.total") : "Total users",
				value: String(total),
				icon: ShieldAlert,
				bg: "bg-[#F3F6FF] dark:bg-[#0B1220]",
				iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]",
				iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]",
			},
			{
				title: t.has("stats.active") ? t("stats.active") : "Active",
				value: String(active),
				icon: CheckCircle2,
				bg: "bg-[#F0FDF4] dark:bg-[#052E16]",
				iconColor: "text-[#22C55E] dark:text-[#4ADE80]",
				iconBorder: "border-[#22C55E] dark:border-[#4ADE80]",
			},
			{
				title: t.has("stats.inactive") ? t("stats.inactive") : "Inactive",
				value: String(inactive),
				icon: Trash2,
				bg: "bg-[#FEF2F2] dark:bg-[#2A0808]",
				iconColor: "text-[#EF4444] dark:text-[#F87171]",
				iconBorder: "border-[#EF4444] dark:border-[#F87171]",
			},
		];
	}, [serverStats, t]);

	async function handleExport() {
		setError("");
		try {
			const res = await api.get("/users/super-admin/export/csv", {
				params: {
					tab: activeTab,
					search,
					role: filters.role,
					active: filters.active,
					adminId: filters.adminId,
				},
				responseType: "blob",
			});
			downloadBlob(res.data, "users.csv");
		} catch (e) {
			setError(getApiMsg(e, "Failed to export"));
		}
	}

	const columns = useMemo(() => {
		return [
			{
				key: "id",
				header: t.has("table.id") ? t("table.id") : "ID",
				className: "text-gray-700 dark:text-slate-200 font-semibold",
			},
			{
				key: "name",
				header: t.has("table.name") ? t("table.name") : "Name",
				className: "text-gray-700 dark:text-slate-200 font-semibold",
			},
			{
				key: "email",
				header: t.has("table.email") ? t("table.email") : "Email",
				className: "text-gray-600 dark:text-slate-200",
				cell: (row) => <span dir="ltr" className="font-en">{row.email}</span>,
			},
			{
				key: "role",
				header: t.has("table.role") ? t("table.role") : "Role",
				cell: (row) => (
					<Badge className="rounded-md bg-[#F0F9FF] text-[#0EA5E9] hover:bg-[#F0F9FF] dark:bg-cyan-950/30 dark:text-cyan-400">
						{row.role?.name || "-"}
					</Badge>
				),
			},
			{
				key: "plan",
				header: t.has("table.plan") ? t("table.plan") : "Plan",
				cell: (row) => (
					<Badge className="rounded-md bg-[#FFF7ED] text-[#F97316] hover:bg-[#FFF7ED] dark:bg-orange-950/30 dark:text-orange-400">
						{row.plan?.name || "-"}
					</Badge>
				),
			},

			// ✅ NEW: Admin owner info (super admin needs it)
			{
				key: "admin",
				header: t.has("table.ownerAdmin") ? t("table.ownerAdmin") : "Owner Admin",
				cell: (row) => {
					if (!row.admin) return <span className="text-gray-500">-</span>;
					return (
						<div className="text-sm">
							<div className="font-semibold text-gray-800 dark:text-slate-100">
								{row.admin.name || `#${row.admin.id}`}
							</div>
							<div dir="ltr" className="font-en text-xs text-gray-500 dark:text-slate-400">
								{row.admin.email || ""}
							</div>
						</div>
					);
				},
			},

			// createdAt if exists
			{
				key: "createdAt",
				header: t.has("table.createdAt") ? t("table.createdAt") : "Created",
				cell: (row) => {
					if (!row.createdAt) return <span className="text-gray-500">-</span>;
					const d = new Date(row.createdAt);
					return (
						<span className="text-gray-600 dark:text-slate-200" dir="ltr">
							{isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
						</span>
					);
				},
			},

			{
				key: "isActive",
				header: t.has("table.status") ? t("table.status") : "Status",
				cell: (row) => statusBadge(row.isActive),
			},
			{
				key: "credentials",
				header: t.has("table.credentials") ? t("table.credentials") : "Credentials",
				cell: (row) => (
					<div className="flex items-center gap-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.06 }}
										whileTap={{ scale: 0.95 }}
										onClick={async () => {
											setLoading(true);
											setError("");
											setApiMsg("");
											try {
												const res = await api.post(`/users/${row.id}/reset-password`, {});
												setCredentials({
													userId: res.data.userId,
													email: res.data.email,
													password: res.data.password,
												});
												setSelectedUser(row);
												setCredOpen(true);
											} catch (e) {
												setError(getApiMsg(e, "Failed to get password"));
											} finally {
												setLoading(false);
											}
										}}
										className="w-9 h-9 rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-700 hover:text-white transition-all flex items-center justify-center dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
										title="Reset & show password"
									>
										<KeyRound size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>
									{t.has("actions.resetAndShow") ? t("actions.resetAndShow") : "Reset & show password"}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.06 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => {
											setSelectedUser(row);
											setWaOpen(true);
										}}
										className="w-9 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center dark:bg-emerald-950/30 dark:hover:bg-emerald-600"
									>
										<Send size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>
									{t.has("actions.sendWhatsapp") ? t("actions.sendWhatsapp") : "Send via WhatsApp"}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				),
			},
			{
				key: "options",
				header: t.has("table.options") ? t("table.options") : "Options",
				cell: (row) => (
					<div className="flex items-center gap-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.06 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => {
											setSelectedUser(row);
											setEditOpen(true);
										}}
										className="w-9 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center dark:bg-purple-950/30 dark:hover:bg-purple-600"
									>
										<Pencil size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t.has("actions.edit") ? t("actions.edit") : "Edit"}</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.06 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => {
											setSelectedUser(row);
											setDeactivateOpen(true);
										}}
										className="w-9 h-9 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center dark:bg-red-950/30 dark:hover:bg-red-600"
									>
										<Trash2 size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>
									{t.has("actions.deactivate") ? t("actions.deactivate") : "Deactivate"}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				),
			},
		];
	}, [t]);

	return (
		<div className="min-h-screen p-6">
			{/* Header */}
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t.has("breadcrumb.home") ? t("breadcrumb.home") : "Home"}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-[rgb(var(--primary))]">
							{t.has("breadcrumb.users") ? t("breadcrumb.users") : "Users"}
						</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
					</div>

					<div className="flex items-center gap-4">
						<Button_
							size="sm"
							label={t.has("actions.refresh") ? t("actions.refresh") : "Refresh"}
							tone="white"
							variant="solid"
							icon={<RefreshCw size={18} className="text-[#A7A7A7]" />}
							onClick={() => fetchUsers({ page: 1, per_page: pagination.per_page })}
						/>

						<Button_
							size="sm"
							label={t.has("actions.createUser") ? t("actions.createUser") : "Create user"}
							tone="purple"
							variant="solid"
							icon={<UserPlus size={18} className="text-white" />}
							onClick={() => setCreateOpen(true)}
						/>
					</div>
				</div>

				{/* Stats */}
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

				{/* Tabs */}
				<div className="mt-4">
					<SwitcherTabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
				</div>
			</div>

			{/* Messages */}
			{error && (
				<div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-right">
					{error}
				</div>
			)}
			{apiMsg && (
				<div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 text-right">
					{apiMsg}
				</div>
			)}

			{/* Table Card */}
			<div className="bg-card rounded-sm">
				<UsersTableToolbar
					t={t}
					searchValue={search}
					onSearchChange={setSearch}
					onExport={handleExport}
					onRefresh={() => fetchUsers({ page: 1, per_page: pagination.per_page })}
					isFiltersOpen={filtersOpen}
					onToggleFilters={() => setFiltersOpen((v) => !v)}
					onCreate={() => setCreateOpen(true)}
					loading={loading}
				/>

				<AnimatePresence>
					{filtersOpen && (
						<FiltersPanel
							t={t}
							value={filters}
							onChange={setFilters}
							onApply={() => applyFilters()}
						/>
					)}
				</AnimatePresence>

				<div className="mt-4">
					<DataTable
						columns={columns}
						data={users}
						isLoading={loading}
						pagination={{
							total_records: pagination.total_records,
							current_page: pagination.current_page,
							per_page: pagination.per_page,
						}}
						onPageChange={({ page, per_page }) => handlePageChange({ page, per_page })}
						emptyState={loading ? (t.has("loading") ? t("loading") : "Loading...") : (t.has("empty") ? t("empty") : "No users")}
					/>
				</div>
			</div>

			{/* ✅ Dialogs (unchanged logic) */}
			<CreateUserDialog
				t={t}
				open={createOpen}
				onOpenChange={setCreateOpen}
				roles={roles}
				rolesLoading={rolesLoading}
				plans={plans}
				plansLoading={plansLoading}
				onCreated={async (payload) => {
					setLoading(true);
					setError("");
					setApiMsg("");
					try {
						const res = await api.post("/users/admin-create", payload);
						setApiMsg(t.has("messages.userCreated") ? t("messages.userCreated") : "User created successfully");
						setCredentials({
							userId: res.data?.user?.id,
							email: res.data?.credentials?.email,
							password: res.data?.credentials?.password,
						});
						setSelectedUser(res.data?.user || null);
						setCredOpen(true);
						setCreateOpen(false);
						await fetchUsers({ page: 1, per_page: pagination.per_page });
					} catch (e) {
						setError(getApiMsg(e, "Failed to create user"));
					} finally {
						setLoading(false);
					}
				}}
			/>

			<EditUserDialog
				t={t}
				open={editOpen}
				onOpenChange={setEditOpen}
				user={selectedUser}
				roles={roles}
				rolesLoading={rolesLoading}
				plans={plans}
				plansLoading={plansLoading}
				onSaved={async (patch) => {
					if (!selectedUser?.id) return;
					setLoading(true);
					setError("");
					setApiMsg("");
					try {
						await api.patch(`/users/${selectedUser.id}`, patch);
						setApiMsg(t.has("messages.userUpdated") ? t("messages.userUpdated") : "User updated successfully");
						setEditOpen(false);
						await fetchUsers({ page: pagination.current_page, per_page: pagination.per_page });
					} catch (e) {
						setError(getApiMsg(e, "Failed to update user"));
					} finally {
						setLoading(false);
					}
				}}
			/>

			<DeactivateAlertDialog
				t={t}
				open={deactivateOpen}
				onOpenChange={setDeactivateOpen}
				user={selectedUser}
				onConfirm={async () => {
					if (!selectedUser?.id) return;
					setLoading(true);
					setError("");
					setApiMsg("");
					try {
						await api.post(`/users/${selectedUser.id}/deactivate`);
						setApiMsg(t.has("messages.userDeactivated") ? t("messages.userDeactivated") : "User deactivated");
						setDeactivateOpen(false);
						await fetchUsers({ page: pagination.current_page, per_page: pagination.per_page });
					} catch (e) {
						setError(getApiMsg(e, "Failed to deactivate user"));
					} finally {
						setLoading(false);
					}
				}}
			/>

			<CredentialsDialog
				t={t}
				open={credOpen}
				onOpenChange={setCredOpen}
				user={selectedUser}
				credentials={credentials}
				onSendWhatsapp={() => {
					setCredOpen(false);
					setWaOpen(true);
				}}
			/>

			<WhatsappDialog
				t={t}
				open={waOpen}
				onOpenChange={setWaOpen}
				user={selectedUser}
				credentials={credentials}
			/>
		</div>
	);
}

/** =========================
 * Dialogs (same as your file)
 * ========================= */

function CreateUserDialog({
	t,
	open,
	onOpenChange,
	onCreated,
	roles,
	rolesLoading,
	plans,
	plansLoading,
}) {
	const [form, setForm] = useState({
		name: "",
		email: "",
		roleId: "",
		planId: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (!open) {
			setForm({ name: "", email: "", roleId: "", planId: "", password: "" });
			setShowPassword(false);
		}
	}, [open]);

	const roleOptions = Array.isArray(roles) ? roles : [];
	const planOptions = Array.isArray(plans) ? plans : [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl rounded-2xl">
				<DialogHeader className="text-right">
					<DialogTitle>{t.has("create.title") ? t("create.title") : "Create new user"}</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.name") ? t("fields.name") : "Name"}
						</Label>
						<Input
							value={form.name}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							className="rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
							placeholder={t.has("placeholders.name") ? t("placeholders.name") : "Full name"}
						/>
					</div>

					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.email") ? t("fields.email") : "Email"}
						</Label>
						<Input
							value={form.email}
							onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
							className=" font-en rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
							placeholder={t.has("placeholders.email") ? t("placeholders.email") : "user@email.com"}
						/>
					</div>

					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.role") ? t("fields.role") : "Role"}
						</Label>
						<div className="mt-1">
							<Select
								value={form.roleId}
								onValueChange={(v) => setForm((p) => ({ ...p, roleId: v }))}
								disabled={rolesLoading}
							>
								<SelectTrigger className="rounded-full !w-full !h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
									<SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select role"} />
								</SelectTrigger>
								<SelectContent className="max-h-72">
									{roleOptions.map((r) => (
										<SelectItem key={String(r.id)} value={String(r.id)}>
											{r.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.plan") ? t("fields.plan") : "Plan"}
						</Label>
						<div className="mt-1">
							<Select
								value={form.planId}
								onValueChange={(v) => setForm((p) => ({ ...p, planId: v }))}
								disabled={plansLoading}
							>
								<SelectTrigger className="rounded-full !w-full !h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
									<SelectValue placeholder={plansLoading ? "Loading plans..." : "Select plan"} />
								</SelectTrigger>
								<SelectContent className="max-h-72">
									<SelectItem value="none">{t.has("fields.noPlan") ? t("fields.noPlan") : "No plan"}</SelectItem>
									{planOptions.map((p) => (
										<SelectItem key={String(p.id)} value={String(p.id)}>
											{p.name}
											{p.duration ? ` (${p.duration})` : ""}
											{p.price != null ? ` — ${p.price}` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.passwordOptional") ? t("fields.passwordOptional") : "Password (optional)"}
						</Label>
						<div className="relative mt-1">
							<Input
								type={showPassword ? "text" : "password"}
								value={form.password}
								onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
								className="rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rtl:pr-4 ltr:pl-4"
								placeholder={t.has("placeholders.passwordOptional") ? t("placeholders.passwordOptional") : "Leave empty to auto-generate"}
							/>
							<button
								type="button"
								onClick={() => setShowPassword((v) => !v)}
								className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								title="Toggle"
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-end gap-2">
					<Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
						{t.has("actions.cancel") ? t("actions.cancel") : "Cancel"}
					</Button>
					<Button
						className="rounded-full btn-primary1"
						onClick={() => {
							const payload = {
								name: form.name.trim(),
								email: form.email.trim(),
								roleId: Number(form.roleId),
								planId: form.planId && form.planId !== "none" ? Number(form.planId) : undefined,
								password: form.password?.trim() || undefined,
							};
							onCreated?.(payload);
						}}
						disabled={!form.name.trim() || !form.email.trim() || !form.roleId}
					>
						<span className="flex items-center gap-2">
							<UserPlus size={18} />
							{t.has("actions.create") ? t("actions.create") : "Create"}
						</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function EditUserDialog({
	t,
	open,
	onOpenChange,
	user,
	onSaved,
	roles,
	rolesLoading,
	plans,
	plansLoading,
}) {
	const [form, setForm] = useState({
		name: "",
		email: "",
		roleId: "",
		planId: "",
		isActive: true,
	});

	useEffect(() => {
		if (open && user) {
			setForm({
				name: user.name || "",
				email: user.email || "",
				roleId: user.role?.id ? String(user.role.id) : "",
				planId: user.plan?.id ? String(user.plan.id) : "",
				isActive: typeof user.isActive === "boolean" ? user.isActive : true,
			});
		}
		if (!open) setForm({ name: "", email: "", roleId: "", planId: "", isActive: true });
	}, [open, user]);

	const roleOptions = Array.isArray(roles) ? roles : [];
	const planOptions = Array.isArray(plans) ? plans : [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl rounded-2xl">
				<DialogHeader className="text-right">
					<DialogTitle>{t.has("edit.title") ? t("edit.title") : "Edit user"}</DialogTitle>
					<DialogDescription>{user ? `#${user.id} — ${user.email}` : ""}</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.name") ? t("fields.name") : "Name"}
						</Label>
						<Input
							value={form.name}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							className="rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
						/>
					</div>

					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.email") ? t("fields.email") : "Email"}
						</Label>
						<Input
							value={form.email}
							onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
							className="rounded-full font-en h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
						/>
					</div>

					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.role") ? t("fields.role") : "Role"}
						</Label>
						<div className="mt-1">
							<Select
								value={form.roleId}
								onValueChange={(v) => setForm((p) => ({ ...p, roleId: v }))}
								disabled={rolesLoading}
							>
								<SelectTrigger className="rounded-full !w-full !h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
									<SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select role"} />
								</SelectTrigger>
								<SelectContent className="max-h-72">
									{roleOptions.map((r) => (
										<SelectItem key={String(r.id)} value={String(r.id)}>
											{r.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">
							{t.has("fields.plan") ? t("fields.plan") : "Plan"}
						</Label>
						<div className="mt-1">
							<Select
								value={form.planId}
								onValueChange={(v) => setForm((p) => ({ ...p, planId: v }))}
								disabled={plansLoading}
							>
								<SelectTrigger className="rounded-full !w-full !h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
									<SelectValue placeholder={plansLoading ? "Loading plans..." : "Select plan"} />
								</SelectTrigger>
								<SelectContent className="max-h-72">
									<SelectItem value="none">{t.has("fields.noPlan") ? t("fields.noPlan") : "No plan"}</SelectItem>
									{planOptions.map((p) => (
										<SelectItem key={String(p.id)} value={String(p.id)}>
											{p.name}
											{p.duration ? ` (${p.duration})` : ""}
											{p.price != null ? ` — ${p.price}` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-800/40 p-4 mt-1">
						<div className="text-right">
							<Label className="text-sm text-gray-700 dark:text-slate-200">
								{t.has("fields.isActive") ? t("fields.isActive") : "Active"}
							</Label>
						</div>

						<Switch
							checked={!!form.isActive}
							onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
						/>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-end gap-2">
					<Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
						{t.has("actions.cancel") ? t("actions.cancel") : "Cancel"}
					</Button>
					<Button
						className="rounded-full btn-primary1"
						onClick={() => {
							const patch = {};
							if (form.name.trim()) patch.name = form.name.trim();
							if (form.email.trim()) patch.email = form.email.trim();
							if (form.roleId) patch.roleId = Number(form.roleId);

							if (!form.planId || form.planId === "none") patch.planId = null;
							else patch.planId = Number(form.planId);

							patch.isActive = !!form.isActive;
							onSaved?.(patch);
						}}
					>
						<span className="flex items-center gap-2">
							<Pencil size={18} />
							{t.has("actions.save") ? t("actions.save") : "Save"}
						</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function DeactivateAlertDialog({ t, open, onOpenChange, user, onConfirm }) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="rounded-2xl">
				<AlertDialogHeader className="text-right">
					<AlertDialogTitle>{t.has("deactivate.title") ? t("deactivate.title") : "Deactivate user"}</AlertDialogTitle>
					<AlertDialogDescription>
						{user ? `${user.name} — ${user.email}` : ""}
						<div className="mt-2 text-sm">
							{t.has("deactivate.desc") ? t("deactivate.desc") : "This will set isActive=false. The user will not be able to login."}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="mt-4 flex items-center justify-end gap-2">
					<AlertDialogCancel className="rounded-full">{t.has("actions.cancel") ? t("actions.cancel") : "Cancel"}</AlertDialogCancel>
					<AlertDialogAction
						className="rounded-full bg-red-600 hover:bg-red-700 text-white"
						onClick={onConfirm}
					>
						<span className="flex items-center gap-2">
							<Trash2 size={18} />
							{t.has("actions.deactivate") ? t("actions.deactivate") : "Deactivate"}
						</span>
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function CredentialsDialog({ t, open, onOpenChange, user, credentials, onSendWhatsapp }) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		if (!open) setShow(false);
	}, [open]);

	const email = credentials?.email || user?.email || "";
	const password = credentials?.password || "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl rounded-2xl">
				<DialogHeader className="text-right">
					<DialogTitle>{t.has("credentials.title") ? t("credentials.title") : "User credentials"}</DialogTitle>
					<DialogDescription>
						{t.has("credentials.subtitle") ? t("credentials.subtitle") : "These are the latest credentials generated by admin-create / reset-password"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 p-4">
						<div className="flex items-center justify-between gap-2">
							<div className="text-xs text-gray-500 dark:text-slate-400">Email</div>
							<Button variant="outline" className="rounded-full" onClick={() => copyToClipboard(email)} disabled={!email}>
								<Copy size={16} />
							</Button>
						</div>
						<div className="mt-1 font-en text-sm text-gray-900 dark:text-white" dir="ltr">
							{email || "-"}
						</div>
					</div>

					<div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 p-4">
						<div className="flex items-center justify-between gap-2">
							<div className="text-xs text-gray-500 dark:text-slate-400">
								{t.has("credentials.password") ? t("credentials.password") : "Password"}
							</div>
							<div className="flex items-center gap-2">
								<Button variant="outline" className="rounded-full" onClick={() => setShow((v) => !v)} disabled={!password}>
									{show ? <EyeOff size={16} /> : <Eye size={16} />}
								</Button>
								<Button
									variant="outline"
									className="rounded-full"
									onClick={() => copyToClipboard(password)}
									disabled={!password}
								>
									<Copy size={16} />
								</Button>
							</div>
						</div>

						<div className="mt-1 font-en text-sm text-gray-900 dark:text-white" dir="ltr">
							{password ? (show ? password : "••••••••••") : "-"}
						</div>

						<div className="mt-2 text-[11px] text-gray-500 dark:text-slate-400 text-right">
							{t.has("credentials.note")
								? t("credentials.note")
								: "Note: your backend returns password only at creation/reset. There is no way to read the old password."}
						</div>
					</div>

					<div className="flex items-center justify-end gap-2">
						<Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
							{t.has("actions.close") ? t("actions.close") : "Close"}
						</Button>
						<Button className="rounded-full btn-primary1" onClick={onSendWhatsapp} disabled={!email || !password}>
							<span className="flex items-center gap-2">
								<Send size={18} />
								{t.has("actions.sendWhatsapp") ? t("actions.sendWhatsapp") : "Send via WhatsApp"}
							</span>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function WhatsappDialog({ t, open, onOpenChange, user, credentials }) {
	const [countryKey, setCountryKey] = useState("EG");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [error, setError] = useState("");
	const [includePassword, setIncludePassword] = useState(true);

	useEffect(() => {
		if (!open) {
			setCountryKey("EG");
			setPhoneNumber("");
			setError("");
			setIncludePassword(true);
		}
	}, [open]);



	const selectedCountry = useMemo(() => {
		return COUNTRIES.find((c) => c.key === countryKey) || COUNTRIES[0];
	}, [countryKey]);

	const email = credentials?.email || user?.email || "";
	const password = credentials?.password || "";

	const message = useMemo(() => {
		const lines = [];
		lines.push("Account details:");
		if (user?.name) lines.push(`Name: ${user.name}`);
		if (email) lines.push(`Email: ${email}`);
		if (includePassword && password) lines.push(`Password: ${password}`);
		lines.push("");
		lines.push("Please login and change your password after first login.");
		return lines.join("\n");
	}, [user, email, password, includePassword]);

	const isValidPhone = useMemo(
		() => !validatePhone(phoneNumber, selectedCountry),
		[phoneNumber, selectedCountry]
	);

	const waLink = useMemo(() => {
		const dial = digitsOnly(selectedCountry.dialCode);
		const p = digitsOnly(phoneNumber);
		const full = `${dial}${p}`;
		const text = encodeURIComponent(message);
		return `https://wa.me/${full}?text=${text}`;
	}, [selectedCountry, phoneNumber, message]);

	const handleCountryChange = (newKey) => {
		setCountryKey(newKey);
		const newCountry = COUNTRIES.find((c) => c.key === newKey) || COUNTRIES[0];
		const msg = validatePhone(phoneNumber, newCountry);
		if (phoneNumber.length > 0) setError(msg);
		else setError("");
	};

	const handlePhoneChange = (e) => {
		const value = digitsOnly(e.target.value);
		setPhoneNumber(value);
		const msg = validatePhone(value, selectedCountry);
		if (value.length > 0) setError(msg);
		else setError("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl rounded-2xl">
				<DialogHeader className="text-right">
					<DialogTitle>{t("whatsapp.title") || "Send via WhatsApp"}</DialogTitle>
					<DialogDescription>{t("whatsapp.subtitle") || "اختر الدولة وأدخل رقم الواتساب"}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="text-xs text-gray-500 dark:text-slate-400">{t("whatsapp.phone") || "Phone"}</Label>

						<div className="flex gap-2">
							<div className="w-44">
								<Select value={countryKey} onValueChange={handleCountryChange}>
									<SelectTrigger className="!w-full !h-[42px] rounded-full bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-bold text-[rgb(var(--primary))]">
										<SelectValue placeholder="اختر الدولة" />
									</SelectTrigger>
									<SelectContent className="max-h-72">
										{COUNTRIES.map((c) => (
											<SelectItem key={c.key} value={c.key}>
												{c.dialCode} — {c.nameAr}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Input
								placeholder={selectedCountry.placeholder}
								dir="ltr"
								value={phoneNumber}
								onChange={handlePhoneChange}
								className={cn(
									"flex-1 rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-en",
									error ? "border-red-300 focus-visible:ring-red-300" : ""
								)}
								inputMode="numeric"
							/>
						</div>

						{error && (
							<div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-right">
								{error}
							</div>
						)}
					</div>

					<div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 p-4">
						<div className="text-sm text-gray-700 dark:text-slate-200 text-right">
							{t("whatsapp.includePassword") || "Include password in message"}
						</div>
						<button
							onClick={() => setIncludePassword((v) => !v)}
							className={cn(
								"w-12 h-7 rounded-full transition-all relative",
								includePassword ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-700"
							)}
							title="toggle"
						>
							<span
								className={cn(
									"absolute top-1 w-5 h-5 rounded-full bg-white transition-all",
									includePassword ? "right-1" : "right-6"
								)}
							/>
						</button>
					</div>

					<div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
						<div className="text-xs text-gray-500 dark:text-slate-400 mb-2">
							{t("whatsapp.preview") || "Message preview"}
						</div>
						<pre className="text-sm whitespace-pre-wrap text-gray-800 dark:text-slate-100 font-en" dir="ltr">
							{message}
						</pre>
					</div>

					<div className="flex items-center justify-end gap-2">
						<Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
							{t("actions.close") || "Close"}
						</Button>
						<Button
							className="rounded-full btn-primary1"
							onClick={() => window.open(waLink, "_blank", "noopener,noreferrer")}
							disabled={!email || !isValidPhone || (includePassword && !password)}
						>
							<span className="flex items-center gap-2">
								<Send size={18} />
								{t("actions.openWhatsapp") || "Open WhatsApp"}
							</span>
						</Button>
					</div>

					<div className="text-[11px] text-gray-500 dark:text-slate-400 text-right">
						{t("whatsapp.note") ||
							"Tip: password is available only if you generated it (Create user / Reset password). If you didn’t, click the key icon in the table first."}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
