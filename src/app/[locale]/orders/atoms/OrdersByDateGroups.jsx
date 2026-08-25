"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown, Loader2 } from "lucide-react";

import {
  Table as ShadTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTrendLabelFormatter } from "@/hook/useTrendLabelFormatter";

const GROUPED_ORDERS_PAGE = 20;

/* Compact rounded stat pill — strong variant = solid primary (strongest hierarchy) */
function StatPill({ label, value, color, strong = false }) {
  const style = strong
    ? {
        background: "var(--primary)",
        color: "var(--primary-foreground, #fff)",
      }
    : {
        background: `color-mix(in srgb, ${
          color || "var(--muted-foreground)"
        } 12%, transparent)`,
        color: color || "var(--muted-foreground)",
      };

  return (
    <span
      className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] leading-none whitespace-nowrap"
      style={style}
    >
      {!strong && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: color || "var(--muted-foreground)" }}
        />
      )}
      <span className="font-black tabular-nums">{value}</span>
      <span className="font-semibold opacity-75">{label}</span>
    </span>
  );
}

/* Skeleton card matching the collapsed group-header shape */
function GroupSkeleton() {
  return (
    <div className="main-card rounded-2xl border border-border/50 px-3.5 py-2.5 flex items-center gap-2.5 flex-wrap">
      <div className="w-4 h-4 rounded-full bg-muted/70 animate-pulse" />
      <div className="h-3.5 w-24 rounded-md bg-muted/70 animate-pulse" />
      <div className="flex items-center gap-1.5 ms-auto flex-wrap">
        {[76, 72].map((w, i) => (
          <div
            key={i}
            style={{ width: w }}
            className="h-[22px] rounded-full bg-muted/60 animate-pulse"
          />
        ))}
        <div className="h-6 w-16 rounded-md bg-muted/50 animate-pulse" />
      </div>
    </div>
  );
}

export default function OrdersByDateGroups({
  groups = [],
  columns = [],
  expandedDates = new Set(),
  dateOrders = {},
  onToggleDate,
  onLoadMore,
  isLoading = false,
  formatCurrency = (v) => v,
  getStatusColor = () => null,
}) {
  const t = useTranslations("orders.groupedView");
  const { formatTrendLabel } = useTrendLabelFormatter();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <GroupSkeleton />
        <GroupSkeleton />
        <GroupSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const dateKey = group.date;
        const isExpanded = expandedDates.has(dateKey);
        const entry = dateOrders[dateKey] || {};
        const records = Array.isArray(entry.records) ? entry.records : [];
        // Statistics always come from the group header (independent of loaded rows)
        const totalForDate =
          group.statistics?.totalOrders ||
          entry.total_records ||
          0;

        return (
          <section
            key={dateKey}
            className="main-card rounded-xl border border-border/50 overflow-hidden"
            style={
              isExpanded
                ? { borderColor: "color-mix(in oklab, var(--primary) 35%, transparent)" }
                : {}
            }
          >
            {/* ── Group header ── */}
            <button
              type="button"
              onClick={() => onToggleDate?.(dateKey)}
              className="w-full px-3.5 py-2 flex items-center gap-2.5 flex-wrap hover:bg-[color-mix(in_oklab,var(--primary)_3%,transparent)] transition-colors text-start"
            >
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", color: "var(--primary)" }}
              >
                <ChevronDown size={15} />
              </motion.span>

              <span className="text-sm font-extrabold text-foreground whitespace-nowrap">
                {formatTrendLabel(`${dateKey}T00:00:00`)}
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <StatPill
                  label={t("stats.totalOrders")}
                  value={totalForDate}
                  strong
                />
                <StatPill
                  label={t("stats.shipped")}
                  value={group.statistics?.shipped ?? 0}
                  color={getStatusColor("shipped") || "#3b82f6"}
                />
                <StatPill
                  label={t("stats.delayed")}
                  value={group.statistics?.delayed ?? 0}
                  color="#e84545"
                />
                <StatPill
                  label={t("stats.delivered")}
                  value={group.statistics?.delivered ?? 0}
                  color={getStatusColor("delivered")}
                />
                <StatPill
                  label={t("stats.postponed")}
                  value={group.statistics?.postponed ?? 0}
                  color={getStatusColor("postponed")}
                />
                <StatPill
                  label={t("stats.confirmed")}
                  value={group.statistics?.confirmed ?? 0}
                  color={getStatusColor("confirmed") || "#19a85b"}
                />
                <StatPill
                  label={t("stats.cancelled")}
                  value={group.statistics?.cancelled ?? 0}
                  color={getStatusColor("cancelled") || "#e84545"}
                />
              </div>

              <span className="ms-auto inline-flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/70">
                  {t("stats.totalAmount")}
                </span>
                <span className="text-[13px] font-black text-[var(--primary)] tabular-nums">
                  {formatCurrency(group.statistics?.totalAmount ?? 0)}
                </span>
              </span>
            </button>

            {/* ── Expanded orders ── */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-border/40"
                >
                  {entry.loading && !records.length ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={15} className="animate-spin" />
                      {t("loadingOrders")}
                    </div>
                  ) : !records.length ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      —
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <ShadTable>
                          <TableHeader className="border-b border-border/40">
                            <TableRow className="hover:bg-transparent">
                              {columns.map((col, idx) => (
                                <TableHead
                                  key={idx}
                                  className="!px-4 whitespace-nowrap ltr:text-left rtl:text-right align-middle py-2.5"
                                >
                                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/80">
                                    {col.header}
                                  </span>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {records.map((row, i) => (
                              <TableRow
                                key={row.id ?? i}
                                className="border-b border-border/35"
                              >
                                {columns.map((col, idx) => (
                                  <TableCell
                                    key={idx}
                                    className="!px-4 text-sm whitespace-nowrap ltr:text-left rtl:text-right py-2"
                                  >
                                    {typeof col.cell === "function"
                                      ? col.cell(row, i)
                                      : row[col.key]}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </ShadTable>
                      </div>

                      {/* Load more footer — cursor pagination */}
                      <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap border-t border-border/40">
                        <span className="text-xs text-muted-foreground">
                          {t("showingOf", {
                            shown: records.length,
                            total: totalForDate,
                          })}
                        </span>
                        {entry.hasMore && entry.nextCursor && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={entry.loading}
                            onClick={() => onLoadMore?.(dateKey)}
                          >
                            {entry.loading && (
                              <Loader2 size={14} className="animate-spin" />
                            )}
                            {t("loadMore")}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}

export { GROUPED_ORDERS_PAGE };
