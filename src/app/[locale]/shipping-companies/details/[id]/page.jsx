"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import DataTable from "@/components/atoms/DataTable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Button_ from "@/components/atoms/Button";

/** ✅ Toolbar (JSX) */
function DetailsTableToolbar({ t, searchValue, onSearchChange, onExport }) {
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

export default function ShippingCompanyDetailsPage() {
	const t = useTranslations("shippingDetails");

	const [search, setSearch] = useState("");

	const [pager, setPager] = useState(() => ({
		total_records: 671,
		current_page: 1,
		per_page: 6,
		records: Array.from({ length: 13 }).map((_, i) => ({
			id: i + 1,
			emirate: "الشارقة",
			shippingFee: "500 د.أ",
			returnFee: "500 د.أ",
			totalDue: "500 د.أ",
			minDelivery: "2-3 أيام",
			maxDelivery: "7 أيام",
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
				emirate: "الشارقة",
				shippingFee: "500 د.أ",
				returnFee: "500 د.أ",
				totalDue: "500 د.أ",
				minDelivery: "2-3 أيام",
				maxDelivery: "7 أيام",
			})),
		}));
	}

	/** ✅ Table columns */
	const columns = useMemo(() => {
		return [
			{
				key: "emirate",
				header: t("table.emirate"),
				className: "text-gray-700 dark:text-slate-200 font-semibold",
			},
			{
				key: "shippingFee",
				header: t("table.shippingFee"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "returnFee",
				header: t("table.returnFee"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "totalDue",
				header: t("table.totalDue"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "minDelivery",
				header: t("table.minDelivery"),
				className: "text-gray-600 dark:text-slate-200",
			},
			{
				key: "maxDelivery",
				header: t("table.maxDelivery"),
				className: "text-gray-600 dark:text-slate-200",
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
						<span className="text-[rgb(var(--primary))]">{t("breadcrumb.details")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
					</div>

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

			{/* Toolbar + Table */}
			<div className="bg-card rounded-sm">
				<DetailsTableToolbar
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