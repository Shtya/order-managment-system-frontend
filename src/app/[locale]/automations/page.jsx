"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  FileDown,
  Eye,
  Pencil,
  Trash2,
  GitBranch,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Loader2,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AutomationsTab } from "../settings/page";
import { OrdersSettingsProvider } from "@/hook/useOrdersSettings";

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


const TriggerType = {
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
};

const AutomationStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PAUSED: 'paused',
};

const MOCK_STATS = {
  executing: 12,
  published: 45,
  paused: 3,
  done: 1560,
};

function buildListQuery({ page, per_page, search, filters }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(per_page));
  if (search?.trim()) params.set("search", search.trim());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.triggerType && filters.triggerType !== "all") params.set("triggerType", filters.triggerType);
  // Date filter could be added here if the backend supports it via start/end dates
  return params.toString();
}

export default function AutomationsPage() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const t = useTranslations("whatsApp.automations");

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });

  const [loading, setLoading] = useState(false);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });

  const [filters, setFilters] = useState({
    status: "all",
    triggerType: "all",
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { handleExport, exportLoading } = useExport();

  const statsCards = useMemo(
    () => [
      { name: t("stats.executing"), value: MOCK_STATS.executing, icon: Play, color: "#3b82f6" },
      { name: t("stats.published"), value: MOCK_STATS.published, icon: CheckCircle, color: "#10b981" },
      { name: t("stats.paused"), value: MOCK_STATS.paused, icon: AlertCircle, color: "#ef4444" },
      { name: t("stats.done"), value: MOCK_STATS.done, icon: Clock, color: "#8b5cf6" },
    ],
    [t]
  );

  const fetchAutomations = async ({ page = 1, per_page = 12 } = {}) => {
    setLoading(true);
    try {
      const qs = buildListQuery({ page, per_page, search: debouncedSearch, filters });
      const res = await api.get(`/automation?${qs}`);
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
    fetchAutomations({ page: 1, per_page: pager.per_page });
  }, [debouncedSearch]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "all" ||
      filters.triggerType !== "all"
    );
  }, [filters]);


  const handlePageChange = ({ page, per_page }) => {
    fetchAutomations({ page, per_page });
  };

  const handleStatusToggle = async (row) => {
    const nextStatus = row.status === 'published' ? 'paused' : 'published';
    const toastId = toast.loading(t("messages.loading"));
    try {
      await api.post(`/automation/${row.id}/${nextStatus}`);
      toast.success(t("messages.updateSuccess"), { id: toastId });
      fetchAutomations({ page: pager.current_page, per_page: pager.per_page });
    } catch (error) {
      toast.error(normalizeAxiosError(error), { id: toastId });
    }
  };

  const onExport = async () => {
    const qs = buildListQuery({ page: 1, per_page: pager.per_page, search: debouncedSearch, filters });
    await handleExport({
      endpoint: "/automation/export",
      params: { qs },
      filename: `automations_export_${Date.now()}.xlsx`,
    });
  };

  const confirmDelete = async () => {
    if (!selectedAutomation) return;
    setDeleting(true);
    const toastId = toast.loading(t("messages.loading"));
    try {
      await api.delete(`/automation/${selectedAutomation.id}`);
      toast.success(t("messages.deleteSuccess"), { id: toastId });
      setDeleteOpen(false);
      fetchAutomations();
    } catch (err) {
      toast.error(normalizeAxiosError(err), { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: t("table.name"),
        key: "name",
        className: "font-bold text-gray-700 dark:text-slate-200",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-bold text-gray-700 dark:text-slate-200">
              {row.name || "—"}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <GitBranch size={10} />
              v{row.latestVersion?.versionString || "1.0"}
            </span>
          </div>
        ),
      },
      {
        header: t("table.triggerType"),
        key: "triggerType",
        cell: (row) => (
          <div className="flex items-center gap-1.5 text-xs">
            {t(`triggers.${row.triggerType}`)}
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
              row.status === "published"
                ? "bg-emerald-100 text-emerald-700"
                : row.status === "draft"
                  ? "bg-slate-100 text-slate-700"
                  : row.status === "paused"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
            )}
          >
            {t(`statuses.${row.status}`)}
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
                tooltip: t("actions.view"),
                onClick: (r) => router.push(`/automations/detail/${r.id}`),
                variant: "primary",
                permission: "automation.read",
              },
              {
                icon: <Pencil size={16} />,
                tooltip: t("actions.edit"),
                onClick: (r) => router.push(`/automations/edit/${r.id}`),
                variant: "purple",
                permission: "automation.update",
              },
              {
                icon: row.status === 'published' ? <Pause size={16} /> : <Play size={16} />,
                tooltip: row.status === 'published' ? t("actions.pause") : t("actions.publish"),
                onClick: () => handleStatusToggle(row),
                variant: "purple",
                permission: "automation.update",
              },
              {
                icon: <Trash2 size={16} />,
                tooltip: t("actions.delete"),
                onClick: (r) => {
                  setSelectedAutomation(r);
                  setDeleteOpen(true);
                },
                variant: "red",
                permission: "automation.delete",
              },
            ]}
          />
        ),
      },
    ],
    [t, tCommon, router, handleStatusToggle]
  );
  const applyFilters = () => {
    fetchAutomations({ page: 1, per_page: pager.per_page });
  };
  return (
    <div className="min-h-screen p-5 space-y-6 bg-slate-50/50 dark:bg-transparent">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.automations") },
        ]}
        buttons={
          <>
            {/* <Button_
              size="sm"
              label={t("actions.openSettings") || "Settings"}
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              icon={<Settings size={18} />}
            /> */}
            <Button_
              size="sm"
              label={t("toolbar.addAutomation")}
              variant="solid"
              onClick={() => router.push("/automations/builder")}
              icon={<Plus size={18} />}
              permission="automation.create"
            />
          </>
        }
      // stats={statsCards}
      />

      <Table
        isLoading={loading}
        data={pager.records}
        columns={columns}
        onPageChange={handlePageChange}
        // onLimitChange={(l) => fetchAutomations({ page: 1, per_page: l })}
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
            permission: "automation.read",
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
                  {Object.values(AutomationStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`statuses.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.triggerType")}>
              <Select
                value={filters.triggerType}
                onValueChange={(v) => setFilters((f) => ({ ...f, triggerType: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {Object.values(TriggerType).map((tt) => (
                    <SelectItem key={tt} value={tt}>
                      {t(`triggers.${tt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </>
        }
      />

      <ConfirmDeleteDialog
        t={t}
        tCommon={tCommon}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        automation={selectedAutomation}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl min-w-[1000px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="text-primary" />
              {t("actions.openSettings") || "Automation Settings"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <OrdersSettingsProvider>
              <AutomationsTab onSave={() => setSettingsOpen(false)} />
            </OrdersSettingsProvider>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfirmDeleteDialog({ t, tCommon, open, onOpenChange, automation, onConfirm, loading }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete.title") || t("actions.delete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {automation ? `${automation.name}` : ""}
            <div className="mt-2 text-sm">
              {t("delete.desc") || "This will delete the automation permanently."}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-4 flex items-center justify-end gap-2">
          <AlertDialogCancel className="rounded-full" disabled={loading}>
            {tCommon("cancel") || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
          >
            <span className="flex items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {t("actions.delete") || "Delete"}
            </span>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
