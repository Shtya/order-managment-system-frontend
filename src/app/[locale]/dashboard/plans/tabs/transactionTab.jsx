
import Table, { FilterField } from "@/components/atoms/Table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar, CreditCard, Download, Loader2, User } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { avatarSrc } from "@/components/atoms/UserSelect";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { Badge } from "@/components/ui/badge";

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "—";
    return Number(amount).toLocaleString("ar-EG");
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
export const TransactionStatus = Object.freeze({
    ACTIVE: 'active',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
});

export default function TransactionTab() {
    const t = useTranslations("plans")
    const router = useRouter()

    const [pager, setPager] = useState({ records: [], total_records: 0, current_page: 1, per_page: 12 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const { debouncedValue: debouncedSearch } = useDebounce({ value: search })
    const [filters, setFilters] = useState({ status: 'all', startDate: null, endDate: null });

    const [exportLoading, setExportLoading] = useState()
    // ── Build API params ────────────────────────────────────────────────
    const buildParams = (page = pager.current_page, per_page = pager.per_page) => {
        const params = { page, limit: per_page };

        if (search) params.search = search;
        if (filters.status && filters.status !== 'all') params.status = filters.status;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        return params;
    };

    // ── Fetch transactions ───────────────────────────────────────────────
    const fetchTransactions = async (page = pager.current_page, per_page = pager.per_page) => {
        try {
            setLoading(true);
            const params = buildParams(page, per_page);
            const { data } = await api.get("/transactions", { params });

            setPager({
                total_records: data.total_records || 0,
                current_page: data.current_page || page,
                per_page: data.per_page || per_page,
                records: Array.isArray(data.records) ? data.records : [],
            });
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error(error?.response?.data?.message || t("messages.errorFetchingTransactions"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions(1, pager.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    // ── Apply filters ────────────────────────────────────────────────────
    const applyFilters = () => {
        toast.success(t("messages.filtersApplied"));
        fetchTransactions(1, pager.per_page);
    };

    // ── Handle pagination ────────────────────────────────────────────────
    const handlePageChange = ({ page, per_page }) => {
        fetchTransactions(page, per_page);
    };

    // ── Export transactions ─────────────────────────────────────────────
    const handleExport = async () => {
        let toastId;
        try {
            setExportLoading(true);
            toastId = toast.loading(t("messages.exportStarted"));

            const params = {};
            if (search) params.search = search;
            if (filters.status && filters.status !== 'all') params.status = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await api.get("/transactions/export", {
                params,
                responseType: "blob",
            });

            const contentDisposition = response.headers["content-disposition"];
            let filename = `transactions_export_${Date.now()}.xlsx`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";]+)"?/);
                if (match && match[1]) filename = match[1];
            }

            const url = window.URL.createObjectURL(
                new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
            );
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success(t("messages.exportSuccess"), { id: toastId });
        } catch (error) {
            toast.dismiss();
            toast.error(error?.response?.data?.message || t("messages.exportFailed"), { id: toastId });
        } finally {
            setExportLoading(false);
        }
    };


    const columns = useMemo(() => {
        return [{
            key: "id",
            header: t("columns.transactionId"),
            cell: (row) => (
                <span className="font-mono text-sm text-primary font-bold">{row.number}</span>
            ),
        },
        {
            key: "user",
            header: t("columns.user"),
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <User size={14} className="text-muted-foreground" />
                    <div>

                        <span className="text-sm font-medium">{row?.user?.name}</span>
                        <div dir="ltr" className="font-en text-xs text-gray-500 dark:text-slate-400">
                            {row.user.email || ""}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "subscription",
            header: t("columns.subscription"),
            cell: (row) => (
                <span className="text-sm font-medium">{row.subscription?.plan?.name}</span>
            ),
        },
        {
            key: "amount",
            header: t("columns.amount"),
            cell: (row) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatCurrency(row.amount)}
                </span>
            ),
        },
        {
            key: "status",
            header: t("columns.status"),
            cell: (row) => {
                let color = "gray";
                if (row.status === "active") color = "green";
                if (row.status === "processing") color = "yellow";
                if (row.status === "completed") color = "blue";
                if (row.status === "cancelled") color = "red";

                return (
                    <Badge variant="outline" className={`text-xs text-${color}-600`}>
                        {t(`statuses.${row.status}`)}
                    </Badge>
                );
            },
        },
        {
            key: "paymentMethod",
            header: t("columns.paymentMethod"),
            cell: (row) => (
                <div className="flex items-center gap-1">
                    {row.paymentMethod && <CreditCard size={12} className="text-muted-foreground" />}
                    <span className="text-sm">
                        {row.paymentMethod
                            ? t(`paymentMethods.${row.paymentMethod}`).trim()
                            : "—"}
                    </span>
                </div>
            ),
        },
        {
            key: "paymentProof",
            header: t("columns.paymentProof"),
            cell: (row) => (
                row.paymentProof ? (
                    <a href={avatarSrc(row.paymentProof)} target="_blank" className="text-blue-600 underline text-sm">
                        {t("actions.view")}
                    </a>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )
            ),
        },
        {
            key: "createdAt",
            header: t("columns.createdAt"),
            cell: (row) => (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar size={12} />
                    {formatDate(row.createdAt)}
                </div>
            ),
        },
        {
            key: "updatedAt",
            header: t("columns.lastUpdate"),
            cell: (row) => (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar size={12} />
                    {formatDate(row.updatedAt)}
                </div>
            ),
        }
        ];
    }, [t, router]);

    return (
        <Table
            // ── Search ─────────────────────────────────────────────────────────────
            searchValue={search}
            onSearchChange={setSearch}
            onSearch={applyFilters}

            // ── i18n labels ───────────────────────────────────────────────────────
            labels={{
                searchPlaceholder: t("toolbar.searchPlaceholder"),
                filter: t("toolbar.filter"),
                apply: t("filters.apply"),
                total: t("pagination.total"),
                limit: t("pagination.limit"),
                emptyTitle: t("transactions.emptyTitle"),
                emptySubtitle: t("transactions.emptySubtitle"),
                preview: t("image.preview"),
            }}

            // ── Actions ───────────────────────────────────────────────────────────
            actions={[
                {
                    key: "export",
                    label: t("toolbar.export"),
                    icon: exportLoading
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Download size={14} />,
                    color: "blue",
                    onClick: handleExport,
                    disabled: exportLoading,
                },
            ]}

            // ── Filters ───────────────────────────────────────────────────────────
            hasActiveFilters={filters.status || filters.startDate || filters.endDate}
            onApplyFilters={applyFilters}
            filters={
                <>
                    {/* Transaction Status */}
                    <FilterField label={t("filters.status")}>
                        <Select
                            value={filters.status}
                            onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}
                        >
                            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm transition-all">
                                <SelectValue placeholder={t("filters.statusPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                <SelectItem value={TransactionStatus.ACTIVE}>{t("statuses.active")}</SelectItem>
                                <SelectItem value={TransactionStatus.PROCESSING}>{t("statuses.processing")}</SelectItem>
                                <SelectItem value={TransactionStatus.COMPLETED}>{t("statuses.completed")}</SelectItem>
                                <SelectItem value={TransactionStatus.CANCELLED}>{t("statuses.cancelled")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>

                    {/* Date Range */}
                    <FilterField label={t("filters.date")}>
                        <Flatpickr
                            value={[
                                filters.startDate ? new Date(filters.startDate) : null,
                                filters.endDate ? new Date(filters.endDate) : null,
                            ]}
                            onChange={([start, end]) =>
                                setFilters(f => ({
                                    ...f,
                                    startDate: start ? start.toISOString().split("T")[0] : null,
                                    endDate: end ? end.toISOString().split("T")[0] : null,
                                }))
                            }
                            options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
                            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm
            text-foreground focus:outline-none focus:border-[var(--primary)] transition-all"
                            placeholder={t("filters.datePlaceholder")}
                        />
                    </FilterField>
                </>
            }

            // ── Table ─────────────────────────────────────────────────────────────
            columns={columns}
            data={pager.records}
            isLoading={loading}

            // ── Pagination ────────────────────────────────────────────────────────
            pagination={{
                total_records: pager.total_records,
                current_page: pager.current_page,
                per_page: pager.per_page,
            }}
            onPageChange={handlePageChange}
        />
    );
}