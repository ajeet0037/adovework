import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('edit-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Edit PDF | AdobeWork',
  description: seo?.description || 'Edit PDF files online for free. Add text, highlight, and draw.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Edit PDF | AdobeWork',
    description: seo?.description || 'Edit PDF files online for free. Add text, highlight, and draw.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function EditPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
