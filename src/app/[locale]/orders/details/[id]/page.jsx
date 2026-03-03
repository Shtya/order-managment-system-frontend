"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
	ChevronLeft, Package, User, Phone, MapPin, Truck, DollarSign,
	Calendar, Clock, Store, FileText, History, Edit, CheckCircle,
	AlertCircle, QrCode, Hash, ArrowLeftRight, ExternalLink,
	ImageIcon, Building2, Landmark, Layers, CreditCard, Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { useParams } from "next/navigation";
import { avatarSrc } from "@/components/atoms/UserSelect";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";

/* ═══════════════════════════════════════════════════════════
	 ATOMS
═══════════════════════════════════════════════════════════ */

const StatusBadge = ({ status, t }) => {
	if (!status) return null;
	return (
		<span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold
      bg-[var(--primary)]/10 text-[var(--primary)]
      border border-[var(--primary)]/20 tracking-wide">
			{status?.system ? t(`statuses.${status.code}`) : status.name}
		</span>
	);
};

const InfoRow = ({ icon: Icon, label, value, valueClassName }) => (
	<div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0 gap-4">
		<div className="flex items-center gap-2 text-muted-foreground shrink-0">
			<Icon size={13} className="text-[var(--primary)]/60" />
			<span className="text-xs">{label}</span>
		</div>
		<div className={cn("text-xs font-semibold text-foreground text-end truncate", valueClassName)}>
			{value || "—"}
		</div>
	</div>
);

/* card with left accent bar */
const SectionCard = ({ title, icon: Icon, children, className, delay = 0 }) => (
	<motion.div
		initial={{ opacity: 0, y: 16 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ delay, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
		className={cn(
			"relative bg-card   overflow-hidden ",
			className
		)}
	>
		{/* left accent bar */}
		<span aria-hidden className="absolute inset-y-0 start-0 w-[3px]
      bg-gradient-to-b from-[var(--primary)] via-[var(--secondary)] to-[var(--third)]" />

		<div className=" ">
			{title && (
				<div className="flex items-center gap-2 mb-4">
					{Icon && <Icon size={14} className="text-[var(--primary)]" />}
					<h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
				</div>
			)}
			{children}
		</div>
	</motion.div>
);

/* meta pill used in the top banner row */
const MetaPill = ({ label, children }) => (
	<div className="flex flex-col gap-1.5 min-w-0">
		<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{label}</p>
		<div className="text-sm font-bold text-foreground">{children}</div>
	</div>
);

/* ═══════════════════════════════════════════════════════════
	 WRAPPER
═══════════════════════════════════════════════════════════ */
export default function OrderDetailsPageWrapper() {
	const params = useParams();
	const t = useTranslations("orders");
	const orderId = params?.id;
	const [order, setOrder] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (orderId) fetchOrderDetails();
	}, [orderId]);

	const fetchOrderDetails = async () => {
		try {
			setLoading(true);
			const response = await api.get(`/orders/${orderId}`);
			setOrder(response.data);
		} catch (error) {
			toast.error(t("messages.errorFetchingOrder"));
		} finally {
			setLoading(false);
		}
	};

	if (!orderId) return (
		<div className="min-h-screen flex items-center justify-center">
			<p className="text-muted-foreground text-sm">Invalid order ID</p>
		</div>
	);

	return <OrderDetailsPage order={order} loading={loading} />;
}

/* ═══════════════════════════════════════════════════════════
	 MAIN PAGE
═══════════════════════════════════════════════════════════ */
export function OrderDetailsPage({ order, loading }) {
	const t = useTranslations("orders");
	const router = useRouter();

	const formatDate = (date) => {
		if (!date) return "—";
		return new Date(date).toLocaleString("en-US", {
			year: "numeric", month: "short", day: "numeric",
			hour: "2-digit", minute: "2-digit",
		});
	};

	const formatCurrency = (amount) =>
		`${amount?.toLocaleString() || 0} ${t("currency")}`;

	if (loading) return <OrderDetailsPageSkeleton />;

	if (!order) return (
		<div className="flex items-center justify-center min-h-[60vh] bg-background">
			<div className="text-center space-y-3">
				<div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto">
					<AlertCircle size={24} className="text-[var(--primary)]" />
				</div>
				<p className="text-sm text-muted-foreground">{t("messages.orderNotFound")}</p>
				<button onClick={() => router.push("/orders")}
					className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold
            bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20
            hover:bg-[var(--primary)]/15 transition-colors">
					{t("actions.backToOrders")}
				</button>
			</div>
		</div>
	);

	return (
		<div className="p-5 bg-background min-h-screen">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.orders"), href: "/orders" },
					{ name: order.orderNumber }
				]}
				buttons={<Button_
					onClick={() => router.push(`/orders/edit/${order.id}`)}
					size="sm"
					tone="solid"
					icon={<Edit size={18} />}
					label={t("actions.edit")}
				/>
				}

			></PageHeader>


			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

				{/* ══════════════════════ MAIN — 9 cols ══════════════════════ */}
				<div className="lg:col-span-9 space-y-5">

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
						className="relative bg-card overflow-hidden "
					>

						<div className=" space-y-5">

							{/* Row 1: order meta */}
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-4
                p-4 rounded-xl bg-[var(--secondary)]/60 border border-border/40">
								<MetaPill label="#ID">
									<span className="font-mono text-[var(--primary)]">{order.orderNumber}</span>
								</MetaPill>
								<MetaPill label={t("fields.status")}>
									<StatusBadge status={order.status} t={t} />
								</MetaPill>
								<MetaPill label={t("fields.paymentMethod")}>
									<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                    bg-[var(--primary)]/8 text-[var(--primary)] border border-[var(--primary)]/15">
										<CreditCard size={11} />
										{t(`paymentMethods.${order.paymentMethod}`)}
									</span>
								</MetaPill>
								<MetaPill label={t("details.createdAt")}>
									<span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
										<Calendar size={11} className="text-[var(--primary)]/60 shrink-0" />
										{formatDate(order.created_at)}
									</span>
								</MetaPill>
								<MetaPill label={t("details.updatedAt")}>
									<span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
										<Clock size={11} className="text-[var(--primary)]/60 shrink-0" />
										{formatDate(order.updated_at)}
									</span>
								</MetaPill>
							</div>

							{/* Row 2: shipping / financial */}
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-4
                p-4 rounded-xl bg-[var(--secondary)]/60 border border-border/40">
								<MetaPill label={t("fields.city")}>
									<span className="flex items-center gap-1.5 text-sm">
										<Building2 size={12} className="text-[var(--primary)]/60 shrink-0" />
										{order.city || "—"}
									</span>
								</MetaPill>
								<MetaPill label={t("fields.address")}>
									<span className="text-xs font-semibold text-foreground line-clamp-2">{order.address || "—"}</span>
								</MetaPill>
								<MetaPill label={t("details.shippingCost")}>
									<span className="text-sm font-bold text-foreground">{formatCurrency(order.shippingCost)}</span>
								</MetaPill>
								<MetaPill label={t("details.discount")}>
									{order.discount > 0
										? <span className="text-sm font-bold text-destructive">-{formatCurrency(order.discount)}</span>
										: <span className="text-sm font-bold text-muted-foreground">—</span>
									}
								</MetaPill>
								<MetaPill label={t("details.total")}>
									<span className="text-sm font-bold text-[var(--primary)]">{formatCurrency(order.finalTotal)}</span>
								</MetaPill>
							</div>

							{/* Row 3: payment status / tracking / notes */}
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-4
                p-4 rounded-xl bg-[var(--secondary)]/60 border border-border/40">
								<MetaPill label={t("fields.paymentStatus")}>
									<span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold
                    bg-[var(--primary)]/8 text-[var(--primary)] border border-[var(--primary)]/15">
										{t(`paymentStatuses.${order.paymentStatus}`)}
									</span>
								</MetaPill>
								{order.trackingNumber && (
									<MetaPill label={t("fields.trackingNumber")}>
										<span className="font-mono text-xs text-foreground">{order.trackingNumber}</span>
									</MetaPill>
								)}
								{(order.notes || order.customerNotes) && (
									<div className="col-span-2 flex flex-col gap-1">
										<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
											{t("details.notes")}
										</p>
										{order.notes && <p className="text-xs text-muted-foreground leading-relaxed">{order.notes}</p>}
										{order.customerNotes && <p className="text-xs text-muted-foreground leading-relaxed">{order.customerNotes}</p>}
									</div>
								)}
							</div>

							{/* ── Items table ── */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
									<h3 className="text-sm font-bold text-foreground">{t("details.orderItems")}</h3>
								</div>

								<div className="rounded-xl border border-border/40 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full">
											<thead>
												<tr className="bg-[var(--secondary)]/80 border-b border-border/40">
													{[t("details.product"), t("details.variant"), t("details.quantity"), t("details.unitPrice"), t("details.lineTotal")]
														.map((h) => (
															<th key={h} className="text-start py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
																{h}
															</th>
														))}
												</tr>
											</thead>
											<tbody>
												{order.items?.map((item, idx) => (
													<tr key={item.id}
														className={cn(
															"border-b border-border/25 transition-colors hover:bg-[var(--primary)]/[0.03]",
															idx % 2 !== 0 && "bg-muted/20"
														)}>
														<td className="py-3 px-3">
															<div className="flex items-center gap-2.5">
																<div className="w-8 h-8 rounded-xl bg-[var(--primary)]/8 border border-[var(--primary)]/15
                                  flex items-center justify-center shrink-0">
																	<Package size={13} className="text-[var(--primary)]" />
																</div>
																<span className="text-xs font-semibold text-foreground">
																	{item.variant?.product?.name || t("details.unknownProduct")}
																</span>
															</div>
														</td>
														<td className="py-3 px-3">
															<span className="text-xs text-muted-foreground">{item.variant?.name || "—"}</span>
														</td>
														<td className="py-3 px-3">
															<span className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                                bg-[var(--primary)]/8 text-[var(--primary)] text-xs font-bold">
																{item.quantity}
															</span>
														</td>
														<td className="py-3 px-3">
															<span className="text-xs font-mono text-muted-foreground">{formatCurrency(item.unitPrice)}</span>
														</td>
														<td className="py-3 px-3">
															<span className="text-xs font-mono font-bold text-foreground">{formatCurrency(item.lineTotal)}</span>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								{/* Summary totals */}
								<div className="mt-4 space-y-1.5 ps-2">
									{[
										{ label: t("details.subtotal"), value: formatCurrency(order.productsTotal), highlight: false },
										{ label: t("details.shippingCost"), value: formatCurrency(order.shippingCost), highlight: false },
										order.discount > 0 && { label: t("details.discount"), value: `-${formatCurrency(order.discount)}`, highlight: false, red: true },
										order.deposit > 0 && { label: t("details.deposit"), value: formatCurrency(order.deposit), highlight: false },
									].filter(Boolean).map(({ label, value, red }) => (
										<div key={label} className="flex justify-between text-xs">
											<span className="text-muted-foreground">{label}</span>
											<span className={cn("font-semibold", red ? "text-destructive" : "text-foreground")}>{value}</span>
										</div>
									))}
									<div className="flex justify-between pt-2 mt-2 border-t border-border/40">
										<span className="text-sm font-bold text-foreground">{t("details.total")}</span>
										<span className="text-sm font-bold text-[var(--primary)]">{formatCurrency(order.finalTotal)}</span>
									</div>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Replacement card */}
					{order.replacementResult && (
						<ReplacementInfoCard
							replacement={order.replacementResult}
							replacementOrder={order}
							formatCurrency={formatCurrency}
							formatDate={formatDate}
							router={router}
						/>
					)}
				</div>

				{/* ══════════════════════ SIDEBAR — 3 cols ══════════════════════ */}
				<div className="lg:col-span-3 space-y-4">

					{/* Customer */}
					<SectionCard title={t("details.customerInfo")} icon={User} delay={0.05}>
						<div className="flex items-center justify-between mb-3">
							<div /> {/* spacer */}
							<span className="text-[10px] font-bold px-2 py-1 rounded-lg
                bg-[var(--primary)]/8 text-[var(--primary)] border border-[var(--primary)]/15">
								{order.items?.length || 0} {t("details.orderItems")}
							</span>
						</div>
						<InfoRow icon={User} label={t("fields.customerName")} value={order.customerName} />
						<InfoRow icon={Phone} label={t("fields.phoneNumber")} value={order.phoneNumber} />
						{order.email && <InfoRow icon={FileText} label={t("fields.email")} value={order.email} />}
						<InfoRow icon={Building2} label={t("fields.city")} value={order.city} />
						{order.area && <InfoRow icon={MapPin} label={t("fields.area")} value={order.area} />}
						{order.landmark && <InfoRow icon={Landmark} label={t("fields.landmark")} value={order.landmark} />}
					</SectionCard>

					{/* Shipping */}
					{order.shippingCompany && (
						<SectionCard title={t("details.shippingInfo")} icon={Truck} delay={0.08}>
							<InfoRow icon={Truck} label={t("fields.shippingCompany")} value={order.shippingCompany.name} />
							{order.trackingNumber && <InfoRow icon={FileText} label={t("fields.trackingNumber")} value={order.trackingNumber} />}
							{order.shippedAt && <InfoRow icon={Calendar} label={t("details.shippedAt")} value={formatDate(order.shippedAt)} />}
							{order.deliveredAt && <InfoRow icon={CheckCircle} label={t("details.deliveredAt")} value={formatDate(order.deliveredAt)} />}
						</SectionCard>
					)}

					{/* Store */}
					{order.store && (
						<SectionCard title={t("details.storeInfo")} icon={Store} delay={0.1}>
							<InfoRow icon={Store} label={t("fields.storeName")} value={order.store.name} />
							{order.store.address && <InfoRow icon={MapPin} label={t("fields.storeAddress")} value={order.store.address} />}
						</SectionCard>
					)}

					{/* Assigned employee */}
					{order.assignments?.some(a => a.isAssignmentActive) && (
						<SectionCard title={t("details.assignedEmployee")} icon={User} delay={0.12}>
							{order.assignments.filter(a => a.isAssignmentActive).map((assignment) => (
								<div key={assignment.id} className="space-y-3">
									<div className="flex items-center gap-3 p-3 rounded-xl
                    bg-[var(--secondary)]/60 border border-border/40">
										<Avatar className="w-9 h-9 shrink-0">
											<AvatarImage src={assignment.employee?.avatar} />
											<AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold">
												{assignment.employee?.name?.charAt(0) || "E"}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0">
											<p className="text-xs font-bold text-foreground truncate">
												{assignment.employee?.name || t("details.unknownEmployee")}
											</p>
											<p className="text-[10px] text-muted-foreground">
												{formatDate(assignment.assignedAt)}
											</p>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-2">
										{[
											{ label: t("details.retriesUsed"), val: assignment.retriesUsed },
											{ label: t("details.maxRetries"), val: assignment.maxRetriesAtAssignment },
										].map(({ label, val }) => (
											<div key={label} className="rounded-xl p-3 text-center
                        bg-[var(--secondary)]/60 border border-border/40">
												<p className="text-xl font-bold text-[var(--primary)]">{val}</p>
												<p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
											</div>
										))}
									</div>
								</div>
							))}
						</SectionCard>
					)}

					{/* Status history */}
					{order.statusHistory?.length > 0 && (
						<SectionCard title={t("details.statusHistory")} icon={History} delay={0.14}>
							<div className="space-y-0 max-h-[600px] overflow-y-auto pe-1
                scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
								{order.statusHistory
									.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
									.map((history, idx, arr) => {
										const isFirst = idx === 0;
										const isLast = idx === arr.length - 1;
										return (
											<div key={history.id} className="flex gap-3">
												{/* timeline spine */}
												<div className="relative flex flex-col items-center pt-0.5">
													<div className={cn(
														"w-2 h-2 rounded-full z-10 shrink-0",
														isFirst
															? "bg-[var(--primary)] ring-[3px] ring-[var(--primary)]/20"
															: "bg-border"
													)} />
													{!isLast && <div className="w-px flex-1 bg-border/50 mt-1 min-h-[32px]" />}
												</div>
												{/* content */}
												<div className="flex-1 pb-4 min-w-0">
													{history.notes && (
														<p className="text-[10px] text-muted-foreground mb-1 leading-snug">
															{history.notes}
														</p>
													)}
													<p className="text-xs font-bold text-[var(--primary)] mb-1 leading-snug">
														{history.fromStatus?.system
															? t(`statuses.${history.fromStatus.code}`)
															: history.fromStatus?.name}
														{" → "}
														{history.toStatus?.system
															? t(`statuses.${history.toStatus.code}`)
															: history.toStatus?.name}
													</p>
													<div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
														<Clock size={10} />
														{formatDate(history.created_at)}
													</div>
												</div>
											</div>
										);
									})}
							</div>
						</SectionCard>
					)}
				</div>
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════
	 REPLACEMENT CARD
═══════════════════════════════════════════════════════════ */
function ReplacementInfoCard({ replacementOrder, replacement, formatCurrency, formatDate, router }) {
	const tR = useTranslations("CreateReplacement");
	const t = useTranslations("orders");

	const originalOrder = replacement?.originalOrder;
	const bridgeItems = replacement?.items ?? [];
	const returnImages = replacement?.returnImages ?? [];

	const oldTotal = originalOrder?.finalTotal ?? originalOrder?.total ?? 0;
	const newTotal = replacementOrder?.finalTotal ?? replacementOrder?.total ?? 0;
	const totalDiff = newTotal - oldTotal;

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
			className="relative bg-card rounded-2xl border border-[var(--primary)]/25 overflow-hidden
        shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.3)]"
		>
			{/* top bar */}
			<div aria-hidden className="absolute inset-x-0 top-0 h-[3px]
        bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--third)]" />

			{/* header */}
			<div className="flex items-center justify-between gap-3 px-5 py-4 mt-[3px]
        bg-[var(--primary)]/[0.05] border-b border-[var(--primary)]/15">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20
            flex items-center justify-center shrink-0">
						<ArrowLeftRight size={14} className="text-[var(--primary)]" />
					</div>
					<div>
						<p className="text-sm font-bold text-[var(--primary)]">{t("replacement.cardTitle")}</p>
						<p className="text-[11px] text-muted-foreground">{t("replacement.cardSubtitle")}</p>
					</div>
				</div>
				{replacement.reason && (
					<span className="text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0
            bg-[var(--primary)]/8 text-[var(--primary)] border border-[var(--primary)]/20 tracking-wide">
						{tR(`reasons.${replacement.reason}`)}
					</span>
				)}
			</div>

			<div className="p-5 space-y-5">

				{/* original order row */}
				{originalOrder && (
					<div className="rounded-xl bg-[var(--secondary)]/60 border border-border/40 p-4">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">
							{t("replacement.originalOrder")}
						</p>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{[
								{
									icon: Hash, label: t("replacement.orderNumber"),
									content: (
										<button type="button" onClick={() => router.push(`/orders/${originalOrder.id}`)}
											className="text-xs font-bold text-[var(--primary)] font-mono hover:underline flex items-center gap-1">
											{originalOrder.orderNumber} <ExternalLink size={9} />
										</button>
									),
								},
								{ icon: User, label: t("replacement.customer"), content: <span className="text-xs font-semibold text-foreground">{originalOrder.customerName || "—"}</span> },
								{ icon: DollarSign, label: t("replacement.originalTotal"), content: <span className="text-xs font-semibold text-foreground">{formatCurrency(oldTotal)}</span> },
								{ icon: Calendar, label: t("replacement.originalDate"), content: <span className="text-xs font-semibold text-foreground">{formatDate(originalOrder.created_at)}</span> },
							].map(({ icon: Icon, label, content }) => (
								<div key={label} className="flex items-start gap-2">
									<Icon size={11} className="text-[var(--primary)]/60 mt-0.5 shrink-0" />
									<div>
										<p className="text-[10px] text-muted-foreground">{label}</p>
										<div className="mt-0.5">{content}</div>
									</div>
								</div>
							))}
						</div>

						{/* diff row */}
						<div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-2 items-center">
							{[
								{ label: t("replacement.oldTotal"), value: formatCurrency(oldTotal), className: "" },
							].map(({ label, value }) => (
								<div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/50">
									<span className="text-[10px] text-muted-foreground">{label}</span>
									<span className="text-xs font-bold text-foreground">{value}</span>
								</div>
							))}
							<span className="text-muted-foreground/40 text-xs">→</span>
							<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/50">
								<span className="text-[10px] text-muted-foreground">{t("replacement.newTotal")}</span>
								<span className="text-xs font-bold text-[var(--primary)]">{formatCurrency(newTotal)}</span>
							</div>
							{totalDiff !== 0 && (
								<div className={cn(
									"flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
									totalDiff > 0
										? "bg-destructive/5 border-destructive/20"
										: "bg-[var(--primary)]/5 border-[var(--primary)]/20"
								)}>
									<span className="text-[10px] text-muted-foreground">{t("replacement.priceDiff")}</span>
									<span className={cn("text-xs font-bold", totalDiff > 0 ? "text-destructive" : "text-[var(--primary)]")}>
										{totalDiff > 0 ? "+" : ""}{formatCurrency(totalDiff)}
									</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* items table */}
				{bridgeItems.length > 0 && (
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">
							{t("replacement.replacedItems")} ({bridgeItems.length})
						</p>
						<div className="rounded-xl border border-border/40 overflow-hidden">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="bg-[var(--secondary)]/80 border-b border-border/30">
											{[t("replacement.table.originalProduct"), t("replacement.table.newProduct"),
											t("replacement.table.qty"), t("replacement.table.oldPrice"),
											t("replacement.table.newPrice"), t("replacement.table.diff")]
												.map((h) => (
													<th key={h} className="text-end px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">
														{h}
													</th>
												))}
										</tr>
									</thead>
									<tbody>
										{bridgeItems.map((item, idx) => {
											const origItem = item.originalOrderItem;
											const origProduct = origItem?.variant?.product;
											const matchedNewOrderItem = replacementOrder?.items?.find(
												(roi) => roi.variantId === item.newVariantId
											);
											const oldPrice = origItem?.unitPrice ?? 0;
											const newPrice = matchedNewOrderItem?.unitPrice ?? 0;
											const lineDiff = newPrice - oldPrice;
											const newVariant = matchedNewOrderItem?.variant;
											const newProduct = newVariant?.product;

											return (
												<tr key={item.id ?? idx}
													className={cn(
														"border-b border-border/20 last:border-0 transition-colors hover:bg-[var(--primary)]/[0.02]",
														idx % 2 !== 0 && "bg-muted/15"
													)}>
													<td className="px-3 py-3">
														<div className="flex items-center gap-2">
															{origProduct?.mainImage
																? <img src={avatarSrc(origProduct.mainImage)} alt="" className="w-7 h-7 rounded-lg object-cover border border-border/40 shrink-0" />
																: <div className="w-7 h-7 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center shrink-0"><Package size={11} className="text-muted-foreground" /></div>
															}
															<div className="min-w-0">
																<p className="text-[11px] font-semibold text-foreground line-clamp-1">{origProduct?.name || "—"}</p>
																{origItem?.variant?.sku && <p className="text-[10px] text-muted-foreground font-mono">{origItem.variant.sku}</p>}
															</div>
														</div>
													</td>
													<td className="px-3 py-3">
														<div className="flex items-center gap-2">
															{newProduct?.mainImage
																? <img src={avatarSrc(newProduct.mainImage)} alt="" className="w-7 h-7 rounded-lg object-cover border border-[var(--primary)]/25 shrink-0" />
																: <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/8 border border-[var(--primary)]/20 flex items-center justify-center shrink-0"><Package size={11} className="text-[var(--primary)]" /></div>
															}
															<div className="min-w-0">
																<p className="text-[11px] font-semibold text-foreground line-clamp-1">{newProduct?.name || "—"}</p>
																{newVariant?.sku && <p className="text-[10px] text-muted-foreground font-mono">{newVariant.sku}</p>}
															</div>
														</div>
													</td>
													<td className="px-3 py-3 text-end">
														<span className="inline-flex items-center justify-center w-6 h-6 rounded-lg
                              bg-[var(--primary)]/8 text-[var(--primary)] text-[10px] font-bold">
															×{item.quantityToReplace}
														</span>
													</td>
													<td className="px-3 py-3 text-end">
														<span className="text-[11px] text-muted-foreground font-mono">{formatCurrency(oldPrice)}</span>
													</td>
													<td className="px-3 py-3 text-end">
														<span className="text-[11px] font-semibold text-foreground font-mono">{formatCurrency(newPrice)}</span>
													</td>
													<td className="px-3 py-3 text-end">
														<span className={cn(
															"text-[11px] font-bold font-mono",
															lineDiff > 0 ? "text-destructive" : lineDiff < 0 ? "text-[var(--primary)]" : "text-muted-foreground"
														)}>
															{lineDiff > 0 ? "+" : ""}{formatCurrency(lineDiff)}
														</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{/* return images */}
				{returnImages.length > 0 && (
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-1.5">
							<ImageIcon size={10} />
							{t("replacement.returnImages")} ({returnImages.length})
						</p>
						<div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
							{returnImages.map((url, i) => (
								<a key={i} href={avatarSrc(url)} target="_blank" rel="noopener noreferrer"
									className="aspect-square rounded-xl overflow-hidden border border-border/40
                    hover:border-[var(--primary)]/40 transition-colors group">
									<img src={avatarSrc(url)} alt={`return-${i + 1}`}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}

/* ═══════════════════════════════════════════════════════════
	 SKELETON
═══════════════════════════════════════════════════════════ */
function Bone({ className }) {
	return <div className={cn("rounded-lg bg-muted/50 animate-pulse", className)} />;
}

function BannerSkeleton() {
	return (
		<div className="p-4 rounded-xl bg-[var(--secondary)]/60 border border-border/40
      grid grid-cols-2 md:grid-cols-5 gap-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="flex flex-col gap-2">
					<Bone className="h-2.5 w-14" />
					<Bone className="h-4 w-20" />
				</div>
			))}
		</div>
	);
}

function InfoRowSkeleton() {
	return (
		<div className="flex items-center justify-between py-2.5 border-b border-border/20">
			<div className="flex items-center gap-2">
				<Bone className="w-3 h-3 rounded-full" />
				<Bone className="h-3 w-16" />
			</div>
			<Bone className="h-3 w-20" />
		</div>
	);
}

function SideCardSkeleton({ children }) {
	return (
		<div className="relative bg-card rounded-2xl border border-border/50 overflow-hidden
      shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
			<span className="absolute inset-y-0 start-0 w-[3px] bg-muted/40" />
			<div className="px-5 pt-4 pb-5 ms-[3px]">{children}</div>
		</div>
	);
}

export function OrderDetailsPageSkeleton() {
	return (
		<div className="p-5 bg-background min-h-screen">
			<div className="bg-card">

				<BannerSkeleton />
			</div>
			<div className="grid mt-3 grid-cols-1 lg:grid-cols-12 gap-5">
				{/* main */}
				<div className="lg:col-span-9">
					<div className="relative bg-card rounded-2xl border border-border/50 overflow-hidden p-5 space-y-4">
						<div className="h-[3px] rounded-full bg-muted/40 animate-pulse -mx-5 -mt-5 mb-5" />
						<BannerSkeleton />
						<BannerSkeleton />
						<BannerSkeleton />
						{/* table */}
						<div className="rounded-xl border border-border/30 overflow-hidden">
							<div className="bg-[var(--secondary)]/60 px-3 py-2.5 flex gap-6">
								{["w-12", "w-16", "w-10", "w-14", "w-14"].map((w, i) => <Bone key={i} className={`h-2.5 ${w}`} />)}
							</div>
							{[0, 1, 2, 3].map(i => (
								<div key={i} className={cn("flex items-center gap-3 px-3 py-3 border-t border-border/20", i % 2 !== 0 && "bg-muted/15")}>
									<Bone className="w-8 h-8 rounded-xl shrink-0" />
									<Bone className="h-3 w-24" />
									<div className="flex-1" />
									<Bone className="h-3 w-10" />
									<Bone className="h-3 w-12" />
									<Bone className="h-3 w-14" />
								</div>
							))}
						</div>
					</div>
				</div>

				{/* sidebar */}
				<div className="lg:col-span-3 space-y-4">
					<SideCardSkeleton>
						<div className="flex justify-between mb-4">
							<Bone className="h-4 w-24" />
							<Bone className="h-5 w-14 rounded-lg" />
						</div>
						{[0, 1, 2, 3].map(i => <InfoRowSkeleton key={i} />)}
					</SideCardSkeleton>
					<SideCardSkeleton>
						<div className="flex items-center gap-2 mb-4">
							<Bone className="w-1.5 h-1.5 rounded-full" />
							<Bone className="h-4 w-24" />
						</div>
						{[0, 1, 2, 3].map(i => (
							<div key={i} className="flex gap-3 pb-4">
								<div className="flex flex-col items-center">
									<Bone className="w-2 h-2 rounded-full" />
									{i < 3 && <div className="w-px flex-1 bg-border/30 mt-1 min-h-[32px]" />}
								</div>
								<div className="flex-1 space-y-1.5">
									<Bone className="h-2.5 w-24" />
									<Bone className="h-3.5 w-32" />
									<Bone className="h-2.5 w-16" />
								</div>
							</div>
						))}
					</SideCardSkeleton>
				</div>
			</div>
		</div>
	);
}