"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/utils/api";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import { useTranslations } from "next-intl";
import { cacheMediaUrl, checkIfMediaUploadNeeded, handleMediaUpload } from "@/utils/whatsapp-healper";
import { usePathname, useRouter } from "@/i18n/navigation";

const ConversationContext = createContext();

export const useConversation = () => useContext(ConversationContext);

export const ConversationProvider = ({ children }) => {
    const t = useTranslations("chats");
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const customerIdFromUrl = searchParams.get("customerId");
    const { settings } = useOrdersSettings();
    const scrollRef = useRef(null);
    const prevScrollHeight = useRef(0);
    const listScrollRef = useRef(null);
    const prevListScrollTop = useRef(null);

    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const { subscribe, isConnected } = useSocket();
    const { user, isTestUser } = useAuth();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [mobileView, setMobileView] = useState("list"); // 'list', 'chat', 'details'
    const [showDetails, setShowDetails] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [pendingMedia, setPendingMedia] = useState(null);
    const [cursor, setCursor] = useState(null);
    const [isNearBottom, setIsNearBottom] = useState(true);

    const [unreadCount, setUnreadCount] = useState(0);
    const [humanHandoffCount, setHumanHandoffCount] = useState(0);
    const lastUnreadRef = useRef(new Map());
    const lastHandoffRef = useRef(new Map());

    const rememberUnread = useCallback((id, nextUnread) => {
        if (!id) return;
        const next = Math.max(0, Number(nextUnread) || 0);
        const prev = lastUnreadRef.current.has(id)
            ? lastUnreadRef.current.get(id)
            : 0;
        lastUnreadRef.current.set(id, next);
        if (prev === 0 && next > 0) setUnreadCount((n) => n + 1);
        else if (prev > 0 && next === 0) setUnreadCount((n) => Math.max(0, n - 1));
    }, []);

    const rememberHandoff = useCallback((id, nextHandoff) => {
        if (!id) return;
        const next = !!nextHandoff;
        const prev = lastHandoffRef.current.has(id)
            ? !!lastHandoffRef.current.get(id)
            : false;
        lastHandoffRef.current.set(id, next);
        if (!prev && next) setHumanHandoffCount((n) => n + 1);
        else if (prev && !next) setHumanHandoffCount((n) => Math.max(0, n - 1));
    }, []);

    // Unified function to check isNearBottom
    const checkIsNearBottom = useCallback(() => {
        if (!scrollRef.current) return true;
        return (scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight) <= 200;
    }, []);

    const markAsRead = useCallback(async (conversationId, onFailIncreaseOne = false) => {
        if (!conversationId) return;

        let previousUnreadCount = lastUnreadRef.current.has(conversationId)
            ? lastUnreadRef.current.get(conversationId)
            : 0;
        setConversations(prev => prev.map(c => {
            if (c.id === conversationId) {
                previousUnreadCount = c.unreadCount || 0;
                return { ...c, unreadCount: 0 };
            }
            return c;
        }));
        rememberUnread(conversationId, 0);

        try {
            await api.post("/whatsapp/messages/mark-as-read", { conversationId });
        } catch (error) {
            console.error("Failed to mark as read:", error);
            const restored = previousUnreadCount ? previousUnreadCount : onFailIncreaseOne ? 1 : 0;
            rememberUnread(conversationId, restored);
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, unreadCount: restored } : c
            ));
        }
    }, [rememberUnread]);

    const bottomSentinelRef = useRef(null);
    const convId = selectedConversation?.id;
    useEffect(() => {
        if (!convId || !scrollRef.current || !bottomSentinelRef.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsNearBottom(entry.isIntersecting);
            if (entry.isIntersecting
                && (lastUnreadRef.current.get(convId) || 0) > 0
                && document.visibilityState === "visible") {
                markAsRead(convId);
            }
        }, { root: scrollRef.current, rootMargin: "0px 0px 200px 0px", threshold: 0 });
        observer.observe(bottomSentinelRef.current);
        return () => observer.disconnect();
    }, [convId, markAsRead]);

    const currentUnreadCount = useMemo(() => {
        const id = selectedConversation?.id;
        if (!id) return 0;
        const conv = conversations.find((c) => c.id === id);
        if (conv) return conv.unreadCount || 0;
        return lastUnreadRef.current.get(id) || 0;
    }, [selectedConversation?.id, conversations]);

    const scrollToBottom = useCallback((behavior = "smooth") => {
        const element = document.getElementById("messages-end");

        if (element) {
            element.scrollIntoView({
                behavior,
                block: "end",
            });
        }
    }, []);
    // Real Data States
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [search, setSearch] = useState("");
    const PAGE_LIMIT = 50;
    const SORT_BY = "lastMessageAt";

    // Message Pagination & Filter States
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [initialMessagesLoading, setInitialMessagesLoading] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [messagesCursor, setMessagesCursor] = useState(null);
    const [messageSearch, setMessageSearch] = useState("");
    const [messageStatus, setMessageStatus] = useState("all");
    const [messageAccount, setMessageAccount] = useState("all");
    const MESSAGES_LIMIT = 50;
    const previousConversationId = useRef(null);
    const isAutoScrolling = useRef(false);
    const listFetchGen = useRef(0);
    const selectedConversationRef = useRef(selectedConversation);
    selectedConversationRef.current = selectedConversation;
    const activeConvIdRef = useRef(selectedConversation?.id);
    activeConvIdRef.current = selectedConversation?.id;
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;
    const messagesRef = useRef(messages);
    messagesRef.current = messages;
    const conversationsRef = useRef(conversations);
    conversationsRef.current = conversations;
    const fetchAccounts = useCallback(async () => {
        setAccountsLoading(true);
        try {
            const res = await api.get("/whatsapp-accounts", { params: { limit: 200, page: 1, isActive: "true" } });
            const values = Array.isArray(res.data?.records) ? res.data.records : []
            setAccounts(values);
        } catch (e) {
            console.error("Failed to fetch accounts:", e);
        } finally {
            setAccountsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const accountsRef = useRef(accounts);
    accountsRef.current = accounts;

    const applyAccountFromMessage = useCallback((message) => {
        const accountId = message?.accountId;
        if (!accountId || message?.messageType === "reaction") return;
        const account = accountsRef.current.find((item) => item.id === accountId);
        if (!account) return;
        setSelectedAccount((prev) => (prev?.id === account.id ? prev : account));
    }, []);

    useEffect(() => {
        if (!accounts.length) return;

        const defaultAcc =
            accounts.find((item) => item.id === settings?.defaultWhatsAppAccountId) ||
            accounts[0];

        if (!selectedConversation?.id) {
            setSelectedAccount((prev) => prev || defaultAcc || null);
            return;
        }

        if (initialMessagesLoading) return;

        const latestInThread = [...messages]
            .reverse()
            .find(
                (item) =>
                    item?.conversationId === selectedConversation.id &&
                    item?.accountId &&
                    item.messageType !== "reaction",
            );
        const latest = latestInThread || selectedConversation.lastMessage;

        if (latest?.accountId && latest.messageType !== "reaction") {
            applyAccountFromMessage(latest);
            return;
        }

        if (defaultAcc) setSelectedAccount(defaultAcc);
    }, [
        selectedConversation?.id,
        accounts,
        initialMessagesLoading,
        settings?.defaultWhatsAppAccountId,
        applyAccountFromMessage,
    ]);



    const fetchConversations = useCallback(async (searchQuery = "", tab = activeTab, append = false) => {
        if (append) {
            if (listScrollRef.current) {
                prevListScrollTop.current = listScrollRef.current.scrollTop;
            }
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }
        const gen = ++listFetchGen.current;
        try {
            const effectiveTab = tab === "humanHandoff" && !isTestUser ? "all" : tab;
            const params = {
                limit: PAGE_LIMIT,
                search: searchQuery,
                unreadOnly: effectiveTab === "unread" ? true : undefined,
                humanHandoffOnly: effectiveTab === "humanHandoff" ? true : undefined,
                status: effectiveTab === "all" || effectiveTab === "unread" || effectiveTab === "humanHandoff" ? undefined : effectiveTab.toUpperCase(),
                sortBy: SORT_BY,
                cursor: append ? cursor : undefined
            };

            const res = await api.get("/conversation", { params });
            if (gen !== listFetchGen.current) return;
            const { records, hasMore: apiHasMore, nextCursor } = res.data || {};
            const list = Array.isArray(records) ? records : [];
            list.forEach((conv) => {
                if (!conv?.id) return;
                lastUnreadRef.current.set(conv.id, conv.unreadCount || 0);
                lastHandoffRef.current.set(conv.id, !!conv.humanHandoff);
            });

            setConversations(prev => append ? [...prev, ...list] : list);
            setHasMore(!!apiHasMore);
            setCursor(nextCursor);
        } catch (error) {
            if (gen !== listFetchGen.current) return;
            console.error("Failed to fetch conversations:", error);
            prevListScrollTop.current = null;
        } finally {
            if (gen === listFetchGen.current) {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        }
    }, [activeTab, cursor, isTestUser]);

    const fetchTabCounts = useCallback(async () => {
        try {
            const res = await api.get("/conversation/counts");
            setUnreadCount(typeof res.data?.unread === "number" ? res.data.unread : 0);
            setHumanHandoffCount(typeof res.data?.humanHandoff === "number" ? res.data.humanHandoff : 0);
        } catch (error) {
            console.error("Failed to fetch conversation tab counts:", error);
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId, cursor, append = false) => {
        if (!conversationId) return;
        setIsMessagesLoading(true);
        if (!append) {
            setInitialMessagesLoading(true);
        }
        try {
            const params = {
                limit: MESSAGES_LIMIT,
                conversationId,
                sortBy: "createdAt",
                sortDir: "DESC",
                cursor: append ? cursor : undefined,
                search: messageSearch || undefined,
                status: messageStatus === "all" ? undefined : messageStatus,
                accountId: messageAccount === "all" ? undefined : messageAccount
            };

            const res = await api.get("/whatsapp/messages", { params });
            if (activeConvIdRef.current !== conversationId) return;
            const { records, hasMore: apiHasMore, nextCursor } = res.data || {};

            const newMessages = (records ?? []).reverse();

            if (append && scrollRef.current) {
                prevScrollHeight.current = scrollRef.current.scrollHeight;
            }

            setMessages(prev => append ? [...newMessages, ...prev] : newMessages);
            setHasMoreMessages(!!apiHasMore);
            setMessagesCursor(nextCursor);
        } catch (error) {
            if (activeConvIdRef.current !== conversationId) return;
            console.error("Failed to fetch messages:", error);
        } finally {
            if (activeConvIdRef.current === conversationId) {
                setIsMessagesLoading(false);
                if (!append) {
                    setInitialMessagesLoading(false);
                }
            }
        }
    }, [messageSearch, messageAccount, messageStatus]);

    useEffect(() => {
        fetchConversations(search, activeTab, false);
    }, [activeTab, search]); // Re-fetch on tab or search change

    useEffect(() => {
        fetchTabCounts();
    }, [fetchTabCounts]);

    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "visible") fetchTabCounts();
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, [fetchTabCounts]);

    useEffect(() => {
        if (isConnected) fetchTabCounts();
    }, [isConnected, fetchTabCounts]);

    useEffect(() => {
        if (!selectedConversation?.id) {
            previousConversationId.current = null;
            setMessages([]);
            setHasMoreMessages(false);
            setMessagesCursor(null);
            return;
        }

        setMessagesCursor(null);

        if (selectedConversation.id !== previousConversationId.current) {
            setMessageSearch("");
            setMessageStatus("all");
            setMessageAccount("all");
            setReplyTo(null);
            markAsRead(selectedConversation.id);

            previousConversationId.current = selectedConversation.id;
        }

        fetchMessages(selectedConversation.id, null, false);
    }, [
        selectedConversation?.id,
        messageSearch,
        messageStatus,
        messageAccount,
    ]);

    useEffect(() => {
        if (activeTab !== "humanHandoff") return;
        const openId = selectedConversation?.id;
        setConversations((prev) => prev.filter((c) => c.id === openId || !!c.humanHandoff));
    }, [selectedConversation?.id, activeTab]);
    const onSelectConversation = useCallback((conversation) => {
        const same = conversation?.id && conversation.id === selectedConversationRef.current?.id;
        setSelectedConversation(conversation);
        if (!same) setMessages([]);
    }, []);

    const ensureHandoffRow = useCallback(async (id) => {
        if (!id || activeTabRef.current !== "humanHandoff") return;
        if (conversationsRef.current.some((c) => c.id === id)) return;
        try {
            const res = await api.get(`/conversation/${id}`);
            const conv = res.data;
            if (!conv?.id || activeTabRef.current !== "humanHandoff") return;
            lastUnreadRef.current.set(conv.id, conv.unreadCount || 0);
            lastHandoffRef.current.set(conv.id, !!conv.humanHandoff);
            setConversations((prev) => {
                if (prev.some((c) => c.id === conv.id)) {
                    return prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
                }
                return [conv, ...prev];
            });
        } catch (error) {
            console.error("Failed to load handed-off conversation:", error);
        }
    }, []);

    const applyConversationAi = useCallback((id, next) => {
        if (Object.prototype.hasOwnProperty.call(next, "humanHandoff")) {
            rememberHandoff(id, !!next.humanHandoff);
            if (next.humanHandoff) void ensureHandoffRow(id);
        }
        setSelectedConversation((prev) => prev?.id === id ? { ...prev, ...next } : prev);
        setConversations((prev) => {
            const mapped = prev.map((item) => item.id === id ? { ...item, ...next } : item);
            const shouldDrop =
                Object.prototype.hasOwnProperty.call(next, "humanHandoff") &&
                !next.humanHandoff &&
                activeTabRef.current === "humanHandoff" &&
                activeConvIdRef.current !== id;
            return shouldDrop ? mapped.filter((item) => item.id !== id) : mapped;
        });
    }, [rememberHandoff, ensureHandoffRow]);

    const updateConversationAi = useCallback(async (aiMode) => {
        const id = selectedConversation?.id;
        if (!id) return;
        const res = await api.patch(`/conversation/${id}/ai`, { aiMode });
        applyConversationAi(id, { aiMode: res.data?.aiMode });
    }, [selectedConversation?.id, applyConversationAi]);

    const resumeConversationAi = useCallback(async () => {
        const id = selectedConversation?.id;
        if (!id) return;
        try {
            const res = await api.patch(`/conversation/${id}/ai/resume`);
            applyConversationAi(id, { agentPausedUntil: res.data?.agentPausedUntil ?? null });
        } catch (error) {
            toast.error(t("chatFailed"));
        }
    }, [selectedConversation?.id, applyConversationAi, t]);

    const cancelConversationHandoff = useCallback(async () => {
        const id = selectedConversation?.id;
        if (!id) return;
        try {
            const res = await api.patch(`/conversation/${id}/ai/handoff`, { humanHandoff: false });
            applyConversationAi(id, {
                humanHandoff: res.data?.humanHandoff ?? false,
                agentPausedUntil: res.data?.agentPausedUntil ?? null,
            });
        } catch (error) {
            toast.error(t("chatFailed"));
        }
    }, [selectedConversation?.id, applyConversationAi, t]);

    useEffect(() => {
        if (!customerIdFromUrl) return;

        const selected = selectedConversationRef.current;
        const alreadyOpen =
            selected?.customerId === customerIdFromUrl ||
            selected?.customer?.id === customerIdFromUrl;
        if (alreadyOpen) {
            router.replace(pathname, { scroll: false });
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await api.post(`/customer/${customerIdFromUrl}/conversation`);
                const conversation = res.data;
                if (cancelled || !conversation?.id) return;

                setConversations((prev) => {
                    const withoutCurrent = prev.filter((c) => c.id !== conversation.id);
                    return [conversation, ...withoutCurrent];
                });
                onSelectConversation(conversation);
                setMobileView("chat");
                router.replace(pathname, { scroll: false });
            } catch (error) {
                if (!cancelled) {
                    toast.error(t("chatFailed"));
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [customerIdFromUrl, onSelectConversation, pathname, router, t]);

    useEffect(() => {
        const unsubConversation = subscribe("WHATSAPP_CONVERSATION_NEW", (payload) => {
            if (!payload?.conversation) return;
            const newConv = payload.conversation;
            if (!lastUnreadRef.current.has(newConv.id)) {
                lastUnreadRef.current.set(newConv.id, 0);
            }
            if (!lastHandoffRef.current.has(newConv.id)) {
                lastHandoffRef.current.set(newConv.id, false);
            }
            rememberUnread(newConv.id, newConv.unreadCount || 0);
            rememberHandoff(newConv.id, !!newConv.humanHandoff);

            setConversations(prev => {
                // Check if already exists to avoid duplicates
                if (prev.find(c => c.id === newConv.id)) return prev;
                return [newConv, ...prev];
            });
        });

        const unsubConversationAi = subscribe("WHATSAPP_CONVERSATION_AI", (payload) => {
            const conversationId = payload?.conversationId;
            if (!conversationId) return;
            applyConversationAi(conversationId, {
                ...(Object.prototype.hasOwnProperty.call(payload, "humanHandoff")
                    ? { humanHandoff: payload.humanHandoff }
                    : {}),
                ...(Object.prototype.hasOwnProperty.call(payload, "agentPausedUntil")
                    ? { agentPausedUntil: payload.agentPausedUntil ?? null }
                    : {}),
            });
        });

        const unsubConversationRead = subscribe("WHATSAPP_CONVERSATION_READ", (payload) => {
            const conversationId = payload?.conversationId;
            if (!conversationId) return;
            const nextUnread = payload?.unreadCount ?? 0;
            rememberUnread(conversationId, nextUnread);
            setConversations((prev) => prev.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: nextUnread } : c
            ));
        });

        const unsubMessage = subscribe("WHATSAPP_MESSAGE_NEW", (payload) => {

            if (!payload?.message) return;

            const msg = payload.message;
            const agentPausedUntil = Object.prototype.hasOwnProperty.call(payload, "agentPausedUntil")
                ? payload.agentPausedUntil
                : undefined;
            const humanHandoff = Object.prototype.hasOwnProperty.call(payload, "humanHandoff")
                ? payload.humanHandoff
                : undefined;
            const localId = msg.metadata?.localId;
            const isReaction = msg.messageType === "reaction";

            // Read from the ref to avoid stale closure issues!
            const isConversationOpen = activeConvIdRef.current === msg.conversationId;

            // DO DOM READS HERE, completely outside of React state setters
            const nearBottom = isConversationOpen ? checkIsNearBottom() : false;

            let shouldMarkAsRead = false;
            let shouldIncrementUnread = false;
            let shouldScrollToBottom = false;

            if (msg.direction === "inbound") {
                if (!isConversationOpen) {
                    shouldIncrementUnread = true;
                } else if (nearBottom) {
                    shouldMarkAsRead = true;
                    shouldScrollToBottom = true;
                } else {
                    shouldIncrementUnread = true;
                }
            }

            // FIRE API CALL HERE, outside of state setters
            if (shouldMarkAsRead) {
                try {

                    markAsRead(msg.conversationId, true);
                } catch (error) {
                    console.error("Failed to mark as read:", error);
                }
            }

            const extrasUnread = payload.unreadCount;
            if (shouldIncrementUnread) {
                const prevUnread = lastUnreadRef.current.has(msg.conversationId)
                    ? lastUnreadRef.current.get(msg.conversationId)
                    : 0;
                rememberUnread(
                    msg.conversationId,
                    extrasUnread != null ? extrasUnread : prevUnread + 1,
                );
            } else if (extrasUnread != null) {
                rememberUnread(msg.conversationId, extrasUnread);
            }
            if (humanHandoff !== undefined && humanHandoff !== null) {
                rememberHandoff(msg.conversationId, !!humanHandoff);
                if (humanHandoff) void ensureHandoffRow(msg.conversationId);
            }

            // UPDATE 1: PURE STATE UPDATE FOR CONVERSATIONS
            setConversations(prev => {
                const existing = prev.find(c => c.id === msg.conversationId);

                if (!existing) return prev;

                const nextUnread = shouldIncrementUnread
                    ? (extrasUnread != null ? extrasUnread : (existing.unreadCount || 0) + 1)
                    : (shouldMarkAsRead ? 0 : existing.unreadCount);

                const updated = {
                    ...existing,
                    lastMessage: msg,
                    lastMessageAt: msg.createdAt,
                    lastMessagePreview: msg.messageType === "text"
                        ? msg.content?.text?.body
                        : (isReaction ? `Reaction: ${msg.content?.reaction?.emoji}` : `[${msg.messageType.toUpperCase()}]`),
                    unreadCount: nextUnread,
                    ...(agentPausedUntil !== undefined ? { agentPausedUntil } : {}),
                    ...(humanHandoff !== undefined && humanHandoff !== null ? { humanHandoff } : {}),
                };

                const nextList = [updated, ...prev.filter(c => c.id !== msg.conversationId)];
                const shouldDrop =
                    humanHandoff === false &&
                    activeTabRef.current === "humanHandoff" &&
                    activeConvIdRef.current !== msg.conversationId;
                return shouldDrop
                    ? nextList.filter((c) => c.id !== msg.conversationId)
                    : nextList;
            });

            if (agentPausedUntil !== undefined) {
                setSelectedConversation((prev) =>
                    prev?.id === msg.conversationId ? { ...prev, agentPausedUntil } : prev
                );
            }
            if (humanHandoff !== undefined && humanHandoff !== null) {
                setSelectedConversation((prev) =>
                    prev?.id === msg.conversationId ? { ...prev, humanHandoff } : prev
                );
            }

            // UPDATE 2: UPDATE MESSAGES ONLY IF THIS CONVERSATION IS OPEN
            if (isConversationOpen) {
                setMessages(prevMsgs => {
                    // Handle Reactions

                    if (isReaction) {
                        // Check either reactionToId (existing) OR content.reaction.message_id (incoming)
                        const targetMessageId = msg.reactionToId;
                        const targetWamid = msg.content?.reaction?.message_id;

                        let reactionApplied = false;

                        const newMsgs = prevMsgs.map(m => {
                            const isMatch = (targetMessageId && m.id === targetMessageId) ||
                                (targetWamid && m.messageId === targetWamid);
                            if (isMatch) {
                                reactionApplied = true;
                                const reactions = m.reactions || [];
                                const filtered = reactions.filter(r =>
                                    r.direction !== msg.direction &&
                                    r.id !== msg.id &&
                                    r.metadata?.localId !== localId
                                );
                                return { ...m, reactions: [...filtered, msg] };
                            }
                            return m;
                        });

                        return newMsgs;
                    }

                    // Handle Normal Messages
                    const existsIndex = prevMsgs.findIndex(m =>
                        m.id === msg.id || (localId && m.metadata?.localId === localId)
                    );

                    if (existsIndex > -1) {
                        // DON'T just return prevMsgs! 
                        // Replace the existing message to capture status updates (like sent -> delivered)
                        const newMsgs = [...prevMsgs];
                        newMsgs[existsIndex] = msg;
                        return newMsgs;
                    }

                    return [...prevMsgs, msg];
                });

                if (!isReaction) {
                    applyAccountFromMessage(msg);
                }

                // HANDLE DOM WRITES (SCROLLING) HERE, outside of state setters
                if (shouldScrollToBottom && scrollRef.current) {
                    // Using a slight delay allows React to flush the state to the DOM first
                    setTimeout(() => {
                        scrollToBottom("instant");
                    }, 50);
                }
            }
        });
        const unsubMessageUpdate = subscribe("WHATSAPP_MESSAGE_UPDATED", (payload) => {

            if (!payload?.message) return;

            const msg = payload.message;
            const localId = msg.metadata?.localId;

            // 1. UPDATE THE SIDEBAR (so read receipts/status show up in the conversation list)
            setConversations(prev => prev.map(c => {
                // Only update if this message is the latest message in that conversation
                const isTargetConv = c.id === msg.conversationId;
                const isLatestMessage = c.lastMessage?.id === msg.id ||
                    (localId && c.lastMessage?.metadata?.localId === localId);

                if (isTargetConv && isLatestMessage) {
                    return {
                        ...c,
                        lastMessage: { ...c.lastMessage, ...msg }
                    };
                }
                return c;
            }));

            // 2. ONLY UPDATE MESSAGES ARRAY IF THIS CONVERSATION IS CURRENTLY OPEN
            const isConversationOpen = activeConvIdRef.current === msg.conversationId;

            if (isConversationOpen) {
                setMessages(prevMsgs => prevMsgs.map(m => {
                    // Match on real ID *OR* localId! This guarantees optimistic messages get updated.
                    const isMatch = m.id === msg.id || (localId && m.metadata?.localId === localId);

                    return isMatch ? { ...m, ...msg } : m;
                }));
            }
        });

        return () => {
            unsubConversation?.();
            unsubConversationAi?.();
            unsubConversationRead?.();
            unsubMessage?.();
            unsubMessageUpdate?.();
        };
    }, [subscribe, markAsRead, applyAccountFromMessage, applyConversationAi, rememberUnread, rememberHandoff, ensureHandoffRow]);

    const loadMoreConversations = useCallback(() => {
        if (!isLoading && !isLoadingMore && hasMore) {
            fetchConversations(search, activeTab, true);
        }
    }, [isLoading, isLoadingMore, hasMore, fetchConversations, search, activeTab]);

    const loadMoreMessages = useCallback(() => {
        if (!isMessagesLoading && hasMoreMessages && selectedConversation?.id) {
            fetchMessages(selectedConversation.id, messagesCursor, true);
        }
    }, [isMessagesLoading, hasMoreMessages, selectedConversation?.id, fetchMessages, messagesCursor]);



    const handleSendMessage = useCallback(async (msg, metadata) => {
        if (!selectedConversation) return;


        let content = {};
        const isMedia = ["image", "video", "document"].includes(msg.type);
        const isDoc = msg.type === "document";
        switch (msg.type) {
            case "text":
                content = { text: { body: msg.text } };
                break;
            case "audio":
                content = { audio: msg.audio };
                break;
            case "image":
                content = { image: { ...msg.image, localUrl: msg.image?.url }, caption: msg.caption };
                break;
            case "video":
                content = { video: { ...msg.video, localUrl: msg.video?.url }, caption: msg.caption };
                break;
            case "document":
                content = { document: { ...msg.document, localUrl: msg.document?.url }, caption: msg.caption };
                break;
            case "template":
                content = { template: msg.template };
                break;
            case "location":
                content = { location: msg.location };
                break;
            case "interactive":
                content = { interactive: msg.interactive };
                break;
            case "contacts":
                content = { contacts: msg.contacts };
                break;
            default:
                content = {};
        }

        let replyToWamid = null;
        let repMsg = null;
        const replySource = msg.replyTo || replyTo;
        // Template messages do not support 'context' (replying to a message) in Meta API
        if (replySource && msg.type !== "template") {
            repMsg = messagesRef.current.find((m) => m.id === replySource.id) || replySource;
            replyToWamid = repMsg?.messageId || repMsg?.id;
        }

        // Check if media upload is needed
        const mediaInfo = checkIfMediaUploadNeeded(msg);
        const needsMediaUpload = !!mediaInfo;

        const localId = crypto.randomUUID();
        const currentAccountId = msg.accountId || selectedAccount?.id;
        applyAccountFromMessage({ accountId: currentAccountId, messageType: msg.type });
        const newMessage = {
            id: localId,
            direction: "outbound",
            messageType: msg.type,
            content,
            createdAt: new Date().toISOString(),
            status: needsMediaUpload ? "uploading" : "pending", // Initial status for optimistic UI
            conversationId: selectedConversation.id,
            accountId: currentAccountId,
            metadata: { localId, ...metadata },
            replyTo: repMsg,
            sendSource: "user",
            sentByUserId: user?.id,
            sentByUser: user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : null,
        };

        // 1. Optimistic UI: Add message and move conversation to top
        setMessages(prev => [...prev, newMessage]);
        setConversations(prev => {
            const existing = prev.find(c => c.id === selectedConversation.id);
            if (!existing) return prev;

            const updated = {
                ...existing,
                lastMessage: newMessage,
                lastMessageAt: newMessage.createdAt,
                lastMessagePreview: msg.type === "text" ? msg.text : `[${msg.type.toUpperCase()}]`,
                lastMessageDirection: "outbound"
            };

            return [updated, ...prev.filter(c => c.id !== selectedConversation.id)];
        });

        // 2. Send to API
        try {
            let mediaId = msg.mediaId ?? msg[msg.type]?.id ?? null;

            // Handle Media Auto-Upload (from URL or file)
            if (needsMediaUpload) {
                try {
                    const newId = await handleMediaUpload(mediaInfo, currentAccountId, msg);
                    const mediaType = mediaInfo.mediaType;
                    mediaId = newId;
                    // Update the local message content
                    setMessages(prev => prev.map(m => {
                        if (m.id === localId) {
                            const newContent = JSON.parse(JSON.stringify(m.content));

                            if (mediaInfo.headerComponent === "template") {
                                const h = newContent.template?.components?.find(c => c.type === "header");
                                const p = h?.parameters?.[0];
                                p[mediaType].id = newId;
                                delete p[mediaType].link;
                                delete p[mediaType].file;
                            } else if (mediaInfo.headerComponent === "interactive") {
                                newContent.interactive.header[mediaType].id = newId;
                                delete newContent.interactive.header[mediaType].link;
                                delete newContent.interactive.header[mediaType].file;
                            } else if (mediaInfo.headerComponent === "direct") {
                                newContent[mediaType].id = newId;
                                delete newContent[mediaType].localUrl;
                                delete newContent[mediaType].link;
                                delete newContent[mediaType].file;
                            }

                            return { ...m, content: newContent, status: "pending" };
                        }
                        return m;
                    }));
                } catch (error) {
                    console.error("Failed to auto-upload media:", error);
                    setMessages(prev => prev.map(m =>
                        m.id === localId ? { ...m, status: "pending" } : m
                    ));
                    throw error;
                }
            }

            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: selectedConversation.customer?.phoneNumber,
                conversationId: selectedConversation.id,
                type: msg.type,
                [msg.type]: msg.type === "text"
                    ? { body: msg.text }
                    : isMedia
                        ? { id: mediaId, caption: msg.caption, ...(isDoc ? { filename: msg.file?.name || msg.document?.filename } : {}) }
                        : content[msg.type],
                context: replyToWamid ? { message_id: replyToWamid } : undefined,
                metadata: { ...metadata }
            };


            await api.post("/whatsapp/messages/send", payload, {
                params: {
                    accountId: currentAccountId,
                    localId: localId
                }
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            // Mark as failed in UI
            setMessages(prev => prev.map(m =>
                m.id === localId ? { ...m, status: "failed", error: error?.response?.data?.message || error?.message } : m
            ));
        }
    }, [selectedConversation, replyTo, selectedAccount, applyAccountFromMessage, user]);

    const handleRetryMessage = useCallback(async (failedMessage) => {
        setMessages(prev => prev.filter(m => m.id !== failedMessage.id));

        const msgType = failedMessage.messageType;
        const mediaBody = failedMessage.content?.[msgType];
        const msgPayload = {
            type: msgType,
            accountId: failedMessage.accountId,
            caption: failedMessage.content?.caption,
            replyTo: failedMessage.replyTo,
            mediaId: failedMessage.mediaId ?? mediaBody?.id,
        };

        if (msgType === "text") {
            msgPayload.text = failedMessage.content?.text?.body || failedMessage.content?.body;
        } else {
            msgPayload[msgType] = mediaBody
                ? { ...mediaBody, id: failedMessage.mediaId ?? mediaBody.id }
                : mediaBody;
        }

        await handleSendMessage(msgPayload, failedMessage.metadata);
    }, [handleSendMessage]);


    const handleReaction = useCallback(async (messageId, emoji) => {
        if (!selectedConversation) {
            return;
        }

        const targetMsg = messagesRef.current.find(m => m.id === messageId);
        if (!targetMsg || !targetMsg.messageId) {
            return;
        }

        const localId = crypto.randomUUID();
        const isRemoving = !emoji; // WhatsApp sends empty string "" or null to remove a reaction

        let rollbackReactions = [];

        // Optimistic UI Update
        setMessages(prev => prev.map(m => {
            if (m.id !== messageId) return m;
            // Capture previous reactions safely inside state updater
            rollbackReactions = m.reactions || [];

            // Always remove existing outbound ("You") reactions first
            const remainingReactions = rollbackReactions.filter(r => r.direction !== "outbound");
            // If removing emoji, just return array without any outbound reaction
            if (isRemoving) {
                return { ...m, reactions: remainingReactions };
            }

            // Standardized optimistic reaction object (adds top-level `emoji` property for clean UI access)
            const optimisticReaction = {
                id: localId,
                messageType: "reaction",
                direction: "outbound",
                emoji: emoji,
                reaction: emoji,
                content: { reaction: { emoji, message_id: targetMsg.messageId } },
                reactionToId: targetMsg.id,
                createdAt: new Date().toISOString()
            };
            return {
                ...m,
                reactions: [...remainingReactions, optimisticReaction]
            };
        }));

        try {
            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: selectedConversation.customer?.phoneNumber,
                conversationId: selectedConversation.id,
                type: "reaction",
                reaction: {
                    message_id: targetMsg.messageId,
                    emoji: emoji || "" // Send empty string to remove reaction on WhatsApp
                }
            };

            await api.post("/whatsapp/messages/send", payload, {
                params: {
                    accountId: targetMsg.accountId || selectedAccount?.id,
                    localId: localId
                }
            });
        } catch (error) {
            console.error("[Reaction] API Failure - Rolling back:", error);

            // Rollback on failure using captured reactions
            setMessages(prev => prev.map(m =>
                m.id === messageId
                    ? { ...m, reactions: rollbackReactions }
                    : m
            ));

            toast.error(t("reactionFailed"));
        }
    }, [selectedConversation, selectedAccount, t]);

    const toggleDetails = useCallback(() => {
        setShowDetails(!showDetails)
    }, [showDetails]);

    const contextValue = useMemo(() => ({
        selectedConversation,
        setSelectedConversation: onSelectConversation,
        updateConversationAi,
        resumeConversationAi,
        cancelConversationHandoff,
        mobileView,
        setMobileView,
        selectedAccount,
        setSelectedAccount,
        accounts,
        accountsLoading,
        showDetails,
        setShowDetails,
        toggleDetails,
        activeTab,
        setActiveTab,
        conversations,
        setConversations,
        messages,
        setMessages,
        handleSendMessage,
        handleRetryMessage,
        handleReaction,
        pendingMedia,
        setPendingMedia,
        isLoading,
        isLoadingMore,
        hasMore,
        listScrollRef,
        prevListScrollTop,
        search,
        setSearch,
        loadMoreConversations,
        isMessagesLoading,
        hasMoreMessages,
        initialMessagesLoading,
        setInitialMessagesLoading,
        loadMoreMessages,
        messageSearch,
        setMessageSearch,
        messageStatus,
        setMessageStatus,
        messageAccount,
        setMessageAccount,
        replyTo,
        setReplyTo,
        prevScrollHeight,
        scrollRef,
        scrollToBottom,
        isNearBottom,
        currentUnreadCount,
        unreadCount,
        humanHandoffCount,
        isAutoScrolling,
        checkIsNearBottom,
        bottomSentinelRef
    }), [
        selectedConversation,
        onSelectConversation,
        updateConversationAi,
        resumeConversationAi,
        cancelConversationHandoff,
        mobileView,
        selectedAccount,
        accounts,
        accountsLoading,
        showDetails,
        toggleDetails,
        activeTab,
        conversations,
        messages,
        handleSendMessage,
        handleRetryMessage,
        handleReaction,
        pendingMedia,
        isLoading,
        isLoadingMore,
        hasMore,
        search,
        loadMoreConversations,
        isMessagesLoading,
        hasMoreMessages,
        initialMessagesLoading,
        loadMoreMessages,
        messageSearch,
        messageStatus,
        messageAccount,
        replyTo,
        isNearBottom,
        currentUnreadCount,
        unreadCount,
        humanHandoffCount,
        checkIsNearBottom,
        scrollToBottom,
    ]);

    return (
        <ConversationContext.Provider value={contextValue}>
            {children}
        </ConversationContext.Provider>
    );
};
