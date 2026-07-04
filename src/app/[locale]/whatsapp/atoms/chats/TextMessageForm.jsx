"use client";

import React, { useMemo, forwardRef, useImperativeHandle } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { VariableInput } from "@/components/ui/VariableInput";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const createSchema = (t) =>
    yup.object({
        body: yup.string().trim().required(t("validation.bodyTextRequired")),
    });

export const TextMessageForm = forwardRef(({ variableProps = {} }, ref) => {
    const t = useTranslations("chats");

    const schema = useMemo(() => createSchema(t), [t]);

    const {
        control,
        reset,
        getValues,
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            body: "",
        },
    });

    const preparePayload = (data) => ({
        type: "text",
        text: { body: data.body.trim() },
    });

    const restore = (payload) => {
        if (payload?.text?.body) {
            setValue("body", payload.text.body);
        }
    };

    useImperativeHandle(ref, () => ({
        reset,
        getValues,
        setValue,
        trigger,
        watch,
        form: { control, reset, formState: { errors } },
        submit: async () => {
            const valid = await trigger();
            if (!valid) return null;
            return preparePayload(getValues());
        },
        restore,
    }));

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-card">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                <div className="space-y-4">
                    {/* Header Section */}
                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                        <MessageSquare size={18} className="text-primary" />
                        <h4 className="font-bold text-sm text-foreground">{t("message")}</h4>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("body")} <span className="text-red-500">*</span></Label>
                        <VariableInput
                            value={watch("body")}
                            onChange={(value) => setValue("body", value, { shouldValidate: true, shouldDirty: true })}
                            multiline={true}
                            rows={6}
                            placeholder={t("typeMessage")}
                            error={!!errors.body}
                            {...variableProps}
                        />
                        {errors.body && (
                            <p className="text-[10px] text-red-500">{errors.body.message}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

TextMessageForm.displayName = "TextMessageForm";
