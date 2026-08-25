"use client";

import React, { useEffect, useMemo, useRef } from "react";
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
  /** Increment to programmatically open the calendar */
  openSignal = 0,
}) {
  const t = useTranslations("accounts");
  const fpRef = useRef(null);

  const dateValue = useMemo(() => {
    if (mode === "single") {
      return value ? new Date(value) : null;
    }
    const start = value?.startDate ? new Date(value.startDate) : null;
    const end = value?.endDate ? new Date(value.endDate) : null;
    // Stored endDate is local midnight of the day AFTER the picked end day
    // (except same-day picks, where it equals startDate), so restore the display day.
    if (start && end && end.getTime() !== start.getTime()) {
      end.setDate(end.getDate() - 1);
    }
    return [start, end].filter(Boolean); // Filter out nulls if empty
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

  const prevOpenSignalRef = useRef(openSignal);

  useEffect(() => {
    // Only open when openSignal *changes* (explicit request), not on remount with a stale value
    if (openSignal === prevOpenSignalRef.current) return;
    prevOpenSignalRef.current = openSignal;
    if (!openSignal) return;

    const timer = setTimeout(() => {
      const instance = fpRef.current?.flatpickr;
      if (!instance) return;
      instance.altInput?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
      instance.open();
      instance.altInput?.focus?.();
    }, 50);
    return () => clearTimeout(timer);
  }, [openSignal]);

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
      ref={fpRef}
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
