"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  FileDown,
  Eye,
  Pencil,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  AlertCircle,
  Tag,
  Globe,
  Loader2,
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
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";

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
const STATUSES = [
  "pending",
  "in_review",
  "rejected",
  "approved",
  "archived",
  "unarchived",
  "paused",
  "disabled",
  "locked",
  "appeal_requested",
  "pending_deletion",
];
const QUALITY = ["high", "medium", "low", "unknown"];

const EDITABLE_TEMPLATE_STATUSES = new Set(["approved", "rejected", "paused"]);

export const TemplateStatus = {
  PENDING: "pending",
  IN_REVIEW: "in_review",
  REJECTED: "rejected",
  APPROVED: "approved",
  PAUSED: "paused",
  DISABLED: "disabled",
  APPEAL_REQUESTED: "appeal_requested",
  PENDING_DELETION: "pending_deletion",
  ARCHIVED: "archived",
  UNARCHIVED: "unarchived",
  LOCKED: "locked",
};

const MOCK_STATS = {
  total: 24,
  approved: 18,
  lowQuality: 2,
  usedLast48: 156,
  errorsLast48: 3,
};

function buildListQuery({ page, per_page, search, filters }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(per_page));
  if (search?.trim()) params.set("search", search.trim());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.quality && filters.quality !== "all") params.set("quality", filters.quality);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.language && filters.language !== "all") params.set("language", filters.language);
  if (filters.account && filters.account !== "all") params.set("accountId", filters.account);
  return params.toString();
}

function buildExportQuery({ search, filters }) {
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.quality && filters.quality !== "all") params.set("quality", filters.quality);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.language && filters.language !== "all") params.set("language", filters.language);
  if (filters.account && filters.account !== "all") params.set("accountId", filters.account);
  return params.toString();
}

export default function WhatsAppTemplatesPage() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const t = useTranslations("whatsApp.templates");

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
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
    quality: "all",
    status: "all",
    account: "all",
    category: "all",
    language: "all",
  });

  const statsCards = useMemo(
    () => [
      { name: t("stats.total"), value: MOCK_STATS.total, icon: FileText, color: "#8b5cf6" },
      { name: t("stats.approved"), value: MOCK_STATS.approved, icon: CheckCircle2, color: "#10b981" },
      { name: t("stats.lowQuality"), value: MOCK_STATS.lowQuality, icon: AlertTriangle, color: "#ef4444" },
      { name: t("stats.usedLast48"), value: MOCK_STATS.usedLast48, icon: History, color: "#3b82f6" },
      { name: t("stats.errorsLast48"), value: MOCK_STATS.errorsLast48, icon: AlertCircle, color: "#f59e0b" },
    ],
    [t]
  );

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get("/whatsapp-accounts", { params: { limit: 200, page: 1 } });
      const records = res.data?.records ?? [];
      setAccounts(Array.isArray(records) ? records : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
    return (
      filters.quality !== "all" ||
      filters.status !== "all" ||
      filters.category !== "all" ||
      filters.language !== "all" ||
      filters.account !== "all"
    );
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
      filename: `whatsapp_templates_${Date.now()}.xlsx`,
    });
  };

  const statusLabel = (status) => t(`statuses.${status}`);

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
        header: t("table.status"),
        key: "status",
        cell: (row) => (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
              row.status === "approved"
                ? "bg-emerald-100 text-emerald-700"
                : row.status === "rejected" || row.status === "disabled"
                  ? "bg-rose-100 text-rose-700"
                  : row.status === "in_review" || row.status === "pending"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
            )}
          >
            {statusLabel(row.status)}
          </div>
        ),
      },
      {
        header: t("table.quality"),
        key: "quality",
        cell: (row) => (
          <div
            className={cn(
              "flex items-center gap-1.5 font-bold text-xs",
              row.quality === "high"
                ? "text-emerald-500"
                : row.quality === "medium"
                  ? "text-amber-500"
                  : row.quality === "low"
                    ? "text-rose-500"
                    : "text-slate-400"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                row.quality === "high"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : row.quality === "medium"
                    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    : row.quality === "low"
                      ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      : "bg-slate-400"
              )}
            />
            {t(`quality.${row.quality}`)}
          </div>
        ),
      },
      {
        header: t("table.account"),
        key: "account",
        cell: (row) => {
          const acc = row.account;
          const name = acc?.name ?? "—";
          const num = acc?.mobileNumber ?? row.mobileNumber ?? "—";
          return (
            <div className="flex flex-col">
              <span className="font-bold text-xs">{name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{num}</span>
            </div>
          );
        },
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
                permission: "whatsapp.read",
              },
              {
                icon: <Pencil size={16} />,
                tooltip: t("actions.edit"),
                disabled: !EDITABLE_TEMPLATE_STATUSES.has(row.status),
                onClick: (r) => router.push(`/whatsapp/templates/edit/${r.id}`),
                variant: "purple",
                permission: "whatsapp.templates.update",
              },
              {
                icon: <Trash2 size={16} />,
                tooltip: t("actions.delete"),
                onClick: () => setDeleteState({ open: true, id: row.id }),
                variant: "red",
                hidden: row.status === TemplateStatus.DISABLED,
                permission: "whatsapp.templates.delete",
              },
              {
                icon: <History size={16} />,
                tooltip: t("actions.appeal"),
                onClick: () => toast.success("Appeal requested"),
                variant: "orange",
                hidden: row.status !== "rejected" && row.status !== "disabled",
                permission: "whatsapp.templates.update",
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
          { name: t("breadcrumb.whatsapp"), href: "/whatsapp" },
          { name: t("breadcrumb.templates") },
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={t("toolbar.addTemplate")}
              variant="solid"
              onClick={() => router.push("/whatsapp/templates/add")}
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
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.quality")}>
              <Select
                value={filters.quality}
                onValueChange={(v) => setFilters((f) => ({ ...f, quality: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {QUALITY.map((q) => (
                    <SelectItem key={q} value={q}>
                      {t(`quality.${q}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

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

            <FilterField label={t("filters.account")}>
              <Select
                value={filters.account}
                onValueChange={(v) => setFilters((f) => ({ ...f, account: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({a.mobileNumber || a.id})
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
                  <SelectItem value="en_US">English (US)</SelectItem>
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
