'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import {
  Settings,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderSync,
  Sparkles,
  BookOpen,
  Loader2,
  ExternalLink,
  Save,
  Lock,
  Unlock,
} from 'lucide-react';

export default function WorkspaceSettingsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'testing' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isResettingSample, setIsResettingSample] = useState(false);
  const [sampleResetSuccess, setSampleResetSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('lxd_admin_unlocked') === 'true');
      const handler = () => {
        setIsAdmin(localStorage.getItem('lxd_admin_unlocked') === 'true');
      };
      window.addEventListener('admin_status_changed', handler);
      return () => window.removeEventListener('admin_status_changed', handler);
    }
  }, []);

  useEffect(() => {
    // Load existing API key from localStorage if saved
    const stored = localStorage.getItem('google_ai_studio_api_key');
    if (stored) {
      setApiKey(stored);
      setSavedKey(stored);
      setKeyStatus('valid');
      setStatusMessage('Stored in browser session');
    }
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = apiKey.trim();
    if (clean) {
      localStorage.setItem('google_ai_studio_api_key', clean);
      setSavedKey(clean);
      setKeyStatus('valid');
      setStatusMessage('API Key saved successfully!');
    } else {
      localStorage.removeItem('google_ai_studio_api_key');
      setSavedKey('');
      setKeyStatus('idle');
      setStatusMessage('API Key cleared.');
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    setKeyStatus('testing');
    setStatusMessage('Validating API key with Google Generative Language API...');
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`
      );
      if (res.ok) {
        setKeyStatus('valid');
        setStatusMessage('✓ Key active and verified with Google AI Studio!');
        localStorage.setItem('google_ai_studio_api_key', apiKey.trim());
        setSavedKey(apiKey.trim());
      } else {
        const data = await res.json().catch(() => ({}));
        setKeyStatus('error');
        setStatusMessage(data?.error?.message || `Validation failed with status ${res.status}`);
      }
    } catch (err) {
      setKeyStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Network error testing API key');
    }
  };

  const handleResetSampleCourse = async () => {
    if (!confirm('Reset the "Defending Against Social Engineering" sample course to LXD v2 specification? This will update the learning outcomes, remove unverified claims, insert the Lesson 1 decision practice scenario, update the final assessment, and add the printable job aid checklist.')) {
      return;
    }

    try {
      setIsResettingSample(true);
      setSampleResetSuccess(false);
      const res = await fetch('/api/courses/reset-sample', { method: 'POST' });
      if (res.ok) {
        setSampleResetSuccess(true);
        setTimeout(() => setSampleResetSuccess(false), 5000);
      } else {
        alert('Failed to reset sample course.');
      }
    } catch (err) {
      console.error(err);
      alert('Error resetting sample course');
    } finally {
      setIsResettingSample(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#fcfcfc] text-gray-900 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <header className="h-14 px-8 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Library
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">Settings</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 max-w-4xl w-full mx-auto space-y-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Workspace & System Settings</h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage your authoring profile, Google AI Studio integration, dropzone paths, and sample course migrations.
            </p>
          </div>

          {/* SECTION 1: Author Profile */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-[#ec4899] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                MA
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Author & Workspace Profile</h2>
                <p className="text-xs text-gray-500">Default attribution stamped on created courses and SCORM manifests.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Author Name</label>
                <input
                  type="text"
                  readOnly
                  value="Mike Afurong"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Account Email</label>
                <input
                  type="text"
                  readOnly
                  value="chaelzki@gmail.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Workspace Name</label>
                <input
                  type="text"
                  readOnly
                  value="LearnByCraft Authoring Workspace"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Google One Subscription</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Google Pro Active (.flow-session)</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Google AI Studio API Key */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Google AI Studio (Gemini API) Key</h2>
                  <p className="text-xs text-gray-500">Used for direct in-app media generation and automated instructional assists.</p>
                </div>
              </div>

              {isAdmin && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  <span>Get Google API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {isAdmin ? (
              <form onSubmit={handleSaveKey} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Enter your Google AI Studio API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={!apiKey.trim() || keyStatus === 'testing'}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {keyStatus === 'testing' ? 'Testing...' : 'Test Key'}
                    </button>
                    <button
                      type="submit"
                      className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Save Key
                    </button>
                  </div>
                </div>

                {statusMessage && (
                  <div
                    className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
                      keyStatus === 'valid'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : keyStatus === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {keyStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    {keyStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                    {keyStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />}
                    <span>{statusMessage}</span>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-600 space-y-1 border border-gray-100">
                  <div className="font-semibold text-gray-800">API Tier Notice:</div>
                  <p>
                    Free-tier Google AI Studio keys include generous text limits but set image generation to 0 quota. To generate images directly via API, attach a Pay-As-You-Go billing account to your project. Otherwise, click <strong>&quot;Copy Prompt &amp; Open in Flow&quot;</strong> in any image generator to generate unlimited images via your Google One Pro subscription!
                  </p>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Google AI Studio API Key Protected</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The host author&apos;s API credentials and cloud integrations are securely locked in Public Showcase Mode. AI generation and prompt copying to Google Flow are fully operational without displaying raw credentials.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Configured &amp; active in backend environment.</span>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 3: LXD Review & Sample Course Reset */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Instructional Design (LXD) & Sample Course</h2>
                <p className="text-xs text-gray-500">Reset or re-align the seeded Cybersecurity course with LXD v2 standards.</p>
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-2">
              <p>
                The LXD v2 upgrade aligns <strong>&quot;Defending Against Social Engineering&quot;</strong> with all 9 pedagogical recommendations:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-gray-500">
                <li>Observable workplace action outcomes in course & lesson objectives</li>
                <li>Supportive security framing (replaces &quot;employees are the weakest link&quot; and unverified statistics)</li>
                <li>Interactive Scenario / Decision Practice block in Lesson 1</li>
                <li>Final Assessment with detailed Explanatory Feedback on all cues</li>
                <li>Actionable, printable Verification & Reporting Job Aid in Lesson 4</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleResetSampleCourse}
                disabled={isResettingSample}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isResettingSample ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Reset Sample Course to LXD v2</span>
              </button>

              {sampleResetSuccess && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Successfully reset and migrated to LXD v2!
                </span>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
