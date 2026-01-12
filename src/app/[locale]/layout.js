// app/[locale]/layout.js
import React from 'react';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '../../i18n/routing';

import {Cairo, Inter, Open_Sans, Roboto_Mono} from 'next/font/google';
import './globals.css';

import LayoutShell from './LayoutShell';

export const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
});

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap'
});

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap'
});

const arabicFont = Cairo({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap'
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export const metadata = {
  title: 'FitPro - Transform Your Body, Transform Your Life',
  description:
    'Professional fitness coaching platform with personalized workout plans, nutrition tracking, and progress analytics.'
};

export default async function RootLayout({children, params}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const messages = await getMessages();

  return (
    <html lang={locale} dir={dir} translate="no" suppressHydrationWarning>
      <body
        className={`${arabicFont.variable} ${openSans.variable} ${robotoMono.variable} ${inter.variable}`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LayoutShell>{children}</LayoutShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
