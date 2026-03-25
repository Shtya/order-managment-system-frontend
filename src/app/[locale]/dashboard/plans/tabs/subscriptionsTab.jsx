import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import {
  User,
  Calendar,
  Download,
  Loader2,
  Package,
  Infinity,
  Ban,
} from "lucide-react";
import api from "@/utils/api";
import Table, { FilterField } from "@/components/atoms/Table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { useDebounce } from "@/hook/useDebounce";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { platformCurrency } from "@/utils/healpers";


function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const SubscriptionStatus = Object.freeze({
  ACTIVE: "active",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
});

export default function SubscriptionsTab() {
  const t = useTranslations("subscriptions"); // Changed namespace to 'subscriptions'
  const router = useRouter();

  const [pager, setPager] = useState({
    records: [],
    total_records: 0,
    current_page: 1,
    per_page: 12,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [filters, setFilters] = useState({
    status: "all",
    startDate: null,
    endDate: null,
  });
  const [exportLoading, setExportLoading] = useState(false);

  // ── Build API params ────────────────────────────────────────────────
  const buildParams = (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    const params = { page, limit: per_page };

    // Using trim() to keep data clean before sending
    if (search.trim()) params.search = search.trim();
    if (filters.status && filters.status !== "all")
      params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    return params;
  };

  // ── Fetch subscriptions ───────────────────────────────────────────────
  const fetchSubscriptions = async (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    try {
      setLoading(true);
      const params = buildParams(page, per_page);
      const { data } = await api.get("/subscriptions", { params });

      setPager({
        total_records: data.total_records || 0,
        current_page: data.current_page || page,
        per_page: data.per_page || per_page,
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error(
        error?.response?.data?.message || t("messages.errorFetching"),
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSubscriptions(1, pager.per_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  // ── Apply filters ────────────────────────────────────────────────────
  const applyFilters = () => {
    toast.success(t("messages.filtersApplied").trim());
    fetchSubscriptions(1, pager.per_page);
  };

  // ── Handle pagination ────────────────────────────────────────────────
  const handlePageChange = ({ page, per_page }) => {
    fetchSubscriptions(page, per_page);
  };

  // ── Export subscriptions ─────────────────────────────────────────────
  const handleExport = async () => {
    let toastId;
    try {
      setExportLoading(true);
      toastId = toast.loading(t("messages.exportStarted").trim());

      const params = buildParams(1, 100000); // Usually want all for export

      const response = await api.get("/subscriptions/export", {
        params,
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = `subscriptions_export_${Date.now()}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(t("messages.exportSuccess").trim(), { id: toastId });
    } catch (error) {
      toast.dismiss();
      toast.error(
        error?.response?.data?.message || t("messages.exportFailed").trim(),
        { id: toastId },
      );
    } finally {
      setExportLoading(false);
    }
  };

  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    if (!selectedSub) return;

    setIsCancelling(true);
    try {
      await api.post(`/subscriptions/cancel/${selectedSub.id}`);

      toast.success(t("messages.cancelSuccess"));
      setCancelOpen(false);
      setSelectedSub(null);

      fetchSubscriptions();
    } catch (error) {
      toast.error(t("messages.error"));
    } finally {
      setIsCancelling(false);
    }
  };
  const { formatCurrency } = usePlatformSettings();
  // ── Columns Definition ────────────────────────────────────────────────
  const columns = useMemo(() => {
    return [
      {
        key: "user",
        header: t("columns.user"),
        cell: (row) => (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none mb-1">
                {row.user?.name || "—"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {row.user?.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "plan",
        header: t("columns.plan"),
        cell: (row) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Package size={14} className="text-blue-500" />
              <span className="text-sm font-medium">
                {row.plan?.name || t("status_labels.deleted_plan")}
              </span>
            </div>
            <Badge
              variant="secondary"
              className="w-fit text-[10px] px-1 py-0 h-4"
            >
              {row.planType}
            </Badge>
          </div>
        ),
      },
      {
        key: "usage_orders",
        header: t("columns.usage"),
        cell: (row) => {
          const total = row.includedOrders;
          const used = row.usedOrders || 0;
          const isUnlimited = total === null;
          const percentage = isUnlimited
            ? 0
            : Math.min((used / total) * 100, 100);

          return (
            <div className="flex flex-col w-32 gap-1.5">
              <div className="flex justify-between text-[10px] font-medium">
                <span>
                  {used} {t("units.orders")}
                </span>
                <span>
                  {isUnlimited ? (
                    <Infinity size={14} className="text-muted-foreground/70" />
                  ) : (
                    total
                  )}
                </span>
              </div>
              {!isUnlimited ? (
                <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${percentage > 90 ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              ) : (
                <span className="text-[10px] text-green-600 font-bold">
                  {t("status_labels.unlimited_access")}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "limits",
        header: t("columns.limits"),
        cell: (row) => (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] min-w-[150px]">
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">
                {t("filters.users")}:
              </span>
              <span className="font-medium">
                {!row.usersLimit && row.usersLimit !== 0 ? (
                  <Infinity size={14} className="text-muted-foreground/70" />
                ) : (
                  row.usersLimit
                )}
              </span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">
                {t("filters.stores")}:
              </span>
              <span className="font-medium">
                {!row.storesLimit && row.storesLimit !== 0 ? (
                  <Infinity size={14} className="text-muted-foreground/70" />
                ) : (
                  row.storesLimit
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("filters.shipping")}:
              </span>
              <span className="font-medium">
                {!row.shippingCompaniesLimit &&
                  row.shippingCompaniesLimit !== 0 ? (
                  <Infinity size={14} className="text-muted-foreground/70" />
                ) : (
                  row.shippingCompaniesLimit
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("filters.bulk")}:
              </span>
              <span className="font-medium">{row.bulkUploadPerMonth || 0}</span>
            </div>
          </div>
        ),
      },
      {
        key: "price",
        header: t("columns.price"),
        cell: (row) => (
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-primary tabular-nums text-sm">
                {formatCurrency(row.price, platformCurrency)}
              </span>
              {/* عرض المدة بجانب السعر */}
              <span className="text-[10px] text-muted-foreground font-medium">
                /{" "}
                {row.duration !== "custom" ? (
                  t(`durations.${row.duration || "monthly"}`)
                ) : (
                  <span>{t("units.days", { count: row.durationIndays })}</span>
                )}
              </span>
            </div>

            <div className="text-[10px] leading-tight mt-1">
              {row.extraOrderFee === null ? (
                <span className="text-red-500 font-medium">
                  {t("status_labels.excess_not_allowed")}
                </span>
              ) : Number(row.extraOrderFee) > 0 ? (
                <span className="text-muted-foreground">
                  +{row.extraOrderFee} {t("status_labels.per_extra_order")}
                </span>
              ) : (
                <span className="text-green-600 font-medium">
                  {t("status_labels.free_excess")}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: t("columns.status"),
        cell: (row) => {
          const statusConfig = {
            active: {
              color:
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              label: t("statuses.active"),
            },
            pending: {
              color:
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              label: t("statuses.pending"),
            },
            expired: {
              color:
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              label: t("statuses.expired"),
            },
            cancelled: {
              color:
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              label: t("statuses.cancelled"),
            },
          };
          const config = statusConfig[row.status] || {
            color: "bg-gray-100 text-gray-700",
            label: row.status,
          };
          return (
            <Badge
              variant="none"
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${config.color}`}
            >
              {config.label}
            </Badge>
          );
        },
      },
      {
        key: "duration",
        header: t("columns.startDate"),
        cell: (row) => (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar size={12} className="text-muted-foreground/70" />
            {formatDate(row.startDate)}
          </div>
        ),
      },
      {
        key: "endDate",
        header: t("columns.endDate"),
        cell: (row) => (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar size={12} className="text-muted-foreground/70" />
            {row.endDate ? formatDate(row.endDate) : "—"}
          </div>
        ),
      },

      {
        key: "actions",
        header: t("columns.actions"),
        cell: (row) => (
          <div className="flex items-center justify-center gap-2">
            {/* إظهار زر الإلغاء فقط إذا كان الاشتراك نشطاً */}
            {row.status === "active" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedSub(row);
                        setCancelOpen(true);
                      }}
                      className="w-9 h-9 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center dark:bg-red-950/30 dark:hover:bg-red-600 dark:border-red-900"
                    >
                      <Ban size={16} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("actions.cancelSubscription")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ),
      },
    ];
  }, [t, formatCurrency]);

  return (
    <>
      <Table
        // ── Search ─────────────────────────────────────────────────────────────
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        // ── i18n labels ───────────────────────────────────────────────────────
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: t("toolbar.filter"),
          apply: t("filters.apply"),
          total: t("pagination.total"),
          limit: t("pagination.limit"),
          emptyTitle: t("emptyTitle"),
          emptySubtitle: t("emptySubtitle"),
        }}
        // ── Actions ───────────────────────────────────────────────────────────
        actions={[
          {
            key: "export",
            label: t("toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "blue",
            onClick: handleExport,
            disabled: exportLoading,
          },
        ]}
        // ── Filters ───────────────────────────────────────────────────────────
        hasActiveFilters={
          filters.status !== "all" || filters.startDate || filters.endDate
        }
        onApplyFilters={applyFilters}
        filters={
          <>
            {/* Subscription Status */}
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm transition-all">
                  <SelectValue placeholder={t("filters.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value={SubscriptionStatus.ACTIVE}>
                    {t("statuses.active")}
                  </SelectItem>
                  <SelectItem value={SubscriptionStatus.EXPIRED}>
                    {t("statuses.expired")}
                  </SelectItem>
                  <SelectItem value={SubscriptionStatus.CANCELLED}>
                    {t("statuses.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            {/* Date Range */}
            <FilterField label={t("filters.date")}>
              <Flatpickr
                value={[
                  filters.startDate ? new Date(filters.startDate) : null,
                  filters.endDate ? new Date(filters.endDate) : null,
                ]}
                onChange={([start, end]) =>
                  setFilters((f) => ({
                    ...f,
                    startDate: start ? start.toISOString().split("T")[0] : null,
                    endDate: end ? end.toISOString().split("T")[0] : null,
                  }))
                }
                options={{
                  mode: "range",
                  dateFormat: "Y-m-d",
                  maxDate: "today",
                }}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-[var(--primary)] transition-all"
                placeholder={t("filters.datePlaceholder")}
              />
            </FilterField>
          </>
        }
        // ── Table ─────────────────────────────────────────────────────────────
        columns={columns}
        data={pager.records}
        isLoading={loading}
        // ── Pagination ────────────────────────────────────────────────────────
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
      />
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Ban size={20} />
              {t("dialogs.cancelSubTitle")}
            </DialogTitle>
            <DialogDescription className="py-4 text-base leading-relaxed">
              {t("dialogs.cancelSubDesc")}
              <span className="font-bold text-foreground mx-1">
                {selectedSub?.user?.name || selectedSub?.user?.email}
              </span>
              {t("dialogs.inPlan")}
              <span className="font-bold text-foreground mx-1">
                {selectedSub?.plan?.name}
              </span>
              ؟
              <br />
              <br />
              <span className="text-sm text-red-500/80 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg block border border-red-100 dark:border-red-900/50">
                {t("dialogs.cancelWarning")}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center gap-2 mt-2 sm:justify-start">
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              {isCancelling ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Ban size={16} />
              )}
              {t("actions.confirmCancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={isCancelling}
              className="w-full sm:w-auto"
            >
              {t("actions.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
