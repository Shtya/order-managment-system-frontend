import { Position } from '@xyflow/react';
import { Play, ShoppingCart, RefreshCw, MessageSquare } from 'lucide-react';
import { BaseNode } from './BaseNode';

const TRIGGER_TYPES = {
    'ORDER_CREATED': { label: 'إنشاء طلب جديد', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'ORDER_STATUS_UPDATED': { label: 'تحديث حالة الطلب', icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'WHATSAPP_INCOMING': { label: 'رسالة واردة جديدة', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
};

export function TriggerNode({ id, data, selected }) {
    const trigger = TRIGGER_TYPES[data.type] || { label: 'محفز غير معروف', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50' };
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
            <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/20 dark:bg-emerald-500/5 p-3 rounded-xl border border-emerald-100/30 dark:border-emerald-500/10 text-right rtl">
                {data.type === 'ORDER_CREATED' && (
                    <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-700 dark:text-emerald-400">{data.config?.store === 'all' ? 'جميع المتاجر' : data.config?.store || '—'}</span>
                        <span className="opacity-50 font-bold">المتجر</span>
                    </div>
                )}
                {data.type === 'ORDER_STATUS_UPDATED' && (
                    <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{data.config?.status || '—'}</span>
                        <span className="opacity-50 font-bold">عند تغيير</span>
                    </div>
                )}
                {data.type === 'WHATSAPP_INCOMING' && (
                    <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">{data.config?.accountId || '—'}</span>
                        <span className="opacity-50 font-bold">الرقم</span>
                    </div>
                )}
            </div>
        </BaseNode>
    );
}