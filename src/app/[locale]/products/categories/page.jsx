"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	CalendarDays,
	Copy,
	Edit2,
	Eye,
	Loader2,
	Lock,
	Layers,
	Plus,
	Tag,
	Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";
import toast from "react-hot-toast";
import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import { ActionButtons } from "@/components/atoms/Actions";
import Button_ from "@/components/atoms/Button";
import SlugInput from "@/components/atoms/SlugInput";
import { useSlugify } from "@/components/atoms/SlugInput";
import { useAuth } from "@/context/AuthContext";
import { baseImg } from "@/utils/axios";
import { Badge } from "@/components/ui/badge";
import { ImageUploadBox, makeId } from "@/components/atoms/ImageUploadBox";
import { avatarSrc } from "@/components/atoms/UserSelect";

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

const createCategorySchema = (t) =>
	yup.object({
		name: yup
			.string()
			.trim()
			.max(160, t("validation.nameMax", { max: 160 }))
			.required(t("validation.nameRequired")),
		slug: yup
			.string()
			.trim()
			.max(200, t("validation.slugMax", { max: 200 }))
			.required(t("validation.slugRequired"))
			.matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("validation.slugInvalid")),
	});

function ConfirmDialog({ open, onOpenChange, title, description, confirmText, cancelText, onConfirm, loading = false, variant = "destructive" }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-xl">
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
					{description && <p className="text-sm text-gray-500 dark:text-slate-400 whitespace-pre-wrap">{description}</p>}
					<div className="flex items-center justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
							{cancelText}
						</Button>
						<Button variant={variant} onClick={onConfirm} disabled={loading}>
							{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function CategoryFormDialog({ open, onOpenChange, category, onSuccess }) {
	const t = useTranslations("categories");
	const schema = useMemo(() => createCategorySchema(t), [t]);
	const { user } = useAuth();
	const [slugStatus, setSlugStatus] = useState(null);
	const [imageFiles, setImageFiles] = useState([]);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
		setValue,
		watch,
	} = useForm({
		defaultValues: { name: "", slug: "" },
		resolver: yupResolver(schema),
		mode: "onTouched",
	});

	const slug = watch("slug");
	const name = watch("name");

	useEffect(() => {
		if (category) {
			reset({ name: category.name ?? "", slug: category.slug ?? "" });
			if (category.image) {
				setImageFiles([{
					id: makeId(),
					url: category.image,
					isExisting: true,
					uploadStatus: 'success'
				}]);
			} else {
				setImageFiles([]);
			}
		} else {
			reset({ name: "", slug: "" });
			setImageFiles([]);
		}
		setSlugStatus(null);
	}, [category, reset, open]);

	useEffect(() => {
		if (!slug || errors.slug) {
			setSlugStatus(null);
			return;
		}
		const id = setTimeout(async () => {
			setSlugStatus("checking");
			try {
				const params = new URLSearchParams({ slug: slug.trim() });
				if (category?.id) params.append("category", category.id.toString());
				const res = await api.get(`/categories/check-slug?${params}`);
				setSlugStatus(res.data.isUnique ? "unique" : "taken");
			} catch {
				setSlugStatus(null);
			}
		}, 280);
		return () => clearTimeout(id);
	}, [slug, errors.slug, category?.id]);

	const onSubmit = async (values) => {
		try {
			const fd = new FormData();
			fd.append('name', values.name);
			fd.append('slug', values.slug);

			// Handle image upload if there's a new file
			const newFile = imageFiles.find(f => !f.isExisting && !f.isFromLibrary);
			if (newFile) {
				fd.append('image', newFile.file);
			} else if (imageFiles.length === 0) {
				fd.append('removeImage', 'true');
			}

			if (category?.id) {
				await api.patch(`/categories/${category.id}`, fd, {
					headers: { 'Content-Type': 'multipart/form-data' }
				});
				toast.success(t("toast.updated"));
			} else {
				await api.post("/categories", fd, {
					headers: { 'Content-Type': 'multipart/form-data' }
				});
				toast.success(t("toast.created"));
			}
			onSuccess();
			onOpenChange(false);
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<Tag className="w-6 h-6 text-primary" />
						{category ? t("form.editTitle") : t("form.createTitle")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
					<div className="grid grid-cols-1  gap-6">
						<div className="space-y-2">
							<Label className="text-sm font-semibold">{t("form.name")}</Label>
							<Input {...register("name")} placeholder={t("form.namePlaceholder")} className="rounded-xl h-[50px]" />
							{errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
						</div>
						<SlugInput errors={errors} register={register} name={name} slugStatus={slugStatus} slug={slug} setValue={setValue} className="h-[50px]" />

						<div className="space-y-2">
							<Label className="text-sm font-semibold">{t("form.image") || "Image"}</Label>
							<ImageUploadBox
								title={t("form.imageUpload") || "Category Image"}
								files={imageFiles}
								onFilesChange={setImageFiles}
								multiple={false}
								uploadMode="local"
								className="h-full"
							/>
						</div>
					</div>


					<div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="rounded-xl">
							{t("form.cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting || slugStatus === 'taken'} className="rounded-xl bg-primary hover:bg-primary/90">
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
									{t("form.saving")}
								</>
							) : (
								t("form.save")
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
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Eye className="w-5 h-5 text-primary" />
						{t("view.title")}
					</DialogTitle>
				</DialogHeader>
				<div className="flex gap-6">
					<div className="w-32 h-32 rounded-xl border overflow-hidden flex items-center justify-center bg-primary/5 border-primary/20 shrink-0">
						{avatarSrc(category?.image) ? (
							<img src={avatarSrc(category?.image)} alt="" className="w-full h-full object-cover" />
						) : (
							<Layers size={32} className="text-primary" />
						)}
					</div>
					<div className="space-y-3 flex-1">
						<div>
							<p className="text-xs text-muted-foreground">{t("view.name")}</p>
							<p className="font-semibold">{category.name}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("view.slug")}</p>
							<p className="font-mono text-sm">/{category.slug}</p>
						</div>
						{category.created_at && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CalendarDays size={14} />
								{new Date(category.created_at).toLocaleDateString()}
							</div>
						)}
					</div>
				</div>
				<div className="flex justify-end pt-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("view.close")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default function CategoriesPage() {
	const t = useTranslations("categories");
	const { generateSlug } = useSlugify();
	const [loading, setLoading] = useState(false);
	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 12,
		records: [],
	});

	const [formOpen, setFormOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState(null);
	const [viewOpen, setViewOpen] = useState(false);
	const [viewingCategory, setViewingCategory] = useState(null);

	const [deleteState, setDeleteState] = useState({ open: false, id: null, name: "" });
	const [deleting, setDeleting] = useState(false);

	const [duplicateState, setDuplicateState] = useState({ open: false, category: null });
	const [duplicating, setDuplicating] = useState(false);


	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const searchTimer = useRef(null);
	useEffect(() => {
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
		return () => clearTimeout(searchTimer.current);
	}, [search]);

	const fetchCategories = useCallback(async ({ page = 1, per_page = 12 } = {}) => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("page", String(page));
			params.set("limit", String(per_page));
			params.set("sortBy", "created_at");
			params.set("sortOrder", "DESC");
			params.set("search", debouncedSearch);
			const res = await api.get(`/categories?${params.toString()}`);
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
	}, [debouncedSearch]);

	useEffect(() => {
		fetchCategories(1, pager.per_page);
	}, [debouncedSearch]);


	useEffect(() => {
		fetchCategories({ page: 1, per_page: 12 });
	}, [fetchCategories]);

	const handlePageChange = ({ page, per_page }) => {
		fetchCategories({ page, per_page });
	};

	const openCreate = () => {
		setEditingCategory(null);
		setFormOpen(true);
	};

	const openEdit = (cat) => {
		if (cat?.adminId == null) {
			toast.error(t("global.lockedToast"));
			return;
		}
		setEditingCategory(cat);
		setFormOpen(true);
	};

	const openView = (cat) => {
		setViewingCategory(cat);
		setViewOpen(true);
	};

	const handleFormSuccess = () => {
		fetchCategories({ page: pager.current_page, per_page: pager.per_page });
	};

	const confirmDelete = async () => {
		setDeleting(true);
		try {
			await api.delete(`/categories/${deleteState.id}`);
			setDeleteState({ open: false, id: null, name: "" });
			await fetchCategories({ page: pager.current_page, per_page: pager.per_page });
			toast.success(t("toast.deleted"));
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setDeleting(false);
		}
	};

	const runDuplicate = async () => {
		const cat = duplicateState.category;
		if (!cat) return;
		setDuplicating(true);
		try {
			const newName = t("duplicate.copyName", { name: cat.name });
			const newSlug = await generateSlug(newName);
			await api.post(`/categories/${cat.id}/duplicate`, {
				name: newName,
				slug: newSlug || `copy-${cat.slug}-${Date.now()}`
			});
			setDuplicateState({ open: false, category: null });
			await fetchCategories({ page: pager.current_page, per_page: pager.per_page });
			toast.success(t("toast.duplicated"));
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setDuplicating(false);
		}
	};

	const requestDuplicate = (cat) => {
		setDuplicateState({ open: true, category: cat });
	};

	const imgSrc = (cat) => {
		if (!cat?.image) return null;
		const u = cat.image;
		return u.startsWith("http") ? u : `${baseImg}${u}`;
	};

	const columns = useMemo(
		() => [
			// {
			// 	key: "id",
			// 	header: t("table.id"),
			// 	className: "font-semibold text-primary w-[72px]",
			// },
			{
				key: "image",
				header: "",
				type: "img",
				className: "w-14",
				cell: (row) => (
					<div className="w-10 h-10 rounded-lg border overflow-hidden flex items-center justify-center bg-primary/5 border-primary/20">
						{avatarSrc(row?.image) ? (
							<img src={avatarSrc(row?.image)} alt="" className="w-full h-full object-cover" />
						) : (
							<Layers size={16} className="text-primary" />
						)}
					</div>
				),
			},
			{
				key: "name",
				header: t("table.name"),
				className: "min-w-[180px]",
				cell: (row) => (
					<div className="flex items-center gap-2 flex-wrap">
						<span className="font-semibold text-gray-800 dark:text-slate-100">{row.name}</span>
						{row?.adminId == null && (
							<Badge variant="secondary" className="text-[10px] gap-1">
								<Lock size={10} />
								{t("global.badge")}
							</Badge>
						)}
					</div>
				),
			},
			{
				key: "slug",
				header: t("table.slug"),
				className: "min-w-[140px] font-mono text-sm text-muted-foreground",
				cell: (row) => <span>/{row.slug}</span>,
			},
			{
				key: "created_at",
				header: t("table.createdAt"),
				className: "min-w-[120px]",
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
						<CalendarDays size={14} />
						{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
					</div>
				),
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[160px] sticky left-0 bg-white dark:bg-slate-900",
				cell: (row) => {
					const isGlobal = row?.adminId == null;
					return (
						<ActionButtons
							row={row}
							actions={[
								{
									icon: <Eye />,
									tooltip: t("actions.view"),
									onClick: (r) => openView(r),
									variant: "primary",
									permission: "categories.read",
								},
								{
									icon: <Edit2 />,
									tooltip: isGlobal ? t("global.lockedHint") : t("actions.edit"),
									onClick: (r) => openEdit(r),
									variant: "primary",
									permission: "categories.update",
									disabled: isGlobal,
								},
								{
									icon: <Copy />,
									tooltip: t("actions.duplicate"),
									onClick: (r) => requestDuplicate(r),
									variant: "slate",
									permission: "categories.create",
								},
								{
									icon: <Trash2 />,
									tooltip: isGlobal ? t("global.lockedHint") : t("actions.delete"),
									onClick: (r) => {
										if (r?.adminId == null) {
											toast.error(t("global.lockedToast"));
											return;
										}
										setDeleteState({ open: true, id: r.id, name: r.name });
									},
									variant: "red",
									permission: "categories.delete",
									disabled: isGlobal,
								},
							]}
						/>
					);
				},
			},
		],
		[t]
	);

	return (
		<div className="min-h-screen p-5">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/dashboard" },
					{ name: t("breadcrumb.products"), href: "/products" },
					{ name: t("breadcrumb.categories") },
				]}
				buttons={
					<Button_ size="sm" onClick={openCreate} label={t("actions.add")} variant="solid" icon={<Plus size={18} />} permission="categories.create" />
				}
			/>

			<Table
				columns={columns}
				data={pager.records}
				isLoading={loading}
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={fetchCategories}
				pagination={{
					total_records: pager.total_records,
					current_page: pager.current_page,
					per_page: pager.per_page,
				}}
				onPageChange={handlePageChange}
				emptyState={t("empty")}
			/>

			<CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} onSuccess={handleFormSuccess} />

			<ViewCategoryDialog open={viewOpen} onOpenChange={setViewOpen} category={viewingCategory} t={t} />

			<ConfirmDialog
				open={deleteState.open}
				onOpenChange={(open) => !open && setDeleteState({ open: false, id: null, name: "" })}
				title={t("delete.title")}
				description={t("delete.description", { name: deleteState.name })}
				confirmText={t("delete.confirm")}
				cancelText={t("delete.cancel")}
				loading={deleting}
				onConfirm={confirmDelete}
				variant="destructive"
			/>

			<ConfirmDialog
				open={duplicateState.open}
				onOpenChange={(open) => !open && setDuplicateState({ open: false, category: null })}
				title={t("duplicate.title")}
				description={duplicateState.category ? t("duplicate.description", { name: duplicateState.category.name }) : ""}
				confirmText={t("duplicate.confirm")}
				cancelText={t("duplicate.cancel")}
				loading={duplicating}
				onConfirm={runDuplicate}
				variant="default"
			/>
		</div>
	);
}
