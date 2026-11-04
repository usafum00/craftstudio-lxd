'use client';

import React, { useState, useRef } from 'react';
import { Block } from '@/lib/types';
import { Camera, Sparkles, Upload, Image as ImageIcon } from 'lucide-react';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';

interface ImageBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function ImageBlock({ block, onChange, onUploadImage, accentColor = '#ff5722', isLearnerMode = false }: ImageBlockProps) {
  const { subtype, content, settings } = block;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  const url = (content.url as string) || '/thumbnails/social-engineering.svg';
  const caption = (content.caption as string) || 'Enter some text';
  const title = (content.title as string) || 'Identifying Social Engineering Risks';
  const text =
    (content.text as string) ||
    'High-risk scenarios frequently present themselves in routine business communications. Scrutinize unexpected sender details, links, and attachments before executing actions.';

  const imageWidth = settings?.imageWidth || '50'; // 25, 50, 75
  const imagePosition = settings?.imagePosition || 'left'; // left or right

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      const uploadedUrl = await onUploadImage(file);
      if (uploadedUrl) {
        onChange({ ...content, url: uploadedUrl });
      }
    }
  };

  const handleBlur = (field: string, val: string) => {
    onChange({
      ...content,
      [field]: val,
    });
  };

  const modalElement = (
    <UnifiedMediaModal
      isOpen={mediaModalOpen}
      onClose={() => setMediaModalOpen(false)}
      onSelect={(newUrl) => {
        onChange({ ...content, url: newUrl });
        setMediaModalOpen(false);
      }}
      currentUrl={url}
      initialTab="library"
      mediaType="image"
      accentColor={accentColor}
    />
  );

  if (subtype === 'image_centered') {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="relative group max-w-xl w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption} className="w-full h-auto object-cover max-h-[440px]" />

          {!isLearnerMode && (
            <button
              type="button"
              onClick={() => setMediaModalOpen(true)}
              className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Replace Image</span>
            </button>
          )}
        </div>

        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('caption', e.currentTarget.innerText)}
          className={`text-xs text-gray-500 italic mt-3 text-center rounded px-2 py-0.5 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          {caption}
        </div>

        {!isLearnerMode && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {modalElement}
          </>
        )}
      </div>
    );
  }

  if (subtype === 'image_text') {
    const widthPercentage = imageWidth === '25' ? 'md:w-1/4' : imageWidth === '75' ? 'md:w-3/4' : 'md:w-1/2';
    const textPercentage = imageWidth === '25' ? 'md:w-3/4' : imageWidth === '75' ? 'md:w-1/4' : 'md:w-1/2';

    return (
      <div className={`w-full flex flex-col md:flex-row gap-6 sm:gap-8 items-center ${imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}>
        <div className={`w-full ${widthPercentage} relative group rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption} className="w-full h-auto object-cover max-h-[360px]" />

          {!isLearnerMode && (
            <button
              type="button"
              onClick={() => setMediaModalOpen(true)}
              className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>
          )}
        </div>

        <div className={`w-full ${textPercentage} space-y-3`}>
          <h3
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur('title', e.currentTarget.innerText)}
            className={`text-lg sm:text-xl font-bold text-gray-900 tracking-tight rounded p-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {title}
          </h3>
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur('text', e.currentTarget.innerText)}
            className={`text-xs sm:text-sm text-gray-700 leading-relaxed rounded p-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {text}
          </div>
        </div>

        {!isLearnerMode && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {modalElement}
          </>
        )}
      </div>
    );
  }

  if (subtype === 'text_on_image') {
    return (
      <div className="w-full relative group rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[360px] flex items-center justify-center p-8 sm:p-12 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

        <div className="relative z-10 max-w-xl text-white space-y-3">
          <h2
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur('title', e.currentTarget.innerText)}
            className={`text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm rounded p-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-white/50'
            }`}
          >
            {title}
          </h2>
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur('text', e.currentTarget.innerText)}
            className={`text-xs sm:text-sm text-white/90 leading-relaxed drop-shadow-sm rounded p-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-white/50'
            }`}
          >
            {text}
          </div>
        </div>

        {!isLearnerMode && (
          <button
            type="button"
            onClick={() => setMediaModalOpen(true)}
            className="absolute top-3 right-3 z-20 bg-black/75 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Replace Image</span>
          </button>
        )}

        {!isLearnerMode && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {modalElement}
          </>
        )}
      </div>
    );
  }

  // Default: image_full_width (like the banner image with caption underneath)
  return (
    <div className="w-full">
      <div className="relative group rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
        <div className="aspect-[21/9] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption} className="w-full h-full object-cover" />
        </div>

        {!isLearnerMode && (
          <button
            type="button"
            onClick={() => setMediaModalOpen(true)}
            className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Replace Image</span>
          </button>
        )}
      </div>

      <div
        contentEditable={!isLearnerMode}
        suppressContentEditableWarning
        onBlur={(e) => handleBlur('caption', e.currentTarget.innerText)}
        className={`text-xs text-gray-500 italic mt-3 text-center rounded px-2 py-0.5 ${
          isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
        }`}
      >
        {caption}
      </div>

      {!isLearnerMode && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          {modalElement}
        </>
      )}
    </div>
  );
}
