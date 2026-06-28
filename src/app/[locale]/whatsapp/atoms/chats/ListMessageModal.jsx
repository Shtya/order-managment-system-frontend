"use client";

import React, { useMemo } from "react";
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
    
    const isSendDisabled = useMemo(() => {
        return (
            !listMessage.bodyText ||
            !listMessage.menuLabel ||
            listMessage.sections.length === 0 ||
            listMessage.sections.some(section => 
                !section.title || 
                section.rows.length === 0 ||
                section.rows.some(row => !row.title )
            )
        );
    }, [listMessage]);

    const handleSend = () => {
        handleSendMessage({
            type: "interactive",
            interactive: {
                type: "list",
                header: listMessage.headerType !== "NONE" ? {
                    type: listMessage.headerType.toLowerCase(),
                    [listMessage.headerType.toLowerCase()]: listMessage.headerType === "TEXT"
                        ? listMessage.headerText
                        : { 
                            link: listMessage.headerUrl
                         }
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
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <List size={20} />
                        </div>
                        {t("listMessage")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60 text-xs md:text-sm">
                        {t("listDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Builder Section */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar border-b md:border-b-0 md:border-e border-border bg-card">
                        <ListMessageBuilder
                            value={listMessage}
                            onChange={setListMessage}
                            setHeaderMediaFile={setHeaderMediaFile}
                        />
                    </div>

                    {/* Preview Section */}
                    <div className="w-full md:w-[300px] b flex flex-col items-center justify-center p-4 md:p-6 shrink-0 overflow-y-auto md:border-s border-border">
                        <div className="sticky top-0 w-full flex flex-col items-center">
                            <p className="text-[10px] md:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mb-4 md:mb-6">
                                {t("preview")}
                            </p>
                            <div className="scale-75 md:scale-90 origin-top transform-gpu">
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

                <DialogFooter className="px-4 md:px-6 py-4 border-t border-border bg-card shrink-0 gap-2 flex flex-col-reverse sm:flex-row">
                    <Button_
                        type="button"
                        variant="outline"
                        onClick={() => setShowListModal(false)}
                        label={t("cancel")}
                        className="w-full sm:w-auto"
                    />
                    <Button_
                        type="button"
                        disabled={isSendDisabled}
                        onClick={handleSend}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
