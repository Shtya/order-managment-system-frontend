"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, RotateCcw, Settings2, X } from "lucide-react";
import toast from "react-hot-toast";

import Button_ from "@/components/atoms/Button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";

export const ORDER_STATS_PREFS_LS_KEY = "orderStatisticsPreferences";

export function normalizeOrderStatsPref(value) {
  if (Array.isArray(value)) {
    return { hidden: value.filter((k) => typeof k === "string") };
  }
  if (value && typeof value === "object") {
    return {
      hidden: Array.isArray(value.hidden)
        ? value.hidden.filter((k) => typeof k === "string")
        : [],
    };
  }
  return { hidden: [] };
}

/** Keep saved hidden keys; only drop unknowns once we know current keys. */
export function resolveOrderStatsPref(prefs, statKeys = []) {
  const { hidden: savedHidden } = normalizeOrderStatsPref(prefs);
  if (!statKeys?.length) {
    return { hidden: savedHidden };
  }
  const keySet = new Set(statKeys.filter(Boolean));
  return {
    hidden: savedHidden.filter((key) => keySet.has(key)),
  };
}

export function orderStatsPrefsEqual(a, b) {
  const na = normalizeOrderStatsPref(a);
  const nb = normalizeOrderStatsPref(b);
  if (na.hidden.length !== nb.hidden.length) return false;
  const ha = new Set(na.hidden);
  return nb.hidden.every((k) => ha.has(k));
}

export function readOrderStatsPrefsFromLS() {
  if (typeof window === "undefined") return { hidden: [] };
  try {
    const raw = localStorage.getItem(ORDER_STATS_PREFS_LS_KEY);
    if (!raw) return { hidden: [] };
    return normalizeOrderStatsPref(JSON.parse(raw));
  } catch {
    return { hidden: [] };
  }
}

export function writeOrderStatsPrefsToLS(prefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ORDER_STATS_PREFS_LS_KEY,
      JSON.stringify(normalizeOrderStatsPref(prefs)),
    );
  } catch {
    // Ignore storage failures
  }
}

/** Current hidden keys: localStorage immediately, then AuthContext when loaded. */
export function useOrderStatsVisibility(statKeys = []) {
  const { orderStatisticsPreferences } = useAuth();
  const keysSig = useMemo(
    () => (Array.isArray(statKeys) ? statKeys.filter(Boolean).join("\0") : ""),
    [statKeys],
  );

  // Always seed from LS so hidden cards apply before stats/API finish loading
  const [prefs, setPrefs] = useState(() =>
    normalizeOrderStatsPref(readOrderStatsPrefsFromLS()),
  );

  useEffect(() => {
    const keys = keysSig ? keysSig.split("\0") : [];

    if (orderStatisticsPreferences == null) {
      const fromLs = resolveOrderStatsPref(readOrderStatsPrefsFromLS(), keys);
      setPrefs((prev) => (orderStatsPrefsEqual(prev, fromLs) ? prev : fromLs));
      return;
    }

    const fromServer = resolveOrderStatsPref(orderStatisticsPreferences, keys);
    setPrefs((prev) => {
      if (orderStatsPrefsEqual(prev, fromServer)) return prev;
      writeOrderStatsPrefsToLS(fromServer);
      return fromServer;
    });
  }, [orderStatisticsPreferences, keysSig]);

  return prefs;
}

/**
 * Header button + side sheet to control which order statistics cards are visible.
 * Visibility only (no reordering). Persists via AuthContext + localStorage.
 */
export default function OrderStatsVisibilityControl({
  stats = [],
  className,
}) {
  const t = useTranslations("orders.statsVisibility");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { updateOrderStatisticsPreferences } = useAuth();

  const statKeys = useMemo(
    () => stats.map((s) => s.code).filter(Boolean),
    [stats],
  );

  const prefs = useOrderStatsVisibility(statKeys);

  const [open, setOpen] = useState(false);
  const [draftHidden, setDraftHidden] = useState(prefs.hidden);
  const [saving, setSaving] = useState(false);

  const resetDraft = useCallback(() => {
    setDraftHidden(resolveOrderStatsPref(prefs, statKeys).hidden);
  }, [prefs, statKeys]);

  const openSheet = (nextOpen) => {
    if (saving) return;
    if (nextOpen) resetDraft();
    setOpen(nextOpen);
  };

  const draftHiddenSet = useMemo(() => new Set(draftHidden), [draftHidden]);
  const visibleCount = useMemo(
    () => stats.filter((s) => s.code && !draftHiddenSet.has(s.code)).length,
    [stats, draftHiddenSet],
  );

  const toggleKey = (key) => {
    if (saving || !key) return;
    setDraftHidden((prev) => {
      const set = new Set(prev);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return [...set];
    });
  };

  const handleReset = () => {
    if (saving) return;
    setDraftHidden([]);
  };

  const handleCancel = () => {
    if (saving) return;
    setOpen(false);
    resetDraft();
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const normalized = resolveOrderStatsPref({ hidden: draftHidden }, statKeys);
      const fromServer = await updateOrderStatisticsPreferences(normalized);
      writeOrderStatsPrefsToLS(
        resolveOrderStatsPref(fromServer, statKeys),
      );
      setOpen(false);
      toast.success(t("saved"));
    } catch (error) {
      console.error("Failed to save order statistics preferences:", error);
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button_
        size="sm"
        label={t("button")}
        variant="outline"
        className={cn("pointer-events-auto!", className)}
        onClick={() => openSheet(true)}
        icon={<Settings2 size={18} />}
      />

      <Sheet open={open} onOpenChange={openSheet}>
        <SheetContent
          side={isRtl ? "right" : "left"}
          showCloseButton={false}
          dir={isRtl ? "rtl" : "ltr"}
          className={cn(
            "w-full sm:max-w-md h-full flex flex-col gap-0 p-0 bg-card",
            isRtl ? "border-l-0 border-r border-border" : "border-r-0 border-l border-border",
          )}
          onInteractOutside={(e) => {
            if (saving) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (saving) e.preventDefault();
          }}
        >
          <SheetHeader className="border-b border-border px-5 py-5 text-start space-y-1 bg-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-[19px] font-bold tracking-tight text-foreground">
                  {t("title")}
                </SheetTitle>
                <SheetDescription className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {t("subtitle")}
                </SheetDescription>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={handleCancel}
                className="shrink-0 size-9 rounded-[10px] border border-border bg-card grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                aria-label={t("cancel")}
              >
                <X size={16} />
              </button>
            </div>
          </SheetHeader>

          <div
            className={cn(
              "flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 bg-card",
              saving && "pointer-events-none opacity-60",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <strong className="text-[13px] font-semibold text-foreground">
                {t("listTitle")}
              </strong>
              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {t("visibleCount", { count: visibleCount, total: stats.length })}
              </span>
            </div>

            {stats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.map((stat) => {
                  if (!stat.code) return null;
                  const Icon = stat.icon;
                  const isHidden = draftHiddenSet.has(stat.code);

                  return (
                    <li
                      key={stat.code}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors",
                        isHidden
                          ? "border border-dashed border-border bg-muted/40"
                          : "border border-border bg-card hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))] hover:shadow-[0_4px_12px_color-mix(in_oklab,var(--primary)_8%,transparent)]",
                      )}
                    >
                      <span
                        className={cn(
                          "size-8 shrink-0 rounded-[9px] grid place-items-center border",
                          isHidden
                            ? "bg-muted border-border text-muted-foreground"
                            : "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] border-[color-mix(in_oklab,var(--primary)_22%,transparent)] text-[var(--primary)]",
                        )}
                      >
                        {Icon ? <Icon size={14} /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-[13px] font-semibold truncate",
                            isHidden ? "text-muted-foreground" : "text-foreground",
                          )}
                        >
                          {stat.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {t("orderCount", { count: Number(stat.value) || 0 })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleKey(stat.code)}
                        className={cn(
                          "shrink-0 size-9 rounded-lg grid place-items-center transition-colors",
                          isHidden
                            ? "text-muted-foreground hover:bg-muted"
                            : "text-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]",
                        )}
                        title={isHidden ? t("show") : t("hide")}
                        aria-label={isHidden ? t("show") : t("hide")}
                      >
                        {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="rounded-xl border border-[color-mix(in_oklab,var(--primary)_22%,transparent)] bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
              {t("tip")}
            </div>
          </div>

          <SheetFooter className="border-t border-border px-5 py-4 flex-row flex-wrap items-center justify-between gap-2 sm:space-x-0 bg-card">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving || draftHidden.length === 0}
              onClick={handleReset}
              className="rounded-[10px] gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 bg-card"
            >
              <RotateCcw size={14} />
              {t("reset")}
            </Button>
            <div className="flex items-center gap-2 ms-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={handleCancel}
                className="rounded-[10px] bg-card border-[color-mix(in_oklab,var(--primary)_35%,transparent)] text-[var(--primary)]"
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={handleSave}
                className="rounded-[10px] min-w-[110px]"
              >
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
