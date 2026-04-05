"use client";

import React, { useMemo, useState } from "react";
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
  AlertTriangle,
  ChevronLeft,
  ExternalLink,
  Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import Flatpickr from "react-flatpickr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MiniTable, SummaryCard, SECONDARY } from "../../reports/order-analysis/page"; // نفترض وجود هذه المكونات من الـ Overview

export default function SupplierAccountsTab() {
  const tCommon = useTranslations("common");
  const t = useTranslations("accounts");
  const router = useRouter();

  const [search, setSearch] = useState("");

  // Modals Visibility
  const [statementSupplier, setStatementSupplier] = useState(null);
  const [closingSupplier, setClosingSupplier] = useState(null);
  const [historySupplier, setHistorySupplier] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Mock Data (بيانات وهمية للتجربة)
  // ─────────────────────────────────────────────────────────────────────────

  const suppliersSettlementData = [
    { id: 1, name: "المورد الأول (أحمد)", lastClosedDate: "2025-10-31", currentBalance: 15400, currency: "ج" },
    { id: 2, name: "المورد الثاني (شركة الأمل)", lastClosedDate: "2025-09-30", currentBalance: -3200, currency: "ج" },
    { id: 3, name: "مورد مواد تغليف", lastClosedDate: null, currentBalance: 2450, currency: "ج" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Columns Definitions (تعريف الأعمدة)
  // ─────────────────────────────────────────────────────────────────────────

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
      key: "lastClosedDate",
      header: t("supplierAccounts.columns.lastClosing"),
      cell: (row) => (
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {row.lastClosedDate ? row.lastClosedDate : "لم يتم التقفيل"}
        </span>
      )
    },
    {
      key: "currentBalance",
      header: t("supplierAccounts.columns.pendingBalance"),
      cell: (row) => (
        <span className={cn(
          "text-sm font-black tabular-nums p-1.5 px-2.5 rounded-md",
          row.currentBalance > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {Math.abs(row.currentBalance).toLocaleString()}{row.currency}
          <span className="text-[10px] font-normal mr-1">
            ({row.currentBalance > 0 ? "علي فلوس" : "لي فلوس"})
          </span>
        </span>
      )
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
              variant: "blue",
            },
            {
              icon: <Ban />,
              tooltip: t("supplierAccounts.actions.closePeriod"),
              onClick: (r) => setClosingSupplier(r),
              variant: "orange",
            },
            {
              icon: <History />,
              tooltip: t("history"),
              onClick: (r) => setHistorySupplier(r),
              variant: "slate",
            },
          ]}
        />
      )
    }
  ], [t]);
  let exportLoading = false;
  return (
    <div className="space-y-6">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        labels={{ searchPlaceholder: tCommon("search") }}
        columns={columns}
        data={suppliersSettlementData}
        isLoading={false}
        actions={[
          {
            key: "export",
            label: t("export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "blue",
            // onClick: handleExport,
            // disabled: exportLoading,
            permission: "orders.read",
          },

        ]}
        pagination={{ total_records: suppliersSettlementData.length, current_page: 1, per_page: 10 }}
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
        t={t}
        tCommon={tCommon}
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

function AccountStatementModal({ supplier, onClose, t, router }) {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  // Mock data for statement
  const statementDetailsMock = {
    summary: {
      totalPurchases: 25000,
      totalReturns: 3000,
      totalPaid: 15000,
      prevClosingBalance: 8400,
      netBalance: 15400,
    },
    purchaseInvoices: [
      { id: 1, ref: "PUR-001", date: "2025-11-05", amount: 10000 },
      { id: 2, ref: "PUR-002", date: "2025-11-12", amount: 15000 },
    ],
    returnInvoices: [
      { id: 1, ref: "RET-001", date: "2025-11-10", amount: 3000 },
    ]
  };

  const miniInvoiceColumns = [
    { key: "ref", header: t("supplierAccounts.statement.invoiceRef"), cell: (row) => <span className="font-mono text-xs">{row.ref}</span> },
    { key: "date", header: t("supplierAccounts.statement.date"), cell: (row) => <span className="tabular-nums text-[11px]">{row.date}</span> },
    { key: "amount", header: t("supplierAccounts.statement.amount"), cell: (row) => <span className="font-black text-xs">{row.amount.toLocaleString()}ج</span> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          onClick={() => router.push(`/purchases/details/${row.id}`)}
          className="p-1 hover:bg-muted rounded-md transition-colors text-primary"
          title={t("supplierAccounts.actions.viewInvoice")}
        >
          <Eye size={14} />
        </button>
      )
    }
  ];

  return (
    <Dialog open={!!supplier} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            {t("supplierAccounts.statement.title")} - {supplier?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 p-4 border border-border bg-muted/20 rounded-xl my-4">
          <div className="flex items-end gap-3">
            <FilterField label={t("filters.dateRange")} icon={Calendar}>
              <Flatpickr
                value={[filters.startDate, filters.endDate]}
                onChange={([s, e]) => setFilters({ startDate: s, endDate: e })}
                options={{ mode: "range", dateFormat: "Y-m-d" }}
                className="theme-field h-9 w-52"
              />
            </FilterField>
            <Button_ size="sm" variant="outline" label={t("filters.apply")} />
          </div>
          <Button_ size="sm" variant="outline" label={t("supplierAccounts.actions.printPdf")} icon={<Download size={14} />} className="text-blue-600 border-blue-200 hover:bg-blue-50" />
        </div>

        {supplier && (
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-5 gap-3">
              <MiniSummary title={t("supplierAccounts.statement.totalPurchases")} value={statementDetailsMock.summary.totalPurchases} icon={Package} color="purple" />
              <MiniSummary title={t("supplierAccounts.statement.totalReturns")} value={statementDetailsMock.summary.totalReturns} icon={RefreshCw} color="red" />
              <MiniSummary title={t("supplierAccounts.statement.totalPaid")} value={statementDetailsMock.summary.totalPaid} icon={DollarSign} color="emerald" />
              <MiniSummary title={t("supplierAccounts.statement.prevBalance")} value={statementDetailsMock.summary.prevClosingBalance} icon={Ban} color="orange" />
              <MiniSummary title={t("supplierAccounts.statement.netBalance")} value={statementDetailsMock.summary.netBalance} icon={CheckCircle2} color="red" isFinal />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Card title={t("supplierAccounts.statement.detailedPurchases")} icon={Package}>
                <MiniTable columns={miniInvoiceColumns} data={statementDetailsMock.purchaseInvoices} maxH="300px" />
              </Card>
              <Card title={t("supplierAccounts.statement.detailedReturns")} icon={RefreshCw} color="red">
                <MiniTable columns={miniInvoiceColumns} data={statementDetailsMock.returnInvoices} maxH="300px" />
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CloseAccountPeriodModal({ supplier, onClose, t, tCommon }) {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  // Mock summary data for the period
  const periodSummaryMock = {
    prevClosingBalance: 8400,
    totalPurchases: 25000,
    totalReturns: 3000,
    totalPaid: 15000,
    netBalance: 15400,
  };

  return (
    <Dialog open={!!supplier} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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

            <div className="p-4 border border-border bg-muted/10 rounded-xl">
              <FilterField label={t("filters.dateRange")} icon={Calendar}>
                <Flatpickr
                  value={[filters.startDate, filters.endDate]}
                  onChange={([s, e]) => setFilters({ startDate: s, endDate: e })}
                  options={{ mode: "range", dateFormat: "Y-m-d" }}
                  className="theme-field h-9 w-full mt-1"
                />
              </FilterField>
            </div>

            <div className="space-y-3">
              <DetailRow label={t("supplierAccounts.close.prevClosingBalance")} value={periodSummaryMock.prevClosingBalance} />
              <DetailRow label={t("supplierAccounts.close.totalPurchasesThisPeriod")} value={periodSummaryMock.totalPurchases} iconColor="purple" />
              <DetailRow label={t("supplierAccounts.close.totalReturnsThisPeriod")} value={-periodSummaryMock.totalReturns} iconColor="red" />
              <DetailRow label={t("supplierAccounts.close.totalPaymentsThisPeriod")} value={-periodSummaryMock.totalPaid} iconColor="emerald" />

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 border border-red-100 mt-4">
                <span className="font-bold text-red-900">{t("supplierAccounts.close.finalAccumulatedBalance")}</span>
                <span className="font-black text-xl text-red-600 tab">{periodSummaryMock.netBalance.toLocaleString()}ج</span>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-border flex items-center justify-end gap-3 mt-4">
              <Button_ label={tCommon("cancel")} variant="ghost" size="sm" onClick={onClose} />
              <Button_ label={t("supplierAccounts.actions.confirmClosing")} variant="default" size="sm" icon={<CheckCircle2 size={14} />} />
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
  const years = useMemo(() => Array.from({ length: 30 }, (_, i) => (currentYear - i).toString()), [currentYear]);

  const closingHistoryMock = [
    { id: 1, closedAt: "2025-10-31", period: "1 - 31 أكتوبر", prevBalance: 8400, netPurchases: 12000, netReturns: 2000, totalPaid: 10000, finalBalance: 8400, status: "completed" },
    { id: 2, closedAt: "2025-09-30", period: "1 - 30 سبتمبر", prevBalance: 10400, netPurchases: 15000, netReturns: 1000, totalPaid: 12000, finalBalance: 10400, status: "completed" },
  ];

  const miniHistoryColumns = [
    { key: "closedAt", header: t("supplierAccounts.history.closedAt"), cell: (row) => <span className="tabular-nums text-[11px]">{row.closedAt}</span> },
    { key: "period", header: t("supplierAccounts.history.period"), cell: (row) => <span className="text-xs font-medium">{row.period}</span> },
    {
      key: "prevBalance",
      header: t("supplierAccounts.close.prevClosingBalance"),
      cell: (row) => <span className="tabular-nums text-xs">{row.prevBalance.toLocaleString()}ج</span>
    },
    {
      key: "netPurchases",
      header: t("supplierAccounts.close.totalPurchases"),
      cell: (row) => <span className="tabular-nums text-xs text-purple-600">{row.netPurchases.toLocaleString()}ج</span>
    },
    {
      key: "netReturns",
      header: t("supplierAccounts.close.totalReturns"),
      cell: (row) => <span className="tabular-nums text-xs text-red-600">{(row.netReturns * -1).toLocaleString()}ج</span>
    },
    {
      key: "totalPaid",
      header: t("supplierAccounts.close.totalPayments"),
      cell: (row) => <span className="tabular-nums text-xs text-emerald-600">{(row.totalPaid * -1).toLocaleString()}ج</span>
    },
    { key: "finalBalance", header: t("supplierAccounts.history.balance"), cell: (row) => <span className="font-black text-xs text-red-600 tabular-nums">{row.finalBalance.toLocaleString()}ج</span> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
          <Download size={14} />
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

          <MiniTable columns={miniHistoryColumns} data={closingHistoryMock} />
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

function DetailRow({ label, value, iconColor }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0 border-dashed">
      <span className="text-xs text-muted-foreground flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full",
          iconColor === 'purple' ? "bg-purple-500" :
            iconColor === 'red' ? "bg-red-500" :
              iconColor === 'emerald' ? "bg-emerald-500" : "bg-orange-500"
        )} />
        {label}
      </span>
      <span className={cn("text-xs font-bold tabular-nums", value < 0 && iconColor === 'red' && "text-red-600")}>
        {value.toLocaleString()}ج
      </span>
    </div>
  );
}