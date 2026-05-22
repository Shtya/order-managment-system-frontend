"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    FileDown,
    Eye,
    AlertTriangle,
    History,
    AlertCircle,
    Clock,
    Loader2,
    Bug,
    Globe,
    Server,
    Activity,
    User as UserIcon,
    Search,
    RefreshCw,
    Calendar,
    Mail,
    Shield,
    Terminal,
    Fingerprint,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";

function normalizeAxiosError(err) {
    const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Unexpected error";
    return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

function FilterField({ label, children }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase">{label}</Label>
            {children}
        </div>
    );
}

const SEVERITIES = ["fatal", "error", "warn"];
const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export default function ServerErrorsPage() {
    const tCommon = useTranslations("common");
    const t = useTranslations("systemErrors");

    const [search, setSearch] = useState("");
    const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        mostFrequentRoute: { routePath: "N/A", count: 0 },
        count48h: 0,
        total30d: 0,
        fatal48h: 0,
    });
    const [meta, setMeta] = useState({
        routePaths: [],
        exceptionNames: [],
        environments: [],
    });
    const [pager, setPager] = useState({
        total_records: 0,
        current_page: 1,
        per_page: 10,
        records: [],
    });

    const [viewState, setViewState] = useState({ open: false, error: null });
    const { handleExport, exportLoading } = useExport();

    const [filters, setFilters] = useState({
        severity: "all",
        method: "all",
        routePath: "all",
        httpStatus: "all",
        exceptionName: "all",
        environment: "all",
        startDate: null,
        endDate: null,
    });

    const statsCards = useMemo(
        () => [
            // {
            //     name: t("stats.mostFrequent"),
            //     value: stats.mostFrequentRoute?.routePath || "N/A",
            //     subValue: `${stats.mostFrequentRoute?.count || 0} errors`,
            //     icon: Activity,
            //     color: "#8b5cf6"
            // },
            {
                name: t("stats.last48h"),
                value: stats.count48h || 0,
                icon: Clock,
                color: "#f59e0b"
            },
            {
                name: t("stats.total30d"),
                value: stats.total30d || 0,
                icon: AlertCircle,
                color: "#3b82f6"
            },
            {
                name: t("stats.fatal48h"),
                value: stats.fatal48h || 0,
                icon: AlertTriangle,
                color: "#ef4444"
            },
        ],
        [stats, t]
    );

    const fetchMeta = useCallback(async () => {
        try {
            const [metaRes, statsRes] = await Promise.all([
                api.get("/system-erorrs/meta"),
                api.get("/system-erorrs/stats"),
            ]);
            setMeta(metaRes.data || { routePaths: [], exceptionNames: [], environments: [] });
            setStats(statsRes.data || {});
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);

    const fetchErrors = async ({ page = 1, per_page = 10 } = {}) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: per_page,
                search: debouncedSearch,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== "all" && v !== null)
                ),
            };
            const res = await api.get("/system-erorrs", { params });
            setPager({
                total_records: res.data?.total_records ?? 0,
                current_page: res.data?.current_page ?? page,
                per_page: res.data?.per_page ?? per_page,
                records: res.data?.records ?? [],
            });
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchErrors({ page: 1, per_page: pager.per_page });
    }, [debouncedSearch, filters]);

    const handlePageChange = ({ page, per_page }) => {
        fetchErrors({ page, per_page });
    };

    const onExport = async () => {
        const params = {
            search: debouncedSearch,
            ...Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== "all" && v !== null)
            ),
        };
        await handleExport({
            endpoint: "/system-erorrs/export",
            params,
            filename: `system_errors_${Date.now()}.xlsx`,
        });
    };

    const columns = useMemo(
        () => [
            {
                header: t("table.severity"),
                key: "severity",
                cell: (row) => (
                    <div
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                            row.severity === "fatal"
                                ? "bg-rose-100 text-rose-700 shadow-[0_0_8px_rgba(225,29,72,0.2)]"
                                : row.severity === "error"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-amber-100 text-amber-700"
                        )}
                    >
                        {row.severity || "error"}
                    </div>
                ),
            },
            {
                header: t("table.methodPath"),
                key: "endpoint",
                cell: (row) => (
                    <div className="flex flex-col max-w-[250px]">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] font-black px-1.5 py-0.5 rounded border",
                                row.method === 'GET' ? "text-blue-600 border-blue-200 bg-blue-50" :
                                    row.method === 'POST' ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
                                        "text-slate-600 border-slate-200 bg-slate-50"
                            )}>{row.method}</span>
                            <span className="font-bold text-xs truncate">{row.routePath || row.endpoint}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate mt-1">{row.originalUrl}</span>
                    </div>
                ),
            },
            {
                header: t("table.status"),
                key: "httpStatus",
                cell: (row) => (
                    <span className={cn(
                        "font-mono font-bold",
                        row.httpStatus >= 500 ? "text-rose-500" : "text-orange-500"
                    )}>{row.httpStatus}</span>
                )
            },
            {
                header: t("table.message"),
                key: "errorMessage",
                cell: (row) => (
                    <div className="flex flex-col max-w-[300px]">
                        <span className="text-xs font-bold line-clamp-1 text-rose-600">{row.exceptionName}</span>
                        <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{row.errorMessage}</span>
                    </div>
                ),
            },
            {
                header: t("table.user"),
                key: "user",
                cell: (row) => (
                    <div className="flex flex-col gap-3 min-w-[180px]">
                        {/* User Section */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <UserIcon size={12} className="text-slate-900 shrink-0" />
                                <span className="text-[11px] font-black truncate" title={row.user?.name}>{row.user?.name || "Guest"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 overflow-hidden mt-0.5">
                                <Mail size={12} className="text-slate-400 shrink-0" />
                                <span className="text-[10px] text-slate-500 truncate" title={row.user?.email}>{row.user?.email || "—"}</span>
                            </div>
                        </div>

                    </div>
                ),
            },
            {
                header: t("table.admin"),
                key: "admin",
                cell: (row) => (
                    <div className="flex flex-col gap-3 min-w-[180px]">
                        {/* Admin Section */}
                        
                            <div className="flex flex-col pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <Shield size={12} className="text-primary shrink-0" />
                                    <span className="text-[10px] text-primary font-black truncate" title={row?.admin?.name}>{row?.admin?.name || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 overflow-hidden mt-0.5">
                                    <Mail size={12} className="text-primary/40 shrink-0" />
                                    <span className="text-[10px] text-primary/60 truncate" title={row.admin?.email}>{row.admin?.email || "—"}</span>
                                </div>
                            </div>
                        
                    </div>
                ),
            },
            {
                header: t("table.environment"),
                key: "environment",
                cell: (row) => (
                    <div className="flex flex-col gap-1">
                        <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded border self-start",
                            row.environment === 'production'
                                ? "text-rose-700 border-rose-200 bg-rose-50 dark:bg-rose-500/10"
                                : "text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-500/10"
                        )}>{row.environment || "N/A"}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                            <Globe size="10" className="text-slate-400" />
                            <span>{row.ipAddress || "0.0.0.0"}</span>
                        </div>
                    </div>
                )
            },            {
                header: t("table.frontendRoute"),
                key: "frontendRoute",
                cell: (row) => (
                    <div className="max-w-[150px]">
                        {row.frontendRoute ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <Globe size={11} className="text-slate-900 dark:text-slate-100 shrink-0" />
                                <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 truncate" title={row.frontendRoute}>
                                    {row.frontendRoute}
                                </span>
                            </div>
                        ) : (
                            <span className="text-[10px] text-slate-300 dark:text-slate-700 font-bold">—</span>
                        )}
                    </div>
                )
            },
            {
                header: t("table.performance"),
                key: "durationMs",
                cell: (row) => (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                            <Clock size={12} className="text-muted-foreground" />
                            <span className={cn(
                                "font-bold",
                                (row.durationMs || 0) > 1000 ? "text-rose-500" : "text-emerald-500"
                            )}>{row.durationMs || 0}ms</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground truncate max-w-[120px]" title={row.userAgent}>
                            {row.userAgent}
                        </span>
                    </div>
                )
            },
            {
                header: t("table.time"),
                key: "createdAt",
                cell: (row) => (
                    <div className="flex flex-col text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{new Date(row.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="text-[10px] ml-4">{new Date(row.createdAt).toLocaleTimeString()}</span>
                    </div>
                ),
            },
            {
                header: tCommon("actions"),
                key: "actions",
                cell: (row) => (
                    <ActionButtons
                        row={row}
                        actions={[
                            {
                                icon: <Bug size={16} />,
                                tooltip: t("details.title"),
                                onClick: () => setViewState({ open: true, error: row }),
                                variant: "red",
                                permission: "system.errors.view",
                            },
                        ]}
                    />
                ),
            },
        ],
        [tCommon, t]
    );

    return (
        <div className="min-h-screen p-5 space-y-6">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.dashboard"), href: "/dashboard" },
                    { name: t("breadcrumb.errors") },
                ]}
                stats={statsCards}
            />

            <Table
                isLoading={loading}
                data={pager.records}
                columns={columns}
                onPageChange={handlePageChange}
                searchValue={search}
                onSearchChange={setSearch}
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                labels={{
                    searchPlaceholder: t("filters.searchPlaceholder"),
                    filter: tCommon("filter"),
                    apply: tCommon("apply"),
                    total: tCommon("total"),
                    limit: tCommon("limit"),
                    emptyTitle: t("table.empty"),
                }}
                actions={[
                    {
                        key: "export",
                        label: tCommon("export"),
                        icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />,
                        color: "primary",
                        onClick: onExport,
                        disabled: exportLoading,
                        permission: "system.errors.list",
                    },
                ]}
                filters={
                    <>
                        <FilterField label={t("filters.dateRange")}>
                            <DateRangePicker
                                value={{ startDate: filters.startDate, endDate: filters.endDate }}
                                onChange={(newDates) => setFilters(f => ({ ...f, ...newDates }))}
                            />
                        </FilterField>

                        <FilterField label={t("filters.severity")}>
                            <Select
                                value={filters.severity}
                                onValueChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    {SEVERITIES.map((s) => (
                                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("filters.status")}>
                            <Select
                                value={filters.httpStatus}
                                onValueChange={(v) => setFilters((f) => ({ ...f, httpStatus: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    <SelectItem value="400">400 Bad Request</SelectItem>
                                    <SelectItem value="403">403 Forbidden</SelectItem>
                                    <SelectItem value="404">404 Not Found</SelectItem>
                                    <SelectItem value="all_400">All 400x</SelectItem>
                                    <SelectItem value="all_500">All 500x</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("filters.exception")}>
                            <Select
                                value={filters.exceptionName}
                                onValueChange={(v) => setFilters((f) => ({ ...f, exceptionName: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    {meta.exceptionNames.map((n) => (
                                        <SelectItem key={n} value={n}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("filters.environment")}>
                            <Select
                                value={filters.environment}
                                onValueChange={(v) => setFilters((f) => ({ ...f, environment: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    {meta.environments.map((e) => (
                                        <SelectItem key={e} value={e}>{e}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={t("filters.method")}>
                            <Select
                                value={filters.method}
                                onValueChange={(v) => setFilters((f) => ({ ...f, method: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    {METHODS.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("filters.routePath")}>
                            <Select
                                value={filters.routePath}
                                onValueChange={(v) => setFilters((f) => ({ ...f, routePath: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    {meta.routePaths.map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </>
                }
            />

            <Dialog open={viewState.open} onOpenChange={(open) => setViewState({ open, error: null })}>
                <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto overflow-x-hidden custom-scrollbar p-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl gap-0">

                    {/* Header Section */}
                    <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 sticky top-0 backdrop-blur z-10">
                        <DialogTitle className="flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xl font-bold tracking-tight">
                            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30">
                                <Bug size={24} className="text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("details.title")}</span>
                                <span className="font-mono text-base font-bold text-slate-800 dark:text-slate-100">{viewState.error?.exceptionName || "Exception"}</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {viewState.error && (
                        <div className="p-6 md:p-8 space-y-8 divide-y divide-slate-100 dark:divide-slate-900">

                            {/* Primary Info */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Activity size={14} className="text-indigo-500" />
                                    {t("details.general")}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-3 p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/70 dark:border-rose-900/30 flex flex-col gap-1.5 shadow-sm">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 dark:text-rose-400/80">{t("details.labels.errorMessage")}</Label>
                                        <span className="text-sm font-semibold text-rose-700 dark:text-rose-300 break-words leading-relaxed">{viewState.error.errorMessage || "—"}</span>
                                    </div>

                                    <DetailItem label={t("details.labels.endpoint")} value={`${viewState.error.method || ""} ${viewState.error.endpoint || ""}`} isMono />
                                    <DetailItem label={t("details.labels.routePath")} value={viewState.error.routePath} isMono />
                                    <DetailItem
                                        label={t("details.labels.httpStatus")}
                                        value={viewState.error.httpStatus}
                                        badge
                                        badgeType={viewState.error.httpStatus >= 500 ? 'error' : 'warning'}
                                    />
                                    <DetailItem label={t("details.labels.severity")} value={viewState.error.severity} badge badgeType="danger" />
                                    <DetailItem label={t("details.labels.environment")} value={viewState.error.environment} badge badgeType="info" />
                                    <DetailItem label={t("details.labels.errorCode")} value={viewState.error.errorCode} isMono />
                                    <DetailItem label={t("details.labels.duration")} value={`${viewState.error.durationMs || 0}ms`} />
                                    <DetailItem label={t("details.labels.createdAt")} value={new Date(viewState.error.createdAt).toLocaleString()} />
                                </div>
                            </section>

                            {/* User & Admin Info */}
                            <section className="space-y-4 pt-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <UserIcon size={14} className="text-indigo-500" />
                                    {t("details.userAdmin")}
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* User Reporter Card */}
                                    <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 space-y-4">
                                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">{t("details.labels.userReporter")}</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <DetailItem label={t("details.labels.userId")} value={viewState.error.userId} isMono />
                                            <DetailItem label={t("details.labels.userName")} value={viewState.error.user?.name} />
                                            <DetailItem label={t("details.labels.userEmail")} value={viewState.error.user?.email} />
                                        </div>
                                    </div>

                                    {/* Admin Context Card */}
                                    <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 space-y-4">
                                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">{t("details.labels.adminContext")}</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <DetailItem label={t("details.labels.adminId")} value={viewState.error.adminId} isMono />
                                            <DetailItem label={t("details.labels.adminName")} value={viewState.error.admin?.name} />
                                            <DetailItem label={t("details.labels.adminEmail")} value={viewState.error.admin?.email} />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Technical Context */}
                            <section className="space-y-4 pt-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Terminal size={14} className="text-indigo-500" />
                                    {t("details.technical")}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <DetailItem label={t("details.labels.exceptionName")} value={viewState.error.exceptionName} isMono />
                                    <DetailItem label={t("details.labels.frontendRoute")} value={viewState.error.frontendRoute} className="md:col-span-3" isMono />
                                    <DetailItem label={t("details.labels.referer")} value={viewState.error.referer} className="md:col-span-3" isMono />
                                    <DetailItem label={t("details.labels.userAgent")} value={viewState.error.userAgent} className="md:col-span-3" />
                                    <DetailItem label={t("details.labels.ipAddress")} value={viewState.error.ipAddress} isMono />
                                    <DetailItem label={t("details.labels.contentType")} value={viewState.error.contentType} isMono />
                                    <DetailItem label={t("details.labels.originalUrl")} value={viewState.error.originalUrl} className="md:col-span-3" isMono />
                                </div>
                            </section>

                            {/* Payloads & Headers */}
                            <section className="space-y-6 pt-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Fingerprint size={14} className="text-indigo-500" />
                                    {t("details.payloads")}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <JsonBlock label={t("details.labels.requestPayload")} data={viewState.error.requestPayload} />
                                    <JsonBlock label={t("details.labels.headers")} data={viewState.error.headers} />
                                    <JsonBlock label={t("details.labels.pathParams")} data={viewState.error.pathParams} />
                                    <JsonBlock label={t("details.labels.searchParams")} data={viewState.error.searchParams} />
                                    <JsonBlock label={t("details.labels.responseData")} data={viewState.error.responseData} />
                                    <JsonBlock label={t("details.labels.validationErrors")} data={viewState.error.validationErrors} />
                                    <JsonBlock label={t("details.labels.externalContext")} data={viewState.error.externalContext} />
                                    <JsonBlock label={t("details.labels.dbContext")} data={viewState.error.dbContext} />
                                    <JsonBlock label={t("details.labels.additionalDetails")} data={viewState.error.additionalDetails} />
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-900 pt-4">
                                    <DetailItem label={t("details.labels.requestSize")} value={`${viewState.error.requestSize || 0} bytes`} />
                                    <DetailItem label={t("details.labels.responseSize")} value={`${viewState.error.responseSize || 0} bytes`} />
                                </div>
                            </section>

                            {/* Stack Trace */}
                            {viewState.error.stackTrace && (
                                <section className="space-y-4 pt-6" dir="ltr">
                                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <History size={14} className="text-indigo-500" />
                                        {t("details.stackTrace")}
                                    </h3>
                                    <div className="relative group rounded-xl! overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                                        <pre className="p-5 bg-slate-950 text-slate-300 text-[11px] whitespace-pre-wrap break-all font-mono leading-relaxed max-h-[400px] overflow-x-auto custom-scrollbar selection:bg-rose-500/30">
                                            {viewState.error.stackTrace}
                                        </pre>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>


        </div>
    );
}
{/* Component: DetailItem */ }
function DetailItem({ label, value, className, isMono = false, badge = false, badgeType = 'info' }) {
    const getBadgeStyles = () => {
        switch (badgeType) {
            case 'error': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 rounded-md font-bold';
            case 'danger': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 px-2 py-0.5 rounded-md font-bold';
            case 'warning': return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 px-2 py-0.5 rounded-md font-bold';
            default: return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 px-2 py-0.5 rounded-md font-bold';
        }
    };

    return (
        <div className={cn("p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 flex flex-col gap-1 shadow-2sm hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-150", className)}>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">{label}</Label>
            <div className="flex items-center min-h-[1.25rem]">
                {badge && value ? (
                    <span className={cn("text-[11px]", getBadgeStyles())}>{value}</span>
                ) : (
                    <span className={cn(
                        "text-xs text-slate-700 dark:text-slate-300 break-all leading-normal font-medium",
                        isMono && "font-mono bg-slate-100 dark:bg-slate-800/60 px-1 py-0.5 rounded text-[11px] text-slate-800 dark:text-slate-200"
                    )}>
                        {value || "—"}
                    </span>
                )}
            </div>
        </div>
    );
}

{/* Component: JsonBlock */ }
function JsonBlock({ label, data }) {
    if (!data || Object.keys(data).length === 0) return null;
    return (
        <div className="space-y-2 flex flex-col " dir="ltr">
            <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</Label>
                <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">JSON</span>
            </div>
            <div className="relative border rounded-xl overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm group">
                <pre className="p-4 bg-slate-900 dark:bg-slate-950 text-emerald-400 dark:text-emerald-500 text-[11px] whitespace-pre-wrap break-all font-mono max-h-[220px] overflow-x-auto custom-scrollbar leading-relaxed selection:bg-emerald-500/20">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
}