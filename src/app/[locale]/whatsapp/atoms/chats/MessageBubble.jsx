"use client";

import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { Check, CheckCheck, Reply, Smile, Play, Pause, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function MessageBubble({ id, message, isOutbound, onReply, onReaction, isHighlighted }) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const progressRef = useRef(null);
    const time = message.createdAt ? format(new Date(message.createdAt), "hh:mm a") : "";

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
            const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setAudioProgress(progress);
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleSeek = (e) => {
        if (audioRef.current && progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clickedValue = (x / rect.width);
            const newTime = clickedValue * audioRef.current.duration;
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

    // Status icons mapping
    const StatusIcon = ({ status }) => {
        if (status === "READ" || status === "PLAYED") return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
        if (status === "DELIVERED") return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
        return <Check className="w-3.5 h-3.5 text-gray-400" />;
    };

    const renderContent = () => {
        const { messageType, content } = message;

        switch (messageType) {
            case "text":
                return <p className="text-sm whitespace-pre-wrap">{content.text?.body || content.body}</p>;

            case "image":
                return (
                    <div className="space-y-2 max-w-sm">
                        <img src={content.image?.url || content.url} alt="image" className="rounded-lg w-full h-auto cursor-pointer" />
                        {content.caption && <p className="text-sm">{content.caption}</p>}
                    </div>
                );

            case "video":
                return (
                    <div className="space-y-2 max-w-sm">
                        <video src={content.video?.url || content.url} controls className="rounded-lg w-full h-auto" />
                        {content.caption && <p className="text-sm">{content.caption}</p>}
                    </div>
                );

            case "document":
                return (
                    <div className="space-y-2">
                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            isOutbound ? "bg-black/5 border-black/10" : "bg-gray-50 border-gray-100"
                        )}>
                            <FileText size={32} className="text-blue-500" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{content.document?.name || "Document"}</p>
                                <p className="text-[10px] opacity-60 uppercase">PDF • 1.2 MB</p>
                            </div>
                        </div>
                        {content.caption && <p className="text-sm">{content.caption}</p>}
                    </div>
                );

            case "audio":
                return (
                    <div className="flex items-center gap-3 py-1 min-w-[200px]">
                        <audio
                            ref={audioRef}
                            src={content.audio?.url || content.url}
                            onTimeUpdate={handleAudioTimeUpdate}
                            onEnded={handleAudioEnded}
                            className="hidden"
                        />
                        <button
                            onClick={toggleAudio}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                isOutbound ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>

                        <div className="flex-1 space-y-1.5">
                            <div
                                ref={progressRef}
                                onClick={handleSeek}
                                className="relative h-2 bg-black/10 rounded-full cursor-pointer group/progress"
                            >
                                <div
                                    className={cn(
                                        "absolute top-0 left-0 h-full transition-all duration-100 rounded-full",
                                        isOutbound ? "bg-green-600" : "bg-gray-400"
                                    )}
                                    style={{ width: `${audioProgress}%` }}
                                />
                                <div
                                    className={cn(
                                        "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-sm",
                                        isOutbound ? "border-green-600" : "border-gray-400"
                                    )}
                                    style={{ left: `calc(${audioProgress}% - 6px)` }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] opacity-60 font-medium">
                                    {formatAudioTime(isPlaying ? currentTime : (content.audio?.duration || 0))}
                                </span>
                                <Mic size={12} className={cn(isOutbound ? "text-green-600" : "text-gray-400")} />
                            </div>
                        </div>
                    </div>
                );

            case "template":
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Template: {content.template?.name}
                        </div>
                        <p className="text-sm">
                            {/* In a real app, we'd fetch the template body and inject variables */}
                            [Template Message Content]
                        </p>
                    </div>
                );

            case "location":
                return (
                    <div className="space-y-2 min-w-[240px]">
                        <div
                            className="h-32 rounded-lg overflow-hidden relative cursor-pointer group"
                            onClick={() => window.open(`https://www.google.com/maps?q=${content.location.latitude},${content.location.longitude}`, "_blank")}
                        >
                            <img
                                src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${content.location.longitude},${content.location.latitude}&z=13&l=map&size=300,150`}
                                alt="map"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <MapPin size={32} className="text-red-500 drop-shadow-md" />
                            </div>
                        </div>
                        <div className="min-w-0 px-1 pb-1">
                            <p className="text-sm font-bold truncate">{content.location.name}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{content.location.address}</p>
                        </div>
                    </div>
                );

            case "contact":
                const contact = content.contacts?.[0];
                return (
                    <div className="space-y-3 min-w-[240px]">
                        <div className="flex items-center gap-3 border-b pb-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <User size={24} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold truncate">
                                    {contact?.name?.formatted_name || contact?.name?.first_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {contact?.phones?.[0]?.phone}
                                </p>
                            </div>
                        </div>
                        <button className="w-full py-2 text-sm font-bold text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                            Message
                        </button>
                    </div>
                );

            case "interactive":
                if (content.interactive?.type === "list") {
                    return (
                        <div className="space-y-3">
                            {content.interactive.header && (
                                <div className="font-bold text-sm">{content.interactive.header.text}</div>
                            )}
                            <p className="text-sm">{content.interactive.body?.text}</p>
                            <button className="w-full py-2.5 px-3 flex items-center justify-center gap-2 text-[#00a884] font-medium text-[13px] hover:bg-black/5 dark:hover:bg-white/5 border-t border-black/5 dark:border-white/5 transition-colors">
                                <List size={14} />
                                {content.interactive.action?.button || "View Options"}
                            </button>
                        </div>
                    );
                }

                return (
                    <div className="space-y-3">
                        {content.interactive?.header && (
                            <div className="font-bold text-sm">{content.interactive.header.text}</div>
                        )}
                        <p className="text-sm">{content.interactive?.body?.text}</p>
                        {content.interactive?.action?.buttons && (
                            <div className="flex flex-col gap-2 pt-1">
                                {content.interactive.action.buttons.map((btn, idx) => (
                                    <button
                                        key={idx}
                                        className={cn(
                                            "w-full py-2.5 px-4 rounded-xl text-start text-xs font-medium transition-all flex items-center gap-3 border group/btn",
                                            isOutbound
                                                ? "bg-white/10 border-white/20 hover:bg-white/20 text-green-900"
                                                : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                            isOutbound ? "border-green-600/50" : "border-gray-300"
                                        )}>
                                            <div className={cn(
                                                "w-2 h-2 rounded-full transition-all scale-0 opacity-0 group-hover/btn:scale-100 group-hover/btn:opacity-100",
                                                isOutbound ? "bg-green-600" : "bg-blue-500"
                                            )} />
                                        </div>
                                        {btn.reply?.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="flex items-center gap-2 italic text-gray-400 text-xs">
                        [{messageType.toUpperCase()} Message - Not supported yet]
                    </div>
                );
        }
    };

    return (
        <div id={id} className={cn(
            "flex w-full mb-4 group",
            isOutbound ? "justify-end" : "justify-start"
        )}>
            <div className="relative flex items-center">
                {/* Hover Actions - Positioned absolute to avoid layout shift */}
                <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-all duration-200 z-10",
                    isOutbound ? "end-full me-2" : "start-full ms-2",
                    "opacity-0 group-hover:opacity-100",
                    isPopoverOpen && "opacity-100"
                )}>
                    <button
                        onClick={() => onReply && onReply(message)}
                        className="p-1.5 hover:bg-black/5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        title="Reply"
                    >
                        <Reply className="w-3.5 h-3.5" />
                    </button>

                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className="p-1.5 hover:bg-black/5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                title="React"
                            >
                                <Smile className="w-3.5 h-3.5" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="top"
                            align={isOutbound ? "end" : "start"}
                            className="p-0 border-none bg-transparent shadow-none w-auto"
                        >
                            <div className="animate-in fade-in zoom-in-95 duration-200">
                                <Picker
                                    data={data}
                                    onEmojiSelect={(emoji) => {
                                        onReaction && onReaction(message.id, emoji.native);
                                        setIsPopoverOpen(false);
                                    }}
                                    theme="light"
                                    set="native"
                                    previewPosition="none"
                                    skinTonePosition="none"
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className={cn(
                    "max-w-[450px] px-4 py-2.5 rounded-2xl relative shadow-sm transition-all duration-500",
                    isOutbound
                        ? "bg-green-100 text-green-900 rtl:rounded-tl-none ltr:rounded-tr-none"
                        : "bg-white text-gray-800 rtl:rounded-tr-none ltr:rounded-tl-none border border-gray-100",
                    isHighlighted && (isOutbound ? "bg-green-200 ring-4 ring-green-400/20" : "bg-blue-50 ring-4 ring-blue-400/20")
                )}>
                    {renderContent()}

                    <div className={cn(
                        "flex items-center gap-1 justify-end mt-1",
                        isOutbound ? "text-green-600/60" : "text-gray-400"
                    )}>
                        <span className="text-[10px]">{time}</span>
                        {isOutbound && <StatusIcon status={message.status} />}
                    </div>

                    {/* Reactions Display */}
                    {message.reaction && (
                        <div className={cn(
                            "absolute -bottom-3 flex items-center justify-center w-6 h-6 bg-white border border-gray-100 rounded-full shadow-sm text-sm",
                            isOutbound ? "end-2" : "start-2"
                        )}>
                            <span>{message.reaction}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
