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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Button_ from "@/components/atoms/Button";
import { useRouter } from "@/i18n/navigation";

import { useLocale, useTranslations } from "next-intl";
import api from "@/utils/api";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";

const schema = yup.object({
	invoiceNumber: yup.string().required("Invoice number is required"),
	customerName: yup.string().required("Customer name is required"),
	phone: yup.string().optional(),
	paymentMethod: yup.string().optional(),
	paymentStatus: yup.string().optional(),
	safeId: yup.string().optional(),
	notes: yup.string().optional(),
	shippingCost: yup.number().min(0).optional(),
	paidAmount: yup.number().min(0).optional(),
	items: yup
		.array()
		.of(
			yup.object({
				variantId: yup.number().required(),
				quantity: yup.number().min(1).required(),
				unitPrice: yup.number().min(0).required(),
				discount: yup.number().min(0).optional(),
				taxInclusive: yup.boolean().optional(),
				taxRate: yup.number().min(0).max(100).optional(),
			})
		)
		.min(1, "At least one item is required"),
});

export default function CreateSalesInvoicePage() {
	const navigate = useRouter();
	const locale = useLocale();
	const isRTL = locale === "ar";
	const t = useTranslations("salesInvoice");

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
			invoiceNumber: "",
			customerName: "",
			phone: "",
			paymentMethod: "",
			paymentStatus: "",
			safeId: "",
			notes: "",
			shippingCost: 0,
			paidAmount: 0,
			items: [],
		},
	});

	const watchedItems = watch("items");
	const watchedPaidAmount = watch("paidAmount");
	const watchedShippingCost = watch("shippingCost");

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
			quantity: 1,
			unitPrice: 0,
			discount: 0,
			taxInclusive: false,
			taxRate: 0,
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
				invoiceNumber: data.invoiceNumber,
				customerName: data.customerName,
				phone: data.phone || undefined,
				paymentMethod: data.paymentMethod || undefined,
				paymentStatus: data.paymentStatus || undefined,
				safeId: data.safeId ? Number(data.safeId) : undefined,
				notes: data.notes || undefined,
				shippingCost: Number(data.shippingCost || 0),
				paidAmount: Number(data.paidAmount || 0),
				items: data.items.map((item) => ({
					variantId: item.variantId,
					quantity: Number(item.quantity),
					unitPrice: Number(item.unitPrice),
					discount: Number(item.discount || 0),
					taxInclusive: Boolean(item.taxInclusive),
					taxRate: Number(item.taxRate || 0),
				})),
			};

			await api.post("/sales-invoices", payload);
			toast.success("Sales invoice created successfully");
			navigate.push("/sales-invoices");
		} catch (error) {
			console.error("Failed to create invoice:", error);
			toast.error(error.response?.data?.message || "Failed to create sales invoice");
		} finally {
			setLoading(false);
		}
	};

	// Calculate summary
	const summary = {
		productCount: watchedItems.length,
		subtotal: watchedItems.reduce((sum, item) => {
			const price = parseFloat(item.unitPrice) || 0;
			const qty = parseFloat(item.quantity) || 0;
			const discount = parseFloat(item.discount) || 0;
			return sum + price * qty - discount;
		}, 0),
		taxTotal: watchedItems.reduce((sum, item) => {
			if (item.taxInclusive) {
				const price = parseFloat(item.unitPrice) || 0;
				const qty = parseFloat(item.quantity) || 0;
				const discount = parseFloat(item.discount) || 0;
				const taxRate = parseFloat(item.taxRate) || 0;
				const lineSubtotal = price * qty - discount;
				return sum + (lineSubtotal * taxRate) / 100;
			}
			return sum;
		}, 0),
		discountTotal: watchedItems.reduce((sum, item) => {
			return sum + (parseFloat(item.discount) || 0);
		}, 0),
	};

	const shippingCost = parseFloat(watchedShippingCost) || 0;
	const total = summary.subtotal + summary.taxTotal + shippingCost;
	const paidAmount = parseFloat(watchedPaidAmount) || 0;
	const remainingAmount = Math.max(total - paidAmount, 0);

	return (
		<motion.div
			dir={isRTL ? "rtl" : "ltr"}
			initial={{ opacity: 0, y: 20, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
			className="min-h-screen p-6"
		>
			<div className="bg-card mb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<button
							onClick={() => navigate.push("/sales-invoices")}
							className="text-gray-400 hover:text-primary transition-colors"
						>
							{t("breadcrumb.salesInvoices")}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.createInvoice")}</span>
						<span className="mr-3 inline-flex w-3.5 h-3.5 rounded-xl bg-primary" />
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
					<div className="flex-1 space-y-6">
						<motion.div
							className="bg-card"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
						>
							<div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-2">
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.invoiceNumber")} *
									</Label>
									<Controller
										name="invoiceNumber"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.invoiceNumber")}
												className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.invoiceNumber && (
										<p className="text-xs text-red-500">{errors.invoiceNumber.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.customerName")} *
									</Label>
									<Controller
										name="customerName"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.customerName")}
												className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.customerName && (
										<p className="text-xs text-red-500">{errors.customerName.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">{t("fields.phone")}</Label>
									<Controller
										name="phone"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.phone")}
												className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.paymentMethod")}
									</Label>
									<Controller
										name="paymentMethod"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-xl !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue placeholder={t("placeholders.paymentMethod")} />
												</SelectTrigger>
												<SelectContent className="bg-card-select">
													<SelectItem value="cash">{t("options.paymentMethod.cash")}</SelectItem>
													<SelectItem value="card">{t("options.paymentMethod.card")}</SelectItem>
													<SelectItem value="transfer">{t("options.paymentMethod.transfer")}</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
								</div>
							</div>
						</motion.div>

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
												{t("table.unitPrice")}
											</th>
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.quantity")}
											</th>
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.discount")}
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
												<td className="p-3 text-sm text-gray-600 dark:text-slate-300">{product.sku}</td>
												<td className="p-3 text-sm font-semibold text-gray-700 dark:text-slate-200">
													{product.productName}
												</td>
												<td className="p-3">
													<Input
														type="number"
														value={product.unitPrice}
														onChange={(e) => handleProductFieldChange(index, "unitPrice", e.target.value)}
														className="h-8 w-24"
													/>
												</td>
												<td className="p-3">
													<Input
														type="number"
														value={product.quantity}
														onChange={(e) => handleProductFieldChange(index, "quantity", e.target.value)}
														className="h-8 w-20"
													/>
												</td>
												<td className="p-3">
													<Input
														type="number"
														value={product.discount}
														onChange={(e) => handleProductFieldChange(index, "discount", e.target.value)}
														className="h-8 w-20"
													/>
												</td>
												<td className="p-3">
													<Select
														value={product.taxInclusive ? "yes" : "no"}
														onValueChange={(v) => handleProductFieldChange(index, "taxInclusive", v === "yes")}
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
														onChange={(e) => handleProductFieldChange(index, "taxRate", e.target.value)}
														className="h-8 w-16"
													/>
												</td>
												<td className="p-3 text-center">
													<motion.button
														type="button"
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
														onClick={() => handleDeleteProduct(index)}
														className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-red-950/30 dark:text-red-400"
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
					</div>

					<div className="w-full space-y-4 max-w-[350px]">
						<InvoiceSummary
							t={t}
							summary={summary}
							total={total}
							paidAmount={paidAmount}
							remainingAmount={remainingAmount}
							shippingCost={shippingCost}
							control={control}
						/>
					</div>
				</div>
			</form>
		</motion.div>
	);
}

function InvoiceSummary({ summary, t, total, paidAmount, remainingAmount, shippingCost, control }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.2 }}
			className="bg-card sticky top-6"
		>
			<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
				{t("sections.invoiceSummary")}
			</h3>

			<div className="space-y-4">
				<div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.productCount")}</span>
					<span className="text-lg font-bold text-blue-600 dark:text-blue-400">{summary.productCount}</span>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.subtotal")}</span>
					<span className="text-base font-semibold text-gray-700 dark:text-slate-200">
						{summary.subtotal.toFixed(2)} {t("currency")}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.taxTotal")}</span>
					<span className="text-base font-semibold text-orange-600 dark:text-orange-400">
						{summary.taxTotal.toFixed(2)} {t("currency")}
					</span>
				</div>

				<div className="space-y-2">
					<Label className="text-sm text-gray-600 dark:text-slate-300">{t("summary.shippingCost")}</Label>
					<Controller
						name="shippingCost"
						control={control}
						render={({ field }) => (
							<Input {...field} type="number" placeholder="0" className="rounded-xl h-[45px]" />
						)}
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-sm text-gray-600 dark:text-slate-300">{t("summary.paidAmount")}</Label>
					<Controller
						name="paidAmount"
						control={control}
						render={({ field }) => (
							<Input {...field} type="number" placeholder="0" className="rounded-xl h-[45px]" />
						)}
					/>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.total")}</span>
					<span className="text-base font-semibold text-green-600 dark:text-green-400">
						{total.toFixed(2)} {t("currency")}
					</span>
				</div>

				<div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/50">
					<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
						{t("summary.remainingAmount")}
					</span>
					<span className="text-xl font-bold text-purple-600 dark:text-purple-400">
						{remainingAmount.toFixed(2)} {t("currency")}
					</span>
				</div>
			</div>
		</motion.div>
	);
}