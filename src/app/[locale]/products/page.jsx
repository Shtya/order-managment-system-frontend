// --- File: page.jsx ---
"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, ChevronLeft, FileDown, Filter, Layers, Package, RefreshCw, Loader2, Info, Plus, Truck, CheckCircle, Boxes, PackageSearch, Download, Trash2, Hash, ShoppingCart, Undo2, Warehouse } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

import InfoCard from "@/components/atoms/InfoCard";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import DataTable from "@/components/atoms/DataTable";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Button_ from "@/components/atoms/Button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";

import api from "@/utils/api";
import toast from "react-hot-toast";

import useProductsTab, { ProductViewModal, SkuPrintModal, ProductOrdersByStatusModal } from "./ProductsTab";
import useBundlesTab, { BundleViewModal } from "./BundlesTab";
import useIdleTab from "./IdleTab";
import PageHeader from "@/components/atoms/Pageheader";
import Table, { FilterField } from "@/components/atoms/Table";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { useSearchParams } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, Store as StoreIcon, Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Badge } from "@/components/ui/badge";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { ExternalProductModal } from "../orders/failedOrders/[id]/page";
import { useOrdersSettings } from "@/hook/useOrdersSettings";

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

function toISODateOnly(d) {
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function subMonths(date, months) {
	const d = new Date(date);
	d.setMonth(d.getMonth() - months);
	return d;
}



export default function ProductsPage() {
	const tFailed = useTranslations('orders.failedOrders');
	const t = useTranslations("products");
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const viewId = searchParams.get("id");
	const [active, setActive] = useState("products");
	const { formatCurrency } = usePlatformSettings();
	const [search, setSearch] = useState("");
	const [searchDebounced, setSearchDebounced] = useState("");

	const [filtersOpen, setFiltersOpen] = useState(false);
	const defaultFilters = useMemo(() => ({ storageRack: "", categoryId: "", storeId: "", warehouseId: "", productType: "none", priceFrom: "", priceTo: "", salePriceFrom: "", salePriceTo: "" }), []);
	const [filters, setFilters] = useState(defaultFilters);
	const [filterErrors, setFilterErrors] = useState({});

	const [idleFromDate, setIdleFromDate] = useState(() => toISODateOnly(subMonths(new Date(), 2)));

	const [categories, setCategories] = useState([]);
	const [stores, setStores] = useState([]);
	const [storeProviders, setStoreProviders] = useState([]);
	const [warehouses, setWarehouses] = useState([]);

	const [deleteState, setDeleteState] = useState({ open: false, id: null, scope: null });
	const [deleting, setDeleting] = useState(false);

	const [viewOpen, setViewOpen] = useState(false);
	const [viewLoading, setViewLoading] = useState(false);
	const [viewProduct, setViewProduct] = useState(null);
	const [viewScope, setViewScope] = useState(null);
	const [exportLoading, setExportLoading] = useState(null);

	const [selectedProducts, setSelectedProducts] = useState([]);
	const [exportToStoreModal, setExportToStoreModal] = useState(false);
	const { reservedEnabled } = useOrdersSettings();
	
	const exportBuilderRef = useRef(null);

	const hasActiveFilters = useMemo(() => {
		// ignore empty strings & "none"
		return Object.values(filters).some((v) => v !== "" && v !== "none");
	}, [filters]);

	const onApplyFilters = () => {
		const nextErrors = {};
		const isInvalidRange = (from, to) => from !== "" && to !== "" && Number(from) > Number(to);
		if (isInvalidRange(filters.priceFrom, filters.priceTo)) {
			nextErrors.priceRange = t("filters.errors.fromMustBeLessOrEqualTo");
		}
		if (isInvalidRange(filters.salePriceFrom, filters.salePriceTo)) {
			nextErrors.salePriceRange = t("filters.errors.fromMustBeLessOrEqualTo");
		}
		setFilterErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;
		current.fetchData({ page: 1, per_page: current.pager.per_page });
	};

	const onResetFilters = () => {
		setFilters(defaultFilters);
		setFilterErrors({});
		current.fetchData({ page: 1, per_page: current.pager.per_page });
	};


	const items = useMemo(
		() => [
			{ id: "products", label: t("tabs.products"), icon: Box },
			{ id: "bundles", label: t("tabs.bundles"), icon: Layers },
			{ id: "idle", label: t("tabs.idle"), icon: Box },
			// { id: "deleted_products", label: t("tabs.deleted"), icon: Trash2 },
			// { id: "deleted_bundles", label: t("tabs.deleted_bundles"), icon: Trash2 }
		],
		[t]
	);

	useEffect(() => {
		const handleUrlState = async () => {
			if (!viewId) return;

			const targetScope = ["bundles", "deleted_bundles"]?.includes(active) ? "bundles" : "products";

			await openView(viewId, targetScope);

			const params = new URLSearchParams(searchParams.toString());
			params.delete("id");

			const cleanPath = params.toString() ? `${pathname}?${params.toString()}` : pathname;
			router.replace(cleanPath, { scroll: false });
		};

		handleUrlState();
	}, [viewId, active, pathname, router, searchParams]);

	const [summary, setSummary] = useState(null);
	const [loadingSummary, setLoadingSummary] = useState(true);

	// 2. Fetch the data on component mount
	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await api.get('/products/summary'); // Use your axios/fetch instance
				setSummary(response.data);
			} catch (error) {
				console.error("Failed to fetch statistics", error);
			} finally {
				setLoadingSummary(false);
			}
		};
		fetchStats();
	}, []);

	const filteredStores = useMemo(() => {
		return stores.filter((s) => {
			if (active !== "bundles") return true;
			const provider = storeProviders.find((p) => p.code === s.provider);
			return provider?.supportBundle;
		});
	}, [stores, active, storeProviders]);

	const stats = useMemo(() => {
		if (!summary) return [];

		return [
			{
				name: t("stats.totalProducts"),
				description: t("statsDescription.totalProducts"),
				value: summary.productCount.toString(),
				icon: Package,
				color: "#10B981", // Green
			},
			{
				name: t("stats.totalStock"),
				description: t("statsDescription.totalStock"),
				value: (Number(summary.purchases.acceptedQuantity) - Number(summary.purchaseReturns.acceptedReturnedQuantity || 0)).toString(),
				icon: Layers,
				color: "#10B981", // Green
			},
			{
				name: t("stats.availableItems"),
				description: t("statsDescription.availableItems"),
				value: summary.inventory.totalOnHand.toString(),
				icon: PackageSearch,
				color: "#3B82F6", // Blue
			},
			{
				name: t("stats.withShippingCompanies"),
				description: t("statsDescription.withShippingCompanies"),
				value: summary.orders.inTransitQuantity.toString(), // From 'shipped' status
				icon: Truck,
				color: "#6B7CFF",
			},
			{
				name: t("stats.soldPieces"),
				description: t("statsDescription.soldPieces"),
				value: summary.orders.soldQuantity.toString(), // From 'delivered' status
				icon: CheckCircle,
				color: "#F59E0B",
			},
			...(reservedEnabled ? [{
				// ✅ Updated to show Reserved Items
				name: t("stats.reservedItems"),
				description: t("statsDescription.reservedItems"),
				value: summary.inventory.reserved.toString(),
				icon: Boxes, // ✅ Correct Lucide icon
				color: "#3B82F6",
			}] : []),
			{
				// ✅ Updated to show Reserved Items
				name: t("stats.remaingStock"),
				description: t("statsDescription.remaingStock"),
				value: (Number(summary.orders.inTransitQuantity || 0) + Number(summary.inventory.totalOnHand || 0)).toString(),
				icon: PackageSearch, // ✅ Correct Lucide icon
				color: "#3B82F6",
			},
		];
	}, [summary, t, reservedEnabled]);
	useEffect(() => {
		const tId = setTimeout(() => setSearchDebounced(search), 400);
		return () => clearTimeout(tId);
	}, [search]);

	async function loadLookups() {
		const [cats, sts, whs, providers] = await Promise.all([
			api.get("/lookups/categories", { params: { limit: 200 } }),
			api.get("/lookups/stores", { params: { limit: 200 } }),
			api.get("/lookups/warehouses", { params: { limit: 200 } }),
			api.get("/stores/providers", { params: { limit: 200 } })
		]);
		setCategories(cats.data ?? []);
		setStores(sts.data ?? []);
		setWarehouses(whs.data ?? []);
		setStoreProviders(providers.data?.providers ?? []);
	}

	useEffect(() => {
		(async () => {
			try {
				await loadLookups();
			} catch (e) {
				toast.error(normalizeAxiosError(e));
			}
		})();
	}, []);

	const onAskDelete = (id, scope) => setDeleteState({ open: true, id, scope });

	const openView = async (payload, scope) => {
		setViewScope(scope);
		setViewOpen(true);
		setViewProduct(null);

		if (scope === "bundles" && payload && typeof payload === "object") {
			setViewLoading(false);
			setViewProduct(payload);
			return;
		}

		const id = payload;
		setViewLoading(true);

		try {
			const endpoint = scope === "bundles" ? "/bundles" : "/products";
			const res = await api.get(`${endpoint}/${id}`);
			setViewProduct(res.data);
		} catch (e) {
			toast.error(normalizeAxiosError(e));
			setViewOpen(false);
		} finally {
			setViewLoading(false);
		}
	};

	const closeView = () => {

		setViewOpen(false);
		setViewProduct(null);
		setViewScope(null);
	};

	async function confirmDelete() {
		const { id, scope } = deleteState;
		if (!id) return;
		setDeleting(true);
		setDeleteState({ open: false, id: null, scope: null });

		try {
			const endpoint = scope === "bundles" ? "/bundles" : "/products";
			await api.delete(`${endpoint}/${id}`);
			toast.success(t("delete.success"));

			if (scope === "bundles") {
				bundlesLogic.removeRowFromPager?.(id);
			} else {
				current.fetchData({ page: 1, per_page: current.pager.per_page });
			}
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setDeleting(false);
		}
	}

	const onExport = useCallback(async () => {
		let toastId;

		try {
			const build = exportBuilderRef.current;
			if (!build) {
				return toast.error(t("common.exportBuilderNotReady"));
			}

			setExportLoading(true);
			toastId = toast.loading(t("messages.exportStarted"));

			const params = build();

			// remove pagination for export
			params.delete("page");
			params.delete("limit");

			const baseRoute = ["bundles", "deleted_bundles"]?.includes(active) ? "/bundles" : "/products";

			// 2. Call the export endpoint
			const response = await api.get(`${baseRoute}/export`, {
				params,
				responseType: "blob", // Critical for receiving Excel files
			});

			const contentDisposition = response.headers["content-disposition"];
			let filename = `${active}_export_${Date.now()}.xlsx`;

			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?([^";]+)"?/);
				if (match?.[1]) filename = match[1];
			}

			const url = window.URL.createObjectURL(
				new Blob([response.data], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				})
			);

			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);

			toast.success(t("messages.exportSuccess"), { id: toastId });
		} catch (e) {
			toast.error(
				e?.response?.data?.message || t("messages.exportFailed"),
				{ id: toastId }
			);
		} finally {
			setExportLoading(false);
		}
	}, [t, active]);

	const [externalModal, setExternalModal] = useState({ isOpen: false, remoteId: null, provider: null });
	const [externalCache, setExternalCache] = useState({});
	const productsLogic = useProductsTab({
		t,
		searchDebounced,
		filters,
		filtersOpen,
		onAskDelete,
		onOpenView: openView,
		onExportRequest: (fn) => (exportBuilderRef.current = fn),
		activetab: active,
		selectedProducts,
		setSelectedProducts,
		setExternalModal
	});

	const bundlesLogic = useBundlesTab({
		t,
		searchDebounced,
		filters,
		onAskDelete,
		onOpenView: openView,
		onExportRequest: (fn) => (exportBuilderRef.current = fn),
		activetab: active
	});

	const idleLogic = useIdleTab({
		t,
		searchDebounced,
		filters,
		idleFromDate,
		onAskDelete,
		onOpenView: openView,
		onExportRequest: (fn) => (exportBuilderRef.current = fn),
		activetab: active
	});


	const handleFetchExternalProduct = async (remoteId, provider) => {
		if (externalCache[remoteId]?.data || externalCache[remoteId]?.loading) return;
		try {
			setExternalCache(prev => ({ ...prev, [remoteId]: { loading: true } }));
			const res = await api.get(`/stores/external/${provider}?id=${remoteId}`);
			setExternalCache(prev => ({ ...prev, [remoteId]: { loading: false, data: res.data } }));
		} catch (err) {
			setExternalCache(prev => ({ ...prev, [remoteId]: { loading: false, error: true } }));
			toast.error(normalizeAxiosError(err) || tFailed('errors.externalFetchFailed'));
		}
	};


	const current = ["bundles", "deleted_bundles"]?.includes(active) ? bundlesLogic : active === "idle" ? idleLogic : productsLogic;


	return (
		<div className="min-h-screen p-5">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/dashboard" },
					{ name: t("breadcrumb.products") }
				]}
				buttons={
					<>
						<Button_
							href={["bundles", "deleted_bundles"]?.includes(active) ? "/bundles/new" : "/products/new"}
							size="sm"
							label={["bundles", "deleted_bundles"]?.includes(active) ? t("actions.addBundle") : t("actions.addProduct")}
							tone="primary"
							variant="solid"
							icon={<Plus size={15} />}
							permission={["bundles", "deleted_bundles"]?.includes(active) ? "products.create" : "products.create"}
						/>
						<Button_ size="sm" label={t("actions.howToUse")} tone="outline" variant="ghost" icon={<Info size={15} />} permission="products.read" />
					</>
				}
				stats={stats}
				statsLoading={loadingSummary}
				items={items}
				active={active}
				setActive={setActive}
			/>

			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={() => { }}
				labels={{
					searchPlaceholder: t("toolbar.searchPlaceholder"),
					filter: t("toolbar.filter"),
					apply: t("filters.apply"),
					total: t("common.total"),
					limit: t("common.limit"),
					emptyTitle: t("empty"),
					emptySubtitle: "",
				}}
				actions={[
					{
						key: "exportToStore",
						label: selectedProducts.length > 0 ? t("toolbar.exportToStoreCount", { count: selectedProducts.length }) : t("toolbar.exportToStore"),
						icon: <StoreIcon size={14} />,
						color: "primary",
						disabled: selectedProducts.length === 0,
						onClick: () => setExportToStoreModal(true),
						permission: "products.update",
						hidden: active !== "products"
					},
					{
						key: "export",
						label: t("toolbar.export"),
						icon: exportLoading
							? <Loader2 size={14} className="animate-spin" />
							: <Download size={14} />,
						color: "primary",
						disabled: exportLoading,
						onClick: onExport,
						permission: "products.read",
					}
				]}
				hasActiveFilters={hasActiveFilters}
				onApplyFilters={onApplyFilters}
				filters={
					<>
						{/* Storage Rack */}
						{active !== "bundles" && (
							<FilterField label={t("filters.storageRack")}>
								<Input
									value={filters.storageRack || ""}
									onChange={(e) => setFilters((f) => ({ ...f, storageRack: e.target.value }))}
									placeholder={t("filters.storageRackPlaceholder")}
									className="h-10 rounded-xl text-sm"
								/>
							</FilterField>
						)}

						{/* Category */}
						{active !== "bundles" && (
							<FilterField label={t("filters.category")}>
								<Select
									value={filters.categoryId || "none"}
									onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v }))}
								>
									<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
										<SelectValue placeholder={t("filters.categoryPlaceholder")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("filters.any")}</SelectItem>
										{categories.map((c) => (
											<SelectItem key={c.id} value={String(c.id)}>
												{c.label ?? c.name ?? `#${c.id}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FilterField>
						)}

						{/* Store */}
						<FilterField label={t("filters.store")}>
							<Select
								value={filters.storeId || "none"}
								onValueChange={(v) => setFilters((f) => ({ ...f, storeId: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.storePlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">{t("filters.any")}</SelectItem>
									{filteredStores.map((s) => (
										<SelectItem key={s.id} value={String(s.id)}>
											{s.label ?? s.name ?? `#${s.id}`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						{/* Warehouse */}
						{active !== "bundles" && (
							<FilterField label={t("filters.warehouse")}>
								<Select
									value={filters.warehouseId || "none"}
									onValueChange={(v) => setFilters((f) => ({ ...f, warehouseId: v }))}
								>
									<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
										<SelectValue placeholder={t("filters.warehousePlaceholder")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("filters.any")}</SelectItem>
										{warehouses.map((w) => (
											<SelectItem key={w.id} value={String(w.id)}>
												{w.label ?? w.name ?? `#${w.id}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FilterField>
						)}
						{active !== "bundles" && (
							<FilterField label={t("filters.type")}>
								<Select
									value={filters.productType || "none"}
									onValueChange={(v) => setFilters((f) => ({ ...f, productType: v }))}
								>
									<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
										<SelectValue placeholder={t("filters.typePlaceholder")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("filters.any")}</SelectItem>
										<SelectItem value="single">{t("types.single")}</SelectItem>
										<SelectItem value="variable">{t("types.variable")}</SelectItem>
									</SelectContent>
								</Select>
							</FilterField>
						)}

						{/* Price From */}
						<FilterField label={active !== "bundles" ? t("filters.wholesalePriceFrom") : t("filters.priceFrom")}>
							<Input
								type="number"
								value={filters.priceFrom ?? ""}
								onChange={(e) => setFilters((f) => ({ ...f, priceFrom: e.target.value }))}
								placeholder={active !== "bundles" ? t("filters.wholesalePriceFromPlaceholder") : t("filters.priceFromPlaceholder")}
								className="h-10 rounded-xl text-sm"
							/>
						</FilterField>

						{/* Price To */}
						<FilterField label={active !== "bundles" ? t("filters.wholesalePriceTo") : t("filters.priceTo")}>
							<Input
								type="number"
								value={filters.priceTo ?? ""}
								onChange={(e) => setFilters((f) => ({ ...f, priceTo: e.target.value }))}
								placeholder={active !== "bundles" ? t("filters.wholesalePriceToPlaceholder") : t("filters.priceToPlaceholder")}
								className="h-10 rounded-xl text-sm"
							/>
						</FilterField>

						{active !== "bundles" && <>
							<FilterField label={t("filters.salePriceFrom")}>
								<Input
									type="number"
									value={filters.salePriceFrom ?? ""}
									onChange={(e) => setFilters((f) => ({ ...f, salePriceFrom: e.target.value }))}
									placeholder={t("filters.salePriceFromPlaceholder")}
									className="h-10 rounded-xl text-sm"
								/>
							</FilterField>

							{/* Sale Price To */}
							<FilterField label={t("filters.salePriceTo")}>
								<Input
									type="number"
									value={filters.salePriceTo ?? ""}
									onChange={(e) => setFilters((f) => ({ ...f, salePriceTo: e.target.value }))}
									placeholder={t("filters.salePriceToPlaceholder")}
									className="h-10 rounded-xl text-sm"
								/>
							</FilterField>
						</>}

						{/* Idle tab extra filter example (optional) */}
						{active === "idle" && (
							<FilterField label={t("tabs.idleDate")}>
								<DateRangePicker
									mode="single"
									value={idleFromDate}
									onChange={(date) => {
										setIdleFromDate(date);
									}}
									dataSize="default"
								/>
							</FilterField>
						)}
						{(filterErrors.priceRange || filterErrors.salePriceRange) && (
							<div className="md:col-span-full">
								<p className="text-[12px] text-red-500 font-medium">
									{filterErrors.priceRange || filterErrors.salePriceRange}
								</p>
							</div>
						)}
					</>
				}
				columns={current.columns}
				data={current.pager.records}
				isLoading={current.loading}
				pagination={{
					total_records: current.pager.total_records,
					current_page: current.pager.current_page,
					per_page: current.pager.per_page,
				}}
				onPageChange={({ page: p, per_page }) => current.fetchData({ page: p, per_page })}
			/>

			<ConfirmDialog
				open={deleteState.open}
				onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
				title={t("delete.title")}
				description={t("delete.desc")}
				confirmText={t("delete.confirm")}
				cancelText={t("delete.cancel")}
				loading={deleting}
				onConfirm={confirmDelete}
			/>

			{viewScope === "bundles" ? (
				<BundleViewModal open={viewOpen} onOpenChange={(o) => (!o ? closeView() : null)} bundle={viewProduct} viewLoading={viewLoading} />
			) : (
				<ProductViewModal open={viewOpen} onOpenChange={(o) => (!o ? closeView() : null)} product={viewProduct} viewLoading={viewLoading} />
			)}

			<SkuPrintModal
				open={productsLogic.printModal.open}
				onClose={() => productsLogic.setPrintModal({ open: false, product: null })}
				product={productsLogic.printModal.product}
			/>

			<ProductOrdersByStatusModal
				open={productsLogic.productOrdersModal.open}
				onOpenChange={(o) => productsLogic.setProductOrdersModal((m) => ({ ...m, open: o }))}
				title={productsLogic.productOrdersModal.title}
				loading={productsLogic.productOrdersModal.loading}
				orders={productsLogic.productOrdersModal.orders}
				shippingCompany={productsLogic.productOrdersModal.shippingCompany}
				onShippingCompanyChange={productsLogic.handleShippingCompanyChange}
				onExport={productsLogic.handleOrdersExport}
				exportLoading={productsLogic.exportLoading}
			/>

			<ExportToStoreModal
				open={exportToStoreModal}
				onOpenChange={setExportToStoreModal}
				selectedProductIds={selectedProducts}
				onSuccess={() => setSelectedProducts([])}
			/>

			<ExternalProductModal
				isOpen={externalModal.isOpen}
				onClose={() => setExternalModal({ isOpen: false, remoteId: null, provider: null })}
				remoteId={externalModal.remoteId}
				provider={externalModal.provider}
				cache={externalCache[externalModal.remoteId]}
				onFetch={handleFetchExternalProduct}
				formatCurrency={formatCurrency}
			/>
		</div>
	);
}

function ExportToStoreModal({ open, onOpenChange, selectedProductIds, onSuccess }) {
	const t = useTranslations("products");
	const [stores, setStores] = useState([]);
	const [loading, setLoading] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [products, setProducts] = useState([]);
	const [selectedStoreId, setSelectedStoreId] = useState(null);
	const { subscribe } = useSocket();

	useEffect(() => {
		if (open) {
			setSelectedStoreId(null);
			fetchData();
			const unsubscribe = subscribe("STORE_SYNC_STATUS", (payload) => {
				if (payload) {
					const { storeId, status, type } = payload;
					if (type !== "local") return;
					setStores((prev) =>
						prev.map((s) =>
							s.id === storeId ? { ...s, localSyncStatus: status } : s
						)
					);
				}
			});
			return unsubscribe;
		}
	}, [open, subscribe]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const [storesRes, productsRes] = await Promise.all([
				api.get("/lookups/stores", { params: { limit: 200, isActive: true } }),
				api.get("/products", { params: { ids: selectedProductIds.join(","), limit: 100 } })
			]);
			setStores(storesRes.data || []);
			setProducts(productsRes.data?.records || []);
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setLoading(false);
		}
	};

	const handleExport = async (storeId) => {
		setExporting(true);
		const toastId = toast.loading(t("messages.exportingToStore"));
		try {
			await api.post(`/stores/${storeId}/sync-products`, { productIds: selectedProductIds });
			toast.success(t("messages.exportToStoreStarted"), { id: toastId });
			// ✅ Update local state immediately
			setStores((prev) =>
				prev.map((s) =>
					s.id === storeId ? { ...s, localSyncStatus: "syncing" } : s
				)
			);
			onOpenChange(false);
			onSuccess();
		} catch (e) {
			toast.error(normalizeAxiosError(e), { id: toastId });
		} finally {
			setExporting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl! h-[85vh] overflow-hidden p-0 bg-white dark:bg-slate-950 flex flex-col">
				<DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
					<DialogTitle className="flex items-center gap-2 text-xl font-bold">
						<StoreIcon className="text-primary" size={20} />
						{t("exportModal.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{loading ? (
						<div className="flex flex-col items-center justify-center py-12 gap-3">
							<Loader2 size={32} className="animate-spin text-primary" />
							<span className="text-sm text-muted-foreground font-medium">{t("common.loading")}...</span>
						</div>
					) : (
						<>
							{/* Summary section like SkuSelectorModal */}
							<div className="rounded-xl border p-4 shadow-sm bg-muted/10">
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
										<Package className="w-6 h-6 text-primary" />
									</div>
									<div>
										<h4 className="text-lg font-bold">{t("exportModal.selectedProducts")}</h4>
										<p className="text-sm text-slate-500 mt-0.5">
											{t("exportModal.description", { count: selectedProductIds.length })}
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-3">
								<h5 className="text-sm font-semibold flex items-center gap-2">
									<Hash size={16} className="text-primary" />
									{t("exportModal.selectedProducts")} ({products.length})
								</h5>

								<div className="border rounded-xl overflow-hidden shadow-sm">
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead className="bg-muted/50 border-b">
												<tr>
													<th className="px-4 py-3 text-start font-bold">{t("table.name")}</th>
													<th className="px-4 py-3 text-center font-bold">{t("table.sku")}</th>
													<th className="px-4 py-3 text-end font-bold">{t("table.wholesalePrice")}</th>
												</tr>
											</thead>
											<tbody className="divide-y">
												{products.map((p) => (
													<tr key={p.id} className="hover:bg-muted/30 transition-colors">
														<td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{p.name}</td>
														<td className="px-4 py-3 text-center font-mono text-xs text-slate-500">{p.skus?.[0]?.sku || "N/A"}</td>
														<td className="px-4 py-3 text-end font-bold text-primary">{p.wholesalePrice}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>

							<div className="space-y-3">
								<h5 className="text-sm font-semibold flex items-center gap-2">
									<Activity size={16} className="text-primary" />
									{t("exportModal.selectStore")}
								</h5>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{stores.map((s) => {
										const isSyncing = s.localSyncStatus === "syncing";
										const isSelected = selectedStoreId === s.id;
										return (
											<button
												key={s.id}
												disabled={isSyncing || exporting}
												onClick={() => setSelectedStoreId(s.id)}
												className={cn(
													"flex items-center justify-between p-4 rounded-2xl border transition-all group",
													isSyncing
														? "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed"
														: isSelected
															? "bg-primary/5 border-primary shadow-md"
															: "bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 shadow-sm hover:shadow-md"
												)}
											>
												<div className="flex items-center gap-3">
													<div className={cn(
														"w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
														isSyncing ? "bg-slate-200 dark:bg-slate-800" : isSelected ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/20"
													)}>
														<StoreIcon className={cn("w-5 h-5", isSyncing ? "text-slate-400" : isSelected ? "text-white" : "text-slate-500 group-hover:text-primary")} />
													</div>
													<div className="text-left">
														<p className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</p>
														<p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">{s.provider}</p>
													</div>
												</div>
												{isSyncing ? (
													<Badge variant="primary" className="bg-amber-100 text-amber-700 border-amber-200 animate-pulse text-[10px] font-black">
														<RefreshCw className="w-3 h-3 mr-1 animate-spin" />
														{t("common.syncing")}
													</Badge>
												) : isSelected ? (
													<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-primary">
														<CheckCircle2 className="w-4 h-4 text-white" />
													</div>
												) : (
													<div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100 dark:border-slate-800">
														<Plus className="w-4 h-4 text-primary" />
													</div>
												)}
											</button>
										);
									})}
								</div>
							</div>
						</>
					)}
				</div>

				<DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 shrink-0">
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						className="rounded-xl font-bold text-slate-500 hover:text-slate-700"
					>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!selectedStoreId || exporting}
						onClick={() => handleExport(selectedStoreId)}
						className="rounded-xl font-bold px-8"
					>
						{exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
						{t("toolbar.export")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmText, cancelText, onConfirm, loading = false }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-md  rounded-xl border">
				<div className="space-y-2">
					<h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
					{description ? <p className="text-sm text-gray-500 dark:text-slate-400">{description}</p> : null}
				</div>

				<div className="mt-6 flex items-center justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
						{cancelText}
					</Button>

					<Button variant="destructive" onClick={onConfirm} disabled={loading}>
						{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
