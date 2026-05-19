// components/flow/CustomHandle.tsx
import { Handle, Connection, HandleProps } from '@xyflow/react';
import { cn } from '@/utils/cn';
import { Plus } from 'lucide-react';
import { useFlowStore } from '@/hook/useFlowStore';

export function CustomHandle({ isConnected, position, noOffset, className, nodeId, ...props }) {
    const setPendingConnection = useFlowStore((s) => s.setPendingConnection);
    const pendingConnection = useFlowStore((s) => s.pendingConnection);
    const mode = useFlowStore((s) => s.mode);

    // Check if THIS specific handle on this node is currently pending
    const isHandlePending = pendingConnection?.nodeId === nodeId && pendingConnection?.handleId === props.id;
    const isViewMode = mode === 'view';
    const showPlus = props.type === 'source' && !isConnected && !isViewMode;

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
                    showPlus && "!opacity-0", // Hide the handle dot visually if showing plus, but keep it interactive
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
        </div>
    );
}