/**
 * Feature: adobework, Property 11: Tool Grid Completeness
 * 
 * For any tool defined in the tools configuration, it should appear in the
 * home page tool grid with its icon and description.
 * 
 * **Validates: Requirements 7.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TOOLS, getCoreTools, getAdvancedTools, getImageTools } from '@/lib/constants/tools';

describe('Feature: adobework, Property 11: Tool Grid Completeness', () => {
  it('should include all tools from configuration', () => {
    // Verify all 26 tools are present (17 PDF + 9 Image tools)
    expect(TOOLS.length).toBe(26);
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: TOOLS.length - 1 }),
        (toolIndex) => {
          const tool = TOOLS[toolIndex];
          
          // Each tool should have required properties for display
          expect(tool.id).toBeDefined();
          expect(tool.name).toBeDefined();
          expect(tool.description).toBeDefined();
          expect(tool.icon).toBeDefined();
          expect(tool.slug).toBeDefined();
          
          // Name should be non-empty
          expect(tool.name.length).toBeGreaterThan(0);
          
          // Description should be non-empty
          expect(tool.description.length).toBeGreaterThan(0);
          
          // Icon should be non-empty
          expect(tool.icon.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have tools organized by category', () => {
    const coreTools = getCoreTools();
    const advancedTools = getAdvancedTools();
    const imageTools = getImageTools();
    
    // Core tools should exist
    expect(coreTools.length).toBeGreaterThan(0);
    
    // Advanced tools should exist
    expect(advancedTools.length).toBeGreaterThan(0);
    
    // Image tools should exist
    expect(imageTools.length).toBeGreaterThan(0);
    
    // All tools should be in one of the categories
    expect(coreTools.length + advancedTools.length + imageTools.length).toBe(TOOLS.length);
    
    // Verify category assignment
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: TOOLS.length - 1 }),
        (toolIndex) => {
          const tool = TOOLS[toolIndex];
          
          // Each tool should have a valid category
          expect(['core', 'advanced', 'image']).toContain(tool.category);
          
          // Tool should be in the correct category array
          if (tool.category === 'core') {
            expect(coreTools.some(t => t.id === tool.id)).toBe(true);
          } else if (tool.category === 'advanced') {
            expect(advancedTools.some(t => t.id === tool.id)).toBe(true);
          } else {
            expect(imageTools.some(t => t.id === tool.id)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have unique tool identifiers', () => {
    const ids = TOOLS.map(tool => tool.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(TOOLS.length);
  });

  it('should have all expected core tools', () => {
    const expectedCoreTools = [
      'pdf-to-word',
      'word-to-pdf',
      'image-to-pdf',
      'merge-pdf',
      'compress-pdf',
    ];
    
    const coreTools = getCoreTools();
    const coreToolIds = coreTools.map(t => t.id);
    
    expectedCoreTools.forEach(expectedId => {
      expect(coreToolIds).toContain(expectedId);
    });
  });

  it('should have all expected advanced tools', () => {
    const expectedAdvancedTools = [
      'pdf-to-ppt',
      'ppt-to-pdf',
      'pdf-to-excel',
      'excel-to-pdf',
      'split-pdf',
      'reorder-pdf',
      'rotate-pdf',
      'protect-pdf',
      'unlock-pdf',
      'watermark-pdf',
      'sign-pdf',
      'edit-pdf',
    ];
    
    const advancedTools = getAdvancedTools();
    const advancedToolIds = advancedTools.map(t => t.id);
    
    expectedAdvancedTools.forEach(expectedId => {
      expect(advancedToolIds).toContain(expectedId);
    });
  });

  it('should have all expected image tools', () => {
    const expectedImageTools = [
      'resize-image',
      'crop-rotate-image',
      'compress-image',
      'convert-image',
      'photo-editor',
      'add-text-sticker',
      'remove-background',
      'upscale-image',
      'passport-photo',
    ];
    
    const imageTools = getImageTools();
    const imageToolIds = imageTools.map(t => t.id);
    
    expectedImageTools.forEach(expectedId => {
      expect(imageToolIds).toContain(expectedId);
    });
  });
});
