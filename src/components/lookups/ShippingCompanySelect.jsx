"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Controller } from "react-hook-form";

 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/utils/api";
 
export const FALLBACK_SHIPPING_COMPANIES = [
  { id: "aramex", name: "أرامكس" },
  { id: "smsa", name: "سمسا" },
  { id: "naqel", name: "ناقل" },
  { id: "dhl", name: "DHL" },
  { id: "fedex", name: "FedEx" },
];

 
const normalizeCompanies = (payload) => {
  const arr =
    payload?.items ||
    payload?.data ||
    payload?.shippingCompanies ||
    payload ||
    [];

  if (!Array.isArray(arr)) return [];

  return arr
    .map((x) => {
      const id = x.id ?? x._id ?? x.value ?? x.code ?? x.slug ?? x.name;
      const name =
        x.name ?? x.label ?? x.title ?? x.companyName ?? String(id || "");
      if (!id || !name) return null;
      return { id: String(id), name: String(name) };
    })
    .filter(Boolean);
};
 
export function ShippingCompanySelect({
  value,
  onChange,

  label = "شركة الشحن",
  required,
  disabled,
  error,

  placeholder = "اختر شركة الشحن",

  endpoint = "lookups/shipping",
  fallbackCompanies = FALLBACK_SHIPPING_COMPANIES,
}) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);

  // Decide final options
  const options = useMemo(() => {
    if (companies.length > 0) return companies;
    return fallbackCompanies;
  }, [companies, fallbackCompanies]);

  useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      setLoading(true);
      try {
        const res = await api.get(endpoint); // 👈 axios instance used here
        const normalized = normalizeCompanies(res?.data);

        if (mounted) {
          setCompanies(normalized);
        }
      } catch (err) {
        // Fail silently → fallback
        if (mounted) setCompanies([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCompanies();
    return () => {
      mounted = false;
    };
  }, [endpoint]);

  return (
    <div className="space-y-2" dir={isRTL ? "rtl" : "ltr"}>
      {label && (
        <span className="block text-sm text-gray-600 dark:text-slate-300">
          {label} {required ? "*" : ""}
        </span>
      )}

      <Select
        value={value || ""}
        onValueChange={(v) => onChange?.(v)}
        disabled={disabled || loading}
      >
        <SelectTrigger
          className={[
            "w-full rounded-lg !h-[45px] bg-[#fafafa] dark:bg-slate-800/50",
            error ? "border-red-500 focus-visible:ring-red-500" : "",
          ].join(" ")}
        >
          <SelectValue
            placeholder={loading ? "جاري التحميل..." : placeholder}
          />
        </SelectTrigger>

        <SelectContent className="bg-card-select">
          {options.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/** =====================================
 * RHF Wrapper (recommended)
 * ===================================== */
export function RHFShippingCompanyField({
  control,
  name = "shippingCompany",

  label = "شركة الشحن",
  required,
  disabled,

  endpoint = "lookups/shipping",
  fallbackCompanies = FALLBACK_SHIPPING_COMPANIES,
  placeholder = "اختر شركة الشحن",
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <ShippingCompanySelect
          value={field.value}
          onChange={field.onChange}
          label={label}
          required={required}
          disabled={disabled}
          error={fieldState.error?.message}
          endpoint={endpoint}
          fallbackCompanies={fallbackCompanies}
          placeholder={placeholder}
        />
      )}
    />
  );
}
