"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
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
    Layout,
    Loader2,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";

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
import WhatsAppMessageBodyBuilder from "@/components/molecules/WhatsAppMessageBodyBuilder";
import TemplateButtonBuilder from "../../atoms/TemplateButtonBuilder";
import MetaTemplateDialog from "../../atoms/MetaTemplateDialog";
import { InternalTemplateDialog } from "../../atoms/InternalTemplateDialog";
import Script from "next/script";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    getVariableMatches,
    extractVariableNames,
    replaceVariables,
    isCorrectVariableFormat
} from "@/utils/whatsapp-healper";

import {
    createTemplateFormSchema,
    buildTemplateConfigPayload,
    mapUiCategoryToApi,
    mapUiSubToApi,
    apiCategoryToUi,
    apiSubToUiSub,
    MAX_BODY_LENGTH,
} from "./templateFormSchema";
import WhatsAppAccountSelect from "../../atoms/WhatsAppAccountSelect";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import MediaUpload from "../../atoms/MediaUpload";

function normalizeAxiosError(err) {
    const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
    return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

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

// دالة خاصة مساعدة لمعالجة وتحويل الفئات الفرعية القادمة من Meta إلى المعرفات المحلية
const mapMetaSubCategory = (category, subCategory) => {
    const normalizedCat = String(category || "").toUpperCase();
    const normalizedSub = String(subCategory || "").toUpperCase();

    // 1. معالجة الحالات الخاصة لـ call_permissions_request بناءً على الـ Category الأب
    if (normalizedSub === "CALL_PERMISSIONS_REQUEST") {
        if (normalizedCat === "UTILITY") {
            return "UTILITY_CALL_PERMISSIONS";
        }
        if (normalizedCat === "MARKETING") {
            return "MARKETING_CALL_PERMISSIONS";
        }
    }

    // 2. الفحص التلقائي العادي للتأكد من مطابقة المعرف المحلي
    const categoryObj = CATEGORIES.find(
        (c) => c.id?.toLowerCase() === category?.toLowerCase()
    );

    const subExists = categoryObj?.subcategories.some(
        (s) => s.id?.toLowerCase() === subCategory?.toLowerCase()
    );

    // إذا كانت الفئة الفرعية مدعومة محلياً نرسلها كما هي، وإلا نأخذ أول فئة فرعية افتراضية كـ Fallback
    return subExists ? subCategory : categoryObj?.subcategories[0]?.id;
};


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

/*
⚠ ⚠ ⚠ To access Authentication Message templates, businesses must satisfy the following two requirements:

Complete a Scaling Path: business need to successfully complete one of Meta’s scaling paths, 
such as Meta Business Verification or Partner-led Business Verification.
https://docs.360dialog.com/docs/resources/meta-business-verification#verification-paths

Messaging Limit: WABAs must have a minimum daily messaging limit of 2,000 business-initiated conversations.
https://docs.360dialog.com/docs/resources/wabas/messaging-limits#default-messaging-limit
 */

export default function WhatsAppTemplateFormPage({ mode = "create", templateId, initialTemplate, superAdmin = false }) {
    const router = useRouter();
    const tMsg = useTranslations("whatsApp.templates.messages");
    const tTpl = useTranslations("whatsApp.templates");
    const tForm = useTranslations("whatsApp.templates.form");
    const { settings } = useOrdersSettings();
    const defaultWhatsAppAccountId = settings?.defaultWhatsAppAccountId || "";
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const textareaRef = useRef(null);
    const [variableSamples, setVariableSamples] = useState({ body: {}, header: {} });
    const [variableSamplesErrors, setVariableSamplesErrors] = useState({ header: "", body: "" });
    const [isMetaDialogOpen, setIsMetaDialogOpen] = useState(false);
    const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);
    const [headerMediaFile, setHeaderMediaFile] = useState(null);

    const isEdit = mode === "edit";

    const schema = useMemo(() => createTemplateFormSchema(tForm, isEdit ? "edit" : "create", superAdmin), [tForm, isEdit]);

    const { control, handleSubmit, watch, setValue, setError, clearErrors, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
        mode: "onSubmit",
        defaultValues: {
            accountId: "",
            name: "",
            language: "ar",
            category: "UTILITY",
            subcategory: "UTILITY_DEFAULT",
            headerType: "NONE",
            headerText: "",
            headerUrl: "",
            bodyText: "",
            footerText: "",
            buttons: [],
            authMethod: "COPY_CODE",
            addSecurityRecommendation: false,
            addExpirationTime: false,
            expirationMinutes: 10,
            useCustomValidity: false,
            validityPeriod: "10m",
            otpCopyButtonText: "",
        }
    });

    useEffect(() => {
        if (isEdit) return;
        setValue("accountId", defaultWhatsAppAccountId);
    }, [defaultWhatsAppAccountId]);
    useEffect(() => {
        if (!isEdit || !initialTemplate) return;
        const tpl = initialTemplate;
        const cfg = tpl.templateConfig || {};
        const uiCat = apiCategoryToUi(tpl.category);
        const uiSub = apiSubToUiSub(tpl.subCategory, tpl.category, cfg);
        const body = cfg.bodyText || "";
        const bodyMatches = getVariableMatches(body);
        const headerMatches = getVariableMatches(cfg.headerText || "");
        const newBodySamples = {};
        bodyMatches.forEach((m) => {
            const num = extractVariableNames(m)[0];
            newBodySamples[num] = cfg.examples?.[num] ?? "";
        });
        const newHeaderSamples = {};
        headerMatches.forEach((m) => {
            const num = extractVariableNames(m)[0];
            newHeaderSamples[num] = cfg.examples?.[num] ?? "";
        });
        setVariableSamples({ body: newBodySamples, header: newHeaderSamples });
        setVariableSamplesErrors({ header: "", body: "" });
        const buttonsWithIds = (cfg.buttons || []).map((btn, i) => ({
            ...btn,
            id: btn.id || `btn-${i}-${Math.random().toString(36).slice(2, 9)}`,
        }));
        reset({
            accountId: tpl.accountId || "",
            name: tpl.name || "",
            language: tpl.language || "ar",
            category: uiCat,
            subcategory: uiSub,
            headerType: cfg.headerType || "NONE",
            headerText: cfg.headerText || "",
            headerUrl: cfg.headerUrl || "",
            bodyText: body,
            footerText: cfg.footerText || "",
            buttons: buttonsWithIds,
            authMethod: cfg.authMethod || "COPY_CODE",
            addSecurityRecommendation: !!cfg.addSecurityRecommendation,
            addExpirationTime: !!cfg.addExpirationTime,
            expirationMinutes: cfg.expirationMinutes ?? 10,
            useCustomValidity: cfg.useCustomValidity ?? false,
            validityPeriod: cfg.validityPeriod ?? "10m",
            otpCopyButtonText: cfg.otpCopyButtonText ?? "",
        });
        setHeaderMediaFile(null);
    }, [isEdit, initialTemplate, reset]);

    const templateData = watch();

    const previewHeaderUrl = useMemo(() => {
        const u = templateData.headerUrl;
        if (!u || String(u).startsWith("blob:") || String(u).startsWith("http")) return u;
        const root = (process.env.NEXT_PUBLIC_BASE_URL || "")
            .replace(/\/api\/v1\/?$/i, "")
            .replace(/\/$/, "");
        return `${root}/${String(u).replace(/^\/+/, "")}`;
    }, [templateData.headerUrl]);

    const headerHasVariable = React.useMemo(() => {
        const matches = getVariableMatches(templateData.headerText || "");
        return matches.length >= 1;
    }, [templateData.headerText]);

    const handleHeaderTypeChange = (type) => {
        setValue("headerType", type);
        setValue("headerText", "");
        setValue("headerUrl", "");
        setHeaderMediaFile(null);
        setVariableSamplesErrors((e) => ({ ...e, header: "" }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setHeaderMediaFile?.(file);
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
                message: tForm("validation.bodyVarEdges")
            });
            return false;
        } else if (hasTooManyVariablesForText(text)) {
            setError("bodyText", {
                type: "manual",
                message: tForm("validation.bodyVarDensity")
            });
            return false;
        } else {
            clearErrors("bodyText");
            return true;
        }
    };

    const handleBodyChange = (value) => {
        const val = value;

        if (val.length <= MAX_BODY_LENGTH) {
            const normalized = normalizeVariables(val);
            setValue("bodyText", normalized);
            updateSamples(normalized, "body");
            validateBody(normalized);
            if (getVariableMatches(normalized).length === 0) {
                setVariableSamplesErrors((err) => ({ ...err, body: "" }));
            }
        }
    };

    const handleHeaderTextChange = (e) => {
        const val = e.target.value;
        const matches = getVariableMatches(val);
        if (matches.length <= 1) {
            const normalized = normalizeVariables(val);
            setValue("headerText", normalized);
            updateSamples(normalized, 'header');
            if (getVariableMatches(normalized).length === 0) {
                setVariableSamplesErrors((err) => ({ ...err, header: "" }));
            }
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

    const validateVariableSamplesForSubmit = (data) => {
        const sections = activeSubcategory?.sections || [];
        let headerErr = "";
        let bodyErr = "";

        if (sections.includes("header") && data.headerType === "TEXT") {
            const nums = [...new Set(extractVariableNames(data.headerText || ""))];
            if (nums.some((n) => !(variableSamples.header?.[n] ?? "").toString().trim())) {
                headerErr = tForm("validation.variableSampleRequired");
            }
        }

        if (sections.includes("body") && data.subcategory !== "AUTHENTICATION_OTP") {
            const nums = [...new Set(extractVariableNames(data.bodyText || ""))];
            if (nums.some((n) => !(variableSamples.body?.[n] ?? "").toString().trim())) {
                bodyErr = tForm("validation.variableSampleRequired");
            }
        }

        setVariableSamplesErrors({ header: headerErr, body: bodyErr });
        return !headerErr && !bodyErr;
    };

    const onSubmit = async (data) => {
        const ht = data.headerType;
        if (ht && ["IMAGE", "VIDEO", "DOCUMENT"].includes(ht)) {
            const blob = data.headerUrl && String(data.headerUrl).startsWith("blob:");
            const isUrl = data.headerUrl && (String(data.headerUrl).startsWith("http://") || String(data.headerUrl).startsWith("https://"));
            const isRelativePath = data.headerUrl && (String(data.headerUrl).startsWith("uploads/") || String(data.headerUrl).startsWith("/uploads/"));

            // Allow URL or relative path without requiring file upload
            if (!isEdit && !headerMediaFile && !isUrl && !isRelativePath) {
                toast.error(tForm("validation.mediaHeaderFileRequired"));
                return;
            }
            if (isEdit && blob && !headerMediaFile && !isUrl && !isRelativePath) {
                toast.error(tForm("validation.mediaHeaderMustReupload"));
                return;
            }
        }

        if (!validateVariableSamplesForSubmit(data)) {
            return;
        }

        try {
            if (isEdit) {
                const fdUp = new FormData();

                // 1. إذا كان سوبر أدمن، نرسل البيانات الأساسية المسموح له بتعديلها
                if (superAdmin) {
                    fdUp.append("name", String(data.name || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
                    fdUp.append("category", mapUiCategoryToApi(data.category));
                    fdUp.append("subCategory", mapUiSubToApi(data.subcategory));
                    fdUp.append("language", data.language);
                }

                let forcedUrl;
                const isUrl = data.headerUrl && (String(data.headerUrl).startsWith("http://") || String(data.headerUrl).startsWith("https://"));
                const isRelativePath = data.headerUrl && (String(data.headerUrl).startsWith("uploads/") || String(data.headerUrl).startsWith("/uploads/"));

                // 2. معالجة رفع الملفات إن وجدت قبل تحديث القالب
                if (headerMediaFile) {
                    const fdMedia = new FormData();
                    fdMedia.append("headerMedia", headerMediaFile);
                    const up = await api.post("/whatsapp-templates/upload-header-media", fdMedia);
                    forcedUrl = up.data?.headerUrl;
                } else if (isUrl || isRelativePath) {
                    // Pass URL or relative path to backend
                    forcedUrl = data.headerUrl;
                }

                // 3. بناء الـ templateConfig وإضافته كـ stringified JSON داخل الـ FormData
                const templateConfig = buildTemplateConfigPayload(data, variableSamples, forcedUrl);
                fdUp.append("templateConfig", JSON.stringify(templateConfig));

                // 4. إرسال طلب التحديث كـ FormData ليتعامل معه الـ Backend بسلاسة
                await api.patch(`/whatsapp-templates/${templateId}`, fdUp, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                toast.success(superAdmin ? "تم تحديث القالب" : tMsg("updateSuccess"));
            } else {
                // منطق الإنشاء (Create) كما هو بدون تغيير
                const fd = new FormData();
                if (!superAdmin) {
                    fd.append("accountId", data.accountId);
                }
                fd.append("name", String(data.name || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
                fd.append("category", mapUiCategoryToApi(data.category));
                fd.append("subCategory", mapUiSubToApi(data.subcategory));
                fd.append("language", data.language);

                const isUrl = data.headerUrl && (String(data.headerUrl).startsWith("http://") || String(data.headerUrl).startsWith("https://"));
                const isRelativePath = data.headerUrl && (String(data.headerUrl).startsWith("uploads/") || String(data.headerUrl).startsWith("/uploads/"));

                let templateConfig;
                if (headerMediaFile) {
                    fd.append("headerMedia", headerMediaFile);
                    templateConfig = buildTemplateConfigPayload(data, variableSamples);
                } else if (isUrl || isRelativePath) {
                    // Pass URL or relative path to backend
                    templateConfig = buildTemplateConfigPayload(data, variableSamples, data.headerUrl);
                } else {
                    templateConfig = buildTemplateConfigPayload(data, variableSamples);
                }

                fd.append("templateConfig", JSON.stringify(templateConfig));

                await api.post("/whatsapp-templates", fd, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                toast.success(superAdmin ? "تم إنشاء القالب" : tMsg("createSuccess"));
            }

            router.push(superAdmin ? "/dashboard/whatsapp/templates" : "/whatsapp/templates");
        } catch (e) {
            toast.error(normalizeAxiosError(e) || tMsg("saveError"));
        }
    };

    const handleSubcategoryChange = (subId) => {
        setValue("subcategory", subId);
        setVariableSamplesErrors({ header: "", body: "" });

        // Specific logic for Authentication OTP
        if (subId === "AUTHENTICATION_OTP") {
            setValue("headerType", "NONE");
            setValue("headerText", "");
            setValue("headerUrl", "");
            setValue("bodyText", ""); // Clear body as it's not used/editable for OTP
            setValue("buttons", []);
        }

        if (subId === "UTILITY_CALL_PERMISSIONS" || subId === "MARKETING_CALL_PERMISSIONS") {
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

        if (catId === "MARKETING") {
            setValue("useCustomValidity", false);
        }
    };

    const hasTemplateContent = useMemo(() => {
        return activeSubcategory?.sections?.some(section =>
            ["body", "header", "header_text_only", "footer"].includes(section)
        );
    }, [activeSubcategory?.sections]);


    // 3. Handle selection
    const handleMetaTemplateSelect = (selectedTpl) => {
        console.log(selectedTpl);
        const { templateConfig: tplData, name, category, subCategory, language } = selectedTpl;

        // Ensure buttons have unique IDs for the builder
        const buttonsWithIds = (tplData?.buttons || []).map(btn => ({
            ...btn,
            id: btn.id || `btn-${Math.random().toString(36).substr(2, 9)}`
        }));

        // 1. Reset Form Values
        setValue("name", name);
        setValue("language", language === "en_US" ? "en" : language);
        setValue("category", category?.toUpperCase());

        // Map subcategory if it matches our internal IDs, otherwise fallback to default
        const mappedSubCategory = mapMetaSubCategory(category, subCategory);
        setValue("subcategory", mappedSubCategory);
        setValue("headerType", tplData?.headerType || "TEXT");
        setValue("headerText", tplData?.headerText || "");
        setValue("headerUrl", tplData?.headerUrl || "");
        setValue("bodyText", tplData?.bodyText || "");
        setValue("footerText", tplData?.footerText || "");
        setValue("buttons", buttonsWithIds);

        // 2. Update Samples State
        const bodyMatches = getVariableMatches(tplData?.bodyText || "");
        const headerMatches = getVariableMatches(tplData?.headerText || "");

        const newBodySamples = {};
        bodyMatches.forEach(m => {
            const num = extractVariableNames(m)[0];
            newBodySamples[num] = tplData?.examples?.[num] || "";
        });

        const newHeaderSamples = {};
        headerMatches.forEach(m => {
            const num = extractVariableNames(m)[0];
            newHeaderSamples[num] = tplData?.examples?.[num] || "";
        });

        setVariableSamples({
            body: newBodySamples,
            header: newHeaderSamples
        });

        // 3. Clear any previous errors
        clearErrors();
        setVariableSamplesErrors({ header: "", body: "" });
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
                        { name: tTpl("breadcrumb.home"), href: "/dashboard" },
                        ...(!superAdmin ? [{ name: tTpl("breadcrumb.whatsapp"), href: "/whatsapp" }] : []),
                        { name: tTpl("breadcrumb.templates"), href: superAdmin ? "/dashboard/whatsapp/templates" : "/whatsapp/templates" },
                        { name: isEdit ? tForm("breadcrumbs.edit") : tForm("breadcrumbs.create") }
                    ]}
                    buttons={
                        <>
                            {!isEdit && !superAdmin && (
                                <>
                                    <Button_
                                        size="sm"
                                        label={tForm("internalTemplates")}
                                        tone="secondary"
                                        variant="outline"
                                        onClick={() => setIsInternalDialogOpen(true)}
                                        icon={<Layout size={18} />}
                                        className="border-slate-200 dark:border-slate-800"
                                    />
                                    <Button_
                                        size="sm"
                                        label={tForm("importMeta")}
                                        tone="secondary"
                                        variant="outline"
                                        onClick={() => setIsMetaDialogOpen(true)}
                                        icon={<Facebook size={18} />}
                                        className="border-slate-200 dark:border-slate-800"
                                    />
                                </>
                            )}
                            <Button_
                                size="sm"
                                label={superAdmin ? (isEdit ? "تحديث" : "إنشاء") : (isEdit ? tForm("submitUpdate") : tForm("submitCreate"))}
                                tone="primary"
                                variant="solid"
                                disabled={isSubmitting}
                                onClick={handleSubmit(onSubmit)}
                                icon={isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
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
                                {!isEdit && !superAdmin && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Controller
                                            name="accountId"
                                            control={control}
                                            render={({ field }) => (
                                                <WhatsAppAccountSelect
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    label={tForm("accountLabel")}
                                                />
                                            )}
                                        />
                                        {errors.accountId && (
                                            <p className="text-xs text-red-500">{errors.accountId.message}</p>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <Label>اسم القالب</Label>
                                    <Input
                                        placeholder="مثال: order_confirmation_v1"
                                        className="lowercase"
                                        disabled={isEdit && !superAdmin}
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
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isEdit && !superAdmin}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر اللغة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">الإنجليزية</SelectItem>
                                                    <SelectItem value="en_US">الإنجليزية (US)</SelectItem>
                                                    <SelectItem value="ar">العربية (ar)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">

                                <Label className="mb-3 block text-base mb-1.5">اختر الفئة</Label>
                                <div className={cn("flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl mb-6", isEdit && !superAdmin && "opacity-60 pointer-events-none")}>
                                    {CATEGORIES.map((cat) => {
                                        const isSelected = templateData.category === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                disabled={isEdit && !superAdmin}
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
                                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                            </div>

                            {/* Subcategories List */}
                            <div className="space-y-3 mb-8">
                                {activeCategory?.subcategories.map((sub) => {
                                    const isSubSelected = templateData.subcategory === sub.id;
                                    return (
                                        <div
                                            key={sub.id}
                                            onClick={() => (!isEdit || superAdmin) && handleSubcategoryChange(sub.id)}
                                            className={cn(
                                                "rounded-md p-4 border-2 transition-all duration-200 flex items-start gap-4",
                                                isEdit && !superAdmin ? "opacity-60 cursor-default" : "cursor-pointer",
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
                                {errors.subcategory && <p className="text-xs text-red-500">{errors.subcategory.message}</p>}
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
                                                    onSampleChange={(num, val) => {
                                                        const nextHeader = { ...variableSamples.header, [num]: val };
                                                        setVariableSamples((prev) => ({
                                                            ...prev,
                                                            header: nextHeader
                                                        }));
                                                        const nums = [...new Set(extractVariableNames(templateData.headerText || ""))];
                                                        if (nums.length && nums.every((n) => (nextHeader[n] ?? "").toString().trim())) {
                                                            setVariableSamplesErrors((err) => ({ ...err, header: "" }));
                                                        }
                                                    }}
                                                />
                                                {variableSamplesErrors.header && (
                                                    <p className="text-[11px] text-red-500 mt-1">{variableSamplesErrors.header}</p>
                                                )}
                                            </motion.div>
                                        )}

                                        {["IMAGE", "VIDEO", "DOCUMENT"].includes(templateData.headerType) && (
                                            <MediaUpload
                                                type={templateData.headerType}
                                                url={templateData.headerUrl}
                                                onUrlChange={(url) => {
                                                    setValue("headerUrl", url);
                                                    if (!url) setHeaderMediaFile(null);
                                                }}
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
                                    <>
                                        <WhatsAppMessageBodyBuilder
                                            ref={textareaRef}
                                            value={templateData.bodyText}
                                            onChange={handleBodyChange}
                                            label="النص"
                                            placeholder="أدخل نص الرسالة الرئيسي..."
                                            allowVariables={true}
                                            onInsertVariable={() => insertText("variable")}
                                            error={errors.bodyText?.message}
                                            className="mb-8"
                                        />

                                        <VariableSamplesSection
                                            type="body"
                                            samples={variableSamples.body}
                                            onSampleChange={(num, val) => {
                                                const nextBody = { ...variableSamples.body, [num]: val };
                                                setVariableSamples((prev) => ({
                                                    ...prev,
                                                    body: nextBody
                                                }));
                                                const nums = [...new Set(extractVariableNames(templateData.bodyText || ""))];
                                                if (nums.length && nums.every((n) => (nextBody[n] ?? "").toString().trim())) {
                                                    setVariableSamplesErrors((err) => ({ ...err, body: "" }));
                                                }
                                            }}
                                        />

                                    </>
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
                                                {/* {templateData.authMethod === "COPY_CODE" && (
                                                    <div className="mt-3 space-y-1.5">
                                                        <Label className="text-[11px] text-slate-500">نص زر النسخ (اختياري)</Label>
                                                        <Input
                                                            placeholder="Copy code — افتراضي واتساب"
                                                            maxLength={25}
                                                            value={templateData.otpCopyButtonText || ""}
                                                            onChange={(e) => setValue("otpCopyButtonText", e.target.value)}
                                                            className="text-sm max-w-md"
                                                        />
                                                    </div>
                                                )} */}
                                            </div>
                                        </div>
                                    </div>

                                    {/* <div
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
                                    </div> */}
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
                                                    {templateData.category?.toLowerCase() !== "authentication" && (
                                                        <>
                                                            <SelectItem value="30m">30 دقيقة</SelectItem>
                                                            <SelectItem value="1h">1 ساعة</SelectItem>
                                                            <SelectItem value="3h">3 ساعات</SelectItem>
                                                            <SelectItem value="6h">6 ساعات</SelectItem>
                                                            <SelectItem value="12h">12 ساعة</SelectItem>
                                                        </>
                                                    )}
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
                                            errors={errors}
                                            value={field.value || []}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
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
                                            subCategory: templateData.subcategory,
                                            headerType: templateData.headerType,
                                            headerText: templateData.headerText,
                                            headerUrl: previewHeaderUrl,
                                            bodyText: getPreviewBody(),
                                            footerText: getPreviewFooter(),
                                            buttons: templateData.buttons,
                                            headerExample: variableSamples.header["1"],
                                            useCustomValidity: templateData.useCustomValidity,
                                            validityPeriod: templateData.validityPeriod,
                                            otpCopyButtonText: templateData.otpCopyButtonText,
                                            authMethod: templateData.authMethod,
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
                    library={true}
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