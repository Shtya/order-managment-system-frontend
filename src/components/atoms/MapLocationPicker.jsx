"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Search as SearchIcon, X, Loader2, MapPin, LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
	iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon
const customIcon = new L.Icon({
	iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
	shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

function useDebouncedValue(value, delay = 350) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

function MapClickHandler({ onLocationSelect, readOnly }) {
	useMapEvents({
		click(e) {
			if (!readOnly) onLocationSelect(e.latlng.lat, e.latlng.lng);
		},
	});
	return null;
}

function MapCenterController({ center, fly = true }) {
	const map = useMap();

	useEffect(() => {
		if (!center) return;
		const next = L.latLng(center.lat, center.lng);
		if (fly) map.flyTo(next, Math.max(map.getZoom(), 13), { duration: 0.8 });
		else map.setView(next, map.getZoom());
	}, [center, map, fly]);

	return null;
}

export default function MapLocationPicker({
	initialLocation = null,
	onLocationSelect,
	// ✅ your real usage: 600x300
	height = "",
	width = "",
	readOnly = false,
	enableSearch = true,
}) {
	const t = useTranslations("mapPicker");

	const defaultCairo = useMemo(() => ({ lat: 30.0444, lng: 31.2357 }), []);
	const [position, setPosition] = useState(initialLocation || defaultCairo);

	// Search states (no suggestions list — only jump to first result)
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebouncedValue(query, 350);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState("");
	const [lastResultName, setLastResultName] = useState("");

	useEffect(() => {
		if (initialLocation) setPosition(initialLocation);
	}, [initialLocation]);

	const handleLocationSelect = (lat, lng) => {
		const next = { lat, lng };
		setPosition(next);
		onLocationSelect?.(lat, lng);
	};

	// ✅ search: when user types (debounced) -> fetch -> take FIRST result -> move map
	useEffect(() => {
		let cancelled = false;

		const run = async () => {
			if (!enableSearch || readOnly) return;

			const q = debouncedQuery.trim();
			if (q.length < 3) {
				setErr("");
				setLastResultName("");
				return;
			}

			setLoading(true);
			setErr("");
			setLastResultName("");

			try {
				const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
					q
				)}`;

				const res = await fetch(url, {
					headers: {
						"Accept-Language": "ar",
					},
				});

				if (!res.ok) throw new Error("Search failed");

				const data = await res.json();
				if (cancelled) return;

				const first = Array.isArray(data) ? data[0] : null;

				if (!first) {
					setErr(t("noResults"));
					return;
				}

				const lat = Number(first.lat);
				const lng = Number(first.lon);

				if (Number.isFinite(lat) && Number.isFinite(lng)) {
					setLastResultName(first.display_name || "");
					handleLocationSelect(lat, lng);
				} else {
					setErr(t("noResults"));
				}
			} catch (e) {
				if (cancelled) return;
				setErr(t("error"));
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		run();
		return () => {
			cancelled = true;
		};
	}, [debouncedQuery, enableSearch, readOnly, t]);

	const useMyLocation = () => {
		if (readOnly) return;
		if (!navigator.geolocation) {
			setErr(t("geoNotSupported"));
			return;
		}
		setLoading(true);
		setErr("");
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setLoading(false);
				handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
			},
			() => {
				setLoading(false);
				setErr(t("geoDenied"));
			},
			{ enableHighAccuracy: true, timeout: 8000 }
		);
	};

	return (
		<div style={{ height, width, position: "relative" }}>
			{/* ✅ Search UI (compact for 600x300) */}
			{enableSearch && !readOnly && (
				<div className="absolute top-3 left-3 right-3 z-[1000]">
					<div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/90 backdrop-blur shadow-xl">
						<div className="p-2">
							<div className="flex items-center gap-2">
								<div className="relative flex-1">
									<SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
									<input
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder={t("searchPlaceholder")}
										className="w-full h-[40px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 rtl:pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
									/>
									{query ? (
										<button
											type="button"
											onClick={() => {
												setQuery("");
												setErr("");
												setLastResultName("");
											}}
											className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
											aria-label={t("clear")}
											title={t("clear")}
										>
											<X className="w-4 h-4 text-slate-400" />
										</button>
									) : null}
								</div>

								<button
									type="button"
									onClick={useMyLocation}
									className="h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2 text-sm"
									title={t("myLocation")}
									aria-label={t("myLocation")}
								>
									<LocateFixed className="w-4 h-4 text-slate-500" />
									<span className="hidden sm:inline">{t("myLocation")}</span>
								</button>
							</div>

							<div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
								<span>{t("hint")}</span>
								{loading ? (
									<span className="inline-flex items-center gap-1">
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
										{t("searching")}
									</span>
								) : null}
							</div>

							{err ? <div className="mt-2 text-xs text-red-600 px-1">{err}</div> : null}

							{lastResultName ? (
								<div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 px-1 line-clamp-1">
									{t("jumpedTo")}: {lastResultName}
								</div>
							) : null}
						</div>
					</div>
				</div>
			)}

			<MapContainer
				center={[position.lat, position.lng]}
				zoom={13}
				scrollWheelZoom={!readOnly}
				style={{ height: "100%", width: "100%", zIndex: 0 }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				<MapClickHandler onLocationSelect={handleLocationSelect} readOnly={readOnly} />
				<MapCenterController center={position} fly />

				{position && <Marker position={[position.lat, position.lng]} icon={customIcon} />}
			</MapContainer>

			{/* Bottom hint (compact) */}
			{!readOnly && (
				<div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-800/90 rounded-xl shadow-lg p-2 z-[900] border border-slate-200 dark:border-slate-700">
					<div className="flex items-center gap-2">
						<MapPin className="w-4 h-4 text-slate-400" />
						<div>
							<p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
								{t("clickHint")}
							</p>
							<p className="text-[11px] font-mono text-slate-500">
								{position.lat.toFixed(6)}, {position.lng.toFixed(6)}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
