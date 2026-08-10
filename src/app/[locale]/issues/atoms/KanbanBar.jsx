"use client";

import * as React from "react";
import { Edit2, Trash2, FileDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import KanbanIssueCard from "./KanbanIssueCard";

export function pickName(status, locale = "en") {
  if (!status) return "";
  const key = String(locale).toLowerCase() === "ar" ? "nameAr" : "nameEn";
  return status[key] || status.nameEn || status.nameAr || status.name || "";
}

function IconBtn({ title, disabled, onClick, icon: Icon, className }) {
  const btn = (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg",
        disabled && "opacity-40 pointer-events-none",
        className
      )}
    >
      <Icon className="size-3.5" />
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side="top">{title}</TooltipContent>
    </Tooltip>
  );
}

function GhostDropPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="shrink-0 w-full min-h-[160px] rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 pointer-events-none"
    />
  );
}

export default function KanbanBar({
  status,
  issues = [],
  locale = "en",
  onEdit,
  onDelete,
  onExport,
  onIssueClick,
  onCardEdit,
  canEditIssue = true,
  renderCard,
  onCardDrop,
  permissionFlags = {},
  isDragTarget = false,
  onDragTargetChange,
  hasNextPage = false,
  onLoadMore,
  loadingMore = false,
  className,
  ...props
}) {
  const {
    canEditStatus = true,
    canDeleteStatus = true,
    canExport = true,
    canChangeStatus = true,
  } = permissionFlags;

  const tc = useTranslations("common");
  const t = useTranslations("issues");

  const isSystem = !!status?.system;
  const hasIssues = ((status?.issueCount ?? 0) > 0) || (issues?.length ?? 0) > 0;
  const editDisabled = isSystem || !canEditStatus;
  const deleteDisabled = isSystem || !canDeleteStatus || hasIssues;
  const exportDisabled = !canExport;

  const [localOver, setLocalOver] = React.useState(false);
  const isOver = onDragTargetChange ? isDragTarget : localOver;
  const onDragTargetChangeRef = React.useRef(onDragTargetChange);
  onDragTargetChangeRef.current = onDragTargetChange;

  const setTarget = (over) => {
    if (onDragTargetChangeRef.current) onDragTargetChangeRef.current(over);
    else setLocalOver(over);
  };

  React.useEffect(() => {
    const clearTarget = () => setTarget(false);
    const onDocDragLeave = (e) => {
      if (e.target === document.documentElement) setTarget(false);
    };
    document.addEventListener("dragend", clearTarget);
    document.addEventListener("drop", clearTarget);
    document.addEventListener("dragleave", onDocDragLeave);
    return () => {
      document.removeEventListener("dragend", clearTarget);
      document.removeEventListener("drop", clearTarget);
      document.removeEventListener("dragleave", onDocDragLeave);
    };
  }, []);

  const handleDragOver = (e) => {
    if (!canChangeStatus || !onCardDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    autoScrollContainer(e);
  };

  const autoScrollContainer = (e) => {
    const scroller = e.currentTarget.closest?.("[data-kanban-scroller]");
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    const EDGE = 64;
    const STEP = 18;
    if (e.clientX < rect.left + EDGE) {
      scroller.scrollLeft -= STEP;
    } else if (e.clientX > rect.right - EDGE) {
      scroller.scrollLeft += STEP;
    }
  };

  const handleDragEnter = (e) => {
    if (!canChangeStatus || !onCardDrop || !status?.id) return;
    e.preventDefault();
    setTarget(true);
  };

  const handleDragLeave = (e) => {
    if (!canChangeStatus || !onCardDrop || !status?.id) return;
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setTarget(false);
    }
  };

  const handleDrop = (e) => {
    if (!canChangeStatus || !onCardDrop || !status?.id) return;
    e.preventDefault();
    setTarget(false);
    const issueId = e.dataTransfer?.getData("issueId") || null;
    if (issueId) onCardDrop(issueId, status.id);
  };

  const renderIssueCard = (issue) => {
    if (typeof renderCard === "function") {
      return renderCard(issue, status);
    }
    return (
      <KanbanIssueCard
        key={issue?.id || Math.random()}
        issue={issue}
        onClick={onIssueClick}
        onEdit={canEditIssue ? onCardEdit : undefined}
        draggable={canChangeStatus}
        onDragStart={(e) => {
          if (issue?.id) e.dataTransfer?.setData("issueId", String(issue.id));
        }}
      />
    );
  };

  const statusColor = status?.color || "#94a3b8";

  return (
    <div
      className={cn(
        "flex flex-col min-w-[280px] w-[280px] max-w-[320px] rounded-xl overflow-hidden shadow-sm transition-all",
        "border border-border/60 bg-white dark:bg-zinc-950 h-full min-h-[500px]",
        className
      )}
      {...props}
    >
      {/* Inspired top accent bar using the dynamic status color */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: statusColor }}
      />

      <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-zinc-900/30 border-b border-border/40 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="size-2.5 rounded-full shrink-0 shadow-sm ring-2 ring-white dark:ring-zinc-950"
            style={{ backgroundColor: statusColor }}
          />
          <h3 className="text-sm font-bold tracking-tight text-foreground flex-1 break-words whitespace-normal leading-snug">
            {pickName(status, locale)}
          </h3>

          {/* Dynamically tinted badge based on status color */}
          <Badge
            variant="primary"
            className="h-5.5 px-2.5 rounded-full text-[11px] font-semibold border"
            style={{
              backgroundColor: `${statusColor}15`, // 15 adds roughly 8% opacity in hex
              color: statusColor,
              borderColor: `${statusColor}30`
            }}
          >
            {typeof status?.issueCount === "number"
              ? status.issueCount
              : issues?.length || 0}
          </Badge>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground">
          <IconBtn
            title={isSystem ? t("statuses.system") : tc("edit")}
            disabled={editDisabled}
            onClick={() => onEdit && onEdit(status)}
            icon={Edit2}
            className="hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded-md"
          />
          <IconBtn
            title={
              isSystem
                ? t("statuses.system")
                : hasIssues
                  ? t("statuses.deleteUsedDesc", {
                    count: status?.issueCount ?? issues?.length ?? 0,
                  })
                  : tc("delete")
            }
            disabled={deleteDisabled}
            onClick={() => onDelete && onDelete(status)}
            icon={Trash2}
            className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-md"
          />
          <IconBtn
            title={tc("export")}
            disabled={exportDisabled}
            onClick={() => onExport && onExport(status)}
            icon={FileDown}
            className="hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded-md"
          />
        </div>
      </div>

      <div
        className="flex-1 min-h-[400px] overflow-y-auto p-2.5 flex flex-col gap-2.5 bg-slate-50/30 dark:bg-zinc-950/20"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {issues?.length === 0 ? (
          isOver && canChangeStatus ? (
            <GhostDropPlaceholder />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[150px] mt-2 mb-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-muted-foreground/60 text-center px-4">
              <span className="mb-1 text-lg opacity-40">📥</span>
              {t("kanban.empty")}
            </div>
          )
        ) : (
          <>
            {issues.map(renderIssueCard)}
            {isOver && canChangeStatus && <GhostDropPlaceholder />}
          </>
        )}

        {hasNextPage && (
          <div className="shrink-0 px-2 pb-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full rounded-lg border border-dashed",
                "border-border/60 bg-background/50",
                "text-muted-foreground",
                "hover:border-border hover:bg-muted/60 hover:text-foreground",
                "dark:bg-background/20 dark:hover:bg-muted/40",
              )}
              onClick={() => onLoadMore?.()}
              disabled={loadingMore}
            >
              <Loader2
                className={cn(
                  "size-3.5",
                  loadingMore && "animate-spin",
                )}
              />

              <span>
                {loadingMore
                  ? t("kanban.loading")
                  : t("kanban.loadMore")}
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}