"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Button_ from "@/components/atoms/Button";
import { useRouter } from "@/i18n/navigation";

import { useLocale, useTranslations } from "next-intl";
import api from "@/utils/api";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";

// Validation schema
const schema = yup.object({
	returnNumber: yup.string().required("Return number is required"),
	supplierId: yup.string().optional(),
	supplierNameSnapshot: yup.string().optional(),
	supplierCodeSnapshot: yup.string().optional(),
	invoiceNumber: yup.string().optional(),
	returnReason: yup.string().optional(),
	safeId: yup.string().optional(),
	returnType: yup.string().required("Return type is required"),
	notes: yup.string().optional(),
	items: yup
		.array()
		.of(
			yup.object({
				variantId: yup.number().required(),
				returnedQuantity: yup.number().min(1).required(),
				unitCost: yup.number().min(0).required(),
				taxInclusive: yup.boolean().optional(),
				taxRate: yup.number().min(0).max(100).optional(),
			})
		)
		.min(1, "At least one item is required"),
});

export default function CreateReturnInvoicePage() {
	const navigate = useRouter();
	const locale = useLocale();
	const isRTL = locale === "ar";
	const t = useTranslations("returnInvoice");

	const [suppliers, setSuppliers] = useState([]);
	const [loading, setLoading] = useState(false);

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			returnNumber: "",
			supplierId: "",
			supplierNameSnapshot: "",
			supplierCodeSnapshot: "",
			invoiceNumber: "",
			returnReason: "",
			safeId: "",
			returnType: "cash_refund",
			notes: "",
			items: [],
		},
	});

	const watchedItems = watch("items");
	const watchedSupplier = watch("supplierId");

	// Fetch suppliers
	useEffect(() => {
		(async () => {
			try {
				const res = await api.get("/lookups/suppliers", { params: { limit: 200 } });
				setSuppliers(res.data);
			} catch (e) {
				console.error(e);
				toast.error("Failed to load suppliers");
			}
		})();
	}, []);

	// Update supplier snapshots when supplier changes
	useEffect(() => {
		if (watchedSupplier) {
			const supplier = suppliers.find((s) => String(s.id) === watchedSupplier);
			if (supplier) {
				setValue("supplierNameSnapshot", supplier.name);
				setValue("supplierCodeSnapshot", supplier.code || "");
			}
		}
	}, [watchedSupplier, suppliers, setValue]);

	const handleDeleteProduct = (index) => {
		const newItems = watchedItems.filter((_, i) => i !== index);
		setValue("items", newItems);
	};

	const handleSelectSku = (product, sku) => {
		const newItem = {
			variantId: sku.id,
			productName: product.name,
			sku: sku.sku || sku.key,
			attributes: sku.attributes || {},
			returnedQuantity: 1,
			unitCost: 0,
			taxInclusive: false,
			taxRate: 5,
		};

		setValue("items", [...watchedItems, newItem]);
	};

	const handleProductFieldChange = (index, field, value) => {
		const newItems = [...watchedItems];
		newItems[index] = { ...newItems[index], [field]: value };
		setValue("items", newItems);
	};

	const onSubmit = async (data) => {
		setLoading(true);
		try {
			const payload = {
				returnNumber: data.returnNumber,
				supplierId: data.supplierId ? Number(data.supplierId) : undefined,
				supplierNameSnapshot: data.supplierNameSnapshot || undefined,
				supplierCodeSnapshot: data.supplierCodeSnapshot || undefined,
				invoiceNumber: data.invoiceNumber || undefined,
				returnReason: data.returnReason || undefined,
				safeId: data.safeId ? Number(data.safeId) : undefined,
				returnType: data.returnType,
				notes: data.notes || undefined,
				items: data.items.map((item) => ({
					variantId: item.variantId,
					returnedQuantity: Number(item.returnedQuantity),
					unitCost: Number(item.unitCost),
					taxInclusive: Boolean(item.taxInclusive),
					taxRate: Number(item.taxRate || 5),
				})),
			};

			await api.post("/purchases-return", payload);
			toast.success("Return invoice created successfully");
			navigate.push("/purchases-return");
		} catch (error) {
			console.error("Failed to create return:", error);
			toast.error(error.response?.data?.message || "Failed to create return invoice");
		} finally {
			setLoading(false);
		}
	};

	// Calculate summary
	const summary = {
		productCount: watchedItems.length,
		subtotal: watchedItems.reduce((sum, item) => {
			const cost = parseFloat(item.unitCost) || 0;
			const qty = parseFloat(item.returnedQuantity) || 0;
			return sum + cost * qty;
		}, 0),
		taxTotal: watchedItems.reduce((sum, item) => {
			if (item.taxInclusive) {
				const cost = parseFloat(item.unitCost) || 0;
				const qty = parseFloat(item.returnedQuantity) || 0;
				const taxRate = parseFloat(item.taxRate) || 0;
				return sum + (cost * qty * taxRate) / 100;
			}
			return sum;
		}, 0),
	};

	const totalReturn = summary.subtotal + summary.taxTotal;

	return (
		<motion.div
			dir={isRTL ? "rtl" : "ltr"}
			initial={{ opacity: 0, y: 20, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
			className="min-h-screen p-6"
		>
			{/* Header */}
			<div className="bg-card mb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<button
							onClick={() => navigate.push("/purchases-return")}
							className="text-gray-400 hover:text-primary transition-colors"
						>
							{t("breadcrumb.returns")}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.createReturnInvoice")}</span>
						<span className="mr-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
					</div>

					<div className="flex items-center gap-4">
						<Button_ size="sm" label={t("actions.howToUse")} tone="white" variant="solid" />

						<Button_
							onClick={handleSubmit(onSubmit)}
							size="sm"
							label={t("actions.save")}
							tone="purple"
							variant="solid"
							disabled={loading}
						/>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="flex gap-6">
					{/* Left Column - Return Information */}
					<div className="w-full max-w-[400px] space-y-6">
						<motion.div
							className="bg-card"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.returnInfo")}
							</h3>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.returnNumber")} *
									</Label>
									<Controller
										name="returnNumber"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.returnNumber")}
												className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.returnNumber && (
										<p className="text-xs text-red-500">{errors.returnNumber.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.supplierName")}
									</Label>
									<Controller
										name="supplierId"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue placeholder={t("placeholders.supplierName")} />
												</SelectTrigger>
												<SelectContent>
													{suppliers.map((s) => (
														<SelectItem key={s.id} value={String(s.id)}>
															{s.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.invoiceNumber")}
									</Label>
									<Controller
										name="invoiceNumber"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.invoiceNumber")}
												className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.returnReason")}
									</Label>
									<Controller
										name="returnReason"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.returnReason")}
												className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.returnType")} *
									</Label>
									<Controller
										name="returnType"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-card-select">
													<SelectItem value="cash_refund">
														{t("options.returnType.cashRefund")}
													</SelectItem>
													<SelectItem value="bank_transfer">
														{t("options.returnType.bankTransfer")}
													</SelectItem>
													<SelectItem value="supplier_deduction">
														{t("options.returnType.supplierDeduction")}
													</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
									{errors.returnType && (
										<p className="text-xs text-red-500">{errors.returnType.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.safe")}
									</Label>
									<Controller
										name="safeId"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue placeholder={t("placeholders.safe")} />
												</SelectTrigger>
												<SelectContent className="bg-card-select">
													<SelectItem value="1">{t("options.safe.cash")}</SelectItem>
													<SelectItem value="2">{t("options.safe.safe1")}</SelectItem>
													<SelectItem value="3">{t("options.safe.safe2")}</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
								</div>
							</div>
						</motion.div>
					</div>

					{/* Middle Column - Products */}
					<div className="flex-1 space-y-6">
						<motion.div
							className="bg-card"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.25 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.addProducts")}
							</h3>

							<ProductSkuSearchPopover handleSelectSku={handleSelectSku} />
							{errors.items && <p className="text-xs text-red-500 mt-2">{errors.items.message}</p>}
						</motion.div>

						<motion.div
							className="bg-card"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.productsTable")}
							</h3>

							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-200 dark:border-slate-700">
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.sku")}
											</th>
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.name")}
											</th>
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.returnedQuantity")}
											</th>
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.unitCost")}
											</th>
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.taxInclusive")}
											</th>
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.taxRate")}
											</th>
											<th className="text-center p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.actions")}
											</th>
										</tr>
									</thead>
									<tbody>
										{watchedItems.map((product, index) => (
											<tr
												key={index}
												className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
											>
												<td className="p-3 text-sm text-gray-600 dark:text-slate-300">
													{product.sku}
												</td>
												<td className="p-3 text-sm font-semibold text-gray-700 dark:text-slate-200">
													{product.productName}
													{Object.keys(product.attributes || {}).length > 0 && (
														<div className="text-xs text-gray-500 font-normal mt-1">
															{Object.entries(product.attributes).map(([key, value]) => (
																<span key={key} className="mr-2">
																	{key}: {value}
																</span>
															))}
														</div>
													)}
												</td>
												<td className="p-3">
													<Input
														type="number"
														value={product.returnedQuantity}
														onChange={(e) =>
															handleProductFieldChange(index, "returnedQuantity", e.target.value)
														}
														className="h-8 w-20"
													/>
												</td>
												<td className="p-3">
													<Input
														type="number"
														value={product.unitCost}
														onChange={(e) =>
															handleProductFieldChange(index, "unitCost", e.target.value)
														}
														className="h-8 w-24"
													/>
												</td>
												<td className="p-3">
													<Select
														value={product.taxInclusive ? "yes" : "no"}
														onValueChange={(v) =>
															handleProductFieldChange(index, "taxInclusive", v === "yes")
														}
													>
														<SelectTrigger className="h-8 w-20">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="yes">{t("yes")}</SelectItem>
															<SelectItem value="no">{t("no")}</SelectItem>
														</SelectContent>
													</Select>
												</td>
												<td className="p-3">
													<Input
														type="number"
														value={product.taxRate}
														onChange={(e) =>
															handleProductFieldChange(index, "taxRate", e.target.value)
														}
														className="h-8 w-16"
													/>
												</td>
												<td className="p-3 text-center">
													<motion.button
														type="button"
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
														onClick={() => handleDeleteProduct(index)}
														className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
													>
														<Trash2 size={16} />
													</motion.button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</motion.div>

						<motion.div
							className="bg-card"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.35 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.notes")}
							</h3>
							<Controller
								name="notes"
								control={control}
								render={({ field }) => (
									<Textarea
										{...field}
										placeholder={t("placeholders.notes")}
										className="min-h-[100px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-xl"
									/>
								)}
							/>
						</motion.div>
					</div>

					{/* Right Column - Summary */}
					<div className="w-full max-w-[350px]">
						<ReturnSummary t={t} summary={summary} totalReturn={totalReturn} control={control} />
					</div>
				</div>
			</form>
		</motion.div>
	);
}

function ReturnSummary({ summary, t, totalReturn, control }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.2 }}
			className="bg-card sticky top-6"
		>
			<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
				{t("sections.summaryTitle")}
			</h3>

			<div className="space-y-4">
				<div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.productCount")}</span>
					<span className="text-lg font-bold text-blue-600 dark:text-blue-400">
						{summary.productCount}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.subtotal")}</span>
					<span className="text-base font-semibold text-gray-700 dark:text-slate-200">
						{summary.subtotal.toFixed(2)} {t("currency")}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.taxTotal")}</span>
					<span className="text-base font-semibold text-gray-700 dark:text-slate-200">
						{summary.taxTotal.toFixed(2)} {t("currency")}
					</span>
				</div>

				<div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/50">
					<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
						{t("summary.totalReturn")}
					</span>
					<span className="text-xl font-bold text-purple-600 dark:text-purple-400">
						{totalReturn.toFixed(2)} {t("currency")}
					</span>
				</div>
			</div>
		</motion.div>
	);
}