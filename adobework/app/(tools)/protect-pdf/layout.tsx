import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('protect-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Protect PDF | AdobeWork',
  description: seo?.description || 'Add password protection to PDF files online for free.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Protect PDF | AdobeWork',
    description: seo?.description || 'Add password protection to PDF files online for free.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function ProtectPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
