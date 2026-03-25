// app/[locale]/LayoutShell.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Header from "@/components/molecules/Header";
import Sidebar, { excludedSubcriptionPaths } from "@/components/molecules/Sidebar";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "../../context/SocketContext";
import { ThemeProvider } from "next-themes";
import { isPublicOrSpecialRoute } from "@/utils/route-utils";
import { PlatformSettingsProvider } from "@/context/PlatformSettingsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import SubscriptionLock from "@/components/atoms/SubscriptionLock";

export default function LayoutShell({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <PlatformSettingsProvider>
              <DashboardLayout>{children}</DashboardLayout>
            </PlatformSettingsProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const toastOptions = (isRTL) => ({
  style: {
    fontFamily: "var(--font)",
    fontSize: 13,
    borderRadius: 12,
    direction: isRTL ? "rtl" : "ltr",
    background: "var(--card)",
    color: "var(--card-foreground)",
    border: "1px solid var(--border)",
  },
  success: {
    style: {
      border:
        "1px solid color-mix(in oklab, var(--primary) 30%, var(--border))",
      color: "var(--primary)",
    },
    iconTheme: {
      primary: "var(--primary)",
      secondary: "var(--primary-foreground)",
    },
  },
  error: {
    style: {
      border:
        "1px solid color-mix(in oklab, var(--destructive) 30%, var(--border))",
      color: "var(--destructive)",
    },
    iconTheme: {
      primary: "var(--destructive)",
      secondary: "var(--destructive-foreground)",
    },
  },
});

function DashboardLayout({ children }) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const AllPathname = usePathname();
  const pathname = AllPathname?.slice(3, 1000);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ui_sidebar") === "expanded";
  });
  const { hasActiveSubscription, isSuperAdmin, isLoading, user } = useAuth();
  const isExcluded = excludedSubcriptionPaths.some(path => pathname.startsWith(path));

  const isLocked = !isSuperAdmin && !hasActiveSubscription && !isExcluded && !isLoading && user;
  useEffect(() => {
    localStorage.setItem(
      "ui_sidebar",
      isSidebarOpen ? "expanded" : "collapsed",
    );
    window.dispatchEvent(new Event("sidebarChangeBack"));
  }, [isSidebarOpen]);

  useEffect(() => {
    const handler = () => {
      const value = localStorage.getItem("ui_sidebar");
      setIsSidebarOpen(value === "expanded");
    };

    window.addEventListener("sidebarChange", handler);

    return () => {
      window.removeEventListener("sidebarChange", handler);
    };
  }, []);

  const isAuthRoute = isPublicOrSpecialRoute(AllPathname);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);
  const sidebarW = isSidebarOpen ? 260 : 68;

  const effectiveMargin = mounted ? sidebarW : 68;
  if (isAuthRoute || pathname === "") {
    return (
      <div>
        <Toaster position="top-center" toastOptions={toastOptions(isRTL)} />
        {children}
      </div>
    );
  }


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar — full height, z-above header ── */}
      <Sidebar
        isRTL={isRTL}
        onOpenSidebar={() => setIsSidebarOpen((v) => !v)}
        isOpen={isSidebarOpen}
      />

      <div
        className="relative flex flex-col flex-1 overflow-hidden"
        style={{
          marginRight: isRTL ? effectiveMargin : 0,
          marginLeft: isRTL ? 0 : effectiveMargin,
          // 4. تعطيل الحركة (transition) في التحميل الأول لتجنب "القفزة"
          transition: mounted ? "margin 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
        }}
      >
        <Header
          toggleSidebar={() => setIsSidebarOpen((v) => !v)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Scrollable page content */}
        <main className=" z-[10] flex-1 overflow-y-auto overflow-x-hidden relative  ">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ zIndex: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, color-mix(in oklab, var(--primary) 60%, transparent) 1.2px, transparent 1.2px)",
                backgroundSize: "24px 24px",
                opacity: 0.18,
              }}
            />
          </div>
          <div className="relative" style={{ zIndex: 1 }}>
            {isLocked ? <SubscriptionLock /> : children}
          </div>
        </main>
      </div>

      <Toaster
        position="top-center"
        toastOptions={toastOptions(isRTL)}
        containerStyle={{
          zIndex: 100001, // Header is 100000, so we go +1
        }}
      />
    </div>
  );
}
