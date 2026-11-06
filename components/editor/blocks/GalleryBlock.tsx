'use client';

import React, { useState } from 'react';
import { Block } from '@/lib/types';
import { isBlockDark } from '@/lib/contrast';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Plus,
  Trash2,
  Camera,
  Upload,
  ZoomIn,
} from 'lucide-react';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';

interface GalleryBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function GalleryBlock({
  block,
  onChange,
  onUploadImage,
  accentColor = '#4F46E5',
  isLearnerMode = false,
}: GalleryBlockProps) {
  const { subtype, content, settings = {} } = block;
  const isDark = isBlockDark(settings);

  const images: Array<{ url: string; caption: string }> = (content.images as Array<{
    url: string;
    caption: string;
  }>) || [
    { url: '/thumbnails/social-engineering.svg', caption: 'Attack Vector 1: Email Phishing Simulation' },
    { url: '/thumbnails/conflict-resolution.svg', caption: 'Attack Vector 2: Credential Harvest Site' },
    { url: '/thumbnails/ask-boss.svg', caption: 'Attack Vector 3: Vishing & Helpdesk Lure' },
    { url: '/thumbnails/performance-management.svg', caption: 'Attack Vector 4: Physical Tailgating' },
  ];

  // Carousel & Modal state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [targetImageIndex, setTargetImageIndex] = useState<number | null>(null);

  const handleUpdateCaption = (index: number, caption: string) => {
    const updated = images.map((img, i) => (i === index ? { ...img, caption } : img));
    onChange({ ...content, images: updated });
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      const url = await onUploadImage(file);
      if (url) {
        onChange({
          ...content,
          images: [...images, { url, caption: 'New image caption' }],
        });
      }
    }
  };

  const handleDeleteImage = (index: number) => {
    if (images.length <= 1) return;
    const updated = images.filter((_, i) => i !== index);
    onChange({ ...content, images: updated });
    if (currentSlide >= updated.length) {
      setCurrentSlide(Math.max(0, updated.length - 1));
    }
  };

  const openMediaModalForIndex = (index: number | null) => {
    setTargetImageIndex(index);
    setMediaModalOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (targetImageIndex !== null && targetImageIndex >= 0 && targetImageIndex < images.length) {
      const updated = images.map((img, i) => (i === targetImageIndex ? { ...img, url } : img));
      onChange({ ...content, images: updated });
    } else {
      onChange({
        ...content,
        images: [...images, { url, caption: 'New image caption' }],
      });
      setCurrentSlide(images.length);
    }
    setMediaModalOpen(false);
  };

  // Grid Subtypes: 2-col, 3-col, 4-col
  const gridColsClass =
    subtype === 'gallery_2col'
      ? 'grid-cols-1 md:grid-cols-2'
      : subtype === 'gallery_3col'
      ? 'grid-cols-1 md:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-3 space-y-4 select-none">
      {/* 1. CAROUSEL SUBTYPE */}
      {subtype === 'image_carousel' ? (
        <div className="w-full space-y-3">
          <div className="relative group rounded-3xl overflow-hidden bg-zinc-950 aspect-[16/9] shadow-md border border-zinc-200/80 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[currentSlide]?.url || images[0]?.url}
              alt={images[currentSlide]?.caption}
              className="w-full h-full object-cover transition-all duration-300 cursor-zoom-in"
              onClick={() => setLightboxImage(images[currentSlide] || images[0])}
            />

            {/* Action buttons on top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {!isLearnerMode && (
                <button
                  type="button"
                  onClick={() => openMediaModalForIndex(currentSlide)}
                  className="bg-black/75 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
              )}

              {/* Lightbox Trigger */}
              <button
                type="button"
                onClick={() => setLightboxImage(images[currentSlide] || images[0])}
                className="bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="View full screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Prev / Next Arrows */}
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-lg transition-all hover:scale-110 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-lg transition-all hover:scale-110 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slide Indicator Badge */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[11px] font-semibold px-3.5 py-1 rounded-full backdrop-blur-xs">
              {currentSlide + 1} / {images.length}
            </div>
          </div>

          {/* Caption */}
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleUpdateCaption(currentSlide, e.currentTarget.innerText)}
            className={`text-xs ${isDark ? 'text-zinc-300' : 'text-gray-500'} italic text-center rounded py-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-indigo-500/50'
            }`}
          >
            {images[currentSlide]?.caption}
          </div>
        </div>
      ) : (
        /* 2. GRID SUBTYPES: 2-col, 3-col, 4-col with Wide Container & Zoom */
        <div className={`grid ${gridColsClass} gap-4 sm:gap-6`}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div
                className="aspect-[4/3] w-full overflow-hidden relative cursor-zoom-in bg-zinc-100"
                onClick={() => setLightboxImage(img)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Lightbox Zoom Icon Pill */}
                <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <ZoomIn className="w-3 h-3" />
                    <span>Zoom</span>
                  </span>
                </div>

                {/* Edit / Remove buttons for author */}
                {!isLearnerMode && (
                  <div
                    className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openMediaModalForIndex(idx)}
                      className="p-1.5 bg-black/75 hover:bg-black text-white rounded-full cursor-pointer shadow-sm transition-transform hover:scale-110"
                      title="Replace image"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    {images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(idx)}
                        className="p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-transform hover:scale-110 cursor-pointer shadow-sm"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Caption */}
              <div
                contentEditable={!isLearnerMode}
                suppressContentEditableWarning
                onBlur={(e) => !isLearnerMode && handleUpdateCaption(idx, e.currentTarget.innerText)}
                className={`p-3 text-[11px] text-gray-600 italic bg-white border-t border-zinc-100 ${
                  isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-indigo-500/50'
                }`}
              >
                {img.caption}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Author Action Bar */}
      {!isLearnerMode && (
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => openMediaModalForIndex(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-indigo-600 px-3.5 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Media from Library</span>
          </button>

          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
            <input type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
          </label>
        </div>
      )}

      {/* Universal Lightbox Modal for All Gallery Types */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out animate-in fade-in duration-150"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white p-2.5 rounded-full hover:bg-white/20 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center max-w-5xl max-h-[90vh] space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption || 'Enlarged preview'}
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl"
            />
            {lightboxImage.caption && (
              <p className="text-xs text-zinc-300 text-center max-w-xl font-medium pt-1">
                {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Unified Media Modal */}
      {!isLearnerMode && (
        <UnifiedMediaModal
          isOpen={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          onSelect={handleMediaSelect}
          currentUrl={targetImageIndex !== null ? images[targetImageIndex]?.url : undefined}
          initialTab="library"
          mediaType="image"
          accentColor={accentColor}
        />
      )}
    </div>
  );
}
