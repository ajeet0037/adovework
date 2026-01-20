import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('word-to-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Word to PDF Converter | AdobeWork',
  description: seo?.description || 'Convert Word documents to PDF online for free.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Word to PDF Converter | AdobeWork',
    description: seo?.description || 'Convert Word documents to PDF online for free.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function WordToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
