"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Clock, ScanLine, Package, CheckCircle2, Ban, FileDown, Truck, Info,
	Printer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Table, { FilterField } from "@/components/atoms/Table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "../../../../components/atoms/Pageheader";
import { STATUS, CARRIERS } from "./data";
import Button_ from "@/components/atoms/Button";

// ── Carrier Styles ─────────────────────────────────────────────────────────────
const CARRIER_STYLES = {
	ARAMEX: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-400" },
	SMSA: { bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-400" },
	DHL: { bg: "bg-yellow-50 dark:bg-yellow-950/20", border: "border-yellow-200 dark:border-yellow-800", text: "text-yellow-700 dark:text-yellow-400" },
	BOSTA: { bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-400" },
};

function CarrierPill({ carrier }) {
	const s = CARRIER_STYLES[carrier] || {};
	return (
		<span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", s.bg, s.border, s.text)}>
			<Truck size={12} />{carrier}
		</span>
	);
}

// ── Scan Progress Bar ─────────────────────────────────────────────────────────
function ScanProgress({ products }) {
	const total = products.reduce((s, p) => s + p.requestedQty, 0);
	const scanned = products.reduce((s, p) => s + (p.scannedQty || 0), 0);
	const pct = total === 0 ? 0 : Math.round((scanned / total) * 100);
	return (
		<div className="flex items-center gap-2 min-w-[120px]">
			<div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
				<motion.div
					initial={{ width: 0 }}
					animate={{ width: `${pct}%` }}
					transition={{ duration: 0.5 }}
					className={cn("h-full rounded-full", pct === 100 ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-[#ff8b00] to-[#ff5c2b]")}
				/>
			</div>
			<span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">{scanned}/{total}</span>
		</div>
	);
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ open, onClose, order }) {
	const t = useTranslations("warehouse.preparation");
	if (!order) return null;
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<Package className="text-[#ff8b00] dark:text-[#5b4bff]" size={22} />
						{t("table.orderNumber")} — {order.code}
					</DialogTitle>
				</DialogHeader>
				<div className="pt-3 space-y-4">
					<div className="grid grid-cols-2 gap-3">
						{[
							{ label: "اسم العميل", value: order.customer },
							{ label: "رقم الهاتف", value: order.phone },
							{ label: "المدينة", value: order.city },
							{ label: "المنطقة", value: order.area || "—" },
							{ label: "المتجر", value: order.store },
							{ label: "شركة الشحن", value: order.carrier || "غير محدد" },
							{ label: "كود التتبع", value: order.trackingCode || "—" },
							{ label: "الإجمالي", value: `${order.total} ر.س` },
						].map(({ label, value }) => (
							<div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
								<p className="text-xs text-slate-400 mb-1">{label}</p>
								<p className="font-semibold text-sm">{value}</p>
							</div>
						))}
					</div>
					<div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
						<p className="text-xs text-slate-400 mb-3 font-semibold">المنتجات</p>
						<div className="space-y-2">
							{order.products?.map((p, i) => (
								<div key={i} className="flex items-center justify-between text-sm">
									<span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{p.sku}</span>
									<span className="flex-1 mx-3">{p.name}</span>
									<span className="text-slate-500">×{p.requestedQty}</span>
									<span className="font-semibold ms-4">{p.price * p.requestedQty} ر.س</span>
								</div>
							))}
						</div>
					</div>
					{order.notes && (
						<div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-3">
							<p className="text-xs text-amber-600 mb-1 font-semibold">ملاحظات</p>
							<p className="text-sm text-amber-800 dark:text-amber-200">{order.notes}</p>
						</div>
					)}
					<div className="flex justify-end">
						<Button variant="outline" onClick={onClose}>إغلاق</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ── Row Action Buttons ────────────────────────────────────────────────────────
function ActionButtons({ row, onView, onPrepare, onReject }) {
	return (
		<TooltipProvider>
			<div className="flex items-center gap-1.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onView?.(row)}
							className="w-9 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
							<Info size={15} />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>التفاصيل</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onPrepare?.(row)}
							className="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
							<ScanLine size={15} />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>متابعة التحضير</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onReject?.(row)}
							className="w-9 h-9 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:border-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
							<Ban size={15} />
						</motion.button>
					</TooltipTrigger>
					<TooltipContent>رفض</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}

// ── Subtab: In Progress ────────────────────────────────────────────────────────
function InProgressSubtab({ orders, updateOrder, pushOp, onPrepareOrder, onPrepareMultiple }) {
	const t = useTranslations("warehouse.preparation");
	const preparing = useMemo(() => orders.filter((o) => o.status === STATUS.PREPARING), [orders]);

	const [selectedOrders, setSelectedOrders] = useState([]);
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState({ carrier: "all" });
	const [detailModal, setDetailModal] = useState(null);
	const [page, setPage] = useState({ current_page: 1, per_page: 12 });

	const filtered = useMemo(() => {
		let base = preparing;
		const q = search.trim().toLowerCase();
		if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city].some((x) => String(x || "").toLowerCase().includes(q)));
		if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
		return base;
	}, [preparing, search, filters]);

	const toggleOrder = (code) => setSelectedOrders((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
	const selectAll = () => setSelectedOrders(selectedOrders.length === filtered.length ? [] : filtered.map((o) => o.code));

	const handleReject = (row) => {
		updateOrder(row.code, { status: STATUS.REJECTED, rejectReason: t("rejectReason"), rejectedAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
		pushOp({ id: `OP-${Date.now()}`, operationType: "REJECT_ORDER", orderCode: row.code, carrier: row.carrier || "-", employee: "System", result: "FAILED", details: t("rejectDetails"), createdAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
	};

	const columns = useMemo(() => [
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
		{ key: "code", header: t("table.orderNumber"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00] dark:text-[#5b4bff]">{row.code}</span> },
		{ key: "customer", header: t("table.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
		{ key: "phone", header: t("table.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm">{row.phone}</span> },
		{ key: "city", header: t("table.city") },
		{
			key: "carrier", header: t("table.carrier"),
			cell: (row) => row.carrier ? <CarrierPill carrier={row.carrier} /> : <span className="text-slate-400 text-sm italic">{t("unspecified")}</span>,
		},
		{
			key: "products", header: t("table.products"),
			cell: (row) => <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-sm font-semibold">{row.products.length} {t("product")}</span>,
		},
		{ key: "progress", header: t("table.scanProgress"), cell: (row) => <ScanProgress products={row.products} /> },
		{ key: "assignedEmployee", header: t("table.employee") },
		{
			key: "actions", header: t("table.actions"),
			cell: (row) => (
				<ActionButtons
					row={row}
					onView={() => setDetailModal(row)}
					onPrepare={() => onPrepareOrder(row)}
					onReject={() => handleReject(row)}
				/>
			),
		},
	], [filtered, selectedOrders, t, onPrepareOrder]);

	return (
		<div className="space-y-4">
			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={() => { }}
				labels={{
					searchPlaceholder: t("searchPlaceholder"),
					filter: t("filter"),
					apply: t("apply"),
					total: t("total"),
					limit: t("limit"),
					emptyTitle: t("inProgress.emptyTitle"),
					emptySubtitle: "",
				}}
				actions={[
					{
						key: "prepareSelected",
						label: selectedOrders.length > 0 ? t("prepareSelectedCount", { count: selectedOrders.length }) : t("prepareSelected"),
						icon: <Package size={14} />,
						color: "emerald",
						onClick: () => {
							if (selectedOrders.length === 0) return;
							const ordersToPrep = orders.filter((o) => selectedOrders.includes(o.code));
							if (ordersToPrep.length === 1) onPrepareOrder(ordersToPrep[0]);
							else onPrepareMultiple(ordersToPrep);
						},
						disabled: selectedOrders.length === 0,
					},
					{ key: "export", label: t("export"), icon: <FileDown size={14} />, color: "blue", onClick: () => { } },
				]}
				hasActiveFilters={filters.carrier !== "all"}
				onApplyFilters={() => { }}
				filters={
					<FilterField label={t("filters.carrier")}>
						<Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
							<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
								<SelectValue placeholder={t("filters.allCarriers")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
								{CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
							</SelectContent>
						</Select>
					</FilterField>
				}
				columns={columns}
				data={filtered}
				isLoading={false}
				pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
				onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
			/>
			<OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
		</div>
	);
}

// ── Subtab: Prepared ─────────────────────────────────────────────────────────
function PreparedSubtab({ orders, setDistributionDialog, setSelectedOrdersGlobal }) {
	const t = useTranslations("warehouse.preparation");
	const prepared = useMemo(() => orders.filter((o) => o.status === STATUS.PREPARED), [orders]);

	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState({ carrier: "all" });
	const [detailModal, setDetailModal] = useState(null);
	const [page, setPage] = useState({ current_page: 1, per_page: 12 });

	const filtered = useMemo(() => {
		let base = prepared;
		const q = search.trim().toLowerCase();
		if (q) base = base.filter((o) => [o.code, o.customer, o.phone, o.city, o.carrier].some((x) => String(x || "").toLowerCase().includes(q)));
		if (filters.carrier !== "all") base = base.filter((o) => o.carrier === filters.carrier);
		return base;
	}, [prepared, search, filters]);

	const columns = useMemo(() => [
		{ key: "code", header: t("table.orderNumber"), cell: (row) => <span className="font-mono font-bold text-[#ff8b00] dark:text-[#5b4bff]">{row.code}</span> },
		{ key: "customer", header: t("table.customer"), cell: (row) => <span className="font-semibold">{row.customer}</span> },
		{ key: "phone", header: t("table.phone"), cell: (row) => <span className="font-mono text-slate-500 text-sm">{row.phone}</span> },
		{ key: "city", header: t("table.city") },
		{
			key: "carrier", header: t("table.carrier"),
			cell: (row) => row.carrier ? <CarrierPill carrier={row.carrier} /> : <span className="text-slate-400 text-sm italic">{t("unspecified")}</span>,
		},
		{
			key: "products", header: t("table.products"),
			cell: (row) => (
				<div className="space-y-0.5">
					{row.products.map((p, i) => (
						<div key={i} className="text-xs text-slate-500">
							<span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{p.sku}</span>{" "}{p.name} ×{p.scannedQty}
						</div>
					))}
				</div>
			),
		},
		{ key: "preparedAt", header: t("table.preparedAt"), cell: (row) => <span className="text-sm text-slate-500">{row.preparedAt || "—"}</span> },
		{ key: "assignedEmployee", header: t("table.employee") },
		{
			key: "actions", header: t("table.actions"),
			cell: (row) => (
				<TooltipProvider>
					<div className="flex items-center gap-1.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setDetailModal(row)}
									className="w-9 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:border-purple-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
									<Info size={15} />
								</motion.button>
							</TooltipTrigger>
							<TooltipContent>التفاصيل</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
									onClick={() => { setSelectedOrdersGlobal?.([row.code]); setDistributionDialog?.(true); }}
									className="w-9 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
									<Truck size={15} />
								</motion.button>
							</TooltipTrigger>
							<TooltipContent>{t("actions.distribute")}</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
			),
		},
	], [t, setDistributionDialog, setSelectedOrdersGlobal]);

	return (
		<div className="space-y-4">
			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={() => { }}
				labels={{
					searchPlaceholder: t("searchPlaceholder"),
					filter: t("filter"),
					apply: t("apply"),
					total: t("total"),
					limit: t("limit"),
					emptyTitle: t("prepared.emptyTitle"),
					emptySubtitle: "",
				}}
				actions={[{ key: "export", label: t("export"), icon: <FileDown size={14} />, color: "blue", onClick: () => { } }]}
				hasActiveFilters={filters.carrier !== "all"}
				onApplyFilters={() => { }}
				filters={
					<FilterField label={t("filters.carrier")}>
						<Select value={filters.carrier} onValueChange={(v) => setFilters((f) => ({ ...f, carrier: v }))}>
							<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
								<SelectValue placeholder={t("filters.allCarriers")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("filters.allCarriers")}</SelectItem>
								{CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
							</SelectContent>
						</Select>
					</FilterField>
				}
				columns={columns}
				data={filtered}
				isLoading={false}
				pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
				onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
			/>
			<OrderDetailModal open={!!detailModal} onClose={() => setDetailModal(null)} order={detailModal} />
		</div>
	);
}

// ── Main Preparation Tab ───────────────────────────────────────────────────────
export default function PreparationTab({
	orders, updateOrder, pushOp, subtab, setSubtab, onPrepareOrder, onPrepareMultiple,
	setDistributionDialog, setSelectedOrdersGlobal,
}) {
	const t = useTranslations("warehouse.preparation");

	const preparing = orders.filter((o) => o.status === STATUS.PREPARING);
	const prepared = orders.filter((o) => o.status === STATUS.PREPARED);

	const totalItems = preparing.reduce((s, o) => s + o.products.reduce((ps, p) => ps + p.requestedQty, 0), 0);
	const scannedItems = preparing.reduce((s, o) => s + o.products.reduce((ps, p) => ps + (p.scannedQty || 0), 0), 0);

	const stats = [
		{ id: "in-progress", name: t("stats.inProgress"), value: preparing.length, icon: Clock, color: "#3b82f6", sortOrder: 0 },
		{ id: "total-items", name: t("stats.totalItems"), value: totalItems, icon: Package, color: "#f59e0b", sortOrder: 1 },
		{ id: "scanned", name: t("stats.scanned"), value: scannedItems, icon: CheckCircle2, color: "#10b981", sortOrder: 2 },
		{ id: "prepared", name: t("stats.prepared"), value: prepared.length, icon: CheckCircle2, color: "#a855f7", sortOrder: 3 },
	];

 
	return (
		<div className="space-y-4">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumbs.home"), href: "/" },
					{ name: t("breadcrumbs.warehouse"), href: "/warehouse" },
					{ name: t("breadcrumbs.preparation") },
				]}
				buttons={
					<Button_
						size="sm"
						label={t("howItWorks")}
						variant="ghost"
						onClick={() => { }}
						icon={<Info size={18} />}
					/>
				}
				stats={stats}
				items={[
				{ id: "preparing", label: t("subtabs.inProgress"), count: preparing.length, icon: Clock },
				{ id: "prepared", label: t("subtabs.prepared"), count: prepared.length, icon: CheckCircle2 },
			]}
				active={subtab}
				setActive={setSubtab}
			/>

			<AnimatePresence mode="wait">
				<motion.div key={subtab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
					{subtab === "preparing" && (
						<InProgressSubtab
							orders={orders}
							updateOrder={updateOrder}
							pushOp={pushOp}
							onPrepareOrder={onPrepareOrder}
							onPrepareMultiple={onPrepareMultiple}
						/>
					)}
					{subtab === "prepared" && (
						<PreparedSubtab
							orders={orders}
							setDistributionDialog={setDistributionDialog}
							setSelectedOrdersGlobal={setSelectedOrdersGlobal}
						/>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}