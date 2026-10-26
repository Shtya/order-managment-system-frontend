'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Controller, useWatch } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/FloatingSelect';
import api from '@/utils/api';
import { normalizeAxiosError } from '@/utils/axios';
import { GEO_CONFIG } from '@/utils/order-utils';

// Reusable Select with loading state
// ─────────────────────────────────────────────────────────────────────────────
function GeoSelect({ label, required, value, onValueChange, items = [], isLoading, placeholder, disabled, hint, nameKey = "nameEn" }) {

	const t = useTranslations("createOrder");
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const inputRef = useRef(null);

	useEffect(() => {
		if (!open) {
			setSearchTerm("");
			return;
		}
		const timer = setTimeout(() => {
			const input = inputRef.current;
			if (!input) return;
			const position = input.selectionStart ?? input.value.length;
			input.focus();
			input.setSelectionRange(position, position);
		}, 0);
		return () => clearTimeout(timer);
	}, [open, searchTerm]);

	const itemLabel = (item) => String(item[nameKey] || item.nameEn || item.nameAr || item.id || "");

	const filteredItems = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return items;
		return items.filter((item) => itemLabel(item).toLowerCase().includes(query));
	}, [items, searchTerm, nameKey]);

	const selectedItem = items.find((item) => String(item.id) === String(value));
	const selectedIsVisible = filteredItems.some((item) => String(item.id) === String(value));

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Label className="text-sm text-gray-600 dark:text-slate-300">
					{label}{required && "*"}
				</Label>
			</div>
			<Select
				key={`${items.length}-${value}`}
				value={value || ""}
				onValueChange={onValueChange}
				disabled={disabled || isLoading}
				open={open}
				onOpenChange={setOpen}
			>
				<SelectTrigger >
					{isLoading ? (
						<span className="flex items-center gap-2 text-muted-foreground text-sm">
							<Loader2 size={14} className="animate-spin" />
							{t("bosta.loading")}
						</span>
					) : (
						<SelectValue placeholder={placeholder} />
					)}
				</SelectTrigger>
				<SelectContent
					onOpenAutoFocus={(e) => {
						e.preventDefault();
						inputRef.current?.focus();
					}}
				>
					<div
						className="px-2 py-2 sticky top-0 bg-white z-10 border-b border-border"
						onPointerDown={(e) => e.stopPropagation()}
					>
						<input
							type="text"
							ref={inputRef}
							placeholder={t("bosta.search")}
							className="w-full rounded-md border border-input bg-transparent px-3 py-1 rtl:text-end text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => e.stopPropagation()}
						/>
					</div>
					{selectedItem && !selectedIsVisible && (
						<SelectItem value={String(selectedItem.id)} className="hidden">
							{itemLabel(selectedItem)}
						</SelectItem>
					)}
					{filteredItems.map((item) => (
						<SelectItem key={item.id} value={String(item.id)}>
							{itemLabel(item)}
						</SelectItem>
					))}
					{!isLoading && filteredItems.length === 0 && (
						<div className="py-4 text-center text-sm text-muted-foreground">{t("bosta.noResults")}</div>
					)}
				</SelectContent>
			</Select>
			{hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Address section — Bosta mode (selects) vs Normal mode (text inputs)
// ─────────────────────────────────────────────────────────────────────────────


export function AddressSection({
	shippingProvider,
	// react-hook-form
	control,
	errors,
	setValue,
	providerMeta,
	setProviderMeta,
	providerErrors,
}) {
	const locale = useLocale();
	const t = useTranslations("createOrder");
	const nameKey = locale === "ar" ? "nameAr" : "nameEn";
	const [providerLoading, setproviderLoading] = useState({
		cities: false,
		zones: false,
		districts: false,
		locations: false,
	});

	const [cities, setCities] = useState([]);
	const [citiesLoading, setCitiesLoading] = useState(false);
	const [providerCities, setProviderCities] = useState([]);
	const [providerZones, setproviderZones] = useState([]);
	const [providerDistricts, setproviderDistricts] = useState([]);

	const currentConfig = GEO_CONFIG[shippingProvider] || GEO_CONFIG.default;

	// Derived: districts filtered by selected zone (parentId === zoneId)
	const filteredDistricts = useMemo(() => {
		if (!currentConfig.showDistrict) return [];
		return providerDistricts.filter((d) => d.parentId === providerMeta.zoneId);
	}, [currentConfig.showDistrict, providerDistricts, providerMeta.zoneId]);

	// Watch cityId, city, and area from RHF for the Select values
	const cityIdValue = useWatch({ control, name: "cityId" });
	const cityValue = useWatch({ control, name: "city" });
	const areaValue = useWatch({ control, name: "area" });
	const areaIdValue = useWatch({ control, name: "areaId" });


	const [areas, setAreas] = useState([]);
	const [areasCache, setAreasCache] = useState({});
	const [areasLoading, setAreasLoading] = useState(false);


	// Find current city ID: first use cityIdValue, then match by name
	const currentCityId = useMemo(() => {

		if (cityIdValue) return cityIdValue;
		if (!cityValue || !providerCities.length) return "";

		const normalized = cityValue.trim().toLowerCase();

		const found = providerCities.find((c) => {
			// Match the main city names
			if (
				c.nameAr?.trim().toLowerCase() === normalized ||
				c.nameEn?.trim().toLowerCase() === normalized
			) {
				return true;
			}

			// Match any provider city names
			return c.providerLocations?.some((p) =>
				p.providerCityNameAr?.trim().toLowerCase() === normalized ||
				p.providerCityNameEn?.trim().toLowerCase() === normalized
			);
		});

		return found?.id ?? "";
	}, [cityIdValue, cityValue, providerCities, nameKey]);


	// Map unified cities to provider-specific data
	useEffect(() => {
		// Map unified cities to include provider-specific IDs and availability

		const filteredCities = shippingProvider ? cities.filter(city => city.providerLocations?.length > 0 && city.providerLocations?.some(pl => pl.provider === shippingProvider)) : cities;
		const mappedCities = filteredCities.map(city => {
			const matched = shippingProvider ? city.providerLocations?.find(pl => pl.provider === shippingProvider) : null;

			return {
				id: city.id,
				// Use providerCityId as the selector key so zones/districts fetch works
				providerCityId: matched?.providerCityId,
				nameEn: city.nameEn,
				nameAr: city.nameAr,
				dropOff: shippingProvider ? (matched?.dropOff ?? false) : true,
				pickup: shippingProvider ? (matched?.pickup ?? false) : true,
				providerLocations: city.providerLocations,
			};
		});

		setProviderCities(mappedCities);
		if (!currentConfig.needsGeo) {
			setproviderZones([]);
			setproviderDistricts([]);
		}
	}, [currentConfig.needsGeo, shippingProvider, cities, currentCityId]);

	useEffect(() => {
		if (!providerCities || !providerCities?.length) return;

		const newProviderId = providerCities.find(city => city.id === currentCityId)?.providerCityId || "";
		if (!newProviderId) return;
		setProviderMeta((prev) => {
			if (newProviderId === prev.cityId) return prev;
			return {
				...prev,
				cityId: newProviderId,
				zoneId: "",
				districtId: "",
			}
		});

	}, [providerCities]);

	useEffect(() => {
		const fetchGeography = async () => {

			if (!currentConfig.needsGeo || !providerMeta.cityId) {
				setproviderZones([]);
				setproviderDistricts([]);
				return;
			}

			setproviderLoading((p) => ({ ...p, zones: true, districts: true }));

			try {
				const requests = [
					api.get(`/shipping/zones/${shippingProvider}/${providerMeta.cityId}`)
				];

				// Only fetch districts if the config says so (e.g., true for Bosta, false for Turbo)
				if (currentConfig.showDistrict) {
					requests.push(api.get(`/shipping/districts/${shippingProvider}/${providerMeta.cityId}`));
				}
				const [zonesRes, districtsRes] = await Promise.all(requests);

				setproviderZones(zonesRes.data?.records ?? []);
				setproviderDistricts(districtsRes.data?.records ?? []);
			} catch (e) {
				console.error(`Bosta Geo Error: ${normalizeAxiosError(e)}`);
			} finally {
				setproviderLoading((p) => ({ ...p, zones: false, districts: false }));
			}
		};

		fetchGeography();
	}, [currentConfig.needsGeo, currentConfig.showDistrict, providerMeta.cityId, shippingProvider]);



	useEffect(() => {
		const getcities = async () => {
			setCitiesLoading(true);
			try {
				const res = await api.get("/cities", { params: { limit: 500 } });
				const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.records) ? res.data.records : [];
				setCities(list);
			} catch (e) {
				console.error(`Cities lookup: ${normalizeAxiosError(e)}`);
			} finally {
				setCitiesLoading(false);
			}
		};
		getcities();
	}, []);


	useEffect(() => {
		const fetchAreas = async () => {
			if (!currentCityId || currentConfig.needsGeo) {
				setAreas([]);
				return;
			}

			if (areasCache[currentCityId]) {
				setAreas(areasCache[currentCityId]);
				return;
			}

			setAreasLoading(true);
			try {
				const res = await api.get(`/cities/${currentCityId}/areas`);
				const areas = Array.isArray(res.data) ? res.data : [];
				setAreasCache(prev => ({ ...prev, [currentCityId]: areas }));
				setAreas(areas);
			} catch (e) {
				console.error(`Areas lookup: ${normalizeAxiosError(e)}`);
				setAreas([]);
			} finally {
				setAreasLoading(false);
			}
		};

		fetchAreas();
	}, [currentCityId, currentConfig.needsGeo]);

	// Find current area ID based on the area name
	const currentAreaId = useMemo(() => {

		if (areaIdValue) return areaIdValue;
		if (!areaValue || !areas.length) return "";
		const found = areas.find((a) => a.nameAr === areaValue || a.nameEn === areaValue);


		return found ? found.id : "";
	}, [areaIdValue, areaValue, areas]);

	// When user picks a city/zone/district — auto-fill the hidden RHF fields
	const handleCityChange = useCallback(
		(selectedId, resetArea = true) => {
			if (!selectedId) return;

			// Find city by its unified UUID
			const city = providerCities.find((c) => String(c.id) === String(selectedId));

			if (!city && (providerLoading.cities || citiesLoading)) return;

			setProviderMeta((prev) => ({ ...prev, cityId: city?.providerCityId || "", zoneId: "", districtId: "" }));

			if (city) {
				setValue("city", city[nameKey] || city.nameEn, { shouldValidate: true });
				setValue("cityId", city.id, { shouldValidate: true });
			}
			if (resetArea) {
				setValue("area", "", { shouldValidate: false });
				setValue("areaId", "", { shouldValidate: false });
			}
		},
		[providerCities, nameKey, setValue, providerLoading.cities, citiesLoading]
	);

	const handleZoneChange = useCallback(
		(zoneId) => {
			if (!zoneId) return; // Prevent auto-resets
			// Prevent resetting children if the value hasn't changed
			if (String(zoneId) === String(providerMeta.zoneId)) return;

			const zone = providerZones.find((z) => String(z.id) === zoneId);
			// If zones list is not yet loaded, don't trigger resets
			if (!zone && providerLoading.zones) return;

			setProviderMeta((prev) => ({ ...prev, zoneId: zoneId, districtId: "" }));

			// rebuild area: zone name (district will be appended later)
			if (zone) setValue("area", zone[nameKey] || zone.nameEn, { shouldValidate: false });
		},
		[providerZones, nameKey, setValue, providerMeta.zoneId, providerLoading.zones]
	);

	const handleDistrictChange = useCallback(
		(districtId) => {
			if (!districtId) return; // Prevent auto-resets
			// Prevent resetting if the value hasn't changed
			if (String(districtId) === String(providerMeta.districtId)) return;

			const zone = providerZones.find((z) => String(z.id) === providerMeta.zoneId);
			const district = filteredDistricts.find((d) => String(d.id) === districtId);

			// If districts list is not yet loaded, don't trigger resets
			if (!district && providerLoading.districts) return;

			setProviderMeta((prev) => ({ ...prev, districtId: districtId }));


			const zonePart = zone?.[nameKey] || zone?.nameEn;
			const distinctPart = district?.[nameKey] || district?.nameEn;
			if (distinctPart != zonePart) {
				const parts = [zonePart, distinctPart].filter(Boolean).join(", ");
				setValue("area", parts, { shouldValidate: false });
			} else {
				setValue("area", zonePart, { shouldValidate: false });
			}
		},
		[providerZones, filteredDistricts, providerMeta.zoneId, providerMeta.districtId, nameKey, setValue, providerLoading.districts]
	);

	const handleAreaChange = useCallback(
		(areaId) => {
			if (!areaId) {
				setValue("area", "", { shouldValidate: false });
				setValue("areaId", "", { shouldValidate: false });
				return;
			}
			const area = areas.find((a) => String(a.id) === areaId);
			if (area) {
				setValue("area", area[nameKey] || area.nameEn, { shouldValidate: false });
				setValue("areaId", area.id, { shouldValidate: false });
			}
		},
		[areas, nameKey, setValue]
	);

	// ── Bosta mode ──────────────────────────────────────────────────────────
	if (currentConfig.needsGeo) {
		const config = GEO_CONFIG[shippingProvider];

		return (
			<AnimatePresence mode="wait">
				<motion.div
					key="bosta"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.2 }}
					className="grid grid-cols-1 md:grid-cols-2 gap-4"
				>
					{/* City */}
					<div className="space-y-2">
						<GeoSelect
							label={t("bosta.city")}
							required={config.fields.includes("cityId")}
							nameKey={nameKey}
							value={currentCityId}
							onValueChange={handleCityChange}
							items={providerCities.filter((c) => c.dropOff)}
							isLoading={providerLoading.cities}
							placeholder={t("bosta.selectCity")}
						/>
						{providerErrors?.cityId && (
							<p className="text-xs text-red-500">{providerErrors.cityId}</p>
						)}
					</div>

					{/* Zone */}
					<div className="space-y-2">
						<GeoSelect
							label={t("bosta.zone")}
							required={config.fields.includes("zoneId")}
							nameKey={nameKey}
							value={providerMeta.zoneId}
							onValueChange={handleZoneChange}
							items={providerZones.filter((z) => z.dropOff)}
							isLoading={providerLoading.zones}
							placeholder={t("bosta.selectZone")}
							disabled={!providerMeta.cityId}
						/>
						{providerErrors?.zoneId && (
							<p className="text-xs text-red-500">{providerErrors.zoneId}</p>
						)}
					</div>

					{/* District — filtered by chosen zone */}
					{currentConfig.showDistrict && (
						<div className="space-y-2">
							<GeoSelect
								label={t("bosta.district")}
								required={config.fields.includes("districtId")}
								nameKey={nameKey}
								value={providerMeta.districtId}
								onValueChange={handleDistrictChange}
								items={filteredDistricts.filter((d) => d.dropOff)}
								isLoading={providerLoading.districts}
								placeholder={t("bosta.selectDistrict")}
								disabled={!providerMeta.zoneId}
							/>
							{providerErrors?.districtId && <p className="text-xs text-red-500">{providerErrors.districtId}</p>}
						</div>
					)}

					{/* Landmark */}
					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("fields.landmark")}
						</Label>
						<Controller
							name="landmark"
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									placeholder={t("placeholders.landmark")}

								/>
							)}
						/>
					</div>

					{/* Address — full width */}
					<div className="md:col-span-2 space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("fields.address")} *
						</Label>
						<Controller
							name="address"
							control={control}
							render={({ field }) => (
								<Textarea
									{...field}
									placeholder={t("placeholders.bostaAddress")}
									className="rounded-xl min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50"
								/>
							)}
						/>
						{errors.address && (
							<p className="text-xs text-red-500">{errors.address.message}</p>
						)}
					</div>

					{/* Hidden: city & area — auto-filled, not shown */}
					<input type="hidden" {...control.register?.("city")} />
					<input type="hidden" {...control.register?.("area")} />
					<input type="hidden" {...control.register?.("areaId")} />
				</motion.div>
			</AnimatePresence>
		);
	}

	// ── Normal mode ─────────────────────────────────────────────────────────
	return (
		<AnimatePresence mode="wait">
			<motion.div
				key="normal"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				transition={{ duration: 0.2 }}
				className="grid grid-cols-1 md:grid-cols-2 gap-4"
			>
				{/* City */}
				<div className="space-y-2">

					<GeoSelect
						label={t("fields.city")}
						required
						nameKey={nameKey}
						value={currentCityId}
						onValueChange={(cityId) => handleCityChange(cityId, true)}
						items={providerCities ?? []}
						isLoading={citiesLoading}
						placeholder={t("placeholders.city")}
					/>
					{errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
				</div>

				{/* Area */}
				<div className="space-y-2">
					<GeoSelect
						label={t("fields.area")}
						nameKey={nameKey}
						value={currentAreaId}
						onValueChange={handleAreaChange}
						items={areas}
						isLoading={areasLoading}
						placeholder={t("placeholders.area")}
						disabled={!currentCityId}
					/>
				</div>

				{/* Address — full width */}
				<div className="md:col-span-2">
					{/* <TutorialSpotlight description="test" title={t("fields.address")} example={t("placeholders.address")} card="default"> */}
					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("fields.address")} *
						</Label>
						<Controller
							name="address"
							control={control}
							render={({ field }) => (
								<Textarea
									{...field}
									placeholder={t("placeholders.address")}
									className="rounded-xl min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50"
								/>
							)}
						/>
						{errors.address && (
							<p className="text-xs text-red-500">{errors.address.message}</p>
						)}
					</div>
					{/* </TutorialSpotlight> */}
				</div>

				{/* Landmark — full width */}
				<div className="md:col-span-2 space-y-2">
					<Label className="text-sm text-gray-600 dark:text-slate-300">
						{t("fields.landmark")}
					</Label>
					<Controller
						name="landmark"
						control={control}
						render={({ field }) => (
							<Input {...field} placeholder={t("placeholders.landmark")} />
						)}
					/>
				</div>
				<input type="hidden" {...control.register?.("city")} />
				<input type="hidden" {...control.register?.("cityId")} />
				<input type="hidden" {...control.register?.("areaId")} />
			</motion.div>
		</AnimatePresence>
	);
}
