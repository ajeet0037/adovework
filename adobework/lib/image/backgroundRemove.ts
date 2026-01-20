// Background removal utility using @imgly/background-removal
// Client-side AI-powered background removal

import { removeBackground as imglyRemoveBackground, Config } from '@imgly/background-removal';

export interface BackgroundRemoveResult {
  foreground: Blob; // PNG with transparency
  mask?: Blob; // Grayscale mask (optional)
}

export interface BackgroundRemoveOptions {
  model?: 'isnet' | 'isnet_fp16' | 'isnet_quint8';
  output?: {
    format: 'image/png' | 'image/webp';
    quality?: number;
  };
  progress?: (progress: number, message: string) => void;
}

export interface BackgroundReplaceOptions {
  type: 'transparent' | 'solid' | 'gradient' | 'image';
  color?: string; // For solid color
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number; // For linear gradient
  };
  image?: string; // Base64 or URL for custom background
}

/**
 * Remove background from an image using AI
 * @param imageSource - Image source (File, Blob, or URL string)
 * @param options - Configuration options
 * @returns Promise with foreground image as PNG blob
 */
export async function removeBackground(
  imageSource: File | Blob | string,
  options: BackgroundRemoveOptions = {}
): Promise<BackgroundRemoveResult> {
  const models: Array<'isnet_fp16' | 'isnet_quint8'> = [
    options.model === 'isnet_quint8' ? 'isnet_quint8' : 'isnet_fp16',
    'isnet_quint8', // Fallback to lighter model
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < models.length; attempt++) {
    const currentModel = models[attempt];

    // Notify about retry if not first attempt
    if (attempt > 0 && options.progress) {
      options.progress(0, `Retrying with lighter model...`);
    }

    const config: Config = {
      model: currentModel,
      output: {
        format: options.output?.format || 'image/png',
        quality: options.output?.quality || 1,
      },
      progress: options.progress
        ? (key, current, total) => {
          const progress = Math.round((current / total) * 100);
          let message = key;

          // User-friendly progress messages
          if (key.includes('download') || key.includes('fetch')) {
            message = 'Downloading AI model (first time only)...';
          } else if (key.includes('init') || key.includes('load')) {
            message = 'Initializing AI model...';
          } else if (key.includes('compute') || key.includes('inference')) {
            message = 'Removing background...';
          }

          options.progress!(progress, message);
        }
        : undefined,
    };

    try {
      // Create a timeout promise for model loading (2 minutes max)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Model loading timeout. Please check your internet connection.'));
        }, 120000);
      });

      const result = await Promise.race([
        imglyRemoveBackground(imageSource, config),
        timeoutPromise,
      ]);

      // Apply edge refinement for smoother edges
      const refinedResult = await refineEdges(result);

      return {
        foreground: refinedResult,
      };
    } catch (error) {
      console.error(`Background removal attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry for certain errors
      if (lastError.message.includes('timeout')) {
        throw new Error('Background removal timed out. Please check your internet connection and try again.');
      }
      if (lastError.message.includes('memory') || lastError.message.includes('Memory')) {
        throw new Error('Not enough memory to process this image. Try a smaller image.');
      }

      // Continue to next model/retry
    }
  }

  // All attempts failed
  throw new Error(
    lastError?.message.includes('fetch') || lastError?.message.includes('network')
      ? 'Failed to download AI model. Please check your internet connection and try again.'
      : 'Background removal failed. Please try again with a different image.'
  );
}

/**
 * Refine edges of the foreground image for smoother cutout
 */
async function refineEdges(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(blob); // Return original if can't process
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data for edge processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply anti-aliasing to semi-transparent edges
      // This smooths the jagged edges by adjusting alpha values
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];

        // Only process semi-transparent pixels (edges)
        if (alpha > 0 && alpha < 255) {
          // Smooth the alpha transition
          // Apply a slight curve to make edges less harsh
          const smoothedAlpha = Math.round(
            255 * Math.pow(alpha / 255, 0.8)
          );
          data[i + 3] = Math.min(255, Math.max(0, smoothedAlpha));
        }
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (resultBlob) => {
          if (resultBlob) {
            resolve(resultBlob);
          } else {
            resolve(blob); // Return original if blob creation fails
          }
        },
        'image/png',
        1
      );

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve(blob); // Return original on error
    };
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Replace background with a solid color
 */
export async function replaceBackgroundWithColor(
  foregroundBlob: Blob,
  color: string,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Fill with solid color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    // Draw foreground on top
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1
      );
    };
    img.onerror = () => reject(new Error('Failed to load foreground image'));
    img.src = URL.createObjectURL(foregroundBlob);
  });
}

/**
 * Replace background with a gradient
 */
export async function replaceBackgroundWithGradient(
  foregroundBlob: Blob,
  gradient: BackgroundReplaceOptions['gradient'],
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!gradient) {
      reject(new Error('Gradient options required'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Create gradient
    let gradientFill: CanvasGradient;

    if (gradient.type === 'linear') {
      const angle = (gradient.angle || 0) * (Math.PI / 180);
      const x1 = width / 2 - Math.cos(angle) * width / 2;
      const y1 = height / 2 - Math.sin(angle) * height / 2;
      const x2 = width / 2 + Math.cos(angle) * width / 2;
      const y2 = height / 2 + Math.sin(angle) * height / 2;
      gradientFill = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      gradientFill = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
    }

    // Add color stops
    gradient.colors.forEach((color, index) => {
      gradientFill.addColorStop(index / (gradient.colors.length - 1), color);
    });

    ctx.fillStyle = gradientFill;
    ctx.fillRect(0, 0, width, height);

    // Draw foreground on top
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1
      );
    };
    img.onerror = () => reject(new Error('Failed to load foreground image'));
    img.src = URL.createObjectURL(foregroundBlob);
  });
}

/**
 * Replace background with a custom image
 */
export async function replaceBackgroundWithImage(
  foregroundBlob: Blob,
  backgroundImage: string,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Load background image
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => {
      // Draw background (cover mode)
      const bgRatio = bgImg.width / bgImg.height;
      const canvasRatio = width / height;

      let drawWidth, drawHeight, drawX, drawY;

      if (bgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = height * bgRatio;
        drawX = (width - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = width;
        drawHeight = width / bgRatio;
        drawX = 0;
        drawY = (height - drawHeight) / 2;
      }

      ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);

      // Load and draw foreground
      const fgImg = new Image();
      fgImg.onload = () => {
        ctx.drawImage(fgImg, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          1
        );
      };
      fgImg.onerror = () => reject(new Error('Failed to load foreground image'));
      fgImg.src = URL.createObjectURL(foregroundBlob);
    };
    bgImg.onerror = () => reject(new Error('Failed to load background image'));
    bgImg.src = backgroundImage;
  });
}

/**
 * Apply edge smoothing to the foreground (feathering)
 */
export async function applyEdgeSmoothing(
  foregroundBlob: Blob,
  featherRadius: number = 2
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Apply slight blur for edge smoothing
      ctx.filter = `blur(${featherRadius}px)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      // Draw original on top with slight inset to keep sharp center
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(foregroundBlob);
  });
}

/**
 * Get image dimensions from a blob
 */
export function getImageDimensionsFromBlob(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(blob);
  });
}

// Preset gradient options
export const GRADIENT_PRESETS = {
  sunset: {
    type: 'linear' as const,
    colors: ['#ff7e5f', '#feb47b'],
    angle: 135,
  },
  ocean: {
    type: 'linear' as const,
    colors: ['#2193b0', '#6dd5ed'],
    angle: 180,
  },
  forest: {
    type: 'linear' as const,
    colors: ['#134e5e', '#71b280'],
    angle: 135,
  },
  purple: {
    type: 'linear' as const,
    colors: ['#667eea', '#764ba2'],
    angle: 135,
  },
  pink: {
    type: 'radial' as const,
    colors: ['#ffecd2', '#fcb69f'],
  },
  blue: {
    type: 'radial' as const,
    colors: ['#a1c4fd', '#c2e9fb'],
  },
};

// Preset solid colors
export const COLOR_PRESETS = [
  '#ffffff', // White
  '#f0f0f0', // Light gray
  '#e8f4f8', // Light blue
  '#000000', // Black
  '#1a1a2e', // Dark blue
  '#16213e', // Navy
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Sky blue
  '#96ceb4', // Mint
  '#ffeaa7', // Yellow
  '#dfe6e9', // Silver
];
