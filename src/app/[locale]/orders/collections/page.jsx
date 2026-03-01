"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    Download,
    Loader2,
    DollarSign,
    CheckCircle2,
    Clock,
    Truck,
    Calendar,
    AlertCircle,
    Plus,
    HandCoins,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// ── Components ────────────────────────────────────────────────────────────────
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "—";
    return Number(amount).toLocaleString("ar-EG");
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function getCollectionStatusBadge(status, t) {
    const statusConfig = {
        pending: {
            label: t("collectionStatus.pending"),
            className: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200",
        },
        partial: {
            label: t("collectionStatus.partial"),
            className: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200",
        },
        fully_collected: {
            label: t("collectionStatus.fullyCollected"),
            className: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200",
        },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <Badge className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold border", config.className)}>
            {config.label}
        </Badge>
    );
}

// ── Stats Configuration ───────────────────────────────────────────────────────

const COLLECTION_STATS_NOT_COLLECTED = [
    {
        id: 1,
        code: "notCollectedCount",
        nameKey: "stats.notCollected",
        color: "#ef4444",
        icon: AlertCircle,
        sortOrder: 1,
    },
    {
        id: 2,
        code: "partialCollectedCount",
        nameKey: "stats.partialCollected",
        color: "#3b82f6",
        icon: Clock,
        sortOrder: 2,
    },
];

const COLLECTION_STATS_COLLECTED = [
    {
        id: 1,
        code: "fullyCollectedCount",
        nameKey: "stats.fullyCollected",
        color: "#10b981",
        icon: CheckCircle2,
        sortOrder: 1,
    },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function OrderCollectionPage() {
    const t = useTranslations("orderCollection");
    // ── State ─────────────────────────────────────────────────────────────────
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "not_collected");
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [shippingCompanies, setShippingCompanies] = useState([]);

    const [statsData, setStatsData] = useState({
        notCollectedCount: 0,
        partialCollectedCount: 0,
        fullyCollectedCount: 0,
        shippingBreakdown: [],
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
        shippingCompanyId: "all",
    });

    const searchTimer = useRef(null);

    // const handleTabChange = (tabId) => {
    //     const params = new URLSearchParams(searchParams.toString());
    //     params.set("tab", tabId);

    //     router.push(`?${params.toString()}`, { scroll: false });
    // };

    // ── Tabs Configuration ────────────────────────────────────────────────────
    const tabItems = useMemo(
        () => [
            { id: "not_collected", label: t("tabs.notCollected"), icon: AlertCircle },
            { id: "collected", label: t("tabs.collected"), icon: CheckCircle2 },
        ],
        [t]
    );

    const allowedTabIds = useMemo(() => new Set(tabItems.map(item => item.id)), [tabItems]);

    useEffect(() => {
        const tabFromUrl = (searchParams.get("tab") || "").trim();

        console.log(tabFromUrl)
        const defaultTab = "not_collected";
        const safeTab = allowedTabIds.has(tabFromUrl) ? tabFromUrl : defaultTab;

        setActiveTab(safeTab);
    }, [searchParams, allowedTabIds]);




    // ── Debounce Search ───────────────────────────────────────────────────────
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    // ── Fetch on Search/Tab Change ────────────────────────────────────────────
    useEffect(() => {
        fetchOrders(1, pager.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, activeTab]);

    // ── Initial Fetch ─────────────────────────────────────────────────────────
    useEffect(() => {
        fetchStats();
        fetchShippingCompanies();
    }, []);

    // ── Build API Params ──────────────────────────────────────────────────────
    const buildParams = useCallback(
        (page = pager.current_page, per_page = pager.per_page) => {
            const params = { page, limit: per_page };
            if (debouncedSearch) params.search = debouncedSearch;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.shippingCompanyId && filters.shippingCompanyId !== "all")
                params.shippingCompanyId = filters.shippingCompanyId;

            // Add collection status based on active tab
            if (activeTab === "not_collected") {
                params.collectionStatus = "pending";
            } else {
                params.collectionStatus = "fully_collected";
            }

            return params;
        },
        [debouncedSearch, filters, pager.current_page, pager.per_page, activeTab]
    );

    // ── Fetch Statistics ──────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/collections/statistics");
            const data = res.data ?? {};
            setStatsData({
                notCollectedCount: data.notCollectedCount ?? 0,
                partialCollectedCount: data.partialCollectedCount ?? 0,
                fullyCollectedCount: data.fullyCollectedCount ?? 0,
                shippingBreakdown: data.shippingBreakdown ?? [],
            });
        } catch (e) {
            console.error(e);
            toast.error(t("errors.fetchStatsFailed"));
        }
    }, [t]);

    // ── Fetch Shipping Companies ──────────────────────────────────────────────
    const fetchShippingCompanies = useCallback(async () => {
        try {
            const res = await api.get("/shipping/integrations/active");
            setShippingCompanies(Array.isArray(res.data?.integrations) ? res.data?.integrations : res.data?.records ?? []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    // ── Fetch Orders ──────────────────────────────────────────────────────────
    const fetchOrders = useCallback(
        async (page = pager.current_page, per_page = pager.per_page) => {
            try {
                setLoading(true);
                const res = await api.get("/collections", { params: buildParams(page, per_page) });
                const data = res.data ?? {};
                setPager({
                    total_records: data.total_records ?? 0,
                    current_page: data.current_page ?? page,
                    per_page: data.per_page ?? per_page,
                    records: Array.isArray(data.records) ? data.records : [],
                });
            } catch (e) {
                console.error(e);
                toast.error(t("errors.fetchFailed"));
            } finally {
                setLoading(false);
            }
        },
        [buildParams, t]
    );

    // ── Export Handler ────────────────────────────────────────────────────────
    const handleExport = useCallback(async () => {
        let toastId;
        try {
            setExportLoading(true);
            toastId = toast.loading(t("messages.exportStarted"));
            const params = buildParams();
            delete params.page;
            delete params.limit;

            const response = await api.get("/collections/export", {
                params,
                responseType: "blob",
            });

            const contentDisposition = response.headers["content-disposition"];
            let filename = `Order_collections_export_${Date.now()}.xlsx`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";]+)"?/);
                if (match?.[1]) filename = match[1];
            }

            const url = window.URL.createObjectURL(
                new Blob([response.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                })
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

    // ── Apply Filters ─────────────────────────────────────────────────────────
    const applyFilters = useCallback(() => {
        fetchOrders(1, pager.per_page);
        fetchStats();
    }, [fetchOrders, fetchStats, pager.per_page]);

    const hasActiveFilters = Object.values(filters).some((v) => v && v !== "all" && v !== null);

    // ── Current Stats for Active Tab ──────────────────────────────────────────
    const currentStats = useMemo(() => {
        const statsConfig =
            activeTab === "not_collected" ? COLLECTION_STATS_NOT_COLLECTED : COLLECTION_STATS_COLLECTED;

        return statsConfig.map((stat) => ({
            id: stat.id,
            name: t(stat.nameKey),
            value: String(statsData[stat.code] ?? 0),
            icon: stat.icon,
            color: stat.color,
            sortOrder: stat.sortOrder,
        }));
    }, [activeTab, statsData, t]);

    // ── Shipping Breakdown Stats ──────────────────────────────────────────────
    const shippingBreakdownStats = useMemo(() => {
        return statsData.shippingBreakdown.map((shipping, idx) => ({
            id: `shipping_${idx}`,
            name: shipping.name,
            value: formatCurrency(shipping.amount),
            icon: Truck,
            color: "#06b6d4",
            sortOrder: 100 + idx,
        }));
    }, [statsData.shippingBreakdown]);

    // ── Combined Stats ────────────────────────────────────────────────────────
    const allStats = useMemo(() => {
        return [...currentStats, ...shippingBreakdownStats];
    }, [currentStats, shippingBreakdownStats]);

    // ── Table Columns: Not Collected ──────────────────────────────────────────
    const notCollectedColumns = useMemo(
        () => [
            {
                key: "orderNumber",
                header: t("columns.orderNumber"),
                cell: (row) => (
                    <span className="text-primary font-bold font-mono text-sm">{row.orderNumber}</span>
                ),
            },
            {
                key: "shippingCompany",
                header: t("columns.shippingCompany"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <Truck size={12} className="text-muted-foreground" />
                        <span className="text-sm font-medium">{row.shippingCompany?.name}</span>
                    </div>
                ),
            },
            {
                key: "collectedAmount",
                header: t("columns.collectedAmount"),
                cell: (row) => (
                    <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatCurrency(row.collectedAmount)}
                    </span>
                ),
            },
            {
                key: "remainingBalance",
                header: t("columns.remainingBalance"),
                cell: (row) => (
                    <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
                        {formatCurrency(row.remainingBalance)}
                    </span>
                ),
            },
            {
                key: "shippingCost",
                header: t("columns.shippingCost"),
                cell: (row) => (
                    <span className="font-medium tabular-nums">{formatCurrency(row.shippingCost)}</span>
                ),
            },
            {
                key: "collectionMethod",
                header: t("columns.collectionMethod"),
                cell: (row) => {
                    const collections = row.collections || [];

                    if (!collections.length) {
                        return (
                            <Badge variant="outline" className="text-xs">
                                —
                            </Badge>
                        );
                    }

                    // Get unique sources only
                    const uniqueSources = [
                        ...new Set(collections.map((c) => c.source))
                    ];

                    return (
                        <div className="flex flex-wrap gap-1">
                            {uniqueSources.map((source) => (
                                <Badge
                                    key={source}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {t(`collectionMethods.${source}`)}
                                </Badge>
                            ))}
                        </div>
                    );
                },
            },
            {
                key: "deliveredAt",
                header: t("columns.deliveredAt"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar size={12} />
                        {formatDate(row.deliveredAt)}
                    </div>
                ),
            },
            {
                key: "collectionStatus",
                header: t("columns.collectionStatus"),
                cell: (row) => {
                    const status = row.remainingBalance > 0 ? "pending" : "fully_collected";
                    return getCollectionStatusBadge(status, t);
                },
            },
            {
                key: "actions",
                header: t("table.actions"),
                cell: (row) => {
                    return (<TooltipProvider>
                        <div className="flex items-center gap-2">

                            {/* Collect Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() =>
                                            router.push(`/orders/collections/collect/${row.orderId}`)
                                        }
                                        className="group w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm
              border-emerald-200 bg-emerald-50 text-emerald-600
              hover:bg-emerald-600 hover:border-emerald-600 hover:text-white"
                                    >
                                        <HandCoins
                                            size={16}
                                            className="transition-transform group-hover:scale-110"
                                        />
                                    </motion.button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t("actions.collect")}
                                </TooltipContent>
                            </Tooltip>

                        </div>
                    </TooltipProvider>)
                },
            }
            // {
            //     key: "delayDays",
            //     header: t("columns.delayDays"),
            //     cell: (row) => {
            //         const days = row.delayDays ?? 0;
            //         return (
            //             <span
            //                 className={cn(
            //                     "font-bold text-sm px-2.5 py-1 rounded-lg tabular-nums",
            //                     days > 7 && "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
            //                     days > 3 &&
            //                     days <= 7 &&
            //                     "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
            //                     days <= 3 && "bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400"
            //                 )}
            //             >
            //                 {days} {t("days")}
            //             </span>
            //         );
            //     },
            // },
        ],
        [t]
    );

    // ── Table Columns: Collected ──────────────────────────────────────────────
    const collectedColumns = useMemo(
        () => [
            {
                key: "orderNumber",
                header: t("columns.orderNumber"),
                cell: (row) => (
                    <span className="text-primary font-bold font-mono text-sm">{row.orderNumber}</span>
                ),
            },
            {
                key: "shippingCompany",
                header: t("columns.shippingCompany"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <Truck size={12} className="text-muted-foreground" />
                        <span className="text-sm font-medium">{row.shippingCompany?.name}</span>
                    </div>
                ),
            },
            {
                key: "lastCollectionDate",
                header: t("columns.lastCollectionDate"),
                cell: (row) => {
                    const lastCollection = row.collections?.[row.collections.length - 1];
                    return (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar size={12} />
                            {formatDate(lastCollection?.collectedAt)}
                        </div>
                    );
                },
            },
            {
                key: "shippingCost",
                header: t("columns.shippingCost"),
                cell: (row) => (
                    <span className="font-medium tabular-nums">{formatCurrency(row.shippingCost)}</span>
                ),
            },
            {
                key: "finalTotal",
                header: t("columns.totalAmount"),
                cell: (row) => (
                    <span className="font-bold text-foreground tabular-nums">{formatCurrency(row.finalTotal)}</span>
                ),
            },
            {
                key: "collectedAmount",
                header: t("columns.collectedAmount"),
                cell: (row) => (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(row.collectedAmount)}
                    </span>
                ),
            },
            {
                key: "remainingBalance",
                header: t("columns.remainingBalance"),
                cell: (row) => (
                    <span className="font-medium text-muted-foreground tabular-nums">
                        {formatCurrency(row.remainingBalance)}
                    </span>
                ),
            },
            {
                key: "collectionStatus",
                header: t("columns.collectionStatus"),
                cell: (row) => getCollectionStatusBadge("fully_collected", t),
            },
        ],
        [t]
    );

    // ── Current Columns ───────────────────────────────────────────────────────
    const currentColumns = activeTab === "not_collected" ? notCollectedColumns : collectedColumns;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen p-4 md:p-6 bg-background">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/" },
                    { name: activeTab === "not_collected" ? t('breadcrumb.notCollected') : t("breadcrumb.fullyCollected") },
                ]}
                buttons={
                    <div className="flex gap-2">
                        <Button_ size="sm" label={t("actions.howToUse")} tone="white" variant="solid" icon={<span className="text-[#A7A7A7]">?</span>} />
                    </div>
                }
                statsCount={allStats.length}
                stats={allStats}
            >

                <div className="mb-6">
                    {/* <SwitcherTabs items={tabItems} activeId={activeTab} onChange={handleTabChange} className="w-full" /> */}
                </div>
            </PageHeader>

            {/* Tabs */}

            <Table
                // ── Search ────────────────────────────────────────────────────
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={applyFilters}

                // ── i18n ──────────────────────────────────────────────────────
                labels={{
                    searchPlaceholder: t("searchPlaceholder"),
                    filter: t("toolbar.filter"),
                    apply: t("filters.apply"),
                    total: t("pagination.total"),
                    limit: t("pagination.limit"),
                    emptyTitle: t("empty.title"),
                    emptySubtitle: t("empty.subtitle"),
                }}

                // ── Toolbar actions ───────────────────────────────────────────
                actions={[
                    {
                        key: "export",
                        label: t("toolbar.export"),
                        icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />,
                        color: "blue",
                        onClick: handleExport,
                        disabled: exportLoading,
                    },
                ]}

                // ── Filters ───────────────────────────────────────────────────
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                filters={
                    <>
                        {/* Shipping Company */}
                        <FilterField label={t("filters.shippingCompany")}>
                            <Select
                                value={filters.shippingCompanyId}
                                onValueChange={(v) => setFilters((f) => ({ ...f, shippingCompanyId: v }))}
                            >
                                <SelectTrigger
                                    className="h-10 rounded-xl border-border bg-background text-sm
                  focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all"
                                >
                                    <SelectValue placeholder={t("filters.shippingCompanyPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("filters.all")}</SelectItem>
                                    {shippingCompanies.map((company) => (
                                        <SelectItem key={company.providerId} value={String(company.providerId)}>
                                            {company.name}
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

                // ── Table ─────────────────────────────────────────────────────
                columns={currentColumns}
                data={pager.records}
                isLoading={loading}

                // ── Pagination ────────────────────────────────────────────────
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) => fetchOrders(page, per_page)}
            />
        </div>
    );
}