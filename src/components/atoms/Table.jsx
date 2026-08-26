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
  Package, Columns3, Minus, Loader2, GripVertical, RotateCcw,
} from "lucide-react";
import { baseImg } from "@/utils/axios";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/AuthContext";
import { avatarSrc } from "./UserSelect";
import { TutorialSpotlight } from "./TutorialSpotlight";
import { useTutorial } from "@/context/TutorialContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ACTION_KEYS = new Set(["actions", "options"]);
const DEFAULT_PER_PAGE_OPTIONS = [6, 12, 24, 48];
const TABLE_PREFS_LS_PREFIX = "tablePreferences_";

/** Keep column drag on the Y axis only (no sideways stretch). */
function restrictToVerticalAxis({ transform }) {
  return { ...transform, x: 0 };
}

/** Keep the dragged row inside its scroll list (no tall overflow). */
function restrictToParentElement({ transform, draggingNodeRect, containerNodeRect }) {
  if (!draggingNodeRect || !containerNodeRect) {
    return { ...transform, x: 0 };
  }

  const minY = containerNodeRect.top - draggingNodeRect.top;
  const maxY = containerNodeRect.bottom - draggingNodeRect.bottom;

  return {
    ...transform,
    x: 0,
    y: Math.min(Math.max(transform.y, minY), maxY),
  };
}

/** Normalize any stored pref (legacy string[] or { order, hidden }) */
function normalizeTablePref(value) {
  if (Array.isArray(value)) {
    return {
      order: [],
      hidden: value.filter((k) => typeof k === "string"),
    };
  }
  if (value && typeof value === "object") {
    return {
      order: Array.isArray(value.order) ? value.order.filter((k) => typeof k === "string") : [],
      hidden: Array.isArray(value.hidden) ? value.hidden.filter((k) => typeof k === "string") : [],
    };
  }
  return { order: [], hidden: [] };
}

/** Merge saved prefs with current column keys (append new cols, drop removed) */
function resolveTablePref(prefs, columnKeys) {
  const { order: savedOrder, hidden: savedHidden } = normalizeTablePref(prefs);
  const keySet = new Set(columnKeys);
  const order = [];
  const seen = new Set();

  for (const key of savedOrder) {
    if (keySet.has(key) && !seen.has(key)) {
      order.push(key);
      seen.add(key);
    }
  }
  for (const key of columnKeys) {
    if (!seen.has(key)) {
      order.push(key);
      seen.add(key);
    }
  }

  const hidden = savedHidden.filter((key) => keySet.has(key));
  return { order, hidden };
}

function tablePrefsEqual(a, b) {
  const na = normalizeTablePref(a);
  const nb = normalizeTablePref(b);
  if (na.order.length !== nb.order.length || na.hidden.length !== nb.hidden.length) return false;
  if (na.order.some((k, i) => k !== nb.order[i])) return false;
  const ha = new Set(na.hidden);
  const hb = new Set(nb.hidden);
  if (ha.size !== hb.size) return false;
  for (const k of ha) if (!hb.has(k)) return false;
  return true;
}

function readTablePrefsFromLS(tableKey) {
  if (typeof window === "undefined" || !tableKey) return { order: [], hidden: [] };
  try {
    const raw = localStorage.getItem(`${TABLE_PREFS_LS_PREFIX}${tableKey}`);
    return normalizeTablePref(raw ? JSON.parse(raw) : null);
  } catch {
    return { order: [], hidden: [] };
  }
}

function writeTablePrefsToLS(tableKey, prefs) {
  if (typeof window === "undefined" || !tableKey) return;
  try {
    localStorage.setItem(
      `${TABLE_PREFS_LS_PREFIX}${tableKey}`,
      JSON.stringify(normalizeTablePref(prefs)),
    );
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

function isEmptyHeader(header) {
  if (header == null || header === false) return true;
  if (typeof header === "string") return !header.trim();
  return false;
}

function getColumnDisplayLabel(col, tColumn) {
  if (typeof col?.title === "string" && col.title.trim()) return col.title;
  if (typeof col?.header === "string" && col.header.trim()) return col.header;
  if (typeof col?.header === "number") return String(col.header);

  if (col?.key === "select") {
    return tColumn?.("selectColumn") ?? "Select";
  }
  if (col?.key === "actions" || col?.key === "options") {
    return tColumn?.("actionsColumn") ?? "Actions";
  }
  return String(col?.key ?? "");
}

/** Header content for the table <th> (keeps React node headers like checkboxes). */
function getColumnHeaderContent(col, tColumn) {
  if (!isEmptyHeader(col?.header)) return col.header;
  if (col?.key === "select") return tColumn?.("selectColumn") ?? "Select";
  if (col?.key === "actions" || col?.key === "options") {
    return tColumn?.("actionsColumn") ?? "Actions";
  }
  return col?.header;
}

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
export function FilterField({ label, children, className, lableClass, icon: FieldIcon, iconClass, title, description, example, card = "sm" }) {
  const content = (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className={`flex items-center gap-1.5  text-[10px] font-black uppercase tracking-widest text-muted-foreground/80  ${lableClass}`}>
          {FieldIcon && <FieldIcon size={10} className={iconClass} />}
          {label}
        </label>
      )}
      {children}
    </div>
  );

  if (description) {
    return (
      <TutorialSpotlight title={title || label} description={description} example={example} card={card}>
        {content}
      </TutorialSpotlight>
    );
  }

  return content;
}

/* ══════════════════════════════════════════════════════════════
   TOOLBAR
══════════════════════════════════════════════════════════════ */
export const TableToolbar = memo(function TableToolbar({
  hasSearch,
  searchValue = "",
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search…",
  isFiltersOpen = false,
  onToggleFilters,
  hasActiveFilters = false,
  filterLabel = "Filters",
  actions = [],
  toolbarExtra = null,
}) {
  const { hasPermission } = useAuth();
  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); onSearch?.(); }
  };

  const { isTutorialMode } = useTutorial();
  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      if(action.hidden) return false;
      if (!action.permission) return true;
      return hasPermission(action.permission);
    });
  }, [actions, hasPermission]);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {hasSearch && <FloatingSearchInput
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onKeyDown={handleKeyDown}
        searchPlaceholder={searchPlaceholder}
      />}

      <div className="flex items-center gap-2 flex-wrap" style={{ pointerEvents: "auto" }}>
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

        {toolbarExtra}

        {filteredActions.map((action) => (
          <TutorialSpotlight key={action.key} title={action.label} description={action.description} example={action.example} card="sm">
            <motion.button
              key={action.key}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={action.onClick}
              type="button"
              disabled={action.disabled}
              data-getting-started={action.dataGettingStarted}
              data-getting-started-type={action.dataGettingStartedType}
              className={cn(
                ACTION_COLORS[action.color ?? "default"] ?? ACTION_COLORS.default,
                "disabled:opacity-50 disabled:cursor-not-allowed gap-1.5",
              )}
            >
              {action.icon}
              {action.label}
            </motion.button>
          </TutorialSpotlight>
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
  const { isTutorialMode } = useTutorial();

  const shouldElevateFilters = useMemo(() => {
    if (!isTutorialMode) return false;

    const checkChildren = (kids) => {
      let found = false;
      React.Children.forEach(kids, (child) => {
        if (!child) return;

        if (child.props && (child.props.description || child.props.example)) {
          found = true;
        }
      });
      return found;
    };

    // If children is an array with one element that has children, check those first
    const childrenArray = React.Children.toArray(children);
    if (childrenArray.length === 1 && childrenArray[0].props && childrenArray[0].props.children) {
      if (checkChildren(childrenArray[0].props.children)) {
        return true;
      }
    }

    return checkChildren(children);
  }, [isTutorialMode, children]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className=""
    >
      <div
        className="overflow-hidden !shadow-none mt-3 rounded-2xl border border-border/60 overflow-hidden main-card !p-0 backdrop-blur-sm"
        style={{
          ...(shouldElevateFilters ? {
            zIndex: 60,
            position: "relative",
          } : {}),
          ...(isTutorialMode ? { pointerEvents: "auto" } : {})
        }}
      >
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
  const fullSrc = avatarSrc(src);
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
  if (!images?.length) return <span className="text-muted-foreground/80 text-sm">—</span>;

  const MAX_VISIBLE = 5;
  const displayImages = images.slice(0, MAX_VISIBLE);
  const remainingCount = images.length - MAX_VISIBLE;

  return (
    <div className="flex items-center">
      {displayImages.map((img, idx) => {
        const fullSrc = avatarSrc(img.src);
        const isLastVisible = idx === MAX_VISIBLE - 1;
        const hasMore = remainingCount > 0;

        return (
          <motion.button
            key={`${img.src}-${idx}`}
            type="button"
            onClick={() => onOpen(fullSrc, img.alt)}
            style={{
              zIndex: MAX_VISIBLE - idx,
              marginInlineStart: idx === 0 ? 0 : -14
            }}
            whileHover={{ scale: 1.14, zIndex: 50, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-background shadow-md cursor-pointer bg-muted"
          >
            <img
              src={fullSrc}
              alt={img.alt}
              className={cn(
                "w-full h-full object-cover",
                (isLastVisible && hasMore) && "blur-[1.5px] brightness-75"
              )}
              loading="lazy"
            />

            {/* The +Count Overlay */}
            {isLastVisible && hasMore && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-bold text-xs">
                +{remainingCount + 1}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   COLUMN VISIBILITY + ORDER
══════════════════════════════════════════════════════════════ */
function SortableColumnRow({ id, label, checked, dragDisabled, disabled, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: dragDisabled || disabled,
    transition: { duration: 160, easing: "ease-out" },
  });

  const style = {
    // Lock axis + scale so the held row never stretches wide/tall
    transform: CSS.Transform.toString(
      transform
        ? { ...transform, x: 0, scaleX: 1, scaleY: 1 }
        : null,
    ),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 50 : undefined,
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 px-1.5 py-1.5 rounded-xl w-full max-w-full overflow-hidden border",
        isDragging
          ? "bg-card border-primary/45 shadow-[0_10px_24px_-6px_rgba(0,0,0,0.28)] ring-2 ring-primary/20"
          : "border-transparent hover:bg-muted/50",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={dragDisabled || disabled}
        className={cn(
          "p-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed touch-none",
          isDragging
            ? "text-primary cursor-grabbing"
            : "text-muted-foreground/70 hover:text-primary cursor-grab active:cursor-grabbing",
        )}
        aria-label="Reorder"
      >
        <GripVertical size={16} />
      </button>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="min-w-0 flex-1 flex items-center gap-2.5 px-1 py-1 rounded-lg text-start disabled:cursor-not-allowed"
      >
        <Checkbox
          checked={checked}
          className="size-5 rounded-md pointer-events-none shrink-0"
          size={14}
          tabIndex={-1}
        />
        <span className={cn(
          "text-sm truncate",
          isDragging ? "text-foreground font-medium" : checked ? "text-foreground" : "text-muted-foreground",
        )}>
          {label}
        </span>
      </button>
    </div>
  );
}

const ColumnVisibilityControl = memo(function ColumnVisibilityControl({
  columns = [],
  prefs = { order: [], hidden: [] },
  onConfirm,
  labels = {},
}) {
  const tCol = useTranslations("pagination.columnVisibility");
  const [open, setOpen] = useState(false);
  const [draftOrder, setDraftOrder] = useState(prefs.order);
  const [draftHidden, setDraftHidden] = useState(prefs.hidden);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const columnByKey = useMemo(() => {
    const map = new Map();
    columns.forEach((col) => {
      if (col?.key) map.set(col.key, col);
    });
    return map;
  }, [columns]);

  const orderedColumns = useMemo(
    () => draftOrder.map((key) => columnByKey.get(key)).filter(Boolean),
    [draftOrder, columnByKey],
  );

  const filteredColumns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orderedColumns;
    return orderedColumns.filter((col) =>
      getColumnDisplayLabel(col, tCol).toLowerCase().includes(q),
    );
  }, [orderedColumns, search, tCol]);

  const draftHiddenSet = useMemo(() => new Set(draftHidden), [draftHidden]);
  const visibleCount = orderedColumns.filter((col) => !draftHiddenSet.has(col.key)).length;
  const allSelected = orderedColumns.length > 0 && visibleCount === orderedColumns.length;
  const noneSelected = visibleCount === 0;
  const selectAllState = allSelected ? true : noneSelected ? false : "indeterminate";
  const canConfirm = visibleCount >= 1;
  const isSearching = search.trim().length > 0;
  const defaultOrder = useMemo(
    () => columns.map((col) => col.key).filter(Boolean),
    [columns],
  );
  const isDefaultOrder = useMemo(() => {
    if (draftOrder.length !== defaultOrder.length) return false;
    return draftOrder.every((key, i) => key === defaultOrder[i]);
  }, [draftOrder, defaultOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const resetDraft = useCallback(() => {
    const resolved = resolveTablePref(prefs, columns.map((c) => c.key).filter(Boolean));
    setDraftOrder(resolved.order);
    setDraftHidden(resolved.hidden);
    setSearch("");
  }, [prefs, columns]);

  const openPanel = (nextOpen) => {
    if (saving) return;
    if (nextOpen) resetDraft();
    setOpen(nextOpen);
  };

  const toggleKey = (key) => {
    if (saving) return;
    setDraftHidden((prev) => {
      const set = new Set(prev);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return [...set];
    });
  };

  const toggleSelectAll = () => {
    if (saving) return;
    if (allSelected) {
      setDraftHidden(orderedColumns.map((col) => col.key));
    } else {
      setDraftHidden([]);
    }
  };

  const handleResetOrder = () => {
    if (saving || isDefaultOrder) return;
    setDraftOrder(defaultOrder);
  };

  const handleDragEnd = (event) => {
    if (saving || isSearching) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraftOrder((prev) => {
      const oldIndex = prev.indexOf(active.id);
      const newIndex = prev.indexOf(over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleCancel = () => {
    if (saving) return;
    setOpen(false);
    resetDraft();
  };

  const handleOk = async () => {
    if (saving || !canConfirm) return;
    setSaving(true);
    try {
      await onConfirm?.({
        order: draftOrder,
        hidden: draftHidden,
      });
      setOpen(false);
      setSearch("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={openPanel}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          className="btn btn-sm btn-outline gap-1.5"
        >
          <Columns3 size={13} />
          {labels.columns ?? "Columns"}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            style={{ display: "flex" }}
          >
            <ChevronDown size={12} />
          </motion.span>
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[300px] p-0 overflow-hidden rounded-2xl border border-border/60 shadow-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => { if (saving) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (saving) e.preventDefault(); }}
      >
        <div className="px-4 pt-3.5 pb-2">
          <p className="text-sm font-bold text-foreground">
            {labels.chooseColumn ?? "Choose Column"}
          </p>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.search ?? "Search"}
              disabled={saving}
              className={cn(
                "w-full h-9 rounded-xl border border-border/60 bg-background/60",
                "text-sm ps-3 pe-9 outline-none",
                "focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            />
            <Search
              size={14}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
            />
          </div>
        </div>

        <div className="px-2 pb-1">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={saving}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/50 transition-colors text-start disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              className={cn(
                "size-5 shrink-0 rounded-md border flex items-center justify-center transition-colors",
                selectAllState === false
                  ? "border-input bg-background"
                  : "border-primary bg-primary text-primary-foreground",
              )}
              aria-hidden
            >
              {selectAllState === true && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {selectAllState === "indeterminate" && <Minus size={12} />}
            </span>
            <span className="text-sm font-medium text-foreground">
              {labels.selectAll ?? "Select All"}
            </span>
          </button>
        </div>

        <div className={cn("max-h-[260px] overflow-y-auto overflow-x-hidden px-2 pb-2", saving && "pointer-events-none opacity-60")}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredColumns.map((col) => col.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0.5 w-full max-w-full overflow-hidden">
                {filteredColumns.map((col) => (
                  <SortableColumnRow
                    key={col.key}
                    id={col.key}
                    label={getColumnDisplayLabel(col, tCol)}
                    checked={!draftHiddenSet.has(col.key)}
                    dragDisabled={isSearching}
                    disabled={saving}
                    onToggle={() => toggleKey(col.key)}
                  />
                ))}
                {filteredColumns.length === 0 && (
                  <p className="px-2 py-4 text-xs text-muted-foreground text-center">—</p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-border/50">
          <button
            type="button"
            onClick={handleResetOrder}
            disabled={saving || isDefaultOrder}
            className="btn btn-ghost btn-sm gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title={labels.resetOrder ?? "Reset order"}
          >
            <RotateCcw size={13} />
            {labels.resetOrder ?? "Reset order"}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn btn-ghost btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {labels.cancel ?? "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleOk}
              disabled={saving || !canConfirm}
              className="btn btn-solid btn-sm gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {labels.ok ?? "OK"}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

/* ══════════════════════════════════════════════════════════════
   MAIN TABLE
══════════════════════════════════════════════════════════════ */
export default function Table({
  searchValue = "", onSearchChange, onSearch, hasSearch = true, 
  actions = [], filters, hasActiveFilters = false, onApplyFilters,
  labels = {}, columns = [], data = [], tutorialData = [], isLoading = false,
  rowKey = (row, i) => row?.id ?? i,
  emptyState, striped = false, compact = false, hoverable = true,
  pagination = null, onPageChange,
  pageParamName = "page", limitParamName = "limit",
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS, className = "", flat = false,
  rowClassName = () => "", tutorialActions = false, toolbarExtra,
  showColumnVisibility = true,
  tableKey,
}) {
  const { isTutorialMode } = useTutorial();
  const { tablePreferences, updateTablePreferences } = useAuth();
  const displayData = isTutorialMode && tutorialData.length > 0 ? tutorialData : data;
  const isRTL = useIsRTL();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [imgModal, setImgModal] = useState({ open: false, src: "", alt: "" });
  const t = useTranslations("pagination");
  const tColumn = useCallback((key) => t(`columnVisibility.${key}`), [t]);
  const openImage = useCallback((src, alt = "") => setImgModal({ open: true, src, alt }), []);
  const closeImage = useCallback(() => setImgModal({ open: false, src: "", alt: "" }), []);
  const helpers = useMemo(() => ({ openImage }), [openImage]);

  const columnKeys = useMemo(
    () => columns.map((c) => c.key).filter(Boolean),
    [columns],
  );

  const [columnPrefs, setColumnPrefs] = useState(() => {
    if (!showColumnVisibility || !tableKey) return { order: [], hidden: [] };
    return resolveTablePref(readTablePrefsFromLS(tableKey), columnKeys);
  });

  // Apply prefs from AuthContext (loaded once per session, not per Table mount)
  useEffect(() => {
    if (!showColumnVisibility || !tableKey || tablePreferences == null) return;
    const fromServer = resolveTablePref(tablePreferences?.[tableKey], columnKeys);
    setColumnPrefs((prev) => {
      if (tablePrefsEqual(prev, fromServer)) return prev;
      writeTablePrefsToLS(tableKey, fromServer);
      return fromServer;
    });
  }, [showColumnVisibility, tableKey, tablePreferences, columnKeys]);

  // Keep prefs in sync when column definitions gain/lose keys
  useEffect(() => {
    if (!showColumnVisibility) return;
    setColumnPrefs((prev) => {
      const next = resolveTablePref(prev, columnKeys);
      return tablePrefsEqual(prev, next) ? prev : next;
    });
  }, [showColumnVisibility, columnKeys]);

  const handleConfirmColumnPrefs = useCallback(async (nextPrefs) => {
    const normalized = resolveTablePref(nextPrefs, columnKeys);
    const nextAll = await updateTablePreferences({ [tableKey]: normalized });
    const fromServer = resolveTablePref(nextAll?.[tableKey], columnKeys);
    setColumnPrefs(fromServer);
    if (tableKey) writeTablePrefsToLS(tableKey, fromServer);
  }, [tableKey, columnKeys, updateTablePreferences]);

  const visibleColumns = useMemo(() => {
    if (!showColumnVisibility) return columns;
    const byKey = new Map(columns.map((col) => [col.key, col]));
    const resolved = resolveTablePref(columnPrefs, columnKeys);
    const hidden = new Set(resolved.hidden);
    return resolved.order
      .filter((key) => !hidden.has(key))
      .map((key) => byKey.get(key))
      .filter(Boolean);
  }, [columns, showColumnVisibility, columnPrefs, columnKeys]);

  const columnVisibilityLabels = useMemo(() => ({
    columns: labels.columns ?? t("columnVisibility.columns"),
    chooseColumn: labels.chooseColumn ?? t("columnVisibility.chooseColumn"),
    search: labels.columnSearch ?? t("columnVisibility.search"),
    selectAll: labels.selectAll ?? t("columnVisibility.selectAll"),
    resetOrder: labels.resetOrder ?? t("columnVisibility.resetOrder"),
    ok: labels.ok ?? t("columnVisibility.ok"),
    cancel: labels.cancel ?? t("columnVisibility.cancel"),
  }), [labels, t]);

  const composedToolbarExtra = useMemo(() => {
    if (!showColumnVisibility || !tableKey) return toolbarExtra;
    return (
      <>
        <ColumnVisibilityControl
          columns={columns}
          prefs={resolveTablePref(columnPrefs, columnKeys)}
          onConfirm={handleConfirmColumnPrefs}
          labels={columnVisibilityLabels}
        />
        {toolbarExtra}
      </>
    );
  }, [
    showColumnVisibility,
    tableKey,
    toolbarExtra,
    columns,
    columnPrefs,
    columnKeys,
    handleConfirmColumnPrefs,
    columnVisibilityLabels,
  ]);

  const hasFilters = Boolean(filters);
  const stickyEnd = isRTL ? "left-0" : "right-0";
  const stickyShadow = isRTL
    ? "shadow-[8px_0_12px_-10px_rgba(0,0,0,0.15)] dark:shadow-[8px_0_12px_-10px_rgba(0,0,0,0.45)]"
    : "shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.15)] dark:shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.45)]";
  const shouldElevateHeader = useMemo(() => {
    if (!isTutorialMode) return false;

    // Returns true only if any column has both a header and a description
    return visibleColumns.some(col => Boolean(col.header) && Boolean(col.description));
  }, [isTutorialMode, visibleColumns]);
  return (
    <div className={cn("w-full", className)}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`relative ${!flat && "main-card  rounded-2xl border border-border/50 "} !p-0 overflow-hidden`}
        style={!flat ? { boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 6px 24px rgba(0,0,0,0.05)" } : {}}
      >

        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-border/40">
          <TableToolbar
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearch={onSearch}
            hasSearch={hasSearch}
            searchPlaceholder={labels.searchPlaceholder}
            isFiltersOpen={filtersOpen}
            onToggleFilters={hasFilters ? () => setFiltersOpen((v) => !v) : undefined}
            hasActiveFilters={hasActiveFilters}
            filterLabel={labels.filter}
            actions={actions}
            toolbarExtra={composedToolbarExtra}
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
        <div
          className="relative overflow-x-auto"
          style={isTutorialMode ? { pointerEvents: "auto" } : {}}
        >
          <ShadTable>
            {/* Header */}
            <TableHeader
              className="border-b border-border/40"
              style={{
                background: "color-mix(in oklab, var(--muted) 50%, var(--card))", ...(shouldElevateHeader
                  ? {
                    zIndex: 40,
                    position: "relative",
                  }
                  : {})
              }}
            >
              <TableRow className="hover:bg-transparent">
                {visibleColumns.map((col, idx) => {
                  const headerContent = getColumnHeaderContent(col, tColumn);
                  return (
                  <TableHead
                    key={`${col.key ?? "col"}-${idx}`}
                    className={cn(
                      "!px-5 whitespace-nowrap ltr:text-left rtl:text-right align-middle",
                      compact ? "py-3" : "py-3.5",
                      col.headClassName,
                      ACTION_KEYS.has(col.key) && cn("md:sticky md:z-30", stickyEnd, stickyShadow),
                    )}
                    style={ACTION_KEYS.has(col.key) ? {
                      background: "color-mix(in oklab, var(--muted) 50%, var(--card))",
                    } : {}}
                  >
                    {/* 1. TutorialSpotlight goes INSIDE the TableHead */}
                    <TutorialSpotlight
                      title={typeof headerContent === "string" ? headerContent : getColumnDisplayLabel(col, tColumn)}
                      description={col.description}
                      example={col.example}
                      overview={true}
                      className="inline-block w-fit p-2!"
                    >
                      {/* 2. Your content stays wrapped by the spotlight */}
                      <motion.span
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.035 }}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/80"
                      >
                        {headerContent}
                      </motion.span>
                    </TutorialSpotlight>
                  </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            {/* Body */}
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  <TableSkeleton key="skel" columns={visibleColumns} rows={Number(pagination?.per_page ?? 6)} compact={compact} />

                ) : displayData.length === 0 ? (
                  <TableRow key="empty">
                    <TableCell colSpan={Math.max(visibleColumns.length, 1)} className="py-20">
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
                            <Package
                              size={22}
                              className="flex-shrink-0" // يمنع تقلص الأيقونة
                              style={{ color: "color-mix(in oklab, var(--muted-foreground) 40%, transparent)" }}
                            />
                          </motion.div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-bold text-foreground">
                            {emptyState ?? labels.emptyTitle ?? t("common.emptyTitle")}
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            {labels.emptySubtitle ?? t("common.emptySubtitle")}
                          </p>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>

                ) : (
                  displayData.map((row, i) => (
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
                        typeof rowClassName === "function" ? rowClassName(row, i) : rowClassName
                      )}
                    >
                      {visibleColumns.map((col, idx) => {
                        if (col.type === "img") return (
                          <TableCell key={`${col.key ?? "col"}-${idx}`} className={cn("!px-5", compact ? "py-2.5" : "py-3.5", col.className)}>
                            {!row[col.key] && typeof col.cell === "function" ? col.cell(row, i, helpers) : <ImgCell src={row[col.key]} alt={col.header ?? ""} onOpen={openImage} />}
                          </TableCell>
                        );

                        if (col.type === "imgs") {
                          const imgs = normalizeImages(row[col.key], col.header ?? "");
                          return (
                            <TableCell key={`${col.key ?? "col"}-${idx}`} className={cn("!px-5", compact ? "py-2.5" : "py-3.5", col.className)}>
                              <ImgsCell images={imgs} onOpen={openImage} />
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell
                            key={`${col.key ?? "col"}-${idx}`}
                            className={cn(
                              "!px-5 text-sm whitespace-nowrap ltr:text-left rtl:text-right",
                              compact ? "py-2.5" : "py-3.5",
                              col.className,
                              ACTION_KEYS.has(col.key) && cn("md:sticky md:z-20", stickyEnd, stickyShadow),
                            )}
                            style={ACTION_KEYS.has(col.key) ? {
                              background: "color-mix(in oklab, var(--card) 97%, transparent)",
                              ...(tutorialActions ? { zIndex: 60 } : {})
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
export function FloatingSearchInput({ searchValue, onSearchChange, onKeyDown, searchPlaceholder, disabled }) {
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
          disabled={disabled}
          className={cn(
            "absolute inset-0 w-full h-full bg-transparent !outline-none",
            "text-sm ps-9 pe-4 pt-0.5",
            "rounded-xl text-foreground",
            "[&:-webkit-autofill]:bg-transparent"
          )}
        />
      </div>
    </div>
  );
}