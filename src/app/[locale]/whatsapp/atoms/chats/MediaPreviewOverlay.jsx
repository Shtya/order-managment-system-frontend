"use client";

import React, { useState } from "react";
import { X, Send, FileText, Video, Image as ImageIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { useConversation } from "./ConversationContext";

export default function MediaPreviewOverlay() {
    const { pendingMedia, setPendingMedia, handleSendMessage } = useConversation();
    const [caption, setCaption] = useState("");

    if (!pendingMedia) return null;

    const handleSend = () => {

        handleSendMessage({
            type: pendingMedia.type,
            [pendingMedia.type]: { url: pendingMedia.preview, name: pendingMedia.file.name },
            caption: caption.trim(),
            file: pendingMedia.file
        });
        setPendingMedia(null);
        setCaption("");
    };

    const renderPreview = () => {
        switch (pendingMedia.type) {
            case "image":
                return (
                    <img
                        src={pendingMedia.preview}
                        alt="Preview"
                        className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                    />
                );
            case "video":
                return (
                    <video
                        src={pendingMedia.preview}
                        controls
                        className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
                    />
                );
            case "document":
                const fileSize = pendingMedia.file.size > 1024 * 1024
                    ? `${(pendingMedia.file.size / (1024 * 1024)).toFixed(1)} MB`
                    : `KB ${(pendingMedia.file.size / 1024).toFixed(1)}`;
                const fileExt = pendingMedia.file.name.split('.').pop()?.toUpperCase() || "DOC";

                return (
                    <div className="flex flex-col items-center gap-6 p-12 bg-gray-50 dark:bg-card/40 rounded-3xl border border-border shadow-lg min-w-[340px] animate-in zoom-in-95 duration-300">
                        <div className="w-32 h-32 bg-white dark:bg-input/20 rounded-2xl flex items-center justify-center shadow-inner border border-border/50">
                            <FileText size={64} className="text-primary opacity-80" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-bold text-lg text-foreground max-w-[280px] truncate">
                                {pendingMedia.file.name}
                            </h3>
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    No preview available
                                </span>
                                <span className="text-[11px] text-muted-foreground/70 font-mono mt-1">
                                    <span className="font-bold"></span>{fileSize} <span className="text-muted-foreground/70">-</span> <span>{fileExt}</span>
                                </span>
                            </div>
                        </div>
                    </div >
                );
            default:
                return null;
        }
    };

    return (
        <div className="absolute inset-0 z-[100] bg-background/95 dark:bg-background/98 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-muted/50 dark:bg-card/50 backdrop-blur-sm border-b border-border text-foreground">
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => setPendingMedia(null)}
                        className="p-2 hover:bg-accent/50 rounded-full transition-colors"
                    >
                        <X className= "w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <span className="font-medium text-xs md:text-sm truncate max-w-[150px] md:max-w-xs">{pendingMedia.file.name}</span>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
                {renderPreview()}
            </div>

            {/* Footer / Caption Input */}
            <div className="p-4 md:p-6 bg-muted/80 dark:bg-card/80 backdrop-blur-md border-t border-border">
                <div className="max-w-4xl mx-auto flex items-end gap-3 md:gap-4">
                    <div className="flex-1 bg-card dark:bg-input/50 rounded-xl border border-border px-3 md:px-4 py-2.5 md:py-3 flex items-center">
                        <input
                            autoFocus
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Type a caption..."
                            className="w-full bg-transparent border-none focus:ring-0 text-foreground text-sm outline-none focus-visible:outline-none!"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSend();
                                }
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        className="w-10 h-10 md:w-12 md:h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0"
                    >
                        <Send className= "w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
