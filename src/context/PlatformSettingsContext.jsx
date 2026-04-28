"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "@/utils/api";
import { useAuth } from "./AuthContext";

const PlatformSettingsContext = createContext();

export function PlatformSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [company, setCompany] = useState(null);
  const { accessToken } = useAuth()
  const [shippingCompanies, setShippingCompanies] = useState([]);

  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [isShippingLoading, setIsShippingLoading] = useState(true);


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


  const fetchCompany = useCallback(async () => {
    if (!accessToken) return;
    setIsCompanyLoading(true);
    try {
      const res = await api.get("/users/company");
      setCompany(res.data);
    } catch (error) {
      console.error("Failed to fetch company data:", error);
    } finally {
      setIsCompanyLoading(false);
    }
  }, [accessToken]);


  const fetchShippingCompanies = useCallback(async () => {

    setIsShippingLoading(true);
    try {
      const res = await api.get("/shipping/integrations/active");


      const integrations = Array.isArray(res.data.integrations)
        ? res.data.integrations
        : Array.isArray(res.data)
          ? res.data
          : [];

      setShippingCompanies(integrations);
    } catch (error) {
      console.error("Shipping Lookup Error:", error);
    } finally {
      setIsShippingLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchSettings();
    fetchCompany();
    fetchShippingCompanies();
  }, [fetchSettings, fetchCompany, fetchShippingCompanies]);


  const refreshAll = useCallback(() => {
    fetchSettings();
    fetchCompany();
    fetchShippingCompanies();
  }, [fetchSettings, fetchCompany, fetchShippingCompanies]);


  const currency = useMemo(() => {
    if (isCompanyLoading) return "";
    return (company?.currency || "EGP").trim();
  }, [company, isCompanyLoading]);


  const formatCurrency = useCallback((amount, defaultCurrency) => {
    if (amount === undefined || amount === null) return "—";

    const formatted = Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return `${formatted} ${(defaultCurrency || currency).trim()}`;
  }, [currency]);

  return (
    <PlatformSettingsContext.Provider
      value={{
        settings,
        company,
        shippingCompanies,
        currency,
        isSettingsLoading,
        isCompanyLoading,
        isShippingLoading,
        isLoading: isSettingsLoading || isCompanyLoading || isShippingLoading,
        formatCurrency,
        refreshSettings: fetchSettings,
        refreshCompany: fetchCompany,
        refreshShipping: fetchShippingCompanies,
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
