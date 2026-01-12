"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SwitcherTabs({
	items,
	activeId,
	onChange,
	className = "",
	itemClassName = "",
	activeClassName = "",
	inactiveClassName = "",
	underlineClassName = "",
	dir = "rtl",
}) {
	return (
		<div className={["w-full", className].join(" ")} >
			<div className="relative flex items-center justify-start  gap-10">
				{items.map((item) => {
					const Icon = item.icon;
					const isActive = item.id === activeId;

					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onChange?.(item.id)}
							className={[
								"relative flex items-center gap-2 py-4 select-none",
								"text-base font-semibold transition-colors",
								itemClassName,
								isActive
									? ["text-primary ", activeClassName].join(" ")
									: ["text-[#9CA3AF] hover:text-[#6B7280]", inactiveClassName].join(" "),
							].join(" ")}
						>
							{Icon ? (
								<Icon
									size={20}
									className={isActive ? "text-primary" : "text-[#9CA3AF]"}
								/>
							) : null}

							<span>{item.label}</span>

							{/* underline */}
							{isActive ? (
								<motion.div
									layoutId="pretty-switcher-underline"
									className={[
										"absolute left-0 right-0 -bottom-[1px] h-[3px] rounded-full bg-primary",
										underlineClassName,
									].join(" ")}
									transition={{ type: "spring", stiffness: 500, damping: 40 }}
								/>
							) : null}
						</button>
					);
				})}
			</div>

			{/* base line */}
			<div className="h-px w-full bg-gray-200 dark:bg-gray-800" />
		</div>
	);
}
