"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

// type LocalizedText = {
//   ar: string;
//   en: string;
// };

// export type TutorialStep = {
//   key: string;
//   title: LocalizedText;
//   description: LocalizedText;
//   target?: {
//     type: string;
//     page: string;
//     key: string;
//   };
// };

// interface GettingStartedTutorialProps {
//   title: LocalizedText;
//   steps: TutorialStep[];
//   currentStep: number;
//   locale?: "ar" | "en";

//   onNext: () => void;
//   onPrevious: () => void;
//   onSkip: () => void;
//   onFinish: () => void;

//   /**
//    * Called when the user clicks the highlighted target.
//    */
//   onTargetInteraction?: () => void;

//   /**
//    * If true, clicking Next on the current step should
//    * trigger the target instead of simply moving forward.
//    */
//   nextTriggersTarget?: boolean;

//   open?: boolean;
// }

// type Position = {
//   top: number;
//   left: number;
//   placement: "top" | "bottom" | "left" | "right";
// };

export default function GettingStartedTutorial({
  title,
  steps,
  currentStep,
  locale = "en",
  onNext,
  onPrevious,
  onSkip,
  onFinish,
  onTargetInteraction,
  nextTriggersTarget = false,
  open = true,
}) {
  const [position, setPosition] = useState(null);

  const popupRef = useRef(null);
  const rafRef = useRef(null);
  const prevStepKeyRef = useRef(null);

  const step = steps[currentStep];

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const isRtl = locale === "ar";
  const t = useTranslations("gettingStarted.tutorial");
  const pathname = usePathname();

  const text = (value) => {
    if (!value) return "";
    return value[locale] || value.en;
  };

  /**
   * Resolve the actual DOM target.
   */
  const getTarget = () => {
    if (!step?.target?.key) return null;

    return document.querySelector(
      `[data-getting-started="${step.target.key}"]`,
    );
  };

  /**
   * Calculate popup position around the target.
   */
  const updatePosition = () => {
    if (rafRef.current) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;

      const target = getTarget();
      const popup = popupRef.current;

      if (!target || !popup) return;

      const targetRect = target.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();

      const gap = 12;
      const padding = 16;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let placement;
      let top = targetRect.bottom + gap;
      let left = targetRect.left + targetRect.width / 2 - popupRect.width / 2;

      /*
       * Prefer bottom.
       * If there isn't enough room, try top.
       */
      if (
        top + popupRect.height > viewportHeight - padding &&
        targetRect.top - gap - popupRect.height >= padding
      ) {
        placement = "top";
        top = targetRect.top - popupRect.height - gap;
      }

      /*
       * If top/bottom doesn't work well, use the side.
       */
      if (top < padding || top + popupRect.height > viewportHeight - padding) {
        if (
          targetRect.right + gap + popupRect.width <=
          viewportWidth - padding
        ) {
          placement = "right";
          left = targetRect.right + gap;
          top = targetRect.top + targetRect.height / 2 - popupRect.height / 2;
        } else if (targetRect.left - gap - popupRect.width >= padding) {
          placement = "left";
          left = targetRect.left - popupRect.width - gap;
          top = targetRect.top + targetRect.height / 2 - popupRect.height / 2;
        }
      }

      /*
       * Keep popup inside viewport.
       */
      left = Math.max(
        padding,
        Math.min(left, viewportWidth - popupRect.width - padding),
      );

      top = Math.max(
        padding,
        Math.min(top, viewportHeight - popupRect.height - padding),
      );

      setPosition((prev) => {
        if (
          prev &&
          prev.top === top &&
          prev.left === left &&
          prev.placement === placement
        ) {
          return prev;
        }

        return { top, left, placement };
      });
    });
  };

  /**
   * Scroll target into view and calculate popup position.
   */
  useLayoutEffect(() => {
    if (!open || !step) return;

    const target = getTarget();

    if (!target) {
      setPosition(null);
    } else {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    const timer = window.setTimeout(() => {
      updatePosition();
    }, 200);

    const observer = new MutationObserver(() => {
      updatePosition();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [open, currentStep, step?.target?.key, pathname]);

  /**
   * Keep popup attached to target when the page scrolls/resizes.
   */
  useEffect(() => {
    if (!open || !step) return;

    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [open, currentStep, step?.target?.key, pathname]);

  /**
   * Global target click listener.
   *
   * Instead of adding a listener to every target individually,
   * we listen once while the tutorial is active.
   */
  useEffect(() => {
    if (!open || !step?.target?.key) return;

    const targetKey = step.target.key;

    const handleDocumentClick = (event) => {
      const clickedElement = event.target;

      if (!clickedElement) return;

      const target = clickedElement.closest(
        `[data-getting-started="${targetKey}"]`,
      );

      if (!target) return;

      /*
       * LINK targets must not perform their own navigation.
       * The next step navigates via navigateToStepPage, so we
       * prevent the default link navigation to avoid a duplicate hop.
       */
      if (step?.target?.type?.toUpperCase() === "LINK") {
        event.preventDefault();
      }

      onTargetInteraction?.();
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [open, step?.target?.key, onTargetInteraction]);

  const closeDialog = () => {
    const closeBtn = document.querySelector("[data-dialog-close]");
    if (closeBtn) closeBtn.click();
  };

  useEffect(() => {
    const prevKey = prevStepKeyRef.current;
    if (prevKey) {
      const prevStep = steps.find((s) => s.key === prevKey);
      if (prevStep?.target?.type === "DIALOG") {
        const nextKey = step?.target?.key;
        const nextInsideDialog =
          !!nextKey &&
          !!document.querySelector(
            `[role="dialog"] [data-getting-started="${nextKey}"]`,
          );
        if (!nextInsideDialog) {
          closeDialog();
        }
      }
    }
    prevStepKeyRef.current = step?.key || null;
  }, [step?.key, steps]);

  if (!open || !step) {
    return null;
  }

  const handleNext = () => {
    if (isLast) {
      onFinish();
      return;
    }

    /*
     * For a step where Next represents performing
     * the highlighted action.
     */
    if (nextTriggersTarget) {
      const target = getTarget();

      /*
       * For LINK targets, never click the element directly.
       * Navigation is handled by navigateToStepPage for the next
       * step (which always has a page), so a programmatic click
       * would trigger a second, duplicate navigation.
       */

      if (
        target &&
        step.target.type?.toUpperCase() !== "LINK" &&
        target.tagName.toLowerCase() !== "a"
      ) {
        target.click();
        return;
      }
    }

    onNext();
  };

  return (
    <>
      {/* Soft page dimming */}
      {position && (
        <div
          className="pointer-events-none fixed inset-0 z-[9998] bg-black/10"
          aria-hidden="true"
        />
      )}

      {/* Target spotlight */}
      {position && step.target && (
        <TargetHighlight targetKey={step.target.key} />
      )}

      {/* Tutorial Card */}
      <div
        ref={popupRef}
        dir={isRtl ? "rtl" : "ltr"}
        data-getting-started-tutorial
        className={cn(
          "pointer-events-auto fixed z-[9999]",
          "w-[400px] max-w-[calc(100vw-32px)]",
          "overflow-hidden rounded-2xl",
          "border border-border/70",
          "bg-card/95 backdrop-blur-xl",
          "text-card-foreground",
          "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]",
        )}
        style={
          position
            ? {
                top: position.top,
                left: position.left,
              }
            : {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                visibility: "hidden",
                pointerEvents: "none",
              }
        }
      >
        {/* Top progress */}
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                {text(title)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground/70">
                {currentStep + 1} {t("of")} {steps.length}
              </p>
            </div>

            <button
              type="button"
              onClick={onSkip}
              className={cn(
                "shrink-0 rounded-lg p-2",
                "text-muted-foreground",
                "transition-colors",
                "hover:bg-muted hover:text-foreground",
              )}
              aria-label={t("close")}
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="px-5 pb-5 pt-5">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {text(step.title)}
          </h3>

          <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
            {text(step.description)}
          </p>

          {/* Current step indicator */}
          {/* <div className="mt-5 flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {currentStep + 1}
            </span>

            <span className="text-xs font-medium text-muted-foreground">
              {t("step")}
            </span>
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-5 py-4">
          {/* Skip */}
          <button
            type="button"
            onClick={onSkip}
            className={cn(
              "text-sm font-medium",
              "text-muted-foreground",
              "transition-colors",
              "hover:text-foreground",
            )}
          >
            {t("skip")}
          </button>

          <div className="flex items-center gap-2">
            {/* Previous */}
            <button
              type="button"
              onClick={onPrevious}
              disabled={isFirst}
              className={cn(
                "inline-flex h-9 items-center gap-1.5",
                "rounded-lg border border-border",
                "bg-background px-3",
                "text-sm font-medium text-foreground",
                "transition-colors",
                "hover:bg-muted",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
              aria-label={t("previous")}
            >
              {isRtl ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}

              <span>{t("previous")}</span>
            </button>

            {/* Next / Finish */}
            <button
              type="button"
              onClick={handleNext}
              className={cn(
                "inline-flex h-9 items-center gap-1.5",
                "rounded-lg bg-primary px-4",
                "text-sm font-semibold text-primary-foreground",
                "shadow-sm",
                "transition-all",
                "hover:bg-primary/90",
                "hover:shadow-md",
                "active:scale-[0.98]",
              )}
            >
              <span>{isLast ? t("finish") : t("next")}</span>

              {!isLast &&
                (isRtl ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                ))}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function TargetHighlight({ targetKey }) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    const update = () => {
      const target = document.querySelector(
        `[data-getting-started="${targetKey}"]`,
      );

      if (!target) {
        setRect(null);
        return;
      }

      setRect(target.getBoundingClientRect());
    };

    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    const observer = new MutationObserver(update);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer.disconnect();
    };
  }, [targetKey]);

  if (!rect) return null;

  const padding = 6;

  return (
    <div
      className="pointer-events-none fixed z-[9997] rounded-xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
      style={{
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }}
    />
  );
}
