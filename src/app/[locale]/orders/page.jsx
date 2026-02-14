"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
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
import { Checkbox } from "@/components/ui/checkbox";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Bulk Upload Modal – supports Excel (.xlsx) and calls POST /orders/bulk
function BulkUploadModal({ isOpen, onClose, t }) {
	const [file, setFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [validOrders, setValidOrders] = useState([]);
	const [errors, setErrors] = useState([]);

	const handleDownloadTemplate = async () => {
		try {
			const XLSX = (await import("xlsx")).default;
			const EXAMPLE_ROW = {
				customerName: "أحمد محمد",
				phoneNumber: "501234567",
				city: "الرياض",
				address: "حي الملقا، شارع الأمير سلطان",
				paymentMethod: "cod",
				shippingCost: 20,
				discount: 0,
				notes: "",
				itemsJson: '[{"variantId":1,"quantity":2,"unitPrice":50,"unitCost":40}]',
			};
			const headers = Object.keys(EXAMPLE_ROW);
			const ws = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: headers });
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Orders");
			XLSX.writeFile(wb, "orders_template.xlsx");
			toast.success(t("bulkUpload.templateDownloaded"));
		} catch (e) {
			toast.error(t("bulkUpload.templateError"));
		}
	};

	const parseAndValidate = (rows) => {
		const errs = [];
		const valid = [];
		rows.forEach((r, i) => {
			const rowNum = i + 2;
			if (!r.customerName || !r.phoneNumber || !r.city || !r.paymentMethod) {
				errs.push(`${t("bulkUpload.row")} ${rowNum}: ${t("bulkUpload.requiredFields")}`);
				return;
			}
			let items = [];
			try {
				items = r.itemsJson ? JSON.parse(r.itemsJson) : [];
			} catch (_) {
				errs.push(`${t("bulkUpload.row")} ${rowNum}: itemsJson ${t("bulkUpload.invalidJson")}`);
				return;
			}
			if (!Array.isArray(items) || items.length === 0) {
				errs.push(`${t("bulkUpload.row")} ${rowNum}: ${t("bulkUpload.itemsRequired")}`);
				return;
			}
			valid.push({
				customerName: String(r.customerName).trim(),
				phoneNumber: String(r.phoneNumber).trim(),
				email: r.email ? String(r.email).trim() : undefined,
				city: String(r.city).trim(),
				address: String(r.address || "").trim() || undefined,
				area: r.area ? String(r.area).trim() : undefined,
				paymentMethod: String(r.paymentMethod || "cod").trim(),
				shippingCompany: r.shippingCompany ? String(r.shippingCompany).trim() : undefined,
				shippingCost: Number(r.shippingCost || 0),
				discount: Number(r.discount || 0),
				notes: r.notes ? String(r.notes).trim() : undefined,
				items: items.map((it) => ({
					variantId: Number(it.variantId),
					quantity: Number(it.quantity),
					unitPrice: Number(it.unitPrice),
					unitCost: it.unitCost != null ? Number(it.unitCost) : undefined,
				})),
			});
		});
		return { valid, errors: errs };
	};

	const handleFileChange = async (e) => {
		const f = e?.target?.files?.[0];
		if (!f) return;
		if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
			toast.error(t("bulkUpload.invalidFileType"));
			return;
		}
		setFile(f);
		setValidOrders([]);
		setErrors([]);
		try {
			const XLSX = (await import("xlsx")).default;
			const data = await new Promise((res, rej) => {
				const reader = new FileReader();
				reader.onload = (ev) => {
					try {
						const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
						const ws = wb.Sheets[wb.SheetNames[0]];
						res(XLSX.utils.sheet_to_json(ws, { defval: "" }));
					} catch (err) {
						rej(err);
					}
				};
				reader.onerror = rej;
				reader.readAsArrayBuffer(f);
			});
			const { valid, errors: errs } = parseAndValidate(data);
			setValidOrders(valid);
			setErrors(errs);
			if (errs.length) toast.error(t("bulkUpload.validationErrors"));
			else if (valid.length) toast.success(t("bulkUpload.fileReady", { count: valid.length }));
		} catch (err) {
			toast.error(t("bulkUpload.fileReadFailed"));
		}
	};

	const handleUpload = async () => {
		if (!validOrders.length) {
			toast.error(t("bulkUpload.noValidOrders"));
			return;
		}
		setUploading(true);
		try {
			const res = await api.post("/orders/bulk", { orders: validOrders });
			toast.success(t("bulkUpload.uploadSuccess"), {
				description: `${res.data?.created ?? validOrders.length} ${t("bulkUpload.ordersCreated")}`,
			});
			setFile(null);
			setValidOrders([]);
			setErrors([]);
			onClose();
		} catch (err) {
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
									className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center gap-2"
								>
									<FileSpreadsheet size={18} />
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
										accept=".xlsx,.xls"
										onChange={handleFileChange}
										className="hidden"
									/>
									<label htmlFor="file-upload" className="cursor-pointer">
										<Upload size={48} className="mx-auto mb-4 text-gray-400" />
										<p className="text-sm font-semibold mb-2">
											{file ? `${file.name}${validOrders.length ? ` (${validOrders.length})` : ""}` : t("bulkUpload.dragDrop")}
										</p>
										<p className="text-xs text-gray-500">
											{t("bulkUpload.supportedFormats")} (.xlsx)
										</p>
										{errors.length > 0 && (
											<p className="text-xs text-red-600 mt-2">{errors.length} {t("bulkUpload.validationErrors")}</p>
										)}
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
						disabled={!validOrders.length || uploading}
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
	t,
	searchValue,
	onSearchChange,
	onExport,
	onToggleFilters,
	onToggleDistribution,
	onBulkUpload,
	isFiltersOpen,
}) {
	return (
		<div className="flex items-center justify-between gap-4 flex-wrap">
			<div className="relative w-full md:w-[300px] focus-within:w-full md:focus-within:w-[350px] transition-all duration-300">
				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
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

// Filters Panel – receives stores and employees from parent (loaded from API)
function FiltersPanel({ t, value, onChange, onApply, stores = [], employees = [] }) {
	const [products] = useState([
		{ value: "ring", label: t("filters.products.ring") },
		{ value: "necklace", label: t("filters.products.necklace") },
		{ value: "bracelet", label: t("filters.products.bracelet") },
		{ value: "earring", label: t("filters.products.earring") }
	]);

	const [areas] = useState([
		{ value: "cairo", label: t("filters.areas.cairo") },
		{ value: "alex", label: t("filters.areas.alex") },
		{ value: "giza", label: t("filters.areas.giza") }
	]);

	const [shippingCompanies] = useState([
		{ value: "aramex", label: "أرامكس" },
		{ value: "fedex", label: "فيدكس" },
		{ value: "dhl", label: "DHL" }
	]);

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
								<SelectItem value="new">{t("statuses.new")}</SelectItem>
								<SelectItem value="confirmed">{t("statuses.confirmed")}</SelectItem>
								<SelectItem value="pending_confirmation">{t("statuses.pendingConfirmation")}</SelectItem>
								<SelectItem value="cancelled_shipping">{t("statuses.cancelledShipping")}</SelectItem>
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

					<div className="space-y-2">
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
								<SelectItem value="unassigned">{t("filters.unassigned")}</SelectItem>
								{(employees || []).map((emp) => (
									<SelectItem key={emp.id} value={String(emp.id)}>{emp.name || emp.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

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

					<div className="space-y-2">
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
					</div>

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
								{(stores || []).map((s) => (
									<SelectItem key={s.id} value={String(s.id)}>{s.name || s.label}</SelectItem>
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
								{shippingCompanies.map(company => (
									<SelectItem key={company.value} value={company.value}>{company.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex md:justify-end">
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

// Distribution Modal – assign orders to user via API
function DistributionModal({ isOpen, onClose, orders, employees = [], t, onAssigned }) {
	const [distributionType, setDistributionType] = useState(null);
	const [dateRange, setDateRange] = useState({
		from: new Date().toISOString().split("T")[0],
		to: new Date().toISOString().split("T")[0]
	});
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [selectedEmployee, setSelectedEmployee] = useState("");
	const [selectedOrders, setSelectedOrders] = useState([]);
	const [employeeCount, setEmployeeCount] = useState(3);
	const [assigning, setAssigning] = useState(false);

	const handleDistribute = async () => {
		if (distributionType === "normal") {
			if (!selectedEmployee || selectedOrders.length === 0) {
				toast.error(t("distribution.selectEmployeeAndOrders"));
				return;
			}
			setAssigning(true);
			try {
				for (const orderId of selectedOrders) {
					await api.patch(`/orders/${orderId}/assign`, { userId: Number(selectedEmployee) });
				}
				toast.success(t("distribution.normalSuccess"), {
					count: selectedOrders.length,
					employee: employees.find((e) => String(e.id) === selectedEmployee)?.name || selectedEmployee
				});
				onAssigned?.();
				onClose();
			} catch (err) {
				toast.error(err.response?.data?.message || t("distribution.assignFailed"));
			} finally {
				setAssigning(false);
			}
		} else {
			// Smart: simple round-robin for now
			if (!employees.length || employeeCount < 1) {
				toast.error(t("distribution.selectEmployees"));
				return;
			}
			const toAssign = orders.slice(0, 50);
			const ids = employees.slice(0, Math.min(employeeCount, employees.length)).map((e) => e.id);
			setAssigning(true);
			try {
				for (let i = 0; i < toAssign.length; i++) {
					const orderId = toAssign[i].id;
					const userId = ids[i % ids.length];
					await api.patch(`/orders/${orderId}/assign`, { userId });
				}
				toast.success(t("distribution.smartSuccess", { count: toAssign.length, employees: ids.length }));
				onAssigned?.();
				onClose();
			} catch (err) {
				toast.error(err.response?.data?.message || t("distribution.assignFailed"));
			} finally {
				setAssigning(false);
			}
		}
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
											{(employees || []).map((emp) => (
												<SelectItem key={emp.id} value={String(emp.id)}>
													{emp.name || emp.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label>{t("distribution.selectOrders")} ({(orders || []).length} {t("distribution.available")})</Label>
									<div className="max-h-64 overflow-y-auto border rounded-xl p-4 space-y-2">
										{(orders || []).slice(0, 20).map((order) => (
											<div key={order.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">
												<Checkbox
													checked={selectedOrders.includes(order.id)}
													onCheckedChange={(checked) => {
														if (checked) {
															setSelectedOrders([...selectedOrders, order.id]);
														} else {
															setSelectedOrders(selectedOrders.filter((id) => id !== order.id));
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
										{(employees || []).slice(0, employeeCount).map((emp, idx) => {
											const ordersToAssign = Math.ceil((orders || []).length / employeeCount);
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
						disabled={(distributionType === "normal" && (!selectedEmployee || selectedOrders.length === 0)) || assigning}
					>
						{assigning ? t("distribution.assigning") : distributionType ? t("distribution.distribute") : t("common.cancel")}
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
		product: "all",
		area: "all",
		store: "all",
		shippingCompany: "all",
	});

	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState({
		new: 0,
		underReview: 0,
		preparing: 0,
		ready: 0,
		shipped: 0,
		delivered: 0,
		cancelled: 0,
		returned: 0,
	});
	const [stores, setStores] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 10,
		records: [],
	});

	const fetchStats = () => {
		api.get("/orders/stats").then((res) => {
			setStats((prev) => ({ ...prev, ...res.data }));
		}).catch(() => {});
	};

	const fetchList = (page = pager.current_page, perPage = pager.per_page, filterOverrides = null) => {
		setLoading(true);
		const f = filterOverrides ?? filters;
		const params = {
			page,
			limit: perPage,
			search: search.trim() || undefined,
			status: f.status !== "all" ? f.status : undefined,
			paymentStatus: f.paymentStatus !== "all" ? f.paymentStatus : undefined,
			storeId: f.store && f.store !== "all" ? Number(f.store) : undefined,
			assignedToUserId: f.employee && f.employee !== "all" ? (f.employee === "unassigned" ? "unassigned" : Number(f.employee)) : undefined,
			startDate: f.startDate || undefined,
			endDate: f.endDate || undefined,
		};
		api.get("/orders", { params })
			.then((res) => {
				setPager({
					total_records: res.data.total_records ?? 0,
					current_page: res.data.current_page ?? 1,
					per_page: res.data.per_page ?? 10,
					records: res.data.records ?? [],
				});
			})
			.catch(() => setPager((prev) => ({ ...prev, records: [] })))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchStats();
	}, []);

	useEffect(() => {
		fetchList(pager.current_page, pager.per_page);
	}, [filters, search]);

	useEffect(() => {
		Promise.all([
			api.get("/lookups/stores", { params: { limit: 200 } }).then((r) => setStores(Array.isArray(r.data) ? r.data : [])),
			api.get("/lookups/users", { params: { limit: 100 } }).then((r) => setEmployees(Array.isArray(r.data) ? r.data : [])),
		]).catch(() => {});
	}, []);

	const totalOrders = (stats.new ?? 0) + (stats.underReview ?? 0) + (stats.preparing ?? 0) + (stats.ready ?? 0) + (stats.shipped ?? 0) + (stats.delivered ?? 0) + (stats.cancelled ?? 0) + (stats.returned ?? 0);
	const statsCards = useMemo(
		() => [
			{ title: t("stats.new"), value: String(stats.new ?? 0), icon: Package, bg: "bg-[#E3F2FD] dark:bg-[#0A1220]", iconColor: "text-[#2196F3] dark:text-[#64B5F6]", iconBorder: "border-[#2196F3] dark:border-[#64B5F6]" },
			{ title: t("stats.underReview"), value: String(stats.underReview ?? 0), icon: AlertCircle, bg: "bg-[#FFF3E0] dark:bg-[#1A1108]", iconColor: "text-[#FF9800] dark:text-[#FFB74D]", iconBorder: "border-[#FF9800] dark:border-[#FFB74D]" },
			{ title: t("stats.preparing"), value: String(stats.preparing ?? 0), icon: Package, bg: "bg-[#E0F2F1] dark:bg-[#0A1A18]", iconColor: "text-[#009688] dark:text-[#4DB6AC]", iconBorder: "border-[#009688] dark:border-[#4DB6AC]" },
			{ title: t("stats.ready"), value: String(stats.ready ?? 0), icon: CheckCircle, bg: "bg-[#E8F5E9] dark:bg-[#0E1A0C]", iconColor: "text-[#4CAF50] dark:text-[#81C784]", iconBorder: "border-[#4CAF50] dark:border-[#81C784]" },
			{ title: t("stats.shipped"), value: String(stats.shipped ?? 0), icon: Truck, bg: "bg-[#E1F5FE] dark:bg-[#0A1820]", iconColor: "text-[#03A9F4] dark:text-[#4FC3F7]", iconBorder: "border-[#03A9F4] dark:border-[#4FC3F7]" },
			{ title: t("stats.delivered"), value: String(stats.delivered ?? 0), icon: CheckCircle, bg: "bg-[#E8F5E9] dark:bg-[#0E1A0C]", iconColor: "text-[#4CAF50] dark:text-[#81C784]", iconBorder: "border-[#4CAF50] dark:border-[#81C784]" },
			{ title: t("stats.cancelled"), value: String(stats.cancelled ?? 0), icon: XCircle, bg: "bg-[#FFEBEE] dark:bg-[#1F0A0A]", iconColor: "text-[#F44336] dark:text-[#EF5350]", iconBorder: "border-[#F44336] dark:border-[#EF5350]" },
			{ title: t("stats.returned"), value: String(stats.returned ?? 0), icon: RefreshCw, bg: "bg-[#FFF8E1] dark:bg-[#1A1608]", iconColor: "text-[#FFC107] dark:text-[#FFD54F]", iconBorder: "border-[#FFC107] dark:border-[#FFD54F]" },
			{ title: t("stats.total"), value: String(totalOrders), icon: TrendingUp, bg: "bg-[#F3E5F5] dark:bg-[#1A0E1F]", iconColor: "text-[#9C27B0] dark:text-[#BA68C8]", iconBorder: "border-[#9C27B0] dark:border-[#BA68C8]" },
		],
		[t, stats]
	);

	const handlePageChange = ({ page, per_page }) => {
		setPager((prev) => ({ ...prev, current_page: page, per_page }));
		fetchList(page, per_page);
	};

	const applyFilters = () => {
		fetchList(1, pager.per_page);
		toast.success(t("messages.filtersApplied"));
	};

	const employeeMap = useMemo(() => {
		const m = {};
		(employees || []).forEach((e) => { m[e.id] = e.name || e.label; });
		return m;
	}, [employees]);

	const handleExport = () => {
		toast.success(t("messages.exportStarted"));
	};

	const getStatusBadge = (status) => {
		const styles = {
			new: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
			under_review: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
			preparing: "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
			ready: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
			shipped: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
			delivered: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
			cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
			returned: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
		};
		return styles[status] || styles.new;
	};

	const handleStatusChange = async (orderId, newStatus) => {
		try {
			await api.patch(`/orders/${orderId}/status`, { status: newStatus });
			toast.success(t("messages.statusUpdated"));
			fetchList(pager.current_page, pager.per_page);
			fetchStats();
		} catch (err) {
			toast.error(err.response?.data?.message || t("messages.statusUpdateFailed"));
		}
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
			{
				key: "assignedEmployee",
				header: t("table.assignedEmployee"),
				cell: (row) => (
					<span className="text-gray-700 dark:text-slate-200">
						{row.assignedToUserId ? (employeeMap[row.assignedToUserId] ?? row.assignedToUserId) : t("table.notAssigned")}
					</span>
				),
			},
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
						{(row.items || []).map((item, i) => (
							<div key={i}>
								{item.variant?.product?.name || item.variant?.sku || "-"} (x{item.quantity})
							</div>
						))}
					</div>
				),
			},
			{
				key: "shippingCost",
				header: t("table.shippingCost"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{row.shippingCost ?? 0} {t("currency")}
					</span>
				),
			},
			{
				key: "status",
				header: t("table.status"),
				cell: (row) => (
					<Badge className={cn("rounded-md", getStatusBadge(row.status))}>
						{t(`statuses.${row.status}`)}
					</Badge>
				),
			},
			{
				key: "confirmStatus",
				header: t("table.confirmOrder"),
				cell: (row) => (
					<Select value={row.status} onValueChange={(v) => handleStatusChange(row.id, v)}>
						<SelectTrigger className="w-[150px] h-8">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="new">{t("statuses.new")}</SelectItem>
							<SelectItem value="under_review">{t("statuses.underReview")}</SelectItem>
							<SelectItem value="preparing">{t("statuses.preparing")}</SelectItem>
							<SelectItem value="ready">{t("statuses.ready")}</SelectItem>
							<SelectItem value="shipped">{t("statuses.shipped")}</SelectItem>
							<SelectItem value="delivered">{t("statuses.delivered")}</SelectItem>
							<SelectItem value="cancelled">{t("statuses.cancelled")}</SelectItem>
							<SelectItem value="returned">{t("statuses.returned")}</SelectItem>
						</SelectContent>
					</Select>
				),
			},
			{
				key: "trackingCode",
				header: t("table.trackingCode"),
				cell: (row) => (
					<span className="font-mono text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
						{row.trackingNumber || "—"}
					</span>
				),
			},
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
					<span className="text-sm">{row.shippingCompany || "-"}</span>
				),
			},
			{
				key: "finalTotal",
				header: t("table.finalTotal"),
				cell: (row) => (
					<span className="text-sm font-semibold text-green-600">
						{row.finalTotal ?? 0} {t("currency")}
					</span>
				),
			},
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
								onClick={() => router.push(`/orders/show/${row.id}`)}
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
							<DropdownMenuItem className="flex items-center gap-2 text-red-600">
								<Trash2 size={16} />
								{t("actions.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		];
	}, [t, router, employeeMap, handleStatusChange]);

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
					{statsCards.map((stat, index) => (
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

			<div className="bg-card rounded-sm">
				<OrdersTableToolbar
					t={t}
					searchValue={search}
					onSearchChange={setSearch}
					onExport={handleExport}
					isFiltersOpen={filtersOpen}
					onToggleFilters={() => setFiltersOpen((v) => !v)}
					onToggleDistribution={() => setDistributionOpen(true)}
					onBulkUpload={() => setBulkUploadOpen(true)}
				/>

				<AnimatePresence>
					{filtersOpen && (
						<FiltersPanel
							t={t}
							value={filters}
							onChange={setFilters}
							onApply={applyFilters}
							stores={stores}
							employees={employees}
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
						loading={loading}
					/>
				</div>
			</div>

			<DistributionModal
				isOpen={distributionOpen}
				onClose={() => setDistributionOpen(false)}
				orders={pager.records}
				employees={employees}
				t={t}
				onAssigned={() => { fetchList(pager.current_page, pager.per_page); fetchStats(); }}
			/>


			<GlobalRetrySettingsModal
				isOpen={retrySettingsOpen}
				onClose={() => setRetrySettingsOpen(false)}
				t={t}
			/>

			<BulkUploadModal
				isOpen={bulkUploadOpen}
				onClose={() => setBulkUploadOpen(false)}
				t={t}
			/>
		</div>
	);
}



// Global Retry Settings Modal
function GlobalRetrySettingsModal({ isOpen, onClose, t }) {
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