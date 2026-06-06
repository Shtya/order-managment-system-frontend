"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { useTranslations } from "next-intl";

export default function LocationFields({ values, onChange, reverse = false, errors = {} }) {
    const t = useTranslations("chats");

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-bold">{t("locationName")} <span className="text-red-500">*</span></Label>
                <Input 
                    value={values.name || ""} 
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder={t("locationName")} 
                    className={errors.name ? "border-red-500" : ""} 
                />
                {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold">{t("locationAddress")} <span className="text-red-500">*</span></Label>
                <textarea
                    value={values.address || ""}
                    onChange={(e) => onChange({ address: e.target.value })}
                    rows={3}
                    placeholder={t("locationAddress")}
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        errors.address ? "border-red-500" : ""
                    )}
                />
                {errors.address && <p className="text-[10px] text-red-500">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("latitude")}</Label>
                    <Input value={(values.latitude || 0).toFixed(6)} readOnly className="h-8 text-xs bg-slate-50 dark:bg-slate-800" />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("longitude")}</Label>
                    <Input value={(values.longitude || 0).toFixed(6)} readOnly className="h-8 text-xs bg-slate-50 dark:bg-slate-800" />
                </div>
            </div>
        </div>
    );
}
