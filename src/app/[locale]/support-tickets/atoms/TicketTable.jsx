"use client";

import { useLocale, useTranslations, useFormatter } from "next-intl";
import Table, { FilterField } from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import { Eye, Paperclip } from "lucide-react";
import { TicketStatusBadge, TicketPriorityBadge } from "./TicketBadges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

function TicketTitleCell({ row, onView, t, scope }) {
  const unreadCount =
    scope === "admin" ? row.unreadSupportCount : row.unreadUserCount;

  return (
    <button
      type="button"
      onClick={() => onView?.(row)}
      className="flex items-center gap-2 max-w-[340px] text-start group/title"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate group-hover/title:text-primary transition-colors">
            {row.title || "—"}
          </span>
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </span>
        {/* <span className="text-[11px] text-muted-foreground font-mono">
          #{String(row.id || "").slice(0, 8)}
        </span> */}
      </span>
    </button>
  );
}

/**
 * Shared support-tickets table.
 * scope: "tenant" | "admin" (adds tenant column for the support desk)
 */
export default function TicketTable({
  scope = "tenant",
  rows = [],
  loading = false,
  pagination,
  onPageChange,
  searchValue,
  onSearchChange,
  onSearch,
  filters,
  hasActiveFilters,
  onApplyFilters,
  actions = [],
  onView,
  rowActions = null,
  className,
}) {
  const t = useTranslations("supportTickets");
  const locale = useLocale();
  const format = useFormatter();

  const formatDate = (value) => {
    if (!value) return "—";
    return format.dateTime(new Date(value), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const columns = [
    {
      key: "title",
      header: t("columns.title"),
      className: "max-w-[340px]",
      cell: (row) => <TicketTitleCell row={row} onView={onView} t={t} scope={scope} />,
    },
    {
      key: "status",
      header: t("columns.status"),
      cell: (row) => <TicketStatusBadge status={row.status} />,
    },

    ...(scope === "admin" ? [
      {
        key: "priority",
        header: t("columns.priority"),
        cell: (row) => <TicketPriorityBadge priority={row.priority} />,
      },
    ] : []
    ),
    {
      key: "unreadCount",
      header: t("columns.unread"),
      cell: (row) => {
        const count = scope === "admin" ? row.unreadSupportCount : row.unreadUserCount;
        return count > 0 ? (
          <Badge
            variant="outline"
            className="rounded-full text-[10px] font-black tabular-nums text-primary border-primary/30 bg-primary/10"
          >
            {count}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "assignedSupport",
      header: t("columns.assignedSupport"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.assignedSupportUser?.name || "—"}
        </span>
      ),
    },
    ...(scope === "admin"
      ? [
        {
          key: "tenant",
          header: t("columns.tenant"),
          cell: (row) => (
            <span className="text-xs text-muted-foreground">
              {row.admin?.name || row.adminId || "—"}
            </span>
          ),
        },
        {
          key: "createdBy",
          header: t("columns.createdBy"),
          cell: (row) => (
            <span className="text-xs text-muted-foreground">
          {row.createdByUser?.name || "—"}
        </span>
      ),
    },
  ]
  : []),
    {
      key: "lastMessage",
      header: t("columns.lastMessage"),
      className: "max-w-[240px]",
      cell: (row) => {
        const lm = row.lastMessage;
        if (!lm) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground truncate min-w-0">
              {lm.message || "—"}
            </span>
            {lm.isEdited && (
              <span className="text-[10px] text-muted-foreground/70 shrink-0">
                ({t("chat.edited")})
              </span>
            )}
            {lm.attachmentCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                <Paperclip size={11} />
                {lm.attachmentCount}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "lastMessageAt",
      header: t("columns.created_at"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "lastMessageAt",
      header: t("columns.lastMessageAt"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.lastMessageAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("columns.actions"),
      className: "md:sticky md:z-20",
      cell: (row) => {
        if (rowActions) return rowActions(row);
        return (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <Eye />,
                tooltip: t("actions.view"),
                variant: "blue",
                onClick: () => onView?.(row),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <Table
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      onSearch={onSearch}
      hasSearch
      actions={actions}
      filters={filters}
      hasActiveFilters={hasActiveFilters}
      onApplyFilters={onApplyFilters}
      labels={{
        searchPlaceholder: scope === "tenant" ? t("table.searchPlaceholderTenant") : t("table.searchPlaceholder"),
        filter: t("table.filter"),
        apply: t("table.apply"),
        emptyTitle: t("table.emptyTitle"),
        emptySubtitle: t("table.emptySubtitle"),
      }}
      columns={columns}
      data={rows}
      isLoading={loading}
      rowKey={(row) => row.id}
      pagination={pagination}
      onPageChange={onPageChange}
      className={className}
      compact
      striped
    />
  );
}

export { FilterField };
