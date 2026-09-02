"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Loader2, Pencil, Tags } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { cn } from "@/utils/cn";
import { PrimaryBtn, GhostBtn } from "@/components/atoms/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MultiSelect from "@/components/atoms/MultiSelect";
import { Button } from "@/components/ui/button";

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function unwrapUsers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function TagFormDialog({ tag, open, onClose, onSaved, target = "order", ns = "tags" }) {
  const t = useTranslations(ns);
  const isEdit = !!tag;
  const [initialEmployees, setInitialEmployees] = useState([]);

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
        employeeIds: yup.array().of(yup.string()).default([]),
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      color: "#6C5CE7",
      description: "",
      isActive: true,
      allowManualAssignment: true,
      employeeIds: [],
      priority: 0,
    },
  });

  const allowEmployees = useWatch({ control, name: "allowManualAssignment" });

  useEffect(() => {
    if (!open) return;
    reset({
      name: tag?.name || "",
      color: tag?.color || "#6C5CE7",
      description: tag?.description || "",
      isActive: tag?.isActive ?? true,
      allowManualAssignment: tag?.allowManualAssignment ?? true,
      employeeIds: Array.isArray(tag?.employeeIds) ? tag.employeeIds : [],
      priority: tag?.priority ?? 0,
    });
  }, [open, tag, reset]);

  useEffect(() => {
    if (!open) {
      setInitialEmployees([]);
      return;
    }
    const ids = Array.isArray(tag?.employeeIds) ? tag.employeeIds.filter(Boolean) : [];
    if (!ids.length) {
      setInitialEmployees([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/users/list", {
          params: { active: "true", limit: 200 },
        });
        const list = unwrapUsers(res.data);
        if (!cancelled) {
          setInitialEmployees(list.filter((user) => ids.includes(user.id)));
        }
      } catch {
        if (!cancelled) setInitialEmployees([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tag?.employeeIds]);

  useEffect(() => {
    if (!allowEmployees) {
      setValue("employeeIds", []);
    }
  }, [allowEmployees, setValue]);

  const onSubmit = useCallback(
    async (values) => {
      try {
        const allowManualAssignment = values.allowManualAssignment ?? true;
        const payload = {
          name: values.name.trim(),
          color: values.color.trim(),
          description: values.description?.trim() || null,
          isActive: values.isActive ?? true,
          allowManualAssignment,
          employeeIds: allowManualAssignment
            ? (values.employeeIds || []).map((id) =>
                typeof id === "string" ? id : id?.id,
              ).filter(Boolean)
            : [],
          priority: values.priority ?? 0,
        };
        if (target === "client") payload.target = "client";
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
    [isEdit, tag, onClose, onSaved, t, target],
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <DialogContent className="max-w-4xl! w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              {isEdit ? <Pencil size={20} /> : <Tags size={20} />}
            </div>
            {isEdit ? t("dialog.editTagTitle") : t("dialog.addTagTitle")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            {t("dialog.tagSubtitle")}
          </p>
        </DialogHeader>
      <form className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-card space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("dialog.name")}</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t("dialog.nameTagPlaceholder")}
                maxLength={120}
                error={Boolean(errors.name)}
              />
            )}
          />
          {errors.name?.message && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 gap-3">
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
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 gap-3">
            <Label
              className="text-sm font-medium"
              description={t("dialog.allowEmployeeDescription")}
            >
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
        </div>

        <div
          className={cn(
            "space-y-2",
            !allowEmployees && "opacity-50 pointer-events-none",
          )}
        >
          <Label
            className="text-sm font-medium"
            description={t("dialog.employeesDescription")}
          >
            {t("dialog.employees")}
          </Label>
          <Controller
            name="employeeIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                endpoint="/users/list"
                params={{ active: "true" }}
                value={field.value}
                initialValues={initialEmployees}
                onChange={(newVal) =>
                  field.onChange(
                    (newVal || []).map((v) =>
                      typeof v === "string" ? v : v.id,
                    ),
                  )
                }
                placeholder={t("dialog.employeesPlaceholder")}
                labelKey="name"
              />
            )}
          />
          <p className="text-xs text-muted-foreground">{t("dialog.employeesHint")}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onClose}>{t("dialog.cancel")}</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={14} className="animate-spin mr-2" /> : t("dialog.save")}
          </Button>
        </div>
      </form>
      </DialogContent>
    </Dialog>
  );
}
