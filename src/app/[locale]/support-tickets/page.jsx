"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";
import {
  Plus,
  FileDown,
  LifeBuoy,
  CircleDot,
  CircleCheck,
  CircleDashed,
  Timer,
  CirclePause,
  CircleX,
  MailOpen,
  RefreshCw,
} from "lucide-react";
import PageHeader from "@/components/atoms/Pageheader";
import TicketTable from "./atoms/TicketTable";
import TicketFilters from "./atoms/TicketFilters";
import CreateTicketDialog from "./atoms/CreateTicketDialog";
import {
  useSupportTickets,
  useSupportTicketEvents,
} from "@/hook/useSupportTickets";
import { useExport } from "@/hook/useExport";
import { getDateRangeParams } from "@/utils/healpers";

const STAT_CARDS = [
  { key: "total", icon: LifeBuoy , sortOrder: 0 },
  { key: "open", icon: CircleDot , sortOrder: 1 },
  { key: "inProgress", icon: RefreshCw , sortOrder: 2 },
  { key: "waitingOnCustomer", icon: Timer , sortOrder: 3 },
  { key: "onHold", icon: CirclePause , sortOrder: 4 },
  { key: "resolved", icon: CircleCheck , sortOrder: 5 },
  { key: "closed", icon: CircleX , sortOrder: 6 },
  { key: "reopened", icon: RefreshCw , sortOrder: 7 },
  { key: "canceled", icon: CircleX , sortOrder: 8 },
  { key: "unread", icon: MailOpen , sortOrder: 9 },
];

export default function SupportTicketsPage() {
  const t = useTranslations("supportTickets");
  const locale = useLocale();
  const router = useRouter();

  const { loading, tickets, totalRecords, stats, fetchList, fetchStats, createTicket } =
    useSupportTickets("tenant");
  const { handleExport } = useExport();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [createOpen, setCreateOpen] = useState(false);
  const searchTimer = useRef(null);

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
      const dateParams = getDateRangeParams(filters);
      fetchList({
        search: debouncedSearch || undefined,
        status: filters.status != 'all' ? filters.status : undefined,
        priority: filters.priority != 'all' ? filters.priority : undefined,
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
        sortBy: filters.sortBy || "created_at",
        sortOrder: filters.sortOrder || "DESC",
        page: p,
        limit: l,
      });
      fetchStats();
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

  const onExport = () => {
    const dateParams = getDateRangeParams(filters);
    handleExport({
      endpoint: "/support-tickets/export",
      params: {
        search: debouncedSearch || undefined,
        status: filters.status,
        priority: filters.priority,
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      },
      filename: "Support_Tickets.xlsx",
    });
  };

  return (
    <div className="min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.tickets") },
        ]}
        stats={statsCards}
        statsLoading={loading && !stats}
        buttons={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn btn-sm btn-solid gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("actions.new")}
          </button>
        }
      />

      <TicketTable
        scope="tenant"
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
          <TicketFilters filters={filters} onChange={(f) => setFilters(f)} />
        }
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => {
          setPage(1);
          refresh({ page: 1 });
        }}
        onView={(row) =>
          router.push(`/${locale}/support-tickets/${row.id}`)
        }
      />

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (values) => {
          const res = await createTicket(values);
          if (res) {
            const id = res?.data?.id || res?.id;
            if (id) router.push(`/${locale}/support-tickets/${id}`);
            return true;
          }
          return false;
        }}
      />
    </div>
  );
}
