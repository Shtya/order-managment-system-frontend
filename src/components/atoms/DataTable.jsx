"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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

export default function DataTable({
	columns = [],
	data = [],
	rowKey = (row, i) => row?.id ?? i,
	toolbar = null,
	className = "",
	tableClassName = "",
	headerClassName = "",
	bodyClassName = "",
	emptyState = "لا توجد بيانات",
	pagination = null,
	onPageChange = null,
	pageParamName = "page",
	limitParamName = "limit",
	dir = "rtl",
	striped = false,
	bordered = false,
	hoverable = true,
	compact = false,
}) {
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

		// If total pages are small, show all
		if (total <= MAX_NUMERIC) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		const first = 1;
		const last = total;

		// We want at most 6 numeric circles (numbers). Ellipsis doesn't count.
		const middleSlots = MAX_NUMERIC - 2; // reserve first + last
		let start;
		let end;

		// Near the start
		if (cur <= 3) {
			start = 2;
			end = 1 + middleSlots; // e.g. 2..5 when middleSlots=4
		}
		// Near the end
		else if (cur >= total - 2) {
			end = total - 1;
			start = total - middleSlots; // e.g. 52..55 when total=56
		}
		// Middle
		else {
			// Put current near the center of the window
			start = cur - 1;
			end = cur + (middleSlots - 2); // with 4 slots => cur+2
		}

		start = Math.max(2, start);
		end = Math.min(total - 1, end);

		// Ensure we fill exactly middleSlots numeric pages when possible
		const currentMiddleCount = end - start + 1;
		if (currentMiddleCount < middleSlots) {
			const deficit = middleSlots - currentMiddleCount;

			// Try extend to the left, then right
			const leftRoom = start - 2;
			const takeLeft = Math.min(leftRoom, deficit);
			start -= takeLeft;

			const remaining = deficit - takeLeft;
			const rightRoom = (total - 1) - end;
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

	const helpers = {
		openImage,
	};

	return (
		<div className={cn("w-full", className)} >
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-card !p-0  overflow-hidden"
			>
				{toolbar ? (
					<>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
							{toolbar}
						</motion.div>
						<Separator className="bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent" />
					</>
				) : null}

				{/* Table */}
				<div className={cn("overflow-x-auto", tableClassName)}>
					<Table>
						<TableHeader
							className={cn(
								"bg-gradient-to-b from-gray-50/80 to-gray-50/40 dark:from-slate-800/60 dark:to-slate-800/20",
								"backdrop-blur-sm",
								headerClassName
							)}
						>
							<TableRow className="border-b-2 border-gray-100 dark:border-slate-800">
								{columns.map((col, idx) => (
									<TableHead
										key={col.key}
										className={cn(
											"!px-6 text-right text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider",
											compact ? "py-3" : "py-5",
											"whitespace-nowrap",
											"first:rounded-tr-2xl last:rounded-tl-2xl",
											col.headClassName
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
								{data.length === 0 ? (
									<TableRow>
										<TableCell colSpan={columns.length} className="py-16 text-center">
											<motion.div
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.9 }}
												className="flex flex-col items-center gap-3"
											>
												<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
													<ImageIcon className="w-8 h-8 text-gray-400 dark:text-slate-500" />
												</div>
												<p className="text-sm font-medium text-gray-500 dark:text-slate-400">
													{emptyState}
												</p>
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
												"border-b border-gray-50 dark:border-slate-800/40",
												"group transition-all duration-200",
												hoverable &&
												"hover:bg-gradient-to-r hover:from-gray-50/60 hover:to-transparent dark:hover:from-slate-800/30 dark:hover:to-transparent",
												striped && i % 2 === 1 && "bg-gray-50/30 dark:bg-slate-900/20",
												bordered && "border-x border-gray-100 dark:border-slate-800"
											)}
										>
											{columns.map((col) => {
												const value = row[col.key];

												if (col.type === "img") {
													const src = typeof value === "string" ? value : value?.src;
													const alt = value?.alt ?? col.header ?? "image";
													return (
														<TableCell
															key={col.key}
															className={cn(
																"!px-6 ltr:text-left rtl:text-right text-sm text-gray-700 dark:text-slate-200 whitespace-nowrap",
																compact ? "py-3" : "py-5",
																col.className
															)}
														>
															{src ? (
																<motion.button
																	whileHover={{ scale: 1.05 }}
																	whileTap={{ scale: 0.95 }}
																	type="button"
																	onClick={() => openImage(src, alt)}
																	className="group/img inline-flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all"
																>
																	<div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-slate-700 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900 shadow-sm group-hover/img:shadow-md transition-all">
																		<img
																			src={src}
																			alt={alt}
																			className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
																		/>
																		<div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
																			<ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
																		</div>
																	</div>
																	<div className="flex items-center gap-2">
																		<span className="text-xs font-medium text-gray-500 dark:text-slate-400 group-hover/img:text-primary transition-colors">
																			معاينة
																		</span>
																		<ImageIcon
																			size={14}
																			className="text-gray-400 group-hover/img:text-primary transition-colors"
																		/>
																	</div>
																</motion.button>
															) : (
																<span className="text-gray-400 dark:text-slate-600">—</span>
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
															"group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors",
															col.className
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
						<Separator className="bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent" />
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-gradient-to-b from-gray-50/30 to-transparent dark:from-slate-900/30"
						>
							{/* Left: total only (removed: "الصفحة X من Y") */}
							<div className="flex items-center gap-2 text-sm">
								<Badge
									variant="outline"
									className=" !px-4 !py-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
								>
									<span className="text-gray-500 dark:text-slate-400">الإجمالي:</span>
									<span className="font-bold text-gray-900 dark:text-slate-100 mr-1">
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
										className="rounded-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-800 dark:hover:to-slate-900 shadow-sm hover:shadow-md transition-all"
										onClick={() => goTo(1)}
										disabled={currentPage <= 1}
									>
										<ChevronsRight size={16} />
									</Button>
								</motion.div>

								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="outline"
										size="icon"
										className="rounded-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-800 dark:hover:to-slate-900 shadow-sm hover:shadow-md transition-all"
										onClick={() => goTo(currentPage - 1)}
										disabled={currentPage <= 1}
									>
										<ChevronRight size={16} />
									</Button>
								</motion.div>

								{pageItems.map((p, idx) =>
									p === "…" ? (
										<span
											key={`dots-${idx}`}
											className="px-2 text-gray-400 dark:text-slate-600 font-bold"
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
											className={cn(
												"w-10 h-10 rounded-full text-sm font-bold transition-all",
												"shadow-sm hover:shadow-lg",
												p === currentPage
													? "bg-primary text-primary-foreground border-transparent scale-110 shadow-lg shadow-primary/30"
													: "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:border-primary/30 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-800 dark:hover:to-slate-900"
											)}
										>
											{p}
										</motion.button>
									)
								)}

								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="outline"
										size="icon"
										className="rounded-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-800 dark:hover:to-slate-900 shadow-sm hover:shadow-md transition-all"
										onClick={() => goTo(currentPage + 1)}
										disabled={currentPage >= totalPages}
									>
										<ChevronLeft size={16} />
									</Button>
								</motion.div>

								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="outline"
										size="icon"
										className="rounded-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-800 dark:hover:to-slate-900 shadow-sm hover:shadow-md transition-all"
										onClick={() => goTo(totalPages)}
										disabled={currentPage >= totalPages}
									>
										<ChevronsLeft size={16} />
									</Button>
								</motion.div>
							</div>

							{/* Right: limit as shadcn dropdown */}
							<div className="flex items-center gap-3">
								<span className="text-sm font-medium text-gray-600 dark:text-slate-400">
									عدد النتائج
								</span>

								<Select value={String(perPage)} onValueChange={(v) => changeLimit(Number(v))}>
									<SelectTrigger className="w-[80px] rounded-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-primary">
										<SelectValue placeholder="اختر العدد" />
									</SelectTrigger>
									<SelectContent>
										{[6, 12, 24, 48].map((lim) => (
											<SelectItem key={lim} value={String(lim)}>
												{lim}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</motion.div>
					</>
				) : null}
			</motion.div>

			{/* Enhanced Image Modal */}
			<AnimatePresence>
				{imgModal.open && (
					<Dialog open={imgModal.open} onOpenChange={(open) => (!open ? closeImage() : null)}>
						<DialogContent className="max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-800 shadow-2xl">
							{/* Header */}
							<motion.div
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-6 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent dark:from-slate-800/50 border-b border-gray-100 dark:border-slate-800"
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
										<ImageIcon size={20} className="text-primary" />
									</div>
									<div>
										<h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
											معاينة الصورة
										</h3>
										<p className="text-xs text-gray-500 dark:text-slate-400">
											{imgModal.alt || "معاينة"}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() => setImageZoom(!imageZoom)}
										className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
									>
										<Maximize2 size={16} className="text-gray-700 dark:text-slate-300" />
									</motion.button>

									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={downloadImage}
										className="p-2 rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg transition-all"
									>
										<Download size={16} className="text-primary-foreground" />
									</motion.button>

									<motion.button
										whileHover={{ scale: 1.1, rotate: 90 }}
										whileTap={{ scale: 0.9 }}
										onClick={closeImage}
										className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
									>
										<X size={16} className="text-red-600 dark:text-red-400" />
									</motion.button>
								</div>
							</motion.div>

							{/* Image */}
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8"
							>
								<motion.img
									src={imgModal.src}
									alt={imgModal.alt}
									animate={{ scale: imageZoom ? 1.5 : 1 }}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
									className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl cursor-zoom-in"
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
