'use client';

import React from 'react';
import { Tool, ToolPageMeta } from '@/types/tool';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { ToolSEOContent } from '@/components/seo/ToolSEOContent';
import { 
  AdBanner, 
  InArticleAd
} from '@/components/ads/AdBanner';
import { usePremiumStatus } from '@/hooks';

export interface ToolPageLayoutProps {
  /** The tool configuration */
  tool: Tool;
  /** SEO metadata for the tool page */
  seo: ToolPageMeta;
  /** The main content (upload area, processor, etc.) */
  children: React.ReactNode;
  /** Optional custom SEO content sections */
  contentSections?: ContentSection[];
}

interface ContentSection {
  heading: string;
  content: string;
}

/**
 * ToolPageLayout provides a consistent structure for all tool pages.
 * Includes upload area, processing section, result section, and ad placements.
 * 
 * Requirements: 8.2, 8.3, 8.4
 */
export function ToolPageLayout({
  tool,
  seo,
  children,
  contentSections,
}: ToolPageLayoutProps) {
  // Check premium status to hide ads for premium users
  const { isPremium } = usePremiumStatus();
  const showAds = !isPremium;

  return (
    <>
      {/* FAQ Schema for SEO */}
      {seo.faqs && seo.faqs.length > 0 && <FAQSchema faqs={seo.faqs} />}

      <div className="min-h-screen bg-gray-50">
        {/* Top Ad Banner */}
        {showAds && process.env.NEXT_PUBLIC_AD_SLOT_HEADER && (
          <div className="w-full bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <AdBanner 
                slot={process.env.NEXT_PUBLIC_AD_SLOT_HEADER}
                format="horizontal"
                responsive
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tool Header */}
          <header className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {seo.h1}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {tool.description}
            </p>
          </header>

          {/* Upload and Processing Section */}
          <section 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8"
            aria-label="File upload and processing"
          >
            {children}
          </section>

          {/* Inline Ad (after processing section) */}
          {showAds && process.env.NEXT_PUBLIC_AD_SLOT_CONTENT && (
            <div className="mb-8">
              <InArticleAd slot={process.env.NEXT_PUBLIC_AD_SLOT_CONTENT} />
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <svg 
                className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-primary-900">
                  Your files are secure
                </h3>
                <p className="mt-1 text-sm text-primary-700">
                  All uploaded files are encrypted during transfer and automatically deleted from our servers within 1 hour. 
                  We never store or share your documents.
                </p>
              </div>
            </div>
          </div>

          {/* SEO Content Section */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
            <ToolSEOContent 
              tool={tool} 
              seo={seo} 
              contentSections={contentSections}
            />
          </section>

          {/* After Result Ad */}
          {showAds && process.env.NEXT_PUBLIC_AD_SLOT_FOOTER && (
            <div className="mb-8">
              <AdBanner 
                slot={process.env.NEXT_PUBLIC_AD_SLOT_FOOTER}
                format="rectangle"
                responsive
              />
            </div>
          )}

          {/* Tool Features Grid */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Why Choose AdobeWork?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                title="Lightning Fast"
                description={
                  tool.processingLocation === 'client'
                    ? 'Process files directly in your browser for instant results'
                    : 'Optimized servers ensure quick conversions every time'
                }
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                title="100% Secure"
                description="Your files are encrypted and automatically deleted within 1 hour"
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Completely Free"
                description="No hidden costs, no watermarks, no registration required"
              />
            </div>
          </section>

          {/* Supported Formats */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Supported Formats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Input</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {tool.acceptedFormats.map(f => f.toUpperCase().replace('.', '')).join(', ')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Output</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {tool.outputFormat.toUpperCase().replace('.', '')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Max Size</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatFileSize(tool.maxFileSize)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Max Files</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {tool.maxFiles} {tool.maxFiles > 1 ? 'files' : 'file'}
                </dd>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

/**
 * Feature card component for the features grid
 */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} bytes`;
}

export default ToolPageLayout;
