"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Save,
    Loader2,
    Package,
    Settings2,
    Infinity,
    InfinityIcon,
    Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import api from "@/utils/api";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Button_ from "@/components/atoms/Button";

const INPUT_CLS = "rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20";
const SELECT_CLS = "w-full rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700";


export const TransactionPaymentMethod = Object.freeze({
    CASH: 'cash',
    VISA: "visa",
    BANK: "bank",
    OTHER: "other",
    // Mobile Wallets
    VODAFONE_CASH: "vodafone_cash",
    ORANGE_CASH: "orange_cash",
    ETISALAT_CASH: "etisalat_cash",
    WE_PAY: "we_pay",
    INSTA: "insta",
    // Payment Aggregators
    FAWRY: "fawry",
    AMAN: "aman",
    MEEZA: "meeza",
    // BNPL
    VALU: "valu",
    SYMPL: "sympl",
    TABBY: "tabby",
    TAMARA: "tamara",
});

export const PAYMENT_METHODS_ARRAY = Object.values(TransactionPaymentMethod);
export default function ManageSubscription({ userId, subscriptionId, onSaved }) {
    const t = useTranslations("plans");
    const isEditMode = !!subscriptionId;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [showCustomLimits, setShowCustomLimits] = useState(false);

    // ── Validation Schema ─────────────────────────────────────────────────────
    const schema = yup.object({
        planId: yup.string().required(t("validation.planRequired")),
        status: yup.string().required(t("validation.statusRequired")),
        duration: yup.string().required(),
        durationIndays: yup.number().when('duration', {
            is: 'custom',
            then: (s) => s.required().min(1),
            otherwise: (s) => s.nullable().optional(),
        }),
        price: yup.number().transform(v => v === '' ? undefined : v).nullable(),
        // Limits can be number or null (unlimited)
        includedOrders: yup.number().nullable(),
        usersLimit: yup.number().nullable(),
        storesLimit: yup.number().nullable(),
        shippingCompaniesLimit: yup.number().nullable(),
        bulkUploadPerMonth: yup.number().nullable(),
        extraOrderFee: yup.number().nullable(),
        // endDate: yup.date().nullable(),
        // usedOrders: yup.number().min(0).default(0),
    });

    const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            planId: "",
            status: "active",
            duration: "monthly",
            durationIndays: null,
            price: "",
            includedOrders: null,
            usersLimit: null,
            storesLimit: null,
            shippingCompaniesLimit: null,
            bulkUploadPerMonth: 0,
            extraOrderFee: null,
            paymentMethod: isEditMode ? "" : "cash",
        },
    });

    const watchDuration = watch("duration");
    const watchPlanId = watch("planId");



    // ── Data Fetching ─────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setInitialLoading(true);
        try {
            const { data: plansData } = await api.get("/plans");
            setPlans(plansData);

            if (isEditMode) {
                const { data: sub } = await api.get(`/subscriptions/${subscriptionId}`);
                console.log(sub)
                reset({
                    ...sub,
                });
                if (sub.includedOrders !== null) setShowCustomLimits(true);
            }
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setInitialLoading(false);
        }
    }, [isEditMode, subscriptionId, reset]);

    useEffect(() => { fetchData(); }, [fetchData]);


    // ── Submit Handler ────────────────────────────────────────────────────────
    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // بناء الـ Payload مع التأكد من أنواع البيانات (Data Casting)
            const payload = {
                // الحقول الأساسية
                planId: data.planId,
                userId: userId,
                status: data.status,
                duration: data.duration,

                price: data.price !== "" ? Number(data.price) : 0,
                includedOrders: data.includedOrders === null ? null : Number(data.includedOrders),
                extraOrderFee: data.extraOrderFee === null ? null : Number(data.extraOrderFee),
                usersLimit: data.usersLimit === null ? null : Number(data.usersLimit),
                storesLimit: data.storesLimit === null ? null : Number(data.storesLimit),
                shippingCompaniesLimit: data.shippingCompaniesLimit === null ? null : Number(data.shippingCompaniesLimit),
                bulkUploadPerMonth: data.bulkUploadPerMonth !== "" ? Number(data.bulkUploadPerMonth) : 0,

                // حقول إضافية
                durationIndays: data.duration === 'custom' ? Number(data.durationIndays) : null,
                paymentMethod: data.paymentMethod,
            };

            if (isEditMode) {
                // في التعديل، نحذف userId كما هو محدد في UpdateSubscriptionDto
                const { userId: _, ...updatePayload } = payload;
                await api.put(`/subscriptions/${subscriptionId}`, updatePayload);
            } else {
                await api.post("/subscriptions", payload);
            }

            toast.success(t("manageSubscription.messages.saveSuccess"));
            onSaved();
        } catch (error) {
            console.error("Submission error:", error);
            toast.error(error?.response?.data?.message || "Error saving subscription");
        } finally {
            setLoading(false);
        }
    };

    // Handle Plan Selection Change

    const applyPlanToForm = useCallback((plan) => {
        if (!plan) return;

        reset((prevValues) => ({
            ...prevValues,
            planId: plan.id,
            duration: plan.duration || 'monthly',
            durationIndays: plan.durationIndays || null,
            price: plan.price,
            includedOrders: plan.includedOrders,
            usersLimit: plan.usersLimit,
            storesLimit: plan.storesLimit,
            shippingCompaniesLimit: plan.shippingCompaniesLimit,
            bulkUploadPerMonth: plan.bulkUploadPerMonth || 0,
            extraOrderFee: plan.extraOrderFee,
            // نحتفظ ببعض القيم التي لا تعتمد على نوع الباقة
            status: prevValues.status,
            userId: prevValues.userId,
        }));

        setShowCustomLimits(true);
    }, []);


    // ... بقية المكون

    if (initialLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("manageSubscription.fields.plan")} *</Label>
                            <Controller
                                name="planId"
                                control={control}
                                render={({ field }) => (
                                    <Select value={String(field.value)} onValueChange={(value) => {
                                        field.onChange(value)
                                        const plan = plans.find(p => p.id === Number(value));
                                        if (plan) {
                                            applyPlanToForm(plan);
                                        }
                                    }}>
                                        <SelectTrigger className={SELECT_CLS}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {plans.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t("manageSubscription.fields.duration")} *</Label>
                            <Controller
                                name="duration"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={SELECT_CLS}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* تحديث الخيارات لتشمل lifetime وتركيبها مع الـ Enum الجديد */}
                                            {['monthly', 'yearly', 'lifetime', 'custom'].map(d => (
                                                <SelectItem key={d} value={d}>
                                                    {t(`durations.${d}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        {watchDuration === 'custom' && (
                            <div className="space-y-2">
                                <Label>{t("manageSubscription.fields.customDays")}</Label>
                                <Controller
                                    name="durationIndays"
                                    control={control}
                                    render={({ field }) => <Input {...field} type="number" className={INPUT_CLS} />}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("manageSubscription.fields.status")}</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={SELECT_CLS}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">{t("subscriptions.statuses.active")}</SelectItem>
                                            <SelectItem value="expired">{t("subscriptions.statuses.expired")}</SelectItem>
                                            <SelectItem value="cancelled">{t("subscriptions.statuses.cancelled")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t("manageSubscription.fields.price")} (Paid Amount)</Label>
                            <Controller
                                name="price"
                                control={control}
                                render={({ field }) => <Input {...field} type="number" className={INPUT_CLS} />}
                            />
                        </div>
                    </div>
                </div>

                {/* Custom Limits Toggle */}
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex items-center gap-3">
                        <Settings2 className="text-primary" size={20} />
                        <div>
                            <p className="text-sm font-bold">{t("manageSubscription.fields.customOverride")}</p>
                            <p className="text-xs text-muted-foreground">{t("manageSubscription.hints.customOverride")}</p>
                        </div>
                    </div>
                    <Switch checked={showCustomLimits} onCheckedChange={setShowCustomLimits} />
                </div>

                {showCustomLimits && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 border rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">

                        {/* حقول التحكم في الاستهلاك والتاريخ */}
                        {/* <div className="space-y-2">
                            <Label className="text-xs font-semibold">{t("manageSubscription.fields.usedOrders")}</Label>
                            <Controller
                                name="usedOrders"
                                control={control}
                                render={({ field }) => <Input {...field} type="number" className={INPUT_CLS} />}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">{t("manageSubscription.fields.endDate")}</Label>
                            <Controller
                                name="endDate"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="date"
                                        className={INPUT_CLS}
                                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                )}
                            />
                        </div>

                        <div className="md:col-span-3 border-t my-2" /> */}

                        {/* حقول الحدود (Limits) */}
                        {[
                            { name: "includedOrders", label: "includedOrders" },
                            { name: "usersLimit", label: "usersLimit" },
                            { name: "storesLimit", label: "storesLimit" },
                            { name: "shippingCompaniesLimit", label: "shippingLimit" },
                            { name: "extraOrderFee", label: "extraOrderFee" },
                            { name: "bulkUploadPerMonth", label: "bulkUpload", noInfinity: true },
                        ].map((limit) => {
                            const isFeeField = limit.name === "extraOrderFee";

                            return (<div key={limit.name} className="space-y-2 relative group">
                                {<div className="flex justify-between items-center mb-1">
                                    <Label className="text-[11px] font-medium text-slate-500">{t(`manageSubscription.fields.${limit.label}`)}</Label>

                                    {/* زر الـ Unlimited الجديد كأيقونة تفاعلية */}
                                    {!limit.noInfinity && <button
                                        type="button"
                                        title={t("manageSubscription.tooltips.unlimited")}
                                        onClick={() => setValue(limit.name, null)}
                                        className="p-1.5 rounded-md bg-white dark:bg-slate-800 border shadow-sm hover:text-primary hover:border-primary transition-all active:scale-90"
                                    >
                                        {isFeeField ? <Lock size={14} /> : <InfinityIcon size={14} />}
                                    </button>}
                                </div>
                                }
                                <Controller
                                    name={limit.name}
                                    control={control}
                                    render={({ field }) => (
                                        <div className="relative">
                                            <Input
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                                                placeholder={
                                                    field.value === null
                                                        ? (isFeeField ? t("manageSubscription.fields.notAllowed") : limit.noInfinity ? null : "∞ Unlimited")
                                                        : "0"
                                                }
                                                className={`${INPUT_CLS} ${field.value === null ? "border-primary/40 bg-primary/5 font-bold text-primary" : ""}`}
                                                type={field.value === null ? "text" : "number"}
                                            />

                                        </div>
                                    )}
                                />
                                {limit.name === "extraOrderFee" && !watch("extraOrderFee") && (
                                    <p className="text-[9px] text-orange-500 mt-1 italic">{t("manageSubscription.fields.extraFeePlaceholder")}</p>
                                )}
                            </div>)
                        }
                        )}
                    </motion.div>
                )}

                {!isEditMode && (
                    <div className="pt-4 border-t space-y-4">
                        <Label className="text-xs font-semibold px-1">
                            {t("manageSubscription.fields.paymentMethod")}
                        </Label>
                        <Controller
                            name="paymentMethod"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className={SELECT_CLS}><SelectValue placeholder="Method" /></SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {PAYMENT_METHODS_ARRAY.map((method) => (
                                            <SelectItem key={method} value={method}>
                                                {t(`paymentMethods.${method.toLowerCase()}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button_
                        label={loading ? t("actions.saving") : t("actions.save")}
                        tone="primary"
                        type="submit"
                        disabled={loading}
                        icon={loading ? <Loader2 className="animate-spin" /> : <Save />}
                    />
                </div>
            </form>
        </motion.div>
    );
}