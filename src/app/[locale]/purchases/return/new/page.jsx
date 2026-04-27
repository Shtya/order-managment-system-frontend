"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Info, Save, Trash2, Upload, FileText, X, Package, Tag } from "lucide-react";
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
import PageHeader from "@/components/atoms/Pageheader";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { cn } from "@/utils/cn";

export default function CreateReturnInvoicePage() {
	const navigate = useRouter();
	const locale = useLocale();
	const isRTL = locale === "ar";
	const tValidation = useTranslations("validation");
	const t = useTranslations("returnInvoice");
	const { formatCurrency } = usePlatformSettings();

	const [receiptImage, setReceiptImage] = useState(null);

	const MAX_RECEIPT_MB = 5;
	const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

	const schema = useMemo(
		() =>
			yup.object({
				returnNumber: yup.string().required(tValidation("returnNumberRequired")),
				supplierId: yup.string().optional(),
				supplierNameSnapshot: yup.string().optional(),
				supplierCodeSnapshot: yup.string().optional(),
				invoiceNumber: yup.string().optional(),
				returnReason: yup.string().optional(),
				safeId: yup.string().optional(),
				returnType: yup.string().optional().nullable(),
				notes: yup.string().optional(),
				paidAmount: yup
					.number()
					.transform((value, originalValue) => {
						// يحول string لرقم
						if (originalValue === "" || originalValue === null || originalValue === undefined) return 0;
						const n = Number(originalValue);
						return Number.isFinite(n) ? n : 0;
					})
					.min(0, tValidation("mustBePositive"))
					.optional(),
				items: yup
					.array()
					.of(
						yup.object({
							variantId: yup.string().required(tValidation("productRequired")),
							returnedQuantity: yup
								.number()
								.transform((v, o) => (o === "" || o === null || o === undefined ? 0 : Number(o)))
								.integer(tValidation("noDecimalsAllowed"))
								.min(1, tValidation("quantityMinimum"))
								.required(tValidation("quantityRequired")),
							unitCost: yup
								.number()
								.transform((v, o) => (o === "" || o === null || o === undefined ? 0 : Number(o)))
								.min(0, tValidation("mustBePositive"))
								.required(tValidation("unitCostRequired")),
							taxInclusive: yup.boolean().optional(),
							taxRate: yup
								.number()
								.transform((v, o) => (o === "" || o === null || o === undefined ? 0 : Number(o)))
								.min(0, tValidation("mustBePositive"))
								.max(100, tValidation("taxRateRange"))
								.optional(),
						})
					)
					.min(1, tValidation("itemsRequired")),
			}),
		[tValidation]
	);

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
			returnType: null,
			notes: "",
			paidAmount: 0,
			items: [],
			receiptAsset: null,
		},
	});

	const watchedItems = watch("items");
	const watchedSupplier = watch("supplierId");

	const handleImageUpload = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// accept image/pdf
		const okType = ALLOWED_RECEIPT_TYPES.includes(file.type);
		if (!okType) {
			toast.error(tValidation("invalidFileType") || "Invalid file type");
			return;
		}

		if (file.size > MAX_RECEIPT_MB * 1024 * 1024) {
			toast.error(tValidation("fileTooLargeMB", { MB: 5 }) || "File too large");
			return;
		}

		// لو PDF مش هنعمل preview image
		if (file.type === "application/pdf") {
			const pdfObj = { file, preview: null, name: file.name, isPdf: true };
			setReceiptImage(pdfObj);
			setValue("receiptAsset", pdfObj, { shouldValidate: true });
			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			const obj = { file, preview: reader.result, name: file.name, isPdf: false };
			setReceiptImage(obj);
			setValue("receiptAsset", obj, { shouldValidate: true });
		};
		reader.readAsDataURL(file);
	};

	const handleRemoveImage = () => {
		setReceiptImage(null);
		setValue("receiptAsset", null, { shouldValidate: true });
	};

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
		const deletedItem = watchedItems[index];
		const newItems = watchedItems.filter((_, i) => i !== index);
		setValue("items", newItems);

		setSelectSku((prev) => prev.filter((s) => s.id !== deletedItem.variantId));
	};

	// const handleSelectSku = (product, sku) => {
	// 	const newItem = {
	// 		variantId: sku.id,
	// 		productName: product.name,
	// 		sku: sku.sku || sku.key,
	// 		attributes: sku.attributes || {},
	// 		returnedQuantity: 1,
	// 		unitCost: 0,
	// 		taxInclusive: false,
	// 		taxRate: 5,
	// 	};
	// 	console.log(newItem)

	// 	setValue("items", [...watchedItems, newItem]);
	// };
	const [selectSku, setSelectSku] = useState([]); // array

	const handleSelectSku = (sku) => {
		const currentItems = watchedItems ?? [];
		if (!sku?.available) return;
		// Prevent duplicate selection
		const alreadyExists = currentItems.some(
			(item) => item.variantId === sku.id
		);
		if (alreadyExists) return;

		setSelectSku((prev) => [...prev, sku]);
		const newItem = {
			variantId: sku.id,
			productName: sku.name,
			sku: sku.sku || sku.key,
			attributes: sku.attributes || {},
			returnedQuantity: 1,
			availableQuantity: sku.available || 0, // Store available quantity
			unitCost: sku.wholesalePrice || 0,
			originalUnitCost: sku.wholesalePrice || 0,
			taxInclusive: false,
			taxRate: 5,
		};

		setValue("items", [...currentItems, newItem]);
	};


	const handleProductFieldChange = (index, field, value) => {
		const newItems = [...watchedItems];
		let finalValue = value;

		// Validation for returnedQuantity
		if (field === "returnedQuantity") {
			const available = newItems[index].availableQuantity || 0;
			const numValue = value === "" ? "" : Number(value);

			if (numValue !== "" && numValue > available) {
				finalValue = available;
			}
		}

		newItems[index] = { ...newItems[index], [field]: finalValue };
		setValue("items", newItems);
	};

	const onSubmit = async (data) => {
		setLoading(true);
		try {
			const fd = new FormData();

			fd.append("returnNumber", data.returnNumber);
			if (data.supplierId && data.supplierId !== "none") {
				fd.append("supplierId", String(data.supplierId));
			}
			if (data.supplierNameSnapshot) fd.append("supplierNameSnapshot", data.supplierNameSnapshot);
			if (data.supplierCodeSnapshot) fd.append("supplierCodeSnapshot", data.supplierCodeSnapshot);
			if (data.invoiceNumber) fd.append("invoiceNumber", data.invoiceNumber);
			if (data.returnReason) fd.append("returnReason", data.returnReason);
			if (data.safeId) fd.append("safeId", String(data.safeId));
			if (data.returnType) fd.append("returnType", data.returnType);
			if (data.notes) fd.append("notes", data.notes);
			fd.append("paidAmount", String(Number(data.paidAmount || 0)));

			const items = (data.items || []).map((item) => ({
				variantId: item.variantId,
				returnedQuantity: Number(item.returnedQuantity),
				unitCost: Number(item.unitCost),
				taxInclusive: Boolean(item.taxInclusive),
				taxRate: item.taxRate !== undefined && item.taxRate !== null ? Number(item.taxRate) : 5,
			}));
			fd.append("items", JSON.stringify(items));

			if (receiptImage?.file) {
				fd.append("receiptAsset", receiptImage.file);
			}

			const apiPromise = api.post("/purchases-return", fd, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			await toast.promise(apiPromise, {
				loading: t("messages.creatingReturn"),
				success: t("messages.createSuccess"),
				error: (err) => err.response?.data?.message || t("messages.createFailed"),
			});

			navigate.push("/purchases/return");
		} catch (error) {
			console.error("Failed to create return:", error);
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

	const watchedPaidAmount = watch("paidAmount");

	const paidAmount = parseFloat(watchedPaidAmount) || 0;
	const totalReturn = (summary.subtotal + summary.taxTotal) - paidAmount;

	return (
		<motion.div
			dir={isRTL ? "rtl" : "ltr"}
			initial={{ opacity: 0, y: 20, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
			className="min-h-screen p-5"
		>

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.returns"), href: "/purchases/return" },
					{ name: t("breadcrumb.createReturnInvoice") },
				]}
				buttons={
					<>
						<Button_
							onClick={handleSubmit(onSubmit)}
							size="sm"
							label={t("actions.save")}
							variant="solid"
							icon={<Save size={18} />}
							disabled={loading}
						/>

						<Button_ size="sm" label={t("actions.howToUse")} tone="ghost" icon={<Info size={18} />} />
					</>
				}
			/>


			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="flex flex-col lg:flex-row gap-6">
					{/* Left Column - Main Form */}
					<div className="flex-1 space-y-6">
						<div className="w-full space-y-6">
							<motion.div
								className="main-card"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 }}
							>
								<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
									{t("sections.returnInfo")}
								</h3>

								<div className="grid md:grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-2">
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
													<SelectTrigger className="w-full rounded-xl !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
														<SelectValue placeholder={t("placeholders.supplierName")} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">{t("placeholders.none") || "None"}</SelectItem>
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
												/>
											)}
										/>
									</div>

									{/* <div className="space-y-2">
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
								</div> */}

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
														<SelectItem value="نقدي">{t("options.safe.cash")}</SelectItem>
														<SelectItem value="الخزينة الرئيسية">{t("options.safe.main")}</SelectItem>
														<SelectItem value="الخزينة الفرعية">{t("options.safe.sub")}</SelectItem>
														<SelectItem value="الخزينة الإضافية">{t("options.safe.extra")}</SelectItem>
													</SelectContent>
												</Select>
											)}
										/>
									</div>
								</div>
							</motion.div>
						</div>
						<motion.div
							className="main-card"
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
						{/* Middle Column - Products */}
						<motion.div
							className="main-card"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.25 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.addProducts")}
							</h3>

							<ProductSkuSearchPopover handleSelectSku={handleSelectSku} selectedSkus={selectSku} closeOnSelect={false} />
							{errors.items && <p className="text-xs text-red-500 mt-2">{errors.items.message}</p>}
						</motion.div>

						<motion.div
							className="main-card"
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
												{t("table.unitCost")}
											</th>
											<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
												{t("table.returnedQuantity")}
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
													<div className="flex flex-col gap-1">
														<div className="flex items-center gap-1">
															<Input
																type="number"
																value={product.unitCost}
																onChange={(e) =>
																	handleProductFieldChange(index, "unitCost", e.target.value)
																}
																className="h-8 w-24"
															/>

															<div className="flex items-center gap-1 text-sm text-gray-600">
																<Tag size={14} className="text-green-600" />
																<span className="font-medium">{formatCurrency(product.originalUnitCost)}</span>
																<span className="text-xs text-gray-400">({t("current_price")})</span>
															</div>
														</div>

														{errors.items?.[index]?.unitCost && (
															<p className="text-[10px] text-red-500 font-medium">
																{errors.items[index].unitCost.message}
															</p>
														)}
													</div>
												</td>

												<td className="p-3">
													<div className="flex flex-col gap-1">
														<div className="flex items-center gap-1">
															<Input
																type="number"
																value={product.returnedQuantity}
																onChange={(e) =>
																	handleProductFieldChange(index, "returnedQuantity", e.target.value)
																}
																max={product.availableQuantity}
																className={cn("h-8 w-20", errors.items?.[index]?.returnedQuantity && "border-red-500")}
															/>
															<div className="flex items-center gap-1 text-sm text-gray-600">
																<Package size={14} className="text-green-600" />
																<span className="font-medium">{product.availableQuantity}</span>
																<span className="text-xs text-gray-400">({t("table.available")})</span>
															</div>
														</div>

														{errors.items?.[index]?.returnedQuantity && (
															<p className="text-[10px] text-red-500 font-medium leading-tight">
																{errors.items[index].returnedQuantity.message}
															</p>
														)}
													</div>
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
													<div className="flex flex-col gap-1">
														<Input
															type="number"
															value={product.taxRate}
															onChange={(e) =>
																handleProductFieldChange(index, "taxRate", e.target.value)
															}
															className="h-8 w-16"
														/>
														{errors.items?.[index]?.taxRate && (
															<p className="text-[10px] text-red-500 font-medium">
																{errors.items[index].taxRate.message}
															</p>
														)}
													</div>
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
					</div>

					{/* Right Column - Summary */}
					<div className="w-full lg:max-w-[350px] space-y-4">
						<ReceiptImageUpload
							t={t}
							isRTL={isRTL}
							image={receiptImage}
							onImageChange={handleImageUpload}
							onRemove={handleRemoveImage}
							ALLOWED_RECEIPT_TYPES={ALLOWED_RECEIPT_TYPES}
							tValidation={tValidation}
						/>
						<ReturnSummary t={t} summary={summary} totalReturn={totalReturn} control={control} formatCurrency={formatCurrency} errors={errors} />
					</div>
				</div>
			</form>
		</motion.div>
	);
}

function ReceiptImageUpload({ image, onImageChange, onRemove, t, isRTL, ALLOWED_RECEIPT_TYPES, tValidation }) {
	const inputRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];
		if (!file) return;

		const okType = ALLOWED_RECEIPT_TYPES.includes(file.type);
		if (!okType) {
			toast.error(tValidation("invalidFileType") || "Invalid file type");
			return;
		}

		const fakeEvent = { target: { files: [file] } };
		onImageChange(fakeEvent);
	};

	return (
		<motion.div
			dir={isRTL ? "rtl" : "ltr"}
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.25 }}
			className="main-card"
		>
			<div
				onDragEnter={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(true);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(true);
				}}
				onDragEnterCapture={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(false);
				}}
				onDrop={handleDrop}
				className={cn(
					"rounded-xl border-2 border-dashed transition-all duration-300",
					isDragging
						? "border-primary bg-primary/5"
						: "border-primary/60 bg-white/40 dark:bg-slate-900/20"
				)}
			>
				<input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onImageChange} />

				{!image ? (
					<div
						onClick={() => inputRef.current?.click()}
						className="p-8 rounded-xl text-center hover:bg-primary/20 duration-300 cursor-pointer"
					>
						<div className="flex flex-col items-center gap-4">
							<div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
								<Upload size={32} className="text-primary" />
							</div>

							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200">
								{t("sections.receiptImage")}
							</h3>
						</div>
					</div>
				) : (
					<div className="p-4">
						<div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800">
							<div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 h-48 flex items-center justify-center">
								{image.isPdf ? (
									<div className="flex flex-col items-center gap-2">
										<FileText size={40} className="text-primary" />
										<span className="text-sm text-gray-700 dark:text-slate-200">PDF</span>
									</div>
								) : (
									<img src={image.preview} alt={t("upload.receiptAlt") || "Receipt"} className="w-full h-48 object-cover" />
								)}
							</div>

							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
						</div>

						<div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
									<FileText size={20} className="text-blue-600 dark:text-blue-400" />
								</div>
								<div className="max-w-[150px]">
									<p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">{image.name}</p>
									<p className="text-xs text-gray-400 uppercase">{image.isPdf ? "PDF" : "IMG"}</p>
								</div>
							</div>

							<motion.button
								type="button"
								onClick={onRemove}
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								className="w-8 h-8 rounded-xl bg-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
							>
								<X size={16} />
							</motion.button>
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}

function ReturnSummary({ summary, t, totalReturn, control, formatCurrency, errors }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.2 }}
			className="main-card sticky top-6"
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
						{formatCurrency(summary.subtotal)}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.taxTotal")}</span>
					<span className="text-base font-semibold text-gray-700 dark:text-slate-200">
						{formatCurrency(summary.taxTotal)}
					</span>
				</div>

				<div className="space-y-2">
					<Label className="text-sm text-gray-600 dark:text-slate-300">
						{t("fields.paidAmount")}
					</Label>
					<Controller
						name="paidAmount"
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								type="number"
								placeholder="0.00"
								className="rounded-xl h-[45px] border-gray-200 dark:border-slate-700"
							/>
						)}
					/>
					{errors.paidAmount && (
						<p className="text-xs text-red-500">{errors.paidAmount.message}</p>
					)}
				</div>

				<div className="flex items-center justify-between p-4 rounded-xl bg-primary/10   border-2 border-primary/20 ">
					<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
						{t("summary.totalReturn")}
					</span>
					<span className="text-xl font-bold text-primary">
						{formatCurrency(totalReturn)}
					</span>
				</div>
			</div>
		</motion.div>
	);
}