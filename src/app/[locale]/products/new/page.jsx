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
import { ImageUploadBox } from '@/components/atoms/ImageUploadBox';
import { TagInput } from '@/components/atoms/TagInput';
import LANG from '@/components/atoms/LANG';
import { baseImg } from '@/utils/axios';
import { useAutoTranslate } from '@/utils/autoTranslate';
import SlugInput from '@/components/atoms/SlugInput';
import PageHeader from '@/components/atoms/Pageheader';
import ProductFilter from '@/components/atoms/ProductFilter';
import { InvoiceSummary, ReceiptImageUpload } from '../../purchases/new/page';

const MAX_RECEIPT_MB = 5;
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

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

export function makeId() {
	return crypto.randomUUID();
}

export function slugifyKey(s) {
	return (s || '')
		.toString()
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '_')
		// .replace(/[^\w]/g, '')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '');
}

export function canonicalKey(attrs) {
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
		const attrValues = Object.values(x.attrs)
			.map((v) => {

				const isArabic = /[\u0600-\u06FF]/.test(v);
				const slug = slugifyKey(v).toUpperCase();

				return isArabic ? slug : slug.substring(0, 3);
			})
			.join('-');

		const autoSKU = attrValues ? `${productSlug}-${attrValues}` : '';
		return { key, attributes: x.attrs, sku: autoSKU, stockOnHand: 0, price: defaultPrice || '', isActive: true, isExisting: false };
	});
}

const makeSchema = (t, tValidation) =>
	yup.object({
		hasPurchase: yup.boolean().default(false),
		type: yup.string().oneOf(['single', 'variable']).default('variable'),
		name: yup.string().trim().required(t('validation.nameRequired')).max(200, t('validation.nameTooLong', { max: 200 })),
		slug: yup.string().trim().required(t('validation.slugRequired')).matches(/^[a-z0-9-_]+$/, t('validation.slugInvalid')),
		wholesalePrice: yup.number().transform((value, originalValue) => originalValue === "" ? NaN : value).typeError(t('validation.requiredNumber')).required(t('validation.requiredNumber')).min(0, t('validation.noNegative')),
		salePrice: yup.number().transform((value, originalValue) => originalValue === "" ? NaN : value).typeError(t('validation.requiredNumber')).required(t('validation.requiredNumber')).min(0, t('validation.noNegative')),
		lowestPrice: yup.number().transform((value, originalValue) => originalValue === "" ? NaN : value).typeError(t('validation.requiredNumber')).required(t('validation.requiredNumber')).min(0, t('validation.noNegative')),
		storageRack: yup.string().nullable(),
		categoryId: yup.string().nullable(),
		storeId: yup.string().nullable(),
		warehouseId: yup.string().nullable(),
		description: yup.string().nullable().max(2000, t('validation.descriptionTooLong', { max: 2000 })),
		callCenterProductDescription: yup.string().nullable().max(2000, t('validation.descriptionTooLong', { max: 2000 })),
		upsellingEnabled: yup.boolean().default(false),
		upsellingProducts: yup.array().of(yup.object({ productId: yup.string().trim().required(t('validation.upsellProductRequired')), label: yup.string().nullable(), callCenterDescription: yup.string().nullable().max(1000, t('validation.descriptionTooLong', { max: 1000 })) })).default([]),
		attributes: yup.array().of(yup.object({ id: yup.string().required(), name: yup.string().trim().required(t('validation.attributeNameRequired')), values: yup.array().of(yup.string().trim().required(t('validation.attributeValueRequired'))).min(1, t('validation.atLeastOneValue')) })).default([]),
		combinations: yup.array().of(
			yup.object({
				key: yup.string().trim().required(t('validation.combinationKeyRequired')),
				sku: yup
					.string()
					.trim()
					.transform((value) => {
						if (!value) return value;

						return value
							.trim()
							.replace(/\s+/g, (match, offset, string) => {
								const charBefore = string[offset - 1];
								const charAfter = string[offset + match.length];

								const isSurroundedBySpecial = /[-_]/.test(charBefore) || /[-_]/.test(charAfter);

								return isSurroundedBySpecial ? '' : '-';
							});
					})
					.max(120, t('validation.combinationSkuMax'))
					.nullable()
					.test('sku-format', t('validation.skuFormat'), (val) => {
						if (val == null || String(val).trim() === '') return true;
						return /^[a-zA-Z0-9-]+$/.test(String(val).trim());
					}),
				attributes: yup.object().required(t('validation.combinationAttrsRequired')),
				stockOnHand: yup.number().typeError(t('validation.invalidNumber')).min(0, t('validation.stockNonNegative')).default(0),
				price: yup.number().typeError(t('validation.invalidNumber')).required(t('validation.priceRequired')).min(0, t('validation.noNegative')),
				isActive: yup.boolean().default(true),
				isExisting: yup.boolean().default(false)
			})
		)
			.default([])
			.test('single-sku-required', t('validation.singleSkuRequired'), function (value) {
				if (this.parent?.type !== 'single') return true;
				const hasSku = !!((value?.[0]?.sku ?? '').toString().trim());
				return hasSku || this.createError({ path: 'combinations[0].sku', message: t('validation.singleSkuRequired') });
			})
			.test('unique-skus', t('validation.duplicateSku'), function (value) {
				if (!value || value.length <= 1) return true;

				const skus = value
					.map(v => (v.sku || '').toString().trim().toLowerCase())
					.filter(sku => sku !== '');

				const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);

				if (duplicates.length > 0) {

					const duplicateIndex = value.findIndex(v =>
						(v.sku || '').toString().trim().toLowerCase() === duplicates[0]
					);

					return this.createError({
						path: `combinations[${duplicateIndex}].sku`,
						message: `${t('validation.skuMustBeUnique')}: ${duplicates[0]}`
					});
				}
				return true;
			}),
		purchase: yup.object({
			supplierId: yup.string().optional(),
			receiptNumber: yup.string().optional(),
			safeId: yup.string().optional(),
			notes: yup.string().optional(),
			paidAmount: yup
				.number()
				.transform((value, originalValue) => {
					if (originalValue === "" || originalValue === null || originalValue === undefined) return 0;
					const n = Number(originalValue);
					return Number.isFinite(n) ? n : 0;
				})
				.min(0, tValidation('mustBePositive'))
				.optional(),
		})
			.default({
				supplierId: '',
				receiptNumber: '',
				safeId: '',
				notes: '',
				paidAmount: 0
			})
			// ✅ APPLY VALIDATION HERE
			.when('hasPurchase', {
				is: true,
				then: (schema) => schema.shape({
					supplierId: yup.string().required(tValidation('supplierRequired')),
					receiptNumber: yup.string().required(tValidation('receiptNumberRequired')),
					safeId: yup.string().required(tValidation('safeRequired')),
				}),
				otherwise: (schema) => schema.optional(),
			}),
	}).required();

function defaultAttribute() {
	return { id: makeId(), name: '', values: [] };
}

function getDefaultValues() {
	return {
		hasPurchase: false,
		type: 'variable',
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

function ProductPurchaseReceiptUpload({ receipt, onChange, onRemove, t, tValidation }) {
	const inputRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);

	const handlePick = (file) => {
		if (!file) return;
		const okType = ALLOWED_RECEIPT_TYPES.includes(file.type);
		if (!okType) {
			toast.error(tValidation('invalidFileType'));
			return;
		}
		if (file.size > MAX_RECEIPT_MB * 1024 * 1024) {
			toast.error(tValidation('fileTooLarge'));
			return;
		}
		if (file.type === 'application/pdf') {
			onChange({ file, preview: null, name: file.name, isPdf: true });
			return;
		}
		const reader = new FileReader();
		reader.onloadend = () => {
			onChange({ file, preview: reader.result, name: file.name, isPdf: false });
		};
		reader.readAsDataURL(file);
	};

	return (
		<div
			onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
			onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
			onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
			onDrop={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setIsDragging(false);
				handlePick(e.dataTransfer.files?.[0]);
			}}
			className={cn("rounded-xl border-2 min-h-[200px] flex items-center  justify-center border-dashed transition-all duration-300", isDragging ? "border-primary bg-primary/5" : "border-primary/30 bg-white dark:bg-slate-900")}
		>
			<input
				ref={inputRef}
				type="file"
				accept={ALLOWED_RECEIPT_TYPES.join(',')}
				className="hidden"
				onChange={(e) => handlePick(e.target.files?.[0])}
			/>
			{!receipt ? (
				<div onClick={() => inputRef.current?.click()} className="min-h-[200px] flex-1 flex items-center justify-center flex-col gap-2 p-4 rounded-xl text-center hover:bg-primary/10 duration-300 cursor-pointer">
					<div className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{t('purchase.receipt')}</div>
					<div className="text-[11px] text-slate-400 mt-1">{t('uploads.attach')}</div>
				</div>
			) : (
				<div className="p-3 flex items-center justify-between gap-2">
					<div className="min-w flex-col -0">
						<p className="text-[12px] font-semibold text-slate-700 flex-1 dark:text-slate-200 truncate">{receipt.name}</p>
						<p className="text-[11px] text-slate-400">{receipt.isPdf ? 'PDF' : 'Image'}</p>
					</div>
					<Button type="button" variant="ghost" size="sm" onClick={onRemove}>
						<X className="w-4 h-4 text-red-500" />
					</Button>
				</div>
			)}
		</div>
	);
}

function PurchaseDataForm({
	t,
	tPurchase,
	control,
	register,
	errors,
	suppliers,
	totalPurchaseQuantity,
	onTotalQuantityChange,
	totalPurchaseQuantityError,
	purchaseReceipt,
	setPurchaseReceipt,
	setValue,
	clearErrors,
	invoiceSummary,
	singleMode = false
}) {
	const tValidation = useTranslations("validation");

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
			setPurchaseReceipt(pdfObj);
			setValue('purchase.receiptAsset', pdfObj, { shouldValidate: true });
			clearErrors('purchase.receiptAsset');
			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			const obj = { file, preview: reader.result, name: file.name, isPdf: false };
			setPurchaseReceipt(obj);
			setValue('purchase.receiptAsset', obj, { shouldValidate: true });
			clearErrors('purchase.receiptAsset');
		};
		reader.readAsDataURL(file);
	};


	const handleRemoveImage = () => {
		setPurchaseReceipt(null);
		setValue('purchase.receiptAsset', null, { shouldValidate: true });
	};

	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			className="my-6 p-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.02] space-y-5"
		>
			<div className="flex items-center gap-2 pb-2 border-b border-primary/10">
				<FilePlus className="w-4 h-4 text-primary" />
				<h4 className="text-[14px] font-bold text-primary">{t('purchase.invoiceInfo')}</h4>
			</div>
			<div className='flex max-lg:flex-col gap-6 '>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 space-y-6 h-fit">
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
						{errors?.purchase?.supplierId?.message && <p className="text-[11px] text-red-500">{errors.purchase.supplierId.message}</p>}
					</Field>
					<Field label={t('purchase.invoiceNumber')}>
						<Input {...register('purchase.receiptNumber')} placeholder="INV-000" className="bg-white dark:bg-slate-900" />
						{errors?.purchase?.receiptNumber?.message && <p className="text-[11px] text-red-500">{errors.purchase.receiptNumber.message}</p>}
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
						{errors?.purchase?.safeId?.message && <p className="text-[11px] text-red-500">{errors.purchase.safeId.message}</p>}
					</Field>
					{!singleMode && <Field label={t('purchase.totalQuantity')}>
						<div className="relative">
							<Input
								type="number"
								value={totalPurchaseQuantity}
								onChange={(e) => onTotalQuantityChange(e.target.value)}
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
						{totalPurchaseQuantityError && <p className="text-[11px] text-red-500">{totalPurchaseQuantityError}</p>}
					</Field>}
					<Field label={t('purchase.paidAmount')}>
						<Input type="number"  {...register('purchase.paidAmount')} placeholder="0.00" className="bg-white dark:bg-slate-900" />
					</Field>
					<Field label={t('purchase.notes')} className="lg:col-span-2 ">
						<Textarea {...register('purchase.notes')} placeholder="..." className="bg-white dark:bg-slate-900 !min-h-[120px]" />
					</Field>
				</div>
				<div className='w-full space-y-4 lg:max-w-[350px]'>
					<div className="space-y-1">
						<ReceiptImageUpload
							image={purchaseReceipt}
							onImageChange={handleImageUpload}
							onRemove={handleRemoveImage}
						/>

					</div>
					<InvoiceSummary
						paidAmount={invoiceSummary.paidAmount}
						remainingAmount={invoiceSummary.remainingAmount}
						total={invoiceSummary.total}
						summary={invoiceSummary.summary}
					/>
				</div>
			</div>
		</motion.div>
	);
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

export default function AddProductPage({ isEditMode = false, existingProduct = null, productId = null, defaultValues = null }) {
	const remoteId = defaultValues?.remoteId;

	const combinationsSectionRef = useRef(null);
	const tPurchase = useTranslations("purchaseInvoice");
	const t = useTranslations('addProduct');
	const tValidation = useTranslations('validation');
	const locale = useLocale();
	const [imageErrors, setImageErrors] = useState({
		main: { general: '', specific: {} },
		other: { general: '', specific: {} }
	});
	const navigate = useRouter();
	const [categories, setCategories] = useState([]);
	const [stores, setStores] = useState([]);
	const [warehouses, setWarehouses] = useState([]);
	const [mainFiles, setMainFiles] = useState(defaultValues?.mainImage ? [defaultValues?.mainImage] : []);
	const [otherFiles, setOtherFiles] = useState(defaultValues?.images || []);
	const [removedImages, setRemovedImages] = useState([]);

	const [hasPurchase, setHasPurchase] = useState(false);
	const [suppliers, setSuppliers] = useState([]);
	const [purchaseReceipt, setPurchaseReceipt] = useState(null);
	const [totalPurchaseQuantity, setTotalPurchaseQuantity] = useState('');
	const [totalPurchaseQuantityError, setTotalPurchaseQuantityError] = useState('');

	const schema = useMemo(() => makeSchema(t, tValidation), [t, tValidation]);
	const { control, register, handleSubmit, setValue, reset, watch, clearErrors, formState: { errors, isSubmitting } } = useForm({
		defaultValues: defaultValues ? defaultValues : getDefaultValues(), resolver: yupResolver(schema), mode: 'onTouched',
	});

	const upsellingEnabled = watch('upsellingEnabled');
	const productName = watch('name');
	const productSlug = watch('slug');
	const productType = watch('type') || 'variable';
	const attributesForDupCheck = useWatch({ control, name: 'attributes' }) || [];
	const [skuConflictMap, setSkuConflictMap] = useState({});
	const salePrice = watch('salePrice');
	const purchasePaidAmount = watch('purchase.paidAmount');

	useEffect(() => {
		if (productType !== 'single') return;
		const current = watch('combinations') || [];
		const first = current[0] || {};
		const defaultSku = (first?.sku || '').toString().trim() || `${getSkuBaseFromSlug(productSlug || productName || '')}-MAIN`;
		setValue('combinations', [{
			key: 'default',
			attributes: {},
			sku: defaultSku,
			stockOnHand: first?.stockOnHand ?? 0,
			reserved: first?.reserved ?? 0,
			price: salePrice || first?.price || '',
			isActive: parseBooleanLike(first?.isActive, true),
			isExisting: !!first?.isExisting,
			variantId: first?.variantId,
		}], { shouldDirty: true, shouldValidate: true });
	}, [productType, productSlug, productName, salePrice, setValue]);

	useEffect(() => {
		if (!upsellingEnabled) setValue('upsellingProducts', [], { shouldDirty: true });
	}, [upsellingEnabled, setValue]);

	const wholesalePrice = watch('wholesalePrice');
	const categoryId = watch('categoryId');
	const storeId = watch('storeId');
	const warehouseId = watch('warehouseId');


	const attributesWatch = useWatch({ control, name: 'attributes' });
	const combinationsWatch = useWatch({ control, name: 'combinations' });

	const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({ control, name: 'attributes', keyName: 'fieldId' });
	const { fields: comboFields } = useFieldArray({ control, name: 'combinations', keyName: 'fieldId' });

	console.log(errors)
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
				let loadedCategories = Array.isArray(catsRes.data) ? catsRes.data : [];
				const defaultCategoryValue = defaultValues?.categoryName; // هذا الآن يحمل اسم التصنيف

				if (!isEditMode && defaultCategoryValue && defaultCategoryValue !== 'none') {

					const existingCat = loadedCategories.find(c =>
						(c.name && c.name.toLowerCase() === defaultCategoryValue.toLowerCase()) ||
						(c.label && c.label.toLowerCase() === defaultCategoryValue.toLowerCase())
					);

					if (existingCat) {

						setValue('categoryId', String(existingCat.id));
						setValue('categoryId', String(defaultCategoryValue));
					} else {
						loadedCategories = [
							...loadedCategories,
							{
								id: defaultCategoryValue,
								name: defaultCategoryValue,
								isExternal: true
							}
						];
					}
				}

				setCategories(loadedCategories);

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
	const extractedAttributes = useMemo(() => extractAttributesFromSkus(existingProduct?.skus || []), [existingProduct?.skus])
	const isAttrEdited = useRef(false)

	const initialSig = useMemo(() => {
		if (!isEditMode || !extractedAttributes || isAttrEdited.current) return '';
		return JSON.stringify({
			attributes: extractedAttributes.map(a => ({ name: a?.name, values: a?.values || [] })),
		});
	}, [isEditMode, extractedAttributes, existingProduct]);

	const currentSig = useMemo(() => {
		if (isAttrEdited.current) return;

		const attributes = attributesWatch || [];

		return JSON.stringify({
			attributes: attributes.map((a) => ({
				name: a?.name,
				values: a?.values || []
			})),

		});
	}, [attributesWatch]);

	useEffect(() => {
		if (currentSig !== initialSig) {
			isAttrEdited.current = true;
		}
	}, [currentSig, initialSig])
	useEffect(() => {
		const attributes = attributesWatch || [];
		const currentSlug = productSlug || '';
		const currentCombos = watch('combinations') || [];

		const currentPrice = salePrice || '';
		const sig = JSON.stringify({
			attributes: (attributes || []).map((a) => ({ name: a?.name, values: a?.values || [] })),
			productSlug: currentSlug,
			salePrice: currentPrice,
			isEditMode, productType
		});

		if (lastCombSigRef.current === sig) return;
		lastCombSigRef.current = sig;

		if (productType !== 'variable') {
			const first = currentCombos?.[0] || {};
			setValue('combinations', [{
				key: 'default',
				attributes: {},
				sku: first?.sku || '',
				stockOnHand: first?.stockOnHand ?? 0,
				reserved: first?.reserved ?? 0,
				price: currentPrice || first?.price || '',
				isActive: parseBooleanLike(first?.isActive, true),
				isExisting: !!first?.isExisting,
				variantId: first?.variantId,
			}], { shouldDirty: true, shouldValidate: false });
			return;
		}
		if (!isAttrEdited.current) return;

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
	}, [attributesWatch, productSlug, salePrice, isEditMode, productType]);

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
			const isExisting = combo?.isExisting;

			return {
				...combo,
				price: isExisting ? combo.price : currentPrice
			};
		});
		setValue('combinations', updated, { shouldDirty: true, shouldValidate: false });
	};

	// --- Purchase Quantity Distribution Logic ---
	const handleTotalQuantityChange = (val) => {
		setTotalPurchaseQuantityError('');

		const cleanVal = val ? val.toString().replace(/[^0-9]/g, '') : '';
		setTotalPurchaseQuantity(cleanVal);

		const num = parseInt(cleanVal, 10);

		if (isNaN(num) || num <= 0) return;

		const combos = watch('combinations') || [];
		if (combos.length === 0) return;

		const perSku = Math.floor(num / combos.length);

		const remainder = num % combos.length;

		const next = combos.map((c, idx) => ({
			...c,
			stockOnHand: perSku + (idx === 0 ? remainder : 0)
		}));
		setValue('combinations', next, { shouldDirty: true, shouldValidate: true });
	};

	const handleSkuQuantityBlur = () => {
		const combos = watch('combinations') || [];
		const total = combos.reduce((acc, c) => acc + (Number(c.stockOnHand) || 0), 0);
		setTotalPurchaseQuantity(String(total));
		if (total > 0) setTotalPurchaseQuantityError('');
	};

	const purchaseSummary = useMemo(() => {
		const combos = Array.isArray(combinationsWatch) ? combinationsWatch : [];
		const stockRows = combos.filter((c) => Number(c?.stockOnHand || 0) > 0);
		const subtotal = stockRows.reduce((sum, c) => {
			const stock = Number(c?.stockOnHand || 0);
			const price = Number(c?.price || 0);
			return sum + (stock * price);
		}, 0);
		const paidAmount = Number(purchasePaidAmount || 0);
		const total = subtotal - paidAmount;
		return {
			summary: {
				productCount: stockRows.length,
				subtotal,
			},
			paidAmount,
			total,
			remainingAmount: total,
		};
	}, [combinationsWatch, purchasePaidAmount]);

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
			if (!isEditMode && hasPurchase && Number(totalPurchaseQuantity || 0) <= 0) {
				setTotalPurchaseQuantityError(t('validation.totalQuantityRequired'));
				toast.error(t('validation.totalQuantityRequired'));
				return;
			}
			if (data.combinations && data.combinations.length > 0) {
				const sourceCombos = productType === 'single'
					? [{ ...(data.combinations?.[0] || {}), price: data.salePrice }]
					: data.combinations;
				const missingPrices = sourceCombos.filter((c) => !c.price || c.price === '');
				if (missingPrices.length > 0) { toast.error(t('errors.missingPrices')); return; }
			}

			const fd = new FormData();
			fd.append('name', data.name.trim());
			if (!isEditMode) fd.append('type', productType);

			const wp = safeNumberString(data.wholesalePrice);
			if (wp !== '') fd.append('wholesalePrice', wp);


			const sp = safeNumberString(data.salePrice);
			if (sp !== '') fd.append('salePrice', sp);

			const lp = safeNumberString(data.lowestPrice);
			if (lp !== '') fd.append('lowestPrice', lp);
			if ((data.storageRack ?? '').trim()) fd.append('storageRack', data.storageRack.trim());
			if ((data.slug ?? '').trim()) fd.append('slug', data.slug.trim());


			if (data.categoryId && data.categoryId !== 'none') {
				const selectedCat = categories.find(c => String(c.id) === String(data.categoryId));

				if (selectedCat && selectedCat.isExternal) {
					fd.append('categoryName', selectedCat.name);
				} else {
					fd.append('categoryId', data.categoryId);
				}
			}

			if (data.storeId) fd.append('storeId', data.storeId);
			if (data.warehouseId) fd.append('warehouseId', data.warehouseId);
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

			const combinationsPayload = productType === 'single'
				? [{
					key: data.combinations?.[0]?.key || 'default',
					attributes: {},
					sku: data.combinations?.[0]?.sku || '',
					price: safeNumberString(data.salePrice) || null,
					stockOnHand: Number(data.combinations?.[0]?.stockOnHand || 0),
					isActive: parseBooleanLike(data.combinations?.[0]?.isActive, true),
				}]
				: [...(data.combinations || [])];

			const skusToCheck = (combinationsPayload || [])
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
				(combinationsPayload || []).forEach((c, idx) => {
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

			if (!isEditMode && productType === 'single') {
				fd.append('singleSkuItem', JSON.stringify(combinationsPayload[0] || {}));
			} else {
				fd.append('combinations', JSON.stringify(combinationsPayload));
			}

			// (otherFiles ?? []).forEach((f) => { if (!f) return; if (f.isFromLibrary || f.isExisting) return; if (f.file) fd.append('images', f.file); });
			// Add Purchase Data if enabled
			if (!isEditMode && hasPurchase) {
				const pData = {
					notes: data.purchase.notes,
					receiptNumber: data.purchase.receiptNumber,
					supplierId: data.purchase.supplierId && data.purchase.supplierId !== 'none' ? data.purchase.supplierId : undefined,
					safeId: data.purchase.safeId && data.purchase.safeId !== 'none' ? data.purchase.safeId : undefined,
					paidAmount: Number(data.purchase.paidAmount || 0),
				};
				fd.append('purchase', JSON.stringify(pData));

				const receipt = purchaseReceipt;
				if (receipt?.file) fd.append('purchaseReceiptAsset', receipt.file);
			}
			toastId = toast.loading(isEditMode ? t('messages.updating') : t('messages.creating'));
			if (!isEditMode) {
				fd.append('remoteId', remoteId);
			}
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
			type: existingProduct.type || 'variable',
			name: existingProduct.name || '', slug: existingProduct.slug || '', wholesalePrice: existingProduct.wholesalePrice?.toString() || '',
			salePrice: existingProduct.salePrice?.toString() || '', lowestPrice: existingProduct.lowestPrice?.toString() || '', storageRack: existingProduct.storageRack || '',
			categoryId: (existingProduct.categoryId || existingProduct.category?.id) ? String(existingProduct.categoryId || existingProduct.category?.id) : 'none',
			storeId: (existingProduct.storeId || existingProduct.store?.id) ? String(existingProduct.storeId || existingProduct.store?.id) : 'none',
			warehouseId: (existingProduct.warehouseId || existingProduct.warehouse?.id) ? String(existingProduct.warehouseId || existingProduct.warehouse?.id) : 'none', description: existingProduct.description || '',
			callCenterProductDescription: existingProduct.callCenterProductDescription || '', upsellingEnabled: existingProduct.upsellingEnabled || false,
			upsellingProducts: existingProduct.upsellingProducts || [], attributes: extractedAttributes, combinations: combinations
		});

		if (existingProduct.mainImage) { setMainFiles([{ id: makeId(), file: null, previewUrl: existingProduct.mainImage, isFromLibrary: false, isExisting: true, url: existingProduct.mainImage }]); }
		if (existingProduct.images && existingProduct.images.length) { setOtherFiles(existingProduct.images.map((img) => ({ id: makeId(), file: null, previewUrl: img.url, isFromLibrary: false, isExisting: true, url: img.url }))); }
	}, [isEditMode, existingProduct, reset]);

	const [slugStatus, setSlugStatus] = useState(null);
	const watchSlug = watch('slug');

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
			className="min-h-screen bg-slate-50 dark:bg-slate-950 p-5 pb-16 "
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
					className="flex max-xl:flex-col gap-5 mt-5 items-start"
				>
					{/* ── Left Column ── */}
					<div className="space-y-5 flex-1 min-w-0 w-full">

						{/* Product Info Card */}
						<motion.div variants={fadeUp}>
							<Card>
								<SectionHeader title={t('sections.productInfo')} action={
									!isEditMode && (
										<Controller
											control={control}
											name="type"
											render={({ field }) => (
												<div className="flex items-center gap-2 h-[34px] px-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
													<label
														htmlFor="product-type-check"
														className="text-[14px] font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none"
													>
														{t('sections.isSingleProduct')}
													</label>
													<Checkbox
														id="product-type-check"
														checked={field.value === 'single'}
														onCheckedChange={(checked) => {
															field.onChange(checked ? 'single' : 'variable');
														}}
														className="h-6 w-6 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
													/>
												</div>
											)}
										/>
									)
								} />
								<div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
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

											{...register('wholesalePrice')}
											placeholder={t('placeholders.wholesalePrice')}

										/>
									</Field>

									<Field label={t('fields.salePrice')} error={errors?.salePrice?.message}>
										<Input
											type="number"

											{...register('salePrice')}
											onBlur={handleSalePriceBlur}
											placeholder={t('placeholders.salePrice')}

										/>
									</Field>

									<Field label={t('fields.lowestPrice')} error={errors?.lowestPrice?.message}>
										<Input type="number"  {...register('lowestPrice')} placeholder={t('placeholders.lowestPrice')} />
									</Field>

									<Field label={t('fields.storageRack')}>
										<Input {...register('storageRack')} placeholder={t('placeholders.storageRack')} />
									</Field>

									<Field label={t('fields.category')}>
										<Controller
											control={control}
											name="categoryId"
											render={({ field }) => {
												const isOrphan = field.value && field.value !== 'none' && !categories.some(c => String(c.id) === field.value);

												return (
													<Select
														value={field.value || ''}
														onValueChange={(val) => {
															// 2. Block the auto-wipe while allowing intentional 'none'
															if (!val && field.value && field.value !== 'none') return;
															field.onChange(val);
														}}
													>
														<SelectTrigger>
															<SelectValue placeholder={t('placeholders.category')} />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">{t('common.none')}</SelectItem>

															{/* 3. Inject the temporary option to satisfy Radix UI */}
															{isOrphan && (
																<SelectItem value={field.value}>
																	{existingProduct?.category?.name ?? existingProduct?.category?.label ?? `#${field.value}`}
																</SelectItem>
															)}

															{categories.map((c) => (
																<SelectItem key={c.id} value={String(c.id)}>
																	<div className="flex items-center justify-between w-full gap-2">
																		{c.isExternal && (
																			<Badge variant="secondary" >
																				{t('common.remote') || 'Remote'}
																			</Badge>
																		)}
																		<span>{c.label ?? c.name ?? `#${c.id}`}</span>

																	</div>
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												);
											}}
										/>
									</Field>

									<Field label={t('fields.store')}>
										<Controller
											control={control}
											name="storeId"
											render={({ field }) => {
												// 1. Identify if the current value is missing from the async list
												const isOrphan = field.value && field.value !== 'none' && !stores.some(s => String(s.id) === field.value);

												return (
													<Select
														value={field.value || ''}
														onValueChange={(val) => {
															// 2. Guard against UI auto-clears (allow explicit "none" but block empty strings)
															if (!val && field.value && field.value !== 'none') return;
															field.onChange(val);
														}}
													>
														<SelectTrigger >
															<SelectValue placeholder={t('placeholders.store')} />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">{t('common.none')}</SelectItem>

															{/* 3. Render a temporary option so the Select considers the ID valid */}
															{isOrphan && (
																<SelectItem value={field.value}>
																	{existingProduct?.store?.name ?? existingProduct?.store?.label ?? `#${field.value}`}
																</SelectItem>
															)}

															{stores.map((s) => (
																<SelectItem key={s.id} value={String(s.id)}>{s.label ?? s.name ?? `#${s.id}`}</SelectItem>
															))}
														</SelectContent>
													</Select>
												);
											}}
										/>
									</Field>

									<Field label={t('fields.warehouse')}>
										<Controller
											control={control}
											name="warehouseId"
											render={({ field }) => {
												const isOrphan = field.value && field.value !== 'none' && !warehouses.some(w => String(w.id) === field.value);

												return (
													<Select
														value={field.value || ''}
														onValueChange={(val) => {
															if (!val && field.value && field.value !== 'none') return;
															field.onChange(val);
														}}
													>
														<SelectTrigger >
															<SelectValue placeholder={t('placeholders.warehouse')} />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">{t('common.none')}</SelectItem>

															{isOrphan && (
																<SelectItem value={field.value}>
																	{existingProduct?.warehouse?.name ?? existingProduct?.warehouse?.label ?? `#${field.value}`}
																</SelectItem>
															)}

															{warehouses.map((w) => (
																<SelectItem key={w.id} value={String(w.id)}>{w.label ?? w.name ?? `#${w.id}`}</SelectItem>
															))}
														</SelectContent>
													</Select>
												);
											}}
										/>
									</Field>


									<Field label={t('fields.description')} className="col-span-full">
										<Textarea
											{...register('description')}
											placeholder={t('placeholders.description')}
											className="rounded-xl min-h-[150px] bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-[14px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/50 transition-colors"
										/>
									</Field>
								</div>
							</Card>
						</motion.div>

						{/* Attributes Card */}
						{productType === 'variable' && <motion.div variants={fadeUp}>
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
						</motion.div>}

						{/* Combinations Card */}
						{productType === 'variable' && comboFields.length > 0 && (
							<motion.div ref={combinationsSectionRef} variants={fadeUp} className="scroll-mt-24">
								<Card>
									<div className="flex items-center justify-between mb-5">
										<SectionHeader title={t('combinations.title')} />
										<div className="flex items-center gap-4">
											{!isEditMode && (
												<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 dark:bg-primary/30 border border-primary/20 dark:border-primary/70">
													<Controller
														control={control}
														name="hasPurchase"
														render={({ field }) => (
															<Checkbox
																checked={hasPurchase}
																onCheckedChange={(v) => {
																	setHasPurchase(!!v);
																	setValue('hasPurchase', !!v, { shouldValidate: true });
																}}
																id="has-purchase"
																className="rounded-md"
															/>
														)}
													/>
													<label htmlFor="has-purchase" className="text-[12px] font-bold text-primary dark:text-primary-400 cursor-pointer select-none">
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
										<PurchaseDataForm
											t={t}
											tPurchase={tPurchase}
											tValidation={tValidation}
											control={control}
											register={register}
											errors={errors}
											suppliers={suppliers}
											totalPurchaseQuantity={totalPurchaseQuantity}
											onTotalQuantityChange={handleTotalQuantityChange}
											totalPurchaseQuantityError={totalPurchaseQuantityError}
											purchaseReceipt={purchaseReceipt}
											setPurchaseReceipt={setPurchaseReceipt}
											setValue={setValue}
											clearErrors={clearErrors}
											invoiceSummary={purchaseSummary}
										/>
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
														const skuHasConflict = !!skuConflictMap[current.sku];
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
																			"h-[38px] rounded-lg font-[Inter] text-[12px] !min-w-[150px]",
																			canEditSku
																				? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
																				: "bg-slate-100 dark:bg-slate-900 border-transparent text-slate-400 cursor-not-allowed",
																			skuHasConflict || cErr?.sku ? "border-red-400 ring-1 ring-red-300" : ""
																		)}
																	/>
																	{cErr?.sku?.message && <p className="text-[11px] text-red-500 mt-0.5">{errors.combinations[idx].sku.message}</p>}
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
																	<Controller
																		control={control}
																		name={`combinations.${idx}.price`}
																		render={({ field }) => (
																			<Input
																				{...field}
																				type="number"
																				// Allows decimals for pricing
																				placeholder="0.00"
																				onChange={(e) => {
																					// Convert string input to float for the form state
																					const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
																					field.onChange(val);
																				}}
																				className={cn(
																					"h-[38px] rounded-lg font-[Inter] text-[13px]",
																					cErr?.price
																						? "border-red-400 ring-1 ring-red-300"
																						: "border-slate-200 dark:border-slate-700"
																				)}
																			/>
																		)}
																	/>

																	{cErr?.price?.message && (
																		<p className="text-[11px] text-red-500 mt-0.5">
																			{cErr.price.message}
																		</p>
																	)}
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

						{productType === 'single' && (
							<motion.div variants={fadeUp}>
								<Card>
									<SectionHeader
										title={t('singleSku.title')}
									// action={
									// 	!isEditMode && (
									// 		<Controller
									// 			control={control}
									// 			name="combinations.0.isActive"
									// 			render={({ field }) => (
									// 				<div className="flex items-center gap-2 h-[34px] px-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
									// 					<label
									// 						htmlFor="single-sku-active"
									// 						className="text-[13px] font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none"
									// 					>
									// 						{t('combinations.isActive')}
									// 					</label>
									// 					<Checkbox
									// 						id="single-sku-active"
									// 						checked={parseBooleanLike(field.value, true)}
									// 						onCheckedChange={(v) => field.onChange(!!v)}
									// 						className="h-5 w-5 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
									// 					/>
									// 				</div>
									// 			)}
									// 		/>
									// 	)
									// }
									/>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<Field label="SKU">
											<Input
												{...register('combinations.0.sku')}
												placeholder={t('combinations.placeholders.skuSingle')}
												disabled={isEditMode}
											/>
											{errors?.combinations?.[0]?.sku?.message && <p className="text-[11px] text-red-500 mt-0.5">{errors.combinations[0].sku.message}</p>}
										</Field>

										<Field label={t('combinations.onHand')}>
											{!isEditMode && hasPurchase ? (
												<Input
													type="number"
													{...register('combinations.0.stockOnHand')}
													onBlur={handleSkuQuantityBlur}
												/>
											) : (
												<Input value={String(combinationsWatch?.[0]?.stockOnHand || 0)} disabled />
											)}
										</Field>
										<Field label={t('combinations.reserved')}>
											<Input value={String(combinationsWatch?.[0]?.reserved || 0)} disabled />
										</Field>
										<Field label={t('combinations.available')}>
											<Input value={String(Math.max(0, Number(combinationsWatch?.[0]?.stockOnHand || 0) - Number(combinationsWatch?.[0]?.reserved || 0)))} disabled />
										</Field>
										{/* <Field label={t('combinations.price')}>
											<Input value={salePrice || ''} disabled />
										</Field> */}
									</div>
									{!isEditMode && (
										<div className="flex items-center gap-2 px-3 py-2 mt-4 rounded-xl bg-primary/10 dark:bg-primary/30 border border-primary/20 dark:border-primary/70 w-fit">
											<Checkbox
												checked={hasPurchase}
												onCheckedChange={(v) => {
													setHasPurchase(!!v);
													setValue('hasPurchase', !!v, { shouldValidate: true });
												}}
												id="has-purchase-single"
												className="rounded-md"
											/>
											<label htmlFor="has-purchase-single" className="text-[12px] font-bold text-primary dark:text-primary-400 cursor-pointer select-none">
												{t('purchase.hasInvoice')}
											</label>
										</div>
									)}
									{!isEditMode && hasPurchase && (
										<PurchaseDataForm
											t={t}
											singleMode={true}
											tPurchase={tPurchase}
											tValidation={tValidation}
											control={control}
											register={register}
											errors={errors}
											suppliers={suppliers}
											totalPurchaseQuantity={totalPurchaseQuantity}
											onTotalQuantityChange={handleTotalQuantityChange}
											totalPurchaseQuantityError={totalPurchaseQuantityError}
											purchaseReceipt={purchaseReceipt}
											setPurchaseReceipt={setPurchaseReceipt}
											setValue={setValue}
											clearErrors={clearErrors}
											invoiceSummary={purchaseSummary}
										/>
									)}
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
											excludeProductId={isEditMode ? productId : undefined}
										/>
									)}
								</div>
							</Card>
						</motion.div>

						<button type="submit" className="hidden" />
					</div>

					{/* ── Right Column (Media) ── */}
					<div className="xl:sticky xl:top-[20px] h-fit space-y-4 w-full xl:max-w-[360px] shrink-0">
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
function UpsellProductSelector({ t, value, onChange, excludeProductId }) {
	const selectedIds = (value || []).map((x) => String(x.productId));

	const handleIdsChange = (ids) => {
		void (async () => {
			const prev = value || [];
			const prevById = new Map(prev.map((x) => [String(x.productId), x]));
			const next = [];
			let loadFailed = false;
			for (const rawId of ids) {
				const sid = String(rawId);
				if (prevById.has(sid)) {
					next.push(prevById.get(sid));
					continue;
				}
				try {
					const res = await api.get(`/products/${sid}`);
					const p = res.data;
					next.push({
						productId: sid,
						label: p.name || `#${sid}`,
						callCenterDescription: '',
						mainImage: p.mainImage,
					});
				} catch {
					loadFailed = true;
					next.push({ productId: sid, label: `#${sid}`, callCenterDescription: '' });
				}
			}
			if (loadFailed) toast.error(t('upsell.failedToLoad'));
			onChange(next);
		})();
	};

	const removeProduct = (productId) => {
		onChange((value || []).filter((x) => String(x.productId) !== String(productId)));
	};
	const updateDesc = (productId, desc) => {
		onChange((value || []).map((x) => (String(x.productId) === String(productId) ? { ...x, callCenterDescription: desc } : x)));
	};
	const selectedProducts = value || [];
	const getImg = (p) => p?.mainImage || p?.images?.[0]?.url || '';
	const displayName = (x) => x.label || x.name || `#${x.productId}`;

	return (
		<div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
			<ProductFilter
				multiple
				value={selectedIds}
				onChange={handleIdsChange}
				showAllOption={false}
				label={t('upsell.selectProducts')}
				title={t('upsell.searchProducts')}
				excludeIds={excludeProductId ? [String(excludeProductId)] : []}
			/>

			{selectedProducts.length > 0 && (
				<div className="space-y-2">
					<label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('upsell.selectedProducts')}</label>
					{selectedProducts.map((x) => (
						<div key={x.productId} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3">
							<div className="flex items-center justify-between gap-2 mb-3">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0">
										{x.mainImage ? <img src={baseImg + getImg(x)} alt={displayName(x)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">—</div>}
									</div>
									<div>
										<span className="text-[13px] font-semibold text-slate-800 dark:text-white">{displayName(x)}</span>
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
