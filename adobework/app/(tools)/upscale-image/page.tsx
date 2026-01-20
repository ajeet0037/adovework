'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { triggerDownload } from '@/lib/utils/download';
import {
  upscaleImageFile,
  validateUpscaleInput,
  calculateUpscaleDimensions,
  getImageDimensions,
  UpscaleResult,
} from '@/lib/image';

type ScaleFactor = 2 | 4;

export default function UpscaleImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>(2);
  const [enhanceDetails, setEnhanceDetails] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; filename: string; result: UpscaleResult } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setResult(null);
    setResultPreview(null);
    setError(null);
    setComparisonPosition(50);
    
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    
    try {
      const dims = await getImageDimensions(selectedFile);
      setOriginalDimensions(dims);
      
      // Validate dimensions
      const validation = validateUpscaleInput(dims.width, dims.height);
      if (!validation.valid) {
        setError(validation.error || 'Invalid image');
      }
    } catch {
      setError('Failed to load image');
    }
  }, []);

  const handleUpscale = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setResultPreview(null);
    setError(null);
    
    try {
      const upscaleResult = await upscaleImageFile(
        file,
        { scale: scaleFactor, enhanceDetails },
        setProgress
      );
      
      const filename = file.name.replace(/\.[^.]+$/, `_${scaleFactor}x_upscaled.png`);
      setResult({ blob: upscaleResult.blob, filename, result: upscaleResult });
      
      // Create preview URL for result
      const resultUrl = URL.createObjectURL(upscaleResult.blob);
      setResultPreview(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upscaling failed');
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
    if (resultPreview) URL.revokeObjectURL(resultPreview);
    setFile(null);
    setPreview(null);
    setResultPreview(null);
    setResult(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setError(null);
    setComparisonPosition(50);
  };

  // Comparison slider handlers
  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !comparisonRef.current) return;
    
    const rect = comparisonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setComparisonPosition(percentage);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const outputDimensions = calculateUpscaleDimensions(
    originalDimensions.width,
    originalDimensions.height,
    scaleFactor
  );

  const isValidInput = originalDimensions.width > 0 && 
    originalDimensions.width <= 2000 && 
    originalDimensions.height <= 2000;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Image Upscaler</h1>
          <p className="text-gray-600 mt-2">Enhance and upscale low-resolution images with AI</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!file ? (
            <div className="space-y-4">
              <FileDropzone
                acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
                maxFileSize={50 * 1024 * 1024}
                maxFiles={1}
                onFilesSelected={handleFileSelect}
              />
              <div className="text-center text-sm text-gray-500">
                <p>Maximum input size: 2000 × 2000 pixels</p>
                <p>Supported formats: JPG, PNG, WebP</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Before/After Comparison */}
              {result && resultPreview ? (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Before / After Comparison</h3>
                  <div 
                    ref={comparisonRef}
                    className="relative bg-gray-100 rounded-lg overflow-hidden cursor-ew-resize select-none"
                    style={{ height: '400px' }}
                    onMouseDown={handleMouseDown}
                  >
                    {/* After (Result) - Full width background */}
                    <div className="absolute inset-0">
                      <img 
                        src={resultPreview} 
                        alt="Upscaled" 
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                    
                    {/* Before (Original) - Clipped */}
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${comparisonPosition}%` }}
                    >
                      <img 
                        src={preview!} 
                        alt="Original" 
                        className="h-full object-contain"
                        style={{ width: `${100 / (comparisonPosition / 100)}%`, maxWidth: 'none' }}
                        draggable={false}
                      />
                    </div>
                    
                    {/* Slider */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                      style={{ left: `${comparisonPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <span className="text-gray-600 text-sm">⟷</span>
                      </div>
                    </div>
                    
                    {/* Labels */}
                    <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Before
                    </div>
                    <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      After
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    Drag the slider to compare before and after
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Preview</h3>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '300px' }}>
                    {preview && (
                      <img src={preview} alt="Preview" className="w-full h-full object-contain" style={{ maxHeight: '300px' }} />
                    )}
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <div>
                  <span className="font-medium">{file.name}</span>
                  <span className="mx-2">•</span>
                  <span>{formatSize(file.size)}</span>
                </div>
                <div>
                  {originalDimensions.width} × {originalDimensions.height} px
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Scale Factor Selection */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Scale Factor</h3>
                <div className="grid grid-cols-2 gap-4">
                  {([2, 4] as ScaleFactor[]).map((scale) => {
                    const dims = calculateUpscaleDimensions(
                      originalDimensions.width,
                      originalDimensions.height,
                      scale
                    );
                    return (
                      <button
                        key={scale}
                        onClick={() => setScaleFactor(scale)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          scaleFactor === scale
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <div className="text-2xl font-bold text-purple-600">{scale}×</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {dims.width} × {dims.height} px
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enhancement Options */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Enhancement Options</h3>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={enhanceDetails}
                    onChange={(e) => setEnhanceDetails(e.target.checked)}
                    className="w-5 h-5 rounded text-purple-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Enhance Details</p>
                    <p className="text-sm text-gray-500">Apply sharpening to improve clarity</p>
                  </div>
                </label>
              </div>

              {/* Output Info */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Output Dimensions</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {outputDimensions.width} × {outputDimensions.height} px
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-700">Scale</p>
                    <p className="text-lg font-semibold text-purple-900">{scaleFactor}× larger</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <ProgressBar 
                  progress={progress} 
                  status="processing" 
                  message="Upscaling image..."
                />
              )}

              {/* Success Message */}
              {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium text-green-800">Image upscaled successfully!</p>
                      <p className="text-sm text-green-700">
                        {result.result.originalWidth}×{result.result.originalHeight} → {result.result.newWidth}×{result.result.newHeight} px
                        <span className="mx-2">•</span>
                        {formatSize(result.blob.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!result ? (
                  <>
                    <Button 
                      onClick={handleUpscale} 
                      loading={isProcessing}
                      disabled={!isValidInput}
                      className="flex-1"
                    >
                      🔍 Upscale {scaleFactor}×
                    </Button>
                    <Button variant="outline" onClick={handleClear}>Remove</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleDownload} className="flex-1">
                      📥 Download Upscaled Image
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                      Upscale Another
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About AI Image Upscaling</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-2xl">🎯</div>
              <h3 className="font-medium text-gray-900">Enhanced Quality</h3>
              <p className="text-sm text-gray-600">
                Our upscaler uses advanced algorithms to enhance details and reduce artifacts while enlarging your images.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🔒</div>
              <h3 className="font-medium text-gray-900">Privacy First</h3>
              <p className="text-sm text-gray-600">
                All processing happens in your browser. Your images are never uploaded to any server.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">⚡</div>
              <h3 className="font-medium text-gray-900">Fast Processing</h3>
              <p className="text-sm text-gray-600">
                Get results in seconds with our optimized client-side processing engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
