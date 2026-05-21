"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  FileDown,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Clock,
  Globe,
  Loader2,
  Tag,
  ShieldCheck,
  Megaphone,
  Wrench,
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
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import TemplatePreview from "@/app/[locale]/whatsapp/atoms/TemplatePreview";

function normalizeAxiosError(err) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

function FilterField({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-muted-foreground uppercase">{label}</Label>
      {children}
    </div>
  );
}

const CATEGORIES = ["authentication", "marketing", "utility"];
const EDITABLE_TEMPLATE_STATUSES = new Set(["approved", "rejected", "paused"]);

function buildListQuery({ page, per_page, search, filters }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(per_page));
  if (search?.trim()) params.set("search", search.trim());
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.language && filters.language !== "all") params.set("language", filters.language);
  return params.toString();
}

export default function SuperAdminWhatsAppTemplatesPage() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const t = useTranslations("whatsApp.templates");

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [loading, setLoading] = useState(true);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });

  const [deleteState, setDeleteState] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);
  const [previewState, setPreviewState] = useState({ open: false, template: null });

  const { handleExport, exportLoading } = useExport();

  const [filters, setFilters] = useState({
    category: "all",
    language: "all",
  });

  // حساب الإحصائيات ديناميكياً بناءً على السجلات المتاحة وفئاتها
  const statsCards = useMemo(() => {
    const records = pager.records || [];
    
    const countByCategory = (cat) => records.filter((r) => r.category === cat).length;

    return [
      { 
        name: t("stats.total"), 
        value: pager.total_records || records.length, 
        icon: FileText, 
        color: "#8b5cf6" 
      },
      { 
        name: t("categories.utility") || "Utility", 
        value: countByCategory("utility"), 
        icon: Wrench, 
        color: "#3b82f6" 
      },
      { 
        name: t("categories.marketing") || "Marketing", 
        value: countByCategory("marketing"), 
        icon: Megaphone, 
        color: "#10b981" 
      },
      { 
        name: t("categories.authentication") || "Authentication", 
        value: countByCategory("authentication"), 
        icon: ShieldCheck, 
        color: "#ef4444" 
      },
    ];
  }, [pager, t]);

  const fetchTemplates = async ({ page = 1, per_page = 12 } = {}) => {
    setLoading(true);
    try {
      const qs = buildListQuery({ page, per_page, search: debouncedSearch, filters });
      const res = await api.get(`/whatsapp-templates?${qs}`);
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
  };

  useEffect(() => {
    fetchTemplates({ page: 1, per_page: pager.per_page });
  }, [debouncedSearch]);

  const applyFilters = () => {
    fetchTemplates({ page: 1, per_page: pager.per_page });
  };

  const handlePageChange = ({ page, per_page }) => {
    fetchTemplates({ page, per_page });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.category !== "all" || filters.language !== "all";
  }, [filters]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/whatsapp-templates/${deleteState.id}`);
      setDeleteState({ open: false, id: null });
      toast.success(t("messages.deleteSuccess"));
      await fetchTemplates({ page: pager.current_page, per_page: pager.per_page });
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setDeleting(false);
    }
  };

  const onExport = async () => {
    const qs = buildListQuery({ page: 1, per_page: pager.per_page, search: debouncedSearch, filters });
    await handleExport({
      endpoint: "/whatsapp-templates/export",
      params: { qs },
      filename: `whatsapp_templates_admin_${Date.now()}.xlsx`,
    });
  };

  const columns = useMemo(
    () => [
      {
        header: t("table.name"),
        key: "name",
        className: "font-bold text-gray-700 dark:text-slate-200",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary/60" />
            <span>{row.name}</span>
          </div>
        ),
      },
      {
        header: t("table.language"),
        key: "language",
        cell: (row) => (
          <div className="flex items-center gap-1.5 uppercase font-mono text-xs">
            <Globe size={14} className="text-muted-foreground" />
            {row.language}
          </div>
        ),
      },
      {
        header: t("table.category"),
        key: "category",
        cell: (row) => (
          <div className="flex items-center gap-1.5 text-xs">
            <Tag size={14} className="text-muted-foreground" />
            {t(`categories.${row.category}`)}
          </div>
        ),
      },
      {
        header: t("table.createdAt"),
        key: "createdAt",
        cell: (row) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={14} />
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
          </div>
        ),
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
                onClick: (r) => router.push(`/dashboard/whatsapp/templates/edit/${r.id}`),
                variant: "purple",
              },
              {
                icon: <Trash2 size={16} />,
                tooltip: t("actions.delete"),
                onClick: () => setDeleteState({ open: true, id: row.id }),
                variant: "red",
              },
            ]}
          />
        ),
      },
    ],
    [t, tCommon]
  );

  return (
    <div className="min-h-screen p-5 space-y-6">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.templates") },
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={t("toolbar.addTemplate")}
              variant="solid"
              onClick={() => router.push("/dashboard/whatsapp/templates/add")}
              icon={<Plus size={18} />}
              permission="whatsapp.templates.create"
            />
          </>
        }
        stats={statsCards}
      />

      <Table
        isLoading={loading}
        data={pager.records}
        columns={columns}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
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
            icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />,
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "whatsapp.read",
          },
        ]}
        filters={
          <>
            <FilterField label={t("filters.category")}>
              <Select
                value={filters.category}
                onValueChange={(v) => setFilters((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`categories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.language")}>
              <Select
                value={filters.language}
                onValueChange={(v) => setFilters((f) => ({ ...f, language: v }))}
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
      />

      <ConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
        title={t("actions.delete")}
        description={t("actions.confirmDelete")}
        confirmText={tCommon("delete")}
        cancelText={tCommon("cancel")}
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <Dialog
        open={previewState.open}
        onOpenChange={(open) => setPreviewState((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="text-primary" />
              {t("actions.preview")}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 max-w-[400px] mx-auto">
            {previewState.template ? <TemplatePreview template={previewState.template} /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}