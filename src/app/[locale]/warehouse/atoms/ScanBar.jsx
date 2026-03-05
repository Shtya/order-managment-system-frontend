"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, ScanLine, CheckCircle2, XCircle, ChevronDown, Package } from "lucide-react";
import { cn } from "@/utils/cn";

/* ─────────────────────────────────────────────────────────────────────────
	 Carrier meta — uses CSS vars for the default, static for named carriers
───────────────────────────────────────────────────────────────────────── */
const CARRIER_META = {
	ARAMEX: { color: "#ef4444" },
	SMSA: { color: "#3b82f6" },
	DHL: { color: "#eab308" },
	BOSTA: { color: "#f97316" },
};

function getCarrierMeta(carrier = "") {
	const key = carrier.toUpperCase().replace(/\s/g, "");
	return CARRIER_META[key] ?? { color: "var(--primary)" };
}

/* ─────────────────────────────────────────────────────────────────────────
	 Count badge
───────────────────────────────────────────────────────────────────────── */
function CountBadge({ count, color }) {
	if (!count) return null;
	return (
		<span
			className="text-[9px] font-black px-1.5 py-0.5 rounded-full border leading-none"
			style={{
				background: color + "15",
				color,
				borderColor: color + "30",
			}}
		>
			{count}
		</span>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
	 CarrierSelect — styled to match SelectTrigger / InputBase
───────────────────────────────────────────────────────────────────────── */
function CarrierSelect({ CARRIERS, preparedOrders, value, onChange }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	const meta = value ? getCarrierMeta(value) : null;
	const count = value ? preparedOrders.filter(o => o.carrier === value).length : null;

	useEffect(() => {
		if (!open) return;
		const handler = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	return (
		<div ref={ref} className="relative flex-shrink-0">

			{/* ── Trigger ── */}
			<button
				type="button"
				onClick={() => setOpen(v => !v)}
				className={cn(
					// matches SelectTrigger base
					"group relative inline-flex items-center gap-2 h-10 px-3 rounded-xl",
					"border border-border bg-background/60 text-sm transition-all duration-200",
					"hover:border-[var(--primary)]/50 hover:bg-background",
					"!outline-none",
					open && "border-[var(--primary)] bg-background shadow-[0_0_0_3px_rgb(var(--primary-shadow))]",
				)}
			>
				{/* left accent line (visible when open) */}
				<span
					aria-hidden
					className={cn(
						"absolute start-0 top-1.5 bottom-1.5 w-[2px] rounded-full",
						"bg-gradient-to-b from-[var(--primary)] to-[var(--third,#ff5c2b)]",
						"transition-opacity duration-200",
						open ? "opacity-100" : "opacity-0"
					)}
				/>

				{value ? (
					<span className="relative flex items-center gap-1.5">
						<span
							className="inline-block w-2 h-2 rounded-full flex-shrink-0"
							style={{ background: meta.color }}
						/>
						<span className="text-xs font-bold" style={{ color: meta.color }}>
							{value}
						</span>
						<CountBadge count={count} color={meta.color} />
					</span>
				) : (
					<span className="relative flex items-center gap-1.5 text-muted-foreground/60">
						<Truck size={12} />
						<span className="text-xs font-semibold">شركة الشحن</span>
					</span>
				)}

				<motion.div
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ duration: 0.2, ease: "easeInOut" }}
					className="relative"
				>
					<ChevronDown
						size={12}
						strokeWidth={2.5}
						className={cn(
							"transition-colors duration-200",
							open ? "text-[var(--primary)]" : "text-muted-foreground/60"
						)}
					/>
				</motion.div>
			</button>

			{/* ── Dropdown panel — matches SelectContent ── */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: 6, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 4, scale: 0.97 }}
						transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
						className={cn(
							"absolute z-[9999] overflow-hidden",
							"bottom-[calc(100%+8px)] start-0 min-w-[210px]",
							// matches SelectContent
							"rounded-xl border border-[var(--primary)]/20",
							"bg-popover/95 backdrop-blur-sm text-popover-foreground",
							"shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]",
							"dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3)]",
						)}
					>
						{/* top gradient accent bar */}
						<div
							aria-hidden
							className="absolute inset-x-0 top-0 h-[2px]
                bg-gradient-to-r from-[var(--primary)] via-[var(--secondary,#ffb703)] to-[var(--third,#ff5c2b)]
                opacity-70"
						/>
						{/* inner sheen */}
						<div
							aria-hidden
							className="absolute inset-x-0 top-0 h-14
                bg-gradient-to-b from-white/[0.04] to-transparent dark:from-white/[0.03]
                pointer-events-none"
						/>

						{/* header label */}
						<div className="px-3 pt-3 pb-2 flex items-center gap-1.5
              text-[9px] font-black uppercase tracking-widest text-muted-foreground/60
              border-b border-border/40">
							<Truck size={9} className="text-[var(--primary)]" />
							اختر شركة الشحن
						</div>

						{/* items — matches SelectItem */}
						<div className="p-1.5 space-y-0.5">
							{CARRIERS.map((c, idx) => {
								const m = getCarrierMeta(c);
								const cnt = preparedOrders.filter(o => o.carrier === c).length;
								const isSelected = value === c;

								return (
									<motion.button
										key={c}
										type="button"
										initial={{ opacity: 0, x: -4 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: idx * 0.04, duration: 0.14 }}
										onClick={() => { onChange(c); setOpen(false); }}
										className={cn(
											"group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl",
											"text-sm cursor-default select-none outline-none transition-colors duration-150",
											"text-foreground/80",
											isSelected
												? "font-semibold"
												: "hover:bg-[var(--primary)]/8 hover:text-foreground",
										)}
										style={isSelected ? { color: m.color } : {}}
									>
										{/* hover shimmer */}
										<span
											aria-hidden
											className="pointer-events-none absolute inset-0 rounded-xl
                        bg-gradient-to-r from-[var(--primary)]/0 via-[var(--primary)]/6 to-[var(--primary)]/0
                        opacity-0 group-hover:opacity-100 transition-opacity duration-150"
										/>

										{/* icon bubble */}
										<div
											className="relative w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150"
											style={{
												background: isSelected ? m.color + "20" : "var(--muted)",
												border: `1.5px solid ${m.color}${isSelected ? "40" : "20"}`,
											}}
										>
											<Truck size={12} style={{ color: isSelected ? m.color : "var(--muted-foreground)" }} />
										</div>

										{/* name + progress */}
										<div className="flex-1 min-w-0">
											<div className="text-xs font-bold leading-none mb-1.5">{c}</div>
											{cnt > 0 && (
												<div className="h-[3px] rounded-full bg-border/40 overflow-hidden w-full">
													<motion.div
														initial={{ width: 0 }}
														animate={{ width: `${Math.min((cnt / Math.max(preparedOrders.length, 1)) * 100, 100)}%` }}
														transition={{ delay: idx * 0.04 + 0.1, duration: 0.4, ease: "easeOut" }}
														className="h-full rounded-full"
														style={{ background: m.color }}
													/>
												</div>
											)}
										</div>

										<CountBadge count={cnt} color={m.color} />

										{isSelected && (
											<motion.div
												initial={{ scale: 0 }} animate={{ scale: 1 }}
												transition={{ type: "spring", stiffness: 400, damping: 20 }}
												className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
												style={{ background: m.color }}
											>
												<CheckCircle2 size={9} color="#fff" strokeWidth={2.5} />
											</motion.div>
										)}
									</motion.button>
								);
							})}
						</div>

						{/* footer */}
						<div className="px-3 py-2 border-t border-border/40 flex items-center gap-1.5
              text-[10px] text-muted-foreground/60 font-semibold">
							<Package size={10} />
							{preparedOrders.length} طلب إجمالاً
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
	 ScanBar — outer wrapper styled like InputBase
───────────────────────────────────────────────────────────────────────── */
export default function ScanBar({
	CARRIERS = [],
	preparedOrders = [],
	selectedCarrier,
	onCarrierChange,
	scanInput,
	onScanChange,
	onScan,
	lastScanMsg,
	scanRef,
	className,
	cnLabel,
}) {
	const isSuccess = lastScanMsg?.success === true;
	const isError = lastScanMsg?.success === false;

	return (
		<div className={cn("flex z-[1000000000] relative flex-col gap-2.5", className)}>

			{/* label */}
			<div className={cn("flex items-center gap-1.5", cnLabel)}>
				<ScanLine size={11} className="text-[var(--primary)]" />
				<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
					مسح الباركود
				</span>
			</div>

			<div
				className={cn(
					"relative flex items-center gap-0 rounded-xl border transition-all duration-200 overflow-visible",
					"bg-background/60",
					// idle
					!lastScanMsg && [
						"border-border",
						"hover:border-[var(--primary)]/50 hover:bg-background",
						"focus-within:border-[var(--primary)] focus-within:bg-background",
						"focus-within:shadow-[0_0_0_3px_rgb(var(--primary-shadow))]",
					],
					// success
					isSuccess && "border-[oklch(0.6_0.2_145)] shadow-[0_0_0_3px_oklch(0.6_0.2_145/0.15)] bg-background",
					// error
					isError && "border-destructive shadow-[0_0_0_3px_oklch(var(--destructive)/0.15)] bg-background",
				)}
				style={{ height: 60 }}
			>
				{/* sweep shimmer while typing */}
				<AnimatePresence>
					{scanInput && !lastScanMsg && (
						<motion.div
							initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
							className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
						>
							<motion.div
								animate={{ x: ["-100%", "200%"] }}
								transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
								className="absolute inset-y-0 w-2/5"
								style={{
									background: "linear-gradient(90deg, transparent, rgb(var(--primary-from)/0.07), transparent)",
								}}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				{/* carrier select */}
				<div className="ps-2 flex-shrink-0 z-10">
					<CarrierSelect
						CARRIERS={CARRIERS}
						preparedOrders={preparedOrders}
						value={selectedCarrier}
						onChange={onCarrierChange}
					/>
				</div>

				{/* divider */}
				<div className="w-px h-5 bg-border/60 flex-shrink-0 mx-1.5" />

				<input
					ref={scanRef}
					value={scanInput}
					onChange={(e) => onScanChange(e.target.value)}
					onKeyDown={(e) => { if (e.key === "Enter") onScan(); }}
					placeholder="امسح الباركود أو اكتب الكود…"
					autoFocus
					className={cn(
						"flex-1 h-full bg-transparent border-none !outline-none focus:ring-0",
						"text-sm font-semibold text-foreground",
						"placeholder:text-muted-foreground/50",
						"px-2",
					)}
				/>

				{/* scan button */}
				<div className="pe-2 flex-shrink-0">
					<motion.button
						type="button"
						onClick={onScan}
						whileHover={{ scale: 1.03 }}
						whileTap={{ scale: 0.95 }}
						className="relative h-10 px-3.5 rounded-xl border-none cursor-pointer
              text-primary-foreground text-xs font-black flex items-center gap-1.5
              overflow-hidden"
						style={{
							background: "linear-gradient(135deg, var(--primary) 0%, var(--third, #ff5c2b) 100%)",
							boxShadow: "0 2px 10px -2px rgb(var(--primary-shadow)), inset 0 1px 0 rgba(255,255,255,0.2)",
						}}
					>
						{/* inner top sheen */}
						<span
							aria-hidden
							className="pointer-events-none absolute inset-x-0 top-0 h-1/2
                bg-gradient-to-b from-white/20 to-transparent rounded-t-xl"
						/>
						<ScanLine size={12} strokeWidth={2.5} className="relative" />
						<span className="relative">مسح</span>
					</motion.button>
				</div>
			</div>

			{/* ── status message ── */}
			<AnimatePresence>
				{lastScanMsg && (
					<motion.div
						initial={{ opacity: 0, y: -6, height: 0 }}
						animate={{ opacity: 1, y: 0, height: "auto" }}
						exit={{ opacity: 0, y: -4, height: 0 }}
						transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
						style={{ overflow: "hidden" }}
					>
						<div className={cn(
							"flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border",
							isSuccess
								? "bg-[oklch(0.6_0.2_145/0.08)] border-[oklch(0.6_0.2_145/0.3)] text-[oklch(0.55_0.18_145)]"
								: "bg-destructive/[0.07] border-destructive/30 text-destructive",
						)}>
							{isSuccess
								? <CheckCircle2 size={13} className="flex-shrink-0" />
								: <XCircle size={13} className="flex-shrink-0" />
							}
							{lastScanMsg.message}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}