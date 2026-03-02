'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser } from '@/hook/getUser';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	LayoutDashboard, ShoppingCart, Package, Users, Wallet,
	BarChart3, FileText, Shield, CreditCard, Factory,
	TrendingUp, Truck, Settings, Plug, Undo2, ChevronRight,
	PackagePlus, Warehouse, FolderTree, Layers, LogOut, XCircle,
	Sparkles, Activity,
	Printer,
	CheckCircle2,
	RefreshCw,
	ClipboardList,
	Banknote,
	AlertCircle,
	PieChart,
} from 'lucide-react';
import { FaUserTie } from 'react-icons/fa6';
import { useRouter } from '@/i18n/navigation';

/* ─────────────────────────────────────────────
	 MENU DEFINITION
───────────────────────────────────────────── */
const menuItems = [
	{ icon: LayoutDashboard, labelKey: 'dashboard', href: '/dashboard', roles: ['ADMIN'] },

	{
		icon: ShoppingCart, labelKey: 'orders', href: '/orders', roles: ['ADMIN'],
		children: [
			{ icon: Package, labelKey: 'orders', href: '/orders?tab=orders' },
			{ icon: Undo2, labelKey: 'orderReplacement', href: '/orders?tab=replacement' },
			{ icon: XCircle, labelKey: 'failedOrders', href: '/orders?tab=failedOrders' },
		],
	},
	{
		icon: Banknote, // Main icon for the Collections category
		labelKey: 'collections',
		href: '/collections',
		badge: null,
		roles: ['ADMIN'],
		children: [
			{
				icon: CheckCircle2, // Represents completed/fully collected
				labelKey: 'collectedOrders', // Matches your fully_collected logic
				href: '/orders/collections?tab=collected',
			},
			{
				icon: AlertCircle, // Represents pending or partial payments
				labelKey: 'uncollectedOrders', // Covers not_collected & partial
				href: '/orders/collections?tab=not_collected',
			},
		],
	},
	{
		icon: Warehouse, labelKey: 'warehouse', href: '/warehouse', roles: ['ADMIN'],
		children: [
			{ icon: Truck, labelKey: 'warehouseDistribution', href: '/warehouse?tab=distribution' },
			{ icon: Printer, labelKey: 'warehousePrint', href: '/warehouse?tab=print' },
			{ icon: Package, labelKey: 'warehousePreparation', href: '/warehouse?tab=preparation' },
			{ icon: CheckCircle2, labelKey: 'warehouseOutgoing', href: '/warehouse?tab=outgoing' },
			{ icon: RefreshCw, labelKey: 'warehouseReturns', href: '/warehouse?tab=returns' },
			{ icon: XCircle, labelKey: 'warehouseRejected', href: '/warehouse?tab=rejected' },
			{ icon: ClipboardList, labelKey: 'warehouseLogs', href: '/warehouse?tab=logs' },
		],
	},

	{
		icon: Package, labelKey: 'products', href: '/products', roles: ['ADMIN'],
		children: [
			{ icon: Package, labelKey: 'products', href: '/products' },
			{ icon: PackagePlus, labelKey: 'newProduct', href: '/products/new' },
			{ icon: Layers, labelKey: 'newBundle', href: '/bundles/new' },
		],
	},

	{ icon: TrendingUp, labelKey: 'sales', href: '/sales', roles: ['ADMIN'] },

	{
		icon: FileText, labelKey: 'purchases', href: '/purchases', roles: ['ADMIN'],
		children: [
			{ icon: FileText, labelKey: 'purchases', href: '/purchases' },
			{ icon: Undo2, labelKey: 'purchasesReturn', href: '/purchases/return' },
		],
	},

	{
		icon: Factory, labelKey: 'suppliers', href: '/suppliers', roles: ['ADMIN'],
		children: [
			{ icon: Factory, labelKey: 'suppliers', href: '/suppliers' },
			{ icon: FolderTree, labelKey: 'categories', href: '/suppliers/categories' },
		],
	},

	{ icon: Truck, labelKey: 'shippingCompanies', href: '/shipping-companies', roles: ['ADMIN'] },
	{ icon: FaUserTie, labelKey: 'employees', href: '/employees', roles: ['ADMIN'] },
	{ icon: Wallet, labelKey: 'accounts', href: '/accounts', roles: ['ADMIN'] },
	{
		icon: BarChart3, // reports icon
		labelKey: 'reports',
		href: '/reports',
		roles: ['ADMIN'],
		children: [
			{
				icon: PieChart, // analytics icon
				labelKey: 'order-analysis',
				href: '/reports/order-analysis',
			},
			{
				icon: Activity, // choose an icon that represents performance
				labelKey: 'employee-performance-analysis',
				href: '/reports/employee-performance-analysis',
			},
		],
	},
	{ icon: Plug, labelKey: 'storeIntegration', href: '/store-integration', roles: ['ADMIN'] },
	{ icon: CreditCard, labelKey: 'plans', href: '/plans', roles: ['ADMIN'] },
	{ icon: Shield, labelKey: 'roles', href: '/roles', roles: ['ADMIN'] },
	{ icon: Settings, labelKey: 'settings', href: '/settings', roles: ['ADMIN'] },

	{ icon: Users, labelKey: 'users', href: '/dashboard/users', roles: ['SUPER_ADMIN'] },
	{ icon: Shield, labelKey: 'roles', href: '/dashboard/roles', roles: ['SUPER_ADMIN'] },
	{ icon: CreditCard, labelKey: 'plans', href: '/dashboard/plans', roles: ['SUPER_ADMIN'] },

	{
		icon: ShoppingCart, labelKey: 'orders', href: '/orders', badge: '12', roles: ['USER'],
		children: [
			{ icon: Package, labelKey: 'employeeOrders', href: '/orders' },
		],
	},
];

/* ─────────────────────────────────────────────
	 RIPPLE HOOK
───────────────────────────────────────────── */
function useRipple() {
	const [ripples, setRipples] = useState([]);
	const addRipple = (e, ref) => {
		if (!ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const id = Date.now();
		setRipples(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
		setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 700);
	};
	const RippleLayer = () => (
		<>
			{ripples.map(r => (
				<motion.span key={r.id}
					initial={{ scale: 0, opacity: 0.35 }}
					animate={{ scale: 22, opacity: 0 }}
					transition={{ duration: 0.7, ease: 'easeOut' }}
					className="absolute pointer-events-none rounded-full w-5 h-5"
					style={{ left: r.x - 10, top: r.y - 10, background: 'rgba(255,139,0,0.25)' }}
				/>
			))}
		</>
	);
	return { addRipple, RippleLayer };
}

/* ─────────────────────────────────────────────
	 ICON BOX
───────────────────────────────────────────── */
function IconBox({ Icon, active, collapsed }) {
	return (
		<div
			data-iconbox
			className={`
				relative shrink-0 flex items-center justify-center rounded-xl
				transition-all duration-300
				${collapsed ? 'w-[44px] h-[44px]' : 'w-9 h-9'}
				${active
					? 'shadow-[0_4px_20px_rgba(255,139,0,0.5)]'
					: 'bg-[#f5f5f5] dark:bg-white/[0.06] group-hover:bg-[#fff0e0] dark:group-hover:bg-[#ff8b00]/10'
				}
			`}
			style={active ? { background: 'linear-gradient(135deg, #ff8b00 0%, #ff5c2b 100%)' } : {}}
		>
			{active && (
				<motion.span
					animate={{ x: ['-120%', '220%'] }}
					transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
					className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
				/>
			)}
			<Icon
				className={`w-[18px] h-[18px] relative z-10 transition-colors duration-200
					${active ? 'text-white' : 'text-[#666] dark:text-muted-foreground group-hover:text-[#ff8b00]'}`}
				strokeWidth={active ? 2.5 : 2}
			/>
		</div>
	);
}


function MenuItem({ item, isOpen, isRTL, isActive, isParentActive, isExpanded, onToggle, onOpenSidebar }) {
	const t = useTranslations('sidebar');
	const ref = useRef(null);
	const { addRipple, RippleLayer } = useRipple();
	const menuRouter = useRouter();
	const Icon = item.icon;
	const hasChildren = Boolean(item.children?.length);
	const active = isParentActive(item);
	const label = t(item.labelKey);

	const sharedClass = `
		w-full group relative flex items-center overflow-hidden
		${isOpen ? 'gap-3 px-2 py-[7px]' : 'py-[6px] justify-center'}
		rounded-xl cursor-pointer select-none
		transition-colors duration-200
		${active
			? 'bg-gradient-to-r from-[#fff4e6] to-[#fff0e0] dark:from-[#ff8b00]/15 dark:to-[#ff5c2b]/10 text-[#ff8b00]'
			: 'text-[#888] dark:text-muted-foreground hover:bg-[#fafafa] dark:hover:bg-white/[0.04] hover:text-[#333] dark:hover:text-foreground'
		}
	`;

	const inner = (
		<>
			<RippleLayer />
			<AnimatePresence>
				{active && (
					<motion.span
						initial={{ scaleY: 0, opacity: 0 }}
						animate={{ scaleY: 1, opacity: 1 }}
						exit={{ scaleY: 0, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 400, damping: 28 }}
						className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-[15%] h-[70%] w-[3px] rounded-full`}
						style={{ background: 'linear-gradient(180deg,#ff8b00,#ff5c2b)' }}
					/>
				)}
			</AnimatePresence>

			<IconBox Icon={Icon} active={active} collapsed={!isOpen} />

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: isRTL ? 8 : -8 }}
						transition={{ duration: 0.18 }}
						className="flex items-center justify-between flex-1 min-w-0"
					>
						<span className="text-[13px] font-[600] tracking-[-0.01em] whitespace-nowrap truncate leading-none">
							{label}
						</span>
						<div className="flex items-center gap-1.5 shrink-0 ml-1">
							{item.badge && (
								<span className="px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full tabular-nums shadow"
									style={{ background: 'linear-gradient(135deg,#ff5c2b,#ff8b00)' }}>
									{item.badge}
								</span>
							)}
							{hasChildren && (
								<motion.span
									animate={{ rotate: isExpanded ? 90 : 0 }}
									transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
									className="opacity-40 inline-flex"
								>
									<ChevronRight className="rtl:scale-x-[-1] w-4 h-4" />
								</motion.span>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{!isOpen && item.badge && (
				<span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold text-white rounded-full flex items-center justify-center shadow"
					style={{ background: '#ff5c2b' }}>
					{item.badge}
				</span>
			)}
		</>
	);

	/* ── Wrap with shadcn Tooltip only when collapsed ── */
	const wrappedInTooltip = (trigger) => {
		if (isOpen) return trigger;
		return (
			<Tooltip delayDuration={100}>
				<TooltipTrigger asChild>{trigger}</TooltipTrigger>
				<TooltipContent
					side={isRTL ? 'left' : 'right'}
					className="text-[12.5px] font-semibold px-3 py-2 rounded-xl text-white border-none"
					style={{ background: 'linear-gradient(135deg,#ff8b00,#ff5c2b)', boxShadow: '0 4px 20px rgba(255,139,0,0.35)' }}
					arrowClassName="fill-[#ff7a00]"
					arrowStyle={{ fill: '#ff7a00' }}
				>
					{label}
				</TooltipContent>
			</Tooltip>
		);
	};

	// ── When sidebar is CLOSED: clicking anything opens sidebar, never navigates ──
	const handleCollapsedClick = (e) => {
		e.preventDefault();
		onOpenSidebar?.();
	};

	if (hasChildren) {
		return wrappedInTooltip(
			<button
				ref={ref}
				onClick={(e) => {
					addRipple(e, ref);
					if (!isOpen) {
						onOpenSidebar?.();
					} else {
						onToggle(item.href);
					}
				}}
				className={sharedClass}
			>
				{inner}
			</button>
		);
	}

	return wrappedInTooltip(
		<Link
			ref={ref}
			href={item.href}
			onClick={(e) => {
				console.log(!isOpen);
				addRipple(e, ref);
				if (!isOpen) {
					handleCollapsedClick(e);
				}
			}}
			className={sharedClass}
		>
			{inner}
		</Link>
	);
}

/* ─────────────────────────────────────────────
	 SUB ITEM  — clean design, no bullets
───────────────────────────────────────────── */
function SubItem({ child, isActive, isRTL, index }) {
	const t = useTranslations('sidebar');
	const Icon = child.icon;
	const active = isActive(child.href);

	return (
		<motion.div
			initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: isRTL ? 10 : -10 }}
			transition={{ delay: index * 0.035, duration: 0.18 }}
		>
			<Link
				href={child.href}
				className={`
					relative flex items-center gap-2.5 py-[7px] rounded-xl
					transition-all duration-200 group overflow-hidden
					${isRTL ? 'pr-3 pl-2' : 'pl-3 pr-2'}
					${active
						? 'text-[#ff8b00] font-semibold'
						: 'text-[#999] dark:text-muted-foreground hover:text-[#333] dark:hover:text-foreground hover:bg-[#fafafa] dark:hover:bg-white/[0.04]'
					}
				`}
				style={active ? { background: 'linear-gradient(135deg,#fff8f0,#fff0e0)' } : {}}
			>
				{/* Left accent bar (replaces old vertical line + bullet) */}
				<span
					className={`
						absolute ${isRTL ? 'right-0' : 'left-0'} top-[20%] h-[60%] w-[3px] rounded-full
						transition-all duration-200
					`}
					style={{
						background: active
							? 'linear-gradient(180deg,#ff8b00,#ff5c2b)'
							: 'transparent',
					}}
				/>

				{/* Icon chip */}
				<span
					className={`
						shrink-0 flex items-center justify-center w-7 h-7 rounded-lg
						transition-all duration-200
						${active
							? 'shadow-[0_2px_10px_rgba(255,139,0,0.35)]'
							: 'bg-[#f5f5f5] dark:bg-white/[0.05] group-hover:bg-[#fff0e0] dark:group-hover:bg-[#ff8b00]/10'
						}
					`}
					style={active ? { background: 'linear-gradient(135deg,#ff8b00,#ff5c2b)' } : {}}
				>
					<Icon
						className={`w-[13px] h-[13px] transition-colors ${active ? 'text-white' : 'text-[#999] group-hover:text-[#ff8b00]'}`}
						strokeWidth={active ? 2.5 : 2}
					/>
				</span>

				{/* Label */}
				<span className="text-[12.5px] leading-none whitespace-nowrap flex-1 truncate font-[500]">
					{t(child.labelKey)}
				</span>

				{/* Active indicator dot */}
				{active && (
					<motion.span
						layoutId="childActivePill"
						className="w-1.5 h-1.5 rounded-full shrink-0"
						style={{ background: 'linear-gradient(180deg,#ff8b00,#ff5c2b)' }}
						transition={{ type: 'spring', stiffness: 500, damping: 32 }}
					/>
				)}
			</Link>
		</motion.div>
	);
}

/* ─────────────────────────────────────────────
	 LOGOUT BUTTON
───────────────────────────────────────────── */
function LogoutButton({ isOpen, isRTL, onLogout }) {
	const t = useTranslations('sidebar');
	const ref = useRef(null);
	const { addRipple, RippleLayer } = useRipple();
	const [hovered, setHovered] = useState(false);

	return (
		<div className="p-2 border-t border-[#ff8b00]/10">
			<motion.button
				ref={ref}
				whileHover={{ scale: 1.01 }}
				whileTap={{ scale: 0.98 }}
				onClick={(e) => { addRipple(e, ref); onLogout(); }}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				className={`
					relative w-full flex items-center overflow-hidden rounded-xl
					${isOpen ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'}
					border transition-all duration-300 group
					${hovered
						? 'border-red-400/40 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/5'
						: 'border-red-300/20 bg-red-500/[0.04]'
					}
				`}
			>
				<RippleLayer />
				<motion.div
					animate={{ rotate: hovered ? -20 : 0 }}
					transition={{ duration: 0.2 }}
					className={`
						relative shrink-0 flex items-center justify-center rounded-xl
						transition-all duration-300
						${!isOpen ? 'w-[48px] h-[44px]' : 'w-9 h-9'}
						${hovered ? 'bg-red-500/15' : 'bg-red-500/8'}
					`}
				>
					<LogOut className="w-[16px] h-[16px] text-red-500" strokeWidth={2.2} />
				</motion.div>

				<AnimatePresence>
					{isOpen && (
						<motion.span
							initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: isRTL ? 8 : -8 }}
							transition={{ duration: 0.17 }}
							className="text-[13px] font-semibold text-red-500 whitespace-nowrap"
						>
							{t('logout')}
						</motion.span>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{hovered && (
						<motion.span
							initial={{ x: '-100%' }}
							animate={{ x: '300%' }}
							exit={{ x: '300%' }}
							transition={{ duration: 0.65, ease: 'easeInOut' }}
							className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-red-400/10 to-transparent skew-x-12 pointer-events-none"
						/>
					)}
				</AnimatePresence>
			</motion.button>
		</div>
	);
}

/* ─────────────────────────────────────────────
	 SIDEBAR
───────────────────────────────────────────── */
const Sidebar = ({ isOpen, isRTL, onOpenSidebar }) => {
	const pathname = usePathname();
	const t = useTranslations('sidebar');
	const [expandedItems, setExpandedItems] = useState(new Set());

	const [currentSearch, setCurrentSearch] = useState(() =>
		typeof window !== 'undefined' ? window.location.search : ''
	);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const sync = () => setCurrentSearch(window.location.search);
		window.addEventListener('popstate', sync);
		const origPush = history.pushState.bind(history);
		const origReplace = history.replaceState.bind(history);
		history.pushState = (...args) => { origPush(...args); sync(); };
		history.replaceState = (...args) => { origReplace(...args); sync(); };
		return () => {
			window.removeEventListener('popstate', sync);
			history.pushState = origPush;
			history.replaceState = origReplace;
		};
	}, []);

	const router = useRouter();
	const user = getUser();
	const userRole = user?.role?.toUpperCase();

	const isActive = useCallback((href) => {
		const [hrefPath, hrefQuery] = href.split('?');
		const pathMatch = pathname === hrefPath || pathname.endsWith(hrefPath);
		if (!hrefQuery) return pathMatch;
		const currentParams = new URLSearchParams(currentSearch);
		const hrefParams = new URLSearchParams(hrefQuery);
		for (const [key, val] of hrefParams.entries()) {
			if (currentParams.get(key) !== val) return false;
		}
		return pathMatch;
	}, [pathname, currentSearch]);

	const isParentActive = useCallback((item) =>
		item.children?.length
			? isActive(item.href) || item.children.some(c => isActive(c.href))
			: isActive(item.href),
		[isActive]);

	useEffect(() => {
		const active = menuItems.find(item => {
			return item.children?.some(c => isActive(c.href))
		}
		);
		if (active) {
			setExpandedItems(prev => new Set([...prev, active.href]));
		}
	}, [pathname, currentSearch, isActive]);

	const filteredItems = useMemo(() => {
		if (!userRole) return [];
		return menuItems.filter(item => !item.roles?.length || item.roles.includes(userRole));
	}, [userRole]);

	const toggleExpanded = (href) => setExpandedItems(prev => {
		const next = new Set(prev);
		next.has(href) ? next.delete(href) : next.add(href);
		return next;
	});

	const handleLogout = () => {
		try {
			['accessToken', 'refreshToken', 'user'].forEach(k => localStorage.removeItem(k));
		} catch { }
		router.replace('/auth');
	};

	if (!userRole) {
		return (
			<motion.aside
				initial={false}
				animate={{ width: isOpen ? 280 : 80 }}
				transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
				className={`fixed top-16 ${isRTL ? 'right-0' : 'left-0'} h-[calc(100vh-4rem)]
					bg-sidebar ${isRTL ? 'border-l' : 'border-r'} border-border z-50 flex items-center justify-center`}
			>
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
					className="w-6 h-6 rounded-full border-2 border-[#ff8b00]/20 border-t-[#ff8b00]"
				/>
			</motion.aside>
		);
	}

	return (
		<TooltipProvider>
			<motion.aside
				initial={false}
				animate={{ width: isOpen ? 280 : 80 }}
				transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
				className={`
					fixed thin-scroll top-16 ${isRTL ? 'right-0' : 'left-0'}
					h-[calc(100vh-4rem)] flex flex-col overflow-hidden z-50
					bg-white dark:bg-[#13161f]
					${isRTL ? 'border-l' : 'border-r'} border-border
				`}
				style={{ boxShadow: 'rgba(50, 50, 93, 0.20) 0px 30px 60px -12px , rgba(0, 0, 0, 0.2) 0px 18px 36px -28px' }}
			>
				{/* ─── Nav ─── */}
				<nav
					dir={isRTL ? 'rtl' : 'ltr'}
					className="flex-1 pt-2 overflow-y-auto overflow-x-hidden px-2 pb-2 space-y-0.1 sidebar-scroll"
				>
					{filteredItems.map((item, i) => {
						const hasChildren = Boolean(item.children?.length);
						const expanded = expandedItems.has(item.href);

						return (
							<div key={`${item.href}-${i}`} className="relative">
								<motion.div
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: i * 0.022, duration: 0.2 }}
								>
									<MenuItem
										item={item}
										isOpen={isOpen}
										isRTL={isRTL}
										isActive={isActive}
										isParentActive={isParentActive}
										isExpanded={expanded}
										onToggle={toggleExpanded}
										onOpenSidebar={onOpenSidebar}
									/>
								</motion.div>

								{/* Children dropdown */}
								<AnimatePresence initial={false}>
									{hasChildren && expanded && isOpen && (
										<motion.div
											key="sub"
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: 'auto', opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
											className="overflow-hidden"
										>
											<div
												dir={isRTL ? 'rtl' : 'ltr'}
												className={`${isRTL ? 'pr-4 pl-1' : 'pl-4 pr-1'} pt-1 pb-1 space-y-0.5`}
											>
												{item.children.map((child, ci) => (
													<SubItem
														key={child.href}
														child={child}
														isActive={isActive}
														isRTL={isRTL}
														index={ci}
													/>
												))}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						);
					})}
				</nav>

				{/* ─── Logout ─── */}
				<LogoutButton isOpen={isOpen} isRTL={isRTL} onLogout={handleLogout} />
			</motion.aside>
		</TooltipProvider>
	);
};

export default Sidebar;