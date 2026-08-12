"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import api from "@/utils/api";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import GettingStartedTutorial from "@/app/[locale]/getting-started/atoms/GettingStartedTutorial";
import {
  CreditCard,
  Package,
  Warehouse,
  Boxes,
  ShoppingCart,
  Truck,
  MessageCircle,
  Store,
  Users,
  Zap,
  Vault,
  ShoppingBag,
  Factory,
  Workflow,
  PackagePlus,
  UserCog,
} from "lucide-react";

const ACHIEVEMENT_ICONS = {
  first_product_created: Package,
  first_warehouse_created: Warehouse,
  first_warehouse_stock_created: Boxes,
  first_order_created: ShoppingCart,
  shipping_integration_connected: Truck,
  whatsapp_connected: MessageCircle,
  store_connected: Store,
  first_team_member_created: Users,
  first_automation_created: Zap,
  first_safe_created: Vault,
  first_purchase_accepted: ShoppingBag,
  first_supplier_created: Factory,
  first_order_assignment_automation_rule_created: Workflow,
  first_order_bundle_created: PackagePlus,
  first_custom_role_created: UserCog,
};

function stripLocale(pathname) {
  if (!pathname) return "/";
  const stripped = pathname.replace(/^\/(en|ar)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

// Sidebar-item targets only exist in the DOM while the sidebar is expanded.
// Mirror LayoutShell's own expand path (localStorage flag + sidebarChange
// event) so a sidebar_item tour step can reveal its target on demand.
function ensureSidebarOpen() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("ui_sidebar") === "expanded") return;
  localStorage.setItem("ui_sidebar", "expanded");
  window.dispatchEvent(new Event("sidebarChange"));
}

// Expand the sidebar section whose child carries the given getting-started
// key (e.g. whatsapp.accounts) so its sub-item actually renders in the DOM.
function expandSidebarItem(key) {
  if (typeof window === "undefined" || !key) return;

  window.dispatchEvent(
    new CustomEvent("getting-started:expand-sidebar-item", { detail: { key } }),
  );
}

// LINK targets navigate through the link's own click behavior, so the tour
// must NOT manually push the target page (that would race the link's own
// navigation and cause a double route change).
function isLinkTarget(target) {
  return target?.type?.toUpperCase() === "LINK";
}

const GettingStartedContext = createContext();

export function GettingStartedProvider({ children }) {
  const [rawItems, setRawItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken } = useAuth();
  const { subscribe } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const prevStepKeyRef = useRef(null); // 👈 track previous step key
  const lastViewedStepKeyRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarStack, setSidebarStack] = useState([]);

  // ── Tour engine state ──
  const [activeKey, setActiveKey] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [targetResolved, setTargetResolved] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Guards the reopen (below) from clicking the opening target twice for the
  // same step visit (e.g. when pathname changes right after the click).
  const reopenClickedRef = useRef(false);

  const rawItemsRef = useRef(rawItems);

  useEffect(() => {
    rawItemsRef.current = rawItems;
  }, [rawItems]);

  const fetchItems = useCallback(async () => {
    if (!accessToken) return;

    if (rawItemsRef.current.length === 0) {
      setIsLoading(true);
    }

    try {
      const res = await api.get("/getting-started/items");
      const data = Array.isArray(res.data) ? res.data : [];
      setRawItems(data);
    } catch (error) {
      console.error("Failed to fetch getting started items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const unsubscribe = subscribe("GETTING_STARTED_ACHIEVEMENT", () => {
      fetchItems();
    });
    return () => unsubscribe();
  }, [subscribe, fetchItems]);

  const logEvent = useCallback(async ({ itemId, type, stepId, stepKey }) => {
    try {
      const res = await api.post("/getting-started/events", {
        itemId,
        type,
        stepId,
        stepKey,
      });
      return res.data;
    } catch (error) {
      console.error("Failed to log getting started event:", error);
      return null;
    }
  }, []);

  const items = useMemo(() => {
    return rawItems.map((item) => ({
      ...item,
      icon: ACHIEVEMENT_ICONS[item.completionType] || CreditCard,
    }));
  }, [rawItems]);

  const itemsByKey = useMemo(() => {
    const map = {};
    for (const item of items) {
      map[item.key] = item;
    }
    return map;
  }, [items]);

  const stepsByItemKey = useMemo(() => {
    const map = {};
    for (const item of items) {
      map[item.key] = Array.isArray(item.steps) ? item.steps : [];
    }
    return map;
  }, [items]);

  const completedKeys = useMemo(() => {
    return items
      .filter((item) => item.completed === true)
      .map((item) => item.key);
  }, [items]);

  const completedSet = useMemo(() => new Set(completedKeys), [completedKeys]);

  const achievementPercent = useMemo(() => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(
      (item) => item.completed === true,
    ).length;
    return Math.round((completedCount / items.length) * 100);
  }, [items]);

  const totalCompleted = useMemo(
    () => items.filter((item) => item.completed === true).length,
    [items],
  );

  const getItemByKey = useCallback(
    (key) => itemsByKey[key] || null,
    [itemsByKey],
  );

  const areAllDependenciesCompleted = useCallback(
    (dependsOn = []) => {
      if (!Array.isArray(dependsOn) || dependsOn.length === 0) return true;
      return dependsOn.every((key) => completedSet.has(key));
    },
    [completedSet],
  );

  const getDependenciesForItem = useCallback(
    (itemKey) => {
      const item = itemsByKey[itemKey];
      if (
        !item ||
        !Array.isArray(item.dependsOn) ||
        item.dependsOn.length === 0
      ) {
        return [];
      }
      return item.dependsOn.map((depKey) => itemsByKey[depKey]).filter(Boolean);
    },
    [itemsByKey],
  );

  const canStartItem = useCallback(
    (item) => {
      if (!item) return false;
      if (item.completed === true) return true;
      return areAllDependenciesCompleted(item.dependsOn);
    },
    [areAllDependenciesCompleted],
  );

  const openSidebarForItem = useCallback((itemKey) => {
    setSidebarStack([itemKey]);
    setSidebarOpen(true);
  }, []);

  const pushSidebarItem = useCallback((itemKey) => {
    setSidebarStack((prev) => [...prev, itemKey]);
  }, []);

  const popSidebarItem = useCallback(() => {
    setSidebarStack((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSidebarStack([]);
  }, []);

  const currentSidebarItemKey = useMemo(
    () => sidebarStack[sidebarStack.length - 1] || null,
    [sidebarStack],
  );

  const sidebarDepth = useMemo(() => sidebarStack.length, [sidebarStack]);

  // ── Tour engine ──
  const activeItem = useMemo(
    () => (activeKey ? itemsByKey[activeKey] : null),
    [activeKey, itemsByKey],
  );

  const tourSteps = useMemo(
    () => (Array.isArray(activeItem?.steps) ? activeItem.steps : []),
    [activeItem],
  );

  const currentStepData = tourSteps[currentStep] || null;

  const navigateToStepPage = useCallback(
    (page, key) => {
      if (!page) return;
      if (key && document.querySelector(`[data-getting-started="${key}"]`)) {
        return;
      }
      const current = stripLocale(pathname);
      if (current !== page) {
        router.push(`/${locale}${page}`);
      }
    },
    [pathname, router, locale],
  );

  const goToStep = useCallback(
    (index) => {
      const steps = Array.isArray(activeItem?.steps) ? activeItem.steps : [];
      if (!steps.length) return;
      const clamped = Math.max(0, Math.min(index, steps.length - 1));
      setCurrentStep(clamped);
      reopenClickedRef.current = false;
      const target = steps[clamped];

      if (target?.target?.page && !isLinkTarget(target.target)) {
        navigateToStepPage(target.target.page, target.target.key);
      }
    },
    [activeItem, navigateToStepPage],
  );

  const finishTour = useCallback(() => {
    prevStepKeyRef.current = currentStepData?.key;
    if (activeItem?.id) {
      logEvent({ itemId: activeItem.id, type: "get_started_finished" });
    }
    setTourOpen(false);
    setActiveKey(null);
    setCurrentStep(0);
  }, [currentStep, activeItem, logEvent]);

  const nextStep = useCallback(() => {
    prevStepKeyRef.current = currentStepData?.key;
    const steps = Array.isArray(activeItem?.steps) ? activeItem.steps : [];
    if (!steps.length) return;
    if (currentStep >= steps.length - 1) {
      finishTour();
    } else {
      goToStep(currentStep + 1);
    }
  }, [activeItem, currentStep, goToStep, finishTour]);

  const prevStep = useCallback(() => {
    prevStepKeyRef.current = currentStepData?.key;
    if (currentStep > 0) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const skipTour = useCallback(() => {
    prevStepKeyRef.current = currentStepData?.key;
    const key = currentStepData?.key;
    if (activeItem?.id) {
      logEvent({ itemId: activeItem.id, type: "get_started_skipped", stepKey: key });
    }
    setTourOpen(false);
    setActiveKey(null);
    setCurrentStep(0);
  }, [currentStep, activeItem, logEvent]);

  const handleTargetInteraction = useCallback(() => {
    const steps = Array.isArray(activeItem?.steps) ? activeItem.steps : [];
    const step = steps[currentStep];
    if (step?.actionConfig?.trigger === "click") {
      nextStep();
    }
  }, [activeItem, currentStep, nextStep]);

  const startTour = useCallback(
    async (item) => {
      if (!item) return null;
      reopenClickedRef.current = false;
      lastViewedStepKeyRef.current = null;
      setActiveKey(item.key);
      setCurrentStep(0);
      setTourOpen(true);
      await logEvent({
        itemId: item.id,
        type: "get_started_item_opened",
      });
      const firstStep =
        Array.isArray(item.steps) && item.steps.length ? item.steps[0] : null;
      if (firstStep?.target?.page && !isLinkTarget(firstStep.target)) {
        navigateToStepPage(firstStep.target.page, firstStep.target.key);
      } else {
        // No target page (e.g. a sidebar item) — assume we are already on the
        // correct page. Reveal the sidebar target and show the tour popup now.
        if (firstStep?.target?.type?.toUpperCase() === "SIDEBAR_ITEM") {
          ensureSidebarOpen();
          expandSidebarItem(firstStep.target.key);
        }
        setTargetResolved(true);
      }
      return {
        success: true,
        itemKey: item.key,
      };
    },
    [logEvent, pathname, router, locale, navigateToStepPage],
  );

  const isTourActive =
    tourOpen && !!activeItem && tourSteps.length > 0 && !!currentStepData;

  // Only show the popup once the current step's target exists in the DOM,
  // so it never flashes before the target page has finished navigating/rendering.
  useEffect(() => {
    if (!isTourActive || !currentStepData?.target) {
      setTargetResolved(false);
      return;
    }

    let cancelled = false;
    setTargetResolved(false);

    const key = currentStepData.target.key;
    const selector = `[data-getting-started="${key}"]`;
    const found = () => document.querySelector(selector);

    // A sidebar_item target only renders while the sidebar is expanded and its
    // parent section is open. Reveal it on demand so the target appears and
    // the observer below can resolve it.
    if (currentStepData.target.type?.toUpperCase() === "SIDEBAR_ITEM") {
      ensureSidebarOpen();
      expandSidebarItem(currentStepData.target.key);
    }

    if (found()) {
      setTargetResolved(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (found()) {
        observer.disconnect();
        if (!cancelled) setTargetResolved(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      observer.disconnect();
      if (!cancelled) setTargetResolved(true);
    }, 10000);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [
    isTourActive,
    currentStep,
    currentStepData?.target?.key,
    currentStepData?.target?.type,
  ]);

  // Reopen missing step targets (e.g. a dialog that was closed) when the step
  // configures actionConfig.openFromPreviousStep: navigate to its page, click
  // the configured opener, and let target resolution above reveal the popup
  // once the step target re-appears. Fully config-driven, works for any step.
  useEffect(() => {
    if (!isTourActive || !currentStepData?.target) return;

    const openFromPreviousStep =
      currentStepData?.actionConfig?.openFromPreviousStep;
    if (!openFromPreviousStep) return;

    const targetSelector = `[data-getting-started="${currentStepData.target.key}"]`;
    if (document.querySelector(targetSelector)) return;

    let cancelled = false;

    const tryOpen = () => {
      if (cancelled) return false;
      if (reopenClickedRef.current) return true;
      const opener = document.querySelector(
        `[data-getting-started="${openFromPreviousStep.targetKey}"]`,
      );
      if (!opener) return false;
      reopenClickedRef.current = true;

      opener.click();
      return true;
    };

    if (openFromPreviousStep.page) {
      const current = stripLocale(pathname);
      if (current !== openFromPreviousStep.page) {
        router.push(`/${locale}${openFromPreviousStep.page}`);
      }
    }

    if (tryOpen()) return;

    const observer = new MutationObserver(() => {
      if (tryOpen()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => observer.disconnect(), 10000);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [
    isTourActive,
    currentStep,
    currentStepData?.target?.key,
    pathname,
    router,
    locale,
  ]);
  const closeDialog = () => {
    const closeBtn = document.querySelector("[data-dialog-close]");
    if (closeBtn) {
      closeBtn.click();
    }
  };

  useEffect(() => {
    const prevKey = prevStepKeyRef.current;
    if (prevKey) {
      const prevStep = activeItem?.steps.find((s) => s.key === prevKey);
      if (prevStep?.target?.type?.toUpperCase() === "DIALOG") {
        closeDialog();
      }
    }
    // Update ref for next render
    prevStepKeyRef.current = currentStepData?.key || null;
  }, [currentStep, activeItem]);

  useEffect(() => {
    if (!targetResolved || !isTourActive) return;
    const key = currentStepData?.key;
    if (!key || key === lastViewedStepKeyRef.current) return;
    lastViewedStepKeyRef.current = key;
    if (activeItem?.id) {
      logEvent({
        itemId: activeItem.id,
        type: "get_started_step_viewed",
        stepKey: key,
      });
    }
  }, [
    targetResolved,
    isTourActive,
    currentStepData?.key,
    activeItem,
    logEvent,
  ]);

  return (
    <GettingStartedContext.Provider
      value={{
        items,
        itemsByKey,
        stepsByItemKey,
        completedKeys,
        completedSet,
        achievementPercent,
        totalCompleted,
        isLoading,
        refresh: fetchItems,
        logEvent,
        getItemByKey,
        areAllDependenciesCompleted,
        getDependenciesForItem,
        canStartItem,
        sidebarOpen,
        sidebarStack,
        currentSidebarItemKey,
        sidebarDepth,
        openSidebarForItem,
        pushSidebarItem,
        popSidebarItem,
        closeSidebar,
        startTour,
      }}
    >
      {children}
      {isTourActive &&
        createPortal(
          <GettingStartedTutorial
            locale={locale}
            title={activeItem.title}
            steps={tourSteps}
            currentStep={currentStep}
            nextTriggersTarget={
              currentStepData?.actionConfig?.trigger === "click"
            }
            open={isTourActive && targetResolved}
            onNext={nextStep}
            onPrevious={prevStep}
            onSkip={skipTour}
            onFinish={finishTour}
            onTargetInteraction={handleTargetInteraction}
          />,
          document.body,
        )}
    </GettingStartedContext.Provider>
  );
}

export const useGettingStarted = () => {
  const context = useContext(GettingStartedContext);
  if (context === undefined) {
    throw new Error(
      "useGettingStarted must be used within a GettingStartedProvider",
    );
  }
  return context;
};
