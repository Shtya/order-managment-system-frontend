"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { avatarSrc } from "@/components/atoms/UserSelect";

function relativeTime(date, locale) {
  if (!date) return "";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", {
    numeric: "auto",
  });
  if (Math.abs(sec) < 60) return rtf.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(-min, "minute");
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(-hr, "hour");
  const day = Math.round(hr / 24);
  return rtf.format(-day, "day");
}

function authorInitial(name) {
  const s = String(name || "").trim();
  return s ? s[0] : "؟";
}

function NotesListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse py-1" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="w-8 h-8 rounded-full bg-muted-foreground/20" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
            <div className="h-2.5 bg-muted-foreground/10 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NoteCard({ note, locale }) {
  const avatarUrl = note.author?.avatarUrl || note.avatarUrl;
  return (
    <div className="flex items-start gap-2 py-1.5">
      {avatarUrl ? (
        <img
          src={avatarSrc(avatarUrl)}
          alt={note.authorName || ""}
          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-6 h-6 rounded-full grid place-items-center bg-primary/10 text-primary font-bold text-[10px] shrink-0 mt-0.5">
          {authorInitial(note.authorName)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold text-foreground truncate">
            {note.authorName}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {relativeTime(note.created_at, locale)}
          </span>
        </div>
        <p className="text-xs leading-snug text-muted-foreground whitespace-pre-wrap break-words mt-0.5">
          {note.body}
        </p>
      </div>
    </div>
  );
}

export default function OrderInternalNotesDialog({
  open,
  onClose,
  order,
  onOrderPatched,
}) {
  const t = useTranslations("orders.internalNotes");
  const locale = useLocale();
  const { user } = useAuth();
  const { subscribe } = useSocket() || {};
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const onOrderPatchedRef = useRef(onOrderPatched);
  onOrderPatchedRef.current = onOrderPatched;

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const orderId = order?.id;
  const orderNumber = order?.orderNumber;

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notes, setNotes] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const applyUnread = useCallback(
    (value) => {
      onOrderPatchedRef.current?.(orderId, {
        myUnreadCount: Number(value || 0),
      });
    },
    [orderId],
  );

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }, []);

  const loadFirst = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/${orderId}/internal-notes`, {
        params: { limit: 50, sortDir: "DESC" },
      });
      setNotes(data?.records || []);
      setCursor(data?.nextCursor);
      setHasMore(!!data?.hasMore);
    } catch (err) {
      setNotes([]);
      toast.error(normalizeAxiosError(err));
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [orderId, scrollToBottom]);

  const loadMore = useCallback(async () => {
    if (!orderId || !cursor || loadingMore) return;
    const el = listRef.current;
    const prevHeight = el?.scrollHeight || 0;
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/orders/${orderId}/internal-notes`, {
        params: { limit: 50, sortDir: "DESC", cursor },
      });
      setNotes((prev) => [...prev, ...(data?.records || [])]);
      setCursor(data?.nextCursor);
      setHasMore(!!data?.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    } finally {
      setLoadingMore(false);
    }
  }, [orderId, cursor, loadingMore]);

  const markRead = useCallback(async () => {
    if (!orderId) return;
    try {
      await api.patch(`/orders/${orderId}/internal-notes/read`);
      applyUnread(0);
      setNotes((prev) => prev.map((n) => ({ ...n, isUnreadForMe: false })));
    } catch {
      // still show notes if mark-read fails
    }
  }, [orderId, applyUnread]);

  useEffect(() => {
    if (!open || !orderId) return undefined;
    setDraft("");
    loadFirst();
    markRead();
    return undefined;
  }, [open, orderId, loadFirst, markRead]);

  useEffect(() => {
    if (!open || !subscribe || !orderId) return undefined;
    const offs = [
      subscribe("ORDER_INTERNAL_NOTE_CREATED", (payload) => {
        if (payload?.orderId !== orderId || !payload?.note) return;
        setNotes((prev) => {
          if (prev.some((n) => n.id === payload.note.id)) return prev;
          return [payload.note, ...prev];
        });
        onOrderPatchedRef.current?.(orderId, {
          lastInternalNote: payload.lastInternalNote || payload.note,
          lastInternalNoteAt: payload.note?.created_at,
          myUnreadCount: Number(
            payload.internalNotesUnreadCounts?.[user?.id] || 0,
          ),
        });
        scrollToBottom();
      }),
      subscribe("ORDER_INTERNAL_NOTE_READ", (payload) => {
        if (payload?.orderId !== orderId) return;
        if (payload?.readByUserId === user?.id) {
          applyUnread(0);
          setNotes((prev) =>
            prev.map((n) => ({ ...n, isUnreadForMe: false })),
          );
        }
      }),
    ];
    return () => offs.forEach((off) => off?.());
  }, [open, subscribe, orderId, user?.id, applyUnread, scrollToBottom]);

  const addNote = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/orders/${orderId}/internal-notes`, {
        body,
      });
      const note = data?.data;
      setDraft("");
      if (note) {
        setNotes((prev) => [note, ...prev.filter((n) => n.id !== note.id)]);
        onOrderPatchedRef.current?.(orderId, {
          lastInternalNote: note,
          lastInternalNoteAt: note.created_at,
          myUnreadCount: 0,
        });
      }
      applyUnread(0);
      scrollToBottom();
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    } finally {
      setSending(false);
      focusInput();
    }
  };

  const chronological = [...notes].reverse();
  
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          focusInput();
        }}
        className="!max-w-[420px] w-[min(420px,94vw)] p-0 gap-0 overflow-hidden rounded-xl border border-border shadow-xl max-h-[70vh] flex flex-col"
      >
        <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-foreground">{t("title")}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t("orderNumber", { number: orderNumber || "—" })}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted border-0 cursor-pointer text-lg leading-none text-foreground"
            aria-label={t("close")}
          >
            ×
          </button>
        </div>

        <div ref={listRef} className="px-3 py-2 overflow-y-auto min-h-[200px] max-h-[300px]">
          {loading ? (
            <NotesListSkeleton />
          ) : (
            <>
              {hasMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full mb-1 py-1 text-[11px] font-semibold text-primary"
                >
                  {loadingMore ? (
                    <Loader2 className="inline animate-spin" size={12} />
                  ) : (
                    t("loadMore")
                  )}
                </button>
              ) : null}
              {chronological.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-8">
                  {t("empty")}
                </div>
              ) : (
                chronological.map((note) => (
                  <NoteCard key={note.id} note={note} locale={locale} />
                ))
              )}
            </>
          )}
        </div>

        <div className="p-3 border-t border-border shrink-0 bg-background">
          <div className="flex items-end gap-2 rounded-sm border border-border bg-muted/30 px-2 py-1.5">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addNote();
                }
              }}
              maxLength={2000}
              placeholder={t("placeholder")}
              rows={2}
              className="flex-1 min-h-[45px] max-h-[120px] border-0 outline-none resize-none bg-transparent text-sm text-foreground focus-visible:!outline-none"
            />
            <button
              type="button"
              onClick={addNote}
              disabled={sending || !draft.trim()}
              className="h-8 w-8 rounded-md bg-primary text-white grid place-items-center shrink-0 disabled:opacity-50"
              aria-label={t("add")}
            >
              {sending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OrderInternalNoteCell({ order, onOpen }) {
  const t = useTranslations("orders.internalNotes");
  const body = order?.lastInternalNote?.body;
  const unread = Number(order?.myUnreadCount || 0);
  return (
    <button
      type="button"
      onClick={() => onOpen?.(order)}
      className="min-w-[180px] max-w-[260px] flex items-center gap-2 border border-border rounded-lg px-2 py-1.5 cursor-pointer hover:bg-primary/5 hover:border-primary/40 text-start"
    >
      <span className="w-6 h-6 rounded-full grid place-items-center bg-primary/10 text-primary shrink-0">
        <MessageCircle size={12} />
      </span>
      <span
        className={cn(
          "overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-xs",
          body ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {body || t("addNote")}
      </span>
      {unread > 0 ? (
        <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-white grid place-items-center text-[10px] font-bold">
          {unread}
        </span>
      ) : null}
    </button>
  );
}
