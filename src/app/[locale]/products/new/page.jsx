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
	FilePlus,
	Info,
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
import { useLocale, useTranslations } from 'next-intl';
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

function parseBooleanLike(value, fallback = true) {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const v = value.trim().toLowerCase();
		if (v === 'true' || v === '1') return true;
		if (v === 'false' || v === '0') return false;
	}
	if (typeof value === 'number') {
		if (value === 1) return true;
		if (value === 0) return false;
	}
	return fallback;
}

function getSkuBaseFromSlug(slug) {
	const clean = (slug || '').toString().trim().toLowerCase();
	const parts = clean.split('-').map((x) => x.trim()).filter(Boolean);
	const picked = (parts.length >= 2 ? parts.slice(0, 2) : parts.slice(0, 1))
		.join('-')
		.replace(/[^a-z0-9-]/g, '');
	return (picked || 'product').toUpperCase();
}

const ATTRIBUTE_TEMPLATES = [
	{ id: 'size', icon: Ruler, name: 'الحجم', nameEn: 'Size', values: ['صغير', 'متوسط'], valuesEn: ['Small', 'Medium'] },
	{ id: 'color', icon: Palette, name: 'اللون', nameEn: 'Color', values: ['أحمر', 'أزرق', 'أخضر'], valuesEn: ['Red', 'Blue', 'Green'] },
	{ id: 'material', icon: Shirt, name: 'المادة', nameEn: 'Material', values: ['قطن', 'بوليستر', 'صوف'], valuesEn: ['Cotton', 'Polyester', 'Wool'] },
	{ id: 'weight', icon: Package, name: 'الوزن', nameEn: 'Weight', values: ['خفيف', 'متوسط', 'ثقيل'], valuesEn: ['Light', 'Medium', 'Heavy'] },
];

function buildCombinationsFromAttributes(attributes, slug = '', defaultPrice = '') {
	const usable = (attributes || [])
		.map((attr) => {
			const key = slugifyKey(attr?.name);
			const values = (attr?.values || [])
				.map((v) => ({ value: slugifyKey(v), label: (v || '').trim() }))
				.filter((v) => v.value);
			return { key, name: (attr?.name || '').trim(), values };
		})
		.filter((attr) => attr.key && attr.values.length > 0);
	const uniqueUsable = [];
	const seenAttrKeys = new Set();
	for (const attr of usable) {
		if (seenAttrKeys.has(attr.key)) continue;
		seenAttrKeys.add(attr.key);
		uniqueUsable.push(attr);
	}
	if (!uniqueUsable.length) return [];

	let acc = [{ attrs: {} }];
	for (const attr of uniqueUsable) {
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
		const productSlug = getSkuBaseFromSlug(slug);
		const attrValues = Object.values(x.attrs).map((v) => slugifyKey(v).substring(0, 3).toUpperCase()).join('-');
		const autoSKU = attrValues ? `${productSlug}-${attrValues}` : '';
		return { key, attributes: x.attrs, sku: autoSKU, stockOnHand: 0, price: defaultPrice || '', isActive: true, isExisting: false };
	});
}

const makeSchema = (t) =>
	yup.object({
		name: yup.string().trim().required(t('validation.nameRequired')).max(200, t('validation.nameTooLong', { max: 200 })),
		slug: yup.string().trim().required(t('validation.slugRequired')).matches(/^[a-z0-9-]+$/, t('validation.slugInvalid')),
		wholesalePrice: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).nullable().typeError(t('validation.invalidNumber')).min(0, t('validation.noNegative')),
		salePrice: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).nullable().typeError(t('validation.invalidNumber')).min(0, t('validation.noNegative')),
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
		combinations: yup.array().of(yup.object({ key: yup.string().trim().required(t('validation.combinationKeyRequired')), sku: yup.string().trim().max(120, t('validation.combinationSkuMax')).nullable(), attributes: yup.object().required(t('validation.combinationAttrsRequired')), stockOnHand: yup.number().typeError(t('validation.invalidNumber')).min(0, t('validation.stockNonNegative')).default(0), price: yup.number().typeError(t('validation.invalidNumber')).required(t('validation.priceRequired')).min(0, t('validation.noNegative')), isActive: yup.boolean().default(true), isExisting: yup.boolean().default(false) })).default([]),
	}).required();

function defaultAttribute() {
	return { id: makeId(), name: '', values: [] };
}

function defaultValues() {
	return {
		name: '', slug: '', wholesalePrice: '', salePrice: '', lowestPrice: '', storageRack: '',
		categoryId: '', storeId: '', warehouseId: '', description: '',
		callCenterProductDescription: '', upsellingEnabled: false,
		upsellingProducts: [], attributes: [], combinations: [],
		purchase: {
			supplierId: '',
			receiptNumber: '',
			safeId: '',
			notes: '',
			paidAmount: ''
		}
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
				"bg-card rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
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
async function generateHash(input) {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);

	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));

	return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
export default function AddProductPage({ isEditMode = false, existingProduct = null, productId = null }) {
	const combinationsSectionRef = useRef(null);
	const tPurchase = useTranslations("purchaseInvoice");
	const t = useTranslations('addProduct');
	const locale = useLocale();
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

	const [hasPurchase, setHasPurchase] = useState(false);
	const [suppliers, setSuppliers] = useState([]);
	const [purchaseReceipt, setPurchaseReceipt] = useState([]);
	const [totalPurchaseQuantity, setTotalPurchaseQuantity] = useState('');

	const schema = useMemo(() => makeSchema(t), [t]);
	const { control, register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm({
		defaultValues: defaultValues(), resolver: yupResolver(schema), mode: 'onTouched',
	});

	const upsellingEnabled = watch('upsellingEnabled');
	const productName = watch('name');
	const productSlug = watch('slug');
	const attributesForDupCheck = useWatch({ control, name: 'attributes' }) || [];
	const [skuConflictMap, setSkuConflictMap] = useState({});

	useEffect(() => {
		if (!upsellingEnabled) setValue('upsellingProducts', [], { shouldDirty: true });
	}, [upsellingEnabled, setValue]);

	const wholesalePrice = watch('wholesalePrice');
	const salePrice = watch('salePrice');
	const attributesWatch = useWatch({ control, name: 'attributes' });
	const combinationsWatch = useWatch({ control, name: 'combinations' });

	const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({ control, name: 'attributes', keyName: 'fieldId' });
	const { fields: comboFields } = useFieldArray({ control, name: 'combinations', keyName: 'fieldId' });


	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const [catsRes, storesRes, whRes, suppliersRes] = await Promise.all([
					api.get('/lookups/categories', { params: { limit: 200 } }),
					api.get('/lookups/stores', { params: { limit: 200, isActive: true } }),
					api.get('/lookups/warehouses', { params: { limit: 200, isActive: true } }),
					api.get('/lookups/suppliers', { params: { limit: 200 } }),
				]);
				if (!mounted) return;
				setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);

				const storesData = Array.isArray(storesRes.data) ? storesRes.data : [];
				setStores(storesData);
				// Auto-select store if only one exists and not in edit mode
				if (storesData.length === 1 && !isEditMode) {
					setValue('storeId', String(storesData[0].id ?? storesData[0].value));
				}

				setWarehouses(Array.isArray(whRes.data) ? whRes.data : []);
				setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
			} catch (e) { toast.error(normalizeAxiosError(e)); }
		})();
		return () => { mounted = false; };
	}, [isEditMode, setValue]);

	const lastCombSigRef = useRef('');
	useEffect(() => {
		const attributes = attributesWatch || [];
		const currentSlug = productSlug || '';
		const currentCombos = watch('combinations') || [];
		const currentPrice = salePrice || '';
		const sig = JSON.stringify({ attributes: (attributes || []).map((a) => ({ name: a?.name, values: a?.values || [] })), productSlug: currentSlug, salePrice: currentPrice, isEditMode });
		if (lastCombSigRef.current === sig) return;
		lastCombSigRef.current = sig;


		const generated = buildCombinationsFromAttributes(attributes, currentSlug, currentPrice);
		const byKey = new Map(currentCombos.map((c) => [c.key, c]));

		const activeGenerated = generated.map((g) => {
			const old = byKey.get(g.key);

			return {
				...g,
				sku: old?.sku && old.sku !== '' ? old.sku : g.sku,
				stockOnHand: old?.stockOnHand ?? g.stockOnHand ?? 0,
				price: old?.price && old.price !== '' ? old.price : g.price,
				isActive: old?.isActive ?? true,
				isExisting: !!old?.isExisting,
				variantId: old?.variantId,
				reserved: old?.reserved ?? 0,
			};
		});
		if (!isEditMode) {
			setValue('combinations', activeGenerated, { shouldDirty: true, shouldValidate: false });
			return;
		}

		const generatedKeys = new Set(activeGenerated.map((x) => x.key));
		const inactiveLegacy = currentCombos
			.filter((c) => c?.isExisting && c?.key && !generatedKeys.has(c.key))
			.map((c) => ({ ...c, isActive: false }));

		setValue('combinations', [...activeGenerated, ...inactiveLegacy], { shouldDirty: true, shouldValidate: false });
	}, [attributesWatch, productSlug, salePrice, isEditMode]);

	useEffect(() => {
		return () => {
			[...mainFiles, ...otherFiles].forEach((f) => f?.previewUrl && !f.isFromLibrary && URL.revokeObjectURL(f.previewUrl));
		};
	}, [mainFiles, otherFiles]);

	const addQuickTemplate = (template) => {
		appendAttribute({ id: makeId(), name: template.nameEn, values: template.valuesEn });
		toast.success(t('messages.templateAdded', { name }));
	};

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

		return {
			maxAllowed,
			ok: !generalError && Object.keys(specificErrors).length === 0,
			general: generalError,
			specific: specificErrors
		}
	}
	const validateImages = (files, type) => {
		const { general, specific } = getErrors(files, type)
		setImageErrors((prev) => ({ ...prev, [type]: { general, specific } }));
		return !general && Object.keys(specific).length === 0;
	};


	const currentCombos = watch('combinations') || [];

	const handleSalePriceBlur = () => {

		const currentPrice = salePrice || '';
		const updated = currentCombos.map((combo) => {
			const hasPrice = combo.price && Number(combo.price) !== 0 && combo.price !== '';

			return {
				...combo,
				price: hasPrice ? combo.price : currentPrice
			};
		});
		setValue('combinations', updated, { shouldDirty: true, shouldValidate: false });
	};

	// --- Purchase Quantity Distribution Logic ---
	const handleTotalQuantityChange = (val) => {

		setTotalPurchaseQuantity(val);
		const num = Number(val);
		if (isNaN(num) || num <= 0) return;

		const combos = watch('combinations') || [];
		if (combos.length === 0) return;

		const perSku = Math.floor(num / combos.length);
		const remainder = num % combos.length;

		const next = combos.map((c, idx) => ({
			...c,
			stockOnHand: perSku + (idx === 0 ? remainder : 0)
		}));
		setValue('combinations', next, { shouldDirty: true });
	};

	const handleSkuQuantityBlur = () => {
		const combos = watch('combinations') || [];
		const total = combos.reduce((acc, c) => acc + (Number(c.stockOnHand) || 0), 0);
		setTotalPurchaseQuantity(String(total));
	};

	const onSubmit = async (data) => {
		let toastId;
		try {
			const isOthersValid = validateImages(otherFiles, 'other');
			const isMainValid = validateImages(mainFiles, 'main');
			if (!isMainValid || !isOthersValid) return;
			const anyUploading = [...(mainFiles ?? []), ...(otherFiles ?? [])].some((f) => f && f.uploadStatus === 'uploading');
			const anyUploadFailed = [...(mainFiles ?? []), ...(otherFiles ?? [])].some((f) => f && f.uploadStatus === 'error');
			if (anyUploading) { toast.error('Please wait for images upload to finish'); return; }
			if (anyUploadFailed) { toast.error('Some images failed to upload'); return; }
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


			const sp = safeNumberString(data.salePrice);
			if (sp !== '') fd.append('salePrice', sp);

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
			if (main?.orphanId) fd.append('mainImageOrphanId', String(main.orphanId));
			else if (main?.url && !main.url.startsWith('/uploads') && !main.isExisting) fd.append('mainImage', String(main.url));

			const existingImages = (otherFiles || []).filter((f) => f?.isExisting && f?.url && !removedImages.includes(f.url)).map((f) => ({ url: String(f.url) }));
			const imagesMeta = (otherFiles || []).filter((f) => f?.isFromLibrary && !f?.isExisting && f?.url).map((f) => ({ url: String(f.url) }));
			const orphanIds = (otherFiles || []).filter((f) => !f?.isExisting && !f?.isFromLibrary && f?.orphanId).map((f) => f.orphanId);
			if (isEditMode) fd.append('imagesMeta', JSON.stringify([...existingImages, ...imagesMeta]));
			else fd.append('imagesMeta', JSON.stringify(imagesMeta));
			if (orphanIds.length) fd.append('imagesOrphanIds', JSON.stringify(orphanIds));
			if (isEditMode && removedImages.length > 0) fd.append('removedImages', JSON.stringify(removedImages));

			const skusToCheck = (data.combinations || [])
				.filter((c) => c?.isActive !== false)
				.map((c) => (c?.sku || '').trim())
				.filter(Boolean);
			if (skusToCheck.length) {
				const checkRes = await api.post('/products/check-skus', {
					skus: skusToCheck,
					productId: isEditMode ? productId : undefined,
				});
				const existingSkus = new Set(checkRes?.data?.existing || []);
				const conflicts = {};
				(data.combinations || []).forEach((c, idx) => {
					const sku = (c?.sku || '').trim();
					if (sku && existingSkus.has(sku)) {
						conflicts[c?.sku] = true;
					}
				});
				setSkuConflictMap(conflicts);
				if (Object.keys(conflicts).length > 0) {
					toast.error(t('errors.skuAlreadyExists'));
					setTimeout(() => {
						combinationsSectionRef.current?.scrollIntoView({
							behavior: 'smooth',
							block: 'start',
						});
					}, 0);
					return;
				}
			} else {
				setSkuConflictMap({});
			}

			fd.append('combinations', JSON.stringify([...(data.combinations || [])]));

			// (otherFiles ?? []).forEach((f) => { if (!f) return; if (f.isFromLibrary || f.isExisting) return; if (f.file) fd.append('images', f.file); });
			// Add Purchase Data if enabled
			if (!isEditMode && hasPurchase) {
				const pData = {
					...data.purchase,
					supplierId: data.purchase.supplierId && data.purchase.supplierId !== 'none' ? data.purchase.supplierId : undefined,
					safeId: data.purchase.safeId && data.purchase.safeId !== 'none' ? data.purchase.safeId : undefined,
					paidAmount: Number(data.purchase.paidAmount || 0),
				};
				fd.append('purchase', JSON.stringify(pData));

				const receipt = purchaseReceipt[0];
				if (receipt?.file) fd.append('purchaseReceiptAsset', receipt.file);
			}
			toastId = toast.loading(isEditMode ? t('messages.updating') : t('messages.creating'));

			const apiCall = isEditMode
				? api.patch(`/products/${productId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
				: api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });



			await apiCall;

			toast.success(isEditMode ? t('messages.updated') : t('messages.created'), { id: toastId });

			navigate.push('/products');
		} catch (error) {
			toast.error(normalizeAxiosError(error), { id: toastId });
		}
	};

	useEffect(() => {
		if (!isEditMode || !existingProduct) return;
		const extractedAttributes = extractAttributesFromSkus(existingProduct.skus || []);
		const combinations = (existingProduct.skus || []).map((sku) => ({
			key: sku.key,
			variantId: sku.id,
			sku: sku.sku || '',
			attributes: sku.attributes || {},
			stockOnHand: sku.stockOnHand || 0,
			reserved: sku.reserved || 0,
			price: sku.price?.toString() || existingProduct.salePrice?.toString() || '',
			isActive: parseBooleanLike(sku.isActive ?? sku.active, true),
			isExisting: true
		}));

		reset({
			name: existingProduct.name || '', slug: existingProduct.slug || '', wholesalePrice: existingProduct.wholesalePrice?.toString() || '',
			salePrice: existingProduct.salePrice?.toString() || '', lowestPrice: existingProduct.lowestPrice?.toString() || '', storageRack: existingProduct.storageRack || '',
			categoryId: existingProduct.categoryId ? String(existingProduct.categoryId) : 'none', storeId: existingProduct.storeId ? String(existingProduct.storeId) : 'none',
			warehouseId: existingProduct.warehouseId ? String(existingProduct.warehouseId) : 'none', description: existingProduct.description || '',
			callCenterProductDescription: existingProduct.callCenterProductDescription || '', upsellingEnabled: existingProduct.upsellingEnabled || false,
			upsellingProducts: existingProduct.upsellingProducts || [], attributes: extractedAttributes, combinations: combinations
		});

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

	const duplicateAttributeIndexes = useMemo(() => {
		const seen = new Map();
		const dup = new Set();
		(attributesForDupCheck || []).forEach((attr, idx) => {
			const key = slugifyKey(attr?.name);
			if (!key) return;
			if (seen.has(key)) {
				dup.add(idx);
			} else {
				seen.set(key, idx);
			}
		});
		return dup;
	}, [attributesForDupCheck]);

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
										<Input {...register('name')} placeholder={t('placeholders.productName')} />
									</Field>

									<SlugInput
										errors={errors}
										register={register}
										mainName={existingProduct?.name}
										mainSlug={existingProduct?.slug}
										name={productName}
										slugStatus={slugStatus}
										slug={watchSlug}
										setValue={setValue}
										labelClassName="text-[13px] font-medium text-gray-500 dark:text-slate-400 tracking-wide"

									/>

									<Field label={t('fields.wholesalePrice')} error={errors?.wholesalePrice?.message}>
										<Input
											type="number"
											step="0.01"
											{...register('wholesalePrice')}
											placeholder={t('placeholders.wholesalePrice')}

										/>
									</Field>

									<Field label={t('fields.salePrice')} error={errors?.salePrice?.message}>
										<Input
											type="number"
											step="0.01"
											{...register('salePrice')}
											onBlur={handleSalePriceBlur}
											placeholder={t('placeholders.salePrice')}

										/>
									</Field>

									<Field label={t('fields.lowestPrice')} error={errors?.lowestPrice?.message}>
										<Input type="number" step="0.01" {...register('lowestPrice')} placeholder={t('placeholders.lowestPrice')} />
									</Field>

									<Field label={t('fields.storageRack')}>
										<Input {...register('storageRack')} placeholder={t('placeholders.storageRack')} />
									</Field>

									<Field label={t('fields.category')}>
										<Controller
											control={control}
											name="categoryId"
											render={({ field }) => (
												<Select value={field.value || ''} onValueChange={field.onChange}>
													<SelectTrigger >
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
													<SelectTrigger >
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
													<SelectTrigger >
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
														<div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 leading-tight">{locale === 'ar' ? template.name : template.nameEn}</div>
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
												isDuplicate={duplicateAttributeIndexes.has(aIndex)}
											/>
										))
									)}
								</div>
							</Card>
						</motion.div>

						{/* Combinations Card */}
						{comboFields.length > 0 && (
							<motion.div ref={combinationsSectionRef} variants={fadeUp} className="scroll-mt-24">
								<Card>
									<div className="flex items-center justify-between mb-5">
										<SectionHeader title={t('combinations.title')} />
										<div className="flex items-center gap-4">
											{!isEditMode && (
												<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
													<Controller
														control={control}
														name="hasPurchase"
														render={({ field }) => (
															<Checkbox
																checked={hasPurchase}
																onCheckedChange={(v) => {
																	setHasPurchase(!!v);
																}}
																id="has-purchase"
																className="rounded-md"
															/>
														)}
													/>
													<label htmlFor="has-purchase" className="text-[12px] font-bold text-amber-700 dark:text-amber-400 cursor-pointer select-none">
														{t('purchase.hasInvoice')}
													</label>
												</div>
											)}
											<span className="text-[12px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
												{comboFields.length} {t('combinations.count')}
											</span>
										</div>
									</div>

									{/* Purchase Data Form (Only in Create Mode + Toggle On) */}
									{!isEditMode && hasPurchase && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											className="mb-6 p-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.02] space-y-5"
										>
											<div className="flex items-center gap-2 pb-2 border-b border-primary/10">
												<FilePlus className="w-4 h-4 text-primary" />
												<h4 className="text-[14px] font-bold text-primary">{t('purchase.invoiceInfo')}</h4>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
												<Field label={t('purchase.supplier')}>
													<Controller
														control={control}
														name="purchase.supplierId"
														render={({ field }) => (
															<Select value={field.value || ''} onValueChange={field.onChange}>
																<SelectTrigger className="bg-white dark:bg-slate-900">
																	<SelectValue placeholder={t('purchase.supplierPlaceholder')} />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="none">{t('common.none')}</SelectItem>
																	{suppliers.map((s) => (
																		<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
																	))}
																</SelectContent>
															</Select>
														)}
													/>
												</Field>

												<Field label={t('purchase.invoiceNumber')}>
													<Input {...register('purchase.receiptNumber')} placeholder="INV-000" className="bg-white dark:bg-slate-900" />
												</Field>

												<Field label={t('purchase.safe')}>
													<Controller
														control={control}
														name="purchase.safeId"
														render={({ field }) => (
															<Select value={field.value || ''} onValueChange={field.onChange}>
																<SelectTrigger className="bg-white dark:bg-slate-900">
																	<SelectValue placeholder={t('purchase.safePlaceholder')} />
																</SelectTrigger>
																<SelectContent className="bg-card-select">
																	<SelectItem value="نقدي">{tPurchase("options.safe.cash")}</SelectItem>
																	<SelectItem value="الخزينة الرئيسية">{tPurchase("options.safe.main")}</SelectItem>
																	<SelectItem value="الخزينة الفرعية">{tPurchase("options.safe.sub")}</SelectItem>
																	<SelectItem value="الخزينة الإضافية">{tPurchase("options.safe.extra")}</SelectItem>
																</SelectContent>
															</Select>
														)}
													/>
												</Field>

												<Field label={t('purchase.totalQuantity')}>
													<div className="relative">
														<Input
															type="number"
															value={totalPurchaseQuantity}
															onChange={(e) => handleTotalQuantityChange(e.target.value)}
															placeholder="0"
															className="bg-white dark:bg-slate-900 pr-10"
														/>
														<div className="absolute end-3 top-1/2 -translate-y-1/2 group cursor-help">
															<Info className="w-4 h-4 text-slate-400" />
															<div className="absolute bottom-full right-0 mb-2 w-48 p-2 rounded-lg bg-slate-800 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
																{t('purchase.quantityDistribution')}
															</div>
														</div>
													</div>
												</Field>

												<Field label={t('purchase.paidAmount')}>
													<Input type="number" step="0.01" {...register('purchase.paidAmount')} placeholder="0.00" className="bg-white dark:bg-slate-900" />
												</Field>

												<div className="md:row-span-2">
													<ImageUploadBox
														title={t('purchase.receipt')}
														files={purchaseReceipt}
														onFilesChange={(next) => setPurchaseReceipt(next.slice(0, 1))}
														multiple={false}
														// className="h-[46px] min-h-0 py-0"
														compact
													/>
												</div>

												<Field label={t('purchase.notes')} className="md:col-span-2 ">
													<Textarea {...register('purchase.notes')} placeholder="..." className="bg-white dark:bg-slate-900 min-h-[60px]" />
												</Field>
											</div>
										</motion.div>
									)}

									<div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
										<div className="overflow-x-auto max-h-[520px] overflow-y-auto" >
											<table className="w-full text-[13px]">
												<thead>
													<tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
														<th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">{t('combinations.combinationName')}</th>
														<th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 font-[Inter]">SKU</th>
														<th className="text-center px-2 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[100px]">{t('combinations.isActive')}</th>
														<th className="text-center px-2 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[80px]">{t('combinations.onHand')}</th>
														<th className="text-center px-2 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[80px]">{t('combinations.reserved')}</th>
														<th className="text-center px-2 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[80px]">{t('combinations.available')}</th>
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
														const skuHasConflict = !!skuConflictMap[c.sku];
														const isExistingCombination = isEditMode && !!current?.isExisting;
														const canEditSku = !isEditMode || !isExistingCombination;


														// حساب المتوفر: الكمية الفعلية - المحجوز
														const onHand = isEditMode || hasPurchase ? current?.stockOnHand || 0 : 0;
														const reserved = current?.reserved || 0;
														const available = Math.max(0, onHand - reserved);
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
																		disabled={!canEditSku}
																		className={cn(
																			"h-[38px] rounded-lg font-[Inter] text-[12px]",
																			canEditSku
																				? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
																				: "bg-slate-100 dark:bg-slate-900 border-transparent text-slate-400 cursor-not-allowed",
																			skuHasConflict ? "border-red-400 ring-1 ring-red-300" : ""
																		)}
																	/>
																	{skuHasConflict && <p className="text-[11px] text-red-500 mt-0.5">{t('errors.thisSkuAlreadyExists')}</p>}

																</td>
																<td className="px-2 py-3 text-center">
																	<Controller
																		control={control}
																		name={`combinations.${idx}.isActive`}
																		render={({ field }) => (
																			<Checkbox
																				checked={parseBooleanLike(field.value, true)}
																				onCheckedChange={(v) => field.onChange(!!v)}
																				className="rounded-md"
																			/>
																		)}
																	/>
																</td>
																<td className="px-2 py-3 text-center">
																	{!isEditMode && hasPurchase ? (
																		<Input
																			type="number"
																			{...register(`combinations.${idx}.stockOnHand`)}
																			onBlur={handleSkuQuantityBlur}
																			className="h-[34px] w-[70px] mx-auto text-center rounded-lg text-[12px]"
																		/>
																	) : (
																		<span className="font-medium text-slate-700 dark:text-slate-300">{onHand}</span>
																	)}
																</td>
																<td className="px-2 py-3 text-center">
																	<span className="text-amber-600 dark:text-amber-400 font-medium">{reserved}</span>
																</td>
																<td className="px-2 py-3 text-center">
																	<span className={cn(
																		"px-2 py-1 rounded-md font-bold",
																		available <= 5 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
																	)}>
																		{available}
																	</span>
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
							onFilesChange={(updater, isDeleted) => {
								setMainFiles((prev) => {
									const next = typeof updater === 'function' ? updater(prev) : updater;

									prev.forEach((f) => f?.previewUrl && !f.isFromLibrary && !f.isExisting && URL.revokeObjectURL(f.previewUrl));

									//keep one uploadStatus success and keep any ather things
									const safeNext = (next ?? []).filter(Boolean);
									const success = safeNext.find((n) => n?.uploadStatus === 'success');
									const others = safeNext.filter((n) => n?.uploadStatus !== 'success');
									const sliced = [success, ...others].filter(Boolean)

									return sliced;
								});
								// setImageErrors(prev => ({ ...prev, main: {} }));
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
								// setImageErrors(prev => ({ ...prev, other: {} }));
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

/** ── Attribute Editor ─────────────────────────────────────────────────────── */
function AttributeEditor({ t, control, register, errors, aIndex, onRemove, setValue, isDuplicate = false }) {
	const valuesWatch = useWatch({ control, name: `attributes.${aIndex}.values` }) || [];

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				"rounded-xl border bg-white dark:bg-slate-900 p-4",
				isDuplicate ? "border-red-300 dark:border-red-800" : "border-slate-100 dark:border-slate-800"
			)}
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
			{isDuplicate && <p className="text-[11px] text-red-500 mt-2">{t('attributes.duplicateName')}</p>}
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
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/** ── Image Upload Box ─────────────────────────────────────────────────────── */
export function ImageUploadBox({ title, files, onFilesChange, onRemove, multiple = true, accept = 'image/*', className, error, uploadMode = 'local', getErrors, setErrors }) {
	const t = useTranslations('addProduct');
	const inputRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);
	const generalErrorMessage = typeof error === 'string' ? error : error?.general;
	const specificErrors = error?.specific || {};

	const deleteOrphan = React.useCallback((orphanId) => {
		const id = orphanId;
		if (!Number.isFinite(id) || id <= 0) return;
		// Fire-and-forget: cron will clean up if this fails
		void api.delete(`/orphan-files/${id}`).catch(() => { });
	}, []);

	const uploadOne = React.useCallback(async (item) => {
		const fd = new FormData();
		fd.append('file', item.file);
		const res = await api.post('/orphan-files', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
		const id = res?.data?.id;
		const url = res?.data?.url;
		if (!id || !url) throw new Error('Upload failed');
		return { orphanId: id, orphanUrl: String(url) };
	}, []);

	const addFiles = React.useCallback((picked) => {
		const next = picked.map((file) => ({
			id: makeId(),
			file,
			previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
			isFromLibrary: false,
			isExisting: false,
			uploadStatus: uploadMode === 'direct' ? 'uploading' : 'idle',
			orphanId: null,
			orphanUrl: null,
		}));
		const safeFiles = (files ?? []).filter(Boolean);


		const revokePreview = (item) => {
			if (item?.previewUrl && !item.isFromLibrary && !item.isExisting) {
				URL.revokeObjectURL(item.previewUrl);
			}
		};

		if (!multiple && typeof getErrors === 'function') {
			const { ok } = getErrors(next);
			if (!ok) {
				next.forEach((n) => {
					n.uploadStatus = "error";
					return n;
				})
				const merged = [...next, ...safeFiles];
				//get errors again after merging to save prev old files errors
				const { ok, ...errors } = getErrors(merged);
				setErrors(errors)
				onFilesChange(merged);
				return;
			}
		}
		// MULTI MODE: allow partial upload (valid only)
		if (multiple && typeof getErrors === 'function') {
			const { specific = {}, maxAllowed = 20 } = getErrors(next) || {};

			const invalidNext = next.filter((n) => !!specific?.[n.id]).map((n) => ({ ...n, uploadStatus: "error" }));
			const validNext = next.filter((n) => !specific?.[n.id]);

			const remainingSlots = Math.max(0, Number(maxAllowed) - safeFiles.length);
			const acceptedValid = validNext.slice(0, remainingSlots);
			const droppedValid = validNext.slice(remainingSlots);

			// drop extra valids completely if exceeding max (revoke previews)
			droppedValid.forEach(revokePreview);

			const merged = [...invalidNext, ...acceptedValid, ...safeFiles];
			// compute errors for merged so UI shows invalid messages and keeps previous errors
			const { ok, ...errors } = getErrors(merged) || {};
			if (typeof setErrors === "function") setErrors(errors);
			onFilesChange(merged);

			// upload only accepted valid
			if (uploadMode === 'direct') {
				acceptedValid.forEach(async (it) => {
					try {
						const { orphanId, orphanUrl } = await uploadOne(it);
						onFilesChange((curr) => (curr ?? []).filter(Boolean).map((x) => x.id === it.id ? { ...x, uploadStatus: 'success', orphanId, orphanUrl } : x));
					} catch (e) {
						onFilesChange((curr) => (curr ?? []).filter(Boolean).map((x) => x.id === it.id ? { ...x, uploadStatus: 'error' } : x));
					}
				});
			}

			return;
		}

		// single-file mode: replacing should delete old orphan first
		if (!multiple) {
			const prev = safeFiles?.[0];
			const proposed = next.slice(0, 1);
			onFilesChange(proposed);

			// after validation passes, delete old and replace
			if (prev?.previewUrl && !prev.isFromLibrary && !prev.isExisting) URL.revokeObjectURL(prev.previewUrl);
			if (uploadMode === 'direct' && prev?.orphanId && !prev.isExisting && !prev.isFromLibrary) deleteOrphan(prev.orphanId);


		} else {
			const merged = [...next, ...safeFiles];

			onFilesChange(merged);

		}

		if (uploadMode === 'direct') {
			next.forEach(async (it) => {
				try {
					const { orphanId, orphanUrl } = await uploadOne(it);

					onFilesChange((curr) => {
						return (curr ?? []).filter(Boolean).map((x) => x.id === it.id ? { ...x, uploadStatus: 'success', orphanId, orphanUrl } : x);
					});
				} catch (e) {
					onFilesChange((curr) => (curr ?? []).filter(Boolean).map((x) => x.id === it.id ? { ...x, uploadStatus: 'error' } : x));
				}
			});
		}
	}, [deleteOrphan, files, multiple, uploadMode, uploadOne]);

	const onPick = (e) => {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;
		addFiles(picked);
		e.target.value = '';
	};

	const removeFile = (id) => {
		const target = (files ?? []).filter(Boolean).find((f) => f.id === id);
		if (onRemove) onRemove(target);
		if (target?.previewUrl && !target.isFromLibrary && !target.isExisting) URL.revokeObjectURL(target.previewUrl);
		// remove from UI first
		onFilesChange((files ?? []).filter(Boolean).filter((f) => f.id !== id));
		// then try to delete orphan row (only for direct uploads)
		if (uploadMode === 'direct' && target?.orphanId && !target.isExisting && !target.isFromLibrary) {
			deleteOrphan(target.orphanId);
		}
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
				"bg-card rounded-2xl border shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5",
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
			{(files ?? []).filter(Boolean).length > 0 && (
				<div className="mt-3 space-y-2">
					{(files ?? []).filter(Boolean).map((f) => {
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
									) : f.uploadStatus === 'uploading' ? (
										<p className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
											<Loader2 className="h-3 w-3 animate-spin" />
											Uploading...
										</p>
									) : f.uploadStatus === 'error' ? (
										<p className="text-[11px] text-red-500 font-medium">Upload failed</p>
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