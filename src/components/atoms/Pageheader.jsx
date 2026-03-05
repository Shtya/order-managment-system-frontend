"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

/* ══════════════════════════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════════════════════════ */
function AnimatedCounter({ value, delay = 0 }) {
  const raw = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  const prefix = String(value).match(/^[^0-9]*/)?.[0] || "";
  const suffix = String(value).replace(/^[^0-9]*[0-9,.]+/, "");
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started || isNaN(raw)) return;
    let start;
    const dur = 900;
    const raf = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(ease * raw));
      if (p < 1) requestAnimationFrame(raf);
      else setDisplay(raw);
    };
    requestAnimationFrame(raf);
  }, [started, raw]);

  if (isNaN(raw)) return <span>{value}</span>;
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ══════════════════════════════════════════════════════════════
   INFO CARD
══════════════════════════════════════════════════════════════ */
function InfoCard({
  title, value, icon, iconColor, editable,
  isAddCard, onEdit, onDelete, onClick, customStyles,
}) {
  const t = useTranslations("orders");
  const [hovered, setHovered] = useState(false);

  const handleClick = () => onClick?.();
  const handleEdit  = (e) => { e.stopPropagation(); onEdit?.(); };
  const handleDelete = (e) => { e.stopPropagation(); onDelete?.(); };

  const Icon   = icon;
  const accent = customStyles?.iconColor || "#6366f1";

  /* ── Add Card ── */
  if (isAddCard) {
    return (
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="group relative w-full rounded-xl overflow-hidden cursor-pointer
          border-2 border-dashed border-gray-200 hover:border-gray-300
          bg-white hover:bg-gray-50 transition-all duration-200"
        style={{ height: 82 }}>
        <div className="flex items-center justify-center gap-2.5 h-full px-5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200
            flex items-center justify-center flex-shrink-0 transition-colors">
            <Icon size={15} className="text-gray-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 group-hover:text-gray-500 transition-colors">
            {title}
          </span>
        </div>
      </motion.button>
    );
  }

  /* ── Stat Card ── */
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={editable ? handleClick : undefined}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="group relative w-full rounded-xl overflow-hidden"
      style={{
        height: 82,
        cursor: editable ? "pointer" : "default",
        background: "#fff",
        border: `1px solid ${hovered ? accent + "40" : "#e5e7eb"}`,
        boxShadow: hovered
          ? `0 4px 20px ${accent}18, 0 1px 4px rgba(0,0,0,0.06)`
          : "0 1px 3px rgba(0,0,0,0.05)",
        transition: "border-color .2s, box-shadow .2s",
      }}>

      {/* Top accent bar — slides in on hover */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2.5,
        background: `linear-gradient(90deg, ${accent}, ${accent}66)`,
        transformOrigin: "left",
        transform: hovered ? "scaleX(1)" : "scaleX(0.25)",
        transition: "transform .3s cubic-bezier(.16,1,.3,1)",
        borderRadius: "0 0 4px 0",
      }} />

      {/* Soft color wash */}
      <div style={{
        position: "absolute", inset: 0, opacity: hovered ? 1 : 0,
        background: `radial-gradient(ellipse at 15% 15%, ${accent}0d, transparent 65%)`,
        transition: "opacity .3s", pointerEvents: "none",
      }} />

      {/* Content */}
      <div className="relative flex items-center gap-3 px-4 h-full">
        {/* Icon */}
        <motion.div
          animate={{ rotate: hovered ? 6 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${accent}14`,
            border: `1px solid ${accent}22`,
            boxShadow: hovered ? `0 0 14px ${accent}30` : "none",
            transition: "box-shadow .2s",
          }}>
          <Icon size={18} style={{ color: accent }} />
        </motion.div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div style={{
            fontSize: 26, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.025em",
            color: hovered ? accent : "#111827",
            transition: "color .2s",
            fontVariantNumeric: "tabular-nums",
          }}>
            <AnimatedCounter value={value} />
          </div>
          <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-gray-400 truncate">
            {title}
          </div>
        </div>

        {/* Editable controls */}
        {editable && (
          <>
            {/* "Custom" pill — visible when not hovered */}
            <motion.div
              animate={{ opacity: hovered ? 0 : 1 }}
              transition={{ duration: .15 }}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ background: `${accent}12`, border: `1px solid ${accent}22`, color: accent }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              {t("custom")}
            </motion.div>

            {/* Edit / Delete — visible on hover */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: .15 }}
                  className="flex-shrink-0 flex items-center gap-1.5">
                  <button
                    onClick={handleEdit}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3b82f6" }}
                    onMouseEnter={e => Object.assign(e.currentTarget.style, { background: "#3b82f6", color: "#fff" })}
                    onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "#eff6ff", color: "#3b82f6" })}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                    style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444" }}
                    onMouseEnter={e => Object.assign(e.currentTarget.style, { background: "#ef4444", color: "#fff" })}
                    onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "#fef2f2", color: "#ef4444" })}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SWITCHER TABS  (unchanged API)
══════════════════════════════════════════════════════════════ */
function SwitcherTabs({ items, activeId, onChange, className = "", itemClassName = "", activeClassName = "", inactiveClassName = "" }) {
  return (
    <div className={["flex items-stretch w-full border-t border-gray-100", className].join(" ")}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange?.(item.id)}
            className={[
              "relative flex items-center gap-2 px-5 py-3 text-[13px] font-semibold",
              "select-none transition-colors duration-200 focus:outline-none whitespace-nowrap",
              itemClassName,
              isActive
                ? ["text-amber-600", activeClassName].join(" ")
                : ["text-gray-400 hover:text-gray-600", inactiveClassName].join(" "),
            ].join(" ")}>
            {Icon && (
              <Icon size={14} className={isActive ? "text-amber-500" : "text-gray-300"} />
            )}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className={[
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold leading-none transition-colors",
                isActive ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400",
              ].join(" ")}>
                {item.count}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId="tab-underline"
                className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] rounded-t-full"
                style={{ background: "linear-gradient(90deg, #f59e0b, #f97316)" }}
                transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.5 }}
              />
            )}
          </button>
        );
      })}
      <div className="flex-1 border-b border-transparent" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INLINE ICONS
══════════════════════════════════════════════════════════════ */
const HomeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════════ */
export function PageHeaderStatsSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          className="w-full rounded-xl border border-gray-100 bg-gray-50 animate-pulse"
          style={{ height: 82 }}>
          <div className="flex items-center gap-3 px-4 h-full">
            <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/5 rounded-md bg-gray-200" />
              <div className="h-2.5 w-3/5 rounded bg-gray-100" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STATS GRID
══════════════════════════════════════════════════════════════ */
export function StatsGrid({ stats }) {
  if (!stats) return null;
  if (!Array.isArray(stats)) return <div>{stats}</div>;
  if (!stats.length) return null;

  const sorted = [...stats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
      {sorted.map((stat, i) => (
        <motion.div
          key={stat.id ?? i}
          style={{ order: stat.sortOrder ?? i }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.055, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          {stat.isAddCard ? (
            <InfoCard title={stat.name} icon={stat.icon} isAddCard onClick={stat.onClick} />
          ) : (
            <InfoCard
              title={stat.name}
              value={String(stat.value ?? 0)}
              icon={stat.icon}
              iconColor=""
              editable={stat.editable ?? false}
              onEdit={stat.onEdit}
              onDelete={stat.onDelete}
              onClick={stat.onClick}
              customStyles={{ iconColor: stat.color }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE HEADER  — same props API as the original
══════════════════════════════════════════════════════════════ */
export function PageHeader({
  breadcrumbs = [],
  buttons,
  stats,
  statsLoading = false,
  statsCount = 6,
  className = "",
  items = [],
  active,
  setActive,
}) {
  const hasStats = statsLoading || (Array.isArray(stats) ? stats.length > 0 : !!stats);
  const hasTabs  = items?.length >= 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={[
        "relative overflow-hidden bg-card mb-6 ",
        hasTabs ? "pb-0" : "pb-5",
        className,
      ].join(" ")}
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>

      {/* Subtle top highlight */}
      <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      {/* Very soft ambient tint — top-right corner */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />

      <div className="relative flex flex-col gap-5  ">

        {/* ─── 1. Breadcrumb ←→ Buttons ─── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2 flex-wrap list-none m-0 p-0">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <li key={i} className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="rtl:scale-x-[-1] text-gray-300 flex items-center">
                        <ChevronIcon />
                      </span>
                    )}
                    {isLast ? (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2.5">
                        <span className="text-[19px] font-bold tracking-tight text-foreground leading-none">
                          {crumb.name}
                        </span>
                        {/* Live dot */}
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" style={{ boxShadow: "0 0 6px #f59e0b" }} />
                        </span>
                      </motion.span>
                    ) : (
                      <button
                        onClick={crumb.onClick ?? (crumb.href ? () => (window.location.href = crumb.href) : undefined)}
                        className="flex items-center gap-1.5 text-[12px] font-medium leading-none
                          text-gray-400 hover:text-amber-500 bg-transparent border-0 p-0 cursor-pointer transition-colors">
                        {i === 0 && <HomeIcon />}
                        {crumb.name}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {buttons && (
            <AnimatePresence mode="wait">
              <motion.div
                key="phdr-btns"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 flex-wrap">
                {buttons}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ─── 2. Stats Grid ─── */}
        {hasStats && (
          <div>
            {statsLoading
              ? <PageHeaderStatsSkeleton count={statsCount} />
              : <StatsGrid stats={stats} />
            }
          </div>
        )}

        {/* ─── 3. Tabs ─── */}
        {hasTabs && (
          <SwitcherTabs
            items={items}
            activeId={active}
            onChange={setActive}
          />
        )}
      </div>
    </motion.div>
  );
}

export default PageHeader;