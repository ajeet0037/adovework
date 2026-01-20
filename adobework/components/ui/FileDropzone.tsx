'use client';

import React, { useCallback, useState, useRef } from 'react';
import { validateFile, validateFiles, FileValidationResult } from '@/lib/utils/fileValidation';

export interface FileDropzoneProps {
  acceptedFormats: string[];
  maxFileSize: number;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * FileDropzone component for drag-and-drop file uploads
 * Supports single and multi-file modes with validation
 */
export function FileDropzone({
  acceptedFormats,
  maxFileSize,
  maxFiles = 1,
  onFilesSelected,
  disabled = false,
  className = '',
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatAcceptString = acceptedFormats.join(',');
  const isMultiple = maxFiles > 1;

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      
      // Validate files
      const validationResult = validateFiles(fileArray, {
        acceptedFormats,
        maxFileSize,
        maxFiles,
      });

      if (!validationResult.valid) {
        setValidationErrors(validationResult.errors);
        return;
      }

      // Clear any previous errors
      setValidationErrors([]);
      
      // Pass valid files to parent
      onFilesSelected(fileArray);
    },
    [acceptedFormats, maxFileSize, maxFiles, onFilesSelected]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      const { files } = e.dataTransfer;
      handleFiles(files);
    },
    [disabled, handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
  };

  const formatsDisplay = acceptedFormats
    .map((f) => f.toUpperCase().replace('.', ''))
    .join(', ');

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Drop zone for ${formatsDisplay} files`}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[200px] p-8
          border-2 border-dashed rounded-xl
          transition-all duration-200 ease-in-out
          ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              : isDragActive
              ? 'border-primary-500 bg-primary-50 scale-[1.02]'
              : 'border-gray-300 bg-white hover:border-primary-400 hover:bg-gray-50 cursor-pointer'
          }
        `}
      >
        {/* Upload Icon */}
        <div
          className={`
            mb-4 p-4 rounded-full
            ${isDragActive ? 'bg-primary-100' : 'bg-gray-100'}
            transition-colors duration-200
          `}
        >
          <svg
            className={`w-8 h-8 ${isDragActive ? 'text-primary-600' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* Text Content */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? (
              'Drop your files here'
            ) : (
              <>
                Drag & drop {isMultiple ? 'files' : 'a file'} here, or{' '}
                <span className="text-primary-600 hover:text-primary-700">browse</span>
              </>
            )}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Supports: {formatsDisplay}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Max size: {formatFileSize(maxFileSize)}
            {isMultiple && ` • Max files: ${maxFiles}`}
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={inputRef}
          type="file"
          accept={formatAcceptString}
          multiple={isMultiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">
                {validationErrors.length === 1 ? 'Validation Error' : 'Validation Errors'}
              </h4>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileDropzone;
