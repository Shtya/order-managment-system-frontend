"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTheme } from "next-themes";
import {
	Menu, X, Bell, Moon, Sun, Package,
	Maximize2, Minimize2, Globe,
	LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getUser } from "@/hook/getUser";
import { cn } from "@/utils/cn";
import api from "@/utils/api";
import { getNotificationLink } from "@/app/[locale]/notifications/page";
import { useSocket } from "@/context/SocketContext";

// ─── Fullscreen hook ──────────────────────────────────────────────────────────
function useFullscreen() {
	const [isFullscreen, setIsFullscreen] = React.useState(false);
	useEffect(() => {
		const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);
	const toggle = async () => {
		if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
		else await document.exitFullscreen?.();
	};
	return { isFullscreen, toggle };
}

// ─── Icon button — tighter, 36×36 ────────────────────────────────────────────
function IconBtn({ children, onClick, label, className = "" }) {
	const [hov, setHov] = React.useState(false);
	return (
		<motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} className="relative">
			<AnimatePresence>
				{hov && (
					<motion.span
						initial={{ opacity: 0, scale: 0.75 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.75 }}
						className="absolute inset-0 rounded-xl bg-primary/10 blur-sm pointer-events-none"
					/>
				)}
			</AnimatePresence>
			<Button
				onClick={onClick}
				aria-label={label}
				title={label}
				onMouseEnter={() => setHov(true)}
				onMouseLeave={() => setHov(false)}
				className={cn(
					"relative h-8 w-8 p-0 rounded-xl border transition-all duration-200 overflow-hidden",
					"bg-card/80 backdrop-blur-sm",
					"border-border hover:border-primary/35",
					"text-muted-foreground hover:text-foreground",
					className
				)}
			>
				{hov && (
					<motion.span
						className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/12 to-transparent pointer-events-none"
						animate={{ x: ["-100%", "200%"] }}
						transition={{ duration: 0.55, ease: "easeOut" }}
					/>
				)}
				<span className="relative z-10 flex items-center justify-center">{children}</span>
			</Button>
		</motion.div>
	);
}

// ─── Notification dot ─────────────────────────────────────────────────────────
function PulseDot() {
	return (
		<span className="absolute top-1 right-1 flex h-[7px] w-[7px]">
			<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
			<span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-red-500" />
		</span>
	);
}

// ─── Header ───────────────────────────────────────────────────────────────────
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
	const [total, setTotal] = useState(0);
	const { unreadNotificationsCount, incrementUnread, decrementUnread, subscribe } = useSocket();

	const fetchNotifications = async () => {
		try {
			const res = await api.get('/notifications', { params: { page: 1, limit: 10 } });
			setTotal(res.data.total_records);
			setNotifications(res.data.records);
		} catch (err) { console.error(err); }
	};

	const hasMore = total > notifications.length;

	useEffect(() => { fetchNotifications(); }, []);

	useEffect(() => {
		const unsubscribe = subscribe("NEW_NOTIFICATION_HEADER", (action) => {
			if (action.type === "NEW_NOTIFICATION") {
				const n = action.payload;
				setNotifications(prev => prev.some(x => x.id === n.id) ? prev : [n, ...prev]);
				setTotal(prev => prev + 1);
			}
		});
		return unsubscribe;
	}, [subscribe]);

	const handleMarkAsRead = async (id) => {
		try {
			incrementUnread();
			await api.patch(`/notifications/${id}/read`);
			setNotifications(prev => prev.map(n => ({ ...n, isRead: n.id === id ? true : n.isRead })));
		} catch { decrementUnread(); }
	};

	const switchLocale = (next) => router.replace(pathname, { locale: next });

	return (
		<motion.header
			initial={{ y: -60, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
			className="h-14  flex-shrink-0 bg-white z-[10]  overflow-hidden relative"
		>
			{/* Glass background */}
			<div className="absolute inset-0 bg-[var(--sidebar)]  backdrop-blur-md border-b border-border/60" />



			<div className="relative h-full px-4 flex items-center justify-between gap-3">

				{/* ── LEFT: Toggle + Brand ── */}
				<div className={`flex items-center gap-2.5 ${isSidebarOpen && "opacity-0"} duration-300`}>

					<motion.div
						initial={{ opacity: 0, x: -12 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.12, duration: 0.35 }}
						className="flex items-center gap-2"
					>
						<div className="relative w-9 h-9 rounded-full overflow-hidden shadow-md shadow-primary/20 flex-shrink-0">
							<div className="absolute inset-0 bg-primary" />
							<motion.div
								className="absolute inset-0 bg-gradient-to-r from-transparent via-white/28 to-transparent skew-x-12"
								animate={{ x: ["-150%", "250%"] }}
								transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
							/>
							<div className="relative flex items-center justify-center h-full">
								<Package className="text-white" size={14} />
							</div>
						</div>

						<span className="text-[15px] font-bold tracking-tight
              bg-gradient-to-r from-foreground to-muted-foreground
              bg-clip-text text-transparent hidden sm:block">
							{t("brand")}
						</span>
					</motion.div>
				</div>

				{/* ── RIGHT: Actions ── */}
				<div className="flex items-center gap-1">
					{/* Language */}
					<LanguageToggle
						currentLang={locale}
						languages={{ ar: t("lang.ar"), en: t("lang.en") }}
						onToggle={() => switchLocale(locale === "ar" ? "en" : "ar")}
					/>
					{/* Fullscreen */}
					<IconBtn onClick={toggleFullscreen} label={t("fullscreen")}>
						<AnimatePresence mode="wait">
							<motion.span
								key={isFullscreen ? "min" : "max"}
								initial={{ scale: 0.5, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.5, opacity: 0 }}
								transition={{ duration: 0.15 }}
							>
								{isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
							</motion.span>
						</AnimatePresence>
					</IconBtn>

					{/* Theme */}
					<IconBtn onClick={() => setTheme(isDark ? "light" : "dark")} label={t("theme")}>
						<AnimatePresence mode="wait">
							<motion.span
								key={isDark ? "sun" : "moon"}
								initial={{ rotate: -160, scale: 0, opacity: 0 }}
								animate={{ rotate: 0, scale: 1, opacity: 1 }}
								exit={{ rotate: 160, scale: 0, opacity: 0 }}
								transition={{ duration: 0.25 }}
							>
								{isDark ? <Sun size={14} /> : <Moon size={14} />}
							</motion.span>
						</AnimatePresence>
					</IconBtn>



					{/* Notifications */}
					<Popover>
						<PopoverTrigger asChild>
							<motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} className="relative">
								<Button
									className="relative h-8 w-8 p-0 rounded-xl border overflow-hidden
                    bg-card/80 backdrop-blur-sm border-border
                    hover:border-primary/35 text-muted-foreground hover:text-foreground
                    transition-all duration-200"
									aria-label={t("notifications")}
								>
									<Bell size={14} />
									{unreadNotificationsCount > 0 && <PulseDot />}
								</Button>
							</motion.div>
						</PopoverTrigger>

						<PopoverContent align="end" className="w-72 p-0 overflow-hidden rounded-xl shadow-2xl border border-border/50">
							<div className="relative px-4 py-3 border-b border-border/50 overflow-hidden">
								<div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
								<motion.div
									className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent"
									animate={{ x: ["-100%", "200%"] }}
									transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
								/>
								<div className="relative flex items-center justify-between">
									<p className="text-[13px] font-semibold">{t("notificationsTitle")}</p>
									{unreadNotificationsCount > 0 && (
										<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
											style={{ background: "var(--primary)" }}>
											{unreadNotificationsCount}
										</span>
									)}
								</div>
								<p className="text-[11px] text-muted-foreground mt-0.5 relative">{t("notificationsSubtitle")}</p>
							</div>

							<div className="max-h-64 overflow-auto divide-y divide-border/30">
								{notifications.length === 0 ? (
									<div className="py-8 text-center">
										<Bell size={22} className="mx-auto mb-2 text-muted-foreground/40" />
										<p className="text-xs text-muted-foreground">لا توجد إشعارات</p>
									</div>
								) : notifications.map((n, idx) => (
									<motion.div
										key={idx}
										initial={{ opacity: 0, x: -8 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: idx * 0.05 }}
										onClick={() => {
											handleMarkAsRead(n.id);
											router.push(getNotificationLink(n.relatedEntityType, n.relatedEntityId));
										}}
										className={cn(
											"px-4 py-2.5 hover:bg-accent/40 transition-colors duration-150 cursor-pointer relative",
											!n.isRead && "bg-primary/[0.03]"
										)}
									>
										{!n.isRead && (
											<span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
												style={{ background: "linear-gradient(180deg, var(--primary), var(--third))" }} />
										)}
										<div className="flex items-start justify-between gap-2 pl-1">
											<div className="space-y-0.5 min-w-0">
												<p className="text-[12.5px] font-medium leading-snug truncate">{n.title}</p>
												<p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
											</div>
											<span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 flex-shrink-0">
												{new Date(n.createdAt).toLocaleDateString()}
											</span>
										</div>
									</motion.div>
								))}
							</div>

							<div className="p-1.5 sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50">
								<Button
									variant="ghost"
									className="w-full text-[11.5px] font-semibold text-primary hover:bg-primary/6 h-8 rounded-lg"
									onClick={() => router.push('/notifications')}
								>
									{hasMore ? t('readMore') : t('viewAll')}
								</Button>
							</div>
						</PopoverContent>
					</Popover>

					{/* Divider */}
					<div className="w-px h-5 bg-border/70 mx-0.5" /> 
					<LogoutButton /> 
				</div>
			</div>
		</motion.header>
	);
}

// ─── Profile Chip ─────────────────────────────────────────────────────────────
function ProfileChip({ user, t }) {
	const [hov, setHov] = React.useState(false);
	const initial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();

	return (
		<motion.div
			whileHover={{ scale: 1.02 }}
			onMouseEnter={() => setHov(true)}
			onMouseLeave={() => setHov(false)}
			className="relative  flex items-center  gap-2 w-fit px-3 py-1 rounded-md cursor-pointer
        border border-border hover:border-primary/30
        bg-card/80 backdrop-blur-sm
        transition-all duration-200 overflow-hidden"
		>
			<AnimatePresence>
				{hov && (
					<motion.span
						initial={{ x: "-100%" }}
						animate={{ x: "200%" }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent skew-x-12 pointer-events-none"
					/>
				)}
			</AnimatePresence>

			{/* Avatar */}
			<div className="relative w-6 h-6 rounded-lg overflow-hidden flex-shrink-0">
				<div className="absolute inset-0 bg-primary" />
				<motion.div
					className="absolute inset-0 bg-gradient-to-r from-transparent via-white/22 to-transparent skew-x-12"
					animate={{ x: ["-150%", "250%"] }}
					transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
				/>
				<div className="relative flex items-center justify-center h-full text-white font-bold text-[10px]">
					{initial}
				</div>
			</div>

			{/* Info */}
			<div className="flex flex-col min-w-0 max-w-[110px] hidden sm:flex">
				<span className="text-[10.5px] font-semibold text-foreground truncate leading-tight">
					{user?.name || user?.email || t("profile.noEmail")}
				</span>
				<span className="text-[8.5px] font-bold px-1 py-px rounded-full w-fit mt-px
          bg-primary/10 text-primary border border-primary/15">
					{t(`roles.${user?.role || "user"}`)}
				</span>
			</div>
		</motion.div>
	);
}

// ─── Add this component anywhere in the file ─────────────────
function LogoutButton() {
  const router = useRouter();
  const [hov, setHov] = React.useState(false);

  const handleLogout = () => {
    try { ['accessToken', 'refreshToken', 'user'].forEach(k => localStorage.removeItem(k)); } catch {}
    router.replace('/auth');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={handleLogout}
      className="relative h-8 w-8 p-0 rounded-xl border overflow-hidden flex items-center justify-center
        bg-card/80 backdrop-blur-sm transition-all duration-200"
      style={{
        borderColor: hov
          ? "color-mix(in oklab, var(--destructive) 45%, var(--border))"
          : "color-mix(in oklab, var(--destructive) 20%, var(--border))",
        background: hov
          ? "color-mix(in oklab, var(--destructive) 8%, var(--card))"
          : undefined,
      }}
    >
      {hov && (
        <motion.span
          className="absolute inset-0 pointer-events-none"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--destructive) 15%, transparent), transparent)",
            transform: "skewX(-12deg)",
          }}
        />
      )}
      <motion.span animate={{ rotate: hov ? -20 : 0 }} transition={{ duration: 0.2 }} className="relative z-10">
        <LogOut size={13} style={{ color: "var(--destructive)" }} strokeWidth={2.1} />
      </motion.span>
    </motion.button>
  );
}

// ─── Language Toggle ──────────────────────────────────────────────────────────
function LanguageToggle({ currentLang, onToggle, languages = { ar: "AR", en: "EN" } }) {
	const [hov, setHov] = React.useState(false);
	const otherLang = useMemo(() => {
		const keys = Object.keys(languages);
		return keys.find(l => l !== currentLang) || keys[0];
	}, [languages, currentLang]);

	return (
		<motion.button
			type="button"
			onClick={onToggle}
			aria-label="Toggle language"
			whileTap={{ scale: 0.92 }}
			onMouseEnter={() => setHov(true)}
			onMouseLeave={() => setHov(false)}
			className="relative flex items-center gap-1.5 h-8 px-2.5 rounded-xl overflow-hidden
        border border-border hover:border-primary/35
        bg-card/80 backdrop-blur-sm
        text-muted-foreground hover:text-foreground
        transition-all duration-200"
		>
			<AnimatePresence>
				{hov && (
					<motion.span
						initial={{ x: "-100%" }}
						animate={{ x: "250%" }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5, ease: "easeOut" }}
						className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/12 to-transparent skew-x-12 pointer-events-none"
					/>
				)}
			</AnimatePresence>

			<motion.div animate={{ rotate: hov ? 180 : 0 }} transition={{ duration: 0.4 }}>
				<Globe size={13} className="text-muted-foreground" />
			</motion.div>

			<span className="w-px h-3.5 bg-border/80" />

			<AnimatePresence mode="wait">
				<motion.span
					key={otherLang}
					initial={{ y: 6, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -6, opacity: 0 }}
					transition={{ duration: 0.15 }}
					className="text-[11px] font-bold uppercase tracking-wide"
				>
					{otherLang}
				</motion.span>
			</AnimatePresence>
		</motion.button>
	);
}