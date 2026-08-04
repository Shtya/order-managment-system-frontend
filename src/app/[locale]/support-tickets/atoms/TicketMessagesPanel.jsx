"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Send,
  ChevronUp,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MessageBubble from "./MessageBubble";
import AttachmentUploader from "./AttachmentUploader";
import { useSupportTicketEvents } from "@/hook/useSupportTickets";
import { TERMINAL_STATUSES } from "@/constants/support-ticket";

export default function TicketMessagesPanel({
  scope = "tenant",
  embedded = false,
  ticketId,
  ticketStatus,
  currentUserId,
  getMessages,
  onReply,
  onMessageSent,
  onPreviewAttachment,
  onDownloadAttachment,
}) {
  const t = useTranslations("supportTickets");
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState([]);
  const [internalNote, setInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  const isTerminal = TERMINAL_STATUSES.includes(ticketStatus);

  const scrollToBottom = useCallback((behavior = "auto") => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior,
      });
    });
  }, []);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMessages(ticketId, { limit: 50, sortDir: "DESC" });
      setMessages(data?.records || []);
      setCursor(data?.nextCursor);
      setHasMore(!!data?.hasMore);
    } catch {
      setMessages([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [getMessages, ticketId, scrollToBottom]);

  const loadEarlier = useCallback(async () => {
    if (!cursor || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const data = await getMessages(ticketId, {
        limit: 50,
        sortDir: "DESC",
        cursor,
      });
      const older = data?.records || [];
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const unique = older.filter((m) => !ids.has(m.id));
        return [...prev, ...unique];
      });
      setCursor(data?.nextCursor);
      setHasMore(!!data?.hasMore);
    } finally {
      setLoadingEarlier(false);
    }
  }, [cursor, getMessages, loadingEarlier, ticketId]);

  useEffect(() => {
    if (ticketId) loadFirst();
  }, [ticketId, loadFirst]);

  useSupportTicketEvents({
    onMessageCreated: (payload) => {
      const msg = payload?.data || payload?.message || payload;
      if (!msg || msg.ticketId !== ticketId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev],
      );
      scrollToBottom("smooth");
    },
  });

  const handleSend = async () => {
    if (!draft.trim() && files.length === 0) return;
    if (sending || isTerminal) return;
    setSending(true);
    try {
      const result = await onReply?.({
        message: draft.trim(),
        isInternalNote: scope === "admin" ? internalNote : false,
        files,
      });
      if (result) {
        const msg = result?.data?.data || result?.data || result;
        if (msg?.id) {
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev],
          );
        }
        onMessageSent?.(msg, files.length);
        setDraft("");
        setFiles([]);
        setInternalNote(false);
        scrollToBottom("smooth");
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const display = [...messages].reverse();

  return (
    <div
      className={
        embedded
          ? "h-full min-h-0 flex flex-col overflow-hidden"
          : "main-card rounded-2xl border border-border/50 flex flex-col overflow-hidden h-[calc(100vh-80px)] min-h-[720px]"
      }
    >
      <div
        ref={listRef}
        className="h-[600px] overflow-y-auto custom-scrollbar px-5 py-5 bg-[color-mix(in_oklab,var(--muted)_20%,transparent)]"
      >
        <div className="min-h-full flex flex-col justify-end">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : display.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              {t("chat.noMessages")}
            </p>
          ) : (
            <>
              {/* Load earlier must stay at the TOP */}
              {hasMore && (
                <div className="flex justify-center pb-5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={loadEarlier}
                    disabled={loadingEarlier}
                    className="gap-1.5 h-8 text-xs"
                  >
                    {loadingEarlier ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                    {t("form.loadEarlier")}
                  </Button>
                </div>
              )}

              <div className="space-y-5">
                {display.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    scope={scope}
                    currentUserId={currentUserId}
                    onPreview={(attachmentId) =>
                      onPreviewAttachment?.(ticketId, attachmentId)
                    }
                    onDownload={(attachmentId, name) =>
                      onDownloadAttachment?.(ticketId, attachmentId, name)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-border/40 px-3 py-2 space-y-2 bg-card flex-shrink-0">
        {scope === "admin" && !isTerminal && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Switch
              checked={internalNote}
              onCheckedChange={setInternalNote}
              disabled={sending}
              className="scale-90"
            />
            <span className="text-[11px] font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-500" />
              {t("form.internalNote")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t("form.internalNoteHint")}
            </span>
          </label>
        )}

        {isTerminal ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3">
            <span className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </span>
            <div className="text-start min-w-0">
              <p className="text-sm font-semibold text-foreground/80">
                {t("status.closed")} / {t("status.canceled")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("chat.locked")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("form.messagePlaceholder")}
              className="rounded-xl min-h-[56px] max-h-[110px] text-sm leading-relaxed"
              disabled={sending}
              maxLength={10000}
            />
            <AttachmentUploader
              files={files}
              onChange={setFiles}
              disabled={sending}
            />
            <div className="flex items-center justify-end gap-2 pt-0.5">
              <span className="text-[10px] text-muted-foreground me-auto">
                Ctrl + Enter
              </span>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending || (!draft.trim() && files.length === 0)}
                className="gap-1.5 h-8 text-xs"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {t("form.send")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
