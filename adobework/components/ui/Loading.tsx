'use client';

import React from 'react';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => (
  <svg
    className={`animate-spin text-primary-600 ${sizeStyles[size]} ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  overlay = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <LoadingSpinner size={size} />
      {text && (
        <p className="text-gray-600 text-sm font-medium">{text}</p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
        {content}
      </div>
    );
  }

  return content;
};

// Loading state for buttons
export const ButtonLoading: React.FC = () => (
  <LoadingSpinner size="sm" className="text-current" />
);

// Loading state for file processing
export const ProcessingLoader: React.FC<{ message?: string; progress?: number }> = ({
  message = 'Processing your file...',
  progress,
}) => (
  <div className="flex flex-col items-center justify-center p-8 gap-4">
    <div className="relative">
      <LoadingSpinner size="lg" />
      {progress !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-primary-600">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
    <p className="text-gray-600 font-medium">{message}</p>
  </div>
);

// Page loading state
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Loading size="lg" text={message} />
  </div>
);

export default Loading;
