/**
 * PDF page reordering functionality using pdf-lib
 * @module lib/pdf/reorder
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdf, createPdf, savePdf } from './utils';

/**
 * Reorder pages in a PDF according to a new order
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param newOrder - Array of page numbers in the desired order (1-indexed)
 *                   Each page number must appear exactly once
 * @returns Promise resolving to reordered PDF as Uint8Array
 * @throws Error if newOrder is invalid (missing pages, duplicates, or out of bounds)
 * 
 * @example
 * ```typescript
 * const pdf = await fetch('/doc.pdf').then(r => r.arrayBuffer());
 * // Reverse a 3-page document
 * const reordered = await reorderPdf(pdf, [3, 2, 1]);
 * // Move page 3 to the front
 * const reordered2 = await reorderPdf(pdf, [3, 1, 2]);
 * ```
 */
export async function reorderPdf(
  pdfBuffer: ArrayBuffer,
  newOrder: number[]
): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();

  // Validate the new order
  validatePageOrder(newOrder, totalPages);

  // Create a new PDF with pages in the new order
  const newPdf = await createPdf();
  
  // Convert 1-indexed to 0-indexed
  const pageIndices = newOrder.map(p => p - 1);
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  
  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  return savePdf(newPdf);
}

/**
 * Validate that a page order array is valid
 * 
 * @param order - Array of page numbers
 * @param totalPages - Total number of pages in the document
 * @throws Error if order is invalid
 */
export function validatePageOrder(order: number[], totalPages: number): void {
  if (!order || order.length === 0) {
    throw new Error('Page order array cannot be empty');
  }

  if (order.length !== totalPages) {
    throw new Error(
      `Page order must include all ${totalPages} pages. Got ${order.length} pages.`
    );
  }

  // Check for valid page numbers and duplicates
  const seen = new Set<number>();
  
  for (const pageNum of order) {
    if (typeof pageNum !== 'number' || !Number.isInteger(pageNum)) {
      throw new Error(`Invalid page number: ${pageNum}`);
    }

    if (pageNum < 1 || pageNum > totalPages) {
      throw new Error(`Page ${pageNum} is out of bounds (1-${totalPages})`);
    }

    if (seen.has(pageNum)) {
      throw new Error(`Duplicate page number: ${pageNum}`);
    }

    seen.add(pageNum);
  }

  // Check that all pages are included
  for (let i = 1; i <= totalPages; i++) {
    if (!seen.has(i)) {
      throw new Error(`Missing page ${i} in the order`);
    }
  }
}


/**
 * Reverse the page order of a PDF
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to reversed PDF as Uint8Array
 */
export async function reversePdfPages(
  pdfBuffer: ArrayBuffer
): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();
  
  // Create reversed order: [n, n-1, ..., 2, 1]
  const reversedOrder = Array.from(
    { length: totalPages },
    (_, i) => totalPages - i
  );
  
  return reorderPdf(pdfBuffer, reversedOrder);
}

/**
 * Move a page to a new position
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param fromPage - Page number to move (1-indexed)
 * @param toPosition - New position for the page (1-indexed)
 * @returns Promise resolving to reordered PDF as Uint8Array
 */
export async function movePage(
  pdfBuffer: ArrayBuffer,
  fromPage: number,
  toPosition: number
): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();

  if (fromPage < 1 || fromPage > totalPages) {
    throw new Error(`Source page ${fromPage} is out of bounds (1-${totalPages})`);
  }

  if (toPosition < 1 || toPosition > totalPages) {
    throw new Error(`Target position ${toPosition} is out of bounds (1-${totalPages})`);
  }

  if (fromPage === toPosition) {
    // No change needed
    return savePdf(sourcePdf);
  }

  // Build new order
  const order: number[] = [];
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === fromPage) continue; // Skip the page being moved
    
    if (order.length + 1 === toPosition) {
      order.push(fromPage); // Insert the moved page at target position
    }
    
    order.push(i);
  }
  
  // Handle case where page is moved to the end
  if (order.length < totalPages) {
    order.push(fromPage);
  }

  return reorderPdf(pdfBuffer, order);
}

/**
 * Swap two pages in a PDF
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param page1 - First page number (1-indexed)
 * @param page2 - Second page number (1-indexed)
 * @returns Promise resolving to reordered PDF as Uint8Array
 */
export async function swapPages(
  pdfBuffer: ArrayBuffer,
  page1: number,
  page2: number
): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();

  if (page1 < 1 || page1 > totalPages) {
    throw new Error(`Page ${page1} is out of bounds (1-${totalPages})`);
  }

  if (page2 < 1 || page2 > totalPages) {
    throw new Error(`Page ${page2} is out of bounds (1-${totalPages})`);
  }

  if (page1 === page2) {
    // No change needed
    return savePdf(sourcePdf);
  }

  // Build new order with swapped pages
  const order = Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    if (pageNum === page1) return page2;
    if (pageNum === page2) return page1;
    return pageNum;
  });

  return reorderPdf(pdfBuffer, order);
}

/**
 * Remove specific pages from a PDF
 * Note: This creates a new PDF without the specified pages
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param pagesToRemove - Array of page numbers to remove (1-indexed)
 * @returns Promise resolving to PDF without removed pages as Uint8Array
 */
export async function removePages(
  pdfBuffer: ArrayBuffer,
  pagesToRemove: number[]
): Promise<Uint8Array> {
  const sourcePdf = await loadPdf(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();

  // Validate pages to remove
  const removeSet = new Set(pagesToRemove);
  
  for (const pageNum of pagesToRemove) {
    if (pageNum < 1 || pageNum > totalPages) {
      throw new Error(`Page ${pageNum} is out of bounds (1-${totalPages})`);
    }
  }

  if (removeSet.size >= totalPages) {
    throw new Error('Cannot remove all pages from a PDF');
  }

  // Create new PDF with remaining pages
  const newPdf = await createPdf();
  const remainingIndices: number[] = [];
  
  for (let i = 0; i < totalPages; i++) {
    if (!removeSet.has(i + 1)) {
      remainingIndices.push(i);
    }
  }
  
  const copiedPages = await newPdf.copyPages(sourcePdf, remainingIndices);
  
  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  return savePdf(newPdf);
}
