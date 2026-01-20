import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Hero } from '@/components/home';

// Lazy load below-the-fold components
const ToolGrid = dynamic(() => import('@/components/tools').then(mod => ({ default: mod.ToolGrid })), {
  loading: () => <div className="min-h-[400px]" />,
});
const WhyAdobeWork = dynamic(() => import('@/components/home').then(mod => ({ default: mod.WhyAdobeWork })), {
  loading: () => <div className="min-h-[300px]" />,
});
const FAQ = dynamic(() => import('@/components/home').then(mod => ({ default: mod.FAQ })), {
  loading: () => <div className="min-h-[300px]" />,
});
const AdBanner = dynamic(() => import('@/components/ads/AdBanner').then(mod => ({ default: mod.AdBanner })));
const MultiplexAd = dynamic(() => import('@/components/ads/AdBanner').then(mod => ({ default: mod.MultiplexAd })));

export const metadata: Metadata = {
  title: 'AdobeWork - Free Online PDF & Image Tools | Convert, Compress, Merge',
  description: 'Convert, compress, merge, split, and edit PDF files online for free. 50+ tools including OCR, image editing, background removal. Fast, secure, no registration.',
  keywords: [
    'pdf converter',
    'pdf tools',
    'convert pdf',
    'compress pdf',
    'merge pdf',
    'split pdf',
    'pdf to word',
    'word to pdf',
    'free pdf tools',
    'online pdf editor',
    'image tools',
    'remove background',
    'resize image',
    'ocr pdf',
  ],
  openGraph: {
    title: 'AdobeWork - Free Online PDF & Image Tools',
    description: 'Convert, compress, merge, split, and edit PDF files online for free. 50+ tools. Fast, secure, no registration.',
    type: 'website',
    url: 'https://adobework.in',
    siteName: 'AdobeWork',
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
    description: 'Convert, compress, merge, split, and edit PDF files online for free. 50+ tools available.',
    images: ['/images/og-image.png'],
  },
  alternates: {
    canonical: 'https://adobework.in',
  },
};

export default function Home() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://adobework.in',
      },
    ],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AdobeWork',
    url: 'https://adobework.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://adobework.in/all-tools?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // Ad slot IDs - Replace with your actual slot IDs from AdSense
  const headerAdSlot = process.env.NEXT_PUBLIC_AD_SLOT_HEADER || '';
  const footerAdSlot = process.env.NEXT_PUBLIC_AD_SLOT_FOOTER || '';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Hero />
      
      {/* Ad after Hero */}
      {headerAdSlot && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdBanner slot={headerAdSlot} format="horizontal" responsive />
        </div>
      )}
      
      <ToolGrid />
      <WhyAdobeWork />
      
      {/* Multiplex Ad before FAQ */}
      {footerAdSlot && (
        <div className="max-w-7xl mx-auto px-4">
          <MultiplexAd slot={footerAdSlot} />
        </div>
      )}
      
      <FAQ />
    </>
  );
}
