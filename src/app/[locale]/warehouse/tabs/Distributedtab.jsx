"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Package,
  Search as SearchIcon,
  FileDown,
  Eye,
  CheckCircle2,
  Calendar,
  Loader2,
} from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import DataTable from "@/components/atoms/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS, CARRIERS } from "./data";

// Shipping PDF section
function ShippingPdfSection({ orders }) {
  const [downloading, setDownloading] = useState({});

  const handleDownload = async (carrier, type) => {
    const key = `${carrier}:${type}`;
    setDownloading((p) => ({ ...p, [key]: true }));
    // Simulate download delay
    await new Promise((r) => setTimeout(r, 1500));
    setDownloading((p) => ({ ...p, [key]: false }));
    alert(`جاري تحميل بيان ${type === "outgoing" ? "الصادر" : "المرتجع"} لـ ${carrier}`);
  };

  const carrierGroups = CARRIERS.map((carrier) => ({
    carrier,
    count: orders.filter((o) => o.carrier === carrier).length,
  })).filter((g) => g.count > 0);

  if (carrierGroups.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/10 p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <FileDown className="w-4 h-4 text-[#ff8b00]" />
        بيانات الشحن — تحميل PDF
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {carrierGroups.map(({ carrier, count }) => (
          <div
            key={carrier}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#ff8b00]" />
                <span className="font-bold text-sm">{carrier}</span>
              </div>
              <span className="bg-[#ff8b00]/10 text-[#ff8b00] text-xs font-semibold px-2 py-0.5 rounded-full">
                {count} طلب
              </span>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleDownload(carrier, "outgoing")}
                disabled={!!downloading[`${carrier}:outgoing`]}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-60"
              >
                {downloading[`${carrier}:outgoing`] ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FileDown className="w-3 h-3" />
                )}
                تحميل الصادر
              </button>
              <button
                onClick={() => handleDownload(carrier, "return")}
                disabled={!!downloading[`${carrier}:return`]}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                {downloading[`${carrier}:return`] ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FileDown className="w-3 h-3" />
                )}
                تحميل المرتجع
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DistributedTab({ orders }) {
  const locale = useLocale();

  const distributedOrders = useMemo(
    () => orders.filter((o) => o.status === STATUS.DISTRIBUTED),
    [orders]
  );

  const [search, setSearch] = useState("");
  const [filterCarrier, setFilterCarrier] = useState("");

  const filtered = useMemo(() => {
    let base = distributedOrders;
    const q = search.trim().toLowerCase();
    if (q) {
      base = base.filter((o) =>
        [o.code, o.customer, o.phone, o.city, o.carrier, o.trackingCode].some((x) =>
          String(x || "").toLowerCase().includes(q)
        )
      );
    }
    if (filterCarrier) {
      base = base.filter((o) => o.carrier === filterCarrier);
    }
    return base;
  }, [distributedOrders, search, filterCarrier]);

  const today = new Date().toISOString().split("T")[0];
  const todayCount = distributedOrders.filter((o) =>
    o.sentToCarrier?.at?.startsWith(today)
  ).length;

  const carrierCounts = CARRIERS.reduce((acc, c) => {
    acc[c] = distributedOrders.filter((o) => o.carrier === c).length;
    return acc;
  }, {});

  const stats = [
    { title: "إجمالي الموزعة", value: distributedOrders.length, icon: Truck, cls: "from-purple-500 to-violet-600" },
    { title: "أرامكس", value: carrierCounts.ARAMEX || 0, icon: Truck, cls: "from-orange-500 to-red-500" },
    { title: "SMSA", value: carrierCounts.SMSA || 0, icon: Truck, cls: "from-blue-500 to-cyan-600" },
    { title: "موزعة اليوم", value: todayCount, icon: Calendar, cls: "from-emerald-500 to-teal-600" },
  ];

  const columns = useMemo(
    () => [
      {
        key: "code",
        header: "رقم الطلب",
        className: "font-semibold text-primary min-w-[120px] font-mono",
      },
      {
        key: "customer",
        header: "العميل",
        className: "min-w-[160px] font-medium",
      },
      {
        key: "phone",
        header: "الهاتف",
        className: "min-w-[140px] font-mono text-slate-500",
      },
      {
        key: "city",
        header: "المدينة",
        className: "min-w-[100px]",
      },
      {
        key: "carrier",
        header: "شركة الشحن",
        className: "min-w-[120px]",
        cell: (row) => (
          <span className="flex items-center gap-1.5 font-bold text-sm">
            <Truck className="w-3.5 h-3.5 text-[#ff8b00]" />
            {row.carrier}
          </span>
        ),
      },
      {
        key: "trackingCode",
        header: "كود التتبع",
        className: "min-w-[140px] font-mono text-xs",
        cell: (row) =>
          row.trackingCode ? (
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-xs">
              {row.trackingCode}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: "sentAt",
        header: "تاريخ الإرسال",
        className: "min-w-[150px] text-sm text-slate-500",
        cell: (row) => row.sentToCarrier?.at || "—",
      },
      {
        key: "total",
        header: "الإجمالي",
        className: "min-w-[90px]",
        cell: (row) => (
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {row.total} ر.س
          </span>
        ),
      },
      {
        key: "assignedEmployee",
        header: "الموظف",
        className: "min-w-[120px]",
      },
      {
        key: "actions",
        header: "الإجراءات",
        className: "w-fit",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-3 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => alert(`تتبع الشحنة: ${row.trackingCode || "غير متوفر"}`)}
            >
              <Eye size={14} />
              تتبع
            </motion.button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/10 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">{s.title}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.cls}`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Shipping PDF Section */}
      <ShippingPdfSection orders={distributedOrders} />

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full md:w-[240px]">
            <SearchIcon
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400",
                locale === "ar" ? "right-3" : "left-3"
              )}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className={cn(
                "h-[40px] rounded-full bg-gray-50 dark:bg-slate-800",
                locale === "ar" ? "pr-10" : "pl-10"
              )}
            />
          </div>
          <Select
            value={filterCarrier || "all"}
            onValueChange={(v) => setFilterCarrier(v === "all" ? "" : v)}
          >
            <SelectTrigger className="rounded-full h-[40px] w-[160px]">
              <SelectValue placeholder="كل الشركات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الشركات</SelectItem>
              {CARRIERS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="rounded-full h-[40px] flex items-center gap-2"
          onClick={() => alert("تصدير قريباً")}
        >
          <FileDown size={16} className="text-slate-500" />
          تصدير
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
              <Truck className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-500">لا توجد طلبات موزعة</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={false}
            pagination={{
              total_records: filtered.length,
              current_page: 1,
              per_page: filtered.length,
            }}
            onPageChange={() => {}}
            emptyState="لا توجد طلبات"
          />
        )}
      </div>
    </div>
  );
}