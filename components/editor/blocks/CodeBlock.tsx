'use client';

import React, { useState, useRef } from 'react';
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
  FolderArchive,
} from 'lucide-react';

interface CodeBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function CodeBlock({
  block,
  onChange,
  accentColor = '#ff5722',
  isLearnerMode = false,
}: CodeBlockProps) {
  const { subtype, content } = block;
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // 1. CODE SNIPPET
  // -------------------------------------------------------------
  const language = (content.language as string) || 'javascript';
  const code =
    (content.code as string) ||
    `// Verify security tokens before processing transaction
function validateAuthHeaders(request) {
  const token = request.headers.get("X-Auth-Token");
  if (!token || !verifySignature(token)) {
    throw new SecurityException("Invalid caller signature detected.");
  }
  return true;
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // -------------------------------------------------------------
  // 2. CODE EMBED (HTML/CSS/JS SANDBOX)
  // -------------------------------------------------------------
  const defaultHtml =
    (content.htmlCode as string) ||
    `<div style="font-family: sans-serif; text-align: center; padding: 2rem; background: #0f172a; color: white; border-radius: 12px;">
  <h2 style="color: #38bdf8; margin-bottom: 0.5rem;">Interactive Security Widget</h2>
  <p style="color: #94a3b8; font-size: 14px;">This custom embed runs in a safe sandboxed iframe environment.</p>
  <button onclick="alert('Simulation: Unauthorized access blocked!')" style="background: #ff5722; color: white; border: none; padding: 10px 20px; border-radius: 99px; font-weight: bold; cursor: pointer; margin-top: 1rem;">
    Test Defense Trigger
  </button>
</div>`;

  // -------------------------------------------------------------
  // 3. UPLOAD PROJECT (ZIP WEB OBJECT)
  // -------------------------------------------------------------
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
      });
    } catch (err) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : 'Error uploading project zip');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------
  // RENDER CODE EMBED ("ADD CODE" SANDBOX)
  // -------------------------------------------------------------
  if (subtype === 'code_embed') {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <FileCode className="w-4 h-4 text-sky-600" />
            <span>Interactive Web Embed • HTML / JS Sandbox</span>
          </div>
        </div>

        {/* Live Iframe Sandbox Preview */}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
          <iframe
            srcDoc={defaultHtml}
            sandbox="allow-scripts allow-modals"
            className="w-full min-h-[220px] border-none"
            title="Embedded Sandbox Preview"
          />
        </div>

        {/* Authoring HTML/CSS/JS Editor */}
        {!isLearnerMode && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-600">HTML / CSS / JavaScript Code:</span>
            <textarea
              rows={6}
              value={defaultHtml}
              onChange={(e) => onChange({ ...content, htmlCode: e.target.value })}
              className="w-full font-mono text-xs p-3 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 outline-none focus:border-sky-500 resize-y"
            />
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER UPLOAD PROJECT (ZIP WEB OBJECT)
  // -------------------------------------------------------------
  if (subtype === 'code_web_project') {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <FolderArchive className="w-4 h-4 text-indigo-600" />
            <span>Web Object Package (.zip Project)</span>
          </div>
          {projectFileName && (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {projectFileName} ({projectFilesCount} files)
            </span>
          )}
        </div>

        {projectUrl ? (
          <div className="space-y-4">
            {/* Live Extracted Project Iframe */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-xs bg-slate-900">
              <iframe
                src={projectUrl}
                sandbox="allow-scripts allow-same-origin allow-modals"
                className="w-full min-h-[400px] border-none bg-white"
                title="Web Project Player"
              />
            </div>

            {!isLearnerMode && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in standalone tab</span>
                </a>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold text-gray-700 hover:text-black"
                >
                  Replace .zip Project
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Upload Dropzone State */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group transition-all bg-gray-50/50 hover:bg-gray-50"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">
              {isUploading ? 'Extracting project files...' : 'Upload Web Object (.zip)'}
            </h4>
            <p className="text-xs text-gray-500 max-w-sm">
              Upload an HTML5, Storyline, or custom JavaScript web app packaged in a .zip archive. The entry point (index.html) will render automatically.
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
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {uploadError}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEFAULT: CODE SNIPPET (SYNTAX HIGHLIGHTED)
  // -------------------------------------------------------------
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 text-slate-100 shadow-md">
      <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-sky-400" />
          <select
            value={language}
            onChange={(e) => onChange({ ...content, language: e.target.value })}
            className="bg-transparent font-mono text-slate-300 outline-none cursor-pointer"
          >
            <option value="javascript" className="bg-slate-900 text-white">JavaScript</option>
            <option value="typescript" className="bg-slate-900 text-white">TypeScript</option>
            <option value="python" className="bg-slate-900 text-white">Python</option>
            <option value="bash" className="bg-slate-900 text-white">Bash / Shell</option>
            <option value="json" className="bg-slate-900 text-white">JSON</option>
            <option value="html" className="bg-slate-900 text-white">HTML / CSS</option>
            <option value="sql" className="bg-slate-900 text-white">SQL</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px] font-medium">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 overflow-x-auto">
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
