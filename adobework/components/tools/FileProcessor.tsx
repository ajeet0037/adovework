'use client';

import React from 'react';
import { UploadedFile, ProcessingResult } from '@/types/file';
import { Tool } from '@/types/tool';
import { ProgressBar, ProgressStatus } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { triggerDownload } from '@/lib/utils/download';

export interface FileProcessorProps {
  /** The tool configuration */
  tool: Tool;
  /** Array of uploaded files */
  files: UploadedFile[];
  /** Callback to process files */
  onProcess: () => Promise<ProcessingResult>;
  /** Callback when a file is removed */
  onRemoveFile?: (fileId: string) => void;
  /** Callback to clear all files */
  onClearFiles?: () => void;
  /** Whether processing is in progress */
  isProcessing?: boolean;
  /** The processing result (if completed) */
  result?: ProcessingResult | null;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get the appropriate status for the progress bar
 */
function getProgressStatus(file: UploadedFile): ProgressStatus {
  switch (file.status) {
    case 'pending':
      return 'idle';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}

/**
 * Get file icon based on file type
 */
function getFileIcon(type: string): React.ReactNode {
  const isPdf = type === 'application/pdf' || type.includes('pdf');
  const isImage = type.startsWith('image/');
  const isWord = type.includes('word') || type.includes('document');
  const isExcel = type.includes('excel') || type.includes('spreadsheet');
  const isPpt = type.includes('presentation') || type.includes('powerpoint');

  const iconClass = 'w-8 h-8';

  if (isPdf) {
    return (
      <svg className={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13H10v4H8.5v-4zm2.5 0h1.5v4H11v-4zm2.5 0H15v4h-1.5v-4z"/>
      </svg>
    );
  }

  if (isImage) {
    return (
      <svg className={`${iconClass} text-green-500`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
    );
  }

  if (isWord) {
    return (
      <svg className={`${iconClass} text-blue-600`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM7 17l1.5-6h1l1 4 1-4h1l1.5 6h-1l-1-4-1 4h-1l-1-4-1 4H7z"/>
      </svg>
    );
  }

  if (isExcel) {
    return (
      <svg className={`${iconClass} text-green-600`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h2v2H8v-2zm0 3h2v2H8v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2z"/>
      </svg>
    );
  }

  if (isPpt) {
    return (
      <svg className={`${iconClass} text-orange-500`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM9 13h3c1.1 0 2 .9 2 2s-.9 2-2 2h-2v2H9v-6zm1 3h2c.55 0 1-.45 1-1s-.45-1-1-1h-2v2z"/>
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className={`${iconClass} text-gray-400`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/>
    </svg>
  );
}


/**
 * FileProcessor component displays selected files with status,
 * shows progress during processing, and provides download on completion.
 * 
 * Requirements: 3.3, 3.4, 4.6
 */
export function FileProcessor({
  tool,
  files,
  onProcess,
  onRemoveFile,
  onClearFiles,
  isProcessing = false,
  result,
}: FileProcessorProps) {
  const hasFiles = files.length > 0;
  const allCompleted = files.every((f) => f.status === 'completed');
  const hasErrors = files.some((f) => f.status === 'error');
  const canProcess = hasFiles && !isProcessing && !allCompleted;

  // Calculate overall progress
  const overallProgress = files.length > 0
    ? files.reduce((sum, f) => sum + f.progress, 0) / files.length
    : 0;

  const handleDownload = () => {
    if (result?.file && result?.filename) {
      triggerDownload({
        blob: result.file,
        filename: result.filename,
      });
    }
  };

  if (!hasFiles) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {/* File List */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {files.map((file) => (
          <div
            key={file.id}
            className="p-4 flex items-center gap-4"
          >
            {/* File Icon */}
            <div className="flex-shrink-0">
              {getFileIcon(file.type)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
              
              {/* Progress Bar for individual file */}
              {(file.status === 'processing' || file.status === 'completed' || file.status === 'error') && (
                <div className="mt-2">
                  <ProgressBar
                    progress={file.progress}
                    status={getProgressStatus(file)}
                    message={file.error}
                    showPercentage={file.status === 'processing'}
                  />
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              {file.status === 'pending' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Ready
                </span>
              )}
              {file.status === 'processing' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Processing
                </span>
              )}
              {file.status === 'completed' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Done
                </span>
              )}
              {file.status === 'error' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Error
                </span>
              )}
            </div>

            {/* Remove Button */}
            {onRemoveFile && file.status !== 'processing' && (
              <button
                type="button"
                onClick={() => onRemoveFile(file.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Overall Progress (for multiple files) */}
      {files.length > 1 && isProcessing && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Overall Progress
          </p>
          <ProgressBar
            progress={overallProgress}
            status="processing"
            showPercentage={true}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Process Button */}
        {canProcess && (
          <Button
            variant="primary"
            size="lg"
            onClick={onProcess}
            loading={isProcessing}
            disabled={isProcessing}
          >
            {tool.processingLocation === 'client' ? 'Process' : 'Convert'} {files.length > 1 ? 'Files' : 'File'}
          </Button>
        )}

        {/* Download Button */}
        {result?.success && result?.file && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download {tool.outputFormat.replace('.', '').toUpperCase()}
          </Button>
        )}

        {/* Clear Button */}
        {onClearFiles && !isProcessing && (
          <Button
            variant="outline"
            size="lg"
            onClick={onClearFiles}
          >
            {allCompleted || hasErrors ? 'Start Over' : 'Clear Files'}
          </Button>
        )}
      </div>

      {/* Error Message */}
      {result && !result.success && result.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Processing Error</h4>
              <p className="mt-1 text-sm text-red-700">{result.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {result?.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="status">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-800">Processing Complete!</h4>
              <p className="mt-1 text-sm text-green-700">
                Your file is ready for download. Click the download button above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <p className="text-xs text-gray-500 text-center">
        🔒 Your files are processed securely and automatically deleted within 1 hour.
      </p>
    </div>
  );
}

export default FileProcessor;
