"use client";

import React, { useMemo, useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/FloatingSelect";
import { formatDateWithFormat, useDateLang, getNaturalDayName } from "@/components/ui/dateConfig";
import { ListMessageForm } from "../../whatsapp/atoms/chats/ListMessageModal";
import { InteractiveMessageForm } from "../../whatsapp/atoms/chats/InteractiveMessageModal";
import { businessMessageBuilders } from "./businessMessageBuilders";

const getDisabledFieldsObject = (disabledFields) => {
    const obj = {};
    (disabledFields || []).forEach((key) => {
        obj[key] = true;
    });
    return obj;
};

const getDefaultBusinessConfig = (fields) => {
    const init = {};
    (fields || []).forEach((field) => {
        init[field.key] = field.defaultValue;
    });
    return init;
};

// Maps a full WhatsApp payload (messageData) back to the form-values shape so
// the message step can be restored from what was saved, mirroring the custom
// message flow where the payload is the persisted source of truth.
const getBaseFromPayload = (payload) => {
    const interactive = payload?.interactive;
    if (!interactive) return {};
    const base = {};
    const header = interactive.header;
    if (header) {
        base.headerType = (header.type || "NONE").toUpperCase();
        if (header.type === "text") {
            base.headerText = header.text ?? "";
        } else {
            base.headerUrl = header[header.type]?.link ?? header[header.type]?.id ?? "";
        }
    }
    base.bodyText = interactive.body?.text ?? "";
    base.footerText = interactive.footer?.text ?? "";
    if (Array.isArray(interactive.action?.buttons)) {
        base.buttons = interactive.action.buttons.map((btn) => ({
            text: btn.reply?.title ?? "",
        }));
    }
    if (interactive.action?.button) {
        base.menuLabel = interactive.action.button;
    }
    return base;
};

export const BusinessMessageForm = forwardRef(({
    definition,
    variableProps,
    accountId,
    onStepChange,
    children,
}, ref) => {
    const t = useTranslations("chats");
    const locale = useLocale();
    const lang = useDateLang(locale);
    const formRef = useRef(null);
    const hasBusinessConfig = (definition?.businessConfigFields || []).length > 0;
    const [step, setStep] = useState(hasBusinessConfig ? "options" : "message"); // 'options' | 'message'
    const [businessConfig, setBusinessConfig] = useState(() => getDefaultBusinessConfig(definition?.businessConfigFields));
    const savedConfigRef = useRef(null);
    const messageValuesRef = useRef(null);
    const [headerMediaFile, setHeaderMediaFile] = useState(null);

    const disabledFields = useMemo(() => getDisabledFieldsObject(definition?.disabledFields), [definition]);

    const numberErrors = useMemo(() => {
        const errors = {};
        (definition?.businessConfigFields || []).forEach((field) => {
            if (field.type !== 'number') return;
            const value = Number(businessConfig[field.key]);
            if (field.min !== undefined && value < field.min) {
                errors[field.key] = { type: 'min', min: field.min };
            } else if (field.max !== undefined && value > field.max) {
                errors[field.key] = { type: 'max', max: field.max };
            }
        });
        return errors;
    }, [businessConfig, definition]);
    const isOptionsValid = Object.keys(numberErrors).length === 0;

    const buildFinal = useMemo(() => {
        const builder = businessMessageBuilders[definition?.id];
        if (!builder) return (values) => values;
        const ctx = { locale, lang, t, formatDateWithFormat, getNaturalDayName };
        return (values, config) => builder(values, config, ctx);
    }, [definition, locale, lang, t]);

    // Builds the full message-step values (form shape) from a saved payload base
    // merged over the business builder output. Shared by the step effect and restore.
    const buildMessageValues = useCallback((base = {}) => {
        const messageValues = buildFinal(definition?.messageValues || {}, businessConfig);
        const values = {
            headerType: base.headerType ?? messageValues.headerType ?? "NONE",
            headerText: base.headerText ?? messageValues.headerText ?? "",
            headerUrl: base.headerUrl ?? messageValues.headerUrl ?? "",
            bodyText: base.bodyText ?? messageValues.bodyText ?? "",
            footerText: base.footerText ?? messageValues.footerText ?? "",
            menuLabel: base.menuLabel ?? messageValues.menuLabel ?? t("viewOptions"),
            buttons: base.buttons ?? messageValues.buttons ?? [],
        };
        if (definition?.messageType === "list") {
            values.sections = messageValues.sections && messageValues.sections.length
                ? messageValues.sections
                : [{ title: t("businessMessages.generatedRows"), rows: definition?.previewRows || [] }];
        }
        return values;
    }, [definition, buildFinal, businessConfig, t]);

    useEffect(() => {
        onStepChange?.(step);
    }, [step, onStepChange]);

    useEffect(() => {
        if (step !== "message" || !formRef.current) return;
        const base = messageValuesRef.current || (savedConfigRef.current ? getBaseFromPayload(savedConfigRef.current) : {});
        formRef.current.reset(buildMessageValues(base));
    }, [step, buildMessageValues]);

    const submit = async () => {
        if (step !== "message" || !formRef.current) return null;
        const messageData = await formRef.current.submit?.();
        if (!messageData) return null;
        return { messageData, businessConfig };
    };

    useImperativeHandle(ref, () => ({
        restore: ({ messageData: md, businessConfig: bc } = {}) => {
            if (md) savedConfigRef.current = md;
            if (bc) setBusinessConfig((prev) => ({ ...getDefaultBusinessConfig(definition?.businessConfigFields), ...prev, ...bc }));
            if (step === "message" && md && formRef.current) {
                formRef.current.reset(buildMessageValues(getBaseFromPayload(md)));
            }
        },
        next: () => {
            if (step !== "options" || !isOptionsValid) return;
            setStep("message");
        },
        prev: () => {
            if (!hasBusinessConfig || step !== "message") return;
            messageValuesRef.current = formRef.current?.getValues?.() || null;
            setStep("options");
        },
        submit,
        setValue: (...args) => formRef.current?.setValue?.(...args),
        getValues: () => formRef.current?.getValues?.(),
        reset: (values) => {
            savedConfigRef.current = null;
            messageValuesRef.current = null;
            setStep(hasBusinessConfig ? "options" : "message");
            setHeaderMediaFile(null);
            if (values) {
                const { messageData: md, businessConfig: bc } = values;
                if (md) savedConfigRef.current = md;
                if (bc) setBusinessConfig(bc);
            }
            formRef.current?.reset?.();
        },
    }));

    if (step === "options") {
        return (
            <div className="flex-1 flex flex-col overflow-hidden bg-card h-full">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    <div>
                        <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100">
                            {t("businessMessages.businessConfigTitle")}
                        </h4>
                        {definition?.descriptionKey && (
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">
                                {t(definition.descriptionKey)}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(definition?.businessConfigFields || []).map((field) => {
                            if (field.type === "boolean") {
                                return (
                                    <div key={field.key} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`businessConfig_${field.key}`}
                                            checked={!!businessConfig[field.key]}
                                            onCheckedChange={(checked) => {
                                                setBusinessConfig((prev) => ({
                                                    ...prev,
                                                    [field.key]: !!checked,
                                                }));
                                            }}
                                        />
                                        <label
                                            htmlFor={`businessConfig_${field.key}`}
                                            className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                                        >
                                            {t(field.labelKey)}
                                        </label>
                                    </div>
                                );
                            }
                            if (field.type === "select") {
                                return (
                                    <div key={field.key} className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                            {t(field.labelKey)}
                                        </label>
                                        <Select
                                            value={businessConfig[field.key]}
                                            onValueChange={(value) => {
                                                setBusinessConfig((prev) => ({
                                                    ...prev,
                                                    [field.key]: value,
                                                }));
                                            }}
                                        >
                                            <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(field.options || []).map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {field.dateFormat
                                                            ? formatDateWithFormat(new Date(), option, lang)
                                                            : t("businessConfig.options." + option)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            }
                            return (
                                <div key={field.key} className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                        {t(field.labelKey)}
                                    </label>
                                    <Input
                                        type="number"
                                        min={field.min}
                                        max={field.max}
                                        value={businessConfig[field.key] ?? ""}
                                        onChange={(e) => {
                                            setBusinessConfig((prev) => ({
                                                ...prev,
                                                [field.key]: Number(e.target.value),
                                            }));
                                        }}
                                        className="h-12 md:h-14 rounded-xl md:rounded-2xl px-4 md:px-6 text-xs md:text-sm"
                                    />
                                    {numberErrors[field.key] && (
                                        <p className="text-[10px] text-rose-500 font-bold mt-1">
                                            {t("businessConfig.validation." + numberErrors[field.key].type, {
                                                min: numberErrors[field.key].min,
                                                max: numberErrors[field.key].max,
                                            })}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    const formProps = {
        ref: formRef,
        variableProps,
        accountId,
        disabledFields,
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {definition?.messageType === "list" ? (
                <ListMessageForm
                    {...formProps}
                    localHeaderMediaFile={headerMediaFile}
                    setLocalHeaderMediaFile={setHeaderMediaFile}
                >
                    {children}
                </ListMessageForm>
            ) : (
                <InteractiveMessageForm
                    {...formProps}
                    headerMediaFile={headerMediaFile}
                    setHeaderMediaFile={setHeaderMediaFile}
                >
                    {children}
                </InteractiveMessageForm>
            )}
        </div>
    );
});
BusinessMessageForm.displayName = "BusinessMessageForm";
