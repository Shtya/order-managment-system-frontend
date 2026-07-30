"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Settings2,
    Send,
    ExternalLink,
    Check,
    AlertCircle,
    Eye,
    EyeOff,
    Loader2,
    KeyRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import api from "@/utils/api";
import { PrimaryBtn } from "@/components/atoms/Button";
import PageHeader from "@/components/atoms/Pageheader";
import { SMS_PROVIDERS, useSmsIntegration, useSmsSettings } from "@/hook/sms";
import { useAuth } from "@/context/AuthContext";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { cn } from "@/utils/cn";
import { SendSmsModal } from "../atoms/SendSmsModal";

function pick(obj, locale) {
    if (!obj) return "";
    return locale?.startsWith("ar") ? obj.ar : obj.en;
}

export default function SmsProviders() {
    const t = useTranslations("smsProviders");
    const locale = useLocale();

    const providers = useMemo(
        () => SMS_PROVIDERS.map((p) => ({
            ...p,
            name: pick(p.label, locale),
            desc: pick(p.desc, locale),
        })),
        [locale]
    );

    const [integrationStatuses, setStatuses] = useState({});
    const [statusLoading, setLoading] = useState(true);

    async function fetchStatuses() {
        try {
            const { data } = await api.get("/sms/integrations");
            const map = {};
            (data || []).forEach((item) => (map[item.providerCode] = item));
            setStatuses(map);
        } catch (_) {
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStatuses();
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <PageHeader
                breadcrumbs={[
                    { name: t("breadcrumb.home"), href: "/dashboard" },
                    { name: t("breadcrumb.sms") },
                    { name: t("breadcrumb.providers") },
                ]}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key="providers"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="main-card min-h-[600px]"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {statusLoading
                            ? providers.map((p) => <SkeletonCard key={p.key} />)
                            : providers.map((provider, index) => (
                                <motion.div key={provider.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                    <ProviderCard provider={provider} integrationStatus={integrationStatuses[provider.code]} onRefreshStatus={fetchStatuses} />
                                </motion.div>
                            ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function ProviderSettingModal({ provider, onClose, onSaved }) {
    const t = useTranslations("smsProviders");
    const {
        fields, values, setValue, handleSave, isFormValid,
        loading, saving, error, success,
        showFields, toggleShow, integrationData, meta,
    } = useSmsSettings(provider?.code, { onClose, onSaved });
    
    return (
        <ModalShell onClose={onClose}>
            <ModalHeader icon={Settings2} title={t("settings.title", { name: provider.name })} subtitle={t("settings.subtitle")} onClose={onClose} />

            <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border border-[var(--border)] flex-shrink-0 bg-white">
                        <img src={provider.img} alt={provider.name} className="full h-full object-contain" onError={(e) => (e.target.style.display = "none")} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--card-foreground)]">{provider.name}</p>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-8 text-[var(--muted-foreground)]">
                        <Loader2 size={22} className="animate-spin" />
                    </div>
                )}

                <div className="space-y-4">
                    {fields.map((field) => {
                        const currentSavedValue = field?.hide ? integrationData?.credentials?.[field.key] : null;
                        return (
                            <div key={field.key} className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--card-foreground)] flex items-center gap-1.5">
                                    <KeyRound size={12} className="text-[var(--muted-foreground)]" />
                                    {t(field.labelKey)}
                                    {field.required && <span className="text-[var(--primary)] text-xs">*</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        type={field.type === "password" ? (showFields[field.key] ? "text" : "password") : "text"}
                                        value={values[field.key] || ""}
                                        onChange={(e) => setValue(field.key, e.target.value)}
                                        placeholder={currentSavedValue || t(`settings.placeholders.${field.key}`, { fallback: `${t(field.labelKey)}…` })}
                                        className={`w-full ${field.type === "password" ? "pe-10 hide-eye-input" : ""} rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] ${currentSavedValue && "placeholder:text-gray-950"} dark:placeholder:text-gray-100 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all`}
                                    />
                                    {field.type === "password" && (
                                        <button
                                            type="button"
                                            onClick={() => toggleShow(field.key)}
                                            className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                        >
                                            {showFields[field.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                <PrimaryBtn onClick={handleSave} disabled={!isFormValid()} loading={saving} className="w-full">
                    {!saving && <Check size={14} />}
                    {saving ? t("settings.saving") : t("settings.save")}
                </PrimaryBtn>
            </div>
        </ModalShell>
    );
}



function SkeletonCard() {
    return (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden animate-pulse bg-[var(--muted)]">
            <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-xl bg-[var(--border)]" />
                    <div className="w-11 h-6 rounded-full bg-[var(--border)]" />
                </div>
                <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded bg-[var(--border)]" />
                    <div className="h-2.5 w-20 rounded bg-[var(--border)]" />
                </div>
                <div className="space-y-1.5">
                    <div className="h-2 w-full rounded bg-[var(--border)]" />
                    <div className="h-2 w-4/5 rounded bg-[var(--border)]" />
                </div>
            </div>
            <div className="border-t border-[var(--border)] px-4 py-3 flex gap-2">
                <div className="h-7 w-20 rounded-xl bg-[var(--border)]" />
                <div className="h-7 w-20 rounded-xl bg-[var(--border)]" />
                <div className="h-7 w-16 rounded-xl bg-[var(--border)] ml-auto" />
            </div>
        </div>
    );
}

function ProviderCard({ provider, integrationStatus, onRefreshStatus }) {
    const t = useTranslations("smsProviders");

    const { hasPermission } = useAuth();
    const {
        meta, isActive, isConfigured, toggling,
        openModal, setOpenModal, handleToggle,
    } = useSmsIntegration(provider, integrationStatus, onRefreshStatus);

    const accent = provider?.accent || "#2563a8";
    const accentBg = provider?.accentBg || "#dbeafe";
    const strip = provider?.strip || "linear-gradient(90deg,#2563a8,#60a5fa)";

    const fbCls = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 bg-white/80 dark:bg-[var(--muted)] border border-white/60 dark:border-[var(--border)] text-gray-600 dark:text-gray-300 shadow-sm";
    const onEnter = (e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; };
    const onLeave = (e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; };

    return (
        <>
            <motion.div
                whileHover={{ y: -3, boxShadow: "0 20px 48px 0 rgba(0,0,0,0.11)" }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={cn(
                    "relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm flex flex-col",
                    provider?.bg,
                    "dark:bg-none",
                    "dark:bg-[var(--muted)]/80!"
                )}
            >
                <span className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ height: 3, background: strip, borderRadius: "16px 16px 0 0" }} />

                <div className="pt-6 px-5 pb-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
                            >
                                <img
                                    src={provider.img}
                                    alt={provider.name}
                                    className="w-7 h-7 object-contain"
                                    onError={(e) => (e.target.style.display = "none")}
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{provider.name}</h3>
                            </div>
                        </div>

                        {hasPermission("sms.update") && (
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <button
                                    onClick={isConfigured ? () => handleToggle() : () => setOpenModal("settings")}
                                    disabled={toggling}
                                    title={!isConfigured ? t("card.configureFirst") : isActive ? t("card.disable") : t("card.enable")}
                                    className="relative rounded-full transition-all duration-300 focus:outline-none"
                                    style={{
                                        width: 40, height: 22,
                                        background: isActive && isConfigured ? accent : "rgba(0,0,0,0.13)",
                                        border: "none",
                                        opacity: toggling ? 0.7 : 1,
                                        cursor: toggling ? "not-allowed" : "pointer",
                                    }}
                                >
                                    <span
                                        className="absolute rounded-full bg-white transition-all duration-300 flex items-center justify-center"
                                        style={{
                                            top: 3, width: 16, height: 16,
                                            left: isActive && isConfigured ? "calc(100% - 19px)" : 3,
                                            boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                                        }}
                                    >
                                        {toggling && (
                                            <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" style={{ color: accent }}>
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        )}
                                    </span>
                                </button>
                                <span
                                    className="font-semibold uppercase tracking-wide transition-colors duration-300"
                                    style={{ fontSize: 9, color: isActive && isConfigured ? accent : "rgba(0,0,0,0.3)" }}
                                >
                                    {toggling ? t("card.updating") : (isActive && isConfigured ? t("card.active") : t("card.inactive"))}
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                        {provider.desc}
                    </p>

                    {isConfigured ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t("card.configured")}
                        </span>
                    ) : (
                        <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full w-fit"
                            style={{ color: accent, background: accentBg, border: `1px solid ${accent}30` }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                            {t("card.notConfigured")}
                        </span>
                    )}
                </div>

                <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap border-t border-white/50 dark:border-[var(--border)] bg-white/55 dark:bg-[var(--muted)]/80 backdrop-blur-md">
                    {hasPermission("sms.update") && (
                        <button
                            onClick={() => setOpenModal("settings")}
                            title={t("card.settingsTitle")}
                            className={fbCls}
                            onMouseEnter={onEnter}
                            onMouseLeave={onLeave}
                        >
                            <Settings2 size={12} />
                            {t("card.settings")}
                        </button>
                    )}

                    {hasPermission("sms.send") && (
                        <button
                            onClick={() => setOpenModal("send")}
                            title={t("card.sendTitle")}
                            disabled={!isConfigured}
                            className={fbCls}
                            onMouseEnter={onEnter}
                            onMouseLeave={onLeave}
                        >
                            <Send size={12} />
                            {t("card.send")}
                        </button>
                    )}

                    <a
                        href="https://smseg.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${fbCls} ml-auto`}
                        onMouseEnter={onEnter}
                        onMouseLeave={onLeave}
                    >
                        <ExternalLink size={12} />
                        {t("card.website")}
                    </a>
                </div>
            </motion.div>

            <AnimatePresence>
                {openModal === "settings" && (
                    <ProviderSettingModal
                        key="settings"
                        provider={provider}
                        onClose={() => setOpenModal(null)}
                        onSaved={() => { onRefreshStatus?.(); }}
                    />
                )}
                {openModal === "send" && (
                    <SendSmsModal
                        key="send"
                        provider={provider}
                        onClose={() => setOpenModal(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
