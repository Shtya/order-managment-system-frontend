// --- File: page.jsx ---
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, ChevronLeft, FileDown, Filter, Layers, Package, RefreshCw, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

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
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import ProductsTab, { ProductViewModal } from "./ProductsTab";
import BundlesTab, { BundleViewModal } from "./BundlesTab";
import IdleTab from "./IdleTab";

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
      <div className="bg-card !p-4 mt-4">
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
            <Label>{t("filters.priceFrom")}</Label>
            <Input
              type="number"
              value={value.priceFrom ?? ""}
              onChange={(e) => onChange({ ...value, priceFrom: e.target.value })}
              placeholder={t("filters.priceFromPlaceholder")}
              className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("filters.priceTo")}</Label>
            <Input
              type="number"
              value={value.priceTo ?? ""}
              onChange={(e) => onChange({ ...value, priceTo: e.target.value })}
              placeholder={t("filters.priceToPlaceholder")}
              className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
            />
          </div>

          <div className="flex md:justify-end md:col-span-6 gap-2">
            <Button_
              onClick={onApply}
              size="sm"
              label={t("filters.apply")}
              tone="purple"
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

  const [active, setActive] = useState("products");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const defaultFilters = useMemo(() => ({ storageRack: "", categoryId: "", storeId: "", warehouseId: "", priceFrom: "", priceTo: "" }), []);
  const [filters, setFilters] = useState(defaultFilters);

  const [idleFromDate, setIdleFromDate] = useState(() => toISODateOnly(subMonths(new Date(), 2)));

  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [deleteState, setDeleteState] = useState({ open: false, id: null, scope: null });
  const [deleting, setDeleting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [viewScope, setViewScope] = useState(null);

  const exportBuilderRef = useRef(null);

  const items = useMemo(
    () => [
      { id: "products", label: t("tabs.products"), icon: Box },
      { id: "bundles", label: t("tabs.bundles"), icon: Layers },
      { id: "idle", label: t("tabs.idle"), icon: Box }
    ],
    [t]
  );

  const stats = useMemo(
    () => [
      { title: t("stats.withShippingCompanies"), value: "76", icon: Package, bg: "bg-[#F3F6FF] dark:bg-[#0B1220]", iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]", iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]" },
      { title: t("stats.returnedPieces"), value: "34", icon: Package, bg: "bg-[#FFF9F0] dark:bg-[#1A1208]", iconColor: "text-[#F59E0B] dark:text-[#FBBF24]", iconBorder: "border-[#F59E0B] dark:border-[#FBBF24]" },
      { title: t("stats.soldPieces"), value: "100", icon: Package, bg: "bg-[#F6FFF1] dark:bg-[#0E1A0C]", iconColor: "text-[#22C55E] dark:text-[#4ADE80]", iconBorder: "border-[#22C55E] dark:border-[#4ADE80]" },
      { title: t("stats.remainingPieces"), value: "500", icon: Package, bg: "bg-[#F1FAFF] dark:bg-[#0A1820]", iconColor: "text-[#38BDF8] dark:text-[#7DD3FC]", iconBorder: "border-[#38BDF8] dark:border-[#7DD3FC]" },
      { title: t("stats.totalProducts"), value: "500", icon: Package, bg: "bg-[#F6F0FF] dark:bg-[#140F2D]", iconColor: "text-[#8B5CF6] dark:text-[#A78BFA]", iconBorder: "border-[#8B5CF6] dark:border-[#A78BFA]" }
    ],
    [t]
  );

  useEffect(() => {
    const tId = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(tId);
  }, [search]);

  async function loadLookups() {
    const [cats, sts, whs] = await Promise.all([
      api.get("/lookups/categories", { params: { limit: 200 } }),
      api.get("/lookups/stores", { params: { limit: 200 } }),
      api.get("/lookups/warehouses", { params: { limit: 200 } })
    ]);
    setCategories(cats.data ?? []);
    setStores(sts.data ?? []);
    setWarehouses(whs.data ?? []);
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

  async function onExport() {
    try {
      const build = exportBuilderRef.current;
      if (!build) return toast.error(t("common.exportBuilderNotReady"));
      const params = build();
      const res = await api.get(`/products/export?${params.toString()}`, { responseType: "blob" });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const fileName = res.headers["content-disposition"]?.match(/filename="(.+?)"/)?.[1] || "products.xlsx";

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    }
  }

  const productsLogic = ProductsTab({
    t,
    searchDebounced,
    filters,
    filtersOpen,
    onAskDelete,
    onOpenView: openView,
    onExportRequest: (fn) => (exportBuilderRef.current = fn)
  });

  const bundlesLogic = BundlesTab({
    t,
    searchDebounced,
    filters,
    onAskDelete,
    onOpenView: openView,
    onExportRequest: (fn) => (exportBuilderRef.current = fn)
  });

  const idleLogic = IdleTab({
    t,
    searchDebounced,
    filters,
    idleFromDate,
    onAskDelete,
    onOpenView: openView,
    onExportRequest: (fn) => (exportBuilderRef.current = fn)
  });

  const current = active === "bundles" ? bundlesLogic : active === "idle" ? idleLogic : productsLogic;

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const applyFilters = () => {
    current.fetchData({ page: 1, per_page: current.pager.per_page });
  };

  const handlePageChange = ({ page, per_page }) => {
    current.fetchData({ page, per_page });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-gray-400">{t("breadcrumb.home")}</span>
            <ChevronLeft className="text-gray-400" size={18} />
            <span className="text-[rgb(var(--primary))]">{t("breadcrumb.products")}</span>
            <span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
          </div>

          <div className="flex items-center gap-4">
            <Button_
              href={active === "bundles" ? "/bundles/new" : "/products/new"}
              size="sm"
              label={active === "bundles" ? t("actions.addBundle") : t("actions.addProduct")}
              tone="purple"
              variant="solid"
              icon={<span className="text-white font-bold">+</span>}
            />
            <Button_ size="sm" label={t("actions.howToUse")} tone="white" variant="solid" icon={<span className="text-[#A7A7A7]">?</span>} />
          </div>
        </div>

        <SwitcherTabs items={items} activeId={active} onChange={setActive} className="w-full" />

        {active === "idle" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-slate-300">{t("idle.label")}</div>

            <div className="flex items-center gap-2">
              <Label className="text-xs">{t("idle.fromDate")}</Label>

              <Flatpickr
                value={idleFromDate}
                options={{ dateFormat: "Y-m-d" }}
                onChange={(dates) => {
                  const d = dates?.[0];
                  if (d) setIdleFromDate(toISODateOnly(d));
                }}
                className="h-[40px] px-4 rounded-md bg-card-select bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              />

              <Button variant="outline" onClick={() => current.fetchData({ page: 1, per_page: current.pager.per_page })}>
                {t("idle.applyDate")}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
              <InfoCard title={stat.title} value={stat.value} icon={stat.icon} bg={stat.bg} iconColor={stat.iconColor} iconBorder={stat.iconBorder} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-sm">
        <ProductsTableToolbar
          t={t}
          searchValue={search}
          onSearchChange={setSearch}
          onExport={onExport}
          isFiltersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
        />

        <AnimatePresence>
          {filtersOpen && (
            <FiltersPanel
              t={t}
              value={filters}
              onChange={setFilters}
              onApply={applyFilters}
              onReset={resetFilters}
              categories={categories}
              stores={stores}
              warehouses={warehouses}
              currentTab={active}
            />
          )}
        </AnimatePresence>

        <div className="mt-4">
          <DataTable
            key={active}
            columns={current.columns}
            data={current.pager.records}
            isLoading={current.loading}
            pagination={{
              total_records: current.pager.total_records,
              current_page: current.pager.current_page,
              per_page: current.pager.per_page
            }}
            onPageChange={handlePageChange}
            emptyState={t("empty")}
          />
        </div>
      </div>

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
        <BundleViewModal open={viewOpen} onOpenChange={(o) => (!o ? closeView() : null)} bundle={viewProduct} />
      ) : (
        <ProductViewModal open={viewOpen} onOpenChange={(o) => (!o ? closeView() : null)} product={viewProduct} />
      )}
    </div>
  );
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmText, cancelText, onConfirm, loading = false }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
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
