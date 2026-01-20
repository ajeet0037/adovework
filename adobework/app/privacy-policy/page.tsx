import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - AdobeWork',
  description: 'Learn how AdobeWork handles your data and protects your privacy. Your files are automatically deleted after 1 hour.',
  keywords: [
    'adobework privacy',
    'pdf tools privacy policy',
    'file security',
    'data protection',
  ],
  openGraph: {
    title: 'Privacy Policy - AdobeWork',
    description: 'Learn how AdobeWork handles your data and protects your privacy.',
    type: 'website',
    url: 'https://adobework.in/privacy-policy',
    siteName: 'AdobeWork',
  },
  alternates: {
    canonical: 'https://adobework.in/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'December 28, 2025';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Your privacy is important to us. This policy explains how we handle your data.
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
            {/* Introduction */}
            <div className="rounded-xl bg-green-50 p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔒</div>
                <div>
                  <h2 className="text-xl font-bold text-green-800 mt-0">
                    Your Files Are Safe
                  </h2>
                  <p className="text-green-700 mb-0">
                    All files uploaded to AdobeWork are automatically deleted from our servers 
                    within 1 hour of processing. We do not store, share, or sell your documents.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6">1.1 Files You Upload</h3>
            <p className="text-gray-600">
              When you use our PDF tools, you upload files to our servers for processing. 
              These files are:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Processed only for the purpose of the requested conversion or operation</li>
              <li>Automatically deleted within 1 hour after processing</li>
              <li>Never accessed, viewed, or analyzed by our staff</li>
              <li>Never shared with third parties</li>
              <li>Never used for training AI models or any other purpose</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6">1.2 Usage Data</h3>
            <p className="text-gray-600">
              We collect anonymous usage data to improve our services, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Pages visited and tools used</li>
              <li>Browser type and device information</li>
              <li>General geographic location (country/region level)</li>
              <li>Referral sources</li>
            </ul>
            <p className="text-gray-600">
              This data is collected anonymously and cannot be used to identify individual users.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6">1.3 Contact Information</h3>
            <p className="text-gray-600">
              If you contact us through our contact form, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Your name and email address</li>
              <li>The content of your message</li>
            </ul>
            <p className="text-gray-600">
              This information is used solely to respond to your inquiry and is not shared 
              with third parties.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">2. How We Use Your Information</h2>
            <p className="text-gray-600">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Process your file conversions and operations</li>
              <li>Improve our services and user experience</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Analyze usage patterns to optimize performance</li>
              <li>Detect and prevent abuse or misuse of our services</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">3. File Security</h2>
            <p className="text-gray-600">
              We take the security of your files seriously:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Encryption:</strong> All file transfers use HTTPS/TLS encryption
              </li>
              <li>
                <strong>Automatic Deletion:</strong> Files are automatically deleted within 
                1 hour of processing
              </li>
              <li>
                <strong>No Permanent Storage:</strong> We do not permanently store any 
                uploaded files
              </li>
              <li>
                <strong>Secure Processing:</strong> Files are processed in isolated 
                environments
              </li>
              <li>
                <strong>No Human Access:</strong> Our staff does not access or view your files
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Cookies and Tracking</h2>
            <p className="text-gray-600">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Remember your preferences</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Display relevant advertisements</li>
            </ul>
            <p className="text-gray-600">
              You can control cookie settings through your browser. Disabling cookies may 
              affect some functionality of our services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6">4.1 Advertisement Cookies</h3>
            <p className="text-gray-600">
              We use Google AdSense to display advertisements. Google may use cookies to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Show you personalized ads based on your interests</li>
              <li>Measure ad performance and effectiveness</li>
              <li>Prevent the same ad from being shown too many times</li>
            </ul>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">🎯 Control Your Ad Experience</h4>
              <p className="text-blue-800 mb-4">
                You can opt out of personalized advertising and control how Google uses your data:
              </p>
              <div className="space-y-3">
                <a 
                  href="https://www.google.com/settings/ads" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Google Ad Settings
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <br />
                <a 
                  href="https://adssettings.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Opt Out of Personalized Ads
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <br />
                <a 
                  href="https://www.aboutads.info/choices/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Industry Opt-Out Page
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <p className="text-blue-700 text-sm mt-4">
                Note: Opting out of personalized ads doesn't mean you'll see fewer ads, 
                but they will be less relevant to your interests.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Third-Party Services</h2>
            <p className="text-gray-600">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Google Analytics:</strong> For anonymous usage analytics
              </li>
              <li>
                <strong>Google AdSense:</strong> For displaying advertisements
              </li>
            </ul>
            <p className="text-gray-600">
              These services may collect their own data according to their respective 
              privacy policies.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">6. Data Retention</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Uploaded Files:</strong> Deleted within 1 hour of processing
              </li>
              <li>
                <strong>Usage Data:</strong> Retained for up to 26 months for analytics
              </li>
              <li>
                <strong>Contact Information:</strong> Retained as long as necessary to 
                respond to your inquiry
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">7. Your Rights</h2>
            <p className="text-gray-600">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access information we hold about you</li>
              <li>Request deletion of your personal data</li>
              <li>Opt out of marketing communications</li>
              <li>Opt out of personalized advertising (see section 4.1 above)</li>
              <li>Disable cookies through your browser settings</li>
              <li>Request information about third-party data sharing</li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
              <h4 className="text-lg font-semibold text-yellow-900 mb-3">⚙️ Browser Cookie Controls</h4>
              <p className="text-yellow-800 mb-3">
                You can also control cookies directly in your browser:
              </p>
              <ul className="list-disc pl-6 text-yellow-700 space-y-1 text-sm">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">8. Children&apos;s Privacy</h2>
            <p className="text-gray-600">
              Our services are not directed to children under 13. We do not knowingly 
              collect personal information from children under 13. If you believe we have 
              collected information from a child under 13, please contact us.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">9. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this privacy policy from time to time. We will notify you of 
              any changes by posting the new policy on this page and updating the 
              &quot;Last updated&quot; date.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">10. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this privacy policy or our data practices, 
              please contact us:
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
          </div>
        </div>
      </section>
    </div>
  );
}
