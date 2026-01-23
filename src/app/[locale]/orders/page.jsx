// app/[locale]/orders/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  MapPin,
  Phone,
  MoreVertical,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";
import Button_ from "@/components/atoms/Button";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import api from "@/utils/api";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";

function normalizeAxiosError(err) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

// ✅ Toolbar Component
function OrdersTableToolbar({
  t,
  searchValue,
  onSearchChange,
  onRefresh,
  onToggleFilters,
  isFiltersOpen,
}) {
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
            "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 px-4 rounded-full",
            isFiltersOpen && "border-primary/50"
          )}
          onClick={onToggleFilters}
        >
          <Filter size={18} />
          {t("toolbar.filter")}
        </Button>

        <Button
          variant="outline"
          className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 px-4 rounded-full"
          onClick={onRefresh}
        >
          <RefreshCw size={18} />
          {t("toolbar.refresh")}
        </Button>
      </div>
    </div>
  );
}

// ✅ Filters Panel Component
function FiltersPanel({ t, value, onChange, onApply }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0, y: -6 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bg-card !p-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label>{t("filters.status")}</Label>
            <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
              <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                <SelectValue placeholder={t("filters.statusPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="bg-card-select">
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="new">{t("statuses.new")}</SelectItem>
                <SelectItem value="under_review">{t("statuses.underReview")}</SelectItem>
                <SelectItem value="preparing">{t("statuses.preparing")}</SelectItem>
                <SelectItem value="ready">{t("statuses.ready")}</SelectItem>
                <SelectItem value="shipped">{t("statuses.shipped")}</SelectItem>
                <SelectItem value="delivered">{t("statuses.delivered")}</SelectItem>
                <SelectItem value="cancelled">{t("statuses.cancelled")}</SelectItem>
                <SelectItem value="returned">{t("statuses.returned")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("filters.paymentStatus")}</Label>
            <Select
              value={value.paymentStatus}
              onValueChange={(v) => onChange({ ...value, paymentStatus: v })}
            >
              <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                <SelectValue placeholder={t("filters.paymentStatusPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="bg-card-select">
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="pending">{t("paymentStatuses.pending")}</SelectItem>
                <SelectItem value="paid">{t("paymentStatuses.paid")}</SelectItem>
                <SelectItem value="partial">{t("paymentStatuses.partial")}</SelectItem>
                <SelectItem value="refunded">{t("paymentStatuses.refunded")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("filters.paymentMethod")}</Label>
            <Select
              value={value.paymentMethod}
              onValueChange={(v) => onChange({ ...value, paymentMethod: v })}
            >
              <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                <SelectValue placeholder={t("filters.paymentMethodPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="bg-card-select">
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="cash">{t("paymentMethods.cash")}</SelectItem>
                <SelectItem value="card">{t("paymentMethods.card")}</SelectItem>
                <SelectItem value="bank_transfer">{t("paymentMethods.bankTransfer")}</SelectItem>
                <SelectItem value="cod">{t("paymentMethods.cod")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("filters.dateRange")}</Label>
            <Flatpickr
              value={[
                value.startDate ? new Date(value.startDate) : null,
                value.endDate ? new Date(value.endDate) : null,
              ]}
              onChange={([start, end]) => {
                onChange({
                  ...value,
                  startDate: start ? start.toISOString().split("T")[0] : null,
                  endDate: end ? end.toISOString().split("T")[0] : null,
                });
              }}
              options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
              className="w-full rounded-full h-[45px] px-4 bg-[#fafafa] dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
              placeholder={t("filters.selectDateRange")}
            />
          </div>

          <div className="flex md:justify-end">
            <Button_
              onClick={onApply}
              size="sm"
              label={t("filters.apply")}
              tone="purple"
              variant="solid"
              icon={<Filter size={18} />}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ✅ Main Orders Page Component
export default function OrdersPage() {
  const t = useTranslations("orders");
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    paymentStatus: "all",
    paymentMethod: "all",
    startDate: null,
    endDate: null,
  });

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    new: 0,
    underReview: 0,
    preparing: 0,
    ready: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  });

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 10,
    records: [],
  });

  const statsCards = useMemo(
    () => [
      {
        title: t("stats.newOrders"),
        value: String(stats.new),
        icon: Package,
        bg: "bg-[#F3F6FF] dark:bg-[#0B1220]",
        iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]",
        iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]",
      },
      {
        title: t("stats.underReview"),
        value: String(stats.underReview),
        icon: Clock,
        bg: "bg-[#FFF9F0] dark:bg-[#1A1208]",
        iconColor: "text-[#F59E0B] dark:text-[#FBBF24]",
        iconBorder: "border-[#F59E0B] dark:border-[#FBBF24]",
      },
      {
        title: t("stats.preparing"),
        value: String(stats.preparing),
        icon: Package,
        bg: "bg-[#F0FDF4] dark:bg-[#0E1A0C]",
        iconColor: "text-[#22C55E] dark:text-[#4ADE80]",
        iconBorder: "border-[#22C55E] dark:border-[#4ADE80]",
      },
      {
        title: t("stats.readyForShipping"),
        value: String(stats.ready),
        icon: CheckCircle,
        bg: "bg-[#F1FAFF] dark:bg-[#0A1820]",
        iconColor: "text-[#38BDF8] dark:text-[#7DD3FC]",
        iconBorder: "border-[#38BDF8] dark:border-[#7DD3FC]",
      },
      {
        title: t("stats.shipped"),
        value: String(stats.shipped),
        icon: TrendingUp,
        bg: "bg-[#F6F0FF] dark:bg-[#140F2D]",
        iconColor: "text-[#8B5CF6] dark:text-[#A78BFA]",
        iconBorder: "border-[#8B5CF6] dark:border-[#A78BFA]",
      },
      {
        title: t("stats.delivered"),
        value: String(stats.delivered),
        icon: CheckCircle,
        bg: "bg-[#F0FDF4] dark:bg-[#0E1A0C]",
        iconColor: "text-[#10B981] dark:text-[#34D399]",
        iconBorder: "border-[#10B981] dark:border-[#34D399]",
      },
      {
        title: t("stats.cancelled"),
        value: String(stats.cancelled),
        icon: XCircle,
        bg: "bg-[#FEF2F2] dark:bg-[#1F0A0A]",
        iconColor: "text-[#EF4444] dark:text-[#F87171]",
        iconBorder: "border-[#EF4444] dark:border-[#F87171]",
      },
      {
        title: t("stats.returned"),
        value: String(stats.returned),
        icon: XCircle,
        bg: "bg-[#FEF2F2] dark:bg-[#1F0A0A]",
        iconColor: "text-[#DC2626] dark:text-[#EF4444]",
        iconBorder: "border-[#DC2626] dark:border-[#EF4444]",
      },
    ],
    [t, stats]
  );

  // ✅ Fetch stats
  const fetchStats = async () => {
    try {
      const res = await api.get("/orders/stats");
      setStats(res.data);
    } catch (error) {
      console.error(error);
      toast.error(t("messages.statsFailed"));
    }
  };

  // ✅ Fetch orders list
  const fetchOrders = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage, search };

      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.paymentStatus && filters.paymentStatus !== "all")
        params.paymentStatus = filters.paymentStatus;
      if (filters.paymentMethod && filters.paymentMethod !== "all")
        params.paymentMethod = filters.paymentMethod;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get("/orders", { params });

      setPager({
        total_records: res.data.total_records || 0,
        current_page: res.data.current_page || 1,
        per_page: res.data.per_page || 10,
        records: res.data.records || [],
      });
    } catch (error) {
      console.error(error);
      toast.error(t("messages.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial load
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchOrders(1, pager.per_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handlePageChange = ({ page, per_page }) => fetchOrders(page, per_page);
  const applyFilters = () => fetchOrders(1, pager.per_page);
  const handleRefresh = () => {
    fetchOrders(pager.current_page, pager.per_page);
    fetchStats();
  };

  // ✅ Status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      new: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
      under_review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
      preparing: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
      ready: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
      shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
      delivered: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
      returned: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
    };
    return styles[status] || styles.new;
  };

  // ✅ Delete order
  const handleDelete = async (id) => {
    if (!confirm(t("messages.confirmDelete"))) return;

    try {
      await api.delete(`/orders/${id}`);
      toast.success(t("messages.deleteSuccess"));
      fetchOrders(pager.current_page, pager.per_page);
      fetchStats();
    } catch (error) {
      toast.error(normalizeAxiosError(error));
    }
  };

  // ✅ Table columns
  const columns = useMemo(() => {
    return [
      {
        key: "orderNumber",
        header: t("table.orderNumber"),
        cell: (row) => (
          <span className="text-primary font-bold font-mono">{row.orderNumber}</span>
        ),
      },
      {
        key: "customerName",
        header: t("table.customerName"),
        cell: (row) => (
          <div className="flex flex-col gap-1">
            <span className="text-gray-700 dark:text-slate-200 font-semibold">
              {row.customerName}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <Phone size={12} />
              {row.phoneNumber}
            </div>
          </div>
        ),
      },
      {
        key: "address",
        header: t("table.address"),
        cell: (row) => (
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">
              {row.city} {row.area ? `- ${row.area}` : ""}
            </span>
          </div>
        ),
      },
      {
        key: "created_at",
        header: t("table.orderDate"),
        cell: (row) => (
          <span className="text-gray-500 dark:text-slate-300">
            {new Date(row.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: "paymentMethod",
        header: t("table.paymentMethod"),
        cell: (row) => (
          <Badge variant="outline">{t(`paymentMethods.${row.paymentMethod}`)}</Badge>
        ),
      },
      {
        key: "finalTotal",
        header: t("table.total"),
        cell: (row) => (
          <span className="text-gray-600 dark:text-slate-200 font-semibold">
            {row.finalTotal} {t("currency")}
          </span>
        ),
      },
      {
        key: "shippingCompany",
        header: t("table.shippingCompany"),
        cell: (row) => (
          <span className="text-gray-500 dark:text-slate-300">
            {row.shippingCompany || "-"}
          </span>
        ),
      },
      {
        key: "status",
        header: t("table.status"),
        cell: (row) => (
          <Badge className={cn("rounded-md", getStatusBadge(row.status))}>
            {t(`statuses.${row.status}`)}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: t("table.actions"),
        className: "w-[80px]",
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-slate-300" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => router.push(`/orders/${row.id}`)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Eye size={16} className="text-blue-600" />
                <span>{t("actions.view")}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push(`/orders/edit/${row.id}`)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Edit size={16} className="text-purple-600" />
                <span>{t("actions.edit")}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => handleDelete(row.id)}
                className="flex items-center gap-2 cursor-pointer text-red-600"
                disabled={!["new", "cancelled"].includes(row.status)}
              >
                <Trash2 size={16} />
                <span>{t("actions.delete")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }, [t, router]);

  return (
    <div className="min-h-screen p-6">
      <div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-gray-400">{t("breadcrumb.home")}</span>
            <ChevronLeft className="text-gray-400" size={18} />
            <span className="text-primary">{t("breadcrumb.orders")}</span>
            <span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
          </div>

          <div className="flex items-center gap-4">
            <Button_
              href="/orders/new"
              size="sm"
              label={t("actions.createOrder")}
              tone="purple"
              variant="solid"
            />
            <Button_ size="sm" label={t("actions.howToUse")} tone="white" variant="solid" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <InfoCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                bg={stat.bg}
                iconColor={stat.iconColor}
                iconBorder={stat.iconBorder}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-sm">
        <OrdersTableToolbar
          t={t}
          searchValue={search}
          onSearchChange={setSearch}
          onRefresh={handleRefresh}
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
            />
          )}
        </AnimatePresence>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={pager.records}
            pagination={{
              total_records: pager.total_records,
              current_page: pager.current_page,
              per_page: pager.per_page,
            }}
            onPageChange={handlePageChange}
            emptyState={t("empty")}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}