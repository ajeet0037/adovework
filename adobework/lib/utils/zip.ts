// ZIP utility for batch downloads
// Requirements: 11.7

import JSZip from 'jszip';

export interface ZipFile {
  name: string;
  blob: Blob;
}

export interface ZipProgress {
  phase: 'adding' | 'compressing';
  current: number;
  total: number;
  percent: number;
  currentFile?: string;
}

/**
 * Create a ZIP file from multiple blobs with detailed progress tracking
 */
export async function createZipFromBlobs(
  files: ZipFile[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  
  // Add files to ZIP
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    zip.file(file.name, file.blob);
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 50));
    }
  }
  
  // Generate ZIP blob
  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent / 2));
      }
    }
  );
  
  return zipBlob;
}

/**
 * Create a ZIP file with detailed progress callback
 */
export async function createZipWithDetailedProgress(
  files: ZipFile[],
  onProgress?: (progress: ZipProgress) => void
): Promise<Blob> {
  const zip = new JSZip();
  
  // Add files to ZIP
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    zip.file(file.name, file.blob);
    
    if (onProgress) {
      onProgress({
        phase: 'adding',
        current: i + 1,
        total: files.length,
        percent: Math.round(((i + 1) / files.length) * 50),
        currentFile: file.name,
      });
    }
  }
  
  // Generate ZIP blob
  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => {
      if (onProgress) {
        onProgress({
          phase: 'compressing',
          current: Math.round(metadata.percent),
          total: 100,
          percent: 50 + Math.round(metadata.percent / 2),
          currentFile: metadata.currentFile || undefined,
        });
      }
    }
  );
  
  return zipBlob;
}

/**
 * Generate ZIP filename with timestamp
 */
export function generateZipFilename(prefix: string = 'batch'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.zip`;
}

/**
 * Generate descriptive ZIP filename based on operation
 */
export function generateOperationZipFilename(
  operation: string,
  fileCount: number
): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${operation}_${fileCount}_files_${timestamp}.zip`;
}

/**
 * Download a ZIP file
 */
export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculate estimated ZIP size (rough estimate)
 */
export function estimateZipSize(files: ZipFile[]): number {
  // Estimate ~70% compression ratio for images
  const totalSize = files.reduce((sum, file) => sum + file.blob.size, 0);
  return Math.round(totalSize * 0.7);
}

/**
 * Format file size for display
 */
export function formatZipFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
