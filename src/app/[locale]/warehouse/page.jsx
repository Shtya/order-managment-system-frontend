"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Trash2,
	CalendarDays,
	MapPin,
	Package,
	ChevronLeft,
	Edit2,
	Filter,
	Eye,
	FileDown,
	X,
	Loader2,
	Plus,
	Phone,
	User,
	Building2,
	Search as SearchIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import dynamic from "next/dynamic";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import api from "@/utils/api";
import toast from "react-hot-toast";
import InputPhone from "@/components/atoms/InputPhone";

// Dynamic import for map to avoid SSR issues
const MapLocationPicker = dynamic(() => import("@/components/atoms/MapLocationPicker"), {
	ssr: false,
	loading: () => (
		<div className="w-full h-[300px] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
			<Loader2 className="w-8 h-8 animate-spin text-primary" />
		</div>
	),
});

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

const makeSchema = (t) =>
	yup.object({
		name: yup.string().trim().required(t("validation.nameRequired")).max(120, t("validation.nameMax")),
		location: yup.string().trim().nullable().max(160, t("validation.locationMax")),
		phone: yup.string().trim().required(t("validation.required")),
		managerUserId: yup.number().nullable(),
		isActive: yup.boolean().default(true),
	});

function WarehouseFormDialog({ open, onOpenChange, warehouse, onSuccess, t }) {
	const [users, setUsers] = useState([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState(null);

	const schema = useMemo(() => makeSchema(t), [t]);

	const {
		control,
		register,
		handleSubmit,
		setValue,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: {
			name: "",
			location: "",
			phone: "",
			managerUserId: null,
			isActive: true,
		},
		resolver: yupResolver(schema),
	});

	// Load users for manager dropdown
	useEffect(() => {
		(async () => {
			setLoadingUsers(true);
			try {
				const res = await api.get("/users", { params: { limit: 200 } });
				const usersList = Array.isArray(res.data?.records) ? res.data.records : Array.isArray(res.data) ? res.data : [];
				setUsers(usersList);
			} catch (e) {
				console.error("Failed to load users:", e);
			} finally {
				setLoadingUsers(false);
			}
		})();
	}, []);

	// Load existing warehouse data
	useEffect(() => {
		if (warehouse) {
			reset({
				name: warehouse.name || "",
				location: warehouse.location || "",
				phone: warehouse.phone || "",
				managerUserId: warehouse.manager?.id || null,
				isActive: warehouse.isActive ?? true,
			});

			// Parse location if it exists (format: "lat,lng")
			if (warehouse.location && warehouse.location.includes(",")) {
				const [lat, lng] = warehouse.location.split(",").map((s) => parseFloat(s.trim()));
				if (!isNaN(lat) && !isNaN(lng)) {
					setSelectedLocation({ lat, lng });
				}
			}
		} else {
			reset({
				name: "",
				location: "",
				phone: "",
				managerUserId: null,
				isActive: true,
			});
			setSelectedLocation(null);
		}
	}, [warehouse, reset]);

	const onSubmit = async (data) => {
		try {
			const payload = {
				name: data.name.trim(),
				location: data.location?.trim() || null,
				phone: data.phone?.trim() || null,
				managerUserId: data.managerUserId || null,
				isActive: data.isActive,
			};

			if (warehouse) {
				await api.patch(`/warehouses/${warehouse.id}`, payload);
				toast.success(t("messages.updated"));
			} else {
				await api.post("/warehouses", payload);
				toast.success(t("messages.created"));
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			toast.error(normalizeAxiosError(error));
		}
	};

	const handleLocationSelect = (lat, lng) => {
		setSelectedLocation({ lat, lng });
		setValue("location", `${lat.toFixed(6)}, ${lng.toFixed(6)}`, { shouldValidate: true });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<Building2 className="w-6 h-6 text-primary" />
						{warehouse ? t("form.editTitle") : t("form.createTitle")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
					{/* Name */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<Building2 size={16} />
							{t("form.name")}
						</Label>
						<Input
							{...register("name")}
							placeholder={t("form.namePlaceholder")}
							className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
						/>
						{errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
					</div>

					{/* Map Location Picker */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<MapPin size={16} />
							{t("form.location")}
						</Label>

						<div className="rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
							<MapLocationPicker
								initialLocation={selectedLocation}
								onLocationSelect={handleLocationSelect}
								height="300px"
							/>
						</div>

						{errors.location && <p className="text-xs text-red-600">{errors.location.message}</p>}
						<p className="text-xs text-slate-500">{t("form.locationHint")}</p>
					</div>

					{/* Phone */}
					<InputPhone
						label={t("form.phone")}
						icon={Phone}
						t={t} 
						control={control}
						nameCountry="phoneCountry"
						nameNumber="phone"
						error={errors?.phone?.message}
					/>
 

					{/* Manager */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<User size={16} />
							{t("form.manager")}
						</Label>
						<Controller
							control={control}
							name="managerUserId"
							render={({ field }) => (
								<Select
									value={field.value ? String(field.value) : "none"}
									onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
									disabled={loadingUsers}
								>
									<SelectTrigger className="w-full rounded-xl !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
										<SelectValue placeholder={t("form.managerPlaceholder")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("form.noManager")}</SelectItem>
										{users.map((user) => (
											<SelectItem key={user.id} value={String(user.id)}>
												{user.name || user.email || `#${user.id}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						{errors.managerUserId && <p className="text-xs text-red-600">{errors.managerUserId.message}</p>}
					</div>

					{/* Active Status */}
					<div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
						<div className="flex items-center gap-2">
							<Package size={20} className="text-slate-600 dark:text-slate-300" />
							<div>
								<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t("form.isActive")}</Label>
								<p className="text-xs text-slate-500">{t("form.isActiveHint")}</p>
							</div>
						</div>
						<Controller
							control={control}
							name="isActive"
							render={({ field }) => (
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							)}
						/>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="rounded-xl"
						>
							{t("form.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
									{t("form.saving")}
								</>
							) : warehouse ? (
								t("form.update")
							) : (
								t("form.create")
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function ViewWarehouseDialog({ open, onOpenChange, warehouse, t }) {
	if (!warehouse) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-2xl bg-white dark:bg-slate-900">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<Eye className="w-6 h-6 text-primary" />
						{t("view.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="p-6 space-y-6">
					{/* Header */}
					<div className="flex items-start justify-between">
						<div>
							<h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{warehouse.name}</h3>
							<Badge
								className={cn(
									"rounded-full",
									warehouse.isActive
										? "bg-green-100 text-green-700 border border-green-200"
										: "bg-gray-100 text-gray-600 border border-gray-200"
								)}
							>
								{warehouse.isActive ? t("view.active") : t("view.inactive")}
							</Badge>
						</div>
					</div>

					{/* Info Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
							<div className="flex items-center gap-2 mb-2">
								<MapPin size={16} className="text-slate-500" />
								<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.location")}</span>
							</div>
							<div className="font-semibold text-slate-900 dark:text-white">{warehouse.location || "—"}</div>
						</div>

						<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
							<div className="flex items-center gap-2 mb-2">
								<Phone size={16} className="text-slate-500" />
								<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.phone")}</span>
							</div>
							<div className="font-semibold text-slate-900 dark:text-white">{warehouse.phone || "—"}</div>
						</div>

						<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
							<div className="flex items-center gap-2 mb-2">
								<User size={16} className="text-slate-500" />
								<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.manager")}</span>
							</div>
							<div className="font-semibold text-slate-900 dark:text-white">
								{warehouse.manager?.name || warehouse.manager?.email || "—"}
							</div>
						</div>

						<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
							<div className="flex items-center gap-2 mb-2">
								<CalendarDays size={16} className="text-slate-500" />
								<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.createdAt")}</span>
							</div>
							<div className="font-semibold text-slate-900 dark:text-white">
								{warehouse.created_at ? new Date(warehouse.created_at).toLocaleDateString("ar-EG") : "—"}
							</div>
						</div>
					</div>

					{/* Map Display if location exists */}
					{warehouse.location && warehouse.location.includes(",") && (
						<div className="rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
							<MapLocationPicker
								initialLocation={(() => {
									const [lat, lng] = warehouse.location.split(",").map((s) => parseFloat(s.trim()));
									return !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null;
								})()}
								onLocationSelect={() => { }}
								height="250px"
								readOnly
							/>
						</div>
					)}
				</div>

				<div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
						{t("view.close")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmText, cancelText, onConfirm, loading = false }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl">
				<div className="space-y-4 p-6">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
					{description && <p className="text-sm text-gray-500 dark:text-slate-400">{description}</p>}

					<div className="flex items-center justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
							{cancelText}
						</Button>
						<Button variant="destructive" onClick={onConfirm} disabled={loading}>
							{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default function WarehousesPage() {
	const t = useTranslations("warehouses");

	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 10,
		records: [],
	});

	const [formOpen, setFormOpen] = useState(false);
	const [editingWarehouse, setEditingWarehouse] = useState(null);

	const [viewOpen, setViewOpen] = useState(false);
	const [viewingWarehouse, setViewingWarehouse] = useState(null);

	const [deleteState, setDeleteState] = useState({ open: false, id: null });
	const [deleting, setDeleting] = useState(false);

	const stats = useMemo(
		() => [
			{
				title: t("stats.totalWarehouses"),
				value: String(pager.total_records),
				icon: Building2,
				bg: "bg-[#F3F6FF] dark:bg-[#0B1220]",
				iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]",
				iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]",
			},
			{
				title: t("stats.activeWarehouses"),
				value: String(pager.records.filter((w) => w.isActive).length),
				icon: Package,
				bg: "bg-[#F6FFF1] dark:bg-[#0E1A0C]",
				iconColor: "text-[#22C55E] dark:text-[#4ADE80]",
				iconBorder: "border-[#22C55E] dark:border-[#4ADE80]",
			},
			{
				title: t("stats.inactiveWarehouses"),
				value: String(pager.records.filter((w) => !w.isActive).length),
				icon: Package,
				bg: "bg-[#FFF9F0] dark:bg-[#1A1208]",
				iconColor: "text-[#F59E0B] dark:text-[#FBBF24]",
				iconBorder: "border-[#F59E0B] dark:border-[#FBBF24]",
			},
		],
		[pager, t]
	);

	const fetchWarehouses = useCallback(
		async ({ page = 1, per_page = 10 } = {}) => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				params.set("page", String(page));
				params.set("limit", String(per_page));
				if (search?.trim()) params.set("search", search.trim());
				params.set("sortBy", "created_at");
				params.set("sortOrder", "DESC");

				const res = await api.get(`/warehouses?${params.toString()}`);
				setPager({
					total_records: res.data?.total_records ?? 0,
					current_page: res.data?.current_page ?? page,
					per_page: res.data?.per_page ?? per_page,
					records: res.data?.records ?? [],
				});
			} catch (e) {
				toast.error(normalizeAxiosError(e));
			} finally {
				setLoading(false);
			}
		},
		[search]
	);

	useEffect(() => {
		fetchWarehouses({ page: 1, per_page: 10 });
	}, [fetchWarehouses]);

	const handlePageChange = ({ page, per_page }) => {
		fetchWarehouses({ page, per_page });
	};

	const openCreate = () => {
		setEditingWarehouse(null);
		setFormOpen(true);
	};

	const openEdit = (warehouse) => {
		setEditingWarehouse(warehouse);
		setFormOpen(true);
	};

	const openView = (warehouse) => {
		setViewingWarehouse(warehouse);
		setViewOpen(true);
	};

	const handleFormSuccess = () => {
		fetchWarehouses({ page: pager.current_page, per_page: pager.per_page });
	};

	const confirmDelete = async () => {
		setDeleting(true);
		try {
			await api.delete(`/warehouses/${deleteState.id}`);
			setDeleteState({ open: false, id: null });
			await fetchWarehouses({ page: pager.current_page, per_page: pager.per_page });
			toast.success(t("delete.success"));
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setDeleting(false);
		}
	};

	const onExport = async () => {
		try {
			const params = new URLSearchParams();
			params.set("page", "1");
			params.set("limit", "1000000");
			if (search?.trim()) params.set("search", search.trim());

			const res = await api.get(`/warehouses/export?${params.toString()}`, { responseType: "blob" });

			const blob = new Blob([res.data], {
				type: res.headers["content-type"] || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			const fileName = res.headers["content-disposition"]?.match(/filename="(.+?)"/)?.[1] || "warehouses.xlsx";

			const link = document.createElement("a");
			link.href = window.URL.createObjectURL(blob);
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(link.href);
		} catch (error) {
			toast.error(normalizeAxiosError(error));
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "id",
				header: t("table.id"),
				className: "font-semibold text-primary w-[80px]",
			},
			{
				key: "name",
				header: t("table.name"),
				className: "text-gray-700 dark:text-slate-200 font-semibold min-w-[200px]",
			},
			{
				key: "location",
				header: t("table.location"),
				className: "min-w-[200px]",
				cell: (row) => (
					<div className="flex items-center gap-2 text-sm">
						<MapPin size={14} className="text-slate-400" />
						<span className="font-mono text-xs text-slate-600 dark:text-slate-300">{row.location || "—"}</span>
					</div>
				),
			},
			{
				key: "phone",
				header: t("table.phone"),
				className: "min-w-[150px]",
				cell: (row) => (
					<div className="flex items-center gap-2">
						<Phone size={14} className="text-slate-400" />
						<span>{row.phone || "—"}</span>
					</div>
				),
			},
			{
				key: "manager",
				header: t("table.manager"),
				className: "min-w-[150px]",
				cell: (row) => (
					<div className="flex items-center gap-2">
						<User size={14} className="text-slate-400" />
						<span>{row.manager?.name || row.manager?.email || "—"}</span>
					</div>
				),
			},
			{
				key: "isActive",
				header: t("table.status"),
				className: "w-[120px]",
				cell: (row) => (
					<Badge
						className={cn(
							"rounded-full",
							row.isActive
								? "bg-green-100 text-green-700 border border-green-200"
								: "bg-gray-100 text-gray-600 border border-gray-200"
						)}
					>
						{row.isActive ? t("table.active") : t("table.inactive")}
					</Badge>
				),
			},
			{
				key: "created_at",
				header: t("table.createdAt"),
				className: "min-w-[120px]",
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300 text-sm">
						<CalendarDays size={14} className="text-gray-400 dark:text-slate-500" />
						{row.created_at ? new Date(row.created_at).toLocaleDateString("ar-EG") : "—"}
					</div>
				),
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[140px] sticky left-0 bg-white dark:bg-slate-900",
				cell: (row) => (
					<TooltipProvider>
						<div className="flex items-center gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										className={cn(
											"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
											"border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white hover:shadow-xl hover:shadow-red-500/40",
											"dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-600 dark:hover:border-red-600 dark:hover:text-white dark:hover:shadow-red-500/30"
										)}
										onClick={() => setDeleteState({ open: true, id: row.id })}
									>
										<Trash2 size={16} className="transition-transform group-hover:scale-110 group-hover:rotate-12" />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.delete")}</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										className={cn(
											"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
											"border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-xl hover:shadow-blue-500/40",
											"dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:border-blue-600 dark:hover:text-white dark:hover:shadow-blue-500/30"
										)}
										onClick={() => openEdit(row)}
									>
										<Edit2 size={16} className="transition-transform group-hover:scale-110 group-hover:-rotate-12" />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.edit")}</TooltipContent>
							</Tooltip>

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
										onClick={() => openView(row)}
									>
										<Eye size={16} className="transition-transform group-hover:scale-110" />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.view")}</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>
				),
			},
		],
		[t]
	);

	return (
		<div className="min-h-screen p-6">
			{/* Header */}
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-[rgb(var(--primary))]">{t("breadcrumb.warehouses")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
					</div>

					<Button_ size="sm" onClick={openCreate} label={t("actions.add")} tone="purple" variant="solid" icon={<Plus size={18} />} />
				</div>

				{/* Stats */}
				<div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-6">
					{stats.map((stat, index) => (
						<motion.div key={stat.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
							<InfoCard title={stat.title} value={stat.value} icon={stat.icon} bg={stat.bg} iconColor={stat.iconColor} iconBorder={stat.iconBorder} />
						</motion.div>
					))}
				</div>
			</div>

			{/* Toolbar */}
			<div className="bg-card rounded-sm p-4">
				<div className="flex items-center justify-between gap-4 mb-4">
					<div className="relative w-[300px] focus-within:w-[350px] transition-all duration-300">
						<SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("toolbar.searchPlaceholder")}
							className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
						/>
					</div>

					<Button
						variant="outline"
						className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 flex items-center gap-1 !px-4 rounded-full"
						onClick={onExport}
					>
						<FileDown size={18} className="text-[#A7A7A7]" />
						{t("toolbar.export")}
					</Button>
				</div>

				{/* Table */}
				<DataTable
					columns={columns}
					data={pager.records}
					isLoading={loading}
					pagination={{
						total_records: pager.total_records,
						current_page: pager.current_page,
						per_page: pager.per_page,
					}}
					onPageChange={handlePageChange}
					emptyState={t("empty")}
				/>
			</div>

			{/* Dialogs */}
			<WarehouseFormDialog open={formOpen} onOpenChange={setFormOpen} warehouse={editingWarehouse} onSuccess={handleFormSuccess} t={t} />

			<ViewWarehouseDialog open={viewOpen} onOpenChange={setViewOpen} warehouse={viewingWarehouse} t={t} />

			<ConfirmDialog
				open={deleteState.open}
				onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
				title={t("delete.title")}
				description={t("delete.desc")}
				confirmText={t("delete.confirm")}
				cancelText={t("delete.cancel")}
				loading={deleting}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}





