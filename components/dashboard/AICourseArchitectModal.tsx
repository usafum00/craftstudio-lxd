'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Layers,
  HelpCircle,
  Flame,
  Zap,
  Target,
  Wand2,
} from 'lucide-react';

interface BlueprintLesson {
  title: string;
  objective: string;
  plannedBlocks: string[];
  keyTakeaway?: string;
}

interface BlueprintData {
  title: string;
  description: string;
  targetAudience: string;
  instructionalStrategy: string;
  lessons: BlueprintLesson[];
}

interface AICourseArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICourseArchitectModal({ isOpen, onClose }: AICourseArchitectModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step state: 1 = Source & Strategy, 2 = Editable Blueprint, 3 = Compiling
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Inputs
  const [topic, setTopic] = useState('');
  const [sopText, setSopText] = useState('');
  const [targetAudience, setTargetAudience] = useState('Corporate Knowledge Workers');
  const [instructionalStrategy, setInstructionalStrategy] = useState('Tell–Show–Do Applied Practice');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Step 2 Blueprint
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [compileStatus, setCompileStatus] = useState<string>('Initializing course compilation...');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // File upload reader for SOP text
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setSopText(text);
      setUploadedFileName(file.name);
      if (!topic) {
        setTopic(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch {
      setError('Could not read file text. Please paste text directly.');
    }
  };

  // Quick prompt presets
  const applyPreset = (presetTopic: string, presetAudience: string, sampleSop: string) => {
    setTopic(presetTopic);
    setTargetAudience(presetAudience);
    setSopText(sampleSop);
    setError(null);
  };

  // Step 1 -> Step 2: Generate Blueprint
  const handleGenerateBlueprint = async () => {
    if (!topic.trim() && !sopText.trim()) {
      setError('Please provide a course topic, paste an SOP, or select a preset.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_blueprint',
          topic: topic.trim() || 'Workplace Operational Excellence',
          sopText: sopText.trim(),
          targetAudience,
          instructionalStrategy,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate LXD blueprint');
      }

      const data = await res.json();
      setBlueprint(data.data);
      setStep(2);
      window.dispatchEvent(new Event('ai_credits_updated'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Blueprint generation failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Compile Course
  const handleCompileCourse = async () => {
    if (!blueprint) return;

    try {
      setStep(3);
      setCompileStatus('Crafting Merrill-aligned interactive blocks (Accordion, Tabs, Process)...');

      // Update status messages dynamically for rich user feedback
      const timer1 = setTimeout(() => {
        setCompileStatus('Generating high-stakes workplace decision scenarios & feedback rationales...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setCompileStatus('Curating high-resolution stock photos via Wikimedia & Openverse...');
      }, 3000);

      const timer3 = setTimeout(() => {
        setCompileStatus('Committing course lessons into SQLite database...');
      }, 4500);

      const res = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compile_course',
          blueprint,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Compilation failed');
      }

      const data = await res.json();
      window.dispatchEvent(new Event('ai_credits_updated'));

      setCompileStatus('Success! Opening your interactive course in LearnByCraft Studio...');
      setTimeout(() => {
        onClose();
        if (data.data?.redirectUrl) {
          router.push(data.data.redirectUrl);
        } else if (data.data?.courseId) {
          router.push(`/courses/${data.data.courseId}`);
        }
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Compilation error');
      setStep(2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div
          style={{ backgroundColor: '#09090b', color: '#ffffff' }}
          className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white"
        >
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-white">AI Course Architect</h2>
                <span
                  style={{ backgroundColor: 'rgba(79, 70, 229, 0.25)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
                  className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full"
                >
                  LXD Co-Pilot
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {step === 1 && 'Step 1: Ground in Source Knowledge & Pedagogical Principles'}
                {step === 2 && 'Step 2: Review & Customize Observable Behavioral Blueprint'}
                {step === 3 && 'Step 3: Compiling Full Interactive Course in SQLite'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-800 text-xs font-semibold rounded-2xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 1: SOURCE GROUNDING & PEDAGOGY                             */}
          {/* ================================================================ */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Presets */}
              <div>
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Quick Workplace Topic Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        'Cyber Defense: Phishing & Vishing Triage',
                        'All Corporate Employees & Contractors',
                        'Mandatory incident response: verify sender email header, analyze unsolicited attachments, isolate workstation, and report via security add-in within 10 minutes.'
                      )
                    }
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                  >
                    🛡️ Cyber Defense Triage
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        'High-Stakes Conversations: Team Friction & De-escalation',
                        'Engineering & Product Managers',
                        'De-escalation protocol: establish psychological safety, separate impact from intent, practice reflective listening, and commit to verifiable next actions.'
                      )
                    }
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                  >
                    🤝 Conflict De-escalation
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        'Enterprise SaaS Deal Desk: Defending Margin & Pricing',
                        'Account Executives & Sales Leaders',
                        'Deal approval thresholds: multi-year discounting rules, clawback covenants, gross margin defense, and non-standard contract language approval.'
                      )
                    }
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                  >
                    💼 Enterprise Deal Desk
                  </button>
                </div>
              </div>

              {/* Course Title / Skill */}
              <div>
                <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Course Title or Target Skill</span>
                  <span className="text-[11px] text-zinc-400 font-normal">e.g. Incident Response or B2B Pricing</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Zero-Trust Cloud Architecture or Client De-escalation"
                  className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#115E59] focus:ring-2 focus:ring-[#115E59]/10"
                />
              </div>

              {/* Raw SOP or Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    Source Material / Raw SOP Text
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-[#115E59] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload .txt / .md</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {uploadedFileName && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-2 flex items-center justify-between">
                    <span>Loaded from: {uploadedFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileName(null);
                        setSopText('');
                      }}
                      className="text-rose-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
                <textarea
                  rows={4}
                  value={sopText}
                  onChange={(e) => setSopText(e.target.value)}
                  placeholder="Paste policy documentation, procedural steps, or subject matter notes here. The AI Co-Pilot extracts core procedures and converts them into interactive blocks..."
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#115E59] focus:ring-2 focus:ring-[#115E59]/10 font-sans"
                />
              </div>

              {/* Target Audience & Strategy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5 block">
                    Target Learner Role
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Frontline Customer Specialists"
                    className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#115E59]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5 block">
                    Instructional Strategy
                  </label>
                  <select
                    value={instructionalStrategy}
                    onChange={(e) => setInstructionalStrategy(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#115E59] bg-white cursor-pointer"
                  >
                    <option value="Tell–Show–Do Applied Practice">Tell–Show–Do Applied Practice (Recommended)</option>
                    <option value="Scenario-Driven Crisis Simulation">Scenario-Driven Crisis Simulation</option>
                    <option value="Rapid Microlearning Drill">Rapid Microlearning Drill (5-Min Cards)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 2: EDITABLE BLUEPRINT APPROVAL                             */}
          {/* ================================================================ */}
          {step === 2 && blueprint && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <input
                  type="text"
                  value={blueprint.title}
                  onChange={(e) => setBlueprint({ ...blueprint, title: e.target.value })}
                  className="w-full font-black text-base text-[#172B35] bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-[#115E59] focus:outline-none px-1 py-0.5"
                />
                <textarea
                  rows={2}
                  value={blueprint.description}
                  onChange={(e) => setBlueprint({ ...blueprint, description: e.target.value })}
                  className="w-full text-xs text-zinc-600 bg-transparent border border-transparent hover:border-zinc-300 focus:border-[#115E59] focus:outline-none rounded-lg p-1 resize-none"
                />
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-[#115E59]">
                    <Target className="w-3.5 h-3.5" />
                    <span>{blueprint.targetAudience}</span>
                  </span>
                  <span>•</span>
                  <span>Strategy: {blueprint.instructionalStrategy}</span>
                </div>
              </div>

              {/* Lesson Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Planned Modules & Observable Objectives ({blueprint.lessons.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...blueprint.lessons];
                      next.push({
                        title: `Module ${next.length + 1}: Applied Mastery`,
                        objective: 'Apply validated operational safeguards during high-velocity customer triage.',
                        plannedBlocks: ['statement', 'scenario', 'accordion', 'knowledge_check', 'continue'],
                      });
                      setBlueprint({ ...blueprint, lessons: next });
                    }}
                    className="text-xs font-bold text-[#115E59] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Module</span>
                  </button>
                </div>

                {blueprint.lessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-zinc-200/90 bg-white hover:border-[#115E59]/40 hover:shadow-xs transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-[#115E59]/10 text-[#115E59] font-black text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => {
                            const next = [...blueprint.lessons];
                            next[idx] = { ...next[idx], title: e.target.value };
                            setBlueprint({ ...blueprint, lessons: next });
                          }}
                          className="font-bold text-xs text-zinc-900 w-full focus:outline-none focus:border-[#115E59] border-b border-transparent"
                        />
                      </div>
                      {blueprint.lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = blueprint.lessons.filter((_, i) => i !== idx);
                            setBlueprint({ ...blueprint, lessons: next });
                          }}
                          className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                          title="Remove module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Observable Objective */}
                    <div className="text-xs">
                      <span className="text-[10px] font-bold uppercase text-[#115E59] tracking-wider block mb-0.5">
                        Observable Behavioral Objective:
                      </span>
                      <textarea
                        rows={2}
                        value={lesson.objective}
                        onChange={(e) => {
                          const next = [...blueprint.lessons];
                          next[idx] = { ...next[idx], objective: e.target.value };
                          setBlueprint({ ...blueprint, lessons: next });
                        }}
                        className="w-full text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#115E59] resize-none"
                      />
                    </div>

                    {/* Planned Block Mix */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-zinc-400 font-semibold mr-1">Blocks to compile:</span>
                      {lesson.plannedBlocks.map((blk, bI) => (
                        <span
                          key={bI}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F0] text-[#115E59] border border-[#115E59]/20 uppercase tracking-tight"
                        >
                          {blk.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 3: COMPILING COURSE (PROGRESS)                             */}
          {/* ================================================================ */}
          {step === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-[#115E59] text-[#F4B544] flex items-center justify-center shadow-xl animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="absolute -inset-1 rounded-3xl border-2 border-[#F4B544] animate-ping opacity-25 pointer-events-none" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Synthesizing Interactive Course</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">{compileStatus}</p>
              </div>
              <div className="w-64 bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#115E59] via-[#F4B544] to-[#115E59] h-full w-full animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-600">
              {step === 1 && '✨ Step 1 of 2: Blueprint Design (50 credits)'}
              {step === 2 && '⚡ Step 2 of 2: Full Course Compilation (200 credits)'}
              {step === 3 && '🚀 Writing to SQLite database...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                Back
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleGenerateBlueprint}
                disabled={loading}
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                className="btn-primary-indigo hover:opacity-95 active:scale-[0.98] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                <span className="text-white">Generate LXD Blueprint (50 Credits)</span>
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleCompileCourse}
                disabled={loading}
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                className="btn-primary-indigo hover:opacity-95 active:scale-[0.98] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4 text-white" />
                <span className="text-white">Approve & Build Interactive Course (200 Credits)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
