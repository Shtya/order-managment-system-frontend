"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Truck,
  Package,
  Search as SearchIcon,
  FileDown,
  Layers,
  Edit,
  Printer,
} from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import DataTable from "@/components/atoms/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { STATUS } from "./data";

export default function PreparedTab({ orders, updateOrder, pushOp, setDistributionDialog, setSelectedOrdersGlobal, onPrepareOrder }) {
  const locale = useLocale();

  const preparedOrders = useMemo(
    () => orders.filter((o) => o.status === STATUS.PREPARED),
    [orders]
  );

  const [search, setSearch] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return preparedOrders;
    return preparedOrders.filter((o) =>
      [o.code, o.customer, o.phone, o.city, o.carrier].some((x) =>
        String(x || "").toLowerCase().includes(q)
      )
    );
  }, [preparedOrders, search]);

  const totalItems = preparedOrders.reduce(
    (s, o) => s + o.products.reduce((ps, p) => ps + p.scannedQty, 0),
    0
  );
  const withCarrier = preparedOrders.filter((o) => !!o.carrier).length;

  const stats = [
    { title: "طلبات جاهزة", value: preparedOrders.length, icon: CheckCircle2, cls: "from-emerald-500 to-teal-600" },
    { title: "إجمالي القطع", value: totalItems, icon: Package, cls: "from-purple-500 to-pink-600" },
    { title: "جاهز للتوزيع", value: preparedOrders.length, icon: Truck, cls: "from-blue-500 to-indigo-600" },
    { title: "مع شركة شحن", value: withCarrier, icon: CheckCircle2, cls: "from-amber-500 to-orange-500" },
  ];

  const toggleOrderSelection = (code) =>
    setSelectedOrders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const selectAll = () => {
    if (selectedOrders.length === filtered.length) setSelectedOrders([]);
    else setSelectedOrders(filtered.map((o) => o.code));
  };

  const handleBulkDistribute = () => {
    if (setSelectedOrdersGlobal) setSelectedOrdersGlobal(selectedOrders);
    if (setDistributionDialog) setDistributionDialog(true);
  };

  const columns = useMemo(
    () => [
      {
        key: "select",
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={filtered.length > 0 && selectedOrders.length === filtered.length}
              onCheckedChange={selectAll}
            />
          </div>
        ),
        className: "w-[50px]",
        cell: (row) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedOrders.includes(row.code)}
              onCheckedChange={() => toggleOrderSelection(row.code)}
            />
          </div>
        ),
      },
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
        className: "min-w-[80px]",
        cell: (row) => (
          <div className="space-y-0.5">
            {row.products.map((p, i) => (
              <div key={i} className="text-xs text-slate-500">
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{p.sku}</span>
                {" "}{p.name} ×{p.scannedQty}
              </div>
            ))}
          </div>
        ),
      },
      {
        key: "carrier",
        header: "شركة الشحن",
        className: "min-w-[120px]",
        cell: (row) =>
          row.carrier ? (
            <span className="flex items-center gap-1.5 font-semibold text-sm">
              <Truck className="w-3.5 h-3.5 text-[#ff8b00]" />
              {row.carrier}
            </span>
          ) : (
            <span className="text-slate-400 italic text-sm">غير محدد</span>
          ),
      },
      {
        key: "preparedAt",
        header: "تاريخ التحضير",
        className: "min-w-[140px] text-slate-500 text-sm",
        cell: (row) => row.preparedAt || row.orderDate || "—",
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
          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-3 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => {
                if (setSelectedOrdersGlobal) setSelectedOrdersGlobal([row.code]);
                if (setDistributionDialog) setDistributionDialog(true);
              }}
            >
              <Truck size={14} />
              توزيع
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-3 h-9 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => onPrepareOrder && onPrepareOrder(row)}
            >
              <Edit size={14} />
              تعديل
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-3 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => alert("طباعة الوصل - قريباً")}
            >
              <Printer size={14} />
              طباعة
            </motion.button>
          </div>
        ),
      },
    ],
    [filtered, selectedOrders]
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
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBulkDistribute}
            disabled={selectedOrders.length === 0}
            className={cn(
              "h-[40px] px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-all",
              selectedOrders.length === 0
                ? "bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl"
            )}
          >
            <Truck size={16} />
            توزيع المحدد ({selectedOrders.length})
          </motion.button>
          <Button
            variant="outline"
            className="rounded-full h-[40px] flex items-center gap-2"
            onClick={() => alert("تصدير قريباً")}
          >
            <FileDown size={16} className="text-slate-500" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Bulk bar */}
      <AnimatePresence>
        {selectedOrders.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-slate-200/60 dark:border-white/10 p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  تم تحديد {selectedOrders.length} طلب جاهز للتوزيع
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={handleBulkDistribute}>
                    <Truck className="w-4 h-4 mr-2" />
                    توزيع على شركة شحن
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSelectedOrders([])}>
                    إلغاء التحديد
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
              <CheckCircle2 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-500">لا توجد طلبات جاهزة</p>
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