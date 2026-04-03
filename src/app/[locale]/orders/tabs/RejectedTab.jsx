"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Info, RefreshCw, AlertCircle, Package, Calendar, FileDown, X, XCircle, User, Hash, MapPin, Loader2 } from "lucide-react";
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
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import toast from "react-hot-toast";

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
    { label: t("detail.customer"), value: order.customerName, icon: User, color: DS.primary },
    { label: t("detail.phone"), value: order.phoneNumber, icon: Hash, color: DS.accent },
    { label: t("detail.city"), value: order.city, icon: MapPin, color: DS.primary },
    { label: t("detail.employee"), value: order.rejectedBy?.name || "—", icon: User, color: DS.accent },
    { label: t("detail.rejectedAt"), value: order.rejectedAt ? new Date(order.rejectedAt).toLocaleString() : "—", icon: Calendar, color: DS.warning },
    { label: t("detail.totalItems"), value: order.items?.reduce((s, p) => s + (p.quantity || 0), 0) || 0, icon: Package, color: DS.warning },
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
                {order.items?.length || 0} {t("detail.items")}
              </span>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
              {order.items?.map((p, i) => (
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
                    {p.variant?.sku || p.sku}
                  </span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">{p.variant?.product?.name || p.name}</span>
                  <span className="text-xs text-slate-400 font-mono">×{p.quantity}</span>
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
export default function RejectedTab({ resetToken }) {
  const t = useTranslations("warehouse.rejected");

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 350 });
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [rejectedStats, setRejectedStats] = useState({
    totalRejected: 0,
    rejectedToday: 0,
    rejectedThisWeek: 0,
  });
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState({});
  const { handleExport, exportLoading } = useExport();

  const [detailModal, setDetailModal] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/orders/stats/rejected-orders");
      if (res.data) setRejectedStats(res.data);
    } catch (e) {
      console.error("Error fetching rejected stats", e);
    }
  }, []);

  const fetchOrders = useCallback(
    async (page = pager.current_page, per_page = pager.per_page) => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: per_page,
          status: "rejected",
        };
        if (debouncedSearch) params.search = debouncedSearch;

        const res = await api.get("/orders", { params });
        const data = res.data || {};
        setPager({
          total_records: data.total_records || 0,
          current_page: data.current_page || page,
          per_page: data.per_page || per_page,
          records: Array.isArray(data.records) ? data.records : [],
        });
      } catch (e) {
        console.error("Error fetching rejected orders", e);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, pager.current_page, pager.per_page]
  );

  useEffect(() => {
    console.log("called")
    fetchOrders(1, pager.per_page);
    fetchStats();
  }, [debouncedSearch, resetToken, fetchOrders, fetchStats]);

  const handlePageChange = ({ page, per_page }) => {
    fetchOrders(page, per_page);
  };

  const onExport = async () => {
    const params = { status: "rejected" };
    if (debouncedSearch) params.search = debouncedSearch;

    await handleExport({
      endpoint: "/orders/export",
      params,
      filename: `rejected_orders_${Date.now()}.xlsx`,
    });
  };

  const stats = [
    {
      id: "total-rejected",
      name: t("stats.totalRejected"),
      value: rejectedStats.totalRejected,
      icon: XCircle,
      color: "#ef4444",
      sortOrder: 0,
    },
    {
      id: "today",
      name: t("stats.today"),
      value: rejectedStats.rejectedToday,
      icon: Calendar,
      color: "#f97316",
      sortOrder: 1,
    },
    {
      id: "this-week",
      name: t("stats.thisWeek"),
      value: rejectedStats.rejectedThisWeek,
      icon: AlertCircle,
      color: "#f59e0b",
      sortOrder: 2,
    },
  ];

  const handleRetry = useCallback(
    async (order) => {
      setRetrying((prev) => ({ ...prev, [order.id]: true }));
      try {
        await api.patch(`/orders/${order.id}/re-confirm`);
        toast.success(t("messages.retrySuccess") || "Order re-confirmed successfully");
        fetchOrders();
      } catch (error) {
        console.error("Error retrying order", error);
        toast.error(error.response?.data?.message || t("messages.retryError") || "Error re-confirming order");
      } finally {
        setRetrying((prev) => ({ ...prev, [order.id]: false }));
      }
    },
    [fetchOrders, t]
  );

  const columns = useMemo(
    () => [
      {
        key: "orderNumber",
        header: t("table.orderNumber"),
        cell: (row) => <span className="font-mono font-bold text-primary">{row.orderNumber}</span>,
      },
      {
        key: "customerName",
        header: t("table.customer"),
        cell: (row) => <span className="font-semibold">{row.customerName}</span>,
      },
      {
        key: "phoneNumber",
        header: t("table.phone"),
        cell: (row) => <span className="font-mono text-slate-500 text-sm">{row.phoneNumber}</span>,
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
        cell: (row) => <span className="text-sm text-slate-500">{row.rejectedAt ? new Date(row.rejectedAt).toLocaleString() : "—"}</span>,
      },
      {
        key: "assignedEmployee",
        header: t("table.employee"),
        cell: (row) => row.rejectedBy?.name || "—",
      },
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
                permission: "orders.read",
              },
              {
                icon: retrying[row.id] ? <Loader2 className="animate-spin" /> : <RefreshCw />,
                tooltip: t("actions.retryToConfirmed"),
                onClick: (r) => handleRetry(r),
                variant: "orange",
                disabled: !!retrying[row.id],
                permission: "order.update",
              },
            ]}
          />
        ),
      },
    ],
    [t, handleRetry, retrying]
  );
  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          // { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.rejected") },
        ]}
        buttons={<Button_ size="sm" label={t("howItWorks")} variant="ghost" onClick={() => { }} icon={<Info size={18} />} permission="orders.read" />}
        stats={stats}
      />

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => fetchOrders(1, pager.per_page)}
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
            icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />,
            color: "blue",
            onClick: onExport,
            disabled: exportLoading,
            permission: "orders.read",
          },
        ]}
        hasActiveFilters={false}
        onApplyFilters={() => { }}
        filters={null}
        columns={columns}
        data={pager.records}
        isLoading={loading}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
      />

      <RejectedOrderDetailModal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        order={detailModal}
      />
    </div>
  );
}