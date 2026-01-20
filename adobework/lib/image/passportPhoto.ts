// Passport photo generator utility
// Face detection and auto-crop for passport-compliant photos

export interface PassportPhotoPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  widthMm: number;
  heightMm: number;
  dpi: number;
  faceHeightPercent: number; // Face should be this % of total height
  faceTopMarginPercent: number; // Top margin as % of total height
  backgroundColor: string;
  country: string;
}

export interface FaceDetectionResult {
  detected: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  landmarks?: {
    leftEye?: { x: number; y: number };
    rightEye?: { x: number; y: number };
    nose?: { x: number; y: number };
    mouth?: { x: number; y: number };
  };
}

export interface PassportPhotoValidation {
  isValid: boolean;
  checks: {
    faceDetected: boolean;
    faceCentered: boolean;
    faceSize: boolean;
    eyesVisible: boolean;
    properLighting: boolean;
    backgroundUniform: boolean;
  };
  messages: string[];
}

export interface PassportPhotoResult {
  croppedImage: Blob;
  validation: PassportPhotoValidation;
  faceDetection: FaceDetectionResult;
}

// Passport photo presets for different countries/documents
export const PASSPORT_PRESETS: Record<string, PassportPhotoPreset> = {
  'india-passport': {
    id: 'india-passport',
    name: 'Indian Passport',
    width: 413,
    height: 531,
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    faceHeightPercent: 70,
    faceTopMarginPercent: 10,
    backgroundColor: '#ffffff',
    country: 'India',
  },
  'india-pan': {
    id: 'india-pan',
    name: 'PAN Card',
    width: 207,
    height: 266,
    widthMm: 25,
    heightMm: 35,
    dpi: 300,
    faceHeightPercent: 70,
    faceTopMarginPercent: 10,
    backgroundColor: '#ffffff',
    country: 'India',
  },
  'india-aadhaar': {
    id: 'india-aadhaar',
    name: 'Aadhaar Card',
    width: 413,
    height: 531,
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    faceHeightPercent: 70,
    faceTopMarginPercent: 10,
    backgroundColor: '#ffffff',
    country: 'India',
  },
  'us-visa': {
    id: 'us-visa',
    name: 'US Visa',
    width: 600,
    height: 600,
    widthMm: 51,
    heightMm: 51,
    dpi: 300,
    faceHeightPercent: 60,
    faceTopMarginPercent: 15,
    backgroundColor: '#ffffff',
    country: 'USA',
  },
  'uk-visa': {
    id: 'uk-visa',
    name: 'UK Visa',
    width: 413,
    height: 531,
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    faceHeightPercent: 70,
    faceTopMarginPercent: 10,
    backgroundColor: '#f0f0f0',
    country: 'UK',
  },
  'schengen-visa': {
    id: 'schengen-visa',
    name: 'Schengen Visa',
    width: 413,
    height: 531,
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    faceHeightPercent: 70,
    faceTopMarginPercent: 10,
    backgroundColor: '#ffffff',
    country: 'EU',
  },
  'canada-visa': {
    id: 'canada-visa',
    name: 'Canada Visa',
    width: 413,
    height: 531,
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    faceHeightPercent: 70,
    faceTopMarginPercent: 10,
    backgroundColor: '#ffffff',
    country: 'Canada',
  },
  'australia-visa': {
    id: 'australia-visa',
    name: 'Australia Visa',
    width: 413,
    height: 531,
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    faceHeightPercent: 70,
    faceTopMarginPercent: 10,
    backgroundColor: '#ffffff',
    country: 'Australia',
  },
};


/**
 * Simple face detection using skin color analysis and edge detection
 * This is a lightweight client-side approach that doesn't require external models
 */
export async function detectFace(imageSource: Blob | File): Promise<FaceDetectionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = detectFaceFromImageData(imageData);
      
      URL.revokeObjectURL(img.src);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(imageSource);
  });
}

/**
 * Detect face region from image data using skin color detection
 */
function detectFaceFromImageData(imageData: ImageData): FaceDetectionResult {
  const { width, height, data } = imageData;
  
  // Create skin mask
  const skinMask: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    skinMask[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      skinMask[y][x] = isSkinColor(r, g, b);
    }
  }

  // Find the largest connected skin region (likely the face)
  const faceRegion = findLargestSkinRegion(skinMask, width, height);
  
  if (!faceRegion) {
    return {
      detected: false,
      x: width * 0.25,
      y: height * 0.1,
      width: width * 0.5,
      height: height * 0.6,
      confidence: 0,
    };
  }

  // Expand the region slightly to include hair/forehead
  const expandedRegion = expandFaceRegion(faceRegion, width, height);

  return {
    detected: true,
    x: expandedRegion.x,
    y: expandedRegion.y,
    width: expandedRegion.width,
    height: expandedRegion.height,
    confidence: Math.min(0.9, faceRegion.area / (width * height * 0.3)),
  };
}

/**
 * Check if a pixel color is likely skin tone
 */
function isSkinColor(r: number, g: number, b: number): boolean {
  // Multiple skin color detection rules for different skin tones
  
  // Rule 1: RGB ratio-based detection
  const rgbRule = r > 95 && g > 40 && b > 20 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
    Math.abs(r - g) > 15 && r > g && r > b;

  // Rule 2: YCbCr color space detection (more robust for various skin tones)
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const ycbcrRule = y > 80 && cb > 77 && cb < 127 && cr > 133 && cr < 173;

  // Rule 3: HSV-based detection
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const s = max === 0 ? 0 : (max - min) / max;
  const v = max / 255;
  let h = 0;
  if (max !== min) {
    if (max === r) h = (g - b) / (max - min);
    else if (max === g) h = 2 + (b - r) / (max - min);
    else h = 4 + (r - g) / (max - min);
    h *= 60;
    if (h < 0) h += 360;
  }
  const hsvRule = h >= 0 && h <= 50 && s >= 0.23 && s <= 0.68 && v >= 0.35;

  return rgbRule || ycbcrRule || hsvRule;
}

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

/**
 * Find the largest connected skin region using flood fill
 */
function findLargestSkinRegion(
  skinMask: boolean[][],
  width: number,
  height: number
): Region | null {
  const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  let largestRegion: Region | null = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (skinMask[y][x] && !visited[y][x]) {
        const region = floodFill(skinMask, visited, x, y, width, height);
        if (!largestRegion || region.area > largestRegion.area) {
          largestRegion = region;
        }
      }
    }
  }

  // Filter out regions that are too small (noise) or too large (background)
  if (largestRegion) {
    const imageArea = width * height;
    if (largestRegion.area < imageArea * 0.01 || largestRegion.area > imageArea * 0.8) {
      return null;
    }
  }

  return largestRegion;
}

/**
 * Flood fill to find connected region bounds
 */
function floodFill(
  skinMask: boolean[][],
  visited: boolean[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): Region {
  const stack: [number, number][] = [[startX, startY]];
  let minX = startX, maxX = startX, minY = startY, maxY = startY;
  let area = 0;

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y][x] || !skinMask[y][x]) continue;

    visited[y][x] = true;
    area++;
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    // Add neighbors (4-connectivity for speed)
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    area,
  };
}

/**
 * Expand face region to include forehead and some margin
 */
function expandFaceRegion(region: Region, imageWidth: number, imageHeight: number): Region {
  // Expand upward for forehead (typically 30% of face height)
  const foreheadExpansion = region.height * 0.3;
  // Expand sides slightly
  const sideExpansion = region.width * 0.15;
  // Expand bottom slightly for chin
  const bottomExpansion = region.height * 0.1;

  const newX = Math.max(0, region.x - sideExpansion);
  const newY = Math.max(0, region.y - foreheadExpansion);
  const newWidth = Math.min(imageWidth - newX, region.width + sideExpansion * 2);
  const newHeight = Math.min(imageHeight - newY, region.height + foreheadExpansion + bottomExpansion);

  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
    area: newWidth * newHeight,
  };
}


/**
 * Auto-crop image to passport photo dimensions centered on face
 */
export async function autoCropToPassport(
  imageSource: Blob | File,
  preset: PassportPhotoPreset,
  faceDetection?: FaceDetectionResult
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // Detect face if not provided
      const face = faceDetection || await detectFace(imageSource);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = preset.width;
        canvas.height = preset.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate crop region to center face properly
        const cropRegion = calculateCropRegion(
          img.width,
          img.height,
          face,
          preset
        );

        // Draw cropped and scaled image
        ctx.drawImage(
          img,
          cropRegion.x,
          cropRegion.y,
          cropRegion.width,
          cropRegion.height,
          0,
          0,
          preset.width,
          preset.height
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          1
        );
        
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(imageSource);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calculate the crop region to properly frame the face
 */
function calculateCropRegion(
  imageWidth: number,
  imageHeight: number,
  face: FaceDetectionResult,
  preset: PassportPhotoPreset
): { x: number; y: number; width: number; height: number } {
  const targetAspect = preset.width / preset.height;
  
  // Calculate desired face height in the final image
  const desiredFaceHeight = preset.height * (preset.faceHeightPercent / 100);
  
  // Calculate scale factor based on face size
  const scale = desiredFaceHeight / face.height;
  
  // Calculate crop dimensions
  let cropWidth = preset.width / scale;
  let cropHeight = preset.height / scale;
  
  // Ensure crop doesn't exceed image bounds
  if (cropWidth > imageWidth) {
    cropWidth = imageWidth;
    cropHeight = cropWidth / targetAspect;
  }
  if (cropHeight > imageHeight) {
    cropHeight = imageHeight;
    cropWidth = cropHeight * targetAspect;
  }
  
  // Calculate face center
  const faceCenterX = face.x + face.width / 2;
  const faceCenterY = face.y + face.height / 2;
  
  // Position crop to center face horizontally
  let cropX = faceCenterX - cropWidth / 2;
  
  // Position crop to place face at proper vertical position
  // Face top should be at faceTopMarginPercent from top
  const desiredFaceTopInCrop = cropHeight * (preset.faceTopMarginPercent / 100);
  let cropY = face.y - desiredFaceTopInCrop;
  
  // Clamp to image bounds
  cropX = Math.max(0, Math.min(imageWidth - cropWidth, cropX));
  cropY = Math.max(0, Math.min(imageHeight - cropHeight, cropY));
  
  return {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
  };
}

/**
 * Validate passport photo against common requirements
 */
export async function validatePassportPhoto(
  imageSource: Blob | File,
  preset: PassportPhotoPreset
): Promise<PassportPhotoValidation> {
  const messages: string[] = [];
  const checks = {
    faceDetected: false,
    faceCentered: false,
    faceSize: false,
    eyesVisible: false,
    properLighting: false,
    backgroundUniform: false,
  };

  try {
    const face = await detectFace(imageSource);
    
    // Check 1: Face detected
    checks.faceDetected = face.detected && face.confidence > 0.3;
    if (!checks.faceDetected) {
      messages.push('Face not clearly detected. Please use a photo with a clear, front-facing view.');
    }

    // Check 2: Face centered
    const img = await loadImage(imageSource);
    const imageCenterX = img.width / 2;
    const faceCenterX = face.x + face.width / 2;
    const centerOffset = Math.abs(faceCenterX - imageCenterX) / img.width;
    checks.faceCentered = centerOffset < 0.15;
    if (!checks.faceCentered) {
      messages.push('Face should be centered in the photo.');
    }

    // Check 3: Face size appropriate
    const faceHeightRatio = face.height / img.height;
    const expectedRatio = preset.faceHeightPercent / 100;
    checks.faceSize = faceHeightRatio >= expectedRatio * 0.5 && faceHeightRatio <= expectedRatio * 1.5;
    if (!checks.faceSize) {
      if (faceHeightRatio < expectedRatio * 0.5) {
        messages.push('Face appears too small. Please use a closer photo.');
      } else {
        messages.push('Face appears too large. Please use a photo with more margin.');
      }
    }

    // Check 4: Eyes visible (basic check - face should be in upper portion)
    const faceTopRatio = face.y / img.height;
    checks.eyesVisible = faceTopRatio < 0.4 && face.detected;
    if (!checks.eyesVisible) {
      messages.push('Eyes should be clearly visible in the upper portion of the photo.');
    }

    // Check 5: Proper lighting (check for extreme brightness/darkness)
    const lightingResult = await checkLighting(imageSource);
    checks.properLighting = lightingResult.isGood;
    if (!checks.properLighting) {
      messages.push(lightingResult.message);
    }

    // Check 6: Background uniformity
    const bgResult = await checkBackgroundUniformity(imageSource, face);
    checks.backgroundUniform = bgResult.isUniform;
    if (!checks.backgroundUniform) {
      messages.push('Background should be plain and uniform. Consider using background removal.');
    }

  } catch (error) {
    messages.push('Unable to analyze photo. Please try a different image.');
  }

  const isValid = Object.values(checks).every(v => v);
  
  if (isValid) {
    messages.unshift('✓ Photo meets passport requirements!');
  }

  return {
    isValid,
    checks,
    messages,
  };
}

/**
 * Load image from blob
 */
function loadImage(source: Blob | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(source);
  });
}

/**
 * Check image lighting quality
 */
async function checkLighting(imageSource: Blob | File): Promise<{ isGood: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const sampleSize = 100; // Sample at reduced size for performance
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({ isGood: true, message: '' });
        return;
      }

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      let totalBrightness = 0;
      let brightPixels = 0;
      let darkPixels = 0;
      const pixelCount = sampleSize * sampleSize;

      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
        if (brightness > 240) brightPixels++;
        if (brightness < 30) darkPixels++;
      }

      const avgBrightness = totalBrightness / pixelCount;
      const overexposedRatio = brightPixels / pixelCount;
      const underexposedRatio = darkPixels / pixelCount;

      URL.revokeObjectURL(img.src);

      if (avgBrightness < 60) {
        resolve({ isGood: false, message: 'Photo appears too dark. Please use better lighting.' });
      } else if (avgBrightness > 220) {
        resolve({ isGood: false, message: 'Photo appears overexposed. Please reduce lighting.' });
      } else if (overexposedRatio > 0.3) {
        resolve({ isGood: false, message: 'Photo has too many bright areas. Avoid direct flash.' });
      } else if (underexposedRatio > 0.3) {
        resolve({ isGood: false, message: 'Photo has too many dark areas. Improve lighting.' });
      } else {
        resolve({ isGood: true, message: '' });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ isGood: true, message: '' });
    };
    img.src = URL.createObjectURL(imageSource);
  });
}

/**
 * Check if background is uniform (plain)
 */
async function checkBackgroundUniformity(
  imageSource: Blob | File,
  face: FaceDetectionResult
): Promise<{ isUniform: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({ isUniform: true });
        return;
      }

      ctx.drawImage(img, 0, 0);
      
      // Sample background areas (corners and edges, avoiding face region)
      const samples: number[][] = [];
      const samplePoints = [
        [10, 10], // top-left
        [img.width - 10, 10], // top-right
        [10, img.height - 10], // bottom-left
        [img.width - 10, img.height - 10], // bottom-right
      ];

      for (const [x, y] of samplePoints) {
        // Skip if point is within face region
        if (x >= face.x && x <= face.x + face.width &&
            y >= face.y && y <= face.y + face.height) {
          continue;
        }
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        samples.push([pixel[0], pixel[1], pixel[2]]);
      }

      if (samples.length < 2) {
        resolve({ isUniform: true });
        return;
      }

      // Check color variance among samples
      let maxVariance = 0;
      for (let i = 0; i < samples.length; i++) {
        for (let j = i + 1; j < samples.length; j++) {
          const variance = Math.sqrt(
            Math.pow(samples[i][0] - samples[j][0], 2) +
            Math.pow(samples[i][1] - samples[j][1], 2) +
            Math.pow(samples[i][2] - samples[j][2], 2)
          );
          maxVariance = Math.max(maxVariance, variance);
        }
      }

      URL.revokeObjectURL(img.src);
      
      // Allow some variance (threshold of 50 for color difference)
      resolve({ isUniform: maxVariance < 80 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ isUniform: true });
    };
    img.src = URL.createObjectURL(imageSource);
  });
}


/**
 * Generate passport photo with background replacement
 */
export async function generatePassportPhoto(
  imageSource: Blob | File,
  preset: PassportPhotoPreset,
  options: {
    replaceBackground?: boolean;
    backgroundColor?: string;
    onProgress?: (progress: number, message: string) => void;
  } = {}
): Promise<PassportPhotoResult> {
  const { replaceBackground = true, backgroundColor, onProgress } = options;

  onProgress?.(10, 'Detecting face...');
  
  // Detect face
  const faceDetection = await detectFace(imageSource);
  
  onProgress?.(30, 'Validating photo...');
  
  // Validate photo
  const validation = await validatePassportPhoto(imageSource, preset);
  
  let processedImage: Blob = imageSource instanceof Blob ? imageSource : imageSource;
  
  // Replace background if requested
  if (replaceBackground) {
    onProgress?.(50, 'Removing background...');
    
    try {
      // Dynamic import to avoid loading the heavy library unless needed
      const { removeBackground, replaceBackgroundWithColor } = await import('./backgroundRemove');
      
      const bgResult = await removeBackground(imageSource, {
        progress: (progress, message) => {
          onProgress?.(50 + progress * 0.3, message);
        },
      });
      
      onProgress?.(80, 'Applying background...');
      
      // Get image dimensions
      const img = await loadImage(imageSource);
      const bgColor = backgroundColor || preset.backgroundColor;
      
      processedImage = await replaceBackgroundWithColor(
        bgResult.foreground,
        bgColor,
        img.width,
        img.height
      );
    } catch (error) {
      console.warn('Background removal failed, using original image:', error);
      // Continue with original image if background removal fails
    }
  }
  
  onProgress?.(90, 'Cropping to passport size...');
  
  // Auto-crop to passport dimensions
  const croppedImage = await autoCropToPassport(processedImage, preset, faceDetection);
  
  onProgress?.(100, 'Complete!');
  
  return {
    croppedImage,
    validation,
    faceDetection,
  };
}

/**
 * Generate print layout with multiple passport photos
 */
export async function generatePrintLayout(
  passportPhoto: Blob,
  preset: PassportPhotoPreset,
  options: {
    paperSize?: 'a4' | '4x6' | '5x7';
    copies?: number;
    margin?: number;
  } = {}
): Promise<Blob> {
  const { paperSize = '4x6', copies = 8, margin = 10 } = options;
  
  // Paper dimensions at 300 DPI
  const paperSizes = {
    'a4': { width: 2480, height: 3508 },
    '4x6': { width: 1200, height: 1800 },
    '5x7': { width: 1500, height: 2100 },
  };
  
  const paper = paperSizes[paperSize];
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = paper.width;
      canvas.height = paper.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, paper.width, paper.height);

      // Calculate grid layout
      const photoWidth = preset.width;
      const photoHeight = preset.height;
      const cols = Math.floor((paper.width - margin) / (photoWidth + margin));
      const rows = Math.floor((paper.height - margin) / (photoHeight + margin));
      const maxPhotos = Math.min(copies, cols * rows);

      // Center the grid
      const gridWidth = cols * photoWidth + (cols - 1) * margin;
      const gridHeight = rows * photoHeight + (rows - 1) * margin;
      const startX = (paper.width - gridWidth) / 2;
      const startY = (paper.height - gridHeight) / 2;

      // Draw photos in grid
      let count = 0;
      for (let row = 0; row < rows && count < maxPhotos; row++) {
        for (let col = 0; col < cols && count < maxPhotos; col++) {
          const x = startX + col * (photoWidth + margin);
          const y = startY + row * (photoHeight + margin);
          ctx.drawImage(img, x, y, photoWidth, photoHeight);
          count++;
        }
      }

      // Add cut lines (optional visual guides)
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([5, 5]);
      
      for (let row = 0; row <= rows && row * (photoHeight + margin) <= paper.height; row++) {
        const y = startY + row * (photoHeight + margin) - margin / 2;
        if (y > 0 && y < paper.height) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(paper.width, y);
          ctx.stroke();
        }
      }
      
      for (let col = 0; col <= cols && col * (photoWidth + margin) <= paper.width; col++) {
        const x = startX + col * (photoWidth + margin) - margin / 2;
        if (x > 0 && x < paper.width) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, paper.height);
          ctx.stroke();
        }
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.95
      );
      
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load passport photo'));
    };
    img.src = URL.createObjectURL(passportPhoto);
  });
}

/**
 * Get preset by ID
 */
export function getPassportPreset(presetId: string): PassportPhotoPreset | undefined {
  return PASSPORT_PRESETS[presetId];
}

/**
 * Get all presets grouped by country
 */
export function getPresetsByCountry(): Record<string, PassportPhotoPreset[]> {
  const grouped: Record<string, PassportPhotoPreset[]> = {};
  
  for (const preset of Object.values(PASSPORT_PRESETS)) {
    if (!grouped[preset.country]) {
      grouped[preset.country] = [];
    }
    grouped[preset.country].push(preset);
  }
  
  return grouped;
}
