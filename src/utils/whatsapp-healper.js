import React from 'react';
import api, { BASE_URL } from './api';
import { avatarSrc } from '@/components/atoms/UserSelect';
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
        const subParts = p.split(/(\*[^\s][\s\S]*?[^\s]\*)/g);
        return subParts.map((sp, idx) => {
            const m = sp.match(/^\*([^\s][\s\S]*?[^\s])\*$/);
            return m
                ? <strong key={`bold-${idx}`} className="font-bold text-[#111b21] dark:text-white">{m[1]}</strong>
                : sp;
        });
    });

    // Italic
    formatted = formatted.flatMap(p => {
        if (typeof p !== 'string') return p;
        const subParts = p.split(/(_[^\s][\s\S]*?[^\s]_)/g);
        return subParts.map((sp, idx) => {
            const m = sp.match(/^_([^\s][\s\S]*?[^\s])_$/);
            return m
                ? <em key={`italic-${idx}`} className="italic">{m[1]}</em>
                : sp;
        });
    });

    // Strike
    formatted = formatted.flatMap(p => {
        if (typeof p !== 'string') return p;
        const subParts = p.split(/(~[^\s][\s\S]*?[^\s]~)/g);
        return subParts.map((sp, idx) => {
            const m = sp.match(/^~([^\s][\s\S]*?[^\s])~$/);
            return m
                ? <span key={`strike-${idx}`} className="line-through opacity-70">{m[1]}</span>
                : sp;
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

export const getMediaUrlById = (mediaId, accountId) => {
    if (!mediaId) return null;

    const token = localStorage.getItem("accessToken");

    const params = new URLSearchParams();
    if (token) params.append("token", token);
    if (accountId) params.append("accountId", accountId);
    params.append("mediaId", mediaId);

    return `${BASE_URL}/whatsapp/media?${params.toString()}`;
};

export const getMediaUrl = (content, type, message) => {
    const media = content[type];

    if (media?.localUrl) {
        return media.localUrl;
    }

    return getMediaUrlById(
        media?.id || content?.id,
        message?.accountId
    );
};


export const getMediaUrlOrOriginal = (url, accountId) => {
    if (!url) return url;

    if (!isMediaId(url)) {
        return url;
    }

    // Try cache first.
    const cachedUrl = getCachedMediaUrl(url);
    if (cachedUrl) {
        return cachedUrl;
    }

    // Fall back to API endpoint.
    return getMediaUrlById(url, accountId);
};



export const handleMediaClick = (type, content) => {
    const url = getMediaUrl(content, type);
    console.log(url);
    if (url) {
        window.open(url, "_blank");
    }
};

// Media URL Cache
const mediaUrlCache = new Map();
export const isMediaId = (value) => /^\d+$/.test(value ?? "");
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
    if (!media) return null;
    // Check if we have a local URL (optimistic UI)
    if (media?.localUrl) {
        return media.localUrl;
    }

    if (media?.link) {
        return media.link;
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

// Helper to remove newlines from text
const removeNewlines = (text) => {

    if (typeof text !== 'string') return text;

    return text.replace(/\r?\n|\r/g, ' ').trim();
};

export const formatMessagePreview = (message, t = (key) => key) => {
    if (!message) return "";

    const { messageType, content } = message;
    const { bodyContent } = content || {};
    const interactiveType = content?.interactive?.type || "";
    const type = messageType === "interactive" ? interactiveType : messageType;
    const body = bodyContent || content?.[messageType]?.body || "";
    const rawBodyText = typeof body === "string" ? body : body?.text;
    const bodyText = formatText(removeNewlines(rawBodyText));

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
                    <span>{removeNewlines(docName)}</span>
                </div>
            );
        case "location":
            const locName = content?.location?.name;
            const locAddress = content?.location?.address;
            const locationText = removeNewlines(locName || locAddress || t("messageTypes.location") || "Location");
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
                    <span>{bodyText || t("messageTypes.location_request") || "Location request"}</span>
                </div>
            );
        case "template":
            return (
                <div className="flex items-center gap-1.5">
                    <LayoutTemplate size={14} className="text-muted-foreground" />
                    <span>{removeNewlines(content?.template?.name || t("messageTypes.template") || "Template")}</span>
                </div>
            );

        case "text":
            return <span>{formatText(removeNewlines(rawBodyText || ""))}</span>;
        case "contacts":
            const contactName = content?.contacts?.[0]?.name?.formatted_name || t("messageTypes.contact") || "Contact";
            return (
                <div className="flex items-center gap-1.5">
                    <User size={14} className="text-muted-foreground" />
                    <span>{removeNewlines(contactName)}</span>
                </div>
            );
        case "list":
            const interactiveBody = removeNewlines(content?.interactive?.body?.text || rawBodyText || t("messageTypes.interactive") || "Interactive");
            return (
                <div className="flex items-center gap-1.5">
                    <ListIcon size={14} className="text-muted-foreground" />
                    <span>{formatText(interactiveBody)}</span>
                </div>
            );
        case "list_reply":
        case "button_reply":
            const listReplyBody = removeNewlines(content?.interactive?.list_reply?.title || content?.interactive?.button_reply?.title || rawBodyText || t("messageTypes.interactive") || "Interactive");
            return (
                <div className="flex items-center gap-1.5">
                    <Reply size={14} className="text-muted-foreground" />
                    <span>{listReplyBody}</span>
                </div>
            );
        case "button":
            const buttonText = removeNewlines(content?.button?.text || rawBodyText || t("messageTypes.button") || "Button");
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
            return <span>{formatText(removeNewlines(rawBodyText || ""))}</span>;
    }
};


// Private function to check if media upload is needed for template or interactive messages
export const checkIfMediaUploadNeeded = (msg) => {
    let mediaInfo = null;

    if (msg.type === "template" && msg.template?.components) {
        const headerComponent = msg.template.components.find(c => c.type === "header");
        const param = headerComponent?.parameters?.[0];
        const mediaType = param?.type;
        if (headerComponent && ["image", "video", "document"].includes(mediaType) && param) {
            const mediaObj = param[mediaType];
            if (mediaObj?.id) {
                delete mediaObj.link;
                delete mediaObj.file;
            }
            if (mediaObj && (mediaObj.link || mediaObj.file) && !mediaObj.id) {
                mediaInfo = { mediaType, mediaObj, headerComponent: "template" };
            }
        }
    } else if (msg.type === "interactive" && msg.interactive?.header) {
        const header = msg.interactive.header;
        const mediaType = header.type;
        if (["image", "video", "document"].includes(mediaType)) {
            const mediaObj = header[mediaType];
            if (mediaObj?.id) {
                delete mediaObj.link;
                delete mediaObj.file;
            }
            if (mediaObj && (mediaObj.link || mediaObj.file) && !mediaObj.id) {
                mediaInfo = { mediaType, mediaObj, headerComponent: "interactive" };
            }
        }
    } else if (["image", "video", "document"].includes(msg.type)) {
        const mediaType = msg.type;
        const mediaObj = msg[mediaType];
        const file = mediaObj?.file || msg?.file;

        if (mediaObj && (mediaObj.link || file) && !mediaObj.id) {
            mediaInfo = { mediaType, mediaObj, file, headerComponent: "direct" };
        }
    }

    return mediaInfo;
};

// Private function to handle media upload
export const handleMediaUpload = async (mediaInfo, currentAccountId) => {
    try {
        const file = mediaInfo.mediaObj?.file || mediaInfo.file;
        const link = mediaInfo.mediaObj?.link;

        let body;
        let headers = {};

        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            body = formData;
            headers["Content-Type"] = "multipart/form-data";
        } else {
            body = {
                url: link,
            };
        }

        const uploadRes = await api.post(
            "/whatsapp/messages/upload-media",
            body,
            {
                params: { accountId: currentAccountId },
                headers,
            }
        );

        if (uploadRes.data?.id) {
            const newId = uploadRes.data.id;
            const mediaType = mediaInfo.mediaType;
            const mediaObj = mediaInfo.mediaObj;

            // Cache the local URL with the new media ID
            if (mediaObj?.localUrl) {
                cacheMediaUrl(newId, mediaObj.localUrl);
            } else if (mediaObj?.link) {
                cacheMediaUrl(newId, mediaObj.link);
            } else if (mediaObj?.url) {
                cacheMediaUrl(newId, mediaObj.url);
            }

            // Update our local payload object
            mediaObj.id = newId;
            if (mediaType?.toLowerCase() === 'document') {
                mediaObj.filename = uploadRes.data?.filename;
                delete mediaObj.name;
            }
            delete mediaObj.link;
            delete mediaObj.file;

            if (mediaObj.url && mediaObj.url.startsWith("data:")) {
                delete mediaObj.url;
            }

            return newId;
        }
    } catch (err) {
        throw err;
    }
};

// Check if upload to our asset system is needed
export const checkIfAssetUploadNeeded = (msg) => {
    let mediaInfo = null;

    if (msg.type === "template" && msg.template?.components) {
        const headerComponent = msg.template.components.find(
            c => c.type === "header"
        );

        const param = headerComponent?.parameters?.[0];
        const mediaType = param?.type;

        if (
            headerComponent &&
            ["image", "video", "document"].includes(mediaType)
        ) {
            const mediaObj = param[mediaType];

            const needsUpload =
                mediaObj?.file ||
                !mediaObj?.link ||
                mediaObj.link.startsWith("data:");

            if (needsUpload) {
                mediaInfo = { mediaType, mediaObj };
            }
        }
    } else if (msg.type === "interactive" && msg.interactive?.header) {
        const header = msg.interactive.header;
        const mediaType = header.type;

        if (["image", "video", "document"].includes(mediaType)) {
            const mediaObj = header[mediaType];

            const needsUpload =
                mediaObj?.file ||
                !mediaObj?.link ||
                mediaObj.link.startsWith("data:");

            if (needsUpload) {
                mediaInfo = { mediaType, mediaObj };
            }
        }
    } else if (["image", "video", "document"].includes(msg.type)) {
        const mediaObj = msg[msg.type];

        const needsUpload =
            mediaObj?.file ||
            !mediaObj?.link ||
            mediaObj.link.startsWith("data:");

        if (needsUpload) {
            mediaInfo = {
                mediaType: msg.type,
                mediaObj,
            };
        }
    }

    return mediaInfo;
};

export const handleAssetUpload = async (mediaInfo) => {
    const { mediaObj } = mediaInfo;

    // Already uploaded
    if (
        mediaObj?.link &&
        !mediaObj.link.startsWith("data:") &&
        !mediaObj.file
    ) {
        return { url: mediaObj.link };
    }

    if (!mediaObj.file) {

        throw new Error("Media file is required.");
    }

    const formData = new FormData();

    formData.append("file", mediaObj.file);

    if (mediaObj.name) {
        formData.append("filename", mediaObj.name);
    }

    const { data } = await api.post("/orphan-files/any", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    mediaObj.link = avatarSrc(data.url);

    delete mediaObj.file;

    if (mediaObj.link.startsWith("data:")) {
        delete mediaObj.link;
        mediaObj.link = data.url;
    }

    return { id: data.id, url: data.url };
};

export const WHATSAPP_SUPPORTED_MIME_TYPES = {
    IMAGE: [
        "image/jpeg",
        "image/png",
        "image/webp",
    ],

    VIDEO: [
        "video/mp4",
        "video/3gpp",
    ],

    AUDIO: [
        "audio/aac",
        "audio/mp4",
        "audio/mpeg",
        "audio/amr",
        "audio/ogg",
        "audio/opus",
    ],

    DOCUMENT: [
        "audio/aac",
        "audio/mp4",
        "audio/mpeg",
        "audio/amr",
        "audio/ogg",
        "audio/opus",
        "application/vnd.ms-powerpoint",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/pdf",
        "text/plain",
        "application/vnd.ms-excel",
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/3gpp"
    ],
};

export const WHATSAPP_IMAGE_ACCEPT = WHATSAPP_SUPPORTED_MIME_TYPES.IMAGE.join(",");
export const WHATSAPP_VIDEO_ACCEPT = WHATSAPP_SUPPORTED_MIME_TYPES.VIDEO.join(",");
export const WHATSAPP_AUDIO_ACCEPT = WHATSAPP_SUPPORTED_MIME_TYPES.AUDIO.join(",");
export const WHATSAPP_DOCUMENT_ACCEPT = WHATSAPP_SUPPORTED_MIME_TYPES.DOCUMENT.join(",");
