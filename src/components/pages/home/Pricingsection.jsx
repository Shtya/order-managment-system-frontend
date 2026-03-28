"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useSubscriptionsApi } from "../../../app/[locale]/plans/page";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

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
            : "var(--muted-foreground,#6b7280)",
          textAlign: "right",
        }}
      >
        {label}
      </span>
      {isNew && <NewBadge t={t} />}
    </div>
  );
}

/* ─── Pricing Card ─── */
function PricingCard({ plan, t, index, onAction }) {
  const tWel = useTranslations("onboarding.welcome.pricing");
  const featured = plan.featured;
  const getPriceDisplay = () => {
    if (plan.type === "negotiated") {
      return (
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: featured ? "#BAEB33" : "#f97316",
            letterSpacing: "-1px",
          }}
        >
          {t("negotiated")}
        </span>
      );
    }

    if (plan.type === "trial") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily:
                "'Instrument Serif', 'DM Serif Display', Georgia, serif",
              fontSize: 48,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              fontWeight: 400,
              color: featured ? "#ffffff" : "var(--foreground,#111)",
            }}
          >
            {plan.price || 0}
          </span>
          <span
            style={{
              fontSize: 11,
              background: featured ? "rgba(186,235,51,0.2)" : "#dbeafe",
              color: featured ? "#BAEB33" : "#1d4ed8",
              padding: "2px 10px",
              borderRadius: 20,
              fontWeight: 700,
              width: "fit-content",
            }}
          >
            {tWel("types.trial")}
          </span>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "flex-start",
          gap: 6,
          flexDirection: "row",
        }}
      >
        <span
          style={{
            fontFamily:
              "'Instrument Serif', 'DM Serif Display', Georgia, serif",
            fontSize: 48,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontWeight: 400,
            color: featured ? "#ffffff" : "var(--foreground,#111)",
          }}
        >
          {plan.price}
        </span>
        <span
          style={{
            fontSize: 13,
            color: featured
              ? "rgba(255,255,255,0.7)"
              : "var(--muted-foreground,#6b7280)",
          }}
        >
          / {t("perMonth")}
        </span>
      </div>
    );
  };

  return (
    <div
      className="min-w-75 max-w-75"
      style={{
        flex: 1,
        borderRadius: 20,
        padding: featured ? "32px 28px" : "28px 24px",
        direction: "rtl",
        position: "relative",
        background: featured ? "#1b1945" : "var(--card,#fff)",
        border: featured ? "" : "4px solid #6763AF0F",
        boxShadow: featured
          ? "0px 30px 50px 0px #00000014;"
          : "0px 30px 50px 0px #6763AF0A;",
        transform: featured ? "scale(1.03)" : "scale(1)",
        zIndex: featured ? 2 : 1,
        transition: "box-shadow 0.3s, transform 0.3s",
        // opacity: 0,
        animation: `cardIn 0.5s cubic-bezier(.34,1.56,.64,1) forwards`,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Price */}
      <div style={{ marginBottom: 14 }}>{getPriceDisplay()}</div>

      {/* Plan name + dot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: featured ? "#ffffff" : "var(--foreground,#111)",
          }}
        >
          {plan.name || "Plans"}
        </span>
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 12,
          textAlign: "right",
          marginBottom: 20,
          color: featured
            ? "rgba(255,255,255,0.55)"
            : "var(--muted-foreground,#9ca3af)",
          lineHeight: 1.6,
        }}
      >
        {plan.subtitle}
      </p>

      {/* CTA */}
      <button
        onClick={onAction}
        className="rounded-full"
        style={{
          width: "100%",
          padding: "11px 0",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          border: "none",
          background: featured ? "#BAEB33" : "#1B1945",
          color: "#fff",
          transition: "opacity 0.2s, transform 0.2s",
          marginBottom: 24,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.88";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.transform = "none";
        }}
      >
        {t("cta")}
      </button>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: featured
            ? "rgba(255,255,255,0.1)"
            : "var(--border,#e5e7eb)",
          marginBottom: 16,
        }}
      />

      {/* Features */}
      <div
        className={`${featured ? "bg-[#201E4E] border-[#3D3D3D80]" : "bg-[#F8F9FFC7] border-[#6763AF0A]"} border p-2 rounded-xl`}
        style={{ display: "flex", flexDirection: "column" }}
      >
        {plan.features.map((f, i) => (
          <Feature
            key={i}
            label={f.label || t(`plans.${plan.id}.features.f${i + 1}`)}
            isNew={f.isNew}
            featured={featured}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function PricingSection() {
  const tWel = useTranslations("onboarding.welcome.pricing");
  const t = useTranslations("pricing");
  const router = useRouter();
  const { formatCurrency } = usePlatformSettings()
  const {
    isLoading,
    plans: rawPlans,
    fetchPlans,
    user,
  } = useSubscriptionsApi();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Format plans for display (inspired by onboarding/page.jsx)
  const plans = useMemo(() => {
    return rawPlans.map((plan, index) => {
      const price = Number(plan.price || 0);
      const features = [...(Array.isArray(plan.features) ? plan.features : [])];

      // Add limit details (translated or English as per user's preference)
      if (plan.usersLimit !== null) {
        features.push(tWel("limits.users", { count: plan.usersLimit }));
      } else {
        features.push(tWel("limits.unlimitedUsers"));
      }

      if (plan.storesLimit !== null) {
        features.push(tWel("limits.stores", { count: plan.storesLimit }));
      } else {
        features.push(tWel("limits.unlimitedStores"));
      }

      if (plan.shippingCompaniesLimit !== null) {
        features.push(tWel("limits.shipping", { count: plan.shippingCompaniesLimit }));
      } else {
        features.push(tWel("limits.unlimitedShipping"));
      }

      if (plan.includedOrders !== null) {
        features.push(tWel("limits.orders", { count: plan.includedOrders }));
      } else {
        features.push(tWel("limits.unlimitedOrders"));
      }

      if (plan.extraOrderFee !== null && plan.extraOrderFee > 0) {
        features.push(tWel("limits.extraFee", { fee: formatCurrency(plan.extraOrderFee), currency: tWel("currency") || "EGP" }));
      }

      if (plan.bulkUploadPerMonth > 0) {
        features.push(tWel("limits.bulkUpload", { count: plan.bulkUploadPerMonth }));
      }

      return {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        featured: !!plan.isPopular,
        dotColor:
          plan.color ||
          (index === 0 ? "#4ade80" : index === 1 ? "#818cf8" : "#a855f7"),
        tier:
          plan.duration === "monthly"
            ? t("types.monthly")
            : plan.duration === "yearly"
              ? t("types.yearly")
              : t("types.plan"),
        features: features.map((f) =>
          typeof f === "string" ? { label: f, isNew: false } : f,
        ),
        subtitle: plan.description || "",
      };
    });
  }, [rawPlans, t]);
  // Arrange plans: popular in center (if 3 or more)
  const arranged = useMemo(() => {
    const result = [...plans];
    const popularIndex = result.findIndex((p) => p.featured);
    if (popularIndex > -1 && result.length >= 3) {
      const [popularPlan] = result.splice(popularIndex, 1);
      result.splice(1, 0, popularPlan);
    }
    return result;
  }, [plans]);

  const handleAction = () => {
    if (user) {
      router.push("/plans");
    } else {
      router.push("/auth?mode=signup");
    }
  };

  if (isLoading) return null;

  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cardInFeatured {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: scale(1.03); }
        }
      `}</style>

      <section
        className="text-center"
        style={{
          background: "var(--background,#f9fafb)",
          padding: "72px 24px 80px",
        }}
      >
        <div className="mb-[50px] " style={{ textAlign: "center" }}>
          <motion.h2 className="text-3xl md:text-[2.1rem] font-extrabold text-gray-900 leading-snug">
            {t("heading.prefix")}{" "}
            <motion.span
              className="inline-block px-5 py-1 rounded-xl"
              style={{ background: `#6763AF16`, color: "#6763AF" }}
            >
              {t("heading.highlight")}
            </motion.span>
          </motion.h2>

          <motion.p className="text-xl text-gray-500 mt-2">
            {t("subheading")}
          </motion.p>
        </div>

        {/* Cards */}
        <div className="max-lg:justify-center"
          style={{
            display: "flex",
            gap: 16,
            maxWidth: 960,
            margin: "0 auto",
            // alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {arranged.map((plan, i) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              //   isYearly={isYearly}
              t={t}
              index={i}
              onAction={handleAction}
            />
          ))}
        </div>
      </section>
    </>
  );
}
