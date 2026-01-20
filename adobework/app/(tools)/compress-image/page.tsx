'use client';

import { useState, useRef, useCallback } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BatchProcessor } from '@/components/tools/BatchProcessor';
import { triggerDownload } from '@/lib/utils/download';
import {
  compressImage,
  compressToTargetSize,
  smartCompress,
  calculateCompressionRatio,
  formatFileSize,
  getImageDimensions,
  ImageFormat,
  BatchCompressSettings,
} from '@/lib/image';

type CompressionMode = 'smart' | 'quality' | 'target';
type PageMode = 'single' | 'batch';

export default function CompressImagePage() {
  const [pageMode, setPageMode] = useState<PageMode>('single');
  const [file, setFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState<CompressionMode>('smart');
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState(500);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    if (pageMode === 'batch' || files.length > 1) {
      setPageMode('batch');
      setBatchFiles(files);
      return;
    }
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setResult(null);
    
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    
    const dims = await getImageDimensions(selectedFile);
    setOriginalDimensions(dims);
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
    };
    img.src = url;
  }, [pageMode]);

  const handleCompress = async () => {
    if (!imageRef.current || !file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    
    try {
      setProgress(20);
      
      const canvas = document.createElement('canvas');
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imageRef.current, 0, 0);
      
      setProgress(40);
      
      let blob: Blob;
      
      switch (mode) {
        case 'smart':
          blob = await smartCompress(canvas, outputFormat);
          break;
        case 'quality':
          blob = await compressImage(canvas, {
            quality: quality / 100,
            format: outputFormat,
          });
          break;
        case 'target':
          blob = await compressToTargetSize(canvas, targetSize * 1024, outputFormat);
          break;
        default:
          blob = await smartCompress(canvas, outputFormat);
      }
      
      setProgress(90);
      
      const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
      const filename = file.name.replace(/\.[^.]+$/, `_compressed.${ext}`);
      
      setResult({
        blob,
        filename,
        originalSize: file.size,
        compressedSize: blob.size,
      });
      
      setProgress(100);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      triggerDownload({ blob: result.blob, filename: result.filename });
    }
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setBatchFiles([]);
    setPreview(null);
    setResult(null);
    setOriginalDimensions({ width: 0, height: 0 });
    imageRef.current = null;
    setPageMode('single');
  };

  const getBatchSettings = (): BatchCompressSettings => ({
    mode,
    quality: quality / 100,
    targetSize,
    format: outputFormat,
  });

  const compressionStats = result
    ? calculateCompressionRatio(result.originalSize, result.compressedSize)
    : null;

  const hasFiles = file || batchFiles.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <span className="text-3xl">🗜️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Image Compress</h1>
          <p className="text-gray-600 mt-2">Reduce image file size while maintaining quality</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!hasFiles ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => setPageMode('single')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageMode === 'single' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Single Image
                </button>
                <button
                  onClick={() => setPageMode('batch')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageMode === 'batch' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Batch Mode
                </button>
              </div>
              
              <FileDropzone
                acceptedFormats={['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']}
                maxFileSize={50 * 1024 * 1024}
                maxFiles={pageMode === 'batch' ? 50 : 1}
                onFilesSelected={handleFileSelect}
              />
              
              {pageMode === 'batch' && (
                <p className="text-center text-sm text-gray-500">
                  Upload multiple images to compress them all at once
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {pageMode === 'single' && file && (
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
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <span className="font-medium">{formatFileSize(file.size)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {originalDimensions.width} × {originalDimensions.height} px
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Compression Settings</h3>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'smart', label: '🧠 Smart' },
                            { key: 'quality', label: '🎚️ Quality' },
                            { key: 'target', label: '🎯 Target' },
                          ].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setMode(key as CompressionMode)}
                              className={`p-3 rounded-lg text-sm font-medium transition-colors text-center ${
                                mode === key ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {mode === 'quality' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quality: {quality}%
                          </label>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Smaller file</span>
                            <span>Better quality</span>
                          </div>
                        </div>
                      )}

                      {mode === 'target' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Size (KB)
                          </label>
                          <input
                            type="number"
                            value={targetSize}
                            onChange={(e) => setTargetSize(Math.max(10, Number(e.target.value)))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            min={10}
                            max={10000}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Current: {formatFileSize(file.size)} → Target: {formatFileSize(targetSize * 1024)}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Output Format</label>
                        <div className="flex gap-2">
                          {(['jpeg', 'png', 'webp'] as ImageFormat[]).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => setOutputFormat(fmt)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                outputFormat === fmt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {fmt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3 text-sm">
                        {mode === 'smart' && (
                          <p className="text-green-800">
                            🧠 Smart mode automatically determines the best compression settings based on your image.
                          </p>
                        )}
                        {mode === 'quality' && (
                          <p className="text-green-800">
                            🎚️ Quality mode lets you manually set the compression level. Lower values = smaller files.
                          </p>
                        )}
                        {mode === 'target' && (
                          <p className="text-green-800">
                            🎯 Target mode compresses to reach your desired file size (within 5% tolerance).
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {isProcessing && <ProgressBar progress={progress} status="processing" />}

                  {result && compressionStats && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">✅</span>
                        <div className="flex-1">
                          <p className="font-medium text-green-800">Compression complete!</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-green-600">Original</p>
                              <p className="font-medium text-green-800">{formatFileSize(result.originalSize)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-600">Compressed</p>
                              <p className="font-medium text-green-800">{formatFileSize(result.compressedSize)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-600">Saved</p>
                              <p className="font-medium text-green-800">{compressionStats.percentage}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-600">Reduction</p>
                              <p className="font-medium text-green-800">{formatFileSize(compressionStats.saved)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!result ? (
                      <>
                        <Button onClick={handleCompress} loading={isProcessing} className="flex-1">
                          🗜️ Compress Image
                        </Button>
                        <Button variant="outline" onClick={handleClear}>Remove</Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handleDownload} className="flex-1">📥 Download Compressed Image</Button>
                        <Button variant="outline" onClick={handleClear}>Compress Another</Button>
                      </>
                    )}
                  </div>
                </>
              )}

              {pageMode === 'batch' && batchFiles.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Compression Settings</h3>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'smart', label: '🧠 Smart' },
                            { key: 'quality', label: '🎚️ Quality' },
                            { key: 'target', label: '🎯 Target' },
                          ].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setMode(key as CompressionMode)}
                              className={`p-2 rounded-lg text-sm font-medium transition-colors text-center ${
                                mode === key ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {mode === 'quality' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quality: {quality}%
                          </label>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}

                      {mode === 'target' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Size (KB)
                          </label>
                          <input
                            type="number"
                            value={targetSize}
                            onChange={(e) => setTargetSize(Math.max(10, Number(e.target.value)))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            min={10}
                            max={10000}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Output Format</h3>
                      <div className="flex gap-2">
                        {(['jpeg', 'png', 'webp'] as ImageFormat[]).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setOutputFormat(fmt)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              outputFormat === fmt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3 text-sm">
                        {mode === 'smart' && <p className="text-green-800">🧠 Auto-optimize each image</p>}
                        {mode === 'quality' && <p className="text-green-800">🎚️ Apply {quality}% quality to all</p>}
                        {mode === 'target' && <p className="text-green-800">🎯 Target {targetSize}KB per image</p>}
                      </div>
                    </div>
                  </div>

                  <BatchProcessor
                    files={batchFiles}
                    operation="compress"
                    settings={getBatchSettings()}
                    onClear={handleClear}
                    actionLabel="Compress"
                    actionIcon="🗜️"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
