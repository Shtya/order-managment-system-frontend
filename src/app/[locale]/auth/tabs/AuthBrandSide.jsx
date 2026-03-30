"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { Link } from "@/i18n/navigation";

/* ══════════════════════════════════════════════════════════════
   PALETTE — same purple universe, richer depth
══════════════════════════════════════════════════════════════ */
const P = {
  bg0: "#0f0d2e",
  bg1: "#161340",
  bg2: "#1e1a52",
  violet: "#7270be",
  lavender: "#9d9bd8",
  frost: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  borderHi: "rgba(255,255,255,0.18)",
  text: "#ffffff",
  textMid: "rgba(255,255,255,0.65)",
  textLow: "rgba(255,255,255,0.35)",
  glow: "rgba(114,112,190,0.55)",
};

/* ══════════════════════════════════════════════════════════════
   SOCIALS
══════════════════════════════════════════════════════════════ */
const SOCIALS = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com/",
    color: "#E1306C",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "x",
    label: "X",
    href: "https://x.com/",
    color: "#e2e8f0",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://linkedin.com/",
    color: "#0A66C2",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://facebook.com/",
    color: "#1877F2",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://tiktok.com/",
    color: "#e2e8f0",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.34 6.29 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "https://wa.me/",
    color: "#25D366",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.532 5.855L.057 23.09a.5.5 0 0 0 .617.636l5.428-1.424A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.003-1.37l-.359-.213-3.72.976.995-3.634-.234-.374A9.818 9.818 0 1 1 12 21.818z" />
      </svg>
    ),
  },
];

const STATS = [
  { valKey: "brand.stat_val_merchants", key: "brand.stat_merchants" },
  { valKey: "brand.stat_val_orders", key: "brand.stat_orders" },
  { valKey: "brand.stat_val_uptime", key: "brand.stat_uptime" },
];

const FEATURES = [
  { emoji: "📦", key: "brand.feature_1" },
  { emoji: "🏪", key: "brand.feature_2" },
  { emoji: "📊", key: "brand.feature_3" },
  { emoji: "🚚", key: "brand.feature_4" },
];

/* ══════════════════════════════════════════════════════════════
   LOGO
══════════════════════════════════════════════════════════════ */
const Logo = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════════════════════════ */
function useCounter(target, duration = 1200, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return val;
}

/* ══════════════════════════════════════════════════════════════
   PARTICLE CANVAS — subtle floating specks
══════════════════════════════════════════════════════════════ */
function ParticleField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 38;
    const dots = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      o: Math.random() * 0.35 + 0.08,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(157,155,216,${d.o})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════
   SOCIAL BUTTON
══════════════════════════════════════════════════════════════ */
function SocialBtn({ social, index }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.label}
      title={social.label}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.7 + index * 0.055,
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ scale: 1.15, y: -3 }}
      whileTap={{ scale: 0.9 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        textDecoration: "none",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${hov ? social.color + "55" : P.border}`,
        background: hov ? `${social.color}18` : P.frost,
        color: hov ? social.color : P.textMid,
        boxShadow: hov ? `0 0 16px ${social.color}30` : "none",
        transition: "all .2s ease",
        cursor: "pointer",
      }}
    >
      {hov && (
        <motion.span
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 0.45 }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `linear-gradient(110deg, transparent, ${social.color}22, transparent)`,
          }}
        />
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{social.icon}</span>
    </motion.a>
  );
}

/* ══════════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════════ */
function StatCard({ val, labelKey, t, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, background: "rgba(255,255,255,0.10)" }}
      style={{
        flex: 1,
        padding: "16px 10px",
        textAlign: "center",
        background: P.frost,
        border: `1px solid ${P.border}`,
        borderRadius: 14,
        cursor: "default",
        transition: "background .2s, transform .2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Inner glow spot */}
      <div
        style={{
          position: "absolute",
          top: -24,
          left: "50%",
          transform: "translateX(-50%)",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${P.lavender}30, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          fontSize: "clamp(18px, 2vw, 24px)",
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: "-0.5px",
          textShadow: `0 0 24px ${P.lavender}88`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {val}
      </div>
      <div
        style={{
          fontSize: 9,
          color: P.textLow,
          marginTop: 6,
          letterSpacing: "0.5px",
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {t(labelKey)}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FEATURE ROW
══════════════════════════════════════════════════════════════ */
function FeatureRow({ emoji, labelKey, t, index }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.38 + index * 0.07,
        duration: 0.36,
        ease: "easeOut",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 14px",
        borderRadius: 11,
        background: hov ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.045)",
        border: `1px solid ${hov ? P.borderHi : P.border}`,
        cursor: "default",
        transition: "background .18s, border-color .18s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent left bar */}
      <motion.div
        animate={{ scaleY: hov ? 1 : 0.5, opacity: hov ? 1 : 0.45 }}
        transition={{ duration: 0.18 }}
        style={{
          width: 2.5,
          height: 20,
          borderRadius: 2,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${P.lavender}, ${P.violet})`,
          transformOrigin: "center",
        }}
      />
      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>
        {emoji}
      </span>
      <span
        style={{
          fontSize: "clamp(11px, 0.9vw, 12.5px)",
          color: hov ? "rgba(255,255,255,0.85)" : P.textMid,
          fontWeight: 500,
          lineHeight: 1.45,
          transition: "color .18s",
        }}
      >
        {t(labelKey)}
      </span>
      {/* Hover shimmer */}
      {hov && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `linear-gradient(110deg, transparent, rgba(255,255,255,0.05), transparent)`,
          }}
        />
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function AuthBrandSide({ mode, t: tProp }) {
  const tLocal = useTranslations("auth");
  const t = tProp ?? tLocal;
  const isSignin = mode === "signin";
  const { settings } = usePlatformSettings();

  // Filter and map SOCIALS based on platform settings
  const activeSocials = SOCIALS.filter((s) => {
    if (s.id === "whatsapp") return !!settings?.whatsapp;
    return !!settings?.socials?.[s.id];
  }).map((s) => {
    const href =
      s.id === "whatsapp"
        ? `https://wa.me/${settings.whatsapp}`
        : settings.socials[s.id];
    return { ...s, href };
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* ── Deep background ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(145deg, ${P.bg2} 0%, ${P.bg1} 45%, ${P.bg0} 100%)`,
        }}
      />

      {/* Particle canvas */}
      <ParticleField />

      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,.9) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          pointerEvents: "none",
        }}
      />

      {/* Noise */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Big ambient orb — top right ── */}
      <motion.div
        animate={{ scale: [1, 1.14, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-22%",
          right: "-18%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${P.violet}55, transparent 65%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      {/* Bottom left orb */}
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "-18%",
          left: "-14%",
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${P.lavender}40, transparent 68%)`,
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />
      {/* Mid accent orb */}
      <motion.div
        animate={{
          x: [-10, 10, -10],
          y: [0, -16, 0],
          opacity: [0.07, 0.13, 0.07],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{
          position: "absolute",
          top: "38%",
          left: "22%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${P.lavender}44, transparent 70%)`,
          filter: "blur(42px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Decorative concentric arcs — bottom right ── */}
      {[260, 360, 460].map((sz, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: -sz * 0.55,
            right: -sz * 0.55,
            width: sz,
            height: sz,
            borderRadius: "50%",
            border: `1px solid rgba(255,255,255,${0.045 - i * 0.01})`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ── Floating geometric shapes ── */}
      {/* Top-left rotated square */}
      <motion.div
        animate={{ rotate: [12, 22, 12], y: [0, -12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 28,
          left: 22,
          width: 72,
          height: 72,
          border: `1.5px solid rgba(255,255,255,0.09)`,
          borderRadius: "22%",
          transform: "rotate(12deg)",
          pointerEvents: "none",
        }}
      />
      {/* Small filled square */}
      <motion.div
        animate={{ rotate: [30, 50, 30], y: [0, -8, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
        style={{
          position: "absolute",
          top: "38%",
          right: 22,
          width: 18,
          height: 18,
          borderRadius: 4,
          background: `rgba(157,155,216,0.18)`,
          transform: "rotate(30deg)",
          pointerEvents: "none",
        }}
      />
      {/* Circle */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.07, 0.13, 0.07] }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        style={{
          position: "absolute",
          bottom: "22%",
          right: 32,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          pointerEvents: "none",
        }}
      />
      {/* Diamond accent */}
      <motion.div
        animate={{ rotate: [45, 60, 45], y: [0, -10, 0] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
        style={{
          position: "absolute",
          top: "58%",
          left: 16,
          width: 12,
          height: 12,
          borderRadius: 2,
          background: P.lavender,
          opacity: 0.22,
          transform: "rotate(45deg)",
          pointerEvents: "none",
        }}
      />

      {/* ── CONTENT ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          maxWidth: "700px",
          padding: "clamp(28px, 4vh, 44px) clamp(24px, 3.5vw, 40px)",
          gap: 0,
        }}
      >
        {/* ── Logo row ── */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            width: "fit-content",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: "clamp(24px, 3.8vh, 42px)",
              cursor: "pointer",
            }}
          >
            {/* Logo tile */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${P.borderHi}`,
                boxShadow: `0 4px 22px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px ${P.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Logo />
            </div>
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.5px",
                  lineHeight: 1.1,
                }}
              >
                {t("brand.name")}
              </div>
              <div
                style={{
                  fontSize: 8.5,
                  color: P.textLow,
                  letterSpacing: "2.2px",
                  textTransform: "uppercase",
                  marginTop: 3,
                }}
              >
                {t("brand.tagline")}
              </div>
            </div>
          </motion.div>
        </Link>

        {/* ── Headline — switches with mode ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 22, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "clamp(18px, 2.8vh, 30px)" }}
          >
            {/* Mode chip */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.08)",
                border: `1px solid ${P.border}`,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: P.lavender,
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: P.lavender,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {isSignin
                  ? (t("brand.mode_signin") ?? "Sign In")
                  : (t("brand.mode_signup") ?? "Get Started")}
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(20px, 2.4vw, 32px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.22,
                letterSpacing: "-0.8px",
                marginBottom: 10,
                whiteSpace: "pre-line",
              }}
            >
              {isSignin
                ? t("brand.headline_signin")
                : t("brand.headline_signup")}
            </h1>
            <p
              style={{
                fontSize: "clamp(12px, 1vw, 13.5px)",
                color: P.textMid,
                lineHeight: 1.78,
                maxWidth: 330,
              }}
            >
              {isSignin ? t("brand.desc_signin") : t("brand.desc_signup")}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ── Stats — 3 separate cards in a row ── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: "clamp(14px, 2.2vh, 22px)",
          }}
        >
          {STATS.map((s, i) => (
            <StatCard
              key={s.key}
              val={t(s.valKey)}
              labelKey={s.key}
              t={t}
              delay={0.28 + i * 0.08}
            />
          ))}
        </div>

        {/* ── Features ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {FEATURES.map((f, i) => (
            <FeatureRow
              key={f.key}
              emoji={f.emoji}
              labelKey={f.key}
              t={t}
              index={i}
            />
          ))}
        </div>

        {/* ── Social footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          style={{ marginTop: "auto", paddingTop: "clamp(18px, 2.5vh, 28px)" }}
        >
          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${P.border})`,
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: P.textLow,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {t("brand.follow_us")}
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(90deg, ${P.border}, transparent)`,
              }}
            />
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              flexWrap: "wrap",
            }}
          >
            {activeSocials.map((s, i) => (
              <SocialBtn key={s.id} social={s} index={i} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
