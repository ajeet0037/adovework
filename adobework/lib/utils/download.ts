/**
 * Download utility functions for triggering file downloads
 * Requirements: 3.4, 11.8
 */

/**
 * Operation suffixes for auto-rename
 */
export const OPERATION_SUFFIXES: Record<string, string> = {
  resize: '_resized',
  compress: '_compressed',
  convert: '_converted',
  crop: '_cropped',
  rotate: '_rotated',
  flip: '_flipped',
  filter: '_filtered',
  upscale: '_upscaled',
  background_remove: '_nobg',
  passport: '_passport',
  watermark: '_watermarked',
  merge: '_merged',
  split: '_split',
  protect: '_protected',
  unlock: '_unlocked',
};

/**
 * Options for triggering a download
 */
export interface DownloadOptions {
  /** The blob data to download */
  blob: Blob;
  /** The filename for the downloaded file */
  filename: string;
}

/**
 * Options for auto-rename
 */
export interface AutoRenameOptions {
  /** Original filename */
  originalFilename: string;
  /** Operation performed (e.g., 'resize', 'compress') */
  operation: string;
  /** Output format extension (e.g., 'jpg', 'png') */
  outputFormat?: string;
  /** Additional suffix details (e.g., dimensions '800x600') */
  details?: string;
}

/**
 * Trigger a file download from a Blob
 * Creates a temporary URL and triggers the browser's download mechanism
 * 
 * @param options - Download options containing blob and filename
 */
export function triggerDownload({ blob, filename }: DownloadOptions): void {
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Generate an appropriate filename for a converted file
 * 
 * @param originalFilename - The original filename
 * @param outputFormat - The output format extension (e.g., '.docx', '.pdf')
 * @returns The new filename with the correct extension
 */
export function generateOutputFilename(
  originalFilename: string,
  outputFormat: string
): string {
  // Remove the original extension
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const baseName = lastDotIndex > 0 
    ? originalFilename.substring(0, lastDotIndex) 
    : originalFilename;

  // Ensure the output format starts with a dot
  const extension = outputFormat.startsWith('.') 
    ? outputFormat 
    : `.${outputFormat}`;

  return `${baseName}${extension}`;
}

/**
 * Generate a filename for merged PDF files
 * 
 * @param fileCount - Number of files being merged
 * @returns A descriptive filename for the merged PDF
 */
export function generateMergedFilename(fileCount: number): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `merged_${fileCount}_files_${timestamp}.pdf`;
}

/**
 * Generate a filename for compressed PDF files
 * 
 * @param originalFilename - The original filename
 * @returns A filename indicating compression
 */
export function generateCompressedFilename(originalFilename: string): string {
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const baseName = lastDotIndex > 0 
    ? originalFilename.substring(0, lastDotIndex) 
    : originalFilename;

  return `${baseName}_compressed.pdf`;
}

/**
 * Generate auto-renamed filename with descriptive suffix
 * Requirements: 11.8
 * 
 * @param options - Auto-rename options
 * @returns A descriptive filename with operation suffix
 */
export function generateAutoRenamedFilename(options: AutoRenameOptions): string {
  const { originalFilename, operation, outputFormat, details } = options;
  
  // Extract base name and original extension
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const baseName = lastDotIndex > 0 
    ? originalFilename.substring(0, lastDotIndex) 
    : originalFilename;
  const originalExt = lastDotIndex > 0 
    ? originalFilename.substring(lastDotIndex) 
    : '';
  
  // Get operation suffix
  const operationSuffix = OPERATION_SUFFIXES[operation.toLowerCase()] || `_${operation}`;
  
  // Build the suffix with optional details
  const suffix = details ? `${operationSuffix}_${details}` : operationSuffix;
  
  // Determine final extension
  let finalExt = originalExt;
  if (outputFormat) {
    finalExt = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`;
  }
  
  return `${baseName}${suffix}${finalExt}`;
}

/**
 * Generate filename for image operations with dimensions
 * 
 * @param originalFilename - Original filename
 * @param operation - Operation type
 * @param width - Output width
 * @param height - Output height
 * @param format - Output format
 * @returns Descriptive filename
 */
export function generateImageOperationFilename(
  originalFilename: string,
  operation: string,
  width?: number,
  height?: number,
  format?: string
): string {
  const details = width && height ? `${width}x${height}` : undefined;
  return generateAutoRenamedFilename({
    originalFilename,
    operation,
    outputFormat: format,
    details,
  });
}

/**
 * Sanitize filename by removing invalid characters
 * 
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

/**
 * Ensure unique filename by adding number suffix if needed
 * 
 * @param filename - The desired filename
 * @param existingNames - Set of existing filenames
 * @returns Unique filename
 */
export function ensureUniqueFilename(
  filename: string,
  existingNames: Set<string>
): string {
  if (!existingNames.has(filename)) {
    return filename;
  }
  
  const lastDotIndex = filename.lastIndexOf('.');
  const baseName = lastDotIndex > 0 
    ? filename.substring(0, lastDotIndex) 
    : filename;
  const ext = lastDotIndex > 0 
    ? filename.substring(lastDotIndex) 
    : '';
  
  let counter = 1;
  let newFilename = `${baseName}_${counter}${ext}`;
  
  while (existingNames.has(newFilename)) {
    counter++;
    newFilename = `${baseName}_${counter}${ext}`;
  }
  
  return newFilename;
}

/**
 * Download a file from a ProcessingResult
 * Convenience function that combines result handling with download
 * 
 * @param result - The processing result containing the file blob
 * @param fallbackFilename - Fallback filename if result doesn't include one
 */
export function downloadProcessingResult(
  result: { file?: Blob; filename?: string },
  fallbackFilename: string
): void {
  if (!result.file) {
    throw new Error('No file available for download');
  }

  triggerDownload({
    blob: result.file,
    filename: result.filename || fallbackFilename,
  });
}
