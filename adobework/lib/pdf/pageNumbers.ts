/**
 * Add page numbers to PDF
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { loadPdf, savePdf } from './utils';

export interface PageNumberOptions {
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
  format: 'number' | 'page-x-of-y' | 'page-x';
  fontSize: number;
  startPage: number;
  margin: number;
}

export async function addPageNumbers(
  pdfBuffer: ArrayBuffer,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  const totalPages = pages.length;
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + options.startPage;
    const { width, height } = page.getSize();
    
    // Format page number text
    let text = '';
    switch (options.format) {
      case 'number':
        text = `${pageNum}`;
        break;
      case 'page-x':
        text = `Page ${pageNum}`;
        break;
      case 'page-x-of-y':
        text = `Page ${pageNum} of ${totalPages + options.startPage - 1}`;
        break;
    }
    
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    
    // Calculate position
    let x = 0;
    let y = 0;
    
    switch (options.position) {
      case 'bottom-center':
        x = (width - textWidth) / 2;
        y = options.margin;
        break;
      case 'bottom-left':
        x = options.margin;
        y = options.margin;
        break;
      case 'bottom-right':
        x = width - textWidth - options.margin;
        y = options.margin;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - options.margin - options.fontSize;
        break;
      case 'top-left':
        x = options.margin;
        y = height - options.margin - options.fontSize;
        break;
      case 'top-right':
        x = width - textWidth - options.margin;
        y = height - options.margin - options.fontSize;
        break;
    }
    
    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }
  
  return savePdf(pdf);
}
