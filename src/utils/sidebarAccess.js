import { getSidebarMenuItems } from "@/config/sidebarMenu";
import { normalizeRole, userHasPermission } from "@/utils/userAccess";

const FALLBACK_ROUTE = "/support-tickets";

export function isEmailAllowed(entry, userEmail) {
  if (!entry?.allowedEmails?.length) return true;
  const email = userEmail?.toLowerCase();
  if (!email) return false;
  return entry.allowedEmails.some((allowed) => allowed.toLowerCase() === email);
}

export function isChildAllowed(child, parent, user) {
  const role = normalizeRole(user?.role?.name);
  const userEmail = user?.email?.toLowerCase();

  if (!isEmailAllowed(child, userEmail)) return false;

  if (role === "SUPER_ADMIN") {
    return child.roles?.includes("SUPER_ADMIN") || parent.roles?.includes("SUPER_ADMIN");
  }

  if (child.notRoles?.includes(role)) return false;
  if (child.roles?.length && !child.roles.includes(role)) return false;
  if (!child.permission) return false;
  return userHasPermission(user, child.permission);
}

export function isSidebarItemAllowed(item, user) {
  const role = normalizeRole(user?.role?.name);
  const userEmail = user?.email?.toLowerCase();

  if (role === "SUPER_ADMIN") {
    return item.roles?.includes("SUPER_ADMIN");
  }

  if (!isEmailAllowed(item, userEmail)) return false;
  if (item.notRoles?.includes(role)) return false;
  if (item.roles?.length && !item.roles.includes(role)) return false;

  if (item.children?.length) {
    return item.children.some((child) => isChildAllowed(child, item, user));
  }

  if (item.permission) {
    return userHasPermission(user, item.permission);
  }

  return true;
}

export function filterSidebarItems(items, user) {
  if (!user) return [];

  return items
    .filter((item) => isSidebarItemAllowed(item, user))
    .map((item) => ({
      ...item,
      ...(item.children?.length
        ? { children: item.children.filter((child) => isChildAllowed(child, item, user)) }
        : {}),
    }));
}

export function getFirstAccessibleHref(items) {
  for (const item of items) {
    if (item.children?.length) {
      if (item.children[0]?.href) return item.children[0].href;
      continue;
    }
    if (item.href) return item.href;
  }
  return null;
}

export function getDefaultAppRoute(user, options = {}) {
  if (!user) return "/auth?mode=signin";

  const role = normalizeRole(user?.role?.name);

  if (role === "SUPER_ADMIN") {
    return "/dashboard/users";
  }

  if (role === "ADMIN" && user?.onboardingStatus !== "completed") {
    return "/onboarding";
  }

  if (role === "ADMIN") {
    return "/orders";
  }

  if (role === "CALL CENTER") {
    return "/orders/employee-orders";
  }

  const menuItems = getSidebarMenuItems({
    isDirectShippingEnabled: options.isDirectShippingEnabled ?? false,
  });
  const firstHref = getFirstAccessibleHref(filterSidebarItems(menuItems, user));
  return firstHref || FALLBACK_ROUTE;
}
