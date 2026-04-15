import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FilterField } from "./Table";
import api from "@/utils/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * @param {string|string[]} value — single: product id or "all"; multi: string[] of ids
 * @param {function} onChange
 * @param {boolean} [multiple=false]
 * @param {string} [label] — FilterField label (default: product name)
 * @param {string} [title] — trigger placeholder (default: all products / select products in multi)
 * @param {boolean} [showAllOption=true] — show "All products" option (single mode only)
 * @param {string[]} [excludeIds=[]] — product ids to hide from list
 */
export default function ProductFilter({
	value,
	onChange,
	multiple = false,
	label,
	title,
	showAllOption = true,
	excludeIds = [],
}) {
	const t = useTranslations("products.common");
	const fieldLabel = label ?? t("productName");
	const [open, setOpen] = useState(false);
	const [products, setProducts] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedTerm, setDebouncedTerm] = useState("");
	const [loading, setLoading] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const inputRef = useRef(null);

	const excludeSet = useMemo(
		() => new Set((excludeIds || []).map((id) => String(id))),
		[excludeIds]
	);

	const selectedIdsMulti = useMemo(() => {
		if (!multiple) return [];
		return Array.isArray(value) ? value.map(String) : [];
	}, [multiple, value]);

	// Fetch the specific product if it's selected but not in the search results (single mode)
	useEffect(() => {
		if (multiple) return;
		if (value && value !== "all") {
			const alreadyInList = products.find((p) => String(p.id) === String(value));
			if (!alreadyInList) {
				const fetchSelected = async () => {
					try {
						const res = await api.get(`/products/${value}`);
						setSelectedProduct(res.data);
					} catch (err) {
						console.error("Error fetching selected product details", err);
					}
				};
				fetchSelected();
			} else {
				setSelectedProduct(alreadyInList);
			}
		} else {
			setSelectedProduct(null);
		}
	}, [value, products, multiple]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedTerm(searchTerm);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	const renderProducts = useMemo(() => {
		const combined = loading ? [] : [...products];
		if (!multiple && selectedProduct && !combined.some((p) => String(p.id) === String(selectedProduct.id))) {
			combined.unshift(selectedProduct);
		}
		return combined.filter((p) => !excludeSet.has(String(p.id)));
	}, [products, selectedProduct, loading, multiple, excludeSet]);

	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => {
				inputRef.current?.focus();
			}, 0);
			return () => clearTimeout(timer);
		}
		setSearchTerm("");
	}, [open]);

	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const res = await api.get("/products", {
					params: {
						type: "PRODUCT",
						search: debouncedTerm || undefined,
						limit: multiple ? 50 : 5,
					},
				});
				const data = Array.isArray(res.data) ? res.data : res.data?.records || [];
				setProducts(data);
			} catch (err) {
				console.error("Product Lookup Error", err);
			} finally {
				setLoading(false);
			}
		};
		fetchProducts();
	}, [debouncedTerm, multiple]);

	const triggerPlaceholderSingle = title ?? t("allProducts");
	const triggerPlaceholderMulti = title ?? t("selectProducts");

	const toggleMultiId = useCallback(
		(id) => {
			const sid = String(id);
			const next = selectedIdsMulti.includes(sid)
				? selectedIdsMulti.filter((x) => x !== sid)
				: [...selectedIdsMulti, sid];
			onChange?.(next);
		},
		[selectedIdsMulti, onChange]
	);

	if (multiple) {
		const count = selectedIdsMulti.length;
		const triggerLabel =
			count > 0 ? t("selectedCount", { count }) : triggerPlaceholderMulti;

		return (
			<FilterField label={fieldLabel} lableClass={multiple ? "text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide" : null }>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className={cn(
								"h-10 w-full justify-between  border-border bg-background px-3 text-sm font-normal",
								multiple ? "rounded-md" : "rounded-xl",
								"focus:border-[var(--primary)]"
							)}
						>
							<span className="truncate text-start">{triggerLabel}</span>
							<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
						<div className="border-b border-border p-2">
							<input
								type="text"
								ref={inputRef}
								placeholder={t("searchProducts")}
								className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 rtl:text-end text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
						<div className="max-h-64 overflow-y-auto p-1">
							{renderProducts.map((p) => {
								const sid = String(p.id);
								const name = p.name?.trim() || "";
								const slug = p.slug?.trim() ? `(${p.slug.trim()})` : "";
								const checked = selectedIdsMulti.includes(sid);
								return (
									<button
										key={p.id}
										type="button"
										onClick={() => toggleMultiId(p.id)}
										className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-sm hover:bg-muted/60"
									>
										<Checkbox checked={checked} className="pointer-events-none" />
										<div className="min-w-0 flex-1">
											{slug && (
												<span className="mr-1 text-xs text-muted-foreground font-mono">{slug}</span>
											)}
											<span>{name}</span>
										</div>
									</button>
								);
							})}
							{loading && (
								<div className="py-4 text-center text-sm text-muted-foreground">{t("loading")}</div>
							)}
							{!loading && renderProducts.length === 0 && (
								<div className="py-4 text-center text-sm text-muted-foreground">{t("noProductsFound")}</div>
							)}
						</div>
					</PopoverContent>
				</Popover>
			</FilterField>
		);
	}

	return (
		<FilterField label={fieldLabel}>
			<Select value={value} onValueChange={onChange} open={open} onOpenChange={setOpen}>
				<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:border-[var(--primary)] transition-all">
					<SelectValue placeholder={triggerPlaceholderSingle} />
				</SelectTrigger>

				<SelectContent>
					<div className="px-2 py-2 sticky top-0 bg-background z-10 border-b border-border">
						<input
							type="text"
							ref={inputRef}
							placeholder={t("searchProducts")}
							className="w-full rounded-md border border-input bg-transparent px-3 py-1 rtl:text-end text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => e.stopPropagation()}
						/>
					</div>

					{showAllOption && <SelectItem value="all">{t("allProducts")}</SelectItem>}

					{renderProducts.map((p) => {
						const name = p.name?.trim() || "";
						const slug = p.slug?.trim() ? `(${p.slug.trim()})` : "";

						return (
							<SelectItem key={p.id} value={String(p.id)}>
								<div className="flex items-center gap-2">
									{slug && (
										<span className="text-xs text-muted-foreground font-mono">{slug}</span>
									)}
									<span>{name}</span>
								</div>
							</SelectItem>
						);
					})}
					{loading && (
						<div className="py-4 text-center text-sm text-muted-foreground">{t("loading")}</div>
					)}
					{!loading && products.length === 0 && (
						<div className="py-4 text-center text-sm text-muted-foreground">{t("noProductsFound")}</div>
					)}
				</SelectContent>
			</Select>
		</FilterField>
	);
}
