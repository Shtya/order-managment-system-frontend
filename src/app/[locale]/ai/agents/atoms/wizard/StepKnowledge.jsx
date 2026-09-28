"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Bone } from "@/components/atoms/BannerSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import KnowledgeFormDialog from "../KnowledgeFormDialog";

const LIST_LIMIT = 100;
const SKELETON_ROWS = 3;

export default function StepKnowledge({ watch, setValue }) {
  const t = useTranslations("agents");
  const selectedIds = watch("knowledgeIds") || [];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEditing, setDialogEditing] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const searchTimer = useRef(null);
  const idsBeforeCreate = useRef([]);

  const fetchList = async (searchValue = "") => {
    setLoading(true);
    try {
      const params = { limit: LIST_LIMIT };
      if (searchValue?.trim()) params.search = searchValue.trim();
      const res = await api.get("/agents/knowledge", { params });
      const records = Array.isArray(res.data?.records) ? res.data.records : [];
      setItems(records);
      return records;
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("knowledge.toast.fetchFailed"));
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) return;
    fetchList(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const visible = useMemo(
    () => items.filter((item) => filter === "all" || selectedIds.includes(item.id)),
    [items, filter, selectedIds],
  );

  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const toggleSelect = (id, checked) => {
    const next = checked
      ? [...new Set([...selectedIds, id])]
      : selectedIds.filter((itemId) => itemId !== id);
    setValue("knowledgeIds", next, { shouldDirty: true });
  };

  const selectAll = () => {
    setValue(
      "knowledgeIds",
      [...new Set([...selectedIds, ...items.map((item) => item.id)])],
      { shouldDirty: true },
    );
  };

  const unselectAll = () => {
    setValue("knowledgeIds", [], { shouldDirty: true });
  };

  const openCreate = () => {
    idsBeforeCreate.current = items.map((item) => item.id);
    setDialogEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setDialogEditing(item);
    setDialogOpen(true);
  };

  const handleDialogSuccess = async () => {
    const records = await fetchList(debouncedSearch);
    if (!dialogEditing) {
      const before = new Set(idsBeforeCreate.current);
      const freshIds = records.filter((row) => !before.has(row.id)).map((row) => row.id);
      if (freshIds.length) {
        const current = watch("knowledgeIds") || [];
        setValue("knowledgeIds", [...new Set([...current, ...freshIds])], {
          shouldDirty: true,
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/agents/knowledge/${deleting.id}`);
      setItems((prev) => prev.filter((row) => row.id !== deleting.id));
      setValue(
        "knowledgeIds",
        selectedIds.filter((id) => id !== deleting.id),
        { shouldDirty: true },
      );
      toast.success(t("knowledge.toast.deleted"));
      setDeleteOpen(false);
      setDeleting(null);
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("knowledge.toast.deleteFailed"));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("knowledge.table.searchPlaceholder")}
          className="rounded-xl h-[46px] flex-1"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-[46px] rounded-xl sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("knowledge.assign.filterAll")}</SelectItem>
            <SelectItem value="selected">{t("knowledge.assign.filterSelected")}</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" onClick={openCreate}>
          <Plus size={16} />
          {t("knowledge.actions.new")}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {t("knowledge.assign.selected", { count: selectedIds.length })}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {!allSelected && items.length > 0 && (
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {t("knowledge.assign.selectAll")}
            </button>
          )}
          {allSelected && (
            <button
              type="button"
              onClick={unselectAll}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {t("knowledge.assign.unselectAll")}
            </button>
          )}
        </div>
      </div>

      <div className="border border-border rounded-xl max-h-[320px] overflow-y-auto divide-y divide-border">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 p-3">
                <Bone className="h-4 w-4 mt-1 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-2/5" />
                  <Bone className="h-3 w-full" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Bone className="h-8 w-8" />
                  <Bone className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length ? (
          visible.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-muted/50">
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={(checked) => toggleSelect(item.id, checked === true)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.content}
                </p>
              </div>
              {!item.isActive && (
                <Badge variant="outline" className="shrink-0">
                  {t("status.inactive")}
                </Badge>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(item)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => {
                    setDeleting(item);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-10">
            {t("knowledge.assign.empty")}
          </p>
        )}
      </div>

      <KnowledgeFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setDialogEditing(null);
        }}
        knowledge={dialogEditing}
        onSuccess={handleDialogSuccess}
        showAssign={false}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleting(null);
        }}
        title={t("knowledge.delete.title")}
        description={t("knowledge.delete.desc", { title: deleting?.title || "—" })}
        confirmText={t("knowledge.delete.confirm")}
        cancelText={t("knowledge.delete.cancel")}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
