'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaAsset } from '@/lib/types';
import {
  X,
  Upload,
  Image as ImageIcon,
  Film,
  Music,
  Sparkles,
  Sliders,
  Crop,
  Check,
  Loader2,
  Search,
  Trash2,
  ExternalLink,
  FolderSync,
  Sun,
  Contrast,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  CheckCheck,
  RefreshCw,
  Key,
  Zap,
} from 'lucide-react';

interface UnifiedMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, asset?: Partial<MediaAsset>) => void;
  initialTab?: 'upload' | 'library' | 'flow' | 'crop';
  mediaType?: 'image' | 'video' | 'audio' | 'all';
  currentUrl?: string;
  accentColor?: string;
}

export function UnifiedMediaModal({
  isOpen,
  onClose,
  onSelect,
  initialTab = 'upload',
  mediaType = 'image',
  currentUrl,
  accentColor = '#ff5722',
}: UnifiedMediaModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'flow' | 'crop'>(initialTab);

  // Library state
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'flow'>(
    mediaType === 'all' ? 'all' : mediaType
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Flow Studio state
  const [flowPrompt, setFlowPrompt] = useState(
    'Modern corporate glass office with security turnstiles, cinematic blue and orange ambient lighting'
  );
  const [flowEngine, setFlowEngine] = useState<'nano-banana-pro' | 'flow-accelerated' | 'imagen-3'>('nano-banana-pro');
  const [flowAspectRatio, setFlowAspectRatio] = useState('16:9');
  const [flowStyle, setFlowStyle] = useState('Photorealistic Office');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<MediaAsset | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const [isScanningDownloads, setIsScanningDownloads] = useState(false);
  const [flowStatus, setFlowStatus] = useState<{
    isConnected: boolean;
    account?: {
      email: string;
      name: string;
      avatar: string | null;
      hasAiPro: boolean;
    } | null;
    dropzoneCount: number;
    watcherActive: boolean;
  } | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState<string>(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
  );
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);

  // Crop & Adjust state
  const [cropImageSrc, setCropImageSrc] = useState<string>(currentUrl || '');
  const [cropAspect, setCropAspect] = useState<'16:9' | '1:1' | '4:3' | 'free'>('16:9');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [focalPoint, setFocalPoint] = useState<'top' | 'center' | 'bottom'>('center');
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load assets & Flow status when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadAssets();
      checkFlowStatus();
      if (typeof window !== 'undefined') {
        const savedKey = localStorage.getItem('google_ai_key');
        if (savedKey) {
          setGoogleApiKey(savedKey);
        } else if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
          setGoogleApiKey(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        }
      }
      if (currentUrl) {
        setCropImageSrc(currentUrl);
      }
    }
  }, [isOpen, initialTab, currentUrl]);

  const loadAssets = async () => {
    try {
      setLoadingAssets(true);
      const res = await fetch('/api/media');
      const data = await res.json();
      if (data.assets) {
        setAssets(data.assets);
      }
    } catch (err) {
      console.error('Failed to load media assets', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const checkFlowStatus = async () => {
    try {
      const res = await fetch('/api/flow/status');
      const data = await res.json();
      setFlowStatus(data);
    } catch (err) {
      console.error('Failed to check Flow status', err);
    }
  };

  // Upload handler
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (data.url) {
        setUploadPreview(data.url);
        setCropImageSrc(data.url);
        await loadAssets();
        onSelect(data.url, { filename: data.filename });
        onClose();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Flow Connect Browser
  const handleLaunchFlow = async (mode: 'auth' | 'side-by-side') => {
    try {
      setFlowNotice(
        mode === 'auth'
          ? 'Launching Google Chrome for Google Pro login...'
          : 'Google Flow opened side-by-side! Dropzone watcher is active.'
      );
      await fetch('/api/flow/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      setTimeout(checkFlowStatus, 2000);
    } catch (err) {
      console.error('Launch Flow failed:', err);
    }
  };

  // Copy Prompt & Open Side-by-Side Flow
  const handleCopyPromptAndLaunch = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(flowPrompt);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 3000);
      }
      setFlowNotice('Prompt copied to clipboard! Opening Google Flow in Chrome...');
      handleLaunchFlow('side-by-side');
    } catch {
      handleLaunchFlow('side-by-side');
    }
  };

  // Scan Downloads Folder for Flow Exports
  const handleScanDownloads = async () => {
    try {
      const res = await fetch('/api/flow/scan-downloads', { method: 'POST' });
      const data = await res.json();
      if (data.importedCount > 0) {
        setFlowNotice(`Successfully imported ${data.importedCount} new asset(s) from ~/Downloads!`);
        await loadAssets();
      } else {
        setFlowNotice('Checked ~/Downloads: No new Flow images found.');
      }
    } catch (err) {
      console.error('Scan downloads failed:', err);
    }
  };

  // Flow Generate
  const handleGenerateFlow = async () => {
    try {
      setIsGenerating(true);
      setFlowNotice(null);
      setGeneratedAsset(null);

      const res = await fetch('/api/flow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: flowPrompt,
          aspectRatio: flowAspectRatio,
          stylePreset: flowStyle,
          apiKey: googleApiKey.trim() || undefined,
          engine: flowEngine,
        }),
      });
      const data = await res.json();

      if (data.success && data.asset) {
        setGeneratedAsset(data.asset);
        await loadAssets();
        setFlowNotice(
          data.message ||
            `Image generated successfully with ${
              flowEngine === 'nano-banana-pro'
                ? 'Nano Banana Pro'
                : flowEngine === 'flow-accelerated'
                ? 'Google Flow Accelerated'
                : 'Google Imagen 3'
            } and indexed in Media Library!`
        );
      } else {
        setFlowNotice(data.message || data.error || 'Generation failed. No image returned.');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Flow generation failed:', err);
      setFlowNotice(`Generation error: ${e?.message || String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply Crop & Image Adjustments
  const handleApplyCrop = async () => {
    if (!cropImageSrc) return;
    try {
      setIsProcessingCrop(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = cropImageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Determine dimensions based on aspect ratio
      const targetW = img.naturalWidth || 1200;
      let targetH = img.naturalHeight || 800;

      if (cropAspect === '16:9') {
        targetH = Math.round(targetW * (9 / 16));
      } else if (cropAspect === '1:1') {
        targetH = targetW;
      } else if (cropAspect === '4:3') {
        targetH = Math.round(targetW * (3 / 4));
      }

      canvas.width = targetW;
      canvas.height = targetH;

      // Apply CSS-like filters on canvas context
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

      // Focal point vertical offset
      let sy = 0;
      if (focalPoint === 'center') {
        sy = Math.max(0, (img.naturalHeight - targetH) / 2);
      } else if (focalPoint === 'bottom') {
        sy = Math.max(0, img.naturalHeight - targetH);
      }

      ctx.drawImage(img, 0, sy, img.naturalWidth, targetH, 0, 0, targetW, targetH);

      // Convert canvas to blob and upload
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();
        if (data.url) {
          await loadAssets();
          onSelect(data.url, { filename: data.filename });
          onClose();
        }
      }, 'image/jpeg', 0.92);
    } catch (err) {
      console.error('Crop processing failed:', err);
    } finally {
      setIsProcessingCrop(false);
    }
  };

  // Delete an asset
  const handleDeleteAsset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
      setAssets(assets.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete asset', err);
    }
  };

  if (!isOpen) return null;

  // Filtered assets
  const filteredAssets = assets.filter((asset) => {
    if (libraryFilter === 'flow' && asset.source !== 'flow' && asset.source !== 'dropzone') {
      return false;
    }
    if (libraryFilter !== 'all' && libraryFilter !== 'flow' && asset.fileType !== libraryFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        asset.filename.toLowerCase().includes(q) ||
        (asset.prompt && asset.prompt.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <h2 className="text-base font-bold text-gray-900">Media Studio & Asset Library</h2>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              — Upload, Google Flow, or choose from Library
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 border-b border-gray-200 bg-gray-50/70 flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('library');
              loadAssets();
            }}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'library'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Course Media Library ({assets.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('flow');
              checkFlowStatus();
            }}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'flow'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>Google Media Studio (Direct Connect)</span>
          </button>

          <button
            onClick={() => setActiveTab('crop')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'crop'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Crop className="w-4 h-4" />
            <span>Crop & Settings</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-3xl p-12 text-center bg-gray-50/50 hover:bg-gray-50 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Drag and drop file here, or click to browse
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports high-resolution PNG, JPG, WebP, SVG, MP4, and MP3 files
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading to /public/uploads...
                    </span>
                  ) : (
                    'Choose File From Computer'
                  )}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>
          )}

          {/* TAB 2: COURSE MEDIA LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-5">
              {/* Filter pills & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                  {(
                    [
                      { id: 'all', label: 'All Media' },
                      { id: 'image', label: 'Images' },
                      { id: 'video', label: 'Videos' },
                      { id: 'audio', label: 'Audio' },
                      { id: 'flow', label: 'Google Flow' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setLibraryFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        libraryFilter === f.id
                          ? 'bg-white text-gray-900 shadow-2xs font-bold'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search media..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                  />
                </div>
              </div>

              {/* Asset Grid */}
              {loadingAssets ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Loading media assets...</span>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs">
                  No media assets found matching the filter.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredAssets.map((asset) => {
                    const isFlow = asset.source === 'flow' || asset.source === 'dropzone';
                    const isSelected = currentUrl === asset.url;

                    return (
                      <div
                        key={asset.id}
                        onClick={() => {
                          onSelect(asset.url, asset);
                          onClose();
                        }}
                        className={`group relative rounded-2xl border transition-all overflow-hidden flex flex-col bg-white cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-orange-500 border-transparent shadow-md'
                            : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        {/* Preview Thumbnail */}
                        <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden flex items-center justify-center">
                          {asset.fileType === 'video' ? (
                            <div className="flex flex-col items-center justify-center text-white/80">
                              <Film className="w-8 h-8 mb-1" />
                              <span className="text-[10px] font-bold uppercase">Video</span>
                            </div>
                          ) : asset.fileType === 'audio' ? (
                            <div className="flex flex-col items-center justify-center text-white/80">
                              <Music className="w-8 h-8 mb-1" />
                              <span className="text-[10px] font-bold uppercase">Audio</span>
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={asset.url}
                              alt={asset.filename}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}

                          {/* Source badge */}
                          {isFlow && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white bg-black/70 backdrop-blur-xs flex items-center gap-1 border border-white/20">
                              <span>{asset.model?.includes('Banana') ? '🍌' : '✨'}</span>
                              <span>{asset.model || 'Flow'}</span>
                            </div>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteAsset(asset.id, e)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Caption & metadata */}
                        <div className="p-2.5 border-t border-gray-100 flex-1 flex flex-col justify-between">
                          <div className="text-xs font-bold text-gray-900 truncate" title={asset.filename}>
                            {asset.filename}
                          </div>
                          {asset.prompt && (
                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5" title={asset.prompt}>
                              {asset.prompt}
                            </p>
                          )}
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between font-medium">
                            <span>{asset.aspectRatio || asset.fileType}</span>
                            <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GOOGLE FLOW STUDIO (PRO ACCOUNT BRIDGE) */}
          {activeTab === 'flow' && (
            <div className="space-y-6">
              {/* Account Connection Status Bar */}
              <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {flowStatus?.account?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={flowStatus.account.avatar}
                        alt={flowStatus.account.name}
                        className="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center border-2 border-emerald-400">
                        {flowStatus?.account?.name
                          ? flowStatus.account.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .substring(0, 2)
                          : 'MA'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {flowStatus?.account?.name || 'Michael Afurong'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Google Pro Account Linked</span>
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-gray-700">
                          {flowStatus?.account?.email || 'chaelzki@gmail.com'}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Active Flow Session (.flow-session)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLaunchFlow('side-by-side')}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Opens Google Flow in Chrome with your logged-in Google Pro session"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Google Flow in Chrome</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleScanDownloads}
                      disabled={isScanningDownloads}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Checks ~/Downloads for images exported from Google Flow"
                    >
                      {isScanningDownloads ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FolderSync className="w-3.5 h-3.5 text-gray-600" />
                      )}
                      <span>Scan Downloads</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-500 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Dropzone folder:</span>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">
                      /public/uploads/flow-dropzone
                    </code>
                    <span>({flowStatus?.dropzoneCount ?? 0} files)</span>
                  </div>
                  <div className="text-gray-400">
                    Downloads from Google Flow auto-sync here via local browser bridge.
                  </div>
                </div>
              </div>

              {/* Google AI Studio API Key (Optional) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-black cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-orange-500" />
                    <span>Google AI Studio API Key (Optional)</span>
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full">
                      {googleApiKey ? 'API Key Active' : 'Built-in Direct AI'}
                    </span>
                  </button>

                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Get Free Google AI Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {showApiKeyInput && (
                  <div className="pt-2 space-y-2 border-t border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={googleApiKey}
                        onChange={(e) => {
                          setGoogleApiKey(e.target.value);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('google_ai_key', e.target.value);
                          }
                        }}
                        placeholder="Paste your Google AI Studio API key"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono text-gray-800"
                      />
                      {googleApiKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleApiKey('');
                            if (typeof window !== 'undefined') {
                              localStorage.removeItem('google_ai_key');
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      For direct API generation, Google AI Studio requires an API key with Pay-As-You-Go billing enabled. Alternatively, use your connected Google Pro account above to generate inside Google Flow with zero cloud API fees!
                    </p>
                  </div>
                )}
              </div>

              {flowNotice && (
                <div className={`p-4 rounded-xl text-xs flex flex-col gap-2.5 ${
                  flowNotice.toLowerCase().includes('failed') ||
                  flowNotice.toLowerCase().includes('error') ||
                  flowNotice.toLowerCase().includes('exceeded') ||
                  flowNotice.toLowerCase().includes('quota') ||
                  flowNotice.toLowerCase().includes('required')
                    ? 'bg-rose-50 border border-rose-200 text-rose-900 font-medium'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {flowNotice.toLowerCase().includes('failed') ||
                    flowNotice.toLowerCase().includes('error') ||
                    flowNotice.toLowerCase().includes('exceeded') ||
                    flowNotice.toLowerCase().includes('quota') ||
                    flowNotice.toLowerCase().includes('required') ? (
                      <Key className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 break-words">
                      <span>{flowNotice}</span>
                    </div>
                  </div>

                  {flowNotice.toLowerCase().includes('billing') && (
                    <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
                      <a
                        href="https://console.cloud.google.com/billing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <span>Enable Billing in Google Cloud Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPromptAndLaunch}
                        className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-orange-500" />
                        <span>Use Free Google Flow Pro Bridge</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Generated Result Preview Card */}
              {generatedAsset && (
                <div className="p-4 bg-orange-50/60 border-2 border-orange-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span>
                        {generatedAsset.model ||
                          (flowEngine === 'nano-banana-pro'
                            ? 'Nano Banana Pro'
                            : flowEngine === 'flow-accelerated'
                            ? 'Google Flow Accelerated'
                            : 'Google Imagen 3')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Generated
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      {generatedAsset.aspectRatio} • {generatedAsset.stylePreset}
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-black flex items-center justify-center group shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedAsset.url}
                      alt={generatedAsset.prompt || 'Generated Asset'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-xs text-white line-clamp-2">{generatedAsset.prompt}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCropImageSrc(generatedAsset.url);
                        setActiveTab('crop');
                      }}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl border border-gray-300 hover:bg-white text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Crop & Adjust</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleGenerateFlow}
                        disabled={isGenerating}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl border border-gray-300 hover:bg-white text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelect(generatedAsset.url, generatedAsset);
                          onClose();
                        }}
                        className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Check className="w-4 h-4" />
                        <span>Use in Lesson Block</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Generative Engine Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Google Generative Engine
                  </label>
                  <span className="text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>Pro Bridge Active</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'nano-banana-pro' as const,
                      name: 'Nano Banana Pro',
                      badge: 'Flagship • 4K Studio',
                      desc: 'DeepMind Nano Banana Pro generation via Google Flow.',
                      icon: <Sparkles className="w-4 h-4 text-orange-500" />,
                    },
                    {
                      id: 'flow-accelerated' as const,
                      name: 'Google Flow Accelerated',
                      badge: 'Flash • Fast',
                      desc: 'Rapid image generation via your connected Google Pro session.',
                      icon: <Zap className="w-4 h-4 text-amber-500" />,
                    },
                    {
                      id: 'imagen-3' as const,
                      name: 'Google Imagen 3',
                      badge: 'Photorealistic',
                      desc: 'Studio-quality photorealistic images via Google Pro session.',
                      icon: <ImageIcon className="w-4 h-4 text-blue-500" />,
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFlowEngine(m.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        flowEngine === m.id
                          ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-1 ring-orange-400'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          {m.icon}
                          <span>{m.name}</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            flowEngine === m.id
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Flow Prompt Input */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Prompt Description
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyPromptAndLaunch}
                      className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy prompt text and launch Google Flow in Chrome"
                    >
                      {copyStatus ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied! Opening Flow...</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Prompt & Open in Flow</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={flowPrompt}
                    onChange={(e) => setFlowPrompt(e.target.value)}
                    placeholder="Describe the image or video scene in detail..."
                    className="w-full p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 font-medium bg-white"
                  />
                </div>

                {/* Controls: Aspect Ratio & Style Preset */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: '16:9', label: '16:9 Banner' },
                        { id: '1:1', label: '1:1 Square' },
                        { id: '4:3', label: '4:3 Standard' },
                        { id: '9:16', label: '9:16 Story' },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => setFlowAspectRatio(ratio.id)}
                          className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                            flowAspectRatio === ratio.id
                              ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {ratio.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Style Preset
                    </label>
                    <select
                      value={flowStyle}
                      onChange={(e) => setFlowStyle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-800 bg-white outline-none focus:border-black"
                    >
                      <option value="Photorealistic Office">Photorealistic Office (Corporate)</option>
                      <option value="Cinematic">Cinematic (Dramatic Lighting)</option>
                      <option value="Flat Illustration">Flat Illustration (Clean Vector)</option>
                      <option value="3D Render">3D Render (Isometric / Modern)</option>
                      <option value="Minimalist Tech">Minimalist Tech (Dark Theme)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <FolderSync className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      Dropzone: <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">/public/uploads/flow-dropzone</code>
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleGenerateFlow}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-xs flex items-center gap-2 cursor-pointer hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          Generating with{' '}
                          {flowEngine === 'nano-banana-pro'
                            ? 'Nano Banana Pro'
                            : flowEngine === 'flow-accelerated'
                            ? 'Google Flow'
                            : 'Google Imagen 3'}
                          ...
                        </span>
                      </>
                    ) : (
                      <>
                        {flowEngine === 'nano-banana-pro' ? (
                          <Sparkles className="w-4 h-4" />
                        ) : flowEngine === 'flow-accelerated' ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                        <span>
                          Generate with{' '}
                          {flowEngine === 'nano-banana-pro'
                            ? 'Nano Banana Pro'
                            : flowEngine === 'flow-accelerated'
                            ? 'Google Flow Accelerated'
                            : 'Google Imagen 3'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CROP & IMAGE SETTINGS */}
          {activeTab === 'crop' && (
            <div className="space-y-6">
              {cropImageSrc ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Preview with Canvas adjustments */}
                  <div className="md:col-span-2 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Adjusted Live Preview
                    </label>
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-slate-900 aspect-[16/9] flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cropImageSrc}
                        alt="Preview"
                        style={{
                          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                          objectFit: 'cover',
                          objectPosition: focalPoint,
                        }}
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-200 text-xs">
                    {/* Aspect Ratio */}
                    <div>
                      <span className="font-bold text-gray-800 block mb-2">Aspect Ratio</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['16:9', '1:1', '4:3', 'free'] as const).map((asp) => (
                          <button
                            key={asp}
                            type="button"
                            onClick={() => setCropAspect(asp)}
                            className={`py-1.5 rounded-lg border font-semibold cursor-pointer ${
                              cropAspect === asp
                                ? 'bg-black text-white border-black'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {asp === 'free' ? 'Original' : asp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Focal Point Alignment */}
                    <div>
                      <span className="font-bold text-gray-800 block mb-2">Focal Point Alignment</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['top', 'center', 'bottom'] as const).map((fp) => (
                          <button
                            key={fp}
                            type="button"
                            onClick={() => setFocalPoint(fp)}
                            className={`py-1.5 rounded-lg border font-semibold capitalize cursor-pointer ${
                              focalPoint === fp
                                ? 'bg-black text-white border-black'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {fp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                      <div>
                        <div className="flex justify-between font-semibold text-gray-700 mb-1">
                          <span className="flex items-center gap-1">
                            <Sun className="w-3.5 h-3.5" /> Brightness
                          </span>
                          <span>{brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={brightness}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                          className="w-full accent-orange-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold text-gray-700 mb-1">
                          <span className="flex items-center gap-1">
                            <Contrast className="w-3.5 h-3.5" /> Contrast
                          </span>
                          <span>{contrast}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={contrast}
                          onChange={(e) => setContrast(Number(e.target.value))}
                          className="w-full accent-orange-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold text-gray-700 mb-1">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" /> Saturation
                          </span>
                          <span>{saturation}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={saturation}
                          onChange={(e) => setSaturation(Number(e.target.value))}
                          className="w-full accent-orange-600"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingCrop}
                      onClick={handleApplyCrop}
                      className="w-full py-2.5 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      {isProcessingCrop ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Applying...</span>
                        </>
                      ) : (
                        <span>Apply & Insert Image</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-400 text-xs">
                  Please upload or select an image from the library first to apply cropping and settings.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
