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
import { TopToolbar } from "@/app/[locale]/automations/atoms/TopToolbar";
import { ActionNode } from "@/app/[locale]/automations/atoms/ActionNode";
import { ConditionNode } from "@/app/[locale]/automations/atoms/ConditionNode";
import CustomEdge from "@/app/[locale]/automations/atoms/CustomEdge";
import { LeftSidebar } from "@/app/[locale]/automations/atoms/LeftSidebar";
import { TriggerNode } from "@/app/[locale]/automations/atoms/TriggerNode";
import { StepConfigModal } from "@/app/[locale]/automations/atoms/StepConfigModal";
import { ConfirmDeleteDialog } from "@/app/[locale]/automations/atoms/ConfirmDeleteDialog";
import { AUTOMATION_CONFIG } from "@/app/[locale]/automations/atoms/automation-config";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("whatsApp.automations.builder");
  const reactFlowWrapper = useRef(null);

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const clearFlow = useFlowStore((state) => state.clearFlow);

  useEffect(() => {
    // سيتم تنفيذ هذه الدالة فقط عند مغادرة المستخدم للصفحة
    return () => {
      clearFlow();
    };
  }, [clearFlow]);
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
          type: configModal.step.id ? configModal.step.id : undefined,
          config
        },
      };

      addNode(newNode);
      toast.success(t("toolbar.stepAddedSuccess"));
    } else {
      updateNodeData(configModal.nodeId, { config });
      toast.success(t("toolbar.stepUpdatedSuccess"));
    }

    setConfigModal({ open: false, step: null, mode: 'create', initialData: null });
  };

  const isValidConnection = useCallback((connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;

    // 1. Do not allow self-connections
    if (source === target) return false;

    // 2. Each handle should have only one connection
    // Check if source handle already has an outgoing edge
    const isSourceHandleOccupied = edges.some(
      (edge) => edge.source === source && edge.sourceHandle === sourceHandle
    );
    if (isSourceHandleOccupied) return false;

    // Check if target handle already has an incoming edge
    const isTargetHandleOccupied = edges.some(
      (edge) => edge.target === target && edge.targetHandle === targetHandle
    );
    if (isTargetHandleOccupied) return false;

    return true;
  }, [edges]);

  return (
    <div className="flex-1 relative h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onSelectionChange={handleSelectionChange}
        defaultViewport={{ x: 600, y: 0, zoom: 0.7 }}
        snapToGrid
        nodesConnectable={true}
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
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("toolbar.workspace")} v1.0</span>
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
  const automationId = useFlowStore((s) => s.automationId);
  const resetFlow = useFlowStore((s) => s.resetFlow);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (automationId) {
      resetFlow();
    }
  }, [automationId, resetFlow]);

  return (
    <div className="flex h-screen flex-col  overflow-hidden bg-slate-50 dark:bg-[#050505] relative">
      <div className="flex flex-1 overflow-hidden relative">
        <TopToolbar
          isPreviewMode={isPreviewMode}
          setIsPreviewMode={setIsPreviewMode}
        />
        {!isPreviewMode && (
          <LeftSidebar onSelectStep={(step) => window.dispatchEvent(new CustomEvent('select-automation-step', { detail: step }))} />
        )}
        <ReactFlowProvider>
          <BuilderCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}