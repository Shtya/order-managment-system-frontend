"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Package,
  FileDown,
  AlertCircle,
  FileText,
  PenLine,
  Download,
  FileX,
  Info,
  Eye,
  X,
  Hash,
  Truck,
  User,
  Calendar,
  FileStack,
  Loader2,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "../../../../components/atoms/Pageheader";
import api from "@/utils/api";
import { useExport } from "@/hook/useExport";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import StoreFilter from "@/components/atoms/StoreFilter";
import ProductFilter from "@/components/atoms/ProductFilter";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { pdf } from "@react-pdf/renderer";
import GenericOpPDF from "../atoms/GenericOpPDF";


const DS = {
  radius: "rounded-lg",
  radiusSm: "rounded-md",
  radiusXl: "rounded-xl",
  primary: "var(--primary)",
  accent: "#6763af",
  success: "#10b981",
  danger: "#ef4444",
  warning: "var(--third)",
  headerGradient: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
  dangerGradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
};

const OPERATION_TYPE_KEYS = {
  CONFIRMED: "opTypes.orderConfirmed",
  COURIER_ASSIGNED: "opTypes.assignCarrier",
  PREPARATION_STARTED: "opTypes.preparationStarted",
  WAYBILL_PRINTED: "opTypes.printLabel",
  WAYBILL_REPRINTED: "opTypes.reprintLabel",
  OUTGOING_DISPATCHED: "opTypes.shipOrder",
  MANIFEST_PRINTED: "opTypes.printManifest",
  MANIFEST_REPRINTED: "opTypes.reprintManifest",
  REJECTED: "opTypes.rejectOrder",
  RETURN: "opTypes.returnRequested",
  RETURN_RECEIVED: "opTypes.returnOrder",
  RETRY_ATTEMPT: "opTypes.retryOrder",
};

// ─────────────────────────────────────────────────────────────
// SHARED HEADER PRIMITIVES
// ─────────────────────────────────────────────────────────────
function HeaderBadge({ children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "bg-white/20 text-white",
        "text-[11px] font-semibold px-2.5 py-1.5",
        DS.radiusSm,
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
        "bg-white/20 hover:bg-white/30 transition-colors",
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN LOGS TAB
// ─────────────────────────────────────────────────────────────
export default function LogsTab({ orders = [] }) {
  const t = useTranslations("warehouse.logs");
  const { formatCurrency } = usePlatformSettings();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);
  const [filters, setFilters] = useState({
    actionType: "all",
    result: "all",
    carrier: "all",
    date: "",
  });
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [logStats, setLogStats] = useState({
    totalOperations: 0,
    successCount: 0,
    failedCount: 0,
    rawSuccessRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const { handleExport, exportLoading } = useExport();

  const [orderLogModal, setOrderLogModal] = useState(null);
  const [genericOpModal, setGenericOpModal] = useState(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const buildParams = (page = pager.current_page, per_page = pager.per_page) => {
    const params = {
      page,
      limit: per_page,
    };

    if (search) params.search = search;
    if (filters.actionType !== "all")
      params.actionType = filters.actionType;
    if (filters.result !== "all")
      params.result = filters.result;
    if (filters.carrier !== "all")
      params.shippingCompanyId = filters.carrier;
    if (filters.date) {
      params.startDate = filters.date;
      params.endDate = filters.date;
    }

    return params;
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/orders/stats/logs");
      if (res.data) setLogStats(res.data);
    } catch (e) {
      console.error("Error fetching log stats", e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchLogs = async (page = pager.current_page, per_page = pager.per_page) => {
    try {
      setLoading(true);
      const params = buildParams(page, per_page);
      const res = await api.get("/orders/logs", { params });
      const data = res.data || {};
      setPager({
        total_records: data.total_records || 0,
        current_page: data.current_page || page,
        per_page: data.per_page || per_page,
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (e) {
      console.error("Error fetching logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handlePageChange(1, pager.per_page);
    
  }, [debouncedSearch]);

  const handlePageChange = ({ page, per_page }) => {
    fetchLogs(page, per_page);
  };

  const applyFilters = () => {
     fetchLogs(1, per_page);
  };

  const onExport = async () => {
    const params = buildParams(1, 100000);
    delete params.page;
    delete params.limit;
    await handleExport({
      endpoint: "/orders/logs/export",
      params,
      filename: `warehouse_logs_${Date.now()}.xlsx`,
    });
  };

  const hasActiveFilters =
    filters.actionType !== "all" ||
    filters.result !== "all" ||
    filters.carrier !== "all" ||
    !!filters.date;

  const stats = [
    {
      id: "total-ops",
      name: t("stats.totalOps"),
      value: logStats.totalOperations,
      icon: ClipboardList,
      color: "#64748b",
      sortOrder: 0,
    },
    {
      id: "success",
      name: t("stats.success"),
      value: logStats.successCount,
      icon: CheckCircle2,
      color: "#10b981",
      sortOrder: 1,
    },
    {
      id: "failed",
      name: t("stats.failed"),
      value: logStats.failedCount,
      icon: XCircle,
      color: "#ef4444",
      sortOrder: 2,
    },
    {
      id: "rate",
      name: t("stats.successRate"),
      value: `${logStats.rawSuccessRate}%`,
      icon: Package,
      color: "#a855f7",
      sortOrder: 3,
    },
  ];

  const openSingleLog = (op) => setOrderLogModal(op);
  const openGenericLog = (op) => setGenericOpModal(op);

  const columns = useMemo(
    () => [
      {
        key: "operationNumber",
        header: t("table.opNumber"),
        cell: (row) => (
          <span className="font-mono font-bold text-primary text-xs">
            {row.operationNumber}
          </span>
        ),
      },
      {
        key: "actionType",
        header: t("table.opType"),
        cell: (row) => (
          <span className="text-sm font-medium">
            {t(OPERATION_TYPE_KEYS[row.actionType] ?? "opTypes.unknown")}
          </span>
        ),
      },
      {
        key: "orderCode",
        header: t("table.orderNumber"),
        cell: (row) => (
          <span className="font-mono text-sm font-semibold">
            {row.order?.orderNumber || "—"}
          </span>
        ),
      },
      {
        key: "carrier",
        header: t("table.carrier"),
        cell: (row) => row.shippingCompany?.name || "—",
      },
      {
        key: "employee",
        header: t("table.employee"),
        cell: (row) => row.user?.name || "—",
      },
      {
        key: "result",
        header: t("table.result"),
        cell: (row) => (
          <Badge
            className={cn(
              "rounded-full text-xs border",
              row.result === "SUCCESS"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {row.result === "SUCCESS"
              ? t("result.success")
              : t("result.failed")}
          </Badge>
        ),
      },
      {
        key: "details",
        header: t("table.details"),
        cell: (row) => (
          <span
            className="text-sm text-slate-500 truncate max-w-[200px]"
            title={row.details}
          >
            {row.details}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: t("table.datetime"),
        cell: (row) => (
          <span className="text-sm text-slate-500 font-mono">
            {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
          </span>
        ),
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
                tooltip: t("actions.viewOperationLog"),
                onClick: (r) => openGenericLog(r),
                variant: "primary",
                permission: "orders.read",
              },
            ]}
          />
        ),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/dashboard" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.logs") },
        ]}
        stats={stats}
      />

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
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
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileDown size={14} />
            ),
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "orders.read",
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        filters={
          <>
            <FilterField label={t("table.opType")}>
              <Select
                value={filters.actionType}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, actionType: v }))
                }
              >
                <SelectTrigger className="h-10 min-w-[160px] rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  {Object.entries(OPERATION_TYPE_KEYS).map(
                    ([key, labelKey]) => (
                      <SelectItem key={key} value={key}>
                        {t(labelKey)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("table.result")}>
              <Select
                value={filters.result}
                onValueChange={(v) => setFilters((f) => ({ ...f, result: v }))}
              >
                <SelectTrigger className="h-10 min-w-[140px] rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.allResults")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allResults")}</SelectItem>
                  <SelectItem value="SUCCESS">{t("result.success")}</SelectItem>
                  <SelectItem value="FAILED">{t("result.failed")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <ShippingCompanyFilter
              value={filters.carrier}
              onChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}
            />

            <FilterField label={t("table.datetime")}>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, date: e.target.value }))
                }
                className="h-10 rounded-xl text-sm"
              />
            </FilterField>
          </>
        }
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

      <OrderLogModal
        open={!!orderLogModal}
        onClose={() => setOrderLogModal(null)}
        op={orderLogModal}
        t={t}
      />

      <GenericOpModal
        open={!!genericOpModal}
        onClose={() => setGenericOpModal(null)}
        op={genericOpModal}
        orders={orders}
        t={t}
        formatCurrency={formatCurrency}
      />

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GENERIC OP MODAL
// ─────────────────────────────────────────────────────────────
function GenericOpModal({ open, onClose, op, t, formatCurrency }) {
  const locale = useLocale();
  if (!op) return null;

  const order = op.order;
  const opTypeLabel = t(
    OPERATION_TYPE_KEYS[op.actionType] ?? "opTypes.unknown",
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl"

      >
        <div
          className="relative px-6 pt-6 pb-5 rounded-t-xl overflow-hidden"
          style={{ background: DS.headerGradient }}
        >
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-sm",
                  DS.radiusSm,
                )}
              >
                <ClipboardList className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">
                  {t("genericModal.operationLabel")}
                </p>
                <h2 className="text-white text-xl font-black font-mono">
                  {op.operationNumber}
                </h2>
              </div>
            </div>

            <HeaderIconBtn onClick={onClose}>
              <X size={15} className="text-white" />
            </HeaderIconBtn>
          </div>

          <div className="relative mt-3 flex items-center gap-2 flex-wrap">
            <HeaderBadge>
              <FileText size={11} />
              {opTypeLabel}
            </HeaderBadge>
            <HeaderBadge>
              {op.result === "SUCCESS"
                ? t("result.success")
                : t("result.failed")}
            </HeaderBadge>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: t("genericModal.opType"),
                value: opTypeLabel,
                icon: ClipboardList,
                color: DS.primary,
              },
              {
                label: t("genericModal.orderNumber"),
                value: op.order?.orderNumber || "—",
                icon: Hash,
                color: DS.accent,
              },
              {
                label: t("genericModal.carrier"),
                value: op.shippingCompany?.name || "—",
                icon: Truck,
                color: DS.warning,
              },
              {
                label: t("genericModal.employee"),
                value: op.user?.name || "—",
                icon: User,
                color: DS.accent,
              },
              {
                label: t("genericModal.datetime"),
                value: op.createdAt
                  ? new Date(op.createdAt).toLocaleString()
                  : "—",
                icon: Calendar,
                color: DS.warning,
              },
              {
                label: t("genericModal.details"),
                value: op.details || "—",
                textWrap: true,
                icon: Info,

                color: DS.primary,
              },
            ].map(({ label, value, icon: Icon, color, textWrap }) => (
              <div
                key={label}
                className={cn(
                  "flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 transition-colors",
                  DS.radius,
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5",
                    DS.radiusSm,
                  )}
                  style={{ backgroundColor: color + "18" }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">
                    {label}
                  </p>
                  <p className={`font-bold text-sm text-slate-800 dark:text-slate-100 ${textWrap ? "text-wrap" : "truncate"}`}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-500">
              {t("genericModal.result")}:
            </span>
            <Badge
              className={cn(
                "rounded-full text-xs border",
                op.result === "SUCCESS"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200",
              )}
            >
              {op.result === "SUCCESS"
                ? t("result.success")
                : t("result.failed")}
            </Badge>
          </div>

          {order && (
            <div>
              <h4 className="text-sm font-bold mb-2 text-slate-600">
                {t("genericModal.orderInfo")}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: t("genericModal.customer"),
                    value: order.customerName,
                  },
                  { label: t("genericModal.city"), value: order.city },
                  {
                    label: t("genericModal.total"),
                    value: order.finalTotal
                      ? formatCurrency(order.finalTotal)
                      : "—",
                  },
                  {
                    label: t("genericModal.status"),
                    value: order.status?.name || "—",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3"
                  >
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="font-semibold text-sm">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={async () => {
              try {
                const blob = await pdf(
                  <GenericOpPDF
                    op={{
                      ...op,
                      id: op.operationNumber,
                      carrier: op.shippingCompany?.name,
                      employee: op.user?.name,
                      createdAt: op.createdAt
                        ? new Date(op.createdAt).toLocaleString()
                        : "—",
                    }}
                    order={{
                      ...order,
                      customer: order.customerName,
                      total: order.finalTotal,
                      status: order.status?.name,
                    }}
                    labels={{
                      title: t("genericPdf.title"),
                      printedAt: t("genericPdf.printedAt"),
                      opNumber: t("genericPdf.opNumber"),
                      opType: t("genericPdf.opType"),
                      opTypeLabel,
                      orderNumber: t("genericPdf.orderNumber"),
                      carrier: t("genericPdf.carrier"),
                      employee: t("genericPdf.employee"),
                      result: t("genericPdf.result"),
                      datetime: t("genericPdf.datetime"),
                      details: t("genericPdf.details"),
                      orderInfo: t("genericPdf.orderInfo"),
                      customer: t("genericPdf.customer"),
                      city: t("genericPdf.city"),
                      total: t("genericPdf.total"),
                      status: t("genericPdf.status"),
                      success: t("result.success"),
                      failed: t("result.failed"),
                    }}
                    formatCurrency={formatCurrency}
                    locale={locale}
                  />
                ).toBlob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `generic-operation-${op.operationNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (error) {
                console.error("Error generating PDF:", error);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("genericModal.downloadPdf")}
          </button>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDER LOG MODAL
// ─────────────────────────────────────────────────────────────
function OrderLogModal({ open, onClose, op, t }) {
  const locale = useLocale();
  const [signerName, setSignerName] = useState("");
  const [signed, setSigned] = useState(false);

  if (!op) return null;

  const products = op.productsSnapshot || [];
  const correctLogs = (op.scanLogs || []).filter((l) => l.success);
  const errorLogs = (op.scanLogs || []).filter((l) => !l.success);
  const order = op.orderSnapshot || {};

  const handleSign = () => {
    if (signerName.trim()) setSigned(true);
  };

  const handleClose = () => {
    setSigned(false);
    setSignerName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl"

      >
        <div
          className="relative px-6 pt-6 pb-5 rounded-t-xl overflow-hidden"
          style={{ background: DS.headerGradient }}
        >
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-sm",
                  DS.radiusSm,
                )}
              >
                <FileText className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">
                  {t("orderLogModal.fileLabel")}
                </p>
                <h2 className="text-white text-xl font-black font-mono">
                  {op.orderCode}
                </h2>
              </div>
            </div>

            <HeaderIconBtn onClick={handleClose}>
              <X size={15} className="text-white" />
            </HeaderIconBtn>
          </div>

          <div className="relative mt-3 flex items-center gap-2 flex-wrap">
            <HeaderBadge>
              <Truck size={11} />
              {op.carrier || "—"}
            </HeaderBadge>
            <HeaderBadge>
              <Calendar size={11} />
              {op.createdAt || "—"}
            </HeaderBadge>
          </div>
        </div>

        <div className="pt-3 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: t("orderLogModal.customer"),
                value: order.customer || "—",
              },
              { label: t("orderLogModal.city"), value: order.city || "—" },
              {
                label: t("orderLogModal.carrier"),
                value: op.carrier || t("common.unspecified"),
              },
              {
                label: t("orderLogModal.preparedAt"),
                value: op.createdAt || "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3"
              >
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* <button
              onClick={async () => {
                try {
                  const blob = await pdf(
                    <CorrectPrepPDF
                      prepOps={[op]}
                      labels={{
                        title: t("correctPdf.title"),
                        printedAt: t("correctPdf.printedAt"),
                        ordersCount: t("correctPdf.ordersCount"),
                        carrier: t("correctPdf.carrier"),
                        productName: t("correctPdf.productName"),
                        requested: t("correctPdf.requested"),
                        scanned: t("correctPdf.scanned"),
                        status: t("correctPdf.status"),
                        completed: t("correctPdf.completed"),
                        incomplete: t("correctPdf.incomplete"),
                        correctScans: t("correctPdf.correctScans"),
                        signatureTitle: t("correctPdf.signatureTitle"),
                        signatureText: t("correctPdf.signatureText"),
                        signerName: t("correctPdf.signerName"),
                        signature: t("correctPdf.signature"),
                        date: t("correctPdf.date"),
                      }}
                      locale={locale}
                    />
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `correct-prep-${op.orderCode}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Error generating PDF:", error);
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t("orderLogModal.correctPdf")}
            </button> */}

            {/* <button
              onClick={async () => {
                const hasErrors = [op].some(op => (op.scanLogs || []).some(l => !l.success));
                if (!hasErrors) {
                  alert(t("orderLogModal.noErrors"));
                  return;
                }
                try {
                  const blob = await pdf(
                    <ErrorsPrepPDF
                      prepOps={[op]}
                      labels={{
                        title: t("errorsPdf.title"),
                        printedAt: t("errorsPdf.printedAt"),
                        ordersCount: t("errorsPdf.ordersCount"),
                        description: t("errorsPdf.description"),
                        errorUnit: t("errorsPdf.errorUnit"),
                        error: t("errorsPdf.error"),
                        reason: t("errorsPdf.reason"),
                        time: t("errorsPdf.time"),
                      }}
                      locale={locale}
                    />
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `errors-prep-${op.orderCode}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Error generating PDF:", error);
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors"
            >
              <FileX className="w-4 h-4" />
              {t("orderLogModal.errorsPdf", { count: errorLogs.length })}
            </button> */}
          </div>

          {products.length > 0 && (
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--primary)]" />
                {t("orderLogModal.products")}
              </h4>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {[
                        t("orderLogModal.sku"),
                        t("orderLogModal.name"),
                        t("orderLogModal.requested"),
                        t("orderLogModal.scanned"),
                        t("orderLogModal.status"),
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map((p, i) => {
                      const done = (p.scannedQty || 0) >= p.requestedQty;
                      return (
                        <tr key={i} className="bg-white dark:bg-slate-900">
                          <td className="px-4 py-3 font-mono text-xs">
                            {p.sku}
                          </td>
                          <td className="px-4 py-3">{p.name}</td>
                          <td className="px-4 py-3 text-center font-mono">
                            {p.requestedQty}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {p.scannedQty || 0}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={cn(
                                "rounded-full text-xs border",
                                done
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200",
                              )}
                            >
                              {done
                                ? t("orderLogModal.completed")
                                : t("orderLogModal.incomplete")}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorLogs.length > 0 && (
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                {t("orderLogModal.scanErrors", { count: errorLogs.length })}
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {errorLogs.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200"
                  >
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                        {err.message}
                      </p>
                      {err.reason && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {err.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {correctLogs.length > 0 && (
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {t("orderLogModal.correctScans", { count: correctLogs.length })}
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {correctLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="font-medium text-emerald-800 dark:text-emerald-200">
                      {log.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <PenLine className="w-4 h-4 text-[var(--primary)]" />
              {t("orderLogModal.signatureSection")}
            </h4>

            {signed ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {t("orderLogModal.signedBy", { name: signerName })}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date().toLocaleString("ar-SA")}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  {t("orderLogModal.signatureText")}
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("orderLogModal.signerName")}
                  </label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder={t("orderLogModal.signerPlaceholder")}
                    className="h-10 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleSign}
                  disabled={!signerName.trim()}
                  className="w-full bg-[var(--primary)] hover:bg-[#e07a00] text-white gap-2"
                >
                  <PenLine size={16} />
                  {t("orderLogModal.confirmSignature")}
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              {t("close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}