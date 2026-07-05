"use client";

import React, { useMemo, useRef } from "react";
import { UploadCloud, Trash2, FileText, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { useTranslations } from "next-intl";
import { getMediaUrlOrOriginal, WHATSAPP_DOCUMENT_ACCEPT, WHATSAPP_IMAGE_ACCEPT, WHATSAPP_VIDEO_ACCEPT } from "@/utils/whatsapp-healper";

/**
 * Reusable Media Upload component for WhatsApp Template creation
 */
export default function MediaUpload({
    type = "IMAGE",
    url = "",
    accountId,
    onUrlChange,
    onFileChange
}) {
    const t = useTranslations("whatsApp.templates.form.mediaUpload");
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const getAcceptType = () => {
        switch (type) {
            case "IMAGE":
                return WHATSAPP_IMAGE_ACCEPT;

            case "VIDEO":
                return WHATSAPP_VIDEO_ACCEPT;

            case "DOCUMENT":
                return WHATSAPP_DOCUMENT_ACCEPT;

            default:
                return "*/*";
        }
    };
    const getTypeName = () => {
        switch (type) {
            case "IMAGE": return t("types.image");
            case "VIDEO": return t("types.video");
            case "DOCUMENT": return t("types.document");
            default: return t("types.file");
        }
    };

    const finalUrl = useMemo(() => getMediaUrlOrOriginal(url, accountId), [url, accountId]);

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden",
                    finalUrl
                        ? "border-primary/50 bg-primary/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                )}
            >
                {finalUrl ? (
                    <div className="relative aspect-video w-full flex items-center justify-center bg-slate-950/5">
                        {type === "IMAGE" ? (
                            <img src={avatarSrc(finalUrl)} alt="Preview" className="w-full h-full object-contain" />
                        ) : type === "VIDEO" ? (
                            <video src={avatarSrc(finalUrl)} controls className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <FileText size={48} className="text-primary" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 px-4 text-center truncate max-w-xs">
                                    {finalUrl.split('/').pop()}
                                </span>
                            </div>
                        )}

                        <div className="absolute top-3 right-3 flex gap-2">
                            <button
                                type="button"
                                onClick={() => onUrlChange("")}
                                className="p-2 bg-white dark:bg-slate-900 shadow-lg rounded-full text-red-500 hover:text-red-600 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="py-12 flex flex-col items-center justify-center cursor-pointer"
                        onClick={handleUploadClick}
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <UploadCloud size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                            {t("dragAndDrop", { type: getTypeName() })}
                        </p>
                        <p className="text-xs text-slate-500 mb-6">
                            {t("maxSize")}
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                            >
                                <UploadCloud size={16} />
                                {t("uploadButton", { type: getTypeName() })}
                            </button>
                        </div>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={getAcceptType()}
                    onChange={onFileChange}
                />
            </div>

            <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <Info size={14} className="shrink-0 mt-0.5 text-primary" />
                <p className="leading-relaxed">
                    {t("policyNote", { type: getTypeName() })}
                </p>
            </div>
        </div>
    );
}
