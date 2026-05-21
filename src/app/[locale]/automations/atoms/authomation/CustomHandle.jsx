// components/flow/CustomHandle.tsx
import React from 'react';
import { Handle, Connection, HandleProps } from '@xyflow/react';
import { Plus, Play } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFlowStore } from '@/hook/useFlowStore';
import api from '@/utils/api';

export function CustomHandle({ isConnected, position, noOffset, className, nodeId, ...props }) {
    const setPendingConnection = useFlowStore((s) => s.setPendingConnection);
    const pendingConnection = useFlowStore((s) => s.pendingConnection);
    const mode = useFlowStore((s) => s.mode);
    const currentRun = useFlowStore((s) => s.currentRun);
    const previewResumeLoading = useFlowStore((s) => s.previewResumeLoading);
    const setPreviewResumeLoading = useFlowStore((s) => s.setPreviewResumeLoading);

    // Check if THIS specific handle on this node is currently pending
    const isHandlePending = pendingConnection?.nodeId === nodeId && pendingConnection?.handleId === props.id;
    const isViewMode = mode === 'view';
    const isRunMode = mode === 'run';
    const showPlus = props.type === 'source' && !isConnected && !isViewMode;

    // Check if this handle is for the current node in paused preview mode
    const isCurrentNode = currentRun?.currentNodeId === nodeId;
    const isPaused = currentRun?.status === 'paused';
    const showPlayButton = isRunMode && isCurrentNode && isPaused && props.type === 'source';

    return (
        <div className={cn(
            "absolute flex items-center justify-center transition-all duration-300",
            position === 'top' ? "-top-1.5 left-1/2 -translate-x-1/2" : "-bottom-5.5 left-1/2 -translate-x-1/2"
        )}>
            <Handle
                position={position}
                {...props}
                isConnectable={props.isConnectable ?? !isConnected}
                className={cn(
                    "!w-3 !h-3 !border-2 !border-white transition-all duration-200 !static !translate-x-0 !translate-y-0",
                    // Glowing effect if connected
                    isConnected ? "!bg-primary !ring-4 !ring-primary/20" : "!bg-slate-400",
                    isHandlePending && "!bg-primary !ring-4 !ring-primary/40 !scale-125",
                    (showPlus || showPlayButton) && "!opacity-0", // Hide the handle dot visually if showing button, but keep it interactive
                    className
                )}
                style={{ ...props.style }}
            />

            {showPlus && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setPendingConnection({ nodeId, handleId: props.id, type: 'source' });
                    }}
                    className={cn(
                        "absolute flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm transition-all hover:scale-110 hover:shadow-md dark:bg-slate-800 z-10",
                        isHandlePending ? "border-primary text-primary ring-4 ring-primary/10 scale-110 shadow-md" : "border-slate-200 text-slate-400 dark:border-slate-700"
                    )}
                    title="إضافة خطوة تالية"
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            )}

            {showPlayButton && (
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        setPreviewResumeLoading(true);
                        try {
                            await api.post(`/automation/preview/${currentRun?.previewId}/resume`, {
                                buttonText: props.id,
                                buttonId: props.id,
                            });
                        } catch (error) {
                            console.error('Resume preview error:', error);
                        } finally {
                            setPreviewResumeLoading(false);
                        }
                    }}
                    disabled={previewResumeLoading}
                    className={cn(
                        "absolute flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm transition-all hover:scale-110 hover:shadow-md dark:bg-slate-800 z-10",
                        "border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
                        previewResumeLoading && "opacity-50 cursor-not-allowed"
                    )}
                    title="اختر هذا الفرع"
                >
                    {previewResumeLoading ? (
                        <div className="animate-spin h-3 w-3 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    ) : (
                        <Play size={14} strokeWidth={3} />
                    )}
                </button>
            )}
        </div>
    );
}