"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
	Package,
	ChevronLeft,
	User,
	Mail,
	Phone,
	Calendar,
	MapPin,
	DollarSign,
	Link as LinkIcon,
	Clock,
	Image as ImageIcon,
	QrCode,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// ==================== DUMMY DATA ====================
const orderData = {
	id: "DTQ87465",
	trackingCode: "DTQ87465",
	orderType: "طلب جديد",
	orderDate: "17-6-2025",
	lastUpdate: "منذ يومين",
	status: "جديد",
	statusColor: "text-emerald-600 bg-emerald-50 border-emerald-200", // (legacy) not used after theming
	customer: {
		name: "يسرا علام#1234",
		email: "yosra@gmail.com",
		phone: "01002877665",
		phone2: "01002877665",
	},
	shipping: {
		emirate: "الشارقة",
		region: "128",
		address: "شارع عبدالعزيز آل سعود، ",
		link: "https://m5zoon.shop/",
	},
	financials: {
		profit: 128,
		total: 500,
	},
	notes: "اسم المتوقع المستخدم سيتأكد معه تقسيم الحُلي سببر",
	products: [
		{ id: 1, sku: "SRF56", name: "وعاء طعام", quantity: 15, unitCost: 20, total: 15000 },
		{ id: 2, sku: "SRF56", name: "وعاء طعام", quantity: 151, unitCost: 20, total: 15000 },
		{ id: 3, sku: "SRF56", name: "وعاء طعام", quantity: 15, unitCost: 20, total: 15000 },
		{ id: 4, sku: "SRF56", name: "وعاء طعام", quantity: 15, unitCost: 20, total: 15000 },
		{ id: 5, sku: "SRF56", name: "وعاء طعام", quantity: 15, unitCost: 20, total: 15000 },
	],
	statusHistory: [
		{ id: 1, status: "طلب جديد", date: "12/8/2025", note: "تحديث حالة الطلب إلى" },
		{ id: 2, status: "خارج نطاق التوصيل", date: "12/8/2025", note: "تحديث حالة الطلب إلى" },
		{ id: 3, status: "مؤجل إلى يوما ما", date: "12/8/2025", note: "تحديث حالة الطلب إلى" },
		{ id: 4, status: "تم التوصيل", date: "12/8/2025", note: "تحديث حالة الطلب إلى" },
	],
};

// ==================== INFO CARD COMPONENT ====================
function InfoCard({ icon: Icon, label, value, mono = false }) {
	return (
		<div className="flex items-start justify-between py-3   last:border-0">
			<div className="flex items-center gap-2 text-muted-foreground">
				<Icon size={16} />
				<span className="text-sm">{label}</span>
			</div>
			<div
				className={cn(
					"text-sm font-semibold text-foreground text-end",
					mono && "font-mono"
				)}
			>
				{value}
			</div>
		</div>
	);
}

// ==================== MAIN COMPONENT ====================
export default function OrderDetailsPage() {
	const t = useTranslations("orderDetails");

	const [copied, setCopied] = useState(false);

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handlePrint = () => {
		window.print();
	};

	// Theme-based status colors (uses your CSS vars)
	const statusColors = {
		"طلب جديد": "text-[var(--secondary)]",
		"خارج نطاق التوصيل": "text-[var(--third)]",
		"مؤجل إلى يوما ما": "text-[var(--primary)]",
		"تم التوصيل": "text-[var(--primary)]",
	};

	return (
		<div className="min-h-screen p-4 md:p-6 bg-background">
			{/* Header with Breadcrumb */}
			<div className="mb-6">
				<div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
					<span>{t("breadcrumb.home")}</span>
					<ChevronLeft size={16} className="rtl:rotate-180" />
					<span className="text-[var(--primary)] font-medium">
						{t("breadcrumb.current")}
					</span>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Main Content - Order Details */}
				<div className="lg:col-span-9">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-card !p-5 text-card-foreground rounded-3xl shadow-sm border border-border/60"
					>
						{/* Header Section */}
						<div className="p-2  ">
							<div className="rounded-2xl p-4 py-5  grid grid-cols-2 md:grid-cols-5 gap-4  bg-[var(--secondary)] border border-border/60  backdrop-blur-sm" >
								{/* ID */}
								<div className="flex flex-col gap-1" >
									<p className="text-xs text-muted-foreground mb-1.5">#ID</p>
									<p className="text-sm font-bold text-foreground font-mono">
										{orderData.id}
									</p>
								</div>

								{/* Tracking Code */}
								<div className="flex flex-col gap-1" >
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.trackingCode")}
									</p>
									<p className="text-sm font-bold text-foreground font-mono">
										{orderData.trackingCode}
									</p>
								</div>

								{/* Order Type */}
								<div className="flex flex-col gap-1" >
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.type")}
									</p>
									<Badge
										className="rounded-lg font-semibold
                               bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]
                               text-[var(--primary)]
                               border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
									>
										{orderData.orderType}
									</Badge>
								</div>

								{/* Order Date */}
								<div className="flex flex-col gap-1" >
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.orderDate")}
									</p>
									<div className="flex items-center gap-1.5 text-muted-foreground">
										<Calendar size={14} />
										<p className="text-sm font-bold text-foreground">
											{orderData.orderDate}
										</p>
									</div>
								</div>

								{/* Last Update */}
								<div className="flex flex-col gap-1" >
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.lastUpdate")}
									</p>
									<p className="text-sm font-bold text-foreground">
										{orderData.lastUpdate}
									</p>
								</div>
							</div>
						</div>

						{/* Order Info Grid */}
						<div className="p-2  ">
							<div className="rounded-2xl p-4 py-5  grid grid-cols-2 md:grid-cols-5 gap-4  bg-[var(--secondary)] border border-border/60  backdrop-blur-sm" >
								{/* Emirate */}
								<div className="flex flex-col gap-1">
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.emirate")}
									</p>
									<p className="text-sm font-bold text-foreground">
										{orderData.shipping.emirate}
									</p>
								</div>

								{/* Region */}
								<div className="flex flex-col gap-1">
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.region")}
									</p>
									<p className="text-sm font-bold text-foreground">
										{orderData.shipping.region}
									</p>
								</div>

								{/* Address */}
								<div className="flex flex-col gap-1">
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.address")}
									</p>
									<p className="text-sm font-bold text-foreground">
										{orderData.shipping.address}
									</p>
								</div>

								{/* Profit */}
								<div className="flex flex-col gap-1">
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.profit")}
									</p>
									<p className="text-sm font-bold text-foreground">
										{orderData.financials.profit}
									</p>
								</div>

								{/* Total */}
								<div className="flex flex-col gap-1">
									<p className="text-xs text-muted-foreground mb-1.5">
										{t("order.total")}
									</p>
									<p className="text-sm font-bold text-[var(--primary)]">
										{orderData.financials.total} $
									</p>
								</div>
							</div>
						</div>

						{/* Status & Link Row */}
						<div className="p-2  ">
							<div className="rounded-2xl p-4 py-5  grid grid-cols-2 md:grid-cols-5 gap-4  bg-[var(--secondary)] border border-border/60  backdrop-blur-sm" >
								{/* Status */}
								<div className="flex flex-col gap-1">
									<p className="text-xs text-muted-foreground mb-2">
										{t("order.status")}
									</p>
									<Badge
										className="rounded-lg px-4 py-2 text-sm font-bold
                           bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]
                           text-[var(--primary)]
                           border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
									>
										{orderData.status}
									</Badge>
								</div>

								{/* Link */}
								<div className="flex flex-col gap-1">
									<p className="text-xs text-muted-foreground mb-2">
										{t("order.link")}
									</p>
									<a
										href={orderData.shipping.link}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
									>
										<LinkIcon size={14} />
										{orderData.shipping.link}
									</a>
								</div>
								{/* Notes */}
								<div className="flex flex-col gap-1 col-span-2 ">
									<p className="text-xs text-muted-foreground mb-2">
										{t("order.notes")}
									</p>
									<p className="text-sm text-muted-foreground leading-relaxed">
										{orderData.notes}
									</p>
								</div>
							</div>
						</div>


						{/* Products Table */}
						<div className="p-6">
							<div className="flex items-center gap-2 mb-4">
								<div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
								<h3 className="text-base font-bold text-foreground">
									{t("products.title")}
								</h3>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className=" ">
											<th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
												{t("products.sku")}
											</th>
											<th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
												{t("products.name")}
											</th>
											<th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
												{t("products.quantity")}
											</th>
											<th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
												{t("products.unitCost")}
											</th>
											<th className="text-start py-3 px-2 text-xs font-semibold text-muted-foreground">
												{t("products.total")}
											</th>
										</tr>
									</thead>
									<tbody>
										{orderData.products.map((product, idx) => (
											<tr
												key={product.id}
												className={cn(
													"border-b border-border/40",
													idx % 2 === 0 && "bg-muted/30"
												)}
											>
												<td className="py-3 px-2">
													<div className="flex items-center gap-2">
														<div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/50 flex items-center justify-center">
															<QrCode size={14} className="text-muted-foreground" />
														</div>
														<span className="text-sm font-mono font-semibold text-foreground">
															{product.sku}
														</span>
													</div>
												</td>
												<td className="py-3 px-2">
													<span className="text-sm font-medium text-muted-foreground">
														{product.name}
													</span>
												</td>
												<td className="py-3 px-2">
													<span className="text-sm font-bold text-foreground">
														{product.quantity}
													</span>
												</td>
												<td className="py-3 px-2">
													<span className="text-sm font-mono text-muted-foreground">
														{product.unitCost} د.أ
													</span>
												</td>
												<td className="py-3 px-2">
													<span className="text-sm font-mono font-bold text-foreground">
														{product.total} د.أ
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</motion.div>
				</div>

				{/* Left Sidebar - Customer Info & Timeline */}
				<div className="lg:col-span-3 space-y-6">
					{/* Customer Info Card */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="bg-card !p-5 text-card-foreground rounded-3xl p-6 shadow-sm border border-border/60"
					>
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-base font-bold text-foreground">
								{t("customer.details")}
							</h3>
							<Badge className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 rounded-lg">
								{orderData.products.length} {t("customer.orders")}
							</Badge>
						</div>

						<div className="space-y-3">
							<InfoCard icon={User} label={t("customer.name")} value={orderData.customer.name} />
							<InfoCard icon={Mail} label={t("customer.email")} value={orderData.customer.email} />
							<InfoCard icon={Phone} label={t("customer.phone")} value={orderData.customer.phone} mono />
							<InfoCard icon={Phone} label={t("customer.phone2")} value={orderData.customer.phone2} mono />
						</div>
					</motion.div>

					{/* Order Timeline */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
						className="bg-card !p-5 text-card-foreground rounded-3xl p-6 shadow-sm border border-border/60"
					>
						<div className="flex items-center gap-2 mb-6">
							<div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
							<h3 className="text-base font-bold text-foreground">
								{t("timeline.title")}
							</h3>
						</div>

						<div className="space-y-4">
							{orderData.statusHistory.map((item, idx) => {
								const isFirst = idx === 0;

								return (
									<div key={item.id} className="relative">
										<div className="flex gap-3">
											{/* Timeline dot */}
											<div className="relative flex flex-col items-center">
												<div
													className={cn(
														"w-2 h-2 rounded-full z-10",
														isFirst
															? "bg-[var(--primary)] ring-4 ring-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
															: "bg-muted-foreground/30"
													)}
												/>
												{idx !== orderData.statusHistory.length - 1 && (
													<div className="w-px h-full bg-border/60 absolute top-2" />
												)}
											</div>

											{/* Content */}
											<div className="flex-1 pb-4">
												<p className="text-xs text-muted-foreground mb-1">
													{item.note}
												</p>
												<p
													className={cn(
														"text-sm font-bold mb-1",
														statusColors[item.status] || "text-foreground"
													)}
												>
													{item.status}
												</p>
												<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
													<Clock size={12} />
													<span>
														{t("timeline.updateDate")}: {item.date}
													</span>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
