import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('split-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Split PDF | AdobeWork',
  description: seo?.description || 'Split PDF files online for free. Extract specific pages or divide PDF into separate documents.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Split PDF | AdobeWork',
    description: seo?.description || 'Split PDF files online for free. Extract specific pages or divide PDF into separate documents.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function SplitPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
