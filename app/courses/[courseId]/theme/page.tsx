'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Course, Lesson, ThemeSettings, PublishSettings, CoverPageLayout, ThemePreset, SidebarState, HeaderStyle, HeaderHeight } from '@/lib/types';
import { getContrastTextColor, getContrastSubtextColor } from '@/lib/color-utils';
import {
  ChevronLeft,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  Camera,
  Upload,
  BookOpen,
  HelpCircle,
  Circle,
  Loader2,
  Sparkles,
  Sliders,
  Palette,
  Type,
  Layout,
  Navigation as NavIcon,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

type DeviceMode = 'desktop' | 'tablet_landscape' | 'tablet_portrait' | 'mobile_landscape' | 'mobile_portrait';
type ThemeSubMenu = 'cover' | 'navigation' | 'headers' | 'colors' | 'fonts' | 'blocks';

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

const FONT_PAIRINGS = [
  {
    name: 'Plus Jakarta Sans / Merriweather',
    heading: 'Plus Jakarta Sans',
    body: 'Merriweather',
    category: 'Modern Editorial',
  },
  {
    name: 'Inter / Lora',
    heading: 'Inter',
    body: 'Lora',
    category: 'Balanced Literary',
  },
  {
    name: 'Montserrat / Open Sans',
    heading: 'Montserrat',
    body: 'Open Sans',
    category: 'Clean Corporate',
  },
  {
    name: 'Roboto / Roboto Slab',
    heading: 'Roboto',
    body: 'Roboto Slab',
    category: 'Technical Academic',
  },
  {
    name: 'Geist Sans / Geist Mono',
    heading: 'Geist Sans',
    body: 'Geist Sans',
    category: 'Minimal Modern',
  },
];

export default function ThemeCustomizerPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const { courseId } = resolvedParams;
  const router = useRouter();

  const [course, setCourse] = useState<(Course & { lessons: Lesson[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Device & Navigation state
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [activeMenu, setActiveMenu] = useState<ThemeSubMenu>('cover');
  const [presetModalOpen, setPresetModalOpen] = useState(false);

  // Theme settings local state
  const [theme, setTheme] = useState<ThemeSettings>({
    preset: 'rise',
    accentColor: '#ff5722',
    coverLayout: 'split',
    overlayOpacity: 50,
    fontPairing: 'Plus Jakarta Sans / Merriweather',
    fontHeading: 'Plus Jakarta Sans',
    fontBody: 'Merriweather',
    logoUrl: null,
    coverImageUrl: null,
    sidebarState: 'open',
    showPrevNextButtons: true,
    showLessonNumbers: true,
    headerStyle: 'plain',
    headerHeight: 'medium',
    blockAnimations: true,
    buttonStyle: 'pill',
  });

  const [publish, setPublish] = useState<PublishSettings>({
    navigationMode: 'free',
    showLessonNumbers: true,
    allowSearch: true,
    completionCriteria: 'all_lessons',
    passingScore: 80,
    scormVersion: '1.2',
  });

  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}`);
        const data = await res.json();
        if (data.course) {
          setCourse(data.course);
          setTheme({
            preset: data.course.themeSettings?.preset || 'rise',
            accentColor: data.course.themeSettings?.accentColor || '#ff5722',
            coverLayout: data.course.themeSettings?.coverLayout || 'split',
            overlayOpacity: data.course.themeSettings?.overlayOpacity ?? 50,
            fontPairing: data.course.themeSettings?.fontPairing || 'Plus Jakarta Sans / Merriweather',
            fontHeading: data.course.themeSettings?.fontHeading || 'Plus Jakarta Sans',
            fontBody: data.course.themeSettings?.fontBody || 'Merriweather',
            logoUrl: data.course.themeSettings?.logoUrl || null,
            coverImageUrl: data.course.themeSettings?.coverImageUrl || data.course.coverImage || null,
            sidebarState: data.course.themeSettings?.sidebarState || 'open',
            showPrevNextButtons: data.course.themeSettings?.showPrevNextButtons ?? true,
            showLessonNumbers: data.course.themeSettings?.showLessonNumbers ?? true,
            headerStyle: data.course.themeSettings?.headerStyle || 'plain',
            headerHeight: data.course.themeSettings?.headerHeight || 'medium',
            blockAnimations: data.course.themeSettings?.blockAnimations ?? true,
            buttonStyle: data.course.themeSettings?.buttonStyle || 'pill',
          });
          setPublish(data.course.publishSettings || publish);
        }
      } catch (err) {
        console.error('Failed to load course theme', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [courseId]);

  // Save changes to SQLite
  const saveThemeSettings = async (updatedTheme: ThemeSettings, updatedPublish: PublishSettings) => {
    try {
      setSavingStatus('saving');
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeSettings: updatedTheme,
          publishSettings: updatedPublish,
        }),
      });
      if (res.ok) {
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Failed to save theme settings', err);
      setSavingStatus('idle');
    }
  };

  const handleUpdateTheme = (updates: Partial<ThemeSettings>) => {
    const updated = { ...theme, ...updates };
    setTheme(updated);
    saveThemeSettings(updated, publish);
  };

  const handleUpdatePublish = (updates: Partial<PublishSettings>) => {
    const updated = { ...publish, ...updates };
    setPublish(updated);
    saveThemeSettings(theme, updated);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        handleUpdateTheme({ coverImageUrl: data.url });
        // Also update course cover_image column
        await fetch(`/api/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverImage: data.url }),
        });
        if (course) setCourse({ ...course, coverImage: data.url });
      }
    } catch (err) {
      console.error('Failed to upload cover image', err);
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
        <span className="text-xs text-gray-400 font-medium">Opening Theme Customizer...</span>
      </div>
    );
  }

  if (!course) return null;

  const accentColor = theme.accentColor || '#ff5722';
  const coverImage = theme.coverImageUrl || course.coverImage || '/thumbnails/social-engineering.svg';

  // Contrast-aware text color for left split / hero brand container
  const heroTextColor = getContrastTextColor(accentColor);
  const heroSubtextColor = getContrastSubtextColor(accentColor);

  // Responsive device container width classes
  const deviceContainerClass =
    device === 'desktop'
      ? 'max-w-[1200px] w-full'
      : device === 'tablet_landscape'
      ? 'max-w-[1024px] w-full'
      : device === 'tablet_portrait'
      ? 'max-w-[768px] w-full'
      : device === 'mobile_landscape'
      ? 'max-w-[667px] w-full'
      : 'max-w-[375px] w-full';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col select-none">
      {/* 1. Top Utility & Responsive Device Bar */}
      <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Left: Back button ("< Theme") */}
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black py-1.5 px-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
          <span>Theme</span>
        </Link>

        {/* Center: 5 Responsive Device Preview Toggles */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === 'desktop' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Desktop (1200px)"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet_landscape')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              device === 'tablet_landscape' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Tablet Landscape (1024px)"
          >
            <Tablet className="w-4 h-4 rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet_portrait')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === 'tablet_portrait' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Tablet Portrait (768px)"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile_landscape')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              device === 'mobile_landscape' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Mobile Landscape (667px)"
          >
            <Smartphone className="w-4 h-4 rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile_portrait')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === 'mobile_portrait' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Mobile Portrait (375px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Save Status & Done Button */}
        <div className="flex items-center gap-3">
          <div className="h-4 flex items-center gap-1.5 text-[11px] text-gray-400">
            {savingStatus === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                <span>Saving...</span>
              </>
            )}
            {savingStatus === 'saved' && (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Saved</span>
              </>
            )}
          </div>

          <Link
            href={`/courses/${courseId}`}
            className="px-4 py-1.5 rounded-full bg-black hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Done
          </Link>
        </div>
      </header>

      {/* 2. Main Body: Left Sidebar + Live Canvas Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Theme Navigation */}
        <aside className="w-80 sm:w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-[calc(100vh-56px)] overflow-y-auto">
          {/* Active Theme Card at top */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Theme Preset</span>
              <button
                type="button"
                onClick={() => setPresetModalOpen(!presetModalOpen)}
                className="px-3 py-1 rounded-full border border-gray-300 hover:border-gray-400 bg-white text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Edit Preset
              </button>
            </div>

            <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
              <div className="w-12 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="Theme Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-gray-900 capitalize">{theme.preset || 'Rise'}</span>
                  <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Default</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu('colors')}
                  className="text-[11px] text-gray-500 hover:text-gray-900 underline mt-0.5"
                >
                  Apply a brand
                </button>
              </div>
            </div>

            {/* Preset Picker Dropdown */}
            {presetModalOpen && (
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded-xl shadow-lg space-y-2 animate-in fade-in duration-100">
                {[
                  {
                    id: 'craft',
                    name: 'LearnByCraft',
                    desc: 'Capable, calm, and crafted corporate learning with Deep Teal & Amber accents',
                  },
                  {
                    id: 'rise',
                    name: 'Rise Standard',
                    desc: 'Classic authoring studio styling, clean modern lines, round avatars',
                  },
                  {
                    id: 'apex',
                    name: 'Apex',
                    desc: 'Bold, geometric editorial design with sharp modern accents',
                  },
                  {
                    id: 'horizon',
                    name: 'Horizon',
                    desc: 'Soft, rounded humanist curves with generous whitespace',
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      handleUpdateTheme({ preset: p.id as ThemePreset });
                      setPresetModalOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      theme.preset === p.id
                        ? 'border-black bg-gray-50 font-semibold'
                        : 'border-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-bold text-gray-900 capitalize">{p.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 font-normal">{p.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6 Customization Sub-Menus (Navigation tabs) */}
          <div className="p-3 border-b border-gray-100 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'cover', label: 'Cover Page', icon: Layout },
              { id: 'navigation', label: 'Navigation', icon: NavIcon },
              { id: 'headers', label: 'Headers', icon: Layers },
              { id: 'colors', label: 'Colors', icon: Palette },
              { id: 'fonts', label: 'Fonts', icon: Type },
              { id: 'blocks', label: 'Blocks', icon: Sliders },
            ].map((menu) => {
              const Icon = menu.icon;
              const isActive = activeMenu === menu.id;
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setActiveMenu(menu.id as ThemeSubMenu)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{menu.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Menu Content Controls */}
          <div className="p-6 space-y-6 flex-1">
            {/* SUB-MENU 1: Cover Page */}
            {activeMenu === 'cover' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Cover Page Layout
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'split',
                        title: '50/50 Split Screen',
                        desc: 'Brand color on left & cover photo on right (LearnByCraft Standard)',
                      },
                      {
                        id: 'overlay',
                        title: 'Full-Screen Overlay',
                        desc: 'Full-width cinematic background photo with color overlay',
                      },
                      {
                        id: 'card',
                        title: 'Left-Aligned Card',
                        desc: 'Floating card container on top of photo',
                      },
                      {
                        id: 'minimal',
                        title: 'Minimal',
                        desc: 'Clean white header with accent badge',
                      },
                      {
                        id: 'center',
                        title: 'Centered Hero',
                        desc: 'Centered title and action button',
                      },
                    ].map((layout) => (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => handleUpdateTheme({ coverLayout: layout.id as CoverPageLayout })}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          theme.coverLayout === layout.id
                            ? 'border-gray-900 bg-gray-50/80 ring-2 ring-gray-900/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-gray-900">
                          <span>{layout.title}</span>
                          {theme.coverLayout === layout.id && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{layout.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover Photo Upload */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Cover Photo
                  </label>
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-[16/9] bg-gray-100 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="w-full py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingCover ? 'Uploading photo...' : 'Replace Cover Photo'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>

                {/* Overlay Opacity Slider */}
                {theme.coverLayout === 'overlay' && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                      <span>Overlay Opacity</span>
                      <span>{theme.overlayOpacity ?? 50}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={theme.overlayOpacity ?? 50}
                      onChange={(e) => handleUpdateTheme({ overlayOpacity: parseInt(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* SUB-MENU 2: Navigation */}
            {activeMenu === 'navigation' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Sidebar Navigation State
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'open', label: 'Open by default', desc: 'Sidebar outline stays visible on load' },
                      { id: 'closed', label: 'Closed by default', desc: 'Collapsed into a menu toggle button' },
                      { id: 'disabled', label: 'Disabled / No Sidebar', desc: 'Linear view without side outline' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleUpdateTheme({ sidebarState: s.id as SidebarState })}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                          theme.sidebarState === s.id
                            ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{s.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Navigation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'free', label: 'Free' },
                      { id: 'restricted', label: 'Restricted' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleUpdatePublish({ navigationMode: mode.id as 'free' | 'restricted' })}
                        className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                          publish.navigationMode === mode.id
                            ? 'bg-black text-white border-black'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-800">Previous & Next Buttons</div>
                      <div className="text-[11px] text-gray-500">Show bottom navigation bar in lessons</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={theme.showPrevNextButtons ?? true}
                      onChange={(e) => handleUpdateTheme({ showPrevNextButtons: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-800">Lesson Count Labels</div>
                      <div className="text-[11px] text-gray-500">Show &ldquo;Lesson 1 of 5&rdquo; indicator</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={theme.showLessonNumbers ?? true}
                      onChange={(e) => handleUpdateTheme({ showLessonNumbers: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MENU 3: Lesson Headers */}
            {activeMenu === 'headers' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Header Style
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'plain', label: 'Plain Light', desc: 'Clean white background with brand accent bar' },
                      { id: 'brand', label: 'Solid Brand Accent Color', desc: 'Bold saturated brand color background' },
                      { id: 'image', label: 'Full-Width Image Background', desc: 'Displays course cover photo behind title' },
                      { id: 'overlay', label: 'Overlay', desc: 'Dark gradient scrim over image' },
                    ].map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleUpdateTheme({ headerStyle: h.id as HeaderStyle })}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                          theme.headerStyle === h.id
                            ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{h.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{h.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Header Height
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'small', label: 'Small' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'large', label: 'Large' },
                    ].map((height) => (
                      <button
                        key={height.id}
                        type="button"
                        onClick={() => handleUpdateTheme({ headerHeight: height.id as HeaderHeight })}
                        className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                          theme.headerHeight === height.id
                            ? 'bg-black text-white border-black'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {height.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MENU 4: Colors */}
            {activeMenu === 'colors' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Brand Accent Color
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Controls buttons, cover page tints, lesson indicators, and quiz feedback.
                  </p>

                  {/* Preset Swatches */}
                  <div className="grid grid-cols-4 gap-2.5 mb-4">
                    {PRESET_COLORS.map((color) => {
                      const isSelected = accentColor.toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => handleUpdateTheme({ accentColor: color.hex })}
                          className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 shadow-2xs relative border border-black/10 cursor-pointer"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-sm" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Hex Input */}
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => handleUpdateTheme({ accentColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => handleUpdateTheme({ accentColor: e.target.value })}
                      placeholder="#ff5722"
                      className="w-32 px-3 py-2 rounded-lg border border-gray-300 text-xs font-mono uppercase text-gray-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <div
                      className="h-7 flex-1 rounded-full shadow-inner"
                      style={{ backgroundColor: accentColor }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 text-xs text-gray-600 space-y-1">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Contrast-Aware Text Engine</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Automatically calculated contrast ensures all text on the cover page adjusts dynamically to black or white for accessibility compliance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MENU 5: Fonts */}
            {activeMenu === 'fonts' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Typography Pairing
                  </label>
                  <div className="space-y-2.5">
                    {FONT_PAIRINGS.map((font) => {
                      const isSelected = theme.fontPairing === font.name;
                      return (
                        <button
                          key={font.name}
                          type="button"
                          onClick={() =>
                            handleUpdateTheme({
                              fontPairing: font.name,
                              fontHeading: font.heading,
                              fontBody: font.body,
                            })
                          }
                          className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-gray-900">{font.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{font.category}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MENU 6: Blocks */}
            {activeMenu === 'blocks' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-800">Block Entrance Animations</div>
                      <div className="text-[11px] text-gray-500">Subtle fade-in on scroll as learner progresses</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={theme.blockAnimations ?? true}
                      onChange={(e) => handleUpdateTheme({ blockAnimations: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Button Styling
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'pill', label: 'Pill Rounded' },
                      { id: 'rounded', label: 'Rounded Square' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleUpdateTheme({ buttonStyle: b.id as 'pill' | 'rounded' })}
                        className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                          theme.buttonStyle === b.id
                            ? 'bg-black text-white border-black'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 3. Live Interactive Course Cover Preview (Main Right Stage) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/90">
          <div className={`${deviceContainerClass} mx-auto min-h-full transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-800`}>
            {/* HERO SECTION based on coverLayout */}
            {theme.coverLayout === 'split' ? (
              // 50/50 Split Screen: Left Brand Color & Right Photo
              <div className="grid grid-cols-1 md:grid-cols-2 min-h-[460px] sm:min-h-[500px]">
                {/* Left Half: Brand Color with Content */}
                <div
                  className="p-8 sm:p-14 flex flex-col justify-between transition-colors duration-300"
                  style={{ backgroundColor: accentColor, color: heroTextColor }}
                >
                  <div className="space-y-4">
                    {/* Author Badge */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
                        {course.authorAvatar || 'MA'}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: heroSubtextColor }}>
                        {course.authorName || 'Mike Afurong'}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight pt-2">
                      {course.title}
                    </h1>
                  </div>

                  {/* Start Course Button */}
                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => router.push(`/courses/${courseId}/preview`)}
                      className={`px-8 py-3.5 text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:scale-105 cursor-pointer flex items-center gap-2 ${
                        theme.buttonStyle === 'rounded' ? 'rounded-xl' : 'rounded-full'
                      }`}
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                      }}
                    >
                      <span>START COURSE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Half: Full Bleed Cover Photo */}
                <div className="relative min-h-[260px] md:min-h-full bg-gray-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt={course.title} className="w-full h-full object-cover" />
                </div>
              </div>
            ) : theme.coverLayout === 'overlay' ? (
              // Full Screen Overlay
              <div className="relative min-h-[480px] p-8 sm:p-14 flex flex-col justify-between overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: (theme.overlayOpacity ?? 50) / 100 }}
                />

                <div className="relative z-10 space-y-4 text-white max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-xs">
                      {course.authorAvatar || 'MA'}
                    </div>
                    <span className="text-xs font-semibold text-white/80">{course.authorName}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                    {course.title}
                  </h1>
                </div>

                <div className="relative z-10 pt-8">
                  <button
                    type="button"
                    onClick={() => router.push(`/courses/${courseId}/preview`)}
                    className="px-8 py-3.5 rounded-full text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:scale-105 cursor-pointer flex items-center gap-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span>START COURSE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              // Centered or Minimal Hero
              <div className="p-8 sm:p-14 text-center bg-white border-b border-gray-100 flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full mb-6" style={{ backgroundColor: accentColor }} />
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 max-w-2xl">
                  {course.title}
                </h1>
                <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-gray-500">
                  <div className="w-6 h-6 rounded-full bg-[#ec4899] text-white flex items-center justify-center font-bold text-[10px]">
                    {course.authorAvatar || 'MA'}
                  </div>
                  <span>{course.authorName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/courses/${courseId}/preview`)}
                  className="mt-8 px-8 py-3.5 rounded-full text-white text-xs font-bold tracking-wider uppercase shadow-md hover:scale-105 transition-all cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  START COURSE
                </button>
              </div>
            )}

            {/* COURSE OVERVIEW & LESSON OUTLINE SECTION */}
            <div className="p-8 sm:p-14 bg-white max-w-3xl mx-auto w-full">
              {/* Course Description in Body Font */}
              <div className="text-sm sm:text-base text-gray-600 leading-relaxed pb-8 border-b border-gray-100">
                {course.description ||
                  'Equip your team with the critical awareness to identify, evade, and report phishing, pretexting, and social manipulation attempts in modern hybrid workplaces.'}
              </div>

              {/* Clickable Lesson Outline with Circular Progress Rings */}
              <div className="pt-8 space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Course Content
                </div>

                {(course.lessons || []).map((l, idx) => {
                  if (l.type === 'section') {
                    return (
                      <div
                        key={l.id}
                        className="pt-6 pb-2 font-bold text-xs uppercase tracking-wider text-gray-800 border-b border-gray-100"
                      >
                        {l.title}
                      </div>
                    );
                  }

                  const isQuiz = l.type === 'quiz';

                  return (
                    <div
                      key={l.id}
                      onClick={() => router.push(`/courses/${courseId}/lessons/${l.id}`)}
                      className="p-4 rounded-xl border border-gray-200/90 hover:border-gray-400 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isQuiz ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'
                          }`}
                        >
                          {isQuiz ? <HelpCircle className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-sky-600 transition-colors truncate">
                            {theme.showLessonNumbers ? `${idx + 1}. ` : ''}
                            {l.title}
                          </div>
                          <div className="text-[11px] text-gray-400 capitalize mt-0.5">
                            {isQuiz ? 'Quiz' : 'Lesson'}
                          </div>
                        </div>
                      </div>

                      {/* Empty 0% Circular Progress Indicator */}
                      <div className="flex-shrink-0 text-gray-300 group-hover:text-gray-400">
                        <Circle className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
