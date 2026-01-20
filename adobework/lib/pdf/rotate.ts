/**
 * PDF rotation functionality using pdf-lib
 * @module lib/pdf/rotate
 */

import { PDFDocument, degrees } from 'pdf-lib';
import { loadPdf, savePdf } from './utils';

/**
 * Valid rotation angles in degrees
 */
export type RotationAngle = 90 | 180 | 270;

/**
 * Rotation direction for convenience
 */
export type RotationDirection = 'clockwise' | 'counterclockwise' | 'flip';

/**
 * Convert rotation direction to angle
 */
export function directionToAngle(direction: RotationDirection): RotationAngle {
  switch (direction) {
    case 'clockwise':
      return 90;
    case 'counterclockwise':
      return 270;
    case 'flip':
      return 180;
  }
}

/**
 * Validate that an angle is a valid rotation angle
 */
export function isValidRotationAngle(angle: number): angle is RotationAngle {
  return angle === 90 || angle === 180 || angle === 270;
}

/**
 * Rotate specific pages in a PDF
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param angle - Rotation angle (90, 180, or 270 degrees clockwise)
 * @param pageNumbers - Array of page numbers to rotate (1-indexed). If empty, rotates all pages.
 * @returns Promise resolving to rotated PDF as Uint8Array
 * 
 * @example
 * ```typescript
 * const pdf = await fetch('/doc.pdf').then(r => r.arrayBuffer());
 * // Rotate all pages 90 degrees clockwise
 * const rotated = await rotatePdf(pdf, 90);
 * // Rotate only pages 1 and 3
 * const rotatedSome = await rotatePdf(pdf, 90, [1, 3]);
 * ```
 */
export async function rotatePdf(
  pdfBuffer: ArrayBuffer,
  angle: RotationAngle,
  pageNumbers?: number[]
): Promise<Uint8Array> {
  if (!isValidRotationAngle(angle)) {
    throw new Error(`Invalid rotation angle: ${angle}. Must be 90, 180, or 270.`);
  }

  const pdf = await loadPdf(pdfBuffer);
  const totalPages = pdf.getPageCount();
  const pages = pdf.getPages();

  // Determine which pages to rotate
  const pagesToRotate = pageNumbers && pageNumbers.length > 0
    ? pageNumbers
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  // Validate page numbers
  for (const pageNum of pagesToRotate) {
    if (pageNum < 1 || pageNum > totalPages) {
      throw new Error(`Page ${pageNum} is out of bounds (1-${totalPages})`);
    }
  }

  // Rotate specified pages
  for (const pageNum of pagesToRotate) {
    const page = pages[pageNum - 1]; // Convert to 0-indexed
    const currentRotation = page.getRotation().angle;
    const newRotation = (currentRotation + angle) % 360;
    page.setRotation(degrees(newRotation));
  }

  return savePdf(pdf);
}


/**
 * Rotate all pages in a PDF by a specified angle
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param angle - Rotation angle (90, 180, or 270 degrees clockwise)
 * @returns Promise resolving to rotated PDF as Uint8Array
 */
export async function rotateAllPages(
  pdfBuffer: ArrayBuffer,
  angle: RotationAngle
): Promise<Uint8Array> {
  return rotatePdf(pdfBuffer, angle);
}

/**
 * Rotate pages using a direction instead of angle
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param direction - Rotation direction ('clockwise', 'counterclockwise', or 'flip')
 * @param pageNumbers - Array of page numbers to rotate (1-indexed). If empty, rotates all pages.
 * @returns Promise resolving to rotated PDF as Uint8Array
 */
export async function rotatePdfByDirection(
  pdfBuffer: ArrayBuffer,
  direction: RotationDirection,
  pageNumbers?: number[]
): Promise<Uint8Array> {
  const angle = directionToAngle(direction);
  return rotatePdf(pdfBuffer, angle, pageNumbers);
}

/**
 * Get the current rotation of each page in a PDF
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to array of rotation angles (0, 90, 180, or 270)
 */
export async function getPageRotations(
  pdfBuffer: ArrayBuffer
): Promise<number[]> {
  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  
  return pages.map(page => page.getRotation().angle);
}

/**
 * Reset all page rotations to 0 degrees
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to PDF with reset rotations as Uint8Array
 */
export async function resetPageRotations(
  pdfBuffer: ArrayBuffer
): Promise<Uint8Array> {
  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  
  for (const page of pages) {
    page.setRotation(degrees(0));
  }
  
  return savePdf(pdf);
}
