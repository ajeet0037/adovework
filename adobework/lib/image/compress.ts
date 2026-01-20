// Image compression utility

import { CompressOptions, ImageFormat } from './types';
import { FORMAT_MIME_TYPES } from './presets';

/**
 * Compress image with quality setting
 */
export async function compressImage(
  source: HTMLCanvasElement | HTMLImageElement,
  options: CompressOptions
): Promise<Blob> {
  const { quality, maxWidth, maxHeight, format } = options;
  
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  // Calculate target dimensions if max dimensions specified
  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;
  
  if (maxWidth && sourceWidth > maxWidth) {
    const ratio = maxWidth / sourceWidth;
    targetWidth = maxWidth;
    targetHeight = Math.round(sourceHeight * ratio);
  }
  
  if (maxHeight && targetHeight > maxHeight) {
    const ratio = maxHeight / targetHeight;
    targetHeight = maxHeight;
    targetWidth = Math.round(targetWidth * ratio);
  }
  
  // Create output canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  
  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the image
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  
  // Get mime type
  const mimeType = FORMAT_MIME_TYPES[format] || 'image/jpeg';
  
  // Convert to blob with quality
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
      quality
    );
  });
}

/**
 * Compress image to target file size
 */
export async function compressToTargetSize(
  source: HTMLCanvasElement | HTMLImageElement,
  targetSize: number, // bytes
  format: ImageFormat = 'jpeg',
  tolerance: number = 0.05 // 5% tolerance
): Promise<Blob> {
  let minQuality = 0.1;
  let maxQuality = 1.0;
  let bestBlob: Blob | null = null;
  let iterations = 0;
  const maxIterations = 10;
  
  while (iterations < maxIterations) {
    const quality = (minQuality + maxQuality) / 2;
    
    const blob = await compressImage(source, {
      quality,
      format,
    });
    
    const sizeDiff = blob.size - targetSize;
    const toleranceBytes = targetSize * tolerance;
    
    if (Math.abs(sizeDiff) <= toleranceBytes || blob.size <= targetSize) {
      bestBlob = blob;
      if (blob.size <= targetSize) {
        // Try to get closer to target without exceeding
        minQuality = quality;
      }
    }
    
    if (blob.size > targetSize) {
      maxQuality = quality;
    } else {
      minQuality = quality;
    }
    
    // Check if we've converged
    if (maxQuality - minQuality < 0.01) {
      break;
    }
    
    iterations++;
  }
  
  // If we couldn't hit target, return best attempt or lowest quality
  if (!bestBlob) {
    bestBlob = await compressImage(source, {
      quality: minQuality,
      format,
    });
  }
  
  return bestBlob;
}

/**
 * Smart compression - automatically determine best quality
 */
export async function smartCompress(
  source: HTMLCanvasElement | HTMLImageElement,
  format: ImageFormat = 'jpeg'
): Promise<Blob> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  // Determine quality based on image size
  const pixels = sourceWidth * sourceHeight;
  let quality: number;
  
  if (pixels > 4000000) {
    // Large image (>4MP) - use lower quality
    quality = 0.7;
  } else if (pixels > 1000000) {
    // Medium image (1-4MP)
    quality = 0.8;
  } else {
    // Small image (<1MP) - use higher quality
    quality = 0.85;
  }
  
  return compressImage(source, { quality, format });
}

/**
 * Get estimated file size for quality level
 */
export async function estimateFileSize(
  source: HTMLCanvasElement | HTMLImageElement,
  quality: number,
  format: ImageFormat = 'jpeg'
): Promise<number> {
  const blob = await compressImage(source, { quality, format });
  return blob.size;
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): { ratio: number; percentage: number; saved: number } {
  const ratio = originalSize / compressedSize;
  const saved = originalSize - compressedSize;
  const percentage = Math.round((saved / originalSize) * 100);
  
  return { ratio, percentage, saved };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
