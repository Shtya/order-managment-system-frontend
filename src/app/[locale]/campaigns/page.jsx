"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Ban,
  Copy,
  Edit,
  Eye,
  FileDown,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/atoms/Pageheader";
import Table, { FilterField } from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import Button_ from "@/components/atoms/Button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExport } from "@/hook/useExport";
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { setDocumentTitle } from "@/utils/documentTitle";
import { cn } from "@/utils/cn";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { useSocket } from "@/context/SocketContext";

const DEFAULT_FILTERS = { status: "all", channel: "all" };

const STAT_CARDS = [
  { key: "total", icon: Send, sortOrder: 0 },
  { key: "draft", icon: Edit, sortOrder: 1 },
  { key: "scheduled", icon: Play, sortOrder: 2 },
  { key: "running", icon: Send, sortOrder: 3 },
  { key: "paused", icon: Pause, sortOrder: 4 },
  { key: "completed", icon: Send, sortOrder: 5 },
  { key: "failed", icon: Ban, sortOrder: 6 },
];

const STATUS_BADGE_CLASS = {
  draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  running: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  completed: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  failed: "bg-red-500/10 text-red-600 border-red-500/20",
};

const STATUSES = [
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "cancelled",
  "failed",
];

const CHANNELS = ["whatsapp", "sms", "email"];

export default function CampaignsPage() {
  const tc = useTranslations("common");
  const t = useTranslations("campaigns");
  const format = useFormatter();
  const router = useRouter();
  const { handleExport, exportLoading } = useExport();
  const { subscribe } = useSocket() || {};

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [mutatingId, setMutatingId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, type: null, row: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    setDocumentTitle(t("title"));
  }, [t]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/campaigns/stats");
      setStats(res.data || {});
    } catch (error) {
      console.error("Failed to fetch campaign stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const buildParams = useCallback(
    (p, l, filterState = appliedFilters, searchValue = debouncedSearch) => {
      const params = { page: p, limit: l };
      if (searchValue?.trim()) params.search = searchValue.trim();
      if (filterState.status && filterState.status !== "all") {
        params.status = filterState.status;
      }
      if (filterState.channel && filterState.channel !== "all") {
        params.channel = filterState.channel;
      }
      return params;
    },
    [appliedFilters, debouncedSearch],
  );

  const fetchCampaigns = useCallback(
    async ({
      page: p = page,
      limit: l = limit,
      filterState = appliedFilters,
      searchValue = debouncedSearch,
    } = {}) => {
      setLoading(true);
      try {
        const res = await api.get("/campaigns", {
          params: buildParams(p, l, filterState, searchValue),
        });
        setRecords(res.data?.records || []);
        setTotalRecords(Number(res.data?.total_records || 0));
        setPage(Number(res.data?.current_page || p));
        setLimit(Number(res.data?.per_page || l));
      } catch (error) {
        toast.error(normalizeAxiosError(error) || t("toast.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, buildParams, debouncedSearch, limit, page, t],
  );

  useEffect(() => {
    fetchCampaigns({ page: 1, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!subscribe) return undefined;
    let statsTimer;
    const off = subscribe("CAMPAIGN_UPDATED", (payload) => {
      const campaign = payload?.campaign;
      if (!campaign?.id) return;
      setRecords((prev) =>
        prev.map((row) =>
          row.id === campaign.id ? { ...row, ...campaign } : row,
        ),
      );
      // clearTimeout(statsTimer);
      // statsTimer = setTimeout(() => {
      //   fetchStats();
      // }, 800);
    });
    return () => {
      clearTimeout(statsTimer);
      off?.();
    };
  }, [subscribe, fetchStats]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
    fetchCampaigns({ page: 1, limit, filterState: filters });
  };

  const hasActiveFilters = useMemo(
    () => appliedFilters.status !== "all" || appliedFilters.channel !== "all",
    [appliedFilters],
  );

  const statsCards = useMemo(() => {
    const byStatus = stats?.byStatus || {};
    return STAT_CARDS.map(({ key, icon, sortOrder }) => ({
      key,
      name: t(`stats.${key}`),
      value: key === "total" ? (stats?.total ?? 0) : (byStatus[key] ?? 0),
      icon,
      sortOrder,
    }));
  }, [stats, t]);

  const pagination = useMemo(
    () => ({
      total_records: totalRecords,
      current_page: page,
      per_page: limit,
    }),
    [totalRecords, page, limit],
  );

  const formatDate = (value) => {
    if (!value) return "—";
    return format.dateTime(new Date(value), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatMoney = (value) =>
    format.number(Number(value || 0), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const handlePageChange = ({ page: p, per_page: l }) => {
    setPage(p);
    setLimit(l);
    fetchCampaigns({ page: p, limit: l });
  };

  const refresh = useCallback(() => {
    fetchCampaigns({ page, limit });
    fetchStats();
  }, [fetchCampaigns, fetchStats, limit, page]);

  const closeConfirm = () =>
    setConfirm({ open: false, type: null, row: null });

  const runAction = async (type, row) => {
    if (!row) return;
    setMutatingId(row.id);
    setConfirmLoading(true);
    try {
      if (type === "start") {
        await api.post(`/campaigns/${row.id}/start`, { startNow: true });
        toast.success(t("toast.started"));
      } else if (type === "pause") {
        await api.post(`/campaigns/${row.id}/pause`);
        toast.success(t("toast.paused"));
      } else if (type === "resume") {
        await api.post(`/campaigns/${row.id}/resume`);
        toast.success(t("toast.resumed"));
      } else if (type === "cancel") {
        await api.post(`/campaigns/${row.id}/cancel`);
        toast.success(t("toast.cancelled"));
      } else if (type === "retry") {
        const res = await api.post(`/campaigns/${row.id}/retry-failed`);
        toast.success(t("toast.retried", { count: res.data?.retried ?? 0 }));
      } else if (type === "delete") {
        await api.delete(`/campaigns/${row.id}`);
        toast.success(t("toast.deleted"));
      }
      closeConfirm();
      refresh();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.actionFailed"));
    } finally {
      setMutatingId(null);
      setConfirmLoading(false);
    }
  };

  const exportParams = buildParams(1, 10000);

  const rowActions = (row) => {
    const busy = mutatingId === row.id;
    const status = row.status;
    const actions = [];

    actions.push({
      icon: <Eye />,
      tooltip: t("actions.view"),
      variant: "primary",
      permission: "campaigns.read",
      onClick: () => router.push(`/campaigns/${row.id}`),
    });

    if (status === "scheduled") {
      actions.push({
        icon: <Edit />,
        tooltip: t("actions.edit"),
        variant: "blue",
        permission: "campaigns.update",
        onClick: () => router.push(`/campaigns/${row.id}/edit`),
      });
      actions.push({
        icon: busy ? <Loader2 className="animate-spin" /> : <Play />,
        tooltip: t("actions.startNow"),
        variant: "emerald",
        permission: "campaigns.start",
        disabled: busy,
        onClick: () => setConfirm({ open: true, type: "start", row }),
      });
    }

    if (status === "running") {
      actions.push({
        icon: busy ? <Loader2 className="animate-spin" /> : <Pause />,
        tooltip: t("actions.pause"),
        variant: "orange",
        permission: "campaigns.update",
        disabled: busy,
        onClick: () => runAction("pause", row),
      });
    }

    if (status === "paused") {
      actions.push({
        icon: busy ? <Loader2 className="animate-spin" /> : <Play />,
        tooltip: t("actions.resume"),
        variant: "emerald",
        permission: "campaigns.update",
        disabled: busy,
        onClick: () => runAction("resume", row),
      });
    }

    if (
      status === "scheduled" ||
      status === "running" ||
      status === "paused"
    ) {
      actions.push({
        icon: <Ban />,
        tooltip: t("actions.cancel"),
        variant: "orange",
        permission: "campaigns.update",
        disabled: busy,
        onClick: () => setConfirm({ open: true, type: "cancel", row }),
      });
    }

    if (status === "failed"
    ) {
      actions.push({
        icon: busy ? <Loader2 className="animate-spin" /> : <RotateCcw />,
        tooltip: t("actions.retryFailed"),
        variant: "blue",
        permission: "campaigns.start",
        disabled: busy,
        onClick: () => setConfirm({ open: true, type: "retry", row }),
      });
    }
    actions.push({
      icon: <Copy />,
      tooltip: t("actions.duplicate"),
      variant: "blue",
      permission: "campaigns.create",
      disabled: busy,
      onClick: () => router.push(`/campaigns/new?fromId=${row.id}`),
    });

    if (status !== "running" && status !== "paused") {
      actions.push({
        icon: <Trash2 />,
        tooltip: t("actions.delete"),
        variant: "red",
        permission: "campaigns.delete",
        disabled: busy,
        onClick: () => setConfirm({ open: true, type: "delete", row }),
      });
    }


    return actions;
  };

  const columns = [
    {
      key: "name",
      header: t("columns.name"),
      className: "min-w-[220px]",
      cell: (row) => (
        <button
          type="button"
          className="min-w-0 text-start"
          onClick={() => router.push(`/campaigns/${row.id}`)}
        >
          <span className="block text-sm font-semibold text-foreground truncate">
            {row.name || "—"}
          </span>
          {row.description ? (
            <span
              className="block text-xs text-muted-foreground truncate max-w-[280px]"
              title={row.description}
            >
              {row.description}
            </span>
          ) : null}
        </button>
      ),
    },
    {
      key: "channel",
      header: t("columns.channel"),
      cell: (row) => (
        <Badge variant="outline" className="font-medium">
          {t(`channels.${row.channel || "whatsapp"}`)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      cell: (row) => (
        <Badge
          variant="outline"
          className={cn("font-medium", STATUS_BADGE_CLASS[row.status])}
        >
          {t(`status.${row.status || "draft"}`)}
        </Badge>
      ),
    },
    {
      key: "scheduleMode",
      header: t("columns.scheduleMode"),
      cell: (row) => (
        <span className="text-sm">
          {t(`scheduleMode.${row.scheduleMode || "now"}`)}
        </span>
      ),
    },
    {
      key: "scheduledAt",
      header: t("columns.scheduledAt"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.scheduleMode === "scheduled" ? formatDate(row.scheduledAt) : "—"}
        </span>
      ),
    },
    {
      key: "sentCount",
      header: t("columns.sent"),
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {Number(row.sentCount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "deliveredCount",
      header: t("columns.delivered"),
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {Number(row.deliveredCount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "readCount",
      header: t("columns.read"),
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {Number(row.readCount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "repliedCount",
      header: t("columns.replied"),
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {Number(row.repliedCount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "ordersCount",
      header: t("columns.orders"),
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {Number(row.ordersCount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "salesAmount",
      header: t("columns.sales"),
      cell: (row) => (
        <span className="text-sm tabular-nums whitespace-nowrap">
          {formatMoney(row.salesAmount)}
        </span>
      ),
    },
    {
      key: "costAmount",
      header: t("columns.cost"),
      cell: (row) => (
        <span className="text-sm tabular-nums whitespace-nowrap">
          {formatMoney(row.costAmount)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("columns.actions"),
      className: "md:sticky md:z-20",
      cell: (row) => <ActionButtons row={row} actions={rowActions(row)} />,
    },
  ];

  const confirmCopy = {
    start: {
      title: t("confirm.startTitle"),
      description: t("confirm.startDesc", { name: confirm.row?.name || "—" }),
      confirmText: t("actions.startNow"),
    },
    cancel: {
      title: t("confirm.cancelTitle"),
      description: t("confirm.cancelDesc", { name: confirm.row?.name || "—" }),
      confirmText: t("actions.cancel"),
    },
    retry: {
      title: t("confirm.retryTitle"),
      description: t("confirm.retryDesc", { name: confirm.row?.name || "—" }),
      confirmText: t("actions.retryFailed"),
    },
    delete: {
      title: t("confirm.deleteTitle"),
      description: t("confirm.deleteDesc", { name: confirm.row?.name || "—" }),
      confirmText: t("actions.delete"),
    },
  }[confirm.type] || {};

  return (
    <div className="min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.campaigns") },
        ]}
        stats={statsCards}
        statsLoading={statsLoading}
        buttons={
          <Button_
            size="sm"
            label={t("actions.new")}
            variant="solid"
            icon={<Plus size={18} />}
            permission="campaigns.create"
            onClick={() => router.push("/campaigns/new")}
          />
        }
      />

      <Table
        tableKey="campaigns"
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {
          setPage(1);
          setDebouncedSearch(search);
        }}
        actions={[
          {
            key: "exportCampaigns",
            label: t("toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileDown size={14} />
            ),
            color: "primary",
            disabled: exportLoading,
            permission: "campaigns.read",
            onClick: () =>
              handleExport({
                endpoint: "/campaigns/export",
                params: exportParams,
                filename: "campaigns.xlsx",
              }),
          },
        ]}
        filters={
          <>
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("all")}</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            {/* <FilterField label={t("filters.channel")}>
              <Select
                value={filters.channel}
                onValueChange={(v) => setFilters((f) => ({ ...f, channel: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.channel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("all")}</SelectItem>
                  {CHANNELS.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {t(`channels.${channel}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField> */}
          </>
        }
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        labels={{
          searchPlaceholder: t("table.searchPlaceholder"),
          filter: tc("filter"),
          apply: tc("apply"),
          emptyTitle: t("table.emptyTitle"),
          emptySubtitle: t("table.emptySubtitle"),
        }}
        columns={columns}
        data={records}
        isLoading={loading}
        rowKey={(row) => row.id}
        pagination={pagination}
        onPageChange={handlePageChange}
        compact
        striped
      />

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(open) => {
          if (!open) closeConfirm();
        }}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmText={confirmCopy.confirmText}
        cancelText={tc("cancel")}
        loading={confirmLoading}
        onConfirm={() => runAction(confirm.type, confirm.row)}
      />
    </div>
  );
}
