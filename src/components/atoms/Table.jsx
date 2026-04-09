"use client";

import React, {
  memo, useState, useCallback, useMemo, useEffect, useRef
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import {
  Table as ShadTable,
  TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AccentBar } from "./AccentBar";
import { ImageModal } from "./ImageModal";
import {
  Search, Filter, Download,
  ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  Image as ImageIcon, X, Maximize2, SlidersHorizontal,
  Package,
} from "lucide-react";
import { baseImg } from "@/utils/axios";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/AuthContext";

const ACTION_KEYS = new Set(["actions", "options"]);
const DEFAULT_PER_PAGE_OPTIONS = [6, 12, 24, 48];

const ACTION_COLORS = {
  primary: "btn btn-solid btn-sm",
  emerald: "btn btn-solid btn-sm btn-emerald",
  blue: "btn btn-solid btn-sm btn-blue",
  purple: "btn btn-solid btn-sm btn-purple",
  rose: "btn btn-solid btn-sm btn-rose",
  amber: "btn btn-solid btn-sm btn-amber",
  default: "btn btn-ghost btn-sm btn-default !border !border-border",
};

// ── Tokens ────────────────────────────────────────────────────────────────────
const P_04 = "color-mix(in oklab, var(--primary)  4%, transparent)";
const P_08 = "color-mix(in oklab, var(--primary)  8%, transparent)";
const P_12 = "color-mix(in oklab, var(--primary) 12%, transparent)";
const P_20 = "color-mix(in oklab, var(--primary) 20%, transparent)";
const P_30 = "color-mix(in oklab, var(--primary) 30%, transparent)";

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
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80block">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TOOLBAR
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
  const { hasPermission } = useAuth();
  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); onSearch?.(); }
  };

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      if (!action.permission) return true;
      return hasPermission(action.permission);
    });
  }, [actions, hasPermission]);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <FloatingSearchInput
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onKeyDown={handleKeyDown}
        searchPlaceholder={searchPlaceholder}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {onToggleFilters && (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleFilters}
            type="button"
            className={cn(
              "relative btn btn-sm gap-1.5",
              isFiltersOpen ? "btn-solid" : "btn-outline",
            )}
          >
            <SlidersHorizontal size={13} />
            {filterLabel}
            {/* {hasActiveFilters && !isFiltersOpen && (
              <span
                className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full flex items-center justify-center z-10 text-[8px] font-black"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  boxShadow: "0 0 0 2px var(--card)",
                }}
              >
                ✦
              </span>
            )} */}
            <motion.span
              animate={{ rotate: isFiltersOpen ? 180 : 0 }}
              transition={{ duration: 0.22 }}
              style={{ display: "flex" }}
            >
              <ChevronDown size={12} />
            </motion.span>
          </motion.button>
        )}

        {filteredActions.map((action) => (
          <motion.button
            key={action.key}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={action.onClick}
            type="button"
            disabled={action.disabled}
            className={cn(
              ACTION_COLORS[action.color ?? "default"] ?? ACTION_COLORS.default,
              "disabled:opacity-50 disabled:cursor-not-allowed gap-1.5",
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
   FILTERS PANEL
══════════════════════════════════════════════════════════════ */
export const TableFilters = memo(function TableFilters({
  children, onApply, applyLabel = "Apply",
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className=""
    >
      <div className="overflow-hidden !shadow-none mt-3 rounded-2xl border border-border/60 overflow-hidden main-card !p-0 backdrop-blur-sm">
        {/* <AccentBar /> */}
        <div className="p-4 flex max-sm:flex-col items-end gap-6">
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
                className="btn !h-[42px] btn-solid btn-sm gap-1.5 rtl:mr-auto ltr:ml-auto"
              >
                <Filter size={13} />
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
   PAGINATION
══════════════════════════════════════════════════════════════ */
export const TablePagination = memo(function TablePagination({
  pagination, onPageChange, isLoading = false,
  pageParamName = "page", limitParamName = "limit",
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
}) {
  const t = useTranslations("pagination");

  const totalPages = useMemo(() => {
    const total = Number(pagination?.total_records ?? 0);
    const per = Number(pagination?.per_page ?? 6);
    return Math.max(1, Math.ceil(total / per));
  }, [pagination]);

  const currentPage = Number(pagination?.current_page ?? 1);
  const perPage = Number(pagination?.per_page ?? 6);

  const pageItems = useMemo(() => {
    const tot = totalPages;
    const cur = Math.min(Math.max(1, currentPage), tot);
    if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
    const items = [1];
    const start = Math.max(2, cur - 2);
    const end = Math.min(tot - 1, cur + 2);
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

  const from = pagination?.total_records ? (currentPage - 1) * perPage + 1 : 0;
  const to = Math.min(currentPage * perPage, pagination?.total_records ?? 0);
  const total = pagination?.total_records ?? 0;

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
        "border border-border/60 bg-background/60 text-muted-foreground",
        "transition-all duration-150",
        "hover:border-[var(--primary)]/50 hover:text-[var(--primary)]",
        "hover:bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        "disabled:hover:border-border disabled:hover:text-muted-foreground disabled:hover:bg-transparent",
      )}
    >
      {children}
    </motion.button>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4">

      {/* Record range */}
      <p className="text-xs text-muted-foreground/80flex-shrink-0">
        {t("showing")}{" "}
        <span className="font-bold text-foreground tabular-nums">{from}–{to}</span>
        {" "}{t("of")}{" "}
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-lg border text-xs font-black tabular-nums"
          style={{
            background: P_08,
            borderColor: P_20,
            color: "var(--primary)",
          }}
        >
          {total}
        </span>
        {" "}{t("records")}
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <NavBtn onClick={() => goTo(1)} disabled={currentPage <= 1} title={t("firstPage")}>
          <ChevronsRight size={13} />
        </NavBtn>
        <NavBtn onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1} title={t("prevPage")}>
          <ChevronRight size={13} />
        </NavBtn>

        <div className="flex items-center gap-1 mx-1">
          {pageItems.map((p, idx) =>
            p === "…" ? (
              <span key={`d-${idx}`} className="w-7 text-center text-muted-foreground/80text-xs select-none">···</span>
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
                  p !== currentPage && [
                    "bg-background/60 border-border/60 text-muted-foreground",
                    "hover:border-[var(--primary)]/40 hover:text-[var(--primary)]",
                    "hover:bg-[color-mix(in_oklab,var(--primary)_4%,transparent)]",
                  ],
                )}
                style={p === currentPage ? {
                  background: P_08,
                  borderColor: P_30,
                  color: "var(--primary)",
                  fontWeight: 900,
                  boxShadow: `0 0 0 3px ${P_12}`,
                } : {}}
              >
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

      {/* Per-page selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground/80hidden sm:block">{t("perPage")}</span>
        <div className="flex items-center gap-0.5 p-1 rounded-xl border border-border/60 bg-background/60">
          {perPageOptions.map((lim) => (
            <button
              key={lim}
              type="button"
              onClick={() => changeLimit(lim)}
              disabled={isLoading}
              className={cn(
                "relative w-9 h-7 rounded-lg text-[11px] font-bold transition-all duration-150 overflow-hidden",
                perPage !== lim && "text-muted-foreground hover:text-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]",
              )}
              style={perPage === lim ? {
                background: P_08,
                border: `1px solid ${P_30}`,
                color: "var(--primary)",
                fontWeight: 900,
                boxShadow: `0 1px 4px ${P_12}`,
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
   SKELETON
══════════════════════════════════════════════════════════════ */
const TableSkeleton = memo(function TableSkeleton({ columns, rows = 6, compact }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <TableRow key={ri} className="border-b border-border/40">
          {columns.map((col, ci) => (
            <TableCell key={ci} className={cn("!px-5", compact ? "py-2.5" : "py-4")}>
              <div
                className="rounded-xl animate-pulse bg-muted/60"
                style={{ height: 16, width: col.type === "img" ? 44 : `${50 + ((ri * 13 + ci * 7) % 40)}%` }}
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
  if (!fullSrc) return <span className="text-muted-foreground/80text-sm">—</span>;
  return (
    <motion.button
      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
      type="button" onClick={() => onOpen(fullSrc, alt)}
      className={cn(
        "group/img relative w-11 h-11 rounded-xl overflow-hidden block",
        "border-2 border-border/60 hover:border-[var(--primary)]/60",
        "shadow-sm hover:shadow-md transition-all duration-200",
      )}
    >
      <img src={fullSrc} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
        <Maximize2 size={11} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow" />
      </div>
    </motion.button>
  );
});

const ImgsCell = memo(function ImgsCell({ images, onOpen }) {
  if (!images.length) return <span className="text-muted-foreground/80text-sm">—</span>;
  return (
    <div className="flex items-center">
      {images.map((img, idx) => {
        const fullSrc = toFullSrc(img.src);
        return (
          <motion.button
            key={`${img.src}-${idx}`} type="button"
            onClick={() => onOpen(fullSrc, img.alt)}
            style={{ zIndex: images.length - idx, marginInlineStart: idx === 0 ? 0 : -14 }}
            whileHover={{ scale: 1.14, zIndex: 50, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
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
   MAIN TABLE
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
  const [imgModal, setImgModal] = useState({ open: false, src: "", alt: "" });

  const openImage = useCallback((src, alt = "") => setImgModal({ open: true, src, alt }), []);
  const closeImage = useCallback(() => setImgModal({ open: false, src: "", alt: "" }), []);
  const helpers = useMemo(() => ({ openImage }), [openImage]);

  const hasFilters = Boolean(filters);
  const stickyEnd = isRTL ? "left-0" : "right-0";
  const stickyShadow = isRTL
    ? "shadow-[8px_0_12px_-10px_rgba(0,0,0,0.15)] dark:shadow-[8px_0_12px_-10px_rgba(0,0,0,0.45)]"
    : "shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.15)] dark:shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.45)]";

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative main-card !p-0 rounded-2xl border border-border/50 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 6px 24px rgba(0,0,0,0.05)" }}
      >


        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-border/40">
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

        {/* ── Table ────────────────────────────────────────── */}
        <div className="relative overflow-x-auto">
          <ShadTable>
            {/* Header */}
            <TableHeader
              className="border-b border-border/40"
              style={{ background: "color-mix(in oklab, var(--muted) 50%, var(--card))" }}
            >
              <TableRow className="hover:bg-transparent">
                {columns.map((col, idx) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "!px-5 whitespace-nowrap ltr:text-left rtl:text-right",
                      compact ? "py-3" : "py-3.5",
                      col.headClassName,
                      ACTION_KEYS.has(col.key) && cn("md:sticky md:z-30", stickyEnd, stickyShadow),
                    )}
                    style={ACTION_KEYS.has(col.key) ? {
                      background: "color-mix(in oklab, var(--muted) 50%, var(--card))",
                    } : {}}
                  >
                    <motion.span
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.035 }}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/80"
                    >
                      {col.header}
                    </motion.span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            {/* Body */}
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  <TableSkeleton key="skel" columns={columns} rows={Number(pagination?.per_page ?? 6)} compact={compact} />

                ) : data.length === 0 ? (
                  <TableRow key="empty">
                    <TableCell colSpan={columns.length} className="py-20">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        {/* Halo + icon */}
                        <div className="relative">
                          <div
                            className="absolute inset-0 blur-2xl rounded-full scale-150"
                            style={{ background: P_08 }}
                          />
                          <motion.div
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-14 h-14 rounded-2xl border border-border/60 flex items-center justify-center main-card shadow-sm"
                          >
                            <Package size={22} style={{ color: "color-mix(in oklab, var(--muted-foreground) 40%, transparent)" }} />
                          </motion.div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-bold text-foreground">
                            {emptyState ?? labels.emptyTitle ?? "No results found"}
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            {labels.emptySubtitle ?? "Try adjusting your search or filters"}
                          </p>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>

                ) : (
                  data.map((row, i) => (
                    <motion.tr
                      key={rowKey(row, i)}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: Math.min(i * 0.022, 0.28), ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "group border-b border-border/35 transition-colors duration-150",
                        hoverable && "hover:bg-[color-mix(in_oklab,var(--primary)_3%,transparent)]",
                        striped && i % 2 === 1 && "bg-[color-mix(in_oklab,var(--muted)_45%,transparent)]",
                      )}
                    >
                      {columns.map((col) => {
                        if (col.type === "img") return (
                          <TableCell key={col.key} className={cn("!px-5", compact ? "py-2.5" : "py-3.5", col.className)}>
                            <ImgCell src={row[col.key]} alt={col.header ?? ""} onOpen={openImage} />
                          </TableCell>
                        );

                        if (col.type === "imgs") {
                          const imgs = normalizeImages(row[col.key], col.header ?? "");
                          return (
                            <TableCell key={col.key} className={cn("!px-5", compact ? "py-2.5" : "py-3.5", col.className)}>
                              <ImgsCell images={imgs} onOpen={openImage} />
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell
                            key={col.key}
                            className={cn(
                              "!px-5 text-sm whitespace-nowrap ltr:text-left rtl:text-right",
                              compact ? "py-2.5" : "py-3.5",
                              col.className,
                              ACTION_KEYS.has(col.key) && cn("md:sticky md:z-20", stickyEnd, stickyShadow),
                            )}
                            style={ACTION_KEYS.has(col.key) ? {
                              background: "color-mix(in oklab, var(--card) 97%, transparent)",
                            } : {}}
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

        {/* ── Pagination ─────────────────────────────────── */}
        {pagination && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
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

/* ══════════════════════════════════════════════════════════════
   FLOATING SEARCH INPUT
══════════════════════════════════════════════════════════════ */
function FloatingSearchInput({ searchValue, onSearchChange, onKeyDown, searchPlaceholder }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const isFloating = focused || (searchValue && searchValue.length > 0);

  return (
    <div
      className={cn(
        "relative flex-1 w-full max-w-[380px]",
        focused && "max-w-[420px]"
      )}
      style={{ transition: "max-width .35s cubic-bezier(.16,1,.3,1)" }}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        className={cn(
          "relative h-[38px] rounded-xl border cursor-text min-w-[200px] bg-white dark:bg-card/50",
          "transition-all duration-200",
          focused
            ? "border-[var(--primary)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
            : "border-border hover:border-[var(--primary)]/40"
        )}
      >
        <label
          className={cn(
            "absolute start-9 pointer-events-none select-none",
            "font-medium text-sm origin-right",
            "transition-all duration-200 ease-out",
            // التعديل هنا: منع نزول النص لسطر جديد وإضافة ... مع تحديد أقصى عرض
            "truncate max-w-[calc(100%-3rem)]",
            isFloating
              ? [
                "top-0 -translate-y-1/2 text-[10px] px-1.5 py-0 leading-none",
                "bg-white dark:bg-card rounded",
                focused ? "text-[var(--primary)]" : "text-muted-foreground/80",
              ]
              : "top-1/2 -translate-y-1/2 text-muted-foreground/80"
          )}
        >
          {searchPlaceholder}
        </label>

        <div
          className={cn(
            "absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none",
            "transition-colors duration-200",
            focused ? "text-[var(--primary)]" : "text-muted-foreground/80"
          )}
        >
          <Search size={15} />
        </div>

        <input
          ref={inputRef}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=""
          className={cn(
            "absolute inset-0 w-full h-full bg-transparent !outline-none",
            "text-sm pr-9 pl-4 pt-0.5",
            "rounded-xl text-foreground",
            "[&:-webkit-autofill]:bg-transparent"
          )}
        />
      </div>
    </div>
  );
}