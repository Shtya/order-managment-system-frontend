import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout,
  ChevronRight,
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

const formatDuration = (start, end) => {
  if (!end) return "-";

  const diffMs = new Date(end).getTime() - new Date(start).getTime();

  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (days) parts.push(`${days} يوم`);
  if (hours) parts.push(`${hours} ساعة`);
  if (minutes) parts.push(`${minutes} دقيقة`);
  if (seconds || parts.length === 0) parts.push(`${seconds || 0} ثانية`);

  return parts.join(" و ");
};



export default function RunDetailsPanel({
  rightPanelCollapsed,
  setRightPanelCollapsed,
  selectedRun,
  onStopPreview
}) {

  const currentNodeLabel = useMemo(() => {
    if (!selectedRun) return "—";
    const node = selectedRun.version?.flow?.nodes?.find(n => n.id === selectedRun.currentNodeId);
    return node?.data?.label || selectedRun.currentNodeId || "—";
  }, [selectedRun]);

  const t = useTranslations("whatsApp.automationLogs");
  const tAutomations = useTranslations("whatsApp.automations");
  const router = useRouter();

  return (
    <AnimatePresence>
      {!rightPanelCollapsed && selectedRun && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col relative z-10 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Layout size={18} className="text-slate-500" />
              </div>
              <h2 className="text-[13px] font-black">معلومات التشغيل</h2>
            </div>
            <div className="flex items-center gap-2">
              {onStopPreview && (
                <button
                  onClick={onStopPreview}
                  className="text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-xl p-2 border border-rose-100 dark:border-rose-500/20 transition-all active:scale-95"
                  title="إيقاف المعاينة"
                >
                  <X size={18} />
                </button>
              )}
              <button
                onClick={() => setRightPanelCollapsed(true)}
                className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-800 transition-all active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة التشغيل</span>
              <StatusRunBadge status={selectedRun.status} t={t} />
            </div>

            <InfoSection title="المسار والنسخة" icon={<Zap size={14} />}>
              <InfoItem label="المسار" value={selectedRun.automationFlow?.name} />
              <InfoItem label="النسخة" value={`v${selectedRun.version?.versionString || selectedRun.versionString}`} />
              <InfoItem label="المحفز" value={tAutomations(`triggers.${selectedRun.automationFlow?.triggerType || selectedRun?.executionState?.trigger?.type}`)} />
            </InfoSection>

            <InfoSection title="حالة التنفيذ" icon={<Activity size={14} />}>
              <InfoItem
                label="الخطوة الحالية"
                value={currentNodeLabel}
              />
              <InfoItem
                label="الخطوات المكتملة"
                value={`${selectedRun.completedNodeIds?.length || 0} خطوة`}
              />
            </InfoSection>

            <InfoSection title="التوقيت" icon={<Clock size={14} />}>
              <InfoItem label="وقت البدء" value={new Date(selectedRun.startedAt).toLocaleString()} />
              {selectedRun.completedAt && (
                <InfoItem label="وقت الانتهاء" value={new Date(selectedRun.completedAt).toLocaleString()} />
              )}
              <InfoItem label="المدة الكلية" value={selectedRun.completedAt ? `${formatDuration(selectedRun.startedAt, new Date())}` : "جاري..."} />
            </InfoSection>

            <InfoSection title="معلومات إضافية" icon={<Box size={14} />}>
              <InfoItem label="الكيان المخفز" value={selectedRun.triggerEntityType} />
              {selectedRun.triggerEntityId && <InfoItem
                label="الطلب"
                value={`#${selectedRun.triggerEntityId}`}
                onClick={selectedRun.triggerEntityType === 'order' ? () => {
                  router.push(`/orders/details/${selectedRun.triggerEntityId}`)
                } : null}
              />}
            </InfoSection>

            {selectedRun.status === 'failed' && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20">
                <div className="flex items-center gap-2 text-rose-600 mb-2">
                  <XCircle size={14} />
                  <span className="text-[11px] font-black">تفاصيل الفشل</span>
                </div>
                <p className="text-[10px] font-bold text-rose-500 leading-relaxed">{selectedRun.errorMessage}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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