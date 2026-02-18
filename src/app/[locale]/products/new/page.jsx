// File: products/new/page.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
	ChevronLeft,
	X,
	Plus,
	Image as ImageIcon,
	FileText,
	Loader2,
	Trash2,
	Search,
	UploadCloud,
	Zap,
	Shirt,
	Palette,
	Ruler,
	Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import api from '@/utils/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Button_ from '@/components/atoms/Button';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/utils/cn';
import { useTranslations } from 'next-intl';
import { Textarea } from '../../../../components/ui/textarea';
import { TagInput } from '@/components/atoms/TagInput';
import LANG from '@/components/atoms/LANG';
import { baseImg } from '@/utils/axios';
import { useAutoTranslate } from '@/utils/autoTranslate';
import SlugInput from '@/components/atoms/SlugInput';

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Unexpected error';
	return Array.isArray(msg) ? msg.join(', ') : String(msg);
}

function safeNumberString(v) {
	const t = (v ?? '').toString().trim();
	if (!t) return '';
	const n = Number(t);
	return Number.isFinite(n) ? String(n) : '';
}

function makeId() {
	return crypto.randomUUID();
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

function canonicalKey(attrs) {
	const keys = Object.keys(attrs || {}).sort((a, b) => a.localeCompare(b));
	return keys.map((k) => `${k}=${String(attrs[k])}`).join('|');
}

// ✅ Quick attribute templates
const ATTRIBUTE_TEMPLATES = [
	{
		id: 'size',
		icon: Ruler,
		name: 'الحجم',
		nameEn: 'Size',
		values: ['صغير', 'متوسط'],
		valuesEn: ['Small', 'Medium'],
	},
	{
		id: 'color',
		icon: Palette,
		name: 'اللون',
		nameEn: 'Color',
		values: ['أحمر', 'أزرق', 'أخضر'],
		valuesEn: ['Red', 'Blue', 'Green'],
	},
	{
		id: 'material',
		icon: Shirt,
		name: 'المادة',
		nameEn: 'Material',
		values: ['قطن', 'بوليستر', 'صوف'],
		valuesEn: ['Cotton', 'Polyester', 'Wool'],
	},
	{
		id: 'weight',
		icon: Package,
		name: 'الوزن',
		nameEn: 'Weight',
		values: ['خفيف', 'متوسط', 'ثقيل'],
		valuesEn: ['Light', 'Medium', 'Heavy'],
	},
];

// ✅ Build combinations with auto-generated SKU
function buildCombinationsFromAttributes(attributes, productName = '', defaultPrice = '') {
	const usable = (attributes || [])
		.map((attr) => {
			const key = slugifyKey(attr?.name);
			const values = (attr?.values || [])
				.map((v) => ({
					value: slugifyKey(v),
					label: (v || '').trim(),
				}))
				.filter((v) => v.value);
			return { key, name: (attr?.name || '').trim(), values };
		})
		.filter((attr) => attr.key && attr.values.length > 0);

	if (!usable.length) return [];

	let acc = [{ attrs: {} }];

	for (const attr of usable) {
		const next = [];
		for (const base of acc) {
			for (const val of attr.values) {
				next.push({
					attrs: { ...base.attrs, [attr.key]: val.value },
				});
			}
		}
		acc = next;
	}

	return acc.map((x) => {
		const key = canonicalKey(x.attrs);

		// ✅ Auto-generate SKU: PRODUCTNAME-ATTR1-ATTR2
		const productSlug = slugifyKey(productName).substring(0, 10).toUpperCase() || 'PRODUCT';
		const attrValues = Object.values(x.attrs)
			.map((v) => slugifyKey(v).substring(0, 3).toUpperCase())
			.join('-');
		const autoSKU = attrValues ? `${productSlug}-${attrValues}` : '';

		return {
			key,
			attributes: x.attrs,
			sku: autoSKU,
			stockOnHand: 0,
			price: defaultPrice || '',
		};
	});
}

const makeSchema = (t) =>
	yup
		.object({
			name: yup.string().trim().required(t('validation.nameRequired')),
			slug: yup
				.string()
				.trim()
				.required(t('validation.slugRequired'))
				.matches(/^[a-z0-9-]+$/, t('validation.slugInvalid')),
			wholesalePrice: yup
				.string()
				.nullable()
				.test('is-num', t('validation.invalidNumber'), (v) => !v || Number.isFinite(Number(v))),

			lowestPrice: yup
				.string()
				.nullable()
				.test('is-num', t('validation.invalidNumber'), (v) => !v || Number.isFinite(Number(v))),

			storageRack: yup.string().nullable(),
			categoryId: yup.string().nullable(),
			storeId: yup.string().nullable(),
			warehouseId: yup.string().nullable(),
			description: yup.string().nullable(),

			callCenterProductDescription: yup.string().nullable(),

			upsellingEnabled: yup.boolean().default(false),
			upsellingProducts: yup
				.array()
				.of(
					yup.object({
						productId: yup.string().trim().required(t('validation.upsellProductRequired')),
						label: yup.string().nullable(),
						callCenterDescription: yup.string().nullable(),
					})
				)
				.default([]),

			attributes: yup
				.array()
				.of(
					yup.object({
						id: yup.string().required(),
						name: yup.string().trim().required(t('validation.attributeNameRequired')),
						values: yup
							.array()
							.of(yup.string().trim().required(t('validation.attributeValueRequired')))
							.min(1, t('validation.atLeastOneValue')),
					})
				)
				.default([]),

			combinations: yup
				.array()
				.of(
					yup.object({
						key: yup.string().trim().required(t('validation.combinationKeyRequired')),
						sku: yup.string().trim().max(120, t('validation.combinationSkuMax')).nullable(),
						attributes: yup.object().required(t('validation.combinationAttrsRequired')),
						stockOnHand: yup
							.number()
							.typeError(t('validation.invalidNumber'))
							.min(0, t('validation.stockNonNegative'))
							.default(0),
						price: yup
							.string()
							.required(t('validation.priceRequired'))
							.test('is-num', t('validation.invalidNumber'), (v) => v && Number.isFinite(Number(v))),
					})
				)
				.default([]),
		})
		.required();

function defaultAttribute() {
	return {
		id: makeId(),
		name: '',
		values: [],
	};
}

function defaultValues() {
	return {
		name: '',
		slug: '',
		wholesalePrice: '',
		lowestPrice: '',
		storageRack: '',
		categoryId: '',
		storeId: '',
		warehouseId: '',
		description: '',
		callCenterProductDescription: '',

		upsellingEnabled: false,
		upsellingProducts: [],

		attributes: [],
		combinations: [],
	};
}

function extractAttributesFromSkus(skus) {
	if (!skus || !skus.length) return [];

	const attributeMap = new Map();

	skus.forEach((sku) => {
		const attrs = sku.attributes || {};
		Object.entries(attrs).forEach(([key, value]) => {
			if (!attributeMap.has(key)) {
				attributeMap.set(key, new Set());
			}
			attributeMap.get(key).add(value);
		});
	});

	return Array.from(attributeMap.entries()).map(([name, valuesSet]) => ({
		id: makeId(),
		name,
		values: Array.from(valuesSet),
	}));
}

export default function AddProductPage({ isEditMode = false, existingProduct = null, productId = null }) {
	const t = useTranslations('addProduct');

	const navigate = useRouter();

	const [categories, setCategories] = useState([]);
	const [stores, setStores] = useState([]);
	const [warehouses, setWarehouses] = useState([]);

	const [mainFiles, setMainFiles] = useState([]);
	const [otherFiles, setOtherFiles] = useState([]);
	const [removedImages, setRemovedImages] = useState([]);

	const schema = useMemo(() => makeSchema(t), [t]);

	const {
		control,
		register,
		handleSubmit,
		setValue,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: defaultValues(),
		resolver: yupResolver(schema),
		mode: 'onTouched',
	});

	const upsellingEnabled = watch('upsellingEnabled');
	const productName = watch('name');


	const wholesalePrice = watch('wholesalePrice');
	const attributesWatch = useWatch({ control, name: 'attributes' });
	const combinationsWatch = useWatch({ control, name: 'combinations' });

	const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({
		control,
		name: 'attributes',
		keyName: 'fieldId',
	});

	const { fields: comboFields } = useFieldArray({
		control,
		name: 'combinations',
		keyName: 'fieldId',
	});

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const [catsRes, storesRes, whRes] = await Promise.all([
					api.get('/lookups/categories', { params: { limit: 200 } }),
					api.get('/lookups/stores', { params: { limit: 200, isActive: true } }),
					api.get('/lookups/warehouses', { params: { limit: 200, isActive: true } }),
				]);
				if (!mounted) return;
				setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
				setStores(Array.isArray(storesRes.data) ? storesRes.data : []);
				setWarehouses(Array.isArray(whRes.data) ? whRes.data : []);
			} catch (e) {
				toast.error(normalizeAxiosError(e));
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	// ✅ CRITICAL FIX: Regenerate SKUs when name changes, update price default on blur
	const lastCombSigRef = useRef('');
	useEffect(() => {
		const attributes = attributesWatch || [];
		const currentName = productName || '';
		const currentPrice = wholesalePrice || '';

		const sig = JSON.stringify({
			attributes: (attributes || []).map((a) => ({
				name: a?.name,
				values: a?.values || [],
			})),
			productName: currentName,
			wholesalePrice: currentPrice,
		});

		if (lastCombSigRef.current === sig) return;
		lastCombSigRef.current = sig;

		const currentCombos = watch('combinations') || [];
		const generated = buildCombinationsFromAttributes(attributes, currentName, currentPrice);

		const byKey = new Map(currentCombos.map((c) => [c.key, c]));

		const next = generated.map((g) => {
			const old = byKey.get(g.key);
			return {
				...g,
				sku: g.sku, // ✅ Always regenerate SKU from current name
				stockOnHand: old?.stockOnHand ?? g.stockOnHand ?? 0,
				price: old?.price && old.price !== '' ? old.price : g.price, // ✅ Keep edited or use default
			};
		});

		setValue('combinations', next, { shouldDirty: true, shouldValidate: false });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [attributesWatch, productName, wholesalePrice]);

	useEffect(() => {
		return () => {
			[...mainFiles, ...otherFiles].forEach((f) => f?.previewUrl && !f.isFromLibrary && URL.revokeObjectURL(f.previewUrl));
		};
	}, [mainFiles, otherFiles]);

	const addQuickTemplate = (template) => {
		const newAttr = {
			id: makeId(),
			name: template.nameEn,
			values: template.valuesEn,
		};
		appendAttribute(newAttr);
		toast.success(`تمت إضافة ${template.name}`);
	};

	// ✅ Handle wholesale price blur - update all empty variant prices
	const handleWholesalePriceBlur = () => {
		const currentPrice = wholesalePrice || '';
		const currentCombos = watch('combinations') || [];

		const updated = currentCombos.map((combo) => ({
			...combo,
			price: combo.price && combo.price !== '' ? combo.price : currentPrice,
		}));

		setValue('combinations', updated, { shouldDirty: true, shouldValidate: false });
	};

	const onSubmit = async (data) => {
		try {
			if (!mainFiles.length) {
				toast.error(t('errors.mainImageRequired'));
				return;
			}

			// ✅ Validate all combinations have prices
			if (data.combinations && data.combinations.length > 0) {
				const missingPrices = data.combinations.filter((c) => !c.price || c.price === '');
				if (missingPrices.length > 0) {
					toast.error(t('errors.missingPrices'));
					return;
				}
			}

			const fd = new FormData();
			fd.append('name', data.name.trim());
			fd.append('type', 'PRODUCT');

			const wp = safeNumberString(data.wholesalePrice);
			if (wp !== '') fd.append('wholesalePrice', wp);

			const lp = safeNumberString(data.lowestPrice);
			if (lp !== '') fd.append('lowestPrice', lp);

			if ((data.storageRack ?? '').trim()) fd.append('storageRack', data.storageRack.trim());
			if ((data.slug ?? '').trim()) fd.append('slug', data.slug.trim());

			if (data.categoryId && data.categoryId !== 'none') fd.append('categoryId', data.categoryId);
			if (data.storeId && data.storeId !== 'none') fd.append('storeId', data.storeId);
			if (data.warehouseId && data.warehouseId !== 'none') fd.append('warehouseId', data.warehouseId);

			if ((data.description ?? '').trim()) fd.append('description', data.description.trim());
			if ((data.callCenterProductDescription ?? '').trim())
				fd.append('callCenterProductDescription', data.callCenterProductDescription.trim());

			fd.append('upsellingEnabled', data.upsellingEnabled ? 'true' : 'false');

			const upsellingProducts = (data.upsellingProducts ?? [])
				.filter((x) => x?.productId)
				.map((x) => ({
					productId: String(x.productId),
					label: (x.label ?? '').toString().trim() || undefined,
					callCenterDescription: (x.callCenterDescription ?? '').toString().trim() || undefined,
				}));
			fd.append('upsellingProducts', JSON.stringify(upsellingProducts));

			// ✅ Handle main image
			const main = mainFiles[0];
			if (main?.file) {
				fd.append('mainImage', main.file);
			} else if (main?.url && !main.url.startsWith('/uploads') && !main.isExisting) {
				fd.append('mainImage', String(main.url));
			}

			// ✅ Handle other images
			const existingImages = (otherFiles || [])
				.filter((f) => f?.isExisting && f?.url && !removedImages.includes(f.url))
				.map((f) => ({ url: String(f.url) }));

			const imagesMeta = (otherFiles || [])
				.filter((f) => f?.isFromLibrary && !f?.isExisting && f?.url)
				.map((f) => ({ url: String(f.url) }));

			if (isEditMode) {
				fd.append('imagesMeta', JSON.stringify([...existingImages, ...imagesMeta]));
			} else {
				if (imagesMeta.length) {
					fd.append('imagesMeta', JSON.stringify(imagesMeta));
				}
			}

			if (isEditMode && removedImages.length > 0) {
				fd.append('removedImages', JSON.stringify(removedImages));
			}

			(otherFiles ?? []).forEach((f) => {
				if (!f) return;
				if (f.isFromLibrary || f.isExisting) return;
				if (f.file) fd.append('images', f.file);
			});
			if (!isEditMode) {
				fd.append('combinations', JSON.stringify([...data.combinations]));
			}

			const apiCall = isEditMode
				? api.patch(`/products/${productId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
				: api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

			await toast.promise(apiCall, {
				loading: t('messages.saving'),
				success: isEditMode ? t('messages.updated') : t('messages.created'),
				error: (err) => normalizeAxiosError(err),
			});

			// ✅ Update SKUs if in edit mode
			if (isEditMode && data.combinations && data.combinations.length > 0) {
				const combinationsPayload = data.combinations.map((c) => ({
					key: c.key,
					sku: (c.sku ?? '').toString().trim() || null,
					attributes: c.attributes ?? {},
					price: safeNumberString(c.price) || null,
				}));

				await api.put(`/products/${productId}/skus`, {
					items: combinationsPayload,
				});
			}



			navigate.push('/products');
		} catch (error) {
			toast.error(normalizeAxiosError(error));
		}
	};

	useEffect(() => {
		if (!isEditMode || !existingProduct) return;

		const extractedAttributes = extractAttributesFromSkus(existingProduct.skus || []);

		const combinations = (existingProduct.skus || []).map((sku) => ({
			key: sku.key,
			sku: sku.sku || '',
			attributes: sku.attributes || {},
			stockOnHand: sku.stockOnHand || 0,
			price: sku.price?.toString() || existingProduct.wholesalePrice?.toString() || '',
		}));

		reset({
			name: existingProduct.name || '',
			slug: existingProduct.slug || '',
			wholesalePrice: existingProduct.wholesalePrice?.toString() || '',
			lowestPrice: existingProduct.lowestPrice?.toString() || '',
			storageRack: existingProduct.storageRack || '',
			categoryId: existingProduct.categoryId ? String(existingProduct.categoryId) : 'none',
			storeId: existingProduct.storeId ? String(existingProduct.storeId) : 'none',
			warehouseId: existingProduct.warehouseId ? String(existingProduct.warehouseId) : 'none',
			description: existingProduct.description || '',
			callCenterProductDescription: existingProduct.callCenterProductDescription || '',
			upsellingEnabled: existingProduct.upsellingEnabled || false,
			upsellingProducts: existingProduct.upsellingProducts || [],
			attributes: extractedAttributes,
			combinations: combinations,
		});

		if (existingProduct.mainImage) {
			setMainFiles([
				{
					id: makeId(),
					file: null,
					previewUrl: existingProduct.mainImage,
					isFromLibrary: false,
					isExisting: true,
					url: existingProduct.mainImage,
				},
			]);
		}

		if (existingProduct.images && existingProduct.images.length) {
			setOtherFiles(
				existingProduct.images.map((img) => ({
					id: makeId(),
					file: null,
					previewUrl: img.url,
					isFromLibrary: false,
					isExisting: true,
					url: img.url,
				}))
			);
		}
	}, [isEditMode, existingProduct, reset]);


	const [slugStatus, setSlugStatus] = useState(null); // 'checking', 'unique', 'taken'

	const watchSlug = watch('slug');
	const storeId = watch('storeId');
	useEffect(() => {
		if (!watchSlug || errors.slug) {
			setSlugStatus(null);
			return;
		}

		const checkUnique = setTimeout(async () => {
			setSlugStatus('checking');
			try {
				const params = new URLSearchParams({ slug: watchSlug.trim() }); // [2025-12-24] Remember to trim.

				if (storeId) params.append('storeId', storeId);
				if (productId) params.append('productId', productId);

				const res = await api.get(`/products/check-slug?${params.toString()}`);

				setSlugStatus(res.data.isUnique ? 'unique' : 'takenStore');
			} catch (e) {
				setSlugStatus(null);
			}
		}, 280); // Debounce للتحقق من التوفر

		return () => clearTimeout(checkUnique);
	}, [watchSlug, errors.slug, productId]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
			className="min-h-screen p-6"
		>

			<div className="duration-300 !p-4 !sticky top-[80px] z-[10] bg-card mb-6 rounded-2xl shadow-sm">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t('breadcrumb.home')}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<button type="button" onClick={() => navigate.push('/products')} className="text-gray-400 hover:text-primary transition-colors">
							{t('breadcrumb.products')}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{isEditMode ? t('breadcrumb.editProduct') : t('breadcrumb.addProduct')}</span>
						<span className="mr-3 inline-flex w-3.5 h-3.5 rounded-md bg-primary" />
					</div>

					<div className="flex items-center gap-4">
						<Button_ onClick={() => navigate.push('/products')} size="sm" label={t('actions.back')} tone="white" variant="solid" />
						<Button_
							size="sm"
							label={isSubmitting ? t('actions.saving') : t('actions.save')}
							tone="purple"
							variant="solid"
							onClick={handleSubmit(onSubmit)}
							icon={isSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : null}
						/>
					</div>
				</div>

				{errors?.name?.message && <div className="mt-3 text-sm text-red-600">{errors.name.message}</div>}
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="flex gap-6">
					<div className="space-y-6 w-full">
						{/* Product Info */}
						<motion.div className="bg-card rounded-2xl shadow-sm p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
							<h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
								<div className="w-1 h-6 bg-primary rounded-full" />
								{t('sections.productInfo')}
							</h3>

							<div className="space-y-5 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.productName')}</Label>
									<Input
										{...register('name')}
										placeholder={t('placeholders.productName')}
										className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
									/>
									{errors?.name?.message && <div className="text-xs text-red-600">{errors.name.message}</div>}
								</div>

								<SlugInput errors={errors} register={register} name={productName} slugStatus={slugStatus} slug={watchSlug} setValue={setValue}
									labelClassName="text-sm font-semibold text-gray-600 dark:text-slate-300"
									className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20" />

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.wholesalePrice')}</Label>
									<Input
										type="number"
										step="0.01"
										{...register('wholesalePrice')}
										onBlur={handleWholesalePriceBlur}
										placeholder={t('placeholders.wholesalePrice')}
										className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
									/>
									{errors?.wholesalePrice?.message && <div className="text-xs text-red-600">{errors.wholesalePrice.message}</div>}
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.lowestPrice')}</Label>
									<Input
										type="number"
										step="0.01"
										{...register('lowestPrice')}
										placeholder={t('placeholders.lowestPrice')}
										className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
									/>
									{errors?.lowestPrice?.message && <div className="text-xs text-red-600">{errors.lowestPrice.message}</div>}
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.storageRack')}</Label>
									<Input
										{...register('storageRack')}
										placeholder={t('placeholders.storageRack')}
										className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.category')}</Label>
									<Controller
										control={control}
										name="categoryId"
										render={({ field }) => (
											<Select value={field.value || ''} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-xl !h-[50px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue placeholder={t('placeholders.category')} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">{t('common.none')}</SelectItem>
													{categories.map((c) => (
														<SelectItem key={c.id} value={String(c.id)}>
															{c.label ?? c.name ?? `#${c.id}`}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.store')}</Label>
									<Controller
										control={control}
										name="storeId"
										render={({ field }) => (
											<Select value={field.value || ''} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-xl !h-[50px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue placeholder={t('placeholders.store')} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">{t('common.none')}</SelectItem>
													{stores.map((s) => (
														<SelectItem key={s.id} value={String(s.id)}>
															{s.label ?? s.name ?? `#${s.id}`}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.warehouse')}</Label>
									<Controller
										control={control}
										name="warehouseId"
										render={({ field }) => (
											<Select value={field.value || ''} onValueChange={field.onChange}>
												<SelectTrigger className="w-full rounded-xl !h-[50px] bg-[#fafafa] dark:bg-slate-800/50">
													<SelectValue placeholder={t('placeholders.warehouse')} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">{t('common.none')}</SelectItem>
													{warehouses.map((w) => (
														<SelectItem key={w.id} value={String(w.id)}>
															{w.label ?? w.name ?? `#${w.id}`}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.description')}</Label>
									<Textarea
										{...register('description')}
										placeholder={t('placeholders.description')}
										className="rounded-xl min-h-[100px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
									/>
								</div>
							</div>
						</motion.div>

						{/* Attributes */}
						<motion.div className="bg-card rounded-2xl shadow-sm p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
									<div className="w-1 h-6 bg-primary rounded-full" />
									{t('attributes.title')}
								</h3>
								<Button type="button" onClick={() => appendAttribute(defaultAttribute())} className="rounded-xl text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
									<Plus className="h-4 w-4 " />
									{t('attributes.addCustom')}
								</Button>
							</div>

							{/* Quick Templates */}
							<div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
								<div className="flex items-center gap-2 mb-3">
									<Zap className="h-5 w-5 text-primary" />
									<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('attributes.quickAdd')}</span>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
									{ATTRIBUTE_TEMPLATES.map((template) => {
										const Icon = template.icon;
										return (
											<button
												key={template.id}
												type="button"
												onClick={() => addQuickTemplate(template)}
												className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-primary hover:shadow-md transition-all group"
											>
												<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
													<Icon className="h-5 w-5 text-primary" />
												</div>
												<div className="text-right flex-1">
													<div className="text-sm font-semibold text-gray-700 dark:text-slate-200">{template.name}</div>
													<div className="text-xs text-gray-500">
														{template.values.length} {t('attributes.values')}
													</div>
												</div>
											</button>
										);
									})}
								</div>
							</div>

							{errors?.attributes?.message && <div className="text-sm text-red-600 mb-4">{errors.attributes.message}</div>}

							<div className="space-y-4">
								{attributeFields.length === 0 ? (
									<div className="text-center py-12 text-gray-400">
										<Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
										<p className="text-sm">{t('attributes.empty')}</p>
									</div>
								) : (
									attributeFields.map((af, aIndex) => {
										const aErr = errors?.attributes?.[aIndex];

										return <AttributeEditor key={af.fieldId} t={t} control={control} register={register} errors={aErr} aIndex={aIndex} onRemove={() => removeAttribute(aIndex)} setValue={setValue} />;
									})
								)}
							</div>
						</motion.div>

						{/* Combinations */}
						{comboFields.length > 0 && (
							<motion.div className="bg-card rounded-2xl shadow-sm p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
								<div className="flex items-center justify-between mb-6">
									<h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
										<div className="w-1 h-6 bg-primary rounded-full" />
										{t('combinations.title')}
									</h3>
									<Badge variant="secondary" className="rounded-xl px-4 py-2 text-sm font-semibold">
										{t('combinations.count')}: <span className="font-[Inter]">{comboFields.length}</span>
									</Badge>
								</div>

								{comboFields.length === 0 ? (
									<div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-xl">
										<Package className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
										<p className="text-sm text-slate-500">{t('combinations.empty')}</p>
									</div>
								) : (
									<div className="overflow-x-auto max-h-[580px] h-full overflow-auto ltr:rounded-[10px_0_0_10px] rtl:rounded-[0_10px_10px_0] border border-slate-200 dark:border-slate-700">
										<table className="w-full">
											<thead className="bg-gradient-to-r from-primary/10 to-primary/5">
												<tr>
													<th className="text-right p-4 text-sm font-bold text-gray-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">{t('combinations.combinationName')}</th>
													<th className="text-right font-[Inter] p-4 text-sm font-bold text-gray-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">SKU</th>
													<th className="text-right w-[120px] p-4 text-sm font-bold text-gray-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
														{t('combinations.price')} *
													</th>
												</tr>
											</thead>
											<tbody>
												{comboFields.map((c, idx) => {
													const cErr = errors?.combinations?.[idx];
													const current = combinationsWatch?.[idx];
													const attrs = current?.attributes || {};

													return (
														<tr key={c.fieldId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
															<td className="p-4">
																<input type="hidden" {...register(`combinations.${idx}.key`)} />
																<input type="hidden" {...register(`combinations.${idx}.attributes`)} />

																<div className="flex items-center gap-1 flex-wrap">
																	{Object.entries(attrs).map(([key, value]) => (
																		<div key={key} className="flex items-center gap-2">
																			<LANG className="px-1 py-[2px] rounded-lg bg-primary/15 text-primary border border-primary/30 text-xs">{value}</LANG>
																		</div>
																	))}
																</div>
															</td>

															<td className="p-4">
																<Input
																	{...register(`combinations.${idx}.sku`)}
																	placeholder={t('combinations.placeholders.sku')}
																	disabled
																	className="rounded-lg font-[Inter] h-[42px] bg-gray-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm cursor-not-allowed"
																/>
																{cErr?.sku?.message && <div className="text-xs text-red-600 mt-1">{cErr.sku.message}</div>}
															</td>

															<td className="p-4">
																<Input
																	type="number"
																	step="0.01"
																	{...register(`combinations.${idx}.price`)}
																	placeholder={t('combinations.placeholders.price')}
																	className="rounded-lg h-[42px] font-[Inter] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
																/>
																{cErr?.price?.message && <div className="text-xs text-red-600 mt-1">{cErr.price.message}</div>}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}
							</motion.div>
						)}

						{/* Upselling */}
						<motion.div className="bg-card rounded-2xl shadow-sm p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
							<h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
								<div className="w-1 h-6 bg-primary rounded-full" />
								{t('sections.upselling')}
							</h3>

							<div className="space-y-5">
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('upsell.callCenterDesc')}</Label>
									<Input
										{...register('callCenterProductDescription')}
										placeholder={t('placeholders.callCenterDesc')}
										className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
									/>
								</div>

								<div className="space-y-2">
									<Controller
										control={control}
										name="upsellingEnabled"
										render={({ field }) => (
											<div className="flex items-center space-x-2">
												<Checkbox checked={field.value} onCheckedChange={field.onChange} id="upselling-enabled" />
												<label htmlFor="upselling-enabled" className="text-sm font-medium leading-none cursor-pointer">
													{t('upsell.enableUpselling')}
												</label>
											</div>
										)}
									/>
								</div>

								{upsellingEnabled && (
									<UpsellProductSelector
										t={t}
										value={watch('upsellingProducts') || []}
										onChange={(next) => setValue('upsellingProducts', next, { shouldValidate: true, shouldDirty: true })}
									/>
								)}
							</div>
						</motion.div>

						<button type="submit" className="hidden" />
					</div>

					{/* uploads */}
					<div className="sticky top-[180px] h-fit space-y-6 w-full max-w-[550px] max-xl:max-w-[400px]">
						<ImageUploadBox
							t={t}
							title={t('uploads.mainImage')}
							files={mainFiles}
							onFilesChange={(next) => {
								mainFiles.forEach((f) => f?.previewUrl && !f.isFromLibrary && !f.isExisting && URL.revokeObjectURL(f.previewUrl));
								setMainFiles(next.slice(0, 1));
							}}
							onRemove={(fileToRemove) => {
								if (fileToRemove.isExisting && fileToRemove.url) {
									setRemovedImages((prev) => [...prev, fileToRemove.url]);
								}
							}}
							multiple={false}
						/>

						<ImageUploadBox
							t={t}
							title={t('uploads.otherImages')}
							files={otherFiles}
							onFilesChange={setOtherFiles}
							onRemove={(fileToRemove) => {
								if (fileToRemove.isExisting && fileToRemove.url) {
									setRemovedImages((prev) => [...prev, fileToRemove.url]);
								}
							}}
							multiple={true}
						/>
					</div>
				</div>
			</form>
		</motion.div>
	);
}

/** Attribute Editor */
function AttributeEditor({ t, control, register, errors, aIndex, onRemove, setValue }) {
	const valuesWatch = useWatch({ control, name: `attributes.${aIndex}.values` }) || [];

	return (
		<motion.div
			initial={{ opacity: 0, y: 10, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.25 }}
			className="rounded-2xl shadow-md border-2 border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/50 dark:to-slate-800/50 p-5"
		>
			<div className="flex items-center justify-between mb-4">
				<div className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
					<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{aIndex + 1}</div>
					{t('attributes.attribute')}
				</div>

				<Button type="button" variant="ghost" title={t('attributes.deleteAttribute')} onClick={onRemove} className="rounded-md border-1 border-red-500 cursor-pointer text-red-600 hover:text-white hover:bg-red-500 transition-all">
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>

			<input type="hidden" {...register(`attributes.${aIndex}.id`)} />

			<div className="space-y-4 grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('attributes.name')}</Label>
					<Input
						{...register(`attributes.${aIndex}.name`)}
						placeholder={t('attributes.placeholders.name')}
						className="rounded-xl h-[50px] bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 font-semibold"
					/>
					{errors?.name?.message && <div className="text-xs text-red-600">{errors.name.message}</div>}
				</div>

				<TagInput label={t('attributes.values')} tags={valuesWatch} onTagsChange={(newTags) => setValue(`attributes.${aIndex}.values`, newTags, { shouldValidate: true, shouldDirty: true })} placeholder={t('attributes.placeholders.value')} />

				{errors?.values?.message && <div className="text-xs text-red-600">{errors.values.message}</div>}
			</div>
		</motion.div>
	);
}

function UpsellProductSelector({ t, value, onChange }) {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');

	const selectedIds = (value || []).map((x) => String(x.productId));

	useEffect(() => {
		loadProducts();
	}, []);

	const loadProducts = async () => {
		setLoading(true);
		try {
			const response = await api.get('/products', { params: { limit: 100 } });
			const list = Array.isArray(response.data?.records) ? response.data.records : Array.isArray(response.data) ? response.data : [];
			setProducts(list);
		} catch (error) {
			toast.error(t('upsell.failedToLoad'));
		} finally {
			setLoading(false);
		}
	};

	const filteredProducts = products.filter((p) => !selectedIds.includes(String(p.id)) && (search ? p.name?.toLowerCase().includes(search.toLowerCase()) : true));

	const addProduct = (product) => {
		const next = [
			...(value || []),
			{
				...product,
				productId: String(product.id),
				label: product.name || `#${product.id}`,
				callCenterDescription: '',
			},
		];
		onChange(next);
	};

	const removeProduct = (productId) => {
		onChange((value || []).filter((x) => String(x.productId) !== String(productId)));
	};

	const updateDesc = (productId, desc) => {
		onChange((value || []).map((x) => (String(x.productId) === String(productId) ? { ...x, callCenterDescription: desc } : x)));
	};

	const selectedProducts = (value || []).map((x) => {
		const p = products.find((pp) => String(pp.id) === String(x.productId));
		return {
			...x,
			name: p?.name || x.label || `#${x.productId}`,
		};
	});

	const getImg = (p) => p?.mainImage || p?.images?.[0]?.url || '';

	const safeText = (v) => (v == null || v === '' ? '—' : String(v));

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('upsell.selectProducts')}</Label>

				<div className="relative">
					<div className="flex items-center gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder={t('upsell.searchProducts')}
								className="pl-10 rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>

					{search && (
						<div className="absolute z-10 bottom-[calc(100%+10px)] w-full mt-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl">
							<div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700">
								<div className="text-xs text-slate-500">
									{t('upsell.searchResultsCount')}: <span className="font-semibold">{filteredProducts.length}</span>
								</div>
								<div className="text-xs text-slate-400">{t('upsell.clickToSelect')}</div>
							</div>

							<div className="max-h-72 overflow-y-auto">
								{false ? (
									<div className="p-6 text-center text-slate-500">
										<Loader2 className="w-5 h-5 animate-spin mx-auto" />
										<div className="mt-2 text-xs">{t('upsell.loading')}</div>
									</div>
								) : filteredProducts.length === 0 ? (
									<div className="p-6 text-center text-slate-500">
										<div className="text-sm font-medium">{t('upsell.noResults')}</div>
										<div className="text-xs mt-1">{t('upsell.tryDifferent')}</div>
									</div>
								) : (
									filteredProducts.map((product) => {
										const img = getImg(product);
										return (
											<button
												key={product.id}
												type="button"
												onClick={() => {
													addProduct(product);
													setSearch('');
												}}
												className={['w-full text-left', 'px-4 py-3', 'hover:bg-slate-50 dark:hover:bg-slate-700/60', 'transition-colors', 'border-b border-slate-100 dark:border-slate-700 last:border-0', 'focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/60'].join(' ')}
											>
												<div className="flex items-start gap-3">
													<div className="shrink-0 w-11 h-11 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700">
														{img ? <img src={baseImg + img} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">N/A</div>}
													</div>

													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<div className="font-semibold text-slate-900 dark:text-white truncate">{safeText(product.name)}</div>

															<span className="font-[Inter] shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200">ID: {product.id}</span>
														</div>

														<div className="rtl:text-right ltr:text-left mt-1 text-xs text-slate-500 dark:text-slate-300 truncate">
															{safeText(product.category?.name)} • {safeText(product.store?.name)} • {safeText(product.warehouse?.location)}
														</div>
													</div>
												</div>
											</button>
										);
									})
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{selectedProducts.length > 0 && (
				<div className="space-y-3">
					<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('upsell.selectedProducts')}</Label>

					<div className="space-y-3">
						{selectedProducts.map((x) => (
							<div key={x.productId} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 backdrop-blur p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-start gap-3 min-w-0">
										<div className="shrink-0 w-11 h-11 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
											{x.mainImage ? (
												<img src={baseImg + getImg(x)} alt={x.name} className="w-full h-full object-cover" />
											) : (
												<div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">N/A</div>
											)}
										</div>

										<div className="min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<div className="font-semibold text-slate-900 dark:text-white truncate">{x.name}</div>

												<span className="font-[Inter] text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200">ID: {x.productId}</span>
											</div>
										</div>
									</div>

									<button
										type="button"
										onClick={() => removeProduct(x.productId)}
										className="shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-colors"
										aria-label="Remove product"
										title="Remove"
									>
										<X className="w-4 h-4 text-slate-500 hover:text-red-600" />
									</button>
								</div>

								<div className="mt-4 space-y-2">
									<div className="flex items-center justify-between">
										<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('upsell.callCenterItemDesc')}</Label>
									</div>

									<div className="relative">
										<Input
											value={x.callCenterDescription || ''}
											onChange={(e) => updateDesc(x.productId, e.target.value)}
											placeholder={t('upsell.callCenterItemDescPlaceholder')}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.currentTarget.blur();
												}
											}}
											className={['rounded-xl h-[48px]', 'bg-[#fafafa] dark:bg-slate-800/50', 'border-gray-200 dark:border-slate-700', 'pr-16 rtl:pl-16 rtl:pr-4'].join(' ')}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

/** Upload Box */
export function ImageUploadBox({ t, title, files, onFilesChange, onRemove, multiple = true, accept = 'image/*', className }) {
	const inputRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);

	const addFiles = React.useCallback(
		(picked) => {
			const next = picked.map((file) => ({
				id: makeId(),
				file,
				previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
				isFromLibrary: false,
				isExisting: false,
			}));
			onFilesChange([...(files ?? []), ...next]);
		},
		[files, onFilesChange]
	);

	const onPick = (e) => {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;
		addFiles(picked);
		e.target.value = '';
	};

	const removeFile = (id) => {
		const target = (files ?? []).find((f) => f.id === id);

		if (onRemove) {
			onRemove(target);
		}

		if (target?.previewUrl && !target.isFromLibrary && !target.isExisting) {
			URL.revokeObjectURL(target.previewUrl);
		}
		onFilesChange((files ?? []).filter((f) => f.id !== id));
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const picked = Array.from(e.dataTransfer.files ?? []);
		if (!picked.length) return;
		addFiles(picked);
	};

	const prettyExt = (name) => {
		const ext = name?.split('.').pop()?.toUpperCase();
		return ext && ext !== name?.toUpperCase() ? ext : 'FILE';
	};

	const isImage = (f) => (f?.file?.type?.startsWith?.('image/') ? true : !!f?.isFromLibrary || !!f?.isExisting);

	const getImageUrl = (f) => {
		if (f.isExisting || f.isFromLibrary) {
			return f.url.startsWith('http') ? f.url : baseImg + f.url;
		}
		return f.previewUrl;
	};

	return (
		<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={cn('bg-card rounded-2xl shadow-sm p-6', className)} dir="rtl">
			<h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-4 text-right flex items-center gap-2">
				<div className="w-1 h-5 bg-primary rounded-full" />
				{title}
			</h3>

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
				className={cn('rounded-2xl border-2 border-dashed p-8 text-center transition-all', isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-primary/60 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/20 dark:to-slate-800/20')}
			>
				<input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={onPick} />

				<div className="flex flex-col items-center gap-4">
					<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg">
						<UploadIllustration />
					</div>

					<div className="space-y-2">
						<p className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('uploads.dragHere')}</p>
						<div className="flex items-center justify-center gap-3 text-sm text-slate-400">
							<span className="h-px w-24 bg-slate-200 dark:bg-slate-700" />
							<span>{t('uploads.or')}</span>
							<span className="h-px w-24 bg-slate-200 dark:bg-slate-700" />
						</div>
					</div>

					<div className="flex gap-2">
						<Button type="button" variant="outline" className="rounded-xl px-8 border-primary/60 text-primary hover:bg-primary/10" onClick={() => inputRef.current?.click()}>
							{t('uploads.attach')}
						</Button>
					</div>
				</div>
			</div>

			<div className="mt-5 space-y-3">
				{(files ?? []).map((f) => (
					<div key={f.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 p-4 hover:border-primary/50 transition-all">
						<button
							type="button"
							onClick={() => removeFile(f.id)}
							className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
							aria-label={t('uploads.remove')}
						>
							<X className="h-5 w-5" />
						</button>

						<div className="flex-1 text-right">
							<div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{f.isExisting ? t('uploads.existingImage') : f.isFromLibrary ? t('uploads.fromLibrary') : (f?.file?.name || '').slice(0, 20)}</div>
							<div className="text-xs text-slate-400">{f.isFromLibrary || f.isExisting ? t('uploads.fromLibrary') : `${((f?.file?.size || 0) / 1024).toFixed(1)} KB`}</div>
						</div>

						<div className="flex items-center gap-3">
							<Badge className="rounded-lg bg-primary/15 text-primary border border-primary/20 font-semibold">{prettyExt(f?.file?.name || 'IMG')}</Badge>

							<div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
								{isImage(f) && getImageUrl(f) ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={getImageUrl(f)} alt={f?.file?.name || 'image'} className="w-full h-full object-cover" />
								) : (
									<div className="text-slate-500">{f?.file?.type?.includes?.('image') ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</motion.div>
	);
}

function UploadIllustration() {
	return (
		<svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_180_3507)">
				<path d="M33.4417 3.12061H14.1743V11.1106H37.5567V7.23402C37.5567 4.96567 35.7107 3.12061 33.4417 3.12061Z" fill="#CED9F9" />
				<path className="fill-primary" d="M22.5352 12.3403H0V4.92636C0 2.20972 2.21068 0 4.92828 0H12.1336C12.8497 0 13.5396 0.150925 14.1664 0.434509C15.0418 0.828964 15.7939 1.47913 16.3213 2.3286L22.5352 12.3403Z" />
				<path className="fill-primary/70" d="M42 14.0001V37.8815C42 40.1527 40.1511 42 37.8789 42H4.12111C1.84891 42 0 40.1527 0 37.8815V9.88062H37.8789C40.1511 9.88062 42 11.7286 42 14.0001Z" />
				<path className="fill-primary/60" d="M42 14.0001V37.8815C42 40.1527 40.1511 42 37.8789 42H21V9.88062H37.8789C40.1511 9.88062 42 11.7286 42 14.0001Z" />
				<path d="M32.048 25.9398C32.048 32.0322 27.0919 36.9887 21.0001 36.9887C14.9083 36.9887 9.95215 32.0322 9.95215 25.9398C9.95215 19.8483 14.9083 14.8918 21.0001 14.8918C27.0919 14.8918 32.048 19.8483 32.048 25.9398Z" fill="#E7ECFC" />
				<path d="M32.0479 25.9398C32.0479 32.0322 27.0918 36.9887 21 36.9887V14.8918C27.0918 14.8918 32.0479 19.8483 32.0479 25.9398Z" fill="#CED9F9" />
				<path className="fill-primary/50" d="M24.561 26.0753C24.3306 26.2704 24.0483 26.3656 23.7685 26.3656C23.4183 26.3656 23.0703 26.2173 22.8268 25.9282L22.2304 25.2213V29.8494C22.2304 30.5287 21.6793 31.0799 21 31.0799C20.3207 31.0799 19.7695 30.5287 19.7695 29.8494V25.2213L19.1732 25.9282C18.7342 26.4476 17.9584 26.514 17.439 26.0753C16.9199 25.6373 16.8532 24.8612 17.2913 24.3418L19.7269 21.4543C20.0444 21.0788 20.5078 20.8628 21 20.8628C21.4922 20.8628 21.9555 21.0788 22.2731 21.4543L24.7087 24.3418C25.1467 24.8612 25.0801 25.6373 24.561 26.0753Z" />
				<path className="fill-primary/70" d="M24.561 26.0753C24.3306 26.2704 24.0483 26.3656 23.7686 26.3656C23.4183 26.3656 23.0703 26.2173 22.8268 25.9282L22.2305 25.2213V29.8494C22.2305 30.5287 21.6793 31.0799 21 31.0799V20.8628C21.4922 20.8628 21.9555 21.0788 22.2731 21.4543L24.7087 24.3418C25.1467 24.8612 25.0801 25.6373 24.561 26.0753Z" />
			</g>
			<defs>
				<clipPath id="clip0_180_3507">
					<rect width="42" height="42" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
}