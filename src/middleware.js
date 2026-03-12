import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { isPublicOrSpecialRoute } from './utils/route-utils';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'ar',
  localePrefix: 'always',
});

export default function middleware(req) {
  const { pathname } = req.nextUrl;

  const userCookie = req.cookies.get('user')?.value;
  if (isPublicOrSpecialRoute(pathname)) {
    return intlMiddleware(req);
  }
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);

      const isOnboardingPage = pathname.includes('/onboarding');

      if (
        user.role === 'admin' &&
        user.onboardingStatus !== 'completed' &&
        !isOnboardingPage
      ) {
        const locale = pathname.startsWith('/en') ? 'en' : 'ar';

        return NextResponse.redirect(new URL(`/${locale}/onboarding`, req.url));
      }
    } catch (error) {
      console.error("Error parsing user cookie in middleware:", error);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};