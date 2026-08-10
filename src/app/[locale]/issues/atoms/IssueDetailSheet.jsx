"use client";

/*
  Props:
  - open, onOpenChange, issueId: string|null
  - fetchers: { getIssue, getMessages(id,q), reply(id,p), changeStatus(id,p), changePriority(id,p), assign(id,p), updateIssue(id,p), deleteIssue(id), markRead(id) }
  - permissions: { canUpdate, canDelete, canChangeStatus, canChangePriority, canAssign, canReply }
  - options: { statuses, causes, roles, users, locale }
  - onIssueDeleted: () => void
*/

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Info, MessageSquare, Clock, Package, AlertCircle, Edit2, Trash2,
  X, Inbox, Loader2, Timer, ExternalLink,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import IssueFormDialog from "./IssueFormDialog";
import MessagesPanel from "./MessagesPanel";

const shortId = (id) => (id ? String(id).slice(-6).toUpperCase() : "—");

const PRIORITY_COLORS = { low: "bg-emerald-500", medium: "bg-sky-500", high: "bg-amber-500", urgent: "bg-rose-500" };
const PRIORITY_BADGE = {
  low: "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10",
  medium: "text-sky-700 border-sky-200 bg-sky-50 dark:text-sky-400 dark:border-sky-500/30 dark:bg-sky-500/10",
  high: "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10",
  urgent: "text-rose-700 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-500/30 dark:bg-rose-500/10",
};
const STATUS_COLORS = { open: "bg-sky-500", in_progress: "bg-amber-500", resolved: "bg-emerald-500", closed: "bg-slate-400", pending: "bg-violet-500" };

const labelOf = (opt, locale = "en") => !opt ? "" :
  locale === "ar"
    ? (opt.nameAr || opt.nameEn || opt.name || opt.label || String(opt))
    : (opt.nameEn || opt.nameAr || opt.name || opt.label || String(opt));

const initials = (name) => {
  if (!name) return "?";
  const p = String(name).trim().split(/\s+/).slice(0, 2);
  return p.map((x) => x[0]?.toUpperCase() || "").join("") || "?";
};

const AVATAR_GRADS = [
  "from-primary/80 to-primary/50",
  "from-sky-600 to-sky-400",
  "from-violet-600 to-violet-400",
  "from-rose-600 to-rose-400",
  "from-amber-600 to-amber-400",
  "from-emerald-600 to-emerald-400",
];
const gradOf = (name) => {
  const s = String(name || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_GRADS[h % AVATAR_GRADS.length];
};

const timeAgo = (iso, locale = "en") => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const secs = Math.round((d.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(secs);
  if (abs < 60) return rtf.format(secs, "second");
  if (abs < 3600) return rtf.format(Math.round(secs / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(secs / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(secs / 86400), "day");
  return d.toLocaleDateString(locale);
};

const TERMINAL_STATUSES = ["solved", "cancelled", "done", "closed", "resolved"];
function statusCode(status) {
  if (!status) return "";
  if (typeof status === "string") return status;
  return status.code || status.nameEn || status.name || "";
}
function isFinished(status) {
  return TERMINAL_STATUSES.includes(statusCode(status).toLowerCase());
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

export default function IssueDetailSheet({
  open, onOpenChange, issueId, fetchers = {},
  permissions = {}, options = { statuses: [], causes: [], roles: [], users: [], locale: "en" },
  onIssueDeleted,
}) {
  const locale = useLocale() || options.locale || "en";
  const isRtl = locale === "ar";
  const t = useTranslations("issues");
  const {
    canUpdate = false, canDelete = false, canChangeStatus = false,
    canChangePriority = false, canAssign = false, canReply = false,
  } = permissions;

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [issueLoaded, setIssueLoaded] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fetchersRef = useRef(fetchers);
  fetchersRef.current = fetchers;

  const loadIssue = useCallback(async () => {
    if (!issueId || !fetchersRef.current.getIssue) return;
    setLoading(true);
    setIssueLoaded(false);
    try {
      const r = await fetchersRef.current.getIssue(issueId);
      const d = r?.data ?? r;
      setIssue(d || null);
    } finally {
      setLoading(false);
      setIssueLoaded(true);
    }
  }, [issueId]);

  useEffect(() => {
    if (open && issueId) {
      loadIssue();
      fetchersRef.current.markRead?.(issueId).catch(() => {});
    } else {
      setIssue(null);
      setIssueLoaded(false);
      setEditOpen(false);
    }
  }, [open, issueId, loadIssue]);

  const handleStatus = async (v) => {
    if (!canChangeStatus || !fetchersRef.current.changeStatus || !issueId) return;
    const prev = issue?.statusId;
    setIssue((i) => (i ? { ...i, statusId: v } : i));
    const r = await fetchersRef.current.changeStatus(issueId, { statusId: v });
    const d = r?.data ?? r;
    if (!d) setIssue((i) => (i ? { ...i, statusId: prev } : i));
  };

  const handlePriority = async (v) => {
    if (!canChangePriority || !fetchersRef.current.changePriority || !issueId) return;
    const prev = issue?.priority;
    setIssue((i) => (i ? { ...i, priority: v } : i));
    const r = await fetchersRef.current.changePriority(issueId, { priority: v });
    const d = r?.data ?? r;
    if (!d) setIssue((i) => (i ? { ...i, priority: prev } : i));
  };

  const handleDelete = () => {
    if (!canDelete || !fetchersRef.current.deleteIssue || !issueId) return;
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    setDeleting(true);
    fetchersRef.current.deleteIssue(issueId)
      .then(() => {
        onIssueDeleted?.(); onOpenChange?.(false);
        setDeleteConfirmOpen(false);
      })
      .finally(() => setDeleting(false));
  };

  const statusId = issue?.statusId || issue?.status?.id;
  const stat = (options.statuses || []).find((s) => s.id === statusId);
  const statusLabel = labelOf(stat, locale) || issue?.status?.name || issue?.statusName || t("sheet.unknown");
  const statusDot = STATUS_COLORS[issue?.status?.code || statusCode(stat) || statusId || "open"] || "bg-slate-400";
  const prio = String(issue?.priority || "medium").toLowerCase();
  const prioDot = PRIORITY_COLORS[prio] || "bg-slate-400";
  const prioBadge = PRIORITY_BADGE[prio] || PRIORITY_BADGE.medium;

  const dueAt = issue?.due_at || issue?.dueAt;
  const resolvedAt = issue?.resolved_at || issue?.resolvedAt;
  const finished = isFinished(issue?.status);
  const remaining = useCountdown(dueAt, !finished);
  const overdue =
  dueAt &&
  (
    (!resolvedAt && remaining !== null && remaining < 0) ||
    (resolvedAt && new Date(resolvedAt) > new Date(dueAt))
  );

  const assignedUsers = (() => {
    // Prefer populated issue.users relation (with .user embedded). Fallback to options.users match.
    if (issue?.users && Array.isArray(issue.users) && issue.users.length > 0) return issue.users;
    const ids = issue?.assignedEmployeeIds || issue?.assignedEmployees?.map?.((e) => e.id) || [];
    return (options.users || []).filter((u) => ids.includes(u.id));
  })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? "left" : "right"}
        showCloseButton={false}
        dir={isRtl ? "rtl" : "ltr"}
        className="sm:max-w-xl !w-[95vw] flex flex-col p-0 border-border/60"
      >
        {/* HEADER */}
        <SheetHeader className="relative border-b border-border/60 bg-gradient-to-r from-primary/[0.06] to-transparent px-5 py-4">
          <SheetClose asChild>
            <button
              type="button"
              className="absolute top-4 end-4 z-10 size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-4" />
              <span className="sr-only">{t("sheet.actions.close")}</span>
            </button>
          </SheetClose>
          <div className="flex items-center gap-3 pe-9">
            <div className="size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary">
              <Info className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              {!issue ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 w-32 rounded-md bg-muted/70" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-5 w-20 rounded-full bg-muted/60" />
                    <div className="h-5 w-24 rounded-full bg-muted/60" />
                  </div>
                  <div className="h-3 w-56 rounded-md bg-muted/50" />
                </div>
              ) : (
                <>
                  <SheetTitle className="text-base font-bold tracking-tight">
                    {t("sheet.issueNumber", { id: shortId(issue?.id || issueId) })}
                  </SheetTitle>
                  <SheetDescription className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn("gap-1.5 h-5 px-2 rounded-full text-[11px] font-semibold capitalize", prioBadge)}>
                      <span className={cn("size-1.5 rounded-full", prioDot)} />
                      {t("priority." + prio)}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 h-5 px-2 rounded-full text-[11px] font-semibold">
                      <span className={cn("size-1.5 rounded-full", statusDot)} />
                      {statusLabel}
                    </Badge>
                    {!finished && remaining !== null ? (
                      overdue ? (
                        <Badge variant="outline" className="gap-1.5 h-5 px-2 rounded-full text-[11px] font-bold border-destructive/40 text-destructive bg-destructive/5">
                          <Clock className="size-3" />
                          {t("kanban.overdue")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1.5 h-5 px-2 rounded-full text-[11px] font-medium border-primary/30 text-primary bg-primary/5">
                          <Timer className="size-3" />
                          {t("kanban.remaining")}
                          <span className="font-mono font-semibold tracking-tight">{formatRemaining(remaining, t("kanban.dayUnit"))}</span>
                        </Badge>
                      )
                    ) : null}
                  </SheetDescription>
                  {issue?.title && (
                    <p className="mt-2.5 text-sm font-semibold text-foreground/90 leading-snug truncate">{issue.title}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* BODY */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background/40">
          <Tabs defaultValue="details" className="flex-1 flex flex-col px-4 py-4 overflow-hidden">
            <TabsList className="mb-4 w-full grid grid-cols-2 bg-gradient-to-b from-muted/80 to-muted/50 border border-border/60 shadow-inner h-11 p-1">
              <TabsTrigger value="details" className="gap-2 h-full data-[state=active]:bg-card data-[state=active]:border-border/80 data-[state=active]:shadow-sm font-semibold text-[13px] transition-all duration-200 hover:text-foreground/90 data-[state=active]:text-primary">
                <Info className="size-4" />{t("sheet.tabs.details")}
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2 h-full data-[state=active]:bg-card data-[state=active]:border-border/80 data-[state=active]:shadow-sm font-semibold text-[13px] transition-all duration-200 hover:text-foreground/90 data-[state=active]:text-primary">
                <MessageSquare className="size-4" />{t("sheet.tabs.messages")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto pe-1.5 space-y-4 outline-none">
              {(!issueLoaded || loading) && <SheetSkeleton />}
              {issueLoaded && !loading && !issue && (
                <SheetEmpty icon={AlertCircle} title={t("sheet.notFound")} />
              )}
              {issueLoaded && !loading && issue && (<>
                <div dir={isRtl ? "rtl" : "ltr"} className="rounded-xl border border-border/50 bg-card p-3.5 space-y-4 shadow-sm">
                  <Field label={t("sheet.fields.title")}>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{issue.title || "—"}</p>
                  </Field>
                  <Field label={t("sheet.fields.description")}>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{issue.description || "—"}</p>
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t("sheet.fields.status")}>
                      {canChangeStatus ? (
                        <Select
                          value={String(statusId || "")}
                          onValueChange={handleStatus}>
                          <SelectTrigger><SelectValue placeholder={t("sheet.fields.selectStatus")} /></SelectTrigger>
                          <SelectContent>
                            {(options.statuses || []).map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>{labelOf(s, locale)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : <ValuePill dot={statusDot} label={statusLabel} />}
                    </Field>
                    <Field label={t("sheet.fields.priority")}>
                      {canChangePriority ? (
                        <Select
                          value={prio}
                          onValueChange={handlePriority}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["low", "medium", "high", "urgent"].map((p) => (
                              <SelectItem key={p} value={p} className="capitalize">{t("priority." + p)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={cn("gap-1.5 h-6 px-2 rounded-full text-[11px] font-semibold capitalize", prioBadge)}>
                          <span className={cn("size-1.5 rounded-full", prioDot)} />
                          {t("priority." + prio)}
                        </Badge>
                      )}
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t("sheet.fields.cause")}>
                      <p className="text-sm text-foreground">
                        {labelOf((options.causes || []).find((c) => c.id === (issue.causeId || issue.cause?.id)), locale)
                          || issue.cause?.name || "—"}
                      </p>
                    </Field>
                    <Field label={t("sheet.fields.estMinutes")}>
                      <p className="text-sm text-foreground">
                        {issue.estimatedMinutes != null ? t("sheet.fields.estMinutesSuffix", { count: issue.estimatedMinutes }) : "—"}
                      </p>
                    </Field>
                  </div>
                </div>

                {(issue.orderId || issue.order?.id) && (
                  <div dir={isRtl ? "rtl" : "ltr"} className="rounded-xl border border-border/50 bg-card p-3.5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground/80">
                        <Package className="size-3.5 text-primary" />{t("sheet.fields.linkedOrder")}
                      </div>
                      <Link
                        href={`/orders/details/${issue.orderId || issue.order?.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary/50 transition-colors duration-200"
                      >
                        <ExternalLink size={11} />
                        View
                      </Link>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-foreground font-mono tracking-wide">
                        #{issue.order?.orderNumber || String(issue.orderId || issue.order?.id).slice(-6).toUpperCase()}
                      </span>
                      {(issue.customerName || issue.order?.customerName) && (
                        <span className="text-sm text-foreground/80">{issue.customerName || issue.order.customerName}</span>
                      )}
                    </div>
                    {(issue.customerPhone || issue.order?.customerPhone) && (
                      <div className="text-xs text-muted-foreground font-mono" dir="ltr">{issue.customerPhone || issue.order.customerPhone}</div>
                    )}
                  </div>
                )}

                <div dir={isRtl ? "rtl" : "ltr"} className="rounded-xl border border-border/50 bg-card p-3.5 space-y-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t("sheet.fields.createdBy")}>
                      <div className="flex items-center gap-2">
                        <Avatar name={issue.createdByName || issue.createdBy?.name || issue.createdByUser?.name || "System"} />
                        <p className="text-sm text-foreground truncate">
                          {issue.createdByName || issue.createdBy?.name || issue.createdByUser?.name || t("sheet.system")}
                        </p>
                      </div>
                    </Field>
                    <Field label={t("sheet.fields.created")}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-sm text-foreground font-medium">
                          <Clock className="size-3.5 text-primary" />
                          {timeAgo(issue.created_at || issue.createdAt, locale) || "—"}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal ms-5">
                          {issue.created_at || issue.createdAt
                            ? new Date(issue.created_at || issue.createdAt).toLocaleString(locale, {
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </div>
                      </div>
                    </Field>
                  </div>
                </div>

                <div dir={isRtl ? "rtl" : "ltr"} className="rounded-xl border border-border/50 bg-card p-3.5 space-y-4 shadow-sm">
                  <Field label={t("sheet.fields.assignedRole")}>
                    <div className="inline-flex items-center gap-2 h-10 px-3.5 w-full rounded-md border border-border bg-muted/30 text-sm text-foreground/90 cursor-default">
                      <span className="size-2 rounded-full bg-primary/60" />
                      {labelOf((options.roles || []).find((r) => r.id === (issue.assignedRoleId || issue.assignedRole?.id)), locale)
                        || issue.assignedRole?.name || t("sheet.fields.unassigned")}
                    </div>
                  </Field>

                  <Field label={t("sheet.fields.assignedEmployees")}>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedUsers.length === 0
                        ? <span className="text-sm text-muted-foreground h-10 flex items-center">{t("sheet.fields.noneAssigned")}</span>
                        : assignedUsers.map((u) => {
                          const name = u.user?.name || "—";
                          return (
                            <Badge key={u.id || u.userId || name} variant="outline" className="py-1 h-7 bg-muted/50 text-foreground/90 border-border/70">
                              <span className="max-w-[180px] truncate">{name}</span>
                            </Badge>
                          );
                        })}
                    </div>
                  </Field>
                </div>
              </>)}
            </TabsContent>

            <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden outline-none">
              <MessagesPanel
                issueId={issueId}
                issueReady={Boolean(issueLoaded && !loading && issue)}
                canReply={canReply}
                getMessages={fetchersRef.current.getMessages}
                reply={fetchersRef.current.reply}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* FOOTER */}
        <SheetFooter className="border-t border-border/60 px-5 py-4 flex-row items-center gap-2 justify-between bg-background/60">
          <div className="flex gap-2 flex-wrap">
            {canUpdate && (
              <button type="button" className="btn btn-ghost btn-md" onClick={() => setEditOpen(true)} disabled={!issue}>
                <Edit2 className="size-3.5" />{t("sheet.actions.edit")}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn btn-ghost btn-md btn-danger"
                onClick={handleDelete}
                disabled={!issue || deleting}
              >
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                {deleting ? t("sheet.actions.deleting") : t("sheet.actions.delete")}
              </button>
            )}
          </div>
          <SheetClose asChild>
            <button type="button" className="btn btn-outline btn-md">
              {t("sheet.actions.close")}
            </button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t("sheet.actions.delete")}
        description={t("sheet.actions.confirmDelete")}
        confirmText={t("sheet.actions.delete")}
        cancelText={t("sheet.actions.cancel")}
        loading={deleting}
        onConfirm={confirmDelete}
      />

      {/* EDIT FORM */}
      <IssueFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        fetchers={{ updateIssue: fetchersRef.current.updateIssue }}
        options={options}
        initialData={issue}
        onUpdated={() => {
          setEditOpen(false);
          loadIssue();
        }}
      />
    </Sheet>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80">{label}</label>
      {children}
    </div>
  );
}

function ValuePill({ dot, label }) {
  return (
    <span className="inline-flex items-center gap-2 h-10 px-3.5 w-full rounded-md border border-border bg-background/60 text-sm text-foreground">
      <span className={cn("size-2 rounded-full", dot)} />
      {label}
    </span>
  );
}

function SheetEmpty({ icon: Icon = Inbox, title, className = "" }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-14 gap-3 text-center", className)}>
      <div className="size-12 rounded-2xl bg-muted/70 flex items-center justify-center text-muted-foreground/60">
        <Icon className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function SkeletonField({ labelW = "w-24", children }) {
  return (
    <div className="space-y-1.5">
      <div className={cn("h-3 rounded-md bg-muted/60", labelW)} />
      {children ?? <div className="h-5 rounded-md bg-muted/50" />}
    </div>
  );
}

function SheetSkeleton() {
  return (
    <div className="space-y-4 py-1 animate-pulse">
      {/* Card 1: title / description / status / priority / cause / estMinutes */}
      <div dir="ltr" className="rounded-xl border border-border/50 bg-card p-3.5 space-y-4 shadow-sm">
        <SkeletonField labelW="w-16" />
        <SkeletonField labelW="w-28">
          <div className="space-y-2">
            <div className="h-4 rounded-md bg-muted/50" />
            <div className="h-4 w-2/3 rounded-md bg-muted/50" />
          </div>
        </SkeletonField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonField labelW="w-14">
            <div className="h-10 rounded-md border border-border bg-muted/30" />
          </SkeletonField>
          <SkeletonField labelW="w-16">
            <div className="h-10 rounded-md border border-border bg-muted/30" />
          </SkeletonField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonField labelW="w-12" />
          <SkeletonField labelW="w-20" />
        </div>
      </div>

      {/* Card 2: linked order */}
      <div dir="ltr" className="rounded-xl border border-border/50 bg-card p-3.5 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="size-3.5 rounded-md bg-primary/20" />
          <div className="h-3 w-24 rounded-md bg-muted/60" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-16 rounded-md bg-muted/50" />
          <div className="h-4 w-24 rounded-md bg-muted/50" />
        </div>
        <div className="h-3 w-36 rounded-md bg-muted/40" />
      </div>

      {/* Card 3: createdBy / created */}
      <div dir="ltr" className="rounded-xl border border-border/50 bg-card p-3.5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonField labelW="w-20">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-muted/60" />
              <div className="h-4 w-24 rounded-md bg-muted/50" />
            </div>
          </SkeletonField>
          <SkeletonField labelW="w-14">
            <div className="flex items-center gap-1.5">
              <div className="size-3.5 rounded-md bg-muted/50" />
              <div className="h-4 w-20 rounded-md bg-muted/50" />
            </div>
            <div className="h-3 w-32 ms-5 rounded-md bg-muted/40" />
          </SkeletonField>
        </div>
      </div>

      {/* Card 4: assignedRole / assignedEmployees */}
      <div dir="ltr" className="rounded-xl border border-border/50 bg-card p-3.5 space-y-4 shadow-sm">
        <SkeletonField labelW="w-20">
          <div className="h-10 rounded-md border border-border bg-muted/30" />
        </SkeletonField>
        <SkeletonField labelW="w-28">
          <div className="flex flex-wrap gap-1.5">
            <div className="h-7 w-20 rounded-full bg-muted/50" />
            <div className="h-7 w-24 rounded-full bg-muted/50" />
            <div className="h-7 w-16 rounded-full bg-muted/40" />
          </div>
        </SkeletonField>
      </div>
    </div>
  );
}

function Avatar({ name = "", initials: init, className = "" }) {
  const letters = init || initials(name);
  return (
    <div className={cn("shrink-0 size-8 rounded-full bg-gradient-to-br text-white text-[11px] font-semibold flex items-center justify-center shadow-sm", gradOf(name), className)}>
      {letters}
    </div>
  );
}
