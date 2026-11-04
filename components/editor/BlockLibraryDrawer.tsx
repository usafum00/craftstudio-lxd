'use client';

import React, { useState, useEffect } from 'react';
import { BlockCategory, Block, BlockTemplate } from '@/lib/types';
import {
  X,
  Search,
  Type,
  Sparkles,
  Quote,
  List,
  Image as ImageIcon,
  Layers,
  Film,
  HelpCircle,
  BarChart2,
  Minus,
  Code,
  LayoutTemplate,
  FileCheck,
  RotateCw,
  Plus,
  Trash2,
  FolderArchive,
  FileCode,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface BlockLibraryDrawerProps {
  isOpen: boolean;
  insertIndex: number;
  onClose: () => void;
  onSelectVariant: (category: BlockCategory, subtype: string, insertIndex: number) => void;
  onInsertBlocks?: (blocks: Block[], insertIndex: number) => void;
  accentColor?: string;
}

interface BlockVariant {
  subtype: string;
  name: string;
  description: string;
  preview: React.ReactNode;
}

export function BlockLibraryDrawer({
  isOpen,
  insertIndex,
  onClose,
  onSelectVariant,
  onInsertBlocks,
  accentColor = '#ff5722',
}: BlockLibraryDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory>('text');
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<BlockTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (selectedCategory === 'block_templates' && isOpen) {
      loadTemplates();
    }
  }, [selectedCategory, isOpen]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (e) {
      console.error('Error fetching templates', e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      }
    } catch (err) {
      console.error('Error deleting template', err);
    }
  };

  if (!isOpen) return null;

  const categories: { id: BlockCategory; label: string; icon: React.ElementType }[] = [
    { id: 'text', label: 'Text', icon: Type },
    { id: 'statement', label: 'Statement', icon: Sparkles },
    { id: 'quote', label: 'Quote', icon: Quote },
    { id: 'list', label: 'List', icon: List },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'gallery', label: 'Gallery', icon: Layers },
    { id: 'multimedia', label: 'Multimedia', icon: Film },
    { id: 'interactive', label: 'Interactive', icon: Layers },
    { id: 'knowledge_check', label: 'Knowledge check', icon: HelpCircle },
    { id: 'survey', label: 'Survey', icon: FileCheck },
    { id: 'chart', label: 'Chart', icon: BarChart2 },
    { id: 'divider', label: 'Divider', icon: Minus },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'block_templates', label: 'Block templates', icon: LayoutTemplate },
  ];

  // Map of category -> variants
  const variantsMap: Record<Exclude<BlockCategory, 'block_templates'>, BlockVariant[]> = {
    text: [
      {
        subtype: 'paragraph',
        name: 'Paragraph',
        description: 'Standard block for body text and long-form narrative.',
        preview: (
          <div className="space-y-1.5 p-3 bg-white rounded-lg border border-gray-100">
            <div className="h-2 bg-gray-300 rounded w-full" />
            <div className="h-2 bg-gray-300 rounded w-5/6" />
            <div className="h-2 bg-gray-200 rounded w-4/6" />
          </div>
        ),
      },
      {
        subtype: 'paragraph_heading',
        name: 'Paragraph with heading',
        description: 'Bold section title paired with introductory copy.',
        preview: (
          <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-100">
            <div className="h-3 bg-gray-900 rounded w-1/2" />
            <div className="h-2 bg-gray-300 rounded w-full" />
            <div className="h-2 bg-gray-200 rounded w-4/5" />
          </div>
        ),
      },
      {
        subtype: 'paragraph_subheading',
        name: 'Paragraph with subheading',
        description: 'Lighter subheading followed by formatted body text.',
        preview: (
          <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-100">
            <div className="h-2.5 bg-gray-600 rounded w-2/5" />
            <div className="h-2 bg-gray-300 rounded w-full" />
            <div className="h-2 bg-gray-200 rounded w-3/4" />
          </div>
        ),
      },
      {
        subtype: 'heading',
        name: 'Heading',
        description: 'Standalone prominent heading for high-level concepts.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
            <div className="h-4 bg-gray-900 rounded w-2/3" />
          </div>
        ),
      },
      {
        subtype: 'subheading',
        name: 'Subheading',
        description: 'Smaller secondary heading for breaking up content sections.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
            <div className="h-3 bg-gray-600 rounded w-1/2" />
          </div>
        ),
      },
      {
        subtype: 'two_column',
        name: 'Two-Column text',
        description: 'Two balanced columns for comparisons and parallel narratives.',
        preview: (
          <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-lg border border-gray-100">
            <div className="space-y-1">
              <div className="h-2 bg-gray-400 rounded w-full" />
              <div className="h-1.5 bg-gray-200 rounded w-4/5" />
            </div>
            <div className="space-y-1">
              <div className="h-2 bg-gray-400 rounded w-full" />
              <div className="h-1.5 bg-gray-200 rounded w-4/5" />
            </div>
          </div>
        ),
      },
      {
        subtype: 'table',
        name: 'Table',
        description: 'Configurable data table with rows, columns, and headers.',
        preview: (
          <div className="grid grid-cols-3 gap-1 p-3 bg-white rounded-lg border border-gray-100 text-[8px]">
            <div className="h-2 bg-gray-800 rounded col-span-3 mb-1" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded" />
          </div>
        ),
      },
    ],

    statement: [
      {
        subtype: 'statement_a',
        name: 'Statement A',
        description: 'Centered bold statement between thin top and bottom lines.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 flex flex-col items-center justify-center space-y-1.5">
            <div className="w-12 h-px bg-gray-300" />
            <div className="h-2.5 bg-gray-800 rounded w-3/4" />
            <div className="w-12 h-px bg-gray-300" />
          </div>
        ),
      },
      {
        subtype: 'statement_b',
        name: 'Statement B',
        description: 'Centered statement with a short thick top brand accent bar.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 flex flex-col items-center justify-center space-y-1.5">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <div className="h-2.5 bg-gray-800 rounded w-3/4" />
          </div>
        ),
      },
      {
        subtype: 'statement_c',
        name: 'Statement C',
        description: 'Left-aligned statement inside a full-width light gray background band.',
        preview: (
          <div className="p-3 bg-gray-100 rounded-lg flex flex-col space-y-1">
            <div className="h-2.5 bg-gray-800 rounded w-2/3" />
            <div className="h-2 bg-gray-400 rounded w-1/2" />
          </div>
        ),
      },
      {
        subtype: 'statement_d',
        name: 'Statement D',
        description: 'Left-aligned bold statement with a short top accent bar.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 flex flex-col space-y-1.5">
            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <div className="h-2.5 bg-gray-800 rounded w-3/4" />
          </div>
        ),
      },
      {
        subtype: 'note',
        name: 'Note Callout',
        description: 'Light gray box with a solid vertical brand accent border on the left.',
        preview: (
          <div className="p-3 bg-gray-50 rounded-lg border-l-4 flex flex-col space-y-1" style={{ borderLeftColor: accentColor }}>
            <div className="h-2.5 bg-gray-800 rounded w-3/4" />
            <div className="h-1.5 bg-gray-400 rounded w-1/2" />
          </div>
        ),
      },
      {
        subtype: 'statement_warning',
        name: 'Warning Callout',
        description: 'High-visibility amber box with warning icon and bold alert text.',
        preview: (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex flex-col space-y-1">
            <div className="h-2.5 bg-amber-900 rounded w-3/4" />
            <div className="h-1.5 bg-amber-700/60 rounded w-1/2" />
          </div>
        ),
      },
    ],

    quote: [
      {
        subtype: 'quote_a',
        name: 'Quote A',
        description: 'Centered large quotation marks with author citation below.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 text-center space-y-1">
            <div className="text-sm font-serif font-bold text-gray-400">“</div>
            <div className="h-2 bg-gray-700 rounded w-3/4 mx-auto" />
            <div className="h-1 bg-gray-400 rounded w-1/4 mx-auto" />
          </div>
        ),
      },
      {
        subtype: 'quote_b',
        name: 'Quote B',
        description: 'Quote card with circular author avatar on the left.',
        preview: (
          <div className="p-2.5 bg-white rounded-lg border border-gray-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="h-2 bg-gray-700 rounded w-full" />
              <div className="h-1 bg-gray-400 rounded w-1/3" />
            </div>
          </div>
        ),
      },
      {
        subtype: 'quote_c',
        name: 'Quote C',
        description: 'Pull quote layout inside a tinted brand accent card.',
        preview: (
          <div className="p-3 rounded-lg border text-center space-y-1" style={{ borderColor: accentColor }}>
            <div className="h-2.5 bg-gray-900 rounded w-4/5 mx-auto" />
            <div className="h-1.5 bg-gray-500 rounded w-1/3 mx-auto" />
          </div>
        ),
      },
      {
        subtype: 'quote_d',
        name: 'Quote D',
        description: 'Hero quote overlaid on top of a full-bleed photo.',
        preview: (
          <div className="h-12 rounded-lg bg-gray-800 flex items-center justify-center p-2 text-white">
            <div className="h-2 bg-white rounded w-2/3" />
          </div>
        ),
      },
    ],

    list: [
      {
        subtype: 'numbered_list',
        name: 'Numbered list',
        description: 'Circular numbered badges with bold step headers.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-1.5">
            {[1, 2].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full text-[8px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                  {num}
                </div>
                <div className="h-1.5 bg-gray-300 rounded flex-1" />
              </div>
            ))}
          </div>
        ),
      },
      {
        subtype: 'checkbox_list',
        name: 'Checkbox list',
        description: 'Interactive checkbox list learners can check/uncheck.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-1.5">
            {[1, 2].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border" style={{ borderColor: accentColor }} />
                <div className="h-1.5 bg-gray-300 rounded flex-1" />
              </div>
            ))}
          </div>
        ),
      },
      {
        subtype: 'bulleted_list',
        name: 'Bulleted list',
        description: 'Brand-accent bullet points with editable narrative items.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-1.5">
            {[1, 2].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <div className="h-1.5 bg-gray-300 rounded flex-1" />
              </div>
            ))}
          </div>
        ),
      },
    ],

    image: [
      {
        subtype: 'image_full_width',
        name: 'Image Full Width',
        description: 'Cinematic edge-to-edge banner image with caption.',
        preview: (
          <div className="p-1 bg-white rounded-lg border border-gray-100">
            <div className="h-10 bg-gray-300 rounded w-full" />
            <div className="h-1 bg-gray-400 rounded w-1/3 mx-auto mt-1" />
          </div>
        ),
      },
      {
        subtype: 'image_centered',
        name: 'Image Centered',
        description: 'Medium centered image with bottom caption.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col items-center">
            <div className="h-8 bg-gray-300 rounded w-2/3" />
            <div className="h-1 bg-gray-400 rounded w-1/4 mt-1" />
          </div>
        ),
      },
      {
        subtype: 'image_text',
        name: 'Image & Text',
        description: 'Side-by-side layout with configurable 25/50/75% width.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 grid grid-cols-2 gap-2 items-center">
            <div className="h-8 bg-gray-300 rounded" />
            <div className="space-y-1">
              <div className="h-2 bg-gray-800 rounded w-4/5" />
              <div className="h-1.5 bg-gray-300 rounded w-full" />
            </div>
          </div>
        ),
      },
      {
        subtype: 'text_on_image',
        name: 'Text on Image',
        description: 'Hero background photo with gradient scrim and text.',
        preview: (
          <div className="h-12 rounded-lg bg-gray-700 flex flex-col items-center justify-center p-2 text-white">
            <div className="h-2 bg-white rounded w-2/3" />
            <div className="h-1 bg-gray-300 rounded w-1/2 mt-1" />
          </div>
        ),
      },
    ],

    gallery: [
      {
        subtype: 'gallery_2col',
        name: '2-Column Grid',
        description: 'Side-by-side pair of images with individual captions.',
        preview: (
          <div className="p-1.5 bg-white rounded-lg border border-gray-100 grid grid-cols-2 gap-1.5">
            <div className="h-7 bg-gray-300 rounded" />
            <div className="h-7 bg-gray-300 rounded" />
          </div>
        ),
      },
      {
        subtype: 'gallery_3col',
        name: '3-Column Grid',
        description: 'Three photo cards in a neat responsive grid.',
        preview: (
          <div className="p-1.5 bg-white rounded-lg border border-gray-100 grid grid-cols-3 gap-1">
            <div className="h-7 bg-gray-300 rounded" />
            <div className="h-7 bg-gray-300 rounded" />
            <div className="h-7 bg-gray-300 rounded" />
          </div>
        ),
      },
      {
        subtype: 'gallery_4col',
        name: '4-Column Grid',
        description: 'Four photo cards for showcasing product lines or variants.',
        preview: (
          <div className="p-1 bg-white rounded-lg border border-gray-100 grid grid-cols-4 gap-1">
            <div className="h-6 bg-gray-300 rounded" />
            <div className="h-6 bg-gray-300 rounded" />
            <div className="h-6 bg-gray-300 rounded" />
            <div className="h-6 bg-gray-300 rounded" />
          </div>
        ),
      },
      {
        subtype: 'image_carousel',
        name: 'Image Carousel',
        description: 'Interactive slide carousel with arrows and lightbox zoom.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <div className="h-8 bg-gray-300 rounded w-3/4" />
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
        ),
      },
    ],

    multimedia: [
      {
        subtype: 'video',
        name: 'Video',
        description: 'HTML5 media player supporting local MP4 uploads.',
        preview: (
          <div className="h-10 bg-black rounded-lg flex items-center justify-center text-white">
            <Film className="w-4 h-4" />
          </div>
        ),
      },
      {
        subtype: 'audio',
        name: 'Audio',
        description: 'Audio playback bar with collapsible transcript toggle.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
            <div className="h-1.5 bg-gray-200 rounded flex-1" />
          </div>
        ),
      },
      {
        subtype: 'embed',
        name: 'Embed (Web/Iframe)',
        description: 'Responsive web frame for YouTube, Vimeo, or web links.',
        preview: (
          <div className="h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300">
            <div className="h-4 bg-slate-700 rounded w-1/2" />
          </div>
        ),
      },
      {
        subtype: 'attachment',
        name: 'Attachment',
        description: 'Downloadable file card with filename, size, and download link.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="h-2 bg-gray-700 rounded w-1/2" />
            <div className="w-3 h-3 rounded" style={{ backgroundColor: accentColor }} />
          </div>
        ),
      },
    ],

    divider: [
      {
        subtype: 'divider_line',
        name: 'Divider',
        description: 'Subtle horizontal line to separate blocks.',
        preview: (
          <div className="p-4 bg-white rounded-lg border border-gray-100 flex items-center">
            <div className="h-px bg-gray-300 w-full" />
          </div>
        ),
      },
      {
        subtype: 'numbered_divider',
        name: 'Numbered divider',
        description: 'Horizontal divider line with a centered number circle.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border text-[9px] font-bold flex items-center justify-center" style={{ borderColor: accentColor, color: accentColor }}>
              1
            </div>
          </div>
        ),
      },
      {
        subtype: 'spacer',
        name: 'Spacer',
        description: 'Adjustable blank vertical space.',
        preview: (
          <div className="p-3 bg-white rounded-lg border border-dashed border-gray-200 text-center text-[10px] text-gray-400">
            Spacer
          </div>
        ),
      },
      {
        subtype: 'continue_button',
        name: 'Continue Block',
        description: 'Paced learning button that locks content below it until clicked.',
        preview: (
          <div className="p-2.5 bg-white rounded-lg border border-gray-100 flex justify-center">
            <div className="px-4 py-1 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: accentColor }}>
              Continue
            </div>
          </div>
        ),
      },
    ],

    code: [
      {
        subtype: 'code_snippet',
        name: 'Code Snippet',
        description: 'Syntax-highlighted code container with language picker & copy.',
        preview: (
          <div className="p-2.5 bg-slate-900 rounded-lg text-slate-400 font-mono text-[8px] space-y-1">
            <div className="h-1 bg-sky-400 rounded w-1/3" />
            <div className="h-1 bg-slate-700 rounded w-2/3" />
          </div>
        ),
      },
      {
        subtype: 'code_embed',
        name: 'Add Code (Sandbox)',
        description: 'Interactive HTML, CSS, and JS editor running inside a secure iframe.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-sky-600" />
            <div className="h-2 bg-gray-300 rounded flex-1" />
          </div>
        ),
      },
      {
        subtype: 'code_web_project',
        name: 'Upload Project (.zip)',
        description: 'Extract and host custom interactive web applications locally.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-indigo-600" />
            <div className="h-2 bg-gray-300 rounded flex-1" />
          </div>
        ),
      },
    ],

    interactive: [
      {
        subtype: 'accordion',
        name: 'Accordion',
        description: 'Collapsible panels with +/- icons and keep-open configuration.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 space-y-1">
            <div className="h-3 bg-gray-100 rounded flex items-center justify-between px-1">
              <div className="h-1.5 bg-gray-700 rounded w-1/2" />
            </div>
            <div className="h-3 bg-gray-100 rounded flex items-center justify-between px-1">
              <div className="h-1.5 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ),
      },
      {
        subtype: 'tabs',
        name: 'Tabs',
        description: 'Horizontal tab bar with active brand accent border and media.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 space-y-1">
            <div className="flex gap-1 border-b pb-1">
              <div className="h-1.5 w-6 rounded" style={{ backgroundColor: accentColor }} />
              <div className="h-1.5 w-6 bg-gray-200 rounded" />
            </div>
            <div className="h-3 bg-gray-50 rounded" />
          </div>
        ),
      },
      {
        subtype: 'labeled_graphic',
        name: 'Labeled Graphic',
        description: 'Click anywhere to drop interactive pulsing hotspot markers.',
        preview: (
          <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-center relative h-10">
            <div className="w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: accentColor }}>
              +
            </div>
          </div>
        ),
      },
      {
        subtype: 'process',
        name: 'Process Carousel',
        description: 'Step-by-step carousel card with step progress indicators and intro/summary.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <div className="h-2 rounded w-10 text-white text-[7px] text-center" style={{ backgroundColor: accentColor }}>Step 1</div>
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
        ),
      },
      {
        subtype: 'sorting_activity',
        name: 'Sorting Activity',
        description: 'Drag-and-drop card sort into categories with instant bounce/snap feedback.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 space-y-1">
            <div className="h-3 bg-gray-50 border border-gray-200 rounded w-2/3 mx-auto" />
            <div className="grid grid-cols-2 gap-1">
              <div className="h-2 bg-gray-200 rounded" />
              <div className="h-2 bg-gray-200 rounded" />
            </div>
          </div>
        ),
      },
      {
        subtype: 'flashcards',
        name: 'Flashcard Grid',
        description: 'Responsive grid of 3D flip cards with prompt and reveal answer.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 grid grid-cols-2 gap-1.5">
            <div className="h-8 bg-gray-50 border border-gray-200 rounded" />
            <div className="h-8 bg-gray-50 border border-gray-200 rounded" />
          </div>
        ),
      },
      {
        subtype: 'flashcard_stack',
        name: 'Flashcard Stack',
        description: 'Single centered flip card with step counter and next/prev controls.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col items-center">
            <div className="h-6 w-14 bg-gray-50 border border-gray-200 rounded mb-1" />
            <div className="h-1 bg-gray-300 rounded w-8" />
          </div>
        ),
      },
      {
        subtype: 'timeline',
        name: 'Timeline',
        description: 'Chronological milestone nodes along an accent-colored central line.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
            <div className="space-y-1 flex-1">
              <div className="h-1.5 bg-gray-800 rounded w-1/3" />
              <div className="h-1.5 bg-gray-300 rounded w-3/4" />
            </div>
          </div>
        ),
      },
      {
        subtype: 'button',
        name: 'Button',
        description: 'Single call-to-action button linking to lessons, external URLs, or email.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex justify-center">
            <div className="px-4 py-1 rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: accentColor }}>
              Take Action
            </div>
          </div>
        ),
      },
      {
        subtype: 'button_stack',
        name: 'Button Stack',
        description: 'Grouped stack of customizable action buttons with flexible alignment.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col items-center gap-1">
            <div className="px-3 py-0.5 rounded-full text-[7px] font-bold text-white w-2/3 text-center" style={{ backgroundColor: accentColor }}>
              Primary Action
            </div>
            <div className="px-3 py-0.5 rounded-full text-[7px] font-bold border border-gray-300 text-gray-700 w-2/3 text-center">
              Secondary Action
            </div>
          </div>
        ),
      },
      {
        subtype: 'scenario',
        name: 'Scenario (Branching)',
        description: 'Interactive branching character dialogue with facial expressions & feedback.',
        preview: (
          <div className="p-2 bg-slate-900 rounded-lg flex items-center gap-2 text-white">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[8px]">👤</div>
            <div className="space-y-0.5 flex-1">
              <div className="h-1.5 bg-white/60 rounded w-3/4" />
              <div className="h-1 bg-white/30 rounded w-1/2" />
            </div>
          </div>
        ),
      },
      {
        subtype: 'storyline',
        name: 'Storyline / Custom Canvas',
        description: '16:9 interactive slide canvas with triggers, layers, variables, and hotspots.',
        preview: (
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-between text-slate-300">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <div className="h-1.5 bg-slate-600 rounded w-1/2" />
            <div className="text-[7px] font-mono text-sky-400">Trigger</div>
          </div>
        ),
      },
      {
        subtype: 'simulation_lab',
        name: 'Simulation Lab (Tell–Show–Do)',
        description: 'Interactive parameter/slider lab and multi-turn KPI simulation inspired by The Deal Desk.',
        preview: (
          <div className="p-2 bg-slate-900 rounded-lg border border-amber-500/30 flex items-center justify-between text-amber-300">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <div className="text-[8px] font-mono font-bold">Deal Desk Lab</div>
            </div>
            <div className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">KPI</div>
          </div>
        ),
      },
    ],

    knowledge_check: [
      {
        subtype: 'multiple_choice',
        name: 'Multiple Choice',
        description: 'Single radio selection with instant explanation and retry button.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 space-y-1">
            <div className="h-2 bg-gray-800 rounded w-4/5" />
            <div className="h-2 bg-gray-100 rounded w-full border border-gray-200" />
            <div className="h-2 bg-gray-100 rounded w-full border border-gray-200" />
          </div>
        ),
      },
      {
        subtype: 'multiple_response',
        name: 'Multiple Response',
        description: 'Multi-select checkboxes where all correct choices are required to pass.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 space-y-1">
            <div className="h-2 bg-gray-800 rounded w-4/5" />
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border rounded" style={{ borderColor: accentColor }} />
              <div className="h-1.5 bg-gray-200 rounded flex-1" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border rounded" style={{ borderColor: accentColor }} />
              <div className="h-1.5 bg-gray-200 rounded flex-1" />
            </div>
          </div>
        ),
      },
      {
        subtype: 'fill_in_blank',
        name: 'Fill in the Blank',
        description: 'Sentence with inline underline input and acceptable synonyms array.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 space-y-1.5 text-center">
            <div className="h-1.5 bg-gray-400 rounded w-3/4 mx-auto" />
            <div className="h-2 border-b-2 w-12 mx-auto" style={{ borderColor: accentColor }} />
          </div>
        ),
      },
      {
        subtype: 'matching',
        name: 'Matching Activity',
        description: 'Two-column interlocking puzzle pairing with instant match validation.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 grid grid-cols-2 gap-1.5">
            <div className="h-3 rounded border text-[7px] text-center" style={{ borderColor: accentColor }}>Term</div>
            <div className="h-3 bg-gray-100 rounded text-[7px] text-center">Def</div>
          </div>
        ),
      },
    ],

    survey: [
      {
        subtype: 'survey_likert',
        name: 'Likert Scale',
        description: '5-point rating scale from Strongly Disagree to Strongly Agree.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex justify-between">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            ))}
          </div>
        ),
      },
      {
        subtype: 'survey_freeform',
        name: 'Freeform Response',
        description: 'Open-ended feedback prompt with multiline submission box.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 space-y-1">
            <div className="h-2 bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-100 border border-gray-200 rounded w-full" />
          </div>
        ),
      },
    ],

    chart: [
      {
        subtype: 'bar_chart',
        name: 'Bar Chart',
        description: 'Comparative data breakdown with custom categories and brand bars.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-end gap-1.5 h-8">
            <div className="w-3 bg-sky-500 rounded-t h-4" />
            <div className="w-3 rounded-t h-6" style={{ backgroundColor: accentColor }} />
            <div className="w-3 bg-emerald-500 rounded-t h-3" />
          </div>
        ),
      },
      {
        subtype: 'line_chart',
        name: 'Line Chart',
        description: 'Responsive SVG trend chart with gradient area fill under the curve.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
            <div className="w-full h-4 border-b border-l flex items-end">
              <div className="w-full h-3 border-t-2 rotate-6" style={{ borderColor: accentColor }} />
            </div>
          </div>
        ),
      },
      {
        subtype: 'pie_chart',
        name: 'Pie / Donut Chart',
        description: 'Circular percentage breakdown with interactive slice legend.',
        preview: (
          <div className="p-2 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-4" style={{ borderColor: accentColor }} />
          </div>
        ),
      },
    ],
  };

  const activeVariants =
    selectedCategory === 'block_templates' ? [] : variantsMap[selectedCategory] || [];

  const filteredVariants = search.trim()
    ? Object.values(variantsMap)
        .flat()
        .filter(
          (v) =>
            v.name.toLowerCase().includes(search.toLowerCase()) ||
            v.description.toLowerCase().includes(search.toLowerCase())
        )
    : activeVariants;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full border-r border-gray-200 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Block library</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Insert interactive, multimedia, and content blocks into your lesson canvas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all blocks and templates..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {/* Two-Column Drawer Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Categories List */}
          <div className="w-48 border-r border-gray-200 overflow-y-auto bg-gray-50/70 p-2 space-y-0.5 flex-shrink-0">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id && !search.trim();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? accentColor : '#6b7280' }}
                  />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Previews or Block Templates */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedCategory === 'block_templates' && !search.trim() ? (
              /* Block Templates View */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Saved Block Templates ({templates.length})
                  </div>
                  <button
                    type="button"
                    onClick={loadTemplates}
                    className="text-xs text-gray-500 hover:text-black flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {loadingTemplates ? (
                  <div className="text-center py-10 text-xs text-gray-400">Loading templates...</div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-gray-400 space-y-2">
                    <LayoutTemplate className="w-8 h-8 mx-auto text-gray-300" />
                    <div className="text-xs font-bold text-gray-700">No Block Templates Yet</div>
                    <p className="text-[11px] max-w-xs mx-auto">
                      Hover over any block in the lesson editor and click the bookmark icon to save it as a reusable template.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {templates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-4 transition-all duration-150 flex items-center justify-between group shadow-2xs hover:shadow-xs"
                      >
                        <div className="space-y-1 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900 group-hover:text-sky-600">
                              {tmpl.name}
                            </span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                              {tmpl.blocks.length} block{tmpl.blocks.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          {tmpl.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-1">{tmpl.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onInsertBlocks) {
                                onInsertBlocks(tmpl.blocks, insertIndex);
                              }
                              onClose();
                            }}
                            className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer hover:scale-102 transition-transform"
                            style={{ backgroundColor: accentColor }}
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Standard Block Category Previews */
              <>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {search.trim() ? `Search Results (${filteredVariants.length})` : `${selectedCategory} Variants`}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredVariants.map((variant) => (
                    <button
                      key={variant.subtype}
                      type="button"
                      onClick={() => {
                        let cat = selectedCategory;
                        if (search.trim()) {
                          for (const [k, vList] of Object.entries(variantsMap)) {
                            if (vList.some((v) => v.subtype === variant.subtype)) {
                              cat = k as BlockCategory;
                              break;
                            }
                          }
                        }
                        onSelectVariant(cat, variant.subtype, insertIndex);
                        onClose();
                      }}
                      className="bg-white border border-gray-200 hover:border-gray-400 hover:shadow-md rounded-xl p-3.5 text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="mb-3">{variant.preview}</div>
                      <div>
                        <div className="font-semibold text-xs text-gray-900 group-hover:text-sky-600 transition-colors">
                          {variant.name}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                          {variant.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop Click */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
