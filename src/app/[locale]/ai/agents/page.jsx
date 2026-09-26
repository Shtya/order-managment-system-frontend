"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormatter, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { useExport } from "@/hook/useExport";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { setDocumentTitle } from "@/utils/documentTitle";

const DEFAULT_FILTERS = { status: "all", language: "all" };
const PROVIDER_AUTO = "auto";
const LANGUAGES = ["auto", "arabic", "english"];
const GENDERS = ["male", "female"];

const getConnectedAiProviders = (providers) => {
  return providers.filter((provider) => {
    const integration = provider.integration;
    return !!(
      provider.isActive !== false &&
      integration &&
      (integration.credentials?.apiKey || integration.credentials)
    );
  });
};

const STAT_CARDS = [
  { key: "total", icon: Bot, sortOrder: 0 },
  { key: "active", icon: UserCheck, sortOrder: 1 },
];

const agentSchema = (t) =>
  yup.object({
    name: yup.string().trim().required(t("validation.nameRequired")).max(255),
    language: yup
      .string()
      .oneOf(LANGUAGES)
      .required(t("validation.languageRequired")),
    gender: yup.string().oneOf(GENDERS).required(),
    customInstructions: yup.string().max(4000).nullable(),
    responseProviderId: yup.string().required(),
    isActive: yup.boolean().default(true),
  });

function AgentFormDialog({ open, onOpenChange, agent, onSuccess }) {
  const t = useTranslations("agents");
  const schema = useMemo(() => agentSchema(t), [t]);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      language: "auto",
      gender: "male",
      customInstructions: "",
      responseProviderId: PROVIDER_AUTO,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: agent?.name || "",
      language: agent?.language || "auto",
      gender: agent?.gender || "male",
      customInstructions: agent?.customInstructions || "",
      responseProviderId: agent?.responseProviderId || PROVIDER_AUTO,
      isActive: agent?.isActive ?? true,
    });
  }, [open, agent, reset]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchProviders = async () => {
      try {
        setProvidersLoading(true);
        const providersRes = await api.get("/ai/providers", {
          params: { scope: "all", isActive: "true" },
        });
        if (cancelled) return;
        const providerRecords = Array.isArray(providersRes.data)
          ? providersRes.data
          : providersRes.data?.records || [];
        setProviders(getConnectedAiProviders(providerRecords));
      } catch (error) {
        if (!cancelled) {
          setProviders([]);
          toast.error(normalizeAxiosError(error));
        }
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    };

    fetchProviders();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name.trim(),
      language: values.language,
      gender: values.gender,
      customInstructions: values.customInstructions?.trim() || null,
      responseProviderId:
        values.responseProviderId === PROVIDER_AUTO
          ? null
          : values.responseProviderId,
      isActive: values.isActive,
    };
    try {
      if (agent?.id) {
        await api.patch(`/agents/${agent.id}`, payload);
        toast.success(t("toast.updated"));
      } else {
        await api.post("/agents", payload);
        toast.success(t("toast.created"));
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("toast.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              {agent ? <Edit size={20} /> : <Bot size={20} />}
            </div>
            {agent ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 bg-card">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("form.name")}</Label>
              <Input
                {...register("name")}
                placeholder={t("form.name")}
                className="rounded-xl h-[50px]"
              />
              {errors.name ? (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("form.language")}</Label>
              <Controller
                control={control}
                name="language"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-[50px] rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language} value={language}>
                          {t(`languages.${language}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.language ? (
                <p className="text-xs text-red-600">{errors.language.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("form.gender")}</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-[50px] rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {t(`genders.${gender}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">{t("form.genderHint")}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("form.provider")}</Label>
              <Controller
                control={control}
                name="responseProviderId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={providersLoading}
                  >
                    <SelectTrigger className="h-[50px] rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PROVIDER_AUTO}>
                        {t("provider.auto")}
                      </SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("form.customInstructions")}</Label>
              <Textarea
                {...register("customInstructions")}
                rows={4}
                maxLength={4000}
                placeholder={t("form.customInstructionsPlaceholder")}
                className="rounded-xl"
              />
              {errors.customInstructions ? (
                <p className="text-xs text-red-600">{errors.customInstructions.message}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3 py-2">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label className="text-sm font-semibold">{t("form.isActive")}</Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("form.save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AgentsPage() {
  const tc = useTranslations("common");
  const t = useTranslations("agents");
  const format = useFormatter();
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
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [togglingAgent, setTogglingAgent] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    setDocumentTitle(t("title"));
  }, [t]);

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
    setEditingAgent(null);
    setFormOpen(true);
  };

  const openEdit = (agent) => {
    setEditingAgent(agent);
    setFormOpen(true);
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
      variant: "blue",
      permission: "agents.update",
      onClick: () => openEdit(row),
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

  return (
    <div className="min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.ai"), href: "/ai" },
          { name: t("breadcrumb.agents") },
        ]}
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

      <AgentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingAgent(null);
        }}
        agent={editingAgent}
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
    </div>
  );
}
