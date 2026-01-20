/**
 * PDF split functionality using pdf-lib
 * @module lib/pdf/split
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdf, createPdf, savePdf } from './utils';

/**
 * Page range specification for splitting
 */
export interface PageRange {
  /** Start page (1-indexed) */
  start: number;
  /** End page (1-indexed, inclusive) */
  end: number;
}

/**
 * Result of a split operation
 */
export interface SplitResult {
  /** The split PDF as Uint8Array */
  pdf: Uint8Array;
  /** Pages included in this split (1-indexed) */
  pages: number[];
  /** Suggested filename */
  filename: string;
}

/**
 * Parse a page range string into PageRange objects
 * Supports formats: "1", "1-5", "1,3,5", "1-3,5,7-9"
 * 
 * @param rangeString - The range string to parse
 * @param totalPages - Total pages in the document for validation
 * @returns Array of page numbers (1-indexed)
 */
export function parsePageRange(rangeString: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeString.split(',').map(s => s.trim()).filter(s => s.length > 0);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid page range: ${part}`);
      }

      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        throw new Error(`Page range ${part} is out of bounds (1-${totalPages})`);
      }

      if (start > end) {
        throw new Error(`Invalid range: start (${start}) is greater than end (${end})`);
      }

      for (let i = start; i <= end; i++) {
        pages.add(i);
      }
    } else {
      const page = parseInt(part, 10);

      if (isNaN(page)) {
        throw new Error(`Invalid page number: ${part}`);
      }

      if (page < 1 || page > totalPages) {
        throw new Error(`Page ${page} is out of bounds (1-${totalPages})`);
      }

      pages.add(page);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}


/**
 * Split a PDF by extracting specific pages
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param pages - Array of page numbers to extract (1-indexed)
 * @returns Promise resolving to extracted PDF as Uint8Array
 * @throws Error if pages array is empty or contains invalid page numbers
 * 
 * @example
 * ```typescript
 * const pdf = await fetch('/doc.pdf').then(r => r.arrayBuffer());
 * const extracted = await splitPdf(pdf, [1, 3, 5]); // Extract pages 1, 3, and 5
 * ```
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  pages: number[]
): Promise<Uint8Array> {
  if (!pages || pages.length === 0) {
    throw new Error('At least one page must be specified for splitting');
  }

  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();

  // Validate page numbers
  for (const page of pages) {
    if (page < 1 || page > totalPages) {
      throw new Error(`Page ${page} is out of bounds (1-${totalPages})`);
    }
  }

  // Create new PDF with selected pages
  const newPdf = await createPdf();
  
  // Convert 1-indexed to 0-indexed and copy pages
  const pageIndices = pages.map(p => p - 1);
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  
  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  return savePdf(newPdf);
}

/**
 * Split a PDF by page range string
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param rangeString - Page range string (e.g., "1-5", "1,3,5", "1-3,5,7-9")
 * @returns Promise resolving to extracted PDF as Uint8Array
 */
export async function splitPdfByRange(
  pdfBuffer: ArrayBuffer,
  rangeString: string
): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();
  const pages = parsePageRange(rangeString, totalPages);
  
  return splitPdf(pdfBuffer, pages);
}

/**
 * Split a PDF into individual pages
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to array of SplitResult, one per page
 */
export async function splitPdfIntoPages(
  pdfBuffer: ArrayBuffer
): Promise<SplitResult[]> {
  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();
  const results: SplitResult[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const pdf = await splitPdf(pdfBuffer, [i]);
    results.push({
      pdf,
      pages: [i],
      filename: `page_${i}.pdf`,
    });
  }

  return results;
}

/**
 * Split a PDF into chunks of specified size
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param pagesPerChunk - Number of pages per chunk
 * @returns Promise resolving to array of SplitResult
 */
export async function splitPdfIntoChunks(
  pdfBuffer: ArrayBuffer,
  pagesPerChunk: number
): Promise<SplitResult[]> {
  if (pagesPerChunk < 1) {
    throw new Error('Pages per chunk must be at least 1');
  }

  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();
  const results: SplitResult[] = [];

  for (let start = 1; start <= totalPages; start += pagesPerChunk) {
    const end = Math.min(start + pagesPerChunk - 1, totalPages);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    
    const pdf = await splitPdf(pdfBuffer, pages);
    results.push({
      pdf,
      pages,
      filename: `pages_${start}-${end}.pdf`,
    });
  }

  return results;
}

/**
 * Get page count of a PDF without fully loading it
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to page count
 */
export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  const pdf = await loadPdf(pdfBuffer);
  return pdf.getPageCount();
}
