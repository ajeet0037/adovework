/**
 * PDF Parser module using unpdf for proper text extraction
 * unpdf is designed for Node.js and works without web workers
 */

import { getDocumentProxy, extractText } from 'unpdf';

/**
 * Remove invalid XML characters from text
 */
function sanitizeForXml(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export interface TextContentItem {
  type: 'text';
  text: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  y: number;
  x: number;
}

export interface StructuredPage {
  textItems: TextContentItem[];
  pageNumber: number;
  width: number;
  height: number;
}

export interface StructuredPDFContent {
  pages: StructuredPage[];
  numPages: number;
}

/**
 * Detect if font is bold based on font name
 */
function isBoldFont(fontName: string): boolean {
  const lower = fontName.toLowerCase();
  return lower.includes('bold') || lower.includes('black') || lower.includes('heavy');
}

/**
 * Detect if font is italic based on font name
 */
function isItalicFont(fontName: string): boolean {
  const lower = fontName.toLowerCase();
  return lower.includes('italic') || lower.includes('oblique');
}

/**
 * Extract structured content from PDF using unpdf
 */
export async function extractStructuredContent(
  pdfBuffer: Buffer | ArrayBuffer
): Promise<StructuredPDFContent> {
  let uint8Array: Uint8Array;

  if (pdfBuffer instanceof Buffer) {
    uint8Array = new Uint8Array(pdfBuffer);
  } else if (pdfBuffer instanceof ArrayBuffer) {
    uint8Array = new Uint8Array(pdfBuffer);
  } else {
    uint8Array = pdfBuffer as Uint8Array;
  }

  // Load the PDF document using unpdf
  const pdf = await getDocumentProxy(uint8Array);
  const numPages = pdf.numPages;
  const pages: StructuredPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    // Get text content with font information
    const textContent = await page.getTextContent();
    const textItems: TextContentItem[] = [];

    for (const item of textContent.items) {
      // Check if item has str property (is TextItem, not TextMarkedContent)
      if (!('str' in item) || typeof item.str !== 'string') continue;

      const text = sanitizeForXml(item.str);
      if (!text.trim()) continue;

      // Get font size from transform matrix
      // transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const transform = item.transform as number[];
      const fontSize = Math.abs(transform[0]) || Math.abs(transform[3]) || 12;

      // Get font name for bold/italic detection
      const fontName = (item as { fontName?: string }).fontName || '';

      textItems.push({
        type: 'text',
        text: text,
        fontSize: fontSize,
        isBold: isBoldFont(fontName),
        isItalic: isItalicFont(fontName),
        x: transform[4],
        y: viewport.height - transform[5], // Flip Y coordinate
      });
    }

    // Sort items by Y position (top to bottom), then X (left to right)
    textItems.sort((a, b) => {
      const yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.x - b.x;
    });

    pages.push({
      textItems,
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return {
    pages,
    numPages,
  };
}

/**
 * Simple text extraction - returns all text as a single string
 * Uses unpdf's built-in extractText for simpler cases
 */
export async function extractPdfText(pdfBuffer: Buffer | ArrayBuffer): Promise<string> {
  let uint8Array: Uint8Array;

  if (pdfBuffer instanceof Buffer) {
    uint8Array = new Uint8Array(pdfBuffer);
  } else if (pdfBuffer instanceof ArrayBuffer) {
    uint8Array = new Uint8Array(pdfBuffer);
  } else {
    uint8Array = pdfBuffer as Uint8Array;
  }

  try {
    // Use unpdf's extractText for simple text extraction
    const { text } = await extractText(uint8Array, { mergePages: true });
    return sanitizeForXml(text || '');
  } catch {
    // Fallback to structured extraction if extractText fails
    const content = await extractStructuredContent(pdfBuffer);

    const allText: string[] = [];
    for (const page of content.pages) {
      let lastY = -1;
      let currentLine: string[] = [];

      for (const item of page.textItems) {
        // Check if this is a new line (Y position changed significantly)
        if (lastY >= 0 && Math.abs(item.y - lastY) > 5) {
          if (currentLine.length > 0) {
            allText.push(currentLine.join(' '));
            currentLine = [];
          }
        }

        currentLine.push(item.text);
        lastY = item.y;
      }

      // Add the last line
      if (currentLine.length > 0) {
        allText.push(currentLine.join(' '));
      }

      if (page.textItems.length > 0) {
        allText.push(''); // Page break
      }
    }

    return allText.join('\n').trim();
  }
}

/**
 * Extract paragraphs from PDF
 */
export async function extractPdfParagraphs(pdfBuffer: Buffer | ArrayBuffer): Promise<string[]> {
  const text = await extractPdfText(pdfBuffer);

  if (!text) {
    return [];
  }

  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0 && text.trim().length > 0) {
    return text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
  }

  return paragraphs;
}
