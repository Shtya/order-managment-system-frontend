"use client";

import React, { useMemo } from "react";
import { Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/utils/cn";
import { COUNTRIES } from "@/app/[locale]/settings/page";
import { useTranslations } from "next-intl";

/** =========================
 * Helpers (same logic)
 * ========================= */
export function digitsOnly(v) {
	return (v || "").replace(/\D/g, "");
}

export function validatePhone(rawDigits, country) {
	const value = digitsOnly(rawDigits);
	if (!value) return "يرجى إدخال رقم جوال صحيح";

	if (value.length < country.phone.min || value.length > country.phone.max) {
		if (country.phone.min === country.phone.max) return `رقم الجوال يجب أن يكون ${country.phone.min} رقمًا`;
		return `رقم الجوال يجب أن يكون بين ${country.phone.min} و ${country.phone.max} رقمًا`;
	}

	if (value.length === country.phone.max && country.phone.regex && !country.phone.regex.test(value)) {
		return "يرجى إدخال رقم جوال صحيح حسب الدولة المختارة";
	}

	return "";
}

export default function InputPhone({
	label,
	icon: Icon,
	t,

	control,

	nameCountry = "phoneCountry",
	nameNumber = "phoneNumber",
	valueCountry,
	valueNumber,
	onCountryChange,
	onNumberChange,
	countryWidthClass = "w-[200px]",
	inputClassName,
	triggerClassName,
	error, // external error (optional)
	showError = true,

	placeholderOverride,
	dir = "rtl",
}) {


	const translation  = useTranslations("inputPhone")
	const countries = COUNTRIES 
	const controlledCountry = valueCountry ?? (countries?.[0]?.key || "EG");
	const controlledNumber = valueNumber ?? "";

	// Placeholder logic
	const getPlaceholder = (countryKey) => {
		const c = countries.find((x) => x.key === countryKey) || countries[0];
		return placeholderOverride || c?.placeholder || "";
	};

	// Renderers
	const CountrySelectRHF = ({ field }) => (
		<Select value={field.value} onValueChange={field.onChange}>
			<SelectTrigger
				className={cn(
					"!w-full !h-[45px] rounded-xl bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-bold text-[rgb(var(--primary))]",
					triggerClassName
				)}
			>
				<SelectValue placeholder={(translation("placeholders.selectCountry"))} />
			</SelectTrigger>

			<SelectContent className="max-h-72">
				{countries.map((c) => (
					<SelectItem key={c.key} value={c.key}>
						{c.dialCode} — {c.nameAr}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	const NumberInputRHF = ({ field, fieldState, countryKey }) => {
		const placeholder = getPlaceholder(countryKey);
		const hasErr = Boolean(fieldState?.error?.message);

		return (
			<div className="flex-1">
				<Input
					{...field}
					placeholder={placeholder}
					inputMode="numeric"
					className={cn(
						"rounded-xl !font-[Inter] h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-en",
						hasErr ? "border-red-300 focus-visible:ring-red-300" : "",
						inputClassName
					)}
					onChange={(e) => field.onChange(digitsOnly(e.target.value))}
				/>
			</div>
		);
	};

	return (
		<div className="space-y-2" dir={dir}>
			{label && (
				<Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
					{Icon ? <Icon size={16} className="text-gray-400" /> : null}
					{label}
				</Label>
			)}
 
			{control ? (
				<div className="flex gap-2">
					<div className={countryWidthClass}>
						<Controller name={nameCountry} control={control} render={({ field }) => <CountrySelectRHF field={field} />} />
					</div>

					<Controller
						name={nameNumber}
						control={control}
						render={({ field, fieldState }) => (
							<Controller
								name={nameCountry}
								control={control}
								render={({ field: cField }) => (
									<NumberInputRHF field={field} fieldState={fieldState} countryKey={cField.value} />
								)}
							/>
						)}
					/>
				</div>
			) : (
 				<div className="flex gap-2">
					<div className={countryWidthClass}>
						<Select value={controlledCountry} onValueChange={onCountryChange}>
							<SelectTrigger
								className={cn(
									"!w-full !h-[45px] rounded-xl bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-bold text-[rgb(var(--primary))]",
									triggerClassName
								)}
							>
								<SelectValue placeholder={(t && t("placeholders.selectCountry")) || "اختر الدولة"} />
							</SelectTrigger>

							<SelectContent className="max-h-72">
								{countries.map((c) => (
									<SelectItem key={c.key} value={c.key}>
										{c.dialCode} — {c.nameAr}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<Input
						placeholder={getPlaceholder(controlledCountry)}
						value={controlledNumber}
						onChange={(e) => onNumberChange?.(digitsOnly(e.target.value))}
						className={cn(
							"flex-1 !font-[Inter] rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 font-en",
							error ? "border-red-300 focus-visible:ring-red-300" : "",
							inputClassName
						)}
						inputMode="numeric"
					/>
				</div>
			)}

			{/* Error */}
			{showError &&
				(error ? (
					<div className="text-xs text-red-600 text-right">{error}</div>
				) : control ? (
					// RHF errors handled at parent usually, لكن لو حابب تعرضها هنا اعملها من parent
					null
				) : null)}
		</div>
	);
}
