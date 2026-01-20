import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ad Preferences - AdobeWork',
  description: 'Control your advertising preferences and opt out of personalized ads on AdobeWork.',
  robots: {
    index: false, // Don't index this page
    follow: true,
  },
};

export default function AdPreferencesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Ad Preferences
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Control how ads are personalized for you and manage your privacy settings.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                Google Ad Personalization
              </h3>
              <p className="text-blue-800 mb-4">
                Control how Google personalizes ads based on your activity across websites.
              </p>
              <a 
                href="https://adssettings.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Google Ads
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Privacy Controls
              </h3>
              <p className="text-green-800 mb-4">
                Access Google's privacy dashboard to see and control your data.
              </p>
              <a 
                href="https://myaccount.google.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Privacy Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Detailed Options */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Advertising Options</h2>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Opt Out of Personalized Ads
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You can opt out of personalized advertising. You'll still see ads, but they won't be based on your interests.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href="https://adssettings.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Google Ad Settings
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.aboutads.info/choices/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Industry Opt-Out
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Browser Cookie Settings
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You can also control cookies directly in your browser settings:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 space-y-1">
                    <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
                    <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                    <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                    <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Mobile App Settings
                  </h3>
                  <p className="text-gray-600 mb-4">
                    On mobile devices, you can limit ad tracking:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 space-y-1">
                    <li><strong>iOS:</strong> Settings → Privacy & Security → Apple Advertising → Personalized Ads</li>
                    <li><strong>Android:</strong> Settings → Google → Ads → Opt out of Ads Personalization</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Questions About Ads?
              </h3>
              <p className="text-gray-600 mb-4">
                If you have questions about advertising on AdobeWork or need help with your preferences, we're here to help.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Contact Support
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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