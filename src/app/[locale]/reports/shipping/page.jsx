"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    MapPin,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    Loader2,
    XCircle,
    CheckCircle,
    Info,
    BarChart2
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import toast from "react-hot-toast";
import PageHeader from "@/components/atoms/Pageheader";
import { TutorialSpotlight } from "@/components/atoms/TutorialSpotlight";

export default function ShippingReport() {
    const tCommon = useTranslations("accounts");
    const tCity = useTranslations("accounts.cityDeliveries");
    const tOrders = useTranslations("orders");
    const tTutorial = useTranslations("tutorial.shipping");

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [stats, setStats] = useState(null);

    // Default dates: this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date();

    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
    });

    const [records, setRecords] = useState([]);
    const [pager, setPager] = useState({
        total_records: 0,
        current_page: 1,
        per_page: 12,
    });

    const { debouncedValue: debouncedSearch } = useDebounce({
        value: search,
        delay: 300,
    });

    const { handleExport, exportLoading } = useExport();

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await api.get("/accounting/shipments-summary");
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchCityReport = async (page = pager.current_page, per_page = pager.per_page) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: per_page,
                search: debouncedSearch.trim() || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            };
            const res = await api.get("/accounting/shipments-city-report", { params });
            setRecords(res.data.records || []);
            setPager({
                total_records: res.data.total_records || 0,
                current_page: res.data.current_page || page,
                per_page: res.data.per_page || per_page,
            });
        } catch (err) {
            console.error("Error fetching city report:", err);
            toast.error(tCommon("manualExpenses.messages.fetchError"));
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        fetchCityReport(1, pager.per_page);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchCityReport();
    }, [debouncedSearch]);

    const handlePageChange = ({ page, per_page }) => {
        fetchCityReport(page, per_page);
    };

    const onExport = async () => {
        const params = {
            search: search.trim() || undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
        };

        await handleExport({
            endpoint: "/accounting/shipments-city-report/export",
            params,
            filename: `city_deliveries_report_${Date.now()}.xlsx`,
        });
    };

    const statsData = useMemo(() => {
        return [
            {
                name: tCity("stats.topCity"),
                description: tTutorial("stats.topCity.description"),
                example: tTutorial("stats.topCity.example"),
                value: stats?.highestCity?.city && stats?.highestCity?.count !== undefined ? `${stats.highestCity.city} (${stats.highestCity.count})` : "N/A",
                icon: CheckCircle,
                color: "#10b981"
            },
            {
                name: tCity("stats.lowestCity"),
                description: tTutorial("stats.lowestCity.description"),
                example: tTutorial("stats.lowestCity.example"),
                value: stats?.lowestCity?.city && stats?.lowestCity?.count !== undefined ? `${stats.lowestCity.city} (${stats.lowestCity.count})` : "N/A",
                icon: Info,
                color: "#ef4444"
            },
            {
                name: tCity("stats.avgDeliveries"),
                description: tTutorial("stats.avgDeliveries.description"),
                example: tTutorial("stats.avgDeliveries.example"),
                value: stats?.deliveriesRate !== undefined ? `${stats.deliveriesRate}%` : "0%",
                icon: BarChart2,
                color: "#3b82f6"
            },
        ];
    }, [stats, tCity, tTutorial]);

    const columns = useMemo(() => [
        {
            key: "city",
            header: tCity("columns.city"),
            description: tTutorial("columns.city.description"),
            example: tTutorial("columns.city.example"),
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <MapPin size={16} />
                    </div>
                    <span className="text-sm font-bold">{row.city}</span>
                </div>
            )
        },
        {
            key: "totalShipments",
            header: tCity("columns.total"),
            description: tTutorial("columns.totalShipments.description"),
            example: tTutorial("columns.totalShipments.example"),
            cell: (row) => <span className="text-sm font-semibold tabular-nums">{row.totalShipments}</span>
        },
        {
            key: "actualDeliveries",
            header: tCity("columns.delivered"),
            description: tTutorial("columns.actualDeliveries.description"),
            example: tTutorial("columns.actualDeliveries.example"),
            cell: (row) => (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold tabular-nums">
                    <TrendingUp size={14} />
                    {row.actualDeliveries}
                </div>
            )
        },
        {
            key: "failedShipments",
            header: tCity("columns.returns"),
            description: tTutorial("columns.failedShipments.description"),
            example: tTutorial("columns.failedShipments.example"),
            cell: (row) => (
                <div className="flex items-center gap-1.5 text-red-600 font-bold tabular-nums">
                    <XCircle size={14} />
                    {row.failedShipments}
                </div>
            )
        },
        {
            key: "successRate",
            header: tCity("columns.successRate"),
            description: tTutorial("columns.successRate.description"),
            example: tTutorial("columns.successRate.example"),
            cell: (row) => {
                const rate = row.successRate;
                let colorClass = "text-emerald-600 bg-emerald-50";
                if (rate < 60) colorClass = "text-red-600 bg-red-50";
                else if (rate < 85) colorClass = "text-orange-600 bg-orange-50";

                return (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-16 bg-muted rounded-full overflow-hidden hidden md:block">
                            <div
                                className={cn("h-full rounded-full transition-all",
                                    rate < 60 ? "bg-red-500" : rate < 85 ? "bg-orange-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${rate}%` }}
                            />
                        </div>
                        <span className={cn("px-2.5 py-1 rounded-lg text-xs font-black tabular-nums", colorClass)}>
                            {rate}%
                        </span>
                    </div>
                );
            }
        }
    ], [tCity, tTutorial]);

    return (
        <div className="min-h-screen p-4 md:p-5 space-y-5">
            <PageHeader
                breadcrumbs={[
                    { name: tCommon("breadcrumb.home"), href: "/dashboard" },
                    { name: tCity("shippingReport") },
                ]}
                statsLoading={statsLoading}
                stats={statsData}
            />

            <div className="mt-6">
                <Table
                    searchValue={search}
                    onSearchChange={setSearch}
                    loading={loading}
                    labels={{
                        searchPlaceholder: tCommon("toolbar.searchPlaceholder"),
                        apply: tOrders("filters.apply"),
                        total: tOrders("pagination.total"),
                        limit: tOrders("pagination.limit"),
                        emptyTitle: tOrders("empty"),
                        emptySubtitle: tOrders("emptySubtitle"),
                    }}
                    filters={
                        <>
                            <FilterField label={tCommon("filters.dateRange")}>
                                <DateRangePicker
                                    value={filters}
                                    onChange={(newDates) => setFilters(f => ({ ...f, ...newDates }))}
                                />
                            </FilterField>
                        </>
                    }
                    hasActiveFilters={Object.values(filters).some(
                        (v) => v && v !== "all" && v !== null,
                    )}
                    onApplyFilters={applyFilters}
                    actions={[
                        {
                            key: "export",
                            label: tCommon("export"),
                            icon: exportLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Download size={14} />
                            ),
                            disabled: exportLoading,
                            color: "primary",
                            onClick: onExport,
                            permission: "orders.read",
                        },
                    ]}
                    columns={columns}
                    data={records}
                    isLoading={loading}
                    pagination={{
                        total_records: pager.total_records,
                        current_page: pager.current_page,
                        per_page: pager.per_page,
                    }}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
}
