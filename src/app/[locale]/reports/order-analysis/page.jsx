"use client";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, Download, TrendingUp, MapPin, Package,
    CheckCircle, XCircle, Truck, RefreshCw, BarChart3,
    Calendar, Store, Loader2, ArrowUpRight, ArrowDownRight,
    ShoppingCart, PieChart as PieIcon,
    Search,
    Filter,
    PieChart,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, ArcElement, Tooltip as ChTooltip, Legend, Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import PageHeader, { StatsGrid } from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    ArcElement, ChTooltip, Legend, Filler,
);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_RANGES = [
    { key: "today", label: "هذا اليوم" },
    { key: "yesterday", label: "اليوم الماضي" },
    { key: "this_week", label: "هذا الاسبوع" },
    { key: "last_week", label: "الاسبوع الماضي" },
    { key: "this_month", label: "الشهر الحالي" },
    { key: "last_month", label: "الشهر الماضي" },
    { key: "this_year", label: "السنة الحالية" },
];

const PRIMARY = "#6366f1";
const PRIMARY_2 = "#8b5cf6";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("ar-EG"));
const pct = (n) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);
const hex = (h, a = 0.12) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return r
        ? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${a})`
        : "transparent";
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
const Skel = ({ cls }) => (
    <div className={cn("animate-pulse rounded-xl bg-muted/70", cls)} />
);

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card — same vibe as InfoCard used in PageHeader
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────
export function Card({ title, icon: Icon, color = PRIMARY, action, children, className }) {
    return (
        <div className={cn("rounded-2xl border border-border bg-card shadow-sm overflow-hidden", className)}>
            <div className="flex items-center justify-between px-5 py-3.5 ">
                <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: hex(color, 0.12), border: `1.5px solid ${hex(color, 0.2)}` }}>
                        <Icon size={14} style={{ color }} />
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export button (styled like the blue export in OrderTab toolbar)
// ─────────────────────────────────────────────────────────────────────────────
export function ExportBtn({ onClick, loading }) {
    return (
        <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onClick} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
				border border-blue-200 bg-blue-50 text-blue-700
				hover:bg-blue-600 hover:text-white hover:border-blue-600
				dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400
				dark:hover:bg-blue-600 dark:hover:text-white
				disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            تصدير
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick range pill tabs
// ─────────────────────────────────────────────────────────────────────────────
export function RangeTabs({ value, onChange, searchValue, onSearchChange }) {
    const t = useTranslations("orderAnalysis");

    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">

            {/* Left Section: Quick Range Tabs */}

            {/* Right Section: Animated Search Bar */}
            <div className="relative w-full lg:w-[300px] focus-within:lg:w-[350px] transition-all duration-300">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                </div>
                <Input
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={"ابحث عن ما تريد....."}
                    className="rtl:pr-10 h-[42px] rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all"
                />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_RANGES.map((r) => {
                    const isActive = value === r.key;

                    return (
                        <motion.button
                            key={r.key}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onChange(r.key)}
                            className={cn(
                                "relative px-5 py-3 rounded-full text-xs border border-gray-200 dark:border-slate-700 font-bold transition-all duration-300 whitespace-nowrap",
                                isActive
                                    ? "text-white shadow-lg"
                                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                            )}
                            style={
                                isActive
                                    ? {
                                        background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
                                        boxShadow: `0 4px 12px rgb(var(--primary-shadow))`,
                                    }
                                    : {}
                            }
                        >
                            {/* Optional: subtle shine effect to match your Button_ component */}
                            {isActive && (
                                <motion.span
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                                />
                            )}
                            <span className="relative z-10">{r.label}</span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Doughnut — حالات الطلبات
// ─────────────────────────────────────────────────────────────────────────────
export function StatusDonut({ data, loading }) {
    const hasData = data && data.length > 0;
    const total = hasData ? data.reduce((s, d) => s + (d.count ?? 0), 0) : 0;

    // حالة التحميل
    if (loading) return (
        <div className="flex items-center justify-center h-52">
            <Loader2 size={26} className="animate-spin text-muted-foreground" />
        </div>
    );

    // حالة عدم وجود بيانات
    if (!hasData || total === 0) return (
        <div className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
            <PieChart size={32} className="text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">لا توجد بيانات لهذه الفترة</p>
        </div>
    );

    const chartData = {
        labels: data.map(d => d.label),
        datasets: [{
            data: data.map(d => d.count),
            backgroundColor: data.map(d => hex(d.color ?? "#6366f1", 0.82)),
            borderColor: data.map(d => d.color ?? "#6366f1"),
            borderWidth: 2,
            hoverBorderWidth: 3,
        }],
    };

    const options = {
        responsive: true, maintainAspectRatio: false, cutout: "68%",
        plugins: {
            legend: { display: false },
            tooltip: { rtl: true, callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } },
        },
    };

    return (
        <div className="flex flex-col sm:flex-col items-center gap-5">
            <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
                <Doughnut data={chartData} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-extrabold text-foreground">{fmt(total)}</p>
                    <p className="text-[10px] text-muted-foreground">إجمالي</p>
                </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0 w-full">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                            <span className="text-xs text-foreground truncate font-medium">{d.label}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold text-foreground">{fmt(d.count)}</span>
                            <span className="text-[10px] text-muted-foreground w-9 text-right">
                                {total ? pct((d.count / total) * 100) : "—"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Line chart — تأثير عام (daily trend)
// ─────────────────────────────────────────────────────────────────────────────
export function TrendChart({ data, loading }) {
    const hasData = data && data.length > 0;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 size={26} className="animate-spin text-muted-foreground" />
        </div>
    );

    // حالة عدم وجود بيانات
    if (!hasData) return (
        <div className="flex flex-col items-center justify-center h-[264px] border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
            <TrendingUp size={32} className="text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">لم يتم تسجيل أي عمليات في هذا النطاق الزمني</p>
        </div>
    );

    const labels = data.map(d => d.label);
    const chartData = {
        labels,
        datasets: [
            {
                label: "معدل الطلبات اليومي",
                data: data.map(d => d.total ?? 0),
                borderColor: PRIMARY,
                backgroundColor: hex(PRIMARY, 0.07),
                fill: true, tension: 0.44,
                pointRadius: 3.5, pointBackgroundColor: PRIMARY,
                pointBorderColor: "#fff", pointBorderWidth: 2, pointHoverRadius: 6,
            },
            {
                label: "معدل التوصيل اليومي",
                data: data.map(d => d.delivered ?? 0),
                borderColor: "#f59e0b",
                backgroundColor: hex("#f59e0b", 0.05),
                fill: true, tension: 0.44,
                pointRadius: 3, pointBackgroundColor: "#f59e0b",
                pointBorderColor: "#fff", pointBorderWidth: 2, pointHoverRadius: 5,
            },
        ],
    };

    const options = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: {
                position: "bottom", rtl: true,
                labels: { usePointStyle: true, pointStyle: "circle", padding: 18, font: { size: 11 } },
            },
            tooltip: { rtl: true },
        },
        scales: {
            x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 }, maxRotation: 0 } },
            y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 } }, beginAtZero: true },
        },
    };

    return <div style={{ height: 264 }}><Line data={chartData} options={options} /></div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated percentage bar
// ─────────────────────────────────────────────────────────────────────────────
export function PctBar({ value, color = PRIMARY }) {
    const v = Math.min(100, Math.max(0, Number(value) || 0));
    return (
        <div className="flex items-center gap-2 min-w-[90px]">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                    initial={{ width: 0 }} animate={{ width: `${v}%` }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    className="h-full rounded-full" style={{ background: color }}
                />
            </div>
            <span className="text-xs font-bold text-foreground w-10 text-left">{pct(v)}</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini stats table (shared for both areas + products)
// ─────────────────────────────────────────────────────────────────────────────
export function MiniTable({ columns, data, loading }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/50">
                        {columns.map(c => (
                            <th key={c.key} className="px-4 py-3 text-right text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-border/40 last:border-0">
                                {columns.map(c => (
                                    <td key={c.key} className="px-4 py-3"><Skel cls="h-4 w-full" /></td>
                                ))}
                            </tr>
                        ))
                        : !data?.length
                            ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                        لا توجد بيانات
                                    </td>
                                </tr>
                            )
                            : data.map((row, i) => (
                                <motion.tr
                                    key={i}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    {columns.map(c => (
                                        <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                                            {c.cell ? c.cell(row) : (row[c.key] ?? "—")}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))
                    }
                </tbody>
            </table>
        </div>
    );
}
export const TableFilters = memo(function TableFilters({
    children,
    onApply,
    onRefresh, // أضفت هذا لزر التحديث
    applyLabel = "تطبيق",
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
            <div className="mt-3 rounded-2xl border border-border/80 
                bg-gradient-to-br from-muted/40 to-muted/10 
                shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">

                {/* استخدام flex بدلاً من grid لضمان توزيع الجوانب */}
                <div className="p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">

                    {/* الجانب الأيمن: الفلاتر (تأخذ مساحة محددة) */}
                    <div className="flex flex-wrap items-end gap-3 max-w-full md:max-w-[70%]">
                        {children}
                    </div>

                    {/* الجانب الأيسر: الأزرار */}
                    <div className="flex items-center gap-2">
                        {/* زر التحديث */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={onRefresh}
                            className="h-10 px-4 rounded-xl text-sm font-semibold border border-border bg-background 
                                text-muted-foreground hover:text-foreground hover:bg-muted transition-all 
                                flex items-center gap-1.5"
                        >
                            <RefreshCw size={13} />
                            تحديث
                        </motion.button>

                        {/* زر التطبيق (TableFilters Button) */}
                        {onApply && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onApply}
                                type="button"
                                className="h-10 px-6 flex items-center justify-center gap-2 text-sm font-bold text-white transition-all duration-200 rounded-xl"
                                style={{
                                    background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
                                    boxShadow: `0 4px 14px rgb(var(--primary-shadow))`,
                                }}
                            >
                                <Filter size={14} />
                                {applyLabel}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function OrdersStatisticsPage() {
    const t = useTranslations("orderAnalysis");
    const [quickRange, setQuickRange] = useState("this_month");
    const [filters, setFilters] = useState({ startDate: null, endDate: null, storeId: "all" });
    const [stores, setStores] = useState([]);

    const [loading, setLoading] = useState(true);

    const [exAreas, setExAreas] = useState(false);
    const [exProds, setExProds] = useState(false);

    const [summary, setSummary] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [areasData, setAreasData] = useState([]);
    const [prodsData, setProdsData] = useState([]);

    // ── Build query params ──────────────────────────────────────────────────
    const buildParams = useCallback(() => {
        const p = { range: quickRange };
        if (filters.startDate) p.startDate = filters.startDate;
        if (filters.endDate) p.endDate = filters.endDate;
        if (filters.storeId && filters.storeId !== "all") p.storeId = filters.storeId;
        return p;
    }, [quickRange, filters]);

    // ── Fetch everything ────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        const p = buildParams();

        // تشغيل جميع حالات التحميل معاً
        setLoading(true)

        try {
            const [sum, trd, sts, ars, prd] = await Promise.all([
                api.get("/orders/statistics/summary", { params: p }).catch(() => ({ data: null })),
                api.get("/orders/statistics/trend", { params: p }).catch(() => ({ data: [] })),
                api.get("/orders/statistics/by-status", { params: p }).catch(() => ({ data: [] })),
                api.get("/orders/statistics/top-areas", { params: p }).catch(() => ({ data: [] })),
                api.get("/orders/statistics/top-products", { params: p }).catch(() => ({ data: [] }))
            ]);

            // دالة مساعدة داخلية لضمان استخراج المصفوفة بشكل سليم (Trim logic)
            const getData = (r) => Array.isArray(r.data) ? r.data : r.data?.records ?? [];

            setSummary(sum.data);
            setTrendData(getData(trd));
            setStatusData(getData(sts));
            setAreasData(getData(ars));
            setProdsData(getData(prd));
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    // Fetch stores lookup once
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const { data } = await api.get("/lookups/stores", {
                    params: { limit: 200, isActive: true }
                });
                setStores(Array.isArray(data) ? data : data?.records ?? []);
            } catch (err) {
                console.error("Failed to fetch stores:", err);
            }
        };

        fetchStores();
    }, []);

    // Re-fetch on range change
    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Export helper ──────────────────────────────────────────────────────
    const doExport = async (endpoint, setL, name) => {
        setL(true);
        const id = toast.loading("جارٍ التصدير...");
        try {
            const res = await api.get(endpoint, { params: buildParams(), responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = Object.assign(document.createElement("a"), { href: url, download: `${name}_${Date.now()}.xlsx` });
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            toast.success("تمّ التصدير بنجاح", { id });
        } catch { toast.error("فشل التصدير", { id }); }
        finally { setL(false); }
    };

    // ── KPI cards ─────────────────────────────────────────────────────────
    const KPI = [
        { key: "totalOrders ", title: "إجمالي الطلبات", icon: ShoppingCart, color: "#6366f1" },
        { key: "confirmedOrders", title: "الطلبات المؤكدة", icon: CheckCircle, color: "#3b82f6" },
        { key: "deliveredOrders", title: "الطلبات المُسلّمة", icon: Truck, color: "#10b981" },
        { key: "cancelledOrders", title: "الطلبات الملغاة", icon: XCircle, color: "#ef4444" },
        { key: "deliveryRate", title: "التوصيل من الإجمالي", icon: TrendingUp, color: "#8b5cf6", pct: true },
        { key: "deliveryFromConf", title: "التوصيل من المؤكد", icon: BarChart3, color: "#f59e0b", pct: true },
        { key: "inDelivery", title: "جارٍ التسليم", icon: Truck, color: "#06b6d4" },
        { key: "totalSales", title: "إجمالي المبيعات (بدون توصيل)", icon: TrendingUp, color: "#10b981" },
        { key: "totalWithShipping", title: "إجمالي مع توصيل", icon: TrendingUp, color: "#6366f1" },
        { key: "totalSalesBosta", title: "إجمالي مبيعات بوسطة", icon: Store, color: "#f97316" },
    ];

    // ── Table columns: Areas ──────────────────────────────────────────────
    const areasCols = [
        {
            key: "name", header: "اسم الإمارة",
            cell: r => (
                <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold text-sm text-foreground">{r.name ?? "—"}</span>
                </div>
            ),
        },
        {
            key: "totalOrders", header: "عدد الطلبات",
            cell: r => <span className="font-bold text-[var(--primary)] font-mono">{fmt(r.totalOrders)}</span>,
        },
        {
            key: "confirmedOrders", header: "الطلبات المؤكدة",
            cell: r => <span className="font-semibold text-blue-600 dark:text-blue-400">{fmt(r.confirmedOrders)}</span>,
        },
        {
            key: "inDelivery", header: "جارٍ التسليم",
            cell: r => <span className="font-semibold text-cyan-600 dark:text-cyan-400">{fmt(r.inDelivery)}</span>,
        },
        {
            key: "deliveryFromTotal", header: "التسليم من الإجمالي",
            cell: r => <PctBar value={r.deliveryFromTotal} color={PRIMARY} />,
        },
        {
            key: "deliveryFromConfirmed", header: "التسليم من المؤكد",
            cell: r => <PctBar value={r.deliveryFromConfirmed} color="#10b981" />,
        },
    ];

    // ── Table columns: Products ───────────────────────────────────────────
    const prodsCols = [
        {
            key: "name", header: "اسم المنتج",
            cell: r => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                        <Package size={12} className="text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-sm text-foreground line-clamp-1">{r.name ?? "—"}</span>
                </div>
            ),
        },
        {
            key: "totalOrders", header: "عدد الطلبات",
            cell: r => <span className="font-bold text-[var(--primary)] font-mono">{fmt(r.totalOrders)}</span>,
        },
        {
            key: "confirmedOrders", header: "الطلبات المؤكدة",
            cell: r => <span className="font-semibold text-blue-600 dark:text-blue-400">{fmt(r.confirmedOrders)}</span>,
        },
        {
            key: "inDelivery", header: "جارٍ التسليم",
            cell: r => <span className="font-semibold text-cyan-600 dark:text-cyan-400">{fmt(r.inDelivery)}</span>,
        },
        {
            key: "deliveryFromTotal", header: "التسليم من الإجمالي",
            cell: r => <PctBar value={r.deliveryFromTotal} color={PRIMARY} />,
        },
        {
            key: "deliveryFromConfirmed", header: "التسليم من المؤكد",
            cell: r => <PctBar value={r.deliveryFromConfirmed} color="#10b981" />,
        },
    ];

    const statsData = useMemo(() => {
        return KPI.map((card, i) => {
            const raw = summary?.[card.key];
            const val = raw == null ? "0" : card.pct ? pct(raw) : fmt(raw);

            return {
                id: card.key,
                name: card.title,
                value: val,
                icon: card.icon,
                color: card.color,
                sortOrder: i, // الحفاظ على الترتيب الأصلي
                onClick: () => console.log(`Clicked ${card.title}`),
            };
        });
    }, [summary, KPI]);
    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen p-4 md:p-6 bg-background">

            <div className="bg-card flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                    {/* Right Side (Arabic flow): Breadcrumbs */}
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <span className="text-gray-400 font-medium">{t("breadcrumb.home")}</span>
                        <ChevronLeft className="text-gray-400" size={18} />
                        <span className="text-[rgb(var(--primary))]">{t("breadcrumb.orderAnalysis")}</span>
                        <span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
                    </div>

                    {/* Left Side (Arabic flow): Actions */}
                    <div className="flex items-center gap-4">

                        {/* Secondary Action: How to Use (YouTube Icon) */}
                        <Button_
                            size="sm"
                            label={t("actions.howToUse")}
                            tone="white"
                            variant="solid"
                            icon={
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M18.3848 5.7832C18.2851 5.41218 18.0898 5.07384 17.8184 4.80202C17.5469 4.53021 17.2088 4.33446 16.8379 4.23438C15.4727 3.86719 10 3.86719 10 3.86719C10 3.86719 4.52734 3.86719 3.16211 4.23242C2.79106 4.33219 2.45278 4.52782 2.18126 4.79969C1.90974 5.07155 1.71453 5.41007 1.61523 5.78125C1.25 7.14844 1.25 10 1.25 10C1.25 10 1.25 12.8516 1.61523 14.2168C1.81641 14.9707 2.41016 15.5645 3.16211 15.7656C4.52734 16.1328 10 16.1328 10 16.1328C10 16.1328 15.4727 16.1328 16.8379 15.7656C17.5918 15.5645 18.1836 14.9707 18.3848 14.2168C18.75 12.8516 18.75 10 18.75 10C18.75 10 18.75 7.14844 18.3848 5.7832ZM8.26172 12.6172V7.38281L12.793 9.98047L8.26172 12.6172Z"
                                        fill="#A7A7A7"
                                    />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </div>

            <div className=" space-y-5">

                {/* ── Quick range tabs ─────────────────────────────────────── */}

                <RangeTabs value={quickRange} onChange={v => setQuickRange(v)} />


                {/* ── Advanced filter card ──────────────────────────────────── */}
                <TableFilters
                    onApply={fetchAll}
                    onRefresh={fetchAll}
                    applyLabel={"تطبيق"}
                >
                    {/* Date range - تم تحديد العرض هنا ليكون 1/4 تقريباً أو 250px */}
                    <div className="flex flex-col gap-1.5 w-full md:w-[250px]">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Calendar size={11} /> المدة الزمنية
                        </label>
                        <Flatpickr
                            value={[
                                filters.startDate ? new Date(filters.startDate) : null,
                                filters.endDate ? new Date(filters.endDate) : null,
                            ]}
                            onChange={([s, e]) => setFilters(f => ({
                                ...f,
                                startDate: s ? s.toISOString().split("T")[0] : null,
                                endDate: e ? e.toISOString().split("T")[0] : null,
                            }))}
                            options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
                            className="h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground 
                focus:outline-none focus:border-[rgb(var(--primary-to))] transition-all w-full"
                            placeholder="اختر نطاق التاريخ"
                        />
                    </div>

                    {/* Store Select - عرض محدد */}
                    <div className="flex flex-col gap-1.5 w-full md:w-[180px]">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Store size={11} /> المتجر
                        </label>
                        <Select
                            value={filters.storeId}
                            onValueChange={v => setFilters(f => ({ ...f, storeId: v }))}
                        >
                            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:ring-1 focus:ring-[rgb(var(--primary-to))]">
                                <SelectValue placeholder="كل المتاجر" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المتاجر</SelectItem>
                                {stores.map(s => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </TableFilters>
                <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >

                    {/* ── KPI Cards ─────────────────────────────────────────────── */}
                    <StatsGrid stats={statsData} loading={loading} />
                </motion.div>

                {/* ── Charts ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Trend takes 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 }}
                        className="lg:col-span-2"
                    >
                        <Card title="تقارير عامة" icon={TrendingUp} color={PRIMARY}>
                            <TrendChart data={trendData} loading={loading} />
                        </Card>
                    </motion.div>

                    {/* Doughnut 1 column */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22 }}
                    >
                        <Card title="منتجاتك الاكثر طلبا" icon={PieIcon} color="#8b5cf6">
                            <StatusDonut data={statusData} loading={loading} />
                        </Card>
                    </motion.div>
                </div>

                {/* ── Tables ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-5">

                    {/* المناطق الأكثر مبيعاً */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.27 }}
                    >
                        <Card
                            title="المناطق الأكثر مبيعاً"
                            icon={MapPin}
                            color="#10b981"
                            action={
                                <ExportBtn
                                    loading={exAreas}
                                    onClick={() => doExport("/orders/statistics/top-areas/export", setExAreas, "top_areas")}
                                />
                            }
                        >
                            <MiniTable columns={areasCols} data={areasData} loading={loading} />
                        </Card>
                    </motion.div>

                    {/* المنتجات الأكثر مبيعاً */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 }}
                    >
                        <Card
                            title="المنتجات الأكثر مبيعاً"
                            icon={Package}
                            color="#f59e0b"
                            action={
                                <ExportBtn
                                    loading={exProds}
                                    onClick={() => doExport("/orders/statistics/top-products/export", setExProds, "top_products")}
                                />
                            }
                        >
                            <MiniTable columns={prodsCols} data={prodsData} loading={loading} />
                        </Card>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}

