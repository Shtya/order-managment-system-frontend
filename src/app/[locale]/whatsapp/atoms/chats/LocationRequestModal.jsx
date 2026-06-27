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
import WhatsAppMessageBodyBuilder from "@/components/molecules/WhatsAppMessageBodyBuilder";
import TemplatePreview from "../TemplatePreview";
import { useConversation } from "./ConversationContext";
import { useLocale } from "next-intl";
import { MapPin } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import { FaLocationDot } from "react-icons/fa6";

export default function LocationRequestModal() {
    const t = useTranslations("chats");
    const locale = useLocale();
    const {
        showLocationRequestModal,
        setShowLocationRequestModal,
        locationRequestBody,
        setLocationRequestBody,
        handleSendMessage
    } = useConversation();

    const handleSend = () => {
        handleSendMessage({
            type: "interactive",
            interactive: {
                type: "location_request_message",
                body: { text: locationRequestBody },
                action: {
                    name: "send_location"
                }
            }
        });
        setShowLocationRequestModal(false);
        setLocationRequestBody("");
    };

    return (
        <Dialog open={showLocationRequestModal} onOpenChange={setShowLocationRequestModal}>
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] md:h-[80vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
            
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <MapPin size={20} />
                        </div>
                        {t("messageTypes.requestLocation")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60 text-xs md:text-sm">
                        {t("locationRequestDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Builder Section */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar border-b md:border-b-0 md:border-e border-border bg-card">
                        <WhatsAppMessageBodyBuilder
                            value={locationRequestBody}
                            onChange={setLocationRequestBody}
                            label={t("body")}
                            placeholder={t("locationRequestBodyPlaceholder")}
                            allowVariables={false}
                        />
                    </div>

                    {/* Preview Section */}
                    <div className="w-full md:w-[300px]  flex flex-col items-center justify-center p-4 md:p-6 shrink-0 overflow-y-auto md:border-s border-border">
                        <div className="sticky top-0 w-full flex flex-col items-center">
                            <p className="text-[10px] md:text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mb-4 md:mb-6">
                                {t("preview")}
                            </p>
                            <div className="scale-75 md:scale-90 origin-top transform-gpu">
                                <TemplatePreview
                                    isInteractive={true}
                                    template={{
                                        headerType: "NONE",
                                        bodyText: locationRequestBody || "...",
                                        buttons: [
                                            {
                                                type: "LOCATION_REQUEST",
                                                text: t("sendLocation"),
                                                icon: <FaLocationDot size={14} className="text-primary" />
                                            }
                                        ],
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
                        onClick={() => setShowLocationRequestModal(false)}
                        label={t("cancel")}
                        className="w-full sm:w-auto"
                    />
                    <Button_
                        type="button"
                        disabled={!locationRequestBody}
                        onClick={handleSend}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
