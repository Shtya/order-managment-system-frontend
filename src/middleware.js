import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { isPublicRoute, getRequiredRole, isDashboardPath, getCleanPath } from "./utils/route-utils";

const intlMiddleware = createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export default function middleware(req) {
  const { pathname } = req.nextUrl;
  const locale = pathname.startsWith("/en") ? "en" : "ar";
  const userCookie = req.cookies.get("user")?.value;

  if (isPublicRoute(pathname)) {
    return intlMiddleware(req);
  }

  let user = null;
  try {
    if (userCookie) user = JSON.parse(userCookie);
  } catch (e) {
    const response = NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
    response.cookies.delete("user");
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
  }

  const userRole = user?.role?.name;
  const requiredRole = getRequiredRole(pathname);

  if (requiredRole && userRole !== requiredRole) {

    return NextResponse.redirect(new URL(`/${locale}/`, req.url));
  }

  if (userRole === "super_admin" && !isDashboardPath(pathname)) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard/users`, req.url));
  }

  const isAtOnboarding = getCleanPath(pathname) === "/onboarding";
  if (
    userRole === "admin" &&
    user?.onboardingStatus !== "completed" &&
    !isAtOnboarding
  ) {
    return NextResponse.redirect(new URL(`/${locale}/onboarding`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};