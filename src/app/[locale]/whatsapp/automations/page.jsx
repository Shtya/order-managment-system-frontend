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

  const statsCards = useMemo(
    () => [
      { name: t("stats.executing"), value: MOCK_STATS.executing, icon: Play, color: "#3b82f6" },
      { name: t("stats.published"), value: MOCK_STATS.published, icon: CheckCircle, color: "#10b981" },
      { name: t("stats.paused"), value: MOCK_STATS.paused, icon: AlertCircle, color: "#ef4444" },
      { name: t("stats.done"), value: MOCK_STATS.done, icon: Clock, color: "#8b5cf6" },
    ],
    [t]
  );

  const fetchAutomations = useCallback(
    async ({ page = 1, per_page = 12 } = {}) => {
      setLoading(true);
      try {
        const qs = buildListQuery({ page, per_page, search, filters });
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
    },
    [search, filters]
  );

  useEffect(() => {
    fetchAutomations({ page: 1, per_page: 12 });
  }, [fetchAutomations]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "all" ||
      filters.triggerType !== "all"
    );
  }, [filters]);

  const columns = useMemo(
    () => [
      {
        header: t("table.name"),
        key: "name",
        className: "font-bold text-gray-700 dark:text-slate-200",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-primary/60" />
            <span>{row.name}</span>
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
              row.status === "active"
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
                onClick: (r) => router.push(`/whatsapp/automations/edit/${r.id}`),
                variant: "primary",
                permission: "automation.read",
              },
              {
                icon: <Pencil size={16} />,
                tooltip: t("actions.edit"),
                onClick: (r) => router.push(`/whatsapp/automations/edit/${r.id}`),
                variant: "purple",
                permission: "automation.update",
              },
            ]}
          />
        ),
      },
    ],
    [t, tCommon, router]
  );

  return (
    <div className="min-h-screen p-5 space-y-6 bg-slate-50/50 dark:bg-transparent">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.whatsapp"), href: "/whatsapp" },
          { name: t("breadcrumb.automations") },
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={t("toolbar.addAutomation")}
              variant="solid"
              onClick={() => router.push("/whatsapp/automations/builder")}
              icon={<Plus size={18} />}
              permission="automation.create"
            />
          </>
        }
        stats={statsCards}
      />

      <Table
        loading={loading}
        data={pager.records}
        columns={columns}
        pager={pager}
        onPageChange={(p) => fetchAutomations({ page: p, per_page: pager.per_page })}
        onLimitChange={(l) => fetchAutomations({ page: 1, per_page: l })}
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => fetchAutomations({ page: 1, per_page: pager.per_page })}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => fetchAutomations({ page: 1, per_page: pager.per_page })}
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: tCommon("filter"),
          apply: tCommon("apply"),
          total: tCommon("total"),
          limit: tCommon("limit"),
          emptyTitle: t("table.empty"),
        }}
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
    </div>
  );
}
