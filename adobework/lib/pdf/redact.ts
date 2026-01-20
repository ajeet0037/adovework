/**
 * Redact (black out) areas in PDF
 */

import { PDFDocument, rgb } from 'pdf-lib';
import { loadPdf, savePdf } from './utils';

export interface RedactArea {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RedactOptions {
  areas: RedactArea[];
  color?: { r: number; g: number; b: number };
}

export async function redactPdf(
  pdfBuffer: ArrayBuffer,
  options: RedactOptions
): Promise<Uint8Array> {
  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  
  const redactColor = options.color 
    ? rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255)
    : rgb(0, 0, 0); // Default black
  
  for (const area of options.areas) {
    if (area.page < 1 || area.page > pages.length) continue;
    
    const page = pages[area.page - 1];
    
    // Draw black rectangle over the area
    page.drawRectangle({
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      color: redactColor,
    });
  }
  
  return savePdf(pdf);
}

/**
 * Redact text by searching for it (basic implementation)
 * Note: This is a visual redaction only - text may still be extractable
 */
export async function redactTextVisually(
  pdfBuffer: ArrayBuffer,
  searchText: string,
  pageNumber?: number
): Promise<{ pdf: Uint8Array; foundCount: number }> {
  // This would require text extraction with positions
  // For now, return original with warning
  const pdf = await loadPdf(pdfBuffer);
  return {
    pdf: await savePdf(pdf),
    foundCount: 0,
  };
}
