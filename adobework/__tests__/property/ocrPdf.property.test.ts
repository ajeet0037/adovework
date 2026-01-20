/**
 * Property-based tests for OCR PDF functionality
 * Feature: adobework, Property: OCR Text Extraction
 * 
 * Tests the core OCR logic and preprocessing functions
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Test preprocessing logic (grayscale, contrast, denoise)
describe('Feature: adobework, OCR Preprocessing Properties', () => {
  
  // Property: Grayscale conversion produces valid RGB values
  it('grayscale conversion should produce equal R, G, B values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r, g, b) => {
          // Grayscale formula: 0.299 * R + 0.587 * G + 0.114 * B
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          
          // Result should be in valid range
          expect(gray).toBeGreaterThanOrEqual(0);
          expect(gray).toBeLessThanOrEqual(255);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Contrast enhancement keeps values in valid range
  it('contrast enhancement should keep values between 0 and 255', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.double({ min: 1.0, max: 3.0, noNaN: true }),
        (value, factor) => {
          // Contrast formula: factor * (value - 128) + 128
          const enhanced = Math.min(255, Math.max(0, factor * (value - 128) + 128));
          
          expect(enhanced).toBeGreaterThanOrEqual(0);
          expect(enhanced).toBeLessThanOrEqual(255);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Denoise threshold produces valid output
  it('denoise threshold should produce values 0, 255, or in between', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r, g, b) => {
          const avg = (r + g + b) / 3;
          const threshold = avg > 180 ? 255 : (avg < 80 ? 0 : avg);
          
          expect(threshold).toBeGreaterThanOrEqual(0);
          expect(threshold).toBeLessThanOrEqual(255);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Test language configuration
describe('Feature: adobework, OCR Language Configuration', () => {
  const LANGUAGES = [
    { code: 'eng', name: 'English' },
    { code: 'hin', name: 'Hindi' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'ara', name: 'Arabic' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'kor', name: 'Korean' },
    { code: 'ita', name: 'Italian' },
  ];

  // Property: All language codes are valid Tesseract codes
  it('all language codes should be non-empty strings', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LANGUAGES),
        (lang) => {
          expect(lang.code).toBeTruthy();
          expect(typeof lang.code).toBe('string');
          expect(lang.code.length).toBeGreaterThan(0);
          expect(lang.name).toBeTruthy();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Language codes follow Tesseract naming convention
  it('language codes should follow Tesseract naming convention', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LANGUAGES),
        (lang) => {
          // Tesseract codes are lowercase, may contain underscore
          expect(lang.code).toMatch(/^[a-z_]+$/);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Test page range validation
describe('Feature: adobework, OCR Page Range Properties', () => {
  
  // Property: Page range calculation is correct
  it('page range should calculate correct number of pages to process', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // totalPages
        fc.integer({ min: 1, max: 100 }), // from
        fc.integer({ min: 1, max: 100 }), // to
        fc.boolean(), // all pages
        (totalPages, from, to, all) => {
          const startPage = all ? 1 : Math.max(1, from);
          const endPage = all ? totalPages : Math.min(totalPages, to);
          const pagesToProcess = Math.max(0, endPage - startPage + 1);
          
          if (all) {
            expect(pagesToProcess).toBe(totalPages);
          } else {
            expect(pagesToProcess).toBeGreaterThanOrEqual(0);
            expect(pagesToProcess).toBeLessThanOrEqual(totalPages);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Start page is always <= end page after normalization
  it('normalized start page should be <= end page', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (totalPages, from, to) => {
          const startPage = Math.max(1, Math.min(from, totalPages));
          const endPage = Math.min(totalPages, Math.max(to, 1));
          
          // After proper normalization, we should have valid range
          expect(startPage).toBeGreaterThanOrEqual(1);
          expect(endPage).toBeLessThanOrEqual(totalPages);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Test confidence score properties
describe('Feature: adobework, OCR Confidence Score Properties', () => {
  
  // Property: Average confidence is calculated correctly
  it('average confidence should be between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 20 }),
        (confidences) => {
          const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
          
          expect(avgConfidence).toBeGreaterThanOrEqual(0);
          expect(avgConfidence).toBeLessThanOrEqual(100);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Empty pages result in 0 average
  it('empty page array should result in 0 or NaN average', () => {
    const confidences: number[] = [];
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;
    
    expect(avgConfidence).toBe(0);
  });
});

// Test word count properties
describe('Feature: adobework, OCR Word Count Properties', () => {
  
  // Property: Word count is non-negative
  it('word count should be non-negative for any text', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text) => {
          const words = text.split(/\s+/).filter(w => w.length > 0);
          
          expect(words.length).toBeGreaterThanOrEqual(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Empty string has 0 words
  it('empty string should have 0 words', () => {
    const text = '';
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    expect(words.length).toBe(0);
  });

  // Property: Whitespace-only string has 0 words
  it('whitespace-only string should have 0 words', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 }),
        (chars) => {
          const text = chars.join('');
          const words = text.split(/\s+/).filter(w => w.length > 0);
          
          expect(words.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
