"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Lock,
  Info,
  Loader2,
  Link2,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import { useGettingStarted } from "@/context/GettingStartedContext";
import DependencySidebar, {
  getItemTitle,
  getItemDescription,
} from "./atoms/DependencySidebar";

function ItemsSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-80 shrink-0 rounded-xl border border-border bg-card p-4 flex flex-col"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="skeleton size-8 rounded-full shrink-0" />
            <div className="skeleton size-12 rounded-xl shrink-0" />
          </div>
          <div className="skeleton h-4 w-1/2 rounded-md" />
          <div className="mt-1 flex flex-col gap-2 flex-1">
            <div className="skeleton h-3 w-full rounded-md" />
            <div className="skeleton h-3 w-4/5 rounded-md" />
            <div className="skeleton h-3 w-2/3 rounded-md" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 shrink-0">
            <div className="skeleton h-8 w-24 rounded-full shrink-0" />
            <div className="skeleton size-9 rounded-xl shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressRing({ value, size = 84, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative shrink-0 grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-primary/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-all duration-700 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-bold text-foreground tabular-nums">
          {clamped}%
        </span>
      </div>
    </div>
  );
}

function StepNumberBadge({ n, completed, locked }) {
  const base =
    "shrink-0 size-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums transition-colors";
  if (completed) {
    return (
      <div
        className={cn(
          base,
          "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20",
        )}
      >
        <CheckCircle2 className="size-5" />
      </div>
    );
  }
  if (locked) {
    return (
      <div
        className={cn(
          base,
          "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
        )}
      >
        <span>{n}</span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        base,
        "bg-primary text-white shadow-sm shadow-primary/20 ring-4 ring-primary/10",
      )}
    >
      <span>{n}</span>
    </div>
  );
}

function GettingStartedItemCard({
  item,
  index,
  locale,
  t,
  tStatus,
  onItemHandled,
  openSidebarForItem,
  pushSidebarItem,
  getDependenciesForItem,
  canStartItem,
  startTour,
  completedSet,
}) {
  const isRtl = locale === "ar";
  const Chevron = isRtl ? ChevronRight : ChevronLeft;

  const completed = item?.completed === true || completedSet?.has(item?.key);

  const deps = getDependenciesForItem(item?.key);
  const hasDependencies = Array.isArray(deps) && deps.length > 0;
  const canStart = canStartItem(item);
  const locked = !completed && !canStart;
  const Icon = item?.icon || Info;

  const onClick = useCallback(() => {
    if (!item) return;
    openSidebarForItem(item.key);
  }, [item, openSidebarForItem]);

  const handleStart = useCallback(() => {
    if (!item) return;
    startTour(item).then((result) => onItemHandled?.(result));
  }, [item, startTour, onItemHandled]);

  return (
    <div
     dir={isRtl}
      data-card
      className={cn(
        "group flex flex-col rounded-xl border p-4 text-start transition-all w-full h-full",
        "hover:shadow-sm active:scale-[0.998]",
        completed
          ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10"
          : !locked
            ? "border-primary/20 bg-primary/[0.03] ring-2 ring-primary/10 hover:ring-primary/20 hover:bg-primary/[0.05] dark:border-primary/30"
            : "border-border bg-card hover:bg-accent/30",
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <StepNumberBadge n={index + 1} completed={completed} />

        <div
          className={cn(
            "shrink-0 size-12 rounded-xl flex items-center justify-center",
            completed
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : locked
                ? "bg-muted text-muted-foreground"
                : "bg-primary/12 text-primary",
          )}
        >
          <Icon className="size-6" />
        </div>
      </div>

      <p
        className={cn(
          "font-semibold text-base leading-snug",
          completed
            ? "text-emerald-700 dark:text-emerald-400 line-through decoration-emerald-300/60 dark:decoration-emerald-500/40"
            : "text-foreground",
        )}
      >
        {getItemTitle(item, locale)}
      </p>

      <p className="text-sm text-muted-foreground mt-1 line-clamp-3 flex-1">
        {getItemDescription(item, locale)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {completed ? (
            <>
              <Badge
                variant="outline"
                className="rounded-full text-xs h-8 px-3 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                <CheckCircle2 className="size-3.5 -ms-0.5" />
                <span>{tStatus("completed")}</span>
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-transparent dark:border-emerald-500/30 dark:text-emerald-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStart();
                }}
              >
                <span>{tStatus("replay")}</span>
                <ArrowRight className={cn("size-3.5", isRtl && "rotate-180")} />
              </Button>
            </>
          ) : locked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-slate-300 bg-slate-100/80 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <span>{tStatus("viewRequirements") || "عرض المتطلبات"}</span>
              <ArrowRight className={cn("size-3.5", isRtl && "rotate-180")} />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-primary/30 bg-white text-primary hover:bg-primary hover:text-white dark:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                startTour(item).then((result) => onItemHandled?.(result));
              }}
            >
              <span>{tStatus("startNow")}</span>
              <ArrowRight className={cn("size-3.5", isRtl && "rotate-180")} />
            </Button>
          )}
        </div>

        <div
          className={cn(
            "size-9 rounded-xl grid place-items-center transition-colors shrink-0",
            completed
              ? "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 dark:text-emerald-400"
              : locked
                ? "bg-muted text-muted-foreground group-hover:bg-muted/80"
                : "bg-primary/10 text-primary group-hover:bg-primary/20",
          )}
        >
          <Chevron className={cn("size-4", !isRtl && "rotate-180")} />
        </div>
      </div>
    </div>
  );
}

function OnboardingCarousel({
  items,
  locale,
  t,
  tStatus,
  onItemHandled,
  openSidebarForItem,
  pushSidebarItem,
  getDependenciesForItem,
  canStartItem,
  startTour,
  completedSet,
  hasMoreGroups,
}) {
  return (
    <div className="flex flex-col gap-3">
      <HorizontalScroll
        slideClassName="px-2"
        prevLabel={t("tutorial.previous")}
        nextLabel={t("tutorial.next")}
      >
        {items.map((item, index) => (
          <GettingStartedItemCard
            key={item.key || item.id || index}
            item={item}
            index={index}
            locale={locale}
            t={t}
            tStatus={tStatus}
            onItemHandled={onItemHandled}
            openSidebarForItem={openSidebarForItem}
            pushSidebarItem={pushSidebarItem}
            getDependenciesForItem={getDependenciesForItem}
            canStartItem={canStartItem}
            startTour={startTour}
            completedSet={completedSet}
          />
        ))}
      </HorizontalScroll>

      {hasMoreGroups && (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary/40" />
          <span>{t("moreGroupsComing")}</span>
        </p>
      )}
    </div>
  );
}

export default function GettingStartedPage() {
  const locale = useLocale() || "en";
  const isRtl = locale === "ar";
  const tProgress = useTranslations("gettingStarted.progress");
  const tStatus = useTranslations("gettingStarted.status");
  const t = useTranslations("gettingStarted");

  const {
    items,
    isLoading,
    achievementPercent,
    totalCompleted,
    completedSet,
    openSidebarForItem,
    pushSidebarItem,
    getDependenciesForItem,
    canStartItem,
    startTour,
  } = useGettingStarted();

  const onItemHandled = useCallback((result) => {
    if (result?.placeholder) {
      console.log("[GettingStartedPage] Tour placeholder result:", result);
    }
  }, []);

  const sortedItems = useMemo(
    () =>
      [...(items || [])].sort((a, b) => {
        const aOrder = typeof a.sortOrder === "number" ? a.sortOrder : 0;
        const bOrder = typeof b.sortOrder === "number" ? b.sortOrder : 0;
        return aOrder - bOrder;
      }),
    [items],
  );

  const totalItems = sortedItems.length;
  const allComplete = items.length > 0 && totalCompleted === items.length;

  // Group items by groupNumber (derived dynamically, never hardcoded) and
  // compute progressive visibility: a group becomes visible only when every
  // item in the previous group is completed. Once visible it stays visible.
  const { visibleItems, hasMoreGroups } = useMemo(() => {
    const groupsMap = new Map();
    for (const item of sortedItems) {
      const group = typeof item.groupNumber === "number" ? item.groupNumber : 1;
      if (!groupsMap.has(group)) groupsMap.set(group, []);
      groupsMap.get(group).push(item);
    }

    const groups = Array.from(groupsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([groupNumber, groupItems]) => ({
        groupNumber,
        items: [...groupItems].sort((a, b) => {
          const aOrder = typeof a.sortOrder === "number" ? a.sortOrder : 0;
          const bOrder = typeof b.sortOrder === "number" ? b.sortOrder : 0;
          return aOrder - bOrder;
        }),
      }));

    if (groups.length === 0) return { visibleItems: [], hasMoreGroups: false };

    const visible = [];
    let prevGroupComplete = true;
    for (const group of groups) {
      if (!prevGroupComplete) break; // lock all future groups
      visible.push(...group.items);
      prevGroupComplete = group.items.every((it) => completedSet.has(it.key));
    }

    return {
      visibleItems: visible,
      hasMoreGroups: visible.length < sortedItems.length,
    };
  }, [sortedItems, completedSet]);

  return (
    <div className="w-full px-4 sm:px-6 py-6 sm:py-10">
      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="p-0">
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 border-b border-border/70">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-end">
                <p className="text-sm font-medium text-muted-foreground">
                  {tProgress("label")}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-foreground tabular-nums">
                  <span className="text-primary">{totalCompleted}</span>
                  <span className="text-muted-foreground mx-1">
                    {tProgress("of")}
                  </span>
                  <span>{totalItems}</span>
                  <span className="text-muted-foreground ms-1 text-sm">
                    {tProgress("items")}
                  </span>
                </p>
                <div className="mt-2 w-40 sm:w-48">
                  <Progress value={achievementPercent} />
                </div>
              </div>
              <ProgressRing value={achievementPercent} />
            </div>
          </div>

          {allComplete && (
            <div className="mx-5 sm:mx-8 mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-teal-500/10">
              <div className="shrink-0 grid place-items-center size-11 rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                <PartyPopper className="size-6" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {t("allComplete.title")}
                </p>
                <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80 leading-relaxed">
                  {t("allComplete.message")}
                </p>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-8">
            {isLoading ? (
              <ItemsSkeleton />
            ) : sortedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Info className="size-10 text-muted-foreground/60" />
                </div>
                <p className="text-base font-semibold text-foreground">
                  {t("empty")}
                </p>
              </div>
            ) : (
              <OnboardingCarousel
                items={visibleItems}
                locale={locale}
                t={t}
                tStatus={tStatus}
                onItemHandled={onItemHandled}
                openSidebarForItem={openSidebarForItem}
                pushSidebarItem={pushSidebarItem}
                getDependenciesForItem={getDependenciesForItem}
                canStartItem={canStartItem}
                startTour={startTour}
                completedSet={completedSet}
                hasMoreGroups={hasMoreGroups}
              />
            )}
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            <div className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border/60 p-4">
              <Info className="size-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("footer")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DependencySidebar onItemHandled={onItemHandled} />
    </div>
  );
}
