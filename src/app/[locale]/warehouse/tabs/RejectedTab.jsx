"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  XCircle,
  RefreshCw,
  AlertCircle,
  Package,
  Search as SearchIcon,
  FileDown,
  Calendar,
  Eye,
} from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import DataTable from "@/components/atoms/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button_ from "@/components/atoms/Button";
import { STATUS } from "./data";

// Reason Modal
function ReasonModal({ open, onClose, order }) {
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            سبب رفض الطلب — {order.code}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">السبب:</p>
            <p className="text-sm text-red-800 dark:text-red-200">{order.rejectReason || "غير محدد"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">العميل</p>
              <p className="font-semibold text-sm">{order.customer}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">تاريخ الرفض</p>
              <p className="font-semibold text-sm">{order.rejectedAt || "—"}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">المدينة</p>
              <p className="font-semibold text-sm">{order.city}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">الموظف</p>
              <p className="font-semibold text-sm">{order.assignedEmployee}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button_ label="إغلاق" tone="gray" variant="outline" onClick={onClose} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RejectedTab({ orders, updateOrder, pushOp }) {
  const locale = useLocale();

  const rejectedOrders = useMemo(
    () => orders.filter((o) => o.status === STATUS.REJECTED),
    [orders]
  );

  const [search, setSearch] = useState("");
  const [reasonModal, setReasonModal] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rejectedOrders;
    return rejectedOrders.filter((o) =>
      [o.code, o.customer, o.phone, o.city, o.rejectReason].some((x) =>
        String(x || "").toLowerCase().includes(q)
      )
    );
  }, [rejectedOrders, search]);

  const today = new Date().toISOString().split("T")[0];
  const todayCount = rejectedOrders.filter((o) => o.rejectedAt?.startsWith(today)).length;

  // This week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = rejectedOrders.filter(
    (o) => o.rejectedAt && new Date(o.rejectedAt) >= weekAgo
  ).length;

  const stats = [
    { title: "إجمالي المرفوضة", value: rejectedOrders.length, icon: XCircle, cls: "from-red-500 to-rose-600" },
    { title: "مرفوضة اليوم", value: todayCount, icon: Calendar, cls: "from-orange-500 to-amber-500" },
    { title: "هذا الأسبوع", value: weekCount, icon: AlertCircle, cls: "from-amber-500 to-yellow-500" },
    { title: "إجمالي القطع", value: rejectedOrders.reduce((s, o) => s + o.products.reduce((ps, p) => ps + p.requestedQty, 0), 0), icon: Package, cls: "from-slate-500 to-slate-600" },
  ];

  const handleRetry = (order) => {
    updateOrder(order.code, {
      status: STATUS.PENDING,
      rejectReason: "",
      rejectedAt: "",
    });
    pushOp({
      id: `OP-${Date.now()}`,
      operationType: "RETRY_ORDER",
      orderCode: order.code,
      carrier: order.carrier || "-",
      employee: "System",
      result: "SUCCESS",
      details: "تمت إعادة الطلب للانتظار",
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    });
  };

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
        key: "rejectReason",
        header: "سبب الرفض",
        className: "min-w-[200px]",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600 dark:text-red-400 truncate max-w-[160px]">
              {row.rejectReason || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "rejectedAt",
        header: "تاريخ الرفض",
        className: "min-w-[150px] text-sm text-slate-500",
        cell: (row) => row.rejectedAt || "—",
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
              onClick={() => setReasonModal(row)}
            >
              <Eye size={14} />
              عرض السبب
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-3 h-9 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => handleRetry(row)}
            >
              <RefreshCw size={14} />
              إعادة للتحضير
            </motion.button>
          </div>
        ),
      },
    ],
    [handleRetry]
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

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
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
              <XCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-500">لا توجد طلبات مرفوضة</p>
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

      <ReasonModal
        open={!!reasonModal}
        onClose={() => setReasonModal(null)}
        order={reasonModal}
      />
    </div>
  );
}