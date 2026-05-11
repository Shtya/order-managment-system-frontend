"use client";

import React, { useRef } from "react";
import { UploadCloud, Trash2, FileText, Info } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Reusable Media Upload component for WhatsApp Template creation
 */
export default function MediaUpload({ 
    type = "IMAGE", 
    url = "", 
    onUrlChange, 
    onFileChange 
}) {
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const getAcceptType = () => {
        switch (type) {
            case "IMAGE": return "image/*";
            case "VIDEO": return "video/*";
            case "DOCUMENT": return ".pdf,.doc,.docx";
            default: return "*/*";
        }
    };

    const getTypeName = () => {
        switch (type) {
            case "IMAGE": return "صورة";
            case "VIDEO": return "فيديو";
            case "DOCUMENT": return "مستند";
            default: return "ملف";
        }
    };

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden",
                    url
                        ? "border-primary/50 bg-primary/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                )}
            >
                {url ? (
                    <div className="relative aspect-video w-full flex items-center justify-center bg-slate-950/5">
                        {type === "IMAGE" ? (
                            <img src={url} alt="Preview" className="w-full h-full object-contain" />
                        ) : type === "VIDEO" ? (
                            <video src={url} controls className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <FileText size={48} className="text-primary" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 px-4 text-center truncate max-w-xs">
                                    {url.split('/').pop()}
                                </span>
                            </div>
                        )}
                        
                        <div className="absolute top-3 right-3 flex gap-2">
                            <button
                                type="button"
                                onClick={() => onUrlChange("")}
                                className="p-2 bg-white dark:bg-slate-900 shadow-lg rounded-full text-red-500 hover:text-red-600 transition-colors"
                                title="حذف"
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
                            اسحب ال{getTypeName()} وأفلته أو اختر ملفًا
                        </p>
                        <p className="text-xs text-slate-500 mb-6">
                            أقصى حجم للملف: 5 ميجابايت
                        </p>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                            >
                                <UploadCloud size={16} />
                                رفع {getTypeName()}
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
                    يرجى التأكد من أن ال{getTypeName()} التي ترسلها تتوافق مع سياسة شروط الخدمة الخاصة بنا.
                </p>
            </div>
        </div>
    );
}
