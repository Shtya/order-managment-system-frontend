"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Loader2, Tags } from "lucide-react";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import { GhostBtn, PrimaryBtn } from "@/components/atoms/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function unwrapOrderTags(order) {
  const rows = Array.isArray(order?.orderTags)
    ? order.orderTags
    : Array.isArray(order?.tags)
      ? order.tags
      : [];
  return rows
    .map((row) => row?.tag || row)
    .filter((tag) => tag?.id);
}

function tagIdSet(tags) {
  return new Set((tags || []).map((tag) => tag.id).filter(Boolean));
}

export function OrderTagChips({ tags, className, max = 3 }) {
  const list = Array.isArray(tags) ? tags.filter((tag) => tag?.id) : [];
  if (!list.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const visible = list.slice(0, max);
  const extra = list.length - visible.length;
  return (
    <div className={cn("flex flex-wrap items-center gap-1 max-w-[180px]", className)}>
      {visible.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold truncate"
          style={{
            backgroundColor: `${tag.color || "#6C5CE7"}22`,
            color: tag.color || "#6C5CE7",
            border: `1px solid ${tag.color || "#6C5CE7"}55`,
          }}
          title={tag.name}
        >
          {tag.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[11px] font-semibold text-muted-foreground">+{extra}</span>
      )}
    </div>
  );
}

export function OrderTagsDialog({ order, open, onClose, onUpdated }) {
  const t = useTranslations("orders");
  const { hasPermission } = useAuth();
  const { settings } = useOrdersSettings();
  const single = settings?.orderTagMode === "one";
  const canEdit =
    hasPermission("orders.update") || hasPermission("orders.updateTags");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignable, setAssignable] = useState([]);
  const [selected, setSelected] = useState([]);
  const [baseline, setBaseline] = useState([]);

  useEffect(() => {
    if (!open || !order?.id) return;
    const current = unwrapOrderTags(order);
    setSelected(current);
    setBaseline(current);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/tags/assignable");
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.records || res.data?.data || [];
        if (!cancelled) setAssignable(list);
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, order?.id]);

  const options = useMemo(() => {
    const map = new Map();
    assignable.forEach((tag) => {
      if (tag?.id) map.set(tag.id, tag);
    });
    baseline.forEach((tag) => {
      if (tag?.id && !map.has(tag.id)) map.set(tag.id, tag);
    });
    return Array.from(map.values());
  }, [assignable, baseline]);

  const assignableIds = useMemo(
    () => new Set(assignable.map((tag) => tag.id)),
    [assignable],
  );
  const selectedIds = useMemo(() => tagIdSet(selected), [selected]);
  const baselineIds = useMemo(() => tagIdSet(baseline), [baseline]);

  const dirty = useMemo(() => {
    if (selectedIds.size !== baselineIds.size) return true;
    for (const id of selectedIds) {
      if (!baselineIds.has(id)) return true;
    }
    return false;
  }, [baselineIds, selectedIds]);

  const applyRows = useCallback(
    (data) => {
      const rows = Array.isArray(data)
        ? data
        : data?.records || data?.data || [];
      const nextTags = unwrapOrderTags({ orderTags: rows });
      setSelected(nextTags);
      setBaseline(nextTags);
      onUpdated?.(rows, nextTags);
    },
    [onUpdated],
  );

  const close = () => {
    if (saving) return;
    onClose?.();
  };

  const toggle = (tag) => {
    if (!canEdit || saving) return;
    if (!assignableIds.has(tag.id)) return;
    const checked = selectedIds.has(tag.id);
    if (single) {
      setSelected(checked ? [] : [tag]);
      return;
    }
    setSelected((prev) =>
      checked ? prev.filter((item) => item.id !== tag.id) : [...prev, tag],
    );
  };

  const confirm = async () => {
    if (!canEdit || !order?.id || saving || !dirty) {
      close();
      return;
    }
    const toRemove = [...baselineIds].filter((id) => !selectedIds.has(id));
    const toAdd = selected.filter((tag) => !baselineIds.has(tag.id));
    setSaving(true);
    try {
      if (single && toAdd[0]) {
        await api.post(`/orders/${order.id}/tags`, { tagId: toAdd[0].id });
      } else if (single && toRemove[0]) {
        await api.delete(`/orders/${order.id}/tags/${toRemove[0]}`);
      } else {
        await Promise.all([
          ...toRemove.map((tagId) => api.delete(`/orders/${order.id}/tags/${tagId}`)),
          ...toAdd.map((tag) => api.post(`/orders/${order.id}/tags`, { tagId: tag.id })),
        ]);
      }
      applyRows(selected.map((tag) => ({ tag, tagId: tag.id })));
      onClose?.();
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags size={16} />
            {t("tags.title")}
          </DialogTitle>
          <DialogDescription>
            {single ? t("tags.oneModeHint") : t("tags.manyModeHint")}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : !options.length ? (
          <p className="text-sm text-muted-foreground py-4">{t("tags.empty")}</p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1">
            {options.map((tag) => {
              const checked = selectedIds.has(tag.id);
              const canAssign = assignableIds.has(tag.id);
              const disabled = !canEdit || saving || !canAssign;
              return (
                <label
                  key={tag.id}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start text-sm",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted",
                    checked && "bg-muted/70",
                  )}
                  onClick={(e) => {
                    if (!single) return;
                    e.preventDefault();
                    if (!disabled) toggle(tag);
                  }}
                >
                  {single ? (
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border border-border shrink-0",
                        checked && "border-primary",
                      )}
                    >
                      {checked && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(tag)}
                      className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed"
                    />
                  )}
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color || "#6C5CE7" }}
                  />
                  <span className="truncate">{tag.name}</span>
                </label>
              );
            })}
          </div>
        )}
        <DialogFooter className="pt-2">
          <GhostBtn onClick={close} disabled={saving}>
            {t("tags.cancel")}
          </GhostBtn>
          {canEdit && (
            <PrimaryBtn onClick={confirm} disabled={saving || loading || !dirty} loading={saving}>
              {saving ? t("tags.saving") : t("tags.confirm")}
            </PrimaryBtn>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
