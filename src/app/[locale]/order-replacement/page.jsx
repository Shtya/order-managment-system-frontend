"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Package,
	ChevronLeft,
	FileDown,
	Search as SearchIcon,
	Loader2,
	Filter,
	ChevronDown,
	X,
	Calendar,
	Info,
	AlertCircle,
	Truck,
	ClipboardList,
	User,
	Phone,
	MapPin,
	Plus,
	DollarSign,
	Image as ImageIcon,
	FileText,
	Upload,
	RefreshCw,
	CheckCircle2,
	ArrowUpDown,
	Eye,
	Printer,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

import DataTable from "@/components/atoms/DataTable";
import Button_ from "@/components/atoms/Button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";
import { Link } from "@/i18n/navigation";

// ==================== CONSTANTS ====================
const DELIVERY_STATUS = {
	DELIVERED: "DELIVERED",
	IN_DELIVERY: "IN_DELIVERY",
	NOT_DELIVERED: "NOT_DELIVERED",
};

const ORDER_STATUS = {
	READY_TO_SHIP: "READY_TO_SHIP",
	IN_PREPARATION: "IN_PREPARATION",
	IN_PROCESS: "IN_PROCESS",
	RETURNED_SCANNED: "RETURNED_SCANNED",
};

const carriers = [
	{ value: "turbo", label: "تربو" },
	{ value: "aramex", label: "أرامكس" },
	{ value: "smsa", label: "SMSA" },
	{ value: "dhl", label: "DHL" },
	{ value: "imail", label: "آي ميل" },
	{ value: "gt", label: "GT" },
];

const replacementReasons = [
	{ value: "color_change", label: "تغير لون" },
	{ value: "size_change", label: "تغير مقاس" },
	{ value: "model_change", label: "تغير موديل" },
	{ value: "wrong_warehouse", label: "وصل خطأ من المخزن" },
	{ value: "other", label: "سبب آخر" },
];

// ==================== DUMMY DATA ====================
const initialReplacements = [
	{
		id: "EX-1023",
		originalOrderCode: "SRF56",
		customer: "يسرا علام",
		phone: "01002766992",
		replacedProducts: [
			{ name: "وعاء طعام", image: "/product1.jpg", quantity: 2 },
		],
		reason: "تغير لون",
		orderDate: "2025-02-17",
		cod: 20,
		deliveryStatus: DELIVERY_STATUS.DELIVERED,
	},
	{
		id: "EX-1024",
		originalOrderCode: "SRF56",
		customer: "يسرا علام",
		phone: "01002766992",
		replacedProducts: [
			{ name: "وعاء طعام", image: "/product1.jpg", quantity: 4 },
		],
		reason: "تغير مقاس",
		orderDate: "2025-02-16",
		cod: 20,
		deliveryStatus: DELIVERY_STATUS.IN_DELIVERY,
	},
	{
		id: "EX-1025",
		originalOrderCode: "SRF56",
		customer: "يسرا علام",
		phone: "01002766992",
		replacedProducts: [
			{ name: "وعاء طعام", image: "/product1.jpg", quantity: 1 },
		],
		reason: "وصل خطأ من المخزن",
		orderDate: "2025-02-15",
		cod: 20,
		deliveryStatus: DELIVERY_STATUS.NOT_DELIVERED,
	},
];

const initialStatusLogs = [
	{
		id: 1,
		orderCode: "SRF56",
		customer: "يسرا علام",
		employee: "نور صالح",
		status: ORDER_STATUS.READY_TO_SHIP,
		trackingNumber: "qet12344578",
		date: "17-6-2025",
	},
	{
		id: 2,
		orderCode: "SRF56",
		customer: "يسرا علام",
		employee: "نور صالح",
		status: ORDER_STATUS.RETURNED_SCANNED,
		trackingNumber: "qet12344578",
		date: "17-6-2025",
	},
	{
		id: 3,
		orderCode: "SRF56",
		customer: "يسرا علام",
		employee: "نور صالح",
		status: ORDER_STATUS.IN_PREPARATION,
		trackingNumber: "qet12344578",
		date: "17-6-2025",
	},
];

// ==================== UTILITY FUNCTION ====================
function makeId() {
	return Math.random().toString(36).substring(2, 15);
}

// ==================== IMAGE UPLOAD COMPONENT ====================
function ImageUploadBox({ t, title, files, onFilesChange, onRemove }) {
	const inputRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);

	const addFiles = useCallback(
		(picked) => {
			const next = picked.map((file) => ({
				id: makeId(),
				file,
				previewUrl: file.type.startsWith("image/")
					? URL.createObjectURL(file)
					: undefined,
				isFromLibrary: false,
				isExisting: false,
			}));
			onFilesChange([...(files ?? []), ...next]);
		},
		[files, onFilesChange]
	);

	const onPick = (e) => {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;
		addFiles(picked);
		e.target.value = "";
	};

	const removeFile = (id) => {
		const target = (files ?? []).find((f) => f.id === id);

		if (onRemove) {
			onRemove(target);
		}

		if (
			target?.previewUrl &&
			!target.isFromLibrary &&
			!target.isExisting
		) {
			URL.revokeObjectURL(target.previewUrl);
		}
		onFilesChange((files ?? []).filter((f) => f.id !== id));
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const picked = Array.from(e.dataTransfer.files ?? []);
		if (!picked.length) return;
		addFiles(picked);
	};

	const prettyExt = (name) => {
		const ext = name?.split(".").pop()?.toUpperCase();
		return ext && ext !== name?.toUpperCase() ? ext : "FILE";
	};

	const isImage = (f) =>
		f?.file?.type?.startsWith?.("image/")
			? true
			: !!f?.isFromLibrary || !!f?.isExisting;

	const getImageUrl = (f) => {
		if (f.isExisting || f.isFromLibrary) {
			return f.url.startsWith("http") ? f.url : f.url;
		}
		return f.previewUrl;
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.2 }}
			className="bg-card rounded-2xl shadow-sm p-6"
		>
			<h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-4 text-right flex items-center gap-2">
				<div className="w-1 h-5 bg-primary rounded-full" />
				{title}
			</h3>

			<div
				onDragEnter={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(true);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(false);
				}}
				onDrop={handleDrop}
				className={cn(
					"rounded-2xl border-2 border-dashed p-8 text-center transition-all",
					isDragging
						? "border-primary bg-primary/5 scale-[1.02]"
						: "border-primary/60 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/20 dark:to-slate-800/20"
				)}
			>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					multiple
					className="hidden"
					onChange={onPick}
				/>

				<div className="flex flex-col items-center gap-4">
					<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg">
						<Upload className="w-10 h-10 text-primary" />
					</div>

					<div className="space-y-2">
						<p className="text-xl font-bold text-slate-900 dark:text-slate-100">
							{t("dragHere")}
						</p>
						<div className="flex items-center justify-center gap-3 text-sm text-slate-400">
							<span className="h-px w-24 bg-slate-200 dark:bg-slate-700" />
							<span>{t("or")}</span>
							<span className="h-px w-24 bg-slate-200 dark:bg-slate-700" />
						</div>
					</div>

					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							className="rounded-xl px-8 border-primary/60 text-primary hover:bg-primary/10"
							onClick={() => inputRef.current?.click()}
						>
							{t("attach")}
						</Button>
					</div>
				</div>
			</div>

			<div className="mt-5 space-y-3">
				{(files ?? []).map((f) => (
					<div
						key={f.id}
						className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 p-4 hover:border-primary/50 transition-all"
					>
						<button
							type="button"
							onClick={() => removeFile(f.id)}
							className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
							aria-label={t("remove")}
						>
							<X className="h-5 w-5" />
						</button>

						<div className="flex-1 text-right">
							<div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
								{f.isExisting
									? t("existingImage")
									: f.isFromLibrary
										? t("fromLibrary")
										: (f?.file?.name || "").slice(0, 20)}
							</div>
							<div className="text-xs text-slate-400">
								{f.isFromLibrary || f.isExisting
									? t("fromLibrary")
									: `${((f?.file?.size || 0) / 1024).toFixed(1)} KB`}
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Badge className="rounded-lg bg-primary/15 text-primary border border-primary/20 font-semibold">
								{prettyExt(f?.file?.name || "IMG")}
							</Badge>

							<div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
								{isImage(f) && getImageUrl(f) ? (
									<img
										src={getImageUrl(f)}
										alt={f?.file?.name || "image"}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="text-slate-500">
										{f?.file?.type?.includes?.("image") ? (
											<ImageIcon className="h-6 w-6" />
										) : (
											<FileText className="h-6 w-6" />
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</motion.div>
	);
}

// ==================== STATUS PILLS ====================
function DeliveryStatusPill({ value }) {
	const t = useTranslations("replacement.deliveryStatus");

	const statusMap = {
		[DELIVERY_STATUS.DELIVERED]: {
			label: t("delivered"),
			cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/40",
		},
		[DELIVERY_STATUS.IN_DELIVERY]: {
			label: t("inDelivery"),
			cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/40",
		},
		[DELIVERY_STATUS.NOT_DELIVERED]: {
			label: t("notDelivered"),
			cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/40",
		},
	};

	const item =
		statusMap[value] ||
		{
			label: String(value || "—"),
			cls: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-slate-200 dark:border-white/10",
		};

	return (
		<span
			className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border font-medium ${item.cls}`}
		>
			{item.label}
		</span>
	);
}

function OrderStatusPill({ value }) {
	const t = useTranslations("replacement.orderStatus");

	const statusMap = {
		[ORDER_STATUS.READY_TO_SHIP]: {
			label: t("readyToShip"),
			cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/40",
		},
		[ORDER_STATUS.IN_PREPARATION]: {
			label: t("inPreparation"),
			cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/40",
		},
		[ORDER_STATUS.IN_PROCESS]: {
			label: t("inProcess"),
			cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/40",
		},
		[ORDER_STATUS.RETURNED_SCANNED]: {
			label: t("returnedScanned"),
			cls: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-900/40",
		},
	};

	const item =
		statusMap[value] ||
		{
			label: String(value || "—"),
			cls: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-slate-200 dark:border-white/10",
		};

	return (
		<span
			className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border font-medium ${item.cls}`}
		>
			{item.label}
		</span>
	);
}

// ==================== CREATE REPLACEMENT DIALOG ====================

function CreateReplacementDialog({ open, onClose, onCreate }) {
	const t = useTranslations("replacement.createDialog");
	const tCommon = useTranslations("replacement.common");

	// State
	const [orderCode, setOrderCode] = useState("");
	const [orderData, setOrderData] = useState(null);
	const [loadingOrder, setLoadingOrder] = useState(false);

	const [reason, setReason] = useState("");
	const [otherReason, setOtherReason] = useState("");
	const [carrier, setCarrier] = useState("");
	const [uploadedFiles, setUploadedFiles] = useState([]);
	const [selectedProducts, setSelectedProducts] = useState([]);
	const [replacementProducts, setReplacementProducts] = useState([]);
	const [shippingCost, setShippingCost] = useState(50);
	const [shippingPaidBy, setShippingPaidBy] = useState("customer"); // customer or company

	const [loading, setLoading] = useState(false);

	// Reset form
	const resetForm = () => {
		setOrderCode("");
		setOrderData(null);
		setReason("");
		setOtherReason("");
		setCarrier("");
		setUploadedFiles([]);
		setSelectedProducts([]);
		setReplacementProducts([]);
		setShippingCost(50);
		setShippingPaidBy("customer");
	};

	// Fetch order data
	const fetchOrderData = async () => {
		if (!orderCode.trim()) return;

		setLoadingOrder(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Mock data
			setOrderData({
				code: orderCode,
				status: "مدفوع",
				totalPaid: 1000,
				address: "الرياض، شارع ال سعود",
				phone: "0100337765",
				customer: "يسرا علام",
				products: [
					{
						id: 1,
						image: "/product1.jpg",
						name: "وعاء طعام",
						unitCost: 20,
						quantity: 4,
						total: 300,
					},
					{
						id: 2,
						image: "/product2.jpg",
						name: "وعاء طعام",
						unitCost: 20,
						quantity: 4,
						total: 300,
					},
					{
						id: 3,
						image: "/product3.jpg",
						name: "وعاء طعام",
						unitCost: 20,
						quantity: 4,
						total: 300,
					},
				],
			});
		} catch (error) {
			alert(t("orderNotFound"));
		} finally {
			setLoadingOrder(false);
		}
	};

	// Handle product selection
	const handleSelectSku = (sku) => {
		if (selectedProducts.find((p) => p.id === sku.id)) {
			return;
		}

		setSelectedProducts([...selectedProducts, sku]);
		setReplacementProducts([
			...replacementProducts,
			{
				id: makeId(),
				originalSku: sku,
				replacementSku: null,
				quantity: 1,
				price: 0,
			},
		]);
	};

	// Update replacement product
	const updateReplacementProduct = (id, field, value) => {
		setReplacementProducts(
			replacementProducts.map((p) =>
				p.id === id ? { ...p, [field]: value } : p
			)
		);
	};

	// Remove replacement product
	const removeReplacementProduct = (id) => {
		const product = replacementProducts.find((p) => p.id === id);
		setSelectedProducts(
			selectedProducts.filter((p) => p.id !== product.originalSku.id)
		);
		setReplacementProducts(
			replacementProducts.filter((p) => p.id !== id)
		);
	};

	// Financial calculations
	const financialSummary = useMemo(() => {
		const replacedCount = replacementProducts.length;
		const previousTotal = orderData?.totalPaid || 0;
		const currentTotal = replacementProducts.reduce(
			(sum, p) => sum + (p.price || 0) * (p.quantity || 1),
			0
		);
		const difference = currentTotal - previousTotal;
		const customerBalance =
			difference + (shippingPaidBy === "customer" ? shippingCost : 0);

		return {
			replacedCount,
			previousTotal,
			currentTotal,
			difference,
			shippingCost,
			customerBalance,
		};
	}, [replacementProducts, orderData, shippingCost, shippingPaidBy]);

	// Handle save
	const handleSave = async () => {
		// Validation
		if (!orderData) {
			alert(t("validation.orderRequired"));
			return;
		}
		if (!reason) {
			alert(t("validation.reasonRequired"));
			return;
		}
		if (!carrier) {
			alert(t("validation.carrierRequired"));
			return;
		}
		if (uploadedFiles.length === 0) {
			alert(t("validation.imagesRequired"));
			return;
		}
		if (replacementProducts.length === 0) {
			alert(t("validation.productsRequired"));
			return;
		}

		setLoading(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			onCreate({
				orderCode: orderData.code,
				reason,
				otherReason,
				carrier,
				images: uploadedFiles,
				replacementProducts,
				financialSummary,
			});

			resetForm();
			onClose();
		} finally {
			setLoading(false);
		}
	};

	const locale = useLocale();
	const isRtl = locale === "ar"; // boolean


	return (
		<AnimatePresence>

			<>
				<div
					key="backdrop"
					className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm ${open ? "opacity-100" : "pointer-events-none"} opacity-0 `}
					onClick={() => { resetForm(); onClose(); }}
				/>

				<div
					key="panel"
					style={{transition : ".4s"}}
					className={cn(
						`  ${open ? "rtl:left-0 ltr:right-0 " : " ltr:-right-full rtl:-left-full"} duration-300 `,
						"fixed inset-y-0 z-50 w-full max-w-5xl shadow-2xl overflow-y-auto bg-background")}
				>



					{/* ── Panel header ── */}
					<div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-[#182337] border-b border-slate-200 dark:border-slate-800">
						<div className="flex items-center gap-2">
							<Package size={20} className="text-[var(--primary)]" />
							<h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
								{t("title")}
							</h2>
						</div>
						<button
							onClick={() => { resetForm(); onClose(); }}
							className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
						>
							<X size={20} />
						</button>
					</div>

					<div className="p-6 space-y-5">

						{/* ══════════════════════════════════
							    SECTION 1 – رقم الطلب
							══════════════════════════════════ */}
						<div className="bg-white dark:bg-[#182337] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
							{/* label row */}
							<div className="px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
								<p className="text-sm font-bold text-slate-800 dark:text-slate-100 text-end">
									{t("orderCode")}
								</p>
							</div>

							{/* input row */}
							<div className="px-5 py-4 flex gap-3">
								<Button
									onClick={fetchOrderData}
									disabled={loadingOrder || !orderCode.trim()}
									className="btn-primary1 shrink-0 h-11 rounded-xl text-white px-5"
								>
									{loadingOrder
										? <Loader2 className="w-4 h-4 animate-spin" />
										: t("fetchOrder")}
								</Button>
								<Input
									value={orderCode}
									onChange={(e) => setOrderCode(e.target.value)}
									placeholder={t("orderCodePlaceholder")}
									className="flex-1 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-end"
									onKeyDown={(e) => e.key === "Enter" && fetchOrderData()}
								/>
							</div>
						</div>

						{/* ══════════════════════════════════
							    SECTION 2 – بيانات الطلب  (shown after fetch)
							══════════════════════════════════ */}
						{orderData && (
							<>
								<div className="bg-white dark:bg-[#182337] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
									{/* section title */}
									<div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
										<button
											onClick={() => { setOrderData(null); setOrderCode(""); }}
											className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
										>
											<RefreshCw size={12} />
											{t("changeOrder")}
										</button>
										<p className="text-sm font-bold text-slate-800 dark:text-slate-100">
											{t("orderInfo")}
										</p>
									</div>

									{/* customer/order chips row – matching the screenshot */}
									<div className="px-5 py-4">
										<div className="flex flex-wrap gap-3 justify-end">
											{/* حالة الطلب */}
											<div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
												<span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
													{t("status")} : {orderData.status}
												</span>
											</div>

											{/* المبلغ المدفوع */}
											<div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
												<span className="text-xs font-bold text-slate-800 dark:text-slate-100">
													{t("totalPaid")} : {orderData.totalPaid}
												</span>
											</div>

											{/* العنوان */}
											<div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
												<span className="text-xs text-slate-700 dark:text-slate-300">
													{t("address")} : {orderData.address}
												</span>
											</div>

											{/* رقم الهاتف */}
											<div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
												<span className="text-xs font-mono text-[var(--primary)]">
													{t("phone")} : {orderData.phone}
												</span>
											</div>

											{/* اسم العميل */}
											<div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
												<span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
													{t("customer")} : {orderData.customer}
												</span>
											</div>
										</div>
									</div>

									{/* ── Products sub-section ── */}
									<div className="border-t border-slate-100 dark:border-slate-800">
										<div className="px-5 py-3 text-end">
											<p className="text-sm font-bold text-slate-800 dark:text-slate-100">
												{t("productsTable")}
											</p>
										</div>
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead>
													<tr className="bg-slate-50 dark:bg-slate-900/50">
														<th className="text-end py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{t("productTotal")}</th>
														<th className="text-end py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{t("quantity")}</th>
														<th className="text-end py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{t("unitCost")}</th>
														<th className="text-end py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{t("productName")}</th>
														<th className="text-end py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{t("productImage")}</th>
													</tr>
												</thead>
												<tbody>
													{orderData.products.map((product, idx) => (
														<tr
															key={product.id}
															className={cn(
																"border-t border-slate-100 dark:border-slate-800",
																idx % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/20"
															)}
														>
															<td className="py-3 px-4 text-end font-mono text-sm text-slate-700 dark:text-slate-300">
																{product.total} {tCommon("currency")}
															</td>
															<td className="py-3 px-4 text-end">
																<span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300">
																	{product.quantity}
																</span>
															</td>
															<td className="py-3 px-4 text-end font-mono text-sm text-slate-700 dark:text-slate-300">
																{product.unitCost} {tCommon("currency")}
															</td>
															<td className="py-3 px-4 text-end text-sm text-slate-700 dark:text-slate-300">
																{product.name}
															</td>
															<td className="py-3 px-4 text-end">
																<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center ms-auto border border-slate-200 dark:border-slate-700">
																	<ImageIcon size={16} className="text-amber-500" />
																</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>

								{/* ══════════════════════════════════
									    SECTION 3 – Reason / Carrier
									══════════════════════════════════ */}
								<div className="bg-white dark:bg-[#182337] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
									<div className="divide-y divide-slate-100 dark:divide-slate-800">
										{/* سبب الاستبدال */}
										<div className="px-5 py-4 space-y-2">
											<p className="text-sm font-bold text-slate-800 dark:text-slate-100 text-end">
												{t("replacementReason")}
											</p>
											<Select value={reason} onValueChange={setReason}>
												<SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-end">
													<SelectValue placeholder={t("replacementReasonPlaceholder")} />
												</SelectTrigger>
												<SelectContent>
													{replacementReasons.map((r) => (
														<SelectItem key={r.value} value={r.value}>
															{r.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										{/* سبب آخر */}
										<div className="px-5 py-4 space-y-2">
											<p className="text-sm font-bold text-slate-800 dark:text-slate-100 text-end">
												{t("otherReason")}
											</p>
											<Input
												value={otherReason}
												onChange={(e) => setOtherReason(e.target.value)}
												placeholder={t("otherReasonPlaceholder")}
												className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-end"
											/>
										</div>

										{/* شركة الشحن */}
										<div className="px-5 py-4 space-y-2">
											<p className="text-sm font-bold text-slate-800 dark:text-slate-100 text-end">
												{t("selectCarrier")}
											</p>
											<Select value={carrier} onValueChange={setCarrier}>
												<SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-end">
													<SelectValue placeholder={t("selectCarrierPlaceholder")} />
												</SelectTrigger>
												<SelectContent>
													{carriers.map((c) => (
														<SelectItem key={c.value} value={c.value}>
															<div className="flex items-center gap-2">
																<Truck size={14} />
																{c.label}
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>

								{/* ══════════════════════════════════
									    SECTION 4 – Upload + Product search (2-col like screenshot)
									══════════════════════════════════ */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									{/* Left col – image upload */}
									<div className="bg-white dark:bg-[#182337] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
										<div className="px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-end">
											<p className="text-sm font-bold text-slate-800 dark:text-slate-100">
												{t("uploadImages")}
											</p>
										</div>
										<div className="p-4">
											<ImageUploadBox
												t={t}
												title=""
												files={uploadedFiles}
												onFilesChange={setUploadedFiles}
											/>
										</div>
									</div>

									{/* Right col – product search + replacement rows */}
									<div className="bg-white dark:bg-[#182337] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
										<div className="px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-end">
											<p className="text-sm font-bold text-slate-800 dark:text-slate-100">
												{t("selectProducts")}
											</p>
										</div>

										{/* selected tags */}
										{selectedProducts.length > 0 && (
											<div className="px-5 pt-3 flex flex-wrap gap-2 justify-end">
												{selectedProducts.map((sp) => (
													<Badge
														key={sp.id}
														className="px-3 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 gap-1.5"
													>
														{sp.label || sp.sku}
														<button
															onClick={() => {
																setSelectedProducts(selectedProducts.filter(p => p.id !== sp.id));
																setReplacementProducts(replacementProducts.filter(p => p.originalSku.id !== sp.id));
															}}
															className="hover:text-red-500 transition-colors"
														>
															<X size={12} />
														</button>
													</Badge>
												))}
											</div>
										)}

										<div className="p-4">
											<ProductSkuSearchPopover
												handleSelectSku={handleSelectSku}
												selectedSkus={selectedProducts}
												closeOnSelect={false}
											/>
										</div>

										{/* replacement product rows */}
										{replacementProducts.map((rp) => (
											<div
												key={rp.id}
												className="border-t border-slate-100 dark:border-slate-800"
											>
												{/* منتج label + delete icon */}
												<div className="flex items-center justify-between px-5 py-3">
													<button
														onClick={() => removeReplacementProduct(rp.id)}
														className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors"
													>
														<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
															<path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
															<path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6L18.2 20.2C18.1444 20.7168 17.8949 21.1941 17.5011 21.5321C17.1073 21.8701 16.5972 22.0438 16.08 22H7.92C7.40281 22.0438 6.89271 21.8701 6.49891 21.5321C6.10511 21.1941 5.85556 20.7168 5.8 20.2L5 6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
														</svg>
													</button>
													<p className="text-xs font-bold text-slate-500 dark:text-slate-400">
														{t("productCategory")}: <span className="text-slate-800 dark:text-slate-100">{rp.originalSku?.label || "—"}</span>
													</p>
												</div>

												{/* المنتج البديل / الكمية / السعر */}
												<div className="px-5 pb-4 space-y-3">
													<div className="grid grid-cols-3 gap-2 text-end text-xs font-semibold text-slate-500 dark:text-slate-400">
														<span>{t("price")}</span>
														<span>{t("quantityLabel")}</span>
														<span>{t("replacementProduct")}</span>
													</div>
													<div className="grid grid-cols-3 gap-2">
														<Input
															type="number"
															min="0"
															value={rp.price}
															onChange={(e) => updateReplacementProduct(rp.id, "price", parseFloat(e.target.value) || 0)}
															className="h-10 rounded-xl text-end bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
														/>
														<Input
															type="number"
															min="1"
															value={rp.quantity}
															onChange={(e) => updateReplacementProduct(rp.id, "quantity", parseInt(e.target.value) || 1)}
															className="h-10 rounded-xl text-end bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
														/>
														<div className="relative">
															{rp.replacementSku ? (
																<Badge className="h-10 w-full rounded-xl flex items-center justify-center gap-1.5 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
																	{rp.replacementSku.label || rp.replacementSku.sku}
																	<button onClick={() => updateReplacementProduct(rp.id, "replacementSku", null)}>
																		<X size={12} />
																	</button>
																</Badge>
															) : (
																<ProductSkuSearchPopover
																	handleSelectSku={(sku) => updateReplacementProduct(rp.id, "replacementSku", sku)}
																	selectedSkus={rp.replacementSku ? [rp.replacementSku] : []}
																	closeOnSelect={true}
																/>
															)}
														</div>
													</div>

													{/* price comparison row */}
													{rp.replacementSku && (
														<div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
															<div className="grid grid-cols-4 gap-2 text-xs">
																<div className="text-end">
																	<p className="text-slate-400 mb-1">{t("priceDifference")}</p>
																	<p className={cn("font-bold", rp.price * rp.quantity - 99 > 0 ? "text-red-500" : "text-emerald-500")}>
																		{Math.abs(rp.price * rp.quantity - 99)} {tCommon("currency")}
																	</p>
																</div>
																<div className="text-end">
																	<p className="text-slate-400 mb-1">{t("newPrice")}</p>
																	<p className="font-bold text-slate-800 dark:text-slate-100">{rp.price * rp.quantity} {tCommon("currency")}</p>
																</div>
																<div className="text-end">
																	<p className="text-slate-400 mb-1">{t("oldPrice")}</p>
																	<p className="font-bold text-slate-800 dark:text-slate-100">300 {tCommon("currency")}</p>
																</div>
																<div className="text-end">
																	<p className="text-slate-400 mb-1">{t("quantityLabel")}</p>
																	<p className="font-bold text-slate-800 dark:text-slate-100">{rp.quantity}</p>
																</div>
															</div>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								</div>

								{/* ══════════════════════════════════
									    SECTION 5 – الملخص (Summary sidebar style)
									══════════════════════════════════ */}
								<div className="bg-white dark:bg-[#182337] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
									<div className="px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-end">
										<p className="text-sm font-bold text-slate-800 dark:text-slate-100">
											{t("summary")}
										</p>
									</div>
									<div className="p-5 space-y-3">
										{[
											{
												label: t("replacedCount"),
												value: String(financialSummary.replacedCount),
												color: "",
											},
											{
												label: t("previousTotal"),
												value: `${financialSummary.previousTotal} ${tCommon("currency")}`,
												color: "text-[var(--primary)]",
											},
											{
												label: t("currentTotal"),
												value: `${financialSummary.currentTotal} ${tCommon("currency")}`,
												color: "",
											},
											{
												label: t("costDifference"),
												value: `${Math.abs(financialSummary.difference)} ${tCommon("currency")}`,
												color: financialSummary.difference > 0 ? "text-red-500" : "text-emerald-500",
											},
										].map((item, idx) => (
											<div key={idx} className="flex items-center justify-between">
												<span className={cn("text-sm font-semibold", item.color || "text-slate-800 dark:text-slate-100")}>
													{item.value}
												</span>
												<span className="text-xs text-slate-400 dark:text-slate-500">
													{item.label}
												</span>
											</div>
										))}

										{/* Shipping cost row with select */}
										<div className="flex items-center justify-between pt-1">
											<div className="flex items-center gap-2">
												<Select value={shippingPaidBy} onValueChange={setShippingPaidBy}>
													<SelectTrigger className="h-8 rounded-lg text-xs w-[110px] bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="customer">{t("paidByCustomer")}</SelectItem>
														<SelectItem value="company">{t("paidByCompany")}</SelectItem>
													</SelectContent>
												</Select>
												<Input
													type="number"
													min="0"
													value={shippingCost}
													onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
													className="h-8 w-20 rounded-lg text-xs text-end bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
												/>
											</div>
											<span className="text-xs text-slate-400 dark:text-slate-500">
												{t("shippingCostLabel")}
											</span>
										</div>

										{financialSummary.customerBalance !== 0 && (
											<div className={cn(
												"mt-2 p-3 rounded-xl flex items-center justify-between",
												financialSummary.customerBalance > 0
													? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40"
													: "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40"
											)}>
												<span className={cn("text-sm font-bold", financialSummary.customerBalance > 0 ? "text-red-600" : "text-emerald-600")}>
													{Math.abs(financialSummary.customerBalance)} {tCommon("currency")}
												</span>
												<span className="text-xs text-slate-500 dark:text-slate-400">
													{financialSummary.customerBalance > 0 ? t("customerOwes") : t("customerBalance")}
												</span>
											</div>
										)}
									</div>
								</div>
							</>
						)}
					</div>

					{/* ── Sticky footer ── */}
					<div className="sticky bottom-0 z-10 flex items-center justify-start gap-3 px-6 py-4 bg-white dark:bg-[#182337] border-t border-slate-200 dark:border-slate-800">
						<Button_
							label={loading ? t("saving") : t("save")}
							tone="purple"
							variant="solid"
							onClick={handleSave}
							disabled={loading || !orderData}
						/>
						<Button_
							label={tCommon("cancel")}
							tone="gray"
							variant="outline"
							onClick={() => { resetForm(); onClose(); }}
							disabled={loading}
						/>
					</div>
				</div>
			</>

		</AnimatePresence>
	);
}

// ==================== STATUS LOG TAB ====================
function StatusLogTab({ statusLogs }) {
	const t = useTranslations("replacement.statusLog");
	const [filters, setFilters] = useState({
		employee: "",
		status: "",
		date: "",
		trackingNumber: "",
	});

	const filtered = useMemo(() => {
		let result = [...statusLogs];

		if (filters.employee) {
			result = result.filter((log) => log.employee === filters.employee);
		}
		if (filters.status) {
			result = result.filter((log) => log.status === filters.status);
		}
		if (filters.date) {
			result = result.filter((log) => log.date?.startsWith(filters.date));
		}
		if (filters.trackingNumber) {
			result = result.filter((log) =>
				log.trackingNumber
					.toLowerCase()
					.includes(filters.trackingNumber.toLowerCase())
			);
		}

		return result;
	}, [statusLogs, filters]);

	const columns = useMemo(
		() => [

			{
				key: "trackingNumber",
				header: t("table.trackingNumber"),
				className: "min-w-[140px] font-mono",
			},
			{
				key: "orderCode",
				header: t("table.orderCode"),
				className: "min-w-[120px] font-mono",
			},

			{
				key: "employee",
				header: t("table.employee"),
				className: "min-w-[140px]",
			},
			{
				key: "customer",
				header: t("table.customer"),
				className: "min-w-[140px]",
			},
			{
				key: "date",
				header: t("table.date"),
				className: "min-w-[120px]",
			},
			{
				key: "status",
				header: t("table.status"),
				className: "min-w-[140px]",
				cell: (row) => <OrderStatusPill value={row.status} />,
			},
		],
		[t]
	);

	return (
		<div className="space-y-4">
			{/* Filters */}
			<div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700 rounded-2xl p-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<div className="space-y-2">
						<Label className="text-xs font-semibold">
							{t("filters.employee")}
						</Label>
						<Input
							value={filters.employee}
							onChange={(e) =>
								setFilters({ ...filters, employee: e.target.value })
							}
							placeholder={t("filters.employeePlaceholder")}
							className="rounded-xl h-9 text-sm"
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-xs font-semibold">{t("filters.status")}</Label>
						<Select
							value={filters.status}
							onValueChange={(val) =>
								setFilters({ ...filters, status: val })
							}
						>
							<SelectTrigger className="rounded-xl h-9 text-sm">
								<SelectValue placeholder={t("filters.statusPlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								<SelectItem value={ORDER_STATUS.READY_TO_SHIP}>
									جاهز للشحن
								</SelectItem>
								<SelectItem value={ORDER_STATUS.IN_PREPARATION}>
									قيد التحضير
								</SelectItem>
								<SelectItem value={ORDER_STATUS.IN_PROCESS}>
									قيد الإجراء
								</SelectItem>
								<SelectItem value={ORDER_STATUS.RETURNED_SCANNED}>
									رجع للمستودع تم المسح
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-xs font-semibold">{t("filters.date")}</Label>
						<Input
							type="date"
							value={filters.date}
							onChange={(e) =>
								setFilters({ ...filters, date: e.target.value })
							}
							className="rounded-xl h-9 text-sm"
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-xs font-semibold">
							{t("filters.trackingNumber")}
						</Label>
						<Input
							value={filters.trackingNumber}
							onChange={(e) =>
								setFilters({ ...filters, trackingNumber: e.target.value })
							}
							placeholder={t("filters.trackingNumberPlaceholder")}
							className="rounded-xl h-9 text-sm"
						/>
					</div>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
				<DataTable
					columns={columns}
					data={filtered}
					isLoading={false}
					pagination={{
						total_records: filtered.length,
						current_page: 1,
						per_page: filtered.length,
					}}
					onPageChange={() => { }}
					emptyState={t("empty")}
				/>
			</div>
		</div>
	);
}

// ==================== MAIN COMPONENT ====================
export default function OrderReplacementPage() {
	const t = useTranslations("replacement");
	const locale = useLocale();
	const dir = locale === "ar" ? "rtl" : "ltr";

	// State
	const [replacements, setReplacements] = useState(initialReplacements);
	const [statusLogs, setStatusLogs] = useState(initialStatusLogs);
	const [activeTab, setActiveTab] = useState("replacements");
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState({
		status: "",
		date: "",
		originalOrderCode: "",
	});
	const [filterOpen, setFilterOpen] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	// Tab configuration
	const tabConfig = [
		{ id: "replacements", label: t("tabs.replacements"), icon: Package },
		{ id: "statusLog", label: t("tabs.statusLog"), icon: ClipboardList },
		{ id: "returns", label: t("tabs.returns"), icon: RefreshCw },
	];

	// Filtered replacements
	const filtered = useMemo(() => {
		let result = [...replacements];

		if (activeTab !== "replacements") return result;

		// Search filter
		const q = search.trim().toLowerCase();
		if (q) {
			result = result.filter((r) =>
				[r.id, r.originalOrderCode, r.customer, r.phone].some((x) =>
					String(x).toLowerCase().includes(q)
				)
			);
		}

		// Advanced filters
		if (filters.status) {
			result = result.filter((r) => r.deliveryStatus === filters.status);
		}
		if (filters.date) {
			result = result.filter((r) => r.orderDate?.startsWith(filters.date));
		}
		if (filters.originalOrderCode) {
			result = result.filter((r) =>
				r.originalOrderCode
					.toLowerCase()
					.includes(filters.originalOrderCode.toLowerCase())
			);
		}

		return result;
	}, [replacements, activeTab, search, filters]);

	const hasActiveFilters = Object.values(filters).some((v) => v !== "");

	const clearFilters = () => {
		setFilters({
			status: "",
			date: "",
			originalOrderCode: "",
		});
	};

	// Handle create replacement
	const handleCreateReplacement = (data) => {
		const newReplacement = {
			id: `EX-${Date.now()}`,
			originalOrderCode: data.orderCode,
			customer: "يسرا علام",
			phone: "01002766992",
			replacedProducts: data.replacementProducts.map((rp) => ({
				name: rp.replacementSku?.label || "منتج",
				image: "/product.jpg",
				quantity: rp.quantity,
			})),
			reason: data.reason,
			orderDate: new Date().toISOString().split("T")[0],
			cod: data.financialSummary.customerBalance,
			deliveryStatus: DELIVERY_STATUS.IN_DELIVERY,
		};

		setReplacements([newReplacement, ...replacements]);
	};

	// Statistics
	const stats = useMemo(() => {
		const total = replacements.length;
		const delivered = replacements.filter(
			(r) => r.deliveryStatus === DELIVERY_STATUS.DELIVERED
		).length;
		const inDelivery = replacements.filter(
			(r) => r.deliveryStatus === DELIVERY_STATUS.IN_DELIVERY
		).length;
		const notDelivered = replacements.filter(
			(r) => r.deliveryStatus === DELIVERY_STATUS.NOT_DELIVERED
		).length;

		return [
			{ title: t("stats.total"), value: String(total), icon: Package },
			{
				title: t("stats.delivered"),
				value: String(delivered),
				icon: CheckCircle2,
			},
			{
				title: t("stats.inDelivery"),
				value: String(inDelivery),
				icon: Truck,
			},
			{
				title: t("stats.notDelivered"),
				value: String(notDelivered),
				icon: AlertCircle,
			},
		];
	}, [replacements, t]);

	// Table columns
	const columns = useMemo(
		() => [
			{
				key: "id",
				header: t("table.replacementCode"),
				className: "font-semibold text-primary min-w-[120px]",
			},
			{
				key: "originalOrderCode",
				header: t("table.originalOrderCode"),
				className: "min-w-[140px] font-mono",
			},
			{
				key: "customer",
				header: t("table.customer"),
				className: "min-w-[140px]",
			},
			{
				key: "phone",
				header: t("table.phone"),
				className: "min-w-[140px] font-mono",
			},
			{
				key: "replacedProducts",
				header: t("table.replacedProducts"),
				className: "min-w-[180px]",
				cell: (row) => (
					<div className="flex items-center gap-2">
						<div className="flex -space-x-2">
							{row.replacedProducts.slice(0, 3).map((p, idx) => (
								<div
									key={idx}
									className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center"
								>
									<ImageIcon size={14} className="text-slate-400" />
								</div>
							))}
						</div>
						<span className="text-xs text-slate-600 dark:text-slate-400">
							{row.replacedProducts.length} {t("table.products")}
						</span>
					</div>
				),
			},
			{
				key: "reason",
				header: t("table.reason"),
				className: "min-w-[140px]",
			},
			{
				key: "orderDate",
				header: t("table.orderDate"),
				className: "min-w-[120px]",
			},
			{
				key: "cod",
				header: t("table.cod"),
				className: "min-w-[100px] font-mono",
				cell: (row) => (
					<span className="font-semibold">
						{row.cod} {t("common.currency")}
					</span>
				),
			},
			{
				key: "deliveryStatus",
				header: t("table.deliveryStatus"),
				className: "min-w-[140px]",
				cell: (row) => <DeliveryStatusPill value={row.deliveryStatus} />,
			},
			{
				key: "actions",
				header: t("table.actions"),
				className: "w-fit",
				cell: (row) => (
					<div className="flex items-center gap-2">
						{/* View */}
						<Link
							href={`/orders/details/${row.id}`}
							aria-label="View"
							className="
          inline-flex h-[35px] w-[35px] items-center justify-center rounded-full
          border border-[var(--border)] bg-[var(--card)]
          text-[var(--muted-foreground)]
          transition-opacity duration-300 hover:opacity-80
        "
						>
							<Eye className="h-5 w-5" />
						</Link>

						{/* Print */}
						<Link
							href="#"
							aria-label="Print"
							className="
          inline-flex h-[35px] w-[35px] items-center justify-center rounded-full
          border border-[var(--border)]
          bg-[var(--primary)]
          text-white
          transition-opacity duration-300 hover:opacity-80
        "
						>
							<Printer className="h-5 w-5" />
						</Link>
					</div>
				),
			},
		],
		[t]
	);

	return (
		<div
			className="min-h-screen !pb-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/20 dark:from-[#182337] dark:via-[#182337] dark:to-[#1a2744]"
			dir={dir}
		>
			{/* Header */}
			<div className="bg-card flex flex-col gap-4 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-[rgb(var(--primary))]">{t("title")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
					</div>

					<Button
						onClick={() => setCreateDialogOpen(true)}
						className="btn-primary1 rounded-xl flex items-center gap-2 text-white"
					>
						<Plus size={18} />
						{t("createReplacement")}
					</Button>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-4 gap-3 md:gap-4">
					{stats.map((s, i) => (
						<motion.div
							key={i}
							initial={{ opacity: 0, y: 30, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ delay: i * 0.1, type: "spring", stiffness: 120 }}
							whileHover={{ scale: 1.02, y: -2 }}
							className="group cursor-pointer"
						>
							<div className="relative overflow-hidden rounded-lg md:rounded-xl p-3 md:p-4 bg-white/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
								<motion.div className="absolute inset-0 bg-gradient-to-br from-[#ff8b00]/10 via-[#ffb703]/10 to-[#ff5c2b]/10 dark:from-[#5b4bff]/10 dark:via-[#8b7cff]/10 dark:to-[#3be7ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

								<div className="relative flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 truncate">
											{s.title}
										</p>
										<p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b] dark:from-[#5b4bff] dark:to-[#3be7ff] bg-clip-text text-transparent">
											{s.value}
										</p>
									</div>

									<motion.div
										className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center bg-gradient-to-br from-[#ff8b00]/20 to-[#ff5c2b]/20 dark:from-[#5b4bff]/20 dark:to-[#3be7ff]/20 border border-[#ff8b00]/30 dark:border-[#5b4bff]/30 flex-shrink-0"
										whileHover={{ rotate: [0, -10, 10, -10, 0] }}
										transition={{ duration: 0.5 }}
									>
										<s.icon className="text-[#ff8b00] dark:text-[#5b4bff]" size={18} />
									</motion.div>
								</div>
							</div>
						</motion.div>
					))}
				</div>

				{/* Tabs */}
				<SwitcherTabs
					items={tabConfig}
					activeId={activeTab}
					onChange={setActiveTab}
					className="w-full"
				/>
			</div>

			{/* Main Content */}
			{activeTab === "statusLog" ? (
				<StatusLogTab statusLogs={statusLogs} />
			) : activeTab === "returns" ? (
				<div className="bg-card rounded-2xl p-12 text-center">
					<Package className="w-16 h-16 mx-auto mb-4 text-slate-400" />
					<p className="text-lg font-semibold">{t("returnsComingSoon")}</p>
				</div>
			) : (
				<div className="space-y-4">
					{/* Toolbar */}
					<div className="flex flex-col gap-3">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
							<div className="relative w-full md:w-[280px]">
								<SearchIcon
									className={cn(
										"absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400",
										locale === "ar" ? "right-3" : "left-3"
									)}
								/>
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder={t("searchPlaceholder")}
									className={cn(
										"h-[40px] rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700",
										locale === "ar" ? "pr-10" : "pl-10"
									)}
								/>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => setFilterOpen(!filterOpen)}
									className={cn(
										"h-[40px] px-4 rounded-full border flex items-center gap-2 text-sm font-medium transition-all duration-300",
										filterOpen || hasActiveFilters
											? "bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b] dark:from-[#5b4bff] dark:to-[#3be7ff] text-white border-transparent shadow-lg"
											: "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-[#ff8b00] dark:hover:border-[#5b4bff]"
									)}
									type="button"
								>
									<Filter size={18} />
									{t("filter")}
									{hasActiveFilters && (
										<span className="bg-white/30 text-xs px-1.5 py-0.5 rounded-full font-semibold">
											{Object.values(filters).filter((v) => v !== "").length}
										</span>
									)}
									<motion.div
										animate={{ rotate: filterOpen ? 180 : 0 }}
										transition={{ duration: 0.3 }}
									>
										<ChevronDown size={16} />
									</motion.div>
								</motion.button>

								<Button
									variant="outline"
									className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 flex items-center gap-2 !px-4 rounded-full h-[40px]"
									onClick={() => alert(t("exportDemo"))}
								>
									<FileDown size={18} className="text-[#A7A7A7]" />
									{t("export")}
								</Button>
							</div>
						</div>

						{/* Filter Toolbar */}
						<AnimatePresence>
							{filterOpen && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3 }}
									className="overflow-hidden"
								>
									<div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700 rounded-2xl p-4">
										<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
											<div className="space-y-2">
												<Label className="text-xs font-semibold">
													{t("filters.status")}
												</Label>
												<Select
													value={filters.status || "all"}
													onValueChange={(val) =>
														setFilters({
															...filters,
															status: val === "all" ? "" : val,
														})
													}
												>
													<SelectTrigger className="rounded-xl h-9 text-sm">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="all">
															{t("filters.all")}
														</SelectItem>
														<SelectItem value={DELIVERY_STATUS.DELIVERED}>
															تم التوصيل
														</SelectItem>
														<SelectItem value={DELIVERY_STATUS.IN_DELIVERY}>
															جاري التوصيل
														</SelectItem>
														<SelectItem value={DELIVERY_STATUS.NOT_DELIVERED}>
															لم يتم التوصيل
														</SelectItem>
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label className="text-xs font-semibold">
													{t("filters.date")}
												</Label>
												<Input
													type="date"
													value={filters.date}
													onChange={(e) =>
														setFilters({ ...filters, date: e.target.value })
													}
													className="rounded-xl h-9 text-sm"
												/>
											</div>

											<div className="space-y-2">
												<Label className="text-xs font-semibold">
													{t("filters.originalOrderCode")}
												</Label>
												<Input
													value={filters.originalOrderCode}
													onChange={(e) =>
														setFilters({
															...filters,
															originalOrderCode: e.target.value,
														})
													}
													placeholder={t("filters.originalOrderCodePlaceholder")}
													className="rounded-xl h-9 text-sm"
												/>
											</div>
										</div>

										{hasActiveFilters && (
											<div className="mt-3 flex justify-end">
												<Button
													variant="outline"
													size="sm"
													onClick={clearFilters}
													className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
												>
													<X size={16} className="mr-2" />
													{t("clearFilters")}
												</Button>
											</div>
										)}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Data Table */}
					{filtered.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm p-12 flex flex-col items-center justify-center gap-3"
						>
							<div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
								<Info className="w-8 h-8 text-slate-400" />
							</div>
							<div className="text-center">
								<div className="font-semibold text-base mb-1">
									{t("emptyTitle")}
								</div>
								<div className="text-xs text-slate-500 dark:text-slate-300 max-w-md">
									{t("emptyDescription")}
								</div>
							</div>
						</motion.div>
					) : (
						<div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
							<DataTable
								columns={columns}
								data={filtered}
								isLoading={false}
								pagination={{
									total_records: filtered.length,
									current_page: 1,
									per_page: filtered.length,
								}}
								onPageChange={() => { }}
								emptyState={t("emptyTitle")}
							/>
						</div>
					)}
				</div>
			)}

			{/* Create Replacement Dialog */}
			<CreateReplacementDialog
				open={createDialogOpen}
				onClose={() => setCreateDialogOpen(false)}
				onCreate={handleCreateReplacement}
			/>
		</div>
	);
}