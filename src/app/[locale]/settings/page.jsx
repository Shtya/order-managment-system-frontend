'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
	Settings,
	Layers,
	User,
	Bell,
	Shield,
	Palette,
	Plus,
	Edit2,
	Trash2,
	Save,
	X,
	ChevronRight,
	CheckCircle2,
	XCircle,
	Upload,
	Loader2,
	Camera,
	Globe,
	Monitor,
	Moon,
	Sun,
	Laptop,
	Smartphone,
	MapPin,
	Clock,
} from 'lucide-react';

import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

// shadcn select
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Lock, MoreVertical, Eye, Copy, Archive } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import { getUser } from '../../../hook/getUser';
import SlugInput from '@/components/atoms/SlugInput';



function normalizeAxiosError(err) {
	const msg =
		err?.response?.data?.message ??
		err?.response?.data?.error ??
		err?.message ??
		'Unexpected error';
	return Array.isArray(msg) ? msg.join(', ') : String(msg);
}

function makeId() {
	return crypto.randomUUID();
}

/** =========================
 * Phone helpers (from your old code style)
 * ========================= */
export const COUNTRIES = [
	{
		key: 'SA',
		nameAr: 'السعودية',
		dialCode: '+966',
		phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
		placeholder: '5xxxxxxxx (مثال: 5XXXXXXXX)',
	},
	{
		key: 'EG',
		nameAr: 'مصر',
		dialCode: '+20',
		phone: { min: 10, max: 10, regex: /^(10|11|12|15)\d{8}$/ },
		placeholder: '10xxxxxxxx (مثال: 1101727657)',
	},
	{
		key: 'AE',
		nameAr: 'الإمارات',
		dialCode: '+971',
		phone: { min: 9, max: 9, regex: /^5\d{8}$/ },
		placeholder: '5xxxxxxxx (مثال: 5XXXXXXXX)',
	},
	{
		key: 'KW',
		nameAr: 'الكويت',
		dialCode: '+965',
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholder: 'xxxxxxxx (8 أرقام)',
	},
	{
		key: 'QA',
		nameAr: 'قطر',
		dialCode: '+974',
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholder: 'xxxxxxxx (8 أرقام)',
	},
	{
		key: 'BH',
		nameAr: 'البحرين',
		dialCode: '+973',
		phone: { min: 8, max: 8, regex: /^\d{8}$/ },
		placeholder: 'xxxxxxxx (8 أرقام)',
	},
	{
		key: 'JO',
		nameAr: 'الأردن',
		dialCode: '+962',
		phone: { min: 9, max: 9, regex: /^7\d{8}$/ },
		placeholder: '7xxxxxxxx (9 أرقام)',
	},
];

function digitsOnly(v) {
	return (v || '').replace(/\D/g, '');
}

function validatePhone(rawDigits, country) {
	const value = digitsOnly(rawDigits);
	if (!value) return 'يرجى إدخال رقم جوال صحيح';

	if (value.length < country.phone.min || value.length > country.phone.max) {
		if (country.phone.min === country.phone.max) {
			return `رقم الجوال يجب أن يكون ${country.phone.min} رقمًا`;
		}
		return `رقم الجوال يجب أن يكون بين ${country.phone.min} و ${country.phone.max} رقمًا`;
	}

	if (value.length === country.phone.max && country.phone.regex && !country.phone.regex.test(value)) {
		return 'يرجى إدخال رقم جوال صحيح حسب الدولة المختارة';
	}

	return '';
}

function parsePhoneToCountry(phone) {
	// expects: "+20XXXXXXXXXX" or "20XXXXXXXXXX" or just digits
	const raw = String(phone || '').trim();
	if (!raw) return { countryKey: 'EG', localDigits: '' };

	// try match dialCode
	const normalized = raw.startsWith('+') ? raw : `+${raw}`;
	const matched = COUNTRIES.find((c) => normalized.startsWith(c.dialCode));
	if (matched) {
		return {
			countryKey: matched.key,
			localDigits: digitsOnly(normalized.slice(matched.dialCode.length)),
		};
	}

	// fallback
	return { countryKey: 'EG', localDigits: digitsOnly(raw) };
}

/* =========================
 * Validation Schemas
 * ========================= */
const categorySchema = yup.object({
	name: yup.string().trim().required('Name is required'),
	slug: yup.string().trim().required('Slug is required'),
});

const accountSchema = yup.object({
	name: yup.string().trim().required('Name is required'),
	email: yup.string().trim().email('Invalid email').required('Email is required'),
	employeeType: yup.string().trim().nullable(),
	// phone handled manually with your country rules
});

export default function SettingsPage() {
	const t = useTranslations('settings');
	const [activeTab, setActiveTab] = useState('categories');

	const TABS = [
		{ id: 'categories', label: t('tabs.categories.label'), icon: Layers, description: t('tabs.categories.description') },
		{ id: 'account', label: t('tabs.account.label'), icon: User, description: t('tabs.account.description') },
		{ id: 'notifications', label: t('tabs.notifications.label'), icon: Bell, description: t('tabs.notifications.description') },
		{ id: 'security', label: t('tabs.security.label'), icon: Shield, description: t('tabs.security.description') },
		{ id: 'appearance', label: t('tabs.appearance.label'), icon: Palette, description: t('tabs.appearance.description') },
	];

	const ActiveTabComponent = () => {
		switch (activeTab) {
			case 'categories':
				return <CategoriesTab />;
			case 'account':
				return <AccountTab />;
			case 'notifications':
				return <NotificationsTab />;
			case 'security':
				return <SecurityTab />;
			case 'appearance':
				return <AppearanceTab />;
			default:
				return <CategoriesTab />;
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6"
		>
			{/* Header */}
			<div className="mb-8">
				<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-2">
					<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
						<Settings className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('header.title')}</h1>
						<p className="text-slate-500 dark:text-slate-400">{t('header.subtitle')}</p>
					</div>
				</motion.div>
			</div>

			<div className="flex gap-6">
				{/* Sidebar */}
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className=" sticky top-[90px] h-fit w-80 space-y-2">
					<Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl">
						<div className="space-y-1">
							{TABS.map((tab, idx) => (
								<motion.button
									key={tab.id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: idx * 0.05 }}
									onClick={() => setActiveTab(tab.id)}
									className={cn(
										'w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group',
										activeTab === tab.id
											? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30'
											: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
									)}
								>
									<div
										className={cn(
											'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
											activeTab === tab.id
												? 'bg-white/20'
												: 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
										)}
									>
										<tab.icon className="w-5 h-5" />
									</div>
									<div className="flex-1 rtl:text-right ltr:text-left">
										<div className="font-semibold">{tab.label}</div>
										<div className={cn('text-xs', activeTab === tab.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400')}>
											{tab.description}
										</div>
									</div>
									{activeTab === tab.id && <ChevronRight className=" rtl:scale-x-[-1] w-5 h-5" />}
								</motion.button>
							))}
						</div>
					</Card>

				</motion.div>

				{/* Main Content */}
				<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
					<Card className="p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl min-h-[600px]">
						<AnimatePresence mode="wait">
							<motion.div
								key={activeTab}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.2 }}
							>
								<ActiveTabComponent />
							</motion.div>
						</AnimatePresence>
					</Card>
				</motion.div>
			</div>
		</motion.div>
	);
}



/* =========================
 * CATEGORIES TAB (no search + global lock)
 * ========================= */

function CategoriesTab() {
	const t = useTranslations('settings.categories');

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState(null);

	const [categories, setCategories] = useState([]);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		setValue,
		watch
	} = useForm({
		resolver: yupResolver(categorySchema),
		defaultValues: { name: '', slug: '' },
		mode: 'onTouched',
	});

	const slug = watch('slug')
	const name = watch('name')

	// ============= DATA LOADING =============
	async function loadCategories() {
		setLoading(true);
		try {
			const res = await api.get('/categories', { params: { limit: 200 } });
			const list = Array.isArray(res.data?.records)
				? res.data.records
				: Array.isArray(res.data)
					? res.data
					: [];
			setCategories(list);
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadCategories();
	}, []);

	// ============= FORM HANDLERS =============
	function openAdd() {
		setEditing(null);
		reset({ name: '' });
		setShowForm(true);
	}

	function openEdit(cat) {
		const isGlobal = cat?.adminId == null;
		if (isGlobal) {
			toast.error(t('global.lockedToast'));
			return;
		}

		setEditing(cat);
		reset({
			name: cat.name ?? '',
			slug: cat.slug ?? '',
			isActive: !!cat.isActive,
		});
		setValue('imageFile', null);
		setShowForm(true);
	}
	const user = getUser()

	async function onSubmit(values) {
		setSaving(true);
		try {

			if (editing?.id) {
				await toast.promise(
					api.patch(`/categories/${editing.id}`, {
						name: `${values.name}`,
						slug: `${values.slug}`
					}),
					{
						loading: t('toast.updating'),
						success: t('toast.updated'),
						error: (err) => normalizeAxiosError(err),
					}
				);
			} else {
				await toast.promise(
					api.post('/categories', {
						name: `${values.name}`,
						slug: `${values.slug}`,
						adminId: user?.id
					}),
					{
						loading: t('toast.creating'),
						success: t('toast.created'),
						error: (err) => normalizeAxiosError(err),
					}
				);
			}

			setShowForm(false);
			setEditing(null);
			reset({ name: '' });
			await loadCategories();
		} finally {
			setSaving(false);
		}
	}


	async function handleDelete(cat) {
		const isGlobal = cat?.adminId == null;
		if (isGlobal) {
			toast.error(t('global.lockedToast'));
			return;
		}

		try {
			await api.delete(`/categories/${cat.id}`);
			await loadCategories();
			toast.success(t('toast.deleted'));
		} catch (err) {
			toast.error(normalizeAxiosError(err));
		}
	}

	async function handleDuplicate(cat) {
		try {
			await toast.promise(
				api.post('/categories', {
					name: `${cat.name} (Copy)`
				}),
				{
					loading: t('toast.duplicating') || 'Duplicating...',
					success: t('toast.duplicated') || 'Category duplicated successfully!',
					error: (err) => normalizeAxiosError(err),
				}
			);

			await loadCategories();
		} catch { }
	}


	const [slugStatus, setSlugStatus] = useState(null); // 'checking', 'unique', 'taken'
	useEffect(() => {
		if (!slug || errors.slug) {
			setSlugStatus(null);
			return;
		}

		const checkUnique = setTimeout(async () => {
			setSlugStatus('checking');
			try {
				const params = new URLSearchParams({ slug: slug.trim() }); // [2025-12-24] Remember to trim.

				if (editing?.id) {
					params.append('category', editing.id.toString());
				}

				const res = await api.get(`/categories/check-slug?${params.toString()}`);

				setSlugStatus(res.data.isUnique ? 'unique' : 'taken');
			} catch (e) {
				setSlugStatus(null);
			}
		}, 280); // Debounce للتحقق من التوفر

		return () => clearTimeout(checkUnique);
	}, [slug, errors.slug, editing?.id]);

	// ============= RENDER =============
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
					<p className="text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
				</div>

				<Button
					onClick={() => (showForm ? setShowForm(false) : openAdd())}
					className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30"
				>
					<Plus className="w-4 h-4 mr-2" />
					{t('addButton')}
				</Button>
			</div>

			{/* Add/Edit Form */}
			<AnimatePresence>
				{showForm && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
							<h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">
								{editing ? t('editForm.title') : t('addForm.title')}
							</h3>

							<form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>{t('form.name')}</Label>
									<Input {...register('name')} placeholder={t('form.namePlaceholder')} className="h-11" />
									{errors?.name?.message && (
										<div className="text-xs text-red-600">{errors.name.message}</div>
									)}
								</div>

								<SlugInput errors={errors} register={register} name={name} slugStatus={slugStatus} slug={slug} setValue={setValue}
									className="h-11"
								/>

								<div className="flex gap-3 mt-2 col-span-2">
									<Button className="bg-primary" type="submit" disabled={saving}>
										{saving ? (
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										) : (
											<Save className="w-4 h-4 mr-2" />
										)}
										{t('form.save')}
									</Button>

									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setShowForm(false);
											setEditing(null);
										}}
									>
										<X className="w-4 h-4 mr-2" />
										{t('form.cancel')}
									</Button>
								</div>
							</form>
						</Card>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Categories List */}
			{loading ? (
				<div className="flex items-center gap-2 text-slate-500">
					<Loader2 className="w-5 h-5 animate-spin" />
					{t('loading')}
				</div>
			) : (
				<div className="space-y-3">
					{categories.map((category, idx) => {
						const isGlobal = category?.adminId == null;

						return (
							<motion.div
								key={category.id ?? makeId()}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.03 }}
							>
								<Card className="p-4 hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
									<div className="flex items-center gap-4">
										{/* Category Icon/Image */}
										<div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
											{category.image ? (
												<img
													src={category.image}
													alt={category.name}
													className="w-full h-full object-cover"
												/>
											) : (
												<Layers className="w-8 h-8 text-primary" />
											)}
										</div>

										{/* Category Info */}
										<div className="flex-1">
											<div className="flex items-center gap-2 flex-wrap">
												<h4 className="font-semibold text-slate-900 dark:text-white">
													{category.name}
												</h4>
												{isGlobal && (
													<Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200">
														{t('global.badge')}
													</Badge>
												)}
											</div>

											<div className="flex items-center gap-3 mt-1">
												<span className="text-sm text-slate-500 dark:text-slate-400">
													/{category.slug}
												</span>
											</div>
										</div>

										{/* ✨ ENHANCED ACTION BUTTONS ✨ */}
										<CategoryActionButtons
											category={category}
											isGlobal={isGlobal}
											isLoading={loading}
											onEdit={openEdit}
											onDelete={handleDelete}
											onDuplicate={handleDuplicate}
											t={t}
										/>
									</div>
								</Card>
							</motion.div>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ==================== ACTION BUTTONS COMPONENT ====================
function CategoryActionButtons({
	category,
	isGlobal,
	isLoading,
	onEdit,
	onDelete,
	onDuplicate,
	t,
}) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [actionLoading, setActionLoading] = useState(null);



	const handleEdit = () => {
		if (isGlobal || isLoading) return;
		onEdit?.(category);
	};

	const handleDelete = async () => {
		setActionLoading('delete');
		await onDelete?.(category);
		setActionLoading(null);
		setShowDeleteDialog(false);
	};

	const handleDuplicate = async () => {
		setActionLoading('duplicate');
		await onDuplicate?.(category);
		setActionLoading(null);
	};


	return (
		<TooltipProvider delayDuration={300}>
			<div className="flex items-center gap-2">
				{/* Status Toggle with Enhanced Visual Feedback */}
				<Tooltip>

					<TooltipContent side="top" className="bg-slate-900 text-white">
						<p>{isGlobal ? t('global.lockedHint') : t('list.toggleStatus')}</p>
					</TooltipContent>
				</Tooltip>

				{/* Edit Button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.div
							whileHover={!isGlobal && !isLoading ? { scale: 1.1 } : {}}
							whileTap={!isGlobal && !isLoading ? { scale: 0.9 } : {}}
						>
							<Button
								variant="ghost"
								size="icon"
								className={cn(
									'relative hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all duration-200',
									isGlobal && 'opacity-40 cursor-not-allowed'
								)}
								onClick={handleEdit}
								disabled={isGlobal || isLoading}
							>
								<Edit2 className="w-4 h-4" />
								{isGlobal && (
									<Lock className="absolute -top-1 -right-1 w-3 h-3 text-amber-500 bg-white dark:bg-slate-800 rounded-full p-0.5" />
								)}
							</Button>
						</motion.div>
					</TooltipTrigger>
					<TooltipContent side="top" className="bg-slate-900 text-white">
						<p>{isGlobal ? t('global.lockedHint') : t('list.edit')}</p>
					</TooltipContent>
				</Tooltip>

				{/* Delete Button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.div
							whileHover={!isGlobal && !isLoading ? { scale: 1.1 } : {}}
							whileTap={!isGlobal && !isLoading ? { scale: 0.9 } : {}}
						>
							<Button
								variant="ghost"
								size="icon"
								className={cn(
									'relative hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200',
									isGlobal && 'opacity-40 cursor-not-allowed'
								)}
								onClick={() => !isGlobal && !isLoading && setShowDeleteDialog(true)}
								disabled={isGlobal || isLoading}
							>
								{actionLoading === 'delete' ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Trash2 className="w-4 h-4" />
								)}
								{isGlobal && (
									<Lock className="absolute -top-1 -right-1 w-3 h-3 text-amber-500 bg-white dark:bg-slate-800 rounded-full p-0.5" />
								)}
							</Button>
						</motion.div>
					</TooltipTrigger>
					<TooltipContent side="top" className="bg-slate-900 text-white">
						<p>{isGlobal ? t('global.lockedHint') : t('list.delete')}</p>
					</TooltipContent>
				</Tooltip>

				{/* Dublicated */}
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						'relative hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200'
					)}
					onClick={() => !isLoading && handleDuplicate()}
					disabled={isLoading}
				>
					{actionLoading === 'duplicate' ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
						</>
					) : (
						<>
							<Copy className="w-4 h-4  " />
						</>
					)}
				</Button>


				{/* Delete Confirmation Dialog */}
				<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
							<AlertDialogDescription>
								{t('dialogs.delete.description', { name: category.name })}
								<br />
								<span className="font-semibold text-red-600 dark:text-red-400">
									{t('dialogs.delete.warning')}
								</span>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={actionLoading === 'delete'}>
								{t('common.cancel')}
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDelete}
								disabled={actionLoading === 'delete'}
								className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
							>
								{actionLoading === 'delete' ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										{t('common.deleting')}
									</>
								) : (
									<>
										<Trash2 className="w-4 h-4 mr-2" />
										{t('common.delete')}
									</>
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</TooltipProvider>
	);
}

/* =========================
* ACCOUNT TAB (fix camera + phone style + remove active)
* ========================= */
function AccountTab() {
	const t = useTranslations('settings.account');

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [avatarUploading, setAvatarUploading] = useState(false);

	const [me, setMe] = useState(null);
	const [avatarPreview, setAvatarPreview] = useState(null);

	// phone state (old style)
	const [countryKey, setCountryKey] = useState('EG');
	const [phoneDigits, setPhoneDigits] = useState('');
	const [phoneError, setPhoneError] = useState('');

	const fileInputRef = useRef(null);

	const selectedCountry = useMemo(() => COUNTRIES.find((c) => c.key === countryKey) || COUNTRIES[0], [countryKey]);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(accountSchema),
		defaultValues: { name: '', email: '', employeeType: '' },
		mode: 'onTouched',
	});

	async function fetchMe() {
		setLoading(true);
		try {
			let res;
			try {
				res = await api.get('/users/me');
			} catch {
				const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
				if (!userId) throw new Error(t('errors.missingMeEndpoint'));
				res = await api.get(`/users/${userId}`);
			}

			const user = res.data?.user ?? res.data;
			setMe(user);

			reset({
				name: user?.name ?? '',
				email: user?.email ?? '',
				employeeType: user?.employeeType ?? '',
			});

			// phone parse
			const parsed = parsePhoneToCountry(user?.phone);
			setCountryKey(parsed.countryKey);
			setPhoneDigits(parsed.localDigits);
			setPhoneError(parsed.localDigits ? validatePhone(parsed.localDigits, COUNTRIES.find((c) => c.key === parsed.countryKey) || COUNTRIES[0]) : '');

			setAvatarPreview(null);
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchMe();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function buildFullPhone() {
		const dial = selectedCountry?.dialCode || '+20';
		const local = digitsOnly(phoneDigits);
		if (!local) return null;
		return `${dial}${local}`;
	}

	async function onSave(values) {
		if (!me?.id) return;

		const phoneMsg = phoneDigits ? validatePhone(phoneDigits, selectedCountry) : '';
		setPhoneError(phoneMsg);
		if (phoneMsg) {
			toast.error(t('phone.invalid'));
			return;
		}

		setSaving(true);
		try {
			const patch = {
				name: values.name.trim(),
				email: values.email.trim(),
				employeeType: (values.employeeType ?? '').trim() || null,
				phone: buildFullPhone(), // ✅ saved as +country + digits, or null
			};

			await toast.promise(
				(async () => {
					try {
						await api.patch('/users/me', patch);
					} catch {
						await api.patch(`/users/${me.id}`, patch);
					}
				})(),
				{
					loading: t('toast.saving'),
					success: t('toast.saved'),
					error: (err) => normalizeAxiosError(err),
				}
			);

			await fetchMe();
		} finally {
			setSaving(false);
		}
	}

	async function uploadAvatar(file) {
		if (!file || !me?.id) return;

		setAvatarUploading(true);
		try {
			const fd = new FormData();
			fd.append('avatar', file);

			await toast.promise(
				(async () => {
					try {
						await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
					} catch {
						throw new Error(t('errors.missingAvatarEndpoint'));
					}
				})(),
				{
					loading: t('toast.uploadingAvatar'),
					success: t('toast.avatarUpdated'),
					error: (err) => normalizeAxiosError(err),
				}
			);

			await fetchMe();
		} finally {
			setAvatarUploading(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center gap-2 text-slate-500">
				<Loader2 className="w-5 h-5 animate-spin" />
				{t('loading')}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
			</div>

			<Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
				<div className="flex items-center gap-6 mb-6">
					<div className="relative">
						<Avatar className="w-24 h-24 border-4 border-primary/20">
							<AvatarImage src={avatarPreview || me?.avatarUrl || ''} />
							<AvatarFallback>{(me?.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>

						{/* ✅ FIX camera upload: use ref + click */}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={async (e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								try {
									await uploadAvatar(file);
								} finally {
									e.target.value = '';
								}
							}}
						/>

						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg disabled:opacity-60"
							disabled={avatarUploading}
							title={t('profile.changePhoto')}
						>
							{avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
						</button>
					</div>

					<div className="flex-1">
						<h3 className="text-xl font-bold text-slate-900 dark:text-white">{me?.name}</h3>
						<p className="text-slate-500 dark:text-slate-400">{me?.email}</p>

						<div className="flex items-center gap-2 mt-2 flex-wrap">
							{me?.role?.name && <Badge variant="secondary">{t('profile.role')}: {me.role.name}</Badge>}
							{me?.plan?.name && <Badge variant="secondary">{t('profile.plan')}: {me.plan.name}</Badge>}
							{/* ✅ removed active badge */}
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit(onSave)} className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>{t('profile.fullName')}</Label>
						<Input {...register('name')} className="h-11" />
						{errors?.name?.message && <div className="text-xs text-red-600">{errors.name.message}</div>}
					</div>

					<div className="space-y-2">
						<Label>{t('profile.email')}</Label>
						<Input {...register('email')} className="h-11" />
						{errors?.email?.message && <div className="text-xs text-red-600">{errors.email.message}</div>}
					</div>

					{/* ✅ Phone: country + digits (old style) */}
					<div className="space-y-2">
						<Label>{t('phone.label')}</Label>
						<div className="flex gap-2">
							<div className="w-44">
								<Select
									value={countryKey}
									onValueChange={(v) => {
										setCountryKey(v);
										const nextCountry = COUNTRIES.find((c) => c.key === v) || COUNTRIES[0];
										const msg = phoneDigits ? validatePhone(phoneDigits, nextCountry) : '';
										setPhoneError(msg);
									}}
								>
									<SelectTrigger className="!w-full !h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-[rgb(var(--primary))]">
										<SelectValue placeholder={t('phone.countryPlaceholder')} />
									</SelectTrigger>
									<SelectContent className="max-h-72">
										{COUNTRIES.map((c) => (
											<SelectItem key={c.key} value={c.key}>
												{c.dialCode} — {c.nameAr}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Input
								dir="ltr"
								value={phoneDigits}
								onChange={(e) => {
									const v = digitsOnly(e.target.value);
									setPhoneDigits(v);
									const msg = v ? validatePhone(v, selectedCountry) : '';
									setPhoneError(msg);
								}}
								placeholder={selectedCountry.placeholder}
								className={cn(
									'flex-1 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-en',
									phoneError ? 'border-red-300 focus-visible:ring-red-300' : ''
								)}
								inputMode="numeric"
							/>
						</div>

						{phoneError && (
							<div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-right">
								{phoneError}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label>{t('profile.employeeType')}</Label>
						<Input {...register('employeeType')} className="h-11" placeholder={t('profile.employeeTypePlaceholder')} />
					</div>

					{/* ✅ removed isActive switch */}

					<div className="col-span-2">
						<Button className="bg-primary" type="submit" disabled={saving}>
							{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
							{t('profile.saveChanges')}
						</Button>
					</div>
				</form>

				<Separator className="my-6" />

				<div className="grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
					<div>
						<div className="font-semibold">{t('profile.userId')}</div>
						<div>{me?.id ?? '—'}</div>
					</div>
					<div>
						<div className="font-semibold">{t('profile.adminId')}</div>
						<div>{me?.adminId ?? '—'}</div>
					</div>
				</div>
			</Card>
		</div>
	);
}

/* =========================
 * NOTIFICATIONS TAB (unchanged)
 * ========================= */
function NotificationsTab() {
	const t = useTranslations('settings.notifications');

	const notifications = [
		{ id: 1, key: 'orderUpdates' },
		{ id: 2, key: 'newProducts' },
		{ id: 3, key: 'lowStock' },
		{ id: 4, key: 'marketing' },
	];

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
			</div>

			<div className="space-y-4">
				{notifications.map((notif) => (
					<Card key={notif.id} className="p-6">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<h4 className="font-semibold text-slate-900 dark:text-white">{t(`items.${notif.key}.title`)}</h4>
								<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t(`items.${notif.key}.description`)}</p>
							</div>
							<Switch defaultChecked={notif.id <= 2} />
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}

/* =========================
 * SECURITY TAB (sessions only)
 * ========================= */
function SecurityTab() {
	const t = useTranslations('settings.security');

	const [loading, setLoading] = useState(true);
	const [sessions, setSessions] = useState([]);

	function prettyTime(iso) {
		if (!iso) return '—';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '—';
		return d.toLocaleString();
	}

	function sessionIcon(agent = '') {
		const a = String(agent).toLowerCase();
		if (a.includes('android') || a.includes('iphone') || a.includes('mobile')) return Smartphone;
		if (a.includes('mac') || a.includes('windows') || a.includes('linux')) return Laptop;
		return Monitor;
	}

	async function loadSessions() {
		setLoading(true);
		try {
			// ✅ endpoint recommendation: GET /auth/sessions
			// return shape example:
			// [{ id, isCurrent, ip, city, country, userAgent, createdAt, lastSeenAt }]
			const res = await api.get('/auth/sessions');
			const list = Array.isArray(res.data?.records) ? res.data.records : Array.isArray(res.data) ? res.data : [];
			setSessions(list);
		} catch (e) {
			// if endpoint not ready, show empty state (no extra options)
			setSessions([]);
			toast.error(normalizeAxiosError(e));
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadSessions();
	}, []);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
			</div>

			<Card className="p-6">
				<div className="flex items-center justify-between gap-3 mb-4">
					<div>
						<h3 className="font-semibold text-lg text-slate-900 dark:text-white">{t('sessions.title')}</h3>
						<p className="text-sm text-slate-500 dark:text-slate-400">{t('sessions.subtitle')}</p>
					</div>
					<Button variant="outline" onClick={loadSessions} className="rounded-xl">
						{t('sessions.refresh')}
					</Button>
				</div>

				{loading ? (
					<div className="flex items-center gap-2 text-slate-500">
						<Loader2 className="w-5 h-5 animate-spin" />
						{t('sessions.loading')}
					</div>
				) : sessions.length === 0 ? (
					<div className="text-sm text-slate-500 dark:text-slate-400">{t('sessions.empty')}</div>
				) : (
					<div className="space-y-3">
						{sessions.map((s) => {
							const Icon = sessionIcon(s?.userAgent);
							const location = [s?.city, s?.country].filter(Boolean).join(', ');
							return (
								<div
									key={s?.id ?? makeId()}
									className={cn(
										'p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',
										s?.isCurrent && 'border-primary/40 bg-primary/5 dark:bg-primary/10'
									)}
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-start gap-3">
											<div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s?.isCurrent ? 'bg-primary/15' : 'bg-white dark:bg-slate-900')}>
												<Icon className={cn('w-5 h-5', s?.isCurrent ? 'text-primary' : 'text-slate-600 dark:text-slate-300')} />
											</div>

											<div className="space-y-1">
												<div className="flex items-center gap-2 flex-wrap">
													<div className="font-semibold text-slate-900 dark:text-white">
														{s?.deviceName || t('sessions.deviceUnknown')}
													</div>
													{s?.isCurrent ? (
														<Badge className="rounded-full bg-primary text-white">{t('sessions.current')}</Badge>
													) : (
														<Badge variant="secondary" className="rounded-full">{t('sessions.other')}</Badge>
													)}
												</div>

												<div className="text-xs text-slate-500 dark:text-slate-400 break-all">
													{s?.userAgent || '—'}
												</div>

												<div className="flex items-center gap-4 flex-wrap text-sm text-slate-600 dark:text-slate-300 mt-2">
													<div className="inline-flex items-center gap-2">
														<MapPin className="w-4 h-4 text-slate-400" />
														<span>{location || t('sessions.locationUnknown')}</span>
													</div>

													<div className="inline-flex items-center gap-2">
														<Clock className="w-4 h-4 text-slate-400" />
														<span>
															{t('sessions.lastSeen')}: {prettyTime(s?.lastSeenAt || s?.updatedAt)}
														</span>
													</div>

													<div className="inline-flex items-center gap-2">
														<span className="text-slate-400">{t('sessions.ip')}:</span>
														<span className="font-en" dir="ltr">{s?.ip || '—'}</span>
													</div>
												</div>
											</div>
										</div>

										{/* requested: show only sessions, no revoke/delete/2fa options */}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Card>
		</div>
	);
}

/* =========================
 * APPEARANCE TAB (6 palettes + language + mode + sidebar options)
 * ========================= */
function AppearanceTab() {
	const t = useTranslations('settings.appearance');

	// local preferences (you can wire them later)
	const [mode, setMode] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ui_mode') || 'system' : 'system')); // light|dark|system
	const [lang, setLang] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ui_lang') || 'ar' : 'ar')); // ar|en
	const [sidebarExpanded, setSidebarExpanded] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ui_sidebar') !== 'collapsed' : true));
	const [compact, setCompact] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ui_compact') === '1' : false));

	const palettes = [
		{ id: 'royal', name: t('palettes.royal'), colors: ['#6B7CFF', '#8A96FF', '#E7ECFC', '#0B1220'] },
		{ id: 'emerald', name: t('palettes.emerald'), colors: ['#10B981', '#34D399', '#ECFDF5', '#052E16'] },
		{ id: 'sunset', name: t('palettes.sunset'), colors: ['#F97316', '#FDBA74', '#FFF7ED', '#2A0E00'] },
		{ id: 'rose', name: t('palettes.rose'), colors: ['#F43F5E', '#FDA4AF', '#FFF1F2', '#2A0808'] },
		{ id: 'cyan', name: t('palettes.cyan'), colors: ['#06B6D4', '#67E8F9', '#ECFEFF', '#042F2E'] },
		{ id: 'mono', name: t('palettes.mono'), colors: ['#111827', '#6B7280', '#E5E7EB', '#F9FAFB'] },
	];

	const [paletteId, setPaletteId] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ui_palette') || 'royal' : 'royal'));

	useEffect(() => {
		if (typeof window === 'undefined') return;
		localStorage.setItem('ui_mode', mode);
	}, [mode]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		localStorage.setItem('ui_lang', lang);
	}, [lang]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		localStorage.setItem('ui_sidebar', sidebarExpanded ? 'expanded' : 'collapsed');
	}, [sidebarExpanded]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		localStorage.setItem('ui_compact', compact ? '1' : '0');
	}, [compact]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		localStorage.setItem('ui_palette', paletteId);
	}, [paletteId]);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
			</div>

			{/* Theme mode */}
			<Card className="p-6">
				<h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">{t('mode.title')}</h3>

				<div className="grid grid-cols-3 gap-4">
					{[
						{ id: 'light', label: t('mode.light'), icon: Sun },
						{ id: 'dark', label: t('mode.dark'), icon: Moon },
						{ id: 'system', label: t('mode.system'), icon: Monitor },
					].map((opt) => (
						<button
							key={opt.id}
							onClick={() => setMode(opt.id)}
							className={cn(
								'p-4 rounded-2xl border-2 transition-all text-left',
								mode === opt.id ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700'
							)}
						>
							<div className="flex items-center gap-2 mb-3">
								<div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', mode === opt.id ? 'bg-primary/15' : 'bg-slate-100 dark:bg-slate-800')}>
									<opt.icon className={cn('w-5 h-5', mode === opt.id ? 'text-primary' : 'text-slate-600 dark:text-slate-300')} />
								</div>
								<div className="font-semibold text-slate-900 dark:text-white">{opt.label}</div>
							</div>
							<div className="h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
						</button>
					))}
				</div>
			</Card>

			{/* Palettes */}
			<Card className="p-6">
				<h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">{t('palette.title')}</h3>

				<div className="grid grid-cols-3 gap-4">
					{palettes.map((p) => (
						<button
							key={p.id}
							onClick={() => setPaletteId(p.id)}
							className={cn(
								'p-4 rounded-2xl border-2 transition-all text-left',
								paletteId === p.id ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700'
							)}
						>
							<div className="font-semibold text-slate-900 dark:text-white mb-3">{p.name}</div>
							<div className="flex items-center gap-2">
								{p.colors.map((c) => (
									<span key={c} className="w-7 h-7 rounded-xl border border-slate-200 dark:border-slate-700" style={{ backgroundColor: c }} />
								))}
							</div>
						</button>
					))}
				</div>

				<div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
					{t('palette.note')}
				</div>
			</Card>

			{/* Language */}
			<Card className="p-6">
				<h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">{t('language.title')}</h3>
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
						<Globe className="w-5 h-5 text-slate-600 dark:text-slate-300" />
					</div>

					<div className="flex-1">
						<Label className="text-sm">{t('language.label')}</Label>
						<div className="mt-2">
							<Select value={lang} onValueChange={setLang}>
								<SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ar">{t('language.ar')}</SelectItem>
									<SelectItem value="en">{t('language.en')}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

			</Card>

			{/* Layout options */}
			<Card className="p-6">
				<h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">{t('layout.title')}</h3>

				<div className="space-y-3">
					<div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
						<div>
							<div className="font-semibold text-slate-900 dark:text-white">{t('layout.sidebar')}</div>
							<div className="text-sm text-slate-500 dark:text-slate-400">{t('layout.sidebarDesc')}</div>
						</div>
						<Switch checked={sidebarExpanded} onCheckedChange={setSidebarExpanded} />
					</div>

					<div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
						<div>
							<div className="font-semibold text-slate-900 dark:text-white">{t('layout.compact')}</div>
							<div className="text-sm text-slate-500 dark:text-slate-400">{t('layout.compactDesc')}</div>
						</div>
						<Switch checked={compact} onCheckedChange={setCompact} />
					</div>
				</div>
			</Card>
		</div>
	);
}
