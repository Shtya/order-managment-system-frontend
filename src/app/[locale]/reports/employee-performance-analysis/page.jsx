"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion as m } from "framer-motion";
import {
    Download,
    Loader2,
    Users,
    TrendingUp,
    CheckCircle,
    Truck,
    ShoppingBag,
    HelpCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// ── Shared Table system ──────────────────────────────────────────────────────
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "—";
    return Number(amount).toLocaleString("ar-EG");
}

function formatPercent(value) {
    if (value === undefined || value === null || isNaN(value)) return "—";
    return `${Number(value).toFixed(1)}%`;
}

// ── Stats Configuration ──────────────────────────────────────────────────────

const EMPLOYEE_STATS = [
    {
        id: 1,
        code: "total",
        nameKey: "employeeStats.stats.totalOrders",
        color: "#ff8b00",
        darkColor: "#5b4bff",
        icon: ShoppingBag,
        sortOrder: 1,
    },
    {
        id: 2,
        code: "confirmed",
        nameKey: "employeeStats.stats.confirmedOrders",
        color: "#3b82f6",
        darkColor: "#3b82f6",
        icon: CheckCircle,
        sortOrder: 2,
    },
    {
        id: 3,
        code: "delivered",
        nameKey: "employeeStats.stats.deliveredOrders",
        color: "#10b981",
        darkColor: "#10b981",
        icon: Truck,
        sortOrder: 3,
    },
    {
        id: 4,
        code: "upsell",
        nameKey: "employeeStats.stats.upsellOrders",
        color: "#8b5cf6",
        darkColor: "#8b5cf6",
        icon: TrendingUp,
        sortOrder: 4,
    },
];

export function EmployeeStatisticsPage() {
    const t = useTranslations("orders");
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statsData, setStatsData] = useState({
        totalOrders: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        upsellOrders: 0,
    });
    const [pager, setPager] = useState({
        total_records: 0,
        current_page: 1,
        per_page: 12,
        records: [],
    });
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
    });

    const searchTimer = useRef(null);

    /* debounce search */
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    useEffect(() => {
        fetchEmployeeStats(1, pager.per_page);
        fetchStatsSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    /* build API params */
    const buildParams = useCallback(
        (page = pager.current_page, per_page = pager.per_page) => {
            const params = { page, limit: per_page };
            if (debouncedSearch) params.search = debouncedSearch;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            return params;
        },
        [debouncedSearch, filters, pager.current_page, pager.per_page],
    );

    /* fetch stats summary */
    const fetchStatsSummary = useCallback(async () => {
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const res = await api.get("/employees/stats/summary", { params });
            const data = res.data ?? {};
            setStatsData({
                totalOrders: data.totalOrders ?? 0,
                confirmedOrders: data.confirmedOrders ?? 0,
                deliveredOrders: data.deliveredOrders ?? 0,
                upsellOrders: data.upsellOrders ?? 0,
            });
        } catch (e) {
            console.error(e);
            toast.error(t("employeeStats.errors.fetchStatsFailed"));
        }
    }, [filters, t]);

    /* fetch employee statistics */
    const fetchEmployeeStats = useCallback(
        async (page = pager.current_page, per_page = pager.per_page) => {
            try {
                setLoading(true);
                const res = await api.get("/employees/stats", { params: buildParams(page, per_page) });
                const data = res.data ?? {};
                setPager({
                    total_records: data.total_records ?? 0,
                    current_page: data.current_page ?? page,
                    per_page: data.per_page ?? per_page,
                    records: Array.isArray(data.records) ? data.records : [],
                });
            } catch (e) {
                console.error(e);
                toast.error(t("employeeStats.errors.fetchFailed"));
            } finally {
                setLoading(false);
            }
        },
        [buildParams, t],
    );

    /* export */
    const handleExport = useCallback(async () => {
        let toastId;
        try {
            setExportLoading(true);
            toastId = toast.loading(t("messages.exportStarted"));
            const params = buildParams();
            delete params.page;
            delete params.limit;

            const response = await api.get("/employees/stats/export", {
                params,
                responseType: "blob",
            });

            const contentDisposition = response.headers["content-disposition"];
            let filename = `Employee_statistics_export_${Date.now()}.xlsx`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";]+)"?/);
                if (match?.[1]) filename = match[1];
            }

            const url = window.URL.createObjectURL(
                new Blob([response.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(t("messages.exportSuccess"), { id: toastId });
        } catch (e) {
            toast.error(e?.response?.data?.message || t("messages.exportFailed"), { id: toastId });
        } finally {
            setExportLoading(false);
        }
    }, [buildParams, t]);

    const applyFilters = useCallback(() => {
        fetchEmployeeStats(1, pager.per_page);
        fetchStatsSummary();
    }, [fetchEmployeeStats, fetchStatsSummary, pager.per_page]);

    const hasActiveFilters = Object.values(filters).some((v) => v && v !== "all" && v !== null);

    /* ── Columns ── */
    const columns = useMemo(
        () => [
            {
                key: "employeeName",
                header: t("employeeStats.columns.employeeName"),
                cell: (row) => (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users size={14} className="text-primary" />
                        </div>
                        <span className="font-semibold text-foreground text-sm">
                            {row.employeeName ?? "—"}
                        </span>
                    </div>
                ),
            },
            {
                key: "receivedOrders",
                header: t("employeeStats.columns.receivedOrders"),
                cell: (row) => (
                    <span className="font-bold text-sm tabular-nums">
                        {formatCurrency(row.receivedOrders)}
                    </span>
                ),
            },
            {
                key: "confirmedOrders",
                header: t("employeeStats.columns.confirmedOrders"),
                cell: (row) => (
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm tabular-nums">
                        {formatCurrency(row.confirmedOrders)}
                    </span>
                ),
            },
            {
                key: "confirmationRate",
                header: t("employeeStats.columns.confirmationRate"),
                cell: (row) => {
                    const rate = row.confirmationRate;
                    const isHigh = rate >= 70;
                    const isMedium = rate >= 50 && rate < 70;
                    return (
                        <span
                            className={cn(
                                "font-bold text-sm px-2.5 py-1 rounded-lg tabular-nums",
                                isHigh && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
                                isMedium && "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
                                !isHigh && !isMedium && "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                            )}
                        >
                            {formatPercent(rate)}
                        </span>
                    );
                },
            },
            {
                key: "deliveredOrders",
                header: t("employeeStats.columns.deliveredOrders"),
                cell: (row) => (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                        {formatCurrency(row.deliveredOrders)}
                    </span>
                ),
            },
            {
                key: "deliveryRate",
                header: t("employeeStats.columns.deliveryRate"),
                cell: (row) => {
                    const rate = row.deliveryRate;
                    const isHigh = rate >= 80;
                    const isMedium = rate >= 60 && rate < 80;
                    return (
                        <span
                            className={cn(
                                "font-bold text-sm px-2.5 py-1 rounded-lg tabular-nums",
                                isHigh && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
                                isMedium && "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
                                !isHigh && !isMedium && "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                            )}
                        >
                            {formatPercent(rate)}
                        </span>
                    );
                },
            },
            {
                key: "upsellOrders",
                header: t("employeeStats.columns.upsellOrders"),
                cell: (row) => (
                    <span className="font-bold text-purple-600 dark:text-purple-400 text-sm tabular-nums">
                        {formatCurrency(row.upsellOrders)}
                    </span>
                ),
            },
            {
                key: "upsellRate",
                header: t("employeeStats.columns.upsellRate"),
                cell: (row) => {
                    const rate = row.upsellRate;
                    const isHigh = rate >= 30;
                    const isMedium = rate >= 15 && rate < 30;
                    return (
                        <span
                            className={cn(
                                "font-bold text-sm px-2.5 py-1 rounded-lg tabular-nums",
                                isHigh && "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
                                isMedium && "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
                                !isHigh && !isMedium && "bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400"
                            )}
                        >
                            {formatPercent(rate)}
                        </span>
                    );
                },
            },
        ],
        [t]
    );

    /* ── Render ── */
    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/" },
                    { name: t("employeeStats.title") },
                ]}
                buttons={
                    <Button_
                        href="/help/employee-stats-guide"
                        size="sm"
                        label={t("employeeStats.usageGuide")}
                        variant="outline"
                        icon={<HelpCircle size={18} />}
                    />
                }
                statsCount={4}
                stats={EMPLOYEE_STATS.map((s) => ({
                    id: s.id,
                    name: t(s.nameKey),
                    value: statsData[s.code] ?? 0,
                    icon: s.icon,
                    color: s.color,
                    sortOrder: s.sortOrder,
                }))}
            />

            <Table
                // ── Search ────────────────────────────────────────────────────────
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={applyFilters}

                // ── i18n ──────────────────────────────────────────────────────────
                labels={{
                    searchPlaceholder: t("employeeStats.searchPlaceholder"),
                    filter: t("toolbar.filter"),
                    apply: t("filters.apply"),
                    total: t("pagination.total"),
                    limit: t("pagination.limit"),
                    emptyTitle: t("employeeStats.empty.title"),
                    emptySubtitle: t("employeeStats.empty.subtitle"),
                }}

                // ── Toolbar actions ───────────────────────────────────────────────
                actions={[
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

                // ── Filters ───────────────────────────────────────────────────────
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                filters={
                    <>
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
                                        startDate: start ? start.toISOString().split("T")[0] : null,
                                        endDate: end ? end.toISOString().split("T")[0] : null,
                                    }))
                                }
                                options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
                                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm
                  text-foreground focus:outline-none
                  focus:border-[var(--primary)] dark:focus:border-[#5b4bff]
                  transition-all duration-200"
                                placeholder={t("filters.datePlaceholder")}
                            />
                        </FilterField>
                    </>
                }

                // ── Table ─────────────────────────────────────────────────────────
                columns={columns}
                data={pager.records}
                isLoading={loading}

                // ── Pagination ────────────────────────────────────────────────────
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) => fetchEmployeeStats(page, per_page)}
            />
        </>
    );
}

export default EmployeeStatisticsPage;