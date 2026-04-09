"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Trash2,
	CalendarDays,
	ChevronLeft,
	Edit2,
	Filter,
	Eye,
	FileDown,
	X,
	Loader2,
	Plus,
	Phone,
	Mail,
	MapPin,
	User,
	Tag,
	Copy,
	Check,
	TrendingUp,
	DollarSign,
	FileText,
	ReceiptText,
	Wallet,
	Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InputPhone, { validatePhone } from "@/components/atoms/InputPhone";

import api from "@/utils/api";
import toast from "react-hot-toast";
import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export default function SuppliersPage() {
	const tCommon = useTranslations("common");
	const tCountries = useTranslations("countries");
	const t = useTranslations("suppliers");
	const router = useRouter();

	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState({ name: "", phone: "", categoryId: "" });
	const [categories, setCategories] = useState([]);
	const [stats, setStats] = useState({ totalPurchases: "0", totalDue: "0" });

	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 6,
		records: [],
	});

	const [formOpen, setFormOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState(null);

	const [viewOpen, setViewOpen] = useState(false);
	const [viewingSupplier, setViewingSupplier] = useState(null);

	const [deleteState, setDeleteState] = useState({ open: false, id: null });
	const [deleting, setDeleting] = useState(false);


	const countries = useMemo(() => {
		return (
			[
				{
					key: "EG",
					nameAr: tCountries("EG"),
					dialCode: "+20",
					placeholder: "1234567890",
					phone: { min: 10, max: 10, regex: /^(10|11|12|15)\d{8}$/ },
				},
				{
					key: "SA",
					nameAr: tCountries("SA"),
					dialCode: "+966",
					placeholder: "512345678",
					phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
				},
			] || []
		);
	}, [tCountries]);

	useEffect(() => {
		(async () => {
			try {
				const res = await api.get("/supplier-categories", { params: { limit: 200 } });
				setCategories(Array.isArray(res.data?.records) ? res.data.records : []);
			} catch (e) {
				console.error(e);
			}
		})();
	}, []);

	useEffect(() => {
		(async () => {
			try {
				const res = await api.get("/suppliers/stats");
				setStats({
					totalPurchases: res.data.totalPurchases?.toFixed(2) || "0",
					totalDue: res.data.totalDue?.toFixed(2) || "0",
				});
			} catch (e) {
				console.error(e);
			}
		})();
	}, []);

	const { formatCurrency } = usePlatformSettings()
	const statsCards = useMemo(
		() => [
			{
				name: t("stats.totalPurchases"),
				value: `${formatCurrency(stats.totalPurchases ?? 0)}`,
				icon: TrendingUp,
				color: "#6B7CFF", // blue
				sortOrder: 0,
			},
			{
				name: t("stats.totalDue"),
				value: `${formatCurrency(stats.totalDue ?? 0)}`,
				icon: DollarSign,
				color: "#F59E0B", // amber
				sortOrder: 1,
			},
		],
		[t, stats, tCommon]
	);

	const fetchSuppliers = useCallback(
		async ({ page = 1, per_page = 10 } = {}) => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				params.set("page", String(page));
				params.set("limit", String(per_page));
				if (search?.trim()) params.set("search", search.trim());
				if (filters.categoryId && filters.categoryId !== "none") params.set("categoryId", filters.categoryId);
				if (filters.name) params.set("name", filters.name);
				if (filters.phone) params.set("phone", filters.phone);
				params.set("sortBy", "created_at");
				params.set("sortOrder", "DESC");

				const res = await api.get(`/suppliers?${params.toString()}`);
				setPager({
					total_records: res.data?.total_records ?? 0,
					current_page: res.data?.current_page ?? page,
					records: res.data?.records ?? [],
				});
			} catch (e) {
				toast.error(normalizeAxiosError(e));
			} finally {
				setLoading(false);
			}
		},
		[search, filters]
	);

	useEffect(() => {
		fetchSuppliers({ page: 1, per_page: 10 });
	}, [fetchSuppliers]);

	const handlePageChange = ({ page, per_page }) => {
		fetchSuppliers({ page, per_page });
	};

	const openCreate = () => {
		setEditingSupplier(null);
		setFormOpen(true);
	};

	const openEdit = (supplier) => {
		setEditingSupplier(supplier);
		setFormOpen(true);
	};

	const openView = (supplier) => {
		setViewingSupplier(supplier);
		setViewOpen(true);
	};

	const handleFormSuccess = () => {
		fetchSuppliers({ page: pager.current_page, per_page: pager.per_page });
	};

	const confirmDelete = async () => {
		setDeleting(true);
		try {
			await api.delete(`/suppliers/${deleteState.id}`);
			setDeleteState({ open: false, id: null });
			await fetchSuppliers({ page: pager.current_page, per_page: pager.per_page });
			toast.success(t("delete.success"));
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setDeleting(false);
		}
	};

	const onExport = async () => {
		try {
			const res = await api.get("/suppliers/export", { responseType: "blob" });
			const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
			const link = document.createElement("a");
			link.href = window.URL.createObjectURL(blob);
			link.download = "suppliers.xlsx";
			link.click();
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
				key: "phone",
				header: t("table.phone"),
				className: "min-w-[180px]",
				cell: (row) => (
					<TooltipProvider>
						<div className="flex items-center gap-2">
							{row.phone && <CopyButton text={row.phone} />}
							<span className="font-[Inter] text-sm">{row.phone || "—"}</span>
						</div>
					</TooltipProvider>
				),
			},
			{
				key: "secondPhone",
				header: t("table.secondPhone"),
				className: "min-w-[180px]",
				cell: (row) =>
					row.secondPhone ? (
						<TooltipProvider>
							<div className="flex items-center gap-2">
								<CopyButton text={row.secondPhone} />
								<span className="font-[Inter] text-sm">{row.secondPhone}</span>
							</div>
						</TooltipProvider>
					) : (
						"—"
					),
			},
			{
				key: "categories",
				header: t("table.categories"),
				className: "min-w-[150px]",
				cell: (row) =>
					row.categories && row.categories.length > 0 ? (
						<div className="flex flex-wrap gap-1">
							{row.categories.slice(0, 2).map((cat) => (
								<Badge key={cat.id} className="rounded-full bg-primary/10 text-primary text-xs">
									{cat.name}
								</Badge>
							))}
							{row.categories.length > 2 && <Badge className="rounded-full bg-slate-100 text-slate-600 text-xs">+{row.categories.length - 2}</Badge>}
						</div>
					) : (
						"—"
					),
			},
			{
				key: "dueBalance",
				header: t("table.dueBalance"),
				className: "min-w-[180px]",
				cell: (row) => (
					<TooltipProvider>
						<div className="flex items-center gap-2">
							<Wallet className="size-4 text-muted-foreground" />
							<span className="font-[Inter] font-[700] text-sm">{row.dueBalance || "—"}</span>
						</div>
					</TooltipProvider>
				),
			},
			{
				key: "purchaseValue",
				header: t("table.purchaseValue"),
				className: "min-w-[180px]",
				cell: (row) => (
					<TooltipProvider>
						<div className="flex items-center gap-2">
							<ReceiptText className="size-4 text-muted-foreground" />
							<span className="font-[Inter] font-[700] text-sm">{row.purchaseValue || "—"}</span>
						</div>
					</TooltipProvider>
				),
			},
			{
				key: "options",
				header: t("table.options"),
				className: " ",
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <Edit2 />,
								tooltip: t("actions.edit"),
								onClick: (r) => openEdit(r),
								variant: "primary",
								permission: "suppliers.update",
							},
							{
								icon: <Eye />,
								tooltip: t("actions.view"),
								onClick: (r) => router.push(`/suppliers/${r.id}`),
								variant: "primary",
								permission: "suppliers.read",
							},
							{
								icon: <Trash2 />,
								tooltip: t("actions.delete"),
								onClick: (r) => setDeleteState({ open: true, id: r.id }),
								variant: "red",
								permission: "suppliers.delete",
							},
						]}
					/>
				),
			},
		],
		[t]
	);
	const hasActiveFilters = useMemo(() => {
		return (
			Boolean(filters.name?.trim()) ||
			Boolean(filters.phone?.trim()) ||
			(filters.categoryId && filters.categoryId !== "none")
		);
	}, [filters]);
	return (
		<div className="min-h-screen p-5">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.suppliers") }
				]}
				buttons={
					<>
						<Button_
							size="sm"
							href="/suppliers/categories"
							label={t("actions.manageCategories")}
							tone="white"
							variant="outline"
							icon={<Tag size={18} />}
							permission="categories.read"
						/>

						<Button_
							onClick={openCreate}
							size="sm"
							label={t("actions.addSupplier")}
							variant="solid"
							icon={<Plus size={18} />}
							permission="suppliers.create"
						/>
						<Button_ size="sm" label={t("actions.howToUse")} tone="outline" variant="ghost" icon={<Info size={15} />} permission="suppliers.read" />
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
						onClick: onExport,
						permission: "suppliers.read",
					},
				]}
				hasActiveFilters={hasActiveFilters}
				onApplyFilters={() => fetchSuppliers({ page: 1, per_page: pager.per_page })}
				filters={
					<>
						<FilterField label={t("filters.supplierName")}>
							<Input
								value={filters.name}
								onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
								placeholder={t("filters.supplierNamePlaceholder")}
								className="h-10 rounded-xl text-sm"
							/>
						</FilterField>

						<FilterField label={t("filters.phone")}>
							<Input
								value={filters.phone}
								onChange={(e) => setFilters((f) => ({ ...f, phone: e.target.value }))}
								placeholder={t("filters.phonePlaceholder")}
								className="h-10 rounded-xl text-sm"
							/>
						</FilterField>

						<FilterField label={t("filters.category")}>
							<Select
								value={filters.categoryId || "none"}
								onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.categoryPlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">{t("filters.any")}</SelectItem>
									{(categories || []).map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
				onPageChange={({ page, per_page }) => fetchSuppliers({ page, per_page })}
			/>

			<SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} supplier={editingSupplier} onSuccess={handleFormSuccess} t={t} countries={countries} />

			<ViewSupplierDialog open={viewOpen} onOpenChange={setViewOpen} supplier={viewingSupplier} t={t} />

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


const makeSchema = (t, countries) =>
	yup.object({
		name: yup.string().trim().required(t("validation.nameRequired")).max(120, t("validation.nameMax")),
		address: yup.string().trim().nullable().max(200, t("validation.addressMax")),
		description: yup.string().trim().nullable().max(255, t("validation.descriptionMax")),

		phoneCountry: yup.string().required(),
		phoneNumber: yup.string().test("phone-valid", t("validation.phoneInvalid"), function (value) {
			const country = countries.find((c) => c.key === this.parent.phoneCountry) || countries[0];
			const error = validatePhone(value, country);
			return !error;
		}),

		secondPhoneCountry: yup.string().nullable(),
		secondPhoneNumber: yup
			.string()
			.nullable()
			.test("phone-valid", t("validation.phoneInvalid"), function (value) {
				if (!value) return true;
				const country = countries.find((c) => c.key === this.parent.secondPhoneCountry) || countries[0];
				const error = validatePhone(value, country);
				return !error;
			}),

		email: yup.string().trim().nullable().email(t("validation.emailInvalid")).max(100, t("validation.emailMax")),
		categoryIds: yup.array().of(yup.number()).min(1, t("validation.categoryRequired")),
	});

function SupplierFormDialog({ open, onOpenChange, supplier, onSuccess, t, countries }) {
	const [categories, setCategories] = useState([]);
	const [loadingCategories, setLoadingCategories] = useState(false);

	const schema = useMemo(() => makeSchema(t, countries), [t, countries]);

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
			address: "",
			description: "",
			phoneCountry: "EG",
			phoneNumber: "",
			secondPhoneCountry: "EG",
			secondPhoneNumber: "",
			email: "",
			categoryIds: [],
		},
		resolver: yupResolver(schema),
	});

	const selectedCategories = watch("categoryIds") || [];

	useEffect(() => {
		(async () => {
			setLoadingCategories(true);
			try {
				const res = await api.get("/supplier-categories", { params: { limit: 200 } });
				const catsList = Array.isArray(res.data?.records) ? res.data.records : Array.isArray(res.data) ? res.data : [];
				setCategories(catsList);
			} catch (e) {
				console.error("Failed to load categories:", e);
			} finally {
				setLoadingCategories(false);
			}
		})();
	}, []);

	useEffect(() => {
		if (supplier) {
			reset({
				name: supplier.name || "",
				address: supplier.address || "",
				description: supplier.description || "",
				phoneCountry: supplier.phoneCountry || "EG",
				phoneNumber: supplier.phone || "",
				secondPhoneCountry: supplier.secondPhoneCountry || "EG",
				secondPhoneNumber: supplier.secondPhone || "",
				email: supplier.email || "",
				categoryIds: supplier.categories?.map((c) => c.id) || [],
			});
		} else {
			reset({
				name: "",
				address: "",
				description: "",
				phoneCountry: "EG",
				phoneNumber: "",
				secondPhoneCountry: "EG",
				secondPhoneNumber: "",
				email: "",
				categoryIds: [],
			});
		}
	}, [supplier, reset]);

	const onSubmit = async (data) => {
		try {
			const payload = {
				name: data.name.trim(),
				address: data.address?.trim() || null,
				description: data.description?.trim() || null,
				phone: data.phoneNumber,
				phoneCountry: data.phoneCountry,
				secondPhone: data.secondPhoneNumber || null,
				secondPhoneCountry: data.secondPhoneNumber ? data.secondPhoneCountry : null,
				email: data.email?.trim() || null,
				categoryIds: data.categoryIds,
			};

			if (supplier) {
				await api.patch(`/suppliers/${supplier.id}`, payload);
				toast.success(t("messages.updated"));
			} else {
				await api.post("/suppliers", payload);
				toast.success(t("messages.created"));
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			toast.error(normalizeAxiosError(error));
		}
	};

	const toggleCategory = (categoryId) => {
		const current = selectedCategories || [];
		if (current.includes(categoryId)) {
			setValue(
				"categoryIds",
				current.filter((id) => id !== categoryId),
				{ shouldValidate: true }
			);
		} else {
			setValue("categoryIds", [...current, categoryId], { shouldValidate: true });
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<User className="w-6 h-6 text-primary" />
						{supplier ? t("form.editTitle") : t("form.createTitle")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 ">
					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<User size={16} />
							{t("form.name")}
						</Label>
						<Input
							{...register("name")}
							placeholder={t("form.namePlaceholder")}
							className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
						/>
						{errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<MapPin size={16} />
							{t("form.address")}
						</Label>
						<Input
							{...register("address")}
							placeholder={t("form.addressPlaceholder")}
							className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
						/>
						{errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<FileText size={16} />
							{t("form.description")}
						</Label>
						<Input
							{...register("description")}
							placeholder={t("form.descriptionPlaceholder")}
							className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
						/>
						{errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
					</div>

					<InputPhone
						label={t("form.phone")}
						icon={Phone}
						control={control}
						nameCountry="phoneCountry"
						nameNumber="phoneNumber"
						error={errors.phoneNumber?.message}
					/>

					<InputPhone
						label={t("form.secondPhone")}
						icon={Phone}
						control={control}
						nameCountry="secondPhoneCountry"
						nameNumber="secondPhoneNumber"
						error={errors.secondPhoneNumber?.message}
					/>

					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<Mail size={16} />
							{t("form.email")}
						</Label>
						<Input
							{...register("email")}
							type="email"
							placeholder={t("form.emailPlaceholder")}
							dir="ltr"
							className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
						/>
						{errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
					</div>

					<div className="space-y-3">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<Tag size={16} />
							{t("form.categories")}
						</Label>

						{loadingCategories ? (
							<div className="flex items-center justify-center p-8">
								<Loader2 className="w-6 h-6 animate-spin text-primary" />
							</div>
						) : categories.length === 0 ? (
							<div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
								<Tag size={32} className="mx-auto mb-3 text-slate-300" />
								<p className="text-sm text-slate-500">{t("form.noCategories")}</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-3"
									onClick={() => window.open("/suppliers/categories?action=new", "_blank")}
								>
									{t("form.addCategoryLink")}
								</Button>
							</div>
						) : (
							<div className="flex flex-wrap gap-3">
								{categories.map((category) => (
									<motion.button
										key={category.id}
										type="button"
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => toggleCategory(category.id)}
										className={cn(
											"px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
											selectedCategories.includes(category.id)
												? "bg-primary text-white shadow-lg shadow-primary/30"
												: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300"
										)}
									>
										{category.name}
									</motion.button>
								))}
							</div>
						)}

						{errors.categoryIds && <p className="text-xs text-red-600">{errors.categoryIds.message}</p>}
					</div>

					<div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="rounded-xl">
							{t("form.cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
									{t("form.saving")}
								</>
							) : supplier ? (
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

function CopyButton({ text }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					onClick={handleCopy}
					className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
				>
					{copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />}
				</button>
			</TooltipTrigger>
			<TooltipContent>{copied ? "تم النسخ!" : "نسخ"}</TooltipContent>
		</Tooltip>
	);
}

function ViewSupplierDialog({ open, onOpenChange, supplier, t }) {
	const tCommon = useTranslations("common");
	if (!supplier) return null;
	const { formatCurrency } = usePlatformSettings()
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-3xl  max-h-[90vh] overflow-y-auto">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<Eye className="w-6 h-6 text-primary" />
						{t("view.title")}
					</DialogTitle>
				</DialogHeader>

				<div className=" space-y-6">
					<div>
						<h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{supplier.name}</h3>
						{supplier.categories && supplier.categories.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{supplier.categories.map((cat) => (
									<Badge key={cat.id} className="rounded-full bg-primary/10 text-primary border border-primary/20">
										{cat.name}
									</Badge>
								))}
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
							<div className="flex items-center gap-2 mb-2">
								<Phone size={16} className="text-slate-500" />
								<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.phone")}</span>
							</div>
							<div className="font-semibold text-slate-900 dark:text-white font-[Inter]">{supplier.phone || "—"}</div>
						</div>

						{supplier.secondPhone && (
							<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
								<div className="flex items-center gap-2 mb-2">
									<Phone size={16} className="text-slate-500" />
									<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.secondPhone")}</span>
								</div>
								<div className="font-semibold text-slate-900 dark:text-white font-[Inter]">{supplier.secondPhone}</div>
							</div>
						)}

						{supplier.email && (
							<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
								<div className="flex items-center gap-2 mb-2">
									<Mail size={16} className="text-slate-500" />
									<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.email")}</span>
								</div>
								<div className="font-semibold text-slate-900 dark:text-white">{supplier.email}</div>
							</div>
						)}

						{supplier.address && (
							<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
								<div className="flex items-center gap-2 mb-2">
									<MapPin size={16} className="text-slate-500" />
									<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.address")}</span>
								</div>
								<div className="font-semibold text-slate-900 dark:text-white">{supplier.address}</div>
							</div>
						)}

						<div className="rounded-xl border-2 border-green-200 dark:border-green-700 p-4 bg-green-50 dark:bg-green-900/20">
							<div className="flex items-center gap-2 mb-2">
								<DollarSign size={16} className="text-green-600" />
								<span className="text-xs font-semibold text-green-600 uppercase">{t("view.purchaseValue")}</span>
							</div>
							<div className="font-bold text-lg text-green-700 dark:text-green-400">{formatCurrency(supplier.purchaseValue || 0)}</div>
						</div>

						<div className="rounded-xl border-2 border-orange-200 dark:border-orange-700 p-4 bg-orange-50 dark:bg-orange-900/20">
							<div className="flex items-center gap-2 mb-2">
								<TrendingUp size={16} className="text-orange-600" />
								<span className="text-xs font-semibold text-orange-600 uppercase">{t("view.dueBalance")}</span>
							</div>
							<div className="font-bold text-lg text-orange-700 dark:text-orange-400">{formatCurrency(supplier.dueBalance || 0)}</div>
						</div>

						<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
							<div className="flex items-center gap-2 mb-2">
								<CalendarDays size={16} className="text-slate-500" />
								<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.createdAt")}</span>
							</div>
							<div className="font-semibold text-slate-900 dark:text-white">
								{supplier.created_at ? new Date(supplier.created_at).toLocaleDateString("en-US") : "—"}
							</div>
						</div>
					</div>

					{supplier.description && (
						<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
							<div className="text-xs font-semibold text-slate-500 uppercase mb-2">{t("view.description")}</div>
							<div className="text-sm text-slate-700 dark:text-slate-200">{supplier.description}</div>
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
			<DialogContent className="!max-w-md rounded-xl">
				<div className="space-y-4 ">
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

function SuppliersTableToolbar({ t, searchValue, onSearchChange, onExport, isFiltersOpen, onToggleFilters }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="relative w-[300px] focus-within:w-[350px] transition-all duration-300">
				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={t("toolbar.searchPlaceholder")}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					className={cn("bg-gray-50 dark:bg-slate-800 flex items-center gap-1 !px-4 rounded-full", isFiltersOpen && "border-primary/50")}
					onClick={onToggleFilters}
				>
					<Filter size={18} className="text-[#A7A7A7]" />
					{t("toolbar.filter")}
				</Button>

				<Button variant="outline" className="bg-gray-50 dark:bg-slate-800 flex items-center gap-1 !px-4 rounded-full" onClick={onExport}>
					<FileDown size={18} className="text-[#A7A7A7]" />
					{t("toolbar.export")}
				</Button>
			</div>
		</div>
	);
}

function FiltersPanel({ t, value, onChange, onApply, categories }) {
	return (
		<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
			<div className="main-card !p-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
					<div className="space-y-2">
						<Label>{t("filters.supplierName")}</Label>
						<Input
							value={value.name}
							onChange={(e) => onChange({ ...value, name: e.target.value })}
							placeholder={t("filters.supplierNamePlaceholder")}
							className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.phone")}</Label>
						<Input
							value={value.phone}
							onChange={(e) => onChange({ ...value, phone: e.target.value })}
							placeholder={t("filters.phonePlaceholder")}
							className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.category")}</Label>
						<Select value={value.categoryId || ""} onValueChange={(v) => onChange({ ...value, categoryId: v })}>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.categoryPlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">{t("filters.any")}</SelectItem>
								{(categories || []).map((c) => (
									<SelectItem key={c.id} value={String(c.id)}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex md:justify-end">
						<Button_ onClick={onApply} size="sm" label={t("filters.apply")} tone="primary" variant="solid" icon={<Filter size={18} />} />
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
