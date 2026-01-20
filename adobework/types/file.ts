// File-related type definitions
// Will be implemented in Task 2

export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer | File;
  status: FileStatus;
  progress: number;
  error?: string;
}

export interface ProcessingResult {
  success: boolean;
  file?: Blob;
  filename?: string;
  error?: string;
}
