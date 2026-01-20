'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { TextLayerOptions } from '@/lib/image/types';

interface TextLayerProps {
  layer: TextLayerOptions;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextLayerOptions>) => void;
  onDelete: () => void;
}

const FONT_FAMILIES = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
  { name: 'Impact', value: 'Impact, sans-serif' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { name: 'Palatino', value: 'Palatino Linotype, serif' },
];

export function TextLayer({
  layer,
  isSelected,
  scale,
  onSelect,
  onUpdate,
  onDelete,
}: TextLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect();
    
    const target = e.target as HTMLElement;
    if (target.dataset.handle) {
      setIsResizing(true);
      setResizeHandle(target.dataset.handle);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isEditing, onSelect]);

  // Handle drag/resize
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      if (isDragging) {
        onUpdate({
          x: layer.x + dx,
          y: layer.y + dy,
        });
      } else if (isResizing && resizeHandle) {
        let newWidth = layer.width;
        let newHeight = layer.height;
        let newX = layer.x;
        let newY = layer.y;

        if (resizeHandle.includes('e')) newWidth = Math.max(50, layer.width + dx);
        if (resizeHandle.includes('w')) {
          newWidth = Math.max(50, layer.width - dx);
          newX = layer.x + dx;
        }
        if (resizeHandle.includes('s')) newHeight = Math.max(30, layer.height + dy);
        if (resizeHandle.includes('n')) {
          newHeight = Math.max(30, layer.height - dy);
          newY = layer.y + dy;
        }

        onUpdate({ width: newWidth, height: newHeight, x: newX, y: newY });
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, layer, scale, resizeHandle, onUpdate]);

  // Handle double-click to edit
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // Handle text input
  const handleTextChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    onUpdate({ text });
  }, [onUpdate]);

  // Handle blur to exit editing
  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Delete' && !isEditing) {
      onDelete();
    }
  }, [isEditing, onDelete]);

  // Build text style
  const textStyle: React.CSSProperties = {
    fontFamily: layer.fontFamily,
    fontSize: `${layer.fontSize}px`,
    color: layer.color,
    fontWeight: layer.bold ? 'bold' : 'normal',
    fontStyle: layer.italic ? 'italic' : 'normal',
    textDecoration: layer.underline ? 'underline' : 'none',
    textAlign: layer.textAlign,
    opacity: layer.opacity,
    transform: `rotate(${layer.rotation}deg)`,
    textShadow: layer.shadow?.enabled
      ? `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}`
      : 'none',
    WebkitTextStroke: layer.outline?.enabled
      ? `${layer.outline.width}px ${layer.outline.color}`
      : 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    outline: 'none',
    minHeight: '1em',
  };

  return (
    <div
      ref={containerRef}
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: layer.x * scale,
        top: layer.y * scale,
        width: layer.width * scale,
        height: layer.height * scale,
        transform: `rotate(${layer.rotation}deg)`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        ref={textRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={handleTextChange}
        onBlur={handleBlur}
        style={{
          ...textStyle,
          width: '100%',
          height: '100%',
          transform: 'none', // Remove rotation from inner element
        }}
        className={`${isEditing ? 'cursor-text' : ''}`}
      >
        {layer.text || 'Double-click to edit'}
      </div>

      {/* Resize handles */}
      {isSelected && !isEditing && (
        <>
          {/* Corner handles */}
          <div
            data-handle="nw"
            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"
          />
          <div
            data-handle="ne"
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"
          />
          <div
            data-handle="sw"
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"
          />
          <div
            data-handle="se"
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
          />
          {/* Edge handles */}
          <div
            data-handle="n"
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-n-resize"
          />
          <div
            data-handle="s"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-s-resize"
          />
          <div
            data-handle="w"
            className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-w-resize"
          />
          <div
            data-handle="e"
            className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-e-resize"
          />
        </>
      )}
    </div>
  );
}

// Text formatting toolbar component
interface TextToolbarProps {
  layer: TextLayerOptions;
  onUpdate: (updates: Partial<TextLayerOptions>) => void;
}

export function TextToolbar({ layer, onUpdate }: TextToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Font family */}
      <select
        value={layer.fontFamily}
        onChange={(e) => onUpdate({ fontFamily: e.target.value })}
        className="px-2 py-1 border border-gray-300 rounded text-sm"
      >
        {FONT_FAMILIES.map((font) => (
          <option key={font.value} value={font.value}>
            {font.name}
          </option>
        ))}
      </select>

      {/* Font size */}
      <input
        type="number"
        value={layer.fontSize}
        onChange={(e) => onUpdate({ fontSize: Math.max(8, Math.min(200, Number(e.target.value))) })}
        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
        min={8}
        max={200}
      />

      {/* Bold */}
      <button
        onClick={() => onUpdate({ bold: !layer.bold })}
        className={`px-2 py-1 rounded font-bold ${layer.bold ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
        title="Bold"
      >
        B
      </button>

      {/* Italic */}
      <button
        onClick={() => onUpdate({ italic: !layer.italic })}
        className={`px-2 py-1 rounded italic ${layer.italic ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
        title="Italic"
      >
        I
      </button>

      {/* Underline */}
      <button
        onClick={() => onUpdate({ underline: !layer.underline })}
        className={`px-2 py-1 rounded underline ${layer.underline ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
        title="Underline"
      >
        U
      </button>

      {/* Text color */}
      <input
        type="color"
        value={layer.color}
        onChange={(e) => onUpdate({ color: e.target.value })}
        className="w-8 h-8 rounded cursor-pointer"
        title="Text Color"
      />

      {/* Text alignment */}
      <div className="flex border border-gray-300 rounded overflow-hidden">
        <button
          onClick={() => onUpdate({ textAlign: 'left' })}
          className={`px-2 py-1 ${layer.textAlign === 'left' ? 'bg-blue-100' : 'bg-white'}`}
          title="Align Left"
        >
          ⬅️
        </button>
        <button
          onClick={() => onUpdate({ textAlign: 'center' })}
          className={`px-2 py-1 ${layer.textAlign === 'center' ? 'bg-blue-100' : 'bg-white'}`}
          title="Align Center"
        >
          ↔️
        </button>
        <button
          onClick={() => onUpdate({ textAlign: 'right' })}
          className={`px-2 py-1 ${layer.textAlign === 'right' ? 'bg-blue-100' : 'bg-white'}`}
          title="Align Right"
        >
          ➡️
        </button>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Opacity:</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={layer.opacity}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
          className="w-16"
        />
      </div>
    </div>
  );
}

// Shadow settings component
interface ShadowSettingsProps {
  shadow: TextLayerOptions['shadow'];
  onUpdate: (shadow: TextLayerOptions['shadow']) => void;
}

export function ShadowSettings({ shadow, onUpdate }: ShadowSettingsProps) {
  const defaultShadow = {
    enabled: false,
    color: '#000000',
    blur: 4,
    offsetX: 2,
    offsetY: 2,
  };

  const currentShadow = shadow || defaultShadow;

  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Text Shadow</span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentShadow.enabled}
            onChange={(e) => onUpdate({ ...currentShadow, enabled: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Enable</span>
        </label>
      </div>

      {currentShadow.enabled && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Color</label>
            <input
              type="color"
              value={currentShadow.color}
              onChange={(e) => onUpdate({ ...currentShadow, color: e.target.value })}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Blur</label>
            <input
              type="range"
              min={0}
              max={20}
              value={currentShadow.blur}
              onChange={(e) => onUpdate({ ...currentShadow, blur: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Offset X</label>
            <input
              type="range"
              min={-20}
              max={20}
              value={currentShadow.offsetX}
              onChange={(e) => onUpdate({ ...currentShadow, offsetX: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Offset Y</label>
            <input
              type="range"
              min={-20}
              max={20}
              value={currentShadow.offsetY}
              onChange={(e) => onUpdate({ ...currentShadow, offsetY: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Outline settings component
interface OutlineSettingsProps {
  outline: TextLayerOptions['outline'];
  onUpdate: (outline: TextLayerOptions['outline']) => void;
}

export function OutlineSettings({ outline, onUpdate }: OutlineSettingsProps) {
  const defaultOutline = {
    enabled: false,
    color: '#000000',
    width: 1,
  };

  const currentOutline = outline || defaultOutline;

  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Text Outline</span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentOutline.enabled}
            onChange={(e) => onUpdate({ ...currentOutline, enabled: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Enable</span>
        </label>
      </div>

      {currentOutline.enabled && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Color</label>
            <input
              type="color"
              value={currentOutline.color}
              onChange={(e) => onUpdate({ ...currentOutline, color: e.target.value })}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Width</label>
            <input
              type="range"
              min={1}
              max={10}
              value={currentOutline.width}
              onChange={(e) => onUpdate({ ...currentOutline, width: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to create a new text layer
export function createTextLayer(x: number, y: number): TextLayerOptions {
  return {
    id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    text: 'Your text here',
    x,
    y,
    width: 200,
    height: 50,
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    color: '#000000',
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'left',
    rotation: 0,
    opacity: 1,
    shadow: {
      enabled: false,
      color: '#000000',
      blur: 4,
      offsetX: 2,
      offsetY: 2,
    },
    outline: {
      enabled: false,
      color: '#000000',
      width: 1,
    },
  };
}

export { FONT_FAMILIES };
export default TextLayer;
