"use client";

import { useEffect, useState } from "react";
import { Clock, ExternalLink, Pencil, Phone, Tag, Timer, User, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";

const priorityStyles = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
  critical: "bg-rose-100 text-rose-700 border-rose-200",
};

const TERMINAL_STATUSES = ["solved", "cancelled", "done", "closed", "resolved"];

function shortId(id) {
  if (!id) return "";
  const str = String(id).toUpperCase();
  return str.length > 8 ? str.slice(0, 8) : str;
}

function statusCode(status) {
  if (!status) return "";
  if (typeof status === "string") return status;
  return status.code || status.nameEn || status.name || "";
}

function isFinished(status) {
  return TERMINAL_STATUSES.includes(statusCode(status).toLowerCase());
}

function useCountdown(dueAt, running) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running || !dueAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running, dueAt]);

  if (!dueAt) return null;
  const due = new Date(dueAt).getTime();
  if (isNaN(due)) return null;
  return due - now;
}

function formatRemaining(ms, dayUnit = "d") {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return days > 0
    ? `${days}${dayUnit} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function KanbanIssueCard({ issue, onClick, onEdit, className, draggable, onDragStart, onDragEnd, ...props }) {
  const t = useTranslations("issues");
  const locale = useLocale();

  const finished = isFinished(issue?.status);
  const dueAt = issue?.due_at || issue?.dueAt;
  const resolvedAt = issue?.resolved_at || issue?.resolvedAt;
  const remaining = useCountdown(dueAt, !finished);
  const overdue =
  dueAt &&
  (
    (!resolvedAt && remaining !== null && remaining < 0) ||
    (resolvedAt && new Date(resolvedAt) > new Date(dueAt))
  );
  

  const priority = String(issue?.priority || "low").toLowerCase();

  const customerName = issue?.customerName || issue?.order?.customerName;
  const customerPhone = issue?.customerPhone || issue?.order?.customerPhone;

  const causeName =
    typeof issue?.cause === "string"
      ? issue.cause
      : issue?.cause?.name ||
      (locale === "ar" ? issue?.cause?.nameAr : issue?.cause?.nameEn) ||
      issue?.cause?.nameEn ||
      issue?.cause?.nameAr ||
      "";

  const teamName =
    issue?.assignedRole?.name ||
    (locale === "ar" ? issue?.assignedRole?.nameAr : issue?.assignedRole?.nameEn) ||
    issue?.assignedRole?.nameEn ||
    issue?.assignedRole?.nameAr ||
    "";

  const handleClick = () => {
    if (onClick && issue) onClick(issue);
  };

  // Format date cleanly instead of raw string output
  const formattedLastMessage = issue?.last_message_at
    ? new Date(issue.last_message_at).toLocaleString(locale || "en", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          handleClick();
        }
      }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex flex-col min-h-[160px] w-full bg-card rounded-xl",
        "border border-border/50 shadow-sm",
        "hover:border-primary/30 hover:shadow-md transition-all duration-200 ease-in-out",
        "p-4 gap-3 cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {/* Header Row: ID, Priority, & Alerts */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono font-medium text-muted-foreground/70 uppercase tracking-wider">
            #{shortId(issue?.id)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "w-fit h-5 px-2 text-[10px] font-bold border capitalize rounded-md tracking-wide",
              
              priorityStyles[priority] || priorityStyles.low
            )}
          >
            {t("priority." + priority)}
          </Badge>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(issue);
            }}
            className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
            title={t("form.editTitle")}
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      {/* Body Row: Title & Description */}
      <div className="flex flex-col gap-1.5 min-h-0 flex-1 py-1">
        <h4 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {issue?.title || t("kanban.untitled")}
        </h4>
        {issue?.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {issue.description}
          </p>
        )}
      </div>

      {/* Unified Minimalist Metadata Grid (No Rainbow Colors) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground mt-1">
        {issue?.order?.orderNumber && (
          <span className="flex items-center gap-1.5 font-medium text-primary/90">
            <ExternalLink className="size-3 opacity-80" />
            #{issue.order.orderNumber}
          </span>
        )}
        {customerName && (
          <span className="flex items-center gap-1.5">
            <User className="size-3 opacity-70" />
            <span className="truncate max-w-[120px]">{customerName}</span>
          </span>
        )}
        {customerPhone && (
          <span className="flex items-center gap-1.5 font-mono" dir="ltr">
            <Phone className="size-3 opacity-70" />
            {customerPhone}
          </span>
        )}
        {causeName && (
          <span className="flex items-center gap-1.5">
            <Tag className="size-3 opacity-70" />
            <span className="truncate max-w-[100px]">{causeName}</span>
          </span>
        )}
        {teamName && (
          <span className="flex items-center gap-1.5">
            <Users className="size-3 opacity-70" />
            <span className="truncate max-w-[100px]">{teamName}</span>
          </span>
        )}
        
        {/* Assignees / Users (Clean text instead of bold pills) */}
        {issue?.userIds?.length > 0 ? (
          <span className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-secondary-foreground/30" />
            {issue.userIds.length} {t("kanban.assignees")}
          </span>
        ) : issue?.users && Array.isArray(issue.users) && issue.users.length > 0 && !issue?.userIds ? (
          <span className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-secondary-foreground/30" />
            {issue.users.length} {t("kanban.users")}
          </span>
        ) : null}
      </div>

      {/* Footer Row: Timers & Dates */}
      <div className="mt-2 pt-3 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
        {!finished && remaining !== null ? (
          overdue ? (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive">
              <Clock className="size-3.5" />
              {t("kanban.overdue")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Timer className="size-3.5 opacity-70" />
              {t("kanban.remaining")}
              <span className="font-mono font-medium text-foreground/80">
                {formatRemaining(remaining, t("kanban.dayUnit"))}
              </span>
            </span>
          )
        ) : (
          <span /> 
        )}
        
        {formattedLastMessage && (
          <span className="text-[10px] font-medium text-muted-foreground/50 whitespace-nowrap">
            {formattedLastMessage}
          </span>
        )}
      </div>
    </div>
  );
}