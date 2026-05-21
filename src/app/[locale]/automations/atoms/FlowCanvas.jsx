// components/flow/FlowCanvas.tsx
import { useCallback, useRef } from 'react';
import { ReactFlow, Controls, Background, MiniMap, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '@/hook/useFlowStore';
import { TriggerNode } from './TriggerNode';
import { ConditionNode } from './ConditionNode';

export function WhatsAppActionNode(props) {
    return (
        <BaseNode
            {...props}
            title="Send WhatsApp Template"
            icon={MessageCircle}
            colorClass="bg-emerald-500"
            bgLightClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
    );
}

// Register your custom nodes here
const nodeTypes = {
    trigger: TriggerNode,
    whatsapp: WhatsAppActionNode,
    condition: ConditionNode,
};

export default function FlowCanvas() {
    const reactFlowWrapper = useRef(null);

    // Use granular selectors to prevent unnecessary re-renders
    const nodes = useFlowStore((s) => s.nodes);
    const edges = useFlowStore((s) => s.edges);
    const onNodesChange = useFlowStore((s) => s.onNodesChange);
    const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
    const onConnect = useFlowStore((s) => s.onConnect);

    // Get the current ID and the setter separately
    const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
    const setSelectedNode = useFlowStore((s) => s.setSelectedNode);

    const onSelectionChange = useCallback((params) => {
        const newId = params.nodes[0]?.id || null;

        // 🔥 CRITICAL: Only update if the selection actually changed
        if (newId !== selectedNodeId) {
            setSelectedNode(newId);
        }
    }, [selectedNodeId, setSelectedNode]);

    return (
        <div className="flex-1 h-full w-full bg-slate-50 dark:bg-[#0A0A0A]" ref={reactFlowWrapper}>
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onSelectionChange={(params) => setSelectedNode(params.nodes[0]?.id || null)}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#cbd5e1" gap={24} size={1.5} />
                    <Controls className="fill-slate-700 bg-white shadow-md rounded-xl" />
                    <MiniMap className="bg-white rounded-xl shadow-md border border-slate-200" />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}