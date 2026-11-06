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
  Maximize2,
  Minimize2,
  FolderArchive,
  FileCode,
  ExternalLink,
  CheckCircle2,
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
  const [isCodeEditorModalOpen, setIsCodeEditorModalOpen] = useState(false);
  const [codeEditorPreviewMode, setCodeEditorPreviewMode] = useState<'split' | 'code'>('split');
  const [tempHtmlCode, setTempHtmlCode] = useState('');

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
                <div className="space-y-5 pt-2 border-t border-gray-100 animate-in fade-in">
                  {/* ========================================================= */}
                  {/* VARIANT A: CUSTOM HTML / INTERACTIVE WIDGET (code_embed)   */}
                  {/* ========================================================= */}
                  {block.subtype === 'code_embed' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                          <FileCode className="w-4 h-4 text-sky-600" />
                          <span>Custom HTML / AI Interactive App</span>
                        </div>
                        <p className="text-[11px] text-sky-700 leading-relaxed">
                          Paste single-file HTML/CSS/JS or interactive React/Tailwind widgets. Raw code stays 100% hidden from learners on the canvas.
                        </p>
                      </div>

                      {/* Code Editor Header & Full Screen Trigger */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            HTML / CSS / JavaScript Code
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setTempHtmlCode((contentState.htmlCode as string) || '');
                              setIsCodeEditorModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-black text-white text-[11px] font-semibold transition-all hover:scale-102 cursor-pointer shadow-xs"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Full Screen Code Editor</span>
                          </button>
                        </div>

                        <textarea
                          rows={8}
                          value={(contentState.htmlCode as string) || ''}
                          onChange={(e) => handleContentChange('htmlCode', e.target.value)}
                          placeholder="<div class='interactive-widget'>&#10;  <!-- Paste your HTML/CSS/JS here -->&#10;</div>"
                          className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs text-emerald-400 font-mono outline-none focus:ring-2 focus:ring-sky-500 bg-slate-950 resize-y leading-relaxed shadow-inner"
                        />
                      </div>

                      {/* Quick AI Template Starters */}
                      <div>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Insert Sample AI Interactive Widget:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleContentChange(
                                'htmlCode',
                                `<div style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem 1.5rem; background: linear-gradient(135deg, #090d16 0%, #1e293b 100%); color: white; border-radius: 14px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);"><div style="display: inline-block; padding: 4px 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 99px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #38bdf8; margin-bottom: 8px;">Security Threat Simulation</div><h3 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">Perimeter Defense Trigger</h3><p style="color: #94a3b8; font-size: 13px; margin: 0 auto 16px; max-width: 380px;">Click the button below to test immediate containment protocols.</p><button onclick="document.getElementById('threat-res').innerText = '🛡️ Protocol Executed: Malicious IP blacklisted across all edge nodes!'; this.style.opacity='0.7';" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; border: none; padding: 10px 24px; border-radius: 99px; font-weight: bold; font-size: 13px; cursor: pointer;">Simulate Breach Defense</button><div id="threat-res" style="margin-top: 14px; font-size: 12px; font-weight: 600; color: #4ade80; min-height: 18px;"></div></div>`
                              )
                            }
                            className="p-2 text-left rounded-lg border border-gray-200 hover:border-gray-900 bg-white hover:bg-gray-50 text-[11px] font-medium text-gray-700 transition-colors"
                          >
                            🛡️ Security Threat Trigger
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleContentChange(
                                'htmlCode',
                                `<div style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; border-radius: 14px;"><h3 style="color: #a78bfa; margin: 0 0 6px; font-size: 18px;">Live Counter Sandbox</h3><p style="color: #c7d2fe; font-size: 12px; margin-bottom: 12px;">Stateful interactivity running inside sandbox</p><div id="cnt" style="font-size: 38px; font-weight: 800; color: #38bdf8; margin: 10px 0;">0</div><button onclick="var c=document.getElementById('cnt'); c.innerText = parseInt(c.innerText)+1" style="background: #6366f1; color: white; border: none; padding: 10px 22px; border-radius: 99px; font-weight: bold; cursor: pointer;">+ Increment Counter</button></div>`
                              )
                            }
                            className="p-2 text-left rounded-lg border border-gray-200 hover:border-gray-900 bg-white hover:bg-gray-50 text-[11px] font-medium text-gray-700 transition-colors"
                          >
                            🔢 Click Counter Widget
                          </button>
                        </div>
                      </div>

                      {/* Iframe Height Slider & Presets */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Iframe Height
                          </label>
                          <span className="font-mono text-xs font-semibold text-gray-900">
                            {(contentState.height as number) || (settingsState.iframeHeight as number) || 480}px
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[350, 480, 650, 800].map((h) => {
                            const curH = (contentState.height as number) || (settingsState.iframeHeight as number) || 480;
                            const isSel = curH === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => {
                                  handleContentChange('height', h);
                                  handleSettingsChange('iframeHeight', h);
                                }}
                                className={`py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-black text-white border-black shadow-xs'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                {h}px
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="range"
                          min="300"
                          max="1000"
                          step="20"
                          value={(contentState.height as number) || (settingsState.iframeHeight as number) || 480}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleContentChange('height', val);
                            handleSettingsChange('iframeHeight', val);
                          }}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      {/* Container Stage Width */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Container Stage Width
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'M', label: 'Standard', desc: '768px' },
                            { id: 'L', label: 'Wide Stage', desc: '1152px' },
                            { id: 'full', label: 'Full Screen', desc: '100%' },
                          ].map((w) => {
                            const curW = (settingsState.contentWidth as string) || 'L';
                            const isSel = curW === w.id;
                            return (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => handleSettingsChange('contentWidth', w.id)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                              >
                                <div className="text-xs font-bold">{w.label}</div>
                                <div className={`text-[10px] mt-0.5 ${isSel ? 'text-zinc-300' : 'text-gray-400'}`}>
                                  {w.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* VARIANT B: WEB APP / SCORM .ZIP PACKAGE                   */}
                  {/* ========================================================= */}
                  {(block.subtype === 'code_web_project' || block.subtype === 'upload_project') && (
                    <div className="space-y-4">
                      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                          <FolderArchive className="w-4 h-4 text-indigo-600" />
                          <span>Web App & SCORM .zip Package</span>
                        </div>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">
                          Upload HTML5, Storyline, or ModuForge packages. Embedded SCORM 1.2 bridge automatically listens for lesson completion to unlock downstream Continue blocks.
                        </p>
                      </div>

                      {/* Package Status & Uploader */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Interactive Package (.zip)
                        </label>

                        {contentState.projectUrl ? (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                  <FolderArchive className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>{(contentState.projectFileName as string) || 'Custom Package'}</span>
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  Entry: <code className="font-mono text-indigo-600">{(contentState.entryFile as string) || 'index.html'}</code> • {(contentState.projectFilesCount as number) || 1} extracted files
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            </div>

                            {/* SCORM Status Indicator */}
                            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-2 text-[11px] text-emerald-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span>SCORM 1.2 auto-bridge active. Unlocks Continue blocks on module pass.</span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                              <a
                                href={contentState.projectUrl as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Test in new tab</span>
                              </a>
                              <div className="flex-1" />
                              <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-semibold cursor-pointer shadow-2xs">
                                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Replace .zip</span>
                                <input
                                  type="file"
                                  accept=".zip"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const fd = new FormData();
                                    fd.append('file', file);
                                    fd.append('blockId', block.id);
                                    const res = await fetch('/api/upload-project', { method: 'POST', body: fd });
                                    if (res.ok) {
                                      const data = await res.json();
                                      handleContentChange('projectUrl', data.url);
                                      handleContentChange('projectFileName', file.name);
                                      handleContentChange('projectFilesCount', data.filesCount);
                                      handleContentChange('entryFile', data.entryFile || 'index.html');
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl text-center space-y-3 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-gray-900">Upload HTML5 / SCORM / Storyline .zip</div>
                              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                                Automatically detects index.html and provides window.API SCORM stub.
                              </p>
                            </div>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-sm hover:scale-102 transition-all">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select .zip Archive</span>
                              <input
                                type="file"
                                accept=".zip"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append('file', file);
                                  fd.append('blockId', block.id);
                                  const res = await fetch('/api/upload-project', { method: 'POST', body: fd });
                                  if (res.ok) {
                                    const data = await res.json();
                                    handleContentChange('projectUrl', data.url);
                                    handleContentChange('projectFileName', file.name);
                                    handleContentChange('projectFilesCount', data.filesCount);
                                    handleContentChange('entryFile', data.entryFile || 'index.html');
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Iframe Height */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Player Height
                          </label>
                          <span className="font-mono text-xs font-semibold text-gray-900">
                            {(contentState.height as number) || (settingsState.iframeHeight as number) || 560}px
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[450, 560, 750, 900].map((h) => {
                            const curH = (contentState.height as number) || (settingsState.iframeHeight as number) || 560;
                            const isSel = curH === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => {
                                  handleContentChange('height', h);
                                  handleSettingsChange('iframeHeight', h);
                                }}
                                className={`py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-black text-white border-black shadow-xs'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                {h}px
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="range"
                          min="350"
                          max="1200"
                          step="25"
                          value={(contentState.height as number) || (settingsState.iframeHeight as number) || 560}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleContentChange('height', val);
                            handleSettingsChange('iframeHeight', val);
                          }}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      {/* Container Stage Width */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Container Stage Width
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'M', label: 'Standard', desc: '768px' },
                            { id: 'L', label: 'Wide Stage', desc: '1152px' },
                            { id: 'full', label: 'Full Screen', desc: '100%' },
                          ].map((w) => {
                            const curW = (settingsState.contentWidth as string) || 'L';
                            const isSel = curW === w.id;
                            return (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => handleSettingsChange('contentWidth', w.id)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                              >
                                <div className="text-xs font-bold">{w.label}</div>
                                <div className={`text-[10px] mt-0.5 ${isSel ? 'text-zinc-300' : 'text-gray-400'}`}>
                                  {w.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* VARIANT C: READ-ONLY SYNTAX CODE SNIPPET                   */}
                  {/* ========================================================= */}
                  {block.subtype !== 'code_embed' &&
                    block.subtype !== 'code_web_project' &&
                    block.subtype !== 'upload_project' && (
                      <div className="space-y-4">
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
                            <option value="go">Go</option>
                            <option value="rust">Rust</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="php">PHP</option>
                            <option value="yaml">YAML / Docker</option>
                            <option value="markdown">Markdown</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Code Snippet Lines
                          </label>
                          <textarea
                            rows={10}
                            value={(contentState.code as string) || ''}
                            onChange={(e) => handleContentChange('code', e.target.value)}
                            placeholder="// Paste formatted code lines here..."
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-emerald-400 font-mono outline-none focus:ring-2 focus:ring-sky-500 bg-slate-950 resize-y leading-relaxed shadow-inner"
                          />
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

      {/* Full-Screen Code Editor Modal */}
      {isCodeEditorModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Full-Screen HTML / CSS / JavaScript Code Editor</span>
                  <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded-full">
                    Single-File App
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Paste complete HTML/CSS/JS or AI-generated single-file components. Code stays 100% hidden from learners.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCodeEditorPreviewMode('code')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    codeEditorPreviewMode === 'code' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Code Only
                </button>
                <button
                  type="button"
                  onClick={() => setCodeEditorPreviewMode('split')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    codeEditorPreviewMode === 'split' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Side-by-Side Live Preview
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCodeEditorModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  handleContentChange('htmlCode', tempHtmlCode);
                  setIsCodeEditorModalOpen(false);
                }}
                className="px-5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-102 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save & Apply Code</span>
              </button>
            </div>
          </div>

          {/* Quick AI Template Starters Bar */}
          <div className="py-2.5 flex items-center gap-2 overflow-x-auto text-xs text-slate-400 flex-shrink-0 border-b border-slate-900">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Quick AI Templates:</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setTempHtmlCode(
                  `<div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 2.5rem 1.5rem; background: linear-gradient(135deg, #090d16 0%, #1e293b 100%); color: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);"><div style="display: inline-block; padding: 6px 14px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38bdf8; margin-bottom: 12px;">Security Simulation</div><h2 style="font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 8px;">Real-Time Threat Detection Sandbox</h2><p style="color: #94a3b8; font-size: 14px; max-width: 440px; margin: 0 auto 1.5rem; line-height: 1.5;">Click the trigger to simulate an automated security protocol defense reaction.</p><button onclick="document.getElementById('result').innerText = '🛡️ Defense Triggered: Malicious payload quarantined successfully!'; this.style.transform='scale(0.96)';" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; border: none; padding: 12px 28px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">Simulate Threat Attack</button><div id="result" style="margin-top: 18px; font-size: 13px; font-weight: 600; color: #4ade80; min-height: 20px;"></div></div>`
                )
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-800"
            >
              🛡️ Security Threat Trigger
            </button>
            <button
              type="button"
              onClick={() =>
                setTempHtmlCode(
                  `<div style="font-family: system-ui, sans-serif; text-align: center; padding: 2.5rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; border-radius: 16px;"><h2 style="color: #c7d2fe; font-size: 20px; margin-bottom: 6px;">Live Interactive Counter</h2><p style="color: #a5b4fc; font-size: 13px; margin-bottom: 1rem;">Click to increment state in sandboxed iframe</p><div id="cnt" style="font-size: 54px; font-weight: 900; color: #38bdf8; margin: 12px 0;">0</div><button onclick="var c=document.getElementById('cnt'); c.innerText = parseInt(c.innerText)+1" style="background: #6366f1; color: white; border: none; padding: 12px 28px; border-radius: 99px; font-weight: bold; font-size: 14px; cursor: pointer;">+ Increment Counter</button></div>`
                )
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-800"
            >
              🔢 Click Counter
            </button>
            <button
              type="button"
              onClick={() =>
                setTempHtmlCode(
                  `<div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: left; color: #18181b;"><h3 style="font-size: 18px; font-weight: 700; margin: 0 0 8px;">Knowledge Check Card</h3><p style="font-size: 13px; color: #71717a; margin: 0 0 16px;">What layer handles edge firewall inspection?</p><div style="display: flex; flex-direction: column; gap: 8px;"><button onclick="alert('Correct! Edge CDN intercepts malicious requests prior to origin.')" style="text-align: left; padding: 10px 14px; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">A. Edge Routing CDN</button><button onclick="alert('Incorrect. Application servers sit behind edge protection.')" style="text-align: left; padding: 10px 14px; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">B. Backend Database</button></div></div>`
                )
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-800"
            >
              📋 Interactive Multiple Choice
            </button>
          </div>

          {/* Editor Workspace */}
          <div className="flex-1 min-h-0 pt-3 flex gap-4">
            {/* Left: Code Textarea */}
            <div className={`h-full flex flex-col ${codeEditorPreviewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="bg-slate-900/90 px-3 py-1.5 border border-slate-800 rounded-t-xl flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] font-semibold text-slate-300">HTML / JS / CSS Source</span>
                <span className="font-mono text-[10px] text-slate-500">{tempHtmlCode.length} characters</span>
              </div>
              <textarea
                value={tempHtmlCode}
                onChange={(e) => setTempHtmlCode(e.target.value)}
                placeholder="<!-- Paste your HTML, Tailwind, or React Single-File Component here -->"
                className="w-full flex-1 p-4 bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm border-x border-b border-slate-800 rounded-b-xl outline-none focus:ring-1 focus:ring-sky-500 resize-none leading-relaxed shadow-inner"
                spellCheck={false}
              />
            </div>

            {/* Right: Live Preview Iframe */}
            {codeEditorPreviewMode === 'split' && (
              <div className="w-1/2 h-full flex flex-col">
                <div className="bg-slate-900/90 px-3 py-1.5 border border-slate-800 rounded-t-xl flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Sandboxed Preview</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{'sandbox="allow-scripts"'}</span>
                </div>
                <div className="w-full flex-1 border-x border-b border-slate-800 rounded-b-xl overflow-hidden bg-white">
                  <iframe
                    srcDoc={tempHtmlCode}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    className="w-full h-full border-none"
                    title="Fullscreen Code Editor Preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
