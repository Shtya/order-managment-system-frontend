"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/utils/cn";

/**
 * Reusable horizontal-scroll carousel. Uses the exact same logic as the
 * OnboardingCarousel in `src/app/[locale]/getting-started/page.jsx`:
 * an index-based track translated with framer-motion, responsive perView
 * (1 / 2 / 3), mouse-wheel stepping, pointer-drag sliding and prev/next
 * arrows.
 *
 * Props:
 * - children: slides; each direct child is wrapped in its own scroll item.
 * - className: classes for the outer wrapper.
 * - viewportClassName: classes for the (overflow-hidden) viewport.
 * - slideClassName: extra classes for each slide item (padding etc.).
 * - perView: optional fixed number of visible slides; defaults to responsive
 *   3 (>=1024px), 2 (>=768px), 1 otherwise.
 * - prevLabel / nextLabel: aria-labels for the arrows.
 * - showArrows: render prev/next buttons (default true).
 * - showDots: render dot indicators (default false).
 * - arrowsClassName / dotsClassName: extra classes for the controls row.
 */
export default function HorizontalScroll({
  children,
  className,
  viewportClassName,
  slideClassName,
  perView,
  prevLabel = "Previous",
  nextLabel = "Next",
  showArrows = true,
  showDots = false,
  arrowsClassName,
  dotsClassName,
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const layoutDir = isRtl ? "rtl" : "ltr";
  const dirSign = isRtl ? 1 : -1;

  const count = Children.count(children);
  const viewportRef = useRef(null);
  const viewportWidthRef = useRef(1);

  const [currentPerView, setCurrentPerView] = useState(1);
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (perView) {
        setCurrentPerView(perView);
      } else {
        setCurrentPerView(w >= 1024 ? 3 : w >= 768 ? 2 : 1);
      }
      if (viewportRef.current) {
        viewportWidthRef.current = viewportRef.current.offsetWidth || 1;
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [perView]);

  const maxIndex = Math.max(0, count - currentPerView);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
    const el = viewportRef.current;
    if (el) viewportWidthRef.current = el.offsetWidth || 1;
  }, [maxIndex]);

  const clampedIndex = Math.min(index, maxIndex);

  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, maxIndex)),
    [maxIndex],
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  /* smooth mouse-wheel scrolling over the cards */
  const wheelLock = useRef(false);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startIndex: 0,
    stepPx: 1,
    moved: false,
  });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e) => {
      if (wheelLock.current || dragStateRef.current.active) return;
      const delta = e.deltaY;
      if (Math.abs(delta) < 8) return;
      const goingForward = delta > 0;
      const canMove = goingForward ? clampedIndex < maxIndex : clampedIndex > 0;
      if (!canMove) return;
      e.preventDefault();
      wheelLock.current = true;
      setIndex((i) =>
        goingForward ? Math.min(i + 1, maxIndex) : Math.max(i - 1, 0),
      );
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 450);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [clampedIndex, maxIndex]);

  /* hold a card and drag it to slide */
  const onPointerDown = (e) => {
    if (maxIndex <= 0) return;
    if (e.button !== 0) return;
    // Never start a drag from inside a button so Start Now / Replay still click.
    if (e.target.closest && e.target.closest("button")) return;
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startIndex: index,
      stepPx: Math.max(viewportWidthRef.current, 1) / currentPerView,
      moved: false,
    };
    setIsDragging(true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const onPointerMove = (e) => {
    const s = dragStateRef.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    if (Math.abs(dx) > 4) s.moved = true;
    setDragX(dx);
  };

  const onPointerUp = (e) => {
    const s = dragStateRef.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    s.active = false;
    setIsDragging(false);
    setDragX(0);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    const slides = Math.round((dirSign * dx) / s.stepPx);
    if (slides !== 0) {
      setIndex((i) => Math.max(0, Math.min(maxIndex, s.startIndex + slides)));
    }
    // Suppress the click that follows a drag without leaking the flag into the
    // next real click.
    window.setTimeout(() => {
      s.moved = false;
    }, 0);
  };

  // Clean up window listeners if the component unmounts mid-gesture.
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suppress card clicks that happen at the end of a drag gesture.
  const onCaptureClick = (e) => {
    if (!dragStateRef.current.moved) return;
    dragStateRef.current.moved = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const slideWidth = 100 / currentPerView;
  const stepPx = Math.max(viewportWidthRef.current, 1) / currentPerView;
  const trackX = dirSign * clampedIndex * stepPx + dragX;

  const ArrowBtn = ({ label, disabled, onClick, children }) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-9 shrink-0 rounded-full grid place-items-center border border-border bg-card text-foreground shadow-sm transition-all",
        "enabled:hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onClickCapture={onCaptureClick}
        dir={layoutDir}
        className={cn(
          "overflow-hidden touch-pan-y select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          viewportClassName,
        )}
      >
        <motion.div
          dir={layoutDir}
          className="flex"
          animate={{ x: trackX }}
          transition={
            isDragging
              ? { duration: 0 }
              : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {Children.map(children, (child, i) => (
            <div
              key={i}
              className={cn("px-2", slideClassName)}
              style={{ flex: `0 0 ${slideWidth}%` }}
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      {maxIndex > 0 && (showArrows || showDots) && (
        <div
          className={cn(
            "flex items-center justify-center gap-3",
            arrowsClassName,
            dotsClassName,
          )}
        >
          {showArrows && (
            <ArrowBtn
              label={prevLabel}
              disabled={clampedIndex === 0}
              onClick={prev}
            >
              <ChevronRight className={cn("size-4", !isRtl && "rotate-180")} />
            </ArrowBtn>
          )}

          {showDots && (
            <div className="flex items-center gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: i === clampedIndex ? 28 : 10,
                    background:
                      i === clampedIndex ? "var(--primary)" : "var(--border)",
                  }}
                />
              ))}
            </div>
          )}

          {showArrows && (
            <ArrowBtn
              label={nextLabel}
              disabled={clampedIndex >= maxIndex}
              onClick={next}
            >
              <ChevronLeft className={cn("size-4", !isRtl && "rotate-180")} />
            </ArrowBtn>
          )}
        </div>
      )}
    </div>
  );
}
