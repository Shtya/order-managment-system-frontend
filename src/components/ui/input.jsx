"use client"

import * as React from "react"
import { cn } from "@/utils/cn"

export const fieldBase = [
	// shape + base colors
	"w-full min-w-0 !rounded-md",
	"border border-border",
	"!bg-background/60 !text-foreground text-sm",
	"placeholder:text-muted-foreground/80",
	"transition-all duration-200",
	"hover:border-[var(--primary)]/50 hover:bg-background",
	"!outline-none",
	"focus:border-[var(--primary)] focus:bg-background",
	"focus:shadow-[0_0_0_3px_rgb(var(--primary-shadow))]",
	"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
]

export const fieldError = [
	"border-destructive",
	"focus:border-destructive",
	"focus:shadow-[0_0_0_3px_oklch(var(--destructive)/0.15)]",
]

function Input({
	className,
	type,
	size = "default",
	startIcon,
	endIcon,
	error,
	...props
}) {
	const hasStart = Boolean(startIcon)
	const hasEnd = Boolean(endIcon)

	if (hasStart || hasEnd) {
		return (
			<div className="group relative flex w-full items-center">
				{hasStart && (
					<span
						aria-hidden
						className="pointer-events-none absolute inset-y-0 start-3.5 z-10 flex items-center
                       text-muted-foreground/80group-focus-within:text-[var(--primary)]
                       dark:group-focus-within:text-[#5b4bff] transition-colors duration-200"
					>
						{startIcon}
					</span>
				)}

				<InputBase
					type={type}
					size={size}
					error={error}
					className={cn(
						hasStart && " ltr:pe-11 rtl:ps-11 ",
						hasEnd && "rtl:pe-11 ltr:ps-11 ",
						className
					)}
					{...props}
				/>

				{hasEnd && (
					<span
						aria-hidden
						className="pointer-events-none absolute inset-y-0 end-3.5 z-10 flex items-center
                       text-muted-foreground/80group-focus-within:text-[var(--primary)]
                       dark:group-focus-within:text-[#5b4bff] transition-colors duration-200"
					>
						{endIcon}
					</span>
				)}
			</div>
		)
	}

	return <InputBase type={type} size={size} error={error} className={className} {...props} />
}

function InputBase({ className, size = "default", error, ...props }) {
	return (
		<input
			data-slot="input"
			data-size={size}
			className={cn(
				"w-full min-w-0 !rounded-md border border-border bg-background/60 text-foreground",
				"placeholder:text-muted-foreground/80transition-all duration-200",
				"hover:border-[var(--primary)]/50 dark:hover:border-[#5b4bff]/50 hover:bg-background",
				"!outline-none focus:border-[var(--primary)] dark:focus:border-[#5b4bff] focus:bg-background",
				"focus:shadow-[0_0_0_3px_rgba(255,139,0,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(91,75,255,0.18)]",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				" data-[size=sm]:text-xs data-[size=sm]:px-3",
				"data- !h-10 data-[size=default]:text-sm data-[size=default]:px-3.5",
				"  data-[size=lg]:text-sm data-[size=lg]:px-4",
				error && "border-destructive focus:border-destructive",
				className // ✅ LAST so it can override
			)}
			{...props}
		/>
	)
}

export { Input, InputBase }