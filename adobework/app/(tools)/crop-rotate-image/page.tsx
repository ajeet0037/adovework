'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { triggerDownload } from '@/lib/utils/download';
import {
  cropImage,
  rotate90,
  rotate180,
  flipHorizontal,
  flipVertical,
  straightenImage,
  calculateCropWithAspectRatio,
  getImageDimensions,
  HistoryManager,
  canvasToBlobUrl,
} from '@/lib/image';

type AspectRatioPreset = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | 'free';

const ASPECT_RATIOS: Record<AspectRatioPreset, number | null> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '3:2': 3 / 2,
  '2:3': 2 / 3,
  'free': null,
};

export default function CropRotateImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('free');
  const [straightenAngle, setStraightenAngle] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'crop' | 'rotate'>('crop');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const historyRef = useRef<HistoryManager>(new HistoryManager(20));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Crop interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    historyRef.current.clear();
    
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    
    const dims = await getImageDimensions(selectedFile);
    setOriginalDimensions(dims);
    setCropArea({ x: 0, y: 0, width: dims.width, height: dims.height });
    setStraightenAngle(0);
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      historyRef.current.push(url, 'initial');
      updateHistoryState();
    };
    img.src = url;
  }, [updateHistoryState]);

  // Calculate display scale based on container size
  useEffect(() => {
    if (!containerRef.current || !originalDimensions.width) return;
    
    const containerWidth = containerRef.current.clientWidth - 32;
    const maxHeight = 400;
    
    const scaleX = containerWidth / originalDimensions.width;
    const scaleY = maxHeight / originalDimensions.height;
    setDisplayScale(Math.min(scaleX, scaleY, 1));
  }, [originalDimensions]);

  const handleAspectRatioChange = (preset: AspectRatioPreset) => {
    setAspectRatio(preset);
    
    if (preset !== 'free' && ASPECT_RATIOS[preset]) {
      const newCrop = calculateCropWithAspectRatio(
        originalDimensions.width,
        originalDimensions.height,
        ASPECT_RATIOS[preset]!
      );
      setCropArea(newCrop);
    }
  };

  const applyTransform = async (
    transformFn: (canvas: HTMLCanvasElement) => Promise<HTMLCanvasElement>,
    operationName: string
  ) => {
    if (!imageRef.current) return;
    
    setIsProcessing(true);
    setProgress(30);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imageRef.current, 0, 0);
      
      setProgress(60);
      
      const resultCanvas = await transformFn(canvas);
      const blobUrl = await canvasToBlobUrl(resultCanvas);
      
      setProgress(90);
      
      // Update preview and image ref
      if (preview) URL.revokeObjectURL(preview);
      setPreview(blobUrl);
      
      const newImg = new Image();
      newImg.onload = () => {
        imageRef.current = newImg;
        setOriginalDimensions({ width: newImg.width, height: newImg.height });
        setCropArea({ x: 0, y: 0, width: newImg.width, height: newImg.height });
        historyRef.current.push(blobUrl, operationName);
        updateHistoryState();
        setProgress(100);
        setIsProcessing(false);
      };
      newImg.src = blobUrl;
    } catch (error) {
      console.error('Transform failed:', error);
      setIsProcessing(false);
    }
  };

  const handleRotate90 = () => applyTransform(rotate90, 'rotate90');
  const handleRotate180 = () => applyTransform(rotate180, 'rotate180');
  const handleFlipH = () => applyTransform(flipHorizontal, 'flipH');
  const handleFlipV = () => applyTransform(flipVertical, 'flipV');
  
  const handleStraighten = () => {
    if (straightenAngle === 0) return;
    applyTransform(
      (canvas) => straightenImage(canvas, straightenAngle),
      `straighten${straightenAngle}`
    );
    setStraightenAngle(0);
  };

  const handleCrop = async () => {
    if (!imageRef.current) return;
    
    setIsProcessing(true);
    setProgress(30);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imageRef.current, 0, 0);
      
      setProgress(60);
      
      const croppedCanvas = await cropImage(canvas, cropArea);
      const blobUrl = await canvasToBlobUrl(croppedCanvas);
      
      setProgress(90);
      
      if (preview) URL.revokeObjectURL(preview);
      setPreview(blobUrl);
      
      const newImg = new Image();
      newImg.onload = () => {
        imageRef.current = newImg;
        setOriginalDimensions({ width: newImg.width, height: newImg.height });
        setCropArea({ x: 0, y: 0, width: newImg.width, height: newImg.height });
        historyRef.current.push(blobUrl, 'crop');
        updateHistoryState();
        setProgress(100);
        setIsProcessing(false);
      };
      newImg.src = blobUrl;
    } catch (error) {
      console.error('Crop failed:', error);
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    const state = historyRef.current.undo();
    if (state) {
      setPreview(state.imageData);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setOriginalDimensions({ width: img.width, height: img.height });
        setCropArea({ x: 0, y: 0, width: img.width, height: img.height });
        updateHistoryState();
      };
      img.src = state.imageData;
    }
  };

  const handleRedo = () => {
    const state = historyRef.current.redo();
    if (state) {
      setPreview(state.imageData);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setOriginalDimensions({ width: img.width, height: img.height });
        setCropArea({ x: 0, y: 0, width: img.width, height: img.height });
        updateHistoryState();
      };
      img.src = state.imageData;
    }
  };

  const handleDownload = async () => {
    if (!imageRef.current || !file) return;
    
    setIsProcessing(true);
    setProgress(50);
    
    const canvas = document.createElement('canvas');
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imageRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const filename = file.name.replace(/\.[^.]+$/, '_edited.png');
        triggerDownload({ blob, filename });
      }
      setProgress(100);
      setIsProcessing(false);
    }, 'image/png');
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    setStraightenAngle(0);
    imageRef.current = null;
    historyRef.current.clear();
    updateHistoryState();
  };

  // Crop drag handlers
  const getMousePos = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - 16) / displayScale,
      y: (e.clientY - rect.top - 16) / displayScale,
    };
  };

  const getHandle = (x: number, y: number) => {
    const handleSize = 15 / displayScale;
    const { x: cx, y: cy, width: cw, height: ch } = cropArea;
    
    if (Math.abs(x - cx) < handleSize && Math.abs(y - cy) < handleSize) return 'tl';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - cy) < handleSize) return 'tr';
    if (Math.abs(x - cx) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'bl';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'br';
    if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'move';
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTab !== 'crop') return;
    const pos = getMousePos(e);
    const handle = getHandle(pos.x, pos.y);
    if (handle) {
      setIsDragging(true);
      setDragStart(pos);
      setDragHandle(handle);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const pos = getMousePos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    
    let newArea = { ...cropArea };
    const ratio = aspectRatio !== 'free' ? ASPECT_RATIOS[aspectRatio] : null;
    
    switch (dragHandle) {
      case 'move':
        newArea.x = Math.max(0, Math.min(originalDimensions.width - cropArea.width, cropArea.x + dx));
        newArea.y = Math.max(0, Math.min(originalDimensions.height - cropArea.height, cropArea.y + dy));
        break;
      case 'br':
        newArea.width = Math.max(20, cropArea.width + dx);
        newArea.height = ratio ? newArea.width / ratio : Math.max(20, cropArea.height + dy);
        break;
      case 'bl':
        const newWidthBl = Math.max(20, cropArea.width - dx);
        newArea.x = cropArea.x + cropArea.width - newWidthBl;
        newArea.width = newWidthBl;
        newArea.height = ratio ? newArea.width / ratio : Math.max(20, cropArea.height + dy);
        break;
      case 'tr':
        newArea.width = Math.max(20, cropArea.width + dx);
        const newHeightTr = ratio ? newArea.width / ratio : Math.max(20, cropArea.height - dy);
        newArea.y = cropArea.y + cropArea.height - newHeightTr;
        newArea.height = newHeightTr;
        break;
      case 'tl':
        const newWidthTl = Math.max(20, cropArea.width - dx);
        const newHeightTl = ratio ? newWidthTl / ratio : Math.max(20, cropArea.height - dy);
        newArea.x = cropArea.x + cropArea.width - newWidthTl;
        newArea.y = cropArea.y + cropArea.height - newHeightTl;
        newArea.width = newWidthTl;
        newArea.height = newHeightTl;
        break;
    }
    
    // Clamp to bounds
    newArea.x = Math.max(0, newArea.x);
    newArea.y = Math.max(0, newArea.y);
    if (newArea.x + newArea.width > originalDimensions.width) {
      newArea.width = originalDimensions.width - newArea.x;
    }
    if (newArea.y + newArea.height > originalDimensions.height) {
      newArea.height = originalDimensions.height - newArea.y;
    }
    
    setCropArea(newArea);
    setDragStart(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <span className="text-3xl">✂️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Crop & Rotate Image</h1>
          <p className="text-gray-600 mt-2">Crop, rotate, flip, and straighten your images</p>
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
              {/* Undo/Redo toolbar */}
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

              {/* Tab selector */}
              <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                  onClick={() => setActiveTab('crop')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'crop' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ✂️ Crop
                </button>
                <button
                  onClick={() => setActiveTab('rotate')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'rotate' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🔄 Rotate & Flip
                </button>
              </div>

              {/* Image preview with crop overlay */}
              <div
                ref={containerRef}
                className="relative bg-gray-100 rounded-lg overflow-hidden p-4 select-none"
                style={{ minHeight: '300px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {preview && (
                  <div className="relative inline-block" style={{
                    width: originalDimensions.width * displayScale,
                    height: originalDimensions.height * displayScale,
                  }}>
                    <img
                      src={preview}
                      alt="Preview"
                      className="block"
                      style={{
                        width: originalDimensions.width * displayScale,
                        height: originalDimensions.height * displayScale,
                      }}
                      draggable={false}
                    />
                    
                    {/* Crop overlay */}
                    {activeTab === 'crop' && (
                      <>
                        {/* Dark overlay outside crop area */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(to right, 
                              rgba(0,0,0,0.5) ${cropArea.x * displayScale}px, 
                              transparent ${cropArea.x * displayScale}px, 
                              transparent ${(cropArea.x + cropArea.width) * displayScale}px, 
                              rgba(0,0,0,0.5) ${(cropArea.x + cropArea.width) * displayScale}px)`,
                          }}
                        />
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: cropArea.x * displayScale,
                            top: 0,
                            width: cropArea.width * displayScale,
                            height: cropArea.y * displayScale,
                            background: 'rgba(0,0,0,0.5)',
                          }}
                        />
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: cropArea.x * displayScale,
                            top: (cropArea.y + cropArea.height) * displayScale,
                            width: cropArea.width * displayScale,
                            height: (originalDimensions.height - cropArea.y - cropArea.height) * displayScale,
                            background: 'rgba(0,0,0,0.5)',
                          }}
                        />
                        
                        {/* Crop border */}
                        <div
                          className="absolute border-2 border-white pointer-events-none"
                          style={{
                            left: cropArea.x * displayScale,
                            top: cropArea.y * displayScale,
                            width: cropArea.width * displayScale,
                            height: cropArea.height * displayScale,
                          }}
                        >
                          {/* Grid lines */}
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                            {[...Array(9)].map((_, i) => (
                              <div key={i} className="border border-white/30" />
                            ))}
                          </div>
                        </div>
                        
                        {/* Corner handles */}
                        {['tl', 'tr', 'bl', 'br'].map((pos) => {
                          const isLeft = pos.includes('l');
                          const isTop = pos.includes('t');
                          return (
                            <div
                              key={pos}
                              className="absolute w-4 h-4 bg-white border-2 border-purple-500 rounded-sm cursor-pointer"
                              style={{
                                left: (isLeft ? cropArea.x : cropArea.x + cropArea.width) * displayScale - 8,
                                top: (isTop ? cropArea.y : cropArea.y + cropArea.height) * displayScale - 8,
                              }}
                            />
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              {activeTab === 'crop' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(ASPECT_RATIOS) as AspectRatioPreset[]).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => handleAspectRatioChange(ratio)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            aspectRatio === ratio
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {ratio === 'free' ? 'Free' : ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3 text-sm">
                    <p className="text-purple-800">
                      Crop: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
                    </p>
                  </div>
                  
                  <Button onClick={handleCrop} loading={isProcessing} className="w-full">
                    ✂️ Apply Crop
                  </Button>
                </div>
              )}

              {activeTab === 'rotate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Rotate</label>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleRotate90} disabled={isProcessing}>
                        ↻ 90°
                      </Button>
                      <Button variant="outline" onClick={handleRotate180} disabled={isProcessing}>
                        ↻ 180°
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Flip</label>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleFlipH} disabled={isProcessing}>
                        ↔️ Horizontal
                      </Button>
                      <Button variant="outline" onClick={handleFlipV} disabled={isProcessing}>
                        ↕️ Vertical
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Straighten: {straightenAngle}°
                    </label>
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      value={straightenAngle}
                      onChange={(e) => setStraightenAngle(Number(e.target.value))}
                      className="w-full"
                    />
                    <Button
                      variant="outline"
                      onClick={handleStraighten}
                      disabled={isProcessing || straightenAngle === 0}
                      className="mt-2"
                    >
                      Apply Straighten
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress */}
              {isProcessing && (
                <ProgressBar progress={progress} status="processing" />
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={handleDownload} loading={isProcessing} className="flex-1">
                  📥 Download
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
