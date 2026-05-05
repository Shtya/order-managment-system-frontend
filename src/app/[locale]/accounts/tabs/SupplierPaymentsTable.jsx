"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Eye, FileDown, Loader2, Building2, Calendar, DollarSign, Wallet, FileText } from "lucide-react";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";

import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { cn } from "@/utils/cn";

function FilterField({ label, children }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase">{label}</Label>
            {children}
        </div>
    );
}

export default function SupplierPaymentsTable({ supplierId: initialSupplierId, onRefresh, flat = false, }) {
    const tCommon = useTranslations("common");
    const t = useTranslations("accounts.supplierPayments");
    const searchParams = useSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [pager, setPager] = useState({ records: [], total_records: 0, current_page: 1, per_page: 12 });
    const [search, setSearch] = useState("");

    // Filters
    const [filters, setFilters] = useState({
        supplierId: initialSupplierId || "all",
        startDate: null,
        endDate: null,
    });
    const [suppliers, setSuppliers] = useState([]);

    const hasActiveFilters = useMemo(() => {
        return (filters.supplierId !== "all" && filters.supplierId !== initialSupplierId) ||
            filters.startDate !== null ||
            filters.endDate !== null;
    }, [filters, initialSupplierId]);

    // Details Modal
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchSuppliers = useCallback(async () => {
        if (initialSupplierId) return;
        try {
            const res = await api.get("/lookups/suppliers");
            setSuppliers(res.data || []);
        } catch (err) {
            console.error("Error fetching suppliers:", err);
        }
    }, [initialSupplierId]);

    const fetchPayments = useCallback(async (page = 1, per_page = 12) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: per_page,
                search,
            };

            if (initialSupplierId) {
                params.supplierId = initialSupplierId;
            } else if (filters.supplierId !== "all") {
                params.supplierId = filters.supplierId;
            }

            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const res = await api.get("/supplier-payments", { params });
            setPager(res.data);
        } catch (err) {
            console.error("Error fetching payments:", err);
            toast.error(t("messages.fetchFailed"));
        } finally {
            setLoading(false);
        }
    }, [search, filters, initialSupplierId, t]);

    const applyFilters = () => fetchPayments(1, pager.per_page);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    useEffect(() => {
        fetchPayments();
    }, [search]); // Only fetch on mount and when search changes

    // Handle initial details modal from URL
    useEffect(() => {
        const detailsId = searchParams.get("detials");
        if (detailsId && !detailsModalOpen) {
            handleViewDetails(detailsId);
        }
    }, [searchParams]);

    const handleViewDetails = async (id) => {
        try {
            setLoadingDetails(true);
            setDetailsModalOpen(true);
            const res = await api.get(`/supplier-payments/${id}`);
            setSelectedPayment(res.data);

            // Update URL
            const params = new URLSearchParams(searchParams);
            params.set("detials", id);
            router.replace(`?${params.toString()}`, { scroll: false });
        } catch (err) {
            console.error("Error fetching payment details:", err);
            toast.error(t("messages.fetchFailed"));
            setDetailsModalOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedPayment(null);

        // Update URL
        const params = new URLSearchParams(searchParams);
        params.delete("detials");
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const handleExport = async () => {
        try {
            const res = await api.get("/supplier-payments/export", {
                params: {
                    search,
                    supplierId: initialSupplierId || (filters.supplierId === "all" ? undefined : filters.supplierId),
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `supplier-payments-${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting payments:", err);
            toast.error(t("messages.exportFailed"));
        }
    };

    const columns = [
        {
            header: t("table.date"),
            key: "paymentDate",
            cell: (row) => new Date(row.paymentDate).toLocaleDateString(),
        },
        {
            header: t("table.supplier"),
            key: "supplierName",
            cell: (row) => row.supplier?.name || "-",
        },
        {
            header: t("table.amount"),
            key: "amount",
            cell: (row) => (
                <div className="font-bold text-primary">
                    {Number(row.amount).toLocaleString()} {row.currency}
                </div>
            ),
        },
        {
            header: t("table.safe"),
            key: "safeName",
            cell: (row) => row.safe?.name || "-",
        },
        {
            header: t("table.allocations"),
            key: "allocations",
            cell: (row) => {
                const allocations = row.allocations || [];
                if (allocations.length === 0) return t("form.unallocated");

                const displayAllocations = allocations.slice(0, 3).map(a => ({
                    text: a.invoice ? `${a.invoice.receiptNumber}` : t("form.unallocated"),
                    amount: a.amount
                }));

                return (
                    <div className="text-xs space-y-0.5">
                        {displayAllocations.map((item, idx) => (
                            <div key={idx} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold inline-block mr-1 mb-1">
                                {item.text} <span className="text-primary ml-0.5">
                                    ({Number(item.amount).toLocaleString()} {row.currency})
                                </span>
                            </div>
                        ))}
                        {allocations.length > 3 && (
                            <span className="text-[10px] font-bold text-muted-foreground">
                                +{allocations.length - 3}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            header: t("table.supplierBalanceAfter"),
            key: "supplierBalanceAfterPay",
            cell: (row) => (
                <div className={cn(
                    "font-bold text-xs",
                    Number(row.supplierBalanceAfterPay) > 0 ? "text-rose-500" : "text-emerald-500"
                )}>
                    {Number(row.supplierBalanceAfterPay).toLocaleString()}
                </div>
            ),
        },
        {
            header: t("table.createdBy"),
            key: "createdByUser",
            cell: (row) => (
                <div className="text-[10px] font-medium text-muted-foreground">
                    {row.createdByUser?.name || "-"}
                </div>
            ),
        },
        {
            header: t("table.notes"),
            key: "notes",
            cell: (row) => (
                <div className="max-w-[150px] truncate text-[10px] italic text-muted-foreground" title={row.notes}>
                    {row.notes || "-"}
                </div>
            ),
        },
        {
            header: t("table.actions"),
            key: "actions",
            cell: (row) => (
                <ActionButtons
                    row={row}
                    actions={[
                        {
                            icon: <Eye size={16} />,
                            tooltip: tCommon("view"),
                            onClick: () => handleViewDetails(row.id),
                            variant: "purple",
                        }
                    ]}
                />
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <Table
                flat={flat}
                searchValue={search}
                onSearchChange={setSearch}
                actions={[
                    {
                        key: "export",
                        label: t("messages.export"),
                        icon: <FileDown size={14} />,
                        color: "primary",
                        onClick: handleExport,
                    },
                ]}
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                filters={
                    <>
                        {!initialSupplierId && (
                            <FilterField label={t("form.supplier")}>
                                <Select
                                    value={filters.supplierId}
                                    onValueChange={(v) => setFilters(f => ({ ...f, supplierId: v }))}
                                >
                                    <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                                        <SelectValue placeholder={t("filters.supplierPlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card-select">
                                        <SelectItem value="all">{t("all")}</SelectItem>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>
                        )}

                        <FilterField label={t("table.date")}>
                            <DateRangePicker
                                value={{
                                    startDate: filters.startDate,
                                    endDate: filters.endDate,
                                }}
                                onChange={(newDates) => setFilters(prev => ({ ...prev, ...newDates }))}
                                // placeholder={t("selectDateRange")}
                                dataSize="default"
                                maxDate="today"
                            />
                        </FilterField>
                    </>
                }
                columns={columns}
                data={pager.records}
                isLoading={loading}
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) => fetchPayments(page, per_page)}
                labels={{
                    searchPlaceholder: t("toolbar.searchPlaceholder"),
                    filter: t("toolbar.filter"),
                    apply: t("filters.apply"),
                    total: t("total"),
                    limit: t("limit"),
                    emptyTitle: t("table.empty"),
                }}
            />

            {/* Details Modal */}
            <Dialog open={detailsModalOpen} onOpenChange={(open) => !open && closeDetailsModal()}>
                <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-primary text-white">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Eye className="w-6 h-6" />
                            {t("details.title")}
                        </DialogTitle>
                    </DialogHeader>

                    {loadingDetails ? (
                        <div className="p-12 flex justify-center items-center">
                            <Loader2 className="animate-spin w-8 h-8 text-primary" />
                        </div>
                    ) : selectedPayment && (
                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground font-bold uppercase">{t("table.supplier")}</Label>
                                    <div className="flex items-center gap-2 font-bold text-lg">
                                        <Building2 size={18} className="text-primary" />
                                        {selectedPayment.supplier?.name}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground font-bold uppercase">{t("table.date")}</Label>
                                    <div className="flex items-center gap-2 font-bold text-lg">
                                        <Calendar size={18} className="text-primary" />
                                        {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground font-bold uppercase">{t("table.amount")}</Label>
                                    <div className="flex items-center gap-2 font-black text-2xl text-primary">
                                        <DollarSign size={20} />
                                        {Number(selectedPayment.amount).toLocaleString()} {selectedPayment.currency}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground font-bold uppercase">{t("table.safe")}</Label>
                                    <div className="flex items-center gap-2 font-bold text-lg">
                                        <Wallet size={18} className="text-primary" />
                                        {selectedPayment.safe?.name}
                                    </div>
                                </div>
                            </div>

                            {selectedPayment.notes && (
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
                                    <Label className="text-[10px] text-muted-foreground font-bold uppercase mb-1 block">{t("form.notes")}</Label>
                                    <p className="text-sm italic text-slate-600 dark:text-slate-300">"{selectedPayment.notes}"</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="font-black text-lg flex items-center gap-2 border-b pb-2">
                                    <FileText size={20} className="text-primary" />
                                    {t("details.allocations")}
                                </h3>
                                <div className="space-y-3">
                                    {selectedPayment.allocations?.map((alloc, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-slate-800 border shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">
                                                        {alloc.invoice ? `${t("details.invoiceNumber")}: #${alloc.invoice.receiptNumber}` : t("form.unallocated")}
                                                    </div>
                                                    {alloc.invoiceRemainingAfterPay !== null && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {t("details.remainingAfter")}: {Number(alloc.invoiceRemainingAfterPay).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right font-black text-primary">
                                                {Number(alloc.amount).toLocaleString()} {selectedPayment.currency}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t grid grid-cols-2 gap-4">
                                <div className="text-[10px] text-muted-foreground">
                                    <strong>{t("details.createdBy")}:</strong> {selectedPayment.createdByUser?.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground text-right">
                                    <strong>{t("details.createdAt")}:</strong> {new Date(selectedPayment.createdAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
