import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import {
  trackFile,
  untrackFile,
  deleteFile,
  cleanupOperation,
  cleanupOldFiles,
  getFilesForOperation,
  getTrackedFiles,
  clearTrackedFiles,
  getTempDir,
} from '@/lib/utils/cleanup';

/**
 * Feature: adobework, Property 14: File Cleanup After Processing
 * 
 * For any file processed by the server, after processing completes (success or failure),
 * no temporary files associated with that operation should remain in the temp directory.
 * 
 * Validates: Requirements 9.1, 9.2, 9.6
 */
describe('Feature: adobework, Property 14: File Cleanup After Processing', () => {
  const testTempDir = '/tmp/adobework-test';

  // Helper to create a real temp file for testing
  const createTempFile = (fileName: string): string => {
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { recursive: true });
    }
    const filePath = path.join(testTempDir, fileName);
    fs.writeFileSync(filePath, 'test content');
    return filePath;
  };

  // Clean up before and after each test
  beforeEach(() => {
    clearTrackedFiles();
    if (fs.existsSync(testTempDir)) {
      const files = fs.readdirSync(testTempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testTempDir, file));
      }
    }
  });

  afterEach(() => {
    clearTrackedFiles();
    if (fs.existsSync(testTempDir)) {
      const files = fs.readdirSync(testTempDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(testTempDir, file));
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  // Arbitrary for generating valid operation IDs
  const operationIdArb = fc.uuid();

  // Arbitrary for generating valid file names
  const fileNameArb = fc.string({ minLength: 1, maxLength: 20 })
    .filter(s => /^[a-zA-Z0-9]+$/.test(s))
    .map(s => `${s}.pdf`);

  it('should track and untrack files correctly', () => {
    fc.assert(
      fc.property(
        operationIdArb,
        fileNameArb,
        (operationId, fileName) => {
          const filePath = path.join(testTempDir, fileName);
          
          // Track the file
          trackFile(filePath, operationId);
          
          // Verify it's tracked
          const trackedBefore = getTrackedFiles();
          const isTracked = trackedBefore.some(f => f.filePath === filePath);
          
          // Untrack the file
          untrackFile(filePath);
          
          // Verify it's no longer tracked
          const trackedAfter = getTrackedFiles();
          const isStillTracked = trackedAfter.some(f => f.filePath === filePath);
          
          // Clean up for next iteration
          clearTrackedFiles();
          
          return isTracked && !isStillTracked;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should delete all files for an operation when cleanupOperation is called', () => {
    fc.assert(
      fc.property(
        operationIdArb,
        fc.array(fileNameArb, { minLength: 1, maxLength: 5 }),
        (operationId, fileNames) => {
          // Create unique file names to avoid collisions
          const uniqueFileNames = [...new Set(fileNames)];
          const filePaths: string[] = [];
          
          // Create and track files
          for (const fileName of uniqueFileNames) {
            const filePath = createTempFile(`${operationId.slice(0, 8)}-${fileName}`);
            trackFile(filePath, operationId);
            filePaths.push(filePath);
          }
          
          // Verify files exist
          const allExistBefore = filePaths.every(fp => fs.existsSync(fp));
          
          // Clean up the operation
          const result = cleanupOperation(operationId);
          
          // Verify all files are deleted
          const noneExistAfter = filePaths.every(fp => !fs.existsSync(fp));
          
          // Verify no files are tracked for this operation
          const remainingFiles = getFilesForOperation(operationId);
          
          // Clean up for next iteration
          clearTrackedFiles();
          
          return allExistBefore && noneExistAfter && remainingFiles.length === 0;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should only delete files for the specified operation', () => {
    fc.assert(
      fc.property(
        operationIdArb,
        operationIdArb,
        fileNameArb,
        fileNameArb,
        (operationId1, operationId2, fileName1, fileName2) => {
          // Skip if operation IDs are the same
          if (operationId1 === operationId2) return true;
          
          // Create files for two different operations
          const filePath1 = createTempFile(`op1-${fileName1}`);
          const filePath2 = createTempFile(`op2-${fileName2}`);
          
          trackFile(filePath1, operationId1);
          trackFile(filePath2, operationId2);
          
          // Clean up only operation 1
          cleanupOperation(operationId1);
          
          // Verify operation 1 file is deleted
          const file1Deleted = !fs.existsSync(filePath1);
          
          // Verify operation 2 file still exists
          const file2Exists = fs.existsSync(filePath2);
          
          // Clean up for next iteration
          deleteFile(filePath2);
          clearTrackedFiles();
          
          return file1Deleted && file2Exists;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should delete files older than threshold when cleanupOldFiles is called', () => {
    fc.assert(
      fc.property(
        operationIdArb,
        fileNameArb,
        (operationId, fileName) => {
          // Create and track a file
          const filePath = createTempFile(fileName);
          trackFile(filePath, operationId);
          
          // Verify file exists and is tracked
          const existsBefore = fs.existsSync(filePath);
          const trackedBefore = getTrackedFiles().some(f => f.filePath === filePath);
          
          // Clean up with 0ms threshold (all files are "old")
          const result = cleanupOldFiles(0);
          
          // Verify file is deleted
          const existsAfter = fs.existsSync(filePath);
          const trackedAfter = getTrackedFiles().some(f => f.filePath === filePath);
          
          // Clean up for next iteration
          clearTrackedFiles();
          
          return existsBefore && trackedBefore && !existsAfter && !trackedAfter;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not delete files newer than threshold', () => {
    fc.assert(
      fc.property(
        operationIdArb,
        fileNameArb,
        (operationId, fileName) => {
          // Create and track a file
          const filePath = createTempFile(fileName);
          trackFile(filePath, operationId);
          
          // Verify file exists
          const existsBefore = fs.existsSync(filePath);
          
          // Clean up with very large threshold (1 day)
          const oneDayMs = 24 * 60 * 60 * 1000;
          cleanupOldFiles(oneDayMs);
          
          // Verify file still exists (it's newer than 1 day)
          const existsAfter = fs.existsSync(filePath);
          
          // Clean up for next iteration
          deleteFile(filePath);
          clearTrackedFiles();
          
          return existsBefore && existsAfter;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle cleanup of non-existent files gracefully', () => {
    fc.assert(
      fc.property(
        operationIdArb,
        fileNameArb,
        (operationId, fileName) => {
          const filePath = path.join(testTempDir, fileName);
          
          // Track a file that doesn't exist
          trackFile(filePath, operationId);
          
          // Clean up should not throw
          const result = cleanupOperation(operationId);
          
          // Should report as deleted (file was tracked and removed from tracking)
          const noLongerTracked = getFilesForOperation(operationId).length === 0;
          
          // Clean up for next iteration
          clearTrackedFiles();
          
          return noLongerTracked;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return correct cleanup result counts', () => {
    fc.assert(
      fc.property(
        operationIdArb,
        fc.array(fileNameArb, { minLength: 1, maxLength: 5 }),
        (operationId, fileNames) => {
          // Create unique file names
          const uniqueFileNames = [...new Set(fileNames)];
          
          // Create and track files
          for (const fileName of uniqueFileNames) {
            const filePath = createTempFile(`${operationId.slice(0, 8)}-${fileName}`);
            trackFile(filePath, operationId);
          }
          
          // Clean up the operation
          const result = cleanupOperation(operationId);
          
          // Verify counts match
          const totalProcessed = result.totalDeleted + result.totalFailed;
          const countsMatch = totalProcessed === uniqueFileNames.length;
          const arraysMatch = result.deletedFiles.length === result.totalDeleted &&
                            result.failedFiles.length === result.totalFailed;
          
          // Clean up for next iteration
          clearTrackedFiles();
          
          return countsMatch && arraysMatch;
        }
      ),
      { numRuns: 50 }
    );
  });
});
