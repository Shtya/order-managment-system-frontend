"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Truck,
  Package,
  ScanLine,
  CheckCircle2,
  Loader2,
  FileDown,
  Calendar,
  Info,
  ChevronDown,
  FileText,
  X,
  Volume2,
  VolumeX,
  AlertCircle,
  Hash,
  MapPin,
  User,
  CreditCard,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "../../../../components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import ActionButtons from "@/components/atoms/Actions";
import {
  STATUS,
  CARRIERS,
  PRODUCT_CONDITIONS,
  returnInventoryFromCarrier,
} from "./data";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const DS = {
  radius: "rounded-lg",
  radiusSm: "rounded-md",
  radiusXl: "rounded-xl",

  primary: "#ff8b00",
  primaryLight: "rgba(255,139,0,0.10)",
  primaryBorder: "rgba(255,139,0,0.25)",
  accent: "#6763af",
  success: "#10b981",
  successLight: "rgba(16,185,129,0.10)",
  danger: "#ef4444",
  dangerLight: "rgba(239,68,68,0.10)",
  warning: "#ffb703",

  headerGradient: "linear-gradient(135deg, var(--primary) 0%, #ff5c2b 100%)",
  successGradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  dangerGradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
  cardGradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  successCardGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",

  shadow: "shadow-sm",
  shadowMd: "shadow-md",

  scanline: {
    backgroundImage:
      "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 4px)",
  },
};

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────
function Panel({ children, className }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800/80",
        DS.radiusXl,
        "border border-slate-100 dark:border-slate-700",
        DS.shadow,
        "overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

function PanelHeader({ icon: Icon, pretitle, title, right, children }) {
  return (
    <div className="relative px-5 py-4 overflow-hidden" style={{ background: DS.headerGradient }}>
      <div className="absolute -top-5 -left-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-5 -right-5 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-9 h-9 flex-shrink-0 flex items-center justify-center",
              DS.radiusSm,
              "bg-white/20 backdrop-blur-sm"
            )}
          >
            <Icon size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            {pretitle && (
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                {pretitle}
              </p>
            )}
            <h3 className="text-white font-black text-sm tracking-tight truncate">{title}</h3>
          </div>
        </div>
        {right && <div className="flex items-center gap-1.5 flex-shrink-0">{right}</div>}
      </div>
      {children && <div className="relative mt-3">{children}</div>}
    </div>
  );
}

function HeaderBadge({ children, onClick }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5",
        "bg-white/20 hover:bg-white/30 text-white",
        "text-[11px] font-semibold px-2.5 py-1.5",
        DS.radiusSm,
        "transition-colors",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      {children}
    </Tag>
  );
}

function HeaderIconBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-8 h-8 flex items-center justify-center",
        DS.radiusSm,
        "bg-white/20 hover:bg-white/30 transition-colors"
      )}
    >
      {children}
    </button>
  );
}

function CarrierPill({ carrier }) {
  const map = {
    ARAMEX: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-400",
    },
    SMSA: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-400",
    },
    DHL: {
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-700 dark:text-yellow-400",
    },
    BOSTA: {
      bg: "bg-orange-50 dark:bg-orange-950/20",
      border: "border-orange-200 dark:border-orange-800",
      text: "text-orange-700 dark:text-orange-400",
    },
  };
  const s = map[carrier] || {};
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1",
        DS.radiusSm,
        "text-xs font-bold border",
        s.bg,
        s.border,
        s.text
      )}
    >
      <Truck size={11} />
      {carrier}
    </span>
  );
}

function ArcRing({ pct, size = 44, stroke = 3.5, color, trackColor }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 w-full h-full -rotate-90"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - Math.min(pct / 100, 1)) }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
    </svg>
  );
}

function playBeep(type = "success") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────
// PDF STYLES
// ─────────────────────────────────────────────────────────────
const PDF_STYLE_WARM = `
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Tajawal:wght@300;400;500;700&display=swap');

  :root {
    --charcoal:       #2c2c2e;
    --charcoal-mid:   #48484a;
    --charcoal-soft:  #6c6c70;
    --charcoal-muted: #98989d;
    --charcoal-faint: #c7c7cc;
    --cream:          #f5f4f0;
    --cream-warm:     #efede8;
    --cream-deep:     #e8e5de;
    --white:          #ffffff;
    --rule:           #dddad3;
    --rule-soft:      #eceae4;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'Tajawal', sans-serif;
  }

  body {
    font-family: var(--sans);
    background: var(--white);
    color: var(--charcoal);
    -webkit-font-smoothing: antialiased;
  }

  .header-band { background: var(--cream); border-bottom: 2px solid var(--cream-deep); }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    border-bottom: 1px solid var(--rule);
  }

  .header-brand {
    padding: 26px 32px;
    border-left: 1px solid var(--rule);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .brand-icon {
    width: 40px; height: 40px;
    background: var(--charcoal);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .brand-icon svg {
    width: 20px; height: 20px;
    fill: none; stroke: #f5f4f0;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }

  .doc-title {
    font-family: var(--sans);
    font-size: 19px; font-weight: 700;
    color: var(--charcoal);
    line-height: 1.1; letter-spacing: -0.3px;
  }

  .doc-subtitle {
    font-family: var(--mono);
    font-size: 11px; font-weight: 400;
    color: var(--charcoal-soft);
    margin-top: 3px; letter-spacing: 0.3px;
  }

  .header-ref {
    padding: 26px 32px;
    display: flex; flex-direction: column;
    justify-content: center; align-items: flex-start;
    gap: 5px;
  }

  .ref-badge {
    font-family: var(--mono);
    font-size: 10px; font-weight: 600;
    color: var(--charcoal-soft);
    background: var(--cream-deep);
    padding: 3px 9px; border-radius: 4px;
    letter-spacing: 0.8px; text-transform: uppercase;
  }

  .ref-date  { font-family: var(--mono); font-size: 11px; color: var(--charcoal-muted); }
  .ref-employee { font-family: var(--sans); font-size: 12px; color: var(--charcoal-mid); font-weight: 500; }

  .meta-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: var(--cream-warm);
  }

  .meta-cell { padding: 16px 20px; border-left: 1px solid var(--rule); position: relative; }
  .meta-cell:last-child { border-left: none; }
  .meta-cell.highlight::before {
    content: ''; position: absolute;
    top: 0; right: 0;
    width: 3px; height: 100%;
    background: var(--charcoal);
  }

  .meta-label {
    font-family: var(--mono);
    font-size: 8.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.4px;
    color: var(--charcoal-faint); margin-bottom: 6px;
  }

  .meta-value {
    font-family: var(--sans);
    font-size: 15px; font-weight: 700;
    color: var(--charcoal); line-height: 1;
  }

  .meta-value.mono { font-family: var(--mono); font-size: 13px; }

  .orders-wrap { padding: 28px 32px; background: var(--white); }

  .section-label {
    display: flex; align-items: center;
    gap: 12px; margin-bottom: 20px;
  }

  .section-label-text {
    font-family: var(--mono);
    font-size: 9px; font-weight: 600;
    letter-spacing: 2px; text-transform: uppercase;
    color: var(--charcoal-faint); white-space: nowrap;
  }

  .section-label-line { flex: 1; height: 1px; background: var(--rule-soft); }

  .order-card {
    margin-bottom: 14px;
    border: 1.5px solid var(--rule);
    border-radius: 8px; overflow: hidden;
    background: var(--white);
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .order-card:last-child { margin-bottom: 0; }

  .order-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 16px;
    background: var(--cream);
    border-bottom: 1px solid var(--rule);
  }

  .order-head-left { display: flex; align-items: center; gap: 10px; }

  .order-index {
    width: 22px; height: 22px;
    background: var(--charcoal); color: var(--white);
    border-radius: 50%;
    font-family: var(--mono); font-size: 10px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .order-code { font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--charcoal); letter-spacing: 0.3px; }
  .order-sep  { width: 1px; height: 14px; background: var(--rule); }
  .order-customer { font-family: var(--sans); font-size: 12px; font-weight: 500; color: var(--charcoal-mid); }
  .order-city {
    font-family: var(--mono); font-size: 10px;
    color: var(--charcoal-muted);
    background: var(--cream-deep);
    padding: 2px 8px; border-radius: 20px; letter-spacing: 0.3px;
  }

  table { width: 100%; border-collapse: collapse; }

  thead tr { background: var(--cream-warm); border-bottom: 1px solid var(--rule); }

  th {
    font-family: var(--mono);
    font-size: 8.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--charcoal-muted);
    padding: 9px 16px; text-align: right;
  }

  th.center, td.center { text-align: center; }

  tbody tr { border-bottom: 1px solid var(--rule-soft); }
  tbody tr:last-child { border-bottom: none; }

  td {
    font-family: var(--sans);
    font-size: 12.5px; color: var(--charcoal-mid);
    padding: 10px 16px;
    text-align: right; vertical-align: middle;
  }

  td.sku-cell   { font-family: var(--mono); font-size: 11px; color: var(--charcoal); font-weight: 500; }
  td.qty-cell   { font-family: var(--mono); font-size: 14px; font-weight: 600; color: var(--charcoal); text-align: center; }
  td.track-cell { font-family: var(--mono); font-size: 10px; color: var(--charcoal-muted); }
  td.track-cell span {
    background: var(--cream-warm);
    padding: 2px 8px; border-radius: 4px;
    border: 1px solid var(--rule);
  }

  .condition-badge {
    display: inline-block;
    font-family: var(--sans);
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid var(--rule);
    background: var(--cream-warm);
    color: var(--charcoal-mid);
  }

  .sig-wrap {
    margin: 4px 32px 32px;
    border: 1.5px solid var(--rule);
    border-radius: 8px; overflow: hidden;
  }

  .sig-head {
    padding: 11px 18px;
    background: var(--cream-warm);
    border-bottom: 1px solid var(--rule);
    display: flex; align-items: center; gap: 10px;
  }

  .sig-head-dot { width: 7px; height: 7px; background: var(--charcoal-soft); border-radius: 50%; }

  .sig-head-text {
    font-family: var(--mono);
    font-size: 9px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--charcoal-soft);
  }

  .sig-fields { display: grid; grid-template-columns: repeat(3, 1fr); background: var(--white); }

  .sig-field { padding: 22px 20px 16px; border-left: 1px solid var(--rule-soft); }
  .sig-field:last-child { border-left: none; }

  .sig-field-label {
    font-family: var(--mono);
    font-size: 8.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--charcoal-faint); margin-bottom: 28px;
  }

  .sig-line {
    height: 1px;
    background: linear-gradient(to left, var(--rule), var(--charcoal-faint));
    border-radius: 1px;
  }

  .doc-footer {
    background: var(--cream);
    border-top: 1px solid var(--rule);
    padding: 12px 32px;
    display: flex; justify-content: space-between; align-items: center;
  }

  .footer-left { display: flex; align-items: center; gap: 8px; }

  .footer-mark {
    width: 16px; height: 16px;
    background: var(--charcoal-mid);
    border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
  }

  .footer-mark svg { width: 9px; height: 9px; stroke: var(--cream); stroke-width: 2; fill: none; stroke-linecap: round; }
  .footer-divider { width: 1px; height: 10px; background: var(--rule); margin: 0 2px; }
  .footer-text { font-family: var(--mono); font-size: 9px; color: var(--charcoal-muted); letter-spacing: 0.5px; }

  @media print { body { background: white; } }
</style>`;

const WRONG_SCAN_PDF_STYLE = `
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Tajawal:wght@300;400;500;700&display=swap');

  :root {
    --charcoal:       #2c2c2e;
    --charcoal-mid:   #48484a;
    --charcoal-soft:  #6c6c70;
    --charcoal-muted: #98989d;
    --charcoal-faint: #c7c7cc;
    --cream:          #f5f4f0;
    --cream-warm:     #efede8;
    --cream-deep:     #e8e5de;
    --white:          #ffffff;
    --rule:           #dddad3;
    --rule-soft:      #eceae4;
    --err:            #9b3a2f;
    --err-mid:        #b34335;
    --err-soft:       #e8d5d2;
    --err-bg:         #fdf5f4;
    --err-rule:       #dfc8c5;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'Tajawal', sans-serif;
  }

  body {
    font-family: var(--sans);
    background: var(--white);
    color: var(--charcoal);
    -webkit-font-smoothing: antialiased;
  }

  .header-band {
    background: var(--cream);
    border-bottom: 2px solid var(--cream-deep);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    border-bottom: 1px solid var(--rule);
  }

  .header-brand {
    padding: 24px 32px;
    border-left: 1px solid var(--rule);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .brand-icon {
    width: 42px; height: 42px;
    background: var(--err);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .brand-icon svg {
    width: 22px; height: 22px;
    fill: none; stroke: #fdf5f4;
    stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
  }

  .doc-title {
    font-family: var(--sans);
    font-size: 19px; font-weight: 700;
    color: var(--charcoal);
    line-height: 1.1; letter-spacing: -0.3px;
  }

  .doc-subtitle {
    font-family: var(--mono);
    font-size: 11px; font-weight: 400;
    color: var(--charcoal-soft);
    margin-top: 3px; letter-spacing: 0.3px;
  }

  .header-ref {
    padding: 24px 32px;
    display: flex; flex-direction: column;
    justify-content: center; align-items: flex-start;
    gap: 5px;
  }

  .ref-badge {
    font-family: var(--mono);
    font-size: 10px; font-weight: 600;
    color: var(--err-mid);
    background: var(--err-soft);
    padding: 3px 9px; border-radius: 4px;
    letter-spacing: 0.8px; text-transform: uppercase;
    border: 1px solid var(--err-rule);
  }

  .ref-date     { font-family: var(--mono); font-size: 11px; color: var(--charcoal-muted); }
  .ref-employee { font-family: var(--sans); font-size: 12px; color: var(--charcoal-mid); font-weight: 500; }

  .meta-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: var(--cream-warm);
  }

  .meta-cell { padding: 16px 20px; border-left: 1px solid var(--rule); position: relative; }
  .meta-cell:last-child { border-left: none; }

  .meta-cell.highlight::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 3px; height: 100%;
    background: var(--err);
  }

  .meta-label {
    font-family: var(--mono);
    font-size: 8.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.4px;
    color: var(--charcoal-faint); margin-bottom: 6px;
  }

  .meta-value {
    font-family: var(--sans);
    font-size: 15px; font-weight: 700;
    color: var(--charcoal); line-height: 1;
  }

  .meta-value.mono { font-family: var(--mono); font-size: 13px; }
  .meta-value.err  { color: var(--err); }

  .print-alert {
    display: none;
    margin: 20px 32px 0;
    padding: 12px 18px;
    border: 1.5px solid var(--err-rule);
    border-radius: 6px;
    background: var(--err-bg);
  }

  .print-alert-inner {
    display: flex; align-items: center; gap: 10px;
  }

  .print-alert-icon {
    width: 18px; height: 18px;
    border: 1.5px solid var(--err);
    border-radius: 50%;
    color: var(--err);
    font-family: var(--mono);
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .print-alert-text {
    font-family: var(--sans);
    font-size: 12px; font-weight: 500;
    color: var(--err-mid);
    line-height: 1.4;
  }

  .table-wrap { padding: 24px 32px 32px; }

  .section-label {
    display: flex; align-items: center;
    gap: 12px; margin-bottom: 16px;
  }

  .section-label-text {
    font-family: var(--mono);
    font-size: 9px; font-weight: 600;
    letter-spacing: 2px; text-transform: uppercase;
    color: var(--charcoal-faint); white-space: nowrap;
  }

  .section-label-line { flex: 1; height: 1px; background: var(--rule-soft); }

  .table-card {
    border: 1.5px solid var(--rule);
    border-radius: 8px; overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  table { width: 100%; border-collapse: collapse; }

  thead tr {
    background: var(--cream-warm);
    border-bottom: 1px solid var(--rule);
  }

  th {
    font-family: var(--mono);
    font-size: 8.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--charcoal-muted);
    padding: 10px 16px; text-align: right;
  }

  th.center { text-align: center; }

  tbody tr { border-bottom: 1px solid var(--rule-soft); }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #fdfcfb; }

  td {
    font-family: var(--sans);
    font-size: 12.5px; color: var(--charcoal-mid);
    padding: 11px 16px;
    text-align: right; vertical-align: middle;
  }

  td.idx-cell {
    font-family: var(--mono);
    font-size: 10px; color: var(--charcoal-faint);
    text-align: center; font-weight: 500;
    width: 42px;
  }

  td.code-cell {
    font-family: var(--mono);
    font-size: 12px; font-weight: 600;
    color: var(--err);
    letter-spacing: 0.3px;
  }

  .badge-error {
    display: inline-block;
    font-family: var(--sans);
    font-size: 11px; font-weight: 600;
    color: var(--err-mid);
    background: var(--err-soft);
    border: 1px solid var(--err-rule);
    padding: 3px 10px;
    border-radius: 20px;
    line-height: 1.4;
    white-space: nowrap;
  }

  td.time-cell {
    font-family: var(--mono);
    font-size: 10px; color: var(--charcoal-muted);
    letter-spacing: 0.2px;
  }

  td.time-cell span {
    background: var(--cream-warm);
    border: 1px solid var(--rule);
    padding: 2px 8px; border-radius: 4px;
  }

  .doc-footer {
    background: var(--cream);
    border-top: 1px solid var(--rule);
    padding: 12px 32px;
    display: flex; justify-content: space-between; align-items: center;
  }

  .footer-left { display: flex; align-items: center; gap: 8px; }

  .footer-mark {
    width: 16px; height: 16px;
    background: var(--err);
    border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
  }

  .footer-mark svg {
    width: 9px; height: 9px;
    stroke: var(--cream); stroke-width: 2.2;
    fill: none; stroke-linecap: round;
  }

  .footer-text { font-family: var(--mono); font-size: 9px; color: var(--charcoal-muted); letter-spacing: 0.5px; }
  .footer-divider { width: 1px; height: 10px; background: var(--rule); margin: 0 2px; }

  @media print {
    body { background: white; }

    .print-alert { display: block !important; }

    .header-band,
    .meta-strip,
    .meta-cell,
    thead tr,
    .badge-error,
    .doc-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    tbody tr { page-break-inside: avoid; }
    .table-card { box-shadow: none; }
  }
</style>`;

// ─────────────────────────────────────────────────────────────
// PDF BUILDERS
// ─────────────────────────────────────────────────────────────
function buildReturnPDF(orders, carrier, employee, now, labels) {
  const ordersHTML = orders
    .map((o, idx) => {
      const rows = (o.products || [])
        .map(
          (p) => `
      <tr>
        <td class="sku-cell">${p.sku || "—"}</td>
        <td>${p.name || "—"}</td>
        <td class="qty-cell">${p.requestedQty || p.scannedQty || 1}</td>
        <td class="track-cell"><span>${o.trackingCode || "—"}</span></td>
      </tr>`
        )
        .join("");

      return `
      <div class="order-card">
        <div class="order-head">
          <div class="order-head-left">
            <div class="order-index">${idx + 1}</div>
            <span class="order-code">${o.code}</span>
            <div class="order-sep"></div>
            <span class="order-customer">${o.customer || "—"}</span>
          </div>
          <span class="order-city">${o.city || "—"}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>${labels.pdf.sku}</th>
              <th>${labels.pdf.product}</th>
              <th class="center">${labels.pdf.qty}</th>
              <th>${labels.pdf.trackingCode}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="padding:10px 16px;border-top:1px solid #eceae4;background:#faf9f7;display:flex;justify-content:space-between;align-items:center;">
          <span class="condition-badge">${labels.pdf.condition}: ${o.returnCondition || "سليم"}</span>
          <span style="font-family:'IBM Plex Mono', monospace;font-size:11px;color:#6c6c70;">
            ${labels.pdf.total}: ${o.total || 0} ${labels.common.currency}
          </span>
        </div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${labels.pdf.title}</title>
  ${PDF_STYLE_WARM}
</head>
<body>

  <div class="header-band">
    <div class="header-top">
      <div class="header-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24">
            <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
            <path d="m7.5 4.27 9 5.15M3.29 7 12 12l8.71-5M12 22V12"/>
            <path d="M18 15l3 3-3 3M15 18h6"/>
          </svg>
        </div>
        <div>
          <div class="doc-title">${labels.pdf.title}</div>
          <div class="doc-subtitle">RETURN RECEIPT · ${carrier}</div>
        </div>
      </div>
      <div class="header-ref">
        <div class="ref-badge">${labels.pdf.refPrefix}-${now.replace(/\D/g, "").slice(0, 8)}</div>
        <div class="ref-date">${now}</div>
        <div class="ref-employee">${employee}</div>
      </div>
    </div>

    <div class="meta-strip">
      <div class="meta-cell">
        <div class="meta-label">${labels.pdf.carrier}</div>
        <div class="meta-value">${carrier}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">${labels.pdf.returnDate}</div>
        <div class="meta-value mono">${now}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">${labels.pdf.employee}</div>
        <div class="meta-value">${employee}</div>
      </div>
      <div class="meta-cell highlight">
        <div class="meta-label">${labels.pdf.totalOrders}</div>
        <div class="meta-value">${orders.length} ${labels.pdf.orderUnit}</div>
      </div>
    </div>
  </div>

  <div class="orders-wrap">
    <div class="section-label">
      <span class="section-label-text">${labels.pdf.ordersDetail}</span>
      <div class="section-label-line"></div>
    </div>
    ${ordersHTML}
  </div>

  <div class="sig-wrap">
    <div class="sig-head">
      <div class="sig-head-dot"></div>
      <span class="sig-head-text">${labels.pdf.receiptConfirmation}</span>
    </div>
    <div class="sig-fields">
      <div class="sig-field">
        <div class="sig-field-label">${labels.pdf.courierName}</div>
        <div class="sig-line"></div>
      </div>
      <div class="sig-field">
        <div class="sig-field-label">${labels.pdf.signature}</div>
        <div class="sig-line"></div>
      </div>
      <div class="sig-field">
        <div class="sig-field-label">${labels.pdf.dateTime}</div>
        <div class="sig-line"></div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <div class="footer-left">
      <div class="footer-mark">
        <svg viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3"/></svg>
      </div>
      <span class="footer-text">${labels.pdf.title}</span>
      <div class="footer-divider"></div>
      <span class="footer-text">${labels.pdf.system}</span>
    </div>
    <span class="footer-text">${now}</span>
  </div>

</body>
</html>`;
}

function buildWrongScanLogPDF(logs, carrier, employee, now, labels) {
  const rows = logs
    .map(
      (l, i) => `
    <tr>
      <td class="idx-cell">${i + 1}</td>
      <td class="code-cell">${l.code}</td>
      <td><span class="badge-error">${l.reason}</span></td>
      <td class="time-cell"><span>${l.time}</span></td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${labels.wrongPdf.title}</title>
  ${WRONG_SCAN_PDF_STYLE}
</head>
<body>

  <div class="header-band">
    <div class="header-top">
      <div class="header-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="doc-title">${labels.wrongPdf.title}</div>
          <div class="doc-subtitle">WRONG SCAN LOG · ${carrier}</div>
        </div>
      </div>
      <div class="header-ref">
        <div class="ref-badge">ERR · ${now.replace(/\D/g, "").slice(0, 8)}</div>
        <div class="ref-date">${now}</div>
        <div class="ref-employee">${employee}</div>
      </div>
    </div>

    <div class="meta-strip">
      <div class="meta-cell">
        <div class="meta-label">${labels.wrongPdf.carrier}</div>
        <div class="meta-value">${carrier}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">${labels.wrongPdf.employee}</div>
        <div class="meta-value">${employee}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">${labels.wrongPdf.date}</div>
        <div class="meta-value mono">${now}</div>
      </div>
      <div class="meta-cell highlight">
        <div class="meta-label">${labels.wrongPdf.totalFailedAttempts}</div>
        <div class="meta-value err">${logs.length} ${labels.wrongPdf.attemptUnit}</div>
      </div>
    </div>
  </div>

  <div class="print-alert">
    <div class="print-alert-inner">
      <div class="print-alert-icon">!</div>
      <div class="print-alert-text">
        ${labels.wrongPdf.printAlertText}
      </div>
    </div>
  </div>

  <div class="table-wrap">
    <div class="section-label">
      <span class="section-label-text">${labels.wrongPdf.totalAttempts}: ${logs.length}</span>
      <div class="section-label-line"></div>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th class="center">#</th>
            <th>${labels.wrongPdf.scannedCode}</th>
            <th>${labels.wrongPdf.failReason}</th>
            <th>${labels.wrongPdf.time}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>

  <div class="doc-footer">
    <div class="footer-left">
      <div class="footer-mark">
        <svg viewBox="0 0 10 10">
          <line x1="3" y1="3" x2="7" y2="7"/>
          <line x1="7" y1="3" x2="3" y2="7"/>
        </svg>
      </div>
      <span class="footer-text">${labels.wrongPdf.title}</span>
      <div class="footer-divider"></div>
      <span class="footer-text">${labels.wrongPdf.system}</span>
    </div>
    <span class="footer-text">${now}</span>
  </div>

</body>
</html>`;
}

function openPrintWindow(html) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ─────────────────────────────────────────────────────────────
// RETURN DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function ReturnOrderDetailModal({ open, onClose, order, t }) {
  if (!order) return null;

  const infoRows = [
    { label: t("detail.customer"), value: order.customer, icon: User, color: DS.primary },
    { label: t("detail.phone"), value: order.phone, icon: Hash, color: DS.accent },
    { label: t("detail.city"), value: order.city, icon: MapPin, color: DS.primary },
    { label: t("detail.area"), value: order.area || "—", icon: MapPin, color: DS.warning },
    { label: t("detail.carrier"), value: order.carrier || t("common.unspecified"), icon: Truck, color: "#ff5c2b" },
    { label: t("detail.trackingCode"), value: order.trackingCode || "—", icon: Hash, color: DS.accent },
    { label: t("detail.total"), value: `${order.total || 0} ${t("common.currency")}`, icon: CreditCard, color: DS.success },
    { label: t("detail.returnCondition"), value: order.returnCondition || "—", icon: RefreshCw, color: DS.warning },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" >
 			
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-xl">
        <div className="relative px-6 pt-6 pb-5 rounded-t-xl overflow-hidden" style={{ background: DS.headerGradient }}>
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

					
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-sm", DS.radiusSm)}>
                <RefreshCw className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{t("detail.orderLabel")}</p>
                <h2 className="text-white text-xl font-black font-mono">{order.code}</h2>
              </div>
            </div>
            <HeaderIconBtn onClick={onClose}>
              <X size={15} className="text-white" />
            </HeaderIconBtn>
          </div>
          <div className="relative mt-3 flex items-center gap-2 flex-wrap">
            {order.carrier && (
              <HeaderBadge>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {order.carrier}
              </HeaderBadge>
            )}
            {order.returnedAt && (
              <HeaderBadge>
                <CheckCircle2 size={11} />
                {t("detail.returnedAt")}: {order.returnedAt}
              </HeaderBadge>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {infoRows.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className={cn(
                  "flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 transition-colors",
                  DS.radius
                )}
              >
                <div
                  className={cn("w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5", DS.radiusSm)}
                  style={{ backgroundColor: color + "18" }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wide">{label}</p>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={cn("border border-slate-100 dark:border-slate-700 overflow-hidden", DS.radius)}>
            <div className="px-4 py-2.5 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700">
              <Package size={13} style={{ color: DS.accent }} />
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">{t("detail.products")}</span>
              <span className="ms-auto text-[11px] font-semibold text-slate-400">
                {(order.products || []).length} {t("detail.items")}
              </span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
              {(order.products || []).map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className={cn("w-6 h-6 flex items-center justify-center text-[10px] font-black flex-shrink-0", DS.radiusSm)}
                    style={{ backgroundColor: DS.primary + "18", color: DS.primary }}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={cn("font-mono text-[11px] px-2 py-0.5 font-bold", DS.radiusSm)}
                    style={{ backgroundColor: DS.accent + "12", color: DS.accent }}
                  >
                    {p.sku}
                  </span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">{p.name}</span>
                  <span className="text-xs text-slate-400 font-mono">×{p.requestedQty}</span>
                  <span className="font-bold text-sm" style={{ color: DS.primary }}>
                    {(Number(p.price) || 0) * (Number(p.requestedQty) || 0)} {t("common.currency")}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={onClose} className={DS.radiusSm}>
              {t("detail.close")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCAN INPUT BAR
// ─────────────────────────────────────────────────────────────
function ScanInputBar({ inputRef, value, onChange, onScan, disabled, isSuccess, isError, placeholder }) {
  const t = useTranslations("warehouse.returns");
  const [isFocused, setIsFocused] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const prevIsError = useRef(isError);

  useEffect(() => {
    if (isError && !prevIsError.current) {
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 500);
    }
    prevIsError.current = isError;
  }, [isError]);

  const handleScan = useCallback(() => {
    if (disabled || !value?.trim()) return;
    onScan();
  }, [disabled, value, onScan]);

  const isActive = isFocused || !!value;
  const hasContent = !!value?.trim();

  const cornerClass = cn(
    "rounded-full transition-colors duration-200",
    isSuccess
      ? "bg-emerald-500"
      : isError
      ? "bg-red-500"
      : isActive
      ? "bg-primary"
      : "bg-slate-300 dark:bg-slate-600"
  );

  return (
    <motion.div animate={errorFlash ? { x: [0, -5, 6, -4, 2, 0] } : { x: 0 }} transition={{ duration: 0.35 }} className="relative">
      {[
        "absolute -top-[3px] -left-[3px]",
        "absolute -top-[3px] -right-[3px]",
        "absolute -bottom-[3px] -left-[3px]",
        "absolute -bottom-[3px] -right-[3px]",
      ].map((pos, idx) => (
        <motion.div
          key={idx}
          animate={{ opacity: isActive ? 1 : 0.25, scale: isActive ? 1 : 0.9 }}
          transition={{ duration: 0.2 }}
          className={cn(pos, "w-3 h-3 pointer-events-none z-20")}
        >
          <div className={cn("absolute w-full h-[2px]", cornerClass, idx < 2 ? "top-0" : "bottom-0")} />
          <div className={cn("absolute h-full w-[2px]", cornerClass, idx % 2 === 0 ? "left-0" : "right-0")} />
        </motion.div>
      ))}

      <div
        className={cn(
          "relative flex items-center border transition-all duration-200 overflow-hidden",
          DS.radius,
          disabled && "opacity-50 pointer-events-none",
          isSuccess && "border-emerald-500 bg-background shadow-[0_0_0_3px_rgba(16,185,129,0.10)]",
          isError && "border-red-500 bg-background shadow-[0_0_0_3px_rgba(239,68,68,0.10)]",
          !isSuccess && !isError && !isFocused && "border-border bg-background/60",
          !isSuccess && !isError && isFocused && "border-primary/60 bg-background shadow-[0_0_0_3px_rgba(255,139,0,0.08)]"
        )}
        style={{ height: 46 }}
      >
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              key="sweep"
              initial={{ x: "-100%", opacity: 0.7 }}
              animate={{ x: "100%", opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 pointer-events-none z-0"
              style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.16), transparent)" }}
            />
          )}
          {errorFlash && (
            <motion.div
              key="errflash"
              initial={{ opacity: 0.15 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={cn("absolute inset-0 bg-red-400 pointer-events-none z-0", DS.radius)}
            />
          )}
          {hasContent && !isSuccess && !isError && (
            <motion.div
              key="beam"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg"
            >
              <motion.div
                animate={{ left: ["-4%", "104%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 0.4 }}
                className="absolute inset-y-0 w-[2px]"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(255,139,0,0.0) 15%, rgba(255,139,0,0.5) 45%, rgba(255,187,0,0.65) 50%, rgba(255,139,0,0.5) 55%, transparent 85%)",
                  filter: "blur(0.8px)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="ps-3 flex-shrink-0 z-10">
          <ScanLine
            size={15}
            className={cn(
              "transition-colors duration-200",
              isSuccess
                ? "text-emerald-500"
                : isError
                ? "text-red-500"
                : isFocused
                ? "text-primary"
                : "text-muted-foreground/30"
            )}
          />
        </div>

        <div className="relative flex-shrink-0 mx-2.5 z-10">
          <div className="w-px h-4 bg-border/40" />
          <motion.div
            animate={
              isSuccess
                ? { backgroundColor: DS.success, scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                : isError
                ? { backgroundColor: DS.danger, scale: [1, 1.3, 1] }
                : isFocused
                ? { backgroundColor: DS.primary, opacity: [1, 0.4, 1] }
                : { backgroundColor: "#94a3b8" }
            }
            transition={isSuccess || isFocused ? { duration: 1.5, repeat: Infinity } : { duration: 0.3 }}
            className="absolute -top-[8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
          />
        </div>

        <input
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleScan();
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus
          disabled={disabled}
          dir="rtl"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="relative z-10 flex-1 h-full bg-transparent border-none !outline-none focus:ring-0 text-sm font-semibold text-foreground placeholder:text-muted-foreground/35 px-1"
        />

        <AnimatePresence>
          {value && (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={() => {
                onChange({ target: { value: "" } });
                inputRef?.current?.focus();
              }}
              className="relative z-10 flex-shrink-0 mx-1.5 w-[18px] h-[18px] rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <X size={9} className="text-slate-500" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="pe-2 flex-shrink-0 z-10">
          <motion.button
            type="button"
            onClick={handleScan}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            className={cn(
              "relative h-8 px-3.5 text-white text-xs font-black flex items-center gap-1.5 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200",
              DS.radius
            )}
            style={{
              background: isSuccess ? DS.successGradient : isError ? DS.dangerGradient : DS.headerGradient,
              boxShadow: `0 2px 10px -2px ${
                isSuccess
                  ? "rgba(16,185,129,0.45)"
                  : isError
                  ? "rgba(239,68,68,0.45)"
                  : "rgba(255,139,0,0.35)"
              }`,
            }}
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg pointer-events-none"
            />
            <motion.span
              key={isSuccess ? "check" : isError ? "x" : "scan"}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex"
            >
              {isSuccess ? (
                <CheckCircle2 size={11} strokeWidth={2.5} />
              ) : isError ? (
                <X size={11} strokeWidth={2.5} />
              ) : (
                <ScanLine size={11} strokeWidth={2.5} />
              )}
            </motion.span>
            <motion.span
              key={isSuccess ? "done" : isError ? "err" : "lbl"}
              initial={{ opacity: 0, x: 3 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[11px]"
            >
              {isSuccess ? t("scan.status.done") : isError ? t("scan.status.retry") : t("scan.status.scanBtn")}
            </motion.span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCAN LOG BOXES
// ─────────────────────────────────────────────────────────────
function ScanLogBoxes({ successCount, errorCount, t }) {
  const total = successCount + errorCount;
  const successPct = total > 0 ? (successCount / total) * 100 : 0;

  const prevErrorRef = useRef(errorCount);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (errorCount > prevErrorRef.current) {
      setShaking(true);
      setTimeout(() => setShaking(false), 550);
    }
    prevErrorRef.current = errorCount;
  }, [errorCount]);

  const cardBase = cn("relative overflow-hidden border p-4 transition-all duration-300", DS.radiusXl);

  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className={cn(cardBase, "border-emerald-200/70 dark:border-emerald-700/35")}
        style={{ background: DS.successCardGradient, ...DS.scanline }}
      >
        <motion.div
          key={`s${successCount}`}
          initial={{ x: "-110%" }}
          animate={{ x: "110%" }}
          transition={{ duration: 0.85, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/3 pointer-events-none z-[1]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
        />
        <div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full bg-emerald-300/15 dark:bg-emerald-500/10" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative w-[52px] h-[52px] flex-shrink-0">
            <ArcRing pct={successPct} color="#16a34a" trackColor="rgba(134,239,172,0.3)" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0" dir="rtl">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-emerald-600/60 mb-1 leading-none">
              {t("scan.counters.scannedReturns")}
            </p>
            <AnimatePresence mode="wait">
              <motion.span
                key={successCount}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: "spring", stiffness: 480, damping: 26 }}
                className="block text-[2.4rem] font-black tabular-nums leading-none text-emerald-700 dark:text-emerald-400"
              >
                {successCount}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={shaking ? { opacity: 1, x: [0, -5, 6, -4, 2, 0], y: 0 } : { opacity: 1, x: 0, y: 0 }}
        transition={shaking ? { duration: 0.4 } : { delay: 0.08 }}
        className={cn(
          cardBase,
          errorCount > 0 ? "border-red-200/70 dark:border-red-700/35" : "border-slate-200/60 dark:border-slate-700/35"
        )}
        style={{
          background: errorCount > 0 ? "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)" : DS.cardGradient,
          ...DS.scanline,
        }}
      >
        <AnimatePresence>
          {shaking && (
            <motion.div
              initial={{ opacity: 0.16 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={cn("absolute inset-0 bg-red-400 pointer-events-none z-20", DS.radiusXl)}
            />
          )}
        </AnimatePresence>

        <div
          className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full transition-colors duration-300"
          style={{ background: errorCount > 0 ? "rgba(252,165,165,0.18)" : "rgba(226,232,240,0.18)" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative w-[52px] h-[52px] flex-shrink-0">
            <AnimatePresence>
              {errorCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.35, 0, 0.35], scale: [1, 1.25, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-red-400/45"
                />
              )}
            </AnimatePresence>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle size={16} className={errorCount > 0 ? "text-red-600" : "text-slate-300"} />
            </div>
          </div>
          <div className="flex-1 min-w-0" dir="rtl">
            <p
              className={cn(
                "text-[10px] font-extrabold uppercase tracking-[0.1em] mb-1 leading-none transition-colors duration-300",
                errorCount > 0 ? "text-red-600/60" : "text-slate-400/65"
              )}
            >
              {t("scan.counters.failedScans")}
            </p>
            <AnimatePresence mode="wait">
              <motion.span
                key={errorCount}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: "spring", stiffness: 480, damping: 26 }}
                className={cn(
                  "block text-[2.4rem] font-black tabular-nums leading-none transition-colors duration-300",
                  errorCount > 0 ? "text-red-700 dark:text-red-400" : "text-slate-300 dark:text-slate-600"
                )}
              >
                {errorCount}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RETURNS SCANNED ORDER TABLE
// ─────────────────────────────────────────────────────────────
function ReturnScannedOrderTable({
  order,
  selectedItems,
  onToggleItem,
  onSelectAll,
  onUnselectAll,
  returnCondition,
  onConditionChange,
  t,
}) {
  const products = order?.products || [];
  const totalQty = products.reduce((s, p) => s + (p.requestedQty || 0), 0);
  const selectedQty = products.reduce((s, p) => (selectedItems[p.sku] ? s + (p.requestedQty || 0) : s), 0);
  const pct = totalQty === 0 ? 0 : Math.round((selectedQty / totalQty) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("border overflow-hidden transition-all duration-500", DS.radiusXl, "border-slate-200 dark:border-slate-700", DS.shadow)}
    >
      <div
        className="relative overflow-hidden px-4 py-3 border-b border-slate-100 dark:border-slate-700/60"
        style={{ background: DS.cardGradient, ...DS.scanline }}
      >
        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="relative w-11 h-11 flex-shrink-0">
            <ArcRing pct={pct} color={DS.primary} trackColor={"rgba(203,213,225,0.5)"} />
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={pct}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="text-[9px] font-black tabular-nums"
                  style={{ color: DS.primary }}
                >
                  {pct}%
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("scan.table.orderNumber")}</p>
            <p className="font-mono font-black text-sm" style={{ color: DS.primary }}>
              {order.code}
            </p>
          </div>

          <div className="hidden sm:block min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("scan.table.trackingCode")}</p>
            <p className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{order.trackingCode || "—"}</p>
          </div>

          <div className="hidden md:block min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("scan.table.customer")}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{order.customer}</p>
          </div>

          {order.carrier && <CarrierPill carrier={order.carrier} />}

          <div className="ms-auto flex-shrink-0">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 border text-xs font-black tabular-nums transition-colors duration-300",
                DS.radius,
                "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              )}
            >
              <RefreshCw size={11} style={{ color: DS.primary }} />
              {selectedQty}
              <span className="text-slate-300 dark:text-slate-600 font-normal">/</span>
              {totalQty}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2 justify-between bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className={cn("px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700", DS.radiusSm)}
          >
            {t("scan.actions.selectAll")}
          </button>
          <button
            type="button"
            onClick={onUnselectAll}
            className={cn("px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700", DS.radiusSm)}
          >
            {t("scan.actions.unselectAll")}
          </button>
        </div>

        <div className="flex items-center gap-2 min-w-[220px]">
          <span className="text-xs font-bold text-slate-500">{t("scan.actions.condition")}</span>
          <Select value={returnCondition} onValueChange={onConditionChange}>
            <SelectTrigger className={cn("h-9 border-border bg-background text-sm", DS.radiusSm)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/30">
              {[
                "",
                "#",
                t("scan.table.productName"),
                "SKU",
                t("scan.table.qty"),
                t("scan.table.price"),
                t("scan.table.return"),
              ].map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    "py-2 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.07em]",
                    i === 0 ? "w-10 text-center" : i === 1 ? "w-8 text-right" : i >= 4 ? "text-center" : "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const checked = !!selectedItems[p.sku];
              return (
                <motion.tr
                  key={p.sku}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ opacity: { delay: i * 0.04 }, x: { delay: i * 0.04 } }}
                  className={cn(
                    "border-b border-slate-50 dark:border-slate-700/20 transition-colors duration-200",
                    checked ? "bg-primary/5" : ""
                  )}
                >
                  <td className="px-4 py-3 text-center">
                    <Checkbox checked={checked} onCheckedChange={() => onToggleItem(p.sku)} />
                  </td>

                  <td className="px-4 py-3">
                    <div
                      className={cn("w-6 h-6 flex items-center justify-center text-[10px] font-black", DS.radiusSm)}
                      style={{ backgroundColor: checked ? DS.primary + "18" : "rgba(148,163,184,0.12)", color: checked ? DS.primary : "#94a3b8" }}
                    >
                      {i + 1}
                    </div>
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 flex items-center justify-center border overflow-hidden transition-all duration-300",
                          DS.radius,
                          checked
                            ? "border-primary/40 bg-primary/5"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        )}
                      >
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={14} className={checked ? "text-primary" : "text-slate-300"} />
                        )}
                      </div>
                      <span
                        className={cn(
                          "font-semibold text-sm truncate max-w-[220px] transition-colors duration-300",
                          checked ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {p.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={cn("inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 font-bold", DS.radiusSm)}
                      style={{ backgroundColor: DS.accent + "14", color: DS.accent }}
                    >
                      {p.sku}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{p.requestedQty}</span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                      {p.price || 0} {t("common.currency")}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {checked ? (
                      <span
                        className={cn("inline-flex items-center gap-1.5 text-[11px] font-black border px-2.5 py-1", DS.radius)}
                        style={{ backgroundColor: DS.primary + "15", color: DS.primary, borderColor: DS.primary + "30" }}
                      >
                        <CheckCircle2 size={10} strokeWidth={2.5} />
                        {t("scan.table.selected")}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1",
                          DS.radius
                        )}
                      >
                        {t("scan.table.notSelected")}
                      </span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCAN RETURN SUBTAB
// ─────────────────────────────────────────────────────────────
function ScanReturnSubtab({ orders, updateOrder, pushOp, inventory, updateInventory, addReturnFile }) {
  const t = useTranslations("warehouse.returns");
  const shippedOrders = useMemo(() => orders.filter((o) => o.status === STATUS.SHIPPED), [orders]);

  const [scanInput, setScanInput] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnCondition, setReturnCondition] = useState("سليم");
  const [wrongScans, setWrongScans] = useState(0);
  const [wrongScanLogs, setWrongScanLogs] = useState([]);
  const [lastScanMsg, setLastScanMsg] = useState(null);
  const [scanState, setScanState] = useState("idle");
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const scanRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => scanRef.current?.focus(), 120);
    return () => clearTimeout(id);
  }, []);

  const showFeedback = useCallback((type, msg) => {
    setLastScanMsg({ success: type === "success", message: msg });
    setScanState(type);
    setTimeout(() => {
      setLastScanMsg(null);
      setScanState("idle");
    }, 2200);
  }, []);

  const resetCurrentOrder = useCallback(() => {
    setCurrentOrder(null);
    setSelectedItems({});
    setReturnCondition("سليم");
    setScanInput("");
    setTimeout(() => scanRef.current?.focus(), 100);
  }, []);

  const handleScan = useCallback(() => {
    const code = scanInput.trim();
    if (!code) return;

    setScanInput("");
    const now = new Date().toLocaleTimeString("ar-SA");

    const order = shippedOrders.find((o) => o.code === code || o.trackingCode === code);

    if (!order) {
      if (soundEnabled) playBeep("error");
      setWrongScans((p) => p + 1);
      setErrorCount((p) => p + 1);
      setWrongScanLogs((prev) => [
        ...prev,
        { code, reason: t("scan.messages.notFoundReason"), time: now },
      ]);
      showFeedback("error", t("scan.messages.notFound", { code }));
      return;
    }

    if (order.returnedAt) {
      if (soundEnabled) playBeep("error");
      setWrongScans((p) => p + 1);
      setErrorCount((p) => p + 1);
      setWrongScanLogs((prev) => [
        ...prev,
        { code, reason: t("scan.messages.alreadyReturnedReason"), time: now },
      ]);
      showFeedback("error", t("scan.messages.alreadyReturned", { code: order.code }));
      return;
    }

    const initialSelected = {};
    (order.products || []).forEach((p) => {
      initialSelected[p.sku] = true;
    });

    setCurrentOrder(order);
    setSelectedItems(initialSelected);
    setReturnCondition("سليم");
    setSuccessCount((p) => p + 1);

    if (soundEnabled) playBeep("success");
    showFeedback("success", t("scan.messages.found", { code: order.code }));
  }, [scanInput, shippedOrders, soundEnabled, t, showFeedback]);

  const handleToggleItem = (sku) => {
    setSelectedItems((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }));
  };

  const handleSelectAll = () => {
    if (!currentOrder) return;
    const map = {};
    currentOrder.products.forEach((p) => {
      map[p.sku] = true;
    });
    setSelectedItems(map);
  };

  const handleUnselectAll = () => {
    if (!currentOrder) return;
    const map = {};
    currentOrder.products.forEach((p) => {
      map[p.sku] = false;
    });
    setSelectedItems(map);
  };

  const handleProcessReturn = async () => {
    if (!currentOrder || isProcessing) return;

    const returnedProducts = currentOrder.products.filter((p) => selectedItems[p.sku]);

    if (returnedProducts.length === 0) {
      if (soundEnabled) playBeep("error");
      showFeedback("error", t("scan.messages.selectAtLeastOne"));
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const nextStatus = STATUS.RETURNED || STATUS.CONFIRMED;

      updateOrder(currentOrder.code, {
        status: nextStatus,
        returnedAt: now,
        returnCondition,
        returnedItems: returnedProducts.map((p) => p.sku),
        products: currentOrder.products.map((p) =>
          selectedItems[p.sku]
            ? {
                ...p,
                returnCondition,
              }
            : p
        ),
      });

      if (inventory && updateInventory) {
        updateInventory(returnInventoryFromCarrier(returnedProducts, inventory));
      }

      pushOp({
        id: `OP-${Date.now()}`,
        operationType: "RETURN_ORDER",
        orderCode: currentOrder.code,
        carrier: currentOrder.carrier || "-",
        employee: "System",
        result: "SUCCESS",
        details: t("scan.messages.returnProcessedLog", { count: returnedProducts.length }),
        createdAt: now,
      });

      addReturnFile({
        id: `RET-${Date.now()}`,
        carrier: currentOrder.carrier || "—",
        type: "return",
        orderCodes: [currentOrder.code],
        createdAt: now,
        createdBy: "System",
        filename: `return_${currentOrder.code}_${now.split(" ")[0]}.pdf`,
        ordersSnapshot: [
          {
            ...currentOrder,
            returnCondition,
            returnedItems: returnedProducts.map((p) => p.sku),
            products: returnedProducts,
          },
        ],
        wrongScanLogs,
      });

      if (soundEnabled) playBeep("success");
      showFeedback("success", t("scan.messages.returnSuccess", { code: currentOrder.code }));
      setWrongScans(0);
      setWrongScanLogs([]);
      resetCurrentOrder();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Panel>
        <PanelHeader
          icon={RefreshCw}
          pretitle={!currentOrder ? t("scan.header.subtitleReady") : `${t("scan.header.orderLabel")}: ${currentOrder?.code}`}
          title={!currentOrder ? t("scan.header.title") : t("scan.header.titleActive")}
          right={
            <>
              <HeaderIconBtn onClick={() => setSoundEnabled((v) => !v)}>
                {soundEnabled ? <Volume2 size={13} className="text-white" /> : <VolumeX size={13} className="text-white/60" />}
              </HeaderIconBtn>
              {currentOrder && (
                <HeaderBadge onClick={resetCurrentOrder}>
                  <X size={12} />
                  {t("scan.actions.cancel")}
                </HeaderBadge>
              )}
            </>
          }
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="h-px flex-1 max-w-[20px] rounded-full bg-white/30" />
            <div className={cn("w-2 h-2 rounded-full transition-all duration-500", currentOrder ? "bg-white" : "bg-white/30")} />
          </div>
        </PanelHeader>

        <div className="px-4 pt-8 py-5 space-y-4">
          <ScanInputBar
            inputRef={scanRef}
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onScan={handleScan}
            isSuccess={scanState === "success"}
            isError={scanState === "error"}
            disabled={isProcessing}
            placeholder={!currentOrder ? t("scan.placeholders.scanOrder") : t("scan.placeholders.scanAnother")}
          />

          <AnimatePresence>
            {lastScanMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 border text-sm font-semibold",
                  DS.radius,
                  lastScanMsg.success
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300"
                )}
              >
                {lastScanMsg.success ? <CheckCircle2 size={14} className="flex-shrink-0" /> : <AlertCircle size={14} className="flex-shrink-0" />}
                {lastScanMsg.message}
              </motion.div>
            )}
          </AnimatePresence>

          <ScanLogBoxes successCount={successCount} errorCount={errorCount} t={t} />

          {currentOrder ? (
            <>
              <ReturnScannedOrderTable
                order={currentOrder}
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onSelectAll={handleSelectAll}
                onUnselectAll={handleUnselectAll}
                returnCondition={returnCondition}
                onConditionChange={setReturnCondition}
                t={t}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetCurrentOrder}
                  className={cn(
                    "px-4 h-11 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                    DS.radius
                  )}
                >
                  {t("scan.actions.cancel")}
                </button>

                <motion.button
                  type="button"
                  onClick={handleProcessReturn}
                  disabled={isProcessing}
                  whileHover={!isProcessing ? { scale: 1.02 } : {}}
                  whileTap={!isProcessing ? { scale: 0.98 } : {}}
                  className={cn(
                    "flex items-center gap-2 px-5 h-11 font-bold text-sm text-white transition-opacity disabled:opacity-60",
                    DS.radius
                  )}
                  style={{ background: DS.headerGradient }}
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {t("scan.actions.confirmReturn")}
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className={cn("w-14 h-14 flex items-center justify-center mb-4", DS.radius)}
                style={{ background: DS.primary + "12", border: `1px dashed ${DS.primary}35` }}
              >
                <RefreshCw size={26} style={{ color: DS.primary }} />
              </motion.div>
              <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">{t("scan.empty.title")}</p>
              <p className="text-sm text-slate-400">{t("scan.empty.subtitle")}</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RETURN FILES SUBTAB
// ─────────────────────────────────────────────────────────────
function ReturnFilesSubtab({ returnFiles, orders, resetToken }) {
  const t = useTranslations("warehouse.returns");
  const [search, setSearch] = useState("");
  const [filterCarrier, setFilterCarrier] = useState("all");
  const [downloading, setDownloading] = useState({});
  const [downloadingWrongLog, setDownloadingWrongLog] = useState({});
  const [detailModal, setDetailModal] = useState(null);
  const [page, setPage] = useState({ current_page: 1, per_page: 12 });

  React.useEffect(() => {
    setSearch("");
    setFilterCarrier("all");
    setPage({ current_page: 1, per_page: 12 });
    setDetailModal(null);
  }, [resetToken]);

  const filtered = useMemo(() => {
    let base = returnFiles;
    const q = search.trim().toLowerCase();
    if (q) base = base.filter((f) => [f.id, f.carrier, f.filename, ...(f.orderCodes || [])].some((x) => String(x || "").toLowerCase().includes(q)));
    if (filterCarrier !== "all") base = base.filter((f) => f.carrier === filterCarrier);
    return base;
  }, [returnFiles, search, filterCarrier]);

  const handleDownload = async (file) => {
    setDownloading((p) => ({ ...p, [file.id]: true }));
    try {
      await new Promise((r) => setTimeout(r, 500));
      const snap =
        file.ordersSnapshot ||
        orders.filter((o) => file.orderCodes.includes(o.code)).map((o) => ({
          ...o,
          returnCondition: "سليم",
        }));

      openPrintWindow(
        buildReturnPDF(snap, file.carrier, file.createdBy, file.createdAt, {
          common: { currency: t("common.currency") },
          pdf: {
            title: t("pdf.title"),
            refPrefix: t("pdf.refPrefix"),
            carrier: t("pdf.carrier"),
            returnDate: t("pdf.returnDate"),
            employee: t("pdf.employee"),
            totalOrders: t("pdf.totalOrders"),
            orderUnit: t("pdf.orderUnit"),
            ordersDetail: t("pdf.ordersDetail"),
            sku: t("pdf.sku"),
            product: t("pdf.product"),
            qty: t("pdf.qty"),
            trackingCode: t("pdf.trackingCode"),
            condition: t("pdf.condition"),
            total: t("pdf.total"),
            receiptConfirmation: t("pdf.receiptConfirmation"),
            courierName: t("pdf.courierName"),
            signature: t("pdf.signature"),
            dateTime: t("pdf.dateTime"),
            system: t("pdf.system"),
          },
        })
      );
    } finally {
      setDownloading((p) => ({ ...p, [file.id]: false }));
    }
  };

  const handleDownloadWrongLog = async (file) => {
    setDownloadingWrongLog((p) => ({ ...p, [file.id]: true }));
    try {
      await new Promise((r) => setTimeout(r, 400));
      const logs = file.wrongScanLogs || [];
      openPrintWindow(
        buildWrongScanLogPDF(logs, file.carrier, file.createdBy, file.createdAt, {
          wrongPdf: {
            title: t("wrongPdf.title"),
            carrier: t("wrongPdf.carrier"),
            employee: t("wrongPdf.employee"),
            date: t("wrongPdf.date"),
            totalFailedAttempts: t("wrongPdf.totalFailedAttempts"),
            attemptUnit: t("wrongPdf.attemptUnit"),
            printAlertText: t("wrongPdf.printAlertText"),
            totalAttempts: t("wrongPdf.totalAttempts"),
            scannedCode: t("wrongPdf.scannedCode"),
            failReason: t("wrongPdf.failReason"),
            time: t("wrongPdf.time"),
            system: t("wrongPdf.system"),
          },
        })
      );
    } finally {
      setDownloadingWrongLog((p) => ({ ...p, [file.id]: false }));
    }
  };

  const getFileOrder = (file) => {
    const snap = file.ordersSnapshot?.[0];
    if (snap) return snap;
    return orders.find((o) => file.orderCodes?.includes(o.code)) || null;
  };

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: t("files.th.fileNumber"),
        cell: (row) => <span className="font-mono font-bold text-primary">{row.id}</span>,
      },
      {
        key: "carrier",
        header: t("files.th.carrier"),
        cell: (row) =>
          row.carrier ? (
            <CarrierPill carrier={row.carrier} />
          ) : (
            <span className="text-slate-400 text-sm italic">{t("common.unspecified")}</span>
          ),
      },
      {
        key: "orderCodes",
        header: t("files.th.returnedOrders"),
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {(row.orderCodes || []).map((code) => (
              <span
                key={code}
                className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded"
              >
                {code}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: "createdAt",
        header: t("files.th.createdAt"),
        cell: (row) => <span className="text-sm text-slate-500">{row.createdAt}</span>,
      },
      {
        key: "createdBy",
        header: t("files.th.createdBy"),
      },
      {
        key: "actions",
        header: t("files.th.actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Info />,
                tooltip: t("files.tooltip.details"),
                onClick: (r) => setDetailModal(getFileOrder(r)),
                variant: "purple",
              },
              {
                icon: downloading[row.id] ? <Loader2 className="animate-spin" /> : <FileDown />,
                tooltip: t("files.tooltip.downloadFile"),
                onClick: (r) => handleDownload(r),
                variant: "blue",
              },
              {
                icon: downloadingWrongLog[row.id] ? <Loader2 className="animate-spin" /> : <FileText />,
                tooltip: t("files.tooltip.downloadWrongLog"),
                onClick: (r) => handleDownloadWrongLog(r),
                variant: "red",
              },
            ]}
          />
        ),
      },
    ],
    [t, downloading, downloadingWrongLog, orders]
  );

  return (
    <div className="relative " >
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {}}
        labels={{
          searchPlaceholder: t("files.searchPlaceholder"),
          filter: t("common.filter"),
          apply: t("common.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: t("files.emptyTitle"),
          emptySubtitle: "",
        }}
        actions={[]}
        hasActiveFilters={filterCarrier !== "all"}
        onApplyFilters={() => {}}
        filters={
          <FilterField label={t("common.carrier")}>
            <Select value={filterCarrier} onValueChange={setFilterCarrier}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                <SelectValue placeholder={t("common.allCarriers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allCarriers")}</SelectItem>
                {CARRIERS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        }
        columns={columns}
        data={filtered}
        isLoading={false}
        pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
        onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
      />

      <ReturnOrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} t={t} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN RETURNS TAB
// ─────────────────────────────────────────────────────────────
export default function ReturnsTab({
  orders,
  updateOrder,
  pushOp,
  inventory,
  updateInventory,
  returnFiles,
  addReturnFile,
  subtab,
  setSubtab,
  resetToken,
}) {
  const t = useTranslations("warehouse.returns");
  const shipped = orders.filter((o) => o.status === STATUS.SHIPPED);
  const today = new Date().toISOString().split("T")[0];

  const stats = [
    { id: "with-carrier", name: t("stats.withCarrier"), value: shipped.length, icon: Truck, color: "#3b82f6", sortOrder: 0 },
    { id: "return-files", name: t("stats.returnFiles"), value: returnFiles.length, icon: RefreshCw, color: "#f59e0b", sortOrder: 1 },
    {
      id: "returned-today",
      name: t("stats.returnedToday"),
      value: orders.filter((o) => o.returnedAt?.startsWith(today)).length,
      icon: Calendar,
      color: "#ef4444",
      sortOrder: 2,
    },
    {
      id: "total-returns",
      name: t("stats.totalReturns"),
      value: orders.filter((o) => !!o.returnedAt).length,
      icon: Package,
      color: "#a855f7",
      sortOrder: 3,
    },
  ];

  return (
    <div className="space-y-4 relative z-[1000] ">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.returns") },
        ]}
        buttons={<Button_ size="sm" label={t("header.howItWorks")} variant="ghost" onClick={() => {}} icon={<Info size={18} />} />}
        stats={subtab === "files" ? stats : []}
        items={[
          { id: "scan", label: t("subtabs.scanReturn"), count: shipped.length, icon: ScanLine },
          { id: "files", label: t("subtabs.files"), count: returnFiles.length, icon: FileDown },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div key={subtab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {subtab === "scan" && (
            <ScanReturnSubtab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              inventory={inventory}
              updateInventory={updateInventory}
              addReturnFile={addReturnFile}
            />
          )}

          {subtab === "files" && <ReturnFilesSubtab returnFiles={returnFiles} orders={orders} resetToken={resetToken} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}