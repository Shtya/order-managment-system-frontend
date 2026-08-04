"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { 
  ImagePlus, 
  FileText, 
  X, 
  ClipboardPaste, 
  Film,
  FileSpreadsheet,
  File
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  MAX_FILES_PER_MSG,
  isImageMime,
  isVideoMime,
  validateFileSize,
  validateMime,
} from "@/constants/support-ticket";

// Shared accent palette aligned with the message bubble design
const accentColors = {
  rose: { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100/60 dark:bg-rose-950/20", border: "border-rose-200/50" },
  blue: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100/60 dark:bg-blue-950/20", border: "border-blue-200/50" },
  emerald: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100/60 dark:bg-emerald-950/20", border: "border-emerald-200/50" },
  slate: { text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100/60 dark:bg-slate-800/40", border: "border-slate-200/50" },
  purple: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100/60 dark:bg-purple-950/20", border: "border-purple-200/50" },
  amber: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100/60 dark:bg-amber-950/20", border: "border-amber-200/50" },
};

// Extracts theme based on standard browser file.type
function getFileTheme(file) {
  const type = file.type || "";
  if (type.includes("pdf")) return { icon: File, color: "rose" };
  if (type.includes("word") || type.includes("document")) return { icon: FileText, color: "blue" };
  if (type.includes("excel") || type.includes("sheet") || type.includes("csv")) return { icon: FileSpreadsheet, color: "emerald" };
  if (type.includes("video")) return { icon: Film, color: "purple" };
  if (type.includes("image")) return { icon: ImagePlus, color: "amber" };
  return { icon: FileText, color: "slate" };
}

export default function AttachmentUploader({ files = [], onChange, disabled }) {
  const t = useTranslations("supportTickets");
  const inputRef = useRef(null);

  const [previews, setPreviews] = useState({});

  // Blob URL management for images
  useEffect(() => {
    const map = {};
    const urls = [];
    files.forEach((file, i) => {
      if (isImageMime(file.type)) {
        const url = URL.createObjectURL(file);
        map[i] = url;
        urls.push(url);
      }
    });
    setPreviews(map);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = useCallback(
    (incoming) => {
      const valid = [];
      for (const file of incoming) {
        if (valid.length + files.length >= MAX_FILES_PER_MSG) {
          toast.error(t("validation.maxFiles"));
          break;
        }
        if (!validateMime(file)) {
          toast.error(t("validation.unsupportedFileType"));
          continue;
        }
        if (!validateFileSize(file)) {
          toast.error(t("validation.fileTooLarge"));
          continue;
        }
        valid.push(file);
      }
      if (valid.length) onChange?.([...files, ...valid]);
    },
    [files, onChange, t],
  );

  const handleChange = (e) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  useEffect(() => {
    if (disabled) return;
    const onPaste = (e) => {
      const items = e.clipboardData?.items || [];
      const filesFromClipboard = [];
      for (const item of items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) filesFromClipboard.push(f);
        }
      }
      if (filesFromClipboard.length) addFiles(filesFromClipboard);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [disabled, addFiles]);

  const remove = (index) => onChange?.(files.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        disabled={disabled}
        accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
        onChange={handleChange}
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {files.map((file, i) => {
            const isImg = isImageMime(file.type);
            const themeData = getFileTheme(file);
            const theme = accentColors[themeData.color];
            const ext = file.name.split('.').pop()?.toUpperCase() || "";

            return (
              <div
                key={`${file.name}-${i}`}
                className="group relative flex items-center gap-3 p-1.5 pe-2 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xs shadow-xs hover:shadow-sm transition-all duration-200 w-full max-w-[280px]"
              >
                {/* Media Container (44x44px) */}
                <div className={cn("relative w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border shadow-xs overflow-hidden", theme.border, theme.bg)}>
                  {isImg && previews[i] ? (
                    <img
                      src={previews[i]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <themeData.icon className={cn("w-5 h-5", theme.text)} />
                  )}
                </div>

                {/* File Information */}
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="text-xs font-bold text-foreground truncate pe-2" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground/80 mt-0.5 flex items-center gap-1.5">
                    <span className={cn("inline-flex w-1.5 h-1.5 rounded-full", theme.text.replace("text-", "bg-").split(' ')[0])} />
                    {(file.size / 1024 / 1024).toFixed(2)} MB 
                    <span className="opacity-50">·</span> 
                    <span className="tracking-wide">{ext}</span>
                  </p>
                </div>

                {/* Modern Remove Action */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(i)}
                  className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t("actions.remove") || "Remove"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modernized Dropzone/Trigger */}
      <button
        type="button"
        disabled={disabled || files.length >= MAX_FILES_PER_MSG}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "w-full relative group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-6 transition-all duration-200",
          "hover:bg-muted/50 hover:border-primary/40 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted/20 disabled:hover:border-border/60"
        )}
      >
        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-xs border border-border/50 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-105">
          <ImagePlus className="w-4 h-4" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {t("form.attachDrop")}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <ClipboardPaste className="w-3.5 h-3.5" />
            {t("form.orPaste")}
          </p>
        </div>
      </button>
    </div>
  );
}