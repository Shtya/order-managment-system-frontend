"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Calendar,
  Download,
  Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";
import Table, { FilterField } from "@/components/atoms/Table";
import Flatpickr from "react-flatpickr";

export default function CityDeliveriesTab() {
  const t = useTranslations("accounts.cityDeliveries");
  const tCommon = useTranslations("accounts");
  const tOrders = useTranslations("orders");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Default dates: this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date().toISOString().split("T")[0];

  const [filters, setFilters] = useState({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  // Mock data
  const cityData = [
    { id: 1, city: "القاهرة", total: 150, delivered: 135, returns: 15, successRate: 90 },
    { id: 2, city: "الجيزة", total: 120, delivered: 102, returns: 18, successRate: 85 },
    { id: 3, city: "الإسكندرية", total: 95, delivered: 88, returns: 7, successRate: 92 },
    { id: 4, city: "المنصورة", total: 60, delivered: 45, returns: 15, successRate: 75 },
    { id: 5, city: "طنطا", total: 45, delivered: 40, returns: 5, successRate: 88 },
    { id: 6, city: "المنيا", total: 30, delivered: 12, returns: 18, successRate: 40 },
  ];

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
      key: "total",
      header: t("columns.total"),
      cell: (row) => <span className="text-sm font-semibold tabular-nums">{row.total}</span>
    },
    {
      key: "delivered",
      header: t("columns.delivered"),
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold tabular-nums">
          <TrendingUp size={14} />
          {row.delivered}
        </div>
      )
    },
    {
      key: "returns",
      header: t("columns.returns"),
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-red-600 font-bold tabular-nums">
          <TrendingDown size={14} />
          {row.returns}
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
        labels={{
          searchPlaceholder: tOrders("toolbar.searchPlaceholder"),
          apply: tCommon("filters.apply"),
          total: tOrders("pagination.total"),
          limit: tOrders("pagination.limit"),
          emptyTitle: tOrders("empty"),
          emptySubtitle: tOrders("emptySubtitle"),
        }}
        filters={
          <>
            {/* Date Range */}
            <FilterField label={tCommon("filters.dateRange")} icon={Calendar}>
              <Flatpickr
                value={[
                  filters.startDate ? new Date(filters.startDate) : null,
                  filters.endDate ? new Date(filters.endDate) : null,
                ]}
                onChange={([s, e]) => {
                  setFilters((f) => ({
                    ...f,
                    startDate: s ? s.toISOString().split("T")[0] : null,
                    endDate: e ? e.toISOString().split("T")[0] : null,
                  }));
                }}
                options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
                data-size="default"
                className="theme-field"
              />
            </FilterField>
          </>
        }
        actions={[
          {
            key: "export",
            label: tCommon("export"),
            icon: <Download size={14} />,
            color: "blue",
            permission: "orders.read",
          },
        ]}
        columns={columns}
        data={cityData}
        isLoading={loading}
        pagination={{
          total_records: cityData.length,
          current_page: 1,
          per_page: 10,
        }}
      />
    </div>
  );
}
