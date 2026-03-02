"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Image as ImageIcon,
	X,
	ZoomIn,
	Download,
	Maximize2,
} from "lucide-react";

import MiniSelect from "./MiniSelect";
import { baseImg } from "@/utils/axios";

// Skeleton Loading Component
function TableSkeleton({ columns, rows = 6, compact = false }) {
	return (
		<>
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<TableRow
					key={rowIndex}
					className="border-b border-gray-100 dark:border-slate-800/50"
				>
					{columns.map((col, colIndex) => (
						<TableCell
							key={colIndex}
							className={cn("!px-6", compact ? "py-3" : "py-5")}
						>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: [0.4, 0.8, 0.4] }}
								transition={{
									duration: 1.5,
									repeat: Infinity,
									delay: rowIndex * 0.1 + colIndex * 0.05,
								}}
								className={cn(
									"h-4 rounded-xl bg-gradient-to-r",
									"from-gray-200 via-gray-300 to-gray-200",
									"dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
								)}
								style={{
									width:
										col.type === "img"
											? "80px"
											: `${60 + Math.random() * 40}%`,
								}}
							/>
						</TableCell>
					))}
				</TableRow>
			))}
		</>
	);
}

export default function DataTable({
	columns = [],
	data = [],
	isLoading = false,
	rowKey = (row, i) => row?.id ?? i,
	toolbar = null,
	className = "",
	tableClassName = "",
	headerClassName = "",
	bodyClassName = "",
	emptyState = null,
	pagination = null,
	onPageChange = null,
	pageParamName = "page",
	limitParamName = "limit",
	striped = false,
	bordered = false,
	hoverable = true,
	compact = false,
}) {
	const t = useTranslations("dataTable");

	const [imgModal, setImgModal] = useState({ open: false, src: "", alt: "" });
	const [imageZoom, setImageZoom] = useState(false);

	const totalPages = useMemo(() => {
		if (!pagination) return 1;
		const total = Number(pagination.total_records ?? 0);
		const per = Number(pagination.per_page ?? 6);
		return Math.max(1, Math.ceil(total / per));
	}, [pagination]);

	const currentPage = Number(pagination?.current_page ?? 1);
	const perPage = Number(pagination?.per_page ?? 6);

	const pageItems = useMemo(() => {
		if (!pagination) return [];
		const total = totalPages;
		const cur = Math.min(Math.max(1, currentPage), total);

		const MAX_NUMERIC = 6;

		if (total <= MAX_NUMERIC) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		const first = 1;
		const last = total;
		const middleSlots = MAX_NUMERIC - 2;
		let start;
		let end;

		if (cur <= 3) {
			start = 2;
			end = 1 + middleSlots;
		} else if (cur >= total - 2) {
			end = total - 1;
			start = total - middleSlots;
		} else {
			start = cur - 1;
			end = cur + (middleSlots - 2);
		}

		start = Math.max(2, start);
		end = Math.min(total - 1, end);

		const currentMiddleCount = end - start + 1;
		if (currentMiddleCount < middleSlots) {
			const deficit = middleSlots - currentMiddleCount;
			const leftRoom = start - 2;
			const takeLeft = Math.min(leftRoom, deficit);
			start -= takeLeft;

			const remaining = deficit - takeLeft;
			const rightRoom = total - 1 - end;
			const takeRight = Math.min(rightRoom, remaining);
			end += takeRight;
		}

		const items = [];
		items.push(first);

		if (start > 2) items.push("…");

		for (let p = start; p <= end; p++) items.push(p);

		if (end < total - 1) items.push("…");

		items.push(last);

		return items;
	}, [pagination, totalPages, currentPage]);

	function openImage(src, alt = "") {
		setImgModal({ open: true, src, alt });
		setImageZoom(false);
	}

	function closeImage() {
		setImgModal({ open: false, src: "", alt: "" });
		setImageZoom(false);
	}

	function downloadImage() {
		const link = document.createElement("a");
		link.href = imgModal.src;
		link.target = "_blank"
		link.download = imgModal.alt || "image";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function goTo(page) {
		if (!pagination || !onPageChange) return;
		const p = Math.min(Math.max(1, page), totalPages);
		onPageChange({
			page: p,
			per_page: perPage,
			[pageParamName]: p,
			[limitParamName]: perPage,
		});
	}

	function changeLimit(newLimit) {
		if (!pagination || !onPageChange) return;
		const lim = Number(newLimit);
		onPageChange({
			page: 1,
			per_page: lim,
			[pageParamName]: 1,
			[limitParamName]: lim,
		});
	}

	const helpers = { openImage };

	const emptyTitle = emptyState || t("emptyState.title");
	const emptySubtitle = t("emptyState.subtitle");


	function normalizeImages(value, fallbackAlt) {
		if (!value) return [];

		// string => single
		if (typeof value === "string") return [{ src: value, alt: fallbackAlt }];

		// array => strings or {url/src}
		if (Array.isArray(value)) {
			return value
				.map((v) => {
					if (!v) return null;
					if (typeof v === "string") return { src: v, alt: fallbackAlt };
					if (typeof v === "object") {
						const src = v.url ?? v.src;
						if (!src) return null;
						return { src, alt: v.alt ?? fallbackAlt };
					}
					return null;
				})
				.filter(Boolean);
		}

		// object => {url} or {src}
		if (typeof value === "object") {
			const src = value.url ?? value.src;
			if (src) return [{ src, alt: value.alt ?? fallbackAlt }];
		}

		return [];
	}

	function toFullSrc(src) {
		if (!src) return "";
		return src.startsWith("http") ? src : baseImg + src;
	}


	const ACTION_KEY = "actions" ;
	const isRTL = typeof document !== "undefined" && document?.dir === "rtl";

	const stickyEnd = isRTL ? "left-0" : "right-0";
	const stickyShadow = isRTL
		? "shadow-[8px_0_12px_-10px_rgba(0,0,0,0.25)] dark:shadow-[8px_0_12px_-10px_rgba(0,0,0,0.55)]"
		: "shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.25)] dark:shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.55)]";


	return (
		<div className={cn("w-full", className)}>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className={cn(
					"!p-0 overflow-hidden rounded-xl",
					"bg-white dark:bg-slate-900",
					"border border-gray-200 dark:border-slate-800",
					"shadow-xl shadow-gray-200/50 dark:shadow-slate-950/50"
				)}
			>
				{toolbar ? (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
						>
							{toolbar}
						</motion.div>
						<Separator className="bg-gradient-to-r from-transparent via-primary/20 to-transparent h-px" />
					</>
				) : null}

				{/* Table */}
				<div className={cn("relative overflow-x-auto", tableClassName)}>

					<Table>
						<TableHeader
							className={cn(
								"bg-gray-100 dark:bg-slate-800",
								"dark:from-slate-800/90 dark:via-slate-850/80 dark:to-slate-900/70",
								"backdrop-blur-md border-b-2 border-gray-200 dark:border-slate-700",
								headerClassName
							)}
						>
							<TableRow className="hover:bg-transparent">
								{columns.map((col, idx) => (
									<TableHead
										key={col.key}
										className={cn(
											"!px-6 text-right text-xs font-bold uppercase tracking-wider",
											"text-gray-700 dark:text-slate-300",
											compact ? "py-3" : "py-5",
											"whitespace-nowrap",
											"first:rounded-tr-2xl last:rounded-tl-2xl",
											col.headClassName,
											col.key === ACTION_KEY || col.key === "options" &&
											cn("sticky z-30", stickyEnd, "bg-gray-100 dark:bg-slate-800", stickyShadow)
										)}
									>

										<motion.div
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: idx * 0.05 }}
											className="flex items-center gap-2"
										>
											{col.header}
										</motion.div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>

						<TableBody className={cn(bodyClassName)}>
							<AnimatePresence mode="wait">
								{isLoading ? (
									<TableSkeleton columns={columns} rows={perPage} compact={compact} />
								) : data.length === 0 ? (
									<TableRow>
										<TableCell colSpan={columns.length} className="py-20 text-center">
											<motion.div
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.9 }}
												className="flex flex-col items-center gap-4"
											>
												<div className="relative">
													<div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
													<div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-gray-200 dark:border-slate-700 shadow-lg">
														<ImageIcon className="w-10 h-10 text-gray-400 dark:text-slate-500" />
													</div>
												</div>

												<div className="space-y-2">
													<p className="text-base font-bold text-gray-700 dark:text-slate-300">
														{emptyTitle}
													</p>
													<p className="text-xs text-gray-500 dark:text-slate-500">
														{emptySubtitle}
													</p>
												</div>
											</motion.div>
										</TableCell>
									</TableRow>
								) : (
									data.map((row, i) => (
										<motion.tr
											key={rowKey(row, i)}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: 20 }}
											transition={{ delay: i * 0.03 }}
											className={cn(
												"border-b border-gray-100 dark:border-slate-800/50",
												"group transition-all duration-300",
												hoverable &&
												"hover:bg-gradient-to-r hover:from-primary/5 hover:via-primary/3 hover:to-transparent dark:hover:from-primary/10 dark:hover:via-primary/5 dark:hover:to-transparent hover:shadow-sm",
												striped && i % 2 === 1 && "bg-gray-50/50 dark:bg-slate-900/30",
												bordered && "border-x border-gray-200 dark:border-slate-800"
											)}
										>
											{columns.map((col) => {
												const value = row[col.key];

												if (col.type === "img") {
													const img = baseImg + row[col.key]
													const fullSrc = img

													return (
														<TableCell key={col.key} className={cn("!px-6", compact ? "py-3" : "py-5", col.className)}>
															{fullSrc ? (
																<motion.button
																	whileHover={{ scale: 1.05 }}
																	whileTap={{ scale: 0.95 }}
																	type="button"
																	onClick={() => openImage(fullSrc, img.alt)}
																	className="group/img inline-flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300"
																>
																	<div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-slate-700">
																		<img src={fullSrc} alt={img.alt} className="w-full h-full object-cover" />
																	</div>
																	<span className="text-xs font-semibold">{t("image.preview")}</span>
																</motion.button>
															) : (
																<span className="text-gray-400 dark:text-slate-600 text-lg">—</span>
															)}
														</TableCell>
													);
												}

												if (col.type === "imgs") {
													const value = row[col.key]; // ✅ this will be: [{url:"..."}, {url:"..."}]
													const images = normalizeImages(value, col.header ?? "images");

													return (
														<TableCell key={col.key} className={cn("!px-6", compact ? "py-3" : "py-5", col.className)}>
															{images.length ? (
																<div className="flex flex-row items-center">
																	{images.length ? (
																		<div className="flex flex-row items-center">
																			{images.map((img, idx) => {
																				const fullSrc = toFullSrc(img.src);
																				const alt = img.alt ?? `${col.header ?? "image"} #${idx + 1}`;
																				const isRTL = typeof document !== "undefined" && document?.dir === "rtl";

																				const offset = 14;
																				const x = isRTL ? idx * offset : idx * -offset;

																				return (
																					<motion.button
																						key={`${img.src}-${idx}`}
																						type="button"
																						onClick={() => openImage(fullSrc, alt)}
																						initial={false}
																						animate={{ x }}                 // ✅ translateX هنا
																						whileHover={{ scale: 1.08, zIndex: 50 }} // ✅ hover من غير كسر x
																						whileTap={{ scale: 0.95 }}
																						className="group/img relative"
																						style={{ zIndex: images.length - idx }}  // zIndex ثابت
																						transition={{ type: "spring", stiffness: 400, damping: 30 }}
																					>
																						<div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md bg-gray-100">
																							<img src={fullSrc} alt={alt} className="w-full h-full object-cover" />
																						</div>
																					</motion.button>
																				);
																			})}

																		</div>
																	) : (
																		<span className="text-gray-400 dark:text-slate-600 text-lg">—</span>
																	)}

																</div>
															) : (
																<span className="text-gray-400 dark:text-slate-600 text-lg">—</span>
															)}

														</TableCell>
													);
												}


												return (
													<TableCell
															key={col.key}
															className={cn(
																"!px-6 ltr:text-left rtl:text-right text-sm text-gray-700 dark:text-slate-200 whitespace-nowrap",
																compact ? "py-3" : "py-5",
																"group-hover:text-gray-900 dark:group-hover:text-slate-50 transition-colors duration-300",
																col.className,

																col.key === ACTION_KEY || col.key === "options" &&
																cn(
																	"sticky z-20",
																	stickyEnd,
																	"bg-white dark:bg-slate-900",
																	stickyShadow
																)
															)}
														>
														{typeof col.cell === "function" ? col.cell(row, i, helpers) : value}
													</TableCell>
												);
											})}
										</motion.tr>
									))
								)}
							</AnimatePresence>
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				{pagination ? (
					<>
						<Separator className="bg-gradient-to-r from-transparent via-primary/30 to-transparent h-px" />

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className={cn(
								"p-6 flex flex-col md:flex-row gap-4 items-center justify-between",
								"bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-50/80",
								"dark:from-slate-900/80 dark:via-slate-900/50 dark:to-slate-800/80"
							)}
						>
							{/* Left: total (kept hidden like original) */}
							<div className="opacity-0 flex items-center gap-2 text-sm">
								<Badge
									variant="outline"
									className={cn(
										"!px-5 !py-2.5 rounded-full font-bold",
										"bg-gradient-to-r from-primary/10 to-primary/5",
										"dark:from-primary/20 dark:to-primary/10",
										"border-2 border-primary/30 dark:border-primary/40",
										"shadow-sm shadow-primary/10"
									)}
								>
									<span className="text-gray-600 dark:text-slate-400">
										{t("pagination.total")}
									</span>
									<span className="font-bold text-primary dark:text-primary mr-2 text-base">
										{pagination.total_records}
									</span>
								</Badge>
							</div>

							{/* Middle: pager */}
							<div className="flex items-center gap-2">
								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="outline"
										size="icon"
										className={cn(
											"rounded-full bg-white dark:bg-slate-900",
											"border-2 border-gray-200 dark:border-slate-700",
											"hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5",
											"dark:hover:from-primary/20 dark:hover:to-primary/10",
											"hover:border-primary/40 dark:hover:border-primary/50",
											"shadow-md hover:shadow-xl transition-all duration-300",
											"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
										)}
										onClick={() => goTo(1)}
										disabled={currentPage <= 1 || isLoading}
										title={t("pagination.first")}
									>
										<ChevronsRight size={16} className="text-gray-700 dark:text-slate-300" />
									</Button>
								</motion.div>

								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="outline"
										size="icon"
										className={cn(
											"rounded-full bg-white dark:bg-slate-900",
											"border-2 border-gray-200 dark:border-slate-700",
											"hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5",
											"dark:hover:from-primary/20 dark:hover:to-primary/10",
											"hover:border-primary/40 dark:hover:border-primary/50",
											"shadow-md hover:shadow-xl transition-all duration-300",
											"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
										)}
										onClick={() => goTo(currentPage - 1)}
										disabled={currentPage <= 1 || isLoading}
										title={t("pagination.prev")}
									>
										<ChevronRight size={16} className="text-gray-700 dark:text-slate-300" />
									</Button>
								</motion.div>

								{pageItems.map((p, idx) =>
									p === "…" ? (
										<span
											key={`dots-${idx}`}
											className="px-2 text-gray-400 dark:text-slate-600 font-bold select-none"
										>
											…
										</span>
									) : (
										<motion.button
											key={p}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.95 }}
											type="button"
											onClick={() => goTo(p)}
											disabled={isLoading}
											className={cn(
												"w-11 h-11 rounded-full text-sm font-bold transition-all duration-300",
												"shadow-md hover:shadow-xl",
												"disabled:cursor-not-allowed disabled:hover:scale-100",
												p === currentPage
													? cn(
														"bg-gradient-to-br from-primary to-primary/80",
														"text-primary-foreground border-2 border-primary",
														"scale-110 shadow-xl shadow-primary/40",
														"dark:shadow-primary/60"
													)
													: cn(
														"bg-white dark:bg-slate-900",
														"text-gray-700 dark:text-slate-200",
														"border-2 border-gray-200 dark:border-slate-700",
														"hover:border-primary/40 dark:hover:border-primary/50",
														"hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5",
														"dark:hover:from-primary/20 dark:hover:to-primary/10"
													)
											)}
											title={t("pagination.goTo", { page: p })}
										>
											{p}
										</motion.button>
									)
								)}

								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="outline"
										size="icon"
										className={cn(
											"rounded-full bg-white dark:bg-slate-900",
											"border-2 border-gray-200 dark:border-slate-700",
											"hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5",
											"dark:hover:from-primary/20 dark:hover:to-primary/10",
											"hover:border-primary/40 dark:hover:border-primary/50",
											"shadow-md hover:shadow-xl transition-all duration-300",
											"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
										)}
										onClick={() => goTo(currentPage + 1)}
										disabled={currentPage >= totalPages || isLoading}
										title={t("pagination.next")}
									>
										<ChevronLeft size={16} className="text-gray-700 dark:text-slate-300" />
									</Button>
								</motion.div>

								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="outline"
										size="icon"
										className={cn(
											"rounded-full bg-white dark:bg-slate-900",
											"border-2 border-gray-200 dark:border-slate-700",
											"hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5",
											"dark:hover:from-primary/20 dark:hover:to-primary/10",
											"hover:border-primary/40 dark:hover:border-primary/50",
											"shadow-md hover:shadow-xl transition-all duration-300",
											"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
										)}
										onClick={() => goTo(totalPages)}
										disabled={currentPage >= totalPages || isLoading}
										title={t("pagination.last")}
									>
										<ChevronsLeft size={16} className="text-gray-700 dark:text-slate-300" />
									</Button>
								</motion.div>
							</div>

							{/* Right: limit selector */}
							<div className="flex items-center gap-3">
								<MiniSelect
									placeholder={t("pagination.limit")}
									value={String(perPage)}
									onChange={(v) => changeLimit(Number(v))}
									options={[6, 12, 24, 48].map((lim) => ({
										value: lim,
										label: String(lim),
									}))}
								/>
							</div>
						</motion.div>
					</>
				) : null}
			</motion.div>

			{/* Enhanced Image Modal */}
			<AnimatePresence>
				{imgModal.open && (
					<Dialog open={imgModal.open} onOpenChange={(open) => (!open ? closeImage() : null)}>
						<DialogContent showCloseButton={false} className="max-w-6xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-700 shadow-2xl rounded-xl">
							{/* Header */}
							<motion.div
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								className={cn(
									"p-6 flex items-center justify-between",
									"bg-gradient-to-r from-gray-100 via-gray-50 to-white",
									"dark:from-slate-800 dark:via-slate-850 dark:to-slate-900",
									"border-b-2 border-gray-200 dark:border-slate-700"
								)}
							>
								<div className="flex items-center gap-4">
									<div className="relative">
										<div className="absolute inset-0 bg-primary/20 blur-xl rounded-xl" />
										<div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 flex items-center justify-center border-2 border-primary/30">
											<ImageIcon size={22} className="text-primary" />
										</div>
									</div>

									<div>
										<h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
											{t("image.modalTitle")}
										</h3>
										<p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
											{imgModal.alt || t("image.preview")}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() => setImageZoom(!imageZoom)}
										className={cn(
											"p-2.5 rounded-xl transition-all duration-300",
											"bg-gradient-to-br from-gray-100 to-gray-200",
											"dark:from-slate-700 dark:to-slate-800",
											"hover:from-gray-200 hover:to-gray-300",
											"dark:hover:from-slate-600 dark:hover:to-slate-700",
											"border border-gray-300 dark:border-slate-600",
											"shadow-md hover:shadow-lg"
										)}
										title={t("image.zoom")}
									>
										<Maximize2 size={18} className="text-gray-700 dark:text-slate-300" />
									</motion.button>

									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={downloadImage}
										className={cn(
											"p-2.5 rounded-xl transition-all duration-300",
											"bg-gradient-to-br from-primary to-primary/80",
											"hover:from-primary/90 hover:to-primary/70",
											"shadow-lg hover:shadow-xl shadow-primary/30",
											"border border-primary/50"
										)}
										title={t("image.download")}
									>
										<Download size={18} className="text-primary-foreground" />
									</motion.button>

									<motion.button
										whileHover={{ scale: 1.1, rotate: 90 }}
										whileTap={{ scale: 0.9 }}
										onClick={closeImage}
										className={cn(
											"p-2.5 rounded-xl transition-all duration-300",
											"bg-gradient-to-br from-red-100 to-red-200",
											"dark:from-red-950/50 dark:to-red-950/70",
											"hover:from-red-200 hover:to-red-300",
											"dark:hover:from-red-950/70 dark:hover:to-red-950/90",
											"border border-red-300 dark:border-red-800",
											"shadow-md hover:shadow-lg"
										)}
										title={t("image.close")}
									>
										<X size={18} className="text-red-600 dark:text-red-400" />
									</motion.button>
								</div>
							</motion.div>

							{/* Image */}
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className={cn(
									"p-10 bg-gradient-to-br",
									"from-gray-100 via-gray-50 to-white",
									"dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
									"min-h-[500px] flex items-center justify-center"
								)}
							>
								<motion.img
									src={imgModal.src}
									alt={imgModal.alt}
									animate={{ scale: imageZoom ? 1.5 : 1 }}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
									className={cn(
										"max-w-full max-h-[75vh] object-contain rounded-xl",
										"shadow-2xl cursor-zoom-in",
										"border-4 border-white dark:border-slate-800"
									)}
									onClick={() => setImageZoom(!imageZoom)}
								/>
							</motion.div>
						</DialogContent>
					</Dialog>
				)}
			</AnimatePresence>
		</div>
	);
}
