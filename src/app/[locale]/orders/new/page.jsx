// app/[locale]/orders/new/page.jsx
"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Trash2, Plus, Minus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Button_ from "@/components/atoms/Button";
import { useRouter } from "@/i18n/navigation";

import { useLocale, useTranslations } from "next-intl";
import api from "@/utils/api";
import { ProductSkuSearchPopover } from "@/components/molecules/ProductSkuSearchPopover";

// ✅ Validation schema
const createSchema = (t) =>
	yup.object({
		customerName: yup.string().required(t("validation.customerNameRequired")),
		phoneNumber: yup.string().required(t("validation.phoneNumberRequired")),
		alternativePhone: yup.string().optional(),
		email: yup.string().email(t("validation.invalidEmail")).optional(),
		address: yup.string().required(t("validation.addressRequired")),
		city: yup.string().required(t("validation.cityRequired")),
		area: yup.string().optional(),
		landmark: yup.string().optional(),
		paymentMethod: yup.string().required(t("validation.paymentMethodRequired")),
		paymentStatus: yup.string().optional(),
		shippingCompany: yup.string().optional(),
		shippingCost: yup.number().min(0).optional(),
		discount: yup.number().min(0).optional(),
		deposit: yup.number().min(0).optional(),
		notes: yup.string().optional(),
		customerNotes: yup.string().optional(),
		items: yup
			.array()
			.of(
				yup.object({
					variantId: yup.number().required(),
					quantity: yup.number().min(1).required(),
					unitPrice: yup.number().min(0).required(),
				})
			)
			.min(1, t("validation.itemsRequired")),
	});

export default function CreateOrderPageComplete() {
	const navigate = useRouter();
	const locale = useLocale();
	const isRTL = locale === "ar";
	const t = useTranslations("createOrder");

	const [loading, setLoading] = useState(false);
	const [selectedSkus, setSelectedSkus] = useState([]);

	const schema = useMemo(() => createSchema(t), [t]);

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			customerName: "",
			phoneNumber: "",
			alternativePhone: "",
			email: "",
			address: "",
			city: "",
			area: "",
			landmark: "",
			paymentMethod: "cod",
			paymentStatus: "pending",
			shippingCompany: "",
			shippingCost: 0,
			discount: 0,
			deposit: 0,
			notes: "",
			customerNotes: "",
			items: [],
		},
	});

	const watchedItems = watch("items");
	const watchedShippingCost = watch("shippingCost");
	const watchedDiscount = watch("discount");
	const watchedDeposit = watch("deposit");

	// ✅ Handle product selection
	const handleSelectSku = (sku) => {
		if (selectedSkus.some((s) => s.id === sku.id)) return;

		setSelectedSkus((prev) => [...prev, sku]);

		const newItem = {
			variantId: sku.id,
			productName: sku.label || sku.productName,
			sku: sku.sku || sku.key,
			attributes: sku.attributes || {},
			quantity: 1,
			unitPrice: sku.price || 0,
			unitCost: sku.cost || sku.price || 0,
		};

		setValue("items", [...watchedItems, newItem]);
	};

	// ✅ Handle product deletion
	const handleDeleteProduct = (index) => {
		const deletedItem = watchedItems[index];
		const newItems = watchedItems.filter((_, i) => i !== index);
		setValue("items", newItems);
		setSelectedSkus((prev) => prev.filter((s) => s.id !== deletedItem.variantId));
	};

	// ✅ Handle field changes
	const handleProductFieldChange = (index, field, value) => {
		const newItems = [...watchedItems];
		newItems[index] = { ...newItems[index], [field]: value };
		setValue("items", newItems);
	};

	// ✅ Handle quantity increment/decrement
	const handleQuantityChange = (index, delta) => {
		const newItems = [...watchedItems];
		const newQuantity = Math.max(1, (newItems[index].quantity || 1) + delta);
		newItems[index] = { ...newItems[index], quantity: newQuantity };
		setValue("items", newItems);
	};

	// ✅ Calculate summary
	const summary = useMemo(() => {
		const productsTotal = watchedItems.reduce((sum, item) => {
			const price = parseFloat(item.unitPrice) || 0;
			const qty = parseFloat(item.quantity) || 0;
			return sum + price * qty;
		}, 0);

		const shippingCost = parseFloat(watchedShippingCost) || 0;
		const discount = parseFloat(watchedDiscount) || 0;
		const deposit = parseFloat(watchedDeposit) || 0;
		const finalTotal = productsTotal + shippingCost - discount;
		const remaining = finalTotal - deposit;

		return {
			productCount: watchedItems.length,
			productsTotal,
			shippingCost,
			discount,
			deposit,
			finalTotal,
			remaining,
		};
	}, [watchedItems, watchedShippingCost, watchedDiscount, watchedDeposit]);

	// ✅ Submit handler
	const onSubmit = async (data) => {
		setLoading(true);
		try {
			const payload = {
				customerName: data.customerName,
				phoneNumber: data.phoneNumber,
				alternativePhone: data.alternativePhone || undefined,
				email: data.email || undefined,
				address: data.address,
				city: data.city,
				area: data.area || undefined,
				landmark: data.landmark || undefined,
				paymentMethod: data.paymentMethod,
				paymentStatus: data.paymentStatus || undefined,
				shippingCompany: data.shippingCompany || undefined,
				shippingCost: Number(data.shippingCost || 0),
				discount: Number(data.discount || 0),
				deposit: Number(data.deposit || 0),
				notes: data.notes || undefined,
				customerNotes: data.customerNotes || undefined,
				items: data.items.map((item) => ({
					variantId: item.variantId,
					quantity: Number(item.quantity),
					unitPrice: Number(item.unitPrice),
					unitCost: Number(item.unitCost || item.unitPrice),
				})),
			};

			await api.post("/orders", payload);
			toast.success(t("messages.createSuccess"));
			navigate.push("/orders");
		} catch (error) {
			console.error("Failed to create order:", error);
			toast.error(error.response?.data?.message || t("messages.createFailed"));
		} finally {
			setLoading(false);
		}
	};

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
							onClick={() => navigate.push("/orders")}
							className="text-gray-400 hover:text-primary transition-colors"
						>
							{t("breadcrumb.orders")}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.createOrder")}</span>
						<span className="mr-3 inline-flex w-3.5 h-3.5 rounded-xl bg-primary" />
					</div>

					<div className="flex items-center gap-4">
						<Button_ size="sm" label={t("actions.howToUse")} tone="white" variant="solid" />

						<Button_
							onClick={handleSubmit(onSubmit)}
							size="sm"
							label={loading ? t("actions.saving") : t("actions.save")}
							tone="purple"
							variant="solid"
							disabled={loading}
						/>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="flex flex-col lg:flex-row gap-6">
					<div className="flex-1 space-y-6">
						{/* Customer Info */}
						<motion.div
							className="bg-card"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.customerInfo")}
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.customerName && (
										<p className="text-xs text-red-500">{errors.customerName.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.phoneNumber")} *
									</Label>
									<Controller
										name="phoneNumber"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.phoneNumber")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.phoneNumber && (
										<p className="text-xs text-red-500">{errors.phoneNumber.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.alternativePhone")}
									</Label>
									<Controller
										name="alternativePhone"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.alternativePhone")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.email")}
									</Label>
									<Controller
										name="email"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												type="email"
												placeholder={t("placeholders.email")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.email && (
										<p className="text-xs text-red-500">{errors.email.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.city")} *
									</Label>
									<Controller
										name="city"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.city")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.city && (
										<p className="text-xs text-red-500">{errors.city.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.area")}
									</Label>
									<Controller
										name="area"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.area")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>

								<div className="md:col-span-2 space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.address")} *
									</Label>
									<Controller
										name="address"
										control={control}
										render={({ field }) => (
											<Textarea
												{...field}
												placeholder={t("placeholders.address")}
												className="rounded-xl min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.address && (
										<p className="text-xs text-red-500">{errors.address.message}</p>
									)}
								</div>

								<div className="md:col-span-2 space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.landmark")}
									</Label>
									<Controller
										name="landmark"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.landmark")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>
							</div>
						</motion.div>

						{/* Payment & Shipping */}
						<motion.div
							className="bg-card"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.25 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.paymentShipping")}
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.paymentMethod")} *
									</Label>
									<Controller
										name="paymentMethod"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-lg !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-card-select">
													<SelectItem value="cash">{t("paymentMethods.cash")}</SelectItem>
													<SelectItem value="card">{t("paymentMethods.card")}</SelectItem>
													<SelectItem value="bank_transfer">{t("paymentMethods.bankTransfer")}</SelectItem>
													<SelectItem value="cod">{t("paymentMethods.cod")}</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
									{errors.paymentMethod && (
										<p className="text-xs text-red-500">{errors.paymentMethod.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.paymentStatus")}
									</Label>
									<Controller
										name="paymentStatus"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-lg !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-card-select">
													<SelectItem value="pending">{t("paymentStatuses.pending")}</SelectItem>
													<SelectItem value="paid">{t("paymentStatuses.paid")}</SelectItem>
													<SelectItem value="partial">{t("paymentStatuses.partial")}</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.shippingCompany")}
									</Label>
									<Controller
										name="shippingCompany"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.shippingCompany")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.shippingCost")}
									</Label>
									<Controller
										name="shippingCost"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												type="number"
												min="0"
												step="0.01"
												placeholder="0.00"
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.discount")}
									</Label>
									<Controller
										name="discount"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												type="number"
												min="0"
												step="0.01"
												placeholder="0.00"
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.deposit")}
									</Label>
									<Controller
										name="deposit"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												type="number"
												min="0"
												step="0.01"
												placeholder="0.00"
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
								</div>
							</div>
						</motion.div>

						{/* Add Products */}
						<motion.div
							className="bg-card"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.addProducts")}
							</h3>

							<ProductSkuSearchPopover 
								closeOnSelect={false} 
								handleSelectSku={handleSelectSku} 
								selectedSkus={selectedSkus} 
							/>
							{errors.items && <p className="text-xs text-red-500 mt-2">{errors.items.message}</p>}
						</motion.div>

						{/* Products Table */}
						{watchedItems.length > 0 && (
							<motion.div
								className="bg-card"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.35 }}
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
													{t("table.total")}
												</th>
												<th className="text-center p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
													{t("table.actions")}
												</th>
											</tr>
										</thead>
										<tbody>
											{watchedItems.map((product, index) => {
												const unitPrice = parseFloat(product.unitPrice) || 0;
												const quantity = parseFloat(product.quantity) || 0;
												const lineTotal = unitPrice * quantity;

												return (
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
																value={product.unitPrice}
																onChange={(e) =>
																	handleProductFieldChange(index, "unitPrice", e.target.value)
																}
																className="h-9 w-28"
																min="0"
																step="0.01"
															/>
														</td>
														<td className="p-3">
															<div className="flex items-center gap-1">
																<motion.button
																	type="button"
																	whileHover={{ scale: 1.1 }}
																	whileTap={{ scale: 0.9 }}
																	onClick={() => handleQuantityChange(index, -1)}
																	className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center"
																>
																	<Minus size={14} />
																</motion.button>
																<Input
																	type="number"
																	value={product.quantity}
																	onChange={(e) =>
																		handleProductFieldChange(index, "quantity", e.target.value)
																	}
																	className="h-9 w-16 text-center"
																	min="1"
																/>
																<motion.button
																	type="button"
																	whileHover={{ scale: 1.1 }}
																	whileTap={{ scale: 0.9 }}
																	onClick={() => handleQuantityChange(index, 1)}
																	className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center"
																>
																	<Plus size={14} />
																</motion.button>
															</div>
														</td>
														<td className="p-3 text-sm font-semibold text-green-600 dark:text-green-400">
															{lineTotal.toFixed(2)} {t("currency")}
														</td>
														<td className="p-3 text-center">
															<motion.button
																type="button"
																whileHover={{ scale: 1.1 }}
																whileTap={{ scale: 0.9 }}
																onClick={() => handleDeleteProduct(index)}
																className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
															>
																<Trash2 size={16} />
															</motion.button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</motion.div>
						)}

						{/* Notes */}
						<motion.div
							className="bg-card"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.notes")}
							</h3>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.notes")}
									</Label>
									<Controller
										name="notes"
										control={control}
										render={({ field }) => (
											<Textarea
												{...field}
												placeholder={t("placeholders.notes")}
												className="min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-2xl"
											/>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.customerNotes")}
									</Label>
									<Controller
										name="customerNotes"
										control={control}
										render={({ field }) => (
											<Textarea
												{...field}
												placeholder={t("placeholders.customerNotes")}
												className="min-h-[80px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-2xl"
											/>
										)}
									/>
								</div>
							</div>
						</motion.div>
					</div>

					{/* Right Column - Summary */}
					<div className="w-full lg:w-[350px]">
						<OrderSummary t={t} summary={summary} />
					</div>
				</div>
			</form>
		</motion.div>
	);
}

function OrderSummary({ t, summary }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.2 }}
			className="bg-card sticky top-6"
		>
			<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
				{t("sections.orderSummary")}
			</h3>

			<div className="space-y-4">
				<div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
					<span className="text-sm text-gray-600 dark:text-slate-300">
						{t("summary.productCount")}
					</span>
					<span className="text-lg font-bold text-blue-600 dark:text-blue-400">
						{summary.productCount}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
					<span className="text-sm text-gray-600 dark:text-slate-300">
						{t("summary.productsTotal")}
					</span>
					<span className="text-base font-semibold text-gray-700 dark:text-slate-200">
						{summary.productsTotal.toFixed(2)} {t("currency")}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
					<span className="text-sm text-gray-600 dark:text-slate-300">
						{t("summary.shippingCost")}
					</span>
					<span className="text-base font-semibold text-gray-700 dark:text-slate-200">
						{summary.shippingCost.toFixed(2)} {t("currency")}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
					<span className="text-sm text-gray-600 dark:text-slate-300">
						{t("summary.discount")}
					</span>
					<span className="text-base font-semibold text-red-600 dark:text-red-400">
						-{summary.discount.toFixed(2)} {t("currency")}
					</span>
				</div>

				<div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/30">
					<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
						{t("summary.finalTotal")}
					</span>
					<span className="text-xl font-bold text-primary">
						{summary.finalTotal.toFixed(2)} {t("currency")}
					</span>
				</div>

				{summary.deposit > 0 && (
					<>
						<div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
							<span className="text-sm text-gray-600 dark:text-slate-300">
								{t("summary.deposit")}
							</span>
							<span className="text-base font-semibold text-blue-600 dark:text-blue-400">
								{summary.deposit.toFixed(2)} {t("currency")}
							</span>
						</div>

						<div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900/50">
							<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
								{t("summary.remaining")}
							</span>
							<span className="text-xl font-bold text-orange-600 dark:text-orange-400">
								{summary.remaining.toFixed(2)} {t("currency")}
							</span>
						</div>
					</>
				)}
			</div>
		</motion.div>
	);
}