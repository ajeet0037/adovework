import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('rotate-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Rotate PDF | AdobeWork',
  description: seo?.description || 'Rotate PDF pages online for free. Turn pages 90, 180, or 270 degrees easily.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Rotate PDF | AdobeWork',
    description: seo?.description || 'Rotate PDF pages online for free. Turn pages 90, 180, or 270 degrees easily.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function RotatePdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
