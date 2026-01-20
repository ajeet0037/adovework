import { Metadata } from 'next';
import { Tool, ToolPageMeta } from '@/types/tool';
import { generateFAQJsonLd } from '@/components/seo/FAQSchema';

/** Base URL for the site - should be configured via environment variable in production */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://adobework.com';

/** Site name for OpenGraph */
const SITE_NAME = 'AdobeWork';

/**
 * Generate Next.js Metadata object for tool pages.
 * Includes title, description, openGraph, canonical URL, and JSON-LD.
 * 
 * Requirements: 6.1, 6.2
 * 
 * @param tool - The tool configuration
 * @param seo - The SEO metadata for the tool
 * @returns Next.js Metadata object
 */
export function generateToolMetadata(tool: Tool, seo: ToolPageMeta): Metadata {
  const canonicalUrl = `${BASE_URL}/${tool.slug}`;
  
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
    
    // OpenGraph metadata for social sharing
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: `${BASE_URL}/images/og/${tool.slug}.png`,
          width: 1200,
          height: 630,
          alt: `${tool.name} - ${SITE_NAME}`,
        },
      ],
    },
    
    // Twitter card metadata
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [`${BASE_URL}/images/og/${tool.slug}.png`],
    },
    
    // Robots directives
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
  };
}

/**
 * Generate JSON-LD structured data for a tool page.
 * Includes WebPage schema and FAQ schema.
 * 
 * @param tool - The tool configuration
 * @param seo - The SEO metadata for the tool
 * @returns Array of JSON-LD objects
 */
export function generateToolJsonLd(tool: Tool, seo: ToolPageMeta): object[] {
  const canonicalUrl = `${BASE_URL}/${tool.slug}`;
  const jsonLdArray: object[] = [];
  
  // WebPage schema
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.title,
    description: seo.description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: tool.name,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  };
  jsonLdArray.push(webPageSchema);
  
  // FAQ schema (if FAQs exist)
  const faqJsonLd = generateFAQJsonLd(seo.faqs);
  if (faqJsonLd) {
    jsonLdArray.push(faqJsonLd);
  }
  
  return jsonLdArray;
}

/**
 * Generate metadata for static pages (About, Contact, Privacy, Terms).
 * 
 * @param page - Page identifier
 * @param title - Page title
 * @param description - Page description
 * @returns Next.js Metadata object
 */
export function generateStaticPageMetadata(
  page: string,
  title: string,
  description: string
): Metadata {
  const canonicalUrl = `${BASE_URL}/${page}`;
  
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    
    alternates: {
      canonical: canonicalUrl,
    },
    
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
    },
    
    twitter: {
      card: 'summary',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate home page metadata.
 * 
 * @returns Next.js Metadata object for the home page
 */
export function generateHomeMetadata(): Metadata {
  const title = 'AdobeWork - Free Online PDF Tools | Convert, Merge, Compress';
  const description = 'Free online PDF tools to convert, merge, compress, split, and edit PDF files. Fast, secure, and easy to use. No registration required.';
  
  return {
    title,
    description,
    keywords: [
      'pdf tools',
      'pdf converter',
      'merge pdf',
      'compress pdf',
      'pdf to word',
      'word to pdf',
      'free pdf tools',
      'online pdf editor',
    ],
    
    alternates: {
      canonical: BASE_URL,
    },
    
    openGraph: {
      title,
      description,
      url: BASE_URL,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: `${BASE_URL}/images/og/home.png`,
          width: 1200,
          height: 630,
          alt: 'AdobeWork - Free Online PDF Tools',
        },
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/images/og/home.png`],
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
  };
}
