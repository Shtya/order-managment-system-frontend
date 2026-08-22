"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Ban } from "lucide-react";
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

export function CauseFormDialog({ cause, open, onClose, onSaved }) {
    const t = useTranslations("cancelCauses");
    const isEdit = !!cause;

    const schema = useMemo(
        () =>
            yup.object({
                name: yup
                    .string()
                    .trim()
                    .required(t("validation.nameRequired"))
                    .min(3, t("validation.nameMin"))
                    .max(200, t("validation.nameMax")),
                description: yup
                    .string()
                    .trim()
                    .max(1000, t("validation.descriptionMax"))
                    .nullable(),
                sortOrder: yup
                    .number()
                    .integer()
                    .min(0, t("validation.sortOrderMin"))
                    .nullable()
                    .transform((v) =>
                        v === "" || v === null || v === undefined ? 0 : Number(v),
                    ),
                isActive: yup.boolean().default(true),
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
            description: "",
            sortOrder: 0,
            isActive: true,
        },
    });

    useEffect(() => {
        if (!open) return;
        reset({
            name: cause?.name || "",
            description: cause?.description || "",
            sortOrder: cause?.sortOrder ?? 0,
            isActive: cause?.isActive ?? true,
        });
    }, [open, cause, reset]);

    const onSubmit = useCallback(
        async (values) => {
            try {
                const payload = {
                    name: values.name.trim(),
                    description: values.description?.trim() || null,
                    sortOrder: values.sortOrder ?? 0,
                    isActive: values.isActive ?? true,
                };
                if (isEdit) {
                    await api.patch(`/cancel-causes/${cause.id}`, payload);
                } else {
                    await api.post("/cancel-causes", payload);
                }
                toast.success(t("toast.saved"));
                onSaved?.();
                onClose?.();
            } catch (e) {
                toast.error(normalizeAxiosError(e));
            }
        },
        [isEdit, cause, onClose, onSaved, t],
    );

    if (!open) return null;

    return (
        <ModalShell onClose={onClose}>
            <ModalHeader
                icon={Ban}
                title={isEdit ? t("dialog.editTitle") : t("dialog.addTitle")}
                subtitle={t("dialog.subtitle")}
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
                                maxLength={200}
                                error={Boolean(errors.name)}
                            />
                        )}
                    />
                    {errors.name?.message && (
                        <p className="text-xs text-red-500">{errors.name.message}</p>
                    )}
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

                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t("dialog.sortOrder")}</Label>
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
                        <p className="text-xs text-red-500">{errors.sortOrder.message}</p>
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
