"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  Eye,
  Download,
  CheckCircle2,
  FileText,
  TrendingUp,
  ShoppingCart,
  Plus,
  Loader2,
  Ban,
  Settings,
  Scale
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

export default function MonthClosingTab() {
  const tCommon = useTranslations("common");
  const t = useTranslations("accounts.monthClosing");
  const { formatCurrency } = usePlatformSettings();

  // State
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [closings, setClosings] = useState([]);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
  });

  const [newClosingOpen, setNewClosingOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedClosing, setSelectedClosing] = useState(null);

  const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 300 });
  const { handleExport, exportLoading } = useExport();

  // Fetch List
  const fetchClosings = useCallback(async (page = pager.current_page, limit = pager.per_page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
      };
      const res = await api.get("/monthly-closings", { params });
      setClosings(res.data.records || []);
      setPager({
        total_records: res.data.total_records || 0,
        current_page: res.data.current_page || page,
        per_page: res.data.per_page || limit,
      });
    } catch (err) {
      console.error("Error fetching closings:", err);
      toast.error(t("fetchError") || "حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, pager.current_page, pager.per_page, t]);

  useEffect(() => {
    fetchClosings();
  }, [debouncedSearch]);

  const handlePageChange = ({ page, per_page }) => {
    fetchClosings(page, per_page);
  };

  // Export
  const onExport = async () => {
    await handleExport({
      endpoint: "/monthly-closings/export",
      params: { search: debouncedSearch.trim() || undefined },
      filename: `monthly_closings_${Date.now()}.xlsx`,
    });
  };

  // Columns
  const columns = useMemo(() => [
    {
      key: "period",
      header: t("columns.period"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-sm font-bold">{row.month} / {row.year}</span>
        </div>
      )
    },
    {
      key: "revenue",
      header: t("columns.totalSelling") || "الإيرادات",
      cell: (row) => <span className="text-sm font-bold text-emerald-600 tabular-nums">{Number(row.revenue)?.toLocaleString()}</span>
    },
    {
      key: "productCost",
      header: t("columns.productCost") || "تكلفة البضاعة",
      cell: (row) => <span className="text-sm font-medium text-orange-600 tabular-nums">-{Number(row.productCost)?.toLocaleString()}</span>
    },
    {
      key: "operationalExpenses",
      header: t("columns.operationalExpenses") || "المصاريف",
      cell: (row) => <span className="text-sm font-medium text-red-600 tabular-nums">-{Number(row.operationalExpenses)?.toLocaleString()}</span>
    },
    {
      key: "returnsCost",
      header: t("columns.totalReturn") || "المرتجعات",
      cell: (row) => <span className="text-sm font-medium text-purple-600 tabular-nums">-{Number(row.returnsCost)?.toLocaleString()}ج</span>
    },
    {
      key: "netProfit",
      header: t("columns.finalBalance") || "صافي الربح",
      cell: (row) => <span className="text-sm font-black text-primary tabular-nums">{Number(row.netProfit)?.toLocaleString()}ج</span>
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            {
              icon: <Eye />,
              tooltip: t("actions.viewDetails"),
              onClick: (r) => setSelectedClosing(r),
              variant: "primary",
            }
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
        labels={{ searchPlaceholder: tCommon("search") }}
        columns={columns}
        data={closings}
        isLoading={loading}
        actions={[
          {
            key: "compare",
            label: t("actions.compare") || "مقارنة الفترات",
            icon: <Scale size={14} />,
            color: "primary",
            onClick: () => setCompareOpen(true),
            permission: "orders.read",
          },
          {
            key: "add",
            label: t("actions.newClosing"),
            icon: <Plus size={14} />,
            color: "primary",
            onClick: () => setNewClosingOpen(true),
            permission: "orders.create",
          },
          {
            key: "export",
            label: tCommon("export"),
            icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />,
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "orders.read",
          },
        ]}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
      />

      <NewClosingModal
        open={newClosingOpen}
        onClose={() => setNewClosingOpen(false)}
        onSuccess={() => fetchClosings(1)}
        t={t}
        tCommon={tCommon}
        formatCurrency={formatCurrency}
      />

      <ClosingDetailsModal
        closing={selectedClosing}
        onClose={() => setSelectedClosing(null)}
        tCommon={tCommon}
        t={t}
        formatCurrency={formatCurrency}
      />

      <CompareMonthsModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        t={t}
        tCommon={tCommon}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────────────────

function NewClosingModal({ open, onClose, onSuccess, t, tCommon, formatCurrency }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState(currentMonth.toString());

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [closingLoading, setClosingLoading] = useState(false);

  const years = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => (currentYear - i).toString());
  }, [currentYear]);


  const months = useMemo(() => {
    const allMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

    if (year === currentYear.toString()) {
      return allMonths.filter(m => Number(m) <= currentMonth);
    }

    return allMonths;
  }, [year, currentYear, currentMonth]);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    setPreview(null);
    try {
      const res = await api.get("/monthly-closings/preview", {
        params: { year, month }
      });
      setPreview(res.data);
    } catch (err) {
      console.error("Error fetching preview:", err);
      toast.error(err?.response?.data?.message || "تعذر جلب التقرير المبدئي");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (open) fetchPreview();
  }, [open, year, month, fetchPreview]);

  const handleConfirmClosing = async () => {
    setClosingLoading(true);
    try {
      await api.post("/monthly-closings/close", {
        year: Number(year),
        month: Number(month)
      });
      toast.success("تم تقفيل الشهر بنجاح");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error closing month:", err);
      // Backend throws specific invoice arrays, display them nicely
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء التقفيل", { duration: 5000 });
    } finally {
      setClosingLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <TrendingUp size={20} />
            {t("actions.newClosing")}
          </DialogTitle>
          <DialogDescription>
            {t("form.selectPeriod")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 border border-border bg-muted/10 rounded-2xl flex items-center gap-4">
            <FilterField label="السنة" icon={Calendar} className="flex-1">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="theme-field h-10 w-full mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </FilterField>

            <FilterField label="الشهر" icon={Calendar} className="flex-1">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="theme-field h-10 w-full mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </FilterField>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : preview ? (
            <>
              {preview.isClosed && (
                <div className="p-6 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-center font-bold flex flex-col items-center gap-2">
                  <Ban size={32} className="opacity-50" />
                  هذا الشهر تم تقفيله مسبقاً!
                </div>
              )}
              <ClosingReportView
                closing={{ ...preview, month, year }}
                t={t}
                tCommon={tCommon}
                formatCurrency={formatCurrency}
                extraActions={
                  <Button_
                    label={t("details.confirmClosing") || "تأكيد التقفيل"}
                    tone="primary"
                    variant="solid"
                    size="sm"
                    icon={closingLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    onClick={handleConfirmClosing}
                    disabled={closingLoading || preview.isClosed}
                  />
                }
              />

            </>
          ) : null}

          <div className="pt-4 border-t border-dashed border-border flex items-center justify-end gap-3">
            <Button_ label={tCommon("cancel")} variant="ghost" size="sm" onClick={onClose} disabled={closingLoading} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClosingDetailsModal({ closing, onClose, t, tCommon, formatCurrency }) {
  return (
    <Dialog open={!!closing} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            {t("details.title") || "تفاصيل التقفيل"}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {closing?.month} / {closing?.year}
          </DialogDescription>
        </DialogHeader>

        {closing && (
          <div className="py-4">
            <ClosingReportView
              closing={closing}
              t={t}
              tCommon={tCommon}
              formatCurrency={formatCurrency}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared Summary View mapped to Backend fields
// ─────────────────────────────────────────────────────────────────────────

const handlePrintClosing = (closing, formatCurrency) => {
  if (!closing) return;

  const printContent = `
    <html dir="rtl" lang="ar">
      <head>
        <title>تقفيل شهر ${closing.month} / ${closing.year}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #111827; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
          .header h1 { margin: 0 0 10px 0; font-size: 24px; color: #1f2937; }
          .header p { margin: 0; color: #6b7280; font-size: 14px; }
          
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
          .summary-box { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb; display: flex; justify-content: space-between; align-items: center;}
          .summary-box .title { font-size: 14px; color: #4b5563; font-weight: bold;}
          .summary-box .value { font-size: 16px; font-weight: black; color: #111827; }
          
          .summary-box.positive .value { color: #059669; }
          .summary-box.negative .value { color: #dc2626; }
          
          .final-box { grid-column: span 2; background-color: #f0fdf4; border-color: #86efac; text-align: center; padding: 20px; flex-direction: column; gap: 10px;}
          .final-box .title { font-size: 16px; color: #166534; }
          .final-box .value { font-size: 32px; color: #166534; }

          @media print {
            body { padding: 0; }
            @page { margin: 1cm; }
            .summary-box, .final-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير تقفيل الشهر الأرباح</h1>
          <p>الفترة: ${closing.month} / ${closing.year}</p>
          <p>تم التقفيل في: ${new Date(closing.createdAt || new Date()).toLocaleDateString()}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-box positive">
            <span class="title">الرباح</span>
            <span class="value">${formatCurrency(closing.revenue || 0)}</span>
          </div>
          <div class="summary-box negative">
            <span class="title"> البضاعة المباعة</s</span>
            <span class="value">-${formatCurrency(closing.productCost || 0)}</span>
          </div>
          <div class="summary-box negative">
            <span class="title">المصاريف التشغيلية</span>
            <span class="value">-${formatCurrency(closing.operationalExpenses || 0)}</span>
          </div>
          <div class="summary-box negative">
            <span class="title">تكلفة المرتجعات</span>
            <span class="value">-${formatCurrency(closing.returnsCost || 0)}</span>
          </div>
          <div class="summary-box final-box">
            <span class="title">صافي الربح النهائي</span>
            <span class="value">${formatCurrency(closing.netProfit || 0)}</span>
          </div>
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
    toast.error("يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة");
  }
};

function ClosingSummaryView({ summary, t, formatCurrency }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MiniSummaryCard
          title={t("columns.totalSelling") || "الإيرادات"}
          value={summary.revenue}
          icon={TrendingUp}
          formatCurrency={formatCurrency}
          color="emerald"
        />
        <MiniSummaryCard
          title={t("columns.productCost") || "تكلفة البضاعة"}
          value={summary.productCost}
          icon={Package}
          formatCurrency={formatCurrency}
          color="orange"
        />
        <MiniSummaryCard
          title={t("columns.operationalExpenses") || "المصاريف التشغيلية"}
          value={summary.operationalExpenses}
          icon={Settings}
          formatCurrency={formatCurrency}
          color="purple"
        />
        <MiniSummaryCard
          title={t("columns.totalReturn") || "المرتجعات"}
          value={summary.returnsCost}
          icon={RefreshCw}
          formatCurrency={formatCurrency}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1">
        <div className="col-span-1 flex flex-col justify-center items-center p-8 rounded-3xl bg-primary/5 border-2 border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={120} className="text-primary" />
          </div>
          <span className="text-xs font-black uppercase tracking-[2px] text-primary/60 mb-2">
            {t("columns.finalBalance") || "صافي الربح"}
          </span>
          <span className="text-4xl font-black text-primary tabular-nums tracking-tighter">
            {Number(summary.netProfit)?.toLocaleString()}ج
          </span>
          <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
            <CheckCircle2 size={12} />
            نتيجة الفترة
          </div>
        </div>
      </div>
    </div>
  );
}

function ClosingReportView({ closing, t, tCommon, formatCurrency, extraActions }) {
  const { handleExport, exportLoading } = useExport();

  const onExportDetailed = async () => {
    if (!closing) return;
    await handleExport({
      endpoint: "/monthly-closings/export-detailed",
      params: { year: closing.year, month: closing.month },
      filename: `detailed_closing_${closing.month}_${closing.year}.xlsx`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            {t("details.title") || "تفاصيل التقفيل"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {closing?.month} / {closing?.year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button_
            size="sm"
            variant="outline"
            label={exportLoading ? "جاري التحميل..." : "تقرير Excel مفصل"}
            icon={exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            onClick={onExportDetailed}
            disabled={exportLoading}
          />
          <Button_
            size="sm"
            variant="outline"
            label="طباعة التقرير"
            icon={<Download size={14} />}
            onClick={() => handlePrintClosing(closing, formatCurrency)}
          />
          {extraActions}
        </div>
      </div>

      <ClosingSummaryView summary={closing} t={t} tCommon={tCommon} formatCurrency={formatCurrency} />
    </div>
  );
}

function CompareMonthsModal({ open, onClose, t, tCommon, formatCurrency }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Period A (Default: This Month)
  const [periodA, setPeriodA] = useState({
    year: currentYear.toString(),
    month: currentMonth.toString(),
  });

  // Period B (Default: Prev Month)
  const [periodB, setPeriodB] = useState({
    year: (currentMonth === 1 ? currentYear - 1 : currentYear).toString(),
    month: (currentMonth === 1 ? 12 : currentMonth - 1).toString(),
  });

  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);

  const years = useMemo(() => Array.from({ length: 12 }, (_, i) => (currentYear - i).toString()), [currentYear]);
  const allMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        api.get("/monthly-closings/preview", { params: periodA }),
        api.get("/monthly-closings/preview", { params: periodB }),
      ]);
      setDataA(resA.data);
      setDataB(resB.data);
    } catch (err) {
      console.error("Error fetching comparison data:", err);
      toast.error("حدث خطأ أثناء جلب بيانات المقارنة");
    } finally {
      setLoading(false);
    }
  }, [periodA, periodB]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const diff = (valA, valB) => {
    const vA = Number(valA || 0);
    const vB = Number(valB || 0);
    const d = vA - vB;
    const p = vB !== 0 ? (d / vB) * 100 : 0;
    return { d, p };
  };

  const DiffBadge = ({ valA, valB, inverse = false }) => {
    const { d, p } = diff(valA, valB);
    if (d === 0) return null;

    const isPositive = d > 0;
    const colorClass = (isPositive && !inverse) || (!isPositive && inverse)
      ? "text-emerald-600 bg-emerald-50"
      : "text-red-600 bg-red-50";

    return (
      <div className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5", colorClass)}>
        {isPositive ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
        {Math.abs(p).toFixed(1)}%
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Scale size={20} />
            {t("actions.compare") || "مقارنة الفترات"}
          </DialogTitle>
          <DialogDescription>
            قارن الأداء المالي بين فترتين مختلفتين
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-border bg-muted/5 rounded-2xl space-y-3">
              <span className="text-xs font-black uppercase text-primary/60 tracking-wider">الفترة الأولى (A)</span>
              <div className="flex gap-2">
                <Select value={periodA.year} onValueChange={(v) => setPeriodA(p => ({ ...p, year: v }))}>
                  <SelectTrigger className="theme-field h-9 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={periodA.month} onValueChange={(v) => setPeriodA(p => ({ ...p, month: v }))}>
                  <SelectTrigger className="theme-field h-9 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{allMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 border border-border bg-muted/5 rounded-2xl space-y-3">
              <span className="text-xs font-black uppercase text-muted-foreground tracking-wider">الفترة الثانية (B)</span>
              <div className="flex gap-2">
                <Select value={periodB.year} onValueChange={(v) => setPeriodB(p => ({ ...p, year: v }))}>
                  <SelectTrigger className="theme-field h-9 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={periodB.month} onValueChange={(v) => setPeriodB(p => ({ ...p, month: v }))}>
                  <SelectTrigger className="theme-field h-9 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{allMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : dataA && dataB ? (
            <div className="border border-border rounded-3xl overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-6 py-4 text-right font-bold text-muted-foreground">المقياس</th>
                    <th className="px-6 py-4 text-center font-black text-primary bg-primary/5">الفترة A</th>
                    <th className="px-6 py-4 text-center font-bold text-muted-foreground">الفترة B</th>
                    <th className="px-6 py-4 text-center font-bold text-muted-foreground">التغير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <CompareRow
                    label="الإيرادات"
                    valA={dataA.revenue}
                    valB={dataB.revenue}
                    formatCurrency={formatCurrency}
                  />
                  <CompareRow
                    label="تكلفة البضاعة"
                    valA={dataA.cogs}
                    valB={dataB.cogs}
                    formatCurrency={formatCurrency}
                    inverse
                  />
                  <CompareRow
                    label="المصاريف"
                    valA={dataA.operationalExpenses}
                    valB={dataB.operationalExpenses}
                    formatCurrency={formatCurrency}
                    inverse
                  />
                  <CompareRow
                    label="المرتجعات"
                    valA={dataA.returnsCost}
                    valB={dataB.returnsCost}
                    formatCurrency={formatCurrency}
                    inverse
                  />
                  <tr className="bg-primary/5">
                    <td className="px-6 py-5 text-right font-black text-primary">صافي الربح</td>
                    <td className="px-6 py-5 text-center font-black text-primary text-lg">
                      {formatCurrency(dataA.netProfit)}
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-muted-foreground">
                      {formatCurrency(dataB.netProfit)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <DiffBadge valA={dataA.netProfit} valB={dataB.netProfit} />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button_ label={tCommon("close")} variant="ghost" size="sm" onClick={onClose} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompareRow({ label, valA, valB, formatCurrency, inverse = false }) {
  const d = Number(valA || 0) - Number(valB || 0);
  const p = Number(valB || 0) !== 0 ? (d / Number(valB)) * 100 : 0;
  const isPositive = d > 0;

  const colorClass = (isPositive && !inverse) || (!isPositive && inverse)
    ? "text-emerald-600"
    : "text-red-600";

  return (
    <tr>
      <td className="px-6 py-4 text-right font-medium text-muted-foreground">{label}</td>
      <td className="px-6 py-4 text-center font-bold text-foreground bg-primary/5">{formatCurrency(valA)}</td>
      <td className="px-6 py-4 text-center font-medium text-muted-foreground">{formatCurrency(valB)}</td>
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className={cn("font-bold tabular-nums", colorClass)}>
            {isPositive ? "+" : ""}{formatCurrency(d)}
          </span>
          <span className="text-[10px] text-muted-foreground opacity-70">
            ({isPositive ? "+" : ""}{p.toFixed(1)}%)
          </span>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mini Helpers
// ─────────────────────────────────────────────────────────────────────────

function MiniSummaryCard({ title, value, icon: Icon, color, trend, formatCurrency }) {

  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100"
  };

  return (
    <div className={cn("p-4 rounded-2xl border flex flex-col gap-1", colors[color] || colors.blue)}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl bg-white/50 flex items-center justify-center">
          <Icon size={16} />
        </div>
        {trend && <span className="text-[10px] font-bold opacity-80">{trend}</span>}
      </div>
      <span className="text-[10px] font-black uppercase tracking-wider opacity-70 mt-2">{title}</span>
      <span className="text-xl font-black tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

function Card_({ title, icon: Icon, children, color = "blue" }) {
  const colors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
    slate: "bg-slate-500"
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/5">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white", colors[color])}>
          <Icon size={14} />
        </div>
        <span className="font-bold text-sm">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DetailRow_({ label, value, iconColor }) {
  const colors = {
    purple: "bg-purple-500",
    red: "bg-red-500",
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
    slate: "bg-slate-500"
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", colors[iconColor] || "bg-blue-500")} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <span className={cn("text-xs font-bold tabular-nums", value < 0 ? "text-red-600" : "text-foreground")}>
        {value?.toLocaleString()}ج
      </span>
    </div>
  );
}
