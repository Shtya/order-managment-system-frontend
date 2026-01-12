'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, X, User, Mail, Phone, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import Button_ from '@/components/atoms/Button';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/utils/cn';
import { Package } from 'lucide-react';

import { useLocale, useTranslations } from 'next-intl';

export default function AddEmployeePage() {
  const navigate = useRouter();

  const locale = useLocale();
  const isRTL = locale === 'ar';
  const t = useTranslations('addEmployee');

  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: '',
    role: '',
  });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Form data:', formData);
    // Add your submit logic here
  };

  return (
    <motion.div
      dir={isRTL ? 'rtl' : 'ltr'}
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
              onClick={() => navigate.push('/employees')}
              className="text-gray-400 hover:text-primary transition-colors"
            >
              {t('breadcrumb.employees')}
            </button>
            <ChevronLeft className="text-gray-400" size={18} />
            <span className="text-primary">{t('breadcrumb.addEmployee')}</span>
            <span className="mr-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button_
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
              onClick={() => console.log('how to use')}
            />

            <Button_
              onClick={handleSubmit}
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
        {/* Right Column - Form Fields */}
        <div className="flex-1 space-y-6">
          {/* Role Selection Tabs */}
          <motion.div
            className="bg-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
              {t('sections.employeeType')}
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'data_entry', label: t('roles.dataEntry'), icon: User },
                { id: 'warehouse', label: t('roles.warehouse'), icon: Package },
                { id: 'customer_service', label: t('roles.customerService'), icon: Phone },
              ].map((role, idx) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  onClick={() => handleInputChange('role', role.id)}
                  className={cn(
                    'relative p-4 rounded-2xl border-2 transition-all duration-300',
                    'flex flex-col items-center gap-3 group',
                    formData.role === role.id
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-primary/50 bg-white/50 dark:bg-slate-900/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                      formData.role === role.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                    )}
                  >
                    <role.icon size={24} />
                  </div>

                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      formData.role === role.id
                        ? 'text-primary'
                        : 'text-gray-600 dark:text-slate-300 group-hover:text-primary'
                    )}
                  >
                    {role.label}
                  </span>

                  {formData.role === role.id && (
                    <motion.div
                      layoutId="roleIndicator"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M11.6667 3.5L5.25 9.91667L2.33333 7"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Employee Information */}
          <motion.div
            className="bg-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">
              {t('sections.employeeInfo')}
            </h3>

            <div className="space-y-5 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {t('fields.name')}
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('placeholders.name')}
                  className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  {t('fields.email')}
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('placeholders.email')}
                  className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  {t('fields.phone')}
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('placeholders.phone')}
                  className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                />
              </div>

              {/* Join Date */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  {t('fields.joinDate')}
                </Label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => handleInputChange('joinDate', e.target.value)}
                  className="rounded-full h-[45px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Left Column - Profile Image Upload */}
        <div className="w-full max-w-[400px]">
          <ProfileImageUpload
            t={t}
            image={profileImage}
            onImageChange={handleImageUpload}
            onRemove={() => setProfileImage(null)}
            isRTL={isRTL}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ProfileImageUpload({ image, onImageChange, onRemove, t, isRTL }) {
  const inputRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } };
      onImageChange(fakeEvent);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4 text-right">
        {t('sections.employeeImage')}
      </h3>

      {/* Upload Area */}
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
          'rounded-2xl border-2 border-dashed transition-all duration-300',
          isDragging ? 'border-primary bg-primary/5' : 'border-primary/60 bg-white/40 dark:bg-slate-900/20'
        )}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />

        {!image ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={40} className="text-primary" />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('upload.dragHere')}</p>
                <p className="text-sm text-slate-400">{t('upload.clickToChoose')}</p>

                <div className="flex items-center justify-center gap-3 text-sm text-slate-400 pt-2">
                  <span className="h-px w-16 bg-slate-200 dark:bg-slate-700" />
                  <span>{t('common.or')}</span>
                  <span className="h-px w-16 bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-full px-8 border-primary/60 text-primary hover:bg-primary/10"
                onClick={() => inputRef.current?.click()}
              >
                {t('upload.chooseImage')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative p-4">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={image} alt={t('upload.imageAlt')} className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <motion.button
              type="button"
              onClick={onRemove}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-6 left-6 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              aria-label={t('upload.remove')}
            >
              <X size={20} />
            </motion.button>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4 rounded-full border-primary/60 text-primary hover:bg-primary/10"
              onClick={() => inputRef.current?.click()}
            >
              {t('upload.changeImage')}
            </Button>
          </div>
        )}
      </div>

      {/* Image Requirements */}
      <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
        <p className="text-sm text-blue-800 dark:text-blue-300 text-right">
          <strong>{t('note.title')}</strong> {t('note.text')}
        </p>
      </div>
    </motion.div>
  );
}
