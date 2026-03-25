// src/lib/route-utils.js

export const isPublicOrSpecialRoute = (pathname) => {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)(\/|$)/, "/");

  const excludedPaths = [
    { path: "/", strict: true },
    { path: "/auth", strict: false },
    { path: "/payment", strict: false },
    { path: "/onboarding", strict: false },
    { path: "/warehouse/print", strict: false },
    { path: "/reset-password", strict: false },
    { path: "/forgot-password", strict: false },
    { path: "/terms", strict: false },
    { path: "/privacy", strict: false },
  ];

  return excludedPaths.some(({ path, strict }) => {
    if (strict) {
      return pathWithoutLocale === path;
    }
    return pathWithoutLocale.startsWith(path);
  });
};
