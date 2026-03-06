"use client";

import React, {
  memo, useState, useCallback, useMemo, useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

import {
  Table as ShadTable,
  TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import {
  Search, Filter, Download,
  ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  Image as ImageIcon, X, Maximize2, SlidersHorizontal,
} from "lucide-react";

import { baseImg } from "@/utils/axios";
import { useTranslations } from "next-intl";

const ACTION_KEYS = new Set(["actions", "options"]);
const DEFAULT_PER_PAGE_OPTIONS = [6, 12, 24, 48];

const ACTION_COLORS = {
  primary: "btn btn-solid btn-sm",
  emerald: "btn btn-solid btn-sm btn-emerald",
  blue:    "btn btn-solid btn-sm btn-blue",
  purple:  "btn btn-solid btn-sm btn-purple",
  rose:    "btn btn-solid btn-sm btn-rose",
  amber:   "btn btn-solid btn-sm btn-amber",
  default: "btn btn-ghost btn-sm btn-default !border !border-border !border-[1px]",
};

function toFullSrc(src) {
  if (!src) return "";
  return src.startsWith("http") ? src : baseImg + src;
}

function normalizeImages(value, fallbackAlt = "") {
  if (!value) return [];
  if (typeof value === "string") return [{ src: value, alt: fallbackAlt }];
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (!v) return null;
      if (typeof v === "string") return { src: v, alt: fallbackAlt };
      if (typeof v === "object") {
        const src = v.url ?? v.src;
        return src ? { src, alt: v.alt ?? fallbackAlt } : null;
      }
      return null;
    }).filter(Boolean);
  }
  if (typeof value === "object") {
    const src = value.url ?? value.src;
    if (src) return [{ src, alt: value.alt ?? fallbackAlt }];
  }
  return [];
}

function useIsRTL() {
  const [isRTL, setIsRTL] = useState(false);
  useEffect(() => { setIsRTL(document.documentElement.dir === "rtl"); }, []);
  return isRTL;
}

/* ══════════════════════════════════════════════════════════════
   FILTER FIELD
══════════════════════════════════════════════════════════════ */
export function FilterField({ label, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TABLE TOOLBAR
   — same API, refreshed with --primary tints + left accent bar
══════════════════════════════════════════════════════════════ */
export const TableToolbar = memo(function TableToolbar({
  searchValue = "",
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search…",
  isFiltersOpen = false,
  onToggleFilters,
  hasActiveFilters = false,
  filterLabel = "Filters",
  actions = [],
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); onSearch?.(); }
  };

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Search */}
      <div
        className="relative flex-1 w-full max-w-[350px] focus-within:max-w-[400px]"
        style={{ transition: "max-width .3s cubic-bezier(.16,1,.3,1)" }}
      >
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          startIcon={<Search size={16} />}
          className={cn(
            "h-10 rounded-xl border-border bg-background/70 text-sm",
            "placeholder:text-muted-foreground/50",
            "focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/10",
            "transition-all duration-200",
          )}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Filters toggle */}
        {onToggleFilters && (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleFilters}
            type="button"
            className={cn(
              "relative btn btn-sm",
              isFiltersOpen ? "btn-solid" : "btn-outline",
            )}
          >
            <SlidersHorizontal size={14} />
            {filterLabel}
            {hasActiveFilters && !isFiltersOpen && (
              <span
                className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full flex items-center justify-center z-10"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  fontSize: 8,
                  fontWeight: 900,
                  boxShadow: "0 0 0 2px var(--card)",
                }}
              >
                ✦
              </span>
            )}
            <motion.span
              animate={{ rotate: isFiltersOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex" }}
            >
              <ChevronDown size={13} />
            </motion.span>
          </motion.button>
        )}

        {/* Action buttons */}
        {actions.map((action) => (
          <motion.button
            key={action.key}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={action.onClick}
            type="button"
            disabled={action.disabled}
            className={cn(
              ACTION_COLORS[action.color ?? "default"] ?? ACTION_COLORS.default,
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {action.icon}
            {action.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   TABLE FILTERS PANEL
   — card with --primary hairline top accent bar (first-design)
══════════════════════════════════════════════════════════════ */
export const TableFilters = memo(function TableFilters({
  children, onApply, applyLabel = "Apply",
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div
        className="mt-3 rounded-xl border border-border overflow-hidden"
        style={{
          background: "color-mix(in oklab, var(--muted) 60%, var(--card))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Hairline top accent bar — same signature as InfoCard */}
        <div style={{
          height: 2.5,
          background: "linear-gradient(90deg, var(--primary), var(--secondary))",
          borderRadius: "0 0 0 0",
        }} />

        <div className="p-4 flex items-end gap-6">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {children}
          </div>
          {onApply && (
            <div className="w-fit flex">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={onApply}
                type="button"
                className="btn !h-[42px] btn-solid btn-sm rtl:mr-auto ltr:ml-auto"
              >
                <Filter size={14} />
                {applyLabel}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

/* ══════════════════════════════════════════════════════════════
   TABLE PAGINATION
   — uses --primary / --secondary / --primary-shadow vars only
══════════════════════════════════════════════════════════════ */
export const TablePagination = memo(function TablePagination({
  pagination, onPageChange, isLoading = false,
  pageParamName = "page", limitParamName = "limit",
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
}) {
  const t = useTranslations("pagination");

  const totalPages = useMemo(() => {
    const total = Number(pagination?.total_records ?? 0);
    const per   = Number(pagination?.per_page ?? 6);
    return Math.max(1, Math.ceil(total / per));
  }, [pagination]);

  const currentPage = Number(pagination?.current_page ?? 1);
  const perPage     = Number(pagination?.per_page ?? 6);

  const pageItems = useMemo(() => {
    const tot = totalPages;
    const cur = Math.min(Math.max(1, currentPage), tot);
    if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
    const items = [1];
    const start = Math.max(2, cur - 2);
    const end   = Math.min(tot - 1, cur + 2);
    if (start > 2) items.push("…");
    for (let p = start; p <= end; p++) items.push(p);
    if (end < tot - 1) items.push("…");
    items.push(tot);
    return items;
  }, [totalPages, currentPage]);

  const goTo = (page) => {
    if (!onPageChange) return;
    const p = Math.min(Math.max(1, page), totalPages);
    onPageChange({ page: p, per_page: perPage, [pageParamName]: p, [limitParamName]: perPage });
  };

  const changeLimit = (lim) => {
    if (!onPageChange) return;
    onPageChange({ page: 1, per_page: lim, [pageParamName]: 1, [limitParamName]: lim });
  };

  const from  = pagination?.total_records ? (currentPage - 1) * perPage + 1 : 0;
  const to    = Math.min(currentPage * perPage, pagination?.total_records ?? 0);
  const total = pagination?.total_records ?? 0;

  /* Shared nav button */
  const NavBtn = ({ onClick, disabled, children, title }) => (
    <motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.06, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      onClick={onClick}
      disabled={isLoading || disabled}
      title={title}
      className={cn(
        "relative w-9 h-9 rounded-xl flex items-center justify-center",
        "border border-border bg-background/60 text-muted-foreground",
        "transition-all duration-150 overflow-hidden",
        "hover:border-[var(--primary)]/50 hover:text-[var(--primary)]",
        "hover:bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]",
        "disabled:opacity-35 disabled:cursor-not-allowed",
        "disabled:hover:border-border disabled:hover:text-muted-foreground disabled:hover:bg-background/60",
      )}
    >
      {children}
    </motion.button>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4">

      {/* Left: record range */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground/70">
          {t("showing")}{" "}
          <span className="font-bold text-foreground tabular-nums">{from}–{to}</span>
          {" "}{t("of")}{" "}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-xl border text-xs font-black tabular-nums"
            style={{
              background: "color-mix(in oklab, var(--primary) 10%, transparent)",
              borderColor: "color-mix(in oklab, var(--primary) 20%, transparent)",
              color: "var(--primary)",
            }}
          >
            {total}
          </span>
          {" "}{t("records")}
        </span>
      </div>

      {/* Center: page buttons */}
      <div className="flex items-center gap-1">
        <NavBtn onClick={() => goTo(1)} disabled={currentPage <= 1} title={t("firstPage")}>
          <ChevronsRight size={13} />
        </NavBtn>
        <NavBtn onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1} title={t("prevPage")}>
          <ChevronRight size={13} />
        </NavBtn>

        <div className="flex items-center gap-1 mx-0.5">
          {pageItems.map((p, idx) =>
            p === "…" ? (
              <span key={`d-${idx}`} className="w-7 text-center text-muted-foreground/40 text-xs select-none">
                ···
              </span>
            ) : (
              <motion.button
                key={p}
                type="button"
                whileHover={p !== currentPage ? { scale: 1.08, y: -1 } : {}}
                whileTap={{ scale: 0.92 }}
                onClick={() => goTo(p)}
                disabled={isLoading}
                className={cn(
                  "relative w-9 h-9 rounded-xl text-xs font-bold border transition-all duration-150 overflow-hidden",
                  p === currentPage
                    ? "font-black"
                    : [
                        "bg-background/60 border-border text-muted-foreground",
                        "hover:border-[var(--primary)]/40 hover:text-[var(--primary)]",
                        "hover:bg-[color-mix(in_oklab,var(--primary)_4%,transparent)]",
                      ],
                )}
                style={p === currentPage ? {
                  background: "color-mix(in oklab, var(--primary) 10%, transparent)",
                  borderColor: "color-mix(in oklab, var(--primary) 40%, transparent)",
                  color: "var(--primary)",
                  boxShadow: "0 0 0 3px color-mix(in oklab, var(--primary) 14%, transparent)",
                } : {}}
              >
                {/* Active page top sheen */}
                {p === currentPage && (
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                )}
                <span className="relative">{p}</span>
              </motion.button>
            )
          )}
        </div>

        <NavBtn onClick={() => goTo(currentPage + 1)} disabled={currentPage >= totalPages} title={t("nextPage")}>
          <ChevronLeft size={13} />
        </NavBtn>
        <NavBtn onClick={() => goTo(totalPages)} disabled={currentPage >= totalPages} title={t("lastPage")}>
          <ChevronsLeft size={13} />
        </NavBtn>
      </div>

      {/* Right: per-page selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground/70 hidden sm:block">{t("perPage")}</span>
        <div
          className="flex items-center gap-1 p-1 rounded-xl border border-border bg-background/60"
        >
          {perPageOptions.map((lim) => (
            <button
              key={lim}
              type="button"
              onClick={() => changeLimit(lim)}
              disabled={isLoading}
              className={cn(
                "relative w-9 h-7 rounded-xl text-[11px] font-bold transition-all duration-150 overflow-hidden",
                perPage === lim
                  ? "font-black"
                  : "text-muted-foreground hover:text-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]",
              )}
              style={perPage === lim ? {
                background: "color-mix(in oklab, var(--primary) 10%, transparent)",
                border: "1px solid color-mix(in oklab, var(--primary) 30%, transparent)",
                color: "var(--primary)",
                boxShadow: "0 1px 4px color-mix(in oklab, var(--primary) 18%, transparent)",
              } : {}}
            >
              {perPage === lim && (
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg" />
              )}
              <span className="relative">{lim}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   TABLE SKELETON
   — warm shimmer using muted/border tokens, auto dark
══════════════════════════════════════════════════════════════ */
const TableSkeleton = memo(function TableSkeleton({ columns, rows = 6, compact }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <TableRow key={ri} className="border-b border-border/50">
          {columns.map((col, ci) => (
            <TableCell key={ci} className={cn("!px-5", compact ? "py-2.5" : "py-4")}>
              <div
                className="h-4 rounded-xl skeleton"
                style={{ width: col.type === "img" ? "44px" : `${50 + ((ri * 13 + ci * 7) % 40)}%` }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
});

/* ══════════════════════════════════════════════════════════════
   IMAGE CELLS
══════════════════════════════════════════════════════════════ */
const ImgCell = memo(function ImgCell({ src, alt, onOpen }) {
  const fullSrc = toFullSrc(src);
  if (!fullSrc) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <motion.button
      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
      type="button" onClick={() => onOpen(fullSrc, alt)}
      className={cn(
        "group/img relative w-11 h-11 rounded-xl overflow-hidden block",
        "border-2 border-border hover:border-[var(--primary)]",
        "shadow-sm hover:shadow-md",
        "transition-all duration-200",
      )}
    >
      <img src={fullSrc} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-colors flex items-center justify-center">
        <Maximize2 size={11} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
      </div>
    </motion.button>
  );
});

const ImgsCell = memo(function ImgsCell({ images, onOpen }) {
  if (!images.length) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <div className="flex items-center">
      {images.map((img, idx) => {
        const fullSrc = toFullSrc(img.src);
        return (
          <motion.button
            key={`${img.src}-${idx}`} type="button"
            onClick={() => onOpen(fullSrc, img.alt)}
            style={{ zIndex: images.length - idx, marginInlineStart: idx === 0 ? 0 : "-14px" }}
            whileHover={{ scale: 1.12, zIndex: 50 }} whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-background shadow-md cursor-pointer"
          >
            <img src={fullSrc} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
          </motion.button>
        );
      })}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   IMAGE MODAL
   — header uses --primary gradient blob, same design language
══════════════════════════════════════════════════════════════ */
const ImageModal = memo(function ImageModal({ src, alt, open, onClose, labels = {} }) {
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => { if (!open) setZoomed(false); }, [open]);

  const download = useCallback(() => {
    const a = Object.assign(document.createElement("a"), {
      href: src, target: "_blank", download: alt || "image",
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [src, alt]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl !p-0 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between gap-4 px-5 py-4 border-b border-border overflow-hidden">
          {/* Top accent bar — matches the filter panel and InfoCard */}
          <div
            className="absolute top-0 left-0 right-0 h-[2.5px]"
            style={{ background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}
          />

          <div className="relative flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center btn-solid flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))",
                boxShadow: "0 4px 14px -4px rgb(var(--primary-shadow))",
              }}
            >
              <ImageIcon size={16} className="text-white" />
            </div>
            <div>
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: "var(--card-foreground)" }}
              >
                {labels.preview ?? "Image Preview"}
              </p>
              {alt && (
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{alt}</p>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-1.5">
             
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={download}
              className="flex items-center justify-center btn btn-solid btn-sm !w-8 !h-8 !px-0"
            >
              <Download size={14} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="flex items-center justify-center btn btn-ghost btn-sm btn-rose !w-8 !h-8 !px-0"
            >
              <X size={14} />
            </motion.button>
          </div>
        </div>

        {/* Image area */}
        <div
          className="p-8 flex items-center justify-center min-h-[380px]"
          style={{ background: "var(--muted)" }}
        >
          <motion.img
            src={src} alt={alt}
            animate={{ scale: zoomed ? 1.65 : 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            onClick={() => setZoomed((z) => !z)}
            className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl cursor-zoom-in"
            style={{ border: "4px solid var(--card)" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});

/* ══════════════════════════════════════════════════════════════
   MAIN TABLE
   — bg-card picks up your global .bg-card rule (light + dark)
   — all accent colours use --primary / --secondary / --third
   — no hardcoded colours anywhere
══════════════════════════════════════════════════════════════ */
export default function Table({
  searchValue = "", onSearchChange, onSearch,
  actions = [], filters, hasActiveFilters = false, onApplyFilters,
  labels = {}, columns = [], data = [], isLoading = false,
  rowKey = (row, i) => row?.id ?? i,
  emptyState, striped = false, compact = false, hoverable = true,
  pagination = null, onPageChange,
  pageParamName = "page", limitParamName = "limit",
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS, className = "",
}) {
  const isRTL = useIsRTL();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [imgModal, setImgModal]       = useState({ open: false, src: "", alt: "" });

  const openImage  = useCallback((src, alt = "") => setImgModal({ open: true, src, alt }), []);
  const closeImage = useCallback(() => setImgModal({ open: false, src: "", alt: "" }), []);
  const helpers    = useMemo(() => ({ openImage }), [openImage]);

  const hasFilters  = Boolean(filters);
  const stickyEnd   = isRTL ? "left-0" : "right-0";
  const stickyShadow = isRTL
    ? "shadow-[8px_0_12px_-10px_rgba(0,0,0,0.18)] dark:shadow-[8px_0_12px_-10px_rgba(0,0,0,0.5)]"
    : "shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.18)] dark:shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.5)]";

  return (
    <div className={cn("w-full" )}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card !p-0 overflow-hidden"
      >
         
        {/* ── Toolbar ──────────────────────────────────── */}
        <div
          className="px-5 py-4 border-b border-border" 
        >
          <TableToolbar
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearch={onSearch}
            searchPlaceholder={labels.searchPlaceholder}
            isFiltersOpen={filtersOpen}
            onToggleFilters={hasFilters ? () => setFiltersOpen((v) => !v) : undefined}
            hasActiveFilters={hasActiveFilters}
            filterLabel={labels.filter}
            actions={actions}
          />
          <AnimatePresence>
            {filtersOpen && hasFilters && (
              <TableFilters onApply={onApplyFilters} applyLabel={labels.apply}>
                {filters}
              </TableFilters>
            )}
          </AnimatePresence>
        </div>

        {/* ── Table ──────────────────────────────────────── */}
        <div className="relative overflow-x-auto">
          <ShadTable>
            {/* Header */}
            <TableHeader
              className="border-b border-border"
              style={{ background: "color-mix(in oklab, var(--muted) 55%, var(--card))" }}
            >
              <TableRow className="hover:bg-transparent">
                {columns.map((col, idx) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "!px-5 whitespace-nowrap ltr:text-left rtl:text-right",
                      compact ? "py-3" : "py-4",
                      col.headClassName,
                      ACTION_KEYS.has(col.key) && cn("sticky z-30", stickyEnd, stickyShadow),
                    )}
                    style={ACTION_KEYS.has(col.key) ? {
                      background: "color-mix(in oklab, var(--muted) 55%, var(--card))",
                    } : {}}
                  >
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-2"
                      style={{
                        fontSize: 10, fontWeight: 800,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {col.header}
                    </motion.span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            {/* Body */}
            <TableBody>
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <TableSkeleton key="skel" columns={columns} rows={Number(pagination?.per_page ?? 6)} compact={compact} />

                ) : data.length === 0 ? (
                  /* ── Empty state ── */
                  <TableRow key="empty">
                    <TableCell colSpan={columns.length} className="py-20">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="relative">
                          <div
                            className="absolute inset-0 blur-2xl rounded-full"
                            style={{ background: "color-mix(in oklab, var(--primary) 15%, transparent)" }}
                          />
                          <div
                            className="relative w-16 h-16 rounded-xl border border-border flex items-center justify-center shadow-sm"
                            style={{ background: "color-mix(in oklab, var(--muted) 80%, var(--card))" }}
                          >
                            <ImageIcon
                              className="w-8 h-8"
                              style={{ color: "color-mix(in oklab, var(--muted-foreground) 45%, transparent)" }}
                            />
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                            {emptyState ?? labels.emptyTitle ?? "No results found"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {labels.emptySubtitle ?? "Try adjusting your search or filters"}
                          </p>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>

                ) : (
                  /* ── Data rows ── */
                  data.map((row, i) => (
                    <motion.tr
                      key={rowKey(row, i)}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.3), ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "border-b border-border/50 group transition-colors duration-150",
                        hoverable && "hover:bg-[color-mix(in_oklab,var(--primary)_3.5%,transparent)]",
                        striped && i % 2 === 1 && "bg-[color-mix(in_oklab,var(--muted)_50%,transparent)]",
                      )}
                    >
                      {columns.map((col) => {
                        /* img cell */
                        if (col.type === "img") return (
                          <TableCell key={col.key} className={cn("!px-5", compact ? "py-2.5" : "py-4", col.className)}>
                            <ImgCell src={row[col.key]} alt={col.header ?? ""} onOpen={openImage} />
                          </TableCell>
                        );

                        /* imgs cell */
                        if (col.type === "imgs") {
                          const imgs = normalizeImages(row[col.key], col.header ?? "");
                          return (
                            <TableCell key={col.key} className={cn("!px-5", compact ? "py-2.5" : "py-4", col.className)}>
                              <ImgsCell images={imgs} onOpen={openImage} />
                            </TableCell>
                          );
                        }

                        /* default / custom cell */
                        return (
                          <TableCell
                            key={col.key}
                            className={cn(
                              "!px-5 text-sm whitespace-nowrap ltr:text-left rtl:text-right",
                              compact ? "py-2.5" : "py-4",
                              "transition-colors duration-150 bg-white/50 backdrop-blur-[3px] dark:bg-slate-900",
                              col.className,
                              ACTION_KEYS.has(col.key) && cn("sticky z-20", stickyEnd, stickyShadow),
                            )}
                             
                          >
                            {typeof col.cell === "function" ? col.cell(row, i, helpers) : row[col.key]}
                          </TableCell>
                        );
                      })}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </ShadTable>
        </div>

        {/* ── Pagination ── */}
        {pagination && (
          <>
            <div
              className="h-px"
              style={{
                background: "linear-gradient(90deg, transparent, var(--border), transparent)",
              }}
            />
            <TablePagination
              pagination={pagination}
              onPageChange={onPageChange}
              isLoading={isLoading}
              pageParamName={pageParamName}
              limitParamName={limitParamName}
              perPageOptions={perPageOptions}
            />
          </>
        )}
      </motion.div>

      <ImageModal
        open={imgModal.open}
        src={imgModal.src}
        alt={imgModal.alt}
        onClose={closeImage}
        labels={labels}
      />
    </div>
  );
}