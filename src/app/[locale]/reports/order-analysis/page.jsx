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
import { avatarSrc } from "@/components/atoms/UserSelect";
import { generateBgColors, getIconForStatus } from "../../orders/page";
import { useDebounce } from "@/hook/useDebounce";

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    ArcElement, ChTooltip, Legend, Filler,
);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────


export const PRIMARY = "#ff8b00"; // --primary
export const SECONDARY = "#ffb703"; // --secondary (Golden Yellow)
export const THIRD = "#ff5c2b"; // --third (Warm Coral)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const fmt = (n) => (n == null ? "—" : Number(n));
export const pct = (n) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);
export const hex = (h, a = 0.12) => {
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
    const t = useTranslations("dashboard");
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
            {t('common.export')}
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick range pill tabs
// ─────────────────────────────────────────────────────────────────────────────
export function RangeTabs({ value, onChange, searchValue, onSearchChange }) {
    const t = useTranslations("orderAnalysis");

    const QUICK_RANGES = [
        { key: "today", label: t("ranges.today") },
        { key: "yesterday", label: t("ranges.yesterday") },
        { key: "this_week", label: t("ranges.this_week") },
        { key: "last_week", label: t("ranges.last_week") },
        { key: "this_month", label: t("ranges.this_month") },
        { key: "last_month", label: t("ranges.last_month") },
        { key: "this_year", label: t("ranges.this_year") },
    ];

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
                    placeholder={t("search.orderPlaceholder")}
                    className="rtl:pr-10! h-[42px] rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all"
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
export function StatusDonut({
    data,
    loading,
    config = { key: "count", imageKey: "image", label: "label" },
    allowImage = false
}) {
    const t = useTranslations("dashboard");
    const hasData = data && data.length > 0;
    const BRAND_COLORS = ["#ff8b00", "#ffb703", "#ff5c2b", "#feb144", "#ff7b54"];
    const total = hasData ? data.reduce((s, d) => s + (Number(d[config.key]) ?? 0), 0) : 0;

    if (loading) return (
        <div className="flex flex-col items-center animate-pulse w-full">
            {/* حلقة الدونات الوهمية */}
            <div className="h-48 w-48 rounded-full border-[16px] border-slate-200 dark:border-slate-800 flex items-center justify-center mb-8">
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded shadow-inner" />
            </div>

            {/* قائمة العناصر الوهمية */}
            <div className="w-full space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="space-y-2">
                                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-2 w-16 bg-slate-100 dark:bg-slate-900 rounded" />
                            </div>
                        </div>
                        <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );

    if (!hasData || total === 0) return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
            <PieChart size={32} className="text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">
                {t("common.noData")}
            </p>
        </div>
    );

    const chartData = {
        labels: data.map(d => d[config.label]),
        datasets: [{
            data: data.map(d => d[config.key]),
            backgroundColor: data.map((d, i) => hex(d.color || BRAND_COLORS[i % BRAND_COLORS.length], 0.85)),
            borderColor: data.map((d, i) => d.color || BRAND_COLORS[i % BRAND_COLORS.length]),
            borderWidth: 2,
            hoverOffset: 12,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
            legend: { display: false }, // إخفاء الأسطورة الافتراضية لبناء واحدة مخصصة
            tooltip: {
                rtl: true,
                callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${((ctx.raw / total) * 100).toFixed(1)}%)`
                }
            },
        },
    };

    return (
        <div className="flex flex-col items-center">
            {/* منطقة الرسم البياني */}
            <div className="relative h-48 w-full">
                <Doughnut data={chartData} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-foreground">{total}</span>
                    <span className="text-[9px] text-muted-foreground font-medium uppercase">الإجمالي</span>
                </div>
            </div>

            {/* الأسطورة المخصصة مع الصور */}
            <div className="w-full mt-6 grid grid-cols-1 gap-2">
                {data.map((item, i) => {
                    const color = item.color || BRAND_COLORS[i % BRAND_COLORS.length];
                    const percentage = ((item[config.key] / total) * 100).toFixed(0);

                    return (
                        <div key={i} className="flex items-center justify-between group px-2 py-1 hover:bg-muted/5 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                                {/* النقطة الملونة أو الصورة */}
                                {allowImage && item[config.imageKey] ? (
                                    <img
                                        src={avatarSrc(item[config.imageKey])}
                                        className="w-8 h-8 rounded-full object-cover border shadow-sm"
                                        alt={item[config.label]}
                                    />
                                ) : (
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                )}

                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                                        {item[config.label]}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {item[config.key]} طلب
                                    </span>
                                </div>
                            </div>

                            <div className="text-xs font-bold text-muted-foreground/80">
                                {percentage}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Line chart — تأثير عام (daily trend)
// ─────────────────────────────────────────────────────────────────────────────
export function TrendChart({ data, loading, configs = [] }) {
    const t = useTranslations("dashboard");
    const hasData = data && data.length > 0;
    if (loading) return (
        <div className="w-full h-[264px] flex flex-col justify-between animate-pulse px-2 py-4">
            {/* أسطر أفقية تمثل شبكة الرسم البياني */}
            <div className="flex-1 flex flex-col justify-between mb-6">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="w-full h-[2px] bg-slate-100 dark:bg-slate-800/50 rounded-full"
                    />
                ))}
            </div>

            {/* خط القاعدة الأساسي (أغمق قليلاً) */}
            <div className="h-[3px] w-full bg-slate-200 dark:bg-slate-800 rounded-full mb-4" />

            {/* تمثيل التواريخ في الأسفل */}
            <div className="flex justify-between px-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-2 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
                ))}
            </div>
        </div>
    );
    // حالة عدم وجود بيانات
    if (!hasData) return (
        <div className="flex flex-col items-center justify-center h-[264px] border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
            <TrendingUp size={32} className="text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
                {t("common.noOperations")}
            </p>
        </div>
    );

    const datasets = configs.map(cfg => ({
        label: cfg.label,
        data: data.map(d => d[cfg.key] ?? 0), // الوصول للحقل عن طريق المفتاح الديناميكي
        borderColor: cfg.color,
        backgroundColor: hex(cfg.color, cfg.fillOpacity || 0.07),
        fill: cfg.fill ?? true,
        tension: 0.44,
        pointRadius: 3,
        pointBackgroundColor: cfg.color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        yAxisID: cfg.yAxisID || 'y', // دعم محاور متعددة إذا لزم الأمر
    }));

    const chartData = {
        labels: data.map(d => d.label), // التسميات تأتي دائماً في حقل label من السيرفر
        datasets
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
            ...(configs.some(c => c.yAxisID === 'y1') && {
                y1: { position: 'right', grid: { display: false }, ticks: { font: { size: 10 } } }
            })
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
    const t = useTranslations("dashboard");

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
                                        {t("common.noData")}
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
    const tOrders = useTranslations("orders");
    const t = useTranslations("orderAnalysis");
    const [quickRange, setQuickRange] = useState("this_month");
    const [filters, setFilters] = useState({ startDate: null, endDate: null, storeId: "all" });
    const [stores, setStores] = useState([]);

    const [loading, setLoading] = useState(true);

    const [exAreas, setExAreas] = useState(false);
    // const [exProds, setExProds] = useState(false);

    const [summary, setSummary] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [areasData, setAreasData] = useState([]);

    const [searchValue, setSearchValue] = useState("");
    const { debouncedValue: debouncedSearch } = useDebounce({
        value: searchValue, delay: 300
    });
    // const [prodsData, setProdsData] = useState([]);

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

        setLoading(true)

        try {
            const [sum, trd, sts, ars] = await Promise.all([
                api.get("/dashboard/top-products", { params: p }).catch(() => ({ data: null })),
                api.get("/dashboard/orders/trend", { params: p }).catch(() => ({ data: [] })),
                api.get("/dashboard/orders/stats", { params: p }).catch(() => ({ data: [] })),
                api.get("/dashboard/orders/top-areas", { params: p }).catch(() => ({ data: [] })),
                // api.get("/orders/statistics/top-products", { params: p }).catch(() => ({ data: [] }))
            ]);

            const getData = (r) => Array.isArray(r.data) ? r.data : r.data?.records ?? [];

            setSummary(sum.data);
            setTrendData(getData(trd));
            setStatusData(getData(sts));
            setAreasData(getData(ars));
            // setProdsData(getData(prd));
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
    useEffect(() => { fetchAll(); }, [quickRange, debouncedSearch]);

    // ── Export helper ──────────────────────────────────────────────────────


    // ── KPI cards ─────────────────────────────────────────────────────────
    const KPI = [
        { key: "totalOrders ", title: t("kpi.totalOrders"), icon: ShoppingCart, color: "#6366f1" },
        { key: "confirmedOrders", title: t("kpi.confirmedOrders"), icon: CheckCircle, color: "#3b82f6" },
        { key: "deliveredOrders", title: t("kpi.deliveredOrders"), icon: Truck, color: "#10b981" },
        { key: "cancelledOrders", title: t("kpi.cancelledOrders"), icon: XCircle, color: "#ef4444" },
        { key: "deliveryRate", title: t("kpi.deliveryRate"), icon: TrendingUp, color: "#8b5cf6", pct: true },
        { key: "deliveryFromConf", title: t("kpi.deliveryFromConf"), icon: BarChart3, color: "#f59e0b", pct: true },
        { key: "inDelivery", title: t("kpi.inDelivery"), icon: Truck, color: "#06b6d4" },
        { key: "totalSales", title: t("kpi.totalSales"), icon: TrendingUp, color: "#10b981" },
        { key: "totalWithShipping", title: t("kpi.totalWithShipping"), icon: TrendingUp, color: "#6366f1" },
        { key: "totalSalesBosta", title: t("kpi.totalSalesBosta"), icon: Store, color: "#f97316" },
    ];

    // ── Table columns: Areas ──────────────────────────────────────────────
    const areasCols = [
        {
            key: "label",
            header: t("areas.columns.cityArea"),
            cell: r => (
                <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold text-sm text-foreground">{r.city ?? "—"}</span>
                </div>
            ),
        },
        {
            key: "totalOrders",
            header: t("areas.columns.totalOrders"),
            cell: r => <span className="font-bold text-[var(--primary)] font-mono">{fmt(r.totalOrders)}</span>,
        },
        {
            key: "confirmedOrders",
            header: t("areas.columns.confirmed"),
            cell: r => <span className="font-semibold text-blue-600 dark:text-blue-400">{fmt(r.confirmedOrders)}</span>,
        },
        {
            key: "shippedOrders",
            header: t("areas.columns.inDelivery"),
            cell: r => <span className="font-semibold text-cyan-600 dark:text-cyan-400">{fmt(r.shippedOrders)}</span>,
        },
        {
            key: "deliveredOrders",
            header: t("areas.columns.delivered"),
            cell: r => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(r.deliveredOrders)}</span>,
        },
        {
            key: "sales",
            header: t("areas.columns.netSales"),
            cell: r => <span className="font-bold text-foreground font-mono">{fmt(r.sales)}</span>,
        },
        {
            key: "deliveryRate",
            header: t("areas.columns.successRate"),
            cell: r => (
                <div className="flex items-center gap-2">
                    <div className="w-10 bg-muted rounded-full h-1.5 overflow-hidden hidden md:block">
                        <div
                            className={`h-full ${r.deliveryRate >= 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                            style={{ width: `${r.deliveryRate}%` }}
                        />
                    </div>
                    <span className={`text-xs font-bold ${r.deliveryRate >= 80 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {r.deliveryRate}%
                    </span>
                </div>
            ),
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
                sortOrder: i,
                onClick: () => console.log(`Clicked ${card.title}`),
            };
        });
    }, [summary, KPI]);

    const statsCards = useMemo(() => {
        if (!statusData.length) return [];
        return statusData
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((stat) => {
                const Icon = getIconForStatus(stat.code);
                const bgColors = generateBgColors(stat.color);

                return {
                    id: stat.id,
                    name: stat.system ? tOrders(`statuses.${stat.code}`) : stat.name,
                    value: String(stat.count || 0),
                    icon: Icon,
                    bg: `bg-[${bgColors.light}] dark:bg-[${bgColors.dark}]`,
                    bgInlineLight: bgColors.light,
                    bgInlineDark: bgColors.dark,
                    iconColor: `text-[${stat.color}]`,
                    color: stat.color,
                    iconBorder: `border-[${stat.color}]`,
                    iconBorderInline: stat.color,
                    code: stat.code,
                    editable: false,
                    sortOrder: stat.sortOrder,
                    fullData: stat,
                };
            });
    }, [statusData]);

    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────

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

    const orderConfigs = [
        {
            key: "newOrders",
            label: t("chart.newOrders"),
            color: SECONDARY,
            fillOpacity: 0.1,
            borderWidth: 2,
            tension: 0.4
        },
        {
            key: "deliveredOrders",
            label: t("chart.deliveredOrders"),
            color: "#10b981",
            fillOpacity: 0.05,
            borderWidth: 2,
            tension: 0.4
        }
    ];


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

                <RangeTabs searchValue={searchValue} onSearchChange={setSearchValue} value={quickRange} onChange={v => setQuickRange(v)} />


                {/* ── Advanced filter card ──────────────────────────────────── */}
                <TableFilters
                    onApply={fetchAll}
                    onRefresh={fetchAll}
                    applyLabel={t("filters.apply")}
                >
                    {/* Date range */}
                    <div className="flex flex-col gap-1.5 w-full md:w-[250px]">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Calendar size={11} /> {t("filters.dateRange")}
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
                            placeholder={t("filters.dateRangePlaceholder")}
                        />
                    </div>

                    {/* Store Select */}
                    <div className="flex flex-col gap-1.5 w-full md:w-[180px]">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Store size={11} /> {t("filters.store")}
                        </label>
                        <Select
                            value={filters.storeId}
                            onValueChange={v => setFilters(f => ({ ...f, storeId: v }))}
                        >
                            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:ring-1 focus:ring-[rgb(var(--primary-to))]">
                                <SelectValue placeholder={t("filters.allStores")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("filters.allStores")}</SelectItem>
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
                    <StatsGrid stats={statsCards} loading={loading} />
                </motion.div>

                {/* ── Charts ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Trend takes 2 columns */}
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="lg:col-span-2">
                        <Card title={t("charts.generalReports")} icon={TrendingUp} color={PRIMARY}>
                            <TrendChart data={trendData} loading={loading} configs={orderConfigs} />
                        </Card>
                    </motion.div>

                    {/* Doughnut 1 column */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22 }}
                    >
                        <Card title={t("charts.topProducts")} icon={PieIcon} color={PRIMARY}>
                            <StatusDonut
                                data={summary}
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

                {/* ── Tables ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-5">

                    {/* Top Selling Areas */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.27 }}
                    >
                        <Card
                            title={t("areas.title")}
                            icon={MapPin}
                            color="#10b981"
                            action={
                                <ExportBtn
                                    loading={exAreas}
                                    onClick={() => doExport("/dashboard/orders/top-areas/export", setExAreas, "top_areas")}
                                />
                            }
                        >
                            <MiniTable columns={areasCols} data={areasData} loading={loading} />
                        </Card>
                    </motion.div>

                    {/* Top Selling Products */}
                    {/* <motion.div
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 }}
                    >
                        <Card
                            title={t("products.title")}
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
                    </motion.div> */}

                </div>
            </div>
        </div>
    );
}