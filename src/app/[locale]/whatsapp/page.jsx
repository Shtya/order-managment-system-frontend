"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  MessageSquare,
  AlertCircle,
  DollarSign,
  Info,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Globe,
  Bell,
  CheckCircle,
  Clock,
} from "lucide-react";

import {
  ExportBtn,
  MiniTable,
  TrendChart,
  StatusDonut,
  PctBar,
  Card,
} from "../reports/order-analysis/page";
import Button_ from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { TableFilters } from "../reports/order-analysis/page";
import PageHeader from "@/components/atoms/Pageheader";
import StoreFilter from "@/components/atoms/StoreFilter";
import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import WhatsAppAccountSelect from "./atoms/WhatsAppAccountSelect";

// ── Custom Filter Field Wrapper ──────────────────────────────────────────────
function FilterField({ label, icon: FieldIcon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {FieldIcon && <FieldIcon size={10} className="text-primary" />}
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Mock Data based on the provided Image (Translated to Arabic) ──────────────

const KPI_DATA = [
  { id: "sent", title: "الرسائل المرسلة", value: "12,450", pct: null, trend: "+18.6%", isPositive: true, icon: Send, color: "#10b981" },
  { id: "delivered", title: "تم التسليم", value: "11,980", pct: "96.2%", trend: "+15.4%", isPositive: true, icon: CheckCircle2, color: "#10b981" },
  { id: "read", title: "تمت القراءة", value: "9,230", pct: "77.0%", trend: "+12.7%", isPositive: true, icon: Eye, color: "#3b82f6" },
  { id: "clicks", title: "النقر (أزرار)", value: "2,214", pct: "18.5%", trend: "+20.3%", isPositive: true, icon: MousePointerClick, color: "#a855f7" },
  { id: "replies", title: "الردود", value: "1,487", pct: "12.4%", trend: "+16.5%", isPositive: true, icon: MessageSquare, color: "#f59e0b" },
  { id: "failed", title: "فشل الإرسال", value: "470", pct: "3.8%", trend: "-6.3%", isPositive: false, icon: AlertCircle, color: "#ef4444" },
  { id: "conversions", title: "التحويلات", value: "648", pct: "6.4%", trend: "+22.8%", isPositive: true, icon: DollarSign, color: "#10b981" },
];

const FUNNEL_DATA = [
  { label: "تم الإرسال", value: 12450, pct: "100%", color: "bg-emerald-500", width: "100%" },
  { label: "تم التسليم", value: 11980, pct: "96.2%", color: "bg-emerald-400", width: "96.2%" },
  { label: "تمت القراءة", value: 9230, pct: "77.0%", color: "bg-blue-400", width: "77%" },
  { label: "تم النقر", value: 2214, pct: "18.5%", color: "bg-purple-400", width: "18.5%" },
  { label: "تم التحويل", value: 648, pct: "6.4%", color: "bg-yellow-400", width: "6.4%" },
];

const CATEGORY_DATA = [
  { name: "الخدمية", count: 6245, pct: "50.2%", color: "#10b981" },
  { name: "التسويقية", count: 4320, pct: "34.7%", color: "#3b82f6" },
  { name: "التوثيق", count: 1885, pct: "15.1%", color: "#f59e0b" },
];

const TEMPLATES_DATA = [
  { template: "order_confirmation_v2", category: "الخدمية", sent: 3260, readRate: 82.4, clickRate: 21.7 },
  { template: "fraud_alert_01", category: "الخدمية", sent: 2410, readRate: 91.3, clickRate: 12.3 },
  { template: "ramadan_promo_ar", category: "التسويقية", sent: 1980, readRate: 67.8, clickRate: 16.9 },
  { template: "auth_code_en", category: "التوثيق", sent: 1650, readRate: 94.6, clickRate: 94.2 },
  { template: "confirm_order_actions", category: "الخدمية", sent: 1260, readRate: 76.2, clickRate: 23.1 },
];

const AUTOMATION_DATA = [
  { name: "تدفق تأكيد الطلب", triggered: 1200, completed: 890, cancelled: 210, delayed: 100, successRate: 74.2 },
  { name: "تذكير الدفع", triggered: 950, completed: 670, cancelled: 120, delayed: 160, successRate: 70.5 },
  { name: "تحديث الشحن", triggered: 1080, completed: 980, cancelled: 50, delayed: 50, successRate: 90.7 },
  { name: "تدفق تأخير الطلب", triggered: 620, completed: 420, cancelled: 70, delayed: 130, successRate: 67.7 },
];

const BUTTON_CLICKS_DATA = [
  { button: "تأكيد الطلب", type: "CUSTOM", clicks: 1128, clickRate: 50.9 },
  { button: "تأجيل الطلب", type: "CUSTOM", clicks: 442, clickRate: 19.9 },
  { button: "عرض الطلب", type: "VISIT_WEBSITE", clicks: 402, clickRate: 18.1 },
  { button: "إلغاء الطلب", type: "CUSTOM", clicks: 189, clickRate: 8.5 },
  { button: "اتصل بالدعم", type: "PHONE", clicks: 53, clickRate: 2.4 },
];

const GEOGRAPHY_DATA = [
  { country: "مصر", count: 7245, pct: "58.2%", width: "58.2%" },
  { country: "السعودية", count: 2150, pct: "17.3%", width: "17.3%" },
  { country: "الإمارات", count: 1250, pct: "10.0%", width: "10.0%" },
  { country: "الكويت", count: 680, pct: "5.5%", width: "5.5%" },
  { country: "قطر", count: 430, pct: "3.5%", width: "3.5%" },
  { country: "أخرى", count: 695, pct: "5.5%", width: "5.5%" },
];

const ALERTS_DATA = [
  { title: "اكتشاف معدل فشل مرتفع", desc: "معدل الفشل هو 3.8% وهو أعلى من المعتاد.", time: "قبل 10 دقائق", type: "error", icon: AlertCircle },
  { title: "تم رفض القالب", desc: 'تم رفض القالب الخاص بك "promo_may_en".', time: "قبل 45 دقيقة", type: "warning", icon: AlertCircle },
  { title: "سوف تنتهي صلاحية التوكن قريبًا", desc: "سوف تنتهي صلاحية توكن الوصول الخاص بك خلال يومين.", time: "قبل ساعتين", type: "info", icon: Info },
  { title: "جميع الأنظمة تعمل", desc: "كل شيء يعمل بسلاسة.", time: "اليوم، 9:00 صباحًا", type: "success", icon: CheckCircle },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function WhatsAppStatisticsPage() {
  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");
  const torderAnalysis = useTranslations("orderAnalysis");
  const [quickRange, setQuickRange] = useState("this_month");
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    storeId: "all",
  });

  // Mock charts config
  const chartConfigs = [
    { key: "sent", label: "تم الإرسال", color: "#10b981", fillOpacity: 0.1, tension: 0.44, },
    { key: "delivered", label: "تم التسليم", color: "#34d399", fillOpacity: 0.1, tension: 0.44, },
    { key: "read", label: "تمت القراءة", color: "#60a5fa", fillOpacity: 0.1, tension: 0.44, },
    { key: "clicked", label: "تم النقر", color: "#c084fc", fillOpacity: 0.1, tension: 0.44, },
  ];

  const QUICK_RANGES = [
    { id: "today", label: torderAnalysis("ranges.today") },
    { id: "yesterday", label: torderAnalysis("ranges.yesterday") },
    { id: "this_week", label: torderAnalysis("ranges.this_week") },
    { id: "last_week", label: torderAnalysis("ranges.last_week") },
    { id: "this_month", label: torderAnalysis("ranges.this_month") },
    { id: "last_month", label: torderAnalysis("ranges.last_month") },
    { id: "this_year", label: torderAnalysis("ranges.this_year") },
  ];

  // Transform KPI_DATA for PageHeader stats
  const statsCards = KPI_DATA.map(kpi => ({
    id: kpi.id,
    name: kpi.title,
    value: kpi.value,
    icon: kpi.icon,
    color: kpi.color,
    bg: `bg-[${kpi.color}]/10`,
    iconColor: `text-[${kpi.color}]`,
    pct: kpi.pct,
    trend: kpi.trend,
    isPositive: kpi.isPositive
  }));

  // Mock Trend Data (Just shapes for UI display)
  const mockTrend = Array.from({ length: 15 }).map((_, i) => ({
    label: `May ${i + 1}`,   // ← was "date", chart reads "label"
    sent: 1000 + Math.random() * 500,
    delivered: 900 + Math.random() * 400,
    read: 700 + Math.random() * 300,
    clicked: 200 + Math.random() * 100,
  }));
  // Table Columns Definitions
  const templatesCols = [
    { key: "template", header: "القالب", cell: (r) => <span className="font-semibold text-xs">{r.template}</span> },
    { key: "category", header: "الفئة", cell: (r) => <span className="text-xs">{r.category}</span> },
    { key: "sent", header: "المرسلة", cell: (r) => <span className="tabular-nums font-medium text-xs">{r.sent}</span> },
    { key: "readRate", header: "معدل القراءة", cell: (r) => <PctBar value={r.readRate} color="#3b82f6" /> },
    { key: "clickRate", header: "معدل النقر", cell: (r) => <PctBar value={r.clickRate} color="#10b981" /> },
  ];

  const automationCols = [
    { key: "name", header: "التشغيل التلقائي", cell: (r) => <span className="font-semibold text-xs">{r.name}</span> },
    { key: "triggered", header: "المفعّل", cell: (r) => <span className="tabular-nums text-xs">{r.triggered}</span> },
    { key: "completed", header: "المكتمل", cell: (r) => <span className="tabular-nums text-xs">{r.completed}</span> },
    { key: "cancelled", header: "الملغى", cell: (r) => <span className="tabular-nums text-xs">{r.cancelled}</span> },
    { key: "delayed", header: "المؤجل", cell: (r) => <span className="tabular-nums text-xs">{r.delayed}</span> },
    { key: "successRate", header: "معدل النجاح", cell: (r) => <PctBar value={r.successRate} color="#10b981" /> },
  ];

  const buttonCols = [
    { key: "button", header: "الزر", cell: (r) => <span className="font-semibold text-xs flex items-center gap-2"><div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary"><MousePointerClick size={12} /></div>{r.button}</span> },
    { key: "type", header: "النوع", cell: (r) => <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{r.type}</span> },
    { key: "clicks", header: "النقرات", cell: (r) => <span className="tabular-nums font-medium text-xs">{r.clicks}</span> },
    { key: "clickRate", header: "معدل النقر", cell: (r) => <PctBar value={r.clickRate} color="#10b981" /> },
  ];

  return (
    <div className="min-h-screen p-4 md:p-5 space-y-5 bg-background">
      {/* Page header */}
      <PageHeader
        itemsCompact={false}
        breadcrumbs={[
          { name: "الرئيسية", href: "/dashboard" },
          { name: "إحصائيات واتساب" },
        ]}
        buttons={
          <Button_
            size="sm"
            label="كيفية الاستخدام"
            variant="ghost"
            icon={<Info size={18} />}
          />
        }
        stats={statsCards}
        items={QUICK_RANGES}
        active={quickRange}
        setActive={(v) => {
          setQuickRange(v)
          setFilters(p => ({ ...p, startDate: null, endDate: null }))
        }}
      />

      {/* Filters */}
      <TableFilters
        onApply={() => { }}
        onRefresh={() => { }}
        applyLabel="تطبيق"
      >
        <FilterField label="نطاق التاريخ" icon={Calendar}>
          <DateRangePicker
            value={{
              startDate: filters.startDate,
              endDate: filters.endDate,
            }}
            onChange={(newDates) => {
              setFilters(f => ({ ...f, ...newDates }))
              setQuickRange(null)
            }}
            placeholder="اختر نطاق التاريخ"
            dataSize="default"
            maxDate="today"
          />
        </FilterField>
        <WhatsAppAccountSelect label="إختر الحساب" />
      </TableFilters>

      {/* Row 2: Funnel, Trend, Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Messaging Funnel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card title="تحليل التدفق" icon={Activity} action={<Button_
            variant="ghost"
            size="sm"
            label={"عرض التفاصيل"}
            className="text-[10px] h-6"
            onClick={() => window.location.search = "?tab=manualExpenses"}
          />}>
            <div className="flex flex-col gap-3 mt-4">
              {FUNNEL_DATA.map((item, i) => (
                <div
                  key={item.label}
                  dir="rtl"
                  className="relative w-full h-8 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex items-center px-3"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: item.width }}
                    className={cn("absolute right-0 top-0 bottom-0 z-0", item.color)}
                  />
                  <div className="relative z-10 w-full flex justify-between text-xs font-semibold text-slate-800 dark:text-white">
                    <div className="flex gap-2">
                      <span>{item.value.toLocaleString()}</span>
                      <span className="font-normal opacity-80">{item.label}</span>
                    </div>
                    <span>{item.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Messages Over Time */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-1">
          <Card title="الرسائل بمرور الوقت" icon={TrendingUp} >
            <TrendChart data={mockTrend} loading={false} configs={chartConfigs} />
          </Card>
        </motion.div>

        {/* By Category */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card title="الرسائل حسب الفئة" icon={PieIcon} action={<Button_
            variant="ghost"
            size="sm"
            label={"عرض التفاصيل"}
            className="text-[10px] h-6"
            onClick={() => window.location.search = "?tab=manualExpenses"}
          />}>
            <StatusDonut
              data={CATEGORY_DATA}
              loading={false}
              label="رسالة"
              config={{
                key: "count",
                label: "name",
                // hasPercentage: true,
              }}
            />
          </Card>
        </motion.div>
      </div>

      {/* Row 3: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card title="أفضل القوالب" action={<Button_
            variant="ghost"
            size="sm"
            label={"عرض الكل"}
            className="text-[10px] h-6"
            onClick={() => window.location.search = "?tab=manualExpenses"}
          />} icon={MessageSquare}>
            <MiniTable columns={templatesCols} data={TEMPLATES_DATA} loading={false} />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} >
          <Card title="أداء التشغيل التلقائي" action={<Button_
            variant="ghost"
            size="sm"
            label={"عرض الكل"}
            className="text-[10px] h-6"
            onClick={() => window.location.search = "?tab=manualExpenses"}
          />} icon={CheckCircle}>
            <MiniTable columns={automationCols} data={AUTOMATION_DATA} loading={false} />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} >
          <Card title="أفضل نقرات الأزرار" action={<Button_
            variant="ghost"
            size="sm"
            label={"عرض الكل"}
            className="text-[10px] h-6"
            onClick={() => window.location.search = "?tab=manualExpenses"}
          />} icon={CheckCircle}>
            <MiniTable columns={buttonCols} data={BUTTON_CLICKS_DATA} loading={false} />
          </Card>
        </motion.div>
      </div>

      {/* Row 4: Heatmap, Map, Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Heatmap (Simulated) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card title="خريطة حرارية للنشاط" icon={CheckCircle}>
            <div className="mt-4 flex">
              <div className="flex flex-col gap-[2px] text-[10px] text-muted-foreground ml-2 mt-4 justify-between">
                <span>الاثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span><span>السبت</span><span>الأحد</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-24 gap-[2px]">
                  {Array.from({ length: 7 * 24 }).map((_, i) => {
                    const intensity = Math.random();
                    return (
                      <div
                        key={i}
                        className="h-4 rounded-[1px]"
                        style={{ backgroundColor: intensity > 0.8 ? '#10b981' : intensity > 0.5 ? '#34d399' : intensity > 0.2 ? '#a7f3d0' : '#ecfdf5' }}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                  <span>12 ص</span><span>4 ص</span><span>8 ص</span><span>12 م</span><span>4 م</span><span>8 م</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
              منخفض <div className="flex gap-1 h-2"><div className="w-4 bg-emerald-50" /><div className="w-4 bg-emerald-200" /><div className="w-4 bg-emerald-400" /><div className="w-4 bg-emerald-600" /></div> مرتفع
            </div>
          </Card>
        </motion.div>

        {/* Geography */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card title="توزيع إرسال الرسائل حسب الدولة" icon={Globe} action={<Button_
            variant="ghost"
            size="sm"
            label={"عرض الكل"}
            className="text-[10px] h-6"
            onClick={() => window.location.search = "?tab=manualExpenses"}
          />}>
            <div className="mt-4 space-y-4">
              {GEOGRAPHY_DATA.map(geo => (
                <div key={geo.country} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{geo.country}</span>
                    <span className="text-muted-foreground">{geo.count.toLocaleString()} ({geo.pct})</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: geo.width }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card title="تنبيهات حديثة" icon={Bell} action={<Button_
            variant="ghost"
            size="sm"
            label={"عرض الكل"}
            className="text-[10px] h-6"
            onClick={() => window.location.search = "?tab=manualExpenses"}
          />}>
            <div className="flex flex-col gap-4 mt-4">
              {ALERTS_DATA.map((alert, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className={cn("p-1.5 rounded-full mt-0.5 flex-shrink-0",
                    alert.type === 'error' ? "bg-rose-100 text-rose-500" :
                      alert.type === 'warning' ? "bg-amber-100 text-amber-500" :
                        alert.type === 'info' ? "bg-blue-100 text-blue-500" :
                          "bg-emerald-100 text-emerald-500"
                  )}>
                    <alert.icon size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-semibold text-foreground">{alert.title}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{alert.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}