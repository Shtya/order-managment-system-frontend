import { useTranslations } from "next-intl";
import React from "react";

export default function InfoCard({
	title,
	value,
	icon,
	bg,
	bgInlineLight,
	bgInlineDark,
	iconColor,
	iconColorInline,
	iconBorder,
	iconBorderInline,
	editable,
	isAddCard,
	onEdit,
	onDelete,
	onClick,
	customStyles,
}) {
	const t = useTranslations("orders");

	const handleClick = () => onClick?.();
	const handleEdit = (e) => { e.stopPropagation(); onEdit?.(); };
	const handleDelete = (e) => { e.stopPropagation(); onDelete?.(); };

	const Icon = icon;
	const accentColor = customStyles?.iconColor || iconColorInline;

	/* ── Add Card ─────────────────────────────────────────────────── */
	if (isAddCard) {
		return (
			<button
				onClick={handleClick}
				className="group relative w-full h-[75px]  rounded-xl overflow-hidden cursor-pointer
					border-2 border-dashed border-gray-200 dark:border-gray-700
					hover:border-gray-400 dark:hover:border-gray-500
					bg-gray-50/80 dark:bg-gray-900/80
					hover:bg-gray-100 dark:hover:bg-gray-800
					transition-all duration-300"
			>
				<div className="flex items-center justify-center gap-3 h-full px-5">
					<div
						className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700
							group-hover:bg-gray-300 dark:group-hover:bg-gray-600
							flex items-center justify-center flex-shrink-0
							group-hover:scale-110 transition-all duration-300"
					>
						<Icon size={16} className="text-gray-500 dark:text-gray-400" />
					</div>
					<span
						className="text-xs font-bold uppercase tracking-widest
							text-gray-400 dark:text-gray-500
							group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
					>
						{title}
					</span>
				</div>
			</button>
		);
	}

	/* ── Stat Card ────────────────────────────────────────────────── */
	return (
		<div
			onClick={editable ? handleClick : undefined}
			className={[
				"group relative w-full  rounded-xl overflow-hidden",
				"transition-all duration-300",
				editable ? "cursor-pointer hover:-translate-y-0.5" : "",
			].filter(Boolean).join(" ")}
		>
			{/* ── Light bg wash ── */}
			<div
				className="absolute inset-0 dark:hidden"
				style={{
					background: accentColor
						? `linear-gradient(135deg, ${accentColor}1a 0%, ${accentColor}06 60%, transparent 100%)`
						: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
				}}
			/>
			{/* ── Dark bg wash ── */}
			<div
				className="absolute inset-0 hidden dark:block"
				style={{
					background: accentColor
						? `linear-gradient(135deg, ${accentColor}28 0%, ${accentColor}0e 60%, transparent 100%)`
						: "linear-gradient(135deg, #1c2230 0%, #111827 100%)",
				}}
			/>

			{/* ── Glow top-right (flips in RTL via "end") ── */}
			{accentColor && (
				<div
					className="absolute -top-8 -end-8 w-28 h-28 rounded-full
						opacity-25 dark:opacity-20 blur-3xl pointer-events-none
						transition-opacity duration-300 group-hover:opacity-40 dark:group-hover:opacity-35"
					style={{ background: accentColor }}
				/>
			)}

			{/* ── Border ring ── */}
			<div
				className="absolute inset-0  rounded-xl pointer-events-none"
				style={{
					border: `1px solid ${accentColor ? accentColor + "28" : "rgba(0,0,0,0.07)"}`,
				}}
			/>

			{/* ── Bottom bar ── */}
			{accentColor && (
				<div className="absolute bottom-0 start-0 end-0 h-[2.5px] overflow-hidden">
					<div
						className="h-full w-3/5 opacity-50"
						style={{
							background: `linear-gradient(to right, ${accentColor}, transparent)`,
							/* flip gradient in RTL */
							transform: "var(--rtl-flip, none)",
						}}
					/>
				</div>
			)}

			{/* ── Content: single row ── */}
			<div className="relative flex items-center gap-3 px-4 py-4">

				{/* Icon bubble */}
				<div
					className="flex-shrink-0 w-11 h-11 rounded-xl
						flex items-center justify-center
						transition-transform duration-300 group-hover:scale-110"
					style={{
						background: accentColor ? `${accentColor}1e` : "rgba(0,0,0,0.05)",
						boxShadow: accentColor ? `0 0 0 1px ${accentColor}22` : "none",
					}}
				>
					<Icon
						size={21}
						style={{ color: accentColor || undefined }}
						className={!accentColor ? iconColor : ""}
					/>
				</div>

				{/* Text — grows */}
				<div className="flex-1 min-w-0">
					<div
						className="text-[22px] font-black leading-none tabular-nums tracking-tight"
						style={{ color: accentColor || undefined }}
					>
						{value}
					</div>
					<div className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 truncate">
						{title}
					</div>
				</div>

				{/* ── Editable zone ── */}
				{editable && (
					<div className="flex-shrink-0 flex items-center gap-1.5">
						{/* Custom badge */}
						<div
							className="flex items-center gap-1 px-2 py-1
								rounded-full text-[9px] font-bold uppercase tracking-wider
								bg-white/70 dark:bg-black/30
								border border-black/10 dark:border-white/10
								text-gray-500 dark:text-gray-400 backdrop-blur-sm
								transition-opacity duration-200
								opacity-100 group-hover:opacity-0 group-hover:pointer-events-none"
						>
							<span
								className="w-1.5 h-1.5 rounded-full"
								style={{ background: accentColor || "#888" }}
							/>
							{t("custom")}
						</div>

						{/* Edit + Delete — slide in on hover, respects RTL via translate-x direction */}
						<div
							className="absolute end-3 flex items-center gap-1
								opacity-0 group-hover:opacity-100
								translate-x-2 rtl:-translate-x-2
								group-hover:translate-x-0 rtl:group-hover:-translate-x-0
								transition-all duration-200"
						>
							<button
								onClick={handleEdit}
								className="w-8 h-8 rounded-xl flex items-center justify-center
									bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
									border border-black/10 dark:border-white/10
									text-blue-500 hover:text-white
									hover:bg-blue-500 dark:hover:bg-blue-500
									transition-all duration-150 shadow-sm"
								title={t("edit") || "Edit"}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
									fill="none" stroke="currentColor" strokeWidth="2.5"
									strokeLinecap="round" strokeLinejoin="round">
									<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
									<path d="m15 5 4 4" />
								</svg>
							</button>
							<button
								onClick={handleDelete}
								className="w-8 h-8 rounded-xl flex items-center justify-center
									bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
									border border-black/10 dark:border-white/10
									text-red-500 hover:text-white
									hover:bg-red-500 dark:hover:bg-red-500
									transition-all duration-150 shadow-sm"
								title={t("delete") || "Delete"}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
									fill="none" stroke="currentColor" strokeWidth="2.5"
									strokeLinecap="round" strokeLinejoin="round">
									<path d="M3 6h18" />
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
								</svg>
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}