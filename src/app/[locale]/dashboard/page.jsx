"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronLeft, TrendingUp, Package, CheckCircle, XCircle, Truck,
    BarChart3, Calendar, Store, ShoppingCart, PieChart as PieIcon,
    DollarSign, Briefcase, Activity, Percent
} from "lucide-react";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsGrid } from "@/components/atoms/Pageheader";
import { useTranslations } from "next-intl";
import { Card, MiniTable, RangeTabs, StatusDonut, TableFilters, TrendChart } from "../reports/order-analysis/page";


export default function DashboardPage() {
    const t = useTranslations("dashboard");
    const [quickRange, setQuickRange] = useState("this_month");
    const [filters, setFilters] = useState({ startDate: null, endDate: null, storeId: "all" });
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Data States
    const [summary, setSummary] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [profitTableData, setProfitTableData] = useState([]);

    const PRIMARY = "rgb(var(--primary))";

    // ── Build query params ──────────────────────────────────────────────────
    const buildParams = useCallback(() => {
        const p = { range: quickRange };
        if (filters.startDate) p.startDate = filters.startDate;
        if (filters.endDate) p.endDate = filters.endDate;
        if (filters.storeId && filters.storeId !== "all") p.storeId = filters.storeId;
        return p;
    }, [quickRange, filters]);

    // ── Fetch Logic (Using the Trimmed Async/Await pattern) ──────────────────
    const fetchAll = useCallback(async () => {
        const p = buildParams();
        setLoading(true);

        try {
            const [sum, trd, sts, prf] = await Promise.all([
                api.get("/dashboard/summary", { params: p }).catch(() => ({ data: null })),
                api.get("/dashboard/trend", { params: p }).catch(() => ({ data: [] })),
                api.get("/dashboard/top-products", { params: p }).catch(() => ({ data: [] })),
                api.get("/dashboard/monthly-profit", { params: p }).catch(() => ({ data: [] }))
            ]);

            const getData = (r) => Array.isArray(r.data) ? r.data : r.data?.records ?? [];

            setSummary(sum.data);
            setTrendData(getData(trd));
            setStatusData(getData(sts));
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

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── KPI Cards configuration ─────────────────────────────────────────────
    const KPI_CONFIG = [
        { key: "deliveryRate", title: "نسبة التوصيل", icon: Truck, color: "#10b981", pct: true },
        { key: "confirmRate", title: "نسبة التأكيد", icon: CheckCircle, color: "#3b82f6", pct: true },
        { key: "totalProfit", title: "إجمالي الربح", icon: DollarSign, color: "#8b5cf6" },
        { key: "costOfGoods", title: "البضاعة المباعة", icon: Briefcase, color: "#f59e0b" },
        { key: "totalSales", title: "إجمالي المبيعات", icon: TrendingUp, color: "#6366f1" },
        { key: "profitMargin", title: "نسبة الربح %", icon: Percent, color: "#06b6d4", pct: true },
        { key: "cancelled", title: "ملغي", icon: XCircle, color: "#ef4444" },
        { key: "inDelivery", title: "جاري التوصيل", icon: Activity, color: "#f97316" },
        { key: "newOrders", title: "جديد", icon: ShoppingCart, color: "#ec4899" },
        { key: "totalOrders", title: "إجمالي الطلبات", icon: BarChart3, color: "#475569" },
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
            key: "period", header: "الفترة الزمنية",
            cell: r => <span className="font-semibold text-sm">{r.period ?? "—"}</span>,
        },
        {
            key: "sales", header: "إجمالي المبيعات",
            cell: r => <span className="font-bold text-foreground font-mono">{fmt(r.sales)}</span>,
        },
        {
            key: "costs", header: "تكلفة البضاعة",
            cell: r => <span className="font-semibold text-red-500">{fmt(r.costs)}</span>,
        },
        {
            key: "profit", header: "إجمالي الربح",
            cell: r => <span className="font-bold text-green-600 dark:text-green-400">{fmt(r.profit)}</span>,
        },
        {
            key: "margin", header: "نسبة الربح",
            cell: r => <PctBar value={r.margin} color="#8b5cf6" />,
        },
    ];

    return (
        <div className="min-h-screen p-4 md:p-6 bg-background">
            {/* Header / Breadcrumbs */}
            <div className="bg-card flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <span className="text-gray-400 font-medium">الرئيسية</span>
                        <ChevronLeft className="text-gray-400" size={18} />
                        <span className="text-[rgb(var(--primary))]">لوحة التحكم</span>
                        <span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <RangeTabs value={quickRange} onChange={v => setQuickRange(v)} />

                <TableFilters onApply={fetchAll} onRefresh={fetchAll} applyLabel="تطبيق">
                    <div className="flex flex-col gap-1.5 w-full md:w-[250px]">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Calendar size={11} /> المدة الزمنية
                        </label>
                        <Flatpickr
                            value={[filters.startDate ? new Date(filters.startDate) : null, filters.endDate ? new Date(filters.endDate) : null]}
                            onChange={([s, e]) => setFilters(f => ({
                                ...f,
                                startDate: s ? s.toISOString().split("T")[0] : null,
                                endDate: e ? e.toISOString().split("T")[0] : null,
                            }))}
                            options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
                            className="h-10 px-3 rounded-xl border border-border bg-background text-sm w-full"
                            placeholder="اختر نطاق التاريخ"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full md:w-[180px]">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Store size={11} /> المتجر
                        </label>
                        <Select value={filters.storeId} onValueChange={v => setFilters(f => ({ ...f, storeId: v }))}>
                            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                <SelectValue placeholder="كل المتاجر" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المتاجر</SelectItem>
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
                        <Card title="تقارير عامة" icon={TrendingUp} color={PRIMARY}>
                            <TrendChart data={trendData} loading={loading} />
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                        <Card title="منتجاتك الأكثر طلباً" icon={PieIcon} color="#8b5cf6">
                            <StatusDonut data={statusData} loading={loading} />
                        </Card>
                    </motion.div>
                </div>

                {/* Table Section */}
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
                    <Card title="جدول الربح التفصيلي الشهري" icon={DollarSign} color="#10b981">
                        <MiniTable columns={profitCols} data={profitTableData} loading={loading} />
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
