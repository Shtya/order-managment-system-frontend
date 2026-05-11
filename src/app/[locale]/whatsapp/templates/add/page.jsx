"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
    ChevronLeft,
    Megaphone,
    Bell,
    KeyRound,
    Info,
    Wand2,
    Image as ImageIcon,
    Type,
    FileText,
    Check,
    Smile,
    Bold,
    Italic,
    Strikethrough,
    Code,
    PlusCircle,
    UploadCloud,
    FolderOpen,
    Trash2,
    Clock,
    ShieldCheck,
    Smartphone,
    Copy,
    Ban,
    Facebook,
    Layout
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";

// UI Components (adjust paths to match your project)
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/FloatingSelect"; // or standard select
import Button_ from "@/components/atoms/Button";
import PageHeader from "@/components/atoms/Pageheader";
import TemplatePreview from "../../atoms/TemplatePreview";
import MediaUpload from "../../atoms/MediaUpload";
import TemplateButtonBuilder from "../../atoms/TemplateButtonBuilder";
import { MetaTemplateDialog } from "../../atoms/MetaTemplateDialog";
import { InternalTemplateDialog } from "../../atoms/InternalTemplateDialog";
import Script from "next/script";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    getVariableMatches,
    extractVariableNames,
    replaceVariables,
    isCorrectVariableFormat
} from "@/utils/whatsapp-healper";

const MAX_BODY_LENGTH = 1024;

const hasInvalidVariablePlacement = (text = "") => {
    const trimmed = text.trim();

    return (
        trimmed.startsWith("{{") ||
        trimmed.endsWith("}}")
    );
};

const hasTooManyVariablesForText = (text = "") => {
    const varCount = getVariableMatches(text)?.length;

    const words = text
        .trim()
        .split(/\s+/)
        .filter((w) => !isCorrectVariableFormat(w))
        .length;

    return words < (3 * varCount) + 1;
};

// 1. Validation Schema
const schema = yup.object().shape({
    name: yup.string().required("اسم القالب مطلوب"),
    language: yup.string().required("اللغة مطلوبة"),
    category: yup.string().required("الفئة مطلوبة"),
    headerType: yup.string(),
    headerText: yup.string().test("header-var-count", "يمكنك إضافة متغير واحد فقط في الرأس", (val) => {
        if (!val) return true;
        const matches = getVariableMatches(val);
        return matches.length <= 1;
    }),
    bodyText: yup.string()
        .required("نص الرسالة مطلوب")
        .max(MAX_BODY_LENGTH, `لا يمكن أن يتجاوز النص ${MAX_BODY_LENGTH} حرفًا`)
        .test(
            "no-start-end-var",
            "لا يمكن أن تبدأ الرسالة أو تنتهي بمتغير",
            (val) => !hasInvalidVariablePlacement(val)
        )
        .test(
            "min-words",
            "النص قصير جدًا بالنسبة لعدد المتغيرات المستخدمة",
            (val) => !hasTooManyVariablesForText(val)
        ),
    footerText: yup.string(),
});

const CATEGORIES = [
    {
        id: "MARKETING",
        label: "تسويق",
        icon: Megaphone,
        color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400",
        subcategories: [
            {
                id: "MARKETING_DEFAULT",
                label: "افتراضي",
                description: "أرسل رسائل تحتوي على وسائط وأزرار مخصصة لإشراك عملائك.",
                goodFor: "رسائل الترحيب، العروض الترويجية، الكوبونات، النشرات الإخبارية، الإعلانات",
                customize: "الوسائط، الرأس، النص، التذييل، الأزرار",
                sections: ["header", "body", "footer", "buttons"]
            },
            {
                id: "MARKETING_CALL_PERMISSIONS",
                label: "طلب أذونات الاتصال",
                description: "اسأل العملاء عما إذا كان يمكنك الاتصال بهم على واتساب",
                goodFor: "إدارة الموافقة، طلبات الدعم الهاتفي",
                customize: "النص، التذييل، الأزرار",
                sections: ["header_text_only", "body", "footer"] // Meta fixed buttons
            }
        ]
    },
    {
        id: "UTILITY",
        label: "مرافق (Utility)",
        icon: Bell,
        color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400",
        subcategories: [
            {
                id: "UTILITY_DEFAULT",
                label: "افتراضي",
                description: "أرسل رسائل حول طلب موجود أو حساب.",
                goodFor: "تحديثات الطلب، تنبيهات الحساب، إشعارات الشحن، طلبات التقييم",
                customize: "الرأس، النص، التذييل، الأزرار",
                sections: ["header", "body", "footer", "buttons", "validity_period"]
            },
            {
                id: "UTILITY_CALL_PERMISSIONS",
                label: "طلب أذونات الاتصال",
                description: "اسأل العملاء عما إذا كان يمكنك الاتصال بهم على واتساب",
                goodFor: "إدارة الموافقة، توفر الدعم",
                customize: "النص، التذييل، الأزرار",
                sections: ["header_text_only", "body", "footer", "validity_period"] // Meta fixed buttons
            }
        ]
    },
    {
        id: "AUTHENTICATION",
        label: "مصادقة",
        icon: KeyRound,
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
        subcategories: [
            {
                id: "AUTHENTICATION_OTP",
                label: "رمز التحقق (OTP)",
                description: "أرسل رموزًا للتحقق من عملية شراء أو تسجيل دخول.",
                goodFor: "رموز التحقق، تنبيهات الأمان، محاولات تسجيل الدخول",
                customize: "النص (تنسيق ثابت)، التذييل",
                sections: ["auth_setup", "auth_content", "validity_period"]
            }
        ]
    }
];

export default function CreateWhatsAppTemplatePage() {
    // const t = useTranslations("whatsApp"); // Uncomment if using next-intl
    const router = useRouter();
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const textareaRef = useRef(null);
    const [variableSamples, setVariableSamples] = useState({ body: {}, header: {} });
    const [isMetaDialogOpen, setIsMetaDialogOpen] = useState(false);
    const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);

    const { control, handleSubmit, watch, setValue, setError, clearErrors, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        mode: "onSubmit", // Only validate on submit by default
        defaultValues: {
            name: "",
            language: "ar",
            category: "MARKETING",
            subcategory: "MARKETING_DEFAULT",
            headerType: "NONE",
            headerText: "",
            headerUrl: "",
            bodyText: "",
            footerText: "",
            buttons: [],
            // Auth specific
            authMethod: "COPY_CODE",
            addSecurityRecommendation: false,
            addExpirationTime: false,
            expirationMinutes: 10,
            // Validity period
            useCustomValidity: false,
            validityPeriod: "10m"
        }
    });

    // Watch all form fields to feed into the live preview
    const templateData = watch();

    const headerHasVariable = React.useMemo(() => {
        const matches = getVariableMatches(templateData.headerText || "");
        return matches.length >= 1;
    }, [templateData.headerText]);

    const handleHeaderTypeChange = (type) => {
        setValue("headerType", type);
        setValue("headerText", "");
        setValue("headerUrl", "");

    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you might upload this to a server/S3
            // For preview, we create a local object URL
            const url = URL.createObjectURL(file);
            setValue("headerUrl", url);
        }
        e.target.value = "";
    };

    const normalizeVariables = (text) => {
        const seen = new Map();
        let count = 0;
        return replaceVariables(text, (match, num) => {
            if (seen.has(num)) {
                return `{{${seen.get(num)}}}`;
            }
            count++;
            seen.set(num, count);
            return `{{${count}}}`;
        });
    };

    const updateSamples = (text, type = "body") => {
        const matches = getVariableMatches(text);

        const newSamples = { ...variableSamples[type] };

        // Remove deleted variables
        Object.keys(newSamples).forEach((key) => {
            if (!matches.includes(`{{${key}}}`)) {
                delete newSamples[key];
            }
        });

        // Add new variables
        matches.forEach((m) => {
            const varNames = extractVariableNames(m);
            const num = varNames[0];

            if (!(num in newSamples)) {
                newSamples[num] = "";
            }
        });

        setVariableSamples((prev) => ({
            ...prev,
            [type]: newSamples
        }));
    };

    const validateBody = (text) => {
        if (hasInvalidVariablePlacement(text)) {
            setError("bodyText", {
                type: "manual",
                message: "لا يمكن أن تبدأ الرسالة أو تنتهي بمتغير"
            });
            return false;
        } else if (hasTooManyVariablesForText(text)) {
            setError("bodyText", {
                type: "manual",
                message: "النص قصير جدًا بالنسبة لعدد المتغيرات المستخدمة"
            });
            return false;
        } else {
            clearErrors("bodyText");
            return true;
        }
    };

    const handleBodyChange = (e) => {
        const val = e.target.value;
        if (val.length <= MAX_BODY_LENGTH) {
            const normalized = normalizeVariables(val);
            setValue("bodyText", normalized);
            updateSamples(normalized, "body");
            validateBody(normalized);
        }
    };

    const handleHeaderTextChange = (e) => {
        const val = e.target.value;
        const matches = getVariableMatches(val);
        if (matches.length <= 1) {
            const normalized = normalizeVariables(val);
            setValue("headerText", normalized);
            updateSamples(normalized, 'header');
        }
    };

    const insertText = (type, target = 'body') => {
        const textarea = target === 'body' ? textareaRef.current : document.getElementById("header-text-input");
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const fieldName = target === 'body' ? "bodyText" : "headerText";
        const text = watch(fieldName) || "";
        const selection = text.substring(start, end);

        let startTag = "";
        let endTag = "";
        let isVariable = false;

        switch (type) {
            case "bold": startTag = "*"; endTag = "*"; break;
            case "italic": startTag = "_"; endTag = "_"; break;
            case "strike": startTag = "~"; endTag = "~"; break;
            case "mono": startTag = "```"; endTag = "```"; break;
            case "variable":
                if (target === 'header') {
                    const matches = getVariableMatches(text);
                    if (matches.length >= 1) return; // Only 1 variable allowed in header
                    startTag = `{{1}}`;
                } else {
                    // Find the highest variable number in the body
                    const matches = getVariableMatches(text);
                    const nums = matches.map(m => parseInt(extractVariableNames(m)[0]));
                    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
                    startTag = `{{${nextNum}}}`;
                }
                isVariable = true;
                break;
            default: break;
        }

        const insertion = isVariable ? startTag : `${startTag}${selection}${endTag}`;
        let newText = text.substring(0, start) + insertion + text.substring(end);

        if (isVariable) {
            newText = normalizeVariables(newText);
        }

        if (target === 'body' && newText.length > MAX_BODY_LENGTH) return;

        setValue(fieldName, newText);
        updateSamples(newText, target);

        if (target === 'body') {
            validateBody(newText);
        }

        setTimeout(() => {
            textarea.focus();
            const finalInsertion = isVariable ? normalizeVariables(insertion) : insertion;
            textarea.setSelectionRange(start + finalInsertion.length, start + finalInsertion.length);
        }, 0);
    };

    const addEmoji = (emoji) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = templateData.bodyText || "";

        const newText = text.substring(0, start) + emoji.native + text.substring(end);
        setValue("bodyText", newText);
        setEmojiPickerOpen(false);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
        }, 0);
    };


    // Helper to get active category and subcategory objects
    const activeCategory = CATEGORIES.find(c => c.id === templateData.category);
    const activeSubcategory = activeCategory?.subcategories.find(s => s.id === templateData.subcategory);

    // Derived Body Text for Preview (especially for Authentication)
    const getPreviewBody = () => {
        if (templateData.subcategory === "AUTHENTICATION_OTP") {
            let body = "{{1}} هو رمز التحقق الخاص بك.";
            if (templateData.addSecurityRecommendation) {
                body += " لحمايتك، لا تشارك هذا الرمز.";
            }
            return body;
        }
        return templateData.bodyText || "سيظهر نص رسالتك هنا...";
    };

    const getPreviewFooter = () => {
        if (templateData.subcategory === "AUTHENTICATION_OTP" && templateData.addExpirationTime) {
            return `تنتهي صلاحية الرمز خلال ${templateData.expirationMinutes} دقائق.`;
        }
        return templateData.footerText;
    };

    const onSubmit = (data) => {
        console.log("Submitting for review:", data);
        // api.post('/whatsapp/templates', data)...
    };

    const handleSubcategoryChange = (subId) => {
        setValue("subcategory", subId);

        // Specific logic for Authentication OTP
        if (subId === "AUTHENTICATION_OTP") {
            setValue("headerType", "NONE");
            setValue("headerText", "");
            setValue("headerUrl", "");
            setValue("bodyText", ""); // Clear body as it's not used/editable for OTP
            setValue("buttons", []);
        }

        if (subId === "UTILITY_CALL_PERMISSIONS" || subId === "MARKETING_CALL_PERMISSIONSS") {
            setValue("headerType", "NONE");
            setValue("headerText", "");
            setValue("headerUrl", "");
            setValue("bodyText", ""); // Clear body as it's not used/editable for OTP
            setValue("buttons", []);
        }
    };

    const handleCategoryChange = (catId) => {
        const cat = CATEGORIES.find(c => c.id === catId);
        setValue("category", catId);
        if (cat?.subcategories.length > 0) {
            handleSubcategoryChange(cat.subcategories[0].id);
        }
    };

    const hasTemplateContent = useMemo(() => {
        return activeSubcategory?.sections?.some(section =>
            ["body", "header", "header_text_only", "footer"].includes(section)
        );
    }, [activeSubcategory?.sections]);


    // 3. Handle selection
    const handleMetaTemplateSelect = (selectedTpl) => {
        const { template: tplData, name, category, subCategory, language } = selectedTpl;

        // Ensure buttons have unique IDs for the builder
        const buttonsWithIds = (tplData.buttons || []).map(btn => ({
            ...btn,
            id: btn.id || `btn-${Math.random().toString(36).substr(2, 9)}`
        }));

        // 1. Reset Form Values
        setValue("name", name);
        setValue("language", language === "en_US" ? "en" : language);
        setValue("category", category);

        // Map subcategory if it matches our internal IDs, otherwise fallback to default
        const categoryObj = CATEGORIES.find(c => c.id === category);
        const subExists = categoryObj?.subcategories.some(s => s.id === subCategory);
        setValue("subcategory", subExists ? subCategory : categoryObj?.subcategories[0].id);

        setValue("headerType", tplData.headerType || "NONE");
        setValue("headerText", tplData.headerText || "");
        setValue("headerUrl", tplData.headerUrl || "");
        setValue("bodyText", tplData.bodyText || "");
        setValue("footerText", tplData.footerText || "");
        setValue("buttons", buttonsWithIds);

        // 2. Update Samples State
        const bodyMatches = getVariableMatches(tplData.bodyText || "");
        const headerMatches = getVariableMatches(tplData.headerText || "");

        const newBodySamples = {};
        bodyMatches.forEach(m => {
            const num = extractVariableNames(m)[0];
            newBodySamples[num] = tplData.examples?.[num] || "";
        });

        const newHeaderSamples = {};
        headerMatches.forEach(m => {
            const num = extractVariableNames(m)[0];
            newHeaderSamples[num] = tplData.examples?.[num] || "";
        });

        setVariableSamples({
            body: newBodySamples,
            header: newHeaderSamples
        });

        // 3. Clear any previous errors
        clearErrors();
    };

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('Script has loaded!')
                }}
            />
            <div className="min-h-screen p-5 space-y-6" dir="rtl">
                <PageHeader
                    stacky
                    breadcrumbs={[
                        { name: "الرئيسية", href: "/dashboard" },
                        { name: "القوالب", href: "/whatsapp/templates" },
                        { name: "إنشاء قالب" } // Current page
                    ]}
                    buttons={
                        <>
                            <Button_
                                size="sm"
                                label="قوالب النظام"
                                tone="secondary"
                                variant="outline"
                                onClick={() => setIsInternalDialogOpen(true)}
                                icon={<Layout size={18} />}
                                className="border-slate-200 dark:border-slate-800"
                            />
                            <Button_
                                size="sm"
                                label="استيراد من Meta"
                                tone="secondary"
                                variant="outline"
                                onClick={() => setIsMetaDialogOpen(true)}
                                icon={<Facebook size={18} />}
                                className="border-slate-200 dark:border-slate-800"
                            />
                            <Button_
                                size="sm"
                                label={"إرسال للمراجعة"}
                                tone="primary"
                                variant="solid"
                                onClick={handleSubmit(onSubmit)}
                                icon={<Check size={18} />} // Added an icon to match your target theme
                            />
                        </>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

                    {/* ─── LEFT COLUMN: FORM SETTINGS ─── */}
                    <div className="lg:col-span-9 flex flex-col gap-6">

                        {/* SECTION 1: Type & Basics */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">1</div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">الفئة والأساسيات</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                                <div className="space-y-1.5">
                                    <Label>اسم القالب</Label>
                                    <Input
                                        placeholder="مثال: order_confirmation_v1"
                                        className="lowercase"
                                        onChange={(e) => setValue("name", e.target.value.replace(/[^a-z0-9_]/g, '_'))}
                                        value={templateData.name}
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>اللغة</Label>
                                    <Controller
                                        name="language"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر اللغة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">الإنجليزية (en)</SelectItem>
                                                    <SelectItem value="ar">العربية (ar)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">

                                <Label className="mb-3 block text-base mb-1.5">اختر الفئة</Label>
                                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl mb-6">
                                    {CATEGORIES.map((cat) => {
                                        const isSelected = templateData.category === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => handleCategoryChange(cat.id)}
                                                className={cn(
                                                    "flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200",
                                                    isSelected
                                                        ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                )}
                                            >
                                                {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subcategories List */}
                            <div className="space-y-3 mb-8">
                                {activeCategory?.subcategories.map((sub) => {
                                    const isSubSelected = templateData.subcategory === sub.id;
                                    return (
                                        <div
                                            key={sub.id}
                                            onClick={() => handleSubcategoryChange(sub.id)}
                                            className={cn(
                                                "cursor-pointer rounded-md p-4 border-2 transition-all duration-200 flex items-start gap-4",
                                                isSubSelected
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-950"
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                isSubSelected ? "border-primary" : "border-slate-300 dark:border-slate-700"
                                            )}>
                                                {isSubSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                            </div>
                                            <div className="flex-1 text-right">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{sub.label}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                    {sub.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Advice Alert Box was here, moved to preview column */}
                        </div>

                        {/* SECTION 2: Template Content */}
                        {hasTemplateContent && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">2</div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">محتوى القالب</h2>
                                </div>

                                {/* Header Settings */}
                                {activeSubcategory?.sections.includes("header") && (
                                    <div className="space-y-4 mb-8">
                                        <Label className="text-base">الرأس <span className="text-slate-400 text-sm font-normal">(اختياري)</span></Label>
                                        <div className="flex gap-2">
                                            {["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT", "LOCATION"].map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => handleHeaderTypeChange(type)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                                                        templateData.headerType === type
                                                            ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/20"
                                                            : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    {type === "NONE" ? "بلا" : type === "TEXT" ? "نص" : type === "IMAGE" ? "صورة" : type === "VIDEO" ? "فيديو" : type === "DOCUMENT" ? "مستند" : "موقع"}
                                                </button>
                                            ))}
                                        </div>

                                        {templateData.headerType === "TEXT" && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2 space-y-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[11px] text-slate-400">نص الرأس</span>
                                                    <button
                                                        type="button"
                                                        disabled={headerHasVariable}
                                                        onClick={() => insertText("variable", "header")}
                                                        className={cn(
                                                            "text-[11px] font-bold flex items-center gap-1 transition-colors",
                                                            headerHasVariable
                                                                ? "text-slate-300 cursor-not-allowed"
                                                                : "text-primary hover:underline"
                                                        )}
                                                    >
                                                        <PlusCircle size={12} />
                                                        إضافة متغير
                                                    </button>
                                                </div>
                                                <Input
                                                    id="header-text-input"
                                                    placeholder="أدخل نص الرأس (بحد أقصى 60 حرفًا)"
                                                    maxLength={60}
                                                    onChange={handleHeaderTextChange}
                                                    value={templateData.headerText}
                                                    className={cn(errors.headerText && "border-red-500 focus:ring-red-500")}
                                                />
                                                {errors.headerText && <p className="text-[11px] text-red-500 mt-1">{errors.headerText.message}</p>}
                                                <VariableSamplesSection
                                                    type="header"
                                                    samples={variableSamples.header}
                                                    onSampleChange={(num, val) => setVariableSamples(prev => ({
                                                        ...prev,
                                                        header: { ...prev.header, [num]: val }
                                                    }))}
                                                />
                                            </motion.div>
                                        )}

                                        {["IMAGE", "VIDEO", "DOCUMENT"].includes(templateData.headerType) && (
                                            <MediaUpload
                                                type={templateData.headerType}
                                                url={templateData.headerUrl}
                                                onUrlChange={(url) => setValue("headerUrl", url)}
                                                onFileChange={handleFileChange}
                                            />
                                        )}
                                    </div>
                                )}

                                {activeSubcategory?.sections.includes("header_text_only") && (
                                    <div className="space-y-4 mb-8">
                                        <Label className="text-base">الرأس <span className="text-slate-400 text-sm font-normal">(اختياري)</span></Label>
                                        <Input
                                            placeholder="أدخل نص الرأس (بحد أقصى 60 حرفًا)"
                                            maxLength={60}
                                            onChange={(e) => {
                                                setValue("headerType", "TEXT");
                                                setValue("headerText", e.target.value);
                                            }}
                                            value={templateData.headerText}
                                        />
                                    </div>
                                )}

                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

                                {/* Body Settings */}
                                {activeSubcategory?.sections.includes("body") && (
                                    <div className="space-y-3 mb-8 relative">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-base">النص <span className="text-red-500">*</span></Label>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400">أضف متغيرات مثل {'{{1}}'}</span>
                                                <span className={cn(
                                                    "text-xs font-mono px-2 py-0.5 rounded-full",
                                                    (templateData.bodyText?.length || 0) > MAX_BODY_LENGTH * 0.9
                                                        ? "bg-red-50 text-red-500"
                                                        : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {templateData.bodyText?.length || 0} / {MAX_BODY_LENGTH}
                                                </span>
                                            </div>
                                        </div>
                                        <Textarea
                                            {...control.register("bodyText")}
                                            ref={(e) => {
                                                control.register("bodyText").ref(e);
                                                textareaRef.current = e;
                                            }}
                                            id="template-body-textarea"
                                            placeholder="أدخل نص الرسالة الرئيسي..."
                                            className={cn(
                                                "min-h-[140px] resize-y bg-white dark:bg-slate-950 border-slate-200 focus:ring-primary/20",
                                                errors.bodyText && "border-red-500 focus:ring-red-500"
                                            )}
                                            value={templateData.bodyText}
                                            onChange={handleBodyChange}
                                        />
                                        {errors.bodyText && <p className="text-xs text-red-500">{errors.bodyText.message}</p>}

                                        {/* 2. Actions Toolbar Under Input */}
                                        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm">
                                            <div className="flex items-center gap-1">
                                                {/* Emoji Picker */}
                                                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                                                    <PopoverTrigger asChild>
                                                        <button type="button" className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-600 transition-colors">
                                                            <Smile size={18} />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 border-none shadow-xl" side="top" align="start">
                                                        <Picker
                                                            data={data}
                                                            onEmojiSelect={addEmoji}
                                                            theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                                        />
                                                    </PopoverContent>
                                                </Popover>

                                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                                                {/* Formatting Buttons */}
                                                <ToolbarButton icon={<Bold size={16} />} onClick={() => insertText("bold")} tooltip="عريض" />
                                                <ToolbarButton icon={<Italic size={16} />} onClick={() => insertText("italic")} tooltip="مائل" />
                                                <ToolbarButton icon={<Strikethrough size={16} />} onClick={() => insertText("strike")} tooltip="يتوسطه خط" />
                                                <ToolbarButton icon={<Code size={16} />} onClick={() => insertText("mono")} tooltip="عرض ثابت" />

                                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                                                {/* Variable Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => insertText("variable")}
                                                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 text-primary rounded-md transition-colors text-xs font-bold"
                                                >
                                                    <PlusCircle size={16} />
                                                    إضافة متغير
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Info size={14} />
                                            </div>
                                        </div>


                                        {/* Variable Samples for Body */}
                                        <VariableSamplesSection
                                            type="body"
                                            samples={variableSamples.body}
                                            onSampleChange={(num, val) => setVariableSamples(prev => ({
                                                ...prev,
                                                body: { ...prev.body, [num]: val }
                                            }))}
                                        />
                                    </div>
                                )}

                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

                                {/* Footer Settings */}
                                {activeSubcategory?.sections.includes("footer") && (
                                    <div className="space-y-3 mb-2">
                                        <Label className="text-base">التذييل <span className="text-slate-400 text-sm font-normal">(اختياري)</span></Label>
                                        <Input
                                            placeholder="أدخل نصًا صغيرًا في الأسفل (بحد أقصى 60 حرفًا)"
                                            maxLength={60}
                                            onChange={(e) => setValue("footerText", e.target.value)}
                                            value={templateData.footerText}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SECTION 3: Authentication Specifics */}
                        {activeSubcategory?.sections.includes("auth_setup") && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">3</div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">إعداد تسليم الرمز</h2>
                                </div>

                                <div className="space-y-4">
                                    <div
                                        onClick={() => setValue("authMethod", "COPY_CODE")}
                                        className={cn(
                                            "cursor-pointer p-4 border-2 rounded-xl transition-all",
                                            templateData.authMethod === "COPY_CODE" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn("mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center", templateData.authMethod === "COPY_CODE" ? "border-primary" : "border-slate-300")}>
                                                {templateData.authMethod === "COPY_CODE" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Copy size={16} className="text-slate-500" />
                                                    <h4 className="font-bold text-sm">نسخ الرمز</h4>
                                                </div>
                                                <p className="text-xs text-slate-500">مصادقة أساسية مع إعداد سريع. يقوم عملاؤك بنسخ الرمز ولصقه في تطبيقك.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setValue("authMethod", "NO_ACTION")}
                                        className={cn(
                                            "cursor-pointer p-4 border-2 rounded-xl transition-all",
                                            templateData.authMethod === "NO_ACTION" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn("mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center", templateData.authMethod === "NO_ACTION" ? "border-primary" : "border-slate-300")}>
                                                {templateData.authMethod === "NO_ACTION" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Ban size={16} className="text-slate-500" />
                                                    <h4 className="font-bold text-sm">لا يتطلب إجراء</h4>
                                                </div>
                                                <p className="text-xs text-slate-500">أرسل الرمز إلى عملائك في محتوى الرسالة. لا توجد إجراءات أخرى مطلوبة.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSubcategory?.sections.includes("auth_content") && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">4</div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">محتوى رسالة المصادقة</h2>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-6 text-sm text-slate-600 dark:text-slate-400">
                                    لا يمكن تعديل محتوى قوالب رسائل المصادقة. يمكنك إضافة محتوى إضافي من الخيارات أدناه.
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={18} className="text-slate-400" />
                                            <span className="text-sm font-medium">إضافة توصية أمنية</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setValue("addSecurityRecommendation", !templateData.addSecurityRecommendation)}
                                            className={cn("w-10 h-5 rounded-full transition-colors relative", templateData.addSecurityRecommendation ? "bg-primary" : "bg-slate-200")}
                                        >
                                            <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", templateData.addSecurityRecommendation ? "left-6" : "left-1")} />
                                        </button>
                                    </div>

                                    <div className="space-y-3 p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Clock size={18} className="text-slate-400" />
                                                <span className="text-sm font-medium">إضافة وقت انتهاء صلاحية الرمز</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setValue("addExpirationTime", !templateData.addExpirationTime)}
                                                className={cn("w-10 h-5 rounded-full transition-colors relative", templateData.addExpirationTime ? "bg-primary" : "bg-slate-200")}
                                            >
                                                <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", templateData.addExpirationTime ? "left-6" : "left-1")} />
                                            </button>
                                        </div>

                                        {templateData.addExpirationTime && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2 border-t border-slate-50 dark:border-slate-900 space-y-2">
                                                <Label className="text-xs text-slate-500 mb-2 block">وقت انتهاء الصلاحية (بالدقائق)</Label>
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="90"
                                                        value={templateData.expirationMinutes}
                                                        onChange={(e) => setValue("expirationMinutes", e.target.value)}
                                                        className="w-24"
                                                    />
                                                    <span className="text-xs text-slate-400">من 1 إلى 90 دقيقة</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSubcategory?.sections.includes("validity_period") && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                        {activeSubcategory.id === "AUTHENTICATION_OTP" ? "5" : "3"}
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">فترة صلاحية الرسالة</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                                        يوصى بتعيين فترة صلاحية مخصصة يجب تسليم رسالة المصادقة الخاصة بك خلالها قبل انتهاء صلاحيتها. إذا لم يتم تسليم الرسالة خلال هذا الإطار الزمني، فلن يتم محاسبتك ولن يرى عميلك الرسالة.
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="font-bold">تعيين فترة صلاحية مخصصة لرسالتك</Label>
                                        <button
                                            type="button"
                                            onClick={() => setValue("useCustomValidity", !templateData.useCustomValidity)}
                                            className={cn("w-12 h-6 rounded-full transition-colors relative", templateData.useCustomValidity ? "bg-primary" : "bg-slate-200")}
                                        >
                                            <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", templateData.useCustomValidity ? "left-7" : "left-1")} />
                                        </button>
                                    </div>

                                    {templateData.useCustomValidity ? (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                            <Label className="text-xs text-slate-500">فترة الصلاحية</Label>
                                            <Select value={templateData.validityPeriod} onValueChange={(v) => setValue("validityPeriod", v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="30s">30 ثانية</SelectItem>
                                                    <SelectItem value="1m">1 دقيقة</SelectItem>
                                                    <SelectItem value="2m">2 دقيقة</SelectItem>
                                                    <SelectItem value="3m">3 دقائق</SelectItem>
                                                    <SelectItem value="5m">5 دقائق</SelectItem>
                                                    <SelectItem value="10m">10 دقائق</SelectItem>
                                                    <SelectItem value="15m">15 دقيقة</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </motion.div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">إذا لم تقم بتعيين فترة صلاحية مخصصة، فسيتم تطبيق فترة صلاحية رسائل واتساب القياسية البالغة 10 دقائق.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Buttons Settings */}
                        {activeSubcategory?.sections.includes("buttons") && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                        {activeSubcategory.id === "UTILITY_DEFAULT" ? "4" : "3"}
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">الأزرار</h2>
                                </div>

                                <Controller
                                    name="buttons"
                                    control={control}
                                    render={({ field }) => (
                                        <TemplateButtonBuilder
                                            value={field.value || []}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                                {errors.buttons && <p className="text-xs text-red-500 mt-2">{errors.buttons.message}</p>}
                            </div>
                        )}
                    </div>

                    {/* ─── RIGHT COLUMN: STICKY PREVIEW ─── */}
                    <div className="lg:col-span-3 relative h-full">
                        {/* The sticky wrapper */}
                        <div className="sticky top-20 flex flex-col gap-4">

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center justify-between">
                                    معاينة حية
                                    <span className="text-xs font-normal px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">
                                        {activeSubcategory?.label || templateData.category}
                                    </span>
                                </h3>

                                {/* Template Preview Component - Reduced Height */}
                                <div className="h-full w-full overflow-y-auto w-full flex justify-center custom-scrollbar mb-6">
                                    <TemplatePreview
                                        template={{
                                            language: templateData.language,
                                            subcategory: templateData.subcategory,
                                            headerType: templateData.headerType,
                                            headerText: templateData.headerText,
                                            headerUrl: templateData.headerUrl,
                                            bodyText: getPreviewBody(),
                                            footerText: getPreviewFooter(),
                                            buttons: templateData.buttons,
                                            headerExample: variableSamples.header["1"],
                                            examples: {
                                                ...variableSamples.body,
                                                // Fallbacks for auth
                                                "1": templateData.subcategory === "AUTHENTICATION_OTP" ? "123456" : (variableSamples.body["1"]),
                                            }
                                        }}
                                    />
                                </div>

                                {/* Subcategory Metadata Info */}
                                {activeSubcategory && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-right"
                                    >
                                        <div>
                                            <h4 className="text-sm font-bold tracking-wider mb-2">هذا القالب جيد لـ</h4>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {activeSubcategory.goodFor}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold tracking-wider mb-2">مناطق القالب التي يمكنك تخصيصها</h4>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {activeSubcategory.customize}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
                <MetaTemplateDialog
                    open={isMetaDialogOpen}
                    onOpenChange={setIsMetaDialogOpen}
                    onSelectTemplate={handleMetaTemplateSelect}
                />

                <InternalTemplateDialog
                    open={isInternalDialogOpen}
                    onOpenChange={setIsInternalDialogOpen}
                    onSelectTemplate={handleMetaTemplateSelect}
                />
            </div>
        </>
    );
}

// Small sub-component for buttons
function ToolbarButton({ icon, onClick, tooltip }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={tooltip}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 transition-colors"
        >
            {icon}
        </button>
    );
}

// Sub-component for Variable Samples
function VariableSamplesSection({ type, samples, onSampleChange }) {
    const varKeys = Object.keys(samples).sort((a, b) => Number(a) - Number(b));

    if (varKeys.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4"
        >
            <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">عينات المتغيرات</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    قم بتضمين عينات لجميع المتغيرات في رسالتك لمساعدة Meta في مراجعة قالبك. تذكر عدم تضمين أي معلومات حقيقية للعملاء لحماية خصوصيتهم.
                </p>
            </div>

            <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{type === 'header' ? 'الرأس' : 'النص'}</p>
                {varKeys.map((num) => (
                    <div key={num} className="flex gap-3 items-start group">
                        <div className="w-[80px] h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-mono text-slate-400 shrink-0">
                            {`{{${num}}}`}
                        </div>
                        <div className="flex-1 space-y-1">
                            <Input
                                placeholder={`أدخل محتوى لـ {{${num}}}`}
                                value={samples[num]}
                                onChange={(e) => onSampleChange(num, e.target.value)}
                                className="h-10 border-slate-200 focus:border-primary group-hover:border-slate-300 transition-colors"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}