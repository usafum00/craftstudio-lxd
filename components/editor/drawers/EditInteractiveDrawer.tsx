'use client';

import React, { useState, useRef } from 'react';
import { Block, BlockSettings, Lesson } from '@/lib/types';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  MousePointer,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';
import { DEFAULT_SCENARIO_SCENES } from '../blocks/InteractiveBlock';
import { ScenarioAvatar, ScenarioExpression } from '../blocks/ScenarioAvatars';

interface EditInteractiveDrawerProps {
  isOpen: boolean;
  block: Block | null;
  onClose: () => void;
  onUpdateContent: (newContent: Record<string, unknown>) => void;
  onUpdateSettings?: (newSettings: BlockSettings) => void;
  onUploadMedia?: (file: File) => Promise<string | null>;
  courseLessons?: Lesson[];
  accentColor?: string;
}

export function EditInteractiveDrawer({
  isOpen,
  block,
  onClose,
  onUpdateContent,
  onUploadMedia,
  courseLessons = [],
  accentColor = '#ff5722',
}: EditInteractiveDrawerProps) {
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(0);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaModalTarget, setMediaModalTarget] = useState<{
    field: string;
    index?: number;
    subIndex?: number;
    side?: 'front' | 'back';
    type?: 'image' | 'video' | 'audio';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !block) return null;

  const content = block.content || {};
  const subtype = block.subtype;

  // Helper for generic media modal launch
  const openMediaModal = (
    field: string,
    index?: number,
    type: 'image' | 'video' | 'audio' = 'image',
    subIndex?: number,
    side?: 'front' | 'back'
  ) => {
    setMediaModalTarget({ field, index, subIndex, side, type });
    setMediaModalOpen(true);
  };

  const handleMediaModalSelect = (url: string) => {
    if (!mediaModalTarget) return;
    const { field, index, subIndex, side } = mediaModalTarget;

    if (subtype === 'accordion') {
      const items = [...((content.items as Array<Record<string, unknown>>) || [])];
      if (typeof index === 'number' && items[index]) {
        items[index] = { ...items[index], [field]: url };
        onUpdateContent({ ...content, items });
      }
    } else if (subtype === 'tabs') {
      const tabs = [...((content.tabs as Array<Record<string, unknown>>) || [])];
      if (typeof index === 'number' && tabs[index]) {
        tabs[index] = { ...tabs[index], [field]: url };
        onUpdateContent({ ...content, tabs });
      }
    } else if (subtype === 'labeled_graphic') {
      if (field === 'imageUrl') {
        onUpdateContent({ ...content, imageUrl: url });
      } else if (typeof index === 'number') {
        const hotspots = [...((content.hotspots as Array<Record<string, unknown>>) || [])];
        if (hotspots[index]) {
          hotspots[index] = { ...hotspots[index], [field]: url };
          onUpdateContent({ ...content, hotspots });
        }
      }
    } else if (subtype === 'process') {
      const steps = [...((content.steps as Array<Record<string, unknown>>) || [])];
      if (typeof index === 'number' && steps[index]) {
        steps[index] = { ...steps[index], [field]: url };
        onUpdateContent({ ...content, steps });
      }
    } else if (subtype === 'flashcards' || subtype === 'flashcard_stack') {
      const cards = [...((content.cards as Array<Record<string, unknown>>) || [])];
      if (typeof index === 'number' && cards[index] && side) {
        cards[index] = {
          ...cards[index],
          [`${side}Image`]: url,
        };
        onUpdateContent({ ...content, cards });
      }
    } else if (subtype === 'timeline') {
      const events = [...((content.events as Array<Record<string, unknown>>) || [])];
      if (typeof index === 'number' && events[index]) {
        events[index] = { ...events[index], [field]: url };
        onUpdateContent({ ...content, events });
      }
    } else if (subtype === 'scenario') {
      if (field === 'backgroundImage') {
        onUpdateContent({ ...content, backgroundImage: url });
      } else if (field === 'characterAvatar') {
        onUpdateContent({ ...content, characterAvatar: url });
      }
    }

    setMediaModalOpen(false);
    setMediaModalTarget(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadMedia || !mediaModalTarget) return;

    try {
      const url = await onUploadMedia(file);
      if (url) {
        handleMediaModalSelect(url);
      }
    } catch (err) {
      console.error('File upload failed', err);
    }
  };

  // Human readable title for drawer
  const getDrawerTitle = () => {
    switch (subtype) {
      case 'accordion':
        return 'Edit Accordion';
      case 'tabs':
        return 'Edit Tabs';
      case 'labeled_graphic':
        return 'Edit Labeled Graphic';
      case 'process':
        return 'Edit Process';
      case 'sorting_activity':
        return 'Edit Sorting Activity';
      case 'flashcards':
        return 'Edit Flashcard Grid';
      case 'flashcard_stack':
        return 'Edit Flashcard Stack';
      case 'timeline':
        return 'Edit Timeline';
      case 'scenario':
        return 'Edit Scenario';
      case 'button':
      case 'button_stack':
        return 'Edit Button Stack';
      case 'storyline':
      case 'code_storyline':
      case 'custom_interactive':
        return 'Edit Storyline Canvas';
      case 'simulation_lab':
        return 'Edit Simulation Lab';
      case 'multiple_choice':
      case 'multiple_response':
      case 'fill_in_blank':
      case 'matching':
        return 'Edit Knowledge Check';
      default:
        return 'Edit Content';
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-84 sm:w-96 bg-white border-r border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200 select-none">
      {/* Header */}
      <div className="h-14 px-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <h3 className="font-bold text-sm text-gray-900 tracking-tight">{getDrawerTitle()}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* ======================================================== */}
        {/* 1. ACCORDION DRAWER                                       */}
        {/* ======================================================== */}
        {subtype === 'accordion' && (() => {
          const items = (content.items as Array<{ title: string; content: string; imageUrl?: string; mediaType?: string }>) || [];

          const handleUpdateItem = (idx: number, patch: Partial<(typeof items)[0]>) => {
            const next = [...items];
            next[idx] = { ...next[idx], ...patch };
            onUpdateContent({ ...content, items: next });
          };

          const handleAddItem = () => {
            const next = [
              ...items,
              {
                title: `New Section ${items.length + 1}`,
                content: 'Provide detailed contextual notes, instructions, or narrative here.',
              },
            ];
            onUpdateContent({ ...content, items: next });
            setActiveItemIndex(next.length - 1);
          };

          const handleDeleteItem = (idx: number, e: React.MouseEvent) => {
            e.stopPropagation();
            if (items.length <= 1) return;
            const next = items.filter((_, i) => i !== idx);
            onUpdateContent({ ...content, items: next });
            if (activeItemIndex === idx) {
              setActiveItemIndex(0);
            }
          };

          const handleMoveItem = (idx: number, direction: 'up' | 'down', e: React.MouseEvent) => {
            e.stopPropagation();
            const target = direction === 'up' ? idx - 1 : idx + 1;
            if (target < 0 || target >= items.length) return;
            const next = [...items];
            const temp = next[idx];
            next[idx] = next[target];
            next[target] = temp;
            onUpdateContent({ ...content, items: next });
            setActiveItemIndex(target);
          };

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Accordion Panels ({items.length})</span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const isExpanded = activeItemIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl transition-all overflow-hidden bg-white ${
                        isExpanded ? 'border-slate-800 shadow-sm ring-1 ring-slate-800/10' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Accordion Item Card Header */}
                      <div
                        onClick={() => setActiveItemIndex(isExpanded ? null : idx)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab flex-shrink-0" />
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {item.title || `Item ${idx + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => handleMoveItem(idx, 'up', e)}
                            className="p-1 text-gray-400 hover:text-black disabled:opacity-20"
                            title="Move up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === items.length - 1}
                            onClick={(e) => handleMoveItem(idx, 'down', e)}
                            className="p-1 text-gray-400 hover:text-black disabled:opacity-20"
                            title="Move down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(idx, e)}
                              className="p-1 text-gray-400 hover:text-rose-600 transition-colors ml-1"
                              title="Delete panel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Item Form */}
                      {isExpanded && (
                        <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Panel Title
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateItem(idx, { title: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
                              placeholder="e.g. Embracing Discovery"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Description / Rich Text
                            </label>
                            <textarea
                              rows={3}
                              value={item.content}
                              onChange={(e) => handleUpdateItem(idx, { content: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400 resize-y"
                              placeholder="Enter panel description..."
                            />
                          </div>

                          {/* Media Uploader for this panel */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Panel Media (Optional)
                            </label>
                            {item.imageUrl ? (
                              <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-10 h-7 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-[11px] text-gray-600 truncate">
                                    Media attached
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openMediaModal('imageUrl', idx, 'image')}
                                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 px-1.5 py-0.5"
                                  >
                                    Replace
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItem(idx, { imageUrl: '' })}
                                    className="text-[11px] text-rose-500 hover:text-rose-700 px-1.5 py-0.5"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openMediaModal('imageUrl', idx, 'image')}
                                  className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                                  <span>Media Studio / Add Media</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Item Button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-900" />
                <span>Add Item</span>
              </button>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 2. TABS DRAWER                                            */}
        {/* ======================================================== */}
        {subtype === 'tabs' && (() => {
          const tabs = (content.tabs as Array<{ title: string; content: string; imageUrl?: string; imagePosition?: 'left' | 'right' | 'top' | 'bottom' }>) || [];

          const handleUpdateTab = (idx: number, patch: Partial<(typeof tabs)[0]>) => {
            const next = [...tabs];
            next[idx] = { ...next[idx], ...patch };
            onUpdateContent({ ...content, tabs: next });
          };

          const handleAddTab = () => {
            const next = [
              ...tabs,
              {
                title: `Tab ${tabs.length + 1}`,
                content: 'Provide detailed content for this tab view.',
                imagePosition: 'right' as const,
              },
            ];
            onUpdateContent({ ...content, tabs: next });
            setActiveItemIndex(next.length - 1);
          };

          const handleDeleteTab = (idx: number, e: React.MouseEvent) => {
            e.stopPropagation();
            if (tabs.length <= 1) return;
            const next = tabs.filter((_, i) => i !== idx);
            onUpdateContent({ ...content, tabs: next });
            if (activeItemIndex === idx) {
              setActiveItemIndex(0);
            }
          };

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Tabs ({tabs.length})</span>
              </div>

              <div className="space-y-2">
                {tabs.map((tab, idx) => {
                  const isExpanded = activeItemIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl transition-all overflow-hidden bg-white ${
                        isExpanded ? 'border-slate-800 shadow-sm ring-1 ring-slate-800/10' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        onClick={() => setActiveItemIndex(isExpanded ? null : idx)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <GripVertical className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {tab.title || `Tab ${idx + 1}`}
                          </span>
                        </div>
                        {tabs.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTab(idx, e)}
                            className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Tab Title
                            </label>
                            <input
                              type="text"
                              value={tab.title}
                              onChange={(e) => handleUpdateTab(idx, { title: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Body Text
                            </label>
                            <textarea
                              rows={3}
                              value={tab.content}
                              onChange={(e) => handleUpdateTab(idx, { content: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400 resize-y"
                            />
                          </div>

                          {/* Image & Position */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Tab Media
                            </label>
                            {tab.imageUrl ? (
                              <div className="space-y-2">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                                  <div className="w-12 h-8 rounded bg-slate-100 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={tab.imageUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openMediaModal('imageUrl', idx, 'image')}
                                      className="text-[11px] font-semibold text-sky-600 px-1.5"
                                    >
                                      Replace
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateTab(idx, { imageUrl: '' })}
                                      className="text-[11px] text-rose-500 px-1.5"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <span className="block text-[10px] text-gray-500 mb-1">Image Position</span>
                                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                                    {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                                      <button
                                        key={pos}
                                        type="button"
                                        onClick={() => handleUpdateTab(idx, { imagePosition: pos })}
                                        className={`py-1 rounded border capitalize font-medium ${
                                          (tab.imagePosition || 'right') === pos
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-gray-700 border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        {pos}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openMediaModal('imageUrl', idx, 'image')}
                                className="w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                                <span>Media Studio / Add Image</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddTab}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-900" />
                <span>Add Tab</span>
              </button>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 3. LABELED GRAPHIC DRAWER                                 */}
        {/* ======================================================== */}
        {subtype === 'labeled_graphic' && (() => {
          const bgUrl = (content.imageUrl as string) || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=80';
          const hotspots = (content.hotspots as Array<{
            id: string;
            x: number;
            y: number;
            title: string;
            text: string;
            iconType?: string;
            mediaUrl?: string;
            mediaType?: 'image' | 'video' | 'audio';
          }>) || [];

          const handleUpdateHotspot = (idx: number, patch: Partial<(typeof hotspots)[0]>) => {
            const next = [...hotspots];
            next[idx] = { ...next[idx], ...patch };
            onUpdateContent({ ...content, hotspots: next });
          };

          const handleAddHotspot = () => {
            const next = [
              ...hotspots,
              {
                id: `hs-${Date.now()}`,
                x: 50,
                y: 50,
                title: `Marker ${hotspots.length + 1}`,
                text: 'Enter marker description and key notes.',
                iconType: '+',
              },
            ];
            onUpdateContent({ ...content, hotspots: next });
            setActiveItemIndex(next.length - 1);
          };

          const handleDeleteHotspot = (idx: number, e: React.MouseEvent) => {
            e.stopPropagation();
            if (hotspots.length <= 1) return;
            const next = hotspots.filter((_, i) => i !== idx);
            onUpdateContent({ ...content, hotspots: next });
            if (activeItemIndex === idx) {
              setActiveItemIndex(0);
            }
          };

          return (
            <div className="space-y-5">
              {/* Background Graphic Section */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Background Graphic
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bgUrl} alt="Background" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <button
                      type="button"
                      onClick={() => openMediaModal('imageUrl', undefined, 'image')}
                      className="px-3 py-1.5 bg-white text-gray-900 rounded-full text-xs font-semibold shadow hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                      <span>Replace Image</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hotspot Markers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Hotspot Markers ({hotspots.length})</span>
                  <span className="text-[10px] text-gray-400 font-normal">Click image to drop</span>
                </div>

                <div className="space-y-2">
                  {hotspots.map((hs, idx) => {
                    const isExpanded = activeItemIndex === idx;
                    return (
                      <div
                        key={hs.id || idx}
                        className={`border rounded-xl transition-all overflow-hidden bg-white ${
                          isExpanded ? 'border-slate-800 shadow-sm ring-1 ring-slate-800/10' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setActiveItemIndex(isExpanded ? null : idx)}
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                            <div
                              className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: accentColor }}
                            >
                              {hs.iconType || '+'}
                            </div>
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {hs.title || `Marker ${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({Math.round(hs.x)}%, {Math.round(hs.y)}%)
                            </span>
                          </div>

                          {hotspots.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteHotspot(idx, e)}
                              className="p-1 text-gray-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Marker Title
                              </label>
                              <input
                                type="text"
                                value={hs.title}
                                onChange={(e) => handleUpdateHotspot(idx, { title: e.target.value })}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                rows={3}
                                value={hs.text}
                                onChange={(e) => handleUpdateHotspot(idx, { text: e.target.value })}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400 resize-y"
                              />
                            </div>

                            {/* Marker Icon Style */}
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Marker Icon Style
                              </label>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {['+', 'i', '?', '✓', `${idx + 1}`].map((ic) => (
                                  <button
                                    key={ic}
                                    type="button"
                                    onClick={() => handleUpdateHotspot(idx, { iconType: ic })}
                                    className={`w-7 h-7 rounded-full text-xs font-bold border transition-all ${
                                      (hs.iconType || '+') === ic
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                        : 'bg-white text-gray-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {ic}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Marker Media (Image/Video/Audio) */}
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Marker Media (Image, Video, Audio)
                              </label>
                              {hs.mediaUrl ? (
                                <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="text-[11px] text-gray-600 truncate">
                                      Media attached
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openMediaModal('mediaUrl', idx, 'image')}
                                      className="text-[11px] font-semibold text-sky-600 px-1"
                                    >
                                      Replace
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateHotspot(idx, { mediaUrl: '' })}
                                      className="text-[11px] text-rose-500 px-1"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openMediaModal('mediaUrl', idx, 'image')}
                                  className="w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                                  <span>Media Studio / Attach Media</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddHotspot}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-900" />
                  <span>Add Hotspot Marker</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 4. PROCESS CAROUSEL DRAWER                                */}
        {/* ======================================================== */}
        {subtype === 'process' && (() => {
          const hasIntro = content.hasIntro !== false;
          const introTitle = (content.introTitle as string) || 'Incident Response Procedure';
          const introText = (content.introText as string) || 'Follow these step-by-step procedures when identifying potential phishing campaigns.';
          const hasSummary = content.hasSummary !== false;
          const summaryTitle = (content.summaryTitle as string) || 'Protocol Finished';
          const summaryText = (content.summaryText as string) || 'Prompt incident reporting defends the entire enterprise from lateral movement.';
          const steps = (content.steps as Array<{ title: string; text: string; imageUrl?: string }>) || [];

          const handleUpdateStep = (idx: number, patch: Partial<(typeof steps)[0]>) => {
            const next = [...steps];
            next[idx] = { ...next[idx], ...patch };
            onUpdateContent({ ...content, steps: next });
          };

          const handleAddStep = () => {
            const next = [
              ...steps,
              {
                title: `Step ${steps.length + 1}: Action Required`,
                text: 'Detail the exact procedure for this step.',
              },
            ];
            onUpdateContent({ ...content, steps: next });
            setActiveItemIndex(next.length - 1);
          };

          const handleDeleteStep = (idx: number, e: React.MouseEvent) => {
            e.stopPropagation();
            if (steps.length <= 1) return;
            const next = steps.filter((_, i) => i !== idx);
            onUpdateContent({ ...content, steps: next });
            if (activeItemIndex === idx) {
              setActiveItemIndex(0);
            }
          };

          return (
            <div className="space-y-5">
              {/* Intro Slide Card */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">Introduction Slide</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasIntro}
                      onChange={(e) => onUpdateContent({ ...content, hasIntro: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900" />
                  </label>
                </div>

                {hasIntro && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <input
                      type="text"
                      value={introTitle}
                      onChange={(e) => onUpdateContent({ ...content, introTitle: e.target.value })}
                      placeholder="Intro Title"
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800"
                    />
                    <textarea
                      rows={2}
                      value={introText}
                      onChange={(e) => onUpdateContent({ ...content, introText: e.target.value })}
                      placeholder="Intro description..."
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Steps List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Steps ({steps.length})</span>
                </div>

                <div className="space-y-2">
                  {steps.map((st, idx) => {
                    const isExpanded = activeItemIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`border rounded-xl transition-all overflow-hidden bg-white ${
                          isExpanded ? 'border-slate-800 shadow-sm ring-1 ring-slate-800/10' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setActiveItemIndex(isExpanded ? null : idx)}
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                            <div
                              className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: accentColor }}
                            >
                              {idx + 1}
                            </div>
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {st.title || `Step ${idx + 1}`}
                            </span>
                          </div>
                          {steps.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteStep(idx, e)}
                              className="p-1 text-gray-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Step Title
                              </label>
                              <input
                                type="text"
                                value={st.title}
                                onChange={(e) => handleUpdateStep(idx, { title: e.target.value })}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Step Description
                              </label>
                              <textarea
                                rows={3}
                                value={st.text}
                                onChange={(e) => handleUpdateStep(idx, { text: e.target.value })}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400 resize-y"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Step Media
                              </label>
                              {st.imageUrl ? (
                                <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                                  <div className="w-10 h-7 rounded bg-slate-100 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={st.imageUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openMediaModal('imageUrl', idx, 'image')}
                                      className="text-[11px] font-semibold text-sky-600 px-1"
                                    >
                                      Replace
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStep(idx, { imageUrl: '' })}
                                      className="text-[11px] text-rose-500 px-1"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openMediaModal('imageUrl', idx, 'image')}
                                  className="w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                                  <span>Media Studio / Attach Image</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddStep}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-900" />
                  <span>Add Step</span>
                </button>
              </div>

              {/* Summary Slide Card */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">Summary Slide</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSummary}
                      onChange={(e) => onUpdateContent({ ...content, hasSummary: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900" />
                  </label>
                </div>

                {hasSummary && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <input
                      type="text"
                      value={summaryTitle}
                      onChange={(e) => onUpdateContent({ ...content, summaryTitle: e.target.value })}
                      placeholder="Summary Title"
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800"
                    />
                    <textarea
                      rows={2}
                      value={summaryText}
                      onChange={(e) => onUpdateContent({ ...content, summaryText: e.target.value })}
                      placeholder="Summary description..."
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 5. SORTING ACTIVITY DRAWER                                */}
        {/* ======================================================== */}
        {subtype === 'sorting_activity' && (() => {
          const categories = (content.categories as Array<{ id: string; name: string }>) || [];
          const cards = (content.cards as Array<{ id: string; text: string; categoryId: string }>) || [];

          const handleUpdateCategory = (catIdx: number, newName: string) => {
            const next = [...categories];
            next[catIdx] = { ...next[catIdx], name: newName };
            onUpdateContent({ ...content, categories: next });
          };

          const handleAddCategory = () => {
            if (categories.length >= 4) return;
            const newId = `cat-${Date.now()}`;
            const next = [...categories, { id: newId, name: `Category ${categories.length + 1}` }];
            onUpdateContent({ ...content, categories: next });
          };

          const handleDeleteCategory = (catId: string) => {
            if (categories.length <= 2) return;
            const nextCats = categories.filter((c) => c.id !== catId);
            const remainingCatId = nextCats[0].id;
            const nextCards = cards.map((c) => (c.categoryId === catId ? { ...c, categoryId: remainingCatId } : c));
            onUpdateContent({ ...content, categories: nextCats, cards: nextCards });
          };

          const handleAddCard = (catId: string) => {
            const next = [
              ...cards,
              {
                id: `c-${Date.now()}`,
                text: 'New sortable statement card',
                categoryId: catId,
              },
            ];
            onUpdateContent({ ...content, cards: next });
          };

          const handleUpdateCard = (cardId: string, patch: Partial<(typeof cards)[0]>) => {
            const next = cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c));
            onUpdateContent({ ...content, cards: next });
          };

          const handleDeleteCard = (cardId: string) => {
            const next = cards.filter((c) => c.id !== cardId);
            onUpdateContent({ ...content, cards: next });
          };

          return (
            <div className="space-y-6">
              {/* Category & Card Groupings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Categories & Cards ({cards.length} cards)</span>
                  {categories.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                    >
                      + Add Category
                    </button>
                  )}
                </div>

                {categories.map((cat, catIdx) => {
                  const catCards = cards.filter((c) => c.categoryId === cat.id);
                  return (
                    <div key={cat.id} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Category {catIdx + 1} Title
                          </label>
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => handleUpdateCategory(catIdx, e.target.value)}
                            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-900 focus:outline-none focus:border-slate-400"
                          />
                        </div>
                        {categories.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 self-end"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Cards assigned to this category */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="text-[11px] font-semibold text-gray-500">
                          Items belonging to &quot;{cat.name}&quot; ({catCards.length})
                        </div>

                        {catCards.map((c) => (
                          <div key={c.id} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200/80">
                            <input
                              type="text"
                              value={c.text}
                              onChange={(e) => handleUpdateCard(c.id, { text: e.target.value })}
                              className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded text-gray-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(c.id)}
                              className="p-1 text-gray-400 hover:text-rose-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddCard(cat.id)}
                          className="w-full py-1 text-xs text-sky-600 hover:text-sky-800 font-semibold border border-dashed border-sky-300 rounded-lg hover:bg-sky-50/50 flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Item to {cat.name}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 6. FLASHCARD GRID & STACK DRAWER                          */}
        {/* ======================================================== */}
        {(subtype === 'flashcards' || subtype === 'flashcard_stack') && (() => {
          const cards = (content.cards as Array<{
            front: string;
            back: string;
            frontImage?: string;
            backImage?: string;
            frontAudio?: string;
            backAudio?: string;
            frontMode?: 'text' | 'image' | 'both';
            backMode?: 'text' | 'image' | 'both';
          }>) || [];

          const handleUpdateCard = (idx: number, patch: Partial<(typeof cards)[0]>) => {
            const next = [...cards];
            next[idx] = { ...next[idx], ...patch };
            onUpdateContent({ ...content, cards: next });
          };

          const handleAddCard = () => {
            const next = [
              ...cards,
              {
                front: 'Front of card prompt',
                back: 'Back of card answer',
                frontMode: 'text' as const,
                backMode: 'text' as const,
              },
            ];
            onUpdateContent({ ...content, cards: next });
            setActiveItemIndex(next.length - 1);
          };

          const handleDeleteCard = (idx: number, e: React.MouseEvent) => {
            e.stopPropagation();
            if (cards.length <= 1) return;
            const next = cards.filter((_, i) => i !== idx);
            onUpdateContent({ ...content, cards: next });
            if (activeItemIndex === idx) {
              setActiveItemIndex(0);
            }
          };

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Flashcards ({cards.length})</span>
              </div>

              <div className="space-y-2">
                {cards.map((card, idx) => {
                  const isExpanded = activeItemIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl transition-all overflow-hidden bg-white ${
                        isExpanded ? 'border-slate-800 shadow-sm ring-1 ring-slate-800/10' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        onClick={() => setActiveItemIndex(isExpanded ? null : idx)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-bold text-gray-900 truncate">
                            Card {idx + 1}: {card.front || 'Empty Card'}
                          </span>
                        </div>
                        {cards.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCard(idx, e)}
                            className="p-1 text-gray-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="p-3.5 pt-1 border-t border-slate-100 space-y-4 bg-slate-50/50">
                          {/* Front of Card */}
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                            <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                              <span>Front of Card</span>
                              <div className="flex gap-1 text-[10px]">
                                {(['text', 'image', 'both'] as const).map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleUpdateCard(idx, { frontMode: m })}
                                    className={`px-1.5 py-0.5 rounded capitalize ${
                                      (card.frontMode || 'text') === m
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-gray-600'
                                    }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {(card.frontMode !== 'image') && (
                              <input
                                type="text"
                                value={card.front}
                                onChange={(e) => handleUpdateCard(idx, { front: e.target.value })}
                                placeholder="Front prompt text"
                                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded text-gray-800"
                              />
                            )}

                            {(card.frontMode === 'image' || card.frontMode === 'both') && (
                              <div>
                                {card.frontImage ? (
                                  <div className="flex items-center justify-between p-1 border rounded">
                                    <div className="w-8 h-6 bg-slate-100 rounded overflow-hidden">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={card.frontImage} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCard(idx, { frontImage: '' })}
                                      className="text-[10px] text-rose-500"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openMediaModal('frontImage', idx, 'image', undefined, 'front')}
                                    className="w-full py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 rounded hover:bg-slate-50"
                                  >
                                    + Attach Front Image
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Back of Card */}
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                            <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                              <span>Back of Card</span>
                              <div className="flex gap-1 text-[10px]">
                                {(['text', 'image', 'both'] as const).map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleUpdateCard(idx, { backMode: m })}
                                    className={`px-1.5 py-0.5 rounded capitalize ${
                                      (card.backMode || 'text') === m
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-gray-600'
                                    }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {(card.backMode !== 'image') && (
                              <textarea
                                rows={2}
                                value={card.back}
                                onChange={(e) => handleUpdateCard(idx, { back: e.target.value })}
                                placeholder="Back reveal text"
                                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded text-gray-800 resize-none"
                              />
                            )}

                            {(card.backMode === 'image' || card.backMode === 'both') && (
                              <div>
                                {card.backImage ? (
                                  <div className="flex items-center justify-between p-1 border rounded">
                                    <div className="w-8 h-6 bg-slate-100 rounded overflow-hidden">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={card.backImage} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCard(idx, { backImage: '' })}
                                      className="text-[10px] text-rose-500"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openMediaModal('backImage', idx, 'image', undefined, 'back')}
                                    className="w-full py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 rounded hover:bg-slate-50"
                                  >
                                    + Attach Back Image
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddCard}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-slate-900" />
                <span>Add Card</span>
              </button>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 7. TIMELINE DRAWER                                        */}
        {/* ======================================================== */}
        {subtype === 'timeline' && (() => {
          const events = (content.events as Array<{ yearOrDate: string; title: string; description: string; imageUrl?: string }>) || [];

          const handleUpdateEvent = (idx: number, patch: Partial<(typeof events)[0]>) => {
            const next = [...events];
            next[idx] = { ...next[idx], ...patch };
            onUpdateContent({ ...content, events: next });
          };

          const handleAddEvent = () => {
            const next = [
              ...events,
              {
                yearOrDate: `Phase ${events.length + 1}`,
                title: 'New Milestone Title',
                description: 'Key deliverables or incident milestones achieved during this stage.',
              },
            ];
            onUpdateContent({ ...content, events: next });
            setActiveItemIndex(next.length - 1);
          };

          const handleDeleteEvent = (idx: number, e: React.MouseEvent) => {
            e.stopPropagation();
            if (events.length <= 1) return;
            const next = events.filter((_, i) => i !== idx);
            onUpdateContent({ ...content, events: next });
            if (activeItemIndex === idx) {
              setActiveItemIndex(0);
            }
          };

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Timeline Events ({events.length})</span>
              </div>

              <div className="space-y-2">
                {events.map((ev, idx) => {
                  const isExpanded = activeItemIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl transition-all overflow-hidden bg-white ${
                        isExpanded ? 'border-slate-800 shadow-sm ring-1 ring-slate-800/10' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        onClick={() => setActiveItemIndex(isExpanded ? null : idx)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <GripVertical className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-gray-800">
                            {ev.yearOrDate || 'Date'}
                          </span>
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {ev.title || `Event ${idx + 1}`}
                          </span>
                        </div>
                        {events.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteEvent(idx, e)}
                            className="p-1 text-gray-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Date / Milestone Badge
                            </label>
                            <input
                              type="text"
                              value={ev.yearOrDate}
                              onChange={(e) => handleUpdateEvent(idx, { yearOrDate: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800"
                              placeholder="e.g. Hour 0, Phase 1, 2026 Q1"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Event Title
                            </label>
                            <input
                              type="text"
                              value={ev.title}
                              onChange={(e) => handleUpdateEvent(idx, { title: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Event Description
                            </label>
                            <textarea
                              rows={3}
                              value={ev.description}
                              onChange={(e) => handleUpdateEvent(idx, { description: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 resize-y"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                              Event Media
                            </label>
                            {ev.imageUrl ? (
                              <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                                <div className="w-10 h-7 rounded bg-slate-100 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openMediaModal('imageUrl', idx, 'image')}
                                    className="text-[11px] font-semibold text-sky-600 px-1"
                                  >
                                    Replace
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateEvent(idx, { imageUrl: '' })}
                                    className="text-[11px] text-rose-500 px-1"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openMediaModal('imageUrl', idx, 'image')}
                                className="w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                                <span>Media Studio / Attach Image</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddEvent}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-slate-900" />
                <span>Add Event</span>
              </button>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 8. SCENARIO BUILDER DRAWER                                */}
        {/* ======================================================== */}
        {subtype === 'scenario' && (() => {
          const bgImage = (content.backgroundImage as string) || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80';
          const characterName = (content.characterName as string) || 'Alex (IT Support)';
          const scenes = (content.scenes as Array<{
            id: string;
            title: string;
            type: 'dialogue' | 'info';
            expression: ScenarioExpression;
            dialogue: string;
            responses?: Array<{
              text: string;
              feedback: string;
              reactionExpression: ScenarioExpression;
              targetSceneId: string;
            }>;
            continueTargetSceneId?: string;
          }>) || DEFAULT_SCENARIO_SCENES;

          const handleUpdateScene = (scIdx: number, patch: Partial<(typeof scenes)[0]>) => {
            const next = [...scenes];
            next[scIdx] = { ...next[scIdx], ...patch };
            onUpdateContent({ ...content, scenes: next });
          };

          const handleAddScene = () => {
            const newIndex = scenes.length + 1;
            const newId = `sc-${Date.now()}`;
            const next = [
              ...scenes,
              {
                id: newId,
                title: `Scene ${newIndex}: Strategic Decision`,
                type: 'dialogue' as const,
                expression: 'talking' as ScenarioExpression,
                dialogue: 'How should we handle this workplace challenge?',
                responses: [
                  {
                    text: 'Follow standard verification protocol',
                    feedback: 'Correct! Standard protocol ensures compliance and safety.',
                    reactionExpression: 'happy' as ScenarioExpression,
                    targetSceneId: 'end',
                  },
                  {
                    text: 'Bypass checks to accelerate delivery',
                    feedback: 'Caution! Skipping protocols introduces security and audit vulnerabilities.',
                    reactionExpression: 'frustrated' as ScenarioExpression,
                    targetSceneId: 'end',
                  },
                ],
              },
            ];
            onUpdateContent({ ...content, scenes: next });
            setActiveItemIndex(next.length - 1);
          };

          const handleDeleteScene = (scIdx: number, e: React.MouseEvent) => {
            e.stopPropagation();
            if (scenes.length <= 1) return;
            const next = scenes.filter((_, i) => i !== scIdx);
            onUpdateContent({ ...content, scenes: next });
            if (activeItemIndex === scIdx) {
              setActiveItemIndex(0);
            }
          };

          const handleAddResponse = (scIdx: number) => {
            const sc = scenes[scIdx];
            const currentResps = sc.responses || [];
            const nextResps = [
              ...currentResps,
              {
                text: `Option ${currentResps.length + 1}`,
                feedback: 'Feedback for this response option.',
                reactionExpression: 'talking' as ScenarioExpression,
                targetSceneId: 'next',
              },
            ];
            handleUpdateScene(scIdx, { responses: nextResps });
          };

          const handleDeleteResponse = (scIdx: number, rIdx: number) => {
            const sc = scenes[scIdx];
            if (!sc.responses || sc.responses.length <= 1) return;
            const nextResps = sc.responses.filter((_, i) => i !== rIdx);
            handleUpdateScene(scIdx, { responses: nextResps });
          };

          return (
            <div className="space-y-5">
              {/* Character & Background Settings */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Character & Environment
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Vector Avatars
                  </span>
                </div>

                {/* Character Preset Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                    Character Persona & Vector Headshot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Alex (IT Support)', key: 'alex' },
                      { name: 'Sloane (Manager)', key: 'sloane' },
                      { name: 'Mentor (Coach)', key: 'mentor' },
                    ].map((preset) => {
                      const isSelected = characterName.toLowerCase().includes(preset.key);
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => onUpdateContent({ ...content, characterName: preset.name })}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                          }`}
                        >
                          <ScenarioAvatar
                            character={preset.key}
                            expression="neutral"
                            className="w-10 h-10"
                            hideBadge
                          />
                          <span className="text-[11px] font-bold text-gray-800 leading-tight">
                            {preset.key.charAt(0).toUpperCase() + preset.key.slice(1)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Custom Character Label
                  </label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => onUpdateContent({ ...content, characterName: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Environment Background Image
                  </label>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video mb-2 bg-black shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bgImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => openMediaModal('backgroundImage', undefined, 'image')}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Change Office / Environment Photo</span>
                  </button>
                </div>
              </div>

              {/* Scenes Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Branching Scenes ({scenes.length})</span>
                  <button
                    type="button"
                    onClick={handleAddScene}
                    style={{ backgroundColor: '#4F46E5', color: '#ffffff' }}
                    className="text-xs font-bold text-white px-3 py-1 rounded-lg shadow-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Add Scene</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {scenes.map((sc, scIdx) => {
                    const isExpanded = activeItemIndex === scIdx;
                    return (
                      <div
                        key={sc.id || scIdx}
                        className={`border rounded-2xl transition-all overflow-hidden bg-white shadow-2xs ${
                          isExpanded ? 'border-indigo-600 shadow-sm ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setActiveItemIndex(isExpanded ? null : scIdx)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-gray-700 uppercase">
                              {sc.type}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-gray-900 truncate">
                                {sc.title || `Scene ${scIdx + 1}`}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                ({sc.id})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {scenes.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteScene(scIdx, e)}
                                className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                title="Delete Scene"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 pt-2 border-t border-slate-100 space-y-3.5 bg-slate-50/60 animate-in fade-in duration-100">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Scene Title & Identifier
                              </label>
                              <input
                                type="text"
                                value={sc.title}
                                onChange={(e) => handleUpdateScene(scIdx, { title: e.target.value })}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-900 font-semibold"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  Scene Type
                                </label>
                                <select
                                  value={sc.type}
                                  onChange={(e) => handleUpdateScene(scIdx, { type: e.target.value as 'dialogue' | 'info' })}
                                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-gray-800"
                                >
                                  <option value="dialogue">Dialogue (Learner Choices)</option>
                                  <option value="info">Information / Story Card</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  Character Expression
                                </label>
                                <select
                                  value={sc.expression}
                                  onChange={(e) => handleUpdateScene(scIdx, { expression: e.target.value as ScenarioExpression })}
                                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-gray-800 capitalize"
                                >
                                  {['neutral', 'happy', 'talking', 'concerned', 'frustrated'].map((exp) => (
                                    <option key={exp} value={exp}>
                                      {exp.charAt(0).toUpperCase() + exp.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Character Speech / Prompt
                              </label>
                              <textarea
                                rows={3}
                                value={sc.dialogue}
                                onChange={(e) => handleUpdateScene(scIdx, { dialogue: e.target.value })}
                                placeholder="What does the character say or announce?"
                                className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-gray-800 resize-none focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* Responses or Continue Target */}
                            {sc.type === 'dialogue' ? (
                              <div className="space-y-2.5 pt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-gray-700">Learner Choice Options</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddResponse(scIdx)}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Choice</span>
                                  </button>
                                </div>

                                {(sc.responses || []).map((resp, rIdx) => (
                                  <div key={rIdx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-gray-500">Choice #{rIdx + 1}</span>
                                      {sc.responses && sc.responses.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteResponse(scIdx, rIdx)}
                                          className="text-gray-400 hover:text-rose-600 p-0.5"
                                          title="Remove Choice"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>

                                    <input
                                      type="text"
                                      value={resp.text}
                                      onChange={(e) => {
                                        const newResps = [...(sc.responses || [])];
                                        newResps[rIdx] = { ...newResps[rIdx], text: e.target.value };
                                        handleUpdateScene(scIdx, { responses: newResps });
                                      }}
                                      placeholder="Learner response text..."
                                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-500"
                                    />

                                    <input
                                      type="text"
                                      value={resp.feedback}
                                      onChange={(e) => {
                                        const newResps = [...(sc.responses || [])];
                                        newResps[rIdx] = { ...newResps[rIdx], feedback: e.target.value };
                                        handleUpdateScene(scIdx, { responses: newResps });
                                      }}
                                      placeholder="Feedback displayed after selection..."
                                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-500"
                                    />

                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      <div>
                                        <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Reaction:</span>
                                        <select
                                          value={resp.reactionExpression}
                                          onChange={(e) => {
                                            const newResps = [...(sc.responses || [])];
                                            newResps[rIdx] = {
                                              ...newResps[rIdx],
                                              reactionExpression: e.target.value as ScenarioExpression,
                                            };
                                            handleUpdateScene(scIdx, { responses: newResps });
                                          }}
                                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 capitalize"
                                        >
                                          {['happy', 'frustrated', 'concerned', 'talking', 'neutral'].map((exp) => (
                                            <option key={exp} value={exp}>
                                              {exp.charAt(0).toUpperCase() + exp.slice(1)}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Branch target:</span>
                                        <select
                                          value={resp.targetSceneId}
                                          onChange={(e) => {
                                            const newResps = [...(sc.responses || [])];
                                            newResps[rIdx] = { ...newResps[rIdx], targetSceneId: e.target.value };
                                            handleUpdateScene(scIdx, { responses: newResps });
                                          }}
                                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
                                        >
                                          <option value="next">Next Scene</option>
                                          <option value="end">Complete Scenario</option>
                                          {scenes
                                            .filter((s) => s.id !== sc.id)
                                            .map((s) => (
                                              <option key={s.id} value={s.id}>
                                                {s.title} ({s.id})
                                              </option>
                                            ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="pt-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                  Continue Target
                                </span>
                                <select
                                  value={sc.continueTargetSceneId || 'next'}
                                  onChange={(e) => handleUpdateScene(scIdx, { continueTargetSceneId: e.target.value })}
                                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                                >
                                  <option value="next">Next Scene</option>
                                  <option value="end">Complete Scenario</option>
                                  {scenes
                                    .filter((s) => s.id !== sc.id)
                                    .map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.title} ({s.id})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 9. BUTTON & BUTTON STACK DRAWER                           */}
        {/* ======================================================== */}
        {(subtype === 'button' || subtype === 'button_stack') && (() => {
          const buttons = (content.buttons as Array<{
            label: string;
            actionType: 'lesson' | 'url' | 'email' | 'exit';
            target: string;
            style?: 'primary' | 'outline' | 'secondary';
          }>) || [
            {
              label: 'Proceed to Next Step',
              actionType: 'url',
              target: 'https://example.com',
              style: 'primary',
            },
          ];

          const handleUpdateButton = (bIdx: number, patch: Partial<(typeof buttons)[0]>) => {
            const next = [...buttons];
            next[bIdx] = { ...next[bIdx], ...patch };
            onUpdateContent({ ...content, buttons: next });
          };

          const handleAddButton = () => {
            const next = [
              ...buttons,
              {
                label: `Button ${buttons.length + 1}`,
                actionType: 'url' as const,
                target: 'https://example.com',
                style: 'outline' as const,
              },
            ];
            onUpdateContent({ ...content, buttons: next });
            setActiveItemIndex(next.length - 1);
          };

          const handleDeleteButton = (bIdx: number) => {
            if (buttons.length <= 1) return;
            const next = buttons.filter((_, i) => i !== bIdx);
            onUpdateContent({ ...content, buttons: next });
          };

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Action Buttons ({buttons.length})</span>
                {subtype === 'button_stack' && (
                  <button
                    type="button"
                    onClick={handleAddButton}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    + Add Button
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {buttons.map((btn, bIdx) => (
                  <div key={bIdx} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">Button #{bIdx + 1}</span>
                      {buttons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteButton(bIdx)}
                          className="text-gray-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={btn.label}
                        onChange={(e) => handleUpdateButton(bIdx, { label: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Destination Type
                      </label>
                      <select
                        value={btn.actionType}
                        onChange={(e) => handleUpdateButton(bIdx, { actionType: e.target.value as 'lesson' | 'url' | 'email' | 'exit' })}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-gray-800"
                      >
                        <option value="lesson">Go to a lesson in this course</option>
                        <option value="url">Link to an external webpage (URL)</option>
                        <option value="email">Send an email (mailto:)</option>
                        <option value="exit">Exit the course (LMS Exit)</option>
                      </select>
                    </div>

                    {/* Conditional Target Input based on Destination Type */}
                    {btn.actionType === 'lesson' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Select Course Lesson
                        </label>
                        <select
                          value={btn.target}
                          onChange={(e) => handleUpdateButton(bIdx, { target: e.target.value })}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-gray-800"
                        >
                          <option value="">-- Choose target lesson --</option>
                          {courseLessons.map((les) => (
                            <option key={les.id} value={les.id}>
                              {les.title} ({les.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {btn.actionType === 'url' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Webpage Destination URL
                        </label>
                        <input
                          type="url"
                          value={btn.target}
                          onChange={(e) => handleUpdateButton(bIdx, { target: e.target.value })}
                          placeholder="https://example.com"
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800"
                        />
                      </div>
                    )}

                    {btn.actionType === 'email' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Recipient Email Address
                        </label>
                        <input
                          type="email"
                          value={btn.target}
                          onChange={(e) => handleUpdateButton(bIdx, { target: e.target.value })}
                          placeholder="support@company.com"
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800"
                        />
                      </div>
                    )}

                    {btn.actionType === 'exit' && (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-gray-500 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Triggers SCORM LMS finish or closes the browser player tab.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 10. STORYLINE / CUSTOM INTERACTIVE CANVAS DRAWER          */}
        {/* ======================================================== */}
        {(subtype === 'storyline' || subtype === 'code_storyline' || subtype === 'custom_interactive') && (() => {
          const elements = (content.elements as Array<{
            id: string;
            type: 'text' | 'image' | 'button' | 'hotspot';
            x: number;
            y: number;
            width: number;
            height: number;
            text?: string;
            imageUrl?: string;
            triggers?: Array<{ action: string; event: string; target?: string }>;
          }>) || [];

          const handleAddElement = (type: 'text' | 'image' | 'button' | 'hotspot') => {
            const newElem = {
              id: `el-${Date.now()}`,
              type,
              x: 100,
              y: 100,
              width: type === 'button' ? 140 : type === 'hotspot' ? 40 : 200,
              height: type === 'button' ? 44 : type === 'hotspot' ? 40 : 80,
              text: type === 'button' ? 'Click Me' : type === 'text' ? 'Enter slide copy...' : undefined,
              triggers: [
                { action: 'Show Layer', event: 'User clicks', target: 'Feedback Layer' },
              ],
            };
            onUpdateContent({ ...content, elements: [...elements, newElem] });
          };

          const handleDeleteElement = (id: string) => {
            onUpdateContent({ ...content, elements: elements.filter((e) => e.id !== id) });
          };

          return (
            <div className="space-y-5">
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-3">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Slide Canvas Studio (16:9)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddElement('text')}
                    className="p-2 border border-slate-200 rounded-lg text-xs font-semibold text-gray-800 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>+ Text Box</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('button')}
                    className="p-2 border border-slate-200 rounded-lg text-xs font-semibold text-gray-800 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <MousePointer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Button</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('image')}
                    className="p-2 border border-slate-200 rounded-lg text-xs font-semibold text-gray-800 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>+ Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('hotspot')}
                    className="p-2 border border-slate-200 rounded-lg text-xs font-semibold text-gray-800 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                    <span>+ Hotspot</span>
                  </button>
                </div>
              </div>

              {/* Elements List & Triggers */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Elements & Triggers ({elements.length})
                </div>
                {elements.map((el) => (
                  <div key={el.id} className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 capitalize">
                        {el.type} Element
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteElement(el.id)}
                        className="text-gray-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {el.text !== undefined && (
                      <input
                        type="text"
                        value={el.text}
                        onChange={(e) => {
                          const next = elements.map((item) => (item.id === el.id ? { ...item, text: e.target.value } : item));
                          onUpdateContent({ ...content, elements: next });
                        }}
                        className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded text-gray-800"
                      />
                    )}

                    <div className="pt-1 border-t border-slate-100">
                      <div className="text-[10px] font-semibold text-gray-500 mb-1">
                        Active Triggers:
                      </div>
                      {(el.triggers || []).map((tr, tIdx) => (
                        <div key={tIdx} className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200 text-gray-700 flex items-center justify-between">
                          <span>
                            <strong>When:</strong> {tr.event} &rarr; <strong>Action:</strong> {tr.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* SIMULATION LAB EDITOR (THE DEAL DESK BRIDGE) */}
        {subtype === 'simulation_lab' && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Lab Title
              </label>
              <input
                type="text"
                value={(content.title as string) || 'Simulation Lab: Margin Shield & Concession Trade'}
                onChange={(e) => onUpdateContent({ ...content, title: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Subtitle / Learning Objective
              </label>
              <input
                type="text"
                value={(content.subtitle as string) || 'Tell–Show–Do Multi-Turn KPI Negotiation Simulation'}
                onChange={(e) => onUpdateContent({ ...content, subtitle: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Tell: Concept Brief
              </label>
              <textarea
                rows={3}
                value={(content.conceptBrief as string) || ''}
                placeholder="Explain the financial/strategic logic learners must master..."
                onChange={(e) => onUpdateContent({ ...content, conceptBrief: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Base Deal ($)
                </label>
                <input
                  type="number"
                  value={typeof content.baseValue === 'number' ? content.baseValue : 50000}
                  onChange={(e) => onUpdateContent({ ...content, baseValue: Number(e.target.value) })}
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Target Margin (%)
                </label>
                <input
                  type="number"
                  value={typeof content.targetMargin === 'number' ? content.targetMargin : 40}
                  onChange={(e) => onUpdateContent({ ...content, targetMargin: Number(e.target.value) })}
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Default Discount (%)
                </label>
                <input
                  type="number"
                  value={typeof content.discountRate === 'number' ? content.discountRate : 12}
                  onChange={(e) => onUpdateContent({ ...content, discountRate: Number(e.target.value) })}
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Volume Tier (1-3)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={typeof content.volumeTier === 'number' ? content.volumeTier : 2}
                  onChange={(e) => onUpdateContent({ ...content, volumeTier: Number(e.target.value) })}
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-gray-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* KNOWLEDGE CHECK EDITOR IN INTERACTIVE DRAWER */}
        {(block.category === 'knowledge_check' ||
          subtype === 'multiple_choice' ||
          subtype === 'multiple_response' ||
          subtype === 'fill_in_blank' ||
          subtype === 'matching') && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Question Prompt
              </label>
              <textarea
                rows={2}
                value={(content.question as string) || (content.prompt as string) || ''}
                onChange={(e) =>
                  onUpdateContent({ ...content, question: e.target.value, prompt: e.target.value })
                }
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>

            {/* Multiple Choice / Response Options */}
            {Array.isArray(content.options) && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Answer Choices</span>
                  <button
                    type="button"
                    onClick={() => {
                      const opts = [
                        ...(content.options as Array<{ id?: string; text?: string; isCorrect?: boolean }>),
                      ];
                      opts.push({
                        id: `opt-${Date.now()}`,
                        text: `Choice ${opts.length + 1}`,
                        isCorrect: false,
                      });
                      onUpdateContent({ ...content, options: opts });
                    }}
                    className="text-orange-600 hover:text-orange-700 text-xs font-semibold cursor-pointer"
                  >
                    + Add Choice
                  </button>
                </div>
                {(content.options as Array<{ id?: string; text?: string; isCorrect?: boolean }>).map((opt, oIdx) => (
                  <div key={opt.id || oIdx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(opt.isCorrect)}
                      onChange={(e) => {
                        const opts = (
                          content.options as Array<{ id?: string; text?: string; isCorrect?: boolean }>
                        ).map((item, idx) =>
                          subtype === 'multiple_choice'
                            ? { ...item, isCorrect: idx === oIdx }
                            : idx === oIdx
                            ? { ...item, isCorrect: e.target.checked }
                            : item
                        );
                        onUpdateContent({ ...content, options: opts });
                      }}
                      className="rounded accent-orange-500 cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      value={opt.text || ''}
                      onChange={(e) => {
                        const opts = [
                          ...(content.options as Array<{ id?: string; text?: string; isCorrect?: boolean }>),
                        ];
                        opts[oIdx] = { ...opts[oIdx], text: e.target.value };
                        onUpdateContent({ ...content, options: opts });
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded text-gray-800"
                    />
                    {(content.options as Array<{ id?: string; text?: string; isCorrect?: boolean }>).length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const opts = (
                            content.options as Array<{ id?: string; text?: string; isCorrect?: boolean }>
                          ).filter((_, idx) => idx !== oIdx);
                          onUpdateContent({ ...content, options: opts });
                        }}
                        className="text-gray-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formative Feedback */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Correct Feedback
                </label>
                <textarea
                  rows={2}
                  value={(content.correctFeedback as string) || (content.feedback as { correct?: string })?.correct || ''}
                  onChange={(e) =>
                    onUpdateContent({
                      ...content,
                      correctFeedback: e.target.value,
                      feedback: { ...(content.feedback as Record<string, unknown>), correct: e.target.value },
                    })
                  }
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-gray-800 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">
                  Incorrect Feedback
                </label>
                <textarea
                  rows={2}
                  value={(content.incorrectFeedback as string) || (content.feedback as { incorrect?: string })?.incorrect || ''}
                  onChange={(e) =>
                    onUpdateContent({
                      ...content,
                      incorrectFeedback: e.target.value,
                      feedback: { ...(content.feedback as Record<string, unknown>), incorrect: e.target.value },
                    })
                  }
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-gray-800 resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Direct Local Uploads */}
      <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />

      {/* Unified Media Studio / Flow Modal */}
      <UnifiedMediaModal
        isOpen={mediaModalOpen}
        onClose={() => {
          setMediaModalOpen(false);
          setMediaModalTarget(null);
        }}
        onSelect={handleMediaModalSelect}
        initialTab="library"
        mediaType={mediaModalTarget?.type || 'image'}
        accentColor={accentColor}
      />
    </div>
  );
}
