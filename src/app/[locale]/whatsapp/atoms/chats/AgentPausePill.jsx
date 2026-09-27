"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, Check, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function formatCountdown(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function AgentPausePill({ pausedUntil, onResume, canResume }) {
    const t = useTranslations("chats");
    const [now, setNow] = useState(() => Date.now());
    const [open, setOpen] = useState(false);
    const [resuming, setResuming] = useState(false);
    const [justResumed, setJustResumed] = useState(false);

    const remaining = pausedUntil ? new Date(pausedUntil).getTime() - now : 0;
    const isPaused = remaining > 0;

    useEffect(() => {
        if (!isPaused && !justResumed) return undefined;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [isPaused, justResumed]);

    useEffect(() => {
        if (!isPaused) setOpen(false);
    }, [isPaused]);

    if (justResumed) {
        return (
            <span
                className="inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[12px] font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-300">
                    <Check className="h-3 w-3" />
                </span>
                {t("ai.resumed")}
            </span>
        );
    }

    if (!isPaused) return null;

    const time = formatCountdown(remaining);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className={cn(
                        "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground",
                        "hover:bg-muted/50 hover:border-border",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    )}
                >
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bot className="h-3 w-3" />
                    </span>
                    <span>{t("ai.paused")}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <strong className="font-semibold tabular-nums text-primary">{time}</strong>
                </button>
            </PopoverTrigger>
            <PopoverContent align="center" sideOffset={6} className="w-[230px] p-3.5">
                <div className="text-[13px] font-semibold text-foreground">{t("ai.pausedTitle")}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{t("ai.humanTakeover")}</div>
                <div className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                    {t("ai.resumesIn")}{" "}
                    <strong className="font-semibold tabular-nums text-primary">{time}</strong>
                </div>
                {canResume && (
                    <button
                        type="button"
                        disabled={resuming}
                        onClick={async () => {
                            setResuming(true);
                            try {
                                await onResume();
                                setOpen(false);
                                setJustResumed(true);
                                setTimeout(() => setJustResumed(false), 1800);
                            } catch {
                                setResuming(false);
                            } finally {
                                setResuming(false);
                            }
                        }}
                        className="mt-3 flex h-8 w-full items-center justify-center rounded-[7px] bg-primary text-[12px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                        {resuming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("ai.resumeNow")}
                    </button>
                )}
            </PopoverContent>
        </Popover>
    );
}
