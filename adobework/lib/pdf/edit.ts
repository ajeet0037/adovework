/**
 * PDF editing functionality using pdf-lib
 * @module lib/pdf/edit
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { loadPdf, savePdf } from './utils';

/**
 * Types of annotations supported
 */
export type AnnotationType = 'text' | 'highlight' | 'draw' | 'rectangle' | 'line';

/**
 * Color in RGB format (0-255)
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Base annotation interface
 */
export interface BaseAnnotation {
  /** Unique identifier */
  id: string;
  /** Type of annotation */
  type: AnnotationType;
  /** Page number (1-indexed) */
  page: number;
  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Text annotation
 */
export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  /** Text content */
  text: string;
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Font size */
  fontSize: number;
  /** Text color */
  color: RGBColor;
}

/**
 * Highlight annotation
 */
export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Highlight color */
  color: RGBColor;
}

/**
 * Draw annotation (freehand)
 */
export interface DrawAnnotation extends BaseAnnotation {
  type: 'draw';
  /** Array of points forming the path */
  points: Array<{ x: number; y: number }>;
  /** Stroke color */
  color: RGBColor;
  /** Stroke width */
  strokeWidth: number;
}

/**
 * Rectangle annotation
 */
export interface RectangleAnnotation extends BaseAnnotation {
  type: 'rectangle';
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Border color */
  borderColor: RGBColor;
  /** Fill color (optional) */
  fillColor?: RGBColor;
  /** Border width */
  borderWidth: number;
}

/**
 * Line annotation
 */
export interface LineAnnotation extends BaseAnnotation {
  type: 'line';
  /** Start X */
  startX: number;
  /** Start Y */
  startY: number;
  /** End X */
  endX: number;
  /** End Y */
  endY: number;
  /** Line color */
  color: RGBColor;
  /** Line width */
  strokeWidth: number;
}

/**
 * Union type for all annotations
 */
export type Annotation = 
  | TextAnnotation 
  | HighlightAnnotation 
  | DrawAnnotation 
  | RectangleAnnotation 
  | LineAnnotation;

/**
 * Options for editing a PDF
 */
export interface EditPdfOptions {
  /** Array of annotations to apply */
  annotations: Annotation[];
}

/**
 * Convert RGB color (0-255) to pdf-lib format (0-1)
 */
function toRgb(color: RGBColor) {
  return rgb(color.r / 255, color.g / 255, color.b / 255);
}

/**
 * Apply annotations to a PDF document
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param options - Edit options with annotations
 * @returns Promise resolving to edited PDF as Uint8Array
 */
export async function editPdf(
  pdfBuffer: ArrayBuffer,
  options: EditPdfOptions
): Promise<Uint8Array> {
  if (!options.annotations || options.annotations.length === 0) {
    return new Uint8Array(pdfBuffer);
  }

  const pdf = await loadPdf(pdfBuffer);
  const pages = pdf.getPages();
  const totalPages = pages.length;

  // Embed font for text annotations
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  // Sort annotations: white covers first (highlights with white color), then everything else
  const sortedAnnotations = [...options.annotations].sort((a, b) => {
    const aIsWhiteCover = a.type === 'highlight' && 
      (a as HighlightAnnotation).color.r === 255 && 
      (a as HighlightAnnotation).color.g === 255 && 
      (a as HighlightAnnotation).color.b === 255;
    const bIsWhiteCover = b.type === 'highlight' && 
      (b as HighlightAnnotation).color.r === 255 && 
      (b as HighlightAnnotation).color.g === 255 && 
      (b as HighlightAnnotation).color.b === 255;
    
    if (aIsWhiteCover && !bIsWhiteCover) return -1;
    if (!aIsWhiteCover && bIsWhiteCover) return 1;
    return 0;
  });

  // Apply each annotation
  for (const annotation of sortedAnnotations) {
    if (annotation.page < 1 || annotation.page > totalPages) {
      console.warn(`Skipping annotation: invalid page ${annotation.page}`);
      continue;
    }

    const page = pages[annotation.page - 1];
    const opacity = annotation.opacity ?? 1;

    switch (annotation.type) {
      case 'text':
        applyTextAnnotation(page, annotation, font, opacity);
        break;
      case 'highlight':
        applyHighlightAnnotation(page, annotation, opacity);
        break;
      case 'draw':
        applyDrawAnnotation(page, annotation, opacity);
        break;
      case 'rectangle':
        applyRectangleAnnotation(page, annotation, opacity);
        break;
      case 'line':
        applyLineAnnotation(page, annotation, opacity);
        break;
    }
  }

  const result = await savePdf(pdf);
  return result;
}

/**
 * Apply text annotation to a page
 */
function applyTextAnnotation(
  page: ReturnType<PDFDocument['getPages']>[0],
  annotation: TextAnnotation,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  opacity: number
) {
  page.drawText(annotation.text, {
    x: annotation.x,
    y: annotation.y,
    size: annotation.fontSize,
    font,
    color: toRgb(annotation.color),
    opacity,
  });
}

/**
 * Apply highlight annotation to a page
 */
function applyHighlightAnnotation(
  page: ReturnType<PDFDocument['getPages']>[0],
  annotation: HighlightAnnotation,
  opacity: number
) {
  // Check if it's a white cover (for text editing) - use full opacity
  const isWhiteCover = annotation.color.r === 255 && 
                       annotation.color.g === 255 && 
                       annotation.color.b === 255;
  
  page.drawRectangle({
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
    color: toRgb(annotation.color),
    opacity: isWhiteCover ? 1 : opacity * 0.3, // White covers are solid, highlights are semi-transparent
  });
}

/**
 * Apply draw annotation (freehand) to a page
 */
function applyDrawAnnotation(
  page: ReturnType<PDFDocument['getPages']>[0],
  annotation: DrawAnnotation,
  opacity: number
) {
  if (annotation.points.length < 2) return;

  // Draw lines between consecutive points
  for (let i = 1; i < annotation.points.length; i++) {
    const start = annotation.points[i - 1];
    const end = annotation.points[i];
    
    page.drawLine({
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
      thickness: annotation.strokeWidth,
      color: toRgb(annotation.color),
      opacity,
    });
  }
}

/**
 * Apply rectangle annotation to a page
 */
function applyRectangleAnnotation(
  page: ReturnType<PDFDocument['getPages']>[0],
  annotation: RectangleAnnotation,
  opacity: number
) {
  page.drawRectangle({
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
    borderColor: toRgb(annotation.borderColor),
    borderWidth: annotation.borderWidth,
    color: annotation.fillColor ? toRgb(annotation.fillColor) : undefined,
    opacity,
  });
}

/**
 * Apply line annotation to a page
 */
function applyLineAnnotation(
  page: ReturnType<PDFDocument['getPages']>[0],
  annotation: LineAnnotation,
  opacity: number
) {
  page.drawLine({
    start: { x: annotation.startX, y: annotation.startY },
    end: { x: annotation.endX, y: annotation.endY },
    thickness: annotation.strokeWidth,
    color: toRgb(annotation.color),
    opacity,
  });
}

/**
 * Generate a unique annotation ID
 */
export function generateAnnotationId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a text annotation
 */
export function createTextAnnotation(
  page: number,
  x: number,
  y: number,
  text: string,
  options?: Partial<Omit<TextAnnotation, 'id' | 'type' | 'page' | 'x' | 'y' | 'text'>>
): TextAnnotation {
  return {
    id: generateAnnotationId(),
    type: 'text',
    page,
    x,
    y,
    text,
    fontSize: options?.fontSize ?? 12,
    color: options?.color ?? { r: 0, g: 0, b: 0 },
    opacity: options?.opacity ?? 1,
  };
}

/**
 * Create a highlight annotation
 */
export function createHighlightAnnotation(
  page: number,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: Partial<Omit<HighlightAnnotation, 'id' | 'type' | 'page' | 'x' | 'y' | 'width' | 'height'>>
): HighlightAnnotation {
  return {
    id: generateAnnotationId(),
    type: 'highlight',
    page,
    x,
    y,
    width,
    height,
    color: options?.color ?? { r: 255, g: 255, b: 0 }, // Yellow default
    opacity: options?.opacity ?? 1,
  };
}

/**
 * Create a draw annotation
 */
export function createDrawAnnotation(
  page: number,
  points: Array<{ x: number; y: number }>,
  options?: Partial<Omit<DrawAnnotation, 'id' | 'type' | 'page' | 'points'>>
): DrawAnnotation {
  return {
    id: generateAnnotationId(),
    type: 'draw',
    page,
    points,
    color: options?.color ?? { r: 0, g: 0, b: 0 },
    strokeWidth: options?.strokeWidth ?? 2,
    opacity: options?.opacity ?? 1,
  };
}
