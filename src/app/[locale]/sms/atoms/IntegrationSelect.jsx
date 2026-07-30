import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterField } from "@/components/atoms/Table";
import api from "@/utils/api";

export default function IntegrationSelect({ error, value, onChange, disabled, placeholder, label, noneOption = false, allOption = true, autoSelectIfSingle = false }) {
    const tc = useTranslations("common");
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get("/sms/integrations/active")
            .then(({ data }) => {
                if (cancelled) return;
                const arr = Array.isArray(data) ? data : data?.integrations || [];
                setList(arr);
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (autoSelectIfSingle && list.length === 1) {
            const singleVal = String(list[0].id);
            if (value !== singleVal) onChange(singleVal);
        }
    }, [list, autoSelectIfSingle, onChange, value]);

    const select = (
        <Select value={value || ""} onValueChange={onChange} disabled={disabled || loading}>
            <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                <SelectValue placeholder={placeholder || tc("all")} />
            </SelectTrigger>
            <SelectContent>
                {noneOption && <SelectItem value="none">{tc("none")}</SelectItem>}
                {allOption && <SelectItem value="all">{tc("all")}</SelectItem>}
                {list.map((integ) => (
                    <SelectItem key={integ.id} value={String(integ.id)}>
                        {integ.provider?.name || integ.providerCode}
                    </SelectItem>
                ))}
                {list.length === 0 && !loading && (
                    <div className="px-3 py-4 text-xs text-center text-[var(--muted-foreground)]">
                        {tc("noData")}
                    </div>
                )}
            </SelectContent>
        </Select>
    );

    if (label) {
        return (
            <div className="space-y-1.5">
                <FilterField label={label}>{select}</FilterField>
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {select}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
