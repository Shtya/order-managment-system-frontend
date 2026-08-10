"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { FolderTree } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { PrimaryBtn, GhostBtn } from "@/components/atoms/Button";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { Input } from "@/components/ui/input";

export function CauseFormDialog({ cause, open, onClose, onSaved }) {
    const t = useTranslations("issueCauses");
    const isEdit = !!cause;

    const schema = useMemo(() => {
        return yup.object({
            nameEn: yup
                .string()
                .trim()
                .required(t("validation.nameEnRequired"))
                .max(200, t("validation.nameEnMax")),
            nameAr: yup
                .string()
                .trim()
                .max(200, t("validation.nameArMax"))
                .nullable(),
            sortOrder: yup
                .number()
                .integer()
                .min(0)
                .nullable()
                .transform((v) =>
                    v === "" || v === null || v === undefined ? 0 : Number(v),
                ),
        });
    }, [t]);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { nameEn: "", nameAr: "", sortOrder: 0 },
    });

    useEffect(() => {
        if (!open) return;
        reset({
            nameEn: cause?.nameEn || "",
            nameAr: cause?.nameAr || "",
            sortOrder: cause?.sortOrder ?? 0,
        });
    }, [open, cause, reset]);

    const onSubmit = useCallback(
        async (values) => {
            try {
                const payload = {
                    nameEn: values.nameEn.trim(),
                    nameAr: values.nameAr?.trim() ? values.nameAr.trim() : null,
                    sortOrder: values.sortOrder ?? 0,
                };

                if (isEdit) {
                    await api.patch(`/issues/causes/${cause.id}`, payload);
                } else {
                    await api.post(`/issues/causes`, payload);
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
                icon={FolderTree}
                title={isEdit ? t("dialog.editTitle") : t("dialog.addTitle")}
                subtitle={t("dialog.subtitle")}
                onClose={onClose}
            />

            <form className="p-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--card-foreground)]">
                        {t("dialog.nameEn")}
                    </label>
                    <Controller
                        name="nameEn"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder={t("dialog.nameEnPlaceholder")}
                                maxLength={200}
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
                        {t("dialog.nameAr")}
                    </label>
                    <Controller
                        name="nameAr"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder={t("dialog.nameArPlaceholder")}
                                maxLength={200}
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
                        {t("dialog.sortOrder")}
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
                        <p className="text-xs text-red-500">{errors.sortOrder.message}</p>
                    )}
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
