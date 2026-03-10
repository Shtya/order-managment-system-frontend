"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, Package, User, Phone, MapPin, Truck, DollarSign,
  Calendar, Clock, Store, FileText, History, Edit, Printer, Download,
  CheckCircle, AlertCircle, XCircle, QrCode, Hash, ArrowLeftRight,
  ExternalLink, ImageIcon, Building2, Landmark, ChevronRight,
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
import { avatarSrc } from "@/components/atoms/UserSelect";

// ── Design tokens (derived from CSS vars) ─────────────────────────────────────
const P = "var(--primary)";          // #ff6a1e
const S = "var(--secondary)";        // #ffb703
const P_10  = "color-mix(in oklab, var(--primary) 10%, transparent)";
const P_15  = "color-mix(in oklab, var(--primary) 15%, transparent)";
const P_20  = "color-mix(in oklab, var(--primary) 20%, transparent)";
const P_25  = "color-mix(in oklab, var(--primary) 25%, transparent)";
const S_10  = "color-mix(in oklab, var(--secondary) 10%, transparent)";
const S_20  = "color-mix(in oklab, var(--secondary) 20%, transparent)";

// ── StatusBadge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status, t }) => {
  if (!status) return null;
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold"
      style={{
        background: P_15,
        color: P,
        border: `1px solid ${P_25}`,
      }}
    >
      {status?.system ? t(`statuses.${status.code}`) : status.name}
    </span>
  );
};

// ── MetaField — used inside the gradient banner grid ─────────────────────────
const MetaField = ({ label, children, wide }) => (
  <div className={cn("flex flex-col gap-1.5", wide && "col-span-2")}>
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</p>
    <div className="text-sm font-bold text-foreground leading-tight">{children}</div>
  </div>
);

// ── InfoRow — sidebar detail rows ─────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, valueClassName }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-border/30 last:border-0">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={14} className="shrink-0" style={{ color: P }} />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className={cn("text-xs font-bold text-foreground text-end max-w-[55%]", valueClassName)}>
      {value || "—"}
    </div>
  </div>
);

// ── SideCard ──────────────────────────────────────────────────────────────────
const SideCard = ({ title, icon: Icon, children, delay = 0, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, ease: [0.16, 1, 0.3, 1] }}
    className="bg-card !p-0 rounded-2xl border border-border/50 overflow-hidden"
    style={{ boxShadow: "var(--shadow-sm)" }}
  >
    {/* Card header strip */}
    <div
      className="flex items-center gap-2.5 px-4 py-3 border-b border-border/30"
      style={{ background: accent ? P_10 : "transparent" }}
    >
      {Icon && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: P_15, border: `1px solid ${P_25}` }}
        >
          <Icon size={13} style={{ color: P }} />
        </div>
      )}
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </motion.div>
);

// ── Section divider label ─────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-4">
    <span
      className="text-[10px] font-black uppercase tracking-[2px] whitespace-nowrap"
      style={{ color: P }}
    >
      {children}
    </span>
    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${P_25}, transparent)` }} />
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// WRAPPER
// ──────────────────────────────────────────────────────────────────────────────
export default function OrderDetailsPageWrapper() {
  const params = useParams();
  const t = useTranslations("orders");
  const orderId = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch {
      toast.error(t("messages.errorFetchingOrder"));
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Invalid order ID</p>
    </div>
  );

  return <OrderDetailsPage order={order} loading={loading} />;
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────────────────────
export function OrderDetailsPage({ order, loading }) {
  const t = useTranslations("orders");
  const router = useRouter();

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };
  const formatCurrency = (amount) => `${amount?.toLocaleString() || 0} ${t("currency")}`;

  if (loading) return <OrderDetailsPageSkeleton />;

  if (!order) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-background">
      <div className="text-center space-y-3">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: P_15, border: `1.5px solid ${P_25}` }}
        >
          <AlertCircle size={28} style={{ color: P }} />
        </div>
        <p className="text-muted-foreground text-sm">{t("messages.orderNotFound")}</p>
        <button
          onClick={() => router.push("/orders")}
          className="mt-2 text-sm font-bold px-5 py-2 rounded-xl transition-opacity hover:opacity-80"
          style={{ background: P_15, color: P, border: `1px solid ${P_25}` }}
        >
          {t("actions.backToOrders")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between flex-wrap gap-3"
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{t("breadcrumb.home")}</span>
          <ChevronLeft size={13} className="rtl:rotate-180 text-muted-foreground/50" />
          <span
            className="font-black text-sm tracking-tight"
            style={{ color: P, fontFamily: "var(--mono)" }}
          >
            {order.orderNumber}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/orders/edit/${order.id}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 active:scale-[.98]"
            style={{
              background: `linear-gradient(135deg, var(--primary), var(--third))`,
              color: "#fff",
              boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent)",
            }}
          >
            <Edit size={13} />
            {t("actions.edit")}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ═══════════════════════════════════════════════════════════════
            MAIN CONTENT — 9 cols
        ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-9 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
            className="bg-card !p-0 rounded-2xl border border-border/50 overflow-hidden"
            style={{ boxShadow: "var(--shadow)" }}
          >

            {/* ── Hero gradient banner ─────────────────────────────────── */}
            <div
              className="px-5 pt-5 pb-4"
              style={{
                background: `linear-gradient(135deg,
                  color-mix(in oklab, var(--primary) 8%, transparent) 0%,
                  color-mix(in oklab, var(--secondary) 6%, transparent) 100%)`,
                borderBottom: `1.5px solid ${P_20}`,
              }}
            >
              {/* Order number + status row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                    {t("fields.orderNumber") || "رقم الطلب"}
                  </p>
                  <p
                    className="text-2xl font-black tracking-tight"
                    style={{ fontFamily: "var(--mono)", color: P }}
                  >
                    {order.orderNumber}
                  </p>
                </div>
                <StatusBadge status={order.status} t={t} />
              </div>

              {/* Meta grid row 1 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 p-4 rounded-xl bg-card/60 border border-border/40 backdrop-blur-sm">
                <MetaField label={t("fields.paymentMethod")}>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ background: S_10, color: "var(--secondary)", border: `1px solid ${S_20}` }}
                  >
                    {t(`paymentMethods.${order.paymentMethod}`)}
                  </span>
                </MetaField>

                <MetaField label={t("fields.paymentStatus")}>
                  <StatusBadge status={{ name: t(`paymentStatuses.${order.paymentStatus}`) }} t={t} />
                </MetaField>

                <MetaField label={t("details.createdAt")}>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Calendar size={12} style={{ color: P }} />
                    {formatDate(order.created_at)}
                  </span>
                </MetaField>

                <MetaField label={t("details.updatedAt")}>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatDate(order.updated_at)}
                  </span>
                </MetaField>
              </div>
            </div>

            {/* ── Shipping + Finance strip ──────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border-b border-border/30">
              {[
                { label: t("fields.city"), value: order.city },
                { label: t("fields.address"), value: order.address },
                { label: t("details.shippingCost"), value: formatCurrency(order.shippingCost) },
                { label: t("details.discount"), value: formatCurrency(order.discount) },
                {
                  label: t("details.total"),
                  value: formatCurrency(order.finalTotal),
                  highlight: true,
                },
              ].map(({ label, value, highlight }, i) => (
                <div
                  key={i}
                  className="px-4 py-3.5 border-l border-border/30 first:border-l-0"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                    {label}
                  </p>
                  <p
                    className="text-sm font-black"
                    style={{ color: highlight ? P : undefined }}
                  >
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Tracking / Notes strip ───────────────────────────────── */}
            {(order.trackingNumber || order.notes || order.customerNotes) && (
              <div className="px-5 py-3.5 border-b border-border/30 flex flex-wrap gap-4 bg-muted/20">
                {order.trackingNumber && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                      {t("fields.trackingNumber")}
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ fontFamily: "var(--mono)", color: P }}
                    >
                      {order.trackingNumber}
                    </p>
                  </div>
                )}
                {(order.notes || order.customerNotes) && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                      {t("details.notes")}
                    </p>
                    {order.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{order.notes}</p>
                    )}
                    {order.customerNotes && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{order.customerNotes}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Order Items Table ─────────────────────────────────────── */}
            <div className="p-5">
              <SectionLabel>{t("details.orderItems")}</SectionLabel>

              <div className="rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: P_10 }}>
                      {[
                        t("details.product"),
                        t("details.variant"),
                        t("details.quantity"),
                        t("details.unitPrice"),
                        t("details.lineTotal"),
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-start py-2.5 px-3 text-[10px] font-black uppercase tracking-wider"
                          style={{ color: P }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-t border-border/25 transition-colors hover:bg-muted/20",
                          idx % 2 !== 0 && "bg-muted/10"
                        )}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                              style={{ background: P_10, borderColor: P_20 }}
                            >
                              <Package size={13} style={{ color: P }} />
                            </div>
                            <span className="text-xs font-bold text-foreground" style={{ fontFamily: "var(--mono)" }}>
                              {item.variant?.product?.name || t("details.unknownProduct")}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs text-muted-foreground font-medium">
                            {item.variant?.name || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black"
                            style={{ background: P_10, color: P }}
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs text-muted-foreground" style={{ fontFamily: "var(--mono)" }}>
                            {formatCurrency(item.unitPrice)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-black text-foreground" style={{ fontFamily: "var(--mono)" }}>
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 space-y-1.5">
                {[
                  { label: t("details.subtotal"), value: formatCurrency(order.productsTotal) },
                  { label: t("details.shippingCost"), value: formatCurrency(order.shippingCost) },
                  order.discount > 0 && { label: t("details.discount"), value: `-${formatCurrency(order.discount)}` },
                  order.deposit > 0 && { label: t("details.deposit"), value: formatCurrency(order.deposit) },
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}

                {/* Total row */}
                <div
                  className="flex justify-between items-center pt-3 mt-2 border-t border-border/30"
                >
                  <span className="text-sm font-bold text-foreground">{t("details.total")}</span>
                  <span
                    className="text-lg font-black"
                    style={{ color: P, fontFamily: "var(--mono)" }}
                  >
                    {formatCurrency(order.finalTotal)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Replacement card */}
          {order.replacementResult && (
            <ReplacementInfoCard
              replacement={order.replacementResult}
              replacementOrder={order}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              router={router}
            />
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SIDEBAR — 3 cols
        ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-4">

          {/* Customer Info */}
          <SideCard title={t("details.customerInfo")} icon={User} delay={0.05} accent>
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                style={{ background: P_10, color: P, border: `1px solid ${P_20}` }}
              >
                {order.items?.length || 0} {t("details.orderItems")}
              </span>
            </div>
            <div className="space-y-0.5">
              <InfoRow icon={User}     label={t("fields.customerName")} value={order.customerName} />
              <InfoRow icon={Phone}    label={t("fields.phoneNumber")}  value={order.phoneNumber} />
              {order.email    && <InfoRow icon={FileText}  label={t("fields.email")}       value={order.email} />}
              <InfoRow icon={Building2} label={t("fields.city")}        value={order.city} />
              {order.area     && <InfoRow icon={MapPin}    label={t("fields.area")}         value={order.area} />}
              {order.landmark && <InfoRow icon={Landmark}  label={t("fields.landmark")}     value={order.landmark} />}
            </div>
          </SideCard>

          {/* Shipping Info */}
          {order.shippingCompany && (
            <SideCard title={t("details.shippingInfo")} icon={Truck} delay={0.08}>
              <div className="space-y-0.5">
                <InfoRow icon={Truck}        label={t("fields.shippingCompany")} value={order.shippingCompany.name} />
                {order.trackingNumber && <InfoRow icon={FileText} label={t("fields.trackingNumber")} value={order.trackingNumber} />}
                {order.shippedAt    && <InfoRow icon={Calendar}  label={t("details.shippedAt")}    value={formatDate(order.shippedAt)} />}
                {order.deliveredAt  && <InfoRow icon={CheckCircle} label={t("details.deliveredAt")} value={formatDate(order.deliveredAt)} />}
              </div>
            </SideCard>
          )}

          {/* Store Info */}
          {order.store && (
            <SideCard title={t("details.storeInfo")} icon={Store} delay={0.1}>
              <div className="space-y-0.5">
                <InfoRow icon={Store}  label={t("fields.storeName")}    value={order.store.name} />
                {order.store.address && <InfoRow icon={MapPin} label={t("fields.storeAddress")} value={order.store.address} />}
              </div>
            </SideCard>
          )}

          {/* Assigned Employee */}
          {order.assignments?.length > 0 && (
            <SideCard title={t("details.assignedEmployee")} icon={User} delay={0.12}>
              {order.assignments.filter(a => a.isAssignmentActive).map(assignment => (
                <div key={assignment.id} className="space-y-3">
                  {/* Employee chip */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border"
                    style={{ background: P_10, borderColor: P_20 }}
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={assignment.employee?.avatar} />
                      <AvatarFallback
                        className="text-sm font-black"
                        style={{ background: P_15, color: P }}
                      >
                        {assignment.employee?.name?.charAt(0) || "E"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {assignment.employee?.name || t("details.unknownEmployee")}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(assignment.assignedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Retry stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: t("details.retriesUsed"),  val: assignment.retriesUsed },
                      { label: t("details.maxRetries"),   val: assignment.maxRetriesAtAssignment },
                    ].map(({ label, val }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3 text-center border"
                        style={{ background: P_10, borderColor: P_20 }}
                      >
                        <p className="text-xl font-black" style={{ color: P }}>{val}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </SideCard>
          )}

          {/* Status History Timeline */}
          {order.statusHistory?.length > 0 && (
            <SideCard title={t("details.statusHistory")} icon={History} delay={0.14}>
              <div className="space-y-0 max-h-[600px] overflow-y-auto -mx-1 px-1">
                {order.statusHistory
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((history, idx, arr) => {
                    const isFirst = idx === 0;
                    const isLast  = idx === arr.length - 1;
                    return (
                      <div key={history.id} className="relative flex gap-3">
                        {/* Timeline track */}
                        <div className="relative flex flex-col items-center pt-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full z-10 shrink-0 transition-all"
                            style={{
                              background: isFirst ? P : "var(--border)",
                              boxShadow: isFirst ? `0 0 0 3px ${P_20}` : "none",
                            }}
                          />
                          {!isLast && (
                            <div
                              className="w-px flex-1 mt-1 min-h-[28px]"
                              style={{
                                background: isFirst
                                  ? `linear-gradient(to bottom, ${P_20}, var(--border))`
                                  : "var(--border)",
                              }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
                          {history.notes && (
                            <p className="text-[10px] text-muted-foreground mb-1 leading-relaxed">
                              {history.notes}
                            </p>
                          )}
                          <p className="text-xs font-bold mb-1" style={{ color: isFirst ? P : "var(--foreground)" }}>
                            {history.fromStatus?.system
                              ? t(`statuses.${history.fromStatus.code}`)
                              : history.fromStatus?.name}
                            {" → "}
                            {history.toStatus?.system
                              ? t(`statuses.${history.toStatus.code}`)
                              : history.toStatus?.name}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock size={10} />
                            {formatDate(history.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </SideCard>
          )}

        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// REPLACEMENT CARD
// ──────────────────────────────────────────────────────────────────────────────
function ReplacementInfoCard({ replacementOrder, replacement, formatCurrency, formatDate, router }) {
  const tR = useTranslations("CreateReplacement");
  const t  = useTranslations("orders");

  const originalOrder = replacement?.originalOrder;
  const bridgeItems   = replacement?.items ?? [];
  const returnImages  = replacement?.returnImages ?? [];

  const oldTotal  = originalOrder?.finalTotal ?? originalOrder?.total ?? 0;
  const newTotal  = replacementOrder?.finalTotal ?? replacementOrder?.total ?? 0;
  const totalDiff = newTotal - oldTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card rounded-2xl border overflow-hidden"
      style={{
        borderColor: P_25,
        boxShadow: `0 4px 20px ${P_15}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5 border-b"
        style={{ background: P_10, borderColor: P_20 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: P_15, border: `1px solid ${P_25}` }}
          >
            <ArrowLeftRight size={15} style={{ color: P }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: P }}>{t("replacement.cardTitle")}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("replacement.cardSubtitle")}</p>
          </div>
        </div>
        {replacement.reason && (
          <span
            className="text-[10px] font-bold px-3 py-1.5 rounded-xl shrink-0"
            style={{ background: P_10, color: P, border: `1px solid ${P_25}` }}
          >
            {tR(`reasons.${replacement.reason}`)}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Original order */}
        {originalOrder && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
            <p
              className="text-[9px] font-black uppercase tracking-[2px] mb-3"
              style={{ color: P }}
            >
              {t("replacement.originalOrder")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  icon: Hash, label: t("replacement.orderNumber"),
                  content: (
                    <button
                      onClick={() => router.push(`/orders/${originalOrder.id}`)}
                      className="text-xs font-bold hover:underline flex items-center gap-1 mt-0.5"
                      style={{ color: P, fontFamily: "var(--mono)" }}
                    >
                      {originalOrder.orderNumber} <ExternalLink size={9} />
                    </button>
                  ),
                },
                { icon: User, label: t("replacement.customer"), value: originalOrder.customerName },
                { icon: DollarSign, label: t("replacement.originalTotal"), value: formatCurrency(oldTotal) },
                { icon: Calendar, label: t("replacement.originalDate"), value: formatDate(originalOrder.created_at) },
              ].map(({ icon: Icon, label, value, content }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon size={11} className="mt-0.5 shrink-0" style={{ color: P }} />
                  <div className="min-w-0">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    {content || <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{value}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Price diff */}
            <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-2">
              {[
                { label: t("replacement.oldTotal"), val: formatCurrency(oldTotal), style: {} },
                { label: "→", val: null, sep: true },
                { label: t("replacement.newTotal"), val: formatCurrency(newTotal), highlight: true },
              ].map(({ label, val, sep, highlight }, i) =>
                sep ? (
                  <span key={i} className="text-muted-foreground/40 flex items-center text-sm">→</span>
                ) : (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                    style={highlight ? { background: P_10, borderColor: P_20 } : { background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                    <span className="text-xs font-black" style={highlight ? { color: P } : {}}>{val}</span>
                  </div>
                )
              )}

              {totalDiff !== 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                  style={{
                    background: totalDiff > 0 ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
                    borderColor: totalDiff > 0 ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
                  }}
                >
                  <span className="text-[9px] text-muted-foreground">{t("replacement.priceDiff")}</span>
                  <span
                    className="text-xs font-black"
                    style={{ color: totalDiff > 0 ? "#ef4444" : "#10b981" }}
                  >
                    {totalDiff > 0 ? "+" : ""}{formatCurrency(totalDiff)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items table */}
        {bridgeItems.length > 0 && (
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-[2px] mb-3"
              style={{ color: P }}
            >
              {t("replacement.replacedItems")} ({bridgeItems.length})
            </p>
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: P_10, borderBottom: `1px solid ${P_20}` }}>
                      {[
                        t("replacement.table.originalProduct"),
                        t("replacement.table.newProduct"),
                        t("replacement.table.qty"),
                        t("replacement.table.oldPrice"),
                        t("replacement.table.newPrice"),
                        t("replacement.table.diff"),
                      ].map(h => (
                        <th
                          key={h}
                          className="text-right px-3 py-2.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap"
                          style={{ color: P }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bridgeItems.map((item, idx) => {
                      const origItem = item.originalOrderItem;
                      const origProduct = origItem?.variant?.product;
                      const matchedNewOrderItem = replacementOrder?.items?.find(
                        roi => roi.variantId === item.newVariantId
                      );
                      const oldPrice = origItem?.unitPrice ?? 0;
                      const newPrice = matchedNewOrderItem?.unitPrice ?? 0;
                      const lineDiff = newPrice - oldPrice;
                      const newVariant = matchedNewOrderItem?.variant;
                      const newProduct = newVariant?.product;

                      return (
                        <tr
                          key={item.id ?? idx}
                          className={cn(
                            "border-t border-border/20 transition-colors hover:bg-muted/20",
                            idx % 2 !== 0 && "bg-muted/10"
                          )}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {origProduct?.mainImage
                                ? <img src={avatarSrc(origProduct.mainImage)} className="w-7 h-7 rounded-lg object-cover border border-border/40 shrink-0" />
                                : <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: P_10, border: `1px solid ${P_20}` }}><Package size={11} style={{ color: P }} /></div>
                              }
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-foreground line-clamp-1">{origProduct?.name || "—"}</p>
                                {origItem?.variant?.sku && <p className="text-[9px] text-muted-foreground" style={{ fontFamily: "var(--mono)" }}>{origItem.variant.sku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {newProduct?.mainImage
                                ? <img src={avatarSrc(newProduct.mainImage)} className="w-7 h-7 rounded-lg object-cover shrink-0" style={{ border: `1px solid ${P_25}` }} />
                                : <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: P_10, border: `1px solid ${P_20}` }}><Package size={11} style={{ color: P }} /></div>
                              }
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-foreground line-clamp-1">{newProduct?.name || "—"}</p>
                                {newVariant?.sku && <p className="text-[9px] text-muted-foreground" style={{ fontFamily: "var(--mono)" }}>{newVariant.sku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black"
                              style={{ background: P_10, color: P }}
                            >
                              ×{item.quantityToReplace}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--mono)" }}>{formatCurrency(oldPrice)}</span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-[10px] font-bold text-foreground" style={{ fontFamily: "var(--mono)" }}>{formatCurrency(newPrice)}</span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className="text-[10px] font-black"
                              style={{
                                fontFamily: "var(--mono)",
                                color: lineDiff > 0 ? "#ef4444" : lineDiff < 0 ? "#10b981" : "var(--muted-foreground)",
                              }}
                            >
                              {lineDiff > 0 ? "+" : ""}{formatCurrency(lineDiff)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Return images */}
        {returnImages.length > 0 && (
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-[2px] mb-3 flex items-center gap-1.5"
              style={{ color: P }}
            >
              <ImageIcon size={10} />
              {t("replacement.returnImages")} ({returnImages.length})
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {returnImages.map((url, i) => (
                <a
                  key={i}
                  href={avatarSrc(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border transition-all hover:scale-105 group"
                  style={{ borderColor: "var(--border)" }}
                >
                  <img
                    src={avatarSrc(url)}
                    alt={`return-${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SKELETON
// ──────────────────────────────────────────────────────────────────────────────
function Bone({ className }) {
  return <div className={cn("rounded-lg bg-muted/60 animate-pulse", className)} />;
}

function BannerSkeleton({ cols = 5 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border-b border-border/30">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Bone className="h-2.5 w-14" />
          <Bone className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function InfoRowSkeleton() {
  return (
    <div className="flex items-start justify-between py-2.5">
      <div className="flex items-center gap-2">
        <Bone className="w-3.5 h-3.5 rounded-full" />
        <Bone className="h-2.5 w-16" />
      </div>
      <Bone className="h-2.5 w-20" />
    </div>
  );
}

function TimelineItemSkeleton({ isFirst, isLast }) {
  return (
    <div className="flex gap-3">
      <div className="relative flex flex-col items-center pt-1">
        <div className={cn("w-2.5 h-2.5 rounded-full bg-muted/60 animate-pulse shrink-0", isFirst && "ring-4 ring-muted/30")} />
        {!isLast && <div className="w-px flex-1 bg-border/40 mt-1 min-h-[32px]" />}
      </div>
      <div className="flex-1 pb-4 space-y-1.5">
        <Bone className="h-2.5 w-24" />
        <Bone className="h-3.5 w-32" />
        <Bone className="h-2.5 w-16" />
      </div>
    </div>
  );
}

export function OrderDetailsPageSkeleton() {
  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      <div className="mb-6 flex items-center gap-2">
        <Bone className="h-3 w-14" />
        <Bone className="h-3 w-3 rounded-full" />
        <Bone className="h-3 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9">
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--shadow)" }}>
            {/* Hero */}
            <div className="p-5 border-b border-border/30">
              <Bone className="h-7 w-32 mb-4" />
              <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20">
                {[0,1,2,3].map(i => <div key={i} className="space-y-2"><Bone className="h-2.5 w-14" /><Bone className="h-4 w-20" /></div>)}
              </div>
            </div>
            <BannerSkeleton />
            {/* Table */}
            <div className="p-5">
              <Bone className="h-3 w-28 mb-4" />
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-muted/20">{[1,2,3,4,5].map(i => <th key={i} className="py-3 px-3"><Bone className="h-2.5 w-14" /></th>)}</tr></thead>
                  <tbody>{[0,1,2,3].map(i => (
                    <tr key={i} className={cn("border-t border-border/20", i%2!==0&&"bg-muted/10")}>
                      <td className="py-3 px-3"><div className="flex gap-2"><Bone className="w-8 h-8 rounded-lg" /><Bone className="h-3 w-16" /></div></td>
                      {[1,2,3,4].map(j => <td key={j} className="py-3 px-3"><Bone className="h-3 w-14" /></td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {[0,1,2].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
                <Bone className="w-7 h-7 rounded-lg" />
                <Bone className="h-3 w-24" />
              </div>
              <div className="p-4 space-y-1">
                {[0,1,2,3].map(j => <InfoRowSkeleton key={j} />)}
              </div>
            </div>
          ))}

          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
              <Bone className="w-7 h-7 rounded-lg" />
              <Bone className="h-3 w-24" />
            </div>
            <div className="p-4 space-y-0">
              {[0,1,2,3].map((i,_,arr) => <TimelineItemSkeleton key={i} isFirst={i===0} isLast={i===arr.length-1} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}