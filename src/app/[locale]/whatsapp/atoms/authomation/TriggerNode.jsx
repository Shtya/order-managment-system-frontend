import React from 'react';
import { Position } from '@xyflow/react';
import { Play, ShoppingCart, RefreshCw, Loader2 } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { useFlowStore } from '@/hook/useFlowStore';

const TRIGGER_TYPES = {
    'order_created': { label: 'إنشاء طلب جديد', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'order_updated': { label: 'تحديث حالة الطلب', icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
};

export function TriggerNode({ id, data, selected }) {

    const trigger = TRIGGER_TYPES[data.type] || { label: 'محفز غير معروف', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    const Icon = trigger.icon;
    const loading = useFlowStore((s) => s.nodeLoading[id]);

    return (
        <BaseNode
            id={id}
            data={data}
            selected={selected}
            title={trigger.label}
            subtitle="نقطة البداية"
            icon={Icon}
            colorClass={trigger.color}
            bgClass={trigger.bg}
            hasInput={false}
            isValid={true}
            onEdit={() => window.dispatchEvent(new CustomEvent('edit-automation-step', { detail: { id, data } }))}
            className="border-t-[6px] border-t-emerald-500"
        >
            <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/20 dark:bg-emerald-500/5 p-3 rounded-xl border border-emerald-100/30 dark:border-emerald-500/10 text-right rtl min-h-[50px] flex flex-col justify-center">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                        <Loader2 size={12} className="animate-spin text-emerald-500" />
                        <span className="font-bold opacity-50">جاري التحقق...</span>
                    </div>
                ) : (
                    <>
                        {data.type === 'order_created' && (
                            <div className="flex items-center justify-between">
                                <span className="font-black text-emerald-700 dark:text-emerald-400">{data.config?.store === 'all' ? 'جميع المتاجر' : data.config?.store || '—'}</span>
                                <span className="opacity-50 font-bold">المتجر</span>
                            </div>
                        )}
                        {data.type === 'order_updated' && (
                            <div className="flex items-center justify-between">
                                <span className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{data.config?.status || '—'}</span>
                                <span className="opacity-50 font-bold">عند تغيير الحالة إلي</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </BaseNode>
    );
}