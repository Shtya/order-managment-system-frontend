"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import { Plus, User } from "lucide-react";
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
import { SupplierFormDialog } from "@/app/[locale]/suppliers/page";

export default function SupplierSelect({ control, name, error, label, placeholder, required, className, onFetchSuppliers }) {
    const t = useTranslations("addProduct");
    const tCommon = useTranslations("common");
    const [suppliers, setSuppliers] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchSuppliers = useCallback(async () => {
        try {
            const res = await api.get("/lookups/suppliers", { params: { limit: 200 } });
            setSuppliers(Array.isArray(res.data) ? res.data : []);
            onFetchSuppliers?.(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching suppliers:", err);
        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

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
                            <SelectValue placeholder={placeholder} />
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
                                    "!rounded-md px-3 py-2.5 text-sm outline-none",
                                    "text-primary font-bold",
                                    "hover:bg-primary/5 focus:bg-primary/5",
                                    "transition-colors duration-150 text-center"
                                )}
                            >
                                <Plus size={14} />
                                {t("purchase.addNewSupplier") || "Add Supplier"}
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                            <SelectItem value="none">{tCommon("none")}</SelectItem>

                            {suppliers.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    <div className="flex items-center gap-2">
                                        <span>{s.name}</span>
                                        <User size={14} className="text-primary/60" />
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

            <SupplierFormDialog
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={fetchSuppliers}
            />
        </div>
    );
}
