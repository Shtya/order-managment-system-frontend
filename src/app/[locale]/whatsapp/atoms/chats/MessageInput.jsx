"use client";

import { useTranslations } from "next-intl";
import {
    Send, Smile, Paperclip, Plus,
    Type, Image as ImageIcon, Video, FileText,
    Music, MapPin, UserCircle, List,
    LayoutGrid, MessageSquareQuote, ChevronDown,
    X, Reply, Mic, Trash2, StopCircle,
    MapIcon
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/utils/cn";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import api from "@/utils/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConversation } from "./ConversationContext";
import { useAuth } from "@/context/AuthContext";
import { WHATSAPP_DOCUMENT_ACCEPT, WHATSAPP_IMAGE_ACCEPT, WHATSAPP_SUPPORTED_ACCEPT, WHATSAPP_VIDEO_ACCEPT } from "@/utils/whatsapp-healper";

export default function MessageInput({ onSend, replyTo, onCancelReply, onScrollToMessage, setShowInteractiveModal, setShowLocationRequestModal, setShowContactModal, setShowLocationModal, setShowListModal, setShowTemplateModal }) {
    const t = useTranslations("chats");
    const { hasPermission } = useAuth();
    const {
        selectedConversation,
        selectedAccount,
        setSelectedAccount,
        accounts,
        accountsLoading,
        setPendingMedia
    } = useConversation();
    const [text, setText] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const recordingTimeRef = useRef(0);
    const timerRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const [fileType, setFileType] = useState("");

    const isDisabled = accountsLoading || accounts.length === 0;

    const handleActionClick = (type) => {
        if (["image", "video", "document"].includes(type)) {
            setFileType(type);
            if (fileInputRef.current) {
                fileInputRef.current.accept = type === "image" ? WHATSAPP_IMAGE_ACCEPT : type === "video" ? WHATSAPP_VIDEO_ACCEPT : WHATSAPP_DOCUMENT_ACCEPT;
                fileInputRef.current.click();
            }
        } else if (type === "interactive") {
            setShowInteractiveModal(true);
        } else if (type === "location_request") {
            setShowLocationRequestModal(true);
        } else if (type === "contact") {
            setShowContactModal(true);
        } else if (type === "location") {
            setShowLocationModal(true);
        } else if (type === "list") {
            setShowListModal(true);
        } else if (type === "template") {
            setShowTemplateModal(true);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPendingMedia({
                    file,
                    preview: reader.result,
                    type: fileType
                });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = null; // Reset for same file re-selection
    };

    // Focus textarea when conversation or reply changes
    useEffect(() => {
        if ((selectedConversation?.id || replyTo) && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [selectedConversation?.id, replyTo]);

    useEffect(() => {
        if (isRecording) {
            setRecordingTime(0);
            recordingTimeRef.current = 0;
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const next = prev + 1;
                    recordingTimeRef.current = next;
                    return next;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleSend = () => {
        if (isDisabled || (!text.trim() && !isRecording)) return;

        if (isRecording) {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                // The onstop handler defined in startRecording will handle the actual sending
                mediaRecorder.stop();
            }
        } else {
            onSend({
                type: "text",
                text: text.trim(),
                accountId: selectedAccount?.id,
                replyToId: replyTo?.id
            });
            setText("");
        }
        if (onCancelReply) onCancelReply();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
                const audioUrl = URL.createObjectURL(audioBlob);

                onSend({
                    type: "audio",
                    audio: {
                        url: audioUrl,
                        duration: recordingTimeRef.current // Use ref to get latest time
                    },
                    accountId: selectedAccount?.id,
                    replyToId: replyTo?.id
                });

                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setMediaRecorder(null);
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            // Overwrite onstop to just cleanup without sending
            mediaRecorder.onstop = () => {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setMediaRecorder(null);
            };
            mediaRecorder.stop();
        } else {
            setIsRecording(false);
        }
    };

    const addEmoji = (emoji) => {
        setText(text + emoji.native);
        // Focus back to textarea after picking emoji
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    };
    
    const actions = [
        { icon: ImageIcon, label: t("messageTypes.image"), color: "text-purple-500", type: "image" },
        { icon: Video, label: t("messageTypes.video"), color: "text-red-500", type: "video" },
        { icon: FileText, label: t("messageTypes.document"), color: "text-orange-500", type: "document" },
        //audio message
        //Call-to-Action URL Button Messages
        //Sticker Messages
        { icon: MapPin, label: t("messageTypes.location"), color: "text-green-500", type: "location" },
        { icon: MapIcon, label: t("messageTypes.location_request"), color: "text-green-500", type: "location_request" },
        { icon: UserCircle, label: t("messageTypes.contact"), color: "text-teal-500", type: "contact" },
        { icon: List, label: t("messageTypes.list"), color: "text-blue-600", type: "list" },
        { icon: LayoutGrid, label: t("messageTypes.interactive"), color: "text-green-600", type: "interactive" },
        { icon: MessageSquareQuote, label: t("messageTypes.template"), color: "text-gray-600", type: "template" },
    ];

    return (
        <div className="flex-shrink-0 bg-card border-t border-border p-4 relative">
            {/* Reply Preview */}
            {replyTo && (
                <div
                    onClick={() => onScrollToMessage && onScrollToMessage(replyTo.id)}
                    className="mx-auto mb-3 p-3 bg-muted/30 border-s-4 border-primary rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Reply className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-primary uppercase">Replying to message</p>
                            <p className="text-xs text-muted-foreground truncate italic">
                                {replyTo.content?.text?.body || replyTo.lastMessagePreview || "..."}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancelReply();
                            textareaRef.current?.focus();
                        }}
                        className="p-1.5 hover:bg-accent/50 rounded-full text-muted-foreground transition-colors shrink-0 ms-4"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-3 mx-auto relative">
                {/* Emoji Picker */}
                {showEmoji && (
                    <div className="absolute bottom-full mb-2 start-0 z-50 shadow-2xl">
                        <Picker
                            data={data}
                            onEmojiSelect={addEmoji}
                            onClickOutside={() => setShowEmoji(false)}
                            theme="auto"
                            set="native"
                        />
                    </div>
                )}

                <div className="flex items-center gap-1 mb-1">
                    {!isRecording && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={() => setShowEmoji(!showEmoji)}
                                className={cn("p-2 hover:bg-accent/50 rounded-full transition-colors", showEmoji && "text-primary bg-muted", isDisabled && "opacity-50 cursor-not-allowed")}
                                disabled={!hasPermission("whatsapp.send") || isDisabled}
                            >
                                <Smile className="w-6 h-6 text-muted-foreground/60" />
                            </button>

                            {hasPermission("whatsapp.send") && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button 
                                            className={cn("p-2 hover:bg-accent/50 rounded-full transition-colors group", isDisabled && "opacity-50 cursor-not-allowed")}
                                            disabled={isDisabled}
                                        >
                                            <Plus className="w-6 h-6 text-muted-foreground/60 transition-transform group-data-[state=open]:rotate-45 group-data-[state=open]:text-primary" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" side="top" className="w-64 mb-2 rounded-xl! p-2 shadow-xl border border-border bg-card">
                                        <div className="grid grid-cols-1 gap-1">
                                            {actions.map((action, idx) => (
                                                <DropdownMenuItem
                                                    key={idx}
                                                    onClick={() => !isDisabled && handleActionClick(action.type)}
                                                    className={cn("flex items-center gap-3 w-full p-2 hover:bg-accent/50 rounded-lg transition-colors cursor-pointer", isDisabled && "opacity-50 cursor-not-allowed pointer-events-none")}
                                                >
                                                    <action.icon className={cn("w-5 h-5", action.color)} />
                                                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </>
                    )}
                    {isRecording && (
                        <button
                            onClick={cancelRecording}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-full transition-colors"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    )}
                </div>

                <div className={cn(
                    "flex-1 bg-muted/50 rounded-2xl border border-border px-4 py-2 flex items-center min-h-[48px] transition-all",
                    isRecording && "bg-destructive/5 border-destructive/20"
                )}>
                    {isRecording ? (
                        <div className="flex items-center justify-between w-full px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                                <span className="text-sm font-medium text-destructive">{formatTime(recordingTime)}</span>
                            </div>
                            <span className="text-xs text-destructive/60 animate-pulse">Recording...</span>
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={text}
                            autoFocus
                            onChange={(e) => setText(e.target.value)}
                            placeholder={hasPermission("whatsapp.send") ? t("typeMessage") : t("noPermissionToSend")}
                            disabled={!hasPermission("whatsapp.send") || isDisabled}
                            className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm max-h-32 py-1 outline-none focus-visible:outline-none! text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    !isDisabled && handleSend();
                                }
                            }}
                        />
                    )}
                </div>

                <div className="flex items-center gap-2 mb-1 shrink-0">
                    <div className={cn(
                        "flex rounded-lg transition-colors overflow-hidden h-10 shadow-sm",
                        (text.trim() || isRecording) ? "bg-green-600 dark:bg-green-700" : "bg-gray-200 dark:bg-gray-300"
                    )}>
                        <button
                            // onClick={text.trim() || isRecording ? handleSend : startRecording}
                            onClick={!isDisabled ? handleSend : () => {}}
                            disabled={!hasPermission("whatsapp.send") || isDisabled}
                            className={cn(
                                "px-4 flex items-center justify-center min-w-[80px] transition-colors",
                                (text.trim() || isRecording) ? "hover:bg-green-700" : "hover:bg-gray-300",
                                accounts.length > 1 && !isRecording && "border-e border-green-500/30",
                                (!hasPermission("whatsapp.send") || isDisabled) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div className="flex flex-col items-center">
                                <div className="flex items-center">
                                    <span className="text-primary-foreground text-sm font-medium mr-2">{t("send")}</span>
                                    <Send className="w-4 h-4 text-primary-foreground" />
                                </div>
                                {selectedAccount && (
                                    <span className="text-[10px] text-primary-foreground/80 font-bold truncate max-w-[100px]">
                                        {selectedAccount.name}
                                    </span>
                                )}
                            </div>
                        </button>
                        {accounts.length > 1 && !isRecording && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "px-2 transition-colors flex items-center justify-center",
                                        text.trim() ? "hover:bg-primary/90" : "hover:bg-muted/80"
                                    )}>
                                        <ChevronDown className={cn("w-4 h-4", text.trim() ? "text-primary-foreground" : "text-muted-foreground/60")} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-50 rounded-md! bg-card border-border">
                                    {accounts.map((acc) => (
                                        <DropdownMenuItem
                                            key={acc.id}
                                            onClick={() => setSelectedAccount(acc)}
                                            className={cn("flex flex-col items-start gap-0.5 cursor-pointer", selectedAccount?.id === acc.id && "bg-primary/5 text-primary")}
                                        >
                                            <span className="font-bold text-sm break-all text-foreground">{acc.name}</span>
                                            <span className="text-[10px] text-muted-foreground/70">{acc.mobileNumber}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* <div className={cn(
                        "flex rounded-lg transition-colors overflow-hidden h-10 shadow-sm",
                        isRecording ? "bg-destructive" : "bg-gray-200 dark:bg-gray-300"
                    )}>
                        <button
                            onClick={isRecording ? handleSend : startRecording}
                            disabled={!hasPermission("whatsapp.send")}
                            className={cn(
                                "p-2 flex items-center justify-center transition-all duration-200",
                                isRecording ? "bg-destructive text-white scale-110" : "hover:bg-accent/50 text-muted-foreground/60",
                                !hasPermission("whatsapp.send") && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isRecording ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

