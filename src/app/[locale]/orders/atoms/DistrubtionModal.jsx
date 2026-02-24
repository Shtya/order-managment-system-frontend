
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	CheckCircle,
	XCircle,
	TrendingUp,
	Users,
	Plus,
	Loader2,
	ChevronDownIcon,
	ChevronDown,
	Zap,
	ChevronRight,
	ArrowLeft,
	Sparkles,
} from "lucide-react";

import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import UserSelect, { avatarSrc } from "@/components/atoms/UserSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/utils/api";






const PAGE_SIZE = 20;

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const hexToRgb = (hex) => {
	const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return r
		? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) }
		: null;
};
const rgba = (hex, a) => {
	const rgb = hexToRgb(hex);
	return rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},${a})` : "transparent";
};

export const StatusSelect = ({
	open,
	setOpen,
	selectedStatuses,
	statuses,
	setSelectedStatuses,
}) => {
	const t = useTranslations("orders");
	const triggerRef = useRef(null);
	const dropdownRef = useRef(null);

	const toggleStatus = useCallback((id) => {
		setSelectedStatuses((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	}, [setSelectedStatuses]);

	/* close on outside click */
	useEffect(() => {
		const handler = (e) => {
			if (
				triggerRef.current && !triggerRef.current.contains(e.target) &&
				dropdownRef.current && !dropdownRef.current.contains(e.target)
			) setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [setOpen]);

	const selectedObjects = useMemo(() => {
		if (!selectedStatuses.length) return [];
		const set = new Set(selectedStatuses.map(String));
		return statuses.filter((s) => set.has(String(s.id)));
	}, [statuses, selectedStatuses]);

	const count = selectedStatuses.length;

	return (
		<div className="space-y-2">
			<label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
				{t("distribution.orderStatus")}
			</label>

			{/* ── Trigger ─────────────────────────────────────────────────── */}
			<div className="relative">
				<button
					ref={triggerRef}
					type="button"
					onClick={() => setOpen((v) => !v)}
					className={cn(
						"group w-full flex items-center justify-between gap-2 h-11 px-4 rounded-xl",
						"border border-border bg-background text-sm",
						"transition-all duration-200",
						"hover:border-primary  ",
						"hover:shadow-[0_0_0_3px_rgba(255,139,0,0.08)]  ",
						open && [
							"border-primary ",
							"shadow-[0_0_0_3px_rgba(255,139,0,0.1)]  ",
						]
					)}
				>
					<span className="flex items-center gap-2 min-w-0">
						{count > 0 ? (
							<>
								{/* mini color dots preview */}
								<span className="flex -space-x-1">
									{selectedObjects.slice(0, 4).map((s) => (
										<span
											key={s.id}
											className="w-3 h-3 rounded-full border-2 border-background flex-shrink-0"
											style={{ backgroundColor: s.color || "#888" }}
										/>
									))}
								</span>
								<span className="font-semibold text-foreground">
									{t("distribution.statusesSelected", { count })}
								</span>
							</>
						) : (
							<span className="text-muted-foreground">
								{t("distribution.selectStatusPlaceholder")}
							</span>
						)}
					</span>

					<motion.span
						animate={{ rotate: open ? 180 : 0 }}
						transition={{ duration: 0.2 }}
						className={cn(
							"flex-shrink-0 transition-colors",
							open ? "text-primary" : "text-muted-foreground"
						)}
					>
						<ChevronDown size={15} />
					</motion.span>
				</button>

				{/* ── Dropdown ──────────────────────────────────────────────── */}
				<AnimatePresence>
					{open && (
						<motion.div
							ref={dropdownRef}
							initial={{ opacity: 0, y: -6, scale: 0.98 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -6, scale: 0.98 }}
							transition={{ duration: 0.15 }}
							className={cn(
								"absolute z-50 mt-1.5 w-full",
								"bg-popover border border-border rounded-2xl",
								"shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
								"max-h-[232px] overflow-hidden"
							)}
						>
							{/* gradient strip at top */}
							<div className="h-[2px] w-full rounded-t-2xl bg-gradient-to-r from-primary via-[var(--secondary)] to-[var(--third)]   opacity-70" />

							<div className="overflow-y-auto max-h-[230px]">
								{statuses.length === 0 ? (
									<div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
										<Loader2 size={14} className="animate-spin" />
										{t("messages.loading")}
									</div>
								) : (
									<div className="p-1.5 space-y-0.5">
										{statuses.map((s) => {
											const id = String(s.id);
											const isChecked = selectedStatuses.includes(id);
											const c = s.color || "#6366f1";
											const label = s.system ? t(`statuses.${s.code}`) : (s.name || s.code);

											return (
												<button
													key={id}
													type="button"
													onClick={() => toggleStatus(id)}
													style={{
														backgroundColor: isChecked ? rgba(c, 0.1) : undefined,
													}}
													className={cn(
														"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
														"text-sm text-left transition-all duration-150",
														!isChecked && "hover:bg-muted/60",
													)}
												>
													{/* Custom checkbox */}
													<span
														className="flex-shrink-0 w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all duration-150"
														style={{
															border: `2px solid ${isChecked ? c : "currentColor"}`,
															borderColor: isChecked ? c : "var(--border-color, #d1d5db)",
															backgroundColor: isChecked ? c : "transparent",
														}}
													>
														{isChecked && (
															<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
																<path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
															</svg>
														)}
													</span>

													{/* Color dot */}
													<span
														className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
														style={{ backgroundColor: c, boxShadow: `0 0 0 2px ${rgba(c, 0.2)}` }}
													/>

													<span
														className="flex-1 truncate font-medium transition-colors"
														style={{ color: isChecked ? c : undefined }}
													>
														{label}
													</span>

													{isChecked && (
														<motion.span
															initial={{ scale: 0 }}
															animate={{ scale: 1 }}
															className="text-[10px] font-bold uppercase tracking-wider"
															style={{ color: rgba(c, 0.7) }}
														>
															✓
														</motion.span>
													)}
												</button>
											);
										})}
									</div>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* ── Selected tags ────────────────────────────────────────────── */}
			<AnimatePresence>
				{selectedObjects.length > 0 && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="flex flex-wrap gap-1.5 overflow-hidden pt-0.5"
					>
						{selectedObjects.map((s) => {
							const id = String(s.id);
							const c = s.color || "#6366f1";
							const label = s.system ? t(`statuses.${s.code}`) : (s.name || s.code);

							return (
								<motion.span
									key={id}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.8 }}
									transition={{ type: "spring", stiffness: 400, damping: 25 }}
									className="group inline-flex items-center gap-1.5 ps-2.5 pe-1.5 py-1 rounded-xl text-xs font-bold border"
									style={{
										backgroundColor: rgba(c, 0.1),
										borderColor: rgba(c, 0.3),
										color: c,
									}}
								>
									<span
										className="w-1.5 h-1.5 rounded-full flex-shrink-0"
										style={{ backgroundColor: c }}
									/>
									{label}
									<button
										type="button"
										onClick={() => toggleStatus(id)}
										className="ms-0.5 w-4 h-4 rounded-lg flex items-center justify-center transition-all hover:opacity-100 opacity-60"
										style={{ color: c }}
									>
										<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
											<path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
										</svg>
									</button>
								</motion.span>
							);
						})}

						{selectedObjects.length > 1 && (
							<motion.button
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								type="button"
								onClick={() => setSelectedStatuses([])}
								className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold
									border border-dashed border-border text-muted-foreground
									hover:border-red-400 hover:text-red-500 hover:bg-red-50 
									transition-all duration-150"
							>
								<svg width="9" height="9" viewBox="0 0 9 9" fill="none">
									<path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
								</svg>
								{t("distribution.clearAll")}
							</motion.button>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};


export const BlockEmployeePopover = ({
	block,
	loadingEmployees,
	empItems,
	assignmentBlocks,
	setBlockEmployee,
	fetchEmployeePage,
	loadingMore,
	nextCursor,
}) => {
	const t = useTranslations("orders");
	const tCommon = useTranslations("common");
	const [open, setOpen] = useState(false);
	const selectedUser = block.employee?.user;

	/* workload color: green → amber → red */
	const loadColor = (count) => {
		if (count == null) return null;
		if (count < 8) return "#10b981";
		if (count < 15) return "#f59e0b";
		return "#ef4444";
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"group w-full flex items-center justify-between gap-3 h-11 px-4 rounded-xl",
						"border border-border bg-background text-sm",
						"transition-all duration-200",
						"hover:border-primary ",
						"hover:shadow-[0_0_0_3px_rgba(255,139,0,0.08)] ",
						open && [
							"border-primary ",
							"shadow-[0_0_0_3px_rgba(255,139,0,0.1)]  ",
						]
					)}
				>
					<span className="flex items-center gap-2.5 min-w-0 flex-1">
						{selectedUser ? (
							<>
								<Avatar className="h-7 w-7 flex-shrink-0 ring-2 ring-primary/20">
									<AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name} />
									<AvatarFallback
										className="text-[10px] font-black text-white"
										style={{
											background: "linear-gradient(135deg, var(--primary), var(--third, #ff5c2b))",
										}}
									>
										{(selectedUser.name || "?").slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="truncate font-semibold text-foreground">
									{selectedUser.name}
								</span>
								{block.employee?.activeCount != null && (
									<span
										className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
										style={{
											color: loadColor(block.employee.activeCount),
											backgroundColor: rgba(loadColor(block.employee.activeCount), 0.1),
										}}
									>
										{block.employee.activeCount} {t("distribution.currentOrders")}
									</span>
								)}
							</>
						) : (
							<span className="text-muted-foreground">
								{loadingEmployees
									? (
										<span className="flex items-center gap-2">
											<Loader2 size={13} className="animate-spin" />
											{t("messages.loading")}
										</span>
									)
									: t("distribution.selectEmployeePlaceholder")
								}
							</span>
						)}
					</span>

					<ChevronDown
						size={14}
						className={cn(
							"flex-shrink-0 transition-all duration-200",
							open ? "rotate-180 text-primary" : "text-muted-foreground"
						)}
					/>
				</button>
			</PopoverTrigger>

			<PopoverContent
				align="start"
				sideOffset={6}
				className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0 rounded-2xl border-border shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
			>
				{/* gradient top strip */}
				<div className="h-[2px] bg-gradient-to-r from-primary via-[var(--secondary)] to-[var(--third)]   opacity-70" />

				<div className="max-h-[280px] overflow-y-auto">
					{loadingEmployees ? (
						<div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
							<Loader2 size={16} className="animate-spin" />
							{t("messages.loading")}
						</div>
					) : (
						<>
							<div className="p-1.5 space-y-0.5">
								{empItems.map((item) => {
									const u = item.user;
									const isSelected = Number(block.employee?.user?.id) === Number(u?.id);
									const usedElsewhere = assignmentBlocks.some(
										(b) => b.id !== block.id && Number(b.employee?.user?.id) === Number(u?.id)
									);
									const lc = loadColor(item?.activeCount);

									return (
										<button
											key={u?.id}
											type="button"
											disabled={usedElsewhere}
											onClick={() => {
												if (!usedElsewhere) {
													setBlockEmployee(block.id, item);
													setOpen(false);
												}
											}}
											className={cn(
												"group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
												"text-sm text-left transition-all duration-150",
												isSelected
													? "bg-primary/10 /15"
													: !usedElsewhere && "hover:bg-muted/60",
												usedElsewhere && "opacity-40 cursor-not-allowed",
											)}
										>
											{/* Avatar */}
											<Avatar className={cn(
												"h-8 w-8 flex-shrink-0 transition-all",
												isSelected && "ring-2 ring-primary/40  "
											)}>
												<AvatarImage src={u?.avatarUrl} alt={u?.name} />
												<AvatarFallback
													className="text-[10px] font-black text-white"
													style={{ background: "linear-gradient(135deg, var(--primary), var(--third, #ff5c2b))" }}
												>
													{(u?.name || "?").slice(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>

											{/* Name */}
											<span className="flex-1 truncate font-medium text-foreground">
												{u?.name}
											</span>

											{/* Workload pill */}
											{item?.activeCount != null && !usedElsewhere && (
												<span
													className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
													style={{
														color: lc,
														backgroundColor: rgba(lc, 0.1),
													}}
												>
													{item.activeCount}
												</span>
											)}

											{/* Already assigned tag */}
											{usedElsewhere && (
												<span className="text-[10px] font-bold text-amber-500 bg-amber-50  px-1.5 py-0.5 rounded-full flex-shrink-0">
													{t("distribution.alreadyAssigned")}
												</span>
											)}

											{/* Selected check */}
											{isSelected && (
												<span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
													style={{ backgroundColor: "var(--primary)" }}>
													<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
														<path d="M1.5 4L3.2 5.8L6.5 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
													</svg>
												</span>
											)}
										</button>
									);
								})}
							</div>

							{nextCursor != null && (
								<div className="border-t border-border p-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="w-full rounded-xl text-xs font-bold h-8 hover:bg-primary/8 hover:text-primary"
										onClick={() => fetchEmployeePage(nextCursor)}
										disabled={loadingMore}
									>
										{loadingMore
											? <><Loader2 size={12} className="animate-spin me-1.5" /> {t("messages.loading")}</>
											: tCommon("loadMore")
										}
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};


/* ─── tiny reusable pill ─────────────────────────────────────────────────── */
function Pill({ children, className }) {
	return (
		<span className={cn(
			"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
			className
		)}>
			{children}
		</span>
	);
}

/* ─── section header ─────────────────────────────────────────────────────── */
function SectionLabel({ children }) {
	return (
		<p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground mb-2">
			{children}
		</p>
	);
}

export default function DistributionModal({ isOpen, onClose, statuses = [], onSuccess }) {
	const t = useTranslations("orders");

	const [seletOpen, setSelectOpen] = useState(false);
	const [distributionType, setDistributionType] = useState(null);
	const [dateRange, setDateRange] = useState({
		from: new Date().toISOString().split("T")[0],
		to: new Date().toISOString().split("T")[0],
	});
	const [selectedStatuses, setSelectedStatuses] = useState([]);

	const [assignmentBlocks, setAssignmentBlocks] = useState([
		{ id: crypto.randomUUID(), employee: null, orderIds: [] },
	]);
	const addBlock = () =>
		setAssignmentBlocks(prev => [...prev, { id: crypto.randomUUID(), employee: null, orderIds: [] }]);
	const removeBlock = (id) =>
		setAssignmentBlocks(prev => prev.filter(b => b.id !== id));
	const setBlockEmployee = (id, item) =>
		setAssignmentBlocks(prev => prev.map(b => b.id === id ? { ...b, employee: item } : b));
	const toggleBlockOrder = (blockId, orderId) =>
		setAssignmentBlocks(prev => prev.map(b => {
			if (b.id !== blockId) return b;
			return {
				...b,
				orderIds: b.orderIds.includes(orderId)
					? b.orderIds.filter(o => o !== orderId)
					: [...b.orderIds, orderId],
			};
		}));
	const setBlockAllOrders = (blockId, orderIds) =>
		setAssignmentBlocks(prev => prev.map(b => b.id === blockId ? { ...b, orderIds } : b));

	const [freeOrders, setFreeOrders] = useState([]);
	const [freeOrdersLoading, setFreeOrdersLoading] = useState(false);
	const [assigning, setAssigning] = useState(false);

	const [employeeCount, setEmployeeCount] = useState(0);
	const [orderCount, setOrderCount] = useState(0);
	const [autoEmployeesLoading, setAutoEmployeesLoading] = useState(false);
	const [autoAssignResult, setAutoAssignResult] = useState({ maxEmployees: 0, maxOrders: 0, assignments: [] });

	const [empItems, setEmpItems] = useState([]);
	const [nextCursor, setNextCursor] = useState(null);
	const [loadingEmployees, setLoadingEmployees] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const fetchEmployeePage = useCallback(async (cursor = null) => {
		const isFirst = cursor == null;
		if (isFirst) setLoadingEmployees(true); else setLoadingMore(true);
		try {
			const params = { limit: PAGE_SIZE };
			if (cursor != null) params.cursor = cursor;
			const { data: res } = await api.get("/orders/employees-by-load", { params });
			const data = res?.data ?? [];
			setEmpItems(prev => isFirst ? data : [...prev, ...data]);
			setNextCursor(res?.nextCursor ?? null);
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingEmployees(false);
			setLoadingMore(false);
		}
	}, []);

	useEffect(() => {
		if (distributionType === "normal") fetchEmployeePage(null);
	}, [distributionType, fetchEmployeePage]);

	useEffect(() => {
		if (!isOpen || distributionType !== "normal") return;
		if (selectedStatuses.length === 0 || seletOpen) { setFreeOrders([]); return; }
		let cancelled = false;
		(async () => {
			setFreeOrdersLoading(true);
			try {
				const { data } = await api.get("/orders/free-orders", {
					params: { statusIds: selectedStatuses.join(","), startDate: dateRange.from, endDate: dateRange.to, limit: 200 },
				});
				if (!cancelled) setFreeOrders(data?.data ?? []);
			} catch {
				if (!cancelled) { toast.error(t("messages.errorFetchingOrders")); setFreeOrders([]); }
			} finally {
				if (!cancelled) setFreeOrdersLoading(false);
			}
		})();
		return () => { cancelled = true; };
	}, [isOpen, distributionType, selectedStatuses, seletOpen, dateRange.from, dateRange.to, t]);

	const handleClose = () => {
		setDistributionType(null);
		setSelectedStatuses([]);
		setAssignmentBlocks([{ id: crypto.randomUUID(), employee: null, orderIds: [] }]);
		setFreeOrders([]);
		setAutoAssignResult(null);
		onClose();
	};

	const isNormalValid = useMemo(() =>
		assignmentBlocks.some(b => b.employee && b.orderIds?.length > 0),
		[assignmentBlocks]
	);
	const isSmartValid = selectedStatuses.length > 0 && autoAssignResult?.assignments?.length > 0;

	const handleDistribute = async () => {
		if (distributionType === "normal") {
			const valid = assignmentBlocks.filter(b => b.employee && b.orderIds.length > 0);
			if (!valid.length) { toast.error(t("distribution.selectEmployeeAndOrders")); return; }
			setAssigning(true);
			try {
				await api.post("/orders/assign-manual", {
					assignments: valid.map(b => ({ userId: Number(b.employee.user.id), orderIds: b.orderIds })),
				});
				toast.success(t("distribution.normalSuccess", { count: valid.reduce((s, b) => s + b.orderIds.length, 0), employees: valid.length }));
				onSuccess?.();
				handleClose();
			} catch (err) {
				toast.error(err.response?.data?.message || t("messages.errorUpdatingStatus"));
			} finally { setAssigning(false); }
		} else {
			if (!selectedStatuses.length || seletOpen) { toast.error(t("distribution.selectStatusToLoadOrders")); return; }
			setAssigning(true); setAutoAssignResult(null);
			try {
				const res = await api.post("/orders/assign-auto", {
					statusIds: selectedStatuses,
					employeeCount: Number(employeeCount) || 0,
					orderCount: Number(orderCount) || 0,
					startDate: dateRange.from,
					endDate: dateRange.to,
				});
				const data = res.data;
				if (!data?.success) { toast.error(data?.message || t("distribution.autoAssignFailed")); return; }
				setAutoAssignResult(data.result || []);
				toast.success(t("distribution.autoAssignSuccess", { count: data.totalAssigned, employees: data.employeesParticipating }));
				onSuccess?.();
				setTimeout(() => { handleClose(); setAutoAssignResult(null); }, 2000);
			} catch (err) {
				toast.error(err.response?.data?.message || t("distribution.autoAssignFailed"));
			} finally { setAssigning(false); }
		}
	};

	useEffect(() => {
		if (selectedStatuses.length === 0 || seletOpen) { setAutoAssignResult(null); return; }
		(async () => {
			setAutoEmployeesLoading(true);
			try {
				const response = await api.post("/orders/auto-assign-preview", {
					statusIds: selectedStatuses.map(s => Number(s)),
					requestedOrderCount: orderCount || 0,
					requestedEmployeeCount: employeeCount || 0,
					startDate: dateRange.from,
					endDate: dateRange.to,
				});
				setAutoAssignResult(response.data);
				if (orderCount > response.data.maxOrders) setOrderCount(response.data.maxOrders);
				else if (orderCount !== response.data.effectiveOrderCount) setOrderCount(response.data.effectiveOrderCount);
				if (employeeCount > response.data.maxEmployees) setEmployeeCount(response.data.maxEmployees);
				else if (employeeCount !== response.data.effectiveEmployeeCount) setEmployeeCount(response.data.effectiveEmployeeCount);
			} catch (err) {
				console.error(err);
			} finally { setAutoEmployeesLoading(false); }
		})();
	}, [seletOpen, selectedStatuses, orderCount, employeeCount, dateRange.from, dateRange.to]);

	/* ─── total assigned count ─── */
	const totalAssigned = assignmentBlocks.reduce((s, b) => s + b.orderIds.length, 0);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border border-border">

				{/* ══ HEADER ══════════════════════════════════════════════════ */}
				<div className="relative overflow-hidden flex-shrink-0">
					{/* gradient bar */}
					<div className="absolute inset-0 " />
					<div className="relative flex items-center gap-4 px-6 py-5 border-b border-border">


						{/* icon */}
						<div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
							bg-gradient-to-br from-primary to-[var(--third)]
							 
							shadow-[0_4px_16px_rgb(var(--primary-shadow,255_139_0/0.4))]">
							{distributionType === "smart"
								? <Zap className="text-white" size={20} />
								: <Users className="text-white" size={20} />
							}
						</div>

						<div className="flex-1 min-w-0">
							<h2 className="text-lg font-black tracking-tight text-foreground leading-none">
								{!distributionType
									? t("distribution.title")
									: distributionType === "normal"
										? t("distribution.normalTitle")
										: t("distribution.smartTitle")}
							</h2>
							{distributionType && (
								<p className="text-xs text-muted-foreground mt-0.5">
									{distributionType === "normal"
										? t("distribution.normalDescription")
										: t("distribution.smartDescription")}
								</p>
							)}
						</div>

						{/* live badge */}
						{distributionType === "normal" && totalAssigned > 0 && (
							<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
								<Pill className="bg-primary/15 text-primary    ">
									{totalAssigned} orders
								</Pill>
							</motion.div>
						)}
					</div>
				</div>

				{/* ══ BODY ════════════════════════════════════════════════════ */}
				<div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
					<AnimatePresence mode="wait">

						{/* ── TYPE SELECTION ─────────────────────────────────── */}
						{!distributionType && (
							<motion.div
								key="type-select"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="   grid grid-cols-2 gap-4"
							>
								{[
									{
										key: "normal",
										icon: Users,
										color: "from-primary to-secondary  ",
										glow: "shadow-[0_8px_32px_rgba(255,139,0,0.25)] ",
										bg: "bg-primary/8  ",
										border: "hover:border-primary  ",
										badge: "bg-primary/12 text-primary    ",
										badgeText: "Manual",
									},
									{
										key: "smart",
										icon: Zap,
										color: "from-primary to-primary   ",
										glow: "shadow-[0_8px_32px_rgba(255,183,3,0.25)]  ",
										bg: "bg-primary/8  ",
										border: "hover:border-primary  ",
										badge: "bg-primary/15 text-third    ",
										badgeText: "Auto",
									},
								].map(opt => {
									const Ico = opt.icon;
									return (
										<motion.button
											key={opt.key}
											whileHover={{ scale: 1.02, y: -2 }}
											whileTap={{ scale: 0.98 }}
											onClick={() => setDistributionType(opt.key)}
											className={cn(
												"group  relative text-start p-6 rounded-2xl border-2 border-border transition-all duration-200 overflow-hidden",
												opt.bg, opt.border,
											)}
										>
											{/* corner glow */}
											<div className={cn(
												"absolute -top-6 -end-6 w-24 h-24 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity",
												`bg-gradient-to-br ${opt.color}`
											)} />

											<div className={cn(
												"w-12 h-12 rounded-2xl mb-4 flex items-center justify-center",
												`bg-gradient-to-br ${opt.color}`,
												opt.glow,
											)}>
												<Ico className="text-white" size={22} />
											</div>

											<div className="flex items-center gap-2 mb-1.5">
												<h3 className="text-base font-black text-foreground">
													{t(`distribution.${opt.key === "normal" ? "normalTitle" : "smartTitle"}`)}
												</h3>
												<Pill className={opt.badge}>{opt.badgeText}</Pill>
											</div>
											<p className="text-sm text-muted-foreground leading-relaxed">
												{t(`distribution.${opt.key === "normal" ? "normalDescription" : "smartDescription"}`)}
											</p>

											<ChevronRight
												size={16}
												className=" rtl:scale-x-[-1] absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground
													opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5
													transition-all duration-200"
											/>
										</motion.button>
									);
								})}
							</motion.div>
						)}

						{/* ── FORM ───────────────────────────────────────────── */}
						{distributionType && (
							<motion.div
								key="form"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="space-y-5"
							>
								{/* Date range */}
								<div>
									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold">{t("distribution.fromDate")}</Label>
											<Input
												type="date"
												value={dateRange.from}
												onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
												className="rounded-xl h-10 text-sm"
											/>
										</div>
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold">{t("distribution.toDate")}</Label>
											<Input
												type="date"
												value={dateRange.to}
												onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
												className="rounded-xl h-10 text-sm"
											/>
										</div>
									</div>
								</div>

								{/* Status filter */}
								<div>
									<StatusSelect
										open={seletOpen}
										setOpen={setSelectOpen}
										selectedStatuses={selectedStatuses}
										setSelectedStatuses={setSelectedStatuses}
										statuses={statuses}
									/>
								</div>

								{/* ══ MANUAL ════════════════════════════════════ */}
								{distributionType === "normal" ? (
									<div className="space-y-4">
										{/* Pool indicator */}
										<div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border">
											<div className="flex items-center gap-2">
												<div className="w-2 h-2 rounded-full bg-primary  animate-pulse" />
												<span className="text-sm font-semibold text-foreground">
													{t("distribution.freeOrdersPool")}
												</span>
											</div>
											<div className="flex items-center gap-2">
												{freeOrdersLoading
													? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
													: <Pill className="bg-primary/12 text-primary    ">
														{freeOrders.length} orders
													</Pill>
												}
											</div>
										</div>

										{/* Blocks */}
										<AnimatePresence>
											{assignmentBlocks.map((block, idx) => {
												const available = freeOrders.filter(
													o => !assignmentBlocks.some(b => b.id !== block.id && b.orderIds.includes(o.id))
												);
												const allPicked = available.length > 0 && available.every(o => block.orderIds.includes(o.id));

												return (
													<motion.div
														key={block.id}
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, scale: 0.96 }}
														className="rounded-2xl border border-border !p-0 bg-card overflow-hidden shadow-sm"
													>
														{/* Block header strip */}
														<div className="flex items-center justify-between px-4 py-3
															border-b border-border bg-muted/40">
															<div className="flex items-center gap-2.5">
																<div className="w-6 h-6 rounded-lg flex items-center justify-center
																	bg-gradient-to-br from-primary to-[var(--third)]
																	 ">
																	<span className="text-[10px] font-black text-white">{idx + 1}</span>
																</div>
																<span className="text-sm font-bold text-foreground">
																	{t("distribution.employee")}
																</span>
																{block.orderIds.length > 0 && (
																	<Pill className="bg-primary/12 text-primary    ">
																		{block.orderIds.length} {t("distribution.ordersSelected")}
																	</Pill>
																)}
															</div>
															{assignmentBlocks.length > 1 && (
																<button onClick={() => removeBlock(block.id)}
																	className="w-7 h-7 rounded-lg flex items-center justify-center
																		text-muted-foreground hover:text-destructive
																		hover:bg-destructive/10 transition-colors">
																	<XCircle size={15} />
																</button>
															)}
														</div>

														<div className="p-4 space-y-3">
															{/* Employee selector */}
															<BlockEmployeePopover
																block={block}
																assignmentBlocks={assignmentBlocks}
																empItems={empItems}
																fetchEmployeePage={fetchEmployeePage}
																loadingEmployees={loadingEmployees}
																loadingMore={loadingMore}
																nextCursor={nextCursor}
																setBlockEmployee={setBlockEmployee}
															/>

															{/* Order list */}
															<div className="space-y-1.5">
																<div className="flex items-center justify-between">
																	<Label className="text-xs font-semibold">
																		{t("distribution.selectOrders")}
																		<span className="ms-1 text-muted-foreground font-normal">
																			({available.length} {t("distribution.available")})
																		</span>
																	</Label>
																	{available.length > 0 && (
																		<button
																			onClick={() => setBlockAllOrders(block.id, allPicked ? [] : available.map(o => o.id))}
																			className="text-xs font-semibold text-primary   hover:underline"
																		>
																			{allPicked ? t("distribution.deselectAll") : t("distribution.selectAll")}
																		</button>
																	)}
																</div>

																<div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-muted/30">
																	{selectedStatuses.length === 0 ? (
																		<div className="py-6 text-center text-muted-foreground text-xs">
																			{t("distribution.selectStatusFirst")}
																		</div>
																	) : freeOrdersLoading ? (
																		<div className="p-2 space-y-1.5">
																			{[...Array(4)].map((_, i) => (
																				<div key={i} className="flex items-center gap-2 p-2 rounded-lg animate-pulse">
																					<div className="w-4 h-4 rounded bg-muted" />
																					<div className="w-2 h-2 rounded-full bg-muted" />
																					<div className="h-3 bg-muted rounded w-20" />
																					<div className="ms-auto h-3 bg-muted rounded w-16" />
																				</div>
																			))}
																		</div>
																	) : available.length === 0 ? (
																		<div className="py-6 text-center text-muted-foreground text-xs">
																			{t("distribution.noFreeOrders")}
																		</div>
																	) : (
																		<div className="p-1.5 space-y-0.5">
																			{available.map(order => {
																				const checked = block.orderIds.includes(order.id);
																				const sc = statuses.find(s => (s.code || String(s.id)) === order.status?.code)?.color || "#888";
																				return (
																					<div
																						key={order.id}
																						onClick={() => toggleBlockOrder(block.id, order.id)}
																						className={cn(
																							"flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm",
																							checked
																								? "bg-primary/10 /15"
																								: "hover:bg-muted"
																						)}
																					>
																						<Checkbox
																							checked={checked}
																							onCheckedChange={() => toggleBlockOrder(block.id, order.id)}
																							className="data-[state=checked]:bg-primary data-[state=checked]:border-primary
																								 "
																						/>
																						<div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sc }} />
																						<span className="flex-1 truncate font-medium">{order.orderNumber}</span>
																						<span className="text-xs text-muted-foreground truncate max-w-[100px]">{order.customerName}</span>
																					</div>
																				);
																			})}
																		</div>
																	)}
																</div>
															</div>
														</div>
													</motion.div>
												);
											})}
										</AnimatePresence>

										{/* Add block */}
										<button
											onClick={addBlock}
											className="group w-full py-3 rounded-2xl border-2 border-dashed border-border
												hover:border-primary  
												hover:bg-primary/5  
												transition-all duration-200 flex items-center justify-center gap-2
												text-sm font-bold text-muted-foreground
												hover:text-primary  "
										>
											<Plus size={15} />
											{t("distribution.addEmployee")}
										</button>

										{/* Summary */}
										<AnimatePresence>
											{isNormalValid && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: "auto" }}
													exit={{ opacity: 0, height: 0 }}
													className="overflow-hidden"
												>
													<div className="p-4 rounded-2xl border border-primary/25  
														bg-gradient-to-br from-primary/8 to-[var(--third)]/5
														/12 /5">
														<div className="flex items-center gap-2 mb-3">
															<CheckCircle size={14} className="text-primary  " />
															<span className="text-xs font-extrabold uppercase tracking-wider text-primary  ">
																{t("distribution.summary")}
															</span>
														</div>
														<div className="space-y-1.5">
															{assignmentBlocks.filter(b => b.employee && b.orderIds.length > 0).map(b => (
																<div key={b.id} className="flex items-center justify-between text-sm">
																	<span className="font-semibold text-foreground">{b.employee.user.name}</span>
																	<Pill className="bg-primary/12 text-primary    ">
																		{b.orderIds.length} {t("distribution.orders")}
																	</Pill>
																</div>
															))}
															<div className="pt-2 mt-1 border-t border-primary/20   flex justify-between text-sm font-black">
																<span className="text-foreground">{t("distribution.totalOrders")}</span>
																<span className="text-primary  ">{totalAssigned}</span>
															</div>
														</div>
													</div>
												</motion.div>
											)}
										</AnimatePresence>
									</div>

								) : (
									/* ══ SMART ══════════════════════════════════ */
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											{/* Employee count */}
											<div className="space-y-1.5">
												<div className="flex items-center justify-between">
													<Label className="text-xs font-semibold">{t("distribution.employeeCount")}</Label>
													<Pill className="bg-muted text-muted-foreground">
														max {autoAssignResult?.maxEmployees || 0}
													</Pill>
												</div>
												<Input
													type="number" min="0"
													value={employeeCount}
													onChange={e => {
														const val = parseInt(e.target.value) || 0;
														const max = autoAssignResult?.maxEmployees || 0;
														setEmployeeCount(Math.min(max, Math.max(0, val)));
													}}
													className="rounded-xl h-10 text-sm"
												/>
											</div>
											{/* Order count */}
											<div className="space-y-1.5">
												<div className="flex items-center justify-between">
													<Label className="text-xs font-semibold">{t("distribution.orderCount")}</Label>
													<Pill className="bg-muted text-muted-foreground">
														max {autoAssignResult?.maxOrders || 0}
													</Pill>
												</div>
												<Input
													type="number" min="0"
													value={orderCount}
													onChange={e => {
														const val = parseInt(e.target.value) || 0;
														const max = autoAssignResult?.maxOrders || 0;
														setOrderCount(Math.min(max, Math.max(0, val)));
													}}
													className="rounded-xl h-10 text-sm"
												/>
											</div>
										</div>

										{/* Preview panel */}
										<div>
											<div className="flex items-center gap-2 mb-3">
												<Sparkles size={13} className="text-primary  " />
												<SectionLabel>{t("distribution.preview")}</SectionLabel>
											</div>

											<div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
												{autoEmployeesLoading ? (
													<div className="p-3 space-y-2">
														{[...Array(3)].map((_, i) => (
															<div key={i} className="flex items-center justify-between !p-3 rounded-xl bg-card animate-pulse">
																<div className="space-y-1.5">
																	<div className="h-3.5 w-28 bg-muted rounded" />
																	<div className="h-2.5 w-20 bg-muted rounded" />
																</div>
																<div className="h-5 w-10 bg-muted rounded-full" />
															</div>
														))}
													</div>
												) : !autoAssignResult?.assignments?.length ? (
													<div className="py-10 text-center">
														<Zap size={24} className="mx-auto mb-2 text-muted-foreground/40" />
														<p className="text-xs text-muted-foreground">
															{selectedStatuses.length === 0
																? t("distribution.selectStatusToSeePreview")
																: t("distribution.noOrdersAvailableForSelection")}
														</p>
													</div>
												) : (
													<div className="p-2 space-y-1">
														<p className="text-[10px] text-muted-foreground italic px-2 pt-1 mb-2">
															{t("distribution.showingActualDistribution", { count: orderCount })}
														</p>
														{autoAssignResult.assignments.map((assignment, idx) => (
															<motion.div
																key={idx}
																initial={{ opacity: 0, x: -8 }}
																animate={{ opacity: 1, x: 0 }}
																transition={{ delay: idx * 0.04 }}
																className="flex items-center justify-between !px-3 !py-2.5 rounded-xl
																	bg-card border border-transparent
																	hover:border-primary/20  /25
																	transition-colors"
															>
																<div className="flex items-center gap-2.5">
																	<div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white
																		bg-gradient-to-br from-primary to-[var(--third)]
																		 ">
																		{idx + 1}
																	</div>
																	<span className="text-sm font-semibold text-foreground">{assignment.name}</span>
																</div>
																<Pill className="bg-primary/12 text-primary    ">
																	+{assignment.orderNumbers.length}
																</Pill>
															</motion.div>
														))}
													</div>
												)}
											</div>
										</div>
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* ══ FOOTER ══════════════════════════════════════════════════ */}
				{distributionType && (
					<div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
						<Button
							variant="outline"
							onClick={() => setDistributionType(null)}
							className="rounded-xl h-10 px-5 text-sm font-semibold"
						>
							{t("common.back")}
						</Button>
						<Button
							onClick={handleDistribute}
							disabled={
								assigning ||
								(distributionType === "normal" && !isNormalValid) ||
								(distributionType === "smart" && !isSmartValid)
							}
							className="rounded-xl h-10 px-6 text-sm font-bold text-white
								bg-gradient-to-r from-primary to-[var(--third)]
								 
								shadow-[0_4px_16px_rgb(var(--primary-shadow,255_139_0/0.35))]
								hover:shadow-[0_6px_24px_rgb(var(--primary-shadow,255_139_0/0.5))]
								hover:brightness-110
								disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
								transition-all duration-200"
						>
							{assigning ? (
								<span className="flex items-center gap-2">
									<Loader2 size={14} className="animate-spin" />
									{t("messages.loading")}
								</span>
							) : (
								<span className="flex items-center gap-2">
									<Zap size={14} />
									{t("distribution.distribute")}
								</span>
							)}
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}









