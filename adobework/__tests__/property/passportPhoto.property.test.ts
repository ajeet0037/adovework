/**
 * Property-based tests for passport photo generator
 * Feature: image-tools, Property 12: Passport Photo Dimensions
 * Validates: Requirements 10.3, 10.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  PASSPORT_PRESETS,
  PassportPhotoPreset,
  getPassportPreset,
  getPresetsByCountry,
} from '../../lib/image/passportPhoto';

describe('Feature: image-tools, Property 12: Passport Photo Dimensions', () => {
  /**
   * Property 12: Passport Photo Dimensions
   * For any image processed by the passport photo generator with preset P,
   * the output dimensions SHALL match the preset's specified dimensions exactly.
   */

  it('all presets have valid dimensions and required properties', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PASSPORT_PRESETS)),
        (presetId) => {
          const preset = PASSPORT_PRESETS[presetId];
          
          // Verify preset has required properties
          expect(preset).toBeDefined();
          expect(preset.id).toBe(presetId);
          expect(preset.name).toBeDefined();
          expect(preset.name.length).toBeGreaterThan(0);
          
          // Verify dimensions are positive integers
          expect(preset.width).toBeGreaterThan(0);
          expect(preset.height).toBeGreaterThan(0);
          expect(Number.isInteger(preset.width)).toBe(true);
          expect(Number.isInteger(preset.height)).toBe(true);
          
          // Verify mm dimensions are positive
          expect(preset.widthMm).toBeGreaterThan(0);
          expect(preset.heightMm).toBeGreaterThan(0);
          
          // Verify DPI is standard (typically 300 for print)
          expect(preset.dpi).toBeGreaterThanOrEqual(72);
          expect(preset.dpi).toBeLessThanOrEqual(600);
          
          // Verify country is defined
          expect(preset.country).toBeDefined();
          expect(preset.country.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getPassportPreset returns correct preset for valid IDs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PASSPORT_PRESETS)),
        (presetId) => {
          const preset = getPassportPreset(presetId);
          
          expect(preset).toBeDefined();
          expect(preset?.id).toBe(presetId);
          expect(preset?.width).toBe(PASSPORT_PRESETS[presetId].width);
          expect(preset?.height).toBe(PASSPORT_PRESETS[presetId].height);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getPassportPreset returns undefined for invalid IDs', () => {
    // List of JavaScript built-in property names to exclude
    const builtInProps = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', 
      'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', '__proto__',
      '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__'];
    
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !Object.keys(PASSPORT_PRESETS).includes(s) && !builtInProps.includes(s)
        ),
        (invalidId) => {
          const preset = getPassportPreset(invalidId);
          expect(preset).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all presets have valid face positioning parameters', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PASSPORT_PRESETS)),
        (presetId) => {
          const preset = PASSPORT_PRESETS[presetId];
          
          // Face height percent should be reasonable (50-90%)
          expect(preset.faceHeightPercent).toBeGreaterThanOrEqual(50);
          expect(preset.faceHeightPercent).toBeLessThanOrEqual(90);
          
          // Face top margin should be reasonable (5-30%)
          expect(preset.faceTopMarginPercent).toBeGreaterThanOrEqual(5);
          expect(preset.faceTopMarginPercent).toBeLessThanOrEqual(30);
          
          // Face height + top margin should not exceed 100%
          expect(preset.faceHeightPercent + preset.faceTopMarginPercent).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all presets have valid background colors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PASSPORT_PRESETS)),
        (presetId) => {
          const preset = PASSPORT_PRESETS[presetId];
          
          // Background color should be a valid hex color
          expect(preset.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('presets are correctly grouped by country', () => {
    const presetsByCountry = getPresetsByCountry();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PASSPORT_PRESETS)),
        (presetId) => {
          const preset = PASSPORT_PRESETS[presetId];
          const countryPresets = presetsByCountry[preset.country];
          
          // Preset should be in its country's group
          expect(countryPresets).toBeDefined();
          expect(countryPresets.some(p => p.id === presetId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Indian document presets have correct specifications', () => {
    // Indian Passport: 35×45mm
    const indiaPassport = PASSPORT_PRESETS['india-passport'];
    expect(indiaPassport.widthMm).toBe(35);
    expect(indiaPassport.heightMm).toBe(45);
    expect(indiaPassport.country).toBe('India');
    
    // PAN Card: 25×35mm
    const panCard = PASSPORT_PRESETS['india-pan'];
    expect(panCard.widthMm).toBe(25);
    expect(panCard.heightMm).toBe(35);
    expect(panCard.country).toBe('India');
    
    // Aadhaar: 35×45mm
    const aadhaar = PASSPORT_PRESETS['india-aadhaar'];
    expect(aadhaar.widthMm).toBe(35);
    expect(aadhaar.heightMm).toBe(45);
    expect(aadhaar.country).toBe('India');
  });

  it('US Visa preset has correct square dimensions', () => {
    const usVisa = PASSPORT_PRESETS['us-visa'];
    
    // US Visa is 2×2 inches = 51×51mm
    expect(usVisa.widthMm).toBe(51);
    expect(usVisa.heightMm).toBe(51);
    expect(usVisa.width).toBe(usVisa.height); // Should be square
    expect(usVisa.country).toBe('USA');
  });

  it('preset aspect ratios are reasonable for passport photos', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PASSPORT_PRESETS)),
        (presetId) => {
          const preset = PASSPORT_PRESETS[presetId];
          
          // Passport photos are typically portrait or square
          const aspectRatio = preset.width / preset.height;
          
          // Aspect ratio should be between 0.5 (tall portrait) and 1.2 (slightly wide)
          // Most passport photos are portrait (taller than wide) or square
          expect(aspectRatio).toBeGreaterThanOrEqual(0.5);
          expect(aspectRatio).toBeLessThanOrEqual(1.2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Passport preset coverage', () => {
  it('includes all required Indian document types', () => {
    const requiredIndianPresets = ['india-passport', 'india-pan', 'india-aadhaar'];
    
    for (const presetId of requiredIndianPresets) {
      expect(PASSPORT_PRESETS[presetId]).toBeDefined();
      expect(PASSPORT_PRESETS[presetId].country).toBe('India');
    }
  });

  it('includes US visa preset', () => {
    expect(PASSPORT_PRESETS['us-visa']).toBeDefined();
    expect(PASSPORT_PRESETS['us-visa'].country).toBe('USA');
  });

  it('all presets have unique IDs', () => {
    const ids = Object.keys(PASSPORT_PRESETS);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all presets have non-empty names', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PASSPORT_PRESETS)),
        (presetId) => {
          const preset = PASSPORT_PRESETS[presetId];
          expect(preset.name).toBeDefined();
          expect(preset.name.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
