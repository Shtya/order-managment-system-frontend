import React, { useEffect, useMemo } from 'react';
import { Position, useUpdateNodeInternals } from '@xyflow/react';
import { MessageSquare, RefreshCw, Send, Loader2, Zap, Users, MessageCircle, Hourglass, AlertTriangle, Bot, Truck, UserPlus } from 'lucide-react';
import { useLocale, useTranslations } from "next-intl";
import { BaseNode } from './BaseNode';
import { CustomHandle } from './CustomHandle';
import { useFlowStore } from '@/hook/useFlowStore';
import { cn } from '@/utils/cn';
import { AUTOMATION_CONFIG } from './automation-config';
import { businessMessageDefinitions } from './businessMessages';

export function ActionNode({ id, data, selected }) {
    const tChats = useTranslations("chats");
    const tIssues = useTranslations("issues");
    const t = useTranslations("whatsApp.automations.builder");
    const locale = useLocale();
    const ACTION_TYPES = useMemo(() => ({
        'send_whatsapp_template': { label: t('actionTypes.send_whatsapp_template'), subtitle: t('nodes.action.subtitle'), icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        "send_whatsapp_message": { label: t('actionTypes.send_whatsapp_message'), subtitle: t('nodes.action.subtitle'), icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10', },
        'update_order_status': { label: t('actionTypes.update_order_status'), subtitle: t('nodes.action.management'), icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        'ai_address_correction': { label: t('actionTypes.ai_address_correction'), subtitle: t('nodes.action.management'), icon: Bot, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
        'assign_shipping_provider': { label: t('actionTypes.assign_shipping_provider'), subtitle: t('nodes.action.management'), icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10' },
        'send_upsell': { label: t('actionTypes.send_upsell'), subtitle: t('nodes.action.upsell'), icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        'assign_order_to_employee': { label: t('actionTypes.assign_order_to_employee'), subtitle: t('nodes.action.management'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        'assign_order_to_client': { label: t('actionTypes.assign_order_to_client'), subtitle: t('nodes.action.management'), icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        'send_sms': { label: t('actionTypes.send_sms'), subtitle: t('nodes.action.subtitle'), icon: Send, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10', },
        'wait': { label: t('actionTypes.wait'), subtitle: t('nodes.action.management'), icon: Hourglass, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        'create_issue': { label: t('actionTypes.create_issue'), subtitle: t('nodes.action.management'), icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    }), [t]);

    const updateNodeInternals = useUpdateNodeInternals();
    const action = ACTION_TYPES[data.type] || ACTION_TYPES['send_whatsapp_template'];
    const Icon = action.icon;
    const hasBranches = data.config?.branches?.length > 0;
    const edges = useFlowStore((s) => s.edges);
    const loading = useFlowStore((s) => s.nodeLoading[id]);

    const config = useMemo(() => {
        for (const category of AUTOMATION_CONFIG.ACTIONS.categories) {
            const item = category.items.find(i => i.id === data.type);
            if (item) return item;
        }
        return null;
    }, [data.type]);

    const noEdit = config?.noEdit || false;
    
    // Force React Flow to recalculate handle positions and edge paths when branches change
    useEffect(() => {
        updateNodeInternals(id);
    }, [id, data.config?.branches?.length, updateNodeInternals]);
    

    return (
        <BaseNode
            id={id}
            data={data}
            selected={selected}
            title={action.label}
            subtitle={action.subtitle}
            icon={Icon}
            colorClass={action.color}
            bgClass={action.bg}
            hasOutput={!hasBranches} // If it has branches, we use custom handles below
            noEdit={noEdit}
            onEdit={() => window.dispatchEvent(new CustomEvent('edit-automation-step', { detail: { id, data } }))}
            className="border-t-[6px] border-t-blue-500"
        >
            <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-blue-50/20 dark:bg-blue-500/5 p-3 rounded-xl border border-blue-100/30 dark:border-blue-500/10 min-h-[50px] flex flex-col justify-center">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                        <Loader2 size={12} className="animate-spin text-blue-500" />
                        <span className="font-bold opacity-50">{t('nodes.loading')}</span>
                    </div>
                ) : (
                    <>
                        {data.type === 'send_whatsapp_template' && (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold">
                                    <Send size={10} />
                                    <span className="truncate">{data.config?.templateName || t('nodes.noTemplate')}</span>
                                </div>
                                {data.config?.recipientNumber && (
                                    <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                        <span className="opacity-50 text-[9px]">{t('nodes.recipient')}</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{data.config.recipientNumber}</span>
                                    </div>
                                )}
                                {(() => {
                                    const noResponse = (data.config?.branches || []).find(b => b.isNoResponse);
                                    if (!noResponse) return null;
                                    return (
                                        <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                            <span className="opacity-50 text-[9px]">{t('nodes.noResponseAfter')}</span>
                                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{noResponse.timeoutMinutes} {t('nodes.minutes')}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {data.type === 'update_order_status' && (
                            <div className="flex items-center justify-between">
                                <span className="opacity-50 font-bold">{t('nodes.changeStatusTo')}</span>
                                <span className="font-black text-blue-700 dark:text-blue-400 uppercase tracking-tight">{data.config?.newStatus || '—'}</span>
                            </div>
                        )}
                        {data.type === 'ai_address_correction' && (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="opacity-50 font-bold">{t('nodes.provider')}</span>
                                    <span className="font-black text-violet-700 dark:text-violet-400 truncate">{data.config?.providerName || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                    <span className="opacity-50 text-[9px]">{t('nodes.aiModel')}</span>
                                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400 truncate">{data.config?.modelName || data.config?.modelCode || '—'}</span>
                                </div>
                                {data.config?.shippingCompany && (
                                    <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                        <span className="opacity-50 text-[9px]">{t('nodes.shippingCompany')}</span>
                                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400 truncate">{data.config.shippingCompany}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {data.type === 'assign_shipping_provider' && (
                            <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                        <span className="opacity-50 text-[9px]">{t('nodes.provider')}</span>
                                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400 truncate">{data.config?.shippingCompany || '—'}</span>
                                    </div>
                            </div>
                        )}
                        {data.type === 'send_upsell' && (
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="opacity-50 font-bold">{t('nodes.sendOffers')}</span>
                                    <span className="font-black text-blue-700 dark:text-blue-400 uppercase tracking-tight">{t('nodes.proposedForOrder')}</span>
                                </div>
                                {(() => {
                                    const noResponse = (data.config?.branches || []).find(b => b.isNoResponse);
                                    if (!noResponse) return null;
                                    return (
                                        <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                            <span className="opacity-50 text-[9px]">{t('nodes.noResponseAfter')}</span>
                                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{noResponse.timeoutMinutes} {t('nodes.minutes')}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {data.type === 'assign_order_to_employee' && (
                            <div className="flex items-center justify-between">
                                <span className="opacity-50 font-bold">{t('nodes.assignTo')}</span>
                                <span className="font-black text-blue-700 dark:text-blue-400 truncate">
                                    {data.config?.employeeName || t('nodes.autoAssign')}
                                </span>
                            </div>
                        )}
                        {data.type === 'assign_order_to_client' && (
                            <div className="flex flex-col gap-1.5">
                                <div className="text-[10px] leading-relaxed font-medium text-emerald-700 dark:text-emerald-400">
                                    {t('nodes.linkOrderToClientByPhone')}
                                </div>
                                <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                    <span className="opacity-50 text-[9px]">{t('nodes.createClientIfMissing')}</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                                        {data.config?.createIfMissing ? t('nodes.yes') : t('nodes.no')}
                                    </span>
                                </div>
                            </div>
                        )}
                        {data.type === 'send_whatsapp_message' && (
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="opacity-50 font-bold">{t('nodes.messageType')}</span>
                                    <span className="font-black text-blue-700 dark:text-blue-400 truncate">
                                        {data.config?.messageMode === 'business'
                                            ? (businessMessageDefinitions[data.config?.businessUseCase]
                                                ? tChats(businessMessageDefinitions[data.config.businessUseCase].labelKey)
                                                : '—')
                                            : (data.config?.messageType ? tChats("messageTypes." + data.config?.messageType) : '—')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="opacity-50 font-bold">{t('nodes.account')}</span>
                                    <span className="font-black text-blue-700 dark:text-blue-400 truncate">
                                        {data.config?.accountName ?? '—'}
                                    </span>
                                </div>
                                {data.config?.recipientNumber && (
                                    <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                        <span className="opacity-50 text-[9px]">{t('nodes.recipient')}</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{data.config.recipientNumber}</span>
                                    </div>
                                )}
                                {(() => {
                                    const noResponse = (data.config?.branches || []).find(b => b.isNoResponse);
                                    if (!noResponse) return null;
                                    return (
                                        <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                            <span className="opacity-50 text-[9px]">{t('nodes.noResponseAfter')}</span>
                                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{noResponse.timeoutMinutes} {t('nodes.minutes')}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {data.type === 'send_sms' && (
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="opacity-50 font-bold">{t('nodes.provider', { fallback: 'Provider' })}</span>
                                    <span className="font-black text-blue-700 dark:text-blue-400 truncate">
                                        {data.config?.providerName || data.config?.providerCode || data.config?.integrationId || '—'}
                                    </span>
                                </div>
                                {data.config?.toNumber && (
                                    <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                        <span className="opacity-50 text-[9px]">{t('nodes.recipient')}</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{data.config.toNumber}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {data.type === 'wait' && (
                            <div className="flex items-center justify-between">
                                <span className="opacity-50 font-bold">{t('nodes.waitFor')}</span>
                                <span className="font-black text-blue-700 dark:text-blue-400">{data.config?.waitMinutes} {t('nodes.minutes')}</span>
                            </div>
                        )}
                        {data.type === 'create_issue' && (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
                                    <AlertTriangle size={10} />
                                    <span className="truncate">{locale ? data?.config?.cause?.nameAr: data?.config?.cause?.nameEn}</span>
                                </div>
                                {data.config?.priority && (
                                    <div className="flex items-center justify-between border-t border-blue-100/30 pt-1.5 mt-0.5">
                                        <span className="opacity-50 text-[9px]">{t('nodes.priority')}</span>
                                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">{tIssues(`priority.${data.config.priority}`)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>

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
                                <span className={cn(
                                    "text-[8px] font-black tracking-tighter px-1.5 py-0.5 rounded-full border shadow-sm whitespace-nowrap mt-2",
                                    branch.isNoResponse
                                        ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30"
                                        : "text-slate-400 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                                )}>
                                    {branch.isNoResponse && <Hourglass size={7} className="inline-block mr-1" />}
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
