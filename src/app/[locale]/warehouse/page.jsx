"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Truck,
  ClipboardList,
  ArrowLeft,
  Info,
  ScanLine,
  Ban,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  Edit,
  RefreshCw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

import Button_ from "@/components/atoms/Button";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Tab components
import ConfirmedTab from "./tabs/Cofirmedtab";
import PreparingTab from "./tabs/Preparingtab";
import PreparedTab from "./tabs/Preparedtab";
import DistributedTab from "./tabs/Distributedtab";
import RejectedTab from "./tabs/RejectedTab";
import LogsTab from "./tabs/LogsTab";

// Data
import { initialOrders, initialOpsLogs, STATUS, CARRIERS } from "./tabs/data";

// ==================== PREPARE ORDER VIEW ====================
function PrepareOrderView({ order, onBack, updateOrder, pushOp }) {
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [scannedOrderCode, setScannedOrderCode] = useState("");
  const [currentSku, setCurrentSku] = useState("");
  const [products, setProducts] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  useEffect(() => {
    if (order) {
      setProducts(order.products.map((p) => ({ ...p, scannedQty: p.scannedQty || 0, completed: false })));
      setStep(1);
      setScannedOrderCode("");
      setCurrentSku("");
      setScanLogs([]);
    }
  }, [order]);

  const scanOrderCode = () => {
    if (scannedOrderCode.trim() === order.code) {
      setStep(2);
      setScanLogs([{ success: true, message: "تم مسح الطلب بنجاح", timestamp: new Date().toISOString() }]);
    } else {
      setScanLogs([{ success: false, message: "كود الطلب غير صحيح", reason: "الكود المُدخل لا يطابق رقم الطلب", timestamp: new Date().toISOString() }]);
    }
  };

  const scanItem = () => {
    const sku = currentSku.trim();
    if (!sku) return;
    const idx = products.findIndex((p) => p.sku === sku);
    if (idx === -1) {
      setScanLogs((prev) => [...prev, { success: false, message: `SKU غير موجود: ${sku}`, reason: "هذا SKU ليس ضمن منتجات الطلب", timestamp: new Date().toISOString() }]);
      setCurrentSku("");
      return;
    }
    const product = products[idx];
    if (product.scannedQty >= product.requestedQty) {
      setScanLogs((prev) => [...prev, { success: false, message: `SKU مكتمل: ${sku}`, reason: "تم مسح الكمية المطلوبة بالكامل", timestamp: new Date().toISOString() }]);
      setCurrentSku("");
      return;
    }
    const updated = [...products];
    updated[idx] = { ...product, scannedQty: product.scannedQty + 1, completed: product.scannedQty + 1 >= product.requestedQty };
    setProducts(updated);
    setScanLogs((prev) => [...prev, { success: true, message: `تم المسح: ${product.name} (${product.scannedQty + 1}/${product.requestedQty})`, timestamp: new Date().toISOString() }]);
    setCurrentSku("");
  };

  const allScanned = products.every((p) => p.scannedQty >= p.requestedQty);

  const markPrepared = async () => {
    setLoading(true);
    try {
      updateOrder(order.code, { status: STATUS.PREPARED, products, preparedAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
      pushOp({ id: `OP-${Date.now()}`, operationType: "ORDER_PREPARED", orderCode: order.code, carrier: order.carrier || "-", employee: order.assignedEmployee || "System", result: "SUCCESS", details: "تم تحضير الطلب بنجاح", createdAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
      setSuccessDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const incompleteProducts = products.filter((p) => !p.completed);
  const completedProducts = products.filter((p) => p.completed);
  const sortedProducts = [...incompleteProducts, ...completedProducts];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="shrink-0 p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.08] hover:bg-[var(--primary)]/10 text-slate-600 dark:text-slate-300 hover:text-[var(--primary)] transition-all duration-200"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </motion.button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)]/10">
                <Package className="text-[var(--primary)]" size={18} />
              </span>
              تحضير الطلب
              <span className="text-sm font-mono px-2.5 py-0.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                {order.code}
              </span>
            </h2>
            <p className="text-sm text-slate-500 ms-10">امسح باركود المنتجات لتأكيد التحضير</p>
          </div>
        </div>
        {step === 2 && allScanned && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={markPrepared}
            disabled={loading}
            className="btn-primary1 shrink-0 px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            تأكيد التحضير
          </motion.button>
        )}
      </div>

      {/* Order Details */}
      <div className="bg-card relative overflow-hidden">
        <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--primary)]/10">
            <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
          </span>
          تفاصيل الطلب
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "العميل", value: order.customer, icon: User },
            { label: "الهاتف", value: order.phone, icon: Phone, mono: true },
            { label: "المدينة", value: order.city, icon: MapPin },
            { label: "شركة الشحن", value: order.carrier || "غير محدد", icon: Truck },
          ].map(({ label, value, icon: Icon, mono }) => (
            <div key={label} className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-xl p-3 hover:border-[var(--primary)]/30 transition-all">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3 h-3 text-[var(--primary)]/70" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
              </div>
              <p className={`font-semibold text-sm truncate ${mono ? "font-mono" : ""}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b] dark:from-[#5b4bff] dark:to-[#3be7ff]">
              <ScanLine className="w-12 h-12 text-white dark:text-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold">امسح كود الطلب</h3>
              <p className="text-sm text-slate-500 mt-1">قم بمسح باركود الطلب للمتابعة</p>
            </div>
          </div>
          <div className="relative max-w-xl mx-auto">
            <input
              value={scannedOrderCode}
              onChange={(e) => setScannedOrderCode(e.target.value)}
              placeholder="أدخل أو امسح كود الطلب"
              onKeyDown={(e) => { if (e.key === "Enter") scanOrderCode(); }}
              autoFocus
              className="h-16 w-full px-5 rtl:text-right ltr:text-left text-lg font-semibold rounded-2xl border-2 border-slate-300 bg-white text-slate-800 outline-none transition-[border-color,box-shadow] focus:border-[var(--primary)] dark:bg-[#182337] dark:text-slate-100 dark:border-white/10 dark:focus:border-[var(--primary)]"
            />
            <div className="absolute rtl:left-2 ltr:right-2 top-1/2 -translate-y-1/2">
              <button onClick={scanOrderCode} className="btn-primary1 h-12 px-4 rounded-xl flex items-center gap-1.5 text-sm font-bold text-white whitespace-nowrap">
                <ScanLine className="w-4 h-4 shrink-0" />
                مسح
              </button>
            </div>
          </div>
          {scanLogs.length > 0 && (
            <div className={cn("max-w-xl mx-auto p-3 rounded-xl border text-sm flex items-center gap-2", scanLogs[0].success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")}>
              {scanLogs[0].success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
              {scanLogs[0].message}
            </div>
          )}
        </motion.div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="relative mt-6 mb-12 max-w-xl mx-auto">
                <input
                  value={currentSku}
                  onChange={(e) => setCurrentSku(e.target.value)}
                  placeholder="أدخل أو امسح SKU المنتج"
                  onKeyDown={(e) => { if (e.key === "Enter") scanItem(); }}
                  autoFocus
                  className="h-16 w-full px-5 rtl:text-right text-lg font-semibold rounded-2xl border-2 border-slate-300 bg-white text-slate-800 outline-none focus:border-[var(--primary)] dark:bg-[#182337] dark:text-slate-100 dark:border-white/10"
                />
                <div className="absolute rtl:left-2 ltr:right-2 top-1/2 -translate-y-1/2">
                  <button onClick={scanItem} className="btn-primary1 h-12 px-4 rounded-xl flex items-center gap-1.5 text-sm font-bold text-white whitespace-nowrap">
                    <ScanLine className="w-4 h-4" />
                    مسح
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#ff8b00]" />
                  المنتجات
                </h3>
                <span className="text-xs text-slate-500">{products.filter((p) => p.completed).length}/{products.length} مكتمل</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sortedProducts.map((p, idx) => (
                  <motion.div
                    key={idx}
                    layout
                    className={cn("rounded-xl border p-4 transition-all duration-300", p.completed ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : "bg-white dark:bg-slate-900 border-slate-200")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{p.sku}</code>
                          <span className="font-semibold">{p.name}</span>
                          {p.completed && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-500">التقدم: <span className="font-mono font-semibold">{p.scannedQty}/{p.requestedQty}</span></span>
                          <div className="flex-1 max-w-xs">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <motion.div
                                animate={{ width: `${(p.scannedQty / p.requestedQty) * 100}%` }}
                                transition={{ duration: 0.5 }}
                                className={cn("h-full rounded-full", p.completed ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b]")}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className={cn("text-sm font-bold px-3 py-1 rounded-full", p.completed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {p.completed ? "مكتمل" : "معلق"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Scan Logs */}
          <div className="lg:col-span-1">
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-6 space-y-4 sticky top-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#ff8b00]" />
                سجل المسح
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {scanLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد عمليات مسح بعد</p>
                  </div>
                ) : (
                  scanLogs.slice().reverse().map((log, idx) => (
                    <motion.div
                      key={scanLogs.length - idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("p-3 rounded-xl border text-sm", log.success ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : "bg-red-50 dark:bg-red-950/20 border-red-200")}
                    >
                      <div className="flex items-start gap-2">
                        {log.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className={cn("font-medium", log.success ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200")}>{log.message}</p>
                          {log.reason && <p className="text-xs text-slate-500 mt-0.5">{log.reason}</p>}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl">
          <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={24} />
              تم التحضير بنجاح
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              تم تحضير الطلب بنجاح وهو جاهز للتوزيع على شركة الشحن.
            </p>
            <div className="flex justify-end">
              <Button_ label="إغلاق" tone="purple" variant="solid" onClick={() => { setSuccessDialog(false); onBack(); }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== REJECT DIALOG ====================
function RejectDialog({ open, onClose, order, updateOrder, pushOp }) {
  const [scannedOrderCode, setScannedOrderCode] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setScannedOrderCode(""); setReason(""); }
  }, [open]);

  const submitReject = async () => {
    if (scannedOrderCode.trim() !== order.code || !reason.trim()) return;
    setLoading(true);
    try {
      updateOrder(order.code, { status: STATUS.REJECTED, rejectReason: reason, rejectedAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
      pushOp({ id: `OP-${Date.now()}`, operationType: "REJECT_ORDER", orderCode: order.code, carrier: order.carrier || "-", employee: order.assignedEmployee || "System", result: "FAILED", details: `تم الرفض: ${reason}`, createdAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Ban className="text-red-500" size={24} />
            رفض الطلب — {order?.code}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>امسح كود الطلب للتأكيد</Label>
            <Input value={scannedOrderCode} onChange={(e) => setScannedOrderCode(e.target.value)} placeholder={order?.code} className="rounded-xl font-mono" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>سبب الرفض <span className="text-red-500">*</span></Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="أدخل سبب رفض الطلب..." className="rounded-xl min-h-[100px]" />
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">تحذير: سيتم نقل الطلب إلى قائمة المرفوضات</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button_ label="إلغاء" tone="gray" variant="outline" onClick={onClose} disabled={loading} />
            <Button_ label="تأكيد الرفض" tone="red" variant="solid" onClick={submitReject} disabled={loading || !reason.trim() || scannedOrderCode.trim() !== order?.code} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== DISTRIBUTION DIALOG ====================
function DistributionDialog({ open, onClose, orders, selectedOrderCodes, updateOrder, pushOp }) {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [carrier, setCarrier] = useState("");
  const [loading, setLoading] = useState(false);

  const availableOrders = useMemo(
    () => orders.filter((o) => o.status === STATUS.PREPARED && selectedOrderCodes.includes(o.code)),
    [orders, selectedOrderCodes]
  );

  useEffect(() => {
    if (open) { setSelectedOrders(availableOrders.map((o) => o.code)); setCarrier(""); }
  }, [open, availableOrders]);

  const toggleOrder = (code) =>
    setSelectedOrders((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);

  const handleDistribute = async () => {
    if (!carrier || selectedOrders.length === 0) return;
    setLoading(true);
    try {
      selectedOrders.forEach((code) => {
        updateOrder(code, { carrier, status: STATUS.DISTRIBUTED, sentToCarrier: { ok: true, at: new Date().toISOString().slice(0, 16).replace("T", " ") } });
        pushOp({ id: `OP-${Date.now()}-${code}`, operationType: "DISTRIBUTE_ORDER", orderCode: code, carrier, employee: "System", result: "SUCCESS", details: `تم التوزيع على: ${carrier}`, createdAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
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
            توزيع الطلبات على شركة الشحن
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 p-4">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">اختر شركة الشحن والطلبات المراد توزيعها</p>
            <p className="text-xs text-blue-600 mt-1">تم تحديد {selectedOrders.length} طلب</p>
          </div>
          <div className="space-y-2">
            <Label>اختر شركة الشحن <span className="text-red-500">*</span></Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="اختر شركة الشحن" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c} value={c}>
                    <div className="flex items-center gap-2">
                      <Truck size={16} />{c}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label>الطلبات الجاهزة للتوزيع</Label>
            <div className="max-h-[300px] overflow-y-auto space-y-2 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              {availableOrders.length === 0 ? (
                <p className="text-center py-8 text-slate-500">لا توجد طلبات جاهزة للتوزيع</p>
              ) : (
                availableOrders.map((order) => (
                  <motion.div
                    key={order.code}
                    whileHover={{ scale: 1.01 }}
                    className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", selectedOrders.includes(order.code) ? "bg-[#ff8b00]/10 border-[#ff8b00] dark:border-[#5b4bff]" : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700")}
                    onClick={() => toggleOrder(order.code)}
                  >
                    <Checkbox checked={selectedOrders.includes(order.code)} onCheckedChange={() => toggleOrder(order.code)} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{order.code}</p>
                      <p className="text-xs text-gray-500">{order.customer} — {order.city}</p>
                    </div>
                    <span className="text-xs text-gray-400">{order.products.length} منتج</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button_ label="إلغاء" tone="gray" variant="outline" onClick={onClose} disabled={loading} />
            <Button_ label="تأكيد التوزيع" tone="purple" variant="solid" onClick={handleDistribute} disabled={loading || !carrier || selectedOrders.length === 0} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== TAB CONFIGURATION ====================
const TAB_IDS = ["confirmed", "preparing", "prepared", "distributed", "rejected", "logs"];

// ==================== MAIN PAGE ====================
export default function WarehouseFlowPage() {
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [orders, setOrders] = useState(initialOrders);
  const [opsLogs, setOpsLogs] = useState(initialOpsLogs);

  // Read active tab from URL
  const activeTabFromUrl = searchParams.get("tab");
  const activeTab = TAB_IDS.includes(activeTabFromUrl) ? activeTabFromUrl : "confirmed";

  const setActiveTab = useCallback(
    (tabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Prepare view
  const [preparingOrder, setPreparingOrder] = useState(null);

  // Dialogs
  const [rejectDialog, setRejectDialog] = useState({ open: false, order: null });
  const [distributionDialog, setDistributionDialog] = useState(false);
  const [selectedOrdersForDist, setSelectedOrdersForDist] = useState([]);

  // Callbacks
  const pushOp = useCallback((op) => {
    setOpsLogs((prev) => [{ ...op }, ...prev]);
  }, []);

  const updateOrder = useCallback((code, patch) => {
    setOrders((prev) => prev.map((o) => (o.code === code ? { ...o, ...patch } : o)));
  }, []);

  // Tab config for SwitcherTabs
  const tabConfig = [
    { id: "confirmed", label: "الطلبات المؤكدة والتوزيع", icon: CheckCircle2 },
    { id: "preparing", label: "قيد التحضير", icon: Clock },
    { id: "prepared", label: "جاهزة للشحن", icon: Package },
    { id: "distributed", label: "موزعة", icon: Truck },
    { id: "rejected", label: "مرفوضة", icon: XCircle },
    { id: "logs", label: "سجل العمليات", icon: ClipboardList },
  ];

  // Overall stats for header
  const headerStats = useMemo(() => {
    const confirmed = orders.filter((o) => o.status === STATUS.CONFIRMED).length;
    const preparing = orders.filter((o) => o.status === STATUS.PREPARING).length;
    const prepared = orders.filter((o) => o.status === STATUS.PREPARED).length;
    const distributed = orders.filter((o) => o.status === STATUS.DISTRIBUTED).length;
    const rejected = orders.filter((o) => o.status === STATUS.REJECTED).length;
    return [
      { title: "مؤكدة", value: confirmed, icon: CheckCircle2 },
      { title: "قيد التحضير", value: preparing, icon: Clock },
      { title: "جاهزة", value: prepared, icon: Package },
      { title: "موزعة", value: distributed, icon: Truck },
    ];
  }, [orders]);

  // If in prepare view, show full page prepare
  if (preparingOrder) {
    return (
      <div className="min-h-screen !pb-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/20 dark:from-[#182337] dark:via-[#182337] dark:to-[#1a2744]" dir={dir}>
        <PrepareOrderView
          order={preparingOrder}
          onBack={() => setPreparingOrder(null)}
          updateOrder={updateOrder}
          pushOp={pushOp}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen !pb-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/20 dark:from-[#182337] dark:via-[#182337] dark:to-[#1a2744]" dir={dir}>

      {/* Header */}
      <div className="bg-card flex flex-col gap-4 mb-4">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-gray-400">الرئيسية</span>
            <ChevronLeft className="text-gray-400 rtl:rotate-180" size={18} />
            <span className="text-[rgb(var(--primary))]">إدارة المستودع والتوزيع</span>
            <span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
          </div>
        </div>

        {/* Header Stats */}
        <div className="grid grid-cols-4 gap-3 md:gap-4">
          {headerStats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 120 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg md:rounded-xl p-3 md:p-4 bg-white/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                <motion.div className="absolute inset-0 bg-gradient-to-br from-[#ff8b00]/10 via-[#ffb703]/10 to-[#ff5c2b]/10 dark:from-[#5b4bff]/10 dark:via-[#8b7cff]/10 dark:to-[#3be7ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 truncate">{s.title}</p>
                    <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b] dark:from-[#5b4bff] dark:to-[#3be7ff] bg-clip-text text-transparent">{s.value}</p>
                  </div>
                  <motion.div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center bg-gradient-to-br from-[#ff8b00]/20 to-[#ff5c2b]/20 dark:from-[#5b4bff]/20 dark:to-[#3be7ff]/20 border border-[#ff8b00]/30 dark:border-[#5b4bff]/30 flex-shrink-0"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <s.icon className="text-[#ff8b00] dark:text-[#5b4bff]" size={18} />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <SwitcherTabs
          items={tabConfig}
          activeId={activeTab}
          onChange={setActiveTab}
          className="w-full"
        />
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "confirmed" && (
            <ConfirmedTab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
            />
          )}

          {activeTab === "preparing" && (
            <PreparingTab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              onPrepareOrder={(order) => setPreparingOrder(order)}
            />
          )}

          {activeTab === "prepared" && (
            <PreparedTab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              onPrepareOrder={(order) => setPreparingOrder(order)}
              setDistributionDialog={(val) => setDistributionDialog(val)}
              setSelectedOrdersGlobal={(codes) => setSelectedOrdersForDist(codes)}
            />
          )}

          {activeTab === "distributed" && (
            <DistributedTab orders={orders} />
          )}

          {activeTab === "rejected" && (
            <RejectedTab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
            />
          )}

          {activeTab === "logs" && (
            <LogsTab opsLogs={opsLogs} orders={orders} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Global Dialogs */}
      <RejectDialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, order: null })}
        order={rejectDialog.order}
        updateOrder={updateOrder}
        pushOp={pushOp}
      />

      <DistributionDialog
        open={distributionDialog}
        onClose={() => setDistributionDialog(false)}
        orders={orders}
        selectedOrderCodes={selectedOrdersForDist}
        updateOrder={updateOrder}
        pushOp={pushOp}
      />
    </div>
  );
}