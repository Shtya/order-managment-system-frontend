"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import ActionButtons from "@/components/atoms/Actions";
import {
  Download,
  Loader2,
  RefreshCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Store,
  AlertCircle,
  PackageX,
  ShoppingBag,
  Eye,
  Wrench,
  Package,
  FileJson,
  CheckCircle2,
  X,
  User,
  Phone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/api";

// ── Shared Table system ──────────────────────────────────────────────────────
import Table, { FilterField } from "@/components/atoms/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { useSocket } from "@/context/SocketContext";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { useDebounce } from "@/hook/useDebounce";
import { FailedOrderDetailsModal } from "./FailedOrderDetailsModal";
import { useRouter } from "@/i18n/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Failure Details Modal Skeleton
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// Failed-order status config
// Maps OrderFailStatus enum → display props
// ─────────────────────────────────────────────────────────────────────────────
const FAIL_STATUS_CONFIG = {
  pending: {
    color: "#f59e0b",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-200 dark:border-amber-800",
    icon: Clock,
    labelKey: "failedOrders.statuses.pending",
  },
  retrying: {
    color: "#3b82f6",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    textClass: "text-blue-700 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-800",
    icon: RefreshCcw,
    labelKey: "failedOrders.statuses.retrying",
  },
  success: {
    color: "#10b981",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-200 dark:border-amber-800",
    icon: CheckCircle,
    labelKey: "failedOrders.statuses.success",
  },
  failed: {
    color: "#ef4444",
    bgClass: "bg-red-50 dark:bg-red-950/30",
    textClass: "text-red-700 dark:text-red-400",
    borderClass: "border-red-200 dark:border-red-800",
    icon: XCircle,
    labelKey: "failedOrders.statuses.failed",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Stats card definition  (icons + colors match ReplacementTab's REPLACEMENT_STATS)
// ─────────────────────────────────────────────────────────────────────────────
const FAILED_STATS_TEMPLATE = [
  // {
  //     id: 1,
  //     code: "total",
  //     title: "failedOrders.stats.total",
  //     color: "var(--primary)",
  //     darkColor: "#5b4bff",
  //     icon: PackageX,
  // },
  {
    id: 2,
    code: "pending",
    title: "failedOrders.stats.pending",
    color: "#f59e0b",
    darkColor: "#f59e0b",
    icon: Clock,
  },
  {
    id: 3,
    code: "retrying",
    title: "failedOrders.stats.retrying",
    color: "#3b82f6",
    darkColor: "#3b82f6",
    icon: RefreshCcw,
  },
  {
    id: 4,
    code: "success",
    title: "failedOrders.stats.success",
    color: "#10b981",
    darkColor: "#10b981",
    icon: CheckCircle,
  },
  {
    id: 5,
    code: "failed",
    title: "failedOrders.stats.failed",
    color: "#ef4444",
    darkColor: "#ef4444",
    icon: XCircle,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FailStatusBadge — mirrors StatusBadge from ReplacementTab
// ─────────────────────────────────────────────────────────────────────────────
function FailStatusBadge({ status, t }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const cfg = FAIL_STATUS_CONFIG[status] ?? {
    color: "#888",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
    icon: AlertCircle,
    labelKey: null,
  };
  const Icon = cfg.icon;
  const label = cfg.labelKey ? t(cfg.labelKey) : status;

  return (
    <Badge
      className={cn(
        "rounded-xl px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 w-fit",
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
      )}
      style={{ borderColor: `${cfg.color}44`, color: cfg.color }}
    >
      <Icon size={11} className="shrink-0" />
      {label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorReasonCell — shows the failure reason in a readable way
// ─────────────────────────────────────────────────────────────────────────────
function ErrorReasonCell({ row }) {
  const reason = row.errorReason ?? row.reason ?? row.error ?? null;
  if (!reason) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-start gap-1.5 max-w-[200px] cursor-default">
            <AlertTriangle
              size={13}
              className="text-amber-500 shrink-0 mt-0.5"
            />
            <p className="text-xs text-foreground line-clamp-2 leading-snug">
              {reason}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Tab Component
// ─────────────────────────────────────────────────────────────────────────────
export function FailedOrdersTab() {
  const t = useTranslations("orders");
  const { subscribe } = useSocket();
  const router = useRouter()
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search })
  // ── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    retrying: 0,
    success: 0,
    failed: 0,
    total: 0,
  });

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });

  const [filters, setFilters] = useState({
    status: "all",
    storeId: "all",
    startDate: null,
    endDate: null,
  });

  const [stores, setStores] = useState([]);

  // ── Fetch statistics ─────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get("/stores/failed-orders/statistics");
      setStats({
        pending: data.pending ?? 0,
        retrying: data.retrying ?? 0,
        success: data.success ?? 0,
        failed: data.failed ?? 0,
        total: data.total ?? 0,
      });
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);



  // ── Fetch stores for filter ──────────────────────────────────────────────
  const fetchStores = useCallback(async () => {
    try {
      const { data } = await api.get("/stores", { params: { limit: 200 } });
      setStores(Array.isArray(data.records) ? data.records : []);
    } catch (_) { }
  }, []);

  // ── Build query params ───────────────────────────────────────────────────
  const buildParams = useCallback(
    (page = pager.current_page, per_page = pager.per_page) => {
      const params = { page, limit: per_page };
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.storeId && filters.storeId !== "all")
        params.storeId = filters.storeId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      return params;
    },
    [filters, pager.current_page, pager.per_page],
  );

  // ── Fetch failed orders list ─────────────────────────────────────────────
  const fetchFailedOrders = useCallback(
    async (page = pager.current_page, per_page = pager.per_page) => {
      setLoading(true);
      try {
        const res = await api.get("/stores/failed-orders", {
          params: buildParams(page, per_page),
        });
        const data = res.data ?? {};
        setPager({
          total_records: data.total_records ?? 0,
          current_page: data.current_page ?? page,
          per_page: data.per_page ?? per_page,
          records: Array.isArray(data.records) ? data.records : [],
        });
      } catch (e) {
        console.error(e);
        toast.error(t("failedOrders.messages.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [buildParams, t],
  );

  useEffect(() => {
    const unsubscribe = subscribe("FAILED_ORDER_UPDATE", (payload) => {
      if (payload) {
        const { failureId, status, attempts } = payload;

        setPager((prev) => ({
          ...prev,
          records: prev.records.map((record) =>
            record.id === failureId ? { ...record, status, attempts } : record,
          ),
        }));
      }
    });

    return unsubscribe;
  }, [subscribe]);
  const handlePageChange = ({ page, per_page }) => {
    fetchFailedOrders(page, per_page);
  };

  useEffect(() => {
    handlePageChange(1, pager.per_page);
  }, [debouncedSearch]);

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    let toastId;
    try {
      setExportLoading(true);
      toastId = toast.loading(t("messages.exportStarted"));
      const params = buildParams();
      delete params.page;
      delete params.limit;

      const response = await api.get("/stores/failed-orders/export", {
        params,
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = `failed_orders_${Date.now()}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match?.[1]) filename = match[1].replace(/"/g, "");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t("messages.exportSuccess"), { id: toastId });
    } catch (e) {
      toast.error(e?.response?.data?.message || t("messages.exportFailed"), {
        id: toastId,
      });
    } finally {
      setExportLoading(false);
    }
  }, [buildParams, t]);

  // ── Apply filters ────────────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    fetchFailedOrders(1, pager.per_page);
    fetchStats();
  }, [fetchFailedOrders, fetchStats, pager.per_page]);

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v !== "all" && v !== null,
  );

  // ── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFailedOrders(1, pager.per_page);
    fetchStats();
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Refresh everything (called after a retry) ────────────────────────────
  const handleRefreshAll = useCallback(() => {
    fetchFailedOrders(pager.current_page, pager.per_page);
    fetchStats();
  }, [fetchFailedOrders, fetchStats, pager.current_page, pager.per_page]);

  // ── Stats cards (live values from API) ───────────────────────────────────
  const liveStats = useMemo(
    () =>
      FAILED_STATS_TEMPLATE.map((s) => ({
        id: s.id,
        name: t(s.title),
        value: s.code === "total" ? stats.total : (stats[s.code] ?? 0),
        icon: s.icon,
        color: s.color,
        sortOrder: s.id,
        loading: statsLoading,
      })),
    [stats, statsLoading, t],
  );

  // ── Modal State ──────────────────────────────────────────────────────────
  const [modalConfig, setModalConfig] = useState({
    open: false,
    failureId: null,
    fixMode: false,
  });

  const handleOpenModal = (id, fixMode = false) => {
    setModalConfig({ open: true, failureId: id, fixMode });
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      // ID / reference
      // {
      //   key: "id",
      //   header: "#",
      //   cell: (row) => (
      //     <span className="font-mono text-xs text-muted-foreground font-semibold">
      //       #{row.id}
      //     </span>
      //   ),
      // },

      // Source store
      {
        key: "store",
        header: t("failedOrders.columns.store"),
        cell: (row) => {
          const storeName = row.store?.name ?? row.storeName ?? "—";
          const provider = row.store?.provider ?? row.provider ?? null;
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                <ShoppingBag size={13} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {storeName}
                </p>
                {provider && (
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {provider}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: t("failedOrders.columns.status"),
        cell: (row) => <FailStatusBadge status={row.status} t={t} />,
      },

      // Customer name
      {
        key: "customerName",
        header: t("failedOrders.columns.customerName"),
        cell: (row) => (
          <span className="text-gray-700 dark:text-slate-200 font-semibold text-sm">
            {row.customerName ?? row.payload?.customerName ?? "—"}
          </span>
        ),
      },

      //phone number
      {
        key: "phoneNumber",
        header: t("failedOrders.columns.customerPhone"),
        cell: (row) => (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
            <Phone size={14} />
            {row.phoneNumber ?? row.payload?.customerPhone ?? "—"}
          </div>
        ),
      },
      {
        key: "email",
        header: t("failedOrders.columns.customerEmail"),
        cell: (row) => (
          <span className="text-gray-700 dark:text-slate-200 font-semibold text-sm">
            {row.email ?? row.payload?.email ?? "—"}
          </span>
        ),
      },
      // Items Name vs Quantity
      {
        key: "itemNameVsQuantity",
        header: t("failedOrders.columns.itemNameVsQuantity"),
        cell: (row) => {
          const items = row.payload?.cartItems || row.payload?.items || [];
          return (
            <div className="text-sm">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 text-gray-700 dark:text-slate-300">
                    <span>{item.name || item.productName || "Product"}</span>
                    <span className="text-muted-foreground"> (x{item.quantity})</span>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground italic text-xs">—</span>
              )}
            </div>
          );
        },
      },

      // External order reference
      {
        key: "externalOrderId",
        header: t("failedOrders.columns.externalOrderId"),
        cell: (row) => (
          <span className="font-mono text-xs text-[var(--primary)] font-semibold">
            {row.externalOrderId ?? row.externalId ?? "—"}
          </span>
        ),
      },

      // Failure reason / error message
      {
        key: "errorReason",
        header: t("failedOrders.columns.errorReason"),
        cell: (row) => <ErrorReasonCell row={row} />,
      },

      // Last retry failed reason
      {
        key: "lastRetryFailedReason",
        header: t("failedOrders.columns.lastRetryFailedReason"),
        cell: (row) => (
          <div className="max-w-[200px] truncate">
            {row.lastRetryFailedReason ? (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {row.lastRetryFailedReason}
              </span>
            ) : (
              <span className="text-muted-foreground italic text-xs">—</span>
            )}
          </div>
        ),
      },

      // Status badge


      // Retry count
      {
        key: "retryCount",
        header: t("failedOrders.columns.retryCount"),
        cell: (row) => {
          const count = row.retryCount ?? row.attempts ?? 0;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border",
                  count === 0
                    ? "bg-muted text-muted-foreground border-border"
                    : count >= 3
                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                      : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                )}
              >
                <RefreshCcw size={9} />
                {count}
              </span>
            </div>
          );
        },
      },

      // Created at
      {
        key: "createdAt",
        header: t("table.createdat"),
        cell: (row) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(row.createdAt ?? row.created_at)}
          </span>
        ),
      },

      {
        key: "actions",
        header: t("table.actions"),
        cell: (row) => {
          const isRetryable =
            row.status !== "success" && row.status !== "retrying";

          return (
            <ActionButtons
              row={row}
              actions={[
                {
                  icon: <Eye />,
                  tooltip: t(row.status !== "success" ? "failedOrders.actions.showAndFix" : "failedOrders.actions.showDetails"),
                  onClick: (r) => router.push(`/orders/failedOrders/${r.id}`),
                  variant: "outline",
                }
              ]}
            />
          );
        },
      },
    ],
    [t, handleRefreshAll],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("tabs.pendingOrders") },
        ]}
        buttons={
          <Button_
            onClick={handleRefreshAll}
            size="sm"
            label={t("actions.refresh")}
            variant="outline"
            icon={<RefreshCcw size={16} />}
          />
        }
        statsCount={FAILED_STATS_TEMPLATE.length}
        stats={liveStats}
      />

      <Table
        // ── i18n ────────────────────────────────────────────────────────
        labels={{
          searchPlaceholder: t("failedOrders.searchPlaceholder"),
          filter: t("toolbar.filter"),
          apply: t("filters.apply"),
          total: t("pagination.total"),
          limit: t("pagination.limit"),
          emptyTitle: t("failedOrders.empty.title"),
          emptySubtitle: t("failedOrders.empty.subtitle"),
          preview: t("image.preview"),
        }}
        // ── Toolbar actions ──────────────────────────────────────────────
        actions={[
          // {
          //     key: "refresh",
          //     label: t("actions.refresh"),
          //     icon: <RefreshCcw size={14} />,
          //     color: "gray",
          //     onClick: handleRefreshAll,
          //     disabled: loading,
          // },
          {
            key: "export",
            label: t("toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "primary",
            onClick: handleExport,
            disabled: exportLoading,
          },
        ]}
        // ── Filters ──────────────────────────────────────────────────────
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        searchValue={search}
        onSearchChange={setSearch}
        data={pager.records}
        columns={columns}
        isLoading={loading}
        pager={pager}
        // ── Pagination ───────────────────────────────────────────────────
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={({ page, per_page }) => fetchFailedOrders(page, per_page)}
        filters={
          <>
            {/* Status filter */}
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-amber-500" />
                      {t("failedOrders.statuses.pending")}
                    </div>
                  </SelectItem>
                  <SelectItem value="retrying">
                    <div className="flex items-center gap-2">
                      <RefreshCcw size={12} className="text-blue-500" />
                      {t("failedOrders.statuses.retrying")}
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-emerald-500" />
                      {t("failedOrders.statuses.success")}
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      <XCircle size={12} className="text-red-500" />
                      {t("failedOrders.statuses.failed")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            {/* Store filter */}
            <FilterField label={t("failedOrders.filters.store")}>
              <Select
                value={filters.storeId}
                onValueChange={(v) => setFilters((f) => ({ ...f, storeId: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue
                    placeholder={t("failedOrders.filters.storePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <div className="flex items-center gap-2">
                        <Store size={12} className="text-muted-foreground" />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* Date range */}
            <FilterField label={t("filters.date")}>
              <DateRangePicker
                value={{
                  startDate: filters.startDate,
                  endDate: filters.endDate,
                }}
                onChange={(newDates) =>
                  setFilters((prev) => ({
                    ...prev,
                    ...newDates,
                  }))
                }
                placeholder={t("filters.datePlaceholder")}
                dataSize="default"
                maxDate="today"
              />
            </FilterField>
          </>
        }
      />

      <FailedOrderDetailsModal
        open={modalConfig.open}
        onOpenChange={(open) => setModalConfig((prev) => ({ ...prev, open }))}
        failureId={modalConfig.failureId}
        fixMode={modalConfig.fixMode}
        onRetrySuccess={handleRefreshAll}
      />
    </>
  );
}

export default FailedOrdersTab;
