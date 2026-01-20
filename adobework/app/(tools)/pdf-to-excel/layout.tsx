import { Metadata } from 'next';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { generateToolMetadata } from '@/lib/utils/seo';

// Get tool configuration for metadata
const tool = getToolBySlug('pdf-to-excel')!;
const seo = getToolSEO('pdf-to-excel')!;

/**
 * Generate metadata for PDF to Excel page
 * Requirements: 6.1, 6.2
 */
export const metadata: Metadata = generateToolMetadata(tool, seo);

export default function PdfToExcelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
