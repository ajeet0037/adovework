// Batch image processing utility

import { BatchJob, ImageFormat, ResizeOptions, CompressOptions } from './types';
import { resizeImage } from './resize';
import { compressImage, compressToTargetSize, smartCompress } from './compress';
import { convertImage } from './convert';

// Re-export BatchJob for external use
export type { BatchJob };

export type BatchOperation = 'resize' | 'compress' | 'convert';

export interface BatchResizeSettings {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  quality: number;
}

export interface BatchCompressSettings {
  mode: 'smart' | 'quality' | 'target';
  quality?: number;
  targetSize?: number;
  format: ImageFormat;
}

export interface BatchConvertSettings {
  format: ImageFormat;
  quality: number;
}

export type BatchSettings = BatchResizeSettings | BatchCompressSettings | BatchConvertSettings;

export interface BatchProcessorOptions {
  operation: BatchOperation;
  settings: BatchSettings;
}

export interface BatchProgress {
  jobs: BatchJob[];
  completed: number;
  total: number;
  currentFile: string | null;
}

/**
 * Generate unique ID for batch jobs
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load image from file and return canvas
 */
async function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process a single file with resize operation
 */
async function processResize(
  canvas: HTMLCanvasElement,
  settings: BatchResizeSettings
): Promise<Blob> {
  return resizeImage(canvas, {
    width: settings.width,
    height: settings.height,
    maintainAspectRatio: settings.maintainAspectRatio,
    resizeMode: 'stretch',
    quality: settings.quality,
  });
}

/**
 * Process a single file with compress operation
 */
async function processCompress(
  canvas: HTMLCanvasElement,
  settings: BatchCompressSettings
): Promise<Blob> {
  switch (settings.mode) {
    case 'smart':
      return smartCompress(canvas, settings.format);
    case 'quality':
      return compressImage(canvas, {
        quality: settings.quality || 0.8,
        format: settings.format,
      });
    case 'target':
      return compressToTargetSize(
        canvas,
        (settings.targetSize || 500) * 1024,
        settings.format
      );
    default:
      return smartCompress(canvas, settings.format);
  }
}

/**
 * Process a single file with convert operation
 */
async function processConvert(
  canvas: HTMLCanvasElement,
  settings: BatchConvertSettings
): Promise<Blob> {
  return convertImage(canvas, settings.format, settings.quality);
}

/**
 * Process a single batch job
 */
async function processJob(
  job: BatchJob,
  options: BatchProcessorOptions,
  onProgress: (progress: number) => void
): Promise<Blob> {
  onProgress(10);
  
  const canvas = await loadImageToCanvas(job.file);
  onProgress(40);
  
  let result: Blob;
  
  switch (options.operation) {
    case 'resize':
      result = await processResize(canvas, options.settings as BatchResizeSettings);
      break;
    case 'compress':
      result = await processCompress(canvas, options.settings as BatchCompressSettings);
      break;
    case 'convert':
      result = await processConvert(canvas, options.settings as BatchConvertSettings);
      break;
    default:
      throw new Error(`Unknown operation: ${options.operation}`);
  }
  
  onProgress(100);
  return result;
}

/**
 * Create initial batch jobs from files
 */
export function createBatchJobs(files: File[]): BatchJob[] {
  return files.map((file) => ({
    id: generateJobId(),
    file,
    status: 'pending' as const,
    progress: 0,
  }));
}

/**
 * Process a batch of files
 */
export async function processBatch(
  files: File[],
  options: BatchProcessorOptions,
  onProgress: (progress: BatchProgress) => void
): Promise<BatchJob[]> {
  const jobs = createBatchJobs(files);
  
  // Initial progress callback
  onProgress({
    jobs: [...jobs],
    completed: 0,
    total: jobs.length,
    currentFile: null,
  });
  
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    
    // Update status to processing
    job.status = 'processing';
    job.progress = 0;
    
    onProgress({
      jobs: [...jobs],
      completed: i,
      total: jobs.length,
      currentFile: job.file.name,
    });
    
    try {
      const result = await processJob(job, options, (progress) => {
        job.progress = progress;
        onProgress({
          jobs: [...jobs],
          completed: i,
          total: jobs.length,
          currentFile: job.file.name,
        });
      });
      
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
    } catch (error) {
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    onProgress({
      jobs: [...jobs],
      completed: i + 1,
      total: jobs.length,
      currentFile: i + 1 < jobs.length ? jobs[i + 1].file.name : null,
    });
  }
  
  return jobs;
}

/**
 * Get output filename for a batch job with auto-rename
 * Requirements: 11.8
 */
export function getBatchOutputFilename(
  originalName: string,
  operation: BatchOperation,
  settings: BatchSettings
): string {
  const baseName = originalName.replace(/\.[^.]+$/, '');
  
  switch (operation) {
    case 'resize': {
      const resizeSettings = settings as BatchResizeSettings;
      return `${baseName}_resized_${resizeSettings.width}x${resizeSettings.height}.jpg`;
    }
    case 'compress': {
      const compressSettings = settings as BatchCompressSettings;
      const ext = compressSettings.format === 'jpeg' ? 'jpg' : compressSettings.format;
      return `${baseName}_compressed.${ext}`;
    }
    case 'convert': {
      const convertSettings = settings as BatchConvertSettings;
      const ext = convertSettings.format === 'jpeg' ? 'jpg' : convertSettings.format;
      return `${baseName}_converted.${ext}`;
    }
    default:
      return `${baseName}_processed.jpg`;
  }
}

/**
 * Calculate batch statistics
 */
export function calculateBatchStats(jobs: BatchJob[]): {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  totalOriginalSize: number;
  totalResultSize: number;
} {
  const stats = {
    total: jobs.length,
    completed: 0,
    failed: 0,
    pending: 0,
    processing: 0,
    totalOriginalSize: 0,
    totalResultSize: 0,
  };
  
  for (const job of jobs) {
    stats.totalOriginalSize += job.file.size;
    
    switch (job.status) {
      case 'completed':
        stats.completed++;
        if (job.result) {
          stats.totalResultSize += job.result.size;
        }
        break;
      case 'error':
        stats.failed++;
        break;
      case 'pending':
        stats.pending++;
        break;
      case 'processing':
        stats.processing++;
        break;
    }
  }
  
  return stats;
}

/**
 * Check if all jobs are complete (either completed or failed)
 */
export function isBatchComplete(jobs: BatchJob[]): boolean {
  return jobs.every((job) => job.status === 'completed' || job.status === 'error');
}

/**
 * Get successful jobs only
 */
export function getSuccessfulJobs(jobs: BatchJob[]): BatchJob[] {
  return jobs.filter((job) => job.status === 'completed' && job.result);
}

/**
 * Get failed jobs only
 */
export function getFailedJobs(jobs: BatchJob[]): BatchJob[] {
  return jobs.filter((job) => job.status === 'error');
}
