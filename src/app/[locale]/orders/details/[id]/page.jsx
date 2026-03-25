"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Hash,
  ArrowLeftRight,
  ExternalLink,
  ImageIcon,
  Building2,
  Landmark,
  ChevronRight,
} from "lucide-react";
import {
  Home,
  Tag,
  Wallet,
  CreditCard,
  ShieldCheck,
  StickyNote,
  CalendarPlus,
  CalendarClock,
  ScanBarcode,
  TrendingUp,
  TrendingDown,
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
import Button_ from "@/components/atoms/Button";
import PageHeader from "@/components/atoms/Pageheader";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

// ── Design tokens ──────────────────────────────────────────────────────────────
const P = "var(--primary)";
const S = "var(--secondary,#ffb703)";
const TH = "var(--third,#ff5c2b)";
const P_06 = "color-mix(in oklab, var(--primary)  6%, transparent)";
const P_10 = "color-mix(in oklab, var(--primary) 10%, transparent)";
const P_15 = "color-mix(in oklab, var(--primary) 15%, transparent)";
const P_20 = "color-mix(in oklab, var(--primary) 20%, transparent)";
const P_25 = "color-mix(in oklab, var(--primary) 25%, transparent)";
const S_10 = "color-mix(in oklab, var(--secondary,#ffb703) 10%, transparent)";
const S_22 = "color-mix(in oklab, var(--secondary,#ffb703) 22%, transparent)";

// ── Accent bar (3-stop gradient) ──────────────────────────────────────────────
function AccentBar({ className }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-[2.5px] bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,#ffb703)] to-[var(--third,#ff5c2b)]",
        className,
      )}
    />
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status, t }) {
  if (!status) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold leading-none border"
      style={{ background: P_10, color: P, borderColor: P_25 }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: P }} />
      {status?.system ? t(`statuses.${status.code}`) : status.name}
    </span>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
function SectionLabel({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {Icon && (
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: P_10, border: `1px solid ${P_20}` }}
        >
          <Icon size={11} style={{ color: P }} />
        </div>
      )}
      <span
        className="text-[10px] font-black uppercase tracking-[2px] whitespace-nowrap"
        style={{ color: P }}
      >
        {children}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background: `linear-gradient(to right, ${P_20}, transparent)`,
        }}
      />
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, valueClassName, children }) {
  return (
    <div className="group flex items-start justify-between py-2.5 border-b border-border/25 last:border-0 transition-colors duration-150 hover:bg-[var(--primary)]/[0.02] -mx-1 px-1 rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon
          size={13}
          className="shrink-0 transition-colors duration-150 group-hover:text-[var(--primary)]"
          style={{ color: P_25.replace("transparent", "currentColor") }}
        />
        <span className="text-xs font-medium text-muted-foreground/80">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "text-xs font-bold text-foreground text-end max-w-[55%] leading-tight",
          valueClassName,
        )}
      >
        {children || value || "—"}
      </div>
    </div>
  );
}

// ── SideCard ──────────────────────────────────────────────────────────────────
function SideCard({ title, icon: Icon, children, delay = 0, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-card !p-0 rounded-2xl border border-border/40 overflow-hidden"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-border/25"
        style={{ background: accent ? P_06 : "transparent" }}
      >
        {Icon && (
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: P_15, border: `1px solid ${P_20}` }}
          >
            <Icon size={13} style={{ color: P }} />
          </div>
        )}
        <h3 className="text-sm font-bold text-foreground tracking-tight">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

// ── MetaCell ──────────────────────────────────────────────────────────────────
function MetaCell({ label, icon, children, hero, className }) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between gap-3",
        "px-4 py-4 border-l border-border/25 first:border-l-0",
        hero
          ? "bg-[var(--primary)]/[0.04]"
          : "bg-transparent hover:bg-[var(--primary)]/[0.02]",
        "transition-colors duration-200",
        className,
      )}
    >
      {hero && <AccentBar className="absolute inset-x-0 top-0 h-[2px]" />}

      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest leading-none text-muted-foreground/45">
        <span className="transition-colors duration-200 group-hover:text-[var(--primary)]/60 text-muted-foreground/30">
          {icon}
        </span>
        {label}
      </p>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

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

  if (!orderId)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{t("invalidOrderId")}</p>
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
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const { formatCurrency } = usePlatformSettings();

  if (loading) return <OrderDetailsPageSkeleton />;

  if (!order)
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-background">
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: P_15, border: `1.5px solid ${P_25}` }}
          >
            <AlertCircle size={28} style={{ color: P }} />
          </div>
          <p className="text-muted-foreground text-sm">
            {t("messages.orderNotFound")}
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="text-sm font-bold px-5 py-2 rounded-xl transition-all hover:opacity-80"
            style={{ background: P_10, color: P, border: `1px solid ${P_25}` }}
          >
            {t("actions.backToOrders")}
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/" },
          { name: t("breadcrumb.orders"), href: "/orders" },
          { name: order.orderNumber },
        ]}
        buttons={
          <Button_
            onClick={() => router.push(`/orders/edit/${order.id}`)}
            size="sm"
            icon={<Edit size={18} />}
            label={t("actions.edit")}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ═══════════════════ MAIN CONTENT — 9 cols ═══════════════════ */}
        <div className="lg:col-span-9 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-card !p-0 rounded-2xl border border-border/40 overflow-hidden"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06)",
            }}
          >
            {/* ── Order header ──────────────────────────────────────── */}
            <div className="px-6 pt-5 pb-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {t("fields.orderNumber")}
                </p>
                <p
                  className="text-3xl font-black tracking-tight leading-none"
                  style={{ fontFamily: "var(--mono, monospace)", color: P }}
                >
                  {order.orderNumber}
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <StatusBadge status={order.status} t={t} />
              </div>
            </div>

            {/* ── Meta grid: row 1 (shipping/finance) ───────────────── */}
            <div className="border-t border-border/25">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                <MetaCell label={t("fields.city")} icon={<MapPin size={11} />}>
                  <span className="text-sm font-bold text-foreground truncate block">
                    {order.city || "—"}
                  </span>
                </MetaCell>

                <MetaCell label={t("fields.address")} icon={<Home size={11} />}>
                  <span className="text-sm font-bold text-foreground truncate block">
                    {order.address || "—"}
                  </span>
                </MetaCell>

                <MetaCell
                  label={t("details.shippingCost")}
                  icon={<Truck size={11} />}
                >
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {formatCurrency(order.shippingCost)}
                  </span>
                </MetaCell>

                <MetaCell
                  label={t("details.discount")}
                  icon={<Tag size={11} />}
                >
                  <span className="text-sm font-bold text-destructive tabular-nums">
                    -{formatCurrency(order.discount)}
                  </span>
                </MetaCell>

                {/* Hero: total */}
                <MetaCell
                  label={t("details.total")}
                  icon={<Wallet size={11} />}
                  hero
                >
                  <span
                    className="text-base font-black tabular-nums"
                    style={{ color: P, fontFamily: "var(--mono, monospace)" }}
                  >
                    {formatCurrency(order.finalTotal)}
                  </span>
                </MetaCell>
              </div>
            </div>

            {/* Row divider */}
            <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            {/* ── Meta grid: row 2 (payment/dates) ──────────────────── */}
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                <MetaCell
                  label={t("fields.paymentMethod")}
                  icon={<CreditCard size={11} />}
                >
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold leading-none"
                    style={{
                      background: S_10,
                      color: S,
                      border: `1px solid ${S_22}`,
                    }}
                  >
                    {t(`paymentMethods.${order.paymentMethod}`)}
                  </span>
                </MetaCell>

                <MetaCell
                  label={t("fields.paymentStatus")}
                  icon={<ShieldCheck size={11} />}
                >
                  <StatusBadge
                    status={{
                      name: t(`paymentStatuses.${order.paymentStatus}`),
                    }}
                    t={t}
                  />
                </MetaCell>

                <MetaCell
                  label={t("fields.notes")}
                  icon={<StickyNote size={11} />}
                >
                  <span className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                    {order.notes || "—"}
                  </span>
                </MetaCell>

                <MetaCell
                  label={t("details.createdAt")}
                  icon={<CalendarPlus size={11} />}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: P }}
                    />
                    {formatDate(order.created_at)}
                  </span>
                </MetaCell>

                <MetaCell
                  label={t("details.updatedAt")}
                  icon={<CalendarClock size={11} />}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/25" />
                    {formatDate(order.updated_at)}
                  </span>
                </MetaCell>
              </div>
            </div>

            {/* ── Order items table ──────────────────────────────────── */}
            <div className="border-t border-border/25 p-5 space-y-5">
              <SectionLabel icon={Package}>
                {t("details.orderItems")}
              </SectionLabel>

              <div className="rounded-2xl border border-border/35 overflow-hidden">
                <table className="w-full">
                  <thead>
                    {/* Accent bar row */}
                    <tr>
                      <th colSpan={5} className="p-0 h-0 leading-none">
                        <AccentBar />
                      </th>
                    </tr>
                    <tr style={{ background: P_06 }}>
                      {[
                        {
                          key: "product",
                          label: t("details.product"),
                          cls: "text-start",
                        },
                        {
                          key: "variant",
                          label: t("details.variant"),
                          cls: "text-start",
                        },
                        {
                          key: "quantity",
                          label: t("details.quantity"),
                          cls: "text-center",
                        },
                        {
                          key: "unitPrice",
                          label: t("details.unitPrice"),
                          cls: "text-end",
                        },
                        {
                          key: "lineTotal",
                          label: t("details.lineTotal"),
                          cls: "text-end",
                        },
                      ].map(({ key, label, cls }) => (
                        <th
                          key={key}
                          className={cn(
                            "py-3 px-4 text-[10px] font-black uppercase tracking-widest",
                            "text-[var(--primary)]/60",
                            cls,
                          )}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={cn(
                          "group border-t border-border/20 transition-colors duration-150",
                          "hover:bg-[var(--primary)]/[0.025]",
                          idx % 2 !== 0 && "bg-muted/[0.035]",
                        )}
                      >
                        {/* Product */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 group-hover:scale-105"
                              style={{
                                background: P_10,
                                borderColor: P_20,
                              }}
                            >
                              <Package size={13} style={{ color: P }} />
                            </div>
                            <span
                              className="text-xs font-bold text-foreground leading-tight"
                              style={{ fontFamily: "var(--mono, monospace)" }}
                            >
                              {item.variant?.product?.name ||
                                t("details.unknownProduct")}
                            </span>
                          </div>
                        </td>

                        {/* Variant */}
                        <td className="py-3 px-4">
                          {item.variant?.name ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border border-border/40 text-muted-foreground bg-muted/30">
                              {item.variant.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/35">
                              —
                            </span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black tabular-nums"
                            style={{ background: P_10, color: P }}
                          >
                            {item.quantity}
                          </span>
                        </td>

                        {/* Unit price */}
                        <td className="py-3 px-4 text-end">
                          <span
                            className="text-xs font-medium text-muted-foreground tabular-nums"
                            style={{ fontFamily: "var(--mono, monospace)" }}
                          >
                            {formatCurrency(item.unitPrice)}
                          </span>
                        </td>

                        {/* Line total */}
                        <td className="py-3 px-4 text-end">
                          <span
                            className="text-xs font-black text-foreground tabular-nums"
                            style={{ fontFamily: "var(--mono, monospace)" }}
                          >
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Summary ─────────────────────────────────────────── */}
              <div className="flex justify-end">
                <div className="w-full max-w-[280px] rounded-2xl border border-border/35 overflow-hidden">
                  {[
                    {
                      label: t("details.subtotal"),
                      value: formatCurrency(order.productsTotal),
                    },
                    {
                      label: t("details.shippingCost"),
                      value: formatCurrency(order.shippingCost),
                    },
                    order.discount > 0 && {
                      label: t("details.discount"),
                      value: `-${formatCurrency(order.discount)}`,
                      valueClass: "text-destructive",
                    },
                    order.deposit > 0 && {
                      label: t("details.deposit"),
                      value: formatCurrency(order.deposit),
                      valueClass: "text-[var(--secondary,#ffb703)]",
                    },
                  ]
                    .filter(Boolean)
                    .map(({ label, value, valueClass }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-border/25"
                      >
                        <span className="text-xs text-muted-foreground">
                          {label}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold tabular-nums text-foreground",
                            valueClass,
                          )}
                        >
                          {value}
                        </span>
                      </div>
                    ))}

                  {/* Total hero */}
                  <div className="relative flex items-center justify-between px-4 py-4 overflow-hidden">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${P_10}, ${S_10})`,
                      }}
                    />
                    <AccentBar className="absolute inset-x-0 top-0" />
                    <span className="relative text-sm font-bold text-foreground">
                      {t("details.total")}
                    </span>
                    <span
                      className="relative text-lg font-black tabular-nums"
                      style={{ color: P, fontFamily: "var(--mono, monospace)" }}
                    >
                      {formatCurrency(order.finalTotal)}
                    </span>
                  </div>
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

        {/* ═══════════════════ SIDEBAR — 3 cols ════════════════════════ */}
        <div className="lg:col-span-3 space-y-4">
          {/* Customer Info */}
          <SideCard
            title={t("details.customerInfo")}
            icon={User}
            delay={0.06}
            accent
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                style={{
                  background: P_10,
                  color: P,
                  border: `1px solid ${P_20}`,
                }}
              >
                {order.items?.length || 0} {t("details.orderItems")}
              </span>
            </div>
            <div className="space-y-0">
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
                icon={Building2}
                label={t("fields.city")}
                value={order.city}
              />
              {order.area && (
                <InfoRow
                  icon={MapPin}
                  label={t("fields.area")}
                  value={order.area}
                />
              )}
              {order.landmark && (
                <InfoRow
                  icon={Landmark}
                  label={t("fields.landmark")}
                  value={order.landmark}
                />
              )}
            </div>
          </SideCard>

          {/* Shipping Info */}
          {order.shippingCompany && (
            <SideCard
              title={t("details.shippingInfo")}
              icon={Truck}
              delay={0.09}
            >
              <div className="space-y-0">
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
            </SideCard>
          )}

          {/* Store Info */}
          {order.store && (
            <SideCard title={t("details.storeInfo")} icon={Store} delay={0.11}>
              <div className="space-y-0">
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
            </SideCard>
          )}

          {/* Assigned Employee */}
          {order.assignments?.length > 0 && (
            <SideCard
              title={t("details.assignedEmployee")}
              icon={User}
              delay={0.13}
            >
              {order.assignments
                .filter((a) => a.isAssignmentActive)
                .map((assignment) => (
                  <div key={assignment.id} className="space-y-3">
                    {/* Employee chip */}
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ background: P_06, borderColor: P_20 }}
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
                          {assignment.employee?.name ||
                            t("details.unknownEmployee")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Retry stats */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: t("details.retriesUsed"),
                          val: assignment.retriesUsed,
                        },
                        {
                          label: t("details.maxRetries"),
                          val: assignment.maxRetriesAtAssignment,
                        },
                      ].map(({ label, val }) => (
                        <div
                          key={label}
                          className="rounded-xl p-3 text-center border"
                          style={{ background: P_06, borderColor: P_20 }}
                        >
                          <p
                            className="text-xl font-black"
                            style={{ color: P }}
                          >
                            {val}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </SideCard>
          )}

          {/* Status History Timeline */}
          {order.statusHistory?.length > 0 && (
            <SideCard
              title={t("details.statusHistory")}
              icon={History}
              delay={0.15}
            >
              <div className="space-y-0 max-h-[520px] overflow-y-auto -mx-1 px-1">
                {order.statusHistory
                  .sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at),
                  )
                  .map((history, idx, arr) => {
                    const isFirst = idx === 0;
                    const isLast = idx === arr.length - 1;
                    return (
                      <div key={history.id} className="relative flex gap-3">
                        {/* Track */}
                        <div className="relative flex flex-col items-center pt-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full z-10 shrink-0 transition-all duration-200"
                            style={{
                              background: isFirst ? P : "var(--border)",
                              boxShadow: isFirst ? `0 0 0 3px ${P_15}` : "none",
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
                          <p
                            className="text-xs font-bold mb-1 leading-snug"
                            style={{ color: isFirst ? P : "var(--foreground)" }}
                          >
                            {history.fromStatus?.system
                              ? t(`statuses.${history.fromStatus.code}`)
                              : history.fromStatus?.name}
                            {" → "}
                            {history.toStatus?.system
                              ? t(`statuses.${history.toStatus.code}`)
                              : history.toStatus?.name}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                            <Clock size={9} />
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
function ReplacementInfoCard({
  replacementOrder,
  replacement,
  formatCurrency,
  formatDate,
  router,
}) {
  const tR = useTranslations("CreateReplacement");
  const t = useTranslations("orders");

  const originalOrder = replacement?.originalOrder;
  const bridgeItems = replacement?.items ?? [];
  const returnImages = replacement?.returnImages ?? [];

  const oldTotal = originalOrder?.finalTotal ?? originalOrder?.total ?? 0;
  const newTotal = replacementOrder?.finalTotal ?? replacementOrder?.total ?? 0;
  const totalDiff = newTotal - oldTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-card rounded-2xl border overflow-hidden"
      style={{ borderColor: P_25, boxShadow: `0 4px 24px ${P_15}` }}
    >
      <AccentBar />

      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4 border-b"
        style={{ background: P_06, borderColor: P_20 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: P_15, border: `1px solid ${P_25}` }}
          >
            <ArrowLeftRight size={15} style={{ color: P }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: P }}>
              {t("replacement.cardTitle")}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("replacement.cardSubtitle")}
            </p>
          </div>
        </div>
        {replacement.reason && (
          <span
            className="text-[10px] font-bold px-3 py-1.5 rounded-xl shrink-0"
            style={{ background: P_10, color: P, border: `1px solid ${P_25}` }}
          >
            {replacement.reason}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Original order */}
        {originalOrder && (
          <div className="rounded-2xl border border-border/35 bg-muted/20 p-4 space-y-4">
            <p
              className="text-[9px] font-black uppercase tracking-[2px]"
              style={{ color: P }}
            >
              {t("replacement.originalOrder")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  icon: Hash,
                  label: t("replacement.orderNumber"),
                  content: (
                    <button
                      onClick={() => router.push(`/orders/${originalOrder.id}`)}
                      className="text-xs font-bold hover:underline flex items-center gap-1 mt-0.5"
                      style={{ color: P, fontFamily: "var(--mono, monospace)" }}
                    >
                      {originalOrder.orderNumber} <ExternalLink size={9} />
                    </button>
                  ),
                },
                {
                  icon: User,
                  label: t("replacement.customer"),
                  value: originalOrder.customerName,
                },
                {
                  icon: DollarSign,
                  label: t("replacement.originalTotal"),
                  value: formatCurrency(oldTotal),
                },
                {
                  icon: Calendar,
                  label: t("replacement.originalDate"),
                  value: formatDate(originalOrder.created_at),
                },
              ].map(({ icon: Icon, label, value, content }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon
                    size={11}
                    className="mt-0.5 shrink-0"
                    style={{ color: P }}
                  />
                  <div className="min-w-0">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                      {label}
                    </p>
                    {content || (
                      <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                        {value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price diff pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
              >
                <span className="text-[9px] text-muted-foreground">
                  {t("replacement.oldTotal")}
                </span>
                <span className="text-xs font-black text-foreground">
                  {formatCurrency(oldTotal)}
                </span>
              </div>

              <ChevronRight size={12} className="text-muted-foreground/40" />

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                style={{ background: P_10, borderColor: P_20 }}
              >
                <span className="text-[9px] text-muted-foreground">
                  {t("replacement.newTotal")}
                </span>
                <span className="text-xs font-black" style={{ color: P }}>
                  {formatCurrency(newTotal)}
                </span>
              </div>

              {totalDiff !== 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                  style={{
                    background:
                      totalDiff > 0
                        ? "rgba(239,68,68,0.06)"
                        : "rgba(16,185,129,0.06)",
                    borderColor:
                      totalDiff > 0
                        ? "rgba(239,68,68,0.2)"
                        : "rgba(16,185,129,0.2)",
                  }}
                >
                  {totalDiff > 0 ? (
                    <TrendingUp size={11} style={{ color: "#ef4444" }} />
                  ) : (
                    <TrendingDown size={11} style={{ color: "#10b981" }} />
                  )}
                  <span className="text-[9px] text-muted-foreground">
                    {t("replacement.priceDiff")}
                  </span>
                  <span
                    className="text-xs font-black"
                    style={{ color: totalDiff > 0 ? "#ef4444" : "#10b981" }}
                  >
                    {totalDiff > 0 ? "+" : ""}
                    {formatCurrency(totalDiff)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items table */}
        {bridgeItems.length > 0 && (
          <div className="space-y-3">
            <p
              className="text-[9px] font-black uppercase tracking-[2px]"
              style={{ color: P }}
            >
              {t("replacement.replacedItems")} ({bridgeItems.length})
            </p>
            <div className="rounded-2xl border border-border/35 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th colSpan={6} className="p-0 h-0 leading-none">
                        <AccentBar />
                      </th>
                    </tr>
                    <tr
                      style={{
                        background: P_06,
                        borderBottom: `1px solid ${P_20}`,
                      }}
                    >
                      {[
                        t("replacement.table.originalProduct"),
                        t("replacement.table.newProduct"),
                        t("replacement.table.qty"),
                        t("replacement.table.oldPrice"),
                        t("replacement.table.newPrice"),
                        t("replacement.table.diff"),
                      ].map((h) => (
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
                        (roi) => roi.variantId === item.newVariantId,
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
                            idx % 2 !== 0 && "bg-muted/[0.035]",
                          )}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {origProduct?.mainImage ? (
                                <img
                                  src={avatarSrc(origProduct.mainImage)}
                                  className="w-7 h-7 rounded-xl object-cover border border-border/40 shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                  style={{
                                    background: P_10,
                                    border: `1px solid ${P_20}`,
                                  }}
                                >
                                  <Package size={11} style={{ color: P }} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-foreground line-clamp-1">
                                  {origProduct?.name || "—"}
                                </p>
                                {origItem?.variant?.sku && (
                                  <p className="text-[9px] text-muted-foreground font-mono">
                                    {origItem.variant.sku}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {newProduct?.mainImage ? (
                                <img
                                  src={avatarSrc(newProduct.mainImage)}
                                  className="w-7 h-7 rounded-xl object-cover shrink-0"
                                  style={{ border: `1px solid ${P_25}` }}
                                />
                              ) : (
                                <div
                                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                  style={{
                                    background: P_10,
                                    border: `1px solid ${P_20}`,
                                  }}
                                >
                                  <Package size={11} style={{ color: P }} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-foreground line-clamp-1">
                                  {newProduct?.name || "—"}
                                </p>
                                {newVariant?.sku && (
                                  <p className="text-[9px] text-muted-foreground font-mono">
                                    {newVariant.sku}
                                  </p>
                                )}
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
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatCurrency(oldPrice)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-[10px] font-bold text-foreground font-mono">
                              {formatCurrency(newPrice)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className="text-[10px] font-black font-mono"
                              style={{
                                color:
                                  lineDiff > 0
                                    ? "#ef4444"
                                    : lineDiff < 0
                                      ? "#10b981"
                                      : "var(--muted-foreground)",
                              }}
                            >
                              {lineDiff > 0 ? "+" : ""}
                              {formatCurrency(lineDiff)}
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
          <div className="space-y-3">
            <p
              className="text-[9px] font-black uppercase tracking-[2px] flex items-center gap-1.5"
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
                  className="aspect-square rounded-xl overflow-hidden border border-border/40 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-[var(--primary)]/30"
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
  return (
    <div className={cn("rounded-xl bg-muted/50 animate-pulse", className)} />
  );
}

function BannerSkeleton({ cols = 5 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-[1px] border-t border-b border-border/25">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5 px-4 py-4">
          <Bone className="h-2 w-12" />
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
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full bg-muted/50 animate-pulse shrink-0",
            isFirst && "ring-4 ring-muted/30",
          )}
        />
        {!isLast && (
          <div className="w-px flex-1 bg-border/30 mt-1 min-h-[32px]" />
        )}
      </div>
      <div className="flex-1 pb-4 space-y-1.5">
        <Bone className="h-2.5 w-24" />
        <Bone className="h-3 w-36" />
        <Bone className="h-2 w-16" />
      </div>
    </div>
  );
}

export function OrderDetailsPageSkeleton() {
  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2">
        <Bone className="h-3 w-14" />
        <Bone className="h-3 w-3 rounded-full" />
        <Bone className="h-3 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main */}
        <div className="lg:col-span-9">
          <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
            {/* Accent bar */}
            <div className="h-[2.5px] bg-muted/40 animate-pulse" />
            {/* Header */}
            <div className="px-6 pt-5 pb-5 flex items-start justify-between">
              <div className="space-y-2">
                <Bone className="h-2.5 w-20" />
                <Bone className="h-8 w-36" />
              </div>
              <Bone className="h-7 w-24 rounded-xl" />
            </div>
            <BannerSkeleton cols={5} />
            <div className="mx-5 h-px bg-muted/30" />
            <BannerSkeleton cols={5} />
            {/* Table */}
            <div className="p-5 border-t border-border/20">
              <Bone className="h-3 w-28 mb-5" />
              <div className="rounded-2xl border border-border/30 overflow-hidden">
                <div className="h-[2.5px] bg-muted/40 animate-pulse" />
                <div className="bg-muted/10">
                  <div className="flex gap-4 px-4 py-3">
                    {[80, 60, 40, 60, 60].map((w, i) => (
                      <Bone
                        key={i}
                        className={`h-2.5 w-${w}`}
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                </div>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 border-t border-border/20",
                      i % 2 !== 0 && "bg-muted/[0.03]",
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Bone className="w-8 h-8 rounded-xl shrink-0" />
                      <Bone className="h-3 w-28" />
                    </div>
                    <Bone className="h-5 w-16 rounded-lg" />
                    <Bone className="h-7 w-7 rounded-lg mx-auto" />
                    <Bone className="h-3 w-16" />
                    <Bone className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border/40 overflow-hidden"
            >
              <div className="h-[2.5px] bg-muted/40 animate-pulse" />
              <div className="px-4 py-3 border-b border-border/25 flex items-center gap-2">
                <Bone className="w-7 h-7 rounded-xl" />
                <Bone className="h-3 w-24" />
              </div>
              <div className="p-4 space-y-0">
                {[0, 1, 2, 3].map((j) => (
                  <InfoRowSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
          <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
            <div className="h-[2.5px] bg-muted/40 animate-pulse" />
            <div className="px-4 py-3 border-b border-border/25 flex items-center gap-2">
              <Bone className="w-7 h-7 rounded-xl" />
              <Bone className="h-3 w-24" />
            </div>
            <div className="p-4">
              {[0, 1, 2, 3].map((i, _, arr) => (
                <TimelineItemSkeleton
                  key={i}
                  isFirst={i === 0}
                  isLast={i === arr.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
