"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, X, Upload, Trash2, FileText, Tag } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Button_ from "@/components/atoms/Button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";

import { useLocale, useTranslations } from "next-intl";
import api from "@/utils/api";
import toast from "react-hot-toast";

import { ProductSkuSearchPopover } from "../../../../components/molecules/ProductSkuSearchPopover";


export default function CreatePurchaseInvoicePage() {
	const navigate = useRouter();
	const locale = useLocale();
	const isRTL = locale === "ar";
	const t = useTranslations("purchaseInvoice");
	const tValidation = useTranslations("validation");

	const [receiptImage, setReceiptImage] = useState(null);
	const [suppliers, setSuppliers] = useState([]);
	const [loading, setLoading] = useState(false);

	const MAX_RECEIPT_MB = 5;
	const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

	const schema = useMemo(
		() =>
			yup.object({
				supplierId: yup.string().required(tValidation("supplierRequired")),
				receiptNumber: yup.string().required(tValidation("receiptNumberRequired")),
				safeId: yup.string().required(tValidation("safeRequired")),
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
							variantId: yup.number().required(tValidation("productRequired")),
							quantity: yup
								.number()
								.transform((v, o) => Number(o))
								.min(1, tValidation("quantityMinimum"))
								.required(tValidation("quantityRequired")),
							purchaseCost: yup
								.number()
								.transform((v, o) => Number(o))
								.min(0, tValidation("unitCostPositive"))
								.required(tValidation("unitCostRequired")),
						})
					)
					.min(1, tValidation("itemsRequired")),

			}),
		[tValidation]
	);


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
			supplierId: "",
			receiptNumber: "",
			safeId: "",
			notes: "",
			paidAmount: 0,
			items: [],
			receiptAsset: null,
		}
	});


	const watchedItems = watch("items");
	const watchedPaidAmount = watch("paidAmount");

	// Fetch suppliers
	useEffect(() => {
		(async () => {
			try {
				const res = await api.get("/lookups/suppliers", { params: { limit: 200 } });
				setSuppliers(res.data || []);
			} catch (e) {
				console.error(e);
				toast.error(t("messages.loadSuppliersFailed"));
			}
		})();
	}, [t]);

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
			toast.error(tValidation("fileTooLarge") || "File too large");
			return;
		}

		// لو PDF مش هنعمل preview image
		if (file.type === "application/pdf") {
			const pdfObj = { file, preview: null, name: file.name, isPdf: true };
			setReceiptImage(pdfObj);
			setValue("receiptAsset", pdfObj, { shouldValidate: true });
			clearErrors("receiptAsset");
			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			const obj = { file, preview: reader.result, name: file.name, isPdf: false };
			setReceiptImage(obj);
			setValue("receiptAsset", obj, { shouldValidate: true });
			clearErrors("receiptAsset");
		};
		reader.readAsDataURL(file);
	};


	const handleRemoveImage = () => {
		setReceiptImage(null);
		setValue("receiptAsset", null, { shouldValidate: true });
	};


	const handleDeleteProduct = (index) => {
		const deletedItem = watchedItems[index];

		// Remove from items
		const newItems = watchedItems.filter((_, i) => i !== index);
		setValue("items", newItems);

		// Remove from selected skus so it can be selected again
		setSelectSku((prev) => prev.filter((s) => s.id !== deletedItem.variantId));
	};

	const [selectSku, setSelectSku] = useState([]); // array

	const handleSelectSku = (sku) => {
		// Check if already selected
		if (selectSku.some((s) => s.id === sku.id)) {
			return;
		}

		setSelectSku((prev) => [...prev, sku]);

		// Create new item with default values (no tax fields)
		const newItem = {
			variantId: sku.id,
			quantity: 1,
			purchaseCost: 0,
			sku: sku.sku,
			productName: sku.label || sku.productName,
			price: sku.price,
			attributes: sku.attributes || {},
		};

		setValue("items", [...(watchedItems ?? []), newItem]);
	};

	const handleProductFieldChange = (index, field, value) => {
		const newItems = [...watchedItems];
		newItems[index] = { ...newItems[index], [field]: value };
		setValue("items", newItems);
	};

	const onSubmit = async (data) => {
		setLoading(true);
		try {
			const fd = new FormData();

			fd.append("receiptNumber", data.receiptNumber);
			fd.append("supplierId", String(Number(data.supplierId)));
			fd.append("safeId", String(data.safeId));

			if (data.notes) fd.append("notes", data.notes);
			fd.append("paidAmount", String(Number(data.paidAmount || 0)));

			// items لازم تبقى JSON string
			const items = (data.items || []).map((item) => ({
				variantId: Number(item.variantId),
				quantity: Number(item.quantity),
				purchaseCost: Number(item.purchaseCost),
			}));
			fd.append("items", JSON.stringify(items));

			// receipt file (optional)
			if (receiptImage?.file) {
				// ✅ key لازم اسمه receiptAsset عشان الباك
				fd.append("receiptAsset", receiptImage.file);
			}

			await api.post("/purchases", fd, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			toast.success(t("messages.createSuccess"));
			navigate.push("/purchases");
		} catch (error) {
			console.error("Failed to create purchase:", error);
			toast.error(error.response?.data?.message || t("messages.createFailed"));
		} finally {
			setLoading(false);
		}
	};



	// Calculate summary
	const summary = useMemo(() => {
		const productCount = watchedItems.length;

		let subtotal = 0;

		watchedItems.forEach((item) => {
			const cost = parseFloat(item.purchaseCost) || 0;
			const qty = parseFloat(item.quantity) || 0;
			const lineSubtotal = cost * qty;

			subtotal += lineSubtotal;
		});

		return { productCount, subtotal };
	}, [watchedItems]);

	const total = summary.subtotal;
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
			{/* Header */}
			<div className="bg-card mb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<button
							onClick={() => navigate.push("/purchases")}
							className="text-gray-400 hover:text-primary transition-colors"
						>
							{t("breadcrumb.purchases")}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{t("breadcrumb.createPurchaseInvoice")}</span>
						<span className="mr-3 inline-flex w-3.5 h-3.5 rounded-xl bg-primary" />
					</div>

					<div className="flex items-center gap-4">
						<Button_
							size="sm"
							label={t("actions.howToUse")}
							tone="white"
							variant="solid"
						/>

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
						{/* Form Fields */}
						<motion.div
							className="bg-card"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
						>
							<div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-2">
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
													{suppliers.map((c) => (
														<SelectItem key={c.id} value={String(c.id)}>
															{c.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
									{errors.supplierId && (
										<p className="text-xs text-red-500">{errors.supplierId.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.receiptNumber")} *
									</Label>
									<Controller
										name="receiptNumber"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.receiptNumber")}
												className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
											/>
										)}
									/>
									{errors.receiptNumber && (
										<p className="text-xs text-red-500">{errors.receiptNumber.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("fields.safe")} *
									</Label>
									<Controller
										name="safeId"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-xl !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue placeholder={t("placeholders.safe")} />
												</SelectTrigger>
												<SelectContent className="bg-card-select">
													<SelectItem value="نقدي">{t("options.safe.cash")}</SelectItem>
													<SelectItem value="خزنة 1">{t("options.safe.safe1")}</SelectItem>
													<SelectItem value="خزنة 2">{t("options.safe.safe2")}</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>

									{errors.safeId && (
										<p className="text-xs text-red-500">{errors.safeId.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label className="text-sm text-gray-600 dark:text-slate-300">
										{t("sections.notes")}
									</Label>
									<Controller
										name="notes"
										control={control}
										render={({ field }) => (
											<Input
												{...field}
												placeholder={t("placeholders.notes")}
												className="rounded-xl h-[45px] bg-[#fafafa] dark:bg-slate-800/50"
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
							transition={{ delay: 0.25 }}
						>
							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
								{t("sections.addProducts")}
							</h3>

							<ProductSkuSearchPopover handleSelectSku={handleSelectSku} selectedSkus={selectSku} />
							{errors.items && (
								<p className="text-xs text-red-500 mt-2">{errors.items.message}</p>
							)}
						</motion.div>

						{/* Products Table */}
						{watchedItems.length > 0 && (
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
													{t("table.unitCost")}
												</th>
												<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
													{t("table.quantityCount")}
												</th>
												<th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
													{t("table.invoiceTotal")}
												</th>
												<th className="text-center p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">
													{t("table.actions")}
												</th>
											</tr>
										</thead>
										<tbody>
											{watchedItems.map((product, index) => {
												const unitCost = parseFloat(product.purchaseCost) || 0;
												const quantity = parseFloat(product.quantity) || 0;
												const invoiceTotal = unitCost * quantity;

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
															<div className="flex items-center gap-3">
																{/* Purchase Cost Input */}
																<Input
																	type="number"
																	value={product.purchaseCost}
																	onChange={(e) =>
																		handleProductFieldChange(index, "purchaseCost", e.target.value)
																	}
																	className="h-8 w-24"
																	min="0"
																	step="0.01"
																/>

																{/* Current Price Display */}
																<div className="flex items-center gap-1 text-sm text-gray-600">
																	<Tag size={14} className="text-green-600" />
																	<span className="font-medium">{product.price}</span>
																	<span className="text-xs text-gray-400">({t("current_price")})</span>
																</div>

															</div>
														</td>

														<td className="p-3">
															<Input
																type="number"
																value={product.quantity}
																onChange={(e) =>
																	handleProductFieldChange(index, "quantity", e.target.value)
																}
																className="h-8 w-20"
																min="1"
															/>
														</td>
														<td className="p-3 text-sm font-semibold text-green-600 dark:text-green-400">
															{invoiceTotal.toFixed(2)} {t("currency")}
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

					{/* Right Column - Summary */}
					<div className="w-full space-y-4 max-w-[350px]">
						<ReceiptImageUpload
							t={t}
							isRTL={isRTL}
							image={receiptImage}
							onImageChange={handleImageUpload}
							onRemove={handleRemoveImage}
						/>
						<InvoiceSummary
							errors={errors}
							t={t}
							summary={summary}
							total={total}
							paidAmount={paidAmount}
							remainingAmount={remainingAmount}
							control={control}
						/>
					</div>
				</div>
			</form>
		</motion.div>
	);
}

function ReceiptImageUpload({ image, onImageChange, onRemove, t, isRTL }) {
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
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.25 }}
			className="bg-card"
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
				onDragLeave={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(false);
				}}
				onDrop={handleDrop}
				className={cn(
					"rounded-2xl border-2 border-dashed transition-all duration-300",
					isDragging
						? "border-primary bg-primary/5"
						: "border-primary/60 bg-white/40 dark:bg-slate-900/20"
				)}
			>
				<input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />

				{!image ? (
					<div
						onClick={() => inputRef.current?.click()}
						className="p-8 rounded-md text-center hover:bg-primary/20 duration-300 cursor-pointer"
					>
						<div className="flex flex-col items-center gap-4">
							<div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
								<Upload size={32} className="text-primary" />
							</div>

							<h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 text-right">
								{t("sections.receiptImage")}
							</h3>
						</div>
					</div>
				) : (
					<div className="p-4">
						<div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800">
							<div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 h-48 flex items-center justify-center">
								{image.isPdf ? (
									<div className="flex flex-col items-center gap-2">
										<FileText size={40} className="text-primary" />
										<span className="text-sm text-gray-700 dark:text-slate-200">PDF</span>
									</div>
								) : (
									<img src={image.preview} alt={t("upload.receiptAlt")} className="w-full h-48 object-cover" />
								)}
							</div>

							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
						</div>

						<div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
									<FileText size={20} className="text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700 dark:text-slate-200">{image.name}</p>
									<p className="text-xs text-gray-400">JPG</p>
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

function InvoiceSummary({ errors, summary, t, total, paidAmount, remainingAmount, control }) {
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

				<div className="space-y-2">
					<Label className="text-sm text-gray-600 dark:text-slate-300">{t("summary.paidAmount")}</Label>
					<Controller
						name="paidAmount"
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								type="number"
								placeholder="0"
								className="rounded-xl h-[45px] border-gray-200 dark:border-slate-700"
								min="0"
								step="0.01"
							/>
						)}
					/>

					{errors.paidAmount
						&& (
							<p className="text-xs text-red-500">{errors.paidAmount
								.message}</p>
						)}
				</div>

				<div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
					<span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.invoiceTotal")}</span>
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