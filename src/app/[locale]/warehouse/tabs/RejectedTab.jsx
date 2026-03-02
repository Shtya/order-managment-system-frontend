"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, AlertCircle, Package, Eye, Calendar, FileDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import { STATUS } from "./data";
import PageHeader from "../../../../components/atoms/Pageheader";

// ── Reason Modal ───────────────────────────────────────────────────────────────
function ReasonModal({ open, onClose, order }) {
  const t = useTranslations("warehouse.rejected");
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-xl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            {t("reasonModal.title")} — {order.code}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-medium text-red-700 mb-1">{t("reasonModal.reasonLabel")}</p>
            <p className="text-sm text-red-800 dark:text-red-200">{order.rejectReason || t("reasonModal.unspecified")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("reasonModal.customer"),   value: order.customer },
              { label: t("reasonModal.rejectedAt"), value: order.rejectedAt || "—" },
              { label: t("reasonModal.city"),       value: order.city },
              { label: t("reasonModal.employee"),   value: order.assignedEmployee },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button_ label={t("close")} tone="gray" variant="outline" onClick={onClose} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Rejected Tab ──────────────────────────────────────────────────────────
export function RejectedTab({ orders, updateOrder, pushOp }) {
  const t = useTranslations("warehouse.rejected");

  const rejectedOrders = useMemo(() => orders.filter((o) => o.status === STATUS.REJECTED), [orders]);

  const [search, setSearch] = useState("");
  const [reasonModal, setReasonModal] = useState(null);
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  const today = new Date().toISOString().split("T")[0];
  const todayCount = rejectedOrders.filter((o) => o.rejectedAt?.startsWith(today)).length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
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
      value: rejectedOrders.reduce((s, o) => s + o.products.reduce((ps, p) => ps + p.requestedQty, 0), 0),
      icon: Package,
      color: "#64748b",
      sortOrder: 3,
    },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rejectedOrders;
    return rejectedOrders.filter((o) =>
      [o.code, o.customer, o.phone, o.city, o.rejectReason].some((x) =>
        String(x || "").toLowerCase().includes(q)
      )
    );
  }, [rejectedOrders, search]);

  const handleRetry = (order) => {
    updateOrder(order.code, { status: STATUS.CONFIRMED, rejectReason: "", rejectedAt: "" });
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
  };

  const columns = useMemo(() => [
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
        <span className="text-sm text-red-600 dark:text-red-400 truncate max-w-[200px] block">
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
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setReasonModal(row)}
            className="px-3 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1">
            <Eye size={14} /> {t("actions.viewReason")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => handleRetry(row)}
            className="px-3 h-9 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1">
            <RefreshCw size={14} /> {t("actions.retryToConfirmed")}
          </motion.button>
        </div>
      ),
    },
  ], [handleRetry, t]);

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
          { key: "export", label: t("export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
        ]}
        hasActiveFilters={false}
        onApplyFilters={() => {}}
        filters={null}
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />
      <ReasonModal open={!!reasonModal} onClose={() => setReasonModal(null)} order={reasonModal} />
    </div>
  );
}