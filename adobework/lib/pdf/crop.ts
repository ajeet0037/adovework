/**
 * Crop PDF pages
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdf, savePdf } from './utils';

export interface CropOptions {
  top: number;
  bottom: number;
  left: number;
  right: number;
  pages?: number[]; // If empty, apply to all pages
}

export async function cropPdf(
  pdfBuffer: ArrayBuffer,
  options: CropOptions
): Promise<Uint8Array> {
  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  
  const pagesToCrop = options.pages && options.pages.length > 0 
    ? options.pages 
    : pages.map((_, i) => i + 1);
  
  for (const pageNum of pagesToCrop) {
    if (pageNum < 1 || pageNum > pages.length) continue;
    
    const page = pages[pageNum - 1];
    const { width, height } = page.getSize();
    
    // Calculate new crop box
    const newX = options.left;
    const newY = options.bottom;
    const newWidth = width - options.left - options.right;
    const newHeight = height - options.top - options.bottom;
    
    if (newWidth > 0 && newHeight > 0) {
      page.setCropBox(newX, newY, newWidth, newHeight);
    }
  }
  
  return savePdf(pdf);
}

export async function cropPdfByPercentage(
  pdfBuffer: ArrayBuffer,
  percentage: { top: number; bottom: number; left: number; right: number },
  pages?: number[]
): Promise<Uint8Array> {
  const pdf = await loadPdf(pdfBuffer);
  const pdfPages = pdf.getPages();
  
  const pagesToCrop = pages && pages.length > 0 
    ? pages 
    : pdfPages.map((_, i) => i + 1);
  
  for (const pageNum of pagesToCrop) {
    if (pageNum < 1 || pageNum > pdfPages.length) continue;
    
    const page = pdfPages[pageNum - 1];
    const { width, height } = page.getSize();
    
    const cropTop = (percentage.top / 100) * height;
    const cropBottom = (percentage.bottom / 100) * height;
    const cropLeft = (percentage.left / 100) * width;
    const cropRight = (percentage.right / 100) * width;
    
    const newWidth = width - cropLeft - cropRight;
    const newHeight = height - cropTop - cropBottom;
    
    if (newWidth > 0 && newHeight > 0) {
      page.setCropBox(cropLeft, cropBottom, newWidth, newHeight);
    }
  }
  
  return savePdf(pdf);
}
