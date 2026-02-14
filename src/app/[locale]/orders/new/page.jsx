

"use client";

import React, { useMemo, useState } from "react";
 import { ChevronLeft, Trash2, Plus, Minus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, X, Loader2, AlertTriangle, TrendingUp,} from "lucide-react"; 
  import { cn } from "@/utils/cn";


import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { RHFPhoneField } from "@/components/atoms/PhoneInput";
import { RHFShippingCompanyField } from "@/components/lookups/ShippingCompanySelect";
import { RHFDatePicker } from "@/components/atoms/DatePicker";

import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";


const createSchema = (t) =>
	yup.object({
		customerName: yup.string().trim().required(t("validation.customerNameRequired")),

		phoneNumber: yup.string().trim().required(t("validation.phoneNumberRequired")),
		phoneNumberCountry: yup.string().trim().optional(), // stored by RHFPhoneField

		email: yup
			.string()
			.trim()
			.email(t("validation.invalidEmail"))
			.optional()
			.nullable()
			.transform((v) => (v === "" ? null : v)),

		city: yup.string().trim().required(t("validation.cityRequired")),

		address: yup.string().trim().optional().nullable().transform((v) => (v === "" ? null : v)),
		notes: yup.string().trim().optional().nullable().transform((v) => (v === "" ? null : v)),

		orderDate: yup.string().trim().required(t("validation.orderDateRequired")),

		paymentMethod: yup.string().trim().required(t("validation.paymentMethodRequired")),

		shippingCompany: yup
			.string()
			.trim()
			.nullable()
			.transform((v) => (v === "" ? null : v))
			.when("shippingCost", {
				is: (v) => Number(v || 0) > 0,
				then: (s) => s.required(t("validation.shippingCompanyRequired")),
				otherwise: (s) => s.optional(),
			}),

		shippingCost: yup
			.number()
			.typeError(t("validation.number"))
			.min(0, t("validation.minZero"))
			.default(0),

		discount: yup
			.number()
			.typeError(t("validation.number"))
			.min(0, t("validation.minZero"))
			.default(0),

		// "price" in your UI is paid amount / deposit
		price: yup
			.number()
			.typeError(t("validation.number"))
			.min(0, t("validation.minZero"))
			.default(0),

		items: yup
			.array()
			.of(
				yup.object({
					variantId: yup.number().typeError(t("validation.number")).required(),
					quantity: yup
						.number()
						.typeError(t("validation.number"))
						.min(1, t("validation.minOne"))
						.required(),
					unitPrice: yup
						.number()
						.typeError(t("validation.number"))
						.min(0, t("validation.minZero"))
						.required(),
					unitCost: yup
						.number()
						.typeError(t("validation.number"))
						.min(0, t("validation.minZero"))
						.optional()
						.nullable(),
					sku: yup.string().optional().nullable(),
					productName: yup.string().optional().nullable(),
					attributes: yup.mixed().optional(),
				})
			)
			.min(1, t("validation.itemsRequired"))
			.required(t("validation.itemsRequired")),
	});

export default function CreateOrderPageComplete() {
	const navigate = useRouter();
	const locale = useLocale();
	const isRTL = locale === "ar";
	const t = useTranslations("createOrder");

	const [loading, setLoading] = useState(false);
	const [selectedSkus, setSelectedSkus] = useState([]);
	const [bulkOpen, setBulkOpen] = useState(false);

	const schema = useMemo(() => createSchema(t), [t]);

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			customerName: "",
			phoneNumber: "",
			phoneNumberCountry: "QA",

			email: "",
			city: "",
			address: "",
			notes: "",

			orderDate: "",
			paymentMethod: "cod",

			shippingCompany: "",
			shippingCost: 0,
			discount: 0,
			price: 0,

			items: [],
		},
		mode: "onSubmit",
	});

	const watchedItems = watch("items");
	const watchedShippingCost = watch("shippingCost");
	const watchedDiscount = watch("discount");
	const watchedPaid = watch("price");

	/** =========================
	 * Product handlers
	 * ========================= */
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

		setValue("items", [...watchedItems, newItem], { shouldValidate: true });
	};

	const handleDeleteProduct = (index) => {
		const deletedItem = watchedItems[index];
		const newItems = watchedItems.filter((_, i) => i !== index);
		setValue("items", newItems, { shouldValidate: true });
		setSelectedSkus((prev) => prev.filter((s) => s.id !== deletedItem.variantId));
	};

	const handleProductFieldChange = (index, field, value) => {
		const newItems = [...watchedItems];
		newItems[index] = { ...newItems[index], [field]: value };
		setValue("items", newItems, { shouldValidate: true });
	};

	const handleQuantityChange = (index, delta) => {
		const newItems = [...watchedItems];
		const newQuantity = Math.max(1, (Number(newItems[index].quantity) || 1) + delta);
		newItems[index] = { ...newItems[index], quantity: newQuantity };
		setValue("items", newItems, { shouldValidate: true });
	};

	/** =========================
	 * Summary based on visible fields
	 * ========================= */
	const summary = useMemo(() => {
		const productsTotal = (watchedItems || []).reduce((sum, item) => {
			const price = Number(item.unitPrice || 0);
			const qty = Number(item.quantity || 0);
			return sum + price * qty;
		}, 0);

		const shippingCost = Number(watchedShippingCost || 0);
		const discount = Number(watchedDiscount || 0);
		const paid = Number(watchedPaid || 0);

		const subtotal = productsTotal;
		const finalTotal = subtotal + shippingCost - discount;
		const remaining = finalTotal - paid;

		return {
			productCount: (watchedItems || []).length,
			subtotal,
			productsTotal,
			shippingCost,
			discount,
			paid,
			finalTotal,
			remaining: remaining < 0 ? 0 : remaining,
			overPaid: remaining < 0 ? Math.abs(remaining) : 0,
		};
	}, [watchedItems, watchedShippingCost, watchedDiscount, watchedPaid]);

	/** =========================
	 * Submit
	 * ========================= */
	const onSubmit = async (data) => {
		setLoading(true);
		try {
			const payload = {
				customerName: data.customerName,
				phoneNumber: data.phoneNumber,
				phoneNumberCountry: data.phoneNumberCountry || undefined,

				email: data.email || undefined,
				city: data.city,
				address: data.address || undefined,
				notes: data.notes || undefined,

				orderDate: data.orderDate,

				paymentMethod: data.paymentMethod,

				storeId: data.storeId ? Number(data.storeId) : undefined,

				shippingCompany: data.shippingCompany || undefined,
				shippingCost: Number(data.shippingCost || 0),
				discount: Number(data.discount || 0),
				price: Number(data.price || 0),

				items: (data.items || []).map((item) => ({
					variantId: Number(item.variantId),
					quantity: Number(item.quantity),
					unitPrice: Number(item.unitPrice),
					unitCost: Number(item.unitCost ?? item.unitPrice),
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
							type="button"
						>
							{t("breadcrumb.orders")}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.createOrder")}</span>
						<span className="mr-3 inline-flex w-3.5 h-3.5 rounded-xl bg-primary" />
					</div>

					<div className="flex items-center gap-4">
						<Button_
							size="sm"
							label={t("actions.bulkOrders")}
							tone="white"
							variant="solid"
							onClick={() => setBulkOpen(true)}
						/>


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
								{/* customerName */}
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

								{/* phone */}
								<div className="space-y-2">
									<RHFPhoneField
										control={control}
										name="phoneNumber"
										countryName="phoneNumberCountry"
										setValue={setValue}
										setError={setError}
										clearErrors={clearErrors}
										label={t("fields.phoneNumber")}
										required
									/> 
								</div>

								{/* email */}
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
									{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
								</div>

								{/* city */}
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
									{errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
								</div>

								{/* address */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.address")}
									</Label>
									<Controller
										name="address"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.address")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.address && (
										<p className="text-xs text-red-500">{errors.address.message}</p>
									)}
								</div>

								{/* notes */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.notes")}
									</Label>
									<Controller
										name="notes"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.notes")}
												className="rounded-lg h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
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
								{/* order date */}
								<div className="space-y-2">
									<RHFDatePicker
										control={control}
										name="orderDate"
										required
										minDate="today"
										maxDate="2030-12-31"
										label={t("fields.orderDate")}
										placeholder={t("placeholders.orderDate")}
									/> 
								</div>

								{/* payment method */}
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

								{/* shipping company */}
								<div className="space-y-2">
									<RHFShippingCompanyField
										control={control}
										name="shippingCompany"
										label={t("fields.shippingCompany")}
									/>
									{errors.shippingCompany && (
										<p className="text-xs text-red-500">{errors.shippingCompany.message}</p>
									)}
								</div>

								{/* shipping cost */}
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
									{errors.shippingCost && (
										<p className="text-xs text-red-500">{errors.shippingCost.message}</p>
									)}
								</div>

								{/* discount */}
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
									{errors.discount && (
										<p className="text-xs text-red-500">{errors.discount.message}</p>
									)}
								</div>

								{/* paid/deposit */}
								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.price")}
									</Label>
									<Controller
										name="price"
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
									{errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
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
												const unitPrice = Number(product.unitPrice) || 0;
												const quantity = Number(product.quantity) || 0;
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
					</div>

					{/* Summary */}
					<div className="w-full lg:w-[350px]">
						<OrderSummary t={t} summary={summary} />
					</div>
				</div>
			</form>

			<BulkOrdersDialog open={bulkOpen} onOpenChange={setBulkOpen} />

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

				{summary.paid > 0 && (
					<>
						<div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
							<span className="text-sm text-gray-600 dark:text-slate-300">
								{t("summary.price")}
							</span>
							<span className="text-base font-semibold text-blue-600 dark:text-blue-400">
								{summary.paid.toFixed(2)} {t("currency")}
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

						{summary.overPaid > 0 ? (
							<div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50">
								<span className="text-sm text-gray-600 dark:text-slate-300">
									{t("summary.overPaid")}
								</span>
								<span className="text-base font-semibold text-green-700 dark:text-green-400">
									{summary.overPaid.toFixed(2)} {t("currency")}
								</span>
							</div>
						) : null}
					</>
				)}
			</div>
		</motion.div>
	);
}








 
const TEMPLATE_COLUMNS = [
  "customerName",
  "phoneNumber",
  "phoneNumberCountry",
  "city",
  "address",
  "paymentMethod",
  "shippingCompany",
  "shippingCost",
  "discount",
  "price",
  "notes",
  "itemsJson",
];

const EXAMPLE_ROW = {
  customerName: "أحمد محمد",
  phoneNumber: "501234567",
  phoneNumberCountry: "SA",
  city: "الرياض",
  address: "حي الملقا، شارع الأمير سلطان",
  paymentMethod: "cod",
  shippingCompany: "aramex",
  shippingCost: 20,
  discount: 5,
  price: 100,
  notes: "توصيل سريع",
  itemsJson: '[{"variantId":123,"quantity":2,"unitPrice":50,"unitCost":40}]',
};

function downloadXlsxTemplate(t) {
  const ws = XLSX.utils.json_to_sheet([EXAMPLE_ROW], {
    header: TEMPLATE_COLUMNS,
  });

  ws["!cols"] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "OrdersTemplate");
  XLSX.writeFile(wb, "bulk-orders-template.xlsx");

  toast.success(t("template.downloadSuccess"));
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function validateRows(rows, t) {
  const errors = [];
  const valid = [];

  rows.forEach((r, i) => {
    const rowIndex = i + 2;
    const rowErrors = [];

    if (!r.customerName) rowErrors.push(t("validation.customerNameRequired"));
    if (!r.phoneNumber) rowErrors.push(t("validation.phoneNumberRequired"));
    if (!r.city) rowErrors.push(t("validation.cityRequired"));
    if (!r.paymentMethod) rowErrors.push(t("validation.paymentMethodRequired"));

    let items = [];
    try {
      items = r.itemsJson ? JSON.parse(r.itemsJson) : [];
      if (!Array.isArray(items) || items.length === 0) {
        rowErrors.push(t("validation.itemsRequired"));
      }
    } catch (e) {
      rowErrors.push(t("validation.itemsJsonInvalid"));
    }

    if (rowErrors.length > 0) {
      rowErrors.forEach((err) => {
        errors.push(`${t("validation.row")} ${rowIndex}: ${err}`);
      });
    } else {
      valid.push({
        customerName: String(r.customerName).trim(),
        phoneNumber: String(r.phoneNumber).trim(),
        phoneNumberCountry: String(r.phoneNumberCountry || "").trim() || undefined,
        city: String(r.city).trim(),
        address: String(r.address || "").trim() || undefined,
        paymentMethod: String(r.paymentMethod || "cod").trim(),
        shippingCompany: String(r.shippingCompany || "").trim() || undefined,
        shippingCost: Number(r.shippingCost || 0),
        discount: Number(r.discount || 0),
        price: Number(r.price || 0),
        notes: String(r.notes || "").trim() || undefined,
        items: items.map((it) => ({
          variantId: Number(it.variantId),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          unitCost: Number(it.unitCost ?? it.unitPrice),
        })),
      });
    }
  });

  return { valid, errors };
}

  function BulkOrdersDialog({ open, onOpenChange }) {
  const t = useTranslations("bulkOrders");
  const [file, setFile] = useState(null);
  const [rowsCount, setRowsCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [validOrders, setValidOrders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);

  const hasErrors = errors.length > 0;
  const hasFile = file !== null;
  const isReady = hasFile && validOrders.length > 0 && !hasErrors;

  const resetState = () => {
    setFile(null);
    setRowsCount(0);
    setErrors([]);
    setValidOrders([]);
  };

  const onPickFile = async (f) => {
    if (!f) return;

    setFile(f);
    setErrors([]);
    setValidOrders([]);
    setRowsCount(0);
    setProcessing(true);

    try {
      const rows = await parseFile(f);
      setRowsCount(rows.length);

      const res = validateRows(rows, t);
      setErrors(res.errors);
      setValidOrders(res.valid);

      if (res.errors.length) {
        toast.error(t("messages.validationFailed"), {
          description: t("messages.checkErrors"),
        });
      } else {
        toast.success(t("messages.fileReady"), {
          description: t("messages.readyToUpload", { count: res.valid.length }),
        });
      }
    } catch (e) {
      console.error(e);
      toast.error(t("messages.fileReadFailed"));
      resetState();
    } finally {
      setProcessing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx")) {
        onPickFile(droppedFile);
      } else {
        toast.error(t("messages.invalidFileType"));
      }
    }
  };

  const uploadBulk = async () => {
    if (!validOrders.length) {
      toast.error(t("messages.noValidOrders"));
      return;
    }

    setUploading(true);
    try {
      await api.post("/orders/bulk", { orders: validOrders });

      toast.success(t("messages.uploadSuccess"), {
        description: t("messages.ordersUploaded", { count: validOrders.length }),
      });
      
      onOpenChange(false);
      setTimeout(resetState, 300);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || t("messages.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      setTimeout(resetState, 300);
    }
  };

  const removeFile = () => {
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Step 1: Download Template */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                1
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100">
                {t("steps.downloadTemplate")}
              </h4>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {t("template.title")}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {t("template.description")}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => downloadXlsxTemplate(t)}
                className="flex-shrink-0 gap-2"
              >
                <Download className="w-4 h-4" />
                {t("template.download")}
              </Button>
            </div>
          </motion.div>

          {/* Step 2: Upload File */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                2
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100">
                {t("steps.uploadFile")}
              </h4>
            </div>

            {!hasFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200",
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-gray-300 dark:border-slate-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                )}
              >
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={processing}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <motion.div
                      animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center",
                        dragActive
                          ? "bg-primary/20"
                          : "bg-gray-100 dark:bg-slate-800"
                      )}
                    >
                      <Upload
                        className={cn(
                          "w-8 h-8",
                          dragActive
                            ? "text-primary"
                            : "text-gray-400 dark:text-slate-500"
                        )}
                      />
                    </motion.div>
                  </div>

                  <div>
                    <p className="text-base font-medium text-gray-700 dark:text-slate-200">
                      {dragActive ? t("upload.dropHere") : t("upload.dragDrop")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                      {t("upload.orClick")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{t("upload.acceptedFormat")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border rounded-xl p-4 bg-gray-50 dark:bg-slate-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>

                  {processing ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Step 3: Review & Upload */}
          {hasFile && !processing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  3
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-slate-100">
                  {t("steps.review")}
                </h4>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {t("stats.totalRows")}
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {rowsCount}
                      </p>
                    </div>
                    <FileSpreadsheet className="w-8 h-8 text-blue-600/30 dark:text-blue-400/30" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-700 dark:text-green-300">
                        {t("stats.validOrders")}
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                        {validOrders.length}
                      </p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-600/30 dark:text-green-400/30" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-red-700 dark:text-red-300">
                        {t("stats.errors")}
                      </p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                        {errors.length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600/30 dark:text-red-400/30" />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {isReady && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      {t("messages.allValid")}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {t("messages.readyToUpload", { count: validOrders.length })}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Errors List */}
              <AnimatePresence>
                {hasErrors && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                      <div className="bg-red-50 dark:bg-red-950/20 p-3 border-b border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                            {t("errors.title")}
                          </p>
                          <span className="ml-auto text-xs font-medium text-red-700 dark:text-red-300">
                            {errors.length} {t("errors.found")}
                          </span>
                        </div>
                      </div>

                      <div className="max-h-[200px] overflow-y-auto bg-white dark:bg-slate-900">
                        <ul className="divide-y divide-red-100 dark:divide-red-900/20">
                          {errors.slice(0, 50).map((error, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className="p-3 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                                  {idx + 1}
                                </span>
                                <p className="text-xs text-red-700 dark:text-red-300 flex-1">
                                  {error}
                                </p>
                              </div>
                            </motion.li>
                          ))}
                        </ul>

                        {errors.length > 50 && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 border-t border-red-100 dark:border-red-900/20">
                            <p className="text-xs text-red-600 dark:text-red-400 text-center">
                              {t("errors.showingFirst", { count: 50 })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Processing State */}
          {processing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {t("processing.title")}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {t("processing.description")}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            disabled={uploading || hasErrors || !validOrders.length || processing}
            onClick={uploadBulk}
            className="gap-2 min-w-[140px]"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("actions.uploading")}
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                {t("actions.upload")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}