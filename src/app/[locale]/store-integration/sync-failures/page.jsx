"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FileDown,
  Plus,
  Info,
  Eye,
  Package,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Store,
  Activity,
  Clock,
  Search,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import Table, { FilterField } from "@/components/atoms/Table";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { Bone } from "@/components/atoms/BannerSkeleton";
import StoreFilter from "@/components/atoms/StoreFilter";
import PageHeader from "@/components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";

// ─────────────────────────────────────────────────────────────────────────────
// Log Details Modal
// ─────────────────────────────────────────────────────────────────────────────
function LogDetailsModal({ isOpen, onClose, log, isLoading }) {
  const t = useTranslations("syncFailures");

  const renderJson = (json) => {
    if (!json) return <span className="text-muted-foreground italic">None</span>;
    return (
      <pre className="bg-slate-950 text-slate-50 p-4 rounded-xl overflow-auto text-xs font-mono max-h-[400px] custom-scrollbar border-2 border-slate-800 shadow-inner">
        {JSON.stringify(json, null, 2)}
      </pre>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950 border-none shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 border-2 border-red-100 dark:border-red-900/30">
              <Activity className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t("details.title")}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="font-medium">ID:</span>
                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{log?.id}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-3 gap-4">
                <Bone className="h-20 w-full rounded-xl" />
                <Bone className="h-20 w-full rounded-xl" />
                <Bone className="h-20 w-full rounded-xl" />
              </div>
              <Bone className="h-32 w-full rounded-xl" />
              <Bone className="h-64 w-full rounded-xl" />
            </div>
          ) : !log ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
              <Package className="w-16 h-16 opacity-20" />
              <p className="font-bold text-lg">Log not found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800">
                  <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 block">{t("details.action")}</Label>
                  <Badge variant="outline" className="font-black uppercase tracking-wider text-[10px] border-2">
                    {log.action}
                  </Badge>
                </div>
                <div className="p-4 space-y-2  rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800">
                  <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 block">{t("details.responseStatus")}</Label>
                  <p className={cn(
                    "text-lg font-black",
                    log.responseStatus >= 200 && log.responseStatus < 300 ? "text-green-600" : "text-red-600"
                  )}>
                    {log.responseStatus || "N/A"}
                  </p>
                </div>
                <div className="p-4 space-y-2  rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800">
                  <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 block">{t("details.date")}</Label>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  {t("details.errorMessage")}
                </h4>
                <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900/30">
                  <p className="text-sm text-red-700 dark:text-red-400 font-bold leading-relaxed whitespace-pre-wrap">
                    {log.errorMessage || "Unknown error"}
                  </p>
                </div>
              </div>

              {/* Remote Product ID */}
              {log.remoteProductId && (
                <div className="p-4 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border-2 border-blue-100 dark:border-blue-900/30">
                  <Label className="text-[10px] text-blue-600 uppercase font-black tracking-widest mb-1.5 block">{t("details.remoteProductId")}</Label>
                  <p className="text-xs font-mono font-bold text-blue-800 dark:text-blue-400">{log.remoteProductId}</p>
                </div>
              )}

              {/* Request Payload */}
              <div className="space-y-3 " dir="ltr">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  {t("details.requestPayload")}
                </h4>
                {renderJson(log.requestPayload)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t-2 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 shrink-0">
          <Button onClick={onClose} className="w-full sm:w-auto px-10 rounded-xl font-black uppercase tracking-widest text-xs h-11 border-2">
            {t("actions.close") || "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SyncFailuresPage() {
  const t = useTranslations("syncFailures");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, create: 0, update: 0 });
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [filters, setFilters] = useState({
    storeId: "all",
    action: "all",
    startDate: null,
    endDate: null,
  });
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    log: null,
    isLoading: false,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get("/product-sync-state/logs/statistics");
      setStats({
        total: res.data.total || 0,
        create: res.data.create || 0,
        update: res.data.update || 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLogs = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: perPage,
        search,
        ...filters
      };
      if (params.storeId === "all") delete params.storeId;
      if (params.action === "all") delete params.action;

      const res = await api.get("/product-sync-state/logs/list", { params });
      setPager({
        total_records: res.data.total_records || 0,
        current_page: res.data.current_page || 1,
        per_page: res.data.per_page || 12,
        records: res.data.records || [],
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs(1, pager.per_page);
  }, [search, filters]);

  const handleExport = async () => {
    try {
      const params = { search, ...filters };
      if (params.storeId === "all") delete params.storeId;
      if (params.action === "all") delete params.action;

      const res = await api.get("/product-sync-state/logs/export", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SyncErrorLogs_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error("Failed to export logs");
    }
  };

  const handleViewDetails = async (id) => {
    setDetailsModal({ isOpen: true, log: null, isLoading: true });
    try {
      const res = await api.get(`/product-sync-state/logs/${id}`);
      setDetailsModal({ isOpen: true, log: res.data, isLoading: false });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch log details");
      setDetailsModal({ isOpen: false, log: null, isLoading: false });
    }
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.storeId !== "all" ||
      filters.action !== "all" ||
      Boolean(filters.startDate) ||
      Boolean(filters.endDate)
    );
  }, [filters]);

  const applyFilters = () => fetchLogs(1, pager.per_page);

  const columns = useMemo(() => [
    {
      key: "action",
      header: t("columns.action"),
      cell: (row) => {
        const action = row.action?.toLowerCase();

        const styles = {
          create: "bg-blue-50 text-blue-700 border-blue-100",
          update: "bg-purple-50 text-purple-700 border-purple-100",
          bundle_sync: "bg-orange-50 text-orange-700 border-orange-100",
        };

        const labels = {
          create: t("columns.create"),
          update: t("columns.update"),
          bundle_sync: t("columns.bundle_sync"),
        };

        return (
          <Badge
            variant="outline"
            className={cn(
              "font-black uppercase text-[10px] tracking-widest border-2",
              styles[action] || "bg-gray-50 text-gray-700 border-gray-200"
            )}
          >
            {labels[action] || action}
          </Badge>
        );
      },
    },
    {
      key: "entityType",
      header: t("columns.entityType"),
      cell: (row) => {
        const type = row.entityType;

        const styles = {
          product: "bg-green-50 text-green-700 border-green-100",
          bundle: "bg-orange-50 text-orange-700 border-orange-100",
        };

        const labels = {
          product: t("columns.product"),
          bundle: t("columns.bundle"),
        };

        return (
          <Badge
            variant="outline"
            className={cn(
              "font-bold uppercase text-[10px] tracking-widest border",
              styles[type] || "bg-gray-50 text-gray-700 border-gray-200"
            )}
          >
            {labels[type] || type}
          </Badge>
        );
      },
    },
    {
      key: "store",
      header: t("columns.store"),
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {row.store?.name || "N/A"}
        </span>
      ),
    },
    {
      key: "product",
      header: t("columns.bundle"),
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {row.bundle?.name || "N/A"}
        </span>
      ),
    },
    {
      key: "remoteProductId",
      header: t("columns.remoteProductId"),
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {row.remoteProductId || "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.responseStatus"),
      cell: (row) => (
        <span className={cn(
          "font-black text-xs",
          row.responseStatus >= 200 && row.responseStatus < 300 ? "text-green-600" : "text-red-600"
        )}>
          {row.responseStatus || "ERR"}
        </span>
      ),
    },
    {
      key: "error",
      header: t("columns.error"),
      cell: (row) => (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[300px] font-medium">
          {row.errorMessage}
        </p>
      ),
    },
    {
      key: "date",
      header: t("columns.date"),
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" />
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("columns.actions"),
      className: "w-[100px]",
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            {
              icon: <Eye size={16} />,
              tooltip: t("actions.view"),
              onClick: (r) => handleViewDetails(r.id, false),
              variant: "primary",
              permission: "products.read",
            },
          ]}
        />
      ),
    }
  ], [t]);

  const statsCards = useMemo(() => [
    {
      name: t("stats.total"),
      value: stats.total,
      icon: Activity,
      tone: "primary"
    },
    {
      name: t("stats.create"),
      value: stats.create,
      icon: Plus,
      tone: "warning"
    },
    {
      name: t("stats.update"),
      value: stats.update,
      icon: RefreshCw,
      tone: "info"
    }
  ], [t, stats]);

  return (
    <div className="min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/" },
          { name: t("breadcrumb.stores"), href: "/store-integration" },
          { name: t("breadcrumb.syncFailures") }
        ]}
        statsLoading={statsLoading}
        stats={statsCards}
      />

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: t("toolbar.filter"),
          apply: t("filters.apply"),
          total: t("common.total"),
          limit: t("common.limit"),
          emptyTitle: t("empty.title"),
          emptySubtitle: t("empty.subtitle"),
        }}
        actions={[
          {
            key: "export",
            label: t("filters.export"),
            icon: <FileDown size={14} />,
            color: "primary",
            onClick: handleExport,
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        filters={
          <>
            <StoreFilter
              value={filters.storeId}
              none={false}
              onChange={(v) => setFilters(f => ({ ...f, storeId: v }))}
            />

            <FilterField label={t("filters.action")}>
              <Select
                value={filters.action}
                onValueChange={(v) => setFilters(f => ({ ...f, action: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.action")} />
                </SelectTrigger>
                <SelectContent className="bg-card-select">
                  <SelectItem value="all">{t("filters.allActions")}</SelectItem>
                  <SelectItem value="create">{t("filters.create")}</SelectItem>
                  <SelectItem value="update">{t("filters.update")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.dateRange")}>
              <DateRangePicker
                value={{
                  startDate: filters.startDate,
                  endDate: filters.endDate,
                }}
                onChange={(dates) => setFilters(f => ({ ...f, ...dates }))}
                dataSize="default"
              />
            </FilterField>
          </>
        }
        columns={columns}
        data={pager.records}
        isLoading={loading}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={({ page, per_page }) => fetchLogs(page, per_page)}
      />

      <LogDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ ...detailsModal, isOpen: false })}
        log={detailsModal.log}
        isLoading={detailsModal.isLoading}
      />
    </div>
  );
}
