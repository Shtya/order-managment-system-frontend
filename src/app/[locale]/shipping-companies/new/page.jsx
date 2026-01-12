"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button_ from "@/components/atoms/Button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";

export default function AddShippingCompanyPage() {
	const t = useTranslations("addShipping");
	const navigate = useRouter();

	const [formData, setFormData] = useState({
		name: "",
		shippingFee: "",
		returnFee: "",
		minDelivery: "",
		maxDelivery: "",
	});

	const [selectedCities, setSelectedCities] = useState([]);
	const [cityShippingData, setCityShippingData] = useState({});

	const availableCities = [
		{ id: "sharjah", name: t("cities.sharjah") },
		{ id: "alain", name: t("cities.alain") },
		{ id: "dubai", name: t("cities.dubai") },
		{ id: "abudhabi", name: t("cities.abudhabi") },
		{ id: "rak", name: t("cities.rak") },
		{ id: "fujairah", name: t("cities.fujairah") },
		{ id: "ajman", name: t("cities.ajman") },
	];

	const handleCityToggle = (cityId) => {
		if (selectedCities.includes(cityId)) {
			// Remove city
			setSelectedCities(prev => prev.filter(id => id !== cityId));
			setCityShippingData(prev => {
				const updated = { ...prev };
				delete updated[cityId];
				return updated;
			});
		} else {
			// Add city with default data
			setSelectedCities(prev => [...prev, cityId]);
			setCityShippingData(prev => ({
				...prev,
				[cityId]: {
					shippingFee: "",
					returnFee: "",
					minDelivery: "",
					maxDelivery: "",
				}
			}));
		}
	};

	const handleCityDataChange = (cityId, field, value) => {
		setCityShippingData(prev => ({
			...prev,
			[cityId]: {
				...prev[cityId],
				[field]: value,
			}
		}));
	};

	const handleRemoveCity = (cityId) => {
		setSelectedCities(prev => prev.filter(id => id !== cityId));
		setCityShippingData(prev => {
			const updated = { ...prev };
			delete updated[cityId];
			return updated;
		});
	};

	const handleSave = () => {
		console.log("Save shipping company:", {
			...formData,
			cities: selectedCities,
			cityData: cityShippingData,
		});
		// Add API call here
	};

	const getCityName = (cityId) => {
		return availableCities.find(c => c.id === cityId)?.name || cityId;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
			className="min-h-screen p-6"
		>
			{/* Header */}
			<div className="bg-card mb-6">
				<div className="flex items-center justify-between">
					{/* Breadcrumb */}
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<button
							onClick={() => navigate.push("/shipping")}
							className="text-gray-400 hover:text-primary transition-colors"
						>
							{t("breadcrumb.shipping")}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.addShipping")}</span>
						<span className="mr-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
					</div>

					{/* Actions */}
					<div className="flex items-center gap-4">
						<Button_
							size="sm"
							label={t("actions.howToUse")}
							tone="white"
							variant="solid"
							icon={
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M18.3848 5.7832C18.2851 5.41218 18.0898 5.07384 17.8184 4.80202C17.5469 4.53021 17.2088 4.33446 16.8379 4.23438C15.4727 3.86719 10 3.86719 10 3.86719C10 3.86719 4.52734 3.86719 3.16211 4.23242C2.79106 4.33219 2.45278 4.52782 2.18126 4.79969C1.90974 5.07155 1.71453 5.41007 1.61523 5.78125C1.25 7.14844 1.25 10 1.25 10C1.25 10 1.25 12.8516 1.61523 14.2168C1.81641 14.9707 2.41016 15.5645 3.16211 15.7656C4.52734 16.1328 10 16.1328 10 16.1328C10 16.1328 15.4727 16.1328 16.8379 15.7656C17.5918 15.5645 18.1836 14.9707 18.3848 14.2168C18.75 12.8516 18.75 10 18.75 10C18.75 10 18.75 7.14844 18.3848 5.7832ZM8.26172 12.6172V7.38281L12.793 9.98047L8.26172 12.6172Z"
										fill="#A7A7A7"
									/>
								</svg>
							}
						/>

						<Button_
							onClick={handleSave}
							size="sm"
							label={t("actions.save")}
							tone="purple"
							variant="solid"
							icon={
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M2.5 7.5C2.5 5.14333 2.5 3.96417 3.2325 3.2325C3.96417 2.5 5.14333 2.5 7.5 2.5H12.7858C13.4675 2.5 13.8075 2.5 14.1142 2.62667C14.42 2.75333 14.6608 2.995 15.1433 3.47667L16.5233 4.85667C17.0058 5.33833 17.2458 5.58 17.3733 5.88583C17.5 6.1925 17.5 6.5325 17.5 7.21417V12.5C17.5 14.8567 17.5 16.0358 16.7675 16.7675C16.2333 17.3025 15.4608 17.4467 14.1667 17.4858V14.9483C14.1667 14.4033 14.1667 13.9142 14.1133 13.5175C14.055 13.0842 13.92 12.6408 13.5567 12.2767C13.1925 11.9133 12.7483 11.7783 12.3158 11.72C11.9192 11.6667 11.43 11.6667 10.885 11.6667H8.28167C7.73667 11.6667 7.2475 11.6667 6.85083 11.72C6.4175 11.7783 5.97417 11.9133 5.61 12.2767C5.24667 12.6408 5.11167 13.085 5.05333 13.5175C5 13.9142 5 14.4033 5 14.9483V17.4367C4.1875 17.3567 3.64083 17.1758 3.2325 16.7675C2.5 16.0358 2.5 14.8567 2.5 12.5V7.5ZM12.5 15V17.5H7.5C7.20444 17.5 6.92667 17.4994 6.66667 17.4983V15C6.66667 14.3875 6.66833 14.0117 6.705 13.7392C6.7375 13.5008 6.7825 13.4608 6.78833 13.4558C6.79417 13.45 6.83333 13.4042 7.0725 13.3717C7.345 13.335 7.72083 13.3333 8.33333 13.3333H10.8333C11.4458 13.3333 11.8217 13.335 12.0942 13.3717C12.3333 13.4042 12.3725 13.4492 12.3775 13.455H12.3783C12.3842 13.4608 12.4292 13.5008 12.4617 13.7392C12.4983 14.0117 12.5 14.3875 12.5 15ZM5.83333 5.83333C5.61232 5.83333 5.40036 5.92113 5.24408 6.07741C5.0878 6.23369 5 6.44565 5 6.66667C5 6.88768 5.0878 7.09964 5.24408 7.25592C5.40036 7.4122 5.61232 7.5 5.83333 7.5H10C10.221 7.5 10.433 7.4122 10.5893 7.25592C10.7455 7.09964 10.8333 6.88768 10.8333 6.66667C10.8333 6.44565 10.7455 6.23369 10.5893 6.07741C10.433 5.92113 10.221 5.83333 10 5.83333H5.83333Z"
										fill="white"
									/>
								</svg>
							}
						/>
					</div>
				</div>
			</div>

			{/* Main Form */}
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Company Name & City Selection */}
				<motion.div
					className="bg-card"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Company Name */}
						<div className="space-y-2">
							<Label className="text-sm text-gray-600 dark:text-slate-300">
								{t("form.name")}
							</Label>
							<Input
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder={t("form.namePlaceholder")}
								className="rounded-full h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
							/>
						</div>

						{/* City Selection */}
						<div className="space-y-2">
							<Label className="text-sm text-gray-600 dark:text-slate-300">
								{t("form.cities")}
							</Label>
							<div className="flex flex-wrap gap-2">
								{availableCities.map((city) => (
									<motion.button
										key={city.id}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => handleCityToggle(city.id)}
										className={cn(
											"px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
											selectedCities.includes(city.id)
												? "bg-primary text-white shadow-lg shadow-primary/30"
												: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
										)}
									>
										{city.name}
									</motion.button>
								))}
							</div>
						</div>
					</div>
				</motion.div>

				{/* City-Specific Shipping Details */}
				{selectedCities.length > 0 && (
					<motion.div
						className="space-y-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200">
							{t("form.cityDetails")}
						</h3>

						{selectedCities.map((cityId, index) => (
							<motion.div
								key={cityId}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 + index * 0.1 }}
								className="bg-card"
							>
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-3">
										<Badge className="bg-primary/10 text-primary hover:bg-primary/10 px-3 py-1.5 text-sm font-semibold">
											{t("form.company")}: {getCityName(cityId)}
										</Badge>
									</div>
									<button
										onClick={() => handleRemoveCity(cityId)}
										className="text-red-500 hover:text-red-600 transition-colors"
									>
										<X size={20} />
									</button>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Shipping Fee */}
									<div className="space-y-2">
										<Label className="text-sm text-gray-600 dark:text-slate-300">
											{t("form.shippingFee")}
										</Label>
										<Input
											value={cityShippingData[cityId]?.shippingFee || ""}
											onChange={(e) => handleCityDataChange(cityId, "shippingFee", e.target.value)}
											placeholder="20 د.أ"
											className="rounded-full h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
										/>
									</div>

									{/* Return Fee */}
									<div className="space-y-2">
										<Label className="text-sm text-gray-600 dark:text-slate-300">
											{t("form.returnFee")}
										</Label>
										<Input
											value={cityShippingData[cityId]?.returnFee || ""}
											onChange={(e) => handleCityDataChange(cityId, "returnFee", e.target.value)}
											placeholder="20 د.أ"
											className="rounded-full h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
										/>
									</div>

									{/* Min Delivery */}
									<div className="space-y-2">
										<Label className="text-sm text-gray-600 dark:text-slate-300">
											{t("form.minDelivery")}
										</Label>
										<Input
											value={cityShippingData[cityId]?.minDelivery || ""}
											onChange={(e) => handleCityDataChange(cityId, "minDelivery", e.target.value)}
											placeholder="2 أيام"
											className="rounded-full h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
										/>
									</div>

									{/* Max Delivery */}
									<div className="space-y-2">
										<Label className="text-sm text-gray-600 dark:text-slate-300">
											{t("form.maxDelivery")}
										</Label>
										<Input
											value={cityShippingData[cityId]?.maxDelivery || ""}
											onChange={(e) => handleCityDataChange(cityId, "maxDelivery", e.target.value)}
											placeholder="10 أيام"
											className="rounded-full h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
										/>
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				)}

				{/* Empty State */}
				{selectedCities.length === 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
						className="bg-card text-center py-12"
					>
						<div className="text-gray-400 dark:text-slate-500 mb-2">
							{t("form.noCitiesSelected")}
						</div>
						<p className="text-sm text-gray-500 dark:text-slate-400">
							{t("form.selectCitiesHint")}
						</p>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}