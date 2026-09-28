"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormatter, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  BookOpen,
  Bot,
  Edit,
  FileDown,
  Loader2,
  Plus,
  Power,
  Trash2,
  UserCheck,
} from "lucide-react";
import PageHeader from "@/components/atoms/Pageheader";
import Table, { FilterField } from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import Button_ from "@/components/atoms/Button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { useExport } from "@/hook/useExport";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { setDocumentTitle } from "@/utils/documentTitle";
import { useRouter } from "@/i18n/navigation";

const DEFAULT_FILTERS = { status: "all", language: "all" };
const DEFAULT_KNOWLEDGE_FILTERS = { status: "all" };
const LANGUAGES = ["auto", "arabic", "english"];

const STAT_CARDS = [
  { key: "total", icon: Bot, sortOrder: 0 },
  { key: "active", icon: UserCheck, sortOrder: 1 },
];

const KNOWLEDGE_STAT_CARDS = [
  { key: "total", icon: BookOpen, sortOrder: 0 },
  { key: "active", icon: UserCheck, sortOrder: 1 },
];

import KnowledgeFormDialog from "./atoms/KnowledgeFormDialog";

const ASSIGN_LIST_LIMIT = 100;

function KnowledgeAssignDialog({ open, onOpenChange, agent, onSuccess }) {
  const t = useTranslations("agents");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!open || !agent?.id) return;
    setSearch("");
    setDebouncedSearch("");
    setFilter("all");
    setSelected([]);
    setItems([]);
    let cancelled = false;
    const loadAgent = async () => {
      try {
        const res = await api.get(`/agents/${agent.id}`);
        if (!cancelled) setSelected(res.data?.knowledgeIds || []);
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeAxiosError(error) || t("knowledge.toast.fetchFailed"));
        }
      }
    };
    loadAgent();
    return () => {
      cancelled = true;
    };
  }, [open, agent?.id, t]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchList = async () => {
      setLoading(true);
      try {
        const params = { limit: ASSIGN_LIST_LIMIT };
        if (debouncedSearch?.trim()) params.search = debouncedSearch.trim();
        const res = await api.get("/agents/knowledge", { params });
        if (!cancelled) {
          setItems(Array.isArray(res.data?.records) ? res.data.records : []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeAxiosError(error) || t("knowledge.toast.fetchFailed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchList();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch, t]);

  const visible = items.filter(
    (item) => filter === "all" || selected.includes(item.id),
  );

  const allSelected = items.length > 0 && items.every((item) => selected.includes(item.id));

  const toggle = (id, checked) => {
    setSelected((prev) => {
      if (checked) {
        if (prev.includes(id) || prev.length >= ASSIGN_LIST_LIMIT) return prev;
        return [...prev, id];
      }
      return prev.filter((itemId) => itemId !== id);
    });
  };

  const selectAll = () => {
    setSelected(items.map((item) => item.id).slice(0, ASSIGN_LIST_LIMIT));
  };

  const unselectAll = () => {
    setSelected([]);
  };

  const onSave = async () => {
    if (!agent?.id) return;
    setSaving(true);
    try {
      await api.post(`/agents/${agent.id}/knowledge/reset`, {
        knowledgeIds: selected,
      });
      toast.success(t("knowledge.assign.saved"));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("knowledge.toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <BookOpen size={20} />
            </div>
            {t("knowledge.assign.title")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            {t("knowledge.assign.desc")}
          </p>
        </DialogHeader>
        <div className="p-4 md:p-6 bg-card space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("knowledge.assign.searchPlaceholder")}
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
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t("knowledge.assign.selected", { count: selected.length })}
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
          <div className="border border-border rounded-sm max-h-[320px] overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : visible.length ? (
              visible.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={(checked) => toggle(item.id, checked === true)}
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
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                {t("knowledge.assign.empty")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-4 border-t border-border bg-card">
          <span className="text-xs text-muted-foreground">
            {t("knowledge.assign.reusable")}
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t("knowledge.assign.cancel")}
            </Button>
            <Button type="button" onClick={onSave} disabled={saving || loading}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("knowledge.assign.save")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const AgentsTab = forwardRef(function AgentsTab(
  { activeTab, onTabChange, tabItems },
  ref,
) {
  const tc = useTranslations("common");
  const t = useTranslations("agents");
  const format = useFormatter();
  const router = useRouter();
  const { handleExport, exportLoading } = useExport();

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [togglingAgent, setTogglingAgent] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const searchTimer = useRef(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningAgent, setAssigningAgent] = useState(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/agents/stats");
      setStats(res.data || {});
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const buildParams = useCallback(
    (p, l, filterState = appliedFilters, searchValue = debouncedSearch) => {
      const params = { page: p, limit: l };
      if (searchValue?.trim()) params.search = searchValue.trim();
      if (filterState.status === "active") params.isActive = "true";
      if (filterState.status === "inactive") params.isActive = "false";
      if (filterState.language && filterState.language !== "all") {
        params.language = filterState.language;
      }
      return params;
    },
    [appliedFilters, debouncedSearch],
  );

  const fetchAgents = useCallback(
    async ({
      page: p = page,
      limit: l = limit,
      filterState = appliedFilters,
      searchValue = debouncedSearch,
    } = {}) => {
      setLoading(true);
      try {
        const res = await api.get("/agents", {
          params: buildParams(p, l, filterState, searchValue),
        });
        setRecords(res.data?.records || []);
        setTotalRecords(Number(res.data?.total_records || 0));
        setPage(Number(res.data?.current_page || p));
        setLimit(Number(res.data?.per_page || l));
      } catch (error) {
        toast.error(normalizeAxiosError(error) || t("toast.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, buildParams, debouncedSearch, limit, page, t],
  );

  useEffect(() => {
    fetchAgents({ page: 1, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
    fetchAgents({ page: 1, limit, filterState: filters });
  };

  const hasActiveFilters = useMemo(
    () => appliedFilters.status !== "all" || appliedFilters.language !== "all",
    [appliedFilters],
  );

  const statsCards = useMemo(
    () =>
      STAT_CARDS.map(({ key, icon, sortOrder }) => ({
        key,
        name: t(`stats.${key}`),
        value: stats?.[key] ?? 0,
        icon,
        sortOrder,
      })),
    [stats, t],
  );

  const pagination = useMemo(
    () => ({
      total_records: totalRecords,
      current_page: page,
      per_page: limit,
    }),
    [totalRecords, page, limit],
  );

  const formatDate = (value) => {
    if (!value) return "—";
    return format.dateTime(new Date(value), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handlePageChange = ({ page: p, per_page: l }) => {
    setPage(p);
    setLimit(l);
    fetchAgents({ page: p, limit: l });
  };

  const refresh = useCallback(() => {
    fetchAgents({ page, limit });
    fetchStats();
  }, [fetchAgents, fetchStats, limit, page]);

  const openCreate = () => {
    router.push("/ai/agents/new");
  };

  const openEdit = (agent) => {
    router.push(`/ai/agents/${agent.id}/edit`);
  };

  const openAssign = (agent) => {
    setAssigningAgent(agent);
    setAssignOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!togglingAgent) return;
    setToggleLoading(true);
    try {
      await api.patch(`/agents/${togglingAgent.id}/toggle-active`);
      toast.success(t("toast.statusUpdated"));
      setToggleOpen(false);
      setTogglingAgent(null);
      refresh();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.fetchFailed"));
    } finally {
      setToggleLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAgent) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/agents/${deletingAgent.id}`);
      toast.success(t("toast.deleted"));
      setDeleteOpen(false);
      setDeletingAgent(null);
      refresh();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.deleteFailed"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportParams = buildParams(1, 10000);
  delete exportParams.page;
  delete exportParams.limit;

  const rowActions = (row) => [
    {
      icon: <Edit />,
      tooltip: t("actions.edit"),
      variant: "primary",
      permission: "agents.update",
      onClick: () => openEdit(row),
    },
    {
      icon: <BookOpen size={16} />,
      tooltip: t("knowledge.assign.action"),
      variant: "primary",
      permission: "agents.update",
      onClick: () => openAssign(row),
    },
    {
      icon: <Power size={16} />,
      tooltip: row.isActive ? t("actions.disable") : t("actions.enable"),
      variant: row.isActive ? "orange" : "emerald",
      permission: "agents.update",
      onClick: () => {
        setTogglingAgent(row);
        setToggleOpen(true);
      },
    },
    {
      icon: <Trash2 />,
      tooltip: t("actions.delete"),
      variant: "red",
      permission: "agents.delete",
      onClick: () => {
        setDeletingAgent(row);
        setDeleteOpen(true);
      },
    },
  ];

  const columns = [
    {
      key: "name",
      header: t("columns.name"),
      className: "min-w-[180px]",
      cell: (row) => (
        <span className="block text-sm font-semibold text-foreground truncate">
          {row.name || "—"}
        </span>
      ),
    },
    {
      key: "language",
      header: t("columns.language"),
      cell: (row) => (
        <span className="text-sm">
          {t(`languages.${row.language || "auto"}`)}
        </span>
      ),
    },
    {
      key: "provider",
      header: t("columns.provider"),
      cell: (row) => (
        <span className="text-sm">
          {row.responseProvider?.name || t("provider.auto")}
        </span>
      ),
    },
    {
      key: "knowledge",
      header: t("columns.knowledge"),
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {row.knowledgeCount ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      cell: (row) => (
        <Badge variant={row.isActive ? "secondary" : "outline"}>
          {t(`status.${row.isActive ? "active" : "inactive"}`)}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: t("columns.createdAt"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("columns.actions"),
      className: "md:sticky md:z-20",
      cell: (row) => <ActionButtons row={row} actions={rowActions(row)} />,
    },
  ];

  useImperativeHandle(
    ref,
    () => ({
      onEnter: () => {
        refresh();
      },
    }),
    [refresh],
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.ai"), href: "/ai" },
          { name: t("breadcrumb.agents") },
        ]}
        items={tabItems}
        active={activeTab}
        setActive={onTabChange}
        stats={statsCards}
        statsLoading={statsLoading}
        buttons={
          <Button_
            size="sm"
            label={t("actions.new")}
            variant="solid"
            icon={<Plus size={18} />}
            permission="agents.create"
            onClick={openCreate}
          />
        }
      />

      <Table
        tableKey="agents"
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {
          setPage(1);
          setDebouncedSearch(search);
        }}
        actions={[
          {
            key: "exportAgents",
            label: t("toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileDown size={14} />
            ),
            color: "primary",
            disabled: exportLoading,
            permission: "agents.read",
            onClick: () =>
              handleExport({
                endpoint: "/agents/export",
                params: exportParams,
                filename: "agents.xlsx",
              }),
          },
        ]}
        filters={
          <>
            <FilterField label={t("filters.status")}>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((current) => ({ ...current, status: value }))
                }
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("all")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label={t("filters.language")}>
              <Select
                value={filters.language}
                onValueChange={(value) =>
                  setFilters((current) => ({ ...current, language: value }))
                }
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.language")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("all")}</SelectItem>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {t(`languages.${language}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </>
        }
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        labels={{
          searchPlaceholder: t("table.searchPlaceholder"),
          filter: tc("filter"),
          apply: tc("apply"),
          emptyTitle: t("table.emptyTitle"),
          emptySubtitle: t("table.emptySubtitle"),
        }}
        columns={columns}
        data={records}
        isLoading={loading}
        rowKey={(row) => row.id}
        pagination={pagination}
        onPageChange={handlePageChange}
        compact
        striped
      />

      <KnowledgeAssignDialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) setAssigningAgent(null);
        }}
        agent={assigningAgent}
        onSuccess={refresh}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletingAgent(null);
        }}
        title={t("delete.title")}
        description={t("delete.desc", { name: deletingAgent?.name || "—" })}
        confirmText={t("delete.confirm")}
        cancelText={t("delete.cancel")}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={(open) => {
          setToggleOpen(open);
          if (!open) setTogglingAgent(null);
        }}
        title={
          togglingAgent?.isActive
            ? t("toggle.disableTitle")
            : t("toggle.enableTitle")
        }
        description={
          togglingAgent?.isActive
            ? t("toggle.disableDescription", {
                name: togglingAgent?.name || "—",
              })
            : t("toggle.enableDescription", {
                name: togglingAgent?.name || "—",
              })
        }
        confirmText={t("toggle.confirm")}
        cancelText={t("toggle.cancel")}
        loading={toggleLoading}
        onConfirm={handleToggleStatus}
      />
    </>
  );
});

const KnowledgeTab = forwardRef(function KnowledgeTab(
  { activeTab, onTabChange, tabItems },
  ref,
) {
  const tc = useTranslations("common");
  const t = useTranslations("agents");
  const format = useFormatter();
  const { handleExport, exportLoading } = useExport();

  const [kRecords, setKRecords] = useState([]);
  const [kStats, setKStats] = useState(null);
  const [kLoading, setKLoading] = useState(false);
  const [kStatsLoading, setKStatsLoading] = useState(false);
  const [kSearch, setKSearch] = useState("");
  const [kDebouncedSearch, setKDebouncedSearch] = useState("");
  const [kFilters, setKFilters] = useState(DEFAULT_KNOWLEDGE_FILTERS);
  const [kAppliedFilters, setKAppliedFilters] = useState(DEFAULT_KNOWLEDGE_FILTERS);
  const [kPage, setKPage] = useState(1);
  const [kLimit, setKLimit] = useState(12);
  const [kTotalRecords, setKTotalRecords] = useState(0);
  const [kFormOpen, setKFormOpen] = useState(false);
  const [kEditing, setKEditing] = useState(null);
  const [kDeleteOpen, setKDeleteOpen] = useState(false);
  const [kDeleting, setKDeleting] = useState(null);
  const [kDeleteLoading, setKDeleteLoading] = useState(false);
  const [kToggleOpen, setKToggleOpen] = useState(false);
  const [kToggling, setKToggling] = useState(null);
  const [kToggleLoading, setKToggleLoading] = useState(false);
  const kSearchTimer = useRef(null);

  const fetchKnowledgeStats = useCallback(async () => {
    setKStatsLoading(true);
    try {
      const res = await api.get("/agents/knowledge/stats");
      setKStats(res.data || {});
    } catch (error) {
      console.error("Failed to fetch knowledge stats:", error);
    } finally {
      setKStatsLoading(false);
    }
  }, []);

  const buildKnowledgeParams = useCallback(
    (p, l, filterState = kAppliedFilters, searchValue = kDebouncedSearch) => {
      const params = { page: p, limit: l };
      if (searchValue?.trim()) params.search = searchValue.trim();
      if (filterState.status === "active") params.isActive = "true";
      if (filterState.status === "inactive") params.isActive = "false";
      return params;
    },
    [kAppliedFilters, kDebouncedSearch],
  );

  const fetchKnowledge = useCallback(
    async ({
      page: p = kPage,
      limit: l = kLimit,
      filterState = kAppliedFilters,
      searchValue = kDebouncedSearch,
    } = {}) => {
      setKLoading(true);
      try {
        const res = await api.get("/agents/knowledge", {
          params: buildKnowledgeParams(p, l, filterState, searchValue),
        });
        setKRecords(res.data?.records || []);
        setKTotalRecords(Number(res.data?.total_records || 0));
        setKPage(Number(res.data?.current_page || p));
        setKLimit(Number(res.data?.per_page || l));
      } catch (error) {
        toast.error(normalizeAxiosError(error) || t("knowledge.toast.fetchFailed"));
      } finally {
        setKLoading(false);
      }
    },
    [kAppliedFilters, buildKnowledgeParams, kDebouncedSearch, kLimit, kPage, t],
  );

  useEffect(() => {
    clearTimeout(kSearchTimer.current);
    kSearchTimer.current = setTimeout(() => {
      setKDebouncedSearch(kSearch);
      setKPage(1);
    }, 350);
    return () => clearTimeout(kSearchTimer.current);
  }, [kSearch]);

  useEffect(() => {
    if (activeTab !== "knowledge") return;
    fetchKnowledge({ page: 1, limit: kLimit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kDebouncedSearch, activeTab]);

  const applyKnowledgeFilters = () => {
    setKPage(1);
    setKAppliedFilters(kFilters);
    fetchKnowledge({ page: 1, limit: kLimit, filterState: kFilters });
  };

  const kHasActiveFilters = useMemo(
    () => kAppliedFilters.status !== "all",
    [kAppliedFilters],
  );

  const kStatCards = useMemo(
    () =>
      KNOWLEDGE_STAT_CARDS.map(({ key, icon, sortOrder }) => ({
        key,
        name: t(`knowledge.stats.${key}`),
        value: kStats?.[key] ?? 0,
        icon,
        sortOrder,
      })),
    [kStats, t],
  );

  const kPagination = useMemo(
    () => ({
      total_records: kTotalRecords,
      current_page: kPage,
      per_page: kLimit,
    }),
    [kTotalRecords, kPage, kLimit],
  );

  const formatDate = (value) => {
    if (!value) return "—";
    return format.dateTime(new Date(value), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleKnowledgePageChange = ({ page: p, per_page: l }) => {
    setKPage(p);
    setKLimit(l);
    fetchKnowledge({ page: p, limit: l });
  };

  const refreshKnowledge = useCallback(() => {
    fetchKnowledge({ page: kPage, limit: kLimit });
    fetchKnowledgeStats();
  }, [fetchKnowledge, fetchKnowledgeStats, kLimit, kPage]);

  const openCreateKnowledge = () => {
    setKEditing(null);
    setKFormOpen(true);
  };

  const openEditKnowledge = (knowledge) => {
    setKEditing(knowledge);
    setKFormOpen(true);
  };

  const handleKnowledgeToggle = async () => {
    if (!kToggling) return;
    setKToggleLoading(true);
    try {
      await api.patch(`/agents/knowledge/${kToggling.id}`, {
        isActive: !kToggling.isActive,
      });
      toast.success(t("knowledge.toast.statusUpdated"));
      setKToggleOpen(false);
      setKToggling(null);
      refreshKnowledge();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("knowledge.toast.fetchFailed"));
    } finally {
      setKToggleLoading(false);
    }
  };

  const handleKnowledgeDelete = async () => {
    if (!kDeleting) return;
    setKDeleteLoading(true);
    try {
      await api.delete(`/agents/knowledge/${kDeleting.id}`);
      toast.success(t("knowledge.toast.deleted"));
      setKDeleteOpen(false);
      setKDeleting(null);
      refreshKnowledge();
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("knowledge.toast.deleteFailed"));
    } finally {
      setKDeleteLoading(false);
    }
  };

  const kExportParams = buildKnowledgeParams(1, 10000);
  delete kExportParams.page;
  delete kExportParams.limit;

  const kRowActions = (row) => [
    {
      icon: <Edit />,
      tooltip: t("actions.edit"),
      variant: "primary",
      permission: "agents.update",
      onClick: () => openEditKnowledge(row),
    },
    {
      icon: <Power size={16} />,
      tooltip: row.isActive ? t("actions.disable") : t("actions.enable"),
      variant: row.isActive ? "orange" : "emerald",
      permission: "agents.update",
      onClick: () => {
        setKToggling(row);
        setKToggleOpen(true);
      },
    },
    {
      icon: <Trash2 />,
      tooltip: t("actions.delete"),
      variant: "red",
      permission: "agents.delete",
      onClick: () => {
        setKDeleting(row);
        setKDeleteOpen(true);
      },
    },
  ];

  const knowledgeColumns = [
    {
      key: "title",
      header: t("knowledge.columns.title"),
      className: "min-w-[180px]",
      cell: (row) => (
        <span className="block text-sm font-semibold text-foreground truncate">
          {row.title || "—"}
        </span>
      ),
    },
    {
      key: "content",
      header: t("knowledge.columns.content"),
      className: "min-w-[240px]",
      cell: (row) => (
        <span className="block text-sm text-muted-foreground truncate max-w-[420px]">
          {row.content || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      cell: (row) => (
        <Badge variant={row.isActive ? "secondary" : "outline"}>
          {t(`status.${row.isActive ? "active" : "inactive"}`)}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: t("columns.createdAt"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("columns.actions"),
      className: "md:sticky md:z-20",
      cell: (row) => <ActionButtons row={row} actions={kRowActions(row)} />,
    },
  ];

  useImperativeHandle(
    ref,
    () => ({
      onEnter: () => {
        setKSearch("");
        setKDebouncedSearch("");
        setKFilters(DEFAULT_KNOWLEDGE_FILTERS);
        setKAppliedFilters(DEFAULT_KNOWLEDGE_FILTERS);
        setKPage(1);
        fetchKnowledgeStats();
      },
    }),
    [fetchKnowledgeStats],
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.ai"), href: "/ai" },
          { name: t("breadcrumb.agents") },
        ]}
        items={tabItems}
        active={activeTab}
        setActive={onTabChange}
        stats={kStatCards}
        statsLoading={kStatsLoading}
        buttons={
          <Button_
            size="sm"
            label={t("knowledge.actions.new")}
            variant="solid"
            icon={<Plus size={18} />}
            permission="agents.create"
            onClick={openCreateKnowledge}
          />
        }
      />

      <Table
        tableKey="agents-knowledge"
        searchValue={kSearch}
        onSearchChange={setKSearch}
        onSearch={() => {
          setKPage(1);
          setKDebouncedSearch(kSearch);
        }}
        actions={[
          {
            key: "exportKnowledge",
            label: t("knowledge.toolbar.export"),
            icon: exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileDown size={14} />
            ),
            color: "primary",
            disabled: exportLoading,
            permission: "agents.read",
            onClick: () =>
              handleExport({
                endpoint: "/agents/knowledge/export",
                params: kExportParams,
                filename: "knowledge.xlsx",
              }),
          },
        ]}
        filters={
          <FilterField label={t("knowledge.filters.status")}>
            <Select
              value={kFilters.status}
              onValueChange={(value) =>
                setKFilters((current) => ({ ...current, status: value }))
              }
            >
              <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                <SelectValue placeholder={t("knowledge.filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc("all")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        }
        hasActiveFilters={kHasActiveFilters}
        onApplyFilters={applyKnowledgeFilters}
        labels={{
          searchPlaceholder: t("knowledge.table.searchPlaceholder"),
          filter: tc("filter"),
          apply: tc("apply"),
          emptyTitle: t("knowledge.table.emptyTitle"),
          emptySubtitle: t("knowledge.table.emptySubtitle"),
        }}
        columns={knowledgeColumns}
        data={kRecords}
        isLoading={kLoading}
        rowKey={(row) => row.id}
        pagination={kPagination}
        onPageChange={handleKnowledgePageChange}
        compact
        striped
      />

      <KnowledgeFormDialog
        open={kFormOpen}
        onOpenChange={(open) => {
          setKFormOpen(open);
          if (!open) setKEditing(null);
        }}
        knowledge={kEditing}
        onSuccess={refreshKnowledge}
      />

      <ConfirmDialog
        open={kDeleteOpen}
        onOpenChange={(open) => {
          setKDeleteOpen(open);
          if (!open) setKDeleting(null);
        }}
        title={t("knowledge.delete.title")}
        description={t("knowledge.delete.desc", { title: kDeleting?.title || "—" })}
        confirmText={t("knowledge.delete.confirm")}
        cancelText={t("knowledge.delete.cancel")}
        loading={kDeleteLoading}
        onConfirm={handleKnowledgeDelete}
      />

      <ConfirmDialog
        open={kToggleOpen}
        onOpenChange={(open) => {
          setKToggleOpen(open);
          if (!open) setKToggling(null);
        }}
        title={
          kToggling?.isActive
            ? t("knowledge.toggle.disableTitle")
            : t("knowledge.toggle.enableTitle")
        }
        description={
          kToggling?.isActive
            ? t("knowledge.toggle.disableDescription", {
                title: kToggling?.title || "—",
              })
            : t("knowledge.toggle.enableDescription", {
                title: kToggling?.title || "—",
              })
        }
        confirmText={t("knowledge.toggle.confirm")}
        cancelText={t("knowledge.toggle.cancel")}
        loading={kToggleLoading}
        onConfirm={handleKnowledgeToggle}
      />
    </>
  );
});

export default function AgentsPage() {
  const t = useTranslations("agents");
  const [activeTab, setActiveTab] = useState("agents");
  const agentsTabRef = useRef(null);
  const knowledgeTabRef = useRef(null);

  const tabItems = useMemo(
    () => [
      { id: "agents", label: t("tabs.agents"), icon: Bot },
      { id: "knowledge", label: t("tabs.knowledge"), icon: BookOpen },
    ],
    [t],
  );

  useEffect(() => {
    setDocumentTitle(t("title"));
  }, [t]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "knowledge") {
      knowledgeTabRef.current?.onEnter();
    } else {
      agentsTabRef.current?.onEnter();
    }
  };

  return (
    <div className="min-h-screen p-5">
      <div className={activeTab === "agents" ? "" : "hidden"}>
        <AgentsTab
          ref={agentsTabRef}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabItems={tabItems}
        />
      </div>
      <div className={activeTab === "knowledge" ? "" : "hidden"}>
        <KnowledgeTab
          ref={knowledgeTabRef}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabItems={tabItems}
        />
      </div>
    </div>
  );
}
