// components/flow/CustomEdge.tsx
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';

export default function CustomEdge({
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd,
}) {
    const { setEdges } = useReactFlow();

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });

    const onEdgeClick = () => {
        setEdges((edges) => edges.filter((e) => e.id !== id));
    };

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{ ...style, strokeWidth: 2, stroke: '#94a3b8' }}
                className="react-flow__edge-path group-hover:stroke-primary transition-colors"
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    <button
                        onClick={onEdgeClick}
                        className="w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm opacity-0 group-hover:opacity-100 hover:scale-110"
                    >
                        <X size={12} strokeWidth={3} />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}