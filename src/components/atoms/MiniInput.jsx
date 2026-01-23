import React, { memo } from "react";
import { cn } from "../../utils/cn";

const MiniInput = memo(function MiniInput({
	value,
	placeholder,
	inputMode,
	onChange,
	onBlur,
	className = "",
	type = "text",
}) {
	const hasValue = String(value ?? "").trim().length > 0;

	return (
		<div className="relative w-full">
			{/* Floating label */}
			<label
				className={cn(
					"absolute left-2 px-1 text-[10px] transition-all pointer-events-none",
					// make it blend with inputs that often have light bg
					"bg-[linear-gradient(to_bottom,transparent_50%,transparent_50%)]",
					hasValue
						? "top-[-6px] text-primary bg-[linear-gradient(to_bottom,#f1f5f9_50%,#ffffff_50%)]"
						: "top-1/2 -translate-y-1/2 text-muted-foreground opacity-0"
				)}
			>
				{placeholder}
			</label>

			<input
				value={value ?? ""}
				inputMode={inputMode}
				type={type}
				placeholder={hasValue ? "" : placeholder}
				onChange={onChange}
				onBlur={onBlur}
				className={cn(
					"h-8 w-full rounded-md border px-2 text-[12px]",
					"bg-white outline-none transition",
					"focus:ring-4 focus:ring-primary/20 focus:border-primary",
					hasValue
						? "border-primary/40 hover:border-primary/60"
						: "border-border hover:border-foreground/30",
					className
				)}
			/>
		</div>
	);
});

export default MiniInput;
