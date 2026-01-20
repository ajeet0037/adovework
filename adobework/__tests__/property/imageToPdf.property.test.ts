/**
 * Property-based tests for image to PDF conversion
 * Feature: adobework, Property 6: Image to PDF Conversion
 * Validates: Requirements 4.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PDFDocument } from 'pdf-lib';
import {
  imageToPdf,
  imagesToPdf,
  detectImageFormat,
  validateImageBuffer,
  SupportedImageFormat,
} from '../../lib/converters/imageToPdf';
import { loadPdf } from '../../lib/pdf/utils';

/**
 * Create a minimal valid JPEG image buffer
 * This creates a 1x1 pixel JPEG image
 */
function createMinimalJpeg(): ArrayBuffer {
  // Minimal valid JPEG (1x1 red pixel)
  const jpegBytes = new Uint8Array([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7E, 0xB4,
    0x01, 0xFF, 0xD9,
  ]);
  return jpegBytes.buffer.slice(jpegBytes.byteOffset, jpegBytes.byteOffset + jpegBytes.byteLength);
}

/**
 * Create a minimal valid PNG image buffer
 * This creates a 1x1 pixel PNG image
 */
function createMinimalPng(): ArrayBuffer {
  // Minimal valid PNG (1x1 red pixel)
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, // compressed data
    0x01, 0xA0, 0x01, 0x19, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82, // CRC
  ]);
  return pngBytes.buffer.slice(pngBytes.byteOffset, pngBytes.byteOffset + pngBytes.byteLength);
}

/**
 * Check if a buffer starts with PDF magic bytes
 */
function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  // PDF files start with %PDF
  return (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46    // F
  );
}

describe('Feature: adobework, Property 6: Image to PDF Conversion', () => {
  /**
   * Property 6: Image to PDF Conversion
   * For any valid JPG or PNG image, converting to PDF should produce a valid
   * PDF document that can be opened and contains at least one page.
   */
  it('JPEG image converts to valid PDF with at least one page', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('image/jpeg' as SupportedImageFormat),
        async (mimeType) => {
          const jpegBuffer = createMinimalJpeg();
          
          // Convert to PDF
          const pdfBytes = await imageToPdf(jpegBuffer, mimeType);
          const pdfBuffer = pdfBytes.buffer.slice(
            pdfBytes.byteOffset,
            pdfBytes.byteOffset + pdfBytes.byteLength
          );
          
          // Verify it's a valid PDF
          expect(isPdfBuffer(pdfBuffer)).toBe(true);
          
          // Verify it can be loaded and has at least one page
          const pdf = await loadPdf(pdfBuffer);
          expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PNG image converts to valid PDF with at least one page', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('image/png' as SupportedImageFormat),
        async (mimeType) => {
          const pngBuffer = createMinimalPng();
          
          // Convert to PDF
          const pdfBytes = await imageToPdf(pngBuffer, mimeType);
          const pdfBuffer = pdfBytes.buffer.slice(
            pdfBytes.byteOffset,
            pdfBytes.byteOffset + pdfBytes.byteLength
          );
          
          // Verify it's a valid PDF
          expect(isPdfBuffer(pdfBuffer)).toBe(true);
          
          // Verify it can be loaded and has at least one page
          const pdf = await loadPdf(pdfBuffer);
          expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple images convert to PDF with correct page count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (imageCount) => {
          // Create array of images alternating between JPEG and PNG
          const images: Array<{ buffer: ArrayBuffer; mimeType: SupportedImageFormat }> = [];
          
          for (let i = 0; i < imageCount; i++) {
            if (i % 2 === 0) {
              images.push({ buffer: createMinimalJpeg(), mimeType: 'image/jpeg' });
            } else {
              images.push({ buffer: createMinimalPng(), mimeType: 'image/png' });
            }
          }
          
          // Convert to PDF
          const pdfBytes = await imagesToPdf(images);
          const pdfBuffer = pdfBytes.buffer.slice(
            pdfBytes.byteOffset,
            pdfBytes.byteOffset + pdfBytes.byteLength
          );
          
          // Verify page count matches image count
          const pdf = await loadPdf(pdfBuffer);
          expect(pdf.getPageCount()).toBe(imageCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('detectImageFormat correctly identifies JPEG', () => {
    const jpegBuffer = createMinimalJpeg();
    expect(detectImageFormat(jpegBuffer)).toBe('image/jpeg');
  });

  it('detectImageFormat correctly identifies PNG', () => {
    const pngBuffer = createMinimalPng();
    expect(detectImageFormat(pngBuffer)).toBe('image/png');
  });

  it('detectImageFormat returns null for invalid format', () => {
    const invalidBuffer = new ArrayBuffer(10);
    expect(detectImageFormat(invalidBuffer)).toBeNull();
  });

  it('validateImageBuffer validates JPEG correctly', () => {
    const jpegBuffer = createMinimalJpeg();
    const result = validateImageBuffer(jpegBuffer);
    expect(result.valid).toBe(true);
    expect(result.format).toBe('image/jpeg');
  });

  it('validateImageBuffer validates PNG correctly', () => {
    const pngBuffer = createMinimalPng();
    const result = validateImageBuffer(pngBuffer);
    expect(result.valid).toBe(true);
    expect(result.format).toBe('image/png');
  });

  it('validateImageBuffer rejects invalid format', () => {
    const invalidBuffer = new ArrayBuffer(10);
    const result = validateImageBuffer(invalidBuffer);
    expect(result.valid).toBe(false);
    expect(result.format).toBeNull();
    expect(result.error).toBeDefined();
  });
});
