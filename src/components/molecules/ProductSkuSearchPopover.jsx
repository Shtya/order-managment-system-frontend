"use client";

import React, { useEffect, useMemo, useRef, useState,useCallback } from "react";
import api from "@/utils/api";

import { useTranslations } from "next-intl";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  ChevronDown,
  Loader2,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ScanBarcode,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useDebounce } from "@/hook/useDebounce";
import { useOrdersSettings } from "@/hook/useOrdersSettings";

/* ─────────────────────────────────────────────────────────────────────────
   Utilities
───────────────────────────────────────────────────────────────────────── */

export function useAllocateBundlePrices() {
  const {calculateAvailableStock} = useOrdersSettings();
	const allocateBundlePrices = useCallback((bundle, bundleQty = 1) => {
		const items = bundle.items ?? [];
		const bundlePrice = Number(bundle.price ?? 0);
		const multiplier = Math.max(1, Number(bundleQty) || 1);

		const totalRegularValue = items.reduce(
			(sum, item) => sum + Number(item.variant?.price ?? 0) * Number(item.qty ?? 1),
			0
		);

		let isAllowed = true;

		const allocations = items.map((item) => {
			const variant = item.variant ?? {};
			const qty = Number(item.qty ?? 1);
			const totalQty = qty * multiplier;
			const variantPrice = Number(variant.price ?? 0);
			const allocatedTotal =
				totalRegularValue > 0
					? bundlePrice * ((variantPrice * qty) / totalRegularValue) * multiplier
					: 0;
			const allocatedUnitPrice = qty > 0 ? (bundlePrice * ((variantPrice * qty) / totalRegularValue)) : 0;

			const stockOnHand = Number(variant.stockOnHand ?? 0);
			const reserved = Number(variant.reserved ?? 0);
			const available = calculateAvailableStock(stockOnHand, reserved);
			const insufficientStock = totalQty > available;
			if (insufficientStock) isAllowed = false;

			return {
				id: variant.id,
        bundleId: bundle.id,
        bundleName: bundle.name,
				productId: variant.productId,
				label: variant.sku ? variant.sku : `#${variant.id}`,
				sku: variant.sku ?? null,
				key: variant.key ?? null,
				stockOnHand,
				reserved,
				price: Math.round(allocatedUnitPrice * 100) / 100,
				wholesalePrice: Number(variant.wholesalePrice ?? 0),
				unitCost: Number(variant.unitCost ?? 0),
				available,
				name: variant.productName ?? null,
				quantity: totalQty || 1,
				originalPrice: variantPrice,
				allocatedTotal: Math.round(allocatedTotal * 100) / 100,
				insufficientStock,
			};
		});

		return { allocations, isAllowed };
	}, [calculateAvailableStock]);

	return allocateBundlePrices;
}


function highlight(text, q) {
  if (!text) return text;
  const query = (q ?? "").trim();
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--primary)]/15 text-[var(--primary)] font-bold rounded px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   StockPill — compact, purposeful indicator
───────────────────────────────────────────────────────────────────────── */
function StockPill({ available, stockOnHand, t }) {
  const isOut = available === 0;
  const isLow = available < 10 && available > 0;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Primary status pill */}
      <motion.span
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border leading-none",
          isOut
            ? "bg-red-50 dark:bg-red-950/25 border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400"
            : isLow
              ? "bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400"
              : "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400"
        )}
      >
        {isOut ? (
          <XCircle className="w-3 h-3" />
        ) : isLow ? (
          <AlertCircle className="w-3 h-3" />
        ) : (
          <CheckCircle2 className="w-3 h-3" />
        )}
        <span className="tabular-nums">{available}</span>
        <span className="hidden sm:inline opacity-70">
          {isOut ? t("outOfStock") : isLow ? t("lowStock") : t("available")}
        </span>
      </motion.span>

      {/* Secondary: on-hand count */}
      <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-border/40 dark:bg-border/20 text-[11px] text-muted-foreground leading-none">
        <Package className="w-2.5 h-2.5" />
        <span className="tabular-nums">{stockOnHand}</span>
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Empty / Loading states
───────────────────────────────────────────────────────────────────────── */
function StateBlock({ icon: Icon, title, subtitle, spin }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-14 gap-4"
    >
      <div className="relative">
        {/* Soft halo */}
        <div className="absolute inset-0 rounded-2xl bg-[var(--primary)]/8 blur-xl scale-150" />
        <motion.div
          animate={spin ? { rotate: 360 } : { rotate: [0, -6, 6, 0] }}
          transition={
            spin
              ? { duration: 1.4, repeat: Infinity, ease: "linear" }
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
          className="relative w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center shadow-sm"
        >
          <Icon className="w-6 h-6 text-[var(--primary)]" />
        </motion.div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Result row
───────────────────────────────────────────────────────────────────────── */
function SkuRow({ sku, idx, isSelected, debounced, onSelect, t }) {
  return (
    <motion.div
      key={sku.id}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.18 }}
    >
      <div
        onClick={() => !isSelected && onSelect(sku)}
        className={cn(
          "group relative flex items-center gap-3 px-3.5 py-3 rounded-md border transition-all duration-200 cursor-pointer select-none",
          isSelected
            ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/15 cursor-not-allowed"
            : [
              "border-border/60 bg-background/60 hover:bg-[var(--primary)]/[0.03]",
              "hover:border-[var(--primary)]/40",
              "hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
            ]
        )}
      >
        {/* Left: icon */}
        <motion.div
          whileHover={!isSelected ? { rotate: 8, scale: 1.05 } : {}}
          transition={{ type: "spring", stiffness: 400 }}
          className={cn(
            "shrink-0 w-9 h-9 rounded-md border flex items-center justify-center transition-colors duration-200",
            isSelected
              ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
              : "bg-[var(--primary)]/8 border-[var(--primary)]/20 text-[var(--primary)] group-hover:bg-[var(--primary)]/15"
          )}
        >
          {isSelected ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <ScanBarcode className="w-4 h-4" />
          )}
        </motion.div>

        {/* Middle: label */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {highlight(sku?.sku || "—", debounced)}
          </p>
          {sku?.sku && sku?.name && (
            <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5 font-mono">
              {sku?.name || sku?.sku}
            </p>
          )}
        </div>

        {/* Right: stock + action */}
        <div className="flex items-center gap-2 shrink-0">
          <StockPill
            available={sku.available ?? 0}
            stockOnHand={sku.stockOnHand ?? 0}
            t={t}
          />

          <AnimatePresence mode="wait">
            {isSelected ? (
              <motion.span
                key="selected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold"
              >
                <CheckCircle2 className="w-3 h-3" />
                {t("selected")}
              </motion.span>
            ) : (
              <motion.div
                key="cta"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(sku);
                  }}
                  className={cn(
                    "h-7 px-3 text-[11px] font-semibold rounded-md gap-1.5",
                    "bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white",
                    "shadow-[0_1px_6px_rgba(0,0,0,0.12)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.18)]",
                    "transition-all duration-150"
                  )}
                >
                  {t("select")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hover left-edge accent */}
        <span
          aria-hidden
          className="pointer-events-none absolute start-0 top-3 bottom-3 w-[2.5px] rounded-full
            bg-gradient-to-b from-[var(--primary)] to-[var(--third,var(--secondary))]
            opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Bundle row
───────────────────────────────────────────────────────────────────────── */
function BundleRow({ bundle, idx, isSelected, debounced, onSelect, t, formatCurrency, expanded, onToggleExpand }) {
  const itemCount = bundle.items?.length ?? 0;
  const [bundleQty, setBundleQty] = useState(1);
  const allocateBundlePrices = useAllocateBundlePrices();
  const { allocations, isAllowed } = useMemo(() => {
    return allocateBundlePrices(bundle, bundleQty);
  }, [bundle, bundleQty, allocateBundlePrices]);

  return (
    <motion.div
      key={bundle.id}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.18 }}
      className={cn(
        "rounded-md border bg-background/60 overflow-hidden",
        isAllowed ? "border-border/60" : "border-red-200 dark:border-red-800/50"
      )}
    >
      {/* Main row */}
      <div
        onClick={() => !isSelected && isAllowed && onSelect(bundle)}
        className={cn(
          "group relative flex items-center gap-3 px-3.5 py-3 cursor-pointer select-none transition-all duration-200",
          isSelected
            ? "bg-emerald-50/60 dark:bg-emerald-950/15 cursor-not-allowed"
            : !isAllowed
              ? "bg-red-50/30 dark:bg-red-950/10 cursor-not-allowed"
              : [
                  "hover:bg-[var(--primary)]/[0.03]",
                  "hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
                ]
        )}
      >
        {/* Left: icon */}
        <motion.div
          whileHover={!isSelected && isAllowed ? { rotate: 8, scale: 1.05 } : {}}
          transition={{ type: "spring", stiffness: 400 }}
          className={cn(
            "shrink-0 w-9 h-9 rounded-md border flex items-center justify-center transition-colors duration-200",
            isSelected
              ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
              : !isAllowed
                ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                : "bg-[var(--primary)]/8 border-[var(--primary)]/20 text-[var(--primary)] group-hover:bg-[var(--primary)]/15"
          )}
        >
          {isSelected ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : !isAllowed ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Layers className="w-4 h-4" />
          )}
        </motion.div>

        {/* Middle: label */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold truncate leading-tight",
            !isAllowed ? "text-red-600 dark:text-red-400" : "text-foreground"
          )}>
            {highlight(bundle?.name || "—", debounced)}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {bundle?.sku && (
              <p className="text-[11px] text-muted-foreground/80 truncate font-mono">
                {bundle.sku}
              </p>
            )}
            <span className="text-[10px] text-muted-foreground/60">
              {itemCount} {itemCount === 1 ? t("bundleItem") : t("bundleItems")}
            </span>
            {!isAllowed && (
              <span className="text-[10px] font-semibold text-red-500 dark:text-red-400">
                {t("bundleNotAllowed")}
              </span>
            )}
          </div>
        </div>

        {/* Right: price + actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn(
            "text-xs font-bold tabular-nums",
            !isAllowed ? "text-red-500 dark:text-red-400" : "text-[var(--primary)]"
          )}>
            {formatCurrency ? formatCurrency(bundle.price) : bundle.price}
          </span>

          {/* Expand toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(bundle.id);
            }}
            className={cn(
              "h-7 w-7 p-0 rounded-md",
              expanded
                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                : "text-muted-foreground/60 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"
            )}
          >
            {expanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>

          {/* Bundle quantity */}
          {!isSelected && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-0.5 border border-border/60 rounded-md overflow-hidden"
            >
              <button
                type="button"
                disabled={bundleQty <= 1}
                onClick={() => setBundleQty((q) => Math.max(1, q - 1))}
                className="w-6 h-7 flex items-center justify-center text-[11px] font-bold text-muted-foreground/70 hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={bundleQty}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) setBundleQty(v);
                }}
                className="w-7 h-7 text-center text-[11px] font-semibold tabular-nums bg-transparent border-x border-border/40 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setBundleQty((q) => q + 1)}
                className="w-6 h-7 flex items-center justify-center text-[11px] font-bold text-muted-foreground/70 hover:bg-muted/50 transition-colors"
              >
                +
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {isSelected ? (
              <motion.span
                key="selected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold"
              >
                <CheckCircle2 className="w-3 h-3" />
                {t("selected")}
              </motion.span>
            ) : (
              <motion.div
                key="cta"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={isAllowed ? { scale: 1.04 } : {}}
                whileTap={isAllowed ? { scale: 0.96 } : {}}
              >
                <Button
                  size="sm"
                  disabled={!isAllowed}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(bundle, bundleQty);
                  }}
                  className={cn(
                    "h-7 px-3 text-[11px] font-semibold rounded-md gap-1.5 transition-all duration-150",
                    isAllowed
                      ? "bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white shadow-[0_1px_6px_rgba(0,0,0,0.12)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
                      : "bg-red-100 dark:bg-red-900/30 text-red-400 dark:text-red-500 cursor-not-allowed"
                  )}
                >
                  {t("select")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hover left-edge accent */}
        <span
          aria-hidden
          className="pointer-events-none absolute start-0 top-3 bottom-3 w-[2.5px] rounded-full
            bg-gradient-to-b from-[var(--primary)] to-[var(--third,var(--secondary))]
            opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && allocations.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 bg-muted/20 px-3.5 py-2.5">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground/70 font-semibold uppercase tracking-wider">
                    <th className="text-start py-1.5 pe-2">{t("detailSku")}</th>
                    <th className="text-center py-1.5 px-2">{t("detailQty")}</th>
                    <th className="text-center py-1.5 px-2">{t("detailAvailable")}</th>
                    <th className="text-end py-1.5 px-2">{t("detailUnitPrice")}</th>
                    <th className="text-end py-1.5 ps-2">{t("detailTotalPrice")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {allocations.map((a) => (
                    <tr key={a.id} className={cn(
                      "transition-colors",
                      a.insufficientStock
                        ? "text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20"
                        : "text-foreground/80"
                    )}>
                      <td className="py-1.5 pe-2 font-mono font-medium truncate max-w-[120px]">
                        {a.sku || "—"}
                        {a.name && (
                          <span className="text-muted-foreground/60 ms-1 font-sans font-normal">{a.name}</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-center tabular-nums">{a.quantity}</td>
                      <td className="py-1.5 px-2 text-center tabular-nums">
                        {a.available}
                        {a.insufficientStock && (
                          <span className="ms-1 text-[9px] font-bold text-red-500">
                            {t("insufficientStock")}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-end tabular-nums font-medium">
                        {formatCurrency ? formatCurrency(a.price) : a.price}
                      </td>
                      <td className="py-1.5 ps-2 text-end tabular-nums font-semibold">
                        {formatCurrency ? formatCurrency(a.allocatedTotal) : a.allocatedTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────── */
export function ProductSkuSearchPopover({
  handleSelectSku,
  selectedSkus = [],
  closeOnSelect = true,
  closeOnOutsideClick = true,
  productId,
  initialSearch,
  trigger,
  width,
  mode = "products",
  className = "",
  initFromProductIds = false,
}) {
  const t = useTranslations("productSearch");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { formatCurrency } = usePlatformSettings();

  const [open, setOpen] = useState(false);
  const [searchType, setSearchType] = useState(mode === "bundles" ? "bundles" : "products");
  const [expandedBundleId, setExpandedBundleId] = useState(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  const [searchQuery, setSearchQuery] = useState(initialSearch ?? "");
  const { debouncedValue: debounced } = useDebounce({ value: searchQuery, delay: 350 });

  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  useEffect(() => {
    const initSkusFromUrl = async () => {
      const skusParam = searchParams.get('skus');
      const productIdsParam = initFromProductIds ? searchParams.get('productIds') : null;

      if (!skusParam && !productIdsParam) return;

      const params = new URLSearchParams(searchParams.toString());
      if (skusParam) params.delete('skus');
      if (productIdsParam) params.delete('productIds');
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });

      try {
        const fetched = [];

        if (productIdsParam) {
          const productIds = productIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
          if (productIds.length > 0) {
            const res = await api.get('/products', {
              params: { ids: productIds.join(','), limit: Math.max(productIds.length, 10), page: 1 },
            });
            const records = Array.isArray(res.data?.records)
              ? res.data.records
              : Array.isArray(res.data) ? res.data : [];
            for (const product of records) {
              const variants = Array.isArray(product?.skus)
                ? product.skus
                : Array.isArray(product?.variants) ? product.variants : [];
              for (const sku of variants) {
                if (sku?.isActive === false) continue;
                fetched.push({
                  id: sku.id,
                  productId: product.id,
                  label: sku.sku ? sku.sku : `#${sku.id}`,
                  sku: sku.sku ?? null,
                  key: sku.key ?? null,
                  stockOnHand: Number(sku.stockOnHand ?? 0),
                  reserved: Number(sku.reserved ?? 0),
                  price: Number(sku.price ?? sku.unitCost ?? 0),
                  wholesalePrice: Number(sku.wholesalePrice ?? product.wholesalePrice ?? 0),
                  unitCost: Number(sku.unitCost ?? 0),
                  available: Number(sku.available ?? 0),
                  name: sku.name ?? product.name ?? null,
                  attributes: sku.attributes || {},
                });
              }
            }
          }
        }

        if (skusParam) {
          const skuIds = skusParam.split(',').map((id) => id.trim()).filter(Boolean);
          if (skuIds.length > 0) {
            const res = await api.get('/lookups/skus', {
              params: { skus: skuIds.join(',') }
            });
            const fetchedSkus = Array.isArray(res.data?.data)
              ? res.data.data
              : Array.isArray(res.data) ? res.data : [];
            fetched.push(...fetchedSkus);
          }
        }

        if (fetched.length > 0) handleSelectSku(fetched);
      } catch (error) {
        console.error("Failed to fetch initial SKUs from URL:", error);
      }
    };

    initSkusFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure trigger width
  useEffect(() => {
    if (!triggerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setTriggerWidth(e.contentRect.width);
    });
    ro.observe(triggerRef.current);
    return () => ro.disconnect();
  }, []);

  // Auto-focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const selectedSkuIds = useMemo(
    () => new Set((selectedSkus || []).map((s) => s.id)),
    [selectedSkus]
  );

  async function runSearch(raw) {
    const term = (raw ?? "").trim();
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setHasMore(false);
      setNextCursor(null);
      return;
    }
    setIsSearching(true);
    try {
      if (searchType === "bundles") {
        const res = await api.get(`/bundles`, { params: { search: term, limit: 20 } });
        const records = res.data?.records ?? [];
        setSearchResults(Array.isArray(records) ? records : []);
        setHasMore(false);
        setNextCursor(null);
      } else {
        const res = await api.get(`/lookups/skus`, { params: { q: term, productId, limit: 20 } });
        const { data, hasMore: more, nextCursor: cursor } = res.data;
        setSearchResults(Array.isArray(data) ? data : []);
        setHasMore(more);
        setNextCursor(cursor);
      }
    } catch (e) {
      console.error("Search error:", e);
      setSearchResults([]);
      setHasMore(false);
      setNextCursor(null);
    } finally {
      setIsSearching(false);
    }
  }

  async function loadMore() {
    if (searchType === "bundles" || isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const res = await api.get(`/lookups/skus`, {
        params: { q: debounced, productId, limit: 20, cursor: nextCursor }
      });
      const { data, hasMore: more, nextCursor: cursor } = res.data;

      setSearchResults(prev => [...prev, ...data]);
      setHasMore(more);
      setNextCursor(cursor);
    } catch (e) {
      console.error("Load more error:", e);
    } finally {
      setIsLoadingMore(false);
    }
  }

  function resetSearch() {
    setIsSearching(false);
    setIsLoadingMore(false);
    setSearchResults([]);
    setSearchQuery("");
    setHasMore(false);
    setNextCursor(null);
  }

  useEffect(() => {
    if (!open) return;
    runSearch(debounced);
  }, [debounced, open, searchType]);

  useEffect(() => {
    if (!open) resetSearch();
  }, [open]);

  function selectSku(sku) {
    handleSelectSku(sku); 
    if (closeOnSelect) {
      setOpen(false);
      resetSearch();
    }
  } 
    const allocateBundlePrices = useAllocateBundlePrices();

  function selectBundle(bundle, bundleQty = 1) {
    const { allocations, isAllowed } = allocateBundlePrices(bundle, bundleQty);
    if (!isAllowed) return;

    const normalizedSkus = allocations.map((sku) => ({
      ...sku,
      bundleId: bundle.id,
      bundleName: bundle.name,
      bundlePrice: Number(bundle.price ?? 0),
    }));

    handleSelectSku(normalizedSkus);
    setOpen(false);
    resetSearch();
    setExpandedBundleId(null);
  }

  /* ── Derived UI state ─────────────────────────────────────────────── */
  const showResults = !isSearching && searchResults.length > 0;
  const showEmpty = !isSearching && searchResults.length === 0 && debounced.length >= 2;
  const showIdle = !isSearching && debounced.length < 2;

  return (
    <Popover open={open} onOpenChange={setOpen} className={className}>
      {/* ── Trigger ───────────────────────────────────────────────────── */}
      <PopoverTrigger asChild>
        {trigger ? (
          <div ref={triggerRef} className="cursor-pointer">
            {trigger(open)}
          </div>
        ) : (
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-11 px-3.5 rounded-md",
              "border border-border/70 bg-background/60! text-foreground",
              "hover:border-[var(--primary)]/50 hover:bg-background",
              "data-[state=open]:border-[var(--primary)] data-[state=open]:shadow-[0_0_0_3px_rgb(var(--primary-shadow))]",
              "transition-all duration-200 text-sm font-normal"
            )}
          >
            <span className="flex items-center gap-2.5 text-muted-foreground/80">
              <Search className="w-4 h-4 shrink-0" />
              {t("triggerPlaceholder")}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 shrink-0 text-muted-foreground/80transition-transform duration-250",
                open && "rotate-180 text-[var(--primary)]"
              )}
            />
          </Button>
        )}
      </PopoverTrigger>

      {/* ── Panel ─────────────────────────────────────────────────────── */}
      <PopoverContent
        className={`p-0 border-0 shadow-none`}
        style={{ width: width || Math.max(triggerWidth + 24, 380) }}
        onInteractOutside={() => closeOnOutsideClick && setOpen(false)}
        onEscapeKeyDown={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "relative w-full overflow-hidden",
            "rounded-2xl border border-[var(--primary)]/20",
            "bg-popover/96 backdrop-blur-md",
            "shadow-[0_4px_6px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.13)]",
            "dark:shadow-[0_4px_6px_rgba(0,0,0,0.2),0_12px_40px_rgba(0,0,0,0.5)]"
          )}
        >
          {/* Top accent gradient bar */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl
              bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,var(--third))] to-[var(--third,var(--secondary))]"
          />

          {/* ── Search header ──────────────────────────────────────────── */}
          <div className="px-4 pt-5 pb-3.5 flex flex-col gap-3">
            {/* Toggle */}
            {mode === "both" && (
              <div className="flex items-center justify-center gap-1 p-1 rounded-lg bg-border/30">
                {[
                  { key: "products", label: t("toggleProducts"), icon: Package },
                  { key: "bundles", label: t("toggleBundles"), icon: Layers },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (searchType === key) return;
                      setSearchType(key);
                      setSearchResults([]);
                      // setSearchQuery("");
                      setHasMore(false);
                      setNextCursor(null);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                      searchType === key
                        ? "bg-background text-foreground shadow-sm border border-border/60"
                        : "text-muted-foreground/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Icon block */}
              <div className="shrink-0 w-9 h-9 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                {searchType === "bundles" ? <Layers className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              </div>

              {/* Input */}
              <div className="relative flex-1">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchType === "bundles" ? t("inputBundlePlaceholder") : t("inputPlaceholder")}
                  className={cn(
                    "w-full h-10 ps-10 pe-4 rounded-md text-sm",
                    "border border-border/70 bg-background/60",
                    "placeholder:text-muted-foreground/80",
                    "hover:border-[var(--primary)]/40 hover:bg-background",
                    "focus:border-[var(--primary)] focus:bg-background",
                    "focus:shadow-[0_0_0_3px_rgb(var(--primary-shadow))]",
                    "outline-none transition-all duration-200"
                  )}
                />
              </div>

              {/* Counter badge */}
              <AnimatePresence>
                {(isSearching || searchResults.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    className="shrink-0"
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold",
                        "border border-border/60 bg-background text-muted-foreground"
                      )}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[var(--primary)]" />
                          {t("searching")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                          {searchResults.length}
                        </>
                      )}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Thin divider */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

          {/* ── Results area ─────────────────────────────────────────── */}
          <div className="max-h-[380px] overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              {isSearching ? (
                <StateBlock
                  key="loading"
                  icon={Loader2}
                  title={t("searching")}
                  spin
                />
              ) : showEmpty ? (
                <StateBlock
                  key="empty"
                  icon={Search}
                  title={t("noResults")}
                  subtitle={t("tryDifferent")}
                />
              ) : showIdle ? (
                <StateBlock
                  key="idle"
                  icon={ScanBarcode}
                  title={t("inputPlaceholder")}
                  subtitle={null}
                />
              ) : showResults ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 space-y-1.5"
                >
                  {searchResults.map((item, idx) => (
                    searchType === "bundles" ? (
                      <BundleRow
                        key={item.id}
                        bundle={item}
                        idx={idx}
                        isSelected={false}
                        debounced={debounced}
                        onSelect={selectBundle}
                        t={t}
                        formatCurrency={formatCurrency}
                        expanded={expandedBundleId === item.id}
                        onToggleExpand={(id) => setExpandedBundleId((prev) => prev === id ? null : id)}
                      />
                    ) : (
                      <SkuRow
                        key={item.id}
                        sku={item}
                        idx={idx}
                        isSelected={selectedSkuIds.has(item.id)}
                        debounced={debounced}
                        onSelect={selectSku}
                        t={t}
                      />
                    )
                  ))}

                  {/* ── Load More ─────────────────────────────────────────── */}
                  {(hasMore || isLoadingMore) && (
                    <div className="pt-2 pb-1 px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoadingMore}
                        onClick={loadMore}
                        className={cn(
                          "w-full h-10 rounded-md border border-dashed border-border/60",
                          "text-xs font-medium text-muted-foreground/80 hover:text-[var(--primary)]",
                          "hover:bg-[var(--primary)]/[0.04] hover:border-[var(--primary)]/30",
                          "transition-all duration-200 gap-2"
                        )}
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {t("searching")}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            {t("loadMore")}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {!hasMore && searchResults.length > 0 && (
                    <p className="text-[10px] text-center text-muted-foreground/50 py-3 italic">
                      {t("noMoreResults")}
                    </p>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Bottom fade gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6
              bg-gradient-to-t from-popover/80 to-transparent rounded-b-2xl"
          />
        </motion.div>
      </PopoverContent>
    </Popover >
  );
}