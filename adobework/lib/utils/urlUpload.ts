/**
 * URL Upload utility for fetching images from URLs
 * Requirements: 11.3
 */

export interface UrlUploadResult {
  file: File;
  originalUrl: string;
}

export interface UrlUploadError {
  type: 'cors' | 'network' | 'invalid_url' | 'not_image' | 'too_large';
  message: string;
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract filename from URL
 */
export function getFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const filename = pathname.split('/').pop() || 'image';
    
    // If no extension, add .jpg as default
    if (!filename.includes('.')) {
      return `${filename}.jpg`;
    }
    
    return filename;
  } catch {
    return 'image.jpg';
  }
}

/**
 * Get MIME type from filename extension
 */
function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  };
  return mimeTypes[ext || ''] || 'image/jpeg';
}

/**
 * Fetch image from URL and convert to File object
 * Handles CORS by using a proxy if direct fetch fails
 */
export async function fetchImageFromUrl(
  url: string,
  maxSizeBytes: number = 50 * 1024 * 1024
): Promise<UrlUploadResult> {
  // Validate URL
  if (!isValidUrl(url)) {
    throw createUrlUploadError('invalid_url', 'Please enter a valid HTTP or HTTPS URL');
  }

  try {
    // Try direct fetch first
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw createUrlUploadError('network', `Failed to fetch image: ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw createUrlUploadError('not_image', 'The URL does not point to a valid image');
    }

    // Check content length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw createUrlUploadError(
        'too_large',
        `Image is too large. Maximum size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB`
      );
    }

    // Get the blob
    const blob = await response.blob();

    // Verify size after download
    if (blob.size > maxSizeBytes) {
      throw createUrlUploadError(
        'too_large',
        `Image is too large. Maximum size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB`
      );
    }

    // Create File object
    const filename = getFilenameFromUrl(url);
    const mimeType = blob.type || getMimeTypeFromFilename(filename);
    const file = new File([blob], filename, { type: mimeType });

    return {
      file,
      originalUrl: url,
    };
  } catch (error) {
    // Handle CORS errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw createUrlUploadError(
        'cors',
        'Unable to fetch image due to CORS restrictions. Try downloading the image and uploading it directly.'
      );
    }

    // Re-throw UrlUploadError
    if (isUrlUploadError(error)) {
      throw error;
    }

    // Generic error
    throw createUrlUploadError('network', 'Failed to fetch image from URL');
  }
}

/**
 * Create a UrlUploadError object
 */
function createUrlUploadError(type: UrlUploadError['type'], message: string): UrlUploadError {
  return { type, message };
}

/**
 * Type guard for UrlUploadError
 */
export function isUrlUploadError(error: unknown): error is UrlUploadError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    typeof (error as UrlUploadError).type === 'string' &&
    typeof (error as UrlUploadError).message === 'string'
  );
}
