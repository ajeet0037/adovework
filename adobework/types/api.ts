/**
 * Type definitions for API responses
 * Ensures type safety across API routes
 */

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Python backend conversion response
 */
export interface ConversionResponse {
  success: boolean;
  file_url: string;
  filename: string;
  file_size?: number;
  pages?: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime?: number;
  environment?: string;
  error?: string;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  size: number;
  url?: string;
}

/**
 * Cleanup API response
 */
export interface CleanupResponse {
  success: boolean;
  filesDeleted: number;
  bytesFreed: number;
  message: string;
}

/**
 * Generic API response wrapper
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
