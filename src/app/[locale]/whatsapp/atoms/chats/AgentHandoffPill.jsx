"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Headphones, Check, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function AgentHandoffPill({ onCancel, canCancel }) {
    const t = useTranslations("chats");
    const [open, setOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [justReturned, setJustReturned] = useState(false);

    if (justReturned) {
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

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className={cn(
                        "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[12px] font-medium text-amber-800",
                        "dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
                        "hover:bg-amber-100/80 dark:hover:bg-amber-900/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    )}
                >
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300">
                        <Headphones className="h-3 w-3" />
                    </span>
                    <span>{t("ai.handedOff")}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="center" sideOffset={6} className="w-[230px] p-3.5">
                <div className="text-[13px] font-semibold text-foreground">{t("ai.handedOffTitle")}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {t("ai.handedOffHint")}
                </div>
                {canCancel && (
                    <button
                        type="button"
                        disabled={cancelling}
                        onClick={async () => {
                            setCancelling(true);
                            try {
                                await onCancel();
                                setOpen(false);
                                setJustReturned(true);
                                setTimeout(() => setJustReturned(false), 1800);
                            } catch {
                                setCancelling(false);
                            } finally {
                                setCancelling(false);
                            }
                        }}
                        className="mt-3 flex h-8 w-full items-center justify-center rounded-[7px] bg-primary text-[12px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                        {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("ai.returnToAi")}
                    </button>
                )}
            </PopoverContent>
        </Popover>
    );
}
