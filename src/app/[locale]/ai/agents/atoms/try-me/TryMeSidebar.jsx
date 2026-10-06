"use client";

import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import toast from "react-hot-toast";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  MapPin,
  Maximize2,
  Mic,
  Minimize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Smile,
  Sparkles,
  Trash2,
  User,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  formatText,
  getMediaUrlWithCache,
  WHATSAPP_DOCUMENT_ACCEPT,
  WHATSAPP_IMAGE_ACCEPT,
  WHATSAPP_VIDEO_ACCEPT,
} from "@/utils/whatsapp-healper";
import TemplatePreview from "@/app/[locale]/whatsapp/atoms/TemplatePreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";
import {
  TRY_ME_CAPTION_LIMIT,
  TRY_ME_MAX_FILE_MB,
  TRY_ME_TEXT_LIMIT,
  TRY_ME_VOICE_SECONDS,
} from "./useTryMe";
import { useRef, useState, useMemo, useEffect, useCallback  } from "react";
import dynamic from "next/dynamic";
import { reverseGeocode } from "@/utils/geo";

const MapLocationPicker = dynamic(() => import("@/components/atoms/MapLocationPicker"), {
  ssr: false,
});

function AiIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
    </svg>
  );
}

function formatAudioTime(seconds) {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const TRY_ME_STARTER_QUESTIONS = {
  new: [
    { emoji: "🕒", ar: "مواعيد الشغل عندكم إيه؟", en: "What are your working hours?" },
    { emoji: "🚚", ar: "الشحن بكام وبيوصل في قد إيه؟", en: "How much is shipping, and how long does delivery take?" },
    { emoji: "⌚", ar: "عندكم ساعات يد؟", en: "Do you have wristwatches?" },
  ],
  real: [
    { emoji: "🧾", ar: "آخر طلب ليا كان إيه؟", en: "What was my last order?" },
    { emoji: "🔢", ar: "أنا عملت كام طلب لحد دلوقتي؟", en: "How many orders have I placed so far?" },
    { emoji: "🚚", ar: "الشحن بكام وبيوصل في قد إيه؟", en: "How much is shipping, and how long does delivery take?" },
  ],
};

const TRY_ME_AVATAR_COLORS = [
  ["#ece8ff", "#5a49a6"],
  ["#dff3ec", "#0d7a5f"],
  ["#ffe9df", "#b5532a"],
  ["#e2effe", "#2a62b5"],
  ["#fde6f0", "#b52a68"],
  ["#fff2cc", "#8a6a00"],
];

function clientPhone(client) {
  return client?.phoneNumber || client?.primaryContact?.phoneNumber || "";
}

function clientInitial(client) {
  const name = String(client?.name || clientPhone(client) || "?").trim();
  return [...name][0] || "?";
}

function ClientAvatar({ client, size = "md" }) {
  const colors = TRY_ME_AVATAR_COLORS[(String(client?.id || "").charCodeAt(0) || 0) % TRY_ME_AVATAR_COLORS.length];
  const dim = size === "sm" ? "w-7 h-7 text-[13px]" : "w-8 h-8 text-sm";
  return (
    <span
      className={cn("rounded-full grid place-items-center font-bold shrink-0", dim)}
      style={{ background: colors[0], color: colors[1] }}
    >
      {clientInitial(client)}
    </span>
  );
}

function isArabicText(value, locale) {
  if(!value) {
    return locale === "ar";
  }
  return /[\u0600-\u06FF]/.test(value || "");
}

function messageDir(message, locale) {
  const text =
    message.content?.text?.body ||
    message.content?.body ||
    message.content?.caption ||
    message.content?.image?.caption ||
    message.content?.video?.caption ||
    message.content?.document?.caption ||
    message.content?.interactive?.body?.text ||
    "";
  return isArabicText(String(text), locale) ? "rtl" : "ltr";
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusIcon({ status }) {
  if (status === "uploading") return <Loader2 className="w-3 h-3 animate-spin opacity-80" />;
  if (status === "pending") return <Loader2 className="w-3 h-3 animate-pulse opacity-80" />;
  if (status === "failed") return <AlertCircle className="w-3.5 h-3.5 text-red-200" />;
  return <Check className="w-3.5 h-3.5 opacity-80" />;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-0.5 py-1">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-[#9aa3b2] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function TryMeBubble({ message, agentName, onRetry, onChoice, onRequestLocation, onMediaOpen, t }) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const isUser = message.role === "user";
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const formattedBody = useMemo(() => {
    const body = message.content?.text?.body || message.content?.body || "";
    return formatText(body);
  }, [message.content?.text?.body, message.content?.body]);

  const caption =
    message.content?.caption ||
    message.content?.image?.caption ||
    message.content?.video?.caption ||
    message.content?.document?.caption ||
    "";
  const formattedCaption = useMemo(() => formatText(caption || ""), [caption]);
  const dir = messageDir(message, locale);
  const openMedia = (type, mediaContent) => {
    const url = getMediaUrlWithCache(mediaContent, type, message);
    if (!url) return;
    onMediaOpen?.({
      type,
      url,
      name: mediaContent?.[type]?.filename || mediaContent?.[type]?.name || "",
    });
  };
  const time = message.createdAt ? format(new Date(message.createdAt), "hh:mm a") : "";

  useEffect(() => {
    const handler = (event) => {
      if (event.detail !== message.id && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener("tryme:audio-play", handler);
    return () => window.removeEventListener("tryme:audio-play", handler);
  }, [message.id]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent("tryme:audio-play", { detail: message.id }));
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration || message.content?.audio?.duration || 0;
    setCurrentTime(audioRef.current.currentTime);
    if (duration > 0) {
      setAudioProgress((audioRef.current.currentTime / duration) * 100);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !progressRef.current) return;
    const duration = audioRef.current.duration || message.content?.audio?.duration || 0;
    if (duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clicked = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = clicked * duration;
    setAudioProgress(clicked * 100);
  };

  const renderMedia = (type, mediaContent, isHeader = false) => {
    switch (type) {
      case "image":
      case "sticker":
        return (
          <div className={cn("space-y-2", !isHeader && "max-w-sm")}>
            <div
              className={cn(
                "relative w-full flex items-center justify-center rounded-lg overflow-hidden",
                (mediaLoading || mediaError) && "min-w-[120px] min-h-[120px]",
              )}
            >
              {(mediaLoading || message.status === "uploading") && !mediaError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/10 backdrop-blur-[2px]">
                  <Loader2 className="w-6 h-6 animate-spin opacity-70" />
                  {message.status === "uploading" && (
                    <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">
                      {t("tryMe.uploading")}
                    </span>
                  )}
                </div>
              )}
              {mediaError ? (
                <div className="flex flex-col items-center gap-2 p-6 opacity-70">
                  <AlertCircle size={28} />
                  <span className="text-xs">{t("tryMe.failedToLoadImage")}</span>
                </div>
              ) : (
                <img
                  src={getMediaUrlWithCache(mediaContent, type, message)}
                  alt={type}
                  className={cn(
                    type === "sticker" ? "w-40 h-40 object-contain" : "rounded-lg w-full h-auto",
                    "cursor-pointer transition-opacity",
                    mediaLoading && message.status !== "uploading" ? "opacity-0" : "opacity-100",
                  )}
                  onLoad={() => setMediaLoading(false)}
                  onError={() => {
                    setMediaLoading(false);
                    setMediaError(true);
                  }}
                  onClick={() => openMedia(type, mediaContent)}
                />
              )}
            </div>
            {!isHeader && formattedCaption ? (
              <p className="text-sm whitespace-pre-wrap">{formattedCaption}</p>
            ) : null}
          </div>
        );
      case "video":
        return (
          <div className={cn("space-y-2", !isHeader && "max-w-sm")}>
            <div className="relative w-full min-h-[160px] flex items-center justify-center rounded-lg overflow-hidden bg-black/10">
              {(mediaLoading || message.status === "uploading") && !mediaError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 animate-spin opacity-70" />
                  {message.status === "uploading" && (
                    <span className="text-[10px] font-bold mt-2 uppercase">{t("tryMe.uploading")}</span>
                  )}
                </div>
              )}
              {mediaError ? (
                <div className="flex flex-col items-center gap-2 p-6 opacity-70">
                  <AlertCircle size={28} />
                  <span className="text-xs">{t("tryMe.failedToLoadVideo")}</span>
                </div>
              ) : (
                <>
                <video
                  src={getMediaUrlWithCache(mediaContent, "video", message)}
                  controls
                  className={cn(
                    "rounded-lg w-full h-auto",
                    mediaLoading && message.status !== "uploading" ? "opacity-0" : "opacity-100",
                  )}
                  onLoadedData={() => setMediaLoading(false)}
                  onError={() => {
                    setMediaLoading(false);
                    setMediaError(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => openMedia("video", mediaContent)}
                  className="absolute top-2 end-2 p-1.5 rounded-full bg-black/50 text-white cursor-pointer"
                  title={t("tryMe.preview")}
                >
                  <Maximize2 size={14} />
                </button>
                </>
              )}
            </div>
            {!isHeader && formattedCaption ? (
              <p className="text-sm whitespace-pre-wrap">{formattedCaption}</p>
            ) : null}
          </div>
        );
      case "document": {
        const doc = mediaContent.document || {};
        return (
          <div className="space-y-2">
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg relative overflow-hidden",
                isUser ? "bg-white/15" : "bg-white border border-[#e3e5ea]",
              )}
            >
              {message.status === "uploading" && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => openMedia("document", mediaContent)}
                className="flex items-center gap-3 flex-1 text-start"
              >
                <FileText size={28} className={isUser ? "text-white" : "text-blue-500"} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {doc.filename || doc.name || t("tryMe.document")}
                  </p>
                  <p className="text-[10px] uppercase opacity-70">{doc.mime_type || "FILE"}</p>
                </div>
              </button>
            </div>
            {!isHeader && formattedCaption ? (
              <p className="text-sm whitespace-pre-wrap">{formattedCaption}</p>
            ) : null}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderContent = () => {
    const { messageType, content } = message;
    switch (messageType) {
      case "text":
        return <p className="text-[13px] leading-relaxed whitespace-pre-wrap" dir={dir}>{formattedBody}</p>;
      case "image":
      case "sticker":
      case "video":
      case "document":
        return renderMedia(messageType, content);
      case "location": {
        const loc = content?.location || {};
        const mapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
        return (
          <div className="space-y-2 min-w-[240px]">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="h-32 rounded-lg overflow-hidden relative cursor-pointer group block"
            >
              <img
                src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${loc.longitude},${loc.latitude}&z=13&l=map&size=300,150`}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-muted/30 group-hover:bg-muted/40 transition-colors flex items-center justify-center">
                <MapPin size={32} className="text-destructive drop-shadow-md" />
              </div>
            </a>
            <div className="min-w-0 px-1 pb-1">
              {loc.name ? <p className="text-sm font-bold truncate">{loc.name}</p> : null}
              {loc.address ? <p className="text-[11px] opacity-80 line-clamp-1">{loc.address}</p> : null}
            </div>
          </div>
        );
      }
      case "audio":
        return (
          <div className="flex items-center gap-3 py-1 min-w-[200px]">
            <audio
              ref={audioRef}
              src={getMediaUrlWithCache(content, "audio", message)}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={() => {
                setIsPlaying(false);
                setAudioProgress(0);
              }}
              onCanPlayThrough={() => setAudioLoading(false)}
              onError={() => {
                setAudioLoading(false);
                setAudioError(true);
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={toggleAudio}
              disabled={audioLoading || audioError}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isUser ? "bg-white text-[#6763AF]" : "bg-[#6763AF] text-white",
              )}
            >
              {audioLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : audioError ? (
                <AlertCircle size={16} />
              ) : isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className={locale === "ar" ? "mr-0.5" : "ml-0.5"} />
              )}
            </button>
            <div className="flex-1 space-y-1">
              <div
                ref={progressRef}
                onClick={!audioLoading && !audioError ? handleSeek : undefined}
                className={cn("relative h-1 rounded-full", isUser ? "bg-white/30" : "bg-black/15")}
              >
                <div
                  className={cn("absolute inset-y-0 start-0 rounded-full", isUser ? "bg-white" : "bg-[#6763AF]")}
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] opacity-80">
                <span>
                  {audioError
                    ? t("tryMe.failedToLoadAudio")
                    : formatAudioTime(isPlaying ? currentTime : content.audio?.duration || 0)}
                </span>
                <Mic size={12} />
              </div>
            </div>
          </div>
        );
      case "interactive": {
        const interactive = content.interactive || {};
        const kind = String(interactive.type || "").toLowerCase().replace(/_/g, "");
        const usedActionIds = message.usedActionIds || [];
        const handleSelect = (payload) => {
          if (payload?.type === "LOCATION_REQUEST") {
            if (usedActionIds.includes("LOCATION_REQUEST")) return;
            onRequestLocation?.(message.id);
            return;
          }
          const title = payload?.title || payload?.description;
          if (!title) return;
          const lockKey = kind === "button" ? String(payload?.id || title) : null;
          if (lockKey && usedActionIds.includes(lockKey)) return;
          onChoice?.(title, message.id, lockKey);
        };
        if (kind === "list") {
          return (
            <div className="space-y-2 " dir={dir}>
              <TemplatePreview
                hasHeader={false}
                isChatBubble
                bgTransparent
                hideToggleAction
                isInteractive
                isList
                accent="tryMe"
                onActionSelect={handleSelect}
                seeAllOptionsLabel={interactive.action?.button}
                template={{
                  headerType: interactive.header?.type?.toUpperCase(),
                  headerText: interactive.header?.text,
                  bodyText: interactive.body?.text,
                  footerText: interactive.footer?.text,
                  sections: interactive.action?.sections,
                }}
              />
            </div>
          );
        }
        if (kind === "button") {
          const media = interactive.header?.[interactive.header?.type];
          return (
            <div className="space-y-2 " dir={dir}>
              <TemplatePreview
                hasHeader={false}
                isChatBubble
                bgTransparent
                hideToggleAction
                isInteractive
                accent="tryMe"
                disabledActionIds={usedActionIds}
                onActionSelect={handleSelect}
                template={{
                  headerType: interactive.header?.type?.toUpperCase(),
                  headerText: interactive.header?.text,
                  headerUrl: media?.link || media?.id,
                  bodyText: interactive.body?.text,
                  footerText: interactive.footer?.text,
                  buttons: interactive.action?.buttons?.map((btn) => ({
                    type: "QUICK_REPLY",
                    id: btn?.reply?.id,
                    text: btn?.reply?.title,
                  })),
                }}
              />
            </div>
          );
        }
        if (kind === "locationrequestmessage") {
          return (
            <div className="space-y-2 " dir={dir}>
              <TemplatePreview
                isChatBubble
                bgTransparent
                hideToggleAction
                hasHeader={false}
                isInteractive
                accent="tryMe"
                disabledActionIds={usedActionIds}
                onActionSelect={handleSelect}
                template={{
                  bodyText: interactive?.body?.text,
                  buttons: [
                    {
                      type: "LOCATION_REQUEST",
                      id: "LOCATION_REQUEST",
                      textEn: "Send Location",
                      textAr: "إرسال الموقع",
                    },
                  ],
                }}
              />
            </div>
          );
        }
        return <p className="text-sm" dir={dir}>{interactive.body?.text}</p>;
      }
      case "template":
        return (
          <div className="space-y-2 ">
            <TemplatePreview
              isChatBubble
              bgTransparent
              hideToggleAction
              hasHeader={false}
              isUploading={message.status === "uploading"}
              template={message.metadata?.template?.templateConfig || { bodyText: message.content?.template?.name }}
            />
          </div>
        );
      default:
        return (
          <p className="text-xs italic opacity-70">
            [{messageType} {t("tryMe.unsupported")}]
          </p>
        );
    }
  };

  const bubble = (
    <div
      dir={dir}
      className={cn(
        "max-w-[82%] px-3 py-2.5 text-[13px] leading-relaxed shadow-sm relative",
        isUser
          ? `bg-[#6763AF] text-white rounded-[0.75rem] ${isArabic ? "rounded-tl-[4px]" : "rounded-tr-[4px]"}`
          : `bg-[#f0f1f3] text-[#26333e] dark:bg-muted dark:text-foreground rounded-[0.75rem] ${isArabic ? "rounded-tr-[4px]" : "rounded-tl-[4px]"}`,
      )}
    >
      {renderContent()}
      {message.status === "failed" && (
        <div className="mt-2 space-y-2">
          <div className={cn("flex items-start gap-2 p-2 rounded-lg text-xs", isUser ? "bg-black/20" : "bg-destructive/10 text-destructive")}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message.error || t("tryMe.sendFailed")}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className={cn(
                "flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-bold",
                isUser ? "bg-white/15" : "bg-card border border-destructive/20 text-destructive",
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("tryMe.retry")}
            </button>
          )}
        </div>
      )}
      <div className={cn("mt-1 flex items-center gap-1 text-[10px]", isUser ? "justify-end text-white/80" : "justify-start text-[#778394]")}>
        {isUser && <StatusIcon status={message.status} />}
        <span>{time}</span>
      </div>
      {!!message.reactions?.length && (
        <div
          className={cn(
            "absolute -bottom-3 flex items-center gap-0.5 bg-card border border-border rounded-full shadow-sm px-1.5 py-0.5 z-10",
            isUser ? "end-2" : "start-2",
          )}
        >
          {message.reactions.map((row, idx) => (
            <span key={idx} className="text-xs">
              {row.emoji || row}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (isUser) {
    return <div className="flex justify-end mb-4 relative">{bubble}</div>;
  }

  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="w-[30px] h-[30px] rounded-full shrink-0 mt-0.5 grid place-items-center text-white bg-gradient-to-br from-[#5750a0] to-[#7672B9] shadow-sm">
        <AiIcon className="w-4 h-4" />
      </div>
      <div className="min-w-0 max-w-[calc(100%-38px)]">
        <div className="text-[11px] text-[#637187] font-medium mb-1 ms-0.5">{agentName}</div>
        {bubble}
      </div>
    </div>
  );
}

function TryMeContextBar({
  mode,
  onModeChange,
  customer,
  stats,
  statsLoading,
  onSelectClient,
  sheetOpen,
  setSheetOpen,
  infoOpen,
  setInfoOpen,
  locale,
}) {
  const t = useTranslations("agents");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const isReal = mode === "real";
  const hasClient = isReal && !!customer;

  useEffect(() => {
    // if (!sheetOpen || !isReal) return undefined;
    let cancelled = false;
    setLoading(true);
    setRows([]);
    const handle = setTimeout(async () => {
      try {
        const res = await api.get("/clients/list", {
          params: { search: search || undefined, limit: 12, hasPhone: true, resolvePhones: true },
        });
        if (cancelled) return;
        setRows(res.data?.data || []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search]);

  useEffect(() => {
    if (sheetOpen && isReal) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [sheetOpen, isReal]);

  useEffect(() => {
    if (!sheetOpen && !infoOpen) return undefined;
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setSheetOpen(false);
        setInfoOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [sheetOpen, infoOpen, setInfoOpen, setSheetOpen]);

  const closeSheet = () => setSheetOpen(false);
  const closeInfo = () => setInfoOpen(false);

  const pick = (row) => {
    onSelectClient(row);
    closeSheet();
  };

  const lastOrder = stats?.lastOrder;

  return (
    <section ref={rootRef} className="relative px-3 py-2 bg-white dark:bg-background border-b border-[#e7e4f1] dark:border-border">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={sheetOpen}
          onClick={() => {
            closeInfo();
            setSheetOpen((open) => !open);
          }}
          className={cn(
            "flex-1 min-w-0 flex items-center gap-2.5 text-start px-2 py-1.5 rounded-xl border transition-colors",
            "bg-[#f6f5fa] dark:bg-muted border-[#e7e4f1] dark:border-border hover:border-[#7867c7]",
            sheetOpen && "border-[#7867c7] shadow-[0_0_0_3px_#efecfa]",
            isReal && !customer && "border-dashed border-[#7867c7] bg-[#efecfa] dark:bg-[#2a2548]",
          )}
        >
          {hasClient ? (
            <ClientAvatar client={customer} size="sm" />
          ) : (
            <span
              className={cn(
                "w-7 h-7 rounded-full grid place-items-center shrink-0",
                isReal ? "bg-white text-[#7867c7] border-[1.5px] border-dashed border-[#7867c7]" : "bg-[#efecfa] text-[#5a49a6]",
              )}
            >
              <User size={14} />
            </span>
          )}
          <span className="flex-1 min-w-0 flex flex-col leading-tight">
            <span className="text-[11px] text-[#6c6981]">{t("tryMe.testingAs")}</span>
            <span className="font-semibold text-sm truncate text-[#1f1c2e] dark:text-foreground">
              {hasClient ? (
                <>
                  {customer.name || t("tryMe.currentCustomer")}
                  {clientPhone(customer) ? (
                    <small className="font-normal text-[#6c6981] ms-1.5" dir="ltr">
                      {clientPhone(customer)}
                    </small>
                  ) : null}
                </>
              ) : isReal ? (
                <span className="text-[#3d3178]">{t("tryMe.pickCurrentCustomer")}</span>
              ) : (
                t("tryMe.newCustomer")
              )}
            </span>
          </span>
          {(mode === "new" || hasClient) && (
            <span className="text-xs font-semibold text-[#3d3178] shrink-0">{t("tryMe.change")}</span>
          )}
          <ChevronDown size={16} className="shrink-0 text-[#6c6981]" />
        </button>

        {hasClient && (
          <button
            type="button"
            aria-expanded={infoOpen}
            onClick={() => {
              closeSheet();
              setInfoOpen((open) => !open);
            }}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[12.5px] font-semibold",
              "bg-[#e3f5ef] text-[#0d8a6a] border-[#e7e4f1]",
              infoOpen && "border-[#0d8a6a]",
            )}
          >
            <Info size={14} />
            {t("tryMe.customerInfo")}
          </button>
        )}
      </div>

      {sheetOpen && (
        <div className="absolute inset-x-2 top-full z-20 mt-[-2px] grid gap-2.5 p-3.5 rounded-[14px] bg-white dark:bg-card border border-[#e7e4f1] dark:border-border shadow-[0_18px_48px_-12px_rgba(40,30,90,0.28)]">
          <div className="text-xs font-semibold text-[#6c6981]">{t("tryMe.testAs")}</div>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#f6f5fa] dark:bg-muted border border-[#e7e4f1] dark:border-border">
            <button
              type="button"
              role="radio"
              aria-checked={mode === "new"}
              onClick={() => onModeChange("new")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[9px] text-sm font-semibold text-[#6c6981]",
                mode === "new" && "bg-white dark:bg-background text-[#3d3178] shadow-sm",
              )}
            >
              <User size={16} />
              {t("tryMe.newCustomer")}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === "real"}
              onClick={() => onModeChange("real")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[9px] text-sm font-semibold text-[#6c6981]",
                mode === "real" && "bg-white dark:bg-background text-[#0d8a6a] shadow-sm",
              )}
            >
              <Users size={16} />
              {t("tryMe.currentCustomer")}
            </button>
          </div>
          <p className="m-0 text-xs text-[#6c6981] flex gap-1.5 items-start">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>{mode === "new" ? t("tryMe.newCustomerHint") : t("tryMe.currentCustomerHint")}</span>
          </p>

          {isReal && (
            <div className="rounded-xl border border-[#e7e4f1] dark:border-border overflow-hidden">
              <label className="flex items-center gap-2 px-3 text-[#6c6981] border-b border-[#e7e4f1] dark:border-border">
                <Search size={16} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("tryMe.searchCustomers")}
                  className="flex-1 min-w-0 bg-transparent outline-none border-0 py-3 text-sm text-foreground focus-visible:outline-0!"
                />
              </label>
              <ul className="max-h-[220px] overflow-y-auto p-1.5 m-0 list-none">
                {loading ? (
                  <li className="flex justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </li>
                ) : rows.length ? (
                  rows.map((row) => {
                    const selected = customer?.id === row.id;
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          onClick={() => pick(row)}
                          className={cn(
                            "w-full flex items-center gap-2.5 p-2 rounded-[10px] text-start hover:bg-[#efecfa] dark:hover:bg-muted",
                            selected && "bg-[#efecfa] dark:bg-muted",
                          )}
                        >
                          <ClientAvatar client={row} />
                          <span className="flex-1 min-w-0">
                            <span className="block font-semibold leading-tight truncate">{row.name || clientPhone(row)}</span>
                            <span className="block text-xs text-[#6c6981]" dir="ltr">
                              {clientPhone(row)}
                            </span>
                          </span>
                          {selected ? <Check size={16} className="text-[#0d8a6a] shrink-0" /> : null}
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="py-5 px-3 text-center text-[#6c6981] text-sm">
                    {t("tryMe.noCustomerMatch", { query: search || "" })}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {infoOpen && hasClient && (
        <div className="absolute inset-x-2 top-full z-20 mt-[-2px] grid gap-2.5 p-3 rounded-[14px] bg-[#e3f5ef] dark:bg-[#17352c] border border-[#0d8a6a]/25 shadow-[0_18px_48px_-12px_rgba(40,30,90,0.28)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11.5px] text-[#6c6981]">{t("tryMe.customerName")}</div>
              <b className="text-[15px]">{customer.name || t("tryMe.currentCustomer")}</b>
            </div>
            <button type="button" onClick={closeInfo} className="p-1.5 rounded-lg text-[#6c6981] hover:bg-white/70" aria-label={t("tryMe.close")}>
              <X size={16} />
            </button>
          </div>
          {statsLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#0d8a6a]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-background rounded-[10px] px-2.5 py-2">
                <b className="block text-[15px] leading-tight">{stats?.totalOrders ?? 0}</b>
                <span className="text-[11.5px] text-[#6c6981]">{t("tryMe.totalOrders")}</span>
              </div>
              <div className="bg-white dark:bg-background rounded-[10px] px-2.5 py-2">
                <b className="block text-[15px] leading-tight">{lastOrder?.orderNumber || "—"}</b>
                <span className="text-[11.5px] text-[#6c6981]">{t("tryMe.lastOrder")}</span>
                {lastOrder?.status ? (
                  <span className="inline-block mt-0.5 text-[11.5px] font-semibold px-2 rounded-full bg-[#fff3d6] text-[#8a5a00]">
                    {lastOrder.status}
                  </span>
                ) : null}
                {lastOrder?.createdAt ? (
                  <span className="block text-[11px] text-[#6c6981] mt-0.5">
                    {formatDistanceToNow(new Date(lastOrder.createdAt), {
                      addSuffix: true,
                      locale: locale === "ar" ? ar : enUS,
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TryMeEmptyState({ mode, customer, onPickCustomer, onAsk, t, locale }) {
  const questions = TRY_ME_STARTER_QUESTIONS[mode] || TRY_ME_STARTER_QUESTIONS.new;
  if (mode === "real" && !customer) {
    return (
      <div className="m-auto grid gap-4 justify-items-center text-center px-2 py-2">
        <div className="w-16 h-16 rounded-[20px] grid place-items-center text-white bg-gradient-to-br from-[#5a49a6] to-[#7867c7] shadow-[0_10px_24px_-8px_rgba(90,73,166,0.55)]">
          <Sparkles size={30} />
        </div>
        <div>
          <h3 className="m-0 text-[17px] font-semibold leading-snug">{t("tryMe.emptyPickTitle")}</h3>
          <p className="mt-1 mb-0 text-[#6c6981] max-w-[300px] mx-auto">{t("tryMe.emptyPickBody")}</p>
        </div>
        <button
          type="button"
          onClick={onPickCustomer}
          className="inline-flex items-center gap-2 bg-[#5a49a6] text-white rounded-xl py-2.5 px-5 font-semibold"
        >
          <User size={16} />
          {t("tryMe.pickCustomerCta")}
        </button>
      </div>
    );
  }

  return (
    <div className="m-auto grid gap-4 justify-items-center text-center px-2 py-2 w-full">
      <div className="w-16 h-16 rounded-[20px] grid place-items-center text-white bg-gradient-to-br from-[#5a49a6] to-[#7867c7] shadow-[0_10px_24px_-8px_rgba(90,73,166,0.55)]">
        <Sparkles size={30} />
      </div>
      <div>
        <h3 className="m-0 text-[17px] font-semibold leading-snug">
          {mode === "real"
            ? t("tryMe.emptyRealTitle", { name: customer?.name || t("tryMe.currentCustomer") })
            : t("tryMe.emptyNewTitle")}
        </h3>
        <p className="mt-1 mb-0 text-[#6c6981] max-w-[300px] mx-auto">{t("tryMe.emptyBody")}</p>
      </div>
      <div className="w-full text-start rounded-xl border border-[#e7e4f1] dark:border-border bg-[#f6f4fb] dark:bg-muted/40 py-2.5 px-3 flex gap-2.5">
        <Info size={16} className="text-[#7867c7] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold text-[#3d3178] dark:text-foreground">{t("tryMe.questionsOnlyTitle")}</p>
          <p className="mt-0.5 mb-0 text-[12px] leading-snug text-[#6c6981]">{t("tryMe.questionsOnlyBody")}</p>
        </div>
      </div>
      <div className="grid gap-2 w-full">
        {questions.map((item, index) => {
          const text = locale === "ar" ? item.ar : item.en;
          return (
            <button
              key={`${mode}-${index}`}
              type="button"
              onClick={() => onAsk(text)}
              className="w-full text-start bg-white dark:bg-card border border-[#e7e4f1] dark:border-border rounded-xl py-2.5 px-3 flex items-center gap-2.5 hover:border-[#7867c7]"
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.emoji}
              </span>
              <span className="flex-1 text-sm">{text}</span>
              <ArrowRight size={16} className={cn("text-[#7867c7] shrink-0", locale === "ar" && "-scale-x-100")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TryMeComposer({ agent, disabled, placeholder, onSend, t }) {
  const [text, setText] = useState("");
  const locale = useLocale();
  const [showEmoji, setShowEmoji] = useState(false);
  const [pending, setPending] = useState(null);
  const [caption, setCaption] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const [portalEl, setPortalEl] = useState(null);
  const [emojiPos, setEmojiPos] = useState(null);

  useEffect(() => {
    setPortalEl(document.getElementById("try-me-sidebar-root"));
  }, [pending]);

  useEffect(() => {
    if (!showEmoji || !emojiBtnRef.current) {
      setEmojiPos(null);
      return undefined;
    }
    const place = () => {
      const rect = emojiBtnRef.current.getBoundingClientRect();
      const isRtl = locale === "ar";
      setEmojiPos({
        bottom: window.innerHeight - rect.top + 8,
        ...(isRtl
          ? { right: window.innerWidth - rect.right }
          : { left: rect.left }),
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [showEmoji, locale]);
  const fileTypeRef = useRef("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordingTimeRef = useRef(0);

  const acceptFlags = {
    image: !!agent?.acceptImage,
    video: !!agent?.acceptVideo,
    document: !!agent?.acceptDocument,
    audio: !!agent?.acceptAudio,
  };

  const attachActions = [
    acceptFlags.image && { type: "image", icon: ImageIcon, label: t("tryMe.attachImage"), accept: WHATSAPP_IMAGE_ACCEPT },
    acceptFlags.video && { type: "video", icon: Video, label: t("tryMe.attachVideo"), accept: WHATSAPP_VIDEO_ACCEPT },
    acceptFlags.document && { type: "document", icon: FileText, label: t("tryMe.attachDocument"), accept: WHATSAPP_DOCUMENT_ACCEPT },
  ].filter(Boolean);

  const pickFile = (action) => {
    fileTypeRef.current = action.type;
    if (fileInputRef.current) {
      fileInputRef.current.accept = action.accept;
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = null;
    if (!file) return;
    const kind = fileTypeRef.current;
    const maxMb = TRY_ME_MAX_FILE_MB[kind] || 16;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(t("tryMe.fileTooLarge", { size: `${maxMb}MB` }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPending({ file, preview: reader.result, type: kind });
      setCaption("");
    };
    reader.readAsDataURL(file);
  };

  const sendText = () => {
    const value = text.trim();
    if (!value) return;
    if (value.length > TRY_ME_TEXT_LIMIT) {
      toast.error(t("tryMe.textTooLong", { max: TRY_ME_TEXT_LIMIT }));
      return;
    }
    onSend({ text: value });
    setText("");
  };

  const sendPending = () => {
    if (!pending) return;
    if (caption.length > TRY_ME_CAPTION_LIMIT) {
      toast.error(t("tryMe.captionTooLong", { max: TRY_ME_CAPTION_LIMIT }));
      return;
    }
    onSend({
      text: caption.trim(),
      file: pending.file,
      kind: pending.type,
      preview: pending.preview,
    });
    setPending(null);
    setCaption("");
  };

  const startRecording = async () => {
    if (!acceptFlags.audio) {
      toast.error(t("tryMe.mediaNotAccepted"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorderMime =
        ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((type) =>
          MediaRecorder.isTypeSupported(type),
        ) || "";
      const recorder = recorderMime
        ? new MediaRecorder(stream, { mimeType: recorderMime })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerRef.current);
        setIsRecording(false);
        const recordedType =
          recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";
        const mime = recordedType.split(";")[0].trim();
        const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") || mime.includes("m4a") ? "m4a" : "webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        const duration = recordingTimeRef.current;
        if (duration > TRY_ME_VOICE_SECONDS) {
          toast.error(t("tryMe.voiceTooLong"));
          return;
        }
        const maxMb = TRY_ME_MAX_FILE_MB.audio;
        if (blob.size > maxMb * 1024 * 1024) {
          toast.error(t("tryMe.fileTooLarge", { size: `${maxMb}MB` }));
          return;
        }
        const file = new File([blob], `voice.${ext}`, { type: mime });
        const preview = URL.createObjectURL(blob);
        onSend({ file, kind: "audio", preview, duration });
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        if (recordingTimeRef.current >= TRY_ME_VOICE_SECONDS) {
          recorder.stop();
        }
      }, 1000);
    } catch {
      toast.error(t("tryMe.micDenied"));
    }
  };

  const cancelRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        recorder.stream?.getTracks?.().forEach((track) => track.stop());
        setIsRecording(false);
      };
      recorder.stop();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const stopAndSendRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  };

  return (
    <div className="relative p-3 bg-white dark:bg-background">
      {pending && portalEl
        ? createPortal(
            <div className="absolute inset-0 z-40 bg-black/90 flex flex-col text-white">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{t("tryMe.preview")}</span>
                <button type="button" onClick={() => setPending(null)} className="p-1 rounded-full hover:bg-white/10 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 grid place-items-center min-h-0">
                {pending.type === "image" && (
                  <img src={pending.preview} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                )}
                {pending.type === "video" && (
                  <video src={pending.preview} controls className="max-w-full max-h-full rounded-lg shadow-2xl" />
                )}
                {pending.type === "document" && (
                  <div className="flex flex-col items-center gap-6 p-10 bg-white/10 rounded-3xl min-w-[280px]">
                    <FileText size={64} className="opacity-90" />
                    <div className="text-center">
                      <p className="font-semibold truncate max-w-[260px]">{pending.file.name}</p>
                      <p className="text-xs opacity-70 mt-1">{formatFileSize(pending.file.size)}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-black/40 space-y-2">
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, TRY_ME_CAPTION_LIMIT))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendPending();
                    }
                  }}
                  placeholder={t("tryMe.captionPlaceholder")}
                  className="text-sm bg-white text-foreground"
                />
                <div className="flex justify-between items-center text-[10px] text-white/70">
                  <span>
                    {caption.length}/{TRY_ME_CAPTION_LIMIT}
                  </span>
                  <button
                    type="button"
                    onClick={sendPending}
                    className="inline-flex items-center gap-1 text-white font-semibold cursor-pointer"
                  >
                    <Send size={14} /> {t("tryMe.send")}
                  </button>
                </div>
              </div>
            </div>,
            portalEl,
          )
        : null}

      <div
        className={cn(
          "min-h-[84px] rounded-[1.125rem] border border-[#dce3ea] bg-white dark:bg-card px-3 pb-2 shadow-sm",
          isRecording && "flex items-center",
        )}
      >
        {isRecording ? (
          <div className="flex items-center gap-2.5 h-[75px] w-full">
            <button
              type="button"
              onClick={cancelRecording}
              className="w-8 h-8 rounded-full bg-[#f1f3f6] grid place-items-center text-[#61748a]"
            >
              <Trash2 size={16} />
            </button>
            <span className="w-2.5 h-2.5 rounded-full bg-[#e5484d] animate-pulse" />
            <span className="text-sm tabular-nums min-w-9">{formatAudioTime(recordingTime)}</span>
            <div className="flex-1 min-w-0 flex items-end gap-[2px] h-6">
              {Array.from({ length: 42 }).map((_, i) => (
                <i
                  key={i}
                  className="flex-1 min-w-[2px] rounded-sm bg-[#6763AF] animate-pulse"
                  style={{ height: `${6 + ((i * 7) % 16)}px`, animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="w-8 h-8 rounded-full bg-[#6763AF] text-white grid place-items-center"
            >
              <Send size={14} />
            </button>
          </div>
        ) : (
          <>
            <input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, TRY_ME_TEXT_LIMIT))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendText();
                }
              }}
              placeholder={placeholder || t("tryMe.placeholder")}
              disabled={disabled}
              dir={isArabicText(text, locale) ? "rtl" : "ltr"}
              className="w-full h-11 bg-transparent border-0 shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none focus-visible:outline-0! text-[13px] text-[#334155] dark:text-foreground"
            />
            <div className="flex items-center justify-between h-[30px]">
              <div className="flex items-center gap-3 relative">
                {showEmoji && emojiPos && typeof document !== "undefined"
                  ? createPortal(
                      <div className="fixed z-[120] shadow-2xl" style={emojiPos}>
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji) => {
                            setText((prev) => (prev + emoji.native).slice(0, TRY_ME_TEXT_LIMIT));
                            setShowEmoji(false);
                          }}
                          onClickOutside={(event) => {
                            if (emojiBtnRef.current?.contains(event?.target)) return;
                            setShowEmoji(false);
                          }}
                          theme="auto"
                          set="native"
                        />
                      </div>,
                      document.body,
                    )
                  : null}
                <button
                  ref={emojiBtnRef}
                  type="button"
                  disabled={disabled}
                  className="text-[#61748a] hover:text-[#6763AF] cursor-pointer disabled:opacity-50"
                  onClick={() => setShowEmoji((v) => !v)}
                >
                  <Smile size={17} />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
                {attachActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" disabled={disabled} className="text-[#61748a] hover:text-[#6763AF] cursor-pointer disabled:opacity-50">
                        <Plus size={17} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="z-[120] w-52 mb-1">
                      {attachActions.map((action) => (
                        <DropdownMenuItem
                          key={action.type}
                          onClick={() => pickFile(action)}
                          className="cursor-pointer"
                        >
                          <action.icon className="w-4 h-4 me-2" />
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {acceptFlags.audio && (
                  <button type="button" disabled={disabled} className="text-[#61748a] hover:text-[#6763AF] cursor-pointer disabled:opacity-50" onClick={startRecording}>
                    <Mic size={17} />
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={disabled || !text.trim()}
                onClick={sendText}
                className={cn("text-[#bcc3cb]", text.trim() && "text-[#6763AF]")}
              >
                <Send size={20} className="" />
              </button>
            </div>
            <div className="text-[10px] text-end text-muted-foreground">
              {text.length}/{TRY_ME_TEXT_LIMIT}
            </div>
          </>
        )}
      </div>
      <p className="text-center text-[8px] text-[#a0a8b3] mt-1.5">{t("tryMe.testModeFooter")}</p>
    </div>
  );
}

function TryMeLocationPicker({ onConfirm, onClose, t }) {
  const locale = useLocale();
  const defaultCairo = useMemo(() => ({ lat: 30.0444, lng: 31.2357 }), []);
  const [position, setPosition] = useState(defaultCairo);
  const [meta, setMeta] = useState({ name: "", address: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    reverseGeocode(defaultCairo.lat, defaultCairo.lng, locale).then((geo) => {
      if (!cancelled) setMeta({ name: geo.name || "", address: geo.address || "" });
    });
    return () => {
      cancelled = true;
    };
  }, [defaultCairo, locale]);

  const onLocationSelect = async (lat, lng) => {
    setPosition({ lat, lng });
    const geo = await reverseGeocode(lat, lng, locale);
    setMeta({ name: geo.name || "", address: geo.address || "" });
  };

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm({
        latitude: position.lat,
        longitude: position.lng,
        name: meta.name,
        address: meta.address,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#dce3ea] dark:border-border">
        <span className="text-sm font-semibold">{t("tryMe.sendLocation")}</span>
        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-muted cursor-pointer">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <MapLocationPicker
          initialLocation={position}
          onLocationSelect={onLocationSelect}
          height="100%"
          width="100%"
        />
      </div>
      <div className="p-3 border-t border-[#dce3ea] dark:border-border space-y-2">
        {(meta.name || meta.address) && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {meta.name}
            {meta.name && meta.address ? " · " : ""}
            {meta.address}
          </div>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={confirm}
          className="w-full h-10 rounded-xl bg-[#6763AF] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
        >
          {t("tryMe.confirmLocation")}
        </button>
      </div>
    </div>
  );
}

function TryMeChatSkeleton({ agentName }) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const rows = [
    { role: "user", w: "w-[58%]", lines: ["w-[90%]", "w-[42%]"] },
    { role: "assistant", w: "w-[74%]", lines: ["w-[94%]", "w-[72%]", "w-[38%]"] },
    { role: "user", w: "w-[34%]", lines: ["w-[78%]"] },
    { role: "assistant", w: "w-[52%]", lines: ["w-[88%]", "w-[55%]"] },
    { role: "user", w: "w-[66%]", lines: ["w-[92%]", "w-[64%]"] },
    { role: "assistant", w: "w-[41%]", lines: ["w-[80%]"] },
    { role: "user", w: "w-[47%]", lines: ["w-[70%]", "w-[28%]"] },
  ];

  return (
    <div role="status" aria-busy="true">
      {rows.map((row, i) => {
        const isUser = row.role === "user";
        const bubble = (
          <div
            className={cn(
              "px-3 py-2.5 shadow-sm",
              row.w,
              isUser
                ? `bg-[#6763AF] rounded-[0.75rem] ${isArabic ? "rounded-tl-[4px]" : "rounded-tr-[4px]"}`
                : `bg-[#f0f1f3] dark:bg-muted rounded-[0.75rem] ${isArabic ? "rounded-tr-[4px]" : "rounded-tl-[4px]"}`,
            )}
          >
            <div className="grid gap-1.5">
              {row.lines.map((line, j) => (
                <div
                  key={j}
                  className={cn(
                    "h-2.5 rounded-full animate-pulse",
                    line,
                    isUser ? "bg-white/25" : "bg-[#d5d8de] dark:bg-foreground/15",
                  )}
                />
              ))}
            </div>
            <div
              className={cn(
                "mt-2 h-2 w-8 rounded-full animate-pulse",
                isUser ? "ms-auto bg-white/20" : "bg-[#d5d8de] dark:bg-foreground/10",
              )}
            />
          </div>
        );

        if (isUser) {
          return (
            <div key={i} className="flex justify-end mb-4">
              {bubble}
            </div>
          );
        }

        return (
          <div key={i} className="flex items-start gap-2 mb-4">
            <div className="w-[30px] h-[30px] rounded-full shrink-0 mt-0.5 grid place-items-center text-white bg-gradient-to-br from-[#5750a0] to-[#7672B9] shadow-sm">
              <AiIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 max-w-[calc(100%-38px)] w-full">
              <div className="text-[11px] text-[#637187] font-medium mb-1 ms-0.5">{agentName}</div>
              {bubble}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TryMeSidebar({ tryMe }) {
  const t = useTranslations("agents");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;
  const scrollerRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [locationPicker, setLocationPicker] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState("new");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const {
    isOpen,
    collapsed,
    sessionLoading,
    agent,
    messages,
    processing,
    lastErrors,
    stale,
    unreadCount,
    close,
    shrink,
    expand,
    send,
    retry,
    markChoice,
    resetSession,
    refreshSession,
    changeCustomer,
  } = tryMe;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isOpen || collapsed) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (sheetOpen) {
        setSheetOpen(false);
        return;
      }
      if (infoOpen) {
        setInfoOpen(false);
        return;
      }
      if (locationPicker) {
        setLocationPicker(null);
        return;
      }
      if (viewer) {
        setViewer(null);
        return;
      }
      shrink();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, isOpen, collapsed, shrink, sheetOpen, infoOpen, locationPicker, viewer]);

  useEffect(() => {
    if (!isOpen) {
      setMode("new");
      setSelectedClient(null);
      setSheetOpen(false);
      setInfoOpen(false);
      setCustomerStats(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode !== "real" || !selectedClient?.id) {
      setCustomerStats(null);
      setStatsLoading(false);
      return undefined;
    }
    let cancelled = false;
    setStatsLoading(true);
    api
      .get(`/clients/${selectedClient.id}/orders/stats`)
      .then((res) => {
        if (!cancelled) setCustomerStats(res.data);
      })
      .catch(() => {
        if (!cancelled) setCustomerStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, selectedClient?.id]);

  useEffect(() => {
    if (!collapsed && scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, processing, collapsed]);

  const grouped = useMemo(() => {
    const groups = [];
    messages.forEach((msg) => {
      const day = msg.createdAt
        ? format(new Date(msg.createdAt), "EEEE, d MMMM", { locale: dateLocale })
        : "";
      const last = groups[groups.length - 1];
      if (!last || last.day !== day) groups.push({ day, items: [msg] });
      else last.items.push(msg);
    });
    return groups;
  }, [dateLocale, messages]);

  const onChoice = useCallback(
    (title, sourceId, actionKey) => {
      if (!title) return;
      if (actionKey) markChoice?.(sourceId, actionKey);
      send({ text: title });
    },
    [markChoice, send],
  );

  const onRequestLocation = useCallback((sourceId) => {
    setLocationPicker({ sourceId });
  }, []);

  const confirmLocation = useCallback(
    async (location) => {
      markChoice?.(locationPicker?.sourceId, "LOCATION_REQUEST");
      setLocationPicker(null);
      await send({ location });
    },
    [locationPicker?.sourceId, markChoice, send],
  );

  const onModeChange = useCallback(
    (next) => {
      setMode(next);
      setInfoOpen(false);
      if (next === "new") {
        setSheetOpen(false);
        changeCustomer(null);
        return;
      }
      setSheetOpen(true);
      if (selectedClient) changeCustomer(selectedClient);
    },
    [changeCustomer, selectedClient],
  );

  const onSelectClient = useCallback(
    (row) => {
      setSelectedClient(row);
      setMode("real");
      changeCustomer(row);
    },
    [changeCustomer],
  );

  const composerLocked = sessionLoading || !agent || (mode === "real" && !selectedClient);
  const showEmpty = !sessionLoading && !messages.length;

  if (!isOpen || !mounted) return null;

  const side = isRtl ? "left-0" : "right-0";
  const dockSide = isRtl ? "left-4" : "right-4";

  if (collapsed) {
    return createPortal(
      <button
        type="button"
        onClick={expand}
        className={cn(
          "fixed bottom-4 z-[100] flex items-center gap-2 rounded-full shadow-lg text-white px-3 py-2",
          "bg-gradient-to-br from-[#5750a0] via-[#6763AF] to-[#7672B9]",
          dockSide,
        )}
        title={t("tryMe.expand")}
      >
        <span className="relative">
          <span className="w-8 h-8 rounded-full grid place-items-center bg-white/15">
            <AiIcon className="w-4 h-4" />
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -end-1 min-w-4 h-4 px-1 rounded-full bg-[#e5484d] text-[10px] font-bold grid place-items-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
        <span className="text-xs font-medium max-w-[120px] truncate">{agent?.name || t("tryMe.title")}</span>
        <Maximize2 size={14} />
      </button>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" dir={isRtl ? "rtl" : "ltr"}>
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("tryMe.shrink")}
        onClick={shrink}
      />
      <aside
        id="try-me-sidebar-root"
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute top-0 h-full bg-white dark:bg-background flex flex-col shadow-2xl overflow-hidden",
          "w-full md:w-[400px]",
          side,
        )}
      >
        <header className="h-[72px] shrink-0 flex items-center gap-2.5 px-4 text-white bg-gradient-to-br from-[#5750a0] via-[#6763AF] to-[#7672B9]">
          <div className="w-[38px] h-[38px] rounded-full grid place-items-center bg-white/15 border border-white/25">
            <AiIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-sm truncate">{agent?.name || t("tryMe.title")}</strong>
            <span className="text-[10px] opacity-80">{t("tryMe.subtitle")}</span>
          </div>
          <button type="button" onClick={resetSession} className="p-1.5 rounded-full hover:bg-white/15" title={t("tryMe.newSession")}>
            <RotateCcw size={16} />
          </button>
          <button type="button" onClick={shrink} className="p-1.5 rounded-full hover:bg-white/15" title={t("tryMe.shrink")}>
            <Minimize2 size={16} />
          </button>
          <button type="button" onClick={close} className="p-1.5 rounded-full hover:bg-white/15" title={t("tryMe.close")}>
            <X size={16} />
          </button>
        </header>

        <TryMeContextBar
          mode={mode}
          onModeChange={onModeChange}
          customer={selectedClient}
          stats={customerStats}
          statsLoading={statsLoading}
          onSelectClient={onSelectClient}
          sheetOpen={sheetOpen}
          setSheetOpen={setSheetOpen}
          infoOpen={infoOpen}
          setInfoOpen={setInfoOpen}
          locale={locale}
        />

        {stale && (
          <div className="px-3 py-2 bg-amber-50 text-amber-900 text-xs flex items-center justify-between gap-2">
            <span>{t("tryMe.staleAgent")}</span>
            <button type="button" onClick={refreshSession} className="font-semibold underline">
              {t("tryMe.refresh")}
            </button>
          </div>
        )}

        <div ref={scrollerRef} className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 bg-white dark:bg-background flex flex-col">
          {sessionLoading && !messages.length ? (
            <TryMeChatSkeleton agentName={agent?.name || t("tryMe.title")} />
          ) : showEmpty ? (
            <TryMeEmptyState
              mode={mode}
              customer={selectedClient}
              onPickCustomer={() => {
                setMode("real");
                setInfoOpen(false);
                setSheetOpen(true);
              }}
              onAsk={(text) => send({ text })}
              t={t}
              locale={locale}
            />
          ) : (
            grouped.map((group) => (
              <div key={group.day}>
                {group.day && (
                  <div className="text-center text-[12px] font-bold text-[#26333e] dark:text-foreground my-3">
                    {group.day}
                  </div>
                )}
                {group.items.map((msg) => (
                  <TryMeBubble
                    key={msg.id}
                    message={msg}
                    agentName={agent?.name || t("tryMe.title")}
                    onRetry={retry}
                    onChoice={onChoice}
                    onRequestLocation={onRequestLocation}
                    onMediaOpen={setViewer}
                    t={t}
                  />
                ))}
              </div>
            ))
          )}

          {processing && (
            <div className="flex items-start gap-2 mb-4">
              <div className="w-[30px] h-[30px] rounded-full shrink-0 grid place-items-center text-white bg-gradient-to-br from-[#5750a0] to-[#7672B9]">
                <AiIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-[#637187] mb-1">{agent?.name}</div>
                <div className="inline-block bg-[#f0f1f3] dark:bg-muted rounded-[0.75rem] rounded-tl-[4px] px-3 py-2">
                  <TypingDots />
                  <span className="sr-only">{t("tryMe.processing")}</span>
                </div>
              </div>
            </div>
          )}

          {lastErrors?.[0]?.message && !processing && (
            <p className="text-center text-xs text-destructive mt-2">{lastErrors[0].message}</p>
          )}
        </div>

        <TryMeComposer
          agent={agent}
          disabled={composerLocked}
          placeholder={mode === "real" && !selectedClient ? t("tryMe.pickCustomerFirst") : t("tryMe.placeholder")}
          onSend={send}
          t={t}
        />

        {locationPicker && (
          <TryMeLocationPicker
            t={t}
            onClose={() => setLocationPicker(null)}
            onConfirm={confirmLocation}
          />
        )}

        {viewer && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col text-white">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium truncate">{viewer.name || t("tryMe.preview")}</span>
              <button type="button" onClick={() => setViewer(null)} className="p-1 rounded-full hover:bg-white/10 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 grid place-items-center min-h-0">
              {viewer.type === "image" || viewer.type === "sticker" ? (
                <img src={viewer.url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
              ) : viewer.type === "video" ? (
                <video src={viewer.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <FileText size={64} />
                  <p className="text-sm">{viewer.name || t("tryMe.document")}</p>
                  <a
                    href={viewer.url}
                    download={viewer.name || undefined}
                    className="text-xs underline cursor-pointer"
                  >
                    {t("tryMe.download")}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
