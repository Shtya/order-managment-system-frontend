"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Hash,
  Package,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Truck,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import Img from "@/components/atoms/Img";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ─────────────────────────────────────────────
   Section wrapper — matches app theme
───────────────────────────────────────────── */
export function Section({ title, icon: Icon, children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "main-card rounded-xl border border-border/60 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3  pb-6  border-b border-border/40">
        <div className="w-12 h-12 rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)] flex items-center justify-center shrink-0">
          <Icon size={25} className="text-[var(--primary)]" />
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className=" pt-6 ">{children}</div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Selected order details panel
───────────────────────────────────────────── */
function SelectedOrderDetails({ order, formatCurrency, showOrderLink = false }) {
  const t = useTranslations("CreateReplacement");

  const pills = [
    { icon: User, label: t("details.customerName"), value: order.customerName },
    { icon: Phone, label: t("details.phone"), value: order.phoneNumber },
    { icon: Mail, label: t("details.email"), value: order.email },
    { icon: MapPin, label: t("details.city"), value: order.city },
    { icon: MapPin, label: t("details.area"), value: order.area },
    { icon: Truck, label: t("details.shippingCompany"), value: order.shippingCompany?.name },
    { icon: BarChart3, label: t("details.total"), value: formatCurrency(order.finalTotal ?? order.total) },
    { icon: Calendar, label: t("details.createdAt"), value: formatDate(order.created_at) },
  ];

  const addressPill = {
    icon: MapPin,
    label: t("details.address"),
    value: order.address,
  };

  return (
    <div className="space-y-4">
      {/* ── Order link header ──────────────────────────────────── */}
      {showOrderLink && order?.id && (
        <div className="flex items-center justify-between rounded-xl main-card !py-3 !px-4 border border-border/50 bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[color-mix(in_oklab,var(--primary)_15%,transparent)] flex items-center justify-center shrink-0">
              <Hash size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
                Order Number
              </p>
              <p className="text-sm font-bold font-mono text-foreground leading-tight tracking-wide">
                {order.orderNumber || `#${String(order.id).slice(-6).toUpperCase()}`}
              </p>
            </div>
          </div>
          <Link
            href={`/orders/details/${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary/50 transition-colors duration-200"
          >
            <ExternalLink size={12} />
            View Order
          </Link>
        </div>
      )}

      {/* ── Info pills ─────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
        {pills.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="group flex items-start gap-2.5 rounded-xl main-card !py-3 !px-4 border border-border/50 hover:border-primary/30 hover:bg-[color-mix(in_oklab,var(--primary)_4%,var(--secondary))] transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] transition-colors duration-200">
              <Icon size={25} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-muted-foreground mb-0.5">
                {label}
              </p>
              <p
                title={value || "-"}
                className="text-sm font-bold text-foreground leading-tight"
              >
                {value || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Address (full width) ─────────────────────────────────── */}
      <div className="group flex items-start gap-2.5 rounded-xl main-card !py-3 !px-4 border border-border/50 hover:border-primary/30 hover:bg-[color-mix(in_oklab,var(--primary)_4%,var(--secondary))] transition-all duration-200">
        <div className="w-10 h-10 rounded-xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] transition-colors duration-200">
          <MapPin size={25} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-muted-foreground mb-0.5">
            {addressPill.label}
          </p>
          <p className="text-sm font-bold text-foreground leading-tight">
            {addressPill.value || "—"}
          </p>
        </div>
      </div>

      {/* ── Items table ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className=" !p-0 overflow-x-auto">
          <table className="w-full">
            <thead
              className={cn(
                "  bg-gray-100 dark:bg-slate-800 dark:from-slate-800/90 dark:via-slate-850/80 dark:to-slate-900/70  backdrop-blur-md border-b-2 border-gray-200 dark:border-slate-700",
              )}
            >
              <tr className="border-b border-border/30  ">
                {[
                  t("details.table.image"),
                  t("details.table.product"),
                  t("details.table.qty"),
                  t("details.table.unitPrice"),
                  t("details.table.total"),
                ].map((h) => (
                  <th
                    key={h}
                    className=" ltr:text-left rtl:text-right px-4 !py-4 text-[8px] font-bold text-muted-foreground tracking-wide uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => {
                const variant = item.variant;
                const product = variant?.product;
                const img = product?.mainImage;
                const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);

                return (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/20 last:border-0 hover:bg-[color-mix(in_oklab,var(--primary)_3%,transparent)] transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3">
                      {img ? (
                        <Img
                          src={img}
                          alt={product?.name}
                          className="!w-12 h-12 rounded-xl object-cover border border-border/40 shadow-sm group-hover:border-primary/30 transition-colors duration-150"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-secondary border border-border/40 flex items-center justify-center group-hover:border-primary/30 transition-colors duration-150">
                          <Package
                            size={14}
                            className="text-muted-foreground"
                          />
                        </div>
                      )}
                    </td>

                    {/* Product name + SKU */}
                    <td className=" px-4 py-3">
                      <div className="flex items-center gap-2 ">

                        <p className="text-sm font-semibold text-foreground text-nowrap leading-snug">
                          {product?.name || "—"}
                        </p>
                        {variant?.sku && (
                          <span className="inline-flex items-center text-nowrap gap-1 mt-1 text-[10px] text-muted-foreground font-mono bg-muted border border-border/50 rounded-xl px-1.5 py-0.5">
                            <Hash size={9} />
                            {variant.sku}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-primary text-[11px] font-bold border border-[color-mix(in_oklab,var(--primary)_20%,transparent)]">
                        ×{item.quantity}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold font-ar text-nowrap text-muted-foreground font-mono">
                        {formatCurrency(item.unitPrice)}
                      </span>
                    </td>

                    {/* Line total */}
                    <td className="px-4 py-3 text-right">
                      <span className=" text-sm font-ar text-nowrap font-bold text-primary font-mono">
                        {formatCurrency(lineTotal)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 1 — Order search + selection
   `status` and `hasReplacement` are optional so callers
   can search across any orders (pass undefined).
   Defaults keep the "delivered & no replacement" behaviour.
───────────────────────────────────────────── */
export function OrderSearchSection({
  errors,
  selectedOrder,
  onSelect,
  isEditMode = false,
  formatCurrency,
  status = "delivered",
  hasReplacement = false,
  showOrderLink = false,
}) {
  const t = useTranslations("CreateReplacement");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    if (isEditMode && selectedOrder?.orderNumber) {
      setQuery(selectedOrder.orderNumber);
    }
  }, [isEditMode, selectedOrder?.orderNumber]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (isEditMode) {
      setResults([]);
      setShowResults(false);
      return;
    }
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const params = {
          search: query.trim(),
          limit: 8,
          page: 1,
        };
        if (hasReplacement !== undefined) params.hasReplacement = hasReplacement;
        if (status !== undefined) params.status = status;
        const res = await api.get("/orders", { params });
        setResults(res.data?.records ?? []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query, status, hasReplacement, isEditMode]);

  const handleSelect = (order) => {
    justSelectedRef.current = true;
    onSelect(order);
    setQuery(order.orderNumber);
    setShowResults(false);
  };

  return (
    <Section
      title={t("sections.searchOrder")}
      icon={Search}
      delay={0}
      className="relative"
    >
      <div ref={wrapperRef} className="relative">
        {/* Search Field */}
        <div className="relative group">
          <div
            style={{
              position: "absolute",
              inset: -1,
              borderRadius: 16,
              background: focused
                ? "linear-gradient(135deg, var(--primary), var(--third))"
                : "transparent",
              opacity: focused ? 0.35 : 0,
              transition: "opacity 0.25s ease",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--card)",
              border: "1.5px solid",
              borderColor: focused ? "var(--primary)" : "var(--border)",
              borderRadius: 14,
              padding: "0 16px",
              height: 52,
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              boxShadow: focused
                ? "0 0 0 4px color-mix(in oklab, var(--primary) 12%, transparent), 0 4px 20px color-mix(in oklab, var(--primary) 8%, transparent)"
                : "0 1px 4px color-mix(in oklab, var(--foreground) 4%, transparent)",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: focused ? "var(--primary)" : "var(--muted-foreground)",
                transition: "color 0.2s ease",
                flexShrink: 0,
              }}
            >
              <Hash size={18} />
            </div>

            <input
              autoFocus
              value={query}
              onChange={(e) => {
                if (isEditMode) return;
                setQuery(e.target.value);
                if (selectedOrder) onSelect(null);
              }}
              onFocus={() => {
                setFocused(true);
                if (!isEditMode && results.length) setShowResults(true);
              }}
              onBlur={() => setFocused(false)}
              placeholder={t("placeholders.orderNumber")}
              readOnly={isEditMode}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--foreground)",
                letterSpacing: "0.03em",
              }}
            />

            {searching && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <Loader2
                  size={18}
                  className="animate-spin"
                  style={{ color: "var(--primary)" }}
                />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: 50,
                background: "var(--popover)",
                border: "1.5px solid var(--border)",
                borderRadius: 16,
                boxShadow:
                  "0 16px 48px color-mix(in oklab, var(--foreground) 12%, transparent), 0 4px 12px color-mix(in oklab, var(--foreground) 6%, transparent)",
                overflow: "hidden",
              }}
            >
              {/* Dropdown header */}
              <div
                style={{
                  padding: "10px 16px 8px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "var(--muted-foreground)",
                    textTransform: "uppercase",
                  }}
                >
                  {results.length} {t("labels.ordersFound") ?? "results found"}
                </span>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    boxShadow: "0 0 8px var(--primary)",
                    animation: "pulse 1.5s ease infinite",
                  }}
                />
              </div>

              {results.map((order, i) => (
                <motion.button
                  key={order.id}
                  type="button"
                  onClick={() => handleSelect(order)}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    width: "100%",
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 16px",
                    background:
                      selectedOrder?.id === order.id
                        ? "color-mix(in oklab, var(--primary) 8%, transparent)"
                        : "transparent",
                    borderBottom:
                      i < results.length - 1
                        ? "1px solid color-mix(in oklab, var(--border) 50%, transparent)"
                        : "none",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedOrder?.id !== order.id)
                      e.currentTarget.style.background = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      selectedOrder?.id === order.id
                        ? "color-mix(in oklab, var(--primary) 8%, transparent)"
                        : "transparent";
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background:
                          selectedOrder?.id === order.id
                            ? "color-mix(in oklab, var(--primary) 20%, transparent)"
                            : "color-mix(in oklab, var(--primary) 10%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border:
                          "1px solid color-mix(in oklab, var(--primary) 20%, transparent)",
                      }}
                    >
                      <Package size={16} style={{ color: "var(--primary)" }} />
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--primary)",
                          fontFamily: "monospace",
                          letterSpacing: "0.04em",
                          marginBottom: 2,
                        }}
                      >
                        {order.orderNumber}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {order.customerName}
                      </p>
                    </div>
                  </div>

                  {/* Price + date */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: 2,
                      }}
                    >
                      {formatCurrency(order.finalTotal ?? order.total)}
                    </p>
                    <p
                      style={{ fontSize: 11, color: "var(--muted-foreground)" }}
                    >
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* No results */}
          {showResults &&
            !searching &&
            results.length === 0 &&
            query.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "var(--popover)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 16,
                  boxShadow:
                    "0 16px 48px color-mix(in oklab, var(--foreground) 10%, transparent)",
                  padding: "32px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Search
                    size={18}
                    style={{ color: "var(--muted-foreground)" }}
                  />
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--foreground)",
                    marginBottom: 4,
                  }}
                >
                  {t("noOrdersFound")}
                </p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                  {t("noOrdersFoundHint") ?? "Try a different order number"}
                </p>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Selected order card */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: 16 }}
          >
            {/* Divider with label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "var(--muted-foreground)",
                  textTransform: "uppercase",
                }}
              >
                {t("labels.selectedOrder") ?? "Selected Order"}
              </span>
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
            </div>
            <SelectedOrderDetails order={selectedOrder} formatCurrency={formatCurrency} showOrderLink={showOrderLink} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {errors.order && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--destructive)",
            marginTop: 8,
            padding: "6px 10px",
            borderRadius: 8,
            background:
              "color-mix(in oklab, var(--destructive) 8%, transparent)",
            border:
              "1px solid color-mix(in oklab, var(--destructive) 20%, transparent)",
          }}
        >
          <AlertCircle size={12} />
          {errors.order}
        </motion.p>
      )}
    </Section>
  );
}

export default OrderSearchSection;
