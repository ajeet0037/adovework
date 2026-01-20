'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback UI
export interface ErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  description = 'We encountered an unexpected error. Please try again.',
}) => (
  <div 
    className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"
    role="alert"
    aria-live="assertive"
  >
    <div className="w-16 h-16 mb-6 text-red-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
    
    <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-600 mb-6 max-w-md">{description}</p>
    
    {process.env.NODE_ENV === 'development' && error && (
      <details className="mb-6 text-left w-full max-w-lg">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          Error details
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs text-red-600 overflow-auto">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
    
    {onRetry && (
      <Button onClick={onRetry} variant="primary">
        Try Again
      </Button>
    )}
  </div>
);

// Tool-specific error fallback
export const ToolErrorFallback: React.FC<ErrorFallbackProps & { toolName?: string }> = ({
  error,
  onRetry,
  toolName,
}) => (
  <ErrorFallback
    error={error}
    onRetry={onRetry}
    title={toolName ? `${toolName} encountered an error` : 'Tool error'}
    description="There was a problem processing your file. Please try again or use a different file."
  />
);

// File processing error fallback
export const FileProcessingErrorFallback: React.FC<{
  error?: Error | null;
  onRetry?: () => void;
  fileName?: string;
}> = ({ error, onRetry, fileName }) => (
  <div 
    className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    role="alert"
    aria-live="assertive"
  >
    <div className="w-12 h-12 mx-auto mb-4 text-red-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    
    <h3 className="text-lg font-semibold text-red-800 mb-2">
      Failed to process {fileName ? `"${fileName}"` : 'file'}
    </h3>
    <p className="text-red-600 text-sm mb-4">
      {error?.message || 'An unexpected error occurred during file processing.'}
    </p>
    
    {onRetry && (
      <Button onClick={onRetry} variant="outline" size="sm">
        Try Again
      </Button>
    )}
  </div>
);

export default ErrorBoundary;
