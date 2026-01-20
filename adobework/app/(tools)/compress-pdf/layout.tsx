import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('compress-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Compress PDF | AdobeWork',
  description: seo?.description || 'Compress PDF files online for free. Reduce PDF size while maintaining quality.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Compress PDF | AdobeWork',
    description: seo?.description || 'Compress PDF files online for free. Reduce PDF size while maintaining quality.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function CompressPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
