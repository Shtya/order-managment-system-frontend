"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Loader2,
    Users,
    CheckCircle,
    XCircle,
    ShoppingBag,
    Lock,
    Activity,
    Plus,
    FileDown,
    Edit2,
    Trash2,
    Eye,
    PlusCircle,
    Layers,
    MapPin,
    CreditCard,
    DollarSign,
    Power,
    PowerOff,
    Settings,
    Settings2,
    Store,
} from "lucide-react";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { useTrendLabelFormatter } from "@/hook/useTrendLabelFormatter";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import { Checkbox } from "@/components/ui/checkbox";


// ── WeekDay Enum & Bitmask Helpers ────────────────────────────────────────────
const WeekDay = {
    SUNDAY: 1 << 0,    // 1
    MONDAY: 1 << 1,    // 2
    TUESDAY: 1 << 2,   // 4
    WEDNESDAY: 1 << 3, // 8
    THURSDAY: 1 << 4,  // 16
    FRIDAY: 1 << 5,    // 32
    SATURDAY: 1 << 6,  // 64
};

const WEEK_DAYS = [
    { key: 'sunday', value: WeekDay.SUNDAY },
    { key: 'monday', value: WeekDay.MONDAY },
    { key: 'tuesday', value: WeekDay.TUESDAY },
    { key: 'wednesday', value: WeekDay.WEDNESDAY },
    { key: 'thursday', value: WeekDay.THURSDAY },
    { key: 'friday', value: WeekDay.FRIDAY },
    { key: 'saturday', value: WeekDay.SATURDAY },
];

const WEEKDAY_BITS = [
    WeekDay.SUNDAY,
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
];

const bitmaskToDays = (mask) => {
    if (!mask) return [];
    return WEEK_DAYS.filter(d => (mask & d.value) !== 0).map(d => d.key);
};

const daysToBitmask = (days) => {
    if (!days || days.length === 0) return null;
    return days.reduce((acc, day) => {
        const dayObj = WEEK_DAYS.find(d => d.key === day);
        return dayObj ? acc | dayObj.value : acc;
    }, 0);
};

const getAvailableWeekdaysBitmask = (activeFromStr, activeUntilStr) => {
    if (!activeUntilStr) {
        return WeekDay.SUNDAY | WeekDay.MONDAY | WeekDay.TUESDAY | WeekDay.WEDNESDAY | WeekDay.THURSDAY | WeekDay.FRIDAY | WeekDay.SATURDAY;
    }

    const start = activeFromStr ? new Date(activeFromStr) : new Date();

    const end = new Date(activeUntilStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    if (totalDays >= 7) {
        return WeekDay.SUNDAY | WeekDay.MONDAY | WeekDay.TUESDAY | WeekDay.WEDNESDAY | WeekDay.THURSDAY | WeekDay.FRIDAY | WeekDay.SATURDAY;
    }

    const startDay = start.getDay();
    let availableMask = 0;

    for (let i = 0; i < totalDays; i++) {
        const dayIndex = (startDay + i) % 7;
        availableMask |= WEEKDAY_BITS[dayIndex];
    }

    return availableMask;
};

const isDayAvailable = (dayKey, availableMask) => {
    const dayObj = WEEK_DAYS.find(d => d.key === dayKey);
    if (!dayObj) return false;
    return (availableMask & dayObj.value) !== 0;
};


// ── Shared Table system ──────────────────────────────────────────────────────
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import DistributionModal from "../orders/atoms/DistrubtionModal";
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

// ── Form Schema ──────────────────────────────────────────────────────────────
const ruleSchema = (t) =>
    yup.object({
        name: yup.string().required(t("validation.nameRequired")),
        description: yup.string().optional().nullable(),
        priority: yup.number().required(t("validation.priorityRequired")).min(1, t("validation.priorityMin")),
        isActive: yup.boolean().default(true),
        ruleType: yup.string().required(t("validation.ruleTypeRequired")),
        strategy: yup.string().required(t("validation.strategyRequired")),

        // Conditional fields
        employeeIds: yup.array().of(yup.string()).min(1, t("validation.employeesRequired")),

        productIds: yup.array().of(yup.string()).when("ruleType", {
            is: "product",
            then: (schema) => schema.min(1, t("validation.productsRequired")),
            otherwise: (schema) => schema.optional().nullable(),
        }),

        cityIds: yup.array().of(yup.string()).when("ruleType", {
            is: "city",
            then: (schema) => schema.min(1, t("validation.citiesRequired")),
            otherwise: (schema) => schema.optional().nullable(),
        }),

        storeIds: yup.array().of(yup.string()).when("ruleType", {
            is: "store",
            then: (schema) => schema.min(1, t("validation.storesRequired")),
            otherwise: (schema) => schema.optional().nullable(),
        }),


        paymentStatus: yup.string().when("ruleType", {
            is: "paymentStatus",
            then: (schema) => schema.required(t("validation.paymentStatusRequired")),
            otherwise: (schema) => schema.optional().nullable(),
        }),

        minAmount: yup.number().nullable().when("ruleType", {
            is: "amountRange",
            then: (schema) => schema.required(t("validation.minAmountRequired")),
            otherwise: (schema) => schema.nullable().optional().nullable(),
        }),

        maxAmount: yup.number().nullable().when("ruleType", {
            is: "amountRange",
            then: (schema) => schema.required(t("validation.maxAmountRequired")).test(
                "max-gte-min",
                t("validation.maxAmountGteMin"),
                function (value) {
                    const { minAmount } = this.parent;
                    if (value == null || minAmount == null) return true;
                    return value >= minAmount;
                }
            ),
            otherwise: (schema) => schema.nullable().optional().nullable(),
        }),

        // New fields
        startTime: yup.string().nullable().optional(),
        endTime: yup.string().nullable().optional().test(
            "end-after-start",
            t("validation.endTimeAfterStartTime"),
            function (value) {
                const { startTime } = this.parent;
                if (!startTime || !value) return true;
                return value > startTime;
            }
        ),

        weekDays: yup.array().of(yup.string()).nullable().optional(),

        activeFrom: yup.string().nullable().optional(),
        activeUntil: yup.string().nullable().optional().test(
            "active-until-after-from",
            t("validation.activeUntilAfterFrom"),
            function (value) {
                const { activeFrom } = this.parent;
                if (!activeFrom || !value) return true;
                return new Date(value) >= new Date(activeFrom);
            }
        ),

        // Temporary UI fields
        timeWindowEnabled: yup.boolean().optional(),
        dateRangeEnabled: yup.boolean().optional(),
    });

// ── Form Components ──────────────────────────────────────────────────────────
function RuleFormDialog({ open, onOpenChange, rule, onSuccess }) {
    const t = useTranslations("callCenter.autoAssign");
    const schema = useMemo(() => ruleSchema(t), [t]);

    const isEditMode = !!rule;
    console.log(isEditMode, rule)
    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            description: "",
            priority: 50,
            isActive: true,
            ruleType: "manual",
            strategy: "roundRobin",
            employeeIds: [],
            productIds: [],
            cityIds: [],
            storeIds: [],
            paymentStatus: null,
            minAmount: null,
            maxAmount: null,
            startTime: null,
            endTime: null,
            weekDays: [],
            activeFrom: null,
            activeUntil: null,
            timeWindowEnabled: false,
            dateRangeEnabled: false,
        },
    });

    const selectedRuleType = watch("ruleType");
    const activeFrom = watch("activeFrom");
    const activeUntil = watch("activeUntil");
    const weekDays = watch("weekDays");
    const startTime = watch("startTime");
    const endTime = watch("endTime");

    // Auto-enable switches when user sets values
    useEffect(() => {
        if ((startTime || endTime) && !watch("timeWindowEnabled")) {
            setValue("timeWindowEnabled", true);
        }
    }, [startTime, endTime, setValue, watch]);

    useEffect(() => {
        if ((activeFrom || activeUntil) && !watch("dateRangeEnabled")) {
            setValue("dateRangeEnabled", true);
        }
    }, [activeFrom, activeUntil, setValue, watch]);

    const availableMask = useMemo(() => getAvailableWeekdaysBitmask(activeFrom, activeUntil), [activeFrom, activeUntil]);
    const allAvailable = useMemo(() => WEEK_DAYS.filter(d => isDayAvailable(d.key, availableMask)).map(d => d.key), [availableMask]);
    const allAvailableDays = useMemo(() => WEEK_DAYS.filter(d => isDayAvailable(d.key, availableMask)).map(d => d.key), [availableMask]);

    const isAllAvailableDaysSelected = useMemo(() =>
        allAvailableDays.length > 0 && allAvailableDays.every(day => weekDays?.includes(day)),
        [allAvailableDays, weekDays]
    );


    useEffect(() => {
        const currentWeekDays = watch("weekDays");
        const filteredWeekDays = currentWeekDays.filter(day => isDayAvailable(day, availableMask));
        if (filteredWeekDays.length !== currentWeekDays.length) {
            setValue("weekDays", filteredWeekDays);
        }
    }, [activeFrom, activeUntil, availableMask]);

    useEffect(() => {
        if (rule && open) {
            reset({
                name: rule.name || "",
                description: rule.description || "",
                priority: rule.priority || 50,
                isActive: rule.isActive ?? true,
                ruleType: rule.ruleType || "manual",
                strategy: rule.strategy || "roundRobin",
                employeeIds: rule.employees?.map(e => e.id) || [],
                productIds: rule.products?.map(p => p.id) || [],
                cityIds: rule.cities?.map(c => c.id) || [],
                storeIds: rule.stores?.map(s => s.id) || [],
                paymentStatus: rule.paymentStatus || null,
                minAmount: rule.minAmount ?? null,
                maxAmount: rule.maxAmount ?? null,
                startTime: rule.startTime || null,
                endTime: rule.endTime || null,
                weekDays: bitmaskToDays(rule.weekDays) || [],
                activeFrom: rule.activeFrom || null,
                activeUntil: rule.activeUntil || null,
                timeWindowEnabled: !!(rule.startTime || rule.endTime),
                dateRangeEnabled: !!(rule.activeFrom || rule.activeUntil),
            });
        } else if (!rule && open) {
            reset({
                name: "",
                description: "",
                priority: 50,
                isActive: true,
                ruleType: "manual",
                strategy: "roundRobin",
                employeeIds: [],
                productIds: [],
                cityIds: [],
                storeIds: [],
                paymentStatus: null,
                minAmount: null,
                maxAmount: null,
                startTime: null,
                endTime: null,
                weekDays: [],
                activeFrom: null,
                activeUntil: null,
                timeWindowEnabled: false,
                dateRangeEnabled: false,
            });
        }
    }, [rule, open, reset]);

    const onSubmit = async (data) => {
        const {
            ruleType,
            weekDays,
            activeFrom,
            activeUntil,
            startTime,
            endTime,
            timeWindowEnabled,
            dateRangeEnabled,
            ...payload
        } = data;

        try {
            const timezone =
                Intl.DateTimeFormat().resolvedOptions().timeZone;

            const finalPayload = {
                ...payload,

                // TIME (KEEP AS STRING ONLY)
                startTime: startTime || null,
                endTime: endTime || null,

                // DATES (REAL ISO)
                activeFrom: activeFrom
                    ? new Date(activeFrom).toISOString()
                    : null,

                activeUntil: activeUntil
                    ? new Date(activeUntil).toISOString()
                    : null,

                // BITMASK
                weekDays: daysToBitmask(weekDays),

                // TIMEZONE (IMPORTANT FIX)
                timezone,
            };

            if (isEditMode) {
                await api.patch(
                    `/order-assignment/rules/${rule.id}`,
                    finalPayload
                );
            } else {
                await api.post(
                    "/order-assignment/rules",
                    { ruleType, ...finalPayload }
                );
            }

            toast.success(t("validation.saveSuccess"));
            onSuccess();
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            toast.error(t("validation.saveError"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto!">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle>{rule ? t("actions.edit") : t("toolbar.addRole")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t("form.name")}</Label>
                            <Input {...register("name")} className="rounded-xl h-[50px]" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t("form.priority")}</Label>
                            <Input type="number" {...register("priority")} className="rounded-xl h-[50px]" />
                            {errors.priority && <p className="text-xs text-red-600">{errors.priority.message}</p>}
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label className="text-sm font-semibold">{t("form.description")}</Label>
                            <Textarea {...register("description")} className="rounded-xl min-h-[100px]" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t("form.ruleType")}</Label>
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

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t("form.strategy")}</Label>
                            <Controller
                                control={control}
                                name="strategy"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-[50px] rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="roundRobin">{t("strategy.roundRobin")}</SelectItem>
                                            <SelectItem value="leastActiveOrders">{t("strategy.leastActiveOrders")}</SelectItem>
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
                            <Label className="text-sm font-semibold">{t("form.isActive")}</Label>
                        </div>
                    </div>

                    {/* New Fields */}
                    <div className="space-y-4 border-t pt-4">
                        {/* Time Window */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Controller
                                    control={control}
                                    name="timeWindowEnabled"
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value || (watch("startTime") || watch("endTime"))}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked);
                                                if (!checked) {
                                                    setValue("startTime", null);
                                                    setValue("endTime", null);
                                                }
                                            }}
                                        />
                                    )}
                                />
                                <Label className="text-sm font-semibold">{t("form.startTime")} / {t("form.endTime")}</Label>
                            </div>
                            {(watch("timeWindowEnabled") || watch("startTime") || watch("endTime")) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">{t("form.startTime")}</Label>
                                        <Input
                                            type="time"
                                            {...register("startTime")}
                                            className="rounded-xl h-[50px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">{t("form.endTime")}</Label>
                                        <Input
                                            type="time"
                                            {...register("endTime")}
                                            className="rounded-xl h-[50px]"
                                        />
                                        {errors.endTime && <p className="text-xs text-red-600">{errors.endTime.message}</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date Range */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Controller
                                    control={control}
                                    name="dateRangeEnabled"
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value || (watch("activeFrom") || watch("activeUntil"))}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked);
                                                if (!checked) {
                                                    setValue("activeFrom", null);
                                                    setValue("activeUntil", null);
                                                }
                                            }}
                                        />
                                    )}
                                />
                                <Label className="text-sm font-semibold">{t("form.activeFrom")} / {t("form.activeUntil")}</Label>
                            </div>
                            {(watch("dateRangeEnabled") || watch("activeFrom") || watch("activeUntil")) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">{t("form.activeFrom")}</Label>
                                        <DateRangePicker
                                            mode="single"
                                            value={watch("activeFrom")}
                                            onChange={(date) => {
                                                setValue("activeFrom", date ? new Date(date) : null);
                                            }}
                                            minDate="today"
                                            maxDate={null}
                                            dataSize="default"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">{t("form.activeUntil")}</Label>
                                        <DateRangePicker
                                            mode="single"
                                            value={watch("activeUntil")}
                                            onChange={(date) => {
                                                setValue("activeUntil", date ? new Date(date) : null);
                                            }}
                                            minDate="today"
                                            maxDate={null}
                                            dataSize="default"
                                        />
                                        {errors.activeUntil && <p className="text-xs text-red-600">{errors.activeUntil.message}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Week Days */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label className="text-sm font-semibold">{t("form.weekDays")}</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (isAllAvailableDaysSelected) {
                                            setValue("weekDays", []);
                                        } else {
                                            setValue("weekDays", allAvailable);
                                        }
                                    }}
                                >
                                    {(() => {
                                        return isAllAvailableDaysSelected ? t("form.deselectAll") : t("form.selectAll");
                                    })()}
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                {WEEK_DAYS.map((day) => {
                                    const isAvailable = isDayAvailable(day.key, availableMask);
                                    return (
                                        <div key={day.key} className="flex items-center gap-2">
                                            <Controller
                                                control={control}
                                                name="weekDays"
                                                render={({ field }) => {
                                                    const isChecked = field.value?.includes(day.key);
                                                    return (
                                                        <Checkbox
                                                            checked={isChecked}
                                                            disabled={!isAvailable}
                                                            onCheckedChange={(checked) => {
                                                                if (!isAvailable) return;
                                                                const newVal = checked
                                                                    ? [...(field.value || []), day.key]
                                                                    : (field.value || []).filter(d => d !== day.key);
                                                                field.onChange(newVal);
                                                            }}
                                                        />
                                                    );
                                                }}
                                            />
                                            <Label className={`text-sm ${isAvailable ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
                                                {t(`days.${day.key}`)}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t("form.weekDaysNote")}
                            </p>
                        </div>


                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">{t("form.employees")}</Label>
                            <Controller
                                control={control}
                                name="employeeIds"
                                render={({ field }) => (
                                    <MultiSelect
                                        endpoint="/users/list"
                                        params={{ active: "true" }}
                                        value={field.value}
                                        initialValues={rule?.employees || []}
                                        onChange={(newVal) => field.onChange(newVal.map(v => typeof v === 'string' ? v : v.id))}
                                        placeholder={t("form.employees")}
                                        labelKey="name"
                                    />
                                )}
                            />
                            {errors.employeeIds && <p className="text-xs text-red-600">{errors.employeeIds.message}</p>}
                        </div>

                        {selectedRuleType === "product" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t("form.products")}</Label>
                                <Controller
                                    control={control}
                                    name="productIds"
                                    render={({ field }) => (
                                        <MultiSelect
                                            endpoint="/products"
                                            params={{ isActive: "true", type: "PRODUCT" }}
                                            value={field.value}
                                            initialValues={rule?.products || []}
                                            onChange={(newVal) => field.onChange(newVal.map(v => typeof v === 'string' ? v : v.id))}
                                            placeholder={t("form.products")}
                                            labelKey="name"
                                        />
                                    )}
                                />
                                {errors.productIds && <p className="text-xs text-red-600">{errors.productIds.message}</p>}
                            </div>
                        )}

                        {selectedRuleType === "city" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t("form.cities")}</Label>
                                <Controller
                                    control={control}
                                    name="cityIds"
                                    render={({ field }) => (
                                        <MultiSelect
                                            endpoint="/cities"
                                            params={{ isActive: "true" }}
                                            value={field.value}
                                            initialValues={rule?.cities || []}
                                            onChange={(newVal) => field.onChange(newVal.map(v => typeof v === 'string' ? v : v.id))}
                                            placeholder={t("form.cities")}
                                            labelKey="nameEn"
                                        />
                                    )}
                                />
                                {errors.cityIds && <p className="text-xs text-red-600">{errors.cityIds.message}</p>}
                            </div>
                        )}

                        {selectedRuleType === "store" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t("form.stores")}</Label>
                                <Controller
                                    control={control}
                                    name="storeIds"
                                    render={({ field }) => (
                                        <MultiSelect
                                            endpoint="/lookups/stores"
                                            params={{ limit: 200, isActive: "true" }}
                                            value={field.value}
                                            initialValues={rule?.stores || []}
                                            onChange={(newVal) => field.onChange(newVal.map(v => typeof v === 'string' ? v : v.id))}
                                            placeholder={t("form.stores")}
                                            labelKey="name"
                                        />
                                    )}
                                />
                                {errors.storeIds && <p className="text-xs text-red-600">{errors.storeIds.message}</p>}
                            </div>
                        )}


                        {selectedRuleType === "paymentStatus" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">{t("form.paymentStatus")}</Label>
                                <Controller
                                    control={control}
                                    name="paymentStatus"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="h-[50px] rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">{t("paymentStatuses.pending")}</SelectItem>
                                                <SelectItem value="paid">{t("paymentStatuses.paid")}</SelectItem>
                                                <SelectItem value="partial">{t("paymentStatuses.partial")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.paymentStatus && <p className="text-xs text-red-600">{errors.paymentStatus.message}</p>}
                            </div>
                        )}

                        {selectedRuleType === "amountRange" && (
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
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

function RuleViewDialog({ open, onOpenChange, rule }) {
    const t = useTranslations("callCenter.autoAssign");
    const locale = useLocale();
    const formatIntl = useFormatter();
    const { formatTrendLabel } = useTrendLabelFormatter();
    const { timezone = "Africa/Cairo" } = rule ?? {};
    const formatTime = (timeStr) => {
        if (!timeStr) return "—";
        const [hours, minutes] = timeStr.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes || 0, 0, 0);
        return formatIntl.dateTime(date, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: timezone,
        });
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
                            <span className="text-muted-foreground font-medium block">{t("form.strategy")}</span>
                            <span className="font-semibold">{t(`strategy.${rule?.strategy}`)}</span>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium block">{t("form.priority")}</span>
                            <span className="font-semibold">{rule?.priority}</span>
                        </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <span className="text-sm text-muted-foreground font-medium block">{t("form.employees")}</span>
                        <div className="flex flex-wrap gap-2">
                            {rule?.employees?.map(e => (
                                <Badge key={e.id} variant="secondary" className="px-3 py-1">
                                    {e.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {rule?.description && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.description")}</span>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words line-clamp-4 hover:line-clamp-none transition-all cursor-pointer" title={rule.description}>
                                {rule.description}
                            </p>
                        </div>
                    )}

                    {/* Show related entities based on type */}
                    {rule?.ruleType === 'product' && rule.products?.length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.products")}</span>
                            <div className="flex flex-wrap gap-2">
                                {rule.products.map(p => (
                                    <Badge key={p.id} variant="outline">
                                        {locale === 'ar' ? (p.nameAr || p.nameEn || p.name) : (p.nameEn || p.nameAr || p.name)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {rule?.ruleType === 'city' && rule.cities?.length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.cities")}</span>
                            <div className="flex flex-wrap gap-2">
                                {rule.cities.map(c => (
                                    <Badge key={c.id} variant="outline">
                                        {locale === 'ar' ? (c.nameAr || c.nameEn || c.name) : (c.nameEn || c.nameAr || c.name)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {rule?.ruleType === 'store' && rule.stores?.length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.stores")}</span>
                            <div className="flex flex-wrap gap-2">
                                {rule.stores.map(s => (
                                    <Badge key={s.id} variant="outline">
                                        {locale === 'ar' ? (s.nameAr || s.nameEn || s.name) : (s.nameEn || s.nameAr || s.name)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {rule?.ruleType === 'amountRange' && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("stats.amountRange")}</span>
                            <div className="flex items-center gap-4">
                                <div className="bg-muted/50 p-3 rounded-xl flex-1 border border-border/50">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">{t("form.minAmount")}</span>
                                    <span className="font-mono text-lg font-bold">{rule.minAmount ?? 0}</span>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-xl flex-1 border border-border/50">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">{t("form.maxAmount")}</span>
                                    <span className="font-mono text-lg font-bold">{rule.maxAmount ?? '∞'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {rule?.ruleType === 'paymentStatus' && rule.paymentStatus && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.paymentStatus")}</span>
                            <Badge variant="secondary" className="text-base px-4 py-1 capitalize">
                                {t(`paymentStatuses.${rule.paymentStatus}`)}
                            </Badge>
                        </div>
                    )}

                    {/* New Fields */}
                    {(rule?.startTime || rule?.endTime) && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.startTime")} / {t("form.endTime")}</span>
                            <div className="flex items-center gap-4">
                                <div className="bg-muted/50 p-3 rounded-xl flex-1 border border-border/50">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">{t("form.startTime")}</span>
                                    <span className="font-mono text-lg font-bold">{formatTime(rule.startTime)}</span>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-xl flex-1 border border-border/50">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">{t("form.endTime")}</span>
                                    <span className="font-mono text-lg font-bold">{formatTime(rule.endTime)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {rule?.weekDays && bitmaskToDays(rule.weekDays).length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.weekDays")}</span>
                            <div className="flex flex-wrap gap-2">
                                {bitmaskToDays(rule.weekDays).map(day => (
                                    <Badge key={day} variant="outline" className="px-3 py-1">
                                        {t(`days.${day}`)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {(rule?.activeFrom || rule?.activeUntil) && (
                        <div className="space-y-2 border-t pt-4">
                            <span className="text-sm text-muted-foreground font-medium block">{t("form.activeFrom")} / {t("form.activeUntil")}</span>
                            <div className="flex items-center gap-4">
                                <div className="bg-muted/50 p-3 rounded-xl flex-1 border border-border/50">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">{t("form.activeFrom")}</span>
                                    <span className="font-mono text-lg font-bold">{rule.activeFrom ? formatTrendLabel(rule.activeFrom) : "—"}</span>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-xl flex-1 border border-border/50">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">{t("form.activeUntil")}</span>
                                    <span className="font-mono text-lg font-bold">{rule.activeUntil ? formatTrendLabel(rule.activeUntil) : "—"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Stats Configuration ──────────────────────────────────────────────────────
const RULE_TYPES = [
    "manual",
    "product",
    "city",
    "amountRange",
    "paymentStatus",
    "store"
];

const CALL_CENTER_STATS = [
    {
        id: 1,
        code: "new",
        nameKey: "callCenter.stats.new",
        color: "var(--primary)",
        icon: ShoppingBag,
        sortOrder: 1,
    },
    {
        id: 2,
        code: "confirmed",
        nameKey: "callCenter.stats.confirmed",
        color: "#3b82f6",
        icon: CheckCircle,
        sortOrder: 2,
    },
    {
        id: 3,
        code: "cancelled",
        nameKey: "callCenter.stats.cancelled",
        color: "#ef4444",
        icon: XCircle,
        sortOrder: 3,
    },
];

const DEFAULT_FILTERS = {
    ruleType: "all",
    strategy: "all",
    isActive: "all",
    startDate: null,
    endDate: null,
};



export default function CallCenterPage() {
    const tCommon = useTranslations("common");

    const t = useTranslations();
    const { settings, patch, saving, handleSave } = useOrdersSettings();

    const [viewMode, setViewMode] = useState("manual"); // "manual" | "automatic"
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [distributionOpen, setDistributionOpen] = useState(false);

    // Filters state
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    // Auto Assign Rules State
    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewViewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toLocaleDateString();
    const [stats, setStats] = useState([]);
    const [manualStatsData, setManualStatsData] = useState({
        new: 0,
        confirmed: 0,
        cancelled: 0,
    });
    const [autoStatsData, setAutoStatsData] = useState({
        total: 0,
        active: 0,
        byType: {},
    });

    const [pager, setPager] = useState({
        total_records: 0,
        current_page: 1,
        per_page: 12,
        records: [],
    });

    const searchTimer = useRef(null);

    const viewModes = useMemo(() => [
        { id: "manual", label: t("callCenter.tabs.manual"), icon: Users },
        { id: "automatic", label: t("callCenter.tabs.automatic"), icon: Activity },
    ], [t]);

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setSearch("");
        setDebouncedSearch("");
        setFilters(DEFAULT_FILTERS);
        setPager({
            total_records: 0,
            current_page: 1,
            per_page: 12,
            records: [],
        });
    };

    const applyFilters = () => {
        if (viewMode === "manual") {
            fetchEmployeeStats(1, pager.per_page);
        } else {
            fetchAutoAssignRules(1, pager.per_page);
        }
    };

    const hasActiveFilters = useMemo(() => {
        if (viewMode === "manual") return false;
        return (
            filters.ruleType !== "all" ||
            filters.strategy !== "all" ||
            filters.isActive !== "all" ||
            Boolean(filters.startDate) ||
            Boolean(filters.endDate)
        );
    }, [filters, viewMode]);

    /* debounce search */
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    useEffect(() => {
        if (viewMode === "manual") {
            fetchEmployeeStats(1, pager.per_page);
        } else {
            fetchAutoAssignRules(1, pager.per_page);
        }
    }, [debouncedSearch, viewMode]);

    useEffect(() => {
        if (viewMode === "manual") {
            fetchStatsSummary();
        } else {
            fetchAutoRulesStats();
        }
    }, [viewMode]);

    /* build API params */
    const buildParams = useCallback(
        (page = pager.current_page, per_page = pager.per_page) => {
            
            const params = {
                page,
                limit: per_page,
            };
            if (viewMode === "manual") {
                params.startDate = today;
                params.endDate = today;
            } else {
                if (filters.ruleType !== "all") params.ruleType = filters.ruleType;
                if (filters.strategy !== "all") params.strategy = filters.strategy;
                if (filters.isActive !== "all") params.isActive = filters.isActive;
                if (filters.startDate) params.startDate = filters.startDate;
                if (filters.endDate) params.endDate = filters.endDate;
            }
            if (debouncedSearch) params.search = debouncedSearch;
            return params;
        },
        [debouncedSearch, pager.current_page, pager.per_page, today, viewMode, filters],
    );

    /* fetch stats summary */
    const fetchStatsSummary = useCallback(async () => {
        try {
            const [employeesStats, ordersStats] = await Promise.all([
                api.get("/dashboard/employees/stats/summary", {
                    params: {
                        startDate: today,
                        endDate: today,
                        except: ["new"]
                    }
                }),
                api.get("/orders/stats"),
            ]);
            const employeesData = Array.isArray(employeesStats.data) ? employeesStats.data : [];
            const ordersData = Array.isArray(ordersStats.data) ? ordersStats.data : [];

            const getCountByCode = (code) => {
                const item = employeesData.find(stat => stat.code === code);
                return item ? Number(item.count) : 0;
            };

            const getOrderCountByCode = (code) => {
                const item = ordersData.find(stat => stat.code === code);
                return item ? Number(item.count) : 0;
            };

            setManualStatsData({
                new: getOrderCountByCode('new'),
                confirmed: getCountByCode('confirmed'),
                cancelled: getCountByCode('cancelled'),
            });

        } catch (e) {
            console.error("Error fetching stats summary:", e);
            toast.error(t("common.api.errorEmployee"));
        }
    }, [t, today]);

    /* fetch auto assign rules stats */
    const fetchAutoRulesStats = useCallback(async () => {
        try {
            const res = await api.get("/order-assignment/rules/stats");
            setAutoStatsData(res.data);
        } catch (e) {
            console.error("Error fetching auto rules stats:", e);
        }
    }, []);

    /* fetch employee statistics */
    const fetchEmployeeStats = useCallback(
        async (page = pager.current_page, per_page = pager.per_page) => {
            try {
                setLoading(true);
                const res = await api.get("/dashboard/employees/stats", { params: buildParams(page, per_page) });
                const data = res.data ?? {};
                setPager({
                    total_records: data.total_records ?? 0,
                    current_page: data.current_page ?? page,
                    per_page: data.per_page ?? per_page,
                    records: Array.isArray(data.records) ? data.records : [],
                });
            } catch (e) {
                console.error(e);
                toast.error(t("common.api.errorEmployeeStatus"));
            } finally {
                setLoading(false);
            }
        },
        [buildParams, t],
    );

    const fetchAutoAssignRules = useCallback(
        async (page = pager.current_page, per_page = pager.per_page) => {
            try {
                const params = buildParams(page, per_page);
                setLoading(true);
                const res = await api.get("/order-assignment/rules", { params });
                const data = res.data ?? {};
                setPager({
                    total_records: data.total_records ?? 0,
                    current_page: data.current_page ?? page,
                    per_page: data.per_page ?? per_page,
                    records: Array.isArray(data.records) ? data.records : [],
                });
            } catch (e) {
                console.error(e);
                toast.error(t("common.api.error"));
            } finally {
                setLoading(false);
            }
        },
        [buildParams, t],
    );


    const fetchStats = async () => {
        try {
            const response = await api.get("/orders/stats");
            setStats(response.data || []);
        } catch (error) {
        } finally {
        }
    };
    useEffect(() => {
        fetchStats();
    }, []);

    const handleExport = async () => {
        setExportLoading(true);
        const toastId = toast.loading(t("orders.messages.exportStarted"));
        try {
            const endpoint = viewMode === "manual" ? "/dashboard/employees/stats/export" : "/order-assignment/rules/export";
            const params = buildParams();
            delete params.page;
            delete params.limit;

            const res = await api.get(endpoint, {
                params,
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${viewMode === "manual" ? "employee_stats" : "auto_assign_rules"}_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(t("orders.messages.exportSuccess"), { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(t("orders.messages.exportFailed"), { id: toastId });
        } finally {
            setExportLoading(false);
        }
    };
    const [deleteLoading, setDeleteLoading] = useState(false);
    const handleDeleteRule = async () => {
        try {
            setDeleteLoading(true);
            await api.delete(`/order-assignment/rules/${selectedRule.id}`);
            toast.success(t("callCenter.autoAssign.delete.success"));
            setDeleteOpen(false);
            fetchAutoAssignRules(pager.current_page, pager.per_page);
            fetchAutoRulesStats();
        } catch (e) {
            console.error(e);
            toast.error(t("callCenter.autoAssign.delete.error"));
        } finally {
            setDeleteLoading(false);
        }
    };

    const openEdit = (rule) => {
        setSelectedRule(rule);
        setFormOpen(true);
    };

    const openView = (rule) => {
        setSelectedRule(rule);
        setViewViewOpen(true);
    };

    const openDelete = (rule) => {
        setSelectedRule(rule);
        setDeleteOpen(true);
    };

    const toggleRuleStatus = async (rule) => {
        try {
            await api.post(`/order-assignment/rules/${rule.id}/toggle`);
            toast.success(t("common.api.success"));
            fetchAutoAssignRules(pager.current_page, pager.per_page);
            fetchAutoRulesStats();
        } catch (e) {
            console.error(e);
            toast.error(t("common.api.error"));
        }
    };

    /* ── Columns ── */
    const employeeColumns = useMemo(
        () => [
            {
                key: "employeeName",
                header: t("callCenter.columns.employeeName"),
                cell: (row) => (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {row.avatarUrl ? (
                                <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                            ) : (
                                <Users size={14} className="text-primary" />
                            )}
                        </div>
                        <span className="font-semibold text-foreground text-sm">
                            {row.name ?? "—"}
                        </span>
                    </div>
                ),
            },
            {
                key: "isActive",
                header: t("callCenter.columns.status"),
                cell: (row) => (
                    <span style={{ background: "color-mix(in oklab, var(--muted) 50%, var(--card))" }} className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-foreground",

                    )}>
                        {row.isActive ? t("common.statusCodes.active") : t("common.statusCodes.inactive")}
                    </span>
                ),
            },
            {
                key: "activeAssignments",
                header: t("callCenter.columns.activeAssignments"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <Activity size={14} className="text-primary" />
                        <span className="font-bold text-sm tabular-nums">
                            {row.activeAssignments ?? 0}
                        </span>
                    </div>
                ),
            },
            {
                key: "lockedAssignments",
                header: t("callCenter.columns.lockedAssignments"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <Lock size={14} className="text-primary" />
                        <span className="font-bold text-sm tabular-nums text-primary">
                            {row.lockedAssignments ?? 0}
                        </span>
                    </div>
                ),
            },
            {
                key: "confirmedToday",
                header: t("callCenter.columns.confirmedToday"),
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="font-bold text-sm tabular-nums text-emerald-600">
                            {row.confirmed?.count ?? 0}
                        </span>
                    </div>
                ),
            },
        ],
        [t]
    );

    const ruleColumns = useMemo(
        () => [
            {
                key: "name",
                header: t("callCenter.autoAssign.columns.name"),
                cell: (row) => (
                    <span className="font-semibold text-foreground">
                        {row.name}
                    </span>
                ),
            },
            {
                key: "description",
                header: t("description"),
                cell: (row) => (
                    <span
                        className="max-w-xs truncate text-muted-foreground"
                        title={row.description}
                    >
                        {row.description || "-"}
                    </span>
                ),
            },
            {
                key: "ruleType",
                header: t("callCenter.autoAssign.columns.type"),
                cell: (row) => <Badge variant="outline" className="capitalize">{t(`callCenter.autoAssign.stats.${row.ruleType}`)}</Badge>,
            },
            {
                key: "strategy",
                header: t("callCenter.autoAssign.columns.strategy"),
                cell: (row) => (
                    <span className="text-sm font-medium text-muted-foreground capitalize">
                        {t(`callCenter.autoAssign.strategy.${row.strategy}`)}
                    </span>
                ),
            },
            {
                key: "isActive",
                header: t("callCenter.autoAssign.columns.status"),
                cell: (row) => (
                    <Badge variant={row.isActive ? "secondary" : "success"}>
                        {row.isActive ? t("common.statusCodes.active") : t("common.statusCodes.inactive")}
                    </Badge>
                ),
            },
            {
                key: "priority",
                header: t("callCenter.autoAssign.columns.priority"),
                className: "text-center font-mono",
            },
            {
                key: "employees",
                header: t("callCenter.autoAssign.columns.employees"),
                cell: (row) => (
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {row.employees?.slice(0, 2).map((emp, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                {emp.name}
                            </Badge>
                        ))}
                        {row.employees?.length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                +{row.employees.length - 2}
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                key: "actions",
                header: t("callCenter.autoAssign.columns.actions"),
                cell: (row) => (
                    <ActionButtons
                        row={row}
                        actions={[
                            {
                                icon: <Eye size={16} />,
                                tooltip: t("callCenter.autoAssign.actions.view"),
                                onClick: (r) => openView(r),
                                variant: "primary",
                            },
                            {
                                icon: row.isActive ? <PowerOff size={16} /> : <Power size={16} />,
                                tooltip: row.isActive ? t("common.deactivate") : t("common.activate"),
                                onClick: (r) => toggleRuleStatus(r),
                                variant: row.isActive ? "orange" : "emerald",
                                permission: "order.assign",
                            },
                            {
                                icon: <Edit2 size={16} />,
                                tooltip: t("callCenter.autoAssign.actions.edit"),
                                onClick: (r) => openEdit(r),
                                variant: "primary",
                                permission: "order.assign",
                            },
                            {
                                icon: <Trash2 size={16} />,
                                tooltip: t("callCenter.autoAssign.actions.delete"),
                                onClick: (r) => openDelete(r),
                                variant: "red",
                                permission: "order.assign",
                            },
                        ]}
                    />
                ),
            },
        ],
        [t]
    );

    const headerStats = useMemo(() => {
        if (viewMode === "manual") {
            return CALL_CENTER_STATS.map((s) => ({
                id: s.id,
                name: t(s.nameKey),
                value: manualStatsData[s.code] ?? 0,
                icon: s.icon,
                color: s.color,
                sortOrder: s.sortOrder,
            }));
        } else {
            const typeStats = [
                { id: "manual", icon: Users, color: "#6366f1" },
                { id: "product", icon: ShoppingBag, color: "#f59e0b" },
                { id: "city", icon: MapPin, color: "#10b981" },
                { id: "amountRange", icon: DollarSign, color: "#8b5cf6" },
                { id: "paymentStatus", icon: CreditCard, color: "#ec4899" },
                { id: "store", icon: Store, color: "#0ea5e9" },
            ];

            const baseStats = [
                {
                    id: "total",
                    name: t("callCenter.autoAssign.stats.total"),
                    value: autoStatsData.total || 0,
                    icon: Layers,
                    color: "var(--primary)",
                    sortOrder: 1,
                },
                {
                    id: "active",
                    name: t("callCenter.autoAssign.stats.active"),
                    value: autoStatsData.active || 0,
                    icon: Activity,
                    color: "#10b981",
                    sortOrder: 2,
                },
            ];

            const extraStats = typeStats.map((ts, index) => ({
                id: ts.id,
                name: t(`callCenter.autoAssign.stats.${ts.id}`),
                value: autoStatsData.byType?.[ts.id] || 0,
                icon: ts.icon,
                color: ts.color,
                sortOrder: index + 3,
            }));

            return [...baseStats, ...extraStats];
        }
    }, [viewMode, manualStatsData, autoStatsData, t]);

    return (
        <div className="min-h-screen p-5">
            <PageHeader
                breadcrumbs={[
                    { name: t("callCenter.breadcrumb.home"), href: "/dashboard" },
                    { name: t("callCenter.breadcrumb.orders"), href: "/orders" },
                    { name: t("callCenter.title") },
                ]}
                statsCount={viewMode === "manual" ? 3 : 8}
                stats={headerStats}
                items={viewModes}
                active={viewMode}
                setActive={handleViewModeChange}
                buttons={viewMode === "automatic" && (
                    <div className="flex items-center gap-2">
                        <Button_
                            size="sm"
                            label={t("orders.retrySettings.autoAssignment.title")}
                            variant="outline"
                            onClick={() => setSettingsOpen(true)}
                            icon={<Settings size={18} />}
                        />
                        <Button_
                            size="sm"
                            label={t("callCenter.autoAssign.toolbar.addRole")}
                            variant="solid"
                            onClick={() => {
                                setSelectedRule(null);
                                setFormOpen(true);
                            }}
                            icon={<PlusCircle size={18} />}
                            permission="orders.assign"
                        />
                    </div>
                )}
            />

            <Table
                searchValue={search}
                onSearchChange={setSearch}
                onSearch={() => (viewMode === "manual" ? fetchEmployeeStats(1, pager.per_page) : fetchAutoAssignRules(1, pager.per_page))}
                labels={{
                    searchPlaceholder: t(viewMode === "manual" ? "callCenter.searchPlaceholder" : "callCenter.labels.searchPlaceholder"),
                    filter: t("callCenter.labels.filter"),
                    apply: t("callCenter.labels.apply"),
                    total: t("callCenter.labels.total"),
                    limit: t("callCenter.labels.limit"),
                    emptyTitle: t(viewMode === "manual" ? "callCenter.emptyTitle" : "callCenter.labels.emptyTitle"),
                    emptySubtitle: t(viewMode === "manual" ? "callCenter.emptySubtitle" : "callCenter.labels.emptySubtitle"),
                }}
                filters={viewMode === "automatic" && (
                    <>
                        <FilterField label={t("callCenter.labels.ruleType")}>
                            <Select
                                value={filters.ruleType}
                                onValueChange={(v) => setFilters((f) => ({ ...f, ruleType: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder={t("callCenter.labels.ruleType")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.all")}</SelectItem>
                                    {RULE_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {t(`callCenter.autoAssign.stats.${type}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("callCenter.labels.strategy")}>
                            <Select
                                value={filters.strategy}
                                onValueChange={(v) => setFilters((f) => ({ ...f, strategy: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder={t("callCenter.labels.strategy")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.all")}</SelectItem>
                                    <SelectItem value="roundRobin">{t("callCenter.autoAssign.strategy.roundRobin")}</SelectItem>
                                    <SelectItem value="leastActiveOrders">{t("callCenter.autoAssign.strategy.leastActiveOrders")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("callCenter.labels.status")}>
                            <Select
                                value={filters.isActive}
                                onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                                    <SelectValue placeholder={t("callCenter.labels.status")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.all")}</SelectItem>
                                    <SelectItem value="true">{t("common.statusCodes.active")}</SelectItem>
                                    <SelectItem value="false">{t("common.statusCodes.inactive")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={t("callCenter.labels.date")}>
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
                                placeholder={t("callCenter.labels.date")}
                                dataSize="default"
                                maxDate="today"
                            />
                        </FilterField>
                    </>
                )}
                actions={viewMode === "manual" ? [
                    {
                        key: "distribute",
                        label: t("orders.toolbar.distribute"),
                        icon: <Users size={15} />,
                        color: "primary",
                        onClick: () => setDistributionOpen(true),
                        permission: "order.assign",
                    },
                ] : [
                    {
                        key: "export",
                        label: t("callCenter.autoAssign.toolbar.export"),
                        icon: exportLoading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />,
                        color: "primary",
                        onClick: handleExport,
                        disabled: exportLoading,
                        permission: "order.assign",
                    },
                ]}
                columns={viewMode === "manual" ? employeeColumns : ruleColumns}
                data={pager.records}
                isLoading={loading}
                hasActiveFilters={hasActiveFilters}
                onApplyFilters={applyFilters}
                pagination={{
                    total_records: pager.total_records,
                    current_page: pager.current_page,
                    per_page: pager.per_page,
                }}
                onPageChange={({ page, per_page }) => (viewMode === "manual" ? fetchEmployeeStats(page, per_page) : fetchAutoAssignRules(page, per_page))}
            />

            <DistributionModal
                isOpen={distributionOpen}
                onClose={() => setDistributionOpen(false)}
                statuses={stats}
                onSuccess={() => {
                    fetchEmployeeStats(1, pager.per_page);
                    fetchStatsSummary();
                }}
            />

            <RuleFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                rule={selectedRule}
                onSuccess={() => fetchAutoAssignRules(pager.current_page, pager.per_page)}
            />

            <RuleViewDialog
                open={viewOpen}
                onOpenChange={setViewViewOpen}
                rule={selectedRule}
            />

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title={t("callCenter.autoAssign.delete.title")}
                description={t("callCenter.autoAssign.delete.desc")}
                confirmText={t("callCenter.autoAssign.delete.confirm")}
                cancelText={t("callCenter.autoAssign.delete.cancel")}
                loading={deleteLoading}
                onConfirm={handleDeleteRule}
            />

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
                    <DialogHeader className="p-6 border-b dark:border-slate-800">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Settings2 className="text-primary" />
                            {t("orders.retrySettings.autoAssignment.title")}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-base font-bold flex items-center gap-2">
                                <Users className="text-primary" size={20} />
                                {t("orders.retrySettings.autoAssignment.title")}
                            </h3>

                            <div className="space-y-3">
                                <div
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.assignmentMode === "disabled"
                                        ? "border-primary bg-primary/5"
                                        : "border-slate-200 dark:border-slate-700"
                                        }`}
                                    onClick={() => patch({ assignmentMode: "disabled" })}
                                >
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all" style={{ borderColor: settings.assignmentMode === "disabled" ? "#6366f1" : "#d1d5db" }}>
                                        {settings.assignmentMode === "disabled" && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{t("orders.retrySettings.autoAssignment.disabled")}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{t("orders.retrySettings.autoAssignment.disabledDesc")}</div>
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.assignmentMode === "immediate"
                                        ? "border-primary bg-primary/5"
                                        : "border-slate-200 dark:border-slate-700"
                                        }`}
                                    onClick={() => patch({ assignmentMode: "immediate" })}
                                >
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all" style={{ borderColor: settings.assignmentMode === "immediate" ? "#6366f1" : "#d1d5db" }}>
                                        {settings.assignmentMode === "immediate" && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{t("orders.retrySettings.autoAssignment.immediate")}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{t("orders.retrySettings.autoAssignment.immediateDesc")}</div>
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.assignmentMode === "delayed"
                                        ? "border-primary bg-primary/5"
                                        : "border-slate-200 dark:border-slate-700"
                                        }`}
                                    onClick={() => patch({ assignmentMode: "delayed" })}
                                >
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-2 transition-all" style={{ borderColor: settings.assignmentMode === "delayed" ? "#6366f1" : "#d1d5db" }}>
                                        {settings.assignmentMode === "delayed" && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#6366f1" }} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{t("orders.retrySettings.autoAssignment.delayed")}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{t("orders.retrySettings.autoAssignment.delayedDesc")}</div>
                                    </div>
                                </div>
                            </div>

                            {settings.assignmentMode === "delayed" && (
                                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
                                    <label className="text-sm font-medium">{t("orders.retrySettings.autoAssignment.delayTime")}</label>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                min="1"
                                                value={settings.assignmentDelay}
                                                onChange={(e) => patch({ assignmentDelay: Math.max(1, parseInt(e.target.value) || 1) })}
                                                className="w-full px-3  py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                        <select
                                            value={settings.assignmentDelayUnit}
                                            onChange={(e) => patch({ assignmentDelayUnit: e.target.value })}
                                            className="px-3  py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                        >
                                            <option value="minutes">{t("orders.retrySettings.autoAssignment.minutes")}</option>
                                            <option value="hours">{t("orders.retrySettings.autoAssignment.hours")}</option>
                                            <option value="days">{t("orders.retrySettings.autoAssignment.days")}</option>
                                        </select>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t("orders.retrySettings.autoAssignment.delayTimeDesc")}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                            <Button
                                variant="outline"
                                onClick={() => setSettingsOpen(false)}
                                className="rounded-xl"
                            >
                                {tCommon("cancel")}
                            </Button>
                            <Button
                                onClick={() => handleSave(() => setSettingsOpen(false))}
                                disabled={saving}
                                className="rounded-xl px-8"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : tCommon("save")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
