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
  metadataBase: new URL("https://getmadar.net"),

  title: {
    default: "Madar",
    template: "Madar | %s",
  },

  description:
    "Madar helps businesses manage orders, shipping, and operations in one platform.",

  applicationName: "Madar",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://getmadar.net",
    siteName: "Madar",
    title: "Madar",
    description:
      "Madar helps businesses manage orders, shipping, and operations in one platform.",
    images: [
      {
        url: "/logo.png", // => https://getmadar.net/logo.png
        width: 1200,
        height: 630,
        alt: "Madar Logo",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Madar",
    description:
      "Madar helps businesses manage orders, shipping, and operations in one platform.",
    images: ["/logo.png"],
  },
};
export default async function RootLayout({ children, params }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const messages = await getMessages();


  return (
    <html lang={locale} dir={dir} translate="no" suppressHydrationWarning>
      <head>
        <meta name="facebook-domain-verification" content="tv61v5592fgxbg7icblxrfhspnom86" />
        <meta name="google-site-verification" content="gFuuXG2Qnxsb3NMlS6sLEuUlm5s0S1VCX4cKmexELBw" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        <Script id="gtm" strategy="afterInteractive">
          {
            `
            (function(w,d,s,l,i){w[l] = w[l] || [];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KHTSW6PS');
            `
          }
        </Script>

      </head>


      <body
        className={`${sora.variable} ${openSans.variable} ${robotoMono.variable} ${inter.variable} ${arabicFont.variable}`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KHTSW6PS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

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


