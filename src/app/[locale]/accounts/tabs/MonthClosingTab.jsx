"use client";

import React, { useMemo, useState } from "react";
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
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import Flatpickr from "react-flatpickr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";

export default function MonthClosingTab() {
  const tCommon = useTranslations("common");
  const t = useTranslations("accounts.monthClosing");

  const [search, setSearch] = useState("");
  const [newClosingOpen, setNewClosingOpen] = useState(false);
  const [selectedClosing, setSelectedClosing] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Mock Data
  // ─────────────────────────────────────────────────────────────────────────

  const closingHistory = [
    {
      id: 1,
      closedAt: "2025-11-30",
      period: "2025-11-01 - 2025-11-30",
      productCosts: 35000,
      manualExpenses: 10000,
      manualExpensesDetails: [
        { category: "ads", amount: 5000, description: "Facebook Ads" },
        { category: "salaries", amount: 5000, description: "Team Salaries" }
      ],
      totalCost: 45000,
      totalReturn: 5000,
      totalSelling: 65000,
      soldOrdersCount: 124,
      deceased: 2000,
      finalBalance: 13000, // (65000 - 5000) - (45000 + 2000) = 60000 - 47000 = 13000
      currency: "ج"
    },
    {
      id: 2,
      closedAt: "2025-10-31",
      period: "2025-10-01 - 2025-10-31",
      productCosts: 30000,
      manualExpenses: 8000,
      manualExpensesDetails: [
        { category: "office", amount: 2000, description: "Office Rent" },
        { category: "transport", amount: 6000, description: "Shipping Logistics" }
      ],
      totalCost: 38000,
      totalReturn: 3000,
      totalSelling: 52000,
      soldOrdersCount: 98,
      deceased: 1000,
      finalBalance: 10000, // (52000 - 3000) - (38000 + 1000) = 49000 - 39000 = 10000
      currency: "ج"
    }
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Columns
  // ─────────────────────────────────────────────────────────────────────────

  const columns = useMemo(() => [
    {
      key: "closedAt",
      header: t("columns.closedAt"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-sm font-bold tabular-nums">{row.closedAt}</span>
        </div>
      )
    },
    {
      key: "period",
      header: t("columns.period"),
      cell: (row) => <span className="text-xs font-medium text-muted-foreground">{row.period}</span>
    },
    {
      key: "totalCost",
      header: t("columns.totalCost"),
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-red-600 tabular-nums">
            {(row.totalCost + (row.deceased || 0)).toLocaleString()}{row.currency}
          </span>

        </div>
      )
    },
    {
      key: "deceased",
      header: t("columns.deceased"),
      cell: (row) => <span className="text-sm font-bold text-red-600 tabular-nums">{row.deceased.toLocaleString()}{row.currency}</span>
    },
    {
      key: "totalReturn",
      header: t("columns.totalReturn"),
      cell: (row) => <span className="text-sm font-bold text-orange-600 tabular-nums">{row.totalReturn.toLocaleString()}{row.currency}</span>
    },
    {
      key: "totalSelling",
      header: t("columns.totalSelling"),
      cell: (row) => <span className="text-sm font-bold text-emerald-600 tabular-nums">{row.totalSelling.toLocaleString()}{row.currency}</span>
    },
    {
      key: "finalBalance",
      header: t("columns.finalBalance"),
      cell: (row) => <span className="text-sm font-black text-primary tabular-nums">{row.finalBalance.toLocaleString()}{row.currency}</span>
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
              variant: "blue",
            }
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
        data={closingHistory}
        isLoading={false}
        actions={[
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

        pagination={{ total_records: closingHistory.length, current_page: 1, per_page: 10 }}
      />

      <NewClosingModal
        open={newClosingOpen}
        onClose={() => setNewClosingOpen(false)}
        t={t}
        tCommon={tCommon}
      />

      <ClosingDetailsModal
        closing={selectedClosing}
        onClose={() => setSelectedClosing(null)}
        tCommon={tCommon}
        t={t}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────────────────

function NewClosingModal({ open, onClose, t, tCommon }) {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  // Mock summary for preview
  const summaryPreview = {
    totalCost: 42000,
    productCosts: 32000,
    manualExpenses: 10000,
    totalReturn: 4500,
    totalSelling: 58000,
    soldOrdersCount: 115,
    deceased: 11500,
    finalBalance: 11500,
    currency: "ج"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] overflow-auto max-h-[90vh]">
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
          <div className="p-4 border border-border bg-muted/10 rounded-2xl flex items-center justify-between gap-4">
            <FilterField label={t("form.selectPeriod")} icon={Calendar} className="flex-1">
              <Flatpickr
                value={[filters.startDate, filters.endDate]}
                onChange={([s, e]) => setFilters({ startDate: s, endDate: e })}
                options={{ mode: "range", dateFormat: "Y-m-d" }}
                className="theme-field h-10 w-full mt-1"
              />
            </FilterField>
            <Button_ label={tCommon("apply")} variant="outline" className="mt-5" />
          </div>

          <ClosingSummaryView summary={summaryPreview} t={t} tCommon={tCommon} />

          <div className="pt-4 border-t border-dashed border-border flex items-center justify-end gap-3">
            <Button_ label={tCommon("cancel")} variant="ghost" size="sm" onClick={onClose} />
            <Button_ label={t("details.confirmClosing")} variant="default" size="sm" icon={<CheckCircle2 size={14} />} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClosingDetailsModal({ closing, onClose, t, tCommon = { tCommon } }) {
  return (
    <Dialog open={!!closing} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            {t("details.title")}
          </DialogTitle>
          <DialogDescription>
            {closing?.period}
          </DialogDescription>
        </DialogHeader>

        {closing && (
          <div className="py-4">
            <ClosingSummaryView summary={closing} t={t} tCommon={tCommon} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared Summary View
// ─────────────────────────────────────────────────────────────────────────

function ClosingSummaryView({ summary, t, tCommon }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <MiniSummaryCard
          title={t("columns.totalSelling")}
          value={summary.totalSelling}
          icon={ShoppingCart}
          color="emerald"
          trend={`${summary.soldOrdersCount} ${t("details.soldOrdersCount")}`}
        />
        <MiniSummaryCard
          title={t("columns.totalCost")}
          value={summary.totalCost + (summary.deceased || 0)}
          icon={DollarSign}
          color="red"
        />
        <MiniSummaryCard
          title={t("columns.totalReturn")}
          value={summary.totalReturn}
          icon={RefreshCw}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">

        <Card_ title={t("details.summaryTitle")} icon={TrendingUp} color="blue">
          <div className="space-y-3">
            <DetailRow_ label={t("details.productCosts")} value={summary.productCosts} iconColor="purple" />
            {summary.deceased > 0 && (
              <DetailRow_ label={t("columns.deceased")} value={summary.deceased} iconColor="red" />
            )}
            <DetailRow_ label={t("columns.totalReturn")} value={-summary.totalReturn} iconColor="orange" />

            <div className="h-px bg-border my-2 border-dashed" />

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm font-bold">{t("columns.deceased")}</span>
              <span className={cn("text-base font-black tabular-nums text-red-600")}>
                {summary.deceased.toLocaleString()}ج
              </span>
            </div>
          </div>
        </Card_>

        {/* Detailed Manual Expenses */}
        <Card_ title={t("details.manualExpenses")} icon={DollarSign} color="slate">
          <div className="space-y-2">
            {(summary.manualExpensesDetails || []).map((exp, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-border last:border-0 border-dashed">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-foreground capitalize">{exp.category}</span>
                  <span className="text-[10px] text-muted-foreground">{exp.description}</span>
                </div>
                <span className="text-xs font-black tabular-nums text-red-600">-{exp.amount.toLocaleString()}ج</span>
              </div>
            ))}
            <div className="pt-2 flex items-center justify-between border-t border-border mt-2">
              <span className="text-xs font-black">{tCommon("total")}</span>
              <span className="text-sm font-black text-red-600 tabular-nums">{summary.manualExpenses.toLocaleString()}ج</span>
            </div>
          </div>
        </Card_>


        <div className=" col-span-2 flex flex-col justify-center items-center p-8 rounded-3xl bg-primary/5 border-2 border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={120} className="text-primary" />
          </div>
          <span className="text-xs font-black uppercase tracking-[2px] text-primary/60 mb-2">{t("columns.finalBalance")}</span>
          <span className="text-4xl font-black text-primary tabular-nums tracking-tighter">
            {summary.finalBalance.toLocaleString()}ج
          </span>
          <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
            <CheckCircle2 size={12} />
            إجمالي الربح الصافي
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mini Helpers
// ─────────────────────────────────────────────────────────────────────────

function MiniSummaryCard({ title, value, icon: Icon, color, trend }) {
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
      <span className="text-xl font-black tabular-nums">{value.toLocaleString()}ج</span>
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
        {value.toLocaleString()}ج
      </span>
    </div>
  );
}
