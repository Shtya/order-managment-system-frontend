"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BarChart2,
  DollarSign,
  Wallet,
  ArrowUpRight,
  Package,
  Truck,
  Users,
  Building2,
  ChevronLeft,
  Calendar,
  CreditCard,
  PieChart as PieIcon,
  TrendingUp,
  RefreshCw,
  Store
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  Card,
  MiniTable,
  TrendChart,
  StatusDonut,
  TableFilters,
  PRIMARY,
  SECONDARY,
  THIRD
} from "../../reports/order-analysis/page";
import Button_ from "@/components/atoms/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField } from "@/components/atoms/Table";
import Flatpickr from "react-flatpickr";
import api from "@/utils/api";

export default function OverviewTab() {
  const t = useTranslations("accounts");
  const [suppliers, setSuppliers] = useState([]);

  // Default dates: this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString();
  const endOfMonth = new Date().toLocaleDateString();

  const [filters, setFilters] = useState({
    startDate: startOfMonth,
    endDate: endOfMonth,
    supplierId: "all",
  });

  useEffect(() => {
    api.get("/lookups/suppliers", { params: { limit: 100 } })
      .then(res => setSuppliers(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error fetching suppliers:", err));
  }, []);

  const handleApplyFilters = () => {
    console.log("Applying filters:", filters);
    // Here you would normally refetch data based on filters
  };

  // Mock data for last expenses table
  const lastExpensesColumns = [
    {
      key: "type",
      header: t("overview.lastExpenses"),
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            row.color === 'blue' ? "bg-blue-50 text-blue-500" :
              row.color === 'purple' ? "bg-purple-50 text-purple-500" :
                row.color === 'orange' ? "bg-orange-50 text-orange-500" : "bg-red-50 text-red-500"
          )}>
            <row.icon size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs truncate">{row.name}</span>
            <span className="text-[10px] text-muted-foreground">{row.date}</span>
          </div>
        </div>
      )
    },
    {
      key: "amount",
      header: "",
      cell: (row) => (
        <span className={cn(
          "font-black text-xs tabular-nums px-2 py-1 rounded-md",
          row.amount < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {row.amount.toLocaleString()}ج
        </span>
      )
    }
  ];

  const lastExpensesData = [
    { id: 1, name: "شراء منتجات - مورد 8", date: "30 نوفمبر 2025", amount: 14700, icon: Package, color: 'orange' },
    { id: 2, name: "شحن - طلبات اليوم", date: "29 نوفمبر 2025", amount: 8300, icon: Truck, color: 'blue' },
    { id: 3, name: "أدوات تغليف", date: "28 نوفمبر 2025", amount: 2450, icon: CreditCard, color: 'purple' },
    { id: 4, name: "إعلان فيسبوك", date: "27 نوفمبر 2025", amount: 1200, icon: TrendingUp, color: 'purple' },
    { id: 5, name: "مرتجع طلب #10234", date: "26 نوفمبر 2025", amount: -3600, icon: RefreshCw, color: 'red' },
  ];

  // Mock data for Donut chart
  const expensesBreakdownData = [
    { name: t("stats.productPurchases"), count: 128900, color: "#8b5cf6" },
    { name: t("stats.shippingCost"), count: 45300, color: "#3b82f6" },
    { name: t("stats.manualExpenses"), count: 24680, color: "#a855f7" },
    { name: t("stats.returns"), count: 18250, color: "#ef4444" },
  ];

  // Mock data for Trend chart
  const trendData = [
    { label: "الأسبوع 1", value: 8000 },
    { label: "الأسبوع 2", value: 24000 },
    { label: "الأسبوع 3", value: 21000 },
    { label: "الأسبوع 4", value: 26000 },
    { label: "الأسبوع 5", value: 24000 },
    { label: "الأسبوع 6", value: 38000 },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <TableFilters
        onApply={handleApplyFilters}
        onRefresh={handleApplyFilters}
        applyLabel={t("filters.apply")}
      >
        {/* Date range */}
        <FilterField label={t("filters.dateRange")} icon={Calendar}>
          <Flatpickr
            value={[
              filters.startDate ? new Date(filters.startDate) : null,
              filters.endDate ? new Date(filters.endDate) : null,
            ]}
            onChange={([s, e]) => {

              setFilters((f) => ({
                ...f,
                startDate: s ? s.toLocaleDateString() : null,
                endDate: e ? e.toLocaleDateString() : null,
              }));
            }}
            options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
            placeholder={t("filters.dateRangePlaceholder")}
            data-size="default"
            className={"theme-field"}
          />
        </FilterField>

        {/* Supplier */}
        <FilterField label={t("filters.supplier")} icon={Building2}>
          <Select
            value={filters.supplierId}
            onValueChange={(v) => setFilters((f) => ({ ...f, supplierId: v }))}
          >
            <SelectTrigger className="theme-field">
              <SelectValue placeholder={t("filters.allSuppliers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allSuppliers")}</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </TableFilters>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Trend Chart */}
        <div className="lg:col-span-2">
          <Card
            title={t("overview.expensesTrend")}
            icon={TrendingUp}
            color={PRIMARY}
          // action={
          //   <Select value={period} onValueChange={setPeriod}>
          //     <SelectTrigger className="h-8 w-28 text-[10px] font-bold uppercase tracking-wider">
          //       <SelectValue />
          //     </SelectTrigger>
          //     <SelectContent>
          //       <SelectItem value="daily">{t("overview.periods.daily")}</SelectItem>
          //       <SelectItem value="weekly">{t("overview.periods.weekly")}</SelectItem>
          //       <SelectItem value="monthly">{t("overview.periods.monthly")}</SelectItem>
          //     </SelectContent>
          //   </Select>
          // }
          >
            <TrendChart
              data={trendData}
              configs={[{ key: 'value', label: t("stats.totalExpenses"), color: PRIMARY }]}
            />
          </Card>
        </div>

        {/* 2. Donut Chart */}
        <div>
          <Card title={t("overview.expensesBreakdown")} icon={PieIcon} color={SECONDARY}>
            <div className="py-4">
              <div className="">
                <StatusDonut
                  data={expensesBreakdownData}
                  config={{ key: 'count', label: 'name' }}
                />
              </div>

            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* 3. Summary Cards (Suppliers, Employees, Cities) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Suppliers */}
          <SummaryCard
            title={t("overview.suppliers")}
            icon={Building2}
            color="#10b981"
            href="?tab=supplierAccounts"
            items={[
              { label: "المورد الأول", value: "128,900ج", status: "مستقر", statusColor: "bg-emerald-50 text-emerald-600" },
              { label: "المورد الثاني", value: "64,500ج", status: "متأخر", statusColor: "bg-orange-50 text-orange-600" },
              { label: "المورد الثالث", value: "45,200ج", status: "مستقر", statusColor: "bg-emerald-50 text-emerald-600" },
            ]}
            t={t}
          />

          {/* Employees */}
          <SummaryCard
            title={t("overview.employeePerformance")}
            icon={Users}
            color="#8b5cf6"
            href="?tab=employeePerformance"
            items={[
              { label: "أحمد محمد", value: "520", percent: 94 },
              { label: "سارة علي", value: "480", percent: 91 },
              { label: "محمد حسن", value: "450", percent: 89 },
            ]}
            t={t}
          />

          {/* City Deliveries */}
          <SummaryCard
            title={t("overview.cityDeliveries")}
            icon={Truck}
            color="#3b82f6"
            href="?tab=cityDeliveries"
            items={[
              { label: "القاهرة", value: "1,240 / 1,350", percent: 92 },
              { label: "الجيزة", value: "890 / 1,020", percent: 87 },
              { label: "الإسكندرية", value: "620 / 750", percent: 83 },
            ]}
            t={t}
          />
        </div>

        {/* 4. Last Expenses Table */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card
            title={t("overview.lastExpenses")}
            icon={DollarSign}
            color={THIRD}
            action={
              <Button_ variant="ghost" size="sm" label={t("overview.viewAll")} className="text-[10px] h-6" />
            }
          >
            <div className="mt-2">
              <MiniTable columns={lastExpensesColumns} data={lastExpensesData} />
            </div>
          </Card>

          {/* 5. Month Closing Card */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 rounded-2xl border border-border bg-card relative overflow-hidden group cursor-pointer"
            onClick={() => window.location.search = "?tab=monthClosing"}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl -mr-8 -mt-8" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <span className="font-bold text-sm">{t("overview.monthClosing")}</span>
              </div>
              <ChevronLeft size={16} className="text-muted-foreground group-hover:translate-x-[-4px] transition-transform" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">مراجعة المصروفات</span>
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">تسوية حسابات الموردين</span>
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">تأكيد المرتجعات</span>
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-border flex items-center justify-center">
              <span className="text-[10px] font-black uppercase text-orange-500">تقفيل شهر نوفمبر 2025</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, icon: Icon, color, items, href, t }) {
  return (
    <Card
      title={title}
      icon={Icon}
      color={color}
      action={
        <Button_
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={14} className="rtl:scale-[-1]" />}
          label={t("overview.viewReport")}
          className="text-[10px] h-6 gap-1"
          onClick={() => window.location.search = href}
        />
      }
    >
      <div className="space-y-4 mt-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] tabular-nums font-medium text-muted-foreground">{item.value}</span>
                {item.status && (
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", item.statusColor)}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
            {item.percent !== undefined && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[10px] font-black tabular-nums" style={{ color }}>{item.percent}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
