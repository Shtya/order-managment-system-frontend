"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Clock, ScanLine, Package, CheckCircle2, Ban, FileDown, Truck, Info,
	X, Layers, AlertCircle, Hash, MapPin, User, ShoppingBag,
	TrendingUp, Volume2, VolumeX, CreditCard, Store, ChevronDown,
	Loader2,
	FileText,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Table, { FilterField } from "@/components/atoms/Table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import api from "@/utils/api";
import PageHeader from "../../../../components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";
import Button_ from "@/components/atoms/Button";
import { STATUS, CARRIERS, CARRIER_STYLES, CARRIER_META } from "./data";
import { OrderDetailModal } from "./DistributionTab";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import StoreFilter from "@/components/atoms/StoreFilter";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import ProductFilter from "@/components/atoms/ProductFilter";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — Single source of truth for the whole page
// ─────────────────────────────────────────────────────────────
const DS = {
	radius: "rounded-lg",          // unified border-radius
	radiusSm: "rounded-md",        // smaller variant
	radiusXl: "rounded-xl",        // cards/panels

	// Brand colors
	primary: "#ff8b00",
	primaryLight: "rgba(255,139,0,0.10)",
	primaryBorder: "rgba(255,139,0,0.25)",
	accent: "#6763af",
	success: "#10b981",
	successLight: "rgba(16,185,129,0.10)",
	danger: "#ef4444",
	dangerLight: "rgba(239,68,68,0.10)",
	warning: "#ffb703",

	// Gradients
	headerGradient: "linear-gradient(135deg, var(--primary) 0%, #ff5c2b 100%)",
	successGradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
	dangerGradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
	cardGradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
	successCardGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",

	// Shadow
	shadow: "shadow-sm",
	shadowMd: "shadow-md",

	// Scanline texture (shared)
	scanline: {
		backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 4px)",
	}
};

const WRONG_SCAN_PDF_STYLE = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

  :root {
    --primary: #ff8b00;
    --primary-soft: #fff4e6;
    --err: #ef4444;
    --err-mid: #b91c1c;
    --err-soft: #fef2f2;
    --err-bg: #fff5f5;
    --err-rule: #fee2e2;
    --cream: #fdfcfb;
    --cream-warm: #faf9f6;
    --cream-deep: #f5f2ed;
    --charcoal: #1e293b;
    --charcoal-soft: #475569;
    --charcoal-mid: #64748b;
    --charcoal-muted: #94a3b8;
    --charcoal-faint: #cbd5e1;
    --white: #ffffff;
    --rule: #e2e8f0;
    --rule-soft: #f1f5f9;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'Tajawal', sans-serif;
  }

  body {
    font-family: var(--sans);
    background: var(--white);
    color: var(--charcoal);
    -webkit-font-smoothing: antialiased;
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     HEADER BAND
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
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

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     META STRIP
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
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

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ALERT BANNER (appears only on print)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
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

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     TABLE SECTION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
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

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FOOTER
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
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

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     PRINT OVERRIDES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  @media print {
    body { background: white; }
    .print-alert { display: block !important; }
    .header-band, .meta-strip, .meta-cell, thead tr, .badge-error, .doc-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tbody tr { page-break-inside: avoid; }
    .table-card { box-shadow: none; }
  }
</style>`;

function buildWrongScanLogPDF(logs, carrier, employee, now, labels, orderInfo = null) {
	const rows = logs.map((l, i) => `
    <tr>
      <td class="idx-cell">${i + 1}</td>
      <td class="code-cell">${l.orderNumber}</td>
      <td class="code-cell">${l.sku}</td>
      <td>${l.userName}</td>
      <td><span class="badge-error">${labels.reasons?.[l.reason] || l.reason}</span></td>
      <td class="time-cell"><span>${l.time}</span></td>
    </tr>`
	).join("");

	let orderHeader = "";
	if (orderInfo) {
		orderHeader = `
    <div style="padding: 20px 32px; border-bottom: 1px solid var(--rule); background: var(--cream-warm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 16px; color: var(--charcoal);">${labels.orderInfo}</h3>
        <span style="font-family: var(--mono); font-weight: 700; color: var(--primary);">${orderInfo.orderNumber}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
        <div>
          <div style="font-size: 10px; color: var(--charcoal-muted); margin-bottom: 4px;">${labels.customer}</div>
          <div style="font-weight: 600; font-size: 13px;">${orderInfo.customerName}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--charcoal-muted); margin-bottom: 4px;">${labels.city}</div>
          <div style="font-weight: 600; font-size: 13px;">${orderInfo.city}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--charcoal-muted); margin-bottom: 4px;">${labels.phone}</div>
          <div style="font-weight: 600; font-size: 13px; font-family: var(--mono);">${orderInfo.phoneNumber}</div>
        </div>
      </div>
    </div>`;
	}

	return `<!DOCTYPE html>
<html lang="ar" >
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
        
      </div>
    </div>

    ${orderHeader}

    <div class="meta-strip">
      <div class="meta-cell">
        <div class="meta-label">${labels.carrier}</div>
        <div class="meta-value">${carrier}</div>
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
            <th>${labels.userName}</th>
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
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────

/** Unified carrier badge */
function CarrierPill({ carrier }) {
	const s = CARRIER_STYLES[carrier] || {};
	return (
		<span className={cn(
			"inline-flex items-center gap-1.5 px-2.5 py-1",
			DS.radiusSm, "text-xs font-bold border",
			s.bg, s.border, s.text
		)}>
			<Truck size={11} />{carrier}
		</span>
	);
}

/** Unified section panel wrapper */
function Panel({ children, className }) {
	return (
		<div className={cn(
			"bg-white dark:bg-slate-800/80",
			DS.radiusXl,
			"border border-slate-100 dark:border-slate-700",
			DS.shadow,
			"overflow-hidden",
			className
		)}>
			{children}
		</div>
	);
}

/** Unified gradient panel header */
function PanelHeader({
	icon: Icon,
	pretitle,
	title,
	right,
	children,
}) {
	return (
		<div className="relative px-5 py-4 overflow-hidden" style={{ background: DS.headerGradient }}>
			<div className="absolute -top-5 -left-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
			<div className="absolute -bottom-5 -right-5 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
			<div className="relative flex items-center justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0">
					<div className={cn("w-9 h-9 flex-shrink-0 flex items-center justify-center", DS.radiusSm, "bg-white/20 backdrop-blur-sm")}>
						<Icon size={18} className="text-white" />
					</div>
					<div className="min-w-0">
						{pretitle && <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-0.5">{pretitle}</p>}
						<h3 className="text-white font-black text-sm tracking-tight truncate">{title}</h3>
					</div>
				</div>
				{right && <div className="flex items-center gap-1.5 flex-shrink-0">{right}</div>}
			</div>
			{children && <div className="relative mt-3">{children}</div>}
		</div>
	);
}

/** Unified pill/badge used in headers */
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

/** Unified icon button used in headers */
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

// ─────────────────────────────────────────────────────────────
// SOUND
// ─────────────────────────────────────────────────────────────
function playBeep(type = "success") {
	try {
		const ctx = new (window.AudioContext || (window).webkitAudioContext)();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain); gain.connect(ctx.destination);
		if (type === "success") {
			osc.frequency.setValueAtTime(880, ctx.currentTime);
			osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
			gain.gain.setValueAtTime(0.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
			osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
		} else {
			osc.frequency.setValueAtTime(220, ctx.currentTime);
			osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
			gain.gain.setValueAtTime(0.35, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
			osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
		}
	} catch (_) { }
}

// ─────────────────────────────────────────────────────────────
// SCAN PROGRESS BAR (table cell)
// ─────────────────────────────────────────────────────────────
function ScanProgress({ products }) {
	const total = products.reduce((s, p) => s + p.quantity, 0);
	const scanned = products.reduce((s, p) => s + (p.scannedQuantity || 0), 0);
	const pct = total === 0 ? 0 : Math.round((scanned / total) * 100);
	return (
		<div className="flex items-center gap-2 min-w-[120px]">
			<div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
				<motion.div
					initial={{ width: 0 }}
					animate={{ width: `${pct}%` }}
					transition={{ duration: 0.5 }}
					className={cn(
						"h-full rounded-full",
						pct === 100 ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-primary"
					)}
				/>
			</div>
			<span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
				{scanned}/{total}
			</span>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// ARC RING (shared progress ring)
// ─────────────────────────────────────────────────────────────
function ArcRing({
	pct, size = 44, stroke = 3.5,
	color, trackColor,
}) {
	const r = (size - stroke) / 2;
	const circ = 2 * Math.PI * r;
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 w-full h-full -rotate-90">
			<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
			<motion.circle
				cx={size / 2} cy={size / 2} r={r}
				fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
				strokeDasharray={circ}
				initial={{ strokeDashoffset: circ }}
				animate={{ strokeDashoffset: circ * (1 - Math.min(pct / 100, 1)) }}
				transition={{ duration: 0.55, ease: "easeOut" }}
			/>
		</svg>
	);
}


// ─────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────
export default function PreparationTab({
	pushOp, subtab, setSubtab, onPrepareMultiple,
	setDistributionDialog, setSelectedOrdersGlobal, resetToken,
}) {
	const t = useTranslations("warehouse.preparation");

	const [panelOpen, setPanelOpen] = useState(false);
	const [jumpToOrder, setJumpToOrder] = useState(null);
	const [loading, setLoading] = useState(true);
	const [statsData, setStatsData] = useState({
		scanning: 0,
		notStarted: 0,
		total: 0
	});

	const fetchStats = useCallback(async () => {
		try {
			setLoading(true);
			const { data } = await api.get('/orders/stats/preparation-summary');
			setStatsData(data);
		} catch (error) {
			console.error("Failed to fetch preparation stats", error);
		} finally {
			setLoading(false);
		}
	}, []);

	const updateStatsAfterScanStart = useCallback(() => {
		setStatsData(prev => ({
			...prev,
			scanning: prev.scanning + 1,
			notStarted: Math.max(0, prev.notStarted - 1)
		}));
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats, resetToken]);

	const handlePrepareOrder = useCallback((order) => {
		setJumpToOrder(order); setSubtab("scanning");
	}, [setSubtab]);

	const applyFilters = () => { };

	useEffect(() => { if (subtab !== "scanning") setJumpToOrder(null); }, [subtab]);

	const stats = [
		{ id: "scanning", name: t("stats.scanning"), value: statsData.scanning, icon: Clock, color: DS.accent, sortOrder: 0 },
		{ id: "not-started", name: t("stats.notStarted"), value: statsData.notStarted, icon: Package, color: DS.warning, sortOrder: 1 },
		{ id: "total", name: t("stats.total"), value: statsData.total, icon: CheckCircle2, color: DS.primary, sortOrder: 2 },
	];

	return (
		<div className="space-y-4">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumbs.home"), href: "/" },
					{ name: t("breadcrumbs.warehouse"), href: "/warehouse" },
					{ name: t("breadcrumbs.preparation") },
				]}
				buttons={<Button_ size="sm" label={t("howItWorks")} variant="ghost" onClick={() => { }} icon={<Info size={18} />} permission="orders.read" />}
				statsLoading={loading}
				stats={stats}
				items={[
					{ id: "scanning", label: t("subtabs.scanning"), count: statsData.scanning, icon: ScanLine },
					{ id: "preparing", label: t("subtabs.inProgress"), count: statsData.scanning + statsData.notStarted, icon: Clock },
				]}
				active={subtab}
				setActive={setSubtab}
			/>

			<AnimatePresence mode="wait">
				<motion.div key={subtab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.14 }}>
					{subtab === "scanning" && (
						<>
							<ScanWorkflowPanel pushOp={pushOp} onOpenPanel={() => setPanelOpen(true)} jumpToOrder={jumpToOrder} fetchStats={fetchStats} updateStatsAfterScanStart={updateStatsAfterScanStart} />
							<OrdersSlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} activeOrderCode={null} onSelectOrder={(order) => { handlePrepareOrder(order); setPanelOpen(false); }} />
						</>
					)}
					{subtab === "preparing" && (
						<InProgressSubtab pushOp={pushOp} onPrepareOrder={handlePrepareOrder} resetToken={resetToken} fetchStats={fetchStats} />
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}


// ─────────────────────────────────────────────────────────────
// REJECT ORDER MODAL
// ─────────────────────────────────────────────────────────────
export function RejectOrderModal({ open, onClose, order, onConfirm }) {
	const t = useTranslations("warehouse.preparation");
	const [reason, setReason] = useState("");
	const [loading, setLoading] = useState(false);

	const presets = [t("reject.preset1"), t("reject.preset2"), t("reject.preset3"), t("reject.preset4")];

	const handleConfirm = async () => {
		if (!reason.trim()) return;
		setLoading(true);
		try {
			// Hit the new reject endpoint
			const res = await api.patch(`/orders/${order.id}/reject`, { notes: reason });

			if (res.status === 200 || res.status === 201) {
				toast.success(t("messages.orderRejected"));
				onConfirm(order.code, { status: "rejected", rejectReason: reason, notes: reason });
				setReason("");
				onClose();
			}
		} catch (error) {
			console.error("Error rejecting order", error);
			toast.error(error.response?.data?.message || t("messages.errorRejectingOrder"));
		} finally {
			setLoading(false);
		}
	};
	const handleClose = () => { if (!loading) { setReason(""); onClose(); } };
	if (!order) return null;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="!max-w-lg bg-white dark:bg-slate-900 rounded-xl p-0 border-0 shadow-2xl" >
				{/* Header */}
				<div className="relative px-6 pt-6 pb-5 rounded-t-xl overflow-hidden" style={{ background: DS.dangerGradient }}>
					<div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
					<div className="absolute -bottom-4 -right-3 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
					<div className="relative flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className={cn("w-11 h-11 flex items-center justify-center bg-white/20", DS.radiusSm)}>
								<Ban className="text-white" size={22} />
							</div>
							<div>
								<p className="text-white/70 text-xs font-medium mb-0.5">{t("reject.subtitle")}</p>
								<h2 className="text-white text-lg font-black">{t("reject.title")}</h2>
							</div>
						</div>
						<HeaderIconBtn onClick={handleClose}><X size={15} className="text-white" /></HeaderIconBtn>
					</div>
					<div className="relative mt-3 flex items-center gap-2 flex-wrap">
						<HeaderBadge><Package size={11} />{order.code}</HeaderBadge>
						{order.customer && <HeaderBadge><User size={11} />{order.customer}</HeaderBadge>}
					</div>
				</div>

				{/* Body */}
				<div className="p-6 space-y-4">
					<div>
						<p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">{t("reject.presetsLabel")}</p>
						<div className="grid grid-cols-2 gap-2">
							{presets.map((preset, i) => (
								<button key={i} type="button" onClick={() => setReason(preset)}
									className={cn(
										"text-right text-xs font-semibold px-3 py-2.5 border transition-all duration-150",
										DS.radius,
										reason === preset
											? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400"
											: "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-200 hover:bg-red-50/40"
									)}>{preset}</button>
							))}
						</div>
					</div>
					<div>
						<p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">{t("reject.customLabel")}</p>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t("reject.placeholder")}
							className={cn("border-slate-200 dark:border-slate-700 resize-none text-sm min-h-[80px] focus:border-red-400 focus:ring-red-400/20", DS.radius)}

						/>
					</div>
					<div className={cn("flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800", DS.radius)}>
						<AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
						<p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{t("reject.warning")}</p>
					</div>
					<div className="flex justify-end gap-2 pt-1">
						<Button variant="outline" onClick={handleClose} className={DS.radiusSm}>{t("reject.cancel")}</Button>
						<motion.button
							onClick={handleConfirm} disabled={!reason.trim() || loading}
							whileHover={reason.trim() && !loading ? { scale: 1.02 } : {}}
							whileTap={reason.trim() && !loading ? { scale: 0.98 } : {}}
							className={cn("flex items-center gap-2 px-5 py-2.5 font-bold text-sm text-white transition-opacity", DS.radius, (!reason.trim() || loading) ? "opacity-40 cursor-not-allowed" : "")}
							style={{ background: DS.dangerGradient }}
						>
							{loading ? <Loader2 size={14} className="animate-spin" /> : <> <Ban size={13} /> {t("reject.confirm")} </>}
						</motion.button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─────────────────────────────────────────────────────────────
// ORDERS SLIDE PANEL
// ─────────────────────────────────────────────────────────────
function OrdersSlidePanel({ open, onClose, activeOrderCode, onSelectOrder }) {
	const t = useTranslations("warehouse.preparation");
	const locale = useLocale();
	const isRtl = locale !== "en";

	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchOrders = useCallback(async () => {
		try {
			setLoading(true);
			const res = await api.get('/orders', {
				params: { status: 'preparing,printed', limit: 50 }
			});
			setOrders(res.data?.records || []);
		} catch (error) {
			console.error("Failed to fetch sliding panel orders", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (open) fetchOrders();
	}, [open, fetchOrders]);

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
						className="fixed top-0 ltr:right-0 rtl:left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-[1000000] flex flex-col"

					>
						<PanelHeader
							icon={Layers}
							pretitle={t("panel.subtitle")}
							title={t("panel.title")}
							right={<HeaderIconBtn onClick={onClose}><X size={13} className="text-white" /></HeaderIconBtn>}
						>
							<HeaderBadge><Package size={11} />{orders.length} {t("panel.orders")}</HeaderBadge>
						</PanelHeader>

						<div className="flex-1 overflow-y-auto p-3 space-y-2">
							{loading ? (
								<div className="flex flex-col items-center justify-center py-12 space-y-3">
									<Loader2 className="animate-spin text-primary" size={24} />
									<p className="text-xs text-slate-400 font-medium tracking-wide">{t("panel.loading")}</p>
								</div>
							) : (
								orders.map((order) => {
									const total = (order.items || []).reduce((s, p) => s + p.quantity, 0);
									const scanned = (order.items || []).reduce((s, p) => s + (p.scannedQuantity || 0), 0);
									const pct = total === 0 ? 0 : Math.round((scanned / total) * 100);
									const isActive = activeOrderCode === order.orderNumber;
									return (
										<motion.div key={order.orderNumber} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
											onClick={() => onSelectOrder(order)}
											className={cn(
												"p-3 border cursor-pointer transition-all",
												DS.radius,
												isActive
													? "border-primary/40 bg-primary/5"
													: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
											)}
										>
											<div className="flex items-start justify-between mb-1.5">
												<span className="font-mono font-black text-sm" style={{ color: DS.primary }}>{order.orderNumber}</span>
												{pct === 100 && (
													<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
														{t("panel.done")}
													</span>
												)}
											</div>
											<p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 truncate">{order.customerName}</p>
											<div className="flex items-center gap-2">
												<div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
													<div
														className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-emerald-500" : "bg-primary")}
														style={{ width: `${pct}%` }}
													/>
												</div>
												<span className="text-[11px] font-mono font-semibold text-slate-400 tabular-nums">{scanned}/{total}</span>
											</div>
										</motion.div>
									);
								})
							)}
							{!loading && orders.length === 0 && (
								<div className="text-center py-12">
									<Package size={36} className="text-slate-300 mx-auto mb-2" />
									<p className="text-slate-400 text-sm">{t("panel.empty")}</p>
								</div>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

// ─────────────────────────────────────────────────────────────
// SCANNED ORDER TABLE
// ─────────────────────────────────────────────────────────────
function ScannedOrderTable({ order, localProducts, justScanned }) {
	const t = useTranslations("warehouse.preparation");

	const totalScanned = localProducts.reduce((s, p) => s + (p.scannedQuantity || 0), 0);
	const totalQty = localProducts.reduce((s, p) => s + p.quantity, 0);
	const pct = totalQty === 0 ? 0 : Math.round((totalScanned / totalQty) * 100);
	const isAllDone = pct === 100 && totalQty > 0;

	const [showBurst, setShowBurst] = useState(false);
	const prevPct = useRef(pct);
	useEffect(() => {
		if (pct === 100 && prevPct.current < 100) { setShowBurst(true); setTimeout(() => setShowBurst(false), 1000); }
		prevPct.current = pct;
	}, [pct]);

	const [copiedSku, setCopiedSku] = useState(null);
	const handleCopySku = (sku) => {
		navigator.clipboard?.writeText(sku).catch(() => { });
		setCopiedSku(sku); setTimeout(() => setCopiedSku(null), 1400);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			className={cn(
				"border overflow-hidden transition-all duration-500",
				DS.radiusXl,
				isAllDone
					? "border-emerald-300/60 dark:border-emerald-700/40 shadow-emerald-50 dark:shadow-emerald-900/10"
					: "border-slate-200 dark:border-slate-700",
				DS.shadow
			)}
		>
			{/* Table header */}
			<div
				className="relative overflow-hidden px-4 py-3 border-b border-slate-100 dark:border-slate-700/60"
				style={{
					background: isAllDone ? DS.successCardGradient : DS.cardGradient,
					...DS.scanline,
				}}
			>
				<AnimatePresence>
					{showBurst && (
						<motion.div key="sweep"
							initial={{ x: "-100%", opacity: 0.6 }} animate={{ x: "100%", opacity: 0 }} transition={{ duration: 0.8 }}
							className="absolute inset-0 pointer-events-none"
							style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.22), transparent)" }}
						/>
					)}
				</AnimatePresence>

				<div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
					{/* Arc ring */}
					<div className="relative w-11 h-11 flex-shrink-0">
						<ArcRing
							pct={pct}
							color={isAllDone ? DS.success : DS.primary}
							trackColor={isAllDone ? "rgba(52,211,153,0.2)" : "rgba(203,213,225,0.5)"}
						/>
						<div className="absolute inset-0 flex items-center justify-center">
							<AnimatePresence mode="wait">
								<motion.span key={pct} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
									className="text-[9px] font-black tabular-nums" style={{ color: isAllDone ? DS.success : DS.primary }}>
									{pct}%
								</motion.span>
							</AnimatePresence>
						</div>
					</div>

					<div className="min-w-0">
						<p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("table.orderNumber")}</p>
						<p className="font-mono font-black text-sm" style={{ color: DS.primary }}>{order.orderNumber}</p>
					</div>
					<div className="hidden sm:block min-w-0">
						<p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("modal.trackingCode")}</p>
						<p className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{order.trackingNumber || "—"}</p>
					</div>
					<div className="hidden md:block min-w-0">
						<p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{t("table.customer")}</p>
						<p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{order.customerName}</p>
					</div>
					{order.shippingCompany?.name && <CarrierPill carrier={order.shippingCompany.name} />}

					<div className="ms-auto flex-shrink-0">
						<motion.div key={totalScanned} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}
							className={cn(
								"flex items-center gap-1.5 px-3 py-1 border text-xs font-black tabular-nums transition-colors duration-300",
								DS.radius,
								isAllDone
									? "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400"
									: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
							)}
						>
							{isAllDone
								? <CheckCircle2 size={11} className="text-emerald-500" />
								: <ScanLine size={11} style={{ color: DS.primary }} />
							}
							{totalScanned}<span className="text-slate-300 dark:text-slate-600 font-normal">/</span>{totalQty}
						</motion.div>
					</div>
				</div>
			</div>

			{/* Products table */}
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/30">
							{["#", t("table.productName"), "SKU", t("table.shelf"), t("table.qty"), t("table.status")].map((h, i) => (
								<th key={i} className={cn(
									"py-2 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.07em]",
									i === 0 ? "w-8 text-right" : i >= 4 ? "text-center" : "text-right"
								)}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{localProducts.map((p, i) => {
							const scanned = p.scannedQuantity || 0;
							const total = p.quantity;
							const done = scanned >= total;
							const isJust = justScanned === p?.variant?.sku;
							const pct2 = total === 0 ? 0 : Math.round((scanned / total) * 100);
							const isCopied = copiedSku === p?.variant?.sku;

							return (
								<motion.tr key={p?.variant?.sku}
									initial={{ opacity: 0, x: 6 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ opacity: { delay: i * 0.04 }, x: { delay: i * 0.04 } }}
									className={cn(
										"border-b border-slate-50 dark:border-slate-700/20 transition-colors duration-200",
										done && "bg-emerald-50/50 dark:bg-emerald-950/10",
										isJust && !done && "bg-primary/5"
									)}
								>
									{/* Index */}
									<td className="px-4 py-3">
										<div className={cn("w-6 h-6 flex items-center justify-center text-[10px] font-black", DS.radiusSm)}
											style={{ backgroundColor: done ? "rgba(52,211,153,0.15)" : DS.primary + "15", color: done ? DS.success : DS.primary }}>
											{i + 1}
										</div>
									</td>

									{/* Product name */}
									<td className="px-4 py-2.5">
										<div className="flex items-center gap-3">
											<div className="relative flex-shrink-0">
												<div className={cn(
													"w-9 h-9 flex items-center justify-center border overflow-hidden transition-all duration-300",
													DS.radius,
													done ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30"
														: isJust ? "border-primary/40 bg-primary/5"
															: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
												)}>
													{p.image
														? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
														: <Package size={14} className={done ? "text-emerald-400" : isJust ? "text-primary" : "text-slate-300"} />
													}
												</div>
												<AnimatePresence>
													{done && (
														<motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
															className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
															<CheckCircle2 size={8} className="text-white" strokeWidth={3} />
														</motion.div>
													)}
												</AnimatePresence>
												<AnimatePresence>
													{isJust && (
														<motion.div initial={{ scale: 0.8, opacity: 0.8 }} animate={{ scale: 1.6, opacity: 0 }}
															exit={{ opacity: 0 }} transition={{ duration: 0.55 }}
															className={cn("absolute inset-0 border-2 border-primary", DS.radius)} />
													)}
												</AnimatePresence>
											</div>
											<span className={cn("font-semibold text-sm truncate max-w-[160px] transition-colors duration-300",
												done ? "text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-100"
											)}>{p.name}</span>
										</div>
									</td>

									{/* SKU */}
									<td className="px-4 py-3">
										<motion.button type="button" onClick={() => handleCopySku(p?.variant?.sku)}
											whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
											className={cn("inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 font-bold cursor-pointer", DS.radiusSm)}
											style={{ backgroundColor: DS.accent + "14", color: DS.accent }}>
											{isCopied ? (
												<motion.span key="copied" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-emerald-600">
													<CheckCircle2 size={9} /> {t("common.copied")}
												</motion.span>
											) : (
												<motion.span key="sku" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{p?.variant?.sku}</motion.span>
											)}
										</motion.button>
									</td>

									{/* Shelf */}
									<td className="px-4 py-3">
										{p.variant?.shelfLocation || p.shelfLocation ? (
											<span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5", DS.radiusSm)}>
												<MapPin size={9} className="text-slate-400 flex-shrink-0" />{p.variant?.shelfLocation || p.shelfLocation}
											</span>
										) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
									</td>

									{/* Qty ring */}
									<td className="px-4 py-2.5">
										<div className="flex items-center justify-center gap-2">
											<div className="relative w-8 h-8">
												<ArcRing pct={pct2} size={32} stroke={2.5} color={done ? DS.success : DS.primary} trackColor={done ? "rgba(52,211,153,0.2)" : "rgba(203,213,225,0.4)"} />
												<div className="absolute inset-0 flex items-center justify-center">
													<span className="text-[9px] font-black tabular-nums" style={{ color: done ? DS.success : DS.primary }}>{scanned}</span>
												</div>
											</div>
											<div className="flex flex-col items-start leading-none gap-0.5">
												<span className="text-[10px] font-black text-slate-700 dark:text-slate-200 tabular-nums">{scanned}</span>
												<div className="w-3.5 h-px bg-slate-300 dark:bg-slate-600" />
												<span className="text-[10px] font-semibold text-slate-400 tabular-nums">{total}</span>
											</div>
										</div>
									</td>

									{/* Status */}
									<td className="px-4 py-3 text-center">
										<AnimatePresence mode="wait">
											{done ? (
												<motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
													transition={{ type: "spring", stiffness: 500, damping: 22 }}
													className={cn("inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1", DS.radius)}>
													<CheckCircle2 size={10} strokeWidth={2.5} />{t("scan.done")}
												</motion.span>
											) : isJust ? (
												<motion.span key="just" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
													className={cn("inline-flex items-center gap-1.5 text-[11px] font-black border px-2.5 py-1", DS.radius)}
													style={{ backgroundColor: DS.primary + "15", color: DS.primary, borderColor: DS.primary + "30" }}>
													<ScanLine size={10} strokeWidth={2.5} />{t("scan.scanned")}
												</motion.span>
											) : (
												<motion.span key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
													className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1", DS.radius)}>
													<motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
														className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
													{t("scan.waiting")}
												</motion.span>
											)}
										</AnimatePresence>
									</td>
								</motion.tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Completion footer */}
			<AnimatePresence>
				{isAllDone && (
					<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
						<div className="relative px-4 py-3 flex items-center justify-center gap-2 overflow-hidden"
							style={{ background: "linear-gradient(90deg, #f0fdf4, #dcfce7, #f0fdf4)" }}>
							<motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
								className="absolute inset-0 pointer-events-none"
								style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.15), transparent)" }} />
							<CheckCircle2 size={14} className="text-emerald-500 relative z-10" />
							<span className="text-sm font-black text-emerald-700 dark:text-emerald-400 relative z-10" >
								{t("scan.orderComplete", { code: order.orderNumber })}
							</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────
// SCAN INPUT BAR
// ─────────────────────────────────────────────────────────────
export function ScanInputBar({ inputRef, value, onChange, onScan, disabled, isSuccess, isError, placeholder }) {
	const t = useTranslations("warehouse.preparation");
	const [isFocused, setIsFocused] = useState(false);
	const [errorFlash, setErrorFlash] = useState(false);
	const prevIsError = useRef(isError);

	useEffect(() => {
		if (isError && !prevIsError.current) { setErrorFlash(true); setTimeout(() => setErrorFlash(false), 500); }
		prevIsError.current = isError;
	}, [isError]);

	const handleScan = useCallback(() => {
		if (disabled || !value?.trim()) return;
		onScan();
	}, [disabled, value, onScan]);

	const isActive = isFocused || !!value;
	const hasContent = !!value?.trim();
	const stateColor = isSuccess ? DS.success : isError ? DS.danger : DS.primary;

	const cornerClass = cn(
		"rounded-full transition-colors duration-200",
		isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : isActive ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
	);

	return (
		<motion.div
			animate={errorFlash ? { x: [0, -5, 6, -4, 2, 0] } : { x: 0 }}
			transition={{ duration: 0.35 }}
			className="relative"
		>
			{/* Corner brackets */}
			{[
				"absolute -top-[3px] -left-[3px]",
				"absolute -top-[3px] -right-[3px]",
				"absolute -bottom-[3px] -left-[3px]",
				"absolute -bottom-[3px] -right-[3px]",
			].map((pos, idx) => (
				<motion.div key={idx} animate={{ opacity: isActive ? 1 : 0.25, scale: isActive ? 1 : 0.9 }} transition={{ duration: 0.2 }}
					className={cn(pos, "w-3 h-3 pointer-events-none z-20")}>
					<div className={cn("absolute w-full h-[2px]", cornerClass, idx < 2 ? "top-0" : "bottom-0")} />
					<div className={cn("absolute h-full w-[2px]", cornerClass, idx % 2 === 0 ? "left-0" : "right-0")} />
				</motion.div>
			))}

			<div className={cn(
				"relative flex items-center border transition-all duration-200 overflow-hidden",
				DS.radius,
				disabled && "opacity-50 pointer-events-none",
				isSuccess && "border-emerald-500 bg-background shadow-[0_0_0_3px_rgba(16,185,129,0.10)]",
				isError && "border-red-500 bg-background shadow-[0_0_0_3px_rgba(239,68,68,0.10)]",
				!isSuccess && !isError && !isFocused && "border-border bg-background/60",
				!isSuccess && !isError && isFocused && "border-primary/60 bg-background shadow-[0_0_0_3px_rgba(255,139,0,0.08)]",
			)} style={{ height: 46 }}>

				<AnimatePresence>
					{isSuccess && (
						<motion.div key="sweep" initial={{ x: "-100%", opacity: 0.7 }} animate={{ x: "100%", opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
							className="absolute inset-0 pointer-events-none z-0"
							style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.16), transparent)" }} />
					)}
					{errorFlash && (
						<motion.div key="errflash" initial={{ opacity: 0.15 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }}
							className={cn("absolute inset-0 bg-red-400 pointer-events-none z-0", DS.radius)} />
					)}
					{hasContent && !isSuccess && !isError && (
						<motion.div key="beam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
							className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
							<motion.div animate={{ left: ["-4%", "104%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 0.4 }}
								className="absolute inset-y-0 w-[2px]"
								style={{ background: "linear-gradient(180deg, transparent 0%, rgba(255,139,0,0.0) 15%, rgba(255,139,0,0.5) 45%, rgba(255,187,0,0.65) 50%, rgba(255,139,0,0.5) 55%, transparent 85%)", filter: "blur(0.8px)" }} />
						</motion.div>
					)}
				</AnimatePresence>

				<div className="ps-3 flex-shrink-0 z-10">
					<ScanLine size={15} className={cn("transition-colors duration-200",
						isSuccess ? "text-emerald-500" : isError ? "text-red-500" : isFocused ? "text-primary" : "text-muted-foreground/80")} />
				</div>
				<div className="relative flex-shrink-0 mx-2.5 z-10">
					<div className="w-px h-4 bg-border/40" />
					<motion.div
						animate={isSuccess ? { backgroundColor: DS.success, scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
							: isError ? { backgroundColor: DS.danger, scale: [1, 1.3, 1] }
								: isFocused ? { backgroundColor: DS.primary, opacity: [1, 0.4, 1] }
									: { backgroundColor: "#94a3b8" }}
						transition={isSuccess || isFocused ? { duration: 1.5, repeat: Infinity } : { duration: 0.3 }}
						className="absolute -top-[8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
					/>
				</div>

				<input
					ref={inputRef} value={value} onChange={onChange}
					onKeyDown={e => { if (e.key === "Enter") handleScan(); }}
					onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
					placeholder={placeholder} autoFocus disabled={disabled}
					autoComplete="off" autoCorrect="off" spellCheck={false}
					className="relative z-10 flex-1 h-full bg-transparent border-none !outline-none focus:ring-0 text-sm font-semibold text-foreground placeholder:text-muted-foreground/80px-1"
				/>

				<AnimatePresence>
					{value && (
						<motion.button key="clear" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }}
							type="button" onClick={() => { onChange({ target: { value: "" } }); inputRef?.current?.focus(); }}
							className="relative z-10 flex-shrink-0 mx-1.5 w-[18px] h-[18px] rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
							<X size={9} className="text-slate-500" />
						</motion.button>
					)}
				</AnimatePresence>

				<div className="pe-2 flex-shrink-0 z-10">
					<motion.button type="button" onClick={handleScan} disabled={disabled}
						whileHover={!disabled ? { scale: 1.03 } : {}} whileTap={!disabled ? { scale: 0.95 } : {}}
						className={cn("relative h-8 px-3.5 text-white text-xs font-black flex items-center gap-1.5 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200", DS.radius)}
						style={{
							background: isSuccess ? DS.successGradient : isError ? DS.dangerGradient : DS.headerGradient,
							boxShadow: `0 2px 10px -2px ${isSuccess ? "rgba(16,185,129,0.45)" : isError ? "rgba(239,68,68,0.45)" : "rgba(255,139,0,0.35)"}`,
						}}>
						<span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg pointer-events-none" />
						<motion.span key={isSuccess ? "check" : isError ? "x" : "scan"} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="flex">
							{isSuccess ? <CheckCircle2 size={11} strokeWidth={2.5} /> : isError ? <X size={11} strokeWidth={2.5} /> : <ScanLine size={11} strokeWidth={2.5} />}
						</motion.span>
						<motion.span key={isSuccess ? "done" : isError ? "err" : "lbl"} initial={{ opacity: 0, x: 3 }} animate={{ opacity: 1, x: 0 }} className="text-[11px]">
							{isSuccess ? t("scan.done") : isError ? t("scan.retry") : t("scan.scanBtn")}
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
export function ScanLogBoxes({ successCount, errorCount }) {
	const t = useTranslations("warehouse.preparation");
	const total = successCount + errorCount;
	const successPct = total > 0 ? successCount / total : 0;

	const prevErrorRef = useRef(errorCount);
	const [shaking, setShaking] = useState(false);
	useEffect(() => {
		if (errorCount > prevErrorRef.current) { setShaking(true); setTimeout(() => setShaking(false), 550); }
		prevErrorRef.current = errorCount;
	}, [errorCount]);

	const cardBase = cn("relative overflow-hidden border p-4 transition-all duration-300", DS.radiusXl);

	return (
		<div className="grid grid-cols-2 gap-3">
			{/* Success */}
			<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
				className={cn(cardBase, "border-emerald-200/70 dark:border-emerald-700/35")}
				style={{ background: DS.successCardGradient, ...DS.scanline }}>
				<motion.div key={`s${successCount}`} initial={{ x: "-110%" }} animate={{ x: "110%" }} transition={{ duration: 0.85, ease: "easeInOut" }}
					className="absolute inset-y-0 w-1/3 pointer-events-none z-[1]"
					style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />
				<div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full bg-emerald-300/15 dark:bg-emerald-500/10" />
				<div className="relative z-10 flex items-center gap-3">
					<div className="relative w-[52px] h-[52px] flex-shrink-0">
						<ArcRing pct={successPct * 100} color="#16a34a" trackColor="rgba(134,239,172,0.3)" />
						<div className=" absolute inset-0 flex items-center justify-center">
							<CheckCircle2 size={16} className="text-emerald-600" />
						</div>
					</div>
					<div className="flex-1 min-w-0" >
						<p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-emerald-600/60 mb-1 leading-none">{t("scan.scannedOrders")}</p>
						<AnimatePresence mode="wait">
							<motion.span key={successCount} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
								transition={{ type: "spring", stiffness: 480, damping: 26 }}
								className="block text-[2.4rem] font-black tabular-nums leading-none text-emerald-700 dark:text-emerald-400">
								{successCount}
							</motion.span>
						</AnimatePresence>
					</div>
				</div>
			</motion.div>

			{/* Error */}
			<motion.div initial={{ opacity: 0, y: 8 }}
				animate={shaking ? { opacity: 1, x: [0, -5, 6, -4, 2, 0], y: 0 } : { opacity: 1, x: 0, y: 0 }}
				transition={shaking ? { duration: 0.4 } : { delay: 0.08 }}
				className={cn(cardBase, errorCount > 0 ? "border-red-200/70 dark:border-red-700/35" : "border-slate-200/60 dark:border-slate-700/35")}
				style={{ background: errorCount > 0 ? "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)" : DS.cardGradient, ...DS.scanline }}>
				<AnimatePresence>
					{shaking && <motion.div initial={{ opacity: 0.16 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
						className={cn("absolute inset-0 bg-red-400 pointer-events-none z-20", DS.radiusXl)} />}
				</AnimatePresence>
				<div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full transition-colors duration-300"
					style={{ background: errorCount > 0 ? "rgba(252,165,165,0.18)" : "rgba(226,232,240,0.18)" }} />
				<div className="relative z-10 flex items-center gap-3">
					<div className="relative w-[52px] h-[52px] flex-shrink-0">
						<AnimatePresence>
							{errorCount > 0 && (
								<motion.div initial={{ opacity: 0 }} animate={{ opacity: [0.35, 0, 0.35], scale: [1, 1.25, 1] }}
									exit={{ opacity: 0 }} transition={{ duration: 1.8, repeat: Infinity }}
									className="absolute inset-0 rounded-full border-2 border-red-400/45" />
							)}
						</AnimatePresence>
						<div className="absolute inset-0 flex items-center justify-center">
							<Ban size={16} className={errorCount > 0 ? "text-red-600" : "text-slate-300"} />
						</div>
					</div>
					<div className="flex-1 min-w-0" >
						<p className={cn("text-[10px] font-extrabold uppercase tracking-[0.1em] mb-1 leading-none transition-colors duration-300",
							errorCount > 0 ? "text-red-600/60" : "text-slate-400/65")}>{t("scan.failedScans")}</p>
						<AnimatePresence mode="wait">
							<motion.span key={errorCount} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
								transition={{ type: "spring", stiffness: 480, damping: 26 }}
								className={cn("block text-[2.4rem] font-black tabular-nums leading-none transition-colors duration-300",
									errorCount > 0 ? "text-red-700 dark:text-red-400" : "text-slate-300 dark:text-slate-600")}>
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
// SCAN WORKFLOW PANEL
// ─────────────────────────────────────────────────────────────
function ScanWorkflowPanel({ pushOp, onOpenPanel, jumpToOrder, fetchStats, updateStatsAfterScanStart }) {
	const t = useTranslations("warehouse.preparation");

	const [scanStep, setScanStep] = useState("order");
	const [scanValue, setScanValue] = useState("");
	const [activeOrder, setActiveOrder] = useState(null);
	const [localProducts, setLocalProducts] = useState([]);
	const [feedback, setFeedback] = useState(null);
	const [scanState, setScanState] = useState("idle");
	const [isFetchingOrder, setIsFetchingOrder] = useState(false);
	const [successCount, setSuccessCount] = useState(0);
	const [errorCount, setErrorCount] = useState(0);
	const [justScanned, setJustScanned] = useState(null);
	const [soundEnabled, setSoundEnabled] = useState(true);
	const scanInputRef = useRef(null);
	const showFeedback = useCallback((type, msg) => {
		setFeedback({ type, msg }); setScanState(type);
		setTimeout(() => { setFeedback(null); setScanState("idle"); }, 2200);
	}, []);

	const fetchActiveOrder = useCallback(async (idOrCode) => {
		try {
			setIsFetchingOrder(true);
			const res = await api.get(`/orders/${idOrCode}`);
			const order = res.data;
			if (order) {
				setActiveOrder(order);
				setLocalProducts((order.items || []).map((p) => ({
					...p,
					sku: p.variant?.sku || p?.variant?.sku,
					name: p.variant?.product?.name || p.name,
					scannedQuantity: p.scannedQuantity || 0,
					quantity: p.quantity
				})));
				setScanStep("items");
				setScanValue("");
				setSuccessCount(0);
				setErrorCount(order.failedScanCounts?.preparation || 0);
				if (soundEnabled) playBeep("success");
				showFeedback("success", t("scan.orderFound", { code: order.orderNumber }));
			}
		} catch (error) {
			if (soundEnabled) playBeep("error");
			showFeedback("error", t("scan.orderNotFound"));
			setScanValue("");
		} finally {
			setIsFetchingOrder(false);
		}
	}, [soundEnabled, showFeedback, t]);

	useEffect(() => {
		if (!jumpToOrder) return;
		fetchActiveOrder(jumpToOrder.id);
	}, [jumpToOrder, fetchActiveOrder]);

	useEffect(() => { scanInputRef.current?.focus(); }, [scanStep, activeOrder]);


	const resetCurrentOrder = useCallback(() => {
		setScanStep("order"); setScanValue(""); setActiveOrder(null); setLocalProducts([]); setJustScanned(null);
		setTimeout(() => scanInputRef.current?.focus(), 100);
	}, []);

	const handleScan = useCallback(async () => {
		const val = scanValue.trim();
		if (!val) return;

		if (scanStep === "order") {
			await fetchActiveOrder(val);
		} else {
			const productIndex = localProducts.findIndex((p) => p?.variant?.sku === val || p.barcode === val);
			const product = localProducts[productIndex];
			// if (productIndex === -1) {
			// 	if (soundEnabled) playBeep("error");
			// 	setErrorCount((c) => c + 1);
			// 	showFeedback("error", t("scan.barcodeNotFound", { val }));
			// 	setScanValue("");
			// 	return;
			// }

			// const product = localProducts[productIndex];
			// if (product.scannedQuantity >= product.quantity) {
			// 	if (soundEnabled) playBeep("error");
			// 	showFeedback("error", t("scan.alreadyScanned", { name: product.name }));
			// 	setScanValue("");
			// 	return;
			// }

			try {
				const res = await api.post(`/orders/${activeOrder.id}/scan-preparation/${val}`);
				const { scanned, success, message, total, isOrderComplete } = res.data;

				if (!success) {
					if (soundEnabled) playBeep("error");
					setErrorCount((c) => c + 1);
					showFeedback("error", message || t("scan.errorScanning"));
					setScanValue("");
					return;
				}
				// Update stats if it was printed (first scan for this order)
				if (activeOrder.status?.code === 'printed') {
					updateStatsAfterScanStart?.();
					// update local activeOrder status to prevent double stat update
					setActiveOrder(prev => ({
						...prev,
						status: {
							...prev.status,
							code: 'preparing' // Specifically updating the code property
						}
					}));
				}

				const updated = localProducts.map((p, i) =>
					i === productIndex ? { ...p, scannedQuantity: scanned } : p
				);

				setLocalProducts(updated);
				setJustScanned(product.sku);
				setTimeout(() => setJustScanned(null), 900);
				setSuccessCount((c) => c + 1);

				if (soundEnabled) playBeep("success");
				showFeedback("success", t("scan.itemScanned", { name: product.name }));
				setScanValue("");

				if (isOrderComplete) {
					const now = new Date().toISOString().slice(0, 16).replace("T", " ");
					pushOp({
						id: `OP-${Date.now()}`,
						operationType: "PREPARE_ORDER",
						orderCode: activeOrder.orderNumber,
						carrier: activeOrder.shippingCompany?.name || "-",
						employee: "System",
						result: "SUCCESS",
						details: t("scan.orderPreparedLog"),
						createdAt: now
					});
					setTimeout(() => {
						showFeedback("success", t("scan.orderComplete", { code: activeOrder.orderNumber }));
						fetchStats?.();
						resetCurrentOrder();
					}, 900);
				}
			} catch (error) {
				console.error(error)
				if (soundEnabled) playBeep("error");
				setErrorCount((c) => c + 1);
				showFeedback("error", error.response?.data?.message || t("scan.errorScanning"));
				setScanValue("");
			}
		}
	}, [scanValue, scanStep, localProducts, activeOrder, soundEnabled, fetchActiveOrder, updateStatsAfterScanStart, pushOp, showFeedback, resetCurrentOrder, fetchStats, t]);

	const isItemsMode = scanStep === "items";

	return (
		<div className="space-y-4" >
			<Panel >
				{/* Header */}
				<PanelHeader
					icon={ScanLine}
					pretitle={!isItemsMode ? t("scan.step1of2") : `${t("scan.orderLabel")}: ${activeOrder?.orderNumber}`}
					title={!isItemsMode ? t("scan.scanOrderTitle") : t("scan.scanItemsTitle")}
					right={
						<>
							<HeaderIconBtn onClick={() => setSoundEnabled(v => !v)}>
								{soundEnabled ? <Volume2 size={13} className="text-white" /> : <VolumeX size={13} className="text-white/60" />}
							</HeaderIconBtn>
							<HeaderBadge onClick={onOpenPanel}><Layers size={12} />{t("scan.ordersBtn")}</HeaderBadge>
							{isItemsMode && <HeaderBadge onClick={resetCurrentOrder}><X size={12} />{t("scan.cancelBtn")}</HeaderBadge>}
						</>
					}
				>
					{/* Step dots */}
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-white" />
						<div className={cn("h-px flex-1 max-w-[20px] rounded-full transition-all duration-500", isItemsMode ? "bg-white" : "bg-white/30")} />
						<div className={cn("w-2 h-2 rounded-full transition-all duration-500", isItemsMode ? "bg-white" : "bg-white/30")} />
					</div>
				</PanelHeader>

				<div className=" px-4 pt-8 py-5 space-y-4">
					<div className="relative">
						<ScanInputBar
							inputRef={scanInputRef} value={scanValue} onChange={(e) => setScanValue(e.target.value)}
							onScan={handleScan} isSuccess={scanState === "success"} isError={scanState === "error"}
							placeholder={!isItemsMode ? t("scan.scanOrderPlaceholder") : t("scan.scanItemsPlaceholder", { code: activeOrder?.orderNumber })}
							disabled={isFetchingOrder}
						/>
						{isFetchingOrder && (
							<div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-xl z-10">
								<Loader2 className="animate-spin text-primary" size={24} />
							</div>
						)}
					</div>

					<AnimatePresence>
						{feedback && (
							<motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18 }}
								className={cn("flex items-center gap-3 px-4 py-2.5 border text-sm font-semibold", DS.radius,
									feedback.type === "success"
										? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
										: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300"
								)}>
								{feedback.type === "success" ? <CheckCircle2 size={14} className="flex-shrink-0" /> : <AlertCircle size={14} className="flex-shrink-0" />}
								{feedback.msg}
							</motion.div>
						)}
					</AnimatePresence>

					<ScanLogBoxes successCount={successCount} errorCount={errorCount} />

					{isItemsMode && activeOrder && (
						<ScannedOrderTable order={activeOrder} localProducts={localProducts} justScanned={justScanned} />
					)}

					{!isItemsMode && (
						<div className="flex flex-col items-center justify-center py-10 text-center">
							<motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
								className={cn("w-14 h-14 flex items-center justify-center mb-4", DS.radius)}
								style={{ background: DS.primary + "12", border: `1px dashed ${DS.primary}35` }}>
								<ScanLine size={26} style={{ color: DS.primary }} />
							</motion.div>
							<p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">{t("scan.readyTitle")}</p>
							<p className="text-sm text-slate-400">{t("scan.readySubtitle")}</p>
						</div>
					)}
				</div>
			</Panel>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// IN-PROGRESS SUBTAB
// ─────────────────────────────────────────────────────────────
function InProgressSubtab({ updateOrder, pushOp, onPrepareOrder, resetToken, fetchStats }) {
	const tongoining = useTranslations("warehouse.outgoing");
	const t = useTranslations("warehouse.preparation");

	const [search, setSearch] = useState("");
	const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 350 })
	const [filters, setFilters] = useState({ store: "all", carrier: "all", productId: "all", date: "" });
	const [appliedFilters, setAppliedFilters] = useState({ store: "all", carrier: "all", productId: "all", date: "" });
	const [selectedOrders, setSelectedOrders] = useState([]);
	const [detailModal, setDetailModal] = useState(null);
	const [rejectModal, setRejectModal] = useState(null);

	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 12,
		records: [],
	});
	const [ordersLoading, setOrdersLoading] = useState(false);
	const [downloadingWrongLog, setDownloadingWrongLog] = useState({});
	const { handleExport, exportLoading } = useExport();

	const wrongLogLabels = {
		title: t("pdf.wrongLog.title"),
		printDate: t("pdf.wrongLog.printDate"),
		employee: t("pdf.wrongLog.employee"),
		totalAttempts: t("pdf.wrongLog.totalAttempts"),
		carrier: t("pdf.wrongLog.carrier"),
		date: t("pdf.wrongLog.date"),
		totalFailedAttempts: t("pdf.wrongLog.totalFailedAttempts"),
		attemptUnit: t("pdf.wrongLog.attemptUnit"),
		scannedCode: t("pdf.wrongLog.scannedCode"),
		orderNumber: t("pdf.wrongLog.orderNumber"),
		userName: t("pdf.wrongLog.employee"),
		failReason: t("pdf.wrongLog.failReason"),
		time: t("pdf.wrongLog.time"),
		orderInfo: t("pdf.wrongLog.orderInfo"),
		customer: t("pdf.wrongLog.customer"),
		city: t("pdf.wrongLog.city"),
		phone: t("pdf.wrongLog.phone"),
		printAlertText: t("pdf.wrongLog.printAlertText"),
		system: t("pdf.wrongLog.system"),
		reasons: {
			SKU_NOT_IN_ORDER: tongoining("scan.reasons.SKU_NOT_IN_ORDER"),
			ALREADY_FULLY_SCANNED: tongoining("scan.reasons.ALREADY_FULLY_SCANNED"),
			INVALID_STATUS: tongoining("scan.reasons.INVALID_STATUS"),
			OTHER: tongoining("scan.reasons.OTHER"),
		}
	};

	const handleDownloadWrongLog = async (row) => {
		setDownloadingWrongLog((p) => ({ ...p, [row.id]: true }));
		try {
			const res = await api.get(`/orders/${row.id}/scan-logs/PREPARATION`);
			const logsData = res.data || [];

			const logs = logsData.map(l => ({
				sku: l.sku || "-",
				reason: l.reason || "-",
				orderNumber: l.order?.orderNumber || row.orderNumber || "-",
				userName: l.user?.name || "-",
				time: new Date(l.createdAt).toLocaleTimeString()
			}));

			openPrintWindow(
				buildWrongScanLogPDF(
					logs,
					row.shippingCompany?.name || "-",
					null,
					new Date().toLocaleString(),
					wrongLogLabels,
					row
				)
			);
		} catch (error) {
			console.error("Error downloading wrong log", error);
			toast.error(t("messages.errorDownloadingLogs") || "Error downloading logs");
		} finally {
			setDownloadingWrongLog((p) => ({ ...p, [row.id]: false }));
		}
	};

	const buildParams = useCallback((page = pager.current_page, per_page = pager.per_page) => {
		const params = {
			page,
			limit: per_page,
			status: 'preparing,printed',
		};

		if (debouncedSearch) params.search = debouncedSearch;
		if (appliedFilters.store !== "all") params.storeId = appliedFilters.store;
		if (appliedFilters.carrier !== "all") params.shippingCompanyId = appliedFilters.carrier;
		if (appliedFilters.date) params.startDate = appliedFilters.date;
		if (appliedFilters.productId !== "all") params.productId = appliedFilters.productId;

		return params;
	}, [pager.current_page, pager.per_page, debouncedSearch, appliedFilters]);

	const fetchOrders = useCallback(async (page = pager.current_page, per_page = pager.per_page) => {
		try {
			setOrdersLoading(true);
			const params = buildParams(page, per_page);
			const res = await api.get('/orders', { params });
			const data = res.data || {};
			setPager({
				total_records: data.total_records || 0,
				current_page: data.current_page || page,
				per_page: data.per_page || per_page,
				records: Array.isArray(data.records) ? data.records : [],
			});
		} catch (e) {
			console.error('Error fetching orders', e);
		} finally {
			setOrdersLoading(false);
		}
	}, [buildParams, pager.current_page, pager.per_page]);

	useEffect(() => {
		fetchOrders(1, pager.per_page);
	}, [debouncedSearch, appliedFilters, resetToken, fetchOrders]);

	const handlePageChange = ({ page, per_page }) => {
		fetchOrders(page, per_page);
	};

	const applyFilters = () => {
		setAppliedFilters({ ...filters });
	};

	const onExport = async () => {
		const params = buildParams(1, 10000);
		delete params.page;
		delete params.limit;
		await handleExport({
			endpoint: "/orders/export",
			params,
			filename: `in_progress_orders_${Date.now()}.xlsx`,
		});
	};

	const toggleOrder = (orderNumber) => setSelectedOrders(prev => prev.includes(orderNumber) ? prev.filter(c => c !== orderNumber) : [...prev, orderNumber]);
	const selectAll = () => setSelectedOrders(selectedOrders.length === pager.records.length ? [] : pager.records.map((o) => o.orderNumber));

	const handleConfirmReject = useCallback((code, p) => {
		fetchOrders();
		fetchStats?.();
		const now = new Date().toISOString().slice(0, 16).replace("T", " ");
		pushOp({ id: `OP-${Date.now()}`, operationType: "REJECT_ORDER", orderCode: code, carrier: "-", employee: "System", result: "FAILED", details: p.notes || "Rejected", createdAt: now });
	}, [fetchStats, pushOp, fetchOrders]);

	const columns = useMemo(() => [
		// {
		// 	key: "select",
		// 	header: <div className="flex items-center justify-center"><Checkbox checked={pager.records.length > 0 && selectedOrders.length === pager.records.length} onCheckedChange={selectAll} /></div>,
		// 	className: "w-[48px]",
		// 	cell: (row) => <div className="flex items-center justify-center"><Checkbox checked={selectedOrders.includes(row.orderNumber)} onCheckedChange={() => toggleOrder(row.orderNumber)} /></div>,
		// },
		{ key: "code", header: t("table.orderNumber"), cell: (row) => <span className="font-mono font-black text-sm" style={{ color: DS.primary }}>{row.orderNumber}</span> },
		{ key: "customer", header: t("table.customer"), cell: (row) => <span className="font-semibold">{row.customerName}</span> },
		{ key: "phone", header: t("table.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm">{row.phoneNumber}</span> },
		{ key: "city", header: t("table.city") },
		{ key: "carrier", header: t("table.carrier"), cell: (row) => row.shippingCompany?.name ? <CarrierPill carrier={row.shippingCompany.name} /> : <span className="text-slate-400 text-sm italic">{t("unspecified")}</span> },
		{ key: "products", header: t("table.products"), cell: (row) => <span className={cn("bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-sm font-semibold", DS.radius)}>{row.items?.length || 0} {t("product")}</span> },
		{ key: "progress", header: t("table.scanProgress"), cell: (row) => <ScanProgress products={row.items || []} /> },
		{ key: "assignedEmployee", header: t("table.employee"), cell: (row) => row.assignments?.[0]?.employee?.name || "—" },
		{
			key: "actions", header: t("table.actions"),
			cell: (row) => (
				<ActionButtons row={row} actions={[
					{ icon: <Info />, tooltip: t("actions.details"), onClick: (r) => setDetailModal(r), variant: "purple", permission: "orders.read" },
					{ icon: <ScanLine />, tooltip: t("actions.continuePrepare"), onClick: (r) => onPrepareOrder?.(r), variant: "blue", permission: "warehouses.scan-preparation" },
					{
						icon: downloadingWrongLog[row.id] ? (
							<Loader2 size={13} className="animate-spin" />
						) : (
							<FileText size={13} />
						),
						tooltip: t("pdf.wrongLog.title"),
						onClick: (r) => handleDownloadWrongLog(r),
						variant: "red",
						disabled: !!downloadingWrongLog[row.id] || !row?.failedScanCounts?.preparation,
						permission: "orders.read",
					},
					{ icon: <Ban />, tooltip: t("actions.reject"), onClick: (r) => setRejectModal(r), variant: "red", permission: "order.update" },
				]} />
			),
		},
	], [pager.records, selectedOrders, t, onPrepareOrder]);

	const hasActiveFilters = appliedFilters.carrier !== "all" || appliedFilters.store !== "all" || !!appliedFilters.date || appliedFilters.productId !== "all";

	return (
		<div className="space-y-4">
			<Table
				searchValue={search} onSearchChange={setSearch} onSearch={applyFilters}
				labels={{ searchPlaceholder: t("searchPlaceholder"), filter: t("filter"), apply: t("apply"), total: t("total"), limit: t("limit"), emptyTitle: t("inProgress.emptyTitle"), emptySubtitle: "" }}
				actions={[{ key: "export", label: t("export"), icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />, color: "blue", onClick: onExport, disabled: exportLoading, permission: "orders.read" }]}
				hasActiveFilters={hasActiveFilters} onApplyFilters={applyFilters}
				filters={
					<>
						<ShippingCompanyFilter value={filters.carrier} onChange={(v) => setFilters(f => ({ ...f, carrier: v }))} />
						<StoreFilter value={filters.store} onChange={(v) => setFilters(f => ({ ...f, store: v }))} />
						<ProductFilter value={filters.productId} onChange={(v) => setFilters(f => ({ ...f, productId: v }))} />
						<FilterField label={t("table.date")}>
							<Input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl text-sm" />
						</FilterField>
					</>
				}
				columns={columns} data={pager.records} isLoading={ordersLoading}
				pagination={{ total_records: pager.total_records, current_page: pager.current_page, per_page: pager.per_page }}
				onPageChange={handlePageChange}
			/>
			<OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
			<RejectOrderModal open={!!rejectModal} onClose={() => setRejectModal(null)} order={rejectModal} onConfirm={handleConfirmReject} />
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// PREPARED SUBTAB
// ─────────────────────────────────────────────────────────────
function PreparedSubtab({ orders, setDistributionDialog, setSelectedOrdersGlobal, resetToken }) {
	const t = useTranslations("warehouse.preparation");
	const prepared = useMemo(() => orders.filter((o) => o.status === STATUS.PREPARED), [orders]);

	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState({ carrier: "all" });
	const [detailModal, setDetailModal] = useState(null);
	const [page, setPage] = useState({ current_page: 1, per_page: 12 });

	useEffect(() => { setSearch(""); setFilters({ carrier: "all" }); setDetailModal(null); setPage({ current_page: 1, per_page: 12 }); }, [resetToken]);

	const filtered = useMemo(() => {
		let base = prepared;
		const q = search.trim().toLowerCase();
		if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city, o.carrier].some((x) => String(x || "").toLowerCase().includes(q)));
		if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
		return base;
	}, [prepared, search, filters]);

	const columns = useMemo(() => [
		{ key: "code", header: t("table.orderNumber"), cell: (row) => <span className="font-mono font-black text-sm" style={{ color: DS.primary }}>{row.code}</span> },
		{ key: "customer", header: t("table.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
		{ key: "phone", header: t("table.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm">{row.phone}</span> },
		{ key: "city", header: t("table.city") },
		{ key: "carrier", header: t("table.carrier"), cell: (row) => row.carrier ? <CarrierPill carrier={row.carrier} /> : <span className="text-slate-400 text-sm italic">{t("unspecified")}</span> },
		{
			key: "products", header: t("table.products"),
			cell: (row) => (
				<div className="space-y-0.5">
					{row.products.map((p, i) => (
						<div key={i} className="text-xs text-slate-500">
							<span className={cn("font-mono bg-slate-100 dark:bg-slate-800 px-1", DS.radiusSm)}>{p?.variant?.sku}</span>{" "}{p.name} ×{p.scannedQuantity}
						</div>
					))}
				</div>
			),
		},
		{ key: "preparedAt", header: t("table.preparedAt"), cell: (row) => <span className="text-sm text-slate-500">{row.preparedAt || "—"}</span> },
		{ key: "assignedEmployee", header: t("table.employee") },
		{
			key: "actions", header: t("table.actions"),
			cell: (row) => (
				<ActionButtons row={row} actions={[
					{ icon: <Info />, tooltip: t("actions.details"), onClick: (r) => setDetailModal(r), variant: "purple" },
					{ icon: <Truck />, tooltip: t("actions.distribute"), onClick: (r) => { setSelectedOrdersGlobal?.([r.code]); setDistributionDialog?.(true); }, variant: "emerald" },
				]} />
			),
		},
	], [t, setDistributionDialog, setSelectedOrdersGlobal]);

	return (
		<div className="space-y-4">
			<Table
				searchValue={search} onSearchChange={setSearch} onSearch={applyFilters}
				labels={{ searchPlaceholder: t("searchPlaceholder"), filter: t("filter"), apply: t("apply"), total: t("total"), limit: t("limit"), emptyTitle: t("prepared.emptyTitle"), emptySubtitle: "" }}
				actions={[{ key: "export", label: t("export"), icon: <FileDown size={14} />, color: "blue", onClick: () => { } }]}
				hasActiveFilters={filters.carrier !== "all"} onApplyFilters={applyFilters}
				filters={
					<FilterField label={t("filters.carrier")}>
						<Select value={filters.carrier} onValueChange={(v) => setFilters(f => ({ ...f, carrier: v }))}>
							<SelectTrigger className={cn("h-10 border-border bg-background text-sm", DS.radiusSm)}><SelectValue placeholder={t("filters.allCarriers")} /></SelectTrigger>
							<SelectContent>{[{ value: "all", label: t("filters.allCarriers") }, ...CARRIERS.map((c) => ({ value: c, label: c }))].map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
						</Select>
					</FilterField>
				}
				columns={columns} data={filtered} isLoading={false}
				pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
				onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
			/>
			<OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
		</div>
	);
}
