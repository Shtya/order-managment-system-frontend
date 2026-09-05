
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Edit,
  FileDown,
  Loader2,
  Plus,
  Power,
  Snowflake,
  Trash2,
  Unlock,
  Users,
  UserCheck,
  Layers,
  AlertTriangle,
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

const DEFAULT_FILTERS = { status: "all", type: "all" };
const DESCRIPTION_MAX_LENGTH = 80;

const STAT_CARDS = [
  { key: "total", icon: Layers, sortOrder: 0 },
  { key: "active", icon: UserCheck, sortOrder: 1 },
  { key: "dynamic", icon: Users, sortOrder: 2 },
  { key: "frozen", icon: Snowflake, sortOrder: 3 },
//   { key: "freezing", icon: Loader2, sortOrder: 4 },
  { key: "freeze_failed", icon: AlertTriangle, sortOrder: 5 },
];

const TYPE_BADGE_CLASS = {
  dynamic: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  frozen: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
  freezing: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  freeze_failed: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function CustomerSegmentsPage() {
    const tc = useTranslations("common");
    const t = useTranslations("customerSegments");
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSegment, setDeletingSegment] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState(null);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [togglingSegment, setTogglingSegment] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
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
      const res = await api.get("/client-segments/stats");
      setStats(res.data || {});
    } catch (error) {
      console.error("Failed to fetch segment stats:", error);
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
      if (filterState.type && filterState.type !== "all") {
        params.type = filterState.type;
      }
      return params;
    },
    [appliedFilters, debouncedSearch],
  );

  const fetchSegments = useCallback(
    async ({
      page: p = page,
      limit: l = limit,
      filterState = appliedFilters,
      searchValue = debouncedSearch,
    } = {}) => {
      setLoading(true);
      try {
        const res = await api.get("/client-segments", {
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
    fetchSegments({ page: 1, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!subscribe) return;
    const off = subscribe("CLIENT_SEGMENT_FREEZE_STATUS", (payload) => {
      const segment = payload?.segment;
      if (!segment?.id) return;
      setRecords((prev) =>
        prev.map((row) => (row.id === segment.id ? { ...row, ...segment } : row)),
      );
      fetchStats();
      if (payload?.status === "failed") {
        toast.error(t("toast.freezeFailed"));
      } else {
        toast.success(t("toast.frozenDone"));
      }
    });
    return () => off?.();
  }, [subscribe, fetchStats, t]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
    fetchSegments({ page: 1, limit, filterState: filters });
  };

  const hasActiveFilters = useMemo(
    () => appliedFilters.status !== "all" || appliedFilters.type !== "all",
    [appliedFilters],
  );

  const statsCards = useMemo(
    () =>
      STAT_CARDS.map(({ key, icon, sortOrder }) => ({
        key,
        name: t(`stats.${key}`),
        value: stats?.[key] ?? 0,
        icon,
        sortOrder,
      })),
    [stats, t],
  );

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

  const handlePageChange = ({ page: p, per_page: l }) => {
    setPage(p);
    setLimit(l);
    fetchSegments({ page: p, limit: l });
  };

  const refresh = useCallback(() => {
    fetchSegments({ page, limit });
    fetchStats();
  }, [fetchSegments, fetchStats, limit, page]);

  const openDelete = (segment) => {
    setDeletingSegment(segment);
    setDeleteOpen(true);
  };

  const openToggleConfirm = (segment) => {
    setTogglingSegment(segment);
    setToggleOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!togglingSegment) return;
    const nextStatus = togglingSegment.status === "active" ? "inactive" : "active";
    setToggleLoading(true);
    try {
      await api.patch(`/client-segments/${togglingSegment.id}`, { status: nextStatus });
      toast.success(t("toast.statusUpdated"));
      setToggleOpen(false);
      setTogglingSegment(null);
      refresh();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.fetchFailed"));
    } finally {
      setToggleLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSegment) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/client-segments/${deletingSegment.id}`);
      toast.success(t("toast.deleted"));
      setDeleteOpen(false);
      setDeletingSegment(null);
      refresh();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.deleteFailed"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFreeze = async (segment) => {
    setMutatingId(segment.id);
    try {
      await api.post(`/client-segments/${segment.id}/freeze`);
      toast.success(t("toast.frozen"));
      refresh();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.freezeFailed"));
    } finally {
      setMutatingId(null);
    }
  };

  const handleUnfreeze = async (segment) => {
    setMutatingId(segment.id);
    try {
      await api.post(`/client-segments/${segment.id}/unfreeze`);
      toast.success(t("toast.unfrozen"));
      refresh();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.unfreezeFailed"));
    } finally {
      setMutatingId(null);
    }
  };

  const exportParams = buildParams(1, 10000);

  const rowActions = (row) => {
    const busy = mutatingId === row.id;
    const actions = [
      {
        icon: <Edit />,
        tooltip: t("actions.edit"),
        variant: "blue",
        permission: "client-segments.update",
        onClick: () => router.push(`/customers/segments/${row.id}/edit`),
      },
      {
        icon: <Power size={16} />,
        tooltip: row.status === "active" ? t("actions.disable") : t("actions.enable"),
        variant: row.status === "active" ? "orange" : "emerald",
        permission: "client-segments.update",
        onClick: () => openToggleConfirm(row),
      },
    ];

    if (row.type === "dynamic" || row.type === "freeze_failed") {
      actions.push({
        icon: busy ? <Loader2 className="animate-spin" /> : <Snowflake />,
        tooltip: t("actions.freeze"),
        variant: "emerald",
        permission: "client-segments.freeze",
        disabled: busy,
        onClick: () => handleFreeze(row),
      });
    }

    if (row.type === "frozen" || row.type === "freeze_failed") {
      actions.push({
        icon: busy ? <Loader2 className="animate-spin" /> : <Unlock />,
        tooltip: t("actions.unfreeze"),
        variant: "orange",
        permission: "client-segments.freeze",
        disabled: busy,
        onClick: () => handleUnfreeze(row),
      });
    }

    actions.push({
      icon: <Trash2 />,
      tooltip: t("actions.delete"),
      variant: "red",
      permission: "client-segments.delete",
      onClick: () => openDelete(row),
    });

    return actions;
  };

  const columns = [
    {
      key: "name",
      header: t("columns.name"),
      className: "min-w-[220px]",
      cell: (row) => (
        <div className="min-w-0">
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
        </div>
      ),
    },
    {
      key: "type",
      header: t("columns.type"),
      cell: (row) => (
        <Badge
          variant="outline"
          className={cn("gap-1 font-medium", TYPE_BADGE_CLASS[row.type])}
        >
          {row.type === "freezing" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          {t(`types.${row.type || "dynamic"}`)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      cell: (row) => (
        <Badge variant={row.status === "active" ? "secondary" : "outline"}>
          {t(`status.${row.status === "active" ? "active" : "inactive"}`)}
        </Badge>
      ),
    },
    {
      key: "frozenRecipientsCount",
      header: t("columns.frozenRecipientsCount"),
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {Number(row.frozenRecipientsCount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "frozenAt",
      header: t("columns.frozenAt"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.frozenAt)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: t("columns.createdAt"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.createdAt)}
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

  return (
    <div className="min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.customers"), href: "/customers" },
          { name: t("breadcrumb.segments") },
        ]}
        stats={statsCards}
        statsLoading={statsLoading}
        buttons={
          <Button_
            size="sm"
            label={t("actions.new")}
            variant="solid"
            icon={<Plus size={18} />}
            permission="client-segments.create"
            onClick={() => router.push("/customers/segments/new")}
          />
        }
      />

      <Table
        tableKey="customer-segments"
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {
          setPage(1);
          setDebouncedSearch(search);
        }}
        actions={[
          {
            key: "exportSegments",
            label: t("toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileDown size={14} />
            ),
            color: "primary",
            disabled: exportLoading,
            permission: "client-segments.read",
            onClick: () =>
              handleExport({
                endpoint: "/client-segments/export",
                params: exportParams,
                filename: "client-segments.xlsx",
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
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filters.type")}>
              <Select
                value={filters.type}
                onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("all")}</SelectItem>
                  <SelectItem value="dynamic">{t("types.dynamic")}</SelectItem>
                  <SelectItem value="frozen">{t("types.frozen")}</SelectItem>
                  <SelectItem value="freezing">{t("types.freezing")}</SelectItem>
                  <SelectItem value="freeze_failed">{t("types.freeze_failed")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
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
        open={deleteOpen}
        onOpenChange={(open) => setDeleteOpen(open)}
        title={t("delete.title")}
        description={t("delete.desc", { name: deletingSegment?.name || "—" })}
        confirmText={t("delete.confirm")}
        cancelText={t("delete.cancel")}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={(open) => {
          setToggleOpen(open);
          if (!open) setTogglingSegment(null);
        }}
        title={
          togglingSegment?.status === "active"
            ? t("toggle.disableTitle")
            : t("toggle.enableTitle")
        }
        description={
          togglingSegment?.status === "active"
            ? t("toggle.disableDescription", { name: togglingSegment?.name || "—" })
            : t("toggle.enableDescription", { name: togglingSegment?.name || "—" })
        }
        confirmText={t("toggle.confirm")}
        cancelText={t("toggle.cancel")}
        loading={toggleLoading}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}
