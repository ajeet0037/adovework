'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  isCameraCaptureSupported,
  isMobileDevice,
  createCameraStream,
  stopCameraStream,
  capturePhotoFromVideo,
  isCameraCaptureError,
} from '@/lib/utils/cameraCapture';
import { Button } from './Button';

export interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose?: () => void;
  disabled?: boolean;
  className?: string;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'captured' | 'error';

/**
 * Camera Capture component for taking photos with device camera
 * Requirements: 11.4
 */
export function CameraCapture({
  onCapture,
  onClose,
  disabled = false,
  className = '',
}: CameraCaptureProps) {
  const [state, setState] = useState<CameraState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = isCameraCaptureSupported();
  const isMobile = isMobileDevice();

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (!isSupported || disabled) return;

    setState('requesting');
    setError(null);

    try {
      const stream = await createCameraStream(facingMode);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState('active');
    } catch (err) {
      if (isCameraCaptureError(err)) {
        setError(err.message);
      } else {
        setError('Failed to start camera');
      }
      setState('error');
    }
  }, [isSupported, disabled, facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState('idle');
    setCapturedImage(null);
    setCapturedFile(null);
  }, []);

  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);

    if (state === 'active') {
      stopCamera();
      // Small delay before restarting with new facing mode
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [facingMode, state, stopCamera, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || state !== 'active') return;

    try {
      const result = capturePhotoFromVideo(videoRef.current);
      setCapturedImage(result.dataUrl);
      setCapturedFile(result.file);
      setState('captured');
      
      // Stop the camera stream after capture
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
        streamRef.current = null;
      }
    } catch (err) {
      if (isCameraCaptureError(err)) {
        setError(err.message);
      } else {
        setError('Failed to capture photo');
      }
    }
  }, [state]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCapturedFile(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
      stopCamera();
      onClose?.();
    }
  }, [capturedFile, onCapture, stopCamera, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose?.();
  }, [stopCamera, onClose]);

  // Don't render if camera is not supported
  if (!isSupported) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <p className="text-gray-500 text-sm">
          Camera capture is not supported on this device
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Preview / Captured Image */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <svg
              className="w-16 h-16 mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-gray-400">Click &quot;Start Camera&quot; to begin</p>
          </div>
        )}

        {state === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
            <p className="text-gray-300">Requesting camera access...</p>
          </div>
        )}

        {(state === 'active' || state === 'captured') && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${state === 'captured' ? 'hidden' : ''}`}
            />
            {state === 'captured' && capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}
          </>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            <svg
              className="w-12 h-12 mb-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Camera switch button (mobile only) */}
        {state === 'active' && isMobile && (
          <button
            onClick={switchCamera}
            className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            aria-label="Switch camera"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {state === 'idle' && (
          <>
            <Button onClick={startCamera} disabled={disabled}>
              📷 Start Camera
            </Button>
            {onClose && (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
          </>
        )}

        {state === 'requesting' && (
          <Button disabled loading>
            Starting...
          </Button>
        )}

        {state === 'active' && (
          <>
            <Button onClick={capturePhoto} className="flex-1">
              📸 Capture Photo
            </Button>
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
          </>
        )}

        {state === 'captured' && (
          <>
            <Button onClick={confirmCapture} className="flex-1">
              ✓ Use Photo
            </Button>
            <Button variant="outline" onClick={retakePhoto}>
              ↻ Retake
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <Button onClick={startCamera}>
              Try Again
            </Button>
            {onClose && (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CameraCapture;
