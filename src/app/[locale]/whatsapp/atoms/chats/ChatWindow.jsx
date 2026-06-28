"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
    MoreVertical, Phone, Video,
    Search, Star, Info, MessageCircleOff, X, Edit, UserMinus, UserCheck, Loader2, ChevronLeft
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import WhatsAppAccountSelect from "../WhatsAppAccountSelect";
import CustomerModal from "./CustomerModal";
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
import { useDebounce } from "@/hook/useDebounce";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";


export default function ChatWindow({ onSendMessage, onToggleDetails }) {
    const t = useTranslations("chats");
    const { hasPermission } = useAuth();
    const scrollRef = useRef(null);
    const {
        selectedAccount,
        selectedConversation,
        setSelectedConversation,
        messages,
        setConversations,
        isMessagesLoading,
        hasMoreMessages,
        loadMoreMessages,
        messageSearch,
        setMessageSearch,
        messageStatus,
        setMessageStatus,
        messageAccount,
        setMessageAccount,
        handleRetryMessage: onRetry,
        handleReaction: onReaction,
        replyTo,
        setReplyTo,
        setMobileView
    } = useConversation();

    const locale  = useLocale();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState("");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    // Sync local search with messageSearch when it changes (e.g. when conversation changes)
    useEffect(() => {
        setLocalSearch(messageSearch);
    }, [messageSearch]);

    // Debounce message search
    useDebounce({
        value: localSearch,
        onDebounce: (val) => setMessageSearch(val)
    });

    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    const customer = selectedConversation?.customer;
    const prevScrollHeight = useRef(0);
    const prevMessagesCount = useRef(0);
    const lastConversationId = useRef(null);

    useLayoutEffect(() => {
        if (scrollRef.current) {
            const currentCount = messages.length;
            const currentLastConversationId = messages[currentCount - 1]?.conversationId;
            const diff = currentCount - prevMessagesCount.current;

            // 1. Initial Load: scroll to bottom
            if (prevMessagesCount.current === 0 && currentCount > 0) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
            // 2. New messages arrived
            else if (diff > 0) {
                const isNewLastConversation = currentLastConversationId !== lastConversationId.current;

                if (isNewLastConversation || diff === 1) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                } else {
                    // const delta = scrollRef.current.scrollHeight - prevScrollHeight.current;
                    // scrollRef.current.scrollTop = delta;
                }


            }

            // Update refs for next render
            prevScrollHeight.current = scrollRef.current.scrollHeight;
            prevMessagesCount.current = currentCount;
            lastConversationId.current = currentLastConversationId;
        }
    }, [messages.length, selectedConversation?.id]);

    useEffect(() => {
        // Reset scroll tracking when conversation changes
        prevScrollHeight.current = 0;
        prevMessagesCount.current = 0;
        lastConversationId.current = null;
        setReplyTo(null);
    }, [selectedConversation?.id]);

    const scrollToMessage = (messageId) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2000);
        }
    };

    const filteredMessages = messages;

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
            <MediaPreviewOverlay />
            <InteractiveMessageModal />
            <LocationRequestModal />
            <ContactModal />
            <LocationModal />
            <ListMessageModal />
            <TemplateMessageModal selectedAccount={selectedAccount} />

            {/* Filter Bar (Animated) */}
            {isFilterOpen && (
                <div className="absolute top-16 left-0 right-0 bg-card border-b border-border p-4 z-20 shadow-md animate-in slide-in-from-top duration-300 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder={t("search")}
                            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus-visible:outline-none! text-foreground placeholder:text-muted-foreground/50"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch md:items-center">
                        <div className="w-full md:w-48">
                            <WhatsAppAccountSelect
                                label={null}
                                value={messageAccount}
                                onChange={setMessageAccount}
                                allowAll={true}
                            />
                        </div>
                        <div className="w-full md:w-40 flex flex-col gap-2">
                            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {t("status")}
                            </Label>
                            <Select value={messageStatus} onValueChange={setMessageStatus}>
                                <SelectTrigger className="h-10 bg-muted border-border rounded-lg text-sm text-foreground">
                                    <SelectValue placeholder={t("allStatuses")} />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                                    {MESSAGE_STATUS_LIST.map(status => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setIsFilterOpen(false);
                            setLocalSearch("");
                            setMessageStatus("all");
                            setMessageAccount("all");
                        }}
                        className="absolute top-2 right-2 md:relative md:top-auto md:right-auto p-2 hover:bg-accent/50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
            )}

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
                    <div className="min-w-0">
                        <h2 className="font-bold text-foreground leading-tight truncate">{customer?.name || customer?.phoneNumber}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                                "p-2 hover:bg-accent/50 rounded-md transition-all text-muted-foreground",
                                isFilterOpen && "bg-primary/10 text-primary"
                            )}
                        >
                            <Search className="w-5 h-5" />
                        </button>
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
                                        {t("editClient")}
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
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-2 scroll-smooth"

            >
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

                {filteredMessages.length > 0 ? (
                    filteredMessages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            id={`msg-${msg.id}`}
                            message={msg}
                            isOutbound={msg.direction === "outbound"}
                            onReply={(m) => setReplyTo(m)}
                            onReaction={onReaction}
                            onRetry={onRetry}
                            isHighlighted={highlightedMessageId === msg.id}
                        />
                    ))
                ) : isMessagesLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-10 h-10 text-primary animate-spin opacity-50" />
                        <p className="mt-4 text-sm text-muted-foreground font-medium animate-pulse">
                            {t("loadingMessages")}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center h-full opacity-60">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                            <Search className="w-8 h-8 text-muted-foreground/60" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {messageSearch || messageStatus !== "all" || messageAccount !== "all"
                                ? t("noResultsFound")
                                : t("noMessagesFound")}
                        </p>
                        {(messageSearch || messageStatus !== "all" || messageAccount !== "all") && (
                            <button
                                onClick={() => {
                                    setLocalSearch("");
                                    setMessageSearch("");
                                    setMessageStatus("all");
                                    setMessageAccount("all");
                                }}
                                className="mt-2 text-xs text-primary hover:underline font-medium"
                            >
                                {t("clearFilters")}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <MessageInput
                onSend={onSendMessage}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onScrollToMessage={scrollToMessage}
            />

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
        </div>
    );
}
