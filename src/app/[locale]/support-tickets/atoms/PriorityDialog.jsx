"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Flag, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { TICKET_PRIORITY } from "@/constants/support-ticket";
import { TicketPriorityBadge } from "./TicketBadges";

const PRIORITIES = Object.keys(TICKET_PRIORITY).map(
  (key) => TICKET_PRIORITY[key],
);

export default function PriorityDialog({
  open,
  onOpenChange,
  ticket,
  onSubmit,
  loading,
}) {
  const t = useTranslations("supportTickets");
  const [priority, setPriority] = useState("");
  const current = ticket?.priority;

  useEffect(() => {
    if (open) setPriority("");
  }, [open]);

  const handleSubmit = async () => {
    if (!priority) return;
    const ok = await onSubmit?.(priority);
    if (ok !== false) onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md! w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <Flag size={20} />
            </div>
            <div>
              <span>{t("dialogs.priorityTitle")}</span>
              <div className="mt-1">
                <TicketPriorityBadge priority={ticket?.priority} />
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-4 md:p-6 custom-scrollbar bg-card">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("filters.priority")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map((opt) => {
                const isCurrent = opt === current;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPriority(opt)}
                    disabled={isCurrent}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-start transition-all",
                      isCurrent
                        ? "border-primary/40 bg-muted/40 cursor-not-allowed opacity-70"
                        : priority === opt
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/70 hover:border-primary/40 bg-card",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {isCurrent && <Check className="w-4 h-4 text-primary" />}
                      <span className="text-sm font-medium">{t(`priority.${opt}`)}</span>
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {t("dialogs.current")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={loading}
            >
              {t("form.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!priority || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("form.save")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
