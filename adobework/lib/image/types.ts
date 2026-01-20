// Image processing types and interfaces

export interface ImageData {
  src: string;
  width: number;
  height: number;
  format: ImageFormat;
  size: number;
  name: string;
}

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp';

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  resizeMode: 'contain' | 'cover' | 'stretch';
  quality: number; // 0-1
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformOptions {
  rotate: number; // degrees
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface CompressOptions {
  quality: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  targetSize?: number; // bytes
  format: ImageFormat;
  preserveExif?: boolean;
}

export interface FilterOptions {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -100 to 100
  blur: number; // 0 to 20
  sharpen: number; // 0 to 100
}

export interface TextLayerOptions {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  opacity: number;
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  outline?: {
    enabled: boolean;
    color: string;
    width: number;
  };
}

export interface StickerLayerOptions {
  id: string;
  type: 'sticker' | 'emoji';
  content: string; // emoji character or sticker URL
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface WatermarkOptions {
  id: string;
  type: 'watermark';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  rotation: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';
}

export type Layer = TextLayerOptions | StickerLayerOptions | WatermarkOptions;

export interface LayerState {
  layers: Layer[];
  selectedLayerId: string | null;
}

export interface ImagePreset {
  width: number;
  height: number;
  name: string;
  category: 'social' | 'document' | 'print';
}

export interface AspectRatio {
  label: string;
  value: number;
}

export interface FilterPreset {
  name: string;
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
}

export interface BatchJob {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: Blob;
  error?: string;
}

export interface HistoryState {
  imageData: string; // base64 or blob URL
  timestamp: number;
  operation: string;
}
