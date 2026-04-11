// File: warehouse/tabs/DistributionTab.jsx
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Truck,
  Package,
  CheckCircle2,
  Ban,
  FileDown,
  Info,
  Store,
  ScanLine,
  X,
  MapPin,
  Phone,
  User,
  CreditCard,
  Tag,
  Clock,
  BarChart3,
  ShoppingBag,
  AlertCircle,
  Printer,
  TrendingUp,
  Hash,
  BoxSelect,
  Layers,
  Send,
  Loader2,
} from "lucide-react";

import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/SocketContext";
import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "../../../../components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";
import { RejectOrderModal } from "./PreparationTab";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import StoreFilter from "@/components/atoms/StoreFilter";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import ProductFilter from "@/components/atoms/ProductFilter";
import api from "@/utils/api";
// ─────────────────────────────────────────────
// CARRIER BRAND STYLES
// ─────────────────────────────────────────────
import { CARRIER_STYLES, CARRIERS, CARRIER_META } from "./data";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import DateRangePicker from "@/components/atoms/DateRangePicker";

// ─────────────────────────────────────────────
// MAIN TAB
// ─────────────────────────────────────────────
export default function DistributionTab({ subtab, setSubtab }) {
  const t = useTranslations("warehouse.distribution");
  const tCommon = useTranslations("common");
  const tStats = useTranslations("warehouse.distribution.stats");

  const [statsData, setStatsData] = useState({
    lifecycle: { confirmed: 0, distributed: 0, distributedNotPrinted: 0 },
    companies: [],
  });
  const [loading, setLoading] = useState(true);

  const updateStatsAfterAssign = useCallback(() => {
    setStatsData((prev) => ({
      ...prev,
      lifecycle: {
        ...prev.lifecycle,
        confirmed: Math.max(0, prev.lifecycle.confirmed - 1),
        distributed: prev.lifecycle.distributed + 1,
        distributedNotPrinted: prev.lifecycle.distributedNotPrinted + 1,
      },
    }));
  }, []);

  // Fetch data from your two new endpoints
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [{ data: lifecycleData }, { data: companiesData }] =
        await Promise.all([
          api.get("/shipping/stats/lifecycle-summary"),
          api.get("/shipping/stats/companies-workload"),
        ]);

      setStatsData({
        lifecycle: lifecycleData,
        companies: companiesData,
      });
    } catch (error) {
      console.error("Failed to fetch shipping stats", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 1. General Stats: 3 Remaining (Removed withCarrier)
  const generalStats = [
    {
      id: "total-confirmed",
      name: t("stats.totalConfirmed"),
      value: statsData.lifecycle.confirmed,
      icon: CheckCircle2,
      color: "#10b981",
      bgColor: "#10b98115",
      sortOrder: 0,
    },
    {
      id: "with-carrier",
      name: t("stats.withCarrier"),
      value: statsData.lifecycle.distributed,
      icon: Truck,
      color: "#6763af",
      bgColor: "#6763af15",
      sortOrder: 2,
    },
    {
      id: "ready-to-print",
      name: t("stats.readyToPrint"),
      value: statsData.lifecycle.distributedNotPrinted,
      icon: Printer,
      color: "var(--primary)",
      bgColor: "#ff6a1e15",
      sortOrder: 3,
    },
  ];

  // 2. Carrier Stats: Dynamic from the second endpoint
  const carrierStats = statsData?.companies
    ? statsData.companies.map((c) => {
      // Fallback meta if company name doesn't match CARRIER_META keys
      const meta = CARRIER_META[c.code?.toUpperCase()] || {
        icon: Truck,
        color: "#64748b",
      };
      return {
        id: `carrier-${c.companyId}`,
        name: c.companyName,
        icon: meta.icon,
        color: meta.color,
        bgColor: meta.color + "15",
        value: c.count,
      };
    })
    : [];
  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.orders"), href: "/orders" },
          { name: t("breadcrumbs.distribution") },
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={t("header.howItWorks")}
              variant="ghost"
              onClick={() => { }}
              icon={<Info size={18} />}
              permission="orders.read"
            />
          </>
        }
        statsLoading={loading}
        stats={subtab === "unassigned" ? generalStats : carrierStats}
        items={[
          {
            id: "unassigned",
            label: t("tabs.unassigned"),
            count: statsData.lifecycle.confirmed,
            icon: AlertCircle,
          },
          {
            id: "assigned",
            label: t("tabs.assigned"),
            count: statsData.lifecycle.distributed,
            icon: Truck,
          },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      {/* <AssignCarrierDialog
				t={t}
				open={assignAllOpen}
				onClose={() => setAssignAllOpen(false)}
				orders={orders}
				selectedOrderCodes={unassigned.map((o) => o.code)}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/> */}

      <AnimatePresence mode="wait">
        <motion.div
          key={subtab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {subtab === "unassigned" && (
            <UnassignedOrdersSubtab
              t={t}
              fetchStats={fetchStats}
              updateStatsAfterAssign={updateStatsAfterAssign}
            />
          )}
          {subtab === "assigned" && (
            <AssignedOrdersSubtab
              t={t}
              fetchStats={fetchStats}
              updateStatsAfterAssign={updateStatsAfterAssign}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// ORDER DETAIL MODAL — REDESIGNED
// ─────────────────────────────────────────────
export function OrderDetailModal({ open, onClose, order, hideNotes }) {
  const tCommon = useTranslations("common");
  const t = useTranslations("warehouse.distribution");
  const { formatCurrency } = usePlatformSettings()
  if (!order) return null;
  const infoRows = [
    {
      label: t("field.customerName"),
      value: order.customerName,
      icon: User,
      accent: "var(--primary)",
    },
    {
      label: t("field.phoneNumber"),
      value: order.phoneNumber,
      icon: Phone,
      accent: "#6763af",
    },
    {
      label: t("field.city"),
      value: order.city,
      icon: MapPin,
      accent: "var(--primary)",
    },
    {
      label: t("field.area"),
      value: order.area,
      icon: MapPin,
      accent: "var(--third)",
    },
    {
      label: t("field.store"),
      value: order.store?.name || "-",
      icon: Store,
      accent: "var(--primary)",
    },
    {
      label: t("field.carrier"),
      value: order.shippingCompany?.name || t("common.notSpecified"),
      icon: Truck,
      accent: "var(--secondary)",
    },
    {
      label: t("field.trackingCode"),
      value: order.trackingNumber || t("common.none"),
      icon: Hash,
      accent: "var(--primary)",
    },
    {
      label: t("field.paymentType"),
      value:
        order.paymentStatus === "paid"
          ? t("payment.paid")
          : order.paymentMethod === "cod"
            ? t("payment.cod")
            : order.paymentMethod,
      icon: CreditCard,
      accent: "var(--third)",
    },
    {
      label: t("field.total"),
      value: `${formatCurrency(order.finalTotal)}`,
      icon: TrendingUp,
      accent: "var(--third)",
    },
    {
      label: t("field.shippingCost"),
      value: `${formatCurrency(order.shippingCost)}`,
      icon: Truck,
      accent: "var(--primary)",
    },
    {
      label: t("field.allowOpenPackage"),
      value: order.allowOpenPackage
        ? t("value.allowed")
        : t("value.notAllowed"),
      icon: Package,
      accent: "var(--primary)",
    },
    // {
    //   label: t("field.returnOrder"),
    //   value: order?.replacementResult?.originalOrder?.orderNumber || "-",
    //   icon: BoxSelect,
    //   accent: order.replacementResult?.originalOrder?.orderNumber
    //     ? "#10b981"
    //     : "#ef4444",
    // },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl"

      >
        {/* Header with gradient */}
        <div className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden bg-primary ">
          {/* Decorative circles */}
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">
                  {t("modal.orderDetailsTitle", { code: "" })}
                </p>
                <h2 className="text-white text-xl font-bold font-mono">
                  {order.orderNumber}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* Status badge */}
          <div className="relative mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {order.shippingCompany?.name
                ? order.shippingCompany?.name
                : t("stats.withoutCarrier")}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full",
                order.paymentMethod === "cod"
                  ? "bg-yellow-400/30 text-white border border-yellow-300/40"
                  : "bg-green-400/30 text-white border border-green-300/40",
              )}
            >
              <CreditCard size={11} />
              {order.paymentStatus === "paid"
                ? t("payment.paid")
                : order.paymentMethod === "cod"
                  ? t("payment.cod")
                  : order.paymentMethod}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {infoRows.map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className="group flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-3 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: accent + "18" }}
                >
                  <Icon size={13} style={{ color: accent }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 font-medium">
                    {label}
                  </p>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Products section */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div
              className="px-4 py-2.5 flex items-center gap-2"
              style={{
                background:
                  "linear-gradient(90deg, #6763af15 0%, transparent 100%)",
              }}
            >
              <ShoppingBag size={14} style={{ color: "#6763af" }} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {t("section.products")}
              </span>
              <span className="ml-auto text-xs font-semibold text-slate-400">
                {order.items?.length || 0} {tCommon("items")}
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {order.items?.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center bg-primary/18 justify-center text-xs font-bold flex-shrink-0"
                    style={{ color: "var(--primary)" }}
                  >
                    {i + 1}
                  </div>
                  <span
                    className="font-mono text-[11px] px-2 py-0.5 rounded-md font-bold"
                    style={{ backgroundColor: "#6763af12", color: "#6763af" }}
                  >
                    {p.variant?.sku}
                  </span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">
                    {p.variant?.product?.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ×{p.quantity}
                  </span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatCurrency((Number(p.unitPrice) || 0) * (Number(p.quantity) || 0))}


                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {!!order.notes && !hideNotes && (
            <div
              className="rounded-xl p-4 border bg-primary/10 border-primary/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} style={{ color: "var(--third)" }} />
                <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>
                  {t("section.notes")}
                </p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-slate-200 hover:border-slate-300 text-slate-600"
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// ASSIGN CARRIER DIALOG — REDESIGNED
// ─────────────────────────────────────────────
function AssignCarrierDialog({
  t,
  open,
  onClose,
  orders,
  selectedOrderCodes,
  onConfirm,
}) {
  const tCommon = useTranslations("common");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [carrier, setCarrier] = useState("");
  const [loading, setLoading] = useState(false);
  const { formatCurrency, shippingCompanies } = usePlatformSettings()
  const availableOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderCodes.includes(o.orderNumber));
  }, [orders, selectedOrderCodes]);

  useEffect(() => {
    if (!open) return;
    setSelectedOrders(availableOrders.map((o) => o.orderNumber));

    console.log(availableOrders[0]);
    if (
      availableOrders.length === 1 &&
      availableOrders[0]?.shippingCompany?.code
    ) {
      setCarrier(availableOrders[0].shippingCompany.code.toUpperCase());
    } else {
      setCarrier("");
    }
  }, [open, availableOrders]);

  const toggleOrder = (orderNumber) =>
    setSelectedOrders((prev) =>
      prev.includes(orderNumber)
        ? prev.filter((o) => o !== orderNumber)
        : [...prev, orderNumber],
    );

  const handleAssign = async () => {
    if (!carrier || selectedOrders.length === 0) return;
    setLoading(true);
    try {
      const provider = carrier.toLowerCase();
      const orderIds = availableOrders
        .filter((o) => selectedOrders.includes(o.orderNumber))
        .map((o) => o.id);

      let res;
      if (orderIds.length === 1) {
        // Single assignment
        const orderId = orderIds[0];
        res = await api.post(
          `/shipping/providers/${provider}/orders/${orderId}/assign`,
          {},
        );
        toast.success(
          provider === "none"
            ? t("modal.manualAssignSuccess") || "Assigned for manual shipping"
            : t("modal.assignSuccess") || "Carrier assigned successfully",
        );
      } else {
        // Bulk assignment
        res = await api.post(
          `/shipping/providers/${provider}/orders/bulk-assign`,
          {
            items: orderIds.map((id) => ({
              orderId: Number(id), // Ensuring it's a number to match the DTO
            })),
          },
        );
        toast.success(
          provider === "none"
            ? t("modal.manualAssignSuccess") || "Orders assigned manually"
            : t("modal.bulkAssignStarted") || "Orders added to assignment queue",
        );
      }

      onClose();
      onConfirm?.(orderIds, res?.data);
    } catch (error) {
      console.error("Assignment failed", error);
      toast.error(
        error.response?.data?.message ||
        t("modal.assignFailed") ||
        "Assignment failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl"

      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden bg-primary">
          <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Layers className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">
                  {t("modal.assignCarrierSubtitle") || "توزيع الطلبات"}
                </p>
                <h2 className="text-white text-xl font-bold">
                  {t("modal.assignCarrierTitle")}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="relative mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Send size={12} className="text-white/80" />
              <span className="text-white/90 text-xs font-medium">
                {selectedOrders.length}{" "}
                {t("assign.ordersSelected") || "طلب محدد"}
              </span>
            </div>
            {carrier && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <Truck size={12} className="text-white/80" />
                <span className="text-white/90 text-xs font-medium">
                  {carrier}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Truck size={14} style={{ color: "var(--primary)" }} />
              {t("assign.requiredCarrier")}
              <span className="text-red-500">*</span>
            </Label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Manual / None option */}
              <motion.button
                type="button"
                onClick={() => setCarrier("NONE")}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "relative flex flex-col items-center gap-2 py-3.5 rounded-2xl border-2 transition-all duration-200",
                  carrier === "NONE"
                    ? "border-transparent bg-slate-500/10 border-slate-500/60"
                    : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-600",
                )}
                style={
                  carrier === "NONE"
                    ? {
                      backgroundColor: "#64748b12",
                      borderColor: "#64748b60",
                    }
                    : {}
                }
              >
                <span
                  className="text-[10px] font-black tracking-wide"
                  style={{ color: carrier === "NONE" ? "#64748b" : "#64748b" }}
                >
                  {t("modal.manualAssign") || "توزيع يدوي"}
                </span>
              </motion.button>

              {shippingCompanies.map((integration) => {
                const providerCode =
                  integration.provider?.toUpperCase() || "DEFAULT";
                const CARRIER_COLORS = {
                  ARAMEX: { color: "#ef4444" },
                  SMSA: { color: "#3b82f6" },
                  DHL: { color: "#eab308" },
                  BOSTA: { color: "#f97316" },
                  JT: { color: "#009688" },
                  TURBO: { color: "#00bcd4" },
                };
                const { color } = CARRIER_COLORS[providerCode];

                const isSelected = carrier === providerCode;

                return (
                  <motion.button
                    key={providerCode}
                    type="button"
                    onClick={() => setCarrier(providerCode)}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      "relative flex flex-col items-center gap-2 py-3.5 rounded-2xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-transparent"
                        : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-600",
                    )}
                    style={
                      isSelected
                        ? {
                          backgroundColor: color + "12",
                          borderColor: color + "60",
                        }
                        : {}
                    }
                  >
                    <span
                      className="text-xs font-bold tracking-wide transition-colors duration-200"
                      style={{ color: isSelected ? color : "#64748b" }}
                    >
                      {providerCode}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Orders list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Package size={14} style={{ color: "#6763af" }} />
                {t("assign.selectedOrders")}
              </Label>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#6763af18", color: "#6763af" }}
              >
                {t("common.selectedCount", { count: selectedOrders.length })}
              </span>
            </div>

            <div className="max-h-[260px] overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
              {availableOrders.map((order) => {
                const isChecked = selectedOrders.includes(order.orderNumber);
                return (
                  <motion.div
                    key={order.orderNumber}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      isChecked
                        ? "bg-white dark:bg-slate-900 border-[var(--primary)]/40 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300",
                    )}
                    onClick={() => toggleOrder(order.orderNumber)}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        isChecked
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-slate-300 dark:border-slate-600",
                      )}
                    >
                      {isChecked && (
                        <CheckCircle2 size={12} className="text-white" />
                      )}
                    </div>

                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20 "
                    >
                      <Package size={14} style={{ color: "var(--primary)" }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-mono font-bold text-sm"
                        style={{ color: "var(--primary)" }}
                      >
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {order.customerName} — {order.city}
                      </p>
                    </div>

                    <div className="text-left flex-shrink-0">
                      <p className="font-bold text-sm text-emerald-600">
                        {formatCurrency(order.finalTotal)}
                      </p>
                      {order.shippingCompany?.name && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: "#6763af18",
                            color: "#6763af",
                          }}
                        >
                          {order.shippingCompany?.name}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {availableOrders.length === 0 && (
                <div className="text-center py-8">
                  <Package size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    {t("assign.noOrders")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl"
            >
              {t("common.cancel")}
            </Button>
            <motion.button
              onClick={handleAssign}
              disabled={loading || !carrier || selectedOrders.length === 0}
              whileHover={
                !loading && carrier && selectedOrders.length > 0
                  ? { scale: 1.02 }
                  : {}
              }
              whileTap={
                !loading && carrier && selectedOrders.length > 0
                  ? { scale: 0.98 }
                  : {}
              }
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all",
                loading || !carrier || selectedOrders.length === 0
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "shadow-lg",
              )}
              style={
                !loading && carrier && selectedOrders.length > 0
                  ? {
                    background:
                      "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                  }
                  : {}
              }
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("assign.assigning")}
                </>
              ) : (
                <>
                  <Send size={15} />
                  {t("assign.assign")}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// UNASSIGNED SUBTAB
// ─────────────────────────────────────────────
function UnassignedOrdersSubtab({ t, fetchStats, updateStatsAfterAssign }) {
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({
    value: search,
    delay: 350,
  });
  const [filters, setFilters] = useState({
    store: "all",
    paymentType: "all",
    carrier: "all",
    date: "",
    productId: "all",
  });
  const { currency } = usePlatformSettings();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [assignDialog, setAssignDialog] = useState({ open: false, codes: [] });
  const [cancelModal, setCancelModal] = useState({ open: false, order: null });
  const [detailModal, setDetailModal] = useState(null);

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const { handleExport, exportLoading } = useExport();
  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe("SHIPMENT_STATUS", (payload) => {
      const { orderNumber, status, message } = payload;

      if (status === "success") {
        toast.success(t("messages.shipmentCreated", { orderNumber }));
        updateStatsAfterAssign(orderNumber);
        setPager((prev) => ({
          ...prev,
          records: prev.records.filter((r) => r.orderNumber !== orderNumber),
        }));
      } else {
        toast.error(
          `${t("messages.shipmentFailed", { orderNumber })}: ${message}`,
        );
        setPager((prev) => ({
          ...prev,
          records: prev.records.map((r) =>
            r.orderNumber !== orderNumber ? r : { ...r, isAssigning: false },
          ),
        }));
      }
    });

    return () => unsubscribe();
  }, [subscribe, t]);

  const buildParams = (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    const params = {
      page,
      limit: per_page,
      status: "confirmed",
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.store !== "all") params.storeId = filters.store;
    if (filters.paymentType !== "all")
      params.paymentStatus = filters.paymentType;
    if (filters.carrier !== "all") params.shippingCompanyId = filters.carrier;
    if (filters.date) params.startDate = filters.date;
    if (filters.productId !== "all") params.productId = filters.productId;

    return params;
  };

  const fetchOrders = async (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    try {
      setOrdersLoading(true);
      const params = buildParams(page, per_page);
      const res = await api.get("/orders", { params });
      const data = res.data || {};
      setPager({
        total_records: data.total_records || 0,
        current_page: data.current_page || page,
        per_page: data.per_page || per_page,
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (e) {
      console.error("Error fetching orders", e);
      toast.error(t("messages.errorFetchingOrders") || "Error fetching orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const onExport = async () => {
    const params = buildParams(1, 10000);
    delete params.page;
    delete params.limit;
    await handleExport({
      endpoint: "/orders/export",
      params,
      filename: `unassigned_orders_${Date.now()}.xlsx`,
    });
  };

  useEffect(() => {
    fetchOrders(1, pager.per_page);
  }, [debouncedSearch]);

  const handlePageChange = ({ page, per_page }) => {
    fetchOrders(page, per_page);
  };

  const applyFilters = () => {
    fetchOrders(1, pager.per_page);
  };

  useEffect(() => {
    setFilters({
      store: "all",
      paymentType: "all",
      carrier: "all",
      date: "",
      productId: "all",
    });
    setSearch("");
  }, []);

  const toggleOrder = (orderNumber) => {
    const order = pager.records.find((r) => r.orderNumber === orderNumber);
    if (order?.isAssigning) return;
    setSelectedOrders((prev) =>
      prev.includes(orderNumber)
        ? prev.filter((o) => o !== orderNumber)
        : [...prev, orderNumber],
    );
  };

  const selectAll = () => {
    const selectableOrderNumbers = pager.records
      .filter((o) => !o.isAssigning)
      .map((o) => o.orderNumber);

    const allSelectableSelected = selectableOrderNumbers.every((num) =>
      selectedOrders.includes(num),
    );

    setSelectedOrders(allSelectableSelected ? [] : selectableOrderNumbers);
  };

  const hasActiveFilters =
    filters.store !== "all" ||
    filters.paymentType !== "all" ||
    filters.carrier !== "all" ||
    !!filters.date ||
    filters.productId !== "all";

  const columns = useMemo(
    () => [
      {
        key: "select",
        header: (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                pager.records.length > 0 &&
                pager.records.every(
                  (r) =>
                    r.isAssigning || selectedOrders.includes(r.orderNumber),
                )
              }
              onCheckedChange={selectAll}
            />
          </div>
        ),
        className: "w-[48px]",
        cell: (row) => {
          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={selectedOrders.includes(row.orderNumber)}
                onCheckedChange={() => toggleOrder(row.orderNumber)}
                disabled={row.isAssigning}
              />
            </div>
          );
        },
      },
      {
        key: "code",
        header: t("field.orderCode"),
        cell: (row) => (
          <span className="font-mono font-bold text-[var(--primary)] dark:text-[var(--third)]">
            {row.orderNumber}
          </span>
        ),
      },
      {
        key: "customer",
        header: t("field.customer"),
        cell: (row) => (
          <span className="font-semibold">{row.customerName}</span>
        ),
      },
      {
        key: "phone",
        header: t("field.phone"),
        cell: (row) => (
          <span className="font-mono text-slate-500 text-sm" dir="ltr">
            {row.phoneNumber}
          </span>
        ),
      },
      { key: "city", header: t("field.city") },
      { key: "area", header: t("field.area") },
      {
        key: "carrier",
        header: t("field.carrier"),
        cell: (row) => {
          const carrierName =
            row.carrier || row.shippingCompany?.code?.toUpperCase();
          const s = CARRIER_STYLES[carrierName] || CARRIER_STYLES.NONE;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                s.bg,
                s.border,
                s.text,
              )}
            >
              <Truck size={12} />
              {carrierName || t("common.none")}
            </span>
          );
        },
      },
      {
        key: "store",
        header: t("field.store"),
        cell: (row) => {
          const storeName = row.store?.name;
          const s = CARRIER_STYLES.NONE;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  storeName
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : cn(s.bg, s.border, s.text),
                )}
              >
                <Store className="w-3 h-3" />
                {storeName || t("common.none")}
              </span>
            </div>
          );
        },
      },
      {
        key: "total",
        header: t("field.total"),
        cell: (row) => (
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {row.finalTotal} {currency}
          </span>
        ),
      },
      {
        key: "paymentType",
        header: t("field.payment"),
        cell: (row) => (
          <Badge
            className={cn(
              "rounded-full text-xs border",
              row.paymentStatus === "paid"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {row.paymentStatus === "paid"
              ? t("payment.paid")
              : row.paymentMethod === "cod"
                ? t("payment.cod")
                : row.paymentMethod}
          </Badge>
        ),
      },
      {
        key: "orderDate",
        header: t("field.orderDate"),
        cell: (row) => (
          <span className="text-xs text-slate-500">
            {new Date(row.created_at).toLocaleDateString("en-US")}
          </span>
        ),
      },
      {
        key: "actions",
        header: t("field.actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Info />,
                tooltip: t("tooltip.details"),
                onClick: (r) => setDetailModal(r),
                variant: "primary",
                permission: "orders.read",
              },
              {
                icon: <Truck />,
                tooltip: row.isAssigning
                  ? t("tooltip.assigning")
                  : t("tooltip.assign"),
                onClick: (r) =>
                  setAssignDialog({ open: true, codes: [r.orderNumber] }),
                variant: "primary",
                disabled: row.isAssigning,
                permission: "order.assign",
              },
              {
                icon: <Ban />,
                tooltip: t("tooltip.reject"),
                onClick: (r) => setCancelModal({ open: true, order: r }),
                variant: "red",
                disabled: row.isAssigning,
                permission: "order.update",
              },
            ]}
          />
        ),
      },
    ],
    [
      t,
      pager.records,
      selectedOrders,
      setDetailModal,
      setAssignDialog,
      setCancelModal,
    ],
  );

  return (
    <div className="space-y-4">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        labels={{
          searchPlaceholder: t("table.searchUnassigned"),
          filter: t("common.filter"),
          apply: t("common.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: t("table.emptyUnassignedTitle"),
          emptySubtitle: "",
        }}
        actions={[
          {
            key: "assign",
            label: t("action.assignSelected", { count: selectedOrders.length }),
            icon: <Truck size={14} />,
            color: "primary",
            onClick: () =>
              selectedOrders.length > 0 &&
              setAssignDialog({ open: true, codes: selectedOrders }),
            disabled: selectedOrders.length === 0,
            permission: "order.assign",
          },
          {
            key: "export",
            label: t("common.export"),
            icon: exportLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <FileDown size={14} />
            ),
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "orders.read",
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        filters={
          <>
            <StoreFilter
              value={filters.store}
              onChange={(v) => setFilters((f) => ({ ...f, store: v }))}
            />
            <ShippingCompanyFilter
              value={filters.carrier}
              onChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}
            />
            <FilterField label={t("field.paymentType")}>
              <Select
                value={filters.paymentType}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, paymentType: v }))
                }
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("common.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="cod">{t("payment.cod")}</SelectItem>
                  <SelectItem value="paid">{t("payment.paid")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <ProductFilter
              value={filters.productId}
              onChange={(v) => setFilters((f) => ({ ...f, productId: v }))}
            />
            <FilterField label={t("field.date")}>
              <DateRangePicker
                mode="single"
                value={filters.date}
                onChange={(date) => setFilters((f) => ({ ...f, date }))}
                dataSize="default"
              />
            </FilterField>
          </>
        }
        columns={columns}
        data={pager.records}
        isLoading={ordersLoading}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
      />

      <AssignCarrierDialog
        t={t}
        open={assignDialog.open}
        onClose={() => {
          setAssignDialog({ open: false, codes: [] });
        }}
        orders={pager.records || []}
        onConfirm={(orderIds) => {
          setSelectedOrders([]); // Requirement 2: clear selection

          if (orderIds.length === 1) {
            // Requirement 1: single order, remove locally and update stats
            updateStatsAfterAssign();
            const orderNumber = pager.records.find((r) =>
              orderIds.includes(r.id),
            )?.orderNumber;
            if (orderNumber) {
              setPager((prev) => ({
                ...prev,
                records: prev.records.filter(
                  (r) => r.orderNumber !== orderNumber,
                ),
              }));
            }
          } else if (orderIds.length > 1) {
            // Requirement 1: bulk, set isAssigning to true
            setPager((prev) => ({
              ...prev,
              records: prev.records.map((r) =>
                orderIds.includes(r.id) ? { ...r, isAssigning: true } : r,
              ),
            }));
          }
        }}
        selectedOrderCodes={assignDialog.codes}
      />

      <RejectOrderModal
        open={cancelModal.open}
        onClose={() => {
          setCancelModal({ open: false, order: null });
        }}
        onConfirm={(data) => {
          fetchOrders(); // Refetch after rejection
          fetchStats?.(); // Update header stats
        }}
        order={cancelModal.order}
      />
      <OrderDetailModal
        t={t}
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        order={detailModal}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// ASSIGNED SUBTAB
// ─────────────────────────────────────────────
function AssignedOrdersSubtab({
  t,
  pushOp,
  fetchStats,
  updateStatsAfterAssign,
}) {
  const { currency } = usePlatformSettings();
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({
    value: search,
    delay: 350,
  });
  const [filters, setFilters] = useState({
    carrier: "all",
    store: "all",
    paymentType: "all",
    date: "",
    productId: "all",
  });
  const [detailModal, setDetailModal] = useState(null);
  const [assignDialog, setAssignDialog] = useState({ open: false, codes: [] });
  const [cancelModal, setCancelModal] = useState({ open: false, order: null });

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const { handleExport, exportLoading } = useExport();
  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe(
      "SHIPMENT_STATUS_ASSIGNED",
      async (action) => {
        console.log(action);
        if (action.type !== "SHIPMENT_STATUS") return;
        const { orderId, orderNumber, status, message } = action.payload;
        if (status === "success") {
          toast.success(t("messages.shipmentCreated", { orderNumber }));
          try {
            const res = await api.get(`/orders/${orderId}`);
            const orderData = res.data;
            if (orderData) {
              setPager((prev) => ({
                ...prev,
                records: [
                  orderData,
                  ...prev.records.filter((r) => r.orderNumber !== orderNumber),
                ],
              }));
            }
          } catch (e) {
            console.error("Error fetching order details", e);
          }
        } else {
          toast.error(
            `${t("messages.shipmentFailed", { orderNumber })}: ${message}`,
          );
        }
      },
    );

    return () => unsubscribe();
  }, [subscribe, t]);

  const buildParams = (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    const params = {
      page,
      limit: per_page,
      status: "distributed",
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.carrier !== "all") params.shippingCompanyId = filters.carrier;
    if (filters.store !== "all") params.storeId = filters.store;
    if (filters.paymentType !== "all")
      params.paymentStatus = filters.paymentType;
    if (filters.date) params.startDate = filters.date;
    if (filters.productId !== "all") params.productId = filters.productId;

    return params;
  };

  const fetchOrders = async (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    try {
      setOrdersLoading(true);
      const params = buildParams(page, per_page);
      const res = await api.get("/orders", { params });
      const data = res.data || {};
      setPager({
        total_records: data.total_records || 0,
        current_page: data.current_page || page,
        per_page: data.per_page || per_page,
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (e) {
      console.error("Error fetching orders", e);
      toast.error(t("messages.errorFetchingOrders") || "Error fetching orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const onExport = async () => {
    const params = buildParams(1, 10000);
    delete params.page;
    delete params.limit;
    await handleExport({
      endpoint: "/orders/export",
      params,
      filename: `assigned_orders_${Date.now()}.xlsx`,
    });
  };

  useEffect(() => {
    fetchOrders(1, pager.per_page);
  }, [debouncedSearch]);

  const handlePageChange = ({ page, per_page }) => {
    fetchOrders(page, per_page);
  };

  const applyFilters = () => {
    fetchOrders(1, pager.per_page);
  };

  useEffect(() => {
    setFilters({
      carrier: "all",
      store: "all",
      paymentType: "all",
      date: "",
      productId: "all",
    });
    setSearch("");
  }, []);

  const hasActiveFilters =
    filters.carrier !== "all" ||
    filters.store !== "all" ||
    filters.paymentType !== "all" ||
    !!filters.date ||
    filters.productId !== "all";

  const columns = useMemo(
    () => [
      {
        key: "code",
        header: t("field.orderCode"),
        cell: (row) => (
          <span className="font-mono font-bold text-[var(--primary)] dark:text-[var(--third)]">
            {row.orderNumber}
          </span>
        ),
      },
      {
        key: "customer",
        header: t("field.customer"),
        cell: (row) => (
          <span className="font-semibold">{row.customerName}</span>
        ),
      },
      {
        key: "phone",
        header: t("field.phone"),
        cell: (row) => (
          <span className="font-mono text-slate-500 text-sm" dir="ltr">
            {row.phoneNumber}
          </span>
        ),
      },
      { key: "city", header: t("field.city") },
      { key: "area", header: t("field.area") },
      {
        key: "carrier",
        header: t("field.carrier"),
        cell: (row) => {
          const carrierName =
            row.carrier || row.shippingCompany?.code?.toUpperCase();
          const s =
            CARRIER_STYLES[carrierName?.toUpperCase()] || CARRIER_STYLES.NONE;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                s.bg,
                s.border,
                s.text,
              )}
            >
              <Truck size={12} />
              {carrierName || t("common.none")}
            </span>
          );
        },
      },
      {
        key: "store",
        header: t("field.store"),
        cell: (row) => {
          const storeName = row.store?.name;
          const s = CARRIER_STYLES.NONE;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  storeName
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : cn(s.bg, s.border, s.text),
                )}
              >
                <Store className="w-3 h-3" />
                {storeName || t("common.none")}
              </span>
            </div>
          );
        },
      },
      {
        key: "trackingCode",
        header: t("field.trackingCode"),
        cell: (row) =>
          row.trackingNumber ? (
            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {row.trackingNumber}
            </span>
          ) : (
            <span className="text-slate-400">{t("common.none")}</span>
          ),
      },
      {
        key: "distributedAt",
        header: t("field.distributedAt"),
        cell: (row) => (
          <span className="text-xs text-slate-500">
            {row.distributed_at
              ? new Date(row.distributed_at).toLocaleDateString("en-US")
              : t("common.none")}
          </span>
        ),
      },
      {
        key: "total",
        header: t("field.total"),
        cell: (row) => (
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {row.finalTotal} {currency}
          </span>
        ),
      },
      {
        key: "actions",
        header: t("field.actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Info />,
                tooltip: t("tooltip.details"),
                onClick: (r) => setDetailModal(r),
                variant: "primary",
                permission: "orders.read",
              },
              {
                icon: <Truck />,
                tooltip: row.isAssigning
                  ? t("tooltip.assigning")
                  : t("tooltip.changeAssign"),
                onClick: (r) =>
                  setAssignDialog({ open: true, codes: [r.orderNumber] }),
                variant: "primary",
                disabled: row.isAssigning,
                permission: "order.assign",
              },
              {
                icon: <Ban />,
                tooltip: t("tooltip.reject"),
                onClick: (r) => setCancelModal({ open: true, order: r }),
                variant: "red",
                disabled: row.isAssigning,
                permission: "order.update",
              },
            ]}
          />
        ),
      },
    ],
    [t, setDetailModal, setAssignDialog, setCancelModal],
  );

  const handleAssignOrders = useCallback(
    async (orderIds) => {
      if (!orderIds || orderIds.length === 0) return;

      // 1. Determine if we are doing Single or Bulk logic
      const isSingle = orderIds.length === 1;

      if (isSingle) {
        const orderId = orderIds[0];
        try {
          const res = await api.get(`/orders/${orderId}`);
          const orderData = res.data;

          if (orderData) {
            setPager((prev) => ({
              ...prev,
              records: prev.records.map((r) =>
                r.id === orderId ? orderData : r,
              ),
            }));
          }
        } catch (e) {
          console.error("Failed to refetch reassigned order", e);
          // Fallback to full refresh if single fetch fails
          fetchOrders();
        }
      } else {
        // 2. Bulk logic: Optimistically set isAssigning to true
        setPager((prev) => ({
          ...prev,
          records: prev.records.map((r) =>
            orderIds.includes(r.id) ? { ...r, isAssigning: true } : r,
          ),
        }));

        // Note: Since the bulk process is handled by the background queue,
        // we just set the UI state and let the socket/polling handle the update.
      }
    },
    [api, fetchOrders, setPager],
  ); // Dependencies for stability

  return (
    <div className="space-y-4">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        labels={{
          searchPlaceholder: t("table.searchAssigned"),
          filter: t("common.filter"),
          apply: t("common.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: t("table.emptyAssignedTitle"),
          emptySubtitle: "",
        }}
        actions={[
          {
            key: "export",
            label: t("common.export"),
            icon: exportLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <FileDown size={14} />
            ),
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "orders.read",
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        filters={
          <>
            <ShippingCompanyFilter
              value={filters.carrier}
              onChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}
            />
            <StoreFilter
              value={filters.store}
              onChange={(v) => setFilters((f) => ({ ...f, store: v }))}
            />
            <ProductFilter
              value={filters.productId}
              onChange={(v) => setFilters((f) => ({ ...f, productId: v }))}
            />
            <FilterField label={t("field.paymentType")}>
              <Select
                value={filters.paymentType}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, paymentType: v }))
                }
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("common.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="cod">{t("payment.cod")}</SelectItem>
                  <SelectItem value="paid">{t("payment.paid")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("field.date")}>
              <DateRangePicker
                mode="single"
                value={filters.date}
                onChange={(date) => setFilters((f) => ({ ...f, date }))}
                dataSize="default"
              />
            </FilterField>
          </>
        }
        columns={columns}
        data={pager.records}
        isLoading={ordersLoading}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
      />

      <AssignCarrierDialog
        t={t}
        open={assignDialog.open}
        onClose={() => {
          setAssignDialog({ open: false, codes: [] });
        }}
        onConfirm={handleAssignOrders}
        orders={pager.records}
        selectedOrderCodes={assignDialog.codes}
      />
      <RejectOrderModal
        open={!!cancelModal.open}
        onClose={() => {
          setCancelModal({ open: false, order: null });
        }}
        onConfirm={(data) => {
          fetchOrders(); // Refetch after rejection
          fetchStats?.(); // Update header stats
        }}
        order={cancelModal.order}
      />
      <OrderDetailModal
        t={t}
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        order={detailModal}
      />
    </div>
  );
}
