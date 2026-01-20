/**
 * Camera Capture utility for capturing photos from device camera
 * Requirements: 11.4
 */

export interface CameraCaptureResult {
  file: File;
  dataUrl: string;
}

export interface CameraCaptureError {
  type: 'not_supported' | 'permission_denied' | 'no_camera' | 'capture_failed';
  message: string;
}

/**
 * Check if camera capture is supported on this device
 */
export function isCameraCaptureSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
}

/**
 * Check if the device is likely a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (!isCameraCaptureSupported()) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Stop all tracks immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}

/**
 * Get available video input devices (cameras)
 */
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  if (!isCameraCaptureSupported()) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch {
    return [];
  }
}

/**
 * Create a camera stream
 */
export async function createCameraStream(
  facingMode: 'user' | 'environment' = 'environment'
): Promise<MediaStream> {
  if (!isCameraCaptureSupported()) {
    throw createCameraCaptureError(
      'not_supported',
      'Camera capture is not supported on this device'
    );
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    return stream;
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw createCameraCaptureError(
          'permission_denied',
          'Camera permission was denied. Please allow camera access in your browser settings.'
        );
      }
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw createCameraCaptureError(
          'no_camera',
          'No camera found on this device'
        );
      }
    }
    throw createCameraCaptureError(
      'capture_failed',
      'Failed to access camera'
    );
  }
}

/**
 * Stop a camera stream
 */
export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

/**
 * Capture a photo from a video element
 */
export function capturePhotoFromVideo(
  video: HTMLVideoElement,
  quality: number = 0.92
): CameraCaptureResult {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw createCameraCaptureError('capture_failed', 'Failed to create canvas context');
  }

  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const blob = dataUrlToBlob(dataUrl);
  const filename = `camera_${Date.now()}.jpg`;
  const file = new File([blob], filename, { type: 'image/jpeg' });

  return {
    file,
    dataUrl,
  };
}

/**
 * Convert data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Create a CameraCaptureError object
 */
function createCameraCaptureError(
  type: CameraCaptureError['type'],
  message: string
): CameraCaptureError {
  return { type, message };
}

/**
 * Type guard for CameraCaptureError
 */
export function isCameraCaptureError(error: unknown): error is CameraCaptureError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    typeof (error as CameraCaptureError).type === 'string' &&
    typeof (error as CameraCaptureError).message === 'string'
  );
}
