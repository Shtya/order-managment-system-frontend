"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Edit,
  FileDown,
  Layers,
  Loader2,
  Plus,
  Power,
  Trash2,
  UserCheck,
  UserX,
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
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

const DEFAULT_FILTERS = { status: "all" };
const API_BASE = "/client-segment-templates/admin";

const STAT_CARDS = [
  { key: "total", icon: Layers, sortOrder: 0 },
  { key: "active", icon: UserCheck, sortOrder: 1 },
  { key: "inactive", icon: UserX, sortOrder: 2 },
];

export default function AdminSegmentTemplatesPage() {
  const tc = useTranslations("common");
  const t = useTranslations("customerSegmentTemplates");
  const format = useFormatter();
  const router = useRouter();
  const { handleExport, exportLoading } = useExport();

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
      const res = await api.get(`${API_BASE}/stats`);
      setStats(res.data || {});
    } catch (error) {
      console.error("Failed to fetch template stats:", error);
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
      return params;
    },
    [appliedFilters, debouncedSearch],
  );

  const fetchTemplates = useCallback(
    async ({
      page: p = page,
      limit: l = limit,
      filterState = appliedFilters,
      searchValue = debouncedSearch,
    } = {}) => {
      setLoading(true);
      try {
        const res = await api.get(API_BASE, {
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
    fetchTemplates({ page: 1, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
    fetchTemplates({ page: 1, limit, filterState: filters });
  };

  const hasActiveFilters = useMemo(() => appliedFilters.status !== "all", [appliedFilters]);

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
    fetchTemplates({ page: p, limit: l });
  };

  const refresh = useCallback(() => {
    fetchTemplates({ page, limit });
    fetchStats();
  }, [fetchTemplates, fetchStats, limit, page]);

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
      await api.patch(`${API_BASE}/${togglingSegment.id}`, { status: nextStatus });
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
      await api.delete(`${API_BASE}/${deletingSegment.id}`);
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

  const exportParams = buildParams(1, 10000);

  const rowActions = (row) => [
    {
      icon: <Edit />,
      tooltip: t("actions.edit"),
      variant: "blue",
      onClick: () => router.push(`/dashboard/customers/segments/${row.id}/edit`),
    },
    {
      icon: <Power size={16} />,
      tooltip: row.status === "active" ? t("actions.disable") : t("actions.enable"),
      variant: row.status === "active" ? "orange" : "emerald",
      onClick: () => openToggleConfirm(row),
    },
    {
      icon: <Trash2 />,
      tooltip: t("actions.delete"),
      variant: "red",
      onClick: () => openDelete(row),
    },
  ];

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
      key: "status",
      header: t("columns.status"),
      cell: (row) => (
        <Badge variant={row.status === "active" ? "secondary" : "outline"}>
          {t(`status.${row.status === "active" ? "active" : "inactive"}`)}
        </Badge>
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
            onClick={() => router.push("/dashboard/customers/segments/new")}
          />
        }
      />

      <Table
        tableKey="customer-segment-templates"
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {
          setPage(1);
          setDebouncedSearch(search);
        }}
        actions={[
          {
            key: "exportTemplates",
            label: t("toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileDown size={14} />
            ),
            color: "primary",
            disabled: exportLoading,
            onClick: () =>
              handleExport({
                endpoint: `${API_BASE}/export`,
                params: exportParams,
                filename: "client-segment-templates.xlsx",
              }),
          },
        ]}
        filters={
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
