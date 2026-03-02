"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    Save,
    Loader2,
    User,
    Package,
    DollarSign,
    CreditCard,
    Calendar,
    CheckCircle2,
    Mail,
    Phone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import api from "@/utils/api";

// ── Components ────────────────────────────────────────────────────────────────
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";

// ── Constants ─────────────────────────────────────────────────────────────────

const INPUT_CLS = "rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20";
const SELECT_CLS = "w-full rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const SubscriptionStatus = Object.freeze({
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
});

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

// ── Helper Functions ──────────────────────────────────────────────────────────

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "—";
    return Number(amount).toLocaleString("ar-EG");
}

// ── Section Card Component ────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    {Icon && <Icon size={20} className="text-primary" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            </div>
            {children}
        </motion.div>
    );
}

// ── Info Row Component ────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, valueClassName }) {
    return (
        <div className="flex items-start gap-3 py-2">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <Icon size={18} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                <p className={cn("text-base font-semibold text-gray-900 dark:text-gray-100", valueClassName)}>
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ManageSubscription({ userId, subscriptionId, onSaved }) {
    const t = useTranslations("plans");
    const router = useRouter();

    console.log(userId, subscriptionId)
    const isEditMode = !!subscriptionId;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showPaymentMethod, setShowPaymentMethod] = useState(false);

    // ── Validation Schema ─────────────────────────────────────────────────────
    const schema = yup.object({
        planId: yup.number().required(t("validation.planRequired")),
        status: yup.string().required(t("validation.statusRequired")),
        price: yup
            .number()
            .transform((value, originalValue) => {
                // Convert empty string ("") to undefined
                return originalValue === '' ? undefined : value;
            })
            .min(0, t("validation.priceMin"))
            .optional(),
        payed: yup.boolean(),
        paymentMethod: yup.string().when('payed', {
            is: true,
            then: (schema) => schema.required(t("validation.paymentMethodRequired")),
            otherwise: (schema) => schema.optional(),
        }),
    });

    // ── Form Setup ────────────────────────────────────────────────────────────
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            planId: "",
            status: SubscriptionStatus.ACTIVE,
            price: "",
            payed: false,
            paymentMethod: "",
        },
    });

    // Watch for changes
    const watchPayed = watch("payed");
    const watchPlanId = watch("planId");

    // ── Fetch Plans ───────────────────────────────────────────────────────────
    const fetchPlans = useCallback(async () => {
        try {
            const { data } = await api.get("/plans");

            const transformedPlans = (data || []).map((plan) => ({
                id: plan.id,
                name: plan.name,
                price: Number(plan.price),
                duration: plan.duration,
                description: plan.description || "",
                features: Array.isArray(plan.features) ? plan.features : [],
                color: plan.color || "from-blue-500 to-blue-600",
                isActive: plan.isActive !== false,
                isPopular: plan.isPopular || false,
                usersLimit: Number(plan.usersLimit ?? plan.maxUsers ?? 1),
                shippingCompaniesLimit: Number(plan.shippingCompaniesLimit ?? plan.maxShippingCompanies ?? 0),
                bulkUploadPerMonth: Number(plan.bulkUploadPerMonth ?? plan.maxShippingCompanies ?? 0),
            }));

            setPlans(transformedPlans.filter(p => p.isActive));
            return transformedPlans;
        } catch (error) {
            const message = error?.response?.data?.message || t("messages.errorFetchingPlans");
            toast.error(message);
            throw error;
        }
    }, [t]);

    // ── Fetch User Data ───────────────────────────────────────────────────────
    const fetchUserData = useCallback(async () => {
        if (!userId) {
            toast.error(t("manageSubscription.errors.invalidUserId"));
            // router.push("/dashboard/users");
            return;
        }

        try {
            const userRes = await api.get(`/users/${userId}`);
            setUser(userRes.data);
        } catch (error) {
            console.error("Error fetching user:", error);
            toast.error(t("manageSubscription.errors.fetchUserFailed"));
            // router.push("/dashboard/users");
        }
    }, [userId, router, t]);

    // ── Fetch Subscription Data (Edit Mode) ──────────────────────────────────
    const fetchSubscriptionData = useCallback(async () => {
        if (!subscriptionId) return;

        try {
            const subRes = await api.get(`/subscriptions/${subscriptionId}`);
            const subscription = subRes.data;

            reset({
                planId: subscription.planId,
                status: subscription.status,
                price: subscription.price,
                payed: false,
                paymentMethod: "",
            });

            // Find and set selected plan
            const plan = plans.find(p => p.id === subscription.planId);
            if (plan) {
                setSelectedPlan(plan);
            }
        } catch (error) {
            console.error("Error fetching subscription:", error);
            toast.error(t("manageSubscription.errors.fetchSubscriptionFailed"));
        }
    }, []);

    // ── Initial Data Fetch ────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            setInitialLoading(true);
            try {
                await Promise.all([
                    fetchPlans(),
                    fetchUserData(),
                ]);

                if (isEditMode) {
                    await fetchSubscriptionData();
                }
            } catch (error) {
                console.error("Initialization error:", error);
            } finally {
                setInitialLoading(false);
            }
        };

        init();
    }, [fetchPlans, fetchUserData, fetchSubscriptionData, isEditMode]);

    // ── Handle Plan Change ────────────────────────────────────────────────────
    useEffect(() => {
        if (watchPlanId && plans.length > 0) {
            const plan = plans.find(p => p.id === Number(watchPlanId));
            if (plan) {
                setSelectedPlan(plan);
                setValue("price", plan.price);
            }
        }
    }, [watchPlanId, plans, setValue]);

    // ── Handle Payed Toggle ───────────────────────────────────────────────────
    useEffect(() => {
        setShowPaymentMethod(watchPayed);
        if (!watchPayed) {
            setValue("paymentMethod", "");
        }
    }, [watchPayed, setValue]);

    // ── Submit Handler ────────────────────────────────────────────────────────
    const onSubmit = async (data) => {
        try {
            setLoading(true);

            if (isEditMode) {
                // Update subscription
                const payload = {
                    planId: Number(data.planId),
                    price: data.price ? Number(data.price) : undefined,
                    status: data.status,
                };

                await api.put(`/subscriptions/${subscriptionId}`, payload);
                toast.success(t("manageSubscription.messages.updateSuccess"));
            } else {
                // Create subscription
                const payload = {
                    userId: Number(userId),
                    planId: Number(data.planId),
                    status: data.status,
                    price: data.price ? Number(data.price) : undefined,
                    payed: data.payed,
                    paymentMethod: data.payed ? data.paymentMethod : undefined,
                };

                await api.post("/subscriptions", payload);
                toast.success(t("manageSubscription.messages.createSuccess"));
            }

            // router.push(`/dashboard/users`);
        } catch (error) {
            console.error("Error saving subscription:", error);
            toast.error(error?.response?.data?.message || t("manageSubscription.errors.saveFailed"));
        } finally {
            setLoading(false);
            onSaved()
        }
    };

    // ── Loading State ─────────────────────────────────────────────────────────
    if (initialLoading) {
        return (
            <div className="flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{t("messages.loading")}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className=" flex items-center justify-center">
                <div className="text-center">
                    <User size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">{t("manageSubscription.errors.userNotFound")}</p>
                </div>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
            className="p-6 bg-[#f3f6fa] dark:bg-[#19243950]"
        >
            {/* ── Header ── */}
            {/* <div className="bg-card mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <span className="text-gray-400">{t("breadcrumb.home")}</span>
                        <ChevronLeft className="text-gray-400" size={18} />
                        <button
                            onClick={() => router.push("/users")}
                            className="text-gray-400 hover:text-primary transition-colors"
                        >
                            {t("manageSubscription.breadcrumb.users")}
                        </button>
                        <ChevronLeft className="text-gray-400" size={18} />
                        <button
                            onClick={() => router.push(`/users/${userId}`)}
                            className="text-gray-400 hover:text-primary transition-colors"
                        >
                            {user.name}
                        </button>
                        <ChevronLeft className="text-gray-400" size={18} />
                        <span className="text-primary">
                            {isEditMode ? t("manageSubscription.breadcrumb.edit") : t("manageSubscription.breadcrumb.create")}
                        </span>
                        <span className="mr-3 inline-flex w-3.5 h-3.5 rounded-xl bg-primary" />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button_
                            onClick={handleSubmit(onSubmit)}
                            size="sm"
                            label={loading ? t("actions.saving") : t("actions.save")}
                            tone="purple"
                            variant="solid"
                            disabled={loading}
                            icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        />
                    </div>
                </div>
            </div> */}

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-6">
                    {/* ═══════════════════════════════════════════════
					    LEFT COLUMN — User Preview (1/3 width)
					═══════════════════════════════════════════════ */}
                    {/* <div className="lg:col-span-1 space-y-6"> */}
                    {/* User Information Card */}
                    {/* <SectionCard title={t("manageSubscription.sections.userInfo")} icon={User} delay={0.2}>
                            <div className="space-y-4">
                                <InfoRow
                                    icon={User}
                                    label={t("manageSubscription.fields.userName")}
                                    value={user.name}
                                />
                                <InfoRow
                                    icon={Mail}
                                    label={t("manageSubscription.fields.userEmail")}
                                    value={user.email}
                                />
                                {user.phone && (
                                    <InfoRow
                                        icon={Phone}
                                        label={t("manageSubscription.fields.userPhone")}
                                        value={user.phone}
                                    />
                                )}
                                <InfoRow
                                    icon={Calendar}
                                    label={t("manageSubscription.fields.joinedDate")}
                                    value={new Date(user.createdAt).toLocaleDateString("ar-EG", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                />
                            </div>
                        </SectionCard> */}

                    {/* Selected Plan Preview */}
                    {/* {selectedPlan && ( */}
                    {/* <SectionCard title={t("manageSubscription.sections.selectedPlan")} icon={Package} delay={0.25}>
                     <div className="space-y-4">
                         <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                             <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                                 {selectedPlan.name}
                             </h4>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                 {selectedPlan.description}
                             </p>
                             <div className="flex items-center justify-between">
                                 <span className="text-sm text-gray-500">{t("manageSubscription.fields.price")}</span>
                                 <span className="font-bold text-2xl text-primary">
                                     {formatCurrency(selectedPlan.price)} {t("currency")}
                                 </span>
                             </div>
                         </div>

                         <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-600 dark:text-gray-400">
                                     {t("manageSubscription.fields.usersLimit")}
                                 </span>
                                 <span className="font-semibold">{selectedPlan.usersLimit}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-600 dark:text-gray-400">
                                     {t("manageSubscription.fields.shippingLimit")}
                                 </span>
                                 <span className="font-semibold">{selectedPlan.shippingCompaniesLimit}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-600 dark:text-gray-400">
                                     {t("manageSubscription.fields.bulkUploadLimit")}
                                 </span>
                                 <span className="font-semibold">{selectedPlan.bulkUploadPerMonth}</span>
                             </div>
                         </div>
                     </div>
                 </SectionCard> */}
                    {/* )} */}
                    {/* </div> */}

                    {/* ═══════════════════════════════════════════════
					    RIGHT COLUMN — Subscription Form (2/3 width)
					═══════════════════════════════════════════════ */}
                    <div className="">
                        {/* <SectionCard title={t("manageSubscription.sections.subscriptionForm")} icon={CreditCard} delay={0.3}> */}
                        <div className="space-y-6">
                            {/* Plan Selection */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                    {t("manageSubscription.fields.plan")} *
                                </Label>
                                <Controller
                                    name="planId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                                            <SelectTrigger className={SELECT_CLS}>
                                                <SelectValue placeholder={t("manageSubscription.placeholders.plan")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {plans.map((plan) => (
                                                    <SelectItem key={plan.id} value={String(plan.id)}>
                                                        <div className="flex items-center justify-between w-full gap-4">
                                                            <span>{plan.name}</span>
                                                            <span className="text-xs text-primary font-semibold">
                                                                {formatCurrency(plan.price)} {t("currency")}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.planId && (
                                    <p className="text-xs text-red-500">{errors.planId.message}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                    {t("manageSubscription.fields.status")} *
                                </Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className={SELECT_CLS}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={SubscriptionStatus.ACTIVE}>
                                                    {t("subscriptions.statuses.active")}
                                                </SelectItem>
                                                <SelectItem value={SubscriptionStatus.CANCELLED}>
                                                    {t("subscriptions.statuses.cancelled")}
                                                </SelectItem>
                                                <SelectItem value={SubscriptionStatus.EXPIRED}>
                                                    {t("subscriptions.statuses.expired")}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.status && (
                                    <p className="text-xs text-red-500">{errors.status.message}</p>
                                )}
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                    {t("manageSubscription.fields.price")}
                                </Label>
                                <Controller
                                    name="price"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={t("manageSubscription.placeholders.price")}
                                            className={INPUT_CLS}
                                        />
                                    )}
                                />
                                {errors.price && (
                                    <p className="text-xs text-red-500">{errors.price.message}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    {t("manageSubscription.hints.priceOverride")}
                                </p>
                            </div>

                            {/* Payment Section (Create Mode Only) */}
                            {!isEditMode && (
                                <>
                                    {/* Payed Toggle */}
                                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                                    {t("manageSubscription.fields.payed")}
                                                </Label>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t("manageSubscription.hints.payed")}
                                                </p>
                                            </div>
                                            <Controller
                                                name="payed"
                                                control={control}
                                                render={({ field }) => (
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Method (Conditional) */}
                                    {showPaymentMethod && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                                {t("manageSubscription.fields.paymentMethod")} *
                                            </Label>
                                            <Controller
                                                name="paymentMethod"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className={SELECT_CLS}>
                                                            <SelectValue placeholder={t("manageSubscription.placeholders.paymentMethod")} />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-[300px]">
                                                            {TransactionPaymentMethod.map((method) => (
                                                                <SelectItem key={method} value={method}>
                                                                    {t(`paymentMethods.${method.toLowerCase()}`)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.paymentMethod && (
                                                <p className="text-xs text-red-500">{errors.paymentMethod.message}</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>



                        <div className="flex items-center justify-end mt-2 gap-4">
                            <Button_
                                onClick={handleSubmit(onSubmit)}
                                size="sm"
                                label={loading ? t("actions.saving") : t("actions.save")}
                                tone="purple"
                                variant="solid"
                                disabled={loading}
                                icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            />
                        </div>
                        {/* </SectionCard> */}
                    </div>
                </div>
            </form>
        </motion.div>
    );
}