import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";
import { useTranslations } from "next-intl";
import { useOrdersSettings } from "@/hook/useOrdersSettings";

export default function WhatsAppAccountSelect({
    label,
    noLabel = false,
    value,
    onChange,
    allowAll = false,
    onLoaded,
    onLoadChange,
    showDuplicates = true,
}) {
    const t = useTranslations("whatsApp.accounts");
    const [accounts, setAccounts] = useState([]);
    const { settings } = useOrdersSettings();
    const defaultWhatsAppAccountId = settings?.defaultWhatsAppAccountId;
    const [accountsLoading, setAccountsLoading] = useState(false);

    const displayLabel = label || t("defaultAccountLabel");

    /**
     * By default, show only one account for each WABA.
     * When showDuplicates=true, show every account.
     *
     * Keep the newest account because accounts are sorted
     * by createdAt descending.
     */
    const visibleAccounts = useMemo(() => {
        if (showDuplicates) {
            return accounts;
        }

        const seenWabaIds = new Set();

        return accounts.filter((account) => {
            // Accounts without a WABA ID should not be grouped together.
            // Each one should remain visible.
            if (!account.wabaId) {
                return true;
            }

            if (seenWabaIds.has(account.wabaId)) {
                return false;
            }

            seenWabaIds.add(account.wabaId);
            return true;
        });
    }, [accounts, showDuplicates]);

    const fetchAccounts = useCallback(async () => {
        setAccountsLoading(true);
        onLoadChange?.(true);

        try {
            const res = await api.get("/whatsapp-accounts", {
                params: {
                    limit: 200,
                    page: 1,
                    isActive: "true",
                },
            });

            const values = Array.isArray(res.data?.records)
                ? res.data.records
                : [];

            // Newest first.
            values.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );

            setAccounts(values);
            onLoaded?.(values);
        } catch (e) {
            console.error(e);
        } finally {
            setAccountsLoading(false);
            onLoadChange?.(false);
        }
    }, [onLoaded, onLoadChange]);

    // Set the configured default account if nothing is selected yet.
    useEffect(() => {
        if (
            !value &&
            defaultWhatsAppAccountId &&
            accounts.length > 0
        ) {
            const defaultAccount = accounts.find(
                (acc) => acc.id === defaultWhatsAppAccountId
            );

            if (defaultAccount) {
                onChange?.(
                    defaultWhatsAppAccountId,
                    defaultAccount
                );
            }
        }
    }, [
        value,
        defaultWhatsAppAccountId,
        accounts,
        onChange,
    ]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    return (
        <div className="space-y-2 w-full">
            {displayLabel && !noLabel && (
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {displayLabel}
                </Label>
            )}

            <Select
                value={value}
                onValueChange={(accountId) => {
                    if (accountId === "all") {
                        onChange?.("all", null);
                        return;
                    }

                    const selectedAccount = visibleAccounts.find(
                        (acc) => acc.id === accountId
                    );

                    onChange?.(accountId, selectedAccount);
                }}
            >
                <SelectTrigger
                    disabled={accountsLoading}
                    className="h-[52px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                >
                    <SelectValue
                        placeholder={t("selectPlaceholder")}
                    />
                </SelectTrigger>

                <SelectContent>
                    {allowAll && (
                        <SelectItem value="all">
                            <span className="font-bold text-sm">
                                {t("allAccounts")}
                            </span>
                        </SelectItem>
                    )}

                    {visibleAccounts.map((acc) => (
                        <SelectItem
                            key={acc.id}
                            value={acc.id}
                            className="py-2"
                        >
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">
                                    {acc.name || acc.mobileNumber || "WhatsApp Account"}
                                </span>

                                {acc.name && acc.mobileNumber && showDuplicates && (
                                    <span className="text-[11px] text-slate-400">
                                        {acc.mobileNumber}
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}