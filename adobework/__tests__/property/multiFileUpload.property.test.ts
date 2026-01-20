import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateFiles, FileValidationOptions } from '@/lib/utils/fileValidation';
import { TOOLS } from '@/lib/constants/tools';

/**
 * Feature: adobework, Property 3: Multi-File Upload for Merge
 * 
 * For any set of valid PDF files (up to the configured limit), the merge tool's
 * upload component should accept all files and maintain their order for processing.
 * 
 * Validates: Requirements 3.6
 */
describe('Feature: adobework, Property 3: Multi-File Upload for Merge', () => {
  // Get the merge tool configuration
  const mergeTool = TOOLS.find(t => t.id === 'merge-pdf')!;

  // Helper to create a mock file object
  const createMockFile = (name: string, size: number, type: string) => ({
    name,
    size,
    type,
  });

  it('should accept any number of valid PDF files up to the configured limit', () => {
    fc.assert(
      fc.property(
        // Generate a random number of files between 1 and maxFiles
        fc.integer({ min: 1, max: mergeTool.maxFiles }),
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('.') && !s.includes('/')),
          { minLength: 1, maxLength: mergeTool.maxFiles }
        ),
        (numFiles, baseNames) => {
          // Create valid PDF files
          const files = baseNames.slice(0, numFiles).map((baseName, index) => 
            createMockFile(
              `${baseName}_${index}.pdf`,
              Math.floor(Math.random() * (mergeTool.maxFileSize - 1)) + 1,
              'application/pdf'
            )
          );

          const options: FileValidationOptions = {
            acceptedFormats: mergeTool.acceptedFormats,
            maxFileSize: mergeTool.maxFileSize,
            maxFiles: mergeTool.maxFiles,
          };

          const result = validateFiles(files, options);
          
          // All valid files within limit should be accepted
          return result.valid === true && result.errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject when number of files exceeds the configured limit', () => {
    fc.assert(
      fc.property(
        // Generate more files than allowed
        fc.integer({ min: mergeTool.maxFiles + 1, max: mergeTool.maxFiles + 10 }),
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('.') && !s.includes('/')),
          { minLength: mergeTool.maxFiles + 1, maxLength: mergeTool.maxFiles + 10 }
        ),
        (numFiles, baseNames) => {
          // Create more files than allowed
          const files = baseNames.slice(0, numFiles).map((baseName, index) => 
            createMockFile(
              `${baseName}_${index}.pdf`,
              Math.floor(Math.random() * (mergeTool.maxFileSize - 1)) + 1,
              'application/pdf'
            )
          );

          const options: FileValidationOptions = {
            acceptedFormats: mergeTool.acceptedFormats,
            maxFileSize: mergeTool.maxFileSize,
            maxFiles: mergeTool.maxFiles,
          };

          const result = validateFiles(files, options);
          
          // Should be rejected with max files error
          return result.valid === false && 
                 result.errors.some(e => e.includes('Maximum') && e.includes('files'));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain file order when validating multiple files', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('.') && !s.includes('/')),
          { minLength: 2, maxLength: mergeTool.maxFiles }
        ),
        (baseNames) => {
          // Create files with unique, ordered names
          const files = baseNames.map((baseName, index) => 
            createMockFile(
              `${String(index).padStart(3, '0')}_${baseName}.pdf`,
              Math.floor(Math.random() * (mergeTool.maxFileSize - 1)) + 1,
              'application/pdf'
            )
          );

          const options: FileValidationOptions = {
            acceptedFormats: mergeTool.acceptedFormats,
            maxFileSize: mergeTool.maxFileSize,
            maxFiles: mergeTool.maxFiles,
          };

          // Validate files
          const result = validateFiles(files, options);
          
          // If valid, the files array should maintain its original order
          // (validation doesn't modify the array, just checks it)
          if (result.valid) {
            // Verify order is preserved by checking file names are still in sequence
            for (let i = 0; i < files.length; i++) {
              const expectedPrefix = String(i).padStart(3, '0');
              if (!files[i].name.startsWith(expectedPrefix)) {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject mixed valid and invalid files in a batch', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('.') && !s.includes('/')),
          { minLength: 3, maxLength: mergeTool.maxFiles }
        ),
        (baseNames) => {
          // Ensure we have at least 1 invalid and 1 valid file
          const numInvalid = Math.max(1, Math.floor(baseNames.length / 2));
          
          // Create a mix of valid and invalid files
          const files = baseNames.map((baseName, index) => {
            if (index < numInvalid) {
              // Invalid file (wrong extension)
              return createMockFile(
                `${baseName}_${index}.txt`,
                1000,
                'text/plain'
              );
            }
            // Valid PDF file
            return createMockFile(
              `${baseName}_${index}.pdf`,
              Math.floor(Math.random() * (mergeTool.maxFileSize - 1)) + 1,
              'application/pdf'
            );
          });

          const options: FileValidationOptions = {
            acceptedFormats: mergeTool.acceptedFormats,
            maxFileSize: mergeTool.maxFileSize,
            maxFiles: mergeTool.maxFiles,
          };

          const result = validateFiles(files, options);
          
          // Should be rejected because of invalid files
          // Each invalid file generates one error
          return result.valid === false && result.errors.length >= numInvalid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should work correctly for all multi-file tools', () => {
    // Get all tools that support multiple files
    const multiFileTools = TOOLS.filter(t => t.maxFiles > 1);

    fc.assert(
      fc.property(
        fc.constantFrom(...multiFileTools),
        fc.integer({ min: 2, max: 5 }),
        (tool, numFiles) => {
          const actualNumFiles = Math.min(numFiles, tool.maxFiles);
          
          // Create valid files for this tool
          const files = Array.from({ length: actualNumFiles }, (_, index) => 
            createMockFile(
              `file_${index}${tool.acceptedFormats[0]}`,
              Math.floor(Math.random() * (tool.maxFileSize - 1)) + 1,
              'application/pdf'
            )
          );

          const options: FileValidationOptions = {
            acceptedFormats: tool.acceptedFormats,
            maxFileSize: tool.maxFileSize,
            maxFiles: tool.maxFiles,
          };

          const result = validateFiles(files, options);
          
          // All valid files within limit should be accepted
          return result.valid === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
