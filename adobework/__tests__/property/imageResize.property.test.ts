/**
 * Property-based tests for image resize functionality
 * Feature: image-tools, Property 1: Resize Dimension Accuracy
 * Feature: image-tools, Property 2: Aspect Ratio Preservation
 * Validates: Requirements 1.2, 1.3, 1.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateAspectRatioDimensions,
  convertToPixels,
  convertFromPixels,
} from '../../lib/image/resize';

describe('Feature: image-tools, Property 1: Resize Dimension Accuracy', () => {
  /**
   * Property 1: Resize Dimension Accuracy
   * For any valid image and target dimensions (width, height), resizing the image
   * SHALL produce an output with exactly those dimensions (within 1px tolerance for rounding).
   */
  it('calculateAspectRatioDimensions returns exact dimensions when both provided', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (originalWidth, originalHeight, targetWidth, targetHeight) => {
          const result = calculateAspectRatioDimensions(
            originalWidth,
            originalHeight,
            targetWidth,
            targetHeight
          );
          
          expect(result.width).toBe(targetWidth);
          expect(result.height).toBe(targetHeight);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns original dimensions when no target specified', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (originalWidth, originalHeight) => {
          const result = calculateAspectRatioDimensions(
            originalWidth,
            originalHeight,
            null,
            null
          );
          
          expect(result.width).toBe(originalWidth);
          expect(result.height).toBe(originalHeight);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: image-tools, Property 2: Aspect Ratio Preservation', () => {
  /**
   * Property 2: Aspect Ratio Preservation
   * For any image with aspect ratio lock enabled, when width is changed to W',
   * the new height H' SHALL equal W' × (original_height / original_width), and vice versa.
   */
  it('calculates correct height when only width is provided', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 5000 }),
        (originalWidth, originalHeight, targetWidth) => {
          const result = calculateAspectRatioDimensions(
            originalWidth,
            originalHeight,
            targetWidth,
            null
          );
          
          const expectedHeight = Math.round(targetWidth / (originalWidth / originalHeight));
          
          expect(result.width).toBe(targetWidth);
          // Allow 1px tolerance for rounding
          expect(Math.abs(result.height - expectedHeight)).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculates correct width when only height is provided', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 5000 }),
        (originalWidth, originalHeight, targetHeight) => {
          const result = calculateAspectRatioDimensions(
            originalWidth,
            originalHeight,
            null,
            targetHeight
          );
          
          const expectedWidth = Math.round(targetHeight * (originalWidth / originalHeight));
          
          expect(result.height).toBe(targetHeight);
          // Allow 1px tolerance for rounding
          expect(Math.abs(result.width - expectedWidth)).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves aspect ratio within tolerance', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5000 }),
        fc.integer({ min: 100, max: 5000 }),
        fc.integer({ min: 100, max: 5000 }),
        (originalWidth, originalHeight, targetWidth) => {
          const originalAspectRatio = originalWidth / originalHeight;
          
          const result = calculateAspectRatioDimensions(
            originalWidth,
            originalHeight,
            targetWidth,
            null
          );
          
          const newAspectRatio = result.width / result.height;
          
          // Aspect ratio should be preserved within reasonable tolerance
          // Due to integer rounding, we allow up to 1 pixel error which can cause
          // up to 1/min(width,height) relative error in aspect ratio
          const minDimension = Math.min(result.width, result.height);
          const maxRelativeError = 1 / minDimension;
          const tolerance = Math.max(0.02, maxRelativeError);
          
          expect(Math.abs(newAspectRatio - originalAspectRatio) / originalAspectRatio).toBeLessThan(tolerance);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Unit conversion properties', () => {
  it('pixel conversion is identity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (value, originalDimension) => {
          const pixels = convertToPixels(value, 'px', originalDimension);
          expect(pixels).toBe(value);
          
          const back = convertFromPixels(pixels, 'px', originalDimension);
          expect(back).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('percentage conversion round-trips correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 100, max: 10000 }),
        (percentage, originalDimension) => {
          const pixels = convertToPixels(percentage, '%', originalDimension);
          const expectedPixels = Math.round((percentage / 100) * originalDimension);
          expect(pixels).toBe(expectedPixels);
          
          // Convert back (may have small rounding differences)
          const backPercentage = convertFromPixels(pixels, '%', originalDimension);
          // Allow 0.5% tolerance due to rounding
          expect(Math.abs(backPercentage - percentage)).toBeLessThanOrEqual(0.5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('100% equals original dimension', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (originalDimension) => {
          const pixels = convertToPixels(100, '%', originalDimension);
          expect(pixels).toBe(originalDimension);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cm conversion uses correct DPI formula', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
        fc.integer({ min: 72, max: 600 }),
        (cm, dpi) => {
          const pixels = convertToPixels(cm, 'cm', 1000, dpi);
          const expectedPixels = Math.round((cm / 2.54) * dpi);
          expect(pixels).toBe(expectedPixels);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cm to pixels to cm round-trips within tolerance', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(30), noNaN: true }),
        fc.integer({ min: 100, max: 600 }),
        (cm, dpi) => {
          const pixels = convertToPixels(cm, 'cm', 1000, dpi);
          const backCm = convertFromPixels(pixels, 'cm', 1000, dpi);
          
          // Allow 0.02cm tolerance due to rounding
          expect(Math.abs(backCm - cm)).toBeLessThan(0.02);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Dimension calculation edge cases', () => {
  it('handles square images correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 5000 }),
        (size, targetWidth) => {
          const result = calculateAspectRatioDimensions(size, size, targetWidth, null);
          
          // Square image should produce square output
          expect(result.width).toBe(targetWidth);
          expect(result.height).toBe(targetWidth);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles very wide images (panorama)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 10000 }),
        fc.integer({ min: 100, max: 500 }),
        fc.integer({ min: 500, max: 5000 }),
        (width, height, targetWidth) => {
          const result = calculateAspectRatioDimensions(width, height, targetWidth, null);
          
          expect(result.width).toBe(targetWidth);
          expect(result.height).toBeGreaterThan(0);
          expect(result.height).toBeLessThan(result.width);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles very tall images (portrait)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 500 }),
        fc.integer({ min: 1000, max: 10000 }),
        fc.integer({ min: 500, max: 5000 }),
        (width, height, targetHeight) => {
          const result = calculateAspectRatioDimensions(width, height, null, targetHeight);
          
          expect(result.height).toBe(targetHeight);
          expect(result.width).toBeGreaterThan(0);
          expect(result.width).toBeLessThan(result.height);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('scaling up preserves aspect ratio', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 2, max: 5 }),
        (width, height, scaleFactor) => {
          const targetWidth = width * scaleFactor;
          const result = calculateAspectRatioDimensions(width, height, targetWidth, null);
          
          const originalRatio = width / height;
          const newRatio = result.width / result.height;
          
          // Ratios should match within 1% tolerance
          expect(Math.abs(newRatio - originalRatio) / originalRatio).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('scaling down preserves aspect ratio', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 5000 }),
        fc.integer({ min: 1000, max: 5000 }),
        fc.integer({ min: 2, max: 5 }),
        (width, height, scaleFactor) => {
          const targetWidth = Math.floor(width / scaleFactor);
          const result = calculateAspectRatioDimensions(width, height, targetWidth, null);
          
          const originalRatio = width / height;
          const newRatio = result.width / result.height;
          
          // Ratios should match within 1% tolerance
          expect(Math.abs(newRatio - originalRatio) / originalRatio).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});
