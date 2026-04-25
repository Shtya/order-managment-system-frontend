"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import AddProductPage, { canonicalKey, makeId, slugifyKey } from "../../new/page";
import { normalizeAxiosError } from "@/utils/axios";
import { convert } from "html-to-text";

export default function ImportExternalProductPage() {
    const t = useTranslations('editProduct'); // نستخدم نفس مفاتيح الترجمة للتحميل
    const params = useParams();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const { provider } = params;

    const [loading, setLoading] = useState(true);
    const [mappedProduct, setMappedProduct] = useState(null);

    useEffect(() => {
        if (!provider || !id) return;

        (async () => {
            setLoading(true);
            try {
                const res = await api.get(`/stores/external/${provider}`, {
                    params: { id },
                });

                const externalData = res.data;


                const mapped = transformExternalToLocal(externalData);
                setMappedProduct(mapped);
            } catch (e) {
                toast.error(normalizeAxiosError(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [provider, id]);




    // دالة التحويل (Mapping)
    function transformExternalToLocal(ext) {

        const remoteImages = (ext.images || []).map(url => ({
            id: crypto.randomUUID(), // معرف مؤقت للمكون
            url: url,
            isRemote: true, // علامة للباك-إند
            isFromLibrary: true // لتجاوز الـ validation المحلي في المكون
        }));

        return {
            remoteId: id,
            storeId: ext?.storeId,
            hasPurchase: false,
            type: ext.variants?.length > 0 ? 'variable' : 'simple',
            name: ext.name || '',
            slug: ext.slug || '',
            wholesalePrice: ext.expense || '',
            salePrice: ext.price || '',
            lowestPrice: '',
            storageRack: '',
            categoryName: ext.categories?.[0]?.name || '', // نأخذ أول تصنيف
            // categoryId: ext.categories?.[0]?.name || '', // نأخذ أول تصنيف
            warehouseId: '',
            description: convert(ext.description, {
                wordwrap: false,
                selectors: [
                    { selector: 'img', format: 'skip' },
                    { selector: 'a', options: { ignoreHref: true } },
                ],
            }).replace(/\n{2,}/g, '\n')   // 👈 collapse multiple newlines into one
                .trim(),
            callCenterProductDescription: '',
            upsellingEnabled: ext?.upsellings?.length > 0,
            upsellingProducts: ext?.upsellings?.map(up => ({
                productId: up.id,
                label: up.name,
                callCenterDescription: ''
            })),

            // تحويل السمات (Attributes)
            attributes: ext.variations?.map(v => ({
                id: makeId(),
                name: v.name,
                values: v.props.map(p => p.value || p.name).filter(Boolean) // تأكد من وجود قيمة
            })) || [],

            combinations: ext.variants?.map(v => {
                const attrs = v.variation_props.reduce((acc, vp) => {
                    if (vp.variation && vp.variation_prop) {
                        const key = slugifyKey(vp.variation);
                        const value = slugifyKey(vp.variation_prop);
                        acc[key] = value;
                    }
                    return acc;
                }, {});
                const altkey = canonicalKey(attrs);
                return {
                    key: v.key || altkey,
                    sku: v.sku,
                    price: v.price,
                    isExisting: false,
                    isActive: true,
                    reserved: 0,
                    stockOnHand: 0,
                    variantId: undefined,
                    attributes: attrs
                };
            }) || [],

            purchase: {
                supplierId: '',
                receiptNumber: '',
                safeId: '',
                notes: '',
                paidAmount: ''
            },
            // إضافة الصور إن كان المكون يدعمها في الـ existingProduct
            images: remoteImages || [],
            mainImage: {
                id: crypto.randomUUID(), // معرف مؤقت للمكون
                url: ext.thumb,
                isRemote: true, // علامة للباك-إند
                isFromLibrary: true // لتجاوز الـ validation المحلي في المكون
            }
        };
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-300">{t('loading.message')}</p>
                </div>
            </div>
        );
    }

    if (!mappedProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-slate-600 dark:text-slate-300">{t('loading.notFound')}</p>
                </div>
            </div>
        );
    }


    return <AddProductPage isEditMode={false} defaultValues={mappedProduct} />;
}