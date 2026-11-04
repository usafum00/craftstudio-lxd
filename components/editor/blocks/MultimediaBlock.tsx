'use client';

import React, { useState, useRef } from 'react';
import { Block } from '@/lib/types';
import {
  Play,
  Pause,
  Volume2,
  FileText,
  Download,
  Film,
  Music,
  Globe,
  Upload,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';
import { VideoBlock } from './VideoBlock';
import { parseEmbedUrl } from '@/lib/embedParser';

interface MultimediaBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  onUploadMedia?: (file: File) => Promise<string | null>;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function MultimediaBlock({ block, onChange, onUploadMedia, accentColor = '#ff5722', isLearnerMode = false }: MultimediaBlockProps) {
  const { subtype, content } = block;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const videoUrl = (content.videoUrl as string) || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  const audioUrl = (content.audioUrl as string) || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const embedUrl = (content.embedUrl as string) || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  const attachment = (content.attachment as { name: string; size: string; url: string }) || {
    name: 'Social_Engineering_Defensive_Checklist_2026.pdf',
    size: '1.4 MB',
    url: '#',
  };
  const transcript =
    (content.transcript as string) ||
    'Transcript: In this audio overview, our chief information security officer outlines the fundamental principles of social engineering evasion in everyday office settings...';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadMedia) {
      const url = await onUploadMedia(file);
      if (url) {
        if (subtype === 'video') onChange({ ...content, videoUrl: url });
        else if (subtype === 'audio') onChange({ ...content, audioUrl: url });
        else if (subtype === 'attachment') {
          onChange({
            ...content,
            attachment: {
              name: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              url,
            },
          });
        }
      }
    }
  };

  const handleMediaModalSelect = (url: string) => {
    if (subtype === 'video') {
      onChange({ ...content, videoUrl: url });
    } else if (subtype === 'audio') {
      onChange({ ...content, audioUrl: url });
    } else if (subtype === 'attachment') {
      onChange({
        ...content,
        attachment: {
          name: url.split('/').pop() || 'Downloaded_Resource.file',
          size: 'Uploaded',
          url,
        },
      });
    }
    setMediaModalOpen(false);
  };

  if (subtype === 'video') {
    return (
      <VideoBlock
        block={block}
        onChange={onChange}
        accentColor={accentColor}
        isLearnerMode={isLearnerMode}
      />
    );
  }

  if (subtype === 'audio') {
    return (
      <div className="w-full space-y-3">
        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-105 transition-all flex-shrink-0 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-800 mb-1.5">
                <span className="truncate">Audio Briefing: Threat Landscape Overview</span>
                <span className="text-gray-400 font-normal text-[11px]">02:45</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: isPlaying ? '45%' : '0%', backgroundColor: accentColor }}
                />
              </div>
            </div>

            {!isLearnerMode && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(true)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Choose from Media Studio"
                >
                  <Sparkles className="w-4 h-4 text-[#ff5722]" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Upload Audio File"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Transcript Toggle */}
          <div className="border-t border-gray-100 pt-2 flex flex-col">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 w-fit py-1 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showTranscript ? 'Hide Audio Transcript' : 'View Audio Transcript'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
            </button>

            {showTranscript && (
              <div
                contentEditable={!isLearnerMode}
                suppressContentEditableWarning
                onBlur={(e) => !isLearnerMode && onChange({ ...content, transcript: e.currentTarget.innerText })}
                className="mt-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed border border-gray-200 outline-none focus:ring-1 focus:ring-sky-500/50"
              >
                {transcript}
              </div>
            )}
          </div>
        </div>

        {!isLearnerMode && (
          <>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

            <UnifiedMediaModal
              isOpen={mediaModalOpen}
              onClose={() => setMediaModalOpen(false)}
              onSelect={handleMediaModalSelect}
              currentUrl={audioUrl}
              initialTab="library"
              mediaType="audio"
              accentColor={accentColor}
            />
          </>
        )}
      </div>
    );
  }

  if (subtype === 'embed') {
    const parsed = parseEmbedUrl(embedUrl);
    const resolvedEmbedUrl = parsed.embedUrl || embedUrl;
    const caption = (content.caption as string) || '';

    return (
      <div className="w-full space-y-3">
        <div className="relative group rounded-2xl overflow-hidden aspect-video bg-gray-900 shadow-md">
          {resolvedEmbedUrl ? (
            <iframe
              src={resolvedEmbedUrl}
              title={caption || 'Embedded Web Content'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400 bg-zinc-950">
              <Globe className="w-10 h-10 text-zinc-600 mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No embed URL configured</p>
              <p className="text-xs text-zinc-500 mt-1">Paste a YouTube, Vimeo, or iframe link in the block settings</p>
            </div>
          )}
        </div>

        {/* Caption */}
        {!isLearnerMode ? (
          <div className="text-center">
            <input
              type="text"
              value={caption}
              onChange={(e) => onChange({ ...content, caption: e.target.value })}
              placeholder="Add an embed description or source caption"
              className="w-full text-center text-xs py-1 border-b border-zinc-200 text-zinc-600 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none bg-transparent"
            />
          </div>
        ) : (
          caption && (
            <p className="text-center text-xs italic text-zinc-500 pt-0.5">
              {caption}
            </p>
          )
        )}
      </div>
    );
  }

  // Default: attachment
  return (
    <div className="w-full">
      <div className="border border-gray-200 bg-white hover:border-gray-300 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-2xs transition-all group">
        <div className="flex items-center gap-3.5 min-w-0 pr-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs"
            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div
              contentEditable={!isLearnerMode}
              suppressContentEditableWarning
              onBlur={(e) =>
                !isLearnerMode &&
                onChange({
                  ...content,
                  attachment: { ...attachment, name: e.currentTarget.innerText },
                })
              }
              className="text-xs sm:text-sm font-bold text-gray-900 truncate outline-none focus:ring-1 focus:ring-sky-500/50 rounded p-0.5"
            >
              {attachment.name}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">{attachment.size} • Downloadable Attachment</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isLearnerMode && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Replace File</span>
            </button>
          )}

          <a
            href={attachment.url}
            download={attachment.name}
            className="p-2 rounded-full text-white shadow-xs hover:scale-105 transition-transform"
            style={{ backgroundColor: accentColor }}
            title="Download attachment"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
    </div>
  );
}
