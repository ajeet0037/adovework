// Image filter and adjustment utilities

import { FilterOptions } from './types';

/**
 * Apply brightness adjustment
 */
function applyBrightness(data: Uint8ClampedArray, value: number): void {
  const adjustment = (value / 100) * 255;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + adjustment));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment));
  }
}

/**
 * Apply contrast adjustment
 */
function applyContrast(data: Uint8ClampedArray, value: number): void {
  const factor = (259 * (value + 255)) / (255 * (259 - value));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
  }
}

/**
 * Apply saturation adjustment
 */
function applySaturation(data: Uint8ClampedArray, value: number): void {
  const adjustment = 1 + value / 100;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = Math.max(0, Math.min(255, gray + adjustment * (data[i] - gray)));
    data[i + 1] = Math.max(0, Math.min(255, gray + adjustment * (data[i + 1] - gray)));
    data[i + 2] = Math.max(0, Math.min(255, gray + adjustment * (data[i + 2] - gray)));
  }
}

/**
 * Apply exposure adjustment
 */
function applyExposure(data: Uint8ClampedArray, value: number): void {
  const factor = Math.pow(2, value / 100);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] * factor));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor));
  }
}

/**
 * Apply gaussian blur
 */
function applyBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number
): void {
  if (radius <= 0) return;
  
  // Use CSS filter for blur (faster than manual convolution)
  ctx.filter = `blur(${radius}px)`;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.filter = 'none';
}

/**
 * Apply sharpening
 */
function applySharpen(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  if (amount <= 0) return;
  
  const factor = amount / 100;
  const kernel = [
    0, -factor, 0,
    -factor, 1 + 4 * factor, -factor,
    0, -factor, 0
  ];
  
  const original = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += original[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        data[idx] = Math.max(0, Math.min(255, sum));
      }
    }
  }
}

/**
 * Apply all filters to an image
 */
export async function applyFilters(
  source: HTMLCanvasElement | HTMLImageElement,
  options: FilterOptions
): Promise<HTMLCanvasElement> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  // Create output canvas
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d')!;
  
  // Draw original image
  ctx.drawImage(source, 0, 0);
  
  // Apply blur first (uses CSS filter)
  if (options.blur > 0) {
    applyBlur(ctx, sourceWidth, sourceHeight, options.blur);
  }
  
  // Get image data for pixel manipulation
  const imageData = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
  const data = imageData.data;
  
  // Apply adjustments in order
  if (options.brightness !== 0) {
    applyBrightness(data, options.brightness);
  }
  
  if (options.contrast !== 0) {
    applyContrast(data, options.contrast);
  }
  
  if (options.saturation !== 0) {
    applySaturation(data, options.saturation);
  }
  
  if (options.exposure !== 0) {
    applyExposure(data, options.exposure);
  }
  
  if (options.sharpen > 0) {
    applySharpen(data, sourceWidth, sourceHeight, options.sharpen);
  }
  
  // Put modified data back
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
}

/**
 * Check if filter options are neutral (no effect)
 */
export function isNeutralFilter(options: FilterOptions): boolean {
  return (
    options.brightness === 0 &&
    options.contrast === 0 &&
    options.saturation === 0 &&
    options.exposure === 0 &&
    options.blur === 0 &&
    options.sharpen === 0
  );
}

/**
 * Get default filter options
 */
export function getDefaultFilterOptions(): FilterOptions {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    blur: 0,
    sharpen: 0,
  };
}

/**
 * Clamp filter value to valid range
 */
export function clampFilterValue(
  key: keyof FilterOptions,
  value: number
): number {
  switch (key) {
    case 'brightness':
    case 'contrast':
    case 'saturation':
    case 'exposure':
      return Math.max(-100, Math.min(100, value));
    case 'blur':
      return Math.max(0, Math.min(20, value));
    case 'sharpen':
      return Math.max(0, Math.min(100, value));
    default:
      return value;
  }
}
