'use client';

import React from 'react';

export type ProgressStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface ProgressBarProps {
  progress: number;
  status: ProgressStatus;
  message?: string;
  showPercentage?: boolean;
}

const statusStyles: Record<ProgressStatus, { bar: string; text: string }> = {
  idle: {
    bar: 'bg-gray-300',
    text: 'text-gray-600',
  },
  uploading: {
    bar: 'bg-primary-500',
    text: 'text-primary-600',
  },
  processing: {
    bar: 'bg-primary-500 animate-pulse',
    text: 'text-primary-600',
  },
  completed: {
    bar: 'bg-green-500',
    text: 'text-green-600',
  },
  error: {
    bar: 'bg-red-500',
    text: 'text-red-600',
  },
};

const statusLabels: Record<ProgressStatus, string> = {
  idle: 'Ready',
  uploading: 'Uploading',
  processing: 'Processing',
  completed: 'Completed',
  error: 'Error',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status,
  message,
  showPercentage = true,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const styles = statusStyles[status];
  const statusLabel = statusLabels[status];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className={`text-sm font-medium ${styles.text}`}>
          {message || statusLabel}
        </span>
        {showPercentage && (
          <span className={`text-sm font-medium ${styles.text}`}>
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${statusLabel}: ${Math.round(clampedProgress)}%`}
        aria-busy={status === 'uploading' || status === 'processing'}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${styles.bar}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
