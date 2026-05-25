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
  AlertTriangle,
  Store,
  FileSearch,
  Vault,
  CheckSquare,
  Clock,
  Landmark,
  DollarSign,
} from "lucide-react";
import { FaBugs, FaUserTie } from "react-icons/fa6";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import BrandLogo from "../atoms/BrandLogo";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import { FaBolt, FaBug, FaChartPie, FaClock, FaListAlt, FaPlus, FaRegFileAlt, FaWhatsapp } from "react-icons/fa";

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
        className={`relative z-10 transition-colors duration-200 ${active ? "text-primary" : "text-sidebar-foreground"}`}
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
    transition-all duration-150
    ${item.isLocked ? "opacity-60 cursor-not-allowed grayscale pointer-events-none" : "cursor-pointer"}
    ${!active && "hover:bg-sidebar-foreground/20"}
  `;

  const activeStyle = {
    background: "var(--sidebar-active-bg)",
    color: "var(--primary)",
    fontWeight: 700,
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
          ${!active && "hover:bg-sidebar-foreground/5"}
        `}
        style={
          active
            ? {
              background: "var(--sidebar-active-bg)",
              color: "var(--primary)",
              fontWeight: 700,
            }
            : { color: "var(--sidebar-foreground)" }
        }
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
                background: "var(--sidebar-active-bg)",
              }
              : {
                background: "var(--sideIcon)",
              }
          }
        >
          <Icon
            className={`transition-colors ${active ? "text-primary" : "text-sidebar-foreground"}`}
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
  const { isDirectShippingEnabled } = useOrdersSettings();


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
      // roles: ["ADMIN"],
      permission: "dashboard.read",
    },
    {
      icon: Headset,
      labelKey: "callCenter",
      href: "/call-center",
      // roles: ["ADMIN"],
      permission: "orders.distribution",
    },
    {
      icon: PackageCheck,
      labelKey: "orders-assign-to-you",
      href: "/orders/employee-orders",
      permission: "orders.confirm-incoming",
      notRoles: ["ADMIN", "SUPER_ADMIN"],
    },
    {
      icon: ShoppingCart,
      labelKey: "orders",
      href: "/orders",
      // roles: ["ADMIN"],
      permission: "orders.read",
      children: [
        { icon: Package, labelKey: "orders", permission: "orders.read", href: "/orders?tab=orders" },
        {
          icon: FileSearch,
          labelKey: "ordersUnderReview",
          href: "/orders?tab=ordersUnderReview",
        },
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
          labelKey: "pendingOrders",
          href: "/orders?tab=failedOrders",
        },
      ],
    },

    //show to /warehouse?tab=distribution if isDirectShippingEnabled enable
    (isDirectShippingEnabled
      ? {
        icon: Truck,
        labelKey: "warehouseDistribution", // "توزيع الطلبات"
        href: "/warehouse?tab=distribution",
        children: [
          {
            icon: Truck,
            labelKey: "warehouseDistribution",
            href: "/warehouse?tab=distribution",
          },
          {
            icon: ClipboardList,
            labelKey: "warehouseLogs",
            href: "/warehouse?tab=logs",
          },
        ],
      }
      : {
        icon: Warehouse,
        labelKey: "manageWarehouse",
        href: "/warehouse",
        permission: "warehouses.read",
        children: [
          {
            icon: Truck,
            labelKey: "warehouseDistribution",
            href: "/warehouse?tab=distribution",
          },
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
          {
            icon: ClipboardList,
            labelKey: "warehouseLogs",
            href: "/warehouse?tab=logs",
          },
        ],
      }),
    {
      icon: Package,
      labelKey: "products",
      href: "/products",
      // roles: ["ADMIN"],
      // permission: "products.read",
      children: [
        { icon: Package, labelKey: "products", permission: "products.read", href: "/products" },
        { icon: PackagePlus, labelKey: "newProduct", permission: "products.read", href: "/products/new" },
        { icon: Layers, labelKey: "newBundle", permission: "products.read", href: "/bundles/new" },
        { icon: Package, labelKey: "categories", permission: "categories.read", href: "/products/categories" },
      ],
    },

    {
      icon: Plug,
      labelKey: "synchronization",
      href: "/shipping-companies",
      children: [
        {
          icon: Truck,
          labelKey: "shippingCompanies",
          permission: "shipping-companies.read",
          href: "/shipping-companies",
        },
        {
          icon: Store,
          labelKey: "stores",
          permission: "stores.read",
          href: "/store-integration",
        },
        {
          icon: AlertTriangle,
          labelKey: "syncFailures",
          permission: "stores.read",
          href: "/store-integration/sync-failures",
        },
      ],
    },
    {
      labelKey: "upsell",
      href: "/upsells",
      icon: FaChartPie,
      permission: "upsells.read",
    },
    {
      icon: FaWhatsapp,
      labelKey: "whatsapp",
      href: "/whatsapp",
      children: [
        // {
        //   labelKey: "overview",
        //   href: "/whatsapp",
        //   icon: FaChartPie, // أو أي أيقونة dashboard
        // },
        {
          labelKey: "whatsAppAccounts",
          href: "/whatsapp/accounts",
          icon: FaWhatsapp,
        },
        {
          labelKey: "templates",
          href: "/whatsapp/templates",
          icon: FaRegFileAlt,
        },

      ]
    },
    {
      icon: FaBolt,
      labelKey: "automations",
      href: "/automations",
      children: [
        {
          labelKey: "automations",
          href: "/automations",
          icon: FaBolt,
        },
        {
          labelKey: "automationLogs",
          href: "/automations/logs",
          icon: FaListAlt,
        },
        {
          labelKey: "runningAutomations",
          href: "/automations/running",
          icon: FaClock,
        }
      ]
    },
    {
      icon: BarChart3,
      labelKey: "reports",
      href: "/reports",
      // roles: ["ADMIN"],
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
        {
          icon: Truck,
          labelKey: "shippingReport",
          href: "/reports/shipping",
        }
      ],
    },

    {
      icon: Wallet,
      labelKey: "accounts",
      href: "/collections",
      // roles: ["ADMIN"],
      permission: "orders-collect.read",
      children: [
        {
          icon: Wallet, // 💼 accounts = money management
          labelKey: "accounts",
          href: "/accounts?tab=overview",
        },
        {
          icon: Landmark, // 🏦 safes = physical/secure storage
          labelKey: "safes",
          href: "/accounts?tab=safes",
        },
        {
          icon: CheckSquare, // ✅ collected = done/confirmed
          labelKey: "collectedOrders",
          href: "/orders/collections?tab=collected",
        },
        {
          icon: Clock, // ⏳ uncollected = pending
          labelKey: "uncollectedOrders",
          href: "/orders/collections?tab=not_collected",
        },
      ],
    },
    {
      icon: Factory,
      labelKey: "administration",
      href: "/suppliers",
      children: [
        {
          icon: Factory,
          labelKey: "suppliers",
          permission: "suppliers.read",
          href: "/suppliers",
        },
        {
          icon: FileText,
          labelKey: "purchases",
          permission: "purchases.read",
          href: "/purchases",
        },
        { icon: PackagePlus, labelKey: "newPurchase", permission: "purchases.read", href: "/purchases/new" },
        { icon: Undo2, labelKey: "purchasesReturn", permission: "purchase_returns.read", href: "/purchases/return" },
        { icon: PackagePlus, labelKey: "newPurchaseReturn", permission: "purchase_returns.read", href: "/purchases/return/new" },
      ],
    },
    {
      icon: DollarSign,
      labelKey: "finance",
      href: "/wallet",
      children: [
        {
          icon: Wallet,
          labelKey: "wallet",
          roles: ["ADMIN"],
          permission: "wallet.read",
          href: "/wallet",
        },
        {
          icon: CreditCard,
          labelKey: "plans",
          roles: ["ADMIN"],
          permission: "plans.read",
          href: "/plans",
        },
      ],
    },
    {
      icon: Users,
      labelKey: "team",
      href: "/employees",
      children: [
        {
          icon: FaUserTie,
          labelKey: "employees",
          permission: "users.read",
          href: "/employees",
        },
        {
          icon: Shield,
          labelKey: "roles",
          permission: "roles.read",
          href: "/roles",
        },
      ],
    },
    {
      icon: Settings,
      labelKey: "settings",
      href: "/settings",
      //  roles: ["ADMIN"],
      permission: "admin-settings.read"
    },
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
    {
      icon: FaWhatsapp,
      labelKey: "whatsapp",
      href: "/dashboard/whatsapp",
      roles: ["SUPER_ADMIN"],
      children: [
        {
          labelKey: "templates",
          href: "/dashboard/whatsapp/templates",
          icon: FaRegFileAlt,
          roles: ["SUPER_ADMIN"],
        },
        {
          labelKey: "addTemplate",
          href: "/dashboard/whatsapp/templates/add",
          icon: FaPlus,
          roles: ["SUPER_ADMIN"],
        }]
    },
    {
      icon: FaBolt,
      labelKey: "automations",
      href: "/dashboard/automations",
      roles: ["SUPER_ADMIN"],
      children: [
        {
          labelKey: "automations",
          href: "/dashboard/automations",
          icon: FaBolt,
          roles: ["SUPER_ADMIN"],
        },
        {
          labelKey: "addAutomation",
          href: "/dashboard/automations/builder",
          icon: FaPlus,
          roles: ["SUPER_ADMIN"],
        }
      ]
    },
    {
      icon: FaBugs,
      labelKey: "systemErrors",
      href: "/dashboard/errors",
      roles: ["SUPER_ADMIN"],
    }

  ], [shippingCompanies, isDirectShippingEnabled]);

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

      const role = userRole?.toUpperCase();

      // ✅ SPECIAL RULE: SUPER_ADMIN sees ONLY explicitly allowed items
      if (role === 'SUPER_ADMIN') {
        return item.roles?.includes('SUPER_ADMIN');
      }

      // 1. Check Roles
      if (item.notRoles?.length) {
        return !item.notRoles.includes(userRole?.toUpperCase());
      }

      const hasRole = !item.roles?.length || item.roles.includes(userRole?.toUpperCase());
      if (!hasRole) return false;

      // 2. Check Permissions
      if (item.permission) {
        return hasPermission(item.permission);
      }

      // Case B: item has children → check at least one child
      if (item.children?.length) {
        return item.children.some((child) =>
          hasPermission(child.permission)
        );
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
  }, [user, menuItems]);

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
          h-screen flex flex-col overflow-hidden z-[30] bg-sidebar dark:bg-card ${isRTL ? "border-l" : "border-r"} border-border`}


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
          <div className="flex items-center justify-between gap-3 flex-1">
            {!isMobile && (
              <Button
                onClick={onOpenSidebar}
                variant="ghost"
                className={`p-0 rounded-xl bg-sideIcon text-sidebar-foreground transition-all duration-300 hover:bg-sidebar-foreground/10 ${isOpen ? "w-[30px] h-[30px]" : "w-[34px] h-[34px]"
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
                <BrandLogo className="text-[#672DAD]" />
              </div>
            )}
          </div>

          {isMobile && (
            <Button
              onClick={onOpenSidebar}
              variant="ghost"
              className="h-8 w-8 p-0 rounded-xl text-sidebar-foreground hover:bg-sidebar-foreground/10 lg:hidden"
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
