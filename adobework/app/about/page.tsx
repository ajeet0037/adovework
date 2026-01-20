import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About AdobeWork - Our Mission & Features',
  description: 'Learn about AdobeWork, your trusted free online PDF tools platform. Fast, secure, and easy-to-use PDF conversion, compression, and editing tools.',
  keywords: [
    'about adobework',
    'pdf tools company',
    'free pdf converter',
    'online pdf tools',
    'pdf editing platform',
  ],
  openGraph: {
    title: 'About AdobeWork - Our Mission & Features',
    description: 'Learn about AdobeWork, your trusted free online PDF tools platform.',
    type: 'website',
    url: 'https://adobework.in/about',
    siteName: 'AdobeWork',
  },
  alternates: {
    canonical: 'https://adobework.in/about',
  },
};

export default function AboutPage() {
  const features = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Process your files in seconds with our optimized conversion engine.',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your files are automatically deleted after 1 hour. We never store or share your data.',
    },
    {
      icon: '💰',
      title: 'Free to Use',
      description: 'Access all essential PDF tools without any cost or registration required.',
    },
    {
      icon: '🌐',
      title: 'Works Everywhere',
      description: 'Use AdobeWork on any device with a web browser - no software installation needed.',
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Fully responsive design works seamlessly on phones, tablets, and desktops.',
    },
    {
      icon: '🎯',
      title: 'Easy to Use',
      description: 'Simple drag-and-drop interface makes PDF processing effortless.',
    },
  ];

  const tools = [
    { name: 'PDF to Word', href: '/pdf-to-word' },
    { name: 'Word to PDF', href: '/word-to-pdf' },
    { name: 'Merge PDF', href: '/merge-pdf' },
    { name: 'Compress PDF', href: '/compress-pdf' },
    { name: 'Split PDF', href: '/split-pdf' },
    { name: 'Edit PDF', href: '/edit-pdf' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              About AdobeWork
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              AdobeWork is your trusted online platform for all PDF needs. We provide fast, 
              free, and secure tools to convert, compress, merge, split, and edit PDF files.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="mt-6 text-lg text-gray-600">
              We believe everyone should have access to powerful PDF tools without barriers. 
              Our mission is to provide the most user-friendly, secure, and efficient PDF 
              processing platform available online - completely free of charge.
            </p>
            <p className="mt-4 text-lg text-gray-600">
              Whether you&apos;re a student working on assignments, a professional handling 
              business documents, or anyone who needs to work with PDFs, AdobeWork is here 
              to make your life easier.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Why Choose AdobeWork?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Tools</h2>
            <p className="mt-4 text-lg text-gray-600">
              AdobeWork offers a comprehensive suite of PDF tools to handle any task.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-full bg-primary-100 px-6 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-200"
              >
                {tool.name}
              </Link>
            ))}
            <Link
              href="/all-tools"
              className="rounded-full bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              View All Tools →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Start using AdobeWork today - no registration required.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-lg font-semibold text-primary-600 transition-colors hover:bg-primary-50"
          >
            Try AdobeWork Now
          </Link>
        </div>
      </section>
    </div>
  );
}
