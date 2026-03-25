"use client";

import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Globe,
  LayoutDashboard,
  LogOut,
  Crown,
  BadgeCheck,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BRAND = "#6763AF";
const BRAND_L = "#8b88c9";

const stagger = (i) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.55,
    delay: 0.08 + i * 0.07,
    ease: [0.22, 1, 0.36, 1],
  },
});

function getDashboardRoute(role) {
  if (role === "admin") return "/orders";
  if (role === "super_admin") return "/dashboard/users";
  return "/orders/employee-orders";
}

function getRoleLabel(role, t) {
  if (role === "super_admin") return t("roles.super_admin");
  if (role === "admin") return t("roles.admin");
  return t("roles.user");
}

function getRoleBadgeStyle(role) {
  if (role === "super_admin")
    return {
      background: "#fef3c7",
      color: "#d97706",
      border: "1px solid #fde68a",
    };
  if (role === "admin")
    return {
      background: `${BRAND}14`,
      color: BRAND,
      border: `1px solid ${BRAND}30`,
    };
  return {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  };
}

function getPlanStatusStyle(status) {
  if (status === "active")
    return { background: "#f0fdf4", color: "#16a34a", dot: "#22c55e" };
  if (status === "cancelled")
    return { background: "#fef2f2", color: "#dc2626", dot: "#ef4444" };
  return { background: "#fff7ed", color: "#ea580c", dot: "#f97316" };
}

function getInitials(name) {
  return (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Language Toggle ── */
function LanguageToggle({
  currentLang,
  onToggle,
  languages = { ar: "AR", en: "EN" },
}) {
  const [hovered, setHovered] = useState(false);
  const otherLang = useMemo(() => {
    const keys = Object.keys(languages);
    return keys.find((l) => l !== currentLang) || keys[0];
  }, [languages, currentLang]);

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.93 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-1.5 h-9 px-3 rounded-xl overflow-hidden border transition-all duration-300"
      style={{
        borderColor: hovered ? `${BRAND}40` : "#e5e7eb",
        background: hovered ? `${BRAND}08` : "rgba(255,255,255,0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ x: "-100%" }}
            animate={{ x: "250%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            className="absolute inset-0 pointer-events-none skew-x-12"
            style={{
              background: `linear-gradient(90deg,transparent,${BRAND}22,transparent)`,
            }}
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={{ rotate: hovered ? 180 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <Globe size={13} style={{ color: hovered ? BRAND : "#9ca3af" }} />
      </motion.div>
      <span className="w-px h-3.5 bg-gray-200" />
      <AnimatePresence mode="wait">
        <motion.span
          key={otherLang}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -6, opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: hovered ? BRAND : "#6b7280" }}
        >
          {otherLang}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

/* ── Avatar Popover ── */
function AvatarPopover({ user, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = getInitials(user.name);
  const roleStyle = getRoleBadgeStyle(user.role?.name);
  const dashRoute = getDashboardRoute(user.role?.name);
  const { logout } = useAuth();

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-2 h-9 pl-2 pr-2.5 rounded-xl border transition-all duration-200"
        style={{
          borderColor: open ? `${BRAND}45` : "#e5e7eb",
          background: open ? `${BRAND}0d` : "rgba(255,255,255,0.85)",
          boxShadow: open ? `0 0 0 3px ${BRAND}18` : "none",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Avatar */}
        <div
          className="w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_L})` }}
        >
          <motion.div
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            className="absolute inset-0 skew-x-12"
            style={{
              background:
                "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",
            }}
          />
          <span className="relative z-10">{initials}</span>
        </div>
        <div className="flex flex-col items-start leading-none gap-0.5">
          <span className="text-[12px] font-bold text-gray-800 max-w-[72px] truncate">
            {user.name}
          </span>
          <span
            className="text-[9.5px] font-semibold uppercase tracking-wide"
            style={{ color: BRAND }}
          >
            {getRoleLabel(user.role?.name, t)}
          </span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
        >
          <ChevronDown size={11} className="text-gray-400" />
        </motion.div>
      </motion.button>

      {/* ── Popover ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[calc(100%+10px)] left-0 z-[200] w-[264px]"
            style={{
              background: "rgba(255,255,255,0.99)",
              borderRadius: 20,
              border: "1px solid #ede9fe",
              boxShadow:
                "0 24px 64px rgba(103,99,175,0.2), 0 4px 16px rgba(0,0,0,0.06)",
              backdropFilter: "blur(28px)",
              overflow: "hidden",
            }}
          >
            {/* gradient top bar */}
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg,${BRAND},${BRAND_L},#a78bfa,${BRAND})`,
                backgroundSize: "200% 100%",
              }}
            />

            {/* User header */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg,${BRAND},${BRAND_L})`,
                    boxShadow: `0 6px 18px ${BRAND}40`,
                  }}
                >
                  <motion.div
                    animate={{ x: ["-120%", "220%"] }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                    className="absolute inset-0 skew-x-12"
                    style={{
                      background:
                        "linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)",
                    }}
                  />
                  <span className="relative z-10">{initials}</span>
                </div>
                <div className="flex-1 flex items-center gap-2 justify-between min-w-0 pt-0.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-extrabold text-gray-900 truncate leading-tight">
                        {user.name}
                      </span>
                      <BadgeCheck
                        size={13}
                        style={{ color: BRAND, flexShrink: 0 }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  {/* Role */}
                  <span
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-xl"
                    style={roleStyle}
                  >
                    <Crown size={8} />
                    {getRoleLabel(user.role?.name, t)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="mx-3 h-px"
              style={{
                background:
                  "linear-gradient(90deg,transparent,#ede9fe,transparent)",
              }}
            />

            {/* Actions */}
            <div className="p-2">
              {[
                {
                  href: dashRoute,
                  icon: <LayoutDashboard size={13} style={{ color: BRAND }} />,
                  iconBg: `${BRAND}14`,
                  label: t("auth.dashboard"),
                  hoverBg: `${BRAND}0e`,
                  hoverColor: BRAND,
                  isLink: true,
                },
                {
                  icon: <LogOut size={13} style={{ color: "#ef4444" }} />,
                  iconBg: "#fff1f2",
                  label: t("logout"),
                  hoverBg: "#fff1f2",
                  hoverColor: "#ef4444",
                  onClick: logout,
                  isLink: false,
                },
              ].map((item, idx) => {
                const inner = (
                  <>
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.iconBg }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[12.5px] font-semibold">
                      {item.label}
                    </span>
                  </>
                );
                const sharedClass =
                  "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-all duration-150 text-gray-700";
                return item.isLink ? (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={sharedClass}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = item.hoverBg;
                      e.currentTarget.style.color = item.hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#374151";
                    }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={idx}
                    onClick={item.onClick}
                    className={sharedClass}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = item.hoverBg;
                      e.currentTarget.style.color = item.hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#374151";
                    }}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Navbar ── */
export default function Navbar({ t, locale, switchLocale, user }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  // Plain window scroll — works in all contexts
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const h = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navLinks = [
    { key: "home", id: "home" },
    { key: "services", id: "services" },
    { key: "about", id: "how-it-works" },
    { key: "pricing", id: "pricing" },
    { key: "contact", id: "contact" },
  ];
  const solidBg = scrolled || mobileOpen;

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 inset-x-0 z-50"
      >
        <motion.div
          animate={{
            backgroundColor: solidBg
              ? "rgba(255,255,255,0.97)"
              : "rgba(255,255,255,0)",
            boxShadow:
              scrolled && !mobileOpen
                ? "0 1px 40px rgba(103,99,175,0.10), 0 1px 0 rgba(103,99,175,0.06)"
                : "none",
          }}
          transition={{ duration: 0.35 }}
          className="w-full"
          style={{ backdropFilter: solidBg ? "blur(20px)" : "none" }}
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden relative"
                  style={{
                    background: `linear-gradient(135deg,${BRAND},#8b88c9)`,
                    boxShadow: `0 4px 14px ${BRAND}44`,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 -skew-x-12"
                    animate={{ x: ["-150%", "250%"] }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                    style={{
                      background:
                        "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",
                    }}
                  />
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="relative z-10"
                  >
                    <path
                      d="M21 8L12 3L3 8V16L12 21L21 16V8Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 3V21M3 8L12 13L21 8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="font-extrabold text-gray-800 text-[15px] tracking-tight">
                  {t("brand.name")}{" "}
                  <span style={{ color: BRAND }}>{t("brand.suffix")}</span>
                </span>
              </motion.div>

              {/* Desktop links */}
              <div className="hidden md:flex items-center gap-0.5">
                {navLinks.map((nav, i) => (
                  <motion.a
                    key={nav.key}
                    href={`#${nav.id}`}
                    {...stagger(i)}
                    whileHover={{ scale: 1.02, color: BRAND }}
                    whileTap={{ scale: 0.98 }}
                    className="relative px-4 py-2 text-[13px] font-medium rounded-xl transition-colors"
                    style={{ color: "#6b7280" }}
                  >
                    {t(`nav.${nav.key}`)}
                  </motion.a>
                ))}
              </div>

              {/* Desktop right */}
              <div className="hidden md:flex items-center gap-2">
                <LanguageToggle
                  currentLang={locale}
                  languages={{ ar: "AR", en: "EN" }}
                  onToggle={() => switchLocale(locale === "ar" ? "en" : "ar")}
                />

                {user ? (
                  <AvatarPopover user={user} t={t} />
                ) : (
                  <>
                    <Link
                      href="/auth?mode=signup"
                      className="text-[12.5px] font-semibold px-4 py-2 rounded-xl border transition-all"
                      style={{
                        color: BRAND,
                        borderColor: `${BRAND}35`,
                        background: `${BRAND}06`,
                      }}
                    >
                      {t("auth.signup")}
                    </Link>
                    <Link
                      href="/auth?mode=signin"
                      className="relative text-[12.5px] font-bold px-4 py-2 rounded-xl text-white overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg,${BRAND} 0%,#8b88c9 100%)`,
                        boxShadow: `0 4px 16px ${BRAND}35`,
                      }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                        style={{
                          background:
                            "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)",
                        }}
                      />
                      <span className="relative z-10">{t("auth.signin")}</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile right */}
              <div className="md:hidden flex items-center gap-2">
                <LanguageToggle
                  currentLang={locale}
                  languages={{ ar: "AR", en: "EN" }}
                  onToggle={() => switchLocale(locale === "ar" ? "en" : "ar")}
                />
                {user && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white"
                    style={{
                      background: `linear-gradient(135deg,${BRAND},${BRAND_L})`,
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Toggle menu"
                  className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl"
                >
                  <motion.span
                    animate={
                      mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }
                    }
                    transition={{ duration: 0.25 }}
                    className="block w-5 h-0.5 rounded-full origin-center"
                    style={{ background: BRAND }}
                  />
                  <motion.span
                    animate={
                      mobileOpen
                        ? { opacity: 0, scaleX: 0 }
                        : { opacity: 1, scaleX: 1 }
                    }
                    transition={{ duration: 0.2 }}
                    className="block w-5 h-0.5 rounded-full"
                    style={{ background: BRAND }}
                  />
                  <motion.span
                    animate={
                      mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }
                    }
                    transition={{ duration: 0.25 }}
                    className="block w-5 h-0.5 rounded-full origin-center"
                    style={{ background: BRAND }}
                  />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <motion.div
            initial={false}
            animate={
              mobileOpen
                ? { height: "auto", opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:hidden border-t"
            style={{ borderColor: mobileOpen ? `${BRAND}18` : "transparent" }}
          >
            <div
              className="container mx-auto px-6 py-4 flex flex-col gap-1"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              {/* Mobile user card */}
              {user && (
                <motion.div
                  animate={
                    mobileOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }
                  }
                  transition={{ delay: 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl mb-2"
                  style={{
                    background: `${BRAND}08`,
                    border: `1px solid ${BRAND}18`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black text-white flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg,${BRAND},${BRAND_L})`,
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-[10.5px] text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-xl"
                    style={{ background: `${BRAND}14`, color: BRAND }}
                  >
                    {getRoleLabel(user.role?.name, t)}
                  </span>
                </motion.div>
              )}

              {navLinks.map((nav, i) => (
                <motion.a
                  key={nav.key}
                  href={`#${nav.id}`}
                  initial={false}
                  animate={
                    mobileOpen
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: locale === "ar" ? 16 : -16 }
                  }
                  transition={{
                    delay: mobileOpen ? i * 0.055 : 0,
                    duration: 0.3,
                  }}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm rounded-xl font-medium px-4 py-3 transition-colors"
                  style={{
                    textAlign: locale === "ar" ? "right" : "left",
                    color: "#4b5563",
                  }}
                >
                  {t(`nav.${nav.key}`)}
                </motion.a>
              ))}

              <div
                className="flex gap-2 mt-2 pt-3"
                style={{ borderTop: `1px solid ${BRAND}12` }}
              >
                {user ? (
                  <>
                    <Link
                      href={getDashboardRoute(user.role?.name)}
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl text-white"
                      style={{
                        background: `linear-gradient(135deg,${BRAND},#8b88c9)`,
                      }}
                    >
                      {t("auth.dashboard")}
                    </Link>
                    <button
                      onClick={logout}
                      className="w-10 flex items-center justify-center rounded-xl border transition-colors"
                      style={{
                        color: "#ef4444",
                        borderColor: "#fecaca",
                        background: "#fff1f2",
                      }}
                    >
                      <LogOut size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth?mode=signup"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl border"
                      style={{ color: BRAND, borderColor: `${BRAND}40` }}
                    >
                      {t("auth.signup")}
                    </Link>
                    <Link
                      href="/auth?mode=signin"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl text-white"
                      style={{
                        background: `linear-gradient(135deg,${BRAND},#8b88c9)`,
                      }}
                    >
                      {t("auth.signin")}
                    </Link>
                  </>
                )}
              </div>
              <div className="h-2" />
            </div>
          </motion.div>
        </motion.div>
      </motion.nav>

      <div className="h-16" />
    </>
  );
}
