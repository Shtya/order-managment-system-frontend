import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Plus, User2 } from "lucide-react";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { PrimaryBtn } from "@/components/atoms/Button";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import IntegrationSelect from "./IntegrationSelect";

export function AddEditSenderModal({ provider, integrationId, sender, open, onClose, onSaved }) {
    const t = useTranslations("smsProviders");
    const isEdit = !!sender;

    const schema = useMemo(() => {
        const s = yup.object({
            name: yup.string().trim().required(t("senders.validation.nameRequired", { fallback: "Name is required" })).max(100),
            identifier: yup.string().trim().required(t("senders.validation.identifierRequired", { fallback: "Identifier is required" })).max(150),
            description: yup.string().trim().nullable().default(null),
            isDefault: yup.boolean().default(false),
            integrationId: yup.string().required(t("senders.validation.integrationRequired", { fallback: "Integration is required" })),
        });
        return s;
    }, [t]);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            identifier: "",
            description: "",
            isDefault: false,
            integrationId: integrationId || sender?.integrationId || "",
        },
    });

    useEffect(() => {
        if (!open) return;
        reset({
            name: sender?.name || "",
            identifier: sender?.identifier || "",
            description: sender?.description || "",
            isDefault: Boolean(sender?.isDefault),
            integrationId: integrationId || sender?.integrationId || "",
        });
    }, [open, sender, reset, integrationId]);

    const onSubmit = useCallback(async (values) => {
        try {
            const payload = {
                name: values.name.trim(),
                identifier: values.identifier.trim(),
                description: values.description?.trim() ? values.description.trim() : null,
                isDefault: Boolean(values.isDefault),
                integrationId: isEdit ? undefined : values.integrationId,
            };

            if (isEdit) {
                await api.patch(`/sms/senders/${sender.id}`, payload);
            } else {
                await api.post(`/sms/senders`, payload);
            }

            toast.success(t("senders.saved", { fallback: "Saved successfully" }));
            onSaved?.();
            onClose?.();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        }
    }, [isEdit, sender, onClose, onSaved, t]);

    if (!open) return null;

    const integLabel = sender?.integration?.provider?.name || sender?.integration?.providerCode || "";

    return (
        <ModalShell onClose={onClose}>
            <ModalHeader
                icon={User2}
                title={isEdit ? t("senders.editTitle", { fallback: "Edit sender" }) : t("senders.addTitle", { fallback: "Add sender" })}
                subtitle={t("senders.subtitle", { name: integLabel || provider?.name, fallback: "Manage sender identifiers for this provider" })}
                onClose={onClose}
            />

            <form className="p-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                {isEdit ? (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[var(--card-foreground)]">{t("senders.integration", { fallback: "Integration" })}</label>
                        <Input value={integLabel} disabled className="h-10 rounded-xl bg-muted/50" />
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[var(--card-foreground)]">{t("senders.integration", { fallback: "Integration" })}</label>
                        <Controller
                            name="integrationId"
                            control={control}
                            render={({ field }) => (
                                <IntegrationSelect
                                    allOption={false}
                                    error={errors.integrationId?.message}
                                    value={field.value}
                                    onChange={(v) => { field.onChange(v); }}
                                    placeholder={t("send.integrationPlaceholder", { fallback: "Choose integration" })}
                                />
                            )}
                        />
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--card-foreground)]">{t("senders.fields.name", { fallback: "Name" })}</label>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} placeholder={t("senders.placeholders.name", { fallback: "Sender name" })} error={Boolean(errors.name)} />
                        )}
                    />
                    {errors.name?.message && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--card-foreground)]">{t("senders.fields.identifier", { fallback: "Identifier" })}</label>
                    <Controller
                        name="identifier"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} placeholder={t("senders.placeholders.identifier", { fallback: "Sender identifier" })} error={Boolean(errors.identifier)} />
                        )}
                    />
                    {errors.identifier?.message && <p className="text-xs text-red-500">{errors.identifier.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--card-foreground)]">{t("senders.fields.description", { fallback: "Description" })}</label>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <Textarea {...field} resize="none" rows={3} placeholder={t("senders.placeholders.description", { fallback: "Optional notes" })} />
                        )}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Controller
                        name="isDefault"
                        control={control}
                        render={({ field }) => (
                            <Checkbox checked={Boolean(field.value)} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                        )}
                    />
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-[var(--card-foreground)]">{t("senders.fields.default", { fallback: "Set as default" })}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{t("senders.fields.defaultHint", { fallback: "Used automatically when sending SMS." })}</p>
                    </div>
                </div>

                <PrimaryBtn type="submit" loading={isSubmitting} className="w-full">
                    {t("senders.save", { fallback: "Save" })}
                </PrimaryBtn>
            </form>
        </ModalShell>
    );
}
