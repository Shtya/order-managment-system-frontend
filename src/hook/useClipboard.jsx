// useClipboard.js
import { useState, useCallback } from "react";

export function useClipboard(timeout = 1400) {
    const [copied, setCopied] = useState(null);

    const fallbackCopy = (text) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            document.execCommand("copy");
            return true;
        } catch (err) {
            console.error("Fallback copy failed:", err);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    };

    const copy = useCallback(async (value) => {
        const text = String(value);

        try {
            if (typeof document !== "undefined" && !document.hasFocus()) {
                window.focus();
            }

            await navigator.clipboard.writeText(text);
            setCopied(value);
            return true;
        } catch (err) {
            console.warn("Clipboard API failed, using fallback:", err);

            const success = fallbackCopy(text);
            if (success) {
                setCopied(value);
            }

            return success;
        } finally {
            setTimeout(() => setCopied(null), timeout);
        }
    }, [timeout]);

    return { copied, handleCopy: copy };
}