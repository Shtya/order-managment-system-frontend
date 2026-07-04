"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { useTranslations } from "next-intl";
import { VariableInput } from "@/components/ui/VariableInput";

export default function LocationFields({
    values,
    onChange,
    reverse = false,
    errors = {},
    variableProps = {}
}) {
    const t = useTranslations("chats");

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-bold">{t("locationName")} <span className="text-red-500">*</span></Label>
                <VariableInput
                    name="locationName"
                    value={values.name || ""}
                    onChange={(val) => onChange({ name: val })}
                    placeholder={t("locationName")}
                    error={!!errors.name}
                    {...variableProps}
                />
                {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold">{t("locationAddress")} <span className="text-red-500">*</span></Label>
                <VariableInput
                    name="locationAddress"
                    multiline
                    rows={3}
                    value={values.address || ""}
                    onChange={(val) => onChange({ address: val })}
                    placeholder={t("locationAddress")}
                    error={!!errors.address}
                    {...variableProps}
                />
                {errors.address && <p className="text-[10px] text-red-500">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">{t("latitude")}</Label>
                    <Input value={(values.latitude || 0).toFixed(6)} readOnly className="h-8 text-xs bg-muted border-border" />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">{t("longitude")}</Label>
                    <Input value={(values.longitude || 0).toFixed(6)} readOnly className="h-8 text-xs bg-muted border-border" />
                </div>
            </div>
        </div>
    );
}
