/**
 * Property-based tests for image upscale functionality
 * Feature: image-tools, Property 11: Upscale Dimension Multiplication
 * Validates: Requirements 8.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateUpscaleDimensions,
  validateUpscaleInput,
} from '../../lib/image/upscale';

describe('Feature: image-tools, Property 11: Upscale Dimension Multiplication', () => {
  /**
   * Property 11: Upscale Dimension Multiplication
   * For any image with dimensions (W, H) and scale factor S (2 or 4),
   * the upscaled output SHALL have dimensions (W×S, H×S).
   */
  it('calculateUpscaleDimensions returns exactly W×S and H×S for scale factor 2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        (width, height) => {
          const scale = 2;
          const result = calculateUpscaleDimensions(width, height, scale);
          
          expect(result.width).toBe(width * scale);
          expect(result.height).toBe(height * scale);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateUpscaleDimensions returns exactly W×S and H×S for scale factor 4', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }), // Smaller max to avoid very large outputs
        fc.integer({ min: 1, max: 500 }),
        (width, height) => {
          const scale = 4;
          const result = calculateUpscaleDimensions(width, height, scale);
          
          expect(result.width).toBe(width * scale);
          expect(result.height).toBe(height * scale);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('upscale dimensions are always larger than original', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        fc.constantFrom(2, 4) as fc.Arbitrary<2 | 4>,
        (width, height, scale) => {
          const result = calculateUpscaleDimensions(width, height, scale);
          
          expect(result.width).toBeGreaterThan(width);
          expect(result.height).toBeGreaterThan(height);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('upscale preserves aspect ratio exactly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 2000 }),
        fc.integer({ min: 10, max: 2000 }),
        fc.constantFrom(2, 4) as fc.Arbitrary<2 | 4>,
        (width, height, scale) => {
          const originalAspectRatio = width / height;
          const result = calculateUpscaleDimensions(width, height, scale);
          const newAspectRatio = result.width / result.height;
          
          // Aspect ratio should be exactly preserved (no rounding in multiplication)
          expect(newAspectRatio).toBe(originalAspectRatio);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('4x upscale is exactly 2x of 2x upscale', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 1, max: 500 }),
        (width, height) => {
          const result2x = calculateUpscaleDimensions(width, height, 2);
          const result4x = calculateUpscaleDimensions(width, height, 4);
          
          expect(result4x.width).toBe(result2x.width * 2);
          expect(result4x.height).toBe(result2x.height * 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Upscale input validation', () => {
  it('validates dimensions within allowed range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        (width, height) => {
          const result = validateUpscaleInput(width, height);
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects dimensions exceeding 2000px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2001, max: 10000 }),
        fc.integer({ min: 1, max: 2000 }),
        (width, height) => {
          const result = validateUpscaleInput(width, height);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects height exceeding 2000px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 2001, max: 10000 }),
        (width, height) => {
          const result = validateUpscaleInput(width, height);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects zero or negative dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 0 }),
        fc.integer({ min: 1, max: 2000 }),
        (width, height) => {
          const result = validateUpscaleInput(width, height);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects both dimensions exceeding limit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2001, max: 10000 }),
        fc.integer({ min: 2001, max: 10000 }),
        (width, height) => {
          const result = validateUpscaleInput(width, height);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Upscale dimension edge cases', () => {
  it('handles square images correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.constantFrom(2, 4) as fc.Arbitrary<2 | 4>,
        (size, scale) => {
          const result = calculateUpscaleDimensions(size, size, scale);
          
          // Square image should produce square output
          expect(result.width).toBe(result.height);
          expect(result.width).toBe(size * scale);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles very wide images (panorama)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500, max: 2000 }),
        fc.integer({ min: 50, max: 200 }),
        fc.constantFrom(2, 4) as fc.Arbitrary<2 | 4>,
        (width, height, scale) => {
          const result = calculateUpscaleDimensions(width, height, scale);
          
          expect(result.width).toBe(width * scale);
          expect(result.height).toBe(height * scale);
          expect(result.width).toBeGreaterThan(result.height);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles very tall images (portrait)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 500, max: 2000 }),
        fc.constantFrom(2, 4) as fc.Arbitrary<2 | 4>,
        (width, height, scale) => {
          const result = calculateUpscaleDimensions(width, height, scale);
          
          expect(result.width).toBe(width * scale);
          expect(result.height).toBe(height * scale);
          expect(result.height).toBeGreaterThan(result.width);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles minimum valid dimensions', () => {
    const result2x = calculateUpscaleDimensions(1, 1, 2);
    expect(result2x.width).toBe(2);
    expect(result2x.height).toBe(2);

    const result4x = calculateUpscaleDimensions(1, 1, 4);
    expect(result4x.width).toBe(4);
    expect(result4x.height).toBe(4);
  });

  it('handles maximum valid dimensions', () => {
    const result2x = calculateUpscaleDimensions(2000, 2000, 2);
    expect(result2x.width).toBe(4000);
    expect(result2x.height).toBe(4000);

    const result4x = calculateUpscaleDimensions(500, 500, 4);
    expect(result4x.width).toBe(2000);
    expect(result4x.height).toBe(2000);
  });
});
