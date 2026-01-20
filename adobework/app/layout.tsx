import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CookieConsent } from '@/components/ads/CookieConsent';
import { AdSenseScript } from '@/components/ads/AdSenseScript';
import './globals.css';

// Validate environment variables on startup
if (typeof window === 'undefined') {
  // Only run on server-side
  try {
    const { validateEnv } = require('@/lib/utils/env');
    validateEnv();
  } catch (error) {
    console.error('Environment validation failed:', error);
  }
}

/**
 * Inter font configuration
 * Using variable font with swap display for faster LCP
 */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

/**
 * Default metadata for AdobeWork
 * Individual pages can override these values
 */
export const metadata: Metadata = {
  title: {
    default: 'AdobeWork - Free Online PDF & Image Tools',
    template: '%s | AdobeWork',
  },
  description:
    'Fast, free, and secure PDF tools. Convert, compress, merge, split, and edit PDF files online with AdobeWork. No registration required.',
  keywords: [
    'pdf tools',
    'pdf converter',
    'pdf editor',
    'merge pdf',
    'compress pdf',
    'split pdf',
    'pdf to word',
    'word to pdf',
    'free pdf tools',
    'online pdf',
    'image tools',
    'resize image',
    'compress image',
    'remove background',
    'ocr pdf',
  ],
  authors: [{ name: 'AdobeWork', url: 'https://adobework.in' }],
  creator: 'AdobeWork',
  publisher: 'AdobeWork',
  metadataBase: new URL('https://adobework.in'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://adobework.in',
    siteName: 'AdobeWork',
    title: 'AdobeWork - Free Online PDF & Image Tools',
    description:
      'Fast, free, and secure PDF tools. Convert, compress, merge, split, and edit PDF files online. No registration required.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AdobeWork - Free Online PDF Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdobeWork - Free Online PDF & Image Tools',
    description:
      'Fast, free, and secure PDF tools. Convert, compress, merge, split, and edit PDF files online.',
    images: ['/images/og-image.png'],
    creator: '@adobework',
  },
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icons/icon-32x32.png',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/icon.svg',
        color: '#ef4444',
      },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'Q06NIux_aziLDVQiCW6ZgSTzJPG1mQ005UNG6nK6so4',
    other: {
      'msvalidate.01': '6FEA5F91B51DDC20CC5ED8CCA51711FD',
      'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_ID || '',
    },
  },
  category: 'technology',
};

/**
 * Root layout component
 * Wraps all pages with Header and Footer
 * Requirements: 7.4, 7.5
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AdobeWork',
    url: 'https://adobework.in',
    description: 'Free online PDF and image tools. Convert, compress, merge, split, and edit files online.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AdobeWork',
    alternateName: 'Adobe Work',
    url: 'https://adobework.in',
    logo: {
      '@type': 'ImageObject',
      url: 'https://adobework.in/icons/icon-512x512.png',
      width: 512,
      height: 512,
    },
    image: 'https://adobework.in/icons/icon-512x512.png',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: 'https://adobework.in/contact',
    },
    description: 'Free online PDF and image tools. Convert, compress, merge, split, and edit files online.',
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AdobeWork',
    alternateName: 'Adobe Work',
    url: 'https://adobework.in',
    description: 'Free online PDF and image tools. Convert, compress, merge, split, and edit files online.',
    publisher: {
      '@type': 'Organization',
      name: 'AdobeWork',
      logo: {
        '@type': 'ImageObject',
        url: 'https://adobework.in/icons/icon-512x512.png',
        width: 512,
        height: 512,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://adobework.in/all-tools?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };



  return (
    <html lang="en">
      <head>
        {/* Critical: Preconnect to fonts first */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Defer ad-related preconnects - not critical for LCP */}
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />

        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
        <AdSenseScript />
        <Analytics />
      </body>
    </html>
  );
}
