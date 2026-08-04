"use client";

import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import {
  FileText,
  Film,
  Download,
  Eye,
  Lock,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Play,
  FileSpreadsheet,
  File,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { isImageMime, isVideoMime } from "@/constants/support-ticket";
import { avatarSrc } from "@/components/atoms/UserSelect";

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 || v >= 10 ? 0 : 1)} ${units[i]}`;
}

function extensionOf(name) {
  if (!name) return "";
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toUpperCase() : "";
}

function isPdfMime(mime) {
  return (mime || "").toLowerCase() === "application/pdf";
}
function isWordMime(mime) {
  const m = (mime || "").toLowerCase();
  return (
    m === "application/msword" ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
function isExcelMime(mime) {
  const m = (mime || "").toLowerCase();
  return (
    m === "application/vnd.ms-excel" ||
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}
function isTextMime(mime) {
  const m = (mime || "").toLowerCase();
  return m === "text/plain" || m === "text/csv";
}

// Maps MIME types to pure data (Icon and accent color name)
// This avoids mixing large class strings and allows for subtle styling.
const mimeDataMap = {
  pdf: { icon: File, color: "rose" },
  word: { icon: FileText, color: "blue" },
  excel: { icon: FileSpreadsheet, color: "emerald" },
  text: { icon: FileText, color: "slate" },
  video: { icon: Film, color: "purple" },
  image: { icon: ImageIcon, color: "amber" },
  fallback: { icon: FileText, color: "slate" }
};

function getMimeData(mime) {
  if (isPdfMime(mime)) return mimeDataMap.pdf;
  if (isWordMime(mime)) return mimeDataMap.word;
  if (isExcelMime(mime)) return mimeDataMap.excel;
  if (isTextMime(mime)) return mimeDataMap.text;
  if (isVideoMime(mime)) return mimeDataMap.video;
  if (isImageMime(mime)) return mimeDataMap.image;
  return mimeDataMap.fallback;
}

const accentColors = {
  rose: { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100/60 dark:bg-rose-950/20", chip: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300" },
  blue: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100/60 dark:bg-blue-950/20", chip: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  emerald: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100/60 dark:bg-emerald-950/20", chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  slate: { text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100/60 dark:bg-slate-800/40", chip: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  purple: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100/60 dark:bg-purple-950/20", chip: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  amber: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100/60 dark:bg-amber-950/20", chip: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
}

/* =========================================================
 * Attachment pill (slim glassmorphic row)
 * ======================================================= */
function AttachmentPill({ att, t, onPreview, onDownload, isOwn, showInternal }) {
  const [busy, setBusy] = useState(null);
  const mimeData = getMimeData(att.mimeType);
  const ext = extensionOf(att.originalName);
  const size = formatBytes(att.size);
  const thumb = avatarSrc(att.thumbnailUrl || att.url);
  const isImg = isImageMime(att.mimeType);
  const isVid = isVideoMime(att.mimeType);

  const handlePreview = async () => {
    if (busy) return;
    setBusy("preview");
    try {
      await onPreview?.(att.id);
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    if (busy) return;
    setBusy("download");
    try {
      await onDownload?.(att.id, att.originalName);
    } finally {
      setBusy(null);
    }
  };

  const pillDisabled = !!busy;
  const theme = accentColors[mimeData.color];

  return (
    <div
      className={cn(
        "group/pill relative flex items-center gap-2.5 rounded-2xl border backdrop-blur-xs transition-all duration-200 w-full max-w-[320px]",
        // Color alignment: Inherit style cues from bubble type
        isOwn ? "border-primary/20 bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))]" : "border-border/50 bg-muted/60",
        showInternal && "border-purple-200/60 bg-purple-100/50 dark:border-purple-800/60 dark:bg-purple-950/40",
        // Interactive styles
        "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        "p-1.5 pe-1 ms-1" // Cleaner layout
      )}
    >
      {/* Media container (avatar block) */}
      <div className={cn("relative w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border shadow-xs transition-colors", isOwn ? "border-primary/10" : "border-border/40")}>
        {isImg && thumb ? (
          <img src={thumb} alt={att.originalName} loading="lazy" className="w-full h-full object-cover rounded-xl" />
        ) : isVid ? (
          <div className={cn("w-full h-full rounded-xl flex items-center justify-center transition-colors", theme.bg)}>
            <Film className={cn("w-5 h-5", theme.text)} />
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-6 h-6 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-sm">
                <Play className="w-3 h-3 ms-0.5 fill-slate-900" />
              </span>
            </span>
          </div>
        ) : (
          <div className={cn("w-full h-full rounded-xl flex items-center justify-center transition-colors", theme.bg)}>
            <mimeData.icon className={cn("w-5 h-5", theme.text)} />
          </div>
        )}
      </div>

      {/* Extension chip (subtle highlight) */}
      {ext && (
        <span className={cn("absolute -top-1.5 start-10 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide shadow-xs z-10", theme.chip, isOwn ? "border border-primary/10" : "border border-border/40")}>
          {ext}
        </span>
      )}

      {/* Middle info block: name · size */}
      <div className="min-w-0 flex-1 py-1 pe-1.5 ms-1">
        <button
          type="button"
          onClick={handlePreview}
          disabled={pillDisabled}
          className="block text-start w-full min-w-0 text-left disabled:cursor-not-allowed disabled:opacity-60"
          title={att.originalName}
        >
          <p className="text-xs font-bold text-foreground truncate group-hover/pill:text-primary transition-colors">
            {att.originalName}
          </p>
        </button>
        <p className="text-[10px] text-muted-foreground/90 mt-0.5 flex items-center gap-1.5">
          <span className={cn("inline-flex w-1.5 h-1.5 rounded-full transition-colors", isOwn ? theme.text.replace("text-", "bg-") : "bg-muted-foreground")} />
          {size || ext}
        </p>
      </div>

      {/* Action buttons (refined design) */}
      <div className="flex items-center gap-0.5 pe-1 flex-shrink-0">
        <button
          type="button"
          title={t("actions.preview")}
          onClick={handlePreview}
          disabled={pillDisabled}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "preview" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          title={t("actions.download")}
          onClick={handleDownload}
          disabled={pillDisabled}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "download" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function MessageBubble({
  message,
  scope = "tenant",
  currentUserId,
  onPreview,
  onDownload,
}) {
  const t = useTranslations("supportTickets");
  const format = useFormatter();
  
  if (!message) return null;

  const isOwn =
    currentUserId && message.senderId
      ? String(message.senderId) === String(currentUserId)
      : false;
  const showInternal =
    scope === "admin" && message.isInternalNote && !message.isDeleted;

  if (message.isDeleted) {
    return (
      <div
        className={cn(
          "flex gap-3 items-center my-1.5",
          isOwn ? "flex-row" : "flex-row-reverse"
        )}
      >
        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl border border-dashed border-border/80 bg-muted/20 text-xs text-muted-foreground italic flex items-center gap-2 backdrop-blur-xs">
          <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
          {t("chat.deleted")}
        </div>
      </div>
    );
  }

  const time = message.created_at
    ? format.dateTime(new Date(message.created_at), {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <div
      className={cn(
        "flex gap-3 items-start my-2 group",
        isOwn ? "flex-row justify-start" : "flex-row-reverse justify-start"
      )}
    >
      {/* Sender Avatar */}
      <Avatar className="w-9 h-9 flex-shrink-0 mt-0.5 ring-2 ring-background border border-border/40 shadow-xs">
        {message.sender?.image ? (
          <AvatarImage
            src={avatarSrc(message.sender.image)}
            alt={message.sender.name}
          />
        ) : (
          <AvatarFallback className="text-[10px] font-extrabold bg-muted/80 text-foreground">
            {initials(message.sender?.name)}
          </AvatarFallback>
        )}
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[82%] min-w-0",
          isOwn ? "items-start" : "items-end"
        )}
      >
        {/* Header Information Row */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] px-1 text-muted-foreground">
          <span className="text-xs font-bold text-foreground">
            {message.sender?.name || t("chat.you")}
          </span>

          {message.isInternalNote && !message.isDeleted && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 rounded-full h-5 px-2 font-medium text-[10px]"
            >
              <Lock className="w-2.5 h-2.5 me-1" />
              {t("chat.internal")}
            </Badge>
          )}

          {/* {message.isInitialMessage && (
            <Badge
              variant="secondary"
              className="text-[10px] rounded-full h-5 px-2 font-medium bg-muted/80"
            >
              {t("chat.initialMessage")}
            </Badge>
          )} */}

          {!isOwn && message.isSupportMessage && (
            <Badge
              variant="outline"
              className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20 rounded-full h-5 px-2 font-medium text-[10px]"
            >
              {t("chat.supportTeam") || "فريق الدعم"}
            </Badge>
          )}

          {time && (
            <span className="ms-auto shrink-0 text-[10px] text-muted-foreground/70 font-medium">
              {time}
            </span>
          )}

          {message.isEdited && !message.isDeleted && (
            <span className="text-[10px] text-muted-foreground/70">
              · {t("chat.edited")}
            </span>
          )}
        </div>

        {/* Message Bubble Body */}
        {message.message ? (<div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-xs border transition-colors duration-200 backdrop-blur-md relative",
            isOwn
              ? "bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 text-foreground rounded-tr-xs"
              : "bg-teal-500/10 dark:bg-teal-950/20 border-teal-500/20 text-foreground rounded-tl-xs",
            showInternal &&
              "bg-amber-500/10 border-amber-500/20 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100"
          )}
        >
          {message.isDeleted ? (
            <div className="inline-flex items-center gap-1.5 text-muted-foreground italic text-xs">
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("chat.deleted")}</span>
            </div>
          ) : (
            <>
              {message.message && (
                <p className="text-foreground/95 leading-relaxed">
                  {message.message || "—"}
                </p>
              )}
            </>
          )}
        </div>) : null}

        {/* Attachments Row outside bubble */}
        {!message.isDeleted && message.attachments?.length > 0 && (
          <div className="mt-1.5 space-y-1.5 w-full max-w-[320px]">
            {message.attachments.map((att) => (
              <AttachmentPill
                key={att.id}
                att={att}
                t={t}
                onPreview={onPreview}
                onDownload={onDownload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}