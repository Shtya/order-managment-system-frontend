"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "@/utils/api";

import { useTranslations } from "next-intl";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { motion, AnimatePresence } from "framer-motion";

import {
	ChevronDown,
	Loader2,
	Search,
	Package,
	Box,
	Tag,
	CheckCircle2,
	AlertCircle,
	XCircle,
	Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";

function useDebouncedValue(value, delay = 350) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return debounced;
}

function highlight(text, q) {
	if (!text) return text;
	const query = (q ?? "").trim();
	if (!query) return text;

	const idx = text.toLowerCase().indexOf(query.toLowerCase());
	if (idx === -1) return text;

	const before = text.slice(0, idx);
	const match = text.slice(idx, idx + query.length);
	const after = text.slice(idx + query.length);

	return (
		<>
			{before}
			<mark className="bg-primary/20 text-primary font-bold px-1 rounded">{match}</mark>
			{after}
		</>
	);
}

function StockBadge({ available, stockOnHand, reserved, t }) {
	const isLow = available < 10 && available > 0;
	const isOut = available === 0;

	return (
		<div className="flex items-center gap-2  ">
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: "spring", stiffness: 400 }}
				className={cn(
					"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm",
					isOut
						? "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300"
						: isLow
							? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
							: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300"
				)}
			>
				{isOut ? (
					<XCircle className="w-3.5 h-3.5" />
				) : isLow ? (
					<AlertCircle className="w-3.5 h-3.5" />
				) : (
					<CheckCircle2 className="w-3.5 h-3.5" />
				)}
				<span className="text-nowrap" >
					{available} {isOut ? t("outOfStock") : isLow ? t("lowStock") : t("available")}
				</span>
			</motion.div>

			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
					<Package className="w-3 h-3" />
					<span className="text-nowrap">{t("stock")}: {stockOnHand}</span>
				</div>
			</div>
		</div>
	);
}

export function ProductSkuSearchPopover({
	handleSelectSku,
	selectedSkus = [],
	closeOnSelect = true,
	closeOnOutsideClick = true,
}) {

	const t = useTranslations("productSearch");

	const [open, setOpen] = useState(false);
	const triggerRef = useRef(null);
	const [triggerWidth, setTriggerWidth] = useState(0);

	const [searchQuery, setSearchQuery] = useState("");
	const debounced = useDebouncedValue(searchQuery, 350);

	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState([]);

	// Measure trigger width
	useEffect(() => {
		if (!triggerRef.current) return;
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setTriggerWidth(entry.contentRect.width);
			}
		});
		resizeObserver.observe(triggerRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	// Create a Set of selected SKU IDs for quick lookup
	const selectedSkuIds = useMemo(() => {
		return new Set((selectedSkus || []).map((s) => s.id));
	}, [selectedSkus]);

	async function runSearch(raw) {
		const term = (raw ?? "").trim();

		if (term.length < 2) {
			setSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);

		try {
			const res = await api.get(`/lookups/skus`, {
				params: { q: term }
			});

			const records = Array.isArray(res.data) ? res.data : [];
			setSearchResults(records);
		} catch (e) {
			console.error("Search error:", e);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	}
	function resetSearch() {
		setIsSearching(false);
		setSearchResults([]);
		setSearchQuery("");
	}

	useEffect(() => {
		if (!open) return;
		runSearch(debounced);
	}, [debounced, open]);

	// cleanup when closing
	useEffect(() => {
		if (!open) {
			setIsSearching(false);
			setSearchResults([]);
			setSearchQuery("");
		}
	}, [open]);

	function selectSku(sku) {
		handleSelectSku(sku);

		if (closeOnSelect) {
			setOpen(false);
			resetSearch();
		}
	}





	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					ref={triggerRef}
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between rounded-xl h-[50px] bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md"
				>
					<span
						className={cn(
							"flex items-center gap-2.5 font-medium",
							searchQuery ? "text-foreground" : "text-gray-400"
						)}
					>
						<div className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/10 text-primary">
							<Search className="h-3.5 w-3.5" />
						</div>
						{searchQuery || t("triggerPlaceholder")}
					</span>
					<ChevronDown
						className={cn(
							"h-4 w-4 shrink-0 transition-transform duration-200",
							open && "rotate-180"
						)}
					/>
				</Button>
			</PopoverTrigger>

			<PopoverContent
				className="p-0 border-0 shadow-2xl"
				align="start"
				style={{ width: triggerWidth + 25 }}
				onInteractOutside={(e) => {
					if (!closeOnOutsideClick) return;
					setOpen(false);
				}}
				onEscapeKeyDown={() => setOpen(false)}
			>

				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
					className=" w-full border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
				>

					{/* Search Input - Removed Command wrapper to fix filtering issue */}
					<div className="p-4 flex items-center gap-2 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-slate-800/30">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", stiffness: 500, damping: 25 }}
							className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
						>
							<Package className="h-6 w-6" />
						</motion.div>

						<div className="relative max-w-full flex-1">
							<Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
							<input
								type="text"
								placeholder={t("inputPlaceholder")}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full h-12 pr-12 pl-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-medium focus:border-primary focus:outline-none transition-colors"
							/>
						</div>

						<AnimatePresence>
							{(searchResults.length > 0 || isSearching) && (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0, opacity: 0 }}
								>
									<Badge
										variant="secondary"
										className="rounded-xl px-4 py-2 text-sm font-semibold shadow-sm"
									>
										{isSearching ? (
											<span className="inline-flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin" />
												{t("searching")}
											</span>
										) : (
											<span className="inline-flex items-center gap-2">
												<Sparkles className="h-4 w-4 text-primary" />
												{searchResults.length} {searchResults?.length > 1 ? t("results") : t("result")}


											</span>
										)}
									</Badge>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Results List */}
					<div className="max-h-[395px] overflow-y-auto custom-scrollbar">
						{isSearching ? (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex flex-col items-center justify-center py-16 text-center"
							>
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
									className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg"
								>
									<Loader2 className="h-10 w-10 text-primary" />
								</motion.div>
								<div className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-2">
									{t("searching")}
								</div>
							</motion.div>
						) : searchResults.length === 0 && debounced.length >= 2 ? (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex flex-col items-center justify-center py-16 text-center"
							>
								<motion.div
									animate={{ rotate: [0, 10, -10, 0] }}
									transition={{ duration: 2, repeat: Infinity }}
									className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4 shadow-lg"
								>
									<Search className="h-10 w-10 text-gray-400" />
								</motion.div>
								<div className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-2">
									{t("noResults")}
								</div>
								<div className="text-sm text-muted-foreground max-w-xs">
									{t("tryDifferent")}
								</div>
							</motion.div>
						) : searchResults.length > 0 ? (
							<div className="p-3 space-y-3">
								{searchResults.map((sku, idx) => {
									const isSelected = selectedSkuIds.has(sku.id);

									return (
										<motion.div
											key={sku.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: idx * 0.05 }}
										>
											{idx > 0 && <Separator className="my-3" />}

											<div
												onClick={() => !isSelected && selectSku(sku)}
												className={cn(
													"cursor-pointer rounded-xl px-4 py-4 border-2 transition-all duration-200",
													isSelected
														? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 opacity-60 cursor-not-allowed"
														: "border-gray-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5"
												)}
											>
												<div className="flex items-center justify-between w-full gap-4">
													<div className="flex-1 min-w-0 space-y-3">
														{/* SKU Header */}
														<div className="flex items-center gap-3">
															<motion.div
																whileHover={{ rotate: 360 }}
																transition={{ duration: 0.5 }}
																className={cn(
																	"flex items-center justify-center w-10 h-10 rounded-xl border-2 shadow-sm",
																	isSelected
																		? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-600 dark:text-green-400"
																		: "bg-primary/10 border-primary/30 text-primary"
																)}
															>
																{isSelected ? (
																	<CheckCircle2 className="h-5 w-5" />
																) : (
																	<Box className="h-5 w-5" />
																)}
															</motion.div>

															<div className="flex-1 min-w-0">
																<div className="font-[Inter] font-bold text-sm text-gray-900 dark:text-slate-100 truncate">
																	{highlight(sku?.label || sku?.sku || "—", debounced)}
																</div>
															</div>

															<StockBadge
																available={sku.available ?? 0}
																stockOnHand={sku.stockOnHand ?? 0}
																reserved={sku.reserved ?? 0}
																t={t}
															/>

															{isSelected && (
																<Badge
																	variant="outline"
																	className="rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800"
																>
																	✓ {t("selected")}
																</Badge>
															)}
														</div>
													</div>

													{/* Select Button */}
													{!isSelected && (
														<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
															<Button
																size="sm"
																className="rounded-xl shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-md hover:shadow-lg transition-all"
															>
																<Package className="h-4 w-4 " />
																{t("select")}
															</Button>
														</motion.div>
													)}
												</div>
											</div>
										</motion.div>
									);
								})}
							</div>
						) : null}
					</div>
				</motion.div>
			</PopoverContent>
		</Popover>
	);
}