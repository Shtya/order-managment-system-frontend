"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    FileDown,
    Eye,
    GitBranch,
    Play,
    AlertCircle,
    CheckCircle,
    Clock,
    Loader2,
    Calendar,
    Activity,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import Button_ from "@/components/atoms/Button";
import { TutorialSpotlight } from "@/components/atoms/TutorialSpotlight";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import { Input } from "@/components/ui/input";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { useNotification } from "@/context/NotificationContext";
import { useSocket } from "@/context/SocketContext";

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

const TriggerType = {
    ORDER_CREATED: 'order_created',
    ORDER_UPDATED: 'order_updated',
};

const RunStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PAUSED: 'paused',
};

const MOCK_STATS = {
    running: 8,
    problems: 3,
    completed: 1240,
    total: 1251,
};

function buildListQuery({ page, per_page, search, filters }) {
    const params = {}
    params.page = String(page);
    params.limit = String(per_page);
    if (search?.trim()) params.search = search.trim();
    if (filters.status && filters.status !== "all") params.status = filters.status;
    if (filters.triggerType && filters.triggerType !== "all") params.triggerType = filters.triggerType;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
}

export default function AutomationLogsPage() {
    const router = useRouter();
    const tCommon = useTranslations("common");
    const tAutomations = useTranslations("whatsApp.automations");
    const t = useTranslations("whatsApp.automationLogs");
    const tTutorial = useTranslations("tutorial.automationLogs");

    const [search, setSearch] = useState("");
    const { debouncedValue: debouncedSearch } = useDebounce({ value: search });

    const [loading, setLoading] = useState(false);
    const [pager, setPager] = useState({
        total_records: 0,
        current_page: 1,
        per_page: 12,
        records: [],
    });

    const [filters, setFilters] = useState({
        status: "all",
        triggerType: "all",
        startDate: null,
        endDate: null
    });

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        paused: 0,
    });

    const { handleExport, exportLoading } = useExport();

    const statsCards = useMemo(
        () => [
            { name: t("stats.total"), value: stats.total, icon: Clock, color: "#8b5cf6", description: tTutorial("stats.total.description"), example: tTutorial("stats.total.example") },
            { name: t("stats.running"), value: stats.running, icon: Play, color: "#3b82f6", description: tTutorial("stats.running.description"), example: tTutorial("stats.running.example") },
            { name: t("stats.problems"), value: stats.failed, icon: AlertCircle, color: "#ef4444", description: tTutorial("stats.problems.description"), example: tTutorial("stats.problems.example") },
            { name: t("stats.completed"), value: stats.completed, icon: CheckCircle, color: "#10b981", description: tTutorial("stats.completed.description"), example: tTutorial("stats.completed.example") },
            { name: t("stats.pending"), value: stats.pending, icon: Activity, color: "#64748b", description: tTutorial("stats.pending.description"), example: tTutorial("stats.pending.example") },
            { name: t("stats.paused"), value: stats.paused, icon: RefreshCw, color: "#f59e0b", description: tTutorial("stats.paused.description"), example: tTutorial("stats.paused.example") },
        ],
        [t, stats, tTutorial]
    );

    const fetchStats = async () => {
        try {
            const res = await api.get("/automation/runs/stats");
            setStats(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLogs = async ({ page = 1, per_page = 12 } = {}) => {
        setLoading(true);
        try {
            const params = buildListQuery({ page, per_page, search: debouncedSearch, filters });
            const res = await api.get(`/automation/runs`, { params });
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
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchLogs({ page: 1, per_page: pager.per_page });
    }, [debouncedSearch]);

    const { subscribe } = useSocket();

    useEffect(() => {
        const unsubscribe = subscribe("AUTOMATION_RUN_UPDATE", (payload) => {
            if (!payload) return;
            setPager((prev) => {
                const updatedRecords = prev.records.map((run) => {
                    if (run.id === payload.runId) {
                        return {
                            ...run,
                            status: payload.status,
                            currentNodeId: payload.currentNodeId,
                            completedNodeIds: payload.completedNodeIds,
                            errorMessage: payload.errorMessage,
                            executionState: payload.executionState,
                        };
                    }
                    return run;
                });
                return { ...prev, records: updatedRecords };
            });
        });
        return unsubscribe;
    }, [subscribe]);

    const hasActiveFilters = useMemo(() => {
        return (
            filters.status !== "all" ||
            filters.triggerType !== "all" ||
            filters.startDate !== "" ||
            filters.endDate !== ""
        );
    }, [filters]);

    const handlePageChange = ({ page, per_page }) => {
        fetchLogs({ page, per_page });
    };

    const onExport = async () => {
        const params = buildListQuery({ page: 1, per_page: pager.per_page, search: debouncedSearch, filters });
        await handleExport({
            endpoint: "/automation/runs/export",
            params,
            filename: `automation_logs_export_${Date.now()}.xlsx`,
        });
    };

    const columns = useMemo(
        () => [
            {
                header: t("table.automation"),
                key: "automation",
                description: tTutorial("columns.automation.description"),
                example: tTutorial("columns.automation.example"),
                cell: (row) => (
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-700 dark:text-slate-200">
                            {row.automationFlow?.name || "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <GitBranch size={10} />
                            v{row.version?.versionString || "1.0"}
                        </span>
                    </div>
                ),
            },
            {
                header: t("table.trigger"),
                key: "trigger",
                description: tTutorial("columns.trigger.description"),
                example: tTutorial("columns.trigger.example"),
                cell: (row) => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs">{tAutomations(`triggers.${row.automationFlow?.triggerType}`)}</span>
                        {/* <span className="text-[10px] font-mono text-muted-foreground">#{row.triggerEntityId}</span> */}
                    </div>
                ),
            },
            {
                header: t("table.status"),
                key: "status",
                description: tTutorial("columns.status.description"),
                example: tTutorial("columns.status.example"),
                cell: (row) => (
                    <div
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                            row.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : row.status === "running"
                                    ? "bg-blue-100 text-blue-700"
                                    : row.status === "failed"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-slate-100 text-slate-700"
                        )}
                    >
                        {t(`statuses.${row.status}`)}
                    </div>
                ),
            },
            {
                header: t("table.progress"),
                key: "progress",
                description: tTutorial("columns.progress.description"),
                example: tTutorial("columns.progress.example"),
                cell: (row) => {
                    const nodes = row.version?.flow?.nodes || [];
                    const currentNode = nodes.find((n) => n.id === row.currentNodeId);
                    const nodeTitle = currentNode?.data?.label || row.currentNodeId;

                    return (
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium">
                                {row.completedNodeIds?.length || 0} {t("table.steps")}
                            </span>
                            {row.status === "failed" && row.errorMessage && (
                                <span className="text-[10px] text-rose-500 max-w-[150px] truncate" title={row.errorMessage}>
                                    {row.errorMessage}
                                </span>
                            )}
                            {row.status !== "completed" && row.currentNodeId && (
                                <span className="text-[10px] text-muted-foreground italic">
                                    {t("table.atNode")}: {nodeTitle}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                header: t("table.startedAt"),
                key: "startedAt",
                description: tTutorial("columns.startedAt.description"),
                example: tTutorial("columns.startedAt.example"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={14} />
                        {row.startedAt ? new Date(row.startedAt).toLocaleString() : "—"}
                    </div>
                ),
            },
            {
                header: tCommon("actions"),
                key: "actions",
                description: tTutorial("columns.actions.description"),
                example: tTutorial("columns.actions.example"),
                cell: (row) => (
                    <ActionButtons
                        row={row}
                        actions={[
                            {
                                icon: <Eye size={16} />,
                                tooltip: t("actions.view"),
                                onClick: (r) => router.push(`/automations/running?id=${r.id}`),
                                variant: "primary",
                                permission: "automation.read",
                            },
                        ]}
                    />
                ),
            },
        ],
        [t, tAutomations, tCommon, router, tTutorial]
    );

    const applyFilters = () => {
        fetchLogs({ page: 1, per_page: pager.per_page });
    };

    const handleRefresh = () => {
        fetchLogs({ page: pager.current_page, per_page: pager.per_page });
        fetchStats();
        toast.success(t("refreshed") || "Data refreshed");
    };

    return (
        <div className="min-h-screen p-5 space-y-6 bg-slate-50/50 dark:bg-transparent">
            <PageHeader
                breadcrumbs={[
                    { name: tAutomations("breadcrumb.home"), href: "/dashboard" },
                    { name: tAutomations("breadcrumb.automations"), href: "/automations" },
                    { name: t("breadcrumb.logs") },
                ]}
                buttons={
                    <div className="flex items-center gap-2">
                        <Button_
                            variant="outline"
                            tone="primary"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={loading}
                            icon={<RefreshCw size={16} className={cn(loading && "animate-spin")} />}
                            label={tCommon("refresh") || "Refresh"}
                        />
                        <Button_
                            size="sm"
                            label={tAutomations("runningAutomations") || "Running Automations"}
                            variant="outline"
                            onClick={() => router.push("/automations/running")}
                            permission="automation.read"
                            icon={<Activity size={18} />}
                        />
                    </div>
                }
                stats={statsCards}
            />

            <Table
                isLoading={loading}
                data={pager.records}
                columns={columns}
                onPageChange={handlePageChange}
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={applyFilters}
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                labels={{
                    searchPlaceholder: t("toolbar.searchPlaceholder"),
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
                        permission: "automation.read",
                    },
                ]}
                filters={
                    <>
                        <FilterField label={t("filters.status")}>
                            <Select
                                value={filters.status}
                                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    {Object.values(RunStatus).map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {t(`statuses.${s}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={tAutomations("filters.triggerType")}>
                            <Select
                                value={filters.triggerType}
                                onValueChange={(v) => setFilters((f) => ({ ...f, triggerType: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    {Object.values(TriggerType).map((tt) => (
                                        <SelectItem key={tt} value={tt}>
                                            {tAutomations(`triggers.${tt}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>


                        <FilterField d label={t("filters.startDate")}>
                            <DateRangePicker
                                value={{
                                    startDate: filters.startDate,
                                    endDate: filters.endDate,
                                }}
                                onChange={(newDates) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        ...newDates,
                                    }))
                                }
                                placeholder={t("filters.datePlaceholder")}
                                dataSize="default"
                                maxDate="today"
                            />
                        </FilterField>

                    </>
                }
            />
        </div>
    );
}
