"use client";

import { useTranslations } from "next-intl";
import { FilterField } from "./TicketTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import DateRangePicker from "@/components/atoms/DateRangePicker";
import { TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from "./TicketBadges";
import { useAuth } from "@/context/AuthContext";

export default function TicketFilters({ filters = {}, onChange, scope = "tenant" }) {
  const t = useTranslations("supportTickets");
  const { isSuperAdmin } = useAuth();
  const set = (key, value) => onChange?.({ ...filters, [key]: value || "" });
  const toggle = (key) => onChange?.({ ...filters, [key]: filters[key] ? "" : true });

  return (
    <>
      <FilterField label={t("filters.status")}>
        <Select value={filters.status || ""} onValueChange={(v) => set("status", v === "all" ? "" : v)}>
          <SelectTrigger className="h-[38px] rounded-xl">
            <SelectValue placeholder={t("filters.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            {TICKET_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(`status.${opt.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      {isSuperAdmin && (
        <FilterField label={t("filters.priority")}>
          <Select value={filters.priority || ""} onValueChange={(v) => set("priority", v === "all" ? "" : v)}>
            <SelectTrigger className="h-[38px] rounded-xl">
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              {TICKET_PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(`priority.${opt.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      <FilterField label={t("filters.date")}>
        <DateRangePicker
          value={{
            startDate: filters.startDate,
            endDate: filters.endDate,
          }}
          onChange={(d) =>
            onChange?.({
              ...filters,
              startDate: d?.startDate ?? null,
              endDate: d?.endDate ?? null,
            })
          }
          placeholder={t("filters.datePlaceholder")}
          dataSize="default"
          maxDate="today"
        />
      </FilterField>

      {scope === "admin" && (
        <>
          {/* <FilterField label={t("stats.unassigned")}>
            <label className="flex items-center gap-2 cursor-pointer select-none h-[38px]">
              <Checkbox
                checked={filters.unassigned === true}
                onCheckedChange={() => toggle("unassigned")}
              />
              <span className="text-xs text-muted-foreground">
                {t("stats.unassigned")}
              </span>
            </label>
          </FilterField> */}

          <FilterField label={t("stats.unreadBySupport")}>
            <label className="flex items-center gap-2 cursor-pointer select-none h-[38px]">
              <Checkbox
                checked={filters.hasUnreadSupport === true}
                onCheckedChange={() => toggle("hasUnreadSupport")}
              />
              <span className="text-xs text-muted-foreground">
                {t("stats.unreadBySupport")}
              </span>
            </label>
          </FilterField>
        </>
      )}
    </>
  );
}
