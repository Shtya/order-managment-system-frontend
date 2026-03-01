"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	Filter,
	RefreshCw,
	Edit,
	Trash2,
	Plus,
	X,
	Search,
	Package,
	FileText,
	Save,
	Check,
	Crown,
	Zap,
	Star,
} from "lucide-react";

import DataTable from "@/components/atoms/DataTable";
import SwitcherTabs from "@/components/atoms/SwitcherTabs";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Button_ from "@/components/atoms/Button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

import api from "@/utils/api";
import toast from "react-hot-toast";

/** =========================
 * Tiny Spinner
 * ========================= */
function Spinner({ className = "w-4 h-4" }) {
	return <RefreshCw className={cn("animate-spin", className)} />;
}

/** =========================
 * Plan Card Skeleton
 * ========================= */
function PlanCardSkeleton() {
	return (
		<div className="rounded-xl p-6 border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 animate-pulse min-h-[500px]">
			<div className="flex justify-between">
				<div className="flex gap-2">
					<div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700" />
					<div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700" />
				</div>
				<div className="w-16 h-6 rounded-md bg-gray-200 dark:bg-slate-700" />
			</div>

			<div className="flex justify-center mt-8 mb-6">
				<div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-slate-700" />
			</div>

			<div className="space-y-3 text-center mb-8">
				<div className="h-10 w-32 mx-auto rounded-xl bg-gray-200 dark:bg-slate-700" />
				<div className="h-5 w-40 mx-auto rounded-xl bg-gray-200 dark:bg-slate-700" />
				<div className="h-4 w-24 mx-auto rounded-xl bg-gray-200 dark:bg-slate-700" />
			</div>

			<div className="space-y-3">
				<div className="h-4 w-20 rounded bg-gray-200 dark:bg-slate-700" />
				<div className="h-4 w-full rounded bg-gray-200 dark:bg-slate-700" />
				<div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-slate-700" />
				<div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-slate-700" />
				<div className="h-9 w-full rounded-xl bg-gray-200 dark:bg-slate-700 mt-4" />
			</div>
		</div>
	);
}

/** =========================
 * Custom Hook for API
 * ========================= */
export function useSubscriptionsApi() {
	const [loading, setLoading] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const [plans, setPlans] = useState([]);
	const [transactions, setTransactions] = useState([]);

	// ✅ Fetch Plans
	const fetchPlans = useCallback(async () => {
		setIsLoading(true);
		try {
			setLoading(true);
			const { data } = await api.get("/plans");

			const transformedPlans = (data || []).map((plan) => ({
				id: plan.id,
				name: plan.name,
				price: Number(plan.price),
				duration: plan.duration,
				description: plan.description || "",
				features: Array.isArray(plan.features) ? plan.features : [],
				color: plan.color || "from-blue-500 to-blue-600",
				isActive: plan.isActive !== false,
				isPopular: plan.isPopular || false,

				// ✅ NEW (limits)
				// You can adjust fallback keys if backend uses different names
				usersLimit: Number(plan.usersLimit ?? plan.maxUsers ?? 1),
				shippingCompaniesLimit: Number(plan.shippingCompaniesLimit ?? plan.maxShippingCompanies ?? 0),
				bulkUploadPerMonth: Number(plan.bulkUploadPerMonth ?? plan.maxShippingCompanies ?? 0),

				adminId: plan.adminId,
				createdAt: plan.createdAt,
				updatedAt: plan.updatedAt,
			}));

			setPlans(transformedPlans);
			return transformedPlans;
		} catch (error) {
			const message = error?.response?.data?.message || "فشل في تحميل الباقات";
			toast.error(message);
			throw error;
		} finally {
			setLoading(false);
			setTimeout(() => setIsLoading(false), 100);
		}
	}, []);

	// ✅ Fetch Transactions
	const fetchTransactions = useCallback(async () => {
		setIsLoading(true);
		try {
			setLoading(true);
			const { data } = await api.get("/transactions");
			setTransactions(data || []);
			return data;
		} catch (error) {
			const message = error?.response?.data?.message || "فشل في تحميل المعاملات";
			toast.error(message);
			throw error;
		} finally {
			setLoading(false);
			setTimeout(() => setIsLoading(false), 100);
		}
	}, []);

	// ✅ Create Plan
	const createPlan = useCallback(async (planData) => {
		try {
			setLoading(true);

			const payload = {
				name: planData.name,
				price: Number(planData.price),
				duration: planData.duration,
				description: planData.description || "",
				features: Array.isArray(planData.features) ? planData.features : [],
				color: planData.color || "from-blue-500 to-blue-600",
				isActive: true, // Always true
				isPopular: planData.isPopular || false,

				// ✅ NEW (limits) - sent to backend
				usersLimit: Number(planData.usersLimit ?? 1),
				shippingCompaniesLimit: Number(planData.shippingCompaniesLimit ?? 0),
				bulkUploadPerMonth: Number(planData.bulkUploadPerMonth ?? 0),
			};

			const { data } = await api.post("/plans", payload);
			toast.success("تم إنشاء الباقة بنجاح");

			return {
				...data,
				price: Number(data.price),
				features: Array.isArray(data.features) ? data.features : [],
				isPopular: data.isPopular || false,

				// ✅ NEW (limits) normalize return
				usersLimit: Number(data.usersLimit ?? data.maxUsers ?? payload.usersLimit ?? 1),
				shippingCompaniesLimit: Number(
					data.shippingCompaniesLimit ?? data.maxShippingCompanies ?? payload.shippingCompaniesLimit ?? 0
				),
				bulkUploadPerMonth: Number(
					data.bulkUploadPerMonth ?? data.maxShippingCompanies ?? payload.bulkUploadPerMonth ?? 0
				),
			};
		} catch (error) {
			const message = error?.response?.data?.message || "فشل في إنشاء الباقة";
			toast.error(message);
			throw error;
		} finally {
			setLoading(false);
		}
	}, []);

	// ✅ Update Plan
	const updatePlan = useCallback(async (id, planData) => {
		try {
			setLoading(true);

			const payload = {
				name: planData.name,
				price: Number(planData.price),
				duration: planData.duration,
				description: planData.description || "",
				features: Array.isArray(planData.features) ? planData.features : [],
				color: planData.color || "from-blue-500 to-blue-600",
				isActive: true, // Always true
				isPopular: planData.isPopular || false,

				// ✅ NEW (limits) - sent to backend
				usersLimit: Number(planData.usersLimit ?? 1),
				shippingCompaniesLimit: Number(planData.shippingCompaniesLimit ?? 0),
				bulkUploadPerMonth: Number(planData.bulkUploadPerMonth ?? 0),
			};

			const { data } = await api.patch(`/plans/${id}`, payload);
			toast.success("تم تحديث الباقة بنجاح");

			return {
				...data,
				price: Number(data.price),
				features: Array.isArray(data.features) ? data.features : [],
				isPopular: data.isPopular || false,

				// ✅ NEW (limits) normalize return
				usersLimit: Number(data.usersLimit ?? data.maxUsers ?? payload.usersLimit ?? 1),
				shippingCompaniesLimit: Number(
					data.shippingCompaniesLimit ?? data.maxShippingCompanies ?? payload.shippingCompaniesLimit ?? 0
				),

				bulkUploadPerMonth: Number(
					data.bulkUploadPerMonth ?? data.maxShippingCompanies ?? payload.bulkUploadPerMonth ?? 0
				),
			};
		} catch (error) {
			const message = error?.response?.data?.message || "فشل في تحديث الباقة";
			toast.error(message);
			throw error;
		} finally {
			setLoading(false);
		}
	}, []);

	// ✅ Delete Plan
	const deletePlan = useCallback(async (id) => {
		try {
			setLoading(true);
			await api.delete(`/plans/${id}`);
			toast.success("تم حذف الباقة بنجاح");
		} catch (error) {
			const message = error?.response?.data?.message || "فشل في حذف الباقة";
			if (String(message).includes("active transactions")) {
				toast.error("لا يمكن حذف باقة تحتوي على اشتراكات نشطة. قم بتعطيلها بدلاً من ذلك.");
			} else {
				toast.error(message);
			}
			throw error;
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		isLoading,
		loading,
		plans,
		transactions,
		fetchPlans,
		fetchTransactions,
		createPlan,
		updatePlan,
		deletePlan,
	};
}

/** =========================
 * Editable Plan Card Component
 * ========================= */
function EditablePlanCard({
	plan,
	onSave,
	onDelete,
	isEditing,
	onToggleEdit,
	isSaving,
	isBusyGlobal,
}) {
	const [formData, setFormData] = useState({
		name: plan.name || "",
		price: plan.price || "",
		duration: plan.duration || "monthly",
		description: plan.description || "",
		features: plan.features || [],
		color: plan.color || "from-blue-500 to-blue-600",
		isPopular: plan.isPopular || false,

		// ✅ NEW (limits)
		usersLimit: plan.usersLimit ?? 1,
		shippingCompaniesLimit: plan.shippingCompaniesLimit ?? 0,
		bulkUploadPerMonth: plan.bulkUploadPerMonth ?? 0,
	});

	const [newFeature, setNewFeature] = useState("");

	useEffect(() => {
		if (!isEditing) {
			setFormData({
				name: plan.name || "",
				price: plan.price || "",
				duration: plan.duration || "monthly",
				description: plan.description || "",
				features: plan.features || [],
				color: plan.color || "from-blue-500 to-blue-600",
				isPopular: plan.isPopular || false,

				// ✅ NEW (limits)
				usersLimit: plan.usersLimit ?? 1,
				shippingCompaniesLimit: plan.shippingCompaniesLimit ?? 0,
				bulkUploadPerMonth: plan.bulkUploadPerMonth ?? 0,
			});
		}
	}, [isEditing, plan]);

	const handleSave = () => {
		if (isSaving) return;
		onSave({
			...formData,
			price: Number(formData.price),
			usersLimit: Number(formData.usersLimit ?? 1),
			shippingCompaniesLimit: Number(formData.shippingCompaniesLimit ?? 0),
			bulkUploadPerMonth: Number(formData.bulkUploadPerMonth ?? 0),
		});
	};

	const handleAddFeature = () => {
		if (newFeature.trim()) {
			setFormData({
				...formData,
				features: [...(formData.features || []), newFeature.trim()],
			});
			setNewFeature("");
		}
	};

	const handleRemoveFeature = (index) => {
		setFormData({
			...formData,
			features: (formData.features || []).filter((_, i) => i !== index),
		});
	};

	const handleUpdateFeature = (index, value) => {
		const updated = [...(formData.features || [])];
		updated[index] = value;
		setFormData({ ...formData, features: updated });
	};

	const colorOptions = [
		{ value: "from-blue-500 to-blue-600", label: "أزرق", preview: "bg-gradient-to-r from-blue-500 to-blue-600" },
		{ value: "from-purple-500 to-purple-600", label: "بنفسجي", preview: "bg-gradient-to-r from-purple-500 to-purple-600" },
		{ value: "from-orange-500 to-orange-600", label: "برتقالي", preview: "bg-gradient-to-r from-orange-500 to-orange-600" },
		{ value: "from-green-500 to-green-600", label: "أخضر", preview: "bg-gradient-to-r from-green-500 to-green-600" },
		{ value: "from-pink-500 to-pink-600", label: "وردي", preview: "bg-gradient-to-r from-pink-500 to-pink-600" },
		{ value: "from-cyan-500 to-cyan-600", label: "سماوي", preview: "bg-gradient-to-r from-cyan-500 to-cyan-600" },
	];

	const getIcon = () => {
		if ((formData.color || "").includes("purple")) return <Crown size={32} className="text-white" />;
		if ((formData.color || "").includes("orange")) return <Zap size={32} className="text-white" />;
		if ((formData.color || "").includes("green")) return <Star size={32} className="text-white" />;
		return <Package size={32} className="text-white" />;
	};

	const userOptions = [1, 2, 3, 5, 10, 15, 20, 30, 50, 100, 200];
	const shippingOptions = [0, 1, 2, 3, 5, 10, 15, 20, 30, 50];

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className={cn(
				"relative rounded-xl p-6 border-2 transition-all duration-300",
				"bg-gradient-to-br from-white via-gray-50/50 to-white",
				"dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900",
				isEditing
					? "border-primary shadow-2xl shadow-primary/20 ring-2 ring-primary/30"
					: "border-gray-200 dark:border-slate-700 hover:border-primary/40 hover:shadow-xl"
			)}
		>
			{/* Actions Header */}
			<div className="absolute top-4 left-4 flex items-center gap-2 z-10">
				{isEditing ? (
					<>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: isSaving ? 1 : 1.1 }}
										whileTap={{ scale: isSaving ? 1 : 0.95 }}
										onClick={handleSave}
										disabled={isSaving}
										className={cn(
											"w-9 h-9 rounded-full text-white transition-all flex items-center justify-center shadow-lg",
											isSaving ? "bg-green-600/70 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
										)}
									>
										{isSaving ? <Spinner className="w-4 h-4 text-white" /> : <Save size={16} />}
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>{isSaving ? "جاري الحفظ..." : "حفظ"}</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: isSaving ? 1 : 1.1 }}
										whileTap={{ scale: isSaving ? 1 : 0.95 }}
										onClick={() => onToggleEdit(null)}
										disabled={isSaving}
										className={cn(
											"w-9 h-9 rounded-full text-white transition-all flex items-center justify-center shadow-lg",
											isSaving ? "bg-gray-500/70 cursor-not-allowed" : "bg-gray-500 hover:bg-gray-600"
										)}
									>
										<X size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>إلغاء</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</>
				) : (
					<>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => onToggleEdit(plan.id)}
										disabled={isBusyGlobal}
										className={cn(
											"w-9 h-9 rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center dark:bg-purple-950/30 dark:hover:bg-purple-600",
											isBusyGlobal && "opacity-60 cursor-not-allowed"
										)}
									>
										<Edit size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>تعديل</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => onDelete(plan)}
										disabled={isBusyGlobal}
										className={cn(
											"w-9 h-9 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center dark:bg-red-950/30 dark:hover:bg-red-600",
											isBusyGlobal && "opacity-60 cursor-not-allowed"
										)}
									>
										<Trash2 size={16} />
									</motion.button>
								</TooltipTrigger>
								<TooltipContent>حذف</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</>
				)}
			</div>

			{/* Status Badges & Popular Toggle */}
			<div className="absolute top-4 right-4 z-10">
				{isEditing ? (
					<div className="flex flex-col items-end gap-2">
						{/* Popular Toggle */}
						<div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-slate-700">
							<span className="text-xs text-gray-600 dark:text-slate-400">
								{formData.isPopular ? "شائعة" : "عادية"}
							</span>
							<Switch
								checked={formData.isPopular}
								onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
								disabled={isSaving}
							/>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-end gap-2">
						<Badge className="bg-[#F0FDF4] text-[#22C55E] hover:bg-[#F0FDF4] dark:bg-green-950/30 dark:text-green-300 rounded-md">
							نشطة
						</Badge>

						{plan.isPopular && (
							<Badge className="bg-gradient-to-r from-primary via-primary/90 to-primary text-white rounded-md">
								شائعة
							</Badge>
						)}
					</div>
				)}
			</div>

			{/* Plan Icon */}
			<div className="flex justify-center mb-4 mt-8">
				{isEditing ? (
					<div className="space-y-2">
						<div
							className={cn(
								"w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg mx-auto",
								formData.color
							)}
						>
							{getIcon()}
						</div>
						<Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
							<SelectTrigger className="rounded-xl !w-full !h-9 text-xs" disabled={isSaving}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{colorOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<div className="flex items-center gap-2">
											<div className={cn("w-4 h-4 rounded-full", option.preview)} />
											{option.label}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				) : (
					<div
						className={cn(
							"w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
							plan.color || "from-blue-500 to-blue-600"
						)}
					>
						{getIcon()}
					</div>
				)}
			</div>

			{/* Price & Name */}
			<div className="text-center mb-6">
				{isEditing ? (
					<div className="space-y-3">
						<div className="flex items-center justify-center gap-2">
							<Input
								type="number"
								value={formData.price}
								onChange={(e) => setFormData({ ...formData, price: e.target.value })}
								className="w-24 h-12 text-center text-3xl font-black rounded-xl"
								placeholder="50"
								disabled={isSaving}
							/>
							<span className="text-2xl text-gray-500 dark:text-slate-400">ج.م</span>
						</div>

						<Input
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							className="text-center font-bold text-lg rounded-xl"
							placeholder="اسم الباقة"
							disabled={isSaving}
						/>

						<Select value={formData.duration} onValueChange={(v) => setFormData({ ...formData, duration: v })}>
							<SelectTrigger className="rounded-xl !w-full !h-9" disabled={isSaving}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="monthly">شهرياً</SelectItem>
								<SelectItem value="yearly">سنوياً</SelectItem>
								<SelectItem value="lifetime">مدى الحياة</SelectItem>
							</SelectContent>
						</Select>

						<Textarea
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							className="rounded-xl text-sm "
							placeholder="وصف الباقة..."
							rows={2}
							disabled={isSaving}
						/>
					</div>
				) : (
					<>
						<div className="flex items-baseline justify-center gap-2">
							<span className="text-5xl font-black text-gray-900 dark:text-white">{plan.price}</span>
							<span className="text-2xl text-gray-500 dark:text-slate-400">ج.م</span>
						</div>
						<p className="text-lg font-bold text-gray-700 dark:text-slate-300 mt-2">{plan.name}</p>
						<p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
							{plan.duration === "monthly" ? "شهرياً" : plan.duration === "yearly" ? "سنوياً" : "مدى الحياة"}
						</p>
						{!!plan.description && <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{plan.description}</p>}
					</>
				)}
			</div>

			{/* Features */}
			<div className="space-y-3 mb-6">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold text-gray-500 dark:text-slate-400">الميزات:</span>
					{isEditing && <span className="text-xs text-gray-400">{(formData.features || []).length} ميزة</span>}
				</div>

				{isEditing ? (
					<div className="space-y-3">
						{/* ✅ NEW: Limits dropdowns */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label className="text-xs text-gray-500 dark:text-slate-400">عدد المستخدمين المسموح</Label>
								<Select
									value={String(formData.usersLimit ?? 1)}
									onValueChange={(v) => setFormData({ ...formData, usersLimit: Number(v) })}
									disabled={isSaving}
								>
									<SelectTrigger className="rounded-xl !w-full !h-9 text-sm">
										<SelectValue placeholder="اختر العدد" />
									</SelectTrigger>
									<SelectContent>
										{userOptions.map((n) => (
											<SelectItem key={n} value={String(n)}>
												{n}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1">
								<Label className="text-xs text-gray-500 dark:text-slate-400">عدد شركات الشحن المسموح</Label>
								<Select
									value={String(formData.shippingCompaniesLimit ?? 0)}
									onValueChange={(v) => setFormData({ ...formData, shippingCompaniesLimit: Number(v) })}
									disabled={isSaving}
								>
									<SelectTrigger className="rounded-xl !w-full !h-9 text-sm">
										<SelectValue placeholder="اختر العدد" />
									</SelectTrigger>
									<SelectContent>
										{shippingOptions.map((n) => (
											<SelectItem key={n} value={String(n)}>
												{n}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-1">
							<Label className="text-xs text-gray-500 dark:text-slate-400">عدد الطلبات المسموح رفعها في الشهر</Label>
							<Input
								value={String(formData.bulkUploadPerMonth ?? 0)}
								onChange={(e) => handleUpdateFeature(index, e.target.value)}
								onValueChange={(v) => setFormData({ ...formData, bulkUploadPerMonth: Number(e.target.value || 0) })}
								className="flex-1 h-9 text-sm rounded-xl"
								disabled={isSaving}
							/>
						</div>

						{/* Existing features editor */}
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{(formData.features || []).map((feature, index) => (
								<div key={index} className="flex items-center gap-2 group">
									<Input
										value={feature}
										onChange={(e) => handleUpdateFeature(index, e.target.value)}
										className="flex-1 h-9 text-sm rounded-xl"
										disabled={isSaving}
									/>
									<button
										onClick={() => handleRemoveFeature(index)}
										disabled={isSaving}
										className={cn(
											"w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center ",
											isSaving && "opacity-50 cursor-not-allowed"
										)}
									>
										<X size={14} />
									</button>
								</div>
							))}

							<div className="flex items-center gap-2">
								<Input
									value={newFeature}
									onChange={(e) => setNewFeature(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
									placeholder="إضافة ميزة جديدة..."
									className="flex-1 h-9 text-sm rounded-xl"
									disabled={isSaving}
								/>
								<button
									onClick={handleAddFeature}
									disabled={isSaving}
									className={cn(
										"w-8 h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center",
										isSaving && "opacity-60 cursor-not-allowed"
									)}
								>
									<Plus size={14} />
								</button>
							</div>
						</div>
					</div>
				) : (
					<>
						{/* ✅ NEW: show limits in view mode */}
						<div className="space-y-2 mb-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-500 dark:text-slate-400">المستخدمين</span>
								<span className="font-semibold text-gray-800 dark:text-slate-200">{plan.usersLimit ?? 1}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-500 dark:text-slate-400">شركات الشحن</span>
								<span className="font-semibold text-gray-800 dark:text-slate-200">{plan.shippingCompaniesLimit ?? 0}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-500 dark:text-slate-400">عدد الطلبات المسموح رفعها في الشهر</span>
								<span className="font-semibold text-gray-800 dark:text-slate-200">{plan.bulkUploadPerMonth ?? 0}</span>
							</div>
						</div>

						{(plan.features || []).map((feature, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
								className="flex items-start gap-3"
							>
								<div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
									<Check size={12} className="text-primary" />
								</div>
								<span className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{feature}</span>
							</motion.div>
						))}
					</>
				)}
			</div>
		</motion.div>
	);
}

/** =========================
 * New Plan Card
 * ========================= */
function NewPlanCard({ onClick, isCreating }) {
	return (
		<motion.button
			whileHover={{ scale: isCreating ? 1 : 1.02 }}
			whileTap={{ scale: isCreating ? 1 : 0.98 }}
			onClick={onClick}
			disabled={isCreating}
			className={cn(
				"relative rounded-xl p-6 border-2 border-dashed transition-all duration-300 h-full min-h-[500px]",
				"border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary",
				"dark:border-primary/30 dark:bg-primary/5 dark:hover:bg-primary/10",
				"flex flex-col items-center justify-center gap-4",
				isCreating && "opacity-80 cursor-not-allowed"
			)}
		>
			<div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
				{isCreating ? <Spinner className="w-10 h-10 text-white" /> : <Plus size={40} className="text-white" />}
			</div>
			<div className="text-center">
				<p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
					{isCreating ? "جاري إنشاء باقة..." : "إضافة باقة جديدة"}
				</p>
				<p className="text-sm text-gray-500 dark:text-slate-400">
					{isCreating ? "يرجى الانتظار" : "انقر لإنشاء باقة اشتراك جديدة"}
				</p>
			</div>

			{isCreating && <div className="absolute inset-0 rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-[1px]" />}
		</motion.button>
	);
}



/** =========================
 * Transaction Details Dialog
 * ========================= */
function TransactionDetailsDialog({ open, onClose, transaction }) {
	if (!transaction) return null;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="!max-w-2xl">
				<DialogHeader>
					<DialogTitle>تفاصيل المعاملة</DialogTitle>
					<DialogDescription>معلومات كاملة عن المعاملة #{transaction.id}</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-2">
							<Label className="text-xs text-gray-500 dark:text-slate-400">رقم المعاملة</Label>
							<p className="font-bold text-gray-900 dark:text-slate-100">{transaction.id}</p>
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-gray-500 dark:text-slate-400">اسم العميل</Label>
							<p className="font-bold text-gray-900 dark:text-slate-100">{transaction.userName || "غير متوفر"}</p>
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-gray-500 dark:text-slate-400">اسم الباقة</Label>
							<p className="font-bold text-gray-900 dark:text-slate-100">{transaction.planName}</p>
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-gray-500 dark:text-slate-400">المبلغ</Label>
							<p className="font-bold text-green-600 dark:text-green-400 text-lg">{transaction.amount} ج.م</p>
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-gray-500 dark:text-slate-400">تاريخ الاشتراك</Label>
							<p className="font-bold text-gray-900 dark:text-slate-100">{transaction.date}</p>
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-gray-500 dark:text-slate-400">الحالة</Label>
							<Badge className="rounded-md">{transaction.status}</Badge>
						</div>
					</div>

					<div className="flex justify-end pt-4">
						<Button onClick={onClose} className="bg-primary text-white rounded-xl px-6">
							إغلاق
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

/** =========================
 * Main Page Component
 * ========================= */
export default function AdminSubscriptionsPage() {
	const [activeTab, setActiveTab] = useState("plans");
	const [search, setSearch] = useState("");

	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	const [deletePlanOpen, setDeletePlanOpen] = useState(false);
	const [planToDelete, setPlanToDelete] = useState(null);
	const [editingPlanId, setEditingPlanId] = useState(null);

	const [detailsOpen, setDetailsOpen] = useState(false);
	const [selectedTransaction, setSelectedTransaction] = useState(null);

	// ✅ Local loaders
	const [creatingPlan, setCreatingPlan] = useState(false);
	const [savingPlanId, setSavingPlanId] = useState(null);
	const [deletingPlanId, setDeletingPlanId] = useState(null);

	const {
		isLoading,
		plans,
		transactions,
		loading,
		fetchPlans,
		fetchTransactions,
		createPlan,
		updatePlan,
		deletePlan,
	} = useSubscriptionsApi();

	useEffect(() => {
		if (activeTab === "plans") fetchPlans();
		else fetchTransactions();
	}, [activeTab, fetchPlans, fetchTransactions]);

	const tabs = useMemo(
		() => [
			{ id: "plans", label: "إدارة الباقات" },
			{ id: "transactions", label: "جميع المعاملات" },
		],
		[]
	);

	const filteredPlans = useMemo(() => {
		const s = search.trim().toLowerCase();
		return plans.filter((plan) => {
			if (s) {
				const name = (plan.name || "").toLowerCase();
				const desc = (plan.description || "").toLowerCase();
				if (!name.includes(s) && !desc.includes(s)) return false;
			}
			return true;
		});
	}, [plans, search]);

	const filteredTransactions = useMemo(() => {
		const s = search.trim().toLowerCase();
		return transactions.filter((t) => {
			if (!s) return true;
			const id = String(t.id || "");
			const plan = (t.planName || "").toLowerCase();
			const user = (t.userName || "").toLowerCase();
			return id.includes(s) || plan.includes(s) || user.includes(s);
		});
	}, [transactions, search]);

	const paginatedTransactions = useMemo(() => {
		const start = (currentPage - 1) * perPage;
		const end = start + perPage;
		return filteredTransactions.slice(start, end);
	}, [filteredTransactions, currentPage, perPage]);

	const handleCreatePlan = async () => {
		if (creatingPlan) return;
		const today = new Date();

		const newPlan = {
			name: `باقة جديدة ${today.getTime()}`,
			price: 50,
			duration: "monthly",
			description: "",
			features: ["ميزة 1", "ميزة 2", "ميزة 3"],
			isActive: true,
			color: "from-blue-500 to-blue-600",

			// ✅ NEW defaults (limits)
			usersLimit: 1,
			shippingCompaniesLimit: 0,
			bulkUploadPerMonth: 0,
		};

		try {
			setCreatingPlan(true);
			const created = await createPlan(newPlan);
			await fetchPlans();
			setTimeout(() => setEditingPlanId(created.id), 300);
		} catch (e) {
			console.error(e);
		} finally {
			setCreatingPlan(false);
		}
	};

	const handleSavePlan = async (plan, data) => {
		if (savingPlanId === plan.id) return;
		try {
			setSavingPlanId(plan.id);
			await updatePlan(plan.id, data);
			setEditingPlanId(null);
			await fetchPlans();
		} catch (e) {
			console.error(e);
		} finally {
			setSavingPlanId(null);
		}
	};

	const handleDeleteClick = (plan) => {
		setPlanToDelete(plan);
		setDeletePlanOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!planToDelete) return;
		if (deletingPlanId === planToDelete.id) return;

		try {
			setDeletingPlanId(planToDelete.id);
			await deletePlan(planToDelete.id);
			setDeletePlanOpen(false);
			setPlanToDelete(null);
			await fetchPlans();
		} catch (e) {
			console.error(e);
		} finally {
			setDeletingPlanId(null);
		}
	};


	const isAnyPlanBusy = creatingPlan || savingPlanId !== null || deletingPlanId !== null;

	return (
		<div className="min-h-screen p-6">
			{/* Header */}
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">الرئيسية</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">إدارة الاشتراكات</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
					</div>
				</div>

				<div className="mt-4">
					<SwitcherTabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
				</div>
			</div>

			{/* Content */}
			<div className="bg-card !p-4 rounded-sm">

				<div className="mt-4">
					{activeTab === "plans" ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
							{/* ✅ Skeleton until plans loaded */}
							{isLoading && plans.length === 0 ? (
								<>
									{Array.from({ length: 3 }).map((_, i) => (
										<PlanCardSkeleton key={i} />
									))}
								</>
							) : (
								<AnimatePresence mode="popLayout">
									{filteredPlans.map((plan) => (
										<EditablePlanCard
											key={plan.id}
											plan={plan}
											isEditing={editingPlanId === plan.id}
											onToggleEdit={setEditingPlanId}
											onSave={(data) => handleSavePlan(plan, data)}
											onDelete={handleDeleteClick}
											isSaving={savingPlanId === plan.id}
											isBusyGlobal={isAnyPlanBusy}
										/>
									))}
									<NewPlanCard onClick={handleCreatePlan} isCreating={creatingPlan} />
								</AnimatePresence>
							)}
						</div>
					) : (
						<DataTable
							columns={[]}
							data={paginatedTransactions}
							isLoading={isLoading}
							hoverable
							striped
							pagination={{
								total_records: filteredTransactions.length,
								current_page: currentPage,
								per_page: perPage,
							}}
							onPageChange={({ page, per_page }) => {
								setCurrentPage(page);
								setPerPage(per_page);
							}}
							emptyState="لا توجد معاملات"
						/>
					)}
				</div>
			</div>

			{/* Details Dialog */}
			<TransactionDetailsDialog
				open={detailsOpen}
				onClose={() => setDetailsOpen(false)}
				transaction={selectedTransaction}
			/>

			{/* Delete Dialog */}
			<AlertDialog
				open={deletePlanOpen}
				onOpenChange={(open) => {
					if (deletingPlanId) return;
					setDeletePlanOpen(open);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>حذف الباقة</AlertDialogTitle>
						<AlertDialogDescription>
							{planToDelete ? `${planToDelete.name} - #${planToDelete.id}` : ""}
							<div className="mt-2 text-sm">هل أنت متأكد من حذف هذه الباقة؟ لا يمكن التراجع.</div>
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel disabled={!!deletingPlanId}>إلغاء</AlertDialogCancel>

						<AlertDialogAction
							onClick={handleConfirmDelete}
							className={cn("bg-red-600 hover:bg-red-700", deletingPlanId && "opacity-80 cursor-not-allowed")}
							disabled={!!deletingPlanId}
						>
							{deletingPlanId ? (
								<span className="inline-flex items-center gap-2">
									<Spinner className="w-4 h-4 text-white" />
									جاري الحذف...
								</span>
							) : (
								"حذف"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
