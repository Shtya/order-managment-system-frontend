"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Filter, MoreVertical, Check, CheckCheck, Plus, UserPlus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomerModal from "./CustomerModal";

export default function ChatList({
    conversations = [],
    activeId,
    onSelect,
    activeTab,
    setActiveTab
}) {
    const t = useTranslations("chats");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const tabs = [
        { id: "all", label: t("tabs.all") },
        { id: "unread", label: t("tabs.unread"), count: conversations.filter(c => (c.unreadCount || 0) > 0).length },
    ];

    const filteredConversations = conversations.filter(conv => {
        const nameMatch = (conv.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const phoneMatch = (conv.phoneNumber || "").includes(searchQuery);
        return nameMatch || phoneMatch;
    });

    return (
        <div className="flex flex-col h-full border-e bg-white w-80 lg:w-96">
            {/* Header */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between h-10 overflow-hidden">
                    {!isSearchOpen ? (
                        <>
                            <h1 className="text-xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                                {t("title")}
                            </h1>
                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-300">
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <Search className="w-5 h-5 text-gray-500" />
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <MoreVertical className="w-5 h-5 text-gray-500" />
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t("search")}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-green-500 transition-all focus-visible:outline-none!"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery("");
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "pb-2 text-sm font-medium transition-all relative",
                                activeTab === tab.id
                                    ? "text-green-600 border-b-2 border-green-600"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <span className="flex items-center gap-1.5">
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conv) => (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv)}
                        className={cn(
                            "w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors text-start relative",
                            activeId === conv.id && "bg-green-50/50"
                        )}
                    >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border">
                                {conv.customer?.profilePicture ? (
                                    <img src={conv.customer.profilePicture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-bold text-gray-400">
                                        {conv.customer?.name?.charAt(0) || "?"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                    {conv.customer?.name || conv.phoneNumber}
                                </h3>
                                <span className="text-[10px] text-gray-400">
                                    {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "hh:mm a") : ""}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-gray-500 truncate flex-1">
                                    {conv.lastMessagePreview || "..."}
                                </p>
                                {conv.unreadCount > 0 && (
                                    <span className="bg-green-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                                        {conv.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                ))}

                <button className="w-full p-4 text-sm text-green-600 font-medium hover:bg-gray-50 transition-colors">
                    {t("loadMore")}
                </button>
            </div>

            <CustomerModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSave={(data) => console.log("New Customer:", data)}
            />
        </div>
    );
}

