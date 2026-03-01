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

// ─────────────────────────────────────────────
// CARRIER BRAND STYLES
// ─────────────────────────────────────────────
const CARRIER_STYLES = {
	ARAMEX: {
		bg: "bg-red-50 dark:bg-red-950/20",
		border: "border-red-200 dark:border-red-800",
		text: "text-red-700 dark:text-red-400",
	},
	SMSA: {
		bg: "bg-blue-50 dark:bg-blue-950/20",
		border: "border-blue-200 dark:border-blue-800",
		text: "text-blue-700 dark:text-blue-400",
	},
	DHL: {
		bg: "bg-yellow-50 dark:bg-yellow-950/20",
		border: "border-yellow-200 dark:border-yellow-800",
		text: "text-yellow-700 dark:text-yellow-400",
	},
	BOSTA: {
		bg: "bg-orange-50 dark:bg-orange-950/20",
		border: "border-orange-200 dark:border-orange-800",
		text: "text-orange-700 dark:text-orange-400",
	},
};

// Carrier meta for stats cards (icon + color per carrier)
const CARRIER_META = {
	ARAMEX: { icon: Truck, color: "#ef4444", ...CARRIER_STYLES.ARAMEX },
	SMSA: { icon: Truck, color: "#3b82f6", ...CARRIER_STYLES.SMSA },
	DHL: { icon: Truck, color: "#eab308", ...CARRIER_STYLES.DHL },
	BOSTA: { icon: Truck, color: "#f97316", ...CARRIER_STYLES.BOSTA },
};

// ─────────────────────────────────────────────
// ORDER DETAIL MODAL
// ─────────────────────────────────────────────
function OrderDetailModal({ t, open, onClose, order }) {
	if (!order) return null;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto"
				dir="rtl"
			>
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<Package className="text-[#ff8b00] dark:text-[#5b4bff]" size={22} />
						{t("modal.orderDetailsTitle", { code: order.code })}
					</DialogTitle>
				</DialogHeader>

				<div className="pt-3 space-y-4">
					<div className="grid grid-cols-2 gap-3">
						{[
							{ label: t("field.customerName"), value: order.customer },
							{ label: t("field.phoneNumber"), value: order.phone },
							{ label: t("field.city"), value: order.city },
							{ label: t("field.area"), value: order.area },
							{ label: t("field.store"), value: order.store },
							{ label: t("field.carrier"), value: order.carrier || t("common.notSpecified") },
							{ label: t("field.trackingCode"), value: order.trackingCode || t("common.none") },
							{
								label: t("field.paymentType"),
								value: order.paymentType === "COD" ? t("payment.cod") : t("payment.paid"),
							},
							{ label: t("field.total"), value: `${order.total} ر.س` },
							{ label: t("field.shippingCost"), value: `${order.shippingCost} ر.س` },
							{
								label: t("field.allowOpenPackage"),
								value: order.allowOpenPackage ? t("value.allowed") : t("value.notAllowed"),
							},
							{
								label: t("field.allowReturn"),
								value: order.allowReturn ? t("value.allowed") : t("value.notAllowed"),
							},
						].map(({ label, value }) => (
							<div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
								<p className="text-xs text-slate-400 mb-1">{label}</p>
								<p className="font-semibold text-sm">{value}</p>
							</div>
						))}
					</div>

					<div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
						<p className="text-xs text-slate-400 mb-3 font-semibold">{t("section.products")}</p>
						<div className="space-y-2">
							{order.products?.map((p, i) => (
								<div key={i} className="flex items-center justify-between text-sm">
									<span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
										{p.sku}
									</span>
									<span className="flex-1 mx-3">{p.name}</span>
									<span className="text-slate-500">×{p.requestedQty}</span>
									<span className="font-semibold ms-4">
										{(Number(p.price) || 0) * (Number(p.requestedQty) || 0)} ر.س
									</span>
								</div>
							))}
						</div>
					</div>

					{!!order.notes && (
						<div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-3">
							<p className="text-xs text-amber-600 mb-1 font-semibold">{t("section.notes")}</p>
							<p className="text-sm text-amber-800 dark:text-amber-200">{order.notes}</p>
						</div>
					)}

					<div className="flex justify-end">
						<Button variant="outline" onClick={onClose}>
							{t("common.close")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─────────────────────────────────────────────
// ASSIGN CARRIER DIALOG
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

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto"
				dir="rtl"
			>
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<Truck className="text-[#ff8b00] dark:text-[#5b4bff]" size={22} />
						{t("modal.assignCarrierTitle")}
					</DialogTitle>
				</DialogHeader>

				<div className="p-6 space-y-5">
					<div className="space-y-2">
						<Label>
							{t("assign.requiredCarrier")} <span className="text-red-500">*</span>
						</Label>

						<div className="grid grid-cols-4 gap-2">
							{CARRIERS.map((c) => {
								const s = CARRIER_STYLES[c] || {};
								return (
									<button
										key={c}
										type="button"
										onClick={() => setCarrier(c)}
										className={cn(
											"py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-1.5",
											carrier === c
												? "bg-[#ff8b00] text-white border-[#ff8b00] shadow-md"
												: cn(
													"border-slate-200 text-slate-600 hover:border-[#ff8b00]/50 dark:border-slate-700 dark:text-slate-300",
													s.bg
												)
										)}
									>
										<Truck size={13} />
										{c}
									</button>
								);
							})}
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>{t("assign.selectedOrders")}</Label>
							<span className="text-xs text-slate-500">{t("common.selectedCount", { count: selectedOrders.length })}</span>
						</div>

						<div className="max-h-[280px] overflow-y-auto space-y-2 bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
							{availableOrders.map((order) => (
								<motion.div
									key={order.code}
									whileHover={{ scale: 1.01 }}
									className={cn(
										"flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
										selectedOrders.includes(order.code)
											? "bg-[#ff8b00]/10 border-[#ff8b00] dark:border-[#5b4bff]"
											: "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
									)}
									onClick={() => toggleOrder(order.code)}
								>
									<Checkbox checked={selectedOrders.includes(order.code)} onCheckedChange={() => toggleOrder(order.code)} />
									<div className="flex-1">
										<p className="font-semibold text-sm">{order.code}</p>
										<p className="text-xs text-gray-500">
											{order.customer} — {order.city}
										</p>
									</div>

									{order.carrier && (
										<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
											{order.carrier}
										</span>
									)}
								</motion.div>
							))}

							{availableOrders.length === 0 && (
								<p className="text-center text-slate-400 text-sm py-4">{t("assign.noOrders")}</p>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" onClick={onClose} disabled={loading}>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={handleAssign}
							disabled={loading || !carrier || selectedOrders.length === 0}
							className="bg-[#ff8b00] hover:bg-[#e07a00] text-white dark:bg-[#5b4bff] dark:hover:bg-[#4a3de0]"
						>
							{loading ? t("assign.assigning") : t("assign.assign")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─────────────────────────────────────────────
// CANCEL / REJECT ORDER MODAL
// ─────────────────────────────────────────────
function CancelOrderModal({ t, open, onClose, prefilledCode, updateOrder, pushOp }) {
	const [code, setCode] = useState("");
	const [reason, setReason] = useState("");
	const [scanning, setScanning] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setCode(prefilledCode || "");
		setReason("");
	}, [open, prefilledCode]);

	const handleScan = () => {
		setScanning(true);
		setTimeout(() => setScanning(false), 1200);
	};

	const handleConfirm = () => {
		if (!code || !reason) return;

		setLoading(true);
		setTimeout(() => {
			updateOrder(code, {
				status: STATUS.REJECTED,
				rejectReason: reason,
				rejectedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
			});

			pushOp({
				id: `OP-${Date.now()}`,
				operationType: "REJECT_ORDER",
				orderCode: code,
				employee: "System",
				result: "FAILED",
				details: `Rejected: ${reason}`,
				createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
			});

			setLoading(false);
			onClose();
		}, 600);
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl" dir="rtl">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<Ban className="text-red-500" size={22} />
						{t("modal.rejectOrdersTitle")}
					</DialogTitle>
				</DialogHeader>

				<div className="pt-3 space-y-4">
					<div className="space-y-2">
						<Label>{t("reject.enterOrScan")}</Label>

						<div className="flex gap-2">
							<Input
								value={code}
								onChange={(e) => setCode(e.target.value)}
								placeholder="#12367"
								className="flex-1 rounded-xl h-11 font-mono"
								dir="ltr"
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className={cn("h-11 w-11 rounded-xl flex-shrink-0", scanning && "border-orange-400 text-orange-500 animate-pulse")}
								onClick={handleScan}
								title={t("reject.scanTitle")}
							>
								<ScanLine size={18} />
							</Button>
						</div>

						{!!code && (
							<p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
								{t("reject.recognized", { code })}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label>{t("reject.reason")}</Label>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t("reject.reasonPlaceholder")}
							className="rounded-xl resize-none"
							rows={3}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" onClick={onClose} disabled={loading}>
							{t("common.cancel")}
						</Button>
						<Button onClick={handleConfirm} disabled={loading || !code || !reason} className="bg-red-500 hover:bg-red-600 text-white">
							{loading ? t("reject.rejecting") : t("reject.confirm")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─────────────────────────────────────────────
// ROW ACTION BUTTONS
// ─────────────────────────────────────────────
function ActionButtons({ t, row, onView, onAssign, onCancel }) {
	return (
		<TooltipProvider>
			<div className="flex items-center gap-1.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => onView?.(row)}
							className="w-9 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
						>
							<Info size={15} />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>{t("tooltip.details")}</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => onAssign?.(row)}
							className="w-9 h-9 rounded-full border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
						>
							<Truck size={15} />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>{row.carrier ? t("tooltip.changeAssign") : t("tooltip.assign")}</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => onCancel?.(row)}
							className="w-9 h-9 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:border-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
						>
							<Ban size={15} />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>{t("tooltip.reject")}</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
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
		carrier: "all", // ✅ added carrier filter
		date: "",
		productName: "",
	});

	const [selectedOrders, setSelectedOrders] = useState([]);
	const [assignDialog, setAssignDialog] = useState({ open: false, codes: [] });
	const [cancelModal, setCancelModal] = useState({ open: false, code: "" });
	const [detailModal, setDetailModal] = useState(null);
	const [page, setPage] = useState({ current_page: 1, per_page: 12 });

	const stores = useMemo(() => [...new Set(unassigned.map((o) => o.store))], [unassigned]);

	const filtered = useMemo(() => {
		let base = unassigned;

		const q = search.trim().toLowerCase();
		if (q) {
			base = base.filter((o) =>
				[o.code, o.customer, o.phone, o.city, o.store].some((x) => String(x || "").toLowerCase().includes(q))
			);
		}

		if (filters.store !== "all") base = base.filter((o) => o.store === filters.store);
		if (filters.paymentType !== "all") base = base.filter((o) => o.paymentType === filters.paymentType);

		// ✅ carrier filter (useful if later you allow "unassigned" list to include carrier too)
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
		filters.store !== "all" ||
		filters.paymentType !== "all" ||
		filters.carrier !== "all" ||
		!!filters.date ||
		!!filters.productName;

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={filtered.length > 0 && selectedOrders.length === filtered.length}
							onCheckedChange={selectAll}
						/>
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
				cell: (row) => (
					<span className="font-mono font-bold text-[#ff8b00] dark:text-[#5b4bff]">{row.code}</span>
				),
			},
			{ key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
			{
				key: "phone",
				header: t("field.phone"),
				cell: (row) => (
					<span className="font-mono text-slate-500 text-sm" dir="ltr">
						{row.phone}
					</span>
				),
			},
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
				cell: (row) => (
					<span className="font-bold text-emerald-700 dark:text-emerald-400">{row.total} ر.س</span>
				),
			},
			{
				key: "paymentType",
				header: t("field.payment"),
				cell: (row) => (
					<Badge
						className={cn(
							"rounded-full text-xs border",
							row.paymentType === "PAID"
								? "bg-emerald-50 text-emerald-700 border-emerald-200"
								: "bg-amber-50 text-amber-700 border-amber-200"
						)}
					>
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
						t={t}
						row={row}
						onView={() => setDetailModal(row)}
						onAssign={() => setAssignDialog({ open: true, codes: [row.code] })}
						onCancel={() => setCancelModal({ open: true, code: row.code })}
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
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("common.allStores")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allStores")}</SelectItem>
									{stores.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("field.paymentType")}>
							<Select value={filters.paymentType} onValueChange={(v) => setFilters((f) => ({ ...f, paymentType: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("common.all")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.all")}</SelectItem>
									<SelectItem value="COD">{t("payment.cod")}</SelectItem>
									<SelectItem value="PAID">{t("payment.paid")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>

						{/* ✅ Carrier filter (added) */}
						<FilterField label={t("field.carrier")}>
							<Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("common.allCarriers")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allCarriers")}</SelectItem>
									<SelectItem value="none">{t("stats.withoutCarrier")}</SelectItem>
									{CARRIERS.map((c) => (
										<SelectItem key={c} value={c}>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("field.date")}>
							<Input
								type="date"
								value={filters.date}
								onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
								className="h-10 rounded-xl text-sm"
							/>
						</FilterField>
					</>
				}
				columns={columns}
				data={filtered}
				isLoading={false}
				pagination={{
					total_records: filtered.length,
					current_page: page.current_page,
					per_page: page.per_page,
				}}
				onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
			/>

			<AssignCarrierDialog
				t={t}
				open={assignDialog.open}
				onClose={() => setAssignDialog({ open: false, codes: [] })}
				orders={orders}
				selectedOrderCodes={assignDialog.codes}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/>
			<CancelOrderModal
				t={t}
				open={cancelModal.open}
				onClose={() => setCancelModal({ open: false, code: "" })}
				prefilledCode={cancelModal.code}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/>
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
	const [filters, setFilters] = useState({
		carrier: "all",
		store: "all",
		paymentType: "all",
		date: "",
		productName: "",
	});

	const [detailModal, setDetailModal] = useState(null);
	const [assignDialog, setAssignDialog] = useState({ open: false, codes: [] });
	const [cancelModal, setCancelModal] = useState({ open: false, code: "" });
	const [page, setPage] = useState({ current_page: 1, per_page: 12 });

	const stores = useMemo(() => [...new Set(assigned.map((o) => o.store))], [assigned]);

	const filtered = useMemo(() => {
		let base = assigned;

		const q = search.trim().toLowerCase();
		if (q) {
			base = base.filter((o) =>
				[o.code, o.customer, o.phone, o.city, o.carrier, o.store].some((x) => String(x || "").toLowerCase().includes(q))
			);
		}

		if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
		if (filters.store !== "all") base = base.filter((o) => o.store === filters.store);
		if (filters.paymentType !== "all") base = base.filter((o) => o.paymentType === filters.paymentType);
		if (filters.date) base = base.filter((o) => o.orderDate === filters.date);
		if (filters.productName) base = base.filter((o) => o.products?.some((p) => String(p.name || "").includes(filters.productName)));

		return base;
	}, [assigned, search, filters]);

	const hasActiveFilters =
		filters.carrier !== "all" || filters.store !== "all" || filters.paymentType !== "all" || !!filters.date || !!filters.productName;

	const columns = useMemo(
		() => [
			{
				key: "code",
				header: t("field.orderCode"),
				cell: (row) => <span className="font-mono font-bold text-[#ff8b00] dark:text-[#5b4bff]">{row.code}</span>,
			},
			{ key: "customer", header: t("field.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
			{
				key: "phone",
				header: t("field.phone"),
				cell: (row) => (
					<span className="font-mono text-slate-500 text-sm" dir="ltr">
						{row.phone}
					</span>
				),
			},
			{ key: "city", header: t("field.city") },
			{ key: "area", header: t("field.area") },
			{
				key: "carrier",
				header: t("field.carrier"),
				cell: (row) => {
					const s = CARRIER_STYLES[row.carrier] || {};
					return (
						<span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", s.bg, s.border, s.text)}>
							<Truck size={12} />
							{row.carrier}
						</span>
					);
				},
			},
			{
				key: "trackingCode",
				header: t("field.trackingCode"),
				cell: (row) =>
					row.trackingCode ? (
						<span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{row.trackingCode}</span>
					) : (
						<span className="text-slate-400">{t("common.none")}</span>
					),
			},
			{
				key: "distributedAt",
				header: t("field.distributedAt"),
				cell: (row) => <span className="text-sm text-slate-500">{row.distributedAt || t("common.none")}</span>,
			},
			{
				key: "total",
				header: t("field.total"),
				cell: (row) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{row.total} ر.س</span>,
			},
			{
				key: "actions",
				header: t("field.actions"),
				cell: (row) => (
					<ActionButtons
						t={t}
						row={row}
						onView={() => setDetailModal(row)}
						onAssign={() => setAssignDialog({ open: true, codes: [row.code] })}
						onCancel={() => setCancelModal({ open: true, code: row.code })}
					/>
				),
			},
		],
		[t]
	);

	return (
		<div className="space-y-4">
			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={() => { }}
				labels={{
					searchPlaceholder: t("table.searchAssigned"),
					filter: t("common.filter"),
					apply: t("common.apply"),
					total: t("common.total"),
					limit: t("common.limit"),
					emptyTitle: t("table.emptyAssignedTitle"),
					emptySubtitle: "",
				}}
				actions={[
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
						<FilterField label={t("field.carrier")}>
							<Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("common.allCarriers")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allCarriers")}</SelectItem>
									{CARRIERS.map((c) => (
										<SelectItem key={c} value={c}>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("field.store")}>
							<Select value={filters.store} onValueChange={(v) => setFilters((f) => ({ ...f, store: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("common.allStores")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.allStores")}</SelectItem>
									{stores.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("field.paymentType")}>
							<Select value={filters.paymentType} onValueChange={(v) => setFilters((f) => ({ ...f, paymentType: v }))}>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("common.all")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("common.all")}</SelectItem>
									<SelectItem value="COD">{t("payment.cod")}</SelectItem>
									<SelectItem value="PAID">{t("payment.paid")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("field.date")}>
							<Input
								type="date"
								value={filters.date}
								onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
								className="h-10 rounded-xl text-sm"
							/>
						</FilterField>
					</>
				}
				columns={columns}
				data={filtered}
				isLoading={false}
				pagination={{
					total_records: filtered.length,
					current_page: page.current_page,
					per_page: page.per_page,
				}}
				onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
			/>

			<AssignCarrierDialog
				t={t}
				open={assignDialog.open}
				onClose={() => setAssignDialog({ open: false, codes: [] })}
				orders={orders}
				selectedOrderCodes={assignDialog.codes}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/>
			<CancelOrderModal
				t={t}
				open={cancelModal.open}
				onClose={() => setCancelModal({ open: false, code: "" })}
				prefilledCode={cancelModal.code}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/>
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

	const stats = [
		{ id: "total-confirmed", name: t("stats.totalConfirmed"), value: confirmedOrders.length, icon: CheckCircle2, color: "#10b981", sortOrder: 0 },
		{ id: "without-carrier", name: t("stats.withoutCarrier"), value: unassigned.length, icon: Ban, color: "#f59e0b", sortOrder: 1 },
		{ id: "with-carrier", name: t("stats.withCarrier"), value: assigned.length, icon: Truck, color: "#3b82f6", sortOrder: 2 },
		{ id: "ready-to-print", name: t("stats.readyToPrint"), value: readyToPrint.length, icon: Package, color: "#a855f7", sortOrder: 3 },
	];

	// carrier stats for assigned tab header
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
					{ id: "unassigned", label: t("tabs.unassigned"), count: unassigned.length, icon: Ban },
					{ id: "assigned", label: t("tabs.assigned"), count: assigned.length, icon: Truck },
				]}
				active={subtab}
				setActive={setSubtab}
			/>

			{/* Assign-all dialog wired to header button */}
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