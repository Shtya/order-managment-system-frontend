"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import SupplierClosingPDF from "../atoms/SupplierClosingPDF";
import { pdf } from "@react-pdf/renderer";
import SupplierStatementPDF from "../atoms/SupplierStatementPDF";

// ─────────────────────────────────────────────────────────────────────────
// Small Helper Components
// ─────────────────────────────────────────────────────────────────────────



export default function SupplierAccountsTab() {
  const tCommon = useTranslations("common");
  const tAccounts = useTranslations("accounts");
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
      toast.error(t("supplierAccounts.fetchError"));
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
          {row.lastClosingEndDate ? new Date(row.lastClosingEndDate).toLocaleDateString() : t("supplierAccounts.notClosed")}
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
              onClick: (r) => router.push(`/suppliers/${r.id}`),
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
          searchPlaceholder: tCommon("search"),
          apply: tCommon("apply"),
          total: tCommon("total"),
          limit: tCommon("limit"),
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
        tCommon={tCommon}
      />
    </div>
  );
}

function MiniTable({ columns, data, maxH = "auto", t }) {
  return (
    <div className="overflow-auto" style={{ maxHeight: maxH }}>
      <table className="w-full text-right border-separate border-spacing-y-2">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2 py-1  text-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="bg-muted/30 hover:bg-muted/50 transition-colors">
              {columns.map((col, colIn) => (
                <td key={colIn} className="px-2 py-2 first:rounded-r-xl last:rounded-l-xl border-y border-border/50 first:border-r last:border-l text-nowrap text-sm">
                  {col.cell ? col.cell(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-xs text-muted-foreground italic">
                {t("supplierAccounts.noData")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components for Modals
// ─────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────
// Shared Supplier Statement View & Print Logic
// ─────────────────────────────────────────────────────────────────────────

const handlePrintSupplierStatement = async (data, supplier, filters, t, tCommon, locale, setPrinting) => {
  if (!data || !supplier) return;

  setPrinting(true);
  try {
    // 1. Generate PDF Blob via React-PDF
    const blob = await pdf(
      <SupplierStatementPDF
        data={data}
        supplier={supplier}
        filters={filters}
        t={t}
        tCommon={tCommon}
        locale={locale} // Ensure you pass your app's current locale here
      />
    ).toBlob();

    // 2. Download PDF
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement_${supplier.name}_${new Date().getTime()}.pdf`;
    
    document.body.appendChild(a);
    a.click();
    
    // 3. Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (err) {
    console.error("Error generating supplier statement PDF:", err);
    toast.error(tCommon("printError") || "An error occurred while generating the PDF");
  } finally {
    setPrinting(false);
  }
};

function SupplierStatementReportView({ data, supplier, filters, onChangeDate, loading, t, tCommon, router, extraActions }) {
  const { currency, formatCurrency } = usePlatformSettings();
  const locale = useLocale();
  const [printing, setPrinting] = useState(false);
  
  const purchaseMiniColumns = [
    { key: "ref", header: t("supplierAccounts.statement.invoiceRef"), cell: (row) => <span className="font-mono text-xs">{row.ref}</span> },
    { key: "date", header: t("supplierAccounts.statement.date"), cell: (row) => <span className="tabular-nums text-[11px]">{row.date}</span> },
    {
      key: "subtotal",
      header: t("table.subtotal"),
      cell: (row) => (
        <span className="text-gray-600 dark:text-slate-200 text-nowrap">
          {formatCurrency(row.subtotal || 0)}
        </span>
      ),
    },
    {
      key: "paidAmount",
      header: t("table.paidAmount"),
      cell: (row) => (
        <span className="text-green-600 dark:text-green-400 font-medium text-nowrap">
          {formatCurrency(row.paidAmount || 0)}
        </span>
      ),
    },
    {
      key: "remainingAmount",
      header: t("table.remainingAmount"),
      cell: (row) => (
        <span className={cn(
          "font-medium",
          row.remainingAmount > 0 ? "text-orange-600 dark:text-orange-400 text-nowrap" : "text-gray-500 dark:text-slate-400 text-nowrap"
        )}>
          {formatCurrency(row.remainingAmount || 0)}
        </span>
      ),
    },
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

  const returnsMiniColumns = [
    { key: "ref", header: t("supplierAccounts.statement.invoiceRef"), cell: (row) => <span className="font-mono text-xs">{row.ref}</span> },
    { key: "date", header: t("supplierAccounts.statement.date"), cell: (row) => <span className="tabular-nums text-[11px]">{row.date}</span> },
    {
      key: "subtotal",
      header: t("table.subtotal"),
      cell: (row) => (
        <span className="text-gray-600 dark:text-slate-200">
          {formatCurrency(row.subtotal || 0)}
        </span>
      ),
    },
    {
      key: "taxTotal",
      header: t("table.tax"),
      cell: (row) => (
        <span className="text-gray-600 dark:text-slate-200 text-nowrap">
          {formatCurrency(row.taxTotal || 0)}
        </span>
      ),
    },
    {
      key: "totalReturn",
      header: t("table.totalReturn"),
      cell: (row) => (
        <span className="text-red-600 dark:text-red-400 font-bold text-nowrap">
          {formatCurrency(row.totalReturn || 0)}
        </span>
      ),
    },
    {
      key: "takanAmount",
      header: t("table.takanAmount"),
      cell: (row) => (
        <span className="text-green-600 dark:text-green-400 font-semibold text-nowrap">
          {formatCurrency(row.paidAmount || 0)}
        </span>
      ),
    },
    {
      key: "remainingAmount",
      header: t("table.remainingAmount"),
      cell: (row) => {
        const remaining = (row.totalReturn || 0) - (row.paidAmount || 0);
        return (
          <span className={cn(
            "font-bold",
            remaining > 0 ? "text-orange-600 dark:text-orange-400 text-nowrap" : "text-gray-500 text-nowrap"
          )}>
            {formatCurrency(remaining)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          onClick={() => router.push(row.url)}
          className="p-1 hover:bg-muted rounded-md transition-colors text-primary text-nowrap"
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
              value={{
                startDate: filters.startDate,
                endDate: filters.endDate,
              }}
              closeOnSelect={false}
              staticShow={true}
              onChange={onChangeDate} // Disabled in this view since it's controlled by the modal
              dataSize="default"
              maxDate="today"
              className="pointer-events-none"
            />
          </FilterField>
        </div>

        <div className="flex items-center gap-2">
          <Button_
            size="sm"
            variant="outline"
            label={t("supplierAccounts.actions.printPdf")}
            icon={printing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950"
            onClick={() => handlePrintSupplierStatement(data, supplier, filters, t, tCommon, locale, setPrinting)}
            disabled={loading || !data || printing}
          />
          {extraActions}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 py-2">
          {/* Skeleton Summary Grid */}
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-3.5 rounded-xl border border-border bg-card flex flex-col items-center text-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20 animate-pulse" />
                  <div className="h-2.5 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-muted-foreground/30 rounded animate-pulse mt-1" />
              </div>
            ))}
          </div>

          {/* Skeleton Tables Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Purchase Table Skeleton */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-muted-foreground/20 animate-pulse" />
                <div className="h-4 w-40 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 bg-muted-foreground/10 rounded animate-pulse" />
                ))}
              </div>
            </div>

            {/* Returns Table Skeleton */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-muted-foreground/20 animate-pulse" />
                <div className="h-4 w-40 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 bg-muted-foreground/10 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : data && (
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-4 gap-3">
            <MiniSummary currency={currency} title={t("supplierAccounts.statement.totalPurchases")} value={data.summary.totalPurchases} icon={Package} color="purple" />
            <MiniSummary currency={currency} title={t("supplierAccounts.statement.totalPaid")} value={data.summary.totalPaid} icon={Package} color="red" />
            <MiniSummary currency={currency} title={t("supplierAccounts.statement.totalReturns")} value={data.summary.totalReturns} icon={RefreshCw} color="purple" />
            <MiniSummary currency={currency} title={t("supplierAccounts.statement.totalTaken")} value={data.summary.totalTaken} icon={DollarSign} color="emerald" />
            <MiniSummary currency={currency} title={t("supplierAccounts.statement.netBalance")} value={data.summary.finalBalance} icon={CheckCircle2} color={data.summary.finalBalance > 0 ? "red" : "emerald"} isFinal />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card title={t("supplierAccounts.statement.detailedPurchases")} icon={Package}>
              <MiniTable columns={purchaseMiniColumns} data={data.purchaseInvoices} maxH="300px" t={t} />
            </Card>
            <Card title={t("supplierAccounts.statement.detailedReturns")} icon={RefreshCw} color="red">
              <MiniTable columns={returnsMiniColumns} data={data.returnInvoices} maxH="300px" t={t} />
            </Card>
          </div>
        </div>
      )}
    </div>
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
          subtotal: Number(p.subtotal),
          paidAmount: Number(p.paidAmount),
          remainingAmount: Number(p.remainingAmount),
          amount: Number(p.total)
        })),
        returnInvoices: (returnsRes.data.records || []).map(r => ({
          id: r.id,
          url: `/purchases-return?detials=${r.id}`,
          ref: r.returnNumber,
          date: new Date(r.statusUpdateDate).toLocaleDateString(),
          subtotal: Number(r.subtotal),
          taxTotal: Number(r.taxTotal),
          totalReturn: Number(r.totalReturn),
          paidAmount: Number(r.paidAmount),
          amount: Number(r.totalReturn)
        }))
      });
    } catch (err) {
      console.error("Error fetching closing preview:", err);
      toast.error(t("supplierAccounts.fetchInvoicesError"));
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
      toast.success(t("supplierAccounts.successClosing"));
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error closing period:", err);
      toast.error(err?.response?.data?.message || tCommon("error"));
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
              tCommon={tCommon}
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
              <Button_ label={tCommon("cancel")} variant="ghost" size="sm" onClick={onClose} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


function ClosingHistoryModal({ supplier, onClose, t, tCommon }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const locale = useLocale();
  const { currency } = usePlatformSettings();

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
      toast.error(t("supplierAccounts.fetchError"));
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

      // 2. Generate PDF Blob via React-PDF
      const blob = await pdf(
        <SupplierClosingPDF
          closingRow={closingRow}
          supplier={supplier}
          purchases={purchases}
          returns={returns}
          t={t}
          tCommon={tCommon}
          locale={locale} 
        />
      ).toBlob();

      // 3. Download PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `closing_statement_${closingRow.id}.pdf`;
      document.body.appendChild(a);
      a.click();

      // 4. Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error fetching/printing closing details:", err);
      toast.error(t("supplierAccounts.fetchInvoicesError"));
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
      cell: (row) => <span className="tabular-nums text-xs text-purple-600">{Number(row.totalPurchases).toLocaleString()} {currency}</span>
    },
    {
      key: "totalReturns",
      header: t("supplierAccounts.close.totalReturns"),
      cell: (row) => <span className="tabular-nums text-xs text-red-600">{(Number(row.totalReturns) * -1).toLocaleString()} {currency}</span>
    },
    {
      key: "totalPaid",
      header: t("supplierAccounts.close.totalPayments"),
      cell: (row) => <span className="tabular-nums text-xs text-emerald-600">{(Number(row.totalPaid) * -1).toLocaleString()} {currency}</span>
    },
    { key: "finalBalance", header: t("supplierAccounts.history.balance"), cell: (row) => <span className="font-black text-xs text-red-600 tabular-nums">{Number(row.finalBalance).toLocaleString()} {currency}</span> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          onClick={() => handlePrintClosing(row)}
          disabled={printingId === row.id}
          className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground disabled:opacity-50"
          title={tCommon("printReport")}
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
            <MiniTable columns={miniHistoryColumns} data={history} t={t} />
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

function MiniSummary({ title, value, icon: Icon, color, isFinal = false, currency }) {
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
      <span className={cn("tabular-nums font-black", isFinal ? "text-lg" : "text-sm")}>{value.toLocaleString()} {currency}</span>
    </div>
  );
}