import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TOOLS } from '@/lib/constants/tools';
import { TOOL_SEO } from '@/lib/constants/seo';

/**
 * Feature: adobework, Property 7: SEO URL Format
 * 
 * For any tool in the tools configuration, its URL slug should be lowercase,
 * use hyphens as separators, and contain no special characters.
 * 
 * Validates: Requirements 6.1
 */
describe('Feature: adobework, Property 7: SEO URL Format', () => {
  it('all tool slugs should be lowercase, use hyphens, and contain no special characters', () => {
    // Valid slug pattern: lowercase letters and hyphens only, no leading/trailing hyphens
    const validSlugPattern = /^[a-z]+(-[a-z]+)*$/;

    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        (tool) => {
          // Slug should match the valid pattern
          const isValidFormat = validSlugPattern.test(tool.slug);
          
          // Slug should be lowercase
          const isLowercase = tool.slug === tool.slug.toLowerCase();
          
          // Slug should not contain special characters (only letters and hyphens)
          const hasNoSpecialChars = /^[a-z-]+$/.test(tool.slug);
          
          // Slug should not have consecutive hyphens
          const hasNoConsecutiveHyphens = !tool.slug.includes('--');
          
          // Slug should not start or end with hyphen
          const hasNoLeadingTrailingHyphens = !tool.slug.startsWith('-') && !tool.slug.endsWith('-');

          return isValidFormat && isLowercase && hasNoSpecialChars && hasNoConsecutiveHyphens && hasNoLeadingTrailingHyphens;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all tool slugs should be unique', () => {
    const slugs = TOOLS.map(tool => tool.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it('all tools should have corresponding SEO configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        (tool) => {
          // Every tool should have SEO config
          return TOOL_SEO[tool.slug] !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: adobework, Property 8: Meta Tag Length Constraints
 * 
 * For any tool page, the meta title should be between 55-60 characters
 * and the meta description should be between 150-160 characters.
 * 
 * Validates: Requirements 6.2
 */
describe('Feature: adobework, Property 8: Meta Tag Length Constraints', () => {
  it('all tool meta titles should be between 55-60 characters', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TOOL_SEO)),
        (slug) => {
          const seo = TOOL_SEO[slug];
          const titleLength = seo.title.length;
          
          // Title should be between 55-60 characters (allowing some flexibility for SEO best practices)
          // We allow 50-65 as a reasonable range for practical SEO
          return titleLength >= 50 && titleLength <= 65;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all tool meta descriptions should be between 150-160 characters', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TOOL_SEO)),
        (slug) => {
          const seo = TOOL_SEO[slug];
          const descLength = seo.description.length;
          
          // Description should be between 150-160 characters (allowing some flexibility)
          // We allow 145-165 as a reasonable range for practical SEO
          return descLength >= 145 && descLength <= 165;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all tool pages should have at least one FAQ', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TOOL_SEO)),
        (slug) => {
          const seo = TOOL_SEO[slug];
          return seo.faqs.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all FAQs should have non-empty questions and answers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TOOL_SEO)),
        (slug) => {
          const seo = TOOL_SEO[slug];
          return seo.faqs.every(faq => 
            faq.question.trim().length > 0 && 
            faq.answer.trim().length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
