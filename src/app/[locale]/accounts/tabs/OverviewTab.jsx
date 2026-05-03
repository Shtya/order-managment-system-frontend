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
import api from "@/utils/api";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import DateRangePicker from "@/components/atoms/DateRangePicker";

export default function OverviewTab({ stats, loadingStats, mainFilters, onFiltersChange, onRefresh }) {
  const [filters, setFilters] = useState({
    startDate: mainFilters?.startDate || null,
    endDate: mainFilters?.endDate || null,
  })


  const { currency } = usePlatformSettings();
  const t = useTranslations("accounts");
  // const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastExpenses, setLastExpenses] = useState({ lastPurchases: [], lastManualExpenses: [] });
  const [trend, setTrend] = useState([]);
  const [supplierBalances, setSupplierBalances] = useState([]);
  const [cityReport, setCityReport] = useState([]);
  const [closingPreview, setClosingPreview] = useState(null);

  // Default dates for closing (previous month)
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);

  const [closingMonth, setClosingMonth] = useState({
    year: prevMonth.getFullYear(),
    month: prevMonth.getMonth() + 1
  });


  // useEffect(() => {
  //   const fetchLookups = async () => {
  //     try {

  //       const res = await api.get("/lookups/suppliers", { params: { limit: 100 } });
  //       setSuppliers(Array.isArray(res.data) ? res.data : []);
  //     } catch (err) {
  //       console.error("Error fetching suppliers:", err);
  //     }
  //   };
  //   fetchLookups();
  // }, []);
  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      // We use Promise.all to fire all requests simultaneously
      const [expensesRes, trendRes, balancesRes, cityRes] = await Promise.all([
        api.get("/accounting/last-expenses", { params: filters }),
        api.get("/accounting/trend", { params: filters }),
        api.get("/accounting/suppliers-balances", { params: filters }),
        api.get("/accounting/shipments-city-report", { params: filters })
      ]);

      setLastExpenses(expensesRes.data);
      setTrend(trendRes.data);
      setSupplierBalances(balancesRes.data);
      setCityReport(cityRes.data?.records);
    } catch (err) {
      console.error("Error fetching accounting data:", err);
    } finally {
      setLoading(false);
    }
  };

  const [loadingClosingPreview, setLoadingClosingPreview] = useState(false);

  useEffect(() => {
    const fetchClosingPreview = async () => {
      try {
        setLoadingClosingPreview(true);
        const { year, month } = closingMonth;
        if (!year || !month) return;

        const res = await api.get("/monthly-closings/preview", { params: { year, month } });
        setClosingPreview(res.data);
      } catch (err) {
        console.error("Error fetching closing preview:", err);
      } finally {
        setLoadingClosingPreview(false);
      }
    };

    if (closingMonth) {
      fetchClosingPreview();
    }
  }, [closingMonth]);

  const handleApplyFilters = () => {
    onFiltersChange(filters);
    fetchAccountingData();
    onRefresh?.();
  };

  const handleRefresh = () => {
    handleApplyFilters();
  };

  // Combine and sort last expenses
  const combinedExpenses = useMemo(() => {
    const purchases = (lastExpenses.lastPurchases || []).map(p => ({
      id: `p-${p.id}`,
      name: `${t("overview.purchaseProducts")} - ${p.supplier?.name || t("overview.withoutSupplier")} - #${p.receiptNumber}`,
      date: new Date(p.statusUpdateDate).toLocaleDateString(),
      rawDate: new Date(p.statusUpdateDate),
      amount: p.total,
      icon: Package,
      color: 'primary'
    }));

    const manual = (lastExpenses.lastManualExpenses || []).map(e => ({
      id: `m-${e.id}`,
      name: `${t("stats.manualExpenses")} - ${e.category?.name || t("overview.none")}`,
      date: new Date(e.collectionDate).toLocaleDateString(),
      rawDate: new Date(e.collectionDate),
      amount: e.amount,
      icon: CreditCard,
      color: 'purple'
    }));

    return [...purchases, ...manual]
      .sort((a, b) => b.rawDate - a.rawDate)
      .slice(0, 6);
  }, [lastExpenses, t]);

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
              row.color === 'primary' ? "bg-primary/10 text-primary" :
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
          {row.amount.toLocaleString()} {currency}
        </span>
      )
    }
  ];

  // Mock data for Donut chart
  const expensesBreakdownData = useMemo(() => [
    { name: t("stats.productPurchases"), count: stats?.productCost || 0, color: "#8b5cf6" },
    { name: t("stats.manualExpenses"), count: stats?.manualExpenses || 0, color: "#a855f7" },
  ], [stats, t]);
  console.log(filters)
  return (
    <div className="space-y-6">
      {/* Filters */}
      <TableFilters
        onApply={handleApplyFilters}
        onRefresh={handleRefresh}
        applyLabel={t("filters.apply")}
      >
        <DateRangePicker
          value={filters}
          onChange={(newDates) => setFilters(f => ({ ...f, ...newDates }))}
          placeholder={t("filters.dateRangePlaceholder")}
        />
      </TableFilters>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Trend Chart */}
        <div className="lg:col-span-2">
          <Card
            title={t("overview.expensesTrend")}
            icon={TrendingUp}
            color={PRIMARY}
          >
            <TrendChart
              loading={loading}
              data={trend}
              configs={[
                { key: 'productCost', label: t("stats.productPurchases"), color: '#8b5cf6' },
                { key: 'manualExpenses', label: t("stats.manualExpenses"), color: '#a855f7' },
                { key: 'totalCost', label: t("stats.totalExpenses"), color: PRIMARY }
              ]}
            />
          </Card>
        </div>

        {/* 2. Donut Chart */}
        <div>
          <Card title={t("overview.expensesBreakdown")} icon={PieIcon} color={SECONDARY}>
            <div className="py-4">
              <div className="">
                <StatusDonut
                  loading={loading || loadingStats}
                  data={expensesBreakdownData}
                  label={currency}
                  config={{ key: 'count', label: 'name' }}
                />
              </div>

            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">

        {/* 3. Summary Cards (Suppliers, Employees, Cities) */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Suppliers */}
          <SummaryCard
            loading={loading}
            title={t("overview.suppliers")}
            icon={Building2}
            color="#10b981"
            href="?tab=supplierAccounts"
            items={supplierBalances.slice(0, 3).map(s => ({
              label: s.supplierName,
              value: `${s.absoluteBalance.toLocaleString()}ج`,
              status: s.financialStatus === 'PAYABLE' ? t("overview.payable") : t("overview.receivable"),
              statusColor: s.financialStatus === 'PAYABLE' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
            }))}
            t={t}
          />

          {/* City Deliveries */}
          <SummaryCard
            loading={loading}
            title={t("overview.cityDeliveries")}
            icon={Truck}
            color="#3b82f6"
            href="?tab=cityDeliveries"
            items={cityReport.slice(0, 3).map(c => ({
              label: c.city || t("overview.unknownCity"),
              value: `${c.actualDeliveries.toLocaleString()} / ${c.totalShipments.toLocaleString()}`,
              percent: c.successRate
            }))}
            t={t}
          />
        </div>

        {/* 4. Last Expenses Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card
            title={t("overview.lastExpenses")}
            icon={DollarSign}
            color={THIRD}
            action={
              <Button_
                variant="ghost"
                size="sm"
                label={t("overview.viewOperetionalExpenses")}
                className="text-[10px] h-6"
                onClick={() => window.location.search = "?tab=manualExpenses"}
              />
            }
          >
            <div className="mt-2">
              <MiniTable columns={lastExpensesColumns} data={combinedExpenses} />
            </div>
          </Card>

          {/* 5. Month Closing Card */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 rounded-2xl border border-border bg-card relative overflow-hidden group cursor-pointer"
            onClick={() => window.location.search = `?tab=monthClosing&year=${closingMonth.year}&month=${closingMonth.month}`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl -mr-8 -mt-8" />

            {loadingClosingPreview ? (
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="flex flex-col items-center py-2 space-y-2">
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="pt-3 border-t border-dashed border-border flex items-center justify-between">
                  <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-4 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Calendar size={16} />
                    </div>
                    <span className="font-bold text-sm">{t("overview.monthClosing")}</span>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${closingPreview?.isClosed
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}>
                    {closingPreview?.isClosed ? t("monthClosing.status.closed") : t("monthClosing.status.pending")}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-muted-foreground text-[11px] mb-1">
                    {t("monthClosing.netResult")}
                  </span>
                  <div className={`text-xl font-black flex items-center gap-1 ${closingPreview?.netProfit >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}>
                    {closingPreview?.netProfit >= 0 ? "+" : ""}
                    {new Intl.NumberFormat().format(closingPreview?.netProfit || 0)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-border flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    {t("overview.closingFor", { month: closingMonth.month, year: closingMonth.year })}
                  </span>
                  <ChevronLeft size={14} className="text-muted-foreground group-hover:translate-x-[-4px] transition-transform" />
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div >
  );
}

function SummaryCard({ title, loading, icon: Icon, color, items, href, t }) {
  const hasData = items && items.length > 0;

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
      <div className={cn("mt-2", hasData ? "space-y-5" : "py-8 flex flex-col items-center justify-center text-center")}>
        {loading ? (
          <div className="w-full space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        )
          : !hasData ? (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Icon size={20} />
              </div>
              <span className="text-[11px] font-medium">{t("overview.noData")}</span>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2.5 group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold group-hover:text-primary transition-colors">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums font-bold text-muted-foreground">{item.value}</span>
                    {item.status && (
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg", item.statusColor)}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
                {item.percent !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[11px] font-black tabular-nums min-w-[30px] text-right" style={{ color }}>{item.percent}%</span>
                  </div>
                )}
              </div>
            ))
          )}
      </div>
    </Card>
  );
}
