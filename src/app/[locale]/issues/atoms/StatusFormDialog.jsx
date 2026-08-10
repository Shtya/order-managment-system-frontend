"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Tag } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrimaryBtn, GhostBtn } from "@/components/atoms/Button";

const createSchema = (t) =>
  yup.object({
    nameEn: yup
      .string()
      .trim()
      .required(t("statuses.validation.nameEnRequired"))
      .max(50, t("statuses.validation.nameEnMax")),
    nameAr: yup
      .string()
      .trim()
      .max(50, t("statuses.validation.nameArMax"))
      .nullable()
      .optional(),
    description: yup
      .string()
      .trim()
      .nullable()
      .optional(),
    color: yup
      .string()
      .trim()
      .nullable()
      .optional(),
    sortOrder: yup
      .number()
      .integer(t("statuses.validation.sortOrderInteger"))
      .min(0, t("statuses.validation.sortOrderMin"))
      .transform((v) =>
        v === "" || v === null || v === undefined ? 0 : Number(v)
      ),
  });

export default function StatusFormDialog({
  open,
  onOpenChange,
  initialData = null,
  onSubmit,
}) {
  const t = useTranslations("issues");
  const isEdit = !!initialData;

  const schema = useMemo(() => createSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      description: "",
      color: "#6C5CE7",
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      nameEn: initialData?.nameEn || "",
      nameAr: initialData?.nameAr || "",
      description: initialData?.description || "",
      color: initialData?.color || "#6C5CE7",
      sortOrder: initialData?.sortOrder ?? 0,
    });
  }, [open, initialData, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const payload = {
        nameEn: values.nameEn.trim(),
        nameAr: values.nameAr?.trim() ? values.nameAr.trim() : null,
        description: values.description?.trim() ? values.description.trim() : null,
        color: values.color?.trim() || "#6C5CE7",
        sortOrder: values.sortOrder ?? 0,
      };
      await onSubmit?.(payload);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t("statuses.validation.saveFailed");
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <Tag size={20} />
            </div>
            <div>
              <span>{isEdit ? t("statuses.edit") : t("statuses.create")}</span>
              <DialogDescription asChild>
                <p className="text-xs mt-1">
                  {isEdit
                    ? t("statuses.editDesc")
                    : t("statuses.createDesc")}
                </p>
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 -mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--card-foreground)]">
              {t("statuses.nameEn")} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="nameEn"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={t("statuses.nameEnPlaceholder")}
                  maxLength={50}
                  error={Boolean(errors.nameEn)}
                />
              )}
            />
            {errors.nameEn?.message && (
              <p className="text-xs text-red-500">{errors.nameEn.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--card-foreground)]">
              {t("statuses.nameAr")}
            </label>
            <Controller
              name="nameAr"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={t("statuses.nameArPlaceholder")}
                  maxLength={50}
                  error={Boolean(errors.nameAr)}
                />
              )}
            />
            {errors.nameAr?.message && (
              <p className="text-xs text-red-500">{errors.nameAr.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--card-foreground)]">
              {t("statuses.description")}
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder={t("statuses.descriptionPlaceholder")}
                  resize="y"
                  error={Boolean(errors.description)}
                />
              )}
            />
            {errors.description?.message && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--card-foreground)]">
                {t("statuses.color")}
              </label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2 h-10 px-2 rounded-md border border-border bg-background/60">
                    <input
                      type="color"
                      value={field.value || "#6C5CE7"}
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--card-foreground)]">
                {t("statuses.sortOrder")}
              </label>
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    error={Boolean(errors.sortOrder)}
                  />
                )}
              />
              {errors.sortOrder?.message && (
                <p className="text-xs text-red-500">
                  {errors.sortOrder.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <GhostBtn
              type="button"
              onClick={() => onOpenChange?.(false)}
            >
              {t("actions.cancel")}
            </GhostBtn>
            <PrimaryBtn type="submit" loading={isSubmitting}>
              {isEdit ? t("actions.saveChanges") : t("statuses.create")}
            </PrimaryBtn>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
