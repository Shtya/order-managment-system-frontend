"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import DataTable from "@/components/atoms/DataTable";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Button_ from "@/components/atoms/Button";
import IntegratedCompanyCard from "@/components/atoms/IntegatedCompanyCard";

/** ✅ Integrated Platform Card */
function IntegratedPlatformCard({ platform, onToggle, onEditSettings, t }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 border-2 border-gray-100 dark:border-slate-700 transition-all duration-200 shadow-sm"
		>
			{/* Platform Logo/Name */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					{platform.logo ? (
						<img src={platform.logo} alt={platform.name} className="h-12 object-contain" />
					) : (
						<div className="text-2xl font-bold text-primary">
							{platform.name}
						</div>
					)}
				</div>

				{/* Toggle Switch */}
				<button
					onClick={() => onToggle(platform.id)}
					className={cn(
						"relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
						platform.enabled ? "bg-primary" : "bg-gray-300 dark:bg-slate-600"
					)}
				>
					<span
						className={cn(
							"inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
							platform.enabled ? "translate-x-6" : "translate-x-1"
						)}
					/>
				</button>
			</div>

			{/* Platform Link */}
			<div className="mb-3">
				<div className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-1">
					{t("integrated.platformLink")}
				</div>
				<a
					href={platform.website}
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm text-primary hover:underline"
					dir="ltr"
				>
					{platform.website}
				</a>
			</div>

			{/* Description */}
			<p className="text-sm text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
				{platform.description}
			</p>

			{/* Edit Settings Button */}
			<motion.button
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				onClick={() => onEditSettings(platform.id)}
				className="w-full py-2.5 rounded-full border-2 border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-200 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
			>
				{t("integrated.editSettings")}
			</motion.button>
		</motion.div>
	);
}

/** ✅ Toolbar (JSX) */
function StoresTableToolbar({ t, searchValue, onSearchChange, onExport }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="relative w-[300px] focus-within:w-[350px] transition-all duration-300">
				<svg
					className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M15 4.3125H10.5C10.1925 4.3125 9.9375 4.0575 9.9375 3.75C9.9375 3.4425 10.1925 3.1875 10.5 3.1875H15C15.3075 3.1875 15.5625 3.4425 15.5625 3.75C15.5625 4.0575 15.3075 4.3125 15 4.3125Z" fill="#A6ACBD" />
					<path d="M12.75 6.5625H10.5C10.1925 6.5625 9.9375 6.3075 9.9375 6C9.9375 5.6925 10.1925 5.4375 10.5 5.4375H12.75C13.0575 5.4375 13.3125 5.6925 13.3125 6C13.3125 6.3075 13.0575 6.5625 12.75 6.5625Z" fill="#A6ACBD" />
					<path d="M8.625 16.3125C4.3875 16.3125 0.9375 12.8625 0.9375 8.625C0.9375 4.3875 4.3875 0.9375 8.625 0.9375C8.9325 0.9375 9.1875 1.1925 9.1875 1.5C9.1875 1.8075 8.9325 2.0625 8.625 2.0625C5.0025 2.0625 2.0625 5.01 2.0625 8.625C2.0625 12.24 5.0025 15.1875 8.625 15.1875C12.2475 15.1875 15.1875 12.24 15.1875 8.625C15.1875 8.3175 15.4425 8.0625 15.75 8.0625C16.0575 8.0625 16.3125 8.3175 16.3125 8.625C16.3125 12.8625 12.8625 16.3125 8.625 16.3125Z" fill="#A6ACBD" />
					<path d="M16.5001 17.0626C16.3576 17.0626 16.2151 17.0101 16.1026 16.8976L14.6026 15.3976C14.3851 15.1801 14.3851 14.8201 14.6026 14.6026C14.8201 14.3851 15.1801 14.3851 15.3976 14.6026L16.8976 16.1026C17.1151 16.3201 17.1151 16.6801 16.8976 16.8976C16.7851 17.0101 16.6426 17.0626 16.5001 17.0626Z" fill="#A6ACBD" />
				</svg>

				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={t("toolbar.searchPlaceholder")}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 placeholder:text-gray-400 dark:placeholder:text-slate-400 text-gray-700 dark:text-slate-100"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					className=" bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700  text-gray-700 dark:text-slate-100  flex items-center gap-1 !px-4 rounded-full  hover:bg-gray-50 dark:hover:bg-slate-800"
					onClick={onExport}
				>
					<svg className="rtl:mr-[-3px] ltr:ml-[-3px]" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M15.8333 9.16675C15.8333 8.48508 15.8333 7.85841 15.7067 7.55258C15.58 7.24675 15.3392 7.00508 14.8567 6.52341L10.91 2.57675C10.4942 2.16091 10.2867 1.95341 10.0283 1.83008C9.97487 1.8044 9.92007 1.78159 9.86417 1.76175C9.595 1.66675 9.30083 1.66675 8.71333 1.66675C6.00917 1.66675 4.65667 1.66675 3.74083 2.40508C3.55591 2.5542 3.38745 2.72265 3.23833 2.90758C2.5 3.82508 2.5 5.17591 2.5 7.88008V11.6667C2.5 14.8092 2.5 16.3809 3.47667 17.3567C4.45333 18.3326 6.02417 18.3334 9.16667 18.3334H15.8333M10 2.08341V2.50008C10 4.85675 10 6.03591 10.7325 6.76758C11.4642 7.50008 12.6433 7.50008 15 7.50008H15.4167" stroke="#A7A7A7" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M17.5002 11.6667H15.8335C15.6125 11.6667 15.4005 11.7545 15.2442 11.9108C15.088 12.0671 15.0002 12.2791 15.0002 12.5001V13.7501M15.0002 13.7501V15.8334M15.0002 13.7501H17.0835M5.8335 15.8334V14.1667M5.8335 14.1667V11.6667H7.0835C7.41502 11.6667 7.73296 11.7984 7.96738 12.0329C8.2018 12.2673 8.3335 12.5852 8.3335 12.9167C8.3335 13.2483 8.2018 13.5662 7.96738 13.8006C7.73296 14.0351 7.41502 14.1667 7.0835 14.1667H5.8335ZM10.4168 11.6667H11.4885C12.2777 11.6667 12.9168 12.2884 12.9168 13.0559V14.4442C12.9168 15.2109 12.2768 15.8334 11.4885 15.8334H10.4168V11.6667Z" stroke="#A7A7A7" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					{t("toolbar.export")}
				</Button>
			</div>
		</div>
	);
}

export default function StoreIntegrationsPage() {
	const t = useTranslations("storeIntegrations");

	const [search, setSearch] = useState("");

	// Integrated platforms

	const [integratedCompanies, setIntegratedCompanies] = useState([
		{
			id: 1,
			name: "J&T",
			logo: "/integrate/1.png",
			website: "J&T_shipping.com",
			bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #B5CBE9 129.29%)",
			description: t("integrated.description"),
			enabled: true,
		},
		{
			id: 2,
			name: "ShipBlu",
			logo: "/integrate/5.png",
			website: "J&T_shipping.com",
			bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #E9B5B5 129.29%)",
			description: t("integrated.description"),
			enabled: false,
		},
		{
			id: 3,
			name: "Mylerz",
			logo: "/integrate/2.png",
			website: "J&T_shipping.com",
			bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #E9C6B5 129.29%)",
			description: t("integrated.description"),
			enabled: false,
		},
		{
			id: 4,
			name: "Turbo",
			logo: "/integrate/4.png",
			website: "J&T_shipping.com",
			bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #CCB5E9 129.29%)",
			description: t("integrated.description"),
			enabled: false,
		},
		{
			id: 5,
			name: "Speedaf",
			logo: "/integrate/3.png",
			website: "J&T_shipping.com",
			bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #D4B9EF 129.29%)",
			description: t("integrated.description"),
			enabled: true,
		},
	]);


	const handleToggleCompany = (id) => {
		setIntegratedCompanies(prev =>
			prev.map(company =>
				company.id === id ? { ...company, enabled: !company.enabled } : company
			)
		);
	};

	const handleEditSettings = (id) => {
		console.log("Edit settings for company:", id);
	};

	const [pager, setPager] = useState(() => ({
		total_records: 671,
		current_page: 1,
		per_page: 6,
		records: Array.from({ length: 13 }).map((_, i) => ({
			id: i + 1,
			storeName: "فاشون شو",
			storeUrl: "htps://easyorder",
			platform: i % 2 === 0 ? "eazy order" : "youcan",
			email: "yosr@gmail.com",
			joinDate: "17-6-2025",
			status: "تلقائى",
			sendToInventory: i % 2 === 0,
		})),
	}));

	function updateQuery({ page, per_page }) {
		const url = new URL(window.location.href);
		url.searchParams.set("page", String(page));
		url.searchParams.set("limit", String(per_page));
		window.history.replaceState({}, "", url.toString());
	}

	function handlePageChange({ page, per_page }) {
		updateQuery({ page, per_page });
		setPager((prev) => ({
			...prev,
			current_page: page,
			per_page,
			records: Array.from({ length: per_page }).map((_, i) => ({
				id: (page - 1) * per_page + (i + 1),
				storeName: "فاشون شو",
				storeUrl: "htps://easyorder",
				platform: i % 2 === 0 ? "eazy order" : "youcan",
				email: "yosr@gmail.com",
				joinDate: "17-6-2025",
				status: "تلقائى",
				sendToInventory: i % 2 === 0,
			})),
		}));
	}

	/** ✅ Table columns */
	const columns = useMemo(() => {
		return [
			{
				key: "storeName",
				header: t("table.storeName"),
				className: "text-gray-700 dark:text-slate-200 font-semibold",
			},
			{
				key: "storeUrl",
				header: t("table.storeUrl"),
				cell: (row) => (
					<a
						href={row.storeUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
						dir="ltr"
					>
						{row.storeUrl}
					</a>
				),
			},
			{
				key: "platform",
				header: t("table.platform"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "email",
				header: t("table.email"),
				className: "text-gray-600 dark:text-slate-200",
				cell: (row) => <span dir="ltr">{row.email}</span>,
			},
			{
				key: "joinDate",
				header: t("table.joinDate"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "status",
				header: t("table.status"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "sendToInventory",
				header: t("table.sendToInventory"),
				className: "w-[150px]",
				cell: (row) => (
					<button
						className={cn(
							"relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
							row.sendToInventory ? "bg-primary" : "bg-gray-300 dark:bg-slate-600"
						)}
					>
						<span
							className={cn(
								"inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
								row.sendToInventory ? "rtl:-translate-x-6 ltr:translate-x-6 " : "rtl:-translate-x-[4px] ltr:translate-x-[4px]"
							)}
						/>
					</button>
				),
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[80px]",
				cell: (row) => (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									className={cn(
										"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
										"border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white hover:shadow-xl hover:shadow-red-500/40",
										"dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-600 dark:hover:border-red-600 dark:hover:text-white dark:hover:shadow-red-500/30"
									)}
									onClick={() => console.log("delete", row.id)}
								>
									<Trash2 size={16} className="transition-transform group-hover:scale-110" />
								</motion.button>
							</TooltipTrigger>
							<TooltipContent>{t("actions.delete")}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				),
			},
		];
	}, [t]);

	return (
		<div className="min-h-screen p-6">
			<div className="bg-card  flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-[rgb(var(--primary))]">{t("breadcrumb.integrations")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
					</div>

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
					</div>
				</div>
			</div>

			{/* Integrated Platforms Section */}
			<motion.div
				key="integrated"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -20 }}
				transition={{ duration: 0.3 }}
				className="bg-card mb-6"
			>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{integratedCompanies.map((company, index) => (
						<motion.div
							key={company.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<IntegratedCompanyCard
								company={company}
								onToggle={handleToggleCompany}
								onEditSettings={handleEditSettings}
								t={t}
							/>
						</motion.div>
					))}
				</div>
			</motion.div>

			{/* Stores Table */}
			<div className="bg-card rounded-sm">
				<StoresTableToolbar
					t={t}
					searchValue={search}
					onSearchChange={setSearch}
					onExport={() => console.log("export")}
				/>

				<div className="mt-4">
					<DataTable
						columns={columns}
						data={pager.records}
						pagination={{
							total_records: pager.total_records,
							current_page: pager.current_page,
							per_page: pager.per_page,
						}}
						onPageChange={({ page, per_page }) => handlePageChange({ page, per_page })}
						emptyState={t("empty")}
					/>
				</div>
			</div>
		</div>
	);
}