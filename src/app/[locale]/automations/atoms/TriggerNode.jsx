import React, { useMemo } from 'react';
import { Position } from '@xyflow/react';
import { Play, ShoppingCart, RefreshCw, Loader2, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BaseNode } from './BaseNode';
import { useFlowStore } from '@/hook/useFlowStore';

export function TriggerNode({ id, data, selected }) {
    const t = useTranslations("whatsApp.automations.builder");

    const TRIGGER_TYPES = useMemo(() => ({
        'order_created': { label: t('triggerTypes.order_created'), icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        'order_updated': { label: t('triggerTypes.order_updated'), icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        'shipment_created': { label: t('triggerTypes.shipment_created'), icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        'shipment_updated': { label: t('triggerTypes.shipment_updated'), icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    }), [t]);

    const trigger = TRIGGER_TYPES[data.type] || { label: t('nodes.trigger.unknown'), icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    const Icon = trigger.icon;
    const loading = useFlowStore((s) => s.nodeLoading[id]);

    return (
        <BaseNode
            id={id}
            data={data}
            selected={selected}
            title={trigger.label}
            subtitle={t('nodes.trigger.subtitle')}
            icon={Icon}
            colorClass={trigger.color}
            bgClass={trigger.bg}
            hasInput={false}
            isValid={true}
            onEdit={() => window.dispatchEvent(new CustomEvent('edit-automation-step', { detail: { id, data } }))}
            className="border-t-[6px] border-t-emerald-500"
        >
            <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/20 dark:bg-emerald-500/5 p-3 rounded-xl border border-emerald-100/30 dark:border-emerald-500/10  min-h-[50px] flex flex-col justify-center">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                        <Loader2 size={12} className="animate-spin text-emerald-500" />
                        <span className="font-bold opacity-50">{t('nodes.loading')}</span>
                    </div>
                ) : (
                    <>
                        {data.type === 'order_created' && (
                            <div className="flex items-center justify-between">
                                <span className="opacity-50 font-bold">{t('config.store')}</span>
                                <span className="font-black text-emerald-700 dark:text-emerald-400">{data.config?.store === 'all' ? t('config.allStores') : data.config?.store || '—'}</span>
                            </div>
                        )}
                        {data.type === 'order_updated' && (
                            <div className="flex items-center justify-between">
                                <span className="opacity-50 font-bold">{t('nodes.trigger.onStatusChange')}</span>
                                <span className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{data.config?.status || '—'}</span>
                            </div>
                        )}
                        {data.type === 'shipment_created' && (
                            <div className="flex items-center justify-between">
                                <span className="opacity-50 font-bold">{t('config.shippingCompany')}</span>
                                <span className="font-black text-emerald-700 dark:text-emerald-400">{data.config?.shippingCompany === 'all' ? t('config.allShippingCompanies') : data.config?.shippingCompany || '—'}</span>
                            </div>
                        )}
                        {data.type === 'shipment_updated' && (
                            <div className="flex items-center justify-between">
                                <span className="opacity-50 font-bold">{t('nodes.trigger.onStatusChange')}</span>
                                <span className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{data.config?.shipmentStatus || '—'}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </BaseNode>
    );
}