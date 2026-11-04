'use client';

import React from 'react';
import { BlockSettings } from '@/lib/types';
import { X, Link2, Unlink2 } from 'lucide-react';

interface FormatPopoverProps {
  blockCategory: string;
  blockSubtype: string;
  settings: BlockSettings;
  onUpdateSettings: (newSettings: BlockSettings) => void;
  onClose: () => void;
}

export function FormatPopover({
  blockCategory,
  blockSubtype,
  settings,
  onUpdateSettings,
  onClose,
}: FormatPopoverProps) {
  // Convert padding to numeric values
  const getNumericPadding = (val: unknown, fallback: number) => {
    if (typeof val === 'number') return val;
    if (val === 'small') return 15;
    if (val === 'medium') return 30;
    if (val === 'large') return 60;
    return fallback;
  };

  const topPadding = getNumericPadding(settings.paddingTop, 30);
  const bottomPadding = getNumericPadding(settings.paddingBottom, 30);
  const isLinked = settings.paddingLinked !== false;

  const widthMode = (settings.contentWidth || settings.width || 'M') as 'S' | 'M' | 'L';
  const borderRadius = typeof settings.borderRadius === 'number' ? settings.borderRadius : 0;
  const allowForwardSeeking = settings.allowForwardSeeking !== false;

  const isVideo = blockCategory === 'multimedia' && blockSubtype === 'video';
  const isMedia = isVideo || blockCategory === 'image' || blockCategory === 'gallery';

  const handlePaddingPreset = (preset: 'S' | 'M' | 'L' | '...') => {
    if (preset === 'S') {
      onUpdateSettings({ ...settings, paddingTop: 15, paddingBottom: 15 });
    } else if (preset === 'M') {
      onUpdateSettings({ ...settings, paddingTop: 30, paddingBottom: 30 });
    } else if (preset === 'L') {
      onUpdateSettings({ ...settings, paddingTop: 60, paddingBottom: 60 });
    }
  };

  const activePaddingPreset =
    topPadding === 15 && bottomPadding === 15
      ? 'S'
      : topPadding === 30 && bottomPadding === 30
      ? 'M'
      : topPadding === 60 && bottomPadding === 60
      ? 'L'
      : '...';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-8 left-16 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-40 animate-in fade-in zoom-in-95 duration-100 select-none text-left"
    >
      {/* Notch / Pointer */}
      <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h4 className="text-xs font-bold text-gray-900 tracking-tight">Format</h4>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors cursor-pointer"
          title="Close format panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Section 1: Block padding */}
        <div>
          <div className="text-[11px] font-semibold text-gray-700 mb-1.5">
            Block padding
          </div>

          {/* Segmented S / M / L / ... buttons */}
          <div className="grid grid-cols-4 bg-slate-100 p-0.5 rounded-lg border border-slate-200 mb-3">
            {(['S', 'M', 'L', '...'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePaddingPreset(p)}
                className={`py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activePaddingPreset === p
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Padding Sliders */}
          {isLinked ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                <span>Top and bottom</span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, paddingLinked: false })}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                  title="Unlink top and bottom padding"
                >
                  <Link2 className="w-3.5 h-3.5 text-sky-600" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={topPadding}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onUpdateSettings({ ...settings, paddingTop: val, paddingBottom: val });
                  }}
                  className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={topPadding}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onUpdateSettings({ ...settings, paddingTop: val, paddingBottom: val });
                  }}
                  className="w-12 text-center text-xs border border-slate-200 rounded py-0.5 font-semibold text-gray-800"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Separate padding</span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, paddingLinked: true })}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                  title="Link top and bottom padding"
                >
                  <Unlink2 className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
              <div>
                <span className="text-[10px] text-gray-400">Top:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={topPadding}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        paddingTop: parseInt(e.target.value) || 0,
                      })
                    }
                    className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={topPadding}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        paddingTop: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-12 text-center text-xs border border-slate-200 rounded py-0.5 font-semibold text-gray-800"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400">Bottom:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={bottomPadding}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        paddingBottom: parseInt(e.target.value) || 0,
                      })
                    }
                    className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={bottomPadding}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        paddingBottom: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-12 text-center text-xs border border-slate-200 rounded py-0.5 font-semibold text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Video width / Content width */}
        <div>
          <div className="text-[11px] font-semibold text-gray-700 mb-1.5">
            {isVideo ? 'Video width' : 'Content width'}
          </div>
          <div className="grid grid-cols-3 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['S', 'M', 'L'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onUpdateSettings({ ...settings, contentWidth: w, width: w })}
                className={`py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  widthMode === w
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Corner Radius (Media & Card blocks) */}
        {isMedia && (
          <div>
            <div className="text-[11px] font-semibold text-gray-700 mb-1.5">
              Corner Radius
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="32"
                step="2"
                value={borderRadius}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    borderRadius: parseInt(e.target.value) || 0,
                  })
                }
                className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="32"
                value={borderRadius}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    borderRadius: parseInt(e.target.value) || 0,
                  })
                }
                className="w-12 text-center text-xs border border-slate-200 rounded py-0.5 font-semibold text-gray-800"
              />
            </div>
          </div>
        )}

        {/* Section 4: Seeking (Video & Audio blocks) */}
        {(isVideo || blockSubtype === 'audio') && (
          <div className="pt-1">
            <div className="text-[11px] font-semibold text-gray-700 mb-1">
              Seeking
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={allowForwardSeeking}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    allowForwardSeeking: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-black focus:ring-black cursor-pointer"
              />
              <span>Allow forward seeking</span>
            </label>
          </div>
        )}

        {/* Section 5: Accordion Specific Settings */}
        {blockCategory === 'interactive' && blockSubtype === 'accordion' && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-gray-700 mb-1.5">
                Panel Behavior
              </div>
              <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-center">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, keepOpen: true })}
                  className={`py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    settings.keepOpen === true
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Stay open
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, keepOpen: false })}
                  className={`py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    settings.keepOpen !== true
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  One at a time
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-gray-700 mb-1.5">
                Icon Style
              </div>
              <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-center">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, iconStyle: 'plus' })}
                  className={`py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    (settings.iconStyle || 'plus') === 'plus'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  + / -
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, iconStyle: 'chevron' })}
                  className={`py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    settings.iconStyle === 'chevron'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Chevron
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Labeled Graphic Specific Settings */}
        {blockCategory === 'interactive' && blockSubtype === 'labeled_graphic' && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-gray-700 mb-1.5">
                Marker Color
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(settings.markerColor as string) || '#ff5722'}
                  onChange={(e) => onUpdateSettings({ ...settings, markerColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={(settings.markerColor as string) || '#ff5722'}
                  onChange={(e) => onUpdateSettings({ ...settings, markerColor: e.target.value })}
                  placeholder="#ff5722"
                  className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded text-gray-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.zoomOnClick !== false}
                  onChange={(e) => onUpdateSettings({ ...settings, zoomOnClick: e.target.checked })}
                  className="rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                />
                <span>Zoom on Click</span>
              </label>
            </div>
          </div>
        )}

        {/* Section 7: Process Specific Settings */}
        {blockCategory === 'interactive' && blockSubtype === 'process' && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Step Label Text
              </label>
              <input
                type="text"
                value={(settings.stepLabel as string) || 'Step'}
                onChange={(e) => onUpdateSettings({ ...settings, stepLabel: e.target.value })}
                placeholder="Step, Phase, Part..."
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showStepNumbers !== false}
                  onChange={(e) => onUpdateSettings({ ...settings, showStepNumbers: e.target.checked })}
                  className="rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                />
                <span>Show Step Numbers</span>
              </label>
            </div>
          </div>
        )}

        {/* Section 8: Button & Button Stack Specific Settings */}
        {blockCategory === 'interactive' && (blockSubtype === 'button' || blockSubtype === 'button_stack') && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-gray-700 mb-1.5">
                Button Alignment
              </div>
              <div className="grid grid-cols-3 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-center">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, buttonAlignment: align })}
                    className={`py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                      (settings.buttonAlignment || 'center') === align
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-gray-700 mb-1.5">
                Corner Radius
              </div>
              <div className="grid grid-cols-3 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-center">
                {[
                  { id: 'pill', label: 'Pill', rad: 9999 },
                  { id: 'rounded', label: 'Rounded', rad: 8 },
                  { id: 'square', label: 'Square', rad: 0 },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, buttonRadius: r.rad })}
                    className={`py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      (settings.buttonRadius ?? 9999) === r.rad
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
