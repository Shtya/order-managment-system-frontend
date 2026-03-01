"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronLeft, TrendingUp, Package, CheckCircle, XCircle, Truck,
    BarChart3, Calendar, Store, ShoppingCart, PieChart as PieIcon,
    DollarSign, Briefcase, Activity, Percent,
    RotateCcw,
    CreditCard
} from "lucide-react";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsGrid } from "@/components/atoms/Pageheader";
import { useTranslations } from "next-intl";
import { Card, ExportBtn, fmt, MiniTable, pct, PctBar, RangeTabs, StatusDonut, TableFilters, TrendChart, PRIMARY, SECONDARY, THIRD } from "../reports/order-analysis/page";
import { useDebounce } from "@/hook/useDebounce";
import toast from "react-hot-toast";


export default function DashboardPage() {
    const t = useTranslations("dashboard");
    const [quickRange, setQuickRange] = useState("this_month");
    const [filters, setFilters] = useState({ startDate: null, endDate: null, storeId: "all", search: "" });
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exProds, setExProds] = useState(false);

    const [searchValue, setSearchValue] = useState("");
    const { debouncedValue: debouncedSearch } = useDebounce({
        value: searchValue, delay: 300
    });
    // Data States  
    const [summary, setSummary] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [topProductsData, setTopProductsData] = useState([]);
    const [profitTableData, setProfitTableData] = useState([]);

    // ── Build query params ──────────────────────────────────────────────────
    const buildParams = useCallback(() => {
        const p = { range: quickRange, search: debouncedSearch };
        if (filters.startDate) p.startDate = filters.startDate;
        if (filters.endDate) p.endDate = filters.endDate;
        if (filters.storeId && filters.storeId !== "all") p.storeId = filters.storeId;
        return p;
    }, [quickRange, debouncedSearch, filters]);

    // ── Fetch Logic (Using the Trimmed Async/Await pattern) ──────────────────
    const fetchAll = useCallback(async () => {
        const p = buildParams();
        setLoading(true);


        try {
            const [sum, trd, sts, prf] = await Promise.all([
                api.get("/dashboard/summary", { params: p }).catch(() => ({ data: null })),
                api.get("/dashboard/trend", { params: p }).catch(() => ({ data: [] })),
                api.get("/dashboard/top-products", { params: p }).catch(() => ({ data: [] })),
                api.get("/dashboard/profit-report", { params: p }).catch(() => ({ data: [] }))
            ]);

            const getData = (r) => Array.isArray(r.data) ? r.data : r.data?.records ?? [];

            setSummary(sum.data);
            setTrendData(getData(trd));
            setTopProductsData(getData(sts));
            setProfitTableData(getData(prf));
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const { data } = await api.get("/lookups/stores", { params: { limit: 200, isActive: true } });
                setStores(Array.isArray(data) ? data : data?.records ?? []);
            } catch { }
        };
        fetchStores();
    }, []);

    useEffect(() => { fetchAll(); }, [quickRange, debouncedSearch]);

    // ── KPI Cards configuration ─────────────────────────────────────────────
    const KPI_CONFIG = [
        { key: "totalSales", title: t("kpi.totalSales"), icon: TrendingUp, color: "#6366f1" },
        { key: "costOfGoods", title: t("kpi.costOfGoods"), icon: Briefcase, color: "#f59e0b" },
        { key: "totalProfit", title: t("kpi.totalProfit"), icon: DollarSign, color: "#8b5cf6" },
        { key: "profitMargin", title: t("kpi.profitMargin"), icon: Percent, color: "#06b6d4", pct: true },
        { key: "confirmRate", title: t("kpi.confirmRate"), icon: CheckCircle, color: "#3b82f6", pct: true },
        { key: "deliveryRate", title: t("kpi.deliveryRate"), icon: Truck, color: "#10b981", pct: true },
        { key: "cancelled", title: t("kpi.cancelled"), icon: XCircle, color: "#ef4444", pct: true },
        { key: "returned", title: t("kpi.returned"), icon: RotateCcw, color: "#607D8B", pct: true },
        { key: "inDelivery", title: t("kpi.inDelivery"), icon: Activity, color: "#f97316" },
        { key: "newOrders", title: t("kpi.newOrders"), icon: ShoppingCart, color: "#ec4899" },
        { key: "totalOrders", title: t("kpi.totalOrders"), icon: BarChart3, color: "#475569" },
        { key: "totalCollected", title: t("kpi.totalCollected"), icon: CreditCard, color: "#0ea5e9" }
    ];



    const orderConfigs = [
        {
            key: "orders",
            label: t("chart.ordersCount"),
            color: SECONDARY,
            fillOpacity: 0.1
        },
        {
            key: "sales",
            label: t("chart.sales"),
            color: THIRD,
            yAxisID: 'y1',
            fillOpacity: 0.05
        }
    ];

    const statsData = useMemo(() => {
        return KPI_CONFIG.map((card, i) => ({
            id: card.key,
            name: card.title,
            value: summary?.[card.key] == null ? "0" : card.pct ? pct(summary[card.key]) : fmt(summary[card.key]),
            icon: card.icon,
            color: card.color,
            sortOrder: i
        }));
    }, [summary]);

    // ── Table columns: Detailed Monthly Profit ──────────────────────────────
    const profitCols = [
        {
            key: "period", header: t("profitTable.columns.period"),
            cell: r => <span className="font-semibold text-sm">{r.period ?? "—"}</span>,
        },
        {
            key: "sales", header: t("profitTable.columns.totalSales"),
            cell: r => <span className="font-bold text-foreground font-mono">{fmt(r.sales)}</span>,
        },
        {
            key: "costs", header: t("profitTable.columns.costs"),
            cell: r => <span className="font-semibold text-red-500">{fmt(r.costs)}</span>,
        },
        {
            key: "profit", header: t("profitTable.columns.totalProfit"),
            cell: r => <span className="font-bold text-green-600 dark:text-green-400">{fmt(r.profit)}</span>,
        },
        {
            key: "margin", header: t("profitTable.columns.profitMargin"),
            cell: r => <PctBar value={r.margin} color="#8b5cf6" />,
        },
    ];


    const doExport = async (endpoint, setL, name) => {
        setL(true);
        const id = toast.loading(t("export.exporting"));
        try {
            const res = await api.get(endpoint, { params: buildParams(), responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = Object.assign(document.createElement("a"), { href: url, download: `${name}_${Date.now()}.xlsx` });
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            toast.success(t("export.success"), { id });
        } catch (err) {
            console.error("Export error:", err);
            toast.error(t("export.failed"), { id });
        }
        finally { setL(false); }
    };

    return (
        <div className="min-h-screen p-4 md:p-6 bg-background">
            {/* Header / Breadcrumbs */}
            <div className="bg-card flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <span className="text-gray-400 font-medium">{t("breadcrumb.home")}</span>
                        <ChevronLeft className="text-gray-400" size={18} />
                        <span className="text-[rgb(var(--primary))]">{t("breadcrumb.dashboard")}</span>
                        <span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <RangeTabs searchValue={searchValue} onSearchChange={setSearchValue} value={quickRange} onChange={v => {
                    setQuickRange(v);
                    setFilters(f => ({
                        ...f,
                        startDate: null,
                        endDate: null,
                    }))
                }} />

                <TableFilters onApply={fetchAll} onRefresh={fetchAll} applyLabel={t("filters.apply")}>
                    <div className="flex flex-col gap-1.5 w-full md:w-[250px]">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Calendar size={11} /> {t("filters.dateRange")}
                        </label>
                        <Flatpickr
                            value={[filters.startDate ? new Date(filters.startDate) : null, filters.endDate ? new Date(filters.endDate) : null]}
                            onChange={([s, e]) => {
                                setFilters(f => ({
                                    ...f,
                                    startDate: s ? s.toISOString().split("T")[0] : null,
                                    endDate: e ? e.toISOString().split("T")[0] : null,

                                }))
                                setQuickRange(null);
                            }}
                            options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
                            className="h-10 px-3 rounded-xl border border-border bg-background text-sm w-full"
                            placeholder={t("filters.dateRangePlaceholder")}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full md:w-[180px]">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Store size={11} /> {t("filters.store")}
                        </label>
                        <Select value={filters.storeId} onValueChange={v => setFilters(f => ({ ...f, storeId: v }))}>
                            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                <SelectValue placeholder={t("filters.allStores")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("filters.allStores")}</SelectItem>
                                {stores.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </TableFilters>

                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <StatsGrid stats={statsData} loading={loading} />
                </motion.div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="lg:col-span-2">
                        <Card title={t("charts.generalReports")} icon={TrendingUp} color={PRIMARY}>
                            <TrendChart data={trendData} loading={loading} configs={orderConfigs} />
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22 }}
                    >
                        <Card title={t("charts.topProducts")} icon={PieIcon} color={PRIMARY}>
                            <StatusDonut
                                data={topProductsData}
                                loading={loading}
                                config={{
                                    key: "count",
                                    imageKey: "image",
                                    label: "name"
                                }}
                                allowImage={true}
                            />
                        </Card>
                    </motion.div>
                </div>

                {/* Table Section */}
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
                    <Card title={t("profitTable.title")} icon={DollarSign} color="#10b981" action={
                        <ExportBtn
                            loading={exProds}
                            onClick={() => doExport("/dashboard/profit-report/export", setExProds, "profit_report")}
                        />
                    }>
                        <MiniTable columns={profitCols} data={profitTableData} loading={loading} />
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}