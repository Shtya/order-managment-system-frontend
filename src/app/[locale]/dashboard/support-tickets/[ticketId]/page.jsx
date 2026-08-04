"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  LockOpen,
  Flag,
  RotateCcw,
  MessageSquare,
  History,
  ClipboardList,
  User as UserIcon,
  Clock,
  Paperclip,
  CircleDot
} from "lucide-react";
import PageHeader from "@/components/atoms/Pageheader";
import TicketMessagesPanel from "../../../support-tickets/atoms/TicketMessagesPanel";
import ActivityTimeline from "../../../support-tickets/atoms/ActivityTimeline";
import StatusDialog from "../../../support-tickets/atoms/StatusDialog";
import PriorityDialog from "../../../support-tickets/atoms/PriorityDialog";
import { TicketStatusBadge, TicketPriorityBadge } from "../../../support-tickets/atoms/TicketBadges";
import {
  useSupportTickets,
  useSupportTicketEvents,
} from "@/hook/useSupportTickets";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TERMINAL_STATUSES, TICKET_STATUS } from "@/constants/support-ticket";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { cn } from "@/utils/cn";

const TABS = [
  { key: "messages", labelKey: "tabs.conversation", icon: MessageSquare },
  { key: "activity", labelKey: "tabs.activity", icon: History },
];

export default function AdminTicketDetailPage() {
  const t = useTranslations("supportTickets");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params.ticketId;

  const {
    loading,
    getTicket,
    getMessages,
    getActivity,
    reply,
    markRead,
    changeStatus,
    changePriority,
    downloadAttachment,
    openPreview,
  } = useSupportTickets("admin");

  const [ticket, setTicket] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const activityLoadingRef = useRef(false);

  const loadDetail = useCallback(async () => {
    const data = await getTicket(ticketId);
    setTicket(data);
    if (data?.unreadSupportCount > 0) {
      markRead(ticketId);
    }
    return data;
  }, [getTicket, markRead, ticketId]);

  const loadActivity = useCallback(async () => {
    if (activityLoadingRef.current) return;
    activityLoadingRef.current = true;
    setActivityLoading(true);
    try {
      const data = await getActivity(ticketId);
      setActivities(Array.isArray(data) ? data : data?.records || []);
    } finally {
      activityLoadingRef.current = false;
      setActivityLoading(false);
    }
  }, [getActivity, ticketId]);

  useEffect(() => {
    // Reload activity every time the activity tab is visited.
    if (activeTab === "activity") loadActivity();
  }, [activeTab, loadActivity]);

  useEffect(() => {
    if (ticketId) {
      loadDetail();
    }
  }, [ticketId, loadDetail]);

  useSupportTicketEvents({
    onUpdated: () => loadDetail(),
    onMessageCreated: (payload) => {
      const msg = payload?.data || payload?.message || payload;
      if (msg && msg.ticketId === ticketId) {
        setTicket((prev) => {
          if (!prev) return prev;
          const newAttachments = Array.isArray(msg.attachments)
            ? msg.attachments.length
            : 0;
          return {
            ...prev,
            messageCount: (prev.messageCount ?? 0) + 1,
            attachmentCount: (prev.attachmentCount ?? 0) + newAttachments,
          };
        });
      }
      loadDetail();
    },
  });

  const handleStatus = useCallback(
    async (status, reason) => {
      setMutating(true);
      try {
        const res = await changeStatus(ticketId, status, reason);
        if (res) {
          await loadDetail();
          return true;
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [changeStatus, loadDetail, ticketId],
  );

  const handlePriority = useCallback(
    async (priority) => {
      setMutating(true);
      try {
        const res = await changePriority(ticketId, priority);
        if (res) {
          await loadDetail();
          return true;
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [changePriority, loadDetail, ticketId],
  );

  const handleReopen = useCallback(async () => {
    setMutating(true);
    try {
      await changeStatus(ticketId, TICKET_STATUS.REOPENED);
      await loadDetail();
    } finally {
      setMutating(false);
    }
  }, [changeStatus, loadDetail, ticketId]);

  const breadcrumbs = useMemo(
    () => [
      { name: t("breadcrumb.home"), href: "/dashboard" },
      {
        name: t("breadcrumb.adminTickets"),
        onClick: () => router.push(`/${locale}/dashboard/support-tickets`),
      },
      { name: t("breadcrumb.details") },
    ],
    [t, locale, router],
  );

  const isTerminal = TERMINAL_STATUSES.includes(ticket?.status);
  const messageCount = ticket?.messageCount ?? ticket?.messages?.length ?? 0;
  const attachmentCount = ticket?.attachmentCount ?? 0;

  const format = (d) =>
    d
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(d))
      : "—";
  const ticketShortCode = `#TK-${String(ticket?.id || "").replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const assigned = ticket?.assignedSupportUser;
  const createdBy = ticket?.createdByUser;
  const tenant = ticket?.admin;
  const lastActor = ticket?.lastMessageByUser || ticket?.assignedSupportUser;

  return (
    <div className="min-h-screen p-5">
      <PageHeader breadcrumbs={breadcrumbs} />

      {loading && !ticket ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ============= RIGHT SIDEBAR ============= */}
          <aside className="lg:col-span-1 space-y-5 order-2">
            {/* --- تفاصيل التذكرة --- */}
            <div className="main-card rounded-2xl border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{t("sidebar.ticketDetails")}</h3>
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-2.5">
                 <SidebarRow
                    icon={<CircleDot size={18} />}
                  label={t("columns.status")}
                  value={<TicketStatusBadge status={ticket?.status} />}
                  active
                />
                <SidebarRow
                    icon={<Flag size={18} />}
                  label={t("columns.priority")}
                  value={<TicketPriorityBadge priority={ticket?.priority} />}
                />
                <SidebarRow icon={<UserIcon className="w-4 h-4 text-blue-500" />} label={t("columns.createdBy")} value={UserChip(createdBy)} />
                <SidebarRow icon={<UserIcon className="w-4 h-4 text-amber-500" />} label={t("columns.tenant")} value={UserChip(tenant, ticket?.adminId)} />
                <SidebarRow icon={<UserIcon className="w-4 h-4 text-purple-500" />} label={t("columns.assignedSupport")} value={assigned ? UserChip(assigned) : <span className="text-xs text-muted-foreground">{t("sidebar.unassigned")}</span>} />
                <SidebarRow icon={<Clock className="w-4 h-4 text-muted-foreground" />} label={t("filters.created_at")} textValue={format(ticket?.created_at)} />
                <SidebarRow icon={<Clock className="w-4 h-4 text-muted-foreground" />} label={t("filters.lastMessageAt")} textValue={format(ticket?.lastMessageAt)} />
                <SidebarRow icon={<Clock className="w-4 h-4 text-rose-500" />} label={t("activity.last")} textValue={format(ticket?.updated_at)} />
              </div>
            </div>

            {/* --- ملخص التذكرة --- */}
            <div className="main-card rounded-2xl border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{t("sidebar.ticketSummary")}</h3>
                <ClipboardList className="w-4 h-4 text-muted-foreground rotate-180" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-2 pb-3 border-b border-border/50">
                <SummaryStat label={t("sidebar.messages")} value={messageCount} />
                <SummaryStat label={t("sidebar.attachments")} value={attachmentCount} />
              </div>
              {lastActor && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">{t("sidebar.lastActor")}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">{lastActor.name}</span>
                    <Avatar className="w-6 h-6"><AvatarImage src={avatarSrc(lastActor.image)} /><AvatarFallback className="text-[9px] font-bold">{(lastActor.name || "AD").slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                  </div>
                </div>
              )}
            </div>

            {/* --- إجراءات سريعة --- */}
            {/* <div className="main-card rounded-2xl border border-border/50 p-4 space-y-3">
              <h3 className="text-sm font-bold">{t("sidebar.quickActions")}</h3>
              <div className="grid grid-cols-2 gap-2">
                <QAction label={t("actions.status")} icon={<TicketStatusBadge asIcon status="in_progress" mini />} onClick={() => setStatusOpen(true)} />
                <QAction label={t("actions.priority")} icon={<TicketPriorityBadge asIcon priority="high" mini />} onClick={() => setPriorityOpen(true)} />
              </div>
            </div> */}
          </aside>

          {/* ============= LEFT MAIN COLUMN ============= */}
          <section className="lg:col-span-2 space-y-4 order-1">
            {/* Ticket header bar with actions */}
            <div className="main-card rounded-2xl border border-border/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0 flex-1 flex gap-1">
                  <h1 className="text-lg font-extrabold text-foreground leading-tight truncate max-w-[420px]">{ticket?.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {ticket?.status && <TicketStatusBadge asIcon status={ticket.status} />}
                      {ticket?.priority && <TicketPriorityBadge asIcon priority={ticket.priority} />}
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Paperclip className="w-3.5 h-3.5" /></span>
                    <span className="text-[11px] font-mono text-muted-foreground tracking-wide">{ticketShortCode}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isTerminal ? (
                  <Button
                    size="sm"
                    variant="default"
                    className="text-white"
                    onClick={handleReopen}
                    disabled={mutating}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t("actions.reopen")}
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setPriorityOpen(true)} disabled={mutating}>
                      <Flag className="w-4 h-4" />
                      {t("actions.priority")}
                    </Button>
                    <Button size="sm" variant="default" className="text-white" onClick={() => setStatusOpen(true)} disabled={mutating}>
                      <LockOpen className="w-4 h-4" />
                      {t("actions.status")}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Card with tabs + content */}
            <div className="main-card rounded-2xl border border-border/50 flex flex-col overflow-hidden min-h-[680px]">
              <div className="px-3 pt-3 flex items-center gap-1 border-b border-border/50 bg-card">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={cn("relative px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg flex items-center gap-1.5", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                      <Icon className="w-4 h-4" />
                      {t(tab.labelKey)}
                      {active && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-primary rounded-full" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === "messages" ? (
                  <TicketMessagesPanel
                    scope="admin"
                    ticketId={ticketId}
                    ticketStatus={ticket?.status}
                    currentUserId={user?.id}
                    getMessages={getMessages}
                    onReply={(payload) => reply(ticketId, payload)}
                    onMessageSent={(msg, sentFilesCount) => {
                      if (!msg?.id) return;
                      setTicket((prev) => {
                        if (!prev) return prev;
                        const newAttachments = Array.isArray(msg.attachments)
                          ? msg.attachments.length
                          : sentFilesCount || 0;
                        return {
                          ...prev,
                          messageCount: (prev.messageCount ?? 0) + 1,
                          attachmentCount:
                            (prev.attachmentCount ?? 0) + newAttachments,
                        };
                      });
                      loadDetail();
                    }}
                    onPreviewAttachment={(id, attachmentId) => openPreview(id, attachmentId)}
                    onDownloadAttachment={(id, attachmentId, name) => downloadAttachment({ ticketId: id, attachmentId, originalName: name })}
                    embedded
                  />
                ) : (
                  <div className="h-full overflow-y-auto custom-scrollbar p-5 bg-[color-mix(in_oklab,var(--muted)_20%,transparent)]">
                    <ActivityTimeline activities={activities} loading={activityLoading} />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      <StatusDialog open={statusOpen} onOpenChange={setStatusOpen} ticket={ticket} onSubmit={handleStatus} loading={mutating} />
      <PriorityDialog open={priorityOpen} onOpenChange={setPriorityOpen} ticket={ticket} onSubmit={handlePriority} loading={mutating} />
    </div>
  );
}

/* ---------- small helpers ---------- */
function UserChip(user, fallbackId) {
  const name = user?.name || fallbackId || "?";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar className="w-6 h-6 flex-shrink-0">
        <AvatarImage src={avatarSrc(user?.image)} />
        <AvatarFallback className="text-[9px] font-bold">{String(name).slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="text-xs font-semibold text-foreground truncate">{name}</span>
    </div>
  );
}
function SidebarRow({ icon, label, value, textValue }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/30 last:border-b-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">{icon}</span>
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="min-w-0 text-start">{textValue ? <span className="text-xs font-semibold text-foreground">{textValue}</span> : value}</div>
    </div>
  );
}
function SummaryStat({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-extrabold tabular-nums text-foreground">{value ?? 0}</span>
      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  );
}
function QAction({ label, icon, disabled, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn("flex flex-col items-center gap-1.5 rounded-xl border border-border/60 px-2 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed")}>
      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
      <span className="text-[10px] font-semibold text-foreground">{label}</span>
    </button>
  );
}
