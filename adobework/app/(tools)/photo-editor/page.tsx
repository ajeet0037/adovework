'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { triggerDownload } from '@/lib/utils/download';
import {
  applyFilters,
  getDefaultFilterOptions,
  clampFilterValue,
  isNeutralFilter,
  getImageDimensions,
  HistoryManager,
  canvasToBlobUrl,
  FilterOptions,
  FILTER_PRESETS,
} from '@/lib/image';

type FilterKey = keyof FilterOptions;

const FILTER_CONTROLS: { key: FilterKey; label: string; icon: string; min: number; max: number }[] = [
  { key: 'brightness', label: 'Brightness', icon: '☀️', min: -100, max: 100 },
  { key: 'contrast', label: 'Contrast', icon: '◐', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', icon: '🎨', min: -100, max: 100 },
  { key: 'exposure', label: 'Exposure', icon: '📷', min: -100, max: 100 },
  { key: 'blur', label: 'Blur', icon: '💨', min: 0, max: 20 },
  { key: 'sharpen', label: 'Sharpen', icon: '🔪', min: 0, max: 100 },
];

export default function PhotoEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [filters, setFilters] = useState<FilterOptions>(getDefaultFilterOptions());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'adjust' | 'presets'>('adjust');
  
  const imageRef = useRef<HTMLImageElement | null>(null);
  const historyRef = useRef<HistoryManager>(new HistoryManager(20));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setFilters(getDefaultFilterOptions());
    setProcessedPreview(null);
    historyRef.current.clear();
    
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    setProcessedPreview(url);
    
    const dims = await getImageDimensions(selectedFile);
    setOriginalDimensions(dims);
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      historyRef.current.push(JSON.stringify(getDefaultFilterOptions()), 'initial');
      updateHistoryState();
    };
    img.src = url;
  }, [updateHistoryState]);

  // Apply filters with debounce for real-time preview
  useEffect(() => {
    if (!imageRef.current || !preview) return;
    
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(async () => {
      if (isNeutralFilter(filters)) {
        setProcessedPreview(preview);
        return;
      }
      
      try {
        const canvas = await applyFilters(imageRef.current!, filters);
        const blobUrl = await canvasToBlobUrl(canvas);
        
        // Revoke old processed preview if different from original
        if (processedPreview && processedPreview !== preview) {
          URL.revokeObjectURL(processedPreview);
        }
        
        setProcessedPreview(blobUrl);
      } catch (error) {
        console.error('Filter preview failed:', error);
      }
    }, 100);
    
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [filters, preview]);

  const handleFilterChange = (key: FilterKey, value: number) => {
    const clampedValue = clampFilterValue(key, value);
    setFilters(prev => ({ ...prev, [key]: clampedValue }));
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = FILTER_PRESETS[presetName as keyof typeof FILTER_PRESETS];
    if (preset) {
      setFilters({
        ...getDefaultFilterOptions(),
        ...preset,
      });
    }
  };

  const handleReset = () => {
    setFilters(getDefaultFilterOptions());
  };

  const handleApply = () => {
    historyRef.current.push(JSON.stringify(filters), 'apply');
    updateHistoryState();
  };

  const handleUndo = () => {
    const state = historyRef.current.undo();
    if (state) {
      try {
        const savedFilters = JSON.parse(state.imageData);
        setFilters(savedFilters);
        updateHistoryState();
      } catch {
        // Handle legacy blob URL states
      }
    }
  };

  const handleRedo = () => {
    const state = historyRef.current.redo();
    if (state) {
      try {
        const savedFilters = JSON.parse(state.imageData);
        setFilters(savedFilters);
        updateHistoryState();
      } catch {
        // Handle legacy blob URL states
      }
    }
  };

  const handleDownload = async () => {
    if (!imageRef.current || !file) return;
    
    setIsProcessing(true);
    setProgress(30);
    
    try {
      const canvas = await applyFilters(imageRef.current, filters);
      setProgress(70);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = file.name.replace(/\.[^.]+$/, '_edited.png');
          triggerDownload({ blob, filename });
        }
        setProgress(100);
        setIsProcessing(false);
      }, 'image/png');
    } catch (error) {
      console.error('Download failed:', error);
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (processedPreview && processedPreview !== preview) {
      URL.revokeObjectURL(processedPreview);
    }
    setFile(null);
    setPreview(null);
    setProcessedPreview(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setFilters(getDefaultFilterOptions());
    imageRef.current = null;
    historyRef.current.clear();
    updateHistoryState();
  };

  const hasChanges = !isNeutralFilter(filters);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-2xl mb-4">
            <span className="text-3xl">🎨</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Photo Editor</h1>
          <p className="text-gray-600 mt-2">Adjust brightness, contrast, saturation and apply filters</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!file ? (
            <FileDropzone
              acceptedFormats={['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']}
              maxFileSize={50 * 1024 * 1024}
              maxFiles={1}
              onFilesSelected={handleFileSelect}
            />
          ) : (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Undo"
                  >
                    ↩️
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Redo"
                  >
                    ↪️
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    {originalDimensions.width} × {originalDimensions.height} px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={!hasChanges}
                    className="px-3 py-1.5 text-sm bg-pink-100 text-pink-700 hover:bg-pink-200 rounded-lg disabled:opacity-40"
                  >
                    Save to History
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image Preview */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                    {/* Checkerboard for transparency */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      }}
                    />
                    {processedPreview && (
                      <img
                        src={processedPreview}
                        alt="Preview"
                        className="relative w-full h-full object-contain"
                        style={{ maxHeight: '500px' }}
                      />
                    )}
                  </div>
                </div>

                {/* Controls Panel */}
                <div className="space-y-4">
                  {/* Tab selector */}
                  <div className="flex gap-2 border-b border-gray-200 pb-2">
                    <button
                      onClick={() => setActiveTab('adjust')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'adjust' ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      🎚️ Adjust
                    </button>
                    <button
                      onClick={() => setActiveTab('presets')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'presets' ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      ✨ Presets
                    </button>
                  </div>

                  {activeTab === 'adjust' && (
                    <div className="space-y-4">
                      {FILTER_CONTROLS.map(({ key, label, icon, min, max }) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-medium text-gray-700">
                              {icon} {label}
                            </label>
                            <span className="text-sm text-gray-500">{filters[key]}</span>
                          </div>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            value={filters[key]}
                            onChange={(e) => handleFilterChange(key, Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'presets' && (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(FILTER_PRESETS).map((presetName) => (
                        <button
                          key={presetName}
                          onClick={() => handlePresetSelect(presetName)}
                          className="p-3 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 text-left transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-900 capitalize">{presetName}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Current values summary */}
                  {hasChanges && (
                    <div className="bg-pink-50 rounded-lg p-3 text-sm">
                      <p className="text-pink-800 font-medium mb-1">Active adjustments:</p>
                      <div className="text-pink-700 text-xs space-y-0.5">
                        {Object.entries(filters).map(([key, value]) => 
                          value !== 0 && (
                            <div key={key}>{key}: {value}</div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <ProgressBar progress={progress} status="processing" />
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={handleDownload} loading={isProcessing} className="flex-1">
                  📥 Download Edited Image
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
