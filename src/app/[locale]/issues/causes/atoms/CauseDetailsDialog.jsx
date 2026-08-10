"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GhostBtn } from "@/components/atoms/Button";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";

export function CauseDetailsDialog({ cause, open, onClose }) {
    const tc = useTranslations("common");
    const t = useTranslations("issueCauses");

    if (!open || !cause) return null;

    const rows = [
        { label: t("dialog.nameEn"), value: cause.nameEn || tc("notSpecified") },
        { label: t("dialog.nameAr"), value: cause.nameAr || tc("notSpecified") },
        {
            label: t("dialog.type"),
            value: (
                <Badge variant={cause.system ? "secondary" : "outline"}>
                    {cause.system ? t("type.system") : t("type.custom")}
                </Badge>
            ),
        },
        { label: t("dialog.sortOrder"), value: cause.sortOrder ?? 0 },
        { label: t("dialog.issueCount"), value: cause.issueCount ?? 0 },
        // { label: t("dialog.id"), value: cause.id || tc("notSpecified") },
        // {
        //     label: t("dialog.createdAt"),
        //     value: cause.created_at
        //         ? new Date(cause.created_at).toLocaleString()
        //         : tc("notSpecified"),
        // },
        // {
        //     label: t("dialog.updatedAt"),
        //     value: cause.updated_at
        //         ? new Date(cause.updated_at).toLocaleString()
        //         : tc("notSpecified"),
        // },
    ];

    return (
        <ModalShell onClose={onClose}>
            <ModalHeader
                icon={FolderTree}
                title={t("dialog.detailsTitle")}
                subtitle={cause.nameEn || ""}
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
