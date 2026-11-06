'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Block } from '@/lib/types';
import {
  Copy,
  Check,
  Code,
  UploadCloud,
  FileCode,
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  FolderArchive,
  Edit3,
  CheckCircle2,
  X,
  Sparkles,
  Play,
} from 'lucide-react';

interface CodeBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
  onComplete?: () => void;
  onOpenEdit?: () => void;
}

export function CodeBlock({
  block,
  onChange,
  accentColor = '#ff5722',
  isLearnerMode = false,
  onComplete,
  onOpenEdit,
}: CodeBlockProps) {
  const { subtype, content, settings } = block;
  const isEmbedApp = subtype === 'code_embed';
  const isWebProject = subtype === 'code_web_project' || subtype === 'upload_project';

  // Common states
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [scormCompleted, setScormCompleted] = useState(false);
  const [scormScore, setScormScore] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Height computation
  const configuredHeight =
    (content.height as number) ||
    (settings?.iframeHeight as number) ||
    (isEmbedApp ? 480 : 560);

  // -------------------------------------------------------------
  // FULLSCREEN TOGGLE (Native + Viewport Fallback)
  // -------------------------------------------------------------
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // -------------------------------------------------------------
  // SCORM 1.2 / 2004 BRIDGE STUB FOR WEB PROJECTS
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isWebProject || typeof window === 'undefined') return;

    // SCORM 1.2 API
    const scorm12API = {
      LMSInitialize: () => 'true',
      LMSFinish: () => 'true',
      LMSGetValue: (element: string) => {
        if (element === 'cmi.core.lesson_status') {
          return scormCompleted ? 'completed' : 'incomplete';
        }
        if (element === 'cmi.core.student_name') return 'Learner, Active';
        if (element === 'cmi.core.student_id') return 'learner-101';
        if (element === 'cmi.core.entry') return 'ab-initio';
        if (element === 'cmi.core.lesson_mode') return 'normal';
        if (element === 'cmi.core.credit') return 'credit';
        if (element === 'cmi.core.score.raw') return scormScore || '100';
        return '';
      },
      LMSSetValue: (element: string, value: string) => {
        const valStr = String(value).trim().toLowerCase();
        if (element.toLowerCase() === 'cmi.core.lesson_status') {
          if (valStr === 'completed' || valStr === 'passed') {
            setScormCompleted(true);
            if (onComplete) onComplete();
            window.dispatchEvent(
              new CustomEvent('scorm_completed', {
                detail: { blockId: block.id, status: valStr },
              })
            );
          }
        }
        if (element.toLowerCase() === 'cmi.core.score.raw') {
          setScormScore(String(value));
        }
        return 'true';
      },
      LMSCommit: () => 'true',
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => 'No error',
      LMSGetDiagnostic: () => 'No error',
    };

    // SCORM 2004 API
    const scorm2004API = {
      Initialize: () => 'true',
      Terminate: () => 'true',
      GetValue: scorm12API.LMSGetValue,
      SetValue: (elem: string, val: string) => {
        const valStr = String(val).trim().toLowerCase();
        if (elem.toLowerCase() === 'cmi.completion_status' || elem.toLowerCase() === 'cmi.success_status') {
          if (valStr === 'completed' || valStr === 'passed') {
            setScormCompleted(true);
            if (onComplete) onComplete();
          }
        }
        return 'true';
      },
      Commit: () => 'true',
      GetLastError: () => '0',
      GetErrorString: () => 'No error',
      GetDiagnostic: () => 'No error',
    };

    // Register on parent window so SCOs can find parent.API
    (window as unknown as { API?: unknown; API_1484_11?: unknown }).API = scorm12API;
    (window as unknown as { API?: unknown; API_1484_11?: unknown }).API_1484_11 = scorm2004API;

    // Also listen for postMessage from nested iframe
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (
          data &&
          (data.action === 'scorm_completed' ||
            data.status === 'completed' ||
            data.status === 'passed' ||
            data.cmi?.['cmi.core.lesson_status'] === 'completed' ||
            data.cmi?.['cmi.core.lesson_status'] === 'passed')
        ) {
          setScormCompleted(true);
          if (onComplete) onComplete();
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isWebProject, block.id, scormCompleted, scormScore, onComplete]);

  // Inject SCORM API directly into iframe window on load
  const handleIframeLoad = () => {
    if (!iframeRef.current) return;
    try {
      const win = iframeRef.current.contentWindow as (Window & { API?: unknown; API_1484_11?: unknown }) | null;
      if (win) {
        win.API = (window as unknown as { API?: unknown }).API;
        win.API_1484_11 = (window as unknown as { API_1484_11?: unknown }).API_1484_11;
      }
    } catch {
      // Cross-origin fallback handled by postMessage
    }
  };

  // -------------------------------------------------------------
  // 1. CODE EMBED (CUSTOM HTML / JS INTERACTIVE APP)
  // -------------------------------------------------------------
  if (isEmbedApp) {
    const rawHtml =
      (content.htmlCode as string) ||
      `<div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 2.5rem 1.5rem; background: linear-gradient(135deg, #090d16 0%, #1e293b 100%); color: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
  <div style="display: inline-block; padding: 6px 14px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #38bdf8; margin-bottom: 12px;">
    ⚡ Interactive Simulation
  </div>
  <h2 style="font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 8px;">Real-Time Threat Detection Sandbox</h2>
  <p style="color: #94a3b8; font-size: 14px; max-width: 440px; margin: 0 auto 1.5rem; line-height: 1.5;">
    Click the trigger to simulate an automated security protocol defense reaction.
  </p>
  <button onclick="document.getElementById('result').innerText = '🛡️ Defense Triggered: Malicious payload quarantined successfully!'; this.style.transform='scale(0.96)';" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; border: none; padding: 12px 28px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
    Simulate Threat Attack
  </button>
  <div id="result" style="margin-top: 18px; font-size: 13px; font-weight: 600; color: #4ade80; min-height: 20px;"></div>
</div>`;

    return (
      <div
        ref={containerRef}
        className={`w-full transition-all duration-300 relative ${
          isFullscreen
            ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 sm:p-6 overflow-hidden'
            : 'rounded-2xl overflow-hidden border border-zinc-200/90 shadow-sm bg-white'
        }`}
      >
        {/* Author-Only Subtle Floating Header (Hidden in Learner Mode) */}
        {!isLearnerMode && !isFullscreen && (
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200/80 flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                Interactive HTML / JS App
              </span>
              <span className="text-zinc-400 font-mono text-[10px]">
                ({configuredHeight}px stage)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenEdit && (
                <button
                  type="button"
                  onClick={onOpenEdit}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold text-[11px] shadow-2xs hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-sky-600" />
                  <span>Edit App Code</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Reload interactive app"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                title="Expand Fullscreen"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-black text-white font-semibold text-[11px] transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Floating Exit Bar */}
        {isFullscreen && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-bold text-sm text-white">Full-Screen Interactive App</span>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen (Esc)</span>
            </button>
          </div>
        )}

        {/* Learner-Mode Sleek Floating Expand Button */}
        {isLearnerMode && !isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-black text-white text-xs font-medium shadow-md backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen</span>
          </button>
        )}

        {/* Live Interactive Iframe Running srcDoc (NO RAW CODE VISIBLE ANYWHERE ON CANVAS!) */}
        <div className={`w-full relative ${isFullscreen ? 'flex-1 h-full' : ''}`}>
          <iframe
            key={refreshKey}
            srcDoc={rawHtml}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            style={{
              height: isFullscreen ? '100%' : `${configuredHeight}px`,
              minHeight: isFullscreen ? '100%' : '320px',
            }}
            className="w-full border-none bg-white block"
            title="Interactive Custom App"
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. UPLOAD PROJECT (ZIP WEB OBJECT & SCORM 1.2 / STORYLINE)
  // -------------------------------------------------------------
  if (isWebProject) {
    const projectUrl = (content.projectUrl as string) || '';
    const projectFileName = (content.projectFileName as string) || '';
    const projectFilesCount = (content.projectFilesCount as number) || 0;

    const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.zip')) {
        setUploadError('Please select a valid .zip project archive.');
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('blockId', block.id);

      try {
        const res = await fetch('/api/upload-project', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload project package');
        }

        onChange({
          ...content,
          projectUrl: data.url,
          projectFileName: data.fileName,
          projectFilesCount: data.filesCount,
          entryFile: data.entryFile || 'index.html',
        });
      } catch (err) {
        console.error(err);
        setUploadError(err instanceof Error ? err.message : 'Error uploading project zip');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    return (
      <div
        ref={containerRef}
        className={`w-full transition-all duration-300 relative ${
          isFullscreen
            ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 sm:p-6 overflow-hidden'
            : 'rounded-2xl overflow-hidden border border-zinc-200/90 shadow-sm bg-white'
        }`}
      >
        {/* Author Bar / Status Header */}
        {!isLearnerMode && !isFullscreen && (
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200/80 flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-zinc-800 uppercase tracking-wider text-[11px]">
                Web App / SCORM Package (.zip)
              </span>
              {projectFileName && (
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                  {projectFileName} ({projectFilesCount} files)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {projectUrl && (
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-indigo-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Tab</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold text-[11px] shadow-2xs hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3 h-3 text-indigo-600" />
                <span>{projectUrl ? 'Replace .zip' : 'Upload .zip'}</span>
              </button>

              {projectUrl && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-black text-white font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Fullscreen</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Fullscreen Floating Bar */}
        {isFullscreen && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span className="font-bold text-sm text-white">
                {projectFileName || 'Web App Player'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen (Esc)</span>
            </button>
          </div>
        )}

        {/* Learner Mode Floating Expand Button */}
        {isLearnerMode && projectUrl && !isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-black text-white text-xs font-medium shadow-md backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen</span>
          </button>
        )}

        {/* SCORM Completed Notification Banner */}
        {scormCompleted && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">
                SCORM 1.2 Module Completed successfully!
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Continue Unlocked
            </span>
          </div>
        )}

        {/* Render Live Web Player OR Upload Dropzone */}
        {projectUrl ? (
          <div className={`w-full relative ${isFullscreen ? 'flex-1 h-full' : ''}`}>
            <iframe
              ref={iframeRef}
              key={refreshKey}
              src={projectUrl}
              onLoad={handleIframeLoad}
              sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
              style={{
                height: isFullscreen ? '100%' : `${configuredHeight}px`,
                minHeight: isFullscreen ? '100%' : '380px',
              }}
              className="w-full border-none bg-white block"
              title="Embedded Web Project Player"
            />
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 hover:border-indigo-600 rounded-xl m-6 p-12 flex flex-col items-center justify-center text-center cursor-pointer group transition-all bg-zinc-50/50 hover:bg-indigo-50/30"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 mb-1">
              {isUploading ? 'Extracting project files...' : 'Upload Web Object or SCORM Package (.zip)'}
            </h4>
            <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
              Upload any HTML5 web app, Storyline block, ModuForge course, or custom JS application. The entry point (index.html) will run directly inside the player stage with SCORM 1.2 auto-tracking.
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleZipUpload}
          className="hidden"
        />

        {uploadError && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
            <span>{uploadError}</span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. CODE SNIPPET (SYNTAX HIGHLIGHTED READ-ONLY DISPLAY)
  // -------------------------------------------------------------
  const language = (content.language as string) || 'javascript';
  const code =
    (content.code as string) ||
    `// Verify security tokens before processing transaction\nfunction validateAuthHeaders(request) {\n  const token = request.headers.get("X-Auth-Token");\n  if (!token || !verifySignature(token)) {\n    throw new SecurityException("Invalid caller signature detected.");\n  }\n  return true;\n}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 text-slate-100 shadow-xl">
      {/* Mac-Style Header Bar */}
      <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <Code className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {language}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer text-xs font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text Area */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        <pre className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed outline-none focus:ring-1 focus:ring-sky-500 rounded p-1">
          <code
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => onChange({ ...content, code: e.currentTarget.innerText })}
            className="outline-none"
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
