"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Calendar,
  Coins,
  Cpu,
  Download,
  Gift,
  Image as ImageIcon,
  Info,
  Loader2,
  MessageSquare,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import Table, { FilterField } from "@/components/atoms/Table";
import { TutorialSpotlight } from "@/components/atoms/TutorialSpotlight";
import { useTutorial } from "@/context/TutorialContext";
import { setDocumentTitle } from "@/utils/documentTitle";
import { useTrendLabelFormatter } from "@/hook/useTrendLabelFormatter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Card,
  MiniTable,
  PctBar,
  PRIMARY,
  StatusDonut,
  TableFilters,
  TrendChart,
} from "@/app/[locale]/reports/order-analysis/page";

const COLORS = [PRIMARY, "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];

function unwrap(res) {
  return res?.data ?? null;
}

function recordsOf(res) {
  const data = unwrap(res);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.records) ? data.records : [];
}

function formatUsd(value, locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number(value) || 0);
}

function formatInt(value, locale) {
  return new Intl.NumberFormat(locale).format(Number(value) || 0);
}

function pctDelta(current, previous) {
  if (previous == null || Number(previous) === 0) return null;
  return ((Number(current) - Number(previous)) / Number(previous)) * 100;
}

function GrantCard({ title, grant, t, formatIntFn }) {
  if (!grant) return null;
  const remaining = grant.unlimited ? t("unlimited") : formatIntFn(grant.remaining);
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-3">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <span>{t("credits.initial")}</span>
        <span className="text-end font-semibold tabular-nums text-slate-700 dark:text-slate-200">
          {grant.unlimited ? t("unlimited") : formatIntFn(grant.initial)}
        </span>
        <span>{t("credits.used")}</span>
        <span className="text-end font-semibold tabular-nums">{formatIntFn(grant.used)}</span>
        <span>{t("credits.remaining")}</span>
        <span className="text-end font-semibold tabular-nums">{remaining}</span>
        <span>{t("credits.expired")}</span>
        <span className="text-end font-semibold tabular-nums">{formatIntFn(grant.expired)}</span>
        <span>{t("credits.expiryDate")}</span>
        <span className="text-end font-semibold tabular-nums">{grant.expiryDate || "—"}</span>
      </div>
      <div>
        <p className="text-[11px] mb-1 text-slate-400">{t("credits.usagePercent")}</p>
        <PctBar value={grant.usagePercent || 0} />
      </div>
    </div>
  );
}

export default function AiReportsPage() {
  const tTutorial = useTranslations("tutorial.aiReports");
  const tPag = useTranslations("pagination");
  const t = useTranslations("aiReports");
  const locale = useLocale();
  const { toggleTutorialMode } = useTutorial();
  const { formatTrendLabel } = useTrendLabelFormatter();

  useEffect(() => {
    setDocumentTitle(t("title"));
  }, [t]);

  const [quickRange, setQuickRange] = useState("this_month");
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    agentId: "all",
    model: "all",
    mediaType: "all",
    status: "all",
    source: "all",
    billedBy: "all",
  });
  const [filterOptions, setFilterOptions] = useState({
    agents: [],
    models: [],
    mediaTypes: ["image", "video", "audio", "document"],
    statuses: ["completed", "failed", "processing"],
    sources: ["whatsapp_agent", "address_correction", "address_check", "media", "playground", "compaction"],
    billedBy: ["madar", "merchant"],
  });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [tokensOverTime, setTokensOverTime] = useState([]);
  const [costOverTime, setCostOverTime] = useState([]);
  const [mediaOverTime, setMediaOverTime] = useState([]);
  const [tokensByAgent, setTokensByAgent] = useState([]);
  const [tokensByModel, setTokensByModel] = useState([]);
  const [costByAgent, setCostByAgent] = useState([]);
  const [costByModel, setCostByModel] = useState([]);
  const [costByMedia, setCostByMedia] = useState([]);
  const [mediaSummary, setMediaSummary] = useState([]);
  // const [tools, setTools] = useState({ totals: null, groups: [], records: [] });
  const [customers, setCustomers] = useState([]);
  const [agentsPager, setAgentsPager] = useState({
    records: [],
    total_records: 0,
    current_page: 1,
    per_page: 10,
  });
  const [sessionsPager, setSessionsPager] = useState({
    records: [],
    total_records: 0,
    current_page: 1,
    per_page: 10,
  });
  const [sessionSearch, setSessionSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);
  const searchSkip = useRef(true);
  const agentsPageRef = useRef({ page: 1, per_page: 10 });
  const sessionsPageRef = useRef({ page: 1, per_page: 10 });
  const searchRef = useRef("");

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(sessionSearch), 350);
    return () => clearTimeout(searchTimer.current);
  }, [sessionSearch]);

  useEffect(() => {
    searchRef.current = debouncedSearch;
  }, [debouncedSearch]);

  const bucketLabel = useCallback(
    (key) => {
      if (!key) return "";
      if (String(key).length === 7) {
        const [y, m] = String(key).split("-");
        return formatTrendLabel(`${y}-${m}-01`);
      }
      return formatTrendLabel(key);
    },
    [formatTrendLabel],
  );

  const mediaLabel = useCallback(
    (kind) => {
      try {
        return t(`mediaTypes.${kind}`);
      } catch {
        return kind;
      }
    },
    [t],
  );

  const groupLabel = useCallback(
    (group) => {
      try {
        return t(`toolGroups.${group}`);
      } catch {
        return group;
      }
    },
    [t],
  );

  const billedByLabel = useCallback(
    (value) => {
      try {
        return t(`billedBy.${value}`);
      } catch {
        return value;
      }
    },
    [t],
  );

  const sourceLabel = useCallback(
    (value) => {
      try {
        return t(`sources.${value}`);
      } catch {
        return value;
      }
    },
    [t],
  );

  const statusLabel = useCallback(
    (status) => {
      try {
        return t(`statuses.${status}`);
      } catch {
        return status;
      }
    },
    [t],
  );

  const buildParams = useCallback(
    (extra = {}) => {
      const p = { ...extra };
      if (quickRange) p.range = quickRange;
      if (!quickRange && filters.startDate) p.startDate = filters.startDate;
      if (!quickRange && filters.endDate) p.endDate = filters.endDate;
      if (filters.agentId && filters.agentId !== "all") p.agentId = filters.agentId;
      if (filters.model && filters.model !== "all") p.model = filters.model;
      if (filters.mediaType && filters.mediaType !== "all") p.mediaType = filters.mediaType;
      if (filters.status && filters.status !== "all") p.status = filters.status;
      if (filters.source && filters.source !== "all") p.source = filters.source;
      if (filters.billedBy && filters.billedBy !== "all") p.billedBy = filters.billedBy;
      return p;
    },
    [quickRange, filters],
  );

  const fetchFilters = useCallback(async () => {
    try {
      const res = await api.get("/dashboard/ai/filters");
      const data = unwrap(res) || {};
      setFilterOptions({
        agents: Array.isArray(data.agents) ? data.agents : [],
        models: Array.isArray(data.models) ? data.models : [],
        mediaTypes: Array.isArray(data.mediaTypes) ? data.mediaTypes : ["image", "video", "audio", "document"],
        statuses: Array.isArray(data.statuses) ? data.statuses : ["completed", "failed", "processing"],
        sources: Array.isArray(data.sources) ? data.sources : [
          "whatsapp_agent",
          "address_correction",
          "address_check",
          "media",
          "playground",
          "compaction",
        ],
        billedBy: Array.isArray(data.billedBy) ? data.billedBy : ["madar", "merchant"],
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchAgents = useCallback(
    async (page = agentsPageRef.current.page, per_page = agentsPageRef.current.per_page) => {
      agentsPageRef.current = { page, per_page };
      const res = await api.get("/dashboard/ai/agents", {
        params: buildParams({ page, limit: per_page }),
      });
      const data = unwrap(res) || {};
      setAgentsPager({
        records: Array.isArray(data.records) ? data.records : [],
        total_records: data.total_records ?? 0,
        current_page: data.current_page ?? page,
        per_page: data.per_page ?? per_page,
      });
    },
    [buildParams],
  );

  // const fetchSessions = useCallback(
  //   async (
  //     page = sessionsPageRef.current.page,
  //     per_page = sessionsPageRef.current.per_page,
  //     search = debouncedSearch,
  //   ) => {
  //     sessionsPageRef.current = { page, per_page };
  //     const params = buildParams({ page, limit: per_page });
  //     if (search) params.search = search;
  //     const res = await api.get("/dashboard/ai/sessions", { params });
  //     const data = unwrap(res) || {};
  //     setSessionsPager({
  //       records: Array.isArray(data.records) ? data.records : [],
  //       total_records: data.total_records ?? 0,
  //       current_page: data.current_page ?? page,
  //       per_page: data.per_page ?? per_page,
  //     });
  //   },
  //   [buildParams, debouncedSearch],
  // );

  const fetchAll = useCallback(async () => {
    const p = buildParams({ compare: true });
    setLoading(true);
    try {
      const [
        overviewRes,
        tokensTimeRes,
        tokensAgentRes,
        tokensModelRes,
        costTimeRes,
        costAgentRes,
        costModelRes,
        costMediaRes,
        breakdownRes,
        mediaSumRes,
        mediaTimeRes,
        // toolsRes,
        customersRes,
      ] = await Promise.all([
        api.get("/dashboard/ai/overview", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/tokens/over-time", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/tokens/by-agent", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/tokens/by-model", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/cost/over-time", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/cost/by-agent", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/cost/by-model", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/cost/by-media-type", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/cost/breakdown", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/media/summary", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/media/over-time", { params: p }).catch(() => ({ data: null })),
        // api.get("/dashboard/ai/tools/summary", { params: p }).catch(() => ({ data: null })),
        api.get("/dashboard/ai/customers/top", { params: p }).catch(() => ({ data: null })),
      ]);

      const ov = unwrap(overviewRes);
      if (!ov) toast.error(t("error"));
      setOverview(ov);
      setBreakdown(unwrap(breakdownRes));

      setTokensOverTime(
        (unwrap(tokensTimeRes)?.buckets || []).map((b) => ({ ...b, label: bucketLabel(b.key) })),
      );
      setCostOverTime(
        (unwrap(costTimeRes)?.buckets || []).map((b) => ({ ...b, label: bucketLabel(b.key) })),
      );
      setMediaOverTime(
        (unwrap(mediaTimeRes)?.buckets || []).map((b) => ({ ...b, label: bucketLabel(b.key) })),
      );
      setTokensByAgent(
        recordsOf(tokensAgentRes).map((r) => ({ ...r, label: r.agentName })),
      );
      setTokensByModel(
        recordsOf(tokensModelRes).map((r) => ({ ...r, label: r.label || r.model })),
      );
      setCostByAgent(
        recordsOf(costAgentRes).map((r) => ({ ...r, label: r.agentName })),
      );
      setCostByModel(
        recordsOf(costModelRes).map((r) => ({ ...r, label: r.label || r.model })),
      );
      setCostByMedia(
        recordsOf(costMediaRes).map((r) => ({ ...r, label: mediaLabel(r.mediaType) })),
      );
      setMediaSummary(recordsOf(mediaSumRes));
      // const toolsData = unwrap(toolsRes) || {};
      // setTools({
      //   totals: toolsData.totals || null,
      //   groups: Array.isArray(toolsData.groups) ? toolsData.groups : [],
      //   records: Array.isArray(toolsData.records) ? toolsData.records : [],
      // });
      setCustomers(recordsOf(customersRes));

      await Promise.all([
        fetchAgents(1, agentsPageRef.current.per_page),
        // fetchSessions(1, sessionsPageRef.current.per_page, searchRef.current),
      ]);
    } catch (e) {
      console.error(e);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [buildParams, bucketLabel, mediaLabel, t, fetchAgents]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchAll();
  }, [quickRange]);

  // useEffect(() => {
  //   if (searchSkip.current) {
  //     searchSkip.current = false;
  //     return;
  //   }
  //   fetchSessions(1, sessionsPageRef.current.per_page, debouncedSearch);
  // }, [debouncedSearch, fetchSessions]);

  const withDelta = useCallback(
    (current, previous, formatted) => {
      const d = pctDelta(current, previous);
      if (d == null) return formatted;
      const sign = d > 0 ? "+" : "";
      return `${formatted} · ${t("vsPrevious", { sign, value: Math.abs(d).toFixed(1) })}`;
    },
    [t],
  );

  const statsCards = useMemo(() => {
    const totals = overview?.totals || {};
    const prev = overview?.previous || {};
    return [
      {
        id: 8,
        name: t("kpi.paidBalance"),
        description: tTutorial("kpi.paidBalance.description"),
        example: tTutorial("kpi.paidBalance.example"),
        value: formatUsd(overview?.aiBalance, locale),
        icon: Wallet,
        color: "#059669",
        sortOrder: 0,
      },
      {
        id: 1,
        name: t("kpi.cost"),
        description: tTutorial("kpi.cost.description"),
        example: tTutorial("kpi.cost.example"),
        value: withDelta(totals.cost, prev.cost, formatUsd(totals.cost, locale)),
        icon: Coins,
        color: PRIMARY,
        sortOrder: 1,
      },
      {
        id: 2,
        name: t("kpi.tokens"),
        description: tTutorial("kpi.tokens.description"),
        example: tTutorial("kpi.tokens.example"),
        value: withDelta(
          totals.tokens,
          prev.tokens,
          `${formatInt(totals.tokens, locale)} (${t("kpi.inputTokens")} ${formatInt(totals.inputTokens, locale)} · ${t("kpi.outputTokens")} ${formatInt(totals.outputTokens, locale)})`,
        ),
        icon: Cpu,
        color: "#3b82f6",
        sortOrder: 2,
      },
      // {
      //   id: 3,
      //   name: t("kpi.sessions"),
      //   description: tTutorial("kpi.sessions.description"),
      //   example: tTutorial("kpi.sessions.example"),
      //   value: withDelta(totals.sessions, prev.sessions, formatInt(totals.sessions, locale)),
      //   icon: MessageSquare,
      //   color: "#10b981",
      //   sortOrder: 3,
      // },
      {
        id: 4,
        name: t("kpi.agents"),
        description: tTutorial("kpi.agents.description"),
        example: tTutorial("kpi.agents.example"),
        value: formatInt(totals.agents, locale),
        icon: Bot,
        color: "#8b5cf6",
        sortOrder: 4,
      },
      {
        id: 5,
        name: t("kpi.media"),
        description: tTutorial("kpi.media.description"),
        example: tTutorial("kpi.media.example"),
        value: formatInt(totals.media, locale),
        icon: ImageIcon,
        color: "#f59e0b",
        sortOrder: 5,
      },
      {
        id: 6,
        name: t("kpi.todayCost"),
        description: tTutorial("kpi.todayCost.description"),
        example: tTutorial("kpi.todayCost.example"),
        value: `${formatUsd(overview?.today?.cost, locale)} · ${formatInt(overview?.today?.tokens, locale)}`,
        icon: TrendingUp,
        color: "#0ea5e9",
        sortOrder: 6,
      },
      {
        id: 7,
        name: t("kpi.monthCost"),
        description: tTutorial("kpi.monthCost.description"),
        example: tTutorial("kpi.monthCost.example"),
        value: `${formatUsd(overview?.month?.cost, locale)} · ${formatInt(overview?.month?.tokens, locale)}`,
        icon: Wallet,
        color: "#14b8a6",
        sortOrder: 7,
      },
      
    ];
  }, [overview, locale, t, tTutorial, withDelta]);

  const breakdownRows = useMemo(() => {
    if (!breakdown) return [];
    const keys = [
      "total",
      "today",
      "month",
      "inputCost",
      "outputCost",
      "transcriptionCost",
      "estimated",
      "actual",
      "freeValue",
      "paidValue",
    ];
    return keys.map((key) => ({
      metric: t(`breakdown.${key}`),
      value: formatUsd(breakdown[key], locale),
    }));
  }, [breakdown, t, locale]);

  const QUICK_RANGES = [
    { id: "today", label: t("ranges.today") },
    { id: "yesterday", label: t("ranges.yesterday") },
    { id: "this_week", label: t("ranges.this_week") },
    { id: "last_week", label: t("ranges.last_week") },
    { id: "this_month", label: t("ranges.this_month") },
    { id: "last_month", label: t("ranges.last_month") },
    { id: "this_year", label: t("ranges.this_year") },
  ];

  const hasActiveFilters = Boolean(
    filters.startDate ||
      filters.endDate ||
      (filters.agentId && filters.agentId !== "all") ||
      (filters.model && filters.model !== "all") ||
      (filters.mediaType && filters.mediaType !== "all") ||
      (filters.status && filters.status !== "all") ||
      (filters.source && filters.source !== "all") ||
      (filters.billedBy && filters.billedBy !== "all"),
  );

  const handleExport = useCallback(async () => {
    const id = toast.loading(t("exporting"));
    try {
      setExportLoading(true);
      const params = buildParams();
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get("/dashboard/ai/sessions/export", {
        params,
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8" }));
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `ai-sessions-${new Date().toISOString().split("T")[0]}.csv`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"), { id });
    } catch (e) {
      toast.error(t("exportFailed"), { id });
    } finally {
      setExportLoading(false);
    }
  }, [buildParams, debouncedSearch, t]);

  const agentColumns = useMemo(
    () => [
      { key: "agentName", header: t("agents.agent") },
      { key: "sessions", header: t("agents.sessions"), cell: (row) => formatInt(row.sessions, locale) },
      { key: "messages", header: t("agents.messages"), cell: (row) => formatInt(row.messages, locale) },
      { key: "tokens", header: t("agents.tokens"), cell: (row) => formatInt(row.tokens, locale) },
      { key: "cost", header: t("agents.cost"), cell: (row) => formatUsd(row.cost, locale) },
      { key: "avgTokensPerSession", header: t("agents.avgTokens"), cell: (row) => formatInt(row.avgTokensPerSession, locale) },
      { key: "avgCostPerSession", header: t("agents.avgCost"), cell: (row) => formatUsd(row.avgCostPerSession, locale) },
      { key: "topModel", header: t("agents.topModel"), cell: (row) => row.topModel || "—" },
      { key: "todayTokens", header: t("agents.todayTokens"), cell: (row) => formatInt(row.todayTokens, locale) },
      { key: "monthTokens", header: t("agents.monthTokens"), cell: (row) => formatInt(row.monthTokens, locale) },
      { key: "media", header: t("agents.media"), cell: (row) => formatInt(row.media, locale) },
    ],
    [t, locale],
  );

  const sessionColumns = useMemo(
    () => [
      {
        key: "date",
        header: t("sessions.date"),
        cell: (row) =>
          row.date
            ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.date))
            : "—",
      },
      { key: "agentName", header: t("sessions.agent") },
      { key: "customer", header: t("sessions.customer"), cell: (row) => row.customer || "—" },
      { key: "phone", header: t("sessions.phone"), cell: (row) => row.phone || "—" },
      { key: "model", header: t("sessions.model"), cell: (row) => row.model || "—" },
      { key: "input", header: t("sessions.input"), cell: (row) => formatInt(row.input, locale) },
      { key: "output", header: t("sessions.output"), cell: (row) => formatInt(row.output, locale) },
      { key: "total", header: t("sessions.total"), cell: (row) => formatInt(row.total, locale) },
      { key: "cost", header: t("sessions.cost"), cell: (row) => formatUsd(row.cost, locale) },
      {
        key: "durationSecs",
        header: t("sessions.duration"),
        cell: (row) => {
          const s = Number(row.durationSecs) || 0;
          const m = Math.floor(s / 60);
          const sec = String(s % 60).padStart(2, "0");
          return `${m}:${sec}`;
        },
      },
      { key: "media", header: t("sessions.media"), cell: (row) => formatInt(row.media, locale) },
      { key: "status", header: t("sessions.status"), cell: (row) => statusLabel(row.status) },
    ],
    [t, locale, statusLabel],
  );

  return (
    <div className="min-h-screen p-5 space-y-5">
      <PageHeader
        itemsCompact={false}
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.title") },
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
        statsLoading={loading}
        stats={statsCards}
        items={QUICK_RANGES}
        active={quickRange}
        setActive={(v) => {
          setQuickRange(v);
          setFilters((f) => ({ ...f, startDate: null, endDate: null }));
        }}
      />

      <TableFilters onApply={fetchAll} onRefresh={fetchAll} applyLabel={t("apply")}>
        <FilterField label={t("filters.dateRange")} icon={Calendar}>
          <DateRangePicker
            value={{ startDate: filters.startDate, endDate: filters.endDate }}
            onChange={(newDates) => {
              setFilters((f) => ({ ...f, ...newDates }));
              setQuickRange(null);
            }}
            placeholder={t("filters.dateRangePlaceholder")}
            dataSize="default"
            maxDate="today"
          />
        </FilterField>
        <FilterField label={t("filters.agent")}>
          <Select value={filters.agentId} onValueChange={(v) => setFilters((f) => ({ ...f, agentId: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {filterOptions.agents.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label={t("filters.model")}>
          <Select value={filters.model} onValueChange={(v) => setFilters((f) => ({ ...f, model: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {filterOptions.models.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label={t("filters.mediaType")}>
          <Select value={filters.mediaType} onValueChange={(v) => setFilters((f) => ({ ...f, mediaType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {filterOptions.mediaTypes.map((kind) => (
                <SelectItem key={kind} value={kind}>{mediaLabel(kind)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label={t("filters.status")}>
          <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {filterOptions.statuses.map((s) => (
                <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label={t("filters.source")}>
          <Select value={filters.source} onValueChange={(v) => setFilters((f) => ({ ...f, source: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {(filterOptions.sources || []).map((s) => (
                <SelectItem key={s} value={s}>{sourceLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label={t("filters.billedBy")}>
          <Select value={filters.billedBy} onValueChange={(v) => setFilters((f) => ({ ...f, billedBy: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {(filterOptions.billedBy || []).map((s) => (
                <SelectItem key={s} value={s}>{billedByLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </TableFilters>

      <TutorialSpotlight
        title={t("credits.title")}
        description={tTutorial("credits.description")}
        example={tTutorial("credits.example")}
        overview
      >
        <Card title={t("credits.title")} icon={Gift} color="#10b981">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GrantCard
              title={t("credits.aiDecision")}
              grant={overview?.free?.aiDecision}
              t={t}
              formatIntFn={(n) => formatInt(n, locale)}
            />
            <GrantCard
              title={t("credits.aiMedia")}
              grant={overview?.free?.aiMedia}
              t={t}
              formatIntFn={(n) => formatInt(n, locale)}
            />
          </div>
        </Card>
      </TutorialSpotlight>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TutorialSpotlight
          title={t("charts.tokensOverTime")}
          description={tTutorial("charts.tokensOverTime.description")}
          example={tTutorial("charts.tokensOverTime.example")}
          overview
        >
          <Card title={t("charts.tokensOverTime")} icon={TrendingUp} color={PRIMARY}>
            <TrendChart
              data={tokensOverTime}
              loading={loading}
              configs={[
                { key: "input", label: t("charts.input"), color: "#6366f1", fillOpacity: 0.1 },
                { key: "output", label: t("charts.output"), color: "#10b981", fillOpacity: 0.08 },
              ]}
            />
          </Card>
        </TutorialSpotlight>
        <TutorialSpotlight
          title={t("charts.costOverTime")}
          description={tTutorial("charts.costOverTime.description")}
          example={tTutorial("charts.costOverTime.example")}
          overview
        >
          <Card title={t("charts.costOverTime")} icon={Coins} color="#f59e0b">
            <TrendChart
              data={costOverTime}
              loading={loading}
              configs={[
                { key: "cost", label: t("charts.cost"), color: "#f59e0b", fillOpacity: 0.1 },
                { key: "estimated", label: t("charts.estimated"), color: "#94a3b8", fillOpacity: 0.05 },
              ]}
            />
          </Card>
        </TutorialSpotlight>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TutorialSpotlight
          title={t("charts.tokensByAgent")}
          description={tTutorial("charts.tokensByAgent.description")}
          example={tTutorial("charts.tokensByAgent.example")}
          overview
        >
          <Card title={t("charts.tokensByAgent")} icon={Bot} color={PRIMARY}>
            <BarChart
              data={tokensByAgent}
              loading={loading}
              configs={[
                { key: "input", label: t("charts.input"), color: "#6366f1" },
                { key: "output", label: t("charts.output"), color: "#10b981" },
              ]}
            />
          </Card>
        </TutorialSpotlight>
        <TutorialSpotlight
          title={t("charts.tokensByModel")}
          description={tTutorial("charts.tokensByModel.description")}
          example={tTutorial("charts.tokensByModel.example")}
          overview
        >
          <Card title={t("charts.tokensByModel")} icon={Cpu} color="#3b82f6">
            <BarChart
              data={tokensByModel}
              loading={loading}
              configs={[{ key: "tokens", label: t("kpi.tokens"), color: "#3b82f6" }]}
            />
          </Card>
        </TutorialSpotlight>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TutorialSpotlight
          title={t("charts.costByAgent")}
          description={tTutorial("charts.costByAgent.description")}
          example={tTutorial("charts.costByAgent.example")}
          overview
        >
          <Card title={t("charts.costByAgent")} icon={Bot} color="#8b5cf6">
            <BarChart
              data={costByAgent}
              loading={loading}
              configs={[{ key: "cost", label: t("charts.cost"), color: "#8b5cf6" }]}
            />
          </Card>
        </TutorialSpotlight>
        <TutorialSpotlight
          title={t("charts.costByModel")}
          description={tTutorial("charts.costByModel.description")}
          example={tTutorial("charts.costByModel.example")}
          overview
        >
          <Card title={t("charts.costByModel")} icon={Cpu} color="#0ea5e9">
            <BarChart
              data={costByModel}
              loading={loading}
              configs={[{ key: "cost", label: t("charts.cost"), color: "#0ea5e9" }]}
            />
          </Card>
        </TutorialSpotlight>
        <TutorialSpotlight
          title={t("charts.costByMedia")}
          description={tTutorial("charts.costByMedia.description")}
          example={tTutorial("charts.costByMedia.example")}
          overview
        >
          <Card title={t("charts.costByMedia")} icon={ImageIcon} color="#ef4444">
            <StatusDonut
              showLabels={false}
              data={costByMedia.map((r, i) => ({
                label: r.label,
                count: r.cost,
                color: COLORS[i % COLORS.length],
              }))}
              loading={loading}
              config={{
                key: "count",
                label: "label",
                centerValue: formatUsd(
                  costByMedia.reduce((sum, r) => sum + (Number(r.cost) || 0), 0),
                  locale,
                ),
                centerLabel: t("usd"),
              }}
            />
          </Card>
        </TutorialSpotlight>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div className="lg:col-span-2">
          <TutorialSpotlight
            title={t("charts.mediaOverTime")}
            description={tTutorial("charts.mediaOverTime.description")}
            example={tTutorial("charts.mediaOverTime.example")}
            overview
          >
            <Card title={t("charts.mediaOverTime")} icon={ImageIcon} color="#f59e0b">
              <TrendChart
                data={mediaOverTime}
                loading={loading}
                configs={[{ key: "count", label: t("charts.count"), color: "#f59e0b", fillOpacity: 0.12 }]}
              />
            </Card>
          </TutorialSpotlight>
        </motion.div>
        <TutorialSpotlight
          title={t("charts.mediaMix")}
          description={tTutorial("charts.mediaOverTime.description")}
          example={tTutorial("charts.mediaOverTime.example")}
          overview
        >
          <Card title={t("charts.mediaMix")} icon={ImageIcon} color={PRIMARY}>
            <StatusDonut
              showLabels={false}
              data={mediaSummary.map((r, i) => ({
                label: mediaLabel(r.kind),
                count: r.count,
                color: COLORS[i % COLORS.length],
              }))}
              loading={loading}
              config={{ key: "count", label: "label" }}
            />
          </Card>
        </TutorialSpotlight>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TutorialSpotlight
          title={t("breakdown.title")}
          description={tTutorial("tables.breakdown.description")}
          example={tTutorial("tables.breakdown.example")}
          overview
        >
          <Card title={t("breakdown.title")} icon={Wallet} color={PRIMARY}>
            <MiniTable
              loading={loading}
              columns={[
                { key: "metric", header: t("breakdown.title") },
                { key: "value", header: t("usd") },
              ]}
              data={breakdownRows}
            />
          </Card>
        </TutorialSpotlight>
        <TutorialSpotlight
          title={t("media.title")}
          description={tTutorial("charts.costByMedia.description")}
          example={tTutorial("charts.costByMedia.example")}
          overview
        >
          <Card title={t("media.title")} icon={ImageIcon} color="#10b981">
            <MiniTable
              loading={loading}
              columns={[
                { key: "kind", header: t("media.kind"), cell: (row) => mediaLabel(row.kind) },
                { key: "count", header: t("media.count"), cell: (row) => formatInt(row.count, locale) },
                { key: "tokens", header: t("media.tokens"), cell: (row) => formatInt(row.tokens, locale) },
                { key: "cost", header: t("media.cost"), cell: (row) => formatUsd(row.cost, locale) },
                { key: "topModel", header: t("media.topModel"), cell: (row) => row.topModel || "—" },
              ]}
              data={mediaSummary}
            />
          </Card>
        </TutorialSpotlight>
      </div>

      {/* <TutorialSpotlight
        title={t("tools.totalsTitle")}
        description={tTutorial("tables.tools.description")}
        example={tTutorial("tables.tools.example")}
        overview
      >
        <Card title={t("tools.totalsTitle")} icon={Wrench} color="#6366f1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: t("tools.calls"), value: formatInt(tools.totals?.calls, locale) },
              { label: t("tools.topTool"), value: tools.totals?.topTool || "—" },
              { label: t("tools.avgTokensPerCall"), value: formatInt(tools.totals?.avgTokensPerCall, locale) },
              { label: t("tools.errorRate"), value: `${Number(tools.totals?.errorRate || 0).toFixed(2)}%` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                <p className="text-[11px] text-slate-400 mb-1">{item.label}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <BarChart
              data={tools.groups.map((g) => ({ ...g, label: groupLabel(g.group) }))}
              loading={loading}
              configs={[{ key: "calls", label: t("charts.calls"), color: "#6366f1" }]}
            />
            <MiniTable
              loading={loading}
              columns={[
                { key: "label", header: t("tools.label") },
                { key: "group", header: t("tools.group"), cell: (row) => groupLabel(row.group) },
                { key: "calls", header: t("tools.calls"), cell: (row) => formatInt(row.calls, locale) },
                { key: "share", header: t("tools.share"), cell: (row) => `${Number(row.share || 0).toFixed(1)}%` },
                { key: "input", header: t("tools.input"), cell: (row) => formatInt(row.input, locale) },
                { key: "output", header: t("tools.output"), cell: (row) => formatInt(row.output, locale) },
                { key: "total", header: t("tools.total"), cell: (row) => formatInt(row.total, locale) },
                { key: "errors", header: t("tools.errors"), cell: (row) => formatInt(row.errors, locale) },
                { key: "cost", header: t("tools.cost"), cell: (row) => formatUsd(row.cost, locale) },
              ]}
              data={tools.records}
            />
          </div>
        </Card>
      </TutorialSpotlight> */}

      <TutorialSpotlight
        title={t("agents.title")}
        description={tTutorial("tables.agents.description")}
        example={tTutorial("tables.agents.example")}
        overview
      >
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 px-1">{t("agents.title")}</h3>
          <Table
            tableKey="report-ai-agents"
            hasSearch={false}
            showColumnVisibility
            labels={{
              total: tPag("records"),
              limit: tPag("perPage"),
              emptyTitle: t("empty"),
            }}
            columns={agentColumns}
            data={agentsPager.records}
            isLoading={loading}
            pagination={{
              total_records: agentsPager.total_records,
              current_page: agentsPager.current_page,
              per_page: agentsPager.per_page,
            }}
            onPageChange={({ page, per_page }) => fetchAgents(page, per_page)}
          />
        </div>
      </TutorialSpotlight>

      <TutorialSpotlight
        title={t("customers.title")}
        description={tTutorial("tables.customers.description")}
        example={tTutorial("tables.customers.example")}
        overview
      >
        <Card title={t("customers.title")} icon={Users} color="#0ea5e9">
          <MiniTable
            loading={loading}
            columns={[
              { key: "customer", header: t("customers.customer") },
              { key: "phone", header: t("customers.phone"), cell: (row) => row.phone || "—" },
              { key: "sessions", header: t("customers.sessions"), cell: (row) => formatInt(row.sessions, locale) },
              { key: "tokens", header: t("customers.tokens"), cell: (row) => formatInt(row.tokens, locale) },
              { key: "cost", header: t("customers.cost"), cell: (row) => formatUsd(row.cost, locale) },
            ]}
            data={customers}
          />
        </Card>
      </TutorialSpotlight>

      {/* <TutorialSpotlight
        title={t("sessions.title")}
        description={tTutorial("tables.sessions.description")}
        example={tTutorial("tables.sessions.example")}
        overview
      >
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 px-1">{t("sessions.title")}</h3>
          <Table
            tableKey="report-ai-sessions"
            searchValue={sessionSearch}
            onSearchChange={setSessionSearch}
            hasSearch
            hasActiveFilters={hasActiveFilters}
            showColumnVisibility
            labels={{
              searchPlaceholder: t("filters.searchSessions"),
              total: tPag("records"),
              limit: tPag("perPage"),
              emptyTitle: t("empty"),
            }}
            actions={[
              {
                key: "export",
                label: t("exportSessions"),
                icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />,
                color: "primary",
                onClick: handleExport,
                disabled: exportLoading,
              },
            ]}
            columns={sessionColumns}
            data={sessionsPager.records}
            isLoading={loading}
            pagination={{
              total_records: sessionsPager.total_records,
              current_page: sessionsPager.current_page,
              per_page: sessionsPager.per_page,
            }}
            onPageChange={({ page, per_page }) => fetchSessions(page, per_page, debouncedSearch)}
          />
        </div>
      </TutorialSpotlight> */}
    </div>
  );
}
