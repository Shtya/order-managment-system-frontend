"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  ShoppingBag,
  Zap,
  Tag,
  Clock,
  Boxes,
  Loader2,
  AlertCircle,
  Hash,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import ProductFilter from "@/components/atoms/ProductFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/utils/api";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { avatarSrc } from "@/components/atoms/UserSelect";
import InteractiveMessageBuilder from "@/components/molecules/InteractiveMessageBuilder";
import TemplatePreview from "@/app/[locale]/whatsapp/atoms/TemplatePreview";

// ─── UPSELL SKU SELECTOR MODAL ──────────────────────────────────────────────
function SkuSelectorModal({ isOpen, onClose, product, onSelect, selectedSkus = [], isRtl, t, formatCurrency }) {
  if (!product) return null;
  const skus = Array.isArray(product.skus) ? product.skus.filter(s => s.isActive) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl! max-h-[85vh] overflow-hidden p-0 bg-white dark:bg-slate-950" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Boxes className="text-primary" size={20} />
            {isRtl ? "اختر الصنف للعرض الإضافي" : "Select Sku for Upsell"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
          <div className="rounded-xl border p-4 shadow-sm bg-muted/10">
            <div className="flex gap-4">
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border">
                {product.mainImage ? (
                  <img src={avatarSrc(product.mainImage)} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-slate-400" />
                )}
              </div>
              <div style={{ textAlign: isRtl ? "right" : "left" }}>
                <h4 className="text-lg font-bold">{product.name}</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">ID: {product.id}</Badge>
                  <Badge variant="outline" className="text-[10px]">SKU: {product.sku || "—"}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-sm font-semibold flex items-center gap-2">
              <Hash size={16} className="text-primary" />
              {isRtl ? "الأصناف المتاحة" : "Available Variants"} ({skus.length})
            </h5>

            <div className="border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-start font-bold">{isRtl ? "كود الصنف" : "SKU"}</th>
                      <th className="px-4 py-3 text-center font-bold">{isRtl ? "المواصفات" : "Attributes"}</th>
                      <th className="px-4 py-3 text-center font-bold">{isRtl ? "السعر" : "Price"}</th>
                      <th className="px-4 py-3 text-center font-bold">{isRtl ? "المخزون" : "Stock"}</th>
                      <th className="px-4 py-3 text-end font-bold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {skus.map((s) => {
                      const attrs = s?.attributes ? Object.entries(s.attributes) : [];
                      const avail = Math.max(0, (s?.stockOnHand ?? 0) - (s?.reserved ?? 0));
                      const isSelected = selectedSkus.some(sel => sel.id === s.id);

                      return (
                        <tr key={s.id} className={cn("hover:bg-muted/30 transition-colors", isSelected && "bg-primary/5")}>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-50">{s.sku || `#${s.id}`}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {attrs.map(([k, v]) => (
                                <Badge key={k} variant="outline" className="text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0">
                                  {k}: {String(v)}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{formatCurrency(s?.price || 0)}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center font-bold">{avail}</td>
                          <td className="px-4 py-3 text-end">
                            <Button_
                              size="sm"
                              label={isSelected ? (isRtl ? "تم الاختيار" : "Selected") : (isRtl ? "اختيار" : "Select")}
                              disabled={!s.isActive || isSelected || !avail}
                              onClick={() => onSelect(s)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UpsellsAddPage({ mode = "add", upsellId = null, initialUpsell = null }) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const t = useTranslations("upsells");
  const { formatCurrency, currency } = usePlatformSettings();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [submitting, setSubmitting] = useState(false);
  const [upsellProduct, setUpsellProduct] = useState(initialUpsell?.upsellProduct || null);
  const [skuModalOpen, setSkuModalOpen] = useState(false);
  const [headerMediaFile, setHeaderMediaFile] = useState(null);

  const schema = useMemo(() => yup.object({
    triggerProductId: yup.string().notOneOf(["all"], tValidation("productRequired")).required(tValidation("productRequired")),
    upsellProductId: yup.string().notOneOf(["all"], tValidation("productRequired")).required(tValidation("productRequired")),
    selectedSku: yup.object().nullable().required(t("validation.skuRequired")),
    price: yup.number()
      .transform((value, originalValue) => originalValue === "" ? undefined : value)
      .typeError(tValidation("mustBePositive"))
      .min(0.01, tValidation("mustBePositive"))
      .required(tValidation("unitCostRequired")),
    expireTimeEnabled: yup.boolean(),
    expireTime: yup.number()
      .when("expireTimeEnabled", {
        is: true,
        then: (schema) => schema
          .transform((value, originalValue) => originalValue === "" ? undefined : value)
          .required(t("validation.expireTimeRequired")).min(1, tValidation("mustBePositive")),
        otherwise: (schema) => schema.nullable().optional()
      }),
    messageConfig: yup.object({
      bodyText: yup.string().required(t("validation.bodyTextRequired")),
      buttons: yup.array().of(
        yup.object({
          text: yup.string().required(t("validation.buttonTextRequired"))
        })
      ).min(2, t("validation.buttonsRequired"))
    })
  }), [t, tValidation]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      triggerProductId: initialUpsell?.triggerProductId || "all",
      upsellProductId: initialUpsell?.upsellProductId || "all",
      selectedSku: initialUpsell?.upsellSku || null,
      price: initialUpsell?.upsellPrice || "",
      expireTimeEnabled: initialUpsell ? initialUpsell.expireTimeM !== null : true,
      expireTime: initialUpsell?.expireTimeM || "30",
      messageConfig: initialUpsell?.messageConfig || {
        headerType: "IMAGE",
        headerUrl: "",
        headerText: "",
        bodyText: "",
        footerText: "هل تريد اضافتة لطلبك؟",
        buttons: [
          { text: "✅ أضف للطلب" },
          { text: "❌ لا شكرا" }
        ]
      }
    }
  });

  const triggerProductId = watch("triggerProductId");
  const upsellProductId = watch("upsellProductId");
  const selectedSku = watch("selectedSku");
  const price = watch("price");
  const expireTimeEnabled = watch("expireTimeEnabled");
  const messageConfig = watch("messageConfig");

  // Reset upsell and sku when trigger changes (only in add mode or if trigger actually changed)
  useEffect(() => {
    if (!initialUpsell || triggerProductId !== initialUpsell.triggerProductId) {
      setValue("upsellProductId", "all");
      setValue("selectedSku", null);
      setUpsellProduct(null);
    }
  }, [triggerProductId, setValue, initialUpsell]);

  // Reset SKU when upsell product changes
  useEffect(() => {
    if (!initialUpsell || upsellProductId !== initialUpsell.upsellProductId) {
      setValue("selectedSku", null);
    }
  }, [upsellProductId, setValue, initialUpsell]);

  // Fetch upsell product details
  useEffect(() => {
    if (upsellProductId && upsellProductId !== "all") {
      api.get(`/products/${upsellProductId}`).then(res => {
        setUpsellProduct(res.data);
        if (!initialUpsell || upsellProductId !== initialUpsell.upsellProductId) {
          setValue("messageConfig.headerUrl", res.data.mainImage || "");
          setValue("messageConfig.bodyText", `لأنك إشتريت من عندنا ليك العرض ده\n\n${res.data.name}\n\nالسعر: ${price || res.data.skus?.[0]?.price || 0} ${currency}`);
        }
      });
    }
  }, [upsellProductId, setValue, currency, initialUpsell]);

  // Sync price to message body
  useEffect(() => {
    if (upsellProduct && (!initialUpsell || price !== initialUpsell.upsellPrice)) {
      setValue("messageConfig.bodyText", `لأنك إشتريت من عندنا ليك العرض ده\n\n🎁${upsellProduct.name}\n\n⚡ السعر: ${price || upsellProduct.skus?.[0]?.price || 0} ${currency}`);
    }
  }, [price, upsellProduct, setValue, currency, initialUpsell]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading(tCommon("loading"));
    try {
      const headerUrl = data.messageConfig.headerUrl;
      const blob = headerUrl && String(headerUrl).startsWith("blob:");
      const isUrl = headerUrl && (String(headerUrl).startsWith("http://") || String(headerUrl).startsWith("https://"));
      const isRelativePath = headerUrl && (String(headerUrl).startsWith("uploads/") || String(headerUrl).startsWith("/uploads/"));

      // Allow URL or relative path without requiring file upload
      if (!isEdit && !headerMediaFile && !isUrl && !isRelativePath) {
        toast.error(t("validation.mediaHeaderFileRequired"), { id: toastId });
        setSubmitting(false);
        return;
      }
      if (isEdit && blob && !headerMediaFile && !isUrl && !isRelativePath) {
        toast.error(t("validation.mediaHeaderMustReupload"), { id: toastId });
        setSubmitting(false);
        return;
      }

      let forcedUrl = data.messageConfig.headerUrl;
      // 2. معالجة رفع الملفات إن وجدت قبل تحديث القالب
      if (headerMediaFile) {
        const fdMedia = new FormData();
        fdMedia.append("headerMedia", headerMediaFile);
        const up = await api.post("/upsells/upload-header-media", fdMedia);
        forcedUrl = up.data?.headerUrl;
      }

      const payload = {
        triggerProductId: data.triggerProductId,
        upsellProductId: data.upsellProductId,
        upsellSkuId: data.selectedSku.id,
        upsellPrice: Number(data.price),
        expireTimeM: data.expireTimeEnabled ? Number(data.expireTime) : null,
        messageConfig: {
          ...data.messageConfig,
          headerUrl: forcedUrl
        }
      };

      if (isEdit) {
        await api.patch(`/upsells/${upsellId}`, payload);
        toast.success(t("messages.statusUpdateSuccess"), { id: toastId });
      } else {
        await api.post("/upsells", payload);
        toast.success(t("messages.createSuccess"), { id: toastId });
      }
      router.push("/upsells");
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || tCommon("error"), { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-5 space-y-6">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.upsells"), href: "/upsells" },
          { name: isEdit ? t("actions.edit") : t("toolbar.addUpsell") },
        ]}
        title={isEdit ? t("actions.edit") : t("toolbar.addUpsell")}
        buttons={
          <div className="flex items-center gap-3">
            <Button_
              label={tCommon("save")}
              variant="solid"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
              icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Message Builder */}
        <div className="lg:col-span-8 space-y-6">


          {/* Middle Column: Settings */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-lg mb-6 border-b pb-4">{isRtl ? "إعدادات العرض  (Upsell Settings)" : "Upsell Settings"}</h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Controller
                    name="triggerProductId"
                    control={control}
                    render={({ field }) => (
                      <ProductFilter
                        showAllOption={false}
                        label={t("table.triggerProduct")}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errors.triggerProductId && (
                    <p className="text-xs text-red-500 px-1">{errors.triggerProductId.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Controller
                    name="upsellProductId"
                    control={control}
                    render={({ field }) => (
                      <ProductFilter
                        showAllOption={false}
                        label={t("table.upsellProduct")}
                        value={field.value}
                        onChange={field.onChange}
                        mode="upsell"
                        triggerId={triggerProductId}
                      />
                    )}
                  />
                  {errors.upsellProductId && (
                    <p className="text-xs text-red-500 px-1">{errors.upsellProductId.message}</p>
                  )}
                </div>

                {upsellProduct && (
                  <div className="space-y-2">
                    <Label>{isRtl ? "الصنف المختار" : "Selected Sku"}</Label>
                    <div
                      onClick={() => setSkuModalOpen(true)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border-2 border-dashed hover:border-primary cursor-pointer transition-all bg-slate-50 dark:bg-slate-950",
                        errors.selectedSku ? "border-red-500 bg-red-50/30" : "border-slate-200 dark:border-slate-800"
                      )}
                    >
                      {selectedSku ? (
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">{selectedSku.sku || `#${selectedSku.id.slice(0, 6)}`}</Badge>
                          <span className="text-sm font-bold">{formatCurrency(selectedSku.price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">{isRtl ? "اضغط لاختيار الصنف..." : "Click to select Sku..."}</span>
                      )}
                      <Boxes size={18} className="text-slate-400" />
                    </div>
                    {errors.selectedSku && (
                      <p className="text-xs text-red-500 px-1">{errors.selectedSku.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t("table.price")}</Label>
                  <div className="relative">
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          className={cn("h-11 pe-12", errors.price && "border-red-500 focus-visible:ring-red-500")}
                        />
                      )}
                    />
                    <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{currency}</span>
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-500 px-1">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3">
                    <Controller
                      name="expireTimeEnabled"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="expireTimeEnabled"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="expireTimeEnabled" className="flex items-center gap-2 cursor-pointer">
                      <Clock size={16} className="text-slate-400" />
                      {isRtl ? "تحديد وقت انتهاء العرض" : "Set expiration time for this offer"}
                    </Label>
                  </div>
                  {expireTimeEnabled && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Controller
                          name="expireTime"
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="number"
                              {...field}
                              className={cn("h-11 w-24", errors.expireTime && "border-red-500 focus-visible:ring-red-500")}
                              placeholder="30"
                            />
                          )}
                        />
                        <span className="text-sm text-slate-500">{isRtl ? "دقيقة" : "Minutes"}</span>
                      </div>
                      {errors.expireTime && (
                        <p className="text-xs text-red-500 px-1">{errors.expireTime.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-lg mb-6 border-b pb-4">{isRtl ? "محتوى الرسالة " : "Interactive Message Content"}</h3>
              <Controller
                name="messageConfig"
                control={control}
                render={({ field }) => (
                  <InteractiveMessageBuilder
                    value={field.value}
                    onChange={field.onChange}
                    setHeaderMediaFile={setHeaderMediaFile}
                    errors={errors.messageConfig}
                    config={{
                      minButtons: 2,
                      maxButtons: 2,
                      headerTypes: ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"],
                      allowVariables: false,
                      buttonStyles: ["emerald", "red"]
                    }}
                  />
                )}
              />
            </div>
          </div>

        </div>
        {/* Right Column: Preview */}
        <div className="lg:col-span-4 space-y-6 sticky top-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col ">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center justify-between">
              معاينة حية
            </h3>

            {/* Template Preview Component - Reduced Height */}
            <div className="h-full w-full overflow-y-auto w-full flex justify-center custom-scrollbar mb-6">
              <TemplatePreview
                isInteractive={true}
                template={{
                  headerType: messageConfig.headerType,
                  headerText: messageConfig.headerText,
                  headerUrl: messageConfig.headerUrl,
                  bodyText: messageConfig.bodyText,
                  footerText: messageConfig.footerText,
                  buttons: messageConfig.buttons,
                  language: isRtl ? "ar" : "en"
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <SkuSelectorModal
        isOpen={skuModalOpen}
        onClose={() => setSkuModalOpen(false)}
        product={upsellProduct}
        onSelect={(sku) => {
          setValue("selectedSku", sku);
          setValue("price", String(sku.price));
          setSkuModalOpen(false);
        }}
        selectedSkus={selectedSku ? [selectedSku] : []}
        isRtl={isRtl}
        t={t}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
