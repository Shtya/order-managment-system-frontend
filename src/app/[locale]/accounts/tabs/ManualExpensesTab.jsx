"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
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
import Flatpickr from "react-flatpickr";
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
import api from "@/utils/api";
import { useExport } from "@/hook/useExport";
import toast from "react-hot-toast";

// Category configuration
export const CATEGORY_CONFIG = {
  ads: { icon: Megaphone, color: "text-purple-500 bg-purple-50", iconColor: "#a855f7" },
  packaging: { icon: Box, color: "text-orange-500 bg-orange-50", iconColor: "#f97316" },
  transport: { icon: Truck, color: "text-blue-500 bg-blue-50", iconColor: "#3b82f6" },
  office: { icon: Building2, color: "text-emerald-500 bg-emerald-50", iconColor: "#10b981" },
  salaries: { icon: Wallet, color: "text-rose-500 bg-rose-50", iconColor: "#f43f5e" },
  other: { icon: MoreHorizontal, color: "text-slate-500 bg-slate-50", iconColor: "#64748b" },
};

// --- Form Component (Exported) ---
export function ManualExpenseFormModal({ open, onOpenChange, editingExpense, onSave, categories }) {
  const t = useTranslations("accounts");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    amount: "",
    collectionDate: new Date(),
    categoryId: "none",
    description: "",
    attachment: null
  });
  console.log(formData);
  const handleDivClick = () => {
    // Manually trigger the hidden input
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 20MB client-side check
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large (max 20MB)");
      e.target.value = ""; // Reset the input
      return;
    }

    setFormData(prev => ({ ...prev, attachment: file }));
  };


  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        amount: Math.abs(editingExpense.amount),
        collectionDate: new Date(editingExpense.collectionDate),
        categoryId: String(editingExpense.categoryId || "none"),
        description: editingExpense.description || "",
        attachment: editingExpense.attachment || null
      });
    } else {
      setFormData({
        amount: "",
        collectionDate: new Date(),
        categoryId: "none",
        description: "",
        attachment: null
      });
    }
  }, [editingExpense, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.categoryId === "none") {
      toast.error(t("manualExpenses.form.selectCategoryError") || "Please select a category");
      return;
    }

    setLoading(true);

    try {
      // 1. Initialize FormData
      const data = new FormData();

      // 2. Append standard fields
      data.append("amount", String(formData.amount));
      data.append("categoryId", String(formData.categoryId));
      data.append("collectionDate", formData.collectionDate);
      data.append("description", formData.description || "");

      // 3. Append the file (only if a new one was selected)
      // The key "attachment" must match the @UploadedFile('attachment') in NestJS
      if (formData.attachment instanceof File) {
        data.append("attachment", formData.attachment);
      }

      // 4. Send request
      if (editingExpense) {
        await api.patch(`/expenses/${editingExpense.id}`, data);
        toast.success(t("manualExpenses.messages.updated"));
      } else {
        await api.post("/expenses", data);
        toast.success(t("manualExpenses.messages.created"));
      }

      onSave?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving expense:", err);
      toast.error(err?.response?.data?.message || "Error saving expense");
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("manualExpenses.form.amount")}</Label>
              <div className="relative">
                <Input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="theme-field pl-8"
                  placeholder="0.00"
                />

              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("manualExpenses.form.date")}</Label>
              <div className="relative">
                <Flatpickr
                  // IMPORTANT: Use the date object for value, but store the string in state
                  value={formData.collectionDate ? new Date(formData.collectionDate) : new Date()}
                  onChange={([date]) => {
                    if (date) {
                      setFormData({ ...formData, collectionDate: date });
                    }
                  }}
                  options={{
                    dateFormat: "Y-m-d",
                    maxDate: "today",
                    // FIX: This prevents the Dialog focus trap from "disabling" the calendar
                    static: true,
                    monthSelectorType: "dropdown"
                  }}
                  date-site
                  // Ensure padding-left (pl-8) so text doesn't hide behind the icon
                  className="theme-field w-full pl-9"
                />

              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">{t("manualExpenses.form.category")}</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
            >
              <SelectTrigger className="theme-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("common.none")}</SelectItem>
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">{t("manualExpenses.form.description")}</Label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="theme-field min-h-[100px] resize-none"
              placeholder="..."
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">{t("manualExpenses.form.attachment")}</Label>

            {/* 1. Add onClick to the parent div */}
            <div
              onClick={handleDivClick}
              className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ImageIcon size={20} />
              </div>

              <span className="text-xs font-medium">
                {formData.attachment instanceof File
                  ? formData.attachment.name
                  : (formData.attachment ? "Change attachment" : t("manualExpenses.form.upload"))}
              </span>
              {/* 2. Link the ref to the input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf" // Added PDF support as you mentioned docs
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
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: "none",
    startDate: null,
    endDate: null
  });

  const { handleExport, exportLoading } = useExport();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: perPage,
        search: search.trim() || undefined,
        categoryId: filters.categoryId !== "none" ? filters.categoryId : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };
      const res = await api.get("/expenses", { params });
      setExpenses(res.data.records || []);
      setTotalRecords(res.data.total_records || 0);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      toast.error(t("manualExpenses.messages.fetchError") || "Error fetching expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentPage, perPage, search, filters]);

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
          -{Number(row.amount).toLocaleString()}ج
        </span>
      )
    },
    {
      key: "createdByUserId",
      header: t("manualExpenses.columns.addedBy"),
      cell: (row) => (row.createdByUserId ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <User size={12} className="text-muted-foreground" />
          </div>
          <span className="text-xs font-semibold">{row.createdByUserId}</span>
        </div>
      ) : null)
    },
    {
      key: "actions",
      header: t("manualExpenses.columns.actions"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary"
            onClick={() => setSelectedExpense(row)}
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg hover:bg-orange-100 hover:text-orange-600"
            onClick={() => handleEdit(row)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg hover:bg-red-100 hover:text-red-600"
            onClick={() => handleDelete(row)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
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
          searchPlaceholder: tOrders("toolbar.searchPlaceholder"),
          apply: tOrders("filters.apply"),
          total: tOrders("pagination.total"),
          limit: tOrders("pagination.limit"),
          emptyTitle: tOrders("empty"),
          emptySubtitle: tOrders("emptySubtitle"),
        }}
        columns={columns}
        data={expenses}
        pagination={{
          total_records: totalRecords,
          current_page: currentPage,
          per_page: perPage,
        }}
        onPageChange={setCurrentPage}
        onLimitChange={setPerPage}
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
              <div className="flex items-center gap-2">
                <Flatpickr
                  value={filters.startDate}
                  onChange={([date]) => setFilters({ ...filters, startDate: date.toISOString().split("T")[0] })}
                  options={{ dateFormat: "Y-m-d" }}
                  placeholder={t("filters.startDate")}
                  className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-muted-foreground">-</span>
                <Flatpickr
                  value={filters.endDate}
                  onChange={([date]) => setFilters({ ...filters, endDate: date.toISOString().split("T")[0] })}
                  options={{ dateFormat: "Y-m-d" }}
                  placeholder={t("filters.endDate")}
                  className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </FilterField>
          </>
        }
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
            color: "blue",
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
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400">{t("manualExpenses.columns.amount")}</span>
                  <span className="text-2xl font-black text-red-600">-{Number(selectedExpense.amount).toLocaleString()}ج</span>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border border-border flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("manualExpenses.columns.date")}</span>
                  <span className="text-sm font-bold">{new Date(selectedExpense.collectionDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description Box (Orange as requested) */}
              <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 text-orange-200 group-hover:text-orange-300 transition-colors">
                  <FileText size="40" />
                </div>
                <div className="relative z-10 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">{t("manualExpenses.columns.description")}</span>
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
                      <User size={14} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{t("manualExpenses.columns.addedBy")}</span>
                  </div>
                  <span className="text-xs font-black">{selectedExpense.createdByUserId}</span>
                </div>

                {selectedExpense.attachment && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">{t("manualExpenses.form.attachment")}</span>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-muted/30 group">
                      <img
                        src={selectedExpense.attachment}
                        alt="Attachment"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" className="rounded-full gap-2">
                          <Eye size={14} />
                          {t("manualExpenses.actions.view")}
                        </Button>
                      </div>
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
            toast.success(t("manualExpenses.messages.deleted") || "Expense deleted successfully");
            fetchExpenses();
          } catch (err) {
            console.error("Error deleting expense:", err);
            toast.error(err?.response?.data?.message || t("manualExpenses.messages.deleteError") || "Error deleting expense");
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