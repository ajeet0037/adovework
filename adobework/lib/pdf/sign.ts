/**
 * PDF signing functionality using pdf-lib
 * @module lib/pdf/sign
 */

import { PDFDocument, rgb } from 'pdf-lib';
import { loadPdf, savePdf } from './utils';

/**
 * Signature placement options
 */
export interface SignaturePlacement {
  /** Page number (1-indexed) */
  page: number;
  /** X coordinate from left edge */
  x: number;
  /** Y coordinate from bottom edge */
  y: number;
  /** Width of the signature */
  width: number;
  /** Height of the signature */
  height: number;
}

/**
 * Options for adding a signature to a PDF
 */
export interface SignPdfOptions {
  /** The signature image data as base64 data URL or ArrayBuffer */
  signatureData: string | ArrayBuffer;
  /** Signature placements on the PDF */
  placements: SignaturePlacement[];
  /** Optional opacity (0-1, default: 1) */
  opacity?: number;
}

/**
 * Convert a base64 data URL to ArrayBuffer
 */
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Detect image type from data URL or ArrayBuffer
 */
function detectImageType(data: string | ArrayBuffer): 'png' | 'jpg' {
  if (typeof data === 'string') {
    if (data.includes('image/png')) return 'png';
    if (data.includes('image/jpeg') || data.includes('image/jpg')) return 'jpg';
    return 'png'; // Default to PNG for canvas data URLs
  }
  
  // Check magic bytes for ArrayBuffer
  const bytes = new Uint8Array(data);
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'jpg';
  return 'png';
}

/**
 * Add a signature to a PDF document
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param options - Signature options including image data and placements
 * @returns Promise resolving to signed PDF as Uint8Array
 * 
 * @example
 * ```typescript
 * const pdf = await fetch('/doc.pdf').then(r => r.arrayBuffer());
 * const signedPdf = await signPdf(pdf, {
 *   signatureData: 'data:image/png;base64,...',
 *   placements: [{ page: 1, x: 100, y: 100, width: 200, height: 80 }],
 * });
 * ```
 */
export async function signPdf(
  pdfBuffer: ArrayBuffer,
  options: SignPdfOptions
): Promise<Uint8Array> {
  if (!options.signatureData) {
    throw new Error('Signature data is required');
  }

  if (!options.placements || options.placements.length === 0) {
    throw new Error('At least one signature placement is required');
  }

  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  const totalPages = pages.length;

  // Convert signature data to ArrayBuffer if needed
  const signatureBuffer = typeof options.signatureData === 'string'
    ? dataUrlToArrayBuffer(options.signatureData)
    : options.signatureData;

  // Detect image type and embed
  const imageType = detectImageType(options.signatureData);
  let signatureImage;
  
  try {
    if (imageType === 'png') {
      signatureImage = await pdf.embedPng(signatureBuffer);
    } else {
      signatureImage = await pdf.embedJpg(signatureBuffer);
    }
  } catch (error) {
    throw new Error('Failed to embed signature image. Please ensure the signature is a valid PNG or JPG image.');
  }

  const opacity = options.opacity ?? 1;

  // Apply signature to each placement
  for (const placement of options.placements) {
    if (placement.page < 1 || placement.page > totalPages) {
      throw new Error(`Invalid page number: ${placement.page}. PDF has ${totalPages} pages.`);
    }

    const page = pages[placement.page - 1];
    
    page.drawImage(signatureImage, {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      opacity,
    });
  }

  return savePdf(pdf);
}

/**
 * Get PDF page dimensions for signature placement
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to array of page dimensions
 */
export async function getPdfPageDimensions(
  pdfBuffer: ArrayBuffer
): Promise<Array<{ width: number; height: number }>> {
  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  
  return pages.map(page => {
    const { width, height } = page.getSize();
    return { width, height };
  });
}

/**
 * Create a transparent signature image from canvas data
 * This is a utility for processing signature canvas output
 * 
 * @param canvasDataUrl - The canvas data URL (PNG format)
 * @returns The same data URL (already in correct format)
 */
export function processSignatureCanvas(canvasDataUrl: string): string {
  // Canvas data URLs are already in the correct format
  // This function exists for potential future processing
  return canvasDataUrl;
}
