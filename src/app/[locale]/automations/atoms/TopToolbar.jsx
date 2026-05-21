import React, { useState, useEffect, useMemo } from 'react';
import {
    Save,
    Play,
    Rocket,
    ChevronRight,
    Trash2,
    Loader2,
    Edit3,
    Layout,
    X,
    Search,
    RefreshCw,
    Clock,
    Activity,
    User,
    Eye,
    Beaker,
    ChevronLeft
} from 'lucide-react';
import { faker } from '@faker-js/faker';
import { useRouter } from "@/i18n/navigation";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import api from "@/utils/api";

import { useFlowStore } from '@/hook/useFlowStore';
import { OrderDetailModal } from '@/app/[locale]/warehouse/tabs/DistributionTab';
import PreviewSidebar from './PreviewSidebar';
import { useSocket } from '@/context/SocketContext';
import { randomUUID } from 'crypto';
import { useAuth } from '@/context/AuthContext';
import RunDetailsPanel from './RunDetailsPanel';
import StepExecutionDialog from './StepExecutionDialog';

export function TopToolbar({ version, isPreviewMode: externalIsPreviewMode, setIsPreviewMode: setExternalIsPreviewMode }) {
    const { isSuperAdmin } = useAuth();
    const edges = useFlowStore((s) => s.edges);
    const nodes = useFlowStore((s) => s.nodes);
    const name = useFlowStore((s) => s.name);
    const nodeErrors = useFlowStore((s) => s.nodeErrors);
    const setNameError = useFlowStore((s) => s.setNameError);
    const setDeleteConfirm = useFlowStore((s) => s.setDeleteConfirm);
    const restoreFlow = useFlowStore((s) => s.restoreFlow);
    const resetFlow = useFlowStore((s) => s.resetFlow);
    const reorderFlow = useFlowStore((s) => s.reorderFlow);
    const mode = useFlowStore((s) => s.mode);
    const automationId = useFlowStore((s) => s.automationId);
    const [saving, setSaving] = useState(false);
    const [previewSidebarOpen, setPreviewSidebarOpen] = useState(false);
    const router = useRouter();
    const isEditMode = mode === 'edit';
    const isViewMode = mode === 'view';
    const { subscribe } = useSocket();
    const { user } = useAuth();
    const adminId = user?.id;
    const [previewRun, setPreviewRun] = useState(null);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
    const [stepInfo, setStepInfo] = useState(null);
    const [previewId, setPreviewId] = useState(null);
    // Use external state if provided (from builder page), otherwise use local state
    const isPreviewMode = externalIsPreviewMode !== undefined ? externalIsPreviewMode : false;
    const setIsPreviewMode = setExternalIsPreviewMode !== undefined ? setExternalIsPreviewMode : () => { };
    const setCurrentRun = useFlowStore((s) => s.setCurrentRun);
    const handleClear = () => {
        if (nodes.length === 0) return;
        setDeleteConfirm({ type: 'clear' });
    };
    const setFlowData = useFlowStore((s) => s.setFlowData);
    const [savedSnapshot, setSavedSnapshot] = useState(null);


    const triggerNode = useMemo(
        () => nodes.find((n) => n.type === 'trigger'),
        [nodes],
    );
    const triggerType = triggerNode?.data?.type;
    const triggerStoreId = triggerNode?.data?.config?.storeId || '';
    const triggerStatusId = triggerNode?.data?.config?.statusId || '';

    const handleSelectOrder = async (order) => {
        const snapshot = useFlowStore.getState();

        setSavedSnapshot({
            nodes: snapshot.nodes,
            edges: snapshot.edges,
            name: snapshot.name,
            nameError: snapshot.nameError,
            nodeErrors: snapshot.nodeErrors,
            nodeHydration: snapshot.nodeHydration,
            nodeLoading: snapshot.nodeLoading,
            mode: snapshot.mode,
            currentRun: snapshot.currentRun,
            automationId: snapshot.automationId,
            selectedNodeId: snapshot.selectedNodeId,
            pendingConnection: snapshot.pendingConnection,
            deleteConfirm: snapshot.deleteConfirm,
            skipDeleteConfirmation: snapshot.skipDeleteConfirmation,
        });

        setPreviewSidebarOpen(false);
        setIsPreviewMode(true);

        // Directly set the flow data without resetFlow to preserve nodes
        useFlowStore.setState({
            nodes: snapshot.nodes,
            edges: snapshot.edges.map(edge => ({ ...edge, type: "custom" })) || [],
            mode: 'run',
        });

        try {
            const payload = {
                adminId: adminId,
                automationFlowId: automationId,
                name: snapshot.name,
                version: {
                    id: faker.string.uuid(),
                    versionString: typeof version === 'string' ? version : version?.versionString || '1.0',
                    flow: {
                        nodes: snapshot.nodes,
                        edges: snapshot.edges,
                    },
                },
                trigger: {
                    nodeId: triggerNode?.id || 'start',
                    type: triggerType,
                    output: order
                },
                initialPayload: {}
            }
            const response = await api.post('/automation/preview', payload);
            setPreviewId(response.data?.previewId);
            setPreviewRun(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const unsubscribe = subscribe("AUTOMATION_PREVIEW_UPDATE", (payload) => {
            if (!payload) return;
            console.log("AUTOMATION_PREVIEW_UPDATE", payload);
            console.log("nodes", nodes);
            // Update the selected run if it's the one being updated
            setPreviewRun((prev) => {
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
    }, [subscribe, setPreviewRun]);

    // Heartbeat preview every 5 seconds when in preview mode
    useEffect(() => {
        if (!isPreviewMode || !previewId) return;

        const heartbeatInterval = setInterval(async () => {
            try {
                const response = await api.post(`/automation/preview/${previewId}/heartbeat`);
                if (response.data?.extended === false) {
                    toast.error("انتهت جلسة المعاينة");
                    handleSwitchToPreview();
                }
            } catch (error) {
                console.error('Heartbeat preview error:', error);
            }
        }, 5000);

        return () => clearInterval(heartbeatInterval);
    }, [isPreviewMode, previewId]);

    const validateFlow = () => {
        const hasNodeErrors = Object.values(nodeErrors).some(err => !!err);
        if (hasNodeErrors) {
            toast.error("يرجى حل جميع أخطاء العقد قبل الحفظ.");
            return false;
        }

        if (!name || name.trim() === '') {
            setNameError("يرجى إدخال اسم للأتمتة.");
            // toast.error("يرجى إدخال اسم للأتمتة.");
            return false;
        }

        if (nodes.length < 2) {
            toast.error("يجب أن يحتوي سير العمل على عقدتين على الأقل.");
            return false;
        }

        const triggerNodes = nodes.filter(n => n.type === 'trigger');
        if (triggerNodes.length !== 1) {
            toast.error("يجب أن يحتوي سير العمل على محفز واحد بالضبط.");
            return false;
        }

        return true;
    };

    const handleSave = async (publish = false) => {
        if (!validateFlow()) return;

        setSaving(true);
        try {
            const triggerNode = nodes.find(n => n.type === 'trigger');

            const payload = {

                flow: {
                    nodes: nodes.map(n => ({
                        id: n.id,
                        type: n.type,
                        position: n.position,
                        data: n.data
                    })),
                    edges: edges.map(e => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        sourceHandle: e.sourceHandle,
                        targetHandle: e.targetHandle
                    }))
                },
                ...(!isEditMode && {
                    publish,
                    triggerType: triggerNode.data.type,
                    name: name.trim(),
                }),
                ...(isEditMode && version && {
                    version
                }),
            };

            if (isEditMode && automationId) {
                await api.put(`/automation/${automationId}`, payload);
            } else {
                await api.post('/automation', payload);
            }
            resetFlow();
            toast.success(publish ? "تم نشر الأتمتة بنجاح!" : "تم حفظ الأتمتة بنجاح!");
            router.push(isSuperAdmin ? '/dashboard/automations' : '/automations');
        } catch (error) {
            const message = error.response?.data?.message;
            toast.error(Array.isArray(message) ? message[0] : (message || "فشل في حفظ الأتمتة."));
        } finally {
            setSaving(false);
        }
    };

    const handleSwitchToPreview = () => {
        if (isPreviewMode) {
            // Stop preview mode - restore flow
            if (savedSnapshot) {
                restoreFlow(savedSnapshot);
                setSavedSnapshot(null);
            }
            setIsPreviewMode(false);
            setPreviewRun(null);
            setPreviewId(null);
            setStepInfo(null);
            useFlowStore.setState({ mode: isEditMode ? 'edit' : 'create' });

            // Call delete preview endpoint (fire and forget)
            if (previewId) {
                api.delete(`/automation/preview/${previewId}`).catch(err => console.error('Delete preview error:', err));
            }
        } else {
            // Start preview mode - open sidebar
            setPreviewSidebarOpen(true);
        }
    };

    useEffect(() => {
        const handleShowStepInfo = (e) => setStepInfo(e.detail);
        window.addEventListener('show-step-info', handleShowStepInfo);
        return () => window.removeEventListener('show-step-info', handleShowStepInfo);
    }, []);

    console.log(isSuperAdmin, isSuperAdmin ? `/dashboard/automations/edit/${automationId}?${version ? `v=${version}` : ''}` : `/automations/edit/${automationId}?${version ? `v=${version}` : ''}`);

    return (
        <>
            <div className="absolute top-[15px] inset-x-[15px] z-50 flex items-center justify-end pointer-events-none">
                <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl pointer-events-auto">
                    <ToolbarButton
                        icon={<Layout size={18} />}
                        label="إعادة ترتيب"
                        onClick={reorderFlow}
                    />
                    <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                    {isViewMode ? (
                        <ToolbarButton
                            icon={<Edit3 size={18} />}
                            label="تعديل الأتمتة"
                            onClick={() => router.push(isSuperAdmin ? `/dashboard/automations/edit/${automationId}?${version ? `v=${version}` : ''}` : `/automations/edit/${automationId}?${version ? `v=${version}` : ''}`)}
                            primary
                        />
                    ) : (
                        <>
                            <ToolbarButton
                                icon={isPreviewMode ? <X size={18} /> : <Play size={18} />}
                                label={isPreviewMode ? "إيقاف المعاينة" : "معاينة المسار"}
                                disabled={!isPreviewMode && nodes.length < 2}
                                onClick={handleSwitchToPreview}
                                danger={isPreviewMode}
                            />

                            {!isEditMode && (
                                <ToolbarButton
                                    icon={<Save size={18} />}
                                    label="حفظ مسودة"
                                    onClick={() => handleSave(false)}
                                    disabled={saving}
                                />
                            )}

                            <ToolbarButton
                                icon={<Trash2 size={18} />}
                                label="مسح الكل"
                                onClick={handleClear}
                                danger
                            />
                            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                            <ToolbarButton
                                icon={<Rocket size={18} />}
                                label="حفظ ونشر"
                                onClick={() => handleSave(true)}
                                primary
                                disabled={saving}
                            />
                        </>
                    )}
                </div>
            </div>


            {/* Preview Sidebar */}
            <AnimatePresence>
                {previewSidebarOpen && (
                    <PreviewSidebar
                        nodes={nodes}
                        onSelectOrder={handleSelectOrder}
                        onClose={() => setPreviewSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
            {isPreviewMode && previewRun && (
                <RunDetailsPanel
                    rightPanelCollapsed={rightPanelCollapsed}
                    setRightPanelCollapsed={setRightPanelCollapsed}
                    selectedRun={previewRun}
                />
            )}

            <StepExecutionDialog
                stepInfo={stepInfo}
                onClose={() => setStepInfo(null)}
            />

            {rightPanelCollapsed && previewRun && (
                <button
                    onClick={() => setRightPanelCollapsed(false)}
                    className="absolute top-[30px] start-4 h-10 w-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center z-20 hover:scale-110 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
            )}
        </>
    );
}

function ToolbarButton({ icon, label, onClick, className, primary, danger, disabled }) {
    return (
        <div className="group relative flex flex-col items-center">
            <button
                onClick={onClick}
                disabled={disabled}
                className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300",
                    primary
                        ? "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
                        : danger
                            ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                {icon}
            </button>

            {/* Tooltip */}
            {!disabled && (
                <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                    {/* Arrow */}
                    <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mb-1 relative top-[2px]" />

                    <div className="bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap">
                        {label}
                    </div>
                </div>
            )}
        </div>
    );
}
