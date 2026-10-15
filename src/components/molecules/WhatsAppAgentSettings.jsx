"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Bot, Info, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Button_ from "@/components/atoms/Button";
import AgentSelect, { AGENT_SELECT_DEFAULT } from "@/components/molecules/AgentSelect";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { cn } from "@/utils/cn";

const DEFAULT_KEY = "__default__";

const toAccountDraft = (row) => {
    if (!row?.aiResponses || row.aiResponses === "default") {
        return { mode: "default", on: false, agentId: AGENT_SELECT_DEFAULT };
    }
    return {
        mode: "custom",
        on: row.aiResponses === "enabled",
        agentId:
            row.aiAgentSource === "specific" && row.aiAgentId
                ? row.aiAgentId
                : AGENT_SELECT_DEFAULT,
    };
};

const toAccountPayload = (draft) => {
    if (draft.mode === "default") {
        return { aiResponses: "default", aiAgentSource: "default", aiAgentId: null };
    }
    if (!draft.on) {
        return { aiResponses: "disabled", aiAgentSource: "default", aiAgentId: null };
    }
    const specific = draft.agentId && draft.agentId !== AGENT_SELECT_DEFAULT;
    return {
        aiResponses: "enabled",
        aiAgentSource: specific ? "specific" : "default",
        aiAgentId: specific ? draft.agentId : null,
    };
};

const toDefaultPayload = (draft) => ({
    whatsappAiEnabled: !!draft.on,
    whatsappAiAgentId: draft.on ? draft.agentId || null : null,
});

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function ScopeTag({ kind }) {
    const t = useTranslations("whatsappAgentSettings");
    return (
        <span
            className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
                kind === "all" && "bg-primary text-primary-foreground",
                kind === "custom" && "bg-primary/10 text-primary",
                kind === "default" && "border border-border bg-muted text-muted-foreground",
            )}
        >
            {t(`tags.${kind}`)}
        </span>
    );
}

function ScopeOption({ title, subtitle, subtitleLtr, tag }) {
    const locale = useLocale();
    return (
        <span dir={locale === "ar" ? "rtl" : "ltr"} className="flex w-full min-w-0 items-center gap-3">
            <span className="min-w-0 flex-1 text-start">
                <span className="block truncate text-sm font-medium">{title}</span>
                {subtitle ? (
                    <span className="block truncate text-[11px] text-muted-foreground">
                        <bdi dir={subtitleLtr ? "ltr" : undefined}>{subtitle}</bdi>
                    </span>
                ) : null}
            </span>
            <ScopeTag kind={tag} />
        </span>
    );
}

function AgentFields({ value, onChange, readOnly, followsDefaultAgent, defaultAgentId }) {
    const t = useTranslations("whatsappAgentSettings");
    return (
        <div
            className={cn(
                "space-y-4 rounded-xl border border-border p-4",
                readOnly && "bg-muted/40 opacity-70",
            )}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <Label classN="text-sm font-medium text-foreground!">{t("enable")}</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("enableHint")}</p>
                </div>
                <Switch
                    checked={!!value.on}
                    disabled={readOnly}
                    onCheckedChange={(checked) => onChange?.({ ...value, on: checked })}
                />
            </div>
            <div className="space-y-2">
                <div>
                    <Label classN="text-sm font-medium text-foreground!">{t("agent")}</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("agentHint")}</p>
                </div>
                <AgentSelect
                    value={value.agentId}
                    disabled={readOnly || !value.on}
                    onValueChange={(agentId) => onChange?.({ ...value, agentId })}
                    defaultOptionLabel={
                        followsDefaultAgent
                            ? (agents) =>
                                t("defaultAgent", {
                                    name:
                                        agents.find((agent) => agent.id === defaultAgentId)?.name ||
                                        t("noAgent"),
                                })
                            : undefined
                    }
                    triggerClassName="h-11 rounded-xl"
                />
            </div>
        </div>
    );
}

export default function WhatsAppAgentSettings({ className }) {
    const t = useTranslations("whatsappAgentSettings");
    const { settings, refreshOrdersSettings } = useOrdersSettings();

    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [selected, setSelected] = useState(DEFAULT_KEY);
    const [draftDefault, setDraftDefault] = useState(null);
    const [draftAccounts, setDraftAccounts] = useState({});
    const [saving, setSaving] = useState(false);

    const fetchAccounts = useCallback(async () => {
        setAccountsLoading(true);
        try {
            const res = await api.get("/whatsapp-accounts", { params: { limit: 200, page: 1 } });
            setAccounts(Array.isArray(res.data?.records) ? res.data.records : []);
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setAccountsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const savedDefault = useMemo(
        () => ({
            on: !!settings?.whatsappAiEnabled,
            agentId: settings?.whatsappAiAgentId || null,
        }),
        [settings?.whatsappAiEnabled, settings?.whatsappAiAgentId],
    );

    const savedAccounts = useMemo(
        () => Object.fromEntries(accounts.map((row) => [row.id, toAccountDraft(row)])),
        [accounts],
    );

    const currentDefault = draftDefault ?? savedDefault;
    const accountDraft = (id) => draftAccounts[id] ?? savedAccounts[id];

    const defaultDirty =
        !!draftDefault && !same(toDefaultPayload(draftDefault), toDefaultPayload(savedDefault));
    const dirtyAccountIds = Object.keys(draftAccounts).filter(
        (id) =>
            savedAccounts[id] &&
            !same(toAccountPayload(draftAccounts[id]), toAccountPayload(savedAccounts[id])),
    );
    const dirty = defaultDirty || dirtyAccountIds.length > 0;

    const updateAccount = (id, next) =>
        setDraftAccounts((current) => ({ ...current, [id]: next }));

    const discard = () => {
        setDraftDefault(null);
        setDraftAccounts({});
    };

    const save = async () => {
        if (defaultDirty && draftDefault.on && !draftDefault.agentId) {
            setSelected(DEFAULT_KEY);
            toast.error(t("agentRequired"));
            return;
        }
        setSaving(true);
        try {
            if (defaultDirty) {
                await api.post("/client-settings", toDefaultPayload(draftDefault));
            }
            for (const id of dirtyAccountIds) {
                await api.patch(`/whatsapp-accounts/${id}/ai`, toAccountPayload(draftAccounts[id]));
            }
            toast.success(t("saved"));
            discard();
            if (defaultDirty) refreshOrdersSettings();
            if (dirtyAccountIds.length) await fetchAccounts();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setSaving(false);
        }
    };

    const tagFor = (id) => {
        if (id === DEFAULT_KEY) return "all";
        return accountDraft(id)?.mode === "custom" ? "custom" : "default";
    };

    const selectedAccount = selected === DEFAULT_KEY ? null : accounts.find((row) => row.id === selected);
    const selectedDraft = selectedAccount ? accountDraft(selectedAccount.id) : null;

    return (
        <div className={cn("space-y-5", className)}>
            <div className="space-y-2">
                <Label classN="text-sm font-medium text-foreground!">{t("number")}</Label>
                <Select value={selected} onValueChange={setSelected} disabled={accountsLoading}>
                    <SelectTrigger className="h-auto min-h-[52px] w-full rounded-xl py-2 cursor-pointer text-start [&>span.relative]:min-w-0 [&>span.relative]:flex-1 [&_[data-slot=select-value]]:w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={DEFAULT_KEY} className="py-2 cursor-pointer">
                            <ScopeOption
                                title={t("defaultOption")}
                                subtitle={t("defaultOptionHint")}
                                tag={tagFor(DEFAULT_KEY)}
                            />
                        </SelectItem>
                        {accounts.length ? <SelectSeparator /> : null}
                        {accounts.map((row) => (
                            <SelectItem key={row.id} value={row.id} className="py-2 cursor-pointer">
                                <ScopeOption
                                    title={row.name || row.mobileNumber || t("unnamedNumber")}
                                    subtitle={row.name ? row.mobileNumber : null}
                                    subtitleLtr
                                    tag={tagFor(row.id)}
                                />
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selected === DEFAULT_KEY ? (
                <>
                    <div className="flex items-start gap-2.5 rounded-xl bg-primary/10 p-3 text-xs leading-relaxed">
                        <Info size={15} className="mt-0.5 shrink-0 text-primary" />
                        <span>{t("defaultNote")}</span>
                    </div>
                    <AgentFields value={currentDefault} onChange={setDraftDefault} />
                </>
            ) : selectedDraft ? (
                <>
                    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1">
                        {["default", "custom"].map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                aria-pressed={selectedDraft.mode === mode}
                                onClick={() => {
                                    if (selectedDraft.mode === mode) return;
                                    updateAccount(
                                        selected,
                                        mode === "custom"
                                            ? { mode, on: currentDefault.on, agentId: AGENT_SELECT_DEFAULT }
                                            : { mode, on: false, agentId: AGENT_SELECT_DEFAULT },
                                    );
                                }}
                                className={cn(
                                    "rounded-lg px-3 py-2 text-sm transition-colors",
                                    selectedDraft.mode === mode
                                        ? "bg-background font-medium text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {t(mode === "default" ? "followDefault" : "customForNumber")}
                            </button>
                        ))}
                    </div>

                    {selectedDraft.mode === "default" ? (
                        <>
                            <AgentFields value={currentDefault} readOnly />
                            <p className="text-center text-xs text-muted-foreground">{t("followingHint")}</p>
                        </>
                    ) : (
                        <>
                            <AgentFields
                                value={selectedDraft}
                                onChange={(next) => updateAccount(selected, next)}
                                followsDefaultAgent
                                defaultAgentId={currentDefault.agentId}
                            />
                            <div className="text-center">
                                <button
                                    type="button"
                                    className="text-sm font-medium text-primary hover:underline"
                                    onClick={() =>
                                        updateAccount(selected, {
                                            mode: "default",
                                            on: false,
                                            agentId: AGENT_SELECT_DEFAULT,
                                        })
                                    }
                                >
                                    {t("resetToDefault")}
                                </button>
                            </div>
                        </>
                    )}
                </>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Button_
                    size="sm"
                    variant="solid"
                    label={t("save")}
                    disabled={!dirty || saving}
                    icon={saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    onClick={save}
                />
                <Button_
                    size="sm"
                    variant="ghost"
                    label={t("discard")}
                    disabled={!dirty || saving}
                    onClick={discard}
                />
            </div>
        </div>
    );
}

export function WhatsAppAgentSettingsDialog({ open, onOpenChange }) {
    const t = useTranslations("whatsappAgentSettings");
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot size={20} className="text-primary" />
                        {t("title")}
                    </DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>
                <WhatsAppAgentSettings />
            </DialogContent>
        </Dialog>
    );
}
