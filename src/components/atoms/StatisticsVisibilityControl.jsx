"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, RotateCcw, Settings2, X } from "lucide-react";

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

/**
 * Side sheet to toggle which statistics cards are visible.
 * Parent owns prefs persistence (PageHeader / AuthContext), same as ColumnVisibilityControl.
 */
export default function StatisticsVisibilityControl({
  stats = [],
  prefs = { hidden: [] },
  onConfirm,
  labels = {},
  className,
}) {
  const t = useTranslations("pagination.statisticsVisibility");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [open, setOpen] = useState(false);
  const [draftHidden, setDraftHidden] = useState(prefs.hidden ?? []);
  const [saving, setSaving] = useState(false);

  const resetDraft = useCallback(() => {
    setDraftHidden(Array.isArray(prefs.hidden) ? [...prefs.hidden] : []);
  }, [prefs.hidden]);

  const openSheet = (nextOpen) => {
    if (saving) return;
    if (nextOpen) resetDraft();
    setOpen(nextOpen);
  };

  const draftHiddenSet = useMemo(() => new Set(draftHidden), [draftHidden]);
  const visibleCount = useMemo(
    () => stats.filter((s) => s.key && !draftHiddenSet.has(s.key)).length,
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
      await onConfirm?.({ hidden: draftHidden });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button_
        size="sm"
        label={labels.button ?? t("button")}
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
                  {labels.title ?? t("title")}
                </SheetTitle>
                <SheetDescription className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {labels.subtitle ?? t("subtitle")}
                </SheetDescription>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={handleCancel}
                className="shrink-0 size-9 rounded-[10px] border border-border bg-card grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                aria-label={labels.cancel ?? t("cancel")}
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
                {labels.listTitle ?? t("listTitle")}
              </strong>
              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {t("visibleCount", { count: visibleCount, total: stats.length })}
              </span>
            </div>

            {stats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                {labels.empty ?? t("empty")}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.map((stat) => {
                  if (!stat.key) return null;
                  const Icon = stat.icon;
                  const isHidden = draftHiddenSet.has(stat.key);

                  return (
                    <li
                      key={stat.key}
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
                          {labels.orderCount
                            ? labels.orderCount(stat.value)
                            : t("orderCount", { count: Number(stat.value) || 0 })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleKey(stat.key)}
                        className={cn(
                          "shrink-0 size-9 rounded-lg grid place-items-center transition-colors",
                          isHidden
                            ? "text-muted-foreground hover:bg-muted"
                            : "text-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]",
                        )}
                        title={isHidden ? (labels.show ?? t("show")) : (labels.hide ?? t("hide"))}
                        aria-label={isHidden ? (labels.show ?? t("show")) : (labels.hide ?? t("hide"))}
                      >
                        {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="rounded-xl border border-[color-mix(in_oklab,var(--primary)_22%,transparent)] bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
              {labels.tip ?? t("tip")}
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
              {labels.reset ?? t("reset")}
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
                {labels.cancel ?? t("cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={handleSave}
                className="rounded-[10px] min-w-[110px]"
              >
                {saving ? (labels.saving ?? t("saving")) : (labels.save ?? t("save"))}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
