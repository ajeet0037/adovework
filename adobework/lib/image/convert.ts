// Image format conversion utility

import { ImageFormat } from './types';
import { FORMAT_MIME_TYPES } from './presets';

/**
 * Convert image to specified format
 */
export async function convertImage(
  source: HTMLCanvasElement | HTMLImageElement,
  targetFormat: ImageFormat,
  quality: number = 0.92
): Promise<Blob> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  // Create output canvas
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d')!;
  
  // For JPEG, fill with white background (no transparency)
  if (targetFormat === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sourceWidth, sourceHeight);
  }
  
  // Draw the image
  ctx.drawImage(source, 0, 0);
  
  // Get mime type
  const mimeType = FORMAT_MIME_TYPES[targetFormat] || 'image/png';
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      targetFormat === 'png' ? undefined : quality
    );
  });
}

/**
 * Convert image file to specified format
 */
export async function convertImageFile(
  file: File,
  targetFormat: ImageFormat,
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const blob = await convertImage(img, targetFormat, quality);
        resolve(blob);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Detect image format from file
 */
export function detectImageFormat(file: File): ImageFormat | 'unknown' {
  const type = file.type.toLowerCase();
  
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpeg';
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  if (type.includes('bmp')) return 'bmp';
  
  // Check by extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  if (ext === 'gif') return 'gif';
  if (ext === 'bmp') return 'bmp';
  
  return 'unknown';
}

/**
 * Get available conversion targets for a format
 */
export function getConversionTargets(sourceFormat: ImageFormat | 'unknown'): ImageFormat[] {
  const allFormats: ImageFormat[] = ['jpeg', 'png', 'webp'];
  
  if (sourceFormat === 'unknown') {
    return allFormats;
  }
  
  return allFormats.filter(f => f !== sourceFormat);
}

/**
 * Check if image has transparency
 */
export async function hasTransparency(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<boolean> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
  const data = imageData.data;
  
  // Check alpha channel
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get file extension for format
 */
export function getExtensionForFormat(format: ImageFormat): string {
  switch (format) {
    case 'jpeg': return '.jpg';
    case 'png': return '.png';
    case 'webp': return '.webp';
    case 'gif': return '.gif';
    case 'bmp': return '.bmp';
    default: return '.jpg';
  }
}

/**
 * Generate output filename
 */
export function generateOutputFilename(
  originalName: string,
  targetFormat: ImageFormat,
  suffix?: string
): string {
  const baseName = originalName.replace(/\.[^.]+$/, '');
  const ext = getExtensionForFormat(targetFormat);
  return suffix ? `${baseName}_${suffix}${ext}` : `${baseName}${ext}`;
}
