"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
    MoreVertical, Phone, Video,
    Search, Star, Info, MessageCircleOff, X, Edit, UserMinus, UserCheck
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

export default function ChatWindow({ conversation, messages = [], onSendMessage, onReaction, onToggleDetails }) {
    const t = useTranslations("chats");
    const scrollRef = useRef(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterQuery, setFilterQuery] = useState("");
    const [filterAccount, setFilterAccount] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    const customer = conversation?.customer;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        // Reset reply state when conversation changes
        setReplyTo(null);
    }, [conversation?.id]);

    const scrollToMessage = (messageId) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2000);
        }
    };

    const filteredMessages = messages.filter(msg => {
        const queryMatch = (msg.content?.text?.body || "").toLowerCase().includes(filterQuery.toLowerCase());
        const accountMatch = filterAccount === "all" || msg.accountId === filterAccount;
        const statusMatch = filterStatus === "all" || msg.status === filterStatus;
        return queryMatch && accountMatch && statusMatch;
    });

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircleOff className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Conversation Selected</h2>
                <p className="max-w-xs text-sm">Select a chat from the sidebar to start messaging your customers.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F2F2F2] overflow-hidden relative">
            <MediaPreviewOverlay />
            <InteractiveMessageModal />
            <LocationRequestModal />
            <ContactModal />
            <LocationModal />
            <ListMessageModal />
            <TemplateMessageModal />

            {/* Filter Bar (Animated) */}
            {isFilterOpen && (
                <div className="absolute top-16 left-0 right-0 bg-white border-b p-4 z-20 shadow-md animate-in slide-in-from-top duration-300 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            placeholder={t("search")}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus-visible:outline-none!"
                        />
                    </div>
                    <div className="w-48">
                        <WhatsAppAccountSelect
                            label={null}
                            value={filterAccount}
                            onChange={setFilterAccount}
                            allowAll={true}
                        />
                    </div>
                    <div className="w-40">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-10 bg-gray-50 border-gray-200 rounded-lg text-sm">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="SENT">Sent</SelectItem>
                                <SelectItem value="DELIVERED">Delivered</SelectItem>
                                <SelectItem value="READ">Read</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="h-16 flex-shrink-0 bg-white border-b px-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border">
                            {customer?.profilePicture ? (
                                <img src={customer.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                                    {customer?.name?.charAt(0) || "?"}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 leading-tight">{customer?.name}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                                "p-2 hover:bg-gray-100 rounded-md transition-all text-gray-500",
                                isFilterOpen && "bg-gray-100 text-green-600"
                            )}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onToggleDetails}
                            className="p-2 hover:bg-gray-100 rounded-md transition-all text-gray-500"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-gray-100 rounded-md transition-all text-gray-500">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-md!">
                                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="gap-2 cursor-pointer">
                                    <Edit className="w-4 h-4" />
                                    {t("editClient")}
                                </DropdownMenuItem>
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
                className="flex-1 overflow-y-auto p-6 space-y-2 scroll-smooth"
                style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay', backgroundColor: '#efeae2' }}
            >
                {/* Date Divider */}
                <div className="flex justify-center my-6">
                    <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                        Today
                    </span>
                </div>

                {filteredMessages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        message={msg}
                        isOutbound={msg.direction === "OUTBOUND"}
                        onReply={(m) => setReplyTo(m)}
                        onReaction={onReaction}
                        isHighlighted={highlightedMessageId === msg.id}
                    />
                ))}
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
                onSave={(data) => console.log("Updated Customer:", data)}
            />
        </div>
    );
}
