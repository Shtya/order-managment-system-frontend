"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Loader2,
    Truck,
    PlusCircle,
    FileDown,
    Edit2,
    Trash2,
    Eye,
    Power,
    PowerOff,
    Layers,
    CreditCard,
    DollarSign,
    Store,
    Scale,
    MapPin,
    Info,
    FlaskConical,
    CheckCircle2,
    Plus,
    X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { cn } from "@/utils/cn";

// ── Shared Table system (same as call-center roles tab) ─────────────────────
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import Button_ from "@/components/atoms/Button";
import MultiSelect from "@/components/atoms/MultiSelect";

// ── Rule types & payment methods ─────────────────────────────────────────────
const RULE_TYPES = [
    "equal_distribution",
    "payment_method",
    "order_total",
    "store",
    "city",
];

const PAYMENT_METHODS = [
    "cash",
    "card",
    "bank_transfer",
    "cod",
    "other",
    "wallet",
    "unknown",
];

const toNumberOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
};

// ── Form Schema: single inputs per rule type (like call-center, no row lists) ─
const ruleSchema = (t) => yup.lazy((value) => {
    let conditionalShape = {};

    switch (value?.ruleType) {
        case 'equal_distribution':
            conditionalShape = {
                targetCompanyIds: yup.array().of(yup.string()).min(1, t("validation.companiesRequired")),
            };
            break;
        case 'payment_method':
            conditionalShape = {
                paymentMethod: yup.string().required(t("validation.paymentMethodRequired")),
                companyId: yup.string().required(t("validation.companyRequired")),
            };
            break;
        case 'order_total':
            conditionalShape = {
                companyId: yup.string().required(t("validation.companyRequired")),
                minAmount: yup.number().typeError(t("validation.invalidNumber")).nullable().optional(),
                maxAmount: yup.number().typeError(t("validation.invalidNumber")).nullable().optional().test(
                    "max-gte-min",
                    t("validation.minMaxInvalid"),
                    (val) => {
                        const min = toNumberOrNull(value?.minAmount);
                        const max = toNumberOrNull(val);
                        if (min == null || max == null) return true;
                        return max >= min;
                    }
                ),
            };
            break;
        case 'store':
            conditionalShape = {
                storeIds: yup.array().of(yup.string()).min(1, t("validation.storesRequired")),
                companyId: yup.string().required(t("validation.companyRequired")),
            };
            break;
        case 'city':
            conditionalShape = {
                cityIds: yup.array().of(yup.string()).min(1, t("validation.citiesRequired")),
                companyId: yup.string().required(t("validation.companyRequired")),
            };
            break;
        default:
            break;
    }

    return yup.object({
        name: yup.string().required(t("validation.nameRequired")),
        description: yup.string().optional().nullable(),
        priority: yup.number().typeError(t("validation.invalidNumber")).required(t("validation.priorityRequired")).min(1, t("validation.priorityMin")),
        isActive: yup.boolean().default(true),
        ruleType: yup.string().required(t("validation.ruleTypeRequired")),
        ...conditionalShape,
    });
});

// ── Single company select (options come from activeIntegrations) ─────────────
function CompanySelect({ value, onChange, companies, placeholder }) {
    return (
        <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger className="h-[50px] rounded-xl">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                        {c.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// ── Rule Form Dialog ─────────────────────────────────────────────────────────
function RuleFormDialog({ open, onOpenChange, rule, onSuccess, companies, stores, cities }) {
    const t = useTranslations("shippingAssigning");
    const schema = useMemo(() => ruleSchema(t), [t]);
    const isEditMode = !!rule;

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            description: "",
            priority: 1,
            isActive: true,
            ruleType: "equal_distribution",
            companyId: "",
            targetCompanyIds: [],
            paymentMethod: "",
            minAmount: "",
            maxAmount: "",
            storeIds: [],
            cityIds: [],
        },
    });

    const selectedRuleType = watch("ruleType");

    useEffect(() => {
        if (rule && open) {
            const condition = rule.condition || {};
            reset({
                name: rule.name || "",
                description: rule.description || "",
                priority: rule.priority ?? 1,
                isActive: rule.isActive ?? true,
                ruleType: rule.ruleType || "equal_distribution",
                companyId: rule.targetCompanies?.[0]?.id || "",
                targetCompanyIds: rule.targetCompanies?.map(c => c.id) || [],
                paymentMethod: condition.paymentMethod || "",
                minAmount: condition.minAmount ?? "",
                maxAmount: condition.maxAmount ?? "",
                storeIds: condition.storeIds || rule.stores?.map(s => s.id) || [],
                cityIds: condition.cityIds || [],
            });
        } else if (!rule && open) {
            reset({
                name: "",
                description: "",
                priority: 1,
                isActive: true,
                ruleType: "equal_distribution",
                companyId: "",
                targetCompanyIds: [],
                paymentMethod: "",
                minAmount: "",
                maxAmount: "",
                storeIds: [],
                cityIds: [],
            });
        }
    }, [rule, open, reset]);

    const onSubmit = async (data) => {
        try {
            let targetCompanyIds = [];
            let condition = {};

            switch (data.ruleType) {
                case 'equal_distribution':
                    // Many companies, always equally distributed — no percents.
                    targetCompanyIds = data.targetCompanyIds || [];
                    break;
                case 'payment_method':
                    targetCompanyIds = [data.companyId];
                    condition = { paymentMethod: data.paymentMethod };
                    break;
                case 'order_total':
                    targetCompanyIds = [data.companyId];
                    condition = {
                        minAmount: toNumberOrNull(data.minAmount),
                        maxAmount: toNumberOrNull(data.maxAmount),
                    };
                    break;
                case 'store':
                    targetCompanyIds = [data.companyId];
                    condition = { storeIds: data.storeIds || [] };
                    break;
                case 'city':
                    targetCompanyIds = [data.companyId];
                    condition = { cityIds: data.cityIds || [] };
                    break;
                default:
                    break;
            }

            const payload = {
                name: data.name,
                description: data.description || null,
                priority: Number(data.priority),
                isActive: data.isActive,
                targetCompanyIds,
                condition,
            };

            if (isEditMode) {
                await api.patch(`/shipping-assigning/rules/${rule.id}`, payload);
            } else {
                await api.post("/shipping-assigning/rules", { ...payload, ruleType: data.ruleType });
            }

            toast.success(t("validation.saveSuccess"));
            onSuccess();
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || t("validation.saveError"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-4xl! w-full p-0 bg-white dark:bg-slate-950"
                style={{ maxHeight: "90vh", overflowY: "auto", display: "block" }}
            >
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            {rule ? <Edit2 size={20} /> : <Truck size={20} />}
                        </div>
                        {rule ? t("actions.edit") : t("toolbar.addRule")}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 bg-card">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t("form.name")}</Label>
                            <Input {...register("name")} placeholder={t("form.name")} className="rounded-xl h-[50px]" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold" description={t("form.priorityDescription")}>{t("form.priority")}</Label>
                            <Input type="number" {...register("priority")} className="rounded-xl h-[50px]" />
                            {errors.priority && <p className="text-xs text-red-600">{errors.priority.message}</p>}
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label className="text-sm font-semibold">{t("form.description")}</Label>
                            <Textarea {...register("description")} placeholder={t("form.descriptionPlaceholder")} className="rounded-xl min-h-[80px]" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold" description={t("form.ruleTypeDescription")}>{t("form.ruleType")}</Label>
                            <Controller
                                control={control}
                                name="ruleType"
                                render={({ field }) => (
                                    <Select disabled={isEditMode} value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-[50px] rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RULE_TYPES.map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {t(`stats.${type}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <Controller
                                control={control}
                                name="isActive"
                                render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                            <Label className="text-sm font-semibold" description={t("form.isActiveDescription")}>{t("form.isActive")}</Label>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4 mt-4">
                        {selectedRuleType === "equal_distribution" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold" description={t("form.targetCompaniesDescription")}>{t("form.targetCompanies")}</Label>
                                <Controller
                                    control={control}
                                    name="targetCompanyIds"
                                    render={({ field }) => (
                                        <MultiSelect
                                            options={companies}
                                            value={field.value || []}
                                            initialValues={rule?.targetCompanies || []}
                                            onChange={(newVal) => field.onChange(newVal.map(v => typeof v === 'string' ? v : v.id))}
                                            placeholder={t("form.targetCompanies")}
                                            labelKey="name"
                                        />
                                    )}
                                />
                                {errors.targetCompanyIds && <p className="text-xs text-red-600">{errors.targetCompanyIds.message}</p>}
                            </div>
                        )}

                        {selectedRuleType === "payment_method" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.paymentMethod")}</Label>
                                    <Controller
                                        control={control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <Select value={field.value || ""} onValueChange={field.onChange}>
                                                <SelectTrigger className="h-[50px] rounded-xl">
                                                    <SelectValue placeholder={t("form.paymentMethod")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PAYMENT_METHODS.map(m => (
                                                        <SelectItem key={m} value={m}>{t(`paymentMethods.${m}`)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.paymentMethod && <p className="text-xs text-red-600">{errors.paymentMethod.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.company")}</Label>
                                    <Controller
                                        control={control}
                                        name="companyId"
                                        render={({ field }) => (
                                            <CompanySelect value={field.value} onChange={field.onChange} companies={companies} placeholder={t("form.company")} />
                                        )}
                                    />
                                    {errors.companyId && <p className="text-xs text-red-600">{errors.companyId.message}</p>}
                                </div>
                            </div>
                        )}

                        {selectedRuleType === "order_total" && (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.minAmount")}</Label>
                                    <Input type="number" {...register("minAmount")} className="rounded-xl h-[50px]" />
                                    {errors.minAmount && <p className="text-xs text-red-600">{errors.minAmount.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.maxAmount")}</Label>
                                    <Input type="number" {...register("maxAmount")} className="rounded-xl h-[50px]" />
                                    {errors.maxAmount && <p className="text-xs text-red-600">{errors.maxAmount.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.company")}</Label>
                                    <Controller
                                        control={control}
                                        name="companyId"
                                        render={({ field }) => (
                                            <CompanySelect value={field.value} onChange={field.onChange} companies={companies} placeholder={t("form.company")} />
                                        )}
                                    />
                                    {errors.companyId && <p className="text-xs text-red-600">{errors.companyId.message}</p>}
                                </div>
                            </div>
                        )}

                        {selectedRuleType === "city" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.cityIds")}</Label>
                                    <Controller
                                        control={control}
                                        name="cityIds"
                                        render={({ field }) => (
                                            <MultiSelect
                                                endpoint="/lookups/cities"
                                                params={{ limit: 200 }}
                                                options={cities}
                                                value={field.value || []}
                                                initialValues={(cities || []).filter((c) => (field.value || []).includes(c.id))}
                                                onChange={(newVal) => field.onChange(newVal.map(v => typeof v === 'string' ? v : v.id))}
                                                placeholder={t("form.cityIds")}
                                                labelKey="nameEn"
                                            />
                                        )}
                                    />
                                    {errors.cityIds && <p className="text-xs text-red-600">{errors.cityIds.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.company")}</Label>
                                    <Controller
                                        control={control}
                                        name="companyId"
                                        render={({ field }) => (
                                            <CompanySelect value={field.value} onChange={field.onChange} companies={companies} placeholder={t("form.company")} />
                                        )}
                                    />
                                    {errors.companyId && <p className="text-xs text-red-600">{errors.companyId.message}</p>}
                                </div>
                            </div>
                        )}

                        {selectedRuleType === "store" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.storeIds")}</Label>
                                    <Controller
                                        control={control}
                                        name="storeIds"
                                        render={({ field }) => (
                                            <MultiSelect
                                                options={stores}
                                                value={field.value || []}
                                                initialValues={rule?.stores || []}
                                                onChange={(newVal) => field.onChange(newVal.map(v => typeof v === 'string' ? v : v.id))}
                                                placeholder={t("form.storeIds")}
                                                labelKey="name"
                                            />
                                        )}
                                    />
                                    {errors.storeIds && <p className="text-xs text-red-600">{errors.storeIds.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">{t("form.company")}</Label>
                                    <Controller
                                        control={control}
                                        name="companyId"
                                        render={({ field }) => (
                                            <CompanySelect value={field.value} onChange={field.onChange} companies={companies} placeholder={t("form.company")} />
                                        )}
                                    />
                                    {errors.companyId && <p className="text-xs text-red-600">{errors.companyId.message}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            {t("form.cancel")}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : t("form.save")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Rule View Dialog ─────────────────────────────────────────────────────────
function RuleViewDialog({ open, onOpenChange, rule, companies, stores, cities }) {
    const t = useTranslations("shippingAssigning");
    const locale = useLocale();
    if (!rule) return null;

    const condition = rule.condition || {};
    const companyName = (id) => companies.find(c => c.id === id)?.name || rule.targetCompanies?.find(c => c.id === id)?.name || id;
    const storeName = (id) => stores.find(s => s.id === id)?.name || rule.stores?.find(s => s.id === id)?.name || id;
    const cityName = (id) => {
        const c = cities.find(c => c.id === id);
        if (!c) return id;
        return locale?.startsWith("ar")
            ? (c.nameAr || c.nameEn || c.name || id)
            : (c.nameEn || c.nameAr || c.name || id);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle>{t("actions.view")}</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium block">{t("form.name")}</span>
                            <span className="font-semibold text-base">{rule?.name}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium block">{t("form.ruleType")}</span>
                            <Badge variant="outline" className="capitalize">{t(`stats.${rule?.ruleType}`)}</Badge>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium block">{t("form.priority")}</span>
                            <span className="font-semibold">{rule?.priority}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium block">{t("form.company")}</span>
                            <span className="font-semibold">
                                {rule?.ruleType === 'equal_distribution'
                                    ? (rule?.targetCompanies || []).map(c => c.name || companyName(c.id)).join(", ") || "—"
                                    : companyName(rule?.targetCompanies?.[0]?.id)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <span className="text-sm text-muted-foreground font-medium block">{t("form.targetCompanies")}</span>
                        <div className="flex flex-wrap gap-2">
                            {(rule?.targetCompanies || []).map(c => (
                                <Badge key={c.id} variant="secondary" className="px-3 py-1">
                                    {c.name || companyName(c.id)}
                                </Badge>
                            ))}
                            {(!rule?.targetCompanies || rule.targetCompanies.length === 0) && (
                                <span className="text-sm text-muted-foreground">—</span>
                            )}
                        </div>
                    </div>

                    {rule?.description && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.description")}</span>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words" title={rule.description}>
                                {rule.description}
                            </p>
                        </div>
                    )}

                    {rule?.ruleType === 'payment_method' && condition.paymentMethod && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.paymentMethod")}</span>
                            <Badge variant="secondary" className="text-base px-4 py-1 capitalize">
                                {t(`paymentMethods.${condition.paymentMethod}`, condition.paymentMethod)}
                            </Badge>
                        </div>
                    )}

                    {rule?.ruleType === 'order_total' && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("stats.order_total")}</span>
                            <div className="flex items-center gap-4">
                                <div className="bg-muted/50 p-3 rounded-xl flex-1 border border-border/50">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">{t("form.minAmount")}</span>
                                    <span className="font-mono text-lg font-bold">{condition.minAmount ?? '∞'}</span>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-xl flex-1 border border-border/50">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">{t("form.maxAmount")}</span>
                                    <span className="font-mono text-lg font-bold">{condition.maxAmount ?? '∞'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {rule?.ruleType === 'store' && ((condition.storeIds?.length || 0) > 0) && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.storeIds")}</span>
                            <div className="flex flex-wrap gap-2">
                                {condition.storeIds.map((id) => (
                                    <Badge key={id} variant="outline" className="px-3 py-1">
                                        {storeName(id)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {rule?.ruleType === 'city' && ((condition.cityIds?.length || 0) > 0) && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.cityIds")}</span>
                            <div className="flex flex-wrap gap-2">
                                {condition.cityIds.map((id) => (
                                    <Badge key={id} variant="outline" className="px-3 py-1">
                                        {cityName(id)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Test Match Dialog (toolbar action) ───────────────────────────────────────
// Simulates the backend in memory: sends the order lines (1-5) through the
// side-effect-free preview endpoint — one result row per order, showing the
// applied rule and chosen company. All fields are required before Test.
const MAX_TEST_ORDERS = 5;

const emptyTestOrder = () => ({ paymentMethod: "", finalTotal: "", storeId: "", cityId: "" });

function TestDialog({ open, onOpenChange, companies, stores, cities }) {
    const t = useTranslations("shippingAssigning");
    const locale = useLocale();
    const cityLabel = (c) => {
        if (!c) return "";
        if (typeof c !== "object") return String(c);
        return locale?.startsWith("ar")
            ? (c.nameAr || c.nameEn || c.name || c.id)
            : (c.nameEn || c.nameAr || c.name || c.id);
    };
    const [orders, setOrders] = useState([emptyTestOrder()]);
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (open) {
            setOrders([emptyTestOrder()]);
            setTouched(false);
            setLoading(false);
            setResults([]);
        }
    }, [open]);

    const setOrderField = (idx, field, value) => {
        setResults([]);
        setOrders((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
    };

    const addOrder = () => {
        if (orders.length >= MAX_TEST_ORDERS) return;
        setResults([]);
        setOrders((prev) => [...prev, emptyTestOrder()]);
    };

    const removeOrder = (idx) => {
        if (orders.length <= 1) return;
        setResults([]);
        setOrders((prev) => prev.filter((_, i) => i !== idx));
    };

    const lineError = (o) => {
        if (!o.paymentMethod) return t("validation.paymentMethodRequired");
        if (o.finalTotal === "" || o.finalTotal == null) return t("validation.finalTotalRequired");
        if (!o.storeId) return t("validation.storesRequired");
        if (!o.cityId) return t("validation.cityRequired");
        return null;
    };

    const canTest = orders.length > 0 && orders.every((o) => !lineError(o));

    const handleTest = async () => {
        setTouched(true);
        if (!canTest) return;
        setLoading(true);
        setResults([]);
        try {
            const batch = orders.map((o, idx) => ({
                paymentMethod: o.paymentMethod,
                finalTotal: Number(o.finalTotal),
                storeId: o.storeId,
                cityId: o.cityId,
                label: `${idx + 1}`,
            }));
            const res = await api.post("/shipping-assigning/preview", { orders: batch });
            setResults(res.data?.results || []);
        } catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || t("preview.error"));
        } finally {
            setLoading(false);
        }
    };

    const companyName = (r) => r?.companyId
        ? (companies.find(c => c.id === r.companyId)?.name || r.companyName || r.companyId)
        : null;

    const orderFacts = (o) => {
        if (!o) return [];
        const city = (cities || []).find(c => c.id === o.cityId);
        return [
            {
                icon: CreditCard,
                label: t("preview.paymentMethod"),
                value: o.paymentMethod ? t(`paymentMethods.${o.paymentMethod}`) : "—",
            },
            {
                icon: DollarSign,
                label: t("preview.finalTotal"),
                value: o.finalTotal !== "" ? o.finalTotal : "—",
            },
            {
                icon: Store,
                label: t("preview.store"),
                value: (stores || []).find(s => s.id === o.storeId)?.name || "—",
            },
            {
                icon: MapPin,
                label: t("preview.city"),
                value: city ? cityLabel(city) : "—",
            },
        ];
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <FlaskConical size={18} className="text-primary" />
                        {t("preview.title")}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-xs text-muted-foreground">{t("preview.description")}</p>
                    <div className="space-y-4">
                        {orders.map((o, idx) => {
                            const err = touched ? lineError(o) : null;
                            return (
                                <div key={idx} className="rounded-2xl border border-border p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-foreground">{t("preview.orderLine", { n: idx + 1 })}</p>
                                        {orders.length > 1 && (
                                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => removeOrder(idx)}>
                                                <X size={13} />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{t("preview.paymentMethod")} *</Label>
                                            <Select value={o.paymentMethod} onValueChange={(v) => setOrderField(idx, "paymentMethod", v)}>
                                                <SelectTrigger className="h-11 rounded-xl">
                                                    <SelectValue placeholder={t("preview.paymentMethod")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PAYMENT_METHODS.map(m => (
                                                        <SelectItem key={m} value={m}>{t(`paymentMethods.${m}`)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{t("preview.finalTotal")} *</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={o.finalTotal}
                                                onChange={(e) => setOrderField(idx, "finalTotal", e.target.value)}
                                                placeholder={t("preview.finalTotal")}
                                                className="rounded-xl h-11"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{t("preview.store")} *</Label>
                                            <Select value={o.storeId} onValueChange={(v) => setOrderField(idx, "storeId", v)}>
                                                <SelectTrigger className="h-11 rounded-xl">
                                                    <SelectValue placeholder={t("preview.store")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stores.map((s) => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{t("preview.city")} *</Label>
                                            <Select value={o.cityId} onValueChange={(v) => setOrderField(idx, "cityId", v)}>
                                                <SelectTrigger className="h-11 rounded-xl">
                                                    <SelectValue placeholder={t("preview.city")} />
                                                </SelectTrigger>
                                            <SelectContent>
                                                {cities.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>{cityLabel(c)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {err && <p className="text-xs text-red-600">{err}</p>}
                                </div>
                            );
                        })}
                        {orders.length < MAX_TEST_ORDERS && (
                            <Button type="button" variant="outline" size="sm" onClick={addOrder}>
                                <Plus size={14} /> {t("preview.addOrder", { max: MAX_TEST_ORDERS })}
                            </Button>
                        )}
                    </div>
                    {results.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">{t("preview.resultsTitle")}</p>
                            {results.map((r, i) => {
                                const matched = Boolean(r.companyId);
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "rounded-xl border p-3.5 space-y-3",
                                            matched
                                                ? "border-emerald-500/25 bg-emerald-500/5"
                                                : "border-amber-500/25 bg-amber-500/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs font-bold text-foreground">
                                                {t("preview.orderLine", { n: i + 1 })}
                                            </span>
                                            {matched ? (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                    <CheckCircle2 size={13} />
                                                    {companyName(r)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                    <Info size={13} />
                                                    {t("preview.noMatch")}
                                                </span>
                                            )}
                                        </div>
                                        {/* <div className="grid grid-cols-2 gap-2">
                                            {orderFacts(orders[i]).map((fact) => (
                                                <div
                                                    key={fact.label}
                                                    className="rounded-lg border border-border/60 bg-background/70 px-2.5 py-2 min-w-0"
                                                >
                                                    <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                                        <fact.icon size={11} className="shrink-0" />
                                                        {fact.label}
                                                    </p>
                                                    <p className="mt-0.5 text-sm font-semibold truncate" title={String(fact.value)}>
                                                        {fact.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div> */}
                                        {matched && (
                                            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-background/70 px-3 py-2.5">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                    <Truck size={15} className="text-emerald-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate">{companyName(r)}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {t("preview.rule")}:{" "}
                                                        <span className="font-semibold text-foreground">{r.ruleName}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <p className="text-[11px] text-muted-foreground">{t("preview.simulationNote")}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            {t("form.cancel")}
                        </Button>
                        <Button onClick={handleTest} disabled={loading || !canTest}>
                            {loading ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
                            {t("preview.testButton")}
                        </Button>
                    </div>
                    {!canTest && (
                        <p className="text-[11px] text-muted-foreground text-end">{t("preview.fillAll")}</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Filters defaults ─────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
    ruleType: "all",
    isActive: "all",
    startDate: null,
    endDate: null,
};

export default function ShippingAssigningPage() {
    const tCommon = useTranslations("common");
    const t = useTranslations("shippingAssigning");

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [testOpen, setTestOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    const [statsData, setStatsData] = useState({ total: 0, active: 0, byType: {} });
    const [companies, setCompanies] = useState([]);
    const [stores, setStores] = useState([]);
    const [cities, setCities] = useState([]);

    const [pager, setPager] = useState({
        total_records: 0,
        current_page: 1,
        per_page: 12,
        records: [],
    });

    const searchTimer = useRef(null);

    /* debounce search */
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    /* companies (activeIntegrations) + stores for selects */
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/shipping/integrations/active");
                const list = res.data?.integrations || [];
                setCompanies(list.map(i => ({ id: i.providerId || i.id, name: i.name, code: i.provider })));
            } catch (e) {
                console.error("Error fetching active shipping companies:", e);
            }
        })();
        (async () => {
            try {
                const res = await api.get("/lookups/stores", { params: { limit: 200 } });
                const data = Array.isArray(res.data) ? res.data : (res.data?.records || res.data?.data || []);
                setStores(data);
            } catch (e) {
                console.error("Error fetching stores:", e);
            }
        })();
        (async () => {
            try {
                const res = await api.get("/lookups/cities", { params: { limit: 200 } });
                const data = Array.isArray(res.data) ? res.data : (res.data?.records || res.data?.data || []);
                setCities(data);
            } catch (e) {
                console.error("Error fetching cities:", e);
            }
        })();
    }, []);

    /* build API params */
    const buildParams = useCallback(
        (page = pager.current_page, per_page = pager.per_page) => {
            const params = { page, limit: per_page };
            if (filters.ruleType !== "all") params.ruleType = filters.ruleType;
            if (filters.isActive !== "all") params.isActive = filters.isActive;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (debouncedSearch) params.search = debouncedSearch;
            return params;
        },
        [debouncedSearch, pager.current_page, pager.per_page, filters],
    );

    const fetchRules = useCallback(
        async (page = pager.current_page, per_page = pager.per_page) => {
            try {
                setLoading(true);
                const res = await api.get("/shipping-assigning/rules", { params: buildParams(page, per_page) });
                const data = res.data ?? {};
                setPager({
                    total_records: data.total_records ?? 0,
                    current_page: data.current_page ?? page,
                    per_page: data.per_page ?? per_page,
                    records: Array.isArray(data.records) ? data.records : [],
                });
            } catch (e) {
                console.error(e);
                toast.error(t("messages.fetchError"));
            } finally {
                setLoading(false);
            }
        },
        [buildParams, t],
    );

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/shipping-assigning/rules/stats");
            setStatsData(res.data || { total: 0, active: 0, byType: {} });
        } catch (e) {
            console.error("Error fetching assigning stats:", e);
        }
    }, []);

    useEffect(() => {
        fetchRules(1, pager.per_page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const applyFilters = () => {
        fetchRules(1, pager.per_page);
    };

    const hasActiveFilters = useMemo(() => (
        filters.ruleType !== "all" ||
        filters.isActive !== "all" ||
        Boolean(filters.startDate) ||
        Boolean(filters.endDate)
    ), [filters]);

    const handleExport = async () => {
        setExportLoading(true);
        const toastId = toast.loading(t("messages.exportStarted"));
        try {
            const params = buildParams();
            delete params.page;
            delete params.limit;
            const res = await api.get("/shipping-assigning/rules/export", {
                params,
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `shipping_assigning_rules_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(t("messages.exportSuccess"), { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(t("messages.exportFailed"), { id: toastId });
        } finally {
            setExportLoading(false);
        }
    };

    const handleDeleteRule = useCallback(async () => {
        try {
            setDeleteLoading(true);
            await api.delete(`/shipping-assigning/rules/${selectedRule.id}`);
            toast.success(t("delete.success"));
            setDeleteOpen(false);
            await Promise.all([
                fetchRules(pager.current_page, pager.per_page),
                fetchStats(),
            ]);
        } catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || t("delete.error"));
        } finally {
            setDeleteLoading(false);
        }
    }, [selectedRule?.id, pager.current_page, pager.per_page, fetchRules, fetchStats, t]);

    const openEdit = useCallback((rule) => {
        setSelectedRule(rule);
        setFormOpen(true);
    }, []);

    const openView = useCallback((rule) => {
        setSelectedRule(rule);
        setViewOpen(true);
    }, []);

    const openDelete = useCallback((rule) => {
        setSelectedRule(rule);
        setDeleteOpen(true);
    }, []);

    const toggleRuleStatus = useCallback(async (rule) => {
        if (togglingId) return;
        try {
            setTogglingId(rule.id);
            await api.post(`/shipping-assigning/rules/${rule.id}/toggle`);
            toast.success(tCommon("success"));
            await Promise.all([
                fetchRules(pager.current_page, pager.per_page),
                fetchStats(),
            ]);
        } catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || tCommon("error"));
        } finally {
            setTogglingId(null);
        }
    }, [fetchRules, fetchStats, tCommon, togglingId, pager.current_page, pager.per_page]);

    /* ── Columns (same shape as call-center ruleColumns, no strategy) ── */
    const ruleColumns = useMemo(
        () => [
            {
                key: "name",
                header: t("columns.name"),
                cell: (row) => (
                    <span className="font-semibold text-foreground">
                        {row.name}
                    </span>
                ),
            },
            {
                key: "description",
                header: t("columns.description"),
                cell: (row) => (
                    <span
                        className="max-w-xs truncate text-muted-foreground block"
                        title={row.description}
                    >
                        {row.description || "-"}
                    </span>
                ),
            },
            {
                key: "ruleType",
                header: t("columns.type"),
                cell: (row) => <Badge variant="outline" className="capitalize">{row.ruleType ? t(`stats.${row.ruleType}`) : null}</Badge>,
            },
            {
                key: "isActive",
                header: t("columns.status"),
                cell: (row) => (
                    <Badge variant={row.isActive ? "secondary" : "success"}>
                        {row.isActive ? t("active") : t("inactive")}
                    </Badge>
                ),
            },
            {
                key: "priority",
                header: t("columns.priority"),
                className: "text-center font-mono",
            },
            {
                key: "companies",
                header: t("columns.companies"),
                cell: (row) => (
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {(row.targetCompanies || []).slice(0, 2).map((c) => (
                            <Badge key={c.id} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                {c.name}
                            </Badge>
                        ))}
                        {(row.targetCompanies || []).length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                +{row.targetCompanies.length - 2}
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                key: "actions",
                header: t("columns.actions"),
                cell: (row) => {
                    const isToggling = togglingId === row.id;
                    return (
                        <ActionButtons
                            row={row}
                            actions={[
                                {
                                    icon: <Eye size={16} />,
                                    tooltip: t("actions.view"),
                                    onClick: (r) => openView(r),
                                    variant: "primary",
                                },
                                {
                                    icon: isToggling ? <Loader2 size={16} className="animate-spin" /> : (row.isActive ? <PowerOff size={16} /> : <Power size={16} />),
                                    tooltip: row.isActive ? tCommon("deactivate") : tCommon("activate"),
                                    onClick: (r) => toggleRuleStatus(r),
                                    variant: row.isActive ? "orange" : "emerald",
                                    permission: "shipping-assigning.update",
                                    disabled: isToggling,
                                },
                                {
                                    icon: <Edit2 size={16} />,
                                    tooltip: t("actions.edit"),
                                    onClick: (r) => openEdit(r),
                                    variant: "primary",
                                    permission: "shipping-assigning.update",
                                },
                                {
                                    icon: <Trash2 size={16} />,
                                    tooltip: t("actions.delete"),
                                    onClick: (r) => openDelete(r),
                                    variant: "red",
                                    permission: "shipping-assigning.delete",
                                },
                            ]}
                        />
                    );
                },
            },
        ],
        [t, tCommon, togglingId, toggleRuleStatus, openView, openEdit, openDelete]
    );

    const typeStats = useMemo(() => [
        { id: "equal_distribution", icon: Scale, color: "#6366f1" },
        { id: "payment_method", icon: CreditCard, color: "#ec4899" },
        { id: "order_total", icon: DollarSign, color: "#8b5cf6" },
        { id: "store", icon: Store, color: "#0ea5e9" },
        { id: "city", icon: MapPin, color: "#10b981" },
    ], []);

    const headerStats = useMemo(() => ([
        {
            id: "total",
            name: t("stats.total"),
            value: statsData.total || 0,
            icon: Layers,
            color: "var(--primary)",
            sortOrder: 1,
        },
        {
            id: "active",
            name: t("stats.active"),
            value: statsData.active || 0,
            icon: CheckCircle2,
            color: "#10b981",
            sortOrder: 2,
        },
        ...typeStats.map((ts, index) => ({
            id: ts.id,
            name: t(`stats.${ts.id}`),
            value: statsData.byType?.[ts.id] || 0,
            icon: ts.icon,
            color: ts.color,
            sortOrder: index + 3,
        })),
    ]), [t, statsData, typeStats]);

    return (
        <div className="min-h-screen p-5">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/dashboard" },
                    { name: t("breadcrumb.shipping"), href: "/shipping-companies" },
                    { name: t("title") },
                ]}
                statsCount={7}
                stats={headerStats}
                buttons={(
                    <div className="flex items-center gap-2">
                        <Button_
                            size="sm"
                            label={t("toolbar.addRule")}
                            variant="solid"
                            onClick={() => {
                                setSelectedRule(null);
                                setFormOpen(true);
                            }}
                            icon={<PlusCircle size={18} />}
                            permission="shipping-assigning.create"
                        />
                    </div>
                )}
            />

            {/* Automation usage note — always visible */}
            <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3.5 mb-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Info size={16} />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{t("note.title")}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {t("note.description")}
                    </p>
                </div>
            </div>

            <Table
                tableKey="shipping-assigning-rules"
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={() => fetchRules(1, pager.per_page)}
                labels={{
                    searchPlaceholder: t("labels.searchPlaceholder"),
                    filter: t("labels.filter"),
                    apply: t("labels.apply"),
                    total: t("labels.total"),
                    limit: t("labels.limit"),
                    emptyTitle: t("labels.emptyTitle"),
                    emptySubtitle: t("labels.emptySubtitle"),
                }}
                filters={(
                    <>
                        <FilterField label={t("labels.ruleType")}>
                            <Select
                                value={filters.ruleType}
                                onValueChange={(v) => setFilters((f) => ({ ...f, ruleType: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder={t("labels.ruleType")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    {RULE_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {t(`stats.${type}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("labels.status")}>
                            <Select
                                value={filters.isActive}
                                onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder={t("labels.status")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{tCommon("all")}</SelectItem>
                                    <SelectItem value="true">{t("active")}</SelectItem>
                                    <SelectItem value="false">{t("inactive")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("labels.date")}>
                            <DateRangePicker
                                value={{
                                    startDate: filters.startDate,
                                    endDate: filters.endDate,
                                }}
                                onChange={(newDates) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        ...newDates,
                                    }))
                                }
                                placeholder={t("labels.date")}
                                dataSize="default"
                                maxDate="today"
                            />
                        </FilterField>
                    </>
                )}
                actions={[
                    {
                        key: "test",
                        label: t("preview.title"),
                        icon: <FlaskConical size={15} />,
                        color: "primary",
                        onClick: () => {
                            setTestOpen(true);
                        },
                        permission: "shipping-assigning.read",
                    },
                    {
                        key: "export",
                        label: t("toolbar.export"),
                        icon: exportLoading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />,
                        color: "primary",
                        onClick: handleExport,
                        disabled: exportLoading,
                        permission: "shipping-assigning.read",
                    },
                ]}
                columns={ruleColumns}
                data={pager.records}
                isLoading={loading}
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) => fetchRules(page, per_page)}
            />

            <RuleFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                rule={selectedRule}
                companies={companies}
                stores={stores}
                cities={cities}
                onSuccess={() => {
                    fetchRules(pager.current_page, pager.per_page);
                    fetchStats();
                }}
            />

            <RuleViewDialog
                open={viewOpen}
                onOpenChange={setViewOpen}
                rule={selectedRule}
                companies={companies}
                stores={stores}
                cities={cities}
            />

            <TestDialog
                open={testOpen}
                onOpenChange={setTestOpen}
                companies={companies}
                stores={stores}
                cities={cities}
            />

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title={t("delete.title")}
                description={t("delete.desc")}
                confirmText={t("delete.confirm")}
                cancelText={t("delete.cancel")}
                loading={deleteLoading}
                onConfirm={handleDeleteRule}
            />
        </div>
    );
}
