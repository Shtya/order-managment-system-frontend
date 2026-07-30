"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Plus, User2 } from "lucide-react";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddEditSenderModal } from "./AddEditSenderModal";

export function SenderSelect({ provider, integrationId, showIntegrationSelect = false, value, onChange, disabled, onIntegrationChange }) {
    const t = useTranslations("smsProviders");
    const [senders, setSenders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [senderModalOpen, setSenderModalOpen] = useState(false);
    const [editingSender, setEditingSender] = useState(null);
    const [integrations, setIntegrations] = useState([]);
    const [selectedIntegrationId, setSelectedIntegrationId] = useState(integrationId || "");
    const [loadingIntegrations, setLoadingIntegrations] = useState(false);

    useMemo(() => {
        setSelectedIntegrationId(integrationId || "");
    }, [integrationId]);
    const needsIntegrationSelect = showIntegrationSelect ? showIntegrationSelect : !integrationId;

    const fetchIntegrations = useCallback(async () => {
        setLoadingIntegrations(true);
        try {
            const { data } = await api.get("/sms/integrations/active");
            const list = Array.isArray(data) ? data : data?.integrations || [];
            setIntegrations(list);
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setLoadingIntegrations(false);
        }
    }, []);

    const fetchSenders = useCallback(async (integId) => {
        if (!integId) return;
        setLoading(true);
        try {
            const params = { page: 1, limit: 200, integrationId: integId, isActive: true };
            const { data } = await api.get("/sms/senders", { params });
            const records = data?.records || [];
            setSenders(records);
            if (!value) {
                const def = records.find((s) => s.isDefault) || records[0];
                if (def?.id) onChange(def.id);
            }
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setLoading(false);
        }
    }, [onChange, value]);

    useEffect(() => {
        if (needsIntegrationSelect) fetchIntegrations();
    }, [needsIntegrationSelect, fetchIntegrations]);

    useEffect(() => {
        if (!selectedIntegrationId) return;
        fetchSenders(selectedIntegrationId);
    }, [fetchSenders, selectedIntegrationId]);

    const handleAdd = useCallback(() => {
        setEditingSender(null);
        setSenderModalOpen(true);
    }, []);

    const handleSaved = useCallback(() => {
        fetchSenders(selectedIntegrationId);
    }, [fetchSenders, selectedIntegrationId]);

    const handleIntegrationChange = useCallback((integId) => {
        setSelectedIntegrationId(integId);
        const integ = integrations.find((i) => String(i.id) === String(integId));
        onIntegrationChange?.(integId, integ);
        setSenders([]);
        onChange("");
    }, [integrations, onChange, onIntegrationChange]);

    return (
        <>
            {needsIntegrationSelect && (
                <div className="space-y-2">
                     <label className="text-sm font-medium text-[var(--card-foreground)] flex items-center gap-1.5">
                        <Plus size={12} className="text-[var(--muted-foreground)]" />
                        {t("senders.integration", { fallback: "Provider" })}
                    </label>
                    <Select value={selectedIntegrationId} onValueChange={handleIntegrationChange} disabled={disabled || loadingIntegrations}>
                        <SelectTrigger className="w-full rounded-xl !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                            <SelectValue placeholder={t("send.integrationPlaceholder", { fallback: "Choose integration" })} />
                        </SelectTrigger>
                        <SelectContent className="bg-card-select">
                            {integrations.map((integ) => (
                                <SelectItem key={integ.id} value={integ.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{integ.provider?.name || integ.providerCode}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {selectedIntegrationId && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--card-foreground)] flex items-center gap-1.5">
                        <User2 size={12} className="text-[var(--muted-foreground)]" />
                        {t("send.sender", { fallback: "Sender" })}
                    </label>

                    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
                        <SelectTrigger className="w-full rounded-xl !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                            <SelectValue placeholder={t("send.senderPlaceholder", { fallback: "Choose sender" })} />
                        </SelectTrigger>
                        <SelectContent className="bg-card-select">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleAdd();
                                }}
                                className="group relative cursor-pointer flex w-full items-center justify-center gap-2.5 !rounded-md px-3 py-2 text-sm outline-none text-primary font-bold hover:bg-primary/5 focus:bg-primary/5 transition-colors duration-150 text-center"
                            >
                                <Plus size={14} />
                                {t("senders.add", { fallback: "Add sender" })}
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                            {senders.length === 0 && !loading && (
                                <div className="px-3 py-4 text-xs text-center text-[var(--muted-foreground)]">
                                    {t("send.noSenders", { fallback: "No senders found" })}
                                </div>
                            )}

                            {senders.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{s.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">({s.identifier})</span>
                                        {s.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{t("senders.default", { fallback: "Default" })}</span>}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <AddEditSenderModal
                provider={provider}
                integrationId={selectedIntegrationId}
                sender={editingSender}
                open={senderModalOpen}
                onClose={() => setSenderModalOpen(false)}
                onSaved={handleSaved}
            />
        </>
    );
}
