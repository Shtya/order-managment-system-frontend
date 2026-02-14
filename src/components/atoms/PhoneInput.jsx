"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Controller, useFormState } from "react-hook-form";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

/** =========================================
 *  Countries (ONE pattern) + clear placeholders
 * ========================================= */
export const PHONE_COUNTRIES = [
	{
		iso2: "QA",
		name: "قطر",
		dialCode: "+974",
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholderShort: "مثال: 44123456",
		hint: "اكتب 8 أرقام فقط",
	},
	{
		iso2: "BH",
		name: "البحرين",
		dialCode: "+973",
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholderShort: "مثال: 33123456",
		hint: "اكتب 8 أرقام فقط",
	},
	{
		iso2: "JO",
		name: "الأردن",
		dialCode: "+962",
		phone: { min: 9, max: 9, regex: /^7\d{8}$/ },
		placeholderShort: "مثال: 791234567",
		hint: "يجب أن يبدأ بـ 7 ويتكون من 9 أرقام",
		startsWith: ["7"],
	},
	{
		iso2: "EG",
		name: "مصر",
		dialCode: "+20",
		phone: { min: 10, max: 10, regex: /^1[0125]\d{8}$/ },
		placeholderShort: "مثال: 1012345678",
		hint: "يبدأ بـ 10/11/12/15 ويتكون من 10 أرقام",
		startsWith: ["10", "11", "12", "15"],
	},
	{
		iso2: "SA",
		name: "السعودية",
		dialCode: "+966",
		phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
		placeholderShort: "مثال: 501234567",
		hint: "يجب أن يبدأ بـ 5 ويتكون من 9 أرقام",
		startsWith: ["5"],
	},
	{
		iso2: "AE",
		name: "الإمارات",
		dialCode: "+971",
		phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
		placeholderShort: "مثال: 501234567",
		hint: "يجب أن يبدأ بـ 5 ويتكون من 9 أرقام",
		startsWith: ["5"],
	},
	{
		iso2: "KW",
		name: "الكويت",
		dialCode: "+965",
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholderShort: "مثال: 51234567",
		hint: "اكتب 8 أرقام فقط",
	},
];

/** =========================
 * Helpers
 * ========================= */
const digitsOnly = (s) => (s || "").replace(/\D/g, "");

const flagEmoji = (iso2) => {
	if (!iso2) return "🏳️";
	const codePoints = iso2
		.toUpperCase()
		.split("")
		.map((c) => 127397 + c.charCodeAt(0));
	return String.fromCodePoint(...codePoints);
};

const guessStartsWithFromRegex = (regex) => {
	const src = regex?.source || "";
	const m = src.match(/^\^(\d+)/);
	if (m?.[1]) return [m[1]];
	return [];
};

/**
 * validate result:
 * - ok true/false
 * - reason: empty|min|max|prefix|format
 */
export const validateByPattern = (countries, iso2, value) => {
	const country = countries.find((c) => c.iso2 === iso2);
	const digits = digitsOnly(value);

	if (!country?.phone) return { ok: true, digits, country, reason: null };

	const { min, max, regex } = country.phone;

	if (!digits.length) return { ok: false, digits, country, reason: "empty" };
	if (digits.length < min) return { ok: false, digits, country, reason: "min" };
	if (digits.length > max) return { ok: false, digits, country, reason: "max" };

	if (regex && !regex.test(digits)) {
		const starts =
			country.startsWith?.length ? country.startsWith : guessStartsWithFromRegex(regex);

		if (starts.length) {
			const okPrefix = starts.some((p) => digits.startsWith(p));
			if (!okPrefix) {
				return {
					ok: false,
					digits,
					country,
					reason: "prefix",
					expectedStartsWith: starts,
				};
			}
		}

		return { ok: false, digits, country, reason: "format" };
	}

	return { ok: true, digits, country, reason: null };
};

/**
 * ✅ The key change:
 * - When invalid, return the "hint" as the error message (so user knows what to type)
 * - Also keep specific messages for min/max/prefix
 */
const buildArabicMessage = (res, { requiredMessage = "رقم الهاتف مطلوب" } = {}) => {
	const c = res.country;
	if (!c) return "رقم الهاتف غير صحيح";

	if (res.reason === "empty") return requiredMessage;

	const min = c?.phone?.min;
	const max = c?.phone?.max;
	const hint = c?.hint || "";

	if (res.reason === "min") {
		return `الرقم قصير — المطلوب ${min} رقم. ${hint}`.trim();
	}
	if (res.reason === "max") {
		return `الرقم طويل — الحد الأقصى ${max} رقم. ${hint}`.trim();
	}
	if (res.reason === "prefix") {
		const starts = (res.expectedStartsWith || []).join(" أو ");
		return `بداية الرقم غير صحيحة — يجب أن يبدأ بـ ${starts}. ${hint}`.trim();
	}
	return hint ? hint : "صيغة الرقم غير صحيحة";
};

/** =========================
 * PhoneInput (pure)
 * - show hint as error when invalid via "helperText" prop
 * ========================= */
export function PhoneInput({
	value = "",
	onChange,
	countryIso2,
	defaultCountryIso2,
	onCountryChange,

	label,
	required,
	disabled,
	error,
	name,
	id,

	countries = PHONE_COUNTRIES,

	onBlurValidate,
	onStatusChange,

	helperText,
}) {
	const locale = useLocale();
	const isRTL = locale === "ar";

	const initialCountry = useMemo(() => {
		const byIso = (iso) => countries.find((c) => c.iso2 === iso);
		return byIso(countryIso2) || byIso(defaultCountryIso2) || countries[0] || null;
	}, [countries, countryIso2, defaultCountryIso2]);

	const [internalIso2, setInternalIso2] = useState(initialCountry?.iso2);

	useEffect(() => {
		if (countryIso2) setInternalIso2(countryIso2);
	}, [countryIso2]);

	const selectedCountry = useMemo(() => {
		return countries.find((c) => c.iso2 === internalIso2) || countries[0] || null;
	}, [countries, internalIso2]);

	const iso2 = selectedCountry?.iso2 || "";
	const dialCode = selectedCountry?.dialCode || "";
	const placeholder = selectedCountry?.placeholderShort || "مثال: 5xxxxxxxx";

	useEffect(() => {
		if (!selectedCountry) return;

		const national = digitsOnly(value);
		const full = `${dialCode}${national}`;

		const parsed = parsePhoneNumberFromString(full, iso2);
		const e164 = parsed?.number || "";

		const res = validateByPattern(countries, iso2, national);

		onStatusChange?.({
			isValid: res.ok,
			reason: res.reason,
			expectedStartsWith: res.expectedStartsWith,
			countryIso2: iso2,
			dialCode,
			national,
			full,
			e164,
		});
	}, [value, iso2, dialCode, selectedCountry, onStatusChange, countries]);

	const handleCountry = (nextIso2) => {
		if (!countryIso2) setInternalIso2(nextIso2);
		onCountryChange?.(nextIso2);
	};

	const handleNumber = (e) => {
		const next = digitsOnly(e.target.value);
		onChange?.(next);
	};

	return (
		<div className="space-y-2">
			{label && (
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-600 dark:text-slate-300">
						{label} {required ? "*" : ""}
					</span>
				</div>
			)}

			<div dir={isRTL ? "rtl" : "ltr"} className="flex items-stretch gap-2">
				<Select value={iso2} onValueChange={handleCountry} disabled={disabled}>
					<SelectTrigger className="w-[170px] rounded-lg !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
						<SelectValue placeholder={"الدولة"} />
					</SelectTrigger>

					<SelectContent className="bg-card-select">
						{countries.map((c) => (
							<SelectItem key={c.iso2} value={c.iso2}>
								<span className="flex items-center gap-2">
									<span>{flagEmoji(c.iso2)}</span>
									<span className="truncate max-w-[95px]">{c.name}</span>
									<span className="text-gray-500">{c.dialCode}</span>
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="relative flex-1">
					<div dir="ltr" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
						{dialCode}
					</div>

					<Input
						id={id}
						name={name}
						disabled={disabled}
						value={value}
						onChange={handleNumber}
						onBlur={() => onBlurValidate?.()}
						placeholder={placeholder}
						inputMode="tel"
						dir="ltr"
						className={[
							"rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50",
							"pl-[60px]",
							error ? "border-red-500 focus-visible:ring-red-500" : "",
						].join(" ")}
					/>
				</div>
			</div>

			{/* ✅ show helperText ALWAYS when exists (especially to guide user while invalid) */}
			{helperText ? (
				<p className={error ? "text-xs text-red-500" : "text-[11px] text-gray-500"}>
					{helperText}
				</p>
			) : null}

			{/* if you still want to show normal error line too, keep this:
          but now helperText is your error guidance, so we skip duplicate */}
		</div>
	);
}

 
export function RHFPhoneField({
	control,
	name,
	countryName,
	countries = PHONE_COUNTRIES,

	setValue,
	setError,
	clearErrors,

	label,
	required,
	disabled,

	requiredMessage = "رقم الهاتف مطلوب",
}) {
	const { submitCount, errors } = useFormState({ control });
	const currentError = errors?.[name]?.message;

	return (
		<Controller
			name={countryName}
			control={control}
			defaultValue={countries?.[0]?.iso2}
			render={({ field: countryField }) => (
				<Controller
					name={name}
					control={control}
					defaultValue=""
					render={({ field: phoneField, fieldState }) => {
						const validateNow = () => {
							const iso2 = countryField.value;
							const val = phoneField.value;

							if (required && !digitsOnly(val)) {
								setError?.(name, { type: "manual", message: requiredMessage });
								return false;
							}

							const res = validateByPattern(countries, iso2, val);

							if (!res.ok) {
								const msg = buildArabicMessage(res, { requiredMessage });
								setError?.(name, { type: "manual", message: msg });
								return false;
							}

							clearErrors?.(name);
							return true;
						};

						useEffect(() => {
							if (submitCount > 0) validateNow();
						}, [submitCount]);

						const shownError = currentError || fieldState.error?.message || "";

						return (
							<PhoneInput
								countries={countries}
								label={label}
								required={required}
								disabled={disabled}
								name={phoneField.name}
								value={phoneField.value || ""}
								onChange={(v) => {
									phoneField.onChange(v);

									if (shownError) validateNow();
								}}
								countryIso2={countryField.value}
								onCountryChange={(iso) => {
									countryField.onChange(iso);

									setValue?.(countryName, iso, {
										shouldDirty: true,
										shouldTouch: true,
										shouldValidate: true,
									});

									validateNow();
								}}
								onBlurValidate={() => {
									phoneField.onBlur();
									validateNow();
								}}
								error={shownError}
								helperText={shownError}
							/>
						);
					}}
				/>
			)}
		/>
	);
}
