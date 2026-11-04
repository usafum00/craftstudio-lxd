'use client';

import React, { useState, useRef } from 'react';
import { Block, BlockSettings } from '@/lib/types';
import { Play, Subtitles, Upload, Link as LinkIcon, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseEmbedUrl } from '@/lib/embedParser';

interface VideoBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  onUpdateSettings?: (updatedSettings: BlockSettings) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
  onComplete?: () => void;
}

export function VideoBlock({
  block,
  onChange,
  accentColor = '#4F46E5',
  isLearnerMode = false,
  onComplete,
}: VideoBlockProps) {
  const { content, settings = {} } = block;

  const defaultVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  const defaultPosterUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80';

  const rawVideoUrl = (content.videoUrl as string) || (content.url as string) || defaultVideoUrl;
  const posterUrl = (content.posterUrl as string) || defaultPosterUrl;
  const caption = (content.caption as string) || '';
  const captionsUrl = (content.captionsUrl as string) || '';

  // Parse embed vs direct video
  const parsed = parseEmbedUrl(rawVideoUrl);
  const isEmbed = parsed.type === 'youtube' || parsed.type === 'vimeo' || parsed.type === 'generic_iframe';
  const embedUrl = parsed.embedUrl;
  const videoUrl = isEmbed ? rawVideoUrl : parsed.embedUrl || rawVideoUrl;

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [maxTimeWatched, setMaxTimeWatched] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authoring upload / paste state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; loadedMb: string; totalMb: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const allowForwardSeeking = settings.allowForwardSeeking !== false;
  const borderRadius = typeof settings.borderRadius === 'number' ? settings.borderRadius : 16;
  const widthMode = (settings.contentWidth || settings.width || 'M') as 'S' | 'M' | 'L';

  const widthClass =
    widthMode === 'S'
      ? 'max-w-xl mx-auto'
      : widthMode === 'L'
      ? 'max-w-6xl mx-auto w-full'
      : 'max-w-4xl mx-auto';

  const bgType = settings.backgroundColor || 'light';
  const isDarkBg = bgType === 'dark' || bgType === 'black' || bgType === 'theme';

  const handlePlayClick = () => {
    setIsPlaying(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 50);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;

    if (!allowForwardSeeking && current > maxTimeWatched) {
      setMaxTimeWatched(current);
    }

    if (
      !isCompleted &&
      videoRef.current.duration &&
      current >= videoRef.current.duration - 0.5
    ) {
      setIsCompleted(true);
      if (onComplete) onComplete();
    }
  };

  const handleSeeking = () => {
    if (allowForwardSeeking || !videoRef.current) return;
    if (videoRef.current.currentTime > maxTimeWatched + 0.5) {
      videoRef.current.currentTime = maxTimeWatched;
    }
  };

  const handleEnded = () => {
    setIsCompleted(true);
    if (onComplete) onComplete();
  };

  // Video File Upload handler with real progress and streaming support
  const processFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(null);
      setUploadError(null);

      const totalMb = (file.size / (1024 * 1024)).toFixed(1);

      const data = await new Promise<{ url: string; filename: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1);
            setUploadProgress({ percent, loadedMb, totalMb });
          }
        };

        xhr.onload = () => {
          try {
            const response = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300 && response.url) {
              resolve(response);
            } else {
              reject(new Error(response.error || `Upload failed (HTTP ${xhr.status})`));
            }
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during video upload. Please check your connection.'));
        };

        const fd = new FormData();
        fd.append('file', file);
        xhr.send(fd);
      });

      if (data.url) {
        onChange({
          ...content,
          videoUrl: data.url,
          filename: file.name,
        });
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setIsDragging(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isLearnerMode) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFileUpload(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    const parsedInput = parseEmbedUrl(urlInput.trim());
    onChange({
      ...content,
      videoUrl: parsedInput.embedUrl || urlInput.trim(),
      filename: parsedInput.type === 'youtube' ? 'YouTube Video' : parsedInput.type === 'vimeo' ? 'Vimeo Video' : 'Web Video',
    });
    setShowUrlModal(false);
    setUrlInput('');
    setIsPlaying(false);
  };

  return (
    <div className={`w-full ${widthClass} space-y-2 select-none`}>
      {/* 16:9 Video Container */}
      <div
        onDragOver={(e) => {
          if (!isLearnerMode) {
            e.preventDefault();
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative aspect-video w-full bg-zinc-950 shadow-md overflow-hidden group transition-all ${
          isDragging ? 'ring-4 ring-indigo-500 scale-[1.01]' : ''
        }`}
        style={{ borderRadius: `${borderRadius}px` }}
      >
        {/* Uploading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white px-6">
            <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3">
              <Loader2 className="w-9 h-9 animate-spin text-indigo-400" />
              <div>
                <p className="text-sm font-bold tracking-tight">
                  {uploadProgress ? `Uploading Video: ${uploadProgress.percent}%` : 'Uploading Video...'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {uploadProgress
                    ? `${uploadProgress.loadedMb} MB of ${uploadProgress.totalMb} MB transferred`
                    : 'Streaming to /public/uploads/videos/ ...'}
                </p>
              </div>
              {uploadProgress && (
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700 mt-2">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-150 rounded-full"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dragging State Overlay */}
        {isDragging && !isUploading && (
          <div className="absolute inset-0 z-30 bg-indigo-950/80 border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center text-white space-y-2">
            <Upload className="w-10 h-10 text-indigo-300 animate-bounce" />
            <span className="text-sm font-bold">Drop MP4, WebM, or MOV to Upload</span>
          </div>
        )}

        {/* Embed (YouTube / Vimeo / Iframe) Player */}
        {isEmbed ? (
          <div className="relative w-full h-full bg-black">
            <iframe
              src={embedUrl}
              title={caption || 'Embedded Video Player'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          /* Native HTML5 Video Player */
          <>
            {!isPlaying ? (
              // Pre-play State: Poster Image with Centered Play Button
              <div
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                onClick={handlePlayClick}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterUrl}
                  alt={caption || 'Video preview poster'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />

                <button
                  type="button"
                  onClick={handlePlayClick}
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                  className="w-16 h-16 rounded-full text-white flex items-center justify-center shadow-2xl transition-all hover:scale-110 cursor-pointer z-10 backdrop-blur-xs border border-white/30"
                  title="Play video"
                >
                  <Play className="w-7 h-7 fill-white ml-1 text-white" />
                </button>

                {captionsUrl && (
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Subtitles className="w-3 h-3" />
                    <span>CC</span>
                  </div>
                )}
              </div>
            ) : (
              // Active HTML5 Player with Range Streaming Support
              <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl}
                controls
                autoPlay
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onSeeking={handleSeeking}
                onEnded={handleEnded}
                className="w-full h-full object-cover"
              >
                {captionsUrl && (
                  <track kind="captions" src={captionsUrl} srcLang="en" label="English" default />
                )}
                Your browser does not support HTML5 video playback.
              </video>
            )}
          </>
        )}

        {/* Quick Authoring Hover Bar (Upload or Paste Link) */}
        {!isLearnerMode && !isUploading && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#ffffff' }}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-lg border border-white/20 hover:bg-black transition-all cursor-pointer"
              title="Upload MP4, WebM, or MOV video file"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upload Video</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlModal(true);
              }}
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#ffffff' }}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-lg border border-white/20 hover:bg-black transition-all cursor-pointer"
              title="Paste YouTube, Vimeo, or video URL"
            >
              <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Paste URL</span>
            </button>
          </div>
        )}
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="font-medium">{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Caption Field */}
      <div className="w-full max-w-2xl mx-auto pt-1 pb-1">
        {!isLearnerMode ? (
          <div className="text-center">
            <input
              type="text"
              value={caption}
              onChange={(e) => onChange({ ...content, caption: e.target.value })}
              placeholder="Add a caption"
              className={`w-full text-center text-xs py-1 border-b transition-colors bg-transparent focus:outline-none ${
                isDarkBg
                  ? 'border-white/20 text-white/90 placeholder:text-white/40 focus:border-white/50'
                  : 'border-slate-200 text-slate-600 placeholder:text-slate-400 focus:border-slate-400'
              }`}
            />
          </div>
        ) : (
          caption && (
            <p className={`text-center text-xs italic pt-1 ${isDarkBg ? 'text-white/80' : 'text-slate-500'}`}>
              {caption}
            </p>
          )
        )}
      </div>

      {/* Hidden File Input for Direct Block Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*,.mp4,.webm,.mov,.m4v"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Quick Paste URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 p-5 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-zinc-900">Paste Video or Embed Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Supports standard YouTube links (<code className="text-indigo-600">youtube.com/watch</code>, <code className="text-indigo-600">youtu.be</code>), Vimeo (<code className="text-indigo-600">vimeo.com</code>), or direct video files (<code className="text-indigo-600">.mp4, .webm</code>).
            </p>

            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full text-xs px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 focus:outline-none focus:border-indigo-500 font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyUrl();
              }}
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyUrl}
                style={{ backgroundColor: '#4F46E5', color: '#ffffff' }}
                className="btn-primary-indigo px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
              >
                Apply Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
