'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, BlockSettings, Lesson } from '@/lib/types';
import { isBlockDark } from '@/lib/contrast';
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
  const isScenario = block.category === 'interactive' && block.subtype === 'scenario';
  const isGallery = block.category === 'gallery';

  // Get readable block label for top-left pill
  const getBlockLabel = () => {
    if (isVideo) return 'Video';
    if (isScenario) return 'Scenario Stage';
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
    if (val === 'small') return 16;
    if (val === 'medium') return 32;
    if (val === 'large') return 64;
    return fallback;
  };

  const topPadding = getNumericPadding(block.settings?.paddingTop, 36);
  const bottomPadding = getNumericPadding(block.settings?.paddingBottom, 36);

  // Layer 1: Background Styling
  const bgType = block.settings?.backgroundColor || 'light';
  let bgStyle: React.CSSProperties = {};

  if (bgType === 'gray') {
    bgStyle = { backgroundColor: '#f4f4f5' };
  } else if (bgType === 'theme') {
    bgStyle = { backgroundColor: accentColor };
  } else if (bgType === 'theme_tint') {
    bgStyle = { backgroundColor: `${accentColor}18` };
  } else if (bgType === 'dark') {
    bgStyle = { backgroundColor: '#18181b' };
  } else if (bgType === 'black') {
    bgStyle = { backgroundColor: '#000000' };
  } else if (bgType === 'custom') {
    bgStyle = { backgroundColor: (block.settings?.customBgColor as string) || '#ffffff' };
  } else if (bgType === 'image' && block.settings?.bgImage) {
    const isParallax = Boolean(block.settings.bgParallax);
    bgStyle = {
      backgroundImage: `url(${block.settings.bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: isParallax ? 'fixed' : 'scroll',
    };
  } else {
    bgStyle = { backgroundColor: '#ffffff' };
  }

  // Layer 2: Smart Overlay & Blur Engine
  const isImageBg = bgType === 'image' && Boolean(block.settings?.bgImage);
  const overlayColorType =
    (block.settings?.bgOverlayColor as string) ||
    (block.settings?.bgOverlay === 'light' ? 'white' : 'black');
  const overlayOpacity =
    typeof block.settings?.bgOverlayOpacity === 'number'
      ? block.settings.bgOverlayOpacity
      : 40;
  const bgBlur =
    typeof block.settings?.bgBlur === 'number' ? block.settings.bgBlur : 0;

  const overlayBg =
    overlayColorType === 'white'
      ? '#ffffff'
      : overlayColorType === 'theme'
      ? accentColor
      : '#000000';

  // Smart Contrast calculation
  const isDark = isBlockDark(block.settings);

  // Layer 3: Inner Stage Width Mapping
  const defaultWidthMode = isGallery || isScenario ? 'L' : 'M';
  const widthMode = (block.settings?.contentWidth ||
    block.settings?.width ||
    defaultWidthMode) as 'S' | 'M' | 'L' | 'full';

  const widthClass =
    widthMode === 'S'
      ? 'max-w-2xl mx-auto px-4 sm:px-6'
      : widthMode === 'full'
      ? 'w-full px-0 sm:px-4'
      : widthMode === 'L' || isGallery || isScenario
      ? 'max-w-6xl mx-auto px-4 sm:px-6 md:px-8'
      : 'max-w-3xl mx-auto px-4 sm:px-6';

  const isMediaDrawer = block.category === 'multimedia';
  const isInteractiveDrawer =
    block.category === 'interactive' || block.category === 'knowledge_check';

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

  const showToolbars =
    isHovered ||
    activePopover !== 'none' ||
    videoDrawerOpen ||
    interactiveDrawerOpen;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMoreMenuOpen(false);
      }}
      className="relative group w-full transition-all duration-150"
    >
      {/* 1. TOP-LEFT FLOATING AUTHOR TOOLBAR: Block Type Badge + [Edit, Style, Format] */}
      <div
        className={`absolute top-3 left-4 sm:left-8 z-30 flex items-center gap-1.5 transition-opacity duration-150 ${
          showToolbars ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Block Type Pill Badge */}
        <div
          {...attributes}
          {...listeners}
          className="px-3 py-1 bg-white text-gray-800 text-xs font-semibold rounded-full border border-slate-200/90 shadow-md flex items-center gap-1.5 select-none cursor-grab active:cursor-grabbing hover:bg-slate-50 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-slate-600 transition-colors" />
          <span>{getBlockLabel()}</span>
        </div>

        {/* Action Buttons Capsule */}
        <div className="flex items-center gap-0.5 bg-white rounded-full border border-slate-200/90 shadow-md p-0.5 backdrop-blur-md">
          {/* EDIT BUTTON */}
          <button
            type="button"
            onClick={handleEditClick}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-black hover:bg-slate-100 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Pencil className="w-3 h-3 text-slate-500" />
            <span>Edit</span>
          </button>

          {/* STYLE BUTTON (POPOVER TRIGGER) */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === 'style' ? 'none' : 'style')
              }
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 cursor-pointer ${
                activePopover === 'style'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-700 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Palette className="w-3 h-3 text-slate-500" />
              <span>Style</span>
            </button>

            {activePopover === 'style' && (
              <StylePopover
                settings={block.settings || {}}
                accentColor={accentColor}
                onUpdateSettings={(newSettings) => {
                  if (onUpdateSettings) onUpdateSettings(block.id, newSettings);
                }}
                onClose={() => setActivePopover('none')}
              />
            )}
          </div>

          {/* FORMAT BUTTON (POPOVER TRIGGER) */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === 'format' ? 'none' : 'format')
              }
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 cursor-pointer ${
                activePopover === 'format'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-700 hover:text-black hover:bg-slate-100'
              }`}
            >
              <DraftingCompass className="w-3 h-3 text-slate-500" />
              <span>Format</span>
            </button>

            {activePopover === 'format' && (
              <FormatPopover
                settings={block.settings || {}}
                blockCategory={block.category}
                blockSubtype={block.subtype}
                onUpdateSettings={(newSettings) => {
                  if (onUpdateSettings) onUpdateSettings(block.id, newSettings);
                }}
                onClose={() => setActivePopover('none')}
              />
            )}
          </div>
        </div>
      </div>

      {/* 2. TOP-RIGHT FLOATING TOOLBAR: AI Transformer + Reorder + Duplicate + Delete */}
      <div
        className={`absolute top-3 right-4 sm:right-8 z-30 flex items-center gap-1 bg-white rounded-full border border-slate-200/90 shadow-md p-1 transition-opacity duration-150 backdrop-blur-md ${
          showToolbars ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* AI MAGIC TRANSFORMER */}
        {onTransformBlock && (
          <MagicTransformerPopover
            block={block}
            onTransformBlock={onTransformBlock}
            onInsertBlockBelow={onInsertBlockBelow}
            onUpdateContent={onUpdateContent}
            lessonTitle={lessonTitle}
          />
        )}

        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMoveBlock(index, 'up')}
          className="p-1 text-gray-500 hover:text-black disabled:opacity-25 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Move up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={index === totalBlocks - 1}
          onClick={() => onMoveBlock(index, 'down')}
          className="p-1 text-gray-500 hover:text-black disabled:opacity-25 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Move down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDuplicateBlock(block.id)}
          className="p-1 text-gray-500 hover:text-black rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Duplicate block"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDeleteBlock(block.id)}
          className="p-1 text-gray-500 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
          title="Delete block"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="p-1 text-gray-500 hover:text-black rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="More actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {moreMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-40 text-left animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setTemplateName(`${block.subtype.replace(/_/g, ' ')} template`);
                  setShowSaveTemplateModal(true);
                  setMoreMenuOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Save as Template</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-LAYER SANDWICH ARCHITECTURE                                             */}
      {/* ========================================================================= */}
      {/* LAYER 1: OUTER SECTION WRAPPER (100% Full-Viewport Bleed)                 */}
      <section
        style={{
          paddingTop: `${topPadding}px`,
          paddingBottom: `${bottomPadding}px`,
          ...bgStyle,
        }}
        className={`relative w-full overflow-hidden transition-all duration-200 border-y ${
          isHovered
            ? 'border-sky-300 ring-2 ring-sky-100/60 shadow-xs'
            : 'border-transparent'
        }`}
      >
        {/* LAYER 2: SMART OVERLAY & BLUR ENGINE (When background image is active)  */}
        {isImageBg && (
          <>
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-300"
              style={{
                backgroundColor: overlayBg,
                opacity: overlayOpacity / 100,
                backdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined,
                WebkitBackdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined,
              }}
            />
            {/* Top/Bottom subtle vignette for theatrical photographic depth */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/25" />
          </>
        )}

        {/* LAYER 3: INNER CONTENT STAGE (Width controlled independently)           */}
        <div
          className={`relative z-10 w-full ${widthClass} ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
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

          {/* TEXT BLOCK */}
          {block.category === 'text' && (
            <TextBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {/* STATEMENT BLOCK */}
          {block.category === 'statement' && (
            <StatementBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {/* QUOTE BLOCK */}
          {block.category === 'quote' && (
            <QuoteBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUploadImage={onUploadMedia}
              accentColor={accentColor}
            />
          )}

          {/* LIST BLOCK */}
          {block.category === 'list' && (
            <ListBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {/* IMAGE BLOCK */}
          {block.category === 'image' && (
            <ImageBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUploadImage={onUploadMedia}
              accentColor={accentColor}
            />
          )}

          {/* GALLERY BLOCK */}
          {block.category === 'gallery' && (
            <GalleryBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUploadImage={onUploadMedia}
              accentColor={accentColor}
            />
          )}

          {/* MULTIMEDIA BLOCK (AUDIO, EMBED, ATTACHMENT) */}
          {block.category === 'multimedia' && !isVideo && (
            <MultimediaBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              onUploadMedia={onUploadMedia}
              accentColor={accentColor}
            />
          )}

          {/* DIVIDER BLOCK (CONTINUE BUTTON / SPACER) */}
          {block.category === 'divider' && (
            <DividerBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {/* CODE BLOCK */}
          {block.category === 'code' && (
            <CodeBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {/* INTERACTIVE BLOCK (ACCORDION, TABS, SCENARIO, FLASHCARDS, PROCESS) */}
          {block.category === 'interactive' && (
            <InteractiveBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
              courseLessons={courseLessons}
            />
          )}

          {/* KNOWLEDGE CHECK BLOCK */}
          {block.category === 'knowledge_check' && (
            <KnowledgeCheckBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {/* SURVEY BLOCK */}
          {block.category === 'survey' && (
            <SurveyBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}

          {/* CHART BLOCK */}
          {block.category === 'chart' && (
            <ChartBlock
              block={block}
              onChange={(newContent) => onUpdateContent(block.id, newContent)}
              accentColor={accentColor}
            />
          )}
        </div>
      </section>

      {/* 4. BOTTOM INSERT TRIGGER ON BORDER: Horizontal orange line + circular '+' button */}
      <div
        className={`absolute -bottom-3 left-0 right-0 z-20 flex items-center justify-center transition-opacity duration-150 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Subtle Horizontal Guide Line */}
        <div
          className="absolute inset-x-0 h-0.5"
          style={{ backgroundColor: `${accentColor}70` }}
        />

        {/* Circular Centered Plus Button */}
        <button
          type="button"
          onClick={() => onOpenLibrary(index + 1)}
          style={{ backgroundColor: accentColor }}
          className="relative z-10 w-6 h-6 rounded-full text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer ring-2 ring-white"
          title="Insert block here"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* DRAWER: Video Settings & Media Vault */}
      <EditVideoDrawer
        isOpen={videoDrawerOpen}
        block={block}
        onClose={() => setVideoDrawerOpen(false)}
        onUpdateContent={(newContent) => onUpdateContent(block.id, newContent)}
        accentColor={accentColor}
      />

      {/* DRAWER: Interactive (Accordion, Tabs, Scenario, Flashcards, Knowledge Check) */}
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

      {/* MODAL: Save as Custom Template */}
      {showSaveTemplateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowSaveTemplateModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">
                  Save as Block Template
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Executive Phishing Scenario"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="Reusable block preset for cybersecurity training modules"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-900 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!templateName.trim() || templateSaved}
                onClick={handleSaveAsTemplate}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {templateSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved to Vault!</span>
                  </>
                ) : (
                  <span>Save Template</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
