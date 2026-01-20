/**
 * Property-based tests for batch processing functionality
 * Feature: image-tools, Property 13: Batch Processing Consistency
 * Validates: Requirements 1.5, 4.6, 5.8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createBatchJobs,
  getBatchOutputFilename,
  calculateBatchStats,
  isBatchComplete,
  getSuccessfulJobs,
  getFailedJobs,
  BatchOperation,
  BatchResizeSettings,
  BatchCompressSettings,
  BatchConvertSettings,
} from '../../lib/image/batch';
import { ImageFormat, BatchJob } from '../../lib/image/types';

// Helper to create mock files
function createMockFile(name: string, size: number = 1024): File {
  const blob = new Blob(['x'.repeat(size)], { type: 'image/jpeg' });
  return new File([blob], name, { type: 'image/jpeg' });
}

// Arbitrary for image format
const imageFormatArb = fc.constantFrom<ImageFormat>('jpeg', 'png', 'webp');

// Arbitrary for batch operation
const batchOperationArb = fc.constantFrom<BatchOperation>('resize', 'compress', 'convert');

// Arbitrary for resize settings
const resizeSettingsArb = fc.record({
  width: fc.integer({ min: 1, max: 5000 }),
  height: fc.integer({ min: 1, max: 5000 }),
  maintainAspectRatio: fc.boolean(),
  quality: fc.float({ min: Math.fround(0.1), max: Math.fround(1), noNaN: true }),
});

// Arbitrary for compress settings
const compressSettingsArb = fc.record({
  mode: fc.constantFrom<'smart' | 'quality' | 'target'>('smart', 'quality', 'target'),
  quality: fc.float({ min: Math.fround(0.1), max: Math.fround(1), noNaN: true }),
  targetSize: fc.integer({ min: 10, max: 10000 }),
  format: imageFormatArb,
});

// Arbitrary for convert settings
const convertSettingsArb = fc.record({
  format: imageFormatArb,
  quality: fc.float({ min: Math.fround(0.1), max: Math.fround(1), noNaN: true }),
});

// Arbitrary for file names - avoid names that look like dimensions (NxN pattern)
const fileNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]{0,19}\.(jpg|jpeg|png|webp)$/);

describe('Feature: image-tools, Property 13: Batch Processing Consistency', () => {
  /**
   * Property 13: Batch Processing Consistency
   * For any batch of N images processed with the same settings, all N outputs
   * SHALL have consistent properties (same dimensions for resize, same format for convert).
   */

  describe('createBatchJobs', () => {
    it('creates jobs for all input files', () => {
      fc.assert(
        fc.property(
          fc.array(fileNameArb, { minLength: 1, maxLength: 20 }),
          (fileNames) => {
            const files = fileNames.map((name) => createMockFile(name));
            const jobs = createBatchJobs(files);

            // Should create one job per file
            expect(jobs.length).toBe(files.length);

            // All jobs should be pending
            jobs.forEach((job) => {
              expect(job.status).toBe('pending');
              expect(job.progress).toBe(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generates unique IDs for each job', () => {
      fc.assert(
        fc.property(
          fc.array(fileNameArb, { minLength: 2, maxLength: 20 }),
          (fileNames) => {
            const files = fileNames.map((name) => createMockFile(name));
            const jobs = createBatchJobs(files);

            const ids = jobs.map((job) => job.id);
            const uniqueIds = new Set(ids);

            // All IDs should be unique
            expect(uniqueIds.size).toBe(ids.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getBatchOutputFilename', () => {
    it('resize output filenames include dimensions', () => {
      fc.assert(
        fc.property(
          fileNameArb,
          resizeSettingsArb,
          (fileName, settings) => {
            const outputName = getBatchOutputFilename(fileName, 'resize', settings);

            // Should include dimensions in filename
            expect(outputName).toContain(`${settings.width}x${settings.height}`);
            // Should have .jpg extension
            expect(outputName).toMatch(/\.jpg$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('compress output filenames include _compressed suffix', () => {
      fc.assert(
        fc.property(
          fileNameArb,
          compressSettingsArb,
          (fileName, settings) => {
            const outputName = getBatchOutputFilename(fileName, 'compress', settings);

            // Should include _compressed suffix
            expect(outputName).toContain('_compressed');
            // Should have correct extension based on format
            const expectedExt = settings.format === 'jpeg' ? '.jpg' : `.${settings.format}`;
            expect(outputName).toMatch(new RegExp(`${expectedExt.replace('.', '\\.')}$`));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('convert output filenames have correct extension for target format', () => {
      fc.assert(
        fc.property(
          fileNameArb,
          convertSettingsArb,
          (fileName, settings) => {
            const outputName = getBatchOutputFilename(fileName, 'convert', settings);

            // Should have correct extension based on target format
            const expectedExt = settings.format === 'jpeg' ? '.jpg' : `.${settings.format}`;
            expect(outputName).toMatch(new RegExp(`${expectedExt.replace('.', '\\.')}$`));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('output filenames preserve base name', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
          batchOperationArb,
          (baseName, operation) => {
            const fileName = `${baseName}.jpg`;
            let settings: BatchResizeSettings | BatchCompressSettings | BatchConvertSettings;

            switch (operation) {
              case 'resize':
                settings = { width: 100, height: 100, maintainAspectRatio: false, quality: 0.9 };
                break;
              case 'compress':
                settings = { mode: 'smart', quality: 0.8, targetSize: 500, format: 'jpeg' };
                break;
              case 'convert':
                settings = { format: 'png', quality: 0.9 };
                break;
            }

            const outputName = getBatchOutputFilename(fileName, operation, settings);

            // Output should start with the base name
            expect(outputName.startsWith(baseName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('calculateBatchStats', () => {
    it('correctly counts job statuses', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom<BatchJob['status']>('pending', 'processing', 'completed', 'error'),
              fileSize: fc.integer({ min: 100, max: 10000 }),
              resultSize: fc.integer({ min: 50, max: 5000 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (jobConfigs) => {
            const jobs: BatchJob[] = jobConfigs.map((config, i) => ({
              id: `job_${i}`,
              file: createMockFile(`file_${i}.jpg`, config.fileSize),
              status: config.status,
              progress: config.status === 'completed' ? 100 : config.status === 'processing' ? 50 : 0,
              result: config.status === 'completed' ? new Blob(['x'.repeat(config.resultSize)]) : undefined,
              error: config.status === 'error' ? 'Test error' : undefined,
            }));

            const stats = calculateBatchStats(jobs);

            // Total should match job count
            expect(stats.total).toBe(jobs.length);

            // Status counts should add up to total
            expect(stats.completed + stats.failed + stats.pending + stats.processing).toBe(stats.total);

            // Individual counts should be correct
            expect(stats.completed).toBe(jobs.filter((j) => j.status === 'completed').length);
            expect(stats.failed).toBe(jobs.filter((j) => j.status === 'error').length);
            expect(stats.pending).toBe(jobs.filter((j) => j.status === 'pending').length);
            expect(stats.processing).toBe(jobs.filter((j) => j.status === 'processing').length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('correctly calculates total sizes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              fileSize: fc.integer({ min: 100, max: 10000 }),
              resultSize: fc.integer({ min: 50, max: 5000 }),
              completed: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (jobConfigs) => {
            const jobs: BatchJob[] = jobConfigs.map((config, i) => ({
              id: `job_${i}`,
              file: createMockFile(`file_${i}.jpg`, config.fileSize),
              status: config.completed ? 'completed' : 'pending',
              progress: config.completed ? 100 : 0,
              result: config.completed ? new Blob(['x'.repeat(config.resultSize)]) : undefined,
            }));

            const stats = calculateBatchStats(jobs);

            // Total original size should be sum of all file sizes
            const expectedOriginalSize = jobs.reduce((sum, job) => sum + job.file.size, 0);
            expect(stats.totalOriginalSize).toBe(expectedOriginalSize);

            // Total result size should be sum of completed job results
            const expectedResultSize = jobs
              .filter((j) => j.status === 'completed' && j.result)
              .reduce((sum, job) => sum + (job.result?.size || 0), 0);
            expect(stats.totalResultSize).toBe(expectedResultSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isBatchComplete', () => {
    it('returns true only when all jobs are completed or errored', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom<BatchJob['status']>('pending', 'processing', 'completed', 'error'),
            { minLength: 1, maxLength: 20 }
          ),
          (statuses) => {
            const jobs: BatchJob[] = statuses.map((status, i) => ({
              id: `job_${i}`,
              file: createMockFile(`file_${i}.jpg`),
              status,
              progress: status === 'completed' ? 100 : 0,
            }));

            const isComplete = isBatchComplete(jobs);
            const allFinished = statuses.every((s) => s === 'completed' || s === 'error');

            expect(isComplete).toBe(allFinished);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getSuccessfulJobs', () => {
    it('returns only completed jobs with results', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              status: fc.constantFrom<BatchJob['status']>('pending', 'processing', 'completed', 'error'),
              hasResult: fc.boolean(),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (jobConfigs) => {
            const jobs: BatchJob[] = jobConfigs.map((config, i) => ({
              id: `job_${i}`,
              file: createMockFile(`file_${i}.jpg`),
              status: config.status,
              progress: config.status === 'completed' ? 100 : 0,
              result: config.status === 'completed' && config.hasResult ? new Blob(['test']) : undefined,
            }));

            const successful = getSuccessfulJobs(jobs);

            // All returned jobs should be completed with results
            successful.forEach((job) => {
              expect(job.status).toBe('completed');
              expect(job.result).toBeDefined();
            });

            // Count should match expected
            const expectedCount = jobs.filter((j) => j.status === 'completed' && j.result).length;
            expect(successful.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getFailedJobs', () => {
    it('returns only jobs with error status', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom<BatchJob['status']>('pending', 'processing', 'completed', 'error'),
            { minLength: 1, maxLength: 20 }
          ),
          (statuses) => {
            const jobs: BatchJob[] = statuses.map((status, i) => ({
              id: `job_${i}`,
              file: createMockFile(`file_${i}.jpg`),
              status,
              progress: 0,
              error: status === 'error' ? 'Test error' : undefined,
            }));

            const failed = getFailedJobs(jobs);

            // All returned jobs should have error status
            failed.forEach((job) => {
              expect(job.status).toBe('error');
            });

            // Count should match expected
            const expectedCount = statuses.filter((s) => s === 'error').length;
            expect(failed.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Batch consistency properties', () => {
    it('all resize outputs have same target dimensions in filename', () => {
      fc.assert(
        fc.property(
          fc.array(fileNameArb, { minLength: 2, maxLength: 10 }),
          resizeSettingsArb,
          (fileNames, settings) => {
            const outputNames = fileNames.map((name) =>
              getBatchOutputFilename(name, 'resize', settings)
            );

            // All output names should contain the target dimensions
            const expectedDimension = `${settings.width}x${settings.height}`;
            outputNames.forEach((name) => {
              expect(name).toContain(expectedDimension);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all convert outputs have same format extension', () => {
      fc.assert(
        fc.property(
          fc.array(fileNameArb, { minLength: 2, maxLength: 10 }),
          convertSettingsArb,
          (fileNames, settings) => {
            const outputNames = fileNames.map((name) =>
              getBatchOutputFilename(name, 'convert', settings)
            );

            // Extract extensions from all output names
            const extensions = outputNames.map((name) => {
              const match = name.match(/\.([a-z]+)$/);
              return match ? match[1] : null;
            });

            // All extensions should be the same
            const firstExt = extensions[0];
            extensions.forEach((ext) => {
              expect(ext).toBe(firstExt);
            });

            // Extension should match target format
            const expectedExt = settings.format === 'jpeg' ? 'jpg' : settings.format;
            expect(firstExt).toBe(expectedExt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all compress outputs have same format extension', () => {
      fc.assert(
        fc.property(
          fc.array(fileNameArb, { minLength: 2, maxLength: 10 }),
          compressSettingsArb,
          (fileNames, settings) => {
            const outputNames = fileNames.map((name) =>
              getBatchOutputFilename(name, 'compress', settings)
            );

            // Extract extensions from all output names
            const extensions = outputNames.map((name) => {
              const match = name.match(/\.([a-z]+)$/);
              return match ? match[1] : null;
            });

            // All extensions should be the same
            const firstExt = extensions[0];
            extensions.forEach((ext) => {
              expect(ext).toBe(firstExt);
            });

            // Extension should match output format
            const expectedExt = settings.format === 'jpeg' ? 'jpg' : settings.format;
            expect(firstExt).toBe(expectedExt);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
