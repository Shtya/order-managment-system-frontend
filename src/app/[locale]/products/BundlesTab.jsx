// --- File: BundlesTab.jsx ---
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Edit2, Eye, QrCode, Trash2, Package, Tag, Hash, Store, AlignLeft, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { Bone } from "@/components/atoms/BannerSkeleton";
import { avatarSrc } from "@/components/atoms/UserSelect";
import ActionButtons from "@/components/atoms/Actions";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

function normalizeAxiosError(err) {
  const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export default function useBundlesTab({ t, searchDebounced, filters, onAskDelete, onOpenView, onExportRequest, activetab }) {
  const router = useRouter();
  const requestIdRef = useRef(0);


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

    if (searchDebounced?.trim()) params.set("search", searchDebounced.trim());

    if (filters.priceFrom !== "") params.set("wholesalePrice.gte", String(filters.priceFrom));
    if (filters.priceTo !== "") params.set("wholesalePrice.lte", String(filters.priceTo));

    if (filters.storeId && filters.storeId !== "none") params.set("storeId", String(filters.storeId));
    if (filters.categoryId && filters.categoryId !== "none") params.set("categoryId", String(filters.categoryId));

    params.set("sortBy", "created_at");
    params.set("sortOrder", "DESC");
    return params;
  }

  async function fetchData({ page = 1, per_page = pager.per_page } = {}) {
    const reqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const params = buildQueryParams({ page, per_page });
      const res = await api.get(`/bundles?${params.toString()}`);
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
  }, [searchDebounced, filters]);

  useEffect(() => {
    if (activetab !== "bundles") return;
    fetchData({ page: 1, per_page: pager.per_page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, activetab]);

  const columns = useMemo(() => {
    const na = t("common.na");
    return [
      // { key: "id", header: t("table.id"), className: "font-semibold text-primary w-[80px]" },
      {
        key: "name",
        header: t("table.name"),
        className: "text-gray-700 dark:text-slate-200 font-semibold min-w-[200px]"
      },
      {
        key: "price",
        header: t("table.price"),
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-slate-200 font-[Inter] text-sm">{row.price || na}</span>
          </div>
        )
      },
      {
        key: "sku",
        header: t("table.sku"),
        className: "min-w-[150px]",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-primary" />
            <span className="font-[Inter] text-gray-700 dark:text-slate-200 text-sm font-semibold">{row.sku || na}</span>
          </div>
        )
      },
      {
        key: "mainVariant",
        header: t("common.variant"),
        className: "min-w-[200px]",
        cell: (row) => {
          const v = row.variant;
          if (!v) return <span className="text-slate-400">{na}</span>;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-border/50 shrink-0">
                {v.mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc(v.mainImage)} alt={v.sku} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={16} className="text-slate-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {v.product?.name || na}
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {v.sku}
                </span>
              </div>
            </div>
          );
        }
      },
      {
        key: "store",
        header: t("common.store"),
        className: "min-w-[150px]",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Store size={14} className="text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {row.store?.name || na}
            </span>
          </div>
        )
      },
      {
        key: "bundleItems",
        header: t("table.bundleItems"),
        className: "min-w-[200px]",
        cell: (row) => {
          const items = row?.items || [];
          return (
            <div className="flex flex-wrap gap-2">
              {items.length === 0 ? (
                <span className="text-slate-400">{na}</span>
              ) : (
                items.slice(0, 3).map((item, idx) => (
                  <Badge key={idx} className="rounded-full bg-primary/10 text-primary border border-primary/20">
                    {item.variant?.sku || `#${item.variantId}`} × {item.qty}
                  </Badge>
                ))
              )}
              {items.length > 3 && (
                <Badge className="rounded-full bg-slate-100 text-slate-600">+{items.length - 3}</Badge>
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
        className: "bg-white dark:bg-slate-900",
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Edit2 />,
                tooltip: t("actions.edit"),
                onClick: (r) => router.push(`/bundles/edit/${r.id}`),
                variant: "primary",
                permission: "products.update",
              },
              {
                icon: <Eye />,
                tooltip: t("actions.view"),
                onClick: (r) => onOpenView?.(r.id, "bundles"),
                variant: "primary",
                permission: "products.read",
              },
              {
                icon: <Trash2 />,
                tooltip: t("actions.delete"),
                onClick: (r) => onAskDelete?.(r.id, "bundles"),
                variant: "red",
                permission: "products.delete",
              },
            ]}
          />
        )
      }
    ];
  }, [router, t, onAskDelete, onOpenView]);

  function removeRowFromPager(id) {
    setPager((p) => ({
      ...p,
      records: (p.records || []).filter((r) => r.id !== id),
      total_records: Math.max(0, Number(p.total_records || 0) - 1)
    }));
  }

  return { loading, pager, columns, fetchData, buildQueryParams, removeRowFromPager };
}

function formatDate(d, na) {
  if (!d) return na;
  try {
    return new Date(d).toLocaleString("en-US");
  } catch {
    return String(d);
  }
}



export function BundleViewModal({ open, onOpenChange, bundle, viewLoading }) {
  const t = useTranslations("products");
  const na = t("common.na");

  const items = bundle?.items ?? [];
  const { formatCurrency } = usePlatformSettings();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Package className="text-primary" size={20} />
            <span>{t("bundleModal.title")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-110px)] space-y-6 bg-white dark:bg-slate-900">
          {viewLoading ? (
            <BundleModalSkeleton />
          ) : !bundle ? (
            <div className="py-10 text-center text-slate-500">{t("bundleModal.noData")}</div>
          ) : (
            <>
              {/* Top Info Card */}
              <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">{bundle.name ?? na}</div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Hash size={14} className="mr-1" />
                        {t("common.id")}: {bundle.id}
                      </Badge>

                      <Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Tag size={14} className="mr-1" />
                        {bundle.sku ?? na}
                      </Badge>

                      <Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200">
                        {t("common.price")}: {formatCurrency(bundle.price, na)}
                      </Badge>

                      {bundle.store && (
                        <Badge className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200">
                          <Store size={14} className="mr-1" />
                          {t("bundleModal.store")}: {bundle.store.name}
                        </Badge>
                      )}
                    </div>

                    {bundle.variant && (
                      <div className="w-full mt-4 flex items-center gap-4 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center border border-primary/20 dark:border-border shrink-0 shadow-sm">
                          {bundle.variant.mainImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarSrc(bundle.variant.mainImage)} alt={bundle.variant.sku} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={24} className="text-primary/50" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="text-xs font-bold text-primary dark:text-primary/90 uppercase tracking-wider mb-1">
                            {t("bundleModal.variant")}
                          </div>
                          <div className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {bundle.variant.product?.name || na}
                          </div>
                          <div className="flex items-center flex-wrap   gap-2 mt-1">
                            <Badge variant="outline" className="font-mono text-[10px] py-0 h-5 border-primary/30 text-primary dark:text-primary/90">
                              {bundle.variant.sku}
                            </Badge>
                            <span className="text-[10px] text-slate-400">
                              ID: {bundle.variant.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CalendarDays size={14} />
                    {formatDate(bundle.created_at, na)}
                  </div>
                </div>

                {bundle.description && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                      <AlignLeft size={12} />
                      {t("common.description")}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {bundle.description}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Contents Section */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("bundleModal.contents")} ({items.length})
                </div>

                {items.length === 0 ? (
                  <div className="text-slate-500">{t("bundleModal.noItems")}</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <div className="min-w-[720px]">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-200 px-4 py-3">
                        <div className="col-span-4">{t("common.variant")}</div>
                        <div className="col-span-2 text-center">{t("common.qty")}</div>
                        <div className="col-span-3 text-center">{t("common.stock")}</div>
                        <div className="col-span-3 text-right">{t("common.attributes")}</div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y">
                        {items.map((it) => {
                          const v = it.variant;
                          const available = Math.max(0, (v?.stockOnHand ?? 0) - (v?.reserved ?? 0));
                          const attrs = v?.attributes ? Object.entries(v.attributes) : [];

                          return (
                            <div key={it.id} className="grid grid-cols-12 px-4 py-3 text-sm bg-white dark:bg-slate-900 items-center">
                              <div className="col-span-4 overflow-hidden">
                                <div className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                                  {v?.sku ?? `#${it.variantId}`}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                  {t("common.variantId")}: {it.variantId}
                                </div>
                              </div>

                              <div className="col-span-2 flex items-center justify-center">
                                <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20">
                                  × {it.qty}
                                </Badge>
                              </div>

                              <div className="col-span-3 flex items-center justify-center gap-2 flex-nowrap">
                                <Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0">
                                  {t("common.onHand")}: {v?.stockOnHand ?? 0}
                                </Badge>
                                <Badge className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 whitespace-nowrap shrink-0">
                                  {t("common.available")}: {available}
                                </Badge>
                              </div>

                              <div className="col-span-3 flex flex-wrap items-center justify-end gap-1.5">
                                {attrs.length === 0 ? (
                                  <span className="text-slate-400">{na}</span>
                                ) : (
                                  <>
                                    {attrs.slice(0, 2).map(([k, val]) => (
                                      <Badge
                                        key={k}
                                        className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
                                      >
                                        {k}: {String(val)}
                                      </Badge>
                                    ))}
                                    {attrs.length > 2 && (
                                      <Badge className="rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">+{attrs.length - 2}</Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
      SKELETON FOR BUNDLES
═══════════════════════════════════════════════════════════ */
function BundleModalSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Bundle Header Card */}
      <div className="relative main-card rounded-2xl border border-border/50 overflow-hidden p-5">
        <div className="h-[3px] rounded-full bg-muted/40 -mx-5 -mt-5 mb-5" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3 flex-1">
            <Bone className="h-6 w-1/2" /> {/* Name */}
            <div className="flex flex-wrap gap-2">
              <Bone className="h-5 w-24 rounded-full" /> {/* ID */}
              <Bone className="h-5 w-20 rounded-full" /> {/* SKU */}
              <Bone className="h-5 w-28 rounded-full" /> {/* Price */}
              <Bone className="h-5 w-32 rounded-full" /> {/* Store */}
            </div>

            {/* Variant Section Skeleton */}
            <div className="w-full mt-4 flex items-center gap-4 p-4 rounded-xl border border-border/20">
              <Bone className="w-16 h-16 rounded-lg shrink-0" /> {/* Variant Image */}
              <div className="flex-1 space-y-2">
                <Bone className="h-3 w-20" /> {/* Variant Label */}
                <Bone className="h-5 w-1/2" /> {/* Variant Name */}
                <div className="flex gap-2">
                  <Bone className="h-5 w-24 rounded-full" /> {/* Variant SKU */}
                  <Bone className="h-4 w-16" /> {/* Variant ID */}
                </div>
              </div>
            </div>
          </div>
          <Bone className="h-4 w-32" /> {/* Date */}
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Contents Table Skeleton */}
      <div className="space-y-3">
        <Bone className="h-4 w-32" /> {/* Title */}
        <div className="rounded-xl border border-border/30 overflow-hidden">
          {/* Table Header */}
          <div className="bg-[var(--secondary)]/60 px-4 py-3 grid grid-cols-12">
            <div className="col-span-4"><Bone className="h-2.5 w-24" /></div>
            <div className="col-span-2 flex justify-center"><Bone className="h-2.5 w-12" /></div>
            <div className="col-span-3 flex justify-center"><Bone className="h-2.5 w-20" /></div>
            <div className="col-span-3 flex justify-end"><Bone className="h-2.5 w-16" /></div>
          </div>
          {/* Table Rows */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-12 items-center px-4 py-4 border-t border-border/20",
                i % 2 !== 0 && "bg-muted/15"
              )}
            >
              <div className="col-span-4 space-y-2">
                <Bone className="h-4 w-32" />
                <Bone className="h-2.5 w-24" />
              </div>
              <div className="col-span-2 flex justify-center">
                <Bone className="h-6 w-10 rounded-full" />
              </div>
              <div className="col-span-3 flex justify-center gap-2">
                <Bone className="h-5 w-16 rounded-full" />
                <Bone className="h-5 w-16 rounded-full" />
              </div>
              <div className="col-span-3 flex justify-end">
                <Bone className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
