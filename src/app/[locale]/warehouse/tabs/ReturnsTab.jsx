"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	RefreshCw, Truck, Package, ScanLine, Save,
	CheckCircle2, Loader2, Download, FileDown, Calendar,
	Info, ChevronDown, FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "../../../../components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { STATUS, CARRIERS, PRODUCT_CONDITIONS, returnInventoryFromCarrier } from "./data";
import ScanBar from "../atoms/ScanBar";

// ── PDF ────────────────────────────────────────────────────────────────────────
const PDF_STYLE = `<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;color:#1e293b;background:#fff;padding:28px 32px}.header-bar{background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;padding:16px 20px;border-radius:12px;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:13px}thead{background:#fefce8}th{text-align:right;padding:9px 12px;font-weight:600;color:#92400e;border-bottom:2px solid #fde68a}td{padding:8px 12px;border-bottom:1px solid #fef9c3}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}.info-card{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 14px}.info-label{font-size:10px;color:#92400e;margin-bottom:3px}.info-value{font-size:13px;font-weight:600}.badge-ok{background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:99px;font-size:11px}.badge-damaged{background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:99px;font-size:11px}@media print{button{display:none}}</style>`;

// ── Wrong Scan Log PDF ─────────────────────────────────────────────────────────
const WRONG_SCAN_PDF_STYLE = `<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;color:#1e293b;background:#fff;padding:28px 32px}.header-bar{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:16px 20px;border-radius:12px;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:13px}thead{background:#fef2f2}th{text-align:right;padding:9px 12px;font-weight:600;color:#991b1b;border-bottom:2px solid #fecaca}td{padding:8px 12px;border-bottom:1px solid #fff1f2}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}.info-card{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 14px}.info-label{font-size:10px;color:#991b1b;margin-bottom:3px}.info-value{font-size:13px;font-weight:600}.badge-error{background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:99px;font-size:11px;border:1px solid #fecaca}@media print{button{display:none}}</style>`;

function buildReturnPDF(orders, carrier, employee, now) {
	const rows = orders.map((o) => `<tr><td style="font-family:monospace;font-weight:700">${o.code}</td><td>${o.customer}</td><td>${o.city}</td><td>${o.products.map((p) => `${p.name} ×${p.requestedQty}`).join("<br/>")}</td><td>${o.total} ر.س</td><td><span class="${o.returnCondition === "تالف" ? "badge-damaged" : "badge-ok"}">${o.returnCondition || "سليم"}</span></td></tr>`).join("");
	return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ملف مرتجعات</title>${PDF_STYLE}</head><body><div class="header-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px">↩ ملف استلام المرتجعات — ${carrier}</div><div style="font-size:12px;opacity:.85">تاريخ الاستلام: ${now} | الموظف: ${employee} | عدد المرتجعات: ${orders.length}</div></div><div class="info-grid"><div class="info-card"><div class="info-label">شركة الشحن</div><div class="info-value">${carrier}</div></div><div class="info-card"><div class="info-label">تاريخ الاستلام</div><div class="info-value">${now}</div></div><div class="info-card"><div class="info-label">الموظف</div><div class="info-value">${employee}</div></div><div class="info-card"><div class="info-label">إجمالي المرتجعات</div><div class="info-value">${orders.length} طلب</div></div></div><table><thead><tr><th>رقم الطلب</th><th>العميل</th><th>المدينة</th><th>المنتجات</th><th>الإجمالي</th><th>حالة المنتج</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function buildWrongScanLogPDF(logs, carrier, employee, now) {
	const rows = logs.map((l, i) => `<tr><td style="text-align:center;color:#94a3b8">${i + 1}</td><td style="font-family:monospace;font-weight:700;color:#dc2626">${l.code}</td><td><span class="badge-error">${l.reason}</span></td><td style="color:#94a3b8;font-size:11px">${l.time}</td></tr>`).join("");
	return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>سجل المسح الفاشل</title>${WRONG_SCAN_PDF_STYLE}</head><body><div class="header-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px">⚠ سجل محاولات المسح الفاشلة — ${carrier}</div><div style="font-size:12px;opacity:.85">تاريخ الطباعة: ${now} | الموظف: ${employee} | إجمالي المحاولات: ${logs.length}</div></div><div class="info-grid"><div class="info-card"><div class="info-label">شركة الشحن</div><div class="info-value">${carrier}</div></div><div class="info-card"><div class="info-label">الموظف</div><div class="info-value">${employee}</div></div><div class="info-card"><div class="info-label">التاريخ</div><div class="info-value">${now}</div></div><div class="info-card"><div class="info-label">إجمالي المحاولات الفاشلة</div><div class="info-value">${logs.length} محاولة</div></div></div><table><thead><tr><th style="text-align:center;width:40px">#</th><th>الكود الممسوح</th><th>سبب الفشل</th><th>الوقت</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function openPrintWindow(html) {
	const win = window.open("", "_blank", "width=900,height=700");
	if (!win) return;
	win.document.write(html); win.document.close(); win.focus();
	setTimeout(() => win.print(), 600);
}

// ── Carrier meta ───────────────────────────────────────────────────────────────
const CARRIER_META = {
	ARAMEX: { color: "#ef4444", light: "#fef2f2" },
	SMSA: { color: "#3b82f6", light: "#eff6ff" },
	DHL: { color: "#ca8a04", light: "#fefce8" },
	BOSTA: { color: "#f97316", light: "#fff7ed" },
};
function getCarrierMeta(c = "") {
	return CARRIER_META[c.toUpperCase().replace(/\s/g, "")] || { color: "#f59e0b", light: "#fffbeb" };
}

// ── Stat Boxes (matching outgoing style exactly) ───────────────────────────────
function StatBoxes({ scannedCount, wrongScans }) {
	return (
		<div className="grid grid-cols-2 gap-3 mt-3">
			{/* Scanned returns */}
			<motion.div
				initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
				className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 p-4"
			>
				<div className="absolute -right-2 top-2 w-20 h-20 rounded-full bg-amber-400/10" />
				<div className="relative flex gap-4 items-center justify-between">
					<div>
						<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" />
							<rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#d97706" strokeDasharray="2 2" />
							<path d="M20.2793 27.75L21.5293 29H11.5V11.5H16.5C16.5 11.1549 16.5651 10.8327 16.6953 10.5332C16.8255 10.2337 17.0046 9.9668 17.2324 9.73242C17.4603 9.49805 17.724 9.31901 18.0234 9.19531C18.3229 9.07161 18.6484 9.00651 19 9C19.3451 9 19.6673 9.0651 19.9668 9.19531C20.2663 9.32552 20.5332 9.50456 20.7676 9.73242C21.002 9.96029 21.181 10.224 21.3047 10.5234C21.4284 10.8229 21.4935 11.1484 21.5 11.5H26.5V21.5293L25.25 22.7793V12.75H24V15.25H14V12.75H12.75V27.75H20.2793ZM15.25 12.75V14H22.75V12.75H20.25V11.5C20.25 11.3242 20.2174 11.1615 20.1523 11.0117C20.0872 10.862 19.9993 10.7318 19.8887 10.6211C19.778 10.5104 19.6445 10.4193 19.4883 10.3477C19.332 10.276 19.1693 10.2435 19 10.25C18.8242 10.25 18.6615 10.2826 18.5117 10.3477C18.362 10.4128 18.2318 10.5007 18.1211 10.6113C18.0104 10.722 17.9193 10.8555 17.8477 11.0117C17.776 11.168 17.7435 11.3307 17.75 11.5V12.75H15.25ZM28.8145 23.1895L23.375 28.6387L20.748 26.002L21.627 25.123L23.375 26.8613L27.9355 22.3105L28.8145 23.1895Z" fill="#d97706" />
						</svg>
					</div>
					<div className="flex-1">
						<p className="text-[16px] font-bold uppercase tracking-widest text-amber-600/70 mb-1">المرتجعات الممسوحة</p>
						<AnimatePresence mode="wait">
							<motion.p
								key={scannedCount}
								initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
								transition={{ type: "spring", stiffness: 500, damping: 28 }}
								className="text-4xl font-black tabular-nums text-amber-700 leading-none"
							>
								{scannedCount}
							</motion.p>
						</AnimatePresence>
					</div>
					<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fillRule="evenodd" clipRule="evenodd" d="M22.5 41.25C32.8556 41.25 41.25 32.8556 41.25 22.5C41.25 12.1444 32.8556 3.75 22.5 3.75C12.1444 3.75 3.75 12.1444 3.75 22.5C3.75 32.8556 12.1444 41.25 22.5 41.25ZM32.5706 16.5656C32.6583 16.4753 32.727 16.3682 32.7724 16.2507C32.8178 16.1332 32.8391 16.0078 32.8349 15.882C32.8308 15.7561 32.8014 15.6323 32.7484 15.5181C32.6954 15.4039 32.6199 15.3015 32.5265 15.217C32.433 15.1326 32.3235 15.0679 32.2045 15.0267C32.0855 14.9855 31.9594 14.9687 31.8338 14.9773C31.7081 14.986 31.5855 15.0198 31.4732 15.0768C31.361 15.1339 31.2613 15.213 31.1803 15.3094L19.95 27.7191L13.7719 21.8212C13.5921 21.6494 13.3515 21.5561 13.1028 21.5617C12.8542 21.5673 12.6181 21.6715 12.4462 21.8512C12.2744 22.031 12.1811 22.2717 12.1867 22.5203C12.1923 22.7689 12.2965 23.0051 12.4762 23.1769L19.3519 29.7394L20.0484 30.405L20.6944 29.6906L32.5706 16.5656Z" fill="#d97706" />
					</svg>
				</div>
			</motion.div>

			{/* Wrong scans */}
			<motion.div
				initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
				className={cn(
					"relative overflow-hidden rounded-2xl border p-4 transition-colors duration-300",
					wrongScans > 0
						? "border-red-200/70 bg-gradient-to-br from-red-50 to-rose-50"
						: "border-slate-200/70 bg-gradient-to-br from-slate-50 to-slate-50/50"
				)}
			>
				<div className={cn(
					"absolute -right-2 top-2 w-20 h-20 rounded-full transition-colors duration-300",
					wrongScans > 0 ? "bg-red-400/10" : "bg-slate-200/20"
				)} />
				<div className="relative flex items-center gap-4 justify-between">
					<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" />
						<rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#A32E2E" strokeDasharray="2 2" />
						<path d="M20.2793 27.75L21.5293 29H11.5V11.5H16.5C16.5 11.1549 16.5651 10.8327 16.6953 10.5332C16.8255 10.2337 17.0046 9.9668 17.2324 9.73242C17.4603 9.49805 17.724 9.31901 18.0234 9.19531C18.3229 9.07161 18.6484 9.00651 19 9C19.3451 9 19.6673 9.0651 19.9668 9.19531C20.2663 9.32552 20.5332 9.50456 20.7676 9.73242C21.002 9.96029 21.181 10.224 21.3047 10.5234C21.4284 10.8229 21.4935 11.1484 21.5 11.5H26.5V21.5293L25.25 22.7793V12.75H24V15.25H14V12.75H12.75V27.75H20.2793ZM15.25 12.75V14H22.75V12.75H20.25V11.5C20.25 11.3242 20.2174 11.1615 20.1523 11.0117C20.0872 10.862 19.9993 10.7318 19.8887 10.6211C19.778 10.5104 19.6445 10.4193 19.4883 10.3477C19.332 10.276 19.1693 10.2435 19 10.25C18.8242 10.25 18.6615 10.2826 18.5117 10.3477C18.362 10.4128 18.2318 10.5007 18.1211 10.6113C18.0104 10.722 17.9193 10.8555 17.8477 11.0117C17.776 11.168 17.7435 11.3307 17.75 11.5V12.75H15.25ZM28.8145 23.1895L23.375 28.6387L20.748 26.002L21.627 25.123L23.375 26.8613L27.9355 22.3105L28.8145 23.1895Z" fill="#A32E2E" />
					</svg>
					<div className="flex-1">
						<p className={cn(
							"text-[16px] font-bold uppercase tracking-widest mb-1 transition-colors duration-300",
							wrongScans > 0 ? "text-red-600/70" : "text-slate-400"
						)}>محاولات المسح الفاشلة</p>
						<AnimatePresence mode="wait">
							<motion.p
								key={wrongScans}
								initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
								transition={{ type: "spring", stiffness: 500, damping: 28 }}
								className={cn(
									"text-4xl font-black tabular-nums leading-none transition-colors duration-300",
									wrongScans > 0 ? "text-red-700" : "text-slate-300"
								)}
							>
								{wrongScans}
							</motion.p>
						</AnimatePresence>
					</div>
					<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fillRule="evenodd" clipRule="evenodd" d="M22.5 41.25C32.8556 41.25 41.25 32.8556 41.25 22.5C41.25 12.1444 32.8556 3.75 22.5 3.75C12.1444 3.75 3.75 12.1444 3.75 22.5C3.75 32.8556 12.1444 41.25 22.5 41.25ZM30.1238 14.8763C30.3871 15.1399 30.535 15.4973 30.535 15.87C30.535 16.2427 30.3871 16.6001 30.1238 16.8638L24.4875 22.5L30.1219 28.1344C30.3703 28.401 30.5055 28.7535 30.4991 29.1179C30.4926 29.4822 30.3451 29.8298 30.0874 30.0874C29.8298 30.3451 29.4822 30.4926 29.1179 30.4991C28.7535 30.5055 28.401 30.3703 28.1344 30.1219L22.5 24.4913L16.8656 30.1256C16.7369 30.2638 16.5816 30.3746 16.4091 30.4515C16.2366 30.5283 16.0504 30.5697 15.8616 30.573C15.6728 30.5763 15.4852 30.5416 15.3101 30.4709C15.135 30.4001 14.976 30.2949 14.8424 30.1613C14.7089 30.0278 14.6036 29.8687 14.5329 29.6936C14.4622 29.5185 14.4274 29.331 14.4308 29.1421C14.4341 28.9533 14.4754 28.7671 14.5523 28.5946C14.6291 28.4221 14.74 28.2669 14.8781 28.1381L20.5087 22.5L14.8763 16.8656C14.7381 16.7369 14.6273 16.5816 14.5504 16.4091C14.4736 16.2366 14.4322 16.0504 14.4289 15.8616C14.4256 15.6728 14.4603 15.4852 14.531 15.3101C14.6017 15.135 14.707 14.976 14.8406 14.8424C14.9741 14.7089 15.1332 14.6036 15.3083 14.5329C15.4834 14.4622 15.6709 14.4274 15.8597 14.4308C16.0485 14.4341 16.2348 14.4754 16.4073 14.5523C16.5798 14.6291 16.735 14.74 16.8638 14.8781L22.5 20.5087L28.1344 14.8744C28.398 14.611 28.7555 14.4631 29.1281 14.4631C29.5008 14.4631 29.8582 14.611 30.1219 14.8744" fill="#F04665" />
					</svg>
				</div>

			</motion.div>
		</div>
	);
}

// ── Condition badge ────────────────────────────────────────────────────────────
const CONDITION_COLORS = {
	"سليم": { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
	"تالف": { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
	" جزء مفقود": { bg: "#fffbeb", border: "#fde68a", text: "#d97706" },
};
function ConditionBadge({ condition }) {
	const c = CONDITION_COLORS[condition] || CONDITION_COLORS["سليم"];
	return (
		<span className="text-nowrap" style={{
			fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
			background: c.bg, border: `1px solid ${c.border}`, color: c.text,
		}}>{condition || "سليم"}</span>
	);
}

// ── Returns orders table ───────────────────────────────────────────────────────
function ReturnsTable({ orders, scannedReturns, conditionMap, onConditionChange, onRemove, lastHighlight }) {
	const [expanded, setExpanded] = useState({});
	const toggle = (code) => setExpanded(p => ({ ...p, [code]: !p[code] }));

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
					<RefreshCw size={22} className="text-slate-300" />
				</div>
				<p className="text-sm font-semibold text-slate-400">لا توجد طلبات شُحنت بعد</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden">
			{/* Header */}
			<div className="grid text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-2.5 border-b border-slate-100 bg-slate-50/60"
				style={{ gridTemplateColumns: "32px 1fr 110px 90px 80px 120px 36px" }}>
				<span />
				<span>الطلب</span>
				<span>العميل</span>
				<span>المدينة</span>
				<span className="text-center">المنتجات</span>
				<span className="text-center">الحالة</span>
				<span />
			</div>

			<div className="divide-y divide-slate-100/80">
				{orders.map((order, idx) => {
					const isScanned = scannedReturns.some(o => o.code === order.code);
					const isFlash = lastHighlight?.code === order.code;
					const isOpen = !!expanded[order.code];
					const prodCount = order.products?.length ?? 0;
					const condition = conditionMap[order.code] || "سليم";

					return (
						<motion.div key={order.code} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.025, duration: 0.18 }}>

							{/* Main row */}
							<div
								className={cn(
									"relative grid items-center px-5 py-3 transition-all duration-200 cursor-pointer select-none",
									isScanned ? "bg-amber-50/60" : "hover:bg-slate-50/70"
								)}
								style={{ gridTemplateColumns: "32px 1fr 110px 90px 80px 120px 36px" }}
								onClick={() => prodCount > 0 && toggle(order.code)}
							>
								{/* Flash overlay */}
								<AnimatePresence>
									{isFlash && (
										<motion.div initial={{ opacity: 0.45 }} animate={{ opacity: 0 }} transition={{ duration: 0.9 }}
											className={cn("absolute inset-0 pointer-events-none",
												lastHighlight?.ok ? "bg-amber-400/20" : "bg-red-400/20")} />
									)}
								</AnimatePresence>

								{/* Left scanned indicator bar */}
								{isScanned && (
									<div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
								)}

								{/* Status indicator */}
								<div className="flex items-center justify-center">
									<div className={cn(
										"w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200",
										isScanned
											? "bg-amber-500 text-white shadow-[0_2px_8px_-2px_#f59e0b60]"
											: "bg-slate-100 text-slate-500"
									)}>
										{isScanned
											? <CheckCircle2 size={14} className="text-white" />
											: <span className="text-[10px] font-bold text-slate-300 tabular-nums">{idx + 1}</span>
										}
									</div>
								</div>

								{/* Code */}
								<div className="flex items-center gap-2 min-w-0">
									<span className={cn("font-black font-mono text-[13px] transition-colors",
										isScanned ? "text-amber-700" : "text-slate-800")}>{order.code}</span>
									{isScanned && (
										<motion.span initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
											className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200/60">
											↩ مرتجع
										</motion.span>
									)}
								</div>

								{/* Customer */}
								<div className="min-w-0">
									<div className="text-[12px] font-semibold text-slate-700 truncate">{order.customer || "—"}</div>
								</div>

								{/* City */}
								<div className="text-[11px] text-slate-400 truncate">{order.city || "—"}</div>

								{/* Product count + expand */}
								<div className="flex items-center justify-center gap-1.5">
									<span className="text-xs font-black text-slate-700 tabular-nums">{prodCount}</span>
									{prodCount > 0 && (
										<motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
											<ChevronDown size={12} className="text-slate-400" />
										</motion.div>
									)}
								</div>

								{/* Condition selector (only when scanned) */}
								<div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
									{isScanned ? (
										<Select value={condition} onValueChange={(v) => onConditionChange(order.code, v)}>
											<SelectTrigger className={cn(
												"h-7 rounded-lg text-[11px] font-bold border px-2 w-28",
												condition === "تالف" ? "bg-red-50 border-red-200 text-red-700" :
													condition === "مفقود جزء" ? "bg-amber-50 border-amber-200 text-amber-700" :
														"bg-emerald-50 border-emerald-200 text-emerald-700"
											)}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{PRODUCT_CONDITIONS.map((c) => (
													<SelectItem key={c} value={c}>
														<ConditionBadge condition={c} />
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<span className="text-[11px] text-slate-300">—</span>
									)}
								</div>

								{/* Empty last column */}
								<div />
							</div>

							{/* Products sub-table */}
							<AnimatePresence>
								{isOpen && prodCount > 0 && (
									<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
										style={{ overflow: "hidden" }}>
										<div className={cn(
											"border-t",
											isScanned ? "border-amber-100 bg-amber-50/30" : "border-slate-100 bg-slate-50/50"
										)}>
											{/* Sub-table header */}
											<div className={cn(
												"grid text-[9px] font-bold uppercase tracking-widest px-5 py-2.5 border-b",
												isScanned ? "text-amber-600/70 border-amber-100" : "text-slate-400 border-slate-100"
											)} style={{ gridTemplateColumns: "2fr 90px 70px 80px" }}>
												<span>المنتج</span>
												<span className="text-center">SKU</span>
												<span className="text-center">الكمية</span>
												<span className="text-center">السعر</span>
											</div>
											<div className="divide-y divide-slate-100/60">
												{order.products.map((p, pi) => (
													<motion.div
														key={p.sku || pi}
														initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
														transition={{ delay: pi * 0.04 }}
														className="grid items-center px-5 py-3 hover:bg-white/70 transition-colors"
														style={{ gridTemplateColumns: "2fr 90px 70px 80px" }}
													>
														<div className="flex items-center gap-2.5 min-w-0">
															<div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f59e0b15" }}>
																<Package size={11} style={{ color: "#f59e0b" }} />
															</div>
															<span className="text-[12px] font-semibold text-slate-700 truncate">{p.name}</span>
														</div>
														<div className="text-center">
															<code className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">{p.sku}</code>
														</div>
														<div className="flex justify-center">
															<span className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-[11px] font-black" style={{ background: "#f59e0b15", color: "#f59e0b" }}>
																{p.requestedQty}
															</span>
														</div>
														<div className="text-center text-[12px] font-bold text-slate-600 tabular-nums">
															{p.price ? `${p.price} ر.س` : "—"}
														</div>
													</motion.div>
												))}
											</div>
											{/* Footer */}
											<div className={cn(
												"flex items-center justify-between px-5 py-2.5 border-t text-[11px] font-semibold",
												isScanned ? "border-amber-100 text-amber-700 bg-amber-50/50" : "border-slate-100 text-slate-500 bg-slate-50"
											)}>
												<span>{prodCount} منتج إجمالاً</span>
												{order.total && <span className="font-black text-[13px]">{order.total} ر.س</span>}
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

// ── Scan Return Subtab ─────────────────────────────────────────────────────────
function ScanReturnSubtab({ orders, updateOrder, pushOp, inventory, updateInventory, addReturnFile }) {
	const t = useTranslations("warehouse.returns");
	const shippedOrders = useMemo(() => orders.filter((o) => o.status === STATUS.SHIPPED), [orders]);

	const defaultCarrier = useMemo(() => {
		return CARRIERS.find(c => shippedOrders.some(o => o.carrier === c)) || CARRIERS[0] || "";
	}, [shippedOrders]);

	const [selectedCarrier, setSelectedCarrier] = useState(defaultCarrier);
	const [scanInput, setScanInput] = useState("");
	const [scannedReturns, setScannedReturns] = useState([]);
	const [conditionMap, setConditionMap] = useState({});
	const [wrongScans, setWrongScans] = useState(0);
	const [wrongScanLogs, setWrongScanLogs] = useState([]); // [{ code, reason, time }]
	const [lastHighlight, setLastHighlight] = useState(null);
	const [saving, setSaving] = useState(false);
	const [savedSuccess, setSavedSuccess] = useState(false);
	const [lastScanMsg, setLastScanMsg] = useState(null);
	const scanRef = useRef(null);

	const availableForCarrier = useMemo(
		() => shippedOrders.filter(o => !selectedCarrier || o.carrier === selectedCarrier),
		[shippedOrders, selectedCarrier]
	);

	useEffect(() => { setTimeout(() => scanRef.current?.focus(), 120); }, [selectedCarrier]);

	const handleCarrierChange = (val) => {
		setSelectedCarrier(val);
		setScannedReturns([]); setConditionMap({});
		setWrongScans(0); setWrongScanLogs([]);
		setLastScanMsg(null); setLastHighlight(null);
	};

	const handleScan = () => {
		const code = scanInput.trim();
		setScanInput("");
		if (!code) return;

		const now = new Date().toLocaleTimeString("ar-SA");

		if (scannedReturns.find(o => o.code === code)) {
			const reason = t("scan.alreadyScanned", { code }) || `الطلب ${code} تم مسحه مسبقاً`;
			setLastScanMsg({ success: false, message: reason });
			setWrongScans(p => p + 1);
			setWrongScanLogs(prev => [...prev, { code, reason: "تم مسحه مسبقاً", time: now }]);
			setLastHighlight({ code, ok: false });
			setTimeout(() => { setLastScanMsg(null); setLastHighlight(null); }, 2500);
			return;
		}
		const order = availableForCarrier.find(o => o.code === code);
		if (!order) {
			const reason = t("scan.notFound", { code }) || `الطلب ${code} غير موجود`;
			setLastScanMsg({ success: false, message: reason });
			setWrongScans(p => p + 1);
			setWrongScanLogs(prev => [...prev, { code, reason: "الطلب غير موجود أو لا ينتمي لهذه الشركة", time: now }]);
			setLastHighlight({ code: null, ok: false });
			setTimeout(() => { setLastScanMsg(null); setLastHighlight(null); }, 2500);
			return;
		}
		setScannedReturns(prev => [...prev, order]);
		setConditionMap(prev => ({ ...prev, [code]: "سليم" }));
		setLastScanMsg({ success: true, message: t("scan.addedSuccess", { code }) || `✓ تم إضافة الطلب ${code}` });
		setLastHighlight({ code, ok: true });
		setTimeout(() => { setLastScanMsg(null); setLastHighlight(null); }, 2500);
		setTimeout(() => scanRef.current?.focus(), 50);
	};

	const removeScanned = (code) => {
		setScannedReturns(prev => prev.filter(o => o.code !== code));
		setConditionMap(prev => { const n = { ...prev }; delete n[code]; return n; });
		if (lastHighlight?.code === code) setLastHighlight(null);
	};

	const handleConditionChange = (code, val) => setConditionMap(prev => ({ ...prev, [code]: val }));

	const handleDownloadWrongLogs = () => {
		const now = new Date().toISOString().slice(0, 16).replace("T", " ");
		openPrintWindow(buildWrongScanLogPDF(wrongScanLogs, selectedCarrier, "System", now));
	};

	const handleSave = async () => {
		if (scannedReturns.length === 0 || !selectedCarrier) return;
		setSaving(true);
		try {
			const now = new Date().toISOString().slice(0, 16).replace("T", " ");
			const codes = scannedReturns.map(o => o.code);
			codes.forEach(code => {
				const order = scannedReturns.find(o => o.code === code);
				const condition = conditionMap[code] || "سليم";
				updateOrder(code, { status: STATUS.CONFIRMED, returnedAt: now, returnCondition: condition, carrier: "", trackingCode: "" });
				if (inventory && updateInventory) updateInventory(returnInventoryFromCarrier(order.products, inventory));
				pushOp({ id: `OP-${Date.now()}-${code}`, operationType: "RETURN_ORDER", orderCode: code, carrier: selectedCarrier, employee: "System", result: "SUCCESS", details: `${t("scan.returnOpDetails")} ${selectedCarrier}`, createdAt: now });
			});
			const ordersWithCondition = scannedReturns.map(o => ({ ...o, returnCondition: conditionMap[o.code] || "سليم" }));
			addReturnFile({ id: `RET-${Date.now()}`, carrier: selectedCarrier, type: "return", orderCodes: codes, createdAt: now, createdBy: "System", filename: `returns_${selectedCarrier}_${now.split(" ")[0].replace(/-/g, "")}.pdf`, ordersSnapshot: ordersWithCondition, wrongScanLogs });
			openPrintWindow(buildReturnPDF(ordersWithCondition, selectedCarrier, "System", now));
			setScannedReturns([]); setConditionMap({}); setWrongScans(0); setWrongScanLogs([]); setLastHighlight(null);
			setSavedSuccess(true);
			setTimeout(() => setSavedSuccess(false), 3000);
		} finally { setSaving(false); }
	};

	const scannedCount = scannedReturns.length;
	const meta = selectedCarrier ? getCarrierMeta(selectedCarrier) : null;
	const damagedCount = Object.values(conditionMap).filter(v => v !== "سليم").length;

	return (
		<div className="space-y-4">

			{/* ── Scan bar card ── */}
			<div className="bg-card">
				<ScanBar
					className="!p-0"
					cnLabel={"hidden"}
					CARRIERS={CARRIERS}
					shippedOrders={shippedOrders}
					selectedCarrier={selectedCarrier}
					onCarrierChange={handleCarrierChange}
					scanInput={scanInput}
					onScanChange={setScanInput}
					onScan={handleScan}
					lastScanMsg={lastScanMsg}
					scanRef={scanRef}
				/>

				<div className="pt-4">
					<StatBoxes
						scannedCount={scannedCount}
						wrongScans={wrongScans}
					/>
				</div>
			</div>

			{selectedCarrier && (
				<>
					{/* ── Orders table card ── */}
					<div className="bg-card overflow-hidden">

						{/* Table header bar */}
						<div className="flex items-center justify-between pb-4 border-b border-slate-100">
							<div className="flex items-center gap-2.5">
								<div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta?.color + "12" }}>
									<RefreshCw size={13} style={{ color: meta?.color || "#f59e0b" }} />
								</div>
								<span className="text-sm font-bold text-slate-700">مرتجعات {selectedCarrier}</span>
								<span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono tabular-nums">
									{availableForCarrier.length}
								</span>

								{/* Scanned progress */}
								{availableForCarrier.length > 0 && scannedCount > 0 && (
									<div className="flex items-center gap-2 ms-1">
										<div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
											<motion.div
												animate={{ width: `${(scannedCount / availableForCarrier.length) * 100}%` }}
												transition={{ duration: 0.4, ease: "easeOut" }}
												className="h-full rounded-full"
												style={{ background: "#f59e0b" }}
											/>
										</div>
										<span className="text-[10px] font-bold tabular-nums" style={{ color: "#f59e0b" }}>
											{scannedCount}/{availableForCarrier.length}
										</span>
									</div>
								)}
							</div>

							{/* Actions */}
							{scannedCount > 0 && (
								<div className="flex items-center gap-3">
									<AnimatePresence>
										{savedSuccess && (
											<motion.span initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
												className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
												<CheckCircle2 size={12} /> تم الحفظ
											</motion.span>
										)}
									</AnimatePresence>

									{/* Download wrong scan logs button (header area) */}
									{wrongScans > 0 && (
										<motion.button
											initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
											onClick={handleDownloadWrongLogs}
											whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
											className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-bold
                        text-red-700 bg-red-50 border border-red-200
                        hover:bg-red-500 hover:text-white hover:border-red-500
                        transition-all duration-150"
										>
											<FileText size={13} />
											سجل الأخطاء
											<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
												{wrongScans}
											</span>
										</motion.button>
									)}

									<motion.button
										onClick={handleSave} disabled={saving}
										whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
										className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-bold text-white
                      bg-gradient-to-r from-amber-500 to-orange-500
                      shadow-[0_2px_10px_-2px_rgba(245,158,11,0.5)]
                      hover:shadow-[0_4px_14px_-2px_rgba(245,158,11,0.6)]
                      disabled:opacity-60 transition-shadow duration-150"
									>
										{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
										تأكيد الاستلام
										<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[10px] font-black">
											{scannedCount}
										</span>
									</motion.button>
								</div>
							)}
						</div>

						{/* The table */}
						<ReturnsTable
							orders={availableForCarrier}
							scannedReturns={scannedReturns}
							conditionMap={conditionMap}
							onConditionChange={handleConditionChange}
							onRemove={removeScanned}
							lastHighlight={lastHighlight}
						/>
					</div>

					{/* ── Save note ── */}
					{scannedCount > 0 && (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
							className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50/80 border border-amber-200/50 text-amber-700">
							<Info size={13} className="flex-shrink-0 mt-0.5" />
							<p className="text-[12px]">{t("scan.saveWarning")}</p>
						</motion.div>
					)}
				</>
			)}
		</div>
	);
}

// ── Return Files Subtab ────────────────────────────────────────────────────────
function ReturnFilesSubtab({ returnFiles, orders }) {
	const t = useTranslations("warehouse.returns");
	const [search, setSearch] = useState("");
	const [filterCarrier, setFilterCarrier] = useState("all");
	const [downloading, setDownloading] = useState({});
	const [downloadingWrongLog, setDownloadingWrongLog] = useState({});
	const [page, setPage] = useState({ current_page: 1, per_page: 12 });

	const filtered = useMemo(() => {
		let base = returnFiles;
		const q = search.trim().toLowerCase();
		if (q) base = base.filter(f => [f.id, f.carrier, f.filename].some(x => String(x || "").toLowerCase().includes(q)));
		if (filterCarrier !== "all") base = base.filter(f => f.carrier === filterCarrier);
		return base;
	}, [returnFiles, search, filterCarrier]);

	const handleDownload = async (file) => {
		setDownloading(p => ({ ...p, [file.id]: true }));
		await new Promise(r => setTimeout(r, 800));
		const snap = file.ordersSnapshot || orders.filter(o => file.orderCodes.includes(o.code)).map(o => ({ ...o, returnCondition: "سليم" }));
		openPrintWindow(buildReturnPDF(snap, file.carrier, file.createdBy, file.createdAt));
		setDownloading(p => ({ ...p, [file.id]: false }));
	};

	const handleDownloadWrongLog = async (file) => {
		setDownloadingWrongLog(p => ({ ...p, [file.id]: true }));
		await new Promise(r => setTimeout(r, 600));
		const logs = file.wrongScanLogs || [];
		openPrintWindow(buildWrongScanLogPDF(logs, file.carrier, file.createdBy, file.createdAt));
		setDownloadingWrongLog(p => ({ ...p, [file.id]: false }));
	};

	const columns = useMemo(() => [
		{ key: "id", header: t("files.th.fileNumber"), cell: (row) => <span className="font-mono font-bold text-primary">{row.id}</span> },
		{
			key: "carrier", header: t("files.th.carrier"),
			cell: (row) => {
				const m = getCarrierMeta(row.carrier);
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
						style={{ background: m.light, borderColor: m.color + "30", color: m.color }}>
						<Truck size={11} /> {row.carrier}
					</span>
				);
			},
		},
		{
			key: "orderCodes", header: t("files.th.returnedOrders"),
			cell: (row) => (
				<div className="flex flex-wrap gap-1">
					{row.orderCodes.map(code => (
						<span key={code} className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">{code}</span>
					))}
				</div>
			),
		},
		{ key: "createdAt", header: t("files.th.createdAt"), cell: (row) => <span className="text-sm text-slate-500">{row.createdAt}</span> },
		{ key: "createdBy", header: t("files.th.createdBy") },
		{
			key: "actions", header: t("files.th.actions"),
			cell: (row) => (
				<div className="flex items-center gap-2">
					<motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
						onClick={() => handleDownload(row)} disabled={!!downloading[row.id]}
						className="px-3 h-9 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white text-sm font-medium transition-all flex items-center gap-1 disabled:opacity-60">
						{downloading[row.id] ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
						{t("files.download")}
					</motion.button>
					<motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
						onClick={() => handleDownloadWrongLog(row)} disabled={!!downloadingWrongLog[row.id]}
						title="تحميل سجل الأخطاء"
						className="px-3 h-9 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-500 hover:text-white text-sm font-medium transition-all flex items-center gap-1 disabled:opacity-60">
						{downloadingWrongLog[row.id] ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
						سجل الأخطاء
					</motion.button>
				</div>
			),
		},
	], [downloading, downloadingWrongLog, t]);

	return (
		<Table
			searchValue={search} onSearchChange={setSearch} onSearch={() => { }}
			labels={{ searchPlaceholder: t("files.searchPlaceholder"), filter: t("common.filter"), apply: t("common.apply"), total: t("common.total"), limit: t("common.limit"), emptyTitle: t("files.emptyTitle"), emptySubtitle: "" }}
			actions={[]} hasActiveFilters={filterCarrier !== "all"} onApplyFilters={() => { }}
			filters={
				<FilterField label={t("common.carrier")}>
					<Select value={filterCarrier} onValueChange={setFilterCarrier}>
						<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm"><SelectValue placeholder={t("common.allCarriers")} /></SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("common.allCarriers")}</SelectItem>
							{CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
						</SelectContent>
					</Select>
				</FilterField>
			}
			columns={columns} data={filtered} isLoading={false}
			pagination={{ total_records: filtered.length, current_page: page.current_page, per_page: page.per_page }}
			onPageChange={({ page: p, per_page }) => setPage({ current_page: p, per_page })}
		/>
	);
}

// ── Main ReturnsTab ────────────────────────────────────────────────────────────
export default function ReturnsTab({ orders, updateOrder, pushOp, inventory, updateInventory, returnFiles, addReturnFile, subtab, setSubtab }) {
	const t = useTranslations("warehouse.returns");
	const shipped = orders.filter(o => o.status === STATUS.SHIPPED);
	const today = new Date().toISOString().split("T")[0];

	const stats = [
		{ id: "with-carrier", name: t("stats.withCarrier"), value: shipped.length, icon: Truck, color: "#3b82f6", sortOrder: 0 },
		{ id: "return-files", name: t("stats.returnFiles"), value: returnFiles.length, icon: RefreshCw, color: "#f59e0b", sortOrder: 1 },
		{ id: "returned-today", name: t("stats.returnedToday"), value: orders.filter(o => o.returnedAt?.startsWith(today)).length, icon: Calendar, color: "#ef4444", sortOrder: 2 },
		{ id: "total-returns", name: t("stats.totalReturns"), value: orders.filter(o => !!o.returnedAt).length, icon: Package, color: "#a855f7", sortOrder: 3 },
	];

	return (
		<div className="space-y-4">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumbs.home"), href: "/" },
					{ name: t("breadcrumbs.warehouse"), href: "/warehouse" },
					{ name: t("breadcrumbs.returns") },
				]}
				buttons={<Button_ size="sm" label={t("header.howItWorks")} variant="ghost" onClick={() => { }} icon={<Info size={18} />} />}
				stats={stats}
				items={[
					{ id: "scan", label: t("subtabs.scanReturn"), count: shipped.length, icon: ScanLine },
					{ id: "files", label: t("subtabs.files"), count: returnFiles.length, icon: FileDown },
				]}
				active={subtab}
				setActive={setSubtab}
			/>

			<AnimatePresence mode="wait">
				<motion.div key={subtab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
					{subtab === "scan" && <ScanReturnSubtab orders={orders} updateOrder={updateOrder} pushOp={pushOp} inventory={inventory} updateInventory={updateInventory} addReturnFile={addReturnFile} />}
					{subtab === "files" && <ReturnFilesSubtab returnFiles={returnFiles} orders={orders} />}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}