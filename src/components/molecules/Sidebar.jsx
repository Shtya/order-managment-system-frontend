"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";


import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  ChevronRight,
  PackagePlus,
  Warehouse,
  FolderTree,
  Layers,
  LogOut,
  XCircle,
  Activity,
  Printer,
  CheckCircle2,
  RefreshCw,
  ClipboardList,
  Banknote,
  AlertCircle,
  PieChart,
  Package2,
  Menu,
  X,
  Globe,
  Lock,
  PackageCheck,
  Headset,
  RefreshCcw,
  Receipt,
} from "lucide-react";
import { FaUserTie } from "react-icons/fa6";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import BrandLogo from "../atoms/BrandLogo";

/* ══════════════════════════════════════════════════════════════
   MENU DEFINITION
══════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════
   RIPPLE HOOK
══════════════════════════════════════════════════════════════ */
function useRipple() {
  const [ripples, setRipples] = useState([]);
  const addRipple = (e, ref) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const id = Date.now();
    setRipples((p) => [
      ...p,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => setRipples((p) => p.filter((r) => r.id !== id)), 700);
  };
  const RippleLayer = () => (
    <>
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.25 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="absolute pointer-events-none rounded-full w-4 h-4"
          style={{
            left: r.x - 8,
            top: r.y - 8,
            background: "color-mix(in oklab, var(--primary) 22%, transparent)",
          }}
        />
      ))}
    </>
  );
  return { addRipple, RippleLayer };
}

/* ══════════════════════════════════════════════════════════════
   ICON BOX — compact 32×32 collapsed / 30×30 expanded
══════════════════════════════════════════════════════════════ */
function IconBox({ Icon, active, collapsed, isLocked }) {
  return (
    <div
      data-iconbox
      className={`${!active && "bg-sideIcon"} relative shrink-0 flex items-center justify-center rounded-xl transition-all duration-300 ${collapsed ? "w-[34px] h-[34px]" : "w-[30px] h-[30px]"
        }`}
      style={
        active
          ? {
            // background: "linear-gradient(135deg, var(--primary), var(--third))",
            // boxShadow: "0 3px 14px color-mix(in oklab, var(--primary) 40%, transparent)",
          }
          : {}
      }
    >
      {active && (
        <motion.span
          animate={{ x: ["-120%", "220%"] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut",
          }}
          className="absolute inset-0 w-1/2 skew-x-12 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent)",
          }}
        />
      )}
      <Icon
        className={`relative z-10 transition-colors duration-200 text-white`}
        size={14}
        strokeWidth={active ? 2.4 : 1.9}
      />
      {isLocked && (
        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white dark:border-slate-900 z-20">
          <Lock size={8} className="text-white" />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MENU ITEM
══════════════════════════════════════════════════════════════ */
function MenuItem({
  item,
  isOpen,
  isRTL,
  isActive,
  isParentActive,
  isExpanded,
  onToggle,
  onOpenSidebar,
}) {
  const t = useTranslations("sidebar");
  const ref = useRef(null);
  const { addRipple, RippleLayer } = useRipple();
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const active = isParentActive(item);
  const label = t(item.labelKey);

  const sharedClass = `
    w-full group relative flex items-center overflow-hidden
    ${isOpen ? "gap-2.5 px-2 py-[6px]" : "py-[5px] justify-center"}
    rounded-xl select-none
    transition-colors duration-150
    ${item.isLocked ? "opacity-60 cursor-not-allowed grayscale pointer-events-none" : "cursor-pointer"}
  `;

  const activeStyle = {
    background: "var(--sidebar-active-bg)",
    color: "var(--sidebar-foreground)",
  };
  const inactiveStyle = { color: "var(--sidebar-foreground)" };

  const inner = (
    <>
      <RippleLayer />

      {/* Active accent bar */}
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={`absolute ${isRTL ? "right-0" : "left-0"} top-[15%] h-[70%] w-[2.5px] rounded-full`}
            style={{
              background:
                "linear-gradient(180deg, var(--primary), var(--third))",
            }}
          />
        )}
      </AnimatePresence>

      <IconBox Icon={Icon} active={active} collapsed={!isOpen} isLocked={item.isLocked} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 6 : -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 6 : -6 }}
            transition={{ duration: 0.16 }}
            className="flex items-center justify-between flex-1 min-w-0"
          >
            <span className="text-[12.5px] font-[560] tracking-[-0.01em] whitespace-nowrap truncate leading-none">
              {label}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {item.badge && (
                <span
                  className="px-1.5 py-px text-[9px] font-bold text-white rounded-full tabular-nums"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--third), var(--primary))",
                  }}
                >
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <motion.span
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="opacity-35 inline-flex"
                >
                  <ChevronRight className="rtl:scale-x-[-1]" size={13} />
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && item.badge && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[8px] font-bold text-white rounded-full flex items-center justify-center"
          style={{ background: "var(--third)" }}
        >
          {item.badge}
        </span>
      )}
    </>
  );

  const wrappedInTooltip = (trigger) => {
    const labelToDisplay = item.isLocked ? `${label} (${t("locked")})` : label;
    if (isOpen) {
      if (item.isLocked) {
        return (
          <Tooltip delayDuration={80}>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent
              side={isRTL ? "left" : "right"}
              className="text-[12px] font-semibold px-2.5 py-1.5 rounded-xl text-white border-none bg-red-500 shadow-lg shadow-red-500/20"
            >
              {t("subscription_required")}
            </TooltipContent>
          </Tooltip>
        );
      }
      return trigger;
    }
    return (
      <Tooltip delayDuration={80}>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent
          side={isRTL ? "left" : "right"}
          className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-xl text-white border-none ${item.isLocked ? 'bg-red-500 shadow-lg shadow-red-500/20' : ''}`}
          style={!item.isLocked ? {
            background: "linear-gradient(135deg, var(--primary), var(--third))",
            boxShadow:
              "0 4px 16px color-mix(in oklab, var(--primary) 30%, transparent)",
          } : {}}
        >
          {item.isLocked ? t("subscription_required") : label}
        </TooltipContent>
      </Tooltip>
    );
  };

  if (hasChildren) {
    return wrappedInTooltip(
      <button
        ref={ref}
        onClick={(e) => {
          addRipple(e, ref);
          if (!isOpen) onOpenSidebar?.();
          else onToggle(item.href);
        }}
        className={sharedClass}
        style={active ? activeStyle : inactiveStyle}
        onMouseEnter={(e) => {
          if (!active)
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "transparent";
        }}
      >
        {inner}
      </button>,
    );
  }

  return wrappedInTooltip(
    <Link
      ref={ref}
      href={item.href}
      onClick={(e) => {
        addRipple(e, ref);
        if (!isOpen) {
          e.preventDefault();
          onOpenSidebar?.();
        }
      }}
      className={sharedClass}
      style={active ? activeStyle : inactiveStyle}
      onMouseEnter={(e) => {
        if (!active)
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {inner}
    </Link>,
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB ITEM — compact
══════════════════════════════════════════════════════════════ */
function SubItem({ child, isActive, isRTL, index }) {
  const t = useTranslations("sidebar");
  const Icon = child.icon;
  const active = isActive(child.href);

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 8 : -8 }}
      transition={{ delay: index * 0.03, duration: 0.16 }}
    >
      <Link
        href={child.href}
        className={`
          relative flex items-center gap-2 py-[5.5px] rounded-xl
          transition-all duration-150 group overflow-hidden
          ${isRTL ? "pr-2.5 pl-1.5" : "pl-2.5 pr-1.5"}
        `}
        style={
          active
            ? {
              background: "var(--sidebar-active-bg)",
              color: "var(--sidebar-foreground)",
              fontWeight: 600,
            }
            : { color: "var(--sidebar-foreground)" }
        }
        onMouseEnter={(e) => {
          if (!active)
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "transparent";
        }}
      >
        <span
          className={`absolute ${isRTL ? "right-0" : "left-0"} top-[20%] h-[60%] w-[2px] rounded-full transition-all duration-200`}
          style={{
            background: active
              ? "linear-gradient(180deg, var(--primary), var(--third))"
              : "transparent",
          }}
        />

        <span
          className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-200"
          style={
            active
              ? {
                background: "rgba(255, 255, 255, 0.1)",
                // boxShadow: "0 2px 8px color-mix(in oklab, var(--primary) 30%, transparent)",
              }
              : {
                background: "rgba(255, 255, 255, 0.05)",
              }
          }
        >
          <Icon
            className={`transition-colors text-white`}
            size={11}
            strokeWidth={active ? 2.4 : 1.9}
          />
        </span>

        <span className="text-[12px] leading-none whitespace-nowrap flex-1 truncate font-[500]">
          {t(child.labelKey)}
        </span>

        {active && (
          <motion.span
            layoutId="childActivePill"
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background:
                "linear-gradient(180deg, var(--primary), var(--third))",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
          />
        )}
      </Link>
    </motion.div>
  );
}
export const excludedSubcriptionPaths = ["/plans", "/wallet", "/onboarding"];
const Sidebar = ({ isOpen, isRTL, onOpenSidebar, isMobile }) => {

  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [currentSearch, setCurrentSearch] = useState(() =>
    typeof window !== "undefined" ? window.location.search : "",
  );

  const t = useTranslations("header");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setCurrentSearch(window.location.search);
    window.addEventListener("popstate", sync);
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args) => {
      origPush(...args);
      sync();
    };
    history.replaceState = (...args) => {
      origReplace(...args);
      sync();
    };
    return () => {
      window.removeEventListener("popstate", sync);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  const router = useRouter();
  const { user, isLoading: isLoadingUser, isSuperAdmin, hasActiveSubscription, hasPermission } = useAuth();
  const userRole = user?.role?.name?.toUpperCase();


  const isActive = useCallback(
    (href) => {
      const [hrefPath, hrefQuery] = href.split("?");
      const pathMatch = pathname === hrefPath || pathname.endsWith(hrefPath);
      if (!hrefQuery) return pathMatch;
      const currentParams = new URLSearchParams(currentSearch);
      const hrefParams = new URLSearchParams(hrefQuery);
      for (const [key, val] of hrefParams.entries()) {
        if (currentParams.get(key) !== val) return false;
      }
      return pathMatch;
    },
    [pathname, currentSearch],
  );

  const isParentActive = useCallback(
    (item) =>
      item.children?.length
        ? isActive(item.href) || item.children.some((c) => isActive(c.href))
        : isActive(item.href),
    [isActive],
  );
  const { shippingCompanies } = usePlatformSettings();

  const menuItems = useMemo(() => [
    {
      icon: LayoutDashboard,
      labelKey: "dashboard",
      href: "/dashboard",
      roles: ["ADMIN"],
      permission: "dashboard.read",
    },
    {
      icon: Headset,
      labelKey: "callCenter",
      href: "/call-center",
      roles: ["ADMIN"],
      permission: "orders.read",
    },
    {
      icon: PackageCheck,
      labelKey: "orders-assign-to-you",
      href: "/orders/employee-orders",
      permission: "orders.read",
      notRoles: ["ADMIN", "SUPER_ADMIN"],
    },
    {
      icon: ShoppingCart,
      labelKey: "orders",
      href: "/orders",
      roles: ["ADMIN"],
      permission: "orders.read",
      children: [
        { icon: Package, labelKey: "orders", href: "/orders?tab=orders" },
        // {
        //   icon: Undo2,
        //   labelKey: "orderReplacement",
        //   href: "/orders?tab=replacement",
        // },
        {
          icon: XCircle,
          labelKey: "warehouseRejected",
          href: "/orders?tab=rejected",
        },
        {
          icon: RefreshCcw,
          labelKey: "failedOrders",
          href: "/orders?tab=failedOrders",
        },
      ],
    },

    {
      icon: Warehouse,
      labelKey: "manageWarehouse",
      href: "/warehouse",
      roles: ["ADMIN"],
      permission: "warehouses.read",
      children: [
        ...(shippingCompanies?.length !== 1 ? [{
          icon: Truck,
          labelKey: "warehouseDistribution",
          href: "/warehouse?tab=distribution",
        }] : []),
        {
          icon: Printer,
          labelKey: "warehousePrint",
          href: "/warehouse?tab=print",
        },
        {
          icon: Package,
          labelKey: "warehousePreparation",
          href: "/warehouse?tab=preparation",
        },
        {
          icon: CheckCircle2,
          labelKey: "warehouseOutgoing",
          href: "/warehouse?tab=outgoing",
        },
        {
          icon: RefreshCw,
          labelKey: "warehouseReturns",
          href: "/warehouse?tab=returns",
        },
        // {
        //   icon: XCircle,
        //   labelKey: "warehouseRejected",
        //   href: "/warehouse?tab=rejected",
        // },
        {
          icon: ClipboardList,
          labelKey: "warehouseLogs",
          href: "/warehouse?tab=logs",
        },
      ],
    },
    {
      icon: Package,
      labelKey: "products",
      href: "/products",
      roles: ["ADMIN"],
      permission: "products.read",
      children: [
        { icon: Package, labelKey: "products", href: "/products" },
        { icon: PackagePlus, labelKey: "newProduct", href: "/products/new" },
        { icon: Layers, labelKey: "newBundle", href: "/bundles/new" },
        { icon: Package, labelKey: "categories", href: "/products/categories" },

      ],
    },
    {
      icon: Factory,
      labelKey: "suppliers",
      href: "/suppliers",
      roles: ["ADMIN"],
      permission: "suppliers.read",
      children: [
        { icon: Factory, labelKey: "suppliers", href: "/suppliers" },
        {
          icon: FolderTree,
          labelKey: "categories",
          href: "/suppliers/categories",
        },
      ],
    },
    {
      icon: FileText,
      labelKey: "purchases",
      href: "/purchases",
      roles: ["ADMIN"],
      permission: "purchases.read",
      children: [
        { icon: FileText, labelKey: "purchases", href: "/purchases" },
        { icon: PackagePlus, labelKey: "newPurchase", href: "/purchases/new" },
        { icon: Undo2, labelKey: "purchasesReturn", href: "/purchases/return" },
        { icon: PackagePlus, labelKey: "newPurchaseReturn", href: "/purchases/return/new" },
      ],
    },

    // { icon: TrendingUp, labelKey: 'sales', href: '/sales', roles: ['ADMIN'] },
    {
      icon: Truck,
      labelKey: "shippingCompanies",
      href: "/shipping-companies",
      roles: ["ADMIN"],
      permission: "shipping-companies.read",
    },
    {
      icon: Plug,
      labelKey: "storeIntegration",
      href: "/store-integration",
      roles: ["ADMIN"],
      permission: "stores.read",
    },
    {
      icon: BarChart3,
      labelKey: "reports",
      href: "/reports",
      roles: ["ADMIN"],
      permission: "dashboard.read",
      children: [
        {
          icon: PieChart,
          labelKey: "order-analysis",
          href: "/reports/order-analysis",
        },
        {
          icon: Activity,
          labelKey: "employee-performance-analysis",
          href: "/reports/employee-performance-analysis",
        },
      ],
    },

    {
      icon: Wallet,
      labelKey: "accounts",
      href: "/collections",
      roles: ["ADMIN"],
      permission: "orders-collect.read",
      children: [
        {
          icon: Receipt,
          labelKey: "accounts",
          href: "/accounts?tab=overview",
        },
        {
          icon: CheckCircle2,
          labelKey: "collectedOrders",
          href: "/orders/collections?tab=collected",
        },
        {
          icon: AlertCircle,
          labelKey: "uncollectedOrders",
          href: "/orders/collections?tab=not_collected",
        },
      ],
    },
    { icon: Wallet, labelKey: "wallet", href: "/wallet", roles: ["ADMIN"], permission: "wallet.read" },
    { icon: CreditCard, labelKey: "plans", href: "/plans", roles: ["ADMIN"], permission: "plans.read" },
    {
      icon: FaUserTie,
      labelKey: "employees",
      href: "/employees",
      roles: ["ADMIN"],
      permission: "users.read",
    },
    { icon: Shield, labelKey: "roles", href: "/roles", roles: ["ADMIN"], permission: "roles.read" },
    { icon: Settings, labelKey: "settings", href: "/settings", roles: ["ADMIN"], permission: "admin-settings.read" },
    {
      icon: Users,
      labelKey: "users",
      href: "/dashboard/users",
      roles: ["SUPER_ADMIN"],
    },
    {
      icon: Shield,
      labelKey: "roles",
      href: "/dashboard/roles",
      roles: ["SUPER_ADMIN"],
    },
    {
      icon: CreditCard,
      labelKey: "plans",
      href: "/dashboard/plans",
      roles: ["SUPER_ADMIN"],
    },
    {
      icon: Globe,
      labelKey: "platformSettings",
      href: "/dashboard/settings",
      roles: ["SUPER_ADMIN"],
    },

  ], [shippingCompanies]);

  useEffect(() => {
    const active = menuItems.find((item) =>
      item.children?.some((c) => isActive(c.href)),
    );
    if (active) setExpandedItems((prev) => new Set([...prev, active.href]));
  }, [pathname, currentSearch, isActive]);

  const filteredItems = useMemo(() => {
    if (!user) return [];

    const userRole = user.role?.name;

    return menuItems.filter((item) => {
      // 1. Check Roles
      if (item.notRoles?.length) {
        return !item.notRoles.includes(userRole?.toUpperCase());
      }

      const hasRole = !item.roles?.length || item.roles.includes(userRole?.toUpperCase());
      if (!hasRole) return false;

      // 2. Check Permissions
      if (!hasPermission(item.permission)) {
        return false;
      }

      return true;
    }).map(item => {
      // 3. Handle Subscription Locking
      // Wallet and Plans are always unlocked. Super Admin is always unlocked.
      const isExempt = excludedSubcriptionPaths.some(path => item.href.startsWith(path));
      const isLocked = !isSuperAdmin && !hasActiveSubscription && !isExempt;

      return {
        ...item,
        isLocked
      };
    });
  }, [user]);

  const toggleExpanded = (href) =>
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(href) ? next.delete(href) : next.add(href);
      return next;
    });

  const sidebarWidth = 260;
  const collapsedWidth = 68;

  const variants = {
    mobile: {
      open: { x: 0, opacity: 1 },
      closed: { x: isRTL ? "100%" : "-100%", opacity: 0 },
    },
    desktop: {
      open: { width: sidebarWidth, opacity: 1, x: 0 },
      closed: { width: collapsedWidth, opacity: 1, x: 0 },
    },
  };


  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={isMobile ? (isOpen ? "open" : "closed") : (isOpen ? "open" : "closed")}
        variants={isMobile ? variants.mobile : variants.desktop}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}

        className={`
          fixed  top-0 ${isRTL ? "right-0" : "left-0"}
          h-screen flex flex-col overflow-hidden z-[100002] bg-sidebar dark:bg-card ${isRTL ? "border-l" : "border-r"} border-border`}


        style={{
          boxShadow: isOpen
            ? "rgba(50,50,93,.14) 0px 20px 60px -12px, rgba(0,0,0,.14) 0px 14px 36px -24px"
            : "rgba(50,50,93,.08) 0px 10px 30px -6px",
          width: isMobile ? sidebarWidth : undefined
        }}
      >
        {/* Logo block — same height as header (56px = h-14) */}
        {/* <SidebarLogo isOpen={isOpen} /> */}
        <motion.div
          className={`${(!isOpen && !isMobile) ? "mx-auto pe-[7px] " : "px-4 flex items-center justify-between gap-3 "} py-[11.6px]`}
          whileTap={{ scale: 0.92 }}
        >
          <div className="flex items-center gap-3">
            {!isMobile && (
              <Button
                onClick={onOpenSidebar}
                variant="ghost"
                className={`p-0 rounded-xl bg-sideIcon text-white transition-all duration-300 hover:bg-white/10 hover:text-white ${isOpen ? "w-[30px] h-[30px]" : "w-[34px] h-[34px]"
                  }`}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isOpen ? "close" : "open"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    {isOpen ? <X size={15} /> : <Menu size={15} />}
                  </motion.span>
                </AnimatePresence>
              </Button>
            )}

            {(isOpen || isMobile) && (
              <div className={`flex items-center gap-2.5 `}>
                <BrandLogo />
              </div>
            )}
          </div>

          {isMobile && (
            <Button
              onClick={onOpenSidebar}
              variant="ghost"
              className="h-8 w-8 p-0 rounded-xl text-white hover:text-white hover:bg-white/10 lg:hidden"
            >
              <X size={18} />
            </Button>
          )}
        </motion.div>

        <div className="w-full h-[1px] bg-border/70 mx-0.5" />

        {/* Nav — scrollable middle */}
        <nav
          dir={isRTL ? "rtl" : "ltr"}

          className={`flex-1 pt-1.5 overflow-y-auto overflow-x-hidden px-2 pb-2 space-y-px thin-scroll `}
        >
          {filteredItems.map((item, i) => {
            const hasChildren = Boolean(item.children?.length);
            const expanded = expandedItems.has(item.href);

            return (
              <div key={`${item.href}-${i}`} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.018, duration: 0.18 }}
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

                <AnimatePresence initial={false}>
                  {hasChildren && expanded && isOpen && (
                    <motion.div
                      key="sub"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        dir={isRTL ? "rtl" : "ltr"}
                        className={`${isRTL ? "pr-3.5 pl-1" : "pl-3.5 pr-1"} pt-0.5 pb-1 space-y-px`}
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
      </motion.aside>
    </TooltipProvider >
  );
};

export default Sidebar;
