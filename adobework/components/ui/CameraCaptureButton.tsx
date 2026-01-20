'use client';

import React, { useState } from 'react';
import { isCameraCaptureSupported, isMobileDevice } from '@/lib/utils/cameraCapture';
import { CameraCapture } from './CameraCapture';

export interface CameraCaptureButtonProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Camera Capture Button - shows camera option on mobile devices
 * Requirements: 11.4
 */
export function CameraCaptureButton({
  onCapture,
  disabled = false,
  className = '',
}: CameraCaptureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isSupported = isCameraCaptureSupported();
  const isMobile = isMobileDevice();

  // Only show on mobile devices with camera support
  if (!isSupported || !isMobile) {
    return null;
  }

  const handleCapture = (file: File) => {
    onCapture(file);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
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
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Take a photo</span>
      </button>

      {/* Camera Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Take a Photo</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CameraCapture
              onCapture={handleCapture}
              onClose={() => setIsOpen(false)}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default CameraCaptureButton;
