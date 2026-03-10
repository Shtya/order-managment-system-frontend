"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, Eye, FileDown, Package, RefreshCw, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import Table from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STATUS, getOrderItemCount } from "./data";

function ReasonDialog({ open, onClose, order, t }) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl bg-white p-0 dark:bg-slate-900" dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
            <AlertTriangle size={18} className="text-red-500" />
            {t("dialog.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 py-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="mb-1 text-xs font-bold text-red-500">{t("fields.reason")}</p>
            <p className="text-sm font-black text-red-700">{order.rejectReason || t("common.none")}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              [t("fields.orderCode"), order.code],
              [t("fields.customer"), order.customer],
              [t("fields.city"), order.city],
              [t("fields.employee"), order.assignedEmployee],
              [t("fields.rejectedAt"), order.rejectedAt || t("common.none")],
              [t("fields.source"), order.rejectedFrom || t("common.none")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-bold text-muted-foreground">{label}</p>
                <p className="text-sm font-black text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button_ label={t("common.close")} tone="gray" variant="outline" onClick={onClose} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RejectedTab({ orders, updateOrder, pushOp }) {
  const t = useTranslations("warehouse.rejected");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const rejectedOrders = useMemo(() => orders.filter((order) => order.status === STATUS.REJECTED), [orders]);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rejectedOrders.filter((order) => order.rejectedAt?.startsWith(today)).length;
  const thisWeek = rejectedOrders.filter((order) => {
    if (!order.rejectedAt) return false;
    const rejectedAt = new Date(order.rejectedAt);
    const now = new Date();
    const diff = now.getTime() - rejectedAt.getTime();
    return diff <= 1000 * 60 * 60 * 24 * 7;
  }).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rejectedOrders;
    return rejectedOrders.filter((order) => [order.code, order.customer, order.city, order.rejectReason, order.rejectedFrom].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [rejectedOrders, search]);

  const handleRetry = (order) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    updateOrder(order.code, {
      status: STATUS.CONFIRMED,
      rejectReason: "",
      rejectedAt: "",
      rejectedFrom: "",
    });
    pushOp({
      id: `OP-${Date.now()}`,
      operationType: "RETRY_ORDER",
      orderCode: order.code,
      carrier: order.carrier || "-",
      employee: "System",
      result: "SUCCESS",
      details: t("retryOperation"),
      createdAt: now,
    });
  };

  const columns = useMemo(() => [
    {
      key: "code",
      header: t("fields.orderCode"),
      cell: (row) => <span className="font-mono text-sm font-black text-primary">{row.code}</span>,
    },
    {
      key: "customer",
      header: t("fields.customer"),
      cell: (row) => <span className="font-bold text-foreground">{row.customer}</span>,
    },
    { key: "city", header: t("fields.city") },
    {
      key: "reason",
      header: t("fields.reason"),
      cell: (row) => <span className="text-sm text-red-600">{row.rejectReason || t("common.none")}</span>,
    },
    {
      key: "rejectedAt",
      header: t("fields.rejectedAt"),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.rejectedAt || t("common.none")}</span>,
    },
    {
      key: "source",
      header: t("fields.source"),
      cell: (row) => <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">{row.rejectedFrom || t("common.none")}</span>,
    },
    {
      key: "actions",
      header: t("fields.actions"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSelectedOrder(row)} className="rounded-full border border-primary/20 bg-primary/8 px-3 py-2 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><span className="inline-flex items-center gap-2"><Eye size={14} />{t("actions.view")}</span></button>
          <button type="button" onClick={() => handleRetry(row)} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition-colors hover:bg-amber-600 hover:text-white"><span className="inline-flex items-center gap-2"><RefreshCw size={14} />{t("actions.retry")}</span></button>
        </div>
      ),
    },
  ], [t]);

  const stats = [
    { id: "total", name: t("stats.totalRejected"), value: rejectedOrders.length, icon: XCircle, color: "#ef4444", sortOrder: 0 },
    { id: "today", name: t("stats.today"), value: todayCount, icon: Calendar, color: "#f59e0b", sortOrder: 1 },
    { id: "week", name: t("stats.thisWeek"), value: thisWeek, icon: AlertTriangle, color: "#8b5cf6", sortOrder: 2 },
    { id: "items", name: t("stats.totalItems"), value: rejectedOrders.reduce((sum, order) => sum + getOrderItemCount(order), 0), icon: Package, color: "#64748b", sortOrder: 3 },
  ];

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
          searchPlaceholder: t("search"),
          filter: t("common.filter"),
          apply: t("common.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: t("emptyTitle"),
          emptySubtitle: "",
        }}
        actions={[
          { key: "export", label: t("actions.export"), icon: <FileDown size={14} />, color: "blue", onClick: () => {} },
        ]}
        hasActiveFilters={false}
        onApplyFilters={() => {}}
        filters={null}
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: nextPage, per_page: perPage }) => setPage({ current_page: nextPage, per_page: perPage })}
      />

      <ReasonDialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} order={selectedOrder} t={t} />
    </div>
  );
}
