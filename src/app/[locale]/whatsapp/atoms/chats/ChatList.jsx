"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Filter, MoreVertical, Check, CheckCheck, Plus, UserPlus, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/utils/cn";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import CustomerModal from "./CustomerModal";
import { useConversation } from "./ConversationContext";
import { useDebounce } from "@/hook/useDebounce";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { formatText } from "@/utils/whatsapp-healper";
import { useMemo } from "react";

const ChatListItem = ({ conv, activeId, onSelect }) => {
    const formattedPreview = useMemo(() => {
        return formatText(conv.lastMessagePreview) || "...";
    }, [conv.lastMessagePreview]);

    return (
        <button
            onClick={() => onSelect(conv)}
            className={cn(
                "w-full p-4 flex gap-3 hover:bg-accent/50 transition-colors text-start relative group",
                activeId === conv.id && "bg-primary/5"
            )}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                    {conv.customer?.profilePicture ? (
                        <img src={avatarSrc(conv.customer.profilePicture)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-lg font-bold text-muted-foreground/60">
                            {conv.customer?.name?.charAt(0) || "?"}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                        {conv.customer?.name || conv.phoneNumber}
                    </h3>
                    <span className="text-[10px] text-muted-foreground/70">
                        {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "hh:mm a") : ""}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate flex-1 whitespace-pre-wrap">
                        {formattedPreview}
                    </p>
                    {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                            {conv.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

export default function ChatList() {
    const t = useTranslations("chats");
    const {
        conversations,
        isLoading,
        hasMore,
        loadMoreConversations,
        setSearch,
        selectedConversation,
        setSelectedConversation,
        setMobileView,
        activeTab,
        setActiveTab
    } = useConversation();

    const activeId = selectedConversation?.id;
    const onSelect = (conv) => {
        setSelectedConversation(conv);
        setMobileView("chat");
    };

    const formatTime = (date) => {
        if (!date) return "";
        return format(new Date(date), "hh:mm a");
    };

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Debounce search
    useDebounce({
        value: searchQuery,
        onDebounce: (val) => setSearch(val)
    });

    const tabs = [
        { id: "all", label: t("tabs.all") },
        { id: "unread", label: t("tabs.unread") },
    ];

    return (
        <div className="flex flex-col h-full border-e border-border bg-card w-full">
            {/* Header */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between h-10 overflow-hidden">
                    {!isSearchOpen ? (
                        <>
                            <h1 className="text-xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300 text-foreground">
                                {t("title")}
                            </h1>
                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-300">
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                >
                                    <Search className="w-5 h-5 text-muted-foreground" />
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 hover:bg-muted rounded-full transition-colors">
                                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-md!">
                                        <DropdownMenuItem onClick={() => setIsAddModalOpen(true)} className="gap-2 cursor-pointer">
                                            <UserPlus className="w-4 h-4" />
                                            {t("addCustomer")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t("search")}
                                    className="w-full pl-9 pr-4 py-2 bg-muted border-none rounded-full text-sm focus:ring-2 focus:ring-primary transition-all focus-visible:outline-none! text-foreground placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery("");
                                }}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "pb-2 text-sm font-medium transition-all relative",
                                activeTab === tab.id
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="flex items-center gap-1.5">
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {conversations.length === 0 && !isLoading && (
                    <div className="p-8 text-center text-muted-foreground/60 text-sm">
                        {t("noResults")}
                    </div>
                )}

                {conversations.map((conv) => (
                    <ChatListItem
                        key={conv.id}
                        conv={conv}
                        activeId={activeId}
                        onSelect={onSelect}
                    />
                ))}

                {hasMore && (
                    <button
                        onClick={loadMoreConversations}
                        disabled={isLoading}
                        className="w-full p-4 text-sm text-primary font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            t("loadMore")
                        )}
                    </button>
                )}

                {isLoading && conversations.length === 0 && (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}
            </div>

            <CustomerModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
            />
        </div>
    );
}

