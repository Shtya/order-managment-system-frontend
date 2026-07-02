import React from 'react';
import { BASE_URL } from './api';
import {
    Image as ImageIcon,
    Video as VideoIcon,
    FileText,
    MapPin,
    User,
    MessageSquare,
    List as ListIcon,
    Sticker,
    LayoutTemplate,
    Map as MapIcon,
    Reply,
    AlertCircle
} from 'lucide-react';

/**
 * WhatsApp Template Variable Helpers
 * 
 * Supports both numeric {{1}} and named {{order_id}} variables.
 * Default type is 'number'.
 */

export const VAR_REGEX = {
    positional: /\{\{(\d+)\}\}/,
    named: /\{\{([a-z][a-z0-9_]*)\}\}/,
    any: /\{\{([\w\d_]+)\}\}/,
    malformed: /\{[^{}]*\}|\{\{[^{}]*\}\}/
};

/**
 * Get all variable matches from text
 */
// type =  'number' | 'named' | 'any'
export const getVariableMatches = (text = "", type = "positional") => {
  const regex = new RegExp(VAR_REGEX[type].source, "g");
  return text.match(regex) || [];
};

/**
 * Extract variable names/numbers from text
 */
export const extractVariableNames = (text = "", type = 'positional') => {
    const regex = VAR_REGEX[type];
    const matches = [];
    let match;
    const searchRegex = new RegExp(regex.source, 'g');
    while ((match = searchRegex.exec(text)) !== null) {
        matches.push(match[1]);
    }
    
    return matches;
};

/**
 * Replace variables with custom logic
 */
export const replaceVariables = (
    text,
    callback,
    type = 'number'
) => {
    const regex = new RegExp(VAR_REGEX[type].source, 'g');
    return text.replace(regex, callback);
};

/**
 * WhatsApp Message Text Formatter
 * Handles: *bold*, _italic_, ~strike~, ```monospace```
 */
const formatCache = new Map();

export const formatText = (content) => {
    if (typeof content !== 'string') return content;

    // Check cache
    if (formatCache.has(content)) {
        return formatCache.get(content);
    }

    let formatted = [content];

    // Monospace
    formatted = formatted.flatMap(p => {
        if (typeof p !== 'string') return p;
        const subParts = p.split(/(```[\s\S]*?```)/g);
        return subParts.map((sp, idx) => {
            const m = sp.match(/```([\s\S]*?)```/);
            return m ? <code key={`mono-${idx}`} className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono text-[12px]">{m[1]}</code> : sp;
        });
    });

    // Bold
    formatted = formatted.flatMap(p => {
        if (typeof p !== 'string') return p;
        const subParts = p.split(/(\*[\s\S]*?\*)/g);
        return subParts.map((sp, idx) => {
            const m = sp.match(/\*([\s\S]*?)\*/);
            return m ? <strong key={`bold-${idx}`} className="font-bold text-[#111b21] dark:text-white">{m[1]}</strong> : sp;
        });
    });

    // Italic
    formatted = formatted.flatMap(p => {
        if (typeof p !== 'string') return p;
        const subParts = p.split(/(_[\s\S]*?_)/g);
        return subParts.map((sp, idx) => {
            const m = sp.match(/_([\s\S]*?)_/);
            return m ? <em key={`italic-${idx}`} className="italic">{m[1]}</em> : sp;
        });
    });

    // Strike
    formatted = formatted.flatMap(p => {
        if (typeof p !== 'string') return p;
        const subParts = p.split(/(~[\s\S]*?~)/g);
        return subParts.map((sp, idx) => {
            const m = sp.match(/~([\s\S]*?)~/);
            return m ? <span key={`strike-${idx}`} className="line-through opacity-70">{m[1]}</span> : sp;
        });
    });

    // Cache result
    formatCache.set(content, formatted);

    // Limit cache size
    if (formatCache.size > 500) {
        const firstKey = formatCache.keys().next().value;
        formatCache.delete(firstKey);
    }

    return formatted;
};

/**
 * Validate if a part is a correct variable format
 */
export const isCorrectVariableFormat = (part, type = 'positional') => {
    const regex = new RegExp(`^${VAR_REGEX[type].source}$`);
    return regex.test(part);
};

/**
 * Validate if a part is any kind of bracketed text (potentially malformed var)
 */
export const isPotentialVariable = (part) => {
    return /^\{.*\}$/.test(part) || /^\{\{.*\}\}$/.test(part);
};

export const MESSAGE_STATUS = {
    ACCEPTED: 'accepted',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    PLAYED: 'played',
    FAILED: 'failed',
    RECEIVED: 'received',
    DELETED: 'deleted',
    UNSUPPORTED: 'unsupported',
};

export const MESSAGE_STATUS_LIST = [
    { value: MESSAGE_STATUS.SENT, label: "Sent", color: "text-gray-400" },
    { value: MESSAGE_STATUS.DELIVERED, label: "Delivered", color: "text-blue-400" },
    { value: MESSAGE_STATUS.READ, label: "Read", color: "text-green-500" },
    { value: MESSAGE_STATUS.FAILED, label: "Failed", color: "text-red-500" },
];


export const getMediaUrl = (content, type,message) => {
    const media = content[type];
    if (media?.localUrl) {
        return media.localUrl;
    }

    const token = localStorage.getItem('accessToken');
    const accountId = message?.accountId;
    const mediaId = media?.id || content.id;

    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (accountId) params.append('accountId', accountId);
    if (mediaId) params.append('mediaId', mediaId);

    return `${BASE_URL}/whatsapp/media?${params.toString()}`;
};

export  const handleMediaClick = (type, content) => {
    const url = getMediaUrl(content, type);
    console.log(url);
    if (url) {
        window.open(url, "_blank");
    }
};

// Media URL Cache
const mediaUrlCache = new Map();

export const cacheMediaUrl = (mediaId, url) => {
    if (mediaId && url) {
        mediaUrlCache.set(mediaId, url);
    }
};

export const getCachedMediaUrl = (mediaId) => {
    return mediaId ? mediaUrlCache.get(mediaId) : null;
};

export const getMediaUrlWithCache = (content, type, message) => {
    const media = content[type];
    
    // Check if we have a local URL (optimistic UI)
    if (media?.localUrl) {
        return media.localUrl;
    }
    
    // Check cache first
    const mediaId = media?.id || content?.id;
    if (mediaId) {
        const cachedUrl = getCachedMediaUrl(mediaId);
        if (cachedUrl) {
            return cachedUrl;
        }
    }
    
    // Fall back to original getMediaUrl
    return getMediaUrl(content, type, message);
};

export const formatMessagePreview = (message, t = (key) => key) => {
    if (!message) return "";
    
    const { messageType, content } = message;
    const { bodyContent } = content || {};
    const interactiveType = content?.interactive?.type || "";
    const type = messageType === "interactive" ? interactiveType : messageType;
    const body = bodyContent || content?.[messageType]?.body || "";
    const bodyText = formatText(typeof body === "string" ? body : body?.text);
    
    switch (type) {
        case "image":
            return (
                <div className="flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-muted-foreground" />
                    <span>{t("messageTypes.image") || "Image"}</span>
                </div>
            );
        case "video":
            return (
                <div className="flex items-center gap-1.5">
                    <VideoIcon size={14} className="text-muted-foreground" />
                    <span>{t("messageTypes.video") || "Video"}</span>
                </div>
            );
        case "sticker":
            return (
                <div className="flex items-center gap-1.5">
                    <Sticker size={14} className="text-muted-foreground" />
                    <span>{t("messageTypes.sticker") || "Sticker"}</span>
                </div>
            );
        case "document":
            const docName = content?.document?.filename || content?.document?.name || t("document") || "Document";
            return (
                <div className="flex items-center gap-1.5">
                    <FileText size={14} className="text-muted-foreground" />
                    <span>{docName}</span>
                </div>
            );
        case "location":
            const locName = content?.location?.name;
            const locAddress = content?.location?.address;
            const locationText = locName || locAddress || t("messageTypes.location") || "Location";
            return (
                <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-muted-foreground" />
                    <span>{locationText}</span>
                </div>
            );
        case "location_request_message":
            return (
                <div className="flex items-center gap-1.5">
                    <MapIcon size={14} className="text-muted-foreground" />
                    <span>{bodyText || t("messageTypes.locationRequest") || "Location request"}</span>
                </div>
            );
        case "template":
            return (
                <div className="flex items-center gap-1.5">
                    <LayoutTemplate size={14} className="text-muted-foreground" />
                    <span>{content?.template?.name || t("messageTypes.template") || "Template"}</span>
                </div>
            );
            
        case "text":
            return <span>{formatText(bodyText || "")}</span>;
        case "contacts":
            const contactName = content?.contacts?.[0]?.name?.formatted_name || t("messageTypes.contact") || "Contact";
            return (
                <div className="flex items-center gap-1.5">
                    <User size={14} className="text-muted-foreground" />
                    <span>{contactName}</span>
                </div>
            );
        case "list":
            const interactiveBody = content?.interactive?.body?.text || bodyText || t("messageTypes.interactive") || "Interactive";
            return (
                <div className="flex items-center gap-1.5">
                    <ListIcon size={14} className="text-muted-foreground" />
                    <span>{interactiveBody}</span>
                </div>
            );
        case "list_reply":
        case "button_reply":
            const listReplyBody = content?.interactive?.list_reply?.title || content?.interactive?.button_reply?.title || bodyText || t("messageTypes.interactive") || "Interactive";
            return (
                <div className="flex items-center gap-1.5">
                    <Reply size={14} className="text-muted-foreground" />
                    <span>{listReplyBody}</span>
                </div>
            );
        case "button":
            const buttonText = content?.button?.text || bodyText || t("messageTypes.button") || "Button";
            return (
                <div className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-muted-foreground" />
                    <span>{buttonText}</span>
                </div>
            );
        case "unsupported":
            return (
            <div className='flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400'>
                <AlertCircle size={14} className="text-yellow-600 dark:text-yellow-400" />
                <span>{t("unsupportedMessage") || "Unsupported message"}</span>
            </div>
            )
        default:
            return <span>{formatText(bodyText || "")}</span>;
    }
};