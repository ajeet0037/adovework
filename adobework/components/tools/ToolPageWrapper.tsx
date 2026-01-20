'use client';

import React, { ReactNode, useCallback, useState } from 'react';
import { ErrorBoundary, ToolErrorFallback } from '@/components/ui/ErrorBoundary';
import { PageLoader } from '@/components/ui/Loading';

export interface ToolPageWrapperProps {
  children: ReactNode;
  toolName?: string;
  onError?: (error: Error) => void;
}

/**
 * ToolPageWrapper wraps tool pages with error boundary and loading states.
 * Provides fallback UI for errors and handles error recovery.
 * 
 * Requirements: 3.5
 */
export function ToolPageWrapper({
  children,
  toolName,
  onError,
}: ToolPageWrapperProps) {
  const [key, setKey] = useState(0);

  const handleReset = useCallback(() => {
    setKey(prev => prev + 1);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error(`Tool error in ${toolName || 'unknown tool'}:`, error);
    onError?.(error);
  }, [toolName, onError]);

  return (
    <ErrorBoundary
      key={key}
      onError={handleError}
      onReset={handleReset}
      fallback={
        <ToolErrorFallback
          toolName={toolName}
          onRetry={handleReset}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Suspense wrapper for tool pages with loading state
 */
export function ToolPageSuspense({
  children,
  loadingMessage = 'Loading tool...',
}: {
  children: ReactNode;
  loadingMessage?: string;
}) {
  return (
    <React.Suspense fallback={<PageLoader message={loadingMessage} />}>
      {children}
    </React.Suspense>
  );
}

/**
 * Combined wrapper with both error boundary and suspense
 */
export function ToolPageContainer({
  children,
  toolName,
  loadingMessage,
  onError,
}: ToolPageWrapperProps & { loadingMessage?: string }) {
  return (
    <ToolPageWrapper toolName={toolName} onError={onError}>
      <ToolPageSuspense loadingMessage={loadingMessage}>
        {children}
      </ToolPageSuspense>
    </ToolPageWrapper>
  );
}

export default ToolPageWrapper;
