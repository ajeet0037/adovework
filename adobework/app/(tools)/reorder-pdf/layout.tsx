import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('reorder-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Reorder PDF | AdobeWork',
  description: seo?.description || 'Reorder PDF pages online for free. Drag and drop to rearrange pages.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Reorder PDF | AdobeWork',
    description: seo?.description || 'Reorder PDF pages online for free. Drag and drop to rearrange pages.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function ReorderPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
