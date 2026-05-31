"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "@/utils/api";
import { useSocket } from "@/context/SocketContext";
import toast from "react-hot-toast";

const ConversationContext = createContext();

export const useConversation = () => useContext(ConversationContext);

export const ConversationProvider = ({ children }) => {
    const [replyTo, setReplyTo] = useState(null);
    const { subscribe } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [pendingMedia, setPendingMedia] = useState(null);
    const [showInteractiveModal, setShowInteractiveModal] = useState(false);
    const [headerMediaFile, setHeaderMediaFile] = useState(null);
    const [interactiveMessage, setInteractiveMessage] = useState({
        headerType: "NONE",
        headerText: "",
        headerUrl: "",
        bodyText: "",
        footerText: "",
        buttons: []
    });
    const [showLocationRequestModal, setShowLocationRequestModal] = useState(false);
    const [locationRequestBody, setLocationRequestBody] = useState("");
    const [showContactModal, setShowContactModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [listMessage, setListMessage] = useState({
        headerType: "NONE",
        headerText: "",
        headerUrl: "",
        bodyText: "",
        footerText: "",
        menuLabel: "View Options",
        sections: [{
            title: "",
            rows: []
        }]
    });
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateMessage, setTemplateMessage] = useState({
        templateId: null,
        templateName: "",
        templateData: null,
        headerVariables: {},
        bodyVariables: {},
        buttonVariables: {}
    });

    // Real Data States
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [search, setSearch] = useState("");
    const PAGE_LIMIT = 50;
    const SORT_BY = "lastMessageAt";

    // Message Pagination & Filter States
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [messagesCursor, setMessagesCursor] = useState(null);
    const [messageSearch, setMessageSearch] = useState("");
    const [messageStatus, setMessageStatus] = useState("all");
    const [messageAccount, setMessageAccount] = useState("all");
    const MESSAGES_LIMIT = 50;
    const previousConversationId = useRef(null);

    const markAsRead = useCallback(async (conversationId, onFailIncreaseOne = false) => {
        if (!conversationId) return;

        // Optimistic update for unread count in the list
        let previousUnreadCount = 0;
        setConversations(prev => prev.map(c => {
            if (c.id === conversationId) {
                previousUnreadCount = c.unreadCount || 0;
                return { ...c, unreadCount: 0 };
            }
            return c;
        }));

        try {
            await api.post("/whatsapp/messages/mark-as-read", { conversationId });
        } catch (error) {
            console.error("Failed to mark as read:", error);
            // On fail increase the one (as requested by user)
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, unreadCount: previousUnreadCount ? previousUnreadCount : onFailIncreaseOne ? 1 : 0 } : c
            ));
        }
    }, []);

    const fetchConversations = useCallback(async (searchQuery = "", tab = activeTab, append = false) => {
        setIsLoading(true);
        try {
            const params = {
                limit: PAGE_LIMIT,
                search: searchQuery,
                unreadOnly: tab === "unread" ? true : undefined,
                status: tab === "all" || tab === "unread" ? undefined : tab.toUpperCase(),
                sortBy: SORT_BY,
                cursor: append ? cursor : undefined
            };

            const res = await api.get("/conversation", { params });
            const { records, hasMore: apiHasMore, nextCursor } = res.data || {};

            setConversations(prev => append ? [...prev, ...records] : records);
            setHasMore(!!apiHasMore);
            setCursor(nextCursor);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, cursor]);

    const fetchMessages = useCallback(async (conversationId, cursor, append = false) => {
        if (!conversationId) return;
        setIsMessagesLoading(true);
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
            const { records, hasMore: apiHasMore, nextCursor } = res.data || {};

            // We fetch in DESC order (newest first) for pagination, 
            // but usually we want to display them in ASC order (oldest first at top).
            // When appending (loading older messages), we prepend them.
            const newMessages = records.reverse();

            setMessages(prev => append ? [...newMessages, ...prev] : newMessages);
            setHasMoreMessages(!!apiHasMore);
            setMessagesCursor(nextCursor);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsMessagesLoading(false);
        }
    }, [messageSearch, messageAccount, messageStatus]);

    useEffect(() => {
        fetchConversations(search, activeTab, false);
    }, [activeTab, search]); // Re-fetch on tab or search change

    useEffect(() => {
        if (!selectedConversation?.id) {
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
        const unsubConversation = subscribe("WHATSAPP_CONVERSATION_NEW", (payload) => {
            if (!payload?.conversation) return;
            const newConv = payload.conversation;

            setConversations(prev => {
                // Check if already exists to avoid duplicates
                if (prev.find(c => c.id === newConv.id)) return prev;
                return [newConv, ...prev];
            });
        });

        const unsubMessage = subscribe("WHATSAPP_MESSAGE_NEW", (payload) => {
            if (!payload?.message) return;
            const msg = payload.message;
            const localId = msg.metadata?.localId;
            const isReaction = msg.messageType === "reaction";

            // Update conversations list (last preview, unread count, etc.)
            setConversations(prev => {
                const existing = prev.find(c => c.id === msg.conversationId);
                if (!existing) return prev;

                const isConversationOpen = selectedConversation?.id === msg.conversationId;
                const shouldIncrementUnread = msg.direction === "inbound" && !isConversationOpen;

                const updated = {
                    ...existing,
                    lastMessageAt: msg.createdAt,
                    lastMessagePreview: msg.messageType === "text" ? msg.content?.text?.body : (isReaction ? `Reaction: ${msg.content?.reaction?.emoji}` : `[${msg.messageType.toUpperCase()}]`),
                    unreadCount: shouldIncrementUnread ? (existing.unreadCount || 0) + 1 : (isConversationOpen ? 0 : existing.unreadCount)
                };

                if (isConversationOpen && msg.direction === "inbound") {
                    markAsRead(msg.conversationId, true);
                }

                return [updated, ...prev.filter(c => c.id !== msg.conversationId)];
            });

            // If it's for the currently selected conversation, update or append
            setSelectedConversation(prevSelected => {
                if (prevSelected?.id === msg.conversationId) {
                    setMessages(prevMsgs => {
                        // 1. If it's a reaction, find the parent message and update its reactions array
                        if (isReaction && msg.reactionToId) {
                            return prevMsgs.map(m => {
                                if (m.id === msg.reactionToId) {
                                    const reactions = m.reactions || [];
                                    // Ensure one inbound and one outbound: filter out previous of same direction
                                    const filtered = reactions.filter(r =>
                                        r.direction !== msg.direction &&
                                        r.id !== msg.id &&
                                        r.metadata?.localId !== localId
                                    );
                                    return { ...m, reactions: [...filtered, msg] };
                                }
                                return m;
                            });
                        }

                        // 2. If it's a normal message, handle deduplication and replacement
                        const exists = prevMsgs.some(m => m.id === msg.id || (localId && m.metadata?.localId === localId));

                        if (localId) {
                            // Replace optimistic message with real one
                            return prevMsgs.map(m => m.metadata?.localId === localId ? msg : m);
                        }

                        if (exists) return prevMsgs;
                        return [...prevMsgs, msg];
                    });
                }
                return prevSelected;
            });
        });

        const unsubMessageUpdate = subscribe("WHATSAPP_MESSAGE_UPDATED", (payload) => {
            if (!payload?.message) return;
            const msg = payload.message;

            setMessages(prevMsgs => prevMsgs.map(m =>
                m.id === msg.id ? { ...m, ...msg } : m
            ));
        });

        return () => {
            unsubConversation?.();
            unsubMessage?.();
            unsubMessageUpdate?.();
        };
    }, [subscribe, selectedConversation, markAsRead]);

    const loadMoreConversations = () => {
        if (!isLoading && hasMore) {
            fetchConversations(search, activeTab, true);
        }
    };

    const loadMoreMessages = () => {
        if (!isMessagesLoading && hasMoreMessages && selectedConversation?.id) {
            fetchMessages(selectedConversation.id, messagesCursor, true);
        }
    };

    const handleSendMessage = async (msg) => {
        if (!selectedConversation) return;

        let content = {};
        switch (msg.type) {
            case "text":
                content = { text: { body: msg.text } };
                break;
            case "audio":
                content = { audio: msg.audio };
                break;
            case "image":
                content = { image: msg.image, caption: msg.caption };
                break;
            case "video":
                content = { video: msg.video, caption: msg.caption };
                break;
            case "document":
                content = { document: msg.document, caption: msg.caption };
                break;
            case "template":
                content = { template: msg.template };
                break;
            default:
                content = {};
        }
        let replyToWamid = null;
        let repMsg = null;
        if (replyTo) {
            repMsg = messages.find(m => m.id === replyTo.id);
            replyToWamid = repMsg?.messageId || repMsg?.id;
        }
        const localId = `local-${Date.now()}`;
        const newMessage = {
            id: localId,
            direction: "outbound",
            messageType: msg.type,
            content,
            createdAt: new Date().toISOString(),
            status: "pending", // Initial status for optimistic UI
            conversationId: selectedConversation.id,
            accountId: msg.accountId,
            metadata: { localId },
            replyTo: repMsg,
        };

        // 1. Optimistic UI: Add message and move conversation to top
        setMessages(prev => [...prev, newMessage]);
        setConversations(prev => {
            const existing = prev.find(c => c.id === selectedConversation.id);
            if (!existing) return prev;

            const updated = {
                ...existing,
                lastMessageAt: newMessage.createdAt,
                lastMessagePreview: msg.type === "text" ? msg.text : `[${msg.type.toUpperCase()}]`,
                lastMessageDirection: "outbound"
            };

            return [updated, ...prev.filter(c => c.id !== selectedConversation.id)];
        });

        // 2. Send to API
        try {
            // Find the parent message wamid if it's a reply


            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: selectedConversation.customer?.phoneNumber,
                type: msg.type,
                [msg.type]: msg.type === "text" ? { body: msg.text } : content[msg.type],
                context: replyToWamid ? { message_id: replyToWamid } : undefined
            };

            await api.post("/whatsapp/messages/send", payload, {
                params: {
                    accountId: msg.accountId,
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
    };

    const handleRetryMessage = async (failedMessage) => {
        // 1. Remove the failed message from UI
        setMessages(prev => prev.filter(m => m.id !== failedMessage.id));

        // 2. Re-send using handleSendMessage
        const msgType = failedMessage.messageType;
        const msgPayload = {
            type: msgType,
            accountId: failedMessage.accountId,
        };

        if (msgType === "text") {
            msgPayload.text = failedMessage.content?.text?.body || failedMessage.content?.body;
        } else {
            msgPayload[msgType] = failedMessage.content[msgType];
        }

        await handleSendMessage(msgPayload, failedMessage.replyTo);
    };

    const handleReaction = async (messageId, emoji) => {
        if (!selectedConversation) return;

        const targetMsg = messages.find(m => m.id === messageId);
        if (!targetMsg || !targetMsg.messageId) return;

        const previousReactions = targetMsg.reactions || [];
        const localId = `react-local-${Date.now()}`;

        // Optimistic UI: Keep existing inbound, but replace outbound with new one
        const optimisticReaction = {
            id: localId,
            messageType: "reaction",
            direction: "outbound",
            content: { reaction: { emoji, message_id: targetMsg.messageId } },
            reactionToId: targetMsg.id,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => prev.map(m =>
            m.id === messageId
                ? {
                    ...m,
                    reactions: [
                        ...previousReactions.filter(r => r.direction !== "outbound"),
                        optimisticReaction
                    ]
                }
                : m
        ));

        try {
            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: selectedConversation.customer?.phoneNumber,
                type: "reaction",
                reaction: {
                    message_id: targetMsg.messageId,
                    emoji: emoji
                }
            };

            await api.post("/whatsapp/messages/send", payload, {
                params: {
                    accountId: targetMsg.accountId,
                    localId: localId
                }
            });
        } catch (error) {
            console.error("Failed to send reaction:", error);
            // Rollback on failure: restore previous reactions (or empty)
            setMessages(prev => prev.map(m =>
                m.id === messageId
                    ? { ...m, reactions: previousReactions }
                    : m
            ));
            toast.error("Failed to send reaction");
        }
    };

    const toggleDetails = () => setShowDetails(!showDetails);

    return (
        <ConversationContext.Provider value={{
            selectedConversation,
            setSelectedConversation,
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
            showInteractiveModal,
            setShowInteractiveModal,
            interactiveMessage,
            setInteractiveMessage,
            headerMediaFile,
            setHeaderMediaFile,
            showLocationRequestModal,
            setShowLocationRequestModal,
            locationRequestBody,
            setLocationRequestBody,
            showContactModal,
            setShowContactModal,
            showLocationModal,
            setShowLocationModal,
            showListModal,
            setShowListModal,
            listMessage,
            setListMessage,
            showTemplateModal,
            setShowTemplateModal,
            templateMessage,
            setTemplateMessage,
            isLoading,
            hasMore,
            search,
            setSearch,
            loadMoreConversations,
            isMessagesLoading,
            hasMoreMessages,
            loadMoreMessages,
            messageSearch,
            setMessageSearch,
            messageStatus,
            setMessageStatus,
            messageAccount,
            setMessageAccount,
            replyTo,
            setReplyTo
        }}>
            {children}
        </ConversationContext.Provider>
    );
};
