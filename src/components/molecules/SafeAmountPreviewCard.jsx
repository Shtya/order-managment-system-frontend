"use client";

import React from "react";
import AccountIcon from "@/components/atoms/AccountIcon";
import { useTranslations } from "next-intl";

export default function SafeAmountPreviewCard({
    account,
    amount = 0,
    commissionAmount = 0,
    commissionRateLabel,
    amountLabel,
    direction = "OUT",
    showCommissionAmount = true,
}) {
    if (!account) return null;
    const t = useTranslations("safes");
    return (
        <>
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <AccountIcon type={account?.type} size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold truncate">{account.name}</span>
                        <span className="text-xs text-primary font-black">
                            {account.currentBalance?.toLocaleString()} {account.currency}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">{commissionRateLabel}</span>
                    <span className="text-sm font-bold text-rose-500">%{account.commissionRate || 0}</span>
                    {showCommissionAmount && direction === "OUT" && Number(commissionAmount) > 0 && (
                        <span className="text-xs text-rose-500 font-bold">
                            -{Number(commissionAmount).toLocaleString()} {account.currency}
                        </span>
                    )}
                </div>
            </div>

            <div className={`p-4 rounded-xl border-2 text-center mb-2 ${direction === "IN" ? "border-teal-500/30 bg-teal-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                <div className={`text-3xl font-black font-mono ${direction === "IN" ? "text-teal-500" : "text-red-500"}`}>
                    {(Number(amount || 0) + (Number(commissionAmount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-xs ml-1 opacity-70 uppercase">{account?.currency}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                    {amountLabel}
                    {direction === "OUT" && Number(commissionAmount) > 0 && (
                        <span className="block text-[10px] text-rose-400 mt-0.5 lowercase">({t("afterCommission")})</span>
                    )}
                </div>
            </div>
        </>
    );
}
