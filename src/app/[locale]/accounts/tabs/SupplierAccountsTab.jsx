"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Building2,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  Eye,
  Download,
  Ban,
  History,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────────────────────
// Small Helper Components
// ─────────────────────────────────────────────────────────────────────────


function MiniTable({ columns, data, maxH = "auto" }) {
  return (
    <div className="overflow-auto" style={{ maxHeight: maxH }}>
      <table className="w-full text-right border-separate border-spacing-y-2">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2 py-1">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="bg-muted/30 hover:bg-muted/50 transition-colors">
              {columns.map((col, colIn) => (
                <td key={colIn} className="px-2 py-2 first:rounded-r-xl last:rounded-l-xl border-y border-border/50 first:border-r last:border-l">
                  {col.cell ? col.cell(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-xs text-muted-foreground italic">
                لا توجد بيانات متاحة
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SupplierAccountsTab() {
  const tCommon = useTranslations("accounts");
  const tOrders = useTranslations("orders");
  const t = useTranslations("accounts");
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
  });

  const { debouncedValue: debouncedSearch } = useDebounce({
    value: search,
    delay: 300,
  });

  const { handleExport, exportLoading } = useExport();

  // Modals Visibility
  const [statementSupplier, setStatementSupplier] = useState(null);
  const [closingSupplier, setClosingSupplier] = useState(null);
  const [historySupplier, setHistorySupplier] = useState(null);

  const fetchSuppliers = async (page = pager.current_page, limit = pager.per_page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
      };
      const res = await api.get("/suppliers", { params });
      setSuppliers(res.data.records || []);
      setPager({
        total_records: res.data.total_records || 0,
        current_page: res.data.current_page || page,
        per_page: res.data.per_page || limit,
      });
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      toast.error(tCommon("manualExpenses.messages.fetchError"));
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [debouncedSearch]);

  const handlePageChange = ({ page, per_page }) => {
    fetchSuppliers(page, per_page);
  };

  const onExport = async () => {
    await handleExport({
      endpoint: "/suppliers/export",
      params: { search: debouncedSearch.trim() || undefined },
      filename: `suppliers_accounts_${Date.now()}.xlsx`,
    });
  };

  const columns = useMemo(() => [
    {
      key: "name",
      header: t("supplierAccounts.columns.supplierName"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-muted-foreground" />
          <span className="text-sm font-bold">{row.name}</span>
        </div>
      )
    },
    {
      key: "lastClosingEndDate",
      header: t("supplierAccounts.columns.lastClosing"),
      cell: (row) => (
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {row.lastClosingEndDate ? new Date(row.lastClosingEndDate).toLocaleDateString() : "لم يتم التقفيل"}
        </span>
      )
    },
    {
      key: "dueBalance",
      header: t("supplierAccounts.columns.pendingBalance"),
      cell: (row) => {
        const balance = Number(row.dueBalance || 0);
        return (
          <span className={cn(
            "text-sm font-black tabular-nums p-1.5 px-2.5 rounded-md",
            balance > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
          )}>
            {Math.abs(balance).toLocaleString()}
            <span className="text-[10px] font-normal mr-1">
              ({balance > 0 ? t('overview.payable') : t('overview.receivable')})
            </span>
          </span>
        );
      }
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            {
              icon: <FileText />,
              tooltip: t("supplierAccounts.actions.statement"),
              onClick: (r) => setStatementSupplier(r),
              variant: "primary",
            },
            {
              icon: <Ban />,
              tooltip: t("supplierAccounts.actions.closePeriod"),
              onClick: (r) => setClosingSupplier(r),
              variant: "primary",
            },
            {
              icon: <History />,
              tooltip: t("history"),
              onClick: (r) => setHistorySupplier(r),
              variant: "primary",
            },
          ]}
        />
      )
    }
  ], [t]);

  return (
    <div className="space-y-6">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        labels={{
          searchPlaceholder: tCommon("toolbar.searchPlaceholder"),
          apply: tOrders("filters.apply"),
          total: tOrders("pagination.total"),
          limit: tOrders("pagination.limit"),
          emptyTitle: tOrders("empty"),
          emptySubtitle: tOrders("emptySubtitle"),
        }}
        columns={columns}
        data={suppliers}
        isLoading={loading}
        actions={[
          {
            key: "export",
            label: t("export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "orders.read",
          },
        ]}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page
        }}
        onPageChange={handlePageChange}
      />

      <AccountStatementModal
        supplier={statementSupplier}
        onClose={() => setStatementSupplier(null)}
        t={t}
        router={router}
      />

      <CloseAccountPeriodModal
        supplier={closingSupplier}
        onClose={() => setClosingSupplier(null)}
        onSuccess={() => fetchSuppliers()}
        t={t}
        tCommon={tCommon}
        router={router}
      />

      <ClosingHistoryModal
        supplier={historySupplier}
        onClose={() => setHistorySupplier(null)}
        t={t}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components for Modals
// ─────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────
// Shared Supplier Statement View & Print Logic
// ─────────────────────────────────────────────────────────────────────────

const handlePrintSupplierStatement = (data, supplier, filters, t) => {
  if (!data || !supplier) return;

  // Generate rows for purchases
  const purchaseRows = data.purchaseInvoices.length > 0
    ? data.purchaseInvoices.map(inv => `
        <tr>
          <td>${inv.ref || '-'}</td>
          <td>${inv.date}</td>
          <td style="font-weight: bold;">${inv.amount.toLocaleString()} </td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="text-align:center; padding: 15px;">لا توجد فواتير مشتريات في هذه الفترة</td></tr>`;

  // Generate rows for returns
  const returnRows = data.returnInvoices.length > 0
    ? data.returnInvoices.map(inv => `
        <tr>
          <td>${inv.ref || '-'}</td>
          <td>${inv.date}</td>
          <td style="font-weight: bold; color: #ef4444;">${inv.amount.toLocaleString()}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="text-align:center; padding: 15px;">لا توجد فواتير مرتجعات في هذه الفترة</td></tr>`;

  const printContent = `
    <html dir="rtl" lang="ar">
      <head>
        <title>${t("supplierAccounts.statement.title")} - ${supplier?.name}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #111827; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
          .header h1 { margin: 0 0 10px 0; font-size: 24px; color: #1f2937; }
          .header p { margin: 0; color: #6b7280; font-size: 14px; }
          
          .summary-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 40px; }
          .summary-box { flex: 1; min-width: 130px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; background-color: #f9fafb; }
          .summary-box .title { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
          .summary-box .value { font-size: 20px; font-weight: bold; color: #111827; }
          .summary-box.final { border-color: #ef4444; background-color: #fef2f2; }
          .summary-box.final .value { color: #ef4444; }

          .section { margin-bottom: 40px; page-break-inside: avoid; }
          .section h2 { font-size: 18px; margin-bottom: 15px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; display: inline-block;}
          
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: right; }
          th { background-color: #f3f4f6; color: #374151; font-weight: bold; }
          tbody tr:nth-child(even) { background-color: #f9fafb; }
          
          @media print {
            body { padding: 0; }
            @page { margin: 1cm; }
            .summary-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t("supplierAccounts.statement.title")} - ${supplier?.name}</h1>
          <p>${t("filters.dateRange")}: ${filters.startDate ? new Date(filters.startDate).toLocaleDateString() : ''} 
             إلى 
             ${filters.endDate ? new Date(filters.endDate).toLocaleDateString() : ''}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-box">
            <div class="title">${t("supplierAccounts.statement.totalPurchases")}</div>
            <div class="value">${data.summary.totalPurchases?.toLocaleString() || 0}</div>
          </div>
          <div class="summary-box">
            <div class="title">${t("supplierAccounts.statement.totalReturns")}</div>
            <div class="value">${data.summary.totalReturns?.toLocaleString() || 0}</div>
          </div>
          <div class="summary-box">
            <div class="title">${t("supplierAccounts.statement.totalPaid")}</div>
            <div class="value">${data.summary.totalPaid?.toLocaleString() || 0}</div>
          </div>
          <div class="summary-box final">
            <div class="title">${t("supplierAccounts.statement.netBalance")}</div>
            <div class="value">${data.summary.finalBalance?.toLocaleString() || 0}</div>
          </div>
        </div>

        <div class="section">
          <h2>${t("supplierAccounts.statement.detailedPurchases")}</h2>
          <table>
            <thead>
              <tr>
                <th>${t("supplierAccounts.statement.invoiceRef")}</th>
                <th>${t("supplierAccounts.statement.date")}</th>
                <th>${t("supplierAccounts.statement.amount")}</th>
              </tr>
            </thead>
            <tbody>
              ${purchaseRows}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>${t("supplierAccounts.statement.detailedReturns")}</h2>
          <table>
            <thead>
              <tr>
                <th>${t("supplierAccounts.statement.invoiceRef")}</th>
                <th>${t("supplierAccounts.statement.date")}</th>
                <th>${t("supplierAccounts.statement.amount")}</th>
              </tr>
            </thead>
            <tbody>
              ${returnRows}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  } else {
    toast.error("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير");
  }
};

function SupplierStatementReportView({ data, supplier, filters, onChangeDate, loading, t, router, extraActions }) {
  const miniInvoiceColumns = [
    { key: "ref", header: t("supplierAccounts.statement.invoiceRef"), cell: (row) => <span className="font-mono text-xs">{row.ref}</span> },
    { key: "date", header: t("supplierAccounts.statement.date"), cell: (row) => <span className="tabular-nums text-[11px]">{row.date}</span> },
    { key: "amount", header: t("supplierAccounts.statement.amount"), cell: (row) => <span className="font-black text-xs">{row.amount.toLocaleString()}</span> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          onClick={() => router.push(row.url)}
          className="p-1 hover:bg-muted rounded-md transition-colors text-primary"
          title={t("supplierAccounts.actions.viewInvoice")}
        >
          <Eye size={14} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 p-4 border border-border bg-muted/20 rounded-xl my-4">
        <div className="flex items-end gap-3">
          <FilterField label={t("filters.dateRange")} icon={Calendar} className="flex flex-col gap-3">
            <DateRangePicker
              value={filters}
              closeOnSelect={false}
              staticShow={true}
              onChange={onChangeDate} // Disabled in this view since it's controlled by the modal
              className="pointer-events-none"
            />
          </FilterField>
        </div>

        <div className="flex items-center gap-2">
          <Button_
            size="sm"
            variant="outline"
            label={t("supplierAccounts.actions.printPdf")}
            icon={<Download size={14} />}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handlePrintSupplierStatement(data, supplier, filters, t)}
            disabled={loading || !data}
          />
          {extraActions}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : data && (
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-4 gap-3">
            <MiniSummary title={t("supplierAccounts.statement.totalPurchases")} value={data.summary.totalPurchases} icon={Package} color="purple" />
            <MiniSummary title={t("supplierAccounts.statement.totalReturns")} value={data.summary.totalReturns} icon={RefreshCw} color="red" />
            <MiniSummary title={t("supplierAccounts.statement.totalPaid")} value={data.summary.totalPaid} icon={DollarSign} color="emerald" />
            <MiniSummary title={t("supplierAccounts.statement.netBalance")} value={data.summary.finalBalance} icon={CheckCircle2} color="red" isFinal />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card title={t("supplierAccounts.statement.detailedPurchases")} icon={Package}>
              <MiniTable columns={miniInvoiceColumns} data={data.purchaseInvoices} maxH="300px" />
            </Card>
            <Card title={t("supplierAccounts.statement.detailedReturns")} icon={RefreshCw} color="red">
              <MiniTable columns={miniInvoiceColumns} data={data.returnInvoices} maxH="300px" />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// MODALS FOR SUPPLIER ACCOUNTS
function AccountStatementModal({ supplier, onClose, t, router }) {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchStatement = useCallback(async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      const params = {
        supplierId: supplier.id,
        startDate: filters.startDate ? filters.startDate : undefined,
        endDate: filters.endDate ? filters.endDate : undefined,
      };
      // 1. Fetch Summary Stats
      const statsRes = await api.get("/accounting/supplier-closings/supplier-preview", { params });

      // 2. Fetch Invoices & Returns
      const [purchasesRes, returnsRes] = await Promise.all([
        api.get("/purchases", { params: { ...params, status: "accepted", closed: "false" } }),
        api.get("/purchases-return", { params: { ...params, status: "accepted", closed: "false" } }),
      ]);

      setData({
        summary: statsRes.data,
        purchaseInvoices: (purchasesRes.data.records || []).map(p => ({
          id: p.id,
          url: `/purchases?detials=${p.id}`,
          ref: p.receiptNumber || p.invoiceNumber, // Fallback if needed
          date: new Date(p.statusUpdateDate).toLocaleDateString(),
          amount: Number(p.total)
        })),
        returnInvoices: (returnsRes.data.records || []).map(r => ({
          id: r.id,
          url: `/purchases-return?detials=${r.id}`,
          ref: r.returnNumber,
          date: new Date(r.statusUpdateDate).toLocaleDateString(),
          amount: Number(r.totalReturn)
        }))
      });
    } catch (err) {
      console.error("Error fetching statement:", err);
      toast.error(t("manualExpenses.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [supplier, filters, t]);

  useEffect(() => {
    if (supplier) fetchStatement();
  }, [supplier, fetchStatement]);

  return (
    <Dialog open={!!supplier} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            {t("supplierAccounts.statement.title")} - {supplier?.name}
          </DialogTitle>
        </DialogHeader>

        <SupplierStatementReportView
          data={data}
          supplier={supplier}
          filters={filters}
          loading={loading}
          onChangeDate={(newDates) => setFilters(f => ({ ...f, ...newDates }))}
          t={t}
          router={router}
        />
      </DialogContent>
    </Dialog>
  );
}

function CloseAccountPeriodModal({ supplier, onClose, onSuccess, t, tCommon, router }) {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [closingLoading, setClosingLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchPreview = useCallback(async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      const params = {
        supplierId: supplier.id,
        startDate: filters.startDate ? filters.startDate : undefined,
        endDate: filters.endDate ? filters.endDate : undefined,
      };

      // 1. Fetch Summary Stats
      const statsRes = await api.get("/accounting/supplier-closings/supplier-preview", { params });

      // 2. Fetch Invoices & Returns (Detailed preview)
      const [purchasesRes, returnsRes] = await Promise.all([
        api.get("/purchases", { params: { ...params, status: "accepted", closed: "false" } }),
        api.get("/purchases-return", { params: { ...params, status: "accepted", closed: "false" } }),
      ]);

      setData({
        summary: statsRes.data,
        purchaseInvoices: (purchasesRes.data.records || []).map(p => ({
          id: p.id,
          url: `/purchases?detials=${p.id}`,
          ref: p.receiptNumber || p.invoiceNumber,
          date: new Date(p.statusUpdateDate).toLocaleDateString(),
          amount: Number(p.total)
        })),
        returnInvoices: (returnsRes.data.records || []).map(r => ({
          id: r.id,
          url: `/purchases-return?detials=${r.id}`,
          ref: r.returnNumber,
          date: new Date(r.statusUpdateDate).toLocaleDateString(),
          amount: Number(r.totalReturn)
        }))
      });
    } catch (err) {
      console.error("Error fetching closing preview:", err);
      toast.error(t("manualExpenses.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [supplier, filters, t]);

  useEffect(() => {
    if (supplier) fetchPreview();
  }, [supplier, fetchPreview]);

  const handleConfirmClosing = async () => {
    setClosingLoading(true);
    try {
      const payload = {
        supplierId: supplier.id,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      await api.post("/accounting/supplier-closings/close", payload);
      toast.success(t("manualExpenses.messages.categoryUpdated") || "تم التقفيل بنجاح");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error closing period:", err);
      toast.error(err?.response?.data?.message || t("manualExpenses.messages.error"));
    } finally {
      setClosingLoading(false);
    }
  };

  return (
    <Dialog open={!!supplier} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-danger">
            <Ban size={20} />
            {t("supplierAccounts.close.title")}
          </DialogTitle>
        </DialogHeader>

        {supplier && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-2 p-4 bg-muted/20 border border-border rounded-xl">
              <span className="text-xs text-muted-foreground tracking-wide uppercase font-black">{t("supplierAccounts.columns.supplierName")}</span>
              <span className="text-base font-bold text-foreground">{supplier.name}</span>
            </div>


            <SupplierStatementReportView
              data={data}
              supplier={supplier}
              filters={filters}
              onChangeDate={(newDates) => setFilters(f => ({ ...f, ...newDates }))}
              loading={loading}
              t={t}
              router={router}
              extraActions={
                <Button_
                  label={t("supplierAccounts.actions.confirmClosing")}
                  tone="primary"
                  variant="solid"
                  size="sm"
                  icon={closingLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  disabled={closingLoading || !data || (data.summary.pCount === 0 && data.summary.rCount === 0)}
                  onClick={handleConfirmClosing}
                />
              }
            />

            <div className="pt-4 border-t border-dashed border-border flex items-center justify-end gap-3 mt-4">
              <Button_ label={tCommon("common.cancel")} variant="ghost" size="sm" onClick={onClose} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


function ClosingHistoryModal({ supplier, onClose, t }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Track which specific closing record is currently fetching for print
  const [printingId, setPrintingId] = useState(null);

  const years = useMemo(() => Array.from({ length: 10 }, (_, i) => (currentYear - i).toString()), [currentYear]);

  const fetchHistory = useCallback(async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      const params = {
        supplierId: supplier.id,
        year: selectedYear,
      };
      const res = await api.get("/accounting/supplier-closings/closings", { params });
      setHistory(res.data.records || []);
    } catch (err) {
      console.error("Error fetching closing history:", err);
      toast.error(t("manualExpenses.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [supplier, selectedYear, t]);

  useEffect(() => {
    if (supplier) fetchHistory();
  }, [supplier, fetchHistory]);

  // ==========================================
  // PRINT SPECIFIC CLOSING LOGIC
  // ==========================================
  const handlePrintClosing = async (closingRow) => {
    setPrintingId(closingRow.id);
    try {
      // 1. Fetch Invoices tied specifically to this closingId
      const [purchasesRes, returnsRes] = await Promise.all([
        api.get("/purchases", { params: { closingId: closingRow.id } }),
        api.get("/purchases-return", { params: { closingId: closingRow.id } }),
      ]);

      const purchases = purchasesRes.data.records || [];
      const returns = returnsRes.data.records || [];

      // 2. Build HTML Rows
      const purchaseRows = purchases.length > 0
        ? purchases.map(inv => `
            <tr>
              <td>${inv.receiptNumber || inv.invoiceNumber || '-'}</td>
              <td>${new Date(inv.statusUpdateDate || inv.created_at).toLocaleDateString()}</td>
              <td style="font-weight: bold;">${Number(inv.total).toLocaleString()} </td>
            </tr>
          `).join('')
        : `<tr><td colspan="3" style="text-align:center; padding: 15px;">لا توجد فواتير مشتريات</td></tr>`;

      const returnRows = returns.length > 0
        ? returns.map(inv => `
            <tr>
              <td>${inv.returnNumber || '-'}</td>
              <td>${new Date(inv.statusUpdateDate || inv.created_at).toLocaleDateString()}</td>
              <td style="font-weight: bold; color: #ef4444;">${Number(inv.totalReturn).toLocaleString()} </td>
            </tr>
          `).join('')
        : `<tr><td colspan="3" style="text-align:center; padding: 15px;">لا توجد فواتير مرتجعات</td></tr>`;

      // 3. Build Print HTML Document
      const printContent = `
        <html dir="rtl" lang="ar">
          <head>
            <title>${t("supplierAccounts.history.title")} - ${supplier?.name}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #111827; direction: rtl; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
              .header h1 { margin: 0 0 10px 0; font-size: 24px; color: #1f2937; }
              .header p { margin: 0; color: #6b7280; font-size: 14px; }
              
              .summary-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 40px; }
              .summary-box { flex: 1; min-width: 130px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; background-color: #f9fafb; }
              .summary-box .title { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
              .summary-box .value { font-size: 20px; font-weight: bold; color: #111827; }
              .summary-box.final { border-color: #ef4444; background-color: #fef2f2; }
              .summary-box.final .value { color: #ef4444; }

              .section { margin-bottom: 40px; page-break-inside: avoid; }
              .section h2 { font-size: 18px; margin-bottom: 15px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; display: inline-block;}
              
              table { width: 100%; border-collapse: collapse; font-size: 14px; }
              th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: right; }
              th { background-color: #f3f4f6; color: #374151; font-weight: bold; }
              tbody tr:nth-child(even) { background-color: #f9fafb; }
              
              @media print {
                body { padding: 0; }
                @page { margin: 1cm; }
                .summary-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${t("supplierAccounts.history.title")} - ${supplier?.name}</h1>
              <p>الفترة: ${new Date(closingRow.startDate).toLocaleDateString()} إلى ${new Date(closingRow.endDate).toLocaleDateString()}</p>
              <p>تم التقفيل في: ${new Date(closingRow.createdAt).toLocaleDateString()}</p>
            </div>

            <div class="summary-grid">
              <div class="summary-box">
                <div class="title">${t("supplierAccounts.close.totalPurchases")}</div>
                <div class="value">${Number(closingRow.totalPurchases).toLocaleString()}</div>
              </div>
              <div class="summary-box">
                <div class="title">${t("supplierAccounts.close.totalReturns")}</div>
                <div class="value">${Number(closingRow.totalReturns).toLocaleString()}</div>
              </div>
              <div class="summary-box">
                <div class="title">${t("supplierAccounts.close.totalPayments")}</div>
                <div class="value">${Number(closingRow.totalPaid).toLocaleString()}</div>
              </div>
              <div class="summary-box final">
                <div class="title">${t("supplierAccounts.history.balance")}</div>
                <div class="value">${Number(closingRow.finalBalance).toLocaleString()}</div>
              </div>
            </div>

            <div class="section">
              <h2>${t("supplierAccounts.statement.detailedPurchases")}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${t("supplierAccounts.statement.invoiceRef")}</th>
                    <th>${t("supplierAccounts.statement.date")}</th>
                    <th>${t("supplierAccounts.statement.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${purchaseRows}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>${t("supplierAccounts.statement.detailedReturns")}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${t("supplierAccounts.statement.invoiceRef")}</th>
                    <th>${t("supplierAccounts.statement.date")}</th>
                    <th>${t("supplierAccounts.statement.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${returnRows}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `;

      // 4. Trigger Print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        toast.error("يرجى السماح بالنوافذ المنبثقة للطباعة");
      }
    } catch (err) {
      console.error("Error fetching closing details:", err);
      toast.error("حدث خطأ أثناء جلب الفواتير");
    } finally {
      setPrintingId(null);
    }
  };

  const miniHistoryColumns = [
    { key: "createdAt", header: t("supplierAccounts.history.closedAt"), cell: (row) => <span className="tabular-nums text-[11px]">{new Date(row.createdAt).toLocaleDateString()}</span> },
    {
      key: "period",
      header: t("supplierAccounts.history.period"),
      cell: (row) => (
        <span className="text-xs font-medium">
          {new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "totalPurchases",
      header: t("supplierAccounts.close.totalPurchases"),
      cell: (row) => <span className="tabular-nums text-xs text-purple-600">{Number(row.totalPurchases).toLocaleString()}ج</span>
    },
    {
      key: "totalReturns",
      header: t("supplierAccounts.close.totalReturns"),
      cell: (row) => <span className="tabular-nums text-xs text-red-600">{(Number(row.totalReturns) * -1).toLocaleString()}ج</span>
    },
    {
      key: "totalPaid",
      header: t("supplierAccounts.close.totalPayments"),
      cell: (row) => <span className="tabular-nums text-xs text-emerald-600">{(Number(row.totalPaid) * -1).toLocaleString()}ج</span>
    },
    { key: "finalBalance", header: t("supplierAccounts.history.balance"), cell: (row) => <span className="font-black text-xs text-red-600 tabular-nums">{Number(row.finalBalance).toLocaleString()}ج</span> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          onClick={() => handlePrintClosing(row)}
          disabled={printingId === row.id}
          className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground disabled:opacity-50"
          title="طباعة التقرير"
        >
          {printingId === row.id ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
        </button>
      )
    }
  ];

  return (
    <Dialog open={!!supplier} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-muted-foreground">
            <History size={20} />
            {t("supplierAccounts.history.title")} - {supplier?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-3 p-4 border border-border bg-muted/20 rounded-xl">
            <FilterField icon={Calendar}>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="theme-field h-9 w-32">
                  <SelectValue placeholder={t("filters.selectYear")} />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <MiniTable columns={miniHistoryColumns} data={history} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// Small Helper Components for the modals
// ─────────────────────────────────────────────────────────────────────────

function Card({ title, icon: Icon, children, color = "orange", maxH = "auto" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl -mr-8 -mt-8",
        color === 'orange' ? "bg-orange-500/5" :
          color === 'purple' ? "bg-purple-500/5" :
            color === 'emerald' ? "bg-emerald-500/5" : "bg-red-500/5"
      )} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
            color === 'orange' ? "bg-orange-50 text-orange-500" :
              color === 'purple' ? "bg-purple-50 text-purple-500" :
                color === 'emerald' ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
          )}>
            <Icon size={16} />
          </div>
          <span className="font-bold text-sm text-foreground">{title}</span>
        </div>
      </div>
      <div style={{ maxHeight: maxH }} className="relative z-10 overflow-auto">{children}</div>
    </div>
  );
}

function MiniSummary({ title, value, icon: Icon, color, isFinal = false }) {
  const bgColor = color === 'purple' ? 'bg-purple-50 text-purple-600 border-purple-100' :
    color === 'red' ? 'bg-red-50 text-red-600 border-red-100' :
      color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
        'bg-orange-50 text-orange-600 border-orange-100';

  return (
    <div className={cn("p-3.5 rounded-xl border flex flex-col items-center text-center gap-2", bgColor, isFinal && "shadow-[0_4px_12px_rgb(var(--primary-shadow)/30%)]")}>
      <div className="flex items-center gap-2">
        <Icon size={14} className="opacity-60" />
        <span className="text-[10px] font-black uppercase tracking-wider opacity-70 truncate">{title}</span>
      </div>
      <span className={cn("tabular-nums font-black", isFinal ? "text-lg" : "text-sm")}>{value.toLocaleString()}ج</span>
    </div>
  );
}