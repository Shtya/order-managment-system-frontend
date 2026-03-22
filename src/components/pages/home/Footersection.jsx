"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

/* ─── Social icons (inline SVG) ─── */
const SOCIAL_ICONS = [
  {
    id: "facebook",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    id: "x", // Matches the 'x' key in your admin settings
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    id: "github",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  },
  {
    id: "youtube",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon
          points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

/* ─── Logo ─── */
function Logo({ t }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        direction: "rtl",
      }}
    >
      {/* Box icon */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: "linear-gradient(135deg, #6763AF, #6763AF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 12px #6763AF",
          fontSize: 16,
        }}
      >
        📦
      </div>
      <span
        style={{
          fontWeight: 800,
          fontSize: 18,
          color: "#1e1b4b",
          letterSpacing: "-0.3px",
        }}
      >
        {t("logo")}
      </span>
    </div>
  );
}

/* ─── Nav link ─── */
function NavLink({ label, index }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <a
      href="#"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: hovered ? "#6763AF" : "#6b7280",
        textDecoration: "none",
        transition: "color 0.2s, transform 0.2s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        display: "inline-block",
        opacity: visible ? 1 : 0,
        animation: visible
          ? "navIn 0.5s cubic-bezier(.34,1.4,.64,1) forwards"
          : "none",
        animationDelay: `${index * 80}ms`,
      }}
    >
      {label}
    </a>
  );
}

/* ─── Social button ─── */
function SocialBtn({ icon, href, index }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300 + index * 70);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1.5px solid ${hovered ? "#6763AF" : "#ddd6fe"}`,
        background: hovered
          ? "linear-gradient(135deg,#6763AF,#6763AF)"
          : "rgba(237,233,254,0.5)",
        color: hovered ? "#fff" : "#6763AF",
        transition: "all 0.25s cubic-bezier(.34,1.4,.64,1)",
        transform: hovered
          ? "translateY(-4px) scale(1.08)"
          : "translateY(0) scale(1)",
        boxShadow: hovered ? "0 6px 18px #6763AF" : "none",
        opacity: visible ? 1 : 0,
        animation: visible
          ? "socialIn 0.5s cubic-bezier(.34,1.4,.64,1) forwards"
          : "none",
        animationDelay: `${index * 70}ms`,
        textDecoration: "none",
      }}
    >
      {icon}
    </a>
  );
}

/* ─── Main Footer ─── */
export default function FooterSection() {
  const t = useTranslations("footer");
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const { settings, isLoading } = usePlatformSettings();
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const activeSocials = SOCIAL_ICONS.filter(
    (s) => settings?.socials?.[s.id],
  ).map((s) => ({
    ...s,
    href: settings.socials[s.id], // Assign the real URL
  }));

  const navLinks = ["home", "services", "pricing", "about", "contact"];

  return (
    <>
      <style>{`
        @keyframes navIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes socialIn {
          from { opacity: 0; transform: translateY(14px) scale(0.8); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes footerFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes logoPop {
          from { opacity: 0; transform: scale(0.8) translateX(20px); }
          to   { opacity: 1; transform: scale(1) translateX(0); }
        }
      `}</style>

      <footer
        ref={ref}
        dir="rtl"
        style={{
          background:
            "linear-gradient(180deg, #f5f3ff 0%, #faf9ff 60%, #ffffff 100%)",
          borderTop: "1px solid #ede9fe",
          padding: "0",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Subtle gradient blob */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: "20%",
            width: "400px",
            height: "200px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Top row: logo + nav ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "28px 48px",
            flexWrap: "wrap",
            gap: 20,
            opacity: visible ? 1 : 0,
            animation: visible ? "footerFadeIn 0.6s ease forwards" : "none",
          }}
        >
          {/* Logo */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              animation: visible
                ? "logoPop 0.6s cubic-bezier(.34,1.4,.64,1) 0.1s both"
                : "none",
            }}
          >
            <Logo t={t} />
          </div>

          {/* Nav links */}
          <nav
            style={{
              display: "flex",
              gap: 32,
              alignItems: "center",
              flexWrap: "wrap",
              direction: "rtl",
            }}
          >
            {navLinks.map((key, i) => (
              <NavLink key={key} label={t(`nav.${key}`)} index={i} />
            ))}
          </nav>
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            height: 1,
            margin: "0 48px",
            background: "#ede9fe",
            transformOrigin: "right",
            animation: visible
              ? "lineGrow 0.8s cubic-bezier(.4,0,.2,1) 0.3s both"
              : "none",
          }}
        />

        {/* ── Bottom row: socials + copyright ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 48px 28px",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Social icons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {activeSocials.map((s, i) => (
              <SocialBtn
                key={s.id}
                icon={s.icon}
                href={s.href}
                index={i}
                visible={visible}
              />
            ))}
          </div>
          {/* Copyright */}
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              direction: "rtl",
              margin: 0,
              opacity: visible ? 1 : 0,
              animation: visible ? "footerFadeIn 0.6s ease 0.5s both" : "none",
            }}
          >
            {t("copyright")}
          </p>
        </div>
      </footer>
    </>
  );
}
