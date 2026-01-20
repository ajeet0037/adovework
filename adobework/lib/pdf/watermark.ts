/**
 * PDF watermark functionality using pdf-lib
 * @module lib/pdf/watermark
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { loadPdf, savePdf } from './utils';

/**
 * Position options for watermark placement
 */
export type WatermarkPosition = 
  | 'center'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Options for text watermarks
 */
export interface TextWatermarkOptions {
  /** The watermark text */
  text: string;
  /** Font size in points (default: 48) */
  fontSize?: number;
  /** Text color as RGB values 0-1 (default: gray) */
  color?: { r: number; g: number; b: number };
  /** Opacity 0-1 (default: 0.3) */
  opacity?: number;
  /** Rotation angle in degrees (default: -45 for diagonal) */
  rotation?: number;
  /** Position on the page (default: 'center') */
  position?: WatermarkPosition;
  /** Pages to apply watermark (1-indexed). Empty = all pages */
  pages?: number[];
}

/**
 * Options for image watermarks
 */
export interface ImageWatermarkOptions {
  /** The image data as ArrayBuffer (PNG or JPG) */
  imageData: ArrayBuffer;
  /** Image type */
  imageType: 'png' | 'jpg' | 'jpeg';
  /** Width of the watermark (default: auto-scale) */
  width?: number;
  /** Height of the watermark (default: auto-scale) */
  height?: number;
  /** Opacity 0-1 (default: 0.3) */
  opacity?: number;
  /** Rotation angle in degrees (default: 0) */
  rotation?: number;
  /** Position on the page (default: 'center') */
  position?: WatermarkPosition;
  /** Pages to apply watermark (1-indexed). Empty = all pages */
  pages?: number[];
}

/**
 * Default text watermark options
 */
const DEFAULT_TEXT_OPTIONS: Required<Omit<TextWatermarkOptions, 'text' | 'pages'>> = {
  fontSize: 48,
  color: { r: 0.5, g: 0.5, b: 0.5 },
  opacity: 0.3,
  rotation: -45,
  position: 'center',
};

/**
 * Calculate position coordinates based on position option
 */
function calculatePosition(
  position: WatermarkPosition,
  pageWidth: number,
  pageHeight: number,
  elementWidth: number,
  elementHeight: number,
  margin: number = 50
): { x: number; y: number } {
  switch (position) {
    case 'top-left':
      return { x: margin, y: pageHeight - margin - elementHeight };
    case 'top-center':
      return { x: (pageWidth - elementWidth) / 2, y: pageHeight - margin - elementHeight };
    case 'top-right':
      return { x: pageWidth - margin - elementWidth, y: pageHeight - margin - elementHeight };
    case 'bottom-left':
      return { x: margin, y: margin };
    case 'bottom-center':
      return { x: (pageWidth - elementWidth) / 2, y: margin };
    case 'bottom-right':
      return { x: pageWidth - margin - elementWidth, y: margin };
    case 'center':
    default:
      return { x: (pageWidth - elementWidth) / 2, y: (pageHeight - elementHeight) / 2 };
  }
}


/**
 * Add a text watermark to a PDF
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param options - Text watermark options
 * @returns Promise resolving to watermarked PDF as Uint8Array
 * 
 * @example
 * ```typescript
 * const pdf = await fetch('/doc.pdf').then(r => r.arrayBuffer());
 * const watermarked = await addTextWatermark(pdf, {
 *   text: 'CONFIDENTIAL',
 *   fontSize: 60,
 *   opacity: 0.2,
 *   rotation: -45,
 * });
 * ```
 */
export async function addTextWatermark(
  pdfBuffer: ArrayBuffer,
  options: TextWatermarkOptions
): Promise<Uint8Array> {
  if (!options.text || options.text.trim().length === 0) {
    throw new Error('Watermark text cannot be empty');
  }

  const opts = { ...DEFAULT_TEXT_OPTIONS, ...options };
  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  const totalPages = pages.length;

  // Determine which pages to watermark
  const pagesToWatermark = opts.pages && opts.pages.length > 0
    ? opts.pages.filter(p => p >= 1 && p <= totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  // Embed font
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const textWidth = font.widthOfTextAtSize(opts.text, opts.fontSize);
  const textHeight = font.heightAtSize(opts.fontSize);

  // Apply watermark to each page
  for (const pageNum of pagesToWatermark) {
    const page = pages[pageNum - 1];
    const { width, height } = page.getSize();

    // Calculate position
    const { x, y } = calculatePosition(
      opts.position,
      width,
      height,
      textWidth,
      textHeight
    );

    // Draw the watermark text
    page.drawText(opts.text, {
      x,
      y,
      size: opts.fontSize,
      font,
      color: rgb(opts.color.r, opts.color.g, opts.color.b),
      opacity: opts.opacity,
      rotate: degrees(opts.rotation),
    });
  }

  return savePdf(pdf);
}

/**
 * Add an image watermark to a PDF
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param options - Image watermark options
 * @returns Promise resolving to watermarked PDF as Uint8Array
 * 
 * @example
 * ```typescript
 * const pdf = await fetch('/doc.pdf').then(r => r.arrayBuffer());
 * const logo = await fetch('/logo.png').then(r => r.arrayBuffer());
 * const watermarked = await addImageWatermark(pdf, {
 *   imageData: logo,
 *   imageType: 'png',
 *   opacity: 0.2,
 *   position: 'bottom-right',
 * });
 * ```
 */
export async function addImageWatermark(
  pdfBuffer: ArrayBuffer,
  options: ImageWatermarkOptions
): Promise<Uint8Array> {
  if (!options.imageData) {
    throw new Error('Image data is required for image watermark');
  }

  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  const totalPages = pages.length;

  // Embed the image
  let image;
  const imageType = options.imageType.toLowerCase();
  
  if (imageType === 'png') {
    image = await pdf.embedPng(options.imageData);
  } else if (imageType === 'jpg' || imageType === 'jpeg') {
    image = await pdf.embedJpg(options.imageData);
  } else {
    throw new Error(`Unsupported image type: ${options.imageType}`);
  }

  // Calculate dimensions
  const originalWidth = image.width;
  const originalHeight = image.height;
  const aspectRatio = originalWidth / originalHeight;

  let width = options.width;
  let height = options.height;

  if (width && !height) {
    height = width / aspectRatio;
  } else if (height && !width) {
    width = height * aspectRatio;
  } else if (!width && !height) {
    // Default to 20% of page width
    width = 100;
    height = width / aspectRatio;
  }

  // Determine which pages to watermark
  const pagesToWatermark = options.pages && options.pages.length > 0
    ? options.pages.filter(p => p >= 1 && p <= totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  const opacity = options.opacity ?? 0.3;
  const rotation = options.rotation ?? 0;
  const position = options.position ?? 'center';

  // Apply watermark to each page
  for (const pageNum of pagesToWatermark) {
    const page = pages[pageNum - 1];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Calculate position
    const { x, y } = calculatePosition(
      position,
      pageWidth,
      pageHeight,
      width!,
      height!
    );

    // Draw the image
    page.drawImage(image, {
      x,
      y,
      width: width!,
      height: height!,
      opacity,
      rotate: degrees(rotation),
    });
  }

  return savePdf(pdf);
}

/**
 * Add a diagonal repeating text watermark across all pages
 * Creates a pattern of watermarks across the entire page
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param text - The watermark text
 * @param options - Optional styling options
 * @returns Promise resolving to watermarked PDF as Uint8Array
 */
export async function addRepeatingWatermark(
  pdfBuffer: ArrayBuffer,
  text: string,
  options?: Partial<Omit<TextWatermarkOptions, 'text' | 'position' | 'pages'>>
): Promise<Uint8Array> {
  if (!text || text.trim().length === 0) {
    throw new Error('Watermark text cannot be empty');
  }

  const opts = { ...DEFAULT_TEXT_OPTIONS, ...options };
  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();

  // Embed font
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const textWidth = font.widthOfTextAtSize(text, opts.fontSize);
  const textHeight = font.heightAtSize(opts.fontSize);

  // Spacing between watermarks
  const spacingX = textWidth * 1.5;
  const spacingY = textHeight * 3;

  // Apply watermark to each page
  for (const page of pages) {
    const { width, height } = page.getSize();

    // Create a grid of watermarks
    for (let y = -spacingY; y < height + spacingY; y += spacingY) {
      for (let x = -spacingX; x < width + spacingX; x += spacingX) {
        page.drawText(text, {
          x,
          y,
          size: opts.fontSize,
          font,
          color: rgb(opts.color.r, opts.color.g, opts.color.b),
          opacity: opts.opacity,
          rotate: degrees(opts.rotation),
        });
      }
    }
  }

  return savePdf(pdf);
}

/**
 * Remove watermarks from a PDF (best effort)
 * Note: This only works for watermarks added as separate elements,
 * not for watermarks embedded in images or flattened into the content
 * 
 * This is a placeholder - true watermark removal is complex and
 * may not be possible for all watermark types
 */
export async function removeWatermarks(
  _pdfBuffer: ArrayBuffer
): Promise<Uint8Array> {
  throw new Error(
    'Watermark removal is not supported. Watermarks are typically embedded ' +
    'in the PDF content and cannot be reliably removed without the original document.'
  );
}
