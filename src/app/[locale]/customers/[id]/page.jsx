

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Edit,
  Home,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Star,
  Tag,
  Trash2,
  User,
  UserRound,
  Truck,
  RotateCcw,
  Ban,
} from "lucide-react";

import ActionButtons from "@/components/atoms/Actions";
import Button_ from "@/components/atoms/Button";
import PageHeader, { StatsGrid } from "@/components/atoms/Pageheader";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { cn } from "@/utils/cn";
import OrderTab from "../../orders/tabs/OrderTab";
import ClientModal from "../atoms/ClientModal";
import { Card } from "../../reports/order-analysis/page";
import { Checkbox } from "@/components/ui/checkbox";

const NONE_VALUE = "__none";

const createAddressSchema = (t) =>
  yup.object({
    label: yup.string().nullable().optional(),
    address: yup.string().required(t("addresses.validation.addressRequired")),
    cityId: yup.string().nullable().optional(),
    areaId: yup.string().nullable().optional(),
    landmark: yup.string().nullable().optional(),
    isDefault: yup.boolean().optional(),
  });

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function getContacts(client) {
  return Array.isArray(client?.contacts) ? client.contacts : [];
}

function getPrimaryContact(client) {
  return client?.primaryContact || getContacts(client)[0] || null;
}

function getLocalizedName(item, locale) {
  if (!item) return "";
  return locale === "ar"
    ? item.nameAr || item.name || item.nameEn || ""
    : item.nameEn || item.name || item.nameAr || "";
}

function getAddressCity(address, locale) {
  return (
    getLocalizedName(address?.cityDetails, locale) ||
    address?.city ||
    address?.cityName ||
    ""
  );
}

function getAddressArea(address, locale) {
  return (
    getLocalizedName(address?.areaDetails, locale) ||
    address?.area ||
    address?.areaName ||
    ""
  );
}

function normalizeRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function AddressDialog({
  open,
  onOpenChange,
  address,
  customerId,
  onSaved,
}) {
  const t = useTranslations("customers.details");
  const locale = useLocale();
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [areasLoading, setAreasLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const schema = useMemo(() => createAddressSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      label: "",
      address: "",
      cityId: NONE_VALUE,
      areaId: NONE_VALUE,
      landmark: "",
      isDefault: false,
    },
  });

  const selectedCityId = watch("cityId");

  useEffect(() => {
    if (!open) return;

    reset({
      label: address?.label || "",
      address: address?.address || "",
      cityId: address?.cityId || address?.cityDetails?.id || NONE_VALUE,
      areaId: address?.areaId || address?.areaDetails?.id || NONE_VALUE,
      landmark: address?.landmark || "",
      isDefault: Boolean(address?.isDefault),
    });
  }, [address, open, reset]);

  useEffect(() => {
    if (!open) return;

    const fetchCities = async () => {
      setCitiesLoading(true);
      try {
        const res = await api.get("/cities", { params: { limit: 500 } });
        setCities(normalizeRecords(res.data));
      } catch (error) {
        console.error("Cities lookup failed:", error);
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    };

    fetchCities();
  }, [open]);

  useEffect(() => {
    if (!open || !selectedCityId || selectedCityId === NONE_VALUE) {
      setAreas([]);
      return;
    }

    const fetchAreas = async () => {
      setAreasLoading(true);
      try {
        const res = await api.get(`/cities/${selectedCityId}/areas`);
        setAreas(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Areas lookup failed:", error);
        setAreas([]);
      } finally {
        setAreasLoading(false);
      }
    };

    fetchAreas();
  }, [selectedCityId, open]);

  const onSubmit = async (values) => {
    const payload = {
      label: values.label?.trim() || undefined,
      address: values.address?.trim(),
      cityId: values.cityId === NONE_VALUE ? undefined : values.cityId,
      areaId: values.areaId === NONE_VALUE ? undefined : values.areaId,
      landmark: values.landmark?.trim() || undefined,
      isDefault: values.isDefault,
    };

    setSaving(true);
    try {
      if (address?.id) {
        await api.patch(`/clients/${customerId}/addresses/${address.id}`, payload);
        toast.success(t("addresses.toast.updated"));
      } else {
        await api.post(`/clients/${customerId}/addresses`, payload);
        toast.success(t("addresses.toast.created"));
      }
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(normalizeAxiosError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden rounded-2xl bg-card">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin size={20} />
            </span>
            {address ? t("addresses.editTitle") : t("addresses.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address-label">{t("addresses.fields.label")}</Label>
              <Controller
                name="label"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="address-label"
                    placeholder={t("addresses.placeholders.label")}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address-landmark">{t("addresses.fields.landmark")}</Label>
              <Controller
                name="landmark"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="address-landmark"
                    placeholder={t("addresses.placeholders.landmark")}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("addresses.fields.city")}</Label>
              <Controller
                name="cityId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue("areaId", NONE_VALUE);
                    }}
                    disabled={citiesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("addresses.placeholders.city")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>{t("addresses.placeholders.city")}</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {getLocalizedName(city, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("addresses.fields.area")}</Label>
              <Controller
                name="areaId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={field.onChange}
                    disabled={areasLoading || selectedCityId === NONE_VALUE}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("addresses.placeholders.area")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>{t("addresses.placeholders.area")}</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {getLocalizedName(area, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-full">{t("addresses.fields.address")}</Label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value || ""}
                  id="address-full"
                  rows={4}
                  placeholder={t("addresses.placeholders.address")}
                  className={errors.address ? "border-red-500" : ""}
                />
              )}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>

          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox onCheckedChange={field.onChange} checked={Boolean(field.value)} />
                <span className="text-sm font-semibold text-foreground">{t("addresses.fields.isDefault")}</span>
              </div>
            )}
          />

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerPage() {
  const params = useParams();
  const customerId = params?.id;
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const td = useTranslations("customers.details");
  const t = useTranslations("customers");
  const { formatCurrency } = usePlatformSettings();

  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [defaultLoadingId, setDefaultLoadingId] = useState(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [unlinkingContactId, setUnlinkingContactId] = useState(null);
  const [primaryContactLoadingId, setPrimaryContactLoadingId] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const formatDate = useCallback((value) => {
    if (!value) return "-";
    return format.dateTime(new Date(value), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [format]);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    try {
      const res = await api.get(`/clients/${customerId}`);
      setCustomer(res.data || null);
      setError(null);
    } catch (err) {
      console.error("Failed to load customer:", err);
      setError(normalizeAxiosError(err));
      setCustomer(null);
    }
  }, [customerId]);

  const fetchStats = useCallback(async () => {
    if (!customerId) return;
    setStatsLoading(true);
    try {
      const res = await api.get(`/clients/${customerId}/orders/stats`);
      setStats(res.data || {});
    } catch (err) {
      console.error("Failed to load customer order stats:", err);
      setStats({});
    } finally {
      setStatsLoading(false);
    }
  }, [customerId]);

  const fetchAddresses = useCallback(async () => {
    if (!customerId) return;
    setAddressesLoading(true);
    try {
      const res = await api.get(`/clients/${customerId}/addresses`);
      setAddresses(normalizeRecords(res.data));
    } catch (err) {
      console.error("Failed to load customer addresses:", err);
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, [customerId]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCustomer(), fetchStats(), fetchAddresses()]);
    setLoading(false);
  }, [fetchAddresses, fetchCustomer, fetchStats]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const defaultAddress = useMemo(() => {
    return addresses.find((address) => address.isDefault) ?? null;
  }, [addresses]);

  const statCards = useMemo(() => {
    const raw = stats?.stats || stats?.data || stats || {};
    const formatNumber = (value) => Number(value || 0).toLocaleString(locale);
    const formatPercent = (value) => `${Number(value || 0).toLocaleString(locale)}%`;
    const percentOfTotal = (count) => {
      const total = Number(raw.totalOrders) || 0;
      if (total <= 0) return "0%";
      return `${((Number(count) || 0) / total * 100).toFixed(2)}%`;
    };

    return [
      {
        id: "totalOrders",
        name: td("stats.totalOrders"),
        value: formatNumber(raw.totalOrders),
        icon: Package,
        sortOrder: 0,
      },
      {
        id: "confirmedCount",
        name: td("stats.confirmedCount"),
        value: formatNumber(raw.confirmedCount),
        icon: CheckCircle2,
        sortOrder: 1,
        trend: {
          label: t("stats.percentOfTotalOrders"),
          value: percentOfTotal(raw.confirmedCount),
          showArrow: false,
        },
      },
      {
        id: "shippedCount",
        name: td("stats.shippedCount"),
        value: formatNumber(raw.shippedCount),
        icon: Truck,
        sortOrder: 3,
        trend: {
          label: t("stats.percentOfTotalOrders"),
          value: percentOfTotal(raw.shippedCount),
          showArrow: false,
        },
      },
      {
        id: "deliveredCount",
        name: td("stats.deliveredCount"),
        value: formatNumber(raw.deliveredCount),
        icon: Calendar,
        sortOrder: 4,
        trend: {
          label: t("stats.percentOfTotalOrders"),
          value: percentOfTotal(raw.deliveredCount),
          showArrow: false,
        },
      },
      {
        id: "returnedCount",
        name: td("stats.returnedCount"),
        value: formatNumber(raw.returnedCount),
        icon: RotateCcw,
        sortOrder: 5,
        trend: {
          label: t("stats.percentOfTotalOrders"),
          value: percentOfTotal(raw.returnedCount),
          showArrow: false,
        },
      },
      {
        id: "cancelledCount",
        name: td("stats.cancelledCount"),
        value: formatNumber(raw.cancelledCount),
        icon: Ban,
        sortOrder: 6,
        trend: {
          label: t("stats.percentOfTotalOrders"),
          value: formatPercent(raw.cancelRate),
          showArrow: false,
        },
      },
      {
        id: "cancelledBeforeShippingCount",
        name: td("stats.cancelledBeforeShipping"),
        value: formatNumber(raw.cancelledBeforeShippingCount),
        icon: Ban,
        sortOrder: 7,
        trend: {
          label: t("stats.percentOfTotalOrders"),
          value: formatPercent(raw.beforeShippingCancelRate),
          showArrow: false,
        },
      },
      {
        id: "cancelledAfterShippingCount",
        name: td("stats.cancelledAfterShipping"),
        value: formatNumber(raw.cancelledAfterShippingCount),
        icon: Ban,
        sortOrder: 8,
        trend: {
          label: t("stats.percentOfShippedOrders"),
          value: formatPercent(raw.afterShippingCancelRateOfShipped),
          showArrow: false,
        },
      },
      {
        id: "totalSales",
        name: td("stats.totalSales"),
        value: formatCurrency(raw.totalSales || 0),
        icon: BarChart3,
        sortOrder: 9,
      },
      {
        id: "deliveredRevenue",
        name: td("stats.deliveredRevenue"),
        value: formatCurrency(raw.deliveredRevenue || 0),
        icon: CheckCircle2,
        sortOrder: 10,
      },
    ];
  }, [formatCurrency, locale, stats, t, td]);

  const tagStats = useMemo(() => {
    const raw = stats?.stats || stats?.data || stats || {};
    return Array.isArray(raw?.tags) ? raw.tags : [];
  }, [stats]);

  const handleChat = () => {
    const contact = getPrimaryContact(customer);
    if (contact?.id) {
      router.push(`/whatsapp/chats?customerId=${contact.id}`);
    }
  };

  const openAddressDialog = (address = null) => {
    setEditingAddress(address);
    setAddressDialogOpen(true);
  };

  const handleSetDefault = async (address) => {
    setDefaultLoadingId(address.id);
    try {
      await api.patch(`/clients/${customerId}/addresses/${address.id}/default`);
      toast.success(td("addresses.toast.defaultUpdated"));
      fetchAddresses();
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    } finally {
      setDefaultLoadingId(null);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deletingAddress) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/clients/${customerId}/addresses/${deletingAddress.id}`);
      toast.success(td("addresses.toast.deleted"));
      setDeletingAddress(null);
      fetchAddresses();
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLinkContact = async () => {
    if (!contactPhone.trim()) return;
    setContactSaving(true);
    try {
      await api.post(`/clients/${customerId}/contacts/link`, {
        phoneNumber: contactPhone.trim(),
        isPrimary: !getPrimaryContact(customer),
      });
      toast.success(td("contacts.toast.linked"));
      setContactPhone("");
      setContactDialogOpen(false);
      fetchCustomer();
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    } finally {
      setContactSaving(false);
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    if (primaryContactLoadingId) return;
    setPrimaryContactLoadingId(contactId);
    try {
      await api.patch(`/clients/${customerId}/contacts/${contactId}/primary`);
      toast.success(td("contacts.toast.primaryUpdated"));
      fetchCustomer();
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    } finally {
      setPrimaryContactLoadingId(null);
    }
  };

  const handleUnlinkContact = async (contactId) => {
    if (unlinkingContactId) return;
    setUnlinkingContactId(contactId);
    try {
      await api.delete(`/clients/${customerId}/contacts/${contactId}`);
      toast.success(td("contacts.toast.unlinked"));
      fetchCustomer();
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    } finally {
      setUnlinkingContactId(null);
    }
  };

  if (loading) {
    return <CustomerDetailsPageSkeleton />;
  }

  if (error || !customer) {
    return (
      <div className="space-y-4 in-h-screen p-5">
        <PageHeader
          breadcrumbs={[
            { name: t("breadcrumb.home"), href: "/dashboard" },
            { name: t("breadcrumb.customers"), href: "/customers" },
            { name: td("title") },
          ]}
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-950/30">
          <p className="font-bold">{td("errorTitle")}</p>
          <p className="mt-1 text-sm">{error || td("notFound")}</p>
          <Button className="mt-4" variant="outline" onClick={loadPage}>
            {td("retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.customers"), href: "/customers" },
          { name: customer.name || td("title") },
        ]}
        buttons={
          <div className="flex flex-wrap items-center gap-2">
            {/* <Button_ size="sm" variant="outline" label={td("actions.chat")} icon={<MessageCircle size={16} />} onClick={handleChat} permission="conversation.create" /> */}
            <Button_ size="sm" variant="solid" label={td("actions.editCustomer")} icon={<Edit size={16} />} onClick={() => setClientModalOpen(true)} permission="customer.update" />
          </div>
        }
      />

      <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                  <AvatarImage src={avatarSrc(customer.profilePicture)} alt={customer.name || "Customer"} />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <UserRound size={34} />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm">
                  <User size={14} />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-black text-foreground">
                    {customer.name || td("unknownCustomer")}
                  </h1>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Calendar size={15} />
                  {td("joinedAt", { date: formatDate(customer.createdAt) })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 flex-1">
            <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/60 md:grid-cols-2 xl:grid-cols-4">
              <InfoBlock icon={Phone} label={td("fields.phone")} value={getPrimaryContact(customer)?.phoneNumber} />
              <InfoBlock icon={User} label={t("columns.contacts")} value={getContacts(customer).length} />
              <InfoBlock icon={Mail} label={td("fields.email")} value={customer.email} />
              <InfoBlock
                icon={MapPin}
                label={td("fields.primaryAddress")}
                value={defaultAddress ? [getAddressCity(defaultAddress, locale), getAddressArea(defaultAddress, locale), defaultAddress.address].filter(Boolean).join("، ") : "-"}
              // highlighted={Boolean(defaultAddress)}
              />
            </div>

            {tagStats.length ? (
              <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-black text-foreground">
                  <Tag size={16} className="text-primary" />
                  {td("tagStats")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tagStats.map((tag) => (
                    <span
                      key={tag.id || tag.name}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black"
                      style={{
                        color: tag.color || "var(--primary)",
                        borderColor: tag.color ? `${tag.color}33` : "color-mix(in oklab, var(--primary) 25%, var(--border))",
                        backgroundColor: tag.color ? `${tag.color}12` : "color-mix(in oklab, var(--primary) 8%, transparent)",
                      }}
                    >
                      <span>{tag.name}</span>
                      <span
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-[11px]"
                        style={{ color: tag.color || "var(--primary)" }}
                      >
                        {Number(tag.count ?? tag.value ?? 0).toLocaleString(locale)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-black text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Phone size={16} className="text-primary" />
                  </div>
                  {t("columns.contacts")}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  permission="customer.update"
                  onClick={() => setContactDialogOpen(true)}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  {td("contacts.link")}
                </Button>
              </div>

              {/* Contacts */}
              {getContacts(customer).length ? (
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                  {getContacts(customer).map((contact, index) => {
                    const isPrimary = customer.primaryContactId === contact.id;

                    return (
                      <div
                        key={contact.id}
                        className={cn(
                          "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between",
                          index !== 0 && "border-t border-border/60",
                          isPrimary && "bg-primary/[0.035]",
                        )}
                      >
                        {/* Contact Info */}
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage
                              src={avatarSrc(contact.profilePicture)}
                              alt={contact.name || ""}
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {(contact.name || contact.phoneNumber || "?").slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-bold text-foreground">
                                {contact.name || contact.phoneNumber}
                              </span>

                              {isPrimary ? (
                                <Badge
                                  variant="secondary"
                                  className="h-5 rounded-full px-2 text-[10px] font-bold"
                                >
                                  {td("addresses.primaryAddress")}
                                </Badge>
                              ) : null}
                            </div>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {contact.phoneNumber}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            permission="whatsapp.read"
                            onClick={() =>
                              router.push(`/whatsapp/chats?customerId=${contact.id}`)
                            }
                          >
                            <MessageCircle className="h-4 w-4" />
                            {td("contacts.openChat")}
                          </Button>

                          {!isPrimary ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              permission="customer.update"
                              disabled={!!primaryContactLoadingId}
                              onClick={() => handleSetPrimaryContact(contact.id)}
                            >
                              {primaryContactLoadingId === contact.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                              {td("contacts.setPrimary")}
                            </Button>
                          ) : null}

                          <Button
                            size="sm"
                            variant="ghost"
                            permission="customer.update"
                            disabled={!!unlinkingContactId}
                            onClick={() => handleUnlinkContact(contact.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {unlinkingContactId === contact.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            {td("contacts.unlink")}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/50 text-sm text-muted-foreground">
                  -
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-primary">
                <Edit size={16} />
                {td("fields.notes")}
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                {customer.notes || td("noNotes")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card title={td("statsTitle")} icon={User}>
        {statsLoading ? (
          <StatsCardsSkeleton />
        ) : statCards.length ? (
          <StatsGrid stats={statCards} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {td("statsEmpty")}
          </div>
        )}
      </Card>

      <Card
        title={td("addresses.title")}
        icon={User}
        action={
          <Button onClick={() => openAddressDialog()} className="rounded-xl" permission="customer.create">
            <Plus className="h-4 w-4" />
            {td("addresses.add")}
          </Button>
        }
      >
        <p className="mb-5 text-sm text-muted-foreground">{td("addresses.subtitle")}</p>

        {addressesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-2xl border border-border bg-muted/30" />
            ))}
          </div>
        ) : addresses.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                customer={customer}
                locale={locale}
                t={td}
                loadingDefault={defaultLoadingId === address.id}
                onEdit={() => openAddressDialog(address)}
                onDelete={() => setDeletingAddress(address)}
                onSetDefault={() => handleSetDefault(address)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <Home className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-base font-black text-foreground">{td("addresses.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{td("addresses.emptySubtitle")}</p>
            <Button className="mt-5 rounded-xl" onClick={() => openAddressDialog()}>
              <Plus className="h-4 w-4" />
              {td("addresses.add")}
            </Button>
          </div>
        )}
      </Card>

      <Card title={td("orders.title")} icon={User}>
        <OrderTab
          tableKey="customer-orders"
          flat={true}
          hideHeader
          showTopActions={false}
          showBulkUpload={false}
          readOnlyStatus={true}
          showCustom={false}
          clientId={customerId}
          customerOrdersMode
          label={td("orders.title")}
        />
      </Card>

      <ClientModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        client={customer}
        onSave={() => {
          fetchCustomer();
          fetchStats();
          fetchAddresses();
        }}
      />

      <AddressDialog
        open={addressDialogOpen}
        onOpenChange={(open) => {
          setAddressDialogOpen(open);
          if (!open) setEditingAddress(null);
        }}
        address={editingAddress}
        customerId={customerId}
        onSaved={fetchAddresses}
      />

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>{td("contacts.link")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{td("fields.phoneNumber")}</Label>
            <Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)} disabled={contactSaving}>
              {td("actions.cancel")}
            </Button>
            <Button onClick={handleLinkContact} disabled={contactSaving}>
              {contactSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : td("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingAddress}
        onOpenChange={(open) => !open && setDeletingAddress(null)}
        title={td("addresses.delete.title")}
        description={td("addresses.delete.desc", {
          label: deletingAddress?.label || deletingAddress?.address || "",
        })}
        confirmText={td("addresses.delete.confirm")}
        cancelText={td("actions.cancel")}
        loading={deleteLoading}
        onConfirm={handleDeleteAddress}
      />
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value, highlighted = false }) {
  return (
    <div className={cn(
      "min-h-28 p-5 border-b border-border/60 md:odd:border-e md:nth-last-[-n+2]:border-b-0 xl:border-b-0 xl:border-e xl:last:border-e-0",
      highlighted && "bg-primary/5",
    )}>
      <div className="flex h-full items-center justify-center gap-3 xl:justify-start">
        <span className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
          highlighted && "bg-primary/10 text-primary",
        )}>
          <Icon size={17} />
        </span>
        <div className="min-w-0 text-center xl:text-start">
          <p className="text-xs font-black text-muted-foreground">{label}</p>
          <p className="mt-2 wrap-break-word text-sm font-black leading-6 text-foreground">
            {valueOrDash(value)}
          </p>
        </div>
      </div>
    </div>
  );
}

function AddressCard({
  address,
  customer,
  locale,
  t,
  loadingDefault,
  onEdit,
  onDelete,
  onSetDefault,
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
      address.isDefault ? "border-primary/40 ring-1 ring-primary/15" : "border-border/70",
    )}>
      {address.isDefault ? (
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin size={19} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-foreground">
              {address.label || t("addresses.defaultLabel")}
            </h3>
            {/* <p className="mt-1 text-xs text-muted-foreground">
              {customer?.name || t("unknownCustomer")}
            </p> */}
          </div>
        </div>
        {address.isDefault ? (
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
            {t("addresses.defaultBadge")}
          </Badge>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
        {/* <AddressLine label={t("fields.phone")} value={customer?.phoneNumber} /> */}
        <AddressLine label={t("addresses.fields.city")} value={getAddressCity(address, locale)} />
        <AddressLine label={t("addresses.fields.area")} value={getAddressArea(address, locale)} />
        <AddressLine label={t("addresses.fields.district")} value={address.district || address.zone || address.landmark} />
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <p className="text-xs font-black text-muted-foreground">{t("addresses.fields.address")}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{valueOrDash(address.address)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        {!address.isDefault ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-xl text-xs"
            onClick={onSetDefault}
            permission="customer.update"
            disabled={loadingDefault}
          >
            {loadingDefault ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
            {t("addresses.setDefault")}
          </Button>
        ) : (
          <span className="text-xs font-bold text-primary">{t("addresses.primaryAddress")}</span>
        )}
        <ActionButtons
          row={address}
          actions={[
            {
              icon: <Edit size={16} />,
              tooltip: t("actions.edit"),
              onClick: onEdit,
              variant: "primary",
              permission: "customer.update",
            },
            {
              icon: <Trash2 size={16} />,
              tooltip: t("actions.delete"),
              onClick: onDelete,
              variant: "red",
              permission: "customer.delete",
            },
          ]}
        />
      </div>
    </div>
  );
}

function AddressLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/25 px-3 py-2">
      <span className="text-xs font-black text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground text-end">{valueOrDash(value)}</span>
    </div>
  );
}

function Bone({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50 dark:bg-slate-800/70",
        className,
      )}
    />
  );
}

function StatsCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3 py-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border/40 bg-card p-4">
          <div className="flex items-center gap-3">
            <Bone className="h-11 w-11 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-6 w-20" />
              <Bone className="h-2.5 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerDetailsPageSkeleton() {
  return (
    <div className="space-y-5 min-h-screen p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bone className="h-3 w-16" />
          <Bone className="h-3 w-3 rounded-full" />
          <Bone className="h-3 w-24" />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Bone className="h-9 w-20 rounded-xl" />
          <Bone className="h-9 w-24 rounded-xl" />
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Bone className="h-20 w-20 rounded-full shrink-0" />
              <div className="min-w-0 space-y-3">
                <Bone className="h-7 w-40" />
                <Bone className="h-3 w-36" />
              </div>
            </div>
          </div>

          <div className="space-y-5 flex-1">
            <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/60 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="min-h-28 p-5 border-b border-border/60 md:odd:border-e md:nth-last-[-n+2]:border-b-0 xl:border-b-0 xl:border-e xl:last:border-e-0"
                >
                  <div className="flex h-full items-center justify-center gap-3 xl:justify-start">
                    <Bone className="h-10 w-10 rounded-xl shrink-0" />
                    <div className="min-w-0 space-y-3">
                      <Bone className="h-2.5 w-24" />
                      <Bone className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Bone className="h-4 w-4 rounded" />
                <Bone className="h-4 w-24" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((item) => (
                  <Bone key={item} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Bone className="h-4 w-4 rounded" />
                <Bone className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-5/6" />
                <Bone className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatsCardsSkeleton />

      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Bone className="h-5 w-36" />
            <Bone className="h-3 w-56 max-w-full" />
          </div>
          <Bone className="h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border/60 bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Bone className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Bone className="h-4 w-28" />
                    <Bone className="h-3 w-20" />
                  </div>
                </div>
                <Bone className="h-5 w-16 rounded-full" />
              </div>
              <div className="mt-4 space-y-2">
                {[0, 1, 2, 3].map((item) => (
                  <Bone key={item} className="h-8 w-full rounded-xl" />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <Bone className="h-8 w-28 rounded-xl" />
                <div className="flex items-center gap-2">
                  <Bone className="h-8 w-8 rounded-lg" />
                  <Bone className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Bone className="h-5 w-5 rounded-lg" />
          <Bone className="h-5 w-32" />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center justify-between gap-3">
            <Bone className="h-9 w-56 rounded-xl" />
            <Bone className="h-9 w-24 rounded-xl" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Bone className="h-4 w-24" />
                <Bone className="h-4 w-32" />
                <Bone className="h-4 w-20" />
                <Bone className="h-6 w-16 rounded-full" />
                <Bone className="h-8 w-20 rounded-xl ms-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}