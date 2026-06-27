"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Plus,
  FileDown,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  Loader2,
  TrendingUp,
  XCircle,
  HelpCircle,
  Timer,
  Power,
  PowerOff,
  PackageCheck,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import ProductFilter from "@/components/atoms/ProductFilter";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { avatarSrc } from "@/components/atoms/UserSelect";
import TemplatePreview from "../whatsapp/atoms/TemplatePreview";

function normalizeAxiosError(err) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

function FilterField({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-muted-foreground uppercase">{label}</Label>
      {children}
    </div>
  );
}

function buildListQuery({ page, per_page, search, filters }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(per_page));
  if (search?.trim()) params.set("search", search.trim());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);

  if (filters.productId && filters.productId !== "all") params.set("productId", filters.productId);
  if (filters.startDate && filters.startDate !== "all") params.set("startDate", filters.startDate);
  if (filters.endDate && filters.endDate !== "all") params.set("endDate", filters.endDate);
  return params.toString();
}

export default function UpsellsPage() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const t = useTranslations("upsells");
  const { formatCurrency } = usePlatformSettings();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [loading, setLoading] = useState(true);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  
  const [stats, setStats] = useState({
    sent: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
    expired: 0,
    acceptedNonEligible: 0,
    failedToAdd: 0,
    delivered: 0,
  });

  const [deleteState, setDeleteState] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);
  const [previewState, setPreviewState] = useState({ open: false, upsell: null });

  const { handleExport, exportLoading } = useExport();

  const [filters, setFilters] = useState({
    status: "all",
    productId: "all",
    startDate: null,
    endDate: null,
  });

  const statsCards = useMemo(
    () => [
      { name: t("stats.sent"), description: t("statsDescription.sent"), value: stats.sent, icon: TrendingUp, color: "#8b5cf6" },
      { name: t("stats.accepted"), description: t("statsDescription.accepted"), value: stats.accepted, icon: CheckCircle2, color: "#10b981" },
      { name: t("stats.delivered"), description: t("statsDescription.delivered"), value: stats.delivered, icon: PackageCheck, color: "#059669" },
      { name: t("stats.rejected"), description: t("statsDescription.rejected"), value: stats.rejected, icon: XCircle, color: "#ef4444" },
      { name: t("stats.noAnswer"), description: t("statsDescription.noAnswer"), value: stats.pending, icon: HelpCircle, color: "#3b82f6" },
      { name: t("stats.expired"), description: t("statsDescription.expired"), value: stats.expired, icon: Timer, color: "#f59e0b" },
      { name: t("stats.acceptedNonEligible"), description: t("statsDescription.acceptedNonEligible"), value: stats.acceptedNonEligible, icon: Ban, color: "#64748b" },
      { name: t("stats.failedToAdd"), description: t("statsDescription.failedToAdd"), value: stats.failedToAdd, icon: AlertTriangle, color: "#dc2626" },
    ],
    [t, stats]
  );

  const fetchStats = async () => {
    try {
      const res = await api.get("/upsells/stats");
      setStats(res.data);
    } catch (error) {
      console.error(error);
      toast.error(t("messages.statsFailed"));
    }
  };
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fetchUpsells = async ({ page = 1, per_page = 12 } = {}) => {
    setLoading(true);
    try {
      const params = buildListQuery({ page, per_page, search: debouncedSearch, filters });

      const res = await api.get(`/upsells?${params}`);
      setPager({
        total_records: res.data?.total_records ?? 0,
        current_page: res.data?.current_page ?? page,
        per_page: res.data?.per_page ?? per_page,
        records: res.data?.records ?? [],
      });
    } catch (e) {
      console.error(e)
      toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpsells({ page: 1, per_page: pager.per_page });
  }, [debouncedSearch]);

  const applyFilters = () => {
    fetchUpsells({ page: 1, per_page: pager.per_page });
  };

  const handlePageChange = ({ page, per_page }) => {
    fetchUpsells({ page, per_page });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "all" ||
      filters.productId !== "all" ||
      filters.startDate !== null ||
      filters.endDate !== null
    );
  }, [filters]);

  const confirmDelete = async () => {
    setDeleting(true);
    const toastId = toast.loading(t("messages.loading"));
    try {
      await api.delete(`/upsells/${deleteState.id}`);
      setDeleteState({ open: false, id: null });
      toast.success(t("messages.deleteSuccess"), { id: toastId });
      fetchUpsells({ page: pager.current_page, per_page: pager.per_page });
      fetchStats();
    } catch (e) {
      toast.error(normalizeAxiosError(e), { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (row) => {
    const toastId = toast.loading(t("messages.loading"));
    try {
      await api.patch(`/upsells/${row.id}/toggle-active`);
      toast.success(t("messages.statusUpdateSuccess"), { id: toastId });
      fetchUpsells({ page: pager.current_page, per_page: pager.per_page });
      fetchStats();
    } catch (e) {
      toast.error(normalizeAxiosError(e), { id: toastId });
    }
  };

  const onExport = async () => {
    const params = buildListQuery({ page: 1, per_page: pager.per_page, search: debouncedSearch, filters });

    await handleExport({
      endpoint: "/upsells/export",
      params: {params},
      filename: `upsells_${Date.now()}.xlsx`,
    });
  };

  const columns = useMemo(
    () => [
      {
        header: t("table.triggerProduct"),
        key: "triggerProduct",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
              {row.triggerProduct?.mainImage ? (
                <img src={avatarSrc(row.triggerProduct.mainImage)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Tag size={16} />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs truncate">{row.triggerProduct?.name || "—"}</span>
              {/* <span className="text-[10px] text-muted-foreground font-mono">#{row.triggerProduct?.id?.slice(0, 8)}</span> */}
            </div>
          </div>
        ),
      },
      {
        header: t("table.upsellProduct"),
        key: "upsellProduct",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
              {row.upsellProduct?.mainImage ? (
                <img src={avatarSrc(row.upsellProduct.mainImage)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Tag size={16} />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs truncate">{row.upsellProduct?.name || "—"}</span>
              <span className="text-[10px] text-muted-foreground font-mono">SKU: {row.upsellSku?.sku || "—"}</span>
            </div>
          </div>
        ),
      },
      {
        header: t("table.time"),
        key: "expireTimeM",
        cell: (row) => (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <Clock size={14} className="text-muted-foreground" />
            {row.expireTimeM ? row.expireTimeM + "m" : "-"}
          </div>
        ),
      },
      {
        header: t("table.price"),
        key: "price",
        cell: (row) => (
          <div className="font-bold text-xs text-primary">
            {formatCurrency(row.upsellPrice)}
          </div>
        ),
      },
      {
        header: t("table.status"),
        key: "isActive",
        cell: (row) => (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
              row.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700"
            )}
          >
            {row.isActive ? t("table.active") : t("table.inactive")}
          </div>
        ),
      },
      {
        header: tCommon("actions"),
        key: "actions",
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Eye size={16} />,
                tooltip: t("actions.preview"),
                onClick: () => setPreviewState({ open: true, upsell: row }),
                variant: "primary",
              },
              {
                icon: <Pencil size={16} />,
                tooltip: t("actions.edit"),
                onClick: (r) => router.push(`/upsells/edit/${r.id}`),
                variant: "purple",
              },
              {
                icon: row.isActive ? <PowerOff size={16} /> : <Power size={16} />,
                tooltip: row.isActive ? t("actions.deactivate") : t("actions.activate"),
                onClick: () => toggleStatus(row),
                variant: row.isActive ? "orange" : "emerald",
              },
              {
                icon: <Trash2 size={16} />,
                tooltip: t("actions.delete"),
                onClick: () => setDeleteState({ open: true, id: row.id }),
                variant: "red",
              },
            ]}
          />
        ),
      },
    ],
    [t, tCommon, formatCurrency]
  );

  return (
    <div className="min-h-screen p-5 space-y-6">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.upsells") },
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={t("toolbar.addUpsell")}
              variant="solid"
              onClick={() => router.push("/upsells/add")}
              icon={<Plus size={18} />}
            />
          </>
        }
        stats={statsCards}
      />

      <Table
        isLoading={loading}
        data={pager.records}
        columns={columns}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: tCommon("filter"),
          apply: tCommon("apply"),
          total: tCommon("total"),
          limit: tCommon("limit"),
          emptyTitle: t("table.empty"),
        }}
        actions={[
          {
            key: "export",
            label: tCommon("export"),
            icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />,
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
          },
        ]}
        filters={
          <>
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  <SelectItem value="active">{t("table.active")}</SelectItem>
                  <SelectItem value="inactive">{t("table.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <ProductFilter
              label={t("filters.product")}
              value={filters.productId}
              onChange={(v) => setFilters((f) => ({ ...f, productId: v }))}
            />

            <FilterField label={t("filters.date")}>
              <DateRangePicker
                value={{ startDate: filters.startDate, endDate: filters.endDate }}
                onChange={(range) => setFilters((f) => ({ ...f, ...range }))}
                placeholder={t("filters.date")}
              />
            </FilterField>
          </>
        }
      />

      <ConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
        title={t("actions.delete")}
        description={t("actions.confirmDelete")}
        confirmText={tCommon("delete")}
        cancelText={tCommon("cancel")}
        loading={deleting}
        onConfirm={confirmDelete}
      />


      <Dialog
        open={previewState.open}
        onOpenChange={(open) => setPreviewState((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="text-primary" />
              {t("actions.preview")}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 max-w-[400px] mx-auto">
            {previewState.upsell ? <TemplatePreview
              isInteractive={true}
              template={{
                headerType: previewState.upsell?.messageConfig.headerType,
                headerText: previewState.upsell?.messageConfig.headerText,
                headerUrl: previewState.upsell?.messageConfig.headerUrl,
                bodyText: previewState.upsell?.messageConfig.bodyText,
                footerText: previewState.upsell?.messageConfig.footerText,
                buttons: previewState.upsell?.messageConfig.buttons,
                language: isRtl ? "ar" : "en"
              }}
            /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
