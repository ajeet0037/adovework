import { Metadata } from 'next';
import { getToolBySlug } from '@/lib/constants/tools';
import { getToolSEO } from '@/lib/constants/seo';
import { generateToolMetadata } from '@/lib/utils/seo';

// Get tool configuration for metadata
const tool = getToolBySlug('excel-to-pdf')!;
const seo = getToolSEO('excel-to-pdf')!;

/**
 * Generate metadata for Excel to PDF page
 * Requirements: 6.1, 6.2
 */
export const metadata: Metadata = generateToolMetadata(tool, seo);

export default function ExcelToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
