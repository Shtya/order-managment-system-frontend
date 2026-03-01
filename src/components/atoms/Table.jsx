"use client";

import React, {
	memo, useState, useCallback, useMemo, useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

import {
	Table as ShadTable,
	TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import {
	Search, Filter, Download,
	ChevronDown, ChevronLeft, ChevronRight,
	ChevronsLeft, ChevronsRight,
	Image as ImageIcon, X, Maximize2, SlidersHorizontal,
} from "lucide-react";

import { baseImg } from "@/utils/axios";

const ACTION_KEYS = new Set(["actions", "options"]);
const DEFAULT_PER_PAGE_OPTIONS = [6, 12, 24, 48];

const ACTION_COLORS = {
	primary: "btn btn-solid btn-sm",
	emerald: "btn btn-solid btn-sm btn-emerald",
	blue:    "btn btn-solid btn-sm btn-blue",
	purple:  "btn btn-solid btn-sm btn-purple",
	rose:    "btn btn-solid btn-sm btn-rose",
	amber:   "btn btn-solid btn-sm btn-amber",
	default: "btn btn-ghost  btn-sm btn-default !border !border-slate-100 !border-[1px] ",
};

function toFullSrc(src) {
	if (!src) return "";
	return src.startsWith("http") ? src : baseImg + src;
}

function normalizeImages(value, fallbackAlt = "") {
	if (!value) return [];
	if (typeof value === "string") return [{ src: value, alt: fallbackAlt }];
	if (Array.isArray(value)) {
		return value.map((v) => {
			if (!v) return null;
			if (typeof v === "string") return { src: v, alt: fallbackAlt };
			if (typeof v === "object") {
				const src = v.url ?? v.src;
				return src ? { src, alt: v.alt ?? fallbackAlt } : null;
			}
			return null;
		}).filter(Boolean);
	}
	if (typeof value === "object") {
		const src = value.url ?? value.src;
		if (src) return [{ src, alt: value.alt ?? fallbackAlt }];
	}
	return [];
}

function useIsRTL() {
	const [isRTL, setIsRTL] = useState(false);
	useEffect(() => { setIsRTL(document.documentElement.dir === "rtl"); }, []);
	return isRTL;
}

export function FilterField({ label, children, className }) {
	return (
		<div className={cn("space-y-1.5", className)}>
			{label && (
				<label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">
					{label}
				</label>
			)}
			{children}
		</div>
	);
}

export const TableToolbar = memo(function TableToolbar({
	searchValue = "",
	onSearchChange,
	onSearch,
	searchPlaceholder = "Search…",
	isFiltersOpen = false,
	onToggleFilters,
	hasActiveFilters = false,
	filterLabel = "Filters",
	actions = [],
}) {
	const handleKeyDown = (e) => {
		if (e.key === "Enter") { e.preventDefault(); onSearch?.(); }
	};

	return (
		<div className="flex items-center justify-between gap-3 flex-wrap">
			<div className="relative flex-1 w-full max-w-[350px] focus-within:max-w-[400px]" style={{ transition: ".3s" }}>
				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={searchPlaceholder}
					startIcon={<Search size={20} />}
				/>
			</div>

			<div className="flex items-center gap-2 flex-wrap">
				{onToggleFilters && (
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.97 }}
						onClick={onToggleFilters}
						type="button"
						className={cn(
							"relative btn btn-sm",
							isFiltersOpen ? "btn-solid" : "btn-outline",
						)}
					>
						<SlidersHorizontal size={15} />
						{filterLabel}
						{hasActiveFilters && !isFiltersOpen && (
							<span className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full
								bg-[var(--primary)] text-white text-[9px] font-black
								flex items-center justify-center shadow-sm z-10">
								✦
							</span>
						)}
						<motion.span animate={{ rotate: isFiltersOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}>
							<ChevronDown size={13} />
						</motion.span>
					</motion.button>
				)}

				{actions.map((action) => (
					<motion.button
						key={action.key}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.97 }}
						onClick={action.onClick}
						type="button"
						disabled={action.disabled}
						className={cn(
							ACTION_COLORS[action.color ?? "default"] ?? ACTION_COLORS.default,
							"disabled:opacity-50 disabled:cursor-not-allowed",
						)}
					>
						{action.icon}
						{action.label}
					</motion.button>
				))}
			</div>
		</div>
	);
});

export const TableFilters = memo(function TableFilters({ children, onApply, applyLabel = "Apply" }) {
	return (
		<motion.div
			initial={{ height: 0, opacity: 0 }}
			animate={{ height: "auto", opacity: 1 }}
			exit={{ height: 0, opacity: 0 }}
			transition={{ duration: 0.25, ease: "easeInOut" }}
			className="overflow-hidden"
		>
			<div className="mt-3 rounded-xl border border-border/80 bg-gradient-to-br from-muted/40 to-muted/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
				<div className="p-4 flex items-end gap-6">
					<div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{children}
					</div>
					{onApply && (
						<div className="w-fit flex">
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.97 }}
								onClick={onApply}
								type="button"
								className="btn !h-[42px] btn-solid btn-sm rtl:mr-auto ltr:ml-auto"
							>
								<Filter size={14} />
								{applyLabel}
							</motion.button>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
});

export const TablePagination = memo(function TablePagination({
	pagination, onPageChange, isLoading = false,
	pageParamName = "page", limitParamName = "limit",
	perPageOptions = DEFAULT_PER_PAGE_OPTIONS, labels = {},
}) {
	const totalPages = useMemo(() => {
		const total = Number(pagination?.total_records ?? 0);
		const per   = Number(pagination?.per_page ?? 6);
		return Math.max(1, Math.ceil(total / per));
	}, [pagination]);

	const currentPage = Number(pagination?.current_page ?? 1);
	const perPage     = Number(pagination?.per_page ?? 6);

	const pageItems = useMemo(() => {
		const tot = totalPages;
		const cur = Math.min(Math.max(1, currentPage), tot);
		if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
		const items = [1];
		const start = Math.max(2, cur - 2);
		const end   = Math.min(tot - 1, cur + 2);
		if (start > 2) items.push("…");
		for (let p = start; p <= end; p++) items.push(p);
		if (end < tot - 1) items.push("…");
		items.push(tot);
		return items;
	}, [totalPages, currentPage]);

	const goTo = (page) => {
		if (!onPageChange) return;
		const p = Math.min(Math.max(1, page), totalPages);
		onPageChange({ page: p, per_page: perPage, [pageParamName]: p, [limitParamName]: perPage });
	};

	const changeLimit = (lim) => {
		if (!onPageChange) return;
		onPageChange({ page: 1, per_page: lim, [pageParamName]: 1, [limitParamName]: lim });
	};

	const navCls = cn(
		"w-9 h-9 rounded-xl flex items-center justify-center border border-border",
		"bg-background text-muted-foreground transition-all duration-150",
		"hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5",
		"disabled:opacity-40 disabled:cursor-not-allowed",
	);

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4">
			<div className="flex items-center gap-2">
				<span className="text-xs font-semibold text-muted-foreground">{labels.total ?? "Total"}</span>
				<span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-black">
					{pagination?.total_records ?? 0}
				</span>
			</div>

			<div className="flex items-center gap-1.5">
				<motion.button whileTap={{ scale: 0.93 }} onClick={() => goTo(1)} disabled={isLoading || currentPage <= 1} className={navCls}>
					<ChevronsRight size={14} />
				</motion.button>
				<motion.button whileTap={{ scale: 0.93 }} onClick={() => goTo(currentPage - 1)} disabled={isLoading || currentPage <= 1} className={navCls}>
					<ChevronRight size={14} />
				</motion.button>

				{pageItems.map((p, idx) =>
					p === "…" ? (
						<span key={`d-${idx}`} className="w-9 text-center text-muted-foreground text-xs select-none">…</span>
					) : (
						<motion.button
							key={p}
							whileHover={{ scale: 1.08 }}
							whileTap={{ scale: 0.93 }}
							onClick={() => goTo(p)}
							disabled={isLoading}
							className={cn(
								"w-9 h-9 rounded-xl text-sm font-bold border transition-all duration-150",
								p === currentPage
									? "btn btn-solid btn-sm"
									: "bg-background border-border text-muted-foreground hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5",
							)}
						>
							{p}
						</motion.button>
					)
				)}

				<motion.button whileTap={{ scale: 0.93 }} onClick={() => goTo(currentPage + 1)} disabled={isLoading || currentPage >= totalPages} className={navCls}>
					<ChevronLeft size={14} />
				</motion.button>
				<motion.button whileTap={{ scale: 0.93 }} onClick={() => goTo(totalPages)} disabled={isLoading || currentPage >= totalPages} className={navCls}>
					<ChevronsLeft size={14} />
				</motion.button>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-xs font-semibold text-muted-foreground hidden sm:block">{labels.limit ?? "Per page"}</span>
				<div className="flex items-center gap-1">
					{perPageOptions.map((lim) => (
						<button
							key={lim}
							onClick={() => changeLimit(lim)}
							disabled={isLoading}
							className={cn(
								"w-9 h-9 rounded-xl text-xs font-bold border transition-all duration-150",
								perPage === lim
									? "bg-[var(--primary)]/12 border-[var(--primary)]/40 text-[var(--primary)]"
									: "bg-background border-border text-muted-foreground hover:border-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5",
							)}
						>
							{lim}
						</button>
					))}
				</div>
			</div>
		</div>
	);
});

const TableSkeleton = memo(function TableSkeleton({ columns, rows = 6, compact }) {
	return (
		<>
			{Array.from({ length: rows }).map((_, ri) => (
				<TableRow key={ri} className="border-b border-border/50">
					{columns.map((col, ci) => (
						<TableCell key={ci} className={cn("!px-5", compact ? "py-2.5" : "py-4")}>
							<div
								className="h-4 rounded-xl bg-gradient-to-r from-muted via-muted/60 to-muted animate-pulse"
								style={{ width: col.type === "img" ? "44px" : `${50 + ((ri * 13 + ci * 7) % 40)}%` }}
							/>
						</TableCell>
					))}
				</TableRow>
			))}
		</>
	);
});

const ImgCell = memo(function ImgCell({ src, alt, onOpen }) {
	const fullSrc = toFullSrc(src);
	if (!fullSrc) return <span className="text-muted-foreground text-sm">—</span>;
	return (
		<motion.button
			whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
			type="button" onClick={() => onOpen(fullSrc, alt)}
			className="group/img relative w-11 h-11 rounded-xl overflow-hidden border-2 border-border hover:border-[var(--primary)] shadow-sm hover:shadow-md transition-all duration-200 block"
		>
			<img src={fullSrc} alt={alt} className="w-full h-full object-cover" loading="lazy" />
			<div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-colors flex items-center justify-center">
				<Maximize2 size={11} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
			</div>
		</motion.button>
	);
});

const ImgsCell = memo(function ImgsCell({ images, onOpen }) {
	if (!images.length) return <span className="text-muted-foreground text-sm">—</span>;
	return (
		<div className="flex items-center">
			{images.map((img, idx) => {
				const fullSrc = toFullSrc(img.src);
				return (
					<motion.button
						key={`${img.src}-${idx}`} type="button"
						onClick={() => onOpen(fullSrc, img.alt)}
						style={{ zIndex: images.length - idx, marginInlineStart: idx === 0 ? 0 : "-14px" }}
						whileHover={{ scale: 1.12, zIndex: 50 }} whileTap={{ scale: 0.95 }}
						transition={{ type: "spring", stiffness: 400, damping: 30 }}
						className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-background shadow-md cursor-pointer"
					>
						<img src={fullSrc} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
					</motion.button>
				);
			})}
		</div>
	);
});

const ImageModal = memo(function ImageModal({ src, alt, open, onClose, labels = {} }) {
	const [zoomed, setZoomed] = useState(false);
	useEffect(() => { if (!open) setZoomed(false); }, [open]);

	const download = useCallback(() => {
		const a = Object.assign(document.createElement("a"), { href: src, target: "_blank", download: alt || "image" });
		document.body.appendChild(a); a.click(); document.body.removeChild(a);
	}, [src, alt]);

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent showCloseButton={false} className="max-w-4xl p-0 overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
				<div className="relative flex items-center justify-between gap-4 px-5 py-4 border-b border-border overflow-hidden">
					<div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-gradient-to-r from-[var(--primary)] to-[var(--third)]" />
					<div className="relative flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--third)]">
							<ImageIcon size={16} className="text-white" />
						</div>
						<div>
							<p className="text-sm font-bold">{labels.preview ?? "Image Preview"}</p>
							{alt && <p className="text-xs text-muted-foreground">{alt}</p>}
						</div>
					</div>
					<div className="relative flex items-center gap-1.5">
						<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setZoomed(z => !z)}
							className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted border border-border hover:border-[var(--primary)] text-muted-foreground hover:text-[var(--primary)] transition-all">
							<Maximize2 size={14} />
						</motion.button>
						<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={download}
							className="btn btn-solid btn-sm !w-8 !h-8 !px-0">
							<Download size={14} />
						</motion.button>
						<motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
							className="btn btn-ghost btn-sm btn-rose !w-8 !h-8 !px-0">
							<X size={14} />
						</motion.button>
					</div>
				</div>
				<div className="p-8 bg-muted flex items-center justify-center min-h-[380px]">
					<motion.img
						src={src} alt={alt}
						animate={{ scale: zoomed ? 1.65 : 1 }}
						transition={{ type: "spring", stiffness: 280, damping: 28 }}
						onClick={() => setZoomed(z => !z)}
						className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl cursor-zoom-in border-4 border-background"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
});

export default function Table({
	searchValue = "", onSearchChange, onSearch,
	actions = [], filters, hasActiveFilters = false, onApplyFilters,
	labels = {}, columns = [], data = [], isLoading = false,
	rowKey = (row, i) => row?.id ?? i,
	emptyState, striped = false, compact = false, hoverable = true,
	pagination = null, onPageChange,
	pageParamName = "page", limitParamName = "limit",
	perPageOptions = DEFAULT_PER_PAGE_OPTIONS, className = "",
}) {
	const isRTL = useIsRTL();
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [imgModal, setImgModal] = useState({ open: false, src: "", alt: "" });

	const openImage  = useCallback((src, alt = "") => setImgModal({ open: true, src, alt }), []);
	const closeImage = useCallback(() => setImgModal({ open: false, src: "", alt: "" }), []);
	const helpers    = useMemo(() => ({ openImage }), [openImage]);

	const hasFilters   = Boolean(filters);
	const stickyEnd    = isRTL ? "left-0" : "right-0";
	const stickyShadow = isRTL
		? "shadow-[8px_0_12px_-10px_rgba(0,0,0,0.2)] dark:shadow-[8px_0_12px_-10px_rgba(0,0,0,0.5)]"
		: "shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.2)] dark:shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.5)]";

	return (
		<div className={cn("w-full", className)}>
			<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="bg-card !p-0">
				<div className="px-5 py-4 bg-muted/20 border-b border-border">
					<TableToolbar
						searchValue={searchValue} onSearchChange={onSearchChange} onSearch={onSearch}
						searchPlaceholder={labels.searchPlaceholder}
						isFiltersOpen={filtersOpen}
						onToggleFilters={hasFilters ? () => setFiltersOpen(v => !v) : undefined}
						hasActiveFilters={hasActiveFilters} filterLabel={labels.filter} actions={actions}
					/>
					<AnimatePresence>
						{filtersOpen && hasFilters && (
							<TableFilters onApply={onApplyFilters} applyLabel={labels.apply}>
								{filters}
							</TableFilters>
						)}
					</AnimatePresence>
				</div>

				<div className="relative overflow-x-auto">
					<ShadTable>
						<TableHeader className="bg-muted/60 border-b border-border">
							<TableRow className="hover:bg-transparent">
								{columns.map((col, idx) => (
									<TableHead key={col.key} className={cn(
										"!px-5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground whitespace-nowrap",
										compact ? "py-3" : "py-4", "ltr:text-left rtl:text-right", col.headClassName,
										ACTION_KEYS.has(col.key) && cn("sticky z-30", stickyEnd, "bg-muted/60", stickyShadow),
									)}>
										<motion.span initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="flex items-center gap-2">
											{col.header}
										</motion.span>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>

						<TableBody>
							<AnimatePresence mode="wait">
								{isLoading ? (
									<TableSkeleton key="skel" columns={columns} rows={Number(pagination?.per_page ?? 6)} compact={compact} />
								) : data.length === 0 ? (
									<TableRow key="empty">
										<TableCell colSpan={columns.length} className="py-20">
											<motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
												<div className="relative">
													<div className="absolute inset-0 bg-[var(--primary)]/15 blur-2xl rounded-full" />
													<div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-muted to-muted/60 border border-border flex items-center justify-center shadow-sm">
														<ImageIcon className="w-8 h-8 text-muted-foreground/40" />
													</div>
												</div>
												<div className="text-center space-y-1">
													<p className="text-sm font-bold text-foreground">{emptyState ?? labels.emptyTitle ?? "No results found"}</p>
													<p className="text-xs text-muted-foreground">{labels.emptySubtitle ?? "Try adjusting your search or filters"}</p>
												</div>
											</motion.div>
										</TableCell>
									</TableRow>
								) : (
									data.map((row, i) => (
										<motion.tr
											key={rowKey(row, i)}
											initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
											transition={{ delay: Math.min(i * 0.025, 0.3) }}
											className={cn(
												"border-b border-border/50 group transition-colors duration-150",
												hoverable && "hover:bg-[var(--primary)]/[0.035]",
												striped && i % 2 === 1 && "bg-muted/20",
											)}
										>
											{columns.map((col) => {
												if (col.type === "img") return (
													<TableCell key={col.key} className={cn("!px-5", compact ? "py-2.5" : "py-4", col.className)}>
														<ImgCell src={row[col.key]} alt={col.header ?? ""} onOpen={openImage} />
													</TableCell>
												);
												if (col.type === "imgs") {
													const imgs = normalizeImages(row[col.key], col.header ?? "");
													return (
														<TableCell key={col.key} className={cn("!px-5", compact ? "py-2.5" : "py-4", col.className)}>
															<ImgsCell images={imgs} onOpen={openImage} />
														</TableCell>
													);
												}
												return (
													<TableCell key={col.key} className={cn(
														"!px-5 text-sm text-foreground/80 whitespace-nowrap ltr:text-left rtl:text-right",
														compact ? "py-2.5" : "py-4",
														"group-hover:text-foreground transition-colors duration-150",
														col.className,
														ACTION_KEYS.has(col.key) && cn("sticky z-20", stickyEnd, "bg-background", stickyShadow),
													)}>
														{typeof col.cell === "function" ? col.cell(row, i, helpers) : row[col.key]}
													</TableCell>
												);
											})}
										</motion.tr>
									))
								)}
							</AnimatePresence>
						</TableBody>
					</ShadTable>
				</div>

				{pagination && (
					<>
						<div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
						<TablePagination
							pagination={pagination} onPageChange={onPageChange} isLoading={isLoading}
							pageParamName={pageParamName} limitParamName={limitParamName}
							perPageOptions={perPageOptions} labels={labels}
						/>
					</>
				)}
			</motion.div>

			<ImageModal open={imgModal.open} src={imgModal.src} alt={imgModal.alt} onClose={closeImage} labels={labels} />
		</div>
	);
}