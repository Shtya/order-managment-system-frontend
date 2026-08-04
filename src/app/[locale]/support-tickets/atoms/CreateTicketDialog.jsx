"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Loader2, LifeBuoy, Plus, Ticket } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AttachmentUploader from "./AttachmentUploader";

export default function CreateTicketDialog({ open, onOpenChange, onCreate }) {
  const t = useTranslations("supportTickets");
  const [files, setFiles] = useState([]);

  const schema = yup.object({
    title: yup
      .string()
      .trim()
      .required(t("validation.titleRequired"))
      .max(250, t("validation.titleMaxLength")),
    message: yup
      .string()
      .trim()
      .required(t("validation.messageRequired"))
      .max(10000, t("validation.messageMaxLength")),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({ title: "", message: "" });
      setFiles([]);
    }
  }, [open, reset]);

  const onSubmit = async (values) => {
    const ok = await onCreate?.({ ...values, files });
    if (ok !== false) {
      onOpenChange?.(false);
      reset({ title: "", message: "" });
      setFiles([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <Ticket size={20} />
            </div>
            <div>
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                {t("dialogs.createTitle")}
              </span>
              <p className="text-xs font-normal text-muted-foreground mt-0.5">
                {t("dialogs.createSubtitle")}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("form.title")}</Label>
            <Input
              {...register("title")}
              placeholder={t("form.titlePlaceholder")}
              className="rounded-xl h-[46px]"
              maxLength={250}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("form.message")}</Label>
            <Textarea
              {...register("message")}
              placeholder={t("form.messagePlaceholder")}
              className="rounded-xl min-h-[120px]"
            />
            {errors.message && (
              <p className="text-xs text-red-600">{errors.message.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {t("form.attachments")}
            </Label>
            <AttachmentUploader files={files} onChange={setFiles} disabled={isSubmitting} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("form.send")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
