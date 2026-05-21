"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/FloatingSelect";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Plus, Trash2, GitBranch, Layout, Check, ExternalLink, RefreshCw, Loader2, AlertCircle, DollarSign, CreditCard, CheckCircle, Truck, Store, Hash, Package, Tag, Activity, PackageOpen, HelpCircle, ChevronLeft, GripVertical, Info, X, Database, Link } from "lucide-react";
import { cn } from "@/utils/cn";
import { MOCK_TEMPLATES } from "../../whatsapp/atoms/MetaTemplateDialog"; // Reusing mock templates for now
import TemplatePreview from "../../whatsapp/atoms/TemplatePreview";
import { InternalTemplateDialog } from "../../whatsapp/atoms/InternalTemplateDialog";
import { OrderPropertySelector } from "./OrderPropertySelector";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import Button_ from "@/components/atoms/Button";
import { useFlowStore } from "@/hook/useFlowStore";
import { extractVariableNames } from "@/utils/whatsapp-healper";
import { useAuth } from "@/context/AuthContext";

function normalizeAxiosError(err) {
    const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
    return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

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
export function OrderCreatedConfig({ value, onChange, errors, setDisabled, onClose }) {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isSuperAdmin } = useAuth();

    useEffect(() => {
        if (isSuperAdmin) {
            onClose({ ...value, store: "all", storeId: undefined });
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                setLoading(true);
                const res = await api.get("/lookups/stores", { params: { limit: 200, isActive: true } });
                setStores(res.data || []);
            } catch (e) {
                toast.error(normalizeAxiosError(e));
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    useEffect(() => {
        // Prevent save until select store or all
        const isValid = !!value.store;
        setDisabled(!isValid);
    }, [value.store, setDisabled]);

    const handleStoreChange = (v) => {
        if (v === "all") {
            onChange({ ...value, store: "all", storeId: undefined });
        } else {
            const selectedStore = stores.find(s => s.id === v);
            onChange({ ...value, store: selectedStore?.name, storeId: v });
        }
    };

    return (
        <div className="space-y-4">
            <FormGroup label="المتجر" description="اختر المتجر الذي سيتم مراقبة الطلبات فيه" error={errors.store}>
                <Select value={value.storeId || (value.store === "all" ? "all" : "")} onValueChange={handleStoreChange}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        {loading && !isSuperAdmin ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>جاري التحميل...</span>
                            </div>
                        ) : (
                            <SelectValue placeholder="اختر المتجر..." />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع المتاجر</SelectItem>
                        {stores.map(store => (
                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Trigger: Order Status Updated
 */
export function OrderStatusUpdatedConfig({ value, onChange, errors, setDisabled }) {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const t = useTranslations("orders");
    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/orders/statuses");
                setStatuses(Array.isArray(data) ? data : data.records || []);
            } catch (error) {
                console.error("Failed to fetch statuses:", error);
                toast.error(normalizeAxiosError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchStatuses();
    }, []);

    useEffect(() => {
        // Prevent save until a status is selected
        const isValid = !!value.statusId;
        setDisabled(!isValid);
    }, [value.statusId, setDisabled]);

    const handleStatusChange = (v) => {
        const selectedStatus = statuses.find(s => s.id.toString() === v);
        onChange({ ...value, status: selectedStatus?.name, statusId: v });
    };

    return (
        <div className="space-y-4">
            <FormGroup label="الحالة المستهدفة" description="تفعيل الأتمتة عند تغيير الطلب إلى هذه الحالة" error={errors.status}>
                <Select value={value.statusId?.toString() || ""} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>جاري التحميل...</span>
                            </div>
                        ) : (
                            <SelectValue placeholder="اختر الحالة..." />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(status => (
                            <SelectItem key={status.id} value={status.id.toString()}>  {status.system ? t(`statuses.${status.code}`) : status.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Trigger: Whatsapp Incoming Message
 */
export function WhatsappIncomingConfig({ value, onChange, errors, setDisabled }) {
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
export function UpdateOrderStatusConfig({ value, onChange, errors, setDisabled }) {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const t = useTranslations("orders");

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/orders/statuses");
                setStatuses(Array.isArray(data) ? data : data.records || []);
            } catch (error) {
                console.error("Failed to fetch statuses:", error);
                toast.error(normalizeAxiosError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchStatuses();
    }, []);

    useEffect(() => {
        // Prevent save until a new status is selected
        const isValid = !!value.newStatusId;
        setDisabled(!isValid);
    }, [value.newStatusId, setDisabled]);

    const handleStatusChange = (v) => {
        const selectedStatus = statuses.find(s => s.id.toString() === v);
        onChange({
            ...value,
            newStatus: selectedStatus?.name,
            newStatusId: v
        });
    };

    return (
        <div className="space-y-4">
            <FormGroup label="تغيير الحالة إلى" description="الحالة الجديدة التي سيتم تعيينها للطلب" error={errors.newStatus}>
                <Select value={value.newStatusId?.toString() || ""} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>جاري التحميل...</span>
                            </div>
                        ) : (
                            <SelectValue placeholder="اختر الحالة الجديدة..." />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(status => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                                {status.system ? t(`statuses.${status.code}`) : status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Action: Send Whatsapp Template
 */
/**
 * Action: Send Whatsapp Template
 */
export function SendWhatsappTemplateConfig({ value, onChange, errors, flowData, setDisabled }) {
    const { isSuperAdmin } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isOrderSelectorOpen, setIsOrderSelectorOpen] = useState(false);
    const [activeVar, setActiveVar] = useState(null); // { type: 'header' | 'body', num: string }

    const nodes = useFlowStore((s) => s.nodes);
    const triggerNode = nodes.find(n => n.type === 'trigger');
    const isOrderTrigger = triggerNode?.data?.type?.startsWith('order_');

    useEffect(() => {
        // Prevent save until a template is selected and all variables are filled
        const hasTemplate = !!value.templateId;
        const headerVars = extractVariables(value.templateData?.headerText);
        const bodyVars = extractVariables(value.templateData?.bodyText);

        const headerVarsSafe = Array.isArray(headerVars) ? headerVars : [];
        const bodyVarsSafe = Array.isArray(bodyVars) ? bodyVars : [];
        const dynamicButtonIndexesSafe = value?.templateData?.buttons
            ?.map((btn, idx) => btn.type === 'VISIT_WEBSITE' && btn.urlType === 'Dynamic' ? String(idx) : null)
            .filter(Boolean) || [];

        const allVarsFilled = [
            ...(headerVarsSafe || [])?.map(n => (value.headerVariables || {})?.[n]),
            ...(bodyVarsSafe || [])?.map(n => (value.bodyVariables || {})?.[n]),
            ...(dynamicButtonIndexesSafe || [])?.map(idx => (value.buttonVariables || {})?.[idx])
        ].every(v => v?.value || v?.variablePath);



        setDisabled(!hasTemplate || !allVarsFilled);
    }, [value.templateId, value.headerVariables, value.bodyVariables, value.buttonVariables, value.templateData, setDisabled]);

    // 1. تثبيت دالة استخراج المتغيرات لمنع إعادة تعريفها مع كل Re-render
    const extractVariables = useCallback((text) => {
        if (!text) return [];
        const matches = extractVariableNames(text, 'number');
        return [...new Set(matches)].sort((a, b) => Number(a) - Number(b));
    }, []);

    const handleSelectTemplate = (template) => {
        const config = template.templateConfig || {};

        const headerVars = extractVariables(config.headerText);
        const bodyVars = extractVariables(config.bodyText);

        // Initialize variables with examples if available
        const headerVariables = {};
        headerVars.forEach(num => {
            headerVariables[num] = { type: 'direct', value: '', label: '', example: config.headerVariables?.[num] || '' };
        });

        const bodyVariables = {};
        bodyVars.forEach(num => {
            bodyVariables[num] = { type: 'direct', value: '', label: '', example: config.bodyVariables?.[num] || '' };
        });

        const buttonVariables = {};
        config.buttons?.forEach((btn, idx) => {
            if (btn.type === 'VISIT_WEBSITE' && btn.urlType === 'Dynamic') {
                buttonVariables[String(idx)] = {
                    type: 'direct',
                    value: '',
                    label: '',
                    example: `أدخل قيمة {{1}} ل ${btn.url}`
                };
            }
        });

        onChange({
            ...value,
            templateId: template.id,
            templateName: template.name,
            templateData: config,
            headerVariables,
            bodyVariables,
            buttonVariables,
            //only reply buttons
            // Automatically detect buttons for branching
            branches: config.buttons?.filter(btn => btn.type === 'CUSTOM')?.map((btn, i) => ({
                id: `btn_${i}`,
                label: btn.text,
                sourceButton: btn,
                condition: `button_click_${i}`
            })) || []
        });
        setIsDialogOpen(false);
    };

    const handleVariableChange = (type, num, updates) => {
        // 🚀 إضافة خيار الـ button لتحديد المسار الصحيح للمغير داخل كائن الحفظ
        const key = type === 'header' ? 'headerVariables' : type === 'body' ? 'bodyVariables' : 'buttonVariables';
        onChange({
            ...value,
            [key]: {
                ...value?.[key],
                [num]: { ...value?.[key]?.[num], ...updates }
            }
        });
    };

    const openOrderSelector = (type, num) => {
        setActiveVar({ type, num });
        setIsOrderSelectorOpen(true);
    };

    const handleOrderPropSelect = (prop) => {
        if (activeVar) {
            handleVariableChange(activeVar.type, activeVar.num, {
                type: 'variable',
                variablePath: prop.path,
                label: prop.label,
                example: prop.example
            });
        }
        setIsOrderSelectorOpen(false);
        setActiveVar(null);
    };

    const renderVariableInput = (type, num, buttonLabel) => {

        const varData = (
            type === 'header' ? value.headerVariables :
                type === 'body' ? value.bodyVariables :
                    value.buttonVariables
        )?.[num] || {};
        const isDynamic = varData.type === 'variable';

        const badgeLabel = type === 'header' ? 'عنوان' : type === 'body' ? 'متن الرسالة' : buttonLabel || `رابط الزر ${num}`;
        const isButtonType = type === 'button';
        return (
            <div key={num} className="flex gap-3 items-start group">
                <div className="w-[60px] h-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs font-black text-slate-400 shrink-0 shadow-sm">
                    {isButtonType ? buttonLabel : `{{${num}}}`}
                </div>
                <div className="flex-1 flex gap-2">
                    <div className="flex-1 relative">
                        {isDynamic ? (
                            <div className="h-12 rounded-2xl bg-primary/5 border border-primary/20 px-4 flex items-center justify-between group/var">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">متغير ديناميكي ({badgeLabel})</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{varData.label}</span>
                                </div>
                                <button
                                    onClick={() => handleVariableChange(type, num, { type: 'direct', value: '', label: '', variablePath: '' })}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 opacity-0 group-hover/var:opacity-100 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ) : (
                            <Input
                                placeholder={varData.example ? isButtonType ? varData.example : `مثال: ${varData.example}` : "أدخل قيمة ثابتة..."}
                                value={varData.value || ""}
                                onChange={(e) => handleVariableChange(type, num, { value: e.target.value, type: 'direct' })}
                                className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 text-sm"
                            />
                        )}
                    </div>
                    {isOrderTrigger && (
                        <Button
                            variant="outline"
                            onClick={() => openOrderSelector(type, num)}
                            className={cn(
                                "h-12 w-12 rounded-2xl p-0 shrink-0 transition-all",
                                isDynamic ? "border-primary text-primary bg-primary/5" : "border-slate-200 text-slate-400 hover:text-primary hover:border-primary/50"
                            )}
                            title="اختيار من بيانات الطلب"
                        >
                            <Database size={18} />
                        </Button>
                    )}
                </div>
            </div>
        );
    };


    // 2. Memoize متغيرات رأس الرسالة (Header Variables)
    const headerVars = useMemo(() => {
        return extractVariables(value.templateData?.headerText);
    }, [value.templateData?.headerText, extractVariables]);

    // 3. Memoize متغيرات متن الرسالة (Body Variables)
    const bodyVars = useMemo(() => {
        return extractVariables(value.templateData?.bodyText);
    }, [value.templateData?.bodyText, extractVariables]);

    // 4. Memoize وتعديل بناء ماب متغيرات الأزرار (Button Dynamic Variables Map)
    // الآن أصبحت عبارة عن Map (Object) جاهزة للاستخدام المباشر في الـ Loop وفي الـ React State
    const buttonVarsMap = useMemo(() => {
        const buttons = value.templateData?.buttons || value.buttons || [];

        return buttons.reduce((acc, btn, idx) => {
            if (btn.type === 'VISIT_WEBSITE' && btn.urlType === 'Dynamic') {
                acc[String(idx)] = {
                    type: 'direct',
                    value: '',
                    label: btn.text || '',
                    example: btn.urlExample || 'كود التتبع / التوثيق'
                };
            }
            return acc;
        }, {});
    }, [value.templateData?.buttons, value.buttons]);

    return (
        <div className="space-y-8">
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
                    <div className="space-y-6">
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

                        {/* Variables Section */}
                        {(headerVars.length > 0 || bodyVars.length > 0) && (
                            <div className="space-y-6 p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                <div>
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1">تعبئة المتغيرات</h4>
                                    <p className="text-[10px] text-slate-400 font-bold">أدخل قيم ثابتة أو اختر حقول ديناميكية من الطلب</p>
                                </div>

                                {headerVars.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Layout size={12} /> رأس الرسالة
                                        </p>
                                        {headerVars.map(num => renderVariableInput('header', num))}
                                    </div>
                                )}

                                {bodyVars.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <MessageSquare size={12} /> نص الرسالة
                                        </p>
                                        {bodyVars.map(num => renderVariableInput('body', num))}
                                    </div>
                                )}
                                {Object.keys(buttonVarsMap).length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Link size={12} /> أزرار الروابط المتغيرة
                                        </p>
                                        {Object.keys(buttonVarsMap).map((buttonIndex) =>
                                            renderVariableInput('button', buttonIndex, buttonVarsMap[buttonIndex]?.label)
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

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

                {isDialogOpen && (<InternalTemplateDialog
                    library={isSuperAdmin}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSelectTemplate={handleSelectTemplate}
                />)}

                <OrderPropertySelector
                    open={isOrderSelectorOpen}
                    onOpenChange={setIsOrderSelectorOpen}
                    onSelect={handleOrderPropSelect}
                />
            </FormGroup>
        </div>
    );
}

/**
 * Condition: Order Check
 */
export function OrderCheckConfig({ value, onChange, errors, setDisabled }) {
    const { shippingCompanies } = usePlatformSettings();
    const [stores, setStores] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(null);
    const t = useTranslations("orders");
    const [checks, setChecks] = useState(Array.isArray(value?.checks) ? value.checks : []);

    // Sync from parent if needed
    useEffect(() => {
        setChecks(Array.isArray(value?.checks) ? value.checks : []);
    }, [value?.checks]);

    // Validation logic
    useEffect(() => {
        const hasChecks = checks.length > 0;
        const allValid = checks.every(c => c.field && c.operator && (c.targetValue !== "" && c.targetValue !== undefined && c.targetValue !== null));
        if (setDisabled) setDisabled(!hasChecks || !allValid || activeIndex !== null);
    }, [checks, setDisabled, activeIndex]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [storesRes, statusesRes] = await Promise.all([
                    api.get("/lookups/stores", { params: { limit: 200, isActive: true } }),
                    api.get("/orders/statuses")
                ]);
                setStores(storesRes.data || []);
                setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.records || []);
            } catch (error) {
                console.error("Failed to fetch order check data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fields = [
        { id: "orderNumber", label: "رقم الطلب", type: "string", icon: Hash, color: "text-blue-500", bg: "bg-blue-50" },
        // { id: "store", label: "المتجر", type: "select", icon: Store, color: "text-emerald-500", bg: "bg-emerald-50", options: stores.map(s => ({ id: s.id, label: s.name })) },
        { id: "shippingCompany", label: "شركة الشحن", type: "select", icon: Truck, color: "text-orange-500", bg: "bg-orange-50", options: shippingCompanies.map(c => ({ id: c.providerId, label: c.name })) },
        {
            id: "paymentStatus", label: "حالة الدفع", type: "select", icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50", options: [
                { id: "pending", label: "قيد الانتظار" },
                { id: "paid", label: "مدفوع" },
                { id: "partial", label: "مدفوع جزئياً" },
                { id: "refunded", label: "مرتجع" },
                { id: "partially_refunded", label: "مرتجع جزئياً" },
            ]
        },
        { id: "productsTotal", label: "إجمالي الطلب", type: "number", icon: DollarSign, color: "text-green-500", bg: "bg-green-50" },
        { id: "items_count", label: "عدد المنتجات", type: "number", icon: Package, color: "text-amber-500", bg: "bg-amber-50" },
        {
            id: "paymentMethod", label: "طريقة الدفع", type: "select", icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-50", options: [
                { id: "cash", label: "نقدي" },
                { id: "card", label: "بطاقة" },
                { id: "bank_transfer", label: "تحويل بنكي" },
                { id: "cod", label: "دفع عند الاستلام" },
                { id: "wallet", label: "محفظة" },
                { id: "other", label: t("other") },
                { id: "unknown", label: t("unknown") },
            ]
        },
        { id: "city", label: "المدينة", type: "string", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
        { id: "discount", label: "كود الخصم", type: "string", icon: Tag, color: "text-pink-500", bg: "bg-pink-50" },
        { id: "status", label: "حالة الطلب", type: "select", icon: Activity, color: "text-cyan-500", bg: "bg-cyan-50", options: statuses.map(s => ({ id: s.id, label: s.system ? t(`statuses.${s.code}`) : s.name })) },
        { id: "allowOpenPackage", label: "فتح الشحنة", type: "boolean", icon: PackageOpen, color: "text-slate-500", bg: "bg-slate-50" },
        { id: "deposit", label: "العربون", type: "number", icon: DollarSign, color: "text-yellow-500", bg: "bg-yellow-50" },
    ];

    const operatorsByType = {
        number: [
            { id: "==", label: "يساوي" },
            { id: "!=", label: "لا يساوي" },
            { id: ">", label: "أكبر من" },
            { id: "<", label: "أصغر من" },
            { id: ">=", label: "أكبر من أو يساوي" },
            { id: "<=", label: "أصغر من أو يساوي" },
        ],
        string: [
            { id: "==", label: "يساوي" },
            { id: "!=", label: "لا يساوي" },
            { id: "contains", label: "يحتوي على" },
            { id: "not_contains", label: "لا يحتوي على" },
            { id: "starts_with", label: "يبدأ بـ" },
        ],
        boolean: [
            { id: "==", label: "يساوي" },
            { id: "!=", label: "لا يساوي" },
        ],
        select: [
            { id: "==", label: "يساوي" },
            { id: "!=", label: "لا يساوي" },
        ],
    };

    const handleAddCheck = () => {
        if (checks.length < 20) {
            const initialField = "orderNumber";
            const fieldDef = fields.find(f => f.id === initialField);
            const newChecks = [...checks, {
                field: initialField,
                fieldLabel: fieldDef?.label || initialField,
                operator: "==",
                targetValue: ""
            }];
            setChecks(newChecks);
            setActiveIndex(newChecks.length - 1);
        } else {
            toast.error("لا يمكن إضافة أكثر من 20 تحقق");
        }
    };

    const handleConfirm = () => {
        const currentCheck = activeIndex !== null ? checks[activeIndex] : null;
        if (!currentCheck?.targetValue) return;
        onChange({ ...value, checks });
        setActiveIndex(null);
    };

    const handleUpdateCheck = (index, updates) => {
        const newChecks = [...checks];
        const currentCheck = { ...newChecks[index], ...updates };

        if (updates.field) {
            const fieldDef = fields.find(f => f.id === updates.field);
            currentCheck.fieldLabel = fieldDef.label;
            currentCheck.operator = operatorsByType[fieldDef?.type][0].id;
            currentCheck.targetValue = fieldDef?.type === "boolean" ? "true" : "";
            currentCheck.targetLabel = fieldDef?.type === "boolean" ? "نعم" : "";
        }

        newChecks[index] = currentCheck;
        setChecks(newChecks);
    };

    const handleRemoveCheck = (index) => {
        const newChecks = checks.filter((_, i) => i !== index);
        setChecks(newChecks);

        // If we are in the list view, make the removal real immediately
        if (activeIndex === null) {
            onChange({ ...value, checks: newChecks });
        }

        if (newChecks.length === 0) {
            setActiveIndex(null);
        } else if (activeIndex >= newChecks.length) {
            setActiveIndex(newChecks.length - 1);
        }
    };

    const currentCheck = activeIndex !== null ? checks[activeIndex] : null;
    console.log(currentCheck)
    const fieldDef = useMemo(() => {
        if (!currentCheck) return null;
        return fields.find(f => f?.id === currentCheck?.field) || fields[0];
    }, [currentCheck, fields]);


    const operators = fieldDef ? operatorsByType[fieldDef?.type] : [];

    return (
        <div className="flex flex-col gap-8 -m-8 p-8 bg-slate-50 dark:bg-slate-900/50 min-h-[600px] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="absolute top-8 end-18 flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    {checks.length} / 20 شروط
                </div>
                {activeIndex === null ?

                    <>
                        <Button_
                            onClick={handleAddCheck}
                            size="sm"
                            label="إضافة شرط جديد"
                            disabled={activeIndex !== null}
                            variant="solid"
                            icon={<Plus size={18} />}
                            className="h-12 px-6 rounded-2xl font-black text-xs shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        />
                    </> : (
                        <>

                            <button
                                onClick={() => {
                                    setChecks(Array.isArray(value?.checks) ? value.checks : []);
                                    setActiveIndex(null);
                                }}
                                className=" flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                <ChevronLeft size={14} className="rotate-180" />
                                العودة للقائمة
                            </button>
                            <Button_
                                onClick={handleConfirm}
                                size="sm"
                                disabled={!currentCheck?.targetValue}
                                label="تأكيد وإضافة للقائمة"
                                variant="solid"
                                className="h-12 px-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs shadow-xl shadow-slate-200 dark:shadow-none"
                            />
                        </>
                    )
                }
            </div>
            <div className="flex-1 bg-[#f6f6f7] dark:bg-[#13161f] p-6 overflow-y-auto relative">
                {loading ? (<div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-slate-500 font-bold">جاري تجهيز محرر الشروط...</p>
                </div>) : <>
                    {/* List of conditions if none selected */}
                    {checks.length > 0 && activeIndex === null && (
                        <div className="grid grid-cols-2 gap-4">
                            {checks.map((check, i) => {
                                const f = fields.find(fd => fd.id === check.field) || fields[0];
                                return (
                                    <div
                                        key={i}
                                        onClick={() => setActiveIndex(i)}
                                        className="group flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", f.bg, f.color)}>
                                            <f.icon size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{check.fieldLabel || f.label}</p>
                                            <p className="text-xs text-slate-400 font-bold mt-1">
                                                {operatorsByType[f.type]?.find(o => o.id === check.operator)?.label} <span className="text-slate-600 dark:text-slate-300">{check.targetLabel || check.targetValue || '—'}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveCheck(i); }}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <ChevronLeft size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty State */}
                    {checks.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed dark:border-slate-800">
                            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6">
                                <GitBranch size={40} />
                            </div>
                            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-2">لا توجد شروط محددة</h3>
                            <p className="text-sm text-slate-400 font-medium mb-8">ابدأ بإضافة أول شرط لفحص بيانات الطلب</p>
                        </div>
                    )}

                    {/* Active Editor */}
                    {activeIndex !== null && (
                        <div className="flex flex-col gap-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border dark:border-slate-800 shadow-sm relative">

                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-black">1</div>
                                    <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">اختر الحقل من بيانات الطلب</h4>
                                </div>
                                <div className="grid grid-cols-6 gap-3">
                                    {fields.map(f => {
                                        const isSelected = currentCheck?.field === f?.id;
                                        return (
                                            <button
                                                key={f.id}
                                                onClick={() => handleUpdateCheck(activeIndex, { field: f.id })}
                                                className={cn(
                                                    "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all relative group",
                                                    isSelected
                                                        ? "bg-white dark:bg-slate-800 border-primary shadow-md ring-4 ring-primary/5 scale-[1.02] z-10"
                                                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                                )}
                                            >
                                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", f.bg, f.color)}>
                                                    <f.icon size={20} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 text-center leading-tight">{f.label}</p>
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-col gap-10 pt-8 border-t dark:border-slate-800">
                                {/* Step 2: Operator Selection */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-black">2</div>
                                        <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">اختر المعامل (الشرط)</h4>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        {operators.map(o => {
                                            const isSelected = currentCheck.operator === o.id;
                                            return (
                                                <button
                                                    key={o.id}
                                                    onClick={() => handleUpdateCheck(activeIndex, { operator: o.id })}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all",
                                                        isSelected
                                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                                                    )}
                                                >
                                                    <span className="text-xs font-black">{o.label}</span>
                                                    <span className={cn("text-[10px] font-bold opacity-60 mt-1", isSelected ? "text-white" : "text-slate-400")}>{o.id}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step 3: Value Entry */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-black">3</div>
                                        <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">أدخل القيمة</h4>
                                    </div>
                                    <div className="space-y-4 max-w-2xl">
                                        {fieldDef?.type === "select" || fieldDef?.type === "boolean" ? (
                                            <Select
                                                value={String(currentCheck.targetValue)}
                                                onValueChange={(v) => {
                                                    const options = fieldDef?.type === "boolean" ? [
                                                        { id: "true", label: "نعم" },
                                                        { id: "false", label: "لا" }
                                                    ] : fieldDef?.options;
                                                    const label = options.find(o => String(o.id) === v)?.label;
                                                    handleUpdateCheck(activeIndex, { targetValue: v, targetLabel: label });
                                                }}
                                            >
                                                <SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm px-6">
                                                    <SelectValue placeholder="اختر القيمة المطلوبة..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(fieldDef?.type === "boolean" ? [
                                                        { id: "true", label: "نعم" },
                                                        { id: "false", label: "لا" }
                                                    ] : fieldDef?.options).map(opt => (
                                                        <SelectItem key={opt.id} value={String(opt.id)}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                type={fieldDef?.type === "number" ? "number" : "text"}
                                                className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm px-6"
                                                value={currentCheck.targetValue || ""}
                                                maxLength={300}
                                                onChange={(e) => handleUpdateCheck(activeIndex, { targetValue: e.target.value, targetLabel: e.target.value })}
                                                placeholder="أدخل القيمة المطلوبة..."
                                            />
                                        )}
                                        {/* <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 flex gap-3">
                                    <Info size={16} className="text-blue-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
                                        يجب أن تكون القيمة من نوع <span className="uppercase">{fieldDef?.type}</span>.
                                        <br />
                                        سيتم التحقق من صحة هذا الحقل قبل الحفظ.
                                    </p>
                                </div> */}
                                    </div>
                                </div>
                            </div>

                            {/* Preview in Editor */}
                            <div className="mt-8 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">معاينة الشرط الحالي</span>
                                    <div className="flex items-center gap-2">
                                        <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-[11px] font-black text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm">
                                            {fieldDef.label}
                                        </div>
                                        <div className="px-3 py-2 rounded-xl bg-primary/10 text-[11px] font-black text-primary border border-primary/20">
                                            {operators.find(o => o.id === currentCheck.operator)?.id}
                                        </div>
                                        <div className={cn(
                                            "px-4 py-2 rounded-xl text-[11px] font-black border transition-all",
                                            currentCheck.targetValue
                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20"
                                                : "bg-white dark:bg-slate-900 text-slate-300 border-slate-200 dark:border-slate-800 border-dashed"
                                        )}>
                                            {currentCheck.targetLabel || currentCheck.targetValue || "أدخل القيمة"}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )} </>}
            </div>
        </div>
    );
}

/**
 * Condition: Quick Order Status
 */
export function QuickOrderStatusConfig({ value, onChange, errors, setDisabled }) {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const t = useTranslations("orders");

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/orders/statuses");
                setStatuses(Array.isArray(data) ? data : data.records || []);
            } catch (error) {
                console.error("Failed to fetch statuses:", error);
                toast.error(normalizeAxiosError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchStatuses();
    }, []);

    useEffect(() => {
        // Prevent save until a status is selected
        const isValid = !!value.statusId;
        setDisabled(!isValid);
    }, [value.statusId, setDisabled]);

    const handleStatusChange = (v) => {
        const selectedStatus = statuses.find(s => s.id.toString() === v);
        onChange({
            ...value,
            status: selectedStatus?.name,
            statusId: v
        });
    };

    return (
        <div className="space-y-4">
            <FormGroup label="التحقق من الحالة" description="توجيه التدفق بناءً على حالة الطلب الحالية" error={errors.status}>
                <Select value={value.statusId?.toString() || ""} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>جاري التحميل...</span>
                            </div>
                        ) : (
                            <SelectValue placeholder="اختر الحالة..." />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(status => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                                {status.system ? t(`statuses.${status.code}`) : status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}
