"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/utils/cn"

// Custom animated check icon
const AnimatedCheckIcon = () => (
	<motion.svg
		width="20"
		height="20"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		initial="hidden"
		animate="visible"
	>
		<motion.path
			d="M3 8L6.5 11.5L13 4.5"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			variants={{
				hidden: { pathLength: 0, opacity: 0 },
				visible: {
					pathLength: 1,
					opacity: 1,
					transition: {
						pathLength: { type: "spring", duration: 0.6, bounce: 0.3 },
						opacity: { duration: 0.2 }
					}
				}
			}}
		/>
	</motion.svg>
)

function Checkbox({
	className,
	...props
}) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"peer relative border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-7 shrink-0 rounded-sm border shadow-xs transition-all duration-200 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 active:scale-95",
				className
			)}
			{...props}>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="grid place-content-center text-current"
				asChild
			>
				<AnimatePresence mode="wait">
					<motion.div
						key="check"
						initial={{ scale: 0, rotate: -180 }}
						animate={{ scale: 1, rotate: 0 }}
						exit={{ scale: 0, rotate: 180 }}
						transition={{
							type: "spring",
							stiffness: 500,
							damping: 25
						}}
						className=" flex justify-center "
					>
						<AnimatedCheckIcon />
					</motion.div>
				</AnimatePresence>
			</CheckboxPrimitive.Indicator>

			{/* Ripple effect on check */}
			<CheckboxPrimitive.Indicator asChild>
				<motion.div
					className="absolute inset-0 rounded-md bg-primary/20"
					initial={{ scale: 1, opacity: 0.5 }}
					animate={{ scale: 1.5, opacity: 0 }}
					transition={{ duration: 0.4 }}
				/>
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox }