"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, RefreshCw, MessageSquare, CheckCircle, XCircle, Clock, Send } from "lucide-react";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useExport } from "@/hook/useExport";
import { useDebounce } from "@/hook/useDebounce";
import PageHeader from "@/components/atoms/Pageheader";
import Table, { FilterField } from "@/components/atoms/Table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";

const STATUS_ICONS = {
    sent: CheckCircle,
    failed: XCircle,
    pending: Clock,
};

const STATUS_COLORS = {
    sent: "secondary",
    failed: "destructive",
    pending: "warning",
};

export default function SmsLogs() {
    const tc = useTranslations("common");
    const st = useTranslations("smsProviders");
    const { handleExport, exportLoading } = useExport();

    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({ total_records: 0, current_page: 1, per_page: 12 });
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ status: "", startDate: "", endDate: "" });
    const [appliedFilters, setAppliedFilters] = useState({ status: "", startDate: "", endDate: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });
    const [statsLoading, setStatsLoading] = useState(false);
    const [resendingId, setResendingId] = useState(null);
    const [resendAllOpen, setResendAllOpen] = useState(false);
    const [resendingAll, setResendingAll] = useState(false);

    const { debouncedValue: debouncedSearch } = useDebounce({ value: search });

    const hasActiveFilters = useMemo(() =>
        !!(appliedFilters.status || appliedFilters.startDate || appliedFilters.endDate), [appliedFilters]);

    function resetPager() {
        setPagination(p => ({ ...p, current_page: 1 }));
    }

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/sms/logs/stats");
            setStats(res.data ?? { total: 0, sent: 0, failed: 0, pending: 0 });
        } catch (_) {}
    }, []);

    const fetchData = async (page = 1, limit = 12) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page);
            params.set("limit", limit);
            if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
            if (appliedFilters.status) params.set("status", appliedFilters.status);
            if (appliedFilters.startDate) params.set("startDate", appliedFilters.startDate);
            if (appliedFilters.endDate) params.set("endDate", appliedFilters.endDate);

            const res = await api.get(`/sms/logs?${params.toString()}`);
            setRecords(res.data.records ?? []);
            setPagination({
                total_records: res.data.total_records ?? 0,
                current_page: res.data.current_page ?? 1,
                per_page: res.data.per_page ?? limit,
            });
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(pagination.current_page, pagination.per_page); }, []);

    useEffect(() => {
        resetPager();
        fetchData(1, pagination.per_page);
    }, [debouncedSearch]);

    useEffect(() => { fetchStats(); setStatsLoading(false); }, [fetchStats]);

    const onExport = useCallback(async () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        await handleExport({
            endpoint: "/sms/logs/export",
            params,
            filename: `sms-logs_${Date.now()}.xlsx`,
        });
    }, [search, handleExport]);

    const handleResendLog = useCallback(async (row) => {
        setResendingId(row.id);
        try {
            const res = await api.post(`/sms/logs/${row.id}/resend`);
            const status = res?.data?.status;
            if (status === "failed") {
                toast.error(st("send.failed", { error: res?.data?.error || "" }));
            } else {
                toast.success(st("send.success", { fallback: "Sent successfully" }));
            }
            fetchData(pagination.current_page, pagination.per_page);
            fetchStats();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setResendingId(null);
        }
    }, [st, fetchData, pagination.current_page, pagination.per_page]);

    const handleResendAllFailed = useCallback(async () => {
        setResendingAll(true);
        try {
            await api.post("/sms/logs/resend-all-failed");
            toast.success(st("logs.resendAllSuccess", { fallback: "All failed messages are being resent" }));
            setResendAllOpen(false);
            fetchData(pagination.current_page, pagination.per_page);
            fetchStats();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setResendingAll(false);
        }
    }, [st, fetchData, pagination.current_page, pagination.per_page]);

    const columns = useMemo(() => [
        { key: "phone", header: st("logs.fields.phone", { fallback: "Phone" }), cell: (row) => <span className="font-mono text-xs">{row.toNumber}</span> },
        { key: "message", header: st("logs.fields.message", { fallback: "Message" }), cell: (row) => (
            <span className="text-sm line-clamp-2 max-w-[250px]">{row.message}</span>
        )},
        { key: "sender", header: st("logs.fields.sender", { fallback: "Sender" }), cell: (row) => row.sender?.name || row.senderName || tc("notSpecified") },
        { key: "status", header: tc("status"), cell: (row) => {
            const Icon = STATUS_ICONS[row.status] || Send;
            return (
                <Badge variant={STATUS_COLORS[row.status] || "outline"} className="gap-1">
                    <Icon size={12} />
                    {st(`logs.status.${row.status}`, { fallback: row.status })}
                </Badge>
            );
        }},
        { key: "sentAt", header: st("logs.fields.sentAt", { fallback: "Sent at" }), cell: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : tc("notSpecified") },
        {
            key: "actions", header: tc("actions"),
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        row.status === "failed" && {
                            icon: resendingId === row.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />,
                            tooltip: st("logs.resend", { fallback: "Resend" }),
                            onClick: () => handleResendLog(row),
                            variant: "primary",
                            permission: "sms.logs.resend",
                        },
                    ].filter(Boolean)}
                />
            ),
        },
    ], [tc, st, handleResendLog, resendingId]);

    const headerStats = useMemo(() => [
        { id: "total", name: st("stats.total"), value: stats.total ?? 0, icon: MessageSquare, color: "var(--primary)", sortOrder: 1 },
        { id: "sent", name: st("stats.sent"), value: stats.sent ?? 0, icon: CheckCircle, color: "#10b981", sortOrder: 2 },
        { id: "failed", name: st("stats.failed"), value: stats.failed ?? 0, icon: XCircle, color: "#ef4444", sortOrder: 3 },
        { id: "pending", name: st("stats.pending"), value: stats.pending ?? 0, icon: Clock, color: "#f59e0b", sortOrder: 4 },
    ], [stats, st]);

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <PageHeader
                breadcrumbs={[
                    { name: st("breadcrumb.home"), href: "/dashboard" },
                    { name: st("breadcrumb.sms") },
                    { name: st("logs.title") },
                ]}
                stats={headerStats}
                statsLoading={statsLoading}
            />

            <Table
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={() => { resetPager(); fetchData(1, pagination.per_page); }}
                labels={{
                    searchPlaceholder: st("searchPlaceholder"),
                    filter: tc("filter"),
                    apply: tc("apply"),
                    total: tc("total"),
                    limit: tc("limit"),
                    emptyTitle: st("logs.emptyTitle"),
                    emptySubtitle: st("logs.emptySubtitle"),
                }}
                filters={
                    <>
                        <FilterField label={tc("status")}>
                            <Select
                                value={filters.status || "none"}
                                onValueChange={(v) => setFilters(f => ({ ...f, status: v === "none" ? "" : v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder={tc("all")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{tc("all")}</SelectItem>
                                    <SelectItem value="sent">{st("logs.status.sent", { fallback: "Sent" })}</SelectItem>
                                    <SelectItem value="failed">{st("logs.status.failed", { fallback: "Failed" })}</SelectItem>
                                    <SelectItem value="pending">{st("logs.status.pending", { fallback: "Pending" })}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={tc("date")}>
                            <DateRangePicker
                                value={{ startDate: filters.startDate, endDate: filters.endDate }}
                                onChange={(v) => setFilters(f => ({ ...f, ...v }))}
                                placeholder={tc("date")}
                                dataSize="default"
                                maxDate="today"
                            />
                        </FilterField>
                    </>
                }
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={() => {
                    setAppliedFilters({ ...filters });
                    resetPager();
                    fetchData(1, pagination.per_page);
                }}
                actions={[
                    { key: "export", label: tc("export"), icon: exportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />, color: "primary", onClick: onExport, disabled: exportLoading, permission: "sms.logs.read" },
                ]}
                columns={columns}
                data={records}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={({ page, per_page }) => fetchData(page, per_page)}
            />

            <ConfirmDialog
                open={resendAllOpen}
                onOpenChange={setResendAllOpen}
                title={st("logs.resendAllTitle", { fallback: "Resend all failed messages" })}
                description={st("logs.resendAllDesc", { fallback: "This will re-queue all failed SMS messages for sending again. Continue?" })}
                confirmText={st("logs.resendAll", { fallback: "Resend all" })}
                cancelText={tc("cancel")}
                loading={resendingAll}
                onConfirm={handleResendAllFailed}
            />
        </div>
    );
}
