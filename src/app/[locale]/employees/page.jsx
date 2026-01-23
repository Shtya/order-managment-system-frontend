"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
	Trash2,
	Eye,
	Phone,
	Mail,
	ChevronLeft,
	Edit2,
	Users,
	Headphones,
	Package,
	FileText,
	ToggleLeft,
	ToggleRight,
	Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

import InfoCard from "@/components/atoms/InfoCard";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import DataTable from "@/components/atoms/DataTable";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";
import { Label } from "@/components/ui/label";

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

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import api from "@/utils/api";

/** =========================
 * Helpers
 * ========================= */
function getApiMsg(err, fallback = "Request failed") {
	const msg =
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.message ||
		fallback;
	return Array.isArray(msg) ? msg.join(", ") : msg;
}

function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/** =========================
 * Toolbar (No filters, No refresh)
 * - Search (server)
 * - Export (server)
 * ========================= */
function EmployeesTableToolbar({
	t,
	searchValue,
	onSearchChange,
	onExport,
	exportLoading,
}) {
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
					<path d="M15 4.3125H10.5C10.1925 4.3125 9.9375 4.0575 9.9375 3.75C9.9375 3.4425 10.1925 3.1875 10.5 3.1875H15C15.3075 3.1875 15.5625 3.4425 15.5625 3.75C15.5625 4.0575 15.3075 4.3125 15 4.3125Z" fill="#A6ACBD" />
					<path d="M12.75 6.5625H10.5C10.1925 6.5625 9.9375 6.3075 9.9375 6C9.9375 5.6925 10.1925 5.4375 10.5 5.4375H12.75C13.0575 5.4375 13.3125 5.6925 13.3125 6C13.3125 6.3075 13.0575 6.5625 12.75 6.5625Z" fill="#A6ACBD" />
					<path d="M8.625 16.3125C4.3875 16.3125 0.9375 12.8625 0.9375 8.625C0.9375 4.3875 4.3875 0.9375 8.625 0.9375C8.9325 0.9375 9.1875 1.1925 9.1875 1.5C9.1875 1.8075 8.9325 2.0625 8.625 2.0625C5.0025 2.0625 2.0625 5.01 2.0625 8.625C2.0625 12.24 5.0025 15.1875 8.625 15.1875C12.2475 15.1875 15.1875 12.24 15.1875 8.625C15.1875 8.3175 15.4425 8.0625 15.75 8.0625C16.0575 8.0625 16.3125 8.3175 16.3125 8.625C16.3125 12.8625 12.8625 16.3125 8.625 16.3125Z" fill="#A6ACBD" />
					<path d="M16.5001 17.0626C16.3576 17.0626 16.2151 17.0101 16.1026 16.8976L14.6026 15.3976C14.3851 15.1801 14.3851 14.8201 14.6026 14.6026C14.8201 14.3851 15.1801 14.3851 15.3976 14.6026L16.8976 16.1026C17.1151 16.3201 17.1151 16.6801 16.8976 16.8976C16.7851 17.0101 16.6426 17.0626 16.5001 17.0626Z" fill="#A6ACBD" />
				</svg>

				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={t("toolbar.searchPlaceholder")}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 placeholder:text-gray-400 dark:placeholder:text-slate-400 text-gray-700 dark:text-slate-100"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 !px-4 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800"
					onClick={onExport}
					disabled={exportLoading}
				>
					{exportLoading ? <Loader2 className="animate-spin" size={18} /> : null}
					{t("toolbar.export")}
				</Button>
			</div>
		</div>
	);
}

/** =========================
 * Modals
 * ========================= */
function ViewEmployeeDialog({ t, open, onOpenChange, data, loading }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl rounded-2xl">
				<DialogHeader className="text-right">
					<DialogTitle>{t("view.title") || t("actions.view")}</DialogTitle>
					<DialogDescription>
						{loading ? t("loading") : data ? `#${data.id}` : ""}
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="py-10 flex items-center justify-center gap-2 text-gray-500">
						<Loader2 className="animate-spin" size={18} />
						{t("loading")}
					</div>
				) : !data ? (
					<div className="py-10 text-center text-gray-500">{t("empty")}</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-800/40">
							<div className="text-xs text-gray-500">{t("table.name")}</div>
							<div className="mt-1 font-semibold text-gray-900 dark:text-white">
								{data.name || "-"}
							</div>
						</div>

						<div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-800/40">
							<div className="text-xs text-gray-500">{t("table.email")}</div>
							<div className="mt-1 font-en text-gray-900 dark:text-white" dir="ltr">
								{data.email || "-"}
							</div>
						</div>

						<div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-800/40">
							<div className="text-xs text-gray-500">{t("table.phone")}</div>
							<div className="mt-1 font-en text-gray-900 dark:text-white" dir="ltr">
								{data.phone || "-"}
							</div>
						</div>

						<div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-800/40">
							<div className="text-xs text-gray-500">{t("table.role")}</div>
							<div className="mt-1 text-gray-900 dark:text-white">
								{data.employeeType || data.type || "-"}
							</div>
						</div>

						<div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-800/40 md:col-span-2">
							<div className="text-xs text-gray-500">{t("table.status") || "Status"}</div>
							<div className="mt-1">
								{data.isActive ? (
									<Badge className="rounded-md bg-[#F0FDF4] text-[#22C55E] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-400">
										Active
									</Badge>
								) : (
									<Badge className="rounded-md bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEF2F2] dark:bg-red-950/30 dark:text-red-400">
										Inactive
									</Badge>
								)}
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function EditEmployeeDialog({ t, open, onOpenChange, initial, onSave, saving }) {
	const [form, setForm] = useState({ name: "", email: "", phone: "" });

	useEffect(() => {
		if (open && initial) {
			setForm({
				name: initial.name || "",
				email: initial.email || "",
				phone: initial.phone || "",
			});
		}
		if (!open) setForm({ name: "", email: "", phone: "" });
	}, [open, initial]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl rounded-2xl">
				<DialogHeader className="text-right">
					<DialogTitle>{t("edit.title") || t("actions.edit")}</DialogTitle>
					<DialogDescription>{initial ? `#${initial.id}` : ""}</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">{t("table.name")}</Label>
						<Input
							value={form.name}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							className="rounded-full h-[42px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
						/>
					</div>

					<div>
						<Label className="text-xs text-gray-500 dark:text-slate-400">{t("table.email")}</Label>
						<Input
							value={form.email}
							onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
							className="rounded-full h-[42px] font-en bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
							dir="ltr"
						/>
					</div>

					<div className="md:col-span-2">
						<Label className="text-xs text-gray-500 dark:text-slate-400">{t("table.phone")}</Label>
						<Input
							value={form.phone}
							onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
							className="rounded-full h-[42px] font-en bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 mt-1"
							dir="ltr"
						/>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-end gap-2">
					<Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)} disabled={saving}>
						{t("actions.cancel") || "Cancel"}
					</Button>
					<Button
						className="rounded-full btn-primary1"
						onClick={() => onSave?.({ ...form })}
						disabled={saving || !form.name.trim() || !form.email.trim()}
					>
						<span className="flex items-center gap-2">
							{saving ? <Loader2 className="animate-spin" size={18} /> : <Edit2 size={18} />}
							{t("actions.save") || "Save"}
						</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function ConfirmDeleteDialog({ t, open, onOpenChange, employee, onConfirm, loading }) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="rounded-2xl">
				<AlertDialogHeader className="text-right">
					<AlertDialogTitle>{t("delete.title") || t("actions.delete")}</AlertDialogTitle>
					<AlertDialogDescription>
						{employee ? `${employee.name} — ${employee.email}` : ""}
						<div className="mt-2 text-sm">
							{t("delete.desc") || "This will delete the employee permanently."}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="mt-4 flex items-center justify-end gap-2">
					<AlertDialogCancel className="rounded-full" disabled={loading}>
						{t("actions.cancel") || "Cancel"}
					</AlertDialogCancel>
					<AlertDialogAction
						className="rounded-full bg-red-600 hover:bg-red-700 text-white"
						onClick={onConfirm}
						disabled={loading}
					>
						<span className="flex items-center gap-2">
							{loading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
							{t("actions.delete") || "Delete"}
						</span>
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

/** =========================
 * Page
 * ========================= */
export default function EmployeesPage() {
	const t = useTranslations("employees");

	// server state
	const [records, setRecords] = useState ([]);
	const [pagination, setPagination] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 6,
	});

	// tabs/types counts (from /users/stats/types)
	const [types, setTypes] = useState ([
		{ id: "all", label: t("tabs.all") || "All", count: 0 },
	]);

	// ui state
	const [activeType, setActiveType] = useState("all");
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [exportLoading, setExportLoading] = useState(false);

	// per-row loading
	const [rowLoading, setRowLoading] = useState ({}); // { [id]: {toggle, del, view, edit} }

	// messages
	const [error, setError] = useState("");
	const [apiMsg, setApiMsg] = useState("");

	// dialogs
	const [viewOpen, setViewOpen] = useState(false);
	const [viewLoading, setViewLoading] = useState(false);
	const [viewData, setViewData] = useState (null);

	const [editOpen, setEditOpen] = useState(false);
	const [editSaving, setEditSaving] = useState(false);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selected, setSelected] = useState (null);

	/** icons map for switcher */
	const typeIcon = (id ) => {
		const map = {
			all: Users,
			call_center: Headphones,
			warehouse: Package,
			warehouse_staff: Package,
			data_entry: FileText,
			customer_service: Headphones,
		};
		return map[id] || Users;
	};

	function setRowActionLoading(id , key , val ) {
		setRowLoading((p) => ({
			...p,
			[id]: { ...(p[id] || {}), [key]: val },
		}));
	}

	/** =========================
	 * Fetch types stats (for current admin)
	 * GET /users/stats/types
	 * ========================= */
	async function fetchTypesStats() {
		try {
			const res = await api.get("/users/stats/types");
			const data = res?.data || {};
			const arr = Array.isArray(data.types) ? data.types : [];

			// keep label = id for now (FE can translate it)
			const normalized = arr.map((x) => ({
				id: String(x.id),
				label:
					x.id === "all"
						? t("tabs.all") || "All"
						: t.has(`tabs.${x.id}`) ? t(`tabs.${x.id}`) : x.id ,
				count: Number(x.count ?? 0),
			}));

			setTypes(
				normalized.length
					? normalized
					: [{ id: "all", label: t("tabs.all") || "All", count: 0 }]
			);
		} catch {
			// silent (don’t break page)
		}
	}

	/** =========================
	 * Fetch list (server)
	 * GET /users?page&limit&type&search
	 * ========================= */
	async function fetchEmployees({
		page,
		limit,
		type,
		q,
	}) {
		setIsLoading(true);
		setError("");
		setApiMsg("");

		const params = {
			page: page ?? pagination.current_page,
			limit: limit ?? pagination.per_page,
			type: type ?? activeType,
			search: q ?? search,
		};

		try {
			const res = await api.get("/users", { params });
			const data = res?.data || {};

			// Support both response shapes:
			// A) {records,total_records,current_page,per_page}
			// B) array users (old list) -> normalize
			if (Array.isArray(data)) {
				setRecords(data);
				setPagination({
					total_records: data.length,
					current_page: 1,
					per_page: data.length || 6,
				});
			} else {
				setRecords(Array.isArray(data.records) ? data.records : []);
				setPagination({
					total_records: Number(data.total_records ?? 0),
					current_page: Number(data.current_page ?? params.page ?? 1),
					per_page: Number(data.per_page ?? params.limit ?? 6),
				});
			}

			// refresh types counts (so switcher counts keep updated with search)
			// If you want counts to ignore search, remove this and call only once on mount.
			await fetchTypesStats();
		} catch (e) {
			setError(getApiMsg(e, "Failed to load employees"));
		} finally {
			setIsLoading(false);
		}
	}

	// initial load
	useEffect(() => {
		(async () => {
			await fetchTypesStats();
			await fetchEmployees({ page: 1, limit: pagination.per_page, type: "all", q: "" });
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// debounce search
	useEffect(() => {
		const h = setTimeout(() => {
			fetchEmployees({ page: 1, type: activeType, q: search });
		}, 400);
		return () => clearTimeout(h);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search]);

	// when type changes
	useEffect(() => {
		fetchEmployees({ page: 1, type: activeType, q: search });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeType]);

	function handlePageChange({ page, per_page }) {
		fetchEmployees({ page, limit: per_page, type: activeType, q: search });
	}

	/** =========================
	 * Export (server)
	 * GET /users/export/csv
	 * ========================= */
	async function handleExport() {
		setExportLoading(true);
		setError("");
		try {
			const res = await api.get("/users/export/csv", {
				params: { type: activeType, search },
				responseType: "blob",
			});
			downloadBlob(res.data, "employees.csv");
		} catch (e) {
			setError(getApiMsg(e, "Failed to export"));
		} finally {
			setExportLoading(false);
		}
	}

	/** =========================
	 * View details
	 * GET /users/:id
	 * ========================= */
	async function handleView(row) {
		setSelected(row);
		setViewOpen(true);
		setViewData(null);
		setViewLoading(true);
		setRowActionLoading(row.id, "view", true);

		try {
			const res = await api.get(`/users/${row.id}`);
			setViewData(res?.data || null);
		} catch (e) {
			setError(getApiMsg(e, "Failed to load employee details"));
		} finally {
			setViewLoading(false);
			setRowActionLoading(row.id, "view", false);
		}
	}

	/** =========================
	 * Edit
	 * PATCH /users/:id
	 * ========================= */
	function openEdit(row) {
		setSelected(row);
		setEditOpen(true);
	}

	async function handleEditSave(payload) {
		if (!selected?.id) return;
		setEditSaving(true);
		setRowActionLoading(selected.id, "edit", true);
		setError("");
		setApiMsg("");

		try {
			await api.patch(`/users/${selected.id}`, {
				name: payload.name?.trim(),
				email: payload.email?.trim(),
				phone: payload.phone?.trim(),
			});
			setApiMsg(t("messages.updated") || "Updated successfully");
			setEditOpen(false);
			await fetchEmployees({
				page: pagination.current_page,
				limit: pagination.per_page,
				type: activeType,
				q: search,
			});
		} catch (e) {
			setError(getApiMsg(e, "Failed to update"));
		} finally {
			setEditSaving(false);
			setRowActionLoading(selected.id, "edit", false);
		}
	}

	/** =========================
	 * Toggle active
	 * PATCH /users/:id/toggle-active
	 * ========================= */
	async function handleToggleActive(row) {
		setRowActionLoading(row.id, "toggle", true);
		setError("");
		setApiMsg("");
		try {
			const res = await api.patch(`/users/${row.id}/toggle-active`, {});
			const isActive = res?.data?.isActive;

			setRecords((prev) =>
				prev.map((r) =>
					r.id === row.id
						? { ...r, isActive: typeof isActive === "boolean" ? isActive : !r.isActive }
						: r
				)
			);

			// refresh counts quickly
			await fetchTypesStats();

			setApiMsg(t("messages.statusUpdated") || "Status updated");
		} catch (e) {
			setError(getApiMsg(e, "Failed to toggle status"));
		} finally {
			setRowActionLoading(row.id, "toggle", false);
		}
	}

	/** =========================
	 * Delete
	 * DELETE /users/:id
	 * ========================= */
	function openDelete(row) {
		setSelected(row);
		setDeleteOpen(true);
	}

	async function confirmDelete() {
		if (!selected?.id) return;
		setRowActionLoading(selected.id, "del", true);
		setError("");
		setApiMsg("");

		try {
			await api.delete(`/users/${selected.id}`);
			setApiMsg(t("messages.deleted") || "Deleted");
			setDeleteOpen(false);

			await fetchEmployees({
				page: pagination.current_page,
				limit: pagination.per_page,
				type: activeType,
				q: search,
			});
			await fetchTypesStats();
		} catch (e) {
			setError(getApiMsg(e, "Failed to delete"));
		} finally {
			setRowActionLoading(selected.id, "del", false);
		}
	}

	/** =========================
	 * UI: Switcher items from types endpoint
	 * ========================= */
	const switchItems = useMemo(() => {
		return (types || []).map((x) => ({
			id: x.id,
			label: `${x.label}`,
			icon: typeIcon(x.id),
		}));
	}, [types]);

	/** =========================
	 * Stats cards from types counts
	 * (total + top 3 types)
	 * ========================= */
	const statCards = useMemo(() => {
		const total =
			Number(types?.find((x) => x.id === "all")?.count ?? 0) ||
			Number(pagination.total_records ?? 0);

		const rest = (types || []).filter((x) => x.id !== "all");
		const top3 = rest.sort((a, b) => Number(b.count) - Number(a.count)).slice(0, 3);

		const iconByKey = {
			data_entry: FileText,
			customer_service: Headphones,
			warehouse: Package,
			warehouse_staff: Package,
			call_center: Headphones,
		};

		const cards = [
			{
				title: t("stats.totalEmployees"),
				value: String(total),
				icon: Users,
				bg: "bg-[#F3F6FF] dark:bg-[#0B1220]",
				iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]",
				iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]",
			},
		];

		top3.forEach((e, idx) => {
			cards.push({
				title: t.has(`tabs.${e.id}`) ? t(`tabs.${e.id}`) : e.id ,
				value: String(Number(e.count ?? 0)),
				icon: iconByKey[e.id] || Users,
				bg:
					idx === 0
						? "bg-[#FFF9F0] dark:bg-[#1A1208]"
						: idx === 1
							? "bg-[#F6FFF1] dark:bg-[#0E1A0C]"
							: "bg-[#F1FAFF] dark:bg-[#0A1820]",
				iconColor:
					idx === 0
						? "text-[#F59E0B] dark:text-[#FBBF24]"
						: idx === 1
							? "text-[#22C55E] dark:text-[#4ADE80]"
							: "text-[#38BDF8] dark:text-[#7DD3FC]",
				iconBorder:
					idx === 0
						? "border-[#F59E0B] dark:border-[#FBBF24]"
						: idx === 1
							? "border-[#22C55E] dark:border-[#4ADE80]"
							: "border-[#38BDF8] dark:border-[#7DD3FC]",
			});
		});

		return cards;
	}, [types, pagination.total_records, t]);

	/** =========================
	 * Badge style
	 * ========================= */
	const getTypeBadge = (typeLabel) => {
		const val = (typeLabel || "").toLowerCase();
		if (val.includes("data")) {
			return "rounded-md bg-[#FFF9F0] text-[#F59E0B] hover:bg-[#FFF9F0] dark:bg-orange-950/30 dark:text-orange-400";
		}
		if (val.includes("customer") || val.includes("service")) {
			return "rounded-md bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-400";
		}
		if (val.includes("warehouse")) {
			return "rounded-md bg-[#F1FAFF] text-[#38BDF8] hover:bg-[#F1FAFF] dark:bg-blue-950/30 dark:text-blue-400";
		}
		return "rounded-md bg-[#F0F9FF] text-[#0EA5E9] hover:bg-[#F0F9FF] dark:bg-cyan-950/30 dark:text-cyan-400";
	};

	/** =========================
	 * Columns
	 * ========================= */
	const columns = useMemo(() => {
		return [
			{
				key: "name",
				header: t("table.name"),
				className: "text-gray-700 dark:text-slate-200 font-semibold",
			},
			{
				key: "email",
				header: t("table.email"),
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300">
						<Mail size={16} className="text-gray-400 dark:text-slate-500" />
						<span dir="ltr" className="font-en">{row.email}</span>
					</div>
				),
			},
			{
				key: "phone",
				header: t("table.phone"),
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300">
						<Phone size={16} className="text-gray-400 dark:text-slate-500" />
						<span dir="ltr" className="font-en">{row.phone || "-"}</span>
					</div>
				),
			},
			{
				key: "type",
				header: t("table.role"),
				cell: (row) => (
					<Badge className={getTypeBadge(String(row.employeeType || row.type || ""))}>
						{row.employeeType || row.type || "-"}
					</Badge>
				),
			},
			{
				key: "isActive",
				header: t("table.status") || "Status",
				cell: (row) =>
					row.isActive ? (
						<Badge className="rounded-md bg-[#F0FDF4] text-[#22C55E] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-400">
							Active
						</Badge>
					) : (
						<Badge className="rounded-md bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEF2F2] dark:bg-red-950/30 dark:text-red-400">
							Inactive
						</Badge>
					),
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[220px]",
				cell: (row) => {
					const busy = rowLoading[row.id] || {};
					return (
						<TooltipProvider>
							<div className="flex items-center gap-2">
								{/* Toggle active */}
								<Tooltip>
									<TooltipTrigger asChild>
										<motion.button
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.95 }}
											className={cn(
												"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
												row.isActive
													? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:border-amber-600 hover:text-white"
													: "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white",
												"disabled:opacity-60 disabled:cursor-not-allowed"
											)}
											disabled={!!busy.toggle}
											onClick={() => handleToggleActive(row)}
										>
											{busy.toggle ? (
												<Loader2 size={16} className="animate-spin" />
											) : row.isActive ? (
												<ToggleLeft size={16} className="transition-transform group-hover:scale-110" />
											) : (
												<ToggleRight size={16} className="transition-transform group-hover:scale-110" />
											)}
										</motion.button>
									</TooltipTrigger>
									<TooltipContent>
										{row.isActive ? (t("actions.deactivate") || "Deactivate") : (t("actions.activate") || "Activate")}
									</TooltipContent>
								</Tooltip>

								{/* Delete */}
								<Tooltip>
									<TooltipTrigger asChild>
										<motion.button
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.95 }}
											className={cn(
												"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
												"border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white",
												"disabled:opacity-60 disabled:cursor-not-allowed"
											)}
											disabled={!!busy.del}
											onClick={() => openDelete(row)}
										>
											{busy.del ? (
												<Loader2 size={16} className="animate-spin" />
											) : (
												<Trash2 size={16} className="transition-transform group-hover:scale-110 group-hover:rotate-12" />
											)}
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
											className={cn(
												"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
												"border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white",
												"disabled:opacity-60 disabled:cursor-not-allowed"
											)}
											disabled={!!busy.edit}
											onClick={() => openEdit(row)}
										>
											{busy.edit ? (
												<Loader2 size={16} className="animate-spin" />
											) : (
												<Edit2 size={16} className="transition-transform group-hover:scale-110 group-hover:-rotate-12" />
											)}
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
											className={cn(
												"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
												"border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white",
												"disabled:opacity-60 disabled:cursor-not-allowed"
											)}
											disabled={!!busy.view}
											onClick={() => handleView(row)}
										>
											{busy.view ? (
												<Loader2 size={16} className="animate-spin" />
											) : (
												<Eye size={16} className="transition-transform group-hover:scale-110" />
											)}
										</motion.button>
									</TooltipTrigger>
									<TooltipContent>{t("actions.view")}</TooltipContent>
								</Tooltip>
							</div>
						</TooltipProvider>
					);
				},
			},
		];
	}, [t, rowLoading]);

	return (
		<div className="min-h-screen p-6">
			{/* Header */}
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-[rgb(var(--primary))]">{t("breadcrumb.employees")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
					</div>

					<div className="flex items-center gap-4">
						<Button_
							href="/employees/new"
							size="sm"
							label={t("actions.addEmployee")}
							tone="purple"
							variant="solid"
							icon={
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M6.12078 3.34752C8.69901 3.06206 11.3009 3.06206 13.8791 3.34752C15.3066 3.50752 16.4583 4.63169 16.6258 6.06419C16.9313 8.67918 16.9313 11.3209 16.6258 13.9359C16.4583 15.3684 15.3066 16.4925 13.8791 16.6525C11.3009 16.938 8.69901 16.938 6.12078 16.6525C4.69328 16.4925 3.54161 15.3684 3.37411 13.9359C3.06866 11.3211 3.06866 8.67974 3.37411 6.06502C3.45883 5.36908 3.77609 4.72214 4.27447 4.22906C4.77285 3.73597 5.42314 3.42564 6.11994 3.34835M9.99994 5.83919C10.1657 5.83919 10.3247 5.90503 10.4419 6.02224C10.5591 6.13945 10.6249 6.29842 10.6249 6.46419V9.37502H13.5358C13.7015 9.37502 13.8605 9.44087 13.9777 9.55808C14.0949 9.67529 14.1608 9.83426 14.1608 10C14.1608 10.1658 14.0949 10.3247 13.9777 10.442C13.8605 10.5592 13.7015 10.625 13.5358 10.625H10.6249V13.5359C10.6249 13.7016 10.5591 13.8606 10.4419 13.9778C10.3247 14.095 10.1657 14.1609 9.99994 14.1609C9.83418 14.1609 9.67521 14.095 9.558 13.9778C9.44079 13.8606 9.37494 13.7016 9.37494 13.5359V10.625H6.46411C6.29835 10.625 6.13938 10.5592 6.02217 10.442C5.90496 10.3247 5.83911 10.1658 5.83911 10C5.83911 9.83426 5.90496 9.67529 6.02217 9.55808C6.13938 9.44087 6.29835 9.37502 6.46411 9.37502H9.37494V6.46419C9.37494 6.29842 9.44079 6.13945 9.558 6.02224C9.67521 5.90503 9.83418 5.83919 9.99994 5.83919Z"
										fill="white"
									/>
								</svg>
							}
						/>
					</div>
				</div>

				{/* Switcher (dynamic from endpoint) */}
				<SwitcherTabs items={switchItems} activeId={activeType} onChange={setActiveType} className="w-full" />

				{/* Stats (from types counts) */}
				<div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-6">
					{statCards.map((stat, index) => (
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

			{/* Toolbar + Table */}
			<div className="bg-card rounded-sm">
				<EmployeesTableToolbar
					t={t}
					searchValue={search}
					onSearchChange={setSearch}
					onExport={handleExport}
					exportLoading={exportLoading}
				/>

				<div className="mt-4">
					<DataTable
						columns={columns}
						data={records}
						isLoading={isLoading}
						pagination={{
							total_records: pagination.total_records,
							current_page: pagination.current_page,
							per_page: pagination.per_page,
						}}
						onPageChange={({ page, per_page }) => handlePageChange({ page, per_page })}
						emptyState={t("empty")}
					/>
				</div>
			</div>

			{/* Dialogs */}
			<ViewEmployeeDialog
				t={t}
				open={viewOpen}
				onOpenChange={setViewOpen}
				data={viewData}
				loading={viewLoading}
			/>

			<EditEmployeeDialog
				t={t}
				open={editOpen}
				onOpenChange={setEditOpen}
				initial={selected}
				onSave={handleEditSave}
				saving={editSaving}
			/>

			<ConfirmDeleteDialog
				t={t}
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				employee={selected}
				onConfirm={confirmDelete}
				loading={!!(selected?.id && rowLoading[selected.id]?.del)}
			/>
		</div>
	);
}
