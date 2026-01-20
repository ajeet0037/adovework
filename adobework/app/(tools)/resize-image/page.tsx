'use client';

import { useState, useRef, useCallback } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BatchProcessor } from '@/components/tools/BatchProcessor';
import { triggerDownload } from '@/lib/utils/download';
import {
  IMAGE_PRESETS,
  ImagePreset,
  resizeImage,
  getImageDimensions,
  convertToPixels,
  convertFromPixels,
  calculateAspectRatioDimensions,
  BatchResizeSettings,
} from '@/lib/image';

type Unit = 'px' | '%' | 'cm';
type PresetCategory = 'social' | 'document' | 'print';
type Mode = 'single' | 'batch';

export default function ResizeImagePage() {
  const [mode, setMode] = useState<Mode>('single');
  const [file, setFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [unit, setUnit] = useState<Unit>('px');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [quality, setQuality] = useState(0.92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('social');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    if (mode === 'batch' || files.length > 1) {
      setMode('batch');
      setBatchFiles(files);
      const dims = await getImageDimensions(files[0]);
      setOriginalDimensions(dims);
      setTargetWidth(dims.width);
      setTargetHeight(dims.height);
      return;
    }
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setResult(null);
    
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    
    const dims = await getImageDimensions(selectedFile);
    setOriginalDimensions(dims);
    setTargetWidth(dims.width);
    setTargetHeight(dims.height);
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
    };
    img.src = url;
  }, [mode]);

  const handleWidthChange = (value: number) => {
    const pixelValue = convertToPixels(value, unit, originalDimensions.width);
    setTargetWidth(value);
    
    if (maintainAspectRatio && originalDimensions.width > 0) {
      const newDims = calculateAspectRatioDimensions(
        originalDimensions.width,
        originalDimensions.height,
        pixelValue,
        null
      );
      setTargetHeight(convertFromPixels(newDims.height, unit, originalDimensions.height));
    }
  };

  const handleHeightChange = (value: number) => {
    const pixelValue = convertToPixels(value, unit, originalDimensions.height);
    setTargetHeight(value);
    
    if (maintainAspectRatio && originalDimensions.height > 0) {
      const newDims = calculateAspectRatioDimensions(
        originalDimensions.width,
        originalDimensions.height,
        null,
        pixelValue
      );
      setTargetWidth(convertFromPixels(newDims.width, unit, originalDimensions.width));
    }
  };

  const handlePresetSelect = (preset: ImagePreset) => {
    setUnit('px');
    setTargetWidth(preset.width);
    setTargetHeight(preset.height);
    setMaintainAspectRatio(false);
  };

  const handleResize = async () => {
    if (!imageRef.current || !file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    
    try {
      setProgress(20);
      const widthPx = convertToPixels(targetWidth, unit, originalDimensions.width);
      const heightPx = convertToPixels(targetHeight, unit, originalDimensions.height);
      setProgress(40);
      
      const canvas = document.createElement('canvas');
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imageRef.current, 0, 0);
      setProgress(60);
      
      const blob = await resizeImage(canvas, {
        width: widthPx,
        height: heightPx,
        maintainAspectRatio: false,
        resizeMode: 'stretch',
        quality,
      });
      setProgress(100);
      
      const filename = file.name.replace(/\.[^.]+$/, `_${widthPx}x${heightPx}.jpg`);
      setResult({ blob, filename });
    } catch (error) {
      console.error('Resize failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      triggerDownload(result);
    }
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setBatchFiles([]);
    setPreview(null);
    setResult(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setTargetWidth(0);
    setTargetHeight(0);
    imageRef.current = null;
    setMode('single');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const presetsByCategory = Object.entries(IMAGE_PRESETS).reduce((acc, [key, preset]) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push({ key, ...preset });
    return acc;
  }, {} as Record<PresetCategory, (ImagePreset & { key: string })[]>);

  const getBatchSettings = (): BatchResizeSettings => ({
    width: convertToPixels(targetWidth, unit, originalDimensions.width),
    height: convertToPixels(targetHeight, unit, originalDimensions.height),
    maintainAspectRatio: false,
    quality,
  });

  const hasFiles = file || batchFiles.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">📐</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Image Resize</h1>
          <p className="text-gray-600 mt-2">Resize images to exact dimensions or popular presets</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!hasFiles ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => setMode('single')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'single' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Single Image
                </button>
                <button
                  onClick={() => setMode('batch')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'batch' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Batch Mode
                </button>
              </div>
              
              <FileDropzone
                acceptedFormats={['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']}
                maxFileSize={50 * 1024 * 1024}
                maxFiles={mode === 'batch' ? 50 : 1}
                onFilesSelected={handleFileSelect}
              />
              
              {mode === 'batch' && (
                <p className="text-center text-sm text-gray-500">
                  Upload multiple images to resize them all at once
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {mode === 'single' && file && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900">Preview</h3>
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '300px' }}>
                        {preview && (
                          <img src={preview} alt="Preview" className="w-full h-full object-contain" style={{ maxHeight: '300px' }} />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{file.name}</span>
                        <span>{formatSize(file.size)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Original: {originalDimensions.width} × {originalDimensions.height} px
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Dimensions</h3>
                      <div className="flex gap-2">
                        {(['px', '%', 'cm'] as Unit[]).map((u) => (
                          <button
                            key={u}
                            onClick={() => {
                              const widthPx = convertToPixels(targetWidth, unit, originalDimensions.width);
                              const heightPx = convertToPixels(targetHeight, unit, originalDimensions.height);
                              setUnit(u);
                              setTargetWidth(convertFromPixels(widthPx, u, originalDimensions.width));
                              setTargetHeight(convertFromPixels(heightPx, u, originalDimensions.height));
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              unit === u ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                          <input
                            type="number"
                            value={Math.round(targetWidth * 100) / 100}
                            onChange={(e) => handleWidthChange(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            min={1}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                          <input
                            type="number"
                            value={Math.round(targetHeight * 100) / 100}
                            onChange={(e) => handleHeightChange(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            min={1}
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={maintainAspectRatio}
                          onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">🔗 Maintain aspect ratio</span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quality: {Math.round(quality * 100)}%
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={quality * 100}
                          onChange={(e) => setQuality(Number(e.target.value) / 100)}
                          className="w-full"
                        />
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <p className="text-blue-800">
                          Output: {Math.round(convertToPixels(targetWidth, unit, originalDimensions.width))} × {Math.round(convertToPixels(targetHeight, unit, originalDimensions.height))} px
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Quick Presets</h3>
                    <div className="flex gap-2 border-b border-gray-200 pb-2">
                      {[
                        { key: 'social', label: '📱 Social Media' },
                        { key: 'document', label: '📄 Documents' },
                        { key: 'print', label: '🖨️ Print' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setActiveCategory(key as PresetCategory)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeCategory === key ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {presetsByCategory[activeCategory]?.map((preset) => (
                        <button
                          key={preset.key}
                          onClick={() => handlePresetSelect(preset)}
                          className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-900">{preset.name}</p>
                          <p className="text-xs text-gray-500">{preset.width} × {preset.height}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {isProcessing && <ProgressBar progress={progress} status="processing" />}

                  {result && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-medium text-green-800">Image resized successfully!</p>
                          <p className="text-sm text-green-700">New size: {formatSize(result.blob.size)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!result ? (
                      <>
                        <Button onClick={handleResize} loading={isProcessing} className="flex-1">
                          📐 Resize Image
                        </Button>
                        <Button variant="outline" onClick={handleClear}>Remove</Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handleDownload} className="flex-1">📥 Download Resized Image</Button>
                        <Button variant="outline" onClick={handleClear}>Resize Another</Button>
                      </>
                    )}
                  </div>
                </>
              )}

              {mode === 'batch' && batchFiles.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Target Dimensions</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
                          <input
                            type="number"
                            value={targetWidth}
                            onChange={(e) => setTargetWidth(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            min={1}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                          <input
                            type="number"
                            value={targetHeight}
                            onChange={(e) => setTargetHeight(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            min={1}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quality: {Math.round(quality * 100)}%
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={quality * 100}
                          onChange={(e) => setQuality(Number(e.target.value) / 100)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900">Quick Presets</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(IMAGE_PRESETS).slice(0, 6).map(([key, preset]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setTargetWidth(preset.width);
                              setTargetHeight(preset.height);
                            }}
                            className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
                          >
                            <p className="font-medium text-xs text-gray-900">{preset.name}</p>
                            <p className="text-xs text-gray-500">{preset.width}×{preset.height}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <BatchProcessor
                    files={batchFiles}
                    operation="resize"
                    settings={getBatchSettings()}
                    onClear={handleClear}
                    actionLabel="Resize"
                    actionIcon="📐"
                  />
                </>
              )}
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
