
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Package,
	Clock,
	CheckCircle2,
	XCircle,
	ChevronLeft,
	FileDown,
	Search as SearchIcon,
	Loader2,
	Filter,
	ChevronDown,
	X,
	Calendar,
	Info,
	Layers,
	AlertCircle,
	ScanLine,
	Eye,
	Truck,
	Ban,
	ClipboardList,
	ArrowLeft,
	Edit,
	RefreshCw,
	User,
	Phone,
	MapPin,
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
import jsPDF from "jspdf";

// Add Arabic font support for jsPDF
if (typeof window !== "undefined") {
	// This is a placeholder - you'll need to add actual Arabic font
	// For now, we'll use basic PDF generation
}

// ==================== CONSTANTS ====================
const STATUS = {
	PENDING: "PENDING",
	PREPARING: "PREPARING",
	PREPARED: "PREPARED",
	DISTRIBUTED: "DISTRIBUTED",
	REJECTED: "REJECTED",
};

const carriers = ["ARAMEX", "SMSA", "DHL", "BOSTA"];

// ==================== DUMMY DATA ====================
const initialOrders = [
	{
		code: "ORD-1001",
		customer: "أحمد محمد",
		phone: "0551234567",
		city: "الدمام",
		address: "الدمام، حي الفيصلية",
		products: [
			{ sku: "PRD-001", name: "هاتف ذكي", requestedQty: 1, scannedQty: 0 },
			{ sku: "PRD-002", name: "سماعات", requestedQty: 2, scannedQty: 0 },
		],
		carrier: "",
		status: STATUS.PENDING,
		orderDate: "2025-06-18",
		notes: "",
		assignedEmployee: "محمد أحمد",
	},
	{
		code: "ORD-1002",
		customer: "فاطمة أحمد",
		phone: "0567891234",
		city: "مكة",
		address: "مكة، العزيزية",
		products: [
			{ sku: "PRD-003", name: "ساعة ذكية", requestedQty: 2, scannedQty: 1 },
			{ sku: "PRD-004", name: "كاميرا", requestedQty: 1, scannedQty: 0 },
		],
		carrier: "DHL",
		status: STATUS.PREPARING,
		orderDate: "2025-06-17",
		notes: "عميل مميز",
		assignedEmployee: "سارة علي",
	},
	{
		code: "ORD-1003",
		customer: "خالد عبدالله",
		phone: "0501239876",
		city: "الرياض",
		address: "الرياض، حي النخيل",
		products: [
			{ sku: "PRD-005", name: "جهاز لوحي", requestedQty: 1, scannedQty: 1 },
		],
		carrier: "BOSTA",
		status: STATUS.PREPARED,
		orderDate: "2025-06-16",
		notes: "",
		assignedEmployee: "محمد أحمد",
	},
	{
		code: "ORD-1004",
		customer: "سارة علي",
		phone: "0509876543",
		city: "جدة",
		address: "جدة، الروضة",
		products: [
			{ sku: "PRD-006", name: "شاحن", requestedQty: 3, scannedQty: 3 },
		],
		carrier: "ARAMEX",
		status: STATUS.DISTRIBUTED,
		orderDate: "2025-06-15",
		notes: "",
		sentToCarrier: { ok: true, at: "2025-06-15 10:30" },
		assignedEmployee: "سارة علي",
	},
	{
		code: "ORD-1005",
		customer: "محمد حسن",
		phone: "0558887777",
		city: "الرياض",
		address: "الرياض، حي السليمانية",
		products: [
			{ sku: "PRD-007", name: "كفر حماية", requestedQty: 1, scannedQty: 0 },
		],
		carrier: "SMSA",
		status: STATUS.REJECTED,
		orderDate: "2025-06-14",
		notes: "",
		rejectReason: "المنتج غير متوفر",
		rejectedAt: "2025-06-14 14:20",
		assignedEmployee: "محمد أحمد",
	},
	{
		code: "ORD-1006",
		customer: "نورة سعد",
		phone: "0543219876",
		city: "الرياض",
		address: "الرياض، حي الملقا",
		products: [
			{ sku: "PRD-008", name: "ماوس لاسلكي", requestedQty: 2, scannedQty: 2 },
		],
		carrier: "ARAMEX",
		status: STATUS.DISTRIBUTED,
		orderDate: "2025-06-13",
		notes: "",
		sentToCarrier: { ok: true, at: "2025-06-13 09:20" },
		assignedEmployee: "سارة علي",
	},
	{
		code: "ORD-1007",
		customer: "عبدالله يوسف",
		phone: "0556667777",
		city: "جدة",
		address: "جدة، حي الصفا",
		products: [
			{ sku: "PRD-009", name: "لوحة مفاتيح", requestedQty: 1, scannedQty: 1 },
			{ sku: "PRD-010", name: "سماعة رأس", requestedQty: 1, scannedQty: 1 },
		],
		carrier: "SMSA",
		status: STATUS.DISTRIBUTED,
		orderDate: "2025-06-12",
		notes: "",
		sentToCarrier: { ok: true, at: "2025-06-12 11:15" },
		assignedEmployee: "محمد أحمد",
	},
];

const initialOpsLogs = [];

// ==================== UTILITY FUNCTIONS ====================

async function downloadPdfFromApi({ orderCode, type, locale }) {
	const res = await fetch(`/api/pdf/order/${encodeURIComponent(orderCode)}?locale=${locale}`, {
		method: "GET",
	});

	if (!res.ok) {
		const msg = await res.text().catch(() => "Failed to generate PDF");
		throw new Error(msg);
	}

	const blob = await res.blob();
	const filename = `${type}_${orderCode}_${Date.now()}.pdf`;
	downloadBlob(blob, filename);
}


function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ==================== STATUS PILL COMPONENT ====================
function StatusPill({ value }) {
	const t = useTranslations("warehouse.flow");

	const statusMap = {
		[STATUS.PENDING]: {
			label: t("status.pending"),
			cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/40",
		},
		[STATUS.PREPARING]: {
			label: t("status.preparing"),
			cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/40",
		},
		[STATUS.PREPARED]: {
			label: t("status.prepared"),
			cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/40",
		},
		[STATUS.DISTRIBUTED]: {
			label: t("status.distributed"),
			cls: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-900/40",
		},
		[STATUS.REJECTED]: {
			label: t("status.rejected"),
			cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/40",
		},
	};

	const item = statusMap[value] || {
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

// ==================== CONFIRMATION DIALOG ====================
function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText, variant = "danger" }) {
	const tCommon = useTranslations("warehouse.common");
	const [loading, setLoading] = useState(false);

	const handleConfirm = async () => {
		setLoading(true);
		try {
			await onConfirm();
			onClose();
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<AlertCircle className={cn(
							"w-6 h-6",
							variant === "danger" ? "text-red-500" : "text-amber-500"
						)} />
						{title}
					</DialogTitle>
				</DialogHeader>

				<div className="p-6 space-y-4">
					<p className="text-sm text-slate-600 dark:text-slate-300">
						{message}
					</p>

					<div className="flex justify-end gap-2 pt-2">
						<Button_
							label={tCommon("cancel")}
							tone="gray"
							variant="outline"
							onClick={onClose}
							disabled={loading}
						/>
						<Button_
							label={confirmText}
							tone={variant === "danger" ? "red" : "purple"}
							variant="solid"
							onClick={handleConfirm}
							disabled={loading}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ==================== PREPARE ORDER VIEW ====================
function PrepareOrderView({ order, onBack, updateOrder, pushOp }) {
	const t = useTranslations("warehouse.flow.ensure.prepareView");
	const locale = useLocale();

	const [step, setStep] = useState(1);
	const [scannedOrderCode, setScannedOrderCode] = useState("");
	const [currentSku, setCurrentSku] = useState("");
	const [products, setProducts] = useState([]);
	const [scanLogs, setScanLogs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [successDialog, setSuccessDialog] = useState(false);

	React.useEffect(() => {
		if (order) {
			setProducts(
				order.products.map((p) => ({
					...p,
					scannedQty: p.scannedQty || 0,
					completed: false,
				}))
			);
			setStep(1);
			setScannedOrderCode("ORD-1002");
			setCurrentSku("");
			setScanLogs([]);
		}
	}, [order]);

	const scanOrderCode = () => {
		if (scannedOrderCode.trim() === order.code) {
			setStep(2);
			// Single log entry for order code scan
			const log = {
				success: true,
				message: t("orderScanned"),
				timestamp: new Date().toISOString(),
			};
			setScanLogs([log]);
		} else {
			const log = {
				success: false,
				message: t("wrongOrderCode"),
				reason: t("codeMismatch"),
				timestamp: new Date().toISOString(),
			};
			setScanLogs([log]);
		}
	};

	const scanItem = () => {
		const sku = currentSku.trim();
		if (!sku) return;

		const productIndex = products.findIndex((p) => p.sku === sku);

		if (productIndex === -1) {
			const log = {
				success: false,
				message: `${t("skuNotFound")}: ${sku}`,
				reason: t("skuNotInOrder"),
				timestamp: new Date().toISOString(),
			};
			setScanLogs((prev) => [...prev, log]);
			setCurrentSku("");
			return;
		}

		const product = products[productIndex];

		if (product.scannedQty >= product.requestedQty) {
			const log = {
				success: false,
				message: `${t("skuAlreadyComplete")}: ${sku}`,
				reason: t("qtyComplete"),
				timestamp: new Date().toISOString(),
			};
			setScanLogs((prev) => [...prev, log]);
			setCurrentSku("");
			return;
		}

		const updatedProducts = [...products];
		updatedProducts[productIndex] = {
			...product,
			scannedQty: product.scannedQty + 1,
			completed: product.scannedQty + 1 >= product.requestedQty,
		};
		setProducts(updatedProducts);

		const log = {
			success: true,
			message: `${t("scannedSuccess")}: ${product.name} (${product.scannedQty + 1
				}/${product.requestedQty})`,
			timestamp: new Date().toISOString(),
		};
		setScanLogs((prev) => [...prev, log]);
		setCurrentSku("");
	};

	const allItemsScanned = products.every((p) => p.scannedQty >= p.requestedQty);

	const markPrepared = async () => {
		setLoading(true);
		try {
			updateOrder(order.code, {
				status: STATUS.PREPARED,
				products: products,
			});

			// Single consolidated log for the entire preparation
			pushOp({
				id: `OP-${Date.now()}`,
				operationType: "ORDER_PREPARED",
				orderCode: order.code,
				carrier: order.carrier || "-",
				employee: order.assignedEmployee || "System",
				result: "SUCCESS",
				details: t("markedPrepared"),
				scannedItems: products.map(p => `${p.name} (${p.scannedQty}/${p.requestedQty})`).join(', '),
				createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
			});

			setSuccessDialog(true);
		} finally {
			setLoading(false);
		}
	};

	const handleSuccessClose = () => {
		setSuccessDialog(false);
		onBack();
	};

	// Separate completed and incomplete products
	const incompleteProducts = products.filter(p => !p.completed);
	const completedProducts = products.filter(p => p.completed);
	const sortedProducts = [...incompleteProducts, ...completedProducts];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between gap-4">

				{/* Left / Start side */}
				<div className="flex items-center gap-3">
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={onBack}
						className="
        shrink-0 p-2.5 rounded-xl
        bg-slate-100/80 dark:bg-white/[0.05]
        border border-slate-200/60 dark:border-white/[0.08]
        hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30
        dark:hover:bg-[var(--primary)]/10 dark:hover:border-[var(--primary)]/20
        text-slate-600 dark:text-slate-300 hover:text-[var(--primary)]
        transition-all duration-200
      "
					>
						{/* Flip arrow for RTL */}
						<ArrowLeft size={18} className="rtl:rotate-180 transition-transform" />
					</motion.button>

					<div className="flex flex-col gap-0.5">
						<h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
							<span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)]/10 shrink-0">
								<Package className="text-[var(--primary)]" size={18} />
							</span>
							<span>{t("title")}</span>
							<span className="
          text-sm font-mono font-semibold px-2.5 py-0.5 rounded-lg
          bg-[var(--primary)]/10 text-[var(--primary)]
          border border-[var(--primary)]/20
        ">
								{order.code}
							</span>
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400 ms-10">
							{t("subtitle")}
						</p>
					</div>
				</div>

				{/* Right / End side — confirm button */}
				{step === 2 && allItemsScanned && (
					<motion.button
						initial={{ opacity: 0, scale: 0.9, x: 16 }}
						animate={{ opacity: 1, scale: 1, x: 0 }}
						whileHover={{ scale: 1.03 }}
						whileTap={{ scale: 0.97 }}
						onClick={markPrepared}
						disabled={loading}
						className="
        btn-primary1
        shrink-0 px-5 py-3 rounded-xl
        flex items-center gap-2
        text-sm font-bold text-white
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
        bg-gradient-to-r from-emerald-500 to-teal-500
        shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)]
        hover:shadow-[0_12px_32px_-8px_rgba(16,185,129,0.6)]
      "
					>
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<CheckCircle2 className="w-4 h-4" />
						)}
						<span className="hidden sm:inline">{t("markPrepared")}</span>
					</motion.button>
				)}

			</div>

			{/* Order Details Card */}
			<div className="bg-card relative overflow-hidden">

				<h3 className="text-sm font-bold mb-5 flex items-center gap-2">
					<span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--primary)]/10">
						<Info className="w-3.5 h-3.5 text-[var(--primary)]" />
					</span>
					{t("orderDetails")}
				</h3>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{[
						{ label: t("customer"), value: order.customer, icon: User },
						{ label: t("phone"), value: order.phone, icon: Phone, mono: true },
						{ label: t("city"), value: order.city, icon: MapPin },
						{ label: t("carrier"), value: order.carrier || t("noCarrier"), icon: Truck },
					].map(({ label, value, icon: Icon, mono }) => (
						<div
							key={label}
							className="
          group relative
          bg-slate-50/80 dark:bg-white/[0.03]
          border border-slate-200/60 dark:border-white/[0.06]
          rounded-xl p-3
          hover:border-[var(--primary)]/30 dark:hover:border-[var(--primary)]/20
          hover:bg-[var(--primary)]/[0.03]
          transition-all duration-200
        "
						>
							<div className="flex items-center gap-1.5 mb-2">
								<Icon className="w-3 h-3 text-[var(--primary)]/70" />
								<p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
									{label}
								</p>
							</div>
							<p className={`font-semibold text-sm truncate ${mono ? "font-mono" : ""}`}>
								{value}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Step 1: Scan Order Code */}
			{step === 1 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700 rounded-2xl p-8 space-y-6"
				>
					<div className="text-center space-y-3">
						<div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b] dark:from-[#5b4bff] dark:to-[#3be7ff]">
							<ScanLine className="w-12 h-12 text-white dark:text-black" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
								{t("step1Title")}
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
								{t("step1Subtitle")}
							</p>
						</div>
					</div>

					<div className="relative  max-w-xl mx-auto">
						<input
							value={scannedOrderCode}
							onChange={(e) => setScannedOrderCode(e.target.value)}
							placeholder={t("scanOrderPlaceholder")}
							onKeyDown={(e) => {
								if (e.key === "Enter") scanOrderCode();
							}}
							autoFocus
							className=" h-16 w-full px-5  rtl:text-right ltr:text-left text-lg font-semibold  rounded-2xl border-2 border-slate-300 bg-white text-slate-800 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(var(--primary-shadow))] dark:bg-[#182337] dark:text-slate-100 dark:border-white/10 dark:focus:border-[var(--primary)] dark:focus:shadow-[0_0_0_4px_rgba(var(--primary-shadow))] " />

						<div className=" pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--primary)]/5 to-[var(--third)]/5 " />

						<div className="absolute rtl:left-2 ltr:right-2 top-1/2 -translate-y-1/2">
							<button
								onClick={scanOrderCode}
								className="
									btn-primary1
									h-12 px-4 rounded-xl
									flex items-center gap-1.5
									text-sm font-bold tracking-wide text-white
									whitespace-nowrap
									hover:scale-[1.03] active:scale-[0.97]
								"
							>
								<ScanLine className="w-4 h-4 shrink-0" />
								{t("scan")}
							</button>
						</div>
					</div>
				</motion.div>
			)}

			{/* Step 2: Scan Items - Side by Side Layout */}
			{step === 2 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="grid grid-cols-1 lg:grid-cols-3 gap-4"
				>
					<div className="lg:col-span-2 space-y-4">

						<div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700 rounded-2xl p-6 space-y-4">
							<div className="relative mt-6 mb-12 max-w-xl mx-auto">
								<input
									value={currentSku}
									onChange={(e) => setCurrentSku(e.target.value)}
									placeholder={t("scanSkuPlaceholder")}
									onKeyDown={(e) => { if (e.key === "Enter") scanItem(); }}
									autoFocus
									className=" h-16 w-full px-5  rtl:text-right ltr:text-left text-lg font-semibold  rounded-2xl border-2 border-slate-300 bg-white text-slate-800 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(var(--primary-shadow))] dark:bg-[#182337] dark:text-slate-100 dark:border-white/10 dark:focus:border-[var(--primary)] dark:focus:shadow-[0_0_0_4px_rgba(var(--primary-shadow))] " />

								<div className=" pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--primary)]/5 to-[var(--third)]/5 " />

								<div className="absolute rtl:left-2 ltr:right-2 top-1/2 -translate-y-1/2">
									<button
										onClick={scanItem}
										className="
									btn-primary1
									h-12 px-4 rounded-xl
									flex items-center gap-1.5
									text-sm font-bold tracking-wide text-white
									whitespace-nowrap
									hover:scale-[1.03] active:scale-[0.97]
								"
									>
										<ScanLine className="w-4 h-4 shrink-0" />
										{t("scan")}
									</button>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-bold flex items-center gap-2">
									<Package className="w-4 h-4 text-[#ff8b00] dark:text-[#5b4bff]" />
									{t("products")}
								</h3>
								<span className="text-xs text-slate-500">
									{products.filter((p) => p.completed).length}/{products.length} {t("completed")}
								</span>
							</div>

							<div className="space-y-2 max-h-[600px] overflow-y-auto">
								{sortedProducts.map((p, idx) => (
									<motion.div
										key={idx}
										layout
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: idx * 0.05 }}
										className={cn(
											"rounded-xl border p-4 transition-all duration-300",
											p.completed
												? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
												: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
										)}
									>
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
														{p.sku}
													</code>
													<span className="font-semibold">{p.name}</span>
													{p.completed && (
														<CheckCircle2 className="w-5 h-5 text-emerald-600" />
													)}
												</div>
												<div className="flex items-center gap-4">
													<div className="text-xs text-slate-600 dark:text-slate-400">
														{t("progress")}: <span className="font-mono font-semibold">{p.scannedQty}/{p.requestedQty}</span>
													</div>
													<div className="flex-1 max-w-xs">
														<div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
															<motion.div
																initial={{ width: 0 }}
																animate={{
																	width: `${(p.scannedQty / p.requestedQty) * 100}%`,
																}}
																transition={{ duration: 0.5 }}
																className={cn(
																	"h-full rounded-full",
																	p.completed
																		? "bg-gradient-to-r from-emerald-500 to-teal-600"
																		: "bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b]"
																)}
															/>
														</div>
													</div>
												</div>
											</div>
											<div
												className={cn(
													"text-sm font-bold px-3 py-1 rounded-full",
													p.completed
														? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
														: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
												)}
											>
												{p.completed ? t("complete") : t("pending")}
											</div>
										</div>
									</motion.div>
								))}
							</div>
						</div>
					</div>

					{/* Right: Scan Logs - 1 column */}
					<div className="lg:col-span-1">
						<div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700 rounded-2xl p-6 space-y-4 sticky top-4">
							<h3 className="text-sm font-bold flex items-center gap-2">
								<ClipboardList className="w-4 h-4 text-[#ff8b00] dark:text-[#5b4bff]" />
								{t("scanLogs")}
							</h3>
							<div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
								{scanLogs.length === 0 ? (
									<div className="text-center py-8 text-slate-400 dark:text-slate-600">
										<ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
										<p className="text-sm">{t("noLogs")}</p>
									</div>
								) : (
									scanLogs.slice().reverse().map((log, idx) => (
										<motion.div
											key={scanLogs.length - idx}
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: idx * 0.05 }}
											className={cn(
												"p-3 rounded-xl border text-sm",
												log.success
													? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
													: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
											)}
										>
											<div className="flex items-start gap-2">
												{log.success ? (
													<CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
												) : (
													<XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
												)}
												<div className="flex-1">
													<div
														className={cn(
															"font-medium",
															log.success
																? "text-emerald-800 dark:text-emerald-200"
																: "text-red-800 dark:text-red-200"
														)}
													>
														{log.message}
													</div>
													{log.reason && (
														<div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
															{log.reason}
														</div>
													)}
												</div>
											</div>
										</motion.div>
									))
								)}
							</div>
						</div>
					</div>
				</motion.div>
			)}

			{/* Success Dialog */}
			<Dialog open={successDialog} onOpenChange={setSuccessDialog}>
				<DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl">
					<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
						<DialogTitle className="text-lg font-bold flex items-center gap-2">
							<CheckCircle2 className="text-emerald-500" size={24} />
							{t("successTitle")}
						</DialogTitle>
					</DialogHeader>

					<div className="p-6 space-y-4">
						<p className="text-sm text-slate-600 dark:text-slate-300">
							{t("successMessage")}
						</p>

						<div className="flex justify-end gap-2 pt-2">
							<Button_
								label={t("close")}
								tone="purple"
								variant="solid"
								onClick={handleSuccessClose}
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ==================== REJECT DIALOG ====================
function RejectDialog({ open, onClose, order, updateOrder, pushOp }) {
	const t = useTranslations("warehouse.flow.ensure.rejectDialog");
	const tCommon = useTranslations("warehouse.common");

	const [scannedOrderCode, setScannedOrderCode] = useState("");
	const [reason, setReason] = useState("");
	const [loading, setLoading] = useState(false);

	React.useEffect(() => {
		if (open) {
			setScannedOrderCode("");
			setReason("");
		}
	}, [open]);

	const submitReject = async () => {
		if (scannedOrderCode.trim() !== order.code) {
			return;
		}

		if (!reason.trim()) {
			return;
		}

		setLoading(true);
		try {
			updateOrder(order.code, {
				status: STATUS.REJECTED,
				rejectReason: reason,
				rejectedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
			});

			pushOp({
				id: `OP-${Date.now()}`,
				operationType: "REJECT_ORDER",
				orderCode: order.code,
				carrier: order.carrier || "-",
				employee: order.assignedEmployee || "System",
				result: "FAILED",
				details: `${t("rejected")}: ${reason}`,
				createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
			});

			onClose();
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<Ban className="text-red-500" size={24} />
						{t("title")} - {order?.code}
					</DialogTitle>
				</DialogHeader>

				<div className="p-6 space-y-4">
					<div className="space-y-2">
						<Label>{t("scanOrderCode")}</Label>
						<Input
							value={scannedOrderCode}
							onChange={(e) => setScannedOrderCode(e.target.value)}
							placeholder={order?.code}
							className="rounded-xl font-mono"
							autoFocus
						/>
					</div>

					<div className="space-y-2">
						<Label>
							{t("reason")}
							<span className="text-red-500 ml-1">*</span>
						</Label>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t("reasonPlaceholder")}
							className="rounded-xl min-h-[100px]"
						/>
					</div>

					<div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 flex gap-2">
						<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
						<p className="text-sm text-red-800 dark:text-red-200">
							{t("warning")}
						</p>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button_
							label={tCommon("cancel")}
							tone="gray"
							variant="outline"
							onClick={onClose}
							disabled={loading}
						/>
						<Button_
							label={t("confirm")}
							tone="red"
							variant="solid"
							onClick={submitReject}
							disabled={loading || !reason.trim() || scannedOrderCode.trim() !== order?.code}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ==================== DISTRIBUTION DIALOG ====================
function DistributionDialog({ open, onClose, orders, selectedOrderCodes, updateOrder, pushOp }) {
	const t = useTranslations("warehouse.flow.ensure.distributionDialog");
	const tCommon = useTranslations("warehouse.common");

	const [selectedOrders, setSelectedOrders] = useState([]);
	const [carrier, setCarrier] = useState("");
	const [loading, setLoading] = useState(false);

	// Filter to only show selected orders that are prepared
	const availableOrders = React.useMemo(() => {
		return orders.filter(
			(o) => o.status === STATUS.PREPARED && selectedOrderCodes.includes(o.code)
		);
	}, [orders, selectedOrderCodes]);


	React.useEffect(() => {
		if (open) {
			// Pre-select the orders that were selected in the main table
			setSelectedOrders(availableOrders.map(o => o.code));
			setCarrier("");
		}
	}, [open, availableOrders]);

	const toggleOrder = (code) => {
		setSelectedOrders((prev) =>
			prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
		);
	};

	const selectAll = () => {
		if (selectedOrders.length === availableOrders.length) {
			setSelectedOrders([]);
		} else {
			setSelectedOrders(availableOrders.map((o) => o.code));
		}
	};

	const handleDistribute = async () => {
		if (!carrier || selectedOrders.length === 0) {
			return;
		}

		setLoading(true);
		try {
			selectedOrders.forEach((code) => {
				updateOrder(code, {
					carrier,
					status: STATUS.DISTRIBUTED,
					sentToCarrier: { ok: true, at: new Date().toISOString().slice(0, 16).replace("T", " ") },
				});

				pushOp({
					id: `OP-${Date.now()}`,
					operationType: "DISTRIBUTE_ORDER",
					orderCode: code,
					carrier,
					employee: "System",
					result: "SUCCESS",
					details: `${t("distributed")}: ${carrier}`,
					createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
				});
			});

			onClose();
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<Truck className="text-[#ff8b00] dark:text-[#5b4bff]" size={24} />
						{t("title")}
					</DialogTitle>
				</DialogHeader>

				<div className="p-6 space-y-6">
					<div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-4">
						<p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
							{t("subtitle")}
						</p>
						<p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
							{t("selectedCount", { count: selectedOrders.length })}
						</p>
					</div>

					<div className="space-y-2">
						<Label>
							{t("selectCarrier")}
							<span className="text-red-500 ml-1">*</span>
						</Label>
						<Select value={carrier} onValueChange={setCarrier}>
							<SelectTrigger className="rounded-xl">
								<SelectValue placeholder={t("carrierPlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								{carriers.map((c) => (
									<SelectItem key={c} value={c}>
										<div className="flex items-center gap-2">
											<Truck size={16} />
											{c}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label>{t("selectOrders")}</Label>
							<button
								onClick={selectAll}
								className="text-sm text-[#ff8b00] dark:text-[#5b4bff] hover:underline font-medium"
							>
								{selectedOrders.length === availableOrders.length
									? t("deselectAll")
									: t("selectAll")}
							</button>
						</div>

						<div className="max-h-[300px] overflow-y-auto space-y-2 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
							{availableOrders.length === 0 ? (
								<div className="text-center py-8 text-slate-500">
									{t("noOrders")}
								</div>
							) : (
								availableOrders.map((order) => (
									<motion.div
										key={order.code}
										whileHover={{ scale: 1.01 }}
										className={cn(
											"flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
											selectedOrders.includes(order.code)
												? "bg-gradient-to-r from-[#ff8b00]/10 to-[#ff5c2b]/10 dark:from-[#5b4bff]/10 dark:to-[#3be7ff]/10 border-[#ff8b00] dark:border-[#5b4bff]"
												: "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
										)}
										onClick={() => toggleOrder(order.code)}
									>
										<Checkbox
											checked={selectedOrders.includes(order.code)}
											onCheckedChange={() => toggleOrder(order.code)}
										/>
										<div className="flex-1">
											<p className="font-semibold text-sm">{order.code}</p>
											<p className="text-xs text-gray-600 dark:text-slate-400">
												{order.customer} - {order.city}
											</p>
										</div>
										<span className="text-xs text-gray-500 dark:text-slate-500">
											{order.products.length} {t("items")}
										</span>
									</motion.div>
								))
							)}
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button_
							label={tCommon("cancel")}
							tone="gray"
							variant="outline"
							onClick={onClose}
							disabled={loading}
						/>
						<Button_
							label={t("distribute")}
							tone="purple"
							variant="solid"
							onClick={handleDistribute}
							disabled={loading || !carrier || selectedOrders.length === 0}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ==================== LOGS TAB ====================
function LogsTab({ opsLogs, orders }) {
	const t = useTranslations("warehouse.flow.logs");
	const locale = useLocale();
	const [downloading, setDownloading] = useState({});
	const handlePrintSuccess = async (log) => {
		const key = `success:${log.orderCode}`;
		try {
			setDownloading((p) => ({ ...p, [key]: true }));

			await downloadPdfFromApi({
				orderCode: log.orderCode,
				type: "success",
				locale,
			});
		} catch (e) {
			alert(e.message);
		} finally {
			setDownloading((p) => ({ ...p, [key]: false }));
		}
	};


	const handlePrintFail = async (log) => {
		const key = `fail:${log.orderCode}`;
		try {
			setDownloading((p) => ({ ...p, [key]: true }));

			await downloadPdfFromApi({
				orderCode: log.orderCode,
				type: "fail",
				locale,
			});
		} catch (e) {
			alert(e.message);
		} finally {
			setDownloading((p) => ({ ...p, [key]: false }));
		}
	};



	const columns = useMemo(
		() => [
			{
				key: "id",
				header: t("table.id"),
				className: "font-semibold text-primary w-[140px]",
			},
			{
				key: "orderCode",
				header: t("table.orderCode"),
				className: "min-w-[120px] font-mono",
			},
			{
				key: "carrier",
				header: t("table.carrier"),
				className: "min-w-[120px]",
			},
			{
				key: "employee",
				header: t("table.employee"),
				className: "min-w-[140px]",
			},
			{
				key: "result",
				header: t("table.result"),
				className: "min-w-[100px]",
				cell: (row) => (
					<span
						className={cn(
							"px-2 py-1 rounded-full text-xs font-medium",
							row.result === "SUCCESS"
								? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
								: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
						)}
					>
						{row.result}
					</span>
				),
			},
			{
				key: "createdAt",
				header: t("table.date"),
				className: "min-w-[160px]",
			},
			{
				key: "actions",
				header: t("table.actions"),
				className: "!w-fit",
				cell: (row) => {
					const successKey = `success:${row.orderCode}`;
					const failKey = `fail:${row.orderCode}`;
					const successLoading = !!downloading[successKey];
					const failLoading = !!downloading[failKey];

					return (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="rounded-full"
								onClick={() => handlePrintSuccess(row)}
								disabled={successLoading || failLoading}
							>
								{successLoading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<img src="/down-success.svg" className="w-4 h-4" />
								)}
								{t("printSuccess")}
							</Button>

							<Button
								variant="outline"
								size="sm"
								className="rounded-full"
								onClick={() => handlePrintFail(row)}
								disabled={successLoading || failLoading}
							>
								{failLoading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<img src="/down-wrong.svg" className="w-4 h-4" />
								)}
								{t("printFail")}
							</Button>
						</div>
					);
				},

			},
		],
		[t, downloading]
	);

	return (
		<div className="space-y-4">
			<DataTable
				columns={columns}
				data={opsLogs}
				isLoading={false}
				pagination={{
					total_records: opsLogs.length,
					current_page: 1,
					per_page: opsLogs.length,
				}}
				onPageChange={() => { }}
				emptyState={t("empty")}
			/>
		</div>
	);
}

// ==================== MAIN COMPONENT ====================
export default function WarehouseFlowPage() {
	const t = useTranslations("warehouse.flow");
	const locale = useLocale();
	const dir = locale === "ar" ? "rtl" : "ltr";

	// State
	const [orders, setOrders] = useState(initialOrders);
	const [opsLogs, setOpsLogs] = useState(initialOpsLogs);
	const [activeTab, setActiveTab] = useState("all");
	const [search, setSearch] = useState("");
	const [selectedOrders, setSelectedOrders] = useState([]);
	const [filters, setFilters] = useState({
		carrier: "",
		date: "",
		product: "",
		region: "",
		sent: "",
		status: "",
	});
	const [filterOpen, setFilterOpen] = useState(false);

	// Dialogs & Views
	const [preparingOrder, setPreparingOrder] = useState(null);
	const [rejectDialog, setRejectDialog] = useState({ open: false, order: null });
	const [distributionDialog, setDistributionDialog] = useState(false);
	const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });

	// Callbacks
	const pushOp = useCallback((op) => {
		setOpsLogs((prev) => [{ ...op }, ...prev]);
	}, []);

	const updateOrder = useCallback((code, patch) => {
		setOrders((prev) =>
			prev.map((o) => (o.code === code ? { ...o, ...patch } : o))
		);
	}, []);

	// Tab configuration
	const tabConfig = [
		{ id: "all", label: t("tabs.all"), icon: Package },
		{ id: STATUS.PREPARING, label: t("tabs.preparing"), icon: Clock },
		{ id: STATUS.PREPARED, label: t("tabs.prepared"), icon: CheckCircle2 },
		{ id: STATUS.DISTRIBUTED, label: t("tabs.distributed"), icon: Truck },
		{ id: STATUS.REJECTED, label: t("tabs.rejected"), icon: XCircle },
		{ id: "logs", label: t("tabs.logs"), icon: ClipboardList },
	];

	// Filtered orders
	const filtered = useMemo(() => {
		let result = [...orders];

		// Active tab filter
		if (activeTab !== "all" && activeTab !== "logs") {
			result = result.filter((o) => o.status === activeTab);
		}

		// Search filter
		const q = search.trim().toLowerCase();
		if (q) {
			result = result.filter((o) =>
				[o.code, o.customer, o.phone, o.city, o.carrier].some((x) =>
					String(x).toLowerCase().includes(q)
				)
			);
		}

		// Advanced filters
		if (filters.carrier) {
			result = result.filter((o) => o.carrier === filters.carrier);
		}
		if (filters.date) {
			result = result.filter((o) => o.orderDate?.startsWith(filters.date));
		}
		if (filters.product) {
			result = result.filter((o) =>
				o.products?.some((p) =>
					p.name.toLowerCase().includes(filters.product.toLowerCase())
				)
			);
		}
		if (filters.region) {
			result = result.filter((o) => o.city === filters.region);
		}
		if (filters.sent === "sent") {
			result = result.filter((o) => o.sentToCarrier?.ok === true);
		}
		if (filters.sent === "notSent") {
			result = result.filter((o) => !o.sentToCarrier);
		}
		if (filters.status) {
			result = result.filter((o) => o.status === filters.status);
		}


		return result;
	}, [orders, activeTab, search, filters]);
	React.useEffect(() => {
		const visibleCodes = new Set(filtered.map((o) => o.code));
		setSelectedOrders((prev) => {
			const next = prev.filter((c) => visibleCodes.has(c));
			return next.length === prev.length ? prev : next; // avoid pointless updates
		});
	}, [filtered]);

	// Statistics based on active tab
	const stats = useMemo(() => {
		if (activeTab === "logs") {
			const successCount = opsLogs.filter((l) => l.result === "SUCCESS").length;
			const failCount = opsLogs.filter((l) => l.result === "FAILED").length;
			return [
				{ title: t("stats.logs.success"), value: String(successCount), icon: CheckCircle2 },
				{ title: t("stats.logs.fail"), value: String(failCount), icon: XCircle },
				{ title: t("stats.logs.total"), value: String(opsLogs.length), icon: ClipboardList },
				{ title: t("stats.logs.rate"), value: opsLogs.length > 0 ? `${Math.round((successCount / opsLogs.length) * 100)}%` : "0%", icon: Package },
			];
		}

		if (activeTab === STATUS.PREPARING) {
			const preparingOrders = orders.filter((o) => o.status === STATUS.PREPARING);
			const preparingItems = preparingOrders.reduce(
				(sum, o) => sum + o.products.reduce((s, p) => s + (p.requestedQty - p.scannedQty), 0),
				0
			);
			return [
				{ title: t("stats.preparing.orders"), value: String(preparingOrders.length), icon: Package },
				{ title: t("stats.preparing.items"), value: String(preparingItems), icon: Clock },
				{ title: t("stats.preparing.scanned"), value: String(preparingOrders.reduce((sum, o) => sum + o.products.reduce((s, p) => s + p.scannedQty, 0), 0)), icon: CheckCircle2 },
				{ title: t("stats.preparing.pending"), value: String(preparingItems), icon: XCircle },
			];
		}

		if (activeTab === STATUS.PREPARED) {
			const preparedOrders = orders.filter((o) => o.status === STATUS.PREPARED);
			const preparedItems = preparedOrders.reduce(
				(sum, o) => sum + o.products.reduce((s, p) => s + p.scannedQty, 0),
				0
			);
			return [
				{ title: t("stats.prepared.orders"), value: String(preparedOrders.length), icon: Package },
				{ title: t("stats.prepared.items"), value: String(preparedItems), icon: CheckCircle2 },
				{ title: t("stats.prepared.ready"), value: String(preparedOrders.length), icon: Truck },
				{ title: t("stats.prepared.total"), value: String(preparedItems), icon: Package },
			];
		}

		if (activeTab === STATUS.REJECTED) {
			const rejectedOrders = orders.filter((o) => o.status === STATUS.REJECTED);
			const rejectedItems = rejectedOrders.reduce(
				(sum, o) => sum + o.products.reduce((s, p) => s + p.requestedQty, 0),
				0
			);
			return [
				{ title: t("stats.rejected.orders"), value: String(rejectedOrders.length), icon: Package },
				{ title: t("stats.rejected.items"), value: String(rejectedItems), icon: XCircle },
				{ title: t("stats.rejected.today"), value: String(rejectedOrders.filter(o => o.rejectedAt?.startsWith(new Date().toISOString().split('T')[0])).length), icon: Calendar },
				{ title: t("stats.rejected.total"), value: String(rejectedOrders.length), icon: Ban },
			];
		}

		if (activeTab === STATUS.DISTRIBUTED) {
			const aramexCount = orders.filter((o) => o.status === STATUS.DISTRIBUTED && o.carrier === "ARAMEX").length;
			const smsaCount = orders.filter((o) => o.status === STATUS.DISTRIBUTED && o.carrier === "SMSA").length;
			const dhlCount = orders.filter((o) => o.status === STATUS.DISTRIBUTED && o.carrier === "DHL").length;
			const bostaCount = orders.filter((o) => o.status === STATUS.DISTRIBUTED && o.carrier === "BOSTA").length;
			return [
				{ title: t("stats.distributed.aramex"), value: String(aramexCount), icon: Truck },
				{ title: t("stats.distributed.smsa"), value: String(smsaCount), icon: Truck },
				{ title: t("stats.distributed.dhl"), value: String(dhlCount), icon: Truck },
				{ title: t("stats.distributed.bosta"), value: String(bostaCount), icon: Truck },
			];
		}

		// Default (all)
		const total = orders.length;
		const preparing = orders.filter((o) => o.status === STATUS.PREPARING).length;
		const prepared = orders.filter((o) => o.status === STATUS.PREPARED).length;
		const rejected = orders.filter((o) => o.status === STATUS.REJECTED).length;
		return [
			{ title: t("stats.total"), value: String(total), icon: Package },
			{ title: t("stats.preparing_"), value: String(preparing), icon: Clock },
			{ title: t("stats.prepared_"), value: String(prepared), icon: CheckCircle2 },
			{ title: t("stats.rejected_"), value: String(rejected), icon: XCircle },
		];
	}, [orders, opsLogs, activeTab, t]);

	const uniqueCarriers = useMemo(
		() => [...new Set(orders.map((o) => o.carrier).filter(Boolean))],
		[orders]
	);
	const uniqueCities = useMemo(
		() => [...new Set(orders.map((o) => o.city).filter(Boolean))],
		[orders]
	);
	const uniqueStatuses = useMemo(
		() => [...new Set(orders.map((o) => o.status).filter(Boolean))],
		[orders]
	);

	const hasActiveFilters = Object.values(filters).some((v) => v !== "");

	const toggleOrderSelection = (orderCode) => {
		setSelectedOrders((prev) =>
			prev.includes(orderCode)
				? prev.filter((c) => c !== orderCode)
				: [...prev, orderCode]
		);
	};

	const selectAllOrders = () => {
		if (selectedOrders.length === filtered.length) {
			setSelectedOrders([]);
		} else {
			setSelectedOrders(filtered.map((o) => o.code));
		}
	};

	const handleBulkReject = () => {
		if (selectedOrders.length === 0) return;

		setConfirmDialog({
			open: true,
			title: t("ensure.bulkActions.rejectTitle"),
			message: t("ensure.bulkActions.rejectConfirm", { count: selectedOrders.length }),
			confirmText: t("ensure.bulkActions.reject"),
			variant: "danger",
			onConfirm: async () => {
				selectedOrders.forEach((code) => {
					updateOrder(code, {
						status: STATUS.REJECTED,
						rejectReason: t("ensure.bulkActions.bulkRejected"),
						rejectedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
					});

					pushOp({
						id: `OP-${Date.now()}`,
						operationType: "BULK_REJECT",
						orderCode: code,
						carrier: "-",
						employee: "System",
						result: "FAILED",
						details: t("ensure.bulkActions.bulkRejected"),
						createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
					});
				});

				setSelectedOrders([]);
			},
		});
	};

	const clearFilters = () => {
		setFilters({
			carrier: "",
			date: "",
			product: "",
			region: "",
			sent: "",
			status: "",
		});
	};

	// Table columns with status-specific actions
	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={filtered.length > 0 && selectedOrders.length === filtered.length}
							onCheckedChange={selectAllOrders}
						/>
					</div>
				),
				className: "w-[50px]",
				cell: (row) => (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={selectedOrders.includes(row.code)}
							onCheckedChange={() => toggleOrderSelection(row.code)}
						/>
					</div>
				),
			},
			{
				key: "code",
				header: t("ensure.table.code"),
				className: "font-semibold text-primary min-w-[120px]",
			},
			{
				key: "customer",
				header: t("ensure.table.customer"),
				className: "text-gray-700 dark:text-slate-200 font-medium min-w-[180px]",
			},
			{
				key: "phone",
				header: t("ensure.table.phone"),
				className: "min-w-[140px] text-slate-600 dark:text-slate-300 font-mono",
			},
			{
				key: "city",
				header: t("ensure.table.city"),
				className: "min-w-[120px]",
			},
			{
				key: "carrier",
				header: t("ensure.table.carrier"),
				className: "min-w-[120px]",
				cell: (row) => (
					<span className="text-sm font-medium">
						{row.carrier || (
							<span className="text-slate-400">{t("ensure.table.noCarrier")}</span>
						)}
					</span>
				),
			},
			{
				key: "status",
				header: t("ensure.table.status"),
				className: "min-w-[140px]",
				cell: (row) => <StatusPill value={row.status} />,
			},
			{
				key: "actions",
				header: t("ensure.table.actions"),
				className: "w-fit bg-white dark:bg-slate-900",
				cell: (row) => {
					const actions = [];

					// Status-based actions
					if (row.status === STATUS.PENDING) {
						actions.push(
							<motion.button
								key="start"
								whileHover={{ scale: 1.04 }}
								whileTap={{ scale: 0.96 }}
								className="px-3 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
								onClick={() => {
									updateOrder(row.code, { status: STATUS.PREPARING });
									pushOp({
										id: `OP-${Date.now()}`,
										operationType: "START_PREPARING",
										orderCode: row.code,
										carrier: row.carrier || "-",
										employee: row.assignedEmployee || "System",
										result: "SUCCESS",
										details: t("ensure.actions.startedPreparing"),
										createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
									});
								}}
							>
								<Clock size={16} />
								{t("ensure.actions.startPrepare")}
							</motion.button>
						);
					} else if (row.status === STATUS.PREPARING) {
						actions.push(
							<motion.button
								key="prepare"
								whileHover={{ scale: 1.04 }}
								whileTap={{ scale: 0.96 }}
								className="px-3 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
								onClick={() => setPreparingOrder(row)}
							>
								<ScanLine size={16} />
								{t("ensure.actions.prepare")}
							</motion.button>
						);

						actions.push(
							<motion.button
								key="reject"
								whileHover={{ scale: 1.04 }}
								whileTap={{ scale: 0.96 }}
								className="px-3 h-9 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
								onClick={() => setRejectDialog({ open: true, order: row })}
							>
								<Ban size={16} />
								{t("ensure.actions.reject")}
							</motion.button>
						);
					} else if (row.status === STATUS.PREPARED) {
						actions.push(
							<motion.button
								key="distribute"
								whileHover={{ scale: 1.04 }}
								whileTap={{ scale: 0.96 }}
								className="px-3 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
								onClick={() => {
									setSelectedOrders([row.code]);
									setDistributionDialog(true);
								}}
							>
								<Truck size={16} />
								{t("ensure.actions.distribute")}
							</motion.button>
						);

						actions.push(
							<motion.button
								key="edit"
								whileHover={{ scale: 1.04 }}
								whileTap={{ scale: 0.96 }}
								className="px-3 h-9 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
								onClick={() => setPreparingOrder(row)}
							>
								<Edit size={16} />
								{t("ensure.actions.edit")}
							</motion.button>
						);
					} else if (row.status === STATUS.DISTRIBUTED) {
						actions.push(
							<motion.button
								key="view"
								whileHover={{ scale: 1.04 }}
								whileTap={{ scale: 0.96 }}
								className="px-3 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
								onClick={() => alert(t("ensure.actions.viewDetails"))}
							>
								<Eye size={16} />
								{t("ensure.actions.view")}
							</motion.button>
						);
					} else if (row.status === STATUS.REJECTED) {
						actions.push(
							<motion.button
								key="retry"
								whileHover={{ scale: 1.04 }}
								whileTap={{ scale: 0.96 }}
								className="px-3 h-9 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1"
								onClick={() => {
									updateOrder(row.code, {
										status: STATUS.PENDING,
										rejectReason: "",
										rejectedAt: ""
									});
									pushOp({
										id: `OP-${Date.now()}`,
										operationType: "RETRY_ORDER",
										orderCode: row.code,
										carrier: row.carrier || "-",
										employee: "System",
										result: "SUCCESS",
										details: t("ensure.actions.retryOrder"),
										createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
									});
								}}
							>
								<RefreshCw size={16} />
								{t("ensure.actions.retry")}
							</motion.button>
						);
					}

					return <div className="flex items-center gap-2 flex-wrap">{actions}</div>;
				},
			},
		],
		[t, selectedOrders, filtered]
	);

	// If preparing an order, show the prepare view
	if (preparingOrder) {
		return (
			<div
				className="min-h-screen !pb-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/20 dark:from-[#182337] dark:via-[#182337] dark:to-[#1a2744]"
				dir={dir}
			>
				<PrepareOrderView
					order={preparingOrder}
					onBack={() => setPreparingOrder(null)}
					updateOrder={updateOrder}
					pushOp={pushOp}
				/>
			</div>
		);
	}

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
			{activeTab === "logs" ? (
				<LogsTab opsLogs={opsLogs} orders={orders} />
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
									placeholder={t("ensure.toolbar.searchPlaceholder")}
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
									{t("ensure.toolbar.filter")}
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

								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => setDistributionDialog(true)}
									disabled={selectedOrders.length === 0}
									className={cn(
										"h-[40px] px-4 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all duration-300",
										selectedOrders.length === 0
											? "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed"
											: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-xl"
									)}
									type="button"
								>
									<Truck size={18} />
									{t("ensure.toolbar.distribute")}
								</motion.button>

								<Button
									variant="outline"
									className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 flex items-center gap-2 !px-4 rounded-full h-[40px]"
									onClick={() => alert(t("ensure.toolbar.exportDemo"))}
								>
									<FileDown size={18} className="text-[#A7A7A7]" />
									{t("ensure.toolbar.export")}
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
										<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
											{/* Carrier */}
											<div className="space-y-2">
												<Label className="text-xs font-semibold">{t("ensure.filterDialog.carrier")}</Label>
												<Select
													value={filters.carrier || "all"}
													onValueChange={(val) =>
														setFilters((f) => ({ ...f, carrier: val === "all" ? "" : val }))
													}
												>
													<SelectTrigger className="rounded-xl h-9 text-sm">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="all">{t("ensure.filterDialog.all")}</SelectItem>
														{uniqueCarriers.map((c) => (
															<SelectItem key={c} value={c}>
																{c}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{/* Date */}
											<div className="space-y-2">
												<Label className="text-xs font-semibold">{t("ensure.filterDialog.date")}</Label>
												<Input
													type="date"
													value={filters.date}
													onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
													className="rounded-xl h-9 text-sm"
												/>
											</div>

											{/* Product */}
											<div className="space-y-2">
												<Label className="text-xs font-semibold">{t("ensure.filterDialog.product")}</Label>
												<Input
													value={filters.product}
													onChange={(e) => setFilters((f) => ({ ...f, product: e.target.value }))}
													placeholder={t("ensure.filterDialog.productPlaceholder")}
													className="rounded-xl h-9 text-sm"
												/>
											</div>

											{/* Region */}
											<div className="space-y-2">
												<Label className="text-xs font-semibold">{t("ensure.filterDialog.region")}</Label>
												<Select
													value={filters.region || "all"}
													onValueChange={(val) =>
														setFilters((f) => ({ ...f, region: val === "all" ? "" : val }))
													}
												>
													<SelectTrigger className="rounded-xl h-9 text-sm">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="all">{t("ensure.filterDialog.all")}</SelectItem>
														{uniqueCities.map((city) => (
															<SelectItem key={city} value={city}>
																{city}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{/* Sent Status */}
											<div className="space-y-2">
												<Label className="text-xs font-semibold">{t("ensure.filterDialog.sent")}</Label>
												<Select
													value={filters.sent || "all"}
													onValueChange={(val) =>
														setFilters((f) => ({ ...f, sent: val === "all" ? "" : val }))
													}
												>
													<SelectTrigger className="rounded-xl h-9 text-sm">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="all">{t("ensure.filterDialog.all")}</SelectItem>
														<SelectItem value="sent">{t("ensure.filterDialog.sentYes")}</SelectItem>
														<SelectItem value="notSent">{t("ensure.filterDialog.sentNo")}</SelectItem>
													</SelectContent>
												</Select>
											</div>

											{/* Order Status */}
											<div className="space-y-2">
												<Label className="text-xs font-semibold">{t("ensure.filterDialog.orderStatus")}</Label>
												<Select
													value={filters.status || "all"}
													onValueChange={(val) =>
														setFilters((f) => ({ ...f, status: val === "all" ? "" : val }))
													}
												>
													<SelectTrigger className="rounded-xl h-9 text-sm">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="all">{t("ensure.filterDialog.all")}</SelectItem>
														{uniqueStatuses.map((st) => (
															<SelectItem key={st} value={st}>
																{st}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
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
													{t("ensure.filterDialog.clearAll")}
												</Button>
											</div>
										)}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Bulk Actions Bar */}
					<AnimatePresence>
						{selectedOrders.length > 0 && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="overflow-hidden"
							>
								<div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm p-4">
									<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
										<div className="flex items-center gap-2 text-sm font-semibold">
											<Layers className="w-4 h-4 text-[rgb(var(--primary))]" />
											{t("ensure.bulkBar.selected", { count: selectedOrders.length })}
										</div>
										<div className="flex items-center gap-2 flex-wrap">
											<Button
												variant="outline"
												size="sm"
												className="rounded-full"
												onClick={() => setDistributionDialog(true)}
											>
												<Truck className="w-4 h-4 mr-2" />
												{t("ensure.bulkActions.distribute")}
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
												onClick={handleBulkReject}
											>
												<Ban className="w-4 h-4 mr-2" />
												{t("ensure.bulkActions.reject")}
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="rounded-full"
												onClick={() => setSelectedOrders([])}
											>
												{t("ensure.bulkBar.clearSelection")}
											</Button>
										</div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

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
								<div className="font-semibold text-base mb-1">{t("ensure.empty.title")}</div>
								<div className="text-xs text-slate-500 dark:text-slate-300 max-w-md">
									{t("ensure.empty.description")}
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
								emptyState={t("ensure.empty.title")}
							/>
						</div>
					)}
				</div>
			)}

			{/* Dialogs */}
			<RejectDialog
				open={rejectDialog.open}
				onClose={() => setRejectDialog({ open: false, order: null })}
				order={rejectDialog.order}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/>

			<DistributionDialog
				open={distributionDialog}
				onClose={() => setDistributionDialog(false)}
				orders={orders}
				selectedOrderCodes={selectedOrders}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/>

			<ConfirmDialog
				open={confirmDialog.open}
				onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
				onConfirm={confirmDialog.onConfirm || (() => { })}
				title={confirmDialog.title}
				message={confirmDialog.message}
				confirmText={confirmDialog.confirmText}
				variant={confirmDialog.variant}
			/>
		</div>
	);
}