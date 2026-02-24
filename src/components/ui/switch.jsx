"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { useLocale } from "next-intl";

// RTL locales list — add yours here
const RTL_LOCALES = ["ar", "he", "fa", "ur"];

function Switch({ className, checked, defaultChecked, onCheckedChange, ...props }) {
	const locale = useLocale();
	const isRTL = RTL_LOCALES.includes(locale);

	// Keep internal state so Framer knows what to animate
	const [isChecked, setIsChecked] = React.useState(
		checked !== undefined ? checked : (defaultChecked ?? false)
	);

	// Stay in sync with controlled usage
	React.useEffect(() => {
		if (checked !== undefined) setIsChecked(checked);
	}, [checked]);

	const handleCheckedChange = (val) => {
		if (checked === undefined) setIsChecked(val);
		onCheckedChange?.(val);
	};

	// Thumb travel: track 44px − 2×padding 2px − thumb 20px = 20px
	const TRAVEL = 20;
	const thumbX = isChecked ? (isRTL ? -TRAVEL : TRAVEL) : 0;

	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			checked={isChecked}
			onCheckedChange={handleCheckedChange}
			className={cn(
				"peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full",
				"border border-transparent outline-none",
				"h-[27px] w-[48px] p-[2px]",
				"focus-visible:ring-4 focus-visible:ring-ring/30",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			{...props}
		>
			{/* ── Track ── animated bg + glow */}
			<motion.span
				aria-hidden="true"
				className="absolute inset-0 rounded-full"
				animate={{
					backgroundColor: isChecked
						? "var(--primary)"
						: "var(--input)",
					boxShadow: isChecked
						? "0 0 14px 3px var(--primary / 0.35)"
						: "0 0 0px 0px var(--primary / 0)",
				}}
				transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
			/>

			{/* ── Shimmer sweep — fires once when toggled on ── */}
			<AnimatePresence>
				{isChecked && (
					<motion.span
						key="shimmer"
						aria-hidden="true"
						className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
						initial={{ opacity: 1 }}
						exit={{ opacity: 0, transition: { duration: 0.1 } }}
					>
						<motion.span
							className="absolute inset-0 rounded-full"
							style={{
								background:
									"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)",
							}}
							initial={{ x: "-100%" }}
							animate={{ x: "200%" }}
							transition={{ duration: 0.5, ease: "easeOut" }}
						/>
					</motion.span>
				)}
			</AnimatePresence>

			{/* ── Ripple burst from thumb position on check ── */}
			<AnimatePresence>
				{isChecked && (
					<motion.span
						key={`ripple-${Date.now()}`}
						aria-hidden="true"
						className="absolute top-1/2 rounded-full pointer-events-none"
						style={{
							width: 20,
							height: 20,
							marginTop: -10,
							backgroundColor: "var(--primary / 0.35)",
							...(isRTL
								? { left: 2, right: "auto" }
								: { right: 2, left: "auto" }),
						}}
						initial={{ scale: 0.5, opacity: 0.9 }}
						animate={{ scale: 2.6, opacity: 0 }}
						transition={{ duration: 0.5, ease: "easeOut" }}
					/>
				)}
			</AnimatePresence>

			{/* ── Thumb ── spring motion + squish on press ── */}
			<SwitchPrimitive.Thumb asChild>
				<motion.span
					data-slot="switch-thumb"
					className={cn(
						"pointer-events-none relative block h-5 w-5 rounded-full bg-background",
						// Subtle inner highlight
						"after:absolute after:inset-[2px] after:rounded-full",
						"after:bg-gradient-to-br after:from-white/60 after:to-transparent"
					)}
					animate={{
						x: thumbX,
						boxShadow: isChecked
							? "0 2px 8px rgba(0,0,0,0.22), 0 0 6px var(--primary / 0.45)"
							: "0 1px 4px rgba(0,0,0,0.18)",
					}}
					whileTap={{
						scaleX: 1.28,
						scaleY: 0.85,
					}}
					transition={{
						x: {
							type: "spring",
							stiffness: 520,
							damping: 28,
							mass: 0.75,
						},
						scaleX: { duration: 0.1, ease: "easeOut" },
						scaleY: { duration: 0.1, ease: "easeOut" },
						boxShadow: { duration: 0.3 },
					}}
				/>
			</SwitchPrimitive.Thumb>
		</SwitchPrimitive.Root>
	);
}

export { Switch };