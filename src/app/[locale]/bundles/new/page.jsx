// File: bundles/new/page.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Plus, Loader2, Trash2, Package, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import api from '@/utils/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button_ from '@/components/atoms/Button';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';
import { ProductSkuSearchPopover } from '@/components/molecules/ProductSkuSearchPopover';

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Unexpected error';
	return Array.isArray(msg) ? msg.join(', ') : String(msg);
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
		name: yup.string().trim().required(t('validation.nameRequired')),
		wholesalePrice: yup
			.string()
			.required(t('bundles.totalPriceRequired'))
			.test('is-num', t('validation.invalidNumber'), (v) => v && Number.isFinite(Number(v))),
		description: yup.string().nullable(),
		bundleItems: yup
			.array()
			.of(
				yup.object({
					variant: yup.mixed().nullable(),
					variantId: yup.number().required(t('validation.productRequired')),
					qty: yup.number().min(1, t('validation.quantityMinOne')).required(t('validation.quantityRequired')),
				})
			)
			.min(1, t('bundles.atLeastOne'))
			.default([]),
	});

function defaultValues() {
	return {
		name: '',
		wholesalePrice: '',
		description: '',
		bundleItems: [],
	};
}

export default function AddBundlePage({ isEditMode = false, existingBundle = null, bundleId = null }) {
	const t = useTranslations('addProduct');
	const navigate = useRouter();

	const schema = React.useMemo(() => makeSchema(t), [t]);

	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: defaultValues(),
		resolver: yupResolver(schema),
		mode: 'onTouched',
	});

	const { fields: bundleFields, append: appendBundleItem, remove: removeBundleItem } = useFieldArray({
		control,
		name: 'bundleItems',
		keyName: 'fieldId',
	});


	useEffect(() => {
		if (!isEditMode || !existingBundle) return;
		reset({
			name: existingBundle.name || '',
			wholesalePrice: existingBundle.price?.toString() || '',
			description: existingBundle.description || '',
			bundleItems:
				existingBundle.items?.map((item) => ({
					variant: item.variant,
					variantId: item.variant.id,
					qty: item.qty,
				})) || [],
		});
	}, [isEditMode, existingBundle, reset]);

	const onSubmit = async (data) => {
		try {
			const bundlePayload = {
				name: data.name.trim(),
				price: data.wholesalePrice,
				sku: `BUNDLE-${slugifyKey(data.name).substring(0, 10).toUpperCase()}-${Date.now()}`,
				items: data.bundleItems.map((item) => ({
					variantId: Number(item.variantId),
					qty: Number(item.qty),
				})),
			};

			const apiCall = isEditMode
				? await api.patch(`/bundles/${bundleId}`, bundlePayload).then(res => {}).catch(err => {if (err?.response?.data?.error == "Not Null Violation") navigate.push('/products');})
				: await api.post('/bundles', bundlePayload).then(res => {navigate.push('/products');}).catch(err => { });


			await toast.promise(apiCall, {
				loading: t('messages.saving'),
				success: isEditMode ? t('messages.updated') : t('messages.created'),
				error: (err) => normalizeAxiosError(err),
			});

			navigate.push('/products');
		} catch (error) {
			toast.error(normalizeAxiosError(error));
		}
	};

	return (
		<motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }} className="min-h-screen p-6">
			<div className="duration-300 !p-4 !sticky top-[80px] z-[10] bg-card mb-6 rounded-2xl shadow-sm">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t('breadcrumb.home')}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<button type="button" onClick={() => navigate.push('/products')} className="text-gray-400 hover:text-primary transition-colors">
							{t('breadcrumb.products')}
						</button>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-primary">{isEditMode ? t('breadcrumb.editBundle') : t('breadcrumb.addBundle')}</span>
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

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Bundle Info */}
				<motion.div className="bg-card rounded-2xl shadow-sm p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
					<h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
						<div className="w-1 h-6 bg-primary rounded-full" />
						{t('sections.bundleInfo')}
					</h3>

					<div className="space-y-5 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
						<div className="space-y-2">
							<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.bundleName')}</Label>
							<Input
								{...register('name')}
								placeholder={t('placeholders.bundleName')}
								className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
							/>
							{errors?.name?.message && <div className="text-xs text-red-600">{errors.name.message}</div>}
						</div>

						<div className="space-y-2">
							<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
								{t('fields.totalPrice')} <span className="text-red-500">*</span>
							</Label>
							<Input
								type="number"
								step="0.01"
								{...register('wholesalePrice')}
								placeholder={t('placeholders.totalPrice')}
								className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
							/>
							{errors?.wholesalePrice?.message && <div className="text-xs text-red-600">{errors.wholesalePrice.message}</div>}
						</div>

						<div className="space-y-2 col-span-full">
							<Label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{t('fields.description')}</Label>
							<Textarea
								{...register('description')}
								placeholder={t('placeholders.bundleDescription')}
								className="rounded-xl min-h-[100px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>
				</motion.div>

				{/* Bundle Items */}
				<motion.div className="bg-card rounded-2xl shadow-sm p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
							<div className="w-1 h-6 bg-primary rounded-full" />
							{t('bundles.title')}
						</h3>
						<Button type="button" onClick={() => appendBundleItem({ variantId: '', variant: null, qty: 1 })} className="rounded-xl text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
							<Plus className="h-4 w-4" />
							{t('bundles.addSku')}
						</Button>
					</div>

					{errors?.bundleItems?.message && <div className="text-sm text-red-600 mb-4">{errors.bundleItems.message}</div>}

					{bundleFields.length === 0 ? (
						<div className="text-center py-12 text-gray-400">
							<Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
							<p className="text-sm">{t('bundles.empty')}</p>
						</div>
					) : (
						<div className="space-y-4">
							{bundleFields.map((field, index) => (
								<div key={field.fieldId} className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
									<div className="flex-1 grid grid-cols-2 gap-4">
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
																selectedSkus={itemValue.variantId ? [{ id: Number(itemValue.variantId) }] : []}
																handleSelectSku={(sku) => {
																	console.log(sku);
																	field.onChange({
																		...itemValue,
																		variantId: Number(sku.id), // ✅ store number
																		variant: sku,              // ✅ store object for UI
																	});
																}}
															/>

															{itemValue.variant ? (
																<div className="text-xs text-muted-foreground">
																	Selected SKU: <span className="font-[Inter]">{itemValue.variant.sku}</span>
																</div>
															) : null}
														</div>
													);
												}}
											/>


											{errors?.bundleItems?.[index]?.variantId && <div className="text-xs text-red-600">{errors.bundleItems[index].variantId.message}</div>}
										</div>

										<div className="space-y-2">
											<Label>{t('bundles.quantity')}</Label>
											<Input
												type="number"
												{...register(`bundleItems.${index}.qty`)}
												min="1"
												placeholder={t('bundles.quantityPlaceholder')}
												className="rounded-xl h-[50px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
											/>
											{errors?.bundleItems?.[index]?.qty && <div className="text-xs text-red-600">{errors.bundleItems[index].qty.message}</div>}
										</div>
									</div>

									<Button type="button" variant="ghost" onClick={() => removeBundleItem(index)} className="rounded-md border-1 border-red-500 cursor-pointer text-red-600 hover:text-white hover:bg-red-500 transition-all mt-7">
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</motion.div>
			</form>
		</motion.div>
	);
}