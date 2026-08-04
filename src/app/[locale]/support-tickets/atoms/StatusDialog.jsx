"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import {
  allowedTransitionsFor,
} from "@/constants/support-ticket";
import { TicketStatusBadge } from "./TicketBadges";

export default function StatusDialog({
  open,
  onOpenChange,
  ticket,
  onSubmit,
  loading,
}) {
  const t = useTranslations("supportTickets");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setStatus("");
      setReason("");
    }
  }, [open]);

  const options = allowedTransitionsFor(ticket?.status);

  const handleSubmit = async () => {
    if (!status) return;
    const ok = await onSubmit?.(status, reason);
    if (ok !== false) onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md! w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <Tag size={20} />
            </div>
            <div>
              <span>{t("dialogs.statusTitle")}</span>
              <div className="mt-1">
                <TicketStatusBadge status={ticket?.status} />
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-4 md:p-6 custom-scrollbar bg-card">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("filters.status")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {options.length === 0 && (
                <p className="col-span-2 text-xs text-muted-foreground">
                  {t("validation.statusRequired")}
                </p>
              )}
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-start transition-all",
                    status === opt
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/70 hover:border-primary/40 bg-card",
                  )}
                >
                  <span className="text-sm font-medium">{t(`status.${opt}`)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("form.reason")}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("form.reasonPlaceholder")}
              className="rounded-xl min-h-[80px]"
              maxLength={2000}
            />
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
              disabled={!status || loading}
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
