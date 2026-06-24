"use client";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Download,
  TrendingUp,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
  BarChart3,
  Calendar,
  Store,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  PieChart as PieIcon,
  Search,
  Filter,
  PieChart,
  Info,
  FileDown,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import api from "@/utils/api";
import Flatpickr from "react-flatpickr";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip as ChTooltip,
  Legend,
  Filler,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import {  useTranslations, useLocale } from "next-intl";
import { avatarSrc } from "@/components/atoms/UserSelect";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import StoreFilter from "@/components/atoms/StoreFilter";
import { useTrendLabelFormatter } from "@/hook/useTrendLabelFormatter";
import MultiSelect from "@/components/atoms/MultiSelect";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import UserSelect from "@/components/atoms/UserSelect";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  ChTooltip,
  Legend,
  Filler,
  BarElement, 
  Title, 
  Tooltip,
);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMARY = "#6763AF";
export const SECONDARY = "#5750a0";
export const THIRD = "#7672B9";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const fmt = (n) => (n == null ? "—" : Number(n));
export const pct = (n) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);
export const hex = (h, a = 0.12) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return r
    ? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${a})`
    : "transparent";
};

// ─────────────────────────────────────────────────────────────────────────────
// Card — elevated container with accent left-bar + icon
// ─────────────────────────────────────────────────────────────────────────────

export function Card({
  title,
  icon: Icon,
  color = PRIMARY,
  action,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        "main-card",
        className,
      )}
    >

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: hex(color, 0.1),
              border: `1.5px solid ${hex(color, 0.25)}`,
            }}
          >
            <Icon size={15} style={{ color }} />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">
            {title}
          </h3>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Divider */}
      <div className="h-px mx-5 bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-800 to-transparent" />

      {/* Body */}
      <div className="pt-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Button
// ─────────────────────────────────────────────────────────────────────────────
export function ExportBtn({ onClick, loading }) {
  const t = useTranslations("dashboard");

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      type="button"
      disabled={loading}
      className={cn(
        "btn btn-solid btn-sm",
        "disabled:opacity-50 disabled:cursor-not-allowed gap-1.5"
      )}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileDown size={14} />
      )}
      {t("common.export")}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RangeTabs — pill tabs with gradient active state
// ─────────────────────────────────────────────────────────────────────────────

export function RangeTabs({ value, onChange }) {
  const t = useTranslations("orderAnalysis");

  const QUICK_RANGES = [
    { key: "today", label: t("ranges.today") },
    { key: "yesterday", label: t("ranges.yesterday") },
    { key: "this_week", label: t("ranges.this_week") },
    { key: "last_week", label: t("ranges.last_week") },
    { key: "this_month", label: t("ranges.this_month") },
    { key: "last_month", label: t("ranges.last_month") },
    { key: "this_year", label: t("ranges.this_year") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-5">
      {QUICK_RANGES.map((r) => {
        const isActive = value === r.key;
        return (
          <motion.button
            key={r.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(r.key)}
            className={cn(
              "relative px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-250 whitespace-nowrap overflow-hidden",
              isActive
                ? "text-white shadow-md"
                : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-200",
            )}
            style={
              isActive
                ? {
                  background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
                  boxShadow: `0 4px 14px rgb(var(--primary-shadow))`,
                }
                : {}
            }
          >
            {isActive && (
              <motion.span
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
              />
            )}
            <span className="relative z-10">{r.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusDonut — doughnut chart with custom image legend
// ─────────────────────────────────────────────────────────────────────────────

export function StatusDonut({
  data,
  loading,
  label,
  showLabels = true,
  config = {
    key: "count",
    imageKey: "image",
    label: "label",
    hasPercentage: false,
  },
  allowImage = false,
}) {
  const t = useTranslations("dashboard");
  const displayLabel = label || t("common.orderLabel");
  const BRAND_COLORS = [PRIMARY, "#3b82f6", "#89D8F0", "#4682D4", "#FDD512"];
  const hasData = data && data.length > 0;
  const total = hasData
    ? data.reduce((s, d) => s + (Number(d[config.key]) ?? 0), 0)
    : 0;

  if (loading)
    return (
      <div className="flex flex-col items-center gap-6 animate-pulse w-full">
        <div className="w-44 h-44 rounded-full border-[18px] border-slate-100 dark:border-slate-800" />
        <div className="w-full space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                <div className="h-2 w-1/3 bg-slate-50 dark:bg-slate-900 rounded-lg" />
              </div>
              <div className="h-4 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );

  if (!hasData || total === 0)
    return (
      <div className="flex flex-col items-center justify-center h-60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <PieChart size={22} className="text-slate-400" />
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {t("common.noData")}
        </p>
      </div>
    );

  const chartData = {
    labels: data.map((d) => d[config.label]),
    datasets: [
      {
        data: data.map((d) => d[config.key]),
        backgroundColor: data.map((d, i) =>
          hex(d.color || BRAND_COLORS[i % BRAND_COLORS.length], 0.88),
        ),
        borderColor: data.map(
          (d, i) => d.color || BRAND_COLORS[i % BRAND_COLORS.length],
        ),
        borderWidth: 2.5,
        hoverOffset: 14,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "76%",
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        backgroundColor: "#fff",
        titleColor: "#64748b",
        bodyColor: "#1e293b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${ctx.raw} (${((ctx.raw / total) * 100).toFixed(1)}%)`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Chart */}
      <div className="relative h-48 w-full">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">
            {total}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">
            {t("common.totalLabel")}
          </span>
        </div>
      </div>

      {/* Legend */}
      {showLabels && <div className="w-full space-y-1.5">
        {data.map((item, i) => {
          const color = item.color || BRAND_COLORS[i % BRAND_COLORS.length];
          const percentage = config.hasPercentage
            ? item.percentage
            : ((item[config.key] / total) * 100).toFixed(0);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-default group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {allowImage && item[config.imageKey] ? (
                  <img
                    src={avatarSrc(item[config.imageKey])}
                    className="w-8 h-8 rounded-full object-cover border-2 shadow-sm shrink-0"
                    style={{ borderColor: hex(color, 0.4) }}
                    alt={item[config.label]}
                  />
                ) : (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      background: color,
                      boxShadow: `0 0 0 3px ${hex(color, 0.2)}`,
                    }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                    {item[config.label]}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {item[config.key]} {displayLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Mini bar */}
                <div className="w-16 h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%`, background: color }}
                  />
                </div>
                <span
                  className="text-xs font-bold w-8 text-right"
                  style={{ color }}
                >
                  {percentage}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrendChart — line chart with improved styling
// ─────────────────────────────────────────────────────────────────────────────

export function TrendChart({ data, loading, configs = [] }) {
  const t = useTranslations("dashboard");
  const hasData = data && data.length > 0;

  if (loading)
    return (
      <div className="w-full h-64 flex flex-col justify-between animate-pulse px-2 py-4">
        <div className="flex-1 flex flex-col justify-between mb-6 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-full h-px bg-slate-100 dark:bg-slate-800 rounded-full"
            />
          ))}
        </div>
        <div className="h-px w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
        <div className="flex justify-between px-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-8 bg-slate-100 dark:bg-slate-800 rounded-full"
            />
          ))}
        </div>
      </div>
    );

  if (!hasData)
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <TrendingUp size={22} className="text-slate-400" />
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {t("common.noOperations")}
        </p>
      </div>
    );

  const datasets = configs.map((cfg) => ({
    label: cfg.label,
    data: data.map((d) => d[cfg.key] ?? 0),
    borderColor: cfg.color,
    backgroundColor: hex(cfg.color, cfg.fillOpacity || 0.07),
    fill: cfg.fill ?? true,
    tension: 0.44,
    pointRadius: 3,
    pointBackgroundColor: cfg.color,
    pointBorderColor: "#fff",
    pointBorderWidth: 2,
    yAxisID: cfg.yAxisID || "y",
  }));

  const chartData = {
    labels: data.map((d) => d.label),
    datasets,
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        rtl: true,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: { family: "Cairo, Cairo Fallback" },
          padding: 20,
          font: {
            family: "Cairo, Cairo Fallback",
            size: 11,
            weight: "600"
          },
          color: "#64748b",
        },
      },
      tooltip: {
        rtl: true,
        backgroundColor: "#fff",
        titleColor: "#64748b",
        bodyColor: "#1e293b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: "Cairo, Cairo Fallback",
          size: 11,
          weight: "700",
        },
        bodyFont: {
          family: "Cairo, Cairo Fallback",
          size: 10,
          weight: "500",
        },
        // Optional: Add Cairo to the items inside the tooltip
        footerFont: {
          family: "Cairo, Cairo Fallback",
        },
        cornerRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8", maxRotation: 0 },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8" },
        border: { display: false },
        beginAtZero: true,
      },
      ...(configs.some((c) => c.yAxisID === "y1") && {
        y1: {
          position: "right",
          grid: { display: false },
          ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8" },
          border: { display: false },
        },
      }),
    },
  };

  return (
    <div style={{ height: 264 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

export function BarChart({ data, loading, configs = [] }) {
  const t = useTranslations("dashboard");
  const hasData = data && data.length > 0;

  if (loading)
    return (
      <div className="w-full h-64 flex flex-col justify-between animate-pulse px-2 py-4">
        <div className="flex-1 flex flex-col justify-between mb-6 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-full h-px bg-slate-100 dark:bg-slate-800 rounded-full"
            />
          ))}
        </div>
        <div className="h-px w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
        <div className="flex justify-between px-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-8 bg-slate-100 dark:bg-slate-800 rounded-full"
            />
          ))}
        </div>
      </div>
    );

  if (!hasData)
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <BarChart3 size={22} className="text-slate-400" />
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {t("common.noOperations")}
        </p>
      </div>
    );

  const datasets = configs.map((cfg) => ({
    label: cfg.label,
    data: data.map((d) => d[cfg.key] ?? 0),
    backgroundColor: hex(cfg.color, 0.85),
    borderColor: cfg.color,
    borderWidth: 1.5,
    borderRadius: 8,
    maxBarThickness: 40,
  }));

  const chartData = {
    labels: data.map((d) => d.label),
    datasets,
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        rtl: true,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: { family: "Cairo, Cairo Fallback" },
          padding: 20,
          font: {
            family: "Cairo, Cairo Fallback",
            size: 11,
            weight: "600"
          },
          color: "#64748b",
        },
      },
      tooltip: {
        rtl: true,
        backgroundColor: "#fff",
        titleColor: "#64748b",
        bodyColor: "#1e293b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: "Cairo, Cairo Fallback",
          size: 11,
          weight: "700",
        },
        bodyFont: {
          family: "Cairo, Cairo Fallback",
          size: 10,
          weight: "500",
        },
        footerFont: {
          family: "Cairo, Cairo Fallback",
        },
        cornerRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8", maxRotation: 0 },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { font: { family: "Cairo, Cairo Fallback", size: 10 }, color: "#94a3b8" },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: 264 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PctBar — animated percentage bar
// ─────────────────────────────────────────────────────────────────────────────

export function PctBar({ value, color = PRIMARY }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="flex items-center gap-2.5 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-left tabular-nums">
        {pct(v)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MiniTable — refined table with hover states
// ─────────────────────────────────────────────────────────────────────────────

export function MiniTable({ columns, data, loading }) {
  const t = useTranslations("dashboard");

  return (
    <div className="table-container overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">

      {/* Added 'min-w-[500px]' (or any appropriate width) 
          This ensures the table doesn't shrink smaller than this width, 
          which triggers the overflow scroll.
      */}
      <table className="w-full text-sm min-w-[450px] border-collapse">
        <thead className="table-header">   <tr>
          {columns.map((c, idx) => (
            <th
              key={c.key}
              className="table-header-cell"
            >
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.035 }}
              >
                {c.header}
              </motion.span>
            </th>
          ))}
        </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr
                key={i}
                className="table-row"
              >
                {columns.map((c) => (
                  <td key={c.key} className="table-cell">
                    <div className="table-skeleton-bar" />
                  </td>
                ))}
              </tr>
            ))
          ) : !data?.length ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-14 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
                    <Package size={18} className="text-muted-foreground/60" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground/60">
                    {t("common.noData")}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035 }}
                className="table-row"
              >
                {columns.map((c) => (
                  <td key={c.key} className="table-cell">
                    {c.cell ? c.cell(row) : (row[c.key] ?? "—")}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TableFilters — filter panel with polished inputs
// ─────────────────────────────────────────────────────────────────────────────

export const TableFilters = memo(function TableFilters({
  children,
  onApply,
  onRefresh,
  applyLabel,
}) {

  const t = useTranslations("dashboard");
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="main-card !p-0 overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 flex items-center justify-center">
          <Filter size={12} className="text-primary" />
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          {t("filters.title")}
        </span>
      </div>

      {/* Fields */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 items-end">
          {children}

          {/* Actions */}
          <div className="flex items-center gap-2.5 justify-end md:justify-start">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onRefresh}
              className={cn(
                "h-10 px-4 rounded-xl text-xs font-semibold",
                "border border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                "hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800",
                "transition-all flex items-center gap-1.5 shadow-sm",
              )}
            >
              <RefreshCw size={12} />
              {t("common.refresh")}
            </motion.button>

            {onApply && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onApply}
                type="button"
                className="h-10 px-5 flex items-center gap-2 text-xs font-bold text-white rounded-xl transition-all duration-200 shadow-md"
                style={{
                  background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
                  boxShadow: `0 4px 14px rgb(var(--primary-shadow))`,
                }}
              >
                <Filter size={12} />
                {applyLabel || t("filters.apply")}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FilterField wrapper — label + input group
// ─────────────────────────────────────────────────────────────────────────────

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

export default function OrdersStatisticsPage() {
  const tOrders = useTranslations("orders");
  const t = useTranslations("orderAnalysis");
  const locale = useLocale();

  const [quickRange, setQuickRange] = useState();
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    storeId: "all",
    shippingCompanyId: "all",
    assignedUserId: "all",
    productIds: [],
    cityId: "all",
  });

  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [loading, setLoading] = useState(true);
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    const lowerSearch = citySearch.toLowerCase();
    return cities.filter(city => {
      const nameEn = city.nameEn?.toLowerCase() || "";
      const nameAr = city.nameAr?.toLowerCase() || "";
      return nameEn.includes(lowerSearch) || nameAr.includes(lowerSearch);
    });
  }, [cities, citySearch]);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [topCitiesStats, setTopCitiesStats] = useState([]);
  const [topProductsStats, setTopProductsStats] = useState([]);
  const [exAreas, setExAreas] = useState(false);
  const [exProducts, setExProducts] = useState(false);
  const { formatTrendLabel } = useTrendLabelFormatter();

  const buildParams = useCallback(() => {
    const p = { range: quickRange };
    if (filters.startDate) p.startDate = filters.startDate;
    if (filters.endDate) p.endDate = filters.endDate;
    if (filters.storeId && filters.storeId !== "all")
      p.storeId = filters.storeId;
    if (filters.shippingCompanyId && filters.shippingCompanyId !== "all")
      p.shippingCompanyId = filters.shippingCompanyId;
    if (filters.assignedUserId && filters.assignedUserId !== "all")
      p.assignedUserId = filters.assignedUserId;
    if (filters.productIds && filters.productIds.length > 0)
      p.productIds = filters.productIds;
    if (filters.cityId && filters.cityId !== "all")
      p.cityId = filters.cityId;
    return p;
  }, [quickRange, filters]);

  const fetchAll = useCallback(async () => {
    const p = buildParams();
    setLoading(true);
    try {
      const [advStats, weekTrend, citiesStats, productsStats] = await Promise.all([
        api
          .get("/dashboard/advanced-stats", { params: p })
          .catch(() => ({ data: null })),
        api
          .get("/dashboard/weekly-trend", { params: p })
          .catch(() => ({ data: [] })),
        api
          .get("/dashboard/top-cities-stats", { params: p })
          .catch(() => ({ data: [] })),
        api
          .get("/dashboard/top-products-stats", { params: p })
          .catch(() => ({ data: [] })),
      ]);
      const getData = (r) =>
        Array.isArray(r.data) ? r.data : (r.data?.records ?? []);
      
      setAdvancedStats(advStats.data);
      
      const formattedTrend = (getData(weekTrend)).map((item) => ({
        ...item,
        label: formatTrendLabel(item.date),
      }));

      setWeeklyTrend(formattedTrend);
      setTopCitiesStats(getData(citiesStats));
      setTopProductsStats(getData(productsStats));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {    // Fetch cities
    api
      .get("/cities")
      .then(({ data }) =>
        setCities(Array.isArray(data) ? data : (data?.records ?? [])),
      )
      .catch((err) => console.error("Failed to fetch cities:", err));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [quickRange]);

  // ── KPI config ────────────────────────────────────────────────────────────

  const KPI = [
    {
      key: "totalOrders",
      title: t("kpi.totalOrders"),
      icon: ShoppingCart,
    },
    {
      key: "correctedOrders",
      title: t("kpi.correctedOrders") || "Corrected Orders",
      icon: CheckCircle,
    },
    {
      key: "confirmedCount",
      title: t("kpi.confirmedCount") || "Confirmed Count",
      icon: CheckCircle,
    },
    {
      key: "deliveredFromConfirmed",
      title: t("kpi.deliveredFromConfirmed") || "Delivered from Confirmed",
      icon: Truck
    },
    {
      key: "deliveredFromTotal",
      title: t("kpi.deliveredFromTotal") || "Delivered from Total",
      icon: TrendingUp
    },
    {
      key: "totalSales",
      title: t("kpi.totalSales"),
      icon: TrendingUp,
    },
    {
      key: "deliveredSales",
      title: t("kpi.deliveredSales") || "Delivered Sales",
      icon: Truck,
    },
    {
      key: "collectedAmount",
      title: t("kpi.collectedAmount") || "Collected Amount",
      icon: TrendingUp,
    },
    {
      key: "canceledAndUnderReview",
      title: t("kpi.canceledAndUnderReview") || "Canceled & Under Review",
      icon: XCircle,
    },
    {
      key: "pendingOrders",
      title: t("kpi.pendingOrders") || "Pending",
      icon: Package,
    },
    {
      key: "inWarehouseOrders",
      title: t("kpi.inWarehouseOrders") || "In Warehouse Orders",
      icon: Store,
    },
    {
      key: "new",
      title: t("kpi.newOrders") || "New Orders",
      icon: Package,
    },
    {
      key: "returned",
      title: t("kpi.returnedOrders") || "Returned Orders",
      icon: XCircle,
    },
    {
      key: "postponed",
      title: t("kpi.postponedOrders") || "Postponed Orders",
      icon: Package,
    },
    {
      key: "outOfDelivery",
      title: t("kpi.outOfDeliveryOrders") || "Out of Delivery Area Orders",
      icon: MapPin,
    },
    {
      key: "wrongNumber",
      title: t("kpi.wrongNumberOrders") || "Wrong Number Orders",
      icon: XCircle,
    },
    {
      key: "canceled",
      title: t("kpi.canceledOrders"),
      icon: XCircle,
    },
    {
      key: "confirmed",
      title: t("kpi.confirmedOrders"),
      icon: CheckCircle,
    },
    {
      key: "shipped",
      title: t("kpi.shippedOrders"),
      icon: Truck,
    },
    {
      key: "delivered",
      title: t("kpi.deliveredOrders"),
      icon: CheckCircle,
    },
  ];

  // ── Areas table columns ───────────────────────────────────────────────────

  const areasCols = [
    {
      key: "label",
      header: t("areas.columns.cityArea"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <MapPin size={11} className="text-emerald-500" />
          </div>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            {locale === "ar" ? r.nameAr : r.nameEn}
          </span>
        </div>
      ),
    },
    {
      key: "totalOrders",
      header: t("areas.columns.totalOrders"),
      cell: (r) => (
        <span
          className="font-bold tabular-nums text-sm"
          style={{ color: PRIMARY }}
        >
          {fmt(r.totalOrders)}
        </span>
      ),
    },
    {
      key: "correctedOrders",
      header: t("kpi.correctedOrders"),
      cell: (r) => (
        <span className="font-semibold text-purple-500 dark:text-purple-400 tabular-nums text-sm">
          {fmt(r.correctedOrders)}
        </span>
      ),
    },
    {
      key: "confirmedCount",
      header: t("areas.columns.confirmed"),
      cell: (r) => (
        <span className="font-semibold text-blue-500 dark:text-blue-400 tabular-nums text-sm">
          {fmt(r.confirmedCount)}
        </span>
      ),
    },
    {
      key: "shippedOrders",
      header: t("areas.columns.inDelivery"),
      cell: (r) => (
        <span className="font-semibold text-cyan-500 dark:text-cyan-400 tabular-nums text-sm">
          {fmt(r.shippedOrders)}
        </span>
      ),
    },
    {
      key: "deliveredTotal",
      header: t("areas.columns.delivered"),
      cell: (r) => (
        <span className="font-semibold text-emerald-500 dark:text-emerald-400 tabular-nums text-sm">
          {fmt(r.deliveredTotal)}
        </span>
      ),
    },
    {
      key: "deliveredFromConfirmed",
      header: t("kpi.deliveredFromConfirmed"),
      cell: (r) => (
        <span className="font-semibold text-orange-500 dark:text-orange-400 tabular-nums text-sm">
          {fmt(r.deliveredFromConfirmed)}
        </span>
      ),
    },
  ];

  // ── Products table columns ─────────────────────────────────────────────────

  const productsCols = [
    {
      key: "label",
      header: t("products.columns.name"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.image && (
            <img
              src={avatarSrc(r.image)}
              alt=""
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
          )}
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">
            {r.name}
          </span>
        </div>
      ),
    },
    {
      key: "totalOrders",
      header: t("products.columns.ordersCount"),
      cell: (r) => (
        <span
          className="font-bold tabular-nums text-sm"
          style={{ color: PRIMARY }}
        >
          {fmt(r.totalOrders)}
        </span>
      ),
    },
    {
      key: "correctedOrders",
      header: t("kpi.correctedOrders"),
      cell: (r) => (
        <span className="font-semibold text-purple-500 dark:text-purple-400 tabular-nums text-sm">
          {fmt(r.correctedOrders)}
        </span>
      ),
    },
    {
      key: "confirmedCount",
      header: t("products.columns.confirmedOrders"),
      cell: (r) => (
        <span className="font-semibold text-blue-500 dark:text-blue-400 tabular-nums text-sm">
          {fmt(r.confirmedCount)}
        </span>
      ),
    },
    {
      key: "shippedOrders",
      header: t("products.columns.inDelivery"),
      cell: (r) => (
        <span className="font-semibold text-cyan-500 dark:text-cyan-400 tabular-nums text-sm">
          {fmt(r.shippedOrders)}
        </span>
      ),
    },
    {
      key: "deliveredTotal",
      header: t("products.columns.delivered"),
      cell: (r) => (
        <span className="font-semibold text-emerald-500 dark:text-emerald-400 tabular-nums text-sm">
          {fmt(r.deliveredTotal)}
        </span>
      ),
    },
    {
      key: "deliveredFromConfirmed",
      header: t("kpi.deliveredFromConfirmed"),
      cell: (r) => (
        <span className="font-semibold text-orange-500 dark:text-orange-400 tabular-nums text-sm">
          {fmt(r.deliveredFromConfirmed)}
        </span>
      ),
    },
  ];

  // ── Derived stats ─────────────────────────────────────────────────────────

  const statsData = useMemo(
    () =>
      KPI.map((card, i) => {
        let raw;
        // Check if the key is in statuses object or directly in advancedStats
        if (card.key in (advancedStats?.statuses || {})) {
          raw = advancedStats?.statuses?.[card.key];
        } else {
          raw = advancedStats?.[card.key];
        }
        const val = raw == null ? "0" : card.pct ? pct(raw) : fmt(raw);
        return {
          id: card.key,
          name: card.title,
          value: val,
          icon: card.icon,
          color: card.color,
          sortOrder: i,
          onClick: () => { },
        };
      }),
    [advancedStats, KPI],
  );

  const statsCards = useMemo(() => {
    // Using statsData from advanced stats instead of statusData
    return statsData;
  }, [statsData]);

  // ── Export helper ─────────────────────────────────────────────────────────

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

  const orderConfigs = [
    {
      key: "newOrders",
      label: t("chart.newOrders"),
      color: SECONDARY,
      fillOpacity: 0.1,
      tension: 0.44,
    },
    {
      key: "deliveredOrders",
      label: t("chart.deliveredOrders"),
      color: "#10b981",
      fillOpacity: 0.06,
      tension: 0.44,
    },
  ];

  const QUICK_RANGES = [
    { id: "today", label: t("ranges.today") },
    { id: "yesterday", label: t("ranges.yesterday") },
    { id: "this_week", label: t("ranges.this_week") },
    { id: "last_week", label: t("ranges.last_week") },
    { id: "this_month", label: t("ranges.this_month") },
    { id: "last_month", label: t("ranges.last_month") },
    { id: "this_year", label: t("ranges.this_year") },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-5 space-y-5">
      {/* Page header */}
      <PageHeader
        itemsCompact={false}
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.orderAnalysis") },
        ]}
        buttons={
          <Button_
            size="sm"
            label={t("actions.howToUse")}
            variant="ghost"
            icon={<Info size={18} />}
          />
        }
        statsLoading={loading}
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
        onApply={fetchAll}
        onRefresh={fetchAll}
        applyLabel={t("filters.apply")}
      >

        <FilterField label={t("filters.dateRange")} icon={Calendar}>
          <DateRangePicker
            value={{
              startDate: filters.startDate,
              endDate: filters.endDate,
            }}
            onChange={(newDates) => {
              setFilters(f => ({ ...f, ...newDates }))
              setQuickRange(null)
            }}
            placeholder={t("filters.dateRangePlaceholder")}
            dataSize="default"
            maxDate="today"
          />
        </FilterField>

        <StoreFilter value={filters.storeId} icon={Store} iconClass={"text-orange-400!"}
          onChange={(v) => setFilters((f) => ({ ...f, storeId: v }))} none={false} autoSelectIfSingle={true} />

          <ShippingCompanyFilter
            value={filters.shippingCompanyId}
            onChange={(v) =>
              setFilters((f) => ({ ...f, shippingCompanyId: v }))
            }
          />
        

        <FilterField label={t("filters.employee")}>
          <UserSelect
            value={filters.assignedUserId}
            onSelect={(user) =>
              setFilters((f) => ({
                ...f,
                assignedUserId: user ? String(user.id) : "all",
              }))
            }
            placeholder={t("filters.employeePlaceholder")}
            allowAll
            allLabel={t("filters.all")}
            className="h-10 rounded-xl border-border bg-background"
            contentClassName="bg-card-select"
          />
        </FilterField>

        <FilterField label={t("filters.city")}>
          <Select
            value={filters.cityId}
            onValueChange={(v) => {
              setFilters((f) => ({ ...f, cityId: v }));
              setCitySearch("");
            }}
          >
            <SelectTrigger className="h-10 rounded-xl border-border bg-background">
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent className="bg-card-select">
              <div className="px-2 py-2 sticky top-0 bg-card-select z-10 border-b border-border">
                <input
                  type="text"
                  placeholder={t("filters.search")}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 rtl:text-end text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              {filteredCities.map((city) => (
                <SelectItem key={city.id} value={String(city.id)}>
                  {locale === "ar" ? city.nameAr : city.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label={t("filters.products")}>
          <MultiSelect
            endpoint="/products"
            params={{ isActive: "true", type: "PRODUCT" }}
            value={filters.productIds}
            initialValues={filters.productIds}
            onChange={(newVal) => {
              const ids = newVal.map(v => typeof v === 'string' ? v : v.id);
              setFilters((f) => ({ ...f, productIds: ids }));
            }}
            placeholder={t("filters.products")}
            labelKey="name"
          />
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
            title={t("charts.ordersPercent")}
            icon={TrendingUp}
            color={PRIMARY}
          >
            <BarChart
              data={weeklyTrend}
              loading={loading}
              configs={[
                { key: "created", label: t("charts.newOrders"), color: "#6366f1" },
                { key: "delivered", label: t("charts.deliveredOrders"), color: "#10b981" },
              ]}
            />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card title={t("charts.perStatus")} icon={PieIcon} color={PRIMARY}>
            <StatusDonut
              showLabels={false}
              data={advancedStats?.statusBreakdown?.map((s, i) => ({
                ...s,
                label:  s.system ? tOrders(`statuses.${s.code}`) : s.name,
                count: s.count,
                color: [PRIMARY, "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 6],
              }))}
              loading={loading}
              config={{ key: "count", label: "label" }}
            />
          </Card>
        </motion.div>
      </div>

      {/* Areas table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card
          title={t("areas.title")}
          icon={MapPin}
          color="#10b981"
          // action={
          //   <ExportBtn
          //     loading={exAreas}
          //     onClick={() =>
          //       doExport(
          //         "/dashboard/orders/top-areas/export",
          //         setExAreas,
          //         "top_areas",
          //       )
          //     }
          //   />
          // }
        >
          <MiniTable columns={areasCols} data={topCitiesStats} loading={loading} />
        </Card>
      </motion.div>

      {/* Products table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card
          title={t("products.title")}
          icon={Package}
          color="#3b82f6"
          // action={
          //   <ExportBtn
          //     loading={exProducts}
          //     onClick={() =>
          //       doExport(
          //         "/dashboard/orders/top-products/export",
          //         setExProducts,
          //         "top_products",
          //       )
          //     }
          //   />
          // }
        >
          <MiniTable columns={productsCols} data={topProductsStats} loading={loading} />
        </Card>
      </motion.div>
    </div>
  );
}
