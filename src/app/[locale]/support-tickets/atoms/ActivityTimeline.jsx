"use client";

import { useTranslations, useFormatter } from "next-intl";
import {
  PlusCircle,
  MessageSquare,
  Tag,
  Flag,
  UserPlus,
  UserMinus,
  CheckCircle,
  Lock,
  RotateCcw,
  XCircle,
  Paperclip,
  Trash2,
  Clock,
} from "lucide-react";

const TYPE_ICON = {
  created: PlusCircle,
  message_added: MessageSquare,
  status_changed: Tag,
  priority_changed: Flag,
  assigned: UserPlus,
  unassigned: UserMinus,
  resolved: CheckCircle,
  closed: Lock,
  reopened: RotateCcw,
  canceled: XCircle,
  attachment_added: Paperclip,
  attachment_deleted: Trash2,
};

const ICON_COLOR = {
  created: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  message_added: "text-sky-500 bg-sky-50 dark:bg-sky-950/30",
  status_changed: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  priority_changed: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  assigned: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  unassigned: "text-slate-500 bg-slate-100 dark:bg-slate-800/40",
  resolved: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  closed: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800/40",
  reopened: "text-sky-500 bg-sky-50 dark:bg-sky-950/30",
  canceled: "text-red-500 bg-red-50 dark:bg-red-950/30",
  attachment_added: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30",
  attachment_deleted: "text-red-500 bg-red-50 dark:bg-red-950/30",
};

function metadataText(item, t) {
  const m = item.metadata || {};
  const rows = [];

  if (item.type === "created" && m.title) {
    rows.push(t("activity.metadata.title", { title: m.title }));
  }
  if (item.type === "status_changed" && m.oldStatus && m.newStatus) {
    rows.push(
      t("activity.metadata.statusChanged", {
        oldStatus: t(`status.${m.oldStatus}`) || m.oldStatus,
        newStatus: t(`status.${m.newStatus}`) || m.newStatus,
      }),
    );
  }
  if (item.type === "priority_changed" && m.oldPriority && m.newPriority) {
    rows.push(
      t("activity.metadata.priorityChanged", {
        oldPriority: t(`priority.${m.oldPriority}`) || m.oldPriority,
        newPriority: t(`priority.${m.newPriority}`) || m.newPriority,
      }),
    );
  }
  if (m.reason) {
    rows.push(t("activity.metadata.reason", { reason: m.reason }));
  }
  if (m.message) {
    rows.push(t("activity.metadata.message", { message: m.message }));
  }
  return rows;
}

export default function ActivityTimeline({ activities = [], loading }) {
  const t = useTranslations("supportTickets");
  const format = useFormatter();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-2.5 bg-muted/60 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        {t("activity.empty")}
      </p>
    );
  }

  return (
    <div className="relative ps-1">
      <div className="absolute start-[15px] top-2 bottom-2 w-px bg-border/60" />
      <div className="space-y-5">
        {activities.map((item) => {
          const Icon = TYPE_ICON[item.type] || Clock;
          const color = ICON_COLOR[item.type] || ICON_COLOR.status_changed;
          const time = item.created_at
            ? format.dateTime(new Date(item.created_at), {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "";
          return (
            <div key={item.id} className="flex gap-3 relative">
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0 pt-0.5 space-y-0.5">
                <p className="text-sm font-semibold text-foreground/90">
                  {t(`activity.${item.type}`) || item.type}
                </p>
                {metadataText(item, t).map((row, i) => (
                  <p
                    key={i}
                    className="text-[11px] text-foreground/70 leading-snug"
                  >
                    {row}
                  </p>
                ))}
                <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                  {item.performedByUser?.name && (
                    <span>
                      {t("activity.by", {
                        name: item.performedByUser.name,
                      })}
                    </span>
                  )}
                  {time && <span>{time}</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
