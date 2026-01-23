// components/molecules/Header.jsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTheme } from 'next-themes';

import { Menu, X, Bell, Moon, Sun, Package, Maximize2, Minimize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LanguageToggle from '../atoms/LanguageToggle';
import { getUser } from '@/hook/getUser';

function useFullscreen() {
	const [isFullscreen, setIsFullscreen] = React.useState(false);

	React.useEffect(() => {
		const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
		document.addEventListener('fullscreenchange', onChange);
		return () => document.removeEventListener('fullscreenchange', onChange);
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

export default function Header({ toggleSidebar, isSidebarOpen }) {
	const t = useTranslations('header');
	const user = getUser();

	const locale = useLocale();
	const pathname = usePathname();
	const router = useRouter();

	const { theme, setTheme } = useTheme();
	const isDark = theme === 'dark';

	const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

	const notifications = useMemo(
		() => [
			{ title: t('notif.newOrder.title'), desc: t('notif.newOrder.desc'), time: t('notif.newOrder.time') },
			{ title: t('notif.stockAlert.title'), desc: t('notif.stockAlert.desc'), time: t('notif.stockAlert.time') },
			{ title: t('notif.shippingUpdate.title'), desc: t('notif.shippingUpdate.desc'), time: t('notif.shippingUpdate.time') }
		],
		[t]
	);

	const unreadCount = 2;

	const switchLocale = (nextLocale) => {
		router.replace(pathname, { locale: nextLocale });
	};

	return (
		<motion.header
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			className="
        fixed top-0 right-0 left-0 h-16 z-40 shadow-xl border-b
        bg-gradient-to-r
        dark:from-slate-900 dark:to-slate-800 dark:border-slate-700
        from-slate-100 to-slate-50 border-slate-200
      "
		>
			<div className="h-full px-6 flex items-center justify-between">
				{/* Right Side - Logo & Menu */}
				<div className="flex items-center gap-4">
					<motion.div whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }}>
						<Button
							onClick={toggleSidebar}
							className="
                p-2 border border-gray-200 dark:border-slate-700 rounded-md transition-colors h-10 w-10
                dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white
                bg-white hover:bg-slate-100 text-slate-900
              "
						>
							{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
						</Button>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-3"
					>
						<div className="w-10 h-10 rounded-xl bg-primary1 flex items-center justify-center shadow-lg">
							<Package className="text-white" size={24} />
						</div>
						<span className="text-xl font-bold dark:text-white text-slate-900">
							{t('brand')}
						</span>
					</motion.div>
				</div>

				{/* Left Side - Actions & Profile */}
				<div className="flex items-center gap-2">
					{/* Fullscreen */}
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
						<Button
							onClick={toggleFullscreen}
							className="
                p-2 rounded-md border border-gray-200 dark:border-slate-700 transition-colors h-10 w-10
                dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white
                bg-white hover:bg-slate-100 text-slate-900
              "
							aria-label={t('fullscreen')}
							title={t('fullscreen')}
						>
							{isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
						</Button>
					</motion.div>

					{/* Dark / Light */}
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
						<Button
							onClick={() => setTheme(isDark ? 'light' : 'dark')}
							className="
                p-2 rounded-md border border-gray-200 dark:border-slate-700 transition-colors h-10 w-10
                dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400
                bg-white hover:bg-slate-100 text-amber-600
              "
							aria-label={t('theme')}
							title={t('theme')}
						>
							{isDark ? <Sun size={20} /> : <Moon size={20} />}
						</Button>
					</motion.div>

					{/* Locale toggle (pretty) */}
					<LanguageToggle
						isFixed={false}
						currentLang={locale}
						languages={{ ar: t('lang.ar'), en: t('lang.en') }}
						isDark={isDark}
						onToggle={() => switchLocale(locale === 'ar' ? 'en' : 'ar')}
						className="h-10 px-3 rounded-md !py-2"
					/>

					{/* Notifications Popover */}
					<Popover>
						<PopoverTrigger asChild>
							<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
								<Button
									className="
                    p-2 border border-gray-200 dark:border-slate-700 rounded-md relative transition-colors h-10 w-10
                    dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white
                    bg-white hover:bg-slate-100 text-slate-900
                  "
									aria-label={t('notifications')}
									title={t('notifications')}
								>
									<Bell size={20} />
									{unreadCount > 0 && (
										<span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
									)}
								</Button>
							</motion.div>
						</PopoverTrigger>

						<PopoverContent align="end" className="w-80 p-0">
							<div className="p-4">
								<div className="text-sm font-semibold">{t('notificationsTitle')}</div>
								<div className="text-xs text-muted-foreground">{t('notificationsSubtitle')}</div>
							</div>

							<div className="max-h-72 overflow-auto">
								{notifications.map((n, idx) => (
									<div key={idx} className="px-4 py-3 hover:bg-muted/50">
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<div className="text-sm font-medium">{n.title}</div>
												<div className="text-xs text-muted-foreground">{n.desc}</div>
											</div>
											<div className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</div>
										</div>
									</div>
								))}
							</div>
						</PopoverContent>
					</Popover>

					{/* Profile */}
					<motion.div
						whileHover={{ scale: 1.05 }}
						className="
    flex items-center gap-2 px-3 py-[5px] rounded-md cursor-pointer
    dark:bg-slate-800 bg-white border border-gray-200 dark:border-slate-700
  "
					>
						<div className=" rtl:order-[2] w-7 h-7 rounded-lg bg-primary1 flex items-center justify-center text-white font-bold">
							{(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
						</div>

						<div className=" flex items-center gap-2 min-w-[120px]">

							<div className="text-[14px] rtl:order-[1] font-[600] font-[Inter]  dark:text-slate-400 text-slate-500  truncate">
								{user?.email || t("profile.noEmail")}
							</div>

							<div className="mt-0.5 inline-flex w-fit px-2 py-[1px] rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20"
							>
								{t(`roles.${user?.role || "user"}`)}
							</div>
						</div>
					</motion.div>

				</div>
			</div>
		</motion.header>
	);
}
