"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Filter,
	Download,
	Eye,
	Edit,
	Trash2,
	Package,
	Clock,
	CheckCircle,
	XCircle,
	TrendingUp,
	MapPin,
	Phone,
	MoreVertical,
	Users,
	AlertCircle,
	RefreshCw,
	Copy,
	Truck,
	DollarSign,
	Calendar,
	X,
	Plus,
	Upload,
	FileSpreadsheet,
	Settings,
	Bell,
	Save,
	Edit2,
	Loader2,
	RotateCcw,
	AlertTriangle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";
import Button_ from "@/components/atoms/Button";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import api from "@/utils/api";
import { Checkbox } from "@/components/ui/checkbox";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";



// Fake Data Generator
const generateFakeOrders = (count = 50) => {
	const statuses = [
		"new", "confirmed", "pending_confirmation", "wrong_number",
		"duplicate", "postponed", "delivered", "in_shipping",
		"waiting_stock", "no_answer_shipping", "cancelled_shipping"
	];

	const cities = ["القاهرة", "الإسكندرية", "الجيزة", "طنطا", "المنصورة"];
	const areas = ["المعادي", "مصر الجديدة", "الدقي", "سموحة", "ميامي"];
	const products = ["خاتم فضة", "سلسلة ذهب", "أساور فضة", "حلق ذهب"];
	const shippingCompanies = ["أرامكس", "فيدكس", "DHL", "سمسا"];
	const employees = ["أحمد محمد", "فاطمة علي", "محمود حسن", "سارة إبراهيم", "خالد أحمد"];
	const paymentMethods = ["cash", "card", "bank_transfer", "cod"];

	return Array.from({ length: count }, (_, i) => ({
		id: i + 1,
		orderNumber: `ORD-${String(i + 1).padStart(6, "0")}`,
		customerName: `عميل ${i + 1}`,
		phoneNumber: `0${Math.floor(Math.random() * 1000000000)}`,
		city: cities[Math.floor(Math.random() * cities.length)],
		area: areas[Math.floor(Math.random() * areas.length)],
		address: `شارع ${Math.floor(Math.random() * 100)} - مبنى ${Math.floor(Math.random() * 50)}`,
		products: [
			{
				name: products[Math.floor(Math.random() * products.length)],
				quantity: Math.floor(Math.random() * 3) + 1,
				price: Math.floor(Math.random() * 500) + 100
			}
		],
		shippingCost: Math.floor(Math.random() * 50) + 30,
		status: statuses[Math.floor(Math.random() * statuses.length)],
		assignedEmployee: Math.random() > 0.3 ? employees[Math.floor(Math.random() * employees.length)] : null,
		trackingCode: `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
		paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
		shippingCompany: Math.random() > 0.4 ? shippingCompanies[Math.floor(Math.random() * shippingCompanies.length)] : null,
		deposit: Math.floor(Math.random() * 200),
		amountReceived: Math.floor(Math.random() * 500),
		finalTotal: Math.floor(Math.random() * 1000) + 300,
		created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
		retryCount: Math.floor(Math.random() * 5),
		lastRetry: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
	}));
};

// Bulk Upload Modal – template matches CreateOrderDto (no IDs); backend resolves SKU → variantId, shipping name → id
function BulkUploadModal({ isOpen, onClose, onSuccess }) {
	const t = useTranslations("orders");
	const [file, setFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [downloadLoading, setDownloadLoading] = useState(false);

	const handleDownloadTemplate = async () => {
		setDownloadLoading(true);
		try {
			const res = await api.get("/orders/bulk/template", { responseType: "blob" });
			const blob = new Blob([res.data], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "orders_bulk_template.xlsx";
			link.click();
			URL.revokeObjectURL(url);
			toast.success(t("bulkUpload.templateDownloaded"));
		} catch (err) {
			console.error(err);
			toast.error(err.response?.data?.message || t("bulkUpload.templateDownloadFailed"));
		} finally {
			setDownloadLoading(false);
		}
	};

	const handleFileChange = (e) => {
		const selectedFile = e.target.files[0];
		if (selectedFile) {
			const isXlsx =
				selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
				selectedFile.name.endsWith(".xlsx");
			if (isXlsx) {
				setFile(selectedFile);
			} else {
				toast.error(t("bulkUpload.invalidFileType"));
			}
		}
	};

	const handleUpload = async () => {
		if (!file) {
			toast.error(t("bulkUpload.noFileSelected"));
			return;
		}

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await api.post("/orders/bulk", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const data = res.data || {};
			const created = data.created ?? 0;
			const failed = data.failed ?? 0;
			const errors = data.errors ?? [];

			if (created > 0) {
				toast.success(t("bulkUpload.uploadSuccessCount", { count: created }));
				onSuccess?.();
				setFile(null);
				onClose();
			}
			if (failed > 0 && errors.length > 0) {
				errors.slice(0, 5).forEach((e) => toast.error(`${e.orderRef}: ${e.message}`));
				if (errors.length > 5) toast.error(t("bulkUpload.moreErrors", { count: errors.length - 5 }));
			}
			if (created === 0 && failed > 0) {
				toast.error(t("bulkUpload.uploadNoCreated"));
			}
		} catch (err) {
			console.error(err);
			toast.error(err.response?.data?.message || t("bulkUpload.uploadFailed"));
		} finally {
			setUploading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold flex items-center gap-3">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
							<Upload className="text-white" size={24} />
						</div>
						{t("bulkUpload.title")}
					</DialogTitle>
					<DialogDescription>
						{t("bulkUpload.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Step 1: Download Template */}
					<div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl">
						<div className="flex items-start gap-4">
							<div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
								1
							</div>
							<div className="flex-1">
								<h3 className="font-bold text-lg mb-2">{t("bulkUpload.step1Title")}</h3>
								<p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
									{t("bulkUpload.step1Description")}
								</p>
								<Button
									onClick={handleDownloadTemplate}
									disabled={downloadLoading}
									className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center gap-2"
								>
									{downloadLoading ? (
										<RefreshCw size={18} className="animate-spin" />
									) : (
										<FileSpreadsheet size={18} />
									)}
									{t("bulkUpload.downloadTemplate")}
								</Button>
							</div>
						</div>
					</div>

					{/* Step 2: Fill Data */}
					<div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl">
						<div className="flex items-start gap-4">
							<div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
								2
							</div>
							<div className="flex-1">
								<h3 className="font-bold text-lg mb-2">{t("bulkUpload.step2Title")}</h3>
								<p className="text-sm text-gray-600 dark:text-slate-400">
									{t("bulkUpload.step2Description")}
								</p>
							</div>
						</div>
					</div>

					{/* Step 3: Upload */}
					<div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl">
						<div className="flex items-start gap-4">
							<div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
								3
							</div>
							<div className="flex-1">
								<h3 className="font-bold text-lg mb-2">{t("bulkUpload.step3Title")}</h3>
								<p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
									{t("bulkUpload.step3Description")}
								</p>

								<div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary transition-colors">
									<input
										type="file"
										id="file-upload"
										accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
										onChange={handleFileChange}
										className="hidden"
									/>
									<label htmlFor="file-upload" className="cursor-pointer">
										<Upload size={48} className="mx-auto mb-4 text-gray-400" />
										<p className="text-sm font-semibold mb-2">
											{file ? file.name : t("bulkUpload.dragDrop")}
										</p>
										<p className="text-xs text-gray-500">
											{t("bulkUpload.supportedFormats")}
										</p>
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} className="rounded-xl">
						{t("common.cancel")}
					</Button>
					<Button
						onClick={handleUpload}
						disabled={!file || uploading}
						className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600"
					>
						{uploading ? (
							<>
								<RefreshCw size={18} className="animate-spin ml-2" />
								{t("bulkUpload.uploading")}
							</>
						) : (
							<>
								<Upload size={18} className="ml-2" />
								{t("bulkUpload.upload")}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Toolbar Component
function OrdersTableToolbar({
	searchValue,
	onSearchChange,
	onExport,
	onToggleFilters,
	onToggleDistribution,
	onBulkUpload,
	isFiltersOpen,
	onSearch,
}) {
	const t = useTranslations("orders");

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			onSearch?.();
		}
	};

	return (
		<div className="flex items-center justify-between gap-4 flex-wrap">
			<div className="relative w-full md:w-[300px] focus-within:w-full md:focus-within:w-[350px] transition-all duration-300">
				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={t("toolbar.searchPlaceholder")}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
				/>
			</div>

			<div className="flex items-center gap-2 flex-wrap">
				<Button
					variant="outline"
					className={cn(
						"bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 px-4 rounded-full",
						isFiltersOpen && "border-primary/50"
					)}
					onClick={onToggleFilters}
				>
					<Filter size={18} />
					{t("toolbar.filter")}
				</Button>

				<Button
					variant="outline"
					className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-100 flex items-center gap-2 px-4 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
					onClick={onToggleDistribution}
				>
					<Users size={18} />
					{t("toolbar.distribute")}
				</Button>

				<Button
					variant="outline"
					className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-100 flex items-center gap-2 px-4 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
					onClick={onExport}
				>
					<Download size={18} />
					{t("toolbar.export")}
				</Button>

				<Button
					variant="outline"
					className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-100 flex items-center gap-2 px-4 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50"
					onClick={onBulkUpload}
				>
					<Upload size={18} />
					{t("toolbar.bulkUpload")}
				</Button>
			</div>
		</div>
	);
}

// Filters Panel Component (keeping the same as before)
function FiltersPanel({ value, onChange, onApply, stores = [], shippingCompanies = [], statuses = [] }) {
	const t = useTranslations("orders");

	return (
		<motion.div
			initial={{ height: 0, opacity: 0, y: -6 }}
			animate={{ height: "auto", opacity: 1, y: 0 }}
			exit={{ height: 0, opacity: 0, y: -6 }}
			transition={{ duration: 0.25 }}
		>
			<div className="bg-card !p-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
					<div className="space-y-2">
						<Label>{t("filters.status")}</Label>
						<Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.statusPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								{Array.isArray(statuses) && statuses.length > 0 ? (
									statuses.map(s => (
										<SelectItem key={s.code || s.id} value={s.code || String(s.id)}>
											{s.system ? t(`statuses.${s.code}`) : (s.name || s.code)}
										</SelectItem>
									))
								) : (
									<>
										<SelectItem value="new">{t("statuses.new")}</SelectItem>
										<SelectItem value="confirmed">{t("statuses.confirmed")}</SelectItem>
										<SelectItem value="pending_confirmation">{t("statuses.pendingConfirmation")}</SelectItem>
										<SelectItem value="cancelled_shipping">{t("statuses.cancelledShipping")}</SelectItem>
									</>
								)}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.paymentStatus")}</Label>
						<Select
							value={value.paymentStatus}
							onValueChange={(v) => onChange({ ...value, paymentStatus: v })}
						>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.paymentStatusPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								<SelectItem value="pending">{t("paymentStatuses.pending")}</SelectItem>
								<SelectItem value="paid">{t("paymentStatuses.paid")}</SelectItem>
								<SelectItem value="partial">{t("paymentStatuses.partial")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* <div className="space-y-2">
						<Label>{t("filters.employee")}</Label>
						<Select
							value={value.employee}
							onValueChange={(v) => onChange({ ...value, employee: v })}
						>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.employeePlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								{employees.map(emp => (
									<SelectItem key={emp.value} value={emp.value}>{emp.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div> */}

					<div className="space-y-2">
						<Label>{t("filters.date")}</Label>
						<Flatpickr
							value={[
								value.startDate ? new Date(value.startDate) : null,
								value.endDate ? new Date(value.endDate) : null,
							]}
							onChange={([start, end]) => {
								onChange({
									...value,
									startDate: start ? start.toISOString().split("T")[0] : null,
									endDate: end ? end.toISOString().split("T")[0] : null,
								});
							}}
							options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
							className="w-full rounded-full h-[45px] px-4 bg-[#fafafa] dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
							placeholder={t("filters.datePlaceholder")}
						/>
					</div>

					{/* <div className="space-y-2">
						<Label>{t("filters.product")}</Label>
						<Select
							value={value.product}
							onValueChange={(v) => onChange({ ...value, product: v })}
						>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.productPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								{products.map(prod => (
									<SelectItem key={prod.value} value={prod.value}>{prod.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.area")}</Label>
						<Select
							value={value.area}
							onValueChange={(v) => onChange({ ...value, area: v })}
						>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.areaPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								{areas.map(area => (
									<SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>	 */}

					<div className="space-y-2">
						<Label>{t("filters.store")}</Label>
						<Select
							value={value.store}
							onValueChange={(v) => onChange({ ...value, store: v })}
						>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.storePlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								{(stores || []).map((store) => (
									<SelectItem key={store.id ?? store.value} value={String(store.id ?? store.value)}>
										{store.name ?? store.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.shippingCompany")}</Label>
						<Select
							value={value.shippingCompany}
							onValueChange={(v) => onChange({ ...value, shippingCompany: v })}
						>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.shippingCompanyPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								{(shippingCompanies || []).map((c) => (
									<SelectItem key={c.id ?? c.value} value={String(c.id ?? c.value)}>
										{c.name ?? c.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex md:justify-start col-span-1 md:col-span-4">
						<Button_
							onClick={onApply}
							size="sm"
							label={t("filters.apply")}
							tone="purple"
							variant="solid"
							icon={<Filter size={18} />}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

// Distribution Modal (keeping the same as before with translations)
function DistributionModal({ isOpen, onClose, orders }) {
	const t = useTranslations("orders");
	const [distributionType, setDistributionType] = useState(null);
	const [dateRange, setDateRange] = useState({
		from: new Date().toISOString().split("T")[0],
		to: new Date().toISOString().split("T")[0]
	});
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [selectedEmployee, setSelectedEmployee] = useState("");
	const [selectedOrders, setSelectedOrders] = useState([]);
	const [employeeCount, setEmployeeCount] = useState(3);

	const employees = [
		{ id: "emp1", name: "أحمد محمد", currentOrders: 12 },
		{ id: "emp2", name: "فاطمة علي", currentOrders: 8 },
		{ id: "emp3", name: "محمود حسن", currentOrders: 15 },
		{ id: "emp4", name: "سارة إبراهيم", currentOrders: 10 },
		{ id: "emp5", name: "خالد أحمد", currentOrders: 6 },
	];

	const handleDistribute = () => {
		if (distributionType === "normal") {
			if (!selectedEmployee || selectedOrders.length === 0) {
				toast.error(t("distribution.selectEmployeeAndOrders"));
				return;
			}
			toast.success(t("distribution.normalSuccess", {
				count: selectedOrders.length,
				employee: employees.find(e => e.id === selectedEmployee)?.name
			}));
		} else {
			toast.success(t("distribution.smartSuccess", {
				count: orders.length,
				employees: employeeCount
			}));
		}
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold flex items-center gap-3">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
							<Users className="text-white" size={24} />
						</div>
						{t("distribution.title")}
					</DialogTitle>
				</DialogHeader>

				{!distributionType ? (
					<div className="grid grid-cols-2 gap-4 py-6">
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => setDistributionType("normal")}
							className="p-8 rounded-2xl border-2 border-gray-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
						>
							<Users className="mx-auto mb-4 text-emerald-600" size={48} />
							<h3 className="text-xl font-bold mb-2">{t("distribution.normalTitle")}</h3>
							<p className="text-sm text-gray-600 dark:text-slate-400">
								{t("distribution.normalDescription")}
							</p>
						</motion.button>

						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => setDistributionType("smart")}
							className="p-8 rounded-2xl border-2 border-gray-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30"
						>
							<TrendingUp className="mx-auto mb-4 text-purple-600" size={48} />
							<h3 className="text-xl font-bold mb-2">{t("distribution.smartTitle")}</h3>
							<p className="text-sm text-gray-600 dark:text-slate-400">
								{t("distribution.smartDescription")}
							</p>
						</motion.button>
					</div>
				) : (
					<div className="space-y-6 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>{t("distribution.fromDate")}</Label>
								<Input
									type="date"
									value={dateRange.from}
									onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
									className="rounded-xl"
								/>
							</div>
							<div className="space-y-2">
								<Label>{t("distribution.toDate")}</Label>
								<Input
									type="date"
									value={dateRange.to}
									onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
									className="rounded-xl"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>{t("distribution.orderStatus")}</Label>
							<Select value={selectedStatus} onValueChange={setSelectedStatus}>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="new">{t("statuses.new")}</SelectItem>
									<SelectItem value="confirmed">{t("statuses.confirmed")}</SelectItem>
									<SelectItem value="pending_confirmation">{t("statuses.pendingConfirmation")}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{distributionType === "normal" ? (
							<>
								<div className="space-y-2">
									<Label>{t("distribution.selectEmployee")}</Label>
									<Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
										<SelectTrigger className="rounded-xl">
											<SelectValue placeholder={t("distribution.selectEmployeePlaceholder")} />
										</SelectTrigger>
										<SelectContent>
											{employees.map(emp => (
												<SelectItem key={emp.id} value={emp.id}>
													{emp.name} - ({emp.currentOrders} {t("distribution.currentOrders")})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label>{t("distribution.selectOrders")} ({orders.length} {t("distribution.available")})</Label>
									<div className="max-h-64 overflow-y-auto border rounded-xl p-4 space-y-2">
										{orders.slice(0, 10).map(order => (
											<div key={order.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">
												<Checkbox
													checked={selectedOrders.includes(order.id)}
													onCheckedChange={(checked) => {
														if (checked) {
															setSelectedOrders([...selectedOrders, order.id]);
														} else {
															setSelectedOrders(selectedOrders.filter(id => id !== order.id));
														}
													}}
												/>
												<span className="text-sm">{order.orderNumber} - {order.customerName}</span>
											</div>
										))}
									</div>
								</div>
							</>
						) : (
							<>
								<div className="space-y-2">
									<Label>{t("distribution.employeeCount")}</Label>
									<Input
										type="number"
										min="1"
										max="10"
										value={employeeCount}
										onChange={(e) => setEmployeeCount(parseInt(e.target.value))}
										className="rounded-xl"
									/>
								</div>

								<div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl p-4">
									<h4 className="font-bold mb-3 flex items-center gap-2">
										<TrendingUp size={18} />
										{t("distribution.preview")}
									</h4>
									<div className="space-y-2">
										{employees.slice(0, employeeCount).map((emp, idx) => {
											const ordersToAssign = Math.ceil(orders.length / employeeCount);
											return (
												<div key={emp.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
													<span className="font-semibold">{emp.name}</span>
													<Badge className="bg-emerald-100 text-emerald-700">
														+{ordersToAssign} {t("distribution.newOrders")}
													</Badge>
												</div>
											);
										})}
									</div>
								</div>
							</>
						)}
					</div>
				)}

				<DialogFooter>
					{distributionType && (
						<Button
							variant="outline"
							onClick={() => setDistributionType(null)}
							className="rounded-xl"
						>
							{t("common.back")}
						</Button>
					)}
					<Button
						onClick={distributionType ? handleDistribute : onClose}
						className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600"
						disabled={distributionType === "normal" && (!selectedEmployee || selectedOrders.length === 0)}
					>
						{distributionType ? t("distribution.distribute") : t("common.cancel")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Main Orders Page Component
export default function OrdersPageEnhanced() {
	const t = useTranslations("orders");
	const router = useRouter();
	const [retrySettingsOpen, setRetrySettingsOpen] = useState(false);
	const [statusFormOpen, setStatusFormOpen] = useState(false);
	const [editingStatus, setEditingStatus] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deletingStatus, setDeletingStatus] = useState(null);
	const [deleteOrderModalOpen, setDeleteOrderModalOpen] = useState(false);
	const [deletingOrder, setDeletingOrder] = useState(null);

	const [search, setSearch] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [distributionOpen, setDistributionOpen] = useState(false);
	const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
	const [filters, setFilters] = useState({
		status: "all",
		paymentStatus: "all",
		employee: "all",
		startDate: null,
		endDate: null,
		// product: "all",
		// area: "all",
		store: "all",
		shippingCompany: "all",
	});


	const [loading, setLoading] = useState(false);
	const [statsLoading, setStatsLoading] = useState(true);
	const [stats, setStats] = useState([]);
	const [orders, setOrders] = useState([]);
	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 12,
		records: [],
	});
	const [storesList, setStoresList] = useState([]);
	const [shippingCompaniesList, setShippingCompaniesList] = useState([]);
	const [ordersLoading, setOrdersLoading] = useState(false);
	useEffect(() => {
		fetchStats();
		fetchLookups();
		fetchOrders();
	}, []);


	const fetchStats = async () => {
		try {
			setStatsLoading(true);
			const response = await api.get("/orders/stats");
			setStats(response.data || []);
		} catch (error) {
			console.error("Error fetching stats:", error);
			toast.error(t("messages.errorFetchingStats"));
		} finally {
			setStatsLoading(false);
		}
	};

	const fetchLookups = async () => {
		try {
			const [storesRes, shippingRes] = await Promise.all([
				api.get('/lookups/stores', { params: { limit: 200, isActive: true } }),
				api.get('/shipping-companies', { params: { limit: 200, isActive: true } }),
			]);

			setStoresList(Array.isArray(storesRes.data) ? storesRes.data : (storesRes.data?.records || []));
			setShippingCompaniesList(Array.isArray(shippingRes.data?.records) ? shippingRes.data.records : (Array.isArray(shippingRes.data) ? shippingRes.data : []));
		} catch (e) {
			console.error('Error fetching lookups', e);
		}
	};

	const buildParams = (page = pager.current_page, per_page = pager.per_page) => {
		const params = {
			page,
			limit: per_page,
		};

		if (search) params.search = search;
		if (filters.status && filters.status !== 'all') params.status = filters.status;
		if (filters.paymentStatus && filters.paymentStatus !== 'all') params.paymentStatus = filters.paymentStatus;
		if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
		if (filters.startDate) params.startDate = filters.startDate;
		if (filters.endDate) params.endDate = filters.endDate;
		if (filters.shippingCompany && filters.shippingCompany !== 'all') params.shippingCompanyId = filters.shippingCompany;
		if (filters.store && filters.store !== 'all') params.storeId = filters.store;

		return params;
	};

	const fetchOrders = async (page = pager.current_page, per_page = pager.per_page) => {
		try {
			setOrdersLoading(true);
			const params = buildParams(page, per_page);
			const res = await api.get('/orders', { params });
			const data = res.data || {};
			setPager({
				total_records: data.total_records || 0,
				current_page: data.current_page || page,
				per_page: data.per_page || per_page,
				records: Array.isArray(data.records) ? data.records : [],
			});
			setOrders(Array.isArray(data.records) ? data.records : []);
		} catch (e) {
			console.error('Error fetching orders', e);
			toast.error(t('messages.errorFetchingOrders'));
		} finally {
			setOrdersLoading(false);
		}
	};


	const handleDeleteStatus = (status) => {
		setDeletingStatus(status);
		setDeleteModalOpen(true);
	};

	const handleEditStatus = (status) => {
		setEditingStatus(status);
		setStatusFormOpen(true);
	};

	const handleAddStatus = () => {
		setEditingStatus(null);
		setStatusFormOpen(true);
	};

	// Icon mapping for system statuses
	const getIconForStatus = (code) => {
		const iconMap = {
			new: Package,
			under_review: AlertCircle,
			preparing: Clock,
			ready: CheckCircle,
			shipped: Truck,
			delivered: CheckCircle,
			cancelled: XCircle,
			returned: RotateCcw, // make sure to import from lucide-react
		};

		return iconMap[code] || Package;
	};


	// Generate stats cards dynamically from fetched statuses
	const statsCards = useMemo(() => {
		if (!stats.length) return [];

		// Generate background colors from the color
		const generateBgColors = (hex) => {
			const hexToRgb = (h) => {
				const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
				return result ? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
				} : null;
			};

			const rgb = hexToRgb(hex);
			if (!rgb) return { light: "#f5f5f5", dark: "#1a1a1a" };

			return {
				light: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
				dark: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
			};
		};

		return stats
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((stat) => {
				const Icon = getIconForStatus(stat.code);
				const bgColors = generateBgColors(stat.color);

				return {
					id: stat.id,
					title: stat.system ? t(`statuses.${stat.code}`) : stat.name,
					value: String(stat.count || 0),
					icon: Icon,
					bg: `bg-[${bgColors.light}] dark:bg-[${bgColors.dark}]`,
					bgInlineLight: bgColors.light,
					bgInlineDark: bgColors.dark,
					iconColor: `text-[${stat.color}]`,
					iconColorInline: stat.color,
					iconBorder: `border-[${stat.color}]`,
					iconBorderInline: stat.color,
					code: stat.code,
					system: stat.system,
					sortOrder: stat.sortOrder,
					fullData: stat,
				};
			});
	}, [stats]);

	// Create statusesMap for filters and dropdowns
	const statusesMap = useMemo(() => {
		const map = {};
		stats.forEach(stat => {
			map[stat.code] = {
				id: stat.id,
				name: stat.name,
				color: stat.color,
				system: stat.system,
				count: stat.count,
			};
		});
		return map;
	}, [stats]);

	const handlePageChange = ({ page, per_page }) => {
		// Request server for the requested page
		fetchOrders(page, per_page);
	};

	const applyFilters = () => {
		// Apply filters and refresh orders from page 1
		toast.success(t("messages.filtersApplied"));
		fetchOrders(1, pager.per_page);
	};

	const handleExport = async () => {
		try {
			toast.loading(t("messages.exportStarted"));

			// Build export params (same as list but without pagination)
			const params = {};
			if (search) params.search = search;
			if (filters.status && filters.status !== 'all') params.status = filters.status;
			if (filters.paymentStatus && filters.paymentStatus !== 'all') params.paymentStatus = filters.paymentStatus;
			if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
			if (filters.startDate) params.startDate = filters.startDate;
			if (filters.endDate) params.endDate = filters.endDate;
			if (filters.shippingCompany && filters.shippingCompany !== 'all') params.shippingCompanyId = filters.shippingCompany;
			if (filters.store && filters.store !== 'all') params.storeId = filters.store;

			const response = await api.get('/orders/export', {
				params,
				responseType: 'blob', // Important for file download
			});

			// Parse filename from Content-Disposition header
			const contentDisposition = response.headers['content-disposition'];
			let filename = `orders_export_${Date.now()}.xlsx`;

			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?([^";]+)"?/);
				if (match && match[1]) {
					filename = match[1];
				}
			}

			// Create download link
			const url = window.URL.createObjectURL(new Blob([response.data], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			}));

			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();

			// Cleanup
			link.remove();
			window.URL.revokeObjectURL(url);

			toast.dismiss();
			toast.success(t("messages.exportSuccess"));
		} catch (error) {
			console.error('Export failed:', error);
			toast.dismiss();
			toast.error(error.response?.data?.message || t("messages.exportFailed"));
		}
	};

	// Status transition rules (mirror backend)
	const validTransitions = {
		new: ["under_review", "cancelled"],
		under_review: ["preparing", "cancelled"],
		preparing: ["ready", "cancelled"],
		ready: ["shipped", "cancelled"],
		shipped: ["delivered", "returned"],
		delivered: ["returned"],
		cancelled: [],
		returned: [],
	};

	const [updatingStatuses, setUpdatingStatuses] = useState([]);

	const setUpdating = (id, v) => {
		setUpdatingStatuses((prev) => {
			if (v) return Array.from(new Set(prev.concat(id)));
			return prev.filter((x) => x !== id);
		});
	};

	const getStatusBadge = (statusCode) => {
		const status = statusesMap[statusCode];
		if (!status) {
			return "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
		}

		// Generate badge colors from status color
		const hexToRgb = (hex) => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		};

		const rgb = hexToRgb(status.color);
		return {
			style: rgb ? {
				backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
				color: status.color,
			} : {},
			className: "rounded-md",
		};
	};

	const columns = useMemo(() => {
		return [
			{
				key: "orderNumber",
				header: t("table.orderNumber"),
				cell: (row) => (
					<span className="text-primary font-bold font-mono">{row.orderNumber}</span>
				),
			},
			// {
			// 	key: "assignedEmployee",
			// 	header: t("table.assignedEmployee"),
			// 	cell: (row) => (
			// 		<span className="text-gray-700 dark:text-slate-200">
			// 			{row.assignedEmployee || t("table.notAssigned")}
			// 		</span>
			// 	),
			// },
			{
				key: "customerName",
				header: t("table.customerName"),
				cell: (row) => (
					<span className="text-gray-700 dark:text-slate-200 font-semibold">
						{row.customerName}
					</span>
				),
			},
			{
				key: "phoneNumber",
				header: t("table.phoneNumber"),
				cell: (row) => (
					<div className="flex items-center gap-2 text-sm">
						<Phone size={14} />
						{row.phoneNumber}
					</div>
				),
			},
			{
				key: "products",
				header: t("table.products"),
				cell: (row) => (
					<div className="text-sm">
						{row.items.map((p, i) => (
							<div key={i}>{p.variant.product.name} (x{p.quantity})</div>
						))}
					</div>
				),
			},
			{
				key: "shippingCost",
				header: t("table.shippingCost"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{row.shippingCost} {t("currency")}
					</span>
				),
			},
			{
				key: "status",
				header: t("table.status"),
				cell: (row) => (
					<Badge className={cn("rounded-md", getStatusBadge(row.status))}>
						{row.status.system ? t(`statuses.${row.status.code}`) : (row.status.name || row.status.code)}
					</Badge>
				),
			},
			{
				key: "confirmStatus",
				header: t("table.confirmOrder"),
				cell: (row) => {
					const currentCode = row.status?.code;
					const currentStatusId = row.status?.id;
					return (
						<div className="flex items-center gap-2">
							<Select
								defaultValue={String(currentStatusId)}
								onValueChange={async (val) => {
									const statusId = Number(val);
									if (isNaN(statusId) || statusId === currentStatusId) return;
									const toastId = toast.loading(t("messages.statusUpdating"));
									try {
										setUpdating(row.id, true);
										await api.patch(`/orders/${row.id}/status`, { statusId });
										toast.success(t("messages.statusUpdated"), { id: toastId });
										fetchStats();
										fetchOrders(pager.current_page, pager.per_page);
									} catch (err) {
										console.error(err);
										toast.error(err.response?.data?.message || t("messages.errorUpdatingStatus"), { id: toastId });
									} finally {
										setUpdating(row.id, false);
									}
								}}
								disabled={updatingStatuses.includes(row.id)}
							>
								<SelectTrigger className="w-[150px] h-8">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(stats || []).map((s) => {
										const isSameStatus = String(s.id) === String(row.status?.id);
										const currentIsSystem = row.status?.system;
										const targetCode = s.code;

										// [2025-12-24] Trim: Determine if the move is allowed
										// 1. Never allow moving to the same status
										// 2. If current is system, target must be in validTransitions map
										// 3. If current is NOT system, allow all moves (except to itself)
										const isAllowed = !isSameStatus && (
											!currentIsSystem ||
											(validTransitions[currentCode] || []).includes(targetCode) ||
											!s.system // Allow moving from System to any Custom status
										);

										const disabled = !isAllowed;
										return (
											<SelectItem key={s.id} value={String(s.id)} disabled={disabled}>
												{s.system ? t(`statuses.${s.code}`) : (s.name || s.code)}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>
					);
				},
			},
			// {
			// 	key: "trackingCode",
			// 	header: t("table.trackingCode"),
			// 	cell: (row) => (
			// 		<span className="font-mono text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
			// 			{row.trackingCode}
			// 		</span>
			// 	),
			// },
			{
				key: "paymentMethod",
				header: t("table.paymentMethod"),
				cell: (row) => (
					<Badge variant="outline">
						{t(`paymentMethods.${row.paymentMethod}`)}
					</Badge>
				),
			},
			{
				key: "paymentStatus",
				header: t("table.paymentStatus"),
				cell: (row) => (
					<Badge variant="outline">
						{t(`paymentStatuses.${row.paymentStatus}`)}
					</Badge>
				),
			},
			{
				key: "city",
				header: t("table.city"),
				cell: (row) => (
					<div className="flex items-center gap-1 text-sm">
						<MapPin size={12} />
						{row.city}
					</div>
				),
			},
			{
				key: "address",
				header: t("table.address"),
				cell: (row) => (
					<span className="text-sm text-gray-600 dark:text-slate-300 line-clamp-1">
						{row.address}
					</span>
				),
			},
			{
				key: "shippingCompany",
				header: t("table.shippingCompany"),
				cell: (row) => (
					<span className="text-sm">{row.shippingCompany?.name || "-"}</span>
				),
			},
			{
				key: "deposit",
				header: t("table.deposit"),
				cell: (row) => (
					<span className="text-sm">{row.deposit} {t("currency")}</span>
				),
			},
			// {
			// 	key: "amountReceived",
			// 	header: t("table.amountReceived"),
			// 	cell: (row) => (
			// 		<span className="text-sm font-semibold text-green-600">
			// 			{row.amountReceived} {t("currency")}
			// 		</span>
			// 	),
			// },
			{
				key: "updated_at",
				header: t("table.lastUpdate"),
				cell: (row) => (
					<span className="text-xs text-gray-500">
						{new Date(row.updated_at).toLocaleDateString("ar-EG")}
					</span>
				),
			},
			{
				key: "actions",
				header: t("table.actions"),
				cell: (row) => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem
								onClick={() => router.push(`/orders/${row.id}`)}
								className="flex items-center gap-2"
							>
								<Eye size={16} />
								{t("actions.view")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => router.push(`/orders/edit/${row.id}`)}
								className="flex items-center gap-2"
							>
								<Edit size={16} />
								{t("actions.edit")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								disabled={!['new', 'cancelled'].includes(row.status?.code)}
								onClick={() => {
									setDeletingOrder(row);
									setDeleteOrderModalOpen(true);
								}}
								className="flex items-center gap-2 text-red-600"
							>
								<Trash2 size={16} />
								{t("actions.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		];
	}, [t, router, stats]);
	// const statsCards = useMemo(
	// 	() => [
	// 		{
	// 			title: t("stats.pendingConfirmation"),
	// 			value: String(stats.pending_confirmation),
	// 			icon: AlertCircle,
	// 			bg: "bg-[#FFF3E0] dark:bg-[#1A1108]",
	// 			iconColor: "text-[#FF9800] dark:text-[#FFB74D]",
	// 			iconBorder: "border-[#FF9800] dark:border-[#FFB74D]",
	// 		},
	// 		{
	// 			title: t("stats.confirmed"),
	// 			value: String(stats.confirmed),
	// 			icon: CheckCircle,
	// 			bg: "bg-[#E8F5E9] dark:bg-[#0E1A0C]",
	// 			iconColor: "text-[#4CAF50] dark:text-[#81C784]",
	// 			iconBorder: "border-[#4CAF50] dark:border-[#81C784]",
	// 		},
	// 		{
	// 			title: t("stats.new"),
	// 			value: String(stats.new),
	// 			icon: Package,
	// 			bg: "bg-[#E3F2FD] dark:bg-[#0A1220]",
	// 			iconColor: "text-[#2196F3] dark:text-[#64B5F6]",
	// 			iconBorder: "border-[#2196F3] dark:border-[#64B5F6]",
	// 		},
	// 		{
	// 			title: t("stats.total"),
	// 			value: String(stats.total),
	// 			icon: TrendingUp,
	// 			bg: "bg-[#F3E5F5] dark:bg-[#1A0E1F]",
	// 			iconColor: "text-[#9C27B0] dark:text-[#BA68C8]",
	// 			iconBorder: "border-[#9C27B0] dark:border-[#BA68C8]",
	// 		},
	// 		{
	// 			title: t("stats.wrongNumber"),
	// 			value: String(stats.wrong_number),
	// 			icon: Phone,
	// 			bg: "bg-[#FFEBEE] dark:bg-[#1F0A0A]",
	// 			iconColor: "text-[#F44336] dark:text-[#EF5350]",
	// 			iconBorder: "border-[#F44336] dark:border-[#EF5350]",
	// 		},
	// 		{
	// 			title: t("stats.duplicate"),
	// 			value: String(stats.duplicate),
	// 			icon: Copy,
	// 			bg: "bg-[#FFF8E1] dark:bg-[#1A1608]",
	// 			iconColor: "text-[#FFC107] dark:text-[#FFD54F]",
	// 			iconBorder: "border-[#FFC107] dark:border-[#FFD54F]",
	// 		},
	// 		{
	// 			title: t("stats.postponed"),
	// 			value: String(stats.postponed),
	// 			icon: Clock,
	// 			bg: "bg-[#E0F2F1] dark:bg-[#0A1A18]",
	// 			iconColor: "text-[#009688] dark:text-[#4DB6AC]",
	// 			iconBorder: "border-[#009688] dark:border-[#4DB6AC]",
	// 		},
	// 		{
	// 			title: t("stats.delivered"),
	// 			value: String(stats.delivered),
	// 			icon: CheckCircle,
	// 			bg: "bg-[#E8F5E9] dark:bg-[#0E1A0C]",
	// 			iconColor: "text-[#4CAF50] dark:text-[#81C784]",
	// 			iconBorder: "border-[#4CAF50] dark:border-[#81C784]",
	// 		},
	// 		{
	// 			title: t("stats.inShipping"),
	// 			value: String(stats.in_shipping),
	// 			icon: Truck,
	// 			bg: "bg-[#E1F5FE] dark:bg-[#0A1820]",
	// 			iconColor: "text-[#03A9F4] dark:text-[#4FC3F7]",
	// 			iconBorder: "border-[#03A9F4] dark:border-[#4FC3F7]",
	// 		},
	// 		{
	// 			title: t("stats.waitingStock"),
	// 			value: String(stats.waiting_stock),
	// 			icon: Package,
	// 			bg: "bg-[#FFF3E0] dark:bg-[#1A1108]",
	// 			iconColor: "text-[#FF9800] dark:text-[#FFB74D]",
	// 			iconBorder: "border-[#FF9800] dark:border-[#FFB74D]",
	// 		},
	// 		{
	// 			title: t("stats.noAnswerShipping"),
	// 			value: String(stats.no_answer_shipping),
	// 			icon: AlertCircle,
	// 			bg: "bg-[#FCE4EC] dark:bg-[#1F0A14]",
	// 			iconColor: "text-[#E91E63] dark:text-[#F06292]",
	// 			iconBorder: "border-[#E91E63] dark:border-[#F06292]",
	// 		},
	// 		{
	// 			title: t("stats.cancelledShipping"),
	// 			value: String(stats.cancelled_shipping),
	// 			icon: XCircle,
	// 			bg: "bg-[#FFEBEE] dark:bg-[#1F0A0A]",
	// 			iconColor: "text-[#F44336] dark:text-[#EF5350]",
	// 			iconBorder: "border-[#F44336] dark:border-[#EF5350]",
	// 		},
	// 	],
	// 	[t, stats]
	// );

	return (
		<div className="min-h-screen p-6">
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.orders")}</span>
					</div>

					<div className="flex items-center gap-3 flex-wrap">
						<Button_
							href="/orders/new"
							size="sm"
							label={t("actions.createOrder")}
							tone="purple"
							variant="solid"
							icon={<Plus size={18} />}
						/>
						<Button_
							size="sm"
							label={t("actions.settings")}
							tone="purple"
							variant="solid"
							onClick={() => setRetrySettingsOpen(true)}
							icon={<Settings size={18} />}
						/>
					</div>
				</div>

				<div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-6">
					{statsLoading ? (
						<div className="col-span-full flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : (
						<>
							{statsCards.map((stat, index) => (
								<motion.div
									style={{ order: stat.sortOrder }}
									key={stat.id}
									initial={{ opacity: 0, y: 18 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.06 }}
								>
									<div
										style={{
											background: `linear-gradient(135deg, ${stat.bgInlineLight} 0%, ${stat.bgInlineLight} 100%)`,
										}}
										className="rounded-lg"
									>
										<InfoCard
											title={stat.title}
											value={stat.value}
											icon={stat.icon}
											bg=""
											iconColor=""
											iconBorder=""
											editable={!stat.system}
											onEdit={() => handleEditStatus(stat.fullData)}
											onDelete={() => handleDeleteStatus(stat)}
											customStyles={{
												iconColor: stat.iconColorInline,
												iconBorder: stat.iconColorInline,
											}}
										/>
									</div>
								</motion.div>
							))}

							{/* Add Status Card */}
							<motion.div
								initial={{ opacity: 0, y: 18 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: statsCards.length * 0.06 }}
							>
								<InfoCard
									title={t("actions.addStatus")}
									icon={Plus}
									isAddCard={true}
									onClick={handleAddStatus}
								/>
							</motion.div>
						</>
					)}
				</div>
			</div>

			{/* <StatusManagementModal isOpen={true} t={t} /> */}

			<div className="bg-card rounded-sm">
				<OrdersTableToolbar
					searchValue={search}
					onSearchChange={setSearch}
					onExport={handleExport}
					isFiltersOpen={filtersOpen}
					onToggleFilters={() => setFiltersOpen((v) => !v)}
					onToggleDistribution={() => setDistributionOpen(true)}
					onBulkUpload={() => setBulkUploadOpen(true)}
					onSearch={applyFilters}
				/>

				<AnimatePresence>
					{filtersOpen && (
						<FiltersPanel
							value={filters}
							onChange={setFilters}
							onApply={applyFilters}
							stores={storesList}
							shippingCompanies={shippingCompaniesList}
							statuses={stats}
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
						onPageChange={handlePageChange}
						emptyState={t("empty")}
						loading={ordersLoading || loading}
					/>
				</div>
			</div>

			<DistributionModal
				isOpen={distributionOpen}
				onClose={() => setDistributionOpen(false)}
				orders={pager.records}

			/>


			<GlobalRetrySettingsModal
				isOpen={retrySettingsOpen}
				onClose={() => setRetrySettingsOpen(false)}

			/>

			<BulkUploadModal
				isOpen={bulkUploadOpen}
				onClose={() => setBulkUploadOpen(false)}
				onSuccess={() => {
					fetchOrders(1, pager.per_page);
					fetchStats();
				}}
			/>

			<StatusFormModal
				isOpen={statusFormOpen}
				onClose={() => {
					setStatusFormOpen(false);
					setEditingStatus(null);
				}}
				status={editingStatus}
				onSuccess={fetchStats}

			/>

			<DeleteStatusModal
				isOpen={deleteModalOpen}
				onClose={() => {
					setDeleteModalOpen(false);
					setDeletingStatus(null);
				}}
				status={deletingStatus}
				onSuccess={fetchStats}

			/>

			<DeleteOrderModal
				isOpen={deleteOrderModalOpen}
				onClose={() => {
					setDeleteOrderModalOpen(false);
					setDeletingOrder(null);
				}}
				order={deletingOrder}
				onSuccess={() => {
					fetchOrders(pager.current_page, pager.per_page);
					fetchStats();
				}}
			/>
		</div>
	);
}



// Global Retry Settings Modal
function GlobalRetrySettingsModal({ isOpen, onClose }) {
	const t = useTranslations("orders");
	const [settings, setSettings] = useState({
		enabled: true,
		maxRetries: 3,
		retryInterval: 30,
		autoMoveStatus: "cancelled",
		retryStatuses: ["pending_confirmation", "no_answer_shipping"],
		notifyEmployee: true,
		notifyAdmin: false,
		workingHours: {
			enabled: true,
			start: "09:00",
			end: "18:00"
		}
	});

	const handleSave = () => {
		toast.success(t("messages.settingsSaved"));
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold flex items-center gap-3">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
							<Settings className="text-white" size={24} />
						</div>
						{t("retrySettings.globalTitle")}
					</DialogTitle>
					<DialogDescription>
						{t("retrySettings.globalDescription")}
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="general" className="py-4">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="general">{t("retrySettings.tabs.general")}</TabsTrigger>
						<TabsTrigger value="automation">{t("retrySettings.tabs.automation")}</TabsTrigger>
						<TabsTrigger value="notifications">{t("retrySettings.tabs.notifications")}</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="space-y-6 mt-6">
						{/* Enable/Disable */}
						<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
							<div>
								<Label className="text-base font-semibold">{t("retrySettings.enableRetry")}</Label>
								<p className="text-sm text-gray-500 mt-1">{t("retrySettings.enableRetryDesc")}</p>
							</div>
							<Switch
								checked={settings.enabled}
								onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
							/>
						</div>

						{/* Max Retries */}
						<div className="space-y-2">
							<Label>{t("retrySettings.maxRetries")}</Label>
							<Input
								type="number"
								min="1"
								max="10"
								value={settings.maxRetries}
								onChange={(e) => setSettings({ ...settings, maxRetries: parseInt(e.target.value) })}
								className="rounded-xl"
							/>
							<p className="text-xs text-gray-500">{t("retrySettings.maxRetriesDesc")}</p>
						</div>

						{/* Retry Interval */}
						<div className="space-y-2">
							<Label>{t("retrySettings.retryInterval")}</Label>
							<div className="flex items-center gap-2">
								<Input
									type="number"
									min="5"
									max="1440"
									value={settings.retryInterval}
									onChange={(e) => setSettings({ ...settings, retryInterval: parseInt(e.target.value) })}
									className="rounded-xl"
								/>
								<span className="text-sm text-gray-500">{t("retrySettings.minutes")}</span>
							</div>
							<p className="text-xs text-gray-500">{t("retrySettings.retryIntervalDesc")}</p>
						</div>

						{/* Working Hours */}
						<div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
							<div className="flex items-center justify-between">
								<Label className="text-base font-semibold">{t("retrySettings.workingHours")}</Label>
								<Switch
									checked={settings.workingHours.enabled}
									onCheckedChange={(checked) => setSettings({
										...settings,
										workingHours: { ...settings.workingHours, enabled: checked }
									})}
								/>
							</div>

							{settings.workingHours.enabled && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-sm">{t("retrySettings.startTime")}</Label>
										<Input
											type="time"
											value={settings.workingHours.start}
											onChange={(e) => setSettings({
												...settings,
												workingHours: { ...settings.workingHours, start: e.target.value }
											})}
											className="rounded-xl"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-sm">{t("retrySettings.endTime")}</Label>
										<Input
											type="time"
											value={settings.workingHours.end}
											onChange={(e) => setSettings({
												...settings,
												workingHours: { ...settings.workingHours, end: e.target.value }
											})}
											className="rounded-xl"
										/>
									</div>
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent value="automation" className="space-y-6 mt-6">
						{/* Auto Move Status */}
						<div className="space-y-2">
							<Label>{t("retrySettings.autoMoveStatus")}</Label>
							<Select value={settings.autoMoveStatus} onValueChange={(v) => setSettings({ ...settings, autoMoveStatus: v })}>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="cancelled">{t("statuses.cancelled")}</SelectItem>
									<SelectItem value="postponed">{t("statuses.postponed")}</SelectItem>
									<SelectItem value="pending_confirmation">{t("statuses.pendingConfirmation")}</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-gray-500">{t("retrySettings.autoMoveStatusDesc")}</p>
						</div>

						{/* Retry Statuses */}
						<div className="space-y-3">
							<Label>{t("retrySettings.retryStatuses")}</Label>
							<div className="space-y-2">
								{[
									{ value: "pending_confirmation", label: t("statuses.pendingConfirmation") },
									{ value: "no_answer_shipping", label: t("statuses.noAnswerShipping") },
									{ value: "wrong_number", label: t("statuses.wrongNumber") },
									{ value: "postponed", label: t("statuses.postponed") }
								].map((status) => (
									<div key={status.value} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
										<Checkbox
											checked={settings.retryStatuses.includes(status.value)}
											onCheckedChange={(checked) => {
												if (checked) {
													setSettings({ ...settings, retryStatuses: [...settings.retryStatuses, status.value] });
												} else {
													setSettings({
														...settings,
														retryStatuses: settings.retryStatuses.filter(s => s !== status.value)
													});
												}
											}}
										/>
										<Label className="cursor-pointer">{status.label}</Label>
									</div>
								))}
							</div>
						</div>
					</TabsContent>

					<TabsContent value="notifications" className="space-y-6 mt-6">
						{/* Notify Employee */}
						<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
							<div>
								<Label className="text-base font-semibold">{t("retrySettings.notifyEmployee")}</Label>
								<p className="text-sm text-gray-500 mt-1">{t("retrySettings.notifyEmployeeDesc")}</p>
							</div>
							<Switch
								checked={settings.notifyEmployee}
								onCheckedChange={(checked) => setSettings({ ...settings, notifyEmployee: checked })}
							/>
						</div>

						{/* Notify Admin */}
						<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
							<div>
								<Label className="text-base font-semibold">{t("retrySettings.notifyAdmin")}</Label>
								<p className="text-sm text-gray-500 mt-1">{t("retrySettings.notifyAdminDesc")}</p>
							</div>
							<Switch
								checked={settings.notifyAdmin}
								onCheckedChange={(checked) => setSettings({ ...settings, notifyAdmin: checked })}
							/>
						</div>

						{/* Preview */}
						<div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl">
							<div className="flex items-start gap-3">
								<Bell size={20} className="text-purple-600 mt-1" />
								<div>
									<h4 className="font-bold mb-2">{t("retrySettings.notificationPreview")}</h4>
									<p className="text-sm text-gray-600 dark:text-slate-400">
										{t("retrySettings.notificationPreviewText")}
									</p>
								</div>
							</div>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} className="rounded-xl">
						{t("common.cancel")}
					</Button>
					<Button onClick={handleSave} className="rounded-xl bg-gradient-to-r from-primary to-purple-600">
						<Save size={18} className="ml-2" />
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}



function isValidHex(color) {
	return /^#([0-9A-F]{6})$/i.test(color);
}

const ColorPicker = ({ value, onChange, disabled }) => {
	const [showPicker, setShowPicker] = useState(false);
	const wrapperRef = useRef(null);

	// Local state for input typing
	const [inputValue, setInputValue] = useState(value);

	// Sync when parent value changes
	useEffect(() => {
		setInputValue(value);
	}, [value]);

	// Debounce effect
	useEffect(() => {
		const handler = setTimeout(() => {
			if (isValidHex(inputValue)) {
				onChange(inputValue.toUpperCase());
			}
		}, 400); // 400ms debounce

		return () => clearTimeout(handler);
	}, [inputValue])
	const presetColors = [
		"#F44336", "#E91E63", "#9C27B0", "#673AB7",
		"#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
		"#009688", "#4CAF50", "#8BC34A", "#CDDC39",
		"#FFEB3B", "#FFC107", "#FF9800", "#FF5722",
		"#795548", "#9E9E9E", "#607D8B", "#000000",
	];

	// ✅ Outside click detection
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
				setShowPicker(false);
			}
		};

		if (showPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showPicker]);

	return (
		<div className="relative" ref={wrapperRef}>
			<div className="flex gap-2">
				{/* Color Preview Button */}
				<button
					type="button"
					disabled={disabled}
					onClick={() => !disabled && setShowPicker(!showPicker)}
					className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-slate-600"
					style={{ backgroundColor: value }}
				/>

				{/* Manual HEX Input */}
				<Input
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					disabled={disabled}
					placeholder="#000000"
					className="flex-1 h-12 font-mono rounded-lg"
					maxLength={7}
				/>
			</div>

			{showPicker && !disabled && (
				<div className="absolute z-50 mt-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 space-y-4">

					{/* Native Color Picker (Any Hex) */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Custom Color
						</label>
						<input
							type="color"
							value={value}
							onChange={(e) => {
								setInputValue(e.target.value);
							}}
							className="w-full h-10 cursor-pointer"
						/>
					</div>

					{/* Preset Colors */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Preset Colors
						</label>
						<div className="grid grid-cols-6 gap-2">
							{presetColors.map((color) => (
								<button
									key={color}
									type="button"
									onClick={() => onChange(color)}
									className={[
										"w-8 h-8 rounded-md border-2 transition-all",
										value === color
											? "border-black dark:border-white scale-110"
											: "border-gray-300 dark:border-slate-600 hover:scale-110"
									].join(" ")}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					</div>

				</div>
			)}
		</div>
	);
};


function StatusFormModal({ isOpen, onClose, status, onSuccess }) {
	const t = useTranslations("orders");
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		color: "#2196F3",
		sortOrder: 0,
	});

	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (status) {
			setFormData({
				name: status.name || "",
				description: status.description || "",
				color: status.color || "#2196F3",
				sortOrder: status.sortOrder || 0,
			});
		} else {
			setFormData({
				name: "",
				description: "",
				color: "#2196F3",
				sortOrder: 0,
			});
		}
		setErrors({});
	}, [status, isOpen]);

	const validate = () => {
		const newErrors = {};

		if (!formData.name.trim()) {
			newErrors.name = t("validation.statusNameRequired");
		} else if (formData.name.length > 50) {
			newErrors.name = t("validation.statusNameMaxLength");
		}

		if (!/^#[0-9A-F]{6}$/i.test(formData.color)) {
			newErrors.color = t("validation.invalidColorCode");
		}

		if (formData.sortOrder < 0) {
			newErrors.sortOrder = t("validation.sortOrderMin");
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validate()) {
			return;
		}

		try {
			setLoading(true);

			if (status) {
				// Update existing status
				await api.patch(`/orders/statuses/${status.id}`, formData);
				toast.success(t("messages.statusUpdated"));
			} else {
				// Create new status
				await api.post("/orders/statuses", formData);
				toast.success(t("messages.statusCreated"));
			}

			onClose();
			onSuccess();
		} catch (error) {
			console.error("Error saving status:", error);
			toast.error(error.response?.data?.message || t("messages.errorSavingStatus"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						{status ? t("statusForm.editTitle") : t("statusForm.addTitle")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("statusForm.name")} *
						</Label>
						<Input
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							placeholder={t("statusForm.namePlaceholder")}
							className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
							maxLength={50}
						/>
						{errors.name && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertCircle size={12} />
								{errors.name}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("statusForm.description")}
						</Label>
						<Textarea
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							placeholder={t("statusForm.descriptionPlaceholder")}
							className="rounded-lg bg-[#fafafa] dark:bg-slate-800/50 min-h-[100px]"
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("statusForm.color")} *
						</Label>
						<ColorPicker
							value={formData.color}
							onChange={(color) => setFormData({ ...formData, color: color })}
						/>
						{errors.color && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertCircle size={12} />
								{errors.color}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("statusForm.sortOrder")}
						</Label>
						<Input
							type="number"
							value={formData.sortOrder}
							onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
							className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
							min={0}
						/>
						{errors.sortOrder && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertCircle size={12} />
								{errors.sortOrder}
							</p>
						)}
						<p className="text-xs text-gray-500 dark:text-slate-400">
							{t("statusForm.sortOrderHelp")}
						</p>
					</div>

					<div className="flex gap-3 pt-4">
						<Button
							type="submit"
							disabled={loading}
							className="flex-1 h-[45px]"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("statusForm.saving")}
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									{status ? t("statusForm.update") : t("statusForm.create")}
								</>
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={loading}
							className="h-[45px] px-8"
						>
							{t("statusForm.cancel")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}



function DeleteStatusModal({ isOpen, onClose, status, onSuccess }) {
	const t = useTranslations("orders");
	const [confirmText, setConfirmText] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleDelete = async (e) => {
		e.preventDefault();
		setError("");

		// Validate confirmation text
		if (confirmText.trim().toLowerCase() !== status?.title.toLowerCase()) {
			setError(t("deleteStatus.errorMismatch"));
			return;
		}

		try {
			setLoading(true);
			await api.delete(`/orders/statuses/${status.id}`);
			toast.success(t("messages.statusDeleted"));
			onSuccess();
			handleClose();
		} catch (error) {
			console.error("Error deleting status:", error);
			toast.error(error.response?.data?.message || t("messages.errorDeletingStatus"));
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setConfirmText("");
		setError("");
		onClose();
	};

	if (!status) return null;
	const isConfirmValid = confirmText.trim().toLowerCase() === status?.title.toLowerCase();

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
							<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{t("deleteStatus.title")}
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
								{t("deleteStatus.subtitle")}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleDelete} className="space-y-4 pt-4">
					{/* Warning message */}
					<div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
						<p className="text-sm text-red-800 dark:text-red-200">
							{t("deleteStatus.warning")}
						</p>
						<p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">
							{t("deleteStatus.statusName")}: <span className="font-bold">{status?.title}</span>
						</p>
					</div>

					{/* Status details */}
					<div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
						<div className="flex items-center gap-3">
							<div
								className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
								style={{ borderColor: status?.iconBorderInline }}
							>
								<div
									className="w-4 h-4 rounded-full"
									style={{ backgroundColor: status?.bgInlineLight }}
								/>
							</div>
							<div className="flex-1">
								<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{status?.title}
								</p>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									{status?.count} {t("deleteStatus.ordersWithStatus")}
								</p>
							</div>
						</div>
					</div>

					{/* Confirmation input */}
					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("deleteStatus.confirmLabel")}
						</Label>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
							{t("deleteStatus.confirmHint")} <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{status?.name}</span>
						</p>
						<Input
							value={confirmText}
							onChange={(e) => {
								setConfirmText(e.target.value);
								setError("");
							}}
							placeholder={status?.name}
							className="rounded-lg h-[45px] bg-white dark:bg-slate-800 border-2"
							autoComplete="off"
						/>
						{error && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertTriangle size={12} />
								{error}
							</p>
						)}
					</div>

					{/* Action buttons */}
					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={loading}
							className="flex-1 h-[45px]"
						>
							{t("deleteStatus.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={loading || !isConfirmValid}
							className="flex-1 h-[45px] bg-red-600 hover:bg-red-700 text-white"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("deleteStatus.deleting")}
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									{t("deleteStatus.confirm")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function DeleteOrderModal({ isOpen, onClose, order, onSuccess }) {
	const t = useTranslations("orders");
	const [confirmText, setConfirmText] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleDelete = async (e) => {
		e.preventDefault();
		setError("");

		// Validate confirmation text
		if (confirmText.trim().toLowerCase() !== order?.orderNumber?.toLowerCase()) {
			setError(t("deleteOrder.errorMismatch"));
			return;
		}

		try {
			setLoading(true);
			await api.delete(`/orders/${order.id}`);
			toast.success(t("messages.orderDeleted"));
			onSuccess();
			handleClose();
		} catch (error) {
			console.error("Error deleting order:", error);
			toast.error(error.response?.data?.message || t("messages.errorDeletingOrder"));
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setConfirmText("");
		setError("");
		onClose();
	};

	if (!order) return null;
	const isConfirmValid = confirmText.trim().toLowerCase() === order?.orderNumber?.toLowerCase();

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
							<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{t("deleteOrder.title")}
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
								{t("deleteOrder.subtitle")}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleDelete} className="space-y-4 pt-4">
					{/* Warning message */}
					<div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
						<p className="text-sm text-red-800 dark:text-red-200">
							{t("deleteOrder.warning")}
						</p>
						<p className="text-sm text-red-700 dark:text-red-300 mt-2 font-semibold">
							{t("deleteOrder.orderNumber")}: <span className="font-bold">{order?.orderNumber}</span>
						</p>
					</div>

					{/* Order details */}
					<div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<p className="text-xs text-gray-500 dark:text-gray-400">{t("table.orderNumber")}</p>
								<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{order?.orderNumber}
								</p>
							</div>
							<div className="flex items-center justify-between">
								<p className="text-xs text-gray-500 dark:text-gray-400">{t("table.customerName")}</p>
								<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{order?.customerName}
								</p>
							</div>
							<div className="flex items-center justify-between">
								<p className="text-xs text-gray-500 dark:text-gray-400">{t("table.phoneNumber")}</p>
								<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									{order?.phoneNumber}
								</p>
							</div>
						</div>
					</div>

					{/* Confirmation input */}
					<div className="space-y-2">
						<Label className="text-sm text-gray-600 dark:text-slate-300">
							{t("deleteOrder.confirmLabel")}
						</Label>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
							{t("deleteOrder.confirmHint")} <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{order?.orderNumber}</span>
						</p>
						<Input
							value={confirmText}
							onChange={(e) => {
								setConfirmText(e.target.value);
								setError("");
							}}
							placeholder={order?.orderNumber}
							className="rounded-lg h-[45px] bg-white dark:bg-slate-800 border-2"
							autoComplete="off"
						/>
						{error && (
							<p className="text-xs text-red-500 flex items-center gap-1">
								<AlertTriangle size={12} />
								{error}
							</p>
						)}
					</div>

					{/* Action buttons */}
					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={loading}
							className="flex-1 h-[45px]"
						>
							{t("deleteOrder.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={loading || !isConfirmValid}
							className="flex-1 h-[45px] bg-red-600 hover:bg-red-700 text-white"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("deleteOrder.deleting")}
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									{t("deleteOrder.confirm")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}