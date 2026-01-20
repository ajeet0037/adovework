import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateFAQJsonLd } from '@/components/seo/FAQSchema';
import { TOOL_SEO } from '@/lib/constants/seo';
import { FAQ } from '@/types/tool';

/**
 * Feature: adobework, Property 10: FAQ Schema Validity
 * 
 * For any tool page with FAQs, the generated JSON-LD should be valid
 * according to the FAQPage schema specification.
 * 
 * Validates: Requirements 6.5
 */
describe('Feature: adobework, Property 10: FAQ Schema Validity', () => {
  // Arbitrary for generating valid FAQ objects
  const faqArbitrary = fc.record({
    question: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    answer: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
  });

  it('generated JSON-LD should have correct @context and @type for FAQPage', () => {
    fc.assert(
      fc.property(
        fc.array(faqArbitrary, { minLength: 1, maxLength: 10 }),
        (faqs: FAQ[]) => {
          const jsonLd = generateFAQJsonLd(faqs);
          
          if (!jsonLd) return false;
          
          const schema = jsonLd as Record<string, unknown>;
          
          // Must have correct @context
          const hasCorrectContext = schema['@context'] === 'https://schema.org';
          
          // Must have correct @type
          const hasCorrectType = schema['@type'] === 'FAQPage';
          
          return hasCorrectContext && hasCorrectType;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each FAQ should be represented as a Question with AcceptedAnswer', () => {
    fc.assert(
      fc.property(
        fc.array(faqArbitrary, { minLength: 1, maxLength: 10 }),
        (faqs: FAQ[]) => {
          const jsonLd = generateFAQJsonLd(faqs);
          
          if (!jsonLd) return false;
          
          const schema = jsonLd as Record<string, unknown>;
          const mainEntity = schema['mainEntity'] as Array<Record<string, unknown>>;
          
          // Must have mainEntity array
          if (!Array.isArray(mainEntity)) return false;
          
          // Number of entities should match number of FAQs
          if (mainEntity.length !== faqs.length) return false;
          
          // Each entity should have correct structure
          return mainEntity.every((entity, index) => {
            const hasQuestionType = entity['@type'] === 'Question';
            const hasName = entity['name'] === faqs[index].question;
            
            const acceptedAnswer = entity['acceptedAnswer'] as Record<string, unknown>;
            const hasAnswerType = acceptedAnswer?.['@type'] === 'Answer';
            const hasText = acceptedAnswer?.['text'] === faqs[index].answer;
            
            return hasQuestionType && hasName && hasAnswerType && hasText;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty FAQ array should return null', () => {
    const result = generateFAQJsonLd([]);
    expect(result).toBeNull();
  });

  it('all tool SEO FAQs should generate valid JSON-LD schema', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TOOL_SEO)),
        (slug) => {
          const seo = TOOL_SEO[slug];
          const jsonLd = generateFAQJsonLd(seo.faqs);
          
          if (!jsonLd) return false;
          
          const schema = jsonLd as Record<string, unknown>;
          
          // Validate structure
          const hasContext = schema['@context'] === 'https://schema.org';
          const hasType = schema['@type'] === 'FAQPage';
          const hasMainEntity = Array.isArray(schema['mainEntity']);
          const mainEntity = schema['mainEntity'] as Array<Record<string, unknown>>;
          const matchesFaqCount = mainEntity.length === seo.faqs.length;
          
          // Validate each question
          const allQuestionsValid = mainEntity.every((entity) => {
            return (
              entity['@type'] === 'Question' &&
              typeof entity['name'] === 'string' &&
              entity['name'].length > 0 &&
              (entity['acceptedAnswer'] as Record<string, unknown>)?.['@type'] === 'Answer' &&
              typeof (entity['acceptedAnswer'] as Record<string, unknown>)?.['text'] === 'string'
            );
          });
          
          return hasContext && hasType && hasMainEntity && matchesFaqCount && allQuestionsValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('generated JSON-LD should be valid JSON', () => {
    fc.assert(
      fc.property(
        fc.array(faqArbitrary, { minLength: 1, maxLength: 10 }),
        (faqs: FAQ[]) => {
          const jsonLd = generateFAQJsonLd(faqs);
          
          if (!jsonLd) return false;
          
          // Should be serializable to valid JSON
          try {
            const jsonString = JSON.stringify(jsonLd);
            const parsed = JSON.parse(jsonString);
            return parsed !== null && typeof parsed === 'object';
          } catch {
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
