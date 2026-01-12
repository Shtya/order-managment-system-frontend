"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";

const SIZES = {
	sm: { btn: "h-10 px-3 text-sm", iconWrap: "w-7 h-7", icon: "text-[16px]" },
	md: { btn: "h-12 px-4 text-base", iconWrap: "w-8 h-8", icon: "text-[18px]" },
	lg: { btn: "h-14 px-5 text-lg", iconWrap: "w-9 h-9", icon: "text-[20px]" },
};

// ✅ tone is ONE level only (no nested variants)
const TONES = {
	purple: {
		btn: "bg-primary1 text-white border-white/10",
		ring: "focus-visible:ring-white/30 focus-visible:ring-offset-transparent",
		iconWrap: "  text-white",
		glow: "opacity-70",
	},

	white: {
		// light: white button, dark: still looks good
		btn:
			"bg-white text-neutral-900 border-black/10 " +
			"dark:bg-white/10 dark:text-white dark:border-white/15 backdrop-blur",
		ring:
			"focus-visible:ring-black/20 focus-visible:ring-offset-transparent " +
			"dark:focus-visible:ring-white/25 dark:focus-visible:ring-offset-transparent",
		iconWrap:
			"  text-neutral-900 " +
			"dark:bg-white/10 dark:border-white/15 dark:text-white",
		glow: "opacity-35 dark:opacity-50",
	},

	black: {
		btn:
			"bg-neutral-950 text-white border-white/10 " +
			"dark:bg-black dark:text-white dark:border-white/10",
		ring: "focus-visible:ring-white/20 focus-visible:ring-offset-transparent",
		iconWrap: "  text-white",
		glow: "opacity-55",
	},
};

export default function Button_({
	label,
	icon,
	href,
	tone = "purple",
	size = "md",
	rounded = "full",
	className = "",
	disabled = false,
	type = "button",
	onClick,
	...rest
}) {
	const s = SIZES[size] || SIZES.md;
	const roundedCls = rounded === "xl" ? "rounded-xl" : "rounded-3xl";
	const router = useRouter()

	const theme = TONES[tone] || TONES.purple;

	const base =
		"relative cursor-pointer hover:scale-[1.04] duration-300 inline-flex items-center justify-center gap-1 select-none " +
		"font-semibold tracking-tight " +
		"focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
		"active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed " +
		"shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] " +
		"hover:shadow-[0_16px_45px_-22px_rgba(0,0,0,0.65)] " +
		"overflow-hidden";

	return (
		<motion.button
			type={type}
			disabled={disabled}
			onClick={() => href ? router?.push(href) : onClick}
			whileHover={!disabled ? { y: -1, scale: 1.01 } : undefined}
			whileTap={!disabled ? { scale: 0.98 } : undefined}
			transition={{ type: "spring", stiffness: 500, damping: 30 }}
			className={[
				base,
				theme.ring,
				roundedCls,
				s.btn,
				"border",
				theme.btn,
				className,
			].join(" ")}
			{...rest}
		>
			{/* Glow / shine */}
			<span
				aria-hidden
				className={[
					"pointer-events-none absolute inset-0",
					theme.glow || "opacity-60",
				].join(" ")}
				style={{
					background:
						"radial-gradient(1200px circle at 20% 20%, rgba(255,255,255,0.22), transparent 45%)," +
						"radial-gradient(900px circle at 80% 0%, rgba(255,255,255,0.14), transparent 40%)",
				}}
			/>

			{icon ? (
				<span
					className={[
						"relative rtl:!mr-[-6px] ltr:!ml-[-6px] grid place-items-center",
						roundedCls,
						s.iconWrap,
 						theme.iconWrap,
					].join(" ")}
				>
					<span className={["leading-none", s.icon].join(" ")}>{icon}</span>
				</span>
			) : null}

			<span className="relative whitespace-nowrap">{label}</span>
		</motion.button>
	);
}
