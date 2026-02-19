"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Package,
  User,
  Phone,
  MapPin,
  Truck,
  DollarSign,
  Calendar,
  Clock,
  Store,
  FileText,
  History,
  Edit,
  Printer,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  QrCode,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { useParams } from "next/navigation";

// ==================== STATUS BADGE COMPONENT ====================
const StatusBadge = ({ status, t }) => {
  if (!status) return null;

  return (
    <Badge
      className="rounded-lg px-4 py-2 text-sm font-bold
        bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]
        text-[var(--primary)]
        border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
    >
      {status?.system ? t(`statuses.${status.code}`) : status.name}
    </Badge>
  );
};

// ==================== INFO CARD COMPONENT ====================
const InfoRow = ({ icon: Icon, label, value, valueClassName }) => (
  <div className="flex items-start justify-between py-3 last:border-0">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={16} />
      <span className="text-sm">{label}</span>
    </div>
    <div className={cn("text-sm font-semibold text-foreground text-end", valueClassName)}>
      {value || "-"}
    </div>
  </div>
);

// ==================== SECTION CARD COMPONENT ====================
const SectionCard = ({ title, icon: Icon, children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60",
      className
    )}
  >
    <div className="flex items-center gap-2 mb-6">
      <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
      <h3 className="text-base font-bold text-foreground">{title}</h3>
    </div>
    {children}
  </motion.div>
);

// ==================== WRAPPER ====================
export default function OrderDetailsPageWrapper() {
  const params = useParams();
  const t = useTranslations("orders");
  const orderId = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error(t("messages.errorFetchingOrder"));
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid order ID</p>
      </div>
    );
  }

  return <OrderDetailsPage order={order} loading={loading} />;
}

// ==================== MAIN COMPONENT ====================
export function OrderDetailsPage({ order, loading }) {
  const t = useTranslations("orders");
  const router = useRouter();

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString() || 0} ${t("currency")}`;
  };

  // ── Loading ──
  if (loading) {
    return (
      <OrderDetailsPageSkeleton />
    );
  }

  // ── Not found ──
  if (!order) {
    return (
      <div className="flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-[var(--primary)]" />
          <p className="text-muted-foreground">{t("messages.orderNotFound")}</p>
          <Button
            onClick={() => router.push("/orders")}
            className="mt-4 bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] border border-[color-mix(in_oklab,var(--primary)_25%,transparent)] rounded-xl hover:opacity-80"
          >
            {t("actions.backToOrders")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background">

      {/* ── Breadcrumb Header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("breadcrumb.home")}</span>
            <ChevronLeft size={16} className="rtl:rotate-180" />
            <span className="text-[var(--primary)] font-medium">
              {order.orderNumber}
            </span>
          </div>

          {/* Action Buttons — styled to theme */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/orders/edit/${order.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]
                text-[var(--primary)]
                border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]
                hover:opacity-80 transition"
            >
              <Edit size={15} />
              {t("actions.edit")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ══════════════════════════════════════
            MAIN CONTENT — left 9 cols
        ══════════════════════════════════════ */}
        <div className="lg:col-span-9">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60"
          >

            {/* ── Order Meta Banner ── */}
            <div className="p-2">
              <div className="rounded-2xl p-4 py-5 grid grid-cols-2 md:grid-cols-5 gap-4 bg-[var(--secondary)] border border-border/60 backdrop-blur-sm">
                {/* Order Number */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">#ID</p>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {order.orderNumber}
                  </p>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("fields.status")}
                  </p>
                  <StatusBadge status={order.status} t={t} />
                </div>

                {/* Payment Method */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("fields.paymentMethod")}
                  </p>
                  <Badge
                    className="rounded-lg font-semibold
                      bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]
                      text-[var(--primary)]
                      border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
                  >
                    {t(`paymentMethods.${order.paymentMethod}`)}
                  </Badge>
                </div>

                {/* Created At */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("details.createdAt")}
                  </p>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar size={14} />
                    <p className="text-sm font-bold text-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>

                {/* Updated At */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("details.updatedAt")}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {formatDate(order.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Shipping / Financials Banner ── */}
            <div className="p-2">
              <div className="rounded-2xl p-4 py-5 grid grid-cols-2 md:grid-cols-5 gap-4 bg-[var(--secondary)] border border-border/60 backdrop-blur-sm">
                {/* City */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("fields.city")}
                  </p>
                  <p className="text-sm font-bold text-foreground">{order.city}</p>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("fields.address")}
                  </p>
                  <p className="text-sm font-bold text-foreground">{order.address}</p>
                </div>

                {/* Shipping Cost */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("details.shippingCost")}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(order.shippingCost)}
                  </p>
                </div>

                {/* Discount */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("details.discount")}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(order.discount)}
                  </p>
                </div>

                {/* Final Total */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t("details.total")}
                  </p>
                  <p className="text-sm font-bold text-[var(--primary)]">
                    {formatCurrency(order.finalTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Payment Status / Tracking / Notes Banner ── */}
            <div className="p-2">
              <div className="rounded-2xl p-4 py-5 grid grid-cols-2 md:grid-cols-5 gap-4 bg-[var(--secondary)] border border-border/60 backdrop-blur-sm">
                {/* Payment Status */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("fields.paymentStatus")}
                  </p>
                  <Badge
                    className="rounded-lg px-4 py-2 text-sm font-bold
                      bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]
                      text-[var(--primary)]
                      border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
                  >
                    {t(`paymentStatuses.${order.paymentStatus}`)}
                  </Badge>
                </div>

                {/* Tracking Number */}
                {order.trackingNumber && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("fields.trackingNumber")}
                    </p>
                    <p className="text-sm font-bold text-foreground font-mono">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {(order.notes || order.customerNotes) && (
                  <div className="flex flex-col gap-1 col-span-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("details.notes")}
                    </p>
                    {order.notes && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {order.notes}
                      </p>
                    )}
                    {order.customerNotes && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                        {order.customerNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Order Items Table ── */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <h3 className="text-base font-bold text-foreground">
                  {t("details.orderItems")}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
                        {t("details.product")}
                      </th>
                      <th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
                        {t("details.variant")}
                      </th>
                      <th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
                        {t("details.quantity")}
                      </th>
                      <th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
                        {t("details.unitPrice")}
                      </th>
                      <th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
                        {t("details.lineTotal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-b border-border/40",
                          idx % 2 === 0 && "bg-muted/30"
                        )}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/50 flex items-center justify-center">
                              <QrCode size={14} className="text-muted-foreground" />
                            </div>
                            <span className="text-sm font-mono font-semibold text-foreground">
                              {item.variant?.product?.name || t("details.unknownProduct")}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.variant?.name || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm font-bold text-foreground">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm font-mono text-muted-foreground">
                            {formatCurrency(item.unitPrice)}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm font-mono font-bold text-foreground">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-4 border-t border-border/40 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("details.subtotal")}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.productsTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("details.shippingCost")}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.shippingCost)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("details.discount")}</span>
                    <span className="font-semibold text-foreground">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.deposit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("details.deposit")}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(order.deposit)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/40">
                  <span className="text-foreground">{t("details.total")}</span>
                  <span className="text-[var(--primary)]">{formatCurrency(order.finalTotal)}</span>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT SIDEBAR — 3 cols
        ══════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-6">

          {/* ── Customer Info ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-foreground">
                {t("details.customerInfo")}
              </h3>
              <Badge className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 rounded-lg">
                {order.items?.length || 0} {t("details.orderItems")}
              </Badge>
            </div>

            <div className="space-y-3">
              <InfoRow icon={User} label={t("fields.customerName")} value={order.customerName} />
              <InfoRow icon={Phone} label={t("fields.phoneNumber")} value={order.phoneNumber} />
              {order.email && (
                <InfoRow icon={FileText} label={t("fields.email")} value={order.email} />
              )}
              <InfoRow icon={MapPin} label={t("fields.city")} value={order.city} />
              {order.landmark && (
                <InfoRow icon={MapPin} label={t("fields.landmark")} value={order.landmark} />
              )}
            </div>
          </motion.div>

          {/* ── Shipping Info ── */}
          {order.shippingCompany && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <h3 className="text-base font-bold text-foreground">
                  {t("details.shippingInfo")}
                </h3>
              </div>
              <div className="space-y-3">
                <InfoRow icon={Truck} label={t("fields.shippingCompany")} value={order.shippingCompany.name} />
                {order.trackingNumber && (
                  <InfoRow icon={FileText} label={t("fields.trackingNumber")} value={order.trackingNumber} />
                )}
                {order.shippedAt && (
                  <InfoRow icon={Calendar} label={t("details.shippedAt")} value={formatDate(order.shippedAt)} />
                )}
                {order.deliveredAt && (
                  <InfoRow icon={CheckCircle} label={t("details.deliveredAt")} value={formatDate(order.deliveredAt)} />
                )}
              </div>
            </motion.div>
          )}

          {/* ── Store Info ── */}
          {order.store && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <h3 className="text-base font-bold text-foreground">
                  {t("details.storeInfo")}
                </h3>
              </div>
              <div className="space-y-3">
                <InfoRow icon={Store} label={t("fields.storeName")} value={order.store.name} />
                {order.store.address && (
                  <InfoRow icon={MapPin} label={t("fields.storeAddress")} value={order.store.address} />
                )}
              </div>
            </motion.div>
          )}

          {/* ── Assigned Employee ── */}
          {order.assignments && order.assignments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <h3 className="text-base font-bold text-foreground">
                  {t("details.assignedEmployee")}
                </h3>
              </div>

              {order.assignments
                .filter((a) => a.isAssignmentActive)
                .map((assignment) => (
                  <div key={assignment.id} className="space-y-3">
                    {/* Employee row */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--secondary)] border border-border/60">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={assignment.employee?.avatar} />
                        <AvatarFallback className="bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] font-bold">
                          {assignment.employee?.name?.charAt(0) || "E"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">
                          {assignment.employee?.name || t("details.unknownEmployee")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("details.assignedAt")}: {formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Retries */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl p-3 bg-[var(--secondary)] border border-border/60 text-center">
                        <p className="text-xl font-bold text-[var(--primary)]">
                          {assignment.retriesUsed}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("details.retriesUsed")}
                        </p>
                      </div>
                      <div className="rounded-2xl p-3 bg-[var(--secondary)] border border-border/60 text-center">
                        <p className="text-xl font-bold text-[var(--primary)]">
                          {assignment.maxRetriesAtAssignment}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("details.maxRetries")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </motion.div>
          )}

          {/* ── Status History (Timeline) ── */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <h3 className="text-base font-bold text-foreground">
                  {t("details.statusHistory")}
                </h3>
              </div>

              <div className="space-y-4 max-h-[700px] overflow-y-auto">
                {order.statusHistory
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((history, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <div key={history.id} className="relative">
                        <div className="flex gap-3">
                          {/* Timeline dot */}
                          <div className="relative flex flex-col items-center">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full z-10",
                                isFirst
                                  ? "bg-[var(--primary)] ring-4 ring-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
                                  : "bg-muted-foreground/30"
                              )}
                            />
                            {idx !== order.statusHistory.length - 1 && (
                              <div className="w-px h-full bg-border/60 absolute top-2" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-4">
                            <p className="text-xs text-muted-foreground mb-1">
                              {history.notes || t("details.statusUpdated")}
                            </p>
                            <p className="text-sm font-bold text-[var(--primary)] mb-1">
                              {history.fromStatus?.system
                                ? t(`statuses.${history.fromStatus.code}`)
                                : history.fromStatus?.name}{" "}
                              →{" "}
                              {history.toStatus?.system
                                ? t(`statuses.${history.toStatus.code}`)
                                : history.toStatus?.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock size={12} />
                              <span>{formatDate(history.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────
// Pulse atom — base building block
// ─────────────────────────────────────────────
function Bone({ className }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted/60 animate-pulse",
        className
      )}
    />
  );
}

// ─────────────────────────────────────────────
// Reusable: info-panel banner row
// (matches the 5-col bg-[var(--secondary)] grid blocks)
// ─────────────────────────────────────────────
function BannerSkeleton({ cols = 5 }) {
  return (
    <div className="p-2">
      <div className="rounded-2xl p-4 py-5 grid grid-cols-2 md:grid-cols-5 gap-4 bg-[var(--secondary)] border border-border/60">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bone className="h-3 w-16" />
            <Bone className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Reusable: sidebar card skeleton shell
// ─────────────────────────────────────────────
function SideCardSkeleton({ children, className }) {
  return (
    <div className={cn(
      "bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60",
      className
    )}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// InfoCard row skeleton (icon + label | value)
// ─────────────────────────────────────────────
function InfoRowSkeleton() {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex items-center gap-2">
        <Bone className="w-4 h-4 rounded-full" />
        <Bone className="h-3 w-20" />
      </div>
      <Bone className="h-3 w-24" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Timeline item skeleton
// ─────────────────────────────────────────────
function TimelineItemSkeleton({ isFirst = false, isLast = false }) {
  return (
    <div className="flex gap-3">
      <div className="relative flex flex-col items-center">
        <div className={cn(
          "w-2 h-2 rounded-full z-10 shrink-0 bg-muted/60 animate-pulse",
          isFirst && "ring-4 ring-muted/30"
        )} />
        {!isLast && <div className="w-px flex-1 bg-border/40 mt-1 min-h-[40px]" />}
      </div>
      <div className="flex-1 pb-4 space-y-1.5">
        <Bone className="h-3 w-28" />
        <Bone className="h-4 w-36" />
        <Bone className="h-3 w-20" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Table row skeleton
// ─────────────────────────────────────────────
function TableRowSkeleton({ muted = false }) {
  return (
    <tr className={cn("border-b border-border/40", muted && "bg-muted/30")}>
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          <Bone className="w-8 h-8 rounded-lg shrink-0" />
          <Bone className="h-4 w-14" />
        </div>
      </td>
      <td className="py-3 px-2"><Bone className="h-3 w-20" /></td>
      <td className="py-3 px-2"><Bone className="h-4 w-8" /></td>
      <td className="py-3 px-2"><Bone className="h-3 w-16" /></td>
      <td className="py-3 px-2"><Bone className="h-4 w-16" /></td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export function OrderDetailsPageSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-6 bg-background">

      {/* ── Breadcrumb ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bone className="h-3 w-16" />
          <Bone className="h-3 w-3 rounded-full" />
          <Bone className="h-3 w-24" />
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ════════ MAIN — 9 cols ════════ */}
        <div className="lg:col-span-9">
          <div className="bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60">

            {/* Banner 1: order meta */}
            <BannerSkeleton cols={5} />

            {/* Banner 2: shipping / financials */}
            <BannerSkeleton cols={5} />

            {/* Banner 3: status / link / notes */}
            <BannerSkeleton cols={5} />

            {/* Products table */}
            <div className="p-6">
              {/* Table heading */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-muted/60 animate-pulse" />
                <Bone className="h-4 w-32" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["w-10", "w-20", "w-14", "w-16", "w-16"].map((w, i) => (
                        <th key={i} className="text-start py-3 px-2">
                          <Bone className={`h-3 ${w}`} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <TableRowSkeleton key={i} muted={i % 2 === 0} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ SIDEBAR — 3 cols ════════ */}
        <div className="lg:col-span-3 space-y-6">

          {/* Customer info card */}
          <SideCardSkeleton>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Bone className="h-4 w-28" />
              <Bone className="h-6 w-16 rounded-lg" />
            </div>
            {/* Info rows */}
            <div className="space-y-3">
              <InfoRowSkeleton />
              <InfoRowSkeleton />
              <InfoRowSkeleton />
              <InfoRowSkeleton />
            </div>
          </SideCardSkeleton>

          {/* Timeline card */}
          <SideCardSkeleton>
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-muted/60 animate-pulse" />
              <Bone className="h-4 w-24" />
            </div>
            {/* Timeline items */}
            <div className="space-y-0">
              <TimelineItemSkeleton isFirst />
              <TimelineItemSkeleton />
              <TimelineItemSkeleton />
              <TimelineItemSkeleton isLast />
            </div>
          </SideCardSkeleton>

        </div>
      </div>
    </div>
  );
}