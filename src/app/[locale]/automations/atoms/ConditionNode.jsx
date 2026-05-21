import React from 'react';
import { Position } from '@xyflow/react';
import { GitBranch, Zap, Check, Loader2, X } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { CustomHandle } from './CustomHandle';
import { useFlowStore } from '@/hook/useFlowStore';

const CONDITION_TYPES = {
    'order_check': { label: 'فحص بيانات الطلب', icon: GitBranch, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    'quick_order_status': { label: 'فحص سريع للحالة', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
};

export function ConditionNode({ id, data, selected }) {

    const condition = CONDITION_TYPES[data.type] || CONDITION_TYPES['order_check'];
    const Icon = condition.icon;
    const edges = useFlowStore((s) => s.edges);
    const loading = useFlowStore((s) => s.nodeLoading[id]);

    const isTrueConnected = edges.some(e => e.source === id && e.sourceHandle === 'true');
    const isFalseConnected = edges.some(e => e.source === id && e.sourceHandle === 'false');


    return (
        <BaseNode
            id={id}
            data={data}
            selected={selected}
            title={condition.label}
            subtitle="التحقق المنطقي"
            icon={Icon}
            colorClass={condition.color}
            bgClass={condition.bg}
            hasOutput={false} // Multiple outputs below
            onEdit={() => window.dispatchEvent(new CustomEvent('edit-automation-step', { detail: { id, data } }))}
            className="border-t-[6px] border-t-purple-500"
        >
            <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-purple-50/20 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/30 dark:border-purple-500/10 text-right rtl min-h-[50px] flex flex-col justify-center">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                        <Loader2 size={12} className="animate-spin text-purple-500" />
                        <span className="font-bold opacity-50">جاري التحقق...</span>
                    </div>
                ) : (
                    <>
                        {data.type === 'order_check' && (
                            <div className="flex flex-col gap-1.5">
                                {data.config?.checks?.length > 0 ? (
                                    <>
                                        <div className="flex flex-col gap-1">
                                            {data.config.checks.slice(0, 2).map((check, idx) => (
                                                <div key={idx} className="flex items-center justify-between font-black text-purple-700 dark:text-purple-400 border-b border-purple-500/5 last:border-0 pb-1 last:pb-0 gap-2">
                                                    {/* تم استبدال word-break بـ block break-all لضمان احترام العرض الأقصى والكسر الصارم عند الحاجة */}
                                                    <span className="block break-all max-w-[60px]">{check.targetLabel || check.targetValue}</span>

                                                    <span className="text-slate-400 font-medium px-1 shrink-0">{check.operator}</span>

                                                    <span className="block break-all max-w-[60px]">{check.fieldLabel || check.field}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {data.config.checks.length > 2 && (
                                            <div className="text-[8px] text-slate-400 font-bold mt-0.5 text-center bg-slate-100 dark:bg-slate-800 rounded py-0.5">
                                                + {data.config.checks.length - 2} شروط أخرى
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-slate-400 italic text-center">لا توجد شروط</div>
                                )}
                                <div className="flex items-center justify-end mt-0.5 opacity-50 font-bold text-[9px]">
                                    <span>فحص بيانات الطلب</span>
                                </div>
                            </div>
                        )}
                        {data.type === 'quick_order_status' && (
                            <div className="flex items-center justify-between">
                                <span className="font-black text-purple-700 dark:text-purple-400 uppercase tracking-tight">{data.config?.status || '—'}</span>
                                <span className="opacity-50 font-bold">فحص الحالة</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dynamic Branching Outputs (True / False) */}
            <div className="absolute top-full left-[20%] -translate-x-1/2 flex flex-col items-center">
                <CustomHandle
                    type="source"
                    position={Position.Bottom}
                    id="true"
                    noOffset
                    className="!static !translate-y-0"
                    nodeId={id}
                    isConnected={isTrueConnected}
                />
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 shadow-sm mt-1.5">
                    <Check size={8} strokeWidth={4} className="text-emerald-600" />
                    <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">نعم</span>
                </div>
            </div>
            <div className="absolute top-full left-[80%] -translate-x-1/2 flex flex-col items-center">
                <CustomHandle
                    type="source"
                    position={Position.Bottom}
                    id="false"
                    noOffset
                    className="!static !translate-y-0"
                    nodeId={id}
                    isConnected={isFalseConnected}
                />
                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-lg border border-rose-100 dark:border-rose-500/20 shadow-sm mt-1.5">
                    <X size={8} strokeWidth={4} className="text-rose-600" />
                    <span className="text-[8px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-tighter">لا</span>
                </div>
            </div>
        </BaseNode>
    );
}