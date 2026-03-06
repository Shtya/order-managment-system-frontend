// /middleware.js
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'ar',
  localePrefix: 'always',
});

export default function middleware(req) {
  const { pathname } = req.nextUrl;

  const hasLocale = pathname.startsWith('/en/') || pathname.startsWith('/ar/') || pathname === '/en' || pathname === '/ar';

  if (!hasLocale) {
    const newUrl = new URL(`/ar${pathname}`, req.url);
    return NextResponse.redirect(newUrl);
  }

  // استخدام middleware العادي
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
