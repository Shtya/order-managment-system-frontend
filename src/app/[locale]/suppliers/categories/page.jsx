"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { useRouter } from "@/i18n/navigation";
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
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

        <div className="p-6 space-y-6">
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
                {category.created_at ? new Date(category.created_at).toLocaleDateString("ar-EG") : "—"}
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
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-2xl">
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

export default function SupplierCategoriesPage() {
  const t = useTranslations("supplierCategories");
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 10,
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
    [search]
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
            <button onClick={() => router.push("/suppliers")} className="text-gray-400 hover:text-primary transition-colors">
              {t("breadcrumb.suppliers")}
            </button>
            <ChevronLeft className="text-gray-400" size={18} />
            <span className="text-[rgb(var(--primary))]">{t("breadcrumb.categories")}</span>
            <span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
          </div>

          <Button_ size="sm" onClick={openCreate} label={t("actions.add")} tone="purple" variant="solid" icon={<Plus size={18} />} />
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,300px))] gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
              <InfoCard title={stat.title} value={stat.value} icon={stat.icon} bg={stat.bg} iconColor={stat.iconColor} iconBorder={stat.iconBorder} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Toolbar & Table */}
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
        </div>

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