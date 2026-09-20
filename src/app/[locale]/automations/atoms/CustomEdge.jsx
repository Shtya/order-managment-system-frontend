import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { Trash2, Link2Off } from 'lucide-react';
import { useFlowStore } from '@/hook/useFlowStore';
import { cn } from '@/utils/cn';
import { useTranslations } from 'next-intl';

function CustomEdge({
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, selected, animated
}) {
    const t = useTranslations("whatsApp.automations.builder.toolbar");
    const deleteEdge = useFlowStore((s) => s.deleteEdge);
    const disconnectEdge = useFlowStore((s) => s.disconnectEdge);
    const isViewMode = useFlowStore((s) => s.mode === 'view');
    const isRunMode = useFlowStore((s) => s.mode === 'run');
    const isTakenPath = useFlowStore((s) => s.mode === 'run' && s.runPathEdgeIds?.has(id));
    const isCycleEdge = useFlowStore((s) => Boolean(s.cycleHighlight?.edgeIds?.includes(id)));
    const [isHovered, setIsHovered] = useState(false);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });

    const onEdgeDelete = (e) => {
        e.stopPropagation();
        deleteEdge(id);
    };

    const onEdgeDisconnect = (e) => {
        e.stopPropagation();
        disconnectEdge(id);
    };

    return (
        <g
            className="group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                animated={isRunMode ? isTakenPath : animated}
                style={{
                    ...style,
                    strokeWidth: isCycleEdge || isTakenPath ? 2.5 : isRunMode ? 1.5 : 2,
                    opacity: isRunMode && !isTakenPath && !isCycleEdge ? 0.9 : 1,
                    stroke: isCycleEdge
                        ? '#e11d48'
                        : isTakenPath
                            ? '#10b981'
                            : (isHovered || selected) && !isRunMode ? '#2563eb' : '#cbd5e1',
                }}
                className="react-flow__edge-path transition-colors cursor-pointer"
            />
            {/* Hidden wider path to make it easier to hover */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                className="cursor-pointer"
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan flex gap-2"
                >
                    {!isViewMode && !isRunMode && (
                        <>
                            <button
                                onClick={onEdgeDisconnect}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className={cn(
                                    "w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50 transition-all shadow-lg",
                                    (isHovered || selected) ? "opacity-100 scale-110" : "opacity-0 scale-50"
                                )}
                                title={t("disconnectOnly")}
                            >
                                <Link2Off size={14} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={onEdgeDelete}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className={cn(
                                    "w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-lg",
                                    (isHovered || selected) ? "opacity-100 scale-110" : "opacity-0 scale-50"
                                )}
                                title={t("deletePathAndAfter")}
                            >
                                <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                        </>
                    )}
                </div>
            </EdgeLabelRenderer>
        </g>
    );
}

export default memo(CustomEdge);
