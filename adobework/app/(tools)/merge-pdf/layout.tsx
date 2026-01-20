import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('merge-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Merge PDF Files | AdobeWork',
  description: seo?.description || 'Merge multiple PDF files into one document online for free.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Merge PDF Files | AdobeWork',
    description: seo?.description || 'Merge multiple PDF files into one document online for free.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function MergePdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
