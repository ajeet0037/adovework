/**
 * Property-based tests for PDF compression functionality
 * Feature: adobework, Property 5: PDF Compression Size Reduction
 * Validates: Requirements 4.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PDFDocument, rgb } from 'pdf-lib';
import { compressPdf, compressPdfWithStats } from '../../lib/pdf/compress';
import { loadPdf } from '../../lib/pdf/utils';

/**
 * Helper to create a PDF with metadata and content
 */
async function createPdfWithMetadata(
  pageCount: number,
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
  } = {}
): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  
  // Add metadata
  if (metadata.title) pdf.setTitle(metadata.title);
  if (metadata.author) pdf.setAuthor(metadata.author);
  if (metadata.subject) pdf.setSubject(metadata.subject);
  
  // Add pages with some content
  for (let i = 0; i < pageCount; i++) {
    const page = pdf.addPage();
    page.drawText(`Page ${i + 1}`, {
      x: 50,
      y: page.getHeight() - 50,
      size: 12,
    });
  }
  
  const bytes = await pdf.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

describe('Feature: adobework, Property 5: PDF Compression Size Reduction', () => {
  /**
   * Property 5: PDF Compression Size Reduction
   * For any valid PDF document, the compress operation should produce an output
   * file with size less than or equal to the original file size.
   */
  it('compressed PDF size is less than or equal to original size', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.record({
          title: fc.string({ minLength: 10, maxLength: 100 }),
          author: fc.string({ minLength: 5, maxLength: 50 }),
          subject: fc.string({ minLength: 10, maxLength: 200 }),
        }),
        async (pageCount, metadata) => {
          // Create a PDF with metadata
          const originalBuffer = await createPdfWithMetadata(pageCount, metadata);
          const originalSize = originalBuffer.byteLength;

          // Compress the PDF
          const compressedBytes = await compressPdf(originalBuffer);
          const compressedSize = compressedBytes.byteLength;

          // Compressed size should be <= original size
          expect(compressedSize).toBeLessThanOrEqual(originalSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('compressed PDF remains valid and readable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (pageCount) => {
          const originalBuffer = await createPdfWithMetadata(pageCount, {
            title: 'Test Document',
            author: 'Test Author',
          });

          const compressedBytes = await compressPdf(originalBuffer);
          const compressedBuffer = compressedBytes.buffer.slice(
            compressedBytes.byteOffset,
            compressedBytes.byteOffset + compressedBytes.byteLength
          );

          // Should be able to load the compressed PDF
          const compressedPdf = await loadPdf(compressedBuffer);
          
          // Page count should be preserved
          expect(compressedPdf.getPageCount()).toBe(pageCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('compression removes metadata when requested', async () => {
    const originalBuffer = await createPdfWithMetadata(1, {
      title: 'Original Title',
      author: 'Original Author',
      subject: 'Original Subject',
    });

    const compressedBytes = await compressPdf(originalBuffer, { removeMetadata: true });
    const compressedBuffer = compressedBytes.buffer.slice(
      compressedBytes.byteOffset,
      compressedBytes.byteOffset + compressedBytes.byteLength
    );

    const compressedPdf = await loadPdf(compressedBuffer);
    
    // Metadata should be cleared
    expect(compressedPdf.getTitle()).toBe('');
    expect(compressedPdf.getAuthor()).toBe('');
    expect(compressedPdf.getSubject()).toBe('');
  });

  it('compression stats are accurate', async () => {
    const originalBuffer = await createPdfWithMetadata(3, {
      title: 'A very long title that takes up space in the PDF metadata',
      author: 'An author with a long name',
      subject: 'A detailed subject description',
    });

    const { compressed, stats } = await compressPdfWithStats(originalBuffer);

    // Verify stats accuracy
    expect(stats.originalSize).toBe(originalBuffer.byteLength);
    expect(stats.compressedSize).toBe(compressed.byteLength);
    expect(stats.savedBytes).toBe(stats.originalSize - stats.compressedSize);
    expect(stats.percentReduction).toBeGreaterThanOrEqual(0);
    expect(stats.percentReduction).toBeLessThanOrEqual(100);
  });
});
