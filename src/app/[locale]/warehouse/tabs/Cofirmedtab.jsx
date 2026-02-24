"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Package,
  CheckCircle2,
  Search as SearchIcon,
  Filter,
  ChevronDown,
  X,
  Layers,
  Info,
  FileDown,
  Ban,
  Store,
  CreditCard,
  MapPin,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import DataTable from "@/components/atoms/DataTable";
import Button_ from "@/components/atoms/Button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATUS, CARRIERS } from "./data";

// ==================== ASSIGN CARRIER DIALOG ====================
function AssignCarrierDialog({ open, onClose, orders, selectedOrderCodes, updateOrder, pushOp }) {
  const t = useTranslations("warehouse.flow.distributionDialog");
  const tCommon = useTranslations("warehouse.common");

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [carrier, setCarrier] = useState("");
  const [loading, setLoading] = useState(false);

  const availableOrders = useMemo(
    () => orders.filter((o) => selectedOrderCodes.includes(o.code)),
    [orders, selectedOrderCodes]
  );

  React.useEffect(() => {
    if (open) {
      setSelectedOrders(availableOrders.map((o) => o.code));
      setCarrier("");
    }
  }, [open, availableOrders]);

  const toggleOrder = (code) =>
    setSelectedOrders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const handleAssign = async () => {
    if (!carrier || selectedOrders.length === 0) return;
    setLoading(true);
    try {
      selectedOrders.forEach((code) => {
        updateOrder(code, { carrier });
        pushOp({
          id: `OP-${Date.now()}-${code}`,
          operationType: "ASSIGN_CARRIER",
          orderCode: code,
          carrier,
          employee: "System",
          result: "SUCCESS",
          details: `تم تعيين شركة الشحن: ${carrier}`,
          createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        });
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Truck className="text-[#ff8b00] dark:text-[#5b4bff]" size={24} />
            تعيين شركة الشحن
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>
              اختر شركة الشحن <span className="text-red-500">*</span>
            </Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="اختر شركة الشحن" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c} value={c}>
                    <div className="flex items-center gap-2">
                      <Truck size={16} />
                      {c}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>الطلبات المحددة</Label>
              <span className="text-xs text-slate-500">{selectedOrders.length} محدد</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              {availableOrders.map((order) => (
                <motion.div
                  key={order.code}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    selectedOrders.includes(order.code)
                      ? "bg-gradient-to-r from-[#ff8b00]/10 to-[#ff5c2b]/10 border-[#ff8b00] dark:border-[#5b4bff]"
                      : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
                  )}
                  onClick={() => toggleOrder(order.code)}
                >
                  <Checkbox
                    checked={selectedOrders.includes(order.code)}
                    onCheckedChange={() => toggleOrder(order.code)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{order.code}</p>
                    <p className="text-xs text-gray-500">
                      {order.customer} — {order.city}
                    </p>
                  </div>
                  {order.carrier && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {order.carrier}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button_
              label={tCommon("cancel")}
              tone="gray"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            />
            <Button_
              label="تعيين شركة الشحن"
              tone="purple"
              variant="solid"
              onClick={handleAssign}
              disabled={loading || !carrier || selectedOrders.length === 0}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== ORDER DETAIL MODAL ====================
function OrderDetailModal({ open, onClose, order }) {
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="text-[#ff8b00] dark:text-[#5b4bff]" size={24} />
            تفاصيل الطلب — {order.code}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "العميل", value: order.customer },
              { label: "الهاتف", value: order.phone },
              { label: "المدينة", value: order.city },
              { label: "المنطقة", value: order.area },
              { label: "المتجر", value: order.store },
              { label: "شركة الشحن", value: order.carrier || "غير محدد" },
              { label: "كود التتبع", value: order.trackingCode || "—" },
              { label: "نوع الدفع", value: order.paymentType },
              { label: "الإجمالي", value: `${order.total} ر.س` },
              { label: "تكلفة الشحن", value: `${order.shippingCost} ر.س` },
              { label: "فتح العبوة", value: order.allowOpenPackage ? "مسموح" : "غير مسموح" },
              { label: "الإرجاع", value: order.allowReturn ? "مسموح" : "غير مسموح" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-3 font-semibold">المنتجات</p>
            <div className="space-y-2">
              {order.products.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {p.sku}
                  </span>
                  <span className="flex-1 mx-3">{p.name}</span>
                  <span className="text-slate-500">×{p.requestedQty}</span>
                  <span className="font-semibold ms-4">{p.price * p.requestedQty} ر.س</span>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-600 mb-1 font-semibold">ملاحظات</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{order.notes}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button_ label="إغلاق" tone="gray" variant="outline" onClick={onClose} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== CONFIRMED ORDERS SUB-TABLE ====================
function ConfirmedOrdersTable({
  orders,
  showWithCarrier,
  selectedOrders,
  toggleOrderSelection,
  selectAllOrders,
  setAssignCarrierDialog,
  setDetailModal,
  updateOrder,
  pushOp,
}) {
  const locale = useLocale();

  const filtered = useMemo(
    () =>
      orders.filter((o) =>
        showWithCarrier ? !!o.carrier : !o.carrier
      ),
    [orders, showWithCarrier]
  );

  const columns = useMemo(
    () => [
      {
        key: "select",
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={filtered.length > 0 && selectedOrders.length === filtered.length}
              onCheckedChange={() => selectAllOrders(filtered)}
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
        key: "store",
        header: "المتجر",
        className: "min-w-[120px]",
        cell: (row) => (
          <div className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm">{row.store}</span>
          </div>
        ),
      },
      {
        key: "total",
        header: "الإجمالي",
        className: "min-w-[100px]",
        cell: (row) => (
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {row.total} ر.س
          </span>
        ),
      },
      {
        key: "paymentType",
        header: "الدفع",
        className: "min-w-[80px]",
        cell: (row) => (
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold border",
              row.paymentType === "PAID"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}
          >
            {row.paymentType === "PAID" ? "مدفوع" : "عند الاستلام"}
          </span>
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
            <span className="text-slate-400 text-sm italic">غير محدد</span>
          ),
      },
      {
        key: "orderDate",
        header: "تاريخ الطلب",
        className: "min-w-[120px] text-slate-500 text-sm",
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
              className="px-3 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => setDetailModal(row)}
            >
              <Info size={14} />
              تفاصيل
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-3 h-9 rounded-full border border-[#ff8b00]/40 bg-[#ff8b00]/10 text-[#ff8b00] dark:text-orange-300 hover:bg-[#ff8b00] hover:text-white text-sm font-medium transition-all flex items-center gap-1"
              onClick={() => {
                setAssignCarrierDialog({ open: true, codes: [row.code] });
              }}
            >
              <Truck size={14} />
              {row.carrier ? "تغيير الشركة" : "تعيين شركة شحن"}
            </motion.button>
            {!row.carrier && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-3 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
                onClick={() => {
                  updateOrder(row.code, { status: "PREPARING" });
                  pushOp({
                    id: `OP-${Date.now()}`,
                    operationType: "START_PREPARING",
                    orderCode: row.code,
                    carrier: row.carrier || "-",
                    employee: row.assignedEmployee || "System",
                    result: "SUCCESS",
                    details: "بدأ التحضير من الطلبات المؤكدة",
                    createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
                  });
                }}
              >
                بدء التحضير
              </motion.button>
            )}
          </div>
        ),
      },
    ],
    [filtered, selectedOrders, toggleOrderSelection, selectAllOrders]
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
      {filtered.length === 0 ? (
        <div className="p-12 flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-500">
            {showWithCarrier ? "لا توجد طلبات مؤكدة مع شركة شحن" : "لا توجد طلبات مؤكدة بدون شركة شحن"}
          </p>
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
  );
}

// ==================== MAIN CONFIRMED TAB ====================
export default function ConfirmedTab({ orders, updateOrder, pushOp }) {
  const locale = useLocale();

  const confirmedOrders = useMemo(
    () => orders.filter((o) => o.status === STATUS.CONFIRMED),
    [orders]
  );

  const withCarrier = confirmedOrders.filter((o) => !!o.carrier);
  const withoutCarrier = confirmedOrders.filter((o) => !o.carrier);

  const [nestedTab, setNestedTab] = useState("without"); // "without" | "with"
  const [search, setSearch] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [assignCarrierDialog, setAssignCarrierDialog] = useState({ open: false, codes: [] });
  const [detailModal, setDetailModal] = useState(null);

  const filteredOrders = useMemo(() => {
    let base = nestedTab === "without" ? withoutCarrier : withCarrier;
    const q = search.trim().toLowerCase();
    if (q) {
      base = base.filter((o) =>
        [o.code, o.customer, o.phone, o.city, o.carrier, o.store].some((x) =>
          String(x || "").toLowerCase().includes(q)
        )
      );
    }
    return base;
  }, [nestedTab, withoutCarrier, withCarrier, search]);

  const toggleOrderSelection = (code) =>
    setSelectedOrders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const selectAllOrders = (list) => {
    const codes = list.map((o) => o.code);
    if (selectedOrders.length === codes.length) setSelectedOrders([]);
    else setSelectedOrders(codes);
  };

  const stats = [
    {
      title: "إجمالي المؤكدة",
      value: confirmedOrders.length,
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "بدون شركة شحن",
      value: withoutCarrier.length,
      icon: Ban,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "مع شركة شحن",
      value: withCarrier.length,
      icon: Truck,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "جاهزة للتحضير",
      value: withCarrier.length,
      icon: Package,
      color: "from-purple-500 to-pink-600",
    },
  ];

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
                className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.color} bg-opacity-20`}
              >
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Nested Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/10 p-1 inline-flex gap-1">
        {[
          {
            id: "without",
            label: "مؤكد بدون شركة شحن",
            count: withoutCarrier.length,
            icon: Ban,
          },
          {
            id: "with",
            label: "مؤكد مع شركة شحن",
            count: withCarrier.length,
            icon: Truck,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setNestedTab(tab.id);
              setSelectedOrders([]);
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
              nestedTab === tab.id
                ? "bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b] dark:from-[#5b4bff] dark:to-[#3be7ff] text-white shadow-md"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                nestedTab === tab.id
                  ? "bg-white/30 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              )}
            >
              {tab.count}
            </span>
          </button>
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
            placeholder="بحث برقم الطلب أو العميل..."
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
            onClick={() => {
              if (selectedOrders.length > 0) {
                setAssignCarrierDialog({ open: true, codes: selectedOrders });
              }
            }}
            disabled={selectedOrders.length === 0}
            className={cn(
              "h-[40px] px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-all",
              selectedOrders.length === 0
                ? "bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b] dark:from-[#5b4bff] dark:to-[#3be7ff] text-white shadow-lg hover:shadow-xl"
            )}
          >
            <Truck size={16} />
            توزيع المحدد على شركة شحن
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

      {/* Bulk Selection Bar */}
      <AnimatePresence>
        {selectedOrders.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-slate-200/60 dark:border-white/10 p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="w-4 h-4 text-[rgb(var(--primary))]" />
                  تم تحديد {selectedOrders.length} طلب
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setAssignCarrierDialog({ open: true, codes: selectedOrders })}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    تعيين شركة شحن
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedOrders([])}
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <ConfirmedOrdersTable
        orders={filteredOrders}
        showWithCarrier={nestedTab === "with"}
        selectedOrders={selectedOrders}
        toggleOrderSelection={toggleOrderSelection}
        selectAllOrders={selectAllOrders}
        setAssignCarrierDialog={setAssignCarrierDialog}
        setDetailModal={setDetailModal}
        updateOrder={updateOrder}
        pushOp={pushOp}
      />

      {/* Dialogs */}
      <AssignCarrierDialog
        open={assignCarrierDialog.open}
        onClose={() => setAssignCarrierDialog({ open: false, codes: [] })}
        orders={orders}
        selectedOrderCodes={assignCarrierDialog.codes}
        updateOrder={updateOrder}
        pushOp={pushOp}
      />

      <OrderDetailModal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        order={detailModal}
      />
    </div>
  );
}