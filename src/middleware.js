import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { isPublicRoute, getRequiredRole, isSuperAdimnPaths, getCleanPath } from "./utils/route-utils";

const intlMiddleware = createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export default function middleware(req) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";
  const isFacebookBot = ua.includes("facebookexternalhit") || ua.includes("Facebot");
  const userCookie = req?.cookies?.get("user")?.value;
  const accessToken = req?.cookies?.get("accessToken")?.value; // your JWT cookie name
  const locale = pathname?.startsWith("/en") ? "en" : "ar";

  
  if (pathname.startsWith("/queues")) {
    let user = null;

    try {
      if (userCookie) {
        user = JSON.parse(userCookie);
      }
    } catch {
      return NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
    }


    // Only super admins can access bull-board
    if (!user || user?.role?.name !== "super_admin") {

      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }

    if (!accessToken) {
      return NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
    }

    const headers = new Headers(req.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);

    const target = new URL(
      `${process.env.NEXT_PUBLIC_BASE_URL}${pathname}${req.nextUrl.search}`,
    );

    return NextResponse.rewrite(target, {
      request: {
        headers,
      },
    });
  }

  if (isFacebookBot) {
    // 1. Let robots.txt pass through to the public folder
    if (pathname === "/robots.txt") {
      return NextResponse.next();
    }

    return NextResponse.rewrite(new URL("/og-preview.html", req.url));
  }

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

  if (userRole === "super_admin" && !isSuperAdimnPaths(pathname)) {
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
  matcher: [
    "/queues/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)"
  ],
};