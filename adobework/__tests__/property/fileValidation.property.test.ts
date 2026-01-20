import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateFile, validateFiles, FileValidationOptions } from '@/lib/utils/fileValidation';
import { TOOLS } from '@/lib/constants/tools';

/**
 * Feature: adobework, Property 1: File Validation Correctness
 * 
 * For any file submitted to the Upload_Component, the validation function should
 * return `true` if and only if the file type matches the tool's accepted formats
 * AND the file size is within the configured limit.
 * 
 * Validates: Requirements 3.2, 3.5
 */
describe('Feature: adobework, Property 1: File Validation Correctness', () => {
  // Helper to create a mock file object
  const createMockFile = (name: string, size: number, type: string) => ({
    name,
    size,
    type,
  });

  // Arbitrary for generating valid file extensions from accepted formats
  const validExtensionArb = (formats: string[]) => 
    fc.constantFrom(...formats);

  // Arbitrary for generating file sizes within limit
  const validSizeArb = (maxSize: number) => 
    fc.integer({ min: 1, max: maxSize });

  // Arbitrary for generating file sizes exceeding limit
  const invalidSizeArb = (maxSize: number) => 
    fc.integer({ min: maxSize + 1, max: maxSize * 2 });

  // MIME type mapping for common formats
  const getMimeType = (extension: string): string => {
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    return mimeMap[extension.toLowerCase()] || 'application/octet-stream';
  };

  it('should accept files matching type and size constraints for any tool', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('.')),
        (tool, baseName) => {
          // For each tool, generate a valid file
          const extension = tool.acceptedFormats[0];
          const fileName = `${baseName}${extension}`;
          const fileSize = Math.floor(Math.random() * tool.maxFileSize) + 1;
          const mimeType = getMimeType(extension);

          const file = createMockFile(fileName, fileSize, mimeType);
          const options: FileValidationOptions = {
            acceptedFormats: tool.acceptedFormats,
            maxFileSize: tool.maxFileSize,
          };

          const result = validateFile(file, options);
          return result.valid === true && result.errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject files with invalid extensions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('.')),
        (tool, baseName) => {
          // Create a file with an invalid extension
          const invalidExtension = '.xyz';
          const fileName = `${baseName}${invalidExtension}`;
          const fileSize = Math.floor(tool.maxFileSize / 2);

          const file = createMockFile(fileName, fileSize, 'application/octet-stream');
          const options: FileValidationOptions = {
            acceptedFormats: tool.acceptedFormats,
            maxFileSize: tool.maxFileSize,
          };

          const result = validateFile(file, options);
          return result.valid === false && result.errors.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject files exceeding size limit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('.')),
        (tool, baseName) => {
          // Create a file that exceeds the size limit
          const extension = tool.acceptedFormats[0];
          const fileName = `${baseName}${extension}`;
          const fileSize = tool.maxFileSize + 1;
          const mimeType = getMimeType(extension);

          const file = createMockFile(fileName, fileSize, mimeType);
          const options: FileValidationOptions = {
            acceptedFormats: tool.acceptedFormats,
            maxFileSize: tool.maxFileSize,
          };

          const result = validateFile(file, options);
          return result.valid === false && result.errors.some(e => e.includes('exceeds'));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject empty files', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('.')),
        (tool, baseName) => {
          // Create an empty file
          const extension = tool.acceptedFormats[0];
          const fileName = `${baseName}${extension}`;
          const mimeType = getMimeType(extension);

          const file = createMockFile(fileName, 0, mimeType);
          const options: FileValidationOptions = {
            acceptedFormats: tool.acceptedFormats,
            maxFileSize: tool.maxFileSize,
          };

          const result = validateFile(file, options);
          return result.valid === false && result.errors.some(e => e.includes('empty'));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate files with both invalid type AND size correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('.')),
        (tool, baseName) => {
          // Create a file with both invalid extension and size
          const invalidExtension = '.xyz';
          const fileName = `${baseName}${invalidExtension}`;
          const fileSize = tool.maxFileSize + 1;

          const file = createMockFile(fileName, fileSize, 'application/octet-stream');
          const options: FileValidationOptions = {
            acceptedFormats: tool.acceptedFormats,
            maxFileSize: tool.maxFileSize,
          };

          const result = validateFile(file, options);
          // Should have at least 2 errors (type and size)
          return result.valid === false && result.errors.length >= 2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept files at exactly the size limit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOLS),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('.')),
        (tool, baseName) => {
          // Create a file at exactly the size limit
          const extension = tool.acceptedFormats[0];
          const fileName = `${baseName}${extension}`;
          const fileSize = tool.maxFileSize; // Exactly at limit
          const mimeType = getMimeType(extension);

          const file = createMockFile(fileName, fileSize, mimeType);
          const options: FileValidationOptions = {
            acceptedFormats: tool.acceptedFormats,
            maxFileSize: tool.maxFileSize,
          };

          const result = validateFile(file, options);
          return result.valid === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
