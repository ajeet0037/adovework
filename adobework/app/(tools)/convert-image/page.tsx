'use client';

import { useState, useRef, useCallback } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BatchProcessor } from '@/components/tools/BatchProcessor';
import { triggerDownload } from '@/lib/utils/download';
import {
  convertImage,
  detectImageFormat,
  getConversionTargets,
  hasTransparency,
  generateOutputFilename,
  formatFileSize,
  getImageDimensions,
  ImageFormat,
  BatchConvertSettings,
} from '@/lib/image';

const FORMAT_INFO: Record<ImageFormat, { name: string; desc: string; icon: string }> = {
  jpeg: { name: 'JPEG', desc: 'Best for photos, smaller size', icon: '🖼️' },
  png: { name: 'PNG', desc: 'Supports transparency, lossless', icon: '🎨' },
  webp: { name: 'WebP', desc: 'Modern format, best compression', icon: '🌐' },
  gif: { name: 'GIF', desc: 'Supports animation', icon: '🎬' },
  bmp: { name: 'BMP', desc: 'Uncompressed bitmap', icon: '📊' },
};

type PageMode = 'single' | 'batch';

export default function ConvertImagePage() {
  const [pageMode, setPageMode] = useState<PageMode>('single');
  const [file, setFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [sourceFormat, setSourceFormat] = useState<ImageFormat | 'unknown'>('unknown');
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(92);
  const [hasAlpha, setHasAlpha] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
    originalSize: number;
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
    
    const format = detectImageFormat(selectedFile);
    setSourceFormat(format);
    
    const targets = getConversionTargets(format);
    if (targets.length > 0) {
      setTargetFormat(targets[0]);
    }
    
    const img = new Image();
    img.onload = async () => {
      imageRef.current = img;
      const transparent = await hasTransparency(img);
      setHasAlpha(transparent);
    };
    img.src = url;
  }, [pageMode]);

  const handleConvert = async () => {
    if (!imageRef.current || !file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    
    try {
      setProgress(30);
      
      const blob = await convertImage(imageRef.current, targetFormat, quality / 100);
      
      setProgress(90);
      
      const filename = generateOutputFilename(file.name, targetFormat);
      
      setResult({
        blob,
        filename,
        originalSize: file.size,
      });
      
      setProgress(100);
    } catch (error) {
      console.error('Conversion failed:', error);
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
    setSourceFormat('unknown');
    setHasAlpha(false);
    imageRef.current = null;
    setPageMode('single');
  };

  const getBatchSettings = (): BatchConvertSettings => ({
    format: targetFormat,
    quality: quality / 100,
  });

  const availableTargets = getConversionTargets(sourceFormat);
  const showQualitySlider = targetFormat === 'jpeg' || targetFormat === 'webp';
  const showTransparencyWarning = hasAlpha && targetFormat === 'jpeg';
  const hasFiles = file || batchFiles.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
            <span className="text-3xl">🔄</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Image Format Converter</h1>
          <p className="text-gray-600 mt-2">Convert images between JPG, PNG, WebP and more</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!hasFiles ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => setPageMode('single')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageMode === 'single' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Single Image
                </button>
                <button
                  onClick={() => setPageMode('batch')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageMode === 'batch' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  Upload multiple images to convert them all at once
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
                        <div 
                          className="absolute inset-0"
                          style={{
                            backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                          }}
                        />
                        {preview && (
                          <img src={preview} alt="Preview" className="relative w-full h-full object-contain" style={{ maxHeight: '300px' }} />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <span className="font-medium">{formatFileSize(file.size)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                          {sourceFormat !== 'unknown' ? FORMAT_INFO[sourceFormat]?.name || sourceFormat.toUpperCase() : 'Unknown'}
                        </span>
                        <span className="text-gray-500">
                          {originalDimensions.width} × {originalDimensions.height} px
                        </span>
                        {hasAlpha && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            Has transparency
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Convert To</h3>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {availableTargets.map((format) => {
                          const info = FORMAT_INFO[format];
                          return (
                            <button
                              key={format}
                              onClick={() => setTargetFormat(format)}
                              className={`p-4 rounded-lg text-left transition-colors border-2 ${
                                targetFormat === format
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{info.icon}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{info.name}</p>
                                  <p className="text-sm text-gray-500">{info.desc}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {showQualitySlider && (
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

                      {showTransparencyWarning && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                          <p className="text-yellow-800">
                            ⚠️ Your image has transparency. Converting to JPEG will replace transparent areas with white.
                          </p>
                        </div>
                      )}

                      <div className="bg-orange-50 rounded-lg p-3 text-sm">
                        <p className="text-orange-800">
                          {FORMAT_INFO[sourceFormat as ImageFormat]?.name || 'Image'} → {FORMAT_INFO[targetFormat].name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isProcessing && <ProgressBar progress={progress} status="processing" />}

                  {result && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">✅</span>
                        <div className="flex-1">
                          <p className="font-medium text-green-800">Conversion complete!</p>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-green-600">Original</p>
                              <p className="font-medium text-green-800">{formatFileSize(result.originalSize)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-600">Converted</p>
                              <p className="font-medium text-green-800">{formatFileSize(result.blob.size)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!result ? (
                      <>
                        <Button onClick={handleConvert} loading={isProcessing} className="flex-1">
                          🔄 Convert to {FORMAT_INFO[targetFormat].name}
                        </Button>
                        <Button variant="outline" onClick={handleClear}>Remove</Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handleDownload} className="flex-1">📥 Download {FORMAT_INFO[targetFormat].name}</Button>
                        <Button variant="outline" onClick={handleClear}>Convert Another</Button>
                      </>
                    )}
                  </div>
                </>
              )}

              {pageMode === 'batch' && batchFiles.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Convert To</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {(['jpeg', 'png', 'webp'] as ImageFormat[]).map((format) => {
                          const info = FORMAT_INFO[format];
                          return (
                            <button
                              key={format}
                              onClick={() => setTargetFormat(format)}
                              className={`p-3 rounded-lg text-center transition-colors border-2 ${
                                targetFormat === format
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-2xl block mb-1">{info.icon}</span>
                              <p className="font-medium text-sm text-gray-900">{info.name}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
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
                      
                      <div className="bg-orange-50 rounded-lg p-3 text-sm">
                        <p className="text-orange-800">
                          All images will be converted to {FORMAT_INFO[targetFormat].name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <BatchProcessor
                    files={batchFiles}
                    operation="convert"
                    settings={getBatchSettings()}
                    onClear={handleClear}
                    actionLabel="Convert"
                    actionIcon="🔄"
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
