import { Position } from '@xyflow/react';
import { GitBranch, Zap, ChevronRight, Check, X } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { CustomHandle } from './CustomHandle';

const CONDITION_TYPES = {
    'ORDER_CHECK': { label: 'فحص بيانات الطلب', icon: GitBranch, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    'QUICK_ORDER_STATUS': { label: 'فحص سريع للحالة', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
};

export function ConditionNode({ id, data, selected }) {
    const condition = CONDITION_TYPES[data.conditionType] || CONDITION_TYPES.ORDER_CHECK;
    const Icon = condition.icon;

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
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-purple-50/30 dark:bg-purple-500/5 p-4 rounded-2xl border border-purple-100/50 dark:border-purple-500/10 text-right rtl leading-relaxed">
                {data.conditionType === 'ORDER_CHECK' && (
                    <div className="flex flex-col gap-2">
                        <span className="opacity-60 font-bold">الشرط:</span>
                        <div className="flex items-center gap-2 font-black text-purple-700 dark:text-purple-400">
                            <span>{data.config?.field || '—'}</span>
                            <span className="text-slate-400 font-medium">{data.config?.operator || '=='}</span>
                            <span>{data.config?.targetValue || '—'}</span>
                        </div>
                    </div>
                )}
                {data.conditionType === 'QUICK_ORDER_STATUS' && (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-purple-700/60 dark:text-purple-400/60">هل الحالة تساوي:</span>
                        <span className="font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider">{data.config?.status || '—'}</span>
                    </div>
                )}
            </div>

            {/* Dynamic Branching Outputs (True / False) */}
            <div className="absolute top-full left-1/4 -translate-x-1/2 flex flex-col items-center">
                <CustomHandle
                    type="source"
                    position={Position.Bottom}
                    id="true"
                    noOffset
                    className="!static !translate-y-0"
                />
                <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 shadow-sm mt-2">
                    <Check size={10} strokeWidth={3} className="text-emerald-600" />
                    <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">نعم</span>
                </div>
            </div>
            <div className="absolute top-full left-3/4 -translate-x-1/2 flex flex-col items-center">
                <CustomHandle
                    type="source"
                    position={Position.Bottom}
                    id="false"
                    noOffset
                    className="!static !translate-y-0"
                />
                <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30 shadow-sm mt-2">
                    <X size={10} strokeWidth={3} className="text-rose-600" />
                    <span className="text-[9px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-tighter">لا</span>
                </div>
            </div>
        </BaseNode>
    );
}