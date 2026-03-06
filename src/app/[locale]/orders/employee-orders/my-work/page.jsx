"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Package, Phone, MapPin, Truck, Calendar, CheckCircle,
	Loader2, ArrowRight, ArrowLeft, Lock, AlertTriangle,
	ChevronLeft, ChevronRight, Zap, SkipForward, ShoppingBag,
	User, CreditCard, TrendingUp, Activity, RefreshCw, FileText, Tag,
	Clock, Landmark, Building2, BadgeCheck, Banknote, StickyNote,
	Mail, ExternalLink, Receipt, Star, Navigation,
	ChevronDown, Plus,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import api from "@/utils/api";
import { cn } from "@/utils/cn";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — single source of truth for the color system
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
	primary:   "#f97316",   // orange
	customer:  "#7c3aed",   // violet
	phone:     "#0369a1",   // sky
	money:     "#f97316",   // orange
	profit:    "#16a34a",   // green
	upsell:    "#7c3aed",   // violet
	notes:     "#0891b2",   // cyan
	history:   "#16a34a",   // green
	locked:    "#dc2626",   // red
	success:   "#16a34a",
	warning:   "#d97706",
	danger:    "#dc2626",
	info:      "#0369a1",
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
	<style>{`
		@keyframes ping       { 75%,100%{ transform:scale(2); opacity:0; } }
		@keyframes spin       { to { transform: rotate(360deg); } }
		@keyframes float      { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-6px); } }
		@keyframes orbit      { 0%{ transform:rotate(0deg) translateX(52px) rotate(0deg); } 100%{ transform:rotate(360deg) translateX(52px) rotate(-360deg); } }
		@keyframes orbit-rev  { 0%{ transform:rotate(0deg) translateX(38px) rotate(0deg); } 100%{ transform:rotate(-360deg) translateX(38px) rotate(360deg); } }
		@keyframes fade-up    { from{ opacity:0; transform:translateY(16px); } to{ opacity:1; transform:translateY(0); } }
		@keyframes shimmer    { 0%{ background-position:-600px 0; } 100%{ background-position:600px 0; } }
		@keyframes slide-in   { from{ opacity:0; transform:translateX(12px); } to{ opacity:1; transform:translateX(0); } }
		@keyframes bounce-x   { 0%,100%{ transform:translateX(0); } 50%{ transform:translateX(4px); } }

		.fade-up { animation: fade-up 0.45s cubic-bezier(0.16,1,0.3,1) both; }
		.slide-in { animation: slide-in 0.35s cubic-bezier(0.16,1,0.3,1) both; }

		.sk-bone {
			background: linear-gradient(
				90deg,
				var(--muted) 0px,
				color-mix(in oklab, var(--border) 60%, var(--card)) 200px,
				var(--muted) 400px
			);
			background-size: 600px 100%;
			animation: shimmer 1.6s ease-in-out infinite;
			border: 1px solid var(--border);
		}

		.status-btn-active { animation: ping 1.6s cubic-bezier(0,0,.2,1) infinite; }
		.chevron-open { transform: rotate(180deg); }
		.chevron-wrap { transition: transform 0.22s ease; }
		.bounce-arrow { animation: bounce-x 1.4s ease-in-out infinite; }
	`}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const fmtMoney = (n) =>
	new Intl.NumberFormat("ar-EG", {
		style: "currency", currency: "EGP", maximumFractionDigits: 0,
	}).format(n ?? 0);

const fmtDateTime = (d, locale = "ar-EG") =>
	d ? new Date(d).toLocaleString(locale, {
		year: "numeric", month: "short", day: "numeric",
		hour: "2-digit", minute: "2-digit",
	}) : "—";

// color helpers
const alpha = (hex, opacity) => {
	// Returns hex with opacity as inline style-compatible rgba
	const r = parseInt(hex.slice(1,3),16);
	const g = parseInt(hex.slice(3,5),16);
	const b = parseInt(hex.slice(5,7),16);
	return `rgba(${r},${g},${b},${opacity})`;
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedCounter({ value, delay = 0, plain = false }) {
	const str = String(value);
	const raw = parseFloat(str.replace(/[^0-9.]/g, ""));
	const prefix = str.match(/^[^0-9]*/)?.[0] || "";
	const suffix = str.replace(/^[^0-9]*[0-9,.]+/, "");
	const [display, setDisplay] = useState(0);
	const [started, setStarted] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setStarted(true), delay);
		return () => clearTimeout(t);
	}, [delay]);

	useEffect(() => {
		if (plain || !started || isNaN(raw)) return;
		let start;
		const dur = 800;
		const raf = (ts) => {
			if (!start) start = ts;
			const p = Math.min((ts - start) / dur, 1);
			const ease = 1 - Math.pow(1 - p, 3);
			setDisplay(Math.round(ease * raw));
			if (p < 1) requestAnimationFrame(raf);
			else setDisplay(raw);
		};
		requestAnimationFrame(raf);
	}, [started, raw, plain]);

	if (plain || isNaN(raw)) return <span>{value}</span>;
	return (
		<span className="tabular-nums">
			{prefix}{display.toLocaleString()}{suffix}
		</span>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCK COUNTDOWN
// ─────────────────────────────────────────────────────────────────────────────
function useLockCountdown(lockedUntil) {
	const [ms, setMs] = useState(() =>
		lockedUntil ? new Date(lockedUntil).getTime() - Date.now() : 0
	);
	useEffect(() => {
		if (!lockedUntil) return;
		const id = setInterval(
			() => setMs(new Date(lockedUntil).getTime() - Date.now()), 1000
		);
		return () => clearInterval(id);
	}, [lockedUntil]);
	if (ms <= 0) return null;
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	const s = Math.floor((ms % 60000) / 1000);
	return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

/** Colored dot + ALL-CAPS label */
function SectionLabel({ children, color = COLORS.primary }) {
	return (
		<div className="flex items-center gap-[6px]">
			<span className="inline-block shrink-0 rounded-full" style={{ width: 5, height: 5, background: color }} />
			<span className="text-[9px] font-bold tracking-[0.17em] uppercase" style={{ color: alpha(color, 0.75) }}>
				{children}
			</span>
		</div>
	);
}

/** Colored icon tile */
function IconTile({ icon: Icon, color, size = 32 }) {
	return (
		<div
			className="shrink-0 flex items-center justify-center rounded-[calc(var(--radius)-2px)]"
			style={{
				width: size, height: size,
				background: alpha(color, 0.1),
				border: `1px solid ${alpha(color, 0.22)}`,
			}}
		>
			<Icon size={size * 0.44} style={{ color }} />
		</div>
	);
}

/** Compact status/label pill */
function Pill({ children, color, size = "sm" }) {
	return (
		<span
			className={cn(
				"inline-flex items-center font-bold tracking-[0.06em] rounded-full whitespace-nowrap",
				size === "xs" ? "text-[9.5px] px-[8px] py-[2.5px]" : "text-[11px] px-[11px] py-[4px]"
			)}
			style={{
				background: alpha(color, 0.1),
				color,
				border: `1px solid ${alpha(color, 0.25)}`,
			}}
		>
			{children}
		</span>
	);
}

/** Pulsing live dot */
function LiveDot({ color }) {
	return (
		<span className="relative inline-flex shrink-0" style={{ width: 8, height: 8 }}>
			<span
				className="absolute inset-0 rounded-full"
				style={{ background: color, opacity: 0.45, animation: "ping 1.6s cubic-bezier(0,0,.2,1) infinite" }}
			/>
			<span
				className="relative rounded-full"
				style={{ width: 8, height: 8, background: color, boxShadow: `0 0 6px ${alpha(color, 0.7)}` }}
			/>
		</span>
	);
}

/** Card wrapper with optional top accent bar */
function Card({ children, className, accentColor, style }) {
	return (
		<div
			className={cn("bg-card !p-1 rounded-[var(--radius)] border border-border overflow-hidden", className)}
			style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.055)", ...style }}
		>
			 
			{children}
		</div>
	);
}

/** Collapsible section header trigger */
function CollapseTrigger({ open, onToggle, color, icon: Icon, eyebrow, title, subtitle, right }) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={cn(
				"w-full flex items-center justify-between px-[18px] py-[14px] bg-card cursor-pointer outline-none border-none",
				open && "border-b border-border"
			)}
		>
			<div className="flex items-center gap-[13px]">
				<motion.div
					className="shrink-0 flex items-center justify-center rounded-[var(--radius)] relative overflow-hidden"
					style={{
						width: 42, height: 42,
						background: alpha(color, 0.09),
						border: `1px solid ${alpha(color, 0.2)}`,
					}}
					whileHover={{ rotate: 8, scale: 1.06 }}
					transition={{ type: "spring", stiffness: 320, damping: 17 }}
				>
					<div
						className="absolute rounded-full pointer-events-none"
						style={{ top: -8, left: -8, width: 26, height: 26, background: alpha(color, 0.22), filter: "blur(8px)" }}
					/>
					<Icon size={16} className="relative" style={{ color }} />
				</motion.div>
				<div className="text-left">
					<div className="flex items-center gap-[5px] mb-[3px]">
						<span className="inline-block shrink-0 rounded-full" style={{ width: 4, height: 4, background: color }} />
						<span className="text-[9px] font-bold tracking-[0.17em] uppercase" style={{ color: alpha(color, 0.7) }}>
							{eyebrow}
						</span>
					</div>
					<div className="text-[14px] font-bold text-card-foreground leading-none tracking-[-0.01em]">
						{title}
					</div>
					{subtitle && (
						<div className="flex items-center gap-[5px] mt-[4px]">
							<span className="text-[11px] text-muted-foreground font-medium">{subtitle}</span>
						</div>
					)}
				</div>
			</div>
			<div className="flex items-center gap-[10px]">
				{right}
				<span className={cn("chevron-wrap flex items-center text-muted-foreground", open && "chevron-open")}>
					<ChevronDown size={14} />
				</span>
			</div>
		</button>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC TILE
// ─────────────────────────────────────────────────────────────────────────────
function MetricTile({ icon: Icon, label, value, color, delay = 0, plain = false }) {
	const [hov, setHov] = useState(false);

	return (
		<motion.div
			onHoverStart={() => setHov(true)}
			onHoverEnd={() => setHov(false)}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
			whileHover={{ y: -2 }}
			className="relative overflow-hidden rounded-[var(--radius)] bg-card"
			style={{
				height: 84,
				border: `1px solid ${hov ? alpha(color, 0.5) : "var(--border)"}`,
				boxShadow: hov ? `0 4px 18px ${alpha(color, 0.18)}, 0 1px 4px rgba(0,0,0,0.06)` : "0 1px 3px rgba(0,0,0,0.04)",
				transition: "border-color .2s, box-shadow .2s",
			}}
		>
			{/* Left accent bar */}
			<div
				className="absolute left-0 top-3 bottom-3 rounded-r-[3px]"
				style={{ width: 3, background: color, opacity: hov ? 1 : 0.4, transition: "opacity .25s" }}
			/>
			{/* Glow */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					opacity: hov ? 1 : 0,
					background: `radial-gradient(ellipse at 0% 50%, ${alpha(color, 0.08)}, transparent 65%)`,
					transition: "opacity .3s",
				}}
			/>
			<div className="relative flex items-center gap-3 h-full px-4 pl-[22px]">
				<motion.div
					animate={{ rotate: hov ? 7 : 0 }}
					transition={{ type: "spring", stiffness: 280 }}
					className="shrink-0 flex items-center justify-center rounded-[calc(var(--radius)-1px)]"
					style={{
						width: 40, height: 40,
						background: alpha(color, 0.1),
						border: `1px solid ${alpha(color, 0.22)}`,
						boxShadow: hov ? `0 0 12px ${alpha(color, 0.3)}` : "none",
						transition: "box-shadow .2s",
					}}
				>
					<Icon size={16} style={{ color }} />
				</motion.div>
				<div className="flex-1 min-w-0">
					<div
						className="text-[22px] font-semibold leading-none tracking-[-0.025em] truncate"
						style={{ color: hov ? color : "var(--card-foreground)", transition: "color .22s" }}
					>
						<AnimatedCounter value={value} delay={delay * 1000} plain={plain} />
					</div>
					<div className="mt-[5px] text-[9.5px] font-bold tracking-[0.15em] uppercase text-muted-foreground truncate">
						{label}
					</div>
				</div>
			</div>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function PageSkeleton() {
	return (
		<div className="p-5">
			<style>{`
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        @keyframes pulse-fade {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.9; }
        }
        .sk-bone {
          background: linear-gradient(
            90deg,
            var(--muted) 0px,
            color-mix(in oklab, var(--border) 60%, var(--card)) 200px,
            var(--muted) 400px
          );
          background-size: 600px 100%;
          animation: shimmer 1.6s ease-in-out infinite;
          border: 1px solid var(--border);
        }
      `}</style>

			<div style={{ display: "flex", flexDirection: "column", gap: 14, }}>

				{/* ── ORDER HEADER SKELETON ── */}
				<div className="sk-bone" style={{ borderRadius: "var(--radius)", overflow: "hidden", animationDelay: "0s" }}>
					{/* Top gradient rule placeholder */}
					<div style={{ height: 3, background: "var(--border)", opacity: 0.6 }} />

					{/* Identity row */}
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px", borderBottom: "1px solid var(--border)" }}>
						<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
							{/* Icon tile */}
							<div className="sk-bone" style={{ width: 42, height: 42, borderRadius: "calc(var(--radius) - 1px)", flexShrink: 0, animationDelay: "0.05s" }} />
							<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
								<div className="sk-bone" style={{ width: 60, height: 9, borderRadius: 4, animationDelay: "0.07s" }} />
								<div className="sk-bone" style={{ width: 120, height: 24, borderRadius: "var(--radius-sm)", animationDelay: "0.09s" }} />
								<div className="sk-bone" style={{ width: 140, height: 9, borderRadius: 4, animationDelay: "0.11s" }} />
							</div>
						</div>
						{/* Status pill */}
						<div className="sk-bone" style={{ width: 110, height: 32, borderRadius: 999, animationDelay: "0.08s" }} />
					</div>

					{/* Metric tiles row */}
					<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
						{[0, 0.06, 0.12, 0.18].map((d, i) => (
							<div key={i} className="sk-bone" style={{ height: 88, borderRadius: "var(--radius)", animationDelay: `${d}s`, display: "flex", alignItems: "center", gap: 12, padding: "0 16px 0 22px" }}>
								<div className="sk-bone" style={{ width: 42, height: 42, borderRadius: "calc(var(--radius) - 1px)", flexShrink: 0, animationDelay: `${d + 0.04}s` }} />
								<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
									<div className="sk-bone" style={{ height: 20, borderRadius: 4, animationDelay: `${d + 0.06}s` }} />
									<div className="sk-bone" style={{ height: 9, width: "65%", borderRadius: 3, animationDelay: `${d + 0.08}s` }} />
								</div>
							</div>
						))}
					</div>

					{/* Address + Payment row */}
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
						{[0, 0.1].map((d, col) => (
							<div key={col} style={{
								padding: "13px 20px 15px",
								borderRight: col === 0 ? "1px solid var(--border)" : "none",
								display: "flex", flexDirection: "column", gap: 9,
							}}>
								{/* Section label */}
								<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
									<div className="sk-bone" style={{ width: 5, height: 5, borderRadius: "50%", animationDelay: `${d}s` }} />
									<div className="sk-bone" style={{ width: 80, height: 8, borderRadius: 3, animationDelay: `${d + 0.03}s` }} />
								</div>
								{[100, 130, 90].map((w, j) => (
									<div key={j} style={{ display: "flex", alignItems: "center", gap: 7 }}>
										<div className="sk-bone" style={{ width: 11, height: 11, borderRadius: 3, flexShrink: 0, animationDelay: `${d + j * 0.04}s` }} />
										<div className="sk-bone" style={{ width: w, height: 10, borderRadius: 3, animationDelay: `${d + j * 0.05}s` }} />
									</div>
								))}
							</div>
						))}
					</div>
				</div>

				{/* ── TWO-COLUMN BODY ── */}
				<div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)", gap: 14 }}>

					{/* Left column — detail cards */}
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

						{/* Items card */}
						<div className="sk-bone" style={{ borderRadius: "var(--radius)", overflow: "hidden", animationDelay: "0.1s" }}>
							<div style={{ height: 3, background: "var(--border)", opacity: 0.6 }} />
							{/* Card header */}
							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: "1px solid var(--border)" }}>
								<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
									<div className="sk-bone" style={{ width: 32, height: 32, borderRadius: "calc(var(--radius) - 2px)", animationDelay: "0.12s" }} />
									<div className="sk-bone" style={{ width: 70, height: 12, borderRadius: 4, animationDelay: "0.14s" }} />
								</div>
								<div className="sk-bone" style={{ width: 55, height: 22, borderRadius: 999, animationDelay: "0.13s" }} />
							</div>
							{/* Item rows */}
							{[0, 0.07, 0.14].map((d, i) => (
								<div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
									<div className="sk-bone" style={{ width: 54, height: 54, borderRadius: "calc(var(--radius) - 2px)", flexShrink: 0, animationDelay: `${d}s` }} />
									<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
										<div className="sk-bone" style={{ height: 12, width: "75%", borderRadius: 4, animationDelay: `${d + 0.03}s` }} />
										<div className="sk-bone" style={{ height: 9, width: "90%", borderRadius: 3, animationDelay: `${d + 0.05}s` }} />
										<div style={{ display: "flex", gap: 5 }}>
											<div className="sk-bone" style={{ width: 40, height: 18, borderRadius: 999, animationDelay: `${d + 0.07}s` }} />
											<div className="sk-bone" style={{ width: 50, height: 18, borderRadius: 999, animationDelay: `${d + 0.09}s` }} />
										</div>
									</div>
									<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5, flexShrink: 0 }}>
										<div className="sk-bone" style={{ width: 60, height: 16, borderRadius: 4, animationDelay: `${d + 0.04}s` }} />
										<div className="sk-bone" style={{ width: 70, height: 9, borderRadius: 3, animationDelay: `${d + 0.06}s` }} />
										<div className="sk-bone" style={{ width: 45, height: 18, borderRadius: 999, animationDelay: `${d + 0.08}s` }} />
									</div>
								</div>
							))}
							{/* Totals footer */}
							<div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
								{[120, 100].map((w, i) => (
									<div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
										<div className="sk-bone" style={{ width: w, height: 9, borderRadius: 3, animationDelay: `${i * 0.05}s` }} />
										<div className="sk-bone" style={{ width: 60, height: 9, borderRadius: 3, animationDelay: `${i * 0.06}s` }} />
									</div>
								))}
								<div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
									<div className="sk-bone" style={{ width: 90, height: 11, borderRadius: 3, animationDelay: "0.08s" }} />
									<div className="sk-bone" style={{ width: 80, height: 18, borderRadius: 4, animationDelay: "0.1s" }} />
								</div>
							</div>
						</div>

						{/* Upsell card */}
						<div className="sk-bone" style={{ borderRadius: "var(--radius)", overflow: "hidden", animationDelay: "0.18s" }}>
							<div style={{ height: 3, background: "var(--border)", opacity: 0.6 }} />
							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: "1px solid var(--border)" }}>
								<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
									<div className="sk-bone" style={{ width: 32, height: 32, borderRadius: "calc(var(--radius) - 2px)", animationDelay: "0.2s" }} />
									<div className="sk-bone" style={{ width: 100, height: 12, borderRadius: 4, animationDelay: "0.21s" }} />
								</div>
								<div className="sk-bone" style={{ width: 24, height: 22, borderRadius: 999, animationDelay: "0.19s" }} />
							</div>
							<div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
								{[0, 0.06].map((d, i) => (
									<div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "calc(var(--radius) - 2px)" }}>
										<div className="sk-bone" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, animationDelay: `${d}s` }} />
										<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
											<div className="sk-bone" style={{ height: 11, width: "60%", borderRadius: 3, animationDelay: `${d + 0.03}s` }} />
											<div className="sk-bone" style={{ height: 9, borderRadius: 3, animationDelay: `${d + 0.05}s` }} />
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Notes + history — collapsed */}
						{[{ w: 55, d: "0.24s" }, { w: 80, d: "0.28s" }].map(({ w, d }, i) => (
							<div key={i} className="sk-bone" style={{ borderRadius: "var(--radius)", overflow: "hidden", animationDelay: d }}>
								<div style={{ height: 3, background: "var(--border)", opacity: 0.6 }} />
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px" }}>
									<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
										<div className="sk-bone" style={{ width: 32, height: 32, borderRadius: "calc(var(--radius) - 2px)", animationDelay: d }} />
										<div className="sk-bone" style={{ width: w, height: 12, borderRadius: 4, animationDelay: d }} />
									</div>
									<div className="sk-bone" style={{ width: 14, height: 14, borderRadius: 3, animationDelay: d }} />
								</div>
							</div>
						))}
					</div>

					{/* Right column — action panel */}
					<div className="sk-bone" style={{ borderRadius: "var(--radius)", overflow: "hidden", animationDelay: "0.08s" }}>
						<div style={{ height: 3, background: "var(--border)", opacity: 0.6 }} />

						{/* Panel header */}
						<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
							<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
								<div className="sk-bone" style={{ width: 42, height: 42, borderRadius: "calc(var(--radius) - 1px)", flexShrink: 0, animationDelay: "0.1s" }} />
								<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
									<div className="sk-bone" style={{ width: 65, height: 8, borderRadius: 3, animationDelay: "0.11s" }} />
									<div className="sk-bone" style={{ width: 140, height: 16, borderRadius: 4, animationDelay: "0.12s" }} />
								</div>
							</div>
							<div className="sk-bone" style={{ width: 100, height: 34, borderRadius: 999, animationDelay: "0.09s" }} />
						</div>

						{/* Panel body */}
						<div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
							{/* Notes label + textarea */}
							<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
								<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
									<div className="sk-bone" style={{ width: 10, height: 10, borderRadius: 3, animationDelay: "0.13s" }} />
									<div className="sk-bone" style={{ width: 90, height: 8, borderRadius: 3, animationDelay: "0.14s" }} />
								</div>
								<div className="sk-bone" style={{ height: 64, borderRadius: "var(--radius)", animationDelay: "0.15s" }} />
							</div>

							{/* Status label row */}
							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
								<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
									<div className="sk-bone" style={{ width: 10, height: 10, borderRadius: 3, animationDelay: "0.16s" }} />
									<div className="sk-bone" style={{ width: 75, height: 8, borderRadius: 3, animationDelay: "0.17s" }} />
								</div>
								<div className="sk-bone" style={{ width: 80, height: 22, borderRadius: 999, animationDelay: "0.16s" }} />
							</div>

							{/* Status button grid — 2×3 */}
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
								{[0, 0.05, 0.10, 0.15, 0.20, 0.25].map((d, i) => (
									<div key={i} className="sk-bone" style={{ height: 72, borderRadius: "var(--radius)", animationDelay: `${d}s`, display: "flex", alignItems: "center", gap: 10, padding: "0 14px 0 20px" }}>
										{/* Left accent bar placeholder */}
										<div style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, background: "var(--border)", borderRadius: "0 3px 3px 0", opacity: 0.5 }} />
										<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
											<div className="sk-bone" style={{ height: 14, width: "70%", borderRadius: 4, animationDelay: `${d + 0.03}s` }} />
											<div className="sk-bone" style={{ height: 8, width: "45%", borderRadius: 3, animationDelay: `${d + 0.05}s` }} />
										</div>
										<div className="sk-bone" style={{ width: 28, height: 28, borderRadius: "calc(var(--radius) - 2px)", flexShrink: 0, animationDelay: `${d + 0.04}s` }} />
									</div>
								))}
							</div>
						</div>
					</div>

				</div>
			</div>
		</div>
	);
}

function EmptyState({ onRetry, onBack, t, isRtl }) {
	return (
		<div
			style={{
				minHeight: "70vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "0 24px",
				background: "var(--background)",
			}}
		>
			<style>{`
        @keyframes ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
        @keyframes orbit {
          0%   { transform: rotate(0deg)   translateX(52px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
        }
        @keyframes orbit-rev {
          0%   { transform: rotate(0deg)   translateX(38px) rotate(0deg); }
          100% { transform: rotate(-360deg) translateX(38px) rotate(360deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .es-fade-up { animation: fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

			<div style={{ textAlign: "center", maxWidth: 400, width: "100%" }}>

				{/* ── Illustration ── */}
				<div
					className="es-fade-up"
					style={{ animationDelay: "0s", position: "relative", width: 140, height: 140, margin: "0 auto 36px" }}
				>
					{/* Outer ping ring */}
					<div style={{
						position: "absolute",
						inset: 0,
						borderRadius: "50%",
						background: "color-mix(in oklab, var(--primary) 7%, transparent)",
						animation: "ping 2s cubic-bezier(0,0,.2,1) infinite",
					}} />

					{/* Dashed orbit ring */}
					<div style={{
						position: "absolute",
						inset: 8,
						borderRadius: "50%",
						border: "1.5px dashed color-mix(in oklab, var(--primary) 22%, transparent)",
					}} />

					{/* Orbiting dot 1 */}
					<div style={{
						position: "absolute",
						top: "50%", left: "50%",
						width: 9, height: 9,
						marginTop: -4.5, marginLeft: -4.5,
						borderRadius: "50%",
						background: "var(--primary)",
						boxShadow: "0 0 8px color-mix(in oklab, var(--primary) 60%, transparent)",
						animation: "orbit 3.5s linear infinite",
					}} />

					{/* Orbiting dot 2 */}
					<div style={{
						position: "absolute",
						top: "50%", left: "50%",
						width: 6, height: 6,
						marginTop: -3, marginLeft: -3,
						borderRadius: "50%",
						background: "var(--secondary)",
						boxShadow: "0 0 6px color-mix(in oklab, var(--secondary) 60%, transparent)",
						animation: "orbit-rev 5s linear infinite",
					}} />

					{/* Center card */}
					<div style={{
						position: "absolute",
						inset: 16,
						borderRadius: "50%",
						background: "var(--card)",
						border: "1px solid var(--border)",
						boxShadow: "0 4px 20px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8)",
						display: "flex", alignItems: "center", justifyContent: "center",
						animation: "float 3s ease-in-out infinite",
					}}>

						<Package size={30} style={{ color: "var(--primary)" }} />
					</div>
				</div>

				{/* ── Text block ── */}
				<div className="es-fade-up" style={{ animationDelay: "0.1s" }}>


					<h3 style={{
						fontSize: 30, fontWeight: 500, letterSpacing: "-0.028em",
						color: "var(--card-foreground)",
						lineHeight: 1.15, marginBottom: 12,
					}}>
						{t("workPage.noOrders") || "لا توجد طلبات"}
					</h3>

					<p style={{
						fontSize: 13, color: "var(--muted-foreground)",
						lineHeight: 1.7, marginBottom: 32,
						maxWidth: 310, margin: "0 auto 32px",
					}}>
						{t("workPage.noOrdersDescription") || "لا توجد طلبات معلقة في قائمتك حالياً. يمكنك المحاولة مرة أخرى أو العودة إلى قائمة طلباتي."}
					</p>
				</div>

				{/* ── Actions ── */}
				<div
					className="es-fade-up"
					style={{
						animationDelay: "0.2s",
						display: "flex", gap: 10, justifyContent: "center",

					}}
				>
					{/* Secondary — retry */}
					<motion.button
						onClick={onRetry}
						whileHover={{ y: -2, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
						whileTap={{ scale: 0.97 }}
						style={{
							display: "flex", alignItems: "center", gap: 7,
							padding: "9px 20px", borderRadius: 999,
							background: "var(--card)", color: "var(--muted-foreground)",
							border: "1px solid var(--border)",
							fontSize: 12.5, fontWeight: 600,
							cursor: "pointer", outline: "none",
							boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
							transition: "color .15s",

						}}
						onMouseEnter={e => e.currentTarget.style.color = "var(--card-foreground)"}
						onMouseLeave={e => e.currentTarget.style.color = "var(--muted-foreground)"}
					>
						<RefreshCw size={13} />
						{t("retry") || "إعادة المحاولة"}
					</motion.button>

					{/* Primary — back */}
					<motion.button
						onClick={onBack}
						whileHover={{ y: -2, boxShadow: "0 8px 22px rgba(255,92,43,0.38)" }}
						whileTap={{ scale: 0.97 }}
						style={{
							display: "flex", alignItems: "center", gap: 7,
							padding: "9px 20px", borderRadius: 999,
							background: "linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))",
							color: "#fff", border: "none",
							fontSize: 12.5, fontWeight: 600,
							cursor: "pointer", outline: "none",
							boxShadow: "0 4px 14px rgba(255,92,43,0.28)",
							transition: "box-shadow .2s",

						}}
					>
						{!isRtl ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
						{t("workPage.backToMyOrders") || "العودة إلى طلباتي"}
					</motion.button>
				</div>

			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER HEADER
// ─────────────────────────────────────────────────────────────────────────────
function OrderHeader({ order, t, isRtl }) {
	if (!order) return null;
	const status = order.status;

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
		>
			<Card accentColor={`linear-gradient(90deg, ${COLORS.primary}, ${COLORS.profit})`} className="mb-5">
				{/* Identity row */}
				<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
					<div className="flex items-center gap-4">
						<motion.div
							whileHover={{ rotate: 8, scale: 1.06 }}
							transition={{ type: "spring", stiffness: 300, damping: 16 }}
							className="shrink-0 flex items-center justify-center rounded-[var(--radius)] overflow-hidden relative"
							style={{
								width: 52, height: 52,
								background: alpha(COLORS.primary, 0.1),
								border: `1px solid ${alpha(COLORS.primary, 0.22)}`,
							}}
						>
							<div
								className="absolute rounded-full pointer-events-none"
								style={{ top: -8, left: -8, width: 28, height: 28, background: alpha(COLORS.primary, 0.25), filter: "blur(10px)" }}
							/>
							<Receipt size={20} className="relative" style={{ color: COLORS.primary }} />
						</motion.div>

						<div className={isRtl ? "text-right" : "text-left"}>
							<SectionLabel color={COLORS.primary}>{t("orderNumber")}</SectionLabel>
							<div className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-card-foreground mt-1 tabular-nums">
								{order.orderNumber}
							</div>
							<div className="flex items-center gap-[5px] mt-[6px]">
								<Clock size={10} className="text-muted-foreground shrink-0" />
								<span className="text-[11px] text-muted-foreground font-medium">
									{fmtDateTime(order.created_at, isRtl ? "ar-EG" : "en-US")}
								</span>
							</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{order.isReplacement && (
							<motion.div
								initial={{ opacity: 0, scale: 0.85 }}
								animate={{ opacity: 1, scale: 1 }}
								className="flex items-center gap-[5px] text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-[5px] rounded-full"
								style={{
									background: alpha(COLORS.warning, 0.1),
									color: COLORS.warning,
									border: `1px solid ${alpha(COLORS.warning, 0.25)}`,
								}}
							>
								<RefreshCw size={10} />
								{t("replacement")}
							</motion.div>
						)}
						{status && (
							<motion.div
								initial={{ opacity: 0, x: isRtl ? -10 : 10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.1 }}
								className="flex items-center gap-[9px] px-4 py-[7px] rounded-full"
								style={{
									background: alpha(status.color, 0.08),
									border: `1.5px solid ${alpha(status.color, 0.3)}`,
									boxShadow: `0 2px 12px ${alpha(status.color, 0.15)}`,
								}}
							>
								<LiveDot color={status.color} />
								<span className="text-[13px] font-semibold whitespace-nowrap tracking-[-0.01em]" style={{ color: status.color }}>
									{status.system ? t(`statuses.${status.code}`) : status.name}
								</span>
							</motion.div>
						)}
					</div>
				</div>

				{/* Metrics */}
				<div className="grid gap-3 px-5 py-4 border-b border-border" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))" }}>
					{[
						{ icon: User,    label: t("customer"),   value: order.customerName || "—", color: COLORS.customer, delay: 0.08, plain: true  },
						{ icon: Phone,   label: t("phone"),      value: order.phoneNumber  || "—", color: COLORS.phone,    delay: 0.13, plain: true  },
						{ icon: Banknote,label: t("finalTotal"), value: fmtMoney(order.finalTotal),color: COLORS.money,   delay: 0.18, plain: false },
						{ icon: TrendingUp,label: t("profit"),   value: fmtMoney(order.profit),    color: COLORS.profit,  delay: 0.23, plain: false },
					].map(props => <MetricTile key={props.label} {...props} />)}
				</div>

				{/* Address + Payment */}
				<div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))" }}>
					{/* Address */}
					<div className="flex flex-col gap-[9px] px-5 py-4 border-e border-border">
						<SectionLabel color={COLORS.primary}>{t("addressDetails")}</SectionLabel>
						{[
							[order.area, order.city].filter(Boolean).join("، ")
								? { icon: MapPin,    val: [order.area, order.city].filter(Boolean).join("، "), color: COLORS.primary }
								: null,
							order.address  ? { icon: Building2, val: order.address,  color: COLORS.primary } : null,
							order.landmark ? { icon: Landmark,  val: order.landmark, color: COLORS.primary } : null,
							order.email    ? { icon: Mail,      val: order.email,    color: COLORS.phone   } : null,
						].filter(Boolean).map(({ icon: Icon, val, color }, i) => (
							<div key={i} className="flex items-center gap-2">
								<Icon size={11} style={{ color }} className="shrink-0" />
								<span className="text-[12px] font-medium text-card-foreground leading-[1.4]">{val}</span>
							</div>
						))}
					</div>

					{/* Payment + Shipping */}
					<div className="flex flex-col gap-[9px] px-5 py-4">
						<SectionLabel color={COLORS.customer}>{t("paymentShipping")}</SectionLabel>
						<div className="flex flex-wrap items-center gap-2">
							<div className="flex items-center gap-2">
								<CreditCard size={11} style={{ color: COLORS.customer }} className="shrink-0" />
								<span className="text-[12px] font-medium text-card-foreground">{order.paymentMethod}</span>
							</div>
							{order.paymentStatus && (
								<Pill size="xs" color={order.paymentStatus === "paid" ? COLORS.profit : COLORS.warning}>
									{t(`paymentStatus.${order.paymentStatus}`)}
								</Pill>
							)}
						</div>
						{order.shippingCompany && (
							<div className="flex items-center gap-2">
								<Truck size={11} className="text-muted-foreground shrink-0" />
								<span className="text-[12px] font-medium text-card-foreground">{order.shippingCompany.name}</span>
								{order.shippingCompany.website && (
									<a href={`https://${order.shippingCompany.website}`} target="_blank" rel="noreferrer" className="opacity-40 hover:opacity-80 transition-opacity">
										<ExternalLink size={10} className="text-muted-foreground" />
									</a>
								)}
							</div>
						)}
						{order.trackingNumber && (
							<div className="flex items-center gap-2">
								<Navigation size={11} style={{ color: COLORS.phone }} className="shrink-0" />
								<span className="text-[12px] font-bold tracking-[0.04em]" style={{ color: COLORS.phone }}>
									{order.trackingNumber}
								</span>
							</div>
						)}
						{(order.deposit > 0 || parseFloat(order.collectedAmount) > 0) && (
							<div className="flex flex-wrap gap-2">
								{order.deposit > 0 && (
									<Pill size="xs" color={COLORS.customer}>{t("deposit")}: {fmtMoney(order.deposit)}</Pill>
								)}
								{parseFloat(order.collectedAmount) > 0 && (
									<Pill size="xs" color={COLORS.profit}>{t("collected")}: {fmtMoney(order.collectedAmount)}</Pill>
								)}
							</div>
						)}
					</div>
				</div>
			</Card>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ITEMS
// ─────────────────────────────────────────────────────────────────────────────
function OrderItems({ order, t, isRtl }) {
	const [open, setOpen] = useState(true);
	if (!order?.items?.length) return null;

	const totalQty  = order.items.reduce((s, i) => s + i.quantity, 0);
	const itemCount = order.items.length;
	const color     = COLORS.primary;

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
			<Card accentColor={color}>
				<CollapseTrigger
					open={open} onToggle={() => setOpen(p => !p)}
					color={color}
					icon={ShoppingBag}
					eyebrow={t("items")}
					title={itemCount === 1 ? t("product") : `${itemCount} ${t("pieces")}`}
					subtitle={`${totalQty} ${t("pieces")} · ${fmtMoney(order.finalTotal)}`}
					right={
						<div className="flex items-center gap-2">
							<motion.div
								className="flex items-center gap-2 px-[13px] py-[5px] rounded-full"
								style={{ background: alpha(color, 0.08), border: `1.5px solid ${alpha(color, 0.25)}` }}
							>
								<LiveDot color={color} />
								<span className="text-[12px] font-semibold tabular-nums" style={{ color }}>{fmtMoney(order.productsTotal)}</span>
							</motion.div>
							<span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold" style={{ background: alpha(color, 0.08), color, border: `1px solid ${alpha(color, 0.2)}` }}>
								{itemCount}
							</span>
						</div>
					}
				/>

				<AnimatePresence initial={false}>
					{open && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
							className="overflow-hidden"
						>
							{/* Product list */}
							<div className="px-[18px] pt-3 pb-1 flex flex-col">
								{order.items.map((item, idx) => {
									const product  = item.variant?.product;
									const attrs    = item.variant?.attributes || {};
									const stockLeft = (item.variant?.stockOnHand ?? 0) - (item.variant?.reserved ?? 0);
									const isLow    = stockLeft < 5;
									const isLast   = idx === order.items.length - 1;

									return (
										<motion.div
											key={item.id}
											initial={{ opacity: 0, x: isRtl ? 8 : -8 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.04 + idx * 0.06, duration: 0.26 }}
											className={cn("relative py-4", !isLast && "border-b border-border")}
										>
											<div className="flex items-start gap-3">
												{/* Thumbnail */}
												<div className="relative shrink-0">
													<div
														className="rounded-[calc(var(--radius)-1px)] overflow-hidden bg-muted border border-border flex items-center justify-center"
														style={{ width: 52, height: 52 }}
													>
														{product?.mainImage ? (
															<img
																src={product.mainImage}
																alt={product.name}
																className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
																onError={e => { e.currentTarget.style.display = "none"; }}
															/>
														) : (
															<Package size={18} className="text-muted-foreground" />
														)}
													</div>
													{/* Qty badge */}
													<span
														className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white border-2 border-card"
														style={{ width: 20, height: 20, background: color, boxShadow: `0 1px 4px ${alpha(color, 0.5)}` }}
													>
														{item.quantity}
													</span>
												</div>

												{/* Info */}
												<div className={cn("flex-1 min-w-0", isRtl ? "text-right" : "text-left")}>
													<p className="text-[13px] font-bold text-card-foreground leading-tight mb-[3px]">
														{product?.name || "—"}
													</p>
													{product?.callCenterProductDescription && (
														<p className="text-[10.5px] text-muted-foreground leading-[1.45] mb-[5px]">
															{product.callCenterProductDescription}
														</p>
													)}
													<div className="flex flex-wrap items-center gap-[5px]">
														{item.variant?.sku && (
															<span className="font-mono text-[9px] font-semibold px-[5px] py-[1px] rounded bg-muted text-muted-foreground border border-border tracking-[0.04em]">
																{item.variant.sku}
															</span>
														)}
														{product?.storageRack && (
															<Pill size="xs" color={COLORS.customer}>🗄 {product.storageRack}</Pill>
														)}
														{Object.entries(attrs).map(([k, v]) => (
															<Pill key={k} size="xs" color={color}>{k}: {v}</Pill>
														))}
													</div>
												</div>

												{/* Pricing */}
												<div className={cn("shrink-0 flex flex-col gap-1", isRtl ? "items-start" : "items-end")}>
													<span className="text-[16px] font-bold tabular-nums text-card-foreground leading-none">
														{fmtMoney(item.lineTotal)}
													</span>
													<span className="text-[10.5px] text-muted-foreground tabular-nums">
														{item.quantity} × {fmtMoney(item.unitPrice)}
													</span>
													<Pill size="xs" color={COLORS.profit}>+{fmtMoney(item.lineProfit)}</Pill>
												</div>
											</div>

											{/* Stock indicator */}
											<div className={cn("flex items-center gap-3 mt-3", isRtl ? "justify-end" : "justify-start")}>
												<div className="flex items-center gap-[6px]">
													<div
														className="rounded-full overflow-hidden"
														style={{ width: 48, height: 4, background: "var(--muted)", border: "1px solid var(--border)" }}
													>
														<motion.div
															initial={{ width: 0 }}
															animate={{ width: `${Math.min(100, (stockLeft / 20) * 100)}%` }}
															transition={{ delay: 0.15 + idx * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
															className="h-full rounded-full"
															style={{ background: isLow ? COLORS.danger : COLORS.profit }}
														/>
													</div>
													<span className="text-[10px] font-bold tabular-nums" style={{ color: isLow ? COLORS.danger : COLORS.profit }}>
														{stockLeft}
													</span>
													<span className="text-[9.5px] text-muted-foreground font-medium">{t("stock")}</span>
													{isLow && (
														<Pill size="xs" color={COLORS.danger}>{isRtl ? "مخزون منخفض" : "Low"}</Pill>
													)}
												</div>
											</div>
										</motion.div>
									);
								})}
							</div>

							{/* Add product */}
							<div className="px-[18px] pb-4 pt-2">
								<motion.button
									type="button"
									whileHover={{ y: -1 }}
									whileTap={{ scale: 0.98 }}
									className="w-full flex items-center justify-center gap-2 py-[9px] rounded-[var(--radius)] text-[12px] font-semibold cursor-pointer outline-none transition-all"
									style={{
										background: alpha(color, 0.05),
										border: `1.5px dashed ${alpha(color, 0.35)}`,
										color,
									}}
									onMouseEnter={e => { e.currentTarget.style.background = alpha(color, 0.1); }}
									onMouseLeave={e => { e.currentTarget.style.background = alpha(color, 0.05); }}
								>
									<span className="flex items-center justify-center rounded-full text-white font-bold" style={{ width: 20, height: 20, background: color, fontSize: 15 }}>
										+
									</span>
									{t("addProduct")}
								</motion.button>
							</div>

							{/* Totals */}
							<div className="px-[18px] pb-4 pt-3 border-t border-border" style={{ background: "linear-gradient(180deg, var(--muted) 0%, var(--card) 100%)" }}>
								<SectionLabel color={color}>{isRtl ? "ملخص الفاتورة" : "Invoice Summary"}</SectionLabel>
								<div className="flex flex-col gap-[8px] mt-3">
									{[
										{ label: t("productsTotal"), val: fmtMoney(order.productsTotal), icon: ShoppingBag, color: color },
										{ label: t("shippingCost"),  val: fmtMoney(order.shippingCost),  icon: Truck,       color: COLORS.phone },
										...(order.discount ? [{ label: t("discount"), val: `-${fmtMoney(order.discount)}`, icon: Tag, color: COLORS.danger, red: true }] : []),
									].map(({ label, val, icon: RowIcon, color: c, red }) => (
										<div key={label} className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<IconTile icon={RowIcon} color={c} size={20} />
												<span className="text-[11.5px] text-muted-foreground font-medium">{label}</span>
											</div>
											<span className="text-[11.5px] font-semibold tabular-nums" style={{ color: red ? COLORS.danger : "var(--card-foreground)" }}>
												{val}
											</span>
										</div>
									))}

									{/* Final total */}
									<div className="flex items-center justify-between mt-1 pt-3 border-t border-border">
										<div className="flex items-center gap-2">
											<IconTile icon={Receipt} color={color} size={24} />
											<span className="text-[12px] font-bold text-card-foreground">{t("finalTotal")}</span>
										</div>
										<span className="text-[22px] font-bold tracking-[-0.028em] leading-none tabular-nums" style={{ color }}>
											{fmtMoney(order.finalTotal)}
										</span>
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</Card>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// UPSELLING
// ─────────────────────────────────────────────────────────────────────────────
function UpsellingCard({ order, t, isRtl }) {
	const upItems = order?.items?.flatMap(item =>
		item.variant?.product?.upsellingEnabled ? item.variant.product.upsellingProducts || [] : []
	) || [];
	if (!upItems.length) return null;

	const color = COLORS.upsell;

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
			<Card accentColor={color}>
				<div className="flex items-center justify-between px-[18px] py-[13px] border-b border-border">
					<div className="flex items-center gap-[10px]">
						<IconTile icon={Star} color={color} size={32} />
						<span className="text-[13px] font-bold tracking-[-0.01em] text-card-foreground">{t("upselling")}</span>
					</div>
					<Pill color={color}>{upItems.length}</Pill>
				</div>
				<div className="flex flex-col gap-2 px-[18px] py-3">
					{upItems.map((up, i) => (
						<div
							key={i}
							className="flex items-start gap-[10px] px-[13px] py-[11px] rounded-[calc(var(--radius)-2px)]"
							style={{ background: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.18)}` }}
						>
							<IconTile icon={Zap} color={color} size={28} />
							<div className={isRtl ? "text-right" : "text-left"}>
								<p className="text-[12.5px] font-bold mb-[2px]" style={{ color }}>{up.label}</p>
								{up.callCenterDescription && (
									<p className="text-[11px] text-muted-foreground leading-[1.5]">{up.callCenterDescription}</p>
								)}
							</div>
						</div>
					))}
				</div>
			</Card>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTES CARD
// ─────────────────────────────────────────────────────────────────────────────
function NotesCard({ order, t, isRtl }) {
	const [open, setOpen] = useState(true);
	if (!order?.customerNotes && !order?.notes) return null;

	const color     = COLORS.notes;
	const noteCount = [order.customerNotes, order.notes].filter(Boolean).length;
	const preview   = (order.customerNotes || order.notes || "").slice(0, 55);

	const noteTitle = order.customerNotes && order.notes
		? `${t("customerNotes")} & ${t("internalNotes")}`
		: order.customerNotes ? t("customerNotes") : t("internalNotes");

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
			<Card accentColor={color}>
				<CollapseTrigger
					open={open} onToggle={() => setOpen(p => !p)}
					color={color} icon={StickyNote}
					eyebrow={t("notes")}
					title={noteTitle}
					subtitle={!open ? preview + ((order.customerNotes || order.notes || "").length > 55 ? "…" : "") : null}
					right={
						<span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold" style={{ background: alpha(color, 0.08), color, border: `1px solid ${alpha(color, 0.2)}` }}>
							{noteCount}
						</span>
					}
				/>

				<AnimatePresence initial={false}>
					{open && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
							className="overflow-hidden"
						>
							<div className="flex flex-col gap-[10px] px-[18px] py-3 pb-4">
								{/* Customer notes */}
								{order.customerNotes && (
									<NoteBlock
										icon={User} color={color}
										label={t("customerNotes")}
										text={order.customerNotes}
										isRtl={isRtl}
										delay={0.05}
									/>
								)}
								{/* Internal notes */}
								{order.notes && (
									<NoteBlock
										icon={Lock} color={COLORS.phone}
										label={t("internalNotes")}
										text={order.notes}
										isRtl={isRtl}
										delay={order.customerNotes ? 0.1 : 0.05}
									/>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</Card>
		</motion.div>
	);
}

function NoteBlock({ icon: Icon, color, label, text, isRtl, delay }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: isRtl ? 8 : -8 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay, duration: 0.26 }}
			className="rounded-[calc(var(--radius)-2px)] overflow-hidden"
			style={{ border: `1px solid ${alpha(color, 0.22)}` }}
		>
			<div
				className="flex items-center gap-2 px-[13px] py-[8px]"
				style={{ background: alpha(color, 0.07), borderBottom: `1px solid ${alpha(color, 0.15)}` }}
			>
				<IconTile icon={Icon} color={color} size={22} />
				<span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color }}>
					{label}
				</span>
				<span
					className="ms-auto text-[9px] font-bold px-[6px] py-[1px] rounded-full"
					style={{ background: alpha(color, 0.1), color, border: `1px solid ${alpha(color, 0.2)}` }}
				>
					{text.split(/\s+/).filter(Boolean).length} {isRtl ? "كلمة" : "words"}
				</span>
			</div>
			<div className="px-[13px] py-3" style={{ background: alpha(color, 0.03) }}>
				<p className={cn("text-[13px] leading-[1.7] text-card-foreground", isRtl ? "text-right" : "text-left")}>
					{text}
				</p>
			</div>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS HISTORY
// ─────────────────────────────────────────────────────────────────────────────
function StatusHistoryCard({ order, t, isRtl }) {
	const [open, setOpen] = useState(true);
	const history = order?.statusHistory;
	if (!history?.length) return null;

	const color  = COLORS.history;
	const sorted = [...history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
	const latest = sorted[sorted.length - 1];

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
			<Card accentColor={color}>
				<CollapseTrigger
					open={open} onToggle={() => setOpen(p => !p)}
					color={color} icon={Activity}
					eyebrow={isRtl ? "سجل النشاط" : "Activity Log"}
					title={t("statusHistory")}
					subtitle={latest ? fmtDateTime(latest.created_at, isRtl ? "ar-EG" : "en-US") : null}
					right={
						<div className="flex items-center gap-2">
							{latest?.toStatus && (
								<motion.div
									className="flex items-center gap-2 px-[13px] py-[5px] rounded-full"
									style={{ background: alpha(latest.toStatus.color, 0.08), border: `1.5px solid ${alpha(latest.toStatus.color, 0.28)}` }}
								>
									<LiveDot color={latest.toStatus.color} />
									<span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: latest.toStatus.color }}>
										{latest.toStatus.system ? t(`statuses.${latest.toStatus.code}`) : latest.toStatus.name}
									</span>
								</motion.div>
							)}
							<span className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold" style={{ background: alpha(color, 0.08), color, border: `1px solid ${alpha(color, 0.2)}` }}>
								{history.length}
							</span>
						</div>
					}
				/>

				<AnimatePresence initial={false}>
					{open && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.26 }}
							className="overflow-hidden"
						>
							<div className="flex flex-col px-[18px] py-3 pb-4">
								{sorted.map((entry, idx) => {
									const isLast    = idx === sorted.length - 1;
									const toColor   = entry.toStatus?.color   || "#94a3b8";
									const fromColor = entry.fromStatus?.color  || "#94a3b8";

									return (
										<motion.div
											key={entry.id}
											className="flex items-start gap-3"
											initial={{ opacity: 0, x: isRtl ? 8 : -8 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.04 + idx * 0.06 }}
										>
											{/* Spine */}
											<div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
												<div
													className="flex items-center justify-center rounded-full"
													style={{ width: 20, height: 20, background: alpha(toColor, 0.1), border: `1.5px solid ${alpha(toColor, 0.3)}` }}
												>
													<div className="rounded-full" style={{ width: 8, height: 8, background: toColor, boxShadow: `0 0 5px ${alpha(toColor, 0.7)}` }} />
												</div>
												{!isLast && (
													<div className="w-px my-[2px]" style={{ flex: 1, minHeight: 24, background: "var(--border)" }} />
												)}
											</div>

											{/* Content */}
											<div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-[18px]", isRtl ? "text-right" : "text-left")}>
												<div className="flex flex-wrap items-center gap-[6px] mb-[5px]">
													{entry.fromStatus && (
														<span
															className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-[5px] text-[11px] font-semibold"
															style={{ background: alpha(fromColor, 0.08), color: fromColor, border: `1px solid ${alpha(fromColor, 0.25)}` }}
														>
															<span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: fromColor }} />
															{entry.fromStatus.system ? t(`statuses.${entry.fromStatus.code}`) : entry.fromStatus.name}
														</span>
													)}
													{isRtl
														? <ArrowLeft size={9} className="text-muted-foreground shrink-0" />
														: <ArrowRight size={9} className="text-muted-foreground shrink-0" />
													}
													{entry.toStatus && (
														<span
															className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-[5px] text-[11px] font-bold"
															style={{ background: alpha(toColor, 0.1), color: toColor, border: `1px solid ${alpha(toColor, 0.28)}` }}
														>
															<span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: toColor }} />
															{entry.toStatus.system ? t(`statuses.${entry.toStatus.code}`) : entry.toStatus.name}
														</span>
													)}
												</div>
												<div className="flex flex-wrap items-center gap-[6px]">
													<span className="flex items-center gap-1 text-[10.5px] text-muted-foreground font-medium">
														<Clock size={9} className="shrink-0" />
														{fmtDateTime(entry.created_at, isRtl ? "ar-EG" : "en-US")}
													</span>
													{entry.notes && (
														<>
															<span className="inline-block rounded-full bg-border shrink-0" style={{ width: 3, height: 3 }} />
															<span className="inline-flex items-center gap-1 text-[10.5px] text-card-foreground font-medium bg-muted px-[7px] py-[2px] rounded border border-border">
																{entry.notes}
															</span>
														</>
													)}
												</div>
											</div>
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</Card>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT BANNER
// ─────────────────────────────────────────────────────────────────────────────
function ResultBanner({ refetchingOrder, showSuccessCard, newStatus, retriesExhausted, isLocked, lockedUntil, t, isRtl }) {
	const countdown = useLockCountdown(isLocked ? lockedUntil : null);
	const visible   = showSuccessCard || refetchingOrder || isLocked || retriesExhausted;

	const accentGrad = showSuccessCard && !refetchingOrder
		? `linear-gradient(90deg, ${COLORS.profit}, #22c55e)`
		: isLocked
			? `linear-gradient(90deg, ${COLORS.danger}, #f87171)`
			: retriesExhausted
				? `linear-gradient(90deg, ${COLORS.warning}, #fbbf24)`
				: `linear-gradient(90deg, ${COLORS.primary}, #fb923c)`;

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					key="banner"
					initial={{ opacity: 0, y: -8, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, scale: 0.97 }}
					transition={{ duration: 0.2 }}
					className="rounded-[var(--radius)] overflow-hidden mb-4 border border-border !p-0 bg-card"
					style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
				>
					<div className="h-[3px]" style={{ background: accentGrad }} />

					{(showSuccessCard || refetchingOrder) && (
						<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
							<div className="flex items-center gap-[10px]">
								<IconTile
									icon={refetchingOrder ? Loader2 : CheckCircle}
									color={refetchingOrder ? COLORS.primary : COLORS.profit}
									size={32}
								/>
								<div className={isRtl ? "text-right" : "text-left"}>
									<p className="text-[13px] font-bold text-card-foreground">
										{refetchingOrder ? t("workPage.updatingOrder") : t("workPage.statusChanged")}
									</p>
									<p className="text-[11px] text-muted-foreground mt-[1px]">
										{refetchingOrder ? t("workPage.pleaseWait") : t("workPage.orderUpdated")}
									</p>
								</div>
							</div>
							{!refetchingOrder && newStatus && (
								<div className="flex items-center gap-2">
									<Pill color={newStatus.color}>
										{newStatus.system ? t(`statuses.${newStatus.code}`) : newStatus.name}
									</Pill>
									<div
										className="flex items-center gap-[5px] px-3 py-[5px] rounded-full text-[11px] font-bold text-white"
										style={{ background: COLORS.primary }}
									>
										{t("workPage.clickNext")}
										{isRtl ? <ArrowLeft size={10} /> : <ArrowRight size={10} />}
									</div>
								</div>
							)}
						</div>
					)}

					{retriesExhausted && !refetchingOrder && (
						<div className="flex items-center gap-[10px] px-4 py-3">
							<IconTile icon={AlertTriangle} color={COLORS.warning} size={32} />
							<div className={isRtl ? "text-right" : "text-left"}>
								<p className="text-[13px] font-bold text-card-foreground">{t("workPage.retriesExhausted")}</p>
								<p className="text-[11px] text-muted-foreground mt-[1px]">{t("workPage.retriesExhaustedMessage")}</p>
							</div>
						</div>
					)}

					{isLocked && countdown && (
						<div className="flex items-center justify-between px-4 py-3">
							<div className="flex items-center gap-[10px]">
								<IconTile icon={Lock} color={COLORS.danger} size={32} />
								<div className={isRtl ? "text-right" : "text-left"}>
									<p className="text-[13px] font-bold text-card-foreground">{t("workPage.orderLocked")}</p>
									<p className="text-[11px] text-muted-foreground mt-[1px]">{t("workPage.lockedMessage")}</p>
								</div>
							</div>
							<div
								className="shrink-0 text-[13px] font-bold tracking-[0.07em] px-[14px] py-[6px] rounded-full text-white tabular-nums"
								style={{ background: COLORS.danger }}
							>
								{countdown}
							</div>
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION PANEL
// ─────────────────────────────────────────────────────────────────────────────
function ActionPanel({
	order, notes, setNotes, changingStatus,
	isLocked, statusDecided, refetchingOrder, showSuccessCard, lockedUntil,
	t, isRtl,
}) {
	const retriesExhausted = (order?.assignment?.retriesUsed ?? 0) >= (order?.assignment?.maxRetriesAtAssignment ?? Infinity);

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
		>
			<Card accentColor={`linear-gradient(90deg, ${COLORS.primary}, ${COLORS.profit})`}>
				{/* Header */}
				<div className="flex items-center gap-3 px-[18px] py-[14px] border-b border-border">
					<motion.div
						whileHover={{ rotate: 6 }}
						transition={{ type: "spring", stiffness: 300 }}
						className="shrink-0 flex items-center justify-center rounded-[calc(var(--radius)-1px)]"
						style={{ width: 42, height: 42, background: alpha(COLORS.primary, 0.1), border: `1px solid ${alpha(COLORS.primary, 0.22)}` }}
					>
						<Zap size={17} style={{ color: COLORS.primary }} />
					</motion.div>
					<div className={isRtl ? "text-right" : "text-left"}>
						<div className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-muted-foreground mb-[2px]">
							{t("workPage.changeStatus")}
						</div>
						<div className="text-[17px] font-semibold tracking-[-0.02em] text-card-foreground leading-none">
							{t("workPage.selectStatus")}
						</div>
					</div>
				</div>

				{/* Body */}
				<div className="flex flex-col gap-4 p-[18px]">
					<ResultBanner
						refetchingOrder={refetchingOrder}
						showSuccessCard={showSuccessCard}
						newStatus={order?.status}
						retriesExhausted={retriesExhausted}
						isLocked={isLocked}
						lockedUntil={lockedUntil}
						t={t} isRtl={isRtl}
					/>

					{/* Notes */}
					<div>
						<div className="flex items-center gap-[6px] mb-[7px]">
							<FileText size={10} className="text-muted-foreground" />
							<span className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
								{t("workPage.notes")}
							</span>
						</div>
						<Textarea
							value={notes}
							onChange={e => setNotes(e.target.value)}
							placeholder={t("workPage.notesPlaceholder")}
							disabled={isLocked || changingStatus || statusDecided}
							rows={3}
							className="w-full block rounded-[var(--radius)] bg-muted border border-border text-foreground text-[13px] resize-none px-3 py-[10px] outline-none"
							style={{ textAlign: isRtl ? "right" : "left" }}
						/>
					</div>
 

					{/* Hint */}
					{!statusDecided && !isLocked && (
						<div className="flex items-center justify-center gap-2 py-1">
							<motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
								<ChevronDown size={13} className="text-muted-foreground" />
							</motion.div>
							<span className="text-[10px] text-muted-foreground font-medium tracking-[0.1em] uppercase">
								{t("workPage.selectFromBottom")}
							</span>
							<motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.1 }}>
								<ChevronDown size={13} className="text-muted-foreground" />
							</motion.div>
						</div>
					)}
				</div>
			</Card>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING ACTION BAR
// ─────────────────────────────────────────────────────────────────────────────
function FloatingActionBar({
	order, allowedStatuses, changingStatus, selectedStatusId,
	isLocked, statusDecided, refetchingOrder, handleStatusChange,
	handleNextOrder, loading, t, isRtl,
}) {
	const canNext = statusDecided && !loading && !changingStatus && !refetchingOrder;

	return (
		<motion.div
			initial={{ y: 80, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ delay: 0.3, duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
			className="fixed bottom-0 left-0 right-0 z-50"
			style={{ pointerEvents: "none" }}
		>
			{/* Fade overlay */}
			<div
				className="absolute inset-0"
				style={{ background: "linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--background) 85%, transparent) 28%, var(--background) 100%)" }}
			/>

			<div className="relative px-5 pb-5 pt-3" style={{ pointerEvents: "auto" }}>
				<div
					className="max-w-5xl mx-auto rounded-2xl overflow-hidden"
					style={{
						background: "var(--card)",
						border: "1px solid var(--border)",
						boxShadow: "0 -2px 20px rgba(0,0,0,0.06), 0 8px 40px rgba(0,0,0,0.1)",
					}}
				>
					{/* Accent rule */}
					<div
						className="h-[3px] w-full"
						style={{
							background: statusDecided
								? `linear-gradient(90deg, ${COLORS.profit}, #22c55e 60%, transparent)`
								: `linear-gradient(90deg, ${COLORS.primary}, transparent)`,
						}}
					/>

					<div className="flex items-center gap-3 px-4 py-3">
						{/* Status buttons */}
						<div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
							<div className="flex items-center gap-2 min-w-max">
								{allowedStatuses.map((status, idx) => {
									const isCurrent      = status.id === order?.status?.id;
									const isChangingThis = changingStatus && selectedStatusId === status.id;
									const isDisabled     = isLocked || changingStatus || isCurrent || statusDecided;
									const c              = status.color;
									const label          = status.system ? t(`statuses.${status.code}`) : status.name;

									return (
										<motion.button
											key={status.id}
											type="button"
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.35 + idx * 0.04 }}
											whileHover={!isDisabled ? { y: -2, boxShadow: `0 6px 18px ${alpha(c, 0.28)}` } : {}}
											whileTap={!isDisabled ? { scale: 0.97 } : {}}
											onClick={() => !isDisabled && handleStatusChange(status.id)}
											disabled={isDisabled}
											className="relative flex items-center gap-2 px-4 py-[9px] rounded-xl text-[12.5px] font-semibold whitespace-nowrap outline-none transition-all overflow-hidden"
											style={{
												background: isCurrent ? c : alpha(c, 0.08),
												border: `1.5px solid ${isCurrent ? c : alpha(c, 0.3)}`,
												color: isCurrent ? "#fff" : c,
												opacity: isDisabled && !isCurrent ? 0.35 : 1,
												cursor: isDisabled ? "not-allowed" : "pointer",
												boxShadow: isCurrent ? `0 4px 14px ${alpha(c, 0.4)}` : "none",
											}}
										>
											<span
												className="inline-block rounded-full shrink-0"
												style={{
													width: 7, height: 7,
													background: isCurrent ? "rgba(255,255,255,0.85)" : c,
													boxShadow: isCurrent ? "none" : `0 0 5px ${alpha(c, 0.8)}`,
												}}
											/>
											{label}
											{isChangingThis && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
											{isCurrent && <BadgeCheck size={13} style={{ color: "rgba(255,255,255,0.85)" }} />}
										</motion.button>
									);
								})}
							</div>
						</div>

						{/* Divider */}
						<div className="shrink-0 w-px self-stretch bg-border" />

						{/* Next order */}
						<motion.button
							type="button"
							onClick={handleNextOrder}
							disabled={!canNext}
							whileHover={canNext ? { y: -2, boxShadow: `0 8px 24px ${alpha(COLORS.primary, 0.4)}` } : {}}
							whileTap={canNext ? { scale: 0.96 } : {}}
							className="shrink-0 flex items-center gap-2 px-5 py-[9px] rounded-xl text-[12.5px] font-bold border-none outline-none transition-all"
							style={canNext ? {
								background: COLORS.primary,
								color: "#fff",
								boxShadow: `0 4px 16px ${alpha(COLORS.primary, 0.32)}`,
								cursor: "pointer",
							} : {
								background: "var(--muted)",
								color: "var(--muted-foreground)",
								opacity: 0.5,
								cursor: "not-allowed",
							}}
						>
							{t("workPage.nextOrder")}
							{loading || refetchingOrder
								? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
								: <SkipForward size={13} className="rtl:scale-x-[-1]" />
							}
						</motion.button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function OrderConfirmationWorkPage() {
	const t      = useTranslations("orders-work");
	const router = useRouter();
	const locale = useLocale();
	const isRtl  = locale?.startsWith("ar");

	const [order,          setOrder]          = useState(null);
	const [loading,        setLoading]        = useState(true);
	const [changingStatus, setChangingStatus] = useState(false);
	const [refetchingOrder,setRefetchingOrder]= useState(false);
	const [showSuccessCard,setShowSuccessCard]= useState(false);
	const [selectedStatusId,setSelectedStatusId] = useState(null);
	const [notes,          setNotes]          = useState("");
	const [allowedStatuses,setAllowedStatuses]= useState([]);
	const [isLocked,       setIsLocked]       = useState(false);
	const [lockedUntil,    setLockedUntil]    = useState(null);
	const [statusDecided,  setStatusDecided]  = useState(false);

	useEffect(() => {
		fetchNextOrder();
		fetchAllowedStatuses();
	}, []);

	const fetchNextOrder = async () => {
		try {
			setLoading(true);
			const res = await api.get("/orders/employee/orders/next");
			setOrder(res.data);
			checkLockStatus(res.data);
			setStatusDecided(false);
		} catch {
			toast.error(t("messages.errorFetchingOrder"));
		} finally {
			setLoading(false);
		}
	};

	const fetchAllowedStatuses = async () => {
		try {
			const res = await api.get("/orders/allowed-confirmation");
			setAllowedStatuses(res.data || []);
		} catch {
			toast.error(t("messages.errorFetchingStatuses"));
		}
	};

	const checkLockStatus = (data) => {
		if (!data) return;
		const assignment = data.assignments?.find(a => a.isAssignmentActive);
		if (assignment?.lockedUntil) {
			setIsLocked(new Date(assignment.lockedUntil) > new Date());
			setLockedUntil(assignment.lockedUntil);
		} else {
			setIsLocked(false);
			setLockedUntil(null);
		}
	};

	const handleStatusChange = async (statusId) => {
		if (!order || isLocked || statusDecided) return;
		try {
			setChangingStatus(true);
			setSelectedStatusId(statusId);
			await api.put(`/orders/${order.id}/confirm-status`, {
				statusId, notes: notes.trim() || undefined,
			});
			toast.success(t("messages.statusUpdated"));
			setStatusDecided(true);
			setShowSuccessCard(true);
			setRefetchingOrder(true);
			const res = await api.get(`/orders/${order.id}`);
			setOrder(res.data);
			checkLockStatus(res.data);
			setNotes("");
			setSelectedStatusId(null);
		} catch (err) {
			toast.error(err.response?.data?.message || t("messages.errorUpdatingStatus"));
			setSelectedStatusId(null);
			setStatusDecided(false);
		} finally {
			setChangingStatus(false);
			setRefetchingOrder(false);
		}
	};

	const handleNextOrder = () => {
		setOrder(null);
		setNotes("");
		setSelectedStatusId(null);
		setIsLocked(false);
		setLockedUntil(null);
		setStatusDecided(false);
		setShowSuccessCard(false);
		fetchNextOrder();
	};

	if (loading) return <PageSkeleton />;
	if (!order)  return (
		<EmptyState
			onRetry={fetchNextOrder}
			onBack={() => router.push("/orders/employee-orders")}
			t={t} isRtl={isRtl}
		/>
	);

	const shared = { t, isRtl };

	return (
		<div className="p-5 pb-32">
			<GlobalStyles />
			<OrderHeader order={order} {...shared} />

			<div className="grid gap-[14px] items-start" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,3fr)" }}>
				{/* Detail column */}
				<div className={cn("flex flex-col gap-3", isRtl ? "order-2" : "order-1")}>
					<OrderItems        order={order} {...shared} />
					<UpsellingCard     order={order} {...shared} />
					<NotesCard         order={order} {...shared} />
					<StatusHistoryCard order={order} {...shared} />
				</div>

				{/* Action panel */}
				<div className={cn("sticky top-4", isRtl ? "order-1" : "order-2")}>
					<ActionPanel
						order={order}
						notes={notes} setNotes={setNotes}
						changingStatus={changingStatus}
						isLocked={isLocked}
						statusDecided={statusDecided}
						refetchingOrder={refetchingOrder}
						showSuccessCard={showSuccessCard}
						lockedUntil={lockedUntil}
						{...shared}
					/>
				</div>
			</div>

			<FloatingActionBar
				order={order}
				allowedStatuses={allowedStatuses}
				changingStatus={changingStatus}
				selectedStatusId={selectedStatusId}
				isLocked={isLocked}
				statusDecided={statusDecided}
				refetchingOrder={refetchingOrder}
				handleStatusChange={handleStatusChange}
				handleNextOrder={handleNextOrder}
				loading={loading}
				{...shared}
			/>
		</div>
	);
}