"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import { Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";

import { cn } from "@/utils/cn";
import AccountIcon from "@/components/atoms/AccountIcon";
import { AccountModal } from "@/app/[locale]/accounts/tabs/SafesTab";

export default function SafeSelect({ control, name, error, label, placeholder, required, className }) {
    const t = useTranslations("accounts");
    const [safes, setSafes] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchSafes = useCallback(async () => {
        try {
            const res = await api.get("/safes/accounts", { params: { limit: 200 } });
            setSafes(res.data.records || []);
        } catch (err) {
            console.error("Error fetching safes:", err);
        }
    }, []);

    const activeSafes = useMemo(() => safes.filter((safe) => safe.status === 'ACTIVE'), [safes]);

    useEffect(() => {
        fetchSafes();
    }, [fetchSafes]);

    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-sm text-gray-600 dark:text-slate-300">
                {label} {required && "*"}
            </Label>

            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={cn("w-full rounded-xl !h-[45px] bg-[#fafafa] dark:bg-slate-800/50", error && "border-red-500")}>
                            <SelectValue placeholder={placeholder || t("safes.transactions.safeSearchPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="bg-card-select">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setModalOpen(true);
                                }}
                                className={cn(
                                    "group relative cursor-pointer",
                                    "flex w-full items-center justify-center gap-2.5",
                                    "!rounded-md px-3 py-2 text-sm outline-none",
                                    "text-primary font-bold",
                                    "hover:bg-primary/5 focus:bg-primary/5",
                                    "transition-colors duration-150 text-center"
                                )}
                            >
                                <Plus size={14} />
                                {t("safes.accounts.add") || "Add Safe"}
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                            {activeSafes.map((safe) => (
                                <SelectItem key={safe.id} value={safe.id}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 dark:text-slate-400">
                                            {safe.currentBalance} {safe.currency}
                                        </span>
                                        <span>{safe.name}</span>
                                        <AccountIcon type={safe.type} size={14} className="text-primary/60" />
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}

            <AccountModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSave={fetchSafes}
            />
        </div>
    );
}
