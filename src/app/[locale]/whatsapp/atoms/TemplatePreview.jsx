"use client";

import React, { useState } from "react";
import {
    FileText,
    Image as ImageIcon,
    Video,
    MapPin,
    File as FileIcon
} from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Reusable WhatsApp Template Preview Component
 * 
 * @param {Object} template - The template data
 * @param {string} template.headerType - "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION"
 * @param {string} template.headerText - Text for TEXT header
 * @param {string} template.bodyText - Main template body text with {{1}}, {{2}}...
 * @param {string} template.footerText - Small footer text
 * @param {Object} template.examples - Object with mapping of variable index to example value { "1": "John", "2": "Order #123" }
 */
export default function TemplatePreview({ template }) {
    const [hovered, setHovered] = useState(false);

    const {
        headerType = "TEXT",
        headerText = "",
        bodyText = "Hello {{1}}, your order {{2}} is confirmed.",
        footerText = "",
        examples = { "1": "Valued Customer", "2": "#0000" }
    } = template || {};

    // Function to process body text for variables
    const renderBody = () => {
        // Regex to find {{number}}
        const parts = bodyText.split(/(\{\{\d+\}\})/g);

        return parts.map((part, index) => {
            const match = part.match(/\{\{(\d+)\}\}/);
            if (match) {
                const varIndex = match[1];
                const exampleValue = examples[varIndex] || `Variable ${varIndex}`;

                return (
                    <span
                        key={index}
                        className={cn(
                            "inline-block px-1 rounded mx-0.5 transition-all duration-300",
                            hovered
                                ? "bg-primary/10 text-primary font-bold"
                                : "bg-slate-100 dark:bg-slate-800 text-[#282828] font-mono text-[10px]"
                        )}
                    >
                        {hovered ? exampleValue : part}
                    </span>
                );
            }
            return part;
        });
    };

    const renderHeader = () => {
        switch (headerType) {
            case "IMAGE":
                return (
                    <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-t-sm border-b border-slate-100 dark:border-slate-800">
                        <ImageIcon size={48} className="text-slate-400" />
                    </div>
                );
            case "VIDEO":
                return (
                    <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-t-sm border-b border-slate-100 dark:border-slate-800">
                        <Video size={48} className="text-slate-400" />
                    </div>
                );
            case "DOCUMENT":
                return (
                    <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-t-sm border-b border-slate-100 dark:border-slate-800">
                        <FileIcon size={48} className="text-slate-400" />
                    </div>
                );
            case "LOCATION":
                return (
                    <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-t-sm border-b border-slate-100 dark:border-slate-800">
                        <MapPin size={48} className="text-slate-400" />
                    </div>
                );
            case "TEXT":
                if (!headerText) return null;
                return (
                    <div className="pt-2 pe-2 font-bold text-[13px] text-[#000000C2] ">
                        {headerText}
                    </div>
                );
            default:
                return null;
        }
    };

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div
            className="w-full max-w-[300px] mx-auto bg-[#e5ddd5] dark:bg-[#0b141a] p-4  shadow-inner relative overflow-hidden"
            dir={template?.language === "ar" ? "rtl" : "ltr"}
            style={{
                backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                backgroundSize: "contain"
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="bg-white dark:bg-[#1f2c33] rounded-sm rounded-tl-none shadow-sm overflow-hidden relative min-w-[200px]">
                {/* Pointer Arrow */}
                <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white dark:border-t-[#1f2c33] border-l-[10px] border-l-transparent" />

                {/* Header Section */}
                {renderHeader()}

                {/* Body Section */}
                <div className="px-2 space-y-1">
                    <div className="text-[13px] leading-relaxed break-words whitespace-pre-wrap dark:text-slate-200">
                        {renderBody()}
                    </div>

                    {footerText && (
                        <div className="text-[11px] text-[#00000073] dark:text-slate-500 mt-1">
                            {footerText}
                        </div>
                    )}

                    {/* Time Stamp */}
                    <div className="flex justify-end mt-1">
                        <span className="text-[9px] text-[#00000066] uppercase">
                            {currentTime}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
