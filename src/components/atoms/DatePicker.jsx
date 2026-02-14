"use client";

import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { Arabic } from "flatpickr/dist/l10n/ar.js";

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";


const toYmd = (date) => {
	if (!date) return "";
	const d = date instanceof Date ? date : new Date(date);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};


const fromYmd = (ymd) => {
	if (!ymd) return null;
	const [y, m, d] = ymd.split("-").map(Number);
	if (!y || !m || !d) return null;
	return new Date(y, m - 1, d);
};

export function DatePicker({
	value,
	onChange,

	labelKey = "date.label",
	placeholderKey = "date.placeholder",
 	required = false,
	disabled = false,
	error = "",

	// behavior
	minDate, // Date | "today" | "YYYY-MM-DD"
	maxDate, // Date | "YYYY-MM-DD"
	output = "ymd", // "ymd" | "date"
	enableTime = false,
	dateFormat = "Y-m-d", // flatpickr display format
}) {
	const locale = useLocale();
	const isRTL = locale === "ar";
	const t = useTranslations("orderDatePicker");

	const fpLocale = useMemo(() => {
		return locale === "ar" ? Arabic : undefined; // default = English
	}, [locale]);

	const fpMinDate = useMemo(() => {
		if (!minDate) return undefined;
		if (minDate === "today") return new Date();
		if (typeof minDate === "string") return fromYmd(minDate) || undefined;
		return minDate;
	}, [minDate]);

	const fpMaxDate = useMemo(() => {
		if (!maxDate) return undefined;
		if (typeof maxDate === "string") return fromYmd(maxDate) || undefined;
		return maxDate;
	}, [maxDate]);

	// flatpickr wants Date[]
	const fpValue = useMemo(() => {
		if (!value) return [];
		if (value instanceof Date) return [value];
		// string YYYY-MM-DD
		const d = fromYmd(value);
		return d ? [d] : [];
	}, [value]);

	const label = t(labelKey);
	const placeholder = t(placeholderKey);
 
	return (
		<div className="space-y-2" dir={isRTL ? "rtl" : "ltr"}>
			{label ? (
				<span className="block text-sm text-gray-600 dark:text-slate-300">
					{label} {required ? "*" : ""}
				</span>
			) : null}

			<Flatpickr
				value={fpValue}
				options={{
					locale: fpLocale,
					dateFormat,
					enableTime,
					time_24hr: true,
					minDate: fpMinDate,
					maxDate: fpMaxDate,
					disableMobile: true,
				}}
				onChange={(dates) => {
					const d = dates?.[0] || null;
					if (output === "date") {
						onChange?.(d);
					} else {
						onChange?.(d ? toYmd(d) : "");
					}
				}}
				render={({ defaultValue, value, ...props }, ref) => (
					<Input
						{...props}
						ref={ref}
						value={props.value || ""}
						placeholder={placeholder}
						disabled={disabled}
						className={[
							"rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50",
							error ? "border-red-500 focus-visible:ring-red-500" : "",
						].join(" ")}
					/>
				)}
			/>

 			{error ? (
				<p className="text-xs text-red-500">{error}</p>
			)  : null}
		</div>
	);
}


export function RHFDatePicker({
	control,
	name = "orderDate",

	labelKey = "date.label",
	placeholderKey = "date.placeholder",
	helperKey = "date.helper",

	required = false,
	disabled = false,

	minDate,
	maxDate,
	output = "ymd",
	enableTime = false,
	dateFormat = "Y-m-d",
}) {
	return (
		<Controller
			name={name}
			control={control}
			rules={
				required
					? {
						required: "orderDatePicker:date.required", // key-style message (we convert below)
					}
					: undefined
			}
			render={({ field, fieldState }) => (
				<RHFErrorLocalizer
					fieldState={fieldState}
					renderError={(localizedError) => (
						<DatePicker
							value={field.value}
							onChange={field.onChange}
							labelKey={labelKey}
							placeholderKey={placeholderKey}
							helperKey={helperKey}
							required={required}
							disabled={disabled}
							error={localizedError}
							minDate={minDate}
							maxDate={maxDate}
							output={output}
							enableTime={enableTime}
							dateFormat={dateFormat}
						/>
					)}
				/>
			)}
		/>
	);
}


function RHFErrorLocalizer({ fieldState, renderError }) {
	const t = useTranslations("orderDatePicker");

	const msg = fieldState?.error?.message || "";
	let localized = msg;

	if (msg.startsWith("orderDatePicker:")) {
		const key = msg.split("orderDatePicker:")[1];
		localized = t(key);
	}

	return renderError(localized);
}
