// --- File: page.jsx ---
"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, ChevronLeft, FileDown, Filter, Layers, Package, RefreshCw, Loader2, Info, Plus, Truck, CheckCircle, Boxes, PackageSearch, Download } from "lucide-react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";

import api from "@/utils/api";
import toast from "react-hot-toast";

import useProductsTab, { ProductViewModal } from "./ProductsTab";
import useBundlesTab, { BundleViewModal } from "./BundlesTab";
import useIdleTab from "./IdleTab";
import PageHeader from "@/components/atoms/Pageheader";
import Table, { FilterField } from "@/components/atoms/Table";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { useSearchParams } from "next/navigation";

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

function ProductsTableToolbar({ t, searchValue, onSearchChange, onExport, isFiltersOpen, onToggleFilters }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="relative w-[300px] focus-within:w-[350px] transition-all duration-300">
				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={t("toolbar.searchPlaceholder")}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					className={cn(
						"bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-1 !px-4 rounded-full",
						isFiltersOpen && "border-[rgb(var(--primary))]/50"
					)}
					onClick={onToggleFilters}
				>
					<Filter size={18} className="text-[#A7A7A7]" />
					{t("toolbar.filter")}
				</Button>

				<Button
					variant="outline"
					className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-1 !px-4 rounded-full"
					onClick={onExport}
				>
					<FileDown size={18} className="text-[#A7A7A7]" />
					{t("toolbar.export")}
				</Button>
			</div>
		</div>
	);
}

function FiltersPanel({ t, value, onChange, onApply, onReset, categories, stores, warehouses, currentTab }) {
	const isBundle = currentTab === "bundles";

	return (
		<motion.div
			initial={{ height: 0, opacity: 0, y: -6 }}
			animate={{ height: "auto", opacity: 1, y: 0 }}
			exit={{ height: 0, opacity: 0, y: -6 }}
			transition={{ duration: 0.25 }}
		>
			<div className="main-card !p-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
					{!isBundle && (
						<>
							<div className="space-y-2">
								<Label>{t("filters.storageRack")}</Label>
								<Input
									value={value.storageRack || ""}
									onChange={(e) => onChange({ ...value, storageRack: e.target.value })}
									placeholder={t("filters.storageRackPlaceholder")}
									className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
								/>
							</div>

							<div className="space-y-2">
								<Label>{t("filters.category")}</Label>
								<Select value={value.categoryId || ""} onValueChange={(v) => onChange({ ...value, categoryId: v })}>
									<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
										<SelectValue placeholder={t("filters.categoryPlaceholder")} />
									</SelectTrigger>
									<SelectContent className={"bg-card-select"}>
										<SelectItem value="none">{t("filters.any")}</SelectItem>
										{(categories || []).map((c) => (
											<SelectItem key={c.id} value={String(c.id)}>
												{c.label ?? c.name ?? `#${c.id}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>{t("filters.store")}</Label>
								<Select value={value.storeId || ""} onValueChange={(v) => onChange({ ...value, storeId: v })}>
									<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
										<SelectValue placeholder={t("filters.storePlaceholder")} />
									</SelectTrigger>
									<SelectContent className={"bg-card-select"}>
										<SelectItem value="none">{t("filters.any")}</SelectItem>
										{(stores || []).map((s) => (
											<SelectItem key={s.id} value={String(s.id)}>
												{s.label ?? s.name ?? `#${s.id}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>{t("filters.warehouse")}</Label>
								<Select value={value.warehouseId || ""} onValueChange={(v) => onChange({ ...value, warehouseId: v })}>
									<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
										<SelectValue placeholder={t("filters.warehousePlaceholder")} />
									</SelectTrigger>
									<SelectContent className={"bg-card-select"}>
										<SelectItem value="none">{t("filters.any")}</SelectItem>
										{(warehouses || []).map((w) => (
											<SelectItem key={w.id} value={String(w.id)}>
												{w.label ?? w.name ?? `#${w.id}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</>
					)}

					<div className="space-y-2">
						<Label>{currentTab !== "bundles" ? t("filters.wholesalePriceFrom") : t("filters.priceFrom")}</Label>
						<Input
							type="number"
							value={value.priceFrom ?? ""}
							onChange={(e) => onChange({ ...value, priceFrom: e.target.value })}
							placeholder={currentTab !== "bundles" ? t("filters.wholesalePriceFromPlaceholder") : t("filters.priceFromPlaceholder")}
							className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
						/>
					</div>

					<div className="space-y-2">
						<Label>{currentTab !== "bundles" ? t("filters.wholesalePriceTo") : t("filters.priceTo")}</Label>
						<Input
							type="number"
							value={value.priceTo ?? ""}
							onChange={(e) => onChange({ ...value, priceTo: e.target.value })}
							placeholder={currentTab !== "bundles" ? t("filters.wholesalePriceToPlaceholder") : t("filters.priceToPlaceholder")}
							className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
						/>
					</div>

					<div className="flex md:justify-end md:col-span-6 gap-2">
						<Button_
							onClick={onApply}
							size="sm"
							label={t("filters.apply")}
							tone="primary"
							variant="solid"
							icon={<Filter size={18} className="text-white" />}
						/>
						<Button type="button" variant="outline" onClick={onReset} className="rounded-full h-[40px] px-5">
							<RefreshCw size={16} />
							{t("filters.reset")}
						</Button>
					</div>
				</div>
			</div>
		</motion.div>
	);
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
	const t = useTranslations("products");
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const viewId = searchParams.get("id");
	const [active, setActive] = useState("products");
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
			{ id: "idle", label: t("tabs.idle"), icon: Box }
		],
		[t]
	);

	useEffect(() => {
		const handleUrlState = async () => {
			if (!viewId) return;

			const targetScope = active === "bundles" ? "bundles" : "products";

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
				value: summary.productCount.toString(),
				icon: Package,
				color: "#10B981", // Green
			},
			{
				name: t("stats.availableItems"),
				value: summary.inventory.available.toString(),
				icon: PackageSearch,
				color: "#3B82F6", // Blue
			},
			{
				// ✅ Updated to show Reserved Items
				name: t("stats.reservedItems"),
				value: summary.inventory.reserved.toString(),
				icon: Boxes, // ✅ Correct Lucide icon
				color: "#3B82F6",
			},
			{
				name: t("stats.withShippingCompanies"),
				value: summary.orders.inTransitQuantity.toString(), // From 'shipped' status
				icon: Truck,
				color: "#6B7CFF",
			},
			{
				name: t("stats.soldPieces"),
				value: summary.orders.soldQuantity.toString(), // From 'delivered' status
				icon: CheckCircle,
				color: "#F59E0B",
			},
		];
	}, [summary, t]);
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

			const baseRoute = active === "bundles" ? "/bundles" : "/products";

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

	const productsLogic = useProductsTab({
		t,
		searchDebounced,
		filters,
		filtersOpen,
		onAskDelete,
		onOpenView: openView,
		onExportRequest: (fn) => (exportBuilderRef.current = fn),
		activetab: active
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

	const current = active === "bundles" ? bundlesLogic : active === "idle" ? idleLogic : productsLogic;


	return (
		<div className="min-h-screen p-5">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.products") }
				]}
				buttons={
					<>
						<Button_
							href={active === "bundles" ? "/bundles/new" : "/products/new"}
							size="sm"
							label={active === "bundles" ? t("actions.addBundle") : t("actions.addProduct")}
							tone="primary"
							variant="solid"
							icon={<Plus size={15} />}
							permission={active === "bundles" ? "products.create" : "products.create"}
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
		</div>
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
