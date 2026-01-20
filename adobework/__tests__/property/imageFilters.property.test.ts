/**
 * Property-based tests for image filter functionality
 * Feature: image-tools, Property 8: Filter Identity
 * Validates: Requirements 6.1-6.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getDefaultFilterOptions,
  isNeutralFilter,
  clampFilterValue,
  FilterOptions,
} from '../../lib/image/filters';
import { FILTER_PRESETS } from '../../lib/image/presets';

describe('Feature: image-tools, Property 8: Filter Identity', () => {
  /**
   * Property 8: Filter Identity
   * For any image, applying filters with all values at 0 (neutral)
   * SHALL produce an output visually identical to the input.
   */
  
  it('default filter options are neutral', () => {
    const defaults = getDefaultFilterOptions();
    expect(isNeutralFilter(defaults)).toBe(true);
  });

  it('isNeutralFilter returns true only when all values are zero', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 100 }),
        (brightness, contrast, saturation, exposure, blur, sharpen) => {
          const options: FilterOptions = {
            brightness,
            contrast,
            saturation,
            exposure,
            blur,
            sharpen,
          };
          
          const isNeutral = isNeutralFilter(options);
          const allZero = brightness === 0 && contrast === 0 && saturation === 0 &&
                          exposure === 0 && blur === 0 && sharpen === 0;
          
          expect(isNeutral).toBe(allZero);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('neutral filter has all zero values', () => {
    const neutral = getDefaultFilterOptions();
    
    expect(neutral.brightness).toBe(0);
    expect(neutral.contrast).toBe(0);
    expect(neutral.saturation).toBe(0);
    expect(neutral.exposure).toBe(0);
    expect(neutral.blur).toBe(0);
    expect(neutral.sharpen).toBe(0);
  });
});

describe('Filter value clamping', () => {
  it('clamps brightness to -100 to 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -500, max: 500 }),
        (value) => {
          const clamped = clampFilterValue('brightness', value);
          expect(clamped).toBeGreaterThanOrEqual(-100);
          expect(clamped).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clamps contrast to -100 to 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -500, max: 500 }),
        (value) => {
          const clamped = clampFilterValue('contrast', value);
          expect(clamped).toBeGreaterThanOrEqual(-100);
          expect(clamped).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clamps saturation to -100 to 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -500, max: 500 }),
        (value) => {
          const clamped = clampFilterValue('saturation', value);
          expect(clamped).toBeGreaterThanOrEqual(-100);
          expect(clamped).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clamps exposure to -100 to 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -500, max: 500 }),
        (value) => {
          const clamped = clampFilterValue('exposure', value);
          expect(clamped).toBeGreaterThanOrEqual(-100);
          expect(clamped).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clamps blur to 0 to 20', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -50, max: 100 }),
        (value) => {
          const clamped = clampFilterValue('blur', value);
          expect(clamped).toBeGreaterThanOrEqual(0);
          expect(clamped).toBeLessThanOrEqual(20);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clamps sharpen to 0 to 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -50, max: 200 }),
        (value) => {
          const clamped = clampFilterValue('sharpen', value);
          expect(clamped).toBeGreaterThanOrEqual(0);
          expect(clamped).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('values within range are unchanged', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        (value) => {
          const clamped = clampFilterValue('brightness', value);
          expect(clamped).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Filter presets', () => {
  it('all presets have required properties', () => {
    for (const [name, preset] of Object.entries(FILTER_PRESETS)) {
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('brightness');
      expect(preset).toHaveProperty('contrast');
      expect(preset).toHaveProperty('saturation');
      expect(preset).toHaveProperty('exposure');
      expect(typeof preset.brightness).toBe('number');
      expect(typeof preset.contrast).toBe('number');
      expect(typeof preset.saturation).toBe('number');
      expect(typeof preset.exposure).toBe('number');
    }
  });

  it('none preset is neutral', () => {
    const nonePreset = FILTER_PRESETS['none'];
    expect(nonePreset.brightness).toBe(0);
    expect(nonePreset.contrast).toBe(0);
    expect(nonePreset.saturation).toBe(0);
    expect(nonePreset.exposure).toBe(0);
  });

  it('preset values are within valid ranges', () => {
    for (const [name, preset] of Object.entries(FILTER_PRESETS)) {
      expect(preset.brightness).toBeGreaterThanOrEqual(-100);
      expect(preset.brightness).toBeLessThanOrEqual(100);
      expect(preset.contrast).toBeGreaterThanOrEqual(-100);
      expect(preset.contrast).toBeLessThanOrEqual(100);
      expect(preset.saturation).toBeGreaterThanOrEqual(-100);
      expect(preset.saturation).toBeLessThanOrEqual(100);
      expect(preset.exposure).toBeGreaterThanOrEqual(-100);
      expect(preset.exposure).toBeLessThanOrEqual(100);
    }
  });

  it('bw preset has -100 saturation', () => {
    const bwPreset = FILTER_PRESETS['bw'];
    expect(bwPreset.saturation).toBe(-100);
  });
});

describe('Filter options immutability', () => {
  it('getDefaultFilterOptions returns new object each time', () => {
    const options1 = getDefaultFilterOptions();
    const options2 = getDefaultFilterOptions();
    
    expect(options1).not.toBe(options2);
    expect(options1).toEqual(options2);
  });

  it('modifying returned options does not affect defaults', () => {
    const options1 = getDefaultFilterOptions();
    options1.brightness = 50;
    
    const options2 = getDefaultFilterOptions();
    expect(options2.brightness).toBe(0);
  });
});
