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
import InteractiveMessageBuilder from "@/components/molecules/InteractiveMessageBuilder";
import TemplatePreview from "../TemplatePreview";
import { useConversation } from "./ConversationContext";
import { useLocale } from "next-intl";
import { LayoutGrid } from "lucide-react";
import Button_ from "@/components/atoms/Button";

export default function InteractiveMessageModal() {
    const t = useTranslations("chats");
    const locale = useLocale();
    const {
        showInteractiveModal,
        setShowInteractiveModal,
        interactiveMessage,
        setInteractiveMessage,
        handleSendMessage,
        headerMediaFile,
        setHeaderMediaFile
    } = useConversation();

    const handleSend = () => {
        handleSendMessage({
            type: "interactive",
            interactive: {
                type: "button",
                header: interactiveMessage.headerType !== "NONE" ? {
                    type: interactiveMessage.headerType.toLowerCase(),
                    [interactiveMessage.headerType.toLowerCase()]: interactiveMessage.headerType === "TEXT"
                        ? { text: interactiveMessage.headerText }
                        : { link: interactiveMessage.headerUrl }
                } : undefined,
                body: { text: interactiveMessage.bodyText },
                footer: interactiveMessage.footerText ? { text: interactiveMessage.footerText } : undefined,
                action: {
                    buttons: interactiveMessage.buttons.map((btn, idx) => ({
                        type: "reply",
                        reply: { id: `btn_${idx}`, title: btn.text }
                    }))
                }
            }
        });
        setShowInteractiveModal(false);
        setInteractiveMessage({
            headerType: "NONE",
            headerText: "",
            headerUrl: "",
            bodyText: "",
            footerText: "",
            buttons: []
        });
    };

    return (
        <Dialog open={showInteractiveModal} onOpenChange={setShowInteractiveModal}>
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-muted/30">
                <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <LayoutGrid size={20} />
                        </div>
                        {t("interactiveMessage")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60">
                        {t("interactiveDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Builder Section */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-e border-border bg-card">
                        <InteractiveMessageBuilder
                            value={interactiveMessage}
                            setHeaderMediaFile={setHeaderMediaFile}
                            onChange={setInteractiveMessage}
                            config={{
                                minButtons: 1,
                                maxButtons: 3,
                                headerTypes: ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"],
                                allowVariables: false,
                                buttonStyles: []
                            }}
                        />
                    </div>

                    {/* Preview Section */}
                    <div className="w-[300px] bg-muted/30 flex flex-col items-center justify-center p-6 shrink-0 overflow-y-auto border-s border-border">
                        <div className="sticky top-0 w-full flex flex-col items-center">
                            <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mb-6">
                                {t("preview")}
                            </p>
                            <div className="scale-90 origin-top transform-gpu">
                                <TemplatePreview
                                    isInteractive={true}
                                    seeAllOptionsLabel={t("viewOptions")}
                                    template={{
                                        headerType: interactiveMessage.headerType,
                                        headerText: interactiveMessage.headerText,
                                        headerUrl: interactiveMessage.headerUrl,
                                        bodyText: interactiveMessage.bodyText,
                                        footerText: interactiveMessage.footerText,
                                        buttons: interactiveMessage.buttons.map(b => ({
                                            type: "QUICK_REPLY",
                                            text: b.text
                                        })),
                                        language: locale === "ar" ? "ar" : "en"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-border bg-card shrink-0 gap-2">
                    <Button_
                        type="button"
                        variant="outline"
                        onClick={() => setShowInteractiveModal(false)}
                        label={t("cancel")}
                    />
                    <Button_
                        type="button"
                        disabled={!interactiveMessage.bodyText || interactiveMessage.buttons.length === 0}
                        onClick={handleSend}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
