import { Position } from '@xyflow/react';
import { Play, ShoppingCart, RefreshCw, MessageSquare } from 'lucide-react';
import { BaseNode } from './BaseNode';

const TRIGGER_TYPES = {
    'ORDER_CREATED': { label: 'إنشاء طلب جديد', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'ORDER_STATUS_UPDATED': { label: 'تحديث حالة الطلب', icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'WHATSAPP_INCOMING': { label: 'رسالة واردة جديدة', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
};

export function TriggerNode({ id, data, selected }) {
    const trigger = TRIGGER_TYPES[data.triggerType] || { label: 'محفز غير معروف', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    const Icon = trigger.icon;

    return (
        <BaseNode
            id={id}
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
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-emerald-50/30 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10 text-right rtl leading-relaxed">
                {data.triggerType === 'ORDER_CREATED' && (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-emerald-700/60 dark:text-emerald-400/60">المتجر المستهدف:</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400">{data.config?.store === 'all' ? 'جميع المتاجر' : data.config?.store || '—'}</span>
                    </div>
                )}
                {data.triggerType === 'ORDER_STATUS_UPDATED' && (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-emerald-700/60 dark:text-emerald-400/60">عند التغيير إلى:</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{data.config?.status || '—'}</span>
                    </div>
                )}
                {data.triggerType === 'WHATSAPP_INCOMING' && (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-emerald-700/60 dark:text-emerald-400/60">رقم الواتساب:</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400">{data.config?.accountId || '—'}</span>
                    </div>
                )}
            </div>
        </BaseNode>
    );
}