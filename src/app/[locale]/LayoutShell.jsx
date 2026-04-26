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
import { isPublicRoute } from "@/utils/route-utils";
import { PlatformSettingsProvider } from "@/context/PlatformSettingsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import SubscriptionLock from "@/components/atoms/SubscriptionLock";
import { useAuthInterceptor } from "@/hook/useAuthInterceptor";
import { motion, AnimatePresence } from "framer-motion";
import "flatpickr/dist/flatpickr.min.css";
import { OrdersSettingsProvider } from "@/hook/useOrdersSettings";

export default function LayoutShell({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <OrdersSettingsProvider>
          <AuthInterceptorWrapper>
            <SocketProvider>
              <NotificationProvider>
                <PlatformSettingsProvider>
                  <DashboardLayout>{children}</DashboardLayout>
                </PlatformSettingsProvider>
              </NotificationProvider>
            </SocketProvider>
          </AuthInterceptorWrapper>
        </OrdersSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthInterceptorWrapper({ children }) {
  useAuthInterceptor(); // ✅ now inside AuthProvider
  return children;
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


const pathsWitohutLayout = ["/onboarding"];
function DashboardLayout({ children }) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const AllPathname = usePathname();
  const pathname = AllPathname?.slice(3, 1000);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ui_sidebar") === "expanded";
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [AllPathname, isMobile]);

  const { hasActiveSubscription, isSuperAdmin, isLoading, user } = useAuth();
  const isExcluded = excludedSubcriptionPaths.some(path => pathname.startsWith(path));
  const isPublic = isPublicRoute(AllPathname);

  const isLocked = !isSuperAdmin && !hasActiveSubscription && !isExcluded && !isPublic && !isLoading && user;

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(
        "ui_sidebar",
        isSidebarOpen ? "expanded" : "collapsed",
      );
    }
    window.dispatchEvent(new Event("sidebarChangeBack"));
  }, [isSidebarOpen, isMobile]);

  useEffect(() => {
    const handler = () => {
      const value = localStorage.getItem("ui_sidebar");
      if (!isMobile) {
        setIsSidebarOpen(value === "expanded");
      }
    };

    window.addEventListener("sidebarChange", handler);

    return () => {
      window.removeEventListener("sidebarChange", handler);
    };
  }, [isMobile]);

  const isPathWithoutLayout = pathsWitohutLayout.some((path) => pathname.startsWith(path));
  const isAuthRoute = isPublicRoute(AllPathname);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);
  const sidebarW = isSidebarOpen ? 260 : 68;

  const effectiveMargin = mounted ? (isMobile ? 0 : sidebarW) : (isMobile ? 0 : 68);
  if (isAuthRoute || isPathWithoutLayout || pathname === "") {
    return (
      <div>
        <Toaster position="top-center" toastOptions={toastOptions(isRTL)} />
        {children}
      </div>
    );
  }


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar — full height, z-above header ── */}
      <Sidebar
        isRTL={isRTL}
        onOpenSidebar={() => setIsSidebarOpen((v) => !v)}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
      />

      <div
        className="relative flex flex-col flex-1 overflow-hidden"
        style={{
          marginRight: isRTL ? effectiveMargin : 0,
          marginLeft: isRTL ? 0 : effectiveMargin,
          transition: mounted ? "margin 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
        }}
      >
        <Header
          toggleSidebar={() => setIsSidebarOpen((v) => !v)}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
        />

        {/* Scrollable page content */}
        <main className=" z-[10] flex-1 overflow-y-auto overflow-x-hidden relative ">
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
          <div className="relative min-h-full flex flex-col" style={{ zIndex: 1 }}>
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
