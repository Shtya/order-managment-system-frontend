"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Eye, Edit2, Trash2, Plus, Loader2, Power, PowerOff, Download
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { useExport } from "@/hook/useExport";
import Table, { FilterField } from "@/components/atoms/Table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Button_ from "@/components/atoms/Button";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import ActionButtons from "@/components/atoms/Actions";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { normalizeAxiosError } from "@/utils/axios";

export default function WarehousesTab({ stats: _stats, onStatsChange }) {
    const tc = useTranslations("common");
    const t = useTranslations("warehousesManagement");
    const { handleExport, exportLoading } = useExport();

    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({
        total_records: 0, current_page: 1, per_page: 12,
    });
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ startDate: "", endDate: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    const [selected, setSelected] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const hasActiveFilters = useMemo(() =>
        !!(filters.startDate || filters.endDate), [filters]);

    function resetPager() {
        setPagination(p => ({ ...p, current_page: 1 }));
    }

    const fetchData = useCallback(async (page = 1, limit = 12) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page);
            params.set("limit", limit);
            if (search.trim()) params.set("search", search.trim());
            if (filters.startDate) params.set("startDate", filters.startDate);
            if (filters.endDate) params.set("endDate", filters.endDate);
            

            const res = await api.get(`/warehouses?${params.toString()}`);
            setRecords(res.data.records ?? []);
            setPagination({
                total_records: res.data.total_records ?? 0,
                current_page: res.data.current_page ?? 1,
                per_page: res.data.per_page ?? limit,
            });
        } catch (e) {
            console.error(e);
            toast.error(normalizeAxiosError(e));
        } finally {
            setIsLoading(false);
        }
    }, [search, filters, tc]);

    useEffect(() => { fetchData(pagination.current_page, pagination.per_page); }, [fetchData]);

    const onExport = useCallback(async () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        await handleExport({
            endpoint: "/warehouses/export",
            params,
            filename: `warehouses_${Date.now()}.xlsx`,
        });
    }, [search, handleExport]);

    const handleToggleStatus = useCallback(async (row) => {
        setTogglingId(row.id);
        try {
            await api.post(`/warehouses/${row.id}/toggle-status`);
            toast.success(tc("api.success"));
            fetchData(pagination.current_page, pagination.per_page);
            onStatsChange?.();
        } catch (e) {
            console.error(e);
            toast.error(tc("api.error"));
        } finally {
            setTogglingId(null);
        }
    }, [tc, fetchData, pagination.current_page, pagination.per_page, onStatsChange]);

    const openCreate = useCallback(() => { setSelected(null); setCreateOpen(true); }, []);
    const openEdit = useCallback((row) => { setSelected(row); setEditOpen(true); }, []);
    const openDelete = useCallback((row) => { setSelected(row); setDeleteOpen(true); }, []);

    const afterMutate = useCallback(() => {
        fetchData(pagination.current_page, pagination.per_page);
        onStatsChange?.();
    }, [fetchData, pagination.current_page, pagination.per_page, onStatsChange]);

    const columns = useMemo(() => [
        { key: "name", header: t("columns.name"), cell: (row) => <span className="font-medium">{row.name}</span> },
        { key: "address", header: t("columns.address"), cell: (row) => row.address || tc("notSpecified") },
        { key: "description", header: t("columns.description"), cell: (row) => row.description || tc("notSpecified") },
        {
            key: "isActive", header: t("columns.status"),
            cell: (row) => (
                <Badge variant={row.isActive ? "secondary" : "success"}>
                    {row.isActive ? tc("statusCodes.active") : tc("statusCodes.inactive")}
                </Badge>
            ),
        },
        {
            key: "created_at", header: t("columns.createdAt"),
            cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : tc("notSpecified"),
        },
        {
            key: "actions", header: tc("actions"),
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        {
                            icon: togglingId === row.id ? <Loader2 size={16} className="animate-spin" /> : row.isActive ? <PowerOff size={16} /> : <Power size={16} />,
                            tooltip: row.isActive ? tc("deactivate") : tc("activate"),
                            onClick: () => handleToggleStatus(row),
                            variant: row.isActive ? "orange" : "emerald",
                            permission: "warehouses.update",
                        },
                        { icon: <Edit2 size={16} />, tooltip: tc("edit"), onClick: openEdit, variant: "primary", permission: "warehouses.update" },
                        { icon: <Trash2 size={16} />, tooltip: tc("delete"), onClick: openDelete, variant: "red", permission: "warehouses.delete" },
                    ]}
                />
            ),
        },
    ], [t, tc, openEdit, openDelete, handleToggleStatus, togglingId]);

    return (
        <>
            <Table
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={() => resetPager()}
                labels={{
                    searchPlaceholder: t("searchPlaceholder"),
                    filter: tc("filter"),
                    apply: tc("apply"),
                    total: tc("total"),
                    limit: tc("limit"),
                    emptyTitle: t("emptyTitle"),
                    emptySubtitle: t("emptySubtitle"),
                }}
                actions={[
                    { key: "create", label: t("actions.createWarehouse"), icon: <Plus size={15} />, color: "primary", onClick: openCreate, permission: "warehouses.create" },
                    { key: "export", label: tc("export"), icon: exportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />, color: "primary", onClick: onExport, disabled: exportLoading, permission: "warehouses.read" },
                ]}
                columns={columns}
                data={records}
                isLoading={isLoading}
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={() => resetPager()}
                pagination={pagination}
                onPageChange={({ page, per_page }) => fetchData(page, per_page)}
            />

            {createOpen && (
                <WarehouseFormDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onSuccess={afterMutate}
                />
            )}

            {editOpen && selected && (
                <WarehouseFormDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    warehouse={selected}
                    onSuccess={afterMutate}
                />
            )}

            {deleteOpen && selected && (
                <ConfirmDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={t("actions.deleteWarehouse")}
                    description={t("actions.confirmDelete")}
                    confirmText={tc("delete")}
                    cancelText={tc("cancel")}
                    onConfirm={async () => {
                        try {
                            await api.delete(`/warehouses/${selected.id}`);
                            toast.success(t("messages.deleted"));
                            setDeleteOpen(false);
                            afterMutate();
                        } catch (e) {
                            console.error(e);
                            toast.error(normalizeAxiosError(e));
                        }
                    }}
                />
            )}
        </>
    );
}

const createWarehouseSchema = (t) =>
    yup.object({
        name: yup
            .string()
            .trim()
            .required(t("form.nameRequired")),
        address: yup.string().nullable(),
        description: yup.string().nullable(),
    });

function WarehouseFormDialog({ open, onOpenChange, warehouse, onSuccess }) {
    const tc = useTranslations("common");
    const t = useTranslations("warehousesManagement");
    const isEdit = !!warehouse;

    const schema = useMemo(() => createWarehouseSchema(t), [t]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: warehouse?.name ?? "",
            address: warehouse?.address ?? "",
            description: warehouse?.description ?? "",
        },
    });

    const onSubmit = async (data) => {
        try {
            if (isEdit) {
                await api.patch(`/warehouses/${warehouse.id}`, data);
                toast.success(t("messages.updated"));
            } else {
                await api.post("/warehouses", data);
                toast.success(t("messages.created"));
            }
            onSuccess();
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            toast.error(normalizeAxiosError(e));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg! w-full">
                <DialogHeader>
                    <DialogTitle>{isEdit ? t("actions.editWarehouse") : t("actions.createWarehouse")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("form.name")} <span className="text-red-500">*</span></Label>
                        <Input {...register("name")} placeholder={t("form.namePlaceholder")} className="rounded-xl h-[50px]" />
                        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("form.address")}</Label>
                        <Input {...register("address")} placeholder={t("form.addressPlaceholder")} className="rounded-xl h-[50px]" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("form.description")}</Label>
                        <Textarea {...register("description")} placeholder={t("form.descriptionPlaceholder")} className="rounded-xl min-h-[80px]" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button_ size="sm" label={tc("cancel")} variant="outline" onClick={() => onOpenChange(false)} />
                        <Button_ size="sm" label={tc("save")} variant="solid" type="submit" disabled={isSubmitting} />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
