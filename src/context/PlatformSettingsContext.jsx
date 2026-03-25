"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "@/utils/api";

const PlatformSettingsContext = createContext();

export function PlatformSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [company, setCompany] = useState(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);

  // 1. جلب إعدادات المنصة بشكل مستقل
  const fetchSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      const res = await api.get("/admin-settings");
      setSettings(res.data);
    } catch (error) {
      console.error("Failed to fetch platform settings:", error);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  // 2. جلب بيانات الشركة بشكل مستقل
  const fetchCompany = useCallback(async () => {
    setIsCompanyLoading(true);
    try {
      const res = await api.get("/users/company");
      setCompany(res.data);
    } catch (error) {
      console.error("Failed to fetch company data:", error);
    } finally {
      setIsCompanyLoading(false);
    }
  }, []);

  // تنفيذ الجلب عند التحميل الأولي
  useEffect(() => {
    fetchSettings();
    fetchCompany();
  }, [fetchSettings, fetchCompany]);

  // دالة لتحديث الكل
  const refreshAll = () => {
    fetchSettings();
    fetchCompany();
  };
  const currency = useMemo(() => {
    if (isCompanyLoading) return "";
    return company?.currency || "EGP";
  }, [company, isCompanyLoading]);

  const formatCurrency = useCallback((amount, defaultCurrency) => {
    if (amount === undefined || amount === null) return "—";

    const formatted = Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    // استخدام التريم (Trim) لضمان نظافة المخرجات
    return `${formatted} ${defaultCurrency || currency.trim()}`;
  }, [currency]);

  return (
    <PlatformSettingsContext.Provider
      value={{
        settings,
        company,
        currency,
        isSettingsLoading,
        formatCurrency,
        isCompanyLoading,
        isLoading: isSettingsLoading || isCompanyLoading, // حالة عامة إذا أردت
        refreshSettings: fetchSettings,
        refreshCompany: fetchCompany,
        refreshAll
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export const usePlatformSettings = () => {
  const context = useContext(PlatformSettingsContext);
  if (context === undefined) {
    throw new Error(
      "usePlatformSettings must be used within a PlatformSettingsProvider",
    );
  }
  return context;
};
