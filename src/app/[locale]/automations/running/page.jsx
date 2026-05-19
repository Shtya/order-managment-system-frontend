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
} from "lucide-react";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hook/useDebounce";

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

import { TriggerNode } from "../atoms/authomation/TriggerNode";
import { ActionNode } from "../atoms/authomation/ActionNode";
import { ConditionNode } from "../atoms/authomation/ConditionNode";
import CustomEdge from "../atoms/authomation/CustomEdge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FaBolt } from "react-icons/fa";

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

function StatusBadge({ status, t }) {
  const config = {
    pending: { color: "bg-slate-100 text-slate-600", icon: Clock },
    running: { color: "bg-blue-100 text-blue-600 animate-pulse", icon: Play },
    completed: { color: "bg-emerald-100 text-emerald-600", icon: CheckCircle2 },
    failed: { color: "bg-rose-100 text-rose-600", icon: XCircle },
    paused: { color: "bg-amber-100 text-amber-600", icon: AlertCircle },
  };

  const { color, icon: Icon } = config[status] || config.pending;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", color)}>
      <Icon size={10} />
      {t(`statuses.${status}`)}
    </div>
  );
}

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
  const t = useTranslations("whatsApp.automationLogs");
  const tAutomations = useTranslations("whatsApp.automations");
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
  console.log(selectedRun)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [stepInfo, setStepInfo] = useState(null);

  const setFlowData = useFlowStore((s) => s.setFlowData);
  const reorderFlow = useFlowStore((s) => s.reorderFlow);
  const setCurrentRun = useFlowStore((s) => s.setCurrentRun);
  const [error, setError] = useState(null);


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
      toast.error("حدث خطأ أثناء تحميل المسارات");
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
      toast.error("حدث خطأ أثناء تحميل التفاصيل");
      setError("حدث خطأ أثناء تحميل التفاصيل");
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

  const handleRestart = () => {
    toast.success("تم إرسال طلب إعادة التشغيل");
  };

  const handleReorder = () => {
    reorderFlow();
    toast.success("تمت إعادة ترتيب المسار");
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(pager.total_records / pager.per_page));
  }, [pager]);

  const currentNodeLabel = useMemo(() => {
    if (!selectedRun) return "—";
    const node = selectedRun.version?.flow?.nodes?.find(n => n.id === selectedRun.currentNodeId);
    return node?.data?.label || selectedRun.currentNodeId || "—";
  }, [selectedRun]);

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

  const formatDuration = (start, end) => {
    if (!end) return "-";

    const diffMs = new Date(end).getTime() - new Date(start).getTime();

    const totalSeconds = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];

    if (days) parts.push(`${days} يوم`);
    if (hours) parts.push(`${hours} ساعة`);
    if (minutes) parts.push(`${minutes} دقيقة`);
    if (seconds || parts.length === 0) parts.push(`${seconds || 0} ثانية`);

    return parts.join(" و ");
  };
  const version = selectedRun?.version?.versionString || "";

  return (
    <div className="h-screen flex-col overflow-hidden bg-slate-50 dark:bg-[#050505]">
      {/* Header */}
      <div className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-slate-100">تشغيل المسارات</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">مراقبة العمليات الجارية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReorder}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-black hover:bg-slate-50 transition-all shadow-sm"
          >
            <Layout size={14} />
            إعادة ترتيب
          </button>
          <button
            onClick={() => router.push(`/automations/edit/${selectedRun.automationFlowId}?${version ? `v=${version}` : ''}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-black hover:bg-slate-50 transition-all shadow-sm"
          >
            <Pencil size={14} />
            تعديل النسخة
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[11px] font-black hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <RotateCcw size={14} />
            إعادة المحاولة الآن
          </button>
        </div>
      </div>

      <div className="flex h-screen flex-1 overflow-hidden relative">
        {/* Right Sidebar: Run Info */}
        <AnimatePresence>
          {!rightPanelCollapsed && selectedRun && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <Layout size={18} className="text-slate-500" />
                  </div>
                  <h2 className="text-[13px] font-black">معلومات التشغيل</h2>
                </div>
                <button onClick={() => setRightPanelCollapsed(true)} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة التشغيل</span>
                  <StatusBadge status={selectedRun.status} t={t} />
                </div>

                <InfoSection title="المسار والنسخة" icon={<Zap size={14} />}>
                  <InfoItem label="المسار" value={selectedRun.automationFlow?.name} />
                  <InfoItem label="النسخة" value={`v${selectedRun.version?.versionString}`} />
                  <InfoItem label="المحفز" value={tAutomations(`triggers.${selectedRun.automationFlow?.triggerType}`)} />
                </InfoSection>

                <InfoSection title="حالة التنفيذ" icon={<Activity size={14} />}>
                  <InfoItem
                    label="الخطوة الحالية"
                    value={currentNodeLabel}
                  />
                  <InfoItem
                    label="الخطوات المكتملة"
                    value={`${selectedRun.completedNodeIds?.length || 0} خطوة`}
                  />
                </InfoSection>

                <InfoSection title="التوقيت" icon={<Clock size={14} />}>
                  <InfoItem label="وقت البدء" value={new Date(selectedRun.startedAt).toLocaleString()} />
                  {selectedRun.completedAt && (
                    <InfoItem label="وقت الانتهاء" value={new Date(selectedRun.completedAt).toLocaleString()} />
                  )}
                  <InfoItem label="المدة الكلية" value={selectedRun.completedAt ? `${formatDuration(selectedRun.startedAt, new Date())}` : "جاري..."} />
                </InfoSection>

                <InfoSection title="معلومات إضافية" icon={<Box size={14} />}>
                  <InfoItem label="الكيان المخفز" value={selectedRun.triggerEntityType} />
                  <InfoItem
                    label="الطلب"
                    value={`#${selectedRun.triggerEntityId}`}
                    onClick={selectedRun.triggerEntityType === 'order' ? () => {
                      router.push(`/orders/details/${selectedRun.triggerEntityId}`)
                    } : null}
                  // icon={ExternalLink}
                  />
                </InfoSection>


                {selectedRun.status === 'failed' && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20">
                    <div className="flex items-center gap-2 text-rose-600 mb-2">
                      <XCircle size={14} />
                      <span className="text-[11px] font-black">تفاصيل الفشل</span>
                    </div>
                    <p className="text-[10px] font-bold text-rose-500 leading-relaxed">{selectedRun.errorMessage}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <p className="mt-8 text-[11px] font-black text-slate-500 uppercase tracking-widest animate-pulse">جاري تحميل بيانات التنفيذ...</p>
            </div>
          ) : error ? (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#050505] p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
                <Layout size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">عذراً، حدث خطأ ما</h2>
              <p className="text-sm text-slate-500 font-medium mb-8 max-w-xs">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="h-12 px-8 rounded-2xl bg-primary text-white font-black text-xs shadow-lg shadow-primary/20 transition-all hover:scale-105"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : selectedRun ? (
            <RunningCanvas selectedRun={selectedRun} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                <Layout size={32} />
              </div>
              <p className="text-[13px] font-black uppercase tracking-widest">اختر عملية تشغيل للمتابعة</p>
            </div>
          )}
        </div>

        <motion.div
          initial={false}
          animate={{ width: sidebarCollapsed || (targetId && detailLoading) ? 0 : 320 }}
          className={cn(
            "h-full z-10 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col relative overflow-hidden",
            sidebarCollapsed && "border-none"
          )}
        >
          <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex flex-col items-center justify-between gap-4">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <Zap size={18} className="text-slate-500" />
                  </div>
                  <h2 className="text-[13px] font-black">جميع عمليات التشغيل</h2>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black">{pager.total_records}</span>
                </div>
                <button onClick={() => setSidebarCollapsed(true)} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="البحث بالطلب أو المسار..."
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">جاري التحميل...</p>
              </div>
            ) : runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Layout className="w-8 h-8 text-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">لا توجد عمليات</p>
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
                    <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">طلب #{run.triggerEntityId}</span>
                    <StatusBadge status={run.status} t={t} />
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Zap size={10} className="text-primary/60" />
                    <span className="text-[10px] font-bold">{run.automationFlow?.name}</span>
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

        </motion.div>

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-[30px] end-4 h-10 w-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center z-20 hover:scale-110 transition-all"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>)}
        {/* Floating Toggle for Right Panel */}
        {rightPanelCollapsed && selectedRun && (
          <button
            onClick={() => setRightPanelCollapsed(false)}
            className="absolute top-[30px] start-4 h-10 w-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center z-20 hover:scale-110 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Step Info Modal */}
      <Dialog open={!!stepInfo} onOpenChange={() => setStepInfo(null)}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="text-primary" />
              تفاصيل تنفيذ الخطوة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <DataCard title="بيانات المدخلات (Input)" data={stepInfo?.executionState?.input} />
              <DataCard title="بيانات المخرجات (Output)" data={stepInfo?.executionState?.output} />
            </div>
            {stepInfo?.executionState?.error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
                <h4 className="text-[11px] font-black text-rose-600 mb-2">رسالة الخطأ</h4>
                <p className="text-[11px] font-bold text-rose-500">{stepInfo.executionState.error}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoSection({ title, icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function InfoItem({ label, value, onClick, icon: Icon }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
      {onClick ? (
        <button
          onClick={onClick}
          className="cursor-pointer"
        >
          <ExternalLink
            className="flex items-center gap-1.5 text-[11px] font-black text-primary hover:underline group cursor-pointer"
          >
            {value || "—"}
            {/* {Icon && <Icon size={10} className="group-hover:translate-x-0.5 transition-transform" />} */}
          </ExternalLink>
        </button>
      ) : (
        <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">{value || "—"}</span>
      )}
    </div>
  );
}

function DataCard({ title, data }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-[300px] overflow-auto">
        <pre
          dir="ltr"
          className="text-[10px] font-mono leading-relaxed text-left overflow-auto"
        >
          {data ? JSON.stringify(data, null, 2) : "لا توجد بيانات"}
        </pre>
      </div>
    </div>
  );
}
