import { Metadata } from 'next';
import { getToolSEO } from '@/lib/constants/seo';

const seo = getToolSEO('image-to-pdf');

export const metadata: Metadata = {
  title: seo?.title || 'Image to PDF Converter | AdobeWork',
  description: seo?.description || 'Convert JPG and PNG images to PDF online for free.',
  keywords: seo?.keywords?.join(', '),
  openGraph: {
    title: seo?.title || 'Image to PDF Converter | AdobeWork',
    description: seo?.description || 'Convert JPG and PNG images to PDF online for free.',
    type: 'website',
    siteName: 'AdobeWork',
  },
};

export default function ImageToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
