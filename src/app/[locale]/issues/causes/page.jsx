"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Plus,
    FileDown,
    Loader2,
    Eye,
    Pencil,
    Trash2,
    Lock,
    FolderTree,
    TrendingUp,
    CalendarDays,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useExport } from "@/hook/useExport";
import { useDebounce } from "@/hook/useDebounce";
import PageHeader from "@/components/atoms/Pageheader";
import { setDocumentTitle } from "@/utils/documentTitle";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { CauseFormDialog } from "./atoms/CauseFormDialog";
import { CauseDetailsDialog } from "./atoms/CauseDetailsDialog";

export default function ManageCausesPage() {
    const tc = useTranslations("common");
    const t = useTranslations("issueCauses");
    const locale = useLocale();
    const { handleExport, exportLoading } = useExport();

    useEffect(() => {
        setDocumentTitle(t("title"));
    }, [t]);

    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({ total_records: 0, current_page: 1, per_page: 12 });
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [selected, setSelected] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { debouncedValue: debouncedSearch } = useDebounce({ value: search });

    const causeName = useCallback(
        (c) => (locale === "ar" ? c?.nameAr || c?.nameEn : c?.nameEn || c?.nameAr),
        [locale],
    );

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await api.get("/issues/causes/statistics");
            setStats(res.data ?? null);
        } catch (_) {
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchData = useCallback(
        async (page = 1, limit = 12) => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                params.set("page", page);
                params.set("limit", limit);
                if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

                const res = await api.get(`/issues/causes/list?${params.toString()}`);
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
        },
        [debouncedSearch],
    );

    useEffect(() => { fetchStats(); }, [fetchStats]);

    useEffect(() => {
        setPagination((p) => ({ ...p, current_page: 1 }));
        fetchData(1, pagination.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    useEffect(() => {
        fetchData(pagination.current_page, pagination.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onExport = useCallback(async () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        await handleExport({
            endpoint: "/issues/causes/export",
            params,
            filename: `causes_${Date.now()}.xlsx`,
        });
    }, [search, handleExport]);

    const openCreate = useCallback(() => { setSelected(null); setCreateOpen(true); }, []);
    const openEdit = useCallback((row) => { setSelected(row); setEditOpen(true); }, []);
    const openView = useCallback((row) => { setSelected(row); setViewOpen(true); }, []);
    const openDelete = useCallback((row) => { setSelected(row); setDeleteOpen(true); }, []);

    const afterMutate = useCallback(() => {
        fetchData(pagination.current_page, pagination.per_page);
        fetchStats();
    }, [fetchData, pagination.current_page, pagination.per_page, fetchStats]);

    const confirmDelete = useCallback(async () => {
        setDeleting(true);
        try {
            await api.delete(`/issues/causes/${selected.id}`);
            setDeleteOpen(false);
            toast.success(t("toast.deleted"));
            afterMutate();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setDeleting(false);
        }
    }, [selected, afterMutate, t]);


    const columns = useMemo(() => [
        {
            key: "nameEn",
            header: t("columns.nameEn"),
            cell: (row) => <span className="font-medium">{row.nameEn || "—"}</span>,
        },
        {
            key: "nameAr",
            header: t("columns.nameAr"),
            cell: (row) => <span>{row.nameAr || "—"}</span>,
        },
        {
            key: "system",
            header: t("columns.type"),
            cell: (row) => (
                <Badge variant={row.system ? "secondary" : "outline"}>
                    {row.system ? t("type.system") : t("type.custom")}
                </Badge>
            ),
        },
        {
            key: "sortOrder",
            header: t("columns.sortOrder"),
            cell: (row) => <span className="tabular-nums">{row.sortOrder ?? 0}</span>,
        },
        {
            key: "issueCount",
            header: t("columns.issueCount"),
            cell: (row) => (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-[var(--primary)]">
                    {row.issueCount ?? 0}
                </span>
            ),
        },
        // {
        //     key: "created_at",
        //     header: tc("created_at"),
        //     cell: (row) =>
        //         row.created_at ? new Date(row.created_at).toLocaleDateString() : tc("notSpecified"),
        // },
        // {
        //     key: "updated_at",
        //     header: t("updated_at"),
        //     cell: (row) =>
        //         row.updated_at ? new Date(row.updated_at).toLocaleDateString() : tc("notSpecified"),
        // },
        {
            key: "actions",
            header: tc("actions"),
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        {
                            icon: <Eye size={16} />,
                            tooltip: t("actions.view"),
                            onClick: () => openView(row),
                            variant: "blue",
                            permission: "issues.read",
                        },
                        {
                            icon: <Pencil size={16} />,
                            tooltip: t("actions.edit"),
                            onClick: () => openEdit(row),
                            variant: "primary",
                            permission: "issues.causes.update",
                            hidden: row.system,
                        },
                        {
                            icon: <Trash2 size={16} />,
                            tooltip: t("actions.delete"),
                            onClick: () => openDelete(row),
                            variant: "red",
                            permission: "issues.causes.delete",
                            hidden: row.system || (row.issueCount ?? 0) > 0,
                        },
                    ]}
                />
            ),
        },
    ], [t, tc, openView, openEdit]);

    const STAT_CARDS = [
        { key: "totalCauses", icon: FolderTree, sortOrder: 0 },
        { key: "systemCauses", icon: Lock, sortOrder: 1 },
        { key: "customCauses", icon: Pencil, sortOrder: 2 },
        { key: "mostIssuedCause", icon: TrendingUp, sortOrder: 3 },
        { key: "mostIssuedLast7Days", icon: CalendarDays, sortOrder: 4 },
    ];

    const statsCards = useMemo(
        () =>
            STAT_CARDS.map(({ key, icon, sortOrder }) => {
                if (key === "totalCauses" || key === "systemCauses" || key === "customCauses") {
                    return {
                        name: t(`stats.${key}`),
                        value: stats?.[key] ?? 0,
                        icon,
                        sortOrder,
                    };
                }
                const stat = stats?.[key];
                return {
                    name: t(`stats.${key}`),
                    value: stat?.issueCount ?? 0,
                    icon,
                    sortOrder,
                    description: stat
                        ? `${causeName(stat)} — ${t("stats.issuesCount", { count: stat.issueCount })}`
                        : undefined,
                };
            }),
        [stats, t, causeName],
    );

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/dashboard" },
                    { name: t("breadcrumb.issues"), href: "/issues" },
                    { name: t("title") },
                ]}
                stats={statsCards}
                statsLoading={statsLoading}
            />

            <Table
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={() => { setPagination((p) => ({ ...p, current_page: 1 })); fetchData(1, pagination.per_page); }}
                labels={{
                    searchPlaceholder: t("table.searchPlaceholder"),
                    filter: tc("filter"),
                    apply: tc("apply"),
                    total: tc("total"),
                    limit: tc("limit"),
                    emptyTitle: t("table.emptyTitle"),
                    emptySubtitle: t("table.emptySubtitle"),
                }}
                actions={[
                    {
                        key: "create",
                        label: t("actions.addCause"),
                        icon: <Plus size={15} />,
                        color: "primary",
                        onClick: openCreate,
                        permission: "issues.causes.create",
                    },
                    {
                        key: "export",
                        label: tc("export"),
                        icon: exportLoading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />,
                        color: "primary",
                        onClick: onExport,
                        disabled: exportLoading,
                        permission: "issues.export",
                    },
                ]}
                columns={columns}
                data={records}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={({ page, per_page }) => fetchData(page, per_page)}
            />

            {createOpen && (
                <CauseFormDialog
                    cause={null}
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onSaved={afterMutate}
                />
            )}

            {editOpen && selected && (
                <CauseFormDialog
                    cause={selected}
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    onSaved={afterMutate}
                />
            )}

            {viewOpen && selected && (
                <CauseDetailsDialog
                    cause={selected}
                    open={viewOpen}
                    onClose={() => setViewOpen(false)}
                />
            )}

            {deleteOpen && selected && (
                <ConfirmDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={t("delete.title")}
                    description={t("delete.desc")}
                    confirmText={t("delete.confirm")}
                    cancelText={t("delete.cancel")}
                    loading={deleting}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
}
