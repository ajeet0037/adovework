'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface ImageCanvasProps {
  imageSrc: string | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  zoom?: number;
  tool?: 'select' | 'crop' | 'brush' | 'text';
  cropArea?: { x: number; y: number; width: number; height: number } | null;
  onCropChange?: (area: { x: number; y: number; width: number; height: number }) => void;
  className?: string;
}

export function ImageCanvas({
  imageSrc,
  onCanvasReady,
  zoom = 1,
  tool = 'select',
  cropArea,
  onCropChange,
  className = '',
}: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragHandle, setDragHandle] = useState<string | null>(null);

  // Load image onto canvas
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
      onCanvasReady?.(canvas);
    };

    img.onerror = () => {
      console.error('Failed to load image');
      setImageLoaded(false);
    };

    img.src = imageSrc;
  }, [imageSrc, onCanvasReady]);

  // Draw crop overlay
  useEffect(() => {
    if (!overlayCanvasRef.current || !imageLoaded || tool !== 'crop') return;

    const overlay = overlayCanvasRef.current;
    const ctx = overlay.getContext('2d')!;
    
    overlay.width = imageDimensions.width;
    overlay.height = imageDimensions.height;
    
    // Clear overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (cropArea) {
      // Draw semi-transparent overlay outside crop area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, overlay.width, overlay.height);
      
      // Clear the crop area
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      
      // Draw crop border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      
      // Draw corner handles
      const handleSize = 10;
      ctx.fillStyle = '#3b82f6';
      
      // Top-left
      ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
      // Top-right
      ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
      // Bottom-left
      ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
      // Bottom-right
      ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
      
      // Draw grid lines (rule of thirds)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      
      const thirdW = cropArea.width / 3;
      const thirdH = cropArea.height / 3;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(cropArea.x + thirdW, cropArea.y);
      ctx.lineTo(cropArea.x + thirdW, cropArea.y + cropArea.height);
      ctx.moveTo(cropArea.x + thirdW * 2, cropArea.y);
      ctx.lineTo(cropArea.x + thirdW * 2, cropArea.y + cropArea.height);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(cropArea.x, cropArea.y + thirdH);
      ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + thirdH);
      ctx.moveTo(cropArea.x, cropArea.y + thirdH * 2);
      ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + thirdH * 2);
      ctx.stroke();
    }
  }, [cropArea, imageLoaded, imageDimensions, tool]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = imageDimensions.width / (rect.width * zoom);
    const scaleY = imageDimensions.height / (rect.height * zoom);
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [imageDimensions, zoom]);

  // Check which handle is being clicked
  const getHandle = useCallback((x: number, y: number) => {
    if (!cropArea) return null;
    
    const handleSize = 15;
    const { x: cx, y: cy, width: cw, height: ch } = cropArea;
    
    // Check corners
    if (Math.abs(x - cx) < handleSize && Math.abs(y - cy) < handleSize) return 'tl';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - cy) < handleSize) return 'tr';
    if (Math.abs(x - cx) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'bl';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'br';
    
    // Check if inside crop area (for moving)
    if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'move';
    
    return null;
  }, [cropArea]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool !== 'crop' || !cropArea) return;
    
    const pos = getMousePos(e);
    const handle = getHandle(pos.x, pos.y);
    
    if (handle) {
      setIsDragging(true);
      setDragStart(pos);
      setDragHandle(handle);
    }
  }, [tool, cropArea, getMousePos, getHandle]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !cropArea || !onCropChange) return;
    
    const pos = getMousePos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    
    let newArea = { ...cropArea };
    
    switch (dragHandle) {
      case 'move':
        newArea.x = Math.max(0, Math.min(imageDimensions.width - cropArea.width, cropArea.x + dx));
        newArea.y = Math.max(0, Math.min(imageDimensions.height - cropArea.height, cropArea.y + dy));
        break;
      case 'tl':
        newArea.x = Math.max(0, cropArea.x + dx);
        newArea.y = Math.max(0, cropArea.y + dy);
        newArea.width = cropArea.width - dx;
        newArea.height = cropArea.height - dy;
        break;
      case 'tr':
        newArea.y = Math.max(0, cropArea.y + dy);
        newArea.width = cropArea.width + dx;
        newArea.height = cropArea.height - dy;
        break;
      case 'bl':
        newArea.x = Math.max(0, cropArea.x + dx);
        newArea.width = cropArea.width - dx;
        newArea.height = cropArea.height + dy;
        break;
      case 'br':
        newArea.width = cropArea.width + dx;
        newArea.height = cropArea.height + dy;
        break;
    }
    
    // Ensure minimum size
    if (newArea.width < 20) newArea.width = 20;
    if (newArea.height < 20) newArea.height = 20;
    
    // Ensure within bounds
    if (newArea.x + newArea.width > imageDimensions.width) {
      newArea.width = imageDimensions.width - newArea.x;
    }
    if (newArea.y + newArea.height > imageDimensions.height) {
      newArea.height = imageDimensions.height - newArea.y;
    }
    
    onCropChange(newArea);
    setDragStart(pos);
  }, [isDragging, cropArea, dragHandle, dragStart, imageDimensions, getMousePos, onCropChange]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  // Calculate display size
  const displayWidth = imageDimensions.width * zoom;
  const displayHeight = imageDimensions.height * zoom;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto bg-gray-100 rounded-lg ${className}`}
      style={{ maxHeight: '500px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {!imageSrc && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          No image loaded
        </div>
      )}
      
      <div className="relative inline-block" style={{ width: displayWidth, height: displayHeight }}>
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            width: displayWidth,
            height: displayHeight,
            imageRendering: zoom > 1 ? 'pixelated' : 'auto',
          }}
        />
        
        {tool === 'crop' && (
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: displayWidth,
              height: displayHeight,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ImageCanvas;
