"use client";

import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronRight,
  ChevronLeft,
  Info,
  ArrowLeft,
  FileText,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useGettingStarted } from "@/context/GettingStartedContext";
import { ScrollArea } from "@/components/ui/scroll-area";

export function getItemTitle(item, locale) {
  if (!item) return "";
  if (typeof item.title === "string") return item.title;
  return locale === "ar"
    ? item.title?.ar || item.title?.en || ""
    : item.title?.en || item.title?.ar || "";
}

export function getItemDescription(item, locale) {
  if (!item || !item.description) return "";
  if (typeof item.description === "string") return item.description;
  return locale === "ar"
    ? item.description?.ar || item.description?.en || ""
    : item.description?.en || item.description?.ar || "";
}

function handleItemClick({
  item,
  pushSidebarItem,
  getDependenciesForItem,
  canStartItem,
  startTour,
  onItemHandled,
  closeSidebar
}) {
  if (!item) return;
  const deps = getDependenciesForItem(item.key);
  
  if (deps.length === 0 && canStartItem(item)) {
    console.log("start", closeSidebar)
    closeSidebar?.();
    startTour(item).then((result) => {
      onItemHandled?.(result);
    });
  } else {
    pushSidebarItem(item.key);
  }
}

function DependencyCard({
  depItem,
  locale,
  tgs,
  getDependenciesForItem,
  canStartItem,
  startTour,
  closeSidebar,
  pushSidebarItem,
  onItemHandled,
}) {
  const isRtl = locale === "ar";
  const BackArrow = isRtl ? ChevronRight : ChevronLeft;
  const Icon = depItem?.icon || Info;
  const isCompleted = depItem?.completed === true;

  return (
    <button
      type="button"
      onClick={() => {
          console.log("before start: ", closeSidebar)
          handleItemClick({
          item: depItem,
          pushSidebarItem,
          getDependenciesForItem,
          canStartItem,
          startTour,
          onItemHandled,
          closeSidebar
        })}
      }
      className={cn(
        "group w-full rounded-2xl border bg-white dark:bg-card",
        "transition-all duration-200 active:scale-[0.995]",
        "hover:shadow-sm",
        isCompleted
          ? "border-green-500/40 hover:border-green-500/60 bg-green-50/40 dark:bg-green-500/5"
          : "border-border/70 hover:border-primary/40 hover:bg-accent/30",
      )}
    >
      <div className="flex items-stretch">
        <div
          className={cn(
            "shrink-0 flex items-center justify-center px-4 sm:px-5",
            "border-s border-border/60",
            isRtl ? "border-s-0 border-e" : "border-e-0 border-s",
          )}
        >
          <BackArrow className={`size-5 text-muted-foreground group-hover:text-primary transition-colors ${isRtl && "rotate-180"}`} />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-5 text-end">
          <p className="flex items-center justify-end gap-2 text-base font-semibold text-foreground leading-snug">
            {getItemTitle(depItem, locale)}
            {isCompleted && (
              <CheckCircle2 className="size-4 text-green-600 shrink-0" />
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {getItemDescription(depItem, locale)}
          </p>
          {isCompleted && (
            <p className="mt-2 text-xs font-medium text-green-600">
              {tgs("status.completed")}
            </p>
          )}
        </div>

        <div
          className={cn(
            "shrink-0 flex items-center justify-center",
            "ps-4 sm:ps-5 pe-5 sm:pe-6",
          )}
        >
          <div
            className={cn(
              "size-12 sm:size-14 rounded-2xl flex items-center justify-center",
              isCompleted
                ? "bg-green-500/10 text-green-600"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-6 sm:size-7" />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function DependencySidebar({ onItemHandled }) {
  const locale = useLocale() || "en";
  const isRtl = locale === "ar";

  const t = useTranslations("gettingStarted.sidebar");
  const tgs = useTranslations("gettingStarted");

  const ChevronBack = isRtl ? ChevronRight : ChevronLeft;
  const StepIconArrow = isRtl ? ArrowLeft : ChevronRight;

  const {
    sidebarOpen,
    closeSidebar,
    currentSidebarItemKey,
    sidebarDepth,
    getItemByKey,
    getDependenciesForItem,
    canStartItem,
    startTour,
    pushSidebarItem,
    popSidebarItem,
  } = useGettingStarted();

  const currentItem = currentSidebarItemKey ? getItemByKey(currentSidebarItemKey) : null;
  const dependencies = useMemo(
    () => (currentItem ? getDependenciesForItem(currentItem.key) : []),
    [currentItem, getDependenciesForItem],
  );
  const canStartCurrent = currentItem ? canStartItem(currentItem) : false;
  const currentCompleted = currentItem?.completed === true;
  const CurrentIcon = currentItem?.icon || Info;
  const currentTypeLabel = currentItem?.completionType
    ? tgs(`types.${currentItem.completionType}`)
    : "";

  return (
    <Sheet open={sidebarOpen} onOpenChange={(open) => !open && closeSidebar()}>
      <SheetContent
        side={isRtl ? "right" : "left"}
        showCloseButton={false}
        className={cn(
          "w-full sm:max-w-md h-full flex flex-col gap-0 bg-background",
          isRtl && "border-l-0 border-r",
        )}
      >
        <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4 flex items-start justify-between">
          <button
            type="button"
            onClick={closeSidebar}
            className="shrink-0 size-10 -ms-1 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="px-5 sm:px-7 pb-5 sm:pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
                {t("title")}{" "}
                <span className="truncate inline">
                  {currentItem && getItemTitle(currentItem, locale)}
                </span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t("subtitle")}
              </p>
            </div>
            <div className="shrink-0 size-14 sm:size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <CurrentIcon className="size-7 sm:size-8" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-primary/5 border border-primary/15 flex items-center gap-3 px-4 py-3.5">
            <Info className="size-5 text-primary shrink-0" />
            <p className="text-sm text-foreground/85 leading-relaxed flex-1">
              {t("infoBanner", { type: currentTypeLabel })}
            </p>
          </div>
        </div>

        <div className="px-5 sm:px-7 pb-2 sm:pb-3 flex items-center gap-2">
          <span className="text-base font-bold text-foreground">
            {t("requirementsLabel")}
          </span>
          <span className="text-base font-bold text-muted-foreground">
            {t("countLabel", { count: dependencies.length })}
          </span>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 sm:px-7 pb-5 sm:pb-6 space-y-3 sm:space-y-4">
            {dependencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Info className="size-8 text-primary/80" />
                </div>
                <p className="text-base font-semibold text-foreground">
                  {t("empty")}
                </p>
              </div>
            ) : (
              dependencies.map((dep, idx) => (
              <DependencyCard
                  key={dep?.key || dep?.id || idx}
                  depItem={dep}
                  locale={locale}
                  tgs={tgs}
                  getDependenciesForItem={getDependenciesForItem}
                  canStartItem={canStartItem}
                  startTour={startTour}
                  pushSidebarItem={pushSidebarItem}
                  closeSidebar={closeSidebar}
                  onItemHandled={onItemHandled}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 px-5 sm:px-7 pt-3 sm:pt-4 pb-6 sm:pb-8 space-y-3 border-t border-border/60">
          {sidebarDepth > 1 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-2xl border-border/70"
              onClick={popSidebarItem}
            >
              <ChevronBack className="size-5" />
              <span className="text-sm font-medium">{t("backToParent")}</span>
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            className={cn(
              "w-full h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-semibold gap-3",
              !(canStartCurrent && !currentCompleted) && "opacity-50 pointer-events-none",
            )}
            disabled={!(canStartCurrent && !currentCompleted)}
            onClick={() => {
              if (!currentItem) return;
              closeSidebar?.();
              startTour(currentItem).then((result) => {
                onItemHandled?.(result);
              });
            }}
          >
            {/* <StepIconArrow className="size-5" /> */}
            <span>{t("startStep")}</span>
          </Button>
          {/* <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full h-12 sm:h-14 rounded-2xl border-border/70 text-base font-medium gap-2 text-primary hover:text-primary hover:bg-primary/5"
            onClick={closeSidebar}
          >
            <FileText className="size-5" />
            <span>{t("shortExplanation")}</span>
          </Button> */}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { handleItemClick };
