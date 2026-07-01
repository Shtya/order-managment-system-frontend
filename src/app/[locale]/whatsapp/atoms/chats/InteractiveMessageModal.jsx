"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import InteractiveMessageBuilder from "@/components/molecules/InteractiveMessageBuilder";
import TemplatePreview from "../TemplatePreview";
import { useConversation } from "./ConversationContext";
import { useLocale } from "next-intl";
import { LayoutGrid } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

export default function InteractiveMessageModal({ open, onOpenChange }) {
    const t = useTranslations("chats");
    const locale = useLocale();
    const {
        handleSendMessage,
    } = useConversation();
    const [headerMediaFile, setHeaderMediaFile] = useState(null);
    const schema = useMemo(() => yup.object({
        headerType: yup.string().oneOf(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).default("NONE"),
        headerText: yup.string().default(""),
        headerUrl: yup.string().default(""),
        bodyText: yup.string().required(t("validation.bodyTextRequired")),
        footerText: yup.string().default(""),
        buttons: yup.array().of(
            yup.object({
                text: yup.string().required(t("validation.buttonTextRequired"))
            })
        ).min(1, t("validation.buttonsRequired")).test(
            "no-duplicate-buttons",
            t("validation.buttonTextDuplicate"),
            (buttons) => {
                if (!buttons || buttons.length === 0) return true;
                const texts = buttons.map((b) => b.text);
                return new Set(texts).size === texts.length;
            }
        )
    }), [t]);

    const {  handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            headerType: "NONE",
            headerText: "",
            headerUrl: "",
            bodyText: "",
            footerText: "",
            buttons: []
        }
    });

    const watchAllFields = watch();



    const onSubmit = (data) => {
        handleSendMessage({
            type: "interactive",
            interactive: {
                type: "button",
                header: data.headerType !== "NONE" ? {
                    type: data.headerType.toLowerCase(),
                    [data.headerType.toLowerCase()]: data.headerType === "TEXT"
                        ? data.headerText
                        : { 
                            link: data.headerUrl,
                            file: headerMediaFile || undefined
                         }
                } : undefined,
                body: { text: data.bodyText },
                footer: data.footerText ? { text: data.footerText } : undefined,
                action: {
                    buttons: data.buttons.map((btn, idx) => ({
                        type: "reply",
                        reply: { id: `btn_${idx}`, title: btn.text }
                    }))
                }
            }
        });

        reset({});
        setHeaderMediaFile(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <LayoutGrid size={20} />
                        </div>
                        {t("interactiveMessage")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60 text-xs md:text-sm">
                        {t("interactiveDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Builder Section */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar border-b md:border-b-0 md:border-e border-border bg-card">
                        <InteractiveMessageBuilder
                            value={watchAllFields}
                            setHeaderMediaFile={setHeaderMediaFile}
                            onChange={(newValue) => {
                                Object.entries(newValue).forEach(([key, value]) => {
                                    setValue(key, value);
                                });
                            }}
                            config={{
                                minButtons: 1,
                                maxButtons: 3,
                                headerTypes: ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"],
                                allowVariables: false,
                                buttonStyles: []
                            }}
                            errors={errors}
                        />
                    </div>

                    {/* Preview Section */}
                    <div className="w-full md:w-[300px]  flex flex-col items-center justify-center p-4 md:p-6 shrink-0 overflow-y-auto md:border-s border-border">
                        <div className="sticky top-0 w-full flex flex-col items-center">
                            <p className="text-[10px] md:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mb-4 md:mb-6">
                                {t("preview")}
                            </p>
                            <div className="scale-75 md:scale-90 origin-top transform-gpu">
                                <TemplatePreview
                                    isInteractive={true}
                                    seeAllOptionsLabel={t("viewOptions")}
                                    template={{
                                        headerType: watchAllFields.headerType,
                                        headerText: watchAllFields.headerText,
                                        headerUrl: watchAllFields.headerUrl,
                                        bodyText: watchAllFields.bodyText,
                                        footerText: watchAllFields.footerText,
                                        buttons: (watchAllFields.buttons || []).map(b => ({
                                            type: "QUICK_REPLY",
                                            text: b.text
                                        })),
                                        language: locale === "ar" ? "ar" : "en"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-4 md:px-6 py-4 border-t border-border bg-card shrink-0 gap-2 flex flex-col-reverse sm:flex-row">
                    <Button_
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        label={t("cancel")}
                        className="w-full sm:w-auto"
                    />
                    <Button_
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
