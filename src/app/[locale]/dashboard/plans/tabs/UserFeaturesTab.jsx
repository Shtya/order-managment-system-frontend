import Table, { FilterField } from "@/components/atoms/Table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Loader2, User } from "lucide-react";
import Flatpickr from "react-flatpickr";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { platformCurrency } from "@/utils/healpers";
import DateRangePicker from "@/components/atoms/DateRangePicker";



function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function UserFeaturesTab() {
    const tf = useTranslations("extraFeatures");
    const t = useTranslations("plans");
    const router = useRouter();

    const [pager, setPager] = useState({ records: [], total_records: 0, current_page: 1, per_page: 12 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
    const [filters, setFilters] = useState({ status: 'all', featureId: 'all', startDate: null, endDate: null });
    const [exportLoading, setExportLoading] = useState(false);
    const [featuresList, setFeaturesList] = useState([]);

    // Fetch feature definitions for the filter dropdown
    useEffect(() => {
        api.get("/extra-features/features").then(res => setFeaturesList(res.data)).catch(console.error);
    }, []);

    const buildParams = (page = pager.current_page, per_page = pager.per_page) => {
        const params = { page, limit: per_page };
        if (search) params.search = search;
        if (filters.status && filters.status !== 'all') params.status = filters.status;
        if (filters.featureId && filters.featureId !== 'all') params.featureId = filters.featureId;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        return params;
    };

    const fetchUserFeatures = async (page = pager.current_page, per_page = pager.per_page) => {
        try {
            setLoading(true);
            const { data } = await api.get("/extra-features", { params: buildParams(page, per_page) });
            setPager({
                total_records: data.total_records || 0,
                current_page: data.current_page || page,
                per_page: data.per_page || per_page,
                records: Array.isArray(data.records) ? data.records : [],
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || tf("messages.fetchFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserFeatures(1, pager.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const applyFilters = () => {
        toast.success(t("messages.filtersApplied"));
        fetchUserFeatures(1, pager.per_page);
    };

    const handleExport = async () => {
        let toastId = toast.loading(t("messages.exportStarted"));
        try {
            setExportLoading(true);
            const response = await api.get("/extra-features/export", { params: buildParams(), responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `user_features_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(t("messages.exportSuccess"), { id: toastId });
        } catch (error) {
            toast.error(t("messages.exportFailed"), { id: toastId });
        } finally {
            setExportLoading(false);
        }
    };
    const { formatCurrency } = usePlatformSettings();
    const columns = useMemo(() => [
        {
            key: "user",
            header: t("columns.user"),
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <User size={14} className="text-muted-foreground" />
                    <div>
                        <span className="text-sm font-medium">{row?.user?.name}</span>
                        <div dir="ltr" className="font-en text-xs text-gray-500">{row.user?.email || ""}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "feature",
            header: tf("columns.featureName"),
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-purple-600">{row.feature?.name || "—"}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.feature?.type}</span>
                </div>
            ),
        },
        {
            key: "price",
            header: tf("columns.paidPrice"),
            cell: (row) => (
                <span className="font-semibold tabular-nums">{formatCurrency(row.priceAtPurchase)}</span>
            ),
        },
        {
            key: "status",
            header: t("columns.status"),
            cell: (row) => {
                const colors = {
                    active: "text-emerald-600 border-emerald-200 bg-emerald-50",
                    pending: "text-amber-600 border-amber-200 bg-amber-50",
                    cancelled: "text-gray-600 border-gray-200 bg-gray-50",
                };
                const color = colors[row.status?.toLowerCase()] || "text-gray-500";
                return <Badge variant="outline" className={cn("text-xs", color)}>{t(`statuses.${row.status?.toLowerCase()}`)}</Badge>;
            },
        },
        {
            key: "createdAt",
            header: tf("columns.purchaseDate"),
            cell: (row) => (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar size={12} /> {formatDate(row.startDate, platformCurrency)}
                </div>
            ),
        }
    ], [t, tf, formatCurrency]);

    return (
        <Table
            searchValue={search}
            onSearchChange={setSearch}
            onSearch={applyFilters}
            labels={{
                searchPlaceholder: t("toolbar.searchPlaceholder"),
                filter: t("toolbar.filter"),
                apply: t("filters.apply"),
                total: t("pagination.total"),
                limit: t("pagination.limit"),
                emptyTitle: t("transactions.emptyTitle"),
            }}
            actions={[
                {
                    key: "export",
                    label: t("toolbar.export"),
                    icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />,
                    color: "blue",
                    onClick: handleExport,
                    disabled: exportLoading,
                },
            ]}
            hasActiveFilters={filters.status !== 'all' || filters.featureId !== 'all' || filters.startDate}
            onApplyFilters={applyFilters}
            filters={
                <>
                    <FilterField label={t("filters.status")}>
                        <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                            <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={t("filters.statusPlaceholder")} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                <SelectItem value="active">{t("statuses.active")}</SelectItem>
                                <SelectItem value="pending">{t("statuses.pending")}</SelectItem>
                                <SelectItem value="cancelled">{t("statuses.cancelled")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>

                    <FilterField label={tf("filters.feature")}>
                        <Select value={filters.featureId} onValueChange={(v) => setFilters(f => ({ ...f, featureId: v }))}>
                            <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={tf("filters.featurePlaceholder")} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                {featuresList.map(f => (
                                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>

                    <FilterField label={t("filters.date")}>
                        <DateRangePicker
                            value={{
                                startDate: filters.startDate,
                                endDate: filters.endDate
                            }}
                            onChange={(newDates) => setFilters(prev => ({
                                ...prev,
                                ...newDates
                            }))}
                            placeholder={t("filters.datePlaceholder")}
                            dataSize="default"
                            maxDate="today"
                        />
                    </FilterField>
                </>
            }
            columns={columns}
            data={pager.records}
            isLoading={loading}
            pagination={{ total_records: pager.total_records, current_page: pager.current_page, per_page: pager.per_page }}
            onPageChange={({ page, per_page }) => fetchUserFeatures(page, per_page)}
        />
    );
}