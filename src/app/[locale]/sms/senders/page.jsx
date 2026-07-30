"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Download, Loader2, Edit2, Trash2, Power, PowerOff, Star, Users } from "lucide-react";
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
import DateRangePicker from "@/components/atoms/DateRangePicker";
import IntegrationSelect from "../atoms/IntegrationSelect";
import { AddEditSenderModal } from "../atoms/AddEditSenderModal";

export default function SmsSenders() {
    const tc = useTranslations("common");
    const st = useTranslations("smsProviders");
    const { handleExport, exportLoading } = useExport();

    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({ total_records: 0, current_page: 1, per_page: 12 });
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ isActive: "all", integrationId: "all", startDate: "", endDate: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [stats, setStats] = useState({ total: 0, active: 0 });
    const [statsLoading, setStatsLoading] = useState(false);

    const [selected, setSelected] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const { debouncedValue: debouncedSearch } = useDebounce({ value: search });

    const hasActiveFilters = useMemo(() =>
        filters.isActive !== "all" || filters.integrationId !== "all" || !!filters.startDate || !!filters.endDate,
    [filters]);

    function resetPager() {
        setPagination(p => ({ ...p, current_page: 1 }));
    }

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/sms/senders/stats");
            setStats(res.data ?? { total: 0, active: 0 });
        } catch (_) {}
    }, []);

    const fetchData = async (page = 1, limit = 12) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page);
            params.set("limit", limit);
            if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
            if (filters.isActive && filters.isActive !== "all") params.set("isActive", filters.isActive);
            if (filters.integrationId && filters.integrationId !== "all") params.set("integrationId", filters.integrationId);
            if (filters.startDate) params.set("startDate", filters.startDate);
            if (filters.endDate) params.set("endDate", filters.endDate);

            const res = await api.get(`/sms/senders?${params.toString()}`);
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

    useEffect(() => { fetchStats(); setStatsLoading(false); }, [fetchStats]);

    useEffect(() => {
        resetPager();
        fetchData(1, pagination.per_page);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchData(pagination.current_page, pagination.per_page);
    }, []);

    const onExport = useCallback(async () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        await handleExport({
            endpoint: "/sms/senders/export",
            params,
            filename: `sms-senders_${Date.now()}.xlsx`,
        });
    }, [search, handleExport]);

    const handleToggleActive = useCallback(async (row) => {
        setTogglingId(row.id);
        try {
            await api.post(`/sms/senders/${row.id}/toggle-active`);
            toast.success(tc("api.success"));
            fetchData(pagination.current_page, pagination.per_page);
            fetchStats();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setTogglingId(null);
        }
    }, [tc, fetchData, pagination.current_page, pagination.per_page]);

    const handleToggleDefault = useCallback(async (row) => {
        try {
            await api.post(`/sms/senders/${row.id}/set-default`);
            toast.success(tc("api.success"));
            fetchData(pagination.current_page, pagination.per_page);
            fetchStats();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        }
    }, [tc, fetchData, pagination.current_page, pagination.per_page]);

    const openCreate = useCallback(() => { setSelected(null); setCreateOpen(true); }, []);
    const openEdit = useCallback((row) => { setSelected(row); setEditOpen(true); }, []);
    const openDelete = useCallback((row) => { setSelected(row); setDeleteOpen(true); }, []);

    const afterMutate = useCallback(() => {
        fetchData(pagination.current_page, pagination.per_page);
        fetchStats();
    }, [fetchData, pagination.current_page, pagination.per_page]);

    const applyFilters = useCallback(() => {
        resetPager();
        fetchData(1, pagination.per_page);
    }, [fetchData, pagination.per_page]);

    const columns = useMemo(() => [
        { key: "name", header: st("senders.fields.name"), cell: (row) => (
            <span className="font-medium flex items-center gap-1.5">
                {row.name}
                {row.isDefault && <Star size={12} className="text-amber-500 fill-amber-500" />}
            </span>
        )},
        { key: "identifier", header: st("senders.fields.identifier"), cell: (row) => <span className="font-mono text-xs">{row.identifier}</span> },
        { key: "integration", header: st("senders.integration"), cell: (row) => row.integration?.provider?.name || row.integration?.providerCode || tc("notSpecified") },
        { key: "isDefault", header: st("senders.fields.default"), cell: (row) => (
            <Badge variant={row.isDefault ? "secondary" : "outline"}>
                {row.isDefault ? tc("yes") : tc("no")}
            </Badge>
        )},
        { key: "isActive", header: tc("status"), cell: (row) => (
            <Badge variant={row.isActive ? "secondary" : "success"}>
                {row.isActive ? tc("statusCodes.active") : tc("statusCodes.inactive")}
            </Badge>
        )},
        { key: "description", header: st("senders.fields.description"), cell: (row) => row.description || tc("notSpecified") },
        { key: "created_at", header: tc("created_at"), cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : tc("notSpecified") },
        {
            key: "actions", header: tc("actions"),
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        {
                            icon: togglingId === row.id ? <Loader2 size={16} className="animate-spin" /> : row.isActive ? <PowerOff size={16} /> : <Power size={16} />,
                            tooltip: row.isActive ? tc("deactivate") : tc("activate"),
                            onClick: () => handleToggleActive(row),
                            variant: row.isActive ? "orange" : "emerald",
                            permission: "sms.senders.update",
                        },
                        {
                            icon: togglingId === row.id ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} className={row.isDefault ? "fill-amber-500 text-amber-500" : ""} />,
                            tooltip: st("senders.setDefault", { fallback: "Default" }),
                            disabled: row.isDefault,
                            onClick: () => handleToggleDefault(row),
                            variant: "primary",
                            permission: "sms.senders.update",
                        },
                        { icon: <Edit2 size={16} />, tooltip: tc("edit"), onClick: () => openEdit(row), variant: "primary", permission: "sms.senders.update" },
                        { icon: <Trash2 size={16} />, tooltip: tc("delete"), onClick: () => openDelete(row), variant: "red", permission: "sms.senders.delete" },
                    ]}
                />
            ),
        },
    ], [tc, st, openEdit, openDelete, handleToggleActive, handleToggleDefault, togglingId]);

    const headerStats = useMemo(() => [
        { id: "total", name: st("stats.total"), value: stats.total ?? 0, icon: Users, color: "var(--primary)", sortOrder: 1 },
        { id: "active", name: st("stats.active"), value: stats.active ?? 0, icon: Users, color: "#10b981", sortOrder: 2 },
    ], [stats, st]);

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <PageHeader
                breadcrumbs={[
                    { name: st("breadcrumb.home"), href: "/dashboard" },
                    { name: st("breadcrumb.sms") },
                    { name: st("title") },
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
                    emptyTitle: st("emptyTitle"),
                    emptySubtitle: st("emptySubtitle"),
                }}
                filters={
                    <>
                        <FilterField label={st("senders.integration")}>
                            <IntegrationSelect
                                value={filters.integrationId}
                                allOption={true}
                                onChange={(v) => setFilters(f => ({ ...f, integrationId: v }))}
                                noneOption={false}
                                placeholder={tc("all")}
                            />
                        </FilterField>

                        <FilterField label={tc("status")}>
                            <Select
                                value={filters.isActive}
                                onValueChange={(v) => setFilters(f => ({ ...f, isActive: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder={tc("all")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tc("all")}</SelectItem>
                                    <SelectItem value="true">{tc("statusCodes.active")}</SelectItem>
                                    <SelectItem value="false">{tc("statusCodes.inactive")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={tc("date")}>
                            <DateRangePicker
                                value={{ startDate: filters.startDate, endDate: filters.endDate }}
                                onChange={(v) => setFilters(f => ({ ...f, ...v }))}
                            />
                        </FilterField>
                    </>
                }
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                actions={[
                    { key: "create", label: st("actions.addSender"), icon: <Plus size={15} />, color: "primary", onClick: openCreate, permission: "sms.senders.create" },
                    { key: "export", label: tc("export"), icon: exportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />, color: "primary", onClick: onExport, disabled: exportLoading, permission: "sms.senders.read" },
                ]}
                columns={columns}
                data={records}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={({ page, per_page }) => fetchData(page, per_page)}
            />

            {createOpen && (
                <AddEditSenderModal
                    provider={null}
                    integrationId={null}
                    sender={null}
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onSaved={afterMutate}
                />
            )}

            {editOpen && selected && (
                <AddEditSenderModal
                    provider={null}
                    integrationId={selected.integrationId}
                    sender={selected}
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    onSaved={afterMutate}
                />
            )}

            {deleteOpen && selected && (
                <ConfirmDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={st("actions.deleteSender")}
                    description={st("actions.confirmDelete")}
                    confirmText={tc("delete")}
                    cancelText={tc("cancel")}
                    onConfirm={async () => {
                        try {
                            await api.delete(`/sms/senders/${selected.id}`);
                            toast.success(tc("api.success"));
                            setDeleteOpen(false);
                            afterMutate();
                        } catch (e) {
                            toast.error(normalizeAxiosError(e));
                        }
                    }}
                />
            )}
        </div>
    );
}
