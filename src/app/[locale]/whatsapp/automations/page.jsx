"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
  Background,
  Controls,
  Panel,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
// Components

import { useFlowStore } from "@/hook/useFlowStore";
import { TopToolbar } from "../atoms/authomation/TopToolbar";
import { ActionNode } from "../atoms/authomation/ActionNode";
import { ConditionNode } from "../atoms/authomation/ConditionNode";
import CustomEdge from "../atoms/authomation/CustomEdge";
import { LeftSidebar } from "../atoms/authomation/LeftSidebar";
import { TriggerNode } from "../atoms/authomation/TriggerNode";
import { StepConfigModal } from "../atoms/authomation/StepConfigModal";
import { ConfirmDeleteDialog } from "../atoms/authomation/ConfirmDeleteDialog";
import { AUTOMATION_CONFIG } from "../atoms/authomation/automation-config";
import toast from "react-hot-toast";

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const getMiniMapNodeColor = (node) => {
  switch (node.type) {
    case 'trigger':
      return '#10b981'; // emerald-500
    case 'action':
      return '#3b82f6'; // blue-500
    case 'condition':
      return '#a855f7'; // purple-500
    default:
      return '#cbd5e1'; // slate-300
  }
};

function BuilderCanvas() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition, setViewport } = useReactFlow();

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);

  // Modal State
  const [configModal, setConfigModal] = useState({ open: false, step: null, mode: 'create', initialData: null });

  // Listen for edit events from nodes
  useEffect(() => {
    const handleEdit = (e) => {
      const { id, data } = e.detail;
      // Find the step config in AUTOMATION_CONFIG
      let foundStep = null;
      Object.values(AUTOMATION_CONFIG).forEach(section => {
        section.categories.forEach(cat => {
          const item = cat.items.find(i => i.id === data.type || i.id === data.type || i.id === data.type);
          if (item) foundStep = item;
        });
      });

      if (foundStep) {
        setConfigModal({ open: true, step: foundStep, mode: 'edit', initialData: data.config, nodeId: id });
      }
    };

    window.addEventListener('edit-automation-step', handleEdit);
    return () => window.removeEventListener('edit-automation-step', handleEdit);
  }, []);

  const handleSelectionChange = useCallback((params) => {
    const newId = params.nodes[0]?.id || null;
    if (newId !== selectedNodeId) {
      setSelectedNode(newId);
    }
  }, [selectedNodeId, setSelectedNode]);

  const handleSelectStepFromSidebar = (step) => {
    setConfigModal({ open: true, step, mode: 'create', initialData: {} });
  };

  const handleConfigSave = (config) => {
    if (!config) {
      setConfigModal({ open: false, step: null, mode: 'create', initialData: null });
      return;
    }

    if (configModal.mode === 'create') {
      const id = `node_${Date.now()}`;
      const newNode = {
        id,
        type: configModal.step.type,
        position: { x: 250, y: 100 }, // Default position, store will override if pending connection exists
        data: {
          label: configModal.step.label,
          type: configModal.step.type === 'trigger' ? configModal.step.id : undefined,
          type: configModal.step.type === 'action' ? configModal.step.id : undefined,
          type: configModal.step.type === 'condition' ? configModal.step.id : undefined,
          config
        },
      };
      addNode(newNode);
      toast.success("تمت إضافة الخطوة بنجاح");
    } else {
      updateNodeData(configModal.nodeId, { config });
      toast.success("تم تحديث الخطوة بنجاح");
    }

    setConfigModal({ open: false, step: null, mode: 'create', initialData: null });
  };

  return (
    <div className="flex-1 relative h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onSelectionChange={handleSelectionChange}
        defaultViewport={{ x: 600, y: 0, zoom: 0.7 }}
        snapToGrid
        nodesConnectable={false}
        elementsSelectable={true}
        snapGrid={[15, 15]}
      >
        <Background color="#94a3b8" variant="dots" gap={20} size={1} />
        <Controls position="bottom-right" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg" />
        <MiniMap
          nodeColor={getMiniMapNodeColor}
          // maskColor="rgba(241, 245, 249, 0.2)"
          className=" !rounded-lg !border-slate-200 dark:!border-slate-800 !shadow-lg"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Panel position="top-right" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">مساحة العمل v1.0</span>
        </Panel>
      </ReactFlow>

      <StepConfigModal
        isOpen={configModal.open}
        onClose={handleConfigSave}
        step={configModal.step}
        mode={configModal.mode}
        initialData={configModal.initialData}
      />

      <ConfirmDeleteDialog />

      {/* Expose sidebar trigger to parent */}
      <SidebarBridge onSelect={handleSelectStepFromSidebar} />
    </div>
  );
}

// Simple bridge to allow LeftSidebar to talk to BuilderCanvas without being inside ReactFlowProvider
const SidebarBridge = ({ onSelect }) => {
  useEffect(() => {
    const handle = (e) => onSelect(e.detail);
    window.addEventListener('select-automation-step', handle);
    return () => window.removeEventListener('select-automation-step', handle);
  }, [onSelect]);
  return null;
};

export default function AutomationBuilderPage() {
  return (
    <div className="flex h-screen flex-col  overflow-hidden bg-slate-50 dark:bg-[#050505] relative">
      <TopToolbar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar onSelectStep={(step) => window.dispatchEvent(new CustomEvent('select-automation-step', { detail: step }))} />
        <ReactFlowProvider>
          <BuilderCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}