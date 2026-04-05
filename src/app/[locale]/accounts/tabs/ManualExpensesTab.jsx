"use client";

import React, { useMemo, useState } from "react";
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
  Settings2
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
export function ManualExpenseFormModal({ open, onOpenChange, editingExpense, onSave }) {
  const t = useTranslations("accounts");
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "other",
    description: "",
    attachment: null
  });

  React.useEffect(() => {
    if (editingExpense) {
      setFormData({
        amount: Math.abs(editingExpense.amount),
        date: editingExpense.date,
        category: editingExpense.category,
        description: editingExpense.description,
        attachment: editingExpense.attachment || null
      });
    } else {
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category: "other",
        description: "",
        attachment: null
      });
    }
  }, [editingExpense, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
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
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">ج</span>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("manualExpenses.form.date")}</Label>
              <div className="relative">
                <Flatpickr
                  value={formData.date}
                  onChange={([date]) => setFormData({ ...formData, date: date.toISOString().split("T")[0] })}
                  options={{ dateFormat: "Y-m-d", maxDate: "today" }}
                  className="theme-field w-full"
                />
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">{t("manualExpenses.form.category")}</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger className="theme-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORY_CONFIG).map((cat) => {
                  const Config = CATEGORY_CONFIG[cat];
                  return (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <Config.icon size={14} className={Config.iconColor} style={{ color: Config.iconColor }} />
                        <span>{t(`manualExpenses.categories.${cat}`)}</span>
                      </div>
                    </SelectItem>
                  );
                })}
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
            <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ImageIcon size={20} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("manualExpenses.form.upload")}</span>
              <input type="file" className="hidden" accept="image/*" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              {t("manualExpenses.form.cancel")}
            </Button>
            <Button type="submit" className="rounded-xl px-8">
              {t("manualExpenses.form.save")}
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700 rounded-xl">
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// --- Main Tab Component ---
export default function ManualExpensesTab({
  onAdd,
  onEdit,
  onDelete
}) {
  const tOrders = useTranslations("orders");
  const t = useTranslations("accounts");
  const [search, setSearch] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Mock data
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      date: "2025-12-01",
      category: "ads",
      description: "إعلانات فيسبوك لشهر نوفمبر - حملة الشتاء",
      amount: -2450,
      addedBy: "Ahmed Ali",
      attachment: "https://via.placeholder.com/150"
    },
    {
      id: 2,
      date: "2025-12-02",
      category: "packaging",
      description: "شراء كراتين وبلاستر للمخزن (500 قطعة)",
      amount: -1200,
      addedBy: "Sara Mohamed",
    },
    {
      id: 3,
      date: "2025-12-03",
      category: "transport",
      description: "نقل بضاعة من الميناء إلى المخزن الرئيسي",
      amount: -3500,
      addedBy: "Ahmed Ali",
    }
  ]);

  const columns = useMemo(() => [
    {
      key: "date",
      header: t("manualExpenses.columns.date"),
      cell: (row) => <span className="text-xs font-medium">{row.date}</span>
    },
    {
      key: "category",
      header: t("manualExpenses.columns.category"),
      cell: (row) => {
        const config = CATEGORY_CONFIG[row.category] || CATEGORY_CONFIG.other;
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.color)}>
              <config.icon size={14} />
            </div>
            <span className="text-xs font-bold">{t(`manualExpenses.categories.${row.category}`)}</span>
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
          -{Math.abs(row.amount).toLocaleString()}ج
        </span>
      )
    },
    {
      key: "addedBy",
      header: t("manualExpenses.columns.addedBy"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <User size={12} className="text-muted-foreground" />
          </div>
          <span className="text-xs font-semibold">{row.addedBy}</span>
        </div>
      )
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
            onClick={() => onEdit?.(row)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg hover:bg-red-100 hover:text-red-600"
            onClick={() => onDelete?.(row)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ], [t, onEdit, onDelete]);
  let exportLoading = false;
  return (
    <div className="space-y-5">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
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
          total_records: expenses.length,
          current_page: 1,
          per_page: 10,
        }}
        actions={[
          {
            key: "add",
            label: t("manualExpenses.actions.add"),
            icon: <Plus size={14} />,
            color: "primary",
            onClick: onAdd,
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
            // onClick: handleExport,
            // disabled: exportLoading,
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
                  <span className="text-2xl font-black text-red-600">-{Math.abs(selectedExpense.amount).toLocaleString()}ج</span>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border border-border flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("manualExpenses.columns.date")}</span>
                  <span className="text-sm font-bold">{selectedExpense.date}</span>
                </div>
              </div>

              {/* Description Box (Orange as requested) */}
              <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 text-orange-200 group-hover:text-orange-300 transition-colors">
                  <FileText size={40} />
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
                    {(() => {
                      const Config = CATEGORY_CONFIG[selectedExpense.category] || CATEGORY_CONFIG.other;
                      return <Config.icon size={12} className={Config.iconColor} style={{ color: Config.iconColor }} />;
                    })()}
                    <span className="text-xs font-black">{t(`categories.${selectedExpense.category}`)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                      <User size={14} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{t("manualExpenses.columns.addedBy")}</span>
                  </div>
                  <span className="text-xs font-black">{selectedExpense.addedBy}</span>
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

  React.useEffect(() => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
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
              {t("form.cancel")}
            </Button>
            <Button type="submit" className="rounded-xl px-8 bg-slate-800 hover:bg-slate-900 text-white">
              {t("categoryMgmt.saveBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}