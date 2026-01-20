/**
 * Image to PDF conversion functionality using pdf-lib
 * @module lib/converters/imageToPdf
 */

import { PDFDocument, PageSizes } from 'pdf-lib';

/**
 * Supported image formats for conversion
 */
export type SupportedImageFormat = 'image/jpeg' | 'image/png';

/**
 * Options for image to PDF conversion
 */
export interface ImageToPdfOptions {
  /** Page size preset or custom dimensions [width, height] in points */
  pageSize?: [number, number] | 'A4' | 'LETTER';
  /** Fit mode for the image */
  fitMode?: 'contain' | 'cover' | 'stretch';
  /** Margin in points (default: 0) */
  margin?: number;
}

const DEFAULT_OPTIONS: ImageToPdfOptions = {
  pageSize: 'A4',
  fitMode: 'contain',
  margin: 0,
};

/**
 * Get page dimensions from size preset or custom dimensions
 */
function getPageDimensions(
  pageSize: ImageToPdfOptions['pageSize']
): [number, number] {
  if (Array.isArray(pageSize)) {
    return pageSize;
  }
  switch (pageSize) {
    case 'LETTER':
      return PageSizes.Letter;
    case 'A4':
    default:
      return PageSizes.A4;
  }
}

/**
 * Detect image format from ArrayBuffer
 */
export function detectImageFormat(buffer: ArrayBuffer): SupportedImageFormat | null {
  const bytes = new Uint8Array(buffer);
  
  // Check for JPEG magic bytes (FFD8FF)
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // Check for PNG magic bytes (89504E47)
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  
  return null;
}

/**
 * Convert a single image to PDF
 * 
 * @param imageBuffer - The image file as ArrayBuffer
 * @param mimeType - The MIME type of the image (image/jpeg or image/png)
 * @param options - Conversion options
 * @returns Promise resolving to PDF as Uint8Array
 * 
 * @example
 * ```typescript
 * const image = await fetch('/photo.jpg').then(r => r.arrayBuffer());
 * const pdf = await imageToPdf(image, 'image/jpeg');
 * ```
 */
export async function imageToPdf(
  imageBuffer: ArrayBuffer,
  mimeType: SupportedImageFormat,
  options: ImageToPdfOptions = DEFAULT_OPTIONS
): Promise<Uint8Array> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const pdf = await PDFDocument.create();
  
  // Embed the image based on type
  const imageBytes = new Uint8Array(imageBuffer);
  let image;
  
  if (mimeType === 'image/jpeg') {
    image = await pdf.embedJpg(imageBytes);
  } else if (mimeType === 'image/png') {
    image = await pdf.embedPng(imageBytes);
  } else {
    throw new Error(`Unsupported image format: ${mimeType}`);
  }
  
  // Get page dimensions
  const [pageWidth, pageHeight] = getPageDimensions(mergedOptions.pageSize);
  const margin = mergedOptions.margin || 0;
  
  // Calculate available space
  const availableWidth = pageWidth - 2 * margin;
  const availableHeight = pageHeight - 2 * margin;
  
  // Calculate image dimensions based on fit mode
  const imageAspect = image.width / image.height;
  const pageAspect = availableWidth / availableHeight;
  
  let drawWidth: number;
  let drawHeight: number;
  
  switch (mergedOptions.fitMode) {
    case 'cover':
      if (imageAspect > pageAspect) {
        drawHeight = availableHeight;
        drawWidth = drawHeight * imageAspect;
      } else {
        drawWidth = availableWidth;
        drawHeight = drawWidth / imageAspect;
      }
      break;
    case 'stretch':
      drawWidth = availableWidth;
      drawHeight = availableHeight;
      break;
    case 'contain':
    default:
      if (imageAspect > pageAspect) {
        drawWidth = availableWidth;
        drawHeight = drawWidth / imageAspect;
      } else {
        drawHeight = availableHeight;
        drawWidth = drawHeight * imageAspect;
      }
      break;
  }
  
  // Center the image on the page
  const x = margin + (availableWidth - drawWidth) / 2;
  const y = margin + (availableHeight - drawHeight) / 2;
  
  // Add page and draw image
  const page = pdf.addPage([pageWidth, pageHeight]);
  page.drawImage(image, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  });
  
  return pdf.save();
}

/**
 * Convert multiple images to a single PDF (one image per page)
 * 
 * @param images - Array of image buffers with their MIME types
 * @param options - Conversion options (applied to all pages)
 * @returns Promise resolving to PDF as Uint8Array
 * 
 * @example
 * ```typescript
 * const images = [
 *   { buffer: await fetch('/photo1.jpg').then(r => r.arrayBuffer()), mimeType: 'image/jpeg' },
 *   { buffer: await fetch('/photo2.png').then(r => r.arrayBuffer()), mimeType: 'image/png' },
 * ];
 * const pdf = await imagesToPdf(images);
 * ```
 */
export async function imagesToPdf(
  images: Array<{ buffer: ArrayBuffer; mimeType: SupportedImageFormat }>,
  options: ImageToPdfOptions = DEFAULT_OPTIONS
): Promise<Uint8Array> {
  if (!images || images.length === 0) {
    throw new Error('At least one image is required');
  }
  
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const pdf = await PDFDocument.create();
  
  const [pageWidth, pageHeight] = getPageDimensions(mergedOptions.pageSize);
  const margin = mergedOptions.margin || 0;
  const availableWidth = pageWidth - 2 * margin;
  const availableHeight = pageHeight - 2 * margin;
  
  for (const { buffer, mimeType } of images) {
    const imageBytes = new Uint8Array(buffer);
    let image;
    
    if (mimeType === 'image/jpeg') {
      image = await pdf.embedJpg(imageBytes);
    } else if (mimeType === 'image/png') {
      image = await pdf.embedPng(imageBytes);
    } else {
      throw new Error(`Unsupported image format: ${mimeType}`);
    }
    
    // Calculate dimensions
    const imageAspect = image.width / image.height;
    const pageAspect = availableWidth / availableHeight;
    
    let drawWidth: number;
    let drawHeight: number;
    
    switch (mergedOptions.fitMode) {
      case 'cover':
        if (imageAspect > pageAspect) {
          drawHeight = availableHeight;
          drawWidth = drawHeight * imageAspect;
        } else {
          drawWidth = availableWidth;
          drawHeight = drawWidth / imageAspect;
        }
        break;
      case 'stretch':
        drawWidth = availableWidth;
        drawHeight = availableHeight;
        break;
      case 'contain':
      default:
        if (imageAspect > pageAspect) {
          drawWidth = availableWidth;
          drawHeight = drawWidth / imageAspect;
        } else {
          drawHeight = availableHeight;
          drawWidth = drawHeight * imageAspect;
        }
        break;
    }
    
    const x = margin + (availableWidth - drawWidth) / 2;
    const y = margin + (availableHeight - drawHeight) / 2;
    
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(image, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }
  
  return pdf.save();
}

/**
 * Validate that a buffer is a supported image format
 * 
 * @param buffer - The buffer to validate
 * @returns Object with validation result and detected format
 */
export function validateImageBuffer(buffer: ArrayBuffer): {
  valid: boolean;
  format: SupportedImageFormat | null;
  error?: string;
} {
  const format = detectImageFormat(buffer);
  
  if (!format) {
    return {
      valid: false,
      format: null,
      error: 'Unsupported image format. Only JPEG and PNG are supported.',
    };
  }
  
  return { valid: true, format };
}
