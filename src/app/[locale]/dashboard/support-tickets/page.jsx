"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  FileDown,
  LifeBuoy,
  CircleDot,
  CircleCheck,
  Timer,
  CirclePause,
  CircleX,
  MailOpen,
  RefreshCw,
  UserRound,
  Flame,
  Eye,
  Flag,
  LockOpen,
  RotateCcw,
} from "lucide-react";
import PageHeader from "@/components/atoms/Pageheader";
import TicketTable from "../../support-tickets/atoms/TicketTable";
import TicketFilters from "../../support-tickets/atoms/TicketFilters";
import StatusDialog from "../../support-tickets/atoms/StatusDialog";
import PriorityDialog from "../../support-tickets/atoms/PriorityDialog";
import ActionButtons from "@/components/atoms/Actions";
import {
  useSupportTickets,
  useSupportTicketEvents,
} from "@/hook/useSupportTickets";
import { useExport } from "@/hook/useExport";
import { TERMINAL_STATUSES, TICKET_STATUS } from "@/constants/support-ticket";

const STAT_CARDS = [
  { key: "total", icon: LifeBuoy, sortOrder: 0 },
  { key: "open", icon: CircleDot, sortOrder: 1 },
  { key: "inProgress", icon: RefreshCw, sortOrder: 2 },
  { key: "waitingOnCustomer", icon: Timer, sortOrder: 3 },
  { key: "onHold", icon: CirclePause, sortOrder: 4 },
  { key: "resolved", icon: CircleCheck, sortOrder: 5 },
  { key: "closed", icon: CircleX, sortOrder: 6 },
  { key: "reopened", icon: RefreshCw, sortOrder: 7 },
  { key: "canceled", icon: CircleX, sortOrder: 8 },
  { key: "unassigned", icon: UserRound, sortOrder: 9 },
  { key: "urgent", icon: Flame, sortOrder: 10 },
  { key: "unreadBySupport", icon: MailOpen, sortOrder: 11 },
];

export default function AdminSupportTicketsPage() {
  const t = useTranslations("supportTickets");
  const locale = useLocale();
  const router = useRouter();

  const { loading, tickets, totalRecords, stats, fetchList, fetchStats, changeStatus, changePriority } =
    useSupportTickets("admin");
  const { handleExport } = useExport();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const searchTimer = useRef(null);
  const [statusRow, setStatusRow] = useState(null);
  const [priorityRow, setPriorityRow] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [mutating, setMutating] = useState(false);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const refresh = useCallback(
    ({ page: p = page, limit: l = limit } = {}) => {
      fetchList({
        search: debouncedSearch || undefined,
        status: filters.status,
        priority: filters.priority,
        unassigned: filters.unassigned || undefined,
        hasUnreadSupport: filters.hasUnreadSupport || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        sortBy: filters.sortBy || "created_at",
        sortOrder: filters.sortOrder || "DESC",
        page: p,
        limit: l,
      });
      fetchStats({
        status: filters.status,
        priority: filters.priority,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
    },
    [fetchList, fetchStats, debouncedSearch, filters, page, limit],
  );

  useEffect(() => {
    refresh({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useSupportTicketEvents({
    onCreated: refresh,
    onUpdated: refresh,
    onMessageCreated: refresh,
    onRead: refresh,
  });

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.status ||
        filters.priority ||
        filters.unassigned ||
        filters.hasUnreadSupport ||
        filters.startDate ||
        filters.endDate,
      ),
    [filters],
  );

  const statsCards = useMemo(
    () =>
      STAT_CARDS.map(({ key, icon, sortOrder }) => ({
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

  const onPageChange = ({ page: p, per_page: l }) => {
    setPage(p);
    setLimit(l);
    refresh({ page: p, limit: l });
  };

  const handleStatus = useCallback(
    async (status, reason) => {
      if (!statusRow) return false;
      setMutating(true);
      try {
        const res = await changeStatus(statusRow.id, status, reason);
        if (res) {
          refresh();
          return true;
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [statusRow, changeStatus, refresh],
  );

  const handlePriority = useCallback(
    async (priority) => {
      if (!priorityRow) return false;
      setMutating(true);
      try {
        const res = await changePriority(priorityRow.id, priority);
        if (res) {
          refresh();
          return true;
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [priorityRow, changePriority, refresh],
  );

  const handleReopen = useCallback(
    async (row) => {
      setMutating(true);
      try {
        const res = await changeStatus(row.id, TICKET_STATUS.REOPENED);
        if (res) refresh();
      } finally {
        setMutating(false);
      }
    },
    [changeStatus, refresh],
  );

  const goView = useCallback(
    (row) => router.push(`/${locale}/dashboard/support-tickets/${row.id}`),
    [router, locale],
  );

  const rowActions = useCallback(
    (row) => {
      const terminal = TERMINAL_STATUSES.includes(row.status);
      return (
        <ActionButtons
          row={row}
          actions={[
           
            ...(!terminal
              ? [
                {
                  icon: <LockOpen />,
                  tooltip: t("actions.status"),
                  variant: "blue",
                  onClick: (r) => {
                    setStatusRow(r);
                    setStatusOpen(true);
                  },
                },
                {
                  icon: <Flag />,
                  tooltip: t("actions.priority"),
                  variant: "amber",
                  onClick: (r) => {
                    setPriorityRow(r);
                    setPriorityOpen(true);
                  },
                },
              ]
              :
              [
                {
                  icon: <RotateCcw />,
                  tooltip: t("actions.reopen"),
                  variant: "emerald",
                  onClick: async (r) => handleReopen(r),
                },
              ]

            ),
             {
              icon: <Eye />,
              tooltip: t("actions.view"),
              variant: "blue",
              onClick: goView,
            },
          ]}
        />
      );
    },
    [t, goView, handleReopen],
  );

  const onExport = () => {
    handleExport({
      endpoint: "/admin/support-tickets/export",
      params: {
        search: debouncedSearch || undefined,
        status: filters.status,
        priority: filters.priority,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      },
      filename: "Support_Tickets.xlsx",
    });
  };

  return (
    <div className="min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.adminTickets") },
        ]}
        stats={statsCards}
        statsLoading={loading && !stats}
      />

      <TicketTable
        scope="admin"
        rows={tickets}
        loading={loading}
        pagination={pagination}
        onPageChange={onPageChange}
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {
          setPage(1);
          setDebouncedSearch(search);
        }}
        actions={[
          {
            key: "export",
            label: t("toolbar.export"),
            icon: <FileDown size={14} />,
            color: "primary",
            onClick: onExport,
            permission: "support_tickets.read",
          },
        ]}
        filters={
          <TicketFilters
            scope="admin"
            filters={filters}
            onChange={(f) => setFilters(f)}
          // unreadCount={stats?.unreadBySupport}
          />
        }
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => {
          setPage(1);
          refresh({ page: 1 });
        }}
        onView={(row) =>
          router.push(`/${locale}/dashboard/support-tickets/${row.id}`)
        }
        rowActions={rowActions}
      />

      <StatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        ticket={statusRow}
        onSubmit={handleStatus}
        loading={mutating}
      />
      <PriorityDialog
        open={priorityOpen}
        onOpenChange={setPriorityOpen}
        ticket={priorityRow}
        onSubmit={handlePriority}
        loading={mutating}
      />
    </div>
  );
}
