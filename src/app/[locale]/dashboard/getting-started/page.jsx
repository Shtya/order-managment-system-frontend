"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserX,
    PlayCircle,
    CheckCircle2,
    Target,
    UserCheck,
    RefreshCw,
    Filter,
    ChevronRight,
    ChevronLeft,
    TrendingUp,
    BarChart3,
    PieChart as PieIcon,
    X,
    Eye,
    SkipForward,
    Loader2,
    CircleDot,
    Circle,
    Lock,
    ListChecks,
    Activity,
    ListOrdered,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    ArcElement,
    Tooltip as ChTooltip,
    Legend,
    Filler,
    Title,
    Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import PageHeader from "@/components/atoms/Pageheader";
import { setDocumentTitle } from "@/utils/documentTitle";
import { useTranslations, useLocale } from "next-intl";
import { avatarSrc } from "@/components/atoms/UserSelect";
import AdminFilter from "@/components/atoms/AdminFilter";
import { useAuth } from "@/context/AuthContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";

ChartJS.register(
    CategoryScale,
    LinearScale,
    ArcElement,
    ChTooltip,
    Legend,
    Filler,
    Title,
    Tooltip,
);

const PRIMARY = "#6763AF";
const THIRD = "#7672B9";
const COMPLETED_COLOR = "#10b981";
const STARTED_COLOR = "#3b82f6";
const NOT_STARTED_COLOR = "#94a3b8";
const DROP_OFF_COLOR = "#ef4444";

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString());
const pct = (n) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);
const hex = (h, a = 0.12) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return r
        ? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${a})`
        : "transparent";
};

/* ══════════════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════════════ */
function ProgressBar({ value, color = PRIMARY, showLabel = true, height = "h-2" }) {
    const v = Math.min(100, Math.max(0, Number(value) || 0));
    return (
        <div className="flex items-center gap-2.5 min-w-[100px]">
            <div className={cn("flex-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden", height)}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${v}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-12 text-left tabular-nums">
                    {pct(v)}
                </span>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   SKELETON LOADERS
══════════════════════════════════════════════════════════════ */
function KpiSkeleton({ count = 6 }) {
    return (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    className="skeleton rounded-xl"
                    style={{ height: 106, border: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-3 px-4 h-full">
                        <div className="rounded-xl shrink-0" style={{ width: 42, height: 42, background: "var(--border)" }} />
                        <div className="flex-1 space-y-2">
                            <div className="rounded-xl" style={{ height: 20, width: "60%", background: "var(--border)" }} />
                            <div className="rounded" style={{ height: 10, width: "70%", background: "var(--border)", opacity: .6 }} />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="w-full h-[320px] flex flex-col animate-pulse">
            <div className="h-5 w-1/3 rounded-lg bg-slate-100 dark:bg-slate-800 mb-5 mx-5 mt-5" />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-[20px] border-slate-100 dark:border-slate-800" />
            </div>
        </div>
    );
}

function TableSkeleton({ rows = 5, cols = 6 }) {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: `${i * 0.08}s` }}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <div
                            key={j}
                            className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex-1"
                            style={{ opacity: 1 - j * 0.1 }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   HORIZONTAL BAR RANKING (custom, no chart.js)
══════════════════════════════════════════════════════════════ */
function RankingBars({ title, items, color = PRIMARY, valueKey = "value", labelKey = "label", subtitleKey, maxItems = 7, onViewAll }) {
    const t = useTranslations("gettingStartedStats");
    const display = items.slice(0, maxItems);
    const max = display.length ? Math.max(...display.map((d) => Number(d[valueKey]) || 0)) : 0;

    if (!display.length) {
        return (
            <div className="flex flex-col items-center justify-center h-[320px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <BarChart3 size={22} className="text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-400">{t("empty.noData")}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="space-y-4 flex-1 px-5 py-5 overflow-hidden">
                {display.map((row, i) => {
                    const value = Number(row[valueKey]) || 0;
                    const width = max > 0 ? (value / max) * 100 : 0;
                    return (
                        <motion.div
                            key={row.id ?? row.key ?? i}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="space-y-1.5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[70%]" title={row[labelKey]}>
                                    {row[labelKey]}
                                </span>
                                <span className="text-xs font-bold tabular-nums shrink-0" style={{ color }}>
                                    {subtitleKey ? pct(value) : fmt(value)}
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${width}%` }}
                                    transition={{ delay: i * 0.08, duration: 0.7, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, ${color}66, ${color})`,
                                    }}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {onViewAll && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onViewAll}
                        className="text-xs font-bold text-primary hover:underline transition-colors flex items-center gap-1 mx-auto"
                    >
                        {t("charts.viewAllItems")}
                        <ChevronRight size={12} className="rtl:scale-x-[-1]" />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   CARD WRAPPER
══════════════════════════════════════════════════════════════ */
function Card({
    title,
    description,
    icon: Icon,
    color = PRIMARY,
    action,
    children,
    className,
    padded = true,
}) {
    return (
        <div className={cn("main-card", className)}>
            <div className="flex items-start justify-between px-5 pt-5">
                <div className="flex items-start gap-3 min-w-0">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                            background: hex(color, 0.1),
                            border: `1.5px solid ${hex(color, 0.25)}`,
                        }}
                    >
                        {Icon && <Icon size={15} style={{ color }} />}
                    </div>

                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                            {title}
                        </h3>

                        {description && (
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {action && <div className="shrink-0 ml-4">{action}</div>}
            </div>

            <div className="h-px mx-5 mt-4 bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-800 to-transparent" />

            <div className={cn(padded ? "p-5 pt-4" : "pt-4")}>
                {children}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   ITEM DETAIL DRAWER
══════════════════════════════════════════════════════════════ */
function ItemDetailDrawer({ item, itemSteps, onClose, loadingSteps }) {
    const t = useTranslations("gettingStartedStats");
    const locale = useLocale();
    const isAr = locale === "ar";
    const Chevron = isAr ? ChevronLeft : ChevronRight;

    if (!item) return null;
    const title = isAr ? item.title?.ar : item.title?.en;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ x: isAr ? "-100%" : "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: isAr ? "-100%" : "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "fixed top-0 bottom-0 w-full max-w-md bg-card border shadow-2xl overflow-y-auto",
                        isAr ? "left-0 border-l" : "right-0 border-r",
                    )}
                >
                    <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b bg-card/95 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{
                                    background: hex(PRIMARY, 0.1),
                                    border: `1.5px solid ${hex(PRIMARY, 0.25)}`,
                                }}
                            >
                                <ListChecks size={16} style={{ color: PRIMARY }} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {t("itemDetailDrawer.title")}
                                </h3>
                                <p className="text-xs font-semibold text-primary truncate max-w-[200px]">{title}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                        >
                            <X size={16} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="p-5 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <Stat label={t("itemDetailDrawer.completionRate")} value={pct(item.completionPercent)} color={COMPLETED_COLOR} />
                            <Stat label={t("itemDetailDrawer.startedCount")} value={fmt(item.startedPathCount)} color={STARTED_COLOR} />
                            <Stat
                                label={t("itemDetailDrawer.finishedPathCount")}
                                value={fmt(item.finishedPathCount)}
                                color={PRIMARY}
                            />

                            <Stat label={t("itemDetailDrawer.completedCount")} value={fmt(item.completedCount)} color={COMPLETED_COLOR} />
                            <Stat label={t("itemDetailDrawer.skippedCount")} value={fmt(item.skippedCount)} color={"#f59e0b"} />
                            <Stat label={t("itemDetailDrawer.abandonedCount")} value={fmt(item.abandonedCount)} color={DROP_OFF_COLOR} />
                        </div>

                        <ProgressBar value={item.completionPercent} color={COMPLETED_COLOR} />

                        <div>
                            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                                {t("itemDetailDrawer.stepsTitle")}
                            </h4>
                            {loadingSteps ? (
                                <TableSkeleton rows={4} cols={2} />
                            ) : !itemSteps?.steps?.length ? (
                                <EmptyMini text={t("empty.noData")} />
                            ) : (
                                <div className="space-y-3">
                                    {itemSteps.steps.map((step, i) => {
                                        const stepTitle = isAr ? step.title?.ar : step.title?.en;
                                        return (
                                            <motion.div
                                                key={step.id}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3"
                                            >
                                                <div className="flex justify-between flex-col gap-1">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Badge variant="outline" className="shrink-0 text-[10px] font-bold">
                                                            {step.sortOrder ?? i + 1}
                                                        </Badge>
                                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                            {stepTitle}
                                                        </span>
                                                    </div>
                                                    {step.dropOffPercent > 0 && <Badge
                                                        className="text-[10px] shrink-0"
                                                        style={{
                                                            background: hex(DROP_OFF_COLOR, 0.12),
                                                            color: DROP_OFF_COLOR,
                                                            border: `1px solid ${hex(DROP_OFF_COLOR, 0.25)}`,
                                                        }}
                                                    >
                                                        {pct(step.dropOffPercent)} {t("itemDetailDrawer.dropOffPercent")}
                                                    </Badge>}
                                                </div>
                                                <ProgressBar value={step.dropOffPercent} color={DROP_OFF_COLOR} />
                                                <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={11} /> {t("itemDetailDrawer.views")}: <b className="text-slate-700 dark:text-slate-200">{fmt(step.totalViews)}</b>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={11} /> {t("itemDetailDrawer.uniqueViewers")}: <b className="text-slate-700 dark:text-slate-200">{fmt(step.uniqueViewers)}</b>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <SkipForward size={11} /> {t("itemDetailDrawer.skipCount")}: <b className="text-slate-700 dark:text-slate-200">{fmt(step.skippedCount)}</b>
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function Stat({ label, value, color = PRIMARY }) {
    return (
        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="text-lg font-black tabular-nums" style={{ color }}>{value}</p>
        </div>
    );
}

function EmptyMini({ text, icon: Icon = BarChart3 }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                <Icon size={18} className="text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-400">{text}</p>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function GettingStartedStatisticsPage() {
    const tCommon = useTranslations("common");
    const tDash = useTranslations("dashboard");
    const locale = useLocale();
    const t = useTranslations("gettingStartedStats");
    const isAr = locale === "ar";
    const { user, isSuperAdmin } = useAuth();

    useEffect(() => {
        setDocumentTitle(t("breadcrumb.stats"));
    }, [t]);

    /* ── STATE ───────────────────────────────────────────────── */
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(true);
    const [stepsLoading, setStepsLoading] = useState(true);
    const [userOverviewLoading, setUserOverviewLoading] = useState(false);
    const [userItemsLoading, setUserItemsLoading] = useState(false);
    const [userStepsLoading, setUserStepsLoading] = useState(false);

    const [overview, setOverview] = useState(null);
    const [items, setItems] = useState([]);
    const [allSteps, setAllSteps] = useState([]);

    const [adminFilterValue, setAdminFilterValue] = useState("all");
    const [selectedUserObj, setSelectedUserObj] = useState(null);
    const [selectedItemForDrawer, setSelectedItemForDrawer] = useState(null);

    const [itemFilter, setItemFilter] = useState("all");

    const [userOverview, setUserOverview] = useState(null);
    const [userItems, setUserItems] = useState([]);
    const [userSteps, setUserSteps] = useState([]);

    const [activeTab, setActiveTab] = useState("items");

    const selectedUserIdEffective = useMemo(() => {
        if (!adminFilterValue || adminFilterValue === "all") return null;
        return adminFilterValue;
    }, [adminFilterValue]);


    /* ── FETCHERS ────────────────────────────────────────────── */
    const fetchOverview = useCallback(async () => {
        setOverviewLoading(true);
        try {
            const { data } = await api.get("/getting-started/admin/stats/overview");
            setOverview(data);
        } catch (err) {
            console.error("Overview fetch error:", err);
            toast.error(tCommon("api.error"));
        } finally {
            setOverviewLoading(false);
        }
    }, [tCommon]);

    const fetchItems = useCallback(async () => {
        setItemsLoading(true);
        try {
            const { data } = await api.get("/getting-started/admin/stats/items");
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Items fetch error:", err);
            toast.error(tCommon("api.error"));
        } finally {
            setItemsLoading(false);
        }
    }, [tCommon]);

    const fetchSteps = useCallback(async () => {
        setStepsLoading(true);
        try {
            const { data } = await api.get("/getting-started/admin/stats/steps");
            setAllSteps(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Steps fetch error:", err);
            toast.error(tCommon("api.error"));
        } finally {
            setStepsLoading(false);
        }
    }, [tCommon]);

    const fetchAllGeneral = useCallback(() => {
        fetchOverview();
        fetchItems();
        fetchSteps();
    }, [fetchOverview, fetchItems, fetchSteps]);

    const fetchUserStats = useCallback(async (uid) => {
        if (!uid) {
            setUserOverview(null);
            setUserItems([]);
            setUserSteps([]);
            return;
        }
        setUserOverviewLoading(true);
        setUserItemsLoading(true);
        setUserStepsLoading(true);
        try {
            const [ovRes, itRes, stRes] = await Promise.all([
                api.get(`/getting-started/admin/stats/user/${uid}/overview`).catch(() => ({ data: null })),
                api.get(`/getting-started/admin/stats/user/${uid}/items`).catch(() => ({ data: [] })),
                api.get(`/getting-started/admin/stats/user/${uid}/steps`).catch(() => ({ data: [] })),
            ]);
            setUserOverview(ovRes.data);
            setUserItems(Array.isArray(itRes.data) ? itRes.data : []);
            setUserSteps(Array.isArray(stRes.data) ? stRes.data : []);
        } catch (err) {
            console.error("User stats fetch error:", err);
        } finally {
            setUserOverviewLoading(false);
            setUserItemsLoading(false);
            setUserStepsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isSuperAdmin) return;
        fetchAllGeneral();
    }, [isSuperAdmin]);

    useEffect(() => {
        if (selectedUserIdEffective) {
            fetchUserStats(selectedUserIdEffective);
        } else {
            setUserOverview(null);
            setUserItems([]);
            setUserSteps([]);
        }
    }, [selectedUserIdEffective, fetchUserStats]);

    // Fetch the selected user object for display (avatar/name/email in kpi card)
    useEffect(() => {
        let mounted = true;
        if (!selectedUserIdEffective) {
            setSelectedUserObj(null);
            return;
        }
        api.get(`/users/${selectedUserIdEffective}`)
            .then((res) => {
                if (mounted) setSelectedUserObj(res.data ?? null);
            })
            .catch(() => { });
        return () => {
            mounted = false;
        };
    }, [selectedUserIdEffective]);

    // Initialize the user filter from the ?userId= search param (one-time, read-only).
    // The AdminFilter is NOT synced back to the URL — this is an initial value only.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get("userId");
        if (userId) setAdminFilterValue(userId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── DERIVED DATA ────────────────────────────────────────── */

    // Donut data (overview)
    const donutData = useMemo(() => {
        if (!overview) return null;
        const startedNotCompleted = Math.max(0, (overview.startedCount ?? 0) - (overview.completedCount ?? 0));
        return [
            { label: t("charts.completed"), value: overview.completedCount ?? 0, color: COMPLETED_COLOR },
            { label: t("charts.startedNotCompleted"), value: startedNotCompleted, color: STARTED_COLOR },
            { label: t("charts.notStarted"), value: overview.neverStartedCount ?? 0, color: NOT_STARTED_COLOR },
        ];
    }, [overview, t]);

    // Top items ranking (by completionPercent)
    const topItems = useMemo(() => {
        return [...items]
            .sort((a, b) => (b.completionPercent ?? 0) - (a.completionPercent ?? 0))
            .map((it) => ({
                id: it.id,
                key: it.key,
                label: isAr ? it.title?.ar : it.title?.en,
                value: it.completionPercent ?? 0,
            }));
    }, [items, isAr]);

    // Top drop-off steps
    const topDropOffSteps = useMemo(() => {
        const flat = [];
        for (const itemGroup of allSteps) {
            const itemTitle = isAr ? itemGroup.itemTitle?.ar : itemGroup.itemTitle?.en;
            for (const step of itemGroup.steps ?? []) {
                const stepTitle = isAr ? step.title?.ar : step.title?.en;
                flat.push({
                    id: step.id,
                    key: step.key,
                    label: `${itemTitle} — ${stepTitle}`,
                    value: step.dropOffPercent ?? 0,
                    raw: step,
                });
            }
        }
        return flat.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    }, [allSteps, isAr]);

    // Localized item titles for filter select
    const localizedItems = useMemo(() => {
        return items.map((it) => ({
            id: it.id,
            label: isAr ? it.title?.ar : it.title?.en,
        }));
    }, [items, isAr]);

    // Filtered items for table
    const filteredItems = useMemo(() => {
        if (itemFilter === "all") return items;
        return items.filter((it) => it.id === itemFilter);
    }, [items, itemFilter]);

    // Flat steps for table (with item filter)
    const flatStepsForTable = useMemo(() => {
        const rows = [];
        for (const itemGroup of allSteps) {
            if (itemFilter !== "all" && itemGroup.itemId !== itemFilter) continue;
            const itemTitle = isAr ? itemGroup.itemTitle?.ar : itemGroup.itemTitle?.en;
            for (const step of itemGroup.steps ?? []) {
                rows.push({
                    id: step.id,
                    stepTitle: isAr ? step.title?.ar : step.title?.en,
                    itemTitle,
                    sortOrder: step.sortOrder ?? 0,
                    description: isAr ? step.description?.ar : step.description?.en,
                    totalViews: step.totalViews ?? 0,
                    uniqueViewers: step.uniqueViewers ?? 0,
                    dropOffPercent: step.dropOffPercent ?? 0,
                    skipEventCount: step.skipEventCount ?? 0,
                    skippedCount: step.skippedCount ?? 0,
                });
            }
        }
        return rows;
    }, [allSteps, itemFilter, isAr]);

    // Steps for selected item drawer
    const drawerStepsForItem = useMemo(() => {
        if (!selectedItemForDrawer) return null;
        return allSteps.find((g) => g.itemId === selectedItemForDrawer.id) ?? { steps: [] };
    }, [allSteps, selectedItemForDrawer]);

    // Filtered single-user items/steps honoring the shared itemFilter
    const filteredUserItems = useMemo(() => {
        if (itemFilter === "all") return userItems;
        return userItems.filter((it) => it.id === itemFilter);
    }, [userItems, itemFilter]);

    const filteredUserSteps = useMemo(() => {
        if (itemFilter === "all") return userSteps;
        return userSteps.filter((g) => g.itemId === itemFilter);
    }, [userSteps, itemFilter]);

    /* ── HANDLERS ────────────────────────────────────────────── */
    const handleRefresh = () => {
        fetchAllGeneral();
        if (selectedUserIdEffective) fetchUserStats(selectedUserIdEffective);
        toast.success(tCommon("api.success"));
    };

    const getItemStatus = (item) => {
        if (item.completed) return "completed";
        if (item.finished) return "finished";
        if (item.skipped) return "skipped";
        if (item.started) return "inProgress";
        return "notStarted";
    };

    const getStatusColor = (s) => {
        switch (s) {
            case "completed": return COMPLETED_COLOR;
            case "inProgress": return STARTED_COLOR;
            case "skipped": return "#f59e0b";
            default: return NOT_STARTED_COLOR;
        }
    };

    const getStatusLabel = (s) => {
        switch (s) {
            case "completed": return t("userSection.itemsProgress.status.completed");
            case "finished": return t("userSection.itemsProgress.status.finished");
            case "inProgress": return t("userSection.itemsProgress.status.inProgress");
            case "skipped": return t("userSection.itemsProgress.status.skipped");
            default: return t("userSection.itemsProgress.status.notStarted");
        }
    };

    const hasItemsData = useMemo(() => overview && overview.totalAdmins > 0, [overview]);


    /* ── KPI STATS ──────────────────────────────────────────── */
    const kpiStats = useMemo(() => {
        if (!overview) return [];
        const startedPct = overview.totalAdmins > 0
            ? ((overview.startedCount / overview.totalAdmins) * 100).toFixed(1)
            : 0;
        const notStartedPct = overview.totalAdmins > 0
            ? ((overview.neverStartedCount / overview.totalAdmins) * 100).toFixed(1)
            : 0;
        const completedPct = overview.totalAdmins > 0
            ? ((overview.completedCount / overview.totalAdmins) * 100).toFixed(1)
            : 0;

        return [
            {
                id: "total", name: t("kpi.totalUsers"), value: fmt(overview.totalAdmins),
                icon: Users, color: PRIMARY, description: t("kpi.totalUsersDesc"),
                sortOrder: 1,
                trend: { showArrow: false, label: tCommon("admin") },
            },
            {
                id: "notStarted", name: t("kpi.notStarted"), value: fmt(overview.neverStartedCount),
                icon: UserX, color: NOT_STARTED_COLOR, description: t("kpi.notStartedDesc"),
                sortOrder: 2,
                trend: { showArrow: false, label: `${notStartedPct}%` },
            },
            {
                id: "started", name: t("kpi.started"), value: fmt(overview.startedCount),
                icon: PlayCircle, color: STARTED_COLOR, description: t("kpi.startedDesc"),
                sortOrder: 3,
                trend: { showArrow: false, label: `${startedPct}%` },
            },
            {
                id: "completed", name: t("kpi.completedAll"), value: fmt(overview.completedCount),
                icon: CheckCircle2, color: COMPLETED_COLOR, description: t("kpi.completedAllDesc"),
                sortOrder: 4,
                trend: { showArrow: false, label: `${completedPct}%` },
            },
        ];
    }, [overview, t, tCommon, tDash]);

    // Completion Rate KPI (special card with big progress bar inside the InfoCard pattern)
    const kpiCompletionCard = useMemo(() => {
        if (!overview) return null;
        return {
            id: "completion", name: t("kpi.completionRate"),
            value: `${overview.overallCompletionPercentage ?? 0}%`,
            icon: Target, color: PRIMARY, description: t("kpi.completionRateDesc"),
            sortOrder: 5,
            extra: (
                <div className="mt-2">
                    <ProgressBar value={overview.overallCompletionPercentage ?? 0} color={PRIMARY} showLabel={false} height="h-1.5" />
                </div>
            ),
        };
    }, [overview, t]);

    const kpiSelectedUserCard = useMemo(() => {
        return {
            id: "selectedUser", name: t("kpi.selectedUser"),
            value: selectedUserObj?.name ?? t("kpi.selectUser"),
            icon: UserCheck, color: THIRD, description: t("kpi.selectedUserDesc"),
            sortOrder: 6,
            extra: selectedUserObj ? (
                <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-[9px]">
                            {(selectedUserObj.name || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                        <AvatarImage src={avatarSrc(selectedUserObj.avatarUrl)} />
                    </Avatar>
                    <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[120px]">
                        {selectedUserObj.email}
                    </span>
                </div>
            ) : null,
        };
    }, [selectedUserObj, t]);

    /* ── BREADCRUMBS ─────────────────────────────────────────── */
    const breadcrumbs = [
        { name: t("breadcrumb.home"), href: "/" },
        { name: t("breadcrumb.dashboard"), href: "/dashboard" },
        { name: t("breadcrumb.stats") },
    ];

    const buttons = (
        <button
            onClick={handleRefresh}
            className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
        >
            <RefreshCw size={12} />
            {tCommon("refresh")}
        </button>
    );

    /* ── TABS ───────────────────────────────────────────────── */
    const tabs = [
        { id: "items", label: t("tabs.items"), icon: ListOrdered, count: items.length || undefined },
        { id: "steps", label: t("tabs.steps"), icon: Activity, count: flatStepsForTable.length || undefined },
        { id: "users", label: t("tabs.users"), icon: Users },
    ];
    const mainTabsRef = useRef(null);
    const handleViewAllItems = () => {
        setActiveTab("items");

        requestAnimationFrame(() => {
            mainTabsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    const handleViewAllSteps = () => {
        setActiveTab("steps");

        requestAnimationFrame(() => {
            mainTabsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };
    /* ════════════════════════════════════════════════════════════
       RENDER
       ════════════════════════════════════════════════════════════ */

    /* ── ACCESS DENIED ──────────────────────────────────────── */
    // if (!isSuperAdmin) {
    //     return (
    //         <div className="min-h-[60vh] flex flex-col items-center justify-center">
    //             <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 flex items-center justify-center mb-5">
    //                 <Lock size={36} className="text-red-500" />
    //             </div>
    //             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t("accessDenied.title")}</h2>
    //             <p className="text-sm font-semibold text-slate-500 max-w-sm text-center">{t("accessDenied.subtitle")}</p>
    //         </div>
    //     );
    // }
    return (
        <div className="space-under space-y-5 min-h-screen p-4 md:p-6 ">
            {/* ── PAGE HEADER ─────────────────────────────────────── */}
            <PageHeader
                breadcrumbs={breadcrumbs}
                buttons={buttons}
                stats={overviewLoading
                    ? null
                    : kpiCompletionCard
                        ? [...kpiStats, kpiCompletionCard, kpiSelectedUserCard]
                        : null}
                statsLoading={overviewLoading}
                statsCount={6}
            />

            {/* ── FILTERS CARD ───────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="main-card !p-0 overflow-hidden"
            >
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 flex items-center justify-center">
                        <Filter size={12} className="text-primary" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {t("filters.title")}
                    </span>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 items-end">
                        <div className="flex flex-col gap-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <Users size={10} />
                                {t("filters.user")}
                            </label>
                            <AdminFilter
                                labelNone={true}
                                value={adminFilterValue}
                                onChange={setAdminFilterValue}
                                placeholder={t("filters.userPlaceholder")}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <ListChecks size={10} />
                                {t("filters.item")}
                            </label>
                            <Select value={itemFilter} onValueChange={setItemFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("filters.itemPlaceholder")}>
                                        {itemFilter === "all"
                                            ? t("filters.allItems")
                                            : localizedItems.find((i) => i.id === itemFilter)?.label}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-card-select">
                                    <SelectItem value="all">{t("filters.allItems")}</SelectItem>
                                    {localizedItems.map((it) => (
                                        <SelectItem key={it.id} value={it.id}>{it.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2.5 justify-end md:justify-start">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleRefresh}
                                className={cn(
                                    "h-10 px-4 rounded-xl text-xs font-semibold",
                                    "border border-slate-200 dark:border-slate-700",
                                    "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                                    "hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800",
                                    "transition-all flex items-center gap-1.5 shadow-sm",
                                )}
                            >
                                <RefreshCw size={12} />
                                {tCommon("refresh")}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── EMPTY STATE IF NO ITEMS AT ALL ─────────────────── */}
            {!overviewLoading && !hasItemsData && items.length === 0 && (
                <div className="main-card py-16 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <ListChecks size={28} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">{t("empty.noItems")}</p>
                </div>
            )}

            {/* ── CHARTS ROW ─────────────────────────────────────── */}
            {(overviewLoading || itemsLoading || stepsLoading || hasItemsData || items.length > 0) && (
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                    {/* Donut: progress state */}
                    <Card title={t("charts.progressState")} description={t("charts.progressStateDesc")} icon={PieIcon} color={PRIMARY}>
                        {overviewLoading ? (
                            <ChartSkeleton />
                        ) : !donutData ? (
                            <EmptyMini text={t("empty.noData")} icon={PieIcon} />
                        ) : (
                            <DonutChart data={donutData} centerValue={overview?.totalAdmins ?? 0} centerLabel={t("charts.total")} />
                        )}
                    </Card>

                    {/* Items completion ranking */}
                    <Card title={t("charts.itemsCompletion")} description={t("charts.itemsCompletionDesc")} icon={TrendingUp} color={COMPLETED_COLOR}>
                        {itemsLoading ? (
                            <ChartSkeleton />
                        ) : (
                            <RankingBars
                                items={topItems}
                                color={COMPLETED_COLOR}
                                valueKey="value"
                                labelKey="label"
                                subtitleKey
                                maxItems={9}
                                onViewAll={handleViewAllItems}

                            />
                        )}
                    </Card>

                    {/* Drop-off ranking */}
                    <Card title={t("charts.dropOffPoints")} description={t("charts.dropOffPointsDesc")} icon={Activity} color={DROP_OFF_COLOR}>
                        {stepsLoading ? (
                            <ChartSkeleton />
                        ) : (
                            <RankingBars
                                items={topDropOffSteps}
                                color={DROP_OFF_COLOR}
                                valueKey="value"
                                labelKey="label"
                                subtitleKey
                                maxItems={9}
                                onViewAll={handleViewAllSteps}
                            />
                        )}
                    </Card>
                </div>
            )}

            {/* ── MAIN TABS CARD ────────────────────────────────── */}
            <motion.div
                ref={mainTabsRef}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="main-card overflow-hidden"
            >
                <SwitcherTabs items={tabs} activeId={activeTab} onChange={setActiveTab} variant="compact" />

                {/* Items tab */}
                {activeTab === "items" && (
                    <div className="px-5 py-5">
                        {itemsLoading ? (
                            <TableSkeleton rows={6} cols={7} />
                        ) : !filteredItems.length ? (
                            <EmptyMini text={t("empty.noData")} icon={ListOrdered} />
                        ) : (
                            <div className="table-container overflow-x-auto scrollbar-thin">
                                <table className="w-full text-sm min-w-[780px] border-collapse">
                                    <thead>
                                        <tr className="table-header">
                                            <th className="table-header-cell text-left min-w-[200px]">{t("itemsTable.columns.item")}</th>
                                            <th className="table-header-cell text-left min-w-[180px]">{t("itemsTable.columns.completion")}</th>
                                            <th className="table-header-cell">{t("itemsTable.columns.completedCount")}</th>
                                            <th className="table-header-cell">{t("itemsTable.columns.startedCount")}</th>
                                            <th className="table-header-cell">{t("itemsTable.columns.finishedPath")}</th>
                                            <th className="table-header-cell">{t("itemsTable.columns.skipped")}</th>
                                            <th className="table-header-cell">{t("itemsTable.columns.abandoned")}</th>
                                            <th className="table-header-cell">{tCommon("actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map((row, i) => {
                                            const label = isAr ? row.title?.ar : row.title?.en;
                                            return (
                                                <motion.tr
                                                    key={row.id}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="table-row"
                                                >
                                                    <td className="table-cell">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                                                                {row.sortOrder ?? i + 1}
                                                            </Badge>
                                                            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="table-cell">
                                                        <ProgressBar value={row.completionPercent ?? 0} color={COMPLETED_COLOR} />
                                                    </td>
                                                    <td className="table-cell tabular-nums text-center font-semibold text-emerald-600">
                                                        {fmt(row.completedCount)}
                                                    </td>
                                                    <td className="table-cell tabular-nums text-center font-semibold text-blue-600">
                                                        {fmt(row.startedPathCount)}
                                                    </td>
                                                    <td className="table-cell tabular-nums text-center">{fmt(row.finishedPathCount)}</td>
                                                    <td className="table-cell tabular-nums text-center">{fmt(row.skippedCount)}</td>
                                                    <td className="table-cell tabular-nums text-center font-semibold text-red-500">
                                                        {fmt(row.abandonedCount)}
                                                    </td>
                                                    <td className="table-cell">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItemForDrawer(row);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
                                                        >
                                                            <Eye size={11} />
                                                            {t("itemsTable.viewDetails")}
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Steps tab */}
                {activeTab === "steps" && (
                    <div className="px-5 py-5">
                        {stepsLoading ? (
                            <TableSkeleton rows={6} cols={9} />
                        ) : !flatStepsForTable.length ? (
                            <EmptyMini text={t("empty.noData")} icon={Activity} />
                        ) : (
                            <div className="table-container overflow-x-auto scrollbar-thin">
                                <table className="w-full text-sm min-w-[1120px] border-collapse">
                                    <thead>
                                        <tr className="table-header">
                                            <th className="table-header-cell text-left min-w-[200px]">
                                                {t("stepsTable.columns.step")}
                                            </th>

                                            <th className="table-header-cell text-center min-w-[90px]">
                                                {t("stepsTable.columns.sortOrder")}
                                            </th>

                                            <th className="table-header-cell text-left min-w-[180px]">
                                                {t("stepsTable.columns.item")}
                                            </th>

                                            <th className="table-header-cell text-left min-w-[220px]">
                                                {t("stepsTable.columns.description")}
                                            </th>

                                            <th className="table-header-cell">
                                                {t("stepsTable.columns.views")}
                                            </th>

                                            <th className="table-header-cell">
                                                {t("stepsTable.columns.uniqueUsers")}
                                            </th>

                                            <th className="table-header-cell text-left min-w-[220px]">
                                                {t("stepsTable.columns.dropOff")}
                                            </th>

                                            <th className="table-header-cell">
                                                {t("stepsTable.columns.skipped")}
                                            </th>

                                            <th className="table-header-cell">
                                                {t("stepsTable.columns.skippedUsers")}
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {flatStepsForTable.map((row, i) => (
                                            <motion.tr
                                                key={row.id}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="table-row"
                                            >
                                                <td className="table-cell">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block max-w-[220px]">
                                                        {row.stepTitle}
                                                    </span>
                                                </td>

                                                <td className="table-cell tabular-nums text-center">
                                                    <Badge variant="outline" className="text-[10px] font-bold">
                                                        {row.sortOrder}
                                                    </Badge>
                                                </td>

                                                <td className="table-cell">
                                                    <span className="text-xs font-semibold text-slate-500 truncate block max-w-[180px]">
                                                        {row.itemTitle}
                                                    </span>
                                                </td>
                                                <td className="table-cell">
                                                    <span
                                                        className="text-xs text-slate-500 block w-[240px] whitespace-normal break-words"
                                                        title={row.description}
                                                    >
                                                        {row.description || "—"}
                                                    </span>
                                                </td>

                                                <td className="table-cell tabular-nums text-center">
                                                    {fmt(row.totalViews)}
                                                </td>

                                                <td className="table-cell tabular-nums text-center">
                                                    {fmt(row.uniqueViewers)}
                                                </td>

                                                <td className="table-cell">
                                                    <ProgressBar
                                                        value={row.dropOffPercent ?? 0}
                                                        color={DROP_OFF_COLOR}
                                                    />
                                                </td>

                                                <td className="table-cell tabular-nums text-center">
                                                    {fmt(row.skipEventCount)}
                                                </td>

                                                <td className="table-cell tabular-nums text-center">
                                                    {fmt(row.skippedCount)}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Users tab - specific user details */}
                {activeTab === "users" && (
                    <div className="p-5 space-y-5">
                        {/* User selector at top */}
                        <div className="max-w-md">
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                <Users size={10} />
                                {t("filters.user")}
                            </label>
                            <AdminFilter
                                labelNone={true}
                                value={adminFilterValue}
                                onChange={setAdminFilterValue}
                                placeholder={t("filters.userPlaceholder")}
                            />
                        </div>

                        {!selectedUserIdEffective ? (
                            <EmptyMini text={t("userSection.noUserSelected")} icon={UserCheck} />
                        ) : (
                            <>
                                {/* User KPI cards */}
                                {userOverviewLoading ? (
                                    <KpiSkeleton count={4} />
                                ) : userOverview ? (
                                    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                                        <UserKpiCard
                                            title={t("userSection.kpi.completionPercent")}
                                            value={`${userOverview.completionPercent ?? 0}%`}
                                            icon={Target}
                                            color={COMPLETED_COLOR}
                                            subtitle={
                                                <ProgressBar value={userOverview.completionPercent ?? 0} color={COMPLETED_COLOR} showLabel={false} height="h-1.5" />
                                            }
                                        />
                                        <UserKpiCard
                                            title={t("userSection.kpi.completedItems")}
                                            value={`${fmt(userOverview.completedCount)}/${fmt(userOverview.totalItems)}`}
                                            icon={CheckCircle2}
                                            color={COMPLETED_COLOR}
                                            subtitle={<ProgressBar value={userOverview.completionPercent ?? 0} color={COMPLETED_COLOR} showLabel={false} height="h-1.5" />}
                                        />
                                        <UserKpiCard
                                            title={t("userSection.kpi.startedItems")}
                                            value={`${fmt(userOverview.startedCount)}/${fmt(userOverview.totalItems)}`}
                                            icon={PlayCircle}
                                            color={STARTED_COLOR}
                                            subtitle={<ProgressBar value={userOverview.startedPercent ?? 0} color={STARTED_COLOR} showLabel={false} height="h-1.5" />}
                                        />
                                        <UserKpiCard
                                            title={t("userSection.kpi.skippedItems")}
                                            value={`${fmt(userOverview.skippedCount)}/${fmt(userOverview.totalItems)}`}
                                            icon={SkipForward}
                                            color={"#f59e0b"}
                                            subtitle={<ProgressBar value={userOverview.skippedPercent ?? 0} color={"#f59e0b"} showLabel={false} height="h-1.5" />}
                                        />
                                    </div>
                                ) : null}

                                {/* Overall progress bar */}
                                {/* {userOverview && (
                                    <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                {t("userSection.kpi.overallProgress")}
                                            </span>
                                            <span className="text-xl font-black tabular-nums" style={{ color: PRIMARY }}>
                                                {pct(userOverview.completionPercent)}
                                            </span>
                                        </div>
                                        <ProgressBar value={userOverview.completionPercent ?? 0} color={PRIMARY} showLabel={false} height="h-3" />
                                    </div>
                                )} */}

                                {/* Items progress for user */}
                                <Card title={t("userSection.itemsProgress.title")} icon={ListChecks} color={PRIMARY} className={"shadow-none!"}>
                                    {userItemsLoading ? (
                                        <TableSkeleton rows={5} cols={6} />
                                    ) : !filteredUserItems.length ? (
                                        <EmptyMini text={t("userSection.noActivity")} icon={ListOrdered} />
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredUserItems
                                                .map((row, i) => {
                                                    const label = isAr ? row.title?.ar : row.title?.en;
                                                    const status = getItemStatus(row);
                                                    const color = getStatusColor(status);
                                                    return (
                                                        <motion.div
                                                            key={row.id}
                                                            initial={{ opacity: 0, y: 4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 space-y-3"
                                                        >
                                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                                <div className="flex items-start gap-2.5 min-w-0">
                                                                    <div
                                                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                                                        style={{ background: hex(color, 0.12), border: `1.5px solid ${hex(color, 0.25)}` }}
                                                                    >
                                                                        {status === "completed" ? (
                                                                            <CheckCircle2 size={14} style={{ color }} />
                                                                        ) : status === "notStarted" ? (
                                                                            <Circle size={14} style={{ color }} />
                                                                        ) : status === "skipped" ? (
                                                                            <SkipForward size={14} style={{ color }} />
                                                                        ) : (
                                                                            <CircleDot size={14} style={{ color }} />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{label}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <Badge
                                                                                className="text-[10px] font-bold"
                                                                                style={{
                                                                                    background: hex(color, 0.12),
                                                                                    color,
                                                                                    border: `1px solid ${hex(color, 0.25)}`,
                                                                                }}
                                                                            >
                                                                                {getStatusLabel(status)}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-[11px] text-slate-500 shrink-0">
                                                                    <span className="flex items-center gap-1">
                                                                        <Eye size={11} /> {t("userSection.itemsProgress.opens")}: <b className="text-slate-700 dark:text-slate-200 tabular-nums">{fmt(row.openCount)}</b>
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Activity size={11} /> {t("userSection.itemsProgress.views")}: <b className="text-slate-700 dark:text-slate-200 tabular-nums">{fmt(row.stepViewEventCount)}</b>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                                        {t("userSection.itemsProgress.columns.stepProgress")}
                                                                    </span>
                                                                    <span className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-slate-300">
                                                                        {fmt(row.uniqueStepsViewed)}/{fmt(row.stepCount)} ({pct(row.stepsProgressPercent)})
                                                                    </span>
                                                                </div>
                                                                <ProgressBar value={row.stepsProgressPercent ?? 0} color={color} showLabel={false} height="h-2" />
                                                            </div>
                                                            {(row.lastViewedStepKey || row.completedAt || row.firstStartedAt) && (
                                                                <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
                                                                    {row.firstStartedAt && (
                                                                        <span>• {t("itemDetailDrawer.firstStartedAt")}: <b className="text-slate-600 dark:text-slate-300">{new Date(row.firstStartedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</b></span>
                                                                    )}
                                                                    {row.completedAt && (
                                                                        <span>• {t("itemDetailDrawer.completedAt")}: <b className="text-slate-600 dark:text-slate-300">{new Date(row.completedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</b></span>
                                                                    )}
                                                                    {row.last_viewed_step_title && (
                                                                        <span>
                                                                            • {t("userSection.itemsProgress.columns.lastStep")}:{" "}
                                                                            <b className="text-primary">
                                                                                {locale === "ar"
                                                                                    ? row.last_viewed_step_title?.ar
                                                                                    : row.last_viewed_step_title?.en}
                                                                            </b>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </Card>

                                {/* Steps timeline */}
                                <Card title={t("userSection.stepsTimeline.title")} icon={ListOrdered} color={STARTED_COLOR} className={"shadow-none!"}>
                                    {userStepsLoading ? (
                                        <TableSkeleton rows={6} cols={2} />
                                    ) : !filteredUserSteps.length ? (
                                        <EmptyMini text={t("userSection.noActivity")} icon={Activity} />
                                    ) : (
                                        <div className="space-y-6">
                                            {filteredUserSteps
                                                .map((itemGroup, gi) => {
                                                    const itemLabel = isAr ? itemGroup.itemTitle?.ar : itemGroup.itemTitle?.en;
                                                    const Chevron = isAr ? ChevronLeft : ChevronRight;
                                                    return (
                                                        <div key={itemGroup.itemId} className="space-y-3">
                                                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                                <div
                                                                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                                                    style={{ background: hex(PRIMARY, 0.1) }}
                                                                >
                                                                    <ListChecks size={12} style={{ color: PRIMARY }} />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{itemLabel}</span>
                                                            </div>
                                                            <div className="relative pl-8 rtl:pr-8 rtl:pl-0 space-y-3 before:absolute before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800 rtl:before:right-[11px] before:left-[11px]">
                                                                {(itemGroup.steps ?? []).map((step, si) => {
                                                                    const stepLabel = isAr ? step.title?.ar : step.title?.en;
                                                                    const dotColor = step.viewed
                                                                        ? COMPLETED_COLOR
                                                                        : step.skipped
                                                                            ? "#f59e0b"
                                                                            : NOT_STARTED_COLOR;
                                                                    return (
                                                                        <div key={step.id} className="relative">
                                                                            <div
                                                                                className={cn(
                                                                                    "absolute top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow",
                                                                                    "rtl:right-[-23px] left-[-23px]",
                                                                                )}
                                                                                style={{ background: dotColor }}
                                                                            >
                                                                                {step.viewed ? (
                                                                                    <CheckCircle2 size={11} className="text-white" />
                                                                                ) : step.skipped ? (
                                                                                    <SkipForward size={11} className="text-white" />
                                                                                ) : (
                                                                                    <Circle size={11} className="text-white" />
                                                                                )}
                                                                            </div>
                                                                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
                                                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                                        <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                                                                                            {step.sortOrder ?? si + 1}
                                                                                        </Badge>
                                                                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                                                                                            {stepLabel}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                                        {step.viewed && (
                                                                                            <Badge
                                                                                                className="text-[10px]"
                                                                                                style={{
                                                                                                    background: hex(COMPLETED_COLOR, 0.12),
                                                                                                    color: COMPLETED_COLOR,
                                                                                                    border: `1px solid ${hex(COMPLETED_COLOR, 0.25)}`,
                                                                                                }}
                                                                                            >
                                                                                                {t("userSection.stepsTimeline.viewed")}
                                                                                            </Badge>
                                                                                        )}
                                                                                        {step.skipped && (
                                                                                            <Badge
                                                                                                className="text-[10px]"
                                                                                                style={{
                                                                                                    background: hex("#f59e0b", 0.12),
                                                                                                    color: "#f59e0b",
                                                                                                    border: `1px solid ${hex("#f59e0b", 0.25)}`,
                                                                                                }}
                                                                                            >
                                                                                                {t("userSection.stepsTimeline.skipped")}
                                                                                            </Badge>
                                                                                        )}
                                                                                        {!step.viewed && !step.skipped && (
                                                                                            <Badge variant="outline" className="text-[10px] text-slate-400">
                                                                                                {t("userSection.stepsTimeline.notViewed")}
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-500">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Eye size={11} /> {t("userSection.stepsTimeline.viewCount")}: <b className="tabular-nums text-slate-700 dark:text-slate-200">{fmt(step.viewCount)}</b>
                                                                                    </span>
                                                                                    <span className="flex items-center gap-1">
                                                                                        <SkipForward size={11} /> {t("userSection.stepsTimeline.skipCount")}: <b className="tabular-nums text-slate-700 dark:text-slate-200">{fmt(step.skipCount)}</b>
                                                                                    </span>
                                                                                    {step.lastViewedAt && (
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Chevron size={11} /> {t("userSection.stepsTimeline.lastViewed")}: <b className="text-slate-600 dark:text-slate-300">
                                                                                                {new Date(step.lastViewedAt).toLocaleString(isAr ? "ar-EG" : "en-US", { dateStyle: "short", timeStyle: "short" })}
                                                                                            </b>
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </Card>
                            </>
                        )}
                    </div>
                )}
            </motion.div>

            {/* ── ITEM DETAIL DRAWER ─────────────────────────────── */}
            <ItemDetailDrawer
                item={selectedItemForDrawer}
                itemSteps={drawerStepsForItem}
                loadingSteps={stepsLoading}
                onClose={() => setSelectedItemForDrawer(null)}
            />
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   DONUT CHART (with custom legend like order-analysis StatusDonut)
══════════════════════════════════════════════════════════════ */
function DonutChart({ data, centerValue, centerLabel }) {
    const tCommon = useTranslations("common");
    const hasData = data && data.length > 0;
    const total = hasData ? data.reduce((s, d) => s + (Number(d.value) ?? 0), 0) : 0;

    if (!hasData || total === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[320px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 mx-5 my-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <PieIcon size={22} className="text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-400">{tCommon("noData")}</p>
            </div>
        );
    }

    const chartData = {
        labels: data.map((d) => d.label),
        datasets: [
            {
                data: data.map((d) => d.value),
                backgroundColor: data.map((d, i) => hex(d.color, 0.9)),
                borderColor: data.map((d) => d.color),
                borderWidth: 2.5,
                hoverOffset: 14,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "76%",
        plugins: {
            legend: { display: false },
            tooltip: {
                rtl: true,
                backgroundColor: "#fff",
                titleColor: "#64748b",
                bodyColor: "#1e293b",
                borderColor: "#e2e8f0",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    label: (ctx) =>
                        ` ${ctx.label}: ${ctx.raw} (${((ctx.raw / total) * 100).toFixed(1)}%)`,
                },
            },
        },
    };

    return (
        <div className="flex flex-col items-center gap-4 px-5 py-5">
            <div className="relative h-52 w-full">
                <Doughnut data={chartData} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800 dark:text-white leading-none tabular-nums">
                        {centerValue}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1.5">
                        {centerLabel}
                    </span>
                </div>
            </div>
            <div className="w-full space-y-1.5">
                {data.map((item, i) => {
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-default group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{
                                        background: item.color,
                                        boxShadow: `0 0 0 3px ${hex(item.color, 0.2)}`,
                                    }}
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[160px]">
                                        {item.label}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {fmt(item.value)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-16 h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden hidden sm:block">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${percentage}%`, background: item.color }}
                                    />
                                </div>
                                <span
                                    className="text-xs font-bold w-8 text-right tabular-nums"
                                    style={{ color: item.color }}
                                >
                                    {percentage}%
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   USER KPI CARD (compact, for specific-user section)
══════════════════════════════════════════════════════════════ */
function UserKpiCard({ title, value, icon: Icon, color = PRIMARY, subtitle }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative w-full h-[106px] rounded-xl bg-card border border-border overflow-hidden"
            style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
        >
            <div className="flex flex-col justify-between h-full" style={{ padding: "14px 16px" }}>
                <div className="flex justify-between items-start w-full">
                    <div style={{ flex: 1, minWidth: 0 }} className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 truncate">
                                {title}
                            </span>
                        </div>
                        <div
                            className="text-2xl font-black leading-none tracking-tight text-slate-800 dark:text-white tabular-nums"
                        >
                            {value}
                        </div>
                    </div>
                    <div
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                            background: hex(color, 0.1),
                            border: `1.5px solid ${hex(color, 0.2)}`,
                        }}
                    >
                        {Icon && <Icon size={15} style={{ color }} />}
                    </div>
                </div>
                {subtitle && <div>{subtitle}</div>}
            </div>
        </motion.div>
    );
}
