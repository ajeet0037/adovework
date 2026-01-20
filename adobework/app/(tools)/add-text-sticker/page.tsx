'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { triggerDownload } from '@/lib/utils/download';
import { getImageDimensions } from '@/lib/image';
import { TextLayerOptions, StickerLayerOptions, WatermarkOptions, Layer } from '@/lib/image/types';
import {
  TextLayer,
  TextToolbar,
  ShadowSettings,
  OutlineSettings,
  createTextLayer,
  FONT_FAMILIES,
} from '@/components/image/TextLayer';
import {
  StickerLayer,
  EmojiPicker,
  StickerToolbar,
  WatermarkLayer,
  WatermarkSettings,
  createStickerLayer,
  createWatermarkLayer,
} from '@/components/image/StickerLayer';

type ActiveTool = 'text' | 'emoji' | 'watermark' | null;

export default function AddTextStickerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(1);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setLayers([]);
    setSelectedLayerId(null);
    
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    
    const dims = await getImageDimensions(selectedFile);
    setOriginalDimensions(dims);
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
    };
    img.src = url;
  }, []);

  // Add text layer
  const handleAddText = useCallback(() => {
    const newLayer = createTextLayer(
      originalDimensions.width / 4,
      originalDimensions.height / 4
    );
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveTool('text');
  }, [originalDimensions]);

  // Add emoji/sticker
  const handleAddEmoji = useCallback((emoji: string) => {
    const newLayer = createStickerLayer(
      emoji,
      originalDimensions.width / 2 - 30,
      originalDimensions.height / 2 - 30,
      'emoji'
    );
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setShowEmojiPicker(false);
    setActiveTool('emoji');
  }, [originalDimensions]);

  // Add watermark
  const handleAddWatermark = useCallback(() => {
    const newLayer = createWatermarkLayer();
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveTool('watermark');
  }, []);

  // Update layer
  const handleUpdateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } as Layer : layer
    ));
  }, []);

  // Delete layer
  const handleDeleteLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  }, [selectedLayerId]);

  // Move layer up/down in z-order
  const handleMoveLayer = useCallback((id: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers;
    });
  }, []);

  // Deselect when clicking on canvas background
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
      setSelectedLayerId(null);
    }
  }, []);

  // Render layers to canvas and download
  const handleDownload = useCallback(async () => {
    if (!imageRef.current || !file) return;
    
    setIsProcessing(true);
    setProgress(20);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = originalDimensions.width;
      canvas.height = originalDimensions.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original image
      ctx.drawImage(imageRef.current, 0, 0);
      setProgress(40);

      // Draw layers in order
      for (const layer of layers) {
        if (layer.type === 'text') {
          const textLayer = layer as TextLayerOptions;
          ctx.save();
          ctx.translate(textLayer.x + textLayer.width / 2, textLayer.y + textLayer.height / 2);
          ctx.rotate((textLayer.rotation * Math.PI) / 180);
          ctx.globalAlpha = textLayer.opacity;

          // Set font
          let fontStyle = '';
          if (textLayer.italic) fontStyle += 'italic ';
          if (textLayer.bold) fontStyle += 'bold ';
          ctx.font = `${fontStyle}${textLayer.fontSize}px ${textLayer.fontFamily}`;
          ctx.textAlign = textLayer.textAlign;
          ctx.textBaseline = 'top';

          // Draw shadow
          if (textLayer.shadow?.enabled) {
            ctx.shadowColor = textLayer.shadow.color;
            ctx.shadowBlur = textLayer.shadow.blur;
            ctx.shadowOffsetX = textLayer.shadow.offsetX;
            ctx.shadowOffsetY = textLayer.shadow.offsetY;
          }

          // Draw outline
          if (textLayer.outline?.enabled) {
            ctx.strokeStyle = textLayer.outline.color;
            ctx.lineWidth = textLayer.outline.width * 2;
            ctx.strokeText(textLayer.text, -textLayer.width / 2, -textLayer.height / 2);
          }

          // Draw text
          ctx.fillStyle = textLayer.color;
          ctx.fillText(textLayer.text, -textLayer.width / 2, -textLayer.height / 2);

          ctx.restore();
        } else if (layer.type === 'emoji' || layer.type === 'sticker') {
          const stickerLayer = layer as StickerLayerOptions;
          ctx.save();
          ctx.translate(stickerLayer.x + stickerLayer.width / 2, stickerLayer.y + stickerLayer.height / 2);
          ctx.rotate((stickerLayer.rotation * Math.PI) / 180);
          ctx.globalAlpha = stickerLayer.opacity;

          if (stickerLayer.type === 'emoji') {
            ctx.font = `${Math.min(stickerLayer.width, stickerLayer.height) * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stickerLayer.content, 0, 0);
          }

          ctx.restore();
        } else if (layer.type === 'watermark') {
          const watermarkLayer = layer as WatermarkOptions;
          ctx.save();
          
          // Calculate position
          let x = watermarkLayer.x;
          let y = watermarkLayer.y;
          const padding = 20;
          
          switch (watermarkLayer.position) {
            case 'top-left':
              x = padding;
              y = padding + watermarkLayer.fontSize;
              break;
            case 'top-right':
              x = canvas.width - padding;
              y = padding + watermarkLayer.fontSize;
              break;
            case 'bottom-left':
              x = padding;
              y = canvas.height - padding;
              break;
            case 'bottom-right':
              x = canvas.width - padding;
              y = canvas.height - padding;
              break;
            case 'center':
              x = canvas.width / 2;
              y = canvas.height / 2;
              break;
          }

          ctx.translate(x, y);
          ctx.rotate((watermarkLayer.rotation * Math.PI) / 180);
          ctx.globalAlpha = watermarkLayer.opacity;
          ctx.font = `${watermarkLayer.fontSize}px ${watermarkLayer.fontFamily}`;
          ctx.fillStyle = watermarkLayer.color;
          ctx.textAlign = watermarkLayer.position.includes('right') ? 'right' : 
                          watermarkLayer.position === 'center' ? 'center' : 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(watermarkLayer.text, 0, 0);

          ctx.restore();
        }
      }

      setProgress(80);

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
  }, [file, layers, originalDimensions]);

  const handleClear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setLayers([]);
    setSelectedLayerId(null);
    imageRef.current = null;
  }, [preview]);

  // Calculate display scale
  const displayScale = zoom;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <span className="text-3xl">✏️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Add Text & Stickers</h1>
          <p className="text-gray-600 mt-2">Add text, emojis, stickers, and watermarks to your images</p>
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
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeTool === 'text' ? 'primary' : 'outline'}
                    onClick={handleAddText}
                    className="text-sm"
                  >
                    📝 Add Text
                  </Button>
                  <div className="relative">
                    <Button
                      variant={activeTool === 'emoji' ? 'primary' : 'outline'}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-sm"
                    >
                      😀 Add Emoji
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute top-full left-0 mt-2 z-50">
                        <EmojiPicker onSelect={handleAddEmoji} />
                      </div>
                    )}
                  </div>
                  <Button
                    variant={activeTool === 'watermark' ? 'primary' : 'outline'}
                    onClick={handleAddWatermark}
                    className="text-sm"
                  >
                    💧 Add Watermark
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Zoom:</span>
                  <input
                    type="range"
                    min={0.25}
                    max={2}
                    step={0.25}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500 w-12">{Math.round(zoom * 100)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Canvas area */}
                <div className="lg:col-span-3">
                  <div
                    ref={canvasContainerRef}
                    className="relative bg-gray-100 rounded-lg overflow-auto"
                    style={{ maxHeight: '600px' }}
                    onClick={handleCanvasClick}
                  >
                    {/* Checkerboard background */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      }}
                    />

                    <div
                      className="relative inline-block"
                      style={{
                        width: originalDimensions.width * displayScale,
                        height: originalDimensions.height * displayScale,
                      }}
                    >
                      {preview && (
                        <img
                          src={preview}
                          alt="Preview"
                          className="block pointer-events-none"
                          style={{
                            width: originalDimensions.width * displayScale,
                            height: originalDimensions.height * displayScale,
                          }}
                          draggable={false}
                        />
                      )}

                      {/* Render layers */}
                      {layers.map((layer) => {
                        if (layer.type === 'text') {
                          return (
                            <TextLayer
                              key={layer.id}
                              layer={layer as TextLayerOptions}
                              isSelected={selectedLayerId === layer.id}
                              scale={displayScale}
                              onSelect={() => {
                                setSelectedLayerId(layer.id);
                                setActiveTool('text');
                              }}
                              onUpdate={(updates) => handleUpdateLayer(layer.id, updates)}
                              onDelete={() => handleDeleteLayer(layer.id)}
                            />
                          );
                        } else if (layer.type === 'emoji' || layer.type === 'sticker') {
                          return (
                            <StickerLayer
                              key={layer.id}
                              layer={layer as StickerLayerOptions}
                              isSelected={selectedLayerId === layer.id}
                              scale={displayScale}
                              onSelect={() => {
                                setSelectedLayerId(layer.id);
                                setActiveTool('emoji');
                              }}
                              onUpdate={(updates) => handleUpdateLayer(layer.id, updates)}
                              onDelete={() => handleDeleteLayer(layer.id)}
                            />
                          );
                        } else if (layer.type === 'watermark') {
                          return (
                            <WatermarkLayer
                              key={layer.id}
                              layer={layer as WatermarkOptions}
                              isSelected={selectedLayerId === layer.id}
                              scale={displayScale}
                              canvasWidth={originalDimensions.width}
                              canvasHeight={originalDimensions.height}
                              onSelect={() => {
                                setSelectedLayerId(layer.id);
                                setActiveTool('watermark');
                              }}
                              onUpdate={(updates) => handleUpdateLayer(layer.id, updates)}
                              onDelete={() => handleDeleteLayer(layer.id)}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Side panel */}
                <div className="space-y-4">
                  {/* Layer list */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Layers ({layers.length})</h3>
                    {layers.length === 0 ? (
                      <p className="text-xs text-gray-500">No layers yet. Add text, emoji, or watermark.</p>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {[...layers].reverse().map((layer, index) => (
                          <div
                            key={layer.id}
                            className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer ${
                              selectedLayerId === layer.id ? 'bg-purple-100 text-purple-700' : 'bg-white hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedLayerId(layer.id)}
                          >
                            <span className="truncate flex-1">
                              {layer.type === 'text' && `📝 ${(layer as TextLayerOptions).text.substring(0, 15)}...`}
                              {(layer.type === 'emoji' || layer.type === 'sticker') && `😀 ${(layer as StickerLayerOptions).content}`}
                              {layer.type === 'watermark' && `💧 ${(layer as WatermarkOptions).text.substring(0, 15)}...`}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayer(layer.id, 'up');
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Move up"
                                disabled={index === 0}
                              >
                                ↑
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayer(layer.id, 'down');
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Move down"
                                disabled={index === layers.length - 1}
                              >
                                ↓
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLayer(layer.id);
                                }}
                                className="p-1 hover:bg-red-100 text-red-500 rounded"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Layer settings */}
                  {selectedLayer && (
                    <div className="space-y-3">
                      {selectedLayer.type === 'text' && (
                        <>
                          <TextToolbar
                            layer={selectedLayer as TextLayerOptions}
                            onUpdate={(updates) => handleUpdateLayer(selectedLayer.id, updates)}
                          />
                          <ShadowSettings
                            shadow={(selectedLayer as TextLayerOptions).shadow}
                            onUpdate={(shadow) => handleUpdateLayer(selectedLayer.id, { shadow })}
                          />
                          <OutlineSettings
                            outline={(selectedLayer as TextLayerOptions).outline}
                            onUpdate={(outline) => handleUpdateLayer(selectedLayer.id, { outline })}
                          />
                        </>
                      )}

                      {(selectedLayer.type === 'emoji' || selectedLayer.type === 'sticker') && (
                        <StickerToolbar
                          layer={selectedLayer as StickerLayerOptions}
                          onUpdate={(updates) => handleUpdateLayer(selectedLayer.id, updates)}
                        />
                      )}

                      {selectedLayer.type === 'watermark' && (
                        <WatermarkSettings
                          layer={selectedLayer as WatermarkOptions}
                          onUpdate={(updates) => handleUpdateLayer(selectedLayer.id, updates)}
                        />
                      )}
                    </div>
                  )}

                  {/* Quick tips */}
                  <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-700">
                    <p className="font-medium mb-1">💡 Tips:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Double-click text to edit</li>
                      <li>Drag corners to resize</li>
                      <li>Press Delete to remove selected</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <ProgressBar progress={progress} status="processing" />
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleDownload}
                  loading={isProcessing}
                  disabled={layers.length === 0}
                  className="flex-1"
                >
                  📥 Download Image
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
