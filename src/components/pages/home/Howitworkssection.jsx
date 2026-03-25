"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import {
  User,
  Mail,
  Link2,
  Lock,
  Package,
  Wifi,
  Sparkles,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

const BRAND = "#6763AF";
const BRAND_L = "#8b88c9";
const ease = [0.22, 1, 0.36, 1];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	 SHARED: StepArrow
	 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StepArrow({ label, side, delay, inView }) {
  const flip = side === "left";
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.45 }}
      className={`flex flex-col ${flip ? "items-end" : "items-start"} mb-2`}
    >
      <span
        className="text-[11px] font-bold mb-0.5"
        style={{
          color: BRAND,
          opacity: 0.8,
          fontFamily: "'Cairo','Tajawal',sans-serif",
        }}
      >
        {label}
      </span>
      <svg
        width="38"
        height="28"
        viewBox="0 0 38 28"
        fill="none"
        style={{ transform: flip ? "scaleX(-1)" : "none" }}
      >
        <motion.path
          d="M34 3 Q20 3 12 16 Q7 22 5 24"
          stroke={BRAND}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ delay: delay + 0.15, duration: 0.65, ease }}
        />
        <motion.path
          d="M5 19 L5 25 L11 24"
          stroke={BRAND}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: delay + 0.75 }}
        />
      </svg>
    </motion.div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	 SHARED: StepCard wrapper
	 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function SignupCard({ inView, ref, step, t }) {
  // const [ref, inView] = useInView();

  const fields = [
    { icon: User, placeholder: t("fields.name") },
    { icon: Mail, placeholder: t("fields.email") },
    { icon: Link2, placeholder: t("fields.store") },
    { icon: Lock, placeholder: t("fields.password") },
  ];

  return (
    <div
      ref={ref}
      dir="rtl"
      className="relative w-fit mx-auto p-4 rounded-xl !h-fit"
      style={{
        border: "1px solid #E8EBF0",
        background: "linear-gradient(1.84deg, #FFFFFF 1.1%, #E8E8FF 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 340 }}>
        <img
          src={"landing/step-1.png"}
          className="absolute left-1/2 -translate-1/2 top-[-60px] w-[120px]"
        />

        {/* ── card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.12, duration: 0.55, ease }}
          style={{
            background: "#fff",
            borderRadius: 22,
            padding: "22px 18px 20px",
            boxShadow:
              "0 8px 40px rgba(108,99,212,0.10), 0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* form fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fields.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.28 + i * 0.09, duration: 0.45, ease }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: "#f0eefb",
                    border: "1px solid rgba(103,99,175,0.13)",
                    cursor: "text",
                  }}
                >
                  <Icon
                    size={14}
                    color={BRAND}
                    strokeWidth={2}
                    style={{ flexShrink: 0 }}
                  />
                  <span
                    style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}
                  >
                    {f.placeholder}
                  </span>
                </motion.div>
              );
            })}

            <Link href="/auth?mode=signup" passHref legacyBehavior>
              {/* CTA button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.68, duration: 0.45, ease }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  marginTop: 4,
                  borderRadius: 14,
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_L} 100%)`,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* shimmer sweep */}
                <motion.div
                  animate={{ x: ["-120%", "220%"] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    repeatDelay: 1.8,
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "60%",
                    background:
                      "linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    zIndex: 1,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: 0.3,
                  }}
                >
                  {t("signupBtn")}
                </span>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* ── title + description below card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.78, duration: 0.5, ease }}
          style={{ marginTop: 24, textAlign: "center" }}
        >
          <h2
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: "#1a1535",
              margin: "0 0 8px",
              lineHeight: 1.4,
            }}
          >
            {step.title}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#7b7a95",
              lineHeight: 1.75,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {step.desc}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function AnalyticsCard({ ref, inView, step }) {
  return (
    <div
      ref={ref}
      className="relative w-fit mx-auto p-4 rounded-xl !h-fit"
      style={{
        border: "1px solid #E8EBF0",
        background: "linear-gradient(1.84deg, #FFFFFF 1.1%, #E8E8FF 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 340 }}>
        <img
          src={"landing/step-2.png"}
          className="absolute left-1/2 -translate-1/2 bottom-[-140px] w-[120px]"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.08, duration: 0.55, ease }}
          style={{
            background: "#fff",
            borderRadius: 26,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <img className=" pt-[30px] pl-[30px]" src={"landing/stats.png"} />
        </motion.div>

        {/* ── title + description ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.5, ease }}
          style={{ textAlign: "center", padding: "20px 8px 4px" }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#1a1535",
              margin: "0 0 8px",
              lineHeight: 1.45,
            }}
          >
            {step.title}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#7b7a95",
              lineHeight: 1.8,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {step.desc}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	 CARD 3 — ShippingCard  (Step 3, left column)
	 Edit this component to change the shipping partners card.
	 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function AramexIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M5 20 Q8 8 14 6 Q20 4 23 10 Q26 16 20 20 Q14 24 8 20 Z"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 20 Q14 14 18 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 4 L14 24 M4 14 L24 14 M7 7 L21 21 M21 7 L7 21"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SwirlIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 5 C20 5, 24 9, 22 14 C20 19, 14 20, 10 17 C6 14, 8 9, 12 8 C16 7, 18 11, 16 14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function SpinIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle
        cx="14"
        cy="14"
        r="9"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <path
        d="M14 8 C18 8, 21 11, 20 15 C19 19, 15 21, 11 20"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14" cy="14" r="2.5" fill={color} />
    </svg>
  );
}

const PARTNER_ICONS = [AramexIcon, StarIcon, SwirlIcon, SpinIcon];
const ICON_COLOR = "#6763AF";

/* ── Tree connecting lines ── */
function ConnectingLines({ inView }) {
  // trunk from box center down, horizontal bar, 4 drops
  // box center X = 50% of container, we use a 300px wide svg centered
  const xPositions = [38, 106, 194, 262]; // centers of 4 icons within 300px
  const midX = 150;
  const trunkY1 = 0,
    trunkY2 = 36;
  const barY = 36;
  const dropY2 = 60;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        overflow: "visible",
      }}
      width="300"
      height="60"
      viewBox="0 0 300 60"
    >
      {/* vertical trunk */}
      <motion.line
        x1={midX}
        y1={trunkY1}
        x2={midX}
        y2={trunkY2}
        stroke={`${BRAND}66`}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.35 }}
      />
      {/* horizontal bar */}
      <motion.line
        x1={xPositions[0]}
        y1={barY}
        x2={xPositions[3]}
        y2={barY}
        stroke={`${BRAND}66`}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        style={{ transformOrigin: `${midX}px ${barY}px` }}
        transition={{ delay: 0.7, duration: 0.4 }}
      />
      {/* vertical drops */}
      {xPositions.map((x, i) => (
        <motion.line
          key={i}
          x1={x}
          y1={barY}
          x2={x}
          y2={dropY2}
          stroke={`${ICON_COLOR}88`}
          strokeWidth="1.5"
          strokeDasharray="3 3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ delay: 0.9 + i * 0.07, duration: 0.28 }}
        />
      ))}
    </svg>
  );
}

function ShippingCard({ ref, inView, step }) {
  return (
    <div
      ref={ref}
      dir="rtl"
      className="relative w-fit mx-auto p-4 rounded-xl !h-fit"
      style={{
        border: "1px solid #E8EBF0",
        background: "linear-gradient(1.84deg, #FFFFFF 1.1%, #E8E8FF 100%)",
      }}
    >
      <img
        src={"landing/step-3.png"}
        className="absolute left-1/2 -translate-1/2 top-[-60px] w-[120px]"
      />

      <div style={{ width: "100%", maxWidth: 340 }}>
        {/* ── outer lavender card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.08, duration: 0.55, ease }}
          style={{
            background: "#fff",
            borderRadius: 28,
            padding: "32px 20px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* ── central package icon ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -15 }}
            animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
            transition={{
              delay: 0.28,
              type: "spring",
              stiffness: 280,
              damping: 18,
            }}
            style={{
              position: "relative",
              width: 68,
              height: 68,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${BRAND}30, ${BRAND}12)`,
              border: `2px solid ${BRAND}44`,
              zIndex: 2,
            }}
          >
            {/* orbit ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: 22,
                border: `1.5px dashed ${BRAND}44`,
              }}
            />
            {/* pulse glow */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.35, 0, 0.35] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20,
                background: BRAND,
                filter: "blur(14px)",
              }}
            />
            {/* 3D box SVG */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              style={{ position: "relative", zIndex: 1 }}
            >
              {/* top face */}
              <path
                d="M16 4 L28 10 L16 16 L4 10 Z"
                fill={`${BRAND}cc`}
                stroke={BRAND}
                strokeWidth="1"
              />
              {/* left face */}
              <path
                d="M4 10 L4 22 L16 28 L16 16 Z"
                fill={`${BRAND}77`}
                stroke={BRAND}
                strokeWidth="1"
              />
              {/* right face */}
              <path
                d="M28 10 L28 22 L16 28 L16 16 Z"
                fill={`${BRAND}99`}
                stroke={BRAND}
                strokeWidth="1"
              />
              {/* highlight line on top edge */}
              <path
                d="M16 4 L28 10"
                stroke="white"
                strokeWidth="0.8"
                strokeOpacity="0.5"
              />
            </svg>
          </motion.div>

          {/* ── connecting lines ── */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 64,
              marginTop: 0,
            }}
          >
            <ConnectingLines inView={inView} />
          </div>

          {/* ── 4 partner icons ── */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              width: "100%",
              marginTop: 4,
            }}
          >
            {PARTNER_ICONS.map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18, scale: 0.5 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{
                  delay: 1.0 + i * 0.09,
                  type: "spring",
                  stiffness: 320,
                  damping: 20,
                }}
                whileHover={{ scale: 1.12, y: -3 }}
                style={{
                  position: "relative",
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${ICON_COLOR}14`,
                  border: `1px solid ${ICON_COLOR}33`,
                  cursor: "default",
                  flexShrink: 0,
                }}
              >
                {/* subtle glow pulse */}
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 18,
                    background: ICON_COLOR,
                    filter: "blur(10px)",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <Icon color={ICON_COLOR} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── title + description ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.75, duration: 0.5, ease }}
          style={{ textAlign: "center", padding: "22px 8px 0" }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#1a1535",
              margin: "0 0 8px",
              lineHeight: 1.45,
            }}
          >
            {step.title}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#7b7a95",
              lineHeight: 1.8,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {step.desc}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	 ROOT EXPORT — HowItWorksSection
	 Composes the three cards above.
	 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const steps = t.raw("steps");

  return (
    <section
      ref={ref}
      className="relative py-20 overflow-hidden"
      style={{ background: "#faf9ff" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ── ambient orbs ── */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 640,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(ellipse,${BRAND}18 0%,transparent 70%)`,
          filter: "blur(55px)",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle,#60a5fa1a 0%,transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="container mx-auto px-5 relative z-10">
        {/* ── section header ── */}
        <div className="text-center mb-14" dir={isRtl ? "rtl" : "ltr"}>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="text-3xl md:text-[2.1rem] font-extrabold text-gray-900 leading-snug"
            style={{ fontFamily: "'Cairo','Tajawal',sans-serif" }}
          >
            {t("header.title")}{" "}
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
              className="inline-block px-4 py-0.5 rounded-xl"
              style={{ background: `${BRAND}15`, color: BRAND }}
            >
              {t("header.highlight")}
            </motion.span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.22 }}
            className="text-lg text-gray-500 mt-4"
            style={{ fontFamily: "'Cairo','Tajawal',sans-serif" }}
          >
            {t("header.subtitle")}
          </motion.p>
        </div>

        {/* ── 3-column grid ── */}
        <div className="grid mt-[150px] mb-[100px] md:grid-cols-3 gap-5 items-start">
          {/* RIGHT column — Step 1 */}
          <SignupCard step={steps[0]} inView={inView} t={t} />

          {/* CENTER column — Step 2 */}
          <AnalyticsCard step={steps[1]} inView={inView} />

          {/* LEFT column — Step 3 */}
          <ShippingCard step={steps[2]} inView={inView} />
        </div>
      </div>
    </section>
  );
}
