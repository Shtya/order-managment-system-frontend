"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GhostBtn } from "@/components/atoms/Button";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";

export function CauseDetailsDialog({ cause, open, onClose }) {
    const tc = useTranslations("common");
    const t = useTranslations("cancelCauses");

    if (!open || !cause) return null;

    const statusKey = cause.reviewStatus || "approved";

    const rows = [
        { label: t("dialog.name"), value: cause.name || tc("notSpecified") },
        {
            label: t("dialog.description"),
            value: cause.description || tc("notSpecified"),
        },
        {
            label: t("columns.status"),
            value: (
                <Badge variant={statusKey === "approved" ? "secondary" : "outline"}>
                    {t(`status.${statusKey}`)}
                </Badge>
            ),
        },
        {
            label: t("columns.active"),
            value: cause.isActive ? t("filters.active") : t("filters.inactive"),
        },
        { label: t("dialog.sortOrder"), value: cause.sortOrder ?? 0 },
        { label: t("columns.usageCount"), value: cause.usageCount ?? 0 },
        {
            label: t("columns.submittedBy"),
            value: cause.submittedByEmployee?.name || tc("notSpecified"),
        },
        {
            label: t("dialog.reviewNote"),
            value: cause.reviewNote || tc("notSpecified"),
        },
    ];

    return (
        <ModalShell onClose={onClose}>
            <ModalHeader
                icon={Ban}
                title={t("dialog.detailsTitle")}
                subtitle={cause.name || ""}
                onClose={onClose}
            />
            <div className="p-6">
                <div className="rounded-xl divide-y divide-[var(--border)] overflow-hidden">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                            <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                                {row.label}
                            </span>
                            <span className="text-sm font-medium text-[var(--card-foreground)] text-end break-words">
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-5">
                    <GhostBtn onClick={onClose}>{t("dialog.close")}</GhostBtn>
                </div>
            </div>
        </ModalShell>
    );
}
