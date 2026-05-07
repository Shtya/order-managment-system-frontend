'use client'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAutoTranslate } from '@/utils/autoTranslate';
import { cn } from '@/utils/cn';
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
                .replace(/[^a-zA-Z0-9\s-]/g, '')
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
        <Field
            label={
                <div className="flex justify-between items-center w-full">
                    <span>{t('fields.productSlug')}</span>

                    {/* إظهار حالة الترجمة بجانب العنوان */}
                    {isTranslating && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full animate-pulse">
                            {t('status.translating')}
                        </span>
                    )}
                </div>
            }
            error={errors?.slug?.message}
            className={className}
        >
            <div className="relative">
                <Input
                    {...register('slug')}
                    placeholder={t('placeholders.productSlug')}
                    className={cn(
                        slugStatus === 'unique' ? 'border-green-500 focus:ring-green-500/20' :
                            slugStatus === 'taken' ? 'border-red-500 focus:ring-red-500/20' : ''
                    )}
                />

                {/* أيقونة حالة التحقق داخل الحقل (اختياري) */}
            </div>

            {/* رسائل الخطأ والتحقق الأسفل */}
            <FieldStatusInfo
                name="slug"
                errors={errors}
                value={slug}
                status={slugStatus}
                t={t}
            />
        </Field>
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

export const FieldStatusInfo = ({
    errors,
    name,
    value,
    status,
    t
}) => {
    // 1. Extract the specific error for this field
    const fieldError = errors?.[name];

    return (
        <div className=" px-1">
            {/* 1. Standard Validation Error (Regex, Required, etc.) */}

            {/* 2. Async Status Messages (Shows only if no standard error and value exists) */}
            {!fieldError && value && (
                <div className="min-h-[20px] flex items-center gap-1 text-xs">
                    {status === 'checking' && (
                        <p className="text-gray-500 italic">
                            {t('status.checking')}
                        </p>
                    )}

                    {status === 'unique' && (
                        <p className="text-green-600 font-bold flex items-center gap-1">
                            <span className="text-[10px]">✓</span>
                            {/* Dynamically fetches validation.slugAvailable or validation.skuAvailable */}
                            {t(`validation.${name}Available`)}
                        </p>
                    )}

                    {status === 'takenStore' && (
                        <p className="text-red-600 font-bold flex items-center gap-1">
                            <span className="text-[10px]">✕</span>
                            {t(`validation.${name}TakenStore`)}
                        </p>
                    )}

                    {status === 'taken' && (
                        <p className="text-red-600 font-bold flex items-center gap-1">
                            <span className="text-[10px]">✕</span>
                            {t(`validation.${name}Taken`)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};