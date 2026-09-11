export function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

export function userHasPermission(user, permission) {
  const permsArray = user?.role?.permissionNames || [];
  const permsSet = new Set(permsArray);
  const hasAllAccess = permsSet.has("*") || normalizeRole(user?.role?.name) === "SUPER_ADMIN";

  if (hasAllAccess) return true;
  if (!permission) return false;

  if (Array.isArray(permission)) {
    return permission.some((p) => permsSet.has(p));
  }

  return permsSet.has(permission);
}

export function getRoleDisplayName(role, t) {
  const normalized = normalizeRole(role);
  if (!normalized) return t("roles.user");
  if (normalized === "SUPER_ADMIN") return t("roles.super_admin");
  if (normalized === "ADMIN") return t("roles.admin");
  return String(role).trim();
}
