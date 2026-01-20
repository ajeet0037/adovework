/**
 * PDF merge functionality using pdf-lib
 * @module lib/pdf/merge
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdf, createPdf, savePdf } from './utils';

/**
 * Merge multiple PDF documents into a single PDF
 * 
 * @param pdfBuffers - Array of PDF files as ArrayBuffers
 * @returns Promise resolving to merged PDF as Uint8Array
 * @throws Error if no PDFs provided or if any PDF is invalid
 * 
 * @example
 * ```typescript
 * const pdf1 = await fetch('/doc1.pdf').then(r => r.arrayBuffer());
 * const pdf2 = await fetch('/doc2.pdf').then(r => r.arrayBuffer());
 * const merged = await mergePdfs([pdf1, pdf2]);
 * ```
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (!pdfBuffers || pdfBuffers.length === 0) {
    throw new Error('At least one PDF is required for merging');
  }

  // Create a new PDF document to hold the merged result
  const mergedPdf = await createPdf();

  // Process each PDF and copy its pages to the merged document
  for (const buffer of pdfBuffers) {
    const sourcePdf = await loadPdf(buffer);
    const pageIndices = sourcePdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
    
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  return savePdf(mergedPdf);
}

/**
 * Get the total page count that would result from merging PDFs
 * Useful for validation before actual merge
 * 
 * @param pdfBuffers - Array of PDF files as ArrayBuffers
 * @returns Promise resolving to total page count
 */
export async function getMergedPageCount(pdfBuffers: ArrayBuffer[]): Promise<number> {
  let totalPages = 0;
  
  for (const buffer of pdfBuffers) {
    const pdf = await loadPdf(buffer);
    totalPages += pdf.getPageCount();
  }
  
  return totalPages;
}

/**
 * Validate that all buffers are valid PDFs before merging
 * 
 * @param pdfBuffers - Array of PDF files as ArrayBuffers
 * @returns Promise resolving to validation result with details
 */
export async function validatePdfsForMerge(
  pdfBuffers: ArrayBuffer[]
): Promise<{ valid: boolean; invalidIndices: number[]; error?: string }> {
  if (!pdfBuffers || pdfBuffers.length === 0) {
    return { valid: false, invalidIndices: [], error: 'No PDFs provided' };
  }

  const invalidIndices: number[] = [];

  for (let i = 0; i < pdfBuffers.length; i++) {
    try {
      await PDFDocument.load(pdfBuffers[i]);
    } catch {
      invalidIndices.push(i);
    }
  }

  return {
    valid: invalidIndices.length === 0,
    invalidIndices,
    error: invalidIndices.length > 0 
      ? `Invalid PDFs at indices: ${invalidIndices.join(', ')}` 
      : undefined
  };
}
