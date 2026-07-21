"use client";

import React, { useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import ListMessageBuilder from "@/components/molecules/ListMessageBuilder";
import TemplatePreview from "../TemplatePreview";
import { useConversation } from "./ConversationContext";
import { useLocale } from "next-intl";
import { List } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { isMediaId } from "@/utils/whatsapp-healper";

const createSchema = (t) =>
    yup.object({
        headerType: yup.string().oneOf(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).default("NONE"),
        headerText: yup.string().trim().default(""),
        headerUrl: yup.string().trim().default(""),
        bodyText: yup.string().trim().required(t("validation.bodyTextRequired")),
        footerText: yup.string().trim().default(""),
        menuLabel: yup.string().required(t("validation.menuLabelRequired")),
        sections: yup.array()
            .of(
                yup.object({
                    title: yup.string().trim().required(t("validation.sectionTitleRequired")),
                    rows: yup.array()
                        .of(
                            yup.object({
                                id: yup.string().trim().default(() => `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
                                title: yup.string().trim().required(t("validation.rowTitleRequired")),
                                description: yup.string().trim().nullable().default("")
                            })
                        )
                        .min(1, t("validation.minOneRowRequired"))
                })
            )
            .min(1, t("validation.sectionsRequired"))
    });

export const ListMessageForm = forwardRef(({
    variableProps,
    setLocalHeaderMediaFile,
    localHeaderMediaFile,
    accountId = null,
}, ref) => {
    const t = useTranslations("chats");
    const locale = useLocale();
    const schema = useMemo(() => createSchema(t), [t]);

    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            headerType: "NONE",
            headerText: "",
            headerUrl: "",
            bodyText: "",
            footerText: "",
            menuLabel: t("viewOptions"),
            sections: [{ title: "", rows: [] }]
        }
    });

    const {
        watch,
        setValue,
        reset,
        getValues,
        trigger,
        formState: { errors }
    } = form;

    const watchAllFields = watch();

    const preparePayload = (data) => {
        const mediaId = data?.id ? data?.id : isMediaId(data.headerUrl) ? data.headerUrl : undefined;
        return {
            type: "interactive",
            interactive: {
                type: "list",
                header: data.headerType !== "NONE" ? {
                    type: data.headerType.toLowerCase(),
                    [data.headerType.toLowerCase()]: data.headerType === "TEXT"
                        ? data.headerText
                        : mediaId
                            ? {
                                id: mediaId,
                            }
                            : {
                                link: data.headerUrl,
                                file: localHeaderMediaFile || undefined,
                            },
                } : undefined,
                body: { text: data.bodyText },
                footer: data.footerText ? { text: data.footerText } : undefined,
                action: {
                    button: data.menuLabel,
                    sections: data.sections.map((s) => ({
                        title: s.title,
                        rows: s.rows.map((r) => ({
                            id: r.id,
                            title: r.title,
                            description: r.description || undefined
                        }))
                    }))
                }
            }
        }
    };

    const restore = (payload) => {
        const interactive = payload?.interactive;
        if (!interactive) return;

        const header = interactive.header;

        if (header) {
            const headerType = header.type;

            if (headerType) {
                setValue("headerType", headerType.toUpperCase());

                if (headerType === "text") {
                    setValue("headerText", header.text ?? "");
                } else {
                    const media = header[headerType];
                    setValue("headerUrl", media?.id ?? media?.link ?? "");
                    // Note: Can't restore file automatically without user re-selecting
                }
            }
        }

        setValue("bodyText", interactive.body?.text ?? "");
        setValue("footerText", interactive.footer?.text ?? "");

        if (interactive.action?.button) {
            setValue("menuLabel", interactive.action.button);
        }

        if (Array.isArray(interactive.action?.sections)) {
            setValue("sections", interactive.action.sections);
        }
    };

    useImperativeHandle(ref, () => ({
        setValue,
        getValues,
        reset: (values) => {
            if (!values && setLocalHeaderMediaFile)
                setLocalHeaderMediaFile(null);
            reset(values);
        },
        trigger,
        watch,
        form,
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
                <ListMessageBuilder
                    value={watchAllFields}
                    onChange={(newValue) => {
                        Object.entries(newValue).forEach(([key, value]) => {
                            setValue(key, value);
                        });
                    }}
                    setHeaderMediaFile={setLocalHeaderMediaFile}
                    errors={errors}
                    accountId={accountId}
                    variableProps={variableProps}
                />
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
                            isList={true}
                            seeAllOptionsLabel={watchAllFields.menuLabel}
                            template={{
                                headerType: watchAllFields.headerType,
                                headerText: watchAllFields.headerText,
                                headerUrl: watchAllFields.headerUrl,
                                bodyText: watchAllFields.bodyText,
                                footerText: watchAllFields.footerText,
                                sections: watchAllFields.sections,
                                language: locale === "ar" ? "ar" : "en"
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});
ListMessageForm.displayName = "ListMessageForm";

export default function ListMessageModal({
    open,
    onOpenChange,
    variableProps = {}
}) {
    const t = useTranslations("chats");
    const {
        handleSendMessage
    } = useConversation();
    const [localHeaderMediaFile, setLocalHeaderMediaFile] = useState(null);

    const formRef = React.useRef(null);

    const handleSubmitClick = async () => {
        const payload = await formRef.current?.submit();

        if (payload) {
            handleSendMessage(payload);
            formRef.current?.reset?.();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <List size={20} />
                        </div>
                        {t("listMessage")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60 text-xs md:text-sm">
                        {t("listDescription")}
                    </DialogDescription>
                </DialogHeader>

                <ListMessageForm
                    ref={formRef}
                    variableProps={variableProps}
                    localHeaderMediaFile={localHeaderMediaFile}
                    setLocalHeaderMediaFile={setLocalHeaderMediaFile}
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
