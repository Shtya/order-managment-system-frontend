// components/molecules/Sidebar.jsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser } from '@/hook/getUser';
import {
	LayoutDashboard,
	ShoppingCart,
	Package,
	Users,
	Wallet,
	BarChart3,
	FileText,
	Shield,
	CreditCard,
	Factory,
	TrendingUp,
	Truck,
	Settings,
	Plug,
	Undo2,
	ChevronDown,
	PackagePlus,
	Warehouse,
	FolderTree,
	Layers,
	LogOut,
} from 'lucide-react';
import { FaUserTie } from 'react-icons/fa6';
import { useRouter } from '@/i18n/navigation';

const menuItems = [
	// =========================
	// SUPER ADMIN
	// =========================
	{
		icon: Users,
		labelKey: 'users',
		href: '/dashboard/users',
		badge: null,
		roles: ['SUPER_ADMIN'],
	},
	{
		icon: Shield,
		labelKey: 'roles',
		href: '/dashboard/roles',
		badge: null,
		roles: ['SUPER_ADMIN'],
	},
	{
		icon: CreditCard,
		labelKey: 'plans',
		href: '/dashboard/plans',
		badge: null,
		roles: ['SUPER_ADMIN'],
	},

	// =========================
	// ADMIN
	// =========================
	{
		icon: LayoutDashboard,
		labelKey: 'dashboard',
		href: '/dashboard',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: ShoppingCart,
		labelKey: 'orders',
		href: '/orders',
		badge: '12',
		roles: ['ADMIN'],
		children: [
			{
				icon: Package,
				labelKey: 'employeeOrders',
				href: '/orders',
			},
			{
				icon: Undo2,
				labelKey: 'order-replacement',
				href: '/order-replacement',
			},
		],
	},
	{
		icon: Package,
		labelKey: 'products',
		href: '/products',
		badge: null,
		roles: ['ADMIN'],
		children: [
			{
				icon: Package,
				labelKey: 'products',
				href: '/products',
			},
			{
				icon: PackagePlus,
				labelKey: 'newProduct',
				href: '/products/new',
			},
			{
				icon: Layers,
				labelKey: 'newBundle',
				href: '/bundles/new',
			},
		],
	},
	{
		icon: Warehouse,
		labelKey: 'warehouse',
		href: '/warehouse',
		badge: null,
		roles: ['ADMIN'],
		children: [
			{
				icon: PackagePlus,
				labelKey: 'newWarehouse',
				href: '/warehouse/new',
			},
		],
	},
	{
		icon: Factory,
		labelKey: 'suppliers',
		href: '/suppliers',
		badge: null,
		roles: ['ADMIN'],
		children: [
			{
				icon: Factory,
				labelKey: 'suppliers',
				href: '/suppliers',
			},
			{
				icon: FolderTree,
				labelKey: 'categories',
				href: '/suppliers/categories',
			},
		],
	},
	{
		icon: FileText,
		labelKey: 'purchases',
		href: '/purchases',
		badge: null,
		roles: ['ADMIN'],
		children: [
			{
				icon: FileText,
				labelKey: 'purchases',
				href: '/purchases',
			},
			{
				icon: Undo2,
				labelKey: 'purchasesReturn',
				href: '/purchases/return',
			},
		],
	},
	{
		icon: TrendingUp,
		labelKey: 'sales',
		href: '/sales',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: Truck,
		labelKey: 'shippingCompanies',
		href: '/shipping-companies',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: FaUserTie,
		labelKey: 'employees',
		href: '/employees',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: Wallet,
		labelKey: 'accounts',
		href: '/accounts',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: BarChart3,
		labelKey: 'reports',
		href: '/reports',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: Plug,
		labelKey: 'storeIntegration',
		href: '/store-integration',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: CreditCard,
		labelKey: 'plans',
		href: '/plans',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: Shield,
		labelKey: 'roles',
		href: '/roles',
		badge: null,
		roles: ['ADMIN'],
	},
	{
		icon: Settings,
		labelKey: 'settings',
		href: '/settings',
		badge: null,
		roles: ['ADMIN'],
	},
];

const Sidebar = ({ isOpen, isRTL }) => {
	const pathname = usePathname();
	const t = useTranslations('sidebar');
	const [expandedItems, setExpandedItems] = useState(new Set());
	const [hoveredItem, setHoveredItem] = useState(null);
	const router = useRouter()

	
	// Get user role
	const user = getUser();
	const userRole = user?.role?.toUpperCase();

	// Filter menu items based on user role
	const filteredMenuItems = useMemo(() => {
		if (!userRole) return [];

		return menuItems.filter(item => {
			// If item has roles defined, check if user role is included
			if (item.roles && item.roles.length > 0) {
				return item.roles.includes(userRole);
			}
			// If no roles defined, show to everyone
			return true;
		});
	}, [userRole]);

	const toggleExpanded = (href) => {
		setExpandedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(href)) {
				newSet.delete(href);
			} else {
				newSet.add(href);
			}
			return newSet;
		});
	};

	const isActive = (href) => pathname.endsWith(href);

	const isParentActive = (item) => {
		if (item.children?.length) {
			return isActive(item.href) || item.children.some((c) => isActive(c.href));
		}
		return isActive(item.href);
	};

	// Show loading state or empty state if no role
	if (!userRole) {
		return (
			<motion.aside
				initial={false}
				animate={{
					width: isOpen ? 280 : 80,
					x: 0,
				}}
				transition={{
					duration: 0.4,
					ease: [0.25, 0.46, 0.45, 0.94],
				}}
				className={`
          fixed top-16 ${isRTL ? 'right-0' : 'left-0'} h-[calc(100vh-4rem)]
          bg-gradient-to-b from-background via-background to-card/50
          border-${isRTL ? 'l' : 'r'} border-border/50 backdrop-blur-xl z-30 overflow-hidden
          shadow-2xl flex items-center justify-center
        `}
			>
				<div className="text-muted-foreground text-sm">
					{isOpen ? t('loading') || 'Loading...' : '...'}
				</div>
			</motion.aside>
		);
	}


	const handleLogout = async () => {
		try {
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('user'); 
			router.replace('/auth');
		} catch (e) {
			console.error('Logout failed', e);
			router.replace('/auth');
		}
	};

	return (
		<motion.aside
			initial={false}
			animate={{
				width: isOpen ? 280 : 80,
				x: 0,
			}}
			transition={{
				duration: 0.4,
				ease: [0.25, 0.46, 0.45, 0.94],
			}}
			className={`
        fixed top-16 ${isRTL ? 'right-0' : 'left-0'} h-[calc(100vh-4rem)]
        bg-gradient-to-b from-background via-background to-card/50
        border-${isRTL ? 'l' : 'r'} border-border/50 backdrop-blur-xl z-30 overflow-hidden
        shadow-2xl
      `}
			style={{
				direction: isRTL ? 'rtl' : 'ltr',
			}}
		>
			{/* Animated Background Gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

			{/* Floating Orbs */}
			<motion.div
				animate={{
					y: [0, -20, 0],
					opacity: [0.3, 0.5, 0.3],
				}}
				transition={{
					duration: 4,
					repeat: Infinity,
					ease: "easeInOut",
				}}
				className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"
			/>
			<motion.div
				animate={{
					y: [0, 20, 0],
					opacity: [0.2, 0.4, 0.2],
				}}
				transition={{
					duration: 5,
					repeat: Infinity,
					ease: "easeInOut",
				}}
				className="absolute bottom-20 left-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none"
			/>

			{/* Menu Items */}
			<nav className={`px-2 w-full  pt-4 pb-4 ${!isOpen && "w-fit"} h-[calc(100%-80px)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent`}>
				<div className="space-y-2">
					{filteredMenuItems.map((item, index) => {
						const Icon = item.icon;
						const hasChildren = item.children && item.children.length > 0;
						const isExpanded = expandedItems.has(item.href);
						const active = isParentActive(item);
						const isHovered = hoveredItem === item.href;

						return (
							<div key={item.href}>
								{/* Main Item */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.03 }}
									onMouseEnter={() => setHoveredItem(item.href)}
									onMouseLeave={() => setHoveredItem(null)}
								>
									{hasChildren ? (
										<button
											onClick={() => toggleExpanded(item.href)}
											className={`
                        w-full group relative flex items-center gap-3 ${isOpen ? "px-3 py-3" : ""} rounded-lg
                        transition-all duration-300
                        ${active
													? 'bg-primary  text-white shadow-lg shadow-primary/10'
													: 'hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/30 text-muted-foreground hover:text-foreground'
												}
                      `}
										>
										 

											{/* Icon Container */}
											<motion.div
												animate={{
													scale: isHovered && !active ? 1.1 : 1,
													rotate: isHovered && !active ? 5 : 0,
												}}
												transition={{ duration: 0.2 }}
												className={`
                          relative ${!isOpen && "!w-[55px] !h-[45px]"} flex items-center justify-center w-10 h-10 rounded-lg
                          transition-all duration-300
                          ${active
														? 'border-secondary border bg-primary   text-white shadow-xl shadow-primary/40'
														: 'bg-accent/30 group-hover:bg-accent/50'
													}
                        `}
											>
												<Icon className="w-5 h-5 relative z-10" strokeWidth={active ? 2.5 : 2} />

												{/* Glow effect on hover */}
												{isHovered && !active && (
													<motion.div
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg blur-sm"
													/>
												)}
											</motion.div>

											{/* Label */}
											<AnimatePresence>
												{isOpen && (
													<motion.div
														initial={{ opacity: 0, width: 0 }}
														animate={{ opacity: 1, width: 'auto' }}
														exit={{ opacity: 0, width: 0 }}
														className="flex items-center justify-between flex-1 overflow-hidden"
													>
														<span className="font-semibold text-sm whitespace-nowrap">
															{t(item.labelKey)}
														</span>

														<motion.div
															animate={{ rotate: isExpanded ? 180 : 0 }}
															transition={{ duration: 0.3 }}
														>
															<ChevronDown className="w-5 h-5" />
														</motion.div>
													</motion.div>
												)}
											</AnimatePresence>

											{/* Badge */}
											{item.badge && isOpen && (
												<motion.span
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													whileHover={{ scale: 1.1 }}
													className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg"
												>
													{item.badge}
												</motion.span>
											)}
										</button>
									) : (
										<Link
											href={item.href}
											className={`
                        w-full group relative flex items-center gap-3  rounded-lg ${isOpen && "px-3 py-3"}
                        transition-all duration-300
                        ${active
													? 'bg-primary text-white shadow-lg shadow-primary/10'
													: 'hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/30 text-muted-foreground hover:text-foreground'
												}
                      `}
										>
 
											<motion.div
												animate={{
													scale: isHovered && !active ? 1.1 : 1,
													rotate: isHovered && !active ? 5 : 0,
												}}
												transition={{ duration: 0.2 }}
												className={`
                          relative flex items-center justify-center w-10 h-10 rounded-lg
                          transition-all duration-300 overflow-hidden
													${!isOpen && "!w-[55px] !h-[45px]"}
                          ${active
														? ' border-secondary border bg-primary text-white shadow-xl shadow-primary/40'
														: 'bg-accent/30 group-hover:bg-accent/50'
													}
                        `}
											>
												<Icon className="w-5 h-5 relative z-10" strokeWidth={active ? 2.5 : 2} />

												{/* Shine effect */}
												{active && (
													<motion.div
														animate={{
															x: [-100, 100],
														}}
														transition={{
															duration: 2,
															repeat: Infinity,
															repeatDelay: 3,
														}}
														className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
													/>
												)}

												{/* Glow effect on hover */}
												{isHovered && !active && (
													<motion.div
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg blur-sm"
													/>
												)}
											</motion.div>

											{/* Label */}
											<AnimatePresence>
												{isOpen && (
													<motion.span
														initial={{ opacity: 0, width: 0 }}
														animate={{ opacity: 1, width: 'auto' }}
														exit={{ opacity: 0, width: 0 }}
														className="font-semibold text-sm whitespace-nowrap overflow-hidden"
													>
														{t(item.labelKey)}
													</motion.span>
												)}
											</AnimatePresence>

											{/* Badge */}
											{item.badge && isOpen && (
												<motion.span
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													whileHover={{ scale: 1.1 }}
													className="ml-auto px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg"
												>
													{item.badge}
												</motion.span>
											)}
										</Link>
									)}
								</motion.div>

								{/* Sub Items */}
								<AnimatePresence>
									{hasChildren && isExpanded && isOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: 'auto', opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.3, ease: 'easeInOut' }}
											className="overflow-hidden"
										>
											<div className={`space-y-1 mt-1 ${isRTL ? 'pl-3' : 'pr-3'}`}>
												{item.children?.map((child, childIndex) => {
													const ChildIcon = child.icon;
													const childActive = isActive(child.href);

													return (
														<motion.div
															key={child.href}
															initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
															animate={{ opacity: 1, x: 0 }}
															transition={{ delay: childIndex * 0.05 }}
														>
															<Link
																href={child.href}
																className={`
                                  flex items-center gap-3 px-4 py-2.5 rounded-lg
                                  transition-all duration-300 group relative
                                  ${childActive
																		? 'bg-primary/80  text-white'
																		: 'hover:bg-accent/40 text-muted-foreground hover:text-foreground'
																	}
                                `}
															>
																{/* Connection Line */}
																<div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-px bg-border/30`} />
																<motion.div
																	animate={{
																		scale: childActive ? [1, 1.3, 1] : 1,
																	}}
																	transition={{
																		duration: 0.6,
																		repeat: childActive ? Infinity : 0,
																		repeatDelay: 2,
																	}}
																	className={`
                                    w-2 h-2 rounded-full transition-all duration-300 relative z-10
                                    ${childActive
																			? 'bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/50'
																			: 'bg-muted-foreground/30 group-hover:bg-muted-foreground/60'
																		}
                                  `}
																/>

																{/* Icon */}
																<ChildIcon
																	className={`w-4 h-4 transition-all duration-300 ${childActive ? 'text-white' : ''
																		}`}
																	strokeWidth={childActive ? 2.5 : 2}
																/>

																{/* Label */}
																<span className="text-sm font-medium whitespace-nowrap flex-1">
																	{t(child.labelKey)}
																</span>

																{/* Active Indicator */}
																{childActive && (
																	<motion.div
																		layoutId="subActiveIndicator"
																		className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary"
																		transition={{
																			type: 'spring',
																			stiffness: 350,
																			damping: 30,
																		}}
																	/>
																)}
															</Link>
														</motion.div>
													);
												})}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						);
					})}
				</div>
			</nav>

			{/* Logout Button */}
			<div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border/50 bg-gradient-to-t from-background via-background to-transparent">
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={handleLogout}
					className={`
            w-full group relative flex items-center gap-3 ${isOpen && "px-3 py-3"} rounded-lg
            transition-all duration-300
            bg-gradient-to-r from-red-500/10 to-red-600/5
            hover:from-red-500/20 hover:to-red-600/10
            text-red-600 dark:text-red-400
            border border-red-500/20 hover:border-red-500/40
          `}
				>
					{/* Icon Container */}
					<motion.div
						whileHover={{ rotate: 15 }}
						transition={{ duration: 0.2 }}
						className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-all duration-300"
					>
						<LogOut className="w-5 h-5" strokeWidth={2} />
					</motion.div>

					{/* Label */}
					<AnimatePresence>
						{isOpen && (
							<motion.span
								initial={{ opacity: 0, width: 0 }}
								animate={{ opacity: 1, width: 'auto' }}
								exit={{ opacity: 0, width: 0 }}
								className="font-semibold text-sm whitespace-nowrap overflow-hidden"
							>
								{t('logout')}
							</motion.span>
						)}
					</AnimatePresence>
				</motion.button>
			</div>
		</motion.aside>
	);
};

export default Sidebar;