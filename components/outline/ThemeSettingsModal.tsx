'use client';

import React, { useState } from 'react';
import { ThemeSettings, PublishSettings, CoverLayout, NavigationMode } from '@/lib/types';
import {
  X,
  Palette,
  Settings as SettingsIcon,
  Check,
  Upload,
  Layout,
  Type,
  Navigation,
  Sliders,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  initialTab?: 'theme' | 'settings';
  themeSettings: ThemeSettings;
  publishSettings: PublishSettings;
  onClose: () => void;
  onSave: (theme: ThemeSettings, publish: PublishSettings) => Promise<void>;
}

const PRESET_COLORS = [
  { name: 'LearnByCraft Deep Teal', hex: '#115E59' },
  { name: 'Craft Amber', hex: '#F4B544' },
  { name: 'Sapphire Blue', hex: '#2563eb' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Royal Purple', hex: '#8b5cf6' },
  { name: 'Deep Slate', hex: '#334155' },
  { name: 'Warm Amber', hex: '#f59e0b' },
  { name: 'Ink Navy', hex: '#172B35' },
];

export function ThemeSettingsModal({
  isOpen,
  initialTab = 'theme',
  themeSettings,
  publishSettings,
  onClose,
  onSave,
}: ThemeSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'theme' | 'settings'>(initialTab);
  const [theme, setTheme] = useState<ThemeSettings>(themeSettings);
  const [publish, setPublish] = useState<PublishSettings>(publishSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        setTheme({ ...theme, logoUrl: data.url });
      }
    } catch (err) {
      console.error('Failed to upload logo', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(theme, publish);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header & Tabs */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'theme'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-[#ff5722]" />
              <span>Theme Customization</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Settings & Navigation</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'theme' ? (
            <>
              {/* Brand Accent Color */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Brand Accent Color
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  This color tints key interface elements, lesson headers, progress bars, and quiz highlights.
                </p>

                {/* Preset Swatches */}
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                  {PRESET_COLORS.map((color) => {
                    const isSelected = theme.accentColor.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setTheme({ ...theme, accentColor: color.hex })}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative shadow-xs ring-1 ring-black/10"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Hex Input */}
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                  </div>
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    placeholder="#ff5722"
                    className="w-32 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono uppercase text-gray-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <div
                    className="h-6 flex-1 rounded-full shadow-inner"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>
              </div>

              {/* Cover Page Layout */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Cover Page Layout
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'overlay', label: 'Left Overlay', desc: 'Text on left, hero visual right' },
                    { id: 'full', label: 'Full Width', desc: 'Prominent cinematic banner' },
                    { id: 'minimal', label: 'Minimal', desc: 'Clean centered typography' },
                    { id: 'none', label: 'No Cover', desc: 'Begins directly at outline' },
                  ].map((layout) => {
                    const isSelected = theme.coverLayout === layout.id;
                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => setTheme({ ...theme, coverLayout: layout.id as CoverLayout })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50/80 ring-2 ring-gray-900/10'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="font-semibold text-xs text-gray-900">{layout.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{layout.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Pairings */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Typography Pairing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'modern',
                      name: 'Modern Sans',
                      heading: 'Geist Sans / Inter',
                      sample: 'Clean, neutral, and highly readable on all screens.',
                    },
                    {
                      id: 'editorial',
                      name: 'Editorial Serif',
                      heading: 'Merriweather / Lato',
                      sample: 'Distinguished and literary for corporate policy & journalism.',
                    },
                    {
                      id: 'classic',
                      name: 'Classic Corporate',
                      heading: 'Georgia / Helvetica',
                      sample: 'Established institutional clarity with high contrast.',
                    },
                    {
                      id: 'clean',
                      name: 'Clean System',
                      heading: 'System UI / San Francisco',
                      sample: 'Native macOS / iOS feel, razor-sharp performance.',
                    },
                  ].map((font) => {
                    const isSelected = theme.fontPairing === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() =>
                          setTheme({
                            ...theme,
                            fontPairing: font.id as ThemeSettings['fontPairing'],
                            fontHeading: font.heading,
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50/80 ring-2 ring-gray-900/10'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-gray-900">{font.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-gray-900" />}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{font.heading}</div>
                        <div className="text-[10px] text-gray-400 mt-1 italic">{font.sample}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Organization Logo */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Organization Logo
                </label>
                <div className="flex items-center gap-4">
                  {theme.logoUrl ? (
                    <div className="relative group w-24 h-12 rounded-lg border border-gray-200 overflow-hidden p-1 flex items-center justify-center bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={theme.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setTheme({ ...theme, logoUrl: null })}
                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}

                  <label className="cursor-pointer border border-dashed border-gray-300 hover:border-gray-400 rounded-xl px-4 py-2.5 text-xs text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-gray-400" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload custom logo (.png, .svg)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Navigation Mode */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Sidebar Navigation Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'free',
                      title: 'Free Navigation',
                      desc: 'Learners can access and complete lessons in any order.',
                    },
                    {
                      id: 'restricted',
                      title: 'Restricted Navigation',
                      desc: 'Learners must complete lessons and quizzes in sequential order.',
                    },
                  ].map((mode) => {
                    const isSelected = publish.navigationMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPublish({ ...publish, navigationMode: mode.id as NavigationMode })}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-gray-900">{mode.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-gray-900" />}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{mode.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-800">Show Lesson Numbers</div>
                    <div className="text-[11px] text-gray-500">
                      Prefix lessons with 1, 2, 3 in the outline and side menu
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={publish.showLessonNumbers}
                    onChange={(e) => setPublish({ ...publish, showLessonNumbers: e.target.checked })}
                    className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-800">Allow In-Course Search</div>
                    <div className="text-[11px] text-gray-500">
                      Display search bar in the player navigation sidebar
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={publish.allowSearch}
                    onChange={(e) => setPublish({ ...publish, allowSearch: e.target.checked })}
                    className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Completion Criteria & SCORM */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    LMS Completion Criteria
                  </label>
                  <select
                    value={publish.completionCriteria}
                    onChange={(e) =>
                      setPublish({
                        ...publish,
                        completionCriteria: e.target.value as PublishSettings['completionCriteria'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="all_lessons">Complete 100% of Lessons</option>
                    <option value="quiz_pass">Pass Quiz with Minimum Score</option>
                    <option value="percentage">View at least 80% of blocks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    SCORM Export Architecture
                  </label>
                  <select
                    value={publish.scormVersion}
                    onChange={(e) =>
                      setPublish({
                        ...publish,
                        scormVersion: e.target.value as PublishSettings['scormVersion'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="1.2">SCORM 1.2 (Maximum LMS Compatibility)</option>
                    <option value="2004_4th_edition">SCORM 2004 4th Edition (Rich Interaction CMI)</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {saving ? 'Saving...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
