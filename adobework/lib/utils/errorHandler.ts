/**
 * Unified error handling utilities for API routes
 * Provides consistent error responses and logging
 */

import { NextResponse } from 'next/server';
import { isProduction } from './env';

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: unknown;
}

/**
 * Known error types for better error handling
 */
export enum ErrorCode {
  // File errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  FILE_NOT_PROVIDED = 'FILE_NOT_PROVIDED',
  
  // Processing errors
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  TIMEOUT = 'TIMEOUT',
  
  // Security errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds the maximum limit',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type. Please upload a supported file format',
  [ErrorCode.FILE_CORRUPTED]: 'The file appears to be corrupted or invalid',
  [ErrorCode.FILE_NOT_PROVIDED]: 'No file provided',
  [ErrorCode.PROCESSING_FAILED]: 'Failed to process file. Please try again',
  [ErrorCode.CONVERSION_FAILED]: 'Conversion failed. Please try again',
  [ErrorCode.TIMEOUT]: 'Processing timed out. Please try with a smaller file',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
  [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred. Please try again later',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later',
};

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
  error: ErrorCode | string,
  statusCode: number = 500,
  details?: unknown
): NextResponse {
  const message = typeof error === 'string' && error in ErrorCode
    ? ERROR_MESSAGES[error as ErrorCode]
    : typeof error === 'string'
    ? error
    : ERROR_MESSAGES[error];

  const response: ApiError = {
    message,
    statusCode,
  };

  // Include error code if it's a known error
  if (error in ErrorCode) {
    response.code = error as string;
  }

  // Include details only in development
  if (!isProduction() && details) {
    response.details = details;
  }

  return NextResponse.json(
    { error: response.message, code: response.code },
    { status: statusCode }
  );
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error internally (in production, use proper logging service)
  if (!isProduction()) {
    console.error('API Error:', error);
  }

  // Handle known error types
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // File size errors
    if (message.includes('size') || message.includes('too large')) {
      return createErrorResponse(ErrorCode.FILE_TOO_LARGE, 400);
    }

    // File type errors
    if (message.includes('invalid') && (message.includes('type') || message.includes('format'))) {
      return createErrorResponse(ErrorCode.INVALID_FILE_TYPE, 400);
    }

    // Corrupted file errors
    if (message.includes('corrupt') || message.includes('invalid') || message.includes('parse')) {
      return createErrorResponse(ErrorCode.FILE_CORRUPTED, 400);
    }

    // Password protected errors
    if (message.includes('password')) {
      return createErrorResponse(
        'This file is password protected. Please unlock it first.',
        400
      );
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return createErrorResponse(ErrorCode.TIMEOUT, 408);
    }
  }

  // Generic error response
  return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500);
}

/**
 * Validate file in API route
 */
export function validateApiFile(
  file: File | null,
  acceptedTypes: string[],
  maxSize: number
): { valid: boolean; error?: NextResponse } {
  if (!file) {
    return {
      valid: false,
      error: createErrorResponse(ErrorCode.FILE_NOT_PROVIDED, 400),
    };
  }

  // Check file type
  const isValidType = acceptedTypes.some(type => 
    file.type === type || 
    file.name.toLowerCase().endsWith(type.toLowerCase())
  );

  if (!isValidType) {
    return {
      valid: false,
      error: createErrorResponse(ErrorCode.INVALID_FILE_TYPE, 400),
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: createErrorResponse(ErrorCode.FILE_TOO_LARGE, 400),
    };
  }

  // Check for empty files
  if (file.size === 0) {
    return {
      valid: false,
      error: createErrorResponse('File is empty', 400),
    };
  }

  return { valid: true };
}

/**
 * Safe error logging (only in development or with proper logger)
 */
export function logError(
  error: unknown,
  context?: string,
  metadata?: Record<string, unknown>
): void {
  if (!isProduction()) {
    console.error(`[${context || 'Error'}]`, error, metadata || '');
  }
  
  // In production, send to logging service (Sentry, DataDog, etc.)
  // Example:
  // if (typeof window === 'undefined' && process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: metadata, tags: { context } });
  // }
}

