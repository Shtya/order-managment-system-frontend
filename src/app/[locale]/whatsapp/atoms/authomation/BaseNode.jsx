import { Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Trash2, AlertCircle, Edit3 } from 'lucide-react';
import { useEffect } from 'react';

import { cn } from '@/utils/cn';
import { useFlowStore } from '@/hook/useFlowStore';
import { CustomHandle } from './CustomHandle';

export function BaseNode({
    id,
    selected,
    title,
    subtitle,
    icon: Icon,
    colorClass = "text-primary",
    bgClass = "bg-primary/10",
    hasInput = true,
    hasOutput = true,
    children,
    isValid = true,
    errorMessage,
    onEdit,
    className
}) {
    const deleteNode = useFlowStore((s) => s.deleteNode);
    const edges = useFlowStore((s) => s.edges);

    const isInputConnected = edges.some(e => e.target === id);
    const isOutputConnected = edges.some(e => e.source === id);

    // Delete node with keyboard when selected
    useEffect(() => {
        if (!selected) return;

        const handleKeyDown = (e) => {
            const isTyping =
                ["INPUT", "TEXTAREA", "SELECT"].includes(
                    document.activeElement?.tagName
                ) || document.activeElement?.isContentEditable;

            // Prevent deleting while typing
            if (isTyping) return;

            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                deleteNode(id);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selected, id, deleteNode]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative min-w-[260px] max-w-[320px] rounded-[24px] border bg-white shadow-sm transition-all duration-300 dark:bg-slate-900",
                selected ? "border-primary ring-[4px] ring-primary/5 shadow-lg scale-[1.01]" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md",
                !isValid && "border-rose-500 ring-[4px] ring-rose-500/5 shadow-rose-500/10",
                className
            )}
        >
            {/* Input Handle */}
            {hasInput && (
                <CustomHandle
                    type="target"
                    position={Position.Top}
                    isConnected={isInputConnected}
                    nodeId={id}
                />
            )}

            {/* Header */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3 text-right rtl">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-[14px] transition-colors shadow-sm", bgClass)}>
                            <Icon className={cn("h-5 w-5", colorClass)} />
                        </div>
                        <div>
                            <h3 className="text-[13px] font-black text-slate-900 dark:text-slate-100 leading-tight">{title}</h3>
                            <p className="text-[9px] uppercase font-black tracking-[1px] text-slate-400 mt-0.5">{subtitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit?.();
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="تعديل"
                        >
                            <Edit3 size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteNode(id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                            title="حذف"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    {children}
                </div>

                {/* Error Message */}
                {!isValid && (
                    <div className="mt-3 flex items-center gap-2 text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/5 p-2 rounded-xl border border-rose-100 dark:border-rose-500/10 animate-pulse">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errorMessage || "يرجى إكمال التكوين"}</span>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            {hasOutput && (
                <CustomHandle
                    type="source"
                    position={Position.Bottom}
                    isConnected={isOutputConnected}
                    nodeId={id}
                />
            )}
        </motion.div>
    );
}