// Image resize utility

import { ResizeOptions, ImageFormat } from './types';
import { FORMAT_MIME_TYPES } from './presets';

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
export function calculateAspectRatioDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number | null,
  targetHeight: number | null
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }
  
  if (targetHeight && !targetWidth) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }
  
  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }
  
  return { width: originalWidth, height: originalHeight };
}

/**
 * Resize an image using canvas
 */
export async function resizeImage(
  source: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
  options: ResizeOptions
): Promise<Blob> {
  const { width, height, maintainAspectRatio, resizeMode, quality } = options;
  
  // Get source dimensions
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  // Calculate target dimensions
  let targetWidth = width;
  let targetHeight = height;
  
  if (maintainAspectRatio) {
    const aspectRatio = sourceWidth / sourceHeight;
    const targetAspectRatio = width / height;
    
    if (resizeMode === 'contain') {
      if (aspectRatio > targetAspectRatio) {
        targetHeight = Math.round(width / aspectRatio);
      } else {
        targetWidth = Math.round(height * aspectRatio);
      }
    } else if (resizeMode === 'cover') {
      if (aspectRatio > targetAspectRatio) {
        targetWidth = Math.round(height * aspectRatio);
      } else {
        targetHeight = Math.round(width / aspectRatio);
      }
    }
  }
  
  // Create output canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  
  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Calculate draw position for cover mode
  let drawX = 0;
  let drawY = 0;
  let drawWidth = targetWidth;
  let drawHeight = targetHeight;
  
  if (resizeMode === 'cover' && maintainAspectRatio) {
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    drawWidth = sourceWidth * scale;
    drawHeight = sourceHeight * scale;
    drawX = (targetWidth - drawWidth) / 2;
    drawY = (targetHeight - drawHeight) / 2;
  }
  
  // Draw the image
  ctx.drawImage(source, drawX, drawY, drawWidth, drawHeight);
  
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
      'image/jpeg',
      quality
    );
  });
}

/**
 * Resize image from file
 */
export async function resizeImageFile(
  file: File,
  options: ResizeOptions,
  outputFormat: ImageFormat = 'jpeg'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // Create canvas from image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        
        // Resize
        const result = await resizeImage(canvas, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert units (px, %, cm) to pixels
 */
export function convertToPixels(
  value: number,
  unit: 'px' | '%' | 'cm',
  originalDimension: number,
  dpi: number = 300
): number {
  switch (unit) {
    case 'px':
      return Math.round(value);
    case '%':
      return Math.round((value / 100) * originalDimension);
    case 'cm':
      return Math.round((value / 2.54) * dpi);
    default:
      return Math.round(value);
  }
}

/**
 * Convert pixels to other units
 */
export function convertFromPixels(
  pixels: number,
  unit: 'px' | '%' | 'cm',
  originalDimension: number,
  dpi: number = 300
): number {
  switch (unit) {
    case 'px':
      return pixels;
    case '%':
      return Math.round((pixels / originalDimension) * 100 * 10) / 10;
    case 'cm':
      return Math.round((pixels / dpi) * 2.54 * 100) / 100;
    default:
      return pixels;
  }
}
