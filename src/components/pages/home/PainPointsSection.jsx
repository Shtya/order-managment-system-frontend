"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

/* ── Brand tokens (matches your existing palette) ── */
const BRAND = "#6763AF";
const ease = [0.22, 1, 0.36, 1];

const PAIN_ACCENT = ["#6763AF", "#AF7F63", "#6394AF", "#AF6394", "#63AF7F", "#7F6394"];

const PAIN_COLORS = [
  {
    background: "#f7f5fa",
    border: "1.5px solid #6763AF20",
    glow: "#6763AF",
    shimmer: "linear-gradient(135deg, #6763AF0a, #a78bfa06, transparent)",
    iconBg: "#6763AF14",
    tagBg: "#6763AF12",
    tagColor: "#6763AF",
  },
  {
    background: "#fff9f3",
    border: "1.5px solid #AF7F6320",
    glow: "#AF7F63",
    shimmer: "linear-gradient(135deg, #AF7F630a, #fb923c06, transparent)",
    iconBg: "#AF7F6314",
    tagBg: "#AF7F6312",
    tagColor: "#AF7F63",
  },
  {
    background: "#f3fcff",
    border: "1.5px solid #6394AF22",
    glow: "#6394AF",
    shimmer: "linear-gradient(135deg, #6394AF0a, #60a5fa06, transparent)",
    iconBg: "#6394AF14",
    tagBg: "#6394AF12",
    tagColor: "#6394AF",
  },
  {
    background: "#fff3fb",
    border: "1.5px solid #AF639420",
    glow: "#AF6394",
    shimmer: "linear-gradient(135deg, #AF63940a, #f472b606, transparent)",
    iconBg: "#AF639414",
    tagBg: "#AF639412",
    tagColor: "#AF6394",
  },
  {
    background: "#f3fff8",
    border: "1.5px solid #63AF7F22",
    glow: "#63AF7F",
    shimmer: "linear-gradient(135deg, #63AF7F0a, #34d39906, transparent)",
    iconBg: "#63AF7F14",
    tagBg: "#63AF7F12",
    tagColor: "#63AF7F",
  },
  {
    background: "#f9f3ff",
    border: "1.5px solid #7F639420",
    glow: "#7F6394",
    shimmer: "linear-gradient(135deg, #7F63940a, #c084fc06, transparent)",
    iconBg: "#7F639414",
    tagBg: "#7F639412",
    tagColor: "#7F6394",
  },
];

/* ── Single pain point card ── */
function PainCard({ item, index, inView, isRtl }) {
  const accent = PAIN_ACCENT[index % PAIN_ACCENT.length];
  const box = PAIN_COLORS[index % PAIN_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, delay: 0.1 + index * 0.1, ease }}
      whileHover={{ y: -4, boxShadow: `0 28px 60px ${accent}16, 0 6px 20px ${accent}0c` }}
      className="relative rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: box.background,
        border: box.border,
        boxShadow: `0 2px 16px ${accent}0a`,
        padding: "28px 24px",
      }}
    >
      {/* shimmer mesh */}
      <motion.div
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 7 + index, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: box.shimmer }}
      />

      {/* layout: content only */}
      <div className="relative z-10 flex flex-col gap-4">
        {/* tag */}
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.18 + index * 0.12 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit"
          style={{ background: box.tagBg, color: box.tagColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accent }}
          />
          {item.tag}
        </motion.span>

        {/* title */}
        <motion.h3
          initial={{ opacity: 0, x: isRtl ? -18 : 18 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.24 + index * 0.12, duration: 0.5, ease }}
          className="font-extrabold text-gray-800 leading-snug"
          style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.35rem)" }}
          dangerouslySetInnerHTML={{ __html: item.title }}
        />

        {/* pain description */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.32 + index * 0.12 }}
          className="text-gray-500 leading-relaxed text-sm sm:text-base"
        >
          {item.pain}
        </motion.p>

        {/* solution */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.42 + index * 0.12 }}
          className="flex items-start gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.4 }}
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
            style={{ background: box.tagBg }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5.5 L4 7.5 L8 3" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <p
            className="text-gray-700 text-sm sm:text-base font-medium leading-relaxed"
          >
            {item.solution}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ════════ ROOT EXPORT ════════ */
export default function PainPointsSection() {
  const t = useTranslations("painPointsSection");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const cards = t.raw("cards");

  return (
    <section
      ref={ref}
      className="relative py-20 overflow-hidden"
      style={{ background: "linear-gradient(180deg,#ffffff 0%,#f8f7ff 50%,#ffffff 100%)" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ambient orbs */}
      <motion.div
        animate={{ x: [0, 24, 0], y: [0, -18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 440,
          height: 440,
          top: "5%",
          right: "10%",
          background: `radial-gradient(circle, ${BRAND}0c 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
      <motion.div
        animate={{ x: [0, -18, 0], y: [0, 14, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 320,
          height: 320,
          bottom: "10%",
          left: "5%",
          background: `radial-gradient(circle, #AF7F630c 0%, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />

      <div className="container mx-auto px-5">

        {/* ── Section heading (from Howitworkssection) ── */}
        {/* <div className="text-center mb-14" dir={isRtl ? "rtl" : "ltr"}>
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
         
        </div> */}

        {/* ── Pain point cards (grid layout inspired by image) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1300px] mx-auto">
          {cards.map((card, i) => (
            <PainCard
              key={i}
              item={card}
              index={i}
              inView={inView}
              isRtl={isRtl}
            />
          ))}
        </div>

      </div>
    </section>
  );
}