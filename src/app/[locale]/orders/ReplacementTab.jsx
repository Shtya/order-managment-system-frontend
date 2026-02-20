"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    X,
    Download,
    Filter,
    Eye,
    Phone,
    Calendar,
    ChevronDown,
    ChevronUp,
    Package,
    ArrowLeftRight,
    Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { motion as m } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import DataTable from "@/components/atoms/DataTable";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import BarcodeCell from "@/components/atoms/BarcodeCell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Button_ from "@/components/atoms/Button";
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function hexToBg(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r
        ? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},0.12)`
        : "transparent";
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatCurrency(amount, currency = "") {
    if (amount === undefined || amount === null) return "—";
    const n = Number(amount);
    return `${n.toLocaleString("ar-EG")}${currency ? ` ${currency}` : ""}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Replacement Toolbar (slim: search + filter toggle + export only)
// ─────────────────────────────────────────────────────────────────────────────
function ReplacementToolbar({
    searchValue,
    onSearchChange,
    onSearch,
    isFiltersOpen,
    onToggleFilters,
    onExport,
    exportLoading,
    t,
}) {
    const handleKeyDown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); onSearch?.(); }
    };

    return (
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-border/40">
            {/* Search */}
            <div className="relative w-full min-w-[260px] max-w-[420px] focus-within:w-full md:focus-within:w-[350px] transition-all duration-300">
                <Input
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("replacement.searchPlaceholder")}
                    className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                />
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">

                <Button
                    variant="outline"
                    className={cn(
                        "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 px-4 rounded-full",
                        isFiltersOpen && "border-primary/50"
                    )}
                    onClick={onToggleFilters}
                >
                    <Filter size={18} />
                    {t("toolbar.filter")}
                </Button>

                <Button
                    variant="outline"
                    className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-100 flex items-center gap-2 px-4 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    onClick={onExport}
                >
                    {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {t("toolbar.export")}
                </Button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Replacement Filters Panel (dates only + static reason filter)
// ─────────────────────────────────────────────────────────────────────────────
function ReplacementFiltersPanel({ value, onChange, onApply, statuses, t }) {
    const REASONS = [
        { value: "all", label: t("replacement.filters.allReasons") },
        { value: "wrong_size", label: t("replacement.filters.wrongSize") },
        { value: "damaged", label: t("replacement.filters.damaged") },
        { value: "wrong_item", label: t("replacement.filters.wrongItem") },
        { value: "other", label: t("replacement.filters.other") },
    ];

    return (
        <motion.div
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
        >
            <div className="px-5 py-4 border-b border-border/40 bg-[var(--secondary)]/40">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                    {/* Date range */}

                    <div className="space-y-2">
                        <Label>{t("filters.status")}</Label>
                        <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
                            <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                                <SelectValue placeholder={t("filters.statusPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent className="bg-card-select">
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                {Array.isArray(statuses) && statuses.length > 0 ? (
                                    statuses.map(s => (
                                        <SelectItem key={s.code || s.id} value={s.code || String(s.id)}>
                                            {s.system ? t(`statuses.${s.code}`) : (s.name || s.code)}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <>
                                        <SelectItem value="new">{t("statuses.new")}</SelectItem>
                                        <SelectItem value="confirmed">{t("statuses.confirmed")}</SelectItem>
                                        <SelectItem value="pending_confirmation">{t("statuses.pendingConfirmation")}</SelectItem>
                                        <SelectItem value="cancelled_shipping">{t("statuses.cancelledShipping")}</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>   {t("filters.date")}</Label>
                        <Flatpickr
                            value={[
                                value.startDate ? new Date(value.startDate) : null,
                                value.endDate ? new Date(value.endDate) : null,
                            ]}
                            onChange={([start, end]) => {
                                onChange({
                                    ...value,
                                    startDate: start ? start.toISOString().split("T")[0] : null,
                                    endDate: end ? end.toISOString().split("T")[0] : null,
                                });
                            }}
                            options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
                            className="w-full rounded-full h-[45px] px-4 bg-[#fafafa] dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
                            placeholder={t("filters.datePlaceholder")}
                        />
                    </div>

                    {/* Apply */}
                    <div className="flex md:justify-start col-span-1 md:col-span-4">
                        <Button_
                            onClick={onApply}
                            size="sm"
                            label={t("filters.apply")}
                            tone="purple"
                            variant="solid"
                            icon={<Filter size={18} />}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge (uses API color)
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status, t }) {
    if (!status) return <span className="text-muted-foreground text-xs">—</span>;
    return (
        <Badge
            className="rounded-lg px-2.5 py-1 text-xs font-semibold border"
            style={{
                backgroundColor: hexToBg(status.color),
                color: status.color,
                borderColor: `${status.color}44`,
            }}
        >
            {status.system ? t(`statuses.${status.code}`) : status.name}
        </Badge>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Replaced products mini list
// ─────────────────────────────────────────────────────────────────────────────
function ReplacedProductsList({ items }) {
    if (!items?.length) return <span className="text-muted-foreground text-xs">—</span>;
    console.log(items)
    return (
        <div className="space-y-1">
            {items.map((item, i) => {
                const oldName = item.originalOrderItem?.variant?.product?.name ?? "—";
                const newName = item.newVariant?.product?.name ?? "—";
                return (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground line-through">{oldName}</span>
                        <ArrowLeftRight size={10} className="text-[var(--primary)] shrink-0" />
                        <span className="text-foreground font-medium">{newName}</span>
                        {item.quantityToReplace > 1 && (
                            <span className="text-muted-foreground">(×{item.quantityToReplace})</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost difference cell
// ─────────────────────────────────────────────────────────────────────────────
function CostDiff({ oldPrice, newPrice, t }) {
    const diff = Number(newPrice ?? 0) - Number(oldPrice ?? 0);
    if (diff === 0) return <span className="text-muted-foreground text-xs">—</span>;
    return (
        <span className={cn(
            "text-sm font-bold font-mono",
            diff > 0 ? "text-red-500" : "text-emerald-600"
        )}>
            {diff > 0 ? "+" : ""}{formatCurrency(diff)}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: ReplacementTab
// ─────────────────────────────────────────────────────────────────────────────
export function ReplacementTab({ statuses }) {
    const t = useTranslations("orders");
    const router = useRouter();

    // ── State ──
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pager, setPager] = useState({
        total_records: 0, current_page: 1, per_page: 12, records: [],
    });
    const [filters, setFilters] = useState({
        startDate: null,
        status: "all",
        endDate: null,
        reason: "all",
    });

    const searchTimer = useRef(null);

    // ── Debounce search ──
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    // ── Fetch on search / filter change ──
    useEffect(() => {
        fetchReplacements(1, pager.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    // ── Build params ──
    const buildParams = useCallback(
        (page = pager.current_page, per_page = pager.per_page) => {
            const params = { page, limit: per_page };
            if (filters.status && filters.status !== 'all') params.status = filters.status;
            if (debouncedSearch) params.search = debouncedSearch;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.reason && filters.reason !== "all") params.reason = filters.reason;
            return params;
        },
        [debouncedSearch, filters, pager.current_page, pager.per_page]
    );

    // ── API: list ──
    const fetchReplacements = useCallback(
        async (page = pager.current_page, per_page = pager.per_page) => {
            try {
                setLoading(true);
                const res = await api.get("/order-replacements/list", { params: buildParams(page, per_page) });
                const data = res.data ?? {};
                setPager({
                    total_records: data.total_records ?? 0,
                    current_page: data.current_page ?? page,
                    per_page: data.per_page ?? per_page,
                    records: Array.isArray(data.records) ? data.records : [],
                });
                setRecords(Array.isArray(data.records) ? data.records : []);
            } catch (e) {
                console.error(e);
                toast.error(t("replacement.errors.fetchFailed"));
            } finally {
                setLoading(false);
            }
        },
        [buildParams, t]
    );

    // ── API: export ──
    const handleExport = useCallback(async () => {
        let toastId;
        try {
            setExportLoading(true);
            const toastId = toast.loading(t("messages.exportStarted"));
            const params = buildParams();
            delete params.page;
            delete params.limit;

            const response = await api.get("/order-replacements/export", {
                params,
                responseType: "blob",
            });

            // Parse filename from Content-Disposition header
            const contentDisposition = response.headers['content-disposition'];
            let filename = `Replacement_orders_export_${Date.now()}.xlsx`;

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }));

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(t("messages.exportSuccess"), {
                id: toastId
            });
        } catch (e) {
            toast.dismiss();
            toast.error(e?.response?.data?.message || t("messages.exportFailed"), {
                id: toastId
            });
        } finally {
            setExportLoading(false);
        }
    }, [buildParams, t]);

    // ── Apply filters ──
    const applyFilters = useCallback(() => {
        fetchReplacements(1, pager.per_page);
    }, [fetchReplacements, pager.per_page]);

    // ── Columns ──
    const columns = useMemo(() => [
        // 1. رقم طلب الاستبدال
        {
            key: "replacementOrderNumber",
            header: t("replacement.columns.replacementOrderNumber"),
            cell: (row) => (
                <span className="text-[var(--primary)] font-bold font-mono text-sm">
                    {row.replacementOrder?.orderNumber ?? "—"}
                </span>
            ),
        },

        // 2. رقم الطلب الأصلي
        {
            key: "originalOrderNumber",
            header: t("replacement.columns.originalOrderNumber"),
            cell: (row) => (
                <span className="font-mono text-sm font-semibold text-foreground">
                    {row.originalOrder?.orderNumber ?? "—"}
                </span>
            ),
        },

        // 3. باركود طلب الاستبدال
        {
            key: "barcode",
            header: t("replacement.columns.barcode"),
            cell: (row) => (
                row.replacementOrder?.orderNumber
                    ? <BarcodeCell value={row.replacementOrder.orderNumber} />
                    : <span className="text-muted-foreground text-xs">—</span>
            ),
        },

        // 4. اسم العميل
        {
            key: "customerName",
            header: t("replacement.columns.customerName"),
            cell: (row) => (
                <span className="font-semibold text-foreground text-sm">
                    {row.replacementOrder?.customerName ?? "—"}
                </span>
            ),
        },

        // 5. رقم الهاتف
        {
            key: "phoneNumber",
            header: t("replacement.columns.phoneNumber"),
            cell: (row) => (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone size={12} />
                    {row.replacementOrder?.phoneNumber ?? "—"}
                </div>
            ),
        },

        // 6. المنتجات المستبدلة
        {
            key: "replacedProducts",
            header: t("replacement.columns.replacedProducts"),
            cell: (row) => <ReplacedProductsList items={row.items} />,
        },

        // 7. حالة طلب الاستبدال
        {
            key: "status",
            header: t("replacement.columns.status"),
            cell: (row) => (
                <StatusBadge status={row.replacementOrder?.status} t={t} />
            ),
        },

        // 8. سبب الاستبدال
        {
            key: "reason",
            header: t("replacement.columns.reason"),
            cell: (row) => (
                <div className="space-y-0.5 max-w-[160px]">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{row.reason ?? "—"}</p>
                    {row.anotherReason && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{row.anotherReason}</p>
                    )}
                </div>
            ),
        },

        // 9. فرق التكلفة
        // {
        //     key: "costDiff",
        //     header: t("replacement.columns.costDiff"),
        //     cell: (row) => {
        //         const diff = row.totalNewPrice - row.totalOldPrice;
        //         const isCustomerPaying = diff > 0;
        //         const isRefund = diff < 0;

        //         return (
        //             <div className="space-y-1.5 text-xs min-w-[120px]">
        //                 {/* Difference Badge */}
        //                 <div className="flex items-center gap-1.5">
        //                     {diff === 0 ? (
        //                         <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
        //                             {t("replacement.noDifference")}
        //                         </span>
        //                     ) : (
        //                         <span className={[
        //                             "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1",
        //                             isCustomerPaying
        //                                 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        //                                 : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        //                         ].join(" ")}>
        //                             {isCustomerPaying ? t("replacement.toPay") : t("replacement.toRefund")}
        //                             <span>{formatCurrency(Math.abs(diff))}</span>
        //                         </span>
        //                     )}
        //                 </div>

        //                 {/* Flow Breakdown */}
        //                 <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/30 p-1 rounded">
        //                     <div className="flex flex-col border-e border-divider pe-2">
        //                         <span className="opacity-60">{t("replacement.oldPrice")}</span>
        //                         <span className="line-through">{formatCurrency(row.totalOldPrice)}</span>
        //                     </div>
        //                     <div className="flex flex-col ps-1">
        //                         <span className="opacity-60">{t("replacement.newPrice")}</span>
        //                         <span className="font-bold text-foreground">{formatCurrency(row.totalNewPrice)}</span>
        //                     </div>
        //                 </div>
        //             </div>
        //         );
        //     },
        // },
        {
            key: "costDiff",
            header: t("replacement.columns.costDiff"),
            cell: (row) => {
                const diff = row.replacementOrder.finalTotal - (row.originalOrder.finalTotal - row.originalOrder.shippingCost);
                const isCustomerPaying = diff > 0;
                const isRefund = diff < 0;

                return (
                    <div className="space-y-1.5 text-xs min-w-[120px]">
                        {/* Difference Badge */}
                        <div className="flex items-center gap-1.5">
                            {diff === 0 ? (
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                                    {t("replacement.noDifference")}
                                </span>
                            ) : (
                                <span className={[
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1",
                                    isCustomerPaying
                                        ? "text-gray-400 bg-gray-100"
                                        : "text-gray-400 bg-gray-100"
                                ].join(" ")}>
                                    <span>{formatCurrency(Math.abs(diff))}</span>
                                    {isCustomerPaying ? null : '-'}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },

        // 10. آخر تحديث
        {
            key: "updated_at",
            header: t("table.lastUpdate"),
            cell: (row) => (
                <span className="text-xs text-muted-foreground">
                    {formatDate(row.replacementOrder?.updated_at)}
                </span>
            ),
        },

        // 11. تاريخ الطلب
        {
            key: "createdAt",
            header: t("table.createdat"),
            cell: (row) => (
                <span className="text-xs text-muted-foreground">
                    {formatDate(row.createdAt)}
                </span>
            ),
        },

        // 12. الإجراءات — view only
        {
            key: "actions",
            header: t("table.actions"),
            cell: (row) => (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <m.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push(`/orders/details/${row.replacementOrderId}`)}
                                className="group w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm
                  border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white"
                            >
                                <Eye size={16} className="transition-transform group-hover:scale-110" />
                            </m.button>
                        </TooltipTrigger>
                        <TooltipContent>{t("actions.view")}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ),
        },
    ], [t, router]);


    return (
        <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">

            {/* Toolbar */}
            <ReplacementToolbar
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={applyFilters}
                isFiltersOpen={filtersOpen}
                onToggleFilters={() => setFiltersOpen((v) => !v)}
                onExport={handleExport}
                exportLoading={exportLoading}
                t={t}
            />

            {/* Filters panel */}
            <AnimatePresence>
                {filtersOpen && (
                    <ReplacementFiltersPanel
                        statuses={statuses}
                        value={filters}
                        onChange={setFilters}
                        onApply={applyFilters}
                        t={t}
                    />
                )}
            </AnimatePresence>

            {/* Table */}
            <DataTable
                columns={columns}
                data={pager.records}
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) => fetchReplacements(page, per_page)}
                emptyState={t("replacement.empty.title")}
                isLoading={loading}
            />
        </div>
    );
}

export default ReplacementTab;