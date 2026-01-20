/**
 * Property-based tests for PDF to Word conversion
 * Feature: adobework, Property 15: Conversion Output Validity
 * Validates: Requirements 4.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// DOCX magic bytes: PK (ZIP format) - 50 4B 03 04
const DOCX_MAGIC_BYTES = [0x50, 0x4B, 0x03, 0x04];

/**
 * Check if a buffer starts with DOCX magic bytes (ZIP format)
 */
function isValidDocx(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return false;
  
  return (
    bytes[0] === DOCX_MAGIC_BYTES[0] &&
    bytes[1] === DOCX_MAGIC_BYTES[1] &&
    bytes[2] === DOCX_MAGIC_BYTES[2] &&
    bytes[3] === DOCX_MAGIC_BYTES[3]
  );
}

/**
 * Create a DOCX document from text paragraphs
 * This mirrors the logic in the API route
 */
function createDocxFromParagraphs(paragraphs: string[]): Document {
  const children: Paragraph[] = [];
  
  paragraphs.forEach((text, index) => {
    // Detect if this might be a heading
    const isHeading = text.length < 100 && (
      text === text.toUpperCase() ||
      text.endsWith(':') ||
      /^(chapter|section|\d+\.)/i.test(text)
    );
    
    if (isHeading && index < paragraphs.length - 1) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });
  
  // If no content, add a placeholder
  if (children.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'No text content could be extracted from this PDF.',
            italics: true,
          }),
        ],
      })
    );
  }
  
  return new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });
}

/**
 * Convert paragraphs to DOCX buffer
 */
async function convertParagraphsToDocx(paragraphs: string[]): Promise<ArrayBuffer> {
  const doc = createDocxFromParagraphs(paragraphs);
  const docxBuffer = await Packer.toBuffer(doc);
  return docxBuffer.buffer.slice(
    docxBuffer.byteOffset,
    docxBuffer.byteOffset + docxBuffer.byteLength
  );
}

describe('Feature: adobework, Property 15: Conversion Output Validity', () => {
  /**
   * Property 15: Conversion Output Validity
   * For any valid input file to a conversion tool, the output should be a valid file
   * of the expected output format (verifiable by file signature/magic bytes).
   * 
   * This test validates that the DOCX generation produces valid DOCX files
   * for any text content that could be extracted from a PDF.
   */
  it('converted output has valid DOCX magic bytes for any text content', { timeout: 30000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random text content (simulating PDF text extraction)
        fc.array(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 20 }
        ),
        async (paragraphs) => {
          // Convert to DOCX
          const docxBuffer = await convertParagraphsToDocx(paragraphs);
          
          // Verify the output has valid DOCX magic bytes
          expect(isValidDocx(docxBuffer)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty content produces valid DOCX output', async () => {
    // Test with empty paragraphs array
    const docxBuffer = await convertParagraphsToDocx([]);
    
    // Verify the output has valid DOCX magic bytes
    expect(isValidDocx(docxBuffer)).toBe(true);
  });

  it('DOCX output is non-empty for any content', { timeout: 30000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          { minLength: 0, maxLength: 10 }
        ),
        async (paragraphs) => {
          const docxBuffer = await convertParagraphsToDocx(paragraphs);
          
          // DOCX should have reasonable size (at least the ZIP header + content)
          expect(docxBuffer.byteLength).toBeGreaterThan(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('heading detection produces valid DOCX', { timeout: 30000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate content with potential headings
        fc.array(
          fc.oneof(
            // Regular text
            fc.string({ minLength: 100, maxLength: 300 }),
            // Short text (potential heading)
            fc.string({ minLength: 1, maxLength: 50 }),
            // All caps (potential heading)
            fc.string({ minLength: 1, maxLength: 50 }).map(s => s.toUpperCase()),
            // Ends with colon (potential heading)
            fc.string({ minLength: 1, maxLength: 50 }).map(s => s + ':'),
            // Chapter/Section prefix
            fc.string({ minLength: 1, maxLength: 50 }).map(s => 'Chapter ' + s)
          ).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 15 }
        ),
        async (paragraphs) => {
          const docxBuffer = await convertParagraphsToDocx(paragraphs);
          
          // Verify the output has valid DOCX magic bytes
          expect(isValidDocx(docxBuffer)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('special characters in content produce valid DOCX', { timeout: 30000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate content with special characters
        fc.array(
          fc.string({ minLength: 1, maxLength: 200 }),
          { minLength: 1, maxLength: 10 }
        ),
        async (paragraphs) => {
          // Filter out completely empty paragraphs
          const filteredParagraphs = paragraphs.filter(p => p.trim().length > 0);
          if (filteredParagraphs.length === 0) {
            filteredParagraphs.push('Test content');
          }
          
          const docxBuffer = await convertParagraphsToDocx(filteredParagraphs);
          
          // Verify the output has valid DOCX magic bytes
          expect(isValidDocx(docxBuffer)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
