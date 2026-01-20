'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';

export interface SignatureCanvasProps {
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Stroke color */
  strokeColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Callback when signature changes */
  onSignatureChange?: (dataUrl: string | null) => void;
  /** Whether the canvas is disabled */
  disabled?: boolean;
}

/**
 * SignatureCanvas component for drawing signatures
 * Supports both mouse and touch input
 * 
 * Requirements: 5.11
 */
export function SignatureCanvas({
  width = 400,
  height = 200,
  strokeColor = '#000000',
  strokeWidth = 2,
  onSignatureChange,
  disabled = false,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Set drawing styles
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);
  }, [width, height, strokeColor, strokeWidth]);

  // Get coordinates from event
  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [disabled, getCoordinates]);

  // Draw
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPointRef.current) return;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPointRef.current = coords;
    
    if (!hasSignature) {
      setHasSignature(true);
    }
  }, [isDrawing, disabled, getCoordinates, strokeColor, strokeWidth, hasSignature]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPointRef.current = null;

      // Notify parent of signature change
      if (hasSignature && onSignatureChange) {
        const canvas = canvasRef.current;
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          onSignatureChange(dataUrl);
        }
      }
    }
  }, [isDrawing, hasSignature, onSignatureChange]);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    setHasSignature(false);
    lastPointRef.current = null;
    
    if (onSignatureChange) {
      onSignatureChange(null);
    }
  }, [width, height, onSignatureChange]);

  // Get signature data URL
  const getSignatureDataUrl = useCallback((): string | null => {
    if (!hasSignature) return null;
    
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    return canvas.toDataURL('image/png');
  }, [hasSignature]);

  // Prevent default touch behavior to avoid scrolling while drawing
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    startDrawing(e);
  }, [startDrawing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    draw(e);
  }, [draw]);

  return (
    <div className="signature-canvas-container">
      <div 
        className={`relative border-2 border-dashed rounded-lg overflow-hidden ${
          disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
        }`}
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          className={`touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
          aria-label="Signature canvas - draw your signature here"
        />
        
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Draw your signature here</p>
          </div>
        )}
      </div>
      
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={disabled || !hasSignature}
        >
          Clear Signature
        </Button>
      </div>
    </div>
  );
}

export default SignatureCanvas;
