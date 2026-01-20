// Image presets for resize and other operations

import { ImagePreset, AspectRatio, FilterPreset } from './types';

export const IMAGE_PRESETS: Record<string, ImagePreset> = {
  // Social Media
  'instagram-post': { width: 1080, height: 1080, name: 'Instagram Post', category: 'social' },
  'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story/Reel', category: 'social' },
  'instagram-landscape': { width: 1080, height: 566, name: 'Instagram Landscape', category: 'social' },
  'facebook-cover': { width: 820, height: 312, name: 'Facebook Cover', category: 'social' },
  'facebook-post': { width: 1200, height: 630, name: 'Facebook Post', category: 'social' },
  'facebook-profile': { width: 170, height: 170, name: 'Facebook Profile', category: 'social' },
  'twitter-header': { width: 1500, height: 500, name: 'Twitter/X Header', category: 'social' },
  'twitter-post': { width: 1200, height: 675, name: 'Twitter/X Post', category: 'social' },
  'linkedin-cover': { width: 1584, height: 396, name: 'LinkedIn Cover', category: 'social' },
  'linkedin-post': { width: 1200, height: 627, name: 'LinkedIn Post', category: 'social' },
  'youtube-thumbnail': { width: 1280, height: 720, name: 'YouTube Thumbnail', category: 'social' },
  'youtube-banner': { width: 2560, height: 1440, name: 'YouTube Banner', category: 'social' },
  'whatsapp-dp': { width: 500, height: 500, name: 'WhatsApp DP', category: 'social' },
  'pinterest-pin': { width: 1000, height: 1500, name: 'Pinterest Pin', category: 'social' },
  
  // Documents (Indian)
  'passport-india': { width: 413, height: 531, name: 'Indian Passport (35×45mm)', category: 'document' },
  'pan-card': { width: 207, height: 266, name: 'PAN Card (25×35mm)', category: 'document' },
  'aadhaar': { width: 413, height: 531, name: 'Aadhaar (35×45mm)', category: 'document' },
  'visa-us': { width: 600, height: 600, name: 'US Visa (2×2 inch)', category: 'document' },
  'visa-uk': { width: 413, height: 531, name: 'UK Visa (35×45mm)', category: 'document' },
  'driving-license': { width: 354, height: 472, name: 'Driving License', category: 'document' },
  
  // Print
  'a4-300dpi': { width: 2480, height: 3508, name: 'A4 (300dpi)', category: 'print' },
  'a5-300dpi': { width: 1748, height: 2480, name: 'A5 (300dpi)', category: 'print' },
  'letter-300dpi': { width: 2550, height: 3300, name: 'Letter (300dpi)', category: 'print' },
  '4x6-photo': { width: 1200, height: 1800, name: '4×6 Photo (300dpi)', category: 'print' },
  '5x7-photo': { width: 1500, height: 2100, name: '5×7 Photo (300dpi)', category: 'print' },
  '8x10-photo': { width: 2400, height: 3000, name: '8×10 Photo (300dpi)', category: 'print' },
  'business-card': { width: 1050, height: 600, name: 'Business Card (300dpi)', category: 'print' },
};

export const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Free', value: 0 },
  { label: '1:1 (Square)', value: 1 },
  { label: '4:5 (Portrait)', value: 4/5 },
  { label: '5:4 (Landscape)', value: 5/4 },
  { label: '16:9 (Widescreen)', value: 16/9 },
  { label: '9:16 (Vertical)', value: 9/16 },
  { label: '3:2 (Photo)', value: 3/2 },
  { label: '2:3 (Portrait Photo)', value: 2/3 },
  { label: '4:3 (Standard)', value: 4/3 },
  { label: '3:4 (Portrait Standard)', value: 3/4 },
];

export const FILTER_PRESETS: Record<string, FilterPreset> = {
  'none': { name: 'None', brightness: 0, contrast: 0, saturation: 0, exposure: 0 },
  'vivid': { name: 'Vivid', brightness: 10, contrast: 20, saturation: 30, exposure: 5 },
  'warm': { name: 'Warm', brightness: 5, contrast: 10, saturation: 10, exposure: 0 },
  'cool': { name: 'Cool', brightness: 0, contrast: 10, saturation: -10, exposure: 0 },
  'vintage': { name: 'Vintage', brightness: -5, contrast: 15, saturation: -20, exposure: 0 },
  'bw': { name: 'B&W', brightness: 0, contrast: 20, saturation: -100, exposure: 0 },
  'dramatic': { name: 'Dramatic', brightness: -10, contrast: 40, saturation: 10, exposure: -5 },
  'soft': { name: 'Soft', brightness: 10, contrast: -10, saturation: -5, exposure: 5 },
  'hdr': { name: 'HDR', brightness: 5, contrast: 30, saturation: 20, exposure: 0 },
  'matte': { name: 'Matte', brightness: 5, contrast: -15, saturation: -10, exposure: 5 },
  'sepia': { name: 'Sepia', brightness: 0, contrast: 10, saturation: -50, exposure: 0 },
  'fade': { name: 'Fade', brightness: 15, contrast: -20, saturation: -15, exposure: 10 },
};

export const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'bmp'] as const;

export const FORMAT_EXTENSIONS: Record<string, string[]> = {
  'jpeg': ['.jpg', '.jpeg'],
  'png': ['.png'],
  'webp': ['.webp'],
  'gif': ['.gif'],
  'bmp': ['.bmp'],
  'heic': ['.heic', '.heif'],
  'svg': ['.svg'],
  'tiff': ['.tiff', '.tif'],
};

export const FORMAT_MIME_TYPES: Record<string, string> = {
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
};
