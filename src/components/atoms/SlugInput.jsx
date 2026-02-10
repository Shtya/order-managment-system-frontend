'use client'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAutoTranslate } from '@/utils/autoTranslate';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function SlugInput({ register, name, slug, errors, slugStatus, setValue, className, labelClassName }) {
    const t = useTranslations('addProduct');
    const { translate } = useAutoTranslate();

    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        // 1. تأكد من عمل Trim للاسم ومنع الترجمة إذا كان قصيراً جداً
        const nameToTranslate = name?.trim();
        if (!nameToTranslate || nameToTranslate.length < 3) {
            setValue("slug", "");
            return;
        }

        // 2. تقنية الـ Debounce: ننتظر 800 مللي ثانية بعد آخر حرف يكتبه المستخدم
        const delayDebounceFn = setTimeout(async () => {
            setIsTranslating(true);
            try {
                const result = await translate(nameToTranslate, 'en');
                const slug = result
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-');
                setValue("slug", slug);
            } catch (error) {
                console.error("Translation failed", error);
            } finally {
                setIsTranslating(false);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [name]);


    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label className={labelClassName}>
                    {t('fields.productSlug')}
                </Label>

                {/* إظهار حالة الترجمة بجانب العنوان */}
                {isTranslating && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full animate-pulse">
                        {t('status.translating')}
                    </span>
                )}
            </div>

            <div className="relative">
                <Input
                    {...register('slug')}
                    placeholder={t('placeholders.productSlug')}
                    className={`${className} ${slugStatus === 'unique' ? 'border-green-500 focus:ring-green-500/20' :
                        slugStatus === 'taken' ? 'border-red-500 focus:ring-red-500/20' : ''
                        }`}
                />

                {/* أيقونة حالة التحقق داخل الحقل (اختياري) */}
                {slugStatus === 'checking' && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* رسائل الخطأ والتحقق الأسفل */}
            <div className="min-h-[20px] px-1">
                {/* 1. خطأ الـ Validation (Regex أو Required) */}
                {errors?.slug?.message && (
                    <p className="text-xs text-red-600 font-medium">{errors.slug.message}</p>
                )}

                {/* 2. رسائل حالة الـ Slug (تظهر فقط إذا كان الـ Regex صحيحاً) */}
                {!errors.slug && slug && (
                    <>
                        {slugStatus === 'checking' && (
                            <p className="text-xs text-gray-500 italic">{t('status.checking')}</p>
                        )}
                        {slugStatus === 'unique' && (
                            <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                <span>✓</span> {t('validation.slugAvailable')}
                            </p>
                        )}
                        {slugStatus === 'takenStore' && (
                            <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                                <span>✕</span> {t('validation.slugTakenStore')}
                            </p>
                        )}
                        {slugStatus === 'taken' && (
                            <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                                <span>✕</span> {t('validation.slugTaken')}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}