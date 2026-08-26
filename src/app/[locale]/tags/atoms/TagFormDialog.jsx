"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Tags } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { PrimaryBtn, GhostBtn } from "@/components/atoms/Button";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function TagFormDialog({ tag, open, onClose, onSaved }) {
  const t = useTranslations("tags");
  const isEdit = !!tag;

  const schema = useMemo(
    () =>
      yup.object({
        name: yup
          .string()
          .trim()
          .required(t("validation.nameRequired"))
          .min(1, t("validation.nameMin"))
          .max(120, t("validation.nameMax")),
        color: yup
          .string()
          .trim()
          .required(t("validation.colorInvalid"))
          .matches(HEX, t("validation.colorInvalid")),
        description: yup
          .string()
          .trim()
          .max(1000, t("validation.descriptionMax"))
          .nullable(),
        isActive: yup.boolean().default(true),
        allowManualAssignment: yup.boolean().default(true),
        priority: yup
          .number()
          .transform((v) =>
            v === "" || v === null || Number.isNaN(v) ? 0 : Number(v),
          )
          .integer()
          .min(0, t("validation.priorityMin")),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      color: "#6C5CE7",
      description: "",
      isActive: true,
      allowManualAssignment: true,
      priority: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: tag?.name || "",
      color: tag?.color || "#6C5CE7",
      description: tag?.description || "",
      isActive: tag?.isActive ?? true,
      allowManualAssignment: tag?.allowManualAssignment ?? true,
      priority: tag?.priority ?? 0,
    });
  }, [open, tag, reset]);

  const onSubmit = useCallback(
    async (values) => {
      try {
        const payload = {
          name: values.name.trim(),
          color: values.color.trim(),
          description: values.description?.trim() || null,
          isActive: values.isActive ?? true,
          allowManualAssignment: values.allowManualAssignment ?? true,
          priority: values.priority ?? 0,
        };
        if (isEdit) {
          await api.patch(`/tags/${tag.id}`, payload);
        } else {
          await api.post("/tags", payload);
        }
        toast.success(t("toast.saved"));
        onSaved?.();
        onClose?.();
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      }
    },
    [isEdit, tag, onClose, onSaved, t],
  );

  if (!open) return null;

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        icon={Tags}
        title={isEdit ? t("dialog.editTagTitle") : t("dialog.addTagTitle")}
        subtitle={t("dialog.tagSubtitle")}
        onClose={onClose}
      />
      <form className="p-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("dialog.name")}</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t("dialog.namePlaceholder")}
                maxLength={120}
                error={Boolean(errors.name)}
              />
            )}
          />
          {errors.name?.message && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-2 gap-2">

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("dialog.priority")}</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  min={0}
                  {...field}
                  error={Boolean(errors.priority)}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">{t("dialog.priorityHint")}</p>
            {errors.priority?.message && (
              <p className="text-xs text-red-500">{errors.priority.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("dialog.color")}</Label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2 h-10 px-2 rounded-md border border-border bg-background/60">
                  <input
                    type="color"
                    value={HEX.test(field.value) ? field.value : "#6C5CE7"}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                  <Input
                    {...field}
                    placeholder="#6C5CE7"
                    error={Boolean(errors.color)}
                    className="flex-1 border-0! shadow-none! bg-transparent!"
                  />
                </div>
              )}
            />
            {errors.color?.message && (
              <p className="text-xs text-red-500">{errors.color.message}</p>
            )}
          </div>
        </div>


        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("dialog.description")}</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder={t("dialog.descriptionPlaceholder")}
                maxLength={1000}
                rows={3}
              />
            )}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>



        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
          <Label className="text-sm font-medium">{t("dialog.isActive")}</Label>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
          <Label className="text-sm font-medium" description={t("dialog.allowEmployeeDescription")}>
            {t("dialog.allowEmployee")}
          </Label>
          <Controller
            name="allowManualAssignment"
            control={control}
            render={({ field }) => (
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <GhostBtn onClick={onClose}>{t("dialog.cancel")}</GhostBtn>
          <PrimaryBtn type="submit" loading={isSubmitting}>
            {t("dialog.save")}
          </PrimaryBtn>
        </div>
      </form>
    </ModalShell>
  );
}
