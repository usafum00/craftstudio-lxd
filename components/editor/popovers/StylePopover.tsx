'use client';

import React, { useState, useRef } from 'react';
import { BlockSettings } from '@/lib/types';
import { X, Check, Image as ImageIcon } from 'lucide-react';

interface StylePopoverProps {
  settings: BlockSettings;
  accentColor: string;
  onUpdateSettings: (newSettings: BlockSettings) => void;
  onClose: () => void;
}

export function StylePopover({
  settings,
  accentColor = '#ff5722',
  onUpdateSettings,
  onClose,
}: StylePopoverProps) {
  const currentColor = settings.backgroundColor || 'light';
  const [showCustomPicker, setShowCustomPicker] = useState(currentColor === 'custom');
  const [showImageOptions, setShowImageOptions] = useState(currentColor === 'image');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSelectColor = (type: string) => {
    if (type === 'custom') {
      setShowCustomPicker(true);
      setShowImageOptions(false);
      onUpdateSettings({
        ...settings,
        backgroundColor: 'custom',
        customBgColor: settings.customBgColor || '#3b82f6',
      });
      return;
    }

    if (type === 'image') {
      setShowImageOptions(true);
      setShowCustomPicker(false);
      onUpdateSettings({
        ...settings,
        backgroundColor: 'image',
        bgImage:
          settings.bgImage ||
          'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=1600&q=80',
        bgOverlay: settings.bgOverlay || 'dark',
      });
      return;
    }

    setShowCustomPicker(false);
    setShowImageOptions(false);
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
          });
        }
      }
    } catch (err) {
      console.error('Failed to upload background image', err);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-8 left-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-40 animate-in fade-in zoom-in-95 duration-100 select-none text-left"
    >
      {/* Notch / Pointer pointing up to toolbar */}
      <div className="absolute -top-1.5 left-10 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h4 className="text-xs font-bold text-gray-900 tracking-tight">Style</h4>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors cursor-pointer"
          title="Close style panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Color Section */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Color
        </div>

        {/* 1. Light (White) */}
        <button
          type="button"
          onClick={() => handleSelectColor('light')}
          className={`w-full h-8 px-3 rounded-lg border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
            currentColor === 'light' || currentColor === 'white'
              ? 'border-slate-800 bg-white ring-1 ring-slate-800 text-gray-900 shadow-2xs'
              : 'border-slate-200 bg-white hover:border-slate-300 text-gray-800'
          }`}
        >
          <span>Light</span>
          {(currentColor === 'light' || currentColor === 'white') && (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-gray-900" />
          )}
        </button>

        {/* 2. Gray */}
        <button
          type="button"
          onClick={() => handleSelectColor('gray')}
          className={`w-full h-8 px-3 rounded-lg border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
            currentColor === 'gray'
              ? 'border-slate-800 bg-[#f1f5f9] ring-1 ring-slate-800 text-gray-900 shadow-2xs'
              : 'border-slate-200/80 bg-[#f1f5f9] hover:border-slate-300 text-gray-800'
          }`}
        >
          <span>Gray</span>
          {currentColor === 'gray' && (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-gray-900" />
          )}
        </button>

        {/* 3. Theme (Solid brand accent) */}
        <button
          type="button"
          onClick={() => handleSelectColor('theme')}
          style={{ backgroundColor: accentColor }}
          className={`w-full h-8 px-3 rounded-lg border border-transparent flex items-center justify-between text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer ${
            currentColor === 'theme' ? 'ring-2 ring-offset-1 ring-slate-800' : 'hover:opacity-95'
          }`}
        >
          <span>Theme</span>
          {currentColor === 'theme' && (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-white" />
          )}
        </button>

        {/* 4. Theme tint */}
        <button
          type="button"
          onClick={() => handleSelectColor('theme_tint')}
          style={{ backgroundColor: `${accentColor}18`, color: '#1e293b' }}
          className={`w-full h-8 px-3 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs font-medium shadow-2xs transition-all cursor-pointer ${
            currentColor === 'theme_tint'
              ? 'border-slate-800 ring-1 ring-slate-800'
              : 'hover:border-slate-300'
          }`}
        >
          <span>Theme tint</span>
          {currentColor === 'theme_tint' && (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-gray-900" />
          )}
        </button>

        {/* 5. Dark (Charcoal) */}
        <button
          type="button"
          onClick={() => handleSelectColor('dark')}
          className={`w-full h-8 px-3 rounded-lg border border-transparent bg-[#262626] text-white flex items-center justify-between text-xs font-medium shadow-2xs transition-all cursor-pointer ${
            currentColor === 'dark' ? 'ring-2 ring-offset-1 ring-slate-800' : 'hover:bg-[#1f1f1f]'
          }`}
        >
          <span>Dark</span>
          {currentColor === 'dark' && (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-white" />
          )}
        </button>

        {/* 6. Black */}
        <button
          type="button"
          onClick={() => handleSelectColor('black')}
          className={`w-full h-8 px-3 rounded-lg border border-transparent bg-black text-white flex items-center justify-between text-xs font-medium shadow-2xs transition-all cursor-pointer ${
            currentColor === 'black' ? 'ring-2 ring-offset-1 ring-slate-800' : 'hover:opacity-90'
          }`}
        >
          <span>Black</span>
          {currentColor === 'black' && (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-white" />
          )}
        </button>

        {/* 7. Custom with Rainbow Wheel */}
        <button
          type="button"
          onClick={() => handleSelectColor('custom')}
          className={`w-full h-8 px-3 rounded-lg border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
            currentColor === 'custom'
              ? 'border-slate-800 bg-white ring-1 ring-slate-800 text-gray-900 shadow-2xs'
              : 'border-slate-200 bg-white hover:border-slate-300 text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>Custom</span>
            {/* Rainbow color wheel icon */}
            <div
              className="w-3.5 h-3.5 rounded-full border border-slate-300"
              style={{
                background:
                  'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
              }}
            />
          </div>
          {currentColor === 'custom' && (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-gray-900" />
          )}
        </button>

        {/* Custom Color Inline Expanded Picker */}
        {showCustomPicker && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-1">
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
                className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded text-gray-800 font-mono focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        )}

        {/* 8. Image */}
        <button
          type="button"
          onClick={() => handleSelectColor('image')}
          className={`w-full h-8 px-3 rounded-lg border flex items-center justify-between text-xs font-medium transition-all cursor-pointer relative overflow-hidden ${
            currentColor === 'image'
              ? 'border-slate-800 ring-1 ring-slate-800 text-white shadow-2xs'
              : 'border-slate-200 hover:border-slate-300 text-white'
          }`}
          style={{
            backgroundImage: `url(${
              settings.bgImage ||
              'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=400&q=80'
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/45" />
          <span className="relative z-10 font-medium drop-shadow-xs">Image</span>
          {currentColor === 'image' && (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-white relative z-10 drop-shadow-xs" />
          )}
        </button>

        {/* Image Options Inline Expanded */}
        {showImageOptions && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md font-medium cursor-pointer"
              >
                Upload Photo
              </button>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>Overlay:</span>
                <select
                  value={(settings.bgOverlay as string) || 'dark'}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      bgOverlay: e.target.value as 'dark' | 'light' | 'none',
                    })
                  }
                  className="bg-white border border-slate-200 text-xs rounded px-1.5 py-0.5"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
