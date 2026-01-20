import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ToolSEOContent } from '@/components/seo/ToolSEOContent';
import { TOOLS } from '@/lib/constants/tools';
import { TOOL_SEO } from '@/lib/constants/seo';

/**
 * Feature: adobework, Property 9: Heading Hierarchy
 * 
 * For any tool page, there should be exactly one H1 element,
 * and all H2 elements should appear after the H1.
 * 
 * Validates: Requirements 6.3
 */
describe('Feature: adobework, Property 9: Heading Hierarchy', () => {
  it('ToolSEOContent should render exactly one H1 element', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS.filter(t => TOOL_SEO[t.slug])),
        (tool) => {
          const seo = TOOL_SEO[tool.slug];
          if (!seo) return true; // Skip if no SEO config
          
          const { container } = render(
            <ToolSEOContent tool={tool} seo={seo} />
          );
          
          const h1Elements = container.querySelectorAll('h1');
          return h1Elements.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('H1 should contain the SEO h1 text', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS.filter(t => TOOL_SEO[t.slug])),
        (tool) => {
          const seo = TOOL_SEO[tool.slug];
          if (!seo) return true;
          
          const { container } = render(
            <ToolSEOContent tool={tool} seo={seo} />
          );
          
          const h1 = container.querySelector('h1');
          return h1?.textContent === seo.h1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all H2 elements should appear after the H1 in DOM order', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS.filter(t => TOOL_SEO[t.slug])),
        (tool) => {
          const seo = TOOL_SEO[tool.slug];
          if (!seo) return true;
          
          const { container } = render(
            <ToolSEOContent tool={tool} seo={seo} />
          );
          
          // Get all headings in DOM order
          const allHeadings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const headingArray = Array.from(allHeadings);
          
          // Find the index of H1
          const h1Index = headingArray.findIndex(h => h.tagName === 'H1');
          
          // If no H1, fail
          if (h1Index === -1) return false;
          
          // All H2s should come after H1
          const h2Indices = headingArray
            .map((h, i) => h.tagName === 'H2' ? i : -1)
            .filter(i => i !== -1);
          
          return h2Indices.every(index => index > h1Index);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all H3 elements should appear after their parent H2', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS.filter(t => TOOL_SEO[t.slug])),
        (tool) => {
          const seo = TOOL_SEO[tool.slug];
          if (!seo) return true;
          
          const { container } = render(
            <ToolSEOContent tool={tool} seo={seo} />
          );
          
          const allHeadings = container.querySelectorAll('h1, h2, h3');
          const headingArray = Array.from(allHeadings);
          
          // Check that H3s only appear after at least one H2
          let h2Found = false;
          for (const heading of headingArray) {
            if (heading.tagName === 'H2') {
              h2Found = true;
            }
            if (heading.tagName === 'H3' && !h2Found) {
              return false; // H3 appeared before any H2
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('heading hierarchy should not skip levels (no H3 without H2)', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS.filter(t => TOOL_SEO[t.slug])),
        (tool) => {
          const seo = TOOL_SEO[tool.slug];
          if (!seo) return true;
          
          const { container } = render(
            <ToolSEOContent tool={tool} seo={seo} />
          );
          
          const hasH1 = container.querySelectorAll('h1').length > 0;
          const hasH2 = container.querySelectorAll('h2').length > 0;
          const hasH3 = container.querySelectorAll('h3').length > 0;
          
          // If there's an H3, there must be an H2
          if (hasH3 && !hasH2) return false;
          
          // If there's an H2, there must be an H1
          if (hasH2 && !hasH1) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
