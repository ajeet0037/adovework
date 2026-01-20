import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('sign-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Sign PDF | AdobeWork',
  description: seo?.description || 'Sign PDF documents online for free. Draw or upload your signature.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Sign PDF | AdobeWork',
    description: seo?.description || 'Sign PDF documents online for free. Draw or upload your signature.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function SignPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
