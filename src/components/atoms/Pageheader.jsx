"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

/* ══════════════════════════════════════════════════════════════
   INFO CARD
══════════════════════════════════════════════════════════════ */
function InfoCard({
	title, value, icon, iconColor, editable,
	isAddCard, onEdit, onDelete, onClick, customStyles,
}) {
	const t = useTranslations("orders");
	const handleClick  = () => onClick?.();
	const handleEdit   = (e) => { e.stopPropagation(); onEdit?.(); };
	const handleDelete = (e) => { e.stopPropagation(); onDelete?.(); };

	const Icon        = icon;
	const accentColor = customStyles?.iconColor || null;

	/* ── Add Card ── */
	if (isAddCard) {
		return (
			<button onClick={handleClick}
				className="group relative w-full h-[75px] rounded-xl overflow-hidden cursor-pointer
					border-2 border-dashed border-gray-200 dark:border-gray-700
					hover:border-gray-400 dark:hover:border-gray-500
					bg-gray-50/80 dark:bg-gray-900/80 hover:bg-gray-100 dark:hover:bg-gray-800
					transition-all duration-300">
				<div className="flex items-center justify-center gap-3 h-full px-5">
					<div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700
						group-hover:bg-gray-300 dark:group-hover:bg-gray-600
						flex items-center justify-center flex-shrink-0
						group-hover:scale-110 transition-all duration-300">
						<Icon size={16} className="text-gray-500 dark:text-gray-400" />
					</div>
					<span className="text-xs font-bold uppercase tracking-widest
						text-gray-400 dark:text-gray-500
						group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
						{title}
					</span>
				</div>
			</button>
		);
	}

	/* ── Stat Card ── */
	return (
		<div onClick={editable ? handleClick : undefined}
			className={["group relative w-full rounded-xl overflow-hidden transition-all duration-300",
				editable ? "cursor-pointer hover:-translate-y-0.5" : ""].filter(Boolean).join(" ")}>

			{/* bg washes */}
			<div className="absolute inset-0 dark:hidden" style={{
				background: accentColor
					? `linear-gradient(135deg, ${accentColor}1a 0%, ${accentColor}06 60%, transparent 100%)`
					: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
			}} />
			<div className="absolute inset-0 hidden dark:block" style={{
				background: accentColor
					? `linear-gradient(135deg, ${accentColor}28 0%, ${accentColor}0e 60%, transparent 100%)`
					: "linear-gradient(135deg, #1c2230 0%, #111827 100%)",
			}} />

			{/* corner glow */}
			{accentColor && (
				<div className="absolute -top-8 -end-8 w-28 h-28 rounded-full opacity-20 dark:opacity-15
					blur-3xl pointer-events-none group-hover:opacity-35 transition-opacity duration-300"
					style={{ background: accentColor }} />
			)}

			{/* border ring */}
			<div className="absolute inset-0 rounded-xl pointer-events-none" style={{
				border: `1px solid ${accentColor ? accentColor + "28" : "rgba(0,0,0,0.07)"}`,
			}} />

			{/* bottom accent bar */}
			{accentColor && (
				<div className="absolute bottom-0 start-0 end-0 h-[2.5px] overflow-hidden">
					<div className="h-full w-3/5 opacity-50"
						style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
				</div>
			)}

			{/* content */}
			<div className="relative flex items-center gap-3 px-4 py-4">
				<div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
					transition-transform duration-300 group-hover:scale-110"
					style={{
						background: accentColor ? `${accentColor}1e` : "rgba(0,0,0,0.05)",
						boxShadow: accentColor ? `0 0 0 1px ${accentColor}22` : "none",
					}}>
					<Icon size={21} style={{ color: accentColor || undefined }}
						className={!accentColor ? iconColor : ""} />
				</div>
				<div className="flex-1 min-w-0">
					<div className="text-[22px] font-black leading-none tabular-nums tracking-tight"
						style={{ color: accentColor || undefined }}>
						{value}
					</div>
					<div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest
						text-gray-400 dark:text-gray-500 truncate">
						{title}
					</div>
				</div>
				{editable && (
					<div className="flex-shrink-0 flex items-center gap-1.5">
						<div className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold
							uppercase tracking-wider bg-white/70 dark:bg-black/30
							border border-black/10 dark:border-white/10
							text-gray-500 dark:text-gray-400 backdrop-blur-sm
							opacity-100 group-hover:opacity-0 group-hover:pointer-events-none transition-opacity duration-200">
							<span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor || "#888" }} />
							{t("custom")}
						</div>
						<div className="absolute end-3 flex items-center gap-1
							opacity-0 group-hover:opacity-100
							translate-x-2 rtl:-translate-x-2 group-hover:translate-x-0
							transition-all duration-200">
							<button onClick={handleEdit} className="w-8 h-8 rounded-xl flex items-center justify-center
								bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
								border border-black/10 dark:border-white/10
								text-blue-500 hover:text-white hover:bg-blue-500 transition-all duration-150 shadow-sm">
								<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
									fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
								</svg>
							</button>
							<button onClick={handleDelete} className="w-8 h-8 rounded-xl flex items-center justify-center
								bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
								border border-black/10 dark:border-white/10
								text-red-500 hover:text-white hover:bg-red-500 transition-all duration-150 shadow-sm">
								<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
									fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
								</svg>
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════
   SWITCHER TABS
   Design: underline tabs flush to the card bottom border.
   Active tab shows an animated gradient underline bar.
   Count badge tints amber when active, neutral otherwise.
══════════════════════════════════════════════════════════════ */
function SwitcherTabs({ items, activeId, onChange, className = "", itemClassName = "", activeClassName = "", inactiveClassName = "" }) {
	return (
		<div className={["flex items-stretch w-full border-t border-slate-100 dark:border-white/[0.05]", className].join(" ")}>
			{items.map((item) => {
				const Icon     = item.icon;
				const isActive = item.id === activeId;

				return (
					<button
						key={item.id}
						type="button"
						onClick={() => onChange?.(item.id)}
						className={[
							"relative flex items-center gap-2 px-5 py-3.5",
							"text-[13.5px] font-semibold select-none",
							"transition-colors duration-200 focus:outline-none",
							"whitespace-nowrap",
							itemClassName,
							isActive
								? ["text-amber-600 dark:text-amber-400", activeClassName].join(" ")
								: ["text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300", inactiveClassName].join(" "),
						].join(" ")}
					>
						{/* Icon */}
						{Icon && (
							<Icon
								size={15}
								className={isActive
									? "text-amber-500 dark:text-amber-400"
									: "text-slate-300 dark:text-slate-600"}
							/>
						)}

						{/* Label */}
						<span>{item.label}</span>

						{/* Count badge */}
						{item.count !== undefined && (
							<span className={[
								"inline-flex items-center justify-center",
								"min-w-[20px] h-5 px-1.5 rounded-full",
								"text-[10.5px] font-bold leading-none",
								"transition-colors duration-200",
								isActive
									? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
									: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
							].join(" ")}>
								{item.count}
							</span>
						)}

						{/* Animated underline bar */}
						{isActive && (
							<motion.span
								layoutId="tab-underline"
								className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] rounded-t-full"
								style={{
									background: "linear-gradient(90deg, #f59e0b, #f97316)",
								}}
								transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.5 }}
							/>
						)}
					</button>
				);
			})}

			{/* spacer line */}
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
		<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="w-full rounded-xl border border-border p-5 animate-pulse">
					<div className="flex items-start gap-3">
						<div className="w-11 h-11 rounded-xl bg-muted shrink-0" />
						<div className="flex-1 space-y-2.5 pt-1">
							<div className="h-5 w-1/2 rounded bg-muted" />
							<div className="h-3 w-3/4 rounded bg-muted" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════
   STATS GRID
══════════════════════════════════════════════════════════════ */
function StatsGrid({ stats }) {
	if (!stats) return null;
	if (!Array.isArray(stats)) return <div>{stats}</div>;
	if (!stats.length) return null;

	const sorted = [...stats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
			{sorted.map((stat, i) => (
				<motion.div key={stat.id ?? i} style={{ order: stat.sortOrder ?? i }}
					initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
					transition={{ delay: i * 0.05, duration: 0.22, ease: "easeOut" }}>
					{stat.isAddCard ? (
						<InfoCard title={stat.name} icon={stat.icon} isAddCard onClick={stat.onClick} />
					) : (
						<InfoCard
							title={stat.name} value={String(stat.value ?? 0)}
							icon={stat.icon} iconColor="" bg="" iconBorder=""
							editable={stat.editable ?? false}
							onEdit={stat.onEdit} onDelete={stat.onDelete} onClick={stat.onClick}
							customStyles={{ iconColor: stat.color, iconBorder: stat.color }}
						/>
					)}
				</motion.div>
			))}
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════
   PAGE HEADER
   Layout order (top → bottom):
     1. breadcrumb  ←→  action buttons
     2. stats grid
     3. switcher tabs  (flush underline, stretches full width)
══════════════════════════════════════════════════════════════ */
export function PageHeader({
	breadcrumbs  = [],
	buttons,
	stats,
	statsLoading = false,
	statsCount   = 6,
	className    = "",
	items        = [],
	active,
	setActive,
}) {
	const hasStats = statsLoading || (Array.isArray(stats) ? stats.length > 0 : !!stats);
	const hasTabs  = items?.length >= 1;

	return (
		<div className={[
			"relative overflow-hidden bg-card mb-8",
			/* negative bottom padding so the tab underline kisses the card border */
			hasTabs ? "pb-0" : "",
			className,
		].join(" ")}>
			<div className="relative flex flex-col">

				{/* ─── 1. breadcrumb ←→ buttons ─────────────────────────── */}
				<div className="flex items-center justify-between gap-4 flex-wrap px-0 pb-6">
					<nav aria-label="breadcrumb">
						<ol className="flex items-center gap-1.5 flex-wrap list-none m-0 p-0">
							{breadcrumbs.map((crumb, i) => {
								const isLast = i === breadcrumbs.length - 1;
								return (
									<li key={i} className="flex items-center gap-1.5">
										{i > 0 && (
											<span className="rtl:scale-x-[-1] text-muted-foreground/30 flex items-center">
												<ChevronIcon />
											</span>
										)}
										{isLast ? (
											<span className="flex items-center gap-2">
												<span className="text-[18px] font-bold tracking-tight text-foreground leading-none">
													{crumb.name}
												</span>
												<span className="inline-block w-2 h-2 rounded-full shrink-0" style={{
													background: "var(--primary)",
													boxShadow: "0 0 8px 2px rgb(var(--primary-shadow))",
												}} />
											</span>
										) : (
											<button
												onClick={crumb.onClick ?? (crumb.href ? () => (window.location.href = crumb.href) : undefined)}
												className="flex items-center gap-1.5 text-[13px] font-medium leading-none
													text-muted-foreground/60 hover:text-[var(--primary)]
													bg-transparent border-0 p-0 cursor-pointer transition-colors duration-150">
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
							<motion.div key="phdr-btns"
								initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15, ease: "easeOut" }}
								className="flex items-center gap-2 flex-wrap">
								{buttons}
							</motion.div>
						</AnimatePresence>
					)}
				</div>

				{/* ─── 2. stats grid ────────────────────────────────────── */}
				{hasStats && (
					<div className="pb-6">
						{statsLoading
							? <PageHeaderStatsSkeleton count={statsCount} />
							: <StatsGrid stats={stats} />
						}
					</div>
				)}

				{/* ─── 3. switcher tabs — flush to bottom ───────────────── */}
				{hasTabs && (
					<SwitcherTabs
						items={items}
						activeId={active}
						onChange={setActive}
					/>
				)}

			</div>
		</div>
	);
}

export default PageHeader;

 