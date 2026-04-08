"use client";

import React from "react";
import Flatpickr from "react-flatpickr";
import { useTranslations } from "next-intl";

export default function DateRangePicker({ value, onChange, placeholder, dataSize = "default", className = "hidden" }) {
  const t = useTranslations("accounts");

  const handleChange = ([s, e]) => {
    onChange({
      startDate: s ? s : null,
      endDate: e ? e : null,
    });
  };

  return (
    <Flatpickr
      value={[
        value?.startDate ? new Date(value.startDate) : null,
        value?.endDate ? new Date(value.endDate) : null,
      ]}
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
        altFormat: "Y-m-d",
        altInputClass: "theme-field",
      }}
      placeholder={placeholder || t("filters.dateRangePlaceholder")}
      data-size={dataSize}
      className={className}
    />
  );
}
