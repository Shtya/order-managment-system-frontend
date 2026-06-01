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

export default function MessageInput({ onSend, replyTo, onCancelReply, onScrollToMessage }) {
    const t = useTranslations("chats");
    const {
        selectedConversation,
        selectedAccount,
        setSelectedAccount,
        accounts,
        setPendingMedia,
        setShowInteractiveModal,
        setShowLocationRequestModal,
        setShowContactModal,
        setShowLocationModal,
        setShowListModal,
        setShowTemplateModal
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

    const handleActionClick = (type) => {
        if (["image", "video", "document"].includes(type)) {
            setFileType(type);
            if (fileInputRef.current) {
                fileInputRef.current.accept = type === "image" ? "image/*" : type === "video" ? "video/*" : "*/*";
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
        if (!text.trim() && !isRecording) return;

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
        // { icon: ImageIcon, label: t("messageTypes.image"), color: "text-purple-500", type: "image" },
        // { icon: Video, label: t("messageTypes.video"), color: "text-red-500", type: "video" },
        // { icon: FileText, label: t("messageTypes.document"), color: "text-orange-500", type: "document" },
        // { icon: MapPin, label: t("messageTypes.sendLocation"), color: "text-green-500", type: "location" },
        // { icon: MapIcon, label: t("messageTypes.requestLocation"), color: "text-green-500", type: "location_request" },
        // { icon: UserCircle, label: t("messageTypes.contact"), color: "text-teal-500", type: "contact" },
        // { icon: List, label: t("messageTypes.list"), color: "text-blue-600", type: "list" },
        // { icon: LayoutGrid, label: t("messageTypes.interactive"), color: "text-green-600", type: "interactive" },
        { icon: MessageSquareQuote, label: t("messageTypes.template"), color: "text-gray-600", type: "template" },
    ];

    return (
        <div className="p-4 border-t bg-white relative">
            {/* Reply Preview */}
            {replyTo && (
                <div
                    onClick={() => onScrollToMessage && onScrollToMessage(replyTo.id)}
                    className="mx-auto mb-2 p-3 bg-gray-50 border-l-4 border-green-500 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-2 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Reply className="w-4 h-4 text-green-600 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-green-600 uppercase">Replying to message</p>
                            <p className="text-xs text-gray-500 truncate italic">
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
                        className="p-1 hover:bg-gray-200 rounded-full"
                    >
                        <X className="w-4 h-4 text-gray-400" />
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
                            theme="light"
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
                                className={cn("p-2 hover:bg-gray-100 rounded-full transition-colors", showEmoji && "text-green-600 bg-gray-100")}
                            >
                                <Smile className="w-6 h-6 text-gray-400" />
                            </button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                                        <Plus className="w-6 h-6 text-gray-400 transition-transform group-data-[state=open]:rotate-45 group-data-[state=open]:text-green-600" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" side="top" className="w-64 mb-2 rounded-xl! p-2 shadow-xl border">
                                    <div className="grid grid-cols-1 gap-1">
                                        {actions.map((action, idx) => (
                                            <DropdownMenuItem
                                                key={idx}
                                                onClick={() => handleActionClick(action.type)}
                                                className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <action.icon className={cn("w-5 h-5", action.color)} />
                                                <span className="text-sm font-medium text-gray-700">{action.label}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                    {isRecording && (
                        <button
                            onClick={cancelRecording}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    )}
                </div>

                <div className={cn(
                    "flex-1 bg-gray-50 rounded-2xl border px-4 py-2 flex items-center min-h-[48px] transition-all",
                    isRecording && "bg-red-50 border-red-100"
                )}>
                    {isRecording ? (
                        <div className="flex items-center justify-between w-full px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-sm font-medium text-red-600">{formatTime(recordingTime)}</span>
                            </div>
                            <span className="text-xs text-red-400 animate-pulse">Recording...</span>
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={text}
                            autoFocus
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t("typeMessage")}
                            className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm max-h-32 py-1 outline-none focus-visible:outline-none!"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                    )}
                </div>

                <div className="flex items-center mb-1 shrink-0">
                    <div className={cn(
                        "flex rounded-lg transition-colors overflow-hidden h-10 shadow-sm",
                        (text.trim() || isRecording) ? "bg-green-600" : "bg-gray-200"
                    )}>
                        <button
                            // onClick={text.trim() || isRecording ? handleSend : startRecording}
                            onClick={handleSend}
                            className={cn(
                                "px-4 flex items-center justify-center min-w-[80px] transition-colors",
                                (text.trim() || isRecording) ? "hover:bg-green-700" : "hover:bg-gray-300",
                                accounts.length > 1 && !isRecording && "border-e border-green-500/30"
                            )}
                        >
                            <div className="flex flex-col items-center">
                                <div className="flex items-center">
                                    <span className="text-white text-sm font-medium mr-2">{t("send")}</span>
                                    <Send className="w-4 h-4 text-white" />
                                </div>
                                {selectedAccount && (
                                    <span className="text-[10px] text-white/80 font-bold truncate max-w-[100px]">
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
                                        text.trim() ? "hover:bg-green-700" : "hover:bg-gray-300"
                                    )}>
                                        <ChevronDown className={cn("w-4 h-4", text.trim() ? "text-white" : "text-gray-500")} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-50 rounded-md!">
                                    {accounts.map((acc) => (
                                        <DropdownMenuItem
                                            key={acc.id}
                                            onClick={() => setSelectedAccount(acc)}
                                            className={cn("flex flex-col items-start gap-0.5 cursor-pointer", selectedAccount?.id === acc.id && "bg-green-50 text-green-600")}
                                        >
                                            <span className="font-bold text-sm break-all">{acc.name}</span>
                                            <span className="text-[10px] opacity-70">{acc.mobileNumber}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

