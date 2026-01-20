// Image transform utilities (rotate, flip, crop)

import { TransformOptions, CropOptions } from './types';

/**
 * Rotate image by specified degrees
 */
export async function rotateImage(
  source: HTMLCanvasElement | HTMLImageElement,
  degrees: number
): Promise<HTMLCanvasElement> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  // Normalize degrees to 0-360
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  
  // Calculate new dimensions
  const radians = (normalizedDegrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  
  const newWidth = Math.round(sourceWidth * cos + sourceHeight * sin);
  const newHeight = Math.round(sourceWidth * sin + sourceHeight * cos);
  
  // Create output canvas
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;
  
  // Move to center, rotate, then draw
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(radians);
  ctx.drawImage(source, -sourceWidth / 2, -sourceHeight / 2);
  
  return canvas;
}

/**
 * Rotate image by 90 degrees clockwise
 */
export async function rotate90(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<HTMLCanvasElement> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = sourceHeight;
  canvas.height = sourceWidth;
  const ctx = canvas.getContext('2d')!;
  
  ctx.translate(sourceHeight, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(source, 0, 0);
  
  return canvas;
}

/**
 * Rotate image by 180 degrees
 */
export async function rotate180(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<HTMLCanvasElement> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d')!;
  
  ctx.translate(sourceWidth, sourceHeight);
  ctx.rotate(Math.PI);
  ctx.drawImage(source, 0, 0);
  
  return canvas;
}

/**
 * Flip image horizontally
 */
export async function flipHorizontal(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<HTMLCanvasElement> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d')!;
  
  ctx.translate(sourceWidth, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0);
  
  return canvas;
}

/**
 * Flip image vertically
 */
export async function flipVertical(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<HTMLCanvasElement> {
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d')!;
  
  ctx.translate(0, sourceHeight);
  ctx.scale(1, -1);
  ctx.drawImage(source, 0, 0);
  
  return canvas;
}

/**
 * Apply all transforms at once
 */
export async function applyTransforms(
  source: HTMLCanvasElement | HTMLImageElement,
  options: TransformOptions
): Promise<HTMLCanvasElement> {
  let result: HTMLCanvasElement | HTMLImageElement = source;
  
  // Apply rotation first
  if (options.rotate !== 0) {
    result = await rotateImage(result, options.rotate);
  }
  
  // Apply flips
  if (options.flipHorizontal) {
    result = await flipHorizontal(result);
  }
  
  if (options.flipVertical) {
    result = await flipVertical(result);
  }
  
  // Ensure we return a canvas
  if (result instanceof HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(result, 0, 0);
    return canvas;
  }
  
  return result;
}

/**
 * Crop image to specified region
 */
export async function cropImage(
  source: HTMLCanvasElement | HTMLImageElement,
  options: CropOptions
): Promise<HTMLCanvasElement> {
  const { x, y, width, height } = options;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
  
  return canvas;
}

/**
 * Crop image with aspect ratio constraint
 */
export function calculateCropWithAspectRatio(
  sourceWidth: number,
  sourceHeight: number,
  aspectRatio: number
): CropOptions {
  const sourceAspectRatio = sourceWidth / sourceHeight;
  
  let cropWidth: number;
  let cropHeight: number;
  let x: number;
  let y: number;
  
  if (sourceAspectRatio > aspectRatio) {
    // Source is wider, crop width
    cropHeight = sourceHeight;
    cropWidth = Math.round(sourceHeight * aspectRatio);
    x = Math.round((sourceWidth - cropWidth) / 2);
    y = 0;
  } else {
    // Source is taller, crop height
    cropWidth = sourceWidth;
    cropHeight = Math.round(sourceWidth / aspectRatio);
    x = 0;
    y = Math.round((sourceHeight - cropHeight) / 2);
  }
  
  return { x, y, width: cropWidth, height: cropHeight };
}

/**
 * Straighten image (rotate by small angle with crop)
 */
export async function straightenImage(
  source: HTMLCanvasElement | HTMLImageElement,
  degrees: number // -45 to 45
): Promise<HTMLCanvasElement> {
  // Clamp degrees
  const clampedDegrees = Math.max(-45, Math.min(45, degrees));
  
  if (clampedDegrees === 0) {
    if (source instanceof HTMLCanvasElement) {
      return source;
    }
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(source, 0, 0);
    return canvas;
  }
  
  // Rotate the image
  const rotated = await rotateImage(source, clampedDegrees);
  
  // Calculate crop to remove empty corners
  const sourceWidth = source instanceof HTMLCanvasElement ? source.width : source.width;
  const sourceHeight = source instanceof HTMLCanvasElement ? source.height : source.height;
  
  const radians = Math.abs(clampedDegrees * Math.PI / 180);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  // Calculate the largest rectangle that fits inside the rotated image
  const cropWidth = Math.round(sourceWidth * cos - sourceHeight * sin * Math.sign(clampedDegrees));
  const cropHeight = Math.round(sourceHeight * cos - sourceWidth * sin * Math.sign(clampedDegrees));
  
  const x = Math.round((rotated.width - Math.abs(cropWidth)) / 2);
  const y = Math.round((rotated.height - Math.abs(cropHeight)) / 2);
  
  return cropImage(rotated, {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(rotated.width, Math.abs(cropWidth)),
    height: Math.min(rotated.height, Math.abs(cropHeight)),
  });
}
