'use client';

import React, { useState, useRef } from 'react';
import { BlockSettings } from '@/lib/types';
import {
  X,
  Check,
  Image as ImageIcon,
  Sliders,
  Upload,
  Layers,
  Sparkles,
  Eye,
} from 'lucide-react';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';

interface StylePopoverProps {
  settings: BlockSettings;
  accentColor?: string;
  onUpdateSettings: (newSettings: BlockSettings) => void;
  onClose: () => void;
}

export const CURATED_BACKGROUND_PRESETS = [
  {
    id: 'forest-mist',
    label: 'B&W Forest Mist',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=70',
  },
  {
    id: 'modern-office',
    label: 'Modern Office Blur',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=70',
  },
  {
    id: 'dark-geometric',
    label: 'Abstract Dark Geometric',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=70',
  },
  {
    id: 'warm-coffee',
    label: 'Warm Coffee Shop',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&q=70',
  },
  {
    id: 'blueprint',
    label: 'Clean Blueprint',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&q=70',
  },
  {
    id: 'concrete',
    label: 'Architectural Concrete',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=70',
  },
  {
    id: 'mesh-gradient',
    label: 'Subtle Mesh Gradient',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=70',
  },
  {
    id: 'clean-slate',
    label: 'Clean Slate Studio',
    url: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=200&q=70',
  },
];

export function StylePopover({
  settings,
  accentColor = '#ff5722',
  onUpdateSettings,
  onClose,
}: StylePopoverProps) {
  const currentColor = settings.backgroundColor || 'light';
  const [showCustomPicker, setShowCustomPicker] = useState(currentColor === 'custom');
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isImageMode = currentColor === 'image';
  const overlayColor = (settings.bgOverlayColor as 'black' | 'white' | 'theme') || (settings.bgOverlay === 'light' ? 'white' : 'black');
  const overlayOpacity = typeof settings.bgOverlayOpacity === 'number' ? settings.bgOverlayOpacity : 40;
  const backgroundBlur = typeof settings.bgBlur === 'number' ? settings.bgBlur : 0;
  const isParallax = Boolean(settings.bgParallax);

  const handleSelectColor = (type: string) => {
    if (type === 'custom') {
      setShowCustomPicker(true);
      onUpdateSettings({
        ...settings,
        backgroundColor: 'custom',
        customBgColor: settings.customBgColor || '#3b82f6',
      });
      return;
    }

    if (type === 'image') {
      setShowCustomPicker(false);
      onUpdateSettings({
        ...settings,
        backgroundColor: 'image',
        bgImage:
          settings.bgImage ||
          CURATED_BACKGROUND_PRESETS[1].url, // Modern Office default
        bgOverlay: settings.bgOverlay || 'dark',
        bgOverlayColor: settings.bgOverlayColor || 'black',
        bgOverlayOpacity: typeof settings.bgOverlayOpacity === 'number' ? settings.bgOverlayOpacity : 40,
        bgBlur: typeof settings.bgBlur === 'number' ? settings.bgBlur : 0,
      });
      return;
    }

    setShowCustomPicker(false);
    onUpdateSettings({
      ...settings,
      backgroundColor: type,
    });
  };

  const handleCustomHexChange = (hex: string) => {
    onUpdateSettings({
      ...settings,
      backgroundColor: 'custom',
      customBgColor: hex,
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onUpdateSettings({
            ...settings,
            backgroundColor: 'image',
            bgImage: data.url,
            bgOverlayColor: settings.bgOverlayColor || 'black',
            bgOverlayOpacity: typeof settings.bgOverlayOpacity === 'number' ? settings.bgOverlayOpacity : 40,
          });
        }
      }
    } catch (err) {
      console.error('Failed to upload background image', err);
    }
  };

  return (
    <>
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-8 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-40 animate-in fade-in zoom-in-95 duration-100 select-none text-left max-h-[85vh] overflow-y-auto"
      >
        {/* Notch pointing up to toolbar */}
        <div className="absolute -top-1.5 left-10 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-700" />
            <h4 className="text-xs font-bold text-gray-900 tracking-tight">Block Style & Atmosphere</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors cursor-pointer"
            title="Close style panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Background Fill Presets */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Background Fill
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {/* Light */}
            <button
              type="button"
              onClick={() => handleSelectColor('light')}
              className={`h-8 px-2.5 rounded-lg border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                currentColor === 'light' || currentColor === 'white'
                  ? 'border-slate-800 bg-white ring-1 ring-slate-800 text-gray-900 shadow-2xs font-semibold'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-gray-800'
              }`}
            >
              <span>Light (White)</span>
              {(currentColor === 'light' || currentColor === 'white') && (
                <Check className="w-3 h-3 stroke-[2.5] text-gray-900" />
              )}
            </button>

            {/* Soft Gray */}
            <button
              type="button"
              onClick={() => handleSelectColor('gray')}
              className={`h-8 px-2.5 rounded-lg border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                currentColor === 'gray'
                  ? 'border-slate-800 bg-[#f4f4f5] ring-1 ring-slate-800 text-gray-900 shadow-2xs font-semibold'
                  : 'border-slate-200/80 bg-[#f4f4f5] hover:border-slate-300 text-gray-800'
              }`}
            >
              <span>Soft Gray</span>
              {currentColor === 'gray' && (
                <Check className="w-3 h-3 stroke-[2.5] text-gray-900" />
              )}
            </button>

            {/* Theme Accent */}
            <button
              type="button"
              onClick={() => handleSelectColor('theme')}
              style={{ backgroundColor: accentColor }}
              className={`h-8 px-2.5 rounded-lg border border-transparent flex items-center justify-between text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer ${
                currentColor === 'theme' ? 'ring-2 ring-offset-1 ring-slate-800' : 'hover:opacity-95'
              }`}
            >
              <span>Theme Accent</span>
              {currentColor === 'theme' && (
                <Check className="w-3 h-3 stroke-[2.5] text-white" />
              )}
            </button>

            {/* Theme Tint */}
            <button
              type="button"
              onClick={() => handleSelectColor('theme_tint')}
              style={{ backgroundColor: `${accentColor}18`, color: '#1e293b' }}
              className={`h-8 px-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-medium shadow-2xs transition-all cursor-pointer ${
                currentColor === 'theme_tint'
                  ? 'border-slate-800 ring-1 ring-slate-800 font-semibold'
                  : 'hover:border-slate-300'
              }`}
            >
              <span>Theme Tint</span>
              {currentColor === 'theme_tint' && (
                <Check className="w-3 h-3 stroke-[2.5] text-gray-900" />
              )}
            </button>

            {/* Dark Carbon */}
            <button
              type="button"
              onClick={() => handleSelectColor('dark')}
              className={`h-8 px-2.5 rounded-lg border border-transparent bg-[#18181b] text-white flex items-center justify-between text-xs font-medium shadow-2xs transition-all cursor-pointer ${
                currentColor === 'dark' ? 'ring-2 ring-offset-1 ring-slate-800 font-semibold' : 'hover:bg-[#27272a]'
              }`}
            >
              <span>Dark Carbon</span>
              {currentColor === 'dark' && (
                <Check className="w-3 h-3 stroke-[2.5] text-white" />
              )}
            </button>

            {/* Custom Hex */}
            <button
              type="button"
              onClick={() => handleSelectColor('custom')}
              className={`h-8 px-2.5 rounded-lg border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                currentColor === 'custom'
                  ? 'border-slate-800 bg-white ring-1 ring-slate-800 text-gray-900 shadow-2xs font-semibold'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>Custom</span>
                <div
                  className="w-3 h-3 rounded-full border border-slate-300"
                  style={{
                    background:
                      'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                  }}
                />
              </div>
              {currentColor === 'custom' && (
                <Check className="w-3 h-3 stroke-[2.5] text-gray-900" />
              )}
            </button>
          </div>

          {/* Custom Hex Picker Input */}
          {showCustomPicker && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-1">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(settings.customBgColor as string) || '#3b82f6'}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={(settings.customBgColor as string) || '#3b82f6'}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded-md text-gray-800 font-mono focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          )}

          {/* 2. Background Image Full-Width Button */}
          <button
            type="button"
            onClick={() => handleSelectColor('image')}
            className={`w-full h-10 px-3 mt-1.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer relative overflow-hidden ${
              isImageMode
                ? 'border-slate-900 ring-2 ring-slate-900 text-white shadow-md'
                : 'border-slate-200 hover:border-slate-400 text-white'
            }`}
            style={{
              backgroundImage: `url(${
                settings.bgImage ||
                CURATED_BACKGROUND_PRESETS[1].url
              })`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[0.5px]" />
            <div className="relative z-10 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-white drop-shadow-xs" />
              <span className="drop-shadow-xs">Background Photo & Overlay</span>
            </div>
            {isImageMode && (
              <Check className="w-4 h-4 stroke-[2.5] text-white relative z-10 drop-shadow-xs" />
            )}
          </button>
        </div>

        {/* 3. Deep Image & Atmosphere Controls (when image active) */}
        {isImageMode && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-3.5">
            {/* Quick 1-Click Curated Image Presets */}
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Curated Photo Presets</span>
                <span className="text-[9px] text-gray-400 font-normal">8 themes</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {CURATED_BACKGROUND_PRESETS.map((preset) => {
                  const isCurrent = settings.bgImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          backgroundColor: 'image',
                          bgImage: preset.url,
                        })
                      }
                      title={preset.label}
                      className={`relative h-11 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-indigo-600 ring-2 ring-indigo-500 shadow-sm'
                          : 'border-slate-200 hover:border-slate-400 opacity-85 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset.thumb} alt={preset.label} className="w-full h-full object-cover" />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media Vault & Upload Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setMediaModalOpen(true)}
                className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-semibold text-indigo-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Media Vault</span>
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3 text-slate-600" />
                <span>Upload Local</span>
              </button>
            </div>

            {/* Overlay Color Toggle */}
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Overlay Tint
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      bgOverlayColor: 'black',
                      bgOverlay: 'dark',
                    })
                  }
                  className={`py-1 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1 transition-all ${
                    overlayColor === 'black'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-black inline-block" />
                  <span>Darken</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      bgOverlayColor: 'white',
                      bgOverlay: 'light',
                    })
                  }
                  className={`py-1 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1 transition-all ${
                    overlayColor === 'white'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white border border-slate-300 inline-block" />
                  <span>Lighten</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      bgOverlayColor: 'theme',
                      bgOverlay: 'brand',
                    })
                  }
                  className={`py-1 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1 transition-all ${
                    overlayColor === 'theme'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>Theme</span>
                </button>
              </div>
            </div>

            {/* Overlay Darkness Slider (0% - 90%) */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                <span>Overlay Darkness</span>
                <span className="text-gray-900 font-mono text-[11px]">{overlayOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={overlayOpacity}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    bgOverlayOpacity: Number(e.target.value),
                  })
                }
                className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-mono">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgOverlayOpacity: 0 })}
                  className="hover:text-gray-900"
                >
                  0%
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgOverlayOpacity: 25 })}
                  className="hover:text-gray-900"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgOverlayOpacity: 50 })}
                  className="hover:text-gray-900"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgOverlayOpacity: 75 })}
                  className="hover:text-gray-900"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgOverlayOpacity: 90 })}
                  className="hover:text-gray-900"
                >
                  90%
                </button>
              </div>
            </div>

            {/* Background Blur Slider (0px - 8px) */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                <span>Atmospheric Blur</span>
                <span className="text-gray-900 font-mono text-[11px]">{backgroundBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={backgroundBlur}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    bgBlur: Number(e.target.value),
                  })
                }
                className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-mono">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgBlur: 0 })}
                  className="hover:text-gray-900"
                >
                  Sharp (0px)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgBlur: 2 })}
                  className="hover:text-gray-900"
                >
                  Soft (2px)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgBlur: 4 })}
                  className="hover:text-gray-900"
                >
                  Studio (4px)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, bgBlur: 8 })}
                  className="hover:text-gray-900"
                >
                  Deep (8px)
                </button>
              </div>
            </div>

            {/* Parallax Scroll Toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <span className="text-xs font-semibold text-gray-800">Parallax Fixed Stage</span>
              <input
                type="checkbox"
                checked={isParallax}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    bgParallax: e.target.checked,
                  })
                }
                className="rounded accent-slate-900 cursor-pointer"
              />
            </label>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          className="hidden"
        />
      </div>

      {/* Unified Media Modal */}
      <UnifiedMediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(url) => {
          onUpdateSettings({
            ...settings,
            backgroundColor: 'image',
            bgImage: url,
            bgOverlayColor: settings.bgOverlayColor || 'black',
            bgOverlayOpacity: typeof settings.bgOverlayOpacity === 'number' ? settings.bgOverlayOpacity : 40,
          });
          setMediaModalOpen(false);
        }}
        initialTab="library"
        mediaType="image"
        accentColor={accentColor}
      />
    </>
  );
}
