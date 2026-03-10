"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Info, RefreshCw, AlertCircle, Package, Calendar, FileDown, X, XCircle, User, Hash, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import Table from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "../../../../components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";
import { Button } from "@/components/ui/button";
import { STATUS } from "./data";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const DS = {
  radius: "rounded-lg",
  radiusSm: "rounded-md",
  radiusXl: "rounded-xl",

  primary: "#ff8b00",
  accent: "#6763af",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#ffb703",

  headerGradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",

  shadow: "shadow-sm",
};

// ─────────────────────────────────────────────────────────────
// SHARED HEADER BUTTONS
// ─────────────────────────────────────────────────────────────
function HeaderBadge({ children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "bg-white/20 text-white",
        "text-[11px] font-semibold px-2.5 py-1.5",
        DS.radiusSm
      )}
    >
      {children}
    </span>
  );
}

function HeaderIconBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-8 h-8 flex items-center justify-center",
        DS.radiusSm,
        "bg-white/20 hover:bg-white/30 transition-colors"
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAILS MODAL
// ─────────────────────────────────────────────────────────────
function RejectedOrderDetailModal({ open, onClose, order }) {
  const t = useTranslations("warehouse.rejected");
  if (!order) return null;

  const infoRows = [
    { label: t("detail.customer"), value: order.customer, icon: User, color: DS.primary },
    { label: t("detail.phone"), value: order.phone, icon: Hash, color: DS.accent },
    { label: t("detail.city"), value: order.city, icon: MapPin, color: DS.primary },
    { label: t("detail.employee"), value: order.assignedEmployee || "—", icon: User, color: DS.accent },
    { label: t("detail.rejectedAt"), value: order.rejectedAt || "—", icon: Calendar, color: DS.warning },
    { label: t("detail.totalItems"), value: order.products?.reduce((s, p) => s + (p.requestedQty || 0), 0) || 0, icon: Package, color: DS.warning },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-xl"
        dir="rtl"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 rounded-t-xl overflow-hidden" style={{ background: DS.headerGradient }}>
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-sm", DS.radiusSm)}>
                <XCircle className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{t("detail.orderLabel")}</p>
                <h2 className="text-white text-xl font-black font-mono">{order.code}</h2>
              </div>
            </div>

            <HeaderIconBtn onClick={onClose}>
              <X size={15} className="text-white" />
            </HeaderIconBtn>
          </div>

          <div className="relative mt-3 flex items-center gap-2 flex-wrap">
            <HeaderBadge>
              <AlertCircle size={11} />
              {t("detail.rejected")}
            </HeaderBadge>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {infoRows.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className={cn(
                  "flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 transition-colors",
                  DS.radius
                )}
              >
                <div
                  className={cn("w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5", DS.radiusSm)}
                  style={{ backgroundColor: color + "18" }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">{label}</p>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div
            className={cn("p-4 border", DS.radius)}
            style={{ backgroundColor: DS.danger + "10", borderColor: DS.danger + "35" }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <AlertCircle size={13} style={{ color: DS.danger }} />
              <p className="text-xs font-bold text-red-600">{t("detail.reason")}</p>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {order.rejectReason || t("detail.unspecified")}
            </p>
          </div>

          {/* Products */}
          <div className={cn("border border-slate-100 dark:border-slate-700 overflow-hidden", DS.radius)}>
            <div className="px-4 py-2.5 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700">
              <Package size={13} style={{ color: DS.accent }} />
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">{t("detail.products")}</span>
              <span className="ms-auto text-[11px] font-semibold text-slate-400">
                {order.products?.length || 0} {t("detail.items")}
              </span>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
              {order.products?.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className={cn("w-6 h-6 flex items-center justify-center text-[10px] font-black flex-shrink-0", DS.radiusSm)}
                    style={{ backgroundColor: DS.primary + "18", color: DS.primary }}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={cn("font-mono text-[11px] px-2 py-0.5 font-bold", DS.radiusSm)}
                    style={{ backgroundColor: DS.accent + "12", color: DS.accent }}
                  >
                    {p.sku}
                  </span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">{p.name}</span>
                  <span className="text-xs text-slate-400 font-mono">×{p.requestedQty}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={onClose} className={DS.radiusSm}>
              {t("close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN REJECTED TAB
// ─────────────────────────────────────────────────────────────
export function RejectedTab({ orders, updateOrder, pushOp, resetToken }) {
  const t = useTranslations("warehouse.rejected");

  const rejectedOrders = useMemo(
    () => orders.filter((o) => o.status === STATUS.REJECTED),
    [orders]
  );

  const [search, setSearch] = useState("");
  const [detailModal, setDetailModal] = useState(null);
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  useEffect(() => {
    setSearch("");
    setDetailModal(null);
    setPage({ current_page: 1, per_page: 12 });
  }, [resetToken]);

  const today = new Date().toISOString().split("T")[0];
  const todayCount = rejectedOrders.filter((o) => o.rejectedAt?.startsWith(today)).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = rejectedOrders.filter((o) => o.rejectedAt && new Date(o.rejectedAt) >= weekAgo).length;

  const stats = [
    {
      id: "total-rejected",
      name: t("stats.totalRejected"),
      value: rejectedOrders.length,
      icon: XCircle,
      color: "#ef4444",
      sortOrder: 0,
    },
    {
      id: "today",
      name: t("stats.today"),
      value: todayCount,
      icon: Calendar,
      color: "#f97316",
      sortOrder: 1,
    },
    {
      id: "this-week",
      name: t("stats.thisWeek"),
      value: weekCount,
      icon: AlertCircle,
      color: "#f59e0b",
      sortOrder: 2,
    },
    {
      id: "total-items",
      name: t("stats.totalItems"),
      value: rejectedOrders.reduce(
        (s, o) => s + (o.products || []).reduce((ps, p) => ps + (p.requestedQty || 0), 0),
        0
      ),
      icon: Package,
      color: "#64748b",
      sortOrder: 3,
    },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rejectedOrders;
    return rejectedOrders.filter((o) =>
      [o.code, o.customer, o.phone, o.city, o.rejectReason, o.assignedEmployee].some((x) =>
        String(x || "").toLowerCase().includes(q)
      )
    );
  }, [rejectedOrders, search]);

  const handleRetry = useCallback(
    (order) => {
      updateOrder(order.code, {
        status: STATUS.CONFIRMED,
        rejectReason: "",
        rejectedAt: "",
      });

      pushOp({
        id: `OP-${Date.now()}`,
        operationType: "RETRY_ORDER",
        orderCode: order.code,
        carrier: order.carrier || "-",
        employee: "System",
        result: "SUCCESS",
        details: t("retryOpDetails"),
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
    },
    [updateOrder, pushOp, t]
  );

  const columns = useMemo(
    () => [
      {
        key: "code",
        header: t("table.orderNumber"),
        cell: (row) => <span className="font-mono font-bold text-primary">{row.code}</span>,
      },
      {
        key: "customer",
        header: t("table.customer"),
        cell: (row) => <span className="font-semibold">{row.customer}</span>,
      },
      {
        key: "phone",
        header: t("table.phone"),
        cell: (row) => <span className="font-mono text-slate-500 text-sm">{row.phone}</span>,
      },
      { key: "city", header: t("table.city") },
      {
        key: "rejectReason",
        header: t("table.rejectReason"),
        cell: (row) => (
          <span className="text-sm text-red-600 dark:text-red-400 truncate max-w-[220px] block">
            {row.rejectReason || "—"}
          </span>
        ),
      },
      {
        key: "rejectedAt",
        header: t("table.rejectedAt"),
        cell: (row) => <span className="text-sm text-slate-500">{row.rejectedAt || "—"}</span>,
      },
      { key: "assignedEmployee", header: t("table.employee") },
      {
        key: "actions",
        header: t("table.actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Info />,
                tooltip: t("actions.viewDetails"),
                onClick: (r) => setDetailModal(r),
                variant: "purple",
              },
              {
                icon: <RefreshCw />,
                tooltip: t("actions.retryToConfirmed"),
                onClick: (r) => handleRetry(r),
                variant: "orange",
              },
            ]}
          />
        ),
      },
    ],
    [t, handleRetry]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.rejected") },
        ]}
        stats={stats}
      />

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {}}
        labels={{
          searchPlaceholder: t("searchPlaceholder"),
          filter: t("filter"),
          apply: t("apply"),
          total: t("total"),
          limit: t("limit"),
          emptyTitle: t("emptyTitle"),
          emptySubtitle: "",
        }}
        actions={[
          {
            key: "export",
            label: t("export"),
            icon: <FileDown size={14} />,
            color: "blue",
            onClick: () => {},
          },
        ]}
        hasActiveFilters={false}
        onApplyFilters={() => {}}
        filters={null}
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{
          total_records: filtered.length,
          current_page: page.current_page,
          per_page: page.per_page,
        }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />

      <RejectedOrderDetailModal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        order={detailModal}
      />
    </div>
  );
}