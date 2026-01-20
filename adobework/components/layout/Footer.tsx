import Link from 'next/link';
import { TOOLS, getCoreTools, getAdvancedTools } from '@/lib/constants/tools';

/**
 * Footer component with tool links organized by category
 * Includes informational page links and security messaging
 * Requirements: 7.5, 9.3
 */
export function Footer() {
  const coreTools = getCoreTools();
  const advancedTools = getAdvancedTools();
  const currentYear = new Date().getFullYear();

  const infoLinks = [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-of-service', label: 'Terms of Service' },
    { href: '/ad-preferences', label: 'Ad Preferences' },
  ];

  return (
    <footer className="border-t border-gray-200 bg-gray-50" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand and Security Message */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">AdobeWork</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Fast, free, and secure PDF tools. Convert, compress, merge, and edit your PDF files online.
            </p>
            {/* Security Messaging - Requirement 9.3 */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="h-4 w-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Your files are automatically deleted after 1 hour</span>
            </div>
          </div>

          {/* Core Tools */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Core Tools
            </h3>
            <ul className="mt-4 space-y-2" role="list">
              {coreTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/${tool.slug}`}
                    className="text-sm text-gray-600 transition-colors hover:text-primary-600"
                    data-tool-id={tool.id}
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Advanced Tools */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Advanced Tools
            </h3>
            <ul className="mt-4 space-y-2" role="list">
              {advancedTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/${tool.slug}`}
                    className="text-sm text-gray-600 transition-colors hover:text-primary-600"
                    data-tool-id={tool.id}
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Information
            </h3>
            <ul className="mt-4 space-y-2" role="list">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 transition-colors hover:text-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-500">
            © {currentYear} AdobeWork. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Get all tool links from the footer for testing
 * This function is exported for property testing
 */
export function getFooterToolLinks(): Array<{ id: string; slug: string; name: string }> {
  return TOOLS.map((tool) => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
  }));
}

export default Footer;
