"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Edit2,
    Trash2,
    Settings2,
    PlugZap,
    Server,
    Star,
    Check,
    X,
    Zap,
    Eye,
    Layers,
    BrainCircuit,
    Activity,
    FileCode,
    Search,
    Save,
    Info,
    Plus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslations, useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useDebounce } from "@/hook/useDebounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

function normalizeAxiosError(err) {
    const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
    return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

const PROVIDER_ICONS = {
    openai: "◎",
    anthropic: "AI",
    google: "G",
    deepseek: "◆",
    llm7: "L7",
    pollinations: "✿",
};

const PROVIDER_ICON_CLASSES = {
    openai: "text-[22px]",
    anthropic: "bg-[#f4eee5] text-[20px]",
    google: "text-[#4285f4] text-[20px]",
    deepseek: "bg-[#eef1ff] text-[#4460df]",
    llm7: "bg-[#111318] text-white text-[11px]",
    pollinations: "bg-[#111318] text-white text-[20px]",
};

function getProviderIcon(provider) {
    if (provider.logoUrl) return null;
    if (provider.scope === "custom") return "MC";
    console.log("provider: ", provider)
    return PROVIDER_ICONS[provider.code] ?? provider.code?.charAt(0)?.toUpperCase() ?? "?";
}

function getProviderIconClasses(provider) {
    if (provider.scope === "custom") return "bg-[#5638e8] text-white";
    return PROVIDER_ICON_CLASSES[provider.code] || "bg-muted text-foreground";
}

// ─────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────
const editProviderSchema = (t) => yup.object({
    name: yup.string().trim().required(t("validation.nameRequired")).max(150, t("validation.nameMaxLength")),
    code: yup.string().trim().required(t("validation.codeRequired")).max(100, t("validation.codeMaxLength")),
    website: yup.string().trim().nullable().optional().test(
        "is-url-or-empty",
        t("validation.baseUrlInvalid"),
        (value) => !value || value.trim().length === 0 || yup.string().url().isValidSync(value)
    ),
    baseUrl: yup.string().trim().nullable().optional().test(
        "is-url-or-empty",
        t("validation.baseUrlInvalid"),
        (value) => !value || value.trim().length === 0 || yup.string().url().isValidSync(value)
    ),
    description: yup.string().trim().nullable().optional(),
    descriptionAr: yup.string().trim().nullable().optional(),
    protocol: yup.string().nullable().optional(),
    authType: yup.string().required(t("validation.authTypeRequired")),
    isActive: yup.boolean().default(true),
});

const configFormSchema = (t) => yup.object({
    baseUrl: yup.string().trim().nullable().optional().test(
        "is-url-or-empty",
        t("validation.baseUrlInvalid"),
        (value) => !value || value.trim().length === 0 || yup.string().url().isValidSync(value)
    ),
    apiKey: yup.string().trim().when("authType", {
        is: "api_key",
        then: (s) => s.required(t("validation.apiKeyRequired")),
        otherwise: (s) => s.nullable().optional(),
    }),
    bearerToken: yup.string().trim().when("authType", {
        is: "bearer",
        then: (s) => s.required(t("validation.bearerTokenRequired")),
        otherwise: (s) => s.nullable().optional(),
    }),
});

const editModelSchema = (t) => yup.object({
    name: yup.string().trim().required(t("validation.modelNameRequired")).max(255, t("validation.modelNameMaxLength")),
    modelCode: yup.string().trim().required(t("validation.modelCodeRequired")).max(255, t("validation.modelCodeMaxLength")),
    description: yup.string().trim().nullable().optional(),
    descriptionAr: yup.string().trim().nullable().optional(),
    modelType: yup.string().required(t("validation.modelTypeRequired")),
    tier: yup.string().nullable().optional(),
    isActive: yup.boolean().default(true),
    stream: yup.boolean().nullable().optional(),
    jsonMode: yup.boolean().nullable().optional(),
    reasoning: yup.boolean().nullable().optional(),
    toolsCalling: yup.boolean().nullable().optional(),
});

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
function StatusBadge({ connected, className }) {
    const t = useTranslations("ai");
    if (connected) {
        return (
            <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                "text-[#14945a] bg-[#e9f8f0]",
                className
            )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {t("status.connected")}
            </span>
        );
    }
    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
            "text-[#c47a00] bg-[#fff6df]",
            className
        )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {t("status.notConnected")}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────
// EDIT PROVIDER DIALOG
// ─────────────────────────────────────────────────────────────
function EditProviderDialog({ open, onOpenChange, provider, onSuccess }) {
    const t = useTranslations("ai");
    const schema = useMemo(() => editProviderSchema(t), [t]);

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            code: "",
            website: "",
            baseUrl: "",
            description: "",
            descriptionAr: "",
            protocol: "openai_compatible",
            authType: "api_key",
            isActive: true,
        },
    });

    useEffect(() => {
        if (open && provider) {
            reset({
                name: provider.name || "",
                code: provider.code || "",
                website: provider.website || "",
                baseUrl: provider.integration?.baseUrl || provider.baseUrl || "",
                description: provider.description || "",
                descriptionAr: provider.descriptionAr || "",
                protocol: provider.protocol || "openai_compatible",
                authType: provider.authType || "api_key",
                isActive: provider.isActive !== false,
            });
        }
    }, [provider, open, reset]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                name: data.name,
                code: data.code,
                website: data.website || null,
                baseUrl: data.baseUrl || null,
                description: data.description || null,
                descriptionAr: data.descriptionAr || null,
                protocol: data.protocol || null,
                authType: data.authType,
                isActive: true,
            };
            await api.patch(`/ai/providers/${provider.id}`, payload);
            toast.success(t("messages.providerUpdated"));
            onSuccess?.();
            onOpenChange(false);
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !isSubmitting && onOpenChange(v)}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl">
                <DialogHeader className="px-6 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Edit2 className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[17px]">{t("dialog.editProviderTitle")}</span>
                    </DialogTitle>
                </DialogHeader>

                <form className="overflow-y-auto max-h-[70vh] p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-foreground">{t("provider.name")}</Label>
                            <Input {...register("name")} placeholder={t("providerPlaceholder.name")} className="h-[38px] rounded-lg text-xs border-border" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-foreground">{t("provider.code")}</Label>
                            <Input {...register("code")} placeholder={t("providerPlaceholder.code")} className="h-[38px] rounded-lg text-xs border-border" dir="ltr" />
                            {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
                        </div>

                        {/* <div className="space-y-1.5"> 
                            <Label className="text-[11px] font-semibold text-foreground">{t("provider.protocol")}</Label>
                            <Controller
                                name="protocol"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value || ""} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-[38px] rounded-lg text-xs border-border">
                                            <SelectValue placeholder={t("providerPlaceholder.protocol")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="openai_compatible">{t("protocol.openai_compatible")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-foreground">{t("provider.authType")}</Label>
                            <Controller
                                name="authType"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-[38px] rounded-lg text-xs border-border">
                                            <SelectValue placeholder={t("providerPlaceholder.authType")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="api_key">{t("authType.api_key")}</SelectItem>
                                            <SelectItem value="bearer">{t("authType.bearer")}</SelectItem>
                                            <SelectItem value="none">{t("authType.none")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.authType && <p className="text-xs text-red-600">{errors.authType.message}</p>}
                        </div> */}

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-[11px] font-semibold text-foreground">{t("provider.website")}</Label>
                            <Input {...register("website")} placeholder="https://example.com" className="h-[38px] rounded-lg text-xs border-border" dir="ltr" />
                            {errors.website && <p className="text-xs text-red-600">{errors.website.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-[11px] font-semibold text-foreground">{t("provider.baseUrl")}</Label>
                            <Input {...register("baseUrl")} placeholder="https://api.example.com/v1" className="h-[38px] rounded-lg text-xs border-border" dir="ltr" />
                            {errors.baseUrl && <p className="text-xs text-red-600">{errors.baseUrl.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-[11px] font-semibold text-foreground">{t("model.description")}</Label>
                            <Textarea rows={4} {...register("description")} placeholder={t("modelPlaceholder.description")} className="rounded-lg min-h-[80px] text-xs border-border" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-[11px] font-semibold text-foreground">{t("model.descriptionAr")}</Label>
                            <Textarea rows={4} {...register("descriptionAr")} placeholder={t("modelPlaceholder.descriptionAr")} className="rounded-lg min-h-[80px] text-xs border-border" dir="rtl" />
                        </div>
                    </div>

                </form>
                <DialogFooter className="px-6 py-4 border-t border-border bg-background">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        {t("dialog.cancel")}
                    </Button>

                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            t("dialog.update")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────
// EDIT MODEL DIALOG
// ─────────────────────────────────────────────────────────────
function EditModelDialog({ open, onOpenChange, model, onSuccess }) {
    const t = useTranslations("ai");
    const schema = useMemo(() => editModelSchema(t), [t]);

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            modelCode: "",
            description: "",
            descriptionAr: "",
            modelType: "text",
            tier: "pro",
            isActive: true,
            stream: true,
            jsonMode: true,
            reasoning: true,
            toolsCalling: true,
        },
    });

    useEffect(() => {
        if (open && model) {
            reset({
                name: model.name || "",
                modelCode: model.modelCode || "",
                description: model.description || "",
                descriptionAr: model.descriptionAr || "",
                modelType: "text",
                tier: model.tier || "pro",
                isActive: true,
                stream: true,
                jsonMode: true,
                reasoning: true,
                toolsCalling: true,
            });
        }
    }, [model, open, reset]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                name: data.name,
                modelCode: data.modelCode,
                description: data.description || null,
                descriptionAr: data.descriptionAr || null,
                modelType: "text",
                tier: data.tier || null,
                isActive: true,
                stream: true,
                jsonMode: true,
                reasoning: true,
                toolsCalling: true,
            };
            await api.patch(`/ai/models/${model.id}`, payload);
            toast.success(t("messages.modelUpdated"));
            onSuccess?.();
            onOpenChange(false);
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !isSubmitting && onOpenChange(v)}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl">
                <DialogHeader className="px-6 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Edit2 className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[17px]">{t("dialog.editCustomModelTitle")}</span>
                    </DialogTitle>
                </DialogHeader>

                <form className="overflow-y-auto max-h-[70vh] p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-foreground">{t("model.name")}</Label>
                            <Input {...register("name")} placeholder={t("modelPlaceholder.name")} className="h-[38px] rounded-lg text-xs border-border" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-foreground">{t("model.modelCode")}</Label>
                            <Input {...register("modelCode")} placeholder={t("modelPlaceholder.modelCode")} className="h-[38px] rounded-lg text-xs border-border" dir="ltr" />
                            {errors.modelCode && <p className="text-xs text-red-600">{errors.modelCode.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-[11px] font-semibold text-foreground">{t("model.description")}</Label>
                            <Textarea rows={4} {...register("description")} placeholder={t("modelPlaceholder.description")} className="rounded-lg min-h-[80px] text-xs border-border" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-[11px] font-semibold text-foreground">{t("model.descriptionAr")}</Label>
                            <Textarea rows={4} {...register("descriptionAr")} placeholder={t("modelPlaceholder.descriptionAr")} className="rounded-lg min-h-[80px] text-xs border-border" dir="rtl" />
                        </div>
                    </div>

                </form>
                <DialogFooter className="px-6 py-4 pt-4 border-t border-border bg-background">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        {t("dialog.cancel")}
                    </Button>

                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className=""
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            t("dialog.update")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────
// CONFIGURATIONS TAB
// ─────────────────────────────────────────────────────────────
function ConfigurationsTab({ provider, integration, loading, saving, onSave, onTest, testing, defaultModel, locale }) {
    const t = useTranslations("ai");
    const isCustom = provider?.scope === "custom";
    const authType = provider?.authType || integration?.authType || "api_key";
    const isConnected = !!integration;
    const defaultModelForProvider = defaultModel?.model?.provider?.id === provider?.id ? defaultModel.model : null;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(configFormSchema(t)),
        defaultValues: {
            baseUrl: "",
            apiKey: "",
            bearerToken: "",
            authType: authType,
        },
    });

    useEffect(() => {
        if (provider || integration) {
            reset({
                baseUrl: integration?.baseUrl || provider?.baseUrl || "",
                apiKey: "",
                bearerToken: "",
                authType: authType,
            });
        }
    }, [provider, integration, reset, authType]);

    const onSubmit = async (data) => {
        const credentials = {};
        if (authType === "api_key" && data.apiKey) {
            credentials.apiKey = data.apiKey;
        } else if (authType === "bearer" && data.bearerToken) {
            credentials.bearerToken = data.bearerToken;
        }

        await onSave({
            baseUrl: data.baseUrl || null,
            credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
        });
    };

    if (loading && !provider) {
        return (
            <div className="space-y-4 py-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2 animate-pulse">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-10 w-full bg-muted rounded-lg" />
                    </div>
                ))}
            </div>
        );
    }

    const providerType = isCustom ? t("scope.custom") : t("scope.system");
    const protocolLabel = provider?.protocol === "openai_compatible" ? t("protocol.openai_compatible") : provider?.protocol || "—";
    const authLabel = authType === "api_key" ? t("authType.api_key") : authType === "bearer" ? t("authType.bearer") : t("authType.none");

    return (
        <div className="space-y-5">

            {/* ── Provider Information Card ────────────────── */}
            <div className="border border-border rounded-[10px] overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-white">
                    <h3 className="text-[13px] font-semibold text-foreground">{t("tabs.configurations")}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t("provider.infoSubtitle")}
                    </p>
                </div>
                <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-[10px] text-muted-foreground mb-1">{t("provider.name")}</label>
                            <strong className="text-xs font-semibold text-foreground">{provider?.name || "—"}</strong>
                        </div>
                        <div>
                            <label className="block text-[10px] text-muted-foreground mb-1">{t("provider.code")}</label>
                            <strong className="text-xs font-semibold text-foreground">{provider?.code || "—"}</strong>
                        </div>
                        <div>
                            <label className="block text-[10px] text-muted-foreground mb-1">{t("provider.type")}</label>
                            <strong className="text-xs font-semibold text-foreground">{providerType}</strong>
                        </div>
                        {/* <div>
                            <label className="block text-[10px] text-muted-foreground mb-1">{t("provider.protocol")}</label>
                            <strong className="text-xs font-semibold text-foreground">{protocolLabel}</strong>
                        </div> */}
                        {provider?.website && (
                            <div>
                                <label className="block text-[10px] text-muted-foreground mb-1">{t("provider.website")}</label>
                                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">
                                    {provider.website}
                                </a>
                            </div>
                        )}
                        {/* <div>
                            <label className="block text-[10px] text-muted-foreground mb-1">{t("provider.authType")}</label>
                            <strong className="text-xs font-semibold text-foreground">{authLabel}</strong>
                        </div> */}
                        {provider?.description && (
                            <div className="col-span-2">
                                <label className="block text-[10px] text-muted-foreground mb-1">{t("model.description")}</label>
                                <div className="text-xs text-foreground prose prose-xs max-w-none">
                                    <ReactMarkdown>
                                        {locale === "ar" ? (provider.descriptionAr || provider.description) : provider.description}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Integration Card ─────────────────────────── */}
            <div className="border border-border rounded-[10px] overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-white">
                    <h3 className="text-[13px] font-semibold text-foreground">{t("integration.title")}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isConnected
                            ? t("integration.configured")
                            : t("integration.notConfigured")
                        }
                    </p>
                </div>
                <div className="p-4 bg-white space-y-4">


                    {/* Integration Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-foreground">{t("provider.apiKey")}</Label>
                            <Input
                                type="password"
                                {...register("apiKey")}
                                placeholder={isConnected && integration?.credentials?.apiKey ? integration.credentials.apiKey : t("providerPlaceholder.apiKey")}
                                className="h-[38px] rounded-lg text-xs border-border"
                                dir="ltr"
                            />
                            {errors.apiKey && <p className="text-xs text-red-600">{errors.apiKey.message}</p>}
                            {isConnected && integration?.lastValidatedAt && (
                                <p className="text-[10px] text-muted-foreground">
                                    {t("integration.lastTested")}: {new Date(integration.lastValidatedAt).toLocaleString()}
                                </p>
                            )}
                        </div>

                        {authType === "bearer" && (
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-foreground">{t("provider.bearerToken")}</Label>
                                <Input
                                    type="password"
                                    {...register("bearerToken")}
                                    placeholder={isConnected && integration?.credentials?.bearerToken ? integration.credentials.bearerToken : t("providerPlaceholder.bearerToken")}
                                    className="h-[38px] rounded-lg text-xs border-border"
                                    dir="ltr"
                                />
                                {errors.bearerToken && <p className="text-xs text-red-600">{errors.bearerToken.message}</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {isCustom && (
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-foreground">{t("provider.baseUrl")}</Label>
                                    <Input
                                        {...register("baseUrl")}
                                        placeholder="https://api.example.com/v1"
                                        className="h-[38px] rounded-lg text-xs border-border"
                                        dir="ltr"
                                    />
                                    {errors.baseUrl && <p className="text-xs text-red-600">{errors.baseUrl.message}</p>}
                                </div>
                            )}
                        </div>

                        {integration?.lastError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/60 p-3">
                                <p className="text-xs text-red-700 dark:text-red-300">{integration.lastError}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-end pt-3 border-t border-border">
                            <Button
                                type="submit"
                                disabled={isSubmitting || saving}
                                className="h-[34px] px-4 rounded-lg text-[11px] font-semibold"
                            >
                                {(isSubmitting || saving) ? <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" /> : <Save className="w-3.5 h-3.5 me-1.5" />}
                                {t("integration.saveCredentials")}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Default Model Card ───────────────────────── */}
            {defaultModelForProvider && (<div className="border border-border rounded-[10px] overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-white">
                    <h3 className="text-[13px] font-semibold text-foreground">{t("defaultModel.title")}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t("defaultModel.subtitle")}
                    </p>
                </div>
                <div className="p-4 bg-white">
                    <div className="border border-primary/20 bg-primary/5 rounded-[9px] p-3.5">
                        <div className="text-[11px] font-bold text-foreground mb-2.5">{t("defaultModel.providerDefault")}</div>
                        {defaultModelForProvider ? (
                            <div className="flex items-center justify-between p-3 border border-primary/30 rounded-lg bg-white">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-foreground">{defaultModelForProvider.name || defaultModelForProvider.modelCode}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#14945a] bg-[#e9f8f0]">
                                            {t("status.default")}
                                        </span>
                                    </div>
                                    {defaultModelForProvider.description && (
                                        <div className="text-[10px] text-muted-foreground mt-1 prose prose-xs max-w-none">
                                            <ReactMarkdown>
                                                {locale === "ar" ? (defaultModelForProvider.descriptionAr || defaultModelForProvider.description) : defaultModelForProvider.description}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-3 border border-dashed border-primary/30 rounded-lg">
                                <span className="text-xs text-muted-foreground">{t("defaultModel.noDefault")}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-primary">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>{t("defaultModel.note")}</span>
                        </div>
                    </div>
                </div>
            </div>)}

        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MODELS TAB
// ─────────────────────────────────────────────────────────────
function ModelsTab({ models, loading, provider, onEditModel, onDeleteModel, onSetDefault, defaultModelId, settingDefaultId, hasPermission, locale, providerConnected }) {
    const t = useTranslations("ai");
    const [search, setSearch] = useState("");

    const filteredModels = useMemo(() => {
        if (!search.trim()) return models;
        const q = search.toLowerCase();
        return models.filter(
            (m) =>
                m.name?.toLowerCase().includes(q) ||
                m.modelCode?.toLowerCase().includes(q)
        );
    }, [models, search]);

    if (loading) {
        return (
            <div className="space-y-2 py-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 border border-border rounded-[9px] animate-pulse">
                        {/* <div className="w-8.5 h-8.5 rounded-lg bg-muted" /> */}
                        <div className="flex-1 space-y-2">
                            <div className="h-3.5 w-1/3 bg-muted rounded" />
                            <div className="h-2.5 w-1/4 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (models.length === 0) {
        return (
            <EmptyState
                icon={<Layers className="w-10 h-10 text-muted-foreground/40" />}
                title={t("empty.modelsTitle")}
                subtitle={t("empty.modelsSubtitle")}
            />
        );
    }

    const modelTypeLabels = {
        text: "Text",
        image: "Image",
        audio: "Audio",
        video: "Video",
    };

    return (
        <div>
            {/* Model Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{t("tabs.models")}</h3>
                    <div className="text-[10px] text-muted-foreground mt-1">
                        {t("models.availableSubtitle")}
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("models.searchPlaceholder")}
                        className="h-[35px] w-full sm:w-[210px] rounded-lg border border-border text-xs ps-8 pe-3 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(var(--primary-shadow)/0.08)]"
                    />
                </div>
            </div>

            {/* Model List */}
            <div className="space-y-2">
                {filteredModels.map((model) => {
                    const isDefault = defaultModelId?.modelId === model.id;
                    const isCustom = model.scope === "custom";

                    const capabilities = [];
                    if (model.toolsCalling) capabilities.push(t("capability.toolCalls"));
                    if (model.reasoning) capabilities.push(t("capability.vision"));
                    if (model.jsonMode) capabilities.push(t("capability.structured"));
                    if (model.stream) capabilities.push(t("capability.streaming"));

                    const typeIcon = {
                        text: "TXT",
                        image: "IMG",
                        audio: "AUD",
                        video: "VID",
                    }[model.modelType] || "TXT";

                    const actions = [];
                    if (hasPermission("ai.manage")) {
                        const isSettingDefault = settingDefaultId === model.id;
                        if (!isDefault) {
                            actions.push({
                                key: "default",
                                icon: isSettingDefault ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />,
                                tooltip: providerConnected ? t("actions.setDefaultModel") : t("actions.setDefaultModelDisabled"),
                                onClick: providerConnected && !isSettingDefault ? () => onSetDefault?.(model) : undefined,
                                variant: "slate",
                                disabled: !providerConnected || isSettingDefault,
                            });
                        }
                    }
                    if (hasPermission("ai.manage") && isCustom) {
                        actions.push({
                            key: "edit",
                            icon: <Edit2 className="w-3.5 h-3.5" />,
                            tooltip: t("actions.editModel"),
                            onClick: () => onEditModel?.(model),
                            variant: "primary",
                        });
                        actions.push({
                            key: "delete",
                            icon: <Trash2 className="w-3.5 h-3.5" />,
                            tooltip: t("actions.deleteModel"),
                            onClick: () => onDeleteModel?.(model),
                            variant: "red",
                        });
                    }

                    return (
                        <motion.div
                            key={model.id}
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-3.5 border border-border rounded-[9px] hover:border-primary/30 hover:border-primary/50 transition-colors"
                        >
                            {/* <div className="w-[34px] h-[34px] rounded-lg bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                                {typeIcon}
                            </div> */}

                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-foreground">{model.name}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{model.modelCode}</div>
                                {(model.description || model.descriptionAr) && (
                                    <div className="text-[10px] text-muted-foreground mt-1 prose prose-xs max-w-none">
                                        <ReactMarkdown>
                                            {locale === "ar" ? (model.descriptionAr || model.description) : (model.description || model.descriptionAr)}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                {capabilities.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {capabilities.map((cap) => (
                                            <span key={cap} className="px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 text-[9px]">
                                                {cap}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {isDefault && (
                                    <span className="px-1.5 py-1 rounded-[5px] bg-success/10 text-success text-[9px] font-bold">
                                        {t("status.default")}
                                    </span>
                                )}
                                {actions.length > 0 && (
                                    <ActionButtons actions={actions} />
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function AddProviderDialog({ open, onClose, onSuccess }) {
    const t = useTranslations("ai");
    const locale = useLocale();

    const [loading, setLoading] = useState(false);
    const dir = locale === "ar" ? "rtl" : "ltr";

    const schema = useMemo(
        () =>
            yup.object().shape({
                name: yup.string().trim().required(t("validation.nameRequired")),
                code: yup.string().trim().required(t("validation.codeRequired")),
                description: yup.string().trim().notRequired(),
                descriptionAr: yup.string().trim().notRequired(),
                website: yup.string().trim().url(t("validation.invalidUrl")).notRequired().default(""),
                baseUrl: yup.string().trim().url(t("validation.invalidUrl")).notRequired().default(""),
                apiKey: yup.string().trim().required(t("validation.apiKeyRequired")),
                isActive: yup.boolean().default(true),
            }),
        [t]
    );

    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            descriptionAr: "",
            website: "",
            protocol: "openai_compatible",
            authType: "api_key",
            baseUrl: "",
            apiKey: "",
            isActive: true,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: "",
                code: "",
                description: "",
                descriptionAr: "",
                website: "",
                protocol: "openai_compatible",
                authType: "api_key",
                baseUrl: "",
                apiKey: "",
                isActive: true,
            });
        }
    }, [open, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        try {
            setLoading(true);
            const payload = {
                name: values.name.trim(),
                code: values.code.trim(),
                description: values.description?.trim() || undefined,
                descriptionAr: values.descriptionAr?.trim() || undefined,
                website: values.website?.trim() || undefined,
                protocol: values.protocol || undefined,
                authType: values.authType || undefined,
                baseUrl: values.baseUrl?.trim() || undefined,
                credentials: values.apiKey?.trim() ? { apiKey: values.apiKey.trim() } : undefined,
                isActive: true,
            };
            await api.post("/ai/providers", payload);
            toast.success(t("messages.providerCreated"));
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || t("messages.errorOccurred"));
        } finally {
            setLoading(false);
        }
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent dir={dir} className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-[16px] font-bold text-foreground">{t("actions.addProvider")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-foreground">{t("provider.name")} <span className="text-red-500">*</span></Label>
                            <Input {...form.register("name")} placeholder={t("providerPlaceholder.name")} />
                            {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-foreground">{t("provider.code")} <span className="text-red-500">*</span></Label>
                            <Input {...form.register("code")} placeholder={t("providerPlaceholder.code")} dir="ltr" />
                            {form.formState.errors.code && <p className="text-xs text-red-500 mt-1">{form.formState.errors.code.message}</p>}
                        </div>
                    </div>
                    {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-foreground">{t("provider.protocol")}</Label>
                            <input type="hidden" {...form.register("protocol")} value="openai_compatible" />
                            <div className="h-[40px] rounded-md border border-border bg-gray-50 flex items-center px-3">
                                <span className="text-sm">{t("protocol.openai_compatible") || "OpenAI Compatible"}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-foreground">{t("provider.authType")}</Label>
                            <input type="hidden" {...form.register("authType")} value="api_key" />
                            <div className="h-[40px] rounded-md border border-border bg-gray-50 flex items-center px-3">
                                <span className="text-sm">{t("authType.api_key") || "API Key"}</span>
                            </div>
                        </div>
                    </div> */}
                    <div className="space-y-1.5">
                        <Label className="text-foreground">{t("provider.website")}</Label>
                        <Input {...form.register("website")} placeholder="https://example.com" dir="ltr" />
                        {form.formState.errors.website && <p className="text-xs text-red-500 mt-1">{form.formState.errors.website.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-foreground">{t("provider.baseUrl")}</Label>
                        <Input {...form.register("baseUrl")} placeholder="https://api.example.com/v1" dir="ltr" />
                        {form.formState.errors.baseUrl && <p className="text-xs text-red-500 mt-1">{form.formState.errors.baseUrl.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-foreground">{t("provider.apiKey")} <span className="text-red-500">*</span></Label>
                        <Input {...form.register("apiKey")} type="password" placeholder={t("providerPlaceholder.apiKey")} dir="ltr" />
                        {form.formState.errors.apiKey && <p className="text-xs text-red-500 mt-1">{form.formState.errors.apiKey.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-foreground">{t("model.description")}</Label>
                        <textarea rows={4} {...form.register("description")} className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none" placeholder={t("modelPlaceholder.description")} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-foreground">{t("model.descriptionAr")}</Label>
                        <textarea rows={4} {...form.register("descriptionAr")} dir="rtl" className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-right" placeholder={t("modelPlaceholder.descriptionAr")} />
                    </div>
                </form>
                <DialogFooter className="px-6 py-4 border-t border-border bg-background">
                    <Button variant="outline" onClick={onClose} disabled={loading}>{t("dialog.cancel")}</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("dialog.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddModelDialog({ open, onClose, onSuccess, providers, defaultProviderId }) {
    const t = useTranslations("ai");
    const locale = useLocale();

    const [loading, setLoading] = useState(false);
    const dir = locale === "ar" ? "rtl" : "ltr";

    const customProviders = useMemo(() => providers.filter((p) => p.scope === "custom"), [providers]);

    const schema = useMemo(
        () =>
            yup.object().shape({
                providerId: yup.string().required(t("validation.providerRequired")),
                name: yup.string().trim().required(t("validation.nameRequired")),
                modelCode: yup.string().trim().required(t("validation.modelCodeRequired")),
                description: yup.string().trim().notRequired(),
                descriptionAr: yup.string().trim().notRequired(),
                modelType: yup.string().oneOf(["text", "image", "audio", "video", "multimodal"], t("validation.invalidModelType")).notRequired().default("text"),
                isActive: yup.boolean().default(true),
                stream: yup.boolean().default(false),
                jsonMode: yup.boolean().default(false),
                reasoning: yup.boolean().default(false),
                toolsCalling: yup.boolean().default(false),
            }),
        [t]
    );

    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            providerId: defaultProviderId || "",
            name: "",
            modelCode: "",
            description: "",
            descriptionAr: "",
            modelType: "text",
            isActive: true,
            stream: true,
            jsonMode: true,
            reasoning: true,
            toolsCalling: true,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                providerId: defaultProviderId || (customProviders.length === 1 ? customProviders[0].id : ""),
                name: "",
                modelCode: "",
                description: "",
                descriptionAr: "",
                modelType: "text",
                isActive: true,
                stream: true,
                jsonMode: true,
                reasoning: true,
                toolsCalling: true,
            });
        }
    }, [open, defaultProviderId, customProviders, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        try {
            setLoading(true);
            const payload = {
                providerId: values.providerId,
                name: values.name.trim(),
                modelCode: values.modelCode.trim(),
                description: values.description?.trim() || undefined,
                descriptionAr: values.descriptionAr?.trim() || undefined,
                modelType: "text",
                isActive: true,
                stream: true,
                jsonMode: true,
                reasoning: true,
                toolsCalling: true,
            };
            await api.post("/ai/models", payload);
            toast.success(t("messages.modelCreated"));
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || t("messages.errorOccurred"));
        } finally {
            setLoading(false);
        }
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent dir={dir} className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-[16px] font-bold text-foreground">{t("actions.addCustomModel")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">

                    <div className="space-y-1.5">
                        <Label className="text-foreground">{t("model.provider")} <span className="text-red-500">*</span></Label>
                        <Select value={form.watch("providerId")} onValueChange={(v) => form.setValue("providerId", v)}>
                            <SelectTrigger><SelectValue placeholder={t("modelPlaceholder.provider")} /></SelectTrigger>
                            <SelectContent>
                                {customProviders.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.providerId && <p className="text-xs text-red-500 mt-1">{form.formState.errors.providerId.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-foreground">{t("model.name")} <span className="text-red-500">*</span></Label>
                            <Input {...form.register("name")} placeholder={t("modelPlaceholder.name")} />
                            {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-foreground">{t("model.modelCode")} <span className="text-red-500">*</span></Label>
                            <Input {...form.register("modelCode")} placeholder={t("modelPlaceholder.modelCode")} dir="ltr" />
                            {form.formState.errors.modelCode && <p className="text-xs text-red-500 mt-1">{form.formState.errors.modelCode.message}</p>}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-foreground">{t("model.description")}</Label>
                        <textarea {...form.register("description")} rows={4} className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none" placeholder={t("modelPlaceholder.description")} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-foreground">{t("model.descriptionAr")}</Label>
                        <textarea {...form.register("descriptionAr")} rows={4} dir="rtl" className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-right" placeholder={t("modelPlaceholder.descriptionAr")} />
                    </div>
                </form>
                <DialogFooter className="px-6 py-4 border-t border-border bg-background">
                    <Button variant="outline" onClick={onClose} disabled={loading}>{t("dialog.cancel")}</Button>
                    <Button onClick={handleSubmit} disabled={loading || !form.formState.isValid}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("dialog.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle, action }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-border">
            <div className="mb-3 opacity-60">{icon}</div>
            <h3 className="text-sm font-semibold mb-1 text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground max-w-md mb-3">{subtitle}</p>}
            {action}
        </div>
    );
}

function ProviderSidebarSkeleton({ count = 5 }) {
    return (
        <div className="space-y-2 p-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse rounded-[10px]">
                    <div className="w-[42px] h-[42px] rounded-[10px] bg-muted" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-2/3 bg-muted rounded" />
                        <div className="h-2.5 w-1/3 bg-muted rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// ALL MODELS TAB
// ─────────────────────────────────────────────────────────────
function AllModelsTab({ models, loading, hasMore, onLoadMore, search, onSearchChange, providers, providerFilter, onProviderFilterChange, onEditModel, onDeleteModel, onSetDefault, defaultModelId, settingDefaultId, hasPermission, locale }) {
    const t = useTranslations("ai");

    const getProviderConnected = (model) => {
        return !!(model.provider?.integration);
    };

    const getCapabilities = (model) => {
        const capabilities = [];
        if (model.toolsCalling) capabilities.push(t("capability.toolCalls"));
        if (model.reasoning) capabilities.push(t("capability.vision"));
        if (model.jsonMode) capabilities.push(t("capability.structured"));
        if (model.stream) capabilities.push(t("capability.streaming"));
        return capabilities;
    };

    return (
        <div className="border border-border rounded-[14px] bg-white overflow-hidden shadow-[0_2px_10px_rgba(30,30,60,0.03)]">
            <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[16px] font-semibold text-foreground">{t("tabs.allModels")}</h2>
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">{models.length}</span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={t("modelPlaceholder.search")}
                            className="w-full h-[38px] rounded-lg border border-border ps-9 pe-3 text-xs outline-none focus:border-primary"
                        />
                    </div>
                    <Select value={providerFilter} onValueChange={onProviderFilterChange}>
                        <SelectTrigger className="h-[38px] w-full sm:w-[180px] rounded-lg border-border text-xs">
                            <SelectValue placeholder={t("filters.allProviders")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("filters.allProviders")}</SelectItem>
                            {providers.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="p-5">
                {loading && models.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="border border-border rounded-[13px] p-4 animate-pulse">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[42px] h-[42px] rounded-[11px] bg-muted" />
                                        <div className="space-y-1.5">
                                            <div className="h-4 w-24 bg-muted rounded" />
                                            <div className="h-3 w-16 bg-muted rounded" />
                                        </div>
                                    </div>
                                    <div className="h-5 w-16 bg-muted rounded" />
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="h-5 w-12 bg-muted rounded" />
                                    <div className="h-5 w-14 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : models.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Layers className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">{t("empty.modelsTitle")}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {models.map((model) => {
                                const isCustom = model.scope === "custom";
                                const isDefault = defaultModelId?.modelId === model.id;
                                const connected = getProviderConnected(model);
                                const providerCode = model.provider?.code || "";
                                const providerName = model.provider?.name || "—";
                                const capabilities = getCapabilities(model);

                                const modelActions = [];
                                if (hasPermission("ai.manage")) {
                                    if (connected && !isDefault) {
                                        modelActions.push({
                                            key: "default",
                                            icon: <Star className={cn("w-3.5 h-3.5")} />,
                                            tooltip: t("actions.setDefaultModel"),
                                            onClick: () => onSetDefault?.(model),
                                            variant: "slate",
                                            disabled: settingDefaultId === model.id,
                                        });
                                    }
                                    if (isCustom) {
                                        modelActions.push({
                                            key: "edit",
                                            icon: <Edit2 className="w-3.5 h-3.5" />,
                                            tooltip: t("actions.editModel"),
                                            onClick: () => onEditModel?.(model),
                                            variant: "primary",
                                        });
                                        modelActions.push({
                                            key: "delete",
                                            icon: <Trash2 className="w-3.5 h-3.5" />,
                                            tooltip: t("actions.deleteModel"),
                                            onClick: () => onDeleteModel?.(model),
                                            variant: "red",
                                        });
                                    }
                                }

                                return (
                                    <div
                                        key={model.id}
                                        className="border border-border rounded-[13px] p-4 hover:border-primary/30 hover:shadow-[0_7px_22px_rgba(40,35,90,0.08)] hover:-translate-y-0.5 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {model.provider?.logoUrl ? (
                                                    <img
                                                        src={model.provider.logoUrl}
                                                        alt={providerName}
                                                        className="w-[42px] h-[42px] flex-none rounded-[11px] object-cover border border-border"
                                                    />
                                                ) : (
                                                    <div className={cn(
                                                        "w-[42px] h-[42px] flex-none rounded-[11px] flex items-center justify-center font-bold text-[19px]",
                                                        PROVIDER_ICON_CLASSES[providerCode] || "bg-muted text-foreground"
                                                    )}>
                                                        {providerCode?.charAt(0)?.toUpperCase() || "AI"}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[14px] font-bold text-foreground truncate" dir="ltr">{model.name || model.modelCode}</span>
                                                        {isDefault && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 flex-none" />}
                                                        {isCustom && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary flex-none">{t("scope.custom")}</span>}
                                                    </div>
                                                    <span className="text-[11px] text-muted-foreground block mt-0.5">{providerName}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-none">
                                                {connected ? (
                                                    <span className="flex items-center gap-1 text-[10px] text-success">
                                                        <span className="w-[7px] h-[7px] rounded-full bg-success" />
                                                        {t("status.connected")}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <span className="w-[7px] h-[7px] rounded-full bg-muted-foreground/30" />
                                                        {t("status.notConnected")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {(model.description || model.descriptionAr) && (
                                            <div className="text-[10px] text-muted-foreground mb-3 prose prose-xs max-w-none line-clamp-2">
                                                <ReactMarkdown>
                                                    {locale === "ar" ? (model.descriptionAr || model.description) : (model.description || model.descriptionAr)}
                                                </ReactMarkdown>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {capabilities.map((cap) => (
                                                <span key={cap} className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[9px] font-semibold">{cap}</span>
                                            ))}
                                            {model.modelType && <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[9px] font-semibold">{t(`modelType.${model.modelType}`) || model.modelType}</span>}
                                        </div>

                                        {modelActions.length > 0 && (
                                            <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                                                <ActionButtons actions={modelActions} size="sm" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center mt-5">
                                <Button
                                    variant="outline"
                                    onClick={() => onLoadMore?.()}
                                    disabled={loading}
                                    className="h-[34px] px-6 text-xs"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                                    {t("actions.loadMore")}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AiPage() {
    const t = useTranslations("ai");
    const locale = useLocale();
    const { hasPermission } = useAuth();

    // ── Data State ────────────────────────────────────────────
    const [providers, setProviders] = useState([]);
    const [providersLoading, setProvidersLoading] = useState(true);
    const [selectedProviderId, setSelectedProviderId] = useState(null);
    const selectedProviderIdRef = useRef(null);
    const [models, setModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [integration, setIntegration] = useState(null);
    const [integrationLoading, setIntegrationLoading] = useState(false);
    const [defaultModel, setDefaultModel] = useState(null);
    const [providerSearch, setProviderSearch] = useState("");

    // ── All Models Tab State ──────────────────────────────────
    const [mainTab, setMainTab] = useState("providers");
    const [allModels, setAllModels] = useState([]);
    const [allModelsLoading, setAllModelsLoading] = useState(false);
    const [allModelsCursor, setAllModelsCursor] = useState(null);
    const [allModelsHasMore, setAllModelsHasMore] = useState(false);
    const [allModelsSearch, setAllModelsSearch] = useState("");
    const [allModelsProviderFilter, setAllModelsProviderFilter] = useState("all");
    const allModelsRequestIdRef = useRef(0);

    const { debouncedValue: debouncedAllModelsSearch } = useDebounce({
        value: allModelsSearch,
        delay: 400,
    });

    // ── Dialogs State ─────────────────────────────────────────
    const [editProviderOpen, setEditProviderOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [editModelOpen, setEditModelOpen] = useState(false);
    const [editingModel, setEditingModel] = useState(null);
    const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
    const [showAddModelDialog, setShowAddModelDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: "model", id: null, name: "" });
    const [deleting, setDeleting] = useState(false);
    const [settingDefaultId, setSettingDefaultId] = useState(null);
    const [configSaving, setConfigSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    // ── Active Tab ────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("configurations");

    // ── Derived ───────────────────────────────────────────────
    const customProviders = useMemo(() => providers.filter((p) => p.scope === "custom"), [providers]);

    const selectedProvider = useMemo(
        () => providers.find((p) => p.id === selectedProviderId) ?? null,
        [providers, selectedProviderId]
    );

    const filteredProviders = useMemo(() => {
        if (!providerSearch.trim()) return providers;
        const q = providerSearch.toLowerCase();
        return providers.filter(
            (p) =>
                p.name?.toLowerCase().includes(q) ||
                p.code?.toLowerCase().includes(q)
        );
    }, [providers, providerSearch]);

    // ── Data Loaders ──────────────────────────────────────────
    const loadProviders = useCallback(async () => {
        if (!hasPermission("ai.chat") && !hasPermission("ai.manage")) return;
        setProvidersLoading(true);
        try {
            const { data } = await api.get("/ai/providers", { params: { scope: "all" } });
            const list = Array.isArray(data) ? data : data?.records || [];
            setProviders(list);
            if (list.length > 0 && !selectedProviderIdRef.current) {
                setSelectedProviderId(list[0].id);
            }
        } catch (e) {
            toast.error(t("error.loadProvidersFailed") + ": " + normalizeAxiosError(e));
        } finally {
            setProvidersLoading(false);
        }
    }, [t, hasPermission]);

    const loadModels = useCallback(async (providerId) => {
        if (!providerId) return;
        setModelsLoading(true);
        try {
            const { data } = await api.get("/ai/models", { params: { providerId, limit: 200 } });
            const list = Array.isArray(data) ? data : data?.records || [];
            setModels(list);
        } catch (e) {
            toast.error(t("error.loadModelsFailed") + ": " + normalizeAxiosError(e));
        } finally {
            setModelsLoading(false);
        }
    }, [t]);

    const loadIntegration = useCallback(async (providerId) => {
        if (!providerId) return;
        setIntegrationLoading(true);
        try {
            const { data } = await api.get("/ai/integrations", { params: { providerId } });
            const list = Array.isArray(data) ? data : data?.records || [];
            setIntegration(list.length > 0 ? list[0] : null);
        } catch {
            setIntegration(null);
        } finally {
            setIntegrationLoading(false);
        }
    }, []);

    const loadDefaultModel = useCallback(async () => {
        try {
            const { data } = await api.get("/ai/default-model");
            setDefaultModel(data || null);
        } catch { /* optional */ }
    }, []);

    const loadAllModels = useCallback(async ({ cursor = null, append = false, providerId, search: searchTerm } = {}) => {
        const requestId = ++allModelsRequestIdRef.current;
        try {
            setAllModelsLoading(true);
            if (!append) setAllModels([]);
            const params = { limit: 50 };
            if (cursor) params.cursor = cursor;
            if (providerId && providerId !== "all") {
                params.providerId = providerId;
            }
            if (searchTerm && searchTerm.trim()) {
                params.search = searchTerm.trim();
            }
            const { data } = await api.get("/ai/models", { params });

            if (requestId !== allModelsRequestIdRef.current) return;

            const records = data?.records || data?.data || [];
            const meta = data?.meta || {};

            if (append) {
                setAllModels(prev => [...prev, ...records]);
            } else {
                setAllModels(records);
            }
            setAllModelsCursor(data?.nextCursor || meta.cursor || null);
            setAllModelsHasMore(data?.hasMore ?? records.length >= 50);
        } catch {
            if (!append && requestId === allModelsRequestIdRef.current) setAllModels([]);
        } finally {
            if (requestId === allModelsRequestIdRef.current) setAllModelsLoading(false);
        }
    }, []);

    // ── Sync selectedProviderId ref ───────────────────────────
    useEffect(() => {
        selectedProviderIdRef.current = selectedProviderId;
    }, [selectedProviderId]);

    // ── Initial Load ──────────────────────────────────────────
    useEffect(() => {
        loadProviders();
        loadDefaultModel();
    }, [loadProviders, loadDefaultModel]);

    // ── Load all models when tab or filters change ─────────────
    useEffect(() => {
        if (mainTab === "allModels") {
            loadAllModels({
                providerId: allModelsProviderFilter,
                search: debouncedAllModelsSearch,
            });
        }
    }, [mainTab, allModelsProviderFilter, debouncedAllModelsSearch]);

    // ── Auto-select first provider ────────────────────────────

    // ── Load provider-specific data on selection ───────────────
    useEffect(() => {
        if (selectedProviderId) {
            loadModels(selectedProviderId);
            loadIntegration(selectedProviderId);
        } else {
            setModels([]);
            setIntegration(null);
        }
    }, [selectedProviderId, loadModels, loadIntegration]);

    // ── Handlers ──────────────────────────────────────────────
    const handleSelectProvider = useCallback((provider) => {
        setSelectedProviderId(provider.id);
        setActiveTab("configurations");
    }, []);

    const handleDeselectProvider = useCallback(() => {
        setSelectedProviderId(null);
        setActiveTab("configurations");
    }, []);

    const handleEditProvider = useCallback((provider) => {
        setEditingProvider(provider);
        setEditProviderOpen(true);
    }, []);

    const handleEditModel = useCallback((model) => {
        setEditingModel(model);
        setEditModelOpen(true);
    }, []);

    const handleDeleteModel = useCallback((model) => {
        setDeleteConfirm({ open: true, type: "model", id: model.id, name: model.name || model.modelCode });
    }, []);

    const handleDeleteProvider = useCallback((provider) => {
        setDeleteConfirm({ open: true, type: "provider", id: provider.id, name: provider.name });
    }, []);

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            if (deleteConfirm.type === "model") {
                await api.delete(`/ai/models/${deleteConfirm.id}`);
                toast.success(t("messages.modelDeleted"));
                setDeleteConfirm({ open: false, type: "model", id: null, name: "" });
                if (selectedProviderId) loadModels(selectedProviderId);
            } else if (deleteConfirm.type === "provider") {
                await api.delete(`/ai/providers/${deleteConfirm.id}`);
                toast.success(t("messages.providerDeleted"));
                setDeleteConfirm({ open: false, type: "provider", id: null, name: "" });
                loadProviders();
                setSelectedProviderId(null);
            }
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setDeleting(false);
        }
    };

    const handleSaveConfig = async ({ baseUrl, credentials }) => {
        if (!selectedProviderId) return;
        setConfigSaving(true);
        try {
            const payload = {};
            if (baseUrl !== undefined) payload.baseUrl = baseUrl;
            if (credentials) payload.credentials = credentials;
            await api.post(`/ai/integrations/${selectedProviderId}/credentials`, payload);
            toast.success(t("messages.integrationSaved"));
            loadIntegration(selectedProviderId);
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setConfigSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!selectedProviderId) return;
        setTesting(true);
        try {
            await api.post(`/ai/integrations/${selectedProviderId}/test`);
            toast.success(t("messages.connectionTestSuccess"));
            loadIntegration(selectedProviderId);
        } catch (e) {
            toast.error(t("messages.connectionTestFailed") + ": " + normalizeAxiosError(e));
        } finally {
            setTesting(false);
        }
    };

    const handleSetDefaultModel = async (model) => {
        if (!hasPermission("ai.manage")) return;
        try {
            setSettingDefaultId(model.id);
            await api.put("/ai/default-model", { modelId: model.id });
            toast.success(t("messages.defaultModelSet"));
            loadDefaultModel();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setSettingDefaultId(null);
        }
    };

    const handleProviderUpdated = useCallback(() => {
        loadProviders();
        setEditProviderOpen(false);
        setEditingProvider(null);
    }, [loadProviders]);

    const handleModelUpdated = useCallback(() => {
        if (selectedProviderId) loadModels(selectedProviderId);
        setEditModelOpen(false);
        setEditingModel(null);
    }, [selectedProviderId, loadModels]);

    // ── Render ────────────────────────────────────────────────
    const breadcrumbs = useMemo(() => [
        { name: t("breadcrumb.home"), href: "/" },
        { name: t("breadcrumb.ai") },
    ], [t]);

    const stats = useMemo(() => {
        const connectedCount = providers.filter((p) => p.integration).length;
        const customModelsCount = models.filter((m) => m.scope === "custom").length;
        const defaultModelName = defaultModel?.model?.name || defaultModel?.model?.modelCode || "—";
        const defaultModelProvider = defaultModel?.model?.provider?.name || "";
        return [
            {
                name: t("stats.totalProviders"),
                value: providers.length,
                icon: Server,
                sortOrder: 1,
                description: t("statsDesc.totalProviders"),
            },
            {
                name: t("stats.activeIntegrations"),
                value: connectedCount,
                icon: PlugZap,
                sortOrder: 3,
                description: t("statsDesc.activeIntegrations"),
            },
            {
                name: t("stats.defaultModel"),
                value: defaultModelProvider ? `${defaultModelName} — ${defaultModelProvider}` : defaultModelName,
                icon: Star,
                sortOrder: 5,
                description: t("statsDesc.defaultModel"),
            },
        ];
    }, [providers, models, defaultModel, t]);

    const headerItems = useMemo(() => [
        { id: "providers", label: t("tabs.providers") },
        { id: "allModels", label: t("tabs.allModels") || "All Models" },
    ], [t]);

    const headerButtons = useMemo(() => (
        <Fragment>
            {hasPermission("ai.manage") && (
                <>
                    <Button_
                        icon={<Plus className="w-4 h-4" />}
                        label={t("actions.addProvider")}
                        onClick={() => setShowAddProviderDialog(true)}
                    />
                    {customProviders.length > 0 && (
                        <Button_
                            icon={<Plus className="w-4 h-4" />}
                            label={t("actions.addCustomModel")}
                            onClick={() => setShowAddModelDialog(true)}
                        />
                    )}
                </>
            )}
        </Fragment>
    ), [customProviders.length, hasPermission, t]);

    const isProviderConnected = selectedProvider
        ? !!(integration)
        : false;

    return (
        <div className="min-h-screen p-3 md:p-5">
            <PageHeader
                breadcrumbs={breadcrumbs}
                buttons={headerButtons}
                stats={stats}
                statsLoading={providersLoading}
                items={headerItems}
                active={mainTab}
                setActive={setMainTab}
            />

            {/* ── Main Workspace ───────────────────────────────── */}
            {mainTab === "providers" ? (
                <div className="flex flex-col md:flex-row flex-1 min-h-0 mb-4 border border-border rounded-[14px] bg-white overflow-hidden shadow-[0_2px_10px_rgba(30,30,60,0.03)]">

                    {/* ── Provider Sidebar ─────────────────────── */}
                    <div className={cn(
                        "border-b md:border-b-0 md:border-r border-border flex flex-col bg-white shrink-0 overflow-hidden",
                        "w-full md:w-[43%] md:min-w-[280px]",
                        selectedProviderId ? "hidden md:flex" : "flex"
                    )}>
                        <div className="px-5 pt-5 pb-4 shrink-0">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-[16px] font-semibold text-foreground">{t("tabs.providers")}</h2>
                                <span className="text-[12px] text-muted-foreground">
                                    {filteredProviders.length} {t("providers.available")}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {providersLoading ? (
                                <ProviderSidebarSkeleton />
                            ) : filteredProviders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <Server className="w-8 h-8 text-muted-foreground/40 mb-3" />
                                    <p className="text-xs text-muted-foreground">{t("empty.providersTitle")}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 px-3 pb-4">
                                    {filteredProviders.map((provider) => {
                                        const isSelected = provider.id === selectedProviderId;
                                        const isCustom = provider.scope === "custom";
                                        const modelCount = provider.models?.length ?? 0;
                                        const isDefaultProvider = defaultModel?.model?.provider?.id === provider.id;
                                        const isConnected = !!(provider.integration);

                                        return (
                                            <button
                                                key={provider.id}
                                                type="button"
                                                onClick={() => handleSelectProvider(provider)}
                                                className={cn(
                                                    "grid grid-cols-[45px_1fr_auto] items-center gap-3 min-h-[82px] px-3 py-3 rounded-[10px] border transition-all text-start w-full",
                                                    isSelected
                                                        ? "bg-primary/5 border-primary/20"
                                                        : "bg-transparent border-transparent hover:bg-primary/5 hover:border-primary/20"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-[42px] h-[42px] rounded-[10px] flex items-center justify-center font-bold",
                                                    getProviderIconClasses(provider)
                                                )}>
                                                    {provider.logoUrl ? (
                                                        <img src={provider.logoUrl} alt="" className="w-full h-full rounded-[10px] object-cover" />
                                                    ) : (
                                                        getProviderIcon(provider)
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className={cn(
                                                            "text-[13px] font-bold truncate",
                                                            isSelected ? "text-primary" : "text-foreground"
                                                        )}>
                                                            {provider.name}
                                                        </span>
                                                        {isDefaultProvider && (
                                                            <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                                                        )}
                                                        {isCustom ? (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground bg-muted">
                                                                {t("scope.custom")}
                                                            </span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-primary bg-primary/10">
                                                                {t("scope.system")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {provider.description && (
                                                        <div className="text-[11px] text-muted-foreground mt-1 prose prose-xs max-w-none">
                                                            <ReactMarkdown>
                                                                {locale === "ar" ? (provider.descriptionAr || provider.description) : provider.description}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <StatusBadge connected={isConnected} />
                                                        {modelCount > 0 && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-primary bg-primary/10">
                                                                <Layers className="w-2.5 h-2.5" />
                                                                {modelCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isCustom ? (
                                                    <div className="flex items-center gap-1 shrink-0 ms-2">
                                                        <div
                                                            role="button"
                                                            tabIndex={-1}
                                                            onClick={(e) => { e.stopPropagation(); handleEditProvider(provider); }}
                                                            className="text-primary hover:text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-colors"
                                                            title={t("actions.editProvider")}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </div>
                                                        <div
                                                            role="button"
                                                            tabIndex={-1}
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteProvider(provider); }}
                                                            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-colors"
                                                            title={t("actions.deleteProvider")}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[18px] text-muted-foreground shrink-0 ms-2">
                                                        ›
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Detail Panel ──────────────────────────── */}
                    <div className={cn(
                        "flex-1 min-w-0 flex flex-col",
                        !selectedProviderId ? "hidden md:flex" : "flex"
                    )}>
                        <AnimatePresence mode="wait">
                            {!selectedProvider ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center p-8"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                        <BrainCircuit className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-[15px] font-semibold text-foreground mb-1">{t("empty.providersTitle")}</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm">{t("empty.providersSubtitle")}</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={selectedProvider.id}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-1 flex flex-col min-h-0"
                                >
                                    {/* ── Detail Header ──────────────── */}
                                    <div className="px-4 md:px-6 pt-4 md:pt-5 pb-0 border-b border-border">
                                        <div className="flex items-center gap-3 mb-5">
                                            {/* Back button - mobile only */}
                                            <button
                                                onClick={handleDeselectProvider}
                                                className="md:hidden w-8 h-8 border-0 bg-transparent text-muted-foreground rounded-[7px] hover:bg-muted flex items-center justify-center shrink-0"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M15 18l-6-6 6-6" />
                                                </svg>
                                            </button>
                                            <div className={cn(
                                                "w-[44px] h-[44px] rounded-[10px] flex items-center justify-center font-bold text-sm shrink-0",
                                                getProviderIconClasses(selectedProvider)
                                            )}>
                                                {selectedProvider.logoUrl ? (
                                                    <img src={selectedProvider.logoUrl} alt="" className="w-full h-full rounded-[10px] object-cover" />
                                                ) : (
                                                    getProviderIcon(selectedProvider)
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h2 className="text-[18px] font-semibold text-foreground truncate">{selectedProvider.name}</h2>
                                                    <StatusBadge connected={isProviderConnected} />
                                                </div>
                                                <div className="text-[12px] text-muted-foreground mt-1 prose prose-xs max-w-none">
                                                    <ReactMarkdown>
                                                        {locale === "ar"
                                                            ? (selectedProvider.descriptionAr || selectedProvider.description || selectedProvider.code)
                                                            : (selectedProvider.description || selectedProvider.code)
                                                        }
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleDeselectProvider}
                                                className="hidden md:flex w-8 h-8 border-0 bg-transparent text-muted-foreground text-[21px] rounded-[7px] hover:bg-muted items-center justify-center shrink-0"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        {/* ── Tabs ─────────────────────── */}
                                        <div className="flex gap-6">
                                            <button
                                                onClick={() => setActiveTab("configurations")}
                                                className={cn(
                                                    "relative pb-3 border-0 bg-transparent text-[12px] font-semibold transition-colors",
                                                    activeTab === "configurations"
                                                        ? "text-primary"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {t("tabs.configurations")}
                                                {activeTab === "configurations" && (
                                                    <span className="absolute left-0 right-0 bottom-[-1px] h-0.5 bg-[#5638e8] rounded-full" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setActiveTab("models")}
                                                className={cn(
                                                    "relative pb-3 border-0 bg-transparent text-[12px] font-semibold transition-colors",
                                                    activeTab === "models"
                                                        ? "text-primary"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {t("tabs.models")} <span className="text-[11px] text-muted-foreground">({models.length})</span>
                                                {activeTab === "models" && (
                                                    <span className="absolute left-0 right-0 bottom-[-1px] h-0.5 bg-[#5638e8] rounded-full" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Tab Content ──────────────── */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                                        {activeTab === "configurations" && (
                                            <ConfigurationsTab
                                                provider={selectedProvider}
                                                integration={integration}
                                                loading={integrationLoading}
                                                saving={configSaving}
                                                onSave={handleSaveConfig}
                                                // onTest={handleTestConnection}
                                                testing={testing}
                                                defaultModel={defaultModel}
                                                locale={locale}
                                            />
                                        )}
                                        {activeTab === "models" && (
                                            <ModelsTab
                                                models={models}
                                                loading={modelsLoading}
                                                provider={selectedProvider}
                                                onEditModel={handleEditModel}
                                                onDeleteModel={handleDeleteModel}
                                                onSetDefault={handleSetDefaultModel}
                                                defaultModelId={defaultModel}
                                                settingDefaultId={settingDefaultId}
                                                hasPermission={hasPermission}
                                                locale={locale}
                                                providerConnected={isProviderConnected}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <div className="mb-4">
                    <AllModelsTab
                        models={allModels}
                        loading={allModelsLoading}
                        hasMore={allModelsHasMore}
                        onLoadMore={() => loadAllModels({
                            cursor: allModelsCursor,
                            append: true,
                            providerId: allModelsProviderFilter,
                            search: debouncedAllModelsSearch,
                        })}
                        search={allModelsSearch}
                        onSearchChange={setAllModelsSearch}
                        providers={providers}
                        providerFilter={allModelsProviderFilter}
                        onProviderFilterChange={setAllModelsProviderFilter}
                        onEditModel={handleEditModel}
                        onDeleteModel={handleDeleteModel}
                        onSetDefault={handleSetDefaultModel}
                        defaultModelId={defaultModel}
                        settingDefaultId={settingDefaultId}
                        hasPermission={hasPermission}
                        locale={locale}
                    />
                </div>
            )}

            {/* ── Dialogs ────────────────────────────────────── */}
            <AddProviderDialog
                open={showAddProviderDialog}
                onClose={() => setShowAddProviderDialog(false)}
                onSuccess={loadProviders}
            />

            <AddModelDialog
                open={showAddModelDialog}
                onClose={() => setShowAddModelDialog(false)}
                onSuccess={() => { if (selectedProviderId) loadModels(selectedProviderId); }}
                providers={providers}
                defaultProviderId={selectedProviderId}
            />

            <EditProviderDialog
                open={editProviderOpen}
                onOpenChange={(v) => { setEditProviderOpen(v); if (!v) setEditingProvider(null); }}
                provider={editingProvider}
                onSuccess={handleProviderUpdated}
            />

            <EditModelDialog
                open={editModelOpen}
                onOpenChange={(v) => { setEditModelOpen(v); if (!v) setEditingModel(null); }}
                model={editingModel}
                onSuccess={handleModelUpdated}
            />

            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(v) => !deleting && setDeleteConfirm({ ...deleteConfirm, open: v })}
                title={deleteConfirm.type === "provider" ? t("error.deleteProviderConfirmTitle") : t("error.deleteModelConfirmTitle")}
                description={deleteConfirm.type === "provider" ? t("error.deleteProviderConfirmDesc") : t("error.deleteModelConfirmDesc")}
                confirmText={t("dialog.deleteConfirm")}
                loading={deleting}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
