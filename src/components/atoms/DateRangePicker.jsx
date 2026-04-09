"use client";

import React, { useMemo } from "react";
import Flatpickr from "react-flatpickr";
import { useTranslations } from "next-intl";

export default function DateRangePicker({ value, onChange, placeholder, dataSize = "default", className = "hidden", staticShow = false }) {
  const t = useTranslations("accounts");

  const dateValue = useMemo(() => {
    return [
      value?.startDate ? new Date(value.startDate) : null,
      value?.endDate ? new Date(value.endDate) : null,
    ].filter(Boolean); // Filter out nulls if empty
  }, [value?.startDate, value?.endDate]);

  const handleChange = ([s, e]) => {
    onChange({
      startDate: s ? s : null,
      endDate: e ? e : null,
    });
  };

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
      options={{
        mode: "range",
        dateFormat: "Y-m-d",
        maxDate: "today",
        altInput: true,
        static: staticShow,
        altFormat: "Y-m-d",
        altInputClass: "theme-field",
      }}
      placeholder={placeholder || t("filters.dateRangePlaceholder")}
      data-size={dataSize}
      className={className}
    />
  );
}
