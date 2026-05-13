"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
    GripVertical,
    Trash2,
    Plus,
    Phone,
    Globe,
    MessageSquare,
    Info,
    ExternalLink,
    AlertCircle,
    ChevronDown
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
import { useLocale } from "next-intl";

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

const BUTTON_TYPES = [
    { id: "CUSTOM", label: "مخصص (رد سريع)", icon: MessageSquare, limit: null },
    { id: "VISIT_WEBSITE", label: "زيارة موقع ويب", icon: Globe, limit: BUTTON_LIMITS.URL },
    { id: "PHONE_NUMBER", label: "اتصال برقم هاتف", icon: Phone, limit: BUTTON_LIMITS.PHONE_NUMBER },
    { id: "WHATSAPP_CALL", label: "اتصال عبر واتساب", icon: MessageSquare, limit: BUTTON_LIMITS.WHATSAPP_CALL },
];

const URL_TYPES = [
    { id: "STATIC", label: "ثابت" },
    { id: "DYNAMIC", label: "ديناميكي" },
];

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
export default function TemplateButtonBuilder({ value = [], onChange }) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    const locale = useLocale()
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
            ...(typeId === "VISIT_WEBSITE" && { urlType: "STATIC", url: "", urlExample: "" }),
            ...(typeId === "PHONE_NUMBER" && { countryCode: "US +1", phoneNumber: "" }),
            ...(typeId === "WHATSAPP_CALL" && { activeDays: "7" }),
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

    const renderButtonForm = (btn) => {
        const { type } = btn;

        return (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 1. Type Display (Read-only for now or selector) */}
                <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-[11px] text-slate-400">نوع الإجراء</Label>
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
                    <Label className="text-[11px] text-slate-400 ">نص الزر</Label>
                    <div className="relative ">
                        <Input
                            placeholder="أدخل نص الزر..."
                            maxLength={40}
                            value={btn.text}
                            onChange={(e) => handleUpdate(btn.id, { text: e.target.value })}
                            style={{ paddingLeft: locale === 'ar' ? 45 : 10, paddingRight: locale === 'ar' ? 10 : 45 }}
                            className="text-sm"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                            40/{btn.text.length}
                        </span>
                    </div>
                </div>

                {/* 3. Type Specific Fields */}
                {type === "VISIT_WEBSITE" && (
                    <>
                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[11px] text-slate-400">نوع الرابط</Label>
                            <Select
                                value={btn.urlType}
                                onValueChange={(val) => handleUpdate(btn.id, { urlType: val })}
                            >
                                <SelectTrigger className="text-sm h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {URL_TYPES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-4 space-y-1.5">
                            <Label className="text-[11px] text-slate-400">رابط الموقع</Label>
                            <Input
                                placeholder={btn.urlType === "DYNAMIC" ? "https://example.com/{{1}}" : "https://example.com"}
                                value={btn.url}
                                onChange={(e) => handleUpdate(btn.id, { url: e.target.value })}
                                className={cn(
                                    "text-sm",
                                    btn.urlType === "DYNAMIC" && !btn.url.includes("{{1}}") && "border-amber-400 focus:ring-amber-400"
                                )}
                            />
                            {btn.urlType === "DYNAMIC" && !btn.url.includes("{{1}}") && (
                                <p className="text-[10px] text-amber-600 font-medium">يجب أن يتضمن الرابط المتغير {"{{1}}"}</p>
                            )}
                        </div>

                        {btn.urlType === "DYNAMIC" && (
                            <div className="md:col-span-12 mt-2">
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                        <Info size={14} className="text-primary" />
                                        إضافة رابط عينة
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        لمساعدتنا في مراجعة قالب رسالتك، يرجى إضافة مثال لرابط الموقع. لا تستخدم معلومات حقيقية للعملاء.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-mono text-slate-400 shrink-0">
                                            {"{{1}}"}
                                        </div>
                                        <Input
                                            placeholder="أدخل الرابط الكامل مع المثال..."
                                            value={btn.urlExample}
                                            onChange={(e) => handleUpdate(btn.id, { urlExample: e.target.value })}
                                            className="h-10 text-sm border-red-200 focus:border-red-400"
                                        />
                                    </div>
                                    {!btn.urlExample && <p className="text-[10px] text-red-500 font-medium">يرجى إدخال رابط موقع ويب صالح</p>}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {type === "PHONE_NUMBER" && (
                    <>
                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[11px] text-slate-400">الدولة</Label>
                            <Select
                                value={btn.countryCode}
                                onValueChange={(val) => handleUpdate(btn.id, { countryCode: val })}
                            >
                                <SelectTrigger className="text-sm h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="US +1">US +1</SelectItem>
                                    <SelectItem value="EG +20">EG +20</SelectItem>
                                    <SelectItem value="SA +966">SA +966</SelectItem>
                                    <SelectItem value="AE +971">AE +971</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-4 space-y-1.5">
                            <Label className="text-[11px] text-slate-400">رقم الهاتف</Label>
                            <Input
                                placeholder="000 000 000"
                                value={btn.phoneNumber}
                                onChange={(e) => handleUpdate(btn.id, { phoneNumber: e.target.value })}
                                className="text-sm border-red-200"
                            />
                            {!btn.phoneNumber && <p className="text-[10px] text-red-500">تحتاج لإدخال رقم هاتف. يرجى إضافة رقم هاتف صالح.</p>}
                        </div>
                    </>
                )}

                {type === "WHATSAPP_CALL" && (
                    <>
                        <div className="md:col-span-6 space-y-1.5">
                            <Label className="text-[11px] text-slate-400 flex items-center gap-1">
                                نشط لمدة
                                <Info size={12} className="text-slate-400" />
                            </Label>
                            <Select
                                value={btn.activeDays}
                                onValueChange={(val) => handleUpdate(btn.id, { activeDays: val })}
                            >
                                <SelectTrigger className="text-sm h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...Array(30)].map((_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1} أيام</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* <div className="md:col-span-12 mt-2">
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex gap-3">
                                <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
                                    قم بتشغيل المكالمات في بوابة WhatsApp Manager. بدلاً من ذلك، يمكنك استخدام Phone Number Settings API.
                                    <a href="#" className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline mx-1">
                                        حول الاتصال على واتساب
                                        <ExternalLink size={10} />
                                    </a>
                                </p>
                            </div>
                        </div> */}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">أزرار الاستجابة (Call to Action)</h3>
                    <p className="text-xs text-slate-500 mt-1">أضف حتى {BUTTON_LIMITS.TOTAL} أزرار لمساعدة العملاء على اتخاذ إجراءات.</p>
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
                        {value.map((btn) => (
                            <SortableButtonCard
                                key={btn.id}
                                id={btn.id}
                                onRemove={() => handleRemove(btn.id)}
                            >
                                {renderButtonForm(btn)}
                            </SortableButtonCard>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add Button Dropdown/Grid */}

        </div>
    );
}
