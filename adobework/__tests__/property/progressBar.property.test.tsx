import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { ProgressBar, ProgressStatus } from '@/components/ui/ProgressBar';

/**
 * Feature: adobework, Property 2: Progress Bar Rendering
 * 
 * For any progress value between 0 and 100 (inclusive), the ProgressBar component
 * should render with the correct width percentage and appropriate status indicator.
 * 
 * Validates: Requirements 2.4
 */
describe('Feature: adobework, Property 2: Progress Bar Rendering', () => {
  const allStatuses: ProgressStatus[] = ['idle', 'uploading', 'processing', 'completed', 'error'];

  it('should render with correct aria-valuenow for any progress value between 0 and 100', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.constantFrom(...allStatuses),
        (progress, status) => {
          const { unmount } = render(<ProgressBar progress={progress} status={status} />);
          
          const progressbar = screen.getByRole('progressbar');
          const ariaValueNow = progressbar.getAttribute('aria-valuenow');
          
          // aria-valuenow should match the progress value
          const result = ariaValueNow === String(progress);
          
          unmount();
          return result;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clamp progress values below 0 to 0', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: -1 }),
        fc.constantFrom(...allStatuses),
        (progress, status) => {
          const { unmount } = render(<ProgressBar progress={progress} status={status} />);
          
          const progressbar = screen.getByRole('progressbar');
          const ariaValueNow = progressbar.getAttribute('aria-valuenow');
          
          // Negative values should be clamped to 0
          const result = ariaValueNow === '0';
          
          unmount();
          return result;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clamp progress values above 100 to 100', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 1000 }),
        fc.constantFrom(...allStatuses),
        (progress, status) => {
          const { unmount } = render(<ProgressBar progress={progress} status={status} />);
          
          const progressbar = screen.getByRole('progressbar');
          const ariaValueNow = progressbar.getAttribute('aria-valuenow');
          
          // Values above 100 should be clamped to 100
          const result = ariaValueNow === '100';
          
          unmount();
          return result;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have aria-valuemin of 0 and aria-valuemax of 100', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.constantFrom(...allStatuses),
        (progress, status) => {
          const { unmount } = render(<ProgressBar progress={progress} status={status} />);
          
          const progressbar = screen.getByRole('progressbar');
          const ariaValueMin = progressbar.getAttribute('aria-valuemin');
          const ariaValueMax = progressbar.getAttribute('aria-valuemax');
          
          const result = ariaValueMin === '0' && ariaValueMax === '100';
          
          unmount();
          return result;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set aria-busy to true only for uploading and processing statuses', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.constantFrom(...allStatuses),
        (progress, status) => {
          const { unmount } = render(<ProgressBar progress={progress} status={status} />);
          
          const progressbar = screen.getByRole('progressbar');
          const ariaBusy = progressbar.getAttribute('aria-busy');
          
          const shouldBeBusy = status === 'uploading' || status === 'processing';
          const result = ariaBusy === String(shouldBeBusy);
          
          unmount();
          return result;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display percentage text matching the clamped progress value', { timeout: 30000 }, () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 200 }),
        fc.constantFrom(...allStatuses),
        (progress, status) => {
          const { unmount } = render(<ProgressBar progress={progress} status={status} showPercentage={true} />);
          
          const clampedProgress = Math.min(100, Math.max(0, progress));
          const expectedText = `${Math.round(clampedProgress)}%`;
          
          // Find the percentage text
          const percentageElement = screen.getByText(expectedText);
          const result = percentageElement !== null;
          
          unmount();
          return result;
        }
      ),
      { numRuns: 100 }
    );
  });
});
