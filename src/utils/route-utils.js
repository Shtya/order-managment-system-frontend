// src/lib/route-utils.js

export const isPublicOrSpecialRoute = (pathname) => {
    // إزالة كود اللغة من المسار (مثلاً /ar/auth تصبح /auth) لتوحيد المقارنة
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)(\/|$)/, '/');

    const excludedPaths = [
        '/auth',
        '/payment',
        '/onboarding',
        '/warehouse/print',
        'reset-password',
        'forgot-password'
    ];

    return excludedPaths.some(path => pathWithoutLocale.includes(path) || pathWithoutLocale === path);
};