import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TOOLS } from '@/lib/constants/tools';
import { getFooterToolLinks } from '@/components/layout/Footer';

/**
 * Feature: adobework, Property 12: Footer Tool Links
 * 
 * For any tool defined in the tools configuration, the footer should contain
 * a link to that tool's page.
 * 
 * Validates: Requirements 7.5
 */
describe('Feature: adobework, Property 12: Footer Tool Links', () => {
  it('footer should contain links for all tools in the configuration', () => {
    const footerLinks = getFooterToolLinks();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        (tool) => {
          // Every tool from TOOLS should have a corresponding link in the footer
          const hasLink = footerLinks.some(
            (link) => link.id === tool.id && link.slug === tool.slug
          );
          return hasLink;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('footer tool links should have correct URL format', () => {
    const footerLinks = getFooterToolLinks();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...footerLinks),
        (link) => {
          // Slug should be valid URL format (lowercase, hyphens)
          const validSlugPattern = /^[a-z]+(-[a-z]+)*$/;
          return validSlugPattern.test(link.slug);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('footer should have the same number of tool links as tools configuration', () => {
    const footerLinks = getFooterToolLinks();
    expect(footerLinks.length).toBe(TOOLS.length);
  });

  it('all footer tool links should have non-empty names', () => {
    const footerLinks = getFooterToolLinks();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...footerLinks),
        (link) => {
          return link.name.trim().length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('footer tool links should match tool names from configuration', () => {
    const footerLinks = getFooterToolLinks();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        (tool) => {
          const footerLink = footerLinks.find((link) => link.id === tool.id);
          return footerLink !== undefined && footerLink.name === tool.name;
        }
      ),
      { numRuns: 100 }
    );
  });
});
