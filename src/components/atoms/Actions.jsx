"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// COLOR VARIANTS
// ─────────────────────────────────────────────────────────────
const VARIANTS = {
	purple: {
		base: "border-purple-200 bg-purple-50 text-purple-500 dark:border-purple-800/60 dark:bg-purple-950/20 dark:text-purple-400",
		hover: "hover:bg-purple-500 hover:border-purple-500 hover:text-white hover:shadow-md dark:hover:bg-purple-500 dark:hover:border-purple-500",
		tooltip: { bg: "#7c3aed", shadow: "rgba(124,58,237,0.4)" },
	},
	blue: {
		base: "border-blue-200 bg-blue-50 text-blue-500 dark:border-blue-800/60 dark:bg-blue-950/20 dark:text-blue-400",
		hover: "hover:bg-blue-500 hover:border-blue-500 hover:text-white hover:shadow-md dark:hover:bg-blue-500 dark:hover:border-blue-500",
		tooltip: { bg: "#2563eb", shadow: "rgba(37,99,235,0.4)" },
	},
	red: {
		base: "border-red-200 bg-red-50 text-red-500 dark:border-red-800/60 dark:bg-red-950/20 dark:text-red-400",
		hover: "hover:bg-red-500 hover:border-red-500 hover:text-white hover:shadow-md dark:hover:bg-red-500 dark:hover:border-red-500",
		tooltip: { bg: "#dc2626", shadow: "rgba(220,38,38,0.4)" },
	},
	emerald: {
		base: "border-emerald-200 bg-emerald-50 text-emerald-500 dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:text-emerald-400",
		hover: "hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:shadow-md dark:hover:bg-emerald-500 dark:hover:border-emerald-500",
		tooltip: { bg: "#059669", shadow: "rgba(5,150,105,0.4)" },
	},
	orange: {
		base: "border-orange-200 bg-orange-50 text-orange-500 dark:border-orange-800/60 dark:bg-orange-950/20 dark:text-orange-400",
		hover: "hover:bg-orange-500 hover:border-orange-500 hover:text-white hover:shadow-md dark:hover:bg-orange-500 dark:hover:border-orange-500",
		tooltip: { bg: "#ea580c", shadow: "rgba(234,88,12,0.4)" },
	},
	slate: {
		base: "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400",
		hover: "hover:bg-slate-600 hover:border-slate-600 hover:text-white hover:shadow-md dark:hover:bg-slate-600 dark:hover:border-slate-600",
		tooltip: { bg: "#475569", shadow: "rgba(71,85,105,0.4)" },
	},
	amber: {
		base: "border-amber-200 bg-amber-50 text-amber-500 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-400",
		hover: "hover:bg-amber-500 hover:border-amber-500 hover:text-white hover:shadow-md dark:hover:bg-amber-500 dark:hover:border-amber-500",
		tooltip: { bg: "#d97706", shadow: "rgba(217,119,6,0.4)" },
	},
};

// ─────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────
function CustomTooltip({ children, label, color }) {
	const [visible, setVisible] = useState(false);
	const [mounted, setMounted] = useState(false);

	const triggerRef = useRef(null);
	const tooltipRef = useRef(null);

	const [position, setPosition] = useState({
		left: 0,
		top: 0,
		arrowLeft: 0,
		placement: "top",
		dir: "ltr",
	});

	useEffect(() => setMounted(true), []);

	const updatePosition = useCallback(() => {
		const trigger = triggerRef.current;
		const tooltip = tooltipRef.current;
		if (!trigger || !tooltip) return;

		const triggerRect = trigger.getBoundingClientRect();
		const tooltipRect = tooltip.getBoundingClientRect();

		const gap = 10;
		const viewportPadding = 8;
		const arrowSize = 8;

		const rootDir =
			trigger.closest("[dir]")?.getAttribute("dir") ||
			document?.documentElement?.getAttribute("dir") ||
			getComputedStyle(trigger).direction ||
			"ltr";

		const triggerCenter = triggerRect.left + triggerRect.width / 2;

		let left = triggerCenter - tooltipRect.width / 2;
		left = Math.max(viewportPadding, left);
		left = Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding);

		let top = triggerRect.top - tooltipRect.height - gap;
		let placement = "top";

		// fallback to bottom if there is no space above
		if (top < viewportPadding) {
			top = triggerRect.bottom + gap;
			placement = "bottom";
		}

		const arrowLeftRaw = triggerCenter - left;
		const arrowLeft = Math.max(arrowSize + 4, Math.min(tooltipRect.width - arrowSize - 4, arrowLeftRaw));

		setPosition({
			left,
			top,
			arrowLeft,
			placement,
			dir: rootDir === "rtl" ? "rtl" : "ltr",
		});
	}, []);

	useLayoutEffect(() => {
		if (!visible) return;
		updatePosition();
	}, [visible, label, updatePosition]);

	useEffect(() => {
		if (!visible) return;

		const handle = () => updatePosition();

		window.addEventListener("resize", handle);
		window.addEventListener("scroll", handle, true);

		return () => {
			window.removeEventListener("resize", handle);
			window.removeEventListener("scroll", handle, true);
		};
	}, [visible, updatePosition]);

	const show = () => setVisible(true);
	const hide = () => setVisible(false);

	const bg = color?.bg ?? "#0f172a";
	const shadow = color?.shadow ?? "rgba(0,0,0,0.25)";

	return (
		<>
			<span
				ref={triggerRef}
				onMouseEnter={show}
				onMouseLeave={hide}
				onFocus={show}
				onBlur={hide}
				className="inline-flex"
			>
				{children}
			</span>

			{mounted &&
				createPortal(
					<AnimatePresence>
						{visible && (
							<motion.div
								key="tooltip"
								ref={tooltipRef}
								initial={{ opacity: 0, y: position.placement === "top" ? 4 : -4, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: position.placement === "top" ? 4 : -4, scale: 0.96 }}
								transition={{ duration: 0.14, ease: "easeOut" }}
								dir={position.dir}
								style={{
									position: "fixed",
									left: position.left,
									top: position.top,
									zIndex: 99999,
									pointerEvents: "none",
								}}
							>
								<div
									className="relative px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap text-white"
									style={{
										background: bg,
										boxShadow: `0 4px 14px ${shadow}, 0 1px 3px rgba(0,0,0,0.12)`,
										letterSpacing: "0.015em",
										direction: position.dir,
									}}
								>
									{label}

									<span
										style={{
											position: "absolute",
											left: position.arrowLeft,
											transform: "translateX(-50%)",
											width: 0,
											height: 0,
											display: "block",
											...(position.placement === "top"
												? {
														bottom: -4,
														borderLeft: "4px solid transparent",
														borderRight: "4px solid transparent",
														borderTop: `4px solid ${bg}`,
												  }
												: {
														top: -4,
														borderLeft: "4px solid transparent",
														borderRight: "4px solid transparent",
														borderBottom: `4px solid ${bg}`,
												  }),
										}}
									/>
								</div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body
				)}
		</>
	);
}

// ─────────────────────────────────────────────────────────────
// SINGLE ACTION BUTTON
// ─────────────────────────────────────────────────────────────
export function ActionButton({
	icon,
	tooltip,
	onClick,
	variant = "slate",
	size = "md",
	disabled = false,
	className,
}) {
	const v = VARIANTS[variant] || VARIANTS.slate;
	const sz = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-9 h-9";
	const iconSz = size === "sm" ? 12 : size === "lg" ? 18 : 15;

	const btn = (
		<motion.button
			type="button"
			onClick={disabled ? undefined : onClick}
			whileHover={disabled ? {} : { scale: 1.1 }}
			whileTap={disabled ? {} : { scale: 0.92 }}
			transition={{ type: "spring", stiffness: 380, damping: 18 }}
			className={cn(
				sz,
				"rounded-full border flex items-center justify-center",
				"transition-colors duration-150 shadow-sm",
				v.base,
				!disabled && v.hover,
				disabled && "opacity-35 cursor-not-allowed",
				className
			)}
		>
			{React.cloneElement(icon, { size: iconSz })}
		</motion.button>
	);

	if (!tooltip) return btn;

	return (
		<CustomTooltip label={tooltip} color={v.tooltip}>
			{btn}
		</CustomTooltip>
	);
}

// ─────────────────────────────────────────────────────────────
// ACTION BUTTONS GROUP
// ─────────────────────────────────────────────────────────────
export function ActionButtons({ row, actions = [], gap = "gap-1.5" }) {
	const { hasPermission } = useAuth();
	const visible = actions.filter((a) => {
		if (a.hidden) return false;
		if (a.permission && !hasPermission(a.permission)) return false;
		return true;
	});

	return (
		<div className={cn("flex items-center", gap)}>
			{visible.map((action, i) => (
				<ActionButton
					key={i}
					icon={action.icon}
					tooltip={action.tooltip}
					onClick={() => action.onClick?.(row)}
					variant={action.variant || "slate"}
					size={action.size || "md"}
					disabled={action.disabled}
					className={action.className}
				/>
			))}
		</div>
	);
}

export default ActionButtons;