"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";

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
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

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
        borderClass: "border-emerald-200 dark:border-emerald-800",
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
    //     color: "#ff8b00",
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
                "rounded-lg px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 w-fit",
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
// RetryButton — action cell component
// Only shown when status is NOT success or retrying
// ─────────────────────────────────────────────────────────────────────────────
function RetryButton({ row, onRetrySuccess, t }) {
    const [retrying, setRetrying] = useState(false);
    const isRetryable =
        row.status !== "success" && row.status !== "retrying";

    const handleRetry = async () => {
        if (!isRetryable || retrying) return;
        setRetrying(true);
        try {
            await api.post(`/stores/failed-orders/${row.id}/retry`);
            toast.success(t("failedOrders.messages.retryStarted"));
            onRetrySuccess?.();
        } catch (e) {
            toast.error(
                e?.response?.data?.message ?? t("failedOrders.messages.retryFailed")
            );
        } finally {
            setRetrying(false);
        }
    };

    if (!isRetryable) {
        return (
            <span className="text-xs text-muted-foreground italic">
                {row.status === "success"
                    ? t("failedOrders.actions.alreadySuccess")
                    : t("failedOrders.actions.retrying")}
            </span>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <m.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRetry}
                        disabled={retrying}
                        className={cn(
                            "group w-9 h-9 rounded-full border transition-all duration-200",
                            "flex items-center justify-center shadow-sm",
                            "border-orange-200 bg-orange-50 text-orange-600",
                            "hover:bg-orange-600 hover:border-orange-600 hover:text-white",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                    >
                        {retrying ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <RotateCcw
                                size={15}
                                className="transition-transform group-hover:rotate-[-90deg] duration-300"
                            />
                        )}
                    </m.button>
                </TooltipTrigger>
                <TooltipContent>
                    {retrying
                        ? t("failedOrders.actions.retrying")
                        : t("failedOrders.actions.retry")}
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
            if (filters.status && filters.status !== "all") params.status = filters.status;
            if (filters.storeId && filters.storeId !== "all") params.storeId = filters.storeId;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            return params;
        },
        [filters, pager.current_page, pager.per_page]
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
        [buildParams, t]
    );

    useEffect(() => {
        const unsubscribe = subscribe("FAILED_ORDER_PAGE", (action) => {
            if (action.type === "FAILED_ORDER_UPDATE") {
                const { failureId, status, attempts } = action.payload;

                setPager(prev => ({
                    ...prev,
                    records: prev.records.map(record =>
                        record.id === failureId
                            ? { ...record, status, attempts }
                            : record
                    )
                }));
            }
        });

        return unsubscribe;
    }, [subscribe]);

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
            toast.error(
                e?.response?.data?.message || t("messages.exportFailed"),
                { id: toastId }
            );
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
        (v) => v && v !== "all" && v !== null
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
                value: s.code === "total" ? stats.total : stats[s.code] ?? 0,
                icon: s.icon,
                color: s.color,
                sortOrder: s.id,
                loading: statsLoading,
            })),
        [stats, statsLoading, t]
    );

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns = useMemo(
        () => [
            // ID / reference
            {
                key: "id",
                header: "#",
                cell: (row) => (
                    <span className="font-mono text-xs text-muted-foreground font-semibold">
                        #{row.id}
                    </span>
                ),
            },

            // Source store
            {
                key: "store",
                header: t("failedOrders.columns.store"),
                cell: (row) => {
                    const storeName = row.store?.name ?? row.storeName ?? "—";
                    const provider = row.store?.provider ?? row.provider ?? null;
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
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

            // Customer name
            {
                key: "customerName",
                header: t("failedOrders.columns.customerName"),
                cell: (row) => (
                    <span className="font-semibold text-foreground text-sm">
                        {row.customerName ?? row.payload?.customerName ?? "—"}
                    </span>
                ),
            },
            //phone number
            {
                key: "customerName",
                header: t("failedOrders.columns.customerPhone"),
                cell: (row) => (
                    <span className="font-semibold text-foreground text-sm">
                        {row.phoneNumber ?? row.payload?.customerPhone ?? "—"}
                    </span>
                ),
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

            // Status badge
            {
                key: "status",
                header: t("failedOrders.columns.status"),
                cell: (row) => <FailStatusBadge status={row.status} t={t} />,
            },

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

            // Last updated
            {
                key: "updatedAt",
                header: t("table.lastUpdate"),
                cell: (row) => (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(row.updatedAt ?? row.updated_at)}
                    </span>
                ),
            },

            // Actions — retry button
            {
                key: "actions",
                header: t("table.actions"),
                cell: (row) => (
                    <RetryButton
                        row={row}
                        onRetrySuccess={handleRefreshAll}
                        t={t}
                    />
                ),
            },
        ],
        [t, handleRefreshAll]
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/" },
                    { name: t("tabs.failedOrders") },
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
                        color: "blue",
                        onClick: handleExport,
                        disabled: exportLoading,
                    },
                ]}

                // ── Filters ──────────────────────────────────────────────────────
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                filters={
                    <>
                        {/* Status filter */}
                        <FilterField label={t("filters.status")}>
                            <Select
                                value={filters.status}
                                onValueChange={(v) =>
                                    setFilters((f) => ({ ...f, status: v }))
                                }
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue
                                        placeholder={t("filters.statusPlaceholder")}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t("filters.all")}
                                    </SelectItem>
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
                                onValueChange={(v) =>
                                    setFilters((f) => ({ ...f, storeId: v }))
                                }
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue
                                        placeholder={t("failedOrders.filters.storePlaceholder")}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t("filters.all")}
                                    </SelectItem>
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
                            <Flatpickr
                                value={[
                                    filters.startDate ? new Date(filters.startDate) : null,
                                    filters.endDate ? new Date(filters.endDate) : null,
                                ]}
                                onChange={([start, end]) =>
                                    setFilters((f) => ({
                                        ...f,
                                        startDate: start
                                            ? start.toISOString().split("T")[0]
                                            : null,
                                        endDate: end
                                            ? end.toISOString().split("T")[0]
                                            : null,
                                    }))
                                }
                                options={{
                                    mode: "range",
                                    dateFormat: "Y-m-d",
                                    maxDate: "today",
                                }}
                                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm
                  text-foreground focus:outline-none
                  focus:border-[var(--primary)] dark:focus:border-[#5b4bff]
                  transition-all duration-200"
                                placeholder={t("filters.datePlaceholder")}
                            />
                        </FilterField>
                    </>
                }

                // ── Table data ───────────────────────────────────────────────────
                columns={columns}
                data={pager.records}
                isLoading={loading}

                // ── Pagination ───────────────────────────────────────────────────
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) =>
                    fetchFailedOrders(page, per_page)
                }
            />
        </>
    );
}

export default FailedOrdersTab;