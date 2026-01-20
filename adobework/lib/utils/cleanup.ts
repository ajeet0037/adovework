/**
 * File Cleanup Service
 * Tracks temporary files with timestamps and deletes files older than 1 hour
 * Requirements: 9.1, 9.2
 */

import fs from 'fs';
import path from 'path';

// Default cleanup threshold: 1 hour in milliseconds
const DEFAULT_CLEANUP_THRESHOLD_MS = 60 * 60 * 1000;

// Temp directory for file processing
const TEMP_DIR = process.env.TEMP_DIR || '/tmp/adobework';

export interface TrackedFile {
  filePath: string;
  createdAt: number; // Unix timestamp in milliseconds
  operationId: string;
}

export interface CleanupResult {
  deletedFiles: string[];
  failedFiles: string[];
  totalDeleted: number;
  totalFailed: number;
}

// In-memory tracking of temp files (for serverless environments)
// In production, this could be replaced with Redis or a database
const trackedFiles: Map<string, TrackedFile> = new Map();

/**
 * Get the temp directory path, creating it if it doesn't exist
 */
export function getTempDir(): string {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return TEMP_DIR;
}

/**
 * Register a file for tracking
 * @param filePath - Absolute path to the file
 * @param operationId - Unique identifier for the processing operation
 */
export function trackFile(filePath: string, operationId: string): void {
  trackedFiles.set(filePath, {
    filePath,
    createdAt: Date.now(),
    operationId,
  });
}

/**
 * Untrack a file (e.g., after successful download or manual cleanup)
 * @param filePath - Absolute path to the file
 */
export function untrackFile(filePath: string): void {
  trackedFiles.delete(filePath);
}

/**
 * Get all tracked files for a specific operation
 * @param operationId - Unique identifier for the processing operation
 */
export function getFilesForOperation(operationId: string): TrackedFile[] {
  return Array.from(trackedFiles.values()).filter(
    (file) => file.operationId === operationId
  );
}

/**
 * Delete a single file safely
 * @param filePath - Absolute path to the file
 * @returns true if deleted successfully, false otherwise
 */
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    untrackFile(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up all files for a specific operation
 * Used after processing completes (success or failure)
 * @param operationId - Unique identifier for the processing operation
 */
export function cleanupOperation(operationId: string): CleanupResult {
  const files = getFilesForOperation(operationId);
  const result: CleanupResult = {
    deletedFiles: [],
    failedFiles: [],
    totalDeleted: 0,
    totalFailed: 0,
  };

  for (const file of files) {
    if (deleteFile(file.filePath)) {
      result.deletedFiles.push(file.filePath);
      result.totalDeleted++;
    } else {
      result.failedFiles.push(file.filePath);
      result.totalFailed++;
    }
  }

  return result;
}

/**
 * Clean up files older than the specified threshold
 * @param thresholdMs - Age threshold in milliseconds (default: 1 hour)
 */
export function cleanupOldFiles(
  thresholdMs: number = DEFAULT_CLEANUP_THRESHOLD_MS
): CleanupResult {
  const now = Date.now();
  const result: CleanupResult = {
    deletedFiles: [],
    failedFiles: [],
    totalDeleted: 0,
    totalFailed: 0,
  };

  // Clean up tracked files
  for (const [filePath, file] of trackedFiles.entries()) {
    if (now - file.createdAt >= thresholdMs) {
      if (deleteFile(filePath)) {
        result.deletedFiles.push(filePath);
        result.totalDeleted++;
      } else {
        result.failedFiles.push(filePath);
        result.totalFailed++;
      }
    }
  }

  // Also scan the temp directory for any untracked files
  if (fs.existsSync(TEMP_DIR)) {
    try {
      const files = fs.readdirSync(TEMP_DIR);
      for (const file of files) {
        const filePath = path.join(TEMP_DIR, file);
        
        // Skip if already tracked (handled above)
        if (trackedFiles.has(filePath)) {
          continue;
        }

        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs >= thresholdMs) {
            if (deleteFile(filePath)) {
              result.deletedFiles.push(filePath);
              result.totalDeleted++;
            } else {
              result.failedFiles.push(filePath);
              result.totalFailed++;
            }
          }
        } catch {
          // Skip files we can't stat
        }
      }
    } catch {
      // Skip if we can't read the directory
    }
  }

  return result;
}

/**
 * Get all currently tracked files
 */
export function getTrackedFiles(): TrackedFile[] {
  return Array.from(trackedFiles.values());
}

/**
 * Clear all tracked files from memory (for testing)
 */
export function clearTrackedFiles(): void {
  trackedFiles.clear();
}

/**
 * Get the count of tracked files
 */
export function getTrackedFileCount(): number {
  return trackedFiles.size;
}
