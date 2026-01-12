"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Plus,
	Trash2,
	Eye,
	CalendarDays,
	Phone,
	Mail,
	User,
	ChevronLeft,
	Edit2,
	Filter,
	RefreshCw,
	Users,
	Headphones,
	Package,
	FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";

import InfoCard from "@/components/atoms/InfoCard";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import DataTable from "@/components/atoms/DataTable";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** ✅ Toolbar (JSX) */
function EmployeesTableToolbar({
	t,
	searchValue,
	onSearchChange,
	onExport,
	onRefresh,
	onToggleFilters,
	isFiltersOpen,
}) {
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
					className={cn(
						" bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700  text-gray-700 dark:text-slate-100  flex items-center gap-1 !px-4 rounded-full  hover:bg-gray-50 dark:hover:bg-slate-800",
						isFiltersOpen && "border-[rgb(var(--primary))]/50"
					)}
					onClick={onToggleFilters}
				>
					<Filter size={18} className="text-[#A7A7A7] rtl:mr-[-3px] ltr:ml-[-3px]" />
					{t("toolbar.filter")}
				</Button>

				<Button
					variant="outline"
					className=" bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700  text-gray-700 dark:text-slate-100  flex items-center gap-1 !px-4 rounded-full  hover:bg-gray-50 dark:hover:bg-slate-800"
					onClick={onRefresh}
				>
					<RefreshCw size={18} className=" text-[#A7A7A7] rtl:mr-[-3px] ltr:ml-[-3px]" />
					{t("toolbar.refresh")}
				</Button>

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

function FiltersPanel({ t, value, onChange, onApply }) {
	return (
		<motion.div
			initial={{ height: 0, opacity: 0, y: -6 }}
			animate={{ height: "auto", opacity: 1, y: 0 }}
			exit={{ height: 0, opacity: 0, y: -6 }}
			transition={{ duration: 0.25 }}
		>
			<div className="bg-card !p-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
					<div className="space-y-2">
						<Label>{t("filters.role")}</Label>
						<Select
							value={value.role}
							onValueChange={(v) => onChange({ ...value, role: v })}
						>
							<SelectTrigger className=" w-full rounded-full !h-[45px] bg-[#fafafa]  dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.rolePlaceholder")} />
							</SelectTrigger>
							<SelectContent className={"bg-card-select"}>
								<SelectItem value="all">{t("filters.roleAll")}</SelectItem>
								<SelectItem value="data_entry">{t("filters.roleDataEntry")}</SelectItem>
								<SelectItem value="warehouse">{t("filters.roleWarehouse")}</SelectItem>
								<SelectItem value="customer_service">{t("filters.roleCustomerService")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.name")}</Label>
						<Input
							value={value.name}
							onChange={(e) => onChange({ ...value, name: e.target.value })}
							placeholder={t("filters.namePlaceholder")}
							className="rounded-full h-[45px] bg-[#fafafa]  dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
						/>
					</div>

					<div className="flex md:justify-end">
						<Button_
							onClick={onApply}
							size="sm"
							label={t("filters.apply")}
							tone="purple"
							variant="solid"
							icon={
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M15 4.3125H10.5C10.1925 4.3125 9.9375 4.0575 9.9375 3.75C9.9375 3.4425 10.1925 3.1875 10.5 3.1875H15C15.3075 3.1875 15.5625 3.4425 15.5625 3.75C15.5625 4.0575 15.3075 4.3125 15 4.3125Z" fill="white" />
									<path d="M12.75 6.5625H10.5C10.1925 6.5625 9.9375 6.3075 9.9375 6C9.9375 5.6925 10.1925 5.4375 10.5 5.4375H12.75C13.0575 5.4375 13.3125 5.6925 13.3125 6C13.3125 6.3075 13.0575 6.5625 12.75 6.5625Z" fill="white" />
									<path d="M8.625 16.3125C4.3875 16.3125 0.9375 12.8625 0.9375 8.625C0.9375 4.3875 4.3875 0.9375 8.625 0.9375C8.9325 0.9375 9.1875 1.1925 9.1875 1.5C9.1875 1.8075 8.9325 2.0625 8.625 2.0625C5.0025 2.0625 2.0625 5.01 2.0625 8.625C2.0625 12.24 5.0025 15.1875 8.625 15.1875C12.2475 15.1875 15.1875 12.24 15.1875 8.625C15.1875 8.3175 15.4425 8.0625 15.75 8.0625C16.0575 8.0625 16.3125 8.3175 16.3125 8.625C16.3125 12.8625 12.8625 16.3125 8.625 16.3125Z" fill="white" />
									<path d="M16.5001 17.0626C16.3576 17.0626 16.2151 17.0101 16.1026 16.8976L14.6026 15.3976C14.3851 15.1801 14.3851 14.8201 14.6026 14.6026C14.8201 14.3851 15.1801 14.3851 15.3976 14.6026L16.8976 16.1026C17.1151 16.3201 17.1151 16.6801 16.8976 16.8976C16.7851 17.0101 16.6426 17.0626 16.5001 17.0626Z" fill="white" />
								</svg>
							}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

export default function EmployeesPage() {
	const t = useTranslations("employees");

	const [active, setActive] = useState("all");
	const [search, setSearch] = useState("");

	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState({ role: "all", name: "" });

	/** ✅ Switcher */
	const items = useMemo(
		() => [
			{ id: "all", label: t("tabs.all"), icon: Users },
			{ id: "call_center", label: t("tabs.callCenter"), icon: Headphones },
			{ id: "warehouse", label: t("tabs.warehouse"), icon: Package },
			{ id: "warehouse_staff", label: t("tabs.warehouseStaff"), icon: Package },
			{ id: "data_entry", label: t("tabs.dataEntry"), icon: FileText },
			{ id: "customer_service", label: t("tabs.customerService"), icon: Headphones },
		],
		[t]
	);

	const stats = useMemo(
		() => [
			{
				title: t("stats.totalEmployees"),
				value: "76",
				icon: Users,
				bg: "bg-[#F3F6FF] dark:bg-[#0B1220]",
				iconColor: "text-[#6B7CFF] dark:text-[#8A96FF]",
				iconBorder: "border-[#6B7CFF] dark:border-[#8A96FF]",
			},
			{
				title: t("stats.dataEntry"),
				value: "34",
				icon: FileText,
				bg: "bg-[#FFF9F0] dark:bg-[#1A1208]",
				iconColor: "text-[#F59E0B] dark:text-[#FBBF24]",
				iconBorder: "border-[#F59E0B] dark:border-[#FBBF24]",
			},
			{
				title: t("stats.customerService"),
				value: "500",
				icon: Headphones,
				bg: "bg-[#F6FFF1] dark:bg-[#0E1A0C]",
				iconColor: "text-[#22C55E] dark:text-[#4ADE80]",
				iconBorder: "border-[#22C55E] dark:border-[#4ADE80]",
			},
			{
				title: t("stats.warehouseStaff"),
				value: "500",
				icon: Package,
				bg: "bg-[#F1FAFF] dark:bg-[#0A1820]",
				iconColor: "text-[#38BDF8] dark:text-[#7DD3FC]",
				iconBorder: "border-[#38BDF8] dark:border-[#7DD3FC]",
			},
		],
		[t]
	);

	const [pager, setPager] = useState(() => ({
		total_records: 671,
		current_page: 1,
		per_page: 6,
		records: Array.from({ length: 13 }).map((_, i) => ({
			id: i + 1,
			name: "يسرا علام",
			email: "yosra@gmail.com",
			phone: "01002766592",
			joinDate: "17-6-2025",
			role: i % 3 === 0 ? "خدمة عملاء" : i % 3 === 1 ? "مدخل بيانات" : "موظف مخزن",
		})),
	}));

	/** ✅ update query params + (مكان API call) */
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
				name: "يسرا علام",
				email: "yosra@gmail.com",
				phone: "01002766592",
				joinDate: "17-6-2025",
				role: i % 3 === 0 ? "خدمة عملاء" : i % 3 === 1 ? "مدخل بيانات" : "موظف مخزن",
			})),
		}));
	}

	const applyFilters = () => {
		// TODO: replace with API params call
		console.log("apply filters", filters);
	};

	/** ✅ Get role badge style */
	const getRoleBadgeStyle = (role) => {
		const styles = {
			"خدمة عملاء": {
				className: "rounded-md bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/30",
			},
			"مدخل بيانات": {
				className: "rounded-md bg-[#FFF9F0] text-[#F59E0B] hover:bg-[#FFF9F0] dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/30",
			},
			"موظف مخزن": {
				className: "rounded-md bg-[#F1FAFF] text-[#38BDF8] hover:bg-[#F1FAFF] dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/30",
			},
		};
		return styles[role] || styles["خدمة عملاء"];
	};

	/** ✅ Table columns */
	const columns = useMemo(() => {
		return [
			{ 
				key: "name", 
				header: t("table.name"), 
				className: "text-gray-700 dark:text-slate-200 font-semibold" 
			},
			{
				key: "joinDate",
				header: t("table.joinDate"),
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300">
						<CalendarDays size={16} className="text-gray-400 dark:text-slate-500" />
						{row.joinDate}
					</div>
				),
			},
			{
				key: "email",
				header: t("table.email"),
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300">
						<Mail size={16} className="text-gray-400 dark:text-slate-500" />
						{row.email}
					</div>
				),
			},
			{
				key: "phone",
				header: t("table.phone"),
				cell: (row) => (
					<div className="inline-flex items-center gap-2 text-gray-500 dark:text-slate-300">
						<Phone size={16} className="text-gray-400 dark:text-slate-500" />
						{row.phone}
					</div>
				),
			},
			{
				key: "role",
				header: t("table.role"),
				cell: (row) => {
					const style = getRoleBadgeStyle(row.role);
					return (
						<Badge className={style.className}>
							{row.role}
						</Badge>
					);
				},
			},
			{
				key: "options",
				header: t("table.options"),
				className: "w-[180px]",
				cell: (row) => (
					<TooltipProvider>
						<div className="flex items-center gap-2">
							{/* Delete */}
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
										<Trash2 size={16} className="transition-transform group-hover:scale-110 group-hover:rotate-12" />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.delete")}</TooltipContent>
							</Tooltip>

							{/* Edit */}
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										className={cn(
											"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
											"border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-xl hover:shadow-blue-500/40",
											"dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:border-blue-600 dark:hover:text-white dark:hover:shadow-blue-500/30"
										)}
										onClick={() => console.log("edit", row.id)}
									>
										<Edit2 size={16} className="transition-transform group-hover:scale-110 group-hover:-rotate-12" />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.edit")}</TooltipContent>
							</Tooltip>

							{/* View */}
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										className={cn(
											"group relative w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm",
											"border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white hover:shadow-xl hover:shadow-purple-500/40",
											"dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:border-purple-600 dark:hover:text-white dark:hover:shadow-purple-500/30"
										)}
										onClick={() => console.log("view", row.id)}
									>
										<Eye size={16} className="transition-transform group-hover:scale-110" />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{t("actions.view")}</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>
				),
			},
		];
	}, [t]);

	return (
		<div className="min-h-screen p-6">
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-[rgb(var(--primary))]">{t("breadcrumb.employees")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
					</div>

					<div className="flex items-center gap-4">
						<Button_
							href="/employees/new"
							size="sm"
							label={t("actions.addEmployee")}
							tone="purple"
							variant="solid"
							icon={
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M6.12078 3.34752C8.69901 3.06206 11.3009 3.06206 13.8791 3.34752C15.3066 3.50752 16.4583 4.63169 16.6258 6.06419C16.9313 8.67918 16.9313 11.3209 16.6258 13.9359C16.4583 15.3684 15.3066 16.4925 13.8791 16.6525C11.3009 16.938 8.69901 16.938 6.12078 16.6525C4.69328 16.4925 3.54161 15.3684 3.37411 13.9359C3.06866 11.3211 3.06866 8.67974 3.37411 6.06502C3.45883 5.36908 3.77609 4.72214 4.27447 4.22906C4.77285 3.73597 5.42314 3.42564 6.11994 3.34835M9.99994 5.83919C10.1657 5.83919 10.3247 5.90503 10.4419 6.02224C10.5591 6.13945 10.6249 6.29842 10.6249 6.46419V9.37502H13.5358C13.7015 9.37502 13.8605 9.44087 13.9777 9.55808C14.0949 9.67529 14.1608 9.83426 14.1608 10C14.1608 10.1658 14.0949 10.3247 13.9777 10.442C13.8605 10.5592 13.7015 10.625 13.5358 10.625H10.6249V13.5359C10.6249 13.7016 10.5591 13.8606 10.4419 13.9778C10.3247 14.095 10.1657 14.1609 9.99994 14.1609C9.83418 14.1609 9.67521 14.095 9.558 13.9778C9.44079 13.8606 9.37494 13.7016 9.37494 13.5359V10.625H6.46411C6.29835 10.625 6.13938 10.5592 6.02217 10.442C5.90496 10.3247 5.83911 10.1658 5.83911 10C5.83911 9.83426 5.90496 9.67529 6.02217 9.55808C6.13938 9.44087 6.29835 9.37502 6.46411 9.37502H9.37494V6.46419C9.37494 6.29842 9.44079 6.13945 9.558 6.02224C9.67521 5.90503 9.83418 5.83919 9.99994 5.83919Z"
										fill="white"
									/>
								</svg>
							}
						/>

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

				<SwitcherTabs items={items} activeId={active} onChange={setActive} className="w-full" />

				<div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-6">
					{stats.map((stat, index) => (
						<motion.div
							key={stat.title}
							initial={{ opacity: 0, y: 18 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.06 }}
						>
							<InfoCard
								title={stat.title}
								value={stat.value}
								icon={stat.icon}
								bg={stat.bg}
								iconColor={stat.iconColor}
								iconBorder={stat.iconBorder}
							/>
						</motion.div>
					))}
				</div>
			</div>

			{/* Toolbar + Filters + Table */}
			<div className="bg-card rounded-sm">
				<EmployeesTableToolbar
					t={t}
					searchValue={search}
					onSearchChange={setSearch}
					onExport={() => console.log("export")}
					onRefresh={() => console.log("refresh")}
					isFiltersOpen={filtersOpen}
					onToggleFilters={() => setFiltersOpen((v) => !v)}
				/>

				<AnimatePresence>
					{filtersOpen && (
						<FiltersPanel
							t={t}
							value={filters}
							onChange={setFilters}
							onApply={applyFilters}
						/>
					)}
				</AnimatePresence>

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