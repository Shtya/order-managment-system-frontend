"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  STATUS_BADGE,
  PRIORITY_BADGE,
} from "@/constants/support-ticket";

const STATUS_KEYS = Object.keys(TICKET_STATUS);

export function TicketStatusBadge({ status, className }) {
  const t = useTranslations("supportTickets");
  const badge = STATUS_BADGE[status] || STATUS_BADGE.open;

  if(!status) return "—";
  return (
    <Badge variant={badge.variant} className={cn(badge.className, "whitespace-nowrap", className)}>
      {t(`status.${status}`) || status}
    </Badge>
  );
}

export function TicketPriorityBadge({ priority, className }) {
  const t = useTranslations("supportTickets");
  const badge = PRIORITY_BADGE[priority] || PRIORITY_BADGE.medium;

  if(!priority) return "—";
  return (
    <Badge variant={badge.variant} className={cn(badge.className, "whitespace-nowrap", className)}>
      {t(`priority.${priority}`) || priority}
    </Badge>
  );
}

export const TICKET_STATUS_OPTIONS = STATUS_KEYS.map((key) => ({
  value: TICKET_STATUS[key],
  labelKey: `status.${TICKET_STATUS[key]}`,
}));

export const TICKET_PRIORITY_OPTIONS = Object.keys(TICKET_PRIORITY).map(
  (key) => ({
    value: TICKET_PRIORITY[key],
    labelKey: `priority.${TICKET_PRIORITY[key]}`,
  }),
);
