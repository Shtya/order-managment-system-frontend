"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, X, Upload, Scan, Trash2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Button_ from "@/components/atoms/Button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/cn";

import { useLocale, useTranslations } from "next-intl";

export default function CreatePurchaseInvoicePage() {
  const navigate = useRouter();

  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("purchaseInvoice");

  const [receiptImage, setReceiptImage] = useState(null);
  const [notes, setNotes] = useState("");

  const [formData, setFormData] = useState({
    supplierCode: "",
    supplierName: "",
    receiptNumber: "",
    safeId: "",
    paymentMethod: "cash",
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      sku: "SRF56",
      name: "وعاء طهي",
      unitCost: "20 د.أ",
      quantity: 15,
      productCost: "10000 د.أ",
      taxInclusive: "نعم",
      taxRate: "5٪",
      totalAmount: "15000 د.أ",
    },
    {
      id: 2,
      sku: "SRF56",
      name: "وعاء طهي",
      unitCost: "20 د.أ",
      quantity: 151,
      productCost: "10000 د.أ",
      taxInclusive: "لا",
      taxRate: "5٪",
      totalAmount: "15000 د.أ",
    },
    {
      id: 3,
      sku: "SRF56",
      name: "وعاء طهي",
      unitCost: "20 د.أ",
      quantity: 15,
      productCost: "10000 د.أ",
      taxInclusive: "نعم",
      taxRate: "5٪",
      totalAmount: "15000 د.أ",
    },
    {
      id: 4,
      sku: "SRF56",
      name: "وعاء طهي",
      unitCost: "20 د.أ",
      quantity: 15,
      productCost: "10000 د.أ",
      taxInclusive: "نعم",
      taxRate: "5٪",
      totalAmount: "15000 د.أ",
    },
    {
      id: 5,
      sku: "SRF56",
      name: "وعاء طهي",
      unitCost: "20 د.أ",
      quantity: 15,
      productCost: "10000 د.أ",
      taxInclusive: "لا",
      taxRate: "5٪",
      totalAmount: "15000 د.أ",
    },
  ]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage({
          file,
          preview: reader.result,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReceiptImage(null);
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    console.log("Save invoice:", { formData, products, notes, receiptImage });
  };

  // Calculate summary
  const summary = {
    productCount: products.length,
    subtotal: "2000 د.أ",
    taxRate: "5 ٪",
    taxTotal: "2500 د.أ",
    paidAmount: "1000 د.أ",
    dueAmount: "15000 د.أ",
    remainingAmount: "1500 د.أ",
  };

  return (
    <motion.div
      dir={isRTL ? "rtl" : "ltr"}
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
            <span className="text-gray-400">{t("breadcrumb.home")}</span>
            <ChevronLeft className="text-gray-400" size={18} />
            <button
              onClick={() => navigate.push("/purchases")}
              className="text-gray-400 hover:text-primary transition-colors"
            >
              {t("breadcrumb.purchases")}
            </button>
            <ChevronLeft className="text-gray-400" size={18} />
            <span className="text-primary">{t("breadcrumb.createPurchaseInvoice")}</span>
            <span className="mr-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button_
              size="sm"
              label={t("actions.howToUse")}
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
              onClick={() => console.log("how-to-use")}
            />

            <Button_
              onClick={handleSave}
              size="sm"
              label={t("actions.save")}
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

      {/* Main Content - Three Columns */}
      <div className="flex gap-6">
        {/* Left Column - Supplier Info & Receipt Upload */}
        <div className="w-full max-w-[400px] space-y-6">
          {/* Supplier Information */}
          <motion.div
            className="bg-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
              {t("sections.supplierInfo")}
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t("fields.supplierName")}</Label>
                <Input
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder={t("placeholders.supplierName")}
                  className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t("fields.supplierCode")}</Label>
                <Input
                  value={formData.supplierCode}
                  onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value })}
                  placeholder={t("placeholders.supplierCode")}
                  className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t("fields.receiptNumber")}</Label>
                <Input
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  placeholder={t("placeholders.receiptNumber")}
                  className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t("fields.safe")}</Label>
                <Select value={formData.safeId} onValueChange={(v) => setFormData({ ...formData, safeId: v })}>
                  <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                    <SelectValue placeholder={t("placeholders.safe")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card-select">
                    <SelectItem value="safe1">{t("options.safe.cash")}</SelectItem>
                    <SelectItem value="safe2">{t("options.safe.safe1")}</SelectItem>
                    <SelectItem value="safe3">{t("options.safe.safe2")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300">{t("fields.paymentMethod")}</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                >
                  <SelectTrigger className="w-full rounded-full !h-[45px] bg-[#fafafa] dark:bg-slate-800/50">
                    <SelectValue placeholder={t("placeholders.paymentMethod")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card-select">
                    <SelectItem value="cash">{t("options.payment.cash")}</SelectItem>
                    <SelectItem value="bank_cib">{t("options.payment.bankCIB")}</SelectItem>
                    <SelectItem value="bank_qnb">{t("options.payment.bankQNB")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Receipt Image Upload */}
          <ReceiptImageUpload
            t={t}
            isRTL={isRTL}
            image={receiptImage}
            onImageChange={handleImageUpload}
            onRemove={handleRemoveImage}
          />
        </div>

        {/* Middle Column - Products Table */}
        <div className="flex-1 space-y-6">
          {/* Product Search/Add */}
          <motion.div
            className="bg-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
              {t("sections.addProducts")}
            </h3>

            <div className="relative">
              <Scan className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder={t("placeholders.scanOrEnter")}
                className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 pr-10"
              />
            </div>
          </motion.div>

          {/* Products Table */}
          <motion.div
            className="bg-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
              {t("sections.productsTable")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.sku")}</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.name")}</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.unitCost")}</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.quantity")}</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.productCost")}</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.taxInclusive")}</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.taxRate")}</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.totalAmount")}</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600 dark:text-slate-300">{t("table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 text-sm text-gray-600 dark:text-slate-300">{product.sku}</td>
                      <td className="p-3 text-sm font-semibold text-gray-700 dark:text-slate-200">{product.name}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-slate-300">{product.unitCost}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-slate-300">{product.quantity}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-slate-300">{product.productCost}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-slate-300">{product.taxInclusive}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-slate-300">{product.taxRate}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-slate-300">{product.totalAmount}</td>
                      <td className="p-3 text-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteProduct(product.id)}
                          aria-label={t("actions.delete")}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            className="bg-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
              {t("sections.notes")}
            </h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("placeholders.notes")}
              className="min-h-[100px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-2xl"
            />
          </motion.div>
        </div>

        {/* Right Column - Invoice Summary */}
        <div className="w-full max-w-[350px]">
          <InvoiceSummary t={t} summary={summary} />
        </div>
      </div>
    </motion.div>
  );
}

function ReceiptImageUpload({ image, onImageChange, onRemove, t, isRTL }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const fakeEvent = { target: { files: [file] } };
      onImageChange(fakeEvent);
    }
  };

  return (
    <motion.div
      dir={isRTL ? "rtl" : "ltr"}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card"
    >
      <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4 text-right">
        {t("sections.receiptImage")}
      </h3>

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
          "rounded-2xl border-2 border-dashed transition-all duration-300",
          isDragging ? "border-primary bg-primary/5" : "border-primary/60 bg-white/40 dark:bg-slate-900/20"
        )}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />

        {!image ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload size={32} className="text-primary" />
              </div>

              <div className="space-y-2">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t("upload.dragHere")}
                </p>

                <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
                  <span className="h-px w-16 bg-slate-200 dark:bg-slate-700" />
                  <span>{t("common.or")}</span>
                  <span className="h-px w-16 bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-full px-6 border-primary/60 text-primary hover:bg-primary/10"
                onClick={() => inputRef.current?.click()}
              >
                {t("upload.attachFiles")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800">
              <img src={image.preview} alt={t("upload.receiptAlt")} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-200">{image.name}</p>
                  <p className="text-xs text-gray-400">JPG</p>
                </div>
              </div>

              <motion.button
                type="button"
                onClick={onRemove}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={t("actions.remove")}
                className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
              >
                <X size={16} />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InvoiceSummary({ summary, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card sticky top-6"
    >
      <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
        {t("sections.invoiceSummary")}
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
          <span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.productCount")}</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{summary.productCount}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
          <span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.subtotal")}</span>
          <span className="text-base font-semibold text-gray-700 dark:text-slate-200">{summary.subtotal}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
          <span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.taxRate")}</span>
          <span className="text-base font-semibold text-gray-700 dark:text-slate-200">{summary.taxRate}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20">
          <span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.taxTotal")}</span>
          <span className="text-base font-semibold text-orange-600 dark:text-orange-400">{summary.taxTotal}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
          <span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.paidAmount")}</span>
          <span className="text-base font-semibold text-gray-700 dark:text-slate-200">{summary.paidAmount}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
          <span className="text-sm text-gray-600 dark:text-slate-300">{t("summary.dueAmount")}</span>
          <span className="text-base font-semibold text-green-600 dark:text-green-400">{summary.dueAmount}</span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/50">
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t("summary.remainingAmount")}</span>
          <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{summary.remainingAmount}</span>
        </div>
      </div>
    </motion.div>
  );
}
