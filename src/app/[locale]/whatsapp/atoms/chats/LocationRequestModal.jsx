"use client";

import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useTranslations, useLocale } from "next-intl";
import WhatsAppMessageBodyBuilder from "@/components/molecules/WhatsAppMessageBodyBuilder";
import TemplatePreview from "../TemplatePreview";
import { useConversation } from "./ConversationContext";
import { MapPin } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import { FaLocationDot } from "react-icons/fa6";

const createSchema = (t) =>
    yup.object({
        locationRequestBody: yup
            .string()
            .trim()
            .required(t("validation.bodyTextRequired") || "Message body is required")
    });

export const LocationRequestForm = forwardRef(({
    variableProps = {}
}, ref) => {
    const t = useTranslations("chats");
    const locale = useLocale();

    const schema = useMemo(() => createSchema(t), [t]);

    const form = useForm({
        resolver: yupResolver(schema),
        mode: "onChange",
        defaultValues: {
            locationRequestBody: ""
        }
    });

    const {
        control,
        handleSubmit: handleSubmitForm,
        watch,
        setValue,
        reset,
        getValues,
        trigger,
        formState: { errors, isValid, isSubmitting }
    } = form;

    const locationRequestBody = watch("locationRequestBody");
    // Helper function to build the exact payload
    const preparePayload = (data) => ({
        type: "interactive",
        interactive: {
            type: "location_request_message",
            body: { text: data.locationRequestBody.trim() },
            action: {
                name: "send_location"
            }
        }
    });

    const restore = (payload) => {
        if (payload?.interactive?.body?.text) {
            setValue("locationRequestBody", payload.interactive.body.text);
        }
    };

    useImperativeHandle(ref, () => ({
        setValue,
        getValues,
        reset,
        trigger,
        watch,
        form: { control, handleSubmit: handleSubmitForm, reset, formState: { errors, isValid, isSubmitting } },
        submit: async () => {
            const valid = await trigger();
            if (!valid) return null;
            return preparePayload(getValues());
        },
        restore,
    }));

    return (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Builder Section */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar border-b md:border-b-0 md:border-e border-border bg-card">
                <WhatsAppMessageBodyBuilder
                    value={locationRequestBody}
                    onChange={(value) => setValue("locationRequestBody", value, { shouldValidate: true, shouldDirty: true })}
                    label={t("body")}
                    placeholder={t("locationRequestBodyPlaceholder")}
                    allowVariables={false}
                    variableProps={variableProps}
                />
                {errors.locationRequestBody && (
                    <p className="text-destructive text-xs mt-1.5 font-medium">
                        {errors.locationRequestBody.message}
                    </p>
                )}
            </div>

            {/* Preview Section */}
            <div className="w-full md:w-[300px] flex flex-col items-center justify-center p-4 md:p-6 shrink-0 overflow-y-auto md:border-s border-border">
                <div className="sticky top-0 w-full flex flex-col items-center">
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mb-4 md:mb-6">
                        {t("preview")}
                    </p>
                    <div className="scale-75 md:scale-90 origin-top transform-gpu">
                        <TemplatePreview
                            isInteractive={true}
                            template={{
                                headerType: "NONE",
                                bodyText: locationRequestBody || "...",
                                buttons: [
                                    {
                                        type: "LOCATION_REQUEST",
                                        text: t("sendLocation"),
                                        icon: <FaLocationDot size={14} className="text-primary" />
                                    }
                                ],
                                language: locale === "ar" ? "ar" : "en"
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

LocationRequestForm.displayName = "LocationRequestForm";

export default function LocationRequestModal({ open, onOpenChange, variableProps = {} }) {
    const t = useTranslations("chats");
    const { handleSendMessage } = useConversation();
    const formRef = React.useRef(null);


    const handleSubmitClick = async () => {
        // Form validates internally and returns the formatted payload directly
        const payload = await formRef.current?.submit();

        if (payload) {
            handleSendMessage(payload);
            formRef.current?.reset?.();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] md:h-[80vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <MapPin size={20} />
                        </div>
                        {t("messageTypes.requestLocation")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60 text-xs md:text-sm">
                        {t("locationRequestDescription")}
                    </DialogDescription>
                </DialogHeader>

                <LocationRequestForm
                    ref={formRef}
                    variableProps={variableProps}
                />

                <DialogFooter className="px-4 md:px-6 py-4 border-t border-border bg-card shrink-0 gap-2 flex flex-col-reverse sm:flex-row">
                    <Button_
                        type="button"
                        variant="outline"
                        onClick={() => {
                            formRef.current?.reset?.();
                            onOpenChange(false)
                        }}
                        label={t("cancel")}
                        className="w-full sm:w-auto"
                    />
                    <Button_
                        type="button"
                        onClick={handleSubmitClick}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}