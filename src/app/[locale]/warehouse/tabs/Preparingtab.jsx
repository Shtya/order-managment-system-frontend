"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ScanLine,
  Ban,
  Package,
  Search as SearchIcon,
  FileDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import DataTable from "@/components/atoms/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS } from "./data";

// Progress bar for scan progress
function ScanProgress({ products }) {
  const total = products.reduce((s, p) => s + p.requestedQty, 0);
  const scanned = products.reduce((s, p) => s + (p.scannedQty || 0), 0);
  const pct = total === 0 ? 0 : Math.round((scanned / total) * 100);

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={cn(
            "h-full rounded-full",
            pct === 100
              ? "bg-gradient-to-r from-emerald-500 to-teal-600"
              : "bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b]"
          )}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
        {scanned}/{total}
      </span>
    </div>
  );
}

export default function PreparingTab({ orders, updateOrder, pushOp, onPrepareOrder }) {
  const locale = useLocale();

  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === STATUS.PREPARING),
    [orders]
  );

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return preparingOrders;
    return preparingOrders.filter((o) =>
      [o.code, o.customer, o.phone, o.city].some((x) =>
        String(x || "").toLowerCase().includes(q)
      )
    );
  }, [preparingOrders, search]);

  const totalItems = preparingOrders.reduce(
    (s, o) => s + o.products.reduce((ps, p) => ps + p.requestedQty, 0),
    0
  );
  const scannedItems = preparingOrders.reduce(
    (s, o) => s + o.products.reduce((ps, p) => ps + (p.scannedQty || 0), 0),
    0
  );
  const remainingItems = totalItems - scannedItems;

  const stats = [
    { title: "قيد التحضير", value: preparingOrders.length, icon: Clock, cls: "from-blue-500 to-indigo-600" },
    { title: "إجمالي القطع", value: totalItems, icon: Package, cls: "from-amber-500 to-orange-500" },
    { title: "ممسوحة", value: scannedItems, icon: CheckCircle2, cls: "from-emerald-500 to-teal-600" },
    { title: "متبقية", value: remainingItems, icon: XCircle, cls: "from-red-500 to-rose-600" },
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
        key: "products",
        header: "المنتجات",
        className: "min-w-[80px] text-center",
        cell: (row) => (
          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-sm font-semibold">
            {row.products.length} منتج
          </span>
        ),
      },
      {
        key: "progress",
        header: "تقدم المسح",
        className: "min-w-[160px]",
        cell: (row) => <ScanProgress products={row.products} />,
      },
      {
        key: "carrier",
        header: "شركة الشحن",
        className: "min-w-[100px]",
        cell: (row) =>
          row.carrier ? (
            <span className="font-semibold text-sm">{row.carrier}</span>
          ) : (
            <span className="text-slate-400 italic text-sm">غير محدد</span>
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
              className="px-3 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => onPrepareOrder(row)}
            >
              <ScanLine size={14} />
              متابعة التحضير
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-3 h-9 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => {
                // trigger reject dialog from parent
                pushOp &&
                  updateOrder(row.code, {
                    status: STATUS.REJECTED,
                    rejectReason: "رفض من تبويب التحضير",
                    rejectedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
                  });
              }}
            >
              <Ban size={14} />
              رفض
            </motion.button>
          </div>
        ),
      },
    ],
    [onPrepareOrder, updateOrder, pushOp]
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
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.cls}`}
              >
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative w-full md:w-[280px]">
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
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-500">لا توجد طلبات قيد التحضير</p>
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