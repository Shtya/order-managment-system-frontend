"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileDown,
  Loader2,
  MousePointerClick,
  Pencil,
  Play,
  PlusCircle,
  Settings,
  Tags,
  Trash2,
  Workflow,
} from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useExport } from "@/hook/useExport";
import { setDocumentTitle } from "@/utils/documentTitle";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "@/components/atoms/Pageheader";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import Button_ from "@/components/atoms/Button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagFormDialog } from "./atoms/TagFormDialog";
import { AutomationFormDialog } from "./atoms/AutomationFormDialog";
import { TagSettingsDialog } from "./atoms/TagSettingsDialog";
import { unwrapList } from "./atoms/condition-fields";

const DEFAULT_TAG_FILTERS = { isActive: "all", allowManualAssignment: "all" };
const DEFAULT_AUTOMATION_FILTERS = { isEnabled: "all", tagId: "all" };

export default function TagsPage() {
  const tc = useTranslations("common");
  const t = useTranslations("tags");
  const { handleExport, exportLoading } = useExport();

  const [viewMode, setViewMode] = useState("tags");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tagOptions, setTagOptions] = useState([]);

  const [filters, setFilters] = useState(DEFAULT_TAG_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_TAG_FILTERS);

  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });

  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formReadOnly, setFormReadOnly] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setDocumentTitle(t("title"));
  }, [t]);


  const viewModes = useMemo(
    () => [
      { id: "tags", label: t("tabs.tags"), title: t("tabs.tags"), icon: Tags },
      {
        id: "automations",
        label: t("tabs.automations"),
        title: t("tabs.automations"),
        icon: Workflow,
      },
    ],
    [t],
  );

  const fetchTagOptions = useCallback(async () => {
    try {
      const res = await api.get("/tags", { params: { page: 1, limit: 100 } });
      setTagOptions(unwrapList(res.data));
    } catch (_) {
      setTagOptions([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/tags/stats");
      setStats({
        tags: res.data?.tags ?? 0,
        activeTags: res.data?.activeTags ?? 0,
        manualTags: res.data?.manualTags ?? 0,
        automations: res.data?.automations ?? 0,
        activeAutomations: res.data?.activeAutomations ?? 0,
      });
    } catch (_) {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const buildParams = useCallback(
    (page, per_page, mode, searchValue, filterState) => {
      const params = { page, limit: per_page };
      if (searchValue?.trim()) params.search = searchValue.trim();
      if (mode === "tags") {
        if (filterState.isActive !== "all") params.isActive = filterState.isActive;
        if (filterState.allowManualAssignment !== "all") {
          params.allowManualAssignment = filterState.allowManualAssignment;
        }
      } else {
        if (filterState.isEnabled !== "all") params.isEnabled = filterState.isEnabled;
        if (filterState.tagId && filterState.tagId !== "all") params.tagId = filterState.tagId;
      }
      return params;
    },
    [],
  );

  const fetchData = useCallback(
    async (
      page = 1,
      per_page = 12,
      {
        mode = viewMode,
        searchValue = appliedSearch,
        filterState = appliedFilters,
      } = {},
    ) => {
      setLoading(true);
      try {
        const endpoint = mode === "tags" ? "/tags" : "/tag-automations";
        const res = await api.get(endpoint, {
          params: buildParams(page, per_page, mode, searchValue, filterState),
        });
        setPager({
          total_records: res.data.total_records ?? 0,
          current_page: res.data.current_page ?? 1,
          per_page: res.data.per_page ?? per_page,
          records: unwrapList(res.data),
        });
      } catch (e) {
        toast.error(normalizeAxiosError(e));
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, appliedSearch, buildParams, viewMode],
  );

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSearch("");
    setAppliedSearch("");
    const nextFilters = mode === "tags" ? DEFAULT_TAG_FILTERS : DEFAULT_AUTOMATION_FILTERS;
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPager({
      total_records: 0,
      current_page: 1,
      per_page: 12,
      records: [],
    });
    const url = new URL(window.location.href);
    url.searchParams.set("tab", mode);
    window.history.replaceState(null, "", url.toString());
    fetchData(1, 12, { mode, searchValue: "", filterState: nextFilters });
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setAppliedSearch(search);
    fetchData(1, pager.per_page, { searchValue: search, filterState: filters });
  };

  const onExport = useCallback(async () => {
    await handleExport({
      endpoint: viewMode === "tags" ? "/tags/export" : "/tag-automations/export",
      params: buildParams(1, 100000, viewMode, appliedSearch, appliedFilters),
      filename: `${viewMode === "tags" ? "tags" : "tag_automations"}_${Date.now()}.xlsx`,
    });
  }, [appliedFilters, appliedSearch, buildParams, handleExport, viewMode]);

  const hasActiveFilters = useMemo(() => {
    if (viewMode === "tags") {
      return (
        appliedFilters.isActive !== "all" ||
        appliedFilters.allowManualAssignment !== "all"
      );
    }
    return appliedFilters.isEnabled !== "all" || appliedFilters.tagId !== "all";
  }, [appliedFilters, viewMode]);

  useEffect(() => {
    fetchData(1, 12, {
      mode: "tags",
      searchValue: "",
      filterState: DEFAULT_TAG_FILTERS,
    });
    fetchStats();
    fetchTagOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const afterMutate = useCallback(() => {
    fetchData(pager.current_page, pager.per_page);
    fetchStats();
    fetchTagOptions();
  }, [fetchData, fetchStats, fetchTagOptions, pager.current_page, pager.per_page]);

  const confirmDelete = useCallback(async () => {
    if (!selected?.id) return;
    setDeleting(true);
    try {
      const endpoint =
        viewMode === "tags" ? `/tags/${selected.id}` : `/tag-automations/${selected.id}`;
      await api.delete(endpoint);
      setDeleteOpen(false);
      toast.success(t("toast.deleted"));
      afterMutate();
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setDeleting(false);
    }
  }, [selected, viewMode, afterMutate, t]);

  const tagChip = (tag) => {
    if (!tag) return "—";
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full border border-border"
          style={{ backgroundColor: tag.color || "#6C5CE7" }}
        />
        <span className="font-medium">{tag.name}</span>
      </span>
    );
  };

  const columns = useMemo(() => {
    if (viewMode === "tags") {
      return [
        {
          key: "name",
          header: t("columns.name"),
          cell: (row) => tagChip(row),
        },
        {
          key: "description",
          header: t("columns.description"),
          cell: (row) => (
            <span className="text-sm text-[var(--muted-foreground)] line-clamp-2">
              {row.description || "—"}
            </span>
          ),
        },
        {
          key: "isActive",
          header: t("columns.active"),
          cell: (row) => (
            <Badge variant={row.isActive ? "secondary" : "outline"}>
              {row.isActive ? t("filters.active") : t("filters.inactive")}
            </Badge>
          ),
        },
        {
          key: "allowManualAssignment",
          header: t("columns.manual"),
          cell: (row) => (
            <Badge variant={row.allowManualAssignment ? "secondary" : "outline"}>
              {row.allowManualAssignment ? t("filters.active") : t("filters.inactive")}
            </Badge>
          ),
        },
        {
          key: "priority",
          header: t("columns.priority"),
          cell: (row) => <span className="tabular-nums">{row.priority ?? 0}</span>,
        },
        {
          key: "actions",
          header: tc("actions"),
          cell: (row) => (
            <ActionButtons
              row={row}
              actions={[
                {
                  icon: <Pencil size={16} />,
                  tooltip: t("actions.edit"),
                  onClick: () => {
                    setSelected(row);
                    setFormReadOnly(false);
                    setFormOpen(true);
                  },
                  variant: "primary",
                  permission: "tags.update",
                },
                {
                  icon: <Trash2 size={16} />,
                  tooltip: t("actions.delete"),
                  onClick: () => {
                    setSelected(row);
                    setDeleteOpen(true);
                  },
                  variant: "red",
                  permission: "tags.delete",
                },
              ]}
            />
          ),
        },
      ];
    }

    return [
      {
        key: "name",
        header: t("columns.name"),
        cell: (row) => <span className="font-medium">{row.name || "—"}</span>,
      },
      {
        key: "tag",
        header: t("columns.tag"),
        cell: (row) => tagChip(row.tag),
      },
      {
        key: "isEnabled",
        header: t("columns.enabled"),
        cell: (row) => (
          <Badge variant={row.isEnabled ? "secondary" : "outline"}>
            {row.isEnabled ? t("filters.enabled") : t("filters.disabled")}
          </Badge>
        ),
      },
      {
        key: "logic",
        header: t("columns.logic"),
        cell: (row) =>
          row.conditions?.logic === "OR" ? t("dialog.logicOr") : t("dialog.logicAnd"),
      },
      {
        key: "rules",
        header: t("columns.rules"),
        cell: (row) => (
          <span className="tabular-nums">{row.conditions?.rules?.length ?? 0}</span>
        ),
      },
      {
        key: "actions",
        header: tc("actions"),
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Eye size={16} />,
                tooltip: t("actions.view"),
                onClick: () => {
                  setSelected(row);
                  setFormReadOnly(true);
                  setFormOpen(true);
                },
                variant: "primary",
                permission: "tag-automations.read",
              },
              {
                icon: <Pencil size={16} />,
                tooltip: t("actions.edit"),
                onClick: () => {
                  setSelected(row);
                  setFormReadOnly(false);
                  setFormOpen(true);
                },
                variant: "primary",
                permission: "tag-automations.update",
              },
              {
                icon: <Trash2 size={16} />,
                tooltip: t("actions.delete"),
                onClick: () => {
                  setSelected(row);
                  setDeleteOpen(true);
                },
                variant: "red",
                permission: "tag-automations.delete",
              },
            ]}
          />
        ),
      },
    ];
  }, [t, tc, viewMode]);

  const headerStats = useMemo(
    () => [
      { name: t("stats.tags"), value: stats?.tags ?? 0, icon: Tags, sortOrder: 0 },
      {
        name: t("stats.activeTags"),
        value: stats?.activeTags ?? 0,
        icon: CheckCircle2,
        sortOrder: 1,
      },
      {
        name: t("stats.manualTags"),
        value: stats?.manualTags ?? 0,
        icon: MousePointerClick,
        sortOrder: 2,
      },
      {
        name: t("stats.automations"),
        value: stats?.automations ?? 0,
        icon: Workflow,
        sortOrder: 3,
      },
      {
        name: t("stats.activeAutomations"),
        value: stats?.activeAutomations ?? 0,
        icon: Play,
        sortOrder: 4,
      },
    ],
    [stats, t],
  );

  return (
    <div className="min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.orders"), href: "/orders" },
          { name: t("title") },
        ]}
        stats={headerStats}
        statsLoading={statsLoading}
        items={viewModes}
        active={viewMode}
        setActive={handleViewModeChange}
        buttons={
          <div className="flex items-center gap-2">
            <Button_
              size="sm"
              label={t("actions.settings")}
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              icon={<Settings size={18} />}
              permission="order.updateSettings"
            />
            <Button_
              size="sm"
              label={viewMode === "tags" ? t("actions.addTag") : t("actions.addAutomation")}
              variant="solid"
              onClick={() => {
                setSelected(null);
                setFormReadOnly(false);
                setFormOpen(true);
              }}
              icon={<PlusCircle size={18} />}
              permission={viewMode === "tags" ? "tags.create" : "tag-automations.create"}
            />
          </div>
        }
      />

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        labels={{
          searchPlaceholder:
            viewMode === "tags" ? t("table.searchTags") : t("table.searchAutomations"),
          filter: tc("filter"),
          apply: tc("apply"),
          total: tc("total"),
          limit: tc("limit"),
          emptyTitle:
            viewMode === "tags" ? t("table.emptyTagsTitle") : t("table.emptyAutomationsTitle"),
          emptySubtitle:
            viewMode === "tags"
              ? t("table.emptyTagsSubtitle")
              : t("table.emptyAutomationsSubtitle"),
        }}
        filters={
          <>
            {viewMode === "tags" ? (
              <>
                <FilterField label={t("filters.status")}>
                  <Select
                    value={filters.isActive}
                    onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                      <SelectValue placeholder={t("filters.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tc("all")}</SelectItem>
                      <SelectItem value="true">{t("filters.active")}</SelectItem>
                      <SelectItem value="false">{t("filters.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>
                <FilterField label={t("filters.manual")}>
                  <Select
                    value={filters.allowManualAssignment}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, allowManualAssignment: v }))
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                      <SelectValue placeholder={t("filters.manual")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tc("all")}</SelectItem>
                      <SelectItem value="true">{t("filters.allowed")}</SelectItem>
                      <SelectItem value="false">{t("filters.notAllowed")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>
              </>
            ) : (
              <>
                <FilterField label={t("filters.enabled")}>
                  <Select
                    value={filters.isEnabled}
                    onValueChange={(v) => setFilters((f) => ({ ...f, isEnabled: v }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tc("all")}</SelectItem>
                      <SelectItem value="true">{t("filters.enabled")}</SelectItem>
                      <SelectItem value="false">{t("filters.disabled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>
                <FilterField label={t("filters.tag")}>
                  <Select
                    value={filters.tagId}
                    onValueChange={(v) => setFilters((f) => ({ ...f, tagId: v }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tc("all")}</SelectItem>
                      {tagOptions.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
              </>
            )}
          </>
        }
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        actions={[
          {
            key: "export",
            label: t("actions.export"),
            icon: exportLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileDown size={15} />
            ),
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: viewMode === "tags" ? "tags.read" : "tag-automations.read",
          },
        ]}
        columns={columns}
        data={pager.records}
        isLoading={loading}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        onPageChange={({ page, per_page }) => fetchData(page, per_page)}
      />

      {formOpen && viewMode === "tags" && (
        <TagFormDialog
          tag={selected}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={afterMutate}
        />
      )}

      {formOpen && viewMode === "automations" && (
        <AutomationFormDialog
          automation={selected}
          open={formOpen}
          readOnly={formReadOnly}
          onClose={() => {
            setFormOpen(false);
            setFormReadOnly(false);
          }}
          onSaved={afterMutate}
          tags={tagOptions}
        />
      )}

      <TagSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={viewMode === "tags" ? t("delete.tagTitle") : t("delete.automationTitle")}
        description={viewMode === "tags" ? t("delete.tagDesc") : t("delete.automationDesc")}
        confirmText={t("delete.confirm")}
        cancelText={t("delete.cancel")}
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
