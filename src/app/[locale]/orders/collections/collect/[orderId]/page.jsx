"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Loader2,
  User,
  Phone,
  MapPin,
  Package,
  Calendar,
  CreditCard,
  Truck,
  CircleDollarSign,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Banknote,
  Building2,
  Smartphone,
  ShoppingBag,
  Hash,
  FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import api from "@/utils/api";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";
import Flatpickr from "react-flatpickr";

import PageHeader from "@/components/atoms/Pageheader";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import DateRangePicker from "@/components/atoms/DateRangePicker";

// ── Payment Sources ───────────────────────────────────────────────────────────

export const PaymentSource = Object.freeze({
  VISA: "visa",
  BANK: "bank",
  CASH: "cash",
  OTHER: "other",
  VODAFONE_CASH: "vodafone_cash",
  ORANGE_CASH: "orange_cash",
  ETISALAT_CASH: "etisalat_cash",
  WE_PAY: "we_pay",
  INSTA: "insta",
  FAWRY: "fawry",
  AMAN: "aman",
  MEEZA: "meeza",
  VALU: "valu",
  SYMPL: "sympl",
  TABBY: "tabby",
  TAMARA: "tamara",
  SHIPPING_COMPANY: "shipping_company",
  OFFICE_PICKUP: "office_pickup",
});

const PaymentSourceMeta = {
  visa: { icon: CreditCard, color: "#2563EB" },
  bank: { icon: Building2, color: "#0891B2" },
  cash: { icon: Banknote, color: "#059669" },
  vodafone_cash: { icon: Smartphone, color: "#DC2626" },
  orange_cash: { icon: Smartphone, color: "#EA580C" },
  etisalat_cash: { icon: Smartphone, color: "#16A34A" },
  fawry: { icon: ShoppingBag, color: "var(--primary)" },
  aman: { icon: ShoppingBag, color: "#7C3AED" },
  meeza: { icon: CreditCard, color: "#BE185D" },
  other: { icon: Wallet, color: "#6B7280" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────



function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Field Group ───────────────────────────────────────────────────────────────

function FieldGroup({ label, required, error, children, icon: Icon }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-[var(--muted-foreground)]" />}
        <Label className="text-[10px] font-bold text-[var(--muted-foreground)] tracking-[0.15em] uppercase">
          {label}
          {required && (
            <span className="text-[var(--destructive)] ml-0.5">*</span>
          )}
        </Label>
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-[var(--destructive)] flex items-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-[var(--destructive)] inline-block" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const FIELD_CLS =
  "h-[40px] rounded-xl border-[var(--border)]  text-[var(--foreground)] " +
  "placeholder:text-[var(--muted-foreground)] " +
  "focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]/50 transition-all";

// ── Payment Source Picker ─────────────── ──────────────────────────────────────

function PaymentSourcePicker({ value, onChange, tCollect }) {
  const sources = ["cash", "visa", "bank", "other"];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {sources.map((src) => {
        const meta = PaymentSourceMeta[src] || {
          icon: Wallet,
          color: "#6B7280",
        };
        const Icon = meta.icon;
        const sel = value === src;
        return (
          <button
            key={src}
            type="button"
            onClick={() => onChange(src)}
            className={cn(
              "relative flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all duration-200 text-left active:scale-[0.96]",
              !sel &&
              "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30",
            )}
            style={
              sel
                ? {
                  borderColor: meta.color + "50",
                  background: meta.color + "10",
                  boxShadow: `0 2px 12px ${meta.color}20`,
                }
                : {}
            }
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: sel ? meta.color + "20" : "var(--muted)" }}
            >
              <Icon
                size={13}
                style={{ color: sel ? meta.color : "var(--muted-foreground)" }}
              />
            </div>
            <span
              className="text-[11px] font-semibold truncate"
              style={{ color: sel ? meta.color : "var(--muted-foreground)" }}
            >
              {tCollect(`collectionMethods.${src}`)}
            </span>
            {sel && (
              <motion.div
                className="absolute top-1.5 right-1.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <CheckCircle2 size={12} style={{ color: meta.color }} />
              </motion.div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Order Timeline ────────────────────────────────────────────────────────────

function OrderTimeline({ deliveredAt, t }) {
  const steps = [
    { labelKey: "timeline.placed", done: true, icon: Package, active: false },
    {
      labelKey: "timeline.delivered",
      done: !!deliveredAt,
      icon: Truck,
      active: false,
      sub: deliveredAt ? formatDate(deliveredAt) : t("timeline.pending"),
    },
    {
      labelKey: "timeline.collection",
      done: false,
      icon: Wallet,
      active: true,
    },
  ];
  return (
    <div className="flex items-center mt-5">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <React.Fragment key={step.labelKey}>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={
                  step.done
                    ? {
                      background: "linear-gradient(135deg,#10b981,#059669)",
                      boxShadow: "0 4px 14px var(--primary)",
                    }
                    : step.active
                      ? {
                        background: "linear-gradient(135deg,var(--primary),var(--secondary))",
                        boxShadow: "0 4px 14px var(--primary)",
                      }
                      : { background: "var(--muted)" }
                }
              >
                <Icon
                  size={15}
                  style={{
                    color:
                      step.done || step.active
                        ? "#fff"
                        : "var(--muted-foreground)",
                  }}
                />
              </div>
              <span
                className="text-[10px] font-bold leading-tight text-center"
                style={{
                  color: step.done
                    ? "#10b981"
                    : step.active
                      ? "var(--primary)"
                      : "var(--muted-foreground)",
                }}
              >
                {t(step.labelKey)}
              </span>
              {step.sub && (
                <span
                  className="text-[9px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {step.sub}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-1 mb-5"
                style={{
                  background: step.done
                    ? "linear-gradient(90deg,#10b981,#10b98130)"
                    : "var(--border)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Hero Order Card ───────────────────────────────────────────────────────────

function OrderHeroCard({ order, t }) {
  const infoItems = [
    { icon: User, labelKey: "info.customer", value: order.customerName },
    { icon: Phone, labelKey: "info.phone", value: order.phoneNumber },
    { icon: MapPin, labelKey: "info.city", value: order.city },
    {
      icon: Calendar,
      labelKey: "info.delivered",
      value: formatDate(order.deliveredAt),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden main-card"
    >
      {/* Order number */}
      <div
        className=" mb-6 pb-2 "
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,var(--primary),var(--secondary))",
              boxShadow: "0 4px 14px var(--primary)",
            }}
          >
            <Package size={17} className="text-white" />
          </div>

          <div className="flex flex-col ">
            <p
              className="text-[9px] tracking-[0.25em] font-bold uppercase "
              style={{ color: "var(--primary)" }}
            >
              {t("fields.orderNumber")}
            </p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[22px] font-black tracking-tight text-[var(--foreground)]">
                #{order.orderNumber}
              </span>
              <Badge
                className="text-[10px] font-bold border px-2.5 py-0.5 rounded-full bg-primary/10 border-primary/30"
                style={{
                  color: "var(--primary)",
                }}
              >
                {order.status?.name || t("status.delivered")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Customer grid */}
      <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
        {infoItems.map(({ icon: Icon, labelKey, value }) => (
          <div
            key={labelKey}
            className="flex items-center gap-2.5 p-2.5 rounded-xl"
            style={{
              background: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10"
            >
              <Icon size={12} style={{ color: "var(--primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest font-bold mb-0.5 text-[var(--muted-foreground)]">
                {t(labelKey)}
              </p>
              <p className="text-[13px] font-semibold text-[var(--foreground)] truncate">
                {value || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Address */}
      {order.address && (
        <div
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl mb-4"
          style={{
            background: "var(--muted)",
            border: "1px solid var(--border)",
          }}
        >
          <MapPin
            size={12}
            className="mt-0.5 flex-shrink-0 text-primary"
          />
          <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {order.address}
          </p>
        </div>
      )}

      <OrderTimeline deliveredAt={order.deliveredAt} t={t} />
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CollectOrderPage() {
  const tCollect = useTranslations("orderCollection");
  const t = useTranslations("collectOrder");
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId;
  const { formatCurrency, shippingCompanies, isShippingLoading, currency } = usePlatformSettings();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [order, setOrder] = useState(null);

  const schema = yup.object({
    shippingCompanyId: yup
      .string()
      .required(t("validation.shippingCompanyRequired")),
    collectionDate: yup.date().required(t("validation.collectionDateRequired")),
    source: yup.string().required(t("validation.sourceRequired")),
    // currency: yup.string().required(t("validation.currencyRequired")),
    amount: yup
      .number()
      .required(t("validation.amountRequired"))
      .min(0.01, t("validation.amountMin")),
    notes: yup.string().optional(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shippingCompanyId: "",
      collectionDate: new Date(),
      source: "",
      // currency: "EGP",
      amount: 0,
      notes: "",
    },
  });

  const watchedAmount = watch("amount");

  useEffect(() => {
    if (!orderId) {
      toast.error(t("errors.invalidOrderId"));
      router.push("/orders/collections");
      return;
    }

    (async () => {
      try {
        setInitialLoading(true);

        const orderRes = await api.get(`/orders/${orderId}`);
        const orderData = orderRes.data;
        setOrder(orderData);

      } catch (error) {
        toast.error(t("errors.fetchFailed"));
        router.push("/orders/collections");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [orderId, router, t, setValue]);


  useEffect(() => {
    if (!order || isShippingLoading || shippingCompanies.length === 0) return;

    if (order.shippingCompany?.id) {

      setValue("shippingCompanyId", String(order.shippingCompany.id));
    } else if (shippingCompanies.length === 1) {

      const defaultId = shippingCompanies[0].providerId || shippingCompanies[0].id;
      setValue("shippingCompanyId", String(defaultId));
    }
  }, [order, shippingCompanies, isShippingLoading, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await api.post("/collections", {
        orderId: orderId,
        shippingCompanyId: data.shippingCompanyId,
        source: data.source,
        // currency: data.currency,
        amount: Number(data.amount),
        notes: data.notes || undefined,
      });
      toast.success(t("messages.success"));
      router.push("/orders/collections");
    } catch (err) {
      toast.error(err?.response?.data?.message || t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };
  // ── Loading / empty ───────────────────────────────────────────────────────
  if (initialLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)]/15" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--primary)] animate-spin" />
          </div>
          <p className="text-sm font-semibold text-[var(--muted-foreground)]">
            {t("messages.loading")}
          </p>
        </motion.div>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Package
            size={52}
            className="mx-auto mb-3 text-[var(--muted-foreground)]"
          />
          <p className="text-[var(--muted-foreground)]">
            {t("errors.orderNotFound")}
          </p>
        </div>
      </div>
    );

  const remaining = (order.finalTotal || 0) - (order.collectedAmount || 0);

  // ── Stats for PageHeader ──────────────────────────────────────────────────
  const pageStats = [
    {
      id: 1,
      name: t("fields.orderTotal"),
      value: formatCurrency(order.finalTotal),
      icon: Wallet,
      color: "var(--primary)",
      sortOrder: 1,
    },
    {
      id: 2,
      name: t("fields.collectedAmount"),
      value: formatCurrency(order.collectedAmount),
      icon: CircleDollarSign,
      color: "#10b981",
      sortOrder: 2,
    },
    {
      id: 3,
      name: t("fields.shippingCost"),
      value: formatCurrency(order.shippingCost),
      icon: Truck,
      color: "var(--secondary)",
      sortOrder: 3,
    },
    {
      id: 4,
      name: t("stats.remainingBalance"),
      value: formatCurrency(remaining),
      icon: Banknote,
      color: remaining > 0 ? "var(--primary)" : "#10b981",
      sortOrder: 4,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen container flex flex-col gap-8">
      <div className="pb-16 pt-6">
        <PageHeader
          breadcrumbs={[
            { name: t("breadcrumb.home"), href: "/dashboard" },
            { name: t("breadcrumb.title") },
          ]}
          buttons={
            <Button_
              onClick={handleSubmit(onSubmit)}
              size="sm"
              label={loading ? t("actions.saving") : t("actions.save")}
              variant="solid"
              disabled={loading}
              icon={
                loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )
              }
            />
          }
          stats={pageStats}
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-5 items-start">
            {/* ═══════════════ LEFT — 3 cols ═══════════════ */}
            <div className="lg:col-span-3 space-y-4">
              <OrderHeroCard order={order} t={t} />
            </div>

            {/* ═══════════════ RIGHT — 3 cols ═══════════════ */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.08,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="lg:col-span-3 main-card overflow-hidden"
            >
              {/* Form header */}
              <div
                className=" pb-4 "
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,var(--primary),var(--secondary))",
                      boxShadow: "0 4px 14px var(--primary)",
                    }}
                  >
                    <CreditCard size={17} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-[var(--foreground)]">
                      {t("sections.collectionForm")}
                    </h2>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {t("sections.collectionFormSub")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-5">
                {/* Shipping company */}
                <div className="grid grid-cols-2 items-center gap-6 w-full ">
                  <FieldGroup
                    label={t("fields.shippingCompany")}
                    required
                    icon={Truck}
                    error={errors.shippingCompanyId?.message}
                  >
                    <Controller
                      name="shippingCompanyId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger className={FIELD_CLS}>
                            <SelectValue
                              placeholder={t("placeholders.shippingCompany")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {shippingCompanies.map((c) => (
                              <SelectItem
                                key={c.providerId}
                                value={String(c.providerId)}
                              >
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FieldGroup>

                  {/* Collection date */}
                  <FieldGroup
                    label={t("fields.collectionDate")}
                    required
                    icon={Calendar}
                    error={errors.collectionDate?.message}
                  >
                    <Controller
                      name="collectionDate"
                      control={control}
                      render={({ field }) => (
                        <DateRangePicker
                          mode="single"
                          value={field.value}
                          onChange={(date) => field.onChange(date)}
                          placeholder={t("placeholders.collectionDate")}
                          dataSize="default"
                          maxDate="today"
                        />
                      )}
                    />
                  </FieldGroup>
                </div>

                {/* Payment source picker */}
                <FieldGroup
                  label={t("fields.source")}
                  required
                  icon={Wallet}
                  error={errors.source?.message}
                >
                  <Controller
                    name="source"
                    control={control}
                    render={({ field }) => (
                      <PaymentSourcePicker
                        value={field.value}
                        onChange={field.onChange}
                        tCollect={tCollect}
                      />
                    )}
                  />
                </FieldGroup>

                {/* Currency + Amount */}
                <div className="grid grid-cols-1 gap-3">
                  {/* <div className="col-span-1">
                    <FieldGroup
                      label={t("fields.currency")}
                      required
                      error={errors.currency?.message}
                    >
                      <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FieldGroup>
                  </div> */}
                  <div className="col-span-1">
                    <FieldGroup
                      label={t("fields.amount")}
                      required
                      icon={Hash}
                      error={errors.amount?.message}
                    >
                      <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"

                            min="0.01"
                            placeholder={t("placeholders.amount")}
                            endIcon={
                              <span
                                className=" text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-xl bg-primary/10 border border-primary/30"
                                style={{
                                  color: "var(--primary)",
                                }}
                              >
                                {currency}
                              </span>
                            }
                          />
                        )}
                      />
                    </FieldGroup>
                  </div>
                </div>

                {/* Post-entry remaining hint */}
                <AnimatePresence>
                  {watchedAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl px-4 py-2.5 flex items-center justify-between bg-primary/10 border border-primary/30"
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        {t("hints.afterCollection")}
                      </span>
                      <span
                        className="text-xs font-black font-mono"
                        style={{
                          color:
                            remaining - watchedAmount <= 0
                              ? "#10b981"
                              : "var(--primary)",
                        }}
                      >
                        {formatCurrency(Math.max(0, remaining - watchedAmount))}{" "}
                        {t("hints.remaining")}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notes */}
                <FieldGroup label={t("fields.notes")} icon={FileText}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder={t("placeholders.notes")}
                      />
                    )}
                  />
                </FieldGroup>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}
