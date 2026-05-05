"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import { Loader2, FileText } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";
import { cn } from "@/utils/cn";

export default function SupplierInvoiceSelect({
    control,
    name,
    error,
    label,
    placeholder,
    required,
    className,
    supplierId
}) {
    const t = useTranslations("accounts.supplierPayments");
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchInvoices = useCallback(async (pageNum = 1, append = false) => {
        if (!supplierId || supplierId === "none") {
            setInvoices([]);
            return;
        }

        try {
            setLoading(true);
            const res = await api.get("/purchases", {
                params: {
                    supplierId,
                    status: "accepted",
                    closed: "false",
                    payed: 'no',
                    page: pageNum,
                    limit: 15
                }
            });

            const newRecords = res.data.records || [];
            if (append) {
                setInvoices(prev => [...prev, ...newRecords]);
            } else {
                setInvoices(newRecords);
            }

            setHasMore(newRecords.length === 15);
        } catch (err) {
            console.error("Error fetching invoices:", err);
        } finally {
            setLoading(false);
        }
    }, [supplierId]);

    useEffect(() => {
        setPage(1);
        fetchInvoices(1, false);
    }, [supplierId, fetchInvoices]);

    const handleLoadMore = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nextPage = page + 1;
        setPage(nextPage);
        fetchInvoices(nextPage, true);
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-sm text-gray-600 dark:text-slate-300">
                {label} {required && "*"}
            </Label>

            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger className={cn("w-full rounded-xl !h-[45px] bg-[#fafafa] dark:bg-slate-800/50", error && "border-red-500")}>
                            <SelectValue placeholder={placeholder || t("form.selectInvoice")} />
                        </SelectTrigger>
                        <SelectContent className="bg-card-select">
                            <SelectItem value="none">{t("form.unallocated")}</SelectItem>

                            {invoices.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            ({Number(inv.remainingAmount).toLocaleString()})
                                        </span>
                                        <span>{inv.receiptNumber}</span>
                                        <FileText size={14} className="text-primary/60" />
                                    </div>
                                </SelectItem>
                            ))}

                            {hasMore && (
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 py-2 text-xs text-primary font-bold hover:bg-primary/5 border-t mt-1"
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : t("form.loadMoreInvoices")}
                                </button>
                            )}
                        </SelectContent>
                    </Select>
                )}
            />

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
