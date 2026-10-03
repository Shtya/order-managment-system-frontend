"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, Undo2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function formatCountdown(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function AgentPausePill({ pausedUntil, onClick, canResume }) {
    const t = useTranslations("chats");
    const [now, setNow] = useState(() => Date.now());

    const remaining = pausedUntil ? new Date(pausedUntil).getTime() - now : 0;
    const isPaused = remaining > 0;

    useEffect(() => {
        if (!isPaused) return undefined;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [isPaused]);

    if (!isPaused) return null;

    const time = formatCountdown(remaining);

    const pill = (
        <span
            className={cn(
                "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border-2 border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground",
                canResume && "cursor-pointer hover:bg-muted/70 hover:border-primary/30",
                canResume && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            )}
        >
            <Undo2 className="h-3 w-3 shrink-0 opacity-80" />
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-3 w-3" />
            </span>
            <span className="whitespace-nowrap">{t("ai.paused")}</span>
            <span className="text-muted-foreground/50">·</span>
            <strong className="font-semibold tabular-nums text-primary">{time}</strong>
        </span>
    );

    if (!canResume) return pill;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    aria-label={t("ai.resumeNow")}
                    className="shrink-0 rounded-full"
                >
                    {pill}
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-[220px] text-center font-normal">
                <div className="font-semibold">{t("ai.resumeNow")}</div>
                <div className="mt-0.5 font-normal opacity-90">{t("ai.resumeAiTooltip")}</div>
            </TooltipContent>
        </Tooltip>
    );
}
