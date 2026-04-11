"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  BarChart3,
  Calendar,
  Store,
  ShoppingCart,
  PieChart as PieIcon,
  DollarSign,
  Briefcase,
  Activity,
  Percent,
  RotateCcw,
  CreditCard,
  Info,
  Filter,
} from "lucide-react";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/atoms/Pageheader";
import { useTranslations } from "next-intl";
import {
  Card,
  ExportBtn,
  fmt,
  MiniTable,
  pct,
  PctBar,
  TableFilters,
  TrendChart,
  StatusDonut,
  PRIMARY,
  SECONDARY,
  THIRD,
} from "../reports/order-analysis/page";
import { useDebounce } from "@/hook/useDebounce";
import toast from "react-hot-toast";
import Button_ from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import DateRangePicker from "@/components/atoms/DateRangePicker";

// ── FilterField wrapper (matches the one in OrdersStatisticsPage) ─────────────

function FilterField({ label, icon: FieldIcon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {FieldIcon && <FieldIcon size={10} className="text-orange-400" />}
        {label}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const tDates = useTranslations("orderAnalysis");
  const t = useTranslations("dashboard");

  const [quickRange, setQuickRange] = useState("this_month");
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    storeId: "all",
    search: "",
  });
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exProds, setExProds] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { debouncedValue: debouncedSearch } = useDebounce({
    value: searchValue,
    delay: 300,
  });

  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [profitTableData, setProfitTableData] = useState([]);

  // ── Build query params ──────────────────────────────────────────────────────

  const buildParams = useCallback(() => {
    const p = { range: quickRange, search: debouncedSearch };
    if (filters.startDate) p.startDate = filters.startDate;
    if (filters.endDate) p.endDate = filters.endDate;
    if (filters.storeId && filters.storeId !== "all")
      p.storeId = filters.storeId;
    return p;
  }, [quickRange, debouncedSearch, filters]);

  // ── Fetch all data ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    const p = buildParams();
    setLoading(true);
    try {
      const [sum, trd, sts, prf] = await Promise.all([
        api
          .get("/dashboard/summary", { params: p })
          .catch(() => ({ data: null })),
        api.get("/dashboard/trend", { params: p }).catch(() => ({ data: [] })),
        api
          .get("/dashboard/top-products", { params: p })
          .catch(() => ({ data: [] })),
        api
          .get("/dashboard/profit-report", { params: p })
          .catch(() => ({ data: [] })),
      ]);
      const getData = (r) =>
        Array.isArray(r.data) ? r.data : (r.data?.records ?? []);
      setSummary(sum.data);
      setTrendData(getData(trd));
      setTopProductsData(getData(sts));
      setProfitTableData(getData(prf));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    api
      .get("/lookups/stores", { params: { limit: 200, isActive: true } })
      .then(({ data }) =>
        setStores(Array.isArray(data) ? data : (data?.records ?? [])),
      )
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [quickRange, debouncedSearch]);

  // ── KPI config ──────────────────────────────────────────────────────────────

  const KPI_CONFIG = [
    {
      key: "totalSales",
      title: t("kpi.totalSales"),
      icon: TrendingUp,
      color: "#6366f1",
    },
    {
      key: "costOfGoods",
      title: t("kpi.costOfGoods"),
      icon: Briefcase,
      color: "#f59e0b",
    },
    {
      key: "totalProfit",
      title: t("kpi.totalProfit"),
      icon: DollarSign,
      color: "#8b5cf6",
    },
    {
      key: "profitMargin",
      title: t("kpi.profitMargin"),
      icon: Percent,
      color: "#06b6d4",
      pct: true,
    },
    {
      key: "confirmRate",
      title: t("kpi.confirmRate"),
      icon: CheckCircle,
      color: "#3b82f6",
      pct: true,
    },
    {
      key: "deliveryRate",
      title: t("kpi.deliveryRate"),
      icon: Truck,
      color: "#10b981",
      pct: true,
    },
    {
      key: "cancelled",
      title: t("kpi.cancelled"),
      icon: XCircle,
      color: "#ef4444",
      pct: true,
    },
    {
      key: "returned",
      title: t("kpi.returned"),
      icon: RotateCcw,
      color: "#607D8B",
      pct: true,
    },
    {
      key: "inDelivery",
      title: t("kpi.inDelivery"),
      icon: Activity,
      color: "#f97316",
    },
    {
      key: "newOrders",
      title: t("kpi.newOrders"),
      icon: ShoppingCart,
      color: "#ec4899",
    },
    {
      key: "totalOrders",
      title: t("kpi.totalOrders"),
      icon: BarChart3,
      color: "#475569",
    },
    {
      key: "totalCollected",
      title: t("kpi.totalCollected"),
      icon: CreditCard,
      color: "#0ea5e9",
    },
  ];

  const orderConfigs = [
    {
      key: "orders",
      label: t("chart.ordersCount"),
      color: SECONDARY,
      fillOpacity: 0.1,
    },
    {
      key: "sales",
      label: t("chart.sales"),
      color: THIRD,
      fillOpacity: 0.05,
      yAxisID: "y1",
    },
  ];

  const statsData = useMemo(
    () =>
      KPI_CONFIG.map((card, i) => ({
        id: card.key,
        name: card.title,
        value:
          summary?.[card.key] == null
            ? "0"
            : card.pct
              ? pct(summary[card.key])
              : fmt(summary[card.key]),
        icon: card.icon,
        color: card.color,
        sortOrder: i,
      })),
    [summary],
  );

  // ── Profit table columns ────────────────────────────────────────────────────

  const profitCols = [
    {
      key: "period",
      header: t("profitTable.columns.period"),
      cell: (r) => (
        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
          {r.period ?? "—"}
        </span>
      ),
    },
    {
      key: "sales",
      header: t("profitTable.columns.totalSales"),
      cell: (r) => (
        <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {fmt(r.sales)}
        </span>
      ),
    },
    {
      key: "costs",
      header: t("profitTable.columns.costs"),
      cell: (r) => (
        <span className="font-semibold text-red-500 dark:text-red-400 tabular-nums">
          {fmt(r.costs)}
        </span>
      ),
    },
    {
      key: "profit",
      header: t("profitTable.columns.totalProfit"),
      cell: (r) => {
        const positive = (Number(r.profit) || 0) >= 0;
        return (
          <span
            className={cn(
              "font-bold tabular-nums",
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400",
            )}
          >
            {fmt(r.profit)}
          </span>
        );
      },
    },
    {
      key: "margin",
      header: t("profitTable.columns.profitMargin"),
      cell: (r) => <PctBar value={r.margin} color="#8b5cf6" />,
    },
  ];

  // ── Export ──────────────────────────────────────────────────────────────────

  const doExport = async (endpoint, setL, name) => {
    setL(true);
    const id = toast.loading(t("export.exporting"));
    try {
      const res = await api.get(endpoint, {
        params: buildParams(),
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `${name}_${Date.now()}.xlsx`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("export.success"), { id });
    } catch (err) {
      toast.error(t("export.failed"), { id });
    } finally {
      setL(false);
    }
  };

  const QUICK_RANGES = [
    { id: "today", label: tDates("ranges.today") },
    { id: "yesterday", label: tDates("ranges.yesterday") },
    { id: "this_week", label: tDates("ranges.this_week") },
    { id: "last_week", label: tDates("ranges.last_week") },
    { id: "this_month", label: tDates("ranges.this_month") },
    { id: "last_month", label: tDates("ranges.last_month") },
    { id: "this_year", label: tDates("ranges.this_year") },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 md:p-5 cards-space">
      {/* Page header */}
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/" },
          { name: t("breadcrumb.dashboard") },
        ]}
        buttons={
          <Button_
            size="sm"
            label={t("actions.howToUse")}
            variant="ghost"
            icon={<Info size={18} />}
          />
        }
        stats={statsData}
        items={QUICK_RANGES}
        active={quickRange}
        setActive={(v) => {
          setQuickRange(v)
          setFilters(p => ({ ...p, startDate: null, endDate: null }))
        }}
      />

      {/* Filters */}
      <TableFilters
        onApply={fetchAll}
        onRefresh={fetchAll}
        applyLabel={t("filters.apply")}
      >
        {/* Date range */}
        <FilterField label={t("filters.dateRange")} icon={Calendar}>
          <DateRangePicker
            value={{ startDate: filters.startDate, endDate: filters.endDate }}
            onChange={(newDates) => {
              setFilters(f => ({ ...f, ...newDates }))
              setQuickRange(null)
            }}
          />
        </FilterField>

        {/* Store */}
        <FilterField label={t("filters.store")} icon={Store}>
          <Select
            value={filters.storeId}
            onValueChange={(v) => setFilters((f) => ({ ...f, storeId: v }))}
          >
            <SelectTrigger className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800">
              <SelectValue placeholder={t("filters.allStores")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStores")}</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </TableFilters>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Card
            title={t("charts.generalReports")}
            icon={TrendingUp}
            color={PRIMARY}
          >
            <TrendChart
              data={trendData}
              loading={loading}
              configs={orderConfigs}
            />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card title={t("charts.topProducts")} icon={PieIcon} color={PRIMARY}>
            <StatusDonut
              data={topProductsData}
              loading={loading}
              config={{
                key: "count",
                imageKey: "image",
                label: "name",
                hasPercentage: true,
              }}
              allowImage={true}
            />
          </Card>
        </motion.div>
      </div>

      {/* Profit table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card
          title={t("profitTable.title")}
          icon={DollarSign}
          color="#10b981"
          action={
            <ExportBtn
              loading={exProds}
              onClick={() =>
                doExport(
                  "/dashboard/profit-report/export",
                  setExProds,
                  "profit_report",
                )
              }
            />
          }
        >
          <MiniTable
            columns={profitCols}
            data={profitTableData}
            loading={loading}
          />
        </Card>
      </motion.div>
    </div>
  );
}
