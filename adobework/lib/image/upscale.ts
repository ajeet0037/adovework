// AI Image Upscaler utility
// Uses browser-based bilinear/bicubic interpolation for upscaling
// For a production AI upscaler, you would integrate a model like Real-ESRGAN via ONNX.js

export interface UpscaleOptions {
  scale: 2 | 4;
  enhanceDetails?: boolean;
}

export interface UpscaleResult {
  blob: Blob;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
}

/**
 * Upscale an image using high-quality interpolation
 * This is a client-side implementation using Canvas API with enhanced sharpening
 */
export async function upscaleImage(
  source: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
  options: UpscaleOptions
): Promise<UpscaleResult> {
  const { scale, enhanceDetails = true } = options;
  
  // Get source dimensions
  const sourceWidth = source.width;
  const sourceHeight = source.height;
  
  // Validate input size (max 2000x2000 as per requirements)
  if (sourceWidth > 2000 || sourceHeight > 2000) {
    throw new Error('Input image must be 2000×2000 pixels or smaller');
  }
  
  // Calculate target dimensions
  const targetWidth = sourceWidth * scale;
  const targetHeight = sourceHeight * scale;
  
  // Create output canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  
  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the upscaled image
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  
  // Apply detail enhancement (sharpening) if enabled
  if (enhanceDetails) {
    applySharpening(ctx, targetWidth, targetHeight);
  }
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            blob,
            originalWidth: sourceWidth,
            originalHeight: sourceHeight,
            newWidth: targetWidth,
            newHeight: targetHeight,
          });
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png',
      1.0 // Maximum quality for upscaled images
    );
  });
}

/**
 * Apply sharpening filter to enhance details
 * Uses unsharp mask technique
 */
function applySharpening(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number = 0.3
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);
  
  // Simple 3x3 sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  // Apply convolution (skip edges)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kval = kernel[(ky + 1) * 3 + (kx + 1)];
            sum += copy[kidx] * kval;
          }
        }
        // Blend original with sharpened based on amount
        data[idx + c] = Math.max(0, Math.min(255, 
          copy[idx + c] * (1 - amount) + sum * amount
        ));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Upscale image from file
 */
export async function upscaleImageFile(
  file: File,
  options: UpscaleOptions,
  onProgress?: (progress: number) => void
): Promise<UpscaleResult> {
  return new Promise((resolve, reject) => {
    onProgress?.(10);
    
    const img = new Image();
    img.onload = async () => {
      try {
        onProgress?.(30);
        
        // Create canvas from image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        
        onProgress?.(50);
        
        // Upscale
        const result = await upscaleImage(canvas, options);
        
        onProgress?.(100);
        resolve(result);
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
 * Check if image dimensions are valid for upscaling
 */
export function validateUpscaleInput(width: number, height: number): { valid: boolean; error?: string } {
  if (width <= 0 || height <= 0) {
    return { valid: false, error: 'Invalid image dimensions' };
  }
  if (width > 2000 || height > 2000) {
    return { valid: false, error: 'Image must be 2000×2000 pixels or smaller' };
  }
  return { valid: true };
}

/**
 * Calculate output dimensions for upscaling
 */
export function calculateUpscaleDimensions(
  width: number,
  height: number,
  scale: 2 | 4
): { width: number; height: number } {
  return {
    width: width * scale,
    height: height * scale,
  };
}
