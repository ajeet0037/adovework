/**
 * Property-based tests for PDF merge functionality
 * Feature: adobework, Property 4: PDF Merge Page Count Invariant
 * Validates: Requirements 4.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs } from '../../lib/pdf/merge';
import { loadPdf } from '../../lib/pdf/utils';

/**
 * Helper to create a valid PDF with a specified number of pages
 */
async function createPdfWithPages(pageCount: number): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage();
  }
  const bytes = await pdf.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

describe('Feature: adobework, Property 4: PDF Merge Page Count Invariant', () => {
  /**
   * Property 4: PDF Merge Page Count Invariant
   * For any list of valid PDF documents, merging them should produce a single PDF
   * where the total page count equals the sum of all input document page counts.
   */
  it('merged PDF page count equals sum of input page counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of 1-5 PDFs, each with 1-10 pages
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 5 }),
        async (pageCounts) => {
          // Create PDFs with the specified page counts
          const pdfBuffers = await Promise.all(
            pageCounts.map(count => createPdfWithPages(count))
          );

          // Calculate expected total pages
          const expectedTotalPages = pageCounts.reduce((sum, count) => sum + count, 0);

          // Merge the PDFs
          const mergedBytes = await mergePdfs(pdfBuffers);
          const mergedBuffer = mergedBytes.buffer.slice(
            mergedBytes.byteOffset,
            mergedBytes.byteOffset + mergedBytes.byteLength
          );

          // Load the merged PDF and check page count
          const mergedPdf = await loadPdf(mergedBuffer);
          const actualPageCount = mergedPdf.getPageCount();

          expect(actualPageCount).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('merging a single PDF preserves its page count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        async (pageCount) => {
          const pdfBuffer = await createPdfWithPages(pageCount);
          const mergedBytes = await mergePdfs([pdfBuffer]);
          const mergedBuffer = mergedBytes.buffer.slice(
            mergedBytes.byteOffset,
            mergedBytes.byteOffset + mergedBytes.byteLength
          );
          
          const mergedPdf = await loadPdf(mergedBuffer);
          expect(mergedPdf.getPageCount()).toBe(pageCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('merge order is preserved (pages appear in input order)', async () => {
    // Create two PDFs with different page sizes to verify order
    const pdf1 = await PDFDocument.create();
    const page1 = pdf1.addPage([100, 100]); // Small page
    const pdf1Bytes = await pdf1.save();
    const pdf1Buffer = pdf1Bytes.buffer.slice(
      pdf1Bytes.byteOffset,
      pdf1Bytes.byteOffset + pdf1Bytes.byteLength
    );

    const pdf2 = await PDFDocument.create();
    const page2 = pdf2.addPage([500, 500]); // Large page
    const pdf2Bytes = await pdf2.save();
    const pdf2Buffer = pdf2Bytes.buffer.slice(
      pdf2Bytes.byteOffset,
      pdf2Bytes.byteOffset + pdf2Bytes.byteLength
    );

    const mergedBytes = await mergePdfs([pdf1Buffer, pdf2Buffer]);
    const mergedBuffer = mergedBytes.buffer.slice(
      mergedBytes.byteOffset,
      mergedBytes.byteOffset + mergedBytes.byteLength
    );
    
    const mergedPdf = await loadPdf(mergedBuffer);
    const pages = mergedPdf.getPages();

    // First page should be small (from pdf1)
    expect(pages[0].getWidth()).toBe(100);
    expect(pages[0].getHeight()).toBe(100);

    // Second page should be large (from pdf2)
    expect(pages[1].getWidth()).toBe(500);
    expect(pages[1].getHeight()).toBe(500);
  });
});
