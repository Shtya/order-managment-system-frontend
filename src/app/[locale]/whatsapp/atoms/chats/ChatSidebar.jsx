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
import { useConversation } from "./ConversationContext";

export default function ChatSidebar({ conversation, onClose }) {
    const t = useTranslations("chats");
    const { setMobileView } = useConversation();
    const customer = conversation?.customer;

    if (!conversation) return null;

    const handleClose = () => {
        onClose();
        if (window.innerWidth < 768) {
            setMobileView("chat");
        }
    };

    return (
        <div className="w-full md:w-80 border-s border-border bg-card flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-border sticky top-0 bg-card z-10">
                <h2 className="font-semibold text-foreground">{t("customerDetails")}</h2>
                <button
                    onClick={handleClose}
                    className="p-1 hover:bg-accent/50 rounded-md transition-colors"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            {/* Customer Info Card */}
            <div className="p-6 flex flex-col items-center text-center border-b border-border">
                <div className="w-24 h-24 rounded-full bg-muted mb-4 border border-border overflow-hidden">
                    {customer?.profilePicture ? (
                        <img src={avatarSrc(customer?.profilePicture)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground/40">
                            {customer?.name?.charAt(0) || "?"}
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-lg text-foreground">{customer?.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{customer?.phoneNumber}</p>
            </div>

            {/* Detailed Info */}
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <InfoRow icon={Mail} label={t("email")} value={customer?.email || "---"} />
                    <InfoRow icon={Calendar} label={t("customerSince")} value={customer?.createdAt ? format(new Date(customer.createdAt), "MMM dd, yyyy") : "---"} />
                </div>

                {/* Notes */}
                <div className="pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-foreground">{t("notes")}</h4>
                    </div>
                    {customer?.notes ? (
                        <div className="text-sm text-foreground p-4 bg-muted/30 rounded-lg border border-border whitespace-pre-wrap">
                            {customer.notes}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg border-dashed border-2 border-border">
                            {t("noNotes")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground/70">{label}</span>
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground/60" />
                <span className="text-sm text-foreground font-medium">{value}</span>
            </div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <div className="text-foreground font-medium">{value}</div>
        </div>
    );
}
