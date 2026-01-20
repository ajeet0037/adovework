'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { StickerLayerOptions, WatermarkOptions } from '@/lib/image/types';

interface StickerLayerProps {
  layer: StickerLayerOptions;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<StickerLayerOptions>) => void;
  onDelete: () => void;
}

// Common emoji categories
const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  gestures: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  objects: ['⭐', '🌟', '✨', '💫', '🔥', '💥', '💢', '💦', '💨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '📷', '🎬', '🎤', '🎧', '🎵', '🎶', '💡', '📌', '📍'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🦋', '🐌', '🐞'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠'],
  nature: ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪺', '🪹'],
  weather: ['☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☔', '⚡', '🌙', '🌛', '🌜', '🌚', '🌝', '🌞'],
};

export function StickerLayer({
  layer,
  isSelected,
  scale,
  onSelect,
  onUpdate,
  onDelete,
}: StickerLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
  }, [onSelect]);

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
        // Maintain aspect ratio for stickers
        const aspectRatio = layer.width / layer.height;
        let newWidth = layer.width;
        let newHeight = layer.height;
        let newX = layer.x;
        let newY = layer.y;

        if (resizeHandle === 'se') {
          newWidth = Math.max(30, layer.width + dx);
          newHeight = newWidth / aspectRatio;
        } else if (resizeHandle === 'sw') {
          newWidth = Math.max(30, layer.width - dx);
          newHeight = newWidth / aspectRatio;
          newX = layer.x + dx;
        } else if (resizeHandle === 'ne') {
          newWidth = Math.max(30, layer.width + dx);
          newHeight = newWidth / aspectRatio;
          newY = layer.y - (newHeight - layer.height);
        } else if (resizeHandle === 'nw') {
          newWidth = Math.max(30, layer.width - dx);
          newHeight = newWidth / aspectRatio;
          newX = layer.x + dx;
          newY = layer.y - (newHeight - layer.height);
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

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete') {
      onDelete();
    }
  }, [onDelete]);

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
        opacity: layer.opacity,
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {layer.type === 'emoji' ? (
        <span
          className="block w-full h-full flex items-center justify-center select-none"
          style={{ fontSize: `${Math.min(layer.width, layer.height) * scale * 0.8}px` }}
        >
          {layer.content}
        </span>
      ) : (
        <img
          src={layer.content}
          alt="Sticker"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      )}

      {/* Resize handles */}
      {isSelected && (
        <>
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
        </>
      )}
    </div>
  );
}

// Emoji picker component
interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');

  const categoryIcons: Record<keyof typeof EMOJI_CATEGORIES, string> = {
    smileys: '😀',
    gestures: '👍',
    hearts: '❤️',
    objects: '⭐',
    animals: '🐶',
    food: '🍎',
    nature: '🌸',
    weather: '☀️',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 w-72">
      {/* Category tabs */}
      <div className="flex gap-1 mb-2 pb-2 border-b border-gray-200 overflow-x-auto">
        {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`p-1.5 rounded text-lg hover:bg-gray-100 ${
              activeCategory === category ? 'bg-blue-100' : ''
            }`}
            title={category}
          >
            {categoryIcons[category]}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            onClick={() => onSelect(emoji)}
            className="p-1 text-xl hover:bg-gray-100 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sticker toolbar component
interface StickerToolbarProps {
  layer: StickerLayerOptions;
  onUpdate: (updates: Partial<StickerLayerOptions>) => void;
}

export function StickerToolbar({ layer, onUpdate }: StickerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Rotation */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Rotation:</span>
        <input
          type="range"
          min={-180}
          max={180}
          value={layer.rotation}
          onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
          className="w-24"
        />
        <span className="text-xs text-gray-500 w-10">{layer.rotation}°</span>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Opacity:</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={layer.opacity}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
          className="w-24"
        />
        <span className="text-xs text-gray-500 w-10">{Math.round(layer.opacity * 100)}%</span>
      </div>

      {/* Size */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Size:</span>
        <input
          type="number"
          value={Math.round(layer.width)}
          onChange={(e) => {
            const newWidth = Math.max(20, Number(e.target.value));
            const aspectRatio = layer.width / layer.height;
            onUpdate({ width: newWidth, height: newWidth / aspectRatio });
          }}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          min={20}
          max={500}
        />
        <span className="text-xs text-gray-500">px</span>
      </div>
    </div>
  );
}

// Watermark layer component
interface WatermarkLayerProps {
  layer: WatermarkOptions;
  isSelected: boolean;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<WatermarkOptions>) => void;
  onDelete: () => void;
}

export function WatermarkLayer({
  layer,
  isSelected,
  scale,
  canvasWidth,
  canvasHeight,
  onSelect,
  onUpdate,
  onDelete,
}: WatermarkLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate position based on preset or custom
  const getPosition = useCallback(() => {
    const padding = 20;
    switch (layer.position) {
      case 'top-left':
        return { x: padding, y: padding };
      case 'top-right':
        return { x: canvasWidth - 100 - padding, y: padding };
      case 'bottom-left':
        return { x: padding, y: canvasHeight - 30 - padding };
      case 'bottom-right':
        return { x: canvasWidth - 100 - padding, y: canvasHeight - 30 - padding };
      case 'center':
        return { x: canvasWidth / 2 - 50, y: canvasHeight / 2 - 15 };
      case 'custom':
      default:
        return { x: layer.x, y: layer.y };
    }
  }, [layer.position, layer.x, layer.y, canvasWidth, canvasHeight]);

  const position = getPosition();

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    if (layer.position !== 'custom') {
      onUpdate({ position: 'custom', x: position.x, y: position.y });
    }
  }, [onSelect, layer.position, position, onUpdate]);

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      onUpdate({ x: layer.x + dx, y: layer.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, layer.x, layer.y, scale, onUpdate]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete') {
      onDelete();
    }
  }, [onDelete]);

  return (
    <div
      ref={containerRef}
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      style={{
        left: position.x * scale,
        top: position.y * scale,
        transform: `rotate(${layer.rotation}deg)`,
        opacity: layer.opacity,
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <span
        style={{
          fontFamily: layer.fontFamily,
          fontSize: `${layer.fontSize * scale}px`,
          color: layer.color,
        }}
        className="select-none whitespace-nowrap"
      >
        {layer.text}
      </span>
    </div>
  );
}

// Watermark settings component
interface WatermarkSettingsProps {
  layer: WatermarkOptions;
  onUpdate: (updates: Partial<WatermarkOptions>) => void;
}

export function WatermarkSettings({ layer, onUpdate }: WatermarkSettingsProps) {
  const positions: Array<{ value: WatermarkOptions['position']; label: string }> = [
    { value: 'top-left', label: '↖ Top Left' },
    { value: 'top-right', label: '↗ Top Right' },
    { value: 'center', label: '⊕ Center' },
    { value: 'bottom-left', label: '↙ Bottom Left' },
    { value: 'bottom-right', label: '↘ Bottom Right' },
    { value: 'custom', label: '✋ Custom' },
  ];

  return (
    <div className="space-y-3 p-3 bg-white rounded-lg border border-gray-200">
      {/* Text input */}
      <div>
        <label className="text-sm font-medium text-gray-700">Watermark Text</label>
        <input
          type="text"
          value={layer.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="Enter watermark text"
        />
      </div>

      {/* Position */}
      <div>
        <label className="text-sm font-medium text-gray-700">Position</label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {positions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onUpdate({ position: value })}
              className={`px-2 py-1.5 text-xs rounded ${
                layer.position === value
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div>
        <label className="text-sm font-medium text-gray-700">Font Size</label>
        <input
          type="range"
          min={12}
          max={72}
          value={layer.fontSize}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className="w-full mt-1"
        />
        <span className="text-xs text-gray-500">{layer.fontSize}px</span>
      </div>

      {/* Color */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <input
            type="color"
            value={layer.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-full h-8 mt-1 rounded cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">Opacity</label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.1}
            value={layer.opacity}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
            className="w-full mt-1"
          />
          <span className="text-xs text-gray-500">{Math.round(layer.opacity * 100)}%</span>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="text-sm font-medium text-gray-700">Rotation</label>
        <input
          type="range"
          min={-45}
          max={45}
          value={layer.rotation}
          onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
          className="w-full mt-1"
        />
        <span className="text-xs text-gray-500">{layer.rotation}°</span>
      </div>
    </div>
  );
}

// Helper functions to create layers
export function createStickerLayer(content: string, x: number, y: number, type: 'emoji' | 'sticker' = 'emoji'): StickerLayerOptions {
  return {
    id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    x,
    y,
    width: type === 'emoji' ? 60 : 100,
    height: type === 'emoji' ? 60 : 100,
    rotation: 0,
    opacity: 1,
  };
}

export function createWatermarkLayer(text: string = '© Watermark'): WatermarkOptions {
  return {
    id: `watermark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'watermark',
    text,
    x: 0,
    y: 0,
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
    opacity: 0.5,
    rotation: 0,
    position: 'bottom-right',
  };
}

export { EMOJI_CATEGORIES };
export default StickerLayer;
