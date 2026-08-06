"use client";

import React, { useMemo } from "react";
import Flatpickr from "react-flatpickr";
import { useTranslations } from "next-intl";
import { getDateRangeParams } from "@/utils/healpers";

export default function DateRangePicker({
  value,
  onChange,
  placeholder,
  dataSize = "default",
  className = "hidden",
  staticShow = false,
  closeOnSelect = true,
  mode = "range", // "single" or "range"
  minDate,
  maxDate = "today",
}) {
  const t = useTranslations("accounts");

  const dateValue = useMemo(() => {
    if (mode === "single") {
      return value ? new Date(value) : null;
    }
    return [
      value?.startDate ? new Date(value.startDate) : null,
      value?.endDate ? new Date(value.endDate) : null,
    ].filter(Boolean); // Filter out nulls if empty
  }, [value, mode]);

  const toDateString = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleChange = (selectedDates) => {
    if (mode === "single") {
      const ymd = toDateString(selectedDates[0] || null);
      onChange(ymd ? new Date(ymd).toISOString() : null);
    } else {
      const [s, e] = selectedDates;
      const formatted = getDateRangeParams({
        startDate: toDateString(s),
        endDate: toDateString(e),
      });
      onChange({
        startDate: formatted.startDate ?? null,
        endDate: formatted.endDate ?? null,
      });
    }

  };

  const options = useMemo(() => ({
    mode: mode,
    dateFormat: "Y-m-d",
    minDate: minDate,
    maxDate: maxDate,
    altInput: true,
    static: staticShow,
    altFormat: "Y-m-d",
    // Force stay open in range mode if only one date is picked
    closeOnSelect: closeOnSelect,
    altInputClass: "theme-field date-field",
    monthSelectorType: "dropdown",
  }), [mode, staticShow, closeOnSelect, minDate, maxDate]);

  return (
    <Flatpickr
      value={dateValue}
      onChange={handleChange}
      onReady={(selectedDates, dateStr, instance) => {
        const size = instance.element.getAttribute('data-size');
        if (size && instance.altInput) {
          instance.altInput.setAttribute('data-size', size);
        }
      }}
      options={options}
      placeholder={placeholder || (mode === "single" ? t("filters.datePlaceholder") : t("filters.dateRangePlaceholder"))}
      data-size={dataSize}
      className={"hidden " + className}
    />
  );
}
