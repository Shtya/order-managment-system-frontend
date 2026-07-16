"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  Calendar,
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  MessageSquare,
  AlertCircle,
  DollarSign,
  Info,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Globe,
  Bell,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  XCircle,
  MinusCircle,
  Users,
  Check,
  Ban,
} from "lucide-react";

import {
  ExportBtn,
  MiniTable,
  TrendChart,
  StatusDonut,
  PctBar,
  Card,
} from "../reports/order-analysis/page";
import Button_ from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { TableFilters } from "../reports/order-analysis/page";
import PageHeader from "@/components/atoms/Pageheader";
import StoreFilter from "@/components/atoms/StoreFilter";
import { Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {TutorialSpotlight} from "@/components/atoms/TutorialSpotlight";
import WhatsAppAccountSelect from "./atoms/WhatsAppAccountSelect";
import { useTrendLabelFormatter } from "@/hook/useTrendLabelFormatter";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";

// ── Custom Filter Field Wrapper ──────────────────────────────────────────────
function FilterField({ label, icon: FieldIcon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {FieldIcon && <FieldIcon size={10} className="text-primary" />}
        {label}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function WhatsAppStatisticsPage() {
  const tTutorial = useTranslations("tutorial.whatsapp");
  const torderAnalysis = useTranslations("orderAnalysis");
  const t = useTranslations("whatsApp");
  const locale = useLocale();
  const { formatTrendLabel } = useTrendLabelFormatter();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quickRange, setQuickRange] = useState("this_month");
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    accountId: "all",
  });

  // Data States
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topTemplates, setTopTemplates] = useState([]);
  const [topAutomations, setTopAutomations] = useState([]);
  const [topButtons, setTopButtons] = useState([]);
  const [heatmap, setHeatmap] = useState([]);

  const buildParams = useCallback(() => {
    const p = {};
    if (quickRange && quickRange !== "custom") p.range = quickRange;
    if (filters.startDate) p.startDate = filters.startDate;
    if (filters.endDate) p.endDate = filters.endDate;
    if (filters.accountId && filters.accountId !== "all") p.accountId = filters.accountId;
    return p;
  }, [quickRange, filters]);

  const fetchData = useCallback(async () => {
    const p = buildParams();
    setLoading(true);
    try {
      const [
        statsRes,
        trendsRes,
        categoriesRes,
        templatesRes,
        automationsRes,
        buttonsRes,
        heatmapRes
      ] = await Promise.all([
        api.get("/whatsapp/dashboard/stats", { params: p }).catch(() => ({ data: null })),
        api.get("/whatsapp/dashboard/trends", { params: p }).catch(() => ({ data: [] })),
        api.get("/whatsapp/dashboard/messages-by-type", { params: p }).catch(() => ({ data: [] })),
        api.get("/whatsapp/dashboard/top-templates", { params: { ...p, limit: 5 } }).catch(() => ({ data: [] })),
        api.get("/whatsapp/dashboard/top-automations", { params: { ...p, limit: 5 } }).catch(() => ({ data: [] })),
        api.get("/whatsapp/dashboard/top-clicked-buttons", { params: { ...p, limit: 5 } }).catch(() => ({ data: [] })),
        api.get("/whatsapp/dashboard/activity-heatmap", { params: p }).catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);

      const formattedTrends = (Array.isArray(trendsRes.data) ? trendsRes.data : []).map((item) => ({
        ...item,
        label: formatTrendLabel(item.date),
      }));
      setTrends(formattedTrends);

      setCategories((Array.isArray(categoriesRes.data) ? categoriesRes.data : []).map(c => ({
        name: c.type,
        count: parseInt(c.count, 10),
        color: c.type === 'TEMPLATE' ? '#10b981' : c.type === 'TEXT' ? '#3b82f6' : '#f59e0b'
      })));
      setTopTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
      setTopAutomations(Array.isArray(automationsRes.data) ? automationsRes.data : []);
      setTopButtons(Array.isArray(buttonsRes.data) ? buttonsRes.data : []);
      setHeatmap(Array.isArray(heatmapRes.data) ? heatmapRes.data : []);

    } catch (err) {
      console.error("Failed to fetch whatsapp dashboard data:", err);
      toast.error(t("overview.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [quickRange, filters.accountId]);

  // Mock charts config
  const chartConfigs = [
    { key: "sent", label: t("overview.stats.names.sent"), color: "#10b981", fillOpacity: 0.1, tension: 0.44, },
    { key: "delivered", label: t("overview.stats.names.delivered"), color: "#34d399", fillOpacity: 0.1, tension: 0.44, },
    { key: "read", label: t("overview.stats.names.read"), color: "#60a5fa", fillOpacity: 0.1, tension: 0.44, },
    { key: "clicked", label: t("overview.stats.names.clicks"), color: "#c084fc", fillOpacity: 0.1, tension: 0.44, },
  ];

  const QUICK_RANGES = [
    { id: "today", label: torderAnalysis("ranges.today") },
    { id: "yesterday", label: torderAnalysis("ranges.yesterday") },
    { id: "this_week", label: torderAnalysis("ranges.this_week") },
    { id: "last_week", label: torderAnalysis("ranges.last_week") },
    { id: "this_month", label: torderAnalysis("ranges.this_month") },
    { id: "last_month", label: torderAnalysis("ranges.last_month") },
    { id: "this_year", label: torderAnalysis("ranges.this_year") },
  ];

  // Map backend stats to KPI cards
  const statsCards = [
    // --- Messages ---
    { id: "sent", name: t("overview.stats.prefixes.messages") + t("overview.stats.names.sent"), value: stats?.messages?.totalSent?.toLocaleString() || "0", icon: Send, color: "#10b981", description: tTutorial("overview.stats.messagesSent.description"), example: tTutorial("overview.stats.messagesSent.example") },
    { id: "delivered", name: t("overview.stats.prefixes.messages") + t("overview.stats.names.delivered"), value: stats?.messages?.delivered?.toLocaleString() || "0", icon: CheckCircle2, color: "#10b981", pct: stats?.messages?.totalSent > 0 ? ((stats.messages.delivered / stats.messages.totalSent) * 100).toFixed(1) + "%" : "0%", description: tTutorial("overview.stats.messagesDelivered.description"), example: tTutorial("overview.stats.messagesDelivered.example") },
    { id: "read", name: t("overview.stats.prefixes.messages") + t("overview.stats.names.read"), value: stats?.messages?.read?.toLocaleString() || "0", icon: Eye, color: "#3b82f6", pct: stats?.messages?.totalSent > 0 ? ((stats.messages.read / stats.messages.totalSent) * 100).toFixed(1) + "%" : "0%", description: tTutorial("overview.stats.messagesRead.description"), example: tTutorial("overview.stats.messagesRead.example") },
    { id: "clicks", name: t("overview.stats.prefixes.messages") + t("overview.stats.names.clicks"), value: stats?.messages?.buttonClicks?.toLocaleString() || "0", icon: MousePointerClick, color: "#a855f7", pct: stats?.messages?.totalSent > 0 ? ((stats.messages.buttonClicks / stats.messages.totalSent) * 100).toFixed(1) + "%" : "0%", description: tTutorial("overview.stats.buttonClicks.description"), example: tTutorial("overview.stats.buttonClicks.example") },
    { id: "failed", name: t("overview.stats.prefixes.messages") + t("overview.stats.names.failed"), value: stats?.messages?.failed?.toLocaleString() || "0", icon: AlertCircle, color: "#ef4444", description: tTutorial("overview.stats.messagesFailed.description"), example: tTutorial("overview.stats.messagesFailed.example") },

    // --- Accounts ---
    { id: "accounts", name: t("overview.stats.prefixes.accounts") + t("overview.stats.names.totalAccounts"), value: stats?.accounts?.toLocaleString() || "0", icon: Users, color: "#6366f1", description: tTutorial("overview.stats.accounts.description"), example: tTutorial("overview.stats.accounts.example") },

    // --- Templates ---
    { id: "tpl_total", name: t("overview.stats.prefixes.templates") + t("overview.stats.names.total"), value: stats?.templates?.total?.toLocaleString() || "0", icon: FileText, color: "#64748b", description: tTutorial("overview.stats.templatesTotal.description"), example: tTutorial("overview.stats.templatesTotal.example") },
    { id: "tpl_approved", name: t("overview.stats.prefixes.templates") + t("overview.stats.names.approved"), value: stats?.templates?.approved?.toLocaleString() || "0", icon: CheckCircle, color: "#10b981", description: tTutorial("overview.stats.templatesApproved.description"), example: tTutorial("overview.stats.templatesApproved.example") },
    { id: "tpl_rejected", name: t("overview.stats.prefixes.templates") + t("overview.stats.names.rejected"), value: stats?.templates?.rejected?.toLocaleString() || "0", icon: XCircle, color: "#ef4444", description: tTutorial("overview.stats.templatesRejected.description"), example: tTutorial("overview.stats.templatesRejected.example") },
    { id: "tpl_low", name: t("overview.stats.prefixes.templates") + t("overview.stats.names.lowQuality"), value: stats?.templates?.lowQuality?.toLocaleString() || "0", icon: AlertCircle, color: "#f59e0b", description: tTutorial("overview.stats.templatesLowQuality.description"), example: tTutorial("overview.stats.templatesLowQuality.example") },

    // --- Upsells ---
    { id: "upsell_sent", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellSent"), value: stats?.upsells?.sent?.toLocaleString() || "0", icon: Send, color: "#3b82f6", description: tTutorial("overview.stats.upsellSent.description"), example: tTutorial("overview.stats.upsellSent.example") },
    { id: "upsell_accepted", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellAccepted"), value: stats?.upsells?.accepted?.toLocaleString() || "0", icon: DollarSign, color: "#10b981", description: tTutorial("overview.stats.upsellAccepted.description"), example: tTutorial("overview.stats.upsellAccepted.example") },
    { id: "upsell_rejected", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellRejected"), value: stats?.upsells?.rejected?.toLocaleString() || "0", icon: Ban, color: "#ef4444", description: tTutorial("overview.stats.upsellRejected.description"), example: tTutorial("overview.stats.upsellRejected.example") },
    { id: "upsell_no_answer", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellNoAnswer"), value: stats?.upsells?.noAnswer?.toLocaleString() || "0", icon: MessageSquare, color: "#64748b", description: tTutorial("overview.stats.upsellNoAnswer.description"), example: tTutorial("overview.stats.upsellNoAnswer.example") },
    { id: "upsell_expired", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellExpired"), value: stats?.upsells?.expired?.toLocaleString() || "0", icon: Clock, color: "#f59e0b", description: tTutorial("overview.stats.upsellExpired.description"), example: tTutorial("overview.stats.upsellExpired.example") },
    { id: "upsell_non_eligible", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellNonEligible"), value: stats?.upsells?.acceptedNonEligible?.toLocaleString() || "0", icon: AlertCircle, color: "#f59e0b", description: tTutorial("overview.stats.upsellNonEligible.description"), example: tTutorial("overview.stats.upsellNonEligible.example") },
    { id: "upsell_failed", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellFailed"), value: stats?.upsells?.failedToAdd?.toLocaleString() || "0", icon: XCircle, color: "#ef4444", description: tTutorial("overview.stats.upsellFailed.description"), example: tTutorial("overview.stats.upsellFailed.example") },
    { id: "upsell_delivered", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellDelivered"), value: stats?.upsells?.delivered?.toLocaleString() || "0", icon: Check, color: "#10b981", description: tTutorial("overview.stats.upsellDelivered.description"), example: tTutorial("overview.stats.upsellDelivered.example") },
    { id: "upsell_pending", name: t("overview.stats.prefixes.upsells") + t("overview.stats.names.upsellPending"), value: stats?.upsells?.pending?.toLocaleString() || "0", icon: Clock, color: "#3b82f6", description: tTutorial("overview.stats.upsellPending.description"), example: tTutorial("overview.stats.upsellPending.example") },
  ];

  // Funnel Data from stats
  const funnelData = [
    { label: t("overview.stats.names.sent"), value: stats?.messages?.totalSent || 0, pct: "100%", color: "bg-emerald-500", width: "100%" },
    { label: t("overview.stats.names.delivered"), value: stats?.messages?.delivered || 0, pct: stats?.messages?.totalSent > 0 ? ((stats.messages.delivered / stats.messages.totalSent) * 100).toFixed(1) + "%" : "0%", color: "bg-emerald-400", width: stats?.messages?.totalSent > 0 ? (stats.messages.delivered / stats.messages.totalSent) * 100 + "%" : "0%" },
    { label: t("overview.stats.names.read"), value: stats?.messages?.read || 0, pct: stats?.messages?.totalSent > 0 ? ((stats.messages.read / stats.messages.totalSent) * 100).toFixed(1) + "%" : "0%", color: "bg-blue-400", width: stats?.messages?.totalSent > 0 ? (stats.messages.read / stats.messages.totalSent) * 100 + "%" : "0%" },
    { label: t("overview.stats.names.clicks"), value: stats?.messages?.buttonClicks || 0, pct: stats?.messages?.totalSent > 0 ? ((stats.messages.buttonClicks / stats.messages.totalSent) * 100).toFixed(1) + "%" : "0%", color: "bg-purple-400", width: stats?.messages?.totalSent > 0 ? (stats.messages.buttonClicks / stats.messages.totalSent) * 100 + "%" : "0%" },
  ];

  // Memoize heatmap calculations
  const { maxTotal, heatmapLookup } = useMemo(() => {
    const max = Math.max(...heatmap.map(h => parseInt(h.total)), 1);
    const lookup = heatmap.reduce((acc, curr) => {
      acc[`${curr.day_of_week}-${curr.hour}`] = parseInt(curr.total);
      return acc;
    }, {});
    return { maxTotal: max, heatmapLookup: lookup };
  }, [heatmap]);

  // Dynamically calculate weekdays with dates
  const WEEKDAYS = useMemo(() => {
    const today = new Date();
    const days = [];

    // Loop backwards from 6 days ago up to 0 (today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const jsDay = date.getDay(); // JS returns: 0 (Sun) to 6 (Sat)

      const isoDow = jsDay === 0 ? 7 : jsDay;

      const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayKey = dayKeys[jsDay];

      const dayName = t(`overview.heatmap.days.${dayKey}`);
      const dateString = date.toLocaleDateString(
        locale === 'ar' ? 'ar-EG' : 'en-US',
        { month: 'short', day: 'numeric' }
      );

      days.push({
        key: dayKey,
        index: isoDow,
        fullLabel: `${dayName} - ${dateString}`
      });
    }

    return days;
  }, [t, locale]);

  // Table Columns Definitions
  const templatesCols = [
    { key: "name", header: t("overview.tables.templates.name"), cell: (r) => <span className="font-semibold text-xs">{r.name}</span> },
    { key: "category", header: t("overview.tables.templates.category"), cell: (r) => <span className="text-xs">{r.category}</span> },
    { key: "sentCount", header: t("overview.tables.templates.sent"), cell: (r) => <span className="tabular-nums font-medium text-xs">{r.sentCount}</span> },
    { key: "readCount", header: t("overview.tables.templates.read"), cell: (r) => <span className="tabular-nums text-xs">{r.readCount}</span> },
    { key: "clickCount", header: t("overview.tables.templates.clickRate"), cell: (r) => <PctBar value={r.sentCount > 0 ? (r.clickCount / r.sentCount) * 100 : 0} color="#10b981" /> },
  ];

  const automationCols = [
    { key: "name", header: t("overview.tables.automation.name"), cell: (r) => <span className="font-semibold text-xs">{r.name}</span> },
    { key: "totalRuns", header: t("overview.tables.automation.active"), cell: (r) => <span className="tabular-nums text-xs">{r.totalRuns}</span> },
    { key: "completed", header: t("overview.tables.automation.completed"), cell: (r) => <span className="tabular-nums text-xs">{r.completed}</span> },
    { key: "failed", header: t("overview.tables.automation.failed"), cell: (r) => <span className="tabular-nums text-xs">{r.failed}</span> },
    { key: "successRate", header: t("overview.tables.automation.successRate"), cell: (r) => <PctBar value={r.successRate} color="#10b981" /> },
  ];

  const buttonCols = [
    { key: "buttonText", header: t("overview.tables.buttons.button"), cell: (r) => <span className="font-semibold text-xs flex items-center gap-2"><div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary"><MousePointerClick size={12} /></div>{r.buttonText}</span> },
    { key: "count", header: t("overview.tables.buttons.clicks"), cell: (r) => <span className="tabular-nums font-medium text-xs">{r.count}</span> },
  ];

  return (
    <div className="min-h-screen p-4 md:p-5 space-y-5 bg-background">
      {/* Page header */}
      <PageHeader
        itemsCompact={false}
        breadcrumbs={[
          { name: t("overview.breadcrumb.home"), href: "/dashboard" },
          { name: t("overview.breadcrumb.statistics") },
        ]}
        buttons={
          <Button_
            size="sm"
            label={t("overview.howToUse")}
            variant="ghost"
            icon={<Info size={18} />}
          />
        }
        stats={statsCards}
        items={QUICK_RANGES}
        active={quickRange}
        setActive={(v) => {
          setQuickRange(v)
          setFilters(p => ({ ...p, startDate: null, endDate: null }))
        }}
      />

      {/* Filters */}
      <TableFilters
        onApply={fetchData}
        onRefresh={fetchData}
        applyLabel={t("overview.common.apply")}
      >
        <FilterField label={t("overview.common.dateRange")} icon={Calendar}>
          <DateRangePicker
            value={{
              startDate: filters.startDate,
              endDate: filters.endDate,
            }}
            onChange={(newDates) => {
              setFilters(f => ({ ...f, ...newDates }))
              setQuickRange(null)
            }}
            placeholder={t("overview.common.chooseDateRange")}
            dataSize="default"
            maxDate="today"
          />
        </FilterField>
        <WhatsAppAccountSelect
          label={t("overview.common.selectAccount")}
          value={filters.accountId}
          allowAll={true}
          onChange={(v) => setFilters(f => ({ ...f, accountId: v }))}
        />
      </TableFilters>

      {/* Row 2: Funnel, Trend, Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Messaging Funnel */}
        <div className="grid grid-cols-1 gap-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <TutorialSpotlight title={t("overview.cards.funnel")} description={tTutorial("overview.widgets.messagingFunnel.description")} example={tTutorial("overview.widgets.messagingFunnel.example")} overview={true}>
              <Card title={t("overview.cards.funnel")} icon={Activity}>
                <div className="flex flex-col gap-3 mt-4">
                  {funnelData.map((item, i) => (
                    <div
                      key={item.label}
                      dir="rtl"
                      className="relative w-full h-8 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex items-center px-3"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: item.width }}
                        className={cn("absolute right-0 top-0 bottom-0 z-0", item.color)}
                      />
                      <div className="relative z-10 w-full flex justify-between text-xs font-semibold text-slate-800 dark:text-white">
                        <div className="flex gap-2">
                          <span>{item.value.toLocaleString()}</span>
                          <span className="font-normal opacity-80">{item.label}</span>
                        </div>
                        <span>{item.pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TutorialSpotlight>
          </motion.div>

          {/* Messages Over Time */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-1">
            <TutorialSpotlight title={t("overview.cards.trend")} description={tTutorial("overview.widgets.trendsChart.description")} example={tTutorial("overview.widgets.trendsChart.example")} overview={true}>
              <Card title={t("overview.cards.trend")} icon={TrendingUp} >
                <TrendChart data={trends} loading={loading} configs={chartConfigs} />
              </Card>
            </TutorialSpotlight>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} >
            <TutorialSpotlight title={t("overview.cards.buttons")} description={tTutorial("overview.widgets.topButtons.description")} example={tTutorial("overview.widgets.topButtons.example")} overview={true}>
              <Card title={t("overview.cards.buttons")} icon={CheckCircle}>
                <MiniTable columns={buttonCols} data={topButtons} loading={loading} />
              </Card>
            </TutorialSpotlight>
          </motion.div>
          {/* Row 4: Heatmap */}
          <div className="">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <TutorialSpotlight title={t("overview.cards.heatmap")} description={tTutorial("overview.widgets.activityHeatmap.description")} example={tTutorial("overview.widgets.activityHeatmap.example")} overview={true}>
                <Card title={t("overview.cards.heatmap")} icon={CheckCircle}>
                {/* Changed to gap-2 for automatic RTL/LTR support instead of hardcoded ml-2 */}
                <div className="mt-4 flex gap-2">

                  {/* Days Column */}
                  <div className="flex flex-col gap-[2px] text-[9px] text-muted-foreground  min-w-[80px]">
                    {WEEKDAYS.map(day => (
                      <span key={day.key} className="whitespace-nowrap h-4">{day.fullLabel}</span>
                    ))}

                  </div>

                  {/* Heatmap Grid Area */}
                  <div className="flex-1 overflow-hidden">
                    <div
                      className="grid gap-[2px]"
                      // Fixes the Tailwind grid limit safely
                      style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
                    >
                      {Array.from({ length: 7 * 24 }).map((_, i) => {
                        // Correctly picks the day sequentially from 6 days ago -> today
                        const dayInfo = WEEKDAYS[Math.floor(i / 24)];
                        const hour = i % 24;

                        // dayInfo.index now perfectly aligns with the backend's EXTRACT(ISODOW)
                        const total = heatmapLookup[`${dayInfo.index}-${hour}`] || 0;
                        const intensity = maxTotal > 0 ? Math.min(total / maxTotal, 1) : 0;

                        return (
                          <div
                            key={i}
                            className="h-4 rounded-[1px] transition-colors"
                            style={{
                              backgroundColor:
                                intensity > 0.75 ? '#10b981' :
                                  intensity > 0.45 ? '#34d399' :
                                    intensity > 0.15 ? '#a7f3d0' :
                                      total > 0 ? '#d1fae5' :
                                        '#ecfdf5'
                            }}
                            title={`${dayInfo.fullLabel}, ${hour}:00 - ${total} messages`}
                          />
                        )
                      })}
                    </div>
                  

                  {/* Time Footer */}
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1">
                    <span>{t("overview.heatmap.hours.12am")}</span>
                    <span>{t("overview.heatmap.hours.4am")}</span>
                    <span>{t("overview.heatmap.hours.8am")}</span>
                    <span>{t("overview.heatmap.hours.12pm")}</span>
                    <span>{t("overview.heatmap.hours.4pm")}</span>
                    <span>{t("overview.heatmap.hours.8pm")}</span>
                  </div>
                </div>

              </div>
              <div className="flex items-center justify-start gap-2 mt-6 text-[10px] text-muted-foreground">
                <span>{t("overview.heatmap.low")}</span>
                <div className="flex gap-1 h-2">
                  <div className="w-4 bg-emerald-50 rounded-[1px]" />
                  <div className="w-4 bg-emerald-200 rounded-[1px]" />
                  <div className="w-4 bg-emerald-400 rounded-[1px]" />
                  <div className="w-4 bg-emerald-600 rounded-[1px]" />
                </div>
                <span>{t("overview.heatmap.high")}</span>
              </div>
            </Card>
              </TutorialSpotlight>
          </motion.div>
        </div>

      </div>
      {/* By Category */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <TutorialSpotlight title={t("overview.cards.type")} description={tTutorial("overview.widgets.messagesByCategory.description")} example={tTutorial("overview.widgets.messagesByCategory.example")} overview={true}>
          <Card title={t("overview.cards.type")} icon={PieIcon}>
            <StatusDonut
              data={categories}
              loading={loading}
              label={t("overview.common.messageLabel")}
              config={{
                key: "count",
                label: "name",
              }}
            />
          </Card>
        </TutorialSpotlight>
      </motion.div>
    </div>

      {/* Row 3: Tables */ }
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <TutorialSpotlight title={t("overview.cards.templates")} description={tTutorial("overview.widgets.topTemplates.description")} example={tTutorial("overview.widgets.topTemplates.example")} overview={true}>
        <Card title={t("overview.cards.templates")} action={<Button_
          variant="ghost"
          size="sm"
          label={t("overview.common.viewAll")}
          className="text-[10px] h-6"
          onClick={() => router.push("/whatsapp/templates")}
        />} icon={MessageSquare}>
          <MiniTable columns={templatesCols} data={topTemplates} loading={loading} />
        </Card>
      </TutorialSpotlight>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} >
      <TutorialSpotlight title={t("overview.cards.automation")} description={tTutorial("overview.widgets.topAutomations.description")} example={tTutorial("overview.widgets.topAutomations.example")} overview={true}>
        <Card title={t("overview.cards.automation")} action={<Button_
          variant="ghost"
          size="sm"
          label={t("overview.common.viewAll")}
          className="text-[10px] h-6"
          onClick={() => router.push("/automations")}
        />} icon={CheckCircle}>
          <MiniTable columns={automationCols} data={topAutomations} loading={loading} />
        </Card>
      </TutorialSpotlight>
    </motion.div>
  </div>
    </div >
  );
}