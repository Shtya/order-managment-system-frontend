'use client';

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, ChevronRight, Layout } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import api from "@/utils/api";
import toast from "react-hot-toast";
import { useFlowStore } from "@/hook/useFlowStore";
import { TopToolbar } from "../../atoms/TopToolbar";
import { LeftSidebar } from "../../atoms/LeftSidebar";
import { TriggerNode } from "../../atoms/TriggerNode";
import { ActionNode } from "../../atoms/ActionNode";
import { ConditionNode } from "../../atoms/ConditionNode";
import CustomEdge from "../../atoms/CustomEdge";
import { StepConfigModal } from "../../atoms/StepConfigModal";
import { ConfirmDeleteDialog } from "../../atoms/ConfirmDeleteDialog";
import { AUTOMATION_CONFIG } from "../../atoms/automation-config";
import { useReactFlow, ReactFlow, Background, Controls, MiniMap, Panel } from "@xyflow/react";
import { useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

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
    case 'trigger': return '#10b981';
    case 'action': return '#3b82f6';
    case 'condition': return '#a855f7';
    default: return '#cbd5e1';
  }
};

function BuilderCanvas({ version }) {
  const t = useTranslations("whatsApp.automations.builder");
  const reactFlowWrapper = useRef(null);
  const { setViewport } = useReactFlow();

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);

  const [configModal, setConfigModal] = useState({ open: false, step: null, mode: 'create', initialData: null });

  useEffect(() => {
    const handleEdit = (e) => {
      const { id, data } = e.detail;
      let foundStep = null;
      Object.values(AUTOMATION_CONFIG).forEach(section => {
        section.categories.forEach(cat => {
          const item = cat.items.find(i => i.id === data.type);
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
    if (newId !== selectedNodeId) setSelectedNode(newId);
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
        position: { x: 250, y: 100 },
        data: {
          label: configModal.step.label,
          type: configModal.step.id,
          config
        },
      };
      addNode(newNode);
    } else {
      updateNodeData(configModal.nodeId, { config });
    }

    setConfigModal({ open: false, step: null, mode: 'create', initialData: null });
  };

  const isValidConnection = useCallback((connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (source === target) return false;

    const isSourceHandleOccupied = edges.some(edge => edge.source === source && edge.sourceHandle === sourceHandle);
    if (isSourceHandleOccupied) return false;

    const isTargetHandleOccupied = edges.some(edge => edge.target === target && edge.targetHandle === targetHandle);
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
        <MiniMap nodeColor={getMiniMapNodeColor} className="!rounded-lg !border-slate-200 dark:!border-slate-800 !shadow-lg" nodeStrokeWidth={3} zoomable pannable />
        <Panel position="top-end" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {
              version ? t("toolbar.editAutomationVersion", { version }) : t("toolbar.editAutomationLatest")
            }
          </span>
        </Panel>
      </ReactFlow>

      <StepConfigModal isOpen={configModal.open} onClose={handleConfigSave} step={configModal.step} mode={configModal.mode} initialData={configModal.initialData} />
      <ConfirmDeleteDialog />
      <SidebarBridge onSelect={handleSelectStepFromSidebar} />
    </div>
  );
}

const SidebarBridge = ({ onSelect }) => {
  useEffect(() => {
    const handle = (e) => onSelect(e.detail);
    window.addEventListener('select-automation-step', handle);
    return () => window.removeEventListener('select-automation-step', handle);
  }, [onSelect]);
  return null;
};

export default function EditAutomationPage() {
  const t = useTranslations("whatsApp.automations.builder");
  const params = useParams();
  const automationId = params?.id;
  const setFlowData = useFlowStore((s) => s.setFlowData);
  const searchParams = useSearchParams();
  const version = searchParams.get('v');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const clearFlow = useFlowStore((state) => state.clearFlow);

  useEffect(() => {
    // سيتم تنفيذ هذه الدالة فقط عند مغادرة المستخدم للصفحة
    return () => {
      clearFlow();
    };
  }, [clearFlow]);
  useEffect(() => {
    if (!automationId) return;

    const fetchAutomation = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/automation/${automationId}${version ? `?version=${version}` : ''}`);
        const data = res.data;
        const versionToUse = data.versions?.[0];

        setFlowData({
          id: data.id,
          name: data.name,
          nodes: versionToUse?.flow?.nodes || [],
          edges: versionToUse?.flow?.edges.map(edge => ({ ...edge, type: "custom" })) || []
        });

        setError(null);
      } catch (err) {
        console.error("Failed to fetch automation:", err);
        setError(t("toolbar.failedToLoadData"));
        toast.error(t("toolbar.failedToLoadData"));
      } finally {
        setLoading(false);
      }
    };

    fetchAutomation();

    // Cleanup store on unmount if needed, or just let it be
    // return () => resetFlow();
  }, [automationId, setFlowData, t, version]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#050505]">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <div className="absolute -inset-4 border-2 border-primary/20 border-dashed rounded-full animate-[spin_8s_linear_infinite]" />
        </div>
        <p className="mt-8 text-sm font-black text-slate-500 animate-pulse">{t("toolbar.loadingFlowData")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#050505] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
          <Layout size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">{t("toolbar.errorOccurred")}</h2>
        <p className="text-sm text-slate-500 font-medium mb-8 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="h-12 px-8 rounded-2xl bg-primary text-white font-black text-xs shadow-lg shadow-primary/20 transition-all hover:scale-105"
        >
          {t("toolbar.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-[#050505] relative">
      <div className="flex flex-1 overflow-hidden">
      <TopToolbar version={version}  isPreviewMode={isPreviewMode} setIsPreviewMode={setIsPreviewMode}/>
         {!isPreviewMode && (
          <LeftSidebar onSelectStep={(step) => window.dispatchEvent(new CustomEvent('select-automation-step', { detail: step }))} />
         )}
        <ReactFlowProvider>
          <BuilderCanvas version={version} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
