import React, { useState } from 'react';
import {
    Save,
    Play,
    Rocket,
    ChevronRight,
    Trash2,
    Loader2,
    Edit3,
    Layout
} from 'lucide-react';
import { useRouter } from "@/i18n/navigation";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import api from "@/utils/api";

import { useFlowStore } from '@/hook/useFlowStore';

export function TopToolbar({ version }) {
    const edges = useFlowStore((s) => s.edges);
    const nodes = useFlowStore((s) => s.nodes);
    const name = useFlowStore((s) => s.name);

    const nodeErrors = useFlowStore((s) => s.nodeErrors);
    const setNameError = useFlowStore((s) => s.setNameError);
    const setDeleteConfirm = useFlowStore((s) => s.setDeleteConfirm);
    const saveDraft = useFlowStore((s) => s.saveDraft);
    const resetFlow = useFlowStore((s) => s.resetFlow);
    const reorderFlow = useFlowStore((s) => s.reorderFlow);
    const mode = useFlowStore((s) => s.mode);
    const automationId = useFlowStore((s) => s.automationId);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const isEditMode = mode === 'edit';
    const isViewMode = mode === 'view';

    const handleClear = () => {
        if (nodes.length === 0) return;
        setDeleteConfirm({ type: 'clear' });
    };

    const handleLocalSave = () => {
        saveDraft();
        toast.success("تم حفظ المسودة محلياً بنجاح");
    };
    console.log('hasNodeErrors: ', nodeErrors)
    const validateFlow = () => {
        const hasNodeErrors = Object.values(nodeErrors).some(err => !!err);
        console.log(nodeErrors)
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
            router.push('/automations');
        } catch (error) {
            const message = error.response?.data?.message;
            toast.error(Array.isArray(message) ? message[0] : (message || "فشل في حفظ الأتمتة."));
        } finally {
            setSaving(false);
        }
    };


    return (
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
                        onClick={() => router.push(`/automations/edit/${automationId}?${version ? `v=${version}` : ''}`)}
                        primary
                    />
                ) : (
                    <>
                        <ToolbarButton
                            icon={<Play size={18} />}
                            label="معاينة المسار"
                            onClick={() => { }}
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

