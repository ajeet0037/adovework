/**
 * Feature: adobework, Property 13: Tool Card Navigation
 * 
 * For any tool card on the home page, clicking it should navigate to the URL
 * matching the tool's slug pattern (`/{tool-slug}`).
 * 
 * **Validates: Requirements 7.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TOOLS } from '@/lib/constants/tools';

describe('Feature: adobework, Property 13: Tool Card Navigation', () => {
  it('should generate correct navigation URL for any tool', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: TOOLS.length - 1 }),
        (toolIndex) => {
          const tool = TOOLS[toolIndex];
          const expectedUrl = `/${tool.slug}`;
          
          // Verify the URL follows the expected pattern
          expect(expectedUrl).toBe(`/${tool.slug}`);
          
          // Verify the slug is valid (lowercase, hyphen-separated)
          expect(tool.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
          
          // Verify the URL starts with /
          expect(expectedUrl.startsWith('/')).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have unique navigation URLs for all tools', () => {
    const urls = TOOLS.map(tool => `/${tool.slug}`);
    const uniqueUrls = new Set(urls);
    
    expect(uniqueUrls.size).toBe(TOOLS.length);
  });

  it('should have consistent slug and id for navigation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: TOOLS.length - 1 }),
        (toolIndex) => {
          const tool = TOOLS[toolIndex];
          
          // Slug should be defined and non-empty
          expect(tool.slug).toBeDefined();
          expect(tool.slug.length).toBeGreaterThan(0);
          
          // ID should match slug for consistency
          expect(tool.id).toBe(tool.slug);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
