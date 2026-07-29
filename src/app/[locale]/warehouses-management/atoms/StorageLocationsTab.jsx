"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Eye, Edit2, Trash2, Plus, Loader2, Power, PowerOff, Download
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Button_ from "@/components/atoms/Button";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import ActionButtons from "@/components/atoms/Actions";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { normalizeAxiosError } from "@/utils/axios";
import { useDebounce } from "@/hook/useDebounce";

const LOCATION_TYPES = [
    { value: "zone", labelKey: "domains.warehouses.storage_location_types.zone" },
    { value: "rack", labelKey: "domains.warehouses.storage_location_types.rack" },
    { value: "shelf", labelKey: "domains.warehouses.storage_location_types.shelf" },
    { value: "bin", labelKey: "domains.warehouses.storage_location_types.bin" },
];

const DEFAULT_LOCATION_TYPES = ["bin"];

const PARENT_TYPES_FOR_CHILD = {
    zone: [],
    rack: ["zone"],
    shelf: ["rack"],
    bin: ["shelf"],
};

export default function StorageLocationsTab({ stats: _stats, onStatsChange }) {
    const tc = useTranslations("common");
    const t = useTranslations("warehousesManagement");
    const { handleExport, exportLoading } = useExport();

    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({
        total_records: 0, current_page: 1, per_page: 12,
    });
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ startDate: "", endDate: "", warehouseId: "", type: "" });
    const [appliedFilters, setAppliedFilters] = useState({ startDate: "", endDate: "", warehouseId: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [warehouses, setWarehouses] = useState([]);

    const [selected, setSelected] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const hasActiveFilters = useMemo(() =>
        !!(filters.startDate || filters.endDate || filters.warehouseId || filters.type), [filters]);

    useEffect(() => {
        api.get("/warehouses", { params: { limit: 200 } }).then(res => {
            setWarehouses(res.data.records ?? []);
        }).catch(() => { });
    }, []);

    function onSearch() {
        setPagination(p => ({ ...p, current_page: 1 }));
        setAppliedFilters(filters);
    }

    const fetchData = useCallback(async (page = 1, limit = 12) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page);
            params.set("limit", limit);
            if (search.trim()) params.set("search", search.trim());
            if (appliedFilters.startDate) params.set("startDate", appliedFilters.startDate);
            if (appliedFilters.endDate) params.set("endDate", appliedFilters.endDate);
            if (appliedFilters.warehouseId) params.set("warehouseId", appliedFilters.warehouseId);
            if (appliedFilters.type) params.set("types", appliedFilters.type);


            const res = await api.get(`/warehouses/locations?${params.toString()}`);
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
    }, [search, appliedFilters, tc]);

    useEffect(() => { fetchData(pagination.current_page, pagination.per_page); }, [fetchData]);

    const onExport = useCallback(async () => {
        const params = {};
        if (search.trim()) params.search = search.trim();
        await handleExport({
            endpoint: "/warehouses/locations/export",
            params,
            filename: `storage_locations_${Date.now()}.xlsx`,
        });
    }, [search, handleExport]);

    const openCreate = useCallback(() => { setSelected(null); setDialogOpen(true); }, []);
    const openEdit = useCallback((row) => { setSelected(row); setDialogOpen(true); }, []);
    const openDelete = useCallback((row) => { setSelected(row); setDeleteOpen(true); }, []);

    const handleToggleStatus = useCallback(async (row) => {
        setTogglingId(row.id);
        try {
            const whId = row.warehouseId || row.warehouse?.id;
            await api.post(`/warehouses/${whId}/locations/${row.id}/toggle-status`);
            toast.success(tc("api.success"));
            fetchData(pagination.current_page, pagination.per_page);
            onStatsChange?.();
        } catch (e) {
            console.error(e);
            toast.error(normalizeAxiosError(e));
        } finally {
            setTogglingId(null);
        }
    }, [tc, fetchData, pagination.current_page, pagination.per_page, onStatsChange]);

    const afterMutate = useCallback(() => {
        fetchData(pagination.current_page, pagination.per_page);
        onStatsChange?.();
    }, [fetchData, pagination.current_page, pagination.per_page, onStatsChange]);

    const columns = useMemo(() => [
        { key: "name", header: t("columns.name"), cell: (row) => <span className="font-medium">{row.name}</span> },
        {
            key: "type", header: t("columns.type"),
            cell: (row) => (
                <Badge variant="secondary">
                    {t(`storage_location_types.${row.type}`) || row.type}
                </Badge>
            ),
        },
        {
            key: "parent", header: t("columns.parent"),
            cell: (row) => row.parent?.name || tc("notSpecified"),
        },
        {
            key: "warehouse", header: t("columns.warehouse") || "Warehouse",
            cell: (row) => row.warehouse?.name || tc("notSpecified"),
        },
        {
            key: "isActive", header: t("columns.status"),
            cell: (row) => (
                <Badge variant={row.isActive ? "secondary" : "success"}>
                    {row.isActive ? tc("statusCodes.active") : tc("statusCodes.inactive")}
                </Badge>
            ),
        },
        { key: "description", header: t("columns.description"), cell: (row) => row.description || tc("notSpecified") },
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
                            permission: "warehouses.locations.update",
                        },
                        { icon: <Edit2 size={16} />, tooltip: tc("edit"), onClick: openEdit, variant: "primary", permission: "warehouses.locations.update" },
                        { icon: <Trash2 size={16} />, tooltip: tc("delete"), onClick: openDelete, variant: "red", permission: "warehouses.locations.delete" },
                    ]}
                />
            ),
        },
    ], [t, tc, openEdit, openDelete, handleToggleStatus, togglingId]);

    const typeDisplayName = (type) => {
        const map = { zone: t("tabs.zones"), rack: t("stats.racks"), shelf: t("stats.shelves"), bin: t("stats.bins") };
        return map[type] || type;
    };

    return (
        <>
            <Table
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={onSearch}
                labels={{
                    searchPlaceholder: t("locationSearchPlaceholder"),
                    filter: tc("filter"),
                    apply: tc("apply"),
                    total: tc("total"),
                    limit: tc("limit"),
                    emptyTitle: t("locationEmptyTitle"),
                    emptySubtitle: t("locationEmptySubtitle"),
                }}
                filters={
                    <>
                        <FilterField label={tc("date")}>
                            <DateRangePicker
                                value={{ startDate: filters.startDate, endDate: filters.endDate }}
                                onChange={(v) => setFilters(f => ({ ...f, ...v }))}
                                placeholder={tc("date")}
                                dataSize="default"
                                maxDate="today"
                            />
                        </FilterField>
                        <FilterField label={t("columns.warehouse") || "Warehouse"}>
                            <Select value={filters.warehouseId || "all"} onValueChange={(v) => setFilters(f => ({ ...f, warehouseId: v === "all" ? "" : v }))}>
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder={t("form.allWarehouses") || "All warehouses"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tc("all")}</SelectItem>
                                    {warehouses.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={t("form.type")}>
                            <Select value={filters.type || "all"} onValueChange={(v) => setFilters(f => ({ ...f, type: v === "all" ? "" : v }))}>
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tc("all")}</SelectItem>
                                    {LOCATION_TYPES.map(lt => (
                                        <SelectItem key={lt.value} value={lt.value}>{typeDisplayName(lt.value)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </>
                }
                actions={[
                    { key: "create", label: t("actions.createLocation"), icon: <Plus size={15} />, color: "primary", onClick: openCreate, permission: "warehouses.locations.create" },
                    { key: "export", label: tc("export"), icon: exportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />, color: "primary", onClick: onExport, disabled: exportLoading, permission: "warehouses.locations.read" },
                ]}
                columns={columns}
                data={records}
                isLoading={isLoading}
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={() => {
                    setPagination(p => ({ ...p, current_page: 1 }));
                    setAppliedFilters(filters);
                }}
                pagination={pagination}
                onPageChange={({ page, per_page }) => fetchData(page, per_page)}
            />

            {dialogOpen && (
                <StorageLocationFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    location={selected}
                    onSuccess={afterMutate}
                />
            )}

            {deleteOpen && selected && (
                <ConfirmDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={t("actions.deleteLocation")}
                    description={t("actions.confirmDeleteLocation")}
                    confirmText={tc("delete")}
                    cancelText={tc("cancel")}
                    onConfirm={async () => {
                        try {
                            const whId = selected.warehouseId || selected.warehouse?.id;
                            await api.delete(`/warehouses/${whId}/locations/${selected.id}`);
                            toast.success(t("messages.locationDeleted"));
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

const createStorageLocationSchema = (t) =>
    yup.object({
        name: yup
            .string()
            .trim()
            .required(t("form.nameRequired")),
        type: yup.string().required(t("form.typeRequired")),
        warehouseId: yup.string().required(t("form.warehouseRequired")),
        parentId: yup.string().nullable(),
        description: yup.string().nullable(),
    });

export function StorageLocationSelect({
    value,
    onChange,
    warehouseId,
    types = DEFAULT_LOCATION_TYPES,
    placeholder = "",
    showNoneOption = false,
    noneLabel,
    disabled = false,
}) {

    const tc = useTranslations("common");
    const t = useTranslations("warehousesManagement");
    const finalPlacehodler = placeholder || t("chooseLocation")
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const { debouncedValue } = useDebounce({ value: search })
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const inputRef = useRef(null);

    const fetchItems = useCallback(async (pageNum, search, append) => {
        if (!warehouseId || !types?.length) return;
        setLoading(true);
        try {
            const res = await api.get("/warehouses/locations", {
                params: { warehouseId, types: types.join(","), search: search || undefined, limit: 50, page: pageNum, isActive: "true", id: value || undefined },
            });
            const records = res.data.records ?? [];
            setItems(prev => append ? [...prev, ...records] : records);
            setHasMore(records.length === 50);
        } catch {
            if (!append) setItems([]);
        } finally {
            setLoading(false);
        }
    }, [warehouseId, types, value]);

    useEffect(() => {

        setPage(1);
        fetchItems(1, debouncedValue, false);

    }, [debouncedValue, fetchItems]);

    useEffect(() => {
        if (!open && value && warehouseId && types?.length) {
            const alreadyInList = items.find(p => String(p.id) === String(value));
            if (!alreadyInList) {
                api.get("/warehouses/locations", {
                    params: { warehouseId, types: types.join(","), id: value, limit: 1, isActive: "true" },
                }).then(res => {
                    const found = res.data.records?.[0];
                    if (found) {
                        setSelectedItem(found);
                        setItems(prev => prev.some(p => String(p.id) === String(found.id)) ? prev : [found, ...prev]);
                    }
                }).catch(() => { });
            } else {
                setSelectedItem(alreadyInList);
            }
        }
    }, [open, value, items, warehouseId, types]);
    if (disabled) {
        const name = selectedItem?.name || "";
        return (
            <div className="space-y-2">
                {/* <Label className="text-sm font-semibold">
                    {t("form.parentId")} { t.has("storage_location_types." + types[0]) ?"(" + t("storage_location_types." + types[0]) + ")" : ""}
                </Label> */}
                <Input value={name || tc("notSpecified")} disabled className="rounded-xl h-[50px]" />
            </div>
        );
    }

    return (
        <Select value={value ?? ""} onValueChange={(v) => {
            if (!v) return;
            
            onChange?.(v === 'none' ? null : v);
        }} open={open} onOpenChange={setOpen}>
            <SelectTrigger className="h-[50px] rounded-xl" >
                <SelectValue placeholder={finalPlacehodler} />
            </SelectTrigger>
            <SelectContent>
                <div className="px-2 py-2 sticky top-0 bg-background z-10 border-b border-border">
                    <input
                        type="text"
                        ref={inputRef}
                        placeholder={t("search")}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-1 rtl:text-end text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>

                {showNoneOption && <SelectItem value="none">{noneLabel || tc("none")}</SelectItem>}

                {items.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}

                {loading && (
                    <div className="py-4 text-center text-sm text-muted-foreground">{tc("loading")}</div>
                )}

                {!loading && hasMore && items.length > 0 && (
                    <button
                        type="button"
                        className="w-full py-2 text-center text-sm text-primary hover:bg-muted/60 rounded-md"
                        onClick={(e) => {
                            e.preventDefault();
                            const nextPage = page + 1;
                            setPage(nextPage);
                            fetchItems(nextPage, debouncedValue, true);
                        }}
                    >
                        {tc("loadMore")}
                    </button>
                )}

                {!loading && !hasMore && items.length === 0 && (
                    <div className="py-4 text-center text-sm text-muted-foreground">{tc("noResults")}</div>
                )}
            </SelectContent>
        </Select>
    );
}

function StorageLocationFormDialog({ open, onOpenChange, location, onSuccess }) {
    const tc = useTranslations("common");
    const t = useTranslations("warehousesManagement");
    const isEdit = !!location;

    const schema = useMemo(() => createStorageLocationSchema(t), [t]);

    const [warehouses, setWarehouses] = useState([]);

    const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: location?.name ?? "",
            type: location?.type ?? "",
            warehouseId: location?.warehouseId || location?.warehouse?.id || "",
            parentId: location?.parentId ?? null,
            description: location?.description ?? "",
        },
    });

    const selectedType = watch("type");
    const selectedWarehouseId = watch("warehouseId");

    useEffect(() => {
        if (selectedType) setValue("parentId", null);
    }, [selectedType]);

    useEffect(() => {
        api.get("/warehouses", { params: { limit: 100, isActive: "true" } }).then(res => {
            setWarehouses(res.data.records ?? []);
        }).catch(() => { });
    }, []);

    const warehouseId = location?.warehouseId || location?.warehouse?.id;

    const typeDisplayName = (type) => {
        const map = { zone: t("stats.zones"), rack: t("stats.racks"), shelf: t("stats.shelves"), bin: t("stats.bins") };
        return map[type] || type;
    };

    const onSubmit = async (data) => {
        try {
            const whId = warehouseId || data.warehouseId;
            if (isEdit) {
                const payload = { name: data.name, description: data.description || null };
                await api.patch(`/warehouses/${whId}/locations/${location.id}`, payload);
                toast.success(t("messages.locationUpdated"));
            } else {
                const payload = {
                    name: data.name,
                    type: data.type,
                    parentId: data.parentId || null,
                    description: data.description || null,
                };
                await api.post(`/warehouses/${whId}/locations`, payload);
                toast.success(t("messages.locationCreated"));
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
                    <DialogTitle>{isEdit ? t("actions.editLocation") : t("actions.createLocation")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("form.name")} <span className="text-red-500">*</span></Label>
                        <Input {...register("name")} placeholder={t("form.nameLocationPlaceholder")} className="rounded-xl h-[50px]" />
                        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("columns.warehouse") || "Warehouse"} {!isEdit && <span className="text-red-500">*</span>}</Label>
                        {isEdit ? (
                            <Input value={warehouses.find(w => w.id === warehouseId)?.name || warehouseId} disabled className="rounded-xl h-[50px]" />
                        ) : (
                            <Controller
                                control={control}
                                name="warehouseId"
                                render={({ field }) => (
                                    <Select value={field.value || ""} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-[50px] rounded-xl">
                                            <SelectValue placeholder={t("form.selectWarehouse") || "Select warehouse"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        )}
                        {errors.warehouseId && <p className="text-xs text-red-600">{errors.warehouseId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("form.type")} {!isEdit && <span className="text-red-500">*</span>}</Label>
                        {isEdit ? (
                            <Input value={typeDisplayName(location?.type)} disabled className="rounded-xl h-[50px]" />
                        ) : (
                            <Controller
                                control={control}
                                name="type"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-[50px] rounded-xl">
                                            <SelectValue placeholder={t("form.selectType") || "Select type"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LOCATION_TYPES.map(lt => (
                                                <SelectItem key={lt.value} value={lt.value}>{typeDisplayName(lt.value)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        )}
                        {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
                    </div>

                    {selectedType && PARENT_TYPES_FOR_CHILD[selectedType] && (
                        isEdit ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t("form.parentId")}
                                    {t.has("storage_location_types." + PARENT_TYPES_FOR_CHILD[selectedType]?.[0]) ? "(" + t("storage_location_types." + PARENT_TYPES_FOR_CHILD[selectedType]?.[0]) + ")" : ""}
                                </Label>
                                <StorageLocationSelect
                                    value={location?.parentId}
                                    warehouseId={warehouseId || selectedWarehouseId}
                                    types={PARENT_TYPES_FOR_CHILD[selectedType]}
                                    disabled
                                    t={t}
                                    tc={tc}
                                />
                            </div>
                        ) : PARENT_TYPES_FOR_CHILD[selectedType]?.length > 0 ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t("form.parentId")}
                                    {t.has("storage_location_types." + PARENT_TYPES_FOR_CHILD[selectedType]?.[0]) ? "(" + t("storage_location_types." + PARENT_TYPES_FOR_CHILD[selectedType]?.[0]) + ")" : ""}

                                </Label>
                                <Controller
                                    control={control}
                                    name="parentId"
                                    render={({ field }) => (
                                        <StorageLocationSelect
                                            value={field.value}
                                            disabled={!(warehouseId || selectedWarehouseId)}
                                            onChange={field.onChange}
                                            warehouseId={warehouseId || selectedWarehouseId}
                                            types={[PARENT_TYPES_FOR_CHILD[selectedType]]}
                                            showNoneOption
                                            noneLabel={t("form.noParent")}
                                            t={t}
                                            tc={tc}
                                        />
                                    )}
                                />
                            </div>
                        ) : null
                    )}

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

