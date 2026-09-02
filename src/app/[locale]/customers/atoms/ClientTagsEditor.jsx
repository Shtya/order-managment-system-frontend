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

function unwrapClientTags(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list
    .map((row) => row?.tag || row)
    .filter((tag) => tag?.id);
}

function tagIdSet(tags) {
  return new Set((tags || []).map((tag) => tag.id).filter(Boolean));
}

export function ClientTagsEditor({ clientId, className }) {
  const t = useTranslations("clientTags");
  const { hasPermission } = useAuth();
  const { settings } = useOrdersSettings();
  const single = settings?.clientTagMode === "one";
  const canEdit =
    hasPermission("customer.update") || hasPermission("tags.update") || hasPermission("orders.confirm-incoming");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignable, setAssignable] = useState([]);
  const [selected, setSelected] = useState([]);
  const [baseline, setBaseline] = useState([]);

  const loadAssigned = useCallback(async () => {
    if (!clientId) return [];
    const res = await api.get(`/clients/${clientId}/tags`);
    const rows = Array.isArray(res.data)
      ? res.data
      : res.data?.records || res.data?.data || [];
    return unwrapClientTags(rows);
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      try {
        const tags = await loadAssigned();
        if (!cancelled) {
          setSelected(tags);
          setBaseline(tags);
        }
      } catch (_) {
        if (!cancelled) {
          setSelected([]);
          setBaseline([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, loadAssigned]);

  useEffect(() => {
    if (!open || !clientId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [tags, assignRes] = await Promise.all([
          loadAssigned(),
          api.get("/tags/assignable", { params: { target: "client" } }),
        ]);
        const list = Array.isArray(assignRes.data)
          ? assignRes.data
          : assignRes.data?.records || assignRes.data?.data || [];
        if (!cancelled) {
          setSelected(tags);
          setBaseline(tags);
          setAssignable(list);
        }
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, clientId, loadAssigned]);

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

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const confirm = async () => {
    if (!canEdit || !clientId || saving || !dirty) {
      close();
      return;
    }
    const toRemove = [...baselineIds].filter((id) => !selectedIds.has(id));
    const toAdd = selected.filter((tag) => !baselineIds.has(tag.id)).map((tag) => tag.id);
    setSaving(true);
    try {
      const res = await api.patch(`/clients/${clientId}/tags`, {
        addTagIds: toAdd,
        removeTagIds: toRemove,
      });
      const next = unwrapClientTags(res.data);
      setSelected(next);
      setBaseline(next);
      setOpen(false);
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn(className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-start"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Tags size={16} className="text-primary shrink-0" />
          {t("editor.tags")}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {selected.length ? (
            selected.map((tag) => (
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
            ))
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">
            {t("editor.empty")}
          </span>
          )}
        </div>
      </button>

      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags size={16} />
              {t("editor.title")}
            </DialogTitle>
            <DialogDescription>
              {single ? t("editor.oneModeHint") : t("editor.manyModeHint")}
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : !options.length ? (
            <p className="text-sm text-muted-foreground py-4">{t("editor.noneAssignable")}</p>
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
              {t("editor.cancel")}
            </GhostBtn>
            {canEdit && (
              <PrimaryBtn
                onClick={confirm}
                disabled={saving || loading || !dirty}
                loading={saving}
              >
                {saving ? t("editor.saving") : t("editor.confirm")}
              </PrimaryBtn>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
