"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Filter,
	CheckCircle,
	XCircle,
	Clock,
	MoreVertical,
	Check,
	X,
	Pause,
	Edit,
	Eye,
	FileText,
	ScrollText,
	Loader2,
	Package,
	TrendingUp,
	DollarSign,
	Plus,
	Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import InfoCard from "@/components/atoms/InfoCard";
import DataTable from "@/components/atoms/DataTable";

import { ChevronDown } from "lucide-react";



import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Button_ from "@/components/atoms/Button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import api from "@/utils/api";
import toast from "react-hot-toast";
import Flatpickr from "react-flatpickr";

import { baseImg } from "@/utils/axios";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import { Bone } from "@/components/atoms/BannerSkeleton";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";

const isImagePath = (p) => !!p && /\.(png|jpg|jpeg|webp|gif)$/i.test(p);
const isPdfPath = (p) => !!p && /\.pdf$/i.test(p);

// Loading Spinner Component
function LoadingSpinner({ size = "default", text }) {
	const sizeClasses = {
		small: "w-8 h-8",
		default: "w-12 h-12",
		large: "w-16 h-16",
	};

	return (
		<div className="flex flex-col items-center justify-center py-12">
			<div className="relative">
				<div className={cn(sizeClasses[size], "border-4 border-primary/20 rounded-full")}></div>
				<div className={cn(sizeClasses[size], "border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0")}></div>
			</div>
			{text && (
				<p className="text-sm text-gray-600 dark:text-slate-400 mt-3 animate-pulse font-medium">
					{text}
				</p>
			)}
		</div>
	);
}

function PurchasesTableToolbar({ t, searchValue, onSearchChange, onToggleFilters, isFiltersOpen }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="relative w-[300px] focus-within:w-[350px] transition-all duration-300">
				<Input
					value={searchValue}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={t("toolbar.searchPlaceholder")}
					className="rtl:pr-10 h-[40px] ltr:pl-10 rounded-full bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
				/>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					className={cn(
						"bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-100 flex items-center gap-2 px-4 rounded-full transition-all",
						isFiltersOpen && "border-primary/50 bg-primary/5"
					)}
					onClick={onToggleFilters}
				>
					<Filter size={18} />
					{t("toolbar.filter")}
				</Button>
			</div>
		</div>
	);
}

function FiltersPanel({ t, value, onChange, onApply, suppliers }) {
	return (
		<motion.div
			initial={{ height: 0, opacity: 0, y: -6 }}
			animate={{ height: "auto", opacity: 1, y: 0 }}
			exit={{ height: 0, opacity: 0, y: -6 }}
			transition={{ duration: 0.25 }}
		>
			<div className="main-card !p-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
					<div className="space-y-2">
						<Label>{t("filters.supplier")}</Label>
						<Select value={value.supplierId} onValueChange={(v) => onChange({ ...value, supplierId: v })}>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.supplierPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="none">{t("filters.all")}</SelectItem>
								{suppliers.map((s) => (
									<SelectItem key={s.id} value={String(s.id)}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.status")}</Label>
						<Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.statusPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								<SelectItem value="accepted">{t("status.accepted")}</SelectItem>
								<SelectItem value="pending">{t("status.pending")}</SelectItem>
								<SelectItem value="rejected">{t("status.rejected")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.dateRange")}</Label>
						<Flatpickr
							value={[
								value.startDate ? new Date(value.startDate) : null,
								value.endDate ? new Date(value.endDate) : null,
							]}
							onChange={([start, end]) => {
								onChange({
									...value,
									startDate: start ? start.toISOString().split("T")[0] : null,
									endDate: end ? end.toISOString().split("T")[0] : null,
								});
							}}
							options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
							data-size="default"
							className={"theme-field"}
							placeholder={t("filters.selectDateRange")}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("filters.hasReceipt")}</Label>
						<Select value={value.hasReceipt} onValueChange={(v) => onChange({ ...value, hasReceipt: v })}>
							<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
								<SelectValue placeholder={t("filters.hasReceiptPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="bg-card-select">
								<SelectItem value="all">{t("filters.all")}</SelectItem>
								<SelectItem value="yes">{t("filters.yes")}</SelectItem>
								<SelectItem value="no">{t("filters.no")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex md:justify-end">
						<Button_
							onClick={onApply}
							size="sm"
							label={t("filters.apply")}
							tone="primary"
							variant="solid"
							icon={<Filter size={18} />}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

function TinyBadge({ children }) {
	return (
		<span className="font-[Inter] text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
			{children}
		</span>
	);
}

function JsonBlock({ value }) {
	return (
		<pre className="mt-2 text-[11px] leading-5 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-auto">
			{JSON.stringify(value, null, 2)}
		</pre>
	);
}

function LogsModal({ isOpen, onClose, invoiceId, t }) {
	const [loading, setLoading] = useState(false);
	const [logs, setLogs] = useState([]);

	useEffect(() => {
		if (!isOpen || !invoiceId) return;

		(async () => {
			setLoading(true);
			try {
				const res = await api.get(`/purchases/${invoiceId}/audit-logs`);
				setLogs(res.data || []);
			} catch (e) {
				console.error(e);
				toast.error(e?.response?.data?.message || t("messages.logsFailed"));
			} finally {
				setLoading(false);
			}
		})();
	}, [isOpen, invoiceId, t]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="!max-w-4xl max-h-[85vh] flex flex-col">
				<DialogHeader className="border-b border-gray-200 dark:border-slate-700 pb-4">
					<DialogTitle className="flex items-center gap-3 text-xl">
						<div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
							<ScrollText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
						</div>
						{t("logs.title")}
					</DialogTitle>

					<DialogDescription className="text-sm mt-2">
						{t("logs.description")}{" "}
						<span className="font-semibold text-primary">#{invoiceId}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto py-4">
					{loading ? (
						<LogsModalSkeleton />
					) : logs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16">
							<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
								<ScrollText className="w-8 h-8 text-gray-400 dark:text-slate-600" />
							</div>
							<p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
								{t("logs.empty")}
							</p>
						</div>
					) : (
						<div className="space-y-3 px-1" dir="ltr">
							{logs.map((log, idx) => {
								const user = log.user || null;
								const userName = user?.name || "System";
								const userEmail = user?.email || "";
								const avatar = user?.avatarUrl || "";

								const hasDetails = !!(log.oldData || log.newData || log.changes);

								return (
									<motion.div
										key={log.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: idx * 0.05 }}
										className="p-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-md transition-all"
									>
										{/* Top row */}
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 space-y-2">
												<div className="flex items-center justify-between flex-wrap">
													<div className="flex items-center gap-2">
														<Badge>{log.action}</Badge>
														<TinyBadge>#{log.id}</TinyBadge>
													</div>

													<div className="font-[Inter] flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
														<Clock className="w-3 h-3" />
														{log.created_at
															? new Date(log.created_at).toLocaleString()
															: "-"}
													</div>
												</div>

												{/* Who did it */}
												<div className="flex items-center gap-3 pt-1">
													{avatar ? (
														<img
															src={avatarSrc(avatar)}
															alt={userName}
															className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-700"
														/>
													) : (
														<div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700" />
													)}

													<div className="flex flex-col">
														<div className="text-sm font-semibold text-gray-900 dark:text-white">
															{userName}
															{userEmail ? (
																<span className="ml-2 text-xs font-normal text-gray-500 dark:text-slate-400">
																	{userEmail}
																</span>
															) : null}
														</div>

														{/* IP optional */}
														{log.ipAddress ? (
															<div className="text-[11px] text-gray-400 dark:text-slate-500">
																IP: {log.ipAddress}
															</div>
														) : null}
													</div>
												</div>

												{/* Description */}
												{log.description ? (
													<p className="font-[Inter] text-sm text-gray-700 dark:text-slate-300">
														{log.description}
													</p>
												) : null}
											</div>
										</div>

										{/* Details: oldData / newData / changes */}
										{hasDetails ? (
											<details className="mt-3">
												<summary className="cursor-pointer text-xs text-primary font-semibold hover:underline flex items-center gap-2">
													<ChevronDown className="w-4 h-4" />
													{t("logs.showDetails")}
												</summary>

												<div className="mt-2 space-y-3">
													{log.oldData ? (
														<div>
															<div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1">
																oldData
															</div>
															<JsonBlock value={log.oldData} />
														</div>
													) : null}

													{log.newData ? (
														<div>
															<div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1">
																newData
															</div>
															<JsonBlock value={log.newData} />
														</div>
													) : null}

													{log.changes ? (
														<div>
															<div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1">
																changes
															</div>
															<JsonBlock value={log.changes} />
														</div>
													) : null}
												</div>
											</details>
										) : null}
									</motion.div>
								);
							})}
						</div>
					)}
				</div>

				<DialogFooter className="border-t border-gray-200 dark:border-slate-700 pt-4">
					<Button onClick={() => onClose(false)} className="px-6 rounded-xl">
						{t("actions.close")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}


function LogsModalSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">

			{/* Header */}
			<div className="border-b border-border pb-4 space-y-3">
				<div className="flex items-center gap-3">
					<Bone className="w-10 h-10 rounded-xl" />
					<div className="space-y-2">
						<Bone className="h-5 w-40" />
						<Bone className="h-4 w-72" />
					</div>
				</div>
			</div>

			{/* Logs List */}
			<div className="space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="p-4 rounded-xl border-2 border-border/40 bg-muted/20 space-y-4"
					>
						{/* Top Row */}
						<div className="flex items-center justify-between">
							<div className="flex gap-2">
								<Bone className="h-5 w-20 rounded-full" />
								<Bone className="h-5 w-14 rounded-full" />
							</div>
							<Bone className="h-4 w-32" />
						</div>

						{/* User Row */}
						<div className="flex items-center gap-3">
							<Bone className="w-8 h-8 rounded-full" />
							<div className="space-y-2">
								<Bone className="h-4 w-36" />
								<Bone className="h-3 w-24" />
							</div>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Bone className="h-4 w-full" />
							<Bone className="h-4 w-5/6" />
						</div>

						{/* Expandable Details Preview */}
						<div className="pt-2 border-t border-border/20 space-y-2">
							<Bone className="h-3 w-28" />
							<Bone className="h-20 w-full rounded-lg" />
						</div>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="border-t border-border pt-4 flex justify-end">
				<Bone className="h-10 w-24 rounded-xl" />
			</div>
		</div>
	);
}





function AcceptPreviewModal({ isOpen, onClose, invoiceId, t, onApply }) {
	const [loading, setLoading] = useState(false);
	const [preview, setPreview] = useState(null);

	useEffect(() => {
		if (!isOpen || !invoiceId) return;
		(async () => {
			setLoading(true);
			try {
				const res = await api.get(`/purchases/${invoiceId}/accept-preview`);
				setPreview(res.data);
			} catch (e) {
				console.error(e);
				toast.error(e?.response?.data?.message || t("messages.previewFailed"));
			} finally {
				setLoading(false);
			}
		})();
	}, [isOpen, invoiceId, t]);

	const rows = preview?.rows ?? [];
	const hasErrors = rows.some((r) => r.error);
	const hasPriceChanges = rows.some((r) => r.priceWillChange);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-5xl w-[96vw] max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 sm:p-6">
				<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b-2 border-primary/20">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
						<div>
							<DialogTitle className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2 sm:gap-3">
								<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
									<Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
								</div>
								<span className="truncate">{t("acceptPreview.title")}</span>
							</DialogTitle>
							<DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1 sm:mt-2">
								{t("acceptPreview.receiptNumber")}: <span className="font-bold text-primary">{preview?.receiptNumber || invoiceId}</span>
							</DialogDescription>
						</div>
						{preview && !loading && (
							<span className={cn(
								"self-start sm:self-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border-2 flex items-center gap-2",
								preview.currentStatus === "pending" && "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300"
							)}>
								<Clock className="w-3.5 h-3.5 sm:w-4 h-4" />
								{preview.currentStatus}
							</span>
						)}
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
					{loading ? (
						<LoadingSpinner text={t("acceptPreview.loading")} />
					) : !preview ? (
						<div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
							<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
								<XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-slate-600" />
							</div>
							<p className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-2">{t("acceptPreview.empty")}</p>
							<p className="text-sm text-gray-500 dark:text-slate-400">{t("acceptPreview.emptyDescription")}</p>
						</div>
					) : (
						<div className="space-y-4 sm:space-y-5">
							{/* Stats Cards */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-3 sm:p-4 border-2 border-primary/20"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
											<Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
										</div>
										<div>
											<div className="text-2xl sm:text-3xl font-bold text-primary">{rows.length}</div>
											<div className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 font-semibold">{t("acceptPreview.totalItems")}</div>
										</div>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-3 sm:p-4 border-2 border-green-200 dark:border-green-800"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
											<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
										</div>
										<div>
											<div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
												+{rows.reduce((sum, r) => sum + (r.addQty || 0), 0)}
											</div>
											<div className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 font-semibold">{t("acceptPreview.totalQuantity")}</div>
										</div>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 }}
									className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl p-3 sm:p-4 border-2 border-orange-200 dark:border-orange-800"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
											<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
										</div>
										<div>
											<div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
												{rows.filter(r => r.priceWillChange).length}
											</div>
											<div className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 font-semibold">{t("acceptPreview.priceUpdates")}</div>
										</div>
									</div>
								</motion.div>
							</div>

							{/* Formula Explanation */}
							{hasPriceChanges && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/8 to-blue-50/50 dark:from-primary/15 dark:to-blue-950/30 border-2 border-primary/30 shadow-lg"
								>
									<div className="relative p-4 sm:p-6">
										<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
											<div className="relative self-center sm:self-start">
												<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-xl">
													<svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
													</svg>
												</div>
												<div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
													<Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />
												</div>
											</div>

											<div className="flex-1 space-y-2 sm:space-y-3 w-full text-center sm:text-start">
												<h4 className="text-sm sm:text-base font-bold text-primary uppercase tracking-wide">
													{t("acceptPreview.calculationFormula")}
												</h4>

												<p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
													{t("acceptPreview.formulaDescription")}
												</p>

												<div className="relative group">
													<div className="relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border-2 border-primary/30 shadow-sm">
														<div className="text-[10px] sm:text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800/50 px-3 sm:px-5 py-3 sm:py-4">
															<div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-center text-center">
																<span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg sm:rounded-xl font-bold">
																	({t("acceptPreview.oldPrice")} × {t("acceptPreview.oldStock")})
																</span>
																<span className="text-primary font-bold text-base sm:text-lg">+</span>
																<span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg sm:rounded-xl font-bold">
																	({t("acceptPreview.incomingAvg")} × {t("acceptPreview.incomingQty")})
																</span>
															</div>
															<div className="text-center my-2 sm:my-3">
																<div className="inline-block w-full max-w-[200px] sm:max-w-md h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
															</div>
															<div className="flex items-center justify-center gap-2">
																<span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg sm:rounded-xl font-bold">
																	{t("acceptPreview.newStock")}
																</span>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</motion.div>
							)}

							{/* Items Table */}
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="border-2 border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md"
							>
								<div className="overflow-x-auto">
									<table className="w-full min-w-[800px] sm:min-w-full">
										<thead>
											<tr className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
												<th className="text-right p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.sku")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.stockBefore")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.addQty")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.stockAfter")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.oldPrice")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.incomingAvg")}
												</th>
												<th className="text-center p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700">
													{t("acceptPreview.newPrice")}
												</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-slate-900">
											{rows.map((r, idx) => (
												<motion.tr
													key={r.variantId}
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: idx * 0.03 }}
													className={cn(
														"border-b border-gray-100 dark:border-slate-800 transition-all",
														r.error
															? "bg-red-50 dark:bg-red-950/20"
															: "hover:bg-primary/5 dark:hover:bg-primary/10"
													)}
												>
													<td className="p-3 sm:p-4">
														<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
															<span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-slate-200 truncate max-w-[100px] sm:max-w-none">
																{r.sku || `#${r.variantId}`}
															</span>
															{r.priceWillChange && (
																<span className="w-fit text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary font-bold uppercase">
																	{t("acceptPreview.updated")}
																</span>
															)}
														</div>
														{r.error && (
															<div className="flex items-start gap-1 mt-1">
																<XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
																<p className="text-[9px] sm:text-[10px] text-red-700 dark:text-red-300 font-medium">{r.error}</p>
															</div>
														)}
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className="text-sm sm:text-base font-semibold text-gray-500 dark:text-slate-400">
															{r.oldStock ?? 0}
														</span>
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs sm:text-sm font-bold">
															+{r.addQty || 0}
														</span>
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className="text-base sm:text-lg font-bold text-primary">
															{r.newStock ?? 0}
														</span>
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className="text-sm sm:text-base font-semibold text-gray-500 dark:text-slate-400">
															{r.oldPrice ?? 0}
														</span>
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
															{r.incomingAvgCost ?? 0}
														</span>
													</td>
													<td className="p-3 sm:p-4 text-center">
														<span className={cn(
															"text-base sm:text-lg font-bold",
															r.priceWillChange
																? "text-primary"
																: "text-gray-600 dark:text-slate-400"
														)}>
															{r.newPrice ?? 0}
														</span>
													</td>
												</motion.tr>
											))}
										</tbody>
									</table>
								</div>
							</motion.div>

							{/* Error Alert */}
							{hasErrors && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 rounded-xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4"
								>
									<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
										<XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
									</div>
									<div>
										<p className="text-sm sm:text-base font-bold text-red-900 dark:text-red-200 mb-0.5 sm:mb-1">
											{t("acceptPreview.hasErrors")}
										</p>
										<p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
											{t("acceptPreview.hasErrorsDescription")}
										</p>
									</div>
								</motion.div>
							)}
						</div>
					)}
				</div>

				<DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
					<div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 sm:gap-0">
						<div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 order-2 sm:order-1">
							{!loading && preview && !hasErrors && (
								<span className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
									<span className="font-semibold">{t("acceptPreview.previewReady")}</span>
								</span>
							)}
						</div>
						<div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
							<Button
								variant="outline"
								onClick={onClose}
								className="flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold border-2"
							>
								{t("actions.cancel")}
							</Button>
							<Button
								onClick={() => onApply?.()}
								disabled={loading || !preview || hasErrors || !preview?.canApply}
								className={cn(
									"flex-1 sm:flex-none px-4 sm:px-10 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/30 transition-all transform hover:scale-105 active:scale-95",
									(loading || !preview || hasErrors || !preview?.canApply) && "opacity-50 cursor-not-allowed hover:scale-100"
								)}
							>
								<Check className="w-4 h-4 sm:w-5 sm:h-5 ltr:mr-1.5 sm:ltr:mr-2 rtl:ml-1.5 sm:rtl:ml-2" />
								{t("acceptPreview.apply")}
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DetailsModal({ isOpen, onClose, invoice, isLoading, formatCurrency }) {
	const t = useTranslations("purchases");
	const receipt = invoice?.receiptAsset || null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="!max-w-5xl max-h-[90vh] flex flex-col">
				<DialogHeader className="border-b-2 border-gray-200 dark:border-slate-700 pb-4">
					<DialogTitle className="flex items-center gap-3 text-2xl">
						<div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
							<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
						{t("details.title")}
					</DialogTitle>
					<DialogDescription className="text-sm mt-2">
						{t("details.invoiceNumber")}: <span className="font-bold text-primary">{invoice?.receiptNumber}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto py-4">
					{isLoading ? (
						<DetailsModalSkeleton />
					) : !invoice ? (
						null // Or a <NoData /> component
					) : (
						<div className="space-y-6 px-2">
							{/* Info Grid */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t("details.supplier")}</Label>
									<p className="text-sm font-bold text-gray-900 dark:text-white">
										{invoice.supplierId ? invoice.supplier?.name : t("details.noSupplier")}
									</p>
								</div>
								<div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t("details.safe")}</Label>
									<p className="text-sm font-bold text-gray-900 dark:text-white">{invoice.safeId ? String(invoice.safeId) : "-"}</p>
								</div>
								<div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t("details.date")}</Label>
									<p className="text-sm font-bold text-gray-900 dark:text-white">
										{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "-"}
									</p>
								</div>
								<div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t("details.status")}</Label>
									<span className={cn(
										"inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
										invoice.status === "accepted" && "bg-green-100 text-green-700",
										invoice.status === "pending" && "bg-yellow-100 text-yellow-700",
										invoice.status === "rejected" && "bg-red-100 text-red-700"
									)}>
										{t(`status.${invoice.status}`)}
									</span>
								</div>
							</div>

							{/* Items Table */}
							<div>
								<h3 className="text-base font-bold mb-3 flex items-center gap-2">
									<Package className="w-5 h-5 text-primary" />
									{t("details.items")}
								</h3>
								<div className="border-2 border-gray-200 dark:border-slate-700 rounded-xl overflow-y-auto">
									<table className="w-full text-sm">
										<thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800">
											<tr>
												<th className="text-right p-4 font-bold">{t("table.sku")}</th>
												<th className="text-right p-4 font-bold">{t("table.name")}</th>
												<th className="text-right p-4 font-bold">{t("table.unitCost")}</th>
												<th className="text-right p-4 font-bold">{t("table.quantityCount")}</th>
												<th className="text-right p-4 font-bold">{t("table.invoiceTotal")}</th>
											</tr>
										</thead>
										<tbody>
											{invoice.items?.map((item, idx) => (
												<tr key={idx} className="border-t hover:bg-primary/5 transition-colors">
													<td className="p-4">{item.variant?.sku || "-"}</td>
													<td className="p-4 font-medium">{item.variant?.product?.name || "-"}</td>
													<td className="p-4">{formatCurrency(item.purchaseCost)}</td>
													<td className="p-4 text-center font-semibold">{item.quantity}</td>
													<td className="p-4 font-bold text-primary">{formatCurrency(item.lineTotal)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							{/* Summary */}
							<div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-950/30 p-6 rounded-xl border-2 border-primary/30">
								<div className="space-y-3">
									<div className="flex justify-between text-sm">
										<span className="font-semibold text-gray-700 dark:text-slate-300">{t("summary.subtotal")}</span>
										<span className="font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="font-semibold text-gray-700 dark:text-slate-300">{t("summary.paidAmount")}</span>
										<span className="font-bold text-green-600">{formatCurrency(invoice.paidAmount)}</span>
									</div>
									<div className="flex justify-between text-lg font-bold border-t-2 border-primary/30 pt-3">
										<span className="text-gray-900 dark:text-white">{t("summary.remainingAmount")}</span>
										<span className="text-primary text-xl">{formatCurrency(invoice.remainingAmount)}</span>
									</div>
								</div>
							</div>

							{/* Receipt */}
							{receipt && (
								<div>
									<Label className="text-base font-bold mb-3 block flex items-center gap-2">
										<FileText className="w-5 h-5 text-primary" />
										{t("details.receiptAsset")}
									</Label>

									{isImagePath(receipt) ? (
										<img src={baseImg + receipt} alt="Receipt" className="w-full max-h-96 object-contain rounded-xl border-2 border-gray-200 dark:border-slate-700 shadow-lg" />
									) : isPdfPath(receipt) ? (
										<a href={baseImg + receipt} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all">
											<FileText size={20} />
											<span>{t("details.openPdf")}</span>
										</a>
									) : (
										<a href={baseImg + receipt} target="_blank" rel="noreferrer" className="text-sm text-primary underline font-semibold">
											{t("details.openAsset")}
										</a>
									)}
								</div>
							)}

							{/* Notes */}
							{invoice.notes && (
								<div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
									<Label className="text-xs text-gray-500 dark:text-slate-400 mb-2 block">{t("details.notes")}</Label>
									<p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{invoice.notes}</p>
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter className="border-t-2 border-gray-200 dark:border-slate-700 pt-4">
					<Button onClick={onClose} className="px-8 rounded-xl font-semibold">
						{t("actions.close")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DetailsModalSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">

			{/* Header */}
			<div className="border-b-2 border-border pb-4 space-y-3">
				<div className="flex items-center gap-3">
					<Bone className="w-12 h-12 rounded-xl" />
					<div className="space-y-2">
						<Bone className="h-6 w-48" />
						<Bone className="h-4 w-64" />
					</div>
				</div>
			</div>

			{/* Info Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-2"
					>
						<Bone className="h-3 w-16" />
						<Bone className="h-4 w-24" />
					</div>
				))}
			</div>

			{/* Items Section */}
			<div className="space-y-3">
				<Bone className="h-5 w-40" />

				<div className="rounded-xl border border-border/30 overflow-hidden">
					{/* Table Header */}
					<div className="bg-muted/30 px-4 py-3 flex justify-between">
						<Bone className="h-3 w-20" />
						<Bone className="h-3 w-24" />
						<Bone className="h-3 w-16" />
						<Bone className="h-3 w-16" />
						<Bone className="h-3 w-20" />
					</div>

					{/* Table Rows */}
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="grid grid-cols-5 gap-4 px-4 py-4 border-t border-border/20"
						>
							<Bone className="h-4 w-16" />
							<Bone className="h-4 w-28" />
							<Bone className="h-4 w-16" />
							<Bone className="h-4 w-12 mx-auto" />
							<Bone className="h-4 w-20" />
						</div>
					))}
				</div>
			</div>

			{/* Summary */}
			<div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
				<div className="flex justify-between">
					<Bone className="h-4 w-28" />
					<Bone className="h-4 w-20" />
				</div>
				<div className="flex justify-between">
					<Bone className="h-4 w-32" />
					<Bone className="h-4 w-20" />
				</div>
				<div className="flex justify-between pt-3 border-t border-primary/20">
					<Bone className="h-5 w-36" />
					<Bone className="h-6 w-24" />
				</div>
			</div>

			{/* Receipt */}
			<div className="space-y-3">
				<Bone className="h-5 w-40" />
				<Bone className="h-40 w-full rounded-xl" />
			</div>

			{/* Notes */}
			<div className="p-4 rounded-xl border border-border/40 space-y-2">
				<Bone className="h-3 w-20" />
				<Bone className="h-4 w-full" />
				<Bone className="h-4 w-5/6" />
			</div>

			{/* Footer */}
			<div className="border-t-2 border-border pt-4 flex justify-end">
				<Bone className="h-10 w-28 rounded-xl" />
			</div>
		</div>
	);
}

function EditPaidAmountModal({ isOpen, onClose, invoice, t, onSave }) {
	const [paidAmount, setPaidAmount] = useState(0);
	const [loading, setLoading] = useState(false);
	const { formatCurrency } = usePlatformSettings();
	useEffect(() => {
		if (invoice) setPaidAmount(invoice.paidAmount || 0);
	}, [invoice]);

	const handleSave = async () => {
		setLoading(true);
		try {
			await onSave(invoice.id, paidAmount);
			onClose();
		} finally {
			setLoading(false);
		}
	};

	if (!invoice) return null;
	const remaining = (invoice.total || 0) - paidAmount;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="!max-w-md">
				<DialogHeader className="border-b border-gray-200 dark:border-slate-700 pb-4">
					<DialogTitle className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
							<DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
						</div>
						{t("editPaidAmount.title")}
					</DialogTitle>
					<DialogDescription className="text-sm mt-2">{t("editPaidAmount.description")}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
						<Label className="text-xs text-gray-500 dark:text-slate-400 mb-2">{t("editPaidAmount.total")}</Label>
						<Input value={invoice.total} disabled className="bg-white dark:bg-slate-900 font-bold text-lg" />
					</div>

					<div>
						<Label className="mb-2">{t("editPaidAmount.paidAmount")}</Label>
						<Input
							type="number"
							value={paidAmount}
							onChange={(e) => setPaidAmount(Number(e.target.value))}
							min="0"
							max={invoice.total}
							className="text-lg font-semibold"
						/>
					</div>

					<div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800">
						<Label className="text-xs text-orange-600 dark:text-orange-400 mb-2">{t("editPaidAmount.remaining")}</Label>
						<div className={cn(
							"text-2xl font-bold",
							remaining > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
						)}>
							{formatCurrency(remaining)}
						</div>
					</div>
				</div>

				<DialogFooter className="border-t border-gray-200 dark:border-slate-700 pt-4">
					<Button variant="outline" onClick={onClose} className="px-6 rounded-xl">
						{t("actions.cancel")}
					</Button>
					<Button onClick={handleSave} disabled={loading} className="px-8 rounded-xl">
						{loading ? (
							<>
								<Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />
								{t("actions.saving")}
							</>
						) : (
							t("actions.save")
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
function FilterField({ label, children }) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			{children}
		</div>
	);
}
export default function PurchasesPage() {
	const t = useTranslations("purchases");
	const { formatCurrency } = usePlatformSettings();
	const router = useRouter();

	const [search, setSearch] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filters, setFilters] = useState({
		supplierId: "none",
		status: "all",
		startDate: null,
		endDate: null,
		hasReceipt: "all",
	});

	const [loading, setLoading] = useState(false);
	const [suppliers, setSuppliers] = useState([]);
	const [detailsModal, setDetailsModal] = useState({
		isOpen: false,
		invoice: null,
		isLoading: false
	});
	const [editModal, setEditModal] = useState({ isOpen: false, invoice: null });
	const [logsModal, setLogsModal] = useState({ isOpen: false, invoiceId: null });
	const [acceptModal, setAcceptModal] = useState({ isOpen: false, invoiceId: null });

	const [stats, setStats] = useState({ accepted: 0, pending: 0, rejected: 0 });
	const [pager, setPager] = useState({
		total_records: 0,
		current_page: 1,
		per_page: 10,
		records: [],
	});

	const statsCards = useMemo(
		() => [
			{
				name: t("stats.acceptedInvoices"),
				value: String(stats.accepted ?? 0),
				icon: CheckCircle,
				color: "#22C55E", // green
				sortOrder: 0,
			},
			{
				name: t("stats.pendingInvoices"),
				value: String(stats.pending ?? 0),
				icon: Clock,
				color: "#F59E0B", // amber
				sortOrder: 1,
			},
			{
				name: t("stats.rejectedInvoices"),
				value: String(stats.rejected ?? 0),
				icon: XCircle,
				color: "#EF4444", // red
				sortOrder: 2,
			},
		],
		[t, stats]
	);

	const fetchStats = async () => {
		try {
			const res = await api.get("/purchases/stats");
			setStats(res.data);
		} catch (error) {
			console.error(error);
			toast.error(t("messages.statsFailed"));
		}
	};

	const fetchSuppliers = async () => {
		try {
			const res = await api.get("/lookups/suppliers", { params: { limit: 200 } });
			setSuppliers(res.data || []);
		} catch (error) {
			console.error(error);
		}
	};

	const fetchPurchases = async (page = 1, perPage = 10) => {
		setLoading(true);
		try {
			const params = { page, limit: perPage, search };

			if (filters.supplierId && filters.supplierId !== "none") params.supplierId = filters.supplierId;
			if (filters.status && filters.status !== "all") params.status = filters.status;
			if (filters.startDate) params.startDate = filters.startDate;
			if (filters.endDate) params.endDate = filters.endDate;
			if (filters.hasReceipt && filters.hasReceipt !== "all") params.hasReceipt = filters.hasReceipt;

			const res = await api.get("/purchases", { params });

			setPager({
				total_records: res.data.total_records || 0,
				current_page: res.data.current_page || 1,
				per_page: res.data.per_page || 10,
				records: res.data.records || [],
			});
		} catch (error) {
			console.error(error);
			toast.error(t("messages.fetchFailed"));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStats();
		fetchSuppliers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		fetchPurchases(1, pager.per_page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search]);

	const handlePageChange = ({ page, per_page }) => fetchPurchases(page, per_page);
	const hasActiveFilters = useMemo(() => {
		return (
			(filters.supplierId && filters.supplierId !== "none") ||
			(filters.status && filters.status !== "all") ||
			Boolean(filters.startDate) ||
			Boolean(filters.endDate) ||
			(filters.hasReceipt && filters.hasReceipt !== "all")
		);
	}, [filters]);
	const handleStatusChange = async (id, newStatus) => {
		// 1. Define the promise
		const statusPromise = api.patch(`/purchases/${id}/status`, { status: newStatus });

		// 2. Wrap in toast.promise
		try {
			await toast.promise(statusPromise, {
				loading: t("messages.updatingStatus"), // Or a generic "Processing..."
				success: t("messages.statusUpdated"),
				error: (err) => t("messages.statusFailed") // Or normalizeAxiosError(err)
			});

			// 3. Refresh data only after the promise succeeds
			fetchPurchases(pager.current_page, pager.per_page);
			fetchStats();
		} catch (error) {
			// toast.promise already showed the error, 
			// but we catch it here to prevent unhandled promise rejection
			console.error(error);
		}
	};
	const handleUpdatePaidAmount = async (id, paidAmount) => {
		try {
			await api.patch(`/purchases/${id}/paid-amount`, { paidAmount });
			toast.success(t("messages.paidAmountUpdated"));
			fetchPurchases(pager.current_page, pager.per_page);
		} catch (error) {
			console.error(error);
			toast.error(t("messages.paidAmountFailed"));
		}
	};

	const applyFilters = () => fetchPurchases(1, pager.per_page);

	const handleViewDetails = async (row) => {
		// Open modal immediately and set loading to true
		setDetailsModal({ isOpen: true, invoice: null, isLoading: true });

		try {
			const res = await api.get(`/purchases/${row.id}`);
			// Update with data and stop loading
			setDetailsModal(prev => ({ ...prev, invoice: res.data, isLoading: false }));
		} catch (error) {
			console.error(error);
			toast.error(t("messages.fetchDetailsFailed"));
			// Close modal or just stop loading on error
			setDetailsModal(prev => ({ ...prev, isLoading: false }));
		}
	};

	const handleAcceptClick = (row) => {
		setAcceptModal({ isOpen: true, invoiceId: row.id });
	};

	const columns = useMemo(() => {
		return [
			{
				key: "receiptNumber",
				header: t("table.receiptNumber"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200 font-medium">{row.receiptNumber}</span>
				),
			},
			{
				key: "supplier",
				header: t("table.supplier"),
				cell: (row) => (
					<span className=" font-[inter] text-gray-600 dark:text-slate-200">
						{row?.supplier?.name ? row?.supplier?.name : t("table.noSupplier")}
					</span>
				),
			},
			{
				key: "created_at",
				header: t("table.date"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}
					</span>
				),
			},
			{
				key: "subtotal",
				header: t("table.subtotal"),
				cell: (row) => (
					<span className="text-gray-600 dark:text-slate-200">
						{formatCurrency(row.subtotal || 0)}
					</span>
				),
			},
			{
				key: "paidAmount",
				header: t("table.paidAmount"),
				cell: (row) => (
					<span className="text-green-600 dark:text-green-400 font-medium">
						{formatCurrency(row.paidAmount || 0)}
					</span>
				),
			},
			{
				key: "remainingAmount",
				header: t("table.remainingAmount"),
				cell: (row) => (
					<span className={cn(
						"font-medium",
						row.remainingAmount > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-slate-400"
					)}>
						{formatCurrency(row.remainingAmount || 0)}
					</span>
				),
			},
			{
				key: "receiptAsset",
				header: t("table.receipt"),
				className: "w-[90px]",
				cell: (row) => {
					const asset = baseImg + row.receiptAsset;
					if (!row.receiptAsset) return <span className="text-xs text-gray-400 text-center block">{t("table.noReceipt")}</span>;

					if (isImagePath(asset)) {
						return (
							<button type="button" onClick={() => handleViewDetails(row)} className="inline-flex items-center gap-2">
								<div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
									<img src={asset} alt="receipt" className="w-full h-full object-cover" />
								</div>
							</button>
						);
					}

					if (isPdfPath(asset)) {
						return (
							<a href={asset} target="_blank" rel="noreferrer" className="inline-flex justify-center w-full items-center gap-2 text-primary">
								<FileText size={18} />
							</a>
						);
					}

					return <span className="text-center block">-</span>;
				},
			},
			{
				key: "status",
				header: t("table.status"),
				cell: (row) => {
					const statusConfig = {
						accepted: {
							label: t("status.accepted"),
							className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
						},
						pending: {
							label: t("status.pending"),
							className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
						},
						rejected: {
							label: t("status.rejected"),
							className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
						},
					};
					const config = statusConfig[row.status] || statusConfig.pending;

					return (
						<span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border", config.className)}>
							{config.label}
						</span>
					);
				},
			},
			{
				key: "actions",
				header: t("table.actions"),
				className: "w-[110px]",
				cell: (row) => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">
								<MoreVertical className="h-4 w-4 text-gray-600 dark:text-slate-300" />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="start" className="w-56">
							<DropdownMenuItem onClick={() => handleViewDetails(row)} className="flex items-center gap-2 cursor-pointer" permission="purchases.read">
								<Eye size={16} className="text-blue-600" />
								<span>{t("actions.view")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem onClick={() => setLogsModal({ isOpen: true, invoiceId: row.id })} className="flex items-center gap-2 cursor-pointer" permission="purchases.read">
								<ScrollText size={16} className="text-purple-600" />
								<span>{t("actions.logs")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem onClick={() => setEditModal({ isOpen: true, invoice: row })} className="flex items-center gap-2 cursor-pointer" permission="purchases.update">
								<Edit size={16} className="text-gray-600" />
								<span>{t("actions.editPaidAmount")}</span>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400">
								{t("actions.changeStatus")}
							</div>

							<DropdownMenuItem
								onClick={() => handleAcceptClick(row)}
								className="flex items-center gap-2 cursor-pointer"
								disabled={row.status === "accepted"}
								permission="purchases.update"
							>
								<Check size={16} className="text-green-600" />
								<span>{t("actions.accept")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={() => handleStatusChange(row.id, "pending")}
								className="flex items-center gap-2 cursor-pointer"
								disabled={row.status === "pending"}
								permission="purchases.update"
							>
								<Pause size={16} className="text-yellow-600" />
								<span>{t("actions.suspend")}</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={() => handleStatusChange(row.id, "rejected")}
								className="flex items-center gap-2 cursor-pointer"
								disabled={row.status === "rejected"}
								permission="purchases.update"
							>
								<X size={16} className="text-red-600" />
								<span>{t("actions.reject")}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		];
	}, [t]);

	return (
		<div className="min-h-screen p-5">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.purchases") }
				]}
				buttons={
					<>
						<Button_
							href="/purchases/new"
							size="sm"
							label={t("actions.createInvoice")}
							icon={<Plus size={18} />}
							variant="solid"
							permission="purchases.create"
						/>
						<Button_ size="sm" label={t("actions.howToUse")} tone="ghost" icon={<Info size={18} />} permission="purchases.read" />
					</>
				}
				stats={statsCards}
			/>

			<Table
				searchValue={search}
				onSearchChange={setSearch}
				onSearch={() => { }}
				labels={{
					searchPlaceholder: t("toolbar.searchPlaceholder"),
					filter: t("toolbar.filter"),
					apply: t("filters.apply"),
					total: t("common.total"),
					limit: t("common.limit"),
					emptyTitle: t("empty"),
					emptySubtitle: "",
				}}
				actions={[]}
				hasActiveFilters={hasActiveFilters}
				onApplyFilters={applyFilters}
				filters={
					<>
						<FilterField label={t("filters.supplier")}>
							<Select
								value={filters.supplierId}
								onValueChange={(v) => setFilters((f) => ({ ...f, supplierId: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.supplierPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="none">{t("filters.all")}</SelectItem>
									{suppliers.map((s) => (
										<SelectItem key={s.id} value={String(s.id)}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("filters.status")}>
							<Select
								value={filters.status}
								onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.statusPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="accepted">{t("status.accepted")}</SelectItem>
									<SelectItem value="pending">{t("status.pending")}</SelectItem>
									<SelectItem value="rejected">{t("status.rejected")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>

						<FilterField label={t("filters.dateRange")}>
							<Flatpickr
								value={[
									filters.startDate ? new Date(filters.startDate) : null,
									filters.endDate ? new Date(filters.endDate) : null,
								]}
								onChange={([start, end]) => {
									setFilters((f) => ({
										...f,
										startDate: start ? start.toISOString().split("T")[0] : null,
										endDate: end ? end.toISOString().split("T")[0] : null,
									}));
								}}
								options={{ mode: "range", dateFormat: "Y-m-d", maxDate: "today" }}
								data-size="default"
								className={"theme-field"}
								placeholder={t("filters.selectDateRange")}
							/>
						</FilterField>

						<FilterField label={t("filters.hasReceipt")}>
							<Select
								value={filters.hasReceipt}
								onValueChange={(v) => setFilters((f) => ({ ...f, hasReceipt: v }))}
							>
								<SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
									<SelectValue placeholder={t("filters.hasReceiptPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="bg-card-select">
									<SelectItem value="all">{t("filters.all")}</SelectItem>
									<SelectItem value="yes">{t("filters.yes")}</SelectItem>
									<SelectItem value="no">{t("filters.no")}</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>
					</>
				}
				columns={columns}
				data={pager.records}
				isLoading={loading}
				pagination={{
					total_records: pager.total_records,
					current_page: pager.current_page,
					per_page: pager.per_page,
				}}
				onPageChange={({ page, per_page }) => fetchPurchases(page, per_page)}
			/>

			<DetailsModal
				isOpen={detailsModal.isOpen}
				onClose={() => setDetailsModal({ isOpen: false, invoice: null })}
				invoice={detailsModal.invoice}
				isLoading={detailsModal.isLoading}
				formatCurrency={formatCurrency}
			// t={t}
			/>

			<LogsModal
				isOpen={logsModal.isOpen}
				onClose={() => setLogsModal({ isOpen: false, invoiceId: null })}
				invoiceId={logsModal.invoiceId}
				t={t}
			/>

			<EditPaidAmountModal
				isOpen={editModal.isOpen}
				onClose={() => setEditModal({ isOpen: false, invoice: null })}
				invoice={editModal.invoice}
				t={t}
				onSave={handleUpdatePaidAmount}
				formatCurrency={formatCurrency}
			/>

			<AcceptPreviewModal
				isOpen={acceptModal.isOpen}
				onClose={() => setAcceptModal({ isOpen: false, invoiceId: null })}
				invoiceId={acceptModal.invoiceId}
				t={t}
				onApply={async () => {
					if (!acceptModal.invoiceId) return;
					await handleStatusChange(acceptModal.invoiceId, "accepted");
					setAcceptModal({ isOpen: false, invoiceId: null });
				}}
			/>
		</div>
	);
}