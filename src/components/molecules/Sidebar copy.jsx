
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

// ✅ All icons from react-icons
import {
	MdDashboard,
	MdShoppingCart,
	MdInventory,
	MdPeople,
	MdAccountBalance,
	MdBarChart,
	MdDescription,
	MdLogout,
	MdSettings,
	MdSecurity,
	MdLocalShipping,
	MdWarehouse,
	MdCategory,
} from 'react-icons/md';

import {
	FaChevronDown,
	FaChevronRight,
	FaFileInvoiceDollar,
	FaUserTie,
	FaUndo,
	FaPlug,
	FaCreditCard,
	FaIndustry,
} from 'react-icons/fa';

import {
	Tooltip,
	TooltipArrow,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from '@/i18n/navigation';
import { getUser } from '@/hook/getUser';

// ✅ Firebase logout
import { getAuth, signOut } from 'firebase/auth';

export default function Sidebar({ isOpen, isRTL }) {
	const pathnameRouter = usePathname();

	const [didMount, setDidMount] = React.useState(false);
	React.useEffect(() => {
		setDidMount(true);
	}, []);

	const pathname = pathnameRouter?.slice(3, 1000);
	const t = useTranslations('sidebar');

	const user = getUser();
	const role = user?.role?.toUpperCase();
	const router = useRouter();

	// ✅ Control open/close of sub menus
	const [openGroups, setOpenGroups] = useState({});

	React.useEffect(() => {
		if (!isOpen) return;
		try {
			const items = menuItemsRef.current || [];
			for (const item of items) {
				if (item?.children?.length) {
					const inGroup =
						(item.href && (pathname === item.href || pathname?.startsWith(item.href + '/'))) ||
						item.children.some((c) => pathname === c.href || pathname?.startsWith(c.href + '/'));
					if (inGroup) {
						setOpenGroups((prev) => ({ ...prev, [item.labelKey]: true }));
					}
				}
			}
		} catch (_) { }
	}, [pathname, isOpen]);

	// ✅ Toggle group and close others
	const toggleGroup = useCallback((key) => {
		setOpenGroups((prev) => {
			const isCurrentlyOpen = prev[key];
			// Close all others, toggle current
			const newState = {};
			if (!isCurrentlyOpen) {
				newState[key] = true;
			}
			return newState;
		});
	}, []);

	const handleLogout = async () => {
		try {
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('user');

			try {
				const auth = getAuth();
				if (auth?.currentUser) await signOut(auth);
			} catch (_) { }

			router.replace('/auth');
		} catch (e) {
			console.error('Logout failed', e);
			router.replace('/auth');
		}
	};

	const menuItems = useMemo(
		() => [
			// =========================
			// SUPER ADMIN
			// =========================
			{
				icon: MdPeople,
				labelKey: 'users',
				href: '/dashboard/users',
				badge: null,
				roles: ['SUPER_ADMIN'],
			},
			{
				icon: MdSecurity,
				labelKey: 'roles',
				href: '/dashboard/roles',
				badge: null,
				roles: ['SUPER_ADMIN'],
			},
			{
				icon: FaCreditCard,
				labelKey: 'plans',
				href: '/dashboard/plans',
				badge: null,
				roles: ['SUPER_ADMIN'],
			},

			// =========================
			// ADMIN
			// =========================

			// 1) Dashboard
			{
				icon: MdDashboard,
				labelKey: 'dashboard',
				href: '/dashboard',
				badge: null,
				roles: ['ADMIN'],
			},

			// 2) Core Operations
			{
				icon: MdShoppingCart,
				labelKey: 'orders',
				href: '/orders',
				badge: '12',
				roles: ['ADMIN'],
				children: [
					{
						icon: MdInventory,
						labelKey: 'employeeOrders',
						href: '/orders/employee-orders',
					},
					{
						icon: MdInventory,
						labelKey: 'createPurchaseReturn',
						href: '/orders/create-purchase-return',
					}
				],
			},
			{
				icon: MdInventory,
				labelKey: 'products',
				href: '/products',
				badge: null,
				roles: ['ADMIN'],
				children: [
					{
						icon: MdInventory,
						labelKey: 'products',
						href: '/products',
					},
					{
						icon: FaIndustry,
						labelKey: 'newProduct',
						href: '/products/new',
					},
					{
						icon: MdCategory,
						labelKey: 'newBundle',
						href: '/bundles/new',
					},
				],
			},
			{
				icon: MdWarehouse,
				labelKey: 'warehouse',
				href: '/warehouse',
				badge: null,
				roles: ['ADMIN'],
				children: [
					{
						icon: MdInventory,
						labelKey: 'new warehouse',
						href: '/warehouse/new',
					},
				]
			},

			// ✅ Suppliers with Sub Tabs
			{
				icon: FaIndustry,
				labelKey: 'suppliers',
				href: '/suppliers',
				badge: null,
				roles: ['ADMIN'],
				children: [
					{
						icon: FaIndustry,
						labelKey: 'suppliers',
						href: '/suppliers',
					},
					{
						icon: MdCategory,
						labelKey: 'categories',
						href: '/suppliers/categories',
					},
				],
			},

			{
				icon: MdDescription,
				labelKey: 'purchases',
				href: '/purchases',
				badge: null,
				roles: ['ADMIN'],
				children: [
					{
						icon: MdDescription,
						labelKey: 'purchases',
						href: '/purchases',
					},
					{
						icon: FaUndo,
						labelKey: 'purchases-return',
						href: '/purchases/return',
					},
				],
			},

			{
				icon: FaFileInvoiceDollar,
				labelKey: 'sales',
				href: '/sales',
				badge: null,
				roles: ['ADMIN'],
			},
			{
				icon: MdLocalShipping,
				labelKey: 'shipping-companies',
				href: '/shipping-companies',
				badge: null,
				roles: ['ADMIN'],
			},

			// 4) People
			{
				icon: FaUserTie,
				labelKey: 'employees',
				href: '/employees',
				badge: null,
				roles: ['ADMIN'],
			},

			// 5) Finance
			{
				icon: MdAccountBalance,
				labelKey: 'accounts',
				href: '/accounts',
				badge: null,
				roles: ['ADMIN'],
			},

			// 6) Analytics
			{
				icon: MdBarChart,
				labelKey: 'reports',
				href: '/reports',
				badge: null,
				roles: ['ADMIN'],
			},

			// 7) Integrations
			{
				icon: FaPlug,
				labelKey: 'store-integration',
				href: '/store-integration',
				badge: null,
				roles: ['ADMIN'],
			},

			// 8) Settings & Security
			{
				icon: FaCreditCard,
				labelKey: 'plans',
				href: '/plans',
				badge: null,
				roles: ['ADMIN'],
			},
			{
				icon: MdSecurity,
				labelKey: 'roles',
				href: '/roles',
				badge: null,
				roles: ['ADMIN'],
			},
			{
				icon: MdSettings,
				labelKey: 'settings',
				href: '/settings',
				badge: null,
				roles: ['ADMIN'],
			},
		],
		[]
	);

	const menuItemsRef = React.useRef(menuItems);
	React.useEffect(() => {
		menuItemsRef.current = menuItems;
	}, [menuItems]);

	const visibleMenuItems = useMemo(() => {
		return menuItems.filter((item) => {
			if (!role) return false;
			if (!item.roles || item.roles.length === 0) return true;
			return item.roles.includes(role);
		});
	}, [menuItems, role]);

	const isActive = useCallback(
		(href) => {
			if (!href) return false;
			if (href === '/') return pathname === '/';
			return pathname === href || pathname?.endsWith(href + '/');
		},
		[pathname]
	);

	const isGroupActive = useCallback(
		(item) => {
			if (!item?.children?.length) return isActive(item.href);
			return item.children.some((c) => isActive(c.href)) || isActive(item.href);
		},
		[isActive]
	);

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

	// ✅ Enhanced SubItem Component
	const SubItem = ({ sub, index, active }) => {
		return (
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.04 * index, duration: 0.2 }}
				className="w-full "
			>
				<Link
					href={sub.href}
					className={`
            group relative w-full flex items-center gap-3 p-1 rounded-xl transition-all duration-300
            ${active
							? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary dark:text-primary shadow-md border-l-4 border-primary'
							: ' bg-slate-100 text-slate-600 dark:text-slate-400  '
						}
          `}
				>
					{/* Icon Container */}
					<div
						className={`
              relative w-9 h-9 shrink-0 rounded-lg flex items-center justify-center
              transition-all duration-300 transform
              ${active
								? 'bg-primary/20 text-primary scale-110 shadow-lg shadow-primary/20'
								: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105'
							}
            `}
					>
						{sub.icon ? <sub.icon size={18} /> : null}

						{/* Glow effect on hover */}
						{!active && (
							<div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-all duration-300" />
						)}
					</div>

					{/* Label */}
					<div className="min-w-0 flex-1">
						<span
							className={`
                text-sm transition-all duration-200
                ${active ? 'font-bold' : 'font-medium group-hover:font-semibold'}
                truncate block
              `}
						>
							{t(sub.labelKey)}
						</span>
					</div>

					{/* Arrow indicator */}
					<FaChevronRight
						size={12}
						className={`
              shrink-0 transition-all duration-300
              ${isRTL ? 'rotate-180' : ''}
              ${active
								? 'text-primary opacity-100'
								: 'text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
							}
            `}
					/>
				</Link>
			</motion.div>
		);
	};

	// ✅ Enhanced MenuItem Component
	const MenuItem = ({ item, index }) => {
		const active = isGroupActive(item);
		const hasChildren = Array.isArray(item.children) && item.children.length > 0;
		const isOpenGroup = !!openGroups[item.labelKey];

		const menuItemContent = (
			<motion.div
				initial={didMount ? false : { opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={didMount ? { duration: 0 } : { delay: index * 0.05, duration: 0.3 }}
				whileTap={{ scale: 0.97 }}
				className="w-full relative"
			>
				<div className="w-full">
					{/* Main Item */}
					<div
						className={`
              w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300
              relative overflow-hidden cursor-pointer select-none
              ${active
								? 'bg-gradient-to-r from-primary via-primary to-primary/90 text-white shadow-xl shadow-primary/40'
								: 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-white hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-800/70 hover:shadow-lg'
							}
            `}
						onClick={() => {
							if (hasChildren && isOpen) {
								toggleGroup(item.labelKey);
								return;
							}
							router.push(item.href);
						}}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								if (hasChildren && isOpen) toggleGroup(item.labelKey);
								else router.push(item.href);
							}
						}}
					>
						{/* Active Indicator Bar */}
						{active && (
							<motion.div
								layoutId="activeIndicator"
								className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-1.5 bg-white/80 rounded-r-full shadow-lg`}

							/>
						)}

						{/* Icon */}
						<div
							className={`
                relative z-10 flex items-center justify-center
                transition-all duration-300 transform
                ${active ? 'text-white scale-110' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary group-hover:scale-105'}
              `}
						>
							<item.icon size={22} />
						</div>

						{/* Label & Badge & Chevron */}
						<AnimatePresence>
							{isOpen && (
								<motion.div
									className="flex-1 flex items-center justify-between relative z-10"
								>
									<span className={`font-medium text-sm ${active ? 'font-bold' : ''} transition-all duration-200`}>
										{t(item.labelKey)}
									</span>

									<div className="flex items-center gap-2.5">
										{/* Badge */}
										{item.badge && (
											<motion.span
												className={`
                          px-2.5 py-1 rounded-lg text-xs font-bold
                          ${active
														? 'bg-white/25 text-white backdrop-blur-sm shadow-lg'
														: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30'
													}
                        `}
											>
												{item.badge}
											</motion.span>
										)}

										{/* Chevron for groups */}
										{hasChildren && (
											<div
												className={` ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
											>
												<FaChevronDown className={` ${isOpenGroup ? "rotate-180" : ""} rotate-0 duration-300`} size={14} />
											</div>
										)}
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Hover gradient overlay */}
						{!active && (
							<motion.div
								className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
								initial={false}
							/>
						)}
					</div>

					{isOpen && <div style={{ transition: ".5s" }} className={`  overflow-hidden   max-h-0 ${isOpenGroup ? 'max-h-[500px] ' : ' '}  `} >
						<div className={`  ${isRTL ? 'mr-3 ml-0' : 'ml-3'}`}>
							<div className={` relative rounded-2xl  `} >

								<div className="space-y-1.5 py-3 ">
									{item.children && item.children.map((sub, i) => (
										<SubItem
											key={sub.href}
											sub={sub}
											index={i}
											active={isActive(sub.href)}
										/>
									))}
								</div>
							</div>
						</div> 
					</div>}

				</div>
			</motion.div>
		);

		// Tooltip when sidebar is closed
		if (!isOpen) {
			return (
				<TooltipProvider delayDuration={100}>
					<Tooltip>
						<TooltipTrigger asChild>{menuItemContent}</TooltipTrigger>
						<TooltipContent
							side={isRTL ? 'left' : 'right'}
							className="bg-slate-900 dark:bg-slate-800 text-white border-slate-700 shadow-xl px-3 py-2.5"
							sideOffset={14}
						>
							<TooltipArrow className="fill-slate-900 dark:fill-slate-800" />
							<div className="flex items-center gap-2.5">
								<span className="font-semibold text-sm">{t(item.labelKey)}</span>
								{item.badge && (
									<span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-xs font-bold shadow-lg">
										{item.badge}
									</span>
								)}
							</div>

							{item.children?.length ? (
								<div className="mt-2 text-xs text-white/70 flex items-center gap-2">
									<FaChevronRight size={10} />
									<span>Has {item.children.length} sub tabs</span>
								</div>
							) : null}
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
        from-slate-50/98 via-white/95 to-slate-100/98 border-slate-200/80
        dark:from-slate-900/98 dark:via-slate-900/95 dark:to-slate-800/98 dark:border-slate-700/50
      `}
		>
			<div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
				<div className="p-3 space-y-1.5">
					{visibleMenuItems.map((item, index) => (
						<MenuItem key={item.href + item.labelKey} item={item} index={index} />
					))}

					{/* Elegant Divider */}
					<div className="py-4">
						<div className="relative h-px">
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
						</div>
					</div>

					{/* ✅ Premium Logout Button */}
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.button
									type="button"
									onClick={handleLogout}
									whileHover={{ scale: 1.02, x: isRTL ? 3 : -3 }}
									whileTap={{ scale: 0.97 }}
									className={`
                    w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300
                    relative overflow-hidden group
                    text-white
                    bg-gradient-to-r from-red-600 via-rose-500 to-pink-500
                    shadow-xl shadow-red-500/30
                    hover:shadow-2xl hover:shadow-red-500/40
                  `}
								>
									{/* Animated background gradient */}
									<motion.div
										className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
										style={{
											background:
												'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)',
										}}
									/>

									{/* Animated shine effect */}
									<motion.div
										className="absolute inset-0 opacity-0 group-hover:opacity-100"
										animate={{
											backgroundPosition: ['0% 0%', '100% 100%'],
										}}
										transition={{
											duration: 3,
											repeat: Infinity,
											ease: 'linear',
										}}
										style={{
											background:
												'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
											backgroundSize: '200% 200%',
										}}
									/>

									<motion.div
										whileHover={{ rotate: -10, scale: 1.1 }}
										transition={{ type: 'spring', stiffness: 400 }}
										className="relative z-10 w-10 h-5 rounded-xl flex items-center justify-center "
									>
										<MdLogout size={20} />
									</motion.div>

									<AnimatePresence>
										{isOpen && (
											<motion.div
												variants={itemVariants}
												initial="closed"
												animate="open"
												exit="closed"
												className="flex-1 flex items-center justify-between relative z-10"
											>
												<span className="font-bold text-sm tracking-wide">{t('logout')}</span>
												<FaChevronRight size={12} className={`${isRTL ? 'rotate-180' : ''} opacity-70`} />
											</motion.div>
										)}
									</AnimatePresence>
								</motion.button>
							</TooltipTrigger>

							{!isOpen && (
								<TooltipContent
									side={isRTL ? 'left' : 'right'}
									className="bg-red-600 dark:bg-red-700 text-white border-red-700 shadow-xl px-3 py-2.5"
									sideOffset={14}
								>
									<TooltipArrow className="fill-red-600 dark:fill-red-700" />
									<span className="font-semibold text-sm">{t('logout')}</span>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			{/* Bottom fade overlay */}
			<div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-100/90 via-slate-100/50 dark:from-slate-800/90 dark:via-slate-800/50 to-transparent pointer-events-none" />
		</motion.aside>
	);
}