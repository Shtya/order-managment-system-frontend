"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { PrimaryBtn, GhostBtn } from "@/components/atoms/Button";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ReviewCauseDialog({ cause, mode, open, onClose, onSaved }) {
    const t = useTranslations("cancelCauses");
    const isAccept = mode === "accept";

    const schema = useMemo(
        () =>
            yup.object({
                name: yup
                    .string()
                    .trim()
                    .min(3, t("validation.nameMin"))
                    .max(200, t("validation.nameMax"))
                    .nullable(),
                description: yup
                    .string()
                    .trim()
                    .max(1000, t("validation.descriptionMax"))
                    .nullable(),
                reviewNote: yup
                    .string()
                    .trim()
                    .max(500, t("validation.reviewNoteMax"))
                    .nullable(),
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
        defaultValues: { name: "", description: "", reviewNote: "" },
    });

    useEffect(() => {
        if (!open) return;
        reset({
            name: cause?.name || "",
            description: cause?.description || "",
            reviewNote: cause?.reviewNote || "",
        });
    }, [open, cause, reset]);

    const onSubmit = useCallback(
        async (values) => {
            try {
                const payload = {
                    name: values.name?.trim() || undefined,
                    description:
                        values.description === undefined
                            ? undefined
                            : values.description?.trim() || "",
                    reviewNote: values.reviewNote?.trim() || undefined,
                };
                const path = isAccept ? "accept" : "reject";
                await api.post(`/cancel-causes/${cause.id}/${path}`, payload);
                toast.success(isAccept ? t("toast.accepted") : t("toast.rejected"));
                onSaved?.();
                onClose?.();
            } catch (e) {
                toast.error(normalizeAxiosError(e));
            }
        },
        [cause, isAccept, onClose, onSaved, t],
    );

    if (!open || !cause) return null;

    return (
        <ModalShell onClose={onClose}>
            <ModalHeader
                icon={isAccept ? CheckCircle : XCircle}
                title={isAccept ? t("review.acceptTitle") : t("review.rejectTitle")}
                subtitle={cause.name || ""}
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
                    <Label className="text-sm font-medium">{t("dialog.reviewNote")}</Label>
                    <Controller
                        name="reviewNote"
                        control={control}
                        render={({ field }) => (
                            <Textarea
                                {...field}
                                placeholder={t("dialog.reviewNotePlaceholder")}
                                maxLength={500}
                                rows={2}
                            />
                        )}
                    />
                    {errors.reviewNote?.message && (
                        <p className="text-xs text-red-500">{errors.reviewNote.message}</p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <GhostBtn onClick={onClose}>{t("dialog.cancel")}</GhostBtn>
                    <PrimaryBtn type="submit" loading={isSubmitting}>
                        {isAccept ? t("review.confirmAccept") : t("review.confirmReject")}
                    </PrimaryBtn>
                </div>
            </form>
        </ModalShell>
    );
}
