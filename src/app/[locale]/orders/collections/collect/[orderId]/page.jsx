"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    DollarSign,
    Save,
    Loader2,
    User,
    Phone,
    MapPin,
    Package,
    Calendar,
    CreditCard,
    FileText,
    Truck,
    CircleDollarSign,
    Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import api from "@/utils/api";

// ── Components ────────────────────────────────────────────────────────────────
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// ── Constants ─────────────────────────────────────────────────────────────────

const INPUT_CLS = "rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20";
const SELECT_CLS = "w-full rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700";

// ── Helper Functions ──────────────────────────────────────────────────────────

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

// ── Order Info Row ────────────────────────────────────────────────────────────

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

export const PaymentSource = Object.freeze({
    // Standard Methods
    VISA: "visa",
    BANK: "bank",
    CASH: "cash",
    OTHER: "other",

    // Mobile Wallets & Instant Transfers
    VODAFONE_CASH: "vodafone_cash",
    ORANGE_CASH: "orange_cash",
    ETISALAT_CASH: "etisalat_cash",
    WE_PAY: "we_pay",
    INSTA: "insta",

    // Payment Aggregators & Points
    FAWRY: "fawry",
    AMAN: "aman",
    MEEZA: "meeza",

    // Buy Now Pay Later (BNPL)
    VALU: "valu",
    SYMPL: "sympl",
    TABBY: "tabby",
    TAMARA: "tamara",

    // Logistics specific
    SHIPPING_COMPANY: "shipping_company",
    OFFICE_PICKUP: "office_pickup"
});

// ── Main Component ────────────────────────────────────────────────────────────

export default function CollectOrderPage() {
    const tCollect = useTranslations("orderCollection");
    const t = useTranslations("collectOrder");
    const router = useRouter();
    const params = useParams();
    const orderId = params?.orderId;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [shippingCompanies, setShippingCompanies] = useState([]);
    const [currencies, setCurrencies] = useState(["EGP"]);

    // ── Validation Schema ─────────────────────────────────────────────────────
    const schema = yup.object({
        shippingCompanyId: yup.number().required(t("validation.shippingCompanyRequired")),
        collectionDate: yup.date().required(t("validation.collectionDateRequired")),
        source: yup.string().required(t("validation.sourceRequired")),
        currency: yup.string().required(t("validation.currencyRequired")),
        amount: yup
            .number()
            .required(t("validation.amountRequired"))
            .min(0.01, t("validation.amountMin")),
        notes: yup.string().optional(),
    });

    // ── Form Setup ────────────────────────────────────────────────────────────
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            shippingCompanyId: "",
            collectionDate: new Date(),
            source: "",
            currency: "SAR",
            amount: "",
            notes: "",
        },
    });

    // ── Fetch Order Data ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!orderId) {
            toast.error(t("errors.invalidOrderId"));
            router.push("/orders/collections");
            return;
        }

        const fetchOrderData = async () => {
            try {
                setInitialLoading(true);

                // Fetch order details
                const orderRes = await api.get(`/orders/${orderId}`);
                console.log("Fetched order data:", orderRes); // Debug log to inspect order data
                setOrder(orderRes.data);

                // Set shipping company if available
                if (orderRes.data.shippingCompany?.id) {
                    setValue("shippingCompanyId", orderRes.data.shippingCompany.id);
                }

                // Fetch shipping companies
                const res = await api.get("/shipping/integrations/active");
                setShippingCompanies(Array.isArray(res.data?.integrations) ? res.data?.integrations : res.data?.records ?? []);
            } catch (error) {
                console.error("Error fetching order:", error);
                toast.error(t("errors.fetchFailed"));
                router.push("/orders/collections");
            } finally {
                setInitialLoading(false);
            }
        };

        fetchOrderData();
    }, [orderId, router, t, setValue]);

    // ── Submit Handler ────────────────────────────────────────────────────────
    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const payload = {
                orderId: Number(orderId),
                shippingCompanyId: Number(data.shippingCompanyId),
                source: data.source,
                currency: data.currency,
                amount: Number(data.amount),
                notes: data.notes || undefined,
            };

            await api.post("/collections", payload);

            toast.success(t("messages.success"));
            router.push("/orders/collections");
        } catch (error) {
            console.error("Error creating collection:", error);
            toast.error(error?.response?.data?.message || t("errors.createFailed"));
        } finally {
            setLoading(false);
        }
    };

    // ── Loading State ─────────────────────────────────────────────────────────
    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{t("messages.loading")}</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Package size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">{t("errors.orderNotFound")}</p>
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
            className="min-h-screen p-6 bg-[#f3f6fa] dark:bg-[#19243950]"
        >
            {/* ── Header ── */}
            <div className="bg-card mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <span className="text-gray-400">{t("breadcrumb.home")}</span>
                        <ChevronLeft className="text-gray-400" size={18} />
                        <span className="text-primary">{t("breadcrumb.title")}</span>
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
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-6">
                    {/* ═══════════════════════════════════════════════
					    LEFT COLUMN — Order Preview (2/3 width)
					═══════════════════════════════════════════════ */}
                    <div className="col-span-1 space-y-6">
                        {/* Order Information Card */}
                        <SectionCard title={t("sections.orderInfo")} icon={Package} delay={0.2}>
                            <div className="space-y-4">
                                {/* Order Number Badge */}
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t("fields.orderNumber")}:
                                    </span>
                                    <Badge className="text-base font-bold font-mono px-3 py-1 bg-primary/10 text-primary border-primary/20">
                                        {order.orderNumber}
                                    </Badge>
                                </div>

                                {/* Order Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-800">
                                    <InfoRow
                                        icon={User}
                                        label={t("fields.customerName")}
                                        value={order.customerName}
                                    />
                                    <InfoRow
                                        icon={Phone}
                                        label={t("fields.phoneNumber")}
                                        value={order.phoneNumber}
                                    />
                                    <InfoRow
                                        icon={MapPin}
                                        label={t("fields.city")}
                                        value={order.city}
                                    />
                                    <InfoRow
                                        icon={Calendar}
                                        label={t("fields.deliveredAt")}
                                        value={formatDate(order.deliveredAt)}
                                    />

                                    {/* المبلغ المحصل - مع إضافة تنسيق اللون الأخضر والحد العلوي */}
                                    <div className="border-t border-gray-200 dark:border-slate-800 pt-1">
                                        <InfoRow
                                            icon={CircleDollarSign}
                                            label={t("fields.collectedAmount").trim()}
                                            labelClassName="text-emerald-600 dark:text-emerald-400"
                                            valueClassName="font-semibold text-emerald-600 dark:text-emerald-400"
                                            value={`${formatCurrency(order.collectedAmount)} ${t("currency").trim()}`}
                                        />
                                    </div>

                                    {/* إجمالي الطلب - مع تكبير الخط وتغليظه */}
                                    <InfoRow
                                        icon={Wallet}
                                        label={t("fields.orderTotal").trim()}
                                        valueClassName="font-bold text-lg text-gray-900 dark:text-gray-100"
                                        value={`${formatCurrency(order.finalTotal)} ${t("currency").trim()}`}
                                    />

                                    {/* تكلفة الشحن - مع الحد العلوي */}
                                    <div className="border-t border-gray-200 dark:border-slate-800 pt-1">
                                        <InfoRow
                                            icon={Truck}
                                            label={t("fields.shippingCost").trim()}
                                            valueClassName="font-semibold text-gray-900 dark:text-gray-100"
                                            value={`${formatCurrency(order.shippingCost)} ${t("currency").trim()}`}
                                        />
                                    </div>


                                </div>

                                {/* Address */}
                                <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                                    <InfoRow
                                        icon={MapPin}
                                        label={t("fields.address")}
                                        value={order.address}
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        <div className="lg:col-span-1">
                            <SectionCard title={t("sections.collectionForm")} icon={CreditCard} delay={0.35}>
                                <div className="space-y-4">
                                    {/* Shipping Company */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                            {t("fields.shippingCompany")} *
                                        </Label>
                                        <Controller
                                            name="shippingCompanyId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                                                    <SelectTrigger className={SELECT_CLS}>
                                                        <SelectValue placeholder={t("placeholders.shippingCompany")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {shippingCompanies.map((company) => (
                                                            <SelectItem key={company.providerId} value={String(company.providerId)}>
                                                                {company.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.shippingCompanyId && (
                                            <p className="text-xs text-red-500">{errors.shippingCompanyId.message}</p>
                                        )}
                                    </div>

                                    {/* Collection Date */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                            {t("fields.collectionDate")} *
                                        </Label>
                                        <Controller
                                            name="collectionDate"
                                            control={control}
                                            render={({ field }) => (
                                                <Flatpickr
                                                    value={field.value}
                                                    onChange={([date]) => field.onChange(date)}
                                                    options={{
                                                        dateFormat: "Y-m-d",
                                                        maxDate: "today",
                                                    }}
                                                    className={cn(INPUT_CLS, "w-full")}
                                                    placeholder={t("placeholders.collectionDate")}
                                                />
                                            )}
                                        />
                                        {errors.collectionDate && (
                                            <p className="text-xs text-red-500">{errors.collectionDate.message}</p>
                                        )}
                                    </div>

                                    {/* Payment Source */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                            {t("fields.source")} *
                                        </Label>
                                        <Controller
                                            name="source"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value) => field.onChange(value)}
                                                >
                                                    <SelectTrigger className={SELECT_CLS}>
                                                        <SelectValue placeholder={t("placeholders.source")} />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {Object.values(PaymentSource).map((source) => (
                                                            <SelectItem key={source} value={source}>
                                                                {tCollect(`collectionMethods.${source}`)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.source && (
                                            <p className="text-xs text-red-500">{errors.source.message}</p>
                                        )}
                                    </div>

                                    {/* Currency */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                            {t("fields.currency")} *
                                        </Label>
                                        <Controller
                                            name="currency"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className={SELECT_CLS}>
                                                        <SelectValue placeholder={t("placeholders.currency")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {currencies.map((curr) => (
                                                            <SelectItem key={curr} value={curr}>
                                                                {curr}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.currency && (
                                            <p className="text-xs text-red-500">{errors.currency.message}</p>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                            {t("fields.amount")} *
                                        </Label>
                                        <Controller
                                            name="amount"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    placeholder={t("placeholders.amount")}
                                                    className={INPUT_CLS}
                                                />
                                            )}
                                        />
                                        {errors.amount && (
                                            <p className="text-xs text-red-500">{errors.amount.message}</p>
                                        )}
                                        {/* <p className="text-xs text-gray-500">
                                            {t("hints.maxAmount")}: {formatCurrency(order.finalTotal - (order.collectedAmount || 0))} {t("currency")}
                                        </p> */}
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                            {t("fields.notes")}
                                        </Label>
                                        <Controller
                                            name="notes"
                                            control={control}
                                            render={({ field }) => (
                                                <Textarea
                                                    {...field}
                                                    placeholder={t("placeholders.notes")}
                                                    className="rounded-xl min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* Financial Summary Card */}
                        {/* <SectionCard title={t("sections.financialSummary")} icon={DollarSign} delay={0.25}>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {t("fields.orderTotal")}
                                    </span>
                                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                        {formatCurrency(order.finalTotal)} {t("currency")}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-slate-800">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {t("fields.shippingCost")}
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(order.shippingCost)} {t("currency")}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-slate-800">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {t("fields.deposit")}
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(order.deposit)} {t("currency")}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-3 border-t-2 border-primary/20 bg-primary/5 rounded-lg px-3 mt-3">
                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                        {t("fields.amountDue")}
                                    </span>
                                    <span className="font-bold text-2xl text-primary">
                                        {formatCurrency(order.finalTotal - (order.collectedAmount || 0))} {t("currency")}
                                    </span>
                                </div>

                                {order.collectedAmount > 0 && (
                                    <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-slate-800">
                                        <span className="text-sm text-emerald-600 dark:text-emerald-400">
                                            {t("fields.collectedAmount")}
                                        </span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(order.collectedAmount)} {t("currency")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </SectionCard> */}

                        {/* Shipping Information */}
                        {/* {order.shippingCompany && (
                            <SectionCard title={t("sections.shippingInfo")} icon={Truck} delay={0.3}>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Truck size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {order.shippingCompany.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t("fields.currentShippingCompany")}
                                        </p>
                                    </div>
                                </div>
                            </SectionCard>
                        )} */}
                    </div>

                    {/* ═══════════════════════════════════════════════
					    RIGHT COLUMN — Collection Form (1/3 width)
					═══════════════════════════════════════════════ */}

                </div>
            </form>
        </motion.div>
    );
}