import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout,
  ChevronRight,
  ChevronLeft,
  Zap,
  Activity,
  Clock,
  Box,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Play,
  ExternalLink,
  X
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/utils/cn';

const formatDuration = (start, end, t) => {
  if (!end) return "-";

  const diffMs = new Date(end).getTime() - new Date(start).getTime();

  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(t('daysCount', { count: days }));
  if (hours) parts.push(t('hoursCount', { count: hours }));
  if (minutes) parts.push(t('minutesCount', { count: minutes }));
  if (seconds || parts.length === 0) parts.push(t('secondsCount', { count: seconds || 0 }));

  return parts.join(t('and'));
};



export default function RunDetailsPanel({
  rightPanelCollapsed,
  setRightPanelCollapsed,
  selectedRun,
  onStopPreview
}) {
  const tRunPanel = useTranslations("whatsApp.automations.builder.runPanel");
  const tLogs = useTranslations("whatsApp.automationLogs");
  const tBuilder = useTranslations("whatsApp.automations.builder");
  const tOrderProps = useTranslations("whatsApp.automations.builder.orderProperties");
  const router = useRouter();

  const currentNodeLabel = useMemo(() => {
    if (!selectedRun) return "—";
    const node = selectedRun?.version?.flow?.nodes?.find(n => n.id === selectedRun?.currentNodeId);
    if (!node) return selectedRun?.currentNodeId || "—";
    
    // Use translated label if available
    if (node.type === 'trigger') return tBuilder(`triggerTypes.${node.data.type}`);
    if (node.type === 'action') return tBuilder(`actionTypes.${node.data.type}`);
    if (node.type === 'condition') return tBuilder(`conditionTypes.${node.data.type}`);
    
    return node.data?.label || node.id || "—";
  }, [selectedRun, tBuilder]);

  return (
    <div className="contents">
      <AnimatePresence>
        {!rightPanelCollapsed && selectedRun && (
          <motion.div
            key="run-details-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRightPanelCollapsed(true)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "flex flex-col h-full bg-white dark:bg-slate-900 border-r dark:border-slate-800 overflow-hidden",
          "transition-all duration-300 ease-out z-[56]",
          "fixed inset-y-0 start-0 lg:relative",
          "w-[280px] sm:w-[340px]",
          rightPanelCollapsed || !selectedRun
            ? "ltr:-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:opacity-0"
            : "translate-x-0 lg:translate-x-0 opacity-100 shadow-2xl lg:shadow-none"
        )}
      >
        <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <Layout size={18} className="text-slate-500" />
            </div>
            <h2 className="text-[13px] font-black">{tRunPanel('title')}</h2>
          </div>
          <div className="flex items-center gap-2">
            {onStopPreview && (
              <button
                onClick={onStopPreview}
                className="text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-xl p-2 border border-rose-100 dark:border-rose-500/20 transition-all active:scale-95"
                title={tRunPanel('stopPreview')}
              >
                <X size={18} />
              </button>
            )}
            <button
              onClick={() => setRightPanelCollapsed(true)}
              className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-800 transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tRunPanel('status')}</span>
              <StatusRunBadge status={selectedRun?.status} t={tLogs} />
            </div>

            <InfoSection title={tRunPanel('flowAndVersion')} icon={<Zap size={14} />}>
              <InfoItem label={tBuilder('sidebar.title')} value={selectedRun?.automationFlow?.name} />
              <InfoItem label={tRunPanel('version')} value={`v${selectedRun?.version?.versionString || selectedRun?.versionString}`} />
              <InfoItem label={tBuilder('sidebar.triggers')} value={selectedRun?.automationFlow?.triggerType ? tBuilder(`triggerTypes.${selectedRun?.automationFlow.triggerType}`) : (selectedRun?.executionState?.trigger?.type ? tBuilder(`triggerTypes.${selectedRun?.executionState.trigger.type}`) : "—")} />
            </InfoSection>

            <InfoSection title={tRunPanel('executionStatus')} icon={<Activity size={14} />}>
              <InfoItem
                label={tRunPanel('currentNode')}
                value={currentNodeLabel}
              />
              <InfoItem
                label={tRunPanel('completedSteps')}
                value={tRunPanel('stepsCount', { count: selectedRun?.completedNodeIds?.length || 0 })}
              />
            </InfoSection>

            <InfoSection title={tRunPanel('timing')} icon={<Clock size={14} />}>
              <InfoItem label={tRunPanel('startTime')} value={new Date(selectedRun?.startedAt).toLocaleString()} />
              {selectedRun?.completedAt && (
                <InfoItem label={tRunPanel('endTime')} value={new Date(selectedRun?.completedAt).toLocaleString()} />
              )}
              <InfoItem label={tRunPanel('duration')} value={selectedRun?.completedAt ? `${formatDuration(selectedRun?.startedAt, selectedRun?.completedAt, tRunPanel)}` : tRunPanel('running')} />
            </InfoSection>

            <InfoSection title={tRunPanel('additionalInfo')} icon={<Box size={14} />}>
              <InfoItem label={tRunPanel('triggerEntity')} value={selectedRun?.triggerEntityType ? tRunPanel(`entities.${selectedRun?.triggerEntityType}`) : "—"} />
              {selectedRun?.triggerEntityId && <InfoItem
                label={tOrderProps('orderNumber')}
                value={`#${selectedRun?.triggerEntityId}`}
                onClick={selectedRun?.triggerEntityType === 'order' ? () => {
                  router.push(`/orders/details/${selectedRun?.triggerEntityId}`)
                } : null}
              />}
            </InfoSection>

            {selectedRun?.status === 'failed' && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20">
                <div className="flex items-center gap-2 text-rose-600 mb-2">
                  <XCircle size={14} />
                  <span className="text-[11px] font-black">{tRunPanel('failureDetails')}</span>
                </div>
                <p className="text-[10px] font-bold text-rose-500 leading-relaxed">{selectedRun?.errorMessage}</p>
              </div>
            )}
          </div>
      </aside>
    </div>
  );
}

function InfoSection({ title, icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function InfoItem({ label, value, onClick, icon: Icon }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
      {onClick ? (
        <button
          onClick={onClick}
          className="cursor-pointer"
        >
          <ExternalLink
            className="flex items-center gap-1.5 text-[11px] font-black text-primary hover:underline group cursor-pointer"
          >
            {value || "—"}
            {/* {Icon && <Icon size={10} className="group-hover:translate-x-0.5 transition-transform" />} */}
          </ExternalLink>
        </button>
      ) : (
        <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">{value || "—"}</span>
      )}
    </div>
  );
}

export function StatusRunBadge({ status, t }) {
  const config = {
    pending: { color: "bg-slate-100 text-slate-600", icon: Clock },
    running: { color: "bg-blue-100 text-blue-600 animate-pulse", icon: Play },
    completed: { color: "bg-emerald-100 text-emerald-600", icon: CheckCircle2 },
    failed: { color: "bg-rose-100 text-rose-600", icon: XCircle },
    paused: { color: "bg-amber-100 text-amber-600", icon: AlertCircle },
  };

  const { color, icon: Icon } = config[status] || config.pending;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", color)}>
      <Icon size={10} />
      {t(`statuses.${status}`)}
    </div>
  );
}