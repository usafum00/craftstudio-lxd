'use client';

import React, { useState, useEffect } from 'react';
import { Block, BlockSettings } from '@/lib/types';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';
import { MagicTransformerPopover } from './MagicTransformerPopover';
import {
  X,
  FileEdit,
  Sliders,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  Code,
  List,
  Grid,
  Check,
} from 'lucide-react';

interface BlockSettingsDrawerProps {
  isOpen: boolean;
  block: Block | null;
  initialTab?: 'content' | 'settings';
  accentColor?: string;
  onClose: () => void;
  onSave: (blockId: string, updatedContent: Record<string, unknown>, updatedSettings: BlockSettings) => void;
  onUploadMedia?: (file: File) => Promise<string | null>;
}

export function BlockSettingsDrawer({
  isOpen,
  block,
  initialTab = 'content',
  accentColor = '#ff5722',
  onClose,
  onSave,
  onUploadMedia,
}: BlockSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>(initialTab);
  const [contentState, setContentState] = useState<Record<string, unknown>>({});
  const [settingsState, setSettingsState] = useState<BlockSettings>({});
  const [uploading, setUploading] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, block?.id]);

  useEffect(() => {
    if (block) {
      setContentState(block.content || {});
      setSettingsState(block.settings || {});
    }
  }, [block]);

  if (!isOpen || !block) return null;

  const handleContentChange = (field: string, val: unknown) => {
    const updated = { ...contentState, [field]: val };
    setContentState(updated);
    onSave(block.id, updated, settingsState);
  };

  const handleSettingsChange = (field: keyof BlockSettings, val: unknown) => {
    const updated = { ...settingsState, [field]: val };
    setSettingsState(updated);
    onSave(block.id, contentState, updated);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, targetField: string) => {
    const file = e.target.files?.[0];
    if (file && onUploadMedia) {
      setUploading(true);
      try {
        const url = await onUploadMedia(file);
        if (url) {
          handleContentChange(targetField, url);
        }
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/35 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full border-r border-gray-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'content' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-sky-600" />
              <span>Content</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Style & Settings</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'content' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {block.category} • {block.subtype.replace('_', ' ')}
                </div>
                <MagicTransformerPopover
                  block={block}
                  onUpdateContent={(id, newContent) => {
                    setContentState(newContent);
                    onSave(id, newContent, settingsState);
                  }}
                />
              </div>

              {/* Title / Heading input */}
              {'heading' in contentState && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={(contentState.heading as string) || ''}
                    onChange={(e) => handleContentChange('heading', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              {'subheading' in contentState && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Subheading
                  </label>
                  <input
                    type="text"
                    value={(contentState.subheading as string) || ''}
                    onChange={(e) => handleContentChange('subheading', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              {'statement' in contentState && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Statement Text
                  </label>
                  <textarea
                    rows={3}
                    value={(contentState.statement as string) || ''}
                    onChange={(e) => handleContentChange('statement', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                  />
                </div>
              )}

              {'subtext' in contentState && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Subtext / Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={(contentState.subtext as string) || ''}
                    onChange={(e) => handleContentChange('subtext', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                  />
                </div>
              )}

              {'quote' in contentState && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Quote Body
                  </label>
                  <textarea
                    rows={3}
                    value={(contentState.quote as string) || ''}
                    onChange={(e) => handleContentChange('quote', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                  />
                </div>
              )}

              {'author' in contentState && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Author / Citation
                  </label>
                  <input
                    type="text"
                    value={(contentState.author as string) || ''}
                    onChange={(e) => handleContentChange('author', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              {'url' in contentState && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Image File & Media
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-lg border border-gray-200 bg-gray-100 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={(contentState.url as string) || '/thumbnails/social-engineering.svg'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      <span>Media Studio & Flow</span>
                    </button>
                    <label className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-600 flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*,video/*,audio/*"
                        onChange={(e) => handleFileChange(e, 'url')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {'caption' in contentState && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Image Caption
                  </label>
                  <input
                    type="text"
                    value={(contentState.caption as string) || ''}
                    onChange={(e) => handleContentChange('caption', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              {/* Continue button text */}
              {block.category === 'divider' && block.subtype === 'continue_button' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={(contentState.label as string) || (settingsState.buttonText as string) || 'Continue'}
                    onChange={(e) => {
                      handleContentChange('label', e.target.value);
                      handleSettingsChange('buttonText', e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              {/* ---------------- CHART CONTENT EDITOR ---------------- */}
              {block.category === 'chart' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Chart Title
                    </label>
                    <input
                      type="text"
                      value={(contentState.title as string) || ''}
                      onChange={(e) => handleContentChange('title', e.target.value)}
                      placeholder="Chart Title"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Subtitle / Context
                    </label>
                    <input
                      type="text"
                      value={(contentState.subtitle as string) || ''}
                      onChange={(e) => handleContentChange('subtitle', e.target.value)}
                      placeholder="Brief explanatory note or time period"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  {/* Data Rows Repeater */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <span>Data Points ({Array.isArray(contentState.data) ? (contentState.data as Array<{ label?: string; value?: number }>).length : 0})</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentData = Array.isArray(contentState.data)
                            ? [...(contentState.data as Array<{ label?: string; value?: number }>)]
                            : [
                                { label: 'Category A', value: 40 },
                                { label: 'Category B', value: 30 },
                              ];
                          currentData.push({
                            label: `Category ${currentData.length + 1}`,
                            value: 20,
                          });
                          handleContentChange('data', currentData);
                        }}
                        className="text-sky-600 hover:text-sky-700 text-xs font-semibold cursor-pointer"
                      >
                        + Add Row
                      </button>
                    </div>

                    {(Array.isArray(contentState.data)
                      ? (contentState.data as Array<{ label?: string; value?: number }>)
                      : [
                          { label: 'Phishing & Pretexting', value: 43 },
                          { label: 'Stolen Credentials', value: 27 },
                          { label: 'Vulnerability Exploit', value: 16 },
                        ]
                    ).map((row, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <input
                          type="text"
                          value={row.label || ''}
                          onChange={(e) => {
                            const data = Array.isArray(contentState.data)
                              ? [...(contentState.data as Array<{ label?: string; value?: number }>)]
                              : [
                                  { label: 'Phishing & Pretexting', value: 43 },
                                  { label: 'Stolen Credentials', value: 27 },
                                  { label: 'Vulnerability Exploit', value: 16 },
                                ];
                            data[rIdx] = { ...data[rIdx], label: e.target.value };
                            handleContentChange('data', data);
                          }}
                          placeholder="Label"
                          className="flex-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-900"
                        />
                        <input
                          type="number"
                          value={row.value ?? 0}
                          onChange={(e) => {
                            const data = Array.isArray(contentState.data)
                              ? [...(contentState.data as Array<{ label?: string; value?: number }>)]
                              : [
                                  { label: 'Phishing & Pretexting', value: 43 },
                                  { label: 'Stolen Credentials', value: 27 },
                                  { label: 'Vulnerability Exploit', value: 16 },
                                ];
                            data[rIdx] = { ...data[rIdx], value: Number(e.target.value) };
                            handleContentChange('data', data);
                          }}
                          placeholder="Value"
                          className="w-18 px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const data = (contentState.data as Array<{ label?: string; value?: number }>).filter((_, i) => i !== rIdx);
                            handleContentChange('data', data);
                          }}
                          className="text-gray-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------- CODE CONTENT EDITOR ---------------- */}
              {block.category === 'code' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Programming Language
                    </label>
                    <select
                      value={(contentState.language as string) || 'javascript'}
                      onChange={(e) => handleContentChange('language', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="json">JSON</option>
                      <option value="sql">SQL</option>
                      <option value="bash">Bash / Shell</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Code Snippet
                    </label>
                    <textarea
                      rows={6}
                      value={(contentState.code as string) || ''}
                      onChange={(e) => handleContentChange('code', e.target.value)}
                      placeholder="// Paste code here..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 font-mono outline-none focus:ring-1 focus:ring-sky-500 resize-none bg-slate-50"
                    />
                  </div>

                  {block.subtype === 'code_embed' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        HTML / JS Sandbox Code
                      </label>
                      <textarea
                        rows={6}
                        value={(contentState.htmlCode as string) || ''}
                        onChange={(e) => handleContentChange('htmlCode', e.target.value)}
                        placeholder="<div>Custom sandbox markup...</div>"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 font-mono outline-none focus:ring-1 focus:ring-sky-500 resize-none bg-slate-50"
                      />
                    </div>
                  )}

                  {block.subtype === 'upload_project' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Web Package (.ZIP)
                      </label>
                      <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center space-y-2">
                        <div className="text-xs text-gray-600 font-semibold">
                          {(contentState.projectFileName as string) || 'No package uploaded yet'}
                        </div>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 text-white text-xs font-semibold cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Package (.zip)</span>
                          <input
                            type="file"
                            accept=".zip"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const fd = new FormData();
                              fd.append('file', file);
                              const res = await fetch('/api/upload-project', { method: 'POST', body: fd });
                              if (res.ok) {
                                const data = await res.json();
                                handleContentChange('projectUrl', data.url);
                                handleContentChange('projectFileName', file.name);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- LIST CONTENT EDITOR ---------------- */}
              {block.category === 'list' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <span>List Items ({Array.isArray(contentState.items) ? (contentState.items as Array<string | { text?: string }>).length : 0})</span>
                    <button
                      type="button"
                      onClick={() => {
                        const items = Array.isArray(contentState.items)
                          ? [...(contentState.items as Array<string | { text?: string }>)]
                          : ['First item', 'Second item'];
                        items.push(`Item ${items.length + 1}`);
                        handleContentChange('items', items);
                      }}
                      className="text-sky-600 hover:text-sky-700 text-xs font-semibold cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>

                  {(Array.isArray(contentState.items)
                    ? (contentState.items as Array<string | { text?: string }>)
                    : ['Verify sender domain authenticity', 'Inspect all embedded URLs before clicking']
                  ).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <input
                        type="text"
                        value={typeof it === 'string' ? it : it?.text || ''}
                        onChange={(e) => {
                          const items = Array.isArray(contentState.items)
                            ? [...(contentState.items as Array<string | { text?: string }>)]
                            : ['Verify sender domain authenticity', 'Inspect all embedded URLs before clicking'];
                          if (typeof items[idx] === 'object' && items[idx] !== null) {
                            items[idx] = { ...(items[idx] as { text?: string }), text: e.target.value };
                          } else {
                            items[idx] = e.target.value;
                          }
                          handleContentChange('items', items);
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const items = (contentState.items as Array<string | { text?: string }>).filter((_, i) => i !== idx);
                          handleContentChange('items', items);
                        }}
                        className="text-gray-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ---------------- TABLE CONTENT EDITOR ---------------- */}
              {block.category === 'text' && block.subtype === 'table' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in">
                  <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Table Matrix Editor
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(contentState.rows) &&
                      (contentState.rows as string[][]).map((row, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 w-4">{rIdx + 1}</span>
                          {row.map((cell, cIdx) => (
                            <input
                              key={cIdx}
                              type="text"
                              value={cell || ''}
                              onChange={(e) => {
                                const rows = JSON.parse(JSON.stringify(contentState.rows || []));
                                rows[rIdx][cIdx] = e.target.value;
                                handleContentChange('rows', rows);
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-900"
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ---------------- GALLERY CONTENT EDITOR ---------------- */}
              {block.category === 'gallery' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <span>Gallery Items ({Array.isArray(contentState.items) ? (contentState.items as Array<{ url?: string; caption?: string }>).length : 0})</span>
                    <button
                      type="button"
                      onClick={() => {
                        const items = Array.isArray(contentState.items)
                          ? [...(contentState.items as Array<{ url?: string; caption?: string }>)]
                          : [];
                        items.push({
                          url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
                          caption: `Gallery Image ${items.length + 1}`,
                        });
                        handleContentChange('items', items);
                      }}
                      className="text-sky-600 hover:text-sky-700 text-xs font-semibold cursor-pointer"
                    >
                      + Add Image
                    </button>
                  </div>

                  {(Array.isArray(contentState.items) ? (contentState.items as Array<{ url?: string; caption?: string }>) : []).map((it, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">Image {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const items = (contentState.items as Array<{ url?: string; caption?: string }>).filter((_, i) => i !== idx);
                            handleContentChange('items', items);
                          }}
                          className="text-gray-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="url"
                        value={it.url || ''}
                        onChange={(e) => {
                          const items = [...(contentState.items as Array<{ url?: string; caption?: string }>)];
                          items[idx] = { ...items[idx], url: e.target.value };
                          handleContentChange('items', items);
                        }}
                        placeholder="Image URL"
                        className="w-full px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-900"
                      />
                      <input
                        type="text"
                        value={it.caption || ''}
                        onChange={(e) => {
                          const items = [...(contentState.items as Array<{ url?: string; caption?: string }>)];
                          items[idx] = { ...items[idx], caption: e.target.value };
                          handleContentChange('items', items);
                        }}
                        placeholder="Caption text"
                        className="w-full px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-900"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ---------------- SURVEY CONTENT EDITOR ---------------- */}
              {block.category === 'survey' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Survey Question Prompt
                    </label>
                    <textarea
                      rows={2}
                      value={(contentState.question as string) || (contentState.prompt as string) || ''}
                      onChange={(e) => {
                        handleContentChange('question', e.target.value);
                        handleContentChange('prompt', e.target.value);
                      }}
                      placeholder="Enter survey question..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Padding Top */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Top Padding
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Small', px: '16px' },
                    { id: 'medium', label: 'Medium', px: '40px' },
                    { id: 'large', label: 'Large', px: '80px' },
                  ].map((p) => {
                    const isSelected = (settingsState.paddingTop || 'medium') === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSettingsChange('paddingTop', p.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10 font-bold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs text-gray-900">{p.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{p.px}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Padding Bottom */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Bottom Padding
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Small', px: '16px' },
                    { id: 'medium', label: 'Medium', px: '40px' },
                    { id: 'large', label: 'Large', px: '80px' },
                  ].map((p) => {
                    const isSelected = (settingsState.paddingBottom || 'medium') === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSettingsChange('paddingBottom', p.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10 font-bold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs text-gray-900">{p.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{p.px}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background Color */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Block Background
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'white', label: 'White', color: '#ffffff', border: 'border-gray-200' },
                    { id: 'gray', label: 'Light Gray', color: '#f8fafc', border: 'border-gray-200' },
                    { id: 'dark', label: 'Dark Slate', color: '#0f172a', border: 'border-slate-800' },
                    { id: 'brand', label: 'Brand', color: accentColor, border: 'border-transparent' },
                  ].map((bg) => {
                    const isSelected = (settingsState.backgroundColor || 'white') === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => handleSettingsChange('backgroundColor', bg.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-black font-semibold' : 'hover:scale-105'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full ${bg.border} border shadow-2xs`}
                          style={{ backgroundColor: bg.color }}
                        />
                        <span className="text-[10px] text-gray-700">{bg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Settings for Image & Text */}
              {block.category === 'image' && block.subtype === 'image_text' && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                      Image Column Width
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['25', '50', '75'].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => handleSettingsChange('imageWidth', w as '25' | '50' | '75')}
                          className={`py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                            (settingsState.imageWidth || '50') === w
                              ? 'bg-black text-white border-black'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {w}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                      Image Alignment Position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['left', 'right'].map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => handleSettingsChange('imagePosition', pos as 'left' | 'right')}
                          className={`py-2 rounded-lg border text-xs font-semibold capitalize cursor-pointer ${
                            (settingsState.imagePosition || 'left') === pos
                              ? 'bg-black text-white border-black'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Accordion Keep Open Setting */}
              {block.category === 'interactive' && block.subtype === 'accordion' && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Accordion Behavior
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!settingsState.keepOpen}
                      onChange={(e) => handleSettingsChange('keepOpen', e.target.checked)}
                      className="rounded"
                    />
                    <span>Allow multiple items to stay open</span>
                  </label>
                </div>
              )}

              {/* Continue Block Requirement Setting */}
              {block.category === 'divider' && block.subtype === 'continue_button' && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Completion Requirement
                  </label>
                  <select
                    value={settingsState.completionRequirement || 'none'}
                    onChange={(e) =>
                      handleSettingsChange('completionRequirement', e.target.value as 'none' | 'block_above' | 'all_above')
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="none">None (Learner can click freely)</option>
                    <option value="block_above">Complete block directly above</option>
                    <option value="all_above">Complete all blocks above</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-black text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Backdrop Click */}
      <div className="flex-1" onClick={onClose} />

      {/* Unified Media Modal */}
      <UnifiedMediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(url) => {
          handleContentChange('url', url);
        }}
        currentUrl={(contentState.url as string) || ''}
        accentColor={accentColor}
      />
    </div>
  );
}
