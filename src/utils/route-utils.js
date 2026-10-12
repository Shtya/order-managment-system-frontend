// src/lib/route-utils.js

const PUBLIC_ROUTES = [
  { path: "/", strict: true },
  { path: "/auth", strict: false },
  { path: "/payment", strict: false },
  { path: "/terms", strict: false },
  { path: "/privacy", strict: false },
  { path: "/reset-password", strict: false },
  { path: "/forgot-password", strict: false },
  { path: "/terms", strict: false },
  { path: "/privacy", strict: false },
  { path: "/confirm", strict: false },
];



const ROLE_ROUTES = [
  { path: "/dashboard/plans", role: "super_admin", strict: false },
  { path: "/dashboard/roles", role: "super_admin", strict: false },
  { path: "/dashboard/users", role: "super_admin", strict: false },
  { path: "/dashboard/settings", role: "super_admin", strict: false },
  { path: "/onboarding", role: "admin", strict: false },
];


export const getCleanPath = (pathname) => {
  let path = pathname.replace(/^\/(en|ar)(\/|$)/, "/");
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path;
};


export const isPublicRoute = (pathname) => {
  const cleanPath = getCleanPath(pathname);
  return PUBLIC_ROUTES.some(({ path, strict }) =>
    strict ? cleanPath === path : cleanPath.startsWith(path)
  );
};

export const getRequiredRole = (pathname) => {
  const cleanPath = getCleanPath(pathname);
  const match = ROLE_ROUTES.find(({ path, strict }) =>
    strict ? cleanPath === path : cleanPath.startsWith(path)
  );
  return match ? match.role : null;
};

export const isSuperAdimnPaths = (pathname) => {
  const path = getCleanPath(pathname);

  return path.startsWith("/dashboard") || path.startsWith("/notifications");
};

export const isMcpConnectPath = (pathname) => {
  const path = getCleanPath(pathname);
  return path === "/mcp/connect" || path.startsWith("/mcp/connect/");
};

/** Same-app /mcp/connect URLs only. Rejects open redirects. */
export const getSafeMcpConnectRedirect = (redirect) => {
  if (!redirect || typeof redirect !== "string") return null;
  const trimmed = redirect.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    return null;
  }

  let pathname;
  try {
    const url = new URL(trimmed, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return null;
    pathname = url.pathname;
  } catch {
    return null;
  }

  return isMcpConnectPath(pathname) ? trimmed : null;
};