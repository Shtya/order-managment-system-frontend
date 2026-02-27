import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export function ModalShell({ children, onClose, maxWidth = "max-w-md" }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <>
            <motion.div
                className="fixed inset-0 z-50 bg-black/40 dark:bg-black/65 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 14 }}
                    transition={{ type: "spring", stiffness: 340, damping: 28 }}
                    className={`relative w-full ${maxWidth} pointer-events-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </motion.div>
            </div>
        </>,
        document.body
    );
}

export function ModalHeader({ icon: Icon, title, subtitle, onClose }) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]">
            <div className="flex items-center gap-3">
                {Icon && (
                    <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                            background: `linear-gradient(135deg, rgb(var(--primary-from)/0.15), rgb(var(--primary-to)/0.15))`,
                        }}
                    >
                        <Icon size={15} className="text-[var(--primary)]" />
                    </span>
                )}
                <div>
                    <p className="text-sm font-semibold text-[var(--card-foreground)] leading-tight">{title}</p>
                    {subtitle && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] hover:bg-[var(--border)] transition-all"
            >
                <X size={15} />
            </button>
        </div>
    );
}