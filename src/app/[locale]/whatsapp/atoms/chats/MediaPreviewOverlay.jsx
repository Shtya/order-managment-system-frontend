"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import { X, Send, FileText, Video, Image as ImageIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { useConversation } from "./ConversationContext";
import { VariableInput } from "@/components/ui/VariableInput";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import MediaUpload from "@/app/[locale]/whatsapp/atoms/MediaUpload";
import { isMediaId } from "@/utils/whatsapp-healper";

export const MediaForm = forwardRef(({
    variableProps = {},
    footerButtons,
    type,
    accountId
}, ref) => {
    const [pendingMedia, setLocalPendingMedia] = useState();
    const t = useTranslations("chats");
    const {
        control,
        handleSubmit,
        reset,
        setError,
        setValue,
        watch,
        getValues,
        trigger,
        formState: { errors, isValid, isSubmitting },
    } = useForm({
        mode: "onChange",
        defaultValues: {
            caption: ""
        },
    });

    const caption = watch("caption");
    const [mediaUrl, setMediaUrl] = useState(pendingMedia?.preview || "");
    const [mediaFile, setMediaFile] = useState(pendingMedia?.file || null);

    const preparePayload = (data) => {
        const currentType = type || pendingMedia?.type;
        const mediaObj = isMediaId(mediaUrl) 
            ? { id: mediaUrl, name: mediaFile?.name || "" } 
            : { url: mediaUrl, name: mediaFile?.name || "", file: mediaFile };
        
        return {
            type: currentType,
            [currentType]: mediaObj,
            caption: data.caption.trim() || "",
        };
    };

    const restore = (payload) => {
        if (payload) {
            const currentType = payload.type;
            const mediaData = payload[currentType];
            
            if (mediaData) {
                let previewUrl = "";
                let fileToSet = mediaData.file || null;
                
                if (mediaData.id) {
                    previewUrl = mediaData.id;
                    fileToSet = null;
                } 
                else if (mediaData.link) {
                    previewUrl = mediaData.link;
                }
                else if (mediaData.url) {
                    previewUrl = mediaData.url;
                    fileToSet = null;
                } 
                
                if (setLocalPendingMedia) {
                    setLocalPendingMedia({
                        file: fileToSet,
                        preview: previewUrl,
                        type: currentType,
                    });
                }
                
                setMediaFile(fileToSet);
                setMediaUrl(previewUrl);
            }
            
            if (payload.caption) {
                setValue("caption", payload.caption);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        reset: (values) => {
            if (!values && setLocalPendingMedia)
                setLocalPendingMedia(null);
            reset(values);
        },
        getValues,
        setValue,
        trigger,
        watch,
        form: { control, handleSubmit, reset, formState: { errors, isValid, isSubmitting } },
        submit: async () => {
            const valid = await trigger();
            if (!valid) return null;
            if (!mediaUrl) {

                setError("headerUrl", {
                    type: "manual",
                    message: t("pleaseUploadMedia"),
                });
                return null;
            }

            return preparePayload(getValues());
        },
        restore,
    }));

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setMediaFile(file);
            setMediaUrl(url);
            if (setLocalPendingMedia) {
                setLocalPendingMedia({
                    file,
                    preview: url,
                    type: type || pendingMedia?.type
                });
            }
        }
        e.target.value = "";
    };

    const handleUrlChange = (url) => {
        setMediaUrl(url);
        if (setLocalPendingMedia) {
            setLocalPendingMedia({
                ...pendingMedia,
                preview: url
            });
        }
    };

    return (
        <div className="flex-1 h-full flex flex-col overflow-hidden">
            {/* Media Upload Area */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
                <div className="w-full max-w-2xl">
                    <MediaUpload
                        type={type?.toUpperCase() || pendingMedia?.type?.toUpperCase()}
                        url={mediaUrl}
                        accountId={accountId}
                        onUrlChange={handleUrlChange}
                        onFileChange={handleFileChange}
                    />
                {errors.headerUrl && <p className="text-[11px] text-red-500">{errors.headerUrl.message || errors.headerUrl}</p>}
                </div>
            </div>

            {/* Footer / Caption Input */}
            <div className="p-4 md:p-6  backdrop-blur-md border-t border-border">
                <div className="max-w-4xl mx-auto flex items-end gap-3 md:gap-4">
                    <div className="flex-1">
                        <VariableInput
                            autoFocus
                            name="caption"
                            value={caption}
                            onChange={(val) => setValue("caption", val, { shouldValidate: true, shouldDirty: true })}
                            placeholder={t("captionPlaceholder")}
                            {...variableProps}
                        />
                    </div>
                    {footerButtons}
                </div>
            </div>
        </div>
    );
});

export const MediaPreviewForm = forwardRef(({
    pendingMedia,
    setLocalPendingMedia,
    variableProps = {},
    footerButtons
}, ref) => {
    const t = useTranslations("chats");
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        getValues,
        trigger,
        formState: { errors, isValid, isSubmitting },
    } = useForm({
        mode: "onChange",
        defaultValues: {
            caption: ""
        },
    });

    const caption = watch("caption");

    const preparePayload = (data) => ({
        type: pendingMedia.type,
        [pendingMedia.type]: { url: pendingMedia.preview, name: pendingMedia.file.name },
        caption: data.caption.trim() || "",
        file: pendingMedia.file
    });

    const restore = (payload) => {
        console.log(payload);
        if (payload) {
            // Restore pendingMedia from payload (we'll need to reconstruct it)
            if (setLocalPendingMedia && payload.file) {
                setLocalPendingMedia({
                    file: payload.file,
                    preview: payload[payload.type]?.url || "",
                    type: payload.type,
                });
            }
            if (payload.caption) {
                setValue("caption", payload.caption);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        reset,
        getValues,
        setValue,
        trigger,
        watch,
        form: { control, handleSubmit, reset, formState: { errors, isValid, isSubmitting } },
        submit: async () => {
            const valid = await trigger();
            if (!valid) return null;
            return preparePayload(getValues());
        },
        restore,
    }));

    const renderPreview = () => {
        switch (pendingMedia?.type) {
            case "image":
                return (
                    <img
                        src={pendingMedia.preview}
                        alt="Preview"
                        className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                    />
                );
            case "video":
                return (
                    <video
                        src={pendingMedia.preview}
                        controls
                        className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
                    />
                );
            case "document":
                const fileSize = pendingMedia.file.size > 1024 * 1024
                    ? `${(pendingMedia.file.size / (1024 * 1024)).toFixed(1)} MB`
                    : `KB ${(pendingMedia.file.size / 1024).toFixed(1)}`;
                const fileExt = pendingMedia.file.name.split('.').pop()?.toUpperCase() || "DOC";

                return (
                    <div className="flex flex-col items-center gap-6 p-12 bg-gray-50 dark:bg-card/40 rounded-3xl border border-border shadow-lg min-w-[340px] animate-in zoom-in-95 duration-300">
                        <div className="w-32 h-32 bg-white dark:bg-input/20 rounded-2xl flex items-center justify-center shadow-inner border border-border/50">
                            <FileText size={64} className="text-primary opacity-80" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-bold text-lg text-foreground max-w-[280px] truncate">
                                {pendingMedia.file.name}
                            </h3>
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    {t("noPreviewAvailable")}
                                </span>
                                <span className="text-[11px] text-muted-foreground/70 font-mono mt-1">
                                    <span className="font-bold"></span>{fileSize} <span className="text-muted-foreground/70">-</span> <span>{fileExt}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
                {renderPreview()}
            </div>

            {/* Footer / Caption Input */}
            <div className="p-4 md:p-6 bg-muted/80 dark:bg-card/80 backdrop-blur-md border-t border-border">
                <div className="max-w-4xl mx-auto flex items-end gap-3 md:gap-4">
                    <div className="flex-1">
                        <VariableInput
                            autoFocus
                            name="caption"
                            value={caption}
                            onChange={(val) => setValue("caption", val, { shouldValidate: true, shouldDirty: true })}
                            placeholder={t("captionPlaceholder")}
                            {...variableProps}
                        />
                    </div>
                    {footerButtons}
                </div>
            </div>
        </div>
    );
});

MediaPreviewForm.displayName = "MediaPreviewForm";

export default function MediaPreviewOverlay({
    variableProps = {}
}) {
    const { pendingMedia, setPendingMedia, handleSendMessage } = useConversation();
    const formRef = React.useRef(null);

    if (!pendingMedia) return null;

    const handleSend = async () => {
        const payload = await formRef.current?.submit();

        if (payload) {
            handleSendMessage(payload);
            setPendingMedia(null);
            formRef.current?.reset?.();
        }
    };

    const footerButtons = (
        <button
            onClick={handleSend}
            className="w-10 h-10 md:w-12 md:h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0"
        >
            <Send className="w-5 h-5 md:w-6 md:h-6" />
        </button>
    );

    return (
        <div className="absolute inset-0 z-[100] bg-background/95 dark:bg-background/98 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-muted/50 dark:bg-card/50 backdrop-blur-sm border-b border-border text-foreground">
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => {
                            setPendingMedia(null);
                            formRef.current?.reset?.();
                        }}
                        className="p-2 hover:bg-accent/50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <span className="font-medium text-xs md:text-sm truncate max-w-[150px] md:max-w-xs">{pendingMedia.file.name}</span>
                </div>
            </div>

            <MediaPreviewForm
                ref={formRef}
                pendingMedia={pendingMedia}
                variableProps={variableProps}
                footerButtons={footerButtons}
            />
        </div>
    );
}
