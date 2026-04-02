// --- File: IdleTab.jsx ---
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, DollarSign, Edit2, Eye, QrCode, Tag, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import ActionButtons from "@/components/atoms/Actions";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

function normalizeAxiosError(err) {
  const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export default function useIdleTab({ t, searchDebounced, filters, idleFromDate, onAskDelete, onOpenView, onExportRequest, activetab }) {
  const router = useRouter();
  const requestIdRef = useRef(0);
  const { formatCurrency } = usePlatformSettings();
  const [loading, setLoading] = useState(false);
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 6,
    records: []
  });

  function buildQueryParams({ page, per_page }) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(per_page));
    params.set("type", "PRODUCT_IDLE");

    if (searchDebounced?.trim()) params.set("search", searchDebounced.trim());

    if (filters.storageRack?.trim()) params.set("storageRack.ilike", filters.storageRack.trim());
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.storeId) params.set("storeId", filters.storeId);
    if (filters.warehouseId) params.set("warehouseId", filters.warehouseId);

    if (filters.priceFrom !== "") params.set("wholesalePrice.gte", String(filters.priceFrom));
    if (filters.priceTo !== "") params.set("wholesalePrice.lte", String(filters.priceTo));

    if (filters.salePriceFrom !== "") params.set("salePrice.gte", String(filters.salePriceFrom));
    if (filters.salePriceTo !== "") params.set("salePrice.lte", String(filters.salePriceTo));

    if (idleFromDate) params.set("created_at.lte", `${idleFromDate}T23:59:59.999Z`);

    params.set("sortBy", "created_at");
    params.set("sortOrder", "DESC");
    return params;
  }

  async function fetchData({ page = 1, per_page = pager.per_page } = {}) {
    const reqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const params = buildQueryParams({ page, per_page });
      const res = await api.get(`/products?${params.toString()}`);
      if (reqId !== requestIdRef.current) return;

      const data = res.data;
      const records = Array.isArray(data?.records) ? data.records : Array.isArray(data) ? data : [];

      setPager({
        total_records: Number(data?.total_records ?? records.length ?? 0),
        current_page: Number(data?.current_page ?? page),
        per_page: Number(data?.per_page ?? per_page),
        records
      });
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      toast.error(normalizeAxiosError(e));
      setPager((p) => ({ ...p, records: [] }));
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    onExportRequest?.(() => buildQueryParams({ page: 1, per_page: 1000000 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, filters, idleFromDate]);

  useEffect(() => {
    if (activetab !== "idle") return;
    fetchData({ page: 1, per_page: pager.per_page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, activetab]);


  const columns = useMemo(() => {
    const na = t("common.na");
    return [
      { key: "id", header: t("table.id"), className: "font-semibold text-primary w-[80px]" },
      { key: "mainImage", header: t("table.mainImage"), className: "w-[100px]", type: "img" },
      { key: "images", header: t("table.imagesCount"), className: "w-[100px]", type: "imgs" },
      {
        key: "name",
        header: t("table.name"),
        className: "text-gray-700 dark:text-slate-200 font-semibold min-w-[200px]"
      },
      {
        key: "category",
        header: t("table.category"),
        className: "min-w-[120px]",
        cell: (row) => (
          <Badge variant="secondary" className="rounded-full">
            {row?.category?.name ?? na}
          </Badge>
        )
      },
      { key: "store", header: t("table.store"), className: "min-w-[120px]", cell: (row) => row?.store?.name ?? na },
      { key: "warehouse", header: t("table.warehouse"), className: "min-w-[120px]", cell: (row) => row?.warehouse?.name ?? na },
      { key: "storageRack", header: t("table.storageRack"), className: "min-w-[100px]", cell: (row) => row.storageRack ?? na },
      {
        key: "salePrice",
        header: t("table.salePrice"),
        className: "min-w-[100px]",
        cell: (row) => (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
            {formatCurrency(row.salePrice || 0)}
          </div>
        )
      },
      {
        key: "wholesalePrice",
        header: t("table.wholesalePrice"),
        className: "min-w-[100px]",
        cell: (row) => (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
            {formatCurrency(row.wholesalePrice || 0)}
          </div>
        )
      },
      {
        key: "lowestPrice",
        header: t("table.lowestPrice"),
        className: "min-w-[100px]",
        cell: (row) => (
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
            <Tag size={14} />
            {row.lowestPrice ?? na}
          </div>
        )
      },
      {
        key: "sku",
        header: t("table.sku"),
        className: "min-w-[150px]",
        cell: (row) => {
          const firstSku = row?.skus?.[0]?.sku || na;
          const skuCount = row?.skus?.length || 0;
          return (
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-primary" />
              <span className="text-gray-600 dark:text-slate-200 font-mono text-sm">{firstSku}</span>
              {skuCount > 1 && (
                <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20 text-xs px-2">
                  +{skuCount - 1}
                </Badge>
              )}
            </div>
          );
        }
      },
      {
        key: "created_at",
        header: t("table.createdAt"),
        className: "min-w-[120px]",
        cell: (row) => (
          <div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300 text-sm">
            <CalendarDays size={14} className="text-gray-400 dark:text-slate-500" />
            {row.created_at ? new Date(row.created_at).toLocaleDateString("en-US") : na}
          </div>
        )
      },
      {
        key: "actions",
        header: t("table.options"),
        className: "",
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Trash2 />,
                tooltip: t("actions.delete"),
                onClick: (r) => onAskDelete?.(r.id, "products"),
                variant: "red",
                permission: "products.delete",
              },
              {
                icon: <Edit2 />,
                tooltip: t("actions.edit"),
                onClick: (r) => router.push(`/products/edit/${r.id}`),
                variant: "blue",
                permission: "products.update",
              },
              {
                icon: <Eye />,
                tooltip: t("actions.view"),
                onClick: (r) => onOpenView?.(r.id, "products"),
                variant: "purple",
                permission: "products.read",
              },
            ]}
          />
        )
      }
    ];
  }, [router, t, onAskDelete, onOpenView]);

  return { loading, pager, columns, fetchData, buildQueryParams };
}
