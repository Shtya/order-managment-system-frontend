"use client";

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import {
  MessageSquare, Loader2, Send, Inbox,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PrimaryBtn } from "@/components/atoms/Button";

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

const labelOf = (opt, locale = "en") => !opt ? "" :
  locale === "ar"
    ? (opt.nameAr || opt.nameEn || opt.name || opt.label || String(opt))
    : (opt.nameEn || opt.nameAr || opt.name || opt.label || String(opt));

const SENDING_PLACEHOLDER_ID = "__sending__";

function Avatar({ name = "", initials: init, className = "" }) {
  const letters = init || initials(name);
  return (
    <div className={cn("shrink-0 size-8 rounded-full bg-gradient-to-br text-white text-[11px] font-semibold flex items-center justify-center shadow-sm", gradOf(name), className)}>
      {letters}
    </div>
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

function MessagesSkeleton() {
  return (
    <div className="space-y-3 py-1 animate-pulse">
      {[0, 1, 2, 3].map((i) => {
        const own = i % 2 === 1;
        return (
          <div key={i} className={cn("flex gap-2.5 items-start", own && "flex-row-reverse")}>
            <div className="shrink-0 size-8 rounded-full bg-muted/70" />
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "rounded-2xl border px-3.5 py-2.5 shadow-sm space-y-2",
                  own
                    ? "rounded-tr-md bg-primary/10 border-primary/25"
                    : "rounded-tl-md bg-card border-border/50",
                )}
              >
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="h-3.5 w-24 rounded-md bg-muted/70" />
                  <div className="h-2.5 w-16 rounded-md bg-muted/50" />
                </div>
                <div className="h-3 w-full rounded-md bg-muted/60" />
                <div className="h-3 w-3/4 rounded-md bg-muted/60" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MessagesPanel({
  issueId,
  issueReady,     // issue object (truthy) when loaded
  canReply = false,
  getMessages,    // (issueId, query) => promise
  reply,          // (issueId, {message}) => promise
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("issues");
  const { user: me } = useAuth();
  const { subscribe } = useSocket();
  const meId = me?.id;

  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");

  const lastRef = useRef({ issueId: null });
  const scrollRef = useRef(null);
  const shouldStickBottomRef = useRef(true);
  const issueIdRef = useRef(issueId);
  issueIdRef.current = issueId;

  /* ── Realtime: append/edit messages pushed over the socket ── */
  useEffect(() => {
    if (!subscribe) return undefined;
    const offs = [
      subscribe("ISSUE_MESSAGE_CREATED", (payload) => {
        const msg = payload?.message || payload;
        if (!msg?.id) return;
        if (String(msg.issueId) !== String(issueIdRef.current)) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          shouldStickBottomRef.current = true;
          return [...prev, msg];
        });
      }),
      subscribe("ISSUE_MESSAGE_UPDATED", (payload) => {
        const msg = payload?.message || payload;
        if (!msg?.id) return;
        if (String(msg.issueId) !== String(issueIdRef.current)) return;
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)),
        );
      }),
    ];
    return () => offs.forEach((off) => off?.());
  }, [subscribe]);

  const loadFn = useRef(getMessages);
  loadFn.current = getMessages;
  const replyFn = useRef(reply);
  replyFn.current = reply;
  
  const fetchPage = useCallback(async (cursorVal = null, append = false) => {
    if (!issueId || !loadFn.current) return;
    try {
      if (append) setLoadingMore(true);
      else setInitialLoading(true);
      const r = await loadFn.current(issueId, {
        cursor: cursorVal,
        limit: 30,
        sortDir: "ASC",
      });
      const d = r?.data ?? r;
      const raw = d?.items || d?.records || d?.messages || d || [];
      // Backend ASC → oldest first at [0], newest at last. Render top→bottom matches ASC.
      const normalized = raw;
      setMessages((prev) => (append ? [...prev, ...normalized] : normalized));
      setCursor(d?.nextCursor || d?.cursor || null);
      setHasMore(Boolean(d?.hasMore));
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, [issueId]);

  /* Reset when sheet reopens with a new (or cleared) issueId */
  useEffect(() => {
    if (!issueId) {
      setMessages([]);
      setCursor(null);
      setHasMore(false);
      setInitialLoading(false);
      setLoadingMore(false);
      setReplyText("");
      setSending(false);
      lastRef.current.issueId = null;
      return undefined;
    }
    if (lastRef.current.issueId !== issueId) {
      lastRef.current.issueId = issueId;
      fetchPage(null, false);
    }
    return undefined;
  }, [issueId, fetchPage]);

  /* Auto-scroll to bottom for new messages. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (shouldStickBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, initialLoading, loadingMore, sending]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distToBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    shouldStickBottomRef.current = distToBottom < 80;
  };

  const handleSend = async () => {
    if (!canReply || !replyFn.current || !issueId || !replyText.trim() || sending) return;
    const text = replyText.trim();

    setSending(true);
    setReplyText("");

    const meLabel = isRtl ? "أنت" : "You";
    const myInitials = initials(labelOf(me, locale) || meLabel);
    const senderName = labelOf(me, locale) || meLabel;

    const optimistic = {
      id: `tmp-${Date.now()}`,
      message: text,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      senderId: meId,
      sender: me ? {
        id: me.id,
        name: me.name || me.fullName || meLabel,
        nameEn: me.nameEn,
        nameAr: me.nameAr,
      } : undefined,
      senderName,
      senderInitials: myInitials,
      own: true,
      optimistic: true,
    };

    // Append to bottom (since it's the newest message)
    setMessages((prev) => [...prev, optimistic]);
    shouldStickBottomRef.current = true;

    try {
      const r = await replyFn.current(issueId, { message: text });
      const saved = r?.data ?? r;
      if (saved) {
        const withOwn = {
          ...saved,
          own: String(saved.senderId ?? saved.sender?.id) === String(meId),
          optimistic: false,
        };
        setMessages((prev) => {
          const withoutTmp = prev.filter((m) => m.id !== optimistic.id);
          // The socket may have already delivered this message → avoid duplicates.
          if (withoutTmp.some((m) => m.id === saved.id)) return withoutTmp;
          return [...withoutTmp, withOwn];
        });
      } else {
        // No error but no data — remove optimistic placeholder
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setReplyText(text);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const ordered = useMemo(() => messages, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden outline-none" dir={isRtl ? "rtl" : "ltr"}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto pe-1.5 space-y-3"
      >
        {initialLoading && <MessagesSkeleton />}

        {!initialLoading && !hasMore && messages.length === 0 && !sending && !issueReady
          ? null
          : null}

        {!initialLoading && hasMore && (
          <div className="text-center">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fetchPage(cursor, true)}
              disabled={loadingMore}
            >
              {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {loadingMore ? t("sheet.loadingMore") : t("sheet.loadMore")}
            </button>
          </div>
        )}

        {!initialLoading && messages.length === 0 && !loadingMore && !sending && (
          <SheetEmpty icon={MessageSquare} title={t("sheet.noMessages")} />
        )}

        {!initialLoading && ordered.map((m) => {
          const senderId = m.senderId ?? m.sender?.id ?? m.userId;
          const own = m.own !== undefined
            ? Boolean(m.own)
            : (meId ? String(senderId) === String(meId) : false);
          const senderName =
            m.senderName ||
            labelOf(m.sender, locale) ||
            labelOf(m.user, locale) ||
            m.userName ||
            (own ? (isRtl ? "أنت" : "You") : "");
          const initialsArg =
            m.senderInitials ||
            (m.sender ? initials(labelOf(m.sender, locale) || "U") : null) ||
            (own ? initials(me?.name || (isRtl ? "أنت" : "You")) : null);
          const ts = m.createdAt || m.created_at || m.date;
          return (
            <div key={m.id} className={cn("flex gap-2.5 items-start", own && "flex-row-reverse")}>
              <Avatar name={senderName || (own ? (isRtl ? "أنت" : "You") : "U")} initials={initialsArg} />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "rounded-2xl border border-border/50 px-3.5 py-2.5 shadow-sm relative",
                  own ? "rounded-tr-md bg-primary/10 border-primary/25" : "rounded-tl-md bg-card",
                  m.optimistic && "opacity-80",
                )}>
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-foreground">
                      {senderName || t("sheet.unknown")}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/70 whitespace-nowrap inline-flex items-center gap-1">
                      {m.optimistic && <span className="inline-flex items-center gap-0.5 text-[10px]"><Loader2 className="size-2.5 animate-spin" />{t("sheet.sending")}</span>}
                      {ts && timeAgo(ts, locale)}
                    </span>
                  </div>
                  {(m.isEdited || m.edited || m.isDeleted || m.deleted) && (
                    <div className="flex gap-1.5 mt-1">
                      {(m.isEdited || m.edited) && <Badge variant="outline" className="text-[10px] py-0 h-4">{t("sheet.edited")}</Badge>}
                      {(m.isDeleted || m.deleted) && <Badge variant="outline" className="text-[10px] py-0 h-4 text-destructive border-destructive/30">{t("sheet.deleted")}</Badge>}
                    </div>
                  )}
                  <p className="text-[13px] text-foreground/90 whitespace-pre-wrap mt-1 leading-relaxed">
                    {m.message || m.body || m.text || m.content || ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {sending && !messages.some((m) => m.optimistic) && (
          <div className={cn("flex gap-2.5 items-start", true && "flex-row-reverse")}>
            <Avatar name={isRtl ? "أنت" : "You"} initials={initials(me?.name || (isRtl ? "أنت" : "You"))} />
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl rounded-tr-md bg-primary/10 border border-primary/25 px-3.5 py-2.5 shadow-sm inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span className="text-[12px] font-medium">{t("sheet.sending")}…</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {canReply && (
        <div className="mt-3 pt-3 border-t border-border/60 bg-background/70 rounded-b-xl">
          <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-2">
            <Textarea
              rows={2}
              resize="none"
              className="flex-1"
              placeholder={t("sheet.replyPlaceholder")}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={!issueReady || sending}
              onKeyDown={onKeyDown}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-muted-foreground/50 hidden sm:inline">Ctrl + Enter ↵</span>
              <PrimaryBtn
                onClick={handleSend}
                loading={sending}
                disabled={!issueReady || !replyText.trim()}
                className="ms-auto shrink-0"
              >
                {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {sending ? t("sheet.sending") : t("sheet.send")}
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
