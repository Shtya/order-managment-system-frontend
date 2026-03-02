"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, ScanLine, CheckCircle2, XCircle, ChevronDown, Package } from "lucide-react";
import { cn } from "@/utils/cn";

// ── Carrier color map ────────────────────────────────────────────────────────
const CARRIER_META = {
	ARAMEX:       { color: "#ef4444", bg: "#fef2f2", label: "أرامكس" },
	SMSA:         { color: "#3b82f6", bg: "#eff6ff", label: "SMSA" },
	DHL:          { color: "#eab308", bg: "#fefce8", label: "DHL" },
	BOSTA:        { color: "#f97316", bg: "#fff7ed", label: "بوسطة" },
	DEFAULT:      { color: "#ff8b00", bg: "#fff8f0", label: "" },
};

function getCarrierMeta(carrier = "") {
	const key = carrier.toUpperCase().replace(/\s/g, "");
	return CARRIER_META[key] || { ...CARRIER_META.DEFAULT, label: carrier };
}

// ── Tiny dot indicator ───────────────────────────────────────────────────────
function CarrierDot({ carrier, size = 8 }) {
	const { color } = getCarrierMeta(carrier);
	return (
		<span style={{
			display: "inline-block", width: size, height: size,
			borderRadius: "50%", background: color, flexShrink: 0,
		}} />
	);
}

// ── Order count badge ────────────────────────────────────────────────────────
function CountBadge({ count, color, small = false }) {
	if (!count) return null;
	return (
		<span style={{
			fontSize: small ? 9 : 10, fontWeight: 800,
			padding: small ? "1px 5px" : "2px 7px",
			borderRadius: 20,
			background: color + "18",
			color,
			border: `1px solid ${color}30`,
			letterSpacing: "0.02em",
			lineHeight: 1.4,
		}}>
			{count}
		</span>
	);
}

// ── Custom floating select trigger (sits inside scan input border) ────────────
function CarrierSelect({ CARRIERS, preparedOrders, value, onChange }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	const meta = value ? getCarrierMeta(value) : null;
	const count = value ? preparedOrders.filter(o => o.carrier === value).length : null;

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	return (
		<div ref={ref} style={{ position: "relative", flexShrink: 0 }}>

			{/* ── Trigger button ── */}
			<motion.button
				type="button"
				onClick={() => setOpen(v => !v)}
				whileTap={{ scale: 0.97 }}
				style={{
					display: "flex", alignItems: "center", gap: 7,
					height: 34, paddingInline: "10px 8px",
					borderRadius: 10,
					border: `1.5px solid ${open ? (meta?.color || "#ff8b00") + "60" : "rgba(0,0,0,0.07)"}`,
					background: open
						? (meta?.color || "#ff8b00") + "0d"
						: value ? meta.bg + "cc" : "#f8fafc",
					cursor: "pointer",
					transition: "all 0.18s ease",
					boxShadow: open ? `0 0 0 3px ${(meta?.color || "#ff8b00")}14` : "none",
					minWidth: 140,
					whiteSpace: "nowrap",
				}}
			>
				{/* Left: dot + label */}
				<div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
					{value ? (
						<>
							<CarrierDot carrier={value} size={7} />
							<span style={{
								fontSize: 12, fontWeight: 700,
								color: meta.color,
								letterSpacing: "0.01em",
							}}>
								{value}
							</span>
							<CountBadge count={count} color={meta.color} small />
						</>
					) : (
						<>
							<Truck size={12} color="#94a3b8" />
							<span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
								شركة الشحن
							</span>
						</>
					)}
				</div>

				{/* Chevron */}
				<motion.div
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ duration: 0.2, ease: "easeInOut" }}
				>
					<ChevronDown size={12} color={value ? meta.color : "#94a3b8"} strokeWidth={2.5} />
				</motion.div>
			</motion.button>

			{/* ── Dropdown panel ── */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: 6, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 4, scale: 0.97 }}
						transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
						style={{
							position: "absolute",
							// float ABOVE the trigger (since trigger is at bottom of input)
							bottom: "calc(100% + 8px)",
							insetInlineStart: 0,
							minWidth: 210,
							background: "#fff",
							border: "1.5px solid rgba(0,0,0,0.08)",
							borderRadius: 16,
							boxShadow: "0 8px 32px -4px rgba(0,0,0,0.14), 0 2px 8px -2px rgba(0,0,0,0.08)",
							padding: 6,
							zIndex: 9999,
							overflow: "hidden",
						}}
					>
						{/* Header label */}
						<div style={{
							padding: "6px 10px 8px",
							fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
							textTransform: "uppercase", color: "#94a3b8",
							borderBottom: "1px solid #f1f5f9",
							marginBottom: 4,
							display: "flex", alignItems: "center", gap: 5,
						}}>
							<Truck size={9} color="#ff8b00" />
							اختر شركة الشحن
						</div>

						{CARRIERS.map((c, idx) => {
							const m = getCarrierMeta(c);
							const cnt = preparedOrders.filter(o => o.carrier === c).length;
							const isSelected = value === c;
							const hasOrders = cnt > 0;

							return (
								<motion.button
									key={c}
									type="button"
									initial={{ opacity: 0, x: -6 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: idx * 0.04, duration: 0.15 }}
									onClick={() => { onChange(c); setOpen(false); }}
									whileHover={{ x: 2 }}
									style={{
										width: "100%", display: "flex", alignItems: "center", gap: 10,
										padding: "8px 10px",
										borderRadius: 10,
										border: "none",
										cursor: "pointer",
										background: isSelected ? m.color + "12" : "transparent",
										transition: "background 0.12s ease",
										textAlign: "start",
									}}
									onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
									onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
								>
									{/* Color dot */}
									<div style={{
										width: 30, height: 30, borderRadius: 9,
										background: m.color + "14",
										border: `1.5px solid ${m.color}25`,
										display: "flex", alignItems: "center", justifyContent: "center",
										flexShrink: 0,
										transition: "all 0.15s ease",
									}}>
										<Truck size={13} color={m.color} />
									</div>

									{/* Name + bar */}
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{
											fontSize: 13, fontWeight: 700,
											color: isSelected ? m.color : "#334155",
										}}>
											{c}
										</div>
										{/* Mini progress bar showing how many orders */}
										{hasOrders && (
											<div style={{
												marginTop: 3, height: 3, borderRadius: 99,
												background: "#e2e8f0", overflow: "hidden",
												width: "100%",
											}}>
												<motion.div
													initial={{ width: 0 }}
													animate={{ width: `${Math.min((cnt / Math.max(preparedOrders.length, 1)) * 100, 100)}%` }}
													transition={{ delay: idx * 0.04 + 0.1, duration: 0.4, ease: "easeOut" }}
													style={{ height: "100%", borderRadius: 99, background: m.color }}
												/>
											</div>
										)}
									</div>

									{/* Count badge */}
									<CountBadge count={cnt} color={hasOrders ? m.color : "#94a3b8"} />

									{/* Selected check */}
									{isSelected && (
										<motion.div
											initial={{ scale: 0 }} animate={{ scale: 1 }}
											style={{
												width: 18, height: 18, borderRadius: "50%",
												background: m.color, flexShrink: 0,
												display: "flex", alignItems: "center", justifyContent: "center",
											}}
										>
											<CheckCircle2 size={11} color="#fff" strokeWidth={2.5} />
										</motion.div>
									)}
								</motion.button>
							);
						})}

						{/* Footer: total */}
						<div style={{
							marginTop: 4, padding: "6px 10px 2px",
							borderTop: "1px solid #f1f5f9",
							display: "flex", alignItems: "center", gap: 5,
							fontSize: 10, color: "#94a3b8", fontWeight: 600,
						}}>
							<Package size={10} />
							{preparedOrders.length} طلب إجمالاً
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ── Main ScanBar ─────────────────────────────────────────────────────────────
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
	className ,
	cnLabel
}) {
	const isSuccess = lastScanMsg?.success === true;
	const isError   = lastScanMsg?.success === false;

	return (
		<div className={`px-5  py-4 flex flex-col gap-3 ${className}`}>

			{/* ── Label row ── */}
			<div className={`${cnLabel} flex items-center gap-1.5`}>
				<ScanLine size={11} style={{ color: "#ff8b00" }} />
				<span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
					مسح الباركود
				</span>
			</div>

			{/* ── The unified input + floating select inside ── */}
			<div className={cn(
				"relative flex items-center rounded-2xl border-2 ring-4 ring-transparent transition-all duration-200 overflow-visible",
				isSuccess && "border-emerald-400 bg-emerald-50/30 ring-emerald-100",
				isError   && "border-red-400 bg-red-50/30 ring-red-100",
				!lastScanMsg && "border-slate-200  focus-within:border-[#ff8b00] focus-within:ring-[#ff8b00]/10",
			)} style={{ height: 52 }}>

				{/* Sweep shimmer while typing */}
				<AnimatePresence>
					{scanInput && !lastScanMsg && (
						<motion.div
							initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
							className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
						>
							<motion.div
								animate={{ x: ["−100%", "200%"] }}
								transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
								style={{
									position: "absolute", top: 0, bottom: 0, width: "40%",
									background: "linear-gradient(90deg, transparent, rgba(255,139,0,0.07), transparent)",
								}}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Floating carrier select — inset on the START side */}
				<div className="ps-2 flex-shrink-0 z-10">
					<CarrierSelect
						CARRIERS={CARRIERS}
						preparedOrders={preparedOrders}
						value={selectedCarrier}
						onChange={onCarrierChange}
					/>
				</div>

				{/* Divider */}
				<div style={{
					width: 1, height: 22, background: "#e2e8f0",
					flexShrink: 0, marginInline: 2,
				}} />

				{/* Text input */}
				<input
					ref={scanRef}
					value={scanInput}
					onChange={(e) => onScanChange(e.target.value)}
					onKeyDown={(e) => { if (e.key === "Enter") onScan(); }}
					placeholder="امسح الباركود أو اكتب الكود…"
					autoFocus
					style={{
						flex: 1, height: "100%",
						background: "transparent",
						border: "none", outline: "none",
						fontSize: 13, fontWeight: 600,
						color: "#1e293b",
						paddingInline: "10px 6px",
						letterSpacing: "0.01em",
					}}
					className="placeholder:text-slate-300 focus:ring-0"
				/>

				{/* Scan button — inset on END side */}
				<div className="pe-2 flex-shrink-0">
					<motion.button
						type="button"
						onClick={onScan}
						whileHover={{ scale: 1.04 }}
						whileTap={{ scale: 0.94 }}
						style={{
							height: 36, paddingInline: "14px",
							borderRadius: 12,
							border: "none", cursor: "pointer",
							background: "linear-gradient(135deg, #ff8b00 0%, #ff5c2b 100%)",
							color: "#fff",
							fontSize: 12, fontWeight: 800,
							display: "flex", alignItems: "center", gap: 6,
							boxShadow: "0 2px 10px -2px rgba(255,139,0,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
							transition: "box-shadow 0.15s ease",
							letterSpacing: "0.02em",
						}}
					>
						<ScanLine size={13} strokeWidth={2.5} />
						مسح
					</motion.button>
				</div>
			</div>

			{/* ── Status message ── */}
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
							"flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[12px] font-bold border",
							lastScanMsg.success
								? "bg-emerald-50 border-emerald-200/80 text-emerald-700"
								: "bg-red-50 border-red-200/80 text-red-600"
						)}>
							{lastScanMsg.success
								? <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-500" />
								: <XCircle size={14} className="flex-shrink-0 text-red-400" />
							}
							{lastScanMsg.message}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}