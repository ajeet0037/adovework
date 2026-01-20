/**
 * File validation utility for AdobeWork
 * Validates file type and size against tool-specific constraints
 */

export interface FileValidationOptions {
  acceptedFormats: string[];
  maxFileSize: number;
  maxFiles?: number;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Get the file extension from a filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Check if a file type matches accepted formats
 * Handles both extension-based and MIME type validation
 */
function isAcceptedFormat(file: File | { name: string; type: string }, acceptedFormats: string[]): boolean {
  const extension = getFileExtension(file.name);
  
  // Check if extension matches any accepted format
  const normalizedFormats = acceptedFormats.map(f => f.toLowerCase());
  
  if (normalizedFormats.includes(extension)) {
    return true;
  }
  
  // Also check MIME type for common formats
  const mimeTypeMap: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  };
  
  const mimeExtensions = mimeTypeMap[file.type] || [];
  return mimeExtensions.some(ext => normalizedFormats.includes(ext));
}

/**
 * Format file size for display in error messages
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate a single file against the provided options
 * 
 * @param file - The file to validate (File object or file-like object)
 * @param options - Validation options including accepted formats and size limits
 * @returns Validation result with valid flag and error messages
 */
export function validateFile(
  file: File | { name: string; size: number; type: string },
  options: FileValidationOptions
): FileValidationResult {
  const errors: string[] = [];
  
  // Check file type
  if (!isAcceptedFormat(file, options.acceptedFormats)) {
    const formatsDisplay = options.acceptedFormats.join(', ').toUpperCase().replace(/\./g, '');
    errors.push(`Please upload a valid ${formatsDisplay} file`);
  }
  
  // Check file size
  if (file.size > options.maxFileSize) {
    const maxSizeDisplay = formatSize(options.maxFileSize);
    errors.push(`File exceeds ${maxSizeDisplay} limit`);
  }
  
  // Check for empty files
  if (file.size === 0) {
    errors.push('File is empty');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple files against the provided options
 * 
 * @param files - Array of files to validate
 * @param options - Validation options including accepted formats, size limits, and max files
 * @returns Validation result with valid flag and error messages
 */
export function validateFiles(
  files: Array<File | { name: string; size: number; type: string }>,
  options: FileValidationOptions
): FileValidationResult {
  const errors: string[] = [];
  
  // Check max files limit
  if (options.maxFiles !== undefined && files.length > options.maxFiles) {
    errors.push(`Maximum ${options.maxFiles} files allowed`);
  }
  
  // Validate each file
  files.forEach((file, index) => {
    const result = validateFile(file, options);
    if (!result.valid) {
      result.errors.forEach(error => {
        errors.push(`${file.name}: ${error}`);
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}


/**
 * Import file limits from constants to avoid duplication
 * Requirements: 8.6
 */
import { 
  getFileSizeLimit, 
  getMaxFilesLimit, 
  getDailyConversionLimit 
} from '@/lib/constants/limits';

// Re-export for backward compatibility
export { getFileSizeLimit, getMaxFilesLimit, getDailyConversionLimit };

/**
 * Validate a file with premium-aware limits
 * 
 * @param file - The file to validate
 * @param options - Base validation options
 * @param isPremium - Whether the user has premium status
 * @returns Validation result with valid flag and error messages
 */
export function validateFileWithPremium(
  file: File | { name: string; size: number; type: string },
  options: Omit<FileValidationOptions, 'maxFileSize'>,
  isPremium: boolean
): FileValidationResult {
  const maxFileSize = getFileSizeLimit(isPremium);
  return validateFile(file, { ...options, maxFileSize });
}

/**
 * Validate multiple files with premium-aware limits
 * 
 * @param files - Array of files to validate
 * @param options - Base validation options
 * @param isPremium - Whether the user has premium status
 * @returns Validation result with valid flag and error messages
 */
export function validateFilesWithPremium(
  files: Array<File | { name: string; size: number; type: string }>,
  options: Omit<FileValidationOptions, 'maxFileSize' | 'maxFiles'>,
  isPremium: boolean
): FileValidationResult {
  const maxFileSize = getFileSizeLimit(isPremium);
  const maxFiles = getMaxFilesLimit(isPremium);
  return validateFiles(files, { ...options, maxFileSize, maxFiles });
}
