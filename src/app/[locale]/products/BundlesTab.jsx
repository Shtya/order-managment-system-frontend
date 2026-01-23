// --- File: BundlesTab.jsx ---
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Edit2, Eye, QrCode, Trash2, Package, Tag, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

function normalizeAxiosError(err) {
  const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export default function BundlesTab({ t, searchDebounced, filters, onAskDelete, onOpenView, onExportRequest }) {
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
    fetchData({ page: 1, per_page: pager.per_page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced]);

  useEffect(() => {
    fetchData({ page: 1, per_page: 6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(() => {
    const na = t("common.na");
    return [
      { key: "id", header: t("table.id"), className: "font-semibold text-primary w-[80px]" },
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
            <span className="font-[Inter] text-gray-600 dark:text-slate-200 text-sm">{row.sku || na}</span>
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
            {row.created_at ? new Date(row.created_at).toLocaleDateString("ar-EG") : na}
          </div>
        )
      },
      {
        key: "actions",
        header: t("table.options"),
        className: "bg-white dark:bg-slate-900",
        cell: (row) => (
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
                      "border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white"
                    )}
                    onClick={() => onAskDelete?.(row.id, "bundles")}
                  >
                    <Trash2 size={16} className="transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>{t("actions.delete")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
                      "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white"
                    )}
                    onClick={() => router.push(`/bundles/edit/${row.id}`)}
                  >
                    <Edit2 size={16} className="transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>{t("actions.edit")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
                      "border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white"
                    )}
                    onClick={() => onOpenView?.(row, "bundles")}
                  >
                    <Eye size={16} className="transition-transform group-hover:scale-110" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>{t("actions.view")}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
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
    return new Date(d).toLocaleString("ar-EG");
  } catch {
    return String(d);
  }
}

function money(v, na) {
  if (v === null || v === undefined || v === "") return na;
  const n = Number(v);
  if (Number.isFinite(n)) return n.toLocaleString("ar-EG");
  return String(v);
}

export function BundleViewModal({ open, onOpenChange, bundle }) {
  const t = useTranslations("products");
  const na = t("common.na");

  const items = bundle?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="text-primary" size={18} />
            <span>{t("bundleModal.title")}</span>
          </DialogTitle>
        </DialogHeader>

        {!bundle ? (
          <div className="text-slate-500">{t("bundleModal.noData")}</div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                      {t("common.price")}: {money(bundle.price, na)}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <CalendarDays size={14} />
                  {formatDate(bundle.created_at, na)}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t("bundleModal.contents")} ({items.length})
              </div>

              {items.length === 0 ? (
                <div className="text-slate-500">{t("bundleModal.noItems")}</div>
              ) : (
                <div className="overflow-hidden rounded-2xl border">
                  <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-200 px-4 py-3">
                    <div className="col-span-5">{t("common.variant")}</div>
                    <div className="col-span-2 text-center">{t("common.qty")}</div>
                    <div className="col-span-3 text-center">{t("common.stock")}</div>
                    <div className="col-span-2 text-right">{t("common.attributes")}</div>
                  </div>

                  <div className="divide-y">
                    {items.map((it) => {
                      const v = it.variant;
                      const available = Math.max(0, (v?.stockOnHand ?? 0) - (v?.reserved ?? 0));
                      const attrs = v?.attributes ? Object.entries(v.attributes) : [];

                      return (
                        <div key={it.id} className="grid grid-cols-12 px-4 py-3 text-sm bg-white dark:bg-slate-900">
                          <div className="col-span-5">
                            <div className="font-semibold text-slate-900 dark:text-slate-50">
                              {v?.sku ?? `#${it.variantId}`}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t("common.variantId")}: {it.variantId} • {t("common.itemId")}: {it.id}
                            </div>
                          </div>

                          <div className="col-span-2 flex items-center justify-center">
                            <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20">
                              × {it.qty}
                            </Badge>
                          </div>

                          <div className="col-span-3 flex items-center justify-center gap-2">
                            <Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {t("common.onHand")}: {v?.stockOnHand ?? 0}
                            </Badge>
                            <Badge className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200">
                              {t("common.available")}: {available}
                            </Badge>
                          </div>

                          <div className="col-span-2 flex flex-wrap items-center justify-end gap-2">
                            {attrs.length === 0 ? (
                              <span className="text-slate-400">{na}</span>
                            ) : (
                              attrs.slice(0, 3).map(([k, val]) => (
                                <Badge
                                  key={k}
                                  className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                  {k}: {String(val)}
                                </Badge>
                              ))
                            )}

                            {attrs.length > 3 && (
                              <Badge className="rounded-full bg-slate-100 text-slate-600">+{attrs.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
