"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTheme } from "next-themes";
import {
  Menu, X, Bell, Moon, Sun, Package,
  Maximize2, Minimize2, Globe, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getUser } from "@/hook/getUser";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import { getNotificationLink } from "@/app/[locale]/notifications/page";


// ─── Fullscreen hook ──────────────────────────────────────────────────────────
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };
  return { isFullscreen, toggle };
}

// ─── Shimmer bar (decorative bottom edge of header) ──────────────────────────
function ShimmerBar() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
      {/* Static gradient base */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {/* Travelling shimmer */}
      <motion.div
        className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{ x: ["-100%", "400%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
      />
    </div>
  );
}

// ─── Icon button wrapper with shimmer glow on hover ───────────────────────────
function IconBtn({ children, onClick, label, className = "" }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <motion.div
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.93 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative"
    >
      {/* Glow ring on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-lg bg-primary/10 blur-sm pointer-events-none"
          />
        )}
      </AnimatePresence>
      <Button
        onClick={onClick}
        aria-label={label}
        title={label}
        className={cn(
          "relative h-10 w-10 p-0 rounded-lg border transition-all duration-300 overflow-hidden",
          "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
          "border-slate-200 dark:border-slate-700",
          "hover:border-primary/40 dark:hover:border-primary/40",
          "text-slate-700 dark:text-slate-200",
          className
        )}
      >
        {/* Inner shimmer sweep on hover */}
        {hovered && (
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent pointer-events-none"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </Button>
    </motion.div>
  );
}

// ─── Notification dot ─────────────────────────────────────────────────────────
function PulseDot() {
  return (
    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export default function Header({ toggleSidebar, isSidebarOpen }) {
  const t = useTranslations("header");
  const user = getUser();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState([]);
  const [unreadCount, setUnreadCount] = useState(2);

  // 2. Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications', { params: { page: 1, limit: 10 } })
      setTotal(res.data.total_records);
      setNotifications(res.data.records);
    } catch (err) {
      console.error(err);
    }
  };
  const hasMore = total > notifications.length;
  useEffect(() => { fetchNotifications(); }, []);

  // 3. Action Handlers
  const handleMarkAsRead = async (id) => {
    try {

      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: n.id === id ? true : n.isRead })))
    } catch (e) {

    }
  };

  const handleMarkAllRead = async () => {
    await api.post('/notifications/read-all');
    fetchNotifications();
  };
  const switchLocale = (next) => router.replace(pathname, { locale: next });

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 right-0 left-0 h-16 z-40 overflow-hidden"
    >
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl" />

      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200/80 dark:bg-slate-700/60" />

      <ShimmerBar />

      <div className="relative h-full px-4 sm:px-6 flex items-center justify-between">

        {/* ── LEFT: Toggle + Brand ── */}
        <div className="flex items-center gap-3">

          {/* Sidebar toggle */}
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <Button
              onClick={toggleSidebar}
              className="relative h-10 w-10 p-0 rounded-lg border overflow-hidden
                bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
                border-slate-200 dark:border-slate-700
                hover:border-primary/40 text-slate-700 dark:text-slate-200
                transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isSidebarOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </motion.span>
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex items-center gap-2.5"
          >
            {/* Logo icon with shimmer */}
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-lg shadow-primary/20">
              <div className="absolute inset-0 bg-primary" />
              {/* Sweep shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                animate={{ x: ["-150%", "250%"] }}
                transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
              />
              <div className="relative flex items-center justify-center h-full">
                <Package className="text-white" size={18} />
              </div>
            </div>

            <span className="text-[17px] font-bold tracking-tight
              bg-gradient-to-r from-slate-800 to-slate-600
              dark:from-white dark:to-slate-300
              bg-clip-text text-transparent">
              {t("brand")}
            </span>
          </motion.div>
        </div >

        {/* ── RIGHT: Actions ── */}
        < div className="flex items-center gap-1.5" >

          {/* Fullscreen */}
          < IconBtn onClick={toggleFullscreen} label={t("fullscreen")} >
            <AnimatePresence mode="wait">
              <motion.span
                key={isFullscreen ? "min" : "max"}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </motion.span>
            </AnimatePresence>
          </IconBtn >

          {/* Theme toggle */}
          < IconBtn
            onClick={() => setTheme(isDark ? "light" : "dark")
            }
            label={t("theme")}
            className={" "}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isDark ? "sun" : "moon"}
                initial={{ rotate: -180, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 180, scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </motion.span>
            </AnimatePresence>
          </IconBtn >

          {/* Language toggle */}
          < LanguageToggle
            currentLang={locale}
            languages={{ ar: t("lang.ar"), en: t("lang.en") }}
            onToggle={() => switchLocale(locale === "ar" ? "en" : "ar")}
          />

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} className="relative">
                <Button
                  className="relative h-10 w-10 p-0 rounded-lg border overflow-hidden
                    bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
                    border-slate-200 dark:border-slate-700
                    hover:border-primary/40 text-slate-700 dark:text-slate-200
                    transition-all duration-300"
                  aria-label={t("notifications")}
                >
                  <Bell size={17} />
                  {unreadCount > 0 && <PulseDot />}
                </Button>
              </motion.div>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-0 overflow-hidden rounded-lg shadow-2xl border border-border/50">
              {/* Popover header with shimmer */}
              <div className="relative px-4 py-3 border-b border-border/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                />
                <div className="relative">
                  <p className="text-sm font-semibold">{t("notificationsTitle")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("notificationsSubtitle")}</p>
                </div>
              </div>

              <div className="max-h-72 overflow-auto divide-y divide-border/30">
                {notifications.map((n, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => {
                      handleMarkAsRead(n.id);
                      router.push(getNotificationLink(n.relatedEntityType, n.relatedEntityId));
                    }}
                    className={cn(
                      "px-4 py-3 hover:bg-accent/50 transition-colors duration-200 cursor-pointer relative",
                      !n.isRead && "bg-primary/3"
                    )}
                  >
                    {!n.isRead && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-primary to-secondary" />
                    )}
                    <div className="flex items-start justify-between gap-3 pl-1">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-snug">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}

                <div className="p-2 sticky bottom-0 bg-background border-t">
                  <Button
                    variant="ghost"
                    className="w-full text-xs font-bold text-primary hover:bg-primary/5"
                    onClick={() => router.push('/notifications')}
                  >
                    {hasMore ? t('readMore') : t('viewAll')}
                  </Button>
                </div>
              </div>
            </PopoverContent >
          </Popover >

          {/* Profile */}
          < ProfileChip user={user} t={t} />

        </div>
      </div>
    </motion.header>
  );
}

// ─── Profile Chip ─────────────────────────────────────────────────────────────
function ProfileChip({ user, t }) {
  const [hovered, setHovered] = React.useState(false);
  const initial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer
        border border-slate-200 dark:border-slate-700
        hover:border-primary/30 dark:hover:border-primary/30
        bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
        transition-all duration-300 overflow-hidden"
    >
      {/* Shimmer sweep on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-12 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div className="relative w-7 h-7 rounded-md overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-primary" />
        {/* Avatar shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
          animate={{ x: ["-150%", "250%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        />
        <div className="relative flex items-center justify-center h-full text-white font-bold text-xs">
          {initial}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 max-w-[130px]">
        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">
          {user?.email || t("profile.noEmail")}
        </span>
        <span className="text-[7px] font-bold px-1.5 py-px rounded-full w-fit mt-px
          bg-primary/10 text-primary border border-primary/20">
          {t(`roles.${user?.role || "user"}`)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Language Toggle ──────────────────────────────────────────────────────────
function LanguageToggle({ currentLang, onToggle, languages = { ar: "AR", en: "EN" } }) {
  const [hovered, setHovered] = React.useState(false);

  const otherLang = useMemo(() => {
    const keys = Object.keys(languages);
    return keys.find((l) => l !== currentLang) || keys[0];
  }, [languages, currentLang]);

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label="Toggle language"
      whileTap={{ scale: 0.93 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-2 h-10 px-3 rounded-lg overflow-hidden
        border border-slate-200 dark:border-slate-700
        hover:border-primary/40 dark:hover:border-primary/40
        bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
        text-slate-700 dark:text-slate-200
        transition-all duration-300"
    >
      {/* Shimmer sweep */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ x: "-100%" }}
            animate={{ x: "250%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent skew-x-12 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Globe */}
      <motion.div
        animate={{ rotate: hovered ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        <Globe size={15} className="text-slate-500 dark:text-slate-400" />
      </motion.div>

      {/* Divider */}
      <span className="w-px h-4 bg-slate-200 dark:bg-slate-600" />

      {/* Label flips between current → other */}
      <AnimatePresence mode="wait">
        <motion.span
          key={otherLang}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200"
        >
          {otherLang}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}