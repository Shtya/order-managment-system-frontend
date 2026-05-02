"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  User,
  Image as ImageIcon,
  X,
  Megaphone,
  Box,
  Truck,
  Building2,
  Wallet,
  MoreHorizontal,
  Loader2,
  Download,
  Settings2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ActionButtons } from "@/components/atoms/Actions";
import api from "@/utils/api";
import { useExport } from "@/hook/useExport";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { avatarSrc } from "@/components/atoms/UserSelect";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { useDebounce } from "@/hook/useDebounce";

// Category configuration
export const CATEGORY_CONFIG = {
  ads: { icon: Megaphone, color: "text-purple-500 bg-purple-50", iconColor: "#a855f7" },
  packaging: { icon: Box, color: "text-orange-500 bg-orange-50", iconColor: "#f97316" },
  transport: { icon: Truck, color: "text-blue-500 bg-blue-50", iconColor: "#3b82f6" },
  office: { icon: Building2, color: "text-emerald-500 bg-emerald-50", iconColor: "#10b981" },
  salaries: { icon: Wallet, color: "text-rose-500 bg-rose-50", iconColor: "#f43f5e" },
  other: { icon: MoreHorizontal, color: "text-slate-500 bg-slate-50", iconColor: "#64748b" },
};

const createManualExpenseSchema = (t) =>
  yup.object({
    amount: yup
      .number()
      .typeError(t("manualExpenses.validation.amountNumber"))
      .required(t("manualExpenses.validation.amountRequired"))
      .positive(t("manualExpenses.validation.amountPositive")),
    collectionDate: yup.date().required(t("manualExpenses.validation.dateRequired")),
    categoryId: yup
      .string()
      .notOneOf(["none"], t("manualExpenses.form.selectCategoryError"))
      .required(t("manualExpenses.form.selectCategoryError")),
    safeId: yup
      .string()
      .notOneOf(["none"], t("manualExpenses.form.selectSafeError") || "Please select a safe")
      .required(t("manualExpenses.form.selectSafeError") || "Please select a safe"),
    description: yup.string().required(t("manualExpenses.validation.descriptionRequired")),
    attachment: yup.mixed().nullable(),
  });

// --- Form Component (Exported) ---
export function ManualExpenseFormModal({ open, onOpenChange, editingExpense, onSave, categories }) {
  const t = useTranslations("accounts");
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [safes, setSafes] = useState([]);

  useEffect(() => {
    if (open) {
      const fetchSafes = async () => {
        try {
          const res = await api.get('/safes/accounts', { params: { limit: 200 } });
          setSafes(res.data.records || []);
        } catch (err) {
          console.error("Error fetching safes:", err);
        }
      };
      fetchSafes();
    }
  }, [open]);

  const schema = useMemo(() => createManualExpenseSchema(t), [t]);

  const getDefaultValues = useCallback(() => {
    if (editingExpense) {
      return {
        amount: Math.abs(editingExpense.amount),
        collectionDate: new Date(editingExpense.collectionDate),
        categoryId: String(editingExpense.categoryId || "none"),
        safeId: String(editingExpense.safeId || "none"),
        description: editingExpense.description || "",
        attachment: editingExpense.attachment || null,
      };
    }
    return {
      amount: "",
      collectionDate: new Date(),
      categoryId: "none",
      safeId: "none",
      description: "",
      attachment: null,
    };
  }, [editingExpense]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: getDefaultValues(),
  });

  const attachment = watch("attachment");


  useEffect(() => {
    if (open) {
      reset(getDefaultValues());
    }
  }, [editingExpense, open, reset, getDefaultValues]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("amount", String(data.amount));
      payload.append("categoryId", String(data.categoryId));
      if(data.safeId !== 'none')
      payload.append("safeId", String(data.safeId));
      payload.append("collectionDate", data.collectionDate?.toISOString());
      payload.append("description", data.description || "");

      if (data.attachment instanceof File) {
        payload.append("attachment", data.attachment);
      }

      if (editingExpense) {
        await api.patch(`/expenses/${editingExpense.id}`, payload);
        toast.success(t("manualExpenses.messages.updated"));
      } else {
        await api.post("/expenses", payload);
        toast.success(t("manualExpenses.messages.created"));
      }

      onSave?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving expense:", err);
      toast.error(err?.response?.data?.message || t("manualExpenses.messages.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error(t("manualExpenses.validation.fileTooLarge"));
      e.target.value = "";
      return;
    }

    setValue("attachment", file, { shouldValidate: true });
  };

  // Determine the image source
  const getPreviewSrc = () => {
    if (!attachment) return null;

    // Case 1: Local File object (just selected)
    if (attachment instanceof File) {
      return URL.createObjectURL(attachment);
    }

    // Case 2: Server string (editing existing)
    // Use your existing avatarSrc helper
    return avatarSrc(attachment);
  };

  const previewSrc = getPreviewSrc();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {editingExpense ? <Pencil size={20} /> : <Plus size={20} />}
            </div>
            {editingExpense ? t("manualExpenses.actions.edit") : t("manualExpenses.actions.add")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("manualExpenses.form.amount")}</Label>
              <div className="relative">
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      className={cn("theme-field pl-8", errors.amount && "border-red-500")}
                      placeholder="0.00"
                    />
                  )}
                />
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("manualExpenses.form.date")}</Label>
              <div className="relative">
                <Controller
                  control={control}
                  name="collectionDate"
                  render={({ field }) => (
                    <DateRangePicker
                      mode="single"
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      staticShow={true}
                      dataSize="default"
                      className={cn("theme-field w-full pl-9", errors.collectionDate && "border-red-500")}
                    />
                  )}
                />
              </div>
              {errors.collectionDate && <p className="text-xs text-red-500">{errors.collectionDate.message}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("manualExpenses.form.category")}</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn("theme-field", errors.categoryId && "border-red-500")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          <div className="flex items-center gap-2">
                            <Plus size={14} className="text-primary" />
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>

            {/* Safe */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("manualExpenses.form.safe") || "Safe"}</Label>
              <Controller
                control={control}
                name="safeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn("theme-field", errors.safeId && "border-red-500")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {safes?.map((safe) => (
                        <SelectItem key={safe.id} value={String(safe.id)}>
                          <div className="flex items-center gap-2">
                            <Wallet size={14} className="text-primary" />
                            <span>{safe.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.safeId && <p className="text-xs text-red-500">{errors.safeId.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">{t("manualExpenses.form.description")}</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  className={cn("theme-field min-h-[100px] resize-none", errors.description && "border-red-500")}
                  placeholder="..."
                />
              )}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">{t("manualExpenses.form.attachment")}</Label>
            <div
              onClick={handleDivClick}
              className={`relative group border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${previewSrc ? "border-primary/20 aspect-video" : "border-border p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50"
                }`}
            >
              {previewSrc ? (
                <>
                  {/* Preview Image */}
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                    <Pencil size={24} />
                    <span className="text-xs font-bold">{t("manualExpenses.form.changeAttachment")}</span>
                    {attachment instanceof File && (
                      <span className="text-[10px] bg-black/50 px-2 py-1 rounded-full max-w-[80%] truncate">
                        {attachment.name}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                /* Empty State / Upload Placeholder */
                <>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("manualExpenses.form.upload")}
                  </span>
                </>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              {t("manualExpenses.form.cancel")}
            </Button>
            <Button type="submit" className="rounded-xl px-8" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : t("manualExpenses.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Delete Alert Component (Exported) ---
export function DeleteManualExpenseAlert({ open, onOpenChange, onConfirm }) {
  const t = useTranslations("accounts.manualExpenses.deleteAlert");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Error deleting expense:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
            <AlertCircle size={24} />
          </div>
          <AlertDialogTitle className="text-xl font-black">{t("title")}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium leading-relaxed">
            {t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-4">
          <AlertDialogCancel className="rounded-xl mt-0">{t("cancel")}</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-8"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// --- Main Tab Component ---
export default function ManualExpensesTab({
  categories,
  refreshCategories
}) {
  const tOrders = useTranslations("orders");
  const t = useTranslations("accounts");
  const [search, setSearch] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Modals State
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // API Data State
  const [expenses, setExpenses] = useState([]);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
  });

  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: "none",
    startDate: null,
    endDate: null
  });


  const { debouncedValue: debouncedSearch } = useDebounce({
    value: search,
    delay: 300,
  });

  const { handleExport, exportLoading } = useExport();

  const fetchExpenses = async (page = pager.current_page, per_page = pager.per_page,) => {

    setLoading(true);
    try {
      const params = {
        page,
        limit: per_page,
        search: debouncedSearch.trim() || undefined,
        categoryId: filters.categoryId !== "none" ? filters.categoryId : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };
      const { data } = await api.get("/expenses", { params });
      setExpenses(data.records || []);
      setPager({
        total_records: data.total_records || 0,
        current_page: data.current_page || page,
        per_page: data.per_page || limit,
      });
    } catch (err) {
      console.error("Error fetching expenses:", err);
      toast.error(t("manualExpenses.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  };


  const applyFilters = () => {
    fetchExpenses(1, pager.per_page);
  };

  useEffect(() => {
    fetchExpenses();
  }, [debouncedSearch]);

  const handleAdd = () => {
    setEditingExpense(null);
    setAddEditModalOpen(true);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setAddEditModalOpen(true);
  };

  const handleDelete = (expense) => {
    setEditingExpense(expense);
    setDeleteAlertOpen(true);
  };

  const handlePageChange = ({ page, per_page }) => {
    fetchExpenses(page, per_page);
  };

  const onExport = async () => {
    const params = {
      search: search.trim() || undefined,
      categoryId: filters.categoryId !== "none" ? filters.categoryId : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    };

    await handleExport({
      endpoint: "/expenses/export",
      params,
      filename: `manual_expenses_${Date.now()}.xlsx`,
    });
  };

  const columns = useMemo(() => [
    {
      key: "collectionDate",
      header: t("manualExpenses.columns.date"),
      cell: (row) => <span className="text-xs font-medium">{new Date(row.collectionDate).toLocaleDateString()}</span>
    },
    {
      key: "category",
      header: t("manualExpenses.columns.category"),
      cell: (row) => {
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary")}>
              <Tag size={14} />
            </div>
            <span className="text-xs font-bold">{row.category?.name || t("common.none")}</span>
          </div>
        );
      }
    },
    {
      key: "description",
      header: t("manualExpenses.columns.description"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">
          {row.description}
        </span>
      )
    },
    {
      key: "amount",
      header: t("manualExpenses.columns.amount"),
      cell: (row) => (
        <span className="text-sm font-black text-red-600 tabular-nums">
          -{Number(row.amount).toLocaleString()}
        </span>
      )
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
      key: "createdByUserId",
      header: t("manualExpenses.columns.addedBy"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <User size={12} className="text-muted-foreground" />
          </div>
          <span className="text-xs font-semibold">{row.user?.name || t("common.none")}</span>
        </div>
      )
    },
    {
      key: "attachment",
      header: t("manualExpenses.columns.attachment"),
      type: "imgs"

    },
    {
      key: "actions",
      header: t("manualExpenses.columns.actions"),
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            {
              icon: <Eye />,
              tooltip: t("manualExpenses.actions.view"),
              onClick: (r) => setSelectedExpense(r),
              variant: "primary",
            },
            {
              icon: <Pencil />,
              tooltip: t("manualExpenses.actions.edit"),
              onClick: (r) => handleEdit(r),
              disabled: !!row.monthlyClosingId,
              variant: "primary",
            },
            {
              icon: <Trash2 />,
              tooltip: t("manualExpenses.actions.delete"),
              onClick: (r) => handleDelete(r),
              disabled: !!row.monthlyClosingId,
              variant: "rose",
            },
          ]}
        />
      )
    }
  ], [t]);


  return (
    <div className="space-y-5">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          apply: tOrders("filters.apply"),
          total: tOrders("pagination.total"),
          limit: tOrders("pagination.limit"),
          emptyTitle: tOrders("empty"),
          emptySubtitle: tOrders("emptySubtitle"),
        }}
        columns={columns}
        data={expenses}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
        hasActiveFilters={Object.values(filters).some(
          (v) => v && v !== "all" && v !== null,
        )}
        onApplyFilters={applyFilters}
        filters={
          <>
            <FilterField label={t("manualExpenses.form.category")}>
              <Select
                value={filters.categoryId}
                onValueChange={(v) => setFilters({ ...filters, categoryId: v })}
              >
                <SelectTrigger className="h-9 rounded-lg border-dashed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.all")}</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.dateRange")}>
              <DateRangePicker
                value={filters}
                onChange={(newDates) => setFilters(f => ({ ...f, ...newDates }))}
                placeholder={t("filters.dateRangePlaceholder")}
              />
            </FilterField>
          </>
        }
        isLoading={loading}
        actions={[
          {
            key: "add",
            label: t("manualExpenses.actions.add"),
            icon: <Plus size={14} />,
            color: "primary",
            onClick: handleAdd,
            permission: "orders.create",
          },
          {
            key: "export",
            label: t("export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "orders.read",
          },

        ]}
      />

      {/* View Modal */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="text-primary" size={20} />
              {t("manualExpenses.actions.view")}
            </DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6 py-4">
              {/* Amount & Date Header */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-2xl border border-border flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400">{t("manualExpenses.columns.amount")}</span>
                  <span className="text-2xl font-black text-red-600">-{Number(selectedExpense.amount).toLocaleString()}ج</span>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border border-border flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("manualExpenses.columns.date")}</span>
                  <span className="text-sm font-bold">{new Date(selectedExpense.collectionDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description Box (Orange as requested) */}
              <div className="p-3 bg-muted/30 rounded-2xl border border-border flex flex-col justify-center group">

                <div className="relative z-10 space-y-2">
                  <span className="text-xs font-bold text-muted-foreground">{t("manualExpenses.columns.description")}</span>
                  <p className="text-sm font-bold text-orange-900 leading-relaxed">
                    {selectedExpense.description}
                  </p>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                      <Tag size={14} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{t("manualExpenses.columns.category")}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border shadow-sm">
                    <Tag size={12} className="text-primary" />
                    <span className="text-xs font-black">{selectedExpense.category?.name || t("common.none")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                      <Wallet size={14} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{t("manualExpenses.columns.safe") || "Safe"}</span>
                  </div>
                  <span className="text-xs font-black">{selectedExpense.safe?.name || t("common.none")}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                      <User size={14} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{t("manualExpenses.columns.addedBy")}</span>
                  </div>
                  <span className="text-xs font-black">{selectedExpense.user?.name || t("common.none")}</span>
                </div>

                {selectedExpense.attachment && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">{t("manualExpenses.form.attachment")}</span>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-muted/30 group">
                      <img
                        src={avatarSrc(selectedExpense.attachment)}
                        alt="Attachment"
                        className="w-full h-full object-cover"
                      />

                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Modals */}
      <ManualExpenseFormModal
        open={addEditModalOpen}
        onOpenChange={setAddEditModalOpen}
        editingExpense={editingExpense}
        categories={categories}
        onSave={fetchExpenses}
      />

      <DeleteManualExpenseAlert
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={async () => {
          try {
            await api.delete(`/expenses/${editingExpense.id}`);
            toast.success(t("manualExpenses.messages.deleted"));
            fetchExpenses();
          } catch (err) {
            console.error("Error deleting expense:", err);
            toast.error(err?.response?.data?.message || t("manualExpenses.messages.deleteError"));
            throw err;
          }
        }}
      />
    </div>
  );
}


// --- Category Form Modal (Exported) ---
export function CategoryFormModal({ open, onOpenChange, editingCategory, onSave }) {
  const t = useTranslations("accounts.manualExpenses");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || "",
        description: editingCategory.description || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
      });
    }
  }, [editingCategory, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCategory) {
        await api.patch(`/expense-categories/${editingCategory.id}`, formData);
        toast.success(t("messages.categoryUpdated") || "Category updated successfully");
      } else {
        await api.post("/expense-categories", formData);
        toast.success(t("messages.categoryCreated") || "Category created successfully");
      }
      onSave?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error(err?.response?.data?.message || t("messages.categoryError") || "Error saving category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              {editingCategory ? <Pencil size={20} /> : <Settings2 size={20} />}
            </div>
            {editingCategory ? t("categoryMgmt.editTitle") : t("categoryMgmt.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("categoryMgmt.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold">{t("categoryMgmt.nameLabel")}</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="theme-field"
              placeholder={t("categoryMgmt.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">{t("categoryMgmt.descLabel")}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="theme-field min-h-[100px] resize-none"
              placeholder={t("categoryMgmt.descPlaceholder")}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              {t("form.cancel") || "Cancel"}
            </Button>
            <Button type="submit" className="rounded-xl px-8 bg-slate-800 hover:bg-slate-900 text-white" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : (t("categoryMgmt.saveBtn") || "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Delete Category Alert Component (Exported) ---
export function DeleteCategoryAlert({ open, onOpenChange, onConfirm, categoryName }) {
  const t = useTranslations("accounts.manualExpenses.deleteAlert");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Error deleting category:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>

          <AlertDialogTitle className="text-xl font-black">{t("title")}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium leading-relaxed">
            {t("description")} {categoryName ? `(${categoryName})` : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-4">
          <AlertDialogCancel className="rounded-xl mt-0">{t("cancel")}</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-8"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}