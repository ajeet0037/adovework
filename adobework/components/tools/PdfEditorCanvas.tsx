'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Annotation, 
  RGBColor,
  createTextAnnotation,
  createHighlightAnnotation,
  createDrawAnnotation,
} from '@/lib/pdf/edit';

export interface PdfEditorCanvasProps {
  /** Width of the canvas (display size) */
  width: number;
  /** Height of the canvas (display size) */
  height: number;
  /** Current page number */
  currentPage: number;
  /** Actual PDF page width (for coordinate scaling) */
  pdfWidth?: number;
  /** Actual PDF page height (for coordinate scaling) */
  pdfHeight?: number;
  /** Background image URL (rendered PDF page) */
  backgroundImage?: string;
  /** Callback when annotations change */
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  /** Initial annotations */
  initialAnnotations?: Annotation[];
  /** Whether the canvas is disabled */
  disabled?: boolean;
}

type EditorTool = 'select' | 'text' | 'highlight' | 'draw';

const COLORS: { name: string; value: RGBColor }[] = [
  { name: 'Black', value: { r: 0, g: 0, b: 0 } },
  { name: 'Red', value: { r: 255, g: 0, b: 0 } },
  { name: 'Blue', value: { r: 0, g: 0, b: 255 } },
  { name: 'Green', value: { r: 0, g: 128, b: 0 } },
  { name: 'Yellow', value: { r: 255, g: 255, b: 0 } },
  { name: 'Orange', value: { r: 255, g: 165, b: 0 } },
];

/**
 * PdfEditorCanvas component for editing PDFs
 * Supports text, highlight, and draw tools
 * 
 * Requirements: 5.12
 */
export function PdfEditorCanvas({
  width,
  height,
  currentPage,
  pdfWidth,
  pdfHeight,
  backgroundImage,
  onAnnotationsChange,
  initialAnnotations = [],
  disabled = false,
}: PdfEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [activeTool, setActiveTool] = useState<EditorTool>('draw');
  const [activeColor, setActiveColor] = useState<RGBColor>(COLORS[0].value);
  const [fontSize, setFontSize] = useState(16);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightStart, setHighlightStart] = useState<{ x: number; y: number } | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // Calculate scale factors for coordinate conversion
  const actualPdfWidth = pdfWidth || width;
  const actualPdfHeight = pdfHeight || height;
  const scaleX = actualPdfWidth / width;
  const scaleY = actualPdfHeight / height;

  // Load background image
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        redrawCanvas();
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage]);

  // Sync with parent annotations
  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  // Redraw canvas when annotations or page changes
  useEffect(() => {
    redrawCanvas();
  }, [annotations, currentPage, width, height]);

  // Notify parent of annotation changes
  useEffect(() => {
    if (onAnnotationsChange) {
      onAnnotationsChange(annotations);
    }
  }, [annotations, onAnnotationsChange]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background image if available
    if (backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, width, height);
    } else {
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw annotations for current page (convert PDF coords to canvas coords)
    const pageAnnotations = annotations.filter(a => a.page === currentPage);
    
    for (const annotation of pageAnnotations) {
      drawAnnotation(ctx, annotation);
    }

    // Draw current drawing in progress (already in canvas coords)
    if (isDrawing && currentDrawPoints.length > 1) {
      ctx.strokeStyle = `rgb(${activeColor.r}, ${activeColor.g}, ${activeColor.b})`;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentDrawPoints[0].x, currentDrawPoints[0].y);
      for (let i = 1; i < currentDrawPoints.length; i++) {
        ctx.lineTo(currentDrawPoints[i].x, currentDrawPoints[i].y);
      }
      ctx.stroke();
    }
  }, [annotations, currentPage, width, height, isDrawing, currentDrawPoints, activeColor, strokeWidth]);

  // Convert PDF coordinates to canvas coordinates for display
  const pdfToCanvas = (pdfX: number, pdfY: number): { x: number; y: number } => {
    return {
      x: pdfX / scaleX,
      y: height - (pdfY / scaleY), // PDF Y is from bottom, canvas Y is from top
    };
  };

  // Convert canvas coordinates to PDF coordinates for storage
  const canvasToPdf = (canvasX: number, canvasY: number): { x: number; y: number } => {
    return {
      x: canvasX * scaleX,
      y: (height - canvasY) * scaleY, // Convert from top-origin to bottom-origin
    };
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const opacity = annotation.opacity ?? 1;
    ctx.globalAlpha = opacity;

    switch (annotation.type) {
      case 'text': {
        const pos = pdfToCanvas(annotation.x, annotation.y);
        ctx.fillStyle = `rgb(${annotation.color.r}, ${annotation.color.g}, ${annotation.color.b})`;
        ctx.font = `${annotation.fontSize / scaleY}px Helvetica, Arial, sans-serif`;
        ctx.fillText(annotation.text, pos.x, pos.y);
        break;
      }

      case 'highlight': {
        const pos = pdfToCanvas(annotation.x, annotation.y + annotation.height);
        ctx.fillStyle = `rgba(${annotation.color.r}, ${annotation.color.g}, ${annotation.color.b}, 0.3)`;
        ctx.fillRect(pos.x, pos.y, annotation.width / scaleX, annotation.height / scaleY);
        break;
      }

      case 'draw': {
        if (annotation.points.length > 1) {
          ctx.strokeStyle = `rgb(${annotation.color.r}, ${annotation.color.g}, ${annotation.color.b})`;
          ctx.lineWidth = annotation.strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          const firstPoint = pdfToCanvas(annotation.points[0].x, annotation.points[0].y);
          ctx.moveTo(firstPoint.x, firstPoint.y);
          for (let i = 1; i < annotation.points.length; i++) {
            const point = pdfToCanvas(annotation.points[i].x, annotation.points[i].y);
            ctx.lineTo(point.x, point.y);
          }
          ctx.stroke();
        }
        break;
      }
    }

    ctx.globalAlpha = 1;
  };

  const getCanvasCoordinates = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    return { x, y };
  };

  // Get PDF coordinates from mouse event (for storing annotations)
  const getPdfCoordinates = (e: React.MouseEvent): { x: number; y: number } => {
    const canvasCoords = getCanvasCoordinates(e);
    return canvasToPdf(canvasCoords.x, canvasCoords.y);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const pdfCoords = getPdfCoordinates(e);

    if (activeTool === 'text') {
      setTextPosition(pdfCoords);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const canvasCoords = getCanvasCoordinates(e);
    const pdfCoords = getPdfCoordinates(e);

    if (activeTool === 'draw') {
      setIsDrawing(true);
      // Store canvas coords for live drawing, will convert to PDF coords on mouse up
      setCurrentDrawPoints([canvasCoords]);
    } else if (activeTool === 'highlight') {
      setHighlightStart(pdfCoords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const canvasCoords = getCanvasCoordinates(e);

    if (activeTool === 'draw' && isDrawing) {
      setCurrentDrawPoints(prev => [...prev, canvasCoords]);
      redrawCanvas();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const pdfCoords = getPdfCoordinates(e);

    if (activeTool === 'draw' && isDrawing && currentDrawPoints.length > 1) {
      // Convert all canvas points to PDF coordinates
      const pdfPoints = currentDrawPoints.map(p => canvasToPdf(p.x, p.y));
      const newAnnotation = createDrawAnnotation(currentPage, pdfPoints, {
        color: activeColor,
        strokeWidth,
      });
      setAnnotations(prev => [...prev, newAnnotation]);
      setCurrentDrawPoints([]);
    } else if (activeTool === 'highlight' && highlightStart) {
      const x = Math.min(highlightStart.x, pdfCoords.x);
      const y = Math.min(highlightStart.y, pdfCoords.y);
      const w = Math.abs(pdfCoords.x - highlightStart.x);
      const h = Math.abs(pdfCoords.y - highlightStart.y);
      
      if (w > 5 && h > 5) {
        const newAnnotation = createHighlightAnnotation(currentPage, x, y, w, h, {
          color: activeColor,
        });
        setAnnotations(prev => [...prev, newAnnotation]);
      }
      setHighlightStart(null);
    }

    setIsDrawing(false);
  };

  const handleAddText = () => {
    if (!textPosition || !textInput.trim()) return;

    // textPosition is already in PDF coordinates
    const newAnnotation = createTextAnnotation(
      currentPage,
      textPosition.x,
      textPosition.y,
      textInput,
      { color: activeColor, fontSize: fontSize * scaleY } // Scale font size to PDF coords
    );
    setAnnotations(prev => [...prev, newAnnotation]);
    setTextInput('');
    setTextPosition(null);
  };

  const handleUndo = () => {
    setAnnotations(prev => {
      const pageAnnotations = prev.filter(a => a.page === currentPage);
      if (pageAnnotations.length === 0) return prev;
      
      const lastAnnotation = pageAnnotations[pageAnnotations.length - 1];
      return prev.filter(a => a.id !== lastAnnotation.id);
    });
  };

  const handleClearPage = () => {
    setAnnotations(prev => prev.filter(a => a.page !== currentPage));
  };

  const rgbToHex = (color: RGBColor): string => {
    return `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
  };

  return (
    <div className="pdf-editor-container">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-100 rounded-lg">
        {/* Tool Selection */}
        <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded ${activeTool === 'select' ? 'bg-primary-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Select"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            className={`p-2 rounded ${activeTool === 'text' ? 'bg-primary-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Add Text"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('highlight')}
            className={`p-2 rounded ${activeTool === 'highlight' ? 'bg-primary-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Highlight"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('draw')}
            className={`p-2 rounded ${activeTool === 'draw' ? 'bg-primary-500 text-white' : 'bg-white hover:bg-gray-200'}`}
            title="Draw"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Color Selection */}
        <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
          {COLORS.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => setActiveColor(color.value)}
              className={`w-6 h-6 rounded-full border-2 ${
                activeColor.r === color.value.r && 
                activeColor.g === color.value.g && 
                activeColor.b === color.value.b 
                  ? 'border-primary-500 ring-2 ring-primary-200' 
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: rgbToHex(color.value) }}
              title={color.name}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Font Size (for text tool) */}
        {activeTool === 'text' && (
          <div className="flex items-center gap-2 border-r border-gray-300 pr-3 mr-2">
            <label className="text-sm text-gray-600">Size:</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={disabled}
            >
              {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>
        )}

        {/* Stroke Width (for draw tool) */}
        {activeTool === 'draw' && (
          <div className="flex items-center gap-2 border-r border-gray-300 pr-3 mr-2">
            <label className="text-sm text-gray-600">Width:</label>
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={disabled}
            >
              {[1, 2, 3, 4, 5, 8, 10].map(w => (
                <option key={w} value={w}>{w}px</option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={disabled}>
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearPage} disabled={disabled}>
            Clear Page
          </Button>
        </div>
      </div>

      {/* Text Input Modal */}
      {textPosition && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Enter text to add at the selected position:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter text..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddText();
                if (e.key === 'Escape') setTextPosition(null);
              }}
            />
            <Button variant="primary" size="sm" onClick={handleAddText}>
              Add
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTextPosition(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div 
        className="relative border border-gray-300 rounded-lg overflow-hidden bg-white"
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`${disabled ? 'cursor-not-allowed' : activeTool === 'draw' ? 'cursor-crosshair' : 'cursor-pointer'}`}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {activeTool === 'text' && !textPosition && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Click to place text
          </div>
        )}
        {activeTool === 'highlight' && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Click and drag to highlight
          </div>
        )}
        {activeTool === 'draw' && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Click and drag to draw
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfEditorCanvas;
