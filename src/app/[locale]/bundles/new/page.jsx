// File: bundles/new/page.jsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Plus, Loader2, Trash2, Package, QrCode, Save, BackpackIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import api from '@/utils/api';
import { setDocumentTitle } from '@/utils/documentTitle';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button_ from '@/components/atoms/Button';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ProductSkuSearchPopover } from '@/components/molecules/ProductSkuSearchPopover';
import PageHeader from '@/components/atoms/Pageheader';
import SlugInput, { FieldStatusInfo } from '@/components/atoms/SlugInput';
import { ImageUploadBox } from '@/components/atoms/ImageUploadBox';
import RichTextEditor from '@/components/atoms/RichTextEditor';
import { cn } from '@/utils/cn';

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Unexpected error';
	return Array.isArray(msg) ? msg.join(', ') : String(msg);
}

export function makeId() {
	return crypto.randomUUID();
}

function Field({ label, error, children, className }) {
	return (
		<div className={`space-y-2 ${className || ''}`}>
			{label && <Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{label}</Label>}
			{children}
			{error && <div className="text-xs text-red-600">{error}</div>}
		</div>
	);
}

function slugifyKey(s) {
	return (s || '')
		.toString()
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '_')
		.replace(/[^\w]/g, '')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '');
}

const makeSchema = (t) =>
	yup.object({
		name: yup.string().trim().required(t('validation.nameRequired')).max(200, t('validation.nameTooLong', { max: 200 })),
		slug: yup
			.string()
			.transform((value) => (value ? value.toLowerCase() : value))
			.trim()
			.optional()
			.matches(/^[a-z0-9-_]+$/, t('validation.slugInvalid'))
			.max(300, t('validation.descriptionTooLong', { max: 300 })),
		sku: yup
			.string()
			.required(t('validation.skuRequired'))
			.max(120, t('validation.combinationSkuMax'))
			.matches(/^[a-zA-Z0-9_-]+$/, t('validation.skuFormat')),
		wholesalePrice: yup
			.number()
			.typeError(t('validation.invalidNumber'))
			.required(t('bundles.totalPriceRequired'))
			.min(1, t('validation.priceMin', { min: 1 })),
		description: yup.string().nullable().max(2000, t('validation.descriptionTooLong', { max: 2000 })),
		storeId: yup.string().nullable(),
		categoryId: yup.string().nullable(),
		variant: yup.mixed().nullable(),
		bundleItems: yup
			.array()
			.of(
				yup.object({
					variant: yup.mixed().nullable(),
					variantId: yup.string().required(t('validation.productRequired')),
					qty: yup.number().min(1, t('validation.quantityMinOne')).required(t('validation.quantityRequired')),
				})
			)
			.min(1, t('bundles.atLeastOne'))
			.test('unique-items', t('validation.duplicateItems'), (items) => {
				if (!items) return true;
				const ids = items.map((it) => it.variantId).filter(Boolean);
				return new Set(ids).size === ids.length;
			})
			.default([]),
	});

function defaultValues() {
	return {
		name: '',
		slug: '',
		sku: '',
		wholesalePrice: '',
		description: '',
		storeId: 'none',
		categoryId: 'none',
		variant: null,
		bundleItems: [],
	};
}

export default function AddBundlePage({ isEditMode = false, existingBundle = null, bundleId = null }) {
	const tValidation = useTranslations('validation');
	const t = useTranslations('addProduct');
	const navigate = useRouter();
	const locale = useLocale();

	const [stores, setStores] = useState([]);
	const [categories, setCategories] = useState([]);
	const [storeProviders, setStoreProviders] = useState([]);
	const [skuStatus, setSkuStatus] = useState(null);
	const [slugStatus, setSlugStatus] = useState(null);

	const [mainFiles, setMainFiles] = useState([]);
	const [otherFiles, setOtherFiles] = useState([]);
	const [removedImages, setRemovedImages] = useState([]);
	const [imageErrors, setImageErrors] = useState({
		main: { general: '', specific: {} },
		other: { general: '', specific: {} }
	});

	const schema = React.useMemo(() => makeSchema(t), [t]);

	const {
		control,
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: defaultValues(),
		resolver: yupResolver(schema),
		mode: 'onTouched',
	});

	const watchSku = watch('sku');
	const watchSlug = watch('slug');
	const productName = watch('name');

	const description = useWatch({
		control,
		name: "description",
		defaultValue: defaultValues()?.description || "",
	});

	useEffect(() => {
		const fallbackTitle = isEditMode ? t('breadcrumb.editBundle') : t('breadcrumb.addBundle');
		const nextTitle = (productName || existingBundle?.name || '').toString().trim() || fallbackTitle;
		setDocumentTitle(nextTitle);
	}, [isEditMode, existingBundle?.name, productName, t]);

	useEffect(() => {
		if (!watchSku || errors.sku || isEditMode) {
			setSkuStatus(null);
			return;
		}

		const checkUnique = setTimeout(async () => {
			setSkuStatus('checking');

			try {
				const params = new URLSearchParams({ sku: watchSku.trim() });
				if (bundleId) params.append('bundleId', bundleId);

				const res = await api.get(`/bundles/check-sku?${params.toString()}`);
				setSkuStatus(res.data.isUnique ? 'unique' : 'takenStore');

			} catch (e) {
				setSkuStatus(null);
			}
		}, 280);

		return () => clearTimeout(checkUnique);
	}, [watchSku, errors.sku, isEditMode, bundleId]);

	useEffect(() => {
		if (!watchSlug || errors.slug) { setSlugStatus(null); return; }
		const checkUnique = setTimeout(async () => {
			setSlugStatus('checking');
			try {
				const params = new URLSearchParams({ slug: watchSlug.trim() });
				if (bundleId) params.append('bundleId', bundleId);
				const res = await api.get(`/bundles/check-slug?${params.toString()}`);
				setSlugStatus(res.data.isUnique ? 'unique' : 'takenStore');
			} catch (e) { setSlugStatus(null); }
		}, 280);
		return () => clearTimeout(checkUnique);
	}, [watchSlug, errors.slug, bundleId]);

	const mainVariant = watch('variant');

	const { fields: bundleFields, append: appendBundleItem, remove: removeBundleItem } = useFieldArray({
		control,
		name: 'bundleItems',
		keyName: 'fieldId',
	});

	useEffect(() => {
		async function loadLookups() {
			try {
				const [sts, cats, providers] = await Promise.all([
					api.get("/lookups/stores", { params: { limit: 200 } }),
					api.get("/lookups/categories", { params: { limit: 200 } }),
					api.get("/stores/providers", { params: { limit: 200 } })
				]);
				setStores(sts.data ?? []);
				setCategories(cats.data ?? []);
				setStoreProviders(providers.data?.providers ?? []);
			} catch (err) {
				console.error("Failed to load stores", err);
			}
		}
		loadLookups();
	}, []);

	const filteredStores = React.useMemo(() => {
		return stores;
	}, [stores, storeProviders]);

	useEffect(() => {
		if (filteredStores.length === 1 && !isEditMode) {
			setValue('storeId', String(filteredStores[0].id));
		}
	}, [filteredStores, isEditMode, setValue]);

	// ── Edit mode: populate form + images from existing bundle ──
	useEffect(() => {
		if (!isEditMode || !existingBundle) return;
		reset({
			name: existingBundle.name || '',
			slug: existingBundle.slug || '',
			sku: existingBundle.sku || '',
			wholesalePrice: existingBundle.price || 0,
			description: existingBundle.description || '',
			storeId: existingBundle.storeId ? String(existingBundle.storeId) : 'none',
			categoryId: (existingBundle.categoryId || existingBundle.category?.id) ? String(existingBundle.categoryId || existingBundle.category?.id) : 'none',
			variant: existingBundle.variant || null,
			bundleItems:
				existingBundle.items?.map((item) => ({
					variant: item.variant,
					variantId: item.variant.id,
					qty: item.qty,
				})) || [],
		});

		if (existingBundle.mainImage) {
			setMainFiles([{ id: makeId(), file: null, previewUrl: existingBundle.mainImage, isFromLibrary: false, isExisting: true, url: existingBundle.mainImage }]);
		}
		if (existingBundle.images && existingBundle.images.length) {
			setOtherFiles(existingBundle.images.map((img) => ({ id: makeId(), file: null, previewUrl: img.url, isFromLibrary: false, isExisting: true, url: img.url })));
		}
	}, [isEditMode, existingBundle, reset, stores]);

	useEffect(() => {
		return () => {
			[...mainFiles, ...otherFiles].forEach((f) => f?.previewUrl && !f.isFromLibrary && URL.revokeObjectURL(f.previewUrl));
		};
	}, [mainFiles, otherFiles]);

	// ── Image validation ──
	const getErrors = (files, type) => {
		const maxAllowed = 20;
		let generalError = '';
		let specificErrors = {};
		if (type === 'main' && (!files || files.length === 0)) generalError = t('errors.mainImageRequired');
		if (type === 'other' && files.length > maxAllowed) generalError = t('errors.maxItemsExceeded', { max: 20 });
		if (files && files.length > 0) {
			files.forEach((f) => {
				if (f.isExisting) return;
				const fileObj = f.file;
				if (!fileObj) return;
				if (!fileObj.type.startsWith('image/')) specificErrors[f.id] = t('errors.invalidFileType');
				else if (fileObj.size > 10 * 1024 * 1024) specificErrors[f.id] = t('errors.fileTooLarge', { size: 10 });
			});
		}
		return { maxAllowed, ok: !generalError && Object.keys(specificErrors).length === 0, general: generalError, specific: specificErrors };
	};

	const validateImages = (files, type) => {
		const { general, specific } = getErrors(files, type);
		setImageErrors((prev) => ({ ...prev, [type]: { general, specific } }));
		return !general && Object.keys(specific).length === 0;
	};

	const onSubmit = async (data) => {
		try {
			if (skuStatus == 'takenStore' || skuStatus === 'taken') return;
			if (slugStatus == 'takenStore' || slugStatus === 'taken') return;

			const isOthersValid = validateImages(otherFiles, 'other');
			const isMainValid = validateImages(mainFiles, 'main');
			if (!isMainValid || !isOthersValid) return;

			const anyUploading = [...(mainFiles ?? []), ...(otherFiles ?? [])].some((f) => f && f.uploadStatus === 'uploading');
			const anyUploadFailed = [...(mainFiles ?? []), ...(otherFiles ?? [])].some((f) => f && f.uploadStatus === 'error');
			if (anyUploading) { toast.error('Please wait for images upload to finish'); return; }
			if (anyUploadFailed) { toast.error('Some images failed to upload'); return; }

			const bundlePayload = {
				name: data.name.trim(),
				...(data.slug ? { slug: data.slug.trim() } : {}),
				price: data.wholesalePrice,
				description: data.description,
				...(isEditMode ? {} : { sku: data.sku.trim().toUpperCase() }),
				storeId: data.storeId === 'none' ? null : data.storeId,
				categoryId: data.categoryId === 'none' ? null : data.categoryId,
				items: data.bundleItems.map((item) => ({
					variantId: item.variantId,
					qty: Number(item.qty),
				})),
			};

			// ── Main image ──
			const main = mainFiles[0];
			if (main?.orphanId) {
				bundlePayload.mainImageOrphanId = String(main.orphanId);
			} else if (main?.url && !main.url.startsWith('/uploads') && !main.isExisting) {
				bundlePayload.mainImage = String(main.url);
			}

			// ── Gallery images ──
			const existingImages = (otherFiles || [])
				.filter((f) => f?.isExisting && f?.url && !removedImages.includes(f.url))
				.map((f) => ({ url: String(f.url) }));
			const imagesMeta = (otherFiles || [])
				.filter((f) => f?.isFromLibrary && !f?.isExisting && f?.url)
				.map((f) => ({ url: String(f.url) }));
			const orphanIds = (otherFiles || [])
				.filter((f) => !f?.isExisting && !f?.isFromLibrary && f?.orphanId)
				.map((f) => f.orphanId);

			if (orphanIds.length) bundlePayload.imagesOrphanIds = orphanIds;

			if (isEditMode) {
				bundlePayload.images = [...existingImages, ...imagesMeta];
				if (removedImages.length > 0) bundlePayload.removeImgs = removedImages;
			}

			const apiPromise = isEditMode
				? api.patch(`/bundles/${bundleId}`, bundlePayload)
				: api.post('/bundles', bundlePayload);

			await toast.promise(apiPromise, {
				loading: t('messages.saving'),
				success: isEditMode ? t('messages.updated') : t('messages.created'),
				error: (err) => normalizeAxiosError(err),
			});

			navigate.push('/products?tab=bundles');
		} catch (error) {
			// toast handled above
		}
	};

	const bundleItemsWatch = watch('bundleItems') || [];

	const allSelectedSkus = useMemo(() => {
		return bundleItemsWatch
			.filter(item => item && item.variantId)
			.map(item => ({ id: item.variantId }));
	}, [bundleItemsWatch]);

	const staggerContainer = {
		animate: { transition: { staggerChildren: 0.07 } }
	};
	const fadeUp = {
		initial: { opacity: 0, y: 14 },
		animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
			className="min-h-screen bg-slate-50 dark:bg-slate-950 p-5 pb-16"
		>
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/dashboard" },
					{ name: t("breadcrumb.bundles"), href: "/products?tab=bundles" },
					{ name: isEditMode ? t('breadcrumb.editBundle') : t('breadcrumb.addBundle') }
				]}
				stacky
				buttons={
					<>
						<Button_ onClick={() => navigate.push('/products?tab=bundles')} size="sm" label={t('actions.back')} tone="cancel" variant="ghost" />
						<Button_
							size="sm"
							label={isSubmitting ? t('actions.saving') : t('actions.save')}
							tone="primary"
							variant="solid"
							onClick={handleSubmit(onSubmit)}
							icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
							data-getting-started="product_bundle.save"
							data-getting-started-type="button"
						/>
					</>
				}
			/>

			<form onSubmit={handleSubmit(onSubmit)} data-getting-started="product_bundle_form" data-getting-started-type="page">
				<motion.div
					variants={staggerContainer}
					initial="initial"
					animate="animate"
					className="flex max-xl:flex-col gap-5 mt-5 items-start"
				>
					{/* ── Left Column ── */}
					<div className="space-y-5 flex-1 min-w-0 w-full">

						{/* Bundle Info Card */}
						<motion.div variants={fadeUp}>
							<div className="bg-card rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
								<div className="flex items-center justify-between mb-6">
									<h3 className="text-[15px] font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-3">
										<span className="w-[3px] h-5 bg-primary rounded-full block shrink-0" />
										{t('sections.bundleInfo')}
									</h3>
								</div>
								<p className="text-sm text-muted-foreground mb-6">{t('sections.bundleInfoDescription')}</p>

								<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
									<Field label={t('fields.bundleName')} error={errors?.name?.message}>
										<Input
											{...register('name')}
											placeholder={t('placeholders.bundleName')}
										/>
									</Field>


									<Field label={t('fields.sku')} error={errors?.sku?.message}>
										<Input
											{...register('sku')}
											placeholder={t('placeholders.sku')}
											disabled={isEditMode}
										/>
										<FieldStatusInfo
											name="sku"
											errors={errors}
											value={watchSku}
											status={skuStatus}
											t={t}
										/>
									</Field>
									
									<SlugInput
										errors={errors}
										register={register}
										mainName={existingBundle?.name}
										mainSlug={existingBundle?.slug}
										name={productName}
										slugStatus={slugStatus}
										slug={watchSlug}
										setValue={setValue}
										labelClassName="text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide"
									/>

									<Field label={t('fields.totalPrice')} error={errors?.wholesalePrice?.message}>
										<Input
											type="number"
											{...register('wholesalePrice')}
											placeholder={t('placeholders.totalPrice')}
										/>
									</Field>

									<Field label={t('fields.store')}>
										<Controller
											control={control}
											name="storeId"
											render={({ field }) => (
												<Select value={field.value} onValueChange={field.onChange}>
													<SelectTrigger className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
														<SelectValue placeholder={t('placeholders.store')} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">{t('common.none')}</SelectItem>
														{filteredStores.map((s) => (
															<SelectItem key={s.id} value={String(s.id)}>
																{s.label ?? s.name ?? `#${s.id}`}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
									</Field>

									<Field label={t('fields.category')} error={errors?.categoryId?.message}>
										<Controller
											control={control}
											name="categoryId"
											render={({ field }) => {
												const isOrphan = field.value && field.value !== 'none' && !categories.some(c => String(c.id) === field.value);
												return (
													<Select
														value={field.value || ''}
														onValueChange={(val) => {
															if (!val && field.value && field.value !== 'none') return;
															field.onChange(val);
														}}
													>
														<SelectTrigger className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
															<SelectValue placeholder={t('placeholders.category')} />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">{t('common.none')}</SelectItem>
															{isOrphan && (
																<SelectItem key={field.value} value={field.value}>
																	{field.value}
																</SelectItem>
															)}
															{categories.map((c) => (
																<SelectItem key={c.id} value={String(c.id)}>
																	{c.name || c.label || `#${c.id}`}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												);
											}}
										/>
									</Field>

								<Field label={t('fields.description')} error={errors?.description?.message} className="col-span-full">
									<RichTextEditor
										value={description}
										onChange={(html) =>
											setValue("description", html, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
									/>
								</Field>
								</div>
							</div>
						</motion.div>

						{/* Bundle Items Card */}
						<motion.div variants={fadeUp}>
							<div className="bg-card rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
								<div className="mb-6">
									<div className="flex items-center justify-between">
										<h3 className="text-[15px] font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-3">
											<span className="w-[3px] h-5 bg-primary rounded-full block shrink-0" />
											{t('bundles.title')}
										</h3>
										<Button type="button" onClick={() => appendBundleItem({ variantId: '', variant: null, qty: 1 })} className="rounded-xl text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
											<Plus className="h-4 w-4" />
											{t('bundles.addSku')}
										</Button>
									</div>
									<p className="text-sm text-muted-foreground mt-1">{t('sections.bundleItemsDescription')}</p>
								</div>

								{(errors?.bundleItems?.message || errors.bundleItems?.root?.message) && <div className="text-sm text-red-600 mb-4">{errors.bundleItems?.root?.message || errors.bundleItems?.message}</div>}

								{bundleFields.length === 0 ? (
									<div className="text-center py-12 text-gray-400">
										<Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
										<p className="text-sm">{t('bundles.empty')}</p>
									</div>
								) : (
									<div className="space-y-4">
										{bundleFields.map((field, index) => (
											<div
												key={field.fieldId}
												className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 relative"
											>
												<div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label>{t('bundles.selectSku')}</Label>
														<Controller
															control={control}
															name={`bundleItems.${index}`}
															render={({ field }) => {
																const itemValue = field.value || { variantId: '', variant: null, qty: 1 };
																return (
																	<div className="space-y-2">
																		<ProductSkuSearchPopover
																			selectedSkus={allSelectedSkus}
																			handleSelectSku={(sku) => {
																				setValue(`bundleItems.${index}`, {
																					...itemValue,
																					variantId: sku.id,
																					variant: sku,
																				});
																			}}
																		/>
																		{itemValue.variant && (
																			<div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-dashed">
																				Selected SKU: <span className="font-[Inter] font-medium text-primary">{itemValue.variant.sku}</span>
																			</div>
																		)}
																	</div>
																);
															}}
														/>
														{errors?.bundleItems?.[index]?.variantId && (
															<div className="text-xs text-red-600">{errors.bundleItems[index].variantId.message}</div>
														)}
													</div>

													<div className="space-y-2">
														<Label>{t('bundles.quantity')}</Label>
														<div className="flex gap-2">
															<Input
																type="number"
																{...register(`bundleItems.${index}.qty`)}
																min="1"
																placeholder={t('bundles.quantityPlaceholder')}
															/>
														</div>
														{errors?.bundleItems?.[index]?.qty && (
															<div className="text-xs text-red-600">{errors.bundleItems[index].qty.message}</div>
														)}
													</div>
												</div>

												<Button type="button" variant="ghost" onClick={() => removeBundleItem(index)} className="rounded-xl border-1 border-red-500 cursor-pointer text-red-600 hover:text-white hover:bg-red-500 transition-all mt-7">
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
									</div>
								)}
							</div>
						</motion.div>
					</div>

					{/* ── Right Column (Media) ── */}
					<div className="xl:sticky xl:top-[20px] h-fit space-y-4 w-full xl:max-w-[360px] shrink-0">
						<ImageUploadBox
							title={t('uploads.mainImage')}
							files={mainFiles}
							onFilesChange={(updater) => {
								setMainFiles((prev) => {
									const next = typeof updater === 'function' ? updater(prev) : updater;
									prev.forEach((f) => f?.previewUrl && !f.isFromLibrary && !f.isExisting && URL.revokeObjectURL(f.previewUrl));
									const safeNext = (next ?? []).filter(Boolean);
									const success = safeNext.find((n) => n?.uploadStatus === 'success');
									const others = safeNext.filter((n) => n?.uploadStatus !== 'success');
									return [success, ...others].filter(Boolean);
								});
							}}
							onRemove={(fileToRemove) => {
								if (fileToRemove.isExisting && fileToRemove.url) setRemovedImages((prev) => [...prev, fileToRemove.url]);
							}}
							error={imageErrors.main}
							multiple={false}
							uploadMode="direct"
							setErrors={(errors) => setImageErrors((prev) => ({ ...prev, ["main"]: errors }))}
							getErrors={(next) => getErrors(next, 'main')}
						/>

						<ImageUploadBox
							title={t('uploads.otherImages')}
							files={otherFiles}
							onFilesChange={(updater) => {
								setOtherFiles((prev) => {
									const next = typeof updater === 'function' ? updater(prev) : updater;
									return next ?? [];
								});
							}}
							onRemove={(fileToRemove) => {
								if (fileToRemove.isExisting && fileToRemove.url) setRemovedImages((prev) => [...prev, fileToRemove.url]);
							}}
							error={imageErrors.other}
							multiple={true}
							uploadMode="direct"
							setErrors={(errors) => setImageErrors((prev) => ({ ...prev, ["other"]: errors }))}
							getErrors={(next) => getErrors(next, 'other')}
						/>
					</div>
				</motion.div>
			</form>
		</motion.div>
	);
}
