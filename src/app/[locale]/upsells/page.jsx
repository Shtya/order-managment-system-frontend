"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
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

export default function UpsellsPage() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const t = useTranslations("upsells");
  const { formatCurrency } = usePlatformSettings();

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
    noAnswer: 0,
    acceptedAfterTime: 0,
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
      { name: t("stats.sent"), value: stats.sent, icon: TrendingUp, color: "#8b5cf6" },
      { name: t("stats.accepted"), value: stats.accepted, icon: CheckCircle2, color: "#10b981" },
      { name: t("stats.rejected"), value: stats.rejected, icon: XCircle, color: "#ef4444" },
      { name: t("stats.noAnswer"), value: stats.noAnswer, icon: HelpCircle, color: "#3b82f6" },
      { name: t("stats.acceptedAfterTime"), value: stats.acceptedAfterTime, icon: Timer, color: "#f59e0b" },
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
      const params = {
        page,
        limit: per_page,
        search: debouncedSearch || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        productId: filters.productId !== "all" ? filters.productId : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const res = await api.get("/upsells", { params });
      setPager({
        total_records: res.data?.total_records ?? 0,
        current_page: res.data?.current_page ?? page,
        per_page: res.data?.per_page ?? per_page,
        records: res.data?.records ?? [],
      });
    } catch (e) {
      // For now, we don't have a backend mock, so we might get 404.
      // toast.error(normalizeAxiosError(e));
      setPager(p => ({ ...p, records: [] }));
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
    try {
      await api.delete(`/upsells/${deleteState.id}`);
      setDeleteState({ open: false, id: null });
      toast.success(t("messages.deleteSuccess"));
      fetchUpsells({ page: pager.current_page, per_page: pager.per_page });
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = row.isActive ? false : true;
      await api.patch(`/upsells/${row.id}/status`, { isActive: newStatus });
      toast.success(t("messages.statusUpdateSuccess"));
      fetchUpsells({ page: pager.current_page, per_page: pager.per_page });
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    }
  };

  const onExport = async () => {
    await handleExport({
      endpoint: "/upsells/export",
      params: {
        search: debouncedSearch || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        productId: filters.productId !== "all" ? filters.productId : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      },
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
              <span className="text-[10px] text-muted-foreground font-mono">#{row.triggerProduct?.id?.slice(0, 8)}</span>
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
              <span className="text-[10px] text-muted-foreground font-mono">SKU: {row.upsellProduct?.sku || "—"}</span>
            </div>
          </div>
        ),
      },
      {
        header: t("table.time"),
        key: "timeMs",
        cell: (row) => (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <Clock size={14} className="text-muted-foreground" />
            {row.timeMs}ms
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
            {previewState.upsell && (
              <div className="flex flex-col rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden shadow-sm">
                {/* Product Image Header */}
                <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                  {previewState.upsell.upsellProduct?.mainImage ? (
                    <img
                      src={previewState.upsell.upsellProduct.mainImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Tag size={48} />
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                      Special Offer!
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Would you like to add <span className="font-bold text-primary">{previewState.upsell.upsellProduct?.name}</span> to your order for only <span className="font-bold text-emerald-600">{formatCurrency(previewState.upsell.upsellPrice)}</span>?
                    </p>
                  </div>

                  {/* WhatsApp-style Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-primary text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 size={14} />
                      {t("actions.accept")}
                    </button>
                    <button className="w-full py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-500 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                      <XCircle size={14} />
                      {t("actions.reject")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
