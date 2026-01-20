'use client';

import { useState, useCallback } from 'react';
import { FileStatus, UploadedFile } from '@/types/file';

/**
 * Generate a unique ID for uploaded files
 */
function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convert a File object to an UploadedFile
 */
function fileToUploadedFile(file: File): UploadedFile {
  return {
    id: generateFileId(),
    name: file.name,
    size: file.size,
    type: file.type,
    data: file,
    status: 'pending',
    progress: 0,
  };
}

export interface UseFileUploadOptions {
  maxFiles?: number;
  onFilesChange?: (files: UploadedFile[]) => void;
}

export interface UseFileUploadReturn {
  files: UploadedFile[];
  addFiles: (newFiles: File[]) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  updateFileStatus: (fileId: string, status: FileStatus, error?: string) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  isProcessing: boolean;
  hasErrors: boolean;
  completedCount: number;
  totalCount: number;
}

/**
 * Custom hook for managing file upload state
 * Handles file addition, removal, status updates, and progress tracking
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { maxFiles = 1, onFilesChange } = options;
  const [files, setFiles] = useState<UploadedFile[]>([]);

  /**
   * Add new files to the upload queue
   */
  const addFiles = useCallback(
    (newFiles: File[]) => {
      setFiles((currentFiles) => {
        // Calculate how many files we can add
        const availableSlots = maxFiles - currentFiles.length;
        const filesToAdd = newFiles.slice(0, availableSlots);

        // Convert to UploadedFile objects
        const uploadedFiles = filesToAdd.map(fileToUploadedFile);
        const updatedFiles = [...currentFiles, ...uploadedFiles];

        // Notify parent of change
        if (onFilesChange) {
          onFilesChange(updatedFiles);
        }

        return updatedFiles;
      });
    },
    [maxFiles, onFilesChange]
  );

  /**
   * Remove a file from the upload queue
   */
  const removeFile = useCallback(
    (fileId: string) => {
      setFiles((currentFiles) => {
        const updatedFiles = currentFiles.filter((f) => f.id !== fileId);

        // Notify parent of change
        if (onFilesChange) {
          onFilesChange(updatedFiles);
        }

        return updatedFiles;
      });
    },
    [onFilesChange]
  );

  /**
   * Clear all files from the upload queue
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
    if (onFilesChange) {
      onFilesChange([]);
    }
  }, [onFilesChange]);

  /**
   * Update the status of a specific file
   */
  const updateFileStatus = useCallback(
    (fileId: string, status: FileStatus, error?: string) => {
      setFiles((currentFiles) => {
        const updatedFiles = currentFiles.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status,
                error,
                // Set progress to 100 if completed
                progress: status === 'completed' ? 100 : f.progress,
              }
            : f
        );

        // Notify parent of change
        if (onFilesChange) {
          onFilesChange(updatedFiles);
        }

        return updatedFiles;
      });
    },
    [onFilesChange]
  );

  /**
   * Update the progress of a specific file
   */
  const updateFileProgress = useCallback(
    (fileId: string, progress: number) => {
      setFiles((currentFiles) => {
        const updatedFiles = currentFiles.map((f) =>
          f.id === fileId
            ? {
                ...f,
                progress: Math.min(100, Math.max(0, progress)),
                // Update status to processing if progress > 0 and not completed/error
                status:
                  progress > 0 && f.status === 'pending'
                    ? 'processing'
                    : f.status,
              }
            : f
        );

        // Notify parent of change
        if (onFilesChange) {
          onFilesChange(updatedFiles);
        }

        return updatedFiles;
      });
    },
    [onFilesChange]
  );

  /**
   * Reorder files (for drag-and-drop reordering in merge operations)
   */
  const reorderFiles = useCallback(
    (fromIndex: number, toIndex: number) => {
      setFiles((currentFiles) => {
        if (
          fromIndex < 0 ||
          fromIndex >= currentFiles.length ||
          toIndex < 0 ||
          toIndex >= currentFiles.length
        ) {
          return currentFiles;
        }

        const updatedFiles = [...currentFiles];
        const [movedFile] = updatedFiles.splice(fromIndex, 1);
        updatedFiles.splice(toIndex, 0, movedFile);

        // Notify parent of change
        if (onFilesChange) {
          onFilesChange(updatedFiles);
        }

        return updatedFiles;
      });
    },
    [onFilesChange]
  );

  // Computed properties
  const isProcessing = files.some((f) => f.status === 'processing');
  const hasErrors = files.some((f) => f.status === 'error');
  const completedCount = files.filter((f) => f.status === 'completed').length;
  const totalCount = files.length;

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    updateFileStatus,
    updateFileProgress,
    reorderFiles,
    isProcessing,
    hasErrors,
    completedCount,
    totalCount,
  };
}

export default useFileUpload;
