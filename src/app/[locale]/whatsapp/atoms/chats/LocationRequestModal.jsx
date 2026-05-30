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
                type: "location_request_button",
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
            <DialogContent className="sm:max-w-[900px] w-full h-[80vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <DialogHeader className="px-6 py-4 border-b bg-white dark:bg-slate-900 shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <MapPin size={20} />
                        </div>
                        {t("messageTypes.requestLocation")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2">
                        {t("locationRequestDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Builder Section */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-e bg-white dark:bg-slate-900">
                        <WhatsAppMessageBodyBuilder
                            value={locationRequestBody}
                            onChange={setLocationRequestBody}
                            label={t("body")}
                            placeholder={t("locationRequestBodyPlaceholder")}
                            allowVariables={false}
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
                                    template={{
                                        headerType: "NONE",
                                        bodyText: locationRequestBody || "...",
                                        buttons: [
                                            {
                                                type: "LOCATION_REQUEST",
                                                text: t("sendLocation"),
                                                icon: <FaLocationDot size={14} className="text-green-600" />
                                            }
                                        ],
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
                        onClick={() => setShowLocationRequestModal(false)}
                        label={t("cancel")}
                    />
                    <Button_
                        type="button"
                        disabled={!locationRequestBody}
                        onClick={handleSend}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
