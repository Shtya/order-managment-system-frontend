// --- File: ProductsTab.jsx ---
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, DollarSign, Edit2, Eye, QrCode, Tag, Trash2, Hash, Package, Boxes, Store, Warehouse, Image as ImageIcon, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { baseImg } from "@/utils/axios";
import { useTranslations } from "next-intl";
import { BannerSkeleton, Bone } from "@/components/atoms/BannerSkeleton";
import { avatarSrc } from "@/components/atoms/UserSelect";
import ActionButtons from "@/components/atoms/Actions";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export default function useProductsTab({ t, searchDebounced, filters, filtersOpen, onAskDelete, onOpenView, onExportRequest, activetab }) {
	const router = useRouter();
	const requestIdRef = useRef(0);
	const { formatCurrency } = usePlatformSettings();

	const [loading, setLoading] = useState(false);
	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 6,
		records: []
	});

	function buildQueryParams({ page, per_page }) {
		const params = new URLSearchParams();
		params.set("page", String(page));
		params.set("limit", String(per_page));
		params.set("type", "PRODUCT");

		if (searchDebounced?.trim()) params.set("search", searchDebounced.trim());
		if (activetab === "deleted_products") params.set("isActive", "false");
		if (filters.storageRack?.trim()) params.set("storageRack.ilike", filters.storageRack.trim());
		if (filters.categoryId) params.set("categoryId", filters.categoryId);
		if (filters.storeId) params.set("storeId", filters.storeId);
		if (filters.warehouseId) params.set("warehouseId", filters.warehouseId);
		if (filters.productType && filters.productType !== "none") params.set("productType", filters.productType);

		if (filters.priceFrom !== "") params.set("wholesalePrice.gte", String(filters.priceFrom));
		if (filters.priceTo !== "") params.set("wholesalePrice.lte", String(filters.priceTo));

		if (filters.salePriceFrom !== "") params.set("salePrice.gte", String(filters.salePriceFrom));
		if (filters.salePriceTo !== "") params.set("salePrice.lte", String(filters.salePriceTo));

		params.set("sortBy", "created_at");
		params.set("sortOrder", "DESC");
		return params;
	}

	async function fetchData({ page = 1, per_page = pager.per_page } = {}) {
		const reqId = ++requestIdRef.current;
		setLoading(true);

		try {
			const params = buildQueryParams({ page, per_page });
			const res = await api.get(`/products?${params.toString()}`);
			if (reqId !== requestIdRef.current) return;

			const data = res.data;
			const records = Array.isArray(data?.records) ? data.records : Array.isArray(data) ? data : [];

			setPager({
				total_records: Number(data?.total_records ?? records.length ?? 0),
				current_page: Number(data?.current_page ?? page),
				per_page: Number(data?.per_page ?? per_page),
				records
			});
		} catch (e) {
			if (reqId !== requestIdRef.current) return;
			toast.error(normalizeAxiosError(e));
			setPager((p) => ({ ...p, records: [] }));
		} finally {
			if (reqId === requestIdRef.current) setLoading(false);
		}
	}

	useEffect(() => {
		onExportRequest?.(() => buildQueryParams({ page: 1, per_page: 1000000 }));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchDebounced, filters]);

	useEffect(() => {
		if (!["products", "deleted_products"]?.includes(activetab)) return;
		fetchData({ page: 1, per_page: pager.per_page });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchDebounced, activetab]);



	const columns = useMemo(() => {
		const na = t("common.na");
		return [
			// { key: "id", header: t("table.id"), className: "font-semibold text-primary w-[80px]" },
			{ key: "name", header: t("table.name"), className: "text-gray-700 dark:text-slate-200 font-semibold min-w-[200px]" },
			{
				key: "stockCount",
				header: t("table.totalStock"),
				className: "min-w-[120px]",
				cell: (row) => {
					const total = (row?.skus || []).reduce((sum, s) => sum + (s.stockOnHand || 0), 0);
					return (
						<Badge
							className={cn(
								"rounded-full font-semibold",
								total > 0 ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600 border border-gray-200"
							)}
						>
							{total} {t("table.items")}
						</Badge>
					);
				}
			},
			{
				key: "reservedCount",
				header: t("table.totalReserved"),
				className: "min-w-[120px]",
				cell: (row) => {
					const total = (row?.skus || []).reduce((sum, s) => sum + (Number(s?.reserved) || 0), 0);
					return (
						<Badge
							className={cn(
								"rounded-full font-semibold",
								total > 0 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-600 border border-gray-200"
							)}
						>
							{total} {t("table.items")}
						</Badge>
					);
				}
			},
			{
				key: "availableCount",
				header: t("table.totalAvailable"),
				className: "min-w-[120px]",
				cell: (row) => {
					const total = (row?.skus || []).reduce((sum, s) => sum + (Number(s?.available) || 0), 0);
					return (
						<Badge
							className={cn(
								"rounded-full font-semibold",
								total > 0 ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-600 border border-gray-200"
							)}
						>
							{total} {t("table.items")}
						</Badge>
					);
				}
			},
			{ key: "mainImage", header: t("table.mainImage"), className: "w-[100px]", type: "img" },
			{ key: "images", header: t("table.imagesCount"), className: "w-[100px]", type: "imgs" },
			// { 
			// 	key: "slug", 
			// 	header: t("table.slug"), 
			// 	className: "text-slate-500 dark:text-slate-400 font-mono text-[12px] min-w-[150px] truncate" 
			// },
			{
				key: "type",
				header: t("table.type"),
				className: "min-w-[110px]",
				cell: (row) => (
					<Badge className="rounded-full ">
						{row?.type === "single" ? t("types.single") : t("types.variable")}
					</Badge>
				)
			},
			{
				key: "sku",
				header: t("table.sku"),
				className: "min-w-[150px]",
				cell: (row) => {
					const firstSku = row?.skus?.[0]?.sku || na;
					const skuCount = row?.skus?.length || 0;
					return (
						<div className="flex items-center gap-2">
							<QrCode size={16} className="text-primary" />
							<span className="text-gray-600 dark:text-slate-200 font-mono text-sm">{firstSku}</span>
							{skuCount > 1 && (
								<Badge className="rounded-full bg-primary/10 text-primary border border-primary/20 text-xs px-2">
									+{skuCount - 1}
								</Badge>
							)}
						</div>
					);
				}
			},
			{
				key: "category",
				header: t("table.category"),
				className: "min-w-[120px]",
				cell: (row) => (
					<Badge variant="secondary" className="rounded-full">
						{row?.category?.name ?? na}
					</Badge>
				)
			},
			{ key: "store", header: t("table.store"), className: "min-w-[120px]", cell: (row) => row?.store?.name ?? na },
			{ key: "warehouse", header: t("table.warehouse"), className: "min-w-[120px]", cell: (row) => row?.warehouse?.name ?? na },
			{ key: "storageRack", header: t("table.storageRack"), className: "min-w-[100px]", cell: (row) => row.storageRack ?? na },
			{
				key: "salePrice",
				header: t("table.salePrice"),
				className: "min-w-[100px]",
				cell: (row) => (
					<div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
						{formatCurrency(row.salePrice || 0)}
					</div>
				)
			},
			{
				key: "wholesalePrice",
				header: t("table.wholesalePrice"),
				className: "min-w-[100px]",
				cell: (row) => (
					<div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
						{formatCurrency(row.wholesalePrice || 0)}
					</div>
				)
			},
			{
				key: "lowestPrice",
				header: t("table.lowestPrice"),
				className: "min-w-[100px]",
				cell: (row) => (
					<div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
						{formatCurrency(row.lowestPrice || 0)}
					</div>
				)
			},

			{
				key: "created_at",
				header: t("table.createdAt"),
				className: "min-w-[120px]",
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300 text-sm">
						<CalendarDays size={14} className="text-gray-400 dark:text-slate-500" />
						{row.created_at ? new Date(row.created_at).toLocaleDateString("en-US") : na}
					</div>
				)
			},
			{
				key: "actions",
				header: t("table.options"),
				className: "",
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <Edit2 />,
								tooltip: t("actions.edit"),
								hidden: activetab === "deleted_products",
								onClick: (r) => router.push(`/products/edit/${r.id}`),
								variant: "primary",
								permission: "products.update",
							},
							{
								icon: <Eye />,
								tooltip: t("actions.view"),
								onClick: (r) => onOpenView?.(r.id, "products"),
								variant: "primary",
								permission: "products.read",
							},
							{
								icon: <RotateCcw />,
								tooltip: t("actions.reactivate"),
								hidden: activetab !== "deleted_products",
								onClick: async (r) => {
									const toastId = toast.loading(t("common.loading"));

									try {
										await api.patch(`/products/${r.id}/restore`);

										toast.success(t("actions.success"), { id: toastId });

										// reload products
										await fetchData({ page: 1, per_page: pager.per_page });
									} catch (e) {
										toast.error(normalizeAxiosError(e), { id: toastId });
									}
								},
								variant: "green",
								permission: "products.update",
							},
							{
								icon: <Trash2 />,
								tooltip: t("actions.delete"),
								hidden: activetab === "deleted_products",
								onClick: (r) => onAskDelete?.(r.id, "products"),
								variant: "red",
								permission: "products.delete",
							},
						]}
					/>
				)
			}
		];
	}, [router, t, onAskDelete, onOpenView, formatCurrency]);

	return { loading, pager, columns, fetchData, buildQueryParams };
}

function formatDate(d, na) {
	if (!d) return na;
	try {
		return new Date(d).toLocaleString("en-US");
	} catch {
		return String(d);
	}
}



function toAbsUrl(url) {
	if (!url) return null;
	if (String(url).startsWith("http")) return url;
	return url;
}

export function ProductViewModal({ open, onOpenChange, product, viewLoading }) {
	const t = useTranslations("products");
	const na = t("common.na");
	const { formatCurrency } = usePlatformSettings();
	const images = Array.isArray(product?.images) ? product.images : [];
	const mainImage = toAbsUrl(product?.mainImage);
	const skus = Array.isArray(product?.skus) ? product.skus : [];
	const upsells = Array.isArray(product?.upsellingProducts) ? product.upsellingProducts : [];

	const totalStock = skus.reduce((sum, s) => sum + (Number(s?.stockOnHand) || 0), 0);
	const totalReserved = skus.reduce((sum, s) => sum + (Number(s?.reserved) || 0), 0);
	const totalAvailable = skus.reduce((sum, s) => sum + (Number(s?.available) || 0), 0);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-5xl max-h-[90vh] overflow-hidden p-0">
				<DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
					<DialogTitle className="flex items-center gap-2 text-xl font-bold">
						<Package className="text-primary" size={20} />
						{t("productModal.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="p-6 overflow-y-auto max-h-[calc(90vh-110px)] space-y-6 bg-white dark:bg-slate-900">
					{viewLoading ? (
						<ProductModalSkeleton />
					) : !product ? (
						<div className="py-10 text-center text-slate-500">{t("productModal.noData")}</div>
					) : (
						<>
							<div className="rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-sm">
								<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
									<div className="flex gap-4 max-md:flex-col">
										<div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border">
											{mainImage ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={avatarSrc(mainImage)} alt={product.name || "product"} className="w-full h-full object-cover" />
											) : (
												<ImageIcon className="text-slate-400" />
											)}
										</div>

										<div>
											<div className="text-xl font-semibold text-slate-900 dark:text-slate-50">{product.name ?? na}</div>

											<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
												<Badge className="rounded-full bg-primary/10 text-primary border border-primary/20">
													<Hash size={14} className="mr-1" />
													{t("common.id")}: {product.id}
												</Badge>

												<Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
													<Tag size={14} className="mr-1" />
													{t("productModal.category")}: {product?.category?.name ?? na}
												</Badge>

												<Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
													<Store size={14} className="mr-1" />
													{t("productModal.store")}: {product?.store?.name ?? na}
												</Badge>

												<Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
													<Warehouse size={14} className="mr-1" />
													{t("productModal.warehouse")}: {product?.warehouse?.name ?? na}
												</Badge>
												<Badge className="rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-200">
													{t("table.type")}: {product?.type === "single" ? t("types.single") : t("types.variable")}
												</Badge>
												{/* <Badge className={cn(
													"rounded-full border",
													product?.isActive === false
														? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200"
														: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200"
												)}>
													{product?.isActive === false ? t("common.inactive") : t("common.active")}
												</Badge> */}
											</div>

											<div className="mt-3 flex flex-wrap gap-2">
												<Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200">
													{t("productModal.wholesale")}: {formatCurrency(product.wholesalePrice || 0)}
												</Badge>

												<Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200">
													{t("productModal.salePrice")}: {formatCurrency(product.salePrice || 0)}
												</Badge>
												<Badge className="rounded-full bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-200">
													{t("productModal.lowestPrice")}: {formatCurrency(product.lowestPrice || 0)}
												</Badge>

												<Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
													{product.upsellingEnabled ? (
														<span className="inline-flex items-center gap-1">
															<CheckCircle2 size={14} className="text-green-600" />
															{t("productModal.upsellEnabled")}
														</span>
													) : (
														<span className="inline-flex items-center gap-1">
															<XCircle size={14} className="text-red-600" />
															{t("productModal.upsellDisabled")}
														</span>
													)}
												</Badge>
											</div>
										</div>
									</div>

									<div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
										<CalendarDays size={14} />
										{formatDate(product.created_at)}
									</div>
								</div>

								{product.storageRack ? (
									<div className="mt-4 text-sm text-slate-700 dark:text-slate-200">
										<span className="font-semibold">{t("common.storageRack")}:</span>{" "}
										<span className="text-slate-600 dark:text-slate-300">{product.storageRack}</span>
									</div>
								) : null}
							</div>

							{(product.description || product.callCenterProductDescription) ? (
								<div className="rounded-xl border p-4 bg-white dark:bg-slate-900">
									<div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{t("common.description")}</div>

									{product.description ? (
										<div className="text-sm text-slate-700 dark:text-slate-200">
											<span className="font-semibold">{t("common.general")}:</span>{" "}
											<span className="text-slate-600 dark:text-slate-300">{product.description}</span>
										</div>
									) : null}

									{product.callCenterProductDescription ? (
										<div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
											<span className="font-semibold">{t("common.callCenter")}:</span>{" "}
											<span className="text-slate-600 dark:text-slate-300">{product.callCenterProductDescription}</span>
										</div>
									) : null}
								</div>
							) : null}

							<Separator />

							<div className="space-y-3">
								<div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
									<ImageIcon size={16} />
									{t("common.images")} ({images.length})
								</div>

								{images.length === 0 ? (
									<div className="text-slate-500">{t("productModal.imagesEmpty")}</div>
								) : (
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
										{images.slice(0, 8).map((im, idx) => {
											const src = toAbsUrl(im?.url);
											return (
												<div key={idx} className="rounded-xl overflow-hidden border bg-slate-50 dark:bg-slate-800">
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img src={baseImg + (src || "")} alt={`img-${idx}`} className="w-full h-28 object-cover" />
												</div>
											);
										})}
									</div>
								)}
							</div>

							<Separator />

							<div className="rounded-xl border p-4 bg-white dark:bg-slate-900">
								<div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
									<Boxes size={16} />
									{t("common.stockSummary")}
								</div>

								<div className="flex flex-wrap gap-2">
									<Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
										{t("common.onHand")}: {totalStock}
									</Badge>
									<Badge className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200">
										{t("common.reserved")}: {totalReserved}
									</Badge>
									<Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200">
										{t("common.available")}: {totalAvailable}
									</Badge>
								</div>
							</div>

							<div className="space-y-3">
								<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
									{t("common.skus")} ({skus.length})
								</div>

								{skus.length === 0 ? (
									<div className="text-slate-500">{t("productModal.skusEmpty")}</div>
								) : (
									<div className="overflow-x-auto rounded-xl border">
										{/* 1. هذا الـ div هو الحل: يجبر المحتوى أن يكون عرضه 800px على الأقل */}
										<div className="min-w-[720px]">

											{/* Header */}
											<div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-200 px-4 py-3">
												<div className="col-span-4">{t("common.sku")}</div>
												<div className="col-span-2 text-center">{t("common.price")}</div>
												<div className="col-span-3 text-center">{t("common.attributes")}</div>
												<div className="col-span-3 text-center">{t("common.stock")}</div>
											</div>

											{/* Body */}
											<div className="divide-y">
												{skus.map((s) => {
													const attrs = s?.attributes ? Object.entries(s.attributes) : [];
													const avail = s?.available ?? Math.max(0, (s?.stockOnHand ?? 0) - (s?.reserved ?? 0));
													return (
														<div key={s.id} className="grid grid-cols-12 px-4 py-3 text-sm bg-white dark:bg-slate-900 items-center">

															{/* SKU Info */}
															<div className="col-span-4 overflow-hidden">
																<div className="font-semibold text-slate-900 dark:text-slate-50 truncate">{s.sku ?? `#${s.id}`}</div>
																<div className="text-xs text-slate-500 truncate">
																	{t("common.key")}: {s.key ?? na}
																</div>
																<div className="mt-1">
																	<Badge className={cn(
																		"rounded-full border text-[10px]",
																		s?.isActive === false
																			? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200"
																			: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200"
																	)}>
																		{s?.isActive === false ? t("common.inactive") : t("common.active")}
																	</Badge>
																</div>
															</div>

															<div className="col-span-2 flex flex-wrap items-center justify-center gap-1.5">

																<Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200">
																	{formatCurrency(s?.price || 0)}
																</Badge>
															</div>

															{/* Attributes */}
															<div className="col-span-3 flex flex-wrap items-center justify-center gap-1.5">
																{attrs.length === 0 ? (
																	<span className="text-slate-400">{na}</span>
																) : (
																	attrs.slice(0, 3).map(([k, v]) => (
																		<Badge key={k} className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap" >
																			{k}: {String(v)}
																		</Badge>
																	))
																)}
																{attrs.length > 3 && (
																	<Badge className="rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">+{attrs.length - 3}</Badge>
																)}
															</div>

															{/* Stock info */}
															{/* 3. تغيير flex-wrap إلى flex-nowrap لضمان بقائها في سطر واحد */}
															<div className="col-span-3 flex items-center justify-center gap-2 flex-nowrap">
																<Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0">
																	{t("common.onHand")}: {s.stockOnHand ?? 0}
																</Badge>
																<Badge className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 whitespace-nowrap shrink-0">
																	{t("common.reserved")}: {s.reserved ?? 0}
																</Badge>
																<Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 whitespace-nowrap shrink-0">
																	{t("common.available")}: {avail}
																</Badge>
															</div>

														</div>
													);
												})}
											</div>
										</div>
									</div>
								)}
							</div>

							<div className="space-y-3">
								<div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
									{t("common.upsellingProducts")} ({upsells.length})
								</div>

								{upsells.length === 0 ? (
									<div className="text-slate-500">{t("productModal.upsellingEmpty")}</div>
								) : (
									<div className="overflow-hidden rounded-xl border">
										<div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-200 px-4 py-3">
											<div className="col-span-2">{t("common.productId")}</div>
											<div className="col-span-3">{t("common.label")}</div>
											<div className="col-span-7">{t("common.callCenterDesc")}</div>
										</div>
										<div className="divide-y">
											{upsells.map((u, idx) => (
												<div key={idx} className="grid grid-cols-12 px-4 py-3 text-sm bg-white dark:bg-slate-900">
													<div className="col-span-2 font-mono text-slate-700 dark:text-slate-200">{u.productId ?? na}</div>
													<div className="col-span-3 font-semibold text-slate-900 dark:text-slate-50">{u.label ?? na}</div>
													<div className="col-span-7 text-slate-600 dark:text-slate-300">{u.callCenterDescription ?? na}</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog >
	);
}


/* ═══════════════════════════════════════════════════════════
	  SKELETON COMPONENTS (Inspired by OrderDetails)
═══════════════════════════════════════════════════════════ */


function ProductModalSkeleton() {
	return (
		<div className="space-y-6">
			{/* Top Banner Style Header */}
			<div className="relative main-card rounded-2xl border border-border/50 overflow-hidden p-5">
				<div className="h-[3px] rounded-full bg-muted/40 animate-pulse -mx-5 -mt-5 mb-5" />
				<div className="flex gap-4 items-start">
					<Bone className="w-20 h-20 rounded-xl shrink-0" />
					<div className="flex-1 space-y-3">
						<Bone className="h-5 w-48" />
						<div className="flex gap-2">
							<Bone className="h-4 w-20 rounded-full" />
							<Bone className="h-4 w-20 rounded-full" />
							<Bone className="h-4 w-20 rounded-full" />
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
				{/* Left Side: Images and SKUs */}
				<div className="lg:col-span-8 space-y-5">
					<div className="main-card rounded-2xl border border-border/50 p-5 space-y-4">
						<Bone className="h-4 w-24 mb-2" />
						<div className="grid grid-cols-4 gap-3">
							{[0, 1, 2, 3].map(i => <Bone key={i} className="h-24 rounded-xl" />)}
						</div>
					</div>

					{/* Table Skeleton (Exact copy of your Order table style) */}
					<div className="rounded-xl border border-border/30 overflow-hidden">
						<div className="bg-[var(--secondary)]/60 px-3 py-2.5 flex gap-6">
							{["w-16", "w-24", "w-20"].map((w, i) => <Bone key={i} className={`h-2.5 ${w}`} />)}
						</div>
						{[0, 1, 2].map(i => (
							<div key={i} className={cn("flex items-center gap-3 px-3 py-4 border-t border-border/20", i % 2 !== 0 && "bg-muted/15")}>
								<Bone className="w-10 h-10 rounded-lg shrink-0" />
								<div className="space-y-2">
									<Bone className="h-3 w-32" />
									<Bone className="h-2 w-20" />
								</div>
								<div className="flex-1" />
								<Bone className="h-3 w-12" />
								<Bone className="h-3 w-12" />
							</div>
						))}
					</div>
				</div>

				{/* Right Side: Summary Cards */}
				<div className="lg:col-span-4 space-y-4">
					<div className="main-card rounded-2xl border border-border/50 p-5 space-y-4">
						<Bone className="h-4 w-32" />
						<div className="space-y-3">
							{[0, 1, 2].map(i => (
								<div key={i} className="flex justify-between items-center py-1">
									<Bone className="h-3 w-20" />
									<Bone className="h-3 w-12" />
								</div>
							))}
						</div>
					</div>
					<BannerSkeleton />
				</div>
			</div>
		</div>
	);
}
