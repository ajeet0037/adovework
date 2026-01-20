import { Metadata } from 'next';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { generateToolMetadata } from '@/lib/utils/seo';

// Get tool configuration for metadata
const tool = getToolBySlug('pdf-to-word')!;
const seo = getToolSEO('pdf-to-word')!;

/**
 * Generate metadata for PDF to Word page
 * Requirements: 6.1, 6.2
 */
export const metadata: Metadata = generateToolMetadata(tool, seo);

export default function PdfToWordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
