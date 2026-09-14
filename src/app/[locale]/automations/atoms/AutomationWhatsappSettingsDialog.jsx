"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WhatsAppAccountSelect from "../../whatsapp/atoms/WhatsAppAccountSelect";
import { normalizeWhatsappSettings } from "./whatsapp-flow-settings";

export default function AutomationWhatsappSettingsDialog({
    open,
    onOpenChange,
    value,
    onSave,
}) {
    const tCommon = useTranslations("common");
    const tConfig = useTranslations("whatsApp.automations.builder.config");
    const t = useTranslations("whatsApp.automations.builder.settings");
    const [tempValue, setTempValue] = useState(() => normalizeWhatsappSettings(value));

    useEffect(() => {
        if (open) setTempValue(normalizeWhatsappSettings(value));
    }, [open, value]);

    const handleAccountChange = (accountId) => {
        if (!accountId) {
            setTempValue({
                mode: "random",
                accountId: null,
                acknowledged: true,
            });
            return;
        }
        setTempValue({
            mode: "fixed",
            accountId,
            acknowledged: true,
        });
    };

    const handleSave = () => {
        onSave({
            ...normalizeWhatsappSettings(tempValue),
            acknowledged: true,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0 pe-10">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                            <Settings size={20} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="truncate">{t("title")}</span>
                            <DialogDescription className="text-xs text-muted-foreground font-normal">
                                {t("subtitle")}
                            </DialogDescription>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-card space-y-4">
                    <WhatsAppAccountSelect
                        label={t("account")}
                        value={tempValue.mode === "fixed" ? tempValue.accountId : null}
                        allowRandom
                        randomLabel={t("random")}
                        onChange={handleAccountChange}
                    />
                    {/* <p className="text-xs text-muted-foreground">
                        {t("hint")}
                    </p> */}
                </div>

                <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-card shrink-0">
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-6">
                            {tCommon("cancel")}
                        </Button>
                        <Button type="button" onClick={handleSave} className="rounded-xl px-8">
                            {tConfig("saveChanges")}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
