import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('watermark-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Watermark PDF | AdobeWork',
  description: seo?.description || 'Add text or image watermarks to PDF files online for free.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Watermark PDF | AdobeWork',
    description: seo?.description || 'Add text or image watermarks to PDF files online for free.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function WatermarkPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
