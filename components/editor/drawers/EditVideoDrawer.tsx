'use client';

import React, { useState, useRef } from 'react';
import { Block } from '@/lib/types';
import {
  X,
  RotateCw,
  Image as ImageIcon,
  Subtitles,
  MoreHorizontal,
  ChevronDown,
  Upload,
  Link,
  Sparkles,
  Download,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';
import { parseEmbedUrl } from '@/lib/embedParser';

interface EditVideoDrawerProps {
  isOpen: boolean;
  block: Block | null;
  onClose: () => void;
  onUpdateContent: (newContent: Record<string, unknown>) => void;
  accentColor?: string;
}

export function EditVideoDrawer({
  isOpen,
  block,
  onClose,
  onUpdateContent,
  accentColor = '#ff5722',
}: EditVideoDrawerProps) {
  const [replaceMenuOpen, setReplaceMenuOpen] = useState(false);
  const [thumbMenuOpen, setThumbMenuOpen] = useState(false);
  const [captionMenuOpen, setCaptionMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaModalTab, setMediaModalTab] = useState<'upload' | 'library' | 'flow'>('library');
  const [mediaModalType, setMediaModalType] = useState<'video' | 'image'>('video');

  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);
  const captionsFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !block) return null;

  const content = block.content || {};
  const defaultVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  const defaultPosterUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80';

  const videoUrl = (content.videoUrl as string) || defaultVideoUrl;
  const posterUrl = (content.posterUrl as string) || defaultPosterUrl;
  const filename = (content.filename as string) || 'Coastline.mp4';
  const caption = (content.caption as string) || '';
  const captionsUrl = (content.captionsUrl as string) || '';

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onUpdateContent({
            ...content,
            videoUrl: data.url,
            filename: file.name,
          });
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || `Video upload failed (${res.status})`);
      }
    } catch (err) {
      console.error('Failed to upload video', err);
      alert(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setReplaceMenuOpen(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onUpdateContent({
            ...content,
            posterUrl: data.url,
          });
        }
      }
    } catch (err) {
      console.error('Failed to upload thumbnail', err);
    } finally {
      setThumbMenuOpen(false);
    }
  };

  const handleCaptionsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onUpdateContent({
            ...content,
            captionsUrl: data.url,
          });
        }
      }
    } catch (err) {
      console.error('Failed to upload captions', err);
    } finally {
      setCaptionMenuOpen(false);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    const parsed = parseEmbedUrl(customUrl.trim());
    const finalUrl = parsed.embedUrl || customUrl.trim();
    const name =
      parsed.type === 'youtube'
        ? 'YouTube Video'
        : parsed.type === 'vimeo'
        ? 'Vimeo Video'
        : customUrl.split('/').pop() || 'Video.mp4';

    onUpdateContent({
      ...content,
      videoUrl: finalUrl,
      filename: name,
    });
    setUrlInputOpen(false);
    setCustomUrl('');
    setReplaceMenuOpen(false);
  };

  const handleCaptureFrame = () => {
    // Generate an instant snapshot of the video frame
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.currentTime = 1.0;
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateContent({
            ...content,
            posterUrl: dataUrl,
          });
        } catch {
          // If crossOrigin blocked, fallback
        }
      }
    };
    setThumbMenuOpen(false);
  };

  const subtype = block.subtype || 'video';
  const getTitle = () => {
    if (subtype === 'audio') return 'Edit Audio';
    if (subtype === 'embed') return 'Edit Web Embed';
    if (subtype === 'attachment') return 'Edit Attachment';
    return 'Edit Video';
  };

  return (
    <div className="fixed inset-y-0 left-0 w-84 sm:w-96 bg-white border-r border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200 select-none">
      {/* Header matching Screenshot 3 */}
      <div className="h-14 px-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900 tracking-tight">{getTitle()}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          title="Close editor drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="p-5 space-y-6 flex-1 overflow-y-auto">
        {subtype === 'audio' ? (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Audio File & Track
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Audio Stream URL
              </label>
              <input
                type="url"
                value={(content.audioUrl as string) || ''}
                onChange={(e) => onUpdateContent({ ...content, audioUrl: e.target.value })}
                placeholder="https://example.com/audio.mp3"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Audio File</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.aac,.ogg,.m4a"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.url) onUpdateContent({ ...content, audioUrl: data.url });
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Audio Transcript & Notes
              </label>
              <textarea
                rows={5}
                value={(content.transcript as string) || ''}
                onChange={(e) => onUpdateContent({ ...content, transcript: e.target.value })}
                placeholder="Paste the audio transcript for learner accessibility..."
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>
          </div>
        ) : subtype === 'embed' ? (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Web Embed & Iframe
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Embed URL, YouTube, Vimeo, or iframe code
              </label>
              <textarea
                rows={4}
                value={(content.embedUrl as string) || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const parsed = parseEmbedUrl(val);
                  onUpdateContent({ ...content, embedUrl: parsed.embedUrl || val });
                }}
                placeholder="Paste YouTube (https://youtube.com/watch?v=...), Vimeo, or <iframe src='...'>"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400 font-mono resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Caption
              </label>
              <input
                type="text"
                value={(content.caption as string) || ''}
                onChange={(e) => onUpdateContent({ ...content, caption: e.target.value })}
                placeholder="Add an embed description"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        ) : subtype === 'attachment' ? (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Downloadable File Attachment
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                File Display Name
              </label>
              <input
                type="text"
                value={
                  (content.attachment as { name?: string })?.name ||
                  (content.filename as string) ||
                  'Social_Engineering_Defensive_Checklist.pdf'
                }
                onChange={(e) => {
                  const att = (content.attachment as Record<string, unknown>) || {};
                  onUpdateContent({
                    ...content,
                    attachment: { ...att, name: e.target.value },
                    filename: e.target.value,
                  });
                }}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                File Download URL
              </label>
              <input
                type="text"
                value={(content.attachment as { url?: string })?.url || (content.url as string) || ''}
                onChange={(e) => {
                  const att = (content.attachment as Record<string, unknown>) || {};
                  onUpdateContent({
                    ...content,
                    attachment: { ...att, url: e.target.value },
                    url: e.target.value,
                  });
                }}
                placeholder="https://example.com/document.pdf"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="pt-2">
              <label className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Attachment File</span>
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.url) {
                        onUpdateContent({
                          ...content,
                          attachment: {
                            name: file.name,
                            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                            url: data.url,
                          },
                        });
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Video
            </div>

          {/* Video Preview & Actions Card matching Screenshot 3 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {/* 16:9 Mini Preview Thumbnail */}
              <div className="w-24 aspect-video rounded-md overflow-hidden bg-black border border-slate-200 flex-shrink-0 shadow-2xs relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterUrl} alt={filename} className="w-full h-full object-cover" />
              </div>

              {/* Filename */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="font-bold text-xs text-gray-900 truncate" title={filename}>
                  {filename}
                </div>
              </div>
            </div>

            {/* Row of 4 Pill Action Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              {/* 1. Replace ▾ */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setReplaceMenuOpen(!replaceMenuOpen);
                    setThumbMenuOpen(false);
                    setCaptionMenuOpen(false);
                    setMoreMenuOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCw className="w-3 h-3 text-gray-500" />
                  <span>Replace</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {replaceMenuOpen && (
                  <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-left">
                    <button
                      type="button"
                      onClick={() => videoFileInputRef.current?.click()}
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-400" />
                      <span>Upload video file</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInputOpen(true);
                        setReplaceMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Link className="w-3.5 h-3.5 text-gray-400" />
                      <span>Paste video URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaModalType('video');
                        setMediaModalTab('library');
                        setMediaModalOpen(true);
                        setReplaceMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                      <span>Media Studio / Flow</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Thumbnail */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setThumbMenuOpen(!thumbMenuOpen);
                    setReplaceMenuOpen(false);
                    setCaptionMenuOpen(false);
                    setMoreMenuOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <ImageIcon className="w-3 h-3 text-gray-500" />
                  <span>Thumbnail</span>
                </button>

                {thumbMenuOpen && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-left">
                    <button
                      type="button"
                      onClick={() => thumbFileInputRef.current?.click()}
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-400" />
                      <span>Upload custom image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCaptureFrame}
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-gray-400" />
                      <span>Capture video frame</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateContent({ ...content, posterUrl: defaultPosterUrl });
                        setThumbMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                      <span>Reset to coastline</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Captions */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCaptionMenuOpen(!captionMenuOpen);
                    setReplaceMenuOpen(false);
                    setThumbMenuOpen(false);
                    setMoreMenuOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <Subtitles className="w-3 h-3 text-gray-500" />
                  <span>Captions</span>
                </button>

                {captionMenuOpen && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-left">
                    <button
                      type="button"
                      onClick={() => captionsFileInputRef.current?.click()}
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-400" />
                      <span>Upload .vtt file</span>
                    </button>
                    {captionsUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateContent({ ...content, captionsUrl: '' });
                          setCaptionMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove captions</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 4. More (...) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(!moreMenuOpen);
                    setReplaceMenuOpen(false);
                    setThumbMenuOpen(false);
                    setCaptionMenuOpen(false);
                  }}
                  className="p-1.5 text-gray-500 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 flex items-center transition-colors cursor-pointer shadow-2xs"
                  title="More video options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {moreMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-left">
                    <a
                      href={videoUrl}
                      download={filename}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                      <span>Download video</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateContent({
                          ...content,
                          videoUrl: defaultVideoUrl,
                          posterUrl: defaultPosterUrl,
                          filename: 'Coastline.mp4',
                        });
                        setMoreMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                      <span>Reset to default</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* URL Input Box */}
            {urlInputOpen && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-[11px] font-semibold text-gray-700">Video MP4/WebM URL</div>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-gray-800 focus:outline-none focus:border-slate-400"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUrlInputOpen(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="text-xs bg-black text-white px-3 py-1 rounded-md font-semibold hover:bg-gray-800"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* "Add a caption" Input synced directly with Canvas */}
            <div className="pt-2">
              <input
                type="text"
                value={caption}
                onChange={(e) => onUpdateContent({ ...content, caption: e.target.value })}
                placeholder="Add a caption"
                className="w-full text-xs text-gray-700 border-b border-slate-200 py-1.5 focus:outline-none focus:border-slate-400 bg-transparent placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*,.mp4,.webm,.mov,.m4v"
        onChange={handleVideoUpload}
        className="hidden"
      />
      <input
        ref={thumbFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleThumbnailUpload}
        className="hidden"
      />
      <input
        ref={captionsFileInputRef}
        type="file"
        accept=".vtt,.srt"
        onChange={handleCaptionsUpload}
        className="hidden"
      />

      {/* Unified Media Modal for Flow & Media Library selection */}
      <UnifiedMediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(selectedUrl) => {
          if (mediaModalType === 'video') {
            onUpdateContent({
              ...content,
              videoUrl: selectedUrl,
              filename: selectedUrl.split('/').pop() || 'Video.mp4',
            });
          } else {
            onUpdateContent({
              ...content,
              posterUrl: selectedUrl,
            });
          }
          setMediaModalOpen(false);
        }}
        initialTab={mediaModalTab}
        mediaType={mediaModalType}
        accentColor={accentColor}
      />
    </div>
  );
}
