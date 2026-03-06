// File: products/new/page.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
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
	Save,
	ChevronRight,
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
import PageHeader from '@/components/atoms/Pageheader';

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

const ATTRIBUTE_TEMPLATES = [
	{ id: 'size', icon: Ruler, name: 'الحجم', nameEn: 'Size', values: ['صغير', 'متوسط'], valuesEn: ['Small', 'Medium'] },
	{ id: 'color', icon: Palette, name: 'اللون', nameEn: 'Color', values: ['أحمر', 'أزرق', 'أخضر'], valuesEn: ['Red', 'Blue', 'Green'] },
	{ id: 'material', icon: Shirt, name: 'المادة', nameEn: 'Material', values: ['قطن', 'بوليستر', 'صوف'], valuesEn: ['Cotton', 'Polyester', 'Wool'] },
	{ id: 'weight', icon: Package, name: 'الوزن', nameEn: 'Weight', values: ['خفيف', 'متوسط', 'ثقيل'], valuesEn: ['Light', 'Medium', 'Heavy'] },
];

function buildCombinationsFromAttributes(attributes, productName = '', defaultPrice = '') {
	const usable = (attributes || [])
		.map((attr) => {
			const key = slugifyKey(attr?.name);
			const values = (attr?.values || [])
				.map((v) => ({ value: slugifyKey(v), label: (v || '').trim() }))
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
				next.push({ attrs: { ...base.attrs, [attr.key]: val.value } });
			}
		}
		acc = next;
	}

	return acc.map((x) => {
		const key = canonicalKey(x.attrs);
		const productSlug = slugifyKey(productName).substring(0, 10).toUpperCase() || 'PRODUCT';
		const attrValues = Object.values(x.attrs).map((v) => slugifyKey(v).substring(0, 3).toUpperCase()).join('-');
		const autoSKU = attrValues ? `${productSlug}-${attrValues}` : '';
		return { key, attributes: x.attrs, sku: autoSKU, stockOnHand: 0, price: defaultPrice || '' };
	});
}

const makeSchema = (t) =>
	yup.object({
		name: yup.string().trim().required(t('validation.nameRequired')).max(200, t('validation.nameTooLong', { max: 200 })),
		slug: yup.string().trim().required(t('validation.slugRequired')).matches(/^[a-z0-9-]+$/, t('validation.slugInvalid')),
		wholesalePrice: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).nullable().typeError(t('validation.invalidNumber')).min(0, t('validation.noNegative')),
		lowestPrice: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).nullable().typeError(t('validation.invalidNumber')).min(0, t('validation.noNegative')),
		storageRack: yup.string().nullable(),
		categoryId: yup.string().nullable(),
		storeId: yup.string().nullable(),
		warehouseId: yup.string().nullable(),
		description: yup.string().nullable().max(2000, t('validation.descriptionTooLong', { max: 2000 })),
		callCenterProductDescription: yup.string().nullable().max(2000, t('validation.descriptionTooLong', { max: 2000 })),
		upsellingEnabled: yup.boolean().default(false),
		upsellingProducts: yup.array().of(yup.object({ productId: yup.string().trim().required(t('validation.upsellProductRequired')), label: yup.string().nullable(), callCenterDescription: yup.string().nullable().max(1000, t('validation.descriptionTooLong', { max: 1000 })) })).default([]),
		attributes: yup.array().of(yup.object({ id: yup.string().required(), name: yup.string().trim().required(t('validation.attributeNameRequired')), values: yup.array().of(yup.string().trim().required(t('validation.attributeValueRequired'))).min(1, t('validation.atLeastOneValue')) })).default([]),
		combinations: yup.array().of(yup.object({ key: yup.string().trim().required(t('validation.combinationKeyRequired')), sku: yup.string().trim().max(120, t('validation.combinationSkuMax')).nullable(), attributes: yup.object().required(t('validation.combinationAttrsRequired')), stockOnHand: yup.number().typeError(t('validation.invalidNumber')).min(0, t('validation.stockNonNegative')).default(0), price: yup.number().typeError(t('validation.invalidNumber')).required(t('validation.priceRequired')).min(0, t('validation.noNegative')) })).default([]),
	}).required();

function defaultAttribute() {
	return { id: makeId(), name: '', values: [] };
}

function defaultValues() {
	return {
		name: '', slug: '', wholesalePrice: '', lowestPrice: '', storageRack: '',
		categoryId: '', storeId: '', warehouseId: '', description: '',
		callCenterProductDescription: '', upsellingEnabled: false,
		upsellingProducts: [], attributes: [], combinations: [],
	};
}

function extractAttributesFromSkus(skus) {
	if (!skus || !skus.length) return [];
	const attributeMap = new Map();
	skus.forEach((sku) => {
		const attrs = sku.attributes || {};
		Object.entries(attrs).forEach(([key, value]) => {
			if (!attributeMap.has(key)) attributeMap.set(key, new Set());
			attributeMap.get(key).add(value);
		});
	});
	return Array.from(attributeMap.entries()).map(([name, valuesSet]) => ({ id: makeId(), name, values: Array.from(valuesSet) }));
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title, action }) {
	return (
		<div className="flex items-center justify-between mb-6">
			<h3 className="text-[15px] font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-3">
				<span className="w-[3px] h-5 bg-primary rounded-full block shrink-0" />
				{title}
			</h3>
			{action && <div>{action}</div>}
		</div>
	);
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, children, className }) {
	return (
		<div className={cn("space-y-1.5", className)}>
			{label && (
				<Label className="text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide">
					{label}
				</Label>
			)}
			{children}
			{error && (
				<p className="text-[11px] text-red-500 font-medium mt-1">{error}</p>
			)}
		</div>
	);
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, className, ...props }) {
	return (
		<div
			className={cn(
				"bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

// ─── Styled Input ─────────────────────────────────────────────────────────────
const inputClass = "h-[46px] rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-[14px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/50 transition-colors";

export default function AddProductPage({ isEditMode = false, existingProduct = null, productId = null }) {
	const t = useTranslations('addProduct');
	const [imageErrors, setImageErrors] = useState({
		main: { general: '', specific: {} },
		other: { general: '', specific: {} }
	});
	const navigate = useRouter();
	const [categories, setCategories] = useState([]);
	const [stores, setStores] = useState([]);
	const [warehouses, setWarehouses] = useState([]);
	const [mainFiles, setMainFiles] = useState([]);
	const [otherFiles, setOtherFiles] = useState([]);
	const [removedImages, setRemovedImages] = useState([]);

	const schema = useMemo(() => makeSchema(t), [t]);
	const { control, register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm({
		defaultValues: defaultValues(), resolver: yupResolver(schema), mode: 'onTouched',
	});

	const upsellingEnabled = watch('upsellingEnabled');
	const productName = watch('name');

	useEffect(() => {
		if (!upsellingEnabled) setValue('upsellingProducts', [], { shouldDirty: true });
	}, [upsellingEnabled, setValue]);

	const wholesalePrice = watch('wholesalePrice');
	const attributesWatch = useWatch({ control, name: 'attributes' });
	const combinationsWatch = useWatch({ control, name: 'combinations' });

	const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({ control, name: 'attributes', keyName: 'fieldId' });
	const { fields: comboFields } = useFieldArray({ control, name: 'combinations', keyName: 'fieldId' });

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
			} catch (e) { toast.error(normalizeAxiosError(e)); }
		})();
		return () => { mounted = false; };
	}, []);

	const lastCombSigRef = useRef('');
	useEffect(() => {
		const attributes = attributesWatch || [];
		const currentName = productName || '';
		const currentPrice = wholesalePrice || '';
		const sig = JSON.stringify({ attributes: (attributes || []).map((a) => ({ name: a?.name, values: a?.values || [] })), productName: currentName, wholesalePrice: currentPrice });
		if (lastCombSigRef.current === sig) return;
		lastCombSigRef.current = sig;
		const currentCombos = watch('combinations') || [];
		const generated = buildCombinationsFromAttributes(attributes, currentName, currentPrice);
		const byKey = new Map(currentCombos.map((c) => [c.key, c]));
		const next = generated.map((g) => {
			const old = byKey.get(g.key);
			return { ...g, sku: g.sku, stockOnHand: old?.stockOnHand ?? g.stockOnHand ?? 0, price: old?.price && old.price !== '' ? old.price : g.price };
		});
		setValue('combinations', next, { shouldDirty: true, shouldValidate: false });
	}, [attributesWatch, productName, wholesalePrice]);

	useEffect(() => {
		return () => {
			[...mainFiles, ...otherFiles].forEach((f) => f?.previewUrl && !f.isFromLibrary && URL.revokeObjectURL(f.previewUrl));
		};
	}, [mainFiles, otherFiles]);

	const addQuickTemplate = (template) => {
		appendAttribute({ id: makeId(), name: template.nameEn, values: template.valuesEn });
		toast.success(`تمت إضافة ${template.name}`);
	};

	const validateImages = (files, type) => {
		let generalError = '';
		let specificErrors = {};
		if (type === 'main' && (!files || files.length === 0)) generalError = t('errors.mainImageRequired');
		if (type === 'other' && files.length > 20) generalError = t('errors.maxItemsExceeded', { max: 20 });
		if (files && files.length > 0) {
			files.forEach((f) => {
				if (f.isExisting) return;
				const fileObj = f.file;
				if (!fileObj) return;
				if (!fileObj.type.startsWith('image/')) specificErrors[f.id] = t('errors.invalidFileType');
				else if (fileObj.size > 10 * 1024 * 1024) specificErrors[f.id] = t('errors.fileTooLarge', { size: 10 });
			});
		}
		setImageErrors((prev) => ({ ...prev, [type]: { general: generalError, specific: specificErrors } }));
		return !generalError && Object.keys(specificErrors).length === 0;
	};

	const handleWholesalePriceBlur = () => {
		const currentPrice = wholesalePrice || '';
		const currentCombos = watch('combinations') || [];
		const updated = currentCombos.map((combo) => ({ ...combo, price: combo.price && combo.price !== '' ? combo.price : currentPrice }));
		setValue('combinations', updated, { shouldDirty: true, shouldValidate: false });
	};

	const onSubmit = async (data) => {
		try {
			const isOthersValid = validateImages(otherFiles, 'other');
			const isMainValid = validateImages(mainFiles, 'main');
			if (!isMainValid || !isOthersValid) return;
			if (slugStatus == 'takenStore' || slugStatus === 'taken') return;
			if (data.combinations && data.combinations.length > 0) {
				const missingPrices = data.combinations.filter((c) => !c.price || c.price === '');
				if (missingPrices.length > 0) { toast.error(t('errors.missingPrices')); return; }
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
			if ((data.callCenterProductDescription ?? '').trim()) fd.append('callCenterProductDescription', data.callCenterProductDescription.trim());
			fd.append('upsellingEnabled', data.upsellingEnabled ? 'true' : 'false');
			const upsellingProducts = (data.upsellingProducts ?? []).filter((x) => x?.productId).map((x) => ({ productId: String(x.productId), label: (x.label ?? '').toString().trim() || undefined, callCenterDescription: (x.callCenterDescription ?? '').toString().trim() || undefined }));
			fd.append('upsellingProducts', JSON.stringify(upsellingProducts));

			const main = mainFiles[0];
			if (main?.file) fd.append('mainImage', main.file);
			else if (main?.url && !main.url.startsWith('/uploads') && !main.isExisting) fd.append('mainImage', String(main.url));

			const existingImages = (otherFiles || []).filter((f) => f?.isExisting && f?.url && !removedImages.includes(f.url)).map((f) => ({ url: String(f.url) }));
			const imagesMeta = (otherFiles || []).filter((f) => f?.isFromLibrary && !f?.isExisting && f?.url).map((f) => ({ url: String(f.url) }));
			if (isEditMode) fd.append('imagesMeta', JSON.stringify([...existingImages, ...imagesMeta]));
			else if (imagesMeta.length) fd.append('imagesMeta', JSON.stringify(imagesMeta));
			if (isEditMode && removedImages.length > 0) fd.append('removedImages', JSON.stringify(removedImages));
			(otherFiles ?? []).forEach((f) => { if (!f) return; if (f.isFromLibrary || f.isExisting) return; if (f.file) fd.append('images', f.file); });
			if (!isEditMode) fd.append('combinations', JSON.stringify([...data.combinations]));

			const apiCall = isEditMode
				? api.patch(`/products/${productId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
				: api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

			await toast.promise(apiCall, { loading: t('messages.saving'), success: isEditMode ? t('messages.updated') : t('messages.created'), error: (err) => normalizeAxiosError(err) });

			if (isEditMode && data.combinations && data.combinations.length > 0) {
				const combinationsPayload = data.combinations.map((c) => ({ attributes: c.attributes ?? {}, price: safeNumberString(c.price) || null }));
				await api.put(`/products/${productId}/skus`, { items: combinationsPayload });
			}

			navigate.push('/products');
		} catch (error) { }
	};

	useEffect(() => {
		if (!isEditMode || !existingProduct) return;
		const extractedAttributes = extractAttributesFromSkus(existingProduct.skus || []);
		const combinations = (existingProduct.skus || []).map((sku) => ({ key: sku.key, sku: sku.sku || '', attributes: sku.attributes || {}, stockOnHand: sku.stockOnHand || 0, price: sku.price?.toString() || existingProduct.wholesalePrice?.toString() || '' }));
		reset({ name: existingProduct.name || '', slug: existingProduct.slug || '', wholesalePrice: existingProduct.wholesalePrice?.toString() || '', lowestPrice: existingProduct.lowestPrice?.toString() || '', storageRack: existingProduct.storageRack || '', categoryId: existingProduct.categoryId ? String(existingProduct.categoryId) : 'none', storeId: existingProduct.storeId ? String(existingProduct.storeId) : 'none', warehouseId: existingProduct.warehouseId ? String(existingProduct.warehouseId) : 'none', description: existingProduct.description || '', callCenterProductDescription: existingProduct.callCenterProductDescription || '', upsellingEnabled: existingProduct.upsellingEnabled || false, upsellingProducts: existingProduct.upsellingProducts || [], attributes: extractedAttributes, combinations: combinations });
		if (existingProduct.mainImage) { setMainFiles([{ id: makeId(), file: null, previewUrl: existingProduct.mainImage, isFromLibrary: false, isExisting: true, url: existingProduct.mainImage }]); }
		if (existingProduct.images && existingProduct.images.length) { setOtherFiles(existingProduct.images.map((img) => ({ id: makeId(), file: null, previewUrl: img.url, isFromLibrary: false, isExisting: true, url: img.url }))); }
	}, [isEditMode, existingProduct, reset]);

	const [slugStatus, setSlugStatus] = useState(null);
	const watchSlug = watch('slug');
	const storeId = watch('storeId');
	useEffect(() => {
		if (!watchSlug || errors.slug) { setSlugStatus(null); return; }
		const checkUnique = setTimeout(async () => {
			setSlugStatus('checking');
			try {
				const params = new URLSearchParams({ slug: watchSlug.trim() });
				if (storeId && storeId !== 'none') params.append('storeId', storeId);
				if (productId) params.append('productId', productId);
				const res = await api.get(`/products/check-slug?${params.toString()}`);
				setSlugStatus(res.data.isUnique ? 'unique' : 'takenStore');
			} catch (e) { setSlugStatus(null); }
		}, 280);
		return () => clearTimeout(checkUnique);
	}, [watchSlug, errors.slug, productId]);

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
			{/* ── Page Header ── */}
			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.products"), href: "/products" },
					{ name: isEditMode ? t('breadcrumb.editProduct') : t('breadcrumb.addProduct') }
				]}
				buttons={
					<div className="flex items-center gap-2">
						<Button_
							onClick={() => navigate.push('/products')}
							size="sm"
							label={t('actions.back')}
							tone="cancel"
							variant="ghost"
						/>
						<Button_
							size="sm"
							label={isSubmitting ? t('actions.saving') : t('actions.save')}
							tone="primary"
							variant="solid"
							onClick={handleSubmit(onSubmit)}
							icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
						/>
					</div>
				}
			/>

			<form onSubmit={handleSubmit(onSubmit)}>
				<motion.div
					variants={staggerContainer}
					initial="initial"
					animate="animate"
					className="flex gap-5 mt-5 items-start"
				>
					{/* ── Left Column ── */}
					<div className="space-y-5 flex-1 min-w-0">

						{/* Product Info Card */}
						<motion.div variants={fadeUp}>
							<Card>
								<SectionHeader title={t('sections.productInfo')} />
								<div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-3">
									<Field label={t('fields.productName')} error={errors?.name?.message} className=" ">
										<Input {...register('name')} placeholder={t('placeholders.productName')} className={inputClass} />
									</Field>

										<SlugInput
											errors={errors}
											register={register}
											name={productName}
											slugStatus={slugStatus}
											slug={watchSlug}
											setValue={setValue}
											labelClassName="text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide"
											className={inputClass}
										/> 

									<Field label={t('fields.wholesalePrice')} error={errors?.wholesalePrice?.message}>
										<Input
											type="number"
											step="0.01"
											{...register('wholesalePrice')}
											onBlur={handleWholesalePriceBlur}
											placeholder={t('placeholders.wholesalePrice')}
											className={inputClass}
										/>
									</Field>

									<Field label={t('fields.lowestPrice')} error={errors?.lowestPrice?.message}>
										<Input type="number" step="0.01" {...register('lowestPrice')} placeholder={t('placeholders.lowestPrice')} className={inputClass} />
									</Field>

									<Field label={t('fields.storageRack')}>
										<Input {...register('storageRack')} placeholder={t('placeholders.storageRack')} className={inputClass} />
									</Field>

									<Field label={t('fields.category')}>
										<Controller
											control={control}
											name="categoryId"
											render={({ field }) => (
												<Select value={field.value || ''} onValueChange={field.onChange}>
													<SelectTrigger className={cn(inputClass, "w-full")}>
														<SelectValue placeholder={t('placeholders.category')} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">{t('common.none')}</SelectItem>
														{categories.map((c) => (
															<SelectItem key={c.id} value={String(c.id)}>{c.label ?? c.name ?? `#${c.id}`}</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
									</Field>

									<Field label={t('fields.store')}>
										<Controller
											control={control}
											name="storeId"
											render={({ field }) => (
												<Select value={field.value || ''} onValueChange={field.onChange}>
													<SelectTrigger className={cn(inputClass, "w-full")}>
														<SelectValue placeholder={t('placeholders.store')} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">{t('common.none')}</SelectItem>
														{stores.map((s) => (
															<SelectItem key={s.id} value={String(s.id)}>{s.label ?? s.name ?? `#${s.id}`}</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
									</Field>

									<Field label={t('fields.warehouse')}>
										<Controller
											control={control}
											name="warehouseId"
											render={({ field }) => (
												<Select value={field.value || ''} onValueChange={field.onChange}>
													<SelectTrigger className={cn(inputClass, "w-full")}>
														<SelectValue placeholder={t('placeholders.warehouse')} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">{t('common.none')}</SelectItem>
														{warehouses.map((w) => (
															<SelectItem key={w.id} value={String(w.id)}>{w.label ?? w.name ?? `#${w.id}`}</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
									</Field>

									<Field label={t('fields.description')} className="col-span-full">
										<Textarea
											{...register('description')}
											placeholder={t('placeholders.description')}
											className="rounded-xl min-h-[96px] bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-[14px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/50 resize-none transition-colors"
										/>
									</Field>
								</div>
							</Card>
						</motion.div>

						{/* Attributes Card */}
						<motion.div variants={fadeUp}>
							<Card>
								<SectionHeader
									title={t('attributes.title')}
									action={
										<button
											type="button"
											onClick={() => appendAttribute(defaultAttribute())}
											className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-lg bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
										>
											<Plus className="h-3.5 w-3.5" />
											{t('attributes.addCustom')}
										</button>
									}
								/>

								{/* Quick Templates */}
								<div className="mb-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4">
									<div className="flex items-center gap-2 mb-3">
										<div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
											<Zap className="h-3 w-3 text-primary" />
										</div>
										<span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('attributes.quickAdd')}</span>
									</div>
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
										{ATTRIBUTE_TEMPLATES.map((template) => {
											const Icon = template.icon;
											return (
												<button
													key={template.id}
													type="button"
													onClick={() => addQuickTemplate(template)}
													className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-left"
												>
													<div className="w-7 h-7 rounded-lg bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center transition-colors shrink-0">
														<Icon className="h-3.5 w-3.5 text-primary" />
													</div>
													<div>
														<div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 leading-tight">{template.name}</div>
														<div className="text-[11px] text-slate-400 mt-0.5">{template.values.length} {t('attributes.values')}</div>
													</div>
												</button>
											);
										})}
									</div>
								</div>

								{errors?.attributes?.message && (
									<p className="text-[12px] text-red-500 font-medium mb-4">{errors.attributes.message}</p>
								)}

								<div className="space-y-3">
									{attributeFields.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 text-center">
											<div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
												<Package className="h-5 w-5 text-slate-400" />
											</div>
											<p className="text-[13px] text-slate-400">{t('attributes.empty')}</p>
										</div>
									) : (
										attributeFields.map((af, aIndex) => (
											<AttributeEditor
												key={af.fieldId}
												t={t}
												control={control}
												register={register}
												errors={errors?.attributes?.[aIndex]}
												aIndex={aIndex}
												onRemove={() => removeAttribute(aIndex)}
												setValue={setValue}
											/>
										))
									)}
								</div>
							</Card>
						</motion.div>

						{/* Combinations Card */}
						{comboFields.length > 0 && (
							<motion.div variants={fadeUp}>
								<Card>
									<div className="flex items-center justify-between mb-5">
										<SectionHeader title={t('combinations.title')} />
										<span className="text-[12px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
											{comboFields.length} {t('combinations.count')}
										</span>
									</div>

									<div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
										<div className="overflow-x-auto max-h-[520px] overflow-y-auto">
											<table className="w-full text-[13px]">
												<thead>
													<tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
														<th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">{t('combinations.combinationName')}</th>
														<th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 font-[Inter]">SKU</th>
														<th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[130px]">
															{t('combinations.price')} <span className="text-red-400">*</span>
														</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-50 dark:divide-slate-800">
													{comboFields.map((c, idx) => {
														const cErr = errors?.combinations?.[idx];
														const current = combinationsWatch?.[idx];
														const attrs = current?.attributes || {};
														return (
															<tr key={c.fieldId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
																<td className="px-4 py-3">
																	<input type="hidden" {...register(`combinations.${idx}.key`)} />
																	<input type="hidden" {...register(`combinations.${idx}.attributes`)} />
																	<div className="flex items-center gap-1.5 flex-wrap">
																		{Object.entries(attrs).map(([key, value]) => (
																			<LANG key={key} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[12px] font-medium border border-primary/15">
																				{value}
																			</LANG>
																		))}
																	</div>
																</td>
																<td className="px-4 py-3">
																	<Input
																		{...register(`combinations.${idx}.sku`)}
																		placeholder={t('combinations.placeholders.sku')}
																		disabled
																		className="h-[38px] rounded-lg font-[Inter] text-[12px] bg-slate-100 dark:bg-slate-900 border-transparent text-slate-400 cursor-not-allowed"
																	/>
																</td>
																<td className="px-4 py-3">
																	<Input
																		type="number"
																		step="0.01"
																		{...register(`combinations.${idx}.price`)}
																		placeholder="0.00"
																		className={cn("h-[38px] rounded-lg font-[Inter] text-[13px]", cErr?.price ? "border-red-300" : "border-slate-200 dark:border-slate-700")}
																	/>
																	{cErr?.price?.message && <p className="text-[11px] text-red-500 mt-0.5">{cErr.price.message}</p>}
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									</div>
								</Card>
							</motion.div>
						)}

						{/* Upselling Card */}
						<motion.div variants={fadeUp}>
							<Card>
								<SectionHeader title={t('sections.upselling')} />
								<div className="space-y-4">
									<Field label={t('upsell.callCenterDesc')}>
										<Input
											{...register('callCenterProductDescription')}
											placeholder={t('placeholders.callCenterDesc')}
											className={inputClass}
										/>
									</Field>

									<Controller
										control={control}
										name="upsellingEnabled"
										render={({ field }) => (
											<label className="flex items-center gap-2.5 cursor-pointer group w-fit">
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
													id="upselling-enabled"
													className="rounded-md"
												/>
												<span className="text-[13px] font-medium text-slate-600 dark:text-slate-300 select-none group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors">
													{t('upsell.enableUpselling')}
												</span>
											</label>
										)}
									/>

									{upsellingEnabled && (
										<UpsellProductSelector
											t={t}
											value={watch('upsellingProducts') || []}
											onChange={(next) => setValue('upsellingProducts', next, { shouldValidate: true, shouldDirty: true })}
										/>
									)}
								</div>
							</Card>
						</motion.div>

						<button type="submit" className="hidden" />
					</div>

					{/* ── Right Column (Media) ── */}
					<div className="sticky top-[20px] h-fit space-y-4 w-full max-w-[360px] max-xl:max-w-[300px] shrink-0">
						<ImageUploadBox
							title={t('uploads.mainImage')}
							files={mainFiles}
							onFilesChange={(next) => {
								mainFiles.forEach((f) => f?.previewUrl && !f.isFromLibrary && !f.isExisting && URL.revokeObjectURL(f.previewUrl));
								setMainFiles(next.slice(0, 1));
								setImageErrors(prev => ({ ...prev, main: {} }));
							}}
							onRemove={(fileToRemove) => {
								if (fileToRemove.isExisting && fileToRemove.url) setRemovedImages((prev) => [...prev, fileToRemove.url]);
							}}
							error={imageErrors.main}
							multiple={false}
						/>

						<ImageUploadBox
							title={t('uploads.otherImages')}
							files={otherFiles}
							onFilesChange={(next) => {
								setOtherFiles(next);
								setImageErrors(prev => ({ ...prev, other: {} }));
							}}
							onRemove={(fileToRemove) => {
								if (fileToRemove.isExisting && fileToRemove.url) setRemovedImages((prev) => [...prev, fileToRemove.url]);
							}}
							error={imageErrors.other}
							multiple={true}
						/>
					</div>
				</motion.div>
			</form>
		</motion.div>
	);
}

/** ── Attribute Editor ─────────────────────────────────────────────────────── */
function AttributeEditor({ t, control, register, errors, aIndex, onRemove, setValue }) {
	const valuesWatch = useWatch({ control, name: `attributes.${aIndex}.values` }) || [];

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
			className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
		>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2.5">
					<span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
						{aIndex + 1}
					</span>
					<span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
						{t('attributes.attribute')}
					</span>
				</div>

				<button
					type="button"
					onClick={onRemove}
					className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-100 dark:hover:border-red-900/50 transition-all"
					title={t('attributes.deleteAttribute')}
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>

			<input type="hidden" {...register(`attributes.${aIndex}.id`)} />

			<div className="grid grid-cols-2 gap-3">
				<Field label={t('attributes.name')} error={errors?.name?.message}>
					<Input
						{...register(`attributes.${aIndex}.name`)}
						placeholder={t('attributes.placeholders.name')}
						className={inputClass}
					/>
				</Field>

				<div className="space-y-1.5">
					<TagInput
						label={t('attributes.values')}
						tags={valuesWatch}
						onTagsChange={(newTags) => setValue(`attributes.${aIndex}.values`, newTags, { shouldValidate: true, shouldDirty: true })}
						placeholder={t('attributes.placeholders.value')}
					/>
					{errors?.values?.message && <p className="text-[11px] text-red-500">{errors.values.message}</p>}
				</div>
			</div>
		</motion.div>
	);
}

/** ── Upsell Product Selector ─────────────────────────────────────────────── */
function UpsellProductSelector({ t, value, onChange }) {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const selectedIds = (value || []).map((x) => String(x.productId));

	useEffect(() => { loadProducts(); }, []);

	const loadProducts = async () => {
		setLoading(true);
		try {
			const response = await api.get('/products', { params: { limit: 100 } });
			const list = Array.isArray(response.data?.records) ? response.data.records : Array.isArray(response.data) ? response.data : [];
			setProducts(list);
		} catch (error) { toast.error(t('upsell.failedToLoad')); }
		finally { setLoading(false); }
	};

	const filteredProducts = products.filter((p) => !selectedIds.includes(String(p.id)) && (search ? p.name?.toLowerCase().includes(search.toLowerCase()) : true));
	const addProduct = (product) => { onChange([...(value || []), { ...product, productId: String(product.id), label: product.name || `#${product.id}`, callCenterDescription: '' }]); };
	const removeProduct = (productId) => { onChange((value || []).filter((x) => String(x.productId) !== String(productId))); };
	const updateDesc = (productId, desc) => { onChange((value || []).map((x) => (String(x.productId) === String(productId) ? { ...x, callCenterDescription: desc } : x))); };
	const selectedProducts = (value || []).map((x) => { const p = products.find((pp) => String(pp.id) === String(x.productId)); return { ...x, name: p?.name || x.label || `#${x.productId}` }; });
	const getImg = (p) => p?.mainImage || p?.images?.[0]?.url || '';
	const safeText = (v) => (v == null || v === '' ? '—' : String(v));

	return (
		<div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
			<Field label={t('upsell.selectProducts')}>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t('upsell.searchProducts')}
						className={cn(inputClass, "pl-9")}
					/>

					{search && (
						<div className="absolute z-10 bottom-[calc(100%+6px)] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-black/10">
							<div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
								<span className="text-[11px] text-slate-500">{t('upsell.searchResultsCount')}: <b>{filteredProducts.length}</b></span>
								<span className="text-[11px] text-slate-400">{t('upsell.clickToSelect')}</span>
							</div>
							<div className="max-h-64 overflow-y-auto">
								{filteredProducts.length === 0 ? (
									<div className="py-8 text-center">
										<p className="text-[13px] font-medium text-slate-500">{t('upsell.noResults')}</p>
										<p className="text-[12px] text-slate-400 mt-1">{t('upsell.tryDifferent')}</p>
									</div>
								) : (
									filteredProducts.map((product) => {
										const img = getImg(product);
										return (
											<button
												key={product.id}
												type="button"
												onClick={() => { addProduct(product); setSearch(''); }}
												className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
											>
												<div className="flex items-center gap-3">
													<div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0">
														{img ? <img src={baseImg + img} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">—</div>}
													</div>
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span className="font-semibold text-[13px] text-slate-800 dark:text-white truncate">{safeText(product.name)}</span>
															<span className="text-[10px] font-[Inter] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 shrink-0">#{product.id}</span>
														</div>
														<p className="text-[11px] text-slate-400 truncate mt-0.5">{safeText(product.category?.name)} · {safeText(product.store?.name)}</p>
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
			</Field>

			{selectedProducts.length > 0 && (
				<div className="space-y-2">
					<label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('upsell.selectedProducts')}</label>
					{selectedProducts.map((x) => (
						<div key={x.productId} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3">
							<div className="flex items-center justify-between gap-2 mb-3">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0">
										{x.mainImage ? <img src={baseImg + getImg(x)} alt={x.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">—</div>}
									</div>
									<div>
										<span className="text-[13px] font-semibold text-slate-800 dark:text-white">{x.name}</span>
										<span className="text-[11px] font-[Inter] ml-2 text-slate-400">#{x.productId}</span>
									</div>
								</div>
								<button
									type="button"
									onClick={() => removeProduct(x.productId)}
									className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shrink-0"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							</div>
							<Input
								value={x.callCenterDescription || ''}
								onChange={(e) => updateDesc(x.productId, e.target.value)}
								placeholder={t('upsell.callCenterItemDescPlaceholder')}
								className={cn(inputClass, "h-[38px] text-[13px]")}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/** ── Image Upload Box ─────────────────────────────────────────────────────── */
export function ImageUploadBox({ title, files, onFilesChange, onRemove, multiple = true, accept = 'image/*', className, error }) {
	const t = useTranslations('addProduct');
	const inputRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);
	const generalErrorMessage = typeof error === 'string' ? error : error?.general;
	const specificErrors = error?.specific || {};

	const addFiles = React.useCallback((picked) => {
		const next = picked.map((file) => ({ id: makeId(), file, previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined, isFromLibrary: false, isExisting: false }));
		onFilesChange([...(files ?? []), ...next]);
	}, [files, onFilesChange]);

	const onPick = (e) => {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;
		addFiles(picked);
		e.target.value = '';
	};

	const removeFile = (id) => {
		const target = (files ?? []).find((f) => f.id === id);
		if (onRemove) onRemove(target);
		if (target?.previewUrl && !target.isFromLibrary && !target.isExisting) URL.revokeObjectURL(target.previewUrl);
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
		return ext && ext !== name?.toUpperCase() ? ext : 'IMG';
	};

	const isImage = (f) => (f?.file?.type?.startsWith?.('image/') ? true : !!f?.isFromLibrary || !!f?.isExisting);

	const getImageUrl = (f) => {
		if (f.isExisting || f.isFromLibrary) return f.url.startsWith('http') ? f.url : baseImg + f.url;
		return f.previewUrl;
	};

	const hasError = !!generalErrorMessage || Object.keys(specificErrors).length > 0;

	return (
		<motion.div
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				"bg-white dark:bg-slate-900 rounded-2xl border shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5",
				hasError ? "border-red-200 dark:border-red-900/50" : "border-slate-100 dark:border-slate-800",
				className
			)}
			dir="rtl"
		>
			{/* Header */}
			<div className="flex items-center gap-2 mb-4">
				<span className={cn("w-[3px] h-4 rounded-full block shrink-0", hasError ? "bg-red-400" : "bg-primary")} />
				<h3 className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
			</div>

			{/* Drop Zone */}
			<div
				onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
				onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
				onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
				onDrop={handleDrop}
				onClick={() => inputRef.current?.click()}
				className={cn(
					"rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 py-7 px-4 text-center",
					isDragging
						? "border-primary bg-primary/5 scale-[1.01]"
						: "border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/40"
				)}
			>
				<input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={onPick} />

				<div className={cn(
					"w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
					isDragging ? "bg-primary/15" : "bg-slate-100 dark:bg-slate-800"
				)}>
					<UploadCloud className={cn("h-5 w-5", isDragging ? "text-primary" : "text-slate-400")} />
				</div>

				<div>
					<p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{t('uploads.dragHere')}</p>
					<p className="text-[12px] text-slate-400 mt-0.5">{t('uploads.or')} <span className="text-primary font-medium">{t('uploads.attach')}</span></p>
				</div>
			</div>

			{generalErrorMessage && (
				<p className="mt-2 text-[11px] font-medium text-red-500 text-right">{generalErrorMessage}</p>
			)}

			{/* File List */}
			{(files ?? []).length > 0 && (
				<div className="mt-3 space-y-2">
					{(files ?? []).map((f) => {
						const fileError = specificErrors[f.id];
						return (
							<div
								key={f.id}
								className={cn(
									"flex items-center gap-3 rounded-xl border p-2.5 transition-all",
									fileError
										? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/10"
										: "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:border-slate-200 dark:hover:border-slate-700"
								)}
							>
								{/* Thumbnail */}
								<div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
									{isImage(f) && getImageUrl(f) ? (
										<img src={getImageUrl(f)} alt={f?.file?.name || 'image'} className="w-full h-full object-cover" />
									) : (
										<div className="w-full h-full flex items-center justify-center">
											{f?.file?.type?.includes?.('image') ? <ImageIcon className="h-4 w-4 text-slate-400" /> : <FileText className="h-4 w-4 text-slate-400" />}
										</div>
									)}
								</div>

								{/* Info */}
								<div className="flex-1 min-w-0 text-right">
									<p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">
										{f.isExisting ? t('uploads.existingImage') : f.isFromLibrary ? t('uploads.fromLibrary') : (f?.file?.name || '').slice(0, 24)}
									</p>
									{fileError ? (
										<p className="text-[11px] text-red-500 font-medium">{fileError}</p>
									) : (
										<p className="text-[11px] text-slate-400">
											{f.isFromLibrary || f.isExisting ? t('uploads.fromLibrary') : `${((f?.file?.size || 0) / 1024).toFixed(1)} KB`}
										</p>
									)}
								</div>

								{/* Type badge */}
								<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/8 text-primary border border-primary/15 shrink-0 font-[Inter]">
									{prettyExt(f?.file?.name || 'IMG')}
								</span>

								{/* Remove */}
								<button
									type="button"
									onClick={() => removeFile(f.id)}
									className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-100 dark:hover:border-red-900/50 transition-all shrink-0"
									aria-label={t('uploads.remove')}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
						);
					})}
				</div>
			)}
		</motion.div>
	);
}