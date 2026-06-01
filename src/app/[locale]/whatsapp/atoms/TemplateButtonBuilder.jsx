"use client";

import React, { useCallback, useMemo } from "react";
import {
    GripVertical,
    Trash2,
    Plus,
    Phone,
    Globe,
    MessageSquare,
    Info,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { PHONE_CODES } from "../../auth/tabs/Signup";

// --- Constants & Types ---
// =========================
// DND SENSORS
// =========================

// const sensors = useSensors(
//     useSensor(PointerSensor, {
//         activationConstraint: {
//             distance: 8,
//         },
//     })
// );


const BUTTON_LIMITS = {
    TOTAL: 10,
    URL: 2,
    PHONE_NUMBER: 1,
    WHATSAPP_CALL: 1,
};

/** Align legacy / API values with form schema (Static | Dynamic). */

function normalizeUrlTypeForUi(urlType) {
    if (urlType === "STATIC" || urlType === "Static") return "Static";
    if (urlType === "DYNAMIC" || urlType === "Dynamic") return "Dynamic";
    return urlType || "Static";
}

/**
 * Per-button errors from react-hook-form + yup (array index matches `value` index).
 * Root-level `.test()` failures use `{ message, type }` (e.g. btn-url, btn-phone, btn-call-days).
 */
function normalizeButtonFieldErrors(btnErr) {
    const out = {
        text: "",
        url: "",
        urlType: "",
        urlExample: "",
        phone: "",
        callDays: "",
    };
    if (!btnErr || typeof btnErr !== "object") return out;

    const pick = (node) => (node && typeof node === "object" && "message" in node ? String(node.message || "") : "");

    out.text = pick(btnErr.text);
    out.url = pick(btnErr.url);
    out.urlType = pick(btnErr.urlType);
    out.urlExample = pick(btnErr.urlExample);
    out.phone = pick(btnErr.phoneNumber);
    out.callDays = pick(btnErr.activeForDays);

    const rootMsg = "message" in btnErr && typeof btnErr.message === "string" ? btnErr.message : "";
    const rootType = btnErr.type;
    if (rootMsg) {
        if (rootType === "btn-url") out.url = out.url || rootMsg;
        else if (rootType === "btn-phone") out.phone = out.phone || rootMsg;
        else if (rootType === "btn-call-days") out.callDays = out.callDays || rootMsg;
    }

    return out;
}

// --- Sub-components ---

/**
 * Sortable Button Card Wrapper
 */
function SortableButtonCard({
    id,
    children,
    onRemove,
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        transition: {
            duration: 120,
            easing: "ease-out",
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        zIndex: isDragging ? 999 : "auto",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={[
                "group relative bg-white dark:bg-slate-900 border rounded-md",
                "select-none",
                isDragging
                    ? "shadow-lg ring-2 ring-primary/20 opacity-90"
                    : "border-slate-200 dark:border-slate-800 hover:border-primary/30"
            ].join(" ")}
        >
            <div className="flex items-start gap-1 p-4">

                {/* DRAG HANDLE ONLY */}
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="mt-2 p-1 text-slate-400 hover:text-primary cursor-grab active:cursor-grabbing shrink-0"
                >
                    <GripVertical size={20} />
                </button>

                {/* CONTENT */}
                <div className="flex-1 space-y-4">
                    {children}
                </div>

                {/* REMOVE */}
                <button
                    type="button"
                    onClick={onRemove}
                    className="mt-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
/**
 * Main TemplateButtonBuilder Component
 */
export default function TemplateButtonBuilder({ value = [], onChange, errors }) {
    const t = useTranslations("whatsApp.templates.form.buttonsBuilder");

    const BUTTON_TYPES = useMemo(() => [
        { id: "CUSTOM", label: t("types.CUSTOM"), icon: MessageSquare, limit: null },
        { id: "VISIT_WEBSITE", label: t("types.VISIT_WEBSITE"), icon: Globe, limit: BUTTON_LIMITS.URL },
        { id: "PHONE_NUMBER", label: t("types.PHONE_NUMBER"), icon: Phone, limit: BUTTON_LIMITS.PHONE_NUMBER },
        { id: "WHATSAPP_CALL", label: t("types.WHATSAPP_CALL"), icon: MessageSquare, limit: BUTTON_LIMITS.WHATSAPP_CALL },
    ], [t]);

    const URL_TYPES = useMemo(() => [
        { id: "Static", label: t("urlTypes.Static") },
        { id: "Dynamic", label: t("urlTypes.Dynamic") },
    ], [t]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    const locale = useLocale();

    const rawButtonsErrors = errors?.buttons;
    const buttonsItemErrors = Array.isArray(rawButtonsErrors) ? rawButtonsErrors : [];
    const buttonsArrayMessage =
        rawButtonsErrors && !Array.isArray(rawButtonsErrors) && rawButtonsErrors.message
            ? String(rawButtonsErrors.message)
            : "";

    // --- State Logic ---

    const currentCounts = useMemo(() => {
        return value.reduce((acc, btn) => {
            acc[btn.type] = (acc[btn.type] || 0) + 1;
            acc.total += 1;
            return acc;
        }, { total: 0 });
    }, [value]);

    const canAddType = useCallback((typeId) => {
        if (currentCounts.total >= BUTTON_LIMITS.TOTAL) return false;
        const limit = BUTTON_LIMITS[typeId];
        if (limit !== undefined && (currentCounts[typeId] || 0) >= limit) return false;
        return true;
    }, [currentCounts]);

    const handleAddButton = (typeId) => {
        if (!canAddType(typeId)) return;

        const newButton = {
            id: `btn-${Math.random().toString(36).substr(2, 9)}`,
            type: typeId,
            text: "",
            // Type specific defaults
            ...(typeId === "VISIT_WEBSITE" && { urlType: "Static", url: "", urlExample: "" }),
            ...(typeId === "PHONE_NUMBER" && { countryCode: "+20", phoneNumber: "" }),
            ...(typeId === "WHATSAPP_CALL" && { activeForDays: 7 }),
        };

        onChange([...value, newButton]);
    };

    const handleUpdate = (id, updates) => {
        const newValue = value.map(btn => btn.id === id ? { ...btn, ...updates } : btn);
        onChange(newValue);
    };

    const handleRemove = (id) => {
        onChange(value.filter(btn => btn.id !== id));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = value.findIndex(btn => btn.id === active.id);
            const newIndex = value.findIndex(btn => btn.id === over.id);
            onChange(arrayMove(value, oldIndex, newIndex));
        }
    };

    // --- Rendering Helpers ---

    const renderButtonForm = (btn, index) => {
        const { type } = btn;
        const fe = normalizeButtonFieldErrors(buttonsItemErrors[index]);
        const urlTypeUi = normalizeUrlTypeForUi(btn.urlType);
        const callDaysUi = String(btn.activeForDays ?? btn.activeDays ?? 7);

        return (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 1. Type Display (Read-only for now or selector) */}
                <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-[11px] text-slate-400">{t("type")}</Label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium">
                        {(() => {
                            const typeInfo = BUTTON_TYPES.find(t => t.id === type);
                            const Icon = typeInfo?.icon || MessageSquare;
                            return (
                                <>
                                    <Icon size={16} className="text-primary" />
                                    <span>{typeInfo?.label}</span>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* 2. Button Text */}
                <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-[11px] text-slate-400 ">{t("text")}</Label>
                    <div className="relative ">
                        <Input
                            placeholder={t("textPlaceholder")}
                            maxLength={25}
                            value={btn.text}
                            onChange={(e) => handleUpdate(btn.id, { text: e.target.value })}
                            style={{ paddingLeft: locale === 'ar' ? 45 : 10, paddingRight: locale === 'ar' ? 10 : 45 }}
                            className={cn("text-sm", fe.text && "border-red-500 focus-visible:ring-red-500")}
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                            25/{btn.text.length}
                        </span>
                    </div>
                    {fe.text ? <p className="text-[11px] text-red-500 mt-1">{fe.text}</p> : null}
                </div>

                {/* 3. Type Specific Fields */}
                {type === "VISIT_WEBSITE" && (
                    <>
                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[11px] text-slate-400">{t("urlType")}</Label>
                            <Select
                                value={urlTypeUi}
                                onValueChange={(val) => handleUpdate(btn.id, { urlType: val })}
                            >
                                <SelectTrigger className={cn("text-sm h-10", fe.urlType && "border-red-500")}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {URL_TYPES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fe.urlType ? <p className="text-[11px] text-red-500 mt-1">{fe.urlType}</p> : null}
                        </div>
                        <div className="md:col-span-4 space-y-1.5">
                            <Label className="text-[11px] text-slate-400">{t("url")}</Label>
                            <Input
                                placeholder={urlTypeUi === "Dynamic" ? `${t("urlPlaceholder")}/{{1}}` : t("urlPlaceholder")}
                                value={btn.url}
                                onChange={(e) => handleUpdate(btn.id, { url: e.target.value })}
                                className={cn(
                                    "text-sm",
                                    fe.url && "border-red-500 focus-visible:ring-red-500",
                                    urlTypeUi === "Dynamic" && !btn.url.includes("{{1}}") && "border-amber-400 focus:ring-amber-400"
                                )}
                            />
                            {fe.url ? <p className="text-[11px] text-red-500 mt-1">{fe.url}</p> : null}
                            {urlTypeUi === "Dynamic" && !btn.url.includes("{{1}}") && (
                                <p className="text-[10px] text-amber-600 font-medium">{t("dynamicUrlError")}</p>
                            )}
                        </div>

                        {urlTypeUi === "Dynamic" && (
                            <div className="md:col-span-12 mt-2">
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                        <Info size={14} className="text-primary" />
                                        {t("urlExample")}
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {t("urlExampleInfo")}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-mono text-slate-400 shrink-0">
                                            {"{{1}}"}
                                        </div>
                                        <Input
                                            placeholder={t("urlExamplePlaceholder")}
                                            value={btn.urlExample}
                                            onChange={(e) => handleUpdate(btn.id, { urlExample: e.target.value })}
                                            className={cn(
                                                "h-10 text-sm border-red-200 focus:border-red-400",
                                                fe.urlExample && "border-red-500 focus-visible:ring-red-500"
                                            )}
                                        />
                                    </div>
                                    {fe.urlExample ? (
                                        <p className="text-[11px] text-red-500 font-medium">{fe.urlExample}</p>
                                    ) : !btn.urlExample ? (
                                        <p className="text-[10px] text-red-500 font-medium">{t("urlExampleRequired")}</p>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {type === "PHONE_NUMBER" && (
                    <>
                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[11px] text-slate-400">{t("country")}</Label>
                            <Select
                                value={btn.countryCode}
                                onValueChange={(val) => handleUpdate(btn.id, { countryCode: val })}
                            >
                                <SelectTrigger className="text-sm h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PHONE_CODES.map((code) => (
                                        <SelectItem key={code.key} value={code.code}>{code.flag} {code.code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-4 space-y-1.5">
                            <Label className="text-[11px] text-slate-400">{t("phone")}</Label>
                            <Input
                                placeholder="000 000 000"
                                value={btn.phoneNumber}
                                onChange={(e) => handleUpdate(btn.id, { phoneNumber: e.target.value })}
                                className={cn("text-sm", fe.phone ? "border-red-500 focus-visible:ring-red-500" : "border-red-200")}
                            />
                            {fe.phone ? (
                                <p className="text-[11px] text-red-500 mt-1">{fe.phone}</p>
                            ) : !btn.phoneNumber ? (
                                <p className="text-[10px] text-red-500">{t("phoneRequired")}</p>
                            ) : null}
                        </div>
                    </>
                )}

                {type === "WHATSAPP_CALL" && (
                    <>
                        <div className="md:col-span-6 space-y-1.5">
                            <Label className="text-[11px] text-slate-400 flex items-center gap-1">
                                {t("callDays")}
                                <Info size={12} className="text-slate-400" />
                            </Label>
                            <Select
                                value={callDaysUi}
                                onValueChange={(val) => handleUpdate(btn.id, { activeForDays: Number(val) })}
                            >
                                <SelectTrigger className={cn("text-sm h-10", fe.callDays && "border-red-500")}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...Array(30)].map((_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1} {i + 1 === 1 ? t("day") : t("days")}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fe.callDays ? <p className="text-[11px] text-red-500 mt-1">{fe.callDays}</p> : null}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t("title")}</h3>
                    <p className="text-xs text-slate-500 mt-1">{t("limitDesc", { total: BUTTON_LIMITS.TOTAL })}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                    <span className={cn(
                        "text-xs font-bold",
                        currentCounts.total >= BUTTON_LIMITS.TOTAL ? "text-red-500" : "text-primary"
                    )}>
                        {currentCounts.total} / {BUTTON_LIMITS.TOTAL}
                    </span>
                </div>
            </div>

            {currentCounts.total < BUTTON_LIMITS.TOTAL && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {BUTTON_TYPES.map((type) => {
                        const disabled = !canAddType(type.id);
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => handleAddButton(type.id)}
                                className={cn(
                                    "flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl transition-all",
                                    disabled
                                        ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 text-slate-600 dark:text-slate-300 hover:text-primary"
                                )}
                            >
                                <Plus size={16} />
                                <span className="text-xs font-bold">{type.label}</span>
                                {type.limit && (
                                    <span className="text-[10px] opacity-60">({currentCounts[type.id] || 0}/{type.limit})</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* DnD Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={value.map((btn) => btn.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {value.map((btn, index) => (
                            <SortableButtonCard
                                key={btn.id}
                                id={btn.id}
                                onRemove={() => handleRemove(btn.id)}
                            >
                                {renderButtonForm(btn, index)}
                            </SortableButtonCard>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {buttonsArrayMessage ? (
                <p className="text-xs text-red-500">{buttonsArrayMessage}</p>
            ) : null}

        </div>
    );
}
