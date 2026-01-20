import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - AdobeWork',
  description: 'Get in touch with AdobeWork. Have questions about our PDF tools? Need technical support? We\'re here to help.',
  keywords: [
    'contact adobework',
    'pdf tools support',
    'customer service',
    'technical support',
  ],
  openGraph: {
    title: 'Contact Us - AdobeWork',
    description: 'Get in touch with AdobeWork. We\'re here to help with any questions.',
    type: 'website',
    url: 'https://adobework.in/contact',
    siteName: 'AdobeWork',
  },
  alternates: {
    canonical: 'https://adobework.in/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
