'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Plus, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Button_ from '@/components/atoms/Button';
import { useRouter } from '@/i18n/navigation';
import { TagInput } from '@/components/atoms/TagInput';
import { cn } from '@/utils/cn';
import { useTranslations } from 'next-intl';

export default function AddProductPage() {
  const t = useTranslations('addProduct');

  const [upsellingTags, setUpsellingTags] = useState([t('mock.upsell1'), t('mock.upsell2')]);
  const [mainFiles, setMainFiles] = React.useState([]);
  const [otherFiles, setOtherFiles] = React.useState([]);

  const navigate = useRouter();

  const makeVariant = () => ({
    id: crypto.randomUUID(),
    categoryValue: '',
    tags: [],
    wholesalePrice: '',
    retailPrice: '',
    quantity: '',
    defaultPrice: '',
  });

  const [variants, setVariants] = useState([
    {
      ...makeVariant(),
      categoryValue: t('mock.variantCategoryValue'),
      tags: [t('mock.tagRed'), t('mock.tagBlue'), t('mock.tagOrange')],
      wholesalePrice: '200',
      retailPrice: '180',
      quantity: '398',
      defaultPrice: '398',
    },
  ]);

  const addVariant = () => setVariants((prev) => [...prev, makeVariant()]);
  const deleteVariant = (id) => setVariants((prev) => prev.filter((v) => v.id !== id));
  const updateVariant = (id, patch) => setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
      className="min-h-screen p-6"
    >
      {/* Header */}
      <div className="bg-card mb-6">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-gray-400">{t('breadcrumb.home')}</span>
            <ChevronLeft className="text-gray-400" size={18} />
            <button
              onClick={() => navigate.push('/products')}
              className="text-gray-400 hover:text-primary transition-colors"
            >
              {t('breadcrumb.products')}
            </button>
            <ChevronLeft className="text-gray-400" size={18} />
            <span className="text-primary">{t('breadcrumb.addProduct')}</span>
            <span className="mr-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button_
              onClick={() => navigate.push('/products')}
              size="sm"
              label={t('actions.howToUse')}
              tone="white"
              variant="solid"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M18.3848 5.7832C18.2851 5.41218 18.0898 5.07384 17.8184 4.80202C17.5469 4.53021 17.2088 4.33446 16.8379 4.23438C15.4727 3.86719 10 3.86719 10 3.86719C10 3.86719 4.52734 3.86719 3.16211 4.23242C2.79106 4.33219 2.45278 4.52782 2.18126 4.79969C1.90974 5.07155 1.71453 5.41007 1.61523 5.78125C1.25 7.14844 1.25 10 1.25 10C1.25 10 1.25 12.8516 1.61523 14.2168C1.81641 14.9707 2.41016 15.5645 3.16211 15.7656C4.52734 16.1328 10 16.1328 10 16.1328C10 16.1328 15.4727 16.1328 16.8379 15.7656C17.5918 15.5645 18.1836 14.9707 18.3848 14.2168C18.75 12.8516 18.75 10 18.75 10C18.75 10 18.75 7.14844 18.3848 5.7832ZM8.26172 12.6172V7.38281L12.793 9.98047L8.26172 12.6172Z"
                    fill="#A7A7A7"
                  />
                </svg>
              }
            />

            <Button_
              size="sm"
              label={t('actions.save')}
              tone="purple"
              variant="solid"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.5 7.5C2.5 5.14333 2.5 3.96417 3.2325 3.2325C3.96417 2.5 5.14333 2.5 7.5 2.5H12.7858C13.4675 2.5 13.8075 2.5 14.1142 2.62667C14.42 2.75333 14.6608 2.995 15.1433 3.47667L16.5233 4.85667C17.0058 5.33833 17.2458 5.58 17.3733 5.88583C17.5 6.1925 17.5 6.5325 17.5 7.21417V12.5C17.5 14.8567 17.5 16.0358 16.7675 16.7675C16.2333 17.3025 15.4608 17.4467 14.1667 17.4858V14.9483C14.1667 14.4033 14.1667 13.9142 14.1133 13.5175C14.055 13.0842 13.92 12.6408 13.5567 12.2767C13.1925 11.9133 12.7483 11.7783 12.3158 11.72C11.9192 11.6667 11.43 11.6667 10.885 11.6667H8.28167C7.73667 11.6667 7.2475 11.6667 6.85083 11.72C6.4175 11.7783 5.97417 11.9133 5.61 12.2767C5.24667 12.6408 5.11167 13.085 5.05333 13.5175C5 13.9142 5 14.4033 5 14.9483V17.4367C4.1875 17.3567 3.64083 17.1758 3.2325 16.7675C2.5 16.0358 2.5 14.8567 2.5 12.5V7.5ZM12.5 15V17.5H7.5C7.20444 17.5 6.92667 17.4994 6.66667 17.4983V15C6.66667 14.3875 6.66833 14.0117 6.705 13.7392C6.7375 13.5008 6.7825 13.4608 6.78833 13.4558C6.79417 13.45 6.83333 13.4042 7.0725 13.3717C7.345 13.335 7.72083 13.3333 8.33333 13.3333H10.8333C11.4458 13.3333 11.8217 13.335 12.0942 13.3717C12.3333 13.4042 12.3725 13.4492 12.3775 13.455H12.3783C12.3842 13.4608 12.4292 13.5008 12.4617 13.7392C12.4983 14.0117 12.5 14.3875 12.5 15ZM5.83333 5.83333C5.61232 5.83333 5.40036 5.92113 5.24408 6.07741C5.0878 6.23369 5 6.44565 5 6.66667C5 6.88768 5.0878 7.09964 5.24408 7.25592C5.40036 7.4122 5.61232 7.5 5.83333 7.5H10C10.221 7.5 10.433 7.4122 10.5893 7.25592C10.7455 7.09964 10.8333 6.88768 10.8333 6.66667C10.8333 6.44565 10.7455 6.23369 10.5893 6.07741C10.433 5.92113 10.221 5.83333 10 5.83333H5.83333Z"
                    fill="white"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* Form Content - Two Columns */}
      <div className="flex gap-6">
        {/* Right Column */}
        <div className="space-y-6 w-full">
          {/* Product Info Card */}
          <motion.div className="bg-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="space-y-5 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('fields.productName')}</Label>
                <Input placeholder={t('placeholders.productName')} className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('fields.wholesalePrice')}</Label>
                <Input placeholder={t('placeholders.wholesalePrice')} className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('fields.warehouse')}</Label>
                <Select>
                  <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                    <SelectValue placeholder={t('placeholders.warehouse')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="b612">{t('options.branch1')}</SelectItem>
                    <SelectItem value="a101">{t('options.branch2')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('fields.storageShelf')}</Label>
                <Input placeholder={t('placeholders.storageShelf')} className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('fields.sku')}</Label>
                <Input placeholder={t('placeholders.sku')} className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('fields.store')}</Label>
                <Select>
                  <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                    <SelectValue placeholder={t('placeholders.store')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="b612">{t('options.branch1')}</SelectItem>
                    <SelectItem value="a101">{t('options.branch2')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('fields.description')}</Label>
                <Input placeholder={t('placeholders.description')} className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700" />
              </div>
            </div>
          </motion.div>

          {/* Variants Section */}
          <motion.div className="bg-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200">{t('variants.title')}</h3>

              <Button type="button" onClick={addVariant} className="rounded-full text-white bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                {t('variants.add')}
              </Button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, idx) => (
                <motion.div
                  key={variant.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/20 p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                      {t('variants.variant')} #{idx + 1}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => deleteVariant(variant.id)}
                      className="rounded-full border border-red-600 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                      {t('variants.delete')}
                    </Button>
                  </div>

                  <div className="space-y-5 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-slate-300">{t('variants.categoryValue')}</Label>
                      <Input
                        value={variant.categoryValue}
                        onChange={(e) => updateVariant(variant.id, { categoryValue: e.target.value })}
                        placeholder={t('placeholders.variantCategory')}
                        className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                      />
                    </div>

                    <TagInput
                      label={t('variants.variantValue')}
                      tags={variant.tags}
                      onTagsChange={(next) => updateVariant(variant.id, { tags: next })}
                      placeholder=""
                      dir="rtl"
                    />
                  </div>

                  <div className="mt-5 space-y-5 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-slate-300">{t('variants.wholesalePrice')}</Label>
                      <Input
                        type="number"
                        value={variant.wholesalePrice}
                        onChange={(e) => updateVariant(variant.id, { wholesalePrice: e.target.value })}
                        placeholder="200"
                        className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-slate-300">{t('variants.retailPrice')}</Label>
                      <Input
                        type="number"
                        value={variant.retailPrice}
                        onChange={(e) => updateVariant(variant.id, { retailPrice: e.target.value })}
                        placeholder="180"
                        className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-slate-300">{t('variants.quantity')}</Label>
                      <Input
                        type="number"
                        value={variant.quantity}
                        onChange={(e) => updateVariant(variant.id, { quantity: e.target.value })}
                        placeholder="398"
                        className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-slate-300">{t('variants.defaultPrice')}</Label>
                      <Input
                        type="number"
                        value={variant.defaultPrice}
                        onChange={(e) => updateVariant(variant.id, { defaultPrice: e.target.value })}
                        placeholder="398"
                        className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Upselling Section */}
          <motion.div className="bg-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <div className="space-y-5 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('upsell.callCenterDesc')}</Label>
                <Input placeholder="444" className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('upsell.minPrice')}</Label>
                <Input placeholder="200" className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t('upsell.execution')}</Label>
                <Select>
                  <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                    <SelectValue placeholder={t('upsell.yes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t('upsell.yes')}</SelectItem>
                    <SelectItem value="no">{t('upsell.no')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <TagInput
                label={t('upsell.products')}
                tags={upsellingTags}
                onTagsChange={setUpsellingTags}
                placeholder=""
                dir="rtl"
              />
            </div>
          </motion.div>
        </div>

        {/* Left Column */}
        <div className="space-y-6 w-full max-w-[550px] max-xl:max-w-[400px]">
          <ImageUploadBox
            t={t}
            title={t('uploads.mainImage')}
            files={mainFiles}
            onFilesChange={setMainFiles}
            multiple={false}
          />

          <ImageUploadBox
            t={t}
            title={t('uploads.otherImages')}
            files={otherFiles}
            onFilesChange={setOtherFiles}
            multiple={true}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ImageUploadBox({
  t,
  title,
  files,
  onFilesChange,
  multiple = true,
  accept = "image/*",
  className,
}) {
  const inputRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const addFiles = React.useCallback(
    (picked) => {
      const next = picked.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));
      onFilesChange([...files, ...next]);
    },
    [files, onFilesChange]
  );

  const onPick = (e) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    addFiles(picked);
    e.target.value = "";
  };

  const removeFile = (id) => {
    const target = files.find((f) => f.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onFilesChange(files.filter((f) => f.id !== id));
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
    const ext = name.split(".").pop()?.toUpperCase();
    return ext && ext !== name.toUpperCase() ? ext : "FILE";
  };

  const isImage = (f) => f.file.type.startsWith("image/");

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className={cn("bg-card rounded-2xl p-6", className)}
      dir="rtl"
    >
      <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4 text-right">{title}</h3>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-primary/60 bg-white/40 dark:bg-slate-900/20"
        )}
      >
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={onPick} />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UploadIllustration />
          </div>

          <div className="space-y-2">
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('uploads.dragHere')}</p>

            <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
              <span className="h-px w-24 bg-slate-200 dark:bg-slate-700" />
              <span>{t('uploads.or')}</span>
              <span className="h-px w-24 bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-full px-8 border-primary/60 text-primary hover:bg-primary/10"
            onClick={() => inputRef.current?.click()}
          >
            {t('uploads.attach')}
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/20 p-4"
          >
            <button
              type="button"
              onClick={() => removeFile(f.id)}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              aria-label={t('uploads.remove')}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-1 text-right">
              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{f.file.name}</div>
              <div className="text-xs text-slate-400">{(f.file.size / 1024).toFixed(1)} KB</div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="rounded-md bg-primary/15 text-primary border border-primary/20">{prettyExt(f.file.name)}</Badge>

              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {isImage(f) && f.previewUrl ? (
                  <img src={f.previewUrl} alt={f.file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-500">
                    {f.file.type.includes("image") ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function UploadIllustration() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_180_3507)">
        <path d="M33.4417 3.12061H14.1743V11.1106H37.5567V7.23402C37.5567 4.96567 35.7107 3.12061 33.4417 3.12061Z" fill="#CED9F9" />
        <path className="fill-primary" d="M22.5352 12.3403H0V4.92636C0 2.20972 2.21068 0 4.92828 0H12.1336C12.8497 0 13.5396 0.150925 14.1664 0.434509C15.0418 0.828964 15.7939 1.47913 16.3213 2.3286L22.5352 12.3403Z" />
        <path className="fill-primary/70" d="M42 14.0001V37.8815C42 40.1527 40.1511 42 37.8789 42H4.12111C1.84891 42 0 40.1527 0 37.8815V9.88062H37.8789C40.1511 9.88062 42 11.7286 42 14.0001Z" />
        <path className="fill-primary/60" d="M42 14.0001V37.8815C42 40.1527 40.1511 42 37.8789 42H21V9.88062H37.8789C40.1511 9.88062 42 11.7286 42 14.0001Z" />
        <path d="M32.048 25.9398C32.048 32.0322 27.0919 36.9887 21.0001 36.9887C14.9083 36.9887 9.95215 32.0322 9.95215 25.9398C9.95215 19.8483 14.9083 14.8918 21.0001 14.8918C27.0919 14.8918 32.048 19.8483 32.048 25.9398Z" fill="#E7ECFC" />
        <path d="M32.0479 25.9398C32.0479 32.0322 27.0918 36.9887 21 36.9887V14.8918C27.0918 14.8918 32.0479 19.8483 32.0479 25.9398Z" fill="#CED9F9" />
        <path className="fill-primary/50" d="M24.561 26.0753C24.3306 26.2704 24.0483 26.3656 23.7685 26.3656C23.4183 26.3656 23.0703 26.2173 22.8268 25.9282L22.2304 25.2213V29.8494C22.2304 30.5287 21.6793 31.0799 21 31.0799C20.3207 31.0799 19.7695 30.5287 19.7695 29.8494V25.2213L19.1732 25.9282C18.7342 26.4476 17.9584 26.514 17.439 26.0753C16.9199 25.6373 16.8532 24.8612 17.2913 24.3418L19.7269 21.4543C20.0444 21.0788 20.5078 20.8628 21 20.8628C21.4922 20.8628 21.9555 21.0788 22.2731 21.4543L24.7087 24.3418C25.1467 24.8612 25.0801 25.6373 24.561 26.0753Z" />
        <path className="fill-primary/70" d="M24.561 26.0753C24.3306 26.2704 24.0483 26.3656 23.7686 26.3656C23.4183 26.3656 23.0703 26.2173 22.8268 25.9282L22.2305 25.2213V29.8494C22.2305 30.5287 21.6793 31.0799 21 31.0799V20.8628C21.4922 20.8628 21.9555 21.0788 22.2731 21.4543L24.7087 24.3418C25.1467 24.8612 25.0801 25.6373 24.561 26.0753Z" />
      </g>
      <defs>
        <clipPath id="clip0_180_3507">
          <rect width="42" height="42" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
