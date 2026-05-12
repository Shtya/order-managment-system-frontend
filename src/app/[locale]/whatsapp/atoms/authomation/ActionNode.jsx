import { Position } from '@xyflow/react';
import { MessageSquare, RefreshCw, Zap, Bell, Send } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { CustomHandle } from './CustomHandle';

const ACTION_TYPES = {
    'SEND_WHATSAPP_TEMPLATE': { label: 'إرسال قالب واتساب', subtitle: 'المراسلة', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    'UPDATE_ORDER_STATUS': { label: 'تحديث حالة الطلب', subtitle: 'إدارة الطلبات', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
};

export function ActionNode({ id, data, selected }) {
    const action = ACTION_TYPES[data.actionType] || ACTION_TYPES.SEND_WHATSAPP_TEMPLATE;
    const Icon = action.icon;
    const hasBranches = data.config?.branches?.length > 0;

    return (
        <BaseNode
            id={id}
            selected={selected}
            title={action.label}
            subtitle={action.subtitle}
            icon={Icon}
            colorClass={action.color}
            bgClass={action.bg}
            hasOutput={!hasBranches} // If it has branches, we use custom handles below
            onEdit={() => window.dispatchEvent(new CustomEvent('edit-automation-step', { detail: { id, data } }))}
            className="border-t-[6px] border-t-blue-500"
        >
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-blue-50/30 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-500/10 text-right rtl leading-relaxed">
                {data.actionType === 'SEND_WHATSAPP_TEMPLATE' && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-black">
                            <Send size={12} />
                            <span>{data.config?.templateName || 'لم يتم اختيار قالب'}</span>
                        </div>
                        {data.config?.recipientNumber && (
                            <div className="flex flex-col gap-0.5 mt-1">
                                <span className="opacity-60 font-bold">المستلم:</span>
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{data.config.recipientNumber}</span>
                            </div>
                        )}
                    </div>
                )}
                {data.actionType === 'UPDATE_ORDER_STATUS' && (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-blue-700/60 dark:text-blue-400/60">تغيير الحالة إلى:</span>
                        <span className="font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">{data.config?.newStatus || '—'}</span>
                    </div>
                )}
            </div>

            {/* Dynamic Branching for WhatsApp Template Buttons */}
            {hasBranches && (
                <>
                    {data.config.branches.map((branch, i) => {
                        const leftPos = ((i + 1) * 100) / (data.config.branches.length + 1);
                        return (
                            <div
                                key={branch.id}
                                className="absolute top-full flex flex-col items-center"
                                style={{ left: `${leftPos}%`, transform: 'translateX(-50%)' }}
                            >
                                <CustomHandle
                                    type="source"
                                    position={Position.Bottom}
                                    id={branch.id}
                                    noOffset
                                    className="!static !translate-y-0"
                                />
                                <span className="text-[8px] font-black text-slate-400 tracking-tighter bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm whitespace-nowrap mt-2">
                                    {branch.label}
                                </span>
                            </div>
                        );
                    })}
                </>
            )}
        </BaseNode>
    );
}