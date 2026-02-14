"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";

const pickCityName = (item) => {
	const a = item?.address || {};
	return (
		a.city ||
		a.town ||
		a.village ||
		a.municipality ||
		a.county ||
		item?.name ||
		(item?.display_name ? item.display_name.split(",")[0] : "")
	);
};

const isCityLike = (item) => {
	const a = item?.address || {};
	const addresstype = item?.addresstype;
	const type = item?.type;

	if (["city", "town", "village", "municipality", "county"].includes(addresstype))
		return true;

	if (a.city || a.town || a.village || a.municipality) return true;

	if (["city", "town", "village"].includes(type)) return true;

	return false;
};

export default function CityInput({
	value = "",
	onChange,
	label = "المدينة",
	required,
	error,
	disabled,
}) {
	const locale = useLocale();
	const isRTL = locale === "ar";

	const [query, setQuery] = useState(value);
	const [items, setItems] = useState([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const abortRef = useRef(null);
	const timerRef = useRef(null);

	// optional: force refetch even if query didn't change (e.g. click again)
	const [refreshKey, setRefreshKey] = useState(0);

	useEffect(() => {
		setQuery(value || "");
	}, [value]);

	useEffect(() => {
		if (!query || query.trim().length < 2) {
			setItems([]);
			setOpen(false);
			return;
		}

		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(async () => {
			if (abortRef.current) abortRef.current.abort();
			abortRef.current = new AbortController();

			setLoading(true);

			try {
				const url = new URL("https://nominatim.openstreetmap.org/search");
				url.searchParams.set("format", "jsonv2");
				url.searchParams.set("q", query.trim());
				url.searchParams.set("addressdetails", "1");
				url.searchParams.set("limit", "10");
				url.searchParams.set("accept-language", isRTL ? "ar" : "en");
				url.searchParams.set("featuretype", "city");

				const res = await fetch(url.toString(), {
					signal: abortRef.current.signal,
					headers: { Accept: "application/json" },
				});

				const data = await res.json();

				const normalized = Array.isArray(data)
					? data
						.filter(isCityLike)
						.map((d) => ({ ...d, _cityName: pickCityName(d) }))
						.filter((d) => d._cityName)
					: [];

				setItems(normalized);
				setOpen(normalized.length > 0);
			} catch (e) {
				if (e?.name !== "AbortError") console.error(e);
			} finally {
				setLoading(false);
			}
		}, 450);
	}, [query, refreshKey, isRTL]);

	const handleSelect = (item) => {
		const name = item._cityName || pickCityName(item);
		setQuery(name);
		setOpen(false);
		// IMPORTANT: don't clear items, so we can show again on focus
		onChange?.(name);
	};

	const handleFocus = () => {
		// If we already have results for this query, show them again
		if (query?.trim().length >= 2 && items.length > 0) {
			setOpen(true);
		} else if (query?.trim().length >= 2) {
			// Force refetch even if query didn't change
			setRefreshKey((k) => k + 1);
		}
	};

	return (
		<div className="space-y-2 relative">
			{label ? (
				<span className="text-sm text-gray-600 dark:text-slate-300">
					{label} {required ? "*" : ""}
				</span>
			) : null}

			<Input
				value={query}
				disabled={disabled}
				dir={isRTL ? "rtl" : "ltr"}
				placeholder="ابدأ بكتابة اسم المدينة واختر من القائمة"
				onFocus={handleFocus}
				onChange={(e) => {
					setQuery(e.target.value);
					onChange?.(""); // do not accept free text until selection
				}}
				onBlur={() => {
					setTimeout(() => setOpen(false), 150);
				}}
				className={[
					"h-[45px] rounded-lg bg-[#fafafa] dark:bg-slate-800/50",
					error ? "border-red-500 focus-visible:ring-red-500" : "",
				].join(" ")}
			/>

			{open && items.length > 0 && (
				<ul
					className="absolute z-50 mt-1 w-full rounded-lg border bg-white dark:bg-slate-900 shadow"
					dir={isRTL ? "rtl" : "ltr"}
				>
					{items.map((item) => (
						<li
							key={item.place_id}
							onMouseDown={() => handleSelect(item)}
							className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 text-sm"
						>
							{item._cityName}
							<span className="text-xs text-gray-500 block">
								{item.address?.state ||
									item.address?.province ||
									item.address?.country ||
									""}
							</span>
						</li>
					))}
				</ul>
			)}

			{loading ? <p className="text-[11px] text-gray-500">جاري البحث…</p> : null}
			{error ? <p className="text-xs text-red-500">{error}</p> : null}
		</div>
	);
}
