'use client';

import React from 'react';
import { Block } from '@/lib/types';
import { isBlockDark } from '@/lib/contrast';
import { Quote as QuoteIcon, Camera } from 'lucide-react';

interface QuoteBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  onUploadImage?: (file: File) => Promise<string | null>;
  isLearnerMode?: boolean;
}

export function QuoteBlock({ block, onChange, accentColor = '#ff5722', onUploadImage, isLearnerMode = false }: QuoteBlockProps) {
  const { subtype, content } = block;
  const isDark = isBlockDark(block.settings);

  const quoteColor = isDark ? 'text-white' : 'text-gray-800';
  const authorColor = isDark ? 'text-white' : 'text-gray-900';
  const roleColor = isDark ? 'text-zinc-300' : 'text-gray-500';

  const handleBlur = (field: string, text: string) => {
    onChange({
      ...content,
      [field]: text,
    });
  };

  const quoteText =
    (content.quote as string) ||
    'The weakest link in any computer system is the person sitting in front of the keyboard.';
  const author = (content.author as string) || 'Kevin Mitnick';
  const role = (content.role as string) || 'Renowned Cybersecurity Consultant & Author';
  const avatar = (content.avatar as string) || '/thumbnails/social-engineering.svg';
  const bgImage = (content.bgImage as string) || '/thumbnails/conflict-resolution.svg';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      const url = await onUploadImage(file);
      if (url) {
        onChange({ ...content, bgImage: url });
      }
    }
  };

  if (subtype === 'quote_b') {
    // Quote B: Quote with circular avatar next to author and role
    return (
      <div className="w-full flex items-start gap-4 sm:gap-6 py-2">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 border-2 border-white shadow-sm ring-1 ring-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={author} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <blockquote
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('quote', e.currentTarget.innerText)}
            className={`text-base sm:text-lg font-medium ${quoteColor} italic leading-relaxed rounded p-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            &ldquo;{quoteText}&rdquo;
          </blockquote>
          <div className="mt-2 pl-1">
            <span
              contentEditable={!isLearnerMode}
              suppressContentEditableWarning
              onBlur={(e) => !isLearnerMode && handleBlur('author', e.currentTarget.innerText)}
              className={`text-xs sm:text-sm font-bold ${authorColor} rounded ${
                isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
              }`}
            >
              {author}
            </span>
            <span className="text-gray-400 mx-1.5">•</span>
            <span
              contentEditable={!isLearnerMode}
              suppressContentEditableWarning
              onBlur={(e) => !isLearnerMode && handleBlur('role', e.currentTarget.innerText)}
              className={`text-xs ${roleColor} rounded ${
                isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
              }`}
            >
              {role}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (subtype === 'quote_c') {
    // Quote C: Minimalist quote with subtle left vertical accent line
    return (
      <div
        className="w-full pl-5 sm:pl-6 py-2 border-l-4 transition-colors"
        style={{ borderColor: accentColor }}
      >
        <blockquote
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('quote', e.currentTarget.innerText)}
          className={`text-base sm:text-lg ${quoteColor} leading-relaxed font-normal rounded p-1 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          &ldquo;{quoteText}&rdquo;
        </blockquote>
        <div className="mt-2 pl-1">
          <span
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('author', e.currentTarget.innerText)}
            className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-gray-600'} rounded ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {author}
          </span>
        </div>
      </div>
    );
  }

  if (subtype === 'quote_d') {
    // Quote D: Large display serif quote with centered author citation
    return (
      <div className="w-full text-center py-6 px-4">
        <QuoteIcon className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-white/40' : 'text-gray-300'}`} />
        <blockquote
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('quote', e.currentTarget.innerText)}
          className={`font-serif text-xl sm:text-3xl font-normal ${quoteColor} leading-snug max-w-2xl mx-auto italic rounded px-2 py-1 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          &ldquo;{quoteText}&rdquo;
        </blockquote>
        <div className="mt-4">
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('author', e.currentTarget.innerText)}
            className={`text-xs sm:text-sm font-bold ${authorColor} uppercase tracking-widest rounded inline-block ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {author}
          </div>
        </div>
      </div>
    );
  }

  if (subtype === 'quote_on_image') {
    // Quote on Image: full-width background image with dark overlay and quote text + author
    return (
      <div className="w-full rounded-2xl overflow-hidden relative group min-h-[280px] sm:min-h-[320px] flex items-center justify-center text-center p-8 sm:p-12">
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgImage}
          alt={author}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

        {/* Content */}
        <div className="relative z-10 max-w-2xl text-white">
          <blockquote
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('quote', e.currentTarget.innerText)}
            className={`font-serif text-lg sm:text-2xl font-normal italic leading-relaxed text-white drop-shadow-sm rounded p-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-white/50'
            }`}
          >
            &ldquo;{quoteText}&rdquo;
          </blockquote>
          <div className="mt-4">
            <span
              contentEditable={!isLearnerMode}
              suppressContentEditableWarning
              onBlur={(e) => !isLearnerMode && handleBlur('author', e.currentTarget.innerText)}
              className={`text-xs sm:text-sm font-bold tracking-widest uppercase text-white/90 rounded ${
                isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-white/50'
              }`}
            >
              {author}
            </span>
          </div>
        </div>

        {/* Change Background Image Hover Button (Author mode only) */}
        {!isLearnerMode && (
          <label className="absolute bottom-3 right-3 z-20 bg-black/70 hover:bg-black text-white text-[10px] font-semibold px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-3 h-3" />
            <span>Change Background</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        )}
      </div>
    );
  }

  // Quote A: Standard quote with quotation mark icon and author
  return (
    <div className="w-full py-4 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : `${accentColor}18`,
          color: isDark ? '#ffffff' : accentColor,
        }}
      >
        <QuoteIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <blockquote
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('quote', e.currentTarget.innerText)}
          className={`text-base sm:text-lg font-medium ${quoteColor} italic leading-relaxed rounded p-1 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          &ldquo;{quoteText}&rdquo;
        </blockquote>
        <div className="mt-2 pl-1">
          <span
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('author', e.currentTarget.innerText)}
            className={`text-xs sm:text-sm font-bold ${authorColor} rounded ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {author}
          </span>
        </div>
      </div>
    </div>
  );
}
