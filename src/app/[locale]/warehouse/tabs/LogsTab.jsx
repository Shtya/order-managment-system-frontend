"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
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
import { useTranslations } from "next-intl";
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
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import StoreFilter from "@/components/atoms/StoreFilter";
import ProductFilter from "@/components/atoms/ProductFilter";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

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
// PDF HELPERS
// ─────────────────────────────────────────────────────────────
function openPrintWindow(htmlContent, popupMessage) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert(popupMessage);
    return;
  }
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 600);
}

const PDF_STYLE = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; color: #1e293b; background: #fff; padding: 28px 32px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 15px; font-weight: 700; margin: 20px 0 8px; color: #334155; }
    .subtitle { font-size: 12px; color: #64748b; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .badge-ok { background:#dcfce7; color:#16a34a; border:1px solid #bbf7d0; }
    .badge-err { background:#fee2e2; color:#dc2626; border:1px solid #fecaca; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
    .info-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px; }
    .info-label { font-size:10px; color:#94a3b8; text-transform:uppercase; margin-bottom:3px; letter-spacing:.05em; }
    .info-value { font-size:13px; font-weight:600; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    thead { background:#f1f5f9; }
    th { text-align:right; padding:9px 12px; font-weight:600; color:#475569; border-bottom:2px solid #e2e8f0; }
    td { padding:8px 12px; border-bottom:1px solid #f1f5f9; }
    tr:last-child td { border-bottom:none; }
    .complete { color:#16a34a; font-weight:600; }
    .incomplete { color:#d97706; font-weight:600; }
    .err-row { background:#fff7f7; }
    .err-msg { font-weight:600; color:#dc2626; }
    .err-reason { font-size:11px; color:#94a3b8; }
    .sig-box { margin-top:32px; border:2px dashed #cbd5e1; border-radius:12px; padding:22px; }
    .sig-title { font-size:13px; font-weight:700; margin-bottom:14px; color:#334155; }
    .sig-row { display:flex; gap:20px; margin-top:10px; }
    .sig-field { flex:1; border-bottom:1px solid #94a3b8; padding-bottom:6px; }
    .sig-field-label { font-size:11px; color:#94a3b8; margin-bottom:28px; }
    .header-bar { background:linear-gradient(135deg,var(--primary),var(--secondary)); color:#fff; padding:16px 20px; border-radius:12px; margin-bottom:20px; }
    .header-bar.err-bar { background:linear-gradient(135deg,#dc2626,#b91c1c); }
    .header-bar.info-bar { background:linear-gradient(135deg,#3b82f6,#6366f1); }
    .ts { font-size:11px; color:#94a3b8; font-family:monospace; }
    @media print { body { padding:16px; } button { display:none; } }
  </style>
`;

// ─────────────────────────────────────────────────────────────
// MAIN LOGS TAB
// ─────────────────────────────────────────────────────────────
export default function LogsTab({ orders = [] }) {
  const t = useTranslations("warehouse.logs");
  const { formatCurrency } = usePlatformSettings();

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({
    value: search,
    delay: 350,
  });
  const [filters, setFilters] = useState({
    actionType: "all",
    result: "all",
    carrier: "all",
    date: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
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
  const [sessionModal, setSessionModal] = useState(null);

  const buildParams = useCallback(
    (page = pager.current_page, per_page = pager.per_page) => {
      const params = {
        page,
        limit: per_page,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (appliedFilters.actionType !== "all")
        params.actionType = appliedFilters.actionType;
      if (appliedFilters.result !== "all")
        params.result = appliedFilters.result;
      if (appliedFilters.carrier !== "all")
        params.shippingCompanyId = appliedFilters.carrier;
      if (appliedFilters.date) {
        params.startDate = appliedFilters.date;
        params.endDate = appliedFilters.date;
      }

      return params;
    },
    [pager.current_page, pager.per_page, debouncedSearch, appliedFilters],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/orders/stats/logs");
      if (res.data) setLogStats(res.data);
    } catch (e) {
      console.error("Error fetching log stats", e);
    }
  }, []);

  const fetchLogs = useCallback(
    async (page = pager.current_page, per_page = pager.per_page) => {
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
    },
    [buildParams, pager.current_page, pager.per_page],
  );

  useEffect(() => {
    fetchLogs(1, pager.per_page);
    fetchStats();
  }, [debouncedSearch, appliedFilters, fetchLogs, fetchStats]);

  const handlePageChange = ({ page, per_page }) => {
    fetchLogs(page, per_page);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
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
    appliedFilters.actionType !== "all" ||
    appliedFilters.result !== "all" ||
    appliedFilters.carrier !== "all" ||
    !!appliedFilters.date;

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

      <PrepSessionModal
        open={!!sessionModal}
        onClose={() => setSessionModal(null)}
        sessionOps={sessionModal}
        t={t}
      />
    </div>
  );
}
function buildCorrectPDF(prepOps, labels) {
  const now = new Date().toLocaleString("en-US");

  const ordersHTML = prepOps
    .map((op) => {
      const order = op.orderSnapshot || {};
      const products = op.productsSnapshot || [];
      const correctLogs = (op.scanLogs || []).filter((l) => l.success);

      const productsRows = products
        .map((p) => {
          const done = (p.scannedQty || 0) >= p.requestedQty;
          return `
            <tr>
              <td><code>${p.sku}</code></td>
              <td>${p.name}</td>
              <td style="text-align:center">${p.requestedQty}</td>
              <td style="text-align:center" class="${done ? "complete" : "incomplete"}">${p.scannedQty || 0}</td>
              <td><span class="badge ${done ? "badge-ok" : "badge-err"}">${done ? labels.completed : labels.incomplete}</span></td>
            </tr>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:15px;font-weight:700;font-family:monospace;">${op.orderCode}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">${order.customer || ""} — ${order.city || ""}</div>
            </div>
            <div style="text-align:left;">
              <div style="font-size:11px;color:#94a3b8;">${labels.carrier}</div>
              <div style="font-size:13px;font-weight:600;">${op.carrier || "—"}</div>
            </div>
          </div>
          <div style="padding:14px 16px;">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>${labels.productName}</th>
                  <th style="text-align:center">${labels.requested}</th>
                  <th style="text-align:center">${labels.scanned}</th>
                  <th>${labels.status}</th>
                </tr>
              </thead>
              <tbody>${productsRows}</tbody>
            </table>
            <div style="margin-top:10px;font-size:11px;color:#94a3b8;">${labels.correctScans}: <strong>${correctLogs.length}</strong></div>
          </div>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html><html lang="ar" ><head><meta charset="UTF-8"><title>${labels.title}</title>${PDF_STYLE}</head><body><div class="header-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px;">${labels.title}</div><div style="font-size:12px;opacity:.85;">${labels.printedAt}: ${now} | ${labels.ordersCount}: ${prepOps.length}</div></div>${ordersHTML}<div class="sig-box"><div class="sig-title">${labels.signatureTitle}</div><p style="font-size:12px;color:#64748b;margin-bottom:12px;">${labels.signatureText}</p><div class="sig-row"><div class="sig-field"><div class="sig-field-label">${labels.signerName}</div></div><div class="sig-field"><div class="sig-field-label">${labels.signature}</div></div><div class="sig-field"><div class="sig-field-label">${labels.date}</div></div></div></div></body></html>`;
}

function buildErrorsPDF(prepOps, labels) {
  const now = new Date().toLocaleString("en-US");
  const hasErrors = prepOps.some((op) =>
    (op.scanLogs || []).some((l) => !l.success),
  );
  if (!hasErrors) return null;

  const ordersHTML = prepOps
    .map((op) => {
      const errorLogs = (op.scanLogs || []).filter((l) => !l.success);
      if (errorLogs.length === 0) return "";

      const rows = errorLogs
        .map(
          (log, i) => `
          <tr class="err-row">
            <td>${i + 1}</td>
            <td class="err-msg">${log.message}</td>
            <td class="err-reason">${log.reason || "—"}</td>
            <td class="ts">${log.timestamp ? log.timestamp.slice(11, 19) : "—"}</td>
          </tr>
        `,
        )
        .join("");

      return `
        <div style="margin-bottom:24px;border:1px solid #fecaca;border-radius:12px;overflow:hidden;">
          <div style="background:#fff7f7;padding:10px 16px;border-bottom:1px solid #fecaca;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-family:monospace;font-size:14px;font-weight:700;color:#dc2626;">${op.orderCode}</div>
            <span class="badge badge-err">${errorLogs.length} ${labels.errorUnit}</span>
          </div>
          <div style="padding:12px 16px;">
            <table>
              <thead>
                <tr>
                  <th style="width:36px">#</th>
                  <th>${labels.error}</th>
                  <th>${labels.reason}</th>
                  <th>${labels.time}</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html><html lang="ar" ><head><meta charset="UTF-8"><title>${labels.title}</title>${PDF_STYLE}</head><body><div class="header-bar err-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px;">${labels.title}</div><div style="font-size:12px;opacity:.85;">${labels.printedAt}: ${now} | ${labels.ordersCount}: ${prepOps.length}</div></div><p style="font-size:13px;color:#64748b;margin-bottom:20px;">${labels.description}</p>${ordersHTML}</body></html>`;
}

function buildGenericOpPDF(op, order, labels, formatCurrency) {
  const now = new Date().toLocaleString("en-US");
  const resultColor = op.result === "SUCCESS" ? "#16a34a" : "#dc2626";
  const resultLabel = op.result === "SUCCESS" ? labels.success : labels.failed;

  return `<!DOCTYPE html><html lang="ar" ><head><meta charset="UTF-8"><title>${labels.title} ${op.id}</title>${PDF_STYLE}</head><body><div class="header-bar info-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px;">${labels.title} — ${labels.opTypeLabel}</div><div style="font-size:12px;opacity:.85;">${labels.printedAt}: ${now} | ${labels.opNumber}: ${op.id}</div></div><div class="info-grid"><div class="info-card"><div class="info-label">${labels.opNumber}</div><div class="info-value" style="font-family:monospace">${op.id}</div></div><div class="info-card"><div class="info-label">${labels.opType}</div><div class="info-value">${labels.opTypeLabel}</div></div><div class="info-card"><div class="info-label">${labels.orderNumber}</div><div class="info-value" style="font-family:monospace">${op.orderCode || "—"}</div></div><div class="info-card"><div class="info-label">${labels.carrier}</div><div class="info-value">${op.carrier || "—"}</div></div><div class="info-card"><div class="info-label">${labels.employee}</div><div class="info-value">${op.employee || "—"}</div></div><div class="info-card"><div class="info-label">${labels.result}</div><div class="info-value" style="color:${resultColor}">${resultLabel}</div></div><div class="info-card"><div class="info-label">${labels.datetime}</div><div class="info-value" style="font-family:monospace;font-size:12px">${op.createdAt || "—"}</div></div><div class="info-card"><div class="info-label">${labels.details}</div><div class="info-value">${op.details || "—"}</div></div></div>${order ? `<h2>${labels.orderInfo}</h2><div class="info-grid"><div class="info-card"><div class="info-label">${labels.customer}</div><div class="info-value">${order.customer || "—"}</div></div><div class="info-card"><div class="info-label">${labels.city}</div><div class="info-value">${order.city || "—"}</div></div><div class="info-card"><div class="info-label">${labels.total}</div><div class="info-value">${order.finalTotal ? formatCurrency(order.finalTotal) : "—"}</div></div><div class="info-card"><div class="info-label">${labels.status}</div><div class="info-value">${order.status || "—"}</div></div></div>` : ""}</body></html>`;
}

// ─────────────────────────────────────────────────────────────
// GENERIC OP MODAL
// ─────────────────────────────────────────────────────────────
function GenericOpModal({ open, onClose, op, t, formatCurrency }) {
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
                icon: Info,
                color: DS.primary,
              },
            ].map(({ label, value, icon: Icon, color }) => (
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
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
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
            onClick={() =>
              openPrintWindow(
                buildGenericOpPDF(
                  {
                    ...op,
                    id: op.operationNumber,
                    carrier: op.shippingCompany?.name,
                    employee: op.user?.name,
                    createdAt: op.createdAt
                      ? new Date(op.createdAt).toLocaleString()
                      : "—",
                  },
                  {
                    ...order,
                    customer: order.customerName,
                    total: order.finalTotal,
                    status: order.status?.name,
                  },
                  {
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
                    currency: t("common.currency"),
                    success: t("result.success"),
                    failed: t("result.failed"),
                  },
                  formatCurrency,
                ),
                t("popupBlocked"),
              )
            }
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
            <button
              onClick={() =>
                openPrintWindow(
                  buildCorrectPDF([op], {
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
                  }),
                  t("popupBlocked"),
                )
              }
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t("orderLogModal.correctPdf")}
            </button>

            <button
              onClick={() => {
                const html = buildErrorsPDF([op], {
                  title: t("errorsPdf.title"),
                  printedAt: t("errorsPdf.printedAt"),
                  ordersCount: t("errorsPdf.ordersCount"),
                  description: t("errorsPdf.description"),
                  errorUnit: t("errorsPdf.errorUnit"),
                  error: t("errorsPdf.error"),
                  reason: t("errorsPdf.reason"),
                  time: t("errorsPdf.time"),
                });
                if (!html) {
                  alert(t("orderLogModal.noErrors"));
                  return;
                }
                openPrintWindow(html, t("popupBlocked"));
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors"
            >
              <FileX className="w-4 h-4" />
              {t("orderLogModal.errorsPdf", { count: errorLogs.length })}
            </button>
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

// ─────────────────────────────────────────────────────────────
// PREP SESSION MODAL
// ─────────────────────────────────────────────────────────────
function PrepSessionModal({ open, onClose, sessionOps, t }) {
  if (!sessionOps || sessionOps.length === 0) return null;

  const totalErrors = sessionOps.reduce(
    (s, op) => s + (op.scanLogs || []).filter((l) => !l.success).length,
    0,
  );
  const totalCorrect = sessionOps.reduce(
    (s, op) => s + (op.scanLogs || []).filter((l) => l.success).length,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-xl rounded-xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl"

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
                <FileStack className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">
                  {t("sessionModal.sessionLabel")}
                </p>
                <h2 className="text-white text-xl font-black">
                  {t("sessionModal.title")}
                </h2>
              </div>
            </div>

            <HeaderIconBtn onClick={onClose}>
              <X size={15} className="text-white" />
            </HeaderIconBtn>
          </div>

          <div className="relative mt-3 flex items-center gap-2 flex-wrap">
            <HeaderBadge>
              {t("sessionModal.ordersCount", { count: sessionOps.length })}
            </HeaderBadge>
          </div>
        </div>

        <div className="pt-4 p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{sessionOps.length}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t("sessionModal.preparedOrders")}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-700">
                {totalCorrect}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                {t("sessionModal.correctScans")}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 text-center border border-red-200">
              <p className="text-2xl font-bold text-red-600">{totalErrors}</p>
              <p className="text-xs text-red-500 mt-1">
                {t("sessionModal.errorScans")}
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessionOps.map((op) => {
              const errs = (op.scanLogs || []).filter((l) => !l.success).length;
              const prods = op.productsSnapshot || [];
              const done = prods.every(
                (p) => (p.scannedQty || 0) >= p.requestedQty,
              );

              return (
                <div
                  key={op.orderCode}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="font-mono font-bold text-sm">
                      {op.orderCode}
                    </span>
                    <span className="text-xs text-slate-400">{op.carrier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {errs > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        {t("sessionModal.errorsBadge", { count: errs })}
                      </span>
                    )}
                    <Badge
                      className={cn(
                        "rounded-full text-xs border",
                        done
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200",
                      )}
                    >
                      {done
                        ? t("sessionModal.completed")
                        : t("sessionModal.incomplete")}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() =>
                openPrintWindow(
                  buildCorrectPDF(sessionOps, {
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
                  }),
                  t("popupBlocked"),
                )
              }
              className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-5 h-5" />
              <div className="text-right">
                <p className="font-bold text-sm">
                  {t("sessionModal.correctPdfTitle")}
                </p>
                <p className="text-xs font-normal opacity-75">
                  {t("sessionModal.correctPdfDesc")}
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                const html = buildErrorsPDF(sessionOps, {
                  title: t("errorsPdf.title"),
                  printedAt: t("errorsPdf.printedAt"),
                  ordersCount: t("errorsPdf.ordersCount"),
                  description: t("errorsPdf.description"),
                  errorUnit: t("errorsPdf.errorUnit"),
                  error: t("errorsPdf.error"),
                  reason: t("errorsPdf.reason"),
                  time: t("errorsPdf.time"),
                });
                if (!html) {
                  alert(t("sessionModal.noErrors"));
                  return;
                }
                openPrintWindow(html, t("popupBlocked"));
              }}
              disabled={totalErrors === 0}
              className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 font-semibold hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileX className="w-5 h-5" />
              <div className="text-right">
                <p className="font-bold text-sm">
                  {t("sessionModal.errorsPdfTitle", { count: totalErrors })}
                </p>
                <p className="text-xs font-normal opacity-75">
                  {t("sessionModal.errorsPdfDesc")}
                </p>
              </div>
            </button>
          </div>

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
