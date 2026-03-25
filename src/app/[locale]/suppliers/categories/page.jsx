"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
	Trash2,
	CalendarDays,
	ChevronLeft,
	Edit2,
	Eye,
	Loader2,
	Plus,
	Tag,
	FileText,
	Search as SearchIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
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

import api from "@/utils/api";
import toast from "react-hot-toast";
import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import { useSearchParams } from "next/navigation";
import { ActionButtons } from "@/components/atoms/Actions";
import { useAuth } from "@/context/AuthContext";

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

const makeSchema = (t) =>
	yup.object({
		name: yup.string().trim().required(t("validation.nameRequired")).max(100, t("validation.nameMax")),
		description: yup.string().trim().nullable().max(500, t("validation.descriptionMax")),
	});

function CategoryFormDialog({ open, onOpenChange, category, onSuccess, t }) {
	const schema = useMemo(() => makeSchema(t), [t]);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: {
			name: "",
			description: "",
		},
		resolver: yupResolver(schema),
	});

	// Load existing category data
	useEffect(() => {
		if (category) {
			reset({
				name: category.name || "",
				description: category.description || "",
			});
		} else {
			reset({
				name: "",
				description: "",
			});
		}
	}, [category, reset]);

	const onSubmit = async (data) => {
		try {
			const payload = {
				name: data.name.trim(),
				description: data.description?.trim() || null,
			};

			if (category) {
				await api.patch(`/supplier-categories/${category.id}`, payload);
				toast.success(t("messages.updated"));
			} else {
				await api.post("/supplier-categories", payload);
				toast.success(t("messages.created"));
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			toast.error(normalizeAxiosError(error));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl bg-white dark:bg-slate-900">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<Tag className="w-6 h-6 text-primary" />
						{category ? t("form.editTitle") : t("form.createTitle")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 ">
					{/* Name */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<Tag size={16} />
							{t("form.name")}
						</Label>
						<Input
							{...register("name")}
							placeholder={t("form.namePlaceholder")}
							className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
						/>
						{errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
							<FileText size={16} />
							{t("form.description")}
						</Label>
						<Input
							{...register("description")}
							placeholder={t("form.descriptionPlaceholder")}
							className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
						/>
						{errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
					</div>

					{/* Actions */}
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
							) : category ? (
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

function ViewCategoryDialog({ open, onOpenChange, category, t }) {
	if (!category) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl bg-white dark:bg-slate-900">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<Eye className="w-6 h-6 text-primary" />
						{t("view.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="  space-y-6">
					{/* Header */}
					<div>
						<h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{category.name}</h3>
					</div>

					{/* Info */}
					<div className="grid grid-cols-1 gap-4">
						{category.description && (
							<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
								<div className="text-xs font-semibold text-slate-500 uppercase mb-2">{t("view.description")}</div>
								<div className="text-sm text-slate-700 dark:text-slate-200">{category.description}</div>
							</div>
						)}

						<div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4">
							<div className="flex items-center gap-2 mb-2">
								<CalendarDays size={16} className="text-slate-500" />
								<span className="text-xs font-semibold text-slate-500 uppercase">{t("view.createdAt")}</span>
							</div>
							<div className="font-semibold text-slate-900 dark:text-white">
								{category.created_at ? new Date(category.created_at).toLocaleDateString("en-US") : "—"}
							</div>
						</div>
					</div>
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
			<DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-xl">
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

export default function SupplierCategoriesPage() {
	const t = useTranslations("supplierCategories");
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const searchTimer = useRef(null);
	useEffect(() => {
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
		return () => clearTimeout(searchTimer.current);
	}, [search]);

	const [loading, setLoading] = useState(false);

	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 6,
		records: [],
	});


	const [formOpen, setFormOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState(null);

	const [viewOpen, setViewOpen] = useState(false);
	const [viewingCategory, setViewingCategory] = useState(null);

	const [deleteState, setDeleteState] = useState({ open: false, id: null });
	const [deleting, setDeleting] = useState(false);

	const stats = useMemo(
		() => [
			{
				title: t("stats.totalCategories"),
				value: String(pager.total_records),
				icon: Tag,
				bg: "bg-[#F3F6FF] dark:bg-[#0B1220]",
				iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]",
				iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]",
			},
		],
		[pager, t]
	);

	useEffect(() => {
		const action = searchParams.get("action");

		if (action === "new") {
			// 1. Trigger the UI state
			setFormOpen(true);
			setEditingCategory(null); // Ensure we aren't in edit mode

			// 2. Clean up the URL
			const params = new URLSearchParams(searchParams.toString());
			params.delete("action");

			const newQuery = params.toString();
			const cleanPath = newQuery ? `${pathname}?${newQuery}` : pathname;

			// Use replace to avoid "back-button loops"
			router.replace(cleanPath, { scroll: false });
		}
	}, [searchParams, pathname, router]);

	const fetchCategories = useCallback(
		async ({ page = 1, per_page = 10 } = {}) => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				params.set("page", String(page));
				params.set("limit", String(per_page));
				if (search?.trim()) params.set("search", search.trim());
				params.set("sortBy", "created_at");
				params.set("sortOrder", "DESC");

				const res = await api.get(`/supplier-categories?${params.toString()}`);
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
		[debouncedSearch]
	);


	useEffect(() => {
		fetchCategories({ page: 1, per_page: 10 });
	}, [fetchCategories]);

	const handlePageChange = ({ page, per_page }) => {
		fetchCategories({ page, per_page });
	};

	const openCreate = () => {
		setEditingCategory(null);
		setFormOpen(true);
	};

	const openEdit = (category) => {
		setEditingCategory(category);
		setFormOpen(true);
	};

	const openView = (category) => {
		setViewingCategory(category);
		setViewOpen(true);
	};

	const handleFormSuccess = () => {
		fetchCategories({ page: pager.current_page, per_page: pager.per_page });
	};

	const confirmDelete = async () => {
		setDeleting(true);
		try {
			await api.delete(`/supplier-categories/${deleteState.id}`);
			setDeleteState({ open: false, id: null });
			await fetchCategories({ page: pager.current_page, per_page: pager.per_page });
			toast.success(t("delete.success"));
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setDeleting(false);
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
				cell: (row) => (
					<div className="flex items-center gap-2">
						<Tag size={16} className="text-primary" />
						<span>{row.name}</span>
					</div>
				),
			},
			{
				key: "description",
				header: t("table.description"),
				className: "min-w-[300px]",
				cell: (row) => <div className="text-sm text-slate-600 dark:text-slate-300">{row.description || "—"}</div>,
			},
			{
				key: "created_at",
				header: t("table.createdAt"),
				className: "min-w-[120px]",
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300 text-sm">
						<CalendarDays size={14} className="text-gray-400 dark:text-slate-500" />
						{row.created_at ? new Date(row.created_at).toLocaleDateString("en-US") : "—"}
					</div>
				),
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[140px] sticky left-0 bg-white dark:bg-slate-900",
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <Trash2 />,
								tooltip: t("actions.delete"),
								onClick: (r) => setDeleteState({ open: true, id: r.id }),
								variant: "red",
								permission: "categories.delete",
							},
							{
								icon: <Edit2 />,
								tooltip: t("actions.edit"),
								onClick: (r) => openEdit(r),
								variant: "blue",
								permission: "categories.update",
							},
							{
								icon: <Eye />,
								tooltip: t("actions.view"),
								onClick: (r) => openView(r),
								variant: "purple",
								permission: "categories.read",
							},
						]}
					/>
				),
			},
		],
		[t]
	);

	return (
		<div className="min-h-screen p-5">
			{/* Header */}
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.suppliers"), href: "/suppliers" },
					{ name: t("breadcrumb.categories") },
				]}
				buttons={
					<>
						<Button_ size="sm" onClick={openCreate} label={t("actions.add")} variant="solid" icon={<Plus size={18} />} permission="categories.create" />
					</>
				}
			/>

			{/* Toolbar & Table */}
			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={fetchCategories}
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

			{/* Dialogs */}
			<CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} onSuccess={handleFormSuccess} t={t} />

			<ViewCategoryDialog open={viewOpen} onOpenChange={setViewOpen} category={viewingCategory} t={t} />

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