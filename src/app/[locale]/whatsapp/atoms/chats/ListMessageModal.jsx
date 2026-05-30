"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import ListMessageBuilder from "@/components/molecules/ListMessageBuilder";
import TemplatePreview from "../TemplatePreview";
import { useConversation } from "./ConversationContext";
import { useLocale } from "next-intl";
import { List } from "lucide-react";
import Button_ from "@/components/atoms/Button";

export default function ListMessageModal() {
    const t = useTranslations("chats");
    const locale = useLocale();
    const {
        showListModal,
        setShowListModal,
        listMessage,
        setListMessage,
        handleSendMessage,
        setHeaderMediaFile
    } = useConversation();

    const handleSend = () => {
        handleSendMessage({
            type: "interactive",
            interactive: {
                type: "list",
                header: listMessage.headerType !== "NONE" ? {
                    type: listMessage.headerType.toLowerCase(),
                    [listMessage.headerType.toLowerCase()]: listMessage.headerType === "TEXT"
                        ? { text: listMessage.headerText }
                        : { link: listMessage.headerUrl }
                } : undefined,
                body: { text: listMessage.bodyText },
                footer: listMessage.footerText ? { text: listMessage.footerText } : undefined,
                action: {
                    button: listMessage.menuLabel,
                    sections: listMessage.sections.map((s) => ({
                        title: s.title,
                        rows: s.rows.map((r) => ({
                            id: r.id,
                            title: r.title,
                            description: r.description || undefined
                        }))
                    }))
                }
            }
        });
        setShowListModal(false);
        setListMessage({
            headerType: "NONE",
            headerText: "",
            headerUrl: "",
            bodyText: "",
            footerText: "",
            menuLabel: "View Options",
            sections: [{ title: "", rows: [] }]
        });
    };

    return (
        <Dialog open={showListModal} onOpenChange={setShowListModal}>
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <DialogHeader className="px-6 py-4 border-b bg-white dark:bg-slate-900 shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <List size={20} />
                        </div>
                        {t("listMessage")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2">
                        {t("listDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Builder Section */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-e bg-white dark:bg-slate-900">
                        <ListMessageBuilder
                            value={listMessage}
                            onChange={setListMessage}
                            setHeaderMediaFile={setHeaderMediaFile}
                        />
                    </div>

                    {/* Preview Section */}
                    <div className="w-[300px] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 shrink-0 overflow-y-auto border-s">
                        <div className="sticky top-0 w-full flex flex-col items-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                                {t("preview")}
                            </p>
                            <div className="scale-90 origin-top transform-gpu">
                                <TemplatePreview
                                    isInteractive={true}
                                    isList={true}
                                    seeAllOptionsLabel={listMessage.menuLabel}
                                    template={{
                                        headerType: listMessage.headerType,
                                        headerText: listMessage.headerText,
                                        headerUrl: listMessage.headerUrl,
                                        bodyText: listMessage.bodyText,
                                        footerText: listMessage.footerText,
                                        sections: listMessage.sections,
                                        language: locale === "ar" ? "ar" : "en"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-white dark:bg-slate-900 shrink-0 gap-2">
                    <Button_
                        type="button"
                        variant="outline"
                        onClick={() => setShowListModal(false)}
                        label={t("cancel")}
                    />
                    <Button_
                        type="button"
                        disabled={
                            !listMessage.bodyText ||
                            !listMessage.menuLabel ||
                            listMessage.sections.length === 0 ||
                            listMessage.sections.some(s => !s.title || s.rows.length === 0)
                        }
                        onClick={handleSend}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
