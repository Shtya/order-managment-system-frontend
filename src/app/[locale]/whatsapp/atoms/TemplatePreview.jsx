"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Image as ImageIcon,
    Video,
    MapPin,
    File as FileIcon,
    Phone,
    ExternalLink,
    Reply,
    List,
    X,
    ChevronDown,
    Copy,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
    isCorrectVariableFormat,
    isPotentialVariable,
    replaceVariables,
    formatText,
    getMediaUrl,
    getMediaUrlWithCache,
    handleMediaClick,
    VAR_REGEX,
} from "@/utils/whatsapp-healper";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { FaLocationDot } from "react-icons/fa6";
import { useClipboard } from "@/hook/useClipboard";

// --- Sub-components ---

/**
 * Reusable WhatsApp Button Menu (Bottom Sheet)
 */
export function WhatsAppButtonMenu({
    isOpen,
    onClose,
    buttons = [],
    locale = "en",
    type = "BUTTONS", // "BUTTONS" | "RADIO" | "LIST"
    title,
    subtitle = "",
    radioOptions = [],
    sections = [],
    seeAllOptionsLabel,
    isPortal = false,
}) {
    const t = useTranslations("whatsApp.templates.preview");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const displayTitle = title || t("allOptions");

    const actionButtons = buttons.filter(btn => btn.type !== "CUSTOM");
    const customButtons = buttons.filter(btn => btn.type === "CUSTOM");

    const menuContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    // 1. Made the background a motion.div for a rapid fade out
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }} 
                    className={cn(
                        isPortal ? "fixed inset-0 z-[100]" : "absolute inset-0 z-[100]",
                        "flex items-center justify-center bg-black/40 overflow-hidden"
                    )}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        // 2. Overriding the exit animation to be very fast (100ms)
                        exit={{ 
                            opacity: 0, 
                            scale: 0.97, 
                            transition: { duration: 0.1, ease: "easeOut" } 
                        }}
                        transition={{
                            type: "spring",
                            duration: 0.12,
                            stiffness: 450,
                            damping: 35,
                            mass: 0.5,
                        }}
                        className="bg-white dark:bg-slate-950 rounded-xl p-4 shadow-2xl max-h-[80%] w-[90%] max-w-md flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <button onClick={onClose} className="p-1 mt-0.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                            <div className="flex-1 px-4 text-center">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[15px] leading-tight">{displayTitle}</h3>
                                {subtitle && <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{subtitle}</p>}
                            </div>
                            <div className="w-8" /> {/* Spacer */}
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto space-y-1 custom-scrollbar pb-2">
                            {type === "LIST" ? (
                                <div className="flex flex-col">
                                    {sections.map((section, sIdx) => (
                                        <div key={sIdx} className="flex flex-col mb-4 last:mb-0">
                                            {section.title && (
                                                <div className="px-2 py-1.5 text-[13px] font-bold text-[#00a884] uppercase tracking-wider">
                                                    {section.title}
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                {section.rows?.map((row, rIdx) => (
                                                    <div key={rIdx} className="px-2 py-3 hover:bg-gray-100 dark:hover:bg-[#182229] rounded-lg transition-colors cursor-default group">
                                                        <p className="text-[15px] text-slate-700 dark:text-slate-200 font-medium group-hover:text-[#00a884]">{row.title}</p>
                                                        {row.description && (
                                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{row.description}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : type === "BUTTONS" ? (
                                <>
                                    {/* Action Buttons */}
                                    {actionButtons.map((btn, idx) => (
                                        <div key={btn.id || `action-${idx}`} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#182229] rounded-lg cursor-default transition-colors group">
                                            <div className="text-slate-500 group-hover:text-[#00a884]">
                                                {btn.type === "PHONE_NUMBER" && <Phone size={18} />}
                                                {btn.type === "VISIT_WEBSITE" && <ExternalLink size={18} />}
                                                {btn.type === "WHATSAPP_CALL" && <Phone size={18} />}
                                            </div>
                                            <span className="text-[14px] text-slate-700 dark:text-slate-300 font-medium">{btn.text || t("actionButtonPlaceholder")}</span>
                                        </div>
                                    ))}

                                    {/* Separator if both types exist */}
                                    {actionButtons.length > 0 && customButtons.length > 0 && (
                                        <div className="h-px bg-[#e8f5e9] dark:bg-slate-800 my-2 mx-2" />
                                    )}

                                    {/* Custom Buttons */}
                                    {customButtons.map((btn, idx) => (
                                        <div key={btn.id || `custom-${idx}`} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#182229] rounded-lg cursor-default transition-colors group">
                                            <div className="text-slate-500 group-hover:text-[#00a884]">
                                                <Reply size={18} className={cn(locale === "ar" ? "scale-x-[-1]" : "")} />
                                            </div>
                                            <span className="text-[14px] text-slate-700 dark:text-slate-300 font-medium">{btn.text || t("quickReplyPlaceholder")}</span>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="space-y-4 py-2">
                                    {radioOptions.map((option, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedIndex(idx)}
                                            className="flex items-center justify-between px-2 py-1 cursor-pointer group"
                                        >
                                            <span className={cn(
                                                "text-[15px] transition-colors",
                                                selectedIndex === idx ? "text-[#00a884] font-medium" : "text-slate-700 dark:text-slate-200"
                                            )}>
                                                {option.label}
                                            </span>
                                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                selectedIndex === idx ? "border-[#00a884]" : "border-slate-300 dark:border-slate-600"
                                            )}>
                                                {selectedIndex === idx && <div className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (isPortal && mounted) {
        return createPortal(menuContent, document.body);
    }

    return menuContent;
}

/**
 * Special Call Permissions Bubble
 */
export function WhatsAppCallPermissionsBubble({ locale = "en", onOpenMenu }) {
    const t = useTranslations("whatsApp.templates");
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={cn(
            "bg-whatsapp-message rounded-sm shadow-sm p-1.5 pe-2 relative min-w-[200px] max-w-[95%] mt-2",
        )}>
            <div className="flex items-start gap-3 p-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-[14px] text-slate-800 dark:text-white leading-tight">
                        {t("preview.callBubbleHeading")}
                    </h4>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-tight">
                        {t("preview.callBubbleBody")}
                    </p>
                </div>
                <span className="text-[10px] text-slate-400 self-end mb-[-4px]">
                    {currentTime}
                </span>
            </div>

            <button
                onClick={onOpenMenu}
                className="w-full border-t border-slate-100 dark:border-slate-800 mt-2 py-2 text-[#00a884] text-[13.5px] font-medium flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
                {t("preview.callBubbleChoose")}
                <ChevronDown size={14} />
            </button>
        </div>
    );
}

/**
 * Reusable WhatsApp Template Preview Component
 *
 * @param {Object} template - Row shaped like WhatsappTemplateEntity (API) or a legacy flat preview object.
 * @param {string} [template.language] - Template language ("ar" | "en").
 * @param {string} [template.subCategory] - TemplateSubCategory value (e.g. "call_permissions_request").
 * @param {Object} [template.templateConfig] - TemplateConfig JSON: headerType, headerText, headerExample, headerUrl,
 *   bodyText, footerText, examples, buttons (CUSTOM | PHONE_NUMBER | VISIT_WEBSITE | WHATSAPP_CALL).
 * @param {boolean} [flat]
 * @param {boolean} [hasHeader]
 */
export default function TemplatePreview({
    template,
    flat = false,
    hasHeader = true,
    seeAllOptionsLabel,
    isInteractive = false,
    isList = false,
    forceShowExamples = false,
    hideToggleAction = false,
    bgTransparent = false,
    isChatBubble = false,
    isUploading = false,
    onMediaLoad = () => {},
}) {

    const t = useTranslations("whatsApp.templates");
    const [showExamples, setShowExamples] = useState(forceShowExamples || isChatBubble);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPermissionsMenuOpen, setIsPermissionsMenuOpen] = useState(false);
    const [mediaLoading, setMediaLoading] = useState(true);
    const [mediaError, setMediaError] = useState(false);
    const locale = useLocale();
    const { handleCopy } = useClipboard();

    useEffect(() => {
        if (forceShowExamples) setShowExamples(true);
    }, [forceShowExamples]);

 

    const raw = template || {};
    const cfgSource =
        raw.templateConfig != null && typeof raw.templateConfig === "object"
            ? raw.templateConfig
            : raw.preview != null && typeof raw.preview === "object"
                ? raw.preview
                : typeof raw === "object" &&
                    (raw.headerType != null ||
                        raw.bodyText != null ||
                        raw.footerText != null ||
                        (Array.isArray(raw.buttons) && raw.buttons.length > 0) ||
                        raw.headerText != null ||
                        raw.headerUrl != null)
                    ? raw
                    : null;

    const subCategory = raw.subCategory ?? raw.subcategory ?? "";

    const {
        headerType = "TEXT",
        headerText = "",
        headerExample = "",
        headerUrl = "",
        parameterFormat = "positional",
        locationData = null,
        bodyText = "",
        footerText = "",
        buttons = [],
        examples = {},
        uiSubcategory = "",
        useCustomValidity = false,
        validityPeriod = "10m",
        otpCopyButtonText = "",
        authMethod = "COPY_CODE",
    } = cfgSource != null
            ? { bodyText: "", buttons: [], examples: {}, ...cfgSource }
            : { bodyText: "", buttons: [], examples: {} };
    
    const isPositional = parameterFormat === "positional";
    const isArabic = /[\u0600-\u06FF]/.test(bodyText || "");
    const language = !!raw.language ? raw.language : isArabic ? "ar" : "en";
    
    const parsedBodyParts = useMemo(() => {
        const text =
            bodyText && String(bodyText).trim()
                ? bodyText
                : t("preview.bodyPlaceholder");

        const parts = text.split(/(\{[^{}]*\}|\{\{[^{}]*\}\})/g).map((part) => {
            
            if (isPositional && isCorrectVariableFormat(part, "positional")) {
                const m = part.match(VAR_REGEX.positional);
                const variableName = m?.[1];
                return {
                    type: "variable",
                    variableName,
                    raw: part,
                    isValid: true,
                    exampleValue: examples?.[variableName] ?? `{{${variableName}}}`,
                };
            }
            if (!isPositional && isCorrectVariableFormat(part, "named")) {
                const m = part.match(VAR_REGEX.named);
                const variableName = m?.[1];
                return {
                    type: "variable",
                    variableName,
                    raw: part,
                    isValid: true,
                    exampleValue: examples?.[variableName] ?? part,
                };
            }
            if (isPotentialVariable(part)) {
                return {
                    type: "variable",
                    raw: part,
                    isValid: false,
                };
            }
            return { type: "text", value: part };
        });

        return parts.map(part => {
            if (part.type === 'text') {
                return { ...part, formatted: formatText(part.value) };
            }
            return part;
        });
    }, [bodyText, examples, t]);

    const parsedHeaderParts = useMemo(() => {
        if (!headerText) return [];

        const text = headerText;

        const parts = text.split(/(\{[^{}]*\}|\{\{[^{}]*\}\})/g).map((part) => {
            
            if (isPositional && isCorrectVariableFormat(part, "positional")) {
                const m = part.match(VAR_REGEX.positional);
                const variableName = m?.[1];
                return {
                    type: "variable",
                    variableName,
                    raw: part,
                    isValid: true,
                    exampleValue: headerExample ?? examples?.[variableName] ?? `{{${variableName}}}`,
                };
            }
            if (!isPositional && isCorrectVariableFormat(part, "named")) {
                const m = part.match(VAR_REGEX.named);
                const variableName = m?.[1];
                return {
                    type: "variable",
                    variableName,
                    raw: part,
                    isValid: true,
                    exampleValue: headerExample ?? examples?.[variableName] ?? part,
                };
            }
            if (isPotentialVariable(part)) {
                return {
                    type: "variable",
                    raw: part,
                    isValid: false,
                };
            }
            return { type: "text", value: part };
        });

        return parts.map(part => {
            if (part.type === 'text') {
                return { ...part, formatted: formatText(part.value) };
            }
            return part;
        });
    }, [headerText, headerExample, examples, isPositional, t]);
   useEffect(() => {
        setMediaLoading(true);
        setMediaError(false);
    }, [headerUrl, headerType]);
    const renderHeader = () => {
        const mediaClass = "aspect-video w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-sm overflow-hidden border-b border-slate-100 dark:border-slate-800 mb-2 relative";

        const uploadOverlay = isUploading && (
            <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-widest">{t("preview.uploading")}</span>
            </div>
        );

        // Create a mock message object for getMediaUrl
        const mockMessage = { accountId: null };
        // Create content object based on headerType and headerUrl
        const createMediaContent = (type, urlOrId) => {
            if (urlOrId) {
                // Check if it's a URL or ID
                if (urlOrId.startsWith('http://') || urlOrId.startsWith('https://') || urlOrId.startsWith('blob:')) {
                    return { [type]: { localUrl: urlOrId } };
                } else {
                    return { [type]: { id: urlOrId } };
                }
            }
            return { [type]: {} };
        };

        switch (headerType) {
            case "IMAGE":
                const imageContent = createMediaContent('image', headerUrl);
                const imageUrl = headerUrl ? getMediaUrlWithCache(imageContent, 'image', mockMessage) : null;
                return (
                    <div className={mediaClass}>
                        {uploadOverlay}
                        {imageUrl ? (
                            <>
                                {(mediaLoading || isUploading) && !mediaError && (
                                    <div className="absolute bg-muted/30 inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/60" />
                                        {isUploading && <span className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">{t("preview.uploading")}</span>}
                                    </div>
                                )}
                                {mediaError ? (
                                    <div className="flex flex-col bg-muted/30 items-center gap-2 p-6 text-muted-foreground/60">
                                        <AlertCircle size={32} />
                                        <span className="text-xs font-medium">Failed to load image</span>
                                    </div>
                                ) : (
                                    <img
                                        src={imageUrl}
                                        alt="Header"
                                        className={cn(
                                            "w-full h-full object-cover cursor-pointer transition-opacity duration-300",
                                            (mediaLoading && !isUploading) ? "opacity-0" : "opacity-100"
                                        )}
                                        loading="lazy"
                                        onLoad={() => {
                                            setMediaLoading(false)
                                            if (onMediaLoad) {
                                                onMediaLoad();
                                            }   
                                        }}
                                        onError={() => {
                                            setMediaLoading(false);
                                            setMediaError(true);
                                             if (onMediaLoad) {
                                                onMediaLoad();
                                            }
                                        }}
                                        onClick={() => handleMediaClick("image", imageContent)}
                                    />
                                )}
                            </>
                        ) : (
                            <ImageIcon size={48} className="text-slate-300" />
                        )}
                    </div>
                );
            case "VIDEO":
                const videoContent = createMediaContent('video', headerUrl);
                const videoUrl = headerUrl ? getMediaUrl(videoContent, 'video', mockMessage) : null;
                return (
                    <div className={mediaClass}>
                        {uploadOverlay}
                        {videoUrl ? (
                            <>
                                {(mediaLoading || isUploading) && !mediaError && (
                                    <div className="absolute bg-muted/30 inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/60" />
                                        {isUploading && <span className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">{t("preview.uploading")}</span>}
                                    </div>
                                )}
                                {mediaError ? (
                                    <div className="flex flex-col bg-muted/30 items-center gap-2 p-6 text-muted-foreground/60">
                                        <AlertCircle size={32} />
                                        <span className="text-xs font-medium">Failed to load video</span>
                                    </div>
                                ) : (
                                    <video
                                        src={videoUrl}
                                        className={cn(
                                            "w-full h-full object-cover transition-opacity duration-300",
                                            (mediaLoading && !isUploading) ? "opacity-0" : "opacity-100"
                                        )}
                                        controls
                                        preload="metadata"
                                        playsInline
                                        onLoadedData={() => {
                                            setMediaLoading(false)
                                            if (onMediaLoad) {
                                                onMediaLoad();
                                            }   
                                        }}
                                        onError={() => {
                                            setMediaLoading(false);
                                            setMediaError(true);
                                             if (onMediaLoad) {
                                                onMediaLoad();
                                            }
                                        }}
                                    />
                                )}
                            </>
                        ) : (
                            <Video size={48} className="text-slate-300" />
                        )}
                    </div>
                );
            case "DOCUMENT":
                const docContent = createMediaContent('document', headerUrl);
                const docUrl = headerUrl ? getMediaUrl(docContent, 'document', mockMessage) : null;
                return (
                    <a
                        href={docUrl ? docUrl : "#"}
                        onClick={(e) => {
                            e.preventDefault();
                            if (docUrl) handleMediaClick("document", docContent);
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={mediaClass}
                    >
                        {uploadOverlay}
                        <div className="flex flex-col items-center gap-2 cursor-pointer">
                            <FileIcon size={40} className="text-slate-300" />

                            {headerUrl && (
                                <span className="text-[10px] text-slate-400 px-2 truncate max-w-full">
                                    {headerUrl.split('/').pop()}
                                </span>
                            )}
                        </div>
                    </a>
                );
            case "LOCATION":
                if (locationData) {
                    return (
                        <div className="space-y-2 mb-2">
                            <div
                                className="h-32 rounded-lg overflow-hidden relative cursor-pointer group"
                                onClick={() => window.open(`https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`, "_blank")}
                            >
                                <img
                                    src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${locationData.longitude},${locationData.latitude}&z=13&l=map&size=300,150`}
                                    alt="map"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <MapPin size={32} className="text-red-500 drop-shadow-md" />
                                </div>
                            </div>
                            <div className="min-w-0 px-1 pb-1">
                                <p className="text-[13px] font-bold truncate text-[#111b21] dark:text-white">{locationData.name}</p>
                                <p className="text-[11px] text-muted-foreground line-clamp-1">{locationData.address}</p>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className={cn(mediaClass, "flex-col gap-1")}>
                        <MapPin size={48} className="text-slate-300 mt-auto" />
                        <div className="text-center px-2 mt-auto ms-auto pb-1">
                            <p className="text-[11px] text-slate-400 font-bold ">{"{{name}}"}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{"{{address}}"}</p>
                        </div>
                    </div>
                );
            case "TEXT":
                if (!headerText) return null;

                return (
                    <div className="pb-2 font-bold text-[#111b21] dark:text-white leading-tight break-all">
                        {parsedHeaderParts.map((part, index) => {
                            if (part.type === "text") {
                                return (
                                    <React.Fragment key={index}>
                                        {part.formatted}
                                    </React.Fragment>
                                );
                            }

                            // Variable Rendering
                            if (showExamples && part.isValid) {
                                return (
                                    <React.Fragment key={index}>
                                        {part.exampleValue}
                                    </React.Fragment>
                                );
                            }

                            return (
                                <span
                                    key={index}
                                    className={cn(
                                        "inline-block px-1 rounded mx-0.5 transition-all duration-300 align-baseline",
                                        !part.isValid
                                            ? "bg-red-100 text-red-600 border border-red-200 font-mono text-[10px]"
                                            : "bg-slate-100 dark:bg-slate-800 text-[#282828] dark:text-slate-200 font-mono text-[10px]"
                                    )}
                                >
                                    {part.raw}
                                </span>
                            );
                        })}
                    </div>
                );
            default:
                return null;
        }
    };

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const otpPreviewLabel =
        (otpCopyButtonText && String(otpCopyButtonText).trim()) ||
        t("preview.copyCode");

    return (
        <div className={cn(
            "w-full mx-auto overflow-hidden flex flex-col",
            bgTransparent ? "bg-transparent" : "bg-whatsapp-message",
            (!flat && !isChatBubble) && "shadow-lg border border-slate-200 dark:border-slate-800",
            isChatBubble ? "rounded-none" : "rounded-md"
        )}>
            {/* Template Header Bar */}
            {hasHeader && <div className="px-4 py-2 bg-whatsapp-message border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{t("preview.title")}</h3>
            </div>
            }
            {/* WhatsApp Chat Background */}
            <div
                className={cn(
                    "relative flex-1 transition-all duration-300",
                    !isChatBubble && "whatsapp-wallpaper",
                    isChatBubble ? "p-0" : "p-6",
                    isMenuOpen && !isChatBubble ? "min-h-[500px]!" : (isChatBubble ? "min-h-0" : "min-h-[300px]!")
                )}
            >
                <div className={cn(
                    "relative group tempalte-message",
                    locale === "ar" && "tempalte-message-ar",
                    isChatBubble && "w-full"
                )}>
                    {/* Bubble Container */}
                    <div className={cn(
                        "relative min-w-[200px] max-w-[95%]",
                        !isChatBubble && "bg-whatsapp-message rounded-sm shadow-sm p-1.5 pe-2",
                        !isChatBubble && (locale === "ar" ? "rounded-tr-none" : "rounded-tl-none")
                    )}
                        dir={language === "ar" ? "rtl" : "ltr"}
                        style={{
                            fontFamily: 'Segoe UI Historic, Segoe UI, Helvetica, Arial, sans-serif'
                        }}>

                        {/* Header Section */}
                        {renderHeader()}

                        {/* Body Section */}
                        <div className={cn(
                            "text-[13.5px] leading-[1.4] break-words whitespace-pre-wrap",
                            isChatBubble ? "" : "text-[#111b21] dark:text-[#d1d7db]"
                        )}>
                            <div
                                className={cn(
                                    "text-[13.5px] leading-[1.4] break-words whitespace-pre-wrap",
                                    isChatBubble ? "" : "text-[#111b21] dark:text-[#d1d7db]"
                                )}
                                style={{
                                    fontFamily:
                                        "Segoe UI Historic, Segoe UI, Helvetica, Arial, sans-serif"
                                }}
                            >
                                {parsedBodyParts.map((part, index) => {
                                    if (part.type === "text") {
                                        return (
                                            <React.Fragment key={index}>
                                                {part.formatted}
                                            </React.Fragment>
                                        );
                                    }

                                    // Variable Rendering
                                    if (showExamples && part.isValid) {
                                        return (
                                            <React.Fragment key={index}>
                                                {part.exampleValue}
                                            </React.Fragment>
                                        );
                                    }

                                    return (
                                        <span
                                            key={index}
                                            className={cn(
                                                "inline-block px-1 rounded mx-0.5 transition-all duration-300 align-baseline",
                                                !part.isValid
                                                    ? "bg-red-100 text-red-600 border border-red-200 font-mono text-[10px]"
                                                    : "bg-slate-100 dark:bg-slate-800 text-[#282828] dark:text-slate-200 font-mono text-[10px]"
                                            )}
                                        >
                                            {part.raw}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {footerText && (
                            <div className="text-[11.5px] font-light text-[#00000073] dark:text-[#8696a0] mt-2.5 leading-tight">
                                {footerText}
                            </div>
                        )}

                        {/* Time Stamp */}
                        {!isChatBubble && (
                            <div className="flex justify-end mt-1 -mb-0.5 font-light">
                                <span className="text-[10px] text-[#00000073] dark:text-[#8696a0]">
                                    {currentTime}
                                </span>
                            </div>)}

                        {useCustomValidity && validityPeriod && (
                            <div className="text-[10px] text-[#00000073] dark:text-[#8696a0] px-2 pb-1 text-center leading-tight">
                                {t("preview.sendTtl")}{" "}
                                {validityPeriod}
                            </div>
                        )}

                        {/* Buttons Section */}
                        {(buttons.length > 0 || isList) && (
                            <div dir={locale === "ar" ? "rtl" : "ltr"} className={cn(
                                "border-t border-whatsapp-button-border mt-2 -mx-1.5 -mb-1.5 overflow-hidden"
                            )}>
                                {(() => {
                                    const showMenuButton = buttons.length > 3 || isList;
                                    const visibleButtons = showMenuButton ? (isList ? [] : buttons.slice(0, 2)) : buttons;
                                    return (
                                        <>
                                            {visibleButtons.map((btn, idx) => {
                                                const btnText = btn.text ? btn.text : locale === "ar" ? btn.textAr : btn.textEn;
                                                const ButtonComponent = btn.type === "COPY_CODE" ? "button" : "div";
                                                return (<ButtonComponent
                                                    key={btn.id || idx}
                                                    className={cn(
                                                        "py-2.5 px-3 flex items-center justify-center gap-2 text-[#00a884] dark:text-[#00a884] font-medium text-[13px] transition-colors",
                                                        btn.type === "COPY_CODE" ? "cursor-pointer w-full" : "cursor-default",
                                                        "hover:bg-template-btn-hover",
                                                        idx > 0 && "border-t border-whatsapp-button-border",
                                                    )}
                                                    onClick={btn.type === "COPY_CODE" ? () => handleCopy(btn.example || "SAVE20") : undefined}
                                                >

                                                    {btn.type === "CUSTOM" || btn.type === "QUICK_REPLY" || !btn.type && (
                                                        <Reply size={14} className={cn(locale === "ar" ? "scale-x-[-1]" : "")} />
                                                    )}
                                                    {btn.type === "PHONE_NUMBER" && <Phone
                                                        size={14}
                                                        fill="#00a884"
                                                        color="#00a884"
                                                        strokeWidth={1.8}
                                                    />}
                                                    {btn.type === "LOCATION_REQUEST" && <FaLocationDot size={14} />}
                                                    {btn.type === "VISIT_WEBSITE" && <ExternalLink size={14} />}
                                                    {btn.type === "WHATSAPP_CALL" && <Phone
                                                        size={14}
                                                        fill="#00a884"
                                                        color="#00a884"
                                                        strokeWidth={1.8}
                                                    />}
                                                    {btn.type === "COPY_CODE" && <Copy size={14} />}

                                                    {btnText || (
                                                        <span className="opacity-40 italic">{t("preview.actionButtonPlaceholder")}</span>
                                                    )}
                                                </ButtonComponent>)
                                            })}

                                            {showMenuButton && (
                                                <button
                                                    onClick={() => setIsMenuOpen(true)}
                                                    className={cn(
                                                        "w-full py-2.5 px-3 flex items-center justify-center gap-2 text-[#00a884] dark:text-[#00a884] font-medium text-[13px] transition-colors",
                                                        "hover:bg-template-btn-hover",
                                                        "border-t border-whatsapp-button-border"
                                                    )}
                                                >
                                                    <List size={14} />
                                                    {seeAllOptionsLabel || t("preview.seeAllOptions")}
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {subCategory === "AUTHENTICATION_OTP" && authMethod === "COPY_CODE" && (
                            <div dir={locale === "ar" ? "rtl" : "ltr"} className="border-t border-whatsapp-button-border mt-2 -mx-1.5 -mb-1.5 overflow-hidden">
                                <div className="py-2.5 px-3 flex items-center justify-center gap-2 text-[#00a884] dark:text-[#00a884] font-medium text-[13px]">
                                    <Copy size={14} />
                                    {otpPreviewLabel}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Extra Message: Call Permissions */}
                    {["MARKETING_CALL_PERMISSIONS", "UTILITY_CALL_PERMISSIONS", "call_permissions_request"].includes(
                        String(uiSubcategory || subCategory || "").trim()
                    ) && (
                            <WhatsAppCallPermissionsBubble
                                locale={locale}
                                onOpenMenu={() => setIsPermissionsMenuOpen(true)}
                            />
                        )}
                </div>

                <AnimatePresence>
                    {isMenuOpen && (
                        <WhatsAppButtonMenu
                            isOpen={isMenuOpen}
                            onClose={() => setIsMenuOpen(false)}
                            buttons={buttons}
                            sections={template.sections || []}
                            type={isList ? "LIST" : "BUTTONS"}
                            title={seeAllOptionsLabel || (isList ? t("preview.selectAnOption") : t("preview.allOptions"))}
                            locale={locale}
                            seeAllOptionsLabel={seeAllOptionsLabel || t("preview.seeAllOptions")}
                            isPortal={isChatBubble}
                        />
                    )}
                </AnimatePresence>

                {/* Bottom Menu Sheet (Permissions Radio) */}
                <AnimatePresence>
                    {isPermissionsMenuOpen && (
                        <WhatsAppButtonMenu
                            isOpen={isPermissionsMenuOpen}
                            onClose={() => setIsPermissionsMenuOpen(false)}
                            type="RADIO"
                            title={t("preview.callPermissionTitle")}
                            subtitle={t("preview.callPermissionSubtitle")}
                            radioOptions={[
                                { label: t("preview.callPermissionAlways") },
                                { label: t("preview.callPermissionTemporary") },
                                { label: t("preview.callPermissionNotNow") },
                            ]}
                            locale={locale}
                            isPortal={isChatBubble}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Toggle Action Button - Segmented Control Style */}
            {(!isInteractive && !hideToggleAction) && <div className="p-4 bg-white dark:bg-[#0b141a] flex justify-center border-t border-slate-100 dark:border-slate-800">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 w-full max-w-[240px]">
                    <button
                        type="button"
                        onClick={() => setShowExamples(false)}
                        className={cn(
                            "flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all duration-200",
                            !showExamples
                                ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        {t("preview.variablesTab")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowExamples(true)}
                        className={cn(
                            "flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all duration-200",
                            showExamples
                                ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        {t("preview.examplesTab")}
                    </button>
                </div>
            </div>}
        </div>
    );
}

