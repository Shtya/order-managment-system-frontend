import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { isPublicOrSpecialRoute } from "./utils/route-utils";

const intlMiddleware = createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export default function middleware(req) {
  const { pathname } = req.nextUrl;

  //
  const locale = pathname.startsWith("/en") ? "en" : "ar";


  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "") || "/";
  const userCookie = req.cookies.get("user")?.value;

  if (isPublicOrSpecialRoute(pathname)) {
    return intlMiddleware(req);
  }


  if (!userCookie) {
    return NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
  }

  try {
    const user = JSON.parse(userCookie);
    const isOnboardingPage = pathWithoutLocale.startsWith("/onboarding");


    if (
      user?.role?.name === "admin" &&
      user?.onboardingStatus !== "completed" &&
      !isOnboardingPage
    ) {
      return NextResponse.redirect(new URL(`/${locale}/onboarding`, req.url));
    }


    if (pathWithoutLocale.startsWith("/dashboard")) {
      if (user?.role?.name !== "super_admin") {

        return NextResponse.redirect(new URL(`/${locale}/`, req.url));
      }
    }

    if (user?.role?.name === "super_admin" && !pathWithoutLocale.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard/users`, req.url));
    }

  } catch (error) {
    console.error("Error parsing user cookie in middleware:", error);

    const response = NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
    response.cookies.delete("user");
    return response;
  }

  // 5) Everything OK → run next-intl
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};