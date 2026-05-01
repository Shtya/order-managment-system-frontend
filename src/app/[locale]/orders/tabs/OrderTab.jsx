"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {

  Download,
  Eye,

  Trash2,

  MapPin,
  Phone,

  AlertCircle,

  Copy,

  Plus,
  Upload,
  Settings,

  Save,
  Edit2,
  Loader2,

  AlertTriangle,
  Truck,
  Package,
  Info,
  Building2,
  Calendar,
  Clock,
  MessageCircle,
  PhoneCall,
  LucideMessageCircle,
  GitMerge,
  Printer,
  ScanBarcode,
  ScanLine,
  Send,
  ClipboardList,
  Undo2,

} from "lucide-react";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import api, { BASE_URL } from "@/utils/api";
import UserSelect from "@/components/atoms/UserSelect";
import Flatpickr from "react-flatpickr";

import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { generateBgColors, getIconForStatus } from "../page";
import DistributionModal from "../atoms/DistrubtionModal";
import BulkUploadModal from "../atoms/BulkUploadModal";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import SettingsModal from "../atoms/SettingsModal";
import ActionButtons from "@/components/atoms/Actions";
import StoreFilter from "@/components/atoms/StoreFilter";
import ShippingCompanyFilter from "@/components/atoms/ShippingCompanyFilter";
import DateRangePicker from "@/components/atoms/DateRangePicker";

//order status flow
// New => Confirmed => Distrebuted (Assed to shipment company) =>  Printed (Waybills printed) =>  preparing (scanign its items for preparation)
// =>  Ready (completly scaned) => packed (scaned again for outgoing and packed) => shipped (The relaetd manifast printed and order not gived to Delivary boy) => 
// Delivered or failed deliver (for faield can be reassign to shipping compnay (Distrebuted) )

// ✅ Order Status Constants (Mirroring your Enum)
//
export const OrderStatus = {
  NEW: "new",
  UNDER_REVIEW: "under_review",
  // ✅ حالات مرحلة التأكيد الجديدة
  CONFIRMED: "confirmed", // مؤكد
  DISTRIBUTED: "distributed",
  POSTPONED: "postponed", // مؤجل

  NO_ANSWER: "no_answer", // لا يوجد رد
  WRONG_NUMBER: "wrong_number", // الرقم غلط
  OUT_OF_DELIVERY_AREA: "out_of_area", // خارج نطاق التوصيل
  DUPLICATE: "duplicate", // طلب مكرر

  PREPARING: "preparing",
  PRINTED: "printed",
  READY: "ready",
  PACKED: "packed",
  REJECTED: "rejected",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  FAILED_DELIVERY: "failed_delivery",
  CANCELLED: "cancelled",
  RETURN_PREPARING: "return_preparing",
  RETURNED: "returned",
};




// Main Orders Page Component
export default function OrdersTab({
  stats, fetchStats, statsLoading,
  readOnlyStatus = false, restrictedStatuses = [],
  showTopActions = true, showBulkUpload = true, showCustom = true,
  label = "" }) {
  const t = useTranslations("orders");
  const { formatCurrency } = usePlatformSettings();

  const restrictedSet = useMemo(() => {
    return new Set(restrictedStatuses || []);
  }, [restrictedStatuses]);
  const filteredStats = useMemo(() => {
    if (!stats) return [];

    return stats.filter((s) => {
      const isRestricted = restrictedSet.has(s.code);
      const isSystem = s.system === false;

      return isRestricted || (showCustom && isSystem);
    });
  }, [stats, restrictedSet, showCustom]);

  const router = useRouter();
  const [retrySettingsOpen, setRetrySettingsOpen] = useState(false);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStatus, setDeletingStatus] = useState(null);

  const [deleteOrderModalOpen, setDeleteOrderModalOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(null);

  const [trackShipmentModalOpen, setTrackShipmentModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);



  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    paymentStatus: "all",
    employee: "all",
    startDate: null,
    endDate: null,
    // product: "all",
    // area: "all",
    store: "all",
    shippingCompany: "all",
  });

  const [loading, setLoading] = useState(false);

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const searchTimer = useRef(null);
  useEffect(() => {
    fetchOrders();
  }, []);

  // ── Debounce search ──
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Fetch on search / filter change ──
  useEffect(() => {
    handlePageChange(1, pager.per_page);
  }, [debouncedSearch]);

  const buildParams = (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    const params = {
      page,
      limit: per_page,
    };

    if (search) params.search = search;
    if (filters.status === "all" || !filters.status) {
      if (restrictedStatuses?.length) {
        params.status = restrictedStatuses.join(",");
      }
    } else {
      params.status = filters.status;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "all")
      params.paymentStatus = filters.paymentStatus;
    // if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.shippingCompany && filters.shippingCompany !== "all")
      params.shippingCompanyId = filters.shippingCompany;
    if (filters.store && filters.store !== "all")
      params.storeId = filters.store;
    if (filters.employee && filters.employee !== "all")
      params.userId = filters.employee;

    return params;
  };

  const fetchOrders = async (
    page = pager.current_page,
    per_page = pager.per_page,
  ) => {
    try {
      setOrdersLoading(true);
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
      console.error("Error fetching orders", e);
      toast.error(t("messages.errorFetchingOrders"));
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleDeleteStatus = (status) => {
    setDeletingStatus(status);
    setDeleteModalOpen(true);
  };

  const handleEditStatus = (status) => {
    setEditingStatus(status);
    setStatusFormOpen(true);
  };

  const handleAddStatus = () => {
    setEditingStatus(null);
    setStatusFormOpen(true);
  };

  const statsCards = useMemo(() => {
    const final = readOnlyStatus ? filteredStats : stats;
    if (!final.length) return [];
    
    return final
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((stat) => {
        const Icon = getIconForStatus(stat.code);
        const bgColors = generateBgColors(stat.color);

        return {
          id: stat.id,
          title: stat.system ? t(`statuses.${stat.code}`) : stat.name,
          value: String(stat.count || 0),
          icon: Icon,
          bg: `bg-[${bgColors.light}] dark:bg-[${bgColors.dark}]`,
          bgInlineLight: bgColors.light,
          bgInlineDark: bgColors.dark,
          iconColor: `text-[${stat.color}]`,
          iconColorInline: stat.color,
          iconBorder: `border-[${stat.color}]`,
          iconBorderInline: stat.color,
          code: stat.code,
          system: stat.system,
          sortOrder: stat.sortOrder,
          fullData: stat,
        };
      });
  }, [stats, readOnlyStatus, filteredStats]);

  // Create statusesMap for filters and dropdowns
  const statusesMap = useMemo(() => {
    const map = {};
    stats.forEach((stat) => {
      map[stat.code] = {
        id: stat.id,
        name: stat.name,
        color: stat.color,
        system: stat.system,
        count: stat.count,
      };
    });
    return map;
  }, [stats]);

  const handlePageChange = ({ page, per_page }) => {
    fetchOrders(page, per_page);
  };

  const applyFilters = () => {
    toast.success(t("messages.filtersApplied"));
    fetchOrders(1, pager.per_page);
  };
  const [exportLoading, setExportLoading] = useState();

  const handleExport = async () => {
    let toastId;
    try {
      setExportLoading(true);
      toastId = toast.loading(t("messages.exportStarted"));

      // Build export params (same as list but without pagination)
      const params = {};
      if (search) params.search = search;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.paymentStatus && filters.paymentStatus !== "all")
        params.paymentStatus = filters.paymentStatus;
      // if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.shippingCompany && filters.shippingCompany !== "all")
        params.shippingCompanyId = filters.shippingCompany;
      if (filters.store && filters.store !== "all")
        params.storeId = filters.store;
      if (filters.employee && filters.employee !== "all")
        params.userId = filters.employee;

      const response = await api.get("/orders/export", {
        params,
        responseType: "blob", // Important for file download
      });

      // Parse filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `orders_export_${Date.now()}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Create download link
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

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(t("messages.exportSuccess"), {
        id: toastId,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.dismiss();
      toast.error(error.response?.data?.message || t("messages.exportFailed"), {
        id: toastId,
      });
    } finally {
      setExportLoading(false);
    }
  };

  const [updatingStatuses, setUpdatingStatuses] = useState([]);

  const setUpdating = (id, v) => {
    setUpdatingStatuses((prev) => {
      if (v) return Array.from(new Set(prev.concat(id)));
      return prev.filter((x) => x !== id);
    });
  };

  const getStatusBadge = (statusCode) => {
    const status = statusesMap[statusCode];
    if (!status) {
      return "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
    }

    // Generate badge colors from status color
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
        : null;
    };

    const rgb = hexToRgb(status.color);
    return {
      style: rgb
        ? {
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
          color: status.color,
        }
        : {},
      className: "rounded-xl",
    };
  };

  const columns = useMemo(() => {
    return [
      {
        key: "customerName",
        header: t("table.customerName"),
        cell: (row) => (
          <span className="text-gray-700 dark:text-slate-200 font-semibold">
            {row.customerName}
          </span>
        ),
      },
      {
        key: "orderNumber",
        header: t("table.orderNumber"),
        cell: (row) => (
          <span className="text-primary font-bold font-mono">
            {row.orderNumber}
          </span>
        ),
      },
      {
        key: "city",
        header: t("table.city"),
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
        key: "phoneNumber",
        header: t("table.phoneNumber"),
        cell: (row) => {
          const rawNumber = String(row.phoneNumber || "").trim();
          const cleanNumber = rawNumber.replace(/\D/g, "");

          return (
            <div className="flex items-center justify-between gap-3 text-sm group">

              {/* Phone */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1 transition-opacity duration-200">
                  <a
                    href={`tel:${cleanNumber}`}
                    className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-full transition-all"
                    title={t("common.call")}
                  >
                    <PhoneCall size={15} />
                  </a>

                  <a
                    href={`https://wa.me/${cleanNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-green-100 text-green-600 rounded-full transition-all"
                    title="Whatsapp"
                  >
                    <LucideMessageCircle size={15} />
                  </a>
                </div>
                <span className="truncate">{rawNumber}</span>
              </div>

            </div>
          );
        },
      },

      readOnlyStatus ? {
        key: "status",
        header: t("table.status"),
        cell: (row) => (
          <Badge className={cn("rounded-xl", getStatusBadge(row.status))}>
            {row.status.system
              ? t(`statuses.${row.status.code}`)
              : row.status.name || row.status.code}
          </Badge>
        ),
      } :
        {
          key: "confirmStatus",
          header: t("table.status"),
          cell: (row) => {
            const currentCode = row.status?.code;
            const currentStatusId = row.status?.id;

            return (
              <div className="flex items-center gap-2">
                <Select
                  defaultValue={String(currentStatusId)}
                  onValueChange={async (val) => {
                    const statusId = val;
                    if (!statusId || statusId === currentStatusId) return;

                    const toastId = toast.loading(t("messages.statusUpdating"));
                    try {
                      setUpdating(row.id, true);
                      await api.patch(`/orders/${row.id}/status`, { statusId });
                      toast.success(t("messages.statusUpdated"), { id: toastId });
                      await fetchOrders(pager.current_page, pager.per_page);
                      await fetchStats();
                    } catch (err) {
                      console.error(err);
                      toast.error(
                        err.response?.data?.message ||
                        t("messages.errorUpdatingStatus"),
                        { id: toastId }
                      );
                    } finally {
                      setUpdating(row.id, false);
                    }
                  }}
                  disabled={
                    updatingStatuses.includes(row.id) ||
                    currentCode === OrderStatus.DELIVERED
                  }
                >
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {(filteredStats || []).map((s) => {
                      const isSame = s.code === currentCode;

                      return (
                        <SelectItem
                          key={s.id}
                          value={String(s.id)}
                        // disabled={isSame} // 🔥 main logic
                        >
                          {s.system ? t(`statuses.${s.code}`) : s.name || s.code}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          },
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
        key: "paymentMethod",
        header: t("table.paymentMethod"),
        cell: (row) => (
          <Badge variant="outline">
            {t(`paymentMethods.${row.paymentMethod}`)}
          </Badge>
        ),
      },
      {
        key: "paymentStatus",
        header: t("table.paymentStatus"),
        cell: (row) => (
          <Badge variant="outline">
            {t(`paymentStatuses.${row.paymentStatus}`)}
          </Badge>
        ),
      },

      {
        key: "shippingCompany",
        header: t("table.shippingCompany"),
        cell: (row) => (
          <span className="text-sm">{row.shippingCompany?.name || "-"}</span>
        ),
      },
      {
        key: "deposit",
        header: t("table.deposit"),
        cell: (row) => (
          <span className="text-sm">
            {formatCurrency(row.deposit)}
          </span>
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
        key: "updated_at",
        header: t("table.lastUpdate"),
        cell: (row) => (
          <span className="text-xs text-gray-500">
            {new Date(row.updated_at).toLocaleDateString("en-US")}
          </span>
        ),
      },
      {
        key: "created_at",
        header: t("table.createdat"),
        cell: (row) => (
          <span className="text-xs text-gray-500">
            {new Date(row.created_at).toLocaleDateString("en-US")}
          </span>
        ),
      },
      {
        key: "actions",
        header: t("table.actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              // --- WAREHOUSE ACTIONS ---
              {
                icon: <GitMerge size={18} />,
                tooltip: t("actions.distribute"),
                onClick: () => router.push(`/warehouse?tab=distribution&subtab=unassigned`),
                variant: "primary",
                permission: "orders.update",
                hidden: row?.status?.code !== OrderStatus.CONFIRMED,
              },
              {
                icon: <Printer size={18} />,
                tooltip: t("actions.print"),
                onClick: () => router.push(`/warehouse?tab=print`),
                variant: "primary",
                permission: "orders.update",
                hidden: row?.status?.code !== OrderStatus.DISTRIBUTED,
              },
              {
                icon: <ScanBarcode size={18} />,
                tooltip: t("actions.startPreparing"),
                onClick: (r) => router.push(`/warehouse?tab=preparation&subtab=scanning&order=${r.id}`),
                variant: "primary",
                permission: "orders.update",
                hidden: row?.status?.code !== OrderStatus.PRINTED,
              },
              {
                icon: <ScanLine size={18} />,
                tooltip: t("actions.continuePreparing"),
                onClick: (r) => router.push(`/warehouse?tab=preparation&subtab=scanning&order=${r.id}`),
                variant: "primary",
                permission: "orders.update",
                hidden: row?.status?.code !== OrderStatus.PREPARING,
              },
              {
                icon: <Send size={18} />,
                tooltip: t("actions.scanOutgoing"),
                onClick: (r) => router.push(`/warehouse?tab=outgoing&subtab=scan&order=${r.orderNumber}`),
                variant: "primary",
                permission: "orders.update",
                hidden: row?.status?.code !== OrderStatus.READY,
              },
              {
                icon: <ClipboardList size={18} />,
                tooltip: t("actions.createManifest"),
                onClick: () => router.push(`/warehouse?tab=outgoing&subtab=scan&manifest=open`),
                variant: "primary",
                permission: "orders.update",
                hidden: row?.status?.code !== OrderStatus.PACKED,
              },
              {
                icon: <Undo2 size={18} />,
                tooltip: t("actions.createReturnManifest"),
                onClick: () => router.push(`/warehouse?tab=returns&subtab=scan&manifest=open`),
                variant: "primary",
                permission: "orders.update",
                hidden: row?.status?.code !== OrderStatus.RETURN_PREPARING,
              },
              {
                icon: <Truck />,
                tooltip: t("actions.trackShipment"), // "تتبع الشحنة"
                onClick: (r) => {
                  setTrackingOrder(r);
                  setTrackShipmentModalOpen(true);
                },
                variant: "primary",
                permission: "orders.read",
                disabled: !row.trackingNumber,
                hidden: row?.status?.code !== OrderStatus.SHIPPED && row?.status?.code !== OrderStatus.DELIVERED,
              },
              // -----------------------------
              {
                icon: <Eye />,
                tooltip: t("actions.view"),
                onClick: (r) => router.push(`/orders/details/${r.id}`),
                variant: "primary",
                permission: "orders.read",
              },
              {
                icon: <Copy />,
                tooltip: t("actions.duplicate"),
                onClick: (r) => router.push(`/orders/new?from=${r.id}`),
                variant: "primary",
                permission: "orders.create",
              },
              {
                icon: <Edit2 />,
                tooltip: t("actions.edit"),
                onClick: (r) => router.push(`/orders/edit/${r.id}`),
                variant: "primary",
                permission: "orders.update",
              },

              {
                icon: <Trash2 />,
                tooltip: t("actions.delete"),
                onClick: (r) => {
                  setDeletingOrder(r);
                  setDeleteOrderModalOpen(true);
                },
                variant: "red",
                permission: "orders.delete",
                hidden: readOnlyStatus
              },
            ]}
          />
        ),
      },
    ];
  }, [t, router, filteredStats, formatCurrency, readOnlyStatus]);

  return (
    <div className=" ">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: label ? label : t("tabs.orders") },
        ]}
        buttons={
          showTopActions ? <>
            <Button_
              href="/orders/new"
              size="sm"
              label={t("actions.createOrder")}
              variant="solid"
              icon={<Plus size={18} />}
              permission="orders.create"
            />
            <Button_
              size="sm"
              label={t("actions.settings")}
              variant="outline"
              onClick={() => setRetrySettingsOpen(true)}
              icon={<Settings size={18} />}
              permission="order.updateSettings"
            />
          </> : null
        }
        statsLoading={statsLoading}
        statsCount={12}
        stats={[
          ...statsCards.map((stat) => ({
            id: stat.id,
            name: stat.title,
            value: stat.value,
            icon: stat.icon,
            color: stat.iconColorInline,
            sortOrder: stat.sortOrder,
            editable: !stat.system,
            onEdit: () => handleEditStatus(stat.fullData),
            onDelete: () => handleDeleteStatus(stat),
          })),
          ...(!readOnlyStatus ? [{
            id: "add",
            name: t("actions.addStatus"),
            icon: Plus,
            color: "#94a3b8",
            isAddCard: true,
            onClick: handleAddStatus,
            sortOrder: 9999,
          }] : []),
        ]}
      />

      <Table
        // ── Search (always visible) ───────────────────────────────────────────
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
          emptyTitle: t("empty"),
          emptySubtitle: t("emptySubtitle"),
          preview: t("image.preview"),
        }}
        actions={[
          {
            key: "export",
            label: t("toolbar.export"),
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
          ...(showBulkUpload
            ? [{
              key: "bulk",
              label: t("toolbar.bulkUpload"),
              icon: <Upload size={14} />,
              color: "primary",
              onClick: () => setBulkUploadOpen(true),
              permission: "orders.create",
            }]
            : []),
        ]}
        hasActiveFilters={Object.values(filters).some(
          (v) => v && v !== "all" && v !== null,
        )}
        onApplyFilters={applyFilters}
        filters={
          <>
            {/* Status */}
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm  focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all">
                  <SelectValue placeholder={t("filters.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  {Array.isArray(filteredStats) &&
                    filteredStats.map((s) => (
                      <SelectItem
                        key={s.code || s.id}
                        value={s.code || String(s.id)}
                      >
                        {s.system ? t(`statuses.${s.code}`) : s.name || s.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* Payment status */}
            <FilterField label={t("filters.paymentStatus")}>
              <Select
                value={filters.paymentStatus}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, paymentStatus: v }))
                }
              >
                <SelectTrigger
                  className="h-10 rounded-xl border-border bg-background text-sm
            focus:border-[var(--primary)] dark:focus:border-[#5b4bff] transition-all"
                >
                  <SelectValue
                    placeholder={t("filters.paymentStatusPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="pending">
                    {t("paymentStatuses.pending")}
                  </SelectItem>
                  <SelectItem value="paid">
                    {t("paymentStatuses.paid")}
                  </SelectItem>
                  <SelectItem value="partial">
                    {t("paymentStatuses.partial")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label={t("filters.employee")}>
              <UserSelect
                value={filters.employee}
                onSelect={(user) =>
                  setFilters((f) => ({
                    ...f,
                    employee: user ? String(user.id) : "all",
                  }))
                }
                placeholder={t("filters.employeePlaceholder")}
                allowAll
                allLabel={t("filters.all")}
                className="h-10 rounded-xl border-border bg-background"
                contentClassName="bg-card-select"
              />
            </FilterField>

            {/* Date range */}
            <FilterField label={t("filters.date")}>
              <DateRangePicker
                value={{
                  startDate: filters.startDate,
                  endDate: filters.endDate,
                }}
                onChange={(newDates) =>
                  setFilters((prev) => ({
                    ...prev,
                    ...newDates,
                  }))
                }
                placeholder={t("filters.datePlaceholder")}
                dataSize="default"
                maxDate="today"
              />
            </FilterField>

            <StoreFilter
              value={filters.store}
              onChange={(v) => setFilters((f) => ({ ...f, store: v }))}
            />

            <ShippingCompanyFilter
              value={filters.shippingCompany}
              onChange={(v) =>
                setFilters((f) => ({ ...f, shippingCompany: v }))
              }
            />
          </>
        }
        // ── Table ─────────────────────────────────────────────────────────────
        columns={columns}
        data={pager.records}
        isLoading={ordersLoading || loading}
        // ── Pagination ────────────────────────────────────────────────────────
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={handlePageChange}
      />

      <DistributionModal
        isOpen={distributionOpen}
        onClose={() => setDistributionOpen(false)}
        statuses={stats}
        onSuccess={() => {
          fetchOrders(1, pager.per_page);
          fetchStats();
        }}
      />

      <SettingsModal
        isOpen={retrySettingsOpen}
        statuses={stats}
        onClose={() => setRetrySettingsOpen(false)}
      />

      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={() => {
          fetchOrders(1, pager.per_page);
          fetchStats();
        }}
      />

      <StatusFormModal
        isOpen={statusFormOpen}
        onClose={() => {
          setStatusFormOpen(false);
          setEditingStatus(null);
        }}
        status={editingStatus}
        onSuccess={fetchStats}
      />

      <DeleteStatusModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingStatus(null);
        }}
        status={deletingStatus}
        onSuccess={fetchStats}
      />

      <TrackShipmentModal
        isOpen={trackShipmentModalOpen}
        onClose={() => {
          setTrackShipmentModalOpen(false);
          setTrackingOrder(null);
        }}
        order={trackingOrder}
      />

      <DeleteOrderModal
        isOpen={deleteOrderModalOpen}
        onClose={() => {
          setDeleteOrderModalOpen(false);
          setDeletingOrder(null);
        }}
        order={deletingOrder}
        onSuccess={() => {
          fetchOrders(pager.current_page, pager.per_page);
          fetchStats();
        }}
      />
    </div>
  );
}

function isValidHex(color) {
  return /^#([0-9A-F]{6})$/i.test(color);
}

const ColorPicker = ({ value, onChange, disabled }) => {
  const t = useTranslations("orders");
  const [showPicker, setShowPicker] = useState(false);
  const wrapperRef = useRef(null);

  // Local state for input typing
  const [inputValue, setInputValue] = useState(value);

  // Sync when parent value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (isValidHex(inputValue)) {
        onChange(inputValue.toUpperCase());
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(handler);
  }, [inputValue]);

  const presetColors = [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#03A9F4",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
    "#795548",
    "#9E9E9E",
    "#607D8B",
    "#000000",
  ];

  // ✅ Outside click detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex gap-2">
        {/* Color Preview Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setShowPicker(!showPicker)}
          className="w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-slate-600"
          style={{ backgroundColor: value }}
        />

        {/* Manual HEX Input */}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled}
          placeholder="#000000"
          className="flex-1 h-12 font-mono rounded-xl"
          maxLength={7}
        />
      </div>

      {showPicker && !disabled && (
        <div className="absolute z-50 mt-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 space-y-4">
          {/* Native Color Picker (Any Hex) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("customColor")}
            </label>
            <input
              type="color"
              value={value}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              className="w-full h-10 cursor-pointer"
            />
          </div>

          {/* Preset Colors */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("presetColors")}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange(color)}
                  className={[
                    "w-8 h-8 rounded-xl border-2 transition-all",
                    value === color
                      ? "border-black dark:border-white scale-110"
                      : "border-gray-300 dark:border-slate-600 hover:scale-110",
                  ].join(" ")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function StatusFormModal({ isOpen, onClose, status, onSuccess }) {
  const t = useTranslations("orders");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#2196F3",
    sortOrder: 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name || "",
        description: status.description || "",
        color: status.color || "#2196F3",
        sortOrder: status.sortOrder || status.sortorder || 0,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#2196F3",
        sortOrder: 0,
      });
    }
    setErrors({});
  }, [status, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("validation.statusNameRequired");
    } else if (formData.name.length > 50) {
      newErrors.name = t("validation.statusNameMaxLength");
    }

    if (!/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = t("validation.invalidColorCode");
    }

    if (formData.sortOrder < 0) {
      newErrors.sortOrder = t("validation.sortOrderMin");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      if (status) {
        // Update existing status
        await api.patch(`/orders/statuses/${status.id}`, formData);
        toast.success(t("messages.statusUpdated"));
      } else {
        // Create new status
        await api.post("/orders/statuses", formData);
        toast.success(t("messages.statusCreated"));
      }

      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error saving status:", error);
      toast.error(
        error.response?.data?.message || t("messages.errorSavingStatus"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {status ? t("statusForm.editTitle") : t("statusForm.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("statusForm.name")} *
            </Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("statusForm.namePlaceholder")}
              className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
              maxLength={50}
            />
            {errors.name && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("statusForm.description")}
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t("statusForm.descriptionPlaceholder")}
              className="rounded-xl bg-[#fafafa] dark:bg-slate-800/50 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("statusForm.color")} *
            </Label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color: color })}
            />
            {errors.color && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.color}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("statusForm.sortOrder")}
            </Label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sortOrder: parseInt(e.target.value) || 0,
                })
              }
              className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
              min={0}
            />
            {errors.sortOrder && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.sortOrder}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t("statusForm.sortOrderHelp")}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-[45px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("statusForm.saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {status ? t("statusForm.update") : t("statusForm.create")}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-[45px] px-8"
            >
              {t("statusForm.cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteStatusModal({ isOpen, onClose, status, onSuccess }) {
  const t = useTranslations("orders");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");

    // Validate confirmation text
    if (confirmText.trim().toLowerCase() !== status?.title.toLowerCase()) {
      setError(t("deleteStatus.errorMismatch"));
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/orders/statuses/${status.id}`);
      toast.success(t("messages.statusDeleted"));
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error deleting status:", error);
      toast.error(
        error.response?.data?.message || t("messages.errorDeletingStatus"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError("");
    onClose();
  };

  if (!status) return null;
  const isConfirmValid =
    confirmText.trim().toLowerCase() === status?.title.toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t("deleteStatus.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("deleteStatus.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4 pt-4">
          {/* Warning message */}
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              {t("deleteStatus.warning")}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">
              {t("deleteStatus.statusName")}:{" "}
              <span className="font-bold">{status?.title}</span>
            </p>
          </div>

          {/* Status details */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: status?.iconBorderInline }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: status?.bgInlineLight }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {status?.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {status?.count} {t("deleteStatus.ordersWithStatus")}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("deleteStatus.confirmLabel")}
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t("deleteStatus.confirmHint")}{" "}
              <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {status?.name}
              </span>
            </p>
            <Input
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              placeholder={status?.name}
              className="rounded-xl h-[45px] bg-white dark:bg-slate-800 border-2"
              autoComplete="off"
            />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                {error}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-[45px]"
            >
              {t("deleteStatus.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !isConfirmValid}
              className="flex-1 h-[45px] bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleteStatus.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteStatus.confirm")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteOrderModal({ isOpen, onClose, order, onSuccess }) {
  const t = useTranslations("orders");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");

    // Validate confirmation text
    if (
      confirmText.trim().toLowerCase() !== order?.orderNumber?.toLowerCase()
    ) {
      setError(t("deleteOrder.errorMismatch"));
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/orders/${order.id}`);
      toast.success(t("messages.orderDeleted"));
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(
        error.response?.data?.message || t("messages.errorDeletingOrder"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError("");
    onClose();
  };

  if (!order) return null;
  const isConfirmValid =
    confirmText.trim().toLowerCase() === order?.orderNumber?.toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t("deleteOrder.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("deleteOrder.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4 pt-4">
          {/* Warning message */}
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              {t("deleteOrder.warning")}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">
              {t("deleteOrder.orderNumber")}:{" "}
              <span className="font-bold">{order?.orderNumber}</span>
            </p>
          </div>

          {/* Order details */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("table.orderNumber")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {order?.orderNumber}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("table.customerName")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {order?.customerName}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("table.phoneNumber")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {order?.phoneNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600 dark:text-slate-300">
              {t("deleteOrder.confirmLabel")}
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t("deleteOrder.confirmHint")}{" "}
              <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {order?.orderNumber}
              </span>
            </p>
            <Input
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              placeholder={order?.orderNumber}
              className="rounded-xl h-[45px] bg-white dark:bg-slate-800 border-2"
              autoComplete="off"
            />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                {error}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-[45px]"
            >
              {t("deleteOrder.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !isConfirmValid}
              className="flex-1 h-[45px] bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleteOrder.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteOrder.confirm")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



function TrackShipmentModal({ isOpen, onClose, order }) {
  const t = useTranslations("orders");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingData, setTrackingData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTracking = async () => {
      if (!isOpen || !order?.trackingNumber) return;

      setLoading(true);
      setError("");
      setTrackingData(null);

      try {
        const response = await api.get(
          `/shipping/shipments/${order.trackingNumber}/track`
        );

        if (isMounted && response.data?.ok) {
          setTrackingData(response.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching tracking:", err);
          setError(
            err.response?.data?.message || t("messages.errorFetchingTracking")
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTracking();

    return () => {
      isMounted = false;
    };
  }, [isOpen, order]);

  const handleClose = () => {
    setTrackingData(null);
    setError("");
    onClose();
  };

  // دالة مساعدة لتنسيق التواريخ بشكل مقروء
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }); // يمكنك تغيير 'en-US' إلى 'ar-EG' إذا كنت تفضل عرض التاريخ بالعربية دائماً
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t("trackShipment.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("trackShipment.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* تفاصيل الطلب الأساسية */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("table.orderNumber")}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {order.orderNumber}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("table.customerName")}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {order.customerName}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("trackShipment.trackingNumber")}
              </p>
              <p className="text-sm font-mono font-semibold text-[var(--primary)]">
                {order.trackingNumber}
              </p>
            </div>
          </div>

          {/* حالة التحميل */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
              <p className="text-sm text-gray-500">{t("trackShipment.loading")}</p>
            </div>
          )}

          {/* حالة الخطأ */}
          {!loading && error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* بيانات التتبع من الـ API الجديد */}
          {!loading && !error && trackingData && (
            <div className="p-4 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15 space-y-4">

              {/* الحالة الموحدة */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--primary)]/10">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-[var(--primary)]" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("trackShipment.currentStatus")}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                  {trackingData.status ? t(`trackingStatus.${trackingData.status}`) : trackingData.status || "N/A"}
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {/* شركة الشحن */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("trackShipment.company")}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {trackingData.company || "—"}
                  </p>
                </div>

                {/* معرف شحنة المزود */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("trackShipment.providerShipmentId")}
                    </p>
                  </div>
                  <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {trackingData.providerShipmentId || "—"}
                  </p>
                </div>

                {/* تاريخ الإنشاء */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("trackShipment.createdAt")}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(trackingData.created_at)}
                  </p>
                </div>

                {/* تاريخ التحديث */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("trackShipment.updatedAt")}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(trackingData.updated_at)}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto h-[45px] px-8"
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}