"use client"

import * as React from "react"
import { cn } from "@/utils/cn"


function Input({
	classN,
	type,
	size = "default",
	startIcon,
	endIcon,
	error,
	...props
}) {
	const hasStart = Boolean(startIcon)
	const hasEnd = Boolean(endIcon)

	/* ── wrapper (only rendered when icons are present) ── */
	if (hasStart || hasEnd) {
		return (
			<div className="group relative flex w-full items-center">
				{/* Start icon */}
				{hasStart && (
					<span
						aria-hidden
						className="
            pointer-events-none absolute inset-y-0 start-3.5 z-10 flex items-center
            text-muted-foreground/60
            group-focus-within:text-[var(--primary)]
            dark:group-focus-within:text-[#5b4bff]
            transition-colors duration-200
          "
					>
						{startIcon}
					</span>
				)}

				<InputBase
					type={type}
					size={size}
					error={error}
					className={cn(
						hasStart && " ltr:!pl-10 rtl:!pr-10 ",
						hasEnd && "ltr:!pr-10 rtl:!pl-10"  , classN
					)}
					{...props}
				/>

				{/* End icon */}
				{hasEnd && (
					<span
						className="
            absolute inset-y-0 end-3.5 z-10 flex items-center
            text-muted-foreground/60
            group-focus-within:text-[var(--primary)]
            dark:group-focus-within:text-[#5b4bff]
            transition-colors duration-200
          "
					>
						{endIcon}
					</span>
				)}
			</div>
		);
	}

	return (
		<InputBase
			type={type}
			size={size}
			error={error}
			className={classN}
			{...props}
		/>
	)
}

/* ─── Core styled <input> ─────────────────────────────────────────────────── */
function InputBase({ className, size = "default", error, ...props }) {
	return (
		<input
			data-slot="input"
			data-size={size}
			className={cn(
				// layout
				"w-full min-w-0",
				// sizing
				"data-[size=sm]:h-9     data-[size=sm]:text-xs     data-[size=sm]:px-3",
				"data-[size=default]:h-10 data-[size=default]:text-sm data-[size=default]:px-3.5",
				"data-[size=lg]:h-12    data-[size=lg]:text-sm     data-[size=lg]:px-4",
				// shape + base colors
				"rounded-xl border border-border",
				"bg-background/60 text-foreground",
				// placeholder
				"placeholder:text-muted-foreground/50",
				// selection
				"selection:bg-[var(--primary)]/20 selection:text-foreground",
				// shadow + transition
				"shadow-sm transition-all duration-200",
				// hover
				"hover:border-[var(--primary)]/50 dark:hover:border-[#5b4bff]/50",
				"hover:bg-background",
				// focus — primary ring identical to Select
				"!outline-none",
				"focus:border-[var(--primary)] dark:focus:border-[#5b4bff]",
				"focus:bg-background",
				"focus:shadow-[0_0_0_3px_rgba(255,139,0,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(91,75,255,0.18)]",
				// file input
				"file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
				"file:inline-flex file:h-7 file:cursor-pointer",
				// disabled
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				// error state
				error && [
					"border-destructive",
					"focus:border-destructive",
					"focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]",
				],
				// aria-invalid (same as error)
				"aria-invalid:border-destructive",
				"aria-invalid:focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" , className
			)}
			{...props}
		/>
	)
}

export { Input, InputBase }