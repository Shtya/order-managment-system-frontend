"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Loader2,
  XCircle
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import toast from "react-hot-toast";

export default function CityDeliveriesTab() {
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("accounts");
  const t = useTranslations("accounts.cityDeliveries");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Default dates: this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date();

  const [filters, setFilters] = useState({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const { debouncedValue: debouncedSearch } = useDebounce({
    value: search,
    delay: 300,
  });

  const { handleExport, exportLoading } = useExport();

  const fetchCityReport = async (page = currentPage, per_page = perPage) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: per_page,
        search: debouncedSearch.trim() || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const res = await api.get("/accounting/shipments-city-report", { params });
      setRecords(res.data.records || []);
      setTotalRecords(res.data.total_records || 0);
    } catch (err) {
      console.error("Error fetching city report:", err);
      toast.error(tCommon("manualExpenses.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchCityReport(1, perPage);
  };

  useEffect(() => {
    fetchCityReport();
  }, [debouncedSearch, currentPage, perPage]);

  const onExport = async () => {
    const params = {
      search: search.trim() || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    };

    await handleExport({
      endpoint: "/accounting/shipments-city-report/export",
      params,
      filename: `city_deliveries_report_${Date.now()}.xlsx`,
    });
  };

  const columns = useMemo(() => [
    {
      key: "city",
      header: t("columns.city"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <MapPin size={16} />
          </div>
          <span className="text-sm font-bold">{row.city}</span>
        </div>
      )
    },
    {
      key: "totalShipments",
      header: t("columns.total"),
      cell: (row) => <span className="text-sm font-semibold tabular-nums">{row.totalShipments}</span>
    },
    {
      key: "actualDeliveries",
      header: t("columns.delivered"),
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold tabular-nums">
          <TrendingUp size={14} />
          {row.actualDeliveries}
        </div>
      )
    },
    {
      key: "failedShipments",
      header: t("columns.returns"),
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-red-600 font-bold tabular-nums">
          <XCircle size={14} />
          {row.failedShipments}
        </div>
      )
    },
    {
      key: "successRate",
      header: t("columns.successRate"),
      cell: (row) => {
        const rate = row.successRate;
        let colorClass = "text-emerald-600 bg-emerald-50";
        if (rate < 60) colorClass = "text-red-600 bg-red-50";
        else if (rate < 85) colorClass = "text-orange-600 bg-orange-50";

        return (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 w-16 bg-muted rounded-full overflow-hidden hidden md:block">
              <div
                className={cn("h-full rounded-full transition-all",
                  rate < 60 ? "bg-red-500" : rate < 85 ? "bg-orange-500" : "bg-emerald-500"
                )}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className={cn("px-2.5 py-1 rounded-lg text-xs font-black tabular-nums", colorClass)}>
              {rate}%
            </span>
          </div>
        );
      }
    }
  ], [t]);

  return (
    <div className="space-y-5">
      <Table
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        labels={{
          searchPlaceholder: tCommon("toolbar.searchPlaceholder"),
          apply: tOrders("filters.apply"),
          total: tOrders("pagination.total"),
          limit: tOrders("pagination.limit"),
          emptyTitle: tOrders("empty"),
          emptySubtitle: tOrders("emptySubtitle"),
        }}
        filters={
          <>
            <FilterField label={tCommon("filters.dateRange")}>
              <DateRangePicker
                value={filters}
                onChange={(newDates) => setFilters(f => ({ ...f, ...newDates }))}
              />
            </FilterField>
          </>
        }
        hasActiveFilters={Object.values(filters).some(
          (v) => v && v !== "all" && v !== null,
        )}
        onApplyFilters={applyFilters}
        actions={[
          {
            key: "export",
            label: tCommon("export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            disabled: exportLoading,
            color: "primary",
            onClick: onExport,
            permission: "orders.read",
          },
        ]}
        columns={columns}
        data={records}
        isLoading={loading}
        pagination={{
          total_records: totalRecords,
          current_page: currentPage,
          per_page: perPage,
        }}
        onPageChange={setCurrentPage}
        onLimitChange={setPerPage}
      />
    </div>
  );
}
