"use client";

import { Headphones, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AgentHandoffPill({ onClick, canCancel }) {
    const t = useTranslations("chats");

    const pill = (
        <span
            className={cn(
                "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/40 px-2.5 text-[12px] font-medium text-amber-800/90",
                "dark:border-amber-800/40 dark:bg-amber-950/25 dark:text-amber-200/90",
                canCancel && "cursor-pointer hover:bg-amber-50/80 dark:hover:bg-amber-950/40",
                canCancel && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            )}
        >
            <Undo2 className="h-3 w-3 shrink-0 text-amber-700/70 dark:text-amber-300/70" />
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-amber-100/70 text-amber-700/80 dark:bg-amber-900/50 dark:text-amber-300/80">
                <Headphones className="h-3 w-3" />
            </span>
            <span className="whitespace-nowrap">{t("ai.handedOff")}</span>
        </span>
    );

    if (!canCancel) return pill;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    aria-label={t("ai.returnToAgent")}
                    className="shrink-0 rounded-full"
                >
                    {pill}
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-[220px] text-center font-normal">
                <div className="font-semibold">{t("ai.returnToAgent")}</div>
                <div className="mt-0.5 font-normal opacity-90">{t("ai.returnToAiTooltip")}</div>
            </TooltipContent>
        </Tooltip>
    );
}
