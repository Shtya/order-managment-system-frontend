"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ClipboardList, Eye, FileDown, FileText, Package, ShieldAlert, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildOrderOverviewCards, buildOrderSummarySection, openPdfDocument } from "../utils/pdf";
import { getOrderItemCount, getOrderValue } from "./data";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

const OPERATION_TYPE_KEYS = {
  ORDER_PREPARED: "orderPrepared",
  REJECT_ORDER: "rejectOrder",
  ASSIGN_CARRIER: "assignCarrier",
  PRINT_LABEL: "printLabel",
  SHIP_ORDER: "shipOrder",
  RETURN_ORDER: "returnOrder",
  RETRY_ORDER: "retryOrder",
};

function buildPreparedOrderBody(op, t, formatCurrency) {
  const order = op.orderSnapshot || { code: op.orderCode, products: op.productsSnapshot || [] };
  const successLogs = (op.scanLogs || []).filter((log) => log.success);
  const errorLogs = (op.scanLogs || []).filter((log) => !log.success);
  const productRows = (op.productsSnapshot || order.products || []).map((product) => `
    <tr>
      <td class="mono">${product.sku}</td>
      <td>${product.name}</td>
      <td>${product.requestedQty}</td>
      <td>${product.scannedQty || 0}</td>
      <td>${formatCurrency ? formatCurrency((Number(product.price) || 0) * (Number(product.requestedQty) || 0)) : `${(Number(product.price) || 0) * (Number(product.requestedQty) || 0)} ر.س`}</td>
    </tr>
  `).join("");

  const errorsSection = errorLogs.length > 0 ? `
    <section class="surface">
      <h2 class="section-title">${t("pdf.errorScans")}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${t("pdf.message")}</th>
              <th>${t("pdf.reason")}</th>
              <th>${t("pdf.time")}</th>
            </tr>
          </thead>
          <tbody>
            ${errorLogs.map((log, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${log.message}</td>
                <td>${log.reason || "—"}</td>
                <td>${log.timestamp?.slice(11, 16) || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  ` : "";

  return `
    <section class="hero hero-info">
      <h1>${t("pdf.preparedTitle")}</h1>
      <p>${t("pdf.orderCode")}: ${op.orderCode} · ${t("pdf.employee")}: ${op.employee || "System"} · ${t("pdf.date")}: ${op.createdAt}</p>
    </section>

    <section class="surface">
      ${buildOrderOverviewCards(order, {
        customer: t("pdf.customer"),
        city: t("pdf.city"),
        orderValue: t("pdf.orderValue"),
        orderSummary: t("pdf.orderSummary"),
        itemsWord: t("common.itemsWord"),
      }, formatCurrency)}
    </section>

    <section class="surface">
      <div class="summary-strip">
        <div class="summary-box"><span>${t("pdf.successScans")}</span><b>${successLogs.length}</b></div>
        <div class="summary-box"><span>${t("pdf.errorCount")}</span><b>${errorLogs.length}</b></div>
        <div class="summary-box"><span>${t("pdf.totalItems")}</span><b>${getOrderItemCount(order)}</b></div>
        <div class="summary-box"><span>${t("pdf.orderPrice")}</span><b>${formatCurrency ? formatCurrency(order.total || getOrderValue(order)) : `${order.total || getOrderValue(order)} ر.س`}</b></div>
      </div>
    </section>

    <section class="surface">
      <h2 class="section-title">${t("pdf.products")}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>${t("pdf.product")}</th>
              <th>${t("pdf.requiredQty")}</th>
              <th>${t("pdf.scannedQty")}</th>
              <th>${t("pdf.price")}</th>
            </tr>
          </thead>
          <tbody>${productRows}</tbody>
        </table>
      </div>
    </section>

    ${errorsSection}
    ${buildOrderSummarySection([order], { title: t("pdf.finalSummary"), totalOrders: t("pdf.totalOrders"), totalSkus: t("pdf.totalSkus"), totalItems: t("pdf.totalItems"), totalValue: t("pdf.totalValue") }, formatCurrency)}
  `;
}

function buildPreparedSessionBody(sessionOps, t, formatCurrency) {
  const orders = sessionOps.map((operation) => operation.orderSnapshot || { code: operation.orderCode, products: operation.productsSnapshot || [] });
  const orderBlocks = sessionOps.map((operation) => buildPreparedOrderBody(operation, t, formatCurrency)).join("");

  return `
    <section class="hero">
      <h1>${t("pdf.sessionTitle")}</h1>
      <p>${t("pdf.ordersCount", { count: sessionOps.length })}</p>
    </section>
    ${orderBlocks}
    ${buildOrderSummarySection(orders, { title: t("pdf.finalSummary"), totalOrders: t("pdf.totalOrders"), totalSkus: t("pdf.totalSkus"), totalItems: t("pdf.totalItems"), totalValue: t("pdf.totalValue") }, formatCurrency)}
  `;
}

function buildGenericBody(op, order, t, formatCurrency) {
  return `
    <section class="hero hero-info">
      <h1>${t("pdf.operationTitle")}</h1>
      <p>${t(`opTypes.${OPERATION_TYPE_KEYS[op.operationType] || "unknown"}`)} · ${op.createdAt}</p>
    </section>

    <section class="surface">
      <div class="grid cols-2">
        <div class="meta-card"><span class="meta-label">${t("pdf.operationType")}</span><div class="meta-value">${t(`opTypes.${OPERATION_TYPE_KEYS[op.operationType] || "unknown"}`)}</div></div>
        <div class="meta-card"><span class="meta-label">${t("pdf.orderCode")}</span><div class="meta-value mono">${op.orderCode || "—"}</div></div>
        <div class="meta-card"><span class="meta-label">${t("pdf.employee")}</span><div class="meta-value">${op.employee || "System"}</div></div>
        <div class="meta-card"><span class="meta-label">${t("pdf.result")}</span><div class="meta-value">${op.result}</div></div>
        <div class="meta-card"><span class="meta-label">${t("pdf.carrier")}</span><div class="meta-value">${op.carrier || "—"}</div></div>
        <div class="meta-card"><span class="meta-label">${t("pdf.details")}</span><div class="meta-value">${op.details || "—"}</div></div>
      </div>
    </section>

    ${order ? `
      <section class="surface">
        ${buildOrderOverviewCards(order, { customer: t("pdf.customer"), city: t("pdf.city"), orderValue: t("pdf.orderValue"), orderSummary: t("pdf.orderSummary"), itemsWord: t("common.itemsWord") }, formatCurrency)}
      </section>
      ${buildOrderSummarySection([order], { title: t("pdf.finalSummary"), totalOrders: t("pdf.totalOrders"), totalSkus: t("pdf.totalSkus"), totalItems: t("pdf.totalItems"), totalValue: t("pdf.totalValue") }, formatCurrency)}
    ` : ""}
  `;
}

function LogDetailsDialog({ log, sessionLogs, open, onClose, orders, t }) {
  const { formatCurrency } = usePlatformSettings();
  if (!log) return null;
  const relatedOrder = orders.find((order) => order.code === log.orderCode);
  const isPreparedLog = log.operationType === "ORDER_PREPARED";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl bg-white p-0 dark:bg-slate-900" dir="rtl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
            <ClipboardList size={20} className="text-primary" />
            {t("dialog.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              [t("fields.operationType"), t(`opTypes.${OPERATION_TYPE_KEYS[log.operationType] || "unknown"}`)],
              [t("fields.orderCode"), log.orderCode],
              [t("fields.employee"), log.employee],
              [t("fields.carrier"), log.carrier || t("common.none")],
              [t("fields.result"), log.result],
              [t("fields.createdAt"), log.createdAt],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-bold text-muted-foreground">{label}</p>
                <p className="text-sm font-black text-foreground">{value || t("common.none")}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
            <p className="font-black text-foreground">{t("fields.details")}</p>
            <p className="mt-2">{log.details || t("common.none")}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isPreparedLog ? (
              <>
                <Button onClick={() => openPdfDocument({ title: t("pdf.preparedTitle"), filename: `${log.orderCode}_prepared.pdf`, body: buildPreparedOrderBody(log, t, formatCurrency) })}>{t("actions.openOrderPdf")}</Button>
                {sessionLogs.length > 1 ? <Button variant="outline" onClick={() => openPdfDocument({ title: t("pdf.sessionTitle"), filename: `prepared_session_${log.createdAt?.slice(0, 10) || "session"}.pdf`, body: buildPreparedSessionBody(sessionLogs, t, formatCurrency) })}>{t("actions.openSessionPdf")}</Button> : null}
              </>
            ) : (
              <Button onClick={() => openPdfDocument({ title: t("pdf.operationTitle"), filename: `${log.id}.pdf`, body: buildGenericBody(log, relatedOrder, t, formatCurrency) })}>{t("actions.openPdf")}</Button>
            )}
            <Button variant="outline" onClick={onClose}>{t("common.close")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LogsTab({ opsLogs, orders = [] }) {
  const t = useTranslations("warehouse.logs");
  const [search, setSearch] = useState("");
  const [operationType, setOperationType] = useState("all");
  const [result, setResult] = useState("all");
  const [carrier, setCarrier] = useState("all");
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });
  const [selectedLog, setSelectedLog] = useState(null);

  const carriers = useMemo(() => [...new Set(opsLogs.map((log) => log.carrier).filter(Boolean))], [opsLogs]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return opsLogs.filter((log) => {
      if (operationType !== "all" && log.operationType !== operationType) return false;
      if (result !== "all" && log.result !== result) return false;
      if (carrier !== "all" && log.carrier !== carrier) return false;
      if (query && ![log.id, log.orderCode, log.employee, log.details, log.carrier].some((value) => String(value || "").toLowerCase().includes(query))) return false;
      return true;
    });
  }, [carrier, operationType, opsLogs, result, search]);

  const sessionLogs = useMemo(() => {
    if (!selectedLog || selectedLog.operationType !== "ORDER_PREPARED") return [];
    return opsLogs.filter((log) => log.operationType === "ORDER_PREPARED" && log.createdAt === selectedLog.createdAt);
  }, [opsLogs, selectedLog]);

  const successCount = opsLogs.filter((log) => log.result === "SUCCESS").length;
  const failedCount = opsLogs.filter((log) => log.result === "FAILED").length;
  const successRate = opsLogs.length > 0 ? Math.round((successCount / opsLogs.length) * 100) : 0;

  const stats = [
    { id: "total", name: t("stats.totalOperations"), value: opsLogs.length, icon: ClipboardList, color: "#64748b", sortOrder: 0 },
    { id: "success", name: t("stats.success"), value: successCount, icon: CheckCircle2, color: "#10b981", sortOrder: 1 },
    { id: "failed", name: t("stats.failed"), value: failedCount, icon: XCircle, color: "#ef4444", sortOrder: 2 },
    { id: "rate", name: t("stats.successRate"), value: `${successRate}%`, icon: Package, color: "#8b5cf6", sortOrder: 3 },
  ];

  const columns = useMemo(() => [
    {
      key: "id",
      header: t("fields.id"),
      cell: (row) => <span className="font-mono text-sm font-black text-primary">{row.id}</span>,
    },
    {
      key: "operationType",
      header: t("fields.operationType"),
      cell: (row) => <span className="text-sm font-bold text-foreground">{t(`opTypes.${OPERATION_TYPE_KEYS[row.operationType] || "unknown"}`)}</span>,
    },
    {
      key: "orderCode",
      header: t("fields.orderCode"),
      cell: (row) => <span className="font-mono text-sm font-black text-foreground">{row.orderCode}</span>,
    },
    { key: "carrier", header: t("fields.carrier") },
    { key: "employee", header: t("fields.employee") },
    {
      key: "result",
      header: t("fields.result"),
      cell: (row) => <Badge className={`rounded-full border ${row.result === "SUCCESS" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{row.result}</Badge>,
    },
    {
      key: "details",
      header: t("fields.details"),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.details}</span>,
    },
    {
      key: "actions",
      header: t("fields.actions"),
      cell: (row) => (
        <button type="button" onClick={() => setSelectedLog(row)} className="rounded-full border border-primary/20 bg-primary/8 px-3 py-2 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
          <span className="inline-flex items-center gap-2"><Eye size={14} />{t("actions.view")}</span>
        </button>
      ),
    },
  ], [t]);

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.logs") },
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
        hasActiveFilters={operationType !== "all" || result !== "all" || carrier !== "all"}
        onApplyFilters={() => {}}
        filters={
          <>
            <FilterField label={t("fields.operationType")}>
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filters.allOperations")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allOperations")}</SelectItem>
                  {Object.entries(OPERATION_TYPE_KEYS).map(([value, label]) => <SelectItem key={value} value={value}>{t(`opTypes.${label}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("fields.result")}>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filters.allResults")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allResults")}</SelectItem>
                  <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("fields.carrier")}>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("filters.allCarriers")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
                  {carriers.map((carrierOption) => <SelectItem key={carrierOption} value={carrierOption}>{carrierOption}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
          </>
        }
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: nextPage, per_page: perPage }) => setPage({ current_page: nextPage, per_page: perPage })}
      />

      <LogDetailsDialog log={selectedLog} sessionLogs={sessionLogs} open={!!selectedLog} onClose={() => setSelectedLog(null)} orders={orders} t={t} />
    </div>
  );
}
