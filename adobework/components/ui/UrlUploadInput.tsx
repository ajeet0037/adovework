'use client';

import React, { useState, useCallback } from 'react';
import { fetchImageFromUrl, isUrlUploadError, isValidUrl } from '@/lib/utils/urlUpload';
import { Button } from './Button';

export interface UrlUploadInputProps {
  onFileLoaded: (file: File) => void;
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * URL Upload Input component for fetching images from URLs
 * Requirements: 11.3
 */
export function UrlUploadInput({
  onFileLoaded,
  maxFileSize = 50 * 1024 * 1024,
  disabled = false,
  className = '',
}: UrlUploadInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchImageFromUrl(url.trim(), maxFileSize);
      onFileLoaded(result.file);
      setUrl('');
      setIsExpanded(false);
    } catch (err) {
      if (isUrlUploadError(err)) {
        setError(err.message);
      } else {
        setError('Failed to load image from URL');
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, maxFileSize, disabled, onFileLoaded]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  const isUrlValid = url.trim() && isValidUrl(url.trim());

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className={`
          flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <span>Or paste image URL</span>
      </button>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            disabled={disabled || isLoading}
            className={`
              w-full px-4 py-2 pr-10 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-red-300' : 'border-gray-300'}
            `}
          />
          {url && (
            <button
              type="button"
              onClick={() => {
                setUrl('');
                setError(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={!isUrlValid || isLoading || disabled}
          loading={isLoading}
          size="md"
        >
          {isLoading ? 'Loading...' : 'Load'}
        </Button>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setUrl('');
            setError(null);
          }}
          className="px-3 py-2 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Paste a direct link to an image (JPG, PNG, WebP, GIF)
      </p>
    </div>
  );
}

export default UrlUploadInput;
