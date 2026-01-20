import Link from 'next/link';

const popularTools = [
  { href: '/merge-pdf', label: 'Merge PDF' },
  { href: '/compress-pdf', label: 'Compress PDF' },
  { href: '/pdf-to-word', label: 'PDF to Word' },
  { href: '/remove-background', label: 'Remove BG' },
];

const stats = [
  { value: '50+', label: 'Tools' },
  { value: '100%', label: 'Free' },
  { value: '256-bit', label: 'SSL' },
];

export interface HeroProps {
  subHeadline?: string;
  ctaText?: string;
  ctaHref?: string;
}

export const Hero: React.FC<HeroProps> = ({
  subHeadline = 'Convert, compress, merge, split, and edit PDF files online. Fast, free, and secure.',
  ctaText = 'Explore All Tools',
  ctaHref = '#tools',
}) => {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge - simplified */}
          <p className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
            Free Online PDF & Image Tools
          </p>

          {/* Headline - LCP Element - simplified for faster paint */}
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
            All Your{' '}
            <span className="text-primary-600">PDF & Image Tools</span>
            {' '}in One Place
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-600 sm:text-lg">
            {subHeadline}
          </p>

          {/* CTA Buttons - simplified */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href={ctaHref}
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {ctaText}
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              href="/about"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              About Us
            </Link>
          </div>

          {/* Popular Tools - simplified */}
          <div className="mt-8">
            <p className="text-xs text-gray-500 mb-3">Popular Tools</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {popularTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
                >
                  {tool.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats - simplified */}
          <div className="mt-10 flex justify-center gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-primary-600">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
