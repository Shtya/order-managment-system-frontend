"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
    Plus,
    Loader2,
    AlertCircle,
    Info,
    Wallet,
    CheckCircle2
} from "lucide-react";
import api from "@/utils/api";
import toast from "react-hot-toast";

import Button_ from "@/components/atoms/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SupplierSelect from "@/components/molecules/SupplierSelect";
import SafeSelect from "@/components/molecules/SafeSelect";
import SupplierInvoiceSelect from "@/components/molecules/SupplierInvoiceSelect";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { cn } from "@/utils/cn";
import { Textarea } from "@/components/ui/textarea";
import SupplierPaymentsTable from "./SupplierPaymentsTable";

const createPaymentSchema = (t) =>
    yup.object({
        supplierId: yup.string().required(t("validation.supplierRequired")).notOneOf(["none"], t("validation.supplierRequired")),
        safeId: yup.string().required(t("validation.safeRequired")).notOneOf(["none"], t("validation.safeRequired")),
        amount: yup.number()
            .typeError(t("validation.invalidAmount"))
            .required(t("validation.amountRequired"))
            .min(0.01, t("validation.minAmount")),
        paymentDate: yup.date().required(t("validation.dateRequired")),
        notes: yup.string().nullable(),
        invoiceId: yup.string().nullable(),
    });

export default function SupplierPaymentsTab({ onRefresh }) {
    const t = useTranslations("accounts.supplierPayments");
    const tCommon = useTranslations("common");

    // Form states
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [suppliers, setSuppliers] = useState(null);
    const [selectedSafe, setSelectedSafe] = useState(null);
    const [safes, setSafes] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(createPaymentSchema(t)),
        defaultValues: {
            supplierId: "none",
            safeId: "none",
            amount: "",
            paymentDate: new Date().toLocaleDateString(),
            notes: "",
            invoiceId: "none",
        },
    });

    const amountValue = watch("amount");
    const supplierId = watch("supplierId");
    const safeId = watch("safeId");

    useEffect(() => {
        if (suppliers) {
            setSelectedSupplier(suppliers.find(s => s.id === supplierId));
            if (suppliers.length > 0 && supplierId === "none") {
                setValue("supplierId", suppliers[0].id);
            }
        }
    }, [suppliers, supplierId, setValue]);

    useEffect(() => {
        if (safes) {
            setSelectedSafe(safes.find(s => s.id === safeId));
            if (safes.length > 0 && safeId === "none") {
                setValue("safeId", safes[0].id);
            }
        }
    }, [safes, safeId, setValue]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                amount: Number(data.amount),
                invoiceId: data.invoiceId === "none" ? undefined : data.invoiceId,
                paymentDate: data.paymentDate.toISOString(),
            };

            await api.post("/supplier-payments", payload);
            toast.success(t("messages.saveSuccess"));

            // Keep current selection but reset amount and notes
            setValue("amount", "");
            setValue("notes", "");
            setValue("invoiceId", "none");

            setRefreshKey(prev => prev + 1);
            onRefresh?.();
        } catch (err) {
            console.error("Error creating payment:", err);
            toast.error(err.response?.data?.message || t("messages.saveFailed"));
        }
    };

    const commissionInfo = useMemo(() => {
        if (!selectedSafe || !amountValue) return { commission: 0, total: 0, canWithdraw: true };

        const amount = Number(amountValue) || 0;
        const rate = Number(selectedSafe.commissionRate) || 0;
        const commission = (amount * rate) / 100;
        const total = amount + commission;
        const canWithdraw = Number(selectedSafe.currentBalance) >= total;

        return { commission, total, canWithdraw };
    }, [selectedSafe, amountValue]);

    return (
        <div className="space-y-6">
            {/* Form Card */}
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardHeader className="">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        {t("form.title")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Supplier Balance Cards */}
                        {selectedSupplier && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                                        {t("form.shouldPay")}
                                    </div>
                                    <div className="text-xl font-black text-rose-700 dark:text-rose-300">
                                        {Math.max(0, Number(selectedSupplier.dueBalance)).toLocaleString()}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                                        {t("form.shouldCollect")}
                                    </div>
                                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                                        {Math.max(0, -Number(selectedSupplier.dueBalance)).toLocaleString()}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                        {t("form.supplierBalance")}
                                    </div>
                                    <div className={cn(
                                        "text-xl font-black",
                                        Number(selectedSupplier.dueBalance) > 0 ? "text-rose-600" :
                                            Number(selectedSupplier.dueBalance) < 0 ? "text-emerald-600" : "text-slate-600"
                                    )}>
                                        {Number(selectedSupplier.dueBalance).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SupplierSelect
                                key={`supplier-select-${refreshKey}`}
                                name="supplierId"
                                control={control}
                                error={errors.supplierId?.message}
                                label={t("form.supplier")}
                                onFetchSuppliers={setSuppliers}
                            />

                            <SafeSelect
                                key={`safe-select-${refreshKey}`}
                                name="safeId"
                                control={control}
                                error={errors.safeId?.message}
                                label={t("form.safe")}
                                onFetchSafes={setSafes}
                            />

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t("form.amount")} *</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    {...control.register("amount")}
                                    className={cn("h-[45px] rounded-xl bg-[#fafafa] dark:bg-slate-800/50", errors.amount && "border-red-500")}
                                />
                                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t("form.paymentDate")} *</Label>
                                <Controller
                                    control={control}
                                    name="paymentDate"
                                    render={({ field }) => (
                                        <DateRangePicker
                                            mode="single"
                                            value={field.value}
                                            onChange={(date) => field.onChange(date)}
                                            staticShow={true}
                                            dataSize="default"
                                            className={cn("theme-field h-[45px] w-full pl-9 rounded-xl", errors.paymentDate && "border-red-500")}
                                        />
                                    )}
                                />
                                {errors.paymentDate && <p className="text-xs text-red-500">{errors.paymentDate.message}</p>}
                            </div>

                            <SupplierInvoiceSelect
                                key={`invoice-select-${refreshKey}-${supplierId}`}
                                name="invoiceId"
                                control={control}
                                supplierId={supplierId}
                                label={t("form.selectInvoice")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t("form.notes")}</Label>
                            <Textarea
                                placeholder={t("form.notesPlaceholder")}
                                {...control.register("notes")}
                                className="min-h-[80px] rounded-xl bg-[#fafafa] dark:bg-slate-800/50"
                            />
                        </div>

                        <div className="pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex-1 w-full md:w-auto">
                                {selectedSafe && (
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border-2 border-primary/10">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            commissionInfo.canWithdraw ? "bg-primary/10 text-primary" : "bg-rose-100 text-rose-600"
                                        )}>
                                            {commissionInfo.canWithdraw ? <Wallet size={24} /> : <AlertCircle size={24} />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                {t("form.totalWithCommission")}
                                            </div>
                                            <div className={cn(
                                                "text-2xl font-black flex items-baseline gap-2",
                                                commissionInfo.canWithdraw ? "text-primary" : "text-rose-600"
                                            )}>
                                                {commissionInfo.total.toLocaleString()}
                                                <span className="text-xs font-bold opacity-70 uppercase">{selectedSafe.currency}</span>
                                            </div>
                                            {commissionInfo.commission > 0 && (
                                                <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                    <Info size={10} />
                                                    {t("messages.commission")}: {commissionInfo.commission.toLocaleString()} {selectedSafe.currency}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            {!commissionInfo.canWithdraw && (
                                                <div className="text-[10px] font-black text-rose-600 uppercase mb-1">
                                                    {t("form.insufficientBalance")}
                                                </div>
                                            )}
                                            <div className={cn(
                                                "text-xs font-bold",
                                                commissionInfo.canWithdraw ? "text-muted-foreground" : "text-rose-500"
                                            )}>
                                                {selectedSafe.name}
                                            </div>
                                            <div className={cn(
                                                "text-sm font-black",
                                                commissionInfo.canWithdraw ? "text-slate-700 dark:text-slate-200" : "text-rose-600"
                                            )}>
                                                {Number(selectedSafe.currentBalance).toLocaleString()} {selectedSafe.currency}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button_
                                type="submit"
                                icon={<CheckCircle2 size={18} />}
                                disabled={isSubmitting || (selectedSafe && !commissionInfo.canWithdraw)}
                                label={t("form.submit")}
                                className="w-full md:w-auto min-w-[240px] h-[60px] rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            />
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <SupplierPaymentsTable key={refreshKey} />
                </CardContent>
            </Card>
        </div>
    );
}
