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

// Status Badge Component
const StatusBadge = ({ status, t }) => {
  if (!status) return null;

  const getBgColor = (colorCode) => {
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
        : null;
    };

    const rgb = hexToRgb(colorCode);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : "#f5f5f5";
  };

  return (
    <Badge
      className="rounded-lg px-3 py-1.5 font-semibold"
      style={{
        backgroundColor: getBgColor(status.color),
        color: status.color,
        border: `1px solid ${status.color}`,
      }}
    >
      {status?.system ? t(`statuses.${status.code}`) : status.name}
    </Badge>
  );
};

// Info Row Component
const InfoRow = ({ icon: Icon, label, value, valueClassName }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
      <Icon size={20} className="text-gray-600 dark:text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={cn("text-base font-semibold text-gray-900 dark:text-gray-100", valueClassName)}>
        {value || "-"}
      </p>
    </div>
  </div>
);

// Section Card Component
const SectionCard = ({ title, icon: Icon, children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6",
      "shadow-sm hover:shadow-md transition-all",
      className
    )}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={20} className="text-primary" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
    </div>
    {children}
  </motion.div>
);


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
        <p className="text-gray-600 dark:text-gray-400">Invalid order ID</p>
      </div>
    );
  }

  return <OrderDetailsPage order={order} loading={loading} />;
}

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("messages.loading")}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-gray-600 dark:text-gray-400">{t("messages.orderNotFound")}</p>
          <Button onClick={() => router.push("/orders")} className="mt-4">
            {t("actions.backToOrders")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/orders")}
              className="rounded-lg"
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {order.orderNumber}
                </h1>
                <StatusBadge status={order.status} t={t} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("details.createdAt")}: {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/orders/edit/${order.id}`)}
              className="rounded-lg"
            >
              <Edit size={16} className="mr-2" />
              {t("actions.edit")}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-lg"
            >
              <Printer size={16} className="mr-2" />
              {t("actions.print")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <SectionCard title={t("details.customerInfo")} icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow
                icon={User}
                label={t("fields.customerName")}
                value={order.customerName}
              />
              <InfoRow
                icon={Phone}
                label={t("fields.phoneNumber")}
                value={order.phoneNumber}
              />
              {order.email && (
                <InfoRow
                  icon={FileText}
                  label={t("fields.email")}
                  value={order.email}
                />
              )}
              <InfoRow
                icon={MapPin}
                label={t("fields.city")}
                value={order.city}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
              <InfoRow
                icon={MapPin}
                label={t("fields.address")}
                value={order.address}
              />
              {order.landmark && (
                <InfoRow
                  icon={MapPin}
                  label={t("fields.landmark")}
                  value={order.landmark}
                />
              )}
            </div>
          </SectionCard>

          {/* Order Items */}
          <SectionCard title={t("details.orderItems")} icon={Package}>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-primary">
                    {item.quantity}×
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.variant?.product?.name || t("details.unknownProduct")}
                    </p>
                    {item.variant?.name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.variant.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.lineTotal)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t("details.subtotal")}</span>
                <span className="font-semibold">{formatCurrency(order.productsTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t("details.shippingCost")}</span>
                <span className="font-semibold">{formatCurrency(order.shippingCost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>{t("details.discount")}</span>
                  <span className="font-semibold">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.deposit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t("details.deposit")}</span>
                  <span className="font-semibold">{formatCurrency(order.deposit)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 dark:border-slate-800">
                <span>{t("details.total")}</span>
                <span className="text-primary">{formatCurrency(order.finalTotal)}</span>
              </div>
            </div>
          </SectionCard>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <SectionCard title={t("details.statusHistory")} icon={History} >
              <div className="space-y-4 max-h-[700px] overflow-y-auto">
                {order.statusHistory
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((history, index) => (
                    <div
                      key={history.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-slate-800"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {index === 0 ? (
                            <CheckCircle size={20} className="text-primary" />
                          ) : (
                            <Clock size={20} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {history.fromStatus?.system ? t(`statuses.${history.fromStatus.code}`) : history.fromStatus.name}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-semibold text-primary">
                            {history.toStatus?.system ? t(`statuses.${history.toStatus.code}`) : history.toStatus.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(history.created_at)}
                        </p>
                        {history.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Information */}
          <SectionCard title={t("details.paymentInfo")} icon={DollarSign}>
            <div className="space-y-3">
              <InfoRow
                icon={DollarSign}
                label={t("fields.paymentMethod")}
                value={t(`paymentMethods.${order.paymentMethod}`)}
              />
              <InfoRow
                icon={DollarSign}
                label={t("fields.paymentStatus")}
                value={t(`paymentStatuses.${order.paymentStatus}`)}
              />
              <InfoRow
                icon={DollarSign}
                label={t("details.finalTotal")}
                value={formatCurrency(order.finalTotal)}
                valueClassName="text-primary"
              />
            </div>
          </SectionCard>

          {/* Shipping Information */}
          {order.shippingCompany && (
            <SectionCard title={t("details.shippingInfo")} icon={Truck}>
              <div className="space-y-3">
                <InfoRow
                  icon={Truck}
                  label={t("fields.shippingCompany")}
                  value={order.shippingCompany.name}
                />
                {order.trackingNumber && (
                  <InfoRow
                    icon={FileText}
                    label={t("fields.trackingNumber")}
                    value={order.trackingNumber}
                  />
                )}
                {order.shippedAt && (
                  <InfoRow
                    icon={Calendar}
                    label={t("details.shippedAt")}
                    value={formatDate(order.shippedAt)}
                  />
                )}
                {order.deliveredAt && (
                  <InfoRow
                    icon={CheckCircle}
                    label={t("details.deliveredAt")}
                    value={formatDate(order.deliveredAt)}
                  />
                )}
              </div>
            </SectionCard>
          )}

          {/* Store Information */}
          {order.store && (
            <SectionCard title={t("details.storeInfo")} icon={Store}>
              <div className="space-y-3">
                <InfoRow
                  icon={Store}
                  label={t("fields.storeName")}
                  value={order.store.name}
                />
                {order.store.address && (
                  <InfoRow
                    icon={MapPin}
                    label={t("fields.storeAddress")}
                    value={order.store.address}
                  />
                )}
              </div>
            </SectionCard>
          )}

          {/* Assigned Employee */}
          {order.assignments && order.assignments.length > 0 && (
            <SectionCard title={t("details.assignedEmployee")} icon={User}>
              {order.assignments
                .filter((a) => a.isAssignmentActive)
                .map((assignment) => (
                  <div key={assignment.id} className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-slate-800">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={assignment.employee?.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {assignment.employee?.name?.charAt(0) || "E"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {assignment.employee?.name || t("details.unknownEmployee")}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("details.assignedAt")}: {formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {assignment.retriesUsed}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t("details.retriesUsed")}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {assignment.maxRetriesAtAssignment}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t("details.maxRetries")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </SectionCard>
          )}

          {/* Notes */}
          {(order.notes || order.customerNotes) && (
            <SectionCard title={t("details.notes")} icon={FileText}>
              <div className="space-y-4">
                {order.notes && (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      {t("details.internalNotes")}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      {order.notes}
                    </p>
                  </div>
                )}
                {order.customerNotes && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      {t("details.customerNotes")}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {order.customerNotes}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Timestamps */}
          <SectionCard title={t("details.timestamps")} icon={Calendar}>
            <div className="space-y-3">
              <InfoRow
                icon={Calendar}
                label={t("details.createdAt")}
                value={formatDate(order.created_at)}
              />
              <InfoRow
                icon={Calendar}
                label={t("details.updatedAt")}
                value={formatDate(order.updated_at)}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}