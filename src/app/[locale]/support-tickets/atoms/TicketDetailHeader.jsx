"use client";

import { useTranslations, useFormatter } from "next-intl";
import {
  User as UserIcon,
  Building2,
  Clock,
  Tag,
  Flag,
  XCircle,
  MessageSquare,
  MessageCircle,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketStatusBadge, TicketPriorityBadge } from "./TicketBadges";
import { TERMINAL_STATUSES } from "@/constants/support-ticket";
import { cn } from "@/utils/cn";

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5">
      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
          {label}
        </p>
        <p className="text-xs font-semibold text-foreground truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, value, label, highlight = false }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
        highlight
          ? "bg-primary/5 border-primary/10 text-primary"
          : "bg-muted/20 border-border/40 text-muted-foreground",
      )}
    >
      <Icon size={15} className="flex-shrink-0" />
      <div className="min-w-0">
        {label && (
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
            {label}
          </p>
        )}
        <p className="text-sm font-bold tabular-nums text-foreground">
          {value ?? 0}
        </p>
      </div>
    </div>
  );
}

function LastMessagePreview({ ticket, t, format }) {
  const lm = ticket.lastMessage;
  if (!lm) {
    return (
      <div className="flex items-center gap-2.5 min-w-0 rounded-xl border border-dashed border-border/40 bg-muted/20 px-3 py-2.5 xl:col-span-2">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <MessageSquare size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
            {t("columns.lastMessage")}
          </p>
          <p className="text-xs text-muted-foreground">—</p>
        </div>
      </div>
    );
  }

  const senderName = ticket.lastMessageByUser?.name;
  const time = lm.created_at
    ? format.dateTime(new Date(lm.created_at), {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <div className="flex items-center gap-2.5 min-w-0 rounded-xl border border-primary/10 bg-primary/[0.03] px-3 py-2.5 xl:col-span-2">
      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <MessageSquare size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
          {t("columns.lastMessage")}
          {lm.attachmentCount > 0 && (
            <>
              <Paperclip size={10} />
              <span className="tabular-nums">{lm.attachmentCount}</span>
            </>
          )}
        </p>
        <p className="text-xs text-foreground/90 font-medium truncate">
          {lm.message || "—"}
          {lm.isEdited && (
            <span className="text-muted-foreground font-normal">
              {" "}
              ({t("chat.edited")})
            </span>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {senderName && <span>{senderName}</span>}
          {senderName && time && <span> · </span>}
          {time}
        </p>
      </div>
    </div>
  );
}

export default function TicketDetailHeader({
  ticket,
  scope = "tenant",
  onStatus,
  onPriority,
  onCancel,
  isMutating = false,
}) {
  const t = useTranslations("supportTickets");
  const format = useFormatter();
  const formatDate = (value) =>
    value
      ? format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" })
      : "—";

  if (!ticket) return null;

  const isTerminal = TERMINAL_STATUSES.includes(ticket.status);

  return (
    <div className="main-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold text-foreground leading-snug">
                {ticket.title}
              </h1>
              {ticket.unreadUserCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <span className="text-xs text-muted-foreground font-mono">
                #{String(ticket.id || "").slice(0, 8)}
              </span>
            </div>
          </div>

          {scope === "admin" && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatus?.()}
                disabled={isMutating || isTerminal}
              >
                <Tag className="w-4 h-4" />
                {t("actions.status")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPriority?.()}
                disabled={isMutating || isTerminal}
              >
                <Flag className="w-4 h-4" />
                {t("actions.priority")}
              </Button>
            </div>
          )}

          {scope === "tenant" && !isTerminal && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancel?.()}
              disabled={isMutating}
            >
              <XCircle className="w-4 h-4" />
              {t("actions.cancel")}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 pt-4 border-t border-border/40">
          <MetaItem
            icon={UserIcon}
            label={t("columns.createdBy")}
            value={ticket.createdByUser?.name}
          />
          {scope === "admin" && (
            <MetaItem
              icon={Building2}
              label={t("columns.tenant")}
              value={ticket.admin?.name || ticket.adminId}
            />
          )}
          <MetaItem
            icon={UserIcon}
            label={t("columns.assignedSupport")}
            value={ticket.assignedSupportUser?.name}
          />
          <MetaItem icon={Clock} label={t("filters.created_at")} value={formatDate(ticket.created_at)} />
          <MetaItem icon={Clock} label={t("filters.lastMessageAt")} value={formatDate(ticket.lastMessageAt)} />
          {/* <StatChip
            icon={MessageCircle}
            label={t("columns.unread")}
            value={
              scope === "admin"
                ? ticket.unreadSupportCount ?? 0
                : ticket.unreadUserCount ?? 0
            }
            highlight={
              (scope === "admin"
                ? ticket.unreadSupportCount ?? 0
                : ticket.unreadUserCount ?? 0) > 0
            }
          /> */}
          <LastMessagePreview ticket={ticket} t={t} format={format} />
        { scope === "admin" && <div className="flex items-center gap-2 flex-wrap">
            <StatChip
              icon={MessageSquare}
              label={t("columns.messages")}
              value={ticket.messageCount ?? 0}
              highlight
            />
            <StatChip
              icon={Paperclip}
              label={t("columns.attachments")}
              value={ticket.attachmentCount ?? 0}
            />
          </div>}
        </div>
      </div>
    </div>
  );
}
