/**
 * Input sanitization utilities for AdobeWork
 * Prevents path traversal, XSS, and other security issues
 */

/**
 * Sanitize a filename to prevent path traversal and other security issues
 * 
 * @param filename - Original filename
 * @param maxLength - Maximum length (default: 255)
 * @returns Sanitized filename safe for file system operations
 * 
 * @example
 * sanitizeFilename('../../../etc/passwd') // Returns 'etc_passwd'
 * sanitizeFilename('my file (1).pdf') // Returns 'my_file_1.pdf'
 */
export function sanitizeFilename(filename: string, maxLength: number = 255): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Remove path separators and parent directory references
  let sanitized = filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[\/\\]/g, '_') // Replace path separators
    .replace(/^\.+/, '') // Remove leading dots
    .trim();

  // Remove or replace dangerous characters
  sanitized = sanitized
    .replace(/[<>:"|?*\x00-\x1f]/g, '_') // Remove/reserve characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w.\-]/g, '_') // Keep only alphanumeric, dots, hyphens, underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // Ensure it's not empty and has reasonable length
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'unnamed_file';
  }

  // Truncate if too long (preserve extension)
  if (sanitized.length > maxLength) {
    const lastDot = sanitized.lastIndexOf('.');
    if (lastDot > 0 && lastDot < sanitized.length - 1) {
      const ext = sanitized.substring(lastDot);
      const name = sanitized.substring(0, lastDot);
      const maxNameLength = maxLength - ext.length;
      sanitized = name.substring(0, Math.max(1, maxNameLength)) + ext;
    } else {
      sanitized = sanitized.substring(0, maxLength);
    }
  }

  return sanitized;
}

/**
 * Sanitize filename while preserving the extension
 * 
 * @param filename - Original filename
 * @param newExtension - Optional new extension to apply
 * @returns Sanitized filename with preserved or new extension
 */
export function sanitizeFilenameWithExtension(
  filename: string,
  newExtension?: string
): string {
  const sanitized = sanitizeFilename(filename);
  
  if (newExtension) {
    // Remove existing extension
    const lastDot = sanitized.lastIndexOf('.');
    const baseName = lastDot > 0 ? sanitized.substring(0, lastDot) : sanitized;
    
    // Ensure new extension starts with dot
    const ext = newExtension.startsWith('.') ? newExtension : `.${newExtension}`;
    
    // Sanitize extension
    const sanitizedExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
    
    return `${baseName}${sanitizedExt}`;
  }
  
  return sanitized;
}

/**
 * Validate and sanitize a file path (for server-side operations)
 * 
 * @param filePath - File path to validate
 * @param allowedBaseDir - Base directory that paths must be within
 * @returns Sanitized absolute path or null if invalid
 */
export function sanitizeFilePath(
  filePath: string,
  allowedBaseDir: string
): string | null {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // Remove any path traversal attempts
  const normalized = filePath
    .replace(/\.\./g, '')
    .replace(/\/+/g, '/')
    .trim();

  // Resolve to absolute path
  try {
    const path = require('path');
    const resolved = path.resolve(allowedBaseDir, normalized);
    const base = path.resolve(allowedBaseDir);
    
    // Ensure resolved path is within allowed directory
    if (!resolved.startsWith(base)) {
      return null;
    }
    
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Sanitize string input to prevent XSS
 * 
 * @param input - String input to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate URL to prevent SSRF attacks
 * 
 * @param url - URL to validate
 * @param allowedProtocols - Allowed protocols (default: ['http', 'https'])
 * @returns true if URL is safe
 */
export function isValidUrl(
  url: string,
  allowedProtocols: string[] = ['http', 'https']
): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol.replace(':', ''))) {
      return false;
    }
    
    // Block localhost and private IPs (for SSRF protection)
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

