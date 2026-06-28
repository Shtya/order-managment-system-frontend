import React from 'react';
import { BASE_URL } from './api';

/**
 * WhatsApp Template Variable Helpers
 * 
 * Supports both numeric {{1}} and named {{order_id}} variables.
 * Default type is 'number'.
 */

export const VAR_REGEX = {
    number: /\{\{(\d+)\}\}/g,
    named: /\{\{([\w_]+)\}\}/g,
    any: /\{\{([\w\d_]+)\}\}/g,
    malformed: /\{[^{}]*\}|\{\{[^{}]*\}\}/g
};

/**
 * Get all variable matches from text
 */
// type =  'number' | 'named' | 'any'
export const getVariableMatches = (text = "", type = 'number') => {
    const regex = VAR_REGEX[type];

    return text?.match(regex) || [];
};

/**
 * Extract variable names/numbers from text
 */
export const extractVariableNames = (text = "", type = 'number') => {
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
export const isCorrectVariableFormat = (part, type = 'number') => {
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