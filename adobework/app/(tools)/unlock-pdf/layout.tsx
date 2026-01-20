import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('unlock-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Unlock PDF | AdobeWork',
  description: seo?.description || 'Remove password protection from PDF files online for free.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Unlock PDF | AdobeWork',
    description: seo?.description || 'Remove password protection from PDF files online for free.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function UnlockPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
