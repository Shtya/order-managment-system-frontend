"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Ban,
    CheckCircle,
    Eye,
    FileDown,
    Loader2,
    Pencil,
    PlusCircle,
    Trash2,
    UserPlus,
    XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useExport } from "@/hook/useExport";
import { setDocumentTitle } from "@/utils/documentTitle";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import Button_ from "@/components/atoms/Button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import UserSelect from "@/components/atoms/UserSelect";
import { CauseFormDialog } from "./atoms/CauseFormDialog";
import { CauseDetailsDialog } from "./atoms/CauseDetailsDialog";
import { ReviewCauseDialog } from "./atoms/ReviewCauseDialog";

const DEFAULT_FILTERS = {
    isActive: "all",
    reviewStatus: "pending",
    employee: "all",
    startDate: null,
    endDate: null,
};

export default function CancelCausesPage() {
    const tc = useTranslations("common");
    const t = useTranslations("cancelCauses");
    const { handleExport, exportLoading } = useExport();

    const [viewMode, setViewMode] = useState("main");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

    const [pager, setPager] = useState({
        total_records: 0,
        current_page: 1,
        per_page: 12,
        records: [],
    });

    const [selected, setSelected] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewMode, setReviewMode] = useState("accept");
    const [rejectingId, setRejectingId] = useState(null);

    const searchTimer = useRef(null);

    useEffect(() => {
        setDocumentTitle(t("title"));
    }, [t]);

    useEffect(() => {
        const tab = new URLSearchParams(window.location.search).get("tab");
        if (tab === "main" || tab === "custom") setViewMode(tab);
    }, []);

    const viewModes = useMemo(
        () => [
            { id: "main", label: t("tabs.main"), title: t("tabs.main"), icon: Ban },
            { id: "custom", label: t("tabs.custom"), title: t("tabs.custom"), icon: UserPlus },
        ],
        [t],
    );

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setSearch("");
        setDebouncedSearch("");
        const nextFilters = {
            ...DEFAULT_FILTERS,
            reviewStatus: mode === "custom" ? "pending" : "all",
        };
        setFilters(nextFilters);
        setAppliedFilters(nextFilters);
        setPager({
            total_records: 0,
            current_page: 1,
            per_page: 12,
            records: [],
        });
        const url = new URL(window.location.href);
        url.searchParams.set("tab", mode);
        window.history.replaceState(null, "", url.toString());
    };

    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    const applyFilters = () => {
        setAppliedFilters(filters);
        fetchData(1, pager.per_page, filters);
    };

    const hasActiveFilters = useMemo(() => {
        if (viewMode === "main") {
            return (
                appliedFilters.isActive !== "all" ||
                appliedFilters.employee !== "all" ||
                Boolean(appliedFilters.startDate) ||
                Boolean(appliedFilters.endDate)
            );
        }
        return (
            appliedFilters.reviewStatus !== "pending" ||
            appliedFilters.employee !== "all" ||
            Boolean(appliedFilters.startDate) ||
            Boolean(appliedFilters.endDate)
        );
    }, [appliedFilters, viewMode]);

    const buildParams = useCallback(
        (page, per_page, filterState = appliedFilters) => {
            const params = { page, limit: per_page };
            if (debouncedSearch) params.search = debouncedSearch;

            if (viewMode === "main") {
                params.reviewStatus = "approved";
                if (filterState.isActive !== "all") params.isActive = filterState.isActive;
            } else {
                params.source = "employee";
                if (filterState.reviewStatus !== "all") {
                    params.reviewStatus = filterState.reviewStatus;
                }
            }

            if (filterState.employee && filterState.employee !== "all") {
                params.employeeId = filterState.employee;
            }
            if (filterState.startDate) params.startDate = filterState.startDate;
            if (filterState.endDate) params.endDate = filterState.endDate;
            return params;
        },
        [appliedFilters, debouncedSearch, viewMode],
    );

    const fetchData = useCallback(
        async (page = 1, per_page = 12, filterState = appliedFilters) => {
            setLoading(true);
            try {
                const res = await api.get("/cancel-causes", {
                    params: buildParams(page, per_page, filterState),
                });
                setPager({
                    total_records: res.data.total_records ?? 0,
                    current_page: res.data.current_page ?? 1,
                    per_page: res.data.per_page ?? per_page,
                    records: res.data.records ?? [],
                });
            } catch (e) {
                toast.error(normalizeAxiosError(e));
            } finally {
                setLoading(false);
            }
        },
        [appliedFilters, buildParams],
    );

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await api.get("/cancel-causes/statistics");
            setStats(res.data ?? null);
        } catch (_) {
            setStats(null);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchData(1, pager.per_page, appliedFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, viewMode]);

    const onExport = useCallback(async () => {
        await handleExport({
            endpoint: "/cancel-causes/export",
            params: buildParams(1, 100000, appliedFilters),
            filename: `cancel_causes_${Date.now()}.xlsx`,
        });
    }, [appliedFilters, buildParams, handleExport]);

    const afterMutate = useCallback(() => {
        fetchData(pager.current_page, pager.per_page);
        fetchStats();
    }, [fetchData, pager.current_page, pager.per_page, fetchStats]);

    const rejectCause = useCallback(async (row) => {
        if (!row?.id || rejectingId) return;
        setRejectingId(row.id);
        try {
            await api.post(`/cancel-causes/${row.id}/reject`, {});
            toast.success(t("toast.rejected"));
            afterMutate();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setRejectingId(null);
        }
    }, [afterMutate, rejectingId, t]);

    const confirmDelete = useCallback(async () => {
        setDeleting(true);
        try {
            await api.delete(`/cancel-causes/${selected.id}`);
            setDeleteOpen(false);
            toast.success(t("toast.deleted"));
            afterMutate();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setDeleting(false);
        }
    }, [selected, afterMutate, t]);

    const statusBadge = (status) => {
        const variant =
            status === "approved"
                ? "secondary"
                : status === "pending"
                    ? "outline"
                    : "destructive";
        return (
            <Badge variant={variant} className={cn(status === "rejected" && "bg-red-500/10 text-red-600")}>
                {t(`status.${status || "approved"}`)}
            </Badge>
        );
    };

    const columns = useMemo(() => {
        const cols = [
            {
                key: "name",
                header: t("columns.name"),
                cell: (row) => <span className="font-medium">{row.name || "—"}</span>,
            },
            {
                key: "description",
                header: t("columns.description"),
                cell: (row) => (
                    <span className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {row.description || "—"}
                    </span>
                ),
            },
            {
                key: "usageCount",
                header: t("columns.usageCount"),
                cell: (row) => (
                    <span className="tabular-nums font-semibold text-[var(--primary)]">
                        {row.usageCount ?? 0}
                    </span>
                ),
            },
        ];

        if (viewMode === "main") {
            cols.splice(2, 0, {
                key: "isActive",
                header: t("columns.active"),
                cell: (row) => (
                    <Badge variant={row.isActive ? "secondary" : "outline"}>
                        {row.isActive ? t("filters.active") : t("filters.inactive")}
                    </Badge>
                ),
            });
            cols.splice(3, 0, {
                key: "sortOrder",
                header: t("columns.sortOrder"),
                cell: (row) => <span className="tabular-nums">{row.sortOrder ?? 0}</span>,
            });
        } else {
            cols.splice(2, 0, {
                key: "reviewStatus",
                header: t("columns.status"),
                cell: (row) => statusBadge(row.reviewStatus),
            });
            cols.splice(3, 0, {
                key: "submittedBy",
                header: t("columns.submittedBy"),
                cell: (row) => row.submittedByEmployee?.name || "—",
            });
        }

        cols.push({
            key: "actions",
            header: tc("actions"),
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        {
                            icon: <Eye size={16} />,
                            tooltip: t("actions.view"),
                            onClick: () => {
                                setSelected(row);
                                setViewOpen(true);
                            },
                            variant: "blue",
                            permission: "cancel-causes.read",
                        },
                        {
                            icon: <Pencil size={16} />,
                            tooltip: t("actions.edit"),
                            onClick: () => {
                                setSelected(row);
                                setFormOpen(true);
                            },
                            variant: "primary",
                            permission: "cancel-causes.update",
                            hidden: viewMode !== "main",
                        },
                        {
                            icon: <CheckCircle size={16} />,
                            tooltip: t("actions.accept"),
                            onClick: () => {
                                setSelected(row);
                                setReviewMode("accept");
                                setReviewOpen(true);
                            },
                            variant: "emerald",
                            permission: "cancel-causes.review",
                            hidden: viewMode !== "custom" || row.reviewStatus !== "pending",
                        },
                        {
                            icon: <XCircle size={16} />,
                            tooltip: t("actions.reject"),
                            onClick: () => rejectCause(row),
                            disabled: rejectingId === row.id,
                            variant: "red",
                            permission: "cancel-causes.review",
                            hidden: viewMode !== "custom" || row.reviewStatus !== "pending",
                        },
                        {
                            icon: <Trash2 size={16} />,
                            tooltip: t("actions.delete"),
                            onClick: () => {
                                setSelected(row);
                                setDeleteOpen(true);
                            },
                            variant: "red",
                            permission: "cancel-causes.delete",
                            hidden: viewMode !== "main",
                        },
                    ]}
                />
            ),
        });

        return cols;
    }, [t, tc, viewMode, rejectCause, rejectingId]);

    const headerStats = useMemo(
        () => [
            {
                name: t("stats.approvedCatalog"),
                value: stats?.approvedCatalogCount ?? 0,
                icon: Ban,
                sortOrder: 0,
            },
            {
                name: t("stats.pendingReview"),
                value: stats?.pendingReviewCount ?? 0,
                icon: UserPlus,
                sortOrder: 1,
            },
            {
                name: t("stats.rejectedCatalog"),
                value: stats?.rejectedCatalogCount ?? 0,
                icon: XCircle,
                sortOrder: 2,
            },
            {
                name: t("stats.totalCancellations"),
                value: stats?.totalCancellations ?? 0,
                icon: CheckCircle,
                sortOrder: 3,
            },
        ],
        [stats, t],
    );

    return (
        <div className="min-h-screen p-5">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/dashboard" },
                    { name: t("breadcrumb.issues"), href: "/issues" },
                    { name: t("title") },
                ]}
                stats={headerStats}
                statsLoading={statsLoading}
                items={viewModes}
                active={viewMode}
                setActive={handleViewModeChange}
                buttons={
                    viewMode === "main" && (
                        <Button_
                            size="sm"
                            label={t("actions.addCause")}
                            variant="solid"
                            onClick={() => {
                                setSelected(null);
                                setFormOpen(true);
                            }}
                            icon={<PlusCircle size={18} />}
                            permission="cancel-causes.create"
                        />
                    )
                }
            />

            <Table
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={() => fetchData(1, pager.per_page)}
                labels={{
                    searchPlaceholder: t("table.searchPlaceholder"),
                    filter: tc("filter"),
                    apply: tc("apply"),
                    total: tc("total"),
                    limit: tc("limit"),
                    emptyTitle: t(viewMode === "main" ? "table.emptyTitle" : "table.emptyCustomTitle"),
                    emptySubtitle: t(
                        viewMode === "main" ? "table.emptySubtitle" : "table.emptyCustomSubtitle",
                    ),
                }}
                filters={
                    <>
                        {viewMode === "main" ? (
                            <FilterField label={t("filters.status")}>
                                <Select
                                    value={filters.isActive}
                                    onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
                                >
                                    <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                        <SelectValue placeholder={t("filters.status")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{tc("all")}</SelectItem>
                                        <SelectItem value="true">{t("filters.active")}</SelectItem>
                                        <SelectItem value="false">{t("filters.inactive")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FilterField>
                        ) : (
                            <FilterField label={t("filters.reviewStatus")}>
                                <Select
                                    value={filters.reviewStatus}
                                    onValueChange={(v) =>
                                        setFilters((f) => ({ ...f, reviewStatus: v }))
                                    }
                                >
                                    <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                        <SelectValue placeholder={t("filters.reviewStatus")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">{t("status.pending")}</SelectItem>
                                        <SelectItem value="rejected">{t("status.rejected")}</SelectItem>
                                        <SelectItem value="all">{tc("all")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FilterField>
                        )}

                        <FilterField label={t("filters.employee")}>
                            <UserSelect
                                value={filters.employee}
                                onSelect={(user) =>
                                    setFilters((f) => ({
                                        ...f,
                                        employee: user ? String(user.id) : "all",
                                    }))
                                }
                                placeholder={t("filters.employeePlaceholder")}
                                allowAll
                                allLabel={t("filters.all")}
                                className="h-10 rounded-xl border-border bg-background"
                                contentClassName="bg-card-select"
                            />
                        </FilterField>

                        <FilterField label={t("filters.date")}>
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
                                placeholder={t("filters.date")}
                                dataSize="default"
                                maxDate="today"
                            />
                        </FilterField>
                    </>
                }
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                actions={[
                    {
                        key: "export",
                        label: t("actions.export"),
                        icon: exportLoading ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <FileDown size={15} />
                        ),
                        color: "primary",
                        onClick: onExport,
                        disabled: exportLoading,
                        permission: "cancel-causes.read",
                    },
                ]}
                columns={columns}
                data={pager.records}
                isLoading={loading}
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) => fetchData(page, per_page)}
            />

            {formOpen && (
                <CauseFormDialog
                    cause={selected}
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
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

            {reviewOpen && selected && (
                <ReviewCauseDialog
                    cause={selected}
                    mode={reviewMode}
                    open={reviewOpen}
                    onClose={() => setReviewOpen(false)}
                    onSaved={afterMutate}
                />
            )}

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
        </div>
    );
}
