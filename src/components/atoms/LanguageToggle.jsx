"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { cn } from "@/utils/cn";

export default function LanguageToggle({
	isFixed = false,
	currentLang = "ar",
	onToggle,
	languages = { ar: "العربية", en: "English" },
	position = { top: "1rem", right: "1rem" },
	className = "",
}) {
	const otherLang = useMemo(() => {
		const keys = Object.keys(languages || {});
		return keys.find((l) => l !== currentLang) || keys[0] || "";
	}, [languages, currentLang]);

	return (
		<motion.button
			type="button"
			onClick={onToggle}
			aria-label="Toggle language"
			whileTap={{ scale: 0.95 }}
			initial={{ opacity: 0, y: -12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			style={
				isFixed
					? {
						top: position.top,
						right: position.right,
						bottom: position.bottom,
						left: position.left,
					}
					: undefined
			}
			className={cn(
				"group",
				isFixed ? "fixed" : "relative",
				"flex items-center gap-3 rounded-md px-4 py-2",
				"border border-gray-200 dark:border-slate-700 transition-all duration-300",
 				"bg-white hover:bg-gray-100  text-gray-800",
				// Dark
				"dark:bg-slate-800 dark:hover:bg-slate-700  dark:text-slate-100",
				className
			)}
		>
			{/* Globe icon with subtle separators */}
			<div className="relative h-6 flex items-center">
				<div className="absolute -left-2 top-1/2 h-4 w-px -translate-y-1/2 bg-gray-200 dark:bg-slate-700" />
				<motion.div
					animate={{ rotate: currentLang === Object.keys(languages)[0] ? 0 : 360 }}
					transition={{ duration: 0.5 }}
				>
					<Globe
						className={cn(
							"text-lg transition-colors",
							"text-gray-700 group-hover:text-[rgb(var(--primary))]",
							"dark:text-slate-200 dark:group-hover:text-[rgb(var(--primary))]"
						)}
						size={18}
					/>
				</motion.div>
				<div className="absolute -right-2 top-1/2 h-4 w-px -translate-y-1/2 bg-gray-200 dark:bg-slate-700" />
			</div>

			{/* Target language */}
			<motion.div className="relative py-1 rounded-md transition-colors">
				<AnimatePresence mode="wait">
					<motion.span
						key={`target-${otherLang}`}
						className={cn(
							"uppercase block text-sm font-semibold",
							"text-gray-800 group-hover:text-[rgb(var(--primary))]",
							"dark:text-slate-100 dark:group-hover:text-[rgb(var(--primary))]"
						)}
						initial={{ opacity: 0, x: 6 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -6 }}
						transition={{ duration: 0.15 }}
					>
						{otherLang}
					</motion.span>
				</AnimatePresence>
			</motion.div>
		</motion.button>
	);
}
