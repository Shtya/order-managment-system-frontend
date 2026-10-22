"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
    MoreVertical, Phone, Video, Bot, Headphones, Undo2,
    Search, Star, Info, MessageCircleOff, X, Edit, UserMinus, UserCheck, Loader2, ChevronLeft, ChevronDown, ListFilter,Filter
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { cn } from "@/utils/cn";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WhatsAppAccountSelect from "../WhatsAppAccountSelect";
import CustomerModal from "../../../customers/atoms/CustomerModal";
import MediaPreviewOverlay from "./MediaPreviewOverlay";
import InteractiveMessageModal from "./InteractiveMessageModal";
import LocationRequestModal from "./LocationRequestModal";
import ContactModal from "./ContactModal";
import LocationModal from "./LocationModal";
import ListMessageModal from "./ListMessageModal";
import TemplateMessageModal from "./TemplateMessageModal";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { useConversation } from "./ConversationContext";
import { MESSAGE_STATUS_LIST } from "@/utils/whatsapp-healper";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import AgentPausePill, { formatCountdown } from "./AgentPausePill";
import AgentHandoffPill from "./AgentHandoffPill";
import api from "@/utils/api";

// Skeleton message component with config
function MessageSkeleton() {
    // Array config for skeleton messages
    const skeletonConfig = [
        { type: "outbound", lines: ["w-32", "w-48", "w-24"] },
        { type: "inbound", lines: ["w-36", "w-56", "w-40"] },
        { type: "outbound", lines: ["w-28", "w-40"] },
        { type: "inbound", lines: ["w-44", "w-32"] },
        { type: "outbound", lines: ["w-32", "w-48", "w-24"] },
        { type: "inbound", lines: ["w-44", "w-32"] },
        { type: "outbound", lines: ["w-32", "w-48", "w-24"] },
        { type: "inbound", lines: ["w-44", "w-32"] },
    ];

    return (
        <div className="space-y-4">
            {skeletonConfig.map((config, index) => (
                <div
                    key={index}
                    className={cn("flex items-start gap-2", config.type === "outbound" ? "justify-start" : "justify-end")}
                >
                    {config.type === "outbound" && (
                        <div className="w-7 h-7 mt-0.5 shrink-0 rounded-full bg-[#eef3f5] dark:bg-[#6B7C85] animate-pulse" />
                    )}
                    <div className={cn(
                        "w-fit max-w-[450px] min-w-[100px] px-4 py-3 rounded-2xl shadow-sm animate-pulse",
                        config.type === "outbound"
                            ? "bg-whatsapp-message"
                            : "bg-card border border-border"
                    )}>
                        {config.lines.map((lineWidth, lineIndex) => (
                            <div
                                key={lineIndex}
                                className={cn(
                                    "h-3 rounded mb-2",
                                    config.type === "outbound"
                                        ? "bg-green-200/70 dark:bg-[#2a3940]"
                                        : "bg-muted/70",
                                    lineWidth,
                                    lineIndex === config.lines.length - 1 && "mb-0"
                                )}
                            ></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}


export default function ChatWindow({ onSendMessage, onToggleDetails }) {
    const t = useTranslations("chats");
    const { hasPermission } = useAuth();

    const {
        selectedAccount,
        selectedConversation,
        setSelectedConversation,
        messages,
        setConversations,
        isMessagesLoading,
        initialMessagesLoading,
        hasMoreMessages,
        loadMoreMessages,
        messageStatus,
        setMessageStatus,
        messageAccount,
        setMessageAccount,
        handleRetryMessage: onRetry,
        handleReaction: onReaction,
        replyTo,
        setReplyTo,
        setMobileView,
        prevScrollHeight,
        scrollRef,
        scrollToBottom,
        isNearBottom,
        currentUnreadCount,
        checkIsNearBottom,
        bottomSentinelRef,
        updateConversationAi,
        resumeConversationAi,
        cancelConversationHandoff
    } = useConversation();

    const [showInteractiveModal, setShowInteractiveModal] = useState(false);
    const [showLocationRequestModal, setShowLocationRequestModal] = useState(false);

    const [showContactModal, setShowContactModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showMediaPreview, setShowMediaPreview] = useState(false);
    const [mediaFileType, setMediaFileType] = useState(null);

    const locale = useLocale();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const activeFilterCount = Number(messageStatus !== "all") + Number(messageAccount !== "all");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
    const [aiModeDraft, setAiModeDraft] = useState("inherit");
    const [aiSaving, setAiSaving] = useState(false);
    const [handoffDialogOpen, setHandoffDialogOpen] = useState(false);
    const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
    const [handoffSaving, setHandoffSaving] = useState(false);
    const [pauseSaving, setPauseSaving] = useState(false);
    const [pauseNow, setPauseNow] = useState(() => Date.now());
    const [hasActiveAgent, setHasActiveAgent] = useState(true);
    const conversationAiEnabled = selectedConversation?.aiMode !== "disabled";
    const canUpdateConversation = hasPermission("conversation.update");
    const isHandoffActive = !!selectedConversation?.humanHandoff;
    const pauseUntilMs = selectedConversation?.agentPausedUntil
        ? new Date(selectedConversation.agentPausedUntil).getTime()
        : 0;
    const pauseRemainingMs = pauseUntilMs ? pauseUntilMs - pauseNow : 0;
    const isPauseActive = pauseRemainingMs > 0;
    const showHandoffTag = conversationAiEnabled && hasActiveAgent && isHandoffActive;
    const showPauseTag = conversationAiEnabled && hasActiveAgent && !isHandoffActive && isPauseActive;

    useEffect(() => {
        if (!pauseUntilMs || pauseUntilMs <= Date.now()) return undefined;
        const id = setInterval(() => setPauseNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [pauseUntilMs, pauseDialogOpen]);

    // Hide the AI pause countdown when the tenant has no active agent.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get("/agents", { params: { limit: 1, isActive: "true" } });
                if (cancelled) return;
                const total = Number(res.data?.total_records ?? res.data?.records?.length ?? 0);
                setHasActiveAgent(total > 0);
            } catch {
                if (!cancelled) setHasActiveAgent(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    const customer = selectedConversation?.customer;

    const prevMessagesCount = useRef(0);
    const lastConversationId = useRef(null);
    const lastMessage = messages[messages.length - 1];

    useLayoutEffect(() => {
        if (!lastMessage?.id) return;
        if ((lastMessage.direction === "inbound" && checkIsNearBottom()) || lastMessage.direction === "outbound") {
            scrollToBottom("instant");
        }
    }, [lastMessage?.id]);


    const scrollToMessage = (messageId, behavior = "instant") => {

        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior, block: "center" });
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2000);
        }
    };


    useLayoutEffect(() => {
        // Reset scroll tracking when conversation changes
        prevScrollHeight.current = 0;
        prevMessagesCount.current = 0;
        lastConversationId.current = null;
        setReplyTo(null);


        if (scrollRef.current) {

            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "instant"
            });
        }

        if (!initialMessagesLoading && scrollRef.current) {

            const performInstantScroll = () => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: "instant"
                    });
                }
            };

            // Execute immediately before the paint (handles 95% of the height)
            performInstantScroll();

            // Safety Net: Run on the next animation frames/ticks to catch 
            // any post-paint layout shifts (like those hidden 3 messages)
            requestAnimationFrame(() => {
                performInstantScroll();

                // Final fallback for async components/images adjusting late
                setTimeout(performInstantScroll, 30);
            });
        }
    }, [selectedConversation?.id, initialMessagesLoading]);


    useLayoutEffect(() => {

        if (prevScrollHeight.current > 0 && scrollRef.current) {
            const heightDifference = scrollRef.current.scrollHeight - prevScrollHeight.current;

            const targetScrollTop = scrollRef.current.scrollTop + heightDifference;

            // Force an instant jump to the target position, overriding any CSS smooth scrolling
            scrollRef.current.scrollTo({
                top: targetScrollTop,
                behavior: "instant"
            });


            prevScrollHeight.current = 0;
        }
    }, [messages]);

    const handleMediaLoad = useCallback(() => {
        // if (!scrollRef.current) return;

        // const container = scrollRef.current;

        // const isNearBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= 200;
        // console.log("isNearBottom: ", isNearBottom, container.scrollHeight - container.scrollTop - container.clientHeight, 200);

        // if (isNearBottom) {
        //     container.scrollTop = container.scrollHeight;
        // }

        // prevScrollHeight.current = container.scrollHeight;


    }, []);

    // Helper function to format date like WhatsApp
    const formatDateLabel = useCallback((dateStr) => {
        if (!dateStr) return '';

        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if it's today
        if (date.toDateString() === today.toDateString()) {
            return t('today') || 'Today';
        }

        // Check if it's yesterday
        if (date.toDateString() === yesterday.toDateString()) {
            return t('yesterday') || 'Yesterday';
        }

        // Check if it's this year
        if (date.getFullYear() === today.getFullYear()) {
            // Format as "June 21"
            return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                month: 'long',
                day: 'numeric'
            });
        }

        // Format as "June 21, 2026"
        return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, [locale, t]);
    
    // Group messages by date
    const groupedMessages = useMemo(() => {
        const groups = [];
        let currentGroup = null;

        for (const msg of messages) {
            const dateKey = new Date(msg.createdAt).toDateString();

            if (!currentGroup || currentGroup.dateKey !== dateKey) {
                currentGroup = {
                    dateKey,
                    date: msg.createdAt,
                    messages: [msg]
                };
                groups.push(currentGroup);
            } else {
                currentGroup.messages.push(msg);
            }
        }

        return groups;
    }, [messages]);



    if (!selectedConversation) {
        return (
            <div className="flex-1 flex flex-col h-full items-center justify-center bg-muted/60 text-muted-foreground/60 p-8 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <MessageCircleOff className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">{t("noConversationSelected")}</h2>
                <p className="max-w-xs text-sm text-foreground/60">{t("selectChatToStart")}</p>
            </div>
        );
    }
    
    return (
        <div className="flex-1 flex flex-col h-full whatsapp-wallpaper overflow-hidden relative">
            <MediaPreviewOverlay
                open={showMediaPreview}
                onOpenChange={setShowMediaPreview}
                fileType={mediaFileType}
            />
            <InteractiveMessageModal
                open={showInteractiveModal}
                onOpenChange={setShowInteractiveModal}
            />
            <LocationRequestModal
                open={showLocationRequestModal}
                onOpenChange={setShowLocationRequestModal}
            />
            <ContactModal
                open={showContactModal}
                onOpenChange={setShowContactModal}
            />
            <LocationModal
                open={showLocationModal}
                onOpenChange={setShowLocationModal}
            />
            <ListMessageModal
                open={showListModal}
                onOpenChange={setShowListModal}
            />
            <TemplateMessageModal
                selectedAccount={selectedAccount}
                open={showTemplateModal}
                onOpenChange={setShowTemplateModal}
            />

            {/* Header */}
            <div className="h-16 flex-shrink-0 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => setMobileView("list")}
                        className="p-2 -ms-2 hover:bg-accent/50 rounded-full md:hidden transition-colors"
                    >
                        <ChevronLeft className={cn("w-6 h-6 text-muted-foreground", locale === 'ar' ? "rotate-180" : "")} />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border">
                            {customer?.profilePicture ? (
                                <img src={avatarSrc(customer.profilePicture)} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground/40">
                                    {customer?.name?.charAt(0) || "?"}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="min-w-0 flex items-center gap-2">
                        <h2 className="font-bold text-foreground leading-tight truncate">{customer?.name || customer?.phoneNumber}</h2>
                        {!conversationAiEnabled && (
                            <span
                                title={t("ai.disabledTitle")}
                                aria-label={t("ai.disabledTitle")}
                                className="shrink-0 text-muted-foreground/35"
                            >
                                <Bot className="w-4 h-4" />
                            </span>
                        )}
                        {showHandoffTag ? (
                                <AgentHandoffPill
                                    key={`${selectedConversation.id}-handoff`}
                                    canCancel={canUpdateConversation}
                                    onClick={() => setHandoffDialogOpen(true)}
                                />
                            ) : showPauseTag ? (
                                <AgentPausePill
                                    key={selectedConversation.id}
                                    pausedUntil={selectedConversation?.agentPausedUntil}
                                    canResume={canUpdateConversation}
                                    onClick={() => setPauseDialogOpen(true)}
                                />
                            ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    <div className="flex items-center">
                        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    aria-label={t("filter")}
                                    className={cn(
                                        "relative p-2 hover:bg-accent/50 rounded-md transition-all text-muted-foreground",
                                        isFilterOpen && "bg-wa-green/10 text-wa-green"
                                    )}
                                >
                                    <Filter className="w-5 h-5" />
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -end-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align={locale === "ar" ? "start" : "end"}
                                sideOffset={10}
                                dir={locale === "ar" ? "rtl" : "ltr"}
                                className={cn(
                                    "w-[min(20rem,calc(100vw-2rem))] rounded-xl border-border bg-card p-4 shadow-xl",
                                    locale === "ar" ? "text-right" : "text-left"
                                )}
                            >
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <p className="text-sm font-semibold text-foreground">{t("filter")}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMessageStatus("all");
                                            setMessageAccount("all");
                                        }}
                                        className="text-xs font-medium text-primary hover:underline"
                                    >
                                        {t("resetFilters")}
                                    </button>
                                </div>

                                <WhatsAppAccountSelect
                                    label={t("sendNumber")}
                                    value={messageAccount}
                                    onChange={setMessageAccount}
                                    allowAll={true}
                                />

                                <div className="mt-4 space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        {t("status")}
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[{ value: "all", label: t("allStatuses") }, ...MESSAGE_STATUS_LIST.map((status) => ({
                                            value: status.value,
                                            label: t(`messageStatuses.${status.value}`)
                                        }))].map((status) => {
                                            const selected = messageStatus === status.value;
                                            return (
                                                <button
                                                    key={status.value}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    onClick={() => setMessageStatus(status.value)}
                                                    className={cn(
                                                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                                        selected
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-border bg-background text-foreground hover:bg-accent"
                                                    )}
                                                >
                                                    {status.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                            onClick={() => {
                                onToggleDetails();
                                if (window.innerWidth < 768) {
                                    setMobileView("details");
                                }
                            }}
                            className="p-2 hover:bg-accent/50 rounded-md transition-all text-muted-foreground"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-accent/50 rounded-md transition-all text-muted-foreground">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-md! bg-card border-border">
                                {hasPermission("customer.update") && (
                                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="gap-2 cursor-pointer">
                                        <Edit className="w-4 h-4" />
                                        {t("editContact")}
                                    </DropdownMenuItem>
                                )}
                                {canUpdateConversation && showHandoffTag && (
                                    <DropdownMenuItem
                                        onClick={() => setHandoffDialogOpen(true)}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <Headphones className="w-4 h-4" />
                                        {t("ai.returnToAgent")}
                                    </DropdownMenuItem>
                                )}
                                {canUpdateConversation && showPauseTag && (
                                    <DropdownMenuItem
                                        onClick={() => setPauseDialogOpen(true)}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <Undo2 className="w-4 h-4" />
                                        {t("ai.resumeNow")}
                                    </DropdownMenuItem>
                                )}
                                {canUpdateConversation && (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setAiModeDraft(selectedConversation?.aiMode === "disabled" ? "disabled" : "inherit");
                                            setAiSettingsOpen(true);
                                        }}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <Bot className="w-4 h-4" />
                                        {t("ai.settings")}
                                    </DropdownMenuItem>
                                )}
                                {/* <DropdownMenuItem className="gap-2 text-red-600">
                                    <MessageCircleOff className="w-4 h-4" />
                                    {t("closeChat")}
                                </DropdownMenuItem> */}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            {/* <div className="relative"> */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-2 scroll-smooth relative">
                {hasMoreMessages && (
                    <div className="flex justify-center pb-4">
                        <button
                            onClick={loadMoreMessages}
                            disabled={isMessagesLoading}
                            className="text-xs bg-white/50 hover:bg-white/80 backdrop-blur px-4 py-1.5 rounded-full text-gray-600 font-medium transition-all flex items-center gap-2 shadow-sm border border-gray-100"
                        >
                            {isMessagesLoading ? (
                                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : null}
                            {t("loadMore")}
                        </button>
                    </div>
                )}

                {/* Date Divider */}
                {/* <div className="flex justify-center my-6">
                    <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                        Today
                    </span>
                </div> */}

                {groupedMessages.length > 0 ? (
                    groupedMessages.map((group, groupIndex) => (
                        <div
                            key={group.dateKey}
                            data-date-key={group.dateKey}
                            className="space-y-2 relative"
                        >
                            {/* Date Divider (No longer has the ref) */}
                            <div className="sticky top-2 z-10 flex justify-center my-4 pointer-events-none">
                                <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest shadow-sm border border-gray-200 dark:border-slate-700">
                                    {formatDateLabel(group.date)}
                                </span>
                            </div>


                            {/* Messages in this group */}
                            {group.messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    id={`msg-${msg.id}`}
                                    message={msg}
                                    isOutbound={msg.direction === "outbound"}
                                    onReply={(m) => setReplyTo(m)}
                                    onReaction={onReaction}
                                    onRetry={onRetry}
                                    scrollToMessage={scrollToMessage}
                                    onMediaLoad={handleMediaLoad}
                                    isHighlighted={highlightedMessageId === msg.id}
                                />
                            ))}
                        </div>
                    ))
                ) : isMessagesLoading ? (
                    <MessageSkeleton />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center h-full opacity-60">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                            <Search className="w-8 h-8 text-muted-foreground/60" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {messageStatus !== "all" || messageAccount !== "all"
                                ? t("noResultsFound")
                                : t("noMessagesFound")}
                        </p>
                        {(messageStatus !== "all" || messageAccount !== "all") && (
                            <button
                                onClick={() => {
                                    setMessageStatus("all");
                                    setMessageAccount("all");
                                }}
                                className="mt-2 text-xs text-wa-green hover:underline font-medium"
                            >
                                {t("clearFilters")}
                            </button>
                        )}
                    </div>
                )}

                <div id="messages-end" ref={bottomSentinelRef}></div>

                {/* Floating scroll to bottom button */}
            </div>
            {/* {( 
                
                )}
            </div>
             */}

            {/* Input Area */}
            <MessageInput
                onSend={onSendMessage}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onScrollToMessage={scrollToMessage}
                setShowInteractiveModal={setShowInteractiveModal}
                setShowLocationRequestModal={setShowLocationRequestModal}
                setShowContactModal={setShowContactModal}
                setShowLocationModal={setShowLocationModal}
                setShowListModal={setShowListModal}
                setShowTemplateModal={setShowTemplateModal}
                setShowMediaPreview={setShowMediaPreview}
                setMediaFileType={setMediaFileType}
            />

            <Dialog open={handoffDialogOpen} onOpenChange={setHandoffDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-card">
                    <DialogHeader className="p-6 border-b border-border">
                        <DialogTitle className="text-xl font-bold">{t("ai.returnToAgent")}</DialogTitle>
                        <DialogDescription className="sr-only">{t("ai.returnToAgentBody")}</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <p className="text-sm leading-relaxed text-muted-foreground">{t("ai.returnToAgentBody")}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setHandoffDialogOpen(false)}
                                className="px-4 py-2 rounded-xl border border-border text-sm"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="button"
                                disabled={handoffSaving}
                                onClick={async () => {
                                    setHandoffSaving(true);
                                    try {
                                        await cancelConversationHandoff();
                                        setHandoffDialogOpen(false);
                                    } catch {
                                        toast.error(t("chatFailed"));
                                    } finally {
                                        setHandoffSaving(false);
                                    }
                                }}
                                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-60"
                            >
                                {handoffSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ai.returnToAgent")}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-card">
                    <DialogHeader className="p-6 border-b border-border">
                        <DialogTitle className="text-xl font-bold">{t("ai.resumeNow")}</DialogTitle>
                        <DialogDescription className="sr-only">{t("ai.resumeNowBody")}</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {t("ai.resumeNowBody")}
                            {isPauseActive ? (
                                <>
                                    {" "}
                                    {t("ai.resumesIn")}{" "}
                                    <strong className="font-semibold tabular-nums text-foreground">
                                        {formatCountdown(pauseRemainingMs)}
                                    </strong>
                                    .
                                </>
                            ) : null}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setPauseDialogOpen(false)}
                                className="px-4 py-2 rounded-xl border border-border text-sm"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="button"
                                disabled={pauseSaving}
                                onClick={async () => {
                                    setPauseSaving(true);
                                    try {
                                        await resumeConversationAi();
                                        setPauseDialogOpen(false);
                                    } catch {
                                        toast.error(t("chatFailed"));
                                    } finally {
                                        setPauseSaving(false);
                                    }
                                }}
                                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-60"
                            >
                                {pauseSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ai.resumeNow")}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={aiSettingsOpen} onOpenChange={setAiSettingsOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-card">
                    <DialogHeader className="p-6 border-b border-border">
                        <DialogTitle className="text-xl font-bold">{t("ai.settings")}</DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">{t("ai.settingsDescription")}</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-3">
                        {[
                            { mode: "inherit", label: t("ai.useDefault") },
                            { mode: "disabled", label: t("ai.disabledConversation") },
                        ].map(({ mode, label }) => {
                            const isActive = aiModeDraft === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setAiModeDraft(mode)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3.5 rounded-lg border text-start transition-all duration-200",
                                        isActive
                                            ? "border-[var(--primary)]/40 bg-[var(--primary)]/5"
                                            : "border-border/60 hover:border-border hover:bg-muted/30",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 shrink-0",
                                            isActive ? "border-[var(--primary)]" : "border-slate-300 dark:border-slate-600",
                                        )}
                                    >
                                        {isActive && <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                                    </div>
                                    <span className="font-semibold text-sm text-foreground">{label}</span>
                                </button>
                            );
                        })}
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setAiSettingsOpen(false)}
                                className="px-4 py-2 rounded-xl border border-border text-sm"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="button"
                                disabled={aiSaving}
                                onClick={async () => {
                                    setAiSaving(true);
                                    try {
                                        await updateConversationAi(aiModeDraft);
                                        setAiSettingsOpen(false);
                                    } catch {
                                        toast.error(t("chatFailed"));
                                    } finally {
                                        setAiSaving(false);
                                    }
                                }}
                                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-60"
                            >
                                {aiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("save")}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <CustomerModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                customer={customer}
                onSave={(updatedCustomer) => {
                    if (!customer) return;
                    setConversations(prev => prev.map(conv =>
                        conv.customer?.id === updatedCustomer.id
                            ? { ...conv, customer: updatedCustomer }
                            : conv
                    ));

                    setSelectedConversation(prev => prev.customer?.id === updatedCustomer.id ? { ...prev, customer: updatedCustomer } : prev);
                }}
            />
            <AnimatePresence>
                {!isNearBottom && selectedConversation && (
                    <motion.button
                        key="scroll-to-bottom-btn"
                        onClick={() => scrollToBottom("instant")}
                        // Cleaned up the manual scale/opacity classes since Framer Motion handles them now
                        className={cn(
                            "absolute bottom-24 end-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-lg"
                        )}
                        // 1. Define the start, middle, and end animation states
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        // 2. Replicated your exact custom cubic-bezier ease for that snappy pop effect
                        transition={{
                            duration: 0.15,
                            ease: [0.34, 1.56, 0.64, 1]
                        }}
                        // Bonus: Simple hover effect to make it feel tactile
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {currentUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-wa-green px-1 text-[10px] font-bold leading-none text-white dark:border-slate-800">
                                {currentUnreadCount > 99 ? "99+" : currentUnreadCount}
                            </span>
                        )}

                        <ChevronDown className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
