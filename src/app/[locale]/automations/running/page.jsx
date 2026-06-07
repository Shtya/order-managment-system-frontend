"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Box,
  User,
  Hash,
  Monitor,
  Calendar,
  Zap,
  Layout,
  Pencil,
  RotateCcw,
  Maximize2,
  Loader2,
  ArrowRight,
  MessageCircle,
  ChevronDown,
  ExternalLink,
  Info,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hook/useDebounce";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";

import PageHeader from "@/components/atoms/Pageheader";
import { useFlowStore } from "@/hook/useFlowStore";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TriggerNode } from "../atoms/TriggerNode";
import { ActionNode } from "../atoms/ActionNode";
import { ConditionNode } from "../atoms/ConditionNode";
import CustomEdge from "../atoms/CustomEdge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FaBolt } from "react-icons/fa";
import { useSocket } from "@/context/SocketContext";
import RunDetailsPanel, { StatusRunBadge } from "../atoms/RunDetailsPanel";
import StepExecutionDialog from "../atoms/StepExecutionDialog";

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



export default function RunningAutomationsPage() {
  return (
    <ReactFlowProvider>
      <RunningAutomationsContent />
    </ReactFlowProvider>
  );
}

function RunningCanvas({ selectedRun }) {
  const reactFlowWrapper = useRef(null);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);

  const handleSelectionChange = useCallback((params) => {
    const newId = params.nodes[0]?.id || null;
    if (newId !== selectedNodeId) setSelectedNode(newId);
  }, [selectedNodeId, setSelectedNode]);

  return (
    <div className="flex-1 relative h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onSelectionChange={handleSelectionChange}
        defaultViewport={{ x: 600, y: 0, zoom: 0.7 }}
        snapToGrid
        snapGrid={[15, 15]}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={true}
      >
        <Background color="#94a3b8" variant="dots" gap={20} size={1} />
        <Controls position="bottom-right" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg" />
        <MiniMap
          nodeColor={getMiniMapNodeColor}
          className="!rounded-lg !border-slate-200 dark:!border-slate-800 !shadow-lg"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />

      </ReactFlow>
    </div>
  );
}

function RunningAutomationsContent() {
  const tAutomations = useTranslations("whatsApp.automations");
  const t = useTranslations("whatsApp.automationLogs");
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetId = searchParams.get("id");

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(!!targetId);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 10,
  });

  const [selectedRun, setSelectedRun] = useState(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [stepInfo, setStepInfo] = useState(null);

  const setFlowData = useFlowStore((s) => s.setFlowData);
  const reorderFlow = useFlowStore((s) => s.reorderFlow);
  const setCurrentRun = useFlowStore((s) => s.setCurrentRun);
  const [error, setError] = useState(null);
  const clearFlow = useFlowStore((state) => state.clearFlow);

  useEffect(() => {
    // سيتم تنفيذ هذه الدالة فقط عند مغادرة المستخدم للصفحة
    return () => {
      console.log('clearFlow')
      clearFlow();
    };
  }, [clearFlow]);

  const fetchRuns = async ({ page = 1, per_page = 10, search = "" } = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        status: "running,pending,failed,paused",
        page: page.toString(),
        limit: per_page.toString(),
      });
      if (search) query.append("search", search);

      const res = await api.get(`/automation/runs?${query.toString()}`);
      setRuns(res.data?.records || []);
      setPager({
        total_records: res.data?.total_records || 0,
        current_page: res.data?.current_page || page,
        per_page: res.data?.per_page || per_page,
      });
    } catch (e) {
      toast.error(t("errorFetchingRuns"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns({ page: 1, per_page: pager.per_page, search: debouncedSearch });
  }, [debouncedSearch]);

  // useEffect(() => {
  //   setMode("run");
  //   return () => setMode("create");
  // }, [setMode]);

  const loadRunDetail = async (id) => {
    setDetailLoading(true);
    setSidebarCollapsed(true);
    try {
      const res = await api.get(`/automation/runs/${id}`);
      const run = res.data;
      setSelectedRun(run);
      setCurrentRun(run);

      if (run.version?.flow) {
        setFlowData({
          nodes: run.version.flow.nodes,
          edges: run.version.flow?.edges.map(edge => ({ ...edge, type: "custom" })) || [],
          name: run.automationFlow?.name,
          id: run.automationFlowId,
        });
        useFlowStore.setState({ mode: 'run' });
        // setMode("run");
      }
      setRightPanelCollapsed(false);
      setError(null);
    } catch (e) {
      setSidebarCollapsed(false);
      toast.error(t("errorFetchingDetails"));
      setError(t("errorFetchingDetails"));
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      loadRunDetail(targetId);
    }
  }, [targetId]);

  useEffect(() => {
    const handleShowStepInfo = (e) => setStepInfo(e.detail);
    window.addEventListener('show-step-info', handleShowStepInfo);
    return () => window.removeEventListener('show-step-info', handleShowStepInfo);
  }, []);

  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe("AUTOMATION_RUN_UPDATE", (payload) => {
      if (!payload) return;

      // Update the main runs list
      setRuns((prev) =>
        prev.map((run) =>
          run.id === payload.runId
            ? {
              ...run,
              status: payload.status,
              currentNodeId: payload.currentNodeId,
              completedNodeIds: payload.completedNodeIds,
              errorMessage: payload.errorMessage,
              executionState: payload.executionState,
            }
            : run
        )
      );

      // Update the selected run if it's the one being updated
      setSelectedRun((prev) => {
        if (prev?.id === payload.runId) {
          const updated = {
            ...prev,
            status: payload.status,
            currentNodeId: payload.currentNodeId,
            completedNodeIds: payload.completedNodeIds,
            errorMessage: payload.errorMessage,
            executionState: payload.executionState,
          };
          setCurrentRun(updated); // Also update the flow store
          return updated;
        }
        return prev;
      });
    });

    return unsubscribe;
  }, [subscribe, setCurrentRun]);

  const handleRestart = async () => {
    if (!selectedRun) return;
    const toastId = toast.loading(t("restarting"));
    try {
      await api.post(`/automation/runs/${selectedRun.id}/retry`);
      toast.success(t("restartSuccess"), { id: toastId });
      loadRunDetail(selectedRun.id);
    } catch (error) {
      toast.error(t("restartFailed"), { id: toastId });
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    await fetchRuns({ page: pager.current_page, per_page: pager.per_page, search: debouncedSearch });
    // if (selectedRun) {
    //   await loadRunDetail(selectedRun.id);
    // }
    toast.success(t("refreshSuccess"));
  };

  const handleReorder = () => {
    reorderFlow();
    toast.success(t("reorderSuccess"));
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(pager.total_records / pager.per_page));
  }, [pager]);



  const pageItems = useMemo(() => {
    const tot = totalPages;
    const cur = pager.current_page;
    if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
    const items = [1];
    const start = Math.max(2, cur - 2);
    const end = Math.min(tot - 1, cur + 2);
    if (start > 2) items.push("…");
    for (let p = start; p <= end; p++) items.push(p);
    if (end < tot - 1) items.push("…");
    items.push(tot);
    return items;
  }, [totalPages, pager.current_page]);


  const version = selectedRun?.version?.versionString || "";

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#050505] transition-all duration-500 overflow-hidden relative">
      <header className="min-h-20 h-auto lg:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 md:px-8 py-4 lg:py-0 shrink-0 z-20 gap-4">
        <div className="flex flex-col">
          <h1 className="text-sm font-black text-slate-900 dark:text-slate-100">{t("title")}</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <button
            onClick={handleReorder}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-black hover:bg-slate-50 transition-all shadow-sm"
          >
            <Layout size={14} />
            <span className="truncate">{t("reorder")}</span>
          </button>
          {selectedRun && (
            <>
              {hasPermission("automation.update") && (
                <>
                  <button
                    onClick={() => router.push(`/automations/edit/${selectedRun.automationFlowId}?${version ? `v=${version}` : ''}`)}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-black hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Pencil size={14} />
                    <span className="truncate">{t("editVersion")}</span>
                  </button>
                  <button
                    onClick={handleRestart}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-[11px] font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    <RefreshCw size={14} />
                    <span className="truncate">{t("retryNow")}</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      <div className="flex h-screen flex-1 overflow-hidden relative">
        {/* Right Sidebar: Run Info */}
        <RunDetailsPanel
          rightPanelCollapsed={rightPanelCollapsed}
          setRightPanelCollapsed={setRightPanelCollapsed}
          selectedRun={selectedRun}
        />

        {/* Center: Canvas */}
        <div className="flex-1 relative bg-slate-50 dark:bg-[#050505]">
          {detailLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <div className="absolute -inset-4 border-2 border-primary/20 border-dashed rounded-full animate-[spin_8s_linear_infinite]" />
              </div>
              <p className="mt-8 text-[11px] font-black text-slate-500 uppercase tracking-widest animate-pulse">{t("loadingExecutionDetails")}</p>
            </div>
          ) : error ? (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#050505] p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
                <Layout size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">{t("errorOccurred")}</h2>
              <p className="text-sm text-slate-500 font-medium mb-8 max-w-xs">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="h-12 px-8 rounded-2xl bg-primary text-white font-black text-xs shadow-lg shadow-primary/20 transition-all hover:scale-105"
              >
                {t("retry")}
              </button>
            </div>
          ) : selectedRun ? (
            <RunningCanvas selectedRun={selectedRun} />
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center justify-center text-slate-300">
              <div className="w-20 h-20 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                <Activity size={40} />
              </div>
              <p className="text-[13px] font-black uppercase tracking-widest">{t("selectRunToContinue")}</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarCollapsed(true)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[45] lg:hidden"
            />
          )}
        </AnimatePresence>

        <aside
          className={cn(
            "flex flex-col h-full bg-white dark:bg-slate-900 border-l dark:border-slate-800 overflow-hidden",
            "transition-all duration-300 ease-out z-[56]",
            "fixed inset-y-0 end-0 lg:relative",
            sidebarCollapsed || (targetId && detailLoading)
              ? "ltr:translate-x-full rtl:-translate-x-full lg:w-0 lg:border-none lg:opacity-0"
              : "translate-x-0 w-[280px] sm:w-[320px] opacity-100 shadow-2xl lg:shadow-none"
          )}
        >
          <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex flex-col items-center justify-between gap-4">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3">
                  {/* <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <Zap size={18} className="text-slate-500" />
                  </div> */}
                  <h2 className="text-[13px] font-black">{t("allRuns")}</h2>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black">{pager.total_records}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="text-slate-400 hover:text-primary bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-800 transition-all hover:scale-110 disabled:opacity-50"
                    title={t("refresh")}
                  >
                    <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                  </button>
                  <button onClick={() => setSidebarCollapsed(true)} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2 pl-9 pr-4 text-[11px] focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("loading")}</p>
              </div>
            ) : runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Layout className="w-8 h-8 text-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("noRuns")}</p>
              </div>
            ) : (
              runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => loadRunDetail(run.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl text-right transition-all border border-transparent",
                    selectedRun?.id === run.id
                      ? "bg-primary/[0.03] border-primary/20 shadow-sm"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">
                      {tAutomations(`triggers.${run.automationFlow?.triggerType}`)}
                    </span>
                    <StatusRunBadge status={run.status} t={t} />
                  </div>
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Zap size={10} className="text-primary/60" />
                      <span className="text-[10px] font-bold">{run.automationFlow?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-400">
                      <Activity size={10} className="text-slate-400" />
                      <span>{t("stepsCompleted", { count: run.completedNodeIds?.length || 0 })}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>{new Date(run.startedAt).toLocaleTimeString()}</span>
                    </div>
                    {run.status === 'failed' && (
                      <span className="text-rose-500 font-bold truncate max-w-[150px]">{run.errorMessage}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>


          {!sidebarCollapsed && totalPages > 1 && (
            <div className="p-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-center gap-1">
              {pageItems.map((p, idx) => (
                p === "…" ? (
                  <span key={`dots-${idx}`} className="w-8 text-center text-slate-400 text-[10px]">···</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => fetchRuns({ page: p, per_page: pager.per_page })}
                    className={cn(
                      "w-8 h-8 rounded-xl text-[10px] font-black transition-all",
                      p === pager.current_page
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>
          )}

        </aside>

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-[100px] end-4 h-10 w-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {/* Floating Toggle for Right Panel */}
        {rightPanelCollapsed && selectedRun && (
          <button
            onClick={() => setRightPanelCollapsed(false)}
            className="absolute top-[100px] start-4 h-10 w-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Step Info Modal */}
      <StepExecutionDialog
        stepInfo={stepInfo}
        onClose={() => setStepInfo(null)}
      />
    </div>
  );
}



function DataCard({ title, data }) {
  const t = useTranslations("whatsApp.automationLogs");
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-[300px] overflow-auto">
        <pre
          dir="ltr"
          className="text-[10px] font-mono leading-relaxed text-left overflow-auto"
        >
          {data ? JSON.stringify(data, null, 2) : t("noData")}
        </pre>
      </div>
    </div>
  );
}
