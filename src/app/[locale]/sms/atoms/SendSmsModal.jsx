"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { MessageSquare, Phone, Send, User2 } from "lucide-react";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { PrimaryBtn } from "@/components/atoms/Button";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SenderSelect } from "./SenderSelect";
import VariableInput from "@/components/ui/VariableInput";

const egPhoneRegex = /^(010|011|012|015)\d{8}$/;

export function SendSmsModal({
    provider,
    variableProps,
    onClose,
    phoneRequired = true,
    phonePlaceholder,
    showIntegrationSelect = false,
    onSubmit: onSubmitProp,
    initialValues,
}) {
    const t = useTranslations("smsProviders");
    const [integrationId, setIntegrationId] = useState(initialValues?.integrationId || null);
    const [integrationMeta, setIntegrationMeta] = useState(initialValues?.integration || null);

    const schema = useMemo(() => yup.object({
        toNumber: (() => {
            const phoneInvalidMsg = t("send.validation.phoneInvalid", { fallback: "Enter a valid Egyptian phone number (010, 011, 012, or 015 followed by 8 digits)" });
            const baseRule = yup.string().trim();

            if (phoneRequired) {
                return baseRule
                    .required(t("send.validation.phoneRequired", { fallback: "Phone number is required" }))
                    .matches(egPhoneRegex, phoneInvalidMsg);
            }

            return baseRule
                .optional()
                .test("eg-phone", phoneInvalidMsg, (v) => {
                    if (!v) return true;
                    return egPhoneRegex.test(v);
                });
        })(),
        message: yup.string().trim().required(t("send.validation.messageRequired", { fallback: "Message is required" })),
        senderId: yup.string().trim().required(t("send.validation.senderRequired", { fallback: "Sender is required" })),
    }), [phoneRequired, t]);

    const resolvedPhonePlaceholder = useMemo(() => {
        if (!!phonePlaceholder) return phonePlaceholder;
        if (!phoneRequired) return t("send.phonePlaceholderOptional", { fallback: "010xxxxxxxxx (optional)" });
        return t("send.phonePlaceholder", { fallback: "010xxxxxxxxx" });
    }, [phonePlaceholder, phoneRequired, t]);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            toNumber: initialValues?.toNumber || "",
            message: initialValues?.message || "",
            senderId: initialValues?.senderId || "",
        },
    });

    useEffect(() => {
        if (!initialValues) return;
        setValue("toNumber", initialValues?.toNumber || "");
        setValue("message", initialValues?.message || "");
        setValue("senderId", initialValues?.senderId || "");
        if (initialValues?.integrationId) {
            setIntegrationId(initialValues.integrationId);
        }
        if (initialValues?.integration) {
            setIntegrationMeta(initialValues.integration);
        }
    }, [initialValues, setValue]);

    const fetchIntegration = useCallback(async () => {
        try {
            const { data } = await api.get(`/sms/integrations/${provider?.code}`);
            setIntegrationId(data?.id || null);
            setIntegrationMeta(data || null);
        } catch (_) {
            setIntegrationId(null);
            setIntegrationMeta(null);
        }
    }, [provider?.code]);

    useEffect(() => {
        if (!provider?.code) return;
        fetchIntegration();
    }, [fetchIntegration, provider?.code]);

    const handleFormSubmit = useCallback(async (values) => {
        try {
            const payload = {
                toNumber: values.toNumber,
                message: values.message.trim(),
                senderId: values.senderId,
            };

            if (typeof onSubmitProp === "function") {
                await onSubmitProp(payload, { provider, integrationId, integration: integrationMeta });
                onClose?.();
                return;
            }

            const res = await api.post(`/sms/send/${provider?.code}`, {
                ...payload,
            });

            const status = res?.data?.status;
            const error = res?.data?.error;
            if (status === "failed") {
                toast.error(t("send.failed", { error: error }));
            } else {
                toast.success(t("send.success", { fallback: "Sent successfully" }));
            }
            onClose?.();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        }
    }, [integrationId, onClose, onSubmitProp, provider, provider?.code, t]);

    return (
        <ModalShell onClose={onClose} className="min-w-[400px]">
            <ModalHeader icon={Send} title={t("send.title", { name: provider?.name })} subtitle={t("send.subtitle")} onClose={onClose} />

            <form className="p-6 space-y-5" onSubmit={handleSubmit(handleFormSubmit)}>
                {provider && <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border border-[var(--border)] flex-shrink-0 bg-white">
                        <img src={provider?.img} alt={provider?.name} className="full h-full object-contain" onError={(e) => (e.target.style.display = "none")} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--card-foreground)]">{provider?.name}</p>
                    </div>
                </div>
                }
                <div className="space-y-2">
                    <Controller
                        name="senderId"
                        control={control}
                        render={({ field }) => (
                            <SenderSelect
                                provider={provider}
                                integrationId={integrationId}
                                showIntegrationSelect={showIntegrationSelect}
                                value={field.value}
                                onChange={(v) => { if (!v) return; field.onChange(v) }}
                                onIntegrationChange={(id, integ) => {
                                    setIntegrationId(id);
                                    setIntegrationMeta(integ || null);
                                }}
                            />
                        )}
                    />
                    {errors.senderId?.message && <p className="text-xs text-red-500">{errors.senderId.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--card-foreground)] flex items-center gap-1.5">
                        <Phone size={12} className="text-[var(--muted-foreground)]" />
                        {t("send.phone", { fallback: "Phone numbers" })}
                    </label>
                    <Controller
                        name="toNumber"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder={resolvedPhonePlaceholder}
                                className="bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-xl"
                                resize="none"
                            />
                        )}
                    />
                    {errors.toNumber?.message && <p className="text-xs text-red-500">{errors.toNumber.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--card-foreground)] flex items-center gap-1.5">
                        <MessageSquare size={12} className="text-[var(--muted-foreground)]" />
                        {t("send.message", { fallback: "Message" })}
                    </label>
                    <Controller
                        name="message"
                        control={control}
                        render={({ field }) => (
                            <VariableInput
                                {...variableProps}
                                {...field}
                                multiline
                                rows={4}
                                placeholder={t("send.messagePlaceholder", { fallback: "Write your message..." })}
                                className="min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-xl"
                                resize="none"
                            />
                        )}
                    />
                    {errors.message?.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
                </div>

                <PrimaryBtn type="submit" disabled={isSubmitting} loading={isSubmitting} className="w-full">
                    {!isSubmitting && <Send size={14} />}
                    {isSubmitting ? t("send.sending") : t("send.send")}
                </PrimaryBtn>
            </form>
        </ModalShell>
    );
}
