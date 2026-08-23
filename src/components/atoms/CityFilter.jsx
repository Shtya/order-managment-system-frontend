import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { FilterField } from "./Table";
import api from "@/utils/api";

export default function CityFilter({
  value,
  onChange,
  icon,
  iconClass,
  none = true,
}) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const [list, setList] = useState([]);

  useEffect(() => {
    const getCities = async () => {
      try {
        const res = await api.get("/cities");
        const data = Array.isArray(res.data) ? res.data : res.data?.records || [];
        setList(data);
      } catch (err) {
        console.error("City Lookup Error", err);
      }
    };

    getCities();
  }, []);

  const nameKey = locale === "ar" ? "nameAr" : "nameEn";

  return (
    <FilterField label={t("filters.city")} icon={icon} iconClass={iconClass}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm focus:border-[var(--primary)] transition-all">
          <SelectValue placeholder={t("filters.cityPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.all")}</SelectItem>
          {none && <SelectItem value="none">{t("filters.none")}</SelectItem>}
          {list.map((city) => (
            <SelectItem key={city.id} value={String(city.id)}>
              {city[nameKey] || city.nameEn || city.nameAr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}
