'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	Users,
	CreditCard,
	BarChart3,
	FileText,
	Settings,
	LogOut,
	User,
	Plug,
	UserCog,
	RotateCcw,
	Factory,
	Truck,
} from 'lucide-react';
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Sidebar({ isOpen, isRTL, onLogout }) {
	const pathnameRouter = usePathname();
	const pathname = pathnameRouter?.slice(3, 1000);
	const t = useTranslations('sidebar');

	const menuItems = [
		// 1️⃣ Dashboard
		{
			icon: LayoutDashboard,
			labelKey: 'dashboard',
			href: '/dashboard',
			badge: null,
		},

		// 2️⃣ Core Operations
		{
			icon: ShoppingCart,
			labelKey: 'orders',
			href: '/orders',
			badge: '12',
		},
		{
			icon: Package,
			labelKey: 'products',
			href: '/products',
			badge: '45',
		},

		// 3️⃣ Fulfillment & Supply
		{
			icon: Truck,
			labelKey: 'shipping-companies',
			href: '/shipping-companies',
			badge: null,
		},
		{
			icon: Factory,
			labelKey: 'suppliers',
			href: '/suppliers',
			badge: null,
		},
		{
			icon: FileText,
			labelKey: 'purchases',
			href: '/purchases',
			badge: null,
		},
		{
			icon: RotateCcw,
			labelKey: 'purchases-return',
			href: '/purchases-return',
			badge: null,
		},

		// 4️⃣ People
		{
			icon: UserCog,
			labelKey: 'employees',
			href: '/employees',
			badge: null,
		},

		// 5️⃣ Finance
		{
			icon: CreditCard,
			labelKey: 'accounts',
			href: '/accounts',
			badge: null,
		},

		// 6️⃣ Analytics
		{
			icon: BarChart3,
			labelKey: 'reports',
			href: '/reports',
			badge: null,
		},

		// 7️⃣ Integrations
		{
			icon: Plug,
			labelKey: 'store-integration',
			href: '/store-integration',
			badge: null,
		},

		// 8️⃣ Settings (always last)
		{
			icon: Settings,
			labelKey: 'settings',
			href: '/settings',
			badge: null,
		},
	];

	// active by matching current path (supports nested routes)
	const isActive = (href) => {
		if (href === '/') return pathname === '/';
		return pathname === href || pathname?.startsWith(href + '/');
	};

	const sidebarVariants = {
		open: {
			width: '280px',
			transition: { type: 'spring', stiffness: 300, damping: 30 },
		},
		closed: {
			width: '80px',
			transition: { type: 'spring', stiffness: 300, damping: 30 },
		},
	};

	const itemVariants = {
		open: {
			opacity: 1,
			x: 0,
			transition: { type: 'spring', stiffness: 300, damping: 30 },
		},
		closed: { opacity: 0, x: 20, transition: { duration: 0.2 } },
	};

	const MenuItem = ({ item, index, active }) => {
		const menuItemContent = (
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: index * 0.05 }}
				whileHover={{ scale: 1.03, x: isRTL ? 3 : -3 }}
				whileTap={{ scale: 0.97 }}
				className="w-full relative group"
			>
				<Link
					href={item.href}
					className={`
						w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200
						relative overflow-hidden
						${
							active
								? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30'
								: 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md'
						}
					`}
				>
					{/* Active indicator line */}
					{active && (
						<motion.div
							layoutId="activeIndicator"
							className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-1 bg-white rounded-r-full`}
							initial={false}
							transition={{ type: 'spring', stiffness: 500, damping: 30 }}
						/>
					)}

					{/* Icon with background on hover */}
					<div
						className={`
							relative z-10 flex items-center justify-center
							transition-all duration-200
							${
								active
									? 'text-white'
									: 'text-slate-600 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary'
							}
						`}
					>
						<item.icon size={22} strokeWidth={active ? 2.5 : 2} />
					</div>

					<AnimatePresence>
						{isOpen && (
							<motion.div
								variants={itemVariants}
								initial="closed"
								animate="open"
								exit="closed"
								className="flex-1 flex items-center justify-between relative z-10"
							>
								<span className={`font-medium text-sm ${active ? 'font-semibold' : ''}`}>
									{t(item.labelKey)}
								</span>

								{item.badge && (
									<motion.span
										initial={{ scale: 0, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										exit={{ scale: 0, opacity: 0 }}
										transition={{ type: 'spring', stiffness: 500, damping: 25 }}
										className={`
											px-2.5 py-1 rounded-lg text-xs font-bold
											${
												active
													? 'bg-white/20 text-white backdrop-blur-sm'
													: 'bg-red-500 text-white shadow-lg shadow-red-500/30'
											}
										`}
									>
										{item.badge}
									</motion.span>
								)}
							</motion.div>
						)}
					</AnimatePresence>

					{/* Hover effect overlay */}
					{!active && (
						<motion.div
							className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
							initial={false}
						/>
					)}
				</Link>
			</motion.div>
		);

		// Wrap with tooltip when sidebar is closed
		if (!isOpen) {
			return (
				<TooltipProvider delayDuration={100}>
					<Tooltip>
						<TooltipTrigger asChild>{menuItemContent}</TooltipTrigger>
						<TooltipContent
							side={isRTL ? 'left' : 'right'}
							className="bg-slate-900 dark:bg-slate-800 text-white border-slate-700 shadow-xl px-3 py-2"
							sideOffset={12}
						>
							<TooltipArrow className="fill-slate-900 dark:fill-slate-800" />
							<div className="flex items-center gap-2">
								<span className="font-medium text-sm">{t(item.labelKey)}</span>
								{item.badge && (
									<span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-xs font-bold">
										{item.badge}
									</span>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		}

		return menuItemContent;
	};

	return (
		<motion.aside
			variants={sidebarVariants}
			initial={isOpen ? 'open' : 'closed'}
			animate={isOpen ? 'open' : 'closed'}
			className={`
				${isRTL ? 'right-0 border-l' : 'left-0 border-r'}
				fixed top-16 bottom-0 z-30 shadow-2xl overflow-hidden
				bg-gradient-to-b backdrop-blur-xl
				from-slate-50/95 to-slate-100/95 border-slate-200/80
				dark:from-slate-900/95 dark:to-slate-800/95 dark:border-slate-700/50
			`}
		>
			{/* Scrollable content area */}
			<div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
				<div className="p-3 space-y-1.5">
					{menuItems.map((item, index) => {
						const active = isActive(item.href);
						return <MenuItem key={item.href} item={item} index={index} active={active} />;
					})}

					{/* Divider */}
					<div className="py-2">
						<div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
					</div>

					{/* Logout Button */}
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.button
									type="button"
									onClick={onLogout}
									whileHover={{ scale: 1.03, x: isRTL ? 3 : -3 }}
									whileTap={{ scale: 0.97 }}
									className={`
										w-full  flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200
										text-red-600 dark:text-red-400
										hover:bg-red-50 dark:hover:bg-red-950/30
										hover:shadow-md group relative overflow-hidden
									`}
								>
									{/* Icon */}
									<div className="relative z-10 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
										<LogOut size={22} strokeWidth={2} />
									</div>

									<AnimatePresence>
										{isOpen && (
											<motion.div
												variants={itemVariants}
												initial="closed"
												animate="open"
												exit="closed"
												className="flex-1 flex items-center justify-between relative z-10"
											>
												<span className="font-medium text-sm">{t('logout')}</span>
											</motion.div>
										)}
									</AnimatePresence>

									{/* Hover effect overlay */}
									<motion.div
										className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
										initial={false}
									/>
								</motion.button>
							</TooltipTrigger>
							{!isOpen && (
								<TooltipContent
									side={isRTL ? 'left' : 'right'}
									className="  bg-red-600 dark:bg-red-700 text-white border-red-700 shadow-xl px-3 py-2"
									sideOffset={12}
								> 
									<span className="font-medium text-sm">{t('logout')}</span>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			{/* Subtle gradient overlay at bottom for scroll indication */}
			<div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-100 dark:from-slate-800 to-transparent pointer-events-none" />
		</motion.aside>
	);
}