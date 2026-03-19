import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { FilterField } from "./Table";
import api from "@/utils/api";

export default function StoreFilter({ value, onChange }) {
    const t = useTranslations("orders");
    const [list, setList] = useState([]);

    useEffect(() => {
        const getStores = async () => {
            try {
                const res = await api.get('/lookups/stores', { params: { limit: 200, isActive: true } });
                const data = Array.isArray(res.data) ? res.data : (res.data?.records || []);
                setList(data);
            } catch (err) {
                console.error("Store Lookup Error", err);
            }
        };

        getStores();
    }, []);
    return (
        <FilterField label={t("filters.store")}>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:border-[var(--primary)] transition-all">
                    <SelectValue placeholder={t("filters.storePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t("filters.all")}</SelectItem>
                    <SelectItem value="none">{t("filters.none")}</SelectItem>
                    {list.map(store => (
                        <SelectItem key={store.id ?? store.value} value={String(store.id ?? store.value)}>
                            {store.name ?? store.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FilterField>
    );
}