'use client'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAutoTranslate } from '@/utils/autoTranslate';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export function useSlugify() {
    const { translate } = useAutoTranslate();
    const [isTranslating, setIsTranslating] = useState(false);

    const generateSlug = async (text) => {
        if (!text || text.trim().length < 3) return "";

        const nameToTranslate = text.trim();
        setIsTranslating(true);

        try {
            const isArabic = /[\u0600-\u06FF]/.test(nameToTranslate);
            let result = nameToTranslate;

            if (isArabic) {
                result = await translate(nameToTranslate, 'en');
            }

            return result
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
        } catch (error) {
            console.error("Slug generation failed", error);
            return "";
        } finally {
            setIsTranslating(false);
        }
    };

    return { generateSlug, isTranslating };
}

export default function SlugInput({ mainName, mainSlug, register, name, slug, errors, slugStatus, setValue, className, labelClassName }) {
    const t = useTranslations('addProduct');
    const { generateSlug, isTranslating } = useSlugify();

    const initialNameRef = useRef(name);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            if (mainName === name) return setValue("slug", mainSlug);
            const slug = await generateSlug(name);
            setValue("slug", slug);
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [name, setValue, mainName, mainSlug]);


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