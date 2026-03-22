"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/utils/api";

// 1. Create the Context
const PlatformSettingsContext = createContext();

// 2. Create the Provider Component
export function PlatformSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/admin-settings");
        setSettings(res.data);
      } catch (error) {
        console.error("Failed to fetch platform settings:", error);
        // Optionally set fallback defaults here if the API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Expose a refresh function in case you need to re-fetch after a Super Admin updates them
  const refreshSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin-settings");
      setSettings(res.data);
    } catch (error) {
      console.error("Failed to refresh platform settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PlatformSettingsContext.Provider
      value={{ settings, isLoading, refreshSettings }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}

// 3. Create a Custom Hook for easy access
export const usePlatformSettings = () => {
  const context = useContext(PlatformSettingsContext);
  if (context === undefined) {
    throw new Error(
      "usePlatformSettings must be used within a PlatformSettingsProvider",
    );
  }
  return context;
};
