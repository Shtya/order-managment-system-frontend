// app/[locale]/orders/new/page.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trash2, Plus, Minus, Loader2, Info, Save, Package } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/FloatingSelect";
import Button_ from "@/components/atoms/Button";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

import { useLocale, useTranslations } from "next-intl";
import api from "@/utils/api";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";
import PageHeader from "@/components/atoms/Pageheader";
import { cn } from "@/utils/cn";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function normalizeAxiosError(err) {
	const msg =
		err?.response?.data?.message ??
		err?.response?.data?.error ??
		err?.message ??
		"Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation schema factory
// ─────────────────────────────────────────────────────────────────────────────
const createSchema = (t) =>
	yup.object({
		customerName: yup.string().required(t("validation.customerNameRequired")),
		phoneNumber: yup.string().required(t("validation.phoneNumberRequired")),
		secondPhoneNumber: yup.string(),
		email: yup.string().email(t("validation.invalidEmail")).optional(),
		// city & area are always present in the payload (auto-filled for Bosta)
		address: yup.string().required(t("validation.addressRequired")),
		city: yup.string().required(t("validation.cityRequired")),
		cityId: yup.string().optional(),
		area: yup.string().optional(),
		landmark: yup.string().optional(),
		paymentMethod: yup.string().required(t("validation.paymentMethodRequired")),
		paymentStatus: yup.string().optional(),
		shippingCompanyId: yup.string().optional(),
		storeId: yup.string().optional(),
		shippingCost: yup.number().min(0).optional(),
		discount: yup.number().min(0).optional(),
		deposit: yup.number().min(0).optional(),
		notes: yup.string().optional(),
		customerNotes: yup.string().optional(),
		items: yup
			.array()
			.of(
				yup.object({
					variantId: yup.string().required(),
					quantity: yup.number().min(1).required(),
					unitPrice: yup.number().min(0).required(),
				})
			)
			.min(1, t("validation.itemsRequired")),
	});


// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────
function SectionCard({ title, badge, children, delay = 0 }) {
	return (
		<motion.div
			className="main-card"
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay }}
		>
			<div className="flex items-center gap-3 mb-4">
				<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200">{title}</h3>
				{badge}
			</div>
			{children}
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Select with loading state
// ─────────────────────────────────────────────────────────────────────────────
function GeoSelect({ label, required, value, onValueChange, items, isLoading, placeholder, disabled, hint, nameKey = "nameEn" }) {
	
	const t = useTranslations("createOrder");
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Label className="text-sm text-gray-600 dark:text-slate-300">
					{label}{required && <span className="text-red-500 ml-0.5">*</span>}
				</Label>
			</div>
			<Select
				value={value || ""}
				onValueChange={onValueChange}
				disabled={disabled || isLoading}
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
				<SelectContent>
					{items.map((item) => (
						<SelectItem key={item.id} value={String(item.id)}>
							{item[nameKey] || item.nameEn || item.id}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Address section — Bosta mode (selects) vs Normal mode (text inputs)
// ─────────────────────────────────────────────────────────────────────────────
const GEO_CONFIG = {
	bosta: {
		needsGeo: true,
		showDistrict: true,
		showLocation: false,
		fields: ["cityId", "zoneId", "districtId"],
		tPrefix: "bosta", // Namespace for translations
	},
	turbo: {
		needsGeo: true,
		showDistrict: false,
		showLocation: false,
		fields: ["cityId", "zoneId"],
		tPrefix: "turbo",
	},
	// Default/Normal mode uses text inputs instead of dropdowns
	default: {
		needsGeo: false,
		showDistrict: false,
		showLocation: false,
		fields: [],
		tPrefix: "fields",
	}
};
function AddressSection({
	t,
	locale,
	provider,
	// react-hook-form
	control,
	errors,
	setValue,
	// Bosta geo
	providerMeta,
	onMetaChange,
	providerCities,
	providerZones,
	providerDistricts,
	providerLoading,
	normalCities,
	normalCitiesLoading,
	// Bosta validation errors
	providerErrors,
}) {


	const currentConfig = GEO_CONFIG[provider] || GEO_CONFIG.default;


	const nameKey = locale === "ar" ? "nameAr" : "nameEn";
	// Derived: districts filtered by selected zone (parentId === zoneId)
	const filteredDistricts = useMemo(() => {
		if (!currentConfig.showDistrict) return [];
		return providerDistricts.filter((d) => d.parentId === providerMeta.zoneId);
	}, [currentConfig.showDistrict, providerDistricts, providerMeta.zoneId]);
	// When user picks a city/zone/district — auto-fill the hidden RHF fields
	const handleCityChange = useCallback(
		(cityId, resetArea = true) => {
			if(!cityId) return;
			
			onMetaChange("cityId", cityId);
			onMetaChange("zoneId", "");
			onMetaChange("districtId", "");
			const cities = provider ?  providerCities  : normalCities;
			const city = cities.find((c) => String(c.id) === cityId);
			if (city) setValue("city", city[nameKey] || city.nameEn, { shouldValidate: true });
			if(resetArea ) setValue("area", "", { shouldValidate: false });
		},
		[providerCities, nameKey, onMetaChange, setValue, provider]
	);

	const handleZoneChange = useCallback(
		(zoneId) => {
			onMetaChange("zoneId", zoneId);
			onMetaChange("districtId", "");
			// rebuild area: zone name (district will be appended later)
			const zone = providerZones.find((z) => String(z.id) === zoneId);
			if (zone) setValue("area", zone[nameKey] || zone.nameEn, { shouldValidate: false });
		},
		[providerZones, nameKey, onMetaChange, setValue]
	);

	const handleDistrictChange = useCallback(
		(districtId) => {
			onMetaChange("districtId", districtId);
			const zone = providerZones.find((z) => String(z.id) === providerMeta.zoneId);
			const district = filteredDistricts.find((d) => String(d.id) === districtId);

			const zonePart = zone?.[nameKey] || zone?.nameEn
			const distinctPart = district?.[nameKey] || district?.nameEn
			if (distinctPart != zonePart) {

				const parts = [zonePart, distinctPart]
					.filter(Boolean)
					.join(", ");
				setValue("area", parts, { shouldValidate: false });
			} else {
				setValue("area", zonePart, { shouldValidate: false });
			}
		},
		[providerZones, filteredDistricts, providerMeta.zoneId, nameKey, onMetaChange, setValue]
	);

	// ── Bosta mode ──────────────────────────────────────────────────────────
	if (currentConfig.needsGeo) {
		const config = GEO_CONFIG[provider];

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
							value={providerMeta.cityId}
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
					value={providerMeta.cityId}
					onValueChange={(cityId) =>  handleCityChange(cityId, false)}
					items={normalCities ?? []}
					isLoading={normalCitiesLoading}
					placeholder={t("placeholders.city")}
				/>
					{errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
				</div>

				{/* Area */}
				<div className="space-y-2">
					<Label className="text-sm text-gray-600 dark:text-slate-300">
						{t("fields.area")}
					</Label>
					<Controller
						name="area"
						control={control}
						render={({ field }) => (
							<Input {...field} placeholder={t("placeholders.area")} />
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
								placeholder={t("placeholders.address")}
								className="rounded-xl min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50"
							/>
						)}
					/>
					{errors.address && (
						<p className="text-xs text-red-500">{errors.address.message}</p>
					)}
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
			</motion.div>
		</AnimatePresence>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateOrderPageComplete({
	isEditMode = false,
	existingOrder: propExistingOrder = null,
	orderId = null,
}) {
	const searchParams = useSearchParams();
	const fromId = searchParams.get("from");

	const [existingOrder, setExistingOrder] = useState(propExistingOrder);
	const [isDuplicating, setIsDuplicating] = useState(false);

	const { formatCurrency, shippingCompanies, isShippingLoading } = usePlatformSettings();
	const navigate = useRouter();
	const locale = useLocale();
	const isRTL = locale === "ar";
	const tShipping = useTranslations("shipping");
	const t = useTranslations("createOrder");

	const [loading, setLoading] = useState(false);
	const [selectedSkus, setSelectedSkus] = useState([]);
	const [initialLoading, setInitialLoading] = useState((isEditMode && !propExistingOrder) || !!fromId);

	// ── Fetch order for duplication ───────────────────────────────────────────
	useEffect(() => {
		const fetchFromOrder = async () => {
			if (!fromId || isEditMode) return;
			setIsDuplicating(true);
			setInitialLoading(true);
			try {
				const res = await api.get(`/orders/${fromId}`);
				setExistingOrder(res.data);
			} catch (e) {
				console.error(`Duplicate fetch: ${normalizeAxiosError(e)}`);
				toast.error(t("invalidOrderId"));
			} finally {
				setIsDuplicating(false);
				setInitialLoading(false);
			}
		};
		fetchFromOrder();
	}, [fromId, isEditMode, t]);

	// ── Shipping companies & stores ─────────────────────────────────────────

	const [stores, setStores] = useState([]);
	const [normalCities, setNormalCities] = useState([]);
	const [normalCitiesLoading, setNormalCitiesLoading] = useState(false);

	// ── geo state ─────────────────────────────────────────────────────
	const [providerMeta, setProviderMeta] = useState({
		cityId: "",
		zoneId: "",
		districtId: "",
		locationId: "",
	});
	const [providerErrors, setProviderErrors] = useState({});

	const [providerCities, setproviderCities] = useState([]);
	const [providerZones, setproviderZones] = useState([]);
	const [providerDistricts, setproviderDistricts] = useState([]);
	const [providerLocations, setproviderLocations] = useState([]);

	const [providerLoading, setproviderLoading] = useState({
		cities: false,
		zones: false,
		districts: false,
		locations: false,
	});

	// ── Schema ──────────────────────────────────────────────────────────────
	const schema = useMemo(() => createSchema(t), [t]);

	// ── Default values ──────────────────────────────────────────────────────
	const getDefaultValues = useCallback(() => {
		if ((isEditMode || fromId) && existingOrder) {
			return {
				customerName: existingOrder.customerName || "",
				phoneNumber: existingOrder.phoneNumber || "",
				secondPhoneNumber: existingOrder.secondPhoneNumber || "",
				allowOpenPackage: existingOrder.allowOpenPackage ?? false,
				email: existingOrder.email || "",
				address: existingOrder.address || "",
				city: existingOrder.city || "",
				cityId: existingOrder.cityId ? String(existingOrder.cityId) : "",
				area: existingOrder.area || "",
				landmark: existingOrder.landmark || "",
				paymentMethod: !fromId ? existingOrder.paymentMethod || "cod" : "cod",
				paymentStatus: !fromId ? existingOrder.paymentStatus || "pending" : "pending",
				shippingCompanyId: existingOrder.shippingCompany?.id
					? String(existingOrder.shippingCompany.id)
					: "",
				storeId: existingOrder.storeId ? String(existingOrder.storeId) : "",
				shippingCost: existingOrder.shippingCost || 0,
				discount: !fromId ? existingOrder.discount || 0 : 0,
				deposit: !fromId ? existingOrder.deposit || 0 : 0,
				notes: !fromId ? existingOrder.notes || "" : "",
				customerNotes: !fromId ? existingOrder.customerNotes || "" : "",
				items:
					existingOrder.items?.map((item) => ({
						variantId: item.variant?.id || item.variantId,
						productName: item.variant?.product?.name || item.productName || "",
						sku: item.variant?.sku || item.sku || "",
						attributes: item.variant?.attributes || item.attributes || {},
						quantity: item.quantity || 1,
						unitPrice: item.unitPrice || 0,
						unitCost: item.unitCost || item.unitPrice || 0,
					})) || [],
			};
		}
		return {
			customerName: "",
			phoneNumber: "",
			secondPhoneNumber: "",
			email: "",
			address: "",
			city: "",
			cityId: "",
			area: "",
			landmark: "",
			paymentMethod: "cod",
			paymentStatus: "pending",
			shippingCompanyId: "",
			storeId: "",
			shippingCost: 0,
			discount: 0,
			deposit: 0,
			notes: "",
			customerNotes: "",
			items: [],
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEditMode, fromId, existingOrder]);

	// ── RHF ─────────────────────────────────────────────────────────────────
	const {
		control,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: getDefaultValues(),
	});
	console.log(errors)
	const watchedItems = watch("items");
	const watchedShippingCost = watch("shippingCost");
	const watchedDiscount = watch("discount");
	const watchedDeposit = watch("deposit");
	const watchedShippingCompanyId = watch("shippingCompanyId");
	const area = watch("area");
	

	// ── Derive isBosta ───────────────────────────────────────────────────────
	const selectedCompany = useMemo(
		() => shippingCompanies.find((s) => String(s.providerId) === String(watchedShippingCompanyId)),
		[shippingCompanies, watchedShippingCompanyId]
	);

	const shippingProvider = useMemo(
		() => selectedCompany?.provider?.toLowerCase() || null,
		[selectedCompany]
	);

	// Providers that use the City/Zone/District selection flow
	const config = useMemo(
		() => GEO_CONFIG[shippingProvider] || GEO_CONFIG.default,
		[shippingProvider]
	);

	// ── Edit/Duplicate mode pre-fill ──────────────────────────────────────────
	useEffect(() => {
		if ((isEditMode || fromId) && existingOrder) {
			reset(getDefaultValues());
			if (existingOrder.items?.length > 0) {
				setSelectedSkus(
					existingOrder.items.map((item) => ({
						id: item.variant?.id || item.variantId,
						label: item.variant?.product?.name || item.productName,
						productName: item.variant?.product?.name || item.productName,
						sku: item.variant?.sku || item.sku,
						attributes: item.variant?.attributes || item.attributes || {},
						price: item.unitPrice || 0,
						cost: item.unitCost || item.unitPrice || 0,
					}))
				);
			}
			if (existingOrder.shippingMetadata) {
				setProviderMeta({
					cityId: existingOrder.shippingMetadata.cityId ?? "",
					zoneId: existingOrder.shippingMetadata.zoneId ?? "",
					districtId: existingOrder.shippingMetadata.districtId ?? "",
					locationId: existingOrder.shippingMetadata.locationId ?? "",
				});
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEditMode, fromId, existingOrder]);

	// ── Fetch shipping companies ──────────────────────────────────────────────
	useEffect(() => {

		if (isShippingLoading || isEditMode) return;


		if (shippingCompanies && shippingCompanies.length === 1) {

			const defaultId = shippingCompanies[0].providerId || shippingCompanies[0].id;

			if (defaultId) {
				setValue("shippingCompanyId", String(defaultId));
			}
		}
	}, [shippingCompanies, isShippingLoading, isEditMode, setValue]);

	// ── Fetch stores ─────────────────────────────────────────────────────────
	useEffect(() => {
		const getStores = async () => {
			try {
				const res = await api.get("/stores", { params: { limit: 200, isActive: true } });
				const data = Array.isArray(res.data.records) ? res.data.records : [];
				setStores(data);

				// Auto-select if only one option exists
				if (data.length === 1 && !isEditMode) {
					setValue("storeId", String(data[0].id));
				}
			} catch (e) {
				console.error(`Stores: ${normalizeAxiosError(e)}`);
			}
		};
		getStores();
	}, [isEditMode, setValue]);

	useEffect(() => {
		const getNormalCities = async () => {
			setNormalCitiesLoading(true);
			try {
				const res = await api.get("/lookups/cities", { params: { limit: 500 } });
				const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.records) ? res.data.records : [];
				setNormalCities(list);
			} catch (e) {
				console.error(`Cities lookup: ${normalizeAxiosError(e)}`);
			} finally {
				setNormalCitiesLoading(false);
			}
		};
		getNormalCities();
	}, []);

	useEffect(() => {
		const initMeta = async () => {
			if (!config.needsGeo) {
				setproviderCities([]);
				setproviderZones([]);
				setproviderDistricts([]);
				setproviderLocations([]);
				// setProviderMeta({ cityId: "", zoneId: "", districtId: "", locationId: "" });
				// setValue("city", "");
				// setValue("area", "");
				return;
			}

			setproviderLoading((p) => ({ ...p, cities: true, locations: true }));

			try {
				// Run both requests in parallel for better performance
				const requests = [api.get(`/shipping/cities/${shippingProvider}`)];

				// Only fetch pickup locations if the config requires it
				if (config.showLocation) {
					requests.push(api.get(`/shipping/pickup-locations/${shippingProvider}`));
				}
				const [citiesRes, locationsRes] = await Promise.all(requests);
				setproviderCities(citiesRes.data?.records ?? []);
				setproviderLocations(locationsRes.data?.records ?? []);
			} catch (e) {
				console.error(`Bosta Init Error: ${normalizeAxiosError(e)}`);
			} finally {
				setproviderLoading((p) => ({ ...p, cities: false, locations: false }));
			}
		};

		initMeta();
	}, [config.needsGeo, setValue, shippingProvider]);

	useEffect(() => {
		const fetchGeography = async () => {
			if (!config.needsGeo || !providerMeta.cityId) {
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
				if (config.showDistrict) {
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
	}, [config.needsGeo, config.showDistric, providerMeta.cityId, shippingProvider]);

	// ── Bosta meta setter ────────────────────────────────────────────────────
	const handleMetaChange = useCallback((field, value) => {
		setProviderMeta((prev) => ({ ...prev, [field]: value }));
	}, []);

	// ── Validate Bosta required fields ───────────────────────────────────────
	const validateGeo = useCallback(() => {
		const config = GEO_CONFIG[shippingProvider] || GEO_CONFIG.default;
		if (!config) return true; // No geo-validation needed for this provider

		const errs = {};

		config.fields.forEach((field) => {
			if (!providerMeta[field]) {
				// Mapping field keys to your localization keys
				const errorKey = field.replace("Id", "Required"); // cityId -> cityRequired
				errs[field] = t(`validation.${errorKey}`);
			}
		});

		setProviderErrors(errs);
		return Object.keys(errs).length === 0;
	}, [shippingProvider, providerMeta, t]);

	// ── Product handlers ─────────────────────────────────────────────────────
	const handleSelectSku = useCallback(
		(sku) => {
			if (selectedSkus.some((s) => s.id === sku.id)) return;
			setSelectedSkus((prev) => [...prev, sku]);
			setValue("items", [
				...watchedItems,
				{
					variantId: sku.id,
					productName: sku.label || sku.productName,
					sku: sku.sku || sku.key,
					attributes: sku.attributes || {},
					quantity: 1,
					unitPrice: sku.price || 0,
					unitCost: sku.cost || sku.price || 0,
				},
			]);
		},
		[selectedSkus, watchedItems, setValue]
	);

	// const handleDeleteProduct = useCallback(
	// 	(index) => {
	// 		const deleted = watchedItems[index];
	// 		setValue(
	// 			"items",
	// 			watchedItems.filter((_, i) => i !== index)
	// 		);
	// 		setSelectedSkus((prev) => prev.filter((s) => s.id !== deleted.variantId));
	// 	},
	// 	[watchedItems, setValue]
	// );
	const [removedItemsIds, setRemovedItemsIds] = useState([]);
	const handleDeleteProduct = useCallback(
		(index) => {
			const deleted = watchedItems[index];

			// Track removed items
			if (deleted?.variantId) {
				setRemovedItemsIds(prev => [...prev, { variantId: deleted.variantId }]);
			}

			// Remove from form items
			setValue(
				"items",
				watchedItems.filter((_, i) => i !== index)
			);

			// Remove from selected SKUs
			setSelectedSkus(prev =>
				prev.filter(s => s.id !== deleted.variantId)
			);
		},
		[watchedItems, setValue]
	);

	const handleProductFieldChange = useCallback(
		(index, field, value) => {
			const updated = [...watchedItems];
			updated[index] = { ...updated[index], [field]: value };
			setValue("items", updated);
		},
		[watchedItems, setValue]
	);

	const handleQuantityChange = useCallback(
		(index, delta) => {
			const updated = [...watchedItems];
			updated[index] = {
				...updated[index],
				quantity: Math.max(1, (updated[index].quantity || 1) + delta),
			};
			setValue("items", updated);
		},
		[watchedItems, setValue]
	);

	// ── Order summary ────────────────────────────────────────────────────────
	const summary = useMemo(() => {
		const productsTotal = watchedItems.reduce((sum, item) => {
			return sum + (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 0);
		}, 0);
		const shippingCost = parseFloat(watchedShippingCost) || 0;
		const discount = parseFloat(watchedDiscount) || 0;
		const deposit = parseFloat(watchedDeposit) || 0;
		const finalTotal = productsTotal + shippingCost - discount;
		return {
			productCount: watchedItems.length,
			productsTotal,
			shippingCost,
			discount,
			deposit,
			finalTotal,
			remaining: finalTotal - deposit,
		};
	}, [watchedItems, watchedShippingCost, watchedDiscount, watchedDeposit]);

	// ── Submit ───────────────────────────────────────────────────────────────
	const onSubmit = async (data) => {
		if (!validateGeo()) {
			toast.error(t("validation.fixErrors"));
			return;
		}
		setLoading(true);
		
		try {
			const payload = {
				customerName: data.customerName,
				phoneNumber: data.phoneNumber,
				secondPhoneNumber: data.secondPhoneNumber,
				allowOpenPackage: data.allowOpenPackage ?? false,
				email: data.email || undefined,
				address: data.address,
				city: data.city,
				cityId: data.cityId || undefined,
				area: data.area || undefined,
				landmark: data.landmark || undefined,
				paymentMethod: data.paymentMethod,
				paymentStatus: data.paymentStatus || undefined,
				shippingCompanyId:
					data.shippingCompanyId ? data.shippingCompanyId : undefined,
				storeId:
					data.storeId && data.storeId !== "none" ? data.storeId : undefined,
				shippingCost: Number(data.shippingCost || 0),
				discount: Number(data.discount || 0),
				deposit: Number(data.deposit || 0),
				notes: data.notes || undefined,
				customerNotes: data.customerNotes || undefined,
				shippingMetadata: {
							cityId: providerMeta.cityId || undefined,
							zoneId: providerMeta.zoneId || undefined,
							districtId: providerMeta.districtId || undefined,
							locationId: providerMeta.locationId || undefined,
					},
				removedItems: removedItemsIds,
				items: data.items.map((item) => ({
					variantId: item.variantId,
					quantity: Number(item.quantity),
					unitPrice: Number(item.unitPrice),
					unitCost: Number(item.unitCost || item.unitPrice),
				})),
			};

			if (isEditMode && orderId) {
				await api.patch(`/orders/${orderId}`, payload);
				toast.success(t("messages.updateSuccess"));
			} else {
				await api.post("/orders", payload);
				toast.success(t("messages.createSuccess"));
			}
			navigate.push("/orders");
		} catch (error) {
			console.error(`Failed to ${isEditMode ? "update" : "create"} order:`, error);
			toast.error(
				error.response?.data?.message ||
				(isEditMode ? t("messages.updateFailed") : t("messages.createFailed"))
			);
		} finally {
			setLoading(false);
		}
	};

	// ── Loading state ────────────────────────────────────────────────────────
	if (initialLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-slate-600 dark:text-slate-300">{t("loading.message")}</p>
				</div>
			</div>
		);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Render
	// ─────────────────────────────────────────────────────────────────────────
	return (
		<motion.div
			dir={isRTL ? "rtl" : "ltr"}
			initial={{ opacity: 0, y: 20, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
			className="min-h-screen p-5"
		>
			{/* ── Header ── */}
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.orders"), href: "/orders" },
					{
						name: isEditMode
							? t("breadcrumb.editOrder")
							: fromId
								? t("breadcrumb.duplicateOrder")
								: t("breadcrumb.createOrder"),
					},
				]}
				buttons={
					<div className="flex items-center gap-4">
						{!isEditMode && (
							<Button_ size="sm" label={t("actions.howToUse")} tone="ghost" icon={<Info size={18} />} />
						)}
						<Button_
							onClick={handleSubmit(onSubmit)}
							size="sm"
							icon={<Save size={18} />}
							label={
								loading
									? t("actions.saving")
									: isEditMode
										? t("actions.update")
										: t("actions.save")
							}

							disabled={loading || initialLoading}
						/>
					</div>
				}

			></PageHeader>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="flex flex-col lg:flex-row gap-6">
					<div className="flex-1 space-y-6">

						<SectionCard title={t("sections.customerInfo")} delay={0.2}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Customer Name */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.customerName")} *
									</Label>
									<Controller
										name="customerName"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.customerName")}

											/>
										)}
									/>
									{errors.customerName && (
										<p className="text-xs text-red-500">{errors.customerName.message}</p>
									)}
								</div>

								{/* Phone Number */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.phoneNumber")} *
									</Label>
									<Controller
										name="phoneNumber"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.phoneNumber")}

											/>
										)}
									/>
									{errors.phoneNumber && (
										<p className="text-xs text-red-500">{errors.phoneNumber.message}</p>
									)}
								</div>

								{/* Email */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.email")}
									</Label>
									<Controller
										name="email"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												type="email"
												placeholder={t("placeholders.email")}

											/>
										)}
									/>
									{errors.email && (
										<p className="text-xs text-red-500">{errors.email.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.secondPhoneNumber")}
									</Label>
									<Controller
										name="secondPhoneNumber"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.phoneNumber")}

											/>
										)}
									/>
									{errors.secondPhoneNumber && (
										<p className="text-xs text-red-500">{errors.secondPhoneNumber.message}</p>
									)}
								</div>


								{/* Store */}
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
										{t("fields.store")}
									</Label>
									<Controller
										control={control}
										name="storeId"
										render={({ field }) => (
											<Select value={field.value || ""} onValueChange={field.onChange}>
												<SelectTrigger >
													<SelectValue placeholder={t("placeholders.store")} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">{t("common.none")}</SelectItem>
													{stores.map((s) => (
														<SelectItem key={s.id} value={String(s.id)}>
															{s.label ?? s.name ?? `#${s.id}`}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>
							</div>
						</SectionCard>

						<SectionCard title={t("sections.paymentShipping")} delay={0.25}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Payment Method */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.paymentMethod")} *
									</Label>
									<Controller
										name="paymentMethod"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger >
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-card-select">
													<SelectItem value="cash">{t("paymentMethods.cash")}</SelectItem>
													<SelectItem value="card">{t("paymentMethods.card")}</SelectItem>
													<SelectItem value="bank_transfer">{t("paymentMethods.bankTransfer")}</SelectItem>
													<SelectItem value="cod">{t("paymentMethods.cod")}</SelectItem>
													<SelectItem value="other">{t("paymentMethods.other")}</SelectItem>
													<SelectItem value="unknown">{t("paymentMethods.unknown")}</SelectItem>
													<SelectItem value="unknown">{t("paymentMethods.wallet")}</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
									{errors.paymentMethod && (
										<p className="text-xs text-red-500">{errors.paymentMethod.message}</p>
									)}
								</div>

								{/* Payment Status */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.paymentStatus")}
									</Label>
									<Controller
										name="paymentStatus"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger >
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-card-select">
													<SelectItem value="pending">{t("paymentStatuses.pending")}</SelectItem>
													<SelectItem value="paid">{t("paymentStatuses.paid")}</SelectItem>
													<SelectItem value="partial">{t("paymentStatuses.partial")}</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								{/* Allow Open Select */}
								<div className="space-y-2">
									<Label className=" uppercase tracking-wider">{t("fields.allowOpenPackage")}</Label>
									<Controller
										name="allowOpenPackage"
										control={control}
										render={({ field }) => (
											<Select
												value={field.value ? "true" : "false"}
												onValueChange={(val) => field.onChange(val === "true")}
											>
												<SelectTrigger >
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-card-select border-border shadow-xl rounded-xl">
													<SelectItem value="true">{t("allowOpenOptions.yes")}</SelectItem>
													<SelectItem value="false">{t("allowOpenOptions.no")}</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								{/* Shipping Company */}
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
										{t("fields.shippingCompany")}
									</Label>
									<Controller
										control={control}
										name="shippingCompanyId"
										render={({ field }) => (
											<Select value={field.value || ""} onValueChange={field.onChange}>
												<SelectTrigger >
													<SelectValue placeholder={t("placeholders.shippingCompany")} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">{t("common.none")}</SelectItem>
													{shippingCompanies.map((s) => (
														<SelectItem key={s.providerId} value={String(s.providerId)}>
															{tShipping(`providers.${s.provider.toLowerCase()}`, {
																defaultValue: s.name,
															})}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								{/* Shipping Cost */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.shippingCost")}
									</Label>
									<Controller
										name="shippingCost"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												type="number"
												min="0"
												step="0.01"
												placeholder="0.00"

											/>
										)}
									/>
								</div>

								{/* Discount */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.discount")}
									</Label>
									<Controller
										name="discount"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												type="number"
												min="0"
												step="0.01"
												placeholder="0.00"

											/>
										)}
									/>
								</div>

								{/* Deposit */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.deposit")}
									</Label>
									<Controller
										name="deposit"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												type="number"
												min="0"
												step="0.01"
												placeholder="0.00"

											/>
										)}
									/>
								</div>

								{/* Pickup Location — only for Bosta, optional */}
								{config.showLocation && providerLocations?.length > 0 && (
									<div className="md:col-span-2 space-y-2">
										<div className="flex items-center gap-2">
											<Label className="text-sm text-gray-600 dark:text-slate-300">
												{t("bosta.pickupLocation")}
											</Label>
											<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
												{t("bosta.optional")}
											</span>
										</div>

										<><Select
											value={providerMeta.locationId || ""}
											onValueChange={(v) =>
												handleMetaChange("locationId", v === "none" ? "" : v)
											}
											disabled={providerLoading.locations}
										>
											<SelectTrigger >
												{providerLoading.locations ? (
													<span className="flex items-center gap-2 text-muted-foreground text-sm">
														<Loader2 size={14} className="animate-spin" />
														{t("bosta.loading")}
													</span>
												) : (
													<SelectValue placeholder={t("bosta.selectPickupLocation")} />
												)}
											</SelectTrigger>
											<SelectContent>
												{/* <SelectItem value="none">{t("bosta.defaultLocation")}</SelectItem> */}
												{providerLocations.map((l) => (
													<SelectItem key={l.id} value={String(l.id)}>
														{locale === "ar" ? l.nameAr : l.nameEn}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
											<p className="text-[11px] text-muted-foreground leading-snug">
												{t("bosta.pickupLocationNote")}
											</p>
										</>
									</div>
								)}
							</div>
						</SectionCard>

						<SectionCard
							title={t("sections.address")}
							delay={0.3}
						>
							<AddressSection
								t={t}
								locale={locale}
								provider={shippingProvider}
								control={control}
								errors={errors}
								setValue={setValue}
								providerMeta={providerMeta}
								onMetaChange={handleMetaChange}
								providerCities={providerCities}
								providerZones={providerZones}
								providerDistricts={providerDistricts}
								providerLoading={providerLoading}
								normalCities={normalCities}
								normalCitiesLoading={normalCitiesLoading}
								providerErrors={providerErrors}
							/>
						</SectionCard>

						{/* ═══════════════════════════════════════════════
						    CARD 4 — Add Products
						═══════════════════════════════════════════════ */}
						<motion.div
							className="main-card"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.35 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.addProducts")}
							</h3>
							<ProductSkuSearchPopover
								closeOnSelect={false}
								handleSelectSku={handleSelectSku}
								selectedSkus={selectedSkus}
							/>
							{errors.items && (
								<p className="text-xs text-red-500 mt-2">{errors.items.message}</p>
							)}
						</motion.div>

						{/* ═══════════════════════════════════════════════
						    CARD 5 — Products Table
						═══════════════════════════════════════════════ */}
						{watchedItems.length > 0 && (
							<motion.div
								className="main-card"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
							>
								<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
									{t("sections.productsTable")}
								</h3>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-gray-200 dark:border-slate-700">
												{[
													t("table.sku"),
													t("table.name"),
													t("table.unitPrice"),
													t("table.quantity"),
													t("table.total"),
													t("table.actions"),
												].map((h, i) => (
													<th
														key={i}
														className={`p-3 text-sm font-semibold text-gray-600 dark:text-slate-300 ${i === 5 ? "text-center" : "text-right"}`}
													>
														{h}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{watchedItems.map((product, index) => {
												const unitPrice = parseFloat(product.unitPrice) || 0;
												const quantity = parseFloat(product.quantity) || 0;
												return (
													<tr
														key={index}
														className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
													>
														<td className="p-3 text-sm text-gray-600 dark:text-slate-300">
															{product.sku}
														</td>
														<td className="p-3 text-sm font-semibold text-gray-700 dark:text-slate-200">
															{product.productName}
															{Object.keys(product.attributes || {}).length > 0 && (
																<div className="text-xs text-gray-500 font-normal mt-1">
																	{Object.entries(product.attributes).map(([k, v]) => (
																		<span key={k} className="mr-2">{k}: {v}</span>
																	))}
																</div>
															)}
														</td>
														<td className="p-3">
															<Input
																type="number"
																value={product.unitPrice}
																onChange={(e) =>
																	handleProductFieldChange(index, "unitPrice", e.target.value)
																}
																className="h-9 w-28"
																min="0"
																step="0.01"
															/>
														</td>
														<td className="p-3">
															<div className="flex items-center gap-1">
																<motion.button
																	type="button"
																	whileHover={{ scale: 1.1 }}
																	whileTap={{ scale: 0.9 }}
																	onClick={() => handleQuantityChange(index, -1)}
																	className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center"
																>
																	<Minus size={14} />
																</motion.button>
																<Input
																	type="number"
																	value={product.quantity}
																	onChange={(e) =>
																		handleProductFieldChange(index, "quantity", e.target.value)
																	}
																	className="h-9 w-16 text-center"
																	min="1"
																/>
																<motion.button
																	type="button"
																	whileHover={{ scale: 1.1 }}
																	whileTap={{ scale: 0.9 }}
																	onClick={() => handleQuantityChange(index, 1)}
																	className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center"
																>
																	<Plus size={14} />
																</motion.button>
															</div>
														</td>
														<td className="p-3 text-sm font-semibold text-green-600 dark:text-green-400">
															{formatCurrency((unitPrice * quantity).toFixed(2))}
														</td>
														<td className="p-3 text-center">
															<motion.button
																type="button"
																whileHover={{ scale: 1.1 }}
																whileTap={{ scale: 0.9 }}
																onClick={() => handleDeleteProduct(index)}
																className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
															>
																<Trash2 size={16} />
															</motion.button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</motion.div>
						)}

						{/* ═══════════════════════════════════════════════
						    CARD 6 — Notes
						═══════════════════════════════════════════════ */}
						<motion.div
							className="main-card"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.45 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.notes")}
							</h3>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.notes")}
									</Label>
									<Controller
										name="notes"
										control={control}
										render={({ field }) => (
											<Textarea
												{...field}
												placeholder={t("placeholders.notes")}
												className="min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-xl"
											/>
										)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.customerNotes")}
									</Label>
									<Controller
										name="customerNotes"
										control={control}
										render={({ field }) => (
											<Textarea
												{...field}
												placeholder={t("placeholders.customerNotes")}
												className="min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-xl"
											/>
										)}
									/>
								</div>
							</div>
						</motion.div>
					</div>

					{/* ── Right column: Summary ── */}
					<div className="w-full lg:w-[350px]">
						<OrderSummary t={t} summary={summary} />
					</div>
				</div>
			</form>
		</motion.div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Summary sidebar
// ─────────────────────────────────────────────────────────────────────────────
function OrderSummary({ t, summary }) {
	const { formatCurrency } = usePlatformSettings();
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.2, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
			className="sticky top-6"
		>
			{/* ── Card shell ─────────────────────────────────────────────────── */}
			<div className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 main-card">

				{/* ── Header ───────────────────────────────────────────────────── */}
				<div className="px-5 pt-5 pb-4 flex items-center justify-between">
					<h3 className="text-sm font-semibold text-foreground tracking-tight">
						{t("sections.orderSummary")}
					</h3>
					{/* Product count pill */}
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
            bg-[var(--primary)]/10 border border-[var(--primary)]/20
            text-[11px] font-bold text-[var(--primary)] tabular-nums leading-none">
						<Package className="w-3 h-3" />
						{summary.productCount}
					</span>
				</div>

				{/* Divider */}
				<div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />

				{/* ── Line items ───────────────────────────────────────────────── */}
				<div className="px-5 py-4 space-y-1">

					{/* Products subtotal */}
					<SummaryRow
						label={t("summary.productsTotal")}
						value={formatCurrency(summary.productsTotal)}
					/>

					{/* Shipping */}
					<SummaryRow
						label={t("summary.shippingCost")}
						value={formatCurrency(summary.shippingCost)}
					/>

					{/* Discount */}
					{summary.discount > 0 && (
						<SummaryRow
							label={t("summary.discount")}
							value={`-${formatCurrency(summary.discount)}`}
							valueClassName="text-destructive"
						/>
					)}

				</div>

				{/* ── Grand total ──────────────────────────────────────────────── */}
				<div className=" pb-5">
					<TotalRow
						label={t("summary.finalTotal")}
						value={formatCurrency(summary.finalTotal)}
						accentFrom="var(--primary)"
						accentTo="var(--secondary,var(--third))"
						textColor="text-[var(--primary)]"
						borderColor="border-[var(--primary)]/30"
					/>
				</div>

				{/* ── Deposit / Remaining (conditional) ───────────────────────── */}
				{summary.deposit > 0 && (
					<>
						{/* Thin section divider */}
						<div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />

						<div className="px-5 py-4 space-y-1">
							<SummaryRow
								label={t("summary.deposit")}
								value={formatCurrency(summary.deposit)}
								valueClassName="text-[var(--secondary,var(--third))]"
							/>
						</div>

						<div className=" pb-5">
							<TotalRow
								label={t("summary.remaining")}
								value={formatCurrency(summary.remaining)}
								accentFrom="var(--third,var(--secondary))"
								accentTo="var(--primary)"
								textColor="text-[var(--third,var(--secondary))]"
								borderColor="border-[var(--third,var(--secondary))]/30"
							/>
						</div>
					</>
				)}

			</div>
		</motion.div>
	)
}
function SummaryRow({ label, value, valueClassName }) {
	return (
		<div className="flex items-center justify-between py-2.5">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span className={cn("text-sm font-semibold text-foreground tabular-nums", valueClassName)}>
				{value}
			</span>
		</div>
	)
}

function TotalRow({ label, value, accentFrom, accentTo, textColor, borderColor }) {
	return (
		<div className={cn(
			"relative flex items-center justify-between px-4 py-3.5 rounded-md overflow-hidden",
			"border-1", borderColor
		)}>
			{/* Gradient fill */}
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-[0.07]"
				style={{
					background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`
				}}
			/>
			{/* Top sheen */}
			<span
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-1/2
          bg-gradient-to-b from-white/[0.08] to-transparent dark:from-white/[0.04]"
			/>

			<span className="relative text-sm font-semibold text-foreground">{label}</span>
			<span className={cn("relative text-xl font-bold tabular-nums", textColor)}>{value}</span>
		</div>
	)
}