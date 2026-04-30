"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FileDown,
  FileText,
  RotateCcw,
  Package,
  CheckCircle2,
  ChevronDown,
  Save,
  Loader2,
  Info,
  ScanLine,
  X,
  AlertCircle,
  Volume2,
  VolumeX,
  Hash,
  Boxes,
  ClipboardList,
  Layers,
  ArchiveRestore,
  Truck,
  DownloadCloud,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "../../../../components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { STATUS, CARRIERS, returnInventoryFromCarrier, CARRIER_STYLES, CARRIER_META } from "./data";
import ActionButtons from "@/components/atoms/Actions";
import { toast } from "react-hot-toast";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import { useDebounce } from "@/hook/useDebounce";
import api from "@/utils/api";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
const RETURN_CONDITIONS_KEYS = [
  "intact",
  "opened",
  "used",
  "damaged",
  "defective",
  "missingParts",
  "other"
];

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const DS = {
  radius: "rounded-lg",
  radiusSm: "rounded-md",
  radiusXl: "rounded-xl",

  primary: "var(--primary)",
  primaryLight: "rgba(255,139,0,0.10)",
  primaryBorder: "rgba(255,139,0,0.25)",
  accent: "#6763af",
  success: "#10b981",
  successLight: "rgba(16,185,129,0.10)",
  danger: "#ef4444",
  dangerLight: "rgba(239,68,68,0.10)",
  warning: "var(--third)",

  headerGradient: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
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
// HELPERS
// ─────────────────────────────────────────────────────────────

function getCarrierMeta(c = "") {
  return (
    CARRIER_META[c.toUpperCase().replace(/\s/g, "")] || {
      color: "var(--primary)",
      light: "#fff8f0",
    }
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
  } catch (_) { }
}

function ArcRing({
  pct,
  size = 44,
  stroke = 3.5,
  color,
  trackColor,
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 w-full h-full -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />
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

function CarrierPill({ carrier }) {
  const cKey = carrier?.toUpperCase() || "NONE";
  const s = CARRIER_STYLES[cKey] || CARRIER_STYLES.NONE;
  const t = useTranslations("warehouse.outgoing");

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
      {<Truck size={11} />}
      {cKey === "NONE" ? "None" : carrier}
    </span>
  );
}

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

function PanelHeader({
  icon: Icon,
  pretitle,
  title,
  right,
  children,
}) {
  return (
    <div
      className="relative px-5 py-4 overflow-hidden"
      style={{ background: DS.headerGradient }}
    >
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
            <h3 className="text-white font-black text-sm tracking-tight truncate">
              {title}
            </h3>
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

function formatTimeForLogs(locale = "en") {
  return new Date().toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}



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

  /* ── HEADER ── */
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

  /* ── META STRIP ── */
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

  /* ── SECTION LABEL ── */
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

  /* ── ORDER CARD ── */
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

  /* ── TABLE ── */
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

  /* ── SIGNATURE ── */
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

  /* ── FOOTER ── */
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


function buildReturnPDF(orders, carrier, employee, now, labels) {
  const ordersHTML = orders
    .map((o, idx) => {
      // Use lastReturn items if available, otherwise fallback to products
      const returnItems = o.lastReturn?.items || [];
      const rows = returnItems
        .map(
          (p) => `
      <tr>
        <td class="sku-cell">${p.sku || p.returnedVariant?.sku || "—"}</td>
        <td>${p.name || p.returnedVariant?.product?.name || "—"}</td>
        <td class="qty-cell">${p.quantity || p.returnedQty || 1}</td>
        <td class="track-cell"><span>${o.trackingNumber || o.trackingCode || "—"}</span></td>
      </tr>`
        )
        .join("");

      return `
      <div class="order-card">
        <div class="order-head">
          <div class="order-head-left">
            <div class="order-index">${idx + 1}</div>
            <span class="order-code">${o.code || o.orderNumber}</span>
            <div class="order-sep"></div>
            <span class="order-customer">${o.customer || o.customerName || "—"}</span>
          </div>
          <span class="order-city">${o.city || "—"}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>${labels.sku}</th>
              <th>${labels.product}</th>
              <th class="center">${labels.qty}</th>
              <th>${labels.trackingCode}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="padding:10px 16px;border-top:1px solid #eceae4;background:#faf9f7;display:flex;justify-content:space-between;align-items:center;">
          <span class="condition-badge">${labels.condition}: ${o.lastReturn?.reason || labels.conditions?.intact || "Intact"}</span>
        
        </div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${labels.title}</title>
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
          <div class="doc-title">${labels.title}</div>
          <div class="doc-subtitle">RETURN RECEIPT · ${carrier}</div>
        </div>
      </div>
      <div class="header-ref">
        <div class="ref-badge">${labels.refPrefix}-${now.replace(/\D/g, "").slice(0, 8)}</div>
        <div class="ref-date">${now}</div>
        <div class="ref-employee">${employee}</div>
      </div>
    </div>

    <div class="meta-strip">
      <div class="meta-cell">
        <div class="meta-label">${labels.carrier}</div>
        <div class="meta-value">${carrier}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">${labels.returnDate}</div>
        <div class="meta-value mono">${now}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">${labels.employee}</div>
        <div class="meta-value">${employee}</div>
      </div>
      <div class="meta-cell highlight">
        <div class="meta-label">${labels.totalOrders}</div>
        <div class="meta-value">${orders.length} ${labels.orderUnit}</div>
      </div>
    </div>
  </div>

  <div class="orders-wrap">
    <div class="section-label">
      <span class="section-label-text">${labels.ordersDetail}</span>
      <div class="section-label-line"></div>
    </div>
    ${ordersHTML}
  </div>

  <div class="sig-wrap">
    <div class="sig-head">
      <div class="sig-head-dot"></div>
      <span class="sig-head-text">${labels.receiptConfirmation}</span>
    </div>
    <div class="sig-fields">
      <div class="sig-field">
        <div class="sig-field-label">${labels.courierName}</div>
        <div class="sig-line"></div>
      </div>
      <div class="sig-field">
        <div class="sig-field-label">${labels.signature}</div>
        <div class="sig-line"></div>
      </div>
      <div class="sig-field">
        <div class="sig-field-label">${labels.dateTime}</div>
        <div class="sig-line"></div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <div class="footer-left">
      <div class="footer-mark">
        <svg viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3"/></svg>
      </div>
      <span class="footer-text">${labels.title}</span>
      <div class="footer-divider"></div>
      <span class="footer-text">${labels.system}</span>
    </div>
    <span class="footer-text">${now}</span>
  </div>

</body>
</html>`;
}

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


function buildWrongScanLogPDF(logs, carrier, employee, now, labels) {
  const rows = logs.map((l, i) => `
    <tr>
      <td class="idx-cell">${i + 1}</td>
      <td class="code-cell">${l.orderNumber}</td>
      <td class="code-cell">${l.sku}</td>
      <td><span class="badge-error">${labels.reasons?.[l.reason] || l.reason}</span></td>
      <td class="time-cell"><span>${l.time}</span></td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${labels.title}</title>
  ${WRONG_SCAN_PDF_STYLE}
</head>
<body>

  <!-- ── HEADER ── -->
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
          <div class="doc-title">${labels.title}</div>
          <div class="doc-subtitle">WRONG SCAN LOG · ${carrier}</div>
        </div>
      </div>
      <div class="header-ref">
        <div class="ref-badge">ERR · ${now.replace(/\D/g, '').slice(0, 8)}</div>
        <div class="ref-date">${now}</div>
        <div class="ref-employee">${employee}</div>
      </div>
    </div>

    <div class="meta-strip">
      <div class="meta-cell">
        <div class="meta-label">${labels.carrier}</div>
        <div class="meta-value">${carrier}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">${labels.employee}</div>
        <div class="meta-value">${employee}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">${labels.date}</div>
        <div class="meta-value mono">${now}</div>
      </div>
      <div class="meta-cell highlight">
        <div class="meta-label">${labels.totalFailedAttempts}</div>
        <div class="meta-value err">${logs.length} ${labels.attemptUnit}</div>
      </div>
    </div>
  </div>

  <!-- ── PRINT-ONLY ALERT BANNER ── -->
  <div class="print-alert">
    <div class="print-alert-inner">
      <div class="print-alert-icon">!</div>
      <div class="print-alert-text">
        ${labels.printAlertText}
      </div>
    </div>
  </div>

  <!-- ── TABLE ── -->
  <div class="table-wrap">
    <div class="section-label">
      <span class="section-label-text">${labels.totalAttempts}: ${logs.length}</span>
      <div class="section-label-line"></div>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th class="center">#</th>
            <th>${labels.orderNumber}</th>
            <th>${labels.scannedCode}</th>
            <th>${labels.failReason}</th>
            <th>${labels.time}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>

  <!-- ── FOOTER ── -->
  <div class="doc-footer">
    <div class="footer-left">
      <div class="footer-mark">
        <svg viewBox="0 0 10 10">
          <line x1="3" y1="3" x2="7" y2="7"/>
          <line x1="7" y1="3" x2="3" y2="7"/>
        </svg>
      </div>
      <span class="footer-text">${labels.title}</span>
      <div class="footer-divider"></div>
      <span class="footer-text">${labels.system}</span>
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
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────
export default function ReturnsTab({
  orders,
  updateOrder,
  pushOp,
  inventory,
  updateInventory,
  subtab,
  setSubtab,
  resetToken,
}) {
  const t = useTranslations("warehouse.returns");

  const [statsData, setStatsData] = useState({
    withCarrier: 0,
    returnedToday: 0,
    totalReturns: 0,
    returnFiles: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const { data } = await api.get('/orders/stats/returns-summary');
      setStatsData(data);
    } catch (error) {
      console.error("Failed to fetch returns stats", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, resetToken]);

  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumbs.home"), href: "dashboard/" },
          { name: t("breadcrumbs.warehouse"), href: "/warehouse" },
          { name: t("breadcrumbs.returns") },
        ]}
        buttons={
          <Button_
            size="sm"
            label={t("header.howItWorks")}
            variant="ghost"
            onClick={() => { }}
            icon={<Info size={18} />}
          />
        }
        statsLoading={statsLoading}
        stats={[
          {
            id: "with-carrier",
            name: t("stats.withCarrier"),
            value: statsData.withCarrier,
            icon: RotateCcw,
            color: "#3b82f6",
            sortOrder: 0,
          },
          {
            id: "returned-today",
            name: t("stats.returnedToday"),
            value: statsData.returnedToday,
            icon: CheckCircle2,
            color: "#10b981",
            sortOrder: 1,
          },
          {
            id: "total-returns",
            name: t("stats.totalReturns"),
            value: statsData.totalReturns,
            icon: ArchiveRestore,
            color: "#a855f7",
            sortOrder: 2,
          },
          {
            id: "return-files",
            name: t("stats.returnFiles"),
            value: statsData.returnFiles,
            icon: FileText,
            color: "#f59e0b",
            sortOrder: 3,
          },
        ]}
        items={[
          { id: "scan", label: t("subtabs.scanReturn"), count: statsData.withCarrier, icon: ScanLine },
          { id: "files", label: t("subtabs.files"), count: statsData.returnFiles, icon: FileDown },
        ]}
        active={subtab}
        setActive={setSubtab}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={subtab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {subtab === "scan" && (
            <ScanReturnsSubtab
              orders={orders}
              updateOrder={updateOrder}
              pushOp={pushOp}
              inventory={inventory}
              updateInventory={updateInventory}
              fetchStats={fetchStats}
              setSubtab={setSubtab}
            />
          )}

          {subtab === "files" && (
            <ReturnsFilesSubtab
              resetToken={resetToken}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// RETURNS SCAN INPUT BAR
// ─────────────────────────────────────────────────────────────
function ReturnsScanInputBar({
  inputRef,
  value,
  onChange,
  onScan,
  isSuccess,
  isError,
  placeholder,
  selectedCarrier,
  onCarrierChange,
  soundEnabled,
  onToggleSound,
  disabled = false,
}) {
  const t = useTranslations("warehouse.returns");
  const [isFocused, setIsFocused] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const prevIsError = useRef(!!isError);

  useEffect(() => {
    if (isError && !prevIsError.current) {
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 500);
    }
    prevIsError.current = !!isError;
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
    <motion.div
      animate={errorFlash ? { x: [0, -5, 6, -4, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className="relative"
      dir="rtl"
    >
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
          <div
            className={cn(
              "absolute w-full h-[2px]",
              cornerClass,
              idx < 2 ? "top-0" : "bottom-0"
            )}
          />
          <div
            className={cn(
              "absolute h-full w-[2px]",
              cornerClass,
              idx % 2 === 0 ? "left-0" : "right-0"
            )}
          />
        </motion.div>
      ))}

      <div
        className={cn(
          "relative flex flex-col md:flex-row md:items-center border transition-all duration-200 overflow-hidden",
          DS.radius,
          disabled && "opacity-50 pointer-events-none",
          isSuccess &&
          "border-emerald-500 bg-background shadow-[0_0_0_3px_rgba(16,185,129,0.10)]",
          isError &&
          "border-red-500 bg-background shadow-[0_0_0_3px_rgba(239,68,68,0.10)]",
          !isSuccess && !isError && !isFocused && "border-border bg-background/60",
          !isSuccess &&
          !isError &&
          isFocused &&
          "border-primary/60 bg-background shadow-[0_0_0_3px_rgba(255,139,0,0.08)]"
        )}
        style={{ minHeight: 56 }}
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
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(16,185,129,0.16), transparent)",
              }}
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
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 0.4,
                }}
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

        <div className="px-2.5 py-2 md:py-0 flex-shrink-0 z-10 border-b md:border-b-0 md:border-l border-slate-100 dark:border-slate-700 w-full md:w-auto md:min-w-[200px]">
          <ShippingCompanyFilter value={selectedCarrier} onChange={onCarrierChange} hideLabel={true} />
        </div>

        <div className="flex flex-1 items-center min-w-0">
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
                      : "text-muted-foreground/80"
              )}
            />
          </div>

          <div className="relative flex-shrink-0 mx-2 z-10">
            <div className="w-px h-4 bg-border/40" />
            <motion.div
              animate={
                isSuccess
                  ? {
                    backgroundColor: DS.success,
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.6, 1],
                  }
                  : isError
                    ? { backgroundColor: DS.danger, scale: [1, 1.3, 1] }
                    : isFocused
                      ? { backgroundColor: DS.primary, opacity: [1, 0.4, 1] }
                      : { backgroundColor: "#94a3b8" }
              }
              transition={
                isSuccess || isFocused
                  ? { duration: 1.5, repeat: Infinity }
                  : { duration: 0.3 }
              }
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
            className="relative z-10 flex-1 h-full min-h-[56px] bg-transparent border-none !outline-none focus:ring-0 text-sm font-semibold text-foreground placeholder:text-muted-foreground/80 px-2"
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
                className="relative z-10 flex-shrink-0 mx-1 w-[18px] h-[18px] rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X size={9} className="text-slate-500" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="pe-1 flex-shrink-0 z-10">
            <button
              type="button"
              onClick={onToggleSound}
              className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              title={t("scan.status.toggleSound")}
            >
              {soundEnabled ? (
                <Volume2 size={14} className="text-slate-500" />
              ) : (
                <VolumeX size={14} className="text-slate-400" />
              )}
            </button>
          </div>

          <div className="pe-2 flex-shrink-0 z-10">
            <motion.button
              type="button"
              onClick={handleScan}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.03 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              className={cn(
                "relative h-8 px-2 sm:px-3.5 text-white text-[10px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200",
                DS.radius
              )}
              style={{
                background: isSuccess
                  ? DS.successGradient
                  : isError
                    ? DS.dangerGradient
                    : DS.headerGradient,
                boxShadow: `0 2px 10px -2px ${isSuccess
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
                className="hidden sm:inline"
              >
                {isSuccess
                  ? t("scan.status.done")
                  : isError
                    ? t("scan.status.retry")
                    : t("scan.status.scanBtn")}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────────────────────
// ORDERS LIST
// ─────────────────────────────────────────────────────────────
function OrdersList({
  orders,
  scannedOrders,
  lastHighlight,
  onSelectOrder,
}) {
  const t = useTranslations("warehouse.returns");
  const [expanded, setExpanded] = useState({});
  const { formatCurrency } = usePlatformSettings();
  const toggle = (code) => setExpanded((p) => ({ ...p, [code]: !p[code] }));

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-3">
          <Package size={22} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">{t("scan.empty.title")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-none">
      <div className="min-w-[800px]">
        <div
          className="grid text-[10px] font-extrabold uppercase tracking-[0.07em] text-slate-400 px-5 py-2.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/30"
          style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr 1fr" }}
        >
          <span />
          <span>{t("scan.table.orderNumber")}</span>
          <span>{t("scan.table.customer")}</span>
          <span>{t("scan.table.city")}</span>
          <span className="text-center">{t("scan.table.products")}</span>
          <span className="text-center">{t("scan.table.total")}</span>
          <span />
        </div>

        <div className="divide-y divide-slate-100/80 dark:divide-slate-700/20">
          {orders.map((order, idx) => {
            const code = order.orderNumber;
            const isScanned = scannedOrders.some((o) => o.code === code);
            const isFlash = lastHighlight?.code === code;
            const isOpen = !!expanded[code];
            const prodCount = order.items?.length ?? 0;

            return (
              <motion.div
                key={code}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.025, duration: 0.18 }}
              >
                <div
                  className={cn(
                    "relative grid items-center px-5 py-3 transition-all duration-200 cursor-pointer select-none",
                    isScanned
                      ? "bg-emerald-50/60 dark:bg-emerald-950/10"
                      : "hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  )}
                  style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr 1fr" }}
                  onClick={() => prodCount > 0 && toggle(code)}
                >
                  <AnimatePresence>
                    {isFlash && (
                      <motion.div
                        initial={{ opacity: 0.45 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.9 }}
                        className={cn(
                          "absolute inset-0 pointer-events-none",
                          lastHighlight?.ok ? "bg-emerald-400/20" : "bg-red-400/20"
                        )}
                      />
                    )}
                  </AnimatePresence>

                  {isScanned && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
                  )}

                  <div className="flex items-center justify-center">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200",
                        isScanned
                          ? "bg-emerald-500 text-white shadow-[0_2px_8px_-2px_#10b98160]"
                          : "bg-slate-100 dark:bg-slate-800"
                      )}
                    >
                      {isScanned ? (
                        <CheckCircle2 size={14} className="text-white" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 tabular-nums">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "font-black font-mono text-[13px] transition-colors",
                        isScanned
                          ? "text-emerald-800 dark:text-emerald-300"
                          : "text-slate-800 dark:text-slate-100"
                      )}
                    >
                      {code}
                    </span>
                    {isScanned && (
                      <motion.span
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50"
                      >
                        ✓ {t("scan.table.selected")}
                      </motion.span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {order.customerName || "—"}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tabular-nums">
                      {order.phoneNumber || "—"}
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    {order.city || "—"}
                  </div>

                  <div className="flex justify-center">
                    <span
                      className="inline-flex items-center justify-center px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300 min-w-[32px]"
                    >
                      {prodCount}
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 tabular-nums">
                      {formatCurrency(order.finalTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder?.(order);
                      }}
                      	className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
										>
											<ScanLine size={20} />
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && prodCount > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                        <div
                          className="grid text-[9px] font-extrabold uppercase tracking-[0.07em] px-5 py-2.5 border-b text-slate-400 border-slate-100 dark:border-slate-800"
                         style={{ gridTemplateColumns: "3fr 2fr 1fr 1fr " }}
                        >
                          <span>{t("scan.table.productName")}</span>
                          <span className="text-center">SKU</span>
                          <span className="text-center">{t("scan.table.qty")}</span>
                          <span className="text-center">{t("scan.table.price")}</span>
                          <span className="text-center">{t("scan.table.total")}</span>
                        </div>

                        <div className="divide-y divide-slate-100/60 dark:divide-slate-800/40">
                          {order.items.map((p, pi) => (
                            <motion.div
                              key={p.sku || pi}
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: pi * 0.04 }}
                              className="grid items-center px-5 py-3 hover:bg-white/70 dark:hover:bg-slate-800/40 transition-colors"
                             style={{ gridTemplateColumns: "3fr 2fr 1fr 1fr " }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: "#ff8b0012" }}
                                >
                                  <Package size={11} style={{ color: "var(--primary)" }} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                                    {p.variant?.product?.name || p.name}
                                  </p>
                                  {p.variant?.sku && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                      {p.variant.sku}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-center">
                                <code className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                                  {p.sku || p.variant?.sku || "—"}
                                </code>
                              </div>

                              <div className="flex justify-center">
                                <span
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-[11px] font-black"
                                  style={{ background: "#ff8b0015", color: "var(--primary)" }}
                                >
                                  {p.quantity}
                                </span>
                              </div>

                              <div className="text-center">
                                <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                                  {p.unitPrice ? formatCurrency(p.unitPrice) : "—"}
                                </span>
                              </div>

                              <div className="text-center">
                                {p.unitPrice && p.quantity ? (
                                  <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 tabular-nums">
                                    {formatCurrency(p.unitPrice * p.quantity)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-900/40">
                          <span>
                            {prodCount} {t("scan.table.productUnit")}
                          </span>
                          {order.totalPrice && (
                            <span className="font-black text-[13px] text-slate-700 dark:text-slate-200">
                              {formatCurrency(order.totalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScannedOrderTable({ order, localProducts, onToggleItem, onQuantityChange, onSelectAll, onUnselectAll, selectedItems, returnReason, onReasonChange, onSave, isSaving }) {
  const t = useTranslations("warehouse.returns");
  const { formatCurrency } = usePlatformSettings();
  const totalQty = localProducts.reduce((s, p) => s + (p.quantity || 0), 0);
  const selectedQty = localProducts.reduce((s, p) => (selectedItems[p.sku] ? s + (selectedItems[p.sku].quantity || 0) : s), 0);
  const pct = totalQty === 0 ? 0 : Math.round((selectedQty / totalQty) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("border overflow-hidden transition-all duration-500", DS.radiusXl, "border-slate-200 dark:border-slate-700", DS.shadow)}
    >
      <div
        className="relative overflow-hidden px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30"
        style={{ ...DS.scanline }}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-3 sm:gap-y-2">
          <div className="flex items-center gap-3">
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
                {order.orderNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div className="hidden md:block min-w-0">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("scan.table.customer")}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{order.customerName}</p>
            </div>
            {order.shippingCompany && <CarrierPill carrier={order.shippingCompany.name} />}
          </div>

          <div className="ms-auto flex-shrink-0">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 border text-xs font-black tabular-nums transition-colors duration-300",
                DS.radius,
                "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              )}
            >
              <RotateCcw size={11} style={{ color: DS.primary }} />
              {selectedQty}
              <span className="text-slate-300 dark:text-slate-600 font-normal">/</span>
              {totalQty}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center gap-4 justify-between bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className={cn("px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors", DS.radiusSm)}
          >
            {t("scan.actions.selectAll")}
          </button>
          <button
            type="button"
            onClick={onUnselectAll}
            className={cn("px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors", DS.radiusSm)}
          >
            {t("scan.actions.unselectAll")}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 max-w-2xl">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{t("scan.actions.returnReason")}</span>
          <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-3">
            <Select value={returnReason} onValueChange={onReasonChange}>
              <SelectTrigger className={cn("flex-1 w-full h-9 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary outline-none transition-all", DS.radiusSm)}>
                <SelectValue placeholder={t("scan.actions.selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {RETURN_CONDITIONS_KEYS.map((key) => (
                  <SelectItem key={key} value={t(`conditions.${key}`)}>
                    {t(`conditions.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button_
              onClick={onSave}
              disabled={isSaving || Object.keys(selectedItems).length === 0}
              className="h-9 px-4 w-full sm:w-auto whitespace-nowrap"
              tone="primary"
              variant="solid"
              label={
                <div className="flex items-center gap-2">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{t("scan.actions.saveReturn")}</span>
                </div>
              }
              permission="return-request.create"
            />
          </div>
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
            {localProducts.map((p, i) => {
              const selection = selectedItems[p.sku];
              const checked = !!selection;
              return (
                <motion.tr
                  key={p.sku}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ opacity: { delay: i * 0.04 }, x: { delay: i * 0.04 } }}
                  className={cn(
                    "border-b border-slate-50 dark:border-slate-700/20 transition-colors duration-200",
                    checked ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  )}
                >
                  <td className="px-4 py-3 text-center">
                    <Checkbox checked={checked} onCheckedChange={() => onToggleItem(p)} />
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
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "font-semibold text-sm truncate max-w-[220px] block transition-colors duration-300",
                            checked ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          {p.name}
                        </span>
                        {p.variantName && <p className="text-[10px] text-slate-400">{p.variantName}</p>}
                      </div>
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
                    {checked ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={p.quantity}
                          value={selection.quantity}
                          onChange={(e) => onQuantityChange(p.sku, parseInt(e.target.value) || 0)}
                          className={cn("w-16 h-8 text-center text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary outline-none", DS.radiusSm)}
                        />
                        <span className="text-[10px] text-slate-400">/ {p.quantity}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-sm font-bold text-slate-400">{p.quantity}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                      {formatCurrency(p.price || 0)}
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

function ReturnsScanLogBoxes({ successCount, errorCount }) {
  const t = useTranslations("warehouse.returns");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className={cn("p-4 border transition-all", DS.radius, "bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30")}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t("scan.counters.scannedReturns")}</p>
        </div>
        <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 tabular-nums ps-11">{successCount}</p>
      </div>

      <div className={cn("p-4 border transition-all", DS.radius, "bg-red-50/40 border-red-100 dark:bg-red-950/10 dark:border-red-900/30")}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-200/50">
            <AlertCircle size={16} className="text-white" />
          </div>
          <p className="text-[11px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider">{t("scan.counters.failedScans")}</p>
        </div>
        <p className="text-2xl font-black text-red-900 dark:text-red-100 tabular-nums ps-11">{errorCount}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RETURNS ORDERS SLIDE PANEL
// ─────────────────────────────────────────────────────────────
function ReturnsOrdersSlidePanel({ open, onClose, orders,loading, selectedOrderIds,setSelectedOrderIds, onManifestCreated }) {
  const t = useTranslations("warehouse.returns");
  const locale = useLocale();
  const isRtl = locale !== "en";


  const [creatingManifest, setCreatingManifest] = useState(false);



  const toggleSelect = (id) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateManifest = async () => {
    if (selectedOrderIds.length === 0) return;

    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));

    const firstCarrierId = selectedOrders[0]?.shippingCompanyId;
    const isMismatch = selectedOrders.some(o => o.shippingCompanyId !== firstCarrierId);

    if (isMismatch) {
      toast.error(t("scan.messages.carrierMismatchError"));
      return;
    }

    try {
      setCreatingManifest(true);
      await api.post('/orders/manifests/return', {
        shippingCompanyId: firstCarrierId ? firstCarrierId : null,
        orderIds: selectedOrderIds,
      });
      toast.success(t("scan.messages.returnSuccess", { code: "" }) || "Return manifest created successfully");
      onManifestCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create return manifest", error);
      toast.error(error.response?.data?.message || t("scan.messages.manifestCreated"));
    } finally {
      setCreatingManifest(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1000]" onClick={onClose} />
          <motion.div
            initial={{ x: isRtl ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 ltr:right-0 rtl:left-0 h-full w-full sm:w-[420px] bg-white dark:bg-slate-900 shadow-2xl z-[1000000] flex flex-col"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <PanelHeader
              icon={Layers}
              pretitle={t("common.carrier")}
              title={t("scan.actions.confirmReturn")}
              right={<HeaderIconBtn onClick={onClose}><X size={13} className="text-white" /></HeaderIconBtn>}
            >
              <HeaderBadge><Package size={11} />{t("scan.labels.ordersWithCarrier", { count: orders.length })}</HeaderBadge>
            </PanelHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <p className="text-xs text-slate-400 font-medium tracking-wide">{t("scan.labels.loading")}</p>
                </div>
              ) : (
                orders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <motion.div key={order.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSelect(order.id)}
                      className={cn(
                        "p-3 border cursor-pointer transition-all flex items-center gap-3",
                        DS.radius,
                        isSelected
                          ? "border-primary/40 bg-primary/5 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
                      )}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-black text-sm" style={{ color: DS.primary }}>{order.orderNumber}</span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">{order.customerName}</p>

                        {/* التعديل هنا: إضافة اسم شركة الشحن بجانب المدينة */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <p className="text-[10px] text-slate-400 truncate">
                            {order.city} · {order.items?.length} {t("scan.labels.products")}
                          </p>

                          <>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-primary/80 bg-primary/5 px-1.5 rounded-sm">
                              {order.shippingCompany?.name || t("common.unspecified")}
                            </span>
                          </>

                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              {!loading && orders.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700/50">
                    <Package size={32} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">{t("scan.messages.noShippedOrders")}</p>
                </div>
              )}
            </div>

            {orders.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <Button_
                  onClick={handleCreateManifest}
                  disabled={selectedOrderIds.length === 0 || creatingManifest}
                  className="w-full h-11"
                  tone="primary"
                  variant="solid"
                  label={
                    <div className="flex items-center justify-center gap-2">
                      {creatingManifest ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      <span>{t("scan.actions.confirmReturn")} ({selectedOrderIds.length})</span>
                    </div>
                  }
                  permission="orders.create"
                />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// SCAN SUBTAB
// ─────────────────────────────────────────────────────────────
export function ScanReturnsSubtab({
  fetchStats,
  setSubtab
}) {
  const t = useTranslations("warehouse.returns");

  const [selectedCarrier, setSelectedCarrier] = useState("all");
  const [scanInput, setInput] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);
  const [localProducts, setLocalProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnReason, setReturnReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [availableForCarrier, setAvailableForCarrier] = useState([]);
  const [scannedOrdersCount, setnedOrdersCount] = useState(0);
  const [wrongScans, setWrongScans] = useState(0);
  const [lastHighlight, setLastHighlight] = useState(null);
  const [lastMsg, setLastMsg] = useState(null);
  const [scanState, setState] = useState("idle");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFetchingOrder, setIsFetchingOrder] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const scanRef = useRef(null);

  const fetchAvailableOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const res = await api.get('/orders', {
        params: {
          status: 'shipped,delivered',
          shippingCompanyId: selectedCarrier,
          limit: 100
        }
      });
      setAvailableForCarrier(res.data?.records || []);
    } catch (error) {
      console.error("Failed to fetch available orders", error);
    } finally {
      setLoadingOrders(false);
    }
  }, [selectedCarrier]);

  useEffect(() => {
    fetchAvailableOrders();
  }, [fetchAvailableOrders]);

  const availableItemsCount = useMemo(
    () =>
      availableForCarrier.reduce(
        (sum, order) =>
          sum +
          (order.items?.reduce((itemSum, p) => itemSum + (Number(p.quantity) || 0), 0) || 0),
        0
      ),
    [availableForCarrier]
  );

  const showFeedback = useCallback((type, message) => {
    setLastMsg({ success: type === "success", message });
    setState(type);
    setTimeout(() => {
      setLastMsg(null);
      setState("idle");
    }, 2200);
  }, []);

  const fetchActiveOrder = useCallback(async (idOrCode) => {
    try {
      setIsFetchingOrder(true);
      const res = await api.get(`/orders/number/${idOrCode}`);
      const order = res.data;

      // Validation: order must be shipped or delivered
      if (!order || (order.status?.code !== 'shipped' && order.status?.code !== 'delivered')) {
        if (soundEnabled) playBeep("error");
        showFeedback("error", t("scan.messages.notFound") || "Order not found or not in valid status for return");
        setInput("");
        return;
      }
      setActiveOrder(order);
      setLocalProducts((order.items || []).map((p) => ({
        id: p.id,
        sku: p.variant?.sku || p.sku,
        name: p.variant?.product?.name || p.name,
        variantName: p.variant?.name,
        image: p.variant?.image || p.image,
        quantity: p.quantity,
        price: p.price
      })));
      setSelectedItems({});
      setReturnReason("");
      setInput("");
      if (soundEnabled) playBeep("success");
      showFeedback("success", t("scan.messages.found", { code: order.orderNumber }));
    } catch (error) {
      if (soundEnabled) playBeep("error");
      showFeedback("error", t("scan.messages.notFound", { code: idOrCode }));
      setInput("");
    } finally {
      setIsFetchingOrder(false);
    }
  }, [soundEnabled, showFeedback, t]);

  const handleCarrierChange = (val) => {
    setSelectedCarrier(val);
    setActiveOrder(null);
    setLocalProducts([]);
    setSelectedItems({});
    setReturnReason("");
    setLastMsg(null);
    setLastHighlight(null);
    setState("idle");
  };

  const resetCurrentOrder = useCallback(() => {
    setInput("");
    setActiveOrder(null);
    setLocalProducts([]);
    setSelectedItems({});
    setReturnReason("");
    setTimeout(() => scanRef.current?.focus(), 100);
  }, []);

  const handleScan = async () => {
    const val = scanInput.trim();
    if (!val) return;
    await fetchActiveOrder(val);
  };

  const toggleItem = (p) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (newItems[p.sku]) {
        delete newItems[p.sku];
      } else {
        newItems[p.sku] = {
          originalItemId: p.id,
          quantity: p.quantity,
          sku: p.sku
        };
      }
      return newItems;
    });
  };

  const changeQuantity = (sku, qty) => {
    setSelectedItems(prev => ({
      ...prev,
      [sku]: { ...prev[sku], quantity: qty }
    }));
  };

  const selectAll = () => {
    const all = {};
    localProducts.forEach(p => {
      all[p.sku] = {
        originalItemId: p.id,
        quantity: p.quantity,
        sku: p.sku
      };
    });
    setSelectedItems(all);
  };

  const unselectAll = () => setSelectedItems({});

  const [returnOrders, setReturnOrders] = useState([]);
  const [loadingReturnOrders, setLoadingReturnOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

    const fetchShippedOrders = useCallback(async () => {
    try {
      setLoadingReturnOrders(true);
      const res = await api.get('/orders', {
        params: {
          status: 'return_preparing',
          limit: 100
        }
      });
      setReturnOrders(res.data?.records || []);
      setSelectedOrderIds([]);
    } catch (error) {
      console.error("Failed to fetch shipped orders", error);
    } finally {
      setLoadingReturnOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchShippedOrders();
  }, [ fetchShippedOrders]);

  const handleSaveReturn = async () => {
    if (!activeOrder || Object.keys(selectedItems).length === 0) return;
    try {
      setIsSaving(true);
      const payload = {
        orderId: activeOrder.id,
        reason: returnReason,
        items: Object.values(selectedItems).map(item => ({
          originalItemId: item.originalItemId,
          quantity: item.quantity
        }))
      };

      await api.post('/order-returns/return-request', payload);

      setnedOrdersCount(prev => prev + 1);
      toast.success(t("scan.messages.returnSuccess", { code: activeOrder.orderNumber }));

      if (soundEnabled) playBeep("success");
      fetchAvailableOrders();
      fetchShippedOrders();
      fetchStats?.();

      setTimeout(() => {
        resetCurrentOrder();
      }, 1000);
    } catch (error) {
      console.error("Failed to save return request", error);
      toast.error(error.response?.data?.message || "Failed to save return request");
      if (soundEnabled) playBeep("error");
    } finally {
      setIsSaving(false);
    }
  };

  const isItemsMode = !!activeOrder;
  const meta = selectedCarrier !== "all" ? getCarrierMeta(selectedCarrier) : null;

  return (
    <div className="space-y-4" dir="rtl">
      <Panel>
        <PanelHeader
          icon={ScanLine}
          pretitle={!isItemsMode ? t("scan.header.subtitleReady") : `${t("scan.header.orderLabel")}: ${activeOrder?.orderNumber}`}
          title={!isItemsMode ? t("scan.header.title") : t("scan.header.titleActive")}
          right={
            <>
              <HeaderIconBtn onClick={() => setSoundEnabled(v => !v)}>
                {soundEnabled ? <Volume2 size={13} className="text-white" /> : <VolumeX size={13} className="text-white/60" />}
              </HeaderIconBtn>
              <HeaderBadge onClick={() => setPanelOpen(true)}><Layers size={12} />{t("scan.labels.returnOrders", {count: returnOrders?.length || 0})}</HeaderBadge>
              {isItemsMode && <HeaderBadge onClick={resetCurrentOrder}><X size={12} />{t("scan.actions.cancel")}</HeaderBadge>}
            </>
          }
          permission="orders.read"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <HeaderBadge>
              <ClipboardList size={11} />
              {t("scan.labels.availableOrders")}: {availableForCarrier.length}
            </HeaderBadge>
            <HeaderBadge>
              <Boxes size={11} />
              {t("scan.labels.totalItems")}: {availableItemsCount}
            </HeaderBadge>
          </div>
        </PanelHeader>

        <div className="px-4 pt-8 py-5 space-y-4">
          <div className="relative">
            <ReturnsScanInputBar
              inputRef={scanRef}
              value={scanInput}
              onChange={(e) => setInput(e.target.value)}
              onScan={handleScan}
              isSuccess={scanState === "success"}
              isError={scanState === "error"}
              placeholder={t("scan.placeholders.scanOrder")}
              selectedCarrier={selectedCarrier}
              onCarrierChange={handleCarrierChange}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((v) => !v)}
              disabled={isFetchingOrder || isSaving}
            />
            {(isFetchingOrder || isSaving) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-xl z-10">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            )}
          </div>

          <AnimatePresence>
            {lastMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 border text-sm font-semibold",
                  DS.radius,
                  lastMsg.success
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300"
                )}
              >
                {lastMsg.success ? (
                  <CheckCircle2 size={14} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={14} className="flex-shrink-0" />
                )}
                {lastMsg.message}
              </motion.div>
            )}
          </AnimatePresence>

          <ReturnsScanLogBoxes successCount={scannedOrdersCount} errorCount={wrongScans} />
        </div>
      </Panel>


      <>
        <Panel>
          <div
            className="relative overflow-hidden px-4 py-3 border-b border-slate-100 dark:border-slate-700/60"
            style={{ background: DS.cardGradient, ...DS.scanline }}
          >
            <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                  {t("common.carrier")}
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center")}
                    style={{ background: meta?.color + "15" }}
                  >
                    <RotateCcw size={13} style={{ color: meta?.color || DS.primary }} />
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {selectedCarrier}
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                  {t("scan.labels.orders")}
                </p>
                <p className="font-mono font-black text-sm" style={{ color: DS.primary }}>
                  {availableForCarrier.length}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                  {t("scan.labels.items")}
                </p>
                <p className="font-mono font-black text-sm text-slate-700 dark:text-slate-200">
                  {availableItemsCount}
                </p>
              </div>
            </div>
          </div>

          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-bold text-slate-400 tracking-wide animate-pulse">{t("scan.labels.loadingShippedOrders")}</p>
            </div>
          ) : isItemsMode ? (
            <ScannedOrderTable
              order={activeOrder}
              localProducts={localProducts}
              selectedItems={selectedItems}
              onToggleItem={toggleItem}
              onQuantityChange={changeQuantity}
              onSelectAll={selectAll}
              onUnselectAll={unselectAll}
              returnReason={returnReason}
              onReasonChange={setReturnReason}
              onSave={handleSaveReturn}
              isSaving={isSaving}
            />
          ) : (
            <OrdersList
              orders={availableForCarrier}
              scannedOrders={[]}
              lastHighlight={lastHighlight}
              onSelectOrder={(order) => fetchActiveOrder(order.orderNumber)}
            />
          )}
        </Panel>
      </>

      <ReturnsOrdersSlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        selectedOrderIds={selectedOrderIds}
				setSelectedOrderIds={setSelectedOrderIds}
				orders={returnOrders}
				loading={loadingReturnOrders}
        onManifestCreated={() => {
          fetchStats?.();
          setSubtab("files");
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FILES SUBTAB
// ─────────────────────────────────────────────────────────────
function FileSummaryCell({ row, t }) {
  const totalOrders =row.orders?.length || 0;
  const totalItems =
    row.orders?.reduce(
      (sum, order) =>
        sum + (order?.lastReturn?.items?.reduce((itemSum, p) => itemSum + (Number(p.quantity) || 0), 0) || 0),
      0
    ) || 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          {t("scan.labels.ordersCount")}
        </span>
        <span
          className="text-xs font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800"
          style={{ color: DS.primary }}
        >
          {totalOrders}
        </span>
      </div>

      <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>

      <div className="flex items-center gap-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          {t("scan.labels.itemsCount")}
        </span>
        <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          {totalItems}
        </span>
      </div>
    </div>
  );
}

function ReturnsFilesSubtab({
  resetToken,
}) {
  const t = useTranslations("warehouse.returns");
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 350 })
  const [filterCarrier, setFilterCarrier] = useState("all");
  const [filterIsPrinted, setFilterIsPrinted] = useState("all");
  const [downloading, setDownloading] = useState({});
  const [downloadingWrongLog, setDownloadingWrongLog] = useState({});

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchManifests = useCallback(async (page = pager.current_page, per_page = pager.per_page) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: per_page,
        search: debouncedSearch,
        shippingCompanyId: filterCarrier === "all" ? undefined : filterCarrier,
        isPrinted: filterIsPrinted === "all" ? undefined : filterIsPrinted,
        type: "RETURN"
      };
      const res = await api.get('/orders/manifests', { params });
      setPager({
        total_records: res.data.total_records,
        current_page: res.data.current_page || page,
        per_page: res.data.per_page || per_page,
        records: res.data.records
      });
    } catch (error) {
      console.error("Error fetching return manifests", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterIsPrinted, filterCarrier, pager.current_page, pager.per_page]);

  useEffect(() => {
    fetchManifests(1, pager.per_page);
  }, [debouncedSearch, resetToken]);


  const applyFilters = () => {
    fetchManifests(1, pager.per_page);
  };


  const returnPdfLabels = {
    title: t("pdf.title"),
    printDate: t("pdf.returnDate"),
    employee: t("pdf.employee"),
    totalOrders: t("pdf.totalOrders"),
    carrier: t("pdf.carrier"),
    returnDate: t("pdf.returnDate"),
    orderUnit: t("pdf.orderUnit"),
    sku: t("pdf.sku"),
    product: t("pdf.product"),
    qty: t("pdf.qty"),
    trackingCode: t("pdf.trackingCode"),
    receiptConfirmation: t("pdf.receiptConfirmation"),
    courierName: t("pdf.courierName"),
    signature: t("pdf.signature"),
    dateTime: t("pdf.dateTime"),
    system: t("pdf.system"),
    conditions: {
      intact: t("conditions.intact"),
    },
    condition: t("pdf.condition"),
  };

  const wrongLogLabels = {
    title: t("wrongPdf.title"),
    printDate: t("wrongPdf.date"),
    employee: t("wrongPdf.employee"),
    totalAttempts: t("wrongPdf.totalAttempts"),
    carrier: t("wrongPdf.carrier"),
    date: t("wrongPdf.date"),
    totalFailedAttempts: t("wrongPdf.totalFailedAttempts"),
    attemptUnit: t("wrongPdf.attemptUnit"),
    scannedCode: t("wrongPdf.scannedCode"),
    orderNumber: t("wrongPdf.orderNumber"),
    failReason: t("wrongPdf.failReason"),
    time: t("wrongPdf.time"),
    printAlertText: t("wrongPdf.printAlertText"),
    system: t("wrongPdf.system"),
    reasons: {
      SKU_NOT_IN_ORDER: t("scan.reasons.SKU_NOT_IN_ORDER"),
      ALREADY_FULLY_SCANNED: t("scan.reasons.ALREADY_FULLY_SCANNED"),
      INVALID_STATUS: t("scan.reasons.INVALID_STATUS"),
      OTHER: t("scan.reasons.OTHER"),
    }
  };

  const handleDownload = async (row) => {
    setDownloading((p) => ({ ...p, [row.id]: true }));
    try {
      const res = await api.get(`/orders/manifests/${row.id}`);
      const manifest = res.data;

      const ordersSnapshot = manifest.orders.map(o => {
        // Use lastReturn if available, otherwise fallback to manifest snapshot or items
        const returnData = o.lastReturn || {};
        const returnItems = returnData.items || o.items || [];

        return {
          code: o.orderNumber,
          customer: o.customerName,
          city: o.city,
          carrier: manifest.shippingCompany?.name,
          lastReturn: returnData,
          products: returnItems.map(i => ({
            sku: i.sku || i.variant?.sku || i.originalItem?.variant?.sku || "—",
            name: i.name || i.variant?.product?.name || i.originalItem?.variant?.product?.name || "—",
            quantity: i.quantity || i.returnedQty || 0
          })),
          trackingNumber: o.trackingNumber,
          total: o.totalPrice
        };
      });

      openPrintWindow(
        buildReturnPDF(
          ordersSnapshot,
          manifest.shippingCompany?.name || "-",
          manifest.changedByUser?.name || "System",
          new Date(manifest.createdAt).toLocaleString(),
          returnPdfLabels
        )
      );

      await api.patch(`/orders/${row.id}/mark-manifest-printed`);
      fetchManifests();
    } catch (error) {
      console.error("Error downloading return manifest", error);
      toast.error(t("scan.messages.errorLoadingFile"));
    } finally {
      setDownloading((p) => ({ ...p, [row.id]: false }));
    }
  };

  const handleDownloadWrongLog = async (row) => {
    setDownloadingWrongLog((p) => ({ ...p, [row.id]: true }));
    try {
      const res = await api.get(`/orders/${row.id}/return-manifests/scan-logs`);
      const logsData = res.data || [];

      const logs = logsData.map(l => ({
        sku: l.sku || "-",
        reason: l.reason || "-",
        orderNumber: l.order?.orderNumber || "-",
        time: new Date(l.createdAt).toLocaleTimeString()
      }));

      openPrintWindow(
        buildWrongScanLogPDF(
          logs,
          row.shippingCompany?.name || "-",
          row.order?.user?.name || "System",
          new Date().toLocaleString(),
          wrongLogLabels
        )
      );
    } catch (error) {
      console.error("Error downloading return wrong log", error);
      toast.error(t("scan.messages.errorLoadingLogs"));
    } finally {
      setDownloadingWrongLog((p) => ({ ...p, [row.id]: false }));
    }
  };




  const columns = useMemo(
    () => [
      // {
      //   key: "id",
      //   header: t("files.th.fileNumber"),
      //   cell: (row) => (
      //     <span className="font-mono font-bold text-primary">{row.manifestNumber}</span>
      //   ),
      // },
      {
        key: "carrier",
        header: t("files.th.carrier"),
        cell: (row) => <CarrierPill carrier={row.shippingCompany?.name} />,
      },
      {
        key: "isPrinted",
        header: t("files.th.printStatus"),
        cell: (row) => (
          <div className="flex items-center justify-center">
            {row.lastPrintedAt ? (
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                {t("files.status.printed")}
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                {t("files.status.notPrinted")}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "orderCodes",
        header: t("files.th.returnedOrders"),
        cell: (row) => {
          return (
            <FileSummaryCell
              row={row}
              t={t}
            />
          )
        },
      },
      {
        key: "createdAt",
        header: t("files.th.createdAt"),
        cell: (row) => (
          <span className="text-sm text-slate-500">{new Date(row.createdAt).toLocaleString()}</span>
        ),
      },
      {
        key: "createdBy",
        header: t("files.th.createdBy"),
        cell: (row) => row.changedByUser?.name || "—"
      },
      {
        key: "actions",
        header: t("files.th.actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: downloading[row.id] ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <DownloadCloud size={13} />
                ),
                tooltip: t("files.tooltip.downloadReceipt"),
                onClick: (r) => handleDownload(r),
                variant: "primary",
                disabled: !!downloading[row.id],
                permission: "orders.read",
              },
              // {
              //   icon: downloadingWrongLog[row.id] ? (
              //     <Loader2 size={13} className="animate-spin" />
              //   ) : (
              //     <FileText size={13} />
              //   ),
              //   tooltip: t("files.tooltip.downloadWrongLog"),
              //   onClick: (r) => handleDownloadWrongLog(r),
              //   variant: "red",
              //   disabled: !!downloadingWrongLog[row.id],
              // },
            ]}
          />
        ),
      },
    ],
    [downloading, downloadingWrongLog, t]
  );

  return (
    <div className="space-y-4">

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onApplyFilters={applyFilters}
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
        hasActiveFilters={filterCarrier !== "all" || filterIsPrinted !== "all"}
        onSearch={applyFilters}
        filters={
          <>
            <ShippingCompanyFilter value={filterCarrier} onChange={setFilterCarrier} />
            <FilterField label={t("files.th.printStatus")}>
              <Select value={filterIsPrinted} onValueChange={setFilterIsPrinted}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:border-[var(--primary)] transition-all">
                  <SelectValue placeholder={t("files.th.printStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="true">{t("files.status.printed")}</SelectItem>
                  <SelectItem value="false">{t("files.status.notPrinted")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </>
        }
        columns={columns}
        data={pager.records}
        isLoading={loading}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={({ page: p, per_page }) =>
          fetchManifests(p, per_page)
        }
      />
    </div>
  );
}

