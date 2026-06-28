"use client";

import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { Check, CheckCheck, Reply, Smile, Play, Pause, Mic, FileText, Clock, AlertCircle, Loader2, RotateCcw, List, MapPin, User, Mail, Calendar, ChevronRight, Save, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { BASE_URL } from "@/utils/api";
import TemplatePreview from "../TemplatePreview";
import { formatText, handleMediaClick, getMediaUrl } from "@/utils/whatsapp-healper";
import { useTranslations, useLocale } from "next-intl";
import { useClipboard } from "@/hook/useClipboard";

export default function MessageBubble({ id, message, isOutbound, onReply, onReaction, onRetry, isHighlighted }) {
    const t = useTranslations("chats");
    const locale = useLocale();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [mediaLoading, setMediaLoading] = useState(true);
    const [audioLoading, setAudioLoading] = useState(true);
    const [mediaError, setMediaError] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [contactDetailsOpen, setContactDetailsOpen] = useState(false);
    const [saveContactSuccess, setSaveContactSuccess] = useState(false);
    const { copied, handleCopy } = useClipboard();
    const audioRef = useRef(null);
    const progressRef = useRef(null);
    const time = message.createdAt ? format(new Date(message.createdAt), "hh:mm a") : "";

    const contact = message.content?.contacts?.[0];

    // Generate vCard for saving contact
    const generateVCard = useMemo(() => {
        if (!contact) return "";

        let vCard = "BEGIN:VCARD\n";
        vCard += "VERSION:3.0\n";
        vCard += `N:${contact.name?.last_name || ''};${contact.name?.first_name || ''};;;\n`;
        vCard += `FN:${contact.name?.formatted_name || ''}\n`;

        if (contact.phones) {
            contact.phones.forEach((phone) => {
                vCard += `TEL;TYPE=${phone.type || 'CELL'}:${phone.phone}\n`;
            });
        }

        if (contact.emails) {
            contact.emails.forEach((email) => {
                vCard += `EMAIL;TYPE=${email.type || 'INTERNET'}:${email.email}\n`;
            });
        }

        if (contact.addresses) {
            contact.addresses.forEach((addr) => {
                vCard += `ADR;TYPE=${addr.type || 'HOME'}:;;${addr.street || ''};${addr.city || ''};${addr.state || ''};${addr.zip || ''};${addr.country || ''}\n`;
            });
        }

        if (contact.birthday) {
            vCard += `BDAY:${contact.birthday}\n`;
        }

        vCard += "END:VCARD";

        return vCard;
    }, [contact]);

    const handleSaveContact = () => {
        if (!generateVCard) return;
        const blob = new Blob([generateVCard], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contact?.name?.formatted_name || 'contact'}.vcf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setSaveContactSuccess(true);
        setTimeout(() => setSaveContactSuccess(false), 2000);
    };

    const formattedBody = useMemo(() => {
        const body = message.content?.text?.body || message.content?.body || "";
        return formatText(body);
    }, [message.content?.text?.body, message.content?.body]);

    const caption = message.content?.caption || message.content?.image?.caption || message.content?.video?.caption || message.content?.document?.caption || "";
    const formattedCaption = useMemo(() => {
        return formatText(caption || "");
    }, [caption]);



    useEffect(() => {
        const handleScrollToMsg = (e) => {
            if (e.detail?.id === message.id) {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }
        };
        window.addEventListener("whatsapp:scroll-to-message", handleScrollToMsg);
        return () => window.removeEventListener("whatsapp:scroll-to-message", handleScrollToMsg);
    }, [id, message.id]);

    useEffect(() => {
        const handleGlobalPlay = (e) => {
            if (e.detail.id !== id && isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            }
        };

        window.addEventListener("whatsapp:audio-play", handleGlobalPlay);
        return () => window.removeEventListener("whatsapp:audio-play", handleGlobalPlay);
    }, [id, isPlaying]);

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                // Dispatch event to stop other audios
                window.dispatchEvent(new CustomEvent("whatsapp:audio-play", { detail: { id } }));
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handleAudioTimeUpdate = () => {
        if (audioRef.current) {
            const duration = audioRef.current.duration;
            // Use metadata duration as fallback if browser returns Infinity
            const metadataDuration = message.content?.audio?.duration || 0;
            const safeDuration = (duration && duration !== Infinity) ? duration : metadataDuration;

            if (safeDuration > 0) {
                const progress = (audioRef.current.currentTime / safeDuration) * 100;
                setAudioProgress(progress);
            }
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleSeek = (e) => {
        if (audioRef.current && progressRef.current) {
            const duration = audioRef.current.duration;
            const metadataDuration = message.content?.audio?.duration || 0;
            const safeDuration = (duration && duration !== Infinity) ? duration : metadataDuration;

            if (safeDuration <= 0) return;

            const rect = progressRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clickedValue = (x / rect.width);
            const newTime = clickedValue * safeDuration;
            audioRef.current.currentTime = newTime;
            setAudioProgress(clickedValue * 100);
            setCurrentTime(newTime);
        }
    };

    const formatAudioTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        setAudioProgress(0);
    };

    const renderMedia = (type, mediaContent, isHeader = false) => {
        const caption = formattedCaption;

        switch (type) {
            case "image":

                return (
                    <div className={cn("space-y-2", !isHeader && "max-w-sm")}>
                        <div className={cn(
                            "relative w-full flex items-center justify-center rounded-lg overflow-hidden group/media",
                            (mediaLoading || mediaError) && "md:min-w-[150px] md:min-h-[150px]"
                        )}>
                            {(mediaLoading || message.status === "uploading") && !mediaError && (
                                <div className="absolute bg-muted/30 inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/60" />
                                    {message.status === "uploading" && <span className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">{t("uploading")}</span>}
                                </div>
                            )}
                            {mediaError ? (
                                <div className="flex flex-col bg-muted/30 items-center gap-2 p-6 text-muted-foreground/60">
                                    <AlertCircle size={32} />
                                    <span className="text-xs font-medium">{t("failedToLoadImage")}</span>
                                </div>
                            ) : (
                                <img
                                    src={getMediaUrl(mediaContent, "image", message)}
                                    alt="image"
                                    className={cn(
                                        "rounded-lg w-full h-auto cursor-pointer transition-opacity duration-300",
                                        (mediaLoading && message.status !== "uploading") ? "opacity-0" : "opacity-100"
                                    )}
                                    loading="lazy"
                                    onLoad={() => setMediaLoading(false)}
                                    onError={() => {
                                        setMediaLoading(false);
                                        setMediaError(true);
                                    }}
                                    onClick={() => handleMediaClick("image", mediaContent)}
                                />
                            )}
                        </div>
                        {!isHeader && caption && <p className="text-sm text-foreground whitespace-pre-wrap">{caption}</p>}
                    </div>
                );

            case "sticker":
                return (
                    <div className="space-y-2 max-w-xs">
                        <div className={cn(
                            "relative flex items-center justify-center overflow-hidden group/media",
                            (mediaLoading || mediaError) && "md:min-w-[150px] md:min-h-[150px]"
                        )}>
                            {(mediaLoading || message.status === "uploading") && !mediaError && (
                                <div className="absolute bg-muted/30 inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/60" />
                                    {message.status === "uploading" && <span className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">{t("uploading")}</span>}
                                </div>
                            )}
                            {mediaError ? (
                                <div className="flex flex-col bg-muted/30 items-center gap-2 p-6 text-muted-foreground/60">
                                    <AlertCircle size={32} />
                                    <span className="text-xs font-medium">{t("failedToLoadImage")}</span>
                                </div>
                            ) : (
                                <img
                                    src={getMediaUrl(mediaContent, "sticker", message)}
                                    alt="sticker"
                                    className={cn(
                                        "w-48 h-48 object-contain cursor-pointer transition-opacity duration-300",
                                        (mediaLoading && message.status !== "uploading") ? "opacity-0" : "opacity-100"
                                    )}
                                    loading="lazy"
                                    onLoad={() => setMediaLoading(false)}
                                    onError={() => {
                                        setMediaLoading(false);
                                        setMediaError(true);
                                    }}
                                    onClick={() => handleMediaClick("sticker", mediaContent)}
                                />
                            )}
                        </div>
                    </div>
                );

            case "video":
                return (
                    <div className={cn("space-y-2", !isHeader && "max-w-sm")}>
                        <div className="relative w-full min-h-[180px] flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden group/media">
                            {(mediaLoading || message.status === "uploading") && !mediaError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/60" />
                                    {message.status === "uploading" && <span className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">{t("uploading")}</span>}
                                </div>
                            )}
                            {mediaError ? (
                                <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground/60">
                                    <AlertCircle size={32} />
                                    <span className="text-xs font-medium">{t("failedToLoadVideo")}</span>
                                </div>
                            ) : (
                                <video
                                    src={getMediaUrl(mediaContent, "video", message)}
                                    controls
                                    className={cn(
                                        "rounded-lg w-full h-auto transition-opacity duration-300",
                                        (mediaLoading && message.status !== "uploading") ? "opacity-0" : "opacity-100"
                                    )}
                                    onLoadedData={() => setMediaLoading(false)}
                                    onError={() => {
                                        setMediaLoading(false);
                                        setMediaError(true);
                                    }}
                                />
                            )}
                        </div>
                        {!isHeader && caption && <p className="text-sm text-foreground whitespace-pre-wrap">{caption}</p>}
                    </div>
                );

            case "document":
                return (
                    <div className="space-y-2">
                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border relative overflow-hidden",
                            isOutbound ? "bg-muted/40 border-border/50" : "bg-muted/30 border-border"
                        )}>
                            {message.status === "uploading" && (
                                <div className="absolute inset-0 bg-card/60 dark:bg-black/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    <span className="text-[10px] font-bold ms-2 text-primary">{t("uploading").toUpperCase()}</span>
                                </div>
                            )}
                            <div
                                onClick={() => handleMediaClick("document", mediaContent)}
                                className="flex items-center gap-3 flex-1 cursor-pointer"
                            >
                                <FileText size={32} className="text-blue-500" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{mediaContent.document?.filename || mediaContent.document?.name || t("document")}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{mediaContent.document?.mime_type || "PDF"}</p>
                                </div>
                            </div>
                        </div>
                        {!isHeader && caption && <p className="text-sm whitespace-pre-wrap">{caption}</p>}
                    </div>
                );

            case "text":
                return <div className="font-bold text-sm">{mediaContent.text}</div>;

            default:
                return null;
        }
    };

    // Status icons mapping
    const StatusIcon = ({ status }) => {
        if (status === "uploading") return <Loader2 className="w-3 h-3 text-muted-foreground/60 animate-spin" />;
        if (status === "pending") return <Clock className="w-3 h-3 text-muted-foreground/60 animate-pulse" />;
        if (status === "failed") return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
        if (status === "read" || status === "played") return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
        if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/60" />;
        return <Check className="w-3.5 h-3.5 text-muted-foreground/60" />;
    };

    const renderContent = () => {
        const { messageType, content } = message;

        switch (messageType) {
            case "text":
                return <p className="text-sm whitespace-pre-wrap">{formattedBody}</p>;

            case "image":
                return renderMedia("image", content);

            case "sticker":
                return renderMedia("sticker", content);

            case "video":
                return renderMedia("video", content);

            case "document":
                return renderMedia("document", content);

            case "audio":
                return (
                    <div className="flex items-center gap-3 py-1 min-w-[200px]">
                        <audio
                            ref={audioRef}
                            src={getMediaUrl(content, "audio", message)}
                            onTimeUpdate={handleAudioTimeUpdate}
                            onEnded={handleAudioEnded}
                            onCanPlayThrough={() => setAudioLoading(false)}
                            onError={() => {
                                setAudioLoading(false);
                                setAudioError(true);
                            }}
                            className="hidden"
                        />
                        <button
                            onClick={toggleAudio}
                            disabled={audioLoading || audioError}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors relative",
                                isOutbound ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-muted/80",
                                (audioLoading || audioError) && "opacity-80 cursor-not-allowed",
                                audioError && "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            )}
                        >
                            {audioLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : audioError ? (
                                <AlertCircle size={20} />
                            ) : (
                                isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className={cn(locale === 'ar' ? "mr-1" : "ml-1")} />
                            )}
                        </button>

                        <div className="flex-1 space-y-1.5">
                            <div
                                ref={progressRef}
                                onClick={(!audioLoading && !audioError) ? handleSeek : undefined}
                                className={cn(
                                    "relative h-2 bg-muted/50 rounded-full group/progress",
                                    (!audioLoading && !audioError) ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute top-0 left-0 h-full transition-all duration-100 rounded-full",
                                        isOutbound ? "bg-primary" : "bg-muted-foreground/60",
                                        audioError && "bg-destructive"
                                    )}
                                    style={{ width: `${audioProgress}%` }}
                                />
                                {!audioLoading && !audioError && (
                                    <div
                                        className={cn(
                                            "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-card border-2 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-sm",
                                            isOutbound ? "border-primary" : "border-muted-foreground"
                                        )}
                                        style={{ left: `calc(${audioProgress}% - 6px)` }}
                                    />
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground/70 font-medium">
                                    {audioLoading ? "Loading..." : audioError ? "Failed to load audio" : formatAudioTime(isPlaying ? currentTime : (content.audio?.duration || 0))}
                                </span>
                                <Mic size={12} className={cn(isOutbound ? "text-primary" : "text-muted-foreground/60", audioError && "text-destructive")} />
                            </div>
                        </div>
                    </div>
                );

            case "template":
                const templateMetadata = message.metadata?.template || {};
                const templateConfig = templateMetadata.templateConfig || {};

                // Map actual values from components to examples for the preview
                const dynamicExamples = {};
                let headerMediaUrl = templateConfig.headerUrl;
                let locationData = null;

                if (content.template?.components) {
                    content.template.components.forEach(comp => {
                        if (comp.type === "header" && comp.parameters) {
                            comp.parameters.forEach((param, idx) => {
                                if (param.type === "text") {
                                    dynamicExamples[idx + 1] = param.text;
                                } else if (["image", "video", "document"].includes(param.type?.toLowerCase())) {
                                    headerMediaUrl = param[param.type]?.link || headerMediaUrl;
                                } else if (param.type === "location") {
                                    locationData = param.location;
                                }
                            });
                        } else if (comp.type === "body" && comp.parameters) {
                            comp.parameters.forEach((param, idx) => {
                                dynamicExamples[idx + 1] = param.text;
                            });
                        }
                    });
                }

                return (
                    <div className="space-y-2 min-w-[300px]">
                        <TemplatePreview
                            isChatBubble
                            bgTransparent
                            hideToggleAction
                            hasHeader={false}
                            isUploading={message.status === "uploading"}
                            template={{
                                ...templateConfig,
                                headerUrl: headerMediaUrl,
                                locationData,
                                language: templateMetadata.language || "en",
                                subCategory: templateMetadata.subCategory,
                                examples: dynamicExamples // Use the actual sent values as "examples"
                            }}
                        />
                    </div>
                );

            case "location":
                return (
                    <div className="space-y-2 min-w-[240px]">
                        <div
                            onClick={() => window.open(`https://www.google.com/maps?q=${content?.location?.latitude},${content?.location?.longitude}`, "_blank")}
                            className="h-32 rounded-lg overflow-hidden relative cursor-pointer group"
                        >
                            <img
                                src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${content?.location?.longitude},${content?.location?.latitude}&z=13&l=map&size=300,150`}
                                alt="map"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-muted/30 group-hover:bg-muted/40 transition-colors flex items-center justify-center">
                                <MapPin size={32} className="text-destructive drop-shadow-md" />
                            </div>
                        </div>
                        <div className="min-w-0 px-1 pb-1">
                            <p className="text-sm font-bold text-foreground truncate">{content?.location?.name}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{content?.location?.address}</p>
                        </div>
                    </div>
                );

            case "contacts":
                const contact = content.contacts?.[0];
                return (
                    <div className="space-y-3 min-w-[240px]">
                        <button
                            onClick={() => setContactDetailsOpen(true)}
                            className="w-full flex items-center gap-3 border-b border-border pb-3 hover:bg-muted/30  transition-colors -mx-1 px-1"
                        >
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
                                <User size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground truncate">
                                    {contact?.name?.formatted_name || contact?.name?.first_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {contact?.phones?.[0]?.phone}
                                </p>
                            </div>
                        </button>
                        <div className="flex gap-2">
                            <button className="flex-1 py-2 text-sm font-bold text-primary hover:bg-muted rounded-lg transition-colors">
                                {t("message")}
                            </button>
                            <button
                                onClick={handleSaveContact}
                                className="flex-1 text-nowrap py-2 text-sm font-bold text-primary hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {saveContactSuccess && <Save size={16} />}
                                {t("saveContact")}
                            </button>
                        </div>

                        {/* Contact Details Dialog */}
                        <Dialog open={contactDetailsOpen} onOpenChange={setContactDetailsOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                            <User size={24} />
                                        </div>
                                        {contact?.name?.formatted_name || contact?.name?.first_name}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4">
                                    {/* Phones */}
                                    {contact?.phones?.map((phone, idx) => (
                                        <div key={`phone-${idx}`} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary">
                                                <User size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">{phone.phone}</p>
                                                <p className="text-[11px] text-muted-foreground">{phone.type || t("mobile")}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Emails */}
                                    {contact?.emails?.map((email, idx) => (
                                        <div key={`email-${idx}`} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary">
                                                <Mail size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">{email.email}</p>
                                                <p className="text-[11px] text-muted-foreground">{email.type || t("home")}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Addresses */}
                                    {contact?.addresses?.map((addr, idx) => (
                                        <div key={`addr-${idx}`} className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary shrink-0 mt-1">
                                                <MapPin size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">
                                                    {[addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ')}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">{addr.type || t("home")}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Birthday */}
                                    {contact?.birthday && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary">
                                                <Calendar size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">{contact.birthday}</p>
                                                <p className="text-[11px] text-muted-foreground">{t("birthday")}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                );

            case "interactive":
                if (content.interactive?.type === "list") {
                    const listMessage = content.interactive;
                    return (
                        <div className="space-y-2 min-w-[300px]">
                            <TemplatePreview
                                hasHeader={false}
                                isChatBubble
                                bgTransparent
                                hideToggleAction
                                isInteractive={true}
                                isList={true}
                                seeAllOptionsLabel={listMessage.action.button}
                                template={{
                                    headerType: listMessage?.header?.type?.toUpperCase(),
                                    headerText: listMessage?.header?.text,
                                    bodyText: listMessage?.body?.text,
                                    footerText: listMessage?.footer?.text,
                                    sections: listMessage?.action?.sections,
                                }}
                            />
                        </div>
                    );
                }

                if (content.interactive?.type === "button_reply") {
                    return (
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                            {content.interactive.button_reply?.title}
                        </p>
                    );
                }

                if (content.interactive?.type === "location_request_message") {
                    return (
                        <div className="space-y-2 min-w-[300px]">
                            <TemplatePreview
                                isChatBubble
                                bgTransparent
                                hideToggleAction
                                hasHeader={false}
                                template={{
                                    bodyText: content.interactive?.body?.text,
                                    buttons: [
                                        {
                                            type: "LOCATION_REQUEST",
                                            textEn: "Send Location",
                                            textAr: "إرسال الموقع"
                                        }
                                    ]
                                }}
                            />
                        </div>
                    )
                }

                if (content.interactive?.type === "list_reply") {
                    return (
                        <p className="text-sm text-foreground whitespace-pre-wrap flex gap-0.5 flex-col">
                            <span>{content.interactive?.list_reply?.title}</span>
                            <span>{content.interactive?.list_reply?.description}</span>
                        </p>
                    );
                }

                if (content.interactive?.type === "button") {
                    const buttonMessage = content.interactive;
                    const media = buttonMessage?.header?.[buttonMessage?.header?.type];
                  
                    return (
                        <div className="space-y-2 min-w-[300px]">
                            <TemplatePreview
                                hasHeader={false}
                                isChatBubble
                                bgTransparent
                                hideToggleAction
                                isInteractive={true}
                                isUploading={message.status === "uploading"}
                                template={{
                                    headerType: buttonMessage?.header?.type?.toUpperCase(),
                                    headerText: buttonMessage?.header?.text,
                                    headerUrl: media?.link || media?.id,
                                    bodyText: buttonMessage?.body?.text,
                                    footerText: buttonMessage?.footer?.text,
                                    buttons: buttonMessage?.action?.buttons?.map(b => ({
                                        type: "QUICK_REPLY",
                                        text: b?.reply?.title
                                    })),
                                    // language: locale === "ar" ? "ar" : "en"
                                }}
                            />
                        </div>
                    );
                }

                return (
                    <div className="space-y-3">
                        {content.interactive?.header && (
                            renderMedia(content.interactive.header.type, content.interactive.header, true)
                        )}
                        <p className="text-sm text-foreground">{content.interactive?.body?.text}</p>
                        {content.interactive?.action?.buttons && (
                            <div className="flex flex-col gap-2 pt-1">
                                {content.interactive.action.buttons.map((btn, idx) => (
                                    <button
                                        key={idx}
                                        className={cn(
                                            "w-full py-2.5 px-4 rounded-xl text-start text-xs font-medium transition-all flex items-center gap-3 border group/btn",
                                            isOutbound
                                                ? "bg-card/50 border-border/50 hover:bg-card/80 text-foreground"
                                                : "bg-muted border-border hover:bg-accent/50 text-foreground"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                            isOutbound ? "border-primary/50" : "border-muted-foreground/30"
                                        )}>
                                            <div className={cn(
                                                "w-2 h-2 rounded-full transition-all scale-0 opacity-0 group-hover/btn:scale-100 group-hover/btn:opacity-100",
                                                isOutbound ? "bg-primary" : "bg-blue-500"
                                            )} />
                                        </div>
                                        {btn.reply?.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "button":
                return (
                    <p className="text-sm whitespace-pre-wrap">
                        {content.button?.text || "Button Clicked"}
                    </p>

                );

            case "unsupported":
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                            <AlertCircle size={16} />
                            <span className="text-sm font-medium">
                                {t("unsupportedMessage")}
                            </span>
                        </div>
                        {content.errors && content.errors.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                                {content.errors[0].message}
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="flex items-center gap-2 italic text-gray-400 text-xs">
                        [{messageType.toUpperCase()} {t("unsupportedMessage")}]
                    </div>
                );
        }
    };

    return (
        <div id={id} className={cn(
            "flex w-full mb-4 group",
            isOutbound ? "justify-start" : "justify-end"
        )}>
            <div className="relative flex items-center">
                {/* Hover Actions - Positioned absolute to avoid layout shift */}
                {message.status !== "failed" && (
                    <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-all duration-200 z-10",
                        isOutbound ? "start-full ms-2" : "end-full me-2",
                        "opacity-0 group-hover:opacity-100",
                        isPopoverOpen && "opacity-100"
                    )}>
                        <button
                            onClick={() => onReply && onReply(message)}
                            className="p-1.5 hover:bg-accent/50 rounded-full text-muted-foreground/60 hover:text-foreground transition-colors"
                            title="Reply"
                        >
                            <Reply className="w-3.5 h-3.5" />
                        </button>

                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    className="p-1.5 hover:bg-accent/50 rounded-full text-muted-foreground/60 hover:text-foreground transition-colors"
                                    title="React"
                                >
                                    <Smile className="w-3.5 h-3.5" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                side="top"
                                align={isOutbound ? "start" : "end"}
                                className="p-0 border-none bg-transparent shadow-none w-auto"
                            >
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <Picker
                                        data={data}
                                        onEmojiSelect={(emoji) => {
                                            onReaction && onReaction(message.id, emoji.native);
                                            setIsPopoverOpen(false);
                                        }}
                                        theme="auto"
                                        set="native"
                                        previewPosition="none"
                                        skinTonePosition="none"
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>)}

                <div className={cn(
                    "max-w-[450px] px-4 py-2.5 rounded-2xl relative shadow-sm transition-all duration-500",
                    isOutbound
                        ? "bg-green-100 dark:bg-[#1f2c33] text-foreground rtl:rounded-tr-none ltr:rounded-tl-none "
                        : "bg-card text-foreground rtl:rounded-tl-none ltr:rounded-tr-none border border-border",
                    isHighlighted && (isOutbound ? "bg-primary/20 ring-4 ring-primary/20" : "bg-muted/50 ring-4 ring-muted/50")
                )}>
                    {/* Reply Preview */}
                    {message.replyTo && (
                        <div
                            onClick={() => message.replyTo && window.dispatchEvent(new CustomEvent("whatsapp:scroll-to-message", { detail: { id: message.replyTo.id } }))}
                            className={cn(
                                "mb-2 p-2 rounded-lg border-s-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors",
                                isOutbound ? "border-primary" : "border-blue-500"
                            )}
                        >
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mb-0.5">
                                {message.replyTo.direction === "inbound" ? "Customer" : "You"}
                            </p>
                            <p className="text-xs italic line-clamp-2 text-muted-foreground italic">
                                {message.replyTo.messageType === "text"
                                    ? (message.replyTo.content?.text?.body || message.replyTo.content?.body)
                                    : `[${message.replyTo.messageType.toUpperCase()}]`}
                            </p>
                        </div>
                    )}

                    {renderContent()}

                    {/* Error Display for Failed Messages */}
                    {message.status === "failed" && (
                        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5">{t("messageFailedToSend")}</p>
                                    <p className="text-xs opacity-90 line-clamp-2">{message.error || "Unknown error occurred"}</p>
                                </div>
                            </div>
                            {onRetry && (
                                <button
                                    onClick={() => onRetry(message)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-destructive/20 text-destructive rounded-lg text-xs font-bold hover:bg-destructive/5 transition-colors shadow-sm w-full justify-center"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    {t("retrySending")}
                                </button>
                            )}
                        </div>
                    )}

                    <div className={cn(
                        "flex items-center gap-1 justify-end mt-1",
                        isOutbound ? "text-primary/60" : "text-muted-foreground/60"
                    )}>
                        <span className="text-[10px]">{time}</span>
                        {isOutbound && <StatusIcon status={message.status} />}
                    </div>

                    {/* Reactions Display */}
                    {message.reactions && message.reactions.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className={cn(
                                    "absolute -bottom-3 flex items-center gap-1 bg-card border border-border rounded-full shadow-sm px-1.5 py-0.5 z-10 hover:bg-muted transition-colors cursor-pointer",
                                    isOutbound ? "start-2" : "end-2"
                                )}>
                                    {message.reactions.map((r, idx) => (
                                        <span key={r.id || idx} className="text-xs">
                                            {r.content?.reaction?.emoji || r.reaction}
                                        </span>
                                    ))}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="center" className="w-auto p-2 bg-card/95 backdrop-blur shadow-lg border border-border rounded-xl animate-in zoom-in-95 duration-200">
                                <div className="space-y-1.5">
                                    {message.reactions.map((r, idx) => (
                                        <div key={r.id || idx} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
                                            <span className="text-lg">{r.content?.reaction?.emoji || r.reaction}</span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground">
                                                    {r.direction === "outbound" ? "You" : "Customer"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {r.createdAt ? format(new Date(r.createdAt), "hh:mm a") : "Just now"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
        </div>
    );
}
