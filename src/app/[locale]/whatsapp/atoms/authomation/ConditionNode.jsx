import { Position } from '@xyflow/react';
import { GitBranch, Zap, ChevronRight, Check, X } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { CustomHandle } from './CustomHandle';
import { useFlowStore } from '@/hook/useFlowStore';

const CONDITION_TYPES = {
    'ORDER_CHECK': { label: 'فحص بيانات الطلب', icon: GitBranch, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    'QUICK_ORDER_STATUS': { label: 'فحص سريع للحالة', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
};

export function ConditionNode({ id, data, selected }) {
    const condition = CONDITION_TYPES[data.type] || CONDITION_TYPES.ORDER_CHECK;
    const Icon = condition.icon;
    const edges = useFlowStore((s) => s.edges);

    const isTrueConnected = edges.some(e => e.source === id && e.sourceHandle === 'true');
    const isFalseConnected = edges.some(e => e.source === id && e.sourceHandle === 'false');

    return (
        <BaseNode
            id={id}
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
            <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-purple-50/20 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/30 dark:border-purple-500/10 text-right rtl">
                {data.type === 'ORDER_CHECK' && (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between font-black text-purple-700 dark:text-purple-400">
                            <span className="truncate">{data.config?.field || '—'}</span>
                            <span className="text-slate-400 font-medium px-1.5">{data.config?.operator || '=='}</span>
                            <span className="truncate">{data.config?.targetValue || '—'}</span>
                        </div>
                        <div className="flex items-center justify-end mt-0.5 opacity-50 font-bold text-[9px]">
                            <span>التحقق من البيانات</span>
                        </div>
                    </div>
                )}
                {data.type === 'QUICK_ORDER_STATUS' && (
                    <div className="flex items-center justify-between">
                        <span className="font-black text-purple-700 dark:text-purple-400 uppercase tracking-tight">{data.config?.status || '—'}</span>
                        <span className="opacity-50 font-bold">فحص الحالة</span>
                    </div>
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