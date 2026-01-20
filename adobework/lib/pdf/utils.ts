/**
 * Common PDF utilities using pdf-lib
 * @module lib/pdf/utils
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Load a PDF document from an ArrayBuffer
 * @param buffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to a PDFDocument
 */
export async function loadPdf(buffer: ArrayBuffer): Promise<PDFDocument> {
  return PDFDocument.load(buffer);
}

/**
 * Create a new empty PDF document
 * @returns Promise resolving to a new PDFDocument
 */
export async function createPdf(): Promise<PDFDocument> {
  return PDFDocument.create();
}

/**
 * Save a PDF document to bytes
 * @param pdf - The PDFDocument to save
 * @returns Promise resolving to Uint8Array of PDF bytes
 */
export async function savePdf(pdf: PDFDocument): Promise<Uint8Array> {
  return pdf.save();
}

/**
 * Get the page count of a PDF document
 * @param pdf - The PDFDocument
 * @returns Number of pages in the document
 */
export function getPageCount(pdf: PDFDocument): number {
  return pdf.getPageCount();
}

/**
 * Convert Uint8Array to ArrayBuffer
 * @param uint8Array - The Uint8Array to convert
 * @returns ArrayBuffer
 */
export function uint8ArrayToArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  const buffer = uint8Array.buffer;
  if (buffer instanceof ArrayBuffer) {
    return buffer.slice(
      uint8Array.byteOffset,
      uint8Array.byteOffset + uint8Array.byteLength
    );
  }
  // Handle SharedArrayBuffer case by copying to a new ArrayBuffer
  const newBuffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(newBuffer).set(uint8Array);
  return newBuffer;
}

/**
 * Convert ArrayBuffer to Uint8Array
 * @param buffer - The ArrayBuffer to convert
 * @returns Uint8Array
 */
export function arrayBufferToUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

/**
 * Validate that a buffer contains a valid PDF
 * @param buffer - The buffer to validate
 * @returns Promise resolving to true if valid PDF, false otherwise
 */
export async function isValidPdf(buffer: ArrayBuffer): Promise<boolean> {
  try {
    await PDFDocument.load(buffer);
    return true;
  } catch {
    return false;
  }
}
