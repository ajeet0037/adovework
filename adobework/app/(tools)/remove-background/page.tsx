'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  BackgroundOptions,
  BackgroundSettings,
  DEFAULT_BACKGROUND_SETTINGS
} from '@/components/image/BackgroundOptions';
import { triggerDownload } from '@/lib/utils/download';
import {
  removeBackground,
  replaceBackgroundWithColor,
  replaceBackgroundWithGradient,
  replaceBackgroundWithImage,
  getImageDimensionsFromBlob,
} from '@/lib/image/backgroundRemove';

type ProcessingStage = 'idle' | 'loading-model' | 'removing' | 'applying-bg' | 'complete';

export default function RemoveBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [foregroundBlob, setForegroundBlob] = useState<Blob | null>(null);
  const [foregroundPreview, setForegroundPreview] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>(DEFAULT_BACKGROUND_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);

  const compareRef = useRef<HTMLDivElement>(null);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (foregroundPreview) URL.revokeObjectURL(foregroundPreview);
      if (resultPreview) URL.revokeObjectURL(resultPreview);
    };
  }, []);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    setForegroundBlob(null);
    setForegroundPreview(null);
    setResultBlob(null);
    setResultPreview(null);

    // Create preview
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);

    // Get dimensions
    const dims = await getImageDimensionsFromBlob(selectedFile);
    setDimensions(dims);

    // Auto-start background removal
    await processBackgroundRemoval(selectedFile);
  }, []);

  const processBackgroundRemoval = async (imageFile: File) => {
    setStage('loading-model');
    setProgress(0);
    setProgressMessage('Loading AI model...');

    try {
      const result = await removeBackground(imageFile, {
        model: 'isnet_fp16', // Better quality model
        progress: (prog, message) => {
          setProgress(prog);
          setProgressMessage(message || 'Processing...');
          if (message?.includes('compute')) {
            setStage('removing');
          }
        },
      });

      setForegroundBlob(result.foreground);
      const fgUrl = URL.createObjectURL(result.foreground);
      setForegroundPreview(fgUrl);

      // Apply initial background (transparent)
      setResultBlob(result.foreground);
      setResultPreview(fgUrl);

      setStage('complete');
      setProgress(100);
      setProgressMessage('Background removed!');
    } catch (err) {
      console.error('Background removal failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove background');
      setStage('idle');
    }
  };

  const applyBackground = useCallback(async () => {
    if (!foregroundBlob) return;

    setStage('applying-bg');
    setProgress(50);
    setProgressMessage('Applying background...');

    try {
      let newResult: Blob;

      switch (backgroundSettings.type) {
        case 'transparent':
          newResult = foregroundBlob;
          break;
        case 'solid':
          newResult = await replaceBackgroundWithColor(
            foregroundBlob,
            backgroundSettings.color,
            dimensions.width,
            dimensions.height
          );
          break;
        case 'gradient':
          newResult = await replaceBackgroundWithGradient(
            foregroundBlob,
            backgroundSettings.gradient,
            dimensions.width,
            dimensions.height
          );
          break;
        case 'image':
          if (!backgroundSettings.customImage) {
            newResult = foregroundBlob;
          } else {
            newResult = await replaceBackgroundWithImage(
              foregroundBlob,
              backgroundSettings.customImage,
              dimensions.width,
              dimensions.height
            );
          }
          break;
        default:
          newResult = foregroundBlob;
      }

      // Cleanup old result preview
      if (resultPreview && resultPreview !== foregroundPreview) {
        URL.revokeObjectURL(resultPreview);
      }

      setResultBlob(newResult);
      setResultPreview(URL.createObjectURL(newResult));
      setStage('complete');
      setProgress(100);
      setProgressMessage('Background applied!');
    } catch (err) {
      console.error('Failed to apply background:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply background');
      setStage('complete');
    }
  }, [foregroundBlob, backgroundSettings, dimensions, resultPreview, foregroundPreview]);

  // Apply background when settings change
  useEffect(() => {
    if (foregroundBlob && stage === 'complete') {
      applyBackground();
    }
  }, [backgroundSettings]);

  const handleDownload = () => {
    if (resultBlob && file) {
      const ext = backgroundSettings.type === 'transparent' ? 'png' : 'png';
      const suffix = backgroundSettings.type === 'transparent' ? '_nobg' : '_newbg';
      const filename = file.name.replace(/\.[^.]+$/, `${suffix}.${ext}`);
      triggerDownload({ blob: resultBlob, filename });
    }
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (foregroundPreview) URL.revokeObjectURL(foregroundPreview);
    if (resultPreview && resultPreview !== foregroundPreview) URL.revokeObjectURL(resultPreview);

    setFile(null);
    setPreview(null);
    setForegroundBlob(null);
    setForegroundPreview(null);
    setResultBlob(null);
    setResultPreview(null);
    setDimensions({ width: 0, height: 0 });
    setStage('idle');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setBackgroundSettings(DEFAULT_BACKGROUND_SETTINGS);
    setCompareMode(false);
  };

  const handleCompareMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!compareRef.current || !compareMode) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setComparePosition(Math.max(0, Math.min(100, percentage)));
  };

  const isProcessing = stage === 'loading-model' || stage === 'removing' || stage === 'applying-bg';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <span className="text-3xl">✂️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Background Remover</h1>
          <p className="text-gray-600 mt-2">Remove backgrounds instantly with AI - 100% free, works offline</p>
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
                <p>🔒 Your images are processed locally - nothing is uploaded to any server</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <ProgressBar progress={progress} status="processing" />
                  <p className="text-sm text-center text-gray-600">{progressMessage}</p>
                  {stage === 'loading-model' && (
                    <p className="text-xs text-center text-gray-500">
                      💡 First-time use may take 30-60 seconds to download the AI model
                    </p>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="font-medium text-red-700">Processing Failed</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                      <button
                        onClick={() => {
                          setError(null);
                          if (file) processBackgroundRemoval(file);
                        }}
                        className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🔄 Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview Area */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Compare Toggle */}
                  {stage === 'complete' && (
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Result</h3>
                      <button
                        onClick={() => setCompareMode(!compareMode)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${compareMode ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {compareMode ? '🔍 Comparing' : '🔍 Compare'}
                      </button>
                    </div>
                  )}

                  {/* Image Preview */}
                  <div
                    ref={compareRef}
                    className="relative bg-gray-100 rounded-lg overflow-hidden"
                    style={{
                      minHeight: '300px',
                      backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                    onMouseMove={handleCompareMouseMove}
                  >
                    {compareMode && preview && resultPreview ? (
                      <>
                        {/* Original (left side) */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${comparePosition}%` }}
                        >
                          <img
                            src={preview}
                            alt="Original"
                            className="w-full h-full object-contain"
                            style={{ maxHeight: '400px' }}
                          />
                        </div>
                        {/* Result (full, behind) */}
                        <img
                          src={resultPreview}
                          alt="Result"
                          className="w-full h-full object-contain"
                          style={{ maxHeight: '400px' }}
                        />
                        {/* Divider */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                          style={{ left: `${comparePosition}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow">
                            <span className="text-xs">↔️</span>
                          </div>
                        </div>
                        {/* Labels */}
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Original
                        </div>
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Result
                        </div>
                      </>
                    ) : (
                      <img
                        src={resultPreview || foregroundPreview || preview || ''}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        style={{ maxHeight: '400px' }}
                      />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span>{dimensions.width} × {dimensions.height} px</span>
                  </div>
                </div>

                {/* Background Options Panel */}
                <div className="space-y-4">
                  <BackgroundOptions
                    settings={backgroundSettings}
                    onChange={setBackgroundSettings}
                    disabled={!foregroundBlob || isProcessing}
                  />

                  {/* Info Box */}
                  <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-800">
                    <p>💡 Tip: For best results, use images with clear subjects and good lighting.</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {stage === 'complete' && resultBlob ? (
                  <>
                    <Button onClick={handleDownload} className="flex-1">
                      📥 Download {backgroundSettings.type === 'transparent' ? 'PNG (Transparent)' : 'PNG'}
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                      Process Another
                    </Button>
                  </>
                ) : (
                  <>
                    <Button disabled={isProcessing} loading={isProcessing} className="flex-1">
                      {isProcessing ? 'Processing...' : 'Processing'}
                    </Button>
                    <Button variant="outline" onClick={handleClear} disabled={isProcessing}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <span className="text-3xl mb-3 block">🤖</span>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600">
              Advanced machine learning model removes backgrounds with precision, even for complex subjects like hair.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <span className="text-3xl mb-3 block">🔒</span>
            <h3 className="font-semibold text-gray-900 mb-2">100% Private</h3>
            <p className="text-sm text-gray-600">
              All processing happens in your browser. Your images never leave your device.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <span className="text-3xl mb-3 block">🎨</span>
            <h3 className="font-semibold text-gray-900 mb-2">Custom Backgrounds</h3>
            <p className="text-sm text-gray-600">
              Replace with solid colors, beautiful gradients, or your own custom images.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
