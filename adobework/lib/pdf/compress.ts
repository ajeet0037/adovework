/**
 * PDF compression functionality using pdf-lib
 * @module lib/pdf/compress
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdf, savePdf } from './utils';

/**
 * Compression options for PDF files
 */
export interface CompressionOptions {
  /** Remove document metadata (title, author, etc.) */
  removeMetadata?: boolean;
  /** Use object streams for better compression */
  useObjectStreams?: boolean;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  removeMetadata: true,
  useObjectStreams: true,
};

/**
 * Compress a PDF document by removing metadata and optimizing structure
 * 
 * Note: pdf-lib provides limited compression capabilities compared to
 * server-side tools. This implementation focuses on:
 * - Removing metadata
 * - Using object streams for better compression
 * - Removing unused objects during save
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param options - Compression options
 * @returns Promise resolving to compressed PDF as Uint8Array
 * 
 * @example
 * ```typescript
 * const original = await fetch('/large.pdf').then(r => r.arrayBuffer());
 * const compressed = await compressPdf(original);
 * ```
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer,
  options: CompressionOptions = DEFAULT_OPTIONS
): Promise<Uint8Array> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Load the PDF
  const pdf = await loadPdf(pdfBuffer);

  // Remove metadata if requested
  if (mergedOptions.removeMetadata) {
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');
  }

  // Save with compression options
  // pdf-lib automatically removes unused objects during save
  const compressedBytes = await pdf.save({
    useObjectStreams: mergedOptions.useObjectStreams,
  });

  return compressedBytes;
}

/**
 * Get compression statistics for a PDF
 * 
 * @param originalBuffer - Original PDF as ArrayBuffer
 * @param compressedBuffer - Compressed PDF as Uint8Array
 * @returns Compression statistics
 */
export function getCompressionStats(
  originalBuffer: ArrayBuffer,
  compressedBuffer: Uint8Array
): {
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  compressionRatio: number;
  percentReduction: number;
} {
  const originalSize = originalBuffer.byteLength;
  const compressedSize = compressedBuffer.byteLength;
  const savedBytes = originalSize - compressedSize;
  const compressionRatio = originalSize / compressedSize;
  const percentReduction = (savedBytes / originalSize) * 100;

  return {
    originalSize,
    compressedSize,
    savedBytes,
    compressionRatio,
    percentReduction: Math.max(0, percentReduction), // Ensure non-negative
  };
}

/**
 * Compress a PDF and return both the result and statistics
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param options - Compression options
 * @returns Promise resolving to compressed PDF and statistics
 */
export async function compressPdfWithStats(
  pdfBuffer: ArrayBuffer,
  options: CompressionOptions = DEFAULT_OPTIONS
): Promise<{
  compressed: Uint8Array;
  stats: ReturnType<typeof getCompressionStats>;
}> {
  const compressed = await compressPdf(pdfBuffer, options);
  const stats = getCompressionStats(pdfBuffer, compressed);

  return { compressed, stats };
}
