// app/[locale]/layout.js
import React from 'react';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';

import { Inter, Open_Sans, Roboto_Mono, Sora, Almarai } from 'next/font/google';
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

const arabicFont = Almarai({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['300', '400', '700', '800'],
  display: 'swap'
});

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

  console.log(process.env.NEXT_PUBLIC_FB_API_VERSION)
  return (
    <html lang={locale} dir={dir} translate="no" suppressHydrationWarning>
      <head>
        <meta name="facebook-domain-verification" content="tv61v5592fgxbg7icblxrfhspnom86" />
      </head>


      <body
        className={`${sora.variable} ${openSans.variable} ${robotoMono.variable} ${inter.variable} ${arabicFont.variable}`}
      >
        <Script id="facebook-init" strategy="beforeInteractive">
          {`
            window.fbAsyncInit = function () {
               window.FB.init({
                appId: '${process.env.NEXT_PUBLIC_FB_APP_ID}',
                autoLogAppEvents: true,
                xfbml: true,
                version: '${process.env.NEXT_PUBLIC_FB_API_VERSION}'
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


