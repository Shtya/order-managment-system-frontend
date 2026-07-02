"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "@/utils/api";
import { useSocket } from "@/context/SocketContext";
import toast from "react-hot-toast";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import { useTranslations } from "next-intl";
import { cacheMediaUrl } from "@/utils/whatsapp-healper";

const ConversationContext = createContext();

export const useConversation = () => useContext(ConversationContext);

export const ConversationProvider = ({ children }) => {
    const t = useTranslations("chats");
    const { settings } = useOrdersSettings();
    const scrollRef = useRef(null);
    const prevScrollHeight = useRef(0);

    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const { subscribe } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [mobileView, setMobileView] = useState("list"); // 'list', 'chat', 'details'
    const [showDetails, setShowDetails] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [pendingMedia, setPendingMedia] = useState(null);
    const [cursor, setCursor] = useState(null);
    const [isNearBottom, setIsNearBottom] = useState(true);

    const [currentUnreadCount, setCurrentUnreadCount] = useState(0);

    // Unified function to check isNearBottom
    const checkIsNearBottom = useCallback(() => {
        if (!scrollRef.current) return true;
        return (scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight) <= 200;
    }, []);

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

    const bottomSentinelRef = useRef(null);
    useEffect(() => {
        // Make sure both the container and the sentinel exist
        if (!scrollRef.current || !bottomSentinelRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const nearBottom = entry.isIntersecting;
                // entry.isIntersecting is true when within 200px of the bottom
                setIsNearBottom(nearBottom);

                const currentConversation = conversations.find(c => c.id === selectedConversation.id);

                if (nearBottom && currentConversation && (currentConversation.unreadCount || 0) > 0) {
                    markAsRead(selectedConversation.id);
                }
            },
            {
                root: scrollRef.current, // The scrollable container
                rootMargin: "0px 0px 200px 0px", // Expands the detection zone 200px downwards
                threshold: 0, // Trigger as soon as 1px of that expanded margin hits
            }
        );

        observer.observe(bottomSentinelRef.current);

        return () => {
            observer.disconnect();
        };
    }, [conversations,selectedConversation]); // Empty dependency array, sets up once on mount

    useEffect(() => {
        if (!selectedConversation) {
            setCurrentUnreadCount(0);
            return;
        }
        const conv = conversations.find(c => c.id === selectedConversation.id);
        setCurrentUnreadCount(conv?.unreadCount || 0);
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

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            const defaultId = settings?.defaultWhatsAppAccountId;
            const defaultAcc = accounts.find(a => a.id === defaultId);
            if (defaultAcc) {
                setSelectedAccount(defaultAcc);
            }
        }
    }, [accounts, settings?.defaultWhatsAppAccountId, selectedAccount]);



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
            const { records, hasMore: apiHasMore, nextCursor } = res.data || {};

            const newMessages = records.reverse();


            if (append && scrollRef.current) {
                prevScrollHeight.current = scrollRef.current.scrollHeight;
            }

            setMessages(prev => append ? [...newMessages, ...prev] : newMessages);
            setHasMoreMessages(!!apiHasMore);
            setMessagesCursor(nextCursor);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsMessagesLoading(false);
            if (!append) {
                setInitialMessagesLoading(false);
            }
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
    const onSelectConversation = useCallback((conversation) => {
        setSelectedConversation(conversation);
        setMessages([]);
    }, [setSelectedConversation]);

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

            let shouldMarkAsRead = false;
            let shouldIncrementUnread = false;
            let shouldScrollToBottom = false;
            // Update conversations list (last preview, unread count, etc.)
            setConversations(prev => {
                const existing = prev.find(c => c.id === msg.conversationId);
                if (!existing) return prev;

                const isConversationOpen = selectedConversation?.id === msg.conversationId;

                if (msg.direction === "inbound") {
                    if (!isConversationOpen) {
                        shouldMarkAsRead = false;
                        shouldIncrementUnread = true;
                        shouldScrollToBottom = false;

                    } else {
                        // Open conversation: check scroll position using our unified function
                        const nearBottom = checkIsNearBottom();


                        if (nearBottom) {
                            // Near bottom: mark as read and scroll
                            shouldMarkAsRead = true;
                            shouldIncrementUnread = false;
                            shouldScrollToBottom = true;
                        } else {
                            // Away from bottom: don't mark, increment unread
                            shouldMarkAsRead = false;
                            shouldIncrementUnread = true;
                            shouldScrollToBottom = false;
                        }
                    }
                }

                const updated = {
                    ...existing,
                    lastMessage: msg,
                    lastMessageAt: msg.createdAt,
                    lastMessagePreview: msg.messageType === "text" ? msg.content?.text?.body : (isReaction ? `Reaction: ${msg.content?.reaction?.emoji}` : `[${msg.messageType.toUpperCase()}]`),
                    unreadCount: shouldIncrementUnread ? (existing.unreadCount || 0) + 1 : (shouldMarkAsRead ? 0 : existing.unreadCount)
                };

                if (shouldMarkAsRead) {
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

                        if (shouldScrollToBottom && scrollRef.current) {
                            // Use setTimeout to allow DOM to update
                            // isAutoScrolling.current = true;
                            setTimeout(() => {
                                scrollToBottom("instant")
                                setTimeout(() => {
                                    isAutoScrolling.current = false;
                                }, 50);
                            }, 0);
                        }

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

    const loadMoreConversations = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchConversations(search, activeTab, true);
        }
    }, [isLoading, hasMore, fetchConversations, search, activeTab]);

    const loadMoreMessages = useCallback(() => {
        if (!isMessagesLoading && hasMoreMessages && selectedConversation?.id) {
            fetchMessages(selectedConversation.id, messagesCursor, true);
        }
    }, [isMessagesLoading, hasMoreMessages, selectedConversation?.id, fetchMessages, messagesCursor]);

    // Private function to check if media upload is needed for template or interactive messages
    const checkIfMediaUploadNeeded = useCallback((msg) => {
        let mediaInfo = null;

        if (msg.type === "template" && msg.template?.components) {
            const headerComponent = msg.template.components.find(c => c.type === "header");
            const param = headerComponent?.parameters?.[0];
            const mediaType = param?.type;
            if (headerComponent && ["image", "video", "document"].includes(mediaType) && param) {
                const mediaObj = param[mediaType];
                if (mediaObj?.id) {
                    delete mediaObj.link;
                    delete mediaObj.file;
                }
                if (mediaObj && mediaObj.link && !mediaObj.id) {
                    mediaInfo = { mediaType, mediaObj, headerComponent: "template" };
                }
            }
        } else if (msg.type === "interactive" && msg.interactive?.header) {
            const header = msg.interactive.header;
            const mediaType = header.type;
            if (["image", "video", "document"].includes(mediaType)) {
                const mediaObj = header[mediaType];
                if (mediaObj?.id) {
                    delete mediaObj.link;
                    delete mediaObj.file;
                }
                if (mediaObj && mediaObj.link && !mediaObj.id) {
                    mediaInfo = { mediaType, mediaObj, headerComponent: "interactive" };
                }
            }
        }

        return mediaInfo;
    }, []);

    // Private function to handle media upload
    const handleMediaUpload = useCallback(async (mediaInfo, currentAccountId, localId, msg) => {
        try {
            const file = mediaInfo.mediaObj?.file;
            const link = mediaInfo.mediaObj?.link;

            let body;
            let headers = {};

            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                body = formData;
                headers["Content-Type"] = "multipart/form-data";
            } else {
                body = {
                    url: link,
                };
            }

            const uploadRes = await api.post(
                "/whatsapp/messages/upload-media",
                body,
                {
                    params: { accountId: currentAccountId },
                    headers,
                }
            );

            if (uploadRes.data?.id) {
                const newId = uploadRes.data.id;
                const mediaType = mediaInfo.mediaType;
                const mediaObj = mediaInfo.mediaObj;

                // Cache the local URL with the new media ID
                if (mediaObj?.localUrl) {
                    cacheMediaUrl(newId, mediaObj.localUrl);
                } else if (mediaObj?.link) {
                    cacheMediaUrl(newId, mediaObj.link);
                } else if (mediaObj?.url) {
                    cacheMediaUrl(newId, mediaObj.url);
                }

                // Update the local message content
                setMessages(prev => prev.map(m => {
                    if (m.id === localId) {
                        const newContent = JSON.parse(JSON.stringify(m.content));

                        if (mediaInfo.headerComponent === "template") {
                            const h = newContent.template?.components?.find(c => c.type === "header");
                            const p = h?.parameters?.[0];
                            p[mediaType].id = newId;
                            delete p[mediaType].link;
                        } else if (mediaInfo.headerComponent === "interactive") {
                            newContent.interactive.header[mediaType].id = newId;
                            delete newContent.interactive.header[mediaType].link;
                        }

                        return { ...m, content: newContent, status: "pending" };
                    }
                    return m;
                }));

                // Update our local payload object
                mediaObj.id = newId;
                if (mediaType?.toLowerCase() === 'document') {
                    mediaObj.filename = uploadRes.data?.filename;
                }
                delete mediaObj.link;
                delete mediaObj.file;
            }
        } catch (err) {
            console.error("Failed to auto-upload media:", err);
            setMessages(prev => prev.map(m =>
                m.id === localId ? { ...m, status: "pending" } : m
            ));
        }
    }, []);

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
        // Template messages do not support 'context' (replying to a message) in Meta API
        if (replyTo && msg.type !== "template") {
            repMsg = messages.find(m => m.id === replyTo.id);
            replyToWamid = repMsg?.messageId || repMsg?.id;
        }

        // Check if media upload is needed
        const mediaInfo = checkIfMediaUploadNeeded(msg);
        const needsMediaUpload = !!mediaInfo;

        const localId = `local-${Date.now()}`;
        const newMessage = {
            id: localId,
            direction: "outbound",
            messageType: msg.type,
            content,
            createdAt: new Date().toISOString(),
            status: (isMedia && msg.file) || needsMediaUpload ? "uploading" : "pending", // Initial status for optimistic UI
            conversationId: selectedConversation.id,
            accountId: msg.accountId || selectedAccount?.id,
            metadata: { localId, ...metadata },
            replyTo: repMsg,
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
            let mediaId = null;
            const currentAccountId = msg.accountId || selectedAccount?.id;

            // Handle Media Auto-Upload (from URL)
            if (needsMediaUpload) {
                await handleMediaUpload(mediaInfo, currentAccountId, localId, msg);
            }

            // Handle Direct Media Upload if file is provided
            if (isMedia && msg.file) {
                const formData = new FormData();
                formData.append("file", msg.file);

                const uploadRes = await api.post("/whatsapp/messages/upload-media", formData, {
                    params: { accountId: currentAccountId },
                    headers: { "Content-Type": "multipart/form-data" }
                });

                mediaId = uploadRes.data?.id;

                if (!mediaId) throw new Error("Failed to get media ID from upload");

                // Cache the local URL with the new media ID
                if (content[msg.type]?.localUrl) {
                    cacheMediaUrl(mediaId, content[msg.type].localUrl);
                } else if (content[msg.type]?.url) {
                    cacheMediaUrl(mediaId, content[msg.type].url);
                }

                // Update content with real media ID and clear localUrl for sending
                content[msg.type].id = mediaId;
                delete content[msg.type].localUrl;

                // Update status to pending after upload
                setMessages(prev => prev.map(m =>
                    m.id === localId ? { ...m, status: "pending" } : m
                ));
            }

            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: selectedConversation.customer?.phoneNumber,
                type: msg.type,
                [msg.type]: msg.type === "text"
                    ? { body: msg.text }
                    : isMedia
                        ? { id: mediaId, caption: msg.caption, ...(isDoc ? { filename: msg.file?.name } : {}) }
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
    }, [selectedConversation, replyTo, messages, checkIfMediaUploadNeeded, handleMediaUpload, selectedAccount]);

    const handleRetryMessage = useCallback(async (failedMessage) => {
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

        await handleSendMessage(msgPayload, failedMessage.metadata);
    }, [handleSendMessage]);
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);
    const handleReaction = useCallback(async (messageId, emoji) => {
        if (!selectedConversation) return;

        const targetMsg = messagesRef.current.find(m => m.id === messageId);
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
                    accountId: targetMsg.accountId || selectedAccount?.id,
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
    }, [selectedConversation, selectedAccount]);

    const toggleDetails = useCallback(() => {
        setShowDetails(!showDetails)
    }, [showDetails]);


    return (
        <ConversationContext.Provider value={{
            selectedConversation,
            setSelectedConversation: onSelectConversation,
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
            hasMore,
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
            isAutoScrolling,
            checkIsNearBottom,
            bottomSentinelRef
        }}>
            {children}
        </ConversationContext.Provider>
    );
};
