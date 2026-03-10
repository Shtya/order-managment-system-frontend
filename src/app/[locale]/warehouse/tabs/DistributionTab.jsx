// File: warehouse/tabs/DistributionTab.jsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
	Truck,
	Package,
	CheckCircle2,
	Ban,
	FileDown,
	Info,
	Store,
	ScanLine,
	X,
	MapPin,
	Phone,
	User,
	CreditCard,
	Tag,
	Clock,
	BarChart3,
	ShoppingBag,
	AlertCircle,
	Printer,
	TrendingUp,
	Hash,
	BoxSelect,
	Layers,
	Send,
} from "lucide-react";

import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import Table, { FilterField } from "@/components/atoms/Table";
import Button_ from "@/components/atoms/Button";
import PageHeader from "../../../../components/atoms/Pageheader";
import { STATUS, CARRIERS } from "./data";
import ActionButtons from "@/components/atoms/Actions";
import { RejectOrderModal } from "./PreparationTab";

// ─────────────────────────────────────────────
// CARRIER BRAND STYLES
// ─────────────────────────────────────────────
const CARRIER_STYLES = {
	ARAMEX: {
		bg: "bg-red-50 dark:bg-red-950/20",
		border: "border-red-200 dark:border-red-800",
		text: "text-red-700 dark:text-red-400",
		gradient: "from-red-500 to-red-600",
		glow: "shadow-red-200 dark:shadow-red-900/40",
	},
	SMSA: {
		bg: "bg-blue-50 dark:bg-blue-950/20",
		border: "border-blue-200 dark:border-blue-800",
		text: "text-blue-700 dark:text-blue-400",
		gradient: "from-blue-500 to-blue-600",
		glow: "shadow-blue-200 dark:shadow-blue-900/40",
	},
	DHL: {
		bg: "bg-yellow-50 dark:bg-yellow-950/20",
		border: "border-yellow-200 dark:border-yellow-800",
		text: "text-yellow-700 dark:text-yellow-400",
		gradient: "from-yellow-400 to-yellow-500",
		glow: "shadow-yellow-200 dark:shadow-yellow-900/40",
	},
	BOSTA: {
		bg: "bg-orange-50 dark:bg-orange-950/20",
		border: "border-orange-200 dark:border-orange-800",
		text: "text-orange-700 dark:text-orange-400",
		gradient: "from-orange-500 to-orange-600",
		glow: "shadow-orange-200 dark:shadow-orange-900/40",
	},
};

const CARRIER_META = {
	ARAMEX: { icon: Truck, color: "#ef4444", ...CARRIER_STYLES.ARAMEX },
	SMSA: { icon: Truck, color: "#3b82f6", ...CARRIER_STYLES.SMSA },
	DHL: { icon: Truck, color: "#eab308", ...CARRIER_STYLES.DHL },
	BOSTA: { icon: Truck, color: "#f97316", ...CARRIER_STYLES.BOSTA },
};

// ─────────────────────────────────────────────
// ORDER DETAIL MODAL — REDESIGNED
// ─────────────────────────────────────────────
function OrderDetailModal({ t, open, onClose, order }) {
	if (!order) return null;

	const infoRows = [
		{ label: t("field.customerName"), value: order.customer, icon: User, accent: "#ff6a1e" },
		{ label: t("field.phoneNumber"), value: order.phone, icon: Phone, accent: "#6763af" },
		{ label: t("field.city"), value: order.city, icon: MapPin, accent: "#ff6a1e" },
		{ label: t("field.area"), value: order.area, icon: MapPin, accent: "#ffb703" },
		{ label: t("field.store"), value: order.store, icon: Store, accent: "#6763af" },
		{ label: t("field.carrier"), value: order.carrier || t("common.notSpecified"), icon: Truck, accent: "#ff5c2b" },
		{ label: t("field.trackingCode"), value: order.trackingCode || t("common.none"), icon: Hash, accent: "#6763af" },
		{
			label: t("field.paymentType"),
			value: order.paymentType === "COD" ? t("payment.cod") : t("payment.paid"),
			icon: CreditCard,
			accent: order.paymentType === "COD" ? "#ffb703" : "#10b981",
		},
		{ label: t("field.total"), value: `${order.total} ر.س`, icon: TrendingUp, accent: "#10b981" },
		{ label: t("field.shippingCost"), value: `${order.shippingCost} ر.س`, icon: Truck, accent: "#ff6a1e" },
		{
			label: t("field.allowOpenPackage"),
			value: order.allowOpenPackage ? t("value.allowed") : t("value.notAllowed"),
			icon: Package,
			accent: order.allowOpenPackage ? "#10b981" : "#ef4444",
		},
		{
			label: t("field.allowReturn"),
			value: order.allowReturn ? t("value.allowed") : t("value.notAllowed"),
			icon: BoxSelect,
			accent: order.allowReturn ? "#10b981" : "#ef4444",
		},
	];

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl"
				dir="rtl"
			>
				{/* Header with gradient */}
				<div
					className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden bg-primary ">
					{/* Decorative circles */}
					<div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/10" />
					<div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/10" />

					<div className="relative flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
								<Package className="text-white" size={22} />
							</div>
							<div>
								<p className="text-white/70 text-xs font-medium mb-0.5">{t("modal.orderDetailsTitle", { code: "" })}</p>
								<h2 className="text-white text-xl font-bold font-mono">{order.code}</h2>
							</div>
						</div>
						<button
							onClick={onClose}
							className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
						>
							<X size={16} className="text-white" />
						</button>
					</div>

					{/* Status badge */}
					<div className="relative mt-4 flex items-center gap-2">
						<span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
							<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
							{order.carrier ? order.carrier : t("stats.withoutCarrier")}
						</span>
						<span
							className={cn(
								"inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full",
								order.paymentType === "COD"
									? "bg-yellow-400/30 text-white border border-yellow-300/40"
									: "bg-green-400/30 text-white border border-green-300/40"
							)}
						>
							<CreditCard size={11} />
							{order.paymentType === "COD" ? t("payment.cod") : t("payment.paid")}
						</span>
					</div>
				</div>

				<div className="p-6 space-y-5">
					{/* Info grid */}
					<div className="grid grid-cols-2 gap-2.5">
						{infoRows.map(({ label, value, icon: Icon, accent }) => (
							<div
								key={label}
								className="group flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-3 transition-colors"
							>
								<div
									className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
									style={{ backgroundColor: accent + "18" }}
								>
									<Icon size={13} style={{ color: accent }} />
								</div>
								<div className="min-w-0">
									<p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 font-medium">{label}</p>
									<p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{value}</p>
								</div>
							</div>
						))}
					</div>

					{/* Products section */}
					<div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
						<div
							className="px-4 py-2.5 flex items-center gap-2"
							style={{ background: "linear-gradient(90deg, #6763af15 0%, transparent 100%)" }}
						>
							<ShoppingBag size={14} style={{ color: "#6763af" }} />
							<span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
								{t("section.products")}
							</span>
							<span className="ml-auto text-xs font-semibold text-slate-400">
								{order.products?.length || 0} {t("common.items") || "عنصر"}
							</span>
						</div>
						<div className="divide-y divide-slate-100 dark:divide-slate-700/60">
							{order.products?.map((p, i) => (
								<motion.div
									key={i}
									initial={{ opacity: 0, x: -8 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: i * 0.04 }}
									className="flex items-center gap-3 px-4 py-3"
								>
									<div
										className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
										style={{ backgroundColor: "#ff6a1e18", color: "#ff6a1e" }}
									>
										{i + 1}
									</div>
									<span
										className="font-mono text-[11px] px-2 py-0.5 rounded-md font-bold"
										style={{ backgroundColor: "#6763af12", color: "#6763af" }}
									>
										{p.sku}
									</span>
									<span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">{p.name}</span>
									<span className="text-xs text-slate-400 font-mono">×{p.requestedQty}</span>
									<span className="font-bold text-sm" style={{ color: "#ff6a1e" }}>
										{(Number(p.price) || 0) * (Number(p.requestedQty) || 0)} ر.س
									</span>
								</motion.div>
							))}
						</div>
					</div>

					{/* Notes */}
					{!!order.notes && (
						<div
							className="rounded-xl p-4 border"
							style={{ backgroundColor: "#ffb70310", borderColor: "#ffb70340" }}
						>
							<div className="flex items-center gap-2 mb-2">
								<AlertCircle size={14} style={{ color: "#ffb703" }} />
								<p className="text-xs font-bold" style={{ color: "#ff6a1e" }}>
									{t("section.notes")}
								</p>
							</div>
							<p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{order.notes}</p>
						</div>
					)}

					<div className="flex justify-end pt-1">
						<Button
							variant="outline"
							onClick={onClose}
							className="rounded-xl border-slate-200 hover:border-slate-300 text-slate-600"
						>
							{t("common.close")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─────────────────────────────────────────────
// ASSIGN CARRIER DIALOG — REDESIGNED
// ─────────────────────────────────────────────
function AssignCarrierDialog({ t, open, onClose, orders, selectedOrderCodes, updateOrder, pushOp }) {
	const [selectedOrders, setSelectedOrders] = useState([]);
	const [carrier, setCarrier] = useState("");
	const [loading, setLoading] = useState(false);

	const availableOrders = useMemo(
		() => orders.filter((o) => selectedOrderCodes.includes(o.code)),
		[orders, selectedOrderCodes]
	);

	useEffect(() => {
		if (!open) return;
		setSelectedOrders(availableOrders.map((o) => o.code));
		setCarrier("");
	}, [open, availableOrders]);

	const toggleOrder = (code) =>
		setSelectedOrders((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

	const handleAssign = async () => {
		if (!carrier || selectedOrders.length === 0) return;
		setLoading(true);
		try {
			selectedOrders.forEach((code) => {
				updateOrder(code, {
					carrier,
					distributedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
				});
				pushOp({
					id: `OP-${Date.now()}-${code}`,
					operationType: "ASSIGN_CARRIER",
					orderCode: code,
					carrier,
					employee: "System",
					result: "SUCCESS",
					details: `Carrier assigned: ${carrier}`,
					createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
				});
			});
			onClose();
		} finally {
			setLoading(false);
		}
	};

	const selectedCarrierStyle = carrier ? CARRIER_STYLES[carrier] : null;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl"
				dir="rtl"
			>
				{/* Header */}
				<div
					className="relative px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden bg-primary"
				>
					<div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
					<div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />

					<div className="relative flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
								<Layers className="text-white" size={22} />
							</div>
							<div>
								<p className="text-white/70 text-xs font-medium mb-0.5">{t("modal.assignCarrierSubtitle") || "توزيع الطلبات"}</p>
								<h2 className="text-white text-xl font-bold">{t("modal.assignCarrierTitle")}</h2>
							</div>
						</div>
						<button
							onClick={onClose}
							className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
						>
							<X size={16} className="text-white" />
						</button>
					</div>

					{/* Progress indicator */}
					<div className="relative mt-4 flex items-center gap-3">
						<div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
							<Send size={12} className="text-white/80" />
							<span className="text-white/90 text-xs font-medium">
								{selectedOrders.length} {t("assign.ordersSelected") || "طلب محدد"}
							</span>
						</div>
						{carrier && (
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5"
							>
								<Truck size={12} className="text-white/80" />
								<span className="text-white/90 text-xs font-medium">{carrier}</span>
							</motion.div>
						)}
					</div>
				</div>

				<div className="p-6 space-y-5">

					<div className="space-y-3">
						<Label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
							<Truck size={14} style={{ color: "#ff8b00" }} />
							{t("assign.requiredCarrier")}
							<span className="text-red-500">*</span>
						</Label>

						<div className="grid grid-cols-4 gap-2">
							{CARRIERS.map((c) => {
								const CARRIER_COLORS = {
									ARAMEX: { color: "#ef4444" },
									SMSA: { color: "#3b82f6" },
									DHL: { color: "#eab308" },
									BOSTA: { color: "#f97316" },
								};
								const { color } = CARRIER_COLORS[c];
								const isSelected = carrier === c;

								return (
									<motion.button
										key={c}
										type="button"
										onClick={() => setCarrier(c)}
										whileTap={{ scale: 0.96 }}
										className={cn(
											"relative flex flex-col items-center gap-2 py-3.5 rounded-2xl border-2 transition-all duration-200",
											isSelected
												? "border-transparent"
												: "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-600"
										)}
										style={
											isSelected
												? { backgroundColor: color + "12", borderColor: color + "60" }
												: {}
										}
									>
										<span
											className="text-xs font-bold tracking-wide transition-colors duration-200"
											style={{ color: isSelected ? color : "#64748b" }}
										>
											{c}
										</span>
									</motion.button>
								);
							})}
						</div>
					</div>

					{/* Orders list */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
								<Package size={14} style={{ color: "#6763af" }} />
								{t("assign.selectedOrders")}
							</Label>
							<span
								className="text-xs font-semibold px-2.5 py-1 rounded-full"
								style={{ backgroundColor: "#6763af18", color: "#6763af" }}
							>
								{t("common.selectedCount", { count: selectedOrders.length })}
							</span>
						</div>

						<div className="max-h-[260px] overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
							{availableOrders.map((order) => {
								const isChecked = selectedOrders.includes(order.code);
								return (
									<motion.div
										key={order.code}
										whileHover={{ scale: 1.01 }}
										className={cn(
											"flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
											isChecked
												? "bg-white dark:bg-slate-900 border-[#ff6a1e]/40 shadow-sm"
												: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300"
										)}
										onClick={() => toggleOrder(order.code)}
									>
										<div
											className={cn(
												"w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
												isChecked ? "border-[#ff6a1e] bg-[#ff6a1e]" : "border-slate-300 dark:border-slate-600"
											)}
										>
											{isChecked && <CheckCircle2 size={12} className="text-white" />}
										</div>

										<div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
											style={{ backgroundColor: "#ff6a1e12" }}>
											<Package size={14} style={{ color: "#ff6a1e" }} />
										</div>

										<div className="flex-1 min-w-0">
											<p className="font-mono font-bold text-sm" style={{ color: "#ff6a1e" }}>
												{order.code}
											</p>
											<p className="text-xs text-slate-500 truncate">
												{order.customer} — {order.city}
											</p>
										</div>

										<div className="text-left flex-shrink-0">
											<p className="font-bold text-sm text-emerald-600">{order.total} ر.س</p>
											{order.carrier && (
												<span
													className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
													style={{ backgroundColor: "#6763af18", color: "#6763af" }}
												>
													{order.carrier}
												</span>
											)}
										</div>
									</motion.div>
								);
							})}

							{availableOrders.length === 0 && (
								<div className="text-center py-8">
									<Package size={32} className="text-slate-300 mx-auto mb-2" />
									<p className="text-slate-400 text-sm">{t("assign.noOrders")}</p>
								</div>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
						<Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
							{t("common.cancel")}
						</Button>
						<motion.button
							onClick={handleAssign}
							disabled={loading || !carrier || selectedOrders.length === 0}
							whileHover={!loading && carrier && selectedOrders.length > 0 ? { scale: 1.02 } : {}}
							whileTap={!loading && carrier && selectedOrders.length > 0 ? { scale: 0.98 } : {}}
							className={cn(
								"flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all",
								loading || !carrier || selectedOrders.length === 0
									? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
									: "shadow-lg"
							)}
							style={
								!loading && carrier && selectedOrders.length > 0
									? { background: "linear-gradient(135deg, #ff6a1e 0%, #ff5c2b 100%)" }
									: {}
							}
						>
							{loading ? (
								<>
									<span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
									{t("assign.assigning")}
								</>
							) : (
								<>
									<Send size={15} />
									{t("assign.assign")}
								</>
							)}
						</motion.button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}



// ─────────────────────────────────────────────
// UNASSIGNED SUBTAB
// ─────────────────────────────────────────────
function UnassignedOrdersSubtab({ t, orders, updateOrder, pushOp }) {
	const unassigned = useMemo(
		() => orders.filter((o) => o.status === STATUS.CONFIRMED && !o.carrier),
		[orders]
	);

	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState({
		store: "all",
		paymentType: "all",
		carrier: "all",
		date: "",
		productName: "",
		region: "all",
	});

	const [selectedOrders, setSelectedOrders] = useState([]);
	const [assignDialog, setAssignDialog] = useState({ open: false, codes: [] });
	const [cancelModal, setCancelModal] = useState({ open: false, code: "" });
	const [detailModal, setDetailModal] = useState(null);
	const [page, setPage] = useState({ current_page: 1, per_page: 12 });

	const stores = useMemo(() => [...new Set(unassigned.map((o) => o.store))], [unassigned]);
	const regions = useMemo(() => [...new Set(unassigned.map((o) => o.region || o.city))], [unassigned]);
	const products = useMemo(() => {
		const allProducts = unassigned.flatMap((o) => o.products?.map((p) => p.name) || []);
		return [...new Set(allProducts)];
	}, [unassigned]);

	useEffect(() => {
		setFilters({ store: "all", paymentType: "all", carrier: "all", date: "", productName: "", region: "all" });
		setSearch("");
	}, []);

	const filtered = useMemo(() => {
		let base = unassigned;
		const q = search.trim().toLowerCase();
		if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city, o.store].some((x) => String(x || "").toLowerCase().includes(q)));
		if (filters.store !== "all") base = base.filter((o) => o.store === filters.store);
		if (filters.paymentType !== "all") base = base.filter((o) => o.paymentType === filters.paymentType);
		if (filters.region !== "all") base = base.filter((o) => (o.region || o.city) === filters.region);
		if (filters.carrier !== "all") {
			if (filters.carrier === "none") base = base.filter((o) => !o.carrier);
			else base = base.filter((o) => o.carrier === filters.carrier);
		}
		if (filters.date) base = base.filter((o) => o.orderDate === filters.date);
		if (filters.productName) base = base.filter((o) => o.products?.some((p) => String(p.name || "").includes(filters.productName)));
		return base;
	}, [unassigned, search, filters]);

	const toggleOrder = (code) =>
		setSelectedOrders((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

	const selectAll = () => {
		const codes = filtered.map((o) => o.code);
		setSelectedOrders(selectedOrders.length === codes.length ? [] : codes);
	};

	const hasActiveFilters =
		filters.store !== "all" || filters.paymentType !== "all" || filters.carrier !== "all" ||
		filters.region !== "all" || !!filters.date || !!filters.productName;

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<div className="flex items-center justify-center">
						<Checkbox checked={filtered.length > 0 && selectedOrders.length === filtered.length} onCheckedChange={selectAll} />
					</div>
				),
				className: "w-[48px]",
				cell: (row) => (
					<div className="flex items-center justify-center">
						<Checkbox checked={selectedOrders.includes(row.code)} onCheckedChange={() => toggleOrder(row.code)} />
					</div>
				),
			},
			{
				key: "code",
				header: t("field.orderCode"),
				cell: (row) => <span className="font-mono font-bold text-[#ff6a1e] dark:text-[#ffb703]">{row.code}</span>,
			},
			{ key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
			{ key: "phone", header: t("field.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm" dir="ltr">{row.phone}</span> },
			{ key: "city", header: t("field.city") },
			{ key: "area", header: t("field.area") },
			{
				key: "store",
				header: t("field.store"),
				cell: (row) => (
					<div className="flex items-center gap-1.5">
						<Store className="w-3.5 h-3.5 text-slate-400" />
						<span className="text-sm">{row.store}</span>
					</div>
				),
			},
			{
				key: "total",
				header: t("field.total"),
				cell: (row) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{row.total} ر.س</span>,
			},
			{
				key: "paymentType",
				header: t("field.payment"),
				cell: (row) => (
					<Badge className={cn("rounded-full text-xs border", row.paymentType === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
						{row.paymentType === "PAID" ? t("payment.paid") : t("payment.cod")}
					</Badge>
				),
			},
			{
				key: "orderDate",
				header: t("field.orderDate"),
				cell: (row) => <span className="text-sm text-slate-500">{row.orderDate}</span>,
			},
			{
				key: "actions",
				header: t("field.actions"),
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <Info />,
								tooltip: t("tooltip.details"),
								onClick: (r) => setDetailModal(r),
								variant: "purple",
							},
							{
								icon: <Truck />,
								tooltip: row.carrier ? t("tooltip.changeAssign") : t("tooltip.assign"),
								onClick: (r) => setAssignDialog({ open: true, codes: [r.code] }),
								variant: "orange",
							},
							{
								icon: <Ban />,
								tooltip: t("tooltip.reject"),
								onClick: (r) => setCancelModal({ open: true, code: r.code }),
								variant: "red",
							},
						]}
					/>
				),
			},
		],
		[t, filtered, selectedOrders]
	);

	return (
		<div className="space-y-4">
			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={() => { }}
				labels={{
					searchPlaceholder: t("table.searchUnassigned"),
					filter: t("common.filter"),
					apply: t("common.apply"),
					total: t("common.total"),
					limit: t("common.limit"),
					emptyTitle: t("table.emptyUnassignedTitle"),
					emptySubtitle: "",
				}}
				actions={[
					{
						key: "assign",
						label: t("action.assignSelected", { count: selectedOrders.length }),
						icon: <Truck size={14} />,
						color: "emerald",
						onClick: () => selectedOrders.length > 0 && setAssignDialog({ open: true, codes: selectedOrders }),
						disabled: selectedOrders.length === 0,
					},
					{
						key: "export",
						label: t("common.export"),
						icon: <FileDown size={14} />,
						color: "blue",
						onClick: () => { },
					},
				]}
				hasActiveFilters={hasActiveFilters}
				onApplyFilters={() => { }}
				filters={
					<>
						<FilterField label={t("field.store")}>
							<Select value={filters.store} onValueChange={(v) => setFilters((f) => ({ ...f, store: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allStores")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allStores")}</SelectItem>
									{stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.paymentType")}>
							<Select value={filters.paymentType} onValueChange={(v) => setFilters((f) => ({ ...f, paymentType: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.all")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.all")}</SelectItem>
									<SelectItem value="COD">{t("payment.cod")}</SelectItem>
									<SelectItem value="PAID">{t("payment.paid")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.region")}>
							<Select value={filters.region} onValueChange={(v) => setFilters((f) => ({ ...f, region: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allRegions")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allRegions")}</SelectItem>
									{regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.productName")}>
							<Select value={filters.productName} onValueChange={(v) => setFilters((f) => ({ ...f, productName: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allProducts")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allProducts")}</SelectItem>
									{products.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.carrier")}>
							<Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allCarriers")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allCarriers")}</SelectItem>
									<SelectItem value="none">{t("stats.withoutCarrier")}</SelectItem>
									{CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.date")}>
							<Input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl text-sm" />
						</FilterField>
					</>
				}
				columns={columns}
				data={filtered}
				isLoading={false}
				pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
				onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
			/>

			<AssignCarrierDialog t={t} open={assignDialog.open} onClose={() => setAssignDialog({ open: false, codes: [] })} orders={orders} selectedOrderCodes={assignDialog.codes} updateOrder={updateOrder} pushOp={pushOp} />
			<RejectOrderModal open={!!cancelModal.open} onClose={() => setCancelModal({ open: false, code: "" })} order={cancelModal.code} onConfirm={updateOrder} />
			<OrderDetailModal t={t} open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
		</div>
	);
}

// ─────────────────────────────────────────────
// ASSIGNED SUBTAB
// ─────────────────────────────────────────────
function AssignedOrdersSubtab({ t, orders, updateOrder, pushOp }) {
	const assigned = useMemo(() => orders.filter((o) => o.status === STATUS.CONFIRMED && !!o.carrier), [orders]);
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState({ carrier: "all", store: "all", paymentType: "all", date: "", productName: "", region: "all" });
	const [detailModal, setDetailModal] = useState(null);
	const [assignDialog, setAssignDialog] = useState({ open: false, codes: [] });
	const [cancelModal, setCancelModal] = useState({ open: false, code: "" });
	const [page, setPage] = useState({ current_page: 1, per_page: 12 });

	const stores = useMemo(() => [...new Set(assigned.map((o) => o.store))], [assigned]);
	const regions = useMemo(() => [...new Set(assigned.map((o) => o.region || o.city))], [assigned]);
	const products = useMemo(() => [...new Set(assigned.flatMap((o) => o.products?.map((p) => p.name) || []))], [assigned]);

	useEffect(() => {
		setFilters({ carrier: "all", store: "all", paymentType: "all", date: "", productName: "", region: "all" });
		setSearch("");
	}, []);

	const filtered = useMemo(() => {
		let base = assigned;
		const q = search.trim().toLowerCase();
		if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city, o.carrier, o.store].some((x) => String(x || "").toLowerCase().includes(q)));
		if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
		if (filters.store !== "all") base = base.filter((o) => o.store === filters.store);
		if (filters.paymentType !== "all") base = base.filter((o) => o.paymentType === filters.paymentType);
		if (filters.region !== "all") base = base.filter((o) => (o.region || o.city) === filters.region);
		if (filters.date) base = base.filter((o) => o.orderDate === filters.date);
		if (filters.productName) base = base.filter((o) => o.products?.some((p) => String(p.name || "").includes(filters.productName)));
		return base;
	}, [assigned, search, filters]);

	const hasActiveFilters = filters.carrier !== "all" || filters.store !== "all" || filters.paymentType !== "all" || filters.region !== "all" || !!filters.date || !!filters.productName;

	const columns = useMemo(
		() => [
			{ key: "code", header: t("field.orderCode"), cell: (row) => <span className="font-mono font-bold text-[#ff6a1e] dark:text-[#ffb703]">{row.code}</span> },
			{ key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
			{ key: "phone", header: t("field.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm" dir="ltr">{row.phone}</span> },
			{ key: "city", header: t("field.city") },
			{ key: "area", header: t("field.area") },
			{
				key: "carrier",
				header: t("field.carrier"),
				cell: (row) => {
					const s = CARRIER_STYLES[row.carrier] || {};
					return (
						<span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", s.bg, s.border, s.text)}>
							<Truck size={12} />{row.carrier}
						</span>
					);
				},
			},
			{
				key: "trackingCode",
				header: t("field.trackingCode"),
				cell: (row) => row.trackingCode ? (
					<span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{row.trackingCode}</span>
				) : <span className="text-slate-400">{t("common.none")}</span>,
			},
			{ key: "distributedAt", header: t("field.distributedAt"), cell: (row) => <span className="text-sm text-slate-500">{row.distributedAt || t("common.none")}</span> },
			{ key: "total", header: t("field.total"), cell: (row) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{row.total} ر.س</span> },
			{
				key: "actions",
				header: t("field.actions"),
				cell: (row) => (
					<ActionButtons
						row={row}
						actions={[
							{
								icon: <Info />,
								tooltip: t("tooltip.details"),
								onClick: (r) => setDetailModal(r),
								variant: "purple",
							},
							{
								icon: <Truck />,
								tooltip: t("tooltip.changeAssign"),
								onClick: (r) => setAssignDialog({ open: true, codes: [r.code] }),
								variant: "orange",
							},
							{
								icon: <Ban />,
								tooltip: t("tooltip.reject"),
								onClick: (r) => setCancelModal({ open: true, code: r.code }),
								variant: "red",
							},
						]}
					/>
				),
			},
		],
		[t]
	);

	return (
		<div className="space-y-4">
			<Table
				searchValue={search} onSearchChange={setSearch} onSearch={() => { }}
				labels={{ searchPlaceholder: t("table.searchAssigned"), filter: t("common.filter"), apply: t("common.apply"), total: t("common.total"), limit: t("common.limit"), emptyTitle: t("table.emptyAssignedTitle"), emptySubtitle: "" }}
				actions={[{ key: "export", label: t("common.export"), icon: <FileDown size={14} />, color: "blue", onClick: () => { } }]}
				hasActiveFilters={hasActiveFilters} onApplyFilters={() => { }}
				filters={
					<>
						<FilterField label={t("field.carrier")}>
							<Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allCarriers")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allCarriers")}</SelectItem>
									{CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.store")}>
							<Select value={filters.store} onValueChange={(v) => setFilters((f) => ({ ...f, store: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allStores")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allStores")}</SelectItem>
									{stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.region")}>
							<Select value={filters.region} onValueChange={(v) => setFilters((f) => ({ ...f, region: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allRegions")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allRegions")}</SelectItem>
									{regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.productName")}>
							<Select value={filters.productName} onValueChange={(v) => setFilters((f) => ({ ...f, productName: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allProducts")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allProducts")}</SelectItem>
									{products.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.paymentType")}>
							<Select value={filters.paymentType} onValueChange={(v) => setFilters((f) => ({ ...f, paymentType: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.all")} /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.all")}</SelectItem>
									<SelectItem value="COD">{t("payment.cod")}</SelectItem>
									<SelectItem value="PAID">{t("payment.paid")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>
						<FilterField label={t("field.date")}>
							<Input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl text-sm" />
						</FilterField>
					</>
				}
				columns={columns} data={filtered} isLoading={false}
				pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
				onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
			/>

			<AssignCarrierDialog t={t} open={assignDialog.open} onClose={() => setAssignDialog({ open: false, codes: [] })} orders={orders} selectedOrderCodes={assignDialog.codes} updateOrder={updateOrder} pushOp={pushOp} />
			<RejectOrderModal open={!!cancelModal.open} onClose={() => setCancelModal({ open: false, code: "" })} order={cancelModal.code} onConfirm={updateOrder} />

			{/* <CancelOrderModal t={t} open={cancelModal.open} onClose={() => setCancelModal({ open: false, code: "" })} prefilledCode={cancelModal.code} updateOrder={updateOrder} pushOp={pushOp} /> */}
			<OrderDetailModal t={t} open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
		</div>
	);
}

// ─────────────────────────────────────────────
// MAIN TAB
// ─────────────────────────────────────────────
export default function DistributionTab({ orders, updateOrder, pushOp, subtab, setSubtab }) {
	const t = useTranslations("warehouse.distribution");

	const confirmedOrders = useMemo(() => orders.filter((o) => o.status === STATUS.CONFIRMED), [orders]);
	const unassigned = confirmedOrders.filter((o) => !o.carrier);
	const assigned = confirmedOrders.filter((o) => !!o.carrier);
	const readyToPrint = assigned.filter((o) => !o.labelPrinted);

	const [assignAllOpen, setAssignAllOpen] = useState(false);

	// Stats with icons and brand colors
	const stats = [
		{
			id: "total-confirmed",
			name: t("stats.totalConfirmed"),
			value: confirmedOrders.length,
			icon: CheckCircle2,
			color: "#10b981",
			bgColor: "#10b98115",
			sortOrder: 0,
		},
		{
			id: "without-carrier",
			name: t("stats.withoutCarrier"),
			value: unassigned.length,
			icon: AlertCircle,
			color: "#ffb703",
			bgColor: "#ffb70315",
			sortOrder: 1,
		},
		{
			id: "with-carrier",
			name: t("stats.withCarrier"),
			value: assigned.length,
			icon: Truck,
			color: "#6763af",
			bgColor: "#6763af15",
			sortOrder: 2,
		},
		{
			id: "ready-to-print",
			name: t("stats.readyToPrint"),
			value: readyToPrint.length,
			icon: Printer,
			color: "#ff6a1e",
			bgColor: "#ff6a1e15",
			sortOrder: 3,
		},
	];

	const statsAssignOrders = useMemo(() => {
		const base = orders.filter((o) => o.status === STATUS.CONFIRMED && !!o.carrier);
		return CARRIERS.map((carrier) => {
			const meta = CARRIER_META[carrier] || { icon: Truck, color: "#64748b" };
			const list = base.filter((o) => o.carrier === carrier);
			return {
				id: `carrier-${carrier}`,
				name: carrier,
				icon: meta.icon,
				color: meta.color,
				bgColor: meta.color + "15",
				value: list.length,
			};
		});
	}, [orders]);

	return (
		<div className="space-y-4">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumbs.home"), href: "/" },
					{ name: t("breadcrumbs.orders"), href: "/orders" },
					{ name: t("breadcrumbs.distribution") },
				]}
				buttons={
					<>
						<Button_
							size="sm"
							label={t("header.howItWorks")}
							variant="ghost"
							onClick={() => { }}
							icon={<Info size={18} />}
						/>
					</>
				}
				stats={subtab === "unassigned" ? stats : statsAssignOrders}
				items={[
					{ id: "unassigned", label: t("tabs.unassigned"), count: unassigned.length, icon: AlertCircle },
					{ id: "assigned", label: t("tabs.assigned"), count: assigned.length, icon: Truck },
				]}
				active={subtab}
				setActive={setSubtab}
			/>

			<AssignCarrierDialog
				t={t}
				open={assignAllOpen}
				onClose={() => setAssignAllOpen(false)}
				orders={orders}
				selectedOrderCodes={unassigned.map((o) => o.code)}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/>

			<AnimatePresence mode="wait">
				<motion.div
					key={subtab}
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.15 }}
				>
					{subtab === "unassigned" && (
						<UnassignedOrdersSubtab t={t} orders={orders} updateOrder={updateOrder} pushOp={pushOp} />
					)}
					{subtab === "assigned" && (
						<AssignedOrdersSubtab t={t} orders={orders} updateOrder={updateOrder} pushOp={pushOp} />
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}