import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { FilterField } from "./Table";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

export default function ShippingCompanyFilter({
  value,
  onChange,
  hideLabel = false,
  showAll = true,
  showNone = true,
  autoSelectIfSingle = false,
}) {
  const tShipping = useTranslations("shipping");
  const t = useTranslations("orders");

  const { shippingCompanies } = usePlatformSettings()

  useEffect(() => {
    if (autoSelectIfSingle && shippingCompanies.length === 1) {
      const singleValue = String(shippingCompanies[0].providerId);
      if (value !== singleValue) {
        onChange(singleValue);
      }
    }
  }, [shippingCompanies, autoSelectIfSingle, onChange, value]);

  const select = (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:border-[var(--primary)] transition-all">
        <SelectValue placeholder={t("filters.shippingCompanyPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value="all">{t("filters.all")}</SelectItem>}
        {showNone && <SelectItem value="none">{t("filters.none")}</SelectItem>}
        {shippingCompanies.map((c) => (
          <SelectItem key={c.providerId} value={String(c.providerId)}>
            {/* Handles your specific translation logic for providers */}
            {tShipping
              ? tShipping(`providers.${c.provider.toLowerCase()}`, {
                defaultValue: c.name,
              })
              : c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (hideLabel) return select;

  return (
    <FilterField label={t("filters.shippingCompany")}>{select}</FilterField>
  );
}
