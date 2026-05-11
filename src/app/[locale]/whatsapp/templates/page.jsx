"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  FileDown,
  Eye,
  Pencil,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  HelpCircle,
  MessageSquare,
  Globe,
  Tag,
  History,
  AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TemplatePreview from "../atoms/TemplatePreview";
import { useRouter } from "@/i18n/navigation";

// Helper for filter fields
function FilterField({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-muted-foreground uppercase">{label}</Label>
      {children}
    </div>
  );
}

// Constants
const CATEGORIES = ["authentication", "marketing", "utility"];
const STATUSES = ["in_review", "rejected", "approved", "paused", "disabled", "appeal_requested", "pending_deletion"];
const QUALITY = ["high", "medium", "low", "unknown"];

// Mock Data
const MOCK_TEMPLATES = [
  {
    id: "1",
    name: "welcome_message",
    language: "en",
    category: "marketing",
    status: "approved",
    createdAt: "2024-05-01T10:00:00Z",
    accountNumber: "+201234567890",
    accountName: "Sales Department",
    quality: "high",
    preview: {
      headerType: "TEXT",
      headerText: "Welcome!",
      bodyText:
        "Hello {{first_name}} {{last_name}}, welcome to our service. Your ID is {{customer_id}}.",
      footerText: "Reply STOP to opt out.",
      examples: {
        first_name: "John",
        last_name: "Doe",
        customer_id: "CUST-99"
      }
    }
  },
  {
    id: "2",
    name: "otp_code",
    language: "ar",
    category: "authentication",
    status: "approved",
    createdAt: "2024-04-25T14:30:00Z",
    accountNumber: "+201234567890",
    accountName: "Sales Department",
    quality: "high",
    preview: {
      headerType: "TEXT",
      headerText: "رمز التحقق",
      bodyText:
        "كود التحقق الخاص بك هو {{verification_code}}. لا تشاركه مع أحد.",
      examples: {
        verification_code: "4829"
      }
    }
  },
  {
    id: "3",
    name: "order_confirmation",
    language: "en",
    category: "utility",
    status: "in_review",
    createdAt: "2024-05-05T09:15:00Z",
    accountNumber: "+201987654321",
    accountName: "Customer Support",
    quality: "unknown",
    preview: {
      headerType: "IMAGE",
      bodyText:
        "Hi {{customer_name}}, your order {{order_number}} has been confirmed!",
      footerText: "Track it in our app.",
      examples: {
        customer_name: "Sarah",
        order_number: "#ORD-1029"
      }
    }
  },
  {
    id: "4",
    name: "seasonal_promo",
    language: "ar",
    category: "marketing",
    status: "rejected",
    createdAt: "2024-03-10T11:45:00Z",
    accountNumber: "+201112223334",
    accountName: "Marketing Team",
    quality: "low",
    preview: {
      headerType: "VIDEO",
      bodyText:
        "خصومات الصيف بدأت! استخدم الكود {{promo_code}} للحصول على {{discount_percentage}} خصم.",
      examples: {
        promo_code: "SUMMER20",
        discount_percentage: "20%"
      }
    }
  },
  {
    id: "5",
    name: "feedback_survey",
    language: "en",
    category: "marketing",
    status: "paused",
    createdAt: "2024-02-15T16:20:00Z",
    accountNumber: "+201234567890",
    accountName: "Sales Department",
    quality: "medium",
    preview: {
      headerType: "DOCUMENT",
      bodyText:
        "Please find the requested report for {{report_period}}.",
      examples: {
        report_period: "April 2024"
      }
    }
  }
];

const MOCK_STATS = {
  total: 24,
  approved: 18,
  lowQuality: 2,
  usedLast48: 156,
  errorsLast48: 3
};

export default function WhatsAppTemplatesPage() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const t = useTranslations("whatsApp.templates");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [deleteState, setDeleteState] = useState({ open: false, id: null });
  const [previewState, setPreviewState] = useState({ open: false, template: null });
  const [filters, setFilters] = useState({
    quality: "all",
    status: "all",
    account: "all",
    category: "all",
    language: "all",
  });

  // Stats Configuration
  const statsCards = useMemo(() => [
    { name: t("stats.total"), value: MOCK_STATS.total, icon: FileText, color: "#8b5cf6" },
    { name: t("stats.approved"), value: MOCK_STATS.approved, icon: CheckCircle2, color: "#10b981" },
    { name: t("stats.lowQuality"), value: MOCK_STATS.lowQuality, icon: AlertTriangle, color: "#ef4444" },
    { name: t("stats.usedLast48"), value: MOCK_STATS.usedLast48, icon: History, color: "#3b82f6" },
    { name: t("stats.errorsLast48"), value: MOCK_STATS.errorsLast48, icon: AlertCircle, color: "#f59e0b" },
  ], [t]);

  // Filtering Logic
  const filteredTemplates = useMemo(() => {
    return templates.filter(temp => {
      const matchesSearch = temp.name.toLowerCase().includes(search.toLowerCase());
      const matchesQuality = filters.quality === "all" || temp.quality === filters.quality;
      const matchesStatus = filters.status === "all" || temp.status === filters.status;
      const matchesCategory = filters.category === "all" || temp.category === filters.category;
      const matchesLang = filters.language === "all" || temp.language === filters.language;
      const matchesAccount = filters.account === "all" || temp.accountNumber === filters.account;

      return matchesSearch && matchesQuality && matchesStatus && matchesCategory && matchesLang && matchesAccount;
    });
  }, [templates, search, filters]);

  const hasActiveFilters = useMemo(() => {
    return filters.quality !== "all" ||
      filters.status !== "all" ||
      filters.category !== "all" ||
      filters.language !== "all" ||
      filters.account !== "all";
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      quality: "all",
      status: "all",
      account: "all",
      category: "all",
      language: "all",
    });
  };

  const confirmDelete = () => {
    setTemplates(prev => prev.filter(t => t.id !== deleteState.id));
    setDeleteState({ open: false, id: null });
    toast.success(tCommon("messages.success"));
  };

  const columns = useMemo(() => [
    {
      header: t("table.name"),
      key: "name",
      className: "font-bold text-gray-700 dark:text-slate-200",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-primary/60" />
          <span>{row.name}</span>
        </div>
      )
    },
    {
      header: t("table.language"),
      key: "language",
      cell: (row) => (
        <div className="flex items-center gap-1.5 uppercase font-mono text-xs">
          <Globe size={14} className="text-muted-foreground" />
          {row.language}
        </div>
      )
    },
    {
      header: t("table.category"),
      key: "category",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Tag size={14} className="text-muted-foreground" />
          {t(`categories.${row.category}`)}
        </div>
      )
    },
    {
      header: t("table.status"),
      key: "status",
      cell: (row) => (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
          row.status === "approved" ? "bg-emerald-100 text-emerald-700" :
            row.status === "rejected" || row.status === "disabled" ? "bg-rose-100 text-rose-700" :
              row.status === "in_review" ? "bg-blue-100 text-blue-700" :
                "bg-amber-100 text-amber-700"
        )}>
          {t(`statuses.${row.status}`)}
        </div>
      )
    },
    {
      header: t("table.quality"),
      key: "quality",
      cell: (row) => (
        <div className={cn(
          "flex items-center gap-1.5 font-bold text-xs",
          row.quality === "high" ? "text-emerald-500" :
            row.quality === "medium" ? "text-amber-500" :
              row.quality === "low" ? "text-rose-500" :
                "text-slate-400"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            row.quality === "high" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
              row.quality === "medium" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                row.quality === "low" ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                  "bg-slate-400"
          )} />
          {t(`quality.${row.quality}`)}
        </div>
      )
    },
    {
      header: t("table.account"),
      key: "account",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs">{row.accountName}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{row.accountNumber}</span>
        </div>
      )
    },
    {
      header: t("table.createdAt"),
      key: "createdAt",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={14} />
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      header: tCommon("actions"),
      key: "actions",
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            {
              icon: <Eye size={16} />,
              tooltip: t("actions.preview"),
              onClick: () => setPreviewState({ open: true, template: row }),
              variant: "primary",
            },
            {
              icon: <Pencil size={16} />,
              tooltip: t("actions.edit"),
              onClick: () => toast.success("Editing..."),
              variant: "purple",
            },
            {
              icon: <Trash2 size={16} />,
              tooltip: t("actions.delete"),
              onClick: () => setDeleteState({ open: true, id: row.id }),
              variant: "danger",
              hidden: row.status === "disabled"
            },
            {
              icon: <History size={16} />,
              tooltip: t("actions.appeal"),
              onClick: () => toast.success("Appeal Requested"),
              variant: "orange",
              hidden: row.status !== "rejected" && row.status !== "disabled"
            }
          ]}
        />
      )
    }
  ], [t, tCommon]);
  const onExport = () => {
    toast.success(t("messages.exportStarted"));
  };


  return (
    <div className="min-h-screen p-5 space-y-6">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.whatsapp"), href: "/whatsapp" },
          { name: t("breadcrumb.templates") }
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={t("toolbar.addTemplate")}
              variant="solid"
              onClick={() => router.push("/whatsapp/templates/add")}
              icon={<Plus size={18} />}
            />
          </>
        }
        stats={statsCards}
      />

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => { }} // Local filtering, no need to apply
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: tCommon("filter"),
          apply: tCommon("apply"),
          total: tCommon("total"),
          limit: tCommon("limit"),
          emptyTitle: t("table.empty"),
        }}
        actions={[
          {
            key: "export",
            label: tCommon("export"),
            icon: <FileDown size={14} />,
            color: "primary",
            onClick: onExport,
          },
        ]}
        filters={
          <>
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.quality")}>
              <Select
                value={filters.quality}
                onValueChange={(v) => setFilters(f => ({ ...f, quality: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {QUALITY.map(q => (
                    <SelectItem key={q} value={q}>{t(`quality.${q}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.category")}>
              <Select
                value={filters.category}
                onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.account")}>
              <Select
                value={filters.account}
                onValueChange={(v) => setFilters(f => ({ ...f, account: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  <SelectItem value="+201234567890">Sales Department</SelectItem>
                  <SelectItem value="+201987654321">Customer Support</SelectItem>
                  <SelectItem value="+201112223334">Marketing Team</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.language")}>
              <Select
                value={filters.language}
                onValueChange={(v) => setFilters(f => ({ ...f, language: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  <SelectItem value="en">English (EN)</SelectItem>
                  <SelectItem value="ar">Arabic (AR)</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </>
        }
        columns={columns}
        data={filteredTemplates}
        isLoading={loading}
        pagination={{
          total_records: filteredTemplates.length,
          current_page: 1,
          per_page: 10,
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
        title={t("actions.delete")}
        description={t("actions.confirmDelete")}
        confirmText={tCommon("delete")}
        cancelText={tCommon("cancel")}
        onConfirm={confirmDelete}
      />

      {/* Template Preview Popup */}
      <Dialog
        open={previewState.open}
        onOpenChange={(open) => setPreviewState(prev => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="text-primary" />
              {t("actions.preview")}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 max-w-[400px] mx-auto">
            <TemplatePreview template={previewState.template} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
