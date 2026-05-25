import { Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Trash2, AlertCircle, Edit3, Info, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { cn } from '@/utils/cn';
import { useFlowStore } from '@/hook/useFlowStore';
import { CustomHandle } from './CustomHandle';
import { hydrateNodeConfig } from '@/utils/flow-hydration';
import { useAuth } from '@/context/AuthContext';

export function BaseNode({
    id,
    data,
    noEdit = false,
    selected,
    title,
    subtitle,
    icon: Icon,
    colorClass = "text-primary",
    bgClass = "bg-primary/10",
    hasInput = true,
    hasOutput = true,
    children,
    isValid = true,
    errorMessage,
    onEdit,
    className
}) {
    const deleteNode = useFlowStore((s) => s.deleteNode);
    const edges = useFlowStore((s) => s.edges);
    const nodeErrors = useFlowStore((s) => s.nodeErrors);
    const actualErrorMessage = errorMessage || nodeErrors[id];
    const isInvalid = !isValid || !!actualErrorMessage;

    const isInputConnected = edges.some(e => e.target === id);
    const isOutputConnected = edges.some(e => e.source === id);
    const setNodeError = useFlowStore((s) => s.setNodeError);
    const setNodeHydration = useFlowStore((s) => s.setNodeHydration);
    const setNodeLoading = useFlowStore((s) => s.setNodeLoading);
    const hydration = useFlowStore((s) => s.nodeHydration[id]);
    const updateNodeData = useFlowStore((s) => s.updateNodeData);
    const mode = useFlowStore((s) => s.mode);
    const currentRun = useFlowStore((s) => s.currentRun);
    const changes = hydration?.changes || [];
    const isEditMode = mode === 'edit';
    const isViewMode = mode === 'view';
    const isRunMode = mode === 'run';
    const node = useFlowStore((s) => s.nodes.find(n => n.id === id));
    const nodeType = node?.type;

    // Execution status for run mode
    const executionState = useMemo(() => {
        if (nodeType === 'trigger') {
            return currentRun?.executionState?.trigger;
        }
        if (!isRunMode || !currentRun?.executionState?.steps) return null;
        return currentRun.executionState.steps[id];
    }, [isRunMode, currentRun, id, nodeType]);
    const currentNodeId = currentRun?.currentNodeId;
    const runStatus = currentRun?.status;

    const status = useMemo(() => {
        if (!isRunMode) return null;
        if (!executionState) return 'not_reached';
        if (nodeType === 'trigger') return '';
        if (currentNodeId === id && runStatus === 'running') return 'running';
        if (currentNodeId === id && runStatus === 'paused') return 'paused';
        return executionState.success ? 'success' : 'failed';
    }, [isRunMode, executionState, nodeType, currentNodeId, runStatus]);
    const { isSuperAdmin } = useAuth();
    useEffect(() => {
        if (isRunMode) return; // Skip hydration in run mode

        // 1. تعريف متغير يراقب حالة وجود المكون في الشاشة
        let isMounted = true;

        const hydrate = async () => {
            try {
                // مسموح هنا لأن المكون بدأ للتو
                setNodeLoading(id, true);

                const result = await hydrateNodeConfig(data.type, data.config, isSuperAdmin);

                // 2. 🛑 نقطة التفتيش: إذا غادر المستخدم الصفحة أثناء الـ await، أوقف التنفيذ فوراً!
                if (!isMounted) return;

                setNodeHydration(id, { isHydrated: true, changes: result?.changes || [] });
                setNodeError(id, result?.error || '');

                if (result?.changes?.length > 0) {
                    updateNodeData(id, { config: result?.newConfig }, true);
                }
            } catch (e) {
                console.error(e);

                // 3. التحقق قبل إرسال الخطأ
                if (isMounted) {
                    setNodeError(id, e.message);
                }
            } finally {
                // 4. التحقق قبل إيقاف التحميل
                if (isMounted) {
                    setNodeLoading(id, false);
                }
            }
        };

        hydrate();

        // 5. دالة التنظيف (Cleanup Function): تعمل تلقائياً عند مغادرة الصفحة
        return () => {
            isMounted = false;
        };
    }, [data, id, isRunMode]); // يُفضل إضافة id و isRunMode للمصفوفة لضمان عمل React بشكل سليم

    // Delete node with keyboard when selected
    useEffect(() => {
        if (!selected || isViewMode || data?.type === 'trigger') return;

        const handleKeyDown = (e) => {
            const isTyping =
                ["INPUT", "TEXTAREA", "SELECT"].includes(
                    document.activeElement?.tagName
                ) || document.activeElement?.isContentEditable;

            // Prevent deleting while typing
            if (isTyping) return;

            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                deleteNode(id);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selected, id, deleteNode]);

    const preventEdit = noEdit || (isSuperAdmin && nodeType === 'trigger' && data.type === 'order_created');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative min-w-[260px] max-w-[320px] rounded-[24px] border bg-white shadow-sm transition-all duration-300 dark:bg-slate-900",
                selected ? "border-primary ring-[4px] ring-primary/5 shadow-lg scale-[1.01]" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md",
                isInvalid && "border-rose-500 ring-[4px] ring-rose-500/5 shadow-rose-500/10",
                !isInvalid && changes.length > 0 && "border-emerald-500 ring-[4px] ring-emerald-500/5",
                status === 'success' && "border-emerald-500 ring-[4px] ring-emerald-500/10 bg-emerald-200/50 dark:bg-emerald-200/5",
                status === 'failed' && "border-rose-500 ring-[4px] ring-rose-500/10 bg-rose-200/50 dark:bg-rose-200/5",
                status === 'running' && "border-blue-500 ring-[4px] ring-blue-500/10 bg-blue-200/50 dark:bg-blue-200/5",
                status === 'paused' && "border-yellow-500 ring-[4px] ring-yellow-500/10 bg-yellow-200/50 dark:bg-yellow-200/5",
                status == 'not_reached' && nodeType !== 'trigger' && "opacity-60 grayscale-[0.5] bg-gray-200 dark:bg-gray-200/50",
                className
            )}
        >
            {/* Input Handle */}
            {hasInput && (
                <CustomHandle
                    type="target"
                    position={Position.Top}
                    isConnected={isInputConnected}
                    nodeId={id}
                />
            )}

            {/* Change Indicators */}
            {!isInvalid && changes.length > 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 whitespace-nowrap uppercase tracking-widest border-2 border-white dark:border-slate-900">
                    تم تحديث البيانات تلقائياً
                </div>
            )}

            {/* Header */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3 text-right rtl">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-[14px] transition-colors shadow-sm", bgClass)}>
                            <Icon className={cn("h-5 w-5", colorClass)} />
                        </div>
                        <div>
                            <h3 className="text-[13px] font-black text-slate-900 dark:text-slate-100 leading-tight">{title}</h3>
                            <p className="text-[9px] uppercase font-black tracking-[1px] text-slate-400 mt-0.5">{subtitle}</p>
                        </div>
                    </div>

                    {!isViewMode && !isRunMode && (
                        <div className="flex items-center gap-1">
                            {!preventEdit && <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.();
                                }}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="تعديل"
                            >
                                <Edit3 className="h-4 w-4" />
                            </button>}
                            {!(isEditMode && nodeType === 'trigger') && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNode(id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="حذف"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {isRunMode && executionState && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(new CustomEvent('show-step-info', { detail: { id, executionState } }));
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="معلومات الخطوة"
                        >
                            <Info className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Run Status Indicators */}
                {isRunMode && status === 'success' && (
                    <div className="mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">مكتمل</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">{new Date(executionState.executedAt).toLocaleTimeString()}</span>
                    </div>
                )}

                {isRunMode && status === 'failed' && (
                    <div className="mb-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <XCircle className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">فشل</span>
                            <span className="text-[9px] text-muted-foreground ml-auto">{new Date(executionState.executedAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[9px] font-bold text-rose-500 leading-tight bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg border border-rose-100 dark:border-rose-500/20">
                            {executionState.error}
                        </p>
                    </div>
                )}

                {/* Validation Error */}
                {actualErrorMessage && (
                    <div className="mb-3 p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 leading-normal">{actualErrorMessage}</p>
                    </div>
                )}

                {/* Changes List */}
                {!actualErrorMessage && changes.length > 0 && (
                    <div className="mb-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 space-y-1">
                        {changes.map((change, i) => (
                            <div key={i} className="flex items-end gap-2">
                                <div className="h-1 w-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <p className="text-[8px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight">
                                    {change}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="relative">
                    {children}
                </div>
            </div>

            {/* Output Handle */}
            {hasOutput && (
                <CustomHandle
                    type="source"
                    position={Position.Bottom}
                    isConnected={isOutputConnected}
                    nodeId={id}
                />
            )}
        </motion.div>
    );
}