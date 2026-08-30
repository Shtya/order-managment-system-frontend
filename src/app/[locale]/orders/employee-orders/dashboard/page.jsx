"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Ban,
  Calendar,
  CheckCircle,
  Lock,
  Package,
  PieChart as PieIcon,
  RefreshCw,
  Tags,
  TrendingUp,
  Truck,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";
import Button_ from "@/components/atoms/Button";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import PageHeader from "@/components/atoms/Pageheader";
import { setDocumentTitle } from "@/utils/documentTitle";
import {
  Card,
  MiniTable,
  PctBar,
  StatusDonut,
  TableFilters,
  TrendChart,
} from "../../../reports/order-analysis/page";
import { getIconForStatus } from "../../page";
import { cn } from "@/utils/cn";

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

function pctOf(num, den) {
  const n = Number(num) || 0;
  const d = Number(den) || 0;
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

function CardTitle({ title, hint }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span>{title}</span>
      {hint ? (
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
          {hint}
        </span>
      ) : null}
    </span>
  );
}

export default function EmployeePerformanceDashboardPage() {
  const tOrders = useTranslations("orders");
  const tRanges = useTranslations("orderAnalysis");
  const t = useTranslations("orders.employeeDashboard");

  const [loading, setLoading] = useState(true);
  const [quickRange, setQuickRange] = useState("this_month");
  const [filters, setFilters] = useState(() => datesFromRange("this_month"));
  const [payload, setPayload] = useState({
    statuses: [],
    confirmationStatuses: [],
    kpis: {
      assigned: 0,
      activeAssignments: 0,
      lockedAssignments: 0,
      contactTries: 0,
      confirmRate: 0,
      avgContactTries: 0,
      confirmedCount: 0,
      shippedNow: 0,
      delivered: 0,
      returned: 0,
      shippedEver: 0,
      shippedOfConfirmedPercent: 0,
      confirmedNotShipped: 0,
      byStatus: [],
    },
    daily: [],
    statusBreakdown: [],
    tags: [],
    cancelCauses: [],
  });

  useEffect(() => {
    setDocumentTitle(t("title"));
  }, [t]);

  const statusName = useCallback(
    (status) =>
      status?.system ? tOrders(`statuses.${status.code}`) : status?.name || "—",
    [tOrders],
  );

  const statusHint = useCallback(
    (code) => {
      if (!code) return "";
      const key = `statusHints.${code}`;
      const value = t(key);
      return value === key ? "" : value;
    },
    [t],
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const range = quickRange ? datesFromRange(quickRange) : filters;
      const res = await api.get("/order-assignment/employee/performance", {
        params: {
          startDate: range.startDate || filters.startDate || undefined,
          endDate: range.endDate || filters.endDate || undefined,
        },
      });
      setPayload({
        statuses: res.data?.statuses ?? [],
        confirmationStatuses: res.data?.confirmationStatuses ?? [],
        kpis: {
          assigned: 0,
          activeAssignments: 0,
          lockedAssignments: 0,
          contactTries: 0,
          confirmRate: 0,
          avgContactTries: 0,
          confirmedCount: 0,
          shippedNow: 0,
          delivered: 0,
          returned: 0,
          shippedEver: 0,
          shippedOfConfirmedPercent: 0,
          confirmedNotShipped: 0,
          byStatus: [],
          ...(res.data?.kpis ?? {}),
        },
        daily: res.data?.daily ?? [],
        statusBreakdown: res.data?.statusBreakdown ?? [],
        tags: res.data?.tags ?? [],
        cancelCauses: res.data?.cancelCauses ?? [],
      });
    } catch (error) {
      console.error(error);
      toast.error(t("errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [filters.endDate, filters.startDate, quickRange, t]);

  useEffect(() => {
    if (quickRange) {
      fetchData();
    }
  }, [quickRange]);

  const countByStatusId = useMemo(() => {
    const map = {};
    for (const row of payload.kpis?.byStatus || []) {
      map[row.statusId] = row;
    }
    return map;
  }, [payload.kpis]);

  const mergedStatuses = useMemo(
    () =>
      (payload.statuses || []).map((status) => {
        const row = countByStatusId[status.id] || {};
        return {
          ...status,
          count: Number(row.count ?? status.count) || 0,
          percent: Number(row.percent ?? status.percent) || 0,
        };
      }),
    [payload.statuses, countByStatusId],
  );

  const confirmationStatuses = payload.confirmationStatuses || [];

  const donutItems = useMemo(
    () =>
      (payload.statusBreakdown?.length
        ? payload.statusBreakdown
        : mergedStatuses
      ).map((status) => ({
        ...status,
        name: statusName(status),
        count: Number(status.count) || 0,
      })),
    [payload.statusBreakdown, mergedStatuses, statusName],
  );

  const kpis = payload.kpis || {};
  const assigned = Number(kpis.assigned) || 0;
  const confirmedCount = Number(kpis.confirmedCount) || 0;

  const statsCards = useMemo(() => {
    const fromAssignedLabel = t("kpis.fromAssigned");
    const fromConfirmedLabel = t("kpis.fromConfirmed");

    const percentTrend = (percent, fromLabel) => ({
      value: "",
      label: `${percent ?? 0}% ${fromLabel}`,
      showArrow: false,
    });

    const percentFromLabel = (percentFrom) => {
      if (!percentFrom || percentFrom === "total") return fromAssignedLabel;
      if (percentFrom === "previously_confirmed") return fromConfirmedLabel;
      const fromLabelsKey = `stats.percentFromLabels.${percentFrom}`;
      const fromLabelsValue = tOrders(fromLabelsKey);
      if (fromLabelsValue !== fromLabelsKey) {
        return t("kpis.fromStatus", { status: fromLabelsValue });
      }
      const statusKey = `statuses.${percentFrom}`;
      const statusValue = tOrders(statusKey);
      return t("kpis.fromStatus", {
        status: statusValue !== statusKey ? statusValue : percentFrom,
      });
    };

    const work = [
      {
        id: "assigned",
        name: t("kpis.assigned"),
        value: String(assigned),
        icon: Package,
        color: "#5140b8",
        sortOrder: 1,
        description: t("kpis.assignedHint"),
      },
      {
        id: "active",
        name: t("kpis.activeAssignments"),
        value: String(kpis.activeAssignments ?? 0),
        icon: Activity,
        color: "#3b82f6",
        sortOrder: 2,
        description: t("kpis.activeHint"),
        trend: percentTrend(pctOf(kpis.activeAssignments, assigned), fromAssignedLabel),
      },
      {
        id: "locked",
        name: t("kpis.locked"),
        value: String(kpis.lockedAssignments ?? 0),
        icon: Lock,
        color: "#f59e0b",
        sortOrder: 3,
        description: t("kpis.lockedHint"),
        trend: percentTrend(pctOf(kpis.lockedAssignments, assigned), fromAssignedLabel),
      },
      {
        id: "confirmRate",
        name: t("kpis.confirmRate"),
        value: `${kpis.confirmRate ?? 0}%`,
        icon: CheckCircle,
        color: "#10b981",
        sortOrder: 5,
        description: t("kpis.confirmRateHint"),
        trend: percentTrend(kpis.confirmRate ?? 0, fromAssignedLabel),
      },
    ];

    const confirmation = confirmationStatuses.map((status, i) => {
      const Icon = getIconForStatus(status.code);
      return {
        id: `confirm-${status.id}`,
        name: statusName(status),
        value: String(status.count ?? 0),
        icon: Icon,
        color: status.color || "#64748B",
        sortOrder: 20 + i,
        description: statusHint(status.code) || t("sections.confirmation"),
        trend: percentTrend(status.percent ?? 0, percentFromLabel(status.percentFrom)),
      };
    });

    const shipping = [
      {
        id: "shippedNow",
        name: t("kpis.shippedNow"),
        value: String(kpis.shippedNow ?? 0),
        icon: Truck,
        color: "#3b82f6",
        sortOrder: 40,
        description: t("kpis.shippedNowHint"),
        trend: percentTrend(pctOf(kpis.shippedNow, assigned), fromAssignedLabel),
      },
      {
        id: "delivered",
        name: t("kpis.delivered"),
        value: String(kpis.delivered ?? 0),
        icon: CheckCircle,
        color: "#14b8a6",
        sortOrder: 41,
        description: t("kpis.deliveredHint"),
        trend: percentTrend(pctOf(kpis.delivered, assigned), fromAssignedLabel),
      },
      {
        id: "returned",
        name: t("kpis.returned"),
        value: String(kpis.returned ?? 0),
        icon: Undo2,
        color: "#f97316",
        sortOrder: 42,
        description: t("kpis.returnedHint"),
        trend: percentTrend(pctOf(kpis.returned, assigned), fromAssignedLabel),
      },
      // {
      //   id: "shippedOfConfirmed",
      //   name: t("kpis.shippedOfConfirmed"),
      //   value: `${kpis.shippedEver ?? 0} / ${kpis.confirmedCount ?? 0}`,
      //   icon: Truck,
      //   color: "#10b981",
      //   sortOrder: 43,
      //   description: t("kpis.shippedOfConfirmedHint"),
      //   trend: percentTrend(kpis.shippedOfConfirmedPercent ?? 0, fromConfirmedLabel),
      // },
      {
        id: "confirmedNotShipped",
        name: t("kpis.confirmedNotShipped"),
        value: String(kpis.confirmedNotShipped ?? 0),
        icon: Package,
        color: "#f59e0b",
        sortOrder: 44,
        description: t("kpis.confirmedNotShippedHint"),
        trend: percentTrend(pctOf(kpis.confirmedNotShipped, confirmedCount), fromConfirmedLabel),
      },
    ];

    return [...work, ...confirmation, ...shipping];
  }, [
    assigned,
    confirmationStatuses,
    confirmedCount,
    kpis,
    statusHint,
    statusName,
    t,
    tOrders,
  ]);

  const chartStatuses = confirmationStatuses;

  const trendData = useMemo(
    () =>
      (payload.daily || []).map((day) => {
        const row = {
          label: day.date,
          assigned: Number(day.assigned) || 0,
        };
        for (const status of chartStatuses) {
          row[status.id] = Number(day.byStatus?.[status.id]) || 0;
        }
        return row;
      }),
    [payload.daily, chartStatuses],
  );

  const trendConfigs = useMemo(
    () =>
      chartStatuses.map((status) => ({
        key: status.id,
        label: statusName(status),
        color: status.color || "#64748B",
        fillOpacity: 0.08,
      })),
    [chartStatuses, statusName],
  );

  const dailyTableColumns = useMemo(
    () => [
      {
        key: "date",
        header: t("tables.date"),
        cell: (row) => <span className="text-xs font-semibold">{row.date}</span>,
      },
      {
        key: "assigned",
        header: t("kpis.assigned"),
        cell: (row) => (
          <span className="tabular-nums text-xs font-bold">{row.assigned}</span>
        ),
      },
      ...confirmationStatuses.map((status) => ({
        key: status.id,
        header: (
          <span className="inline-flex flex-col items-start leading-tight">
            <span>{statusName(status)}</span>
            {statusHint(status.code) ? (
              <span className="text-[9px] font-normal text-muted-foreground normal-case tracking-normal">
                {statusHint(status.code)}
              </span>
            ) : null}
          </span>
        ),
        cell: (row) => (
          <span className="tabular-nums text-xs" style={{ color: status.color }}>
            {row.byStatus?.[status.id] || 0}
          </span>
        ),
      })),
      {
        key: "contactTries",
        header: t("tables.contactTries"),
        cell: (row) => (
          <span className="tabular-nums text-xs">{row.contactTries || 0}</span>
        ),
      },
    ],
    [confirmationStatuses, statusHint, statusName, t],
  );

  const tagCols = [
    {
      key: "name",
      header: t("tables.tag"),
      cell: (row) => (
        <span className="inline-flex items-center gap-2 font-semibold text-xs">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: row.color }}
          />
          {row.name || "—"}
        </span>
      ),
    },
    {
      key: "count",
      header: t("tables.count"),
      cell: (row) => <span className="tabular-nums text-xs">{row.count}</span>,
    },
    {
      key: "percent",
      header: t("tables.share"),
      cell: (row) => <PctBar value={row.percent || 0} color={row.color || "#8b5cf6"} />,
    },
  ];

  const causeCols = [
    {
      key: "name",
      header: t("tables.cause"),
      cell: (row) => <span className="font-semibold text-xs">{row.name || "—"}</span>,
    },
    {
      key: "count",
      header: t("tables.count"),
      cell: (row) => <span className="tabular-nums text-xs">{row.count}</span>,
    },
    {
      key: "percent",
      header: t("tables.share"),
      cell: (row) => <PctBar value={row.percent || 0} color="#ef4444" />,
    },
  ];

  const QUICK_RANGES = [
    { id: "today", label: tRanges("ranges.today") },
    { id: "yesterday", label: tRanges("ranges.yesterday") },
    { id: "this_week", label: tRanges("ranges.this_week") },
    { id: "last_week", label: tRanges("ranges.last_week") },
    { id: "this_month", label: tRanges("ranges.this_month") },
    { id: "last_month", label: tRanges("ranges.last_month") },
    { id: "this_year", label: tRanges("ranges.this_year") },
  ];

  return (
    <div className="min-h-screen p-4 md:p-5 space-y-5 bg-[#f3f6fa] dark:bg-[#19243950]">
      <PageHeader
        itemsCompact={false}
        breadcrumbs={[
          { name: tOrders("myOrders.title"), href: "/orders/employee-orders" },
          { name: t("title") },
        ]}
        buttons={
          <Button_
            variant="outline"
            tone="primary"
            onClick={fetchData}
            disabled={loading}
            icon={<RefreshCw size={16} className={cn(loading && "animate-spin")} />}
            label={tOrders("actions.refresh")}
          />
        }
        stats={statsCards}
        statsLoading={loading}
        showStatisticsVisibility
        statsKey="employee-dashboard"
        items={QUICK_RANGES}
        active={quickRange}
        setActive={(v) => {
          setQuickRange(v);
          setFilters(datesFromRange(v));
        }}
      />

      <TableFilters onApply={fetchData} onRefresh={fetchData} applyLabel={t("apply")}>
        <FilterField label={t("dateRange")} icon={Calendar}>
          <DateRangePicker
            value={{ startDate: filters.startDate, endDate: filters.endDate }}
            onChange={(newDates) => {
              setFilters((f) => ({ ...f, ...newDates }));
              setQuickRange(null);
            }}
            placeholder={t("chooseDateRange")}
            dataSize="default"
            maxDate="today"
          />
        </FilterField>
      </TableFilters>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card
            title={<CardTitle title={t("cards.daily")} />}
            icon={TrendingUp}
          >
            <TrendChart data={trendData} loading={loading} configs={trendConfigs} />
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            title={<CardTitle title={t("cards.statusMix")} />}
            icon={PieIcon}
          >
            <StatusDonut
              data={[...(donutItems || [])]
                .filter((item) => Number(item.count) > 0)
                .sort((a, b) => Number(b.count) - Number(a.count))}
              loading={loading}
              label={tOrders("myOrders.orders")}
              config={{ key: "count", label: "name" }}
            />
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            title={<CardTitle title={t("cards.tags")} hint={t("cards.tagsHint")} />}
            icon={Tags}
          >
            <MiniTable columns={tagCols} data={payload.tags} loading={loading} />
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            title={<CardTitle title={t("cards.cancelCauses")} hint={t("cards.cancelCausesHint")} />}
            icon={Ban}
          >
            <MiniTable
              columns={causeCols}
              data={payload.cancelCauses}
              loading={loading}
            />
          </Card>
        </motion.div>
      </div>

    </div>
  );
}
