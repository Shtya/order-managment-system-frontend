
/* 
	
*/

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Search,
	X,
	Plus,
	Trash2,
	Loader2,
	Package,
	Phone,
	MapPin,
	Calendar,
	User,
	ArrowLeftRight,
	Upload,
	ImageIcon,
	AlertTriangle,
	CheckCircle2,
	Minus,
	Hash,
	Truck,
	CreditCard,
	FileText,
	BarChart3,
	AlertCircle,
	StickyNote,
	Lock,
	ChevronDown,
	Check,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { ImageUploadBox } from "@/app/[locale]/products/new/page";
import Button_ from "@/components/atoms/Button";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { BreadcrumbBar } from "@/components/atoms/Breadcrumb";
import { FcCancel } from "react-icons/fc";
import Img from "@/components/atoms/Img";


const baseImg = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

let _imgIdCounter = 0;
function makeId() {
	return `img_${Date.now()}_${++_imgIdCounter}`;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function hexToBg(hex, alpha = 0.1) {
	const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return r
		? `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`
		: "transparent";
}

function formatCurrency(n) {
	return `${(Number(n) || 0).toLocaleString("ar-EG")} ج.م`;
}

function formatDate(d) {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("ar-EG", {
		year: "numeric", month: "short", day: "numeric",
	});
}

// ─────────────────────────────────────────────
// Section wrapper — matches app theme
// ─────────────────────────────────────────────
function Section({ title, icon: Icon, children, className, delay = 0 }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay }}
			className={cn(
				"bg-card rounded-2xl border border-border/60 shadow-sm",
				className
			)}
		>
			<div className="flex items-center gap-3  pb-6  border-b border-border/40">
				<div className="w-12 h-12 rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)] flex items-center justify-center shrink-0">
					<Icon size={25} className="text-[var(--primary)]" />
				</div>
				<h3 className="text-sm font-bold text-foreground">{title}</h3>
			</div>
			<div className=" pt-6 ">{children}</div>
		</motion.div>
	);
}

// ─────────────────────────────────────────────
// Field label + input style
// ─────────────────────────────────────────────
function FieldInput({ label, error, children }) {
	return (
		<div className="space-y-1.5">
			{label && <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>}
			{children}
			{error && <p className="text-xs text-red-500">{error}</p>}
		</div>
	);
}

function StyledInput({ className, ...props }) {
	return (
		<Input
			{...props}
		/>
	);
}

function StyledSelect({ value, onValueChange, placeholder, children, disabled }) {
	return (
		<Select value={value} onValueChange={onValueChange} disabled={disabled}>
			<SelectTrigger >
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>{children}</SelectContent>
		</Select>
	);
}

// ─────────────────────────────────────────────
// STEP 1 — Order search + selection
// ─────────────────────────────────────────────
function OrderSearchSection({ errors, selectedOrder, onSelect, isEditMode = false }) {
	const t = useTranslations("CreateReplacement");
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [searching, setSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [focused, setFocused] = useState(false);
	const debounceRef = useRef(null);
	const wrapperRef = useRef(null);

	useEffect(() => {
		if (isEditMode && selectedOrder?.orderNumber) {
			setQuery(selectedOrder.orderNumber);
		}
	}, [isEditMode, selectedOrder?.orderNumber]);

	useEffect(() => {
		clearTimeout(debounceRef.current);
		if (query.trim().length < 2) { setResults([]); setShowResults(false); return; }
		debounceRef.current = setTimeout(async () => {
			try {
				setSearching(true);
				const res = await api.get("/orders", { params: { search: query.trim(), hasReplacement: false, limit: 8, page: 1 } });
				setResults(res.data?.records ?? []);
				setShowResults(true);
			} catch { setResults([]); }
			finally { setSearching(false); }
		}, 350);
	}, [query]);

	useEffect(() => {
		const handler = (e) => { if (!wrapperRef.current?.contains(e.target)) { setShowResults(false); setFocused(false); } };
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleSelect = (order) => {
		onSelect(order);
		setQuery(order.orderNumber);
		setShowResults(false);
	};


	return (
		<Section title={t("sections.searchOrder")} icon={Search} delay={0} className="relative z-20">
			<div ref={wrapperRef} className="relative">

				{/* Search Field */}
				<div className="relative group">
					{/* Glow ring on focus */}
					<div
						style={{
							position: "absolute",
							inset: -1,
							borderRadius: 16,
							background: focused
								? "linear-gradient(135deg, var(--primary), var(--third))"
								: "transparent",
							opacity: focused ? 0.35 : 0,
							transition: "opacity 0.25s ease",
							pointerEvents: "none",
							zIndex: 0,
						}}
					/>

					<div
						style={{
							position: "relative",
							display: "flex",
							alignItems: "center",
							gap: 12,
							background: "var(--card)",
							border: "1.5px solid",
							borderColor: focused ? "var(--primary)" : "var(--border)",
							borderRadius: 14,
							padding: "0 16px",
							height: 52,
							transition: "border-color 0.2s ease, box-shadow 0.2s ease",
							boxShadow: focused
								? "0 0 0 4px color-mix(in oklab, var(--primary) 12%, transparent), 0 4px 20px color-mix(in oklab, var(--primary) 8%, transparent)"
								: "0 1px 4px color-mix(in oklab, var(--foreground) 4%, transparent)",
							zIndex: 1,
						}}
					>
						{/* Left icon — hash or search */}
						<div style={{
							display: "flex",
							alignItems: "center",
							color: focused ? "var(--primary)" : "var(--muted-foreground)",
							transition: "color 0.2s ease",
							flexShrink: 0,
						}}>
							<Hash size={18} />
						</div>

						<input
							value={query}
							onChange={(e) => {
								if (isEditMode) return;
								setQuery(e.target.value);
								if (selectedOrder) onSelect(null);
							}}
							onFocus={() => { setFocused(true); if (!isEditMode && results.length) setShowResults(true); }}
							placeholder={t("placeholders.orderNumber")}
							readOnly={isEditMode}
							style={{
								flex: 1,
								background: "transparent",
								border: "none",
								outline: "none",
								fontSize: 14,
								fontWeight: 500,
								color: "var(--foreground)",
								letterSpacing: "0.03em",
							}}
						/>

					</div>
				</div>


				<AnimatePresence>
					{showResults && results.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: -8, scale: 0.98 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -8, scale: 0.98 }}
							transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
							style={{
								position: "absolute",
								top: "calc(100% + 6px)",
								left: 0,
								right: 0,
								zIndex: 50,
								background: "var(--popover)",
								border: "1.5px solid var(--border)",
								borderRadius: 16,
								boxShadow: "0 16px 48px color-mix(in oklab, var(--foreground) 12%, transparent), 0 4px 12px color-mix(in oklab, var(--foreground) 6%, transparent)",
								overflow: "hidden",
							}}
						>
							{/* Dropdown header */}
							<div style={{
								padding: "10px 16px 8px",
								borderBottom: "1px solid var(--border)",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}>
								<span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted-foreground)", textTransform: "uppercase" }}>
									{results.length} {t("labels.ordersFound") ?? "results found"}
								</span>
								<div style={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									background: "var(--primary)",
									boxShadow: "0 0 8px var(--primary)",
									animation: "pulse 1.5s ease infinite",
								}} />
							</div>

							{results.map((order, i) => (
								<motion.button
									key={order.id}
									type="button"
									onClick={() => handleSelect(order)}
									initial={{ opacity: 0, x: 8 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: i * 0.04 }}
									style={{
										width: "100%",
										textAlign: "right",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: 12,
										padding: "12px 16px",
										background: selectedOrder?.id === order.id
											? "color-mix(in oklab, var(--primary) 8%, transparent)"
											: "transparent",
										borderBottom: i < results.length - 1 ? "1px solid color-mix(in oklab, var(--border) 50%, transparent)" : "none",
										cursor: "pointer",
										transition: "background 0.15s ease",
										border: "none",
									}}
									onMouseEnter={e => { if (selectedOrder?.id !== order.id) e.currentTarget.style.background = "var(--accent)"; }}
									onMouseLeave={e => { e.currentTarget.style.background = selectedOrder?.id === order.id ? "color-mix(in oklab, var(--primary) 8%, transparent)" : "transparent"; }}
								>
									{/* Order icon + info */}
									<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
										<div style={{
											width: 36,
											height: 36,
											borderRadius: 10,
											background: selectedOrder?.id === order.id
												? "color-mix(in oklab, var(--primary) 20%, transparent)"
												: "color-mix(in oklab, var(--primary) 10%, transparent)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexShrink: 0,
											border: "1px solid color-mix(in oklab, var(--primary) 20%, transparent)",
										}}>
											<Package size={16} style={{ color: "var(--primary)" }} />
										</div>
										<div style={{ textAlign: "right" }}>
											<p style={{
												fontSize: 13,
												fontWeight: 700,
												color: "var(--primary)",
												fontFamily: "monospace",
												letterSpacing: "0.04em",
												marginBottom: 2,
											}}>{order.orderNumber}</p>
											<p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{order.customerName}</p>
										</div>
									</div>

									{/* Price + date */}
									<div style={{ textAlign: "right", flexShrink: 0 }}>
										<p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 2 }}>
											{formatCurrency(order.finalTotal ?? order.total)}
										</p>
										<p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
											{formatDate(order.created_at)}
										</p>
									</div>
								</motion.button>
							))}
						</motion.div>
					)}

					{/* No results */}
					{showResults && !searching && results.length === 0 && query.length >= 2 && (
						<motion.div
							initial={{ opacity: 0, scale: 0.97 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.97 }}
							style={{
								position: "absolute",
								top: "calc(100% + 6px)",
								left: 0,
								right: 0,
								zIndex: 50,
								background: "var(--popover)",
								border: "1.5px solid var(--border)",
								borderRadius: 16,
								boxShadow: "0 16px 48px color-mix(in oklab, var(--foreground) 10%, transparent)",
								padding: "32px 24px",
								textAlign: "center",
							}}
						>
							<div style={{
								width: 44,
								height: 44,
								borderRadius: 12,
								background: "var(--muted)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto 12px",
								border: "1px solid var(--border)",
							}}>
								<Search size={18} style={{ color: "var(--muted-foreground)" }} />
							</div>
							<p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
								{t("noOrdersFound")}
							</p>
							<p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
								{t("noOrdersFoundHint") ?? "Try a different order number"}
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Selected order card */}
			<AnimatePresence>
				{selectedOrder && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 8 }}
						transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
						style={{ marginTop: 16 }}
					>
						{/* Divider with label */}
						<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
							<div style={{ flex: 1, height: 1, background: "var(--border)" }} />
							<span style={{
								fontSize: 10,
								fontWeight: 700,
								letterSpacing: "0.1em",
								color: "var(--muted-foreground)",
								textTransform: "uppercase",
							}}>
								{t("labels.selectedOrder") ?? "Selected Order"}
							</span>
							<div style={{ flex: 1, height: 1, background: "var(--border)" }} />
						</div>
						<SelectedOrderDetails order={selectedOrder} />
					</motion.div>
				)}
			</AnimatePresence>

			{/* Error */}
			{errors.order && (
				<motion.p
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						fontSize: 12,
						color: "var(--destructive)",
						marginTop: 8,
						padding: "6px 10px",
						borderRadius: 8,
						background: "color-mix(in oklab, var(--destructive) 8%, transparent)",
						border: "1px solid color-mix(in oklab, var(--destructive) 20%, transparent)",
					}}
				>
					<AlertCircle size={12} />
					{errors.order}
				</motion.p>
			)}
		</Section>
	);
}

// ─────────────────────────────────────────────
// Selected order details panel
// ─────────────────────────────────────────────
function SelectedOrderDetails({ order }) {
	const tOrder = useTranslations("orders");
	const t = useTranslations("CreateReplacement");
	const status = order.status;

	const pills = [
		{ icon: User, label: t("details.customerName"), value: order.customerName },
		{ icon: Phone, label: t("details.phone"), value: order.phoneNumber },
		{ icon: MapPin, label: t("details.address"), value: `${order.city}، ${order.address}` },
		{ icon: BarChart3, label: t("details.total"), value: formatCurrency(order.finalTotal ?? order.total) },
		{ icon: Calendar, label: t("details.createdAt"), value: formatDate(order.created_at) },
	];

	return (
		<div className="space-y-4">

			{/* ── Info pills ─────────────────────────────────────────── */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
				{pills.map(({ icon: Icon, label, value }) => (
					<div
						key={label}
						className="group flex items-start gap-2.5 rounded-2xl bg-card !py-3 !px-4 border border-border/50 hover:border-primary/30 hover:bg-[color-mix(in_oklab,var(--primary)_4%,var(--secondary))] transition-all duration-200"
					>
						<div className="w-10 h-10 rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] transition-colors duration-200">
							<Icon size={25} className="text-primary" />
						</div>
						<div className="min-w-0">
							<p className="text-[12px] font-medium text-muted-foreground mb-0.5">{label}</p>
							<p title={value || "-"} className="text-sm font-bold text-foreground truncate leading-tight">{value || "—"}</p>
						</div>
					</div>
				))}

				{/* Status pill */}
				{status && (
					<div className="group flex items-start gap-2.5 rounded-2xl bg-card !py-3 !px-4 border border-border/50 hover:border-primary/30 hover:bg-[color-mix(in_oklab,var(--primary)_4%,var(--secondary))] transition-all duration-200"
					>
						<div
							className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
							style={{ background: `${status.color}18` }}
						>
							<CheckCircle2 size={25} style={{ color: status.color }} />
						</div>
						<div className="min-w-0">
							<p className="text-[12px] font-medium text-muted-foreground mb-1">{t("details.status")}</p>
							<Badge
								className="rounded-lg px-3 py-0.5 text-sm font-bold border"
								style={{
									backgroundColor: `${status.color}18`,
									color: status.color,
									borderColor: `${status.color}33`,
								}}
							>
								{status.system ? tOrder(`statuses.${status.code}`) : (status.name || status.code)}
							</Badge>
						</div>
					</div>
				)}
			</div>

			{/* ── Items table ─────────────────────────────────────────── */}
			<div className="rounded-2xl border border-border/50 overflow-hidden">


				<div className=" !p-0 overflow-x-auto">
					<table className="w-full">
						<thead className={cn("  bg-gray-100 dark:bg-slate-800 dark:from-slate-800/90 dark:via-slate-850/80 dark:to-slate-900/70  backdrop-blur-md border-b-2 border-gray-200 dark:border-slate-700")}>
							<tr className="border-b border-border/30  ">
								{[
									t("details.table.image"),
									t("details.table.product"),
									t("details.table.qty"),
									t("details.table.unitPrice"),
									t("details.table.total"),
								].map((h) => (
									<th key={h} className=" ltr:text-left rtl:text-right px-4 !py-4 text-[14px] font-bold text-muted-foreground tracking-wide uppercase">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{order.items?.map((item, i) => {
								const variant = item.variant;
								const product = variant?.product;
								const img = product?.mainImage;
								const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);

								return (
									<motion.tr
										key={i}
										initial={{ opacity: 0, x: 6 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: i * 0.04 }}
										className="border-b border-border/20 last:border-0 hover:bg-[color-mix(in_oklab,var(--primary)_3%,transparent)] transition-colors duration-150 group"
									>

										<td className="px-4 py-3">
											{img ? (
												<Img
													src={img}
													alt={product?.name}
													className="!w-12 h-12 rounded-xl object-cover border border-border/40 shadow-sm group-hover:border-primary/30 transition-colors duration-150"
												/>
											) : (
												<div className="w-10 h-10 rounded-xl bg-secondary border border-border/40 flex items-center justify-center group-hover:border-primary/30 transition-colors duration-150">
													<Package size={14} className="text-muted-foreground" />
												</div>
											)}
										</td>

										{/* Product name + SKU */}
										<td className=" flex items-center gap-2 px-4 py-3">
											<p className="text-sm font-semibold text-foreground leading-snug">
												{product?.name || "—"}
											</p>
											{variant?.sku && (
												<span className="inline-flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-mono bg-muted border border-border/50 rounded-md px-1.5 py-0.5">
													<Hash size={9} />
													{variant.sku}
												</span>
											)}
										</td>

										{/* Qty */}
										<td className="px-4 py-3 text-right">
											<span className="inline-flex items-center justify-center w-8 h-6 rounded-lg bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-primary text-[11px] font-bold border border-[color-mix(in_oklab,var(--primary)_20%,transparent)]">
												×{item.quantity}
											</span>
										</td>

										<td className="px-4 py-3 text-right">
											<span className="text-sm font-bold font-ar text-muted-foreground font-mono">
												{formatCurrency(item.unitPrice)}
											</span>
										</td>

										{/* Line total */}
										<td className="px-4 py-3 text-right">
											<span className=" text-sm font-ar font-bold text-primary font-mono">
												{formatCurrency(lineTotal)}
											</span>
										</td>
									</motion.tr>
								);
							})}
						</tbody>


					</table>
				</div>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// STEP 2 — Reason + shipping inputs
// ─────────────────────────────────────────────
const REASONS = [
	{ value: "wrong_size", label: "مقاس خاطئ" },
	{ value: "damaged", label: "منتج تالف" },
	{ value: "wrong_item", label: "منتج خاطئ" },
	{ value: "color_issue", label: "لون مختلف" },
	{ value: "quality", label: "جودة سيئة" },
	{ value: "other", label: "سبب آخر" },
];

const PAYMENT_METHODS = [
	{ value: "cod", label: "الدفع عند الاستلام" },
	{ value: "cash", label: "كاش" },
	{ value: "card", label: "بطاقة ائتمانية" },
	{ value: "bank_transfer", label: "تحويل بنكي" },
];

export const getReasons = (t) => [
	{ value: "wrong_size", label: t("reasons.wrong_size") },
	{ value: "damaged", label: t("reasons.damaged") },
	{ value: "wrong_item", label: t("reasons.wrong_item") },
	{ value: "color_issue", label: t("reasons.color_issue") },
	{ value: "quality", label: t("reasons.quality") },
	{ value: "not_as_described", label: t("reasons.not_as_described") },
	{ value: "missing_parts", label: t("reasons.missing_parts") },
	{ value: "change_of_mind", label: t("reasons.change_of_mind") },
	{ value: "late_delivery", label: t("reasons.late_delivery") },
	{ value: "faulty", label: t("reasons.faulty") },
	{ value: "other", label: t("reasons.other") },
];

function ReplacementInfoSection({ form, setForm, shippingCompanies, errors }) {
	const t = useTranslations("CreateReplacement");

	return (
		<Section title={t("sections.replacementInfo")} icon={FileText} delay={0.05}>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">



				{/* reasonOfReplacement */}
				<FieldInput label={t("fields.reasonOfReplacement")} error={errors.reasonOfReplacement}>
					<StyledInput
						value={form.reasonOfReplacement}
						onChange={(e) => setForm((p) => ({ ...p, reasonOfReplacement: e.target.value }))}
						placeholder={t("placeholders.reasonOfReplacement")}
						className={cn(
							"rounded-[14px] border-[1.5px] bg-card transition-all duration-200",
							"focus:border-primary focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_10%,transparent)]",
							errors.reasonOfReplacement ? "border-destructive" : "border-border"
						)}
					/>
				</FieldInput>

				{/* Another reason */}
				<FieldInput label={t("fields.anotherReason")} error={errors.anotherReason}>
					<StyledInput
						value={form.anotherReason}
						onChange={(e) => setForm((p) => ({ ...p, anotherReason: e.target.value }))}
						placeholder={t("placeholders.anotherReason")}
						className={cn(
							"rounded-[14px] border-[1.5px] bg-card transition-all duration-200",
							"focus:border-primary focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_10%,transparent)]",
							errors.anotherReason ? "border-destructive" : "border-border"
						)}
					/>
				</FieldInput>

				{/* Shipping company */}
				<FieldInput label={t("fields.shippingCompany")}>
					<StyledSelect
						value={form.shippingCompanyId}
						onValueChange={(v) => setForm((p) => ({ ...p, shippingCompanyId: v }))}
						placeholder={t("placeholders.shippingCompany")}
						className="rounded-[14px] border-[1.5px] border-border bg-card transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
					>
						<SelectItem value="none">{t("noShipping")}</SelectItem>
						{shippingCompanies.map((s) => (
							<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
						))}
					</StyledSelect>
				</FieldInput>
			</div>
		</Section>
	);
}


// ─────────────────────────────────────────────
// COLOR PHILOSOPHY:
//   Light: white/gray-50 surfaces, gray-200 borders, gray-500 text
//   Dark:  gray-900/800 surfaces, gray-700 borders, gray-400 text
//   Primary: ONLY for focus ring on inputs & active checkbox — nowhere else
//   No bg-primary, no text-primary, no border-primary in UI chrome
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Multi-Select Dropdown
// ─────────────────────────────────────────────
function ItemMultiSelect({ orderItems, replacementItems, onAdd, onRemove, t }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		const handler = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const selectedCount = replacementItems.length;

	return (
		<div ref={ref} className="relative">
			{/* ── Trigger ── */}
			<button
				type="button"
				onClick={() => setOpen((p) => !p)}
				className={cn(
					"w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-200 text-left",
					"bg-white dark:bg-gray-900",
					open
						? "border-primary  ring-2 ring-primary/20 shadow-sm"
						: "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
				)}
			>
				<div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
					{selectedCount === 0 ? (
						<span className="text-xs text-gray-400 dark:text-gray-500 py-0.5">
							{t("selectItems") || "Select items to replace…"}
						</span>
					) : (
						replacementItems.map((ri) => {
							const name = ri._originalItem?.variant?.product?.name || "—";
							return (
								<span
									key={ri._originalItemId}
									className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg text-[11px] font-semibold leading-none
										bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
										border border-gray-200 dark:border-gray-700"
								>
									<span className="max-w-[100px] truncate">{name}</span>
									<span
										role="button"
										tabIndex={0}
										onClick={(e) => {
											e.stopPropagation();
											onRemove({ id: ri._originalItemId });
										}}
										onKeyDown={(e) => e.key === "Enter" && onRemove({ id: ri._originalItemId })}
										className="w-3.5 h-3.5 rounded flex items-center justify-center
											hover:bg-gray-200 dark:hover:bg-gray-700
											transition-colors cursor-pointer shrink-0 text-gray-400 dark:text-gray-500"
									>
										<X size={8} strokeWidth={2.5} />
									</span>
								</span>
							);
						})
					)}
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{selectedCount > 0 && (
						<span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center
							bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
							{selectedCount}
						</span>
					)}
					<ChevronDown
						size={14}
						className={cn(
							"transition-transform duration-200 text-gray-400 dark:text-gray-500",
							open && "rotate-180"
						)}
					/>
				</div>
			</button>

			{/* ── Dropdown Panel ── */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -6, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -4, scale: 0.98 }}
						transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
						className="absolute z-50 mt-1.5 w-full rounded-xl overflow-hidden
							border border-gray-200 dark:border-gray-700
							bg-white dark:bg-gray-900
							shadow-xl shadow-gray-200/60 dark:shadow-black/30"
					>
						{/* Header */}
						<div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
							<p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
								{orderItems.length} {t("availableItems") || "items"}
							</p>
							{selectedCount > 0 && (
								<button
									type="button"
									onClick={() => replacementItems.forEach((ri) => onRemove({ id: ri._originalItemId }))}
									className="text-[10px] font-semibold text-gray-400 dark:text-gray-500
										hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
								>
									<X size={9} />
									{t("clearAll") || "Clear all"}
								</button>
							)}
						</div>

						{/* Items */}
						<div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
							{orderItems.map((item) => {
								const isSelected = replacementItems.some((ri) => ri._originalItemId === item.id);
								const name = item.variant?.product?.name || "—";
								const img = item.variant?.product?.mainImage;

								return (
									<button
										key={item.id}
										type="button"
										onClick={() => (isSelected ? onRemove(item) : onAdd(item))}
										className={cn(
											"w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-100",
											isSelected
												? "bg-gray-50 dark:bg-gray-800/70"
												: "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
										)}
									>
										{/* Checkbox */}
										<div className={cn(
											"w-6 h-6 rounded border-[1.5px] flex items-center justify-center transition-all shrink-0",
											isSelected
												? "bg-primary/80 border-primary"
												: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
										)}>
											{isSelected && (
												<Check size={15} className="text-white dark:text-gray-900" strokeWidth={3} />
											)}
										</div>

										{/* Thumbnail */}
										{img ? (
											<img
												src={avatarSrc(img)}
												alt={name}
												className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shrink-0"
											/>
										) : (
											<div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
												<Package size={11} className="text-gray-400 dark:text-gray-500" />
											</div>
										)}

										{/* Name + SKU */}
										<div className="flex-1 min-w-0">
											<p className={cn(
												"text-xs font-semibold truncate",
												isSelected
													? "text-gray-800 dark:text-gray-200"
													: "text-gray-600 dark:text-gray-400"
											)}>
												{name}
											</p>
											{item.variant?.sku && (
												<p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono mt-0.5 truncate">
													{item.variant.sku}
												</p>
											)}
										</div>

										{/* Qty badge */}
										<span className={cn(
											"text-[11px] font-semibold px-2 py-0.5 rounded-lg border shrink-0 tabular-nums",
											isSelected
												? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
												: "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700"
										)}>
											×{item.quantity}
										</span>
									</button>
								);
							})}
						</div>

						{/* Footer */}
						<div className="px-3.5 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
							<p className="text-[10px] text-gray-400 dark:text-gray-500">
								{selectedCount === 0
									? t("clickToSelect") || "Click items to select"
									: `${selectedCount} of ${orderItems.length} selected`}
							</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}


function ReplacementItemCard({ originalItem, cardIndex, onUpdate, onRemove, t }) {
	const [newSku, setNewSku] = useState(null);
	const [quantity, setQuantity] = useState(originalItem.quantity || 1);
	const [newPrice, setNewPrice] = useState(0);

	const oldPrice = Number(originalItem.unitPrice || 0);
	const diff = (Number(newPrice) || 0) - oldPrice;

	useEffect(() => {
		onUpdate(cardIndex, {
			originalOrderItemId: originalItem.id,
			quantityToReplace: quantity,
			newVariantId: newSku?.id ?? null,
			newUnitPrice: Number(newPrice) || 0,
			oldUnitPrice: oldPrice,
		});
	}, [newSku, quantity, newPrice]);

	const product = originalItem.variant?.product;
	const variant = originalItem.variant;
	const img = product?.mainImage;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -6, scale: 0.98 }}
			transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
			className="rounded-2xl overflow-hidden
				border border-gray-200 dark:border-gray-700
				bg-white dark:bg-gray-900
				shadow-sm shadow-gray-100 dark:shadow-none"
		>
			{/* ── Header ── */}
			<div className="flex items-center justify-between px-4 py-3
				bg-gray-50 dark:bg-gray-800/60
				border-b border-gray-100 dark:border-gray-800">
				<div className="flex items-center gap-2.5">
					<div className="w-7 h-7 rounded-lg
						bg-gray-100 dark:bg-gray-800
						border border-gray-200 dark:border-gray-700
						flex items-center justify-center shrink-0">
						<ArrowLeftRight size={13} className="text-gray-500 dark:text-gray-400" />
					</div>
					<div>
						<p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">
							{t("itemCard.title")} #{cardIndex + 1}
						</p>
						<p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
							{product?.name || "—"}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={() => onRemove(cardIndex)}
					className="w-7 h-7 rounded-lg
						border border-gray-200 dark:border-gray-700
						bg-white dark:bg-gray-900
						text-gray-400 dark:text-gray-500
						hover:border-red-300 dark:hover:border-red-700
						hover:text-red-500 dark:hover:text-red-400
						hover:bg-red-50 dark:hover:bg-red-950/30
						flex items-center justify-center transition-all duration-150"
				>
					<Trash2 size={12} />
				</button>
			</div>

			{/* ── Body ── */}
			<div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
				{/* Original item */}
				<div className="space-y-2">
					<p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
						{t("itemCard.originalItem")}
					</p>
					<div className="flex items-start gap-3 px-3 py-3 rounded-xl
						border border-gray-100 dark:border-gray-800
						bg-gray-50 dark:bg-gray-800/50">
						{img ? (
							<img src={avatarSrc(img)} alt={product?.name}
								className="w-11 h-11 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
						) : (
							<div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
								<Package size={14} className="text-gray-400 dark:text-gray-500" />
							</div>
						)}
						<div className="min-w-0 flex-1 space-y-0.5">
							<p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{product?.name || "—"}</p>
							{variant?.sku && (
								<p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{variant.sku}</p>
							)}
							<p className="text-[10px] text-gray-400 dark:text-gray-500">
								{t("itemCard.oldPrice")}:{" "}
								<span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(oldPrice)}</span>
							</p>
						</div>
					</div>
				</div>

				{/* New item */}
				<div className="space-y-2">
					<p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
						{t("itemCard.newItem")}
					</p>
					{newSku ? (
						<div className="flex items-start gap-3 px-3 py-3 rounded-xl
							border border-gray-200 dark:border-gray-700
							bg-gray-50 dark:bg-gray-800/50">
							<div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
								<Package size={14} className="text-gray-500 dark:text-gray-400" />
							</div>
							<div className="min-w-0 flex-1 space-y-0.5">
								<p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{newSku.label || newSku.productName}</p>
								<p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{newSku.sku}</p>
							</div>
							<button
								type="button"
								onClick={() => { setNewSku(null); setNewPrice(0); }}
								className="w-6 h-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500
									hover:border-red-300 dark:hover:border-red-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30
									flex items-center justify-center transition-all shrink-0"
							>
								<X size={10} />
							</button>
						</div>
					) : (
						<div className="rounded-xl border border-dashed
							border-gray-200 dark:border-gray-700
							hover:border-gray-300 dark:hover:border-gray-600
							bg-gray-50/50 dark:bg-gray-800/30
							hover:bg-gray-50 dark:hover:bg-gray-800/50
							transition-colors p-3">
							<ProductSkuSearchPopover
								closeOnSelect
								handleSelectSku={(sku) => { setNewSku(sku); setNewPrice(sku.price || 0); }}
								selectedSkus={newSku ? [newSku] : []}
							/>
						</div>
					)}
				</div>
			</div>

			{/* ── Bottom: qty + pricing ── */}
			<div className="px-4 pb-4 grid grid-cols-2 xl:grid-cols-4 gap-3">
				{/* Quantity */}
				<FieldInput label={t("itemCard.quantity")}>
					<div className="relative flex items-center">
						<button
							type="button"
							onClick={() => setQuantity((q) => Math.max(1, q - 1))}
							className="absolute start-1 z-10 w-7 h-7 rounded-lg
			flex items-center justify-center transition-all duration-150
			text-gray-400 dark:text-gray-500
			hover:text-gray-700 dark:hover:text-gray-200
			hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<Minus size={11} />
						</button>

						<Input
							type="number"
							min="1"
							value={quantity}
							onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
							classN="!text-center font-bold !px-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
						/>

						<button
							type="button"
							onClick={() => setQuantity((q) => q + 1)}
							className="absolute end-1 z-10 w-7 h-7 rounded-lg
			flex items-center justify-center transition-all duration-150
			text-gray-400 dark:text-gray-500
			hover:text-gray-700 dark:hover:text-gray-200
			hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<Plus size={11} />
						</button>
					</div>
				</FieldInput>

				{/* Old price */}
				<FieldInput label={t("itemCard.oldPrice")}>
					<StyledInput
						value={formatCurrency(oldPrice)}
						readOnly
						className="bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed text-center font-mono"
					/>
				</FieldInput>

				{/* New price */}
				<FieldInput label={t("itemCard.newPrice")}>
					<StyledInput
						type="number" min="0"
						value={newPrice}
						onChange={(e) => setNewPrice(e.target.value)}
						className="font-mono"
					/>
				</FieldInput>

				{/* Price diff */}
				<FieldInput label={t("itemCard.priceDiff")}>
					<div className={cn(
						"h-[45px] px-3 rounded-xl border flex items-center justify-center gap-1.5 text-sm font-bold font-mono",
						diff > 0
							? "border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400"
							: diff < 0
								? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
								: "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
					)}>
						{diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
						{diff > 0 ? "+" : ""}{formatCurrency(diff)}
					</div>
				</FieldInput>
			</div>
		</motion.div>
	);
}

function ReplacementItemsSection({ errors, selectedOrder, replacementItems, setReplacementItems }) {
	const t = useTranslations("CreateReplacement");
	const orderItems = selectedOrder?.items ?? [];

	const addItem = (orderItem) => {
		if (replacementItems.some((ri) => ri._originalItemId === orderItem.id)) {
			toast.error(t("errors.itemAlreadyAdded"));
			return;
		}
		setReplacementItems((prev) => [
			...prev,
			{ _originalItemId: orderItem.id, _originalItem: orderItem, data: null },
		]);
	};

	const removeItem = (item) => {
		setReplacementItems((prev) =>
			prev.filter((ri) => ri._originalItemId !== (item.id ?? item._originalItemId))
		);
	};

	const updateItem = (idx, data) => {
		setReplacementItems((prev) => {
			const next = [...prev];
			next[idx] = { ...next[idx], data };
			return next;
		});
	};

	return (
		<Section title={t("sections.replacementItems")} icon={ArrowLeftRight} delay={0.1}>
			{!selectedOrder ? (
				<div className="flex items-center gap-3 p-4 rounded-xl
					bg-gray-50 dark:bg-gray-800/50
					border border-dashed border-gray-200 dark:border-gray-700">
					<AlertTriangle size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
					<p className="text-sm text-gray-500 dark:text-gray-400">{t("selectOrderFirst")}</p>
				</div>
			) : (
				<div className="space-y-4">
					{/* ── Dropdown ── */}
					{orderItems.length > 0 && (
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
									{t("chooseItemsToReplace")}
								</label>
								{replacementItems.length > 0 && (
									<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
										bg-gray-100 dark:bg-gray-800
										text-gray-500 dark:text-gray-400
										border border-gray-200 dark:border-gray-700">
										{replacementItems.length}/{orderItems.length} {t("selected") || "selected"}
									</span>
								)}
							</div>
							<ItemMultiSelect
								orderItems={orderItems}
								replacementItems={replacementItems}
								onAdd={addItem}
								onRemove={removeItem}
								t={t}
							/>
						</div>
					)}

					{/* ── Divider ── */}
					{replacementItems.length > 0 && (
						<div className="flex items-center gap-3 py-1">
							<div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
							<span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
								<ArrowLeftRight size={9} />
								{t("replacementDetails") || "Replacement Details"}
							</span>
							<div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
						</div>
					)}

					{/* ── Cards ── */}
					<div className="space-y-3">
						<AnimatePresence>
							{replacementItems.map((ri, idx) => (
								<ReplacementItemCard
									key={`${ri._originalItemId}-${idx}`}
									originalItem={ri._originalItem}
									cardIndex={idx}
									onUpdate={updateItem}
									onRemove={(i) => removeItem({ id: replacementItems[i]._originalItemId })}
									t={t}
								/>
							))}
						</AnimatePresence>
					</div>

					{/* ── Empty state ── */}
					{replacementItems.length === 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl
								bg-gray-50 dark:bg-gray-800/30
								border border-dashed border-gray-200 dark:border-gray-700"
						>
							<div className="w-10 h-10 rounded-xl
								bg-white dark:bg-gray-800
								border border-gray-200 dark:border-gray-700
								flex items-center justify-center
								shadow-sm shadow-gray-100 dark:shadow-none">
								<ArrowLeftRight size={16} className="text-gray-400 dark:text-gray-500" />
							</div>
							<div className="text-center">
								<p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t("noItemsAdded")}</p>
								<p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
									{t("selectFromDropdownAbove") || "Select items from the dropdown above to begin"}
								</p>
							</div>
						</motion.div>
					)}
				</div>
			)}

			{errors.items && (
				<p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 px-1">
					<AlertTriangle size={10} />
					{errors.items}
				</p>
			)}
		</Section>
	);
}

// ─────────────────────────────────────────────
// Price summary card
// ─────────────────────────────────────────────
function PriceSummaryCard({ replacementItems, form, selectedOrder }) {
	const t = useTranslations("CreateReplacement");
	const summary = useMemo(() => {
		const oldTotal = replacementItems.reduce((sum, ri) => {
			const d = ri.data;
			if (!d) return sum;
			return sum + (d.oldUnitPrice || 0) * (d.quantityToReplace || 0);
		}, 0);
		const newTotal = replacementItems.reduce((sum, ri) => {
			const d = ri.data;
			if (!d) return sum;
			return sum + (d.newUnitPrice || 0) * (d.quantityToReplace || 0);
		}, 0);
		const shipping = Number(form.shippingCost) || 0;
		const discount = Number(form.discount) || 0;
		const diff = newTotal - oldTotal;
		const finalNew = newTotal + shipping - discount;

		return { oldTotal, newTotal, shipping, discount, diff, finalNew, itemCount: replacementItems.length };
	}, [replacementItems, form]);

	const rows = [
		{ label: t("summary.items"), value: summary.itemCount, color: "text-foreground" },
		{ label: t("summary.oldTotal"), value: formatCurrency(summary.oldTotal), color: "text-muted-foreground" },
		{ label: t("summary.newTotal"), value: formatCurrency(summary.newTotal), color: "text-foreground font-bold" },
		{ label: t("summary.shipping"), value: formatCurrency(summary.shipping), color: "text-muted-foreground" },
		{ label: t("summary.discount"), value: `- ${formatCurrency(summary.discount)}`, color: "text-red-500" },
		{ label: t("summary.priceDiff"), value: `${summary.diff >= 0 ? "+" : ""}${formatCurrency(summary.diff)}`, color: summary.diff > 0 ? "text-red-500 font-bold" : summary.diff < 0 ? "text-emerald-600 font-bold" : "text-muted-foreground" },
	];

	return (
		<div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden h-fit">
			<div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
				<div className="w-13 h-13 rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)] flex items-center justify-center">
					<BarChart3 size={25} className="text-[var(--primary)]" />
				</div>
				<p className="text-sm font-bold text-foreground">{t("sections.priceSummary")}</p>
			</div>

			<div className="p-4 space-y-2">
				{rows.map(({ label, value, color }) => (
					<div key={label} className="flex items-center justify-between py-1.5 border-b border-border/25 last:border-0">
						<span className="text-xs text-muted-foreground">{label}</span>
						<span className={cn("text-xs", color)}>{value}</span>
					</div>
				))}

				{/* Final total highlight */}
				<div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)]">
					<span className="text-xs font-bold text-foreground">{t("summary.finalTotal")}</span>
					<span className="text-base font-bold text-[var(--primary)]">{formatCurrency(summary.finalNew)}</span>
				</div>
			</div>
		</div>
	);
}


export default function CreateReplacementPage({ isEditMode = false, replacementId = null, existingData = null }) {
	const t = useTranslations("CreateReplacement");
	const router = useRouter();

	// ── State ──
	const [selectedOrder, setSelectedOrder] = useState( );
	const [replacementItems, setReplacementItems] = useState([]);
	// imageFiles: ImageFile[] — local File objects + existing URL entries
	const [imageFiles, setImageFiles] = useState([]);
	// removedImages: string[] — URLs of existing images deleted by user (edit mode)
	const [removedImages, setRemovedImages] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const [initialLoading, setInitialLoading] = useState(isEditMode && !existingData);
	const [shippingCompanies, setShippingCompanies] = useState([]);
	const [errors, setErrors] = useState({});

	const [form, setForm] = useState({
		reason: "",
		anotherReason: "",
		shippingCompanyId: "",
		paymentMethod: "cod",
		shippingCost: 0,
		discount: 0,
		internalNotes: "",
		customerNotes: "",
	});

	// ── Lookups ──
	useEffect(() => {
		api.get("/shipping-companies", { params: { limit: 200, isActive: true } })
			.then((r) => setShippingCompanies(Array.isArray(r.data?.records) ? r.data.records : Array.isArray(r.data) ? r.data : []))
			.catch(() => { });
	}, []);

	// ── Load existing data in edit mode ──
	useEffect(() => {
		if (!isEditMode) return;

		const load = async () => {
			try {
				setInitialLoading(true);
				const data = existingData ?? (await api.get(`/order-replacements/${replacementId}`)).data;
				// const data = existingData ?? (await api.get(`/order-replacements/${replacementId}`)).data;

				setForm({
					reason: data.reason ?? "",
					anotherReason: data.anotherReason ?? "",
					shippingCompanyId: data.shippingCompanyId ? String(data.shippingCompanyId) : "",
					paymentMethod: data.replacementOrder?.paymentMethod ?? "cod",
					shippingCost: data.replacementOrder?.shippingCost ?? 0,
					discount: data.replacementOrder?.discount ?? 0,
					internalNotes: data.internalNotes ?? "",
					customerNotes: data.replacementOrder?.customerNotes ?? "",
				});

				if (data.originalOrder) setSelectedOrder(data.originalOrder);

				// Seed existing return images as { isExisting: true, url }
				if (Array.isArray(data.returnImages) && data.returnImages.length > 0) {
					setImageFiles(
						data.returnImages.map((url) => ({
							id: makeId(),
							isExisting: true,
							isFromLibrary: false,
							url,
							file: undefined,
							previewUrl: undefined,
						}))
					);
				}

				// Seed replacement items from existing record
				if (Array.isArray(data.items) && data.originalOrder?.items) {
					setReplacementItems(
						data.items.map((ri) => ({
							_originalItemId: ri.originalOrderItemId,
							_originalItem: data.originalOrder.items.find((oi) => oi.id === ri.originalOrderItemId) ?? { id: ri.originalOrderItemId },
							data: {
								originalOrderItemId: ri.originalOrderItemId,
								quantityToReplace: ri.quantityToReplace,
								newVariantId: ri.newVariantId,
								newUnitPrice: ri.newUnitPrice,
								oldUnitPrice: ri.oldUnitPrice,
							},
						}))
					);
				}
			} catch {
				toast.error(t("errors.loadFailed"));
			} finally {
				setInitialLoading(false);
			}
		};

		load();
	}, [isEditMode, replacementId]); // eslint-disable-line

	const handleImageRemove = (target) => {
		if (target?.isExisting && target?.url) {
			setRemovedImages((prev) => [...prev, target.url]);
		}
	};


	// ── Validate ──
	const validate = () => {
		const e = {};
		if (!selectedOrder) e.order = t("validation.orderRequired");
		if (!form.reason) e.reason = t("validation.reasonRequired");
		// if (!form.anotherReason) e.anotherReason = t("validation.anotherReasonRequired");
		if (!form.paymentMethod) e.paymentMethod = t("validation.paymentMethodRequired");
		if (replacementItems.length === 0) e.items = t("validation.itemsRequired");
		// else {
		//     const invalid = replacementItems.some((ri) => !ri.data?.newVariantId);
		//     if (invalid) e.items = t("validation.newVariantRequired");
		// }
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	// ── Submit ──
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) { toast.error(t("validation.fixErrors")); return; }

		setSubmitting(true);
		try {
			const fd = new FormData();

			// ── Scalar fields ──
			fd.append("originalOrderId", selectedOrder.id);
			fd.append("reason", form.reason);
			fd.append("anotherReason", form.anotherReason);
			fd.append("paymentMethod", form.paymentMethod);
			if (form.shippingCompanyId && form.shippingCompanyId !== "none") {
				fd.append("shippingCompanyId", Number(form.shippingCompanyId));
			}
			fd.append("shippingCost", Number(form.shippingCost) || 0);
			fd.append("discount", Number(form.discount) || 0);
			if (form.internalNotes) fd.append("internalNotes", form.internalNotes);
			if (form.customerNotes) fd.append("customerNotes", form.customerNotes);

			// ── Items array → JSON string ──
			fd.append(
				"items",
				JSON.stringify(
					replacementItems.map((ri) => ({
						originalOrderItemId: ri.data.originalOrderItemId,
						quantityToReplace: ri.data.quantityToReplace,
						newVariantId: ri.data.newVariantId,
						newUnitPrice: ri.data.newUnitPrice,
					}))
				)
			);

			// ── Existing / library URLs → imagesMeta JSON string ──
			const existingUrls = imageFiles
				.filter((f) => f.isExisting && f.url && !removedImages.includes(f.url))
				.map((f) => ({ url: String(f.url) }));

			const libraryUrls = imageFiles
				.filter((f) => f.isFromLibrary && !f.isExisting && f.url)
				.map((f) => ({ url: String(f.url) }));

			if (isEditMode) {
				fd.append("images", JSON.stringify([...existingUrls, ...libraryUrls]));
			} else {
				if (libraryUrls.length) {
					fd.append("images", JSON.stringify(libraryUrls));
				}
			}

			// ── New local File objects — appended directly, no pre-upload ──
			(imageFiles ?? []).forEach((f) => {
				if (!f) return;
				if (f.isFromLibrary || f.isExisting) return;
				if (f.file) fd.append("images", f.file);
			});

			if (isEditMode && replacementId) {
				await api.patch(`/order-replacements/${replacementId}`, fd, {
					headers: { "Content-Type": "multipart/form-data" },
				});
				toast.success(t("messages.updateSuccess"));
			} else {
				await api.post("/order-replacements/replace", fd, {
					headers: { "Content-Type": "multipart/form-data" },
				});
				toast.success(t("messages.createSuccess"));
			}
			router.push("/orders");
		} catch (err) {
			const msg = err?.response?.data?.message;
			toast.error(Array.isArray(msg) ? msg.join(", ") : msg || (isEditMode ? t("messages.updateFailed") : t("messages.createFailed")));
		} finally {
			setSubmitting(false);
		}
	};
	// ── Loading skeleton for edit mode ──
	if (initialLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center space-y-3">
					<div className="w-12 h-12 rounded-2xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] flex items-center justify-center mx-auto">
						<Loader2 size={22} className="text-[var(--primary)] animate-spin" />
					</div>
					<p className="text-sm text-muted-foreground">{t("messages.loading")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-4 md:p-6 bg-background">
			<form onSubmit={handleSubmit}>

				<BreadcrumbBar
					breadcrumbs={[
						{ name: t("breadcrumb.home"), href: "/" },
						{ name: t(`breadcrumb.orders`), href: "/orders?tab=replacement" },
						{ name: isEditMode ? t("titleEdit") : t("title") },
					]}
					buttons={
						<>
							<Button_
								onClick={() => router.back()}
								size="sm"
								label={t("actions.cancel")}
								variant="ghost"
							/>

							<Button_
								size="sm"
								label={submitting ? t("actions.saving") : (isEditMode ? t("actions.update") : t("actions.submit"))}
								disabled={submitting}
								variant="solid"
							/>
						</>
					}
				/>


				{/* ── SECTION 1: Order Search ── */}
				<div className="mb-4">
					<OrderSearchSection
						selectedOrder={selectedOrder}
						onSelect={(order) => { setSelectedOrder(order); if (!isEditMode) setReplacementItems([]); }}
						isEditMode={isEditMode}
						errors={errors}
					/>

				</div>

				{/* ── SECTION 2: Replacement info ── */}
				<div className="mb-4">
					<ReplacementInfoSection
						form={form}
						setForm={setForm}
						shippingCompanies={shippingCompanies}
						errors={errors}
					/>
				</div>

				{/* ── SECTION 3: Items + sidebar ── */}
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
					<div>
						<ReplacementItemsSection
							selectedOrder={selectedOrder}
							replacementItems={replacementItems}
							setReplacementItems={setReplacementItems}
							errors={errors}
						/>

					</div>

					<div className="space-y-4">

						<ImageUploadBox
							title={t("sections.images")}
							files={imageFiles}
							onFilesChange={setImageFiles}
							onRemove={handleImageRemove}
						/>
						<PriceSummaryCard
							replacementItems={replacementItems}
							form={form}
							selectedOrder={selectedOrder}
						/>
					</div>
				</div>

			</form>
		</div>
	);
}

