import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - AdobeWork',
  description: 'Read the terms and conditions for using AdobeWork\'s free online PDF tools and services.',
  keywords: [
    'adobework terms',
    'terms of service',
    'pdf tools terms',
    'usage terms',
  ],
  openGraph: {
    title: 'Terms of Service - AdobeWork',
    description: 'Read the terms and conditions for using AdobeWork\'s free online PDF tools.',
    type: 'website',
    url: 'https://adobework.in/terms-of-service',
    siteName: 'AdobeWork',
  },
  alternates: {
    canonical: 'https://adobework.in/terms-of-service',
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = 'December 28, 2025';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Please read these terms carefully before using AdobeWork.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg prose-primary max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing or using AdobeWork (&quot;the Service&quot;), you agree to be bound 
              by these Terms of Service (&quot;Terms&quot;). If you do not agree to these 
              Terms, please do not use the Service.
            </p>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. Your continued use 
              of the Service after any changes constitutes acceptance of the new Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">2. Description of Service</h2>
            <p className="text-gray-600">
              AdobeWork provides free online tools for PDF conversion, compression, merging, 
              splitting, editing, and other document operations. The Service is provided 
              &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">3. User Responsibilities</h2>
            <p className="text-gray-600">By using AdobeWork, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Use the Service only for lawful purposes</li>
              <li>Not upload files that contain malware, viruses, or malicious code</li>
              <li>Not attempt to circumvent any security measures</li>
              <li>Not use the Service to process illegal or prohibited content</li>
              <li>Not use automated systems to access the Service without permission</li>
              <li>Respect intellectual property rights of others</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">4. File Ownership and Rights</h2>
            <p className="text-gray-600">
              You retain all ownership rights to files you upload to AdobeWork. By uploading 
              files, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>You own or have the right to use the files you upload</li>
              <li>Your use of the Service does not violate any third-party rights</li>
              <li>
                You grant AdobeWork a temporary license to process your files solely for 
                the purpose of providing the requested service
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">5. File Handling and Security</h2>
            <p className="text-gray-600">
              We take reasonable measures to protect your files:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Files are transmitted using secure HTTPS encryption</li>
              <li>Files are automatically deleted within 1 hour of processing</li>
              <li>We do not access, view, or share your files</li>
            </ul>
            <p className="text-gray-600">
              However, you acknowledge that no method of electronic transmission or storage 
              is 100% secure. You use the Service at your own risk.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">6. Service Limitations</h2>
            <p className="text-gray-600">
              The free tier of AdobeWork has the following limitations:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Maximum file size: 50MB per file</li>
              <li>Maximum files per operation: 10 files</li>
              <li>Daily conversion limit: 20 conversions</li>
            </ul>
            <p className="text-gray-600">
              We reserve the right to modify these limits at any time without notice.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">7. Prohibited Uses</h2>
            <p className="text-gray-600">You may not use AdobeWork to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Process files containing illegal content</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute malware or harmful code</li>
              <li>Engage in any activity that disrupts the Service</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for commercial purposes without permission</li>
              <li>Scrape, crawl, or use automated tools to access the Service</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">8. Intellectual Property</h2>
            <p className="text-gray-600">
              The AdobeWork name, logo, website design, and all related content are the 
              property of AdobeWork and are protected by copyright and trademark laws. 
              You may not use our intellectual property without prior written consent.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">9. Disclaimer of Warranties</h2>
            <p className="text-gray-600">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT 
              WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Merchantability or fitness for a particular purpose</li>
              <li>Accuracy, reliability, or completeness of conversions</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Security of your files or data</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">10. Limitation of Liability</h2>
            <p className="text-gray-600">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADOBEWORK SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of data, profits, or business opportunities</li>
              <li>Damages resulting from your use or inability to use the Service</li>
              <li>Any errors or inaccuracies in file conversions</li>
            </ul>
            <p className="text-gray-600">
              Our total liability for any claims arising from your use of the Service 
              shall not exceed the amount you paid to use the Service (if any).
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">11. Indemnification</h2>
            <p className="text-gray-600">
              You agree to indemnify and hold harmless AdobeWork, its officers, directors, 
              employees, and agents from any claims, damages, losses, or expenses arising 
              from:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you upload to the Service</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">12. Termination</h2>
            <p className="text-gray-600">
              We reserve the right to terminate or suspend your access to the Service at 
              any time, without notice, for any reason, including but not limited to 
              violation of these Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">13. Governing Law</h2>
            <p className="text-gray-600">
              These Terms shall be governed by and construed in accordance with the laws 
              of the jurisdiction in which AdobeWork operates, without regard to conflict 
              of law principles.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">14. Severability</h2>
            <p className="text-gray-600">
              If any provision of these Terms is found to be unenforceable, the remaining 
              provisions shall continue in full force and effect.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">15. Contact Information</h2>
            <p className="text-gray-600">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="mt-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-white font-semibold hover:bg-primary-700 transition-colors"
              >
                Contact Us
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Related Links */}
            <div className="mt-12 rounded-xl bg-gray-50 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Related Documents</h3>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link
                  href="/privacy-policy"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Privacy Policy →
                </Link>
                <Link
                  href="/about"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  About AdobeWork →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
