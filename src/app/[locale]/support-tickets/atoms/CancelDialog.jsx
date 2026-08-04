"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CancelDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}) {
  const t = useTranslations("supportTickets");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleSubmit = async () => {
    const ok = await onSubmit?.(reason);
    if (ok !== false) onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle size={20} />
            </div>
            <span>{t("dialogs.cancelTitle")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("form.reason")}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("form.reasonPlaceholder")}
              className="rounded-xl min-h-[90px]"
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
              variant="destructive"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("actions.cancel")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
