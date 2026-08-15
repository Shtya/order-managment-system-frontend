"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useSubscriptionsApi } from "../../../app/[locale]/plans/page";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { dollor, dollorSign, PLATFORM_CURRENCY } from "@/utils/healpers";
import { cn } from "@/utils/cn";
import { CircleCheck } from "lucide-react";

/* ─── Check icon ─── */
function Check({ color = "#6d28d9" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="7.5" stroke={color} strokeOpacity="0.3" />
      <path
        d="M5 8l2 2 4-4"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Badge ─── */
function NewBadge({ t }) {
  return (
    <span
      style={{
        background: "#BAEB33",
        color: "#fff",
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 20,
        letterSpacing: 0.3,
      }}
    >
      {t("badge")}
    </span>
  );
}

/* ─── Feature row ─── */
function Feature({ label, isNew, featured, t }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 8,
        padding: "5px 0",
        direction: "rtl",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_768_27559)">
          <g clip-path="url(#clip1_768_27559)">
            <path
              d="M6.98328 10.0001L8.99161 12.0167L13.0166 7.9834"
              stroke="url(#paint0_linear_768_27559)"
              strokeWidth="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8.95828 2.0416C9.53328 1.54993 10.4749 1.54993 11.0583 2.0416L12.3749 3.17493C12.6249 3.3916 13.0916 3.5666 13.4249 3.5666H14.8416C15.7249 3.5666 16.4499 4.2916 16.4499 5.17493V6.5916C16.4499 6.9166 16.6249 7.3916 16.8416 7.6416L17.9749 8.95827C18.4666 9.53327 18.4666 10.4749 17.9749 11.0583L16.8416 12.3749C16.6249 12.6249 16.4499 13.0916 16.4499 13.4249V14.8416C16.4499 15.7249 15.7249 16.4499 14.8416 16.4499H13.4249C13.0999 16.4499 12.6249 16.6249 12.3749 16.8416L11.0583 17.9749C10.4833 18.4666 9.54161 18.4666 8.95828 17.9749L7.64161 16.8416C7.39161 16.6249 6.92494 16.4499 6.59161 16.4499H5.14994C4.26661 16.4499 3.54161 15.7249 3.54161 14.8416V13.4166C3.54161 13.0916 3.36661 12.6249 3.15828 12.3749L2.03328 11.0499C1.54994 10.4749 1.54994 9.5416 2.03328 8.9666L3.15828 7.6416C3.36661 7.3916 3.54161 6.92494 3.54161 6.59994V5.1666C3.54161 4.28327 4.26661 3.55827 5.14994 3.55827H6.59161C6.91661 3.55827 7.39161 3.38327 7.64161 3.1666L8.95828 2.0416Z"
              stroke="url(#paint1_linear_768_27559)"
              strokeWidth="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
        </g>
        <defs>
          <linearGradient
            id="paint0_linear_768_27559"
            x1="9.88166"
            y1="12.0788"
            x2="9.97084"
            y2="7.91812"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.011" stop-color={featured ? "#fff" : "#6b7280"} />
            <stop offset="1" stop-color={featured ? "#fff" : "#6b7280"} />
          </linearGradient>
          <linearGradient
            id="paint1_linear_768_27559"
            x1="9.68037"
            y1="18.6004"
            x2="10.2314"
            y2="1.4128"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.011" stop-color={featured ? "#fff" : "#6b7280"} />
            <stop offset="1" stop-color={featured ? "#fff" : "#6b7280"} />
          </linearGradient>
          <clipPath id="clip0_768_27559">
            <rect width="20" height="20" fill={featured ? "#fff" : "#6b7280"} />
          </clipPath>
          <clipPath id="clip1_768_27559">
            <rect width="20" height="20" fill={featured ? "#fff" : "#6b7280"} />
          </clipPath>
        </defs>
      </svg>
      <span
        style={{
          fontSize: 12,
          color: featured
            ? "rgba(255,255,255,0.82)"
            : "#6b7280",
          textAlign: "right",
        }}
      >
        {label}
      </span>
      {isNew && <NewBadge t={t} />}
    </div>
  );
}

/**
 * NOTES ON CHANGES
 * - Removed the subscribe/CTA button and the `useRouter`/`handleAction` logic entirely.
 *   This section is now purely informational — it shows what each plan includes,
 *   nothing more. Point people to /plans (or wherever) from elsewhere on the page
 *   if you want a path to signup.
 * - Removed the separate <PricingCard /> import and inlined the card markup here,
 *   since the old card was the main source of the weak UI.
 * - Fixed a bug in the original: `formatCurrency(plan.extraOrderFee, dollor, dollorSign)`
 *   referenced two undefined variables (`dollor`, `dollorSign`). Assuming
 *   `formatCurrency` already knows the platform's currency (that's what
 *   `usePlatformSettings` is for), it's now just `formatCurrency(plan.extraOrderFee)`.
 * - Introduces one new bit of UI copy ("Most popular" badge) that isn't in your
 *   translation files yet. It's handled with a simple inline fallback based on
 *   locale — move it into `pricing.mostPopular` in your messages files when you
 *   get a chance, then swap the inline ternary for `t("mostPopular")`.
 */

export default function PricingSection() {
  const tWel = useTranslations("onboarding.welcome.pricing");
  const t = useTranslations("pricing");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const router = useRouter();

  const { formatCurrency } = usePlatformSettings();
  const { isLoading, plans: rawPlans, fetchPlans } = useSubscriptionsApi();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // A restrained, on-brand palette per tier. Falls back to plan.color if the
  // API supplies one, otherwise cycles through these three.
  const TIER_THEMES = [
    { accent: "#10b981", tint: "#10b98114", ring: "#10b98133" }, // emerald
    { accent: "#6763af", tint: "#6763af14", ring: "#6763af33" }, // brand violet
    { accent: "#a855f7", tint: "#a855f714", ring: "#a855f733" }, // purple
  ];

  const plans = useMemo(() => {
    return rawPlans.map((plan, index) => {
      const price = Number(plan.price || 0);
      const name = isRTL ? plan.name : plan.nameEn;
      const description = isRTL ? plan.description : plan.descriptionEn;
      const localizedFeatures = isRTL ? plan.features : plan.featuresEn;
      let features = [];

      if (plan.includedOrders === null) {
        features.push(tWel("limits.unlimitedOrders"));
      } else if (plan.includedOrders !== 0)  {
         features.push(tWel("limits.orders", { count: plan.includedOrders }));
      }

      if (Array.isArray(localizedFeatures)) {
        features.push(...localizedFeatures);
      }

      if (plan.usersLimit !== null) {
        features.push(tWel("limits.users", { count: plan.usersLimit }));
      }

      if (plan.storesLimit !== null) {
        features.push(tWel("limits.stores", { count: plan.storesLimit }));
      }

      if (plan.shippingCompaniesLimit !== null) {
        features.push(
          tWel("limits.shipping", { count: plan.shippingCompaniesLimit }),
        );
      }



      const extraOrderFee =
        plan.extraOrderFee !== null && plan.extraOrderFee > 0
          ? tWel("extraFee", {
            fee: formatCurrency(plan.extraOrderFee, dollorSign),
          })
          : null;

      // if (plan.bulkUploadPerMonth > 0) {
      //   features.push(
      //     tWel("limits.bulkUpload", { count: plan.bulkUploadPerMonth }),
      //   );
      // }

      const theme = TIER_THEMES[index % TIER_THEMES.length];

      return {
        id: plan.id,
        name,
        price,
        featured: !!plan.isPopular,
        accent: plan.color || theme.accent,
        tint: theme.tint,
        ring: theme.ring,
        tier:
          plan.duration === "monthly"
            ? t("types.monthly")
            : plan.duration === "yearly"
              ? t("types.yearly")
              : t("types.plan"),
        features: features.map((f) =>
          typeof f === "string" ? { label: f, isNew: false } : f,
        ),
        subtitle: description || "",
        extraOrderFee,
      };
    });
  }, [rawPlans, t, tWel, isRTL, formatCurrency]);

  // Popular plan sits in the center once there are 3+ plans.
  const arranged = plans;

  const [perView, setPerView] = useState(1);
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef(null);
  const viewportWidthRef = useRef(1);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerView(w >= 1024 ? 3 : w >= 768 ? 2 : 1);
      if (viewportRef.current) {
        viewportWidthRef.current = viewportRef.current.offsetWidth || 1;
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, arranged.length - perView);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
    const el = viewportRef.current;
    if (el) viewportWidthRef.current = el.offsetWidth || 1;
  }, [maxIndex]);

  const clampedIndex = Math.min(index, maxIndex);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, maxIndex)), [maxIndex]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  /* smooth mouse-wheel scrolling over the cards */
  const wheelLock = useRef(false);
  const dragStateRef = useRef({ active: false, startX: 0, startIndex: 0, stepPx: 1 });

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
    if (e.target.closest && e.target.closest("button")) return;
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startIndex: index,
      stepPx: Math.max(viewportWidthRef.current, 1) / perView,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const s = dragStateRef.current;
    if (!s.active) return;
    setDragX(e.clientX - s.startX);
  };

  const onPointerUp = (e) => {
    const s = dragStateRef.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    s.active = false;
    setIsDragging(false);
    setDragX(0);
    const slides = Math.round(-dx / s.stepPx);
    if (slides !== 0) {
      setIndex((i) => Math.max(0, Math.min(maxIndex, s.startIndex + slides)));
    }
  };

  const onPointerCancel = () => {
    dragStateRef.current.active = false;
    setIsDragging(false);
    setDragX(0);
  };

  const slideWidth = 100 / perView;
  const stepPx = Math.max(viewportWidthRef.current, 1) / perView;
  const trackX = -clampedIndex * stepPx + dragX;
  // useMemo(() => {
  //     const result = [...plans];
  //     const popularIndex = result.findIndex((p) => p.featured);
  //     if (popularIndex > -1 && result.length >= 3) {
  //       const [popularPlan] = result.splice(popularIndex, 1);
  //       result.splice(1, 0, popularPlan);
  //     }
  //     return result;
  //   }, [plans]);
  if (isLoading) return null;
  if (!arranged.length) return null;

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: "linear-gradient(180deg, #faf9ff 0%, #f3f1fb 100%)" }}
      className="px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span
            className="mb-4 inline-block rounded-full px-4 py-1 text-xs font-semibold tracking-wide"
            style={{ background: "#6763AF14", color: "#6763AF" }}
          >
            {isRTL ? "الأسعار" : "Pricing"}
          </span>

          <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
            {t("heading.prefix")}{" "}
            <span
              className="inline-block rounded-xl px-3 py-0.5"
              style={{ background: "#6763AF16", color: "#6763AF" }}
            >
              {t("heading.highlight")}
            </span>
          </h2>

          <p className="mt-4 text-lg text-gray-500">{t("subheading")}</p>
        </div>

        {/* Cards — slider (like PainPointsSection) */}
        <div className="max-w-[1300px] mx-auto">
          {/* viewport */}
          <div ref={viewportRef} className="overflow-hidden pt-5 pb-3">
            <motion.div
              dir="ltr"
              className="flex"
              animate={{ x: `${-clampedIndex * slideWidth}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {arranged.map((plan) => (
                <div key={plan.id} className="px-3" style={{ flex: `0 0 ${slideWidth}%` }}>
                  <div
                    className="relative flex h-full flex-col rounded-2xl bg-white p-7"
                    style={{
                      boxShadow: plan.featured
                        ? `0 20px 40px -12px ${plan.ring}, 0 0 0 1.5px ${plan.accent}`
                        : "0 8px 24px -12px rgba(17,17,26,0.12)",
                    }}
                  >
                    {plan.featured && (
                      <span
                        className={cn(
                          "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r",
                          plan.accent
                        )}
                      >
                        {isRTL ? "الأكثر طلبًا" : "Most Popular"}
                      </span>
                    )}

                    {/* Tier color thread */}
                    <span
                      className="mb-4 h-1.5 w-10 rounded-full"
                      style={{ background: plan.accent }}
                    />

                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.subtitle && (
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                        {plan.subtitle}
                      </p>
                    )}

                    {plan.price > 0 && <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="text-4xl font-black tracking-tight text-gray-900 tabular-nums">
                        {formatCurrency(plan.price, PLATFORM_CURRENCY)}
                      </span>
                      <span className="text-sm font-medium text-gray-400">
                        / {plan.tier}
                      </span>
                    </div>}

                    {plan.extraOrderFee && (
                      <div
                        className="mt-4 flex items-center gap-2 self-start rounded-xl px-3 py-2.5"
                        style={{
                          background: plan.tint,
                          border: `1px solid ${plan.ring}`,
                        }}
                      >
                        <CircleCheck
                          size={16}
                          className="flex-shrink-0"
                          style={{ color: plan.accent }}
                        />
                        <span
                          className="text-xs font-bold"
                          style={{ color: plan.accent }}
                        >
                          {plan.extraOrderFee}
                        </span>
                      </div>
                    )}

                    <div
                      className="my-6 h-px w-full"
                      style={{ background: "#11111a0f" }}
                    />

                    <ul className="flex-1 space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <CircleCheck
                            size={18}
                            strokeWidth={2}
                            className="text-green-500 flex-shrink-0"
                          />
                          <span className="leading-snug">
                            {feature.label}
                            {feature.isNew && (
                              <span
                                className="ms-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{ background: plan.tint, color: plan.accent }}
                              >
                                {isRTL ? "جديد" : "New"}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => router.push("/auth?mode=signup")}
                      className="mt-6 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{
                        background: "#6763AF",
                        boxShadow: "0 6px 18px rgba(103, 99, 175, 0.28)",
                      }}
                    >
                      {t("cta")}
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* controls */}
          {maxIndex > 0 && (
            <div className="flex items-center justify-center gap-5 mt-8">
              <button
                onClick={prev}
                disabled={clampedIndex === 0}
                aria-label={isRTL ? "السابق" : "Previous"}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 hover:scale-110"
                style={{ background: "#6763AF12", color: "#6763AF" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: isRTL ? "rotate(180deg)" : "none" }}>
                  <path d="M15 5 L8 12 L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === clampedIndex ? 28 : 10,
                      background: i === clampedIndex ? "#6763AF" : "#d6d3e6",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={clampedIndex >= maxIndex}
                aria-label={isRTL ? "التالي" : "Next"}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 hover:scale-110"
                style={{ background: "#6763AF12", color: "#6763AF" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: isRTL ? "rotate(180deg)" : "none" }}>
                  <path d="M9 5 L16 12 L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}