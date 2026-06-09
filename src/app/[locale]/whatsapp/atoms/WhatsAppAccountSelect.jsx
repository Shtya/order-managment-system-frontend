
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";
import api from "@/utils/api";
import { useTranslations } from "next-intl";
import { useOrdersSettings } from "@/hook/useOrdersSettings";

export default function WhatsAppAccountSelect({
    label,
    noLabel = false,
    value,
    onChange,
    allowAll = false
}) {
    const t = useTranslations("whatsApp.accounts");
    const [accounts, setAccounts] = useState([]);
    const { settings } = useOrdersSettings();
    const defaultWhatsAppAccountId = settings?.defaultWhatsAppAccountId;
    const [accountsLoading, setAccountsLoading] = useState(false);

    const displayLabel = label || t("defaultAccountLabel");


    const fetchAccounts = useCallback(async () => {
        setAccountsLoading(true);
        try {
            const res = await api.get("/whatsapp-accounts", { params: { limit: 200, page: 1, isActive: "true" } });
            const values = Array.isArray(res.data?.records) ? res.data.records : []
            // desc by createdAt
            values.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAccounts(values);
            // Only set default if no value is currently selected and allowAll is false
            // if (values.length > 0 && !value && !allowAll) {
            //     onChange?.(values[0].id);
            // }
        } catch (e) {
            console.error(e);
        } finally {
            setAccountsLoading(false);
        }
    }, [value, allowAll, onChange]);

    // Set default value if it's not already set
    useEffect(() => {
        
        if (!value && defaultWhatsAppAccountId) {
            onChange?.(defaultWhatsAppAccountId);
        }
    }, [value, defaultWhatsAppAccountId]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);



    return (
        <div className="space-y-2 w-full ">
            {displayLabel && !noLabel && (
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {displayLabel}
                </Label>
            )}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger disabled={accountsLoading} className="h-[52px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectValue placeholder={t("selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                    {allowAll && (
                        <SelectItem value="all">
                            <span className="font-bold text-sm">{t("allAccounts")}</span>
                        </SelectItem>
                    )}
                    {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id} className="py-2">
                            <div className="flex items-center justify-start flex-col gap-0 text-nowrap">
                                <span className="font-bold text-sm">{acc.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <Phone size={10} /> {acc.mobileNumber}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}