"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import api from "@/utils/api";
import { cn } from "@/utils/cn";

export const AGENT_SELECT_DEFAULT = "default";
export const AGENT_SELECT_NONE = "none";

export default function AgentSelect({
    value,
    onValueChange,
    placeholder,
    triggerClassName,
    defaultOptionLabel,
    noneOptionLabel,
}) {
    const t = useTranslations("agentSelect");
    const [agents, setAgents] = useState([]);

    useEffect(() => {
        let cancelled = false;
        const loadAgents = async () => {
            try {
                const res = await api.get("/agents", { params: { limit: 100, isActive: "true" } });
                if (!cancelled) setAgents(res.data?.records || []);
            } catch {
                if (!cancelled) setAgents([]);
            }
        };
        loadAgents();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Select
            value={value || undefined}
            onValueChange={(next) => {
                if (!next) return;
                onValueChange?.(next);
            }}
        >
            <SelectTrigger className={cn("w-full", triggerClassName)}>
                <SelectValue placeholder={placeholder || t("placeholder")} />
            </SelectTrigger>
            <SelectContent className="bg-card-select">
                <Link
                    href="/ai/agents"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "group relative cursor-pointer",
                        "flex w-full items-center justify-center gap-2.5",
                        "rounded-md! px-3 py-2 text-sm outline-none",
                        "text-primary font-bold",
                        "hover:bg-primary/5 focus:bg-primary/5",
                        "transition-colors duration-150 text-center"
                    )}
                >
                    <Plus size={14} />
                    {t("addAgent")}
                    <ExternalLink size={12} className="opacity-60" />
                </Link>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                {defaultOptionLabel ? (
                    <SelectItem value={AGENT_SELECT_DEFAULT}>{defaultOptionLabel(agents)}</SelectItem>
                ) : null}
                {noneOptionLabel ? (
                    <SelectItem value={AGENT_SELECT_NONE}>
                        {typeof noneOptionLabel === "function" ? noneOptionLabel(agents) : noneOptionLabel}
                    </SelectItem>
                ) : null}
                {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
