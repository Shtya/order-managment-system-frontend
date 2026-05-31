"use client";

import { useTranslations } from "next-intl";
import {
    X, User, Mail, Globe, Languages,
    Calendar, MoreHorizontal, Star,
    Plus, Trash2, ShieldAlert
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import { avatarSrc } from "@/components/atoms/UserSelect";

export default function ChatSidebar({ conversation, onClose }) {
    const t = useTranslations("chats");
    const customer = conversation?.customer;

    if (!conversation) return null;

    return (
        <div className="w-80 border-s bg-white flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
                <h2 className="font-semibold text-gray-900">{t("customerDetails")}</h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Customer Info Card */}
            <div className="p-6 flex flex-col items-center text-center border-b">
                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 border overflow-hidden">
                    {customer?.profilePicture ? (
                        <img src={avatarSrc(customer?.profilePicture)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                            {customer?.name?.charAt(0) || "?"}
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-lg text-gray-900">{customer?.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{customer?.phoneNumber}</p>

                {/* <div className="flex items-center gap-2 w-full">
                    <button className="flex-1 p-2 hover:bg-gray-100 border rounded-lg transition-colors flex justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="flex-1 p-2 hover:bg-gray-100 border rounded-lg transition-colors flex justify-center">
                        <Star className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="flex-1 p-2 hover:bg-gray-100 border rounded-lg transition-colors flex justify-center">
                        <MoreHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                </div> */}
            </div>

            {/* Detailed Info */}
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <InfoRow icon={Mail} label={t("email")} value={customer?.email || "---"} />
                    {/* <InfoRow icon={Globe} label={t("country")} value={customer?.country || "Egypt"} />
                    <InfoRow icon={Languages} label={t("language")} value={customer?.language || "Arabic"} /> */}
                    <InfoRow icon={Calendar} label={t("customerSince")} value={customer?.createdAt ? format(new Date(customer.createdAt), "MMM dd, yyyy") : "---"} />
                </div>
                {/* 
                <button className="w-full py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    {t("viewFullProfile")}
                </button> */}

                {/* Conversation Details */}
                {/* <div className="pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-4">{t("conversationDetails")}</h4>
                    <div className="space-y-4">
                        <DetailRow label={t("status")} value={
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs">
                                {conversation.status || "Open"}
                            </span>
                        } />
                        <DetailRow label={t("assignedTo")} value={
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                                    <img src="https://ui-avatars.com/api/?name=John+Doe" alt="" />
                                </div>
                                <span className="text-sm text-gray-700">John Doe</span>
                            </div>
                        } />
                        <DetailRow label={t("openedAt")} value={conversation.createdAt ? format(new Date(conversation.createdAt), "MMM dd, yyyy hh:mm a") : "---"} />
                        <DetailRow label={t("channel")} value="WhatsApp Business" />
                    </div>
                </div> */}

                {/* Notes */}
                <div className="pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">{t("notes")}</h4>
                    </div>
                    {customer?.notes ? (
                        <div className="text-sm text-gray-700 p-4 bg-gray-50 rounded-lg border border-gray-100 whitespace-pre-wrap">
                            {customer.notes}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg border-dashed border-2">
                            {t("noNotes")}
                        </div>
                    )}
                </div>

                {/* Destructive Actions */}
                {/* <div className="pt-6 border-t space-y-2">
                    <button className="w-full flex items-center gap-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
                        <ShieldAlert className="w-5 h-5" />
                        {t("blockContact")}
                    </button>
                    <button className="w-full flex items-center gap-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
                        <Trash2 className="w-5 h-5" />
                        {t("deleteConversation")}
                    </button>
                </div> */}
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">{label}</span>
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 font-medium">{value}</span>
            </div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <div className="text-gray-700 font-medium">{value}</div>
        </div>
    );
}
