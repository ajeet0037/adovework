'use client';

import Link from 'next/link';
import { Tool, ToolPageMeta } from '@/types/tool';
import { TOOLS } from '@/lib/constants/tools';

interface ToolSEOContentProps {
  tool: Tool;
  seo: ToolPageMeta;
  /** Custom long-form content sections */
  contentSections?: ContentSection[];
}

interface ContentSection {
  heading: string;
  content: string;
}

/**
 * ToolSEOContent component renders long-form SEO content with proper heading hierarchy.
 * Includes internal links to related tools for better SEO and user navigation.
 * 
 * Requirements: 6.3, 6.4, 6.6
 */
export function ToolSEOContent({ tool, seo, contentSections }: ToolSEOContentProps) {
  // Get related tools (same category, excluding current tool)
  const relatedTools = getRelatedTools(tool);

  return (
    <article className="prose prose-gray max-w-none">
      {/* H1 is the main heading - should be unique per page */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{seo.h1}</h1>

      {/* Introduction section */}
      <section className="mb-8">
        <p className="text-lg text-gray-700 leading-relaxed">
          {tool.description} AdobeWork provides a fast, secure, and free way to {tool.name.toLowerCase()} online.
          No registration required, no watermarks added.
        </p>
      </section>

      {/* How to use section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          How to {tool.name}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Upload your {getInputDescription(tool)} using drag-and-drop or click to browse</li>
          <li>Wait for the file to be processed (usually takes just seconds)</li>
          <li>Download your converted {tool.outputFormat.replace('.', '').toUpperCase()} file</li>
        </ol>
      </section>

      {/* Custom content sections */}
      {contentSections?.map((section, index) => (
        <section key={index} className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {section.heading}
          </h2>
          <div 
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </section>
      ))}

      {/* Features section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Why Use AdobeWork for {tool.name}?
        </h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">✓</span>
            <span><strong>100% Free</strong> - No hidden costs or premium features required</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">✓</span>
            <span><strong>Fast Processing</strong> - {tool.processingLocation === 'client' ? 'Client-side processing for instant results' : 'Optimized servers for quick conversions'}</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">✓</span>
            <span><strong>Secure & Private</strong> - Files are automatically deleted within 1 hour</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">✓</span>
            <span><strong>No Registration</strong> - Start converting immediately without signing up</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">✓</span>
            <span><strong>No Watermarks</strong> - Your converted files are clean and professional</span>
          </li>
        </ul>
      </section>

      {/* File specifications section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Supported File Formats
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="font-medium text-gray-900">Input Formats</dt>
              <dd className="text-gray-600">{tool.acceptedFormats.join(', ').toUpperCase()}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Output Format</dt>
              <dd className="text-gray-600">{tool.outputFormat.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Max File Size</dt>
              <dd className="text-gray-600">{formatFileSize(tool.maxFileSize)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Max Files</dt>
              <dd className="text-gray-600">{tool.maxFiles} file{tool.maxFiles > 1 ? 's' : ''}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Related tools section - Internal linking for SEO */}
      {relatedTools.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Related PDF Tools
          </h2>
          <p className="text-gray-700 mb-4">
            Explore more PDF tools from AdobeWork:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedTools.map((relatedTool) => (
              <Link
                key={relatedTool.id}
                href={`/${relatedTool.slug}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{relatedTool.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{relatedTool.shortDescription}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ section */}
      {seo.faqs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {seo.faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

/**
 * Get related tools based on category and common use cases
 */
function getRelatedTools(currentTool: Tool): Tool[] {
  // Get tools from the same category first
  const sameCategoryTools = TOOLS.filter(
    (t) => t.category === currentTool.category && t.id !== currentTool.id
  );

  // Get complementary tools (e.g., if PDF to Word, suggest Word to PDF)
  const complementaryTools = TOOLS.filter((t) => {
    if (t.id === currentTool.id) return false;
    
    // Find reverse conversion tools
    if (currentTool.slug.includes('-to-')) {
      const [from, to] = currentTool.slug.split('-to-');
      return t.slug === `${to}-to-${from}`;
    }
    return false;
  });

  // Combine and limit to 6 related tools
  const allRelated = [...new Set([...complementaryTools, ...sameCategoryTools])];
  return allRelated.slice(0, 6);
}

/**
 * Get human-readable input description
 */
function getInputDescription(tool: Tool): string {
  const formats = tool.acceptedFormats.map((f) => f.replace('.', '').toUpperCase());
  if (formats.length === 1) {
    return `${formats[0]} file`;
  }
  return `${formats.slice(0, -1).join(', ')} or ${formats[formats.length - 1]} file`;
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

export default ToolSEOContent;
