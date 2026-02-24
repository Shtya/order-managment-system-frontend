"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Package,
  Search as SearchIcon,
  Loader2,
} from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import DataTable from "@/components/atoms/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OPERATION_LABELS = {
  ORDER_PREPARED: "تحضير طلب",
  REJECT_ORDER: "رفض طلب",
  DISTRIBUTE_ORDER: "توزيع طلب",
  START_PREPARING: "بدء التحضير",
  BULK_REJECT: "رفض جماعي",
  RETRY_ORDER: "إعادة طلب",
  ASSIGN_CARRIER: "تعيين شركة شحن",
};

async function downloadPdfFromApi({ orderCode, type, locale }) {
  const res = await fetch(
    `/api/pdf/order/${encodeURIComponent(orderCode)}?locale=${locale}`,
    { method: "GET" }
  );
  if (!res.ok) {
    const msg = await res.text().catch(() => "فشل توليد PDF");
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}_${orderCode}_${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LogsTab({ opsLogs }) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return opsLogs;
    return opsLogs.filter((l) =>
      [l.id, l.orderCode, l.carrier, l.employee, l.details].some((x) =>
        String(x || "").toLowerCase().includes(q)
      )
    );
  }, [opsLogs, search]);

  const successCount = opsLogs.filter((l) => l.result === "SUCCESS").length;
  const failCount = opsLogs.filter((l) => l.result === "FAILED").length;
  const rate = opsLogs.length > 0 ? Math.round((successCount / opsLogs.length) * 100) : 0;

  const stats = [
    { title: "إجمالي العمليات", value: opsLogs.length, icon: ClipboardList, cls: "from-slate-500 to-slate-700" },
    { title: "ناجحة", value: successCount, icon: CheckCircle2, cls: "from-emerald-500 to-teal-600" },
    { title: "فاشلة", value: failCount, icon: XCircle, cls: "from-red-500 to-rose-600" },
    { title: "نسبة النجاح", value: `${rate}%`, icon: Package, cls: "from-purple-500 to-violet-600" },
  ];

  const handlePrint = async (log, type) => {
    const key = `${type}:${log.orderCode}`;
    setDownloading((p) => ({ ...p, [key]: true }));
    try {
      await downloadPdfFromApi({ orderCode: log.orderCode, type, locale });
    } catch (e) {
      alert(e.message);
    } finally {
      setDownloading((p) => ({ ...p, [key]: false }));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "رقم العملية",
        className: "font-semibold text-primary w-[140px] font-mono",
      },
      {
        key: "operationType",
        header: "نوع العملية",
        className: "min-w-[160px]",
        cell: (row) => (
          <span className="text-sm font-medium">
            {OPERATION_LABELS[row.operationType] || row.operationType}
          </span>
        ),
      },
      {
        key: "orderCode",
        header: "رقم الطلب",
        className: "min-w-[120px] font-mono",
      },
      {
        key: "carrier",
        header: "شركة الشحن",
        className: "min-w-[100px]",
      },
      {
        key: "employee",
        header: "الموظف",
        className: "min-w-[120px]",
      },
      {
        key: "result",
        header: "النتيجة",
        className: "min-w-[100px]",
        cell: (row) => (
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold border",
              row.result === "SUCCESS"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40"
            )}
          >
            {row.result === "SUCCESS" ? "ناجح" : "فاشل"}
          </span>
        ),
      },
      {
        key: "details",
        header: "التفاصيل",
        className: "min-w-[180px] text-sm text-slate-500",
      },
      {
        key: "createdAt",
        header: "التاريخ والوقت",
        className: "min-w-[150px] text-sm text-slate-500",
      },
      {
        key: "actions",
        header: "الإجراءات",
        className: "!w-fit",
        cell: (row) => {
          const successKey = `success:${row.orderCode}`;
          const failKey = `fail:${row.orderCode}`;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => handlePrint(row, "success")}
                disabled={!!downloading[successKey] || !!downloading[failKey]}
              >
                {downloading[successKey] ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-1" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-1" />
                )}
                طباعة ناجح
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => handlePrint(row, "fail")}
                disabled={!!downloading[successKey] || !!downloading[failKey]}
              >
                {downloading[failKey] ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-1" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 ml-1" />
                )}
                طباعة فاشل
              </Button>
            </div>
          );
        },
      },
    ],
    [downloading]
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

      {/* Search */}
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
            placeholder="بحث في السجل..."
            className={cn(
              "h-[40px] rounded-full bg-gray-50 dark:bg-slate-800",
              locale === "ar" ? "pr-10" : "pl-10"
            )}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
              <ClipboardList className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-500">لا توجد عمليات مسجلة</p>
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
            emptyState="لا توجد عمليات"
          />
        )}
      </div>
    </div>
  );
}