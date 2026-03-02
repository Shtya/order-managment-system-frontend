"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Download, FileDown, FileText,
	Truck, Package, CheckCircle2,
	ChevronDown, Save, Loader2, Info,
	ScanLine,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Table, { FilterField } from "@/components/atoms/Table";
import PageHeader from "../../../../components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import { STATUS, CARRIERS, deductInventoryForShipment } from "./data";
import ScanBar from "../atoms/ScanBar";


// ── PDF ────────────────────────────────────────────────────────────────────────
const PDF_STYLE = `<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;color:#1e293b;background:#fff;padding:28px 32px}.header-bar{background:linear-gradient(135deg,#ff8b00,#ff5c2b);color:#fff;padding:16px 20px;border-radius:12px;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:13px}thead{background:#f1f5f9}th{text-align:right;padding:9px 12px;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0}td{padding:8px 12px;border-bottom:1px solid #f1f5f9}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}.info-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px}.info-label{font-size:10px;color:#94a3b8;margin-bottom:3px}.info-value{font-size:13px;font-weight:600}.sig-box{margin-top:32px;border:2px dashed #cbd5e1;border-radius:12px;padding:22px}.sig-row{display:flex;gap:20px;margin-top:10px}.sig-field{flex:1;border-bottom:1px solid #94a3b8;padding-bottom:6px}.sig-field-label{font-size:11px;color:#94a3b8;margin-bottom:28px}@media print{button{display:none}}</style>`;

const WRONG_SCAN_PDF_STYLE = `<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;color:#1e293b;background:#fff;padding:28px 32px}.header-bar{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:16px 20px;border-radius:12px;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:13px}thead{background:#fef2f2}th{text-align:right;padding:9px 12px;font-weight:600;color:#991b1b;border-bottom:2px solid #fecaca}td{padding:8px 12px;border-bottom:1px solid #fff1f2}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}.info-card{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 14px}.info-label{font-size:10px;color:#991b1b;margin-bottom:3px}.info-value{font-size:13px;font-weight:600}.badge-error{background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:99px;font-size:11px;border:1px solid #fecaca}@media print{button{display:none}}</style>`;

function buildOutgoingPDF(orders, carrier, employee, now) {
	const ordersHTML = orders.map((o) => {
		const rows = o.products.map((p) => `<tr><td><code>${p.sku}</code></td><td>${p.name}</td><td style="text-align:center">${p.requestedQty}</td><td>${o.trackingCode || "—"}</td></tr>`).join("");
		return `<div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><div style="background:#f8fafc;padding:10px 16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center"><div style="font-size:15px;font-weight:700;font-family:monospace">${o.code}</div><div style="font-size:12px;color:#64748b">${o.customer} — ${o.city}</div></div><div style="padding:14px 16px"><table><thead><tr><th>SKU</th><th>المنتج</th><th style="text-align:center">الكمية</th><th>كود التتبع</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
	}).join("");
	return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ملف خروج</title>${PDF_STYLE}</head><body><div class="header-bar"><div style="font-size:18px;font-weight:700;margin-bottom:4px">📦 ملف خروج الطلبات — ${carrier}</div><div style="font-size:12px;opacity:.85">تاريخ الطباعة: ${now} | الموظف: ${employee} | عدد الطلبات: ${orders.length}</div></div><div class="info-grid"><div class="info-card"><div class="info-label">شركة الشحن</div><div class="info-value">${carrier}</div></div><div class="info-card"><div class="info-label">تاريخ الشحن</div><div class="info-value">${now}</div></div><div class="info-card"><div class="info-label">الموظف</div><div class="info-value">${employee}</div></div><div class="info-card"><div class="info-label">إجمالي الطلبات</div><div class="info-value">${orders.length} طلب</div></div></div>${ordersHTML}<div class="sig-box"><div style="font-size:13px;font-weight:700;margin-bottom:14px;color:#334155">✍ تأكيد الاستلام</div><div class="sig-row"><div class="sig-field"><div class="sig-field-label">اسم مندوب شركة الشحن</div></div><div class="sig-field"><div class="sig-field-label">التوقيع</div></div><div class="sig-field"><div class="sig-field-label">التاريخ والوقت</div></div></div></div></body></html>`;
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


// ── helpers ────────────────────────────────────────────────────────────────────
const CARRIER_META = {
	ARAMEX: { color: "#ef4444", light: "#fef2f2", gradient: "from-red-500 to-rose-600" },
	SMSA:   { color: "#3b82f6", light: "#eff6ff", gradient: "from-blue-500 to-indigo-600" },
	DHL:    { color: "#ca8a04", light: "#fefce8", gradient: "from-yellow-500 to-amber-600" },
	BOSTA:  { color: "#f97316", light: "#fff7ed", gradient: "from-orange-500 to-red-500" },
};
function getCarrierMeta(c = "") {
	return CARRIER_META[c.toUpperCase().replace(/\s/g, "")] || { color: "#ff8b00", light: "#fff8f0", gradient: "from-orange-500 to-amber-500" };
}


// ── Two stat boxes ─────────────────────────────────────────────────────────────
function StatBoxes({ scannedCount, wrongScans }) {
	return (
		<div className="grid grid-cols-2 gap-3 mt-3">
			{/* Scanned orders */}
			<motion.div
				initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
				className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50 p-4"
			>
				<div className="absolute -right-2 top-2 w-20 h-20 rounded-full bg-emerald-400/10" />
				<div className="relative flex gap-4 items-center justify-between">
					<div>
						<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" />
							<rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#1B9928" strokeDasharray="2 2" />
							<path d="M20.2793 27.75L21.5293 29H11.5V11.5H16.5C16.5 11.1549 16.5651 10.8327 16.6953 10.5332C16.8255 10.2337 17.0046 9.9668 17.2324 9.73242C17.4603 9.49805 17.724 9.31901 18.0234 9.19531C18.3229 9.07161 18.6484 9.00651 19 9C19.3451 9 19.6673 9.0651 19.9668 9.19531C20.2663 9.32552 20.5332 9.50456 20.7676 9.73242C21.002 9.96029 21.181 10.224 21.3047 10.5234C21.4284 10.8229 21.4935 11.1484 21.5 11.5H26.5V21.5293L25.25 22.7793V12.75H24V15.25H14V12.75H12.75V27.75H20.2793ZM15.25 12.75V14H22.75V12.75H20.25V11.5C20.25 11.3242 20.2174 11.1615 20.1523 11.0117C20.0872 10.862 19.9993 10.7318 19.8887 10.6211C19.778 10.5104 19.6445 10.4193 19.4883 10.3477C19.332 10.276 19.1693 10.2435 19 10.25C18.8242 10.25 18.6615 10.2826 18.5117 10.3477C18.362 10.4128 18.2318 10.5007 18.1211 10.6113C18.0104 10.722 17.9193 10.8555 17.8477 11.0117C17.776 11.168 17.7435 11.3307 17.75 11.5V12.75H15.25ZM28.8145 23.1895L23.375 28.6387L20.748 26.002L21.627 25.123L23.375 26.8613L27.9355 22.3105L28.8145 23.1895Z" fill="#1B9928" />
						</svg>
					</div>
					<div className="flex-1">
						<p className="text-[16px] font-bold uppercase tracking-widest text-emerald-600/70 mb-1">الطلبات الممسوحة</p>
						<AnimatePresence mode="wait">
							<motion.p
								key={scannedCount}
								initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
								transition={{ type: "spring", stiffness: 500, damping: 28 }}
								className="text-4xl font-black tabular-nums text-emerald-700 leading-none"
							>
								{scannedCount}
							</motion.p>
						</AnimatePresence>
					</div>
					<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fillRule="evenodd" clipRule="evenodd" d="M22.5 41.25C32.8556 41.25 41.25 32.8556 41.25 22.5C41.25 12.1444 32.8556 3.75 22.5 3.75C12.1444 3.75 3.75 12.1444 3.75 22.5C3.75 32.8556 12.1444 41.25 22.5 41.25ZM32.5706 16.5656C32.6583 16.4753 32.727 16.3682 32.7724 16.2507C32.8178 16.1332 32.8391 16.0078 32.8349 15.882C32.8308 15.7561 32.8014 15.6323 32.7484 15.5181C32.6954 15.4039 32.6199 15.3015 32.5265 15.217C32.433 15.1326 32.3235 15.0679 32.2045 15.0267C32.0855 14.9855 31.9594 14.9687 31.8338 14.9773C31.7081 14.986 31.5855 15.0198 31.4732 15.0768C31.361 15.1339 31.2613 15.213 31.1803 15.3094L19.95 27.7191L13.7719 21.8212C13.5921 21.6494 13.3515 21.5561 13.1028 21.5617C12.8542 21.5673 12.6181 21.6715 12.4462 21.8512C12.2744 22.031 12.1811 22.2717 12.1867 22.5203C12.1923 22.7689 12.2965 23.0051 12.4762 23.1769L19.3519 29.7394L20.0484 30.405L20.6944 29.6906L32.5706 16.5656Z" fill="#2F9139" />
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


// ── Orders list — flat table-row style matching ReturnsTable ──────────────────
function OrdersList({ orders, scannedOrders, lastHighlight }) {
	const [expanded, setExpanded] = useState({});
	const toggle = (code) => setExpanded(p => ({ ...p, [code]: !p[code] }));

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
					<Package size={22} className="text-slate-300" />
				</div>
				<p className="text-sm font-semibold text-slate-400">لا توجد طلبات جاهزة</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden">
			{/* Table header */}
			<div
				className="grid text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-2.5 border-b border-slate-100 bg-slate-50/60"
				style={{ gridTemplateColumns: "32px 1fr 110px 90px 80px 110px" }}
			>
				<span />
				<span>الطلب</span>
				<span>العميل</span>
				<span>المدينة</span>
				<span className="text-center">المنتجات</span>
				<span className="text-center">الإجمالي</span>
			</div>

			<div className="divide-y divide-slate-100/80">
				{orders.map((order, idx) => {
					const isScanned = scannedOrders.some(o => o.code === order.code);
					const isFlash   = lastHighlight?.code === order.code;
					const isOpen    = !!expanded[order.code];
					const prodCount = order.products?.length ?? 0;

					return (
						<motion.div key={order.code} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.025, duration: 0.18 }}>

							{/* Main row */}
							<div
								className={cn(
									"relative grid items-center px-5 py-3 transition-all duration-200 cursor-pointer select-none",
									isScanned ? "bg-emerald-50/60" : "hover:bg-slate-50/70"
								)}
								style={{ gridTemplateColumns: "32px 1fr 110px 90px 80px 110px" }}
								onClick={() => prodCount > 0 && toggle(order.code)}
							>
								{/* Flash overlay */}
								<AnimatePresence>
									{isFlash && (
										<motion.div initial={{ opacity: 0.45 }} animate={{ opacity: 0 }} transition={{ duration: 0.9 }}
											className={cn("absolute inset-0 pointer-events-none",
												lastHighlight?.ok ? "bg-emerald-400/20" : "bg-red-400/20")} />
									)}
								</AnimatePresence>

								{/* Left scanned bar */}
								{isScanned && (
									<div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
								)}

								{/* Status badge */}
								<div className="flex items-center justify-center">
									<div className={cn(
										"w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200",
										isScanned
											? "bg-emerald-500 text-white shadow-[0_2px_8px_-2px_#10b98160]"
											: "bg-slate-100"
									)}>
										{isScanned
											? <CheckCircle2 size={14} className="text-white" />
											: <span className="text-[10px] font-bold text-slate-300 tabular-nums">{idx + 1}</span>
										}
									</div>
								</div>

								{/* Code + scanned badge */}
								<div className="flex items-center gap-2 min-w-0">
									<span className={cn("font-black font-mono text-[13px] transition-colors",
										isScanned ? "text-emerald-800" : "text-slate-800")}>{order.code}</span>
									{isScanned && (
										<motion.span initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
											className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/60">
											✓ ممسوح
										</motion.span>
									)}
								</div>

								{/* Customer */}
								<div className="min-w-0">
									<div className="text-[12px] font-semibold text-slate-700 truncate">{order.customer || "—"}</div>
								</div>

								{/* City */}
								<div className="text-[11px] text-slate-400 truncate">{order.city || "—"}</div>

								{/* Product count + expand chevron */}
								<div className="flex items-center justify-center gap-1.5">
									<span className="text-xs font-black text-slate-700 tabular-nums">{prodCount}</span>
									{prodCount > 0 && (
										<motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
											<ChevronDown size={12} className="text-slate-400" />
										</motion.div>
									)}
								</div>

								{/* Total */}
								<div className="flex items-center justify-center">
									{order.total ? (
										<span className="text-[12px] font-black text-slate-700 tabular-nums">
											{order.total}
											<span className="text-[9px] text-slate-400 font-normal ms-0.5">ر.س</span>
										</span>
									) : <span className="text-slate-300 text-xs">—</span>}
								</div>
							</div>

							{/* Products sub-table */}
							<AnimatePresence>
								{isOpen && prodCount > 0 && (
									<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
										style={{ overflow: "hidden" }}>
										<div className="border-t border-slate-100 bg-slate-50/50">
											{/* Sub-table header */}
											<div className="grid text-[9px] font-bold uppercase tracking-widest px-5 py-2.5 border-b text-slate-400 border-slate-100"
												style={{ gridTemplateColumns: "2fr 90px 70px 80px 80px" }}>
												<span>المنتج</span>
												<span className="text-center">SKU</span>
												<span className="text-center">الكمية</span>
												<span className="text-center">السعر</span>
												<span className="text-center">الإجمالي</span>
											</div>
											<div className="divide-y divide-slate-100/60">
												{order.products.map((p, pi) => (
													<motion.div key={p.sku || pi}
														initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
														transition={{ delay: pi * 0.04 }}
														className="grid items-center px-5 py-3 hover:bg-white/70 transition-colors"
														style={{ gridTemplateColumns: "2fr 90px 70px 80px 80px" }}
													>
														<div className="flex items-center gap-2.5 min-w-0">
															<div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#ff8b0012" }}>
																<Package size={11} style={{ color: "#ff8b00" }} />
															</div>
															<div className="min-w-0">
																<p className="text-[12px] font-semibold text-slate-700 truncate">{p.name}</p>
																{p.category && <p className="text-[10px] text-slate-400 truncate">{p.category}</p>}
															</div>
														</div>
														<div className="text-center">
															<code className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">{p.sku || "—"}</code>
														</div>
														<div className="flex justify-center">
															<span className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-[11px] font-black" style={{ background: "#ff8b0015", color: "#ff8b00" }}>
																{p.requestedQty}
															</span>
														</div>
														<div className="text-center">
															<span className="text-[12px] font-bold text-slate-600 tabular-nums">{p.price ? `${p.price}` : "—"}</span>
															{p.price && <span className="text-[9px] text-slate-400 ms-0.5">ر.س</span>}
														</div>
														<div className="text-center">
															{p.price && p.requestedQty ? (
																<span className="text-[12px] font-black text-slate-800 tabular-nums">
																	{(p.price * p.requestedQty).toFixed(2)}
																	<span className="text-[9px] text-slate-400 font-normal ms-0.5">ر.س</span>
																</span>
															) : <span className="text-slate-300 text-xs">—</span>}
														</div>
													</motion.div>
												))}
											</div>
											{/* Footer */}
											<div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 text-[11px] font-semibold text-slate-500 bg-slate-50">
												<span>{prodCount} منتج إجمالاً</span>
												{order.total && <span className="font-black text-[13px] text-slate-700">{order.total} ر.س</span>}
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


// ── Main ScanOutgoingSubtab ────────────────────────────────────────────────────
export function ScanOutgoingSubtab({ orders, updateOrder, pushOp, inventory, updateInventory, addDeliveryFile }) {
	const preparedOrders = useMemo(() => orders.filter(o => o.status === STATUS.PREPARED), [orders]);

	const defaultCarrier = useMemo(() => {
		return CARRIERS.find(c => preparedOrders.some(o => o.carrier === c)) || CARRIERS[0] || "";
	}, [preparedOrders]);

	const [selectedCarrier, setSelectedCarrier] = useState(defaultCarrier);
	const [scanInput,       setScanInput]       = useState("");
	const [scannedOrders,   setScannedOrders]   = useState([]);
	const [wrongScans,      setWrongScans]      = useState(0);
	const [wrongScanLogs,   setWrongScanLogs]   = useState([]); // { code, reason, time }[]
	const [lastHighlight,   setLastHighlight]   = useState(null);
	const [saving,          setSaving]          = useState(false);
	const [savedSuccess,    setSavedSuccess]    = useState(false);
	const [lastScanMsg,     setLastScanMsg]     = useState(null);
	const scanRef = useRef(null);

	const availableForCarrier = useMemo(
		() => preparedOrders.filter(o => !selectedCarrier || o.carrier === selectedCarrier),
		[preparedOrders, selectedCarrier]
	);

	useEffect(() => { setTimeout(() => scanRef.current?.focus(), 120); }, [selectedCarrier]);

	const handleCarrierChange = (val) => {
		setSelectedCarrier(val);
		setScannedOrders([]); setWrongScans(0); setWrongScanLogs([]);
		setLastScanMsg(null); setLastHighlight(null);
	};

	const handleScan = () => {
		const code = scanInput.trim();
		setScanInput("");
		if (!code) return;

		const now = new Date().toLocaleTimeString("ar-SA");

		if (scannedOrders.find(o => o.code === code)) {
			setLastScanMsg({ success: false, message: `الطلب ${code} تم مسحه مسبقاً` });
			setWrongScans(p => p + 1);
			setWrongScanLogs(prev => [...prev, { code, reason: "تم مسحه مسبقاً", time: now }]);
			setLastHighlight({ code, ok: false });
			setTimeout(() => { setLastScanMsg(null); setLastHighlight(null); }, 2500);
			return;
		}
		const order = availableForCarrier.find(o => o.code === code);
		if (!order) {
			setLastScanMsg({ success: false, message: `الطلب ${code} غير موجود` });
			setWrongScans(p => p + 1);
			setWrongScanLogs(prev => [...prev, { code, reason: "الطلب غير موجود أو لا ينتمي لهذه الشركة", time: now }]);
			setLastHighlight({ code: null, ok: false });
			setTimeout(() => { setLastScanMsg(null); setLastHighlight(null); }, 2500);
			return;
		}
		setScannedOrders(prev => [...prev, order]);
		setLastScanMsg({ success: true, message: `✓ تم إضافة الطلب ${code}` });
		setLastHighlight({ code, ok: true });
		setTimeout(() => { setLastScanMsg(null); setLastHighlight(null); }, 2500);
		setTimeout(() => scanRef.current?.focus(), 50);
	};

	const handleSave = async () => {
		if (scannedOrders.length === 0 || !selectedCarrier) return;
		setSaving(true);
		try {
			const now   = new Date().toISOString().slice(0, 16).replace("T", " ");
			const codes = scannedOrders.map(o => o.code);
			codes.forEach(code => {
				const order = scannedOrders.find(o => o.code === code);
				updateOrder(code, { status: STATUS.SHIPPED, shippedAt: now });
				if (inventory && updateInventory) updateInventory(deductInventoryForShipment(order.products, inventory));
				pushOp({ id: `OP-${Date.now()}-${code}`, operationType: "SHIP_ORDER", orderCode: code, carrier: selectedCarrier, employee: "System", result: "SUCCESS", details: `شحن عبر ${selectedCarrier}`, createdAt: now });
			});
			// Save wrongScanLogs into the file record so the files tab can download them
			addDeliveryFile({
				id: `DEL-${Date.now()}`,
				carrier: selectedCarrier,
				type: "outgoing",
				orderCodes: codes,
				createdAt: now,
				createdBy: "System",
				filename: `delivery_${selectedCarrier}_${now.split(" ")[0].replace(/-/g, "")}.pdf`,
				ordersSnapshot: scannedOrders,
				wrongScanLogs,
			});
			setScannedOrders([]); setWrongScans(0); setWrongScanLogs([]); setLastHighlight(null);
			setSavedSuccess(true);
			setTimeout(() => setSavedSuccess(false), 3000);
		} finally { setSaving(false); }
	};

	const scannedCount = scannedOrders.length;
	const meta         = selectedCarrier ? getCarrierMeta(selectedCarrier) : null;

	return (
		<div className="space-y-4">

			{/* ── Scan bar + stat boxes ── */}
			<div className="bg-card">
				<ScanBar
					className="!p-0"
					cnLabel={"hidden"}
					CARRIERS={CARRIERS}
					preparedOrders={preparedOrders}
					selectedCarrier={selectedCarrier}
					onCarrierChange={handleCarrierChange}
					scanInput={scanInput}
					onScanChange={setScanInput}
					onScan={handleScan}
					lastScanMsg={lastScanMsg}
					scanRef={scanRef}
				/>
				<div className="pt-4">
					<StatBoxes scannedCount={scannedCount} wrongScans={wrongScans} />
				</div>
			</div>

			{selectedCarrier && (
				<>
					{/* ── Orders list card ── */}
					<div className="bg-card overflow-hidden">
						<div className="flex items-center justify-between pb-4 border-b border-slate-100">
							<div className="flex items-center gap-2.5">
								<div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
									style={{ background: meta?.color + "12" }}>
									<Truck size={13} style={{ color: meta?.color || "#ff8b00" }} />
								</div>
								<span className="text-sm font-bold text-slate-700">طلبات {selectedCarrier}</span>
								<span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono tabular-nums">
									{availableForCarrier.length}
								</span>

								{availableForCarrier.length > 0 && scannedCount > 0 && (
									<div className="flex items-center gap-2 ms-1">
										<div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
											<motion.div
												animate={{ width: `${(scannedCount / availableForCarrier.length) * 100}%` }}
												transition={{ duration: 0.4, ease: "easeOut" }}
												className="h-full rounded-full bg-emerald-400"
											/>
										</div>
										<span className="text-[10px] font-bold text-emerald-600 tabular-nums">
											{scannedCount}/{availableForCarrier.length}
										</span>
									</div>
								)}
							</div>

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
									<motion.button
										onClick={handleSave} disabled={saving}
										whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
										className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-bold text-white
											bg-gradient-to-r from-emerald-500 to-teal-500
											shadow-[0_2px_10px_-2px_rgba(16,185,129,0.5)]
											hover:shadow-[0_4px_14px_-2px_rgba(16,185,129,0.6)]
											disabled:opacity-60 transition-shadow duration-150"
									>
										{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
										تأكيد الخروج
										<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[10px] font-black">
											{scannedCount}
										</span>
									</motion.button>
								</div>
							)}
						</div>

						<OrdersList
							orders={availableForCarrier}
							scannedOrders={scannedOrders}
							lastHighlight={lastHighlight}
						/>
					</div>

					{/* Save note */}
					{scannedCount > 0 && (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
							className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-50/80 border border-blue-200/50 text-blue-700">
							<Info size={13} className="flex-shrink-0 mt-0.5" />
							<p className="text-[12px]">سيتم تحديث حالة الطلبات إلى "مشحون" وطباعة ملف التسليم عند الضغط على تأكيد الخروج.</p>
						</motion.div>
					)}
				</>
			)}
		</div>
	);
}


// ── PDF Files Subtab ───────────────────────────────────────────────────────────
const CARRIER_STYLES = {
	ARAMEX: { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700"    },
	SMSA:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
	DHL:    { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
	BOSTA:  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
};

function OutgoingFilesSubtab({ deliveryFiles, orders }) {
	const t = useTranslations("warehouse.outgoing");
	const [search,              setSearch]              = useState("");
	const [filterCarrier,       setFilterCarrier]       = useState("all");
	const [downloading,         setDownloading]         = useState({});
	const [downloadingWrongLog, setDownloadingWrongLog] = useState({});
	const [page,                setPage]                = useState({ current_page: 1, per_page: 12 });

	const filtered = useMemo(() => {
		let base = deliveryFiles;
		const q  = search.trim().toLowerCase();
		if (q) base = base.filter(f => [f.id, f.carrier, f.filename].some(x => String(x || "").toLowerCase().includes(q)));
		if (filterCarrier !== "all") base = base.filter(f => f.carrier === filterCarrier);
		return base;
	}, [deliveryFiles, search, filterCarrier]);

	const handleDownload = async (file) => {
		setDownloading(p => ({ ...p, [file.id]: true }));
		await new Promise(r => setTimeout(r, 800));
		const snap = file.ordersSnapshot || orders.filter(o => file.orderCodes.includes(o.code));
		openPrintWindow(buildOutgoingPDF(snap, file.carrier, file.createdBy, file.createdAt));
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
		{
			key: "id",
			header: t("files.th.fileNumber"),
			cell: (row) => <span className="font-mono font-bold text-primary">{row.id}</span>,
		},
		{
			key: "carrier",
			header: t("files.th.carrier"),
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
			key: "orderCodes",
			header: t("files.th.orders"),
			cell: (row) => (
				<div className="flex flex-wrap gap-1">
					{row.orderCodes.map(code => (
						<span key={code} className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">{code}</span>
					))}
				</div>
			),
		},
		{
			key: "createdAt",
			header: t("files.th.createdAt"),
			cell: (row) => <span className="text-sm text-slate-500">{row.createdAt}</span>,
		},
		{ key: "createdBy", header: t("files.th.createdBy") },
		{
			key: "actions",
			header: t("files.th.actions"),
			cell: (row) => (
				<div className="flex items-center gap-2">
					{/* Download PDF */}
					<motion.button
						whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
						onClick={() => handleDownload(row)} disabled={!!downloading[row.id]}
						className="px-3 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-sm font-medium transition-all flex items-center gap-1 disabled:opacity-60"
					>
						{downloading[row.id] ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
						{t("files.download")}
					</motion.button>

					{/* Download wrong scan log */}
					<motion.button
						whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
						onClick={() => handleDownloadWrongLog(row)} disabled={!!downloadingWrongLog[row.id]}
						title="تحميل سجل الأخطاء"
						className="px-3 h-9 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-500 hover:text-white text-sm font-medium transition-all flex items-center gap-1 disabled:opacity-60"
					>
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
						<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
							<SelectValue placeholder={t("common.allCarriers")} />
						</SelectTrigger>
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


// ── Main OutgoingTab ───────────────────────────────────────────────────────────
export default function OutgoingTab({ orders, updateOrder, pushOp, inventory, updateInventory, deliveryFiles, addDeliveryFile, subtab, setSubtab }) {
	const t       = useTranslations("warehouse.outgoing");
	const prepared = orders.filter(o => o.status === STATUS.PREPARED);
	const shipped  = orders.filter(o => o.status === STATUS.SHIPPED);
	const today    = new Date().toISOString().split("T")[0];
	const todayShipped = shipped.filter(o => o.shippedAt?.startsWith(today)).length;

	const stats = [
		{ id: "ready-to-ship",  name: t("stats.readyToShip"),  value: prepared.length,      icon: Package,      color: "#3b82f6", sortOrder: 0 },
		{ id: "shipped-today",  name: t("stats.shippedToday"), value: todayShipped,          icon: Truck,        color: "#10b981", sortOrder: 1 },
		{ id: "total-shipped",  name: t("stats.totalShipped"), value: shipped.length,        icon: CheckCircle2, color: "#a855f7", sortOrder: 2 },
		{ id: "delivery-files", name: t("stats.deliveryFiles"),value: deliveryFiles.length,  icon: FileText,     color: "#f59e0b", sortOrder: 3 },
	];

	return (
		<div className="space-y-4">
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumbs.home"),      href: "/" },
					{ name: t("breadcrumbs.warehouse"), href: "/warehouse" },
					{ name: t("breadcrumbs.outgoing") },
				]}
				buttons={<Button_ size="sm" label={t("header.howItWorks")} variant="ghost" onClick={() => { }} icon={<Info size={18} />} />}
				items={[
					{ id: "scan",  label: t("subtabs.scan"),  count: prepared.length,     icon: ScanLine },
					{ id: "files", label: t("subtabs.files"), count: deliveryFiles.length, icon: FileDown },
				]}
				active={subtab}
				setActive={setSubtab}
			/>

			<AnimatePresence mode="wait">
				<motion.div key={subtab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
					{subtab === "scan"  && <ScanOutgoingSubtab orders={orders} updateOrder={updateOrder} pushOp={pushOp} inventory={inventory} updateInventory={updateInventory} addDeliveryFile={addDeliveryFile} />}
					{subtab === "files" && <OutgoingFilesSubtab deliveryFiles={deliveryFiles} orders={orders} />}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}