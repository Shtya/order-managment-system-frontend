// page.jsx — Warehouse Flow (complete)
"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
	Package, Clock, CheckCircle2, XCircle, Truck,
	ClipboardList, ArrowLeft, ScanLine, Loader2, Save, RefreshCw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

import Button_ from "@/components/atoms/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import DistributionTab from "./tabs/DistributionTab";
import PrintLabelsTab from "./tabs/PrintLabelsTab";
import PreparationTab from "./tabs/PreparationTab";
import OutgoingTab from "./tabs/OutgoingTab";
import ReturnsTab from "./tabs/ReturnsTab";
import { RejectedTab } from "./tabs/RejectedTab";
import { LogsTab } from "./tabs/LogsTab";
import MultiPrepareView from "./atoms/MultiPrepareView";

import {
	initialOrders, initialOpsLogs, initialDeliveryFiles,
	initialReturnFiles, initialInventory,
	STATUS, CARRIERS,
} from "./tabs/data";

// ─────────────────────────────────────────────────────────────────────────────
// localStorage key — must match MultiPrepareView
// ─────────────────────────────────────────────────────────────────────────────
const LS_PREPARE_KEY = "warehouse_prepare_session_v2";

function hasSavedPrepareSession() {
	try {
		const raw = localStorage.getItem(LS_PREPARE_KEY);
		if (!raw) return false;
		const data = JSON.parse(raw);
		return Array.isArray(data?.ordersToPrep) && data.ordersToPrep.length > 0;
	} catch (_) { return false; }
}

function getSavedPrepareOrders() {
	try {
		const raw = localStorage.getItem(LS_PREPARE_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw);
		return data?.ordersToPrep ?? null;
	} catch (_) { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISTRIBUTION DIALOG
// ─────────────────────────────────────────────────────────────────────────────
function DistributionDialog({ open, onClose, orders, selectedOrderCodes, updateOrder, pushOp }) {
	const [selectedOrders, setSelectedOrders] = useState([]);
	const [carrier, setCarrier] = useState("");
	const [loading, setLoading] = useState(false);

	const availableOrders = useMemo(
		() => orders.filter((o) => o.status === STATUS.PREPARED && selectedOrderCodes.includes(o.code)),
		[orders, selectedOrderCodes]
	);

	useEffect(() => {
		if (open) { setSelectedOrders(availableOrders.map((o) => o.code)); setCarrier(""); }
	}, [open, availableOrders]);

	const toggleOrder = (code) =>
		setSelectedOrders((prev) =>
			prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
		);

	const handleDistribute = async () => {
		if (!carrier || selectedOrders.length === 0) return;
		setLoading(true);
		try {
			const now = new Date().toISOString().slice(0, 16).replace("T", " ");
			selectedOrders.forEach((code) => {
				updateOrder(code, { carrier, status: STATUS.SHIPPED, shippedAt: now });
				pushOp({
					id: `OP-${Date.now()}-${code}`, operationType: "SHIP_ORDER",
					orderCode: code, carrier, employee: "System", result: "SUCCESS",
					details: `تم التوزيع على: ${carrier}`, createdAt: now,
				});
			});
			onClose();
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-xl max-h-[90vh] overflow-y-auto" dir="rtl">
				<DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<Truck className="text-[#ff8b00] dark:text-[#5b4bff]" size={22} />
						توزيع الطلبات على شركة الشحن
					</DialogTitle>
				</DialogHeader>
				<div className="p-6 space-y-5">
					<div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 p-4">
						<p className="text-sm font-semibold text-blue-800 dark:text-blue-200">اختر شركة الشحن والطلبات المراد توزيعها</p>
						<p className="text-xs text-blue-500 mt-1">تم تحديد {selectedOrders.length} طلب</p>
					</div>
					<div className="space-y-2">
						<Label>اختر شركة الشحن <span className="text-red-500">*</span></Label>
						<Select value={carrier} onValueChange={setCarrier}>
							<SelectTrigger className="rounded-xl">
								<SelectValue placeholder="اختر شركة الشحن" />
							</SelectTrigger>
							<SelectContent>
								{CARRIERS.map((c) => (
									<SelectItem key={c} value={c}>
										<div className="flex items-center gap-2"><Truck size={15} />{c}</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="max-h-[300px] overflow-y-auto space-y-2 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
						{availableOrders.length === 0
							? <p className="text-center py-8 text-slate-500 text-sm">لا توجد طلبات جاهزة للتوزيع</p>
							: availableOrders.map((order) => (
								<motion.div key={order.code} whileHover={{ scale: 1.005 }}
									className={cn(
										"flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
										selectedOrders.includes(order.code)
											? "bg-[#ff8b00]/8 border-[#ff8b00]/40 dark:border-[#5b4bff]/40"
											: "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
									)}
									onClick={() => toggleOrder(order.code)}>
									<Checkbox
										checked={selectedOrders.includes(order.code)}
										onCheckedChange={() => toggleOrder(order.code)} />
									<div className="flex-1">
										<p className="font-semibold text-sm">{order.code}</p>
										<p className="text-xs text-gray-500">{order.customer} — {order.city}</p>
									</div>
									<span className="text-xs text-gray-400">{order.products.length} منتج</span>
								</motion.div>
							))
						}
					</div>
					<div className="flex justify-end gap-2">
						<Button_ label="إلغاء" tone="gray" variant="outline" onClick={onClose} disabled={loading} />
						<Button_
							label={loading ? "جاري التوزيع..." : "تأكيد التوزيع"}
							tone="purple" variant="solid"
							onClick={handleDistribute}
							disabled={loading || !carrier || selectedOrders.length === 0} />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TAB_IDS = ["distribution", "print", "preparation", "outgoing", "returns", "rejected", "logs"];

const DEFAULT_SUBTABS = {
	distribution: "unassigned",
	print: "not_printed",
	preparation: "preparing",
	outgoing: "scan",
	returns: "scan",
};

const SUBTABS = {
	distribution: ["unassigned", "assigned"],
	print: ["not_printed", "printed"],
	preparation: ["preparing", "prepared"],
	outgoing: ["scan", "files"],
	returns: ["scan", "files"],
	rejected: [],
	logs: [],
};

const isValidSubtab = (tab, subtab) => {
	const list = SUBTABS[tab] || [];
	return !!subtab && list.includes(subtab);
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function WarehouseFlowPage() {
	const locale = useLocale();
	const dir = locale === "ar" ? "rtl" : "ltr";
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// ── Core data ──────────────────────────────────────────────────────────────
	const [orders, setOrders] = useState(initialOrders);
	const [opsLogs, setOpsLogs] = useState(initialOpsLogs);
	const [deliveryFiles, setDeliveryFiles] = useState(initialDeliveryFiles);
	const [returnFiles, setReturnFiles] = useState(initialReturnFiles);
	const [inventory, setInventory] = useState(initialInventory);

	// ── URL-driven tabs ────────────────────────────────────────────────────────
	const activeTabFromUrl = searchParams.get("tab");
	const activeSubtabFromUrl = searchParams.get("subtab");
	const activeTab = TAB_IDS.includes(activeTabFromUrl) ? activeTabFromUrl : "distribution";
	const activeSubtab = isValidSubtab(activeTab, activeSubtabFromUrl)
		? activeSubtabFromUrl
		: (DEFAULT_SUBTABS[activeTab] || null);

	const setActiveSubtab = useCallback((subtabId) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("subtab", subtabId);
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	}, [router, pathname, searchParams]);

	const setActiveTab = useCallback((tabId) => {
		const nextTab = TAB_IDS.includes(tabId) ? tabId : "distribution";
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", nextTab);
		params.delete("subtab");
		const def = DEFAULT_SUBTABS[nextTab];
		if (def) params.set("subtab", def);
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	}, [router, pathname, searchParams]);

	// Fix bad URL on mount
	useEffect(() => {
		const tabQ = searchParams.get("tab");
		const subQ = searchParams.get("subtab");
		const tab = TAB_IDS.includes(tabQ) ? tabQ : "distribution";
		const def = DEFAULT_SUBTABS[tab] || null;
		const subtabOk = isValidSubtab(tab, subQ);
		if ((!subQ && !!def) || (!!subQ && !subtabOk) || tabQ !== tab) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("tab", tab);
			if (def) params.set("subtab", def);
			else params.delete("subtab");
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		}
	}, [searchParams, router, pathname]);

	// ── Prepare view state ─────────────────────────────────────────────────────
	// On mount: check if there's a saved session and restore it automatically
	const [preparingOrders, setPreparingOrders] = useState(() => {
 		if (typeof window !== "undefined") {
			const saved = getSavedPrepareOrders();
			if (saved && saved.length > 0) return saved;
		}
		return null;
	});

	const [distributionDialog, setDistributionDialog] = useState(false);
	const [selectedOrdersForDist, setSelectedOrdersForDist] = useState([]);

	useEffect(() => {
		if (!hasSavedPrepareSession()) {
			setPreparingOrders(null);
		}
	}, [activeTab]);

	// ── Callbacks ──────────────────────────────────────────────────────────────
	const pushOp = useCallback((op) => setOpsLogs(prev => [op, ...prev]), []);
	const updateOrder = useCallback((code, p) => setOrders(prev => prev.map(o => o.code === code ? { ...o, ...p } : o)), []);
	const addDeliveryFile = useCallback((file) => setDeliveryFiles(prev => [file, ...prev]), []);
	const addReturnFile = useCallback((file) => setReturnFiles(prev => [file, ...prev]), []);
	const updateInventory = useCallback((inv) => setInventory(inv), []);

	const handlePrepareOrder = useCallback((order) => setPreparingOrders([order]), []);
	const handlePrepareMultiple = useCallback((orderList) => setPreparingOrders(orderList), []);
	const handleBack = useCallback(() => {
		setPreparingOrders(null);
		// Clear the session when user manually goes back
		try { localStorage.removeItem(LS_PREPARE_KEY); } catch (_) { }
	}, []);

	// ── Prepare view override ──────────────────────────────────────────────────
	if (preparingOrders && preparingOrders.length > 0) {
		return (
			<div
				className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/20 dark:from-[#182337] dark:via-[#182337] dark:to-[#1a2744]"
				dir={dir}>
				<MultiPrepareView
					ordersToPrep={preparingOrders}
					onBack={handleBack}
					updateOrder={updateOrder}
					pushOp={pushOp}
				/>
			</div>
		);
	}

	// ── Main tabbed layout ─────────────────────────────────────────────────────
	return (
		<div
			className="min-h-screen !pb-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/20 dark:from-[#182337] dark:via-[#182337] dark:to-[#1a2744]"
			dir={dir}>
			<AnimatePresence mode="wait">
				<motion.div key={activeTab}
					initial={{ opacity: 0, y: 14 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.2 }}>

					{activeTab === "distribution" && (
						<DistributionTab
							orders={orders} updateOrder={updateOrder} pushOp={pushOp}
							subtab={activeSubtab} setSubtab={setActiveSubtab}
						/>
					)}

					{activeTab === "print" && (
						<PrintLabelsTab
							orders={orders} updateOrder={updateOrder} pushOp={pushOp}
							subtab={activeSubtab} setSubtab={setActiveSubtab}
							onPrepareOrder={handlePrepareOrder}
							onPrepareMultiple={handlePrepareMultiple}
						/>
					)}

					{activeTab === "preparation" && (
						<PreparationTab
							orders={orders} updateOrder={updateOrder} pushOp={pushOp}
							subtab={activeSubtab} setSubtab={setActiveSubtab}
							onPrepareOrder={handlePrepareOrder}
							onPrepareMultiple={handlePrepareMultiple}
							setDistributionDialog={setDistributionDialog}
							setSelectedOrdersGlobal={setSelectedOrdersForDist}
						/>
					)}

					{activeTab === "outgoing" && (
						<OutgoingTab
							orders={orders} updateOrder={updateOrder} pushOp={pushOp}
							inventory={inventory} updateInventory={updateInventory}
							deliveryFiles={deliveryFiles} addDeliveryFile={addDeliveryFile}
							subtab={activeSubtab} setSubtab={setActiveSubtab}
						/>
					)}

					{activeTab === "returns" && (
						<ReturnsTab
							orders={orders} updateOrder={updateOrder} pushOp={pushOp}
							inventory={inventory} updateInventory={updateInventory}
							returnFiles={returnFiles} addReturnFile={addReturnFile}
							subtab={activeSubtab} setSubtab={setActiveSubtab}
						/>
					)}

					{activeTab === "rejected" && (
						<RejectedTab orders={orders} updateOrder={updateOrder} pushOp={pushOp} />
					)}

					{activeTab === "logs" && (
						<LogsTab opsLogs={opsLogs} orders={orders} />
					)}

				</motion.div>
			</AnimatePresence>

			<DistributionDialog
				open={distributionDialog}
				onClose={() => setDistributionDialog(false)}
				orders={orders}
				selectedOrderCodes={selectedOrdersForDist}
				updateOrder={updateOrder}
				pushOp={pushOp}
			/>
		</div>
	);
}