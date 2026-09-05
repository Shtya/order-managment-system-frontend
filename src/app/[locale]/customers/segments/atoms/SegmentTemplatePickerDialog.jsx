"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { LayoutTemplate, Loader2 } from "lucide-react";
import Button_, { GhostBtn } from "@/components/atoms/Button";
import { Bone } from "@/components/atoms/BannerSkeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";

function unwrapTemplates(data) {
  const body = data?.records ? data : data?.data || {};
  return {
    records: body.records || [],
    hasMore: !!body.hasMore,
    nextCursor: body.nextCursor || null,
  };
}

export default function SegmentTemplatePickerDialog({ open, onOpenChange, onSelect }) {
  const t = useTranslations("customerSegments");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);

  const fetchTemplates = useCallback(async ({ next = null, append = false } = {}) => {
    const params = { limit: 12, sortBy: "createdAt", sortDir: "DESC" };
    if (next?.value != null && next?.id != null) {
      params["cursor[value]"] = next.value;
      params["cursor[id]"] = next.id;
    }
    const res = await api.get("/client-segment-templates", { params });
    const { records, hasMore: more, nextCursor } = unwrapTemplates(res.data);
    setTemplates((prev) => (append ? [...prev, ...records] : records));
    setHasMore(more);
    setCursor(nextCursor);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setTemplates([]);
      setHasMore(false);
      setCursor(null);
      try {
        await fetchTemplates({ next: null, append: false });
      } catch (error) {
        if (!cancelled) toast.error(normalizeAxiosError(error) || t("toast.templatesFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchTemplates, open, t]);

  const loadMore = async () => {
    if (!hasMore || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchTemplates({ next: cursor, append: true });
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.templatesFailed"));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUse = async (tpl) => {
    let row = tpl;
    if (!tpl.audienceFilter) {
      try {
        const res = await api.get(`/client-segment-templates/${tpl.id}`);
        row = res.data?.id ? res.data : res.data?.data || res.data;
      } catch (error) {
        toast.error(normalizeAxiosError(error) || t("toast.templatesFailed"));
        return;
      }
    }
    onSelect?.(row);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <LayoutTemplate size={20} />
            </div>
            {t("templates.title")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            {t("templates.subtitle")}
          </p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-card">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border p-4 space-y-3">
                  <Bone className="h-4 w-40 max-w-full" />
                  <Bone className="h-3 w-full" />
                  <Bone className="h-3 w-2/3" />
                  <Bone className="h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : templates.length ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 max-w-full"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{tpl.name || "—"}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                        {tpl.description || t("templates.noDescription")}
                      </p>
                    </div>
                    <Button_
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full mt-auto"
                      label={t("templates.use")}
                      permission="client-segments.create"
                      onClick={() => handleUse(tpl)}
                    />
                  </div>
                ))}
              </div>
              {hasMore && cursor ? (
                <Button_
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  label={t("templates.loadMore")}
                  permission="client-segments.read"
                  disabled={loadingMore}
                  icon={loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                  onClick={loadMore}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("templates.empty")}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-4 md:px-6 py-4 border-t bg-card shrink-0">
          <GhostBtn onClick={() => onOpenChange?.(false)}>{t("templates.close")}</GhostBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
