"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  Plus,
  Download,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useExport } from "@/hook/useExport";
import { useIssues } from "@/hook/useIssues";
import PageHeader from "@/components/atoms/Pageheader";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { normalizeAxiosError } from "@/utils/axios";
import api from "@/utils/api";
import { cn } from "@/utils/cn";

import FiltersCard from "./atoms/FiltersCard";
import StatusFormDialog from "./atoms/StatusFormDialog";
import KanbanBar, { pickName } from "./atoms/KanbanBar";
import IssueDetailSheet from "./atoms/IssueDetailSheet";
import IssueFormDialog from "./atoms/IssueFormDialog";

/* ============================================================
   Default filters shape
============================================================ */
const DEFAULT_FILTERS = {
  search: "",
  statusId: "",
  causeId: "",
  priority: "",
  assignedRoleId: "",
  assignedEmployeeId: "",
  isDelayed: false,
  dateFrom: "",
  dateTo: "",
};

/* ============================================================
   Stat icons for the PageHeader cards
============================================================ */
const TOTAL_META = { icon: BarChart3 };
const TODAY_META = { icon: Zap };
const DELAYED_META = { icon: AlertCircle };
const STATUS_META = { icon: Clock };

/* ============================================================
   Page
============================================================ */
export default function ManageIssuesPage() {
  const locale = useLocale();
  const t = useTranslations("issues");
  const { hasPermission } = useAuth();
  const { subscribe } = useSocket();
  const { handleExport } = useExport();
  const issuesHook = useIssues();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const {
    boardColumns,
    setBoardColumns,
    boardLoading,
    boardColumnLoading,
    stats,
    statuses,
    causes,
    fetchBoard,
    fetchBoardColumn,
    fetchStats,
    fetchStatuses,
    fetchCauses,
    createStatus,
    updateStatus,
    deleteStatus,
    changeStatus,
    createIssue,
    getIssue,
    getMessages,
    reply,
    changePriority,
    assignIssue,
    updateIssue,
    deleteIssue,
    markRead,
  } = issuesHook;

  /* ── Realtime: keep board & stats in sync via socket ────── */
  useEffect(() => {
    if (!subscribe) return undefined;
    const upsertIssue = (issue) => {
      if (!issue?.id) return;
      setBoardColumns((cols) =>
        cols.map((col) => {
          const sid = col.status?.id;
          const rest = (col.records ?? []).filter((it) => it.id !== issue.id);
          if (String(sid) === String(issue.statusId)) {
            return { ...col, records: [issue, ...rest] };
          }
          return { ...col, records: rest };
        }),
      );
    };
    const offs = [
      subscribe("ISSUE_UPDATED", (payload) => {
        upsertIssue(payload?.issue);
        fetchStats();
      }),
      subscribe("ISSUE_CREATED", (payload) => {
        upsertIssue(payload?.issue);
        fetchStats();
      }),
    ];
    return () => offs.forEach((off) => off?.());
  }, [subscribe, setBoardColumns, fetchStats]);

  const [statsLoading, setStatsLoading] = useState(true);

  // --- filters ---
  const [liveFilters, setLiveFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  // --- roles / users for filter + create-issue options ---
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  // --- statuses dialog state ---
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    initialData: null,
  });
  const [deleteStatusConfirm, setDeleteStatusConfirm] = useState(null); // statusObj | null
  const [deletingStatus, setDeletingStatus] = useState(false);
  const [dragTargetStatusId, setDragTargetStatusId] = useState(null); // single hovered bar for ghost placeholder

  // --- sheet state ---
  const [sheetIssueId, setSheetIssueId] = useState(null);

  // --- new-issue dialog state ---
  const [issueDialog, setIssueDialog] = useState({
    open: false,
    statusId: "",
  });
  const [editIssue, setEditIssue] = useState(null);

  /* ── Roles & users for filter/assign options ────────────── */
  useEffect(() => {
    api
      .get("/roles")
      .then((res) => setRoles(res.data || []))
      .catch(() => { });
    api
      .get("/users", { params: { limit: 1000 } })
      .then((res) => setUsers(res.data?.records || res.data || []))
      .catch(() => { });
  }, []);

  /* ── Open sheet from ?id= search param on initial load ─── */
  const didInitFromUrlRef = useRef(false);
  useEffect(() => {
    if (didInitFromUrlRef.current) return;
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) {
      didInitFromUrlRef.current = true;
      setSheetIssueId(idFromUrl);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");

    const query = params.toString();
    router.replace(
      query ? `${pathname}?${query}` : pathname,
      { scroll: false },
    );
    }
  }, [searchParams]);

  /* ── Backend query params (map UI filters → API names) ──── */
  const queryParams = useMemo(() => {
    const p = {
      search: appliedFilters.search || undefined,
      statusId: appliedFilters.statusId || undefined,
      causeId: appliedFilters.causeId || undefined,
      priority: appliedFilters.priority || undefined,
      assignedRoleId: appliedFilters.assignedRoleId || undefined,
      assignedEmployeeId: appliedFilters.assignedEmployeeId || undefined,
      isDelayed: appliedFilters.isDelayed || undefined,
      startDate: appliedFilters.dateFrom || undefined,
      endDate: appliedFilters.dateTo || undefined,
    };
    return Object.fromEntries(
      Object.entries(p).filter(([, v]) => v !== undefined && v !== "")
    );
  }, [appliedFilters]);

  /* ── Initial data load ─────────────────────────────────── */
  useEffect(() => {
    fetchStatuses();
    fetchCauses();
    (async () => {
      setStatsLoading(true);
      await fetchStats();
      setStatsLoading(false);
    })();
    fetchBoard(queryParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Refetch board when filters change ─────────────────── */
  const [refreshKey, setRefreshKey] = useState(0);
  const [boardRefreshing, setBoardRefreshing] = useState(false);
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    if (prevLoadingRef.current && !boardLoading) {
      setBoardRefreshing(false);
    }
    prevLoadingRef.current = boardLoading;
  }, [boardLoading]);

  useEffect(() => {
    fetchBoard(queryParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(queryParams), refreshKey]);

  const perm = {
    read: hasPermission("issues.read"),
    create: hasPermission("issues.create"),
    update: hasPermission("issues.update"),
    remove: hasPermission("issues.delete"),
    export: hasPermission("issues.export"),
    changeStatus: hasPermission("issues.change_status"),
    changePriority: hasPermission("issues.change_priority"),
    assign: hasPermission("issues.assign"),
    reply: hasPermission("issues.reply"),
    statusesCreate: hasPermission("issues.statuses.create"),
    statusesUpdate: hasPermission("issues.statuses.update"),
    statusesDelete: hasPermission("issues.statuses.delete"),
  };

  /* ------------------------------------------------------------
     Status card edit / delete handlers (PageHeader stats)
  ------------------------------------------------------------ */
  const handleEditStatus = (status) => {
    setStatusDialog({ open: true, initialData: status });
  };

  const handleDeleteStatus = (status) => {
    setDeleteStatusConfirm(status);
  };

  const handleAddStatus = () => {
    setStatusDialog({ open: true, initialData: null });
  };

  /* Default (open) status id for the "New Issue" header button */
  const openStatusId = useMemo(
    () => statuses.find((s) => s.code === "open")?.id || "",
    [statuses]
  );

  /* ------------------------------------------------------------
     Page Header stat cards
  ------------------------------------------------------------ */
  const statCards = useMemo(() => {
    const cards = [
      {
        name: t("stats.total"),
        value: stats?.total ?? 0,
        icon: TOTAL_META.icon,
        sortOrder: 0,
      },
      {
        name: t("stats.newToday"),
        value: stats?.newToday ?? 0,
        icon: TODAY_META.icon,
        sortOrder: 1,
      },
      {
        name: t("stats.delayed"),
        value: stats?.delayed ?? 0,
        icon: DELAYED_META.icon,
        description: stats?.delayed
          ? t("stats.delayedDesc", { count: stats?.delayed ?? 0 })
          : undefined,
        sortOrder: 2,
      },
    ];
    statuses.forEach((s, i) => {
      cards.push({
        name: locale === "ar" ? s.nameAr || s.nameEn : s.nameEn || s.nameAr,
        description: locale === "ar" ? s.nameEn : s.nameAr,
        value: stats?.byStatus?.[s.id] ?? 0,
        icon: STATUS_META.icon,
        sortOrder: 3 + i,
        // editable: !s.system,
        onEdit: () => handleEditStatus(s),
        onDelete: () => handleDeleteStatus(s),
      });
    });
    // if (perm.statusesCreate) {
    //   cards.push({
    //     isAddCard: true,
    //     name: t("actions.addStatus"),
    //     icon: Plus,
    //     onClick: handleAddStatus,
    //     sortOrder: 3 + statuses.length,
    //   });
    // }
    return cards;
  }, [stats, statuses, t, locale, perm.statusesCreate]);

  /* ------------------------------------------------------------
     Filter handlers
  ------------------------------------------------------------ */
  const clearFilters = () => {
    setLiveFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setBoardRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  /* ------------------------------------------------------------
     Status CRUD submit handlers
  ------------------------------------------------------------ */
  async function submitStatusForm(data) {
    if (statusDialog.initialData?.id) {
      return updateStatus(
        statusDialog.initialData.id,
        data,
        {
          onSuccess: () => setStatusDialog((s) => ({ ...s, open: false })),
        },
      );
    }
    return createStatus(data, {
      onSuccess: () => setStatusDialog((s) => ({ ...s, open: false })),
    });
  }

  async function confirmDeleteStatus(status) {
    setDeletingStatus(true);
    try {
      await deleteStatus(status.id, {
        onSuccess: () => setDeleteStatusConfirm(null),
      });
    } finally {
      setDeletingStatus(false);
    }
  }

  /* ------------------------------------------------------------
     Export per-bar
  ------------------------------------------------------------ */
  const handleBarExport = (status) => {
    handleExport({
      endpoint: "/issues/export",
      params: { ...queryParams, statusId: status.id },
    });
  };

  /* ------------------------------------------------------------
     Load more (one column, cursor pagination)
  ------------------------------------------------------------ */
  const handleLoadMore = (statusId) => {
    const col = boardColumns.find((c) => c.status?.id === statusId);
    const cursor = col?.pagination?.nextCursor;
    if (!cursor) return;
    fetchBoardColumn(statusId, cursor, queryParams);
  };

  /* ------------------------------------------------------------
     Drag & drop across bars (HTML5 MVP)
     Optimistic update:
       1) instant move via local state,
       2) silent background sync,
       3) rollback + error toast on failure.
  ------------------------------------------------------------ */
  const handleCardDropAcrossBars = async (issueId, newStatusId) => {
    if (!perm.changeStatus) return;
    if (!issueId || !newStatusId) return;

    const target = boardColumns
      .flatMap((col) => col.records ?? [])
      .find((it) => it.id === issueId);
    if (!target) return;
    const oldStatusId = target.statusId;
    if (String(oldStatusId) === String(newStatusId)) return;

    const moveIssue = (cols, statusId, issue) =>
      cols.map((col) => {
        const sid = col.status?.id;
        const rest = (col.records ?? []).filter((it) => it.id !== issueId);
        if (String(sid) === String(statusId)) {
          return { ...col, records: [issue, ...rest] };
        }
        return { ...col, records: rest };
      });

    // 1) Instant move
    setBoardColumns((prev) =>
      moveIssue(prev, newStatusId, { ...target, statusId: newStatusId }),
    );

    // 2) Background sync (silent)
    try {
      const { data } = await api.patch(`/issues/${issueId}/status`, {
        statusId: newStatusId,
        reason: "Dragged on Kanban",
      });
      const saved = data?.data;
      if (saved) {
        setBoardColumns((prev) =>
          moveIssue(prev, saved.statusId, {
            ...target,
            statusId: saved.statusId,
            status: saved.status,
          }),
        );
      }
      fetchStats();
    } catch (e) {
      // 3) Graceful rollback
      setBoardColumns((prev) =>
        moveIssue(prev, oldStatusId, { ...target, statusId: oldStatusId }),
      );
      toast.error(normalizeAxiosError(e));
    }
  };

  /* ------------------------------------------------------------
     JSX
  ------------------------------------------------------------ */
  return (
    <div className="flex flex-col p-2 sm:p-6">
      {/* PAGE HEADER (stats) */}
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("title") },
        ]}
        buttons={
          perm.create && (
            <Button
              size="sm"
              onClick={() =>
                setIssueDialog({ open: true, statusId: openStatusId })
              }
            >
              <Plus size={18} />
              {t("actions.new")}
            </Button>
          )
        }
        stats={statCards}
        statsLoading={statsLoading}
      />

      {/* FILTERS */}
      <FiltersCard
        filters={{
          ...liveFilters,
          statuses,
          causes,
          roles,
          users,
        }}
        onApply={(next) => {
          const { statuses: _s, causes: _c, roles: _r, users: _u, ...cleanNext } = next;
          setLiveFilters(next);
          setAppliedFilters(cleanNext);
          setBoardRefreshing(true);
          setRefreshKey((k) => k + 1);
        }}
        onClear={clearFilters}
        loading={boardLoading}
      />

      {/* KANBAN BARS + Add Status card */}
      <div
        className={cn(
          "main-card rounded-2xl border border-border/50 overflow-hidden flex items-stretch gap-4 overflow-x-auto pb-4 -mx-2 px-2",
          "transition-all duration-300",
          boardRefreshing && "opacity-50 pointer-events-none blur-[1px]"
        )}
        data-kanban-scroller
      >

        {boardColumns.map((col) => {
          const status =
            statuses.find((s) => s.id === col.status?.id) || col.status;
          const statusId = col.status?.id;
          return (
            <KanbanBar
              key={statusId}
              status={status}
              issues={col.records ?? []}
              locale={locale}
              permissionFlags={{
                canEditStatus: perm.statusesUpdate && !status.system,
                canDeleteStatus: perm.statusesDelete && !status.system,
                canExport: perm.export,
                canChangeStatus: perm.changeStatus,
              }}
              onEdit={() =>
                setStatusDialog({ open: true, initialData: status })
              }
              onDelete={() => setDeleteStatusConfirm(status)}
              onExport={() => handleBarExport(status)}
              onIssueClick={(issue) => setSheetIssueId(issue.id)}
              onCardEdit={(issue) => setEditIssue(issue)}
              canEditIssue={perm.update}
              onCardDrop={handleCardDropAcrossBars}
              isDragTarget={dragTargetStatusId === statusId}
              onDragTargetChange={(over) =>
                setDragTargetStatusId(over ? statusId : null)
              }
              hasNextPage={!!col.pagination?.hasNextPage}
              onLoadMore={() => handleLoadMore(statusId)}
              loadingMore={!!boardColumnLoading[statusId]}
            />
          );
        })}

        {perm.statusesCreate && (
          <button
            type="button"
            onClick={handleAddStatus}
            className={cn(
              "group shrink-0 flex flex-col items-center justify-center gap-4 min-w-[280px] w-[280px] h-full min-h-[500px] rounded-xl",
              "border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/30",
              "hover:border-primary/50 hover:bg-white dark:hover:bg-zinc-900/60 hover:shadow-sm",
              "transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            )}
          >
            {/* Icon wrapper to give it a "button" feel within the dropzone */}
            <div className="flex items-center justify-center size-12 rounded-full bg-slate-200/60 dark:bg-zinc-900 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-200">
              <Plus size={24} className="text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            </div>

            <span className="text-sm font-bold tracking-tight text-muted-foreground group-hover:text-primary transition-colors duration-200">
              {t("statuses.add")}
            </span>
          </button>
        )}
      </div>

      {/* STATUS FORM DIALOG */}
      <StatusFormDialog
        open={statusDialog.open}
        onOpenChange={(o) => setStatusDialog((s) => ({ ...s, open: o }))}
        initialData={statusDialog.initialData}
        onSubmit={submitStatusForm}
      />

      {/* DELETE STATUS CONFIRM */}
      <ConfirmDialog
        open={!!deleteStatusConfirm}
        onOpenChange={(o) => !o && setDeleteStatusConfirm(null)}
        title={t("statuses.deleteTitle", {
          name: pickName(deleteStatusConfirm, locale),
        })}
        description={
          (deleteStatusConfirm?.issueCount ?? 0) > 0
            ? t("statuses.deleteUsedDesc", { count: deleteStatusConfirm.issueCount })
            : t("statuses.deleteDesc")
        }
        confirmText={t("actions.delete")}
        cancelText={t("actions.cancel")}
        loading={deletingStatus}
        disabled={deleteStatusConfirm && deleteStatusConfirm.issueCount > 0}
        onConfirm={() => deleteStatusConfirm && confirmDeleteStatus(deleteStatusConfirm)}
      />

      {/* ISSUE DETAIL SIDE SHEET */}
      <IssueDetailSheet
        open={!!sheetIssueId}
        onOpenChange={(o) => !o && setSheetIssueId(null)}
        issueId={sheetIssueId}
        fetchers={{
          getIssue,
          getMessages,
          reply,
          changeStatus,
          changePriority,
          assign: assignIssue,
          updateIssue,
          deleteIssue,
          markRead,
        }}
        permissions={{
          canUpdate: perm.update,
          canDelete: perm.remove,
          canChangeStatus: perm.changeStatus,
          canChangePriority: perm.changePriority,
          canAssign: perm.assign,
          canReply: perm.reply,
        }}
        options={{ statuses, causes, roles, users, locale }}
        onIssueDeleted={() => setSheetIssueId(null)}
      />

      {/* NEW ISSUE DIALOG */}
      <IssueFormDialog
        open={issueDialog.open}
        onOpenChange={(o) => setIssueDialog((s) => ({ ...s, open: o }))}
        fetchers={{ createIssue }}
        options={{ statuses, causes, roles, users, locale }}
        initialStatusId={issueDialog.statusId}
        onCreated={() => {
          fetchBoard(queryParams);
          fetchStats();
        }}
      />

      {/* EDIT ISSUE DIALOG */}
      <IssueFormDialog
        open={!!editIssue}
        onOpenChange={(o) => !o && setEditIssue(null)}
        fetchers={{ updateIssue }}
        options={{ statuses, causes, roles, users, locale }}
        initialData={editIssue}
        onUpdated={() => {
          fetchBoard(queryParams);
          fetchStats();
          setEditIssue(null);
        }}
      />

      {/* GLOBAL EXPORT (footer floating or top) */}
      {perm.export && false && (
        <div className="fixed bottom-6 end-6 z-40">
          <PrimaryBtn onClick={() => handleExport({ endpoint: "/issues/export", params: appliedFilters })}>
            <Download size={14} /> Export all
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
}
