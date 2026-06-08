"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  Loader2,
  MapPin,
  Package,
  Truck,
  Eye,
} from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import UserSelect from "@/components/atoms/UserSelect";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { OrderStatus } from "./OrderTab";
import { generateBgColors } from "../page";
import {
  calcShippingDaysElapsed,
  getShippingDaysBadgeStyles,
  getShippingDaysRangeStatus,
} from "@/utils/order-utils";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "@/i18n/navigation";
import ActionButtons from "@/components/atoms/Actions";
const DEFAULT_FILTERS = {
  shippingCompany: "all",
  shipmentStatus: "all",
  shippedStartDate: null,
  shippedEndDate: null,
  employee: "all",
};

function formatShipmentDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ShippedOrders({ statuses = [] }) {
  const ts = useTranslations("orders.shippedOrders");
  const router = useRouter();
  const t = useTranslations("orders");
  const { formatCurrency } = usePlatformSettings();
  const [viewMode, setViewMode] = useState("normal");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [companyStats, setCompanyStats] = useState([]);
  const [unifiedShipmentStatuses, setUnifiedShipmentStatuses] = useState([]);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });

  const searchTimer = useRef(null);

  const statusesMap = useMemo(() => {
    const map = {};
    (statuses || []).forEach((stat) => {
      map[stat.code] = stat;
    });
    return map;
  }, [statuses]);

  const viewModes = useMemo(
    () => [
      { id: "normal", label: ts("views.normal"), icon: Truck },
      { id: "late", label: ts("views.late"), icon: AlertTriangle },
    ],
    [ts],
  );

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get("/shipping/statuses");
        if (!cancelled) setUnifiedShipmentStatuses(r.data?.statuses ?? []);
      } catch {
        if (!cancelled) setUnifiedShipmentStatuses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildStatsParams = useCallback(() => {
    const params = { status: OrderStatus.SHIPPED };
    if (viewMode === "late") {
      params.lateShipping = true;
    }
    return params;
  }, [viewMode]);

  const buildParams = useCallback(
    (page = pager.current_page, per_page = pager.per_page) => {
      const params = {
        page,
        limit: per_page,
        status: OrderStatus.SHIPPED,
      };

      if (debouncedSearch) params.search = debouncedSearch;

      if (filters.shippingCompany && filters.shippingCompany !== "all") {
        params.shippingCompanyId = filters.shippingCompany;
      }

      if (filters.shipmentStatus && filters.shipmentStatus !== "all") {
        params.shipmentStatus = filters.shipmentStatus;
      }

      if (filters.shippedStartDate) params.shippedStartDate = filters.shippedStartDate;
      if (filters.shippedEndDate) params.shippedEndDate = filters.shippedEndDate;

      if (filters.employee && filters.employee !== "all") {
        params.userId = filters.employee;
      }

      if (viewMode === "late") {
        params.lateShipping = true;
      }

      return params;
    },
    [debouncedSearch, filters, pager.current_page, pager.per_page, viewMode],
  );

  const fetchOrders = useCallback(
    async (page = 1, per_page = pager.per_page) => {
      setLoading(true);
      try {
        const params = buildParams(page, per_page);
        const res = await api.get("/orders", { params });
        const data = res.data || {};
        setPager({
          total_records: data.total_records || 0,
          current_page: data.current_page || page,
          per_page: data.per_page || per_page,
          records: Array.isArray(data.records) ? data.records : [],
        });
      } catch (e) {
        console.error(e);
        toast.error(ts("messages.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [buildParams, pager.per_page, ts],
  );

  const fetchCompanyStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/orders/shipped/stats", { params: buildStatsParams() });
      setCompanyStats(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error(ts("messages.statsFailed"));
      setCompanyStats([]);
    } finally {
      setStatsLoading(false);
    }
  }, [buildStatsParams, ts]);

  useEffect(() => {
    fetchOrders(1, pager.per_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, viewMode]);

  useEffect(() => {
    fetchCompanyStats();
  }, [fetchCompanyStats]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setFilters({ ...DEFAULT_FILTERS });
    setSearch("");
    setDebouncedSearch("");
    setPager((p) => ({
      ...p,
      current_page: 1,
      records: [],
    }));
  };

  const applyFilters = () => {
    fetchOrders(1, pager.per_page);
  };

  const handlePageChange = ({ page, per_page }) => {
    fetchOrders(page, per_page);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.shippingCompany && filters.shippingCompany !== "all") ||
      (filters.shipmentStatus && filters.shipmentStatus !== "all") ||
      Boolean(filters.shippedStartDate) ||
      Boolean(filters.shippedEndDate) ||
      (filters.employee && filters.employee !== "all")
    );
  }, [filters]);

  const handleExport = async () => {
    setExportLoading(true);
    const toastId = toast.loading(t("messages.exportStarted"));
    try {
      const params = buildParams();
      delete params.page;
      delete params.limit;

      const response = await api.get("/orders/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `shipped_orders_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("messages.exportSuccess"), { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(ts("messages.exportFailed"), { id: toastId });
    } finally {
      setExportLoading(false);
    }
  };

  const statsCards = useMemo(() => {
    if (!companyStats.length) {
      return [
        {
          id: "total",
          name: t("tabs.shippedOrders"),
          value: `0 ${ts("stats.orders")}`,
          icon: Package,
          color: "var(--primary)",
        },
      ];
    }

    return companyStats.map((item, index) => {
      const palette = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
      const color = palette[index % palette.length];

      return {
        id: item.companyId || `none-${index}`,
        name: item.companyName || ts("stats.noCompany"),
        value: `${item.count} ${ts("stats.orders")}`,
        icon: Truck,
        color,
      };
    });
  }, [companyStats, t, ts]);
  
  const columns = useMemo(
    () => [
      {
        key: "orderNumber",
        header: ts("table.orderNumber"),
        cell: (row) => (
          <span className="text-primary font-bold font-mono">{row.orderNumber}</span>
        ),
      },
      {
        key: "customerName",
        header: ts("table.customerName"),
        cell: (row) => (
          <div className="min-w-[140px]">
            <div className="font-semibold text-sm">{row.customerName}</div>
            <div className="text-xs text-muted-foreground">{row.phoneNumber || "—"}</div>
          </div>
        ),
      },
      {
        key: "city",
        header: ts("table.city"),
        cell: (row) => (
          <div className="flex items-center gap-1 text-sm">
            <MapPin size={12} />
            {row.city}
          </div>
        ),
      },
      {
        key: "address",
        header: t("table.address"),
        cell: (row) => (
          <span title={row.address} className="text-sm text-gray-600 dark:text-slate-300 line-clamp-1 truncate max-w-[120px]">
            {row.address}
          </span>
        ),
      },
      {
        key: "shippingCost",
        header: t("table.finalTotal"),
        cell: (row) => (
          <span className="text-gray-600 dark:text-slate-200">
            {formatCurrency(row.finalTotal)}
          </span>
        ),
      },
      {
        key: "shippingCost",
        header: t("table.shippingCost"),
        cell: (row) => (
          <span className="text-gray-600 dark:text-slate-200">
            {formatCurrency(row.shippingCost)}
          </span>
        ),
      },
      {
        key: "products",
        header: t("table.products"),
        cell: (row) => (
          <div className="text-sm">
            {row.items.map((p, i) => (
              <div key={i} className="flex gap-2">
                <span>{p.variant.product.name}</span> -
                <span>{p.variant.sku}</span> -
                <span> (x{p.quantity})</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        key: "status",
        header: ts("table.status"),
        cell: (row) => {
          const meta = statusesMap[row.status?.code];
          const badgeStyle = meta?.color
            ? {
                className: "rounded-xl border-0",
                style: {
                  backgroundColor: generateBgColors(meta.color).light,
                  color: meta.color,
                },
              }
            : { className: "rounded-xl bg-muted text-muted-foreground" };

          return (
            <Badge className={badgeStyle.className} style={badgeStyle.style}>
              {row.status?.system
                ? t(`statuses.${row.status.code}`)
                : row.status?.name || row.status?.code}
            </Badge>
          );
        },
      },
      {
        key: "shippingDays",
        header: ts("table.shippingDays"),
        cell: (row) => {
          if (!row.shippedAt) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          const cityConfig = row.cityDetails?.tenantConfigs?.[0];
          const days = calcShippingDaysElapsed(row.shippedAt);
          const rangeStatus = getShippingDaysRangeStatus(
            days,
            cityConfig?.minShippingDays,
            cityConfig?.maxShippingDays,
          );
          const { className } = getShippingDaysBadgeStyles(rangeStatus);
          const daysLabel =
            days === 1
              ? t("shippingDays.day", { count: days })
              : t("shippingDays.days", { count: days });

          return (
            <Badge
              className={cn("rounded-lg px-2.5 py-1 font-semibold tabular-nums", className)}
              title={t(`shippingDays.${rangeStatus}`)}
            >
              {daysLabel}
            </Badge>
          );
        },
      },
      {
        key: "trackingNumber",
        header: ts("table.trackingNumber"),
        cell: (row) => {
          const ship = row.shipments?.[0];
          return (
            <span className="font-mono text-sm">{ship?.trackingNumber || row.trackingNumber || "—"}</span>
          );
        },
      },
      {
        key: "shipmentStatus",
        header: ts("table.shipmentStatus"),
        cell: (row) => {
          const ship = row.shipments?.[0];
          const status = ship?.unifiedStatus || ship?.status;
          if (!status) return <span className="text-muted-foreground text-sm">—</span>;

          return (
            <Badge variant="outline">
              {t(`trackingStatus.${status}`) || status}
            </Badge>
          );
        },
      },
      {
        key: "shipmentCreatedAt",
        header: ts("table.shipmentCreatedAt"),
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {formatShipmentDate(row.shipments?.[0]?.created_at || row.shippedAt)}
          </span>
        ),
      },
      {
        key: "shippingCompany",
        header: ts("table.shippingCompany"),
        cell: (row) => (
          <span className="text-sm">{row.shippingCompany?.name || "—"}</span>
        ),
      },
      {
        key: "assignedUser",
        header: t("table.assignedEmployee"),
        cell: (row) => {
          const assignment = row.assignments?.[0];
          const user = assignment?.employee;
          if (!user) return <span className="text-muted-foreground">—</span>;
          const avatarUrl = user.avatarUrl
            ? user.avatarUrl.startsWith("http")
              ? user.avatarUrl
              : `${(BASE_URL || "").replace(/\/+$/, "")}/${(user.avatarUrl || "").replace(/^\/+/, "")}`
            : "";
          return (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-2 min-w-[180px] max-w-[220px]">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={avatarUrl} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {(user.name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-sm">{user.name}</div>
                {user.employeeType && (
                  <div className="text-xs text-muted-foreground">
                    {user.employeeType}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: "actions",
        header: t("table.actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Eye />,
                tooltip: t("actions.view"),
                onClick: (r) => {
                  
                    router.push(`/orders/details/${r.id}`);
                  
                },
                variant: "primary",
                permission: "orders.read",
              }
            ]
            }
          />
        ),
      },
    ],
    [statusesMap, t, ts],
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: ts("breadcrumb") },
        ]}
        statsLoading={statsLoading}
        stats={statsCards.map((stat) => ({
          id: stat.id,
          name: stat.name,
          value: stat.value,
          icon: stat.icon,
          color: stat.color,
        }))}
        items={viewModes}
        active={viewMode}
        setActive={handleViewModeChange}
        itemsCompact={false}
      />

      <Table
        columns={columns}
        data={pager.records}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => fetchOrders(1, pager.per_page)}
        labels={{
          searchPlaceholder: t("search.placeholder"),
          filter: t("actions.filter"),
          apply: ts("filters.apply"),
          total: t("pagination.total"),
          limit: t("pagination.limit"),
          emptyTitle: ts("empty"),
        }}
        actions={[
          {
            key: "export",
            label: t("actions.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            ),
            color: "primary",
            onClick: handleExport,
            disabled: exportLoading,
            permission: "orders.read",
          },
        ]}
        hasActiveFilters={hasActiveFilters || viewMode === "late"}
        onApplyFilters={applyFilters}
        filters={
          <>
            <FilterField >
              <ShippingCompanyFilter
                value={filters.shippingCompany}
                onChange={(v) => setFilters((f) => ({ ...f, shippingCompany: v }))}
              />
            </FilterField>

            {/* <FilterField label={ts("filters.shipmentStatus")}>
              <Select
                value={filters.shipmentStatus}
                onValueChange={(v) => setFilters((f) => ({ ...f, shipmentStatus: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={ts("filters.shipmentStatusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ts("filters.all")}</SelectItem>
                  {(unifiedShipmentStatuses || []).map((code) => (
                    <SelectItem key={code} value={code}>
                      {t(`trackingStatus.${code}`) || code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField> */}

            <FilterField label={ts("filters.shippedDate")}>
              <DateRangePicker
                value={{
                  startDate: filters.shippedStartDate,
                  endDate: filters.shippedEndDate,
                }}
                onChange={(newDates) =>
                  setFilters((prev) => ({
                    ...prev,
                    shippedStartDate: newDates.startDate ?? null,
                    shippedEndDate: newDates.endDate ?? null,
                  }))
                }
                placeholder={ts("filters.shippedDatePlaceholder")}
                dataSize="default"
                maxDate="today"
              />
            </FilterField>

            <FilterField label={ts("filters.employee")}>
              <UserSelect
                value={filters.employee}
                onSelect={(user) =>
                  setFilters((f) => ({
                    ...f,
                    employee: user ? String(user.id) : "all",
                  }))
                }
                placeholder={ts("filters.employeePlaceholder")}
                allowAll
                allLabel={ts("filters.all")}
              />
            </FilterField>
          </>
        }
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
        emptyState={ts("empty")}
      />
    </div>
  );
}
