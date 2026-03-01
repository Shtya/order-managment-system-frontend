"use client";

import { motion, AnimatePresence } from "framer-motion";
import InfoCard from "@/components/atoms/InfoCard";


/* ── Inline SVG icons (no extra import needed) ─────────────────────────── */
const HomeIcon = () => (
	<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
		stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	</svg>
);

const ChevronIcon = () => (
	<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
		stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="9 18 15 12 9 6" />
	</svg>
);

/* ── Skeleton ─────────────────────────────────────────────────────────── */
export function PageHeaderStatsSkeleton({ count = 6 }) {
	return (
		<div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
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

/* ── Stats grid ────────────────────────────────────────────────────────── */
export function StatsGrid({ stats }) {
	if (!stats) return null;

	/* ReactNode passthrough */
	if (!Array.isArray(stats)) return <div className="mt-4">{stats}</div>;
	if (!stats.length) return null;

	const sorted = [...stats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	return (
		<div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
			{sorted.map((stat, index) => (
				<motion.div
					key={stat.id ?? index}
					style={{ order: stat.sortOrder ?? index }}
					initial={{ opacity: 0, y: 18 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.06, duration: 0.28, ease: "easeOut" }}
				>
					{stat.isAddCard ? (
						/* "Add" dashed card */
						<InfoCard
							title={stat.name}
							icon={stat.icon}
							isAddCard
							onClick={stat.onClick}
						/>
					) : (
						/* Normal stat card — identical to OrdersTab */
						<InfoCard
							title={stat.name}
							value={String(stat.value ?? 0)}
							icon={stat.icon}
							bg=""
							iconColor=""
							iconBorder=""
							editable={stat.editable ?? false}
							onEdit={stat.onEdit}
							onDelete={stat.onDelete}
							onClick={stat.onClick}
							customStyles={{
								iconColor: stat.color,
								iconBorder: stat.color,
							}}
						/>
					)}
				</motion.div>
			))}
		</div>
	);
}

/* ── PageHeader ────────────────────────────────────────────────────────── */
export function PageHeader({
	breadcrumbs = [],
	buttons,
	stats,
	statsLoading = false,
	statsCount = 6,
	className = "",
	children
}) {
	return (
		<div
			className={[
				"relative overflow-hidden",
				"bg-card border border-border/60 rounded-2xl shadow-sm",
				"mb-5 px-5 py-3.5",
				className,
			].join(" ")}
		>
			{/* Bottom gradient accent bar */}
			<div
				className="absolute inset-x-0 bottom-0 h-[2px]"
				style={{
					background: "linear-gradient(to right, var(--primary), var(--third, #ff5c2b))",
				}}
			/>

			{/* Radial glow */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.07]"
				style={{
					background: "radial-gradient(ellipse 80% 60% at 50% -15%, var(--primary), transparent)",
				}}
			/>

			<div className="relative flex flex-col gap-6">

				{/* ── Top row: breadcrumb + buttons ── */}
				<div className="flex items-center justify-between gap-4 flex-wrap">

					{/* Breadcrumb */}
					<nav aria-label="breadcrumb">
						<ol className="flex items-center gap-2 flex-wrap list-none m-0 p-0">
							{breadcrumbs.map((crumb, i) => {
								const isLast = i === breadcrumbs.length - 1;
								return (
									<li key={i} className="flex items-center gap-2">
										{i > 0 && (
											<span className="rtl:scale-x-[-1] text-muted-foreground/40 flex items-center">
												<ChevronIcon />
											</span>
										)}

										{isLast ? (
											<span className="flex items-center gap-2">
												<span className="text-[18px] font-bold tracking-tight text-foreground leading-none">
													{crumb.name}
												</span>
												{/* Glowing dot */}
												<span
													className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
													style={{
														background: "var(--primary)",
														boxShadow: "0 0 10px 3px rgb(var(--primary-shadow))",
													}}
												/>
											</span>
										) : (
											<button
												onClick={
													crumb.onClick ??
													(crumb.href ? () => (window.location.href = crumb.href) : undefined)
												}
												className="flex items-center gap-1.5 text-[14px] font-medium leading-none
                          text-muted-foreground hover:text-[var(--primary)]
                          bg-transparent border-0 p-0 cursor-pointer transition-colors duration-150"
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

					{/* Action buttons */}
					<AnimatePresence mode="wait">
						<motion.div
							key={"btns"}
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -10 }}
							transition={{ duration: 0.18, ease: "easeOut" }}
							className="flex items-center gap-2.5 flex-wrap"
						>
							{buttons}
						</motion.div>
					</AnimatePresence>
				</div>

				{/* ── Stats ── */}
				{statsLoading
					? <PageHeaderStatsSkeleton count={statsCount} />
					: <StatsGrid stats={stats} />
				}
				{children}
			</div>
		</div>
	);
}

export default PageHeader;