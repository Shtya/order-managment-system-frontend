import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";

const GAP = 8;          // space between trigger and dropdown
const MAX_MENU_H = 208; // ~ max-h-52

const MiniSelect = memo(function MiniSelect({
	value,
	placeholder,
	options = [], // [{ value, label, meta? }]
	onChange,
	className = "",
	disabled = false,
	searchable = false,
	searchPlaceholder = "بحث...",
	dir = "rtl",
}) {
	const rootRef = useRef(null);
	const btnRef = useRef(null);

	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const [pos, setPos] = useState({
		openUp: false,
		top: 0,
		left: 0,
		width: 0,
		maxHeight: MAX_MENU_H,
	});

	const selected = useMemo(
		() => options.find((o) => String(o.value) === String(value)) || null,
		[options, value]
	);

	const hasValue = Boolean(selected);

	const filtered = useMemo(() => {
		if (!searchable) return options;
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter((o) => String(o.label).toLowerCase().includes(q));
	}, [options, query, searchable]);

	// compute portal position
	const computePosition = () => {
		const el = btnRef.current;
		if (!el) return;

		const r = el.getBoundingClientRect();
		const viewportH = window.innerHeight;

		const spaceBelow = viewportH - r.bottom;
		const spaceAbove = r.top;

		// estimate menu height
		const rows = Math.min(filtered.length || 1, 8);
		const baseListH = rows * 36; // row height approx
		const searchH = searchable ? 48 : 0;
		const estH = Math.min(MAX_MENU_H, baseListH + searchH);

		const openUp = spaceBelow < estH + GAP && spaceAbove > spaceBelow;

		// max height based on available space in chosen direction
		const maxHeight = openUp
			? Math.max(120, Math.min(MAX_MENU_H, spaceAbove - GAP))
			: Math.max(120, Math.min(MAX_MENU_H, spaceBelow - GAP));

		const top = openUp ? r.top - GAP : r.bottom + GAP;

		setPos({
			openUp,
			top,
			left: r.left,
			width: r.width,
			maxHeight,
		});
	};

	// close on outside click (portal-aware)
	useEffect(() => {
		function onDocDown(e) {
			const root = rootRef.current;
			if (!root) return;

			// if click is inside trigger/root, ignore
			if (root.contains(e.target)) return;

			// if click is inside portal dropdown, ignore (we mark it with data-mini-select)
			const menu = document.querySelector('[data-mini-select-menu="1"]');
			if (menu && menu.contains(e.target)) return;

			setOpen(false);
		}

		document.addEventListener("mousedown", onDocDown);
		return () => document.removeEventListener("mousedown", onDocDown);
	}, []);

	// reset search when closing
	useEffect(() => {
		if (!open) setQuery("");
	}, [open]);

	// when open: compute position + update on resize/scroll
	useEffect(() => {
		if (!open) return;

		computePosition();

		const onRelayout = () => computePosition();
		window.addEventListener("resize", onRelayout);

		// capture scroll on any scrollable parent
		window.addEventListener("scroll", onRelayout, true);

		return () => {
			window.removeEventListener("resize", onRelayout);
			window.removeEventListener("scroll", onRelayout, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, searchable, filtered.length]);

	const handlePick = (v) => {
		onChange?.(v);
		setOpen(false);
	};

	const Menu = open ? (
		<div
			data-mini-select-menu="1"
			dir={dir}
			className={cn(
				"fixed z-[9999] rounded-md border shadow-lg overflow-hidden",
				// ✅ Dark mode aware background + border
				"bg-card border-border"
			)}
			style={{
				left: pos.left,
				top: pos.openUp ? undefined : pos.top,
				bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
				width: pos.width,
			}}
		>
			{searchable && (
				<div className="p-2 border-b border-border">
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={searchPlaceholder}
						className={cn(
							"h-8 w-full rounded-md border px-2 text-[12px]",
							// ✅ Dark mode aware input
							"bg-background text-foreground placeholder:text-muted-foreground",
							"outline-none transition border-border",
							"focus:ring-4 focus:ring-primary/20 focus:border-primary"
						)}
						autoFocus
					/>
				</div>
			)}

			<div className="overflow-auto" style={{ maxHeight: pos.maxHeight }}>
				{filtered.length === 0 ? (
					// ✅ Dark mode aware empty state
					<div className="p-3 text-xs text-muted-foreground">لا توجد نتائج</div>
				) : (
					filtered.map((opt) => {
						const isActive = String(opt.value) === String(value);
						return (
							<button
								key={String(opt.value)}
								type="button"
								onClick={() => handlePick(opt.value)}
								className={cn(
									"w-full text-left px-3 py-2 text-[12px] flex items-center justify-between",
									// ✅ Dark mode aware hover + active states
									"text-foreground hover:bg-primary/10 transition",
									isActive && "bg-primary/15 text-primary"
								)}
								role="option"
								aria-selected={isActive}
							>
								<span className="truncate">{opt.label}</span>
								{isActive && <span className="text-[10px] text-primary">✓</span>}
							</button>
						);
					})
				)}
			</div>
		</div>
	) : null;

	return (
		<div ref={rootRef} className={cn("relative w-[100px]", className)} dir={dir}>
			{/* Floating label */}
			<label
				className={cn(
					"absolute left-2 px-1 text-[10px] transition-all pointer-events-none z-10",
					hasValue
						// ✅ Dark mode aware floating label background
						? "top-[-6px] text-primary bg-[linear-gradient(to_bottom,hsl(var(--card))_50%,hsl(var(--background))_50%)]"
						: "top-1/2 -translate-y-1/2 text-muted-foreground opacity-0"
				)}
			>
				{placeholder}
			</label>

			{/* Trigger */}
			<button
				ref={btnRef}
				type="button"
				disabled={disabled}
				onClick={() => {
					if (disabled) return;
					setOpen((v) => !v);
				}}
				className={cn(
					"h-[40px] w-full rounded-md border px-2 text-[12px]",
					// ✅ Dark mode aware trigger
					"bg-background text-foreground",
					"outline-none transition flex items-center justify-between gap-2",
					"focus:ring-4 focus:ring-primary/20 focus:border-primary",
					hasValue
						? "border-primary/40 hover:border-primary/60"
						: "border-border hover:border-foreground/30",
					disabled && "opacity-60 cursor-not-allowed"
				)}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<span className={cn("truncate", !hasValue && "text-muted-foreground")}>
					{hasValue ? selected.label : placeholder}
				</span>
				<ChevronDown className={cn("h-4 w-4 text-muted-foreground transition shrink-0", open && "rotate-180")} />
			</button>

			{typeof document !== "undefined" ? createPortal(Menu, document.body) : null}
		</div>
	);
});

export default MiniSelect;
