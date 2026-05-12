// app/[locale]/layout.js
import React from 'react';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';

import { Inter, Open_Sans, Roboto_Mono, Sora } from 'next/font/google';
import './globals.css';

import LayoutShell from './LayoutShell';
import Script from 'next/script';


const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-num",
});

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

// const arabicFont = Cairo({
//   variable: '--font-arabic',
//   subsets: ['arabic'],
//   weight: ['300', '400', '500', '600', '700', '800'],
//   display: 'swap'
// });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'Madar: The Comprehensive Business Order Management Platform',
  description:
    'Efficiently manage orders, streamline shipments, and gain business insights with real-time analytics.'
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const messages = await getMessages();

  return (
    <html lang={locale} dir={dir} translate="no" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${openSans.variable} ${robotoMono.variable} ${inter.variable}`}
      >

        <Script id="facebook-init" strategy="beforeInteractive">
          {`
            window.fbAsyncInit = function () {
               window.FB.init({
                appId: '2083073232550708',
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v25.0'
              });
            };
          `}
        </Script>

        <Script
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />

        <NextIntlClientProvider locale={locale} messages={messages}>
          <LayoutShell>{children}</LayoutShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}


