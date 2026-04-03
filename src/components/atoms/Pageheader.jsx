"use client";

import React, { useEffect, useState } from "react";
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
	return (
		<span style={{ fontVariantNumeric: "tabular-nums" }}>
			{prefix}{display.toLocaleString()}{suffix}
		</span>
	);
}

/* ══════════════════════════════════════════════════════════════
	 INFO CARD
══════════════════════════════════════════════════════════════ */
function InfoCard({
	title, value, icon, editable,
	isAddCard, onEdit, onDelete, onClick, customStyles,
}) {
	const t = useTranslations("orders");
	const [hov, setHov] = useState(false);
	const Icon = icon;

	const accentHex = customStyles?.iconColor || null;
	const accent = accentHex || "var(--primary)";
	const iconBg = accentHex ? `${accentHex}18` : "color-mix(in oklab, var(--primary) 12%, transparent)";
	const iconBorder = accentHex ? `1px solid ${accentHex}28` : "1px solid color-mix(in oklab, var(--primary) 18%, transparent)";
	const glowColor = accentHex ? `${accentHex}30` : "color-mix(in oklab, var(--primary) 22%, transparent)";
	const badgeBg = accentHex ? `${accentHex}12` : "color-mix(in oklab, var(--primary) 9%, transparent)";
	const badgeBdr = accentHex ? `1px solid ${accentHex}28` : "1px solid color-mix(in oklab, var(--primary) 20%, transparent)";

	if (isAddCard) {
		return (
			<motion.button
				onClick={onClick}
				whileHover={{ scale: 1.01 }}
				whileTap={{ scale: 0.98 }}
				className="group"
				style={{
					width: "100%", height: 88,
					borderRadius: "var(--radius)",
					border: "1.5px dashed var(--border)",
					background: "var(--card)",
					cursor: "pointer", outline: "none",
					display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
					transition: "border-color .2s, background .2s",
				}}
			>
				<div
					className="group-hover:!bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]"
					style={{
						width: 32, height: 32,
						borderRadius: "calc(var(--radius) - 2px)",
						background: "var(--muted)",
						display: "flex", alignItems: "center", justifyContent: "center",
						flexShrink: 0, transition: "background .2s, color .2s",
					}}
				>
					{Icon && (
						<Icon
							size={14}
							className="group-hover:!text-[var(--primary)]"
							style={{ color: "var(--muted-foreground)", transition: "color .2s" }}
						/>
					)}
				</div>
				<span
					className="group-hover:!text-[var(--primary)]"
					style={{
						fontSize: 10, fontWeight: 700,
						letterSpacing: "0.16em", textTransform: "uppercase",
						color: "var(--muted-foreground)", transition: "color .2s",
					}}
				>
					{title}
				</span>
			</motion.button>
		);
	}

	return (
		<motion.div
			onHoverStart={() => setHov(true)}
			onHoverEnd={() => setHov(false)}
			onClick={editable ? onClick : undefined}
			whileHover={{ y: -2 }}
			transition={{ type: "spring", stiffness: 400, damping: 28 }}
			style={{
				position: "relative", width: "100%", height: 88,
				borderRadius: "var(--radius)",
				background: "var(--card)",
				border: `1px solid ${hov ? accent : "var(--border)"}`,
				cursor: editable ? "pointer" : "default",
				overflow: "hidden",
				boxShadow: hov
					? `0 4px 20px ${glowColor}, 0 1px 4px rgba(0,0,0,0.06)`
					: "0 1px 3px rgba(0,0,0,0.05)",
				transition: "border-color .2s, box-shadow .2s",
			}}
		>
			<div style={{
				position: "absolute", left: 0, top: 12, bottom: 12, width: 3,
				borderRadius: "0 3px 3px 0",
				background: accent,
				opacity: hov ? 1 : 0.38,
				transition: "opacity .25s",
			}} />
			<div style={{
				position: "absolute", inset: 0, pointerEvents: "none",
				opacity: hov ? 1 : 0,
				background: `radial-gradient(ellipse at 15% 15%, ${accentHex ? accentHex + "0d" : "color-mix(in oklab, var(--primary) 6%, transparent)"}, transparent 65%)`,
				transition: "opacity .3s",
			}} />
			<div style={{
				position: "relative",
				display: "flex", alignItems: "center", gap: 12,
				padding: "0 16px 0 22px", height: "100%",
			}}>
				<motion.div
					animate={{ rotate: hov ? 6 : 0 }}
					transition={{ type: "spring", stiffness: 300 }}
					style={{
						flexShrink: 0, width: 42, height: 42,
						borderRadius: "calc(var(--radius) - 1px)",
						background: iconBg, border: iconBorder,
						display: "flex", alignItems: "center", justifyContent: "center",
						boxShadow: hov ? `0 0 14px ${glowColor}` : "none",
						transition: "box-shadow .2s",
					}}
				>
					{Icon && <Icon size={17} style={{ color: accent }} />}
				</motion.div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{
						fontFamily: "'Instrument Serif', serif",
						fontSize: 28, fontWeight: 500, lineHeight: 1,
						letterSpacing: "-0.025em",
						color: hov ? accent : "var(--card-foreground)",
						transition: "color .22s",
					}}>
						<AnimatedCounter value={value} />
					</div>
					<div style={{
						marginTop: 5, fontSize: 9.5, fontWeight: 700,
						letterSpacing: "0.15em", textTransform: "uppercase",
						color: "var(--muted-foreground)",
						overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
					}}>
						{title}
					</div>
				</div>
				{editable && (
					<>
						<motion.div
							animate={{ opacity: hov ? 0 : 1 }}
							transition={{ duration: .15 }}
							style={{
								flexShrink: 0,
								display: "flex", alignItems: "center", gap: 4,
								padding: "3px 8px", borderRadius: 999,
								background: badgeBg, border: badgeBdr,
								fontSize: 9, fontWeight: 700,
								letterSpacing: "0.13em", textTransform: "uppercase",
								color: accent,
							}}
						>
							<span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, display: "inline-block" }} />
							{t("custom")}
						</motion.div>
						<AnimatePresence>
							{hov && (
								<motion.div
									initial={{ opacity: 0, x: 6 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 6 }}
									transition={{ duration: .15 }}
									style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
								>
									<button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} style={{ width: 28, height: 28, borderRadius: 8, outline: "none", background: "color-mix(in oklab, var(--primary) 10%, var(--card))", border: "1px solid color-mix(in oklab, var(--primary) 24%, var(--border))", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .15s, color .15s, transform .1s" }} onMouseEnter={e => { e.currentTarget.style.background = "var(--primary)"; e.currentTarget.style.color = "var(--primary-foreground)"; e.currentTarget.style.transform = "scale(1.08)"; }} onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in oklab, var(--primary) 10%, var(--card))"; e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.transform = "scale(1)"; }}>
										<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
									</button>
									<button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} style={{ width: 28, height: 28, borderRadius: 8, outline: "none", background: "color-mix(in oklab, var(--destructive) 10%, var(--card))", border: "1px solid color-mix(in oklab, var(--destructive) 24%, var(--border))", color: "var(--destructive)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .15s, color .15s, transform .1s" }} onMouseEnter={e => { e.currentTarget.style.background = "var(--destructive)"; e.currentTarget.style.color = "var(--destructive-foreground)"; e.currentTarget.style.transform = "scale(1.08)"; }} onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in oklab, var(--destructive) 10%, var(--card))"; e.currentTarget.style.color = "var(--destructive)"; e.currentTarget.style.transform = "scale(1)"; }}>
										<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
	 SWITCHER TABS
	 Two variants:
	 • default  — full-width row below header (original behaviour)
	 • inline   — compact tabs that sit beside the breadcrumb
══════════════════════════════════════════════════════════════ */
function SwitcherTabs({ items, activeId, onChange, variant = "default" }) {

	// ستايل مشترك لإخفاء شريط التمرير
	const scrollbarHideStyle = {
		msOverflowStyle: 'none',
		WebkitOverflowScrolling: 'touch',
	};

	/* ── INLINE variant ── */
	if (variant === "inline") {
		return (
			<div
				className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border w-full md:w-auto overflow-x-auto "
				style={{ ...scrollbarHideStyle, maxWidth: "100%" }}
			>
				{items.map((item) => {
					const Icon = item.icon;
					const isActive = item.id === activeId;
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onChange?.(item.id)}
							className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-[12.5px] font-semibold transition-all outline-none"
							style={{
								background: isActive ? "var(--card)" : "transparent",
								color: isActive ? "var(--primary)" : "var(--muted-foreground)",
								boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px color-mix(in oklab, var(--primary) 18%, transparent)" : "none",
							}}
						>
							{Icon && <Icon size={12} className="shrink-0" />}
							<span className="whitespace-nowrap">{item.label}</span>
							{item.count !== undefined && (
								<span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold"
									style={{
										background: isActive ? "color-mix(in oklab, var(--primary) 14%, transparent)" : "color-mix(in oklab, var(--muted-foreground) 15%, transparent)",
										color: isActive ? "var(--primary)" : "var(--muted-foreground)",
									}}>
									{item.count}
								</span>
							)}
						</button>
					);
				})}
			</div>
		);
	}

	/* ── DEFAULT variant ── */
	return (
		<div
			className="border-t border-border flex items-stretch w-full overflow-x-auto overflow-y-hidden"
			style={{ ...scrollbarHideStyle }}
		>
			{items.map((item) => {
				const Icon = item.icon;
				const isActive = item.id === activeId;
				return (
					<button
						key={item.id}
						type="button"
						onClick={() => onChange?.(item.id)}
						className="relative shrink-0 flex items-center gap-2 px-4 py-3 md:px-5 md:py-3.5 text-[12px] md:text-[13px] font-semibold bg-transparent border-none cursor-pointer outline-none transition-colors"
						style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
					>
						{Icon && <Icon size={14} className="shrink-0" />}
						<span className="whitespace-nowrap">{item.label}</span>
						{item.count !== undefined && (
							<span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold transition-all"
								style={{
									background: isActive ? "color-mix(in oklab, var(--primary) 14%, var(--card))" : "var(--muted)",
									color: isActive ? "var(--primary)" : "var(--muted-foreground)",
								}}>
								{item.count}
							</span>
						)}
						{isActive && (
							<motion.span
								layoutId="tab-underline"
								className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] rounded-t-full"
								style={{ background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}
								transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.5 }}
							/>
						)}
					</button>
				);
			})}
			{/* spacer لإبقاء التبويبات بجهة اليسار */}
			<div className="flex-1" />
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════
	 INLINE ICONS
══════════════════════════════════════════════════════════════ */
const HomeIcon = () => (
	<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
		stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	</svg>
);

const ChevronIcon = () => (
	<svg width="11" height="11" viewBox="0 0 24 24" fill="none"
		stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="9 18 15 12 9 6" />
	</svg>
);

/* ══════════════════════════════════════════════════════════════
	 SKELETON
══════════════════════════════════════════════════════════════ */
export function PageHeaderStatsSkeleton({ count = 6 }) {
	return (
		<div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
			{Array.from({ length: count }).map((_, i) => (
				<motion.div
					key={i}
					animate={{ opacity: [0.5, 0.9, 0.5] }}
					transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
					className="skeleton rounded-xl"
					style={{ height: 88, border: "1px solid var(--border)" }}
				>
					<div className="flex items-center gap-3 px-4 h-full">
						<div className="rounded-xl shrink-0" style={{ width: 42, height: 42, background: "var(--border)" }} />
						<div className="flex-1 space-y-2">
							<div className="rounded-xl" style={{ height: 20, width: "40%", background: "var(--border)" }} />
							<div className="rounded" style={{ height: 10, width: "60%", background: "var(--border)", opacity: .6 }} />
						</div>
					</div>
				</motion.div>
			))}
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════
	 STATS GRID WITH COLLAPSE/EXPAND
══════════════════════════════════════════════════════════════ */
export function StatsGrid({ stats }) {
	const t = useTranslations("common");
	const [isExpanded, setIsExpanded] = useState(false);

	if (!stats) return null;
	if (!Array.isArray(stats)) return <div>{stats}</div>;
	if (!stats.length) return null;

	const sorted = [...stats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	// Define max visible stats before collapse
	const MAX_VISIBLE_ROWS = 2; // Show 1 row initially (typically 4-6 items)
	const ITEMS_PER_ROW = 6; // Estimate based on grid layout
	const MAX_VISIBLE = MAX_VISIBLE_ROWS * ITEMS_PER_ROW;

	const hasMoreStats = sorted.length > MAX_VISIBLE;
	const visibleStats = isExpanded ? sorted : sorted.slice(0, MAX_VISIBLE);
	const hiddenCount = sorted.length - MAX_VISIBLE;

	return (
		<div className="relative">
			{/* Stats Grid with height limit */}
			<div
				className="relative"
				style={{
					maxHeight: isExpanded ? 'none' : `${MAX_VISIBLE_ROWS * 100}px`,
					overflow: 'hidden',
					transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				}}
			>
				<div className="grid gap-3 py-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
					{visibleStats.map((stat, i) => (
						<motion.div
							key={stat.id ?? i}
							style={{ order: stat.sortOrder ?? i }}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.055, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
						>
							{stat.isAddCard ? (
								<InfoCard title={stat.name} icon={stat.icon} isAddCard onClick={stat.onClick} />
							) : (
								<InfoCard
									title={stat.name}
									value={String(stat.value ?? 0)}
									icon={stat.icon}
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

				{/* Gradient Shadow when collapsed */}
				{hasMoreStats && !isExpanded && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2 }}
						style={{
							position: 'absolute',
							bottom: -20,
							left: 0,
							right: 0,
							height: '80px',
							background: 'linear-gradient(to bottom, transparent 0%, var(--card) 70%)',
							pointerEvents: 'none',
						}}
					/>
				)}
			</div>

			{/* Expand/Collapse Button */}
			{hasMoreStats && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="flex justify-center pt-3"
				>
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="group relative flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all outline-none"
						style={{
							background: 'var(--muted)',
							border: '1px solid var(--border)',
							color: 'var(--muted-foreground)',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'color-mix(in oklab, var(--primary) 10%, var(--muted))';
							e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--primary) 30%, var(--border))';
							e.currentTarget.style.color = 'var(--primary)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'var(--muted)';
							e.currentTarget.style.borderColor = 'var(--border)';
							e.currentTarget.style.color = 'var(--muted-foreground)';
						}}
					>
						{/* Icon */}
						<motion.svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							animate={{ rotate: isExpanded ? 180 : 0 }}
							transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
						>
							<polyline points="6 9 12 15 18 9" />
						</motion.svg>

						{/* Text */}
						<span>
							{isExpanded
								? t("stats.hide")
								: t("stats.showAll")
							}
						</span>


					</button>
				</motion.div>
			)}
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════
	 PAGE HEADER
	 ─────────────────────────────────────────────────────────────
	 Layout logic:

	 COMPACT MODE  — only breadcrumbs + tabs, nothing else
	 ┌─────────────────────────────────────────────────────────┐
	 │  🏠 Breadcrumbs  •  Page Title          [Tab] [Tab]     │
	 └─────────────────────────────────────────────────────────┘
	 Single row, tabs rendered inline as pills beside the title.
	 No bottom rule, no stacked rows.

	 FULL MODE  — has stats and/or buttons
	 ┌─────────────────────────────────────────────────────────┐
	 │  🏠 Breadcrumbs  •  Page Title    [Button] [Button]     │
	 │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
	 │  │ stat │  │ stat │  │ stat │  │ stat │               │
	 │  └──────┘  └──────┘  └──────┘  └──────┘               │
	 │  ──────────────────────────────────────────             │
	 │  [Tab ▂]  [Tab]  [Tab]                                  │
	 └─────────────────────────────────────────────────────────┘
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
	const hasTabs = items?.length >= 1;
	const hasButtons = !!buttons;

	const isCompact = hasTabs && !hasStats && !hasButtons;

	/* ── COMPACT LAYOUT ── */
	if (isCompact) {
		return (
			<motion.div
				initial={{ opacity: 0, y: -6 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
				className={["relative main-card mb-6", className].join(" ")}
				style={{
					borderRadius: "var(--radius)",
					border: "1px solid var(--border)",
					overflow: "hidden",
				}}
			>
				{/* Single row: breadcrumb left ←→ pill tabs right */}
				<div style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12,
					padding: "10px 16px",
					flexWrap: "wrap",
				}}>

					{/* Breadcrumb */}
					<nav aria-label="breadcrumb">
						<ol style={{ display: "flex", alignItems: "center", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
							{breadcrumbs.map((crumb, i) => {
								const isLast = i === breadcrumbs.length - 1;
								return (
									<li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
										{i > 0 && (
											<span style={{ color: "var(--muted-foreground)", display: "flex", transform: "scaleX(-1)" }}>
												<ChevronIcon />
											</span>
										)}
										{isLast ? (
											<motion.span
												initial={{ opacity: 0, x: -4 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: 0.08 }}
												style={{ display: "flex", alignItems: "center", gap: 8 }}
											>
												<span style={{
													fontSize: 20, fontWeight: 400,
													letterSpacing: "-0.022em",
													color: "var(--card-foreground)",
													lineHeight: 1,
												}}>
													{crumb.name}
												</span>
												{/* live dot */}
												<span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
													<span style={{
														position: "absolute", inset: 0,
														borderRadius: "50%",
														background: "var(--primary)",
														opacity: 0.55,
														animation: "ping 1.4s cubic-bezier(0,0,.2,1) infinite",
													}} />
													<span style={{
														position: "relative", width: 8, height: 8,
														borderRadius: "50%",
														background: "var(--primary)",
														boxShadow: "0 0 6px color-mix(in oklab, var(--primary) 60%, transparent)",
													}} />
												</span>
											</motion.span>
										) : (
											<button
												onClick={crumb.onClick ?? (crumb.href ? () => (window.location.href = crumb.href) : undefined)}
												style={{
													display: "flex", alignItems: "center", gap: 6,
													background: "none", border: 0, padding: 0, cursor: "pointer",
													fontSize: 12, fontWeight: 500,
													color: "var(--muted-foreground)",
													transition: "color .15s",
													outline: "none",
												}}
												onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
												onMouseLeave={e => e.currentTarget.style.color = "var(--muted-foreground)"}
											>
												{i === 0 && <HomeIcon />}
												{crumb.name}
											</button>
										)}
									</li>
								);
							})}
						</ol>
					</nav>

					{/* Pill tabs inline */}
					<SwitcherTabs
						items={items}
						activeId={active}
						onChange={setActive}
						variant="inline"
					/>
				</div>

				{/* Ping keyframe */}
				<style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
			</motion.div>
		);
	}

	/* ── FULL LAYOUT (original, unchanged) ── */
	return (
		<motion.div
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
			className={[
				"relative overflow-hidden main-card mb-6",
				hasTabs ? "!pb-[2px]" : "pb-5",
				className,
			].join(" ")}
		>
			<div className="relative flex flex-col gap-5">

				{/* ─── 1. Breadcrumb ←→ Buttons ─── */}
				<div className="flex items-center justify-between gap-4 flex-wrap">
					<nav aria-label="breadcrumb">
						<ol className="flex items-center gap-2 flex-wrap list-none m-0 p-0">
							{breadcrumbs.map((crumb, i) => {
								const isLast = i === breadcrumbs.length - 1;
								return (
									<li key={i} className="flex items-center gap-2">
										{i > 0 && (
											<span className="rtl:scale-x-[-1] flex items-center" style={{ color: "var(--muted-foreground)" }}>
												<ChevronIcon />
											</span>
										)}
										{isLast ? (
											<motion.span
												initial={{ opacity: 0, x: -6 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: 0.1 }}
												className="flex items-center gap-2.5"
											>
												<span style={{
													fontSize: 18, fontWeight: 400,
													letterSpacing: "-0.025em",
													color: "var(--card-foreground)",
												}} className=" ">
													{crumb.name}
												</span>
												<span className="relative flex h-2 w-2">
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
														style={{ background: "var(--primary)" }} />
													<span className="relative inline-flex rounded-full h-2 w-2"
														style={{ background: "var(--primary)", boxShadow: "0 0 6px color-mix(in oklab, var(--primary) 70%, transparent)" }} />
												</span>
											</motion.span>
										) : (
											<button
												onClick={crumb.onClick ?? (crumb.href ? () => (window.location.href = crumb.href) : undefined)}
												className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer text-[12px] font-medium leading-none"
												style={{ color: "var(--muted-foreground)", transition: "color .15s", outline: "none" }}
												onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
												onMouseLeave={e => e.currentTarget.style.color = "var(--muted-foreground)"}
											>
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
								className="flex items-center gap-2 flex-wrap"
							>
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

				{/* ─── 3. Full-width underline tabs ─── */}
				{hasTabs && (
					<SwitcherTabs
						items={items}
						activeId={active}
						onChange={setActive}
						variant="default"
					/>
				)}
			</div>
		</motion.div>
	);
}

export default PageHeader;