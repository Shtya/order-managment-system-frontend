"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown, Filter, Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { FilterField } from "@/components/atoms/Table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hook/useDebounce";
import { useAuth } from "@/context/AuthContext";
import DateRangePicker from "@/components/atoms/DateRangePicker";

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

export default function FiltersCard({ filters = {}, onApply, onClear, loading = false }) {
  const locale = useLocale();
  const t = useTranslations("issues");
  const { user } = useAuth();
  const isAdmin = user?.role?.name === "admin";
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  useDebounce({
    value: local.search || "",
    delay: 300,
    onDebounce: (v) => setLocal((prev) => ({ ...prev, search: v })),
  });

  const set = (key, val) => setLocal((prev) => ({ ...prev, [key]: val }));

  const localizedName = (ar, en, fallback = "") =>
    locale === "ar" ? ar || en || fallback : en || ar || fallback;

  const handleClear = () => {
    const empty = {
      search: "",
      statusId: "",
      causeId: "",
      priority: "",
      assignedRoleId: "",
      assignedEmployeeId: "",
      isDelayed: false,
      dateFrom: "",
      dateTo: "",
    };
    setLocal(empty);
    onClear?.();
  };

  const prevLoadingRef = React.useRef(loading);

  useEffect(() => {
    if (prevLoadingRef.current && !loading) setApplying(false);
    prevLoadingRef.current = loading;
  }, [loading]);

  const handleApply = () => {
    if (applying) return;
    setApplying(true);
    onApply?.(local);
  };

  return (
    <div className="main-card rounded-2xl border border-border/50 overflow-hidden space-under">
      <div className="px-5 py-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <SlidersHorizontal size={15} />
          </div>
          <div>
            <p className="text-sm font-bold">{t("filters.title")}</p>
            <p className="text-xs text-muted-foreground">
              {t("filters.subtitle")}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen((v) => !v)}
          type="button"
          className={cn(
            "btn btn-sm gap-1.5",
            open ? "btn-solid" : "btn-outline"
          )}
        >
          <SlidersHorizontal size={13} />
          {t("filters.title")}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            style={{ display: "flex" }}
          >
            <ChevronDown size={12} />
          </motion.span>
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 border-t border-border/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <FilterField label={t("filters.search")}>
                  <Input
                    value={local.search || ""}
                    onChange={(e) => set("search", e.target.value)}
                    placeholder={t("filters.searchPlaceholder")}
                  />
                </FilterField>

                <FilterField label={t("filters.status")}>
                  <Select
                    value={local.statusId || ""}
                    onValueChange={(v) => set("statusId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("filters.allStatuses")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(filters.statuses || []).length === 0 ? (
                        <SelectItem value="" disabled>
                          {t("filters.noStatuses")}
                        </SelectItem>
                      ) : (
                        (filters.statuses || []).map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            <span className="flex items-center gap-2">

                              {localizedName(s.nameAr, s.nameEn, s.id)}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label={t("filters.cause")}>
                  <Select
                    value={local.causeId || ""}
                    onValueChange={(v) => set("causeId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("filters.allCauses")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(filters.causes || []).length === 0 ? (
                        <SelectItem value="" disabled>
                          {t("filters.noCauses")}
                        </SelectItem>
                      ) : (
                        (filters.causes || []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {localizedName(c.nameAr, c.nameEn, c.id)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label={t("filters.priority")}>
                  <Select
                    value={local.priority || ""}
                    onValueChange={(v) => set("priority", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("filters.allPriorities")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`priority.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>

                {isAdmin && (
                  <FilterField label={t("filters.assignedRole")}>
                    <Select
                      value={local.assignedRoleId || ""}
                      onValueChange={(v) => set("assignedRoleId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("filters.allRoles")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(filters.roles || []).length === 0 ? (
                          <SelectItem value="" disabled>
                            {t("filters.noRoles")}
                          </SelectItem>
                        ) : (
                          (filters.roles || []).map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.name || r.id}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FilterField>
                )}

                {isAdmin && (
                  <FilterField label={t("filters.assignedEmployee")}>
                    <Select
                      value={local.assignedEmployeeId || ""}
                      onValueChange={(v) => set("assignedEmployeeId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("filters.allEmployees")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(filters.users || []).length === 0 ? (
                          <SelectItem value="" disabled>
                            {t("filters.noEmployees")}
                          </SelectItem>
                        ) : (
                          (filters.users || []).map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.nameEn || u.nameAr || u.email || u.id}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FilterField>
                )}

                <FilterField label={t("filters.dateRange")}>
                  <DateRangePicker
                    value={{
                      startDate: local.dateFrom || null,
                      endDate: local.dateTo || null,
                    }}
                    onChange={(range) => {
                      set("dateFrom", range.startDate || "");
                      set("dateTo", range.endDate || "");
                    }}
                    placeholder={t("filters.dateRange")}
                  />
                </FilterField>

                <FilterField label={t("filters.isDelayed")}>
                  <div className="flex items-center h-10">
                    <Switch
                      checked={!!local.isDelayed}
                      onCheckedChange={(v) => set("isDelayed", v)}
                    />
                    <span className="ms-3 text-sm text-muted-foreground">
                      {local.isDelayed ? t("filters.yes") : t("filters.no")}
                    </span>
                  </div>
                </FilterField>
              </div>

              <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-border/40">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClear}
                  type="button"
                  className="btn btn-outline btn-sm gap-1.5"
                >
                  <X size={13} />
                  {t("actions.clear")}
                </motion.button>
                <motion.button
                  whileHover={applying ? undefined : { scale: 1.02 }}
                  whileTap={applying ? undefined : { scale: 0.97 }}
                  onClick={applying ? undefined : handleApply}
                  disabled={applying}
                  type="button"
                  className={cn(
                    "btn btn-solid btn-sm gap-1.5",
                    applying && "opacity-60 pointer-events-none"
                  )}
                >
                  {applying ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Filter size={13} />
                  )}
                  {t("actions.apply")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
