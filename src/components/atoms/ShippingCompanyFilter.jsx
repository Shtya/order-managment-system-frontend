import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { FilterField } from "./Table";
import api from "@/utils/api";

export default function ShippingCompanyFilter({ value, onChange, hideLabel = false }) {
    const tShipping = useTranslations("shipping");
    const t = useTranslations("orders");
    const [list, setList] = useState([]);

    useEffect(() => {
        const getShippingCompanies = async () => {
            try {
                const res = await api.get('/shipping/integrations/active');

                // Handle different possible response structures
                const integrations = Array.isArray(res.data.integrations)
                    ? res.data.integrations
                    : (Array.isArray(res.data) ? res.data : []);

                setList(integrations);
            } catch (err) {
                console.error("Shipping Lookup Error", err);
            }
        };

        getShippingCompanies();
    }, []);

    const select = (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:border-[var(--primary)] transition-all">
                <SelectValue placeholder={t("filters.shippingCompanyPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="none">{t("filters.none")}</SelectItem>
                {list.map(c => (
                    <SelectItem key={c.providerId} value={String(c.providerId)}>
                        {/* Handles your specific translation logic for providers */}
                        {tShipping ? tShipping(`providers.${c.provider.toLowerCase()}`, { defaultValue: c.name }) : c.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    if (hideLabel) return select;

    return (
        <FilterField label={t("filters.shippingCompany")}>
            {select}
        </FilterField>
    );
}