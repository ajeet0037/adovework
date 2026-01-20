'use client';

import { useState, useRef, useCallback } from 'react';
import { COLOR_PRESETS, GRADIENT_PRESETS } from '@/lib/image/backgroundRemove';

export type BackgroundType = 'transparent' | 'solid' | 'gradient' | 'image';

export interface BackgroundSettings {
  type: BackgroundType;
  color: string;
  gradient: {
    type: 'linear' | 'radial';
    colors: string[];
    angle: number;
  };
  customImage: string | null;
}

interface BackgroundOptionsProps {
  settings: BackgroundSettings;
  onChange: (settings: BackgroundSettings) => void;
  disabled?: boolean;
}

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  type: 'transparent',
  color: '#ffffff',
  gradient: {
    type: 'linear',
    colors: ['#667eea', '#764ba2'],
    angle: 135,
  },
  customImage: null,
};

export function BackgroundOptions({ settings, onChange, disabled }: BackgroundOptionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customColors, setCustomColors] = useState<string[]>([]);

  const handleTypeChange = (type: BackgroundType) => {
    onChange({ ...settings, type });
  };

  const handleColorChange = (color: string) => {
    onChange({ ...settings, color, type: 'solid' });
  };

  const handleGradientPresetChange = (presetKey: keyof typeof GRADIENT_PRESETS) => {
    const preset = GRADIENT_PRESETS[presetKey];
    onChange({
      ...settings,
      type: 'gradient',
      gradient: {
        type: preset.type,
        colors: preset.colors,
        angle: 'angle' in preset ? preset.angle : 135,
      },
    });
  };

  const handleGradientColorChange = (index: number, color: string) => {
    const newColors = [...settings.gradient.colors];
    newColors[index] = color;
    onChange({
      ...settings,
      gradient: { ...settings.gradient, colors: newColors },
    });
  };

  const handleGradientAngleChange = (angle: number) => {
    onChange({
      ...settings,
      gradient: { ...settings.gradient, angle },
    });
  };

  const handleGradientTypeChange = (type: 'linear' | 'radial') => {
    onChange({
      ...settings,
      gradient: { ...settings.gradient, type },
    });
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({
          ...settings,
          type: 'image',
          customImage: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }, [settings, onChange]);

  const handleCustomColorAdd = (color: string) => {
    if (!customColors.includes(color) && !COLOR_PRESETS.includes(color)) {
      setCustomColors([...customColors, color]);
    }
    handleColorChange(color);
  };

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <h3 className="font-medium text-gray-900">Background Options</h3>
      
      {/* Background Type Selector */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { type: 'transparent' as const, icon: '🔲', label: 'None' },
          { type: 'solid' as const, icon: '🎨', label: 'Color' },
          { type: 'gradient' as const, icon: '🌈', label: 'Gradient' },
          { type: 'image' as const, icon: '🖼️', label: 'Image' },
        ].map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`p-3 rounded-lg text-center transition-colors ${
              settings.type === type
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl block">{icon}</span>
            <span className="text-xs mt-1 block">{label}</span>
          </button>
        ))}
      </div>

      {/* Solid Color Options */}
      {settings.type === 'solid' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Select Color</label>
          <div className="grid grid-cols-6 gap-2">
            {[...COLOR_PRESETS, ...customColors].map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  settings.color === color ? 'border-purple-500 scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Custom:</label>
            <input
              type="color"
              value={settings.color}
              onChange={(e) => handleCustomColorAdd(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-500">{settings.color}</span>
          </div>
        </div>
      )}

      {/* Gradient Options */}
      {settings.type === 'gradient' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Gradient Presets</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => {
              const gradientStyle = preset.type === 'linear'
                ? `linear-gradient(${preset.angle || 135}deg, ${preset.colors.join(', ')})`
                : `radial-gradient(circle, ${preset.colors.join(', ')})`;
              return (
                <button
                  key={key}
                  onClick={() => handleGradientPresetChange(key as keyof typeof GRADIENT_PRESETS)}
                  className={`h-12 rounded-lg border-2 transition-all ${
                    JSON.stringify(settings.gradient.colors) === JSON.stringify(preset.colors)
                      ? 'border-purple-500 scale-105'
                      : 'border-gray-200'
                  }`}
                  style={{ background: gradientStyle }}
                  title={key}
                />
              );
            })}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Customize</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Start:</span>
                <input
                  type="color"
                  value={settings.gradient.colors[0]}
                  onChange={(e) => handleGradientColorChange(0, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">End:</span>
                <input
                  type="color"
                  value={settings.gradient.colors[1]}
                  onChange={(e) => handleGradientColorChange(1, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Type:</span>
                <select
                  value={settings.gradient.type}
                  onChange={(e) => handleGradientTypeChange(e.target.value as 'linear' | 'radial')}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
              {settings.gradient.type === 'linear' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Angle:</span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={settings.gradient.angle}
                    onChange={(e) => handleGradientAngleChange(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">{settings.gradient.angle}°</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Preview */}
          <div
            className="h-16 rounded-lg border border-gray-200"
            style={{
              background: settings.gradient.type === 'linear'
                ? `linear-gradient(${settings.gradient.angle}deg, ${settings.gradient.colors.join(', ')})`
                : `radial-gradient(circle, ${settings.gradient.colors.join(', ')})`,
            }}
          />
        </div>
      )}

      {/* Custom Image Options */}
      {settings.type === 'image' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Background Image</label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors"
          >
            <span className="text-2xl block mb-1">📁</span>
            <span className="text-sm text-gray-600">
              {settings.customImage ? 'Change Image' : 'Upload Background Image'}
            </span>
          </button>
          
          {settings.customImage && (
            <div className="relative">
              <img
                src={settings.customImage}
                alt="Background preview"
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => onChange({ ...settings, customImage: null, type: 'transparent' })}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transparent Info */}
      {settings.type === 'transparent' && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <p>🔲 Export with transparent background (PNG format)</p>
        </div>
      )}
    </div>
  );
}
