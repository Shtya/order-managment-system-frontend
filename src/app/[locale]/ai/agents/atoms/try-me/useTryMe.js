"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useSocket } from "@/context/SocketContext";

export const TRY_ME_TEXT_LIMIT = 4096;
export const TRY_ME_CAPTION_LIMIT = 1024;
export const TRY_ME_VOICE_SECONDS = 180;
export const TRY_ME_MAX_FILE_MB = {
  image: 5,
  video: 16,
  document: 100,
  audio: 16,
};

export function buildTryMeSnapshot(agent, customerId) {
  if (!agent) return null;
  return {
    id: agent.id,
    name: agent.name,
    language: agent.language,
    gender: agent.gender,
    customInstructions: agent.customInstructions ?? null,
    responseProviderId:
      agent.responseProviderId || agent.responseProvider?.id || null,
    isActive: agent.isActive,
    knowledgeIds: agent.knowledgeIds || [],
    capabilities: agent.capabilities || [],
    acceptImage: !!agent.acceptImage,
    acceptVideo: !!agent.acceptVideo,
    acceptDocument: !!agent.acceptDocument,
    acceptAudio: !!agent.acceptAudio,
    handoffAssignedRoleId: agent.handoffAssignedRoleId ?? null,
    handoffEmployeeIds: agent.handoffEmployeeIds || [],
    handoffEstimatedMinutes: agent.handoffEstimatedMinutes ?? null,
    handoffPriority: agent.handoffPriority ?? undefined,
    handoffStatusId: agent.handoffStatusId ?? null,
    ...(customerId ? { customerId } : {}),
  };
}

function interactiveTypeKey(value) {
  return String(value || "").toLowerCase().replace(/_/g, "");
}

function mapInteractivePayload(data, base) {
  const interactive = data?.interactive || {};
  const kind = interactiveTypeKey(interactive.type);
  if (kind === "locationrequestmessage" || interactive?.action?.name === "send_location") {
    return {
      ...base,
      messageType: "interactive",
      content: {
        interactive: {
          type: "location_request_message",
          body: { text: interactive.body?.text || "" },
          action: { name: "send_location" },
        },
      },
    };
  }
  if (kind === "button" || interactive.type === "button") {
    return {
      ...base,
      messageType: "interactive",
      content: { interactive },
    };
  }
  if (kind === "list" || interactive.type === "list") {
    return {
      ...base,
      messageType: "interactive",
      content: { interactive },
    };
  }
  return null;
}

export function mapAssistantBubble(bubble) {
  const base = {
    id: bubble.id,
    role: "assistant",
    status: "sent",
    createdAt: bubble.createdAt || new Date().toISOString(),
  };

  if (bubble.type === "reaction") {
    return {
      ...base,
      messageType: "reaction",
      content: {
        reaction: {
          message_id: bubble.targetId,
          emoji: bubble.emoji || bubble.text,
        },
      },
    };
  }

  if (bubble.type === "location_request") {
    return {
      ...base,
      messageType: "interactive",
      content: {
        interactive: {
          type: "location_request_message",
          body: { text: bubble.body || bubble.text || "" },
          action: { name: "send_location" },
        },
      },
    };
  }

  switch (bubble.type) {
    case "image":
      return {
        ...base,
        messageType: "image",
        content: {
          image: { link: bubble.url, caption: bubble.caption },
        },
      };
    case "buttons":
      return {
        ...base,
        messageType: "interactive",
        content: {
          interactive: {
            type: "button",
            body: { text: bubble.body || "" },
            action: {
              buttons: (bubble.buttons || []).map((btn) => ({
                type: "reply",
                reply: { id: btn.id, title: btn.title },
              })),
            },
          },
        },
      };
    case "list":
      return {
        ...base,
        messageType: "interactive",
        content: {
          interactive: {
            type: "list",
            header: bubble.header
              ? { type: "text", text: bubble.header }
              : undefined,
            body: { text: bubble.body || "" },
            footer: bubble.footer ? { text: bubble.footer } : undefined,
            action: {
              button: bubble.buttonText,
              sections: [{ rows: bubble.rows || [] }],
            },
          },
        },
      };
    case "template":
      return {
        ...base,
        messageType: "template",
        content: { template: { name: bubble.text } },
        metadata: {
          template: {
            templateConfig: { bodyText: bubble.text || "" },
          },
        },
      };
    default: {
      if (typeof bubble.text === "string" && bubble.text.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(bubble.text);
          if (parsed?.type === "reaction") {
            return {
              ...base,
              messageType: "reaction",
              content: {
                reaction: {
                  message_id: parsed.reaction?.message_id,
                  emoji: parsed.reaction?.emoji,
                },
              },
            };
          }
          const mapped = mapInteractivePayload(parsed, base);
          if (mapped) return mapped;
        } catch {
          /* keep as text */
        }
      }
      return {
        ...base,
        messageType: "text",
        content: { text: { body: bubble.text || "" } },
      };
    }
  }
}

function applyReactionToMessages(prev, reaction) {
  const targetId = reaction?.message_id;
  const emoji = reaction?.emoji;
  if (!emoji) return prev;
  let matchedId = null;
  const next = prev.map((msg) => {
    const isTarget =
      targetId && (msg.id === targetId || msg.inboundId === targetId);
    if (!isTarget) return msg;
    matchedId = msg.id;
    const reactions = [...(msg.reactions || [])];
    if (reactions.some((row) => (row.emoji || row) === emoji)) return msg;
    return { ...msg, reactions: [...reactions, { emoji, createdAt: new Date().toISOString() }] };
  });
  if (matchedId) return next;
  const last = [...prev].reverse().find((msg) => msg.role === "user");
  if (!last) return prev;
  if ((last.reactions || []).some((row) => (row.emoji || row) === emoji)) return prev;
  return prev.map((msg) =>
    msg.id === last.id
      ? {
          ...msg,
          reactions: [...(msg.reactions || []), { emoji, createdAt: new Date().toISOString() }],
        }
      : msg,
  );
}

function buildUserMessage({ id, text, file, kind, preview, duration, location }) {
  const createdAt = new Date().toISOString();
  if (location?.latitude != null && location?.longitude != null) {
    return {
      id,
      role: "user",
      messageType: "location",
      status: "pending",
      createdAt,
      retryPayload: { location },
      content: { location },
    };
  }
  if (kind === "audio" && (file || preview)) {
    return {
      id,
      role: "user",
      messageType: "audio",
      status: "uploading",
      createdAt,
      retryPayload: { text, file, kind, preview, duration },
      content: {
        audio: {
          localUrl: preview,
          mime_type: file?.type,
          filename: file?.name,
          duration,
        },
      },
    };
  }
  if (kind && file) {
    const media = {
      localUrl: preview,
      mime_type: file.type,
      filename: file.name,
      name: file.name,
      caption: text || undefined,
    };
    return {
      id,
      role: "user",
      messageType: kind,
      status: "uploading",
      createdAt,
      retryPayload: { text, file, kind, preview, duration },
      content: {
        [kind]: media,
        caption: text || undefined,
      },
    };
  }
  return {
    id,
    role: "user",
    messageType: "text",
    status: "pending",
    createdAt,
    retryPayload: { text },
    content: { text: { body: text || "" } },
  };
}

async function postTryMeMessage(hashId, { text, file, kind, location }) {
  if (file) {
    const fd = new FormData();
    fd.append("hashId", hashId);
    if (text) fd.append("text", text);
    if (kind) fd.append("kind", kind);
    fd.append("file", file, file.name || "file");
    return api.post("/agents/try-me/message", fd, { timeout: 180000 });
  }
  return api.post("/agents/try-me/message", {
    hashId,
    ...(text ? { text } : {}),
    ...(location ? { location } : {}),
  });
}

export default function useTryMe() {
  const t = useTranslations("agents");
  const { subscribe } = useSocket() || {};

  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [agent, setAgent] = useState(null);
  const [hashId, setHashId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [processingStatus, setProcessingStatus] = useState("idle");
  const [lastErrors, setLastErrors] = useState([]);
  const [stale, setStale] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [customerId, setCustomerId] = useState(null);
  const [customer, setCustomer] = useState(null);

  const hashIdRef = useRef(null);
  const collapsedRef = useRef(false);
  const staleToastRef = useRef(false);
  const agentUpdatedAtRef = useRef(null);
  const sessionGenRef = useRef(0);

  useEffect(() => {
    hashIdRef.current = hashId;
  }, [hashId]);

  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);

  const patchMessage = useCallback((id, updater) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? updater(msg) : msg)),
    );
  }, []);

  const endRemoteSession = useCallback(async () => {
    try {
      await api.delete("/agents/try-me/session");
    } catch {
      /* session may already be gone */
    }
  }, []);

  const startSession = useCallback(
    async (agentRow, nextCustomerId = customerId) => {
      const generation = ++sessionGenRef.current;
      hashIdRef.current = null;
      setHashId(null);
      setMessages([]);
      setLastErrors([]);
      setProcessingStatus("idle");
      setUnreadCount(0);
      const snapshot = buildTryMeSnapshot(agentRow, nextCustomerId);
      const res = await api.post("/agents/try-me/session", snapshot);
      if (generation !== sessionGenRef.current) return null;
      const nextHash = res.data?.hashId;
      setHashId(nextHash);
      hashIdRef.current = nextHash;
      setAgent(agentRow);
      agentUpdatedAtRef.current = agentRow.updatedAt || null;
      setStale(false);
      staleToastRef.current = false;
      return nextHash;
    },
    [customerId],
  );

  const open = useCallback(
    async (row) => {
      if (!row?.id) return;
      setIsOpen(true);
      setCollapsed(false);
      setUnreadCount(0);
      if (agent?.id === row.id && hashId) {
        return;
      }
      setSessionLoading(true);
      try {
        if (hashId) await endRemoteSession();
        const res = await api.get(`/agents/${row.id}`);
        const full = res.data;
        setCustomerId(null);
        setCustomer(null);
        await startSession(full, null);
      } catch (error) {
        toast.error(normalizeAxiosError(error) || t("tryMe.sessionFailed"));
        setIsOpen(false);
      } finally {
        setSessionLoading(false);
      }
    },
    [agent?.id, endRemoteSession, hashId, startSession, t],
  );

  const close = useCallback(async () => {
      setIsOpen(false);
      setCollapsed(false);
      sessionGenRef.current += 1;
      await endRemoteSession();
      setHashId(null);
      hashIdRef.current = null;
    setAgent(null);
    setMessages([]);
    setLastErrors([]);
    setProcessingStatus("idle");
    setUnreadCount(0);
    setStale(false);
    setCustomerId(null);
    setCustomer(null);
  }, [endRemoteSession]);

  const shrink = useCallback(() => {
    setCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    setCollapsed(false);
    setUnreadCount(0);
  }, []);

  const resetSession = useCallback(async () => {
    if (!agent) return;
    setSessionLoading(true);
    try {
      await startSession(agent, customerId);
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("tryMe.sessionFailed"));
    } finally {
      setSessionLoading(false);
    }
  }, [agent, customerId, startSession, t]);

  const refreshSession = useCallback(async () => {
    if (!agent?.id) return;
    setSessionLoading(true);
    try {
      const res = await api.get(`/agents/${agent.id}`);
      await startSession(res.data, customerId);
      toast.success(t("tryMe.refreshed"));
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("tryMe.sessionFailed"));
    } finally {
      setSessionLoading(false);
    }
  }, [agent?.id, customerId, startSession, t]);

  const markStale = useCallback(() => {
    if (!isOpen) return;
    setStale(true);
    if (!staleToastRef.current) {
      staleToastRef.current = true;
      toast(t("tryMe.staleAgent"), { duration: 5000 });
    }
  }, [isOpen, t]);

  const checkStaleFromRow = useCallback(
    (row) => {
      if (!isOpen || !agent?.id || row?.id !== agent.id) return;
      const next = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
      const prev = agentUpdatedAtRef.current
        ? new Date(agentUpdatedAtRef.current).getTime()
        : 0;
      if (next && prev && next > prev) markStale();
    },
    [agent?.id, isOpen, markStale],
  );

  const changeCustomer = useCallback(
    async (nextCustomer) => {
      if (!agent) return;
      const nextId = nextCustomer?.customerId || null;
      setCustomerId(nextId);
      setCustomer(nextCustomer || null);
      setSessionLoading(true);
      try {
        await startSession(agent, nextId);
      } catch (error) {
        toast.error(normalizeAxiosError(error) || t("tryMe.sessionFailed"));
      } finally {
        setSessionLoading(false);
      }
    },
    [agent, startSession, t],
  );

  const send = useCallback(
    async ({ text, file, kind, preview, duration, localId, location }) => {
      const currentHash = hashIdRef.current;
      if (!currentHash) {
        toast.error(t("tryMe.sessionExpired"));
        return;
      }
      const trimmed = String(text || "").trim();
      const id = localId || crypto.randomUUID();
      const optimistic = buildUserMessage({
        id,
        text: trimmed,
        file,
        kind,
        preview,
        duration,
        location,
      });

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === id)) {
          return prev.map((msg) => (msg.id === id ? { ...optimistic, id } : msg));
        }
        return [...prev, optimistic];
      });
      setLastErrors([]);
      setSending(true);
      try {
        const res = await postTryMeMessage(currentHash, {
          text: trimmed,
          file,
          kind,
          location,
        });
        const inboundId = res.data?.inboundId;
        if (hashIdRef.current !== currentHash) return;
        patchMessage(id, (msg) => ({
          ...msg,
          inboundId,
          status: "sent",
          error: undefined,
        }));
      } catch (error) {
        if (hashIdRef.current !== currentHash) return;
        const message =
          normalizeAxiosError(error) || t("tryMe.sendFailed");
        patchMessage(id, (msg) => ({
          ...msg,
          status: "failed",
          error: message,
        }));
        toast.error(message);
      } finally {
        setSending(false);
      }
    },
    [patchMessage, t],
  );

  const markChoice = useCallback((messageId, actionKey) => {
    if (!messageId || !actionKey) return;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const used = msg.usedActionIds || [];
        if (used.includes(actionKey)) return msg;
        return { ...msg, usedActionIds: [...used, actionKey] };
      }),
    );
  }, []);

  const retry = useCallback(
    (message) => {
      if (!message?.retryPayload) return;
      return send({ ...message.retryPayload, localId: message.id });
    },
    [send],
  );

  useEffect(() => {
    if (!isOpen || !subscribe) return undefined;
    const off = subscribe("agents:try-me", (payload) => {
      if (!payload?.hashId || payload.hashId !== hashIdRef.current) return;

      if (payload.kind === "inbound") {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.inboundId && msg.inboundId === payload.inboundId) {
              return { ...msg, status: msg.status === "failed" ? msg.status : "sent" };
            }
            if (
              !msg.inboundId &&
              msg.role === "user" &&
              (msg.status === "uploading" || msg.status === "pending")
            ) {
              return { ...msg, inboundId: payload.inboundId, status: "sent" };
            }
            return msg;
          }),
        );
        return;
      }

      if (payload.kind === "status") {
        setProcessingStatus(payload.status || "idle");
        return;
      }

      if (payload.kind === "messages") {
        const incoming = [];
        const reactions = [];
        for (const bubble of payload.messages || []) {
          const mapped = mapAssistantBubble(bubble);
          if (mapped.messageType === "reaction") {
            reactions.push(mapped.content.reaction);
            continue;
          }
          incoming.push(mapped);
        }
        if (reactions.length) {
          setMessages((prev) =>
            reactions.reduce((acc, reaction) => applyReactionToMessages(acc, reaction), prev),
          );
        }
        if (incoming.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((msg) => msg.id));
            const next = incoming.filter((msg) => !seen.has(msg.id));
            return next.length ? [...prev, ...next] : prev;
          });
          if (collapsedRef.current) {
            setUnreadCount((count) => count + incoming.length);
          }
        }
        return;
      }

      if (payload.kind === "errors") {
        const errors = payload.errors || [];
        setLastErrors(errors);
        const first = errors[0];
        if (first?.message) {
          toast.error(first.message);
          setMessages((prev) => {
            const lastUser = [...prev].reverse().find((msg) => msg.role === "user");
            if (!lastUser) return prev;
            return prev.map((msg) =>
              msg.id === lastUser.id
                ? { ...msg, error: first.message, status: first.fatal ? "failed" : msg.status }
                : msg,
            );
          });
        }
        return;
      }

      if (payload.kind === "failed") {
        const message = payload.message || t("tryMe.sendFailed");
        setProcessingStatus("idle");
        setLastErrors([
          { source: "turn", code: "FAILED", message, fatal: true },
        ]);
        toast.error(message);
      }
    });
    return () => off?.();
  }, [isOpen, subscribe, t]);

  return {
    isOpen,
    collapsed,
    sessionLoading,
    sending,
    agent,
    hashId,
    messages,
    processing: processingStatus === "gathering" || processingStatus === "running",
    processingStatus,
    lastErrors,
    stale,
    unreadCount,
    customerId,
    customer,
    open,
    close,
    shrink,
    expand,
    send,
    retry,
    markChoice,
    resetSession,
    refreshSession,
    markStale,
    checkStaleFromRow,
    changeCustomer,
  };
}
