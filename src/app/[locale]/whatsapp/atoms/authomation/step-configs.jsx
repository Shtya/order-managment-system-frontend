"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/FloatingSelect";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Plus, Trash2, GitBranch, Layout, Check, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { MOCK_TEMPLATES } from "../MetaTemplateDialog"; // Reusing mock templates for now
import TemplatePreview from "../TemplatePreview";
import { InternalTemplateDialog } from "../InternalTemplateDialog";

/**
 * Shared Form Group Wrapper
 */
function FormGroup({ label, description, children, error }) {
    return (
        <div className="space-y-2 mb-6">
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{label}</Label>
            {description && <p className="text-[11px] text-slate-400 mb-2">{description}</p>}
            {children}
            {error && <p className="text-[10px] text-rose-500 font-bold mt-1">{error}</p>}
        </div>
    );
}

/**
 * Trigger: Order Created
 */
export function OrderCreatedConfig({ value, onChange, errors }) {
    return (
        <div className="space-y-4">
            <FormGroup label="المتجر" description="اختر المتجر الذي سيتم مراقبة الطلبات فيه" error={errors.store}>
                <Select value={value.store || "all"} onValueChange={(v) => onChange({ ...value, store: v })}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        <SelectValue placeholder="جميع المتاجر" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع المتاجر</SelectItem>
                        <SelectItem value="main">المتجر الرئيسي</SelectItem>
                        <SelectItem value="dubai">فرع دبي</SelectItem>
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Trigger: Order Status Updated
 */
export function OrderStatusUpdatedConfig({ value, onChange, errors }) {
    return (
        <div className="space-y-4">
            <FormGroup label="الحالة المستهدفة" description="تفعيل الأتمتة عند تغيير الطلب إلى هذه الحالة" error={errors.status}>
                <Select value={value.status || ""} onValueChange={(v) => onChange({ ...value, status: v })}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        <SelectValue placeholder="اختر الحالة..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                        <SelectItem value="CONFIRMED">تم التأكيد</SelectItem>
                        <SelectItem value="CANCELLED">ملغي</SelectItem>
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Trigger: Whatsapp Incoming Message
 */
export function WhatsappIncomingConfig({ value, onChange, errors }) {
    return (
        <div className="space-y-4">
            <FormGroup label="حساب الواتساب" description="اختر الحساب الذي سيستقبل الرسائل" error={errors.account}>
                <Select value={value.accountId || ""} onValueChange={(v) => onChange({ ...value, accountId: v })}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        <SelectValue placeholder="اختر الحساب..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="acc_1">حساب المبيعات الرئيسي</SelectItem>
                        <SelectItem value="acc_2">حساب الدعم الفني</SelectItem>
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Action: Update Order Status
 */
export function UpdateOrderStatusConfig({ value, onChange, errors }) {
    return (
        <div className="space-y-4">
            <FormGroup label="تغيير الحالة إلى" description="الحالة الجديدة التي سيتم تعيينها للطلب" error={errors.newStatus}>
                <Select value={value.newStatus || ""} onValueChange={(v) => onChange({ ...value, newStatus: v })}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        <SelectValue placeholder="اختر الحالة الجديدة..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CONFIRMED">تم التأكيد</SelectItem>
                        <SelectItem value="CANCELLED">ملغي</SelectItem>
                        <SelectItem value="PROCESSING">قيد المعالجة</SelectItem>
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Action: Send Whatsapp Template
 */
export function SendWhatsappTemplateConfig({ value, onChange, errors, flowData }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSelectTemplate = (template) => {
        onChange({
            ...value,
            templateId: template.id,
            templateName: template.name,
            templateData: template.template,
            // Automatically detect buttons for branching
            branches: template.template.buttons?.map((btn, i) => ({
                id: `branch_${Date.now()}_${i}`,
                label: btn.text,
                sourceButton: btn,
                condition: `button_click_${i}`
            })) || []
        });
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <FormGroup label="رقم المستلم" description="الرقم الذي سيتم إرسال الرسالة إليه">
                <Input
                    placeholder="أدخل الرقم أو اترك فارغاً لاستخدام رقم العميل من الطلب"
                    value={value.recipientNumber || ""}
                    onChange={(e) => onChange({ ...value, recipientNumber: e.target.value })}
                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6"
                />
            </FormGroup>

            <FormGroup label="قالب الواتساب" description="اختر القالب المراد إرساله من قوالب النظام" error={errors.templateId}>
                {!value.templateId ? (
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="w-full h-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                            <Layout size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 group-hover:text-primary">اضغط لاختيار قالب...</span>
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Check size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{value.templateName}</h4>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">تم اختيار القالب</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsDialogOpen(true)}
                                className="rounded-xl text-primary hover:bg-primary/10 font-bold text-xs gap-2"
                            >
                                <RefreshCw size={14} />
                                تغيير القالب
                            </Button>
                        </div>

                        {value.templateData && (
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 relative group">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <ExternalLink size={12} />
                                    معاينة القالب المختار
                                </h4>
                                <div className="max-w-[300px] mx-auto scale-90 origin-top">
                                    <TemplatePreview template={value.templateData} flat />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <InternalTemplateDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSelectTemplate={handleSelectTemplate}
                />
            </FormGroup>
        </div>
    );
}

/**
 * Condition: Order Check
 */
export function OrderCheckConfig({ value, onChange, errors }) {
    const fields = [
        { id: "total", label: "إجمالي الطلب", type: "number" },
        { id: "items_count", label: "عدد المنتجات", type: "number" },
        { id: "payment_method", label: "طريقة الدفع", type: "string" },
        { id: "city", label: "المدينة", type: "string" },
    ];

    const operators = [
        { id: "==", label: "يساوي", types: ["number", "string"] },
        { id: "!=", label: "لا يساوي", types: ["number", "string"] },
        { id: ">", label: "أكبر من", types: ["number"] },
        { id: "<", label: "أصغر من", types: ["number"] },
        { id: "contains", label: "يحتوي على", types: ["string"] },
    ];

    return (
        <div className="space-y-6">
            <FormGroup label="الحقل المراد فحصه" description="اختر حقل البيانات من الطلب">
                <Select value={value.field || ""} onValueChange={(v) => onChange({ ...value, field: v })}>
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6">
                        <SelectValue placeholder="اختر الحقل..." />
                    </SelectTrigger>
                    <SelectContent>
                        {fields.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </FormGroup>

            <div className="grid grid-cols-2 gap-4">
                <FormGroup label="المعامل">
                    <Select value={value.operator || "=="} onValueChange={(v) => onChange({ ...value, operator: v })}>
                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {operators.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </FormGroup>

                <FormGroup label="القيمة">
                    <Input
                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6"
                        value={value.targetValue || ""}
                        onChange={(e) => onChange({ ...value, targetValue: e.target.value })}
                        placeholder="أدخل القيمة..."
                    />
                </FormGroup>
            </div>
        </div>
    );
}

/**
 * Condition: Quick Order Status
 */
export function QuickOrderStatusConfig({ value, onChange, errors }) {
    return (
        <div className="space-y-4">
            <FormGroup label="التحقق من الحالة" description="توجيه التدفق بناءً على حالة الطلب الحالية" error={errors.status}>
                <Select value={value.status || ""} onValueChange={(v) => onChange({ ...value, status: v })}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6">
                        <SelectValue placeholder="اختر الحالة..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                        <SelectItem value="CONFIRMED">تم التأكيد</SelectItem>
                        <SelectItem value="CANCELLED">ملغي</SelectItem>
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}
