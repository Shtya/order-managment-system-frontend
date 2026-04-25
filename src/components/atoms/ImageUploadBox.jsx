"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Image as ImageIcon, FileText, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import { baseImg } from "@/utils/axios";
import { avatarSrc } from "./UserSelect";

export function makeId() {
    return crypto.randomUUID();
}

export function ImageUploadBox({ title, files, onFilesChange, onRemove, multiple = true, accept = 'image/*', className, error, uploadMode = 'local', getErrors, setErrors }) {
    const t = useTranslations('addProduct');
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const generalErrorMessage = typeof error === 'string' ? error : error?.general;
    const specificErrors = error?.specific || {};

    const deleteOrphan = React.useCallback((orphanId) => {
        const id = orphanId;
        if (!Number.isFinite(id) || id <= 0) return;
        // Fire-and-forget: cron will clean up if this fails
        void api.delete(`/orphan-files/${id}`).catch(() => { });
    }, []);

    const uploadOne = React.useCallback(async (item) => {
        const fd = new FormData();
        fd.append('file', item.file);
        const res = await api.post('/orphan-files', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const id = res?.data?.id;
        const url = res?.data?.url;
        if (!id || !url) throw new Error('Upload failed');
        return { orphanId: id, orphanUrl: String(url) };
    }, []);

    const addFiles = React.useCallback((picked) => {
        const next = picked.map((file) => ({
            id: makeId(),
            file,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            isFromLibrary: false,
            isExisting: false,
            uploadStatus: uploadMode === 'direct' ? 'uploading' : 'idle',
            orphanId: null,
            orphanUrl: null,
        }));
        const safeFiles = (files ?? []).filter(Boolean);


        const revokePreview = (item) => {
            if (item?.previewUrl && !item.isFromLibrary && !item.isExisting) {
                URL.revokeObjectURL(item.previewUrl);
            }
        };

        if (!multiple && typeof getErrors === 'function') {
            const { ok } = getErrors(next);
            if (!ok) {
                next.forEach((n) => {
                    n.uploadStatus = "error";
                    return n;
                })
                const merged = [...next, ...safeFiles];
                //get errors again after merging to save prev old files errors
                const { ok, ...errors } = getErrors(merged);
                setErrors(errors)
                onFilesChange(merged);
                return;
            }
        }
        // MULTI MODE: allow partial upload (valid only)
        if (multiple && typeof getErrors === 'function') {
            const { specific = {}, maxAllowed = 20 } = getErrors(next) || {};

            const invalidNext = next.filter((n) => !!specific?.[n.id]).map((n) => ({ ...n, uploadStatus: "error" }));
            const validNext = next.filter((n) => !specific?.[n.id]);

            const remainingSlots = Math.max(0, Number(maxAllowed) - safeFiles.length);
            const acceptedValid = validNext.slice(0, remainingSlots);
            const droppedValid = validNext.slice(remainingSlots);

            // drop extra valids completely if exceeding max (revoke previews)
            droppedValid.forEach(revokePreview);

            const merged = [...invalidNext, ...acceptedValid, ...safeFiles];
            // compute errors for merged so UI shows invalid messages and keeps previous errors
            const { ok, ...errors } = getErrors(merged) || {};
            if (typeof setErrors === "function") setErrors(errors);
            onFilesChange(merged);

            // upload only accepted valid
            if (uploadMode === 'direct') {
                acceptedValid.forEach(async (it) => {
                    try {
                        const { orphanId, orphanUrl } = await uploadOne(it);
                        onFilesChange((curr) => (curr ?? []).filter(Boolean).map((x) => x.id === it.id ? { ...x, uploadStatus: 'success', orphanId, orphanUrl } : x));
                    } catch (e) {
                        onFilesChange((curr) => (curr ?? []).filter(Boolean).map((x) => x.id === it.id ? { ...x, uploadStatus: 'error' } : x));
                    }
                });
            }

            return;
        }

        // single-file mode: replacing should delete old orphan first
        if (!multiple) {
            const prev = safeFiles?.[0];
            const proposed = next.slice(0, 1);
            onFilesChange(proposed);

            // after validation passes, delete old and replace
            if (prev?.previewUrl && !prev.isFromLibrary && !prev.isExisting) URL.revokeObjectURL(prev.previewUrl);
            if (uploadMode === 'direct' && prev?.orphanId && !prev.isExisting && !prev.isFromLibrary) deleteOrphan(prev.orphanId);


        } else {
            const merged = [...next, ...safeFiles];

            onFilesChange(merged);

        }

        if (uploadMode === 'direct') {
            next.forEach(async (it) => {
                try {
                    const { orphanId, orphanUrl } = await uploadOne(it);

                    onFilesChange((curr) => {
                        return (curr ?? []).filter(Boolean).map((x) => x.id === it.id ? { ...x, uploadStatus: 'success', orphanId, orphanUrl } : x);
                    });
                } catch (e) {
                    onFilesChange((curr) => (curr ?? []).filter(Boolean).map((x) => x.id === it.id ? { ...x, uploadStatus: 'error' } : x));
                }
            });
        }
    }, [deleteOrphan, files, multiple, uploadMode, uploadOne]);

    const onPick = (e) => {
        const picked = Array.from(e.target.files ?? []);
        if (!picked.length) return;
        addFiles(picked);
        e.target.value = '';
    };

    const removeFile = (id) => {
        const target = (files ?? []).filter(Boolean).find((f) => f.id === id);
        if (onRemove) onRemove(target);
        if (target?.previewUrl && !target.isFromLibrary && !target.isExisting) URL.revokeObjectURL(target.previewUrl);
        // remove from UI first
        onFilesChange((files ?? []).filter(Boolean).filter((f) => f.id !== id));
        // then try to delete orphan row (only for direct uploads)
        if (uploadMode === 'direct' && target?.orphanId && !target.isExisting && !target.isFromLibrary) {
            deleteOrphan(target.orphanId);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const picked = Array.from(e.dataTransfer.files ?? []);
        if (!picked.length) return;
        addFiles(picked);
    };

    const prettyExt = (file) => {
        if (!file) return '';

        const url =
            file.isExisting || file.isFromLibrary
                ? file.url
                : file.previewUrl;

        if (!url) return '';

        // Remove query params & hash
        const cleanUrl = url.split('?')[0].split('#')[0];

        // Extract extension (no dot)
        const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);

        return match ? match[1].toLowerCase() : '';
    };

    const isImage = (f) => (f?.file?.type?.startsWith?.('image/') ? true : !!f?.isFromLibrary || !!f?.isExisting);

    const getImageUrl = (f) => {
        if (f.isExisting || f.isFromLibrary) return avatarSrc(f.url);
        return f.previewUrl;
    };

    const hasError = !!generalErrorMessage || Object.keys(specificErrors).length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "bg-card rounded-2xl border shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5",
                hasError ? "border-red-200 dark:border-red-900/50" : "border-slate-100 dark:border-slate-800",
                className
            )}
            dir="rtl"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className={cn("w-[3px] h-4 rounded-full block shrink-0", hasError ? "bg-red-400" : "bg-primary")} />
                <h3 className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
            </div>

            {/* Drop Zone */}
            <div
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 py-7 px-4 text-center",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                )}
            >
                <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={onPick} />

                <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                    isDragging ? "bg-primary/15" : "bg-slate-100 dark:bg-slate-800"
                )}>
                    <UploadCloud className={cn("h-5 w-5", isDragging ? "text-primary" : "text-slate-400")} />
                </div>

                <div>
                    <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{t('uploads.dragHere')}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">{t('uploads.or')} <span className="text-primary font-medium">{t('uploads.attach')}</span></p>
                </div>
            </div>

            {generalErrorMessage && (
                <p className="mt-2 text-[11px] font-medium text-red-500 text-right">{generalErrorMessage}</p>
            )}

            {/* File List */}
            {(files ?? []).filter(Boolean).length > 0 && (
                <div className="mt-3 space-y-2">
                    {(files ?? []).filter(Boolean).map((f) => {
                        const fileError = specificErrors[f.id];
                        return (
                            <div
                                key={f.id}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl border p-2.5 transition-all",
                                    fileError
                                        ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/10"
                                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:border-slate-200 dark:hover:border-slate-700"
                                )}
                            >
                                {/* Thumbnail */}
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                                    {isImage(f) && getImageUrl(f) ? (
                                        <img src={getImageUrl(f)} alt={f?.file?.name || 'image'} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {f?.file?.type?.includes?.('image') ? <ImageIcon className="h-4 w-4 text-slate-400" /> : <FileText className="h-4 w-4 text-slate-400" />}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                                        {f.isExisting ? t('uploads.existingImage') : f.isFromLibrary ? t('uploads.fromLibrary') : (f?.file?.name || '').slice(0, 24)}
                                    </p>
                                    {fileError ? (
                                        <p className="text-[11px] text-red-500 font-medium">{fileError}</p>
                                    ) : f.uploadStatus === 'uploading' ? (
                                        <p className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Uploading...
                                        </p>
                                    ) : f.uploadStatus === 'error' ? (
                                        <p className="text-[11px] text-red-500 font-medium">Upload failed</p>
                                    ) : (
                                        <p className="text-[11px] text-slate-400">
                                            {f.isFromLibrary || f.isExisting ? t('uploads.fromLibrary') : `${((f?.file?.size || 0) / 1024).toFixed(1)} KB`}
                                        </p>
                                    )}
                                </div>

                                {/* Type badge */}
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/8 text-primary border border-primary/15 shrink-0 font-[Inter]  uppercase">
                                    {prettyExt(f || 'IMG')}
                                </span>

                                {/* Remove */}
                                <button
                                    type="button"
                                    onClick={() => removeFile(f.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-100 dark:hover:border-red-900/50 transition-all shrink-0"
                                    aria-label={t('uploads.remove')}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
