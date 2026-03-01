import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Icons ────────────────────────────────────────────────────────────────────
const HomeIcon = () => (
	<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
	</svg>
);
const ChevronIcon = () => (
	<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="9 18 15 12 9 6" />
	</svg>
);

export function BreadcrumbBar({ breadcrumbs = [], buttons, activeTab  }) {
	return (
		<div className={` relative overflow-hidden bg-card border border-border/60 rounded-xl shadow-sm mb-5 px-5 py-3.5`}>
			{/* Gradient top-border using your CSS vars */}
			<div
				className="absolute inset-x-0 bottom-0 h-[2px]"
				style={{ background: "linear-gradient(to right, var(--primary), var(--primary), var(--primary))" }}
			/>

			{/* Subtle radial glow */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.07]"
				style={{ background: "radial-gradient(ellipse 80% 60% at 50% -15%, var(--primary), transparent)" }}
			/>

			<div className="relative flex items-center justify-between gap-4 flex-wrap">

				{/* ── Breadcrumb ── */}
				<nav aria-label="breadcrumb">
					<ol className="flex items-center gap-2 flex-wrap list-none m-0 p-0">
						{breadcrumbs.map((crumb, i) => {
							const isLast = i === breadcrumbs.length - 1;
							return (
								<li key={i} className="flex items-center gap-2">
									{i > 0 && (
										<span className="  rtl:scale-x-[-1] text-muted-foreground/40 flex items-center">
											<ChevronIcon />
										</span>
									)}
									{isLast ? (
										/* Active page */
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
										/* Clickable ancestor */
										<button
											onClick={crumb.onClick ?? (crumb.href ? () => (window.location.href = crumb.href) : undefined)}
											className="
                        flex items-center gap-1.5
                        text-[14px] font-medium leading-none
                        text-muted-foreground
                        hover:text-primary
                        bg-transparent border-0 p-0 cursor-pointer
                        transition-colors duration-150
                      "
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

				{/* ── Action Buttons ── */}
				<AnimatePresence mode="wait">
					<motion.div
						key={activeTab ?? "btns"}
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
		</div>
	);
}

// ─── Button variants ──────────────────────────────────────────────────────────
function CrumbButton({ name, href, onClick, variant = "ghost", icon, index }) {
	const handleClick = onClick ?? (href ? () => (window.location.href = href) : undefined);

	// Base shared classes
	const base = `
    relative overflow-hidden isolate
    inline-flex items-center gap-2
    text-[14px] font-semibold leading-none
    rounded-xl px-4 py-2.5
    border-0 cursor-pointer
    transition-all duration-200
    focus:outline-none
    select-none whitespace-nowrap
  `;

	const variantClass = {
		primary: "crumb-btn-primary",
		secondary: "crumb-btn-secondary",
		ghost: "crumb-btn-ghost",
		danger: "crumb-btn-danger",
	}[variant] ?? "crumb-btn-ghost";

	return (
		<motion.button
			onClick={handleClick}
			className={`${base} ${variantClass}`}
			initial={{ opacity: 0, scale: 0.86, y: 5 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ delay: index * 0.055, duration: 0.18, ease: "easeOut" }}
			whileHover={{ y: -2, transition: { duration: 0.12 } }}
			whileTap={{ scale: 0.95 }}
		>
			{icon && (
				<span className="flex items-center" style={{ opacity: variant === "primary" ? 0.92 : 0.65 }}>
					{icon}
				</span>
			)}
			{name}
		</motion.button>
	);
}

