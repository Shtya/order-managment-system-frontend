import { Position } from '@xyflow/react';
import { MessageSquare, RefreshCw, Zap, Bell, Send } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { CustomHandle } from './CustomHandle';
import { useFlowStore } from '@/hook/useFlowStore';

const ACTION_TYPES = {
    'SEND_WHATSAPP_TEMPLATE': { label: 'إرسال قالب واتساب', subtitle: 'المراسلة', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    'UPDATE_ORDER_STATUS': { label: 'تحديث حالة الطلب', subtitle: 'إدارة الطلبات', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
};

export function ActionNode({ id, data, selected }) {
    const action = ACTION_TYPES[data.type] || ACTION_TYPES.SEND_WHATSAPP_TEMPLATE;
    const Icon = action.icon;
    const hasBranches = data.config?.branches?.length > 0;
    const edges = useFlowStore((s) => s.edges);

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
            <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-blue-50/20 dark:bg-blue-500/5 p-3 rounded-xl border border-blue-100/30 dark:border-blue-500/10 text-right rtl">
                {data.type === 'SEND_WHATSAPP_TEMPLATE' && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold">
                            <Send size={10} />
                            <span className="truncate">{data.config?.templateName || 'لم يتم اختيار قالب'}</span>
                        </div>
                        {data.config?.recipientNumber && (
                            <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{data.config.recipientNumber}</span>
                                <span className="opacity-50 text-[9px]">المستلم</span>
                            </div>
                        )}
                    </div>
                )}
                {data.type === 'UPDATE_ORDER_STATUS' && (
                    <div className="flex items-center justify-between">
                        <span className="font-black text-blue-700 dark:text-blue-400 uppercase tracking-tight">{data.config?.newStatus || '—'}</span>
                        <span className="opacity-50 font-bold">تغيير الحالة</span>
                    </div>
                )}
            </div>

            {/* Dynamic Branching for WhatsApp Template Buttons */}
            {hasBranches && (
                <>
                    {data.config.branches.map((branch, i) => {
                        const leftPos = ((i + 1) * 100) / (data.config.branches.length + 1);
                        const isConnected = edges.some(e => e.source === id && e.sourceHandle === branch.id);
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
                                    nodeId={id}
                                    isConnected={isConnected}
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