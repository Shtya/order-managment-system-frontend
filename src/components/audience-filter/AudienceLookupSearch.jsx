"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { resolveAudienceEntityOptions, searchAudienceEntities } from "./lookups";

function selectedIds(value, multiple) {
  if (multiple) return (Array.isArray(value) ? value : []).map(String).filter(Boolean);
  return value ? [String(value)] : [];
}

export function AudienceLookupSearch({
  field,
  kind,
  value,
  onChange,
  multiple = false,
  disabled,
  error,
}) {
  const t = useTranslations("audienceFilter");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [labels, setLabels] = useState({});
  const debounceRef = useRef(null);
  const requestRef = useRef(0);
  const hydratedRef = useRef(new Set());
  const ids = selectedIds(value, multiple);
  const idsKey = ids.join(",");

  const mergeLabels = useCallback((items) => {
    if (!items?.length) return;
    setLabels((prev) => {
      const next = { ...prev };
      for (const item of items) next[String(item.value)] = item.label;
      return next;
    });
  }, []);

  useEffect(() => {
    const currentIds = idsKey.split(",").filter(Boolean);
    const missing = currentIds.filter((id) => !hydratedRef.current.has(id));
    if (!missing.length) return;
    missing.forEach((id) => hydratedRef.current.add(id));
    let cancelled = false;
    (async () => {
      const resolved = await resolveAudienceEntityOptions(field, missing);
      if (cancelled) return;
      mergeLabels(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [field, idsKey, mergeLabels]);

  const loadPage = useCallback(
    async ({ q, cursor: nextCursor, append }) => {
      const requestId = ++requestRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const result = await searchAudienceEntities(kind, { q, cursor: nextCursor, limit: 20 });
        if (requestId !== requestRef.current) return;
        mergeLabels(result.data);
        setRows((prev) => (append ? [...prev, ...result.data] : result.data));
        setHasMore(result.hasMore);
        setCursor(result.nextCursor);
      } catch {
        if (requestId !== requestRef.current) return;
        if (!append) setRows([]);
        setHasMore(false);
        setCursor(null);
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [kind, mergeLabels],
  );

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPage({ q: query.trim(), append: false });
    }, query.trim() ? 250 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadPage, open, query]);

  const toggle = (id, label) => {
    if (disabled) return;
    if (label) mergeLabels([{ value: id, label }]);
    if (!multiple) {
      onChange(id);
      setOpen(false);
      return;
    }
    const exists = ids.includes(id);
    onChange(exists ? ids.filter((item) => item !== id) : [...ids, id]);
  };

  const display = ids.map((id) => labels[id] || id);
  const placeholder = kind === "sku" ? t("searchVariants") : t("searchProducts");

  return (
    <Popover open={open && !disabled} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "relative min-h-10 w-full rounded-md border bg-background px-3 pe-8 py-2 text-sm text-start disabled:opacity-60",
            error ? "border-destructive" : "border-border",
          )}
        >
          {display.length ? (
            <span className="flex flex-wrap gap-1">
              {display.map((label, index) => (
                <span
                  key={`${ids[index]}-${label}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs"
                >
                  <span className="truncate">{label}</span>
                  {multiple ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggle(ids[index]);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          toggle(ids[index]);
                        }
                      }}
                    >
                      <X size={10} />
                    </span>
                  ) : null}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden z-[80]"
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            {/* <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /> */}
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="ps-12! h-9"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              {t("valuesLoading")}
            </div>
          ) : rows.length ? (
            rows.map((row) => {
              const active = ids.includes(String(row.value));
              return (
                <button
                  type="button"
                  key={String(row.value)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted text-start"
                  onClick={() => toggle(String(row.value), row.label)}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border shrink-0",
                      active && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {active && <Check size={10} />}
                  </span>
                  <span className="truncate">{row.label}</span>
                </button>
              );
            })
          ) : (
            <div className="px-2 py-3 text-sm text-muted-foreground">{t("noLookupResults")}</div>
          )}
        </div>
        {hasMore && !loading ? (
          <div className="border-t border-border p-2">
            <button
              type="button"
              disabled={loadingMore || !cursor}
              onClick={() => loadPage({ q: query.trim(), cursor, append: true })}
              className="w-full rounded-md px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
            >
              {loadingMore ? t("valuesLoading") : t("loadMoreValues")}
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
