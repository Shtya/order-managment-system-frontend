"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Info,
  Layers,
  PieChart as PieIcon,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";
import Button_ from "@/components/atoms/Button";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import PageHeader from "@/components/atoms/Pageheader";
import { TutorialSpotlight } from "@/components/atoms/TutorialSpotlight";
import { useTutorial } from "@/context/TutorialContext";
import { useTrendLabelFormatter } from "@/hook/useTrendLabelFormatter";
import { setDocumentTitle } from "@/utils/documentTitle";
import { useRouter } from "@/i18n/navigation";
import {
  Card,
  MiniTable,
  PctBar,
  StatusDonut,
  TableFilters,
  TrendChart,
} from "../order-analysis/page";

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

function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function datesFromRange(id) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (id === "today") return { startDate: toYmd(start), endDate: toYmd(end) };
  if (id === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
    return { startDate: toYmd(start), endDate: toYmd(end) };
  }
  if (id === "this_week") {
    return { startDate: toYmd(startOfWeek(now)), endDate: toYmd(end) };
  }
  if (id === "last_week") {
    const startLast = startOfWeek(now);
    startLast.setDate(startLast.getDate() - 7);
    const endLast = new Date(startLast);
    endLast.setDate(endLast.getDate() + 6);
    return { startDate: toYmd(startLast), endDate: toYmd(endLast) };
  }
  if (id === "this_month") {
    start.setDate(1);
    return { startDate: toYmd(start), endDate: toYmd(end) };
  }
  if (id === "last_month") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
    return { startDate: toYmd(start), endDate: toYmd(end) };
  }
  if (id === "this_year") {
    start.setMonth(0, 1);
    return { startDate: toYmd(start), endDate: toYmd(end) };
  }
  return { startDate: null, endDate: null };
}

function pickInterval(startDate, endDate) {
  if (!startDate || !endDate) return "day";
  const days = Math.max(
    1,
    Math.round((new Date(endDate) - new Date(startDate)) / 86400000),
  );
  if (days > 180) return "month";
  if (days > 45) return "week";
  return "day";
}

function fmtHours(value) {
  const n = Number(value || 0);
  if (!n) return "0";
  if (n >= 24) return `${(n / 24).toFixed(1)}d`;
  return `${n.toFixed(1)}h`;
}

function deltaTrend(current, previous, invert = false) {
  if (previous == null || previous === undefined) return undefined;
  const diff = Number(current || 0) - Number(previous || 0);
  return {
    value: `${diff > 0 ? "+" : ""}${diff}`,
    isGood: invert ? diff <= 0 : diff >= 0,
  };
}

export default function CancelCausesStatisticsPage() {
  const t = useTranslations("cancelCausesReports");
  const tTutorial = useTranslations("tutorial.cancelCauses");
  const tRanges = useTranslations("orderAnalysis");
  const router = useRouter();
  const { toggleTutorialMode } = useTutorial();
  const { formatTrendLabel } = useTrendLabelFormatter();

  const [loading, setLoading] = useState(true);
  const [quickRange, setQuickRange] = useState("this_month");
  const [filters, setFilters] = useState({ startDate: null, endDate: null });

  const [overview, setOverview] = useState(null);
  const [byCause, setByCause] = useState([]);
  const [top, setTop] = useState([]);
  const [topMonth, setTopMonth] = useState([]);
  const [trend, setTrend] = useState([]);
  const [employees, setEmployees] = useState([]);
  // const [sla, setSla] = useState(null);
  const [mix, setMix] = useState(null);
  // const [pending, setPending] = useState(null);

  useEffect(() => {
    setDocumentTitle(t("title"));
  }, [t]);

  const dateParams = useMemo(() => {
    if (filters.startDate && filters.endDate) {
      return { startDate: filters.startDate, endDate: filters.endDate };
    }
    return datesFromRange(quickRange);
  }, [filters, quickRange]);

  const buildParams = useCallback(
    (extra = {}) => {
      const p = { ...extra };
      if (dateParams.startDate) p.startDate = dateParams.startDate;
      if (dateParams.endDate) p.endDate = dateParams.endDate;
      return p;
    },
    [dateParams],
  );

  const fetchData = useCallback(async () => {
    const p = buildParams();
    const interval = pickInterval(p.startDate, p.endDate);
    setLoading(true);
    try {
      const [
        overviewRes,
        byCauseRes,
        topRes,
        topMonthRes,
        trendRes,
        employeesRes,
        mixRes,
      ] = await Promise.all([
        api.get("/cancel-causes/statistics", { params: p }).catch(() => ({ data: null })),
        api.get("/cancel-causes/statistics/by-cause", { params: { ...p, limit: 12 } }).catch(() => ({ data: { records: [] } })),
        api.get("/cancel-causes/statistics/top", { params: { ...p, limit: 8 } }).catch(() => ({ data: { records: [] } })),
        api.get("/cancel-causes/statistics/top-this-month").catch(() => ({ data: { records: [] } })),
        api.get("/cancel-causes/statistics/trend", { params: { ...p, interval } }).catch(() => ({ data: { buckets: [] } })),
        api.get("/cancel-causes/statistics/by-employee", { params: { ...p, limit: 12 } }).catch(() => ({ data: { records: [] } })),
        // api.get("/cancel-causes/statistics/sla", { params: p }).catch(() => ({ data: null })),
        api.get("/cancel-causes/statistics/custom-vs-predefined", { params: p }).catch(() => ({ data: null })),
        // api.get("/cancel-causes/statistics/pending-review").catch(() => ({ data: null })),
      ]);

      setOverview(overviewRes.data);
      setByCause(byCauseRes.data?.records || []);
      setTop(topRes.data?.records || []);
      setTopMonth(topMonthRes.data?.records || []);
      setTrend(
        (trendRes.data?.buckets || []).map((item) => ({
          ...item,
          label: formatTrendLabel(item.periodStart),
        })),
      );
      setEmployees(employeesRes.data?.records || []);
      // setSla(slaRes.data);
      setMix(mixRes.data);
      // setPending(pendingRes.data);
    } catch (err) {
      console.error(err);
      toast.error(t("fetchError"));
    } finally {
      setLoading(false);
    }
  }, [buildParams, formatTrendLabel, t]);

  useEffect(() => {
    fetchData();
  }, [quickRange]);

  const QUICK_RANGES = [
    { id: "today", label: tRanges("ranges.today") },
    { id: "yesterday", label: tRanges("ranges.yesterday") },
    { id: "this_week", label: tRanges("ranges.this_week") },
    { id: "last_week", label: tRanges("ranges.last_week") },
    { id: "this_month", label: tRanges("ranges.this_month") },
    { id: "last_month", label: tRanges("ranges.last_month") },
    { id: "this_year", label: tRanges("ranges.this_year") },
  ];

  const cmp = overview?.comparison;
  const statsCards = [
    {
      id: "total",
      name: t("kpis.totalCancellations"),
      value: (overview?.totalCancellations || 0).toLocaleString(),
      icon: Ban,
      // trend: deltaTrend(overview?.totalCancellations, cmp?.totalCancellations, true),
      description: tTutorial("stats.totalCancellations.description"),
      example: tTutorial("stats.totalCancellations.example"),
    },
    {
      id: "unique",
      name: t("kpis.uniqueOrders"),
      value: (overview?.uniqueOrdersCancelled || 0).toLocaleString(),
      icon: Layers,
      // trend: deltaTrend(overview?.uniqueOrdersCancelled, cmp?.uniqueOrdersCancelled, true),
      description: tTutorial("stats.uniqueOrders.description"),
      example: tTutorial("stats.uniqueOrders.example"),
    },
    {
      id: "rate",
      name: t("kpis.cancellationRate"),
      value: `${overview?.cancellationRate || 0}%`,
      icon: TrendingUp,
      description: tTutorial("stats.cancellationRate.description"),
      example: tTutorial("stats.cancellationRate.example"),
    },
    {
      id: "orders",
      name: t("kpis.ordersInPeriod"),
      value: (overview?.totalOrdersInPeriod || 0).toLocaleString(),
      icon: Activity,
      description: tTutorial("stats.ordersInPeriod.description"),
      example: tTutorial("stats.ordersInPeriod.example"),
    },
    {
      id: "predefined",
      name: t("kpis.predefined"),
      value: (overview?.predefinedCount || 0).toLocaleString(),
      icon: CheckCircle,
      description: tTutorial("stats.predefined.description"),
      example: tTutorial("stats.predefined.example"),
    },
    {
      id: "custom",
      name: t("kpis.custom"),
      value: (overview?.customSubmissionCount || 0).toLocaleString(),
      icon: UserPlus,
      description: tTutorial("stats.custom.description"),
      example: tTutorial("stats.custom.example"),
    },
    {
      id: "pending",
      name: t("kpis.pendingReview"),
      value: (overview?.pendingReviewCount || 0).toLocaleString(),
      icon: Clock,
      description: tTutorial("stats.pendingReview.description"),
      example: tTutorial("stats.pendingReview.example"),
    },
    {
      id: "approved",
      name: t("kpis.approvedCatalog"),
      value: (overview?.approvedCatalogCount || 0).toLocaleString(),
      icon: CheckCircle,
      description: tTutorial("stats.approvedCatalog.description"),
      example: tTutorial("stats.approvedCatalog.example"),
    },
    {
      id: "inactive",
      name: t("kpis.inactiveCatalog"),
      value: (overview?.inactiveCatalogCount || 0).toLocaleString(),
      icon: Ban,
      description: tTutorial("stats.inactiveCatalog.description"),
      example: tTutorial("stats.inactiveCatalog.example"),
    },
    {
      id: "rejected",
      name: t("kpis.rejectedCatalog"),
      value: (overview?.rejectedCatalogCount || 0).toLocaleString(),
      icon: XCircle,
      description: tTutorial("stats.rejectedCatalog.description"),
      example: tTutorial("stats.rejectedCatalog.example"),
    },
    // {
    //   id: "avgHours",
    //   name: t("kpis.avgHours"),
    //   value: fmtHours(sla?.avgHoursToCancel),
    //   icon: Timer,
    //   description: tTutorial("stats.avgHours.description"),
    //   example: tTutorial("stats.avgHours.example"),
    // },
    // {
    //   id: "medianHours",
    //   name: t("kpis.medianHours"),
    //   value: fmtHours(sla?.medianHoursToCancel),
    //   icon: Clock,
    //   description: tTutorial("stats.medianHours.description"),
    //   example: tTutorial("stats.medianHours.example"),
    // },
    // {
    //   id: "slaBreaches",
    //   name: t("kpis.slaBreaches"),
    //   value: (sla?.slaBreachCount || 0).toLocaleString(),
    //   icon: Timer,
    //   description: tTutorial("stats.slaBreaches.description"),
    //   example: tTutorial("stats.slaBreaches.example"),
    // },
    // {
    //   id: "slaRate",
    //   name: t("kpis.slaRate"),
    //   value: `${sla?.slaBreachRate || 0}%`,
    //   icon: Activity,
    //   description: tTutorial("stats.slaRate.description"),
    //   example: tTutorial("stats.slaRate.example"),
    // },
    // {
    //   id: "oldestPending",
    //   name: t("kpis.oldestPending"),
    //   value: pending?.oldestPendingAt
    //     ? new Date(pending.oldestPendingAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")
    //     : "—",
    //   icon: Clock,
    //   description: tTutorial("stats.oldestPending.description"),
    //   example: tTutorial("stats.oldestPending.example"),
    // },
    // {
    //   id: "avgPending",
    //   name: t("kpis.avgPendingAge"),
    //   value: fmtHours(pending?.avgPendingAgeHours),
    //   icon: Clock,
    //   description: tTutorial("stats.avgPendingAge.description"),
    //   example: tTutorial("stats.avgPendingAge.example"),
    // },
    // {
    //   id: "monthSubs",
    //   name: t("kpis.submissionsThisMonth"),
    //   value: (pending?.submissionsThisMonth || 0).toLocaleString(),
    //   icon: UserPlus,
    //   description: tTutorial("stats.submissionsThisMonth.description"),
    //   example: tTutorial("stats.submissionsThisMonth.example"),
    // },
  ];

  const mixDonut = [
    { name: t("mix.predefined"), count: mix?.predefinedCount || 0, color: "#10b981" },
    { name: t("mix.custom"), count: mix?.customCount || 0, color: "#8b5cf6" },
  ];

  // const slaTotal = Object.values(sla?.buckets || {}).reduce((s, n) => s + Number(n || 0), 0) || 1;
  // const slaFunnel = [
  //   { key: "lt2h", color: "bg-emerald-500" },
  //   { key: "h2to8", color: "bg-emerald-400" },
  //   { key: "h8to24", color: "bg-amber-400" },
  //   { key: "d1to3", color: "bg-orange-400" },
  //   { key: "gt3d", color: "bg-rose-500" },
  // ].map((item) => {
  //   const value = Number(sla?.buckets?.[item.key] || 0);
  //   const pct = ((value / slaTotal) * 100).toFixed(1);
  //   return {
  //     ...item,
  //     label: t(`sla.${item.key}`),
  //     value,
  //     pct: `${pct}%`,
  //     width: `${pct}%`,
  //   };
  // });

  const chartConfigs = [
    { key: "total", label: t("kpis.totalCancellations"), color: "#ef4444", fillOpacity: 0.1 },
    { key: "predefinedCount", label: t("mix.predefined"), color: "#10b981", fillOpacity: 0.08 },
    { key: "customCount", label: t("mix.custom"), color: "#8b5cf6", fillOpacity: 0.08 },
  ];

  const causeCols = [
    { key: "name", header: t("tables.cause"), cell: (r) => <span className="font-semibold text-xs">{r.name || "—"}</span> },
    { key: "count", header: t("tables.count"), cell: (r) => <span className="tabular-nums text-xs">{r.count}</span> },
    { key: "percent", header: t("tables.share"), cell: (r) => <PctBar value={r.percent || 0} color="#ef4444" /> },
    { key: "customSubmissionCount", header: t("tables.custom"), cell: (r) => <span className="tabular-nums text-xs">{r.customSubmissionCount || 0}</span> },
    {
      key: "avgHoursToCancel",
      header: (
        <span className="inline-flex flex-col items-center leading-tight">
          <span>{t("tables.avgHours")}</span>
          <span className="text-[9px] font-normal text-muted-foreground normal-case tracking-normal">
            {t("tables.avgHoursHint")}
          </span>
        </span>
      ),
      cell: (r) => (
        <span className="tabular-nums text-xs" title={t("tables.avgHoursHint")}>
          {fmtHours(r.avgHoursToCancel)}
        </span>
      ),
    },
  ];

  const topCols = [
    { key: "name", header: t("tables.cause"), cell: (r) => <span className="font-semibold text-xs">{r.name || "—"}</span> },
    { key: "count", header: t("tables.count"), cell: (r) => <span className="tabular-nums text-xs">{r.count}</span> },
    { key: "percent", header: t("tables.share"), cell: (r) => <PctBar value={r.percent || 0} color="#8b5cf6" /> },
  ];

  const employeeCols = [
    { key: "employeeName", header: t("tables.employee"), cell: (r) => <span className="font-semibold text-xs">{r.employeeName || t("tables.unassigned")}</span> },
    { key: "count", header: t("tables.count"), cell: (r) => <span className="tabular-nums text-xs">{r.count}</span> },
    { key: "customCount", header: t("tables.custom"), cell: (r) => <span className="tabular-nums text-xs">{r.customCount || 0}</span> },
    { key: "topCauseName", header: t("tables.topCause"), cell: (r) => <span className="text-xs">{r.topCauseName || "—"}</span> },
  ];

  // const slaCauseCols = [
  //   { key: "name", header: t("tables.cause"), cell: (r) => <span className="font-semibold text-xs">{r.name || "—"}</span> },
  //   { key: "count", header: t("tables.count"), cell: (r) => <span className="tabular-nums text-xs">{r.count}</span> },
  //   { key: "avgHoursToCancel", header: t("tables.avgHours"), cell: (r) => <span className="tabular-nums text-xs">{fmtHours(r.avgHoursToCancel)}</span> },
  //   { key: "medianHoursToCancel", header: t("tables.medianHours"), cell: (r) => <span className="tabular-nums text-xs">{fmtHours(r.medianHoursToCancel)}</span> },
  // ];

  return (
    <div className="min-h-screen p-4 md:p-5 space-y-5 bg-background">
      <PageHeader
        itemsCompact={false}
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.reports"), href: "/reports/order-analysis" },
          { name: t("breadcrumb.statistics") },
        ]}
        buttons={
          <Button_
            size="sm"
            label={t("howToUse")}
            variant="ghost"
            icon={<Info size={18} />}
            onClick={toggleTutorialMode}
          />
        }
        stats={statsCards}
        items={QUICK_RANGES}
        active={quickRange}
        setActive={(v) => {
          setQuickRange(v);
          setFilters({ startDate: null, endDate: null });
        }}
      />

      <TableFilters onApply={fetchData} onRefresh={fetchData} applyLabel={t("common.apply")}>
        <FilterField label={t("common.dateRange")} icon={Calendar}>
          <DateRangePicker
            value={{ startDate: filters.startDate, endDate: filters.endDate }}
            onChange={(newDates) => {
              setFilters((f) => ({ ...f, ...newDates }));
              setQuickRange(null);
            }}
            placeholder={t("common.chooseDateRange")}
            dataSize="default"
            maxDate="today"
          />
        </FilterField>
      </TableFilters>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <TutorialSpotlight
            title={t("cards.mix")}
            description={tTutorial("widgets.mix.description")}
            example={tTutorial("widgets.mix.example")}
            overview
          >
            <Card title={t("cards.mix")} icon={PieIcon}>
              <StatusDonut
                data={mixDonut}
                loading={loading}
                label={t("common.cancellations")}
                config={{ key: "count", label: "name" }}
              />
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-muted-foreground mb-1">{t("mix.acceptedConverted")}</p>
                  <p className="font-bold tabular-nums">{mix?.acceptedCustomConverted || 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-muted-foreground mb-1">{t("mix.rejectedStillOnOrders")}</p>
                  <p className="font-bold tabular-nums">{mix?.rejectedCustomStillOnOrders || 0}</p>
                </div>
              </div>
            </Card>
          </TutorialSpotlight>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
          <TutorialSpotlight
            title={t("cards.trend")}
            description={tTutorial("widgets.trend.description")}
            example={tTutorial("widgets.trend.example")}
            overview
          >
            <Card title={t("cards.trend")} icon={TrendingUp}>
              <TrendChart data={trend} loading={loading} configs={chartConfigs} />
            </Card>
          </TutorialSpotlight>
        </motion.div>
      </div>

      {/* SLA + pending review widgets — paused for now
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        ... cards.sla / cards.pending ...
      </div>
      */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <TutorialSpotlight
            title={t("cards.top")}
            description={tTutorial("widgets.top.description")}
            example={tTutorial("widgets.top.example")}
            overview
          >
            <Card title={t("cards.top")} icon={Ban}>
              <MiniTable columns={topCols} data={top} loading={loading} />
            </Card>
          </TutorialSpotlight>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <TutorialSpotlight
            title={t("cards.topMonth")}
            description={tTutorial("widgets.topMonth.description")}
            example={tTutorial("widgets.topMonth.example")}
            overview
          >
            <Card title={t("cards.topMonth")} icon={TrendingUp}>
              <MiniTable columns={topCols} data={topMonth} loading={loading} />
            </Card>
          </TutorialSpotlight>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <TutorialSpotlight
            title={t("cards.byCause")}
            description={tTutorial("widgets.byCause.description")}
            example={tTutorial("widgets.byCause.example")}
            overview
          >
            <Card
              title={t("cards.byCause")}
              icon={Layers}
              action={
                <Button_
                  variant="ghost"
                  size="sm"
                  label={t("common.viewCauses")}
                  className="text-[10px] h-6"
                  onClick={() => router.push("/cancel-causes")}
                />
              }
            >
              <MiniTable columns={causeCols} data={byCause} loading={loading} />
            </Card>
          </TutorialSpotlight>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <TutorialSpotlight
            title={t("cards.byEmployee")}
            description={tTutorial("widgets.byEmployee.description")}
            example={tTutorial("widgets.byEmployee.example")}
            overview
          >
            <Card title={t("cards.byEmployee")} icon={Users}>
              <MiniTable columns={employeeCols} data={employees} loading={loading} />
            </Card>
          </TutorialSpotlight>
        </motion.div>
      </div>

      {/* Slowest causes by SLA — paused for now
      <motion.div>
        <Card title={t("cards.slaByCause")} ... />
      </motion.div>
      */}
    </div>
  );
}
