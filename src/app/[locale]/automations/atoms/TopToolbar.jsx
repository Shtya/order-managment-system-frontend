import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
import { processNodesBeforeSave } from './nodeProcessors';
import { BASE_CONFIG } from './automation-config';

export function TopToolbar({ version, isPreviewMode: externalIsPreviewMode, setIsPreviewMode: setExternalIsPreviewMode }) {
    const t = useTranslations("whatsApp.automations.builder");
    const { isSuperAdmin, user, hasPermission } = useAuth();
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

    // Recovery logic for inconsistent 'run' mode on initialization (e.g., after reload)
    useEffect(() => {
        const state = useFlowStore.getState();
        if (state.mode === 'run' && (!state.currentRun || !state.currentRun.id)) {
            useFlowStore.setState({
                mode: state.automationId ? 'edit' : 'create',
                currentRun: null
            });
            if (setExternalIsPreviewMode) setExternalIsPreviewMode(false);
        }
    }, []);

    const triggerNode = useMemo(
        () => nodes.find((n) => n.type === 'trigger'),
        [nodes],
    );
    const triggerType = triggerNode?.data?.type;

    const handleSelectOrder = async (order) => {
        const snapshot = useFlowStore.getState();
        const now = new Date().toISOString();
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
             // Find the trigger item in any category
             let trigger = null;
             for (const category of BASE_CONFIG.TRIGGERS.categories) {
                 const found = category.items.find(item => item.id === payload.trigger.type);
                 if (found) {
                     trigger = found;
                     break;
                 }
             }
             console.log(trigger, payload.trigger, payload);
            const prev = {
                ...payload,
                previewId,
                adminId: null,
                userId: user.id,
                versionId: payload.version.id,
                versionString: payload.version.versionString,
                status: 'running',
                currentNodeId: null,
                completedNodeIds: [],
                errorMessage: null,
                flow: payload.version.flow,
                automationFlow: {
                    id: payload.automationFlowId,
                    name: payload.name,
                },
                executionState: {
                    trigger: payload.trigger,
                    steps: {},
                },
                triggerEntityType: trigger.entity,
                triggerEntityId: payload.trigger.output?.__mock ? null : payload.trigger.output?.id,
                waitingForInteraction: null,
                startedAt: now,
                createdAt: now,
                updatedAt: now,
                lastHeartbeatAt: now,

            }
            setPreviewRun(prev);
            setCurrentRun(prev);
            const response = await api.post('/automation/preview', payload);
            setPreviewId(response.data?.previewId);
            setPreviewRun(response.data);
            setCurrentRun(response.data);
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
                    toast.error(t('toolbar.previewEnded'));
                    handleSwitchToPreview();
                }
            } catch (error) {
                console.error('Heartbeat preview error:', error);
            }
        }, 5000);

        return () => clearInterval(heartbeatInterval);
    }, [isPreviewMode, previewId, t]);

    const validateFlow = () => {
        const hasNodeErrors = Object.values(nodeErrors).some(err => !!err);
        if (hasNodeErrors) {
            toast.error(t('toolbar.resolveErrors'));
            return false;
        }

        if (!name || name.trim() === '') {
            setNameError(t('toolbar.errorName'));
            // toast.error("يرجى إدخال اسم للأتمتة.");
            return false;
        }

        if (nodes.length < 2) {
            toast.error(t('toolbar.minNodes'));
            return false;
        }

        const triggerNodes = nodes.filter(n => n.type === 'trigger');
        if (triggerNodes.length !== 1) {
            toast.error(t('toolbar.exactlyOneTrigger'));
            return false;
        }

        return true;
    };

    const handleSave = async (publish = false) => {
        if (!validateFlow()) return;

        setSaving(true);

        // Toast IDs for reusing the same toast
        const processingToastId = 'processing-steps';
        const savingToastId = 'saving-automation';
        let stage = "processing";
        try {
            // Show processing steps toast
            toast.loading(t('toolbar.processingSteps'), { id: processingToastId });
            console.log("nodes", nodes);
            // 1. Run all async node setups concurrently
            const { processedNodes, allNewLinksIds } = await processNodesBeforeSave(nodes);
            console.log("processedNodes", processedNodes);

            // Collect deletedOldUrls from all nodes
            const nodeDeletedOldUrls = processedNodes.flatMap(n => n.data?.config?.deletedOldUrls || []);
            const allDeleted = [...new Set([...nodeDeletedOldUrls].filter(url => url))];

            // Update flow store with processed nodes
            useFlowStore.setState({ nodes: processedNodes });

            // Show processing success
            toast.success(t('toolbar.processingStepsSuccess'), { id: processingToastId });

            const triggerNode = processedNodes.find(n => n.type === 'trigger');
            if (!triggerNode) {
                toast.error(t('toolbar.missingTrigger'));
                return;
            }

            // Clean up deletedOldUrls and any extra fields from node data
            const cleanedNodes = processedNodes.map(n => {
                const { deletedOldUrls, ...restData } = n.data;
                return {
                    id: n.id,
                    type: n.type,
                    position: n.position,
                    data: restData
                };
            });

            const payload = {
                flow: {
                    nodes: cleanedNodes,
                    edges: edges.map(e => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        sourceHandle: e.sourceHandle,
                        targetHandle: e.targetHandle
                    }))
                },
                orphanFiles: {
                    deletedOldUrls: allDeleted,
                    newIds: allNewLinksIds.filter(id => id)
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
            stage = "saving";
            // Show saving automation toast
            toast.loading(t('toolbar.saving'), { id: savingToastId });

            if (isEditMode && automationId) {
                await api.put(`/automation/${automationId}`, payload);
            } else {
                await api.post('/automation', payload);
            }

            resetFlow();
            // Show save/publish success
            toast.success(publish ? t('toolbar.publishedSuccess') : t('toolbar.savedSuccess'), { id: savingToastId });
            router.push(isSuperAdmin ? '/dashboard/automations' : '/automations');
        } catch (error) {
            const prefix = error.nodeType ? `[${error.nodeType}]: ` : "";
            const message = error.response?.data?.message || error.message;

            toast.error(
                `${prefix}${Array.isArray(message)
                    ? message[0]
                    : message ||
                    (stage === "processing"
                        ? t("toolbar.processingStepsFailed")
                        : t("toolbar.saveFailed"))
                }`,
                {
                    id:
                        stage === "processing"
                            ? processingToastId
                            : savingToastId,
                }
            );
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



    return (
        <>
            <div className="absolute top-[15px] inset-x-[15px] z-40 flex items-center justify-end pointer-events-none">
                <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl pointer-events-auto">
                    <ToolbarButton
                        icon={<Layout size={18} />}
                        label={t('toolbar.reorder')}
                        onClick={reorderFlow}
                    />
                    <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                    {isViewMode ? (
                        hasPermission("automation.update") && (
                            <ToolbarButton
                                icon={<Edit3 size={18} />}
                                label={t('toolbar.editAutomation')}
                                onClick={() => router.push(isSuperAdmin ? `/dashboard/automations/edit/${automationId}?${version ? `v=${version}` : ''}` : `/automations/edit/${automationId}?${version ? `v=${version}` : ''}`)}
                                primary
                            />
                        )
                    ) : (
                        <>
                            <ToolbarButton
                                icon={isPreviewMode ? <X size={18} /> : <Play size={18} />}
                                label={isPreviewMode ? t('runPanel.stopPreview') : t('toolbar.previewPath')}
                                disabled={!isPreviewMode && nodes.length < 2}
                                onClick={handleSwitchToPreview}
                                danger={isPreviewMode}
                            />

                            {!isEditMode && (
                                <ToolbarButton
                                    icon={<Save size={18} />}
                                    label={t('toolbar.saveDraft')}
                                    onClick={() => handleSave(false)}
                                    disabled={saving}
                                />
                            )}

                            <ToolbarButton
                                icon={<Trash2 size={18} />}
                                label={t('toolbar.clearAll')}
                                onClick={handleClear}
                                danger
                            />
                            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                            <ToolbarButton
                                icon={<Rocket size={18} />}
                                label={t('toolbar.saveAndPublish')}
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
                    onStopPreview={handleSwitchToPreview}
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
