/**
 * File size and usage limits configuration
 * This is the single source of truth for all file limits
 * 
 * DO NOT duplicate these constants elsewhere.
 * Import from this file instead.
 */
export const FILE_LIMITS = {
  free: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFilesPerOperation: 10,
    dailyConversions: 20,
  },
  premium: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxFilesPerOperation: 100,
    dailyConversions: Infinity,
  },
} as const;

/**
 * Get file limits based on user tier
 */
export function getFileLimits(isPremium: boolean = false) {
  return isPremium ? FILE_LIMITS.premium : FILE_LIMITS.free;
}

/**
 * Get file size limit based on premium status
 */
export function getFileSizeLimit(isPremium: boolean): number {
  return isPremium ? FILE_LIMITS.premium.maxFileSize : FILE_LIMITS.free.maxFileSize;
}

/**
 * Get max files per operation based on premium status
 */
export function getMaxFilesLimit(isPremium: boolean): number {
  return isPremium 
    ? FILE_LIMITS.premium.maxFilesPerOperation 
    : FILE_LIMITS.free.maxFilesPerOperation;
}

/**
 * Get daily conversion limit based on premium status
 */
export function getDailyConversionLimit(isPremium: boolean): number {
  return isPremium 
    ? FILE_LIMITS.premium.dailyConversions 
    : FILE_LIMITS.free.dailyConversions;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
