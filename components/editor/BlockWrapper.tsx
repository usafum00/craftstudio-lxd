'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, BlockSettings, Lesson } from '@/lib/types';
import { TextBlock } from './blocks/TextBlock';
import { StatementBlock } from './blocks/StatementBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { ListBlock } from './blocks/ListBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { GalleryBlock } from './blocks/GalleryBlock';
import { MultimediaBlock } from './blocks/MultimediaBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { InteractiveBlock } from './blocks/InteractiveBlock';
import { KnowledgeCheckBlock } from './blocks/KnowledgeCheckBlock';
import { SurveyBlock } from './blocks/SurveyBlock';
import { ChartBlock } from './blocks/ChartBlock';
import { StylePopover } from './popovers/StylePopover';
import { FormatPopover } from './popovers/FormatPopover';
import { EditVideoDrawer } from './drawers/EditVideoDrawer';
import { EditInteractiveDrawer } from './drawers/EditInteractiveDrawer';
import { MagicTransformerPopover } from './MagicTransformerPopover';
import {
  Pencil,
  Palette,
  DraftingCompass,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  MoreHorizontal,
  Plus,
  BookmarkPlus,
  Check,
} from 'lucide-react';

interface BlockWrapperProps {
  block: Block;
  index: number;
  totalBlocks: number;
  accentColor: string;
  onUpdateContent: (id: string, newContent: Record<string, unknown>) => void;
  onUpdateSettings?: (id: string, newSettings: BlockSettings) => void;
  onOpenSettings: (id: string, initialTab: 'content' | 'settings') => void;
  onMoveBlock: (index: number, direction: 'up' | 'down') => void;
  onDuplicateBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onOpenLibrary: (insertIndex: number) => void;
  onUploadMedia: (file: File) => Promise<string | null>;
  courseLessons?: Lesson[];
  onTransformBlock?: (id: string, newBlockData: Partial<Block>) => void;
  onInsertBlockBelow?: (afterBlockId: string, newBlock: Block) => void;
  lessonTitle?: string;
}

export function BlockWrapper({
  block,
  index,
  totalBlocks,
  accentColor = '#ff5722',
  onUpdateContent,
  onUpdateSettings,
  onOpenSettings,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onOpenLibrary,
  onUploadMedia,
  courseLessons = [],
  onTransformBlock,
  onInsertBlockBelow,
  lessonTitle,
}: BlockWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activePopover, setActivePopover] = useState<'none' | 'style' | 'format'>('none');
  const [videoDrawerOpen, setVideoDrawerOpen] = useState(false);
  const [interactiveDrawerOpen, setInteractiveDrawerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isVideo = block.category === 'multimedia' && block.subtype === 'video';

  // Get readable block label for top-left pill
  const getBlockLabel = () => {
    if (isVideo) return 'Video';
    if (block.category === 'text') {
      if (block.subtype === 'heading') return 'Heading';
      if (block.subtype === 'subheading') return 'Subheading';
      if (block.subtype === 'paragraph_heading') return 'Paragraph with heading';
      if (block.subtype === 'two_column') return 'Two Column';
      if (block.subtype === 'table') return 'Table';
      return 'Text';
    }
    if (block.category === 'statement') return 'Statement';
    if (block.category === 'quote') return 'Quote';
    if (block.category === 'list') return 'List';
    if (block.category === 'image') return 'Image';
    if (block.category === 'gallery') return 'Gallery';
    if (block.category === 'multimedia') {
      if (block.subtype === 'audio') return 'Audio';
      if (block.subtype === 'embed') return 'Embed';
      return 'Attachment';
    }
    if (block.category === 'interactive') {
      if (block.subtype === 'accordion') return 'Accordion';
      if (block.subtype === 'tabs') return 'Tabs';
      if (block.subtype === 'process') return 'Process';
      if (block.subtype === 'flashcards') return 'Flashcards';
      if (block.subtype === 'labeled_graphic') return 'Labeled Graphic';
      if (block.subtype === 'sorting') return 'Sorting Activity';
      return 'Interactive';
    }
    if (block.category === 'knowledge_check') return 'Knowledge Check';
    if (block.category === 'survey') return 'Survey';
    if (block.category === 'chart') return 'Chart';
    if (block.category === 'divider') {
      if (block.subtype === 'continue_button') return 'Continue';
      if (block.subtype === 'spacer') return 'Spacer';
      return 'Divider';
    }
    if (block.category === 'code') return 'Code';
    return block.category.charAt(0).toUpperCase() + block.category.slice(1);
  };

  // Compute numeric padding
  const getNumericPadding = (val: unknown, fallback: number) => {
    if (typeof val === 'number') return val;
    if (val === 'small') return 15;
    if (val === 'medium') return 30;
    if (val === 'large') return 60;
    return fallback;
  };

  const topPadding = getNumericPadding(block.settings?.paddingTop, 30);
  const bottomPadding = getNumericPadding(block.settings?.paddingBottom, 30);

  // Compute background styling
  const bgType = block.settings?.backgroundColor || 'light';
  let bgClass = 'bg-white text-slate-900';
  let bgInlineStyle: React.CSSProperties = {};

  if (bgType === 'gray') {
    bgClass = 'bg-[#f1f5f9] text-slate-900';
  } else if (bgType === 'theme') {
    bgClass = 'text-white';
    bgInlineStyle = { backgroundColor: accentColor };
  } else if (bgType === 'theme_tint') {
    bgClass = 'text-slate-900';
    bgInlineStyle = { backgroundColor: `${accentColor}18` };
  } else if (bgType === 'dark') {
    bgClass = 'bg-[#262626] text-white';
  } else if (bgType === 'black') {
    bgClass = 'bg-[#000000] text-white';
  } else if (bgType === 'custom') {
    bgClass = 'text-slate-900';
    bgInlineStyle = { backgroundColor: (block.settings?.customBgColor as string) || '#ffffff' };
  } else if (bgType === 'image' && block.settings?.bgImage) {
    bgClass = 'text-white relative overflow-hidden';
    bgInlineStyle = {
      backgroundImage: `url(${block.settings.bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  // Content width constraint (Galleries default to wide max-w-6xl container to eliminate empty side padding)
  const isGallery = block.category === 'gallery';
  const widthMode = (block.settings?.contentWidth || block.settings?.width || (isGallery ? 'L' : 'M')) as 'S' | 'M' | 'L' | 'full';
  const widthClass =
    widthMode === 'S'
      ? 'max-w-xl mx-auto'
      : widthMode === 'full'
      ? 'max-w-7xl mx-auto px-4 w-full'
      : widthMode === 'L' || isGallery
      ? 'max-w-6xl mx-auto px-4 w-full'
      : 'max-w-4xl mx-auto';

  const isMediaDrawer = block.category === 'multimedia';
  const isInteractiveDrawer = block.category === 'interactive' || block.category === 'knowledge_check';

  const handleEditClick = () => {
    if (isMediaDrawer) {
      setVideoDrawerOpen(true);
    } else if (isInteractiveDrawer) {
      setInteractiveDrawerOpen(true);
    } else {
      onOpenSettings(block.id, 'content');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDesc.trim(),
          category: block.category,
          blocks: [block],
        }),
      });
      setTemplateSaved(true);
      setTimeout(() => {
        setTemplateSaved(false);
        setShowSaveTemplateModal(false);
        setTemplateName('');
        setTemplateDesc('');
      }, 1200);
    } catch (err) {
      console.error('Failed to save template', err);
    }
  };

  const showToolbars = isHovered || activePopover !== 'none' || videoDrawerOpen || interactiveDrawerOpen;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMoreMenuOpen(false);
      }}
      className="relative group transition-all duration-150 my-1"
    >
      {/* 1. TOP-LEFT FLOATING TOOLBAR: Block Type Badge + [Edit, Style, Format] */}
      <div
        className={`absolute -top-3.5 left-6 z-30 flex items-center gap-1.5 transition-opacity duration-150 ${
          showToolbars ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Block Type Pill Badge */}
        <div
          {...attributes}
          {...listeners}
          className="px-3 py-1 bg-white text-gray-800 text-xs font-semibold rounded-full border border-slate-200/90 shadow-sm flex items-center gap-1.5 select-none cursor-grab active:cursor-grabbing hover:bg-slate-50"
          title="Drag to reorder"
        >
          <span>{getBlockLabel()}</span>
        </div>

        {/* 3 Action Buttons: Edit (Pencil), Style (Palette), Format (Ruler/Triangle) */}
        <div className="bg-white border border-slate-200/90 shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          {/* Edit (Pencil icon) */}
          <button
            type="button"
            onClick={handleEditClick}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              videoDrawerOpen || interactiveDrawerOpen
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-black hover:bg-slate-100'
            }`}
            title="Edit content"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Style (Palette icon) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'style' ? 'none' : 'style')}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                activePopover === 'style'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-slate-100'
              }`}
              title="Style (Color & Background)"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {activePopover === 'style' && (
              <StylePopover
                settings={block.settings || {}}
                accentColor={accentColor}
                onUpdateSettings={(newSettings) => {
                  if (onUpdateSettings) {
                    onUpdateSettings(block.id, newSettings);
                  }
                }}
                onClose={() => setActivePopover('none')}
              />
            )}
          </div>

          {/* Format (Ruler / Set-square icon) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'format' ? 'none' : 'format')}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                activePopover === 'format'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-slate-100'
              }`}
              title="Format (Padding, width, radius & seeking)"
            >
              <DraftingCompass className="w-3.5 h-3.5" />
            </button>

            {activePopover === 'format' && (
              <FormatPopover
                blockCategory={block.category}
                blockSubtype={block.subtype}
                settings={block.settings || {}}
                onUpdateSettings={(newSettings) => {
                  if (onUpdateSettings) {
                    onUpdateSettings(block.id, newSettings);
                  }
                }}
                onClose={() => setActivePopover('none')}
              />
            )}
          </div>
        </div>
      </div>

      {/* 2. TOP-RIGHT FLOATING TOOLBAR: AI Transform, Move Up, Move Down, Duplicate, Delete, More */}
      <div
        className={`absolute -top-3.5 right-6 z-30 flex items-center gap-1 bg-white border border-slate-200/90 shadow-md rounded-xl px-2 py-1 transition-opacity duration-150 ${
          showToolbars ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* ✨ Magic LXD Transformer */}
        <MagicTransformerPopover
          block={block}
          lessonTitle={lessonTitle}
          onTransformBlock={onTransformBlock}
          onInsertBlockBelow={onInsertBlockBelow}
          onUpdateContent={onUpdateContent}
        />

        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMoveBlock(index, 'up')}
          className="p-1 text-gray-500 hover:text-black disabled:opacity-25 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          title="Move up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={index === totalBlocks - 1}
          onClick={() => onMoveBlock(index, 'down')}
          className="p-1 text-gray-500 hover:text-black disabled:opacity-25 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          title="Move down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDuplicateBlock(block.id)}
          className="p-1 text-gray-500 hover:text-black rounded hover:bg-slate-100 transition-colors cursor-pointer"
          title="Duplicate block"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDeleteBlock(block.id)}
          className="p-1 text-gray-500 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
          title="Delete block"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="p-1 text-gray-500 hover:text-black rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title="More actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {moreMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 text-left">
              <button
                type="button"
                onClick={() => {
                  setTemplateName(`${block.subtype.replace(/_/g, ' ')} template`);
                  setShowSaveTemplateModal(true);
                  setMoreMenuOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Save as Template</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN BLOCK CONTAINER (Applies full-bleed background & numeric padding) */}
      <div
        style={{
          paddingTop: `${topPadding}px`,
          paddingBottom: `${bottomPadding}px`,
          ...bgInlineStyle,
        }}
        className={`w-full px-6 sm:px-10 transition-all duration-200 border ${
          isHovered ? 'border-sky-300 ring-2 ring-sky-100/50' : 'border-transparent'
        } ${bgClass}`}
      >
        {bgType === 'image' && (
          <div
            className={`absolute inset-0 ${
              block.settings?.bgOverlay === 'light'
                ? 'bg-white/70'
                : block.settings?.bgOverlay === 'none'
                ? 'bg-transparent'
                : 'bg-black/60'
            }`}
          />
        )}

        <div className={`relative z-10 w-full ${widthClass}`}>
          {/* VIDEO BLOCK */}
          {isVideo && (
            <VideoBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUpdateSettings={(newSettings) => {
                if (onUpdateSettings) onUpdateSettings(block.id, newSettings);
              }}
              accentColor={accentColor}
            />
          )}

          {/* OTHER BLOCKS */}
          {block.category === 'text' && (
            <TextBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {block.category === 'statement' && (
            <StatementBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {block.category === 'quote' && (
            <QuoteBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUploadImage={onUploadMedia}
              accentColor={accentColor}
            />
          )}

          {block.category === 'list' && (
            <ListBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {block.category === 'image' && (
            <ImageBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUploadImage={onUploadMedia}
              accentColor={accentColor}
            />
          )}

          {block.category === 'gallery' && (
            <GalleryBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUploadImage={onUploadMedia}
              accentColor={accentColor}
            />
          )}

          {block.category === 'multimedia' && !isVideo && (
            <MultimediaBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUploadMedia={onUploadMedia}
              accentColor={accentColor}
            />
          )}

          {block.category === 'divider' && (
            <DividerBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {block.category === 'code' && (
            <CodeBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {block.category === 'interactive' && (
            <InteractiveBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
              courseLessons={courseLessons}
            />
          )}

          {block.category === 'knowledge_check' && (
            <KnowledgeCheckBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {block.category === 'survey' && (
            <SurveyBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {block.category === 'chart' && (
            <ChartBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}
        </div>
      </div>

      {/* 4. BOTTOM INSERT TRIGGER ON BORDER: Horizontal orange line + circular '+' button */}
      <div
        className={`absolute -bottom-3 left-0 right-0 z-20 flex items-center justify-center transition-opacity duration-150 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-x-8 h-0.5 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <button
          type="button"
          onClick={() => onOpenLibrary(index + 1)}
          className="relative z-10 w-6 h-6 rounded-full bg-black hover:bg-gray-800 text-white hover:scale-110 flex items-center justify-center shadow-md transition-all cursor-pointer"
          title="Insert block below"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>

      {/* Edit Video & Multimedia Left Drawer (Panel 1) */}
      {isMediaDrawer && (
        <EditVideoDrawer
          isOpen={videoDrawerOpen}
          block={block}
          onClose={() => setVideoDrawerOpen(false)}
          onUpdateContent={(newContent) => onUpdateContent(block.id, newContent)}
          accentColor={accentColor}
        />
      )}

      {/* Edit Interactive & Knowledge Check Left Drawer */}
      {isInteractiveDrawer && (
        <EditInteractiveDrawer
          isOpen={interactiveDrawerOpen}
          block={block}
          onClose={() => setInteractiveDrawerOpen(false)}
          onUpdateContent={(newContent) => onUpdateContent(block.id, newContent)}
          onUpdateSettings={(newSettings) => {
            if (onUpdateSettings) onUpdateSettings(block.id, newSettings);
          }}
          onUploadMedia={onUploadMedia}
          courseLessons={courseLessons}
          accentColor={accentColor}
        />
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150 text-left">
            <h3 className="text-base font-bold text-gray-900 mb-1">Save as Template</h3>
            <p className="text-xs text-gray-500 mb-4">
              Save this customized block for reuse across all of your courses.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-3.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="px-4 py-1.5 text-xs font-semibold bg-black hover:bg-gray-800 text-white rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {templateSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{templateSaved ? 'Saved!' : 'Save Template'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
